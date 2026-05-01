import { useEffect, useState } from 'react';
import { VictoryBg, DefeatBg } from './SceneBg.jsx';
import { useGamepadActions } from './useGamepad.js';
import { useT } from '../i18n.js';
import { playSfx } from '../game/audio.js';

const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function EndScreen({ phase, hud, onRestart, onMenu }) {
  const t = useT();
  const win = phase === 'victory';
  const [sel, setSel] = useState(0); // 0 = restart, 1 = menu
  const restart = () => { playSfx('uipick'); onRestart(); };
  const menu = () => { playSfx('uipick'); onMenu(); };
  const moveSel = delta => setSel(s => {
    const n = (s + delta + 2) % 2;
    if (n !== s) playSfx('uimove');
    return n;
  });
  const confirmSel = () => (sel === 0 ? restart() : menu());

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        confirmSel();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'w' || e.key === 'a' || e.key === 'q') {
        e.preventDefault();
        moveSel(-1);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 's' || e.key === 'd') {
        e.preventDefault();
        moveSel(1);
      } else if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        menu();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel]);

  useGamepadActions({
    up: () => moveSel(-1),
    down: () => moveSel(1),
    left: () => moveSel(-1),
    right: () => moveSel(1),
    confirm: confirmSel,
    back: menu,
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
      {win ? <VictoryBg /> : <DefeatBg />}
      <div style={{
        fontFamily: "'Cinzel Decorative',serif",
        fontSize: '3.8em',
        color: win ? '#ffe066' : '#ff0040',
        textShadow: win ? '0 0 40px #ffb300,0 0 80px #ff8800' : '0 0 40px #8b0000',
        marginBottom: 6,
        position: 'relative',
      }}>{win ? t('end.victory') : t('end.defeat')}</div>
      <div style={{ color: '#c77dff', letterSpacing: 2, fontSize: '1.18em', marginBottom: 6, position: 'relative' }}>
        {win ? t('end.survived') : `${fmt(hud.t || 0)} / ${fmt(hud.goal || 300)}`}
      </div>
      <div style={{ color: '#9d4edd', fontSize: '1.1em', marginBottom: 24, position: 'relative' }}>
        ☠ {hud.kills || 0} {t('end.kills')}
      </div>
      <button
        onClick={restart}
        onMouseEnter={() => setSel(0)}
        style={{
          padding: '0.85em 2.5em',
          background: win
            ? 'linear-gradient(135deg,#3c096c,#5a189a)'
            : 'linear-gradient(135deg,#8b0000,#4d0020)',
          border: `1px solid ${sel === 0 ? (win ? '#c77dff' : '#ff6688') : (win ? '#c77dff66' : '#ff004055')}`,
          color: win ? '#e0aaff' : '#ffaaaa',
          fontFamily: "'Cinzel',serif", fontSize: '1.27em', letterSpacing: 3,
          cursor: 'pointer', borderRadius: 3,
          boxShadow: sel === 0
            ? (win ? '0 0 30px rgba(199,125,255,.7)' : '0 0 26px rgba(255,68,68,.6)')
            : (win ? '0 0 18px rgba(199,125,255,.3)' : 'none'),
          transform: sel === 0 ? 'scale(1.04)' : 'scale(1)',
          transition: 'all .15s',
          position: 'relative',
        }}>{win ? t('end.replay') : t('end.restart')}</button>
      <button
        onClick={menu}
        onMouseEnter={() => setSel(1)}
        style={{
          marginTop: 10, padding: '0.55em 1.7em',
          background: sel === 1 ? 'rgba(199,125,255,0.12)' : 'transparent',
          border: `1px solid ${sel === 1 ? '#c77dff' : '#6c3483'}`,
          color: sel === 1 ? '#e0aaff' : '#b69ad8',
          fontFamily: "'Cinzel',serif",
          fontSize: '1em', letterSpacing: 3, cursor: 'pointer', borderRadius: 3,
          boxShadow: sel === 1 ? '0 0 18px rgba(199,125,255,.4)' : 'none',
          transform: sel === 1 ? 'scale(1.04)' : 'scale(1)',
          transition: 'all .15s',
          position: 'relative',
        }}>{t('end.menu')}</button>
    </div>
  );
}
