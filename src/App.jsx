import { useEffect, useRef, useState } from 'react';
import { createGame, setOptions } from './game/PhaserGame.js';
import { bus } from './game/bus.js';
import { setMuted, stopMusic, startMusic, initAudio, playSfx } from './game/audio.js';
import HUD from './ui/HUD.jsx';
import Menu from './ui/Menu.jsx';
import EndScreen from './ui/EndScreen.jsx';
import LevelUpScreen from './ui/LevelUpScreen.jsx';
import BossTitle from './ui/BossTitle.jsx';
import PauseMenu from './ui/PauseMenu.jsx';
import Compendium from './ui/Compendium.jsx';
import InventoryOverlay from './ui/InventoryOverlay.jsx';
import Shop from './ui/Shop.jsx';
import Settings from './ui/Settings.jsx';
import { useGamepadActions } from './ui/useGamepad.js';

export default function App() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [phase, setPhase] = useState('menu'); // 'menu' | 'playing' | 'levelup' | 'dead' | 'victory'
  const [muted, setMutedUI] = useState(false);
  const [hud, setHud] = useState({ hp: 100, maxHp: 100, xp: 0, xpN: 20, lv: 1, t: 0, kills: 0, goal: 300, skills: {} });
  const [levelUp, setLevelUp] = useState({ lv: 1, choices: [] });
  const [startWeapon, setStartWeapon] = useState('dagger');
  const [startMode, setStartMode] = useState('normal');
  const [character, setCharacter] = useState('vampire');
  const [biome, setBiome] = useState('cemetery');
  const [numPlayers, setNumPlayers] = useState(1);
  const [bossAnnounce, setBossAnnounce] = useState(null);
  const [runStats, setRunStats] = useState(null);
  const [achievementQueue, setAchievementQueue] = useState([]);
  const [uiScale, setUiScaleState] = useState(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('uiScale') : null;
    const n = saved ? parseFloat(saved) : 1;
    return Number.isFinite(n) && n >= 0.6 && n <= 2 ? n : 1;
  });
  const setUiScale = v => {
    const clamped = Math.max(0.6, Math.min(2, v));
    setUiScaleState(clamped);
    try { localStorage.setItem('uiScale', String(clamped)); } catch (_) {}
  };
  const audioReadyRef = useRef(false);

  useEffect(() => {
    const onGesture = () => {
      initAudio();
      audioReadyRef.current = true;
      if (phase === 'menu') startMusic('menu');
      document.removeEventListener('click', onGesture);
      document.removeEventListener('keydown', onGesture);
    };
    document.addEventListener('click', onGesture);
    document.addEventListener('keydown', onGesture);
    return () => {
      document.removeEventListener('click', onGesture);
      document.removeEventListener('keydown', onGesture);
    };
  }, []);

  useEffect(() => {
    if (phase === 'menu' && audioReadyRef.current) {
      startMusic('menu');
    }
  }, [phase]);

  useEffect(() => bus.on('phase', setPhase), []);
  useEffect(() => bus.on('hud:update', setHud), []);
  useEffect(() => bus.on('levelup', payload => {
    setLevelUp(payload);
    setPhase('levelup');
  }), []);
  useEffect(() => bus.on('boss:appear', payload => {
    setBossAnnounce({ name: payload.name, key: Date.now() });
  }), []);
  useEffect(() => bus.on('runStats', setRunStats), []);
  useEffect(() => bus.on('achievement', a => {
    playSfx('achievement');
    setAchievementQueue(q => [...q, { ...a, key: Date.now() + Math.random() }]);
  }), []);

  // Auto-dismiss the oldest toast after 4.5s
  useEffect(() => {
    if (achievementQueue.length === 0) return;
    const tid = setTimeout(() => {
      setAchievementQueue(q => q.slice(1));
    }, 4500);
    return () => clearTimeout(tid);
  }, [achievementQueue]);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape' && phase === 'playing') {
        e.preventDefault();
        bus.emit('pause:set', true);
        setPhase('paused');
        return;
      }
      if ((e.key === 'i' || e.key === 'I') && phase === 'playing') {
        e.preventDefault();
        bus.emit('pause:set', true);
        setPhase('inventory');
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  // Blur any focused control when entering gameplay so arrow-key focus traversal
  // (default browser behaviour on focused <button>s) doesn't steal movement input.
  useEffect(() => {
    if (phase === 'playing' && document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  }, [phase]);

  // Gamepad in-game shortcuts: Start = pause, Select/Back = inventory, Y = menu rapide.
  useGamepadActions({
    pause: () => {
      if (phase === 'playing') {
        bus.emit('pause:set', true);
        setPhase('paused');
      }
    },
    inventory: () => {
      if (phase === 'playing') {
        bus.emit('pause:set', true);
        setPhase('inventory');
      }
    },
  });

  const resumeFromPause = () => {
    bus.emit('pause:set', false);
    setPhase('playing');
  };

  const start = () => {
    setOptions({ startWeapon, mode: startMode, numPlayers, character, biome, daily: false });
    setRunStats(null);
    if (!gameRef.current) {
      gameRef.current = createGame(containerRef.current);
    } else {
      bus.emit('game:restart');
    }
    setPhase('playing');
  };

  const startDaily = () => {
    // Lazy import to avoid bundling impact at top
    import('./game/daily.js').then(({ getDailyConfig }) => {
      const cfg = getDailyConfig();
      setOptions({ startWeapon: cfg.weapon, mode: cfg.mode, numPlayers: 1, character: cfg.character, daily: true });
      setRunStats(null);
      if (!gameRef.current) {
        gameRef.current = createGame(containerRef.current);
      } else {
        bus.emit('game:restart');
      }
      setPhase('playing');
    });
  };

  const goMenu = () => {
    setPhase('menu');
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
      stopMusic();
    }
  };

  const toggleMute = () => {
    const m = !muted;
    setMutedUI(m);
    setMuted(m);
    if (m) stopMusic();
    else if (phase === 'playing') startMusic();
  };

  const pickSkill = id => {
    bus.emit('skill:pick', id);
    setPhase('playing');
  };

  return (
    <div style={{
      fontFamily: "'Cinzel',serif",
      background: '#030008',
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      fontSize: `clamp(${(14 * uiScale).toFixed(1)}px, ${(1.4 * uiScale).toFixed(2)}vmin, ${(32 * uiScale).toFixed(0)}px)`,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Cinzel+Decorative:wght@700&display=swap');
        *{box-sizing:border-box} button:focus{outline:none}
        button, input, select, textarea { font: inherit; color: inherit; }
        html, body, #root { width: 100%; height: 100%; }
      `}</style>

      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          background: '#060011',
          touchAction: 'none',
          pointerEvents: phase === 'playing' ? 'auto' : 'none',
        }}
      />
      {phase !== 'menu' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, pointerEvents: 'none' }}>
          <HUD muted={muted} onToggleMute={toggleMute} />
        </div>
      )}
      {bossAnnounce && phase === 'playing' && (
        <BossTitle key={bossAnnounce.key} name={bossAnnounce.name} onDone={() => setBossAnnounce(null)} />
      )}
      {phase === 'menu' && <Menu onStart={start} onStartDaily={startDaily} weapon={startWeapon} onWeaponChange={setStartWeapon} mode={startMode} onModeChange={setStartMode} numPlayers={numPlayers} onNumPlayersChange={setNumPlayers} character={character} onCharacterChange={setCharacter} biome={biome} onBiomeChange={setBiome} uiScale={uiScale} setUiScale={setUiScale} onOpenGuide={() => setPhase('compendium')} onOpenShop={() => setPhase('shop')} onOpenSettings={() => setPhase('settings')} />}
      {phase === 'compendium' && <Compendium onClose={() => setPhase('menu')} />}
      {phase === 'shop' && <Shop onClose={() => setPhase('menu')} />}
      {phase === 'settings' && <Settings onClose={() => setPhase('menu')} />}
      {phase === 'levelup' && (
        <LevelUpScreen
          lv={levelUp.lv}
          choices={levelUp.choices}
          skills={hud.skills}
          rerollsLeft={levelUp.rerollsLeft}
          banishesLeft={levelUp.banishesLeft}
          onPick={pickSkill}
        />
      )}
      {phase === 'paused' && (
        <PauseMenu onResume={resumeFromPause} onMenu={goMenu} />
      )}
      {phase === 'inventory' && (
        <InventoryOverlay hud={hud} onClose={resumeFromPause} />
      )}
      {(phase === 'dead' || phase === 'victory') && (
        <EndScreen phase={phase} hud={hud} runStats={runStats} onRestart={start} onMenu={goMenu} />
      )}
      {achievementQueue.length > 0 && (
        <div style={{
          position: 'absolute', right: 14, bottom: 14, zIndex: 35,
          display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
        }}>
          {achievementQueue.slice(0, 3).map((a, i) => (
            <div key={a.key} style={{
              minWidth: '15em', maxWidth: '20em',
              padding: '0.7em 1em',
              background: 'linear-gradient(135deg,rgba(60,40,5,0.95),rgba(20,12,2,0.95))',
              border: '1px solid #ffd966',
              borderRadius: 6,
              boxShadow: '0 0 22px rgba(255,217,102,0.45)',
              color: '#ffd966',
              animation: i === 0 ? 'achievSlide 0.35s ease-out' : 'none',
            }}>
              <div style={{ fontSize: '0.78em', letterSpacing: 3, color: '#ffd966', marginBottom: 3 }}>✦ SUCCÈS DÉBLOQUÉ</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                <span style={{ fontSize: '1.7em' }}>{a.icon}</span>
                <div>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: '1em', letterSpacing: 1 }}>{a.name}</div>
                  <div style={{ fontSize: '0.78em', color: '#d8b8a4' }}>{a.desc}</div>
                </div>
              </div>
            </div>
          ))}
          <style>{`@keyframes achievSlide { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        </div>
      )}
    </div>
  );
}
