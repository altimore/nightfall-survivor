// Procedural decorative backgrounds for full-screen overlays (menu / victory / defeat).
// Each is a single absolutely-positioned <svg> rendered behind the screen content.

const baseStyle = {
  position: 'absolute', inset: 0,
  width: '100%', height: '100%',
  zIndex: -1, pointerEvents: 'none',
  display: 'block',
};

export function MenuBg() {
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" style={baseStyle}>
      <defs>
        <radialGradient id="mg-sky" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#2a0a4a" />
          <stop offset="55%" stopColor="#0e0220" />
          <stop offset="100%" stopColor="#000008" />
        </radialGradient>
        <radialGradient id="mg-moon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#e9d8ff" />
          <stop offset="100%" stopColor="#9a6dc4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mg-mist" cx="50%" cy="100%" r="80%">
          <stop offset="0%" stopColor="#5a189a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#5a189a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mg-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06000c" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#mg-sky)" />
      {/* moon */}
      <circle cx="640" cy="120" r="100" fill="url(#mg-moon)" />
      <circle cx="640" cy="120" r="42" fill="#fffae8" opacity="0.9" />
      <circle cx="624" cy="108" r="6" fill="#d8c5b0" opacity="0.4" />
      <circle cx="652" cy="135" r="9" fill="#d8c5b0" opacity="0.3" />
      {/* stars */}
      {[
        [60,80],[140,40],[260,70],[340,30],[480,90],[760,200],[80,180],[420,140],[180,260],[720,310],[40,300],[300,200],[540,180],[520,340],[100,440],
      ].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={i%3===0?1.6:1} fill="#e0d0ff" opacity={0.5+(i%4)*0.12} />
      ))}
      {/* distant hills */}
      <path d="M 0 460 Q 200 380 400 440 T 800 410 L 800 600 L 0 600 Z" fill="#0c0418" opacity="0.85"/>
      {/* mist */}
      <rect x="0" y="380" width="800" height="220" fill="url(#mg-mist)" />
      {/* ground */}
      <rect x="0" y="500" width="800" height="100" fill="url(#mg-ground)" />
      {/* dead trees */}
      {[[80,510],[720,505],[180,520]].map(([x,y],i)=>(
        <g key={i} stroke="#1a0d05" strokeWidth="3" fill="none" opacity="0.85">
          <line x1={x} y1={y} x2={x} y2={y-110} />
          <line x1={x} y1={y-60} x2={x-26} y2={y-90} />
          <line x1={x-26} y1={y-90} x2={x-32} y2={y-70} />
          <line x1={x} y1={y-80} x2={x+24} y2={y-105} />
          <line x1={x+24} y1={y-105} x2={x+34} y2={y-90} />
          <line x1={x} y1={y-100} x2={x-12} y2={y-130} />
        </g>
      ))}
      {/* tombstones */}
      {[[260,540,30,38],[330,548,22,28],[420,545,28,32],[490,540,32,40],[600,548,24,30]].map(([x,y,w,h],i)=>(
        <g key={i} opacity="0.75">
          <ellipse cx={x} cy={y+h*0.55} rx={w*0.7} ry={w*0.18} fill="#000" opacity="0.5"/>
          <path d={`M ${x-w/2} ${y+h*0.5} L ${x-w/2} ${y-h*0.4} Q ${x} ${y-h*0.7} ${x+w/2} ${y-h*0.4} L ${x+w/2} ${y+h*0.5} Z`} fill="#1a1a25"/>
          <path d={`M ${x-w/2+3} ${y+h*0.45} L ${x-w/2+3} ${y-h*0.35} Q ${x} ${y-h*0.6} ${x+w/2-3} ${y-h*0.35} L ${x+w/2-3} ${y+h*0.45} Z`} fill="#2a2a3a" opacity="0.7"/>
          {/* engraved cross */}
          <rect x={x-1} y={y-h*0.45} width="2" height={h*0.4} fill="#0a0a14"/>
          <rect x={x-5} y={y-h*0.3} width="10" height="2" fill="#0a0a14"/>
        </g>
      ))}
      {/* crosses */}
      {[[160,540],[380,535],[560,540],[680,538]].map(([x,y],i)=>(
        <g key={i} opacity="0.8">
          <rect x={x-1.5} y={y-50} width="3" height="60" fill="#0a0008"/>
          <rect x={x-12} y={y-32} width="24" height="3" fill="#0a0008"/>
        </g>
      ))}
      {/* foreground mist sweep */}
      <ellipse cx="400" cy="560" rx="500" ry="60" fill="#5a189a" opacity="0.18" />
    </svg>
  );
}

export function DefeatBg() {
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" style={baseStyle}>
      <defs>
        <radialGradient id="dg-sky" cx="50%" cy="40%" r="90%">
          <stop offset="0%" stopColor="#5a0410" />
          <stop offset="40%" stopColor="#2a0008" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <radialGradient id="dg-vignette" cx="50%" cy="50%" r="60%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#dg-sky)" />
      {/* blood splashes */}
      {[[120,90,90],[680,70,70],[60,400,140],[700,420,120],[400,560,160]].map(([x,y,r],i)=>(
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r*0.6} fill="#7b0010" opacity="0.4"/>
      ))}
      {/* crows silhouettes */}
      {[[180,140,1],[260,100,-1],[600,160,1],[520,80,-1],[700,200,1]].map(([x,y,d],i)=>(
        <path key={i} d={`M ${x-12*d} ${y} Q ${x-6*d} ${y-8} ${x} ${y} Q ${x+6*d} ${y-8} ${x+12*d} ${y}`} stroke="#000" strokeWidth="2" fill="none" opacity="0.6"/>
      ))}
      {/* ground */}
      <rect x="0" y="480" width="800" height="120" fill="#0a0004" />
      {/* broken weapon (cross-like in ground) */}
      <g opacity="0.6">
        <rect x="395" y="470" width="6" height="50" fill="#3a1a10"/>
        <rect x="378" y="478" width="40" height="6" fill="#3a1a10"/>
      </g>
      {/* fallen tombstones */}
      <g opacity="0.7">
        <path d="M 100 510 L 230 540 L 230 580 L 100 555 Z" fill="#1a1a25"/>
        <path d="M 540 520 L 700 555 L 700 590 L 540 568 Z" fill="#1a1a25"/>
      </g>
      {/* falling embers */}
      {[[100,200],[200,300],[300,250],[450,180],[550,320],[650,260],[700,150]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={1.5+(i%2)} fill="#ff4400" opacity={0.5+(i%3)*0.12} />
      ))}
      {/* vignette */}
      <rect width="800" height="600" fill="url(#dg-vignette)" />
    </svg>
  );
}

export function VictoryBg() {
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" style={baseStyle}>
      <defs>
        <radialGradient id="vg-sky" cx="50%" cy="60%" r="90%">
          <stop offset="0%" stopColor="#4a1a8a" />
          <stop offset="40%" stopColor="#2a0a55" />
          <stop offset="100%" stopColor="#080018" />
        </radialGradient>
        <radialGradient id="vg-glow" cx="50%" cy="55%" r="35%">
          <stop offset="0%" stopColor="#fff8d0" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#ffb347" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#5a189a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vg-ray" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#fff5b0" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#fff5b0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#vg-sky)" />
      {/* light rays */}
      {[-30,-15,0,15,30].map((deg,i)=>(
        <rect key={i} x="380" y="-100" width="40" height="800" fill="url(#vg-ray)" transform={`rotate(${deg} 400 330)`} opacity="0.55" />
      ))}
      {/* central glow */}
      <circle cx="400" cy="330" r="220" fill="url(#vg-glow)" />
      {/* gold particles */}
      {[
        [120,180],[200,140],[300,200],[500,150],[610,180],[700,250],[80,300],
        [180,280],[280,320],[360,90],[440,110],[520,290],[600,330],[700,140],
        [140,400],[260,420],[380,470],[480,440],[580,460],[680,400],
      ].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={1.5+(i%3)*1.2} fill={i%2?'#ffe066':'#ffb347'} opacity={0.4+(i%4)*0.15} />
      ))}
      {/* horizon */}
      <ellipse cx="400" cy="460" rx="500" ry="40" fill="#ffd070" opacity="0.18" />
      {/* distant ruins silhouette */}
      <path d="M 0 480 L 60 460 L 100 470 L 160 440 L 200 460 L 280 430 L 320 470 L 400 420 L 460 460 L 540 430 L 600 470 L 680 450 L 740 470 L 800 460 L 800 600 L 0 600 Z" fill="#0a0418" opacity="0.85"/>
    </svg>
  );
}
