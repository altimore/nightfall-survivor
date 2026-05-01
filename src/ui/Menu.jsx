import { useEffect } from 'react';
import { SKILLS, MODES, BIOMES, BIOME_LIST } from '../game/data.js';
import { CHARACTERS, CHARACTER_LIST } from '../game/characters.js';
import { getDailyConfig, loadDailyState } from '../game/daily.js';
import { MenuBg } from './SceneBg.jsx';
import { useGamepadActions } from './useGamepad.js';
import { useT, getLang, setLang } from '../i18n.js';
import { playSfx } from '../game/audio.js';

// Starter weapons : utility powers like 'gather' are excluded — they can't kill on their own.
const WEAPONS = ['dagger', 'sword', 'whip', 'bow', 'boomerang', 'missile', 'floating', 'grenade', 'flamethrower', 'cloud', 'nova', 'lightning', 'chargedBolt', 'iceRing', 'orbit', 'trail', 'traps', 'turret', 'charm', 'summon'];

export default function Menu({ onStart, onStartDaily, weapon, onWeaponChange, mode, onModeChange, numPlayers, onNumPlayersChange, character, onCharacterChange, biome, onBiomeChange, uiScale, setUiScale, onOpenGuide, onOpenShop }) {
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
        padding: 'clamp(0.8em, 2vh, 2em) clamp(1em, 3vw, 3em)',
        boxShadow: '0 0 60px rgba(0,0,0,0.6)',
        textAlign: 'center',
        maxWidth: '96vw',
        maxHeight: '94vh',
        overflowY: 'auto',
      }}>
        <div style={{
          fontSize: 'clamp(2.4em, 9vw, 4.2em)', fontFamily: "'Cinzel Decorative',serif",
          color: '#c77dff', textShadow: '0 0 40px #7b2fbe,0 0 80px #4a0a80',
          letterSpacing: 3, lineHeight: 1,
        }}>NIGHTFALL</div>
        <div style={{ color: '#c77dff', letterSpacing: 10, fontSize: '1em', marginTop: 5, marginBottom: 8 }}>{t('menu.survivor')}</div>
        <div style={{ color: '#d8b8f0', fontSize: '1.18em', marginBottom: 24, letterSpacing: 2 }}>
          {t('menu.objective')} <strong style={{ color: '#ffe066' }}>{t('menu.goalDuration')}</strong>
        </div>

        {onCharacterChange && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ color: '#c77dff', fontSize: '0.91em', letterSpacing: 4, marginBottom: 10 }}>{t('menu.character') || 'PERSONNAGE'}</div>
            <div style={{ display: 'flex', gap: '0.4em', justifyContent: 'center', flexWrap: 'wrap' }}>
              {CHARACTER_LIST.map(id => {
                const ch = CHARACTERS[id];
                const active = character === id;
                return (
                  <button
                    key={id}
                    onClick={() => { if (id !== character) playSfx('uimove'); onCharacterChange(id); }}
                    onMouseDown={e => e.preventDefault()}
                    tabIndex={-1}
                    title={ch.desc}
                    style={{
                      padding: '0.45em 0.7em',
                      background: active ? `${ch.color}22` : 'rgba(8,0,22,0.6)',
                      border: `1px solid ${active ? ch.color : '#4a1d6a'}`,
                      color: active ? ch.color : '#9d4edd',
                      fontFamily: "'Cinzel',serif", fontSize: '0.85em', letterSpacing: 1,
                      cursor: 'pointer', borderRadius: 4,
                      boxShadow: active ? `0 0 14px ${ch.color}66` : 'none',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15em',
                      minWidth: '5.5em',
                    }}
                  >
                    <span style={{ fontSize: '1.45em' }}>{ch.icon}</span>
                    <span>{ch.name}</span>
                  </button>
                );
              })}
            </div>
            {character && CHARACTERS[character]?.desc && (
              <div style={{ color: '#b89ec4', fontSize: '0.78em', marginTop: 6, letterSpacing: 1, textAlign: 'center' }}>
                {CHARACTERS[character].desc}
              </div>
            )}
          </div>
        )}

        {onBiomeChange && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ color: '#c77dff', fontSize: '0.91em', letterSpacing: 4, marginBottom: 10 }}>{t('menu.biome') || 'BIOME'}</div>
            <div style={{ display: 'flex', gap: '0.4em', justifyContent: 'center', flexWrap: 'wrap' }}>
              {BIOME_LIST.map(id => {
                const b = BIOMES[id];
                const active = biome === id;
                const accentHex = `#${b.accent.toString(16).padStart(6, '0')}`;
                return (
                  <button
                    key={id}
                    onClick={() => { if (id !== biome) playSfx('uimove'); onBiomeChange(id); }}
                    onMouseDown={e => e.preventDefault()}
                    tabIndex={-1}
                    style={{
                      padding: '0.45em 0.75em',
                      background: active ? `${accentHex}33` : 'rgba(8,0,22,0.6)',
                      border: `1px solid ${active ? accentHex : '#4a1d6a'}`,
                      color: active ? accentHex : '#9d4edd',
                      fontFamily: "'Cinzel',serif", fontSize: '0.85em', letterSpacing: 1,
                      cursor: 'pointer', borderRadius: 4,
                      boxShadow: active ? `0 0 14px ${accentHex}55` : 'none',
                      display: 'flex', alignItems: 'center', gap: '0.3em',
                    }}
                  >
                    <span style={{ fontSize: '1.2em' }}>{b.icon}</span>
                    <span>{b.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
                    padding: '0.5em 0.7em',
                    flex: '1 1 6em',
                    minWidth: '5.5em',
                    maxWidth: '8em',
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

        <div style={{ marginBottom: 18 }}>
          <div style={{ color: '#c77dff', fontSize: '0.91em', letterSpacing: 4, marginBottom: 10 }}>{t('modes.label')}</div>
          <div style={{ display: 'flex', gap: '0.5em', justifyContent: 'center', flexWrap: 'wrap' }}>
            {MODES.map(id => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  onClick={() => { if (id !== mode) playSfx('uimove'); onModeChange(id); }}
                  title={t(`modes.${id}.desc`)}
                  style={{
                    padding: '0.5em 0.9em',
                    background: active ? 'rgba(199,125,255,0.2)' : 'transparent',
                    border: `1px solid ${active ? '#c77dff' : '#6c3483'}`,
                    color: active ? '#e0aaff' : '#b69ad8',
                    fontFamily: "'Cinzel',serif",
                    fontSize: '0.91em', letterSpacing: 2,
                    cursor: 'pointer', borderRadius: 4,
                    boxShadow: active ? '0 0 14px rgba(199,125,255,0.45)' : 'none',
                  }}
                >{t(`modes.${id}.name`)}</button>
              );
            })}
          </div>
          <div style={{ color: '#9d6dd0', fontSize: '0.78em', marginTop: 6, letterSpacing: 1 }}>
            {t(`modes.${mode}.desc`)}
          </div>
        </div>

        {onNumPlayersChange && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ color: '#c77dff', fontSize: '0.91em', letterSpacing: 4, marginBottom: 10 }}>{t('players.label')}</div>
            <div style={{ display: 'flex', gap: '0.5em', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4].map(n => {
                const active = numPlayers === n;
                const label = n === 1 ? t('players.solo')
                            : n === 2 ? t('players.duo')
                            : n === 3 ? (t('players.trio') || `Trio (3 joueurs)`)
                            : (t('players.quad') || `Quatuor (4 joueurs)`);
                return (
                  <button
                    key={n}
                    onClick={() => { if (n !== numPlayers) playSfx('uimove'); onNumPlayersChange(n); }}
                    style={{
                      padding: '0.5em 1em',
                      background: active ? 'rgba(199,125,255,0.2)' : 'transparent',
                      border: `1px solid ${active ? '#c77dff' : '#6c3483'}`,
                      color: active ? '#e0aaff' : '#b69ad8',
                      fontFamily: "'Cinzel',serif", fontSize: '0.91em', letterSpacing: 2,
                      cursor: 'pointer', borderRadius: 4,
                      boxShadow: active ? '0 0 14px rgba(199,125,255,0.45)' : 'none',
                    }}
                  >{label}</button>
                );
              })}
            </div>
            {numPlayers >= 2 && (
              <div style={{ color: '#9d6dd0', fontSize: '0.78em', marginTop: 6, letterSpacing: 1 }}>
                {numPlayers === 2 ? t('players.duoHint')
                 : numPlayers === 3 ? (t('players.trioHint') || 'P1 : WASD · P2 : Flèches · P3 : Manette 1')
                 : (t('players.quadHint') || 'P1 : WASD · P2 : Flèches · P3 : Manette 1 · P4 : Manette 2')}
              </div>
            )}
          </div>
        )}

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
          {onOpenShop && (
            <button
              onClick={() => { playSfx('uipick'); onOpenShop(); }}
              style={{
                padding: '0.55em 1.4em',
                background: 'transparent',
                border: '1px solid #ffd96666', color: '#ffd966',
                fontFamily: "'Cinzel',serif", fontSize: '0.95em', letterSpacing: 3,
                cursor: 'pointer', borderRadius: 3,
              }}
            >💰 {t('shop.open') || 'BOUTIQUE'}</button>
          )}
          {onStartDaily && <DailyButton onStartDaily={onStartDaily} t={t} />}
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

function DailyButton({ onStartDaily, t }) {
  const cfg = getDailyConfig();
  const dailyState = loadDailyState();
  const best = dailyState.date === cfg.date ? dailyState.best : null;
  const ch = CHARACTERS[cfg.character];
  const sk = SKILLS[cfg.weapon];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <button
        onClick={() => { playSfx("uipick"); onStartDaily(); }}
        onMouseDown={e => e.preventDefault()}
        tabIndex={-1}
        style={{
          padding: "0.55em 1.4em",
          background: "linear-gradient(135deg,#5a1a8a,#3a0a5a)",
          border: "1px solid #c77dff", color: "#e0aaff",
          fontFamily: "'Cinzel',serif", fontSize: "0.95em", letterSpacing: 3,
          cursor: "pointer", borderRadius: 3,
          boxShadow: "0 0 18px rgba(199,125,255,0.4)",
        }}
      >🗓 {t("menu.daily") || "DÉFI DU JOUR"}</button>
      <div style={{ color: "#9d6dd0", fontSize: "0.7em", letterSpacing: 1, textAlign: "center" }}>
        {ch?.icon} {ch?.name} · {sk?.icon} {sk?.name} · {t(`modes.${cfg.mode}.name`) || cfg.mode}
        {best && <span style={{ marginLeft: "0.5em", color: "#ffd966" }}>· best {best.score}</span>}
      </div>
    </div>
  );
}
