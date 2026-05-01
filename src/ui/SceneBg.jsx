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
        <linearGradient id="dg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0418" />
          <stop offset="50%" stopColor="#160828" />
          <stop offset="100%" stopColor="#000004" />
        </linearGradient>
        <radialGradient id="dg-moon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#bca0d0" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#5a3a78" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2a1845" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dg-vignette" cx="50%" cy="50%" r="65%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.95" />
        </radialGradient>
        <linearGradient id="dg-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2855" stopOpacity="0" />
          <stop offset="100%" stopColor="#3a2855" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#dg-sky)" />
      {/* veiled moon — partly hidden by cloud bank */}
      <circle cx="170" cy="140" r="80" fill="url(#dg-moon)" />
      <circle cx="170" cy="140" r="32" fill="#d8c8e8" opacity="0.6" />
      {/* heavy cloud bank across the upper third */}
      <ellipse cx="220" cy="155" rx="200" ry="42" fill="#160a28" opacity="0.85" />
      <ellipse cx="120" cy="170" rx="140" ry="34" fill="#0a0418" opacity="0.92" />
      <ellipse cx="600" cy="120" rx="260" ry="48" fill="#160a28" opacity="0.7" />
      {/* distant ruined skyline (broken towers) */}
      <path d="M 0 440 L 50 440 L 50 380 L 60 380 L 60 360 L 80 360 L 80 380 L 95 380 L 95 440 L 130 440 L 130 410 L 150 410 L 150 440 L 200 440 L 200 350 L 215 340 L 220 350 L 220 440 L 290 440 L 290 400 L 320 400 L 320 380 L 335 380 L 335 360 L 350 380 L 350 440 L 800 440 L 800 600 L 0 600 Z" fill="#080014" opacity="0.95"/>
      <path d="M 360 440 L 360 410 L 380 410 L 380 440 L 440 440 L 440 380 L 460 380 L 470 350 L 480 380 L 500 380 L 500 440 L 580 440 L 580 400 L 620 400 L 620 440 L 800 440 Z" fill="#0e041c" opacity="0.85"/>
      {/* foreground fog */}
      <rect x="0" y="380" width="800" height="220" fill="url(#dg-fog)" />
      {/* fallen cross at center */}
      <g opacity="0.85" transform="translate(400 510) rotate(-15)">
        <rect x="-3" y="-50" width="6" height="80" fill="#1a0e08"/>
        <rect x="-22" y="-30" width="44" height="6" fill="#1a0e08"/>
        <ellipse cx="0" cy="32" rx="34" ry="6" fill="#000" opacity="0.6"/>
      </g>
      {/* a few tilted tombstones in foreground */}
      <g opacity="0.85" transform="translate(120 530) rotate(-7)">
        <path d="M -22 30 L -22 -25 Q 0 -38 22 -25 L 22 30 Z" fill="#0c0c18"/>
        <path d="M -19 28 L -19 -22 Q 0 -33 19 -22 L 19 28 Z" fill="#1a1a28" opacity="0.7"/>
      </g>
      <g opacity="0.85" transform="translate(680 540) rotate(8)">
        <path d="M -20 30 L -20 -22 Q 0 -34 20 -22 L 20 30 Z" fill="#0c0c18"/>
      </g>
      {/* faint distant crows */}
      {[[260,80,1],[330,60,-1],[500,70,1],[600,90,-1]].map(([x,y,d],i)=>(
        <path key={i} d={`M ${x-10*d} ${y} Q ${x-5*d} ${y-6} ${x} ${y} Q ${x+5*d} ${y-6} ${x+10*d} ${y}`} stroke="#000" strokeWidth="1.5" fill="none" opacity="0.55"/>
      ))}
      {/* subtle rain streaks */}
      {Array.from({length: 32}).map((_, i) => {
        const x = (i * 47 + 13) % 800;
        const y = (i * 31 + 17) % 600;
        return <line key={i} x1={x} y1={y} x2={x - 4} y2={y + 18} stroke="#88a0c0" strokeWidth="0.6" opacity="0.18"/>;
      })}
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
