import { useEffect, useState } from 'react';

export default function BossTitle({ name, onDone }) {
  const [phase, setPhase] = useState('in'); // 'in' | 'hold' | 'out' | 'done'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('out'), 2400);
    const t3 = setTimeout(() => { setPhase('done'); onDone?.(); }, 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [name, onDone]);

  if (phase === 'done') return null;

  const opacity = phase === 'in' ? 0 : phase === 'out' ? 0 : 1;
  const scale = phase === 'in' ? 0.6 : phase === 'out' ? 1.15 : 1;
  const transition = phase === 'in' ? 'opacity .55s ease-out, transform .55s cubic-bezier(.2,.8,.2,1)'
                    : phase === 'out' ? 'opacity .85s ease-in, transform .85s ease-in'
                    : 'opacity .25s, transform .25s';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 22,
    }}>
      <div style={{
        opacity, transform: `scale(${scale})`, transition,
        textAlign: 'center',
        padding: '0 5vw',
      }}>
        <div style={{
          fontFamily: "'Cinzel',serif",
          fontSize: '0.91em', letterSpacing: 16,
          color: '#ff4400',
          textShadow: '0 0 20px #8b0000, 0 0 40px #ff4400',
          marginBottom: 14,
        }}>⚠ BOSS ⚠</div>
        <div style={{
          fontFamily: "'Cinzel Decorative',serif",
          fontSize: '4em', letterSpacing: 4,
          color: '#ffe0d0',
          textShadow: '0 0 30px #8b0000, 0 0 60px #ff4400, 0 4px 0 #1a0000',
          lineHeight: 1.1,
        }}>{name}</div>
        <div style={{
          marginTop: 18,
          width: '40vw', maxWidth: 600, height: 2,
          background: 'linear-gradient(90deg, transparent, #ff4400, transparent)',
          margin: '18px auto 0',
        }}/>
      </div>
    </div>
  );
}
