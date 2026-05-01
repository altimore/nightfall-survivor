import { useEffect } from 'react';
import { VictoryBg, DefeatBg } from './SceneBg.jsx';
import { useGamepadActions } from './useGamepad.js';
import { useT } from '../i18n.js';
import { playSfx } from '../game/audio.js';

const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function EndScreen({ phase, hud, onRestart, onMenu }) {
  const t = useT();
  const win = phase === 'victory';
  const restart = () => { playSfx('uipick'); onRestart(); };
  const menu = () => { playSfx('uipick'); onMenu(); };
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        restart();
      } else if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        menu();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onRestart, onMenu]);
  useGamepadActions({
    confirm: restart,
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
      <button onClick={restart} style={{
        padding: '0.85em 2.5em',
        background: win
          ? 'linear-gradient(135deg,#3c096c,#5a189a)'
          : 'linear-gradient(135deg,#8b0000,#4d0020)',
        border: `1px solid ${win ? '#c77dff' : '#ff004055'}`,
        color: win ? '#e0aaff' : '#ffaaaa',
        fontFamily: "'Cinzel',serif", fontSize: '1.27em', letterSpacing: 3,
        cursor: 'pointer', borderRadius: 3,
        boxShadow: win ? '0 0 20px rgba(199,125,255,.4)' : 'none',
        position: 'relative',
      }}>{win ? t('end.replay') : t('end.restart')}</button>
      <button onClick={menu} style={{
        marginTop: 10, padding: '0.55em 1.7em',
        background: 'transparent', border: '1px solid #6c3483',
        color: '#b69ad8', fontFamily: "'Cinzel',serif",
        fontSize: '1em', letterSpacing: 3, cursor: 'pointer', borderRadius: 3,
        position: 'relative',
      }}>{t('end.menu')}</button>
    </div>
  );
}
