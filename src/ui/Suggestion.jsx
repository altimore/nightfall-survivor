import { useEffect, useState } from 'react';
import { playSfx } from '../game/audio.js';
import { useGamepadActions } from './useGamepad.js';
import { MenuBg } from './SceneBg.jsx';

const REPO_URL = 'https://github.com/altimore/nightfall-survivor';
const CONTACT_EMAIL = 'thomas.couderette@sodibur.com';

export default function Suggestion({ onClose }) {
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        playSfx('uipick');
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useGamepadActions({ back: () => { playSfx('uipick'); onClose(); } });

  const buildBody = () => {
    let body = `[Nightfall Survivor — Suggestion]\n\n`;
    body += text.trim() + '\n\n';
    if (email.trim()) {
      body += `---\nMe prévenir si implémenté : ${email.trim()}\n`;
    }
    body += `Build : ${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'} (${typeof __APP_HASH__ !== 'undefined' ? __APP_HASH__ : 'dev'})`;
    return body;
  };

  const sendByEmail = () => {
    if (!text.trim()) return;
    playSfx('uipick');
    const subj = encodeURIComponent('Nightfall Survivor — Suggestion');
    const body = encodeURIComponent(buildBody());
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subj}&body=${body}`;
    setSent(true);
  };

  const sendToGitHub = () => {
    if (!text.trim()) return;
    playSfx('uipick');
    const title = encodeURIComponent('[Suggestion] ' + text.slice(0, 60));
    const body = encodeURIComponent(buildBody());
    const url = `${REPO_URL}/issues/new?labels=suggestion&title=${title}&body=${body}`;
    window.open(url, '_blank', 'noopener');
    setSent(true);
  };

  const valid = text.trim().length >= 5;

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
      <div style={{ position: 'relative', width: '100%', maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1em', flexWrap: 'wrap', gap: '0.5em' }}>
          <div style={{
            fontFamily: "'Cinzel Decorative',serif", fontSize: '2em',
            color: '#c77dff', textShadow: '0 0 30px #7b2fbe', letterSpacing: 4,
          }}>💡 SUGGESTION</div>
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

        <div style={{
          background: 'rgba(8,0,22,0.85)',
          border: '1px solid rgba(199,125,255,0.4)',
          borderRadius: 8, padding: '1.4em',
          boxShadow: '0 0 28px rgba(123,47,190,0.4)',
        }}>
          <div style={{ color: '#d8b8f0', fontSize: '0.9em', lineHeight: 1.55, marginBottom: '1em' }}>
            Tu as une idée de fonctionnalité, un retour, ou un bug à signaler ? Décris-le ci-dessous.
            Tu peux laisser ton email (facultatif) pour être prévenu si l'idée est implémentée.
          </div>

          <label style={{ display: 'block', marginBottom: 6, color: '#c77dff', fontSize: '0.85em', letterSpacing: 2 }}>
            ✍ Ta suggestion
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={6}
            placeholder="Décris ton idée — nouveau pouvoir, mode de jeu, mécanique, retour d'équilibrage…"
            style={{
              width: '100%',
              background: 'rgba(3,0,15,0.85)',
              border: '1px solid #6c3483',
              color: '#e0aaff',
              padding: '0.6em 0.8em', borderRadius: 4,
              fontFamily: "'Cinzel',serif", fontSize: '0.92em',
              resize: 'vertical', minHeight: '6em',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <label style={{ display: 'block', marginTop: '1em', marginBottom: 6, color: '#c77dff', fontSize: '0.85em', letterSpacing: 2 }}>
            📧 Email (facultatif)
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="ton@email.com — pour être prévenu si implémenté"
            style={{
              width: '100%',
              background: 'rgba(3,0,15,0.85)',
              border: '1px solid #6c3483',
              color: '#e0aaff',
              padding: '0.55em 0.8em', borderRadius: 4,
              fontFamily: "'Cinzel',serif", fontSize: '0.92em',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ marginTop: '1.2em', display: 'flex', gap: '0.6em', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={sendByEmail}
              onMouseDown={e => e.preventDefault()}
              tabIndex={-1}
              disabled={!valid}
              style={{
                padding: '0.7em 1.5em',
                background: valid ? 'linear-gradient(135deg,#5a189a,#3c096c)' : 'rgba(40,20,60,0.6)',
                border: `1px solid ${valid ? '#c77dff' : '#4a1d6a'}`,
                color: valid ? '#e0aaff' : '#6a3a8a',
                fontFamily: "'Cinzel',serif", fontSize: '0.95em', letterSpacing: 2,
                cursor: valid ? 'pointer' : 'not-allowed', borderRadius: 4,
                opacity: valid ? 1 : 0.6,
                touchAction: 'manipulation',
              }}>📧 ENVOYER PAR EMAIL</button>
            <button
              onClick={sendToGitHub}
              onMouseDown={e => e.preventDefault()}
              tabIndex={-1}
              disabled={!valid}
              style={{
                padding: '0.7em 1.5em',
                background: valid ? 'linear-gradient(135deg,#1a1a2a,#0a0a14)' : 'rgba(20,20,30,0.6)',
                border: `1px solid ${valid ? '#88aaff' : '#2a3050'}`,
                color: valid ? '#88aaff' : '#3a4070',
                fontFamily: "'Cinzel',serif", fontSize: '0.95em', letterSpacing: 2,
                cursor: valid ? 'pointer' : 'not-allowed', borderRadius: 4,
                opacity: valid ? 1 : 0.6,
                touchAction: 'manipulation',
              }}>🐙 ISSUE GITHUB</button>
          </div>

          {sent && (
            <div style={{
              marginTop: '1em', textAlign: 'center',
              padding: '0.6em',
              background: 'rgba(40,80,40,0.4)',
              border: '1px solid #66dd44',
              borderRadius: 4,
              color: '#aaffaa', fontSize: '0.85em', letterSpacing: 1,
            }}>✓ Merci pour ta suggestion ! Si c'est implémenté tu seras prévenu (si email fourni).</div>
          )}
        </div>

        <div style={{ marginTop: '1em', textAlign: 'center', color: '#b69ad8', fontSize: '0.78em', letterSpacing: 2 }}>
          ÉCHAP pour fermer · 2 canaux : email direct ou issue GitHub publique
        </div>
      </div>
    </div>
  );
}
