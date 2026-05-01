import { useEffect, useState } from 'react';
import { SKILLS, ETYPES, ITEMS, EVOLUTIONS } from '../game/data.js';
import { NEST_CONFIG } from '../game/entities.js';
import { useT } from '../i18n.js';
import { useGamepadActions } from './useGamepad.js';
import { playSfx } from '../game/audio.js';
import { MenuBg } from './SceneBg.jsx';

const hexToRgb = h => {
  const v = typeof h === 'number' ? h.toString(16).padStart(6, '0') : (h || '').replace('#', '').padStart(6, '0');
  return `#${v}`;
};

const TABS = [
  { id: 'weapons',    label: 'compendium.weapons',    icon: '⚔', color: '#c77dff' },
  { id: 'passives',   label: 'compendium.passives',   icon: '🛡', color: '#80ffdb' },
  { id: 'evolutions', label: 'compendium.evolutions', icon: '✦', color: '#ffd966' },
  { id: 'enemies',    label: 'compendium.enemies',    icon: '☠', color: '#ff4d6d' },
  { id: 'items',      label: 'compendium.items',      icon: '🧪', color: '#ffe066' },
];

export default function Compendium({ onClose }) {
  const t = useT();
  const [tab, setTab] = useState('weapons');

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        playSfx('uipick');
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        setTab(cur => {
          const i = TABS.findIndex(x => x.id === cur);
          const n = TABS[(i + 1) % TABS.length].id;
          if (n !== cur) playSfx('uimove');
          return n;
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'q') {
        e.preventDefault();
        setTab(cur => {
          const i = TABS.findIndex(x => x.id === cur);
          const n = TABS[(i - 1 + TABS.length) % TABS.length].id;
          if (n !== cur) playSfx('uimove');
          return n;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useGamepadActions({
    back: () => { playSfx('uipick'); onClose(); },
    left: () => setTab(cur => {
      const i = TABS.findIndex(x => x.id === cur);
      return TABS[(i - 1 + TABS.length) % TABS.length].id;
    }),
    right: () => setTab(cur => {
      const i = TABS.findIndex(x => x.id === cur);
      return TABS[(i + 1) % TABS.length].id;
    }),
  });

  const weapons = Object.entries(SKILLS).filter(([, s]) => s.type === 'weapon');
  const passives = Object.entries(SKILLS).filter(([, s]) => s.type === 'passive');
  const enemies = Object.entries(ETYPES);
  const items = Object.entries(ITEMS);
  const evolutions = Object.entries(EVOLUTIONS);

  const activeTab = TABS.find(x => x.id === tab) || TABS[0];

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9em', flexWrap: 'wrap', gap: '0.5em' }}>
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

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: '0.5em', flexWrap: 'wrap',
          marginBottom: '1.1em',
          borderBottom: '1px solid rgba(199,125,255,0.25)',
          paddingBottom: '0.55em',
        }}>
          {TABS.map(x => {
            const active = x.id === tab;
            return (
              <button
                key={x.id}
                onClick={() => { if (tab !== x.id) playSfx('uimove'); setTab(x.id); }}
                onMouseDown={e => e.preventDefault()}
                tabIndex={-1}
                style={{
                  padding: '0.55em 1.1em',
                  background: active ? `linear-gradient(135deg,${x.color}33,${x.color}10)` : 'rgba(8,0,22,0.6)',
                  border: `1px solid ${active ? x.color : x.color + '33'}`,
                  color: active ? x.color : '#9d4edd',
                  fontFamily: "'Cinzel',serif",
                  fontSize: '0.9em', letterSpacing: 3,
                  cursor: 'pointer', borderRadius: 4,
                  boxShadow: active ? `0 0 18px ${x.color}55` : 'none',
                  transform: active ? 'translateY(-1px)' : 'none',
                  transition: 'all .12s',
                }}
              >{x.icon} {t(x.label) || x.id}</button>
            );
          })}
        </div>

        {/* Tab content */}
        <div>
          {tab === 'weapons' && (
            <SectionGrid color={activeTab.color}>
              {weapons.map(([id, sk]) => <SkillCard key={id} id={id} sk={sk} t={t} />)}
            </SectionGrid>
          )}
          {tab === 'passives' && (
            <SectionGrid color={activeTab.color}>
              {passives.map(([id, sk]) => <SkillCard key={id} id={id} sk={sk} t={t} />)}
            </SectionGrid>
          )}
          {tab === 'evolutions' && (
            <SectionGrid color={activeTab.color}>
              {evolutions.map(([id, evo]) => <EvolutionCard key={id} id={id} evo={evo} t={t} />)}
            </SectionGrid>
          )}
          {tab === 'enemies' && (
            <SectionGrid color={activeTab.color}>
              {enemies.map(([id, et]) => <EnemyCard key={id} id={id} et={et} t={t} />)}
            </SectionGrid>
          )}
          {tab === 'items' && (
            <SectionGrid color={activeTab.color}>
              {items.map(([id, it]) => <ItemCard key={id} it={it} />)}
            </SectionGrid>
          )}
        </div>

        <div style={{ marginTop: '1.5em', textAlign: 'center', color: '#b69ad8', fontSize: '0.82em', letterSpacing: 2 }}>
          {t('compendium.hint')} · ← → pour changer d'onglet
        </div>
      </div>
    </div>
  );
}

function SectionGrid({ children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(16em, 1fr))',
      gap: '0.7em',
    }}>{children}</div>
  );
}

function EvolutionCard({ id, evo, t }) {
  const reqSkill = SKILLS[evo.requires];
  const wepSkill = SKILLS[id];
  return (
    <div style={{
      background: 'linear-gradient(160deg,rgba(60,40,5,.92),rgba(20,12,2,.92))',
      border: `1px solid ${evo.color}66`,
      borderRadius: 6,
      padding: '0.85em 1em',
      boxShadow: `0 0 14px ${evo.color}22`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', marginBottom: '0.45em' }}>
        <span style={{ fontSize: '1.7em' }}>{evo.icon}</span>
        <span style={{ color: evo.color, fontSize: '1em', letterSpacing: 1, flex: 1 }}>{evo.name}</span>
      </div>
      <div style={{ fontSize: '0.78em', color: '#b89ec4', marginBottom: '0.4em', letterSpacing: 1 }}>
        <span style={{ color: wepSkill?.color }}>{wepSkill?.icon || ''} {t ? t(`skills.${id}`) : ''}</span>
        <span style={{ color: '#666', margin: '0 0.4em' }}>+</span>
        <span style={{ color: reqSkill?.color }}>{reqSkill?.icon || ''} {t ? t(`skills.${evo.requires}`) : ''}</span>
      </div>
      <div style={{ color: '#ffd966cc', fontSize: '0.85em', lineHeight: 1.5 }}>{evo.desc}</div>
      <div style={{
        marginTop: '0.55em', fontSize: '0.78em', letterSpacing: 2,
        color: '#ffd966',
        border: '1px solid #ffd96644',
        borderRadius: 20, padding: '0.18em 0.7em',
        display: 'inline-block',
      }}>✦ MYTHIQUE</div>
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

function SkillCard({ id, sk, t }) {
  const name = t ? t(`skills.${id}`) : sk.name;
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
        <span style={{ color: sk.color, fontSize: '1em', letterSpacing: 1 }}>{name}</span>
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
  const nest = NEST_CONFIG[id];
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
        {nest && (
          <div style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: '0.4em',
            padding: '0.18em 0.55em',
            background: 'rgba(20,8,30,0.7)',
            border: `1px dashed ${hexToRgb(et.col)}55`,
            borderRadius: 4,
            fontSize: '0.78em',
            color: hexToRgb(et.col),
          }}>
            <span style={{ fontSize: '1.15em' }}>{nest.icon}</span>
            <span style={{ letterSpacing: 1 }}>{nest.label}</span>
          </div>
        )}
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
        {nest && (
          <div style={{ color: '#9d6ad8', fontSize: '0.78em', marginTop: '0.35em', borderTop: `1px solid ${hexToRgb(et.col)}33`, paddingTop: '0.25em' }}>
            🏚 Nid · <span style={{ color: '#ff8a8a' }}>{nest.hp} PV</span> · spawn toutes les <span style={{ color: '#88ddff' }}>{nest.interval}s</span>
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
