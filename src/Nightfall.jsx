import { useState, useEffect, useRef, useCallback } from "react";

const W = 800, H = 500;
const GOAL_TIME = 300; // 5 minutes to survive

// ════════════════════════════════════════
// SKILLS
// ════════════════════════════════════════
const SKILLS = {
  dagger:    { name:"Dague Spectrale",   icon:"🗡️", color:"#a0c4ff", type:"weapon",  max:5, desc:["Lance 1 dague/s vers l'ennemi le plus proche","Tire 2 dagues simultanément","Cadence ×1.5","3 dagues + dégâts +50%","Les dagues percent tous les ennemis"] },
  nova:      { name:"Nova de Feu",        icon:"🔥", color:"#ff6b35", type:"weapon",  max:5, desc:["Explosion autour du joueur toutes les 2s","Rayon +40%","Dégâts ×1.5","Cadence ×1.5","Rayon ×2, repousse les ennemis"] },
  lightning: { name:"Foudre Maudite",     icon:"⚡", color:"#ffe066", type:"weapon",  max:5, desc:["Frappe l'ennemi le plus proche/1.5s","Rebondit sur 1 ennemi","Cadence ×1.5","Rebondit sur 3 ennemis","Chaîne illimitée"] },
  heart:     { name:"Cœur des Ténèbres",  icon:"🖤", color:"#ff4d6d", type:"passive", max:3, desc:["+50 PV max + régénération","+50 PV max, regen ×2","+80 PV max, soigne 15% au lvl up"] },
  boots:     { name:"Bottes du Néant",    icon:"👢", color:"#80ffdb", type:"passive", max:3, desc:["+25% vitesse","+25% vitesse + Dash (2ème doigt)","Vitesse ×2, invincible en dash"] },
  amulet:    { name:"Amulette du Sang",   icon:"🔮", color:"#ff6b9d", type:"passive", max:3, desc:["+20% dégâts + vol de vie 5%","+20% dégâts + vol de vie 15%","+40% dégâts, soin au kill"] },
  tome:      { name:"Grimoire Interdit",  icon:"📜", color:"#ffb347", type:"passive", max:3, desc:["+30% XP gagnée","+30% XP + attraction des orbes","XP ×2 + zone géante"] },
};

// ════════════════════════════════════════
// ENEMY TYPES
// ════════════════════════════════════════
const ETYPES = {
  bat:      { label:"Chauve-Souris", col:"#6a0dad", eyeCol:"#ff0", size:6,  baseHp:10,  baseSpd:58, dmg:4,  xpVal:1, behavior:"wavy",   wave:0  },
  zombie:   { label:"Zombie",        col:"#3a6b20", eyeCol:"#f80", size:12, baseHp:50,  baseSpd:24, dmg:8,  xpVal:3, behavior:"direct",  wave:30 },
  skeleton: { label:"Squelette",     col:"#c8c8b0", eyeCol:"#f00", size:10, baseHp:35,  baseSpd:32, dmg:6,  xpVal:4, behavior:"ranged",  wave:60 },
  ghost:    { label:"Fantôme",       col:"#8888ff", eyeCol:"#0ff", size:11, baseHp:28,  baseSpd:28, dmg:10, xpVal:4, behavior:"phase",   wave:90 },
  knight:   { label:"Chevalier",     col:"#8b4513", eyeCol:"#f00", size:15, baseHp:100, baseSpd:18, dmg:18, xpVal:7, behavior:"charge",  wave:120 },
  witch:    { label:"Sorcière",      col:"#9932cc", eyeCol:"#0f0", size:10, baseHp:40,  baseSpd:38, dmg:7,  xpVal:5, behavior:"kite",    wave:150 },
  boss:     { label:"BOSS",          col:"#8b0000", eyeCol:"#ff0", size:28, baseHp:600, baseSpd:26, dmg:22, xpVal:60, behavior:"boss",   wave:-1 },
};

// Wave schedule: {time, type, count}
const WAVES = [
  { t:0,   type:'bat',      count:3 },
  { t:30,  type:'zombie',   count:2 },
  { t:60,  type:'skeleton', count:2, boss:true },
  { t:90,  type:'ghost',    count:2 },
  { t:120, type:'knight',   count:2, boss:true },
  { t:150, type:'witch',    count:2 },
  { t:180, type:'bat',      count:5, boss:true },
  { t:210, type:'skeleton', count:3 },
  { t:240, type:'knight',   count:3, boss:true },
  { t:270, type:'witch',    count:3 },
];

const XP_TABLE = [0,20,50,90,140,200,270,360,460,580,720,880,1060,1260,1500,1780,2110,2500,2960,3500];
const xpFor = lv => XP_TABLE[Math.min(lv, XP_TABLE.length-1)] || lv*300+4000;
const slv = (g, id) => g.player.skills[id] || 0;

function refreshStats(g) {
  const p=g.player, h=slv(g,'heart'), b=slv(g,'boots'), a=slv(g,'amulet'), t=slv(g,'tome');
  p.speed  = 165*(b>=3?2:b>=2?1.5:b>=1?1.25:1);
  p.dmgM   = 1+(a>=3?0.6:a>=2?0.4:a>=1?0.2:0);
  p.xpM    = 1+(t>=3?1:t>=2?0.6:t>=1?0.3:0);
  p.magnet = t>=3?210:t>=2?130:60;
  p.regen  = h>=2?5:h>=1?2:0;
  p.canDash= b>=2;
  p.ls     = a>=2?0.1:a>=1?0.05:0;
  p.kh     = a>=3;
}

function getChoices(g) {
  const ids = Object.keys(SKILLS).filter(id => slv(g,id) < SKILLS[id].max);
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  return ids.slice(0, Math.min(3, ids.length));
}

function spawnEnemyOfType(g, typeName, speedMult=1) {
  const a = Math.random()*Math.PI*2, dist = Math.max(W,H)*0.58;
  const et = ETYPES[typeName];
  const tier = Math.floor(g.time/60);
  const hp = et.baseHp * (1 + tier*0.3);
  const speed = et.baseSpd * speedMult;
  const e = {
    x: W/2+Math.cos(a)*dist, y: H/2+Math.sin(a)*dist,
    hp, maxHp:hp, speed, size:et.size, type:typeName,
    dmg:et.dmg*(1+tier*0.1), xpVal:et.xpVal,
    vx:0, vy:0, iframes:0,
    // behavior state
    angle:0, waveSide:0, chargeTimer:3+Math.random()*2,
    charging:false, chargeDx:0, chargeDy:0, chargeDur:0,
    shootTimer:1.5+Math.random(), kiteDist:180+Math.random()*60,
    opacity:1,
  };
  if(typeName==='boss') e.phase=0; // boss phases
  g.enemies.push(e);
}

// ════════════════════════════════════════
// AUDIO
// ════════════════════════════════════════
function initAudio() {
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  const master = ctx.createGain(); master.gain.value=0.32;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value=-18; comp.ratio.value=4;
  master.connect(comp); comp.connect(ctx.destination);
  return {ctx, master};
}
function tone(a,freq,type,atk,sus,rel,vol=0.3,off=0){
  const t=a.ctx.currentTime+off, o=a.ctx.createOscillator(), e=a.ctx.createGain();
  o.type=type; o.frequency.value=freq;
  e.gain.setValueAtTime(0,t); e.gain.linearRampToValueAtTime(vol,t+atk);
  e.gain.setValueAtTime(vol,t+atk+sus); e.gain.linearRampToValueAtTime(0,t+atk+sus+rel);
  o.connect(e); e.connect(a.master); o.start(t); o.stop(t+atk+sus+rel+0.01);
}
function noiseBlast(a,dur,vol=0.2,hp=500,off=0){
  const t=a.ctx.currentTime+off, sr=a.ctx.sampleRate;
  const buf=a.ctx.createBuffer(1,Math.floor(sr*dur),sr), d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  const src=a.ctx.createBufferSource(); src.buffer=buf;
  const f=a.ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp;
  const e=a.ctx.createGain(); e.gain.setValueAtTime(vol,t); e.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(f); f.connect(e); e.connect(a.master); src.start(t); src.stop(t+dur+0.01);
}
const SFX = {
  dagger:   a=>{tone(a,900,'sawtooth',.005,.01,.08,.12);noiseBlast(a,.07,.08,3000);},
  nova:     a=>{tone(a,55,'sine',.01,.08,.5,.45);noiseBlast(a,.35,.35,80);tone(a,110,'sawtooth',.01,.05,.3,.18);},
  lightning:a=>{noiseBlast(a,.18,.45,1200);tone(a,330,'square',.001,.04,.1,.1);},
  hit:      a=>{tone(a,180,'sawtooth',.001,.04,.25,.35);noiseBlast(a,.18,.22,250);},
  death:    a=>{tone(a,280,'sawtooth',.001,.02,.18,.22);noiseBlast(a,.1,.12,600);},
  xp:       a=>{tone(a,1047,'sine',.005,.02,.09,.09);tone(a,1319,'sine',.01,.02,.07,.07);},
  levelup:  a=>{[261,330,392,523,659].forEach((f,i)=>tone(a,f,'sine',.01,.08,.25,.32,i*.07));},
  boss:     a=>{tone(a,55,'sawtooth',.05,.3,.8,.5);noiseBlast(a,.5,.4,60);},
  victory:  a=>{[392,494,587,784].forEach((f,i)=>tone(a,f,'sine',.01,.15,.3,.4,i*.1));},
  gameover: a=>{[392,349,311,261,220].forEach((f,i)=>tone(a,f,'sawtooth',.01,.15,.4,.28,i*.18));},
  projhit:  a=>{noiseBlast(a,.06,.15,1500);},
};
const HAP = {
  hit:()=>navigator.vibrate?.([40,20,40]),
  death:()=>navigator.vibrate?.(15),
  nova:()=>navigator.vibrate?.([60,20,30]),
  levelup:()=>navigator.vibrate?.([30,50,30,50,80]),
  boss:()=>navigator.vibrate?.([100,30,100,30,150]),
  gameover:()=>navigator.vibrate?.([100,50,100,50,200]),
  victory:()=>navigator.vibrate?.([50,30,50,30,50,30,200]),
};
const MUSIC_BPM=95, BEAT_S=60/MUSIC_BPM;
const BASS_SEQ=[55,55,49,52,55,49,52,55];
const PAD_CHORDS=[[110,138,165],[98,123,147],[104,131,156],[110,131,165]];
function startMusic(a,ref){
  let step=0,nextT=a.ctx.currentTime+0.05;
  function schedule(){
    while(nextT<a.ctx.currentTime+0.4){
      const s=step%32;
      if(s%4===0||s===10||s===22) tone(a,BASS_SEQ[Math.floor(s/4)%BASS_SEQ.length],'triangle',.04,BEAT_S*.6,BEAT_S*.4,.38,nextT-a.ctx.currentTime);
      if(s%8===0) tone(a,BASS_SEQ[Math.floor(s/8)%4]*0.5,'sine',.1,BEAT_S*3,BEAT_S,.22,nextT-a.ctx.currentTime);
      noiseBlast(a,.04,s%2===0?.06:.03,9000,nextT-a.ctx.currentTime);
      if(s%8===4||s%8===12) noiseBlast(a,.12,.14,800,nextT-a.ctx.currentTime);
      if(s%16===0){const c=PAD_CHORDS[Math.floor(step/16)%4];c.forEach(f=>tone(a,f,'sine',.4,BEAT_S*5,BEAT_S*2,.05,nextT-a.ctx.currentTime));}
      nextT+=BEAT_S/2; step++;
    }
    ref.current=setTimeout(schedule,120);
  }
  schedule();
}
function stopMusic(ref){if(ref.current){clearTimeout(ref.current);ref.current=null;}}

// ════════════════════════════════════════
// RENDER
// ════════════════════════════════════════
function render(ctx, g) {
  const p=g.player, j=g.joystick;
  ctx.fillStyle='#060011'; ctx.fillRect(0,0,W,H);

  // hex grid (scrolls)
  const ox=(p.x*0.55%80+80)%80, oy=(p.y*0.55%70+70)%70;
  ctx.save(); ctx.strokeStyle='rgba(60,0,95,0.18)'; ctx.lineWidth=1;
  for(let x=-ox-80;x<W+80;x+=80) for(let y=-oy-70;y<H+70;y+=70){
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6;ctx.lineTo(x+28*Math.cos(a),y+28*Math.sin(a));}
    ctx.closePath(); ctx.stroke();
  }
  ctx.restore();

  // footprints
  g.particles.filter(fp=>fp.type==='footprint').forEach(fp=>{
    const al=Math.max(0,(fp.life/fp.maxLife)*0.45);
    ctx.save(); ctx.globalAlpha=al; ctx.shadowBlur=6; ctx.shadowColor='#7b2fbe'; ctx.fillStyle='#5a189a';
    ctx.beginPath(); ctx.ellipse(fp.x,fp.y,5,3,fp.angle||0,0,Math.PI*2); ctx.fill(); ctx.restore();
  });

  // enemy projectiles
  g.xpOrbs.forEach(o=>{
    ctx.save(); ctx.shadowBlur=10; ctx.shadowColor='#00ff88'; ctx.fillStyle='#00ff88';
    ctx.beginPath(); ctx.arc(o.x,o.y,4,0,Math.PI*2); ctx.fill(); ctx.restore();
  });

  // nova indicator
  if(slv(g,'nova')>0){
    const lv=slv(g,'nova'),r=(80+lv*25)*(lv>=5?1.5:1),interval=lv>=4?1.2:2;
    const pct=Math.max(0,1-(g.wt.nova||0)/interval);
    ctx.save(); ctx.globalAlpha=pct*0.11; ctx.fillStyle='#ff6b35';
    ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=0.16; ctx.strokeStyle='#ff6b35'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.stroke(); ctx.restore();
  }
  if(slv(g,'tome')>=2){
    ctx.save(); ctx.globalAlpha=0.07; ctx.strokeStyle='#ffb347'; ctx.lineWidth=1; ctx.setLineDash([4,7]);
    ctx.beginPath(); ctx.arc(p.x,p.y,p.magnet,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }

  // enemy projectiles
  g.eprojectiles.forEach(ep=>{
    ctx.save(); ctx.shadowBlur=8; ctx.shadowColor=ep.col||'#ff8800';
    ctx.fillStyle=ep.col||'#ff8800'; ctx.globalAlpha=0.9;
    ctx.beginPath(); ctx.arc(ep.x,ep.y,ep.r||5,0,Math.PI*2); ctx.fill(); ctx.restore();
  });

  // enemies
  g.enemies.forEach(e=>{
    const et=ETYPES[e.type], hp_=e.hp/e.maxHp;
    ctx.save();
    ctx.globalAlpha = e.type==='ghost' ? 0.5+hp_*0.4 : 1;
    ctx.shadowBlur=e.type==='boss'?20:10; ctx.shadowColor=et.col;
    ctx.fillStyle=`hsl(${parseInt(et.col.slice(1),16)%360},70%,${18+hp_*15}%)`;
    ctx.beginPath(); ctx.arc(e.x,e.y,e.size,0,Math.PI*2); ctx.fill();
    // charge indicator
    if(e.type==='knight'&&!e.charging&&e.chargeTimer<1){
      ctx.strokeStyle='#ff4400'; ctx.lineWidth=2; ctx.globalAlpha=1-e.chargeTimer;
      ctx.beginPath(); ctx.arc(e.x,e.y,e.size+6,0,Math.PI*2); ctx.stroke();
    }
    ctx.restore();
    // eyes
    ctx.fillStyle=et.eyeCol||'#ff0';
    ctx.beginPath(); ctx.arc(e.x-e.size*.3,e.y-e.size*.2,e.size*.18,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.x+e.size*.3,e.y-e.size*.2,e.size*.18,0,Math.PI*2); ctx.fill();
    // HP bar
    if(e.size>12){
      ctx.fillStyle='#300'; ctx.fillRect(e.x-22,e.y-e.size-8,44,4);
      ctx.fillStyle= e.type==='boss'?'#ff4400':'#f00'; ctx.fillRect(e.x-22,e.y-e.size-8,44*hp_,4);
    }
    // BOSS label
    if(e.type==='boss'){
      ctx.fillStyle='#ff4400'; ctx.font='bold 9px sans-serif'; ctx.textAlign='center';
      ctx.fillText('⚠ BOSS',e.x,e.y-e.size-12);
    }
  });

  // items on ground (rendered after enemies so crash here doesn't hide them)
  if(g.items) g.items.forEach(item=>{
    const it=ITEMS[item.type], fade=Math.min(1,item.life/2);
    const bobY=Math.sin(item.bob)*5;
    ctx.save();
    ctx.globalAlpha=fade;
    ctx.shadowBlur=16; ctx.shadowColor=it.col;
    ctx.strokeStyle=it.col; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(item.x,item.y+bobY,16,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=fade*0.15;
    ctx.fillStyle=it.col;
    ctx.beginPath(); ctx.arc(item.x,item.y+bobY,16,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=fade;
    ctx.shadowBlur=0;
    ctx.font='16px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(it.icon,item.x,item.y+bobY);
    ctx.globalAlpha=fade*0.7; ctx.fillStyle=it.col;
    ctx.fillRect(item.x-14,item.y+bobY+20,28*(item.life/item.maxLife),3);
    ctx.restore();
  });

  // player projectiles
  g.projectiles.forEach(proj=>{
    if(proj.type==='dagger'){
      const ang=Math.atan2(proj.dy,proj.dx);
      ctx.save(); ctx.translate(proj.x,proj.y); ctx.rotate(ang);
      ctx.fillStyle='#a0c4ff'; ctx.shadowBlur=8; ctx.shadowColor='#a0c4ff';
      ctx.fillRect(-12,-2,24,4); ctx.restore();
    }
  });

  // particles
  g.particles.forEach(par=>{
    if(par.type==='footprint')return;
    const al=Math.max(0,par.life/par.maxLife);
    if(par.type==='bolt'){
      ctx.save(); ctx.strokeStyle=`rgba(255,230,0,${al})`; ctx.lineWidth=2; ctx.shadowBlur=12; ctx.shadowColor='#ffe066';
      ctx.beginPath(); ctx.moveTo(par.x1,par.y1);
      ctx.quadraticCurveTo((par.x1+par.x2)/2+(Math.random()-.5)*28,(par.y1+par.y2)/2+(Math.random()-.5)*28,par.x2,par.y2);
      ctx.stroke(); ctx.restore();
    } else {
      ctx.save(); ctx.globalAlpha=al; ctx.fillStyle=par.col||'#fff'; ctx.shadowBlur=5; ctx.shadowColor=par.col||'#fff';
      ctx.beginPath(); ctx.arc(par.x,par.y,Math.max(.5,par.r*al),0,Math.PI*2); ctx.fill(); ctx.restore();
    }
  });

  // player
  const flash=p.iframes>0&&Math.floor(p.iframes*12)%2===0;
  if(!flash){
    ctx.save(); ctx.shadowBlur=20; ctx.shadowColor='#9d4edd';
    ctx.fillStyle='#1e0a3c'; ctx.beginPath(); ctx.arc(p.x,p.y,15,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#3b1078'; ctx.beginPath(); ctx.arc(p.x,p.y,13,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.fillStyle='#e0b896'; ctx.beginPath(); ctx.arc(p.x,p.y-3,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff0040'; ctx.shadowBlur=6; ctx.shadowColor='#ff0040';
    ctx.beginPath(); ctx.arc(p.x-3,p.y-4,2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x+3,p.y-4,2,0,Math.PI*2); ctx.fill();
    ctx.restore();
    if(p.canDash&&p.dashCD<=0){
      ctx.save(); ctx.strokeStyle='rgba(128,255,219,0.35)'; ctx.lineWidth=1; ctx.setLineDash([3,5]);
      ctx.beginPath(); ctx.arc(p.x,p.y,22,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }
  }

  // joystick
  if(j&&j.active){
    ctx.save();
    ctx.globalAlpha=.28; ctx.strokeStyle='#c77dff'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(j.baseX,j.baseY,55,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=.08; ctx.fillStyle='#7b2fbe';
    ctx.beginPath(); ctx.arc(j.baseX,j.baseY,55,0,Math.PI*2); ctx.fill();
    if(j.dx!==0||j.dy!==0){
      ctx.globalAlpha=.2; ctx.strokeStyle='#c77dff'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(j.baseX,j.baseY); ctx.lineTo(j.baseX+j.dx*55,j.baseY+j.dy*55); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.globalAlpha=.5; ctx.fillStyle='#9d4edd'; ctx.shadowBlur=14; ctx.shadowColor='#c77dff';
    ctx.beginPath(); ctx.arc(j.thumbX,j.thumbY,28,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=.8; ctx.fillStyle='#e0aaff'; ctx.shadowBlur=0;
    ctx.beginPath(); ctx.arc(j.thumbX,j.thumbY,10,0,Math.PI*2); ctx.fill();
    ctx.restore();
  } else if(g.phase==='playing'){
    ctx.save(); ctx.globalAlpha=.07; ctx.strokeStyle='#9d4edd'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(90,H-90,55,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(90,H-90,28,0,Math.PI*2); ctx.stroke(); ctx.restore();
  }
  if(p.canDash&&g.phase==='playing'){
    ctx.save(); ctx.globalAlpha=.06; ctx.fillStyle='#80ffdb';
    ctx.font='bold 10px sans-serif'; ctx.textAlign='right';
    ctx.fillText('2ème doigt = DASH',W-12,H-10); ctx.restore();
  }
}

// ════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════
// ITEMS (ground pickups)
// ════════════════════════════════════════
const ITEMS = {
  heal:   { name:'Potion de vie',  icon:'🧪', col:'#ff4d6d', desc:'+40 PV instantané'       },
  rage:   { name:'Rage de sang',   icon:'💢', col:'#ff4400', desc:'Dégâts ×2 · 8s'          },
  shield: { name:'Bouclier sacré', icon:'🛡️', col:'#80ffdb', desc:'Invincible · 5s'         },
  freeze: { name:'Cristal glacé',  icon:'❄️', col:'#88ddff', desc:'Ennemis -70% vitesse · 6s'},
  speed:  { name:'Bottes ailées',  icon:'💨', col:'#ffe066', desc:'Vitesse ×2 · 8s'          },
  magnet: { name:'Aimant arcane',  icon:'🌀', col:'#ffb347', desc:'Attire tous les XP orbes' },
};
const ITEM_DURATIONS = { heal:0, rage:8, shield:5, freeze:6, speed:8, magnet:0 };
const ITEM_KEYS = Object.keys(ITEMS);

function spawnItem(g) {
  const type = ITEM_KEYS[Math.floor(Math.random()*ITEM_KEYS.length)];
  let x, y, tries=0;
  do { x=60+Math.random()*(W-120); y=60+Math.random()*(H-120); tries++; }
  while(Math.hypot(x-g.player.x, y-g.player.y)<120 && tries<10);
  g.items.push({x, y, type, life:14, maxLife:14, bob:Math.random()*Math.PI*2});
}

// ════════════════════════════════════════
export default function NightfallSurvivor() {
  const cvs=useRef(null), gs=useRef(null), raf=useRef(null), last=useRef(null), hudT=useRef(0);
  const audioRef=useRef(null), musicRef=useRef(null), mutedRef=useRef(false);
  const [muted,setMuted]=useState(false);
  const [screen,setScreen]=useState('menu');
  const [choices,setChoices]=useState([]);
  const [hud,setHud]=useState({hp:100,maxHp:100,xp:0,xpN:20,lv:1,t:0,kills:0,skills:{},bossHp:null,bossMaxHp:null,wave:'',nextWave:''});
  const [enemySpeed,setEnemySpeed]=useState(5);
  const [spawnSpeed,setSpawnSpeed]=useState(50);
  const slidersRef=useRef({enemySpeed:5,spawnSpeed:50,manualSpeed:false});

  const handleEnemySpeed=useCallback(v=>{setEnemySpeed(v);slidersRef.current.enemySpeed=v;slidersRef.current.manualSpeed=true;},[]);
  const handleSpawnSpeed=useCallback(v=>{setSpawnSpeed(v);slidersRef.current.spawnSpeed=v;},[]);

  const startGame=useCallback(()=>{
    gs.current={
      phase:'playing', time:0, kills:0, keys:{}, footT:0, footSide:0, sfx:[], waveIdx:0,
      player:{x:W/2,y:H/2,hp:100,maxHp:100,xp:0,level:1,skills:{dagger:1},
        speed:165,dmgM:1,xpM:1,magnet:60,regen:0,canDash:false,dashCD:0,dashDur:0,dashDir:{x:0,y:1},ls:0,kh:false,iframes:0},
      enemies:[], projectiles:[], eprojectiles:[], particles:[], xpOrbs:[],
      items:[], buffs:{}, itemTimer:8,
      wt:{dagger:0,nova:0,lightning:0}, spawnT:2,
      joystick:{active:false,touchId:null,baseX:0,baseY:0,thumbX:0,thumbY:0,dx:0,dy:0},
    };
    last.current=null; hudT.current=0;
    slidersRef.current.manualSpeed=false;
    if(!audioRef.current) audioRef.current=initAudio();
    stopMusic(musicRef);
    if(!mutedRef.current) startMusic(audioRef.current,musicRef);
    setScreen('playing');
    setHud({hp:100,maxHp:100,xp:0,xpN:20,lv:1,t:0,kills:0,skills:{},bossHp:null,bossMaxHp:null,wave:'Vague 1 · Chauves-Souris',nextWave:''});
  },[]);

  const pickSkill=useCallback((id)=>{
    const g=gs.current; if(!g)return;
    const p=g.player;
    p.skills[id]=(p.skills[id]||0)+1;
    if(id==='heart'){const lv=p.skills.heart;p.maxHp+=lv<=2?50:80;if(lv===3)p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.15);}
    refreshStats(g); g.phase='playing';
    if(!mutedRef.current&&audioRef.current) startMusic(audioRef.current,musicRef);
    setScreen('playing');
  },[]);

  const tick=useCallback(ts=>{
    raf.current=requestAnimationFrame(tick);
    const g=gs.current, canvas=cvs.current;
    if(!canvas)return;
    const ctx=canvas.getContext('2d');
    if(!g){ctx.fillStyle='#060011';ctx.fillRect(0,0,W,H);return;}
    if(g.phase!=='playing'){render(ctx,g);return;}
    if(!last.current)last.current=ts;
    const dt=Math.min((ts-last.current)/1000,.05); last.current=ts;
    const p=g.player;
    g.time+=dt;

    // ── Movement
    const k=g.keys, j=g.joystick;
    let mx=j.dx||0, my=j.dy||0;
    if(k.ArrowLeft||k.a||k.q)mx-=1; if(k.ArrowRight||k.d)mx+=1;
    if(k.ArrowUp||k.w||k.z)my-=1;   if(k.ArrowDown||k.s)my+=1;
    const ml=Math.hypot(mx,my); if(ml>0){mx/=ml;my/=ml;}
    const moving=ml>0.05;
    const speedBoost = g.buffs.speed>0 ? 2 : 1;
    const dmgBoost   = g.buffs.rage>0  ? 2 : 1;
    const freezeMult = g.buffs.freeze>0 ? 0.25 : 1;

    if(p.dashDur>0){p.dashDur-=dt;p.x+=p.dashDir.x*520*dt;p.y+=p.dashDir.y*520*dt;}
    else{p.x+=mx*p.speed*speedBoost*dt;p.y+=my*p.speed*speedBoost*dt;}
    if(p.dashCD>0)p.dashCD-=dt;
    p.iframes=Math.max(0,p.iframes-dt);
    p.x=Math.max(15,Math.min(W-15,p.x)); p.y=Math.max(15,Math.min(H-15,p.y));
    if(p.regen>0)p.hp=Math.min(p.maxHp,p.hp+p.regen*dt);

    // footprints
    if(moving&&p.dashDur<=0){
      g.footT-=dt;
      if(g.footT<=0){g.footT=0.2;g.footSide=(g.footSide+1)%2;const perp=g.footSide===0?1:-1;const nx=-my*perp*6,ny=mx*perp*6;g.particles.push({type:'footprint',x:p.x+nx,y:p.y+ny+10,angle:Math.atan2(my,mx),life:1.5,maxLife:1.5});}
    } else g.footT=0;

    // ── Buffs tick down
    Object.keys(g.buffs).forEach(k=>{if(g.buffs[k]>0)g.buffs[k]-=dt;});

    // ── Item spawner
    g.itemTimer-=dt;
    if(g.itemTimer<=0){g.itemTimer=15+Math.random()*10;spawnItem(g);}
    g.items=g.items.filter(item=>{
      item.life-=dt; item.bob+=dt*3;
      if(item.life<=0)return false;
      // pickup
      if(Math.hypot(item.x-p.x,item.y-p.y)<22){
        const t=item.type, dur=ITEM_DURATIONS[t];
        if(t==='heal')      p.hp=Math.min(p.maxHp,p.hp+40);
        else if(t==='magnet'){g.xpOrbs.forEach(o=>{o.x=p.x;o.y=p.y;});}  // instant attract
        else                 g.buffs[t]=(g.buffs[t]||0)+dur;
        // flash particles
        const ic=ITEMS[t].col;
        for(let i=0;i<12;i++){const a=(i/12)*Math.PI*2;g.particles.push({x:item.x,y:item.y,dx:Math.cos(a)*120,dy:Math.sin(a)*120,life:.5,maxLife:.5,col:ic,r:4});}
        g.sfx.push('itemPickup');
        return false;
      }
      return true;
    });

    // ── Spawn
    const spawnMult=Math.max(0.05,slidersRef.current.spawnSpeed/50);
    const speedMult=!slidersRef.current.manualSpeed
      ? Math.min(1, 0.1 + g.time*0.015)
      : Math.max(0.05,slidersRef.current.enemySpeed/50);

    // Process wave schedule
    while(g.waveIdx < WAVES.length && g.time >= WAVES[g.waveIdx].t){
      const w=WAVES[g.waveIdx];
      const cnt=Math.ceil(w.count*spawnMult);
      for(let i=0;i<cnt;i++) spawnEnemyOfType(g, w.type, speedMult);
      if(w.boss) spawnEnemyOfType(g, 'boss', speedMult*0.8);
      g.waveIdx++;
    }
    // Continuous background spawn
    g.spawnT-=dt;
    if(g.spawnT<=0){
      g.spawnT=2/(spawnMult*(0.5+g.time/90));
      // pick available type based on time
      const available=['bat'];
      if(g.time>=30) available.push('zombie');
      if(g.time>=60) available.push('skeleton');
      if(g.time>=90) available.push('ghost');
      if(g.time>=120) available.push('knight');
      if(g.time>=150) available.push('witch');
      const type=available[Math.floor(Math.random()*available.length)];
      spawnEnemyOfType(g, type, speedMult);
    }

    // ── Update enemies
    g.enemies.forEach(e=>{
      e.iframes=Math.max(0,(e.iframes||0)-dt);
      const dx=p.x-e.x, dy=p.y-e.y, dist=Math.hypot(dx,dy);
      const ndx=dist>0?dx/dist:0, ndy=dist>0?dy/dist:0;
      const s=e.speed*dt;

      if(e.behavior==='direct'||e.type==='bat'&&false){
        e.vx=e.vx*(1-dt*4)+ndx*e.speed*dt*freezeMult; e.vy=e.vy*(1-dt*4)+ndy*e.speed*dt*freezeMult;
      }
      else if(e.behavior==='wavy'){
        e.angle=(e.angle||0)+dt*3;
        const perp={x:-ndy,y:ndx};
        const wave=Math.sin(e.angle)*0.7;
        e.vx=e.vx*(1-dt*3)+(ndx+perp.x*wave)*e.speed*dt*freezeMult;
        e.vy=e.vy*(1-dt*3)+(ndy+perp.y*wave)*e.speed*dt*freezeMult;
      }
      else if(e.behavior==='phase'){
        // Smooth acceleration, no friction
        e.vx=(e.vx||0)+ndx*e.speed*dt*0.5;
        e.vy=(e.vy||0)+ndy*e.speed*dt*0.5;
        const spd=Math.hypot(e.vx,e.vy);
        if(spd>e.speed){e.vx=e.vx/spd*e.speed;e.vy=e.vy/spd*e.speed;}
      }
      else if(e.behavior==='charge'){
        if(e.charging){
          e.chargeDur-=dt;
          e.vx=e.chargeDx*e.speed*3*dt;
          e.vy=e.chargeDy*e.speed*3*dt;
          if(e.chargeDur<=0){e.charging=false;e.chargeTimer=3+Math.random()*2;}
        } else {
          e.chargeTimer-=dt;
          e.vx=e.vx*(1-dt*4)+ndx*e.speed*0.5*dt;
          e.vy=e.vy*(1-dt*4)+ndy*e.speed*0.5*dt;
          if(e.chargeTimer<=0){e.charging=true;e.chargeDx=ndx;e.chargeDy=ndy;e.chargeDur=0.35;}
        }
      }
      else if(e.behavior==='kite'){
        const ideal=e.kiteDist;
        if(dist<ideal-20){// flee
          e.vx=e.vx*(1-dt*3)+(-ndx)*e.speed*dt;
          e.vy=e.vy*(1-dt*3)+(-ndy)*e.speed*dt;
        } else if(dist>ideal+20){// approach
          e.vx=e.vx*(1-dt*3)+ndx*e.speed*0.5*dt;
          e.vy=e.vy*(1-dt*3)+ndy*e.speed*0.5*dt;
        } else {
          e.vx*=(1-dt*6); e.vy*=(1-dt*6);
        }
        // shoot
        e.shootTimer-=dt;
        if(e.shootTimer<=0&&dist<300){
          e.shootTimer=2+Math.random();
          const col=e.type==='witch'?'#cc44ff':'#ff8800';
          g.eprojectiles.push({x:e.x,y:e.y,dx:ndx*160,dy:ndy*160,r:6,dmg:e.dmg*1.5,life:2,maxLife:2,col});
          g.sfx.push('eprojshoot');
        }
      }
      else if(e.behavior==='ranged'){
        e.vx=e.vx*(1-dt*4)+ndx*e.speed*0.6*dt;
        e.vy=e.vy*(1-dt*4)+ndy*e.speed*0.6*dt;
        e.shootTimer-=dt;
        if(e.shootTimer<=0&&dist<260){
          e.shootTimer=2.5+Math.random()*1.5;
          g.eprojectiles.push({x:e.x,y:e.y,dx:ndx*140,dy:ndy*140,r:5,dmg:e.dmg,life:2,maxLife:2,col:'#c8c8b0'});
          g.sfx.push('eprojshoot');
        }
      }
      else if(e.behavior==='boss'){
        e.vx=e.vx*(1-dt*3)+ndx*e.speed*dt; e.vy=e.vy*(1-dt*3)+ndy*e.speed*dt;
        // teleport if too far
        if(dist>500){e.x=p.x+(Math.random()-.5)*300;e.y=p.y+(Math.random()-.5)*300;}
        // boss shoots in burst
        e.shootTimer=(e.shootTimer||2)-dt;
        if(e.shootTimer<=0){
          e.shootTimer=3;
          for(let i=0;i<8;i++){
            const a=(i/8)*Math.PI*2;
            g.eprojectiles.push({x:e.x,y:e.y,dx:Math.cos(a)*130,dy:Math.sin(a)*130,r:7,dmg:e.dmg,life:3,maxLife:3,col:'#ff4400'});
          }
          g.sfx.push('eprojshoot');
        }
      }
      e.x+=e.vx; e.y+=e.vy;

      // hit player
      if(p.iframes<=0&&p.dashDur<=0&&g.buffs.shield<=0&&Math.hypot(e.x-p.x,e.y-p.y)<e.size+14){
        p.hp-=e.dmg; p.iframes=0.9; g.sfx.push('hit');
      }
    });

    // ── Enemy projectiles
    g.eprojectiles=g.eprojectiles.filter(ep=>{
      ep.x+=ep.dx*dt; ep.y+=ep.dy*dt; ep.life-=dt;
      if(ep.life<=0||ep.x<-50||ep.x>W+50||ep.y<-50||ep.y>H+50)return false;
      if(p.iframes<=0&&p.dashDur<=0&&g.buffs.shield<=0&&Math.hypot(ep.x-p.x,ep.y-p.y)<15){
        p.hp-=ep.dmg; p.iframes=0.7; g.sfx.push('hit');
        for(let i=0;i<4;i++){const a=Math.random()*Math.PI*2;g.particles.push({x:p.x,y:p.y,dx:Math.cos(a)*100,dy:Math.sin(a)*100,life:.3,maxLife:.3,col:'#ff6600',r:3});}
        return false;
      }
      return true;
    });

    // ── Player weapons
    if(slv(g,'dagger')>0){
      const lv=slv(g,'dagger'); g.wt.dagger-=dt;
      if(g.wt.dagger<=0){
        g.wt.dagger=lv>=3?.45:.8; g.sfx.push('dagger');
        const near=g.enemies.reduce((b,e)=>{const d=Math.hypot(e.x-p.x,e.y-p.y);return d<b.d?{e,d}:b},{e:null,d:Infinity});
        if(near.e){
          const count=lv>=4?3:lv>=2?2:1, base=Math.atan2(near.e.y-p.y,near.e.x-p.x);
          for(let i=0;i<count;i++){const ang=base+(i-(count-1)/2)*.3;
            g.projectiles.push({x:p.x,y:p.y,dx:Math.cos(ang)*390,dy:Math.sin(ang)*390,dmg:(12+lv*4)*p.dmgM*dmgBoost,type:'dagger',pierce:lv>=5,hits:new Set(),life:1.4});}
        }
      }
    }
    if(slv(g,'nova')>0){
      const lv=slv(g,'nova'); g.wt.nova-=dt;
      if(g.wt.nova<=0){
        g.wt.nova=lv>=4?1.2:2; g.sfx.push('nova');
        const r=(80+lv*25)*(lv>=5?1.5:1), dmg=(18+lv*10)*p.dmgM*(lv>=3?1.5:1)*dmgBoost;
        g.enemies.forEach(e=>{if(Math.hypot(e.x-p.x,e.y-p.y)<r){e.hp-=dmg;if(p.ls>0)p.hp=Math.min(p.maxHp,p.hp+dmg*p.ls);if(lv>=5){const a=Math.atan2(e.y-p.y,e.x-p.x);e.vx+=Math.cos(a)*160;e.vy+=Math.sin(a)*160;}}});
        for(let i=0;i<22;i++){const a=(i/22)*Math.PI*2;g.particles.push({x:p.x+Math.cos(a)*r*.05,y:p.y+Math.sin(a)*r*.05,dx:Math.cos(a)*r*3,dy:Math.sin(a)*r*3,life:.28,maxLife:.28,col:'#ff6b35',r:4});}
      }
    }
    if(slv(g,'lightning')>0){
      const lv=slv(g,'lightning'),chains=lv>=4?4:lv>=2?2:1; g.wt.lightning-=dt;
      if(g.wt.lightning<=0){
        g.wt.lightning=lv>=5?.4:lv>=3?.8:1.5; g.sfx.push('lightning');
        const dmg=(20+lv*8)*p.dmgM*dmgBoost; let prev={x:p.x,y:p.y},pool=[...g.enemies];
        for(let c=0;c<chains&&pool.length>0;c++){
          const near=pool.reduce((b,e)=>{const d=Math.hypot(e.x-prev.x,e.y-prev.y);return d<b.d?{e,d}:b},{e:null,d:Infinity});
          if(!near.e||near.d>360)break;
          near.e.hp-=dmg; if(p.ls>0)p.hp=Math.min(p.maxHp,p.hp+dmg*p.ls);
          g.particles.push({type:'bolt',x1:prev.x,y1:prev.y,x2:near.e.x,y2:near.e.y,life:.18,maxLife:.18});
          prev=near.e; pool=pool.filter(e=>e!==near.e);
        }
      }
    }

    // ── Player projectiles hit enemies
    g.projectiles=g.projectiles.filter(proj=>{
      proj.x+=proj.dx*dt; proj.y+=proj.dy*dt; proj.life-=dt;
      if(proj.life<=0||proj.x<-60||proj.x>W+60||proj.y<-60||proj.y>H+60)return false;
      let dead=false;
      for(const e of g.enemies){
        if(proj.pierce&&proj.hits.has(e))continue;
        if(Math.hypot(proj.x-e.x,proj.y-e.y)<e.size+5){
          e.hp-=proj.dmg; if(p.ls>0)p.hp=Math.min(p.maxHp,p.hp+proj.dmg*p.ls);
          for(let i=0;i<4;i++){const a=Math.random()*Math.PI*2;g.particles.push({x:e.x,y:e.y,dx:Math.cos(a)*110,dy:Math.sin(a)*110,life:.3,maxLife:.3,col:'#a0c4ff',r:3});}
          if(proj.pierce)proj.hits.add(e); else{dead=true;break;}
        }
      }
      return !dead;
    });

    // ── Kill enemies
    let bossAlive=null;
    g.enemies=g.enemies.filter(e=>{
      if(e.type==='boss') bossAlive=e;
      if(e.hp<=0){
        g.kills++; if(p.kh)p.hp=Math.min(p.maxHp,p.hp+8);
        g.xpOrbs.push({x:e.x,y:e.y,value:Math.ceil((e.xpVal+g.time/10)*p.xpM),life:8});
        for(let i=0;i<8;i++){const a=Math.random()*Math.PI*2;g.particles.push({x:e.x,y:e.y,dx:Math.cos(a)*90,dy:Math.sin(a)*90,life:.5,maxLife:.5,col:ETYPES[e.type].col,r:4});}
        g.sfx.push(e.type==='boss'?'boss':'death');
        return false;
      }
      return true;
    });

    // ── XP orbs
    g.xpOrbs=g.xpOrbs.filter(o=>{
      o.life-=dt; if(o.life<=0)return false;
      const d=Math.hypot(o.x-p.x,o.y-p.y);
      if(d<p.magnet){const sp=Math.max(200,380*(1-d/p.magnet)),a=Math.atan2(p.y-o.y,p.x-o.x);o.x+=Math.cos(a)*sp*dt;o.y+=Math.sin(a)*sp*dt;}
      if(d<18){
        p.xp+=o.value; g.sfx.push('xp');
        if(p.xp>=xpFor(p.level)){
          p.xp-=xpFor(p.level); p.level++; p.hp=Math.min(p.maxHp,p.hp+15);
          g.sfx.push('levelup'); stopMusic(musicRef);
          const c=getChoices(g); g.phase='levelup'; setChoices(c); setScreen('levelup');
        }
        return false;
      }
      return true;
    });

    // ── Particles
    g.particles.forEach(par=>{par.life-=dt;if(par.type!=='bolt'&&par.type!=='footprint'){par.x+=(par.dx||0)*dt;par.y+=(par.dy||0)*dt;par.dx=(par.dx||0)*.94;par.dy=(par.dy||0)*.94;}});
    g.particles=g.particles.filter(pr=>pr.life>0);

    // ── Death
    if(p.hp<=0){p.hp=0;g.phase='dead';stopMusic(musicRef);g.sfx.push('gameover');setScreen('dead');}

    // ── Victory
    if(g.time>=GOAL_TIME){g.phase='victory';stopMusic(musicRef);g.sfx.push('victory');setScreen('victory');}

    // ── SFX + Haptics
    if(g.sfx.length){
      const s=g.sfx, a=audioRef.current;
      if(s.includes('gameover'))  {if(a&&!mutedRef.current)SFX.gameover(a);HAP.gameover();}
      if(s.includes('victory'))   {if(a&&!mutedRef.current)SFX.victory(a);HAP.victory();}
      if(s.includes('levelup'))   {if(a&&!mutedRef.current)SFX.levelup(a);HAP.levelup();}
      if(s.includes('hit'))       {if(a&&!mutedRef.current)SFX.hit(a);HAP.hit();}
      if(s.includes('boss'))      {if(a&&!mutedRef.current)SFX.boss(a);HAP.boss();}
      if(s.includes('nova'))      {if(a&&!mutedRef.current)SFX.nova(a);HAP.nova();}
      if(s.includes('lightning')) {if(a&&!mutedRef.current)SFX.lightning(a);}
      if(s.includes('dagger'))    {if(a&&!mutedRef.current)SFX.dagger(a);}
      if(s.filter(x=>x==='death').length&&!s.includes('boss')){if(a&&!mutedRef.current)SFX.death(a);HAP.death();}
      if(s.includes('xp')&&Math.random()<0.2){if(a&&!mutedRef.current)SFX.xp(a);}
      if(s.includes('itemPickup')){if(a&&!mutedRef.current){tone(a,660,'sine',.01,.05,.2,.2);tone(a,880,'sine',.02,.05,.18,.15);}navigator.vibrate?.([20,10,40]);}
      if(s.includes('eprojshoot')&&a&&!mutedRef.current) noiseBlast(a,.05,.08,2000);
      g.sfx=[];
    }

    // ── HUD update
    hudT.current+=dt;
    if(hudT.current>.12){hudT.current=0;
      if(!slidersRef.current.manualSpeed){const autoSpeed=Math.min(50,5+g.time*0.015*50);slidersRef.current.enemySpeed=autoSpeed;setEnemySpeed(Math.round(autoSpeed));}
      const nextW=WAVES[g.waveIdx];
      const bossE=g.enemies.find(e=>e.type==='boss');
      setHud({hp:Math.floor(p.hp),maxHp:p.maxHp,xp:p.xp,xpN:xpFor(p.level),lv:p.level,t:Math.floor(g.time),kills:g.kills,skills:{...p.skills},
        bossHp:bossE?Math.floor(bossE.hp):null,bossMaxHp:bossE?bossE.maxHp:null,
        waveInfo:`${g.waveIdx}/${WAVES.length} vagues`,
        nextWave:nextW?`Prochaine: ${ETYPES[nextW.type]?.label||''} à ${nextW.t}s`:'Dernière vague !',
        buffs:{...g.buffs}});
    }
    render(ctx,g);
  },[]);

  useEffect(()=>{raf.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf.current);},[tick]);

  useEffect(()=>{
    const dn=e=>{
      if(gs.current)gs.current.keys[e.key]=true;
      if(e.key===' '&&gs.current?.phase==='playing'){
        const p=gs.current.player,k=gs.current.keys;
        if(p.canDash&&p.dashCD<=0){let dx=0,dy=0;if(k.ArrowLeft||k.a||k.q)dx-=1;if(k.ArrowRight||k.d)dx+=1;if(k.ArrowUp||k.w||k.z)dy-=1;if(k.ArrowDown||k.s)dy+=1;const l=Math.hypot(dx,dy);if(l>0){p.dashDir={x:dx/l,y:dy/l};p.dashDur=.15;p.dashCD=2;}}
        e.preventDefault();
      }
    };
    const up=e=>{if(gs.current)gs.current.keys[e.key]=false;};
    window.addEventListener('keydown',dn); window.addEventListener('keyup',up);
    return()=>{window.removeEventListener('keydown',dn);window.removeEventListener('keyup',up);};
  },[]);

  useEffect(()=>{
    if(screen==='menu')return;
    const canvas=cvs.current; if(!canvas)return;
    const coords=t=>{const r=canvas.getBoundingClientRect();return{x:(t.clientX-r.left)*(W/r.width),y:(t.clientY-r.top)*(H/r.height)};};
    const onStart=e=>{
      e.preventDefault(); if(!gs.current||gs.current.phase!=='playing')return;
      const g=gs.current,p=g.player,j=g.joystick;
      for(const t of e.changedTouches){const{x,y}=coords(t);if(!j.active)Object.assign(j,{active:true,touchId:t.identifier,baseX:x,baseY:y,thumbX:x,thumbY:y,dx:0,dy:0});else{if(p.canDash&&p.dashCD<=0){const l=Math.hypot(j.dx,j.dy);if(l>0.05){p.dashDir={x:j.dx/l,y:j.dy/l};p.dashDur=.15;p.dashCD=2;}}}}
    };
    const onMove=e=>{
      e.preventDefault(); if(!gs.current)return;
      const j=gs.current.joystick; if(!j.active)return;
      for(const t of e.changedTouches){if(t.identifier!==j.touchId)continue;const{x,y}=coords(t);const R=55,dx=x-j.baseX,dy=y-j.baseY,dist=Math.hypot(dx,dy),clamp=Math.min(dist,R),nx=dist>0?dx/dist:0,ny=dist>0?dy/dist:0;j.thumbX=j.baseX+nx*clamp;j.thumbY=j.baseY+ny*clamp;j.dx=nx*Math.min(dist/R,1);j.dy=ny*Math.min(dist/R,1);}
    };
    const onEnd=e=>{if(!gs.current)return;const j=gs.current.joystick;for(const t of e.changedTouches)if(t.identifier===j.touchId)Object.assign(j,{active:false,touchId:null,dx:0,dy:0});};
    canvas.addEventListener('touchstart',onStart,{passive:false}); canvas.addEventListener('touchmove',onMove,{passive:false});
    canvas.addEventListener('touchend',onEnd,{passive:false}); canvas.addEventListener('touchcancel',onEnd,{passive:false});
    return()=>{canvas.removeEventListener('touchstart',onStart);canvas.removeEventListener('touchmove',onMove);canvas.removeEventListener('touchend',onEnd);canvas.removeEventListener('touchcancel',onEnd);};
  },[screen]);

  const fmt=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
  const timeLeft = GOAL_TIME - (hud.t||0);
  const danger = timeLeft < 30;

  return(
    <div style={{fontFamily:"'Cinzel',serif",background:'#030008',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Cinzel+Decorative:wght@700&display=swap');*{box-sizing:border-box}button:focus{outline:none}.skbtn:hover{transform:scale(1.06)!important}`}</style>

      {/* ── MENU ── */}
      {screen==='menu'&&(
        <div style={{textAlign:'center',padding:'28px 20px',maxWidth:820}}>
          <div style={{fontSize:46,fontFamily:"'Cinzel Decorative'",color:'#c77dff',textShadow:'0 0 40px #7b2fbe,0 0 80px #4a0a80',letterSpacing:3,lineHeight:1}}>NIGHTFALL</div>
          <div style={{color:'#7b2fbe',letterSpacing:10,fontSize:11,marginTop:5,marginBottom:8}}>SURVIVOR</div>
          <div style={{color:'#9d4edd',fontSize:13,marginBottom:32,letterSpacing:2}}>Objectif : survivre <strong style={{color:'#c77dff'}}>5 minutes</strong></div>
          <button onClick={startGame} style={{padding:'14px 48px',background:'linear-gradient(135deg,#5a189a,#3c096c)',border:'1px solid #c77dff',color:'#e0aaff',fontFamily:"'Cinzel'",fontSize:15,letterSpacing:4,cursor:'pointer',borderRadius:3,boxShadow:'0 0 30px rgba(123,47,190,.5)',transition:'all .2s'}}
            onMouseEnter={e=>{e.target.style.boxShadow='0 0 50px rgba(199,125,255,.7)';e.target.style.transform='scale(1.04)';}}
            onMouseLeave={e=>{e.target.style.boxShadow='0 0 30px rgba(123,47,190,.5)';e.target.style.transform='scale(1)';}}>COMMENCER</button>
          <div style={{marginTop:16,color:'#4a1a6a',fontSize:10,letterSpacing:2}}>📱 Joystick partout · 2ème doigt = Dash</div>
          {/* Enemy type legend */}
          <div style={{marginTop:28,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,maxWidth:600,margin:'28px auto 0'}}>
            {Object.entries(ETYPES).filter(([k])=>k!=='boss').map(([id,et])=>(
              <div key={id} style={{background:'rgba(12,2,35,.65)',border:`1px solid ${et.col}30`,borderRadius:5,padding:'7px 10px',display:'flex',alignItems:'center',gap:8,textAlign:'left'}}>
                <div style={{width:12,height:12,borderRadius:'50%',background:et.col,boxShadow:`0 0 6px ${et.col}`,flexShrink:0}}/>
                <div><div style={{color:et.col,fontSize:10,letterSpacing:1}}>{et.label}</div>
                <div style={{color:'#4a2070',fontSize:9,marginTop:1}}>{et.behavior==='wavy'?'Sinusoïdal':et.behavior==='charge'?'Charge':et.behavior==='kite'?'Tireur à dist.':et.behavior==='ranged'?'Projectiles':et.behavior==='phase'?'Fantomatique':'Direct'} · t={et.wave}s</div></div>
              </div>
            ))}
            <div style={{background:'rgba(30,0,0,.8)',border:'1px solid #ff440030',borderRadius:5,padding:'7px 10px',display:'flex',alignItems:'center',gap:8,textAlign:'left'}}>
              <div style={{width:14,height:14,borderRadius:'50%',background:'#8b0000',boxShadow:'0 0 8px #ff4400',flexShrink:0}}/>
              <div><div style={{color:'#ff4400',fontSize:10,letterSpacing:1}}>BOSS</div>
              <div style={{color:'#4a2070',fontSize:9,marginTop:1}}>Tirs en étoile · toutes les vagues</div></div>
            </div>
          </div>
        </div>
      )}

      {/* ── GAME VIEW ── */}
      {screen!=='menu'&&(
        <div style={{position:'relative',userSelect:'none',width:'100%',maxWidth:W}}>
          {/* HUD */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 10px',background:'rgba(3,0,15,.8)',borderBottom:'1px solid rgba(90,24,154,.3)'}}>
            <div style={{width:175}}>
              <div style={{fontSize:10,color:'#ff4d6d',letterSpacing:2,marginBottom:3}}>❤ {hud.hp}/{hud.maxHp}</div>
              <div style={{height:7,background:'#1a0010',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${Math.max(0,hud.hp/hud.maxHp*100)}%`,background:'linear-gradient(90deg,#8b0000,#ff2244)',borderRadius:4,transition:'width .12s'}}/>
              </div>
            </div>
            <div style={{textAlign:'center',flex:1,padding:'0 8px'}}>
              {/* Countdown */}
              <div style={{fontFamily:"'Cinzel Decorative'",fontSize:18,color:danger?'#ff2244':'#c77dff',textShadow:`0 0 ${danger?20:8}px ${danger?'#ff0040':'#7b2fbe'}`,transition:'all .3s'}}>
                {fmt(Math.max(0,timeLeft))}
              </div>
              <div style={{fontSize:9,color:'#7b2fbe',letterSpacing:1}}>Niv.{hud.lv} · ☠{hud.kills} · {hud.waveInfo}</div>
            </div>
            <div style={{width:175,display:'flex',alignItems:'center',gap:6}}>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:'#9d4edd',letterSpacing:2,marginBottom:3,textAlign:'right'}}>✦{hud.xp}/{hud.xpN}</div>
                <div style={{height:7,background:'#0a0020',borderRadius:4,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${hud.xp/hud.xpN*100}%`,background:'linear-gradient(90deg,#5a189a,#c77dff)',borderRadius:4,transition:'width .12s'}}/>
                </div>
              </div>
              <button onClick={()=>{const m=!mutedRef.current;mutedRef.current=m;setMuted(m);if(m)stopMusic(musicRef);else if(audioRef.current&&gs.current?.phase==='playing')startMusic(audioRef.current,musicRef);}}
                style={{background:'transparent',border:'1px solid #3c096c',borderRadius:4,color:muted?'#4a1a6a':'#c77dff',fontSize:14,cursor:'pointer',padding:'2px 5px',flexShrink:0}}>{muted?'🔇':'🔊'}</button>
            </div>
          </div>

          {/* Boss HP bar */}
          {hud.bossHp!==null&&(
            <div style={{padding:'4px 10px',background:'rgba(20,0,0,.85)',borderBottom:'1px solid #ff440040'}}>
              <div style={{fontSize:9,color:'#ff4400',letterSpacing:2,marginBottom:2}}>⚠ BOSS · {hud.bossHp} PV</div>
              <div style={{height:5,background:'#200',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${hud.bossHp/hud.bossMaxHp*100}%`,background:'linear-gradient(90deg,#8b0000,#ff4400)',borderRadius:3,transition:'width .1s'}}/>
              </div>
            </div>
          )}

          {/* Active buffs */}
          {hud.buffs&&Object.entries(hud.buffs).filter(([,v])=>v>0).length>0&&(
            <div style={{display:'flex',gap:6,padding:'4px 10px',background:'rgba(5,0,20,.8)',borderBottom:'1px solid rgba(60,9,108,.2)',flexWrap:'wrap'}}>
              {Object.entries(hud.buffs).filter(([,v])=>v>0).map(([id,remaining])=>{
                const it=ITEMS[id],dur=ITEM_DURATIONS[id];
                return(<div key={id} style={{display:'flex',alignItems:'center',gap:5,background:'rgba(10,0,30,.8)',border:`1px solid ${it.col}55`,borderRadius:4,padding:'2px 8px'}}>
                  <span style={{fontSize:14}}>{it.icon}</span>
                  <div>
                    <div style={{fontSize:9,color:it.col,letterSpacing:1}}>{it.name}</div>
                    <div style={{height:3,background:'#111',borderRadius:2,width:50,marginTop:2}}>
                      <div style={{height:'100%',width:`${(remaining/dur)*100}%`,background:it.col,borderRadius:2,transition:'width .1s'}}/>
                    </div>
                  </div>
                  <span style={{fontSize:9,color:it.col+'aa'}}>{Math.ceil(remaining)}s</span>
                </div>);
              })}
            </div>
          )}

          <canvas ref={cvs} width={W} height={H} style={{display:'block',width:'100%',height:'auto',touchAction:'none'}}/>

          {/* Skills + next wave */}
          <div style={{padding:'5px 8px',background:'rgba(3,0,15,.8)',borderTop:'1px solid rgba(90,24,154,.25)'}}>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center',marginBottom:4}}>
              <span style={{fontSize:9,color:'#3c096c',letterSpacing:2,marginRight:4}}>POUVOIRS</span>
              {Object.entries(hud.skills||{}).map(([id,lv])=>{const sk=SKILLS[id];return(
                <div key={id} style={{background:'rgba(8,0,22,.85)',border:`1px solid ${sk.color}45`,borderRadius:4,padding:'2px 7px',display:'flex',alignItems:'center',gap:4}}>
                  <span style={{fontSize:12}}>{sk.icon}</span>
                  <div><div style={{color:sk.color,fontSize:9}}>{sk.name}</div><div style={{fontSize:10,color:sk.color}}>{'●'.repeat(lv)}{'○'.repeat(sk.max-lv)}</div></div>
                </div>);})}
              {Object.keys(hud.skills||{}).length===0&&<span style={{fontSize:9,color:'#2a0a50'}}>Montez en niveau pour débloquer des pouvoirs</span>}
            </div>
            {hud.nextWave&&<div style={{fontSize:9,color:'#5a2a80',letterSpacing:1}}>🌊 {hud.nextWave}</div>}
          </div>

          {/* Debug sliders */}
          <div style={{display:'flex',gap:14,padding:'7px 12px',background:'rgba(2,0,10,.85)',borderTop:'1px solid rgba(60,9,108,.3)',flexWrap:'wrap',alignItems:'center'}}>
            <span style={{fontSize:9,color:'#3c096c',letterSpacing:2,flexShrink:0}}>⚙</span>
            <label style={{display:'flex',alignItems:'center',gap:7,flex:1,minWidth:150}}>
              <span style={{fontSize:10,color:'#ff4d4d',whiteSpace:'nowrap',width:105}}>👾 Vitesse ×{(enemySpeed/50).toFixed(1)}</span>
              <input type="range" min="5" max="200" value={enemySpeed} onChange={e=>handleEnemySpeed(+e.target.value)} style={{flex:1,accentColor:'#ff4d4d',cursor:'pointer'}}/>
            </label>
            <label style={{display:'flex',alignItems:'center',gap:7,flex:1,minWidth:150}}>
              <span style={{fontSize:10,color:'#ffb347',whiteSpace:'nowrap',width:105}}>🌊 Spawn ×{(spawnSpeed/50).toFixed(1)}</span>
              <input type="range" min="5" max="200" value={spawnSpeed} onChange={e=>handleSpawnSpeed(+e.target.value)} style={{flex:1,accentColor:'#ffb347',cursor:'pointer'}}/>
            </label>
            <button onClick={()=>{if(gs.current){const m=Math.max(0.05,slidersRef.current.enemySpeed/50);for(let i=0;i<5;i++)spawnEnemyOfType(gs.current,['bat','zombie','skeleton','ghost'][Math.floor(Math.random()*4)],m);}}}
              style={{padding:'4px 12px',background:'rgba(139,0,0,.6)',border:'1px solid #ff4d4d60',color:'#ff9999',fontFamily:"'Cinzel'",fontSize:9,letterSpacing:2,cursor:'pointer',borderRadius:3,whiteSpace:'nowrap',flexShrink:0}}>+5 ennemis</button>
          </div>
        </div>
      )}

      {/* ── LEVEL UP ── */}
      {screen==='levelup'&&(
        <div style={{position:'absolute',inset:0,background:'rgba(3,0,15,.9)',backdropFilter:'blur(8px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:20,padding:'20px 10px'}}>
          <div style={{fontSize:10,letterSpacing:9,color:'#7b2fbe',marginBottom:4}}>NIVEAU {hud.lv}</div>
          <div style={{fontFamily:"'Cinzel Decorative'",fontSize:21,color:'#c77dff',textShadow:'0 0 20px #7b2fbe',marginBottom:24}}>Choisir un Pouvoir</div>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
            {choices.map(id=>{const sk=SKILLS[id],curLv=hud.skills?.[id]||0,nLv=curLv+1;return(
              <div key={id} className="skbtn" onClick={()=>pickSkill(id)}
                style={{width:158,padding:'16px 12px',background:'linear-gradient(160deg,rgba(22,6,55,.97),rgba(8,0,25,.97))',border:`1px solid ${sk.color}55`,borderRadius:8,cursor:'pointer',transition:'transform .18s,box-shadow .18s',boxShadow:`0 0 15px ${sk.color}18`,textAlign:'center'}}>
                <div style={{fontSize:28,marginBottom:7}}>{sk.icon}</div>
                <div style={{color:sk.color,fontSize:11,letterSpacing:1,marginBottom:5}}>{sk.name}</div>
                {curLv>0?<div style={{marginBottom:5}}><span style={{color:`${sk.color}50`,fontSize:11}}>{'●'.repeat(curLv)}</span><span style={{color:sk.color,fontSize:11}}>{'○'.repeat(sk.max-curLv)}</span><span style={{color:`${sk.color}80`,fontSize:10}}> →{nLv}</span></div>
                :<div style={{color:'#6a3a8a',fontSize:9,letterSpacing:2,marginBottom:5}}>✦ NOUVEAU</div>}
                <div style={{color:'#b89ec4',fontSize:10,lineHeight:1.6}}>{sk.desc[nLv-1]}</div>
                <div style={{marginTop:10,fontSize:9,letterSpacing:2,color:`${sk.color}55`,border:`1px solid ${sk.color}28`,borderRadius:20,padding:'2px 8px',display:'inline-block'}}>{sk.type==='weapon'?'⚔ ARME':'🛡 PASSIF'}</div>
              </div>);})}
          </div>
        </div>
      )}

      {/* ── DEAD ── */}
      {screen==='dead'&&(
        <div style={{position:'absolute',inset:0,background:'rgba(2,0,8,.94)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:30,padding:20}}>
          <div style={{fontFamily:"'Cinzel Decorative'",fontSize:42,color:'#ff0040',textShadow:'0 0 40px #8b0000',marginBottom:6}}>VAINCU</div>
          <div style={{color:'#7b2fbe',letterSpacing:2,fontSize:12,marginBottom:14}}>Niv.{hud.lv} · {fmt(hud.t||0)} / {fmt(GOAL_TIME)} · ☠{hud.kills}</div>
          <div style={{color:'#4a1a6a',fontSize:11,marginBottom:16}}>Il vous manquait <strong style={{color:'#9d4edd'}}>{fmt(Math.max(0,GOAL_TIME-(hud.t||0)))}</strong> pour survivre</div>
          {Object.keys(hud.skills||{}).length>0&&<div style={{display:'flex',gap:7,flexWrap:'wrap',justifyContent:'center',marginBottom:12}}>
            {Object.entries(hud.skills||{}).map(([id,lv])=>{const sk=SKILLS[id];return(<div key={id} style={{background:'rgba(10,0,25,.8)',border:`1px solid ${sk.color}40`,borderRadius:4,padding:'3px 9px',display:'flex',alignItems:'center',gap:4}}><span>{sk.icon}</span><span style={{color:sk.color,fontSize:11}}>{'●'.repeat(lv)}</span></div>);})}
          </div>}
          <button onClick={startGame} style={{marginTop:16,padding:'12px 42px',background:'linear-gradient(135deg,#8b0000,#4d0020)',border:'1px solid #ff004055',color:'#ffaaaa',fontFamily:"'Cinzel'",fontSize:13,letterSpacing:3,cursor:'pointer',borderRadius:3}}>RECOMMENCER</button>
          <button onClick={()=>setScreen('menu')} style={{marginTop:10,padding:'8px 28px',background:'transparent',border:'1px solid #3c096c',color:'#6c3483',fontFamily:"'Cinzel'",fontSize:11,letterSpacing:3,cursor:'pointer',borderRadius:3}}>MENU</button>
        </div>
      )}

      {/* ── VICTORY ── */}
      {screen==='victory'&&(
        <div style={{position:'absolute',inset:0,background:'rgba(0,5,20,.95)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:30,padding:20}}>
          <div style={{fontFamily:"'Cinzel Decorative'",fontSize:38,color:'#ffe066',textShadow:'0 0 40px #ffb300,0 0 80px #ff8800',marginBottom:6}}>VICTOIRE</div>
          <div style={{color:'#c77dff',letterSpacing:2,fontSize:14,marginBottom:6}}>Vous avez survécu 5 minutes !</div>
          <div style={{color:'#9d4edd',fontSize:12,marginBottom:20}}>Niv.{hud.lv} · ☠{hud.kills} ennemis vaincus</div>
          {Object.keys(hud.skills||{}).length>0&&<div style={{display:'flex',gap:7,flexWrap:'wrap',justifyContent:'center',marginBottom:20}}>
            {Object.entries(hud.skills||{}).map(([id,lv])=>{const sk=SKILLS[id];return(<div key={id} style={{background:'rgba(10,0,25,.8)',border:`1px solid ${sk.color}60`,borderRadius:4,padding:'4px 10px',display:'flex',alignItems:'center',gap:4}}><span>{sk.icon}</span><span style={{color:sk.color,fontSize:11}}>{'●'.repeat(lv)}</span></div>);})}
          </div>}
          <button onClick={startGame} style={{padding:'13px 44px',background:'linear-gradient(135deg,#3c096c,#5a189a)',border:'1px solid #c77dff',color:'#e0aaff',fontFamily:"'Cinzel'",fontSize:14,letterSpacing:3,cursor:'pointer',borderRadius:3,boxShadow:'0 0 20px rgba(199,125,255,.4)'}}>REJOUER</button>
          <button onClick={()=>setScreen('menu')} style={{marginTop:10,padding:'8px 28px',background:'transparent',border:'1px solid #3c096c',color:'#6c3483',fontFamily:"'Cinzel'",fontSize:11,letterSpacing:3,cursor:'pointer',borderRadius:3}}>MENU</button>
        </div>
      )}
    </div>
  );
}
