import { useEffect, useState } from 'react';
import { META_UPGRADES, getMetaState, buyUpgrade, resetMeta } from '../game/meta.js';
import { ACHIEVEMENTS, getUnlockedSet } from '../game/achievements.js';
import { useT } from '../i18n.js';
import { useGamepadActions } from './useGamepad.js';
import { playSfx } from '../game/audio.js';
import { MenuBg } from './SceneBg.jsx';

export default function Shop({ onClose }) {
  const t = useT();
  const [state, setState] = useState(() => getMetaState());

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

  const buy = id => {
    const r = buyUpgrade(id);
    if (r.ok) {
      playSfx('uipick');
      setState(getMetaState());
    } else {
      playSfx('hit');
    }
  };

  const entries = Object.entries(META_UPGRADES);

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
      <div style={{ position: 'relative', width: '100%', maxWidth: 980 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1em', flexWrap: 'wrap', gap: '0.5em' }}>
          <div style={{
            fontFamily: "'Cinzel Decorative',serif", fontSize: '2.5em',
            color: '#ffd966', textShadow: '0 0 30px #b88a00',
            letterSpacing: 6,
          }}>{t('shop.title') || 'BOUTIQUE'}</div>
          <div style={{
            fontSize: '1.2em', color: '#ffd966',
            background: 'rgba(40,28,4,0.7)',
            border: '1px solid #ffd96655',
            padding: '0.4em 1em', borderRadius: 4,
            letterSpacing: 3,
          }}>💰 {state.gold}</div>
          <button
            onClick={() => { playSfx('uipick'); onClose(); }}
            style={{
              padding: '0.5em 1.4em',
              background: 'linear-gradient(135deg,#5a189a,#3c096c)',
              border: '1px solid #c77dff', color: '#e0aaff',
              fontFamily: "'Cinzel',serif", fontSize: '1em', letterSpacing: 3,
              cursor: 'pointer', borderRadius: 3,
            }}
          >← {t('shop.back') || 'RETOUR'}</button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(18em, 1fr))',
          gap: '0.8em',
        }}>
          {entries.map(([id, def]) => {
            const lv = state.upgrades?.[id] || 0;
            const max = def.cost.length;
            const nextCost = lv < max ? def.cost[lv] : null;
            const canAfford = nextCost !== null && state.gold >= nextCost;
            const maxed = lv >= max;
            return (
              <div key={id} style={{
                background: maxed ? 'rgba(40,32,8,0.7)' : 'rgba(8,0,22,0.85)',
                border: `1px solid ${maxed ? '#ffd96688' : '#5a189a55'}`,
                borderRadius: 6,
                padding: '0.85em 1em',
                boxShadow: maxed ? '0 0 16px rgba(255,217,102,0.25)' : '0 0 10px rgba(123,47,190,0.18)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55em', marginBottom: '0.45em' }}>
                  <span style={{ fontSize: '1.6em' }}>{def.icon}</span>
                  <span style={{ color: maxed ? '#ffd966' : '#c77dff', fontSize: '1em', letterSpacing: 1, flex: 1 }}>{def.name}</span>
                  <span style={{
                    fontSize: '0.78em', color: '#9d4edd', letterSpacing: 2,
                  }}>{lv}/{max}</span>
                </div>
                <div style={{ color: '#b89ec4', fontSize: '0.85em', marginBottom: '0.55em', minHeight: '2.5em' }}>{def.desc}</div>
                <div style={{ display: 'flex', gap: '0.3em', marginBottom: '0.6em' }}>
                  {def.cost.map((_, i) => (
                    <div key={i} style={{
                      flex: 1, height: 4,
                      background: i < lv ? '#ffd966' : '#2a1a45',
                      borderRadius: 2,
                    }}/>
                  ))}
                </div>
                {maxed ? (
                  <div style={{
                    textAlign: 'center', color: '#ffd966',
                    fontSize: '0.85em', letterSpacing: 3,
                    padding: '0.45em 0',
                  }}>✦ MAX ✦</div>
                ) : (
                  <button
                    onClick={() => buy(id)}
                    onMouseDown={e => e.preventDefault()}
                    disabled={!canAfford}
                    style={{
                      width: '100%',
                      padding: '0.45em 0.9em',
                      background: canAfford ? 'linear-gradient(135deg,#5a4a0a,#2a2208)' : 'rgba(20,15,5,0.6)',
                      border: `1px solid ${canAfford ? '#ffd966' : '#5a4a2a55'}`,
                      color: canAfford ? '#ffd966' : '#7a6a3a',
                      fontFamily: "'Cinzel',serif", fontSize: '0.9em', letterSpacing: 2,
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      borderRadius: 4,
                    }}
                  >💰 {nextCost}</button>
                )}
              </div>
            );
          })}
        </div>

        <GlobalStatsPanel state={state} />
        <AchievementsPanel />

        <div style={{ marginTop: '1em', textAlign: 'center' }}>
          <button
            onClick={() => {
              if (confirm('Réinitialiser TOUTE la méta-progression ? (or + upgrades + stats globales)')) {
                resetMeta();
                setState(getMetaState());
                playSfx('hit');
              }
            }}
            onMouseDown={e => e.preventDefault()}
            tabIndex={-1}
            style={{
              padding: '0.4em 1em',
              background: 'transparent',
              border: '1px solid #6c3483aa',
              color: '#9d4edd',
              fontFamily: "'Cinzel',serif", fontSize: '0.78em', letterSpacing: 2,
              cursor: 'pointer', borderRadius: 3,
              opacity: 0.7,
            }}
          >🗑 RESET MÉTA</button>
        </div>

        <div style={{ marginTop: '0.8em', textAlign: 'center', color: '#b69ad8', fontSize: '0.82em', letterSpacing: 2 }}>
          {t('shop.hint') || 'L\'or se gagne en tuant des ennemis · ÉCHAP / B pour fermer'}
        </div>
      </div>
    </div>
  );
}

function AchievementsPanel() {
  const unlocked = getUnlockedSet();
  const entries = Object.entries(ACHIEVEMENTS);
  const total = entries.length;
  const got = entries.filter(([id]) => unlocked.has(id)).length;
  return (
    <div style={{
      marginTop: '1em',
      background: 'rgba(8,0,22,0.78)',
      border: '1px solid rgba(255,217,102,0.35)',
      borderRadius: 6,
      padding: '0.9em 1.1em',
    }}>
      <div style={{
        color: '#ffd966', fontSize: '0.91em', letterSpacing: 4,
        textAlign: 'center', marginBottom: '0.7em',
      }}>✦ SUCCÈS · {got}/{total}</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(13em, 1fr))',
        gap: '0.45em',
      }}>
        {entries.map(([id, def]) => {
          const ok = unlocked.has(id);
          return (
            <div key={id} style={{
              display: 'flex', gap: '0.5em', alignItems: 'center',
              padding: '0.4em 0.6em',
              background: ok ? 'rgba(60,40,5,0.5)' : 'rgba(20,8,30,0.4)',
              border: `1px solid ${ok ? '#ffd96677' : '#3a1d4a55'}`,
              borderRadius: 4,
              opacity: ok ? 1 : 0.5,
            }}>
              <span style={{ fontSize: '1.4em', filter: ok ? 'none' : 'grayscale(1)' }}>{def.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: ok ? '#ffd966' : '#9d4edd', fontSize: '0.85em', letterSpacing: 1 }}>
                  {ok ? def.name : '???'}
                </div>
                <div style={{ color: '#b89ec4', fontSize: '0.72em' }}>{def.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GlobalStatsPanel({ state }) {
  const s = state?.stats;
  if (!s || !s.totalRuns) return null;
  const fmt = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  const items = [
    { label: 'Runs joués',          value: s.totalRuns },
    { label: 'Victoires',           value: s.totalVictories },
    { label: 'Ennemis vaincus',     value: s.totalKills.toLocaleString() },
    { label: 'Or total gagné',      value: `💰 ${s.totalGoldEarned.toLocaleString()}` },
    { label: 'Évolutions débloquées', value: s.totalEvolutions },
    { label: 'Meilleur temps',      value: fmt(s.bestTime || 0) },
    { label: 'Plus gros score kills', value: s.bestKills.toLocaleString() },
    { label: 'Plus gros combo',     value: `×${s.bestCombo}` },
  ];
  return (
    <div style={{
      marginTop: '1.4em',
      background: 'rgba(8,0,22,0.78)',
      border: '1px solid rgba(157,78,221,0.35)',
      borderRadius: 6,
      padding: '0.9em 1.1em',
    }}>
      <div style={{
        color: '#9d4edd', fontSize: '0.91em', letterSpacing: 4,
        textAlign: 'center', marginBottom: '0.7em',
      }}>📊 STATISTIQUES</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(13em, 1fr))',
        gap: '0.45em 1em',
      }}>
        {items.map((x, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85em' }}>
            <span style={{ color: '#b89ec4' }}>{x.label}</span>
            <span style={{ color: '#e0aaff', fontWeight: 'bold' }}>{x.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
