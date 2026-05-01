import { useEffect, useRef, useState } from 'react';
import { SKILLS } from '../game/data.js';
import { useGamepadActions } from './useGamepad.js';

const AUTO_PICK_S = 10;

export default function LevelUpScreen({ lv, choices, skills, onPick }) {
  const [remaining, setRemaining] = useState(AUTO_PICK_S);
  const [selected, setSelected] = useState(0);
  const pickedRef = useRef(false);
  const choicesRef = useRef(choices);
  const selectedRef = useRef(0);
  choicesRef.current = choices;
  selectedRef.current = selected;

  const pick = id => {
    if (pickedRef.current) return;
    pickedRef.current = true;
    onPick(id);
  };

  useEffect(() => {
    pickedRef.current = false;
    setRemaining(AUTO_PICK_S);
    setSelected(0);
    const start = performance.now();
    let rafId;
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const left = Math.max(0, AUTO_PICK_S - elapsed);
      setRemaining(left);
      if (left <= 0) {
        const id = choicesRef.current[selectedRef.current];
        if (id) pick(id);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [choices]);

  useEffect(() => {
    const onKey = e => {
      const n = choicesRef.current.length;
      if (!n) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'q') {
        e.preventDefault();
        setSelected(s => (s - 1 + n) % n);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        setSelected(s => (s + 1) % n);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = choicesRef.current[selectedRef.current];
        if (id) pick(id);
      } else if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < n) {
          e.preventDefault();
          const id = choicesRef.current[idx];
          if (id) pick(id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useGamepadActions({
    left: () => {
      const n = choicesRef.current.length;
      if (n) setSelected(s => (s - 1 + n) % n);
    },
    right: () => {
      const n = choicesRef.current.length;
      if (n) setSelected(s => (s + 1) % n);
    },
    confirm: () => {
      const id = choicesRef.current[selectedRef.current];
      if (id) pick(id);
    },
  });

  const pct = Math.max(0, Math.min(1, remaining / AUTO_PICK_S));
  const danger = remaining < 3;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(3,0,15,.9)',
      backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 25, padding: '20px 10px',
    }}>
      <div style={{ fontSize: '0.91em', letterSpacing: 9, color: '#7b2fbe', marginBottom: 4 }}>NIVEAU {lv}</div>
      <div style={{
        fontFamily: "'Cinzel Decorative',serif", fontSize: '1.9em',
        color: '#c77dff', textShadow: '0 0 20px #7b2fbe', marginBottom: 14,
      }}>Choisir un Pouvoir</div>

      <div style={{ width: '25em', maxWidth: '90vw', marginBottom: 20 }}>
        <div style={{
          fontSize: '0.82em', letterSpacing: 2, textAlign: 'center', marginBottom: 4,
          color: danger ? '#ff4d6d' : '#9d4edd',
        }}>
          AUTO · {remaining.toFixed(1)}s
        </div>
        <div style={{ height: 4, background: '#0a0020', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct * 100}%`,
            background: danger
              ? 'linear-gradient(90deg,#8b0000,#ff2244)'
              : 'linear-gradient(90deg,#5a189a,#c77dff)',
            transition: 'width .08s linear',
          }}/>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.1em', flexWrap: 'wrap', justifyContent: 'center' }}>
        {choices.map((id, i) => {
          const sk = SKILLS[id];
          const curLv = skills?.[id] || 0;
          const nLv = curLv + 1;
          const isSelected = i === selected;
          return (
            <div
              key={id}
              onClick={() => pick(id)}
              onMouseEnter={() => setSelected(i)}
              style={{
                width: '14.5em',
                padding: '1.3em 1em',
                background: 'linear-gradient(160deg,rgba(22,6,55,.97),rgba(8,0,25,.97))',
                border: `1px solid ${isSelected ? sk.color : sk.color + '55'}`,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'transform .18s, box-shadow .18s',
                boxShadow: isSelected ? `0 0 28px ${sk.color}88` : `0 0 15px ${sk.color}18`,
                transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute', top: '-0.9em', left: '50%', transform: 'translateX(-50%)',
                  background: sk.color, color: '#030008',
                  fontSize: '0.82em', letterSpacing: 2, padding: '0.18em 0.7em',
                  borderRadius: 10,
                }}>↵</div>
              )}
              <div style={{ fontSize: '2.5em', marginBottom: 7 }}>{sk.icon}</div>
              <div style={{ color: sk.color, fontSize: '1em', letterSpacing: 1, marginBottom: 5 }}>{sk.name}</div>
              {curLv > 0 ? (
                <div style={{ marginBottom: 5 }}>
                  <span style={{ color: `${sk.color}50`, fontSize: '1em' }}>{'●'.repeat(curLv)}</span>
                  <span style={{ color: sk.color, fontSize: '1em' }}>{'○'.repeat(sk.max - curLv)}</span>
                  <span style={{ color: `${sk.color}80`, fontSize: '0.91em' }}> →{nLv}</span>
                </div>
              ) : (
                <div style={{ color: '#6a3a8a', fontSize: '0.82em', letterSpacing: 2, marginBottom: 5 }}>✦ NOUVEAU</div>
              )}
              <div style={{ color: '#b89ec4', fontSize: '0.91em', lineHeight: 1.6 }}>{sk.desc[nLv - 1]}</div>
              <div style={{
                marginTop: 10, fontSize: '0.82em', letterSpacing: 2,
                color: `${sk.color}aa`,
                border: `1px solid ${sk.color}28`,
                borderRadius: 20, padding: '0.18em 0.7em',
                display: 'inline-block',
              }}>{sk.type === 'weapon' ? '⚔ ARME' : '🛡 PASSIF'}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 18, color: '#4a1a6a', fontSize: '0.82em', letterSpacing: 2 }}>
        ← → pour choisir · ↵ / ESPACE pour valider · 1-3 raccourci
      </div>
    </div>
  );
}
