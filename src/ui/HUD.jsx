import { useEffect, useState } from 'react';
import { bus } from '../game/bus.js';
import { SKILLS, ITEMS, ITEM_DURATIONS } from '../game/data.js';
import { useT } from '../i18n.js';

const fmt = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

function useIsCompact() {
  const [c, setC] = useState(() => typeof window !== 'undefined' ? window.matchMedia('(max-width: 720px)').matches : false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 720px)');
    const onChange = e => setC(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return c;
}

export default function HUD({ muted, onToggleMute }) {
  const t = useT();
  const compact = useIsCompact();
  const [s, setS] = useState({ hp: 100, maxHp: 100, xp: 0, xpN: 20, lv: 1, t: 0, kills: 0, goal: 300, skills: {} });
  // Tooltip state on compact mode (tap a chip to see its name briefly)
  const [tip, setTip] = useState(null); // { kind, id, key }

  useEffect(() => bus.on('hud:update', setS), []);
  useEffect(() => {
    if (!tip) return;
    const id = setTimeout(() => setTip(null), 1800);
    return () => clearTimeout(id);
  }, [tip]);

  const showTip = (kind, id) => setTip({ kind, id, key: Date.now() });

  const timeLeft = Math.max(0, s.goal - s.t);
  const danger = timeLeft < 30;
  const skillEntries = Object.entries(s.skills || {});
  const buffEntries = Object.entries(s.buffs || {}).filter(([, v]) => v > 0);
  const otherPlayers = (s.players || []).slice(1);

  // Compact-mode dimensions: tighter padding, smaller fonts, no extended labels
  const padX = compact ? '0.45em' : '0.9em';
  const padY = compact ? '0.32em' : '0.55em';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'rgba(3,0,15,.8)',
      borderBottom: '1px solid rgba(90,24,154,.3)',
      fontSize: compact ? '0.92em' : '1em',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${padY} ${padX}`, gap: compact ? '0.5em' : '0.7em',
      }}>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: compact ? '0.78em' : '0.91em', color: '#ff4d6d', letterSpacing: compact ? 1 : 2 }}>❤ {s.hp}/{s.maxHp}</span>
            {typeof s.dps === 'number' && s.dps > 0 && (
              <span style={{ fontSize: compact ? '0.7em' : '0.78em', color: '#ffe066' }} title="Dégâts par seconde">⚡{s.dps}</span>
            )}
          </div>
          <div style={{ height: compact ? '0.45em' : '0.65em', background: '#1a0010', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.max(0, s.hp / s.maxHp * 100)}%`,
              background: 'linear-gradient(90deg,#8b0000,#ff2244)',
              borderRadius: 4, transition: 'width .12s',
            }}/>
          </div>
        </div>
        <div style={{ textAlign: 'center', flex: '0 0 auto', padding: compact ? '0 0.3em' : '0 0.7em' }}>
          <div style={{
            fontFamily: "'Cinzel Decorative',serif", fontSize: compact ? '1.2em' : '1.7em',
            color: s.endless ? '#ffaa44' : (danger ? '#ff2244' : '#c77dff'),
            textShadow: s.endless ? '0 0 12px #ff8800' : `0 0 ${danger ? 14 : 6}px ${danger ? '#ff0040' : '#7b2fbe'}`,
            transition: 'all .3s',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
          }}>{s.endless ? `♾T${s.endless}` : fmt(timeLeft)}</div>
          <div style={{ fontSize: compact ? '0.7em' : '0.82em', color: '#7b2fbe', letterSpacing: 1, whiteSpace: 'nowrap' }}>
            {compact ? '' : t('hud.level')}{s.lv} · ☠{s.kills}
            {s.runGold > 0 && <span style={{ color: '#ffd966', marginLeft: '0.4em' }}>· 💰{s.runGold}</span>}
            {s.reviveLeft > 0 && <span style={{ color: '#c77dff', marginLeft: '0.4em' }}>· ⚱{s.reviveLeft}</span>}
          </div>
          {s.combo >= 5 && (
            <div style={{
              marginTop: 1, fontFamily: "'Cinzel',serif",
              fontSize: compact ? '0.75em' : '0.85em', letterSpacing: 1,
              color: s.combo >= 50 ? '#ff4400' : s.combo >= 20 ? '#ffaa44' : '#ffe066',
              textShadow: s.combo >= 50 ? '0 0 10px #ff4400' : '0 0 4px #ff8800',
            }}>×{s.combo}</div>
          )}
        </div>
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.4em' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: compact ? '0.78em' : '0.91em', color: '#9d4edd', letterSpacing: compact ? 1 : 2, marginBottom: 2, textAlign: 'right' }}>✦ {s.xp}/{s.xpN}</div>
            <div style={{ height: compact ? '0.45em' : '0.65em', background: '#0a0020', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (s.xp / s.xpN) * 100)}%`,
                background: 'linear-gradient(90deg,#5a189a,#c77dff)',
                borderRadius: 4, transition: 'width .12s',
              }}/>
            </div>
          </div>
          <button
            onClick={e => { onToggleMute(); e.currentTarget.blur(); }}
            onMouseDown={e => e.preventDefault()}
            tabIndex={-1}
            style={{
              background: 'transparent', border: '1px solid #3c096c',
              borderRadius: 4, color: muted ? '#4a1a6a' : '#c77dff',
              fontSize: compact ? '1em' : '1.27em',
              cursor: 'pointer', padding: compact ? '0.05em 0.35em' : '0.15em 0.55em',
              flexShrink: 0, pointerEvents: 'auto',
            }}>{muted ? '🔇' : '🔊'}</button>
        </div>
      </div>
      {otherPlayers.length > 0 && (
        <div style={{
          display: 'flex', gap: '0.4em', padding: `${compact ? 0.22 : 0.36}em ${padX}`,
          background: 'rgba(5,0,20,.65)',
          borderTop: '1px solid rgba(60,9,108,.25)',
          flexWrap: 'wrap', alignItems: 'center',
        }}>
          {otherPlayers.map(pl => {
            const tint = `#${(pl.tint ?? 0xffffff).toString(16).padStart(6, '0')}`;
            return compact ? (
              <div key={pl.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.35em',
                padding: '0.1em 0.5em',
                background: pl.dead ? 'rgba(40,0,0,.6)' : 'rgba(10,0,30,.6)',
                border: `1px solid ${tint}55`, borderRadius: 4,
                opacity: pl.dead ? 0.55 : 1,
                fontSize: '0.72em',
              }}>
                <span style={{ color: tint }}>P{pl.id + 1}</span>
                <span style={{ color: '#ff4d6d' }}>❤{pl.hp}</span>
                <span style={{ color: '#9d4edd' }}>✦{pl.lv}</span>
                <span style={{ color: '#b69ad8' }}>☠{pl.kills}</span>
                {pl.dead && <span style={{ color: '#ff4400' }}>✝</span>}
              </div>
            ) : (
              <div key={pl.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.5em',
                padding: '0.18em 0.7em',
                background: pl.dead ? 'rgba(40,0,0,.6)' : 'rgba(10,0,30,.6)',
                border: `1px solid ${tint}55`,
                borderRadius: 4,
                opacity: pl.dead ? 0.55 : 1,
              }}>
                <span style={{ color: tint, fontSize: '0.82em', letterSpacing: 2 }}>P{pl.id + 1}</span>
                <div style={{ width: '7em' }}>
                  <div style={{ fontSize: '0.78em', color: '#ff4d6d', letterSpacing: 1 }}>❤ {pl.hp}/{pl.maxHp}</div>
                  <div style={{ height: '0.4em', background: '#1a0010', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max(0, pl.hp / pl.maxHp * 100)}%`,
                      background: 'linear-gradient(90deg,#8b0000,#ff2244)',
                      borderRadius: 3,
                    }}/>
                  </div>
                </div>
                <div style={{ width: '7em' }}>
                  <div style={{ fontSize: '0.78em', color: '#9d4edd', letterSpacing: 1 }}>✦ {pl.xp}/{pl.xpN}</div>
                  <div style={{ height: '0.4em', background: '#0a0020', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (pl.xp / pl.xpN) * 100)}%`,
                      background: `linear-gradient(90deg, ${tint}66, ${tint})`,
                      borderRadius: 3,
                    }}/>
                  </div>
                </div>
                <span style={{ color: tint, fontSize: '0.78em', letterSpacing: 1 }}>{t('hud.level')}{pl.lv}</span>
                <span style={{ color: '#b69ad8', fontSize: '0.78em' }}>☠{pl.kills}</span>
                {pl.dead && <span style={{ color: '#ff4400', fontSize: '0.82em', letterSpacing: 2 }}>✝</span>}
              </div>
            );
          })}
        </div>
      )}
      {buffEntries.length > 0 && (
        <div style={{
          display: 'flex', gap: compact ? '0.35em' : '0.55em', padding: `${compact ? 0.22 : 0.36}em ${padX}`,
          background: 'rgba(5,0,20,.8)',
          borderTop: '1px solid rgba(60,9,108,.2)',
          flexWrap: 'wrap', alignItems: 'center',
        }}>
          {buffEntries.map(([id, remaining]) => {
            const it = ITEMS[id];
            const dur = ITEM_DURATIONS[id];
            if (!it || !dur) return null;
            const showLabel = !compact || (tip?.kind === 'buff' && tip.id === id);
            return (
              <div
                key={id}
                onClick={() => compact && showTip('buff', id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4em',
                  background: 'rgba(10,0,30,.8)',
                  border: `1px solid ${it.col}55`,
                  borderRadius: 4, padding: compact ? '0.1em 0.4em' : '0.18em 0.7em',
                  cursor: compact ? 'pointer' : 'default',
                  pointerEvents: 'auto',
                  touchAction: 'manipulation',
                }}
              >
                <span style={{ fontSize: compact ? '1em' : '1.27em' }}>{it.icon}</span>
                {showLabel && (
                  <div>
                    <div style={{ fontSize: '0.82em', color: it.col, letterSpacing: 1 }}>{it.name}</div>
                    <div style={{ height: 3, background: '#111', borderRadius: 2, width: '4em', marginTop: 2 }}>
                      <div style={{
                        height: '100%',
                        width: `${(remaining / dur) * 100}%`,
                        background: it.col, borderRadius: 2,
                        transition: 'width .1s',
                      }}/>
                    </div>
                  </div>
                )}
                <span style={{ fontSize: compact ? '0.7em' : '0.82em', color: it.col + 'aa' }}>{Math.ceil(remaining)}s</span>
              </div>
            );
          })}
        </div>
      )}
      {s.bosses && s.bosses.length > 0 && (
        <div style={{ padding: `${compact ? 0.22 : 0.36}em ${padX}`, background: 'rgba(20,0,0,.85)', borderTop: '1px solid #ff440040', display: 'flex', flexDirection: 'column', gap: '0.25em' }}>
          {s.bosses.map((b, i) => (
            <div key={i}>
              <div style={{ fontSize: compact ? '0.7em' : '0.82em', color: '#ff4400', letterSpacing: 1, marginBottom: 1 }}>
                ⚠ {b.name} · {b.hp}{compact ? '' : ' ' + t('hud.hpUnit')}
              </div>
              <div style={{ height: compact ? '0.32em' : '0.45em', background: '#200', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.max(0, (b.hp / b.maxHp) * 100)}%`,
                  background: 'linear-gradient(90deg,#8b0000,#ff4400)',
                  borderRadius: 3, transition: 'width .1s',
                }}/>
              </div>
            </div>
          ))}
        </div>
      )}
      {skillEntries.length > 0 && (
        <div style={{
          display: 'flex', gap: compact ? '0.3em' : '0.45em', flexWrap: 'wrap', alignItems: 'center',
          padding: `${compact ? 0.22 : 0.36}em ${padX}`,
          borderTop: '1px solid rgba(90,24,154,.18)',
        }}>
          {!compact && (
            <span style={{ fontSize: '0.82em', color: '#b69ad8', letterSpacing: 2, marginRight: '0.36em' }}>{t('hud.powers')}</span>
          )}
          {skillEntries.map(([id, lv]) => {
            const sk = SKILLS[id];
            if (!sk) return null;
            const cd = s.cooldowns?.[id];
            const showCd = typeof cd === 'number' && cd < 1;
            const showLabel = !compact || (tip?.kind === 'skill' && tip.id === id);
            return (
              <div
                key={id}
                onClick={() => compact && showTip('skill', id)}
                style={{
                  position: 'relative',
                  background: 'rgba(8,0,22,.85)',
                  border: `1px solid ${sk.color}45`,
                  borderRadius: 4, padding: compact ? '0.1em 0.35em' : '0.18em 0.6em',
                  display: 'flex', alignItems: 'center', gap: '0.3em',
                  overflow: 'hidden',
                  cursor: compact ? 'pointer' : 'default',
                  pointerEvents: 'auto',
                  touchAction: 'manipulation',
                }}
              >
                <span style={{ fontSize: compact ? '0.95em' : '1.1em' }}>{sk.icon}</span>
                {compact ? (
                  <span style={{ color: sk.color, fontSize: '0.75em', fontWeight: 'bold' }}>{lv}</span>
                ) : (
                  <span style={{ color: sk.color, fontSize: '0.91em' }}>{'●'.repeat(lv)}{'○'.repeat(sk.max - lv)}</span>
                )}
                {showLabel && compact && (
                  <span style={{ color: sk.color, fontSize: '0.7em', marginLeft: 4, whiteSpace: 'nowrap' }}>
                    {t(`skills.${id}`)}
                  </span>
                )}
                {showCd && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                    background: 'rgba(20,8,40,0.8)',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${cd * 100}%`,
                      background: sk.color,
                      transition: 'width 0.13s linear',
                    }}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
