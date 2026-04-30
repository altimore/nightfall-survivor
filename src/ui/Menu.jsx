export default function Menu({ onStart }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(3,0,15,.94)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 30, padding: 20, textAlign: 'center',
    }}>
      <div style={{
        fontSize: 46, fontFamily: "'Cinzel Decorative',serif",
        color: '#c77dff', textShadow: '0 0 40px #7b2fbe,0 0 80px #4a0a80',
        letterSpacing: 3, lineHeight: 1,
      }}>NIGHTFALL</div>
      <div style={{ color: '#7b2fbe', letterSpacing: 10, fontSize: 11, marginTop: 5, marginBottom: 8 }}>SURVIVOR</div>
      <div style={{ color: '#9d4edd', fontSize: 13, marginBottom: 32, letterSpacing: 2 }}>
        Objectif : survivre <strong style={{ color: '#c77dff' }}>5 minutes</strong>
      </div>
      <button onClick={onStart} style={{
        padding: '14px 48px',
        background: 'linear-gradient(135deg,#5a189a,#3c096c)',
        border: '1px solid #c77dff', color: '#e0aaff',
        fontFamily: "'Cinzel',serif", fontSize: 15, letterSpacing: 4,
        cursor: 'pointer', borderRadius: 3,
        boxShadow: '0 0 30px rgba(123,47,190,.5)',
      }}>COMMENCER</button>
      <div style={{ marginTop: 16, color: '#4a1a6a', fontSize: 10, letterSpacing: 2 }}>
        🎮 ZQSD/WASD/Flèches · 📱 Joystick tactile
      </div>
      <div style={{ marginTop: 6, color: '#4a1a6a', fontSize: 9, letterSpacing: 1 }}>
        v0.2 · MVP Phaser 4 · Dague auto · Ennemis : Chauve-souris, Zombie, Squelette, Chevalier
      </div>
    </div>
  );
}
