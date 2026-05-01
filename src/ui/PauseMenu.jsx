import { useEffect } from 'react';
import { useGamepadActions } from './useGamepad.js';
import { useT } from '../i18n.js';
import { playSfx } from '../game/audio.js';

export default function PauseMenu({ onResume, onMenu }) {
  const t = useT();
  const resume = () => { playSfx('uipick'); onResume(); };
  const menu = () => { playSfx('uipick'); onMenu(); };
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        resume();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        menu();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onResume, onMenu]);

  useGamepadActions({
    confirm: resume,
    back: menu,
  });

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
      <button
        onClick={resume}
        style={{
          padding: '0.85em 2.6em', marginBottom: 12,
          background: 'linear-gradient(135deg,#5a189a,#3c096c)',
          border: '1px solid #c77dff', color: '#e0aaff',
          fontFamily: "'Cinzel',serif", fontSize: '1.27em', letterSpacing: 4,
          cursor: 'pointer', borderRadius: 3,
          boxShadow: '0 0 30px rgba(123,47,190,.5)',
        }}
      >{t('pause.resume')}</button>
      <button
        onClick={menu}
        style={{
          padding: '0.65em 2em',
          background: 'transparent',
          border: '1px solid #6c3483', color: '#b69ad8',
          fontFamily: "'Cinzel',serif", fontSize: '1em', letterSpacing: 3,
          cursor: 'pointer', borderRadius: 3,
        }}
      >{t('pause.mainMenu')}</button>
      <div style={{
        marginTop: '1.6em',
        fontSize: '0.82em', color: '#b69ad8', letterSpacing: 2,
      }}>
        {t('pause.hint')}
      </div>
    </div>
  );
}
