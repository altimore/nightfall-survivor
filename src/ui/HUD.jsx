import { useEffect, useState } from 'react';
import { bus } from '../game/bus.js';

const fmt = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

export default function HUD({ muted, onToggleMute }) {
  const [s, setS] = useState({ hp: 100, maxHp: 100, t: 0, kills: 0, goal: 300 });

  useEffect(() => bus.on('hud:update', setS), []);

  const timeLeft = Math.max(0, s.goal - s.t);
  const danger = timeLeft < 30;

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 10px', background: 'rgba(3,0,15,.8)',
      borderBottom: '1px solid rgba(90,24,154,.3)',
    }}>
      <div style={{ width: 175 }}>
        <div style={{ fontSize: 10, color: '#ff4d6d', letterSpacing: 2, marginBottom: 3 }}>❤ {s.hp}/{s.maxHp}</div>
        <div style={{ height: 7, background: '#1a0010', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.max(0, s.hp / s.maxHp * 100)}%`,
            background: 'linear-gradient(90deg,#8b0000,#ff2244)',
            borderRadius: 4, transition: 'width .12s',
          }}/>
        </div>
      </div>
      <div style={{ textAlign: 'center', flex: 1, padding: '0 8px' }}>
        <div style={{
          fontFamily: "'Cinzel Decorative',serif", fontSize: 18,
          color: danger ? '#ff2244' : '#c77dff',
          textShadow: `0 0 ${danger ? 20 : 8}px ${danger ? '#ff0040' : '#7b2fbe'}`,
          transition: 'all .3s',
        }}>{fmt(timeLeft)}</div>
        <div style={{ fontSize: 9, color: '#7b2fbe', letterSpacing: 1 }}>
          ☠ {s.kills}
        </div>
      </div>
      <div style={{ width: 175, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onToggleMute} style={{
          background: 'transparent', border: '1px solid #3c096c',
          borderRadius: 4, color: muted ? '#4a1a6a' : '#c77dff',
          fontSize: 14, cursor: 'pointer', padding: '2px 8px',
        }}>{muted ? '🔇' : '🔊'}</button>
      </div>
    </div>
  );
}
