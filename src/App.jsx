import { useEffect, useRef, useState } from 'react';
import { createGame } from './game/PhaserGame.js';
import { bus } from './game/bus.js';
import { setMuted, isMuted, stopMusic, startMusic } from './game/audio.js';
import HUD from './ui/HUD.jsx';
import Menu from './ui/Menu.jsx';
import EndScreen from './ui/EndScreen.jsx';

export default function App() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [phase, setPhase] = useState('menu'); // 'menu' | 'playing' | 'dead' | 'victory'
  const [muted, setMutedUI] = useState(false);
  const [hud, setHud] = useState({ hp: 100, maxHp: 100, t: 0, kills: 0, goal: 300 });

  useEffect(() => bus.on('phase', setPhase), []);
  useEffect(() => bus.on('hud:update', setHud), []);

  const start = () => {
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

  return (
    <div style={{
      fontFamily: "'Cinzel',serif",
      background: '#030008',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Cinzel+Decorative:wght@700&display=swap');
        *{box-sizing:border-box} button:focus{outline:none}
        html, body, #root { width: 100%; height: 100%; }
      `}</style>

      {phase !== 'menu' && <HUD muted={muted} onToggleMute={toggleMute} />}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          width: '100%',
          background: '#060011',
          touchAction: 'none',
          minHeight: 0,
        }}
      />
      {phase === 'menu' && <Menu onStart={start} />}
      {(phase === 'dead' || phase === 'victory') && (
        <EndScreen phase={phase} hud={hud} onRestart={start} onMenu={goMenu} />
      )}
    </div>
  );
}
