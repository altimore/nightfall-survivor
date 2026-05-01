import { useEffect } from 'react';
import { SKILLS, ITEMS, ITEM_DURATIONS } from '../game/data.js';
import { useT } from '../i18n.js';
import { useGamepadActions } from './useGamepad.js';
import { playSfx } from '../game/audio.js';

export default function InventoryOverlay({ hud, onClose }) {
  const t = useT();
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'i' || e.key === 'I' || e.key === 'Escape') {
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
    confirm: () => { playSfx('uipick'); onClose(); },
  });

  const skills = Object.entries(hud.skills || {});
  const buffs = Object.entries(hud.buffs || {}).filter(([, v]) => v > 0);
  const stats = hud.stats || {};

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(3,0,15,0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 26, padding: '1.5em',
    }}>
      <div style={{
        background: 'rgba(8,0,22,0.95)',
        border: '1px solid #5a189a',
        borderRadius: 12,
        padding: '1.6em 2em',
        maxWidth: '90vw', maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 0 40px rgba(123,47,190,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8em' }}>
          <div style={{
            fontFamily: "'Cinzel Decorative',serif",
            fontSize: '1.9em', color: '#c77dff',
            textShadow: '0 0 20px #7b2fbe',
            textAlign: 'center', letterSpacing: 5, flex: 1,
          }}>{t('inventory.title')}</div>
          <button
            onClick={() => { playSfx('uipick'); onClose(); }}
            onTouchStart={e => e.stopPropagation()}
            tabIndex={-1}
            aria-label="Fermer"
            style={{
              padding: '0.4em 0.9em',
              background: 'linear-gradient(135deg,#5a189a,#3c096c)',
              border: '1px solid #c77dff', color: '#e0aaff',
              fontFamily: "'Cinzel',serif", fontSize: '1em', letterSpacing: 2,
              cursor: 'pointer', borderRadius: 4,
              touchAction: 'manipulation',
            }}>✕</button>
        </div>

        <Section title={t('inventory.stats')} color="#80ffdb">
          <Stat label="❤ HP" value={`${hud.hp}/${hud.maxHp}`} color="#ff4d6d"/>
          <Stat label={`${t('hud.level')}`} value={hud.lv} color="#c77dff"/>
          <Stat label="✦ XP" value={`${hud.xp}/${hud.xpN}`} color="#9d4edd"/>
          <Stat label="☠" value={hud.kills} color="#ffe066"/>
          {stats.speed != null && <Stat label="🏃 Vit." value={`${Math.round(stats.speed)} px/s`} color="#80ffdb"/>}
          {stats.dmgM != null && <Stat label="⚔ Dégâts" value={`×${stats.dmgM.toFixed(2)}`} color="#ff8844"/>}
          {stats.xpM != null && <Stat label="📜 XP gain" value={`×${stats.xpM.toFixed(2)}`} color="#ffb347"/>}
          {stats.regen > 0 && <Stat label={`💚 ${t('inventory.regen')}`} value={`+${stats.regen.toFixed(1)}/s`} color="#88ff88"/>}
          {stats.lifesteal > 0 && <Stat label={`🩸 ${t('inventory.lifesteal')}`} value={`${(stats.lifesteal * 100).toFixed(0)}%`} color="#ff66aa"/>}
          {stats.magnet != null && <Stat label={`🧲 ${t('inventory.magnet')}`} value={Math.round(stats.magnet)} color="#ffd070"/>}
          {stats.killHeal && <Stat label="❤️‍🩹 Soin/kill" value="+8 PV" color="#ff8888"/>}
          {stats.canDash && (
            <Stat
              label={`🌀 ${t('inventory.dash')}`}
              value={stats.dashReady ? '✓ Prêt' : '⏱ Cooldown'}
              color={stats.dashReady ? '#80ffdb' : '#6c3483'}
            />
          )}
        </Section>

        {skills.length > 0 && (
          <Section title={t('hud.powers')} color="#c77dff">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(13em, 1fr))', gap: '0.5em', gridColumn: '1 / -1' }}>
              {skills.map(([id, lv]) => {
                const sk = SKILLS[id];
                if (!sk) return null;
                return (
                  <div key={id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6em',
                    padding: '0.5em 0.8em',
                    background: 'rgba(10,0,30,0.6)',
                    border: `1px solid ${sk.color}55`,
                    borderRadius: 4,
                  }}>
                    <span style={{ fontSize: '1.5em' }}>{sk.icon}</span>
                    <div>
                      <div style={{ color: sk.color, fontSize: '0.91em' }}>{t(`skills.${id}`)}</div>
                      <div style={{ color: sk.color, fontSize: '0.82em' }}>{'●'.repeat(lv)}{'○'.repeat(sk.max - lv)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {buffs.length > 0 && (
          <Section title={t('inventory.activeBuffs')} color="#ffe066">
            <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap', gridColumn: '1 / -1' }}>
              {buffs.map(([id, v]) => {
                const it = ITEMS[id];
                if (!it) return null;
                const dur = ITEM_DURATIONS[id] || 1;
                return (
                  <div key={id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.4em',
                    padding: '0.3em 0.7em',
                    background: 'rgba(10,0,30,0.6)',
                    border: `1px solid ${it.col}66`,
                    borderRadius: 4,
                  }}>
                    <span style={{ fontSize: '1.2em' }}>{it.icon}</span>
                    <div>
                      <div style={{ color: it.col, fontSize: '0.82em' }}>{it.name}</div>
                      <div style={{ height: 3, background: '#111', borderRadius: 2, width: '5em', marginTop: 2 }}>
                        <div style={{ height: '100%', width: `${(v / dur) * 100}%`, background: it.col, borderRadius: 2 }}/>
                      </div>
                    </div>
                    <span style={{ color: it.col + 'aa', fontSize: '0.82em' }}>{Math.ceil(v)}s</span>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        <div style={{ textAlign: 'center', color: '#b69ad8', fontSize: '0.82em', letterSpacing: 2, marginTop: '0.5em' }}>
          {t('inventory.hint')}
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: '1.2em' }}>
      <div style={{
        color, fontSize: '0.95em', letterSpacing: 4,
        fontFamily: "'Cinzel',serif",
        marginBottom: '0.5em',
        borderBottom: `1px solid ${color}44`,
        paddingBottom: '0.2em',
      }}>{title}</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(10em, 1fr))',
        gap: '0.5em',
      }}>{children}</div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{
      padding: '0.35em 0.7em',
      background: 'rgba(10,0,30,0.4)',
      border: `1px solid ${color}33`,
      borderRadius: 4,
      display: 'flex', justifyContent: 'space-between', gap: '0.4em',
      fontSize: '0.91em',
    }}>
      <span style={{ color: '#b69ad8' }}>{label}</span>
      <span style={{ color, fontWeight: 'bold' }}>{value}</span>
    </div>
  );
}
