import { useEffect, useState } from 'react';
import { getSettings, setSfxVolume, setMusicVolume, setHapticsEnabled, playSfx } from '../game/audio.js';
import { useT } from '../i18n.js';
import { useGamepadActions } from './useGamepad.js';
import { MenuBg } from './SceneBg.jsx';

export default function Settings({ onClose }) {
  const t = useT();
  const [s, setS] = useState(() => getSettings());

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape' || e.key === 'b' || e.key === 'B' || e.key === 'Backspace') {
        e.preventDefault();
        playSfx('uipick');
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useGamepadActions({
    back: () => { playSfx('uipick'); onClose(); },
  });

  const onSfx = v => { setSfxVolume(v); setS({ ...getSettings() }); playSfx('uimove'); };
  const onMusic = v => { setMusicVolume(v); setS({ ...getSettings() }); };
  const onHaptics = v => { setHapticsEnabled(v); setS({ ...getSettings() }); playSfx('uimove'); };

  const sliderRow = (label, value, onChange, color) => (
    <div style={{ marginBottom: '1.1em' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ color: '#d8b8f0', fontSize: '0.9em', letterSpacing: 2 }}>{label}</span>
        <span style={{ color, fontSize: '0.85em', fontFamily: "'Cinzel',serif" }}>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range" min="0" max="100" step="1"
        value={Math.round(value * 100)}
        onChange={e => onChange(parseInt(e.target.value, 10) / 100)}
        style={{ width: '100%', accentColor: color }}
      />
    </div>
  );

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#030008',
      zIndex: 30, padding: '1.5em',
      overflow: 'auto',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
    }}>
      <MenuBg />
      <div style={{ position: 'relative', width: '100%', maxWidth: 540 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2em' }}>
          <div style={{
            fontFamily: "'Cinzel Decorative',serif", fontSize: '2.5em',
            color: '#c77dff', textShadow: '0 0 30px #7b2fbe',
            letterSpacing: 6,
          }}>{t('settings.title') || 'OPTIONS'}</div>
          <button
            onClick={() => { playSfx('uipick'); onClose(); }}
            style={{
              padding: '0.5em 1.4em',
              background: 'linear-gradient(135deg,#5a189a,#3c096c)',
              border: '1px solid #c77dff', color: '#e0aaff',
              fontFamily: "'Cinzel',serif", fontSize: '1em', letterSpacing: 3,
              cursor: 'pointer', borderRadius: 3,
            }}
          >← {t('settings.back') || 'RETOUR'}</button>
        </div>

        <div style={{
          background: 'rgba(8,0,22,0.78)',
          border: '1px solid rgba(199,125,255,0.35)',
          borderRadius: 6,
          padding: '1.3em 1.4em',
          boxShadow: '0 0 24px rgba(123,47,190,0.35)',
        }}>
          {sliderRow('🔊 ' + (t('settings.sfx') || 'Effets sonores'), s.sfxVolume, onSfx, '#c77dff')}
          {sliderRow('🎵 ' + (t('settings.music') || 'Musique'), s.musicVolume, onMusic, '#88ddff')}

          <div style={{ marginTop: '1.5em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#d8b8f0', fontSize: '0.9em', letterSpacing: 2 }}>📳 {t('settings.haptics') || 'Vibration mobile'}</span>
            <button
              onClick={() => onHaptics(!s.hapticsEnabled)}
              onMouseDown={e => e.preventDefault()}
              tabIndex={-1}
              style={{
                padding: '0.4em 1.1em',
                background: s.hapticsEnabled ? 'rgba(135,221,255,0.2)' : 'rgba(20,8,30,0.6)',
                border: `1px solid ${s.hapticsEnabled ? '#88ddff' : '#4a1d6a'}`,
                color: s.hapticsEnabled ? '#88ddff' : '#9d4edd',
                fontFamily: "'Cinzel',serif", fontSize: '0.85em', letterSpacing: 2,
                cursor: 'pointer', borderRadius: 4,
              }}
            >{s.hapticsEnabled ? (t('settings.on') || 'ACTIF') : (t('settings.off') || 'INACTIF')}</button>
          </div>
        </div>

        <div style={{ marginTop: '1.3em', textAlign: 'center', color: '#b69ad8', fontSize: '0.82em', letterSpacing: 2 }}>
          {t('settings.hint') || 'ÉCHAP / B pour fermer'}
        </div>
      </div>
    </div>
  );
}
