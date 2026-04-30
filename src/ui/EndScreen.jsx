const fmt = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

export default function EndScreen({ phase, hud, onRestart, onMenu }) {
  const win = phase === 'victory';
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: win ? 'rgba(0,5,20,.95)' : 'rgba(2,0,8,.94)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 30, padding: 20, textAlign: 'center',
    }}>
      <div style={{
        fontFamily: "'Cinzel Decorative',serif",
        fontSize: 42,
        color: win ? '#ffe066' : '#ff0040',
        textShadow: win ? '0 0 40px #ffb300,0 0 80px #ff8800' : '0 0 40px #8b0000',
        marginBottom: 6,
      }}>{win ? 'VICTOIRE' : 'VAINCU'}</div>
      <div style={{ color: '#c77dff', letterSpacing: 2, fontSize: 13, marginBottom: 6 }}>
        {win ? 'Vous avez survécu 5 minutes !' : `${fmt(hud.t || 0)} / ${fmt(hud.goal || 300)}`}
      </div>
      <div style={{ color: '#9d4edd', fontSize: 12, marginBottom: 24 }}>
        ☠ {hud.kills || 0} ennemis vaincus
      </div>
      <button onClick={onRestart} style={{
        padding: '13px 44px',
        background: win
          ? 'linear-gradient(135deg,#3c096c,#5a189a)'
          : 'linear-gradient(135deg,#8b0000,#4d0020)',
        border: `1px solid ${win ? '#c77dff' : '#ff004055'}`,
        color: win ? '#e0aaff' : '#ffaaaa',
        fontFamily: "'Cinzel',serif", fontSize: 14, letterSpacing: 3,
        cursor: 'pointer', borderRadius: 3,
        boxShadow: win ? '0 0 20px rgba(199,125,255,.4)' : 'none',
      }}>{win ? 'REJOUER' : 'RECOMMENCER'}</button>
      <button onClick={onMenu} style={{
        marginTop: 10, padding: '8px 28px',
        background: 'transparent', border: '1px solid #3c096c',
        color: '#6c3483', fontFamily: "'Cinzel',serif",
        fontSize: 11, letterSpacing: 3, cursor: 'pointer', borderRadius: 3,
      }}>MENU</button>
    </div>
  );
}
