import { useEffect, useState } from 'react';
import { playSfx } from '../game/audio.js';
import { useGamepadActions } from './useGamepad.js';
import { MenuBg } from './SceneBg.jsx';

// Try to fetch changelog.json (generated at build by vite.config.js).
function fetchChangelog() {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  const url = base.replace(/\/$/, '') + '/changelog.json';
  return fetch(url).then(r => (r.ok ? r.json() : null)).catch(() => null);
}

export default function Changelog({ onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchChangelog().then(d => { if (mounted) setData(d); });
    return () => { mounted = false; };
  }, []);

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

  const entries = data?.entries || [];
  // Group entries by date
  const groups = entries.reduce((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});
  const dates = Object.keys(groups);

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
          }}>📜 CHANGELOG</div>
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

        {data && (
          <div style={{
            background: 'rgba(8,0,22,0.78)',
            border: '1px solid rgba(199,125,255,0.35)',
            borderRadius: 6, padding: '0.8em 1.2em', marginBottom: '1em',
            display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5em',
            fontSize: '0.85em', color: '#d8b8f0', letterSpacing: 1,
          }}>
            <span>Version <strong style={{ color: '#ffe066' }}>{data.version}</strong></span>
            <span>Build <strong style={{ color: '#88ddff' }}>#{data.count}</strong></span>
            <span>Hash <code style={{ color: '#80ffdb' }}>{data.hash}</code></span>
            <span>Date <strong>{data.date}</strong></span>
          </div>
        )}

        {!data && (
          <div style={{ color: '#9d4edd', textAlign: 'center', padding: '2em' }}>
            Chargement...
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6em' }}>
          {dates.map(date => (
            <div key={date} style={{
              background: 'rgba(8,0,22,0.78)',
              border: '1px solid rgba(157,78,221,0.3)',
              borderRadius: 6, padding: '0.7em 1em',
            }}>
              <div style={{
                color: '#c77dff', letterSpacing: 3, fontSize: '0.9em',
                fontFamily: "'Cinzel',serif",
                marginBottom: '0.4em',
                borderBottom: '1px solid rgba(199,125,255,0.2)',
                paddingBottom: '0.25em',
              }}>{date}</div>
              <ul style={{ margin: 0, paddingLeft: '1.4em', color: '#d8b8f0', fontSize: '0.85em', lineHeight: 1.7 }}>
                {groups[date].map(e => (
                  <li key={e.hash}>
                    <span style={{ color: '#80ffdb', fontFamily: 'monospace', fontSize: '0.85em', marginRight: '0.5em' }}>{e.hash}</span>
                    {e.subject}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.2em', textAlign: 'center', color: '#b69ad8', fontSize: '0.8em', letterSpacing: 2 }}>
          ÉCHAP / B pour fermer
        </div>
      </div>
    </div>
  );
}
