import { useEffect, useState, useRef } from 'react';
import { useGamepadActions } from './useGamepad.js';
import { useT } from '../i18n.js';
import { playSfx } from '../game/audio.js';

export default function PauseMenu({ onResume, onMenu }) {
  const t = useT();
  const [selected, setSelected] = useState(0);
  const selectedRef = useRef(0);
  selectedRef.current = selected;

  const resume = () => { playSfx('uipick'); onResume(); };
  const menu = () => { playSfx('uipick'); onMenu(); };
  const actions = [resume, menu];
  const move = dir => {
    setSelected(s => {
      const n = (s + dir + actions.length) % actions.length;
      if (n !== s) playSfx('uimove');
      return n;
    });
  };

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        resume();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        move(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'z' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'q') {
        e.preventDefault();
        move(-1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        actions[selectedRef.current]();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        menu();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onResume, onMenu]);

  useGamepadActions({
    confirm: () => actions[selectedRef.current](),
    back: menu,
    up: () => move(-1),
    down: () => move(1),
  });

  const buttons = [
    { label: t('pause.resume'), onClick: resume, primary: true },
    { label: t('pause.mainMenu'), onClick: menu, primary: false },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(3,0,15,0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 28,
    }}>
      <div style={{
        fontFamily: "'Cinzel Decorative',serif",
        fontSize: '3em',
        color: '#c77dff',
        textShadow: '0 0 30px #7b2fbe, 0 0 60px #4a0a80',
        marginBottom: '1em',
        letterSpacing: 6,
      }}>{t('pause.title')}</div>
      {buttons.map((b, i) => {
        const isSel = i === selected;
        const isPrimary = b.primary;
        return (
          <button
            key={i}
            onClick={b.onClick}
            onMouseEnter={() => setSelected(s => { if (s !== i) playSfx('uimove'); return i; })}
            style={{
              padding: isPrimary ? '0.85em 2.6em' : '0.65em 2em',
              marginBottom: i < buttons.length - 1 ? 12 : 0,
              background: isPrimary ? 'linear-gradient(135deg,#5a189a,#3c096c)' : 'transparent',
              border: `1px solid ${isSel ? '#e0aaff' : (isPrimary ? '#c77dff' : '#6c3483')}`,
              color: isSel ? '#fff' : (isPrimary ? '#e0aaff' : '#b69ad8'),
              fontFamily: "'Cinzel',serif",
              fontSize: isPrimary ? '1.27em' : '1em',
              letterSpacing: isPrimary ? 4 : 3,
              cursor: 'pointer', borderRadius: 3,
              boxShadow: isSel
                ? '0 0 40px rgba(199,125,255,.7)'
                : (isPrimary ? '0 0 30px rgba(123,47,190,.5)' : 'none'),
              transition: 'all .12s',
              transform: isSel ? 'scale(1.05)' : 'scale(1)',
            }}
          >{isSel ? '▸ ' : ''}{b.label}{isSel ? ' ◂' : ''}</button>
        );
      })}
      <div style={{
        marginTop: '1.6em',
        fontSize: '0.82em', color: '#b69ad8', letterSpacing: 2,
      }}>
        {t('pause.hint')}
      </div>
    </div>
  );
}
