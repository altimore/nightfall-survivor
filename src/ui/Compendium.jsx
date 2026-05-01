import { useEffect } from 'react';
import { SKILLS, ETYPES, ITEMS } from '../game/data.js';
import { useT } from '../i18n.js';
import { useGamepadActions } from './useGamepad.js';
import { playSfx } from '../game/audio.js';
import { MenuBg } from './SceneBg.jsx';

const hexToRgb = h => {
  const v = typeof h === 'number' ? h.toString(16).padStart(6, '0') : (h || '').replace('#', '').padStart(6, '0');
  return `#${v}`;
};

export default function Compendium({ onClose }) {
  const t = useT();

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'b' || e.key === 'B') {
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

  const weapons = Object.entries(SKILLS).filter(([, s]) => s.type === 'weapon');
  const passives = Object.entries(SKILLS).filter(([, s]) => s.type === 'passive');
  const enemies = Object.entries(ETYPES);
  const items = Object.entries(ITEMS);

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

      <div style={{
        position: 'relative',
        width: '100%', maxWidth: 1100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2em', flexWrap: 'wrap', gap: '0.5em' }}>
          <div style={{
            fontFamily: "'Cinzel Decorative',serif", fontSize: '2.5em',
            color: '#c77dff', textShadow: '0 0 30px #7b2fbe',
            letterSpacing: 6,
          }}>{t('compendium.title')}</div>
          <button
            onClick={() => { playSfx('uipick'); onClose(); }}
            style={{
              padding: '0.5em 1.4em',
              background: 'linear-gradient(135deg,#5a189a,#3c096c)',
              border: '1px solid #c77dff', color: '#e0aaff',
              fontFamily: "'Cinzel',serif", fontSize: '1em', letterSpacing: 3,
              cursor: 'pointer', borderRadius: 3,
            }}
          >← {t('compendium.back')}</button>
        </div>

        <Section title={`⚔ ${t('compendium.weapons')}`} color="#c77dff">
          {weapons.map(([id, sk]) => (
            <SkillCard key={id} sk={sk} />
          ))}
        </Section>

        <Section title={`🛡 ${t('compendium.passives')}`} color="#80ffdb">
          {passives.map(([id, sk]) => (
            <SkillCard key={id} sk={sk} />
          ))}
        </Section>

        <Section title={`☠ ${t('compendium.enemies')}`} color="#ff4d6d">
          {enemies.map(([id, et]) => (
            <EnemyCard key={id} id={id} et={et} t={t} />
          ))}
        </Section>

        <Section title={`🧪 ${t('compendium.items')}`} color="#ffe066">
          {items.map(([id, it]) => (
            <ItemCard key={id} it={it} />
          ))}
        </Section>

        <div style={{ marginTop: '1.5em', textAlign: 'center', color: '#b69ad8', fontSize: '0.82em', letterSpacing: 2 }}>
          {t('compendium.hint')}
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: '1.5em' }}>
      <div style={{
        color, fontSize: '1.2em', letterSpacing: 6,
        fontFamily: "'Cinzel',serif",
        marginBottom: '0.6em',
        borderBottom: `1px solid ${color}55`,
        paddingBottom: '0.3em',
      }}>{title}</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(16em, 1fr))',
        gap: '0.7em',
      }}>{children}</div>
    </div>
  );
}

function SkillCard({ sk }) {
  return (
    <div style={{
      background: 'rgba(8,0,22,0.85)',
      border: `1px solid ${sk.color}55`,
      borderRadius: 6,
      padding: '0.8em 1em',
      boxShadow: `0 0 12px ${sk.color}18`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', marginBottom: '0.5em' }}>
        <span style={{ fontSize: '1.6em' }}>{sk.icon}</span>
        <span style={{ color: sk.color, fontSize: '1em', letterSpacing: 1 }}>{sk.name}</span>
      </div>
      <ol style={{ margin: 0, paddingLeft: '1.2em', color: '#d8b8f0', fontSize: '0.82em', lineHeight: 1.45 }}>
        {sk.desc.map((d, i) => (
          <li key={i} style={{ marginBottom: '0.15em' }}>
            <span style={{ color: `${sk.color}cc` }}>Lv.{i + 1}</span> · {d}
          </li>
        ))}
      </ol>
    </div>
  );
}

function EnemyCard({ id, et, t }) {
  const isBoss = id === 'boss';
  const wave = et.wave;
  const behaviorLabel = {
    wavy: 'Sinusoïdal', direct: 'Direct', ranged: 'Tireur',
    phase: 'Fantomatique', charge: 'Charge', kite: 'Kite',
    boss: 'Boss',
  }[et.behavior] || et.behavior;
  return (
    <div style={{
      background: 'rgba(8,0,22,0.85)',
      border: `1px solid ${hexToRgb(et.col)}66`,
      borderRadius: 6,
      padding: '0.8em 1em',
      boxShadow: `0 0 12px ${hexToRgb(et.col)}22`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6em', marginBottom: '0.4em' }}>
        <div style={{
          width: '2.4em', height: '2.4em', borderRadius: 8,
          background: `radial-gradient(circle at 35% 30%, ${hexToRgb(et.col)}80, ${hexToRgb(et.col)}30 60%, rgba(0,0,0,0.4))`,
          border: `1px solid ${hexToRgb(et.col)}80`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5em',
          boxShadow: `0 0 10px ${hexToRgb(et.col)}55`,
          flexShrink: 0,
        }}>{et.icon}</div>
        <span style={{ color: hexToRgb(et.col), fontSize: '1em', letterSpacing: 1 }}>{et.label}</span>
        {isBoss && <span style={{ color: '#ff4400', fontSize: '0.82em', letterSpacing: 2, marginLeft: 'auto' }}>BOSS</span>}
      </div>
      <div style={{ color: '#b69ad8', fontSize: '0.82em', lineHeight: 1.5 }}>
        <div>{t('compendium.behavior')} : <span style={{ color: '#d8b8f0' }}>{behaviorLabel}</span></div>
        <div>{t('compendium.hp')} <span style={{ color: '#ff8a8a' }}>{et.baseHp}</span> · {t('compendium.speed')} <span style={{ color: '#88ddff' }}>{et.baseSpd}</span> · {t('compendium.damage')} <span style={{ color: '#ffaa66' }}>{et.dmg}</span></div>
        {wave >= 0 && (
          <div style={{ color: '#7b46c4', fontSize: '0.82em', marginTop: '0.2em' }}>
            {t('compendium.unlocksAt')} {wave}{t('compendium.seconds')}
          </div>
        )}
      </div>
    </div>
  );
}

function ItemCard({ it }) {
  return (
    <div style={{
      background: 'rgba(8,0,22,0.85)',
      border: `1px solid ${it.col}66`,
      borderRadius: 6,
      padding: '0.7em 0.95em',
      display: 'flex', alignItems: 'center', gap: '0.6em',
    }}>
      <span style={{ fontSize: '1.6em' }}>{it.icon}</span>
      <div>
        <div style={{ color: it.col, fontSize: '0.95em', letterSpacing: 1 }}>{it.name}</div>
        <div style={{ color: '#b69ad8', fontSize: '0.82em', marginTop: '0.15em' }}>{it.desc}</div>
      </div>
    </div>
  );
}
