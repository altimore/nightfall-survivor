import { useEffect, useRef, useState } from 'react';
import { createGame, setOptions } from './game/PhaserGame.js';
import { bus } from './game/bus.js';
import { setMuted, stopMusic, startMusic } from './game/audio.js';
import HUD from './ui/HUD.jsx';
import Menu from './ui/Menu.jsx';
import EndScreen from './ui/EndScreen.jsx';
import LevelUpScreen from './ui/LevelUpScreen.jsx';
import BossTitle from './ui/BossTitle.jsx';

export default function App() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [phase, setPhase] = useState('menu'); // 'menu' | 'playing' | 'levelup' | 'dead' | 'victory'
  const [muted, setMutedUI] = useState(false);
  const [hud, setHud] = useState({ hp: 100, maxHp: 100, xp: 0, xpN: 20, lv: 1, t: 0, kills: 0, goal: 300, skills: {} });
  const [levelUp, setLevelUp] = useState({ lv: 1, choices: [] });
  const [startWeapon, setStartWeapon] = useState('dagger');
  const [bossAnnounce, setBossAnnounce] = useState(null);

  useEffect(() => bus.on('phase', setPhase), []);
  useEffect(() => bus.on('hud:update', setHud), []);
  useEffect(() => bus.on('levelup', payload => {
    setLevelUp(payload);
    setPhase('levelup');
  }), []);
  useEffect(() => bus.on('boss:appear', payload => {
    setBossAnnounce({ name: payload.name, key: Date.now() });
  }), []);

  const start = () => {
    setOptions({ startWeapon });
    if (!gameRef.current) {
      gameRef.current = createGame(containerRef.current);
    } else {
      bus.emit('game:restart');
    }
    setPhase('playing');
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
      fontSize: 'clamp(14px, 1.4vmin, 32px)',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Cinzel+Decorative:wght@700&display=swap');
        *{box-sizing:border-box} button:focus{outline:none}
        html, body, #root { width: 100%; height: 100%; }
      `}</style>

      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          background: '#060011',
          touchAction: 'none',
        }}
      />
      {phase !== 'menu' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, pointerEvents: 'auto' }}>
          <HUD muted={muted} onToggleMute={toggleMute} />
        </div>
      )}
      {bossAnnounce && phase === 'playing' && (
        <BossTitle key={bossAnnounce.key} name={bossAnnounce.name} onDone={() => setBossAnnounce(null)} />
      )}
      {phase === 'menu' && <Menu onStart={start} weapon={startWeapon} onWeaponChange={setStartWeapon} />}
      {phase === 'levelup' && (
        <LevelUpScreen lv={levelUp.lv} choices={levelUp.choices} skills={hud.skills} onPick={pickSkill} />
      )}
      {(phase === 'dead' || phase === 'victory') && (
        <EndScreen phase={phase} hud={hud} onRestart={start} onMenu={goMenu} />
      )}
    </div>
  );
}
