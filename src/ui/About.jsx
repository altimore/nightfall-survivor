import { useEffect } from 'react';
import { playSfx } from '../game/audio.js';
import { useGamepadActions } from './useGamepad.js';
import { MenuBg } from './SceneBg.jsx';

export default function About({ onClose }) {
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

  useGamepadActions({ back: () => { playSfx('uipick'); onClose(); } });

  const Section = ({ title, children, color = '#c77dff' }) => (
    <div style={{
      marginBottom: '1em',
      background: 'rgba(8,0,22,0.78)',
      border: `1px solid ${color}55`,
      borderRadius: 6,
      padding: '0.85em 1.1em',
    }}>
      <div style={{
        color, fontSize: '0.95em', letterSpacing: 4,
        fontFamily: "'Cinzel',serif",
        marginBottom: '0.55em',
      }}>{title}</div>
      <div style={{ color: '#d8b8f0', fontSize: '0.88em', lineHeight: 1.7 }}>{children}</div>
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
      <div style={{ position: 'relative', width: '100%', maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1em', flexWrap: 'wrap', gap: '0.5em' }}>
          <div style={{
            fontFamily: "'Cinzel Decorative',serif", fontSize: '2.3em',
            color: '#c77dff', textShadow: '0 0 30px #7b2fbe', letterSpacing: 5,
          }}>ℹ ABOUT</div>
          <button
            onClick={() => { playSfx('uipick'); onClose(); }}
            style={{
              padding: '0.5em 1.4em',
              background: 'linear-gradient(135deg,#5a189a,#3c096c)',
              border: '1px solid #c77dff', color: '#e0aaff',
              fontFamily: "'Cinzel',serif", fontSize: '1em', letterSpacing: 3,
              cursor: 'pointer', borderRadius: 3,
            }}
          >← RETOUR</button>
        </div>

        <Section title="📜 NIGHTFALL SURVIVOR" color="#c77dff">
          <p style={{ margin: 0 }}>
            Mini-jeu de survie type <em>bullet-heaven</em> à la Vampire Survivors,
            développé en React + Phaser 4. Survis 5 minutes dans la nuit éternelle,
            monte en niveau, fais évoluer tes armes et terrasse les boss.
          </p>
        </Section>

        <Section title="🛠 STACK TECHNIQUE" color="#88ddff">
          <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
            <li><strong>Vite 5</strong> + <strong>bun</strong> (build & dev server)</li>
            <li><strong>React 18</strong> (overlays UI, menus)</li>
            <li><strong>Phaser 4</strong> (moteur jeu, canvas, scène)</li>
            <li><strong>Web Audio API</strong> (musique procédurale + SFX)</li>
            <li><strong>vite-plugin-pwa</strong> (offline, installable)</li>
            <li><strong>Vitest + jsdom</strong> (45 tests sur la logique pure)</li>
            <li><strong>localStorage</strong> (méta-progression, achievements, daily)</li>
          </ul>
        </Section>

        <Section title="🎨 CRÉDITS" color="#ffd966">
          <p style={{ margin: 0, marginBottom: '0.35em' }}>
            Code, design et art : <strong style={{ color: '#ffe066' }}>Thomas Couderette</strong>
          </p>
          <p style={{ margin: 0, marginBottom: '0.35em' }}>
            Vibe-codé avec <strong>Claude Code</strong> (Anthropic).
          </p>
          <p style={{ margin: 0 }}>
            Inspirations : <em>Vampire Survivors</em>, <em>Brotato</em>, <em>Halls of Torment</em>,
            <em> Diablo 2</em> (chain lightning, charged bolt).
          </p>
        </Section>

        <Section title="📊 CONTENU" color="#80ffdb">
          <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
            <li><strong>20 armes</strong> + <strong>11 évolutions</strong> mythiques</li>
            <li><strong>14 ennemis</strong> + élites + treasure + <strong>6 boss</strong> multi-phases</li>
            <li><strong>4 biomes</strong> (Cimetière, Forêt, Donjon, Abysses) avec sols texturés et thèmes musicaux</li>
            <li><strong>6 personnages</strong> jouables (déblocages via achievements)</li>
            <li><strong>4 surfaces à effets</strong> (glace, boue, lave, poison)</li>
            <li><strong>15 succès</strong> + stats globales et per-character</li>
            <li><strong>5 modes</strong> + Daily Challenge + Endless</li>
            <li><strong>Multi-joueur</strong> jusqu'à 4 (clavier + manettes)</li>
          </ul>
        </Section>

        <Section title="🐙 CODE SOURCE" color="#88aaff">
          <p style={{ margin: 0 }}>
            <a
              href="https://github.com/altimore/nightfall-survivor"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#88aaff', textDecoration: 'underline' }}
            >github.com/altimore/nightfall-survivor</a>
          </p>
        </Section>

        <div style={{ marginTop: '1em', textAlign: 'center', color: '#b69ad8', fontSize: '0.78em', letterSpacing: 2 }}>
          ÉCHAP / B pour fermer
        </div>
      </div>
    </div>
  );
}
