import { useEffect } from 'react';
import { SKILLS } from '../game/data.js';
import { MenuBg } from './SceneBg.jsx';
import { useGamepadActions } from './useGamepad.js';

const WEAPONS = ['dagger', 'sword', 'whip', 'nova', 'lightning', 'orbit', 'trail'];

export default function Menu({ onStart, weapon, onWeaponChange }) {
  useEffect(() => {
    const onKey = e => {
      const i = WEAPONS.indexOf(weapon);
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'q') {
        e.preventDefault();
        onWeaponChange(WEAPONS[(i - 1 + WEAPONS.length) % WEAPONS.length]);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        onWeaponChange(WEAPONS[(i + 1) % WEAPONS.length]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStart();
      } else if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < WEAPONS.length) {
          e.preventDefault();
          onWeaponChange(WEAPONS[idx]);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [weapon, onStart, onWeaponChange]);

  useGamepadActions({
    left: () => {
      const i = WEAPONS.indexOf(weapon);
      onWeaponChange(WEAPONS[(i - 1 + WEAPONS.length) % WEAPONS.length]);
    },
    right: () => {
      const i = WEAPONS.indexOf(weapon);
      onWeaponChange(WEAPONS[(i + 1) % WEAPONS.length]);
    },
    confirm: () => onStart(),
  });

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#030008',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 30, padding: 20, textAlign: 'center',
      overflow: 'hidden',
    }}>
      <MenuBg />
      <div style={{
        position: 'relative',
        background: 'rgba(3,0,15,0.7)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(123,47,190,0.35)',
        borderRadius: 12,
        padding: '2em 3em',
        boxShadow: '0 0 60px rgba(0,0,0,0.6)',
        textAlign: 'center',
        maxWidth: '90vw',
      }}>
      <div style={{
        fontSize: '4.2em', fontFamily: "'Cinzel Decorative',serif",
        color: '#c77dff', textShadow: '0 0 40px #7b2fbe,0 0 80px #4a0a80',
        letterSpacing: 3, lineHeight: 1,
      }}>NIGHTFALL</div>
      <div style={{ color: '#c77dff', letterSpacing: 10, fontSize: '1em', marginTop: 5, marginBottom: 8 }}>SURVIVOR</div>
      <div style={{ color: '#d8b8f0', fontSize: '1.18em', marginBottom: 24, letterSpacing: 2 }}>
        Objectif : survivre <strong style={{ color: '#ffe066' }}>5 minutes</strong>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ color: '#c77dff', fontSize: '0.91em', letterSpacing: 4, marginBottom: 10 }}>ARME DE DÉPART</div>
        <div style={{ display: 'flex', gap: '0.7em', justifyContent: 'center', flexWrap: 'wrap' }}>
          {WEAPONS.map(id => {
            const sk = SKILLS[id];
            const active = weapon === id;
            return (
              <button
                key={id}
                onClick={() => onWeaponChange(id)}
                style={{
                  padding: '0.7em 1em',
                  width: '7.5em',
                  background: active
                    ? `linear-gradient(160deg, ${sk.color}28, rgba(8,0,25,.97))`
                    : 'linear-gradient(160deg,rgba(22,6,55,.6),rgba(8,0,25,.97))',
                  border: `1px solid ${active ? sk.color : sk.color + '33'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: active ? sk.color : '#b69ad8',
                  fontFamily: "'Cinzel',serif",
                  letterSpacing: 1,
                  textAlign: 'center',
                  boxShadow: active ? `0 0 20px ${sk.color}66` : 'none',
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all .15s',
                }}
              >
                <div style={{ fontSize: '1.6em', marginBottom: 3 }}>{sk.icon}</div>
                <div style={{ fontSize: '0.82em' }}>{sk.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={onStart} style={{
        padding: '0.9em 2.8em',
        background: 'linear-gradient(135deg,#5a189a,#3c096c)',
        border: '1px solid #c77dff', color: '#e0aaff',
        fontFamily: "'Cinzel',serif", fontSize: '1.36em', letterSpacing: 4,
        cursor: 'pointer', borderRadius: 3,
        boxShadow: '0 0 30px rgba(123,47,190,.5)',
      }}>COMMENCER</button>
      <div style={{ marginTop: 16, color: '#b69ad8', fontSize: '0.91em', letterSpacing: 2 }}>
        🎮 ZQSD/WASD/Flèches · Espace = Dash · 📱 Joystick + 2ᵉ doigt = Dash
      </div>
      <div style={{ marginTop: 6, color: '#7b46c4', fontSize: '0.82em', letterSpacing: 1 }}>
        v0.4 · Phaser 4 · 7 ennemis · 8 pouvoirs · 6 items · 4 boss
      </div>
      </div>
    </div>
  );
}
