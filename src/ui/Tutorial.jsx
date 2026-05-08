import { useEffect, useState } from 'react';
import { useT } from '../i18n.js';
import { playSfx } from '../game/audio.js';

const STORAGE_KEY = 'nightfall:tutorial:v1';

export function isTutorialSeen() {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (_) { return false; }
}

export function markTutorialSeen() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_) {}
}

export function resetTutorial() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
}

const STEPS = [
  {
    icon: '🎮',
    title: 'Bienvenue dans Nightfall Survivor',
    body: 'Survis 5 minutes dans la nuit éternelle. Plus tu tiens, plus c\'est dur.',
  },
  {
    icon: '🕹',
    title: 'Déplacement',
    body: 'PC : WASD / ZQSD / flèches.\nMobile : touche n\'importe où pour faire apparaître le joystick virtuel.\nGamepad : stick gauche.',
  },
  {
    icon: '⚔',
    title: 'Combat automatique',
    body: 'Tes armes attaquent toutes seules. Tu n\'as qu\'à te positionner intelligemment et esquiver.',
  },
  {
    icon: '✦',
    title: 'Level-up',
    body: 'Tue les ennemis pour gagner de l\'XP. À chaque niveau, choisis 1 pouvoir parmi 3 (← → puis Entrée).',
  },
  {
    icon: '🌟',
    title: 'Évolutions mythiques',
    body: 'Une arme niveau MAX + le bon passif niveau MAX = évolution dorée ✦. Un objectif de build à viser.',
  },
  {
    icon: '🧪',
    title: 'Items au sol',
    body: 'Soin, rage, bouclier, hâte, gel, aimant... Marche dessus pour les ramasser.',
  },
  {
    icon: '🔥',
    title: 'Surfaces dangereuses',
    body: 'Évite la lave (🔥) et le poison (☠). Glisse sur la glace (❄). La boue (🟫) ralentit.\nLes rochers et rivières bloquent : fais le tour.',
  },
  {
    icon: '⚱',
    title: 'Méta-progression',
    body: 'L\'or que tu gagnes persiste entre runs. Achète des bonus permanents dans la 💰 BOUTIQUE.',
  },
  {
    icon: '⏸',
    title: 'Contrôles',
    body: 'Échap / ⏸ → pause.\nI / 🎒 → inventaire avec stats détaillées.\nB → guide complet.',
  },
];

export default function Tutorial({ onDone }) {
  const t = useT();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        next();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        skip();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'q') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  const next = () => {
    playSfx('uimove');
    if (step >= STEPS.length - 1) {
      markTutorialSeen();
      onDone?.();
    } else {
      setStep(s => s + 1);
    }
  };
  const prev = () => {
    playSfx('uimove');
    setStep(s => Math.max(0, s - 1));
  };
  const skip = () => {
    playSfx('uipick');
    markTutorialSeen();
    onDone?.();
  };

  const cur = STEPS[step];
  const isLast = step === STEPS.length - 1;
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(3,0,15,0.78)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 40, padding: '1.5em',
      pointerEvents: 'auto',
    }}>
      <div style={{
        background: 'linear-gradient(160deg,rgba(22,6,55,.97),rgba(8,0,25,.97))',
        border: '2px solid #c77dff',
        borderRadius: 12,
        padding: '1.6em 1.8em',
        maxWidth: '32em', width: '100%',
        boxShadow: '0 0 40px rgba(123,47,190,0.55)',
        textAlign: 'center',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: '1em' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 22 : 8, height: 4,
              background: i <= step ? '#c77dff' : '#3a1d4a',
              borderRadius: 2,
              transition: 'all .2s',
            }}/>
          ))}
        </div>
        <div style={{ fontSize: '3em', marginBottom: '0.4em' }}>{cur.icon}</div>
        <div style={{
          fontFamily: "'Cinzel Decorative',serif", fontSize: '1.4em',
          color: '#e0aaff', textShadow: '0 0 16px #7b2fbe',
          marginBottom: '0.6em', letterSpacing: 2,
        }}>{cur.title}</div>
        <div style={{ color: '#d8b8f0', fontSize: '0.95em', lineHeight: 1.55, whiteSpace: 'pre-line', marginBottom: '1.2em' }}>
          {cur.body}
        </div>
        <div style={{ display: 'flex', gap: '0.5em', justifyContent: 'center', flexWrap: 'wrap' }}>
          {step > 0 && (
            <button
              onClick={prev}
              onMouseDown={e => e.preventDefault()}
              tabIndex={-1}
              style={{
                padding: '0.55em 1.2em',
                background: 'transparent',
                border: '1px solid #6c3483',
                color: '#b69ad8',
                fontFamily: "'Cinzel',serif", fontSize: '0.9em', letterSpacing: 2,
                cursor: 'pointer', borderRadius: 4,
                touchAction: 'manipulation',
              }}>← Précédent</button>
          )}
          <button
            onClick={skip}
            onMouseDown={e => e.preventDefault()}
            tabIndex={-1}
            style={{
              padding: '0.55em 1.2em',
              background: 'transparent',
              border: '1px solid #6c3483aa',
              color: '#9d4edd',
              fontFamily: "'Cinzel',serif", fontSize: '0.9em', letterSpacing: 2,
              cursor: 'pointer', borderRadius: 4,
              touchAction: 'manipulation',
            }}>Passer</button>
          <button
            onClick={next}
            onMouseDown={e => e.preventDefault()}
            tabIndex={-1}
            style={{
              padding: '0.65em 1.6em',
              background: 'linear-gradient(135deg,#5a189a,#3c096c)',
              border: '1px solid #c77dff',
              color: '#e0aaff',
              fontFamily: "'Cinzel',serif", fontSize: '1em', letterSpacing: 3,
              cursor: 'pointer', borderRadius: 4,
              boxShadow: '0 0 18px rgba(199,125,255,0.45)',
              touchAction: 'manipulation',
            }}>{isLast ? 'COMMENCER ✓' : 'Suivant →'}</button>
        </div>
        <div style={{ marginTop: '0.8em', fontSize: '0.7em', color: '#6c3483', letterSpacing: 1 }}>
          {step + 1} / {STEPS.length} · ← → / Entrée / Échap
        </div>
      </div>
    </div>
  );
}
