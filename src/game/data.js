// ════════════════════════════════════════
// SKILLS (weapons + passives)
// ════════════════════════════════════════
export const SKILLS = {
  dagger:    { name:"Dague Spectrale",   icon:"🗡️", color:"#a0c4ff", type:"weapon",  max:5, desc:["Lance 1 dague/s vers l'ennemi le plus proche","Tire 2 dagues simultanément","Cadence ×1.5","3 dagues + dégâts +50%","Les dagues percent tous les ennemis"] },
  sword:     { name:"Épée Spectrale",    icon:"⚔️", color:"#ff8aa8", type:"weapon",  max:5, desc:["Slash en arc devant le joueur (90°)","Arc 120°, cadence ×1.2","Arc 180° (demi-cercle)","Tournoiement complet 360° · dégâts +50%","Double slash · cadence max"] },
  nova:      { name:"Nova de Feu",        icon:"🔥", color:"#ff6b35", type:"weapon",  max:5, desc:["Explosion autour du joueur toutes les 2s","Rayon +40%","Dégâts ×1.5","Cadence ×1.5","Rayon ×2, repousse les ennemis"] },
  lightning: { name:"Foudre Maudite",     icon:"⚡", color:"#ffe066", type:"weapon",  max:5, desc:["Frappe l'ennemi le plus proche/1.5s","Rebondit sur 1 ennemi","Cadence ×1.5","Rebondit sur 3 ennemis","Chaîne illimitée"] },
  orbit:     { name:"Orbe Maudite",       icon:"💫", color:"#b894ff", type:"weapon",  max:5, desc:["1 orbe en orbite autour du joueur","2 orbes opposées","3 orbes · dégâts +20%","4 orbes · rayon étendu","5 orbes · rotation ×1.5 · dégâts +50%"] },
  trail:     { name:"Sentier Maudit",     icon:"☠️", color:"#88dd33", type:"weapon",  max:5, desc:["Laisse une traînée toxique derrière le joueur","Traînée plus dense","Mares plus larges · durent 3s","Dégâts +50%","Mares géantes · 4s · dégâts ×2"] },
  whip:      { name:"Fouet d'Ombre",      icon:"🪢", color:"#d4a4ff", type:"weapon",  max:5, desc:["Frappe en zone rectangulaire devant le joueur","Portée +30%","Double frappe (gauche + droite)","Portée +50% · dégâts +30%","Frappe les 4 directions cardinales"] },
  heart:     { name:"Cœur des Ténèbres",  icon:"🖤", color:"#ff4d6d", type:"passive", max:3, desc:["+50 PV max + régénération","+50 PV max, regen ×2","+80 PV max, soigne 15% au lvl up"] },
  boots:     { name:"Bottes du Néant",    icon:"👢", color:"#80ffdb", type:"passive", max:3, desc:["+25% vitesse","+25% vitesse + Dash (2ème doigt)","Vitesse ×2, invincible en dash"] },
  amulet:    { name:"Amulette du Sang",   icon:"🔮", color:"#ff6b9d", type:"passive", max:3, desc:["+20% dégâts + vol de vie 5%","+20% dégâts + vol de vie 15%","+40% dégâts, soin au kill"] },
  tome:      { name:"Grimoire Interdit",  icon:"📜", color:"#ffb347", type:"passive", max:3, desc:["+30% XP gagnée","+30% XP + attraction des orbes","XP ×2 + zone géante"] },
};

// ════════════════════════════════════════
// ENEMY TYPES
// ════════════════════════════════════════
// Damage type multipliers per enemy. 1 = normal, 0 = immune, <1 = resistant, >1 = weak.
// Use `all` as a fallback (e.g. boss takes 0.75× all damage by default).
export const ETYPES = {
  bat:      { label:"Chauve-Souris", col:0x6a0dad, eyeCol:0xffff00, size:6,  baseHp:10,  baseSpd:58, dmg:4,  xpVal:1, behavior:"wavy",   wave:0,
              resists: { ice: 0.6, poison: 1.4, lightning: 1.3 } },
  zombie:   { label:"Zombie",        col:0x3a6b20, eyeCol:0xff8800, size:12, baseHp:50,  baseSpd:24, dmg:8,  xpVal:3, behavior:"direct",  wave:30,
              resists: { fire: 1.5, poison: 0, holy: 1.3 } },
  skeleton: { label:"Squelette",     col:0xc8c8b0, eyeCol:0xff0000, size:10, baseHp:35,  baseSpd:32, dmg:6,  xpVal:4, behavior:"ranged",  wave:60,
              resists: { physical: 0.6, ice: 1.2, holy: 1.5, poison: 0.3 } },
  ghost:    { label:"Fantôme",       col:0x8888ff, eyeCol:0x00ffff, size:11, baseHp:28,  baseSpd:28, dmg:10, xpVal:4, behavior:"phase",   wave:90,
              resists: { physical: 0.4, ice: 0.7, holy: 1.7, poison: 0.5 } },
  knight:   { label:"Chevalier",     col:0x8b4513, eyeCol:0xff0000, size:15, baseHp:100, baseSpd:18, dmg:18, xpVal:7, behavior:"charge",  wave:120,
              resists: { physical: 0.7, ice: 0.6, lightning: 1.4 } },
  witch:    { label:"Sorcière",      col:0x9932cc, eyeCol:0x00ff00, size:10, baseHp:40,  baseSpd:38, dmg:7,  xpVal:5, behavior:"kite",    wave:150,
              resists: { fire: 0, dark: 0.7, holy: 1.3 } },
  boss:     { label:"BOSS",          col:0x8b0000, eyeCol:0xffff00, size:28, baseHp:600, baseSpd:26, dmg:22, xpVal:60, behavior:"boss",   wave:-1,
              resists: { all: 0.75 } },
};

// Damage type → status effect template (applied on hit when resist > 0)
export const STATUS_TEMPLATES = {
  fire:      type => ({ kind: 'burning', dmgFrac: 0.15, ticks: 4, interval: 0.5 }),
  ice:       () => ({ kind: 'frozen',   duration: 1.5 }),
  poison:    () => ({ kind: 'poisoned', dmgFrac: 0.2, duration: 5, interval: 1 }),
  lightning: () => ({ kind: 'shocked',  duration: 0.3 }),
};

export const DAMAGE_COLORS = {
  physical: '#ffffff',
  fire:     '#ff7733',
  ice:      '#88ccff',
  lightning:'#ffe066',
  poison:   '#88dd33',
  dark:     '#b894ff',
  holy:     '#ffd966',
};

// Wave schedule
export const WAVES = [
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

// ════════════════════════════════════════
// XP curve
// ════════════════════════════════════════
const XP_TABLE = [0,12,32,65,110,170,240,330,440,570,720,890,1080,1290,1530,1810,2140,2530,2990,3530];
export const xpFor = lv => XP_TABLE[Math.min(lv, XP_TABLE.length-1)] || lv*300+4000;

// ════════════════════════════════════════
// Ground items
// ════════════════════════════════════════
export const ITEMS = {
  heal:   { name:'Potion de vie',  icon:'🧪', col:'#ff4d6d', colNum:0xff4d6d, desc:'+40 PV instantané'       },
  rage:   { name:'Rage de sang',   icon:'💢', col:'#ff4400', colNum:0xff4400, desc:'Dégâts ×2 · 8s'          },
  shield: { name:'Bouclier sacré', icon:'🛡️', col:'#80ffdb', colNum:0x80ffdb, desc:'Invincible · 5s'         },
  freeze: { name:'Cristal glacé',  icon:'❄️', col:'#88ddff', colNum:0x88ddff, desc:'Ennemis -70% vitesse · 6s'},
  speed:  { name:'Bottes ailées',  icon:'💨', col:'#ffe066', colNum:0xffe066, desc:'Vitesse ×2 · 8s'          },
  magnet: { name:'Aimant arcane',  icon:'🌀', col:'#ffb347', colNum:0xffb347, desc:'Attire tous les XP orbes' },
};
export const ITEM_DURATIONS = { heal:0, rage:8, shield:5, freeze:6, speed:8, magnet:0 };
export const ITEM_KEYS = Object.keys(ITEMS);

// ════════════════════════════════════════
// Helpers
// ════════════════════════════════════════
export const slv = (player, id) => player.skills[id] || 0;

export function refreshStats(player) {
  const h=slv(player,'heart'), b=slv(player,'boots'), a=slv(player,'amulet'), t=slv(player,'tome');
  player.speed  = 165*(b>=3?2:b>=2?1.5:b>=1?1.25:1);
  player.dmgM   = 1+(a>=3?0.6:a>=2?0.4:a>=1?0.2:0);
  player.xpM    = 1+(t>=3?1:t>=2?0.6:t>=1?0.3:0);
  player.magnet = t>=3?210:t>=2?130:60;
  player.regen  = h>=2?5:h>=1?2:0;
  player.canDash= b>=2;
  player.ls     = a>=2?0.1:a>=1?0.05:0;
  player.kh     = a>=3;
}

export function getChoices(player) {
  const ids = Object.keys(SKILLS).filter(id => slv(player,id) < SKILLS[id].max);
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  return ids.slice(0, Math.min(3, ids.length));
}
