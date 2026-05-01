import { useEffect, useState } from 'react';
import { VictoryBg, DefeatBg } from './SceneBg.jsx';
import { useGamepadActions } from './useGamepad.js';
import { useT } from '../i18n.js';
import { playSfx } from '../game/audio.js';
import { SKILLS } from '../game/data.js';
import { bus } from '../game/bus.js';

const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function EndScreen({ phase, hud, runStats, onRestart, onMenu }) {
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
      <div style={{ color: '#9d4edd', fontSize: '1.1em', marginBottom: 8, position: 'relative' }}>
        ☠ {hud.kills || 0} {t('end.kills')}
      </div>
      {runStats?.goldEarned > 0 && (
        <div style={{ color: '#ffd966', fontSize: '1em', marginBottom: 18, position: 'relative', letterSpacing: 2 }}>
          💰 +{runStats.goldEarned} <span style={{ color: '#9d8a4a', fontSize: '0.85em' }}>(total : {runStats.goldTotal})</span>
        </div>
      )}
      <DamageReport runStats={runStats} t={t} />
      <DpsChart runStats={runStats} />
      {win && (
        <button
          onClick={() => { playSfx('uipick'); bus.emit('endless:continue'); }}
          onMouseDown={e => e.preventDefault()}
          tabIndex={-1}
          style={{
            padding: '0.75em 2.2em',
            marginBottom: 10,
            background: 'linear-gradient(135deg,#8a4a00,#3c1d00)',
            border: '1px solid #ffaa44',
            color: '#ffd966',
            fontFamily: "'Cinzel',serif", fontSize: '1.1em', letterSpacing: 3,
            cursor: 'pointer', borderRadius: 3,
            boxShadow: '0 0 24px rgba(255,170,68,0.5)',
            position: 'relative',
          }}>♾ {t('end.continue') || 'CONTINUER EN ENDLESS'}</button>
      )}
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

function DpsChart({ runStats }) {
  const hist = runStats?.dpsHistory;
  if (!Array.isArray(hist) || hist.length < 3) return null;
  const w = 280, h = 60;
  const max = Math.max(1, ...hist.map(p => p.dps));
  const points = hist.map((p, i) => {
    const x = (i / (hist.length - 1)) * (w - 6) + 3;
    const y = h - 4 - (p.dps / max) * (h - 12);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M ${points.join(' L ')}`;
  const areaPath = `${path} L ${(w - 3).toFixed(1)},${(h - 4).toFixed(1)} L ${(3).toFixed(1)},${(h - 4).toFixed(1)} Z`;
  const peakDps = Math.max(...hist.map(p => p.dps));
  return (
    <div style={{
      width: 'min(28em, 92vw)',
      marginBottom: 18,
      padding: '0.7em 1em',
      background: 'rgba(8,0,22,0.78)',
      border: '1px solid rgba(255,224,102,0.30)',
      borderRadius: 6,
      position: 'relative',
    }}>
      <div style={{ color: '#ffe066', fontSize: '0.82em', letterSpacing: 3, textAlign: 'center', marginBottom: '0.3em' }}>
        ⚡ DPS AU FIL DU TEMPS · pic {peakDps.toLocaleString()}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="dpsGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffe066" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#ffe066" stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#dpsGradient)" />
        <path d={path} fill="none" stroke="#ffe066" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function DamageReport({ runStats, t }) {
  const stats = runStats?.damageStats;
  if (!stats) return null;
  const entries = Object.entries(stats)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);
  if (entries.length === 0) return null;
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const top = entries.slice(0, 6);
  const time = Math.max(1, runStats.time || 0);
  const avgDps = Math.round(total / time);
  return (
    <div style={{
      width: 'min(28em, 92vw)',
      marginBottom: 18,
      padding: '0.8em 1em',
      background: 'rgba(8,0,22,0.78)',
      border: '1px solid rgba(199,125,255,0.35)',
      borderRadius: 6,
      position: 'relative',
      boxShadow: '0 0 18px rgba(123,47,190,0.35)',
    }}>
      <div style={{ color: '#c77dff', fontSize: '0.91em', letterSpacing: 4, textAlign: 'center', marginBottom: '0.55em' }}>
        ⚔ {t('end.damageReport') || 'DÉGÂTS PAR ARME'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35em' }}>
        {top.map(([id, dmg]) => {
          const sk = SKILLS[id];
          const name = sk ? (t(`skills.${id}`) || sk.name) : id;
          const col = sk?.color || '#c77dff';
          const pct = (dmg / total) * 100;
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.5em', fontSize: '0.85em' }}>
              <span style={{ width: '1.4em', textAlign: 'center', fontSize: '1em' }}>{sk?.icon || '⚔'}</span>
              <span style={{ width: '7.5em', color: col, letterSpacing: 1 }}>{name}</span>
              <div style={{ flex: 1, height: '0.6em', background: '#0a0020', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${col}88, ${col})`,
                  borderRadius: 3,
                  transition: 'width .3s',
                }}/>
              </div>
              <span style={{ width: '4.5em', textAlign: 'right', color: '#d8b8f0' }}>{Math.round(dmg).toLocaleString()}</span>
              <span style={{ width: '3em', textAlign: 'right', color: `${col}aa`, fontSize: '0.8em' }}>{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: '0.6em', display: 'flex', justifyContent: 'space-between',
        color: '#9d4edd', fontSize: '0.78em', letterSpacing: 2,
        borderTop: '1px solid rgba(199,125,255,0.18)', paddingTop: '0.45em',
      }}>
        <span>{t('end.total') || 'TOTAL'} · <span style={{ color: '#e0aaff' }}>{Math.round(total).toLocaleString()}</span></span>
        <span>⚡ <span style={{ color: '#ffe066' }}>{avgDps.toLocaleString()}</span> {t('end.avgDps') || 'DPS moyen'}</span>
      </div>
    </div>
  );
}
