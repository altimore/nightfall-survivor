import { useEffect } from 'react';
import { SKILLS } from '../game/data.js';
import { MenuBg } from './SceneBg.jsx';
import { useGamepadActions } from './useGamepad.js';
import { useT, getLang, setLang } from '../i18n.js';
import { playSfx } from '../game/audio.js';

// Starter weapons : utility powers like 'gather' are excluded — they can't kill on their own.
const WEAPONS = ['dagger', 'sword', 'whip', 'missile', 'floating', 'grenade', 'nova', 'lightning', 'orbit', 'trail', 'traps', 'turret', 'charm', 'summon'];

export default function Menu({ onStart, weapon, onWeaponChange, uiScale, setUiScale, onOpenGuide }) {
  const t = useT();
  const lang = getLang();
  const pickWeapon = id => { if (id !== weapon) playSfx('uimove'); onWeaponChange(id); };
  const startWithSfx = () => { playSfx('uipick'); onStart(); };
  const setLangWithSfx = code => { if (code !== lang) playSfx('uimove'); setLang(code); };

  useEffect(() => {
    const onKey = e => {
      const i = WEAPONS.indexOf(weapon);
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'q') {
        e.preventDefault();
        pickWeapon(WEAPONS[(i - 1 + WEAPONS.length) % WEAPONS.length]);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        pickWeapon(WEAPONS[(i + 1) % WEAPONS.length]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startWithSfx();
      } else if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < WEAPONS.length) {
          e.preventDefault();
          pickWeapon(WEAPONS[idx]);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [weapon, onStart, onWeaponChange]);

  useGamepadActions({
    left: () => {
      const i = WEAPONS.indexOf(weapon);
      pickWeapon(WEAPONS[(i - 1 + WEAPONS.length) % WEAPONS.length]);
    },
    right: () => {
      const i = WEAPONS.indexOf(weapon);
      pickWeapon(WEAPONS[(i + 1) % WEAPONS.length]);
    },
    confirm: () => startWithSfx(),
  });

  const langBtn = (code, label) => (
    <button
      key={code}
      onClick={() => setLangWithSfx(code)}
      style={{
        padding: '0.2em 0.6em',
        background: lang === code ? 'rgba(199,125,255,0.25)' : 'transparent',
        border: `1px solid ${lang === code ? '#c77dff' : '#6c3483'}`,
        color: lang === code ? '#e0aaff' : '#b69ad8',
        cursor: 'pointer', borderRadius: 4,
        fontFamily: "'Cinzel',serif", fontSize: '0.82em', letterSpacing: 2,
      }}
    >{label}</button>
  );

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
        <div style={{ color: '#c77dff', letterSpacing: 10, fontSize: '1em', marginTop: 5, marginBottom: 8 }}>{t('menu.survivor')}</div>
        <div style={{ color: '#d8b8f0', fontSize: '1.18em', marginBottom: 24, letterSpacing: 2 }}>
          {t('menu.objective')} <strong style={{ color: '#ffe066' }}>{t('menu.goalDuration')}</strong>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ color: '#c77dff', fontSize: '0.91em', letterSpacing: 4, marginBottom: 10 }}>{t('menu.startWeapon')}</div>
          <div style={{ display: 'flex', gap: '0.7em', justifyContent: 'center', flexWrap: 'wrap' }}>
            {WEAPONS.map(id => {
              const sk = SKILLS[id];
              const active = weapon === id;
              return (
                <button
                  key={id}
                  onClick={() => pickWeapon(id)}
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
                  <div style={{ fontSize: '0.82em' }}>{t(`skills.${id}`)}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.7em', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={startWithSfx} style={{
            padding: '0.9em 2.8em',
            background: 'linear-gradient(135deg,#5a189a,#3c096c)',
            border: '1px solid #c77dff', color: '#e0aaff',
            fontFamily: "'Cinzel',serif", fontSize: '1.36em', letterSpacing: 4,
            cursor: 'pointer', borderRadius: 3,
            boxShadow: '0 0 30px rgba(123,47,190,.5)',
          }}>{t('menu.start')}</button>
          {onOpenGuide && (
            <button
              onClick={() => { playSfx('uipick'); onOpenGuide(); }}
              style={{
                padding: '0.55em 1.4em',
                background: 'transparent',
                border: '1px solid #6c3483', color: '#b69ad8',
                fontFamily: "'Cinzel',serif", fontSize: '0.95em', letterSpacing: 3,
                cursor: 'pointer', borderRadius: 3,
              }}
            >{t('compendium.open')}</button>
          )}
        </div>

        {setUiScale && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7em' }}>
            <span style={{ color: '#b69ad8', fontSize: '0.82em', letterSpacing: 2 }}>{t('menu.textSize')}</span>
            <button
              onClick={() => setUiScale(uiScale - 0.1)}
              style={{ background: 'transparent', border: '1px solid #6c3483', color: '#c77dff', cursor: 'pointer', borderRadius: 4, padding: '0.2em 0.6em', fontSize: '0.91em' }}
            >−</button>
            <input
              type="range" min="0.7" max="1.8" step="0.05"
              value={uiScale}
              onChange={e => setUiScale(parseFloat(e.target.value))}
              style={{ accentColor: '#c77dff', width: '8em' }}
            />
            <button
              onClick={() => setUiScale(uiScale + 0.1)}
              style={{ background: 'transparent', border: '1px solid #6c3483', color: '#c77dff', cursor: 'pointer', borderRadius: 4, padding: '0.2em 0.6em', fontSize: '0.91em' }}
            >+</button>
            <span style={{ color: '#d8b8f0', fontSize: '0.82em', minWidth: '3em' }}>{(uiScale * 100).toFixed(0)}%</span>
          </div>
        )}

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7em' }}>
          <span style={{ color: '#b69ad8', fontSize: '0.82em', letterSpacing: 2 }}>{t('menu.lang')}</span>
          {langBtn('fr', 'FR')}
          {langBtn('en', 'EN')}
        </div>

        <div style={{ marginTop: 12, color: '#b69ad8', fontSize: '0.91em', letterSpacing: 2 }}>
          {t('menu.controls')}
        </div>
        <div style={{ marginTop: 6, color: '#7b46c4', fontSize: '0.82em', letterSpacing: 1 }}>
          {t('menu.version')}
        </div>
      </div>
    </div>
  );
}
