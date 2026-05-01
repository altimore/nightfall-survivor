// ════════════════════════════════════════
// SKILLS (weapons + passives)
// ════════════════════════════════════════
export const SKILLS = {
  dagger:    { name:"Dague Spectrale",   icon:"🗡️", color:"#a0c4ff", type:"weapon",  max:5, desc:["Lance 1 dague/s vers l'ennemi le plus proche","Tire 2 dagues simultanément","Cadence ×1.5","3 dagues + dégâts +50%","Les dagues percent tous les ennemis"] },
  sword:     { name:"Épée Spectrale",    icon:"⚔️", color:"#ff8aa8", type:"weapon",  max:5, desc:["Slash en arc devant le joueur (90°)","Arc 120°, cadence ×1.2","Arc 180° (demi-cercle)","Tournoiement complet 360° · dégâts +50%","Double slash · cadence max"] },
  nova:      { name:"Nova de Feu",        icon:"🔥", color:"#ff6b35", type:"weapon",  max:5, desc:["Explosion autour du joueur toutes les 2s","Rayon +40%","Dégâts ×1.5","Cadence ×1.5","Rayon ×2, repousse les ennemis"] },
  lightning: { name:"Foudre Maudite",     icon:"⚡", color:"#ffe066", type:"weapon",  max:5, desc:["Frappe l'ennemi le plus proche/1.5s","Rebondit sur 1 ennemi","Cadence ×1.5","Rebondit sur 3 ennemis","Chaîne illimitée"] },
  chargedBolt:{ name:"Décharge",           icon:"💥", color:"#a0d8ff", type:"weapon",  max:5, desc:["Lance 3 disques électriques en éventail · zigzag","5 disques · cadence ×1.2","6 disques · dégâts +30%","8 disques · portée +30%","10 disques · perforants · dégâts +50%"] },
  bow:       { name:"Arc Spectral",        icon:"🏹", color:"#88ff88", type:"weapon",  max:5, desc:["Tire une flèche perforante toutes les 1.5s","Cadence ×1.3","2 flèches simultanées","Cadence ×1.6 · dégâts +30%","3 flèches · explose à l'impact"] },
  boomerang: { name:"Lame Boomerang",      icon:"🪃", color:"#ffaa44", type:"weapon",  max:5, desc:["Lance une lame qui revient · 2 hits","2 lames opposées","Cadence ×1.3 · dégâts +30%","3 lames · portée +30%","4 lames · explose au retour"] },
  iceRing:   { name:"Cercle Glacial",      icon:"❄️", color:"#88ddff", type:"weapon",  max:5, desc:["Anneau gelé s'étend toutes les 3s","Rayon +25% · gèle 1s","Cadence ×1.3 · dégâts +30%","Double pulse glaciaire","Triple pulse · gèle 2s · dégâts ×1.5"] },
  orbit:     { name:"Orbe Maudite",       icon:"💫", color:"#b894ff", type:"weapon",  max:5, desc:["1 orbe en orbite autour du joueur","2 orbes opposées","3 orbes · dégâts +20%","4 orbes · rayon étendu","5 orbes · rotation ×1.5 · dégâts +50%"] },
  trail:     { name:"Sentier Maudit",     icon:"☠️", color:"#88dd33", type:"weapon",  max:5, desc:["Laisse une traînée toxique derrière le joueur","Traînée plus dense","Mares plus larges · durent 3s","Dégâts +50%","Mares géantes · 4s · dégâts ×2"] },
  whip:      { name:"Fouet d'Ombre",      icon:"🪢", color:"#d4a4ff", type:"weapon",  max:5, desc:["Frappe en zone rectangulaire devant le joueur","Portée +30%","Double frappe (gauche + droite)","Portée +50% · dégâts +30%","Frappe les 4 directions cardinales"] },
  traps:     { name:"Pièges Spectraux",   icon:"🪤", color:"#ff5566", type:"weapon",  max:5, desc:["Pose un piège tous les 3s · explosion AoE","2 pièges par cycle","Rayon d'explosion +50%","Cadence ×1.5 · dégâts +30%","Pièges géants · cadence ×2 · stun"] },
  charm:     { name:"Charme Maudit",      icon:"💕", color:"#ff7da8", type:"weapon",  max:5, desc:["Convertit l'ennemi le plus proche en minion · 5s","Durée 8s","2 minions par cycle","Durée 10s · dégâts ×1.5","3 minions · cadence 5s"] },
  summon:    { name:"Esprits Fidèles",    icon:"👻", color:"#c77dff", type:"weapon",  max:5, desc:["Invoque 1 esprit qui chasse les ennemis","Jusqu'à 2 esprits","HP +50% · dégâts +30%","Jusqu'à 3 esprits","Cadence ×1.5 · explosion à la mort"] },
  gather:    { name:"Esprit Quêteur",     icon:"🌟", color:"#88ddff", type:"weapon",  max:5, desc:["Invoque un esprit qui ramène les orbes XP","Vitesse +30%","2 esprits collecteurs","Orbes ramassés rapportent +50% XP","3 esprits · vitesse ×2"] },
  turret:    { name:"Tourelle Spectrale", icon:"🗼", color:"#88aaff", type:"weapon",  max:5, desc:["Pose 1 tourelle (60 HP, range 200, physique)","2 tourelles","Type éclair · range +50%","3 tourelles · HP +50%","Type feu · 4 tourelles · cadence ×2"] },
  missile:   { name:"Missile Traqueur",   icon:"🚀", color:"#ff8844", type:"weapon",  max:5, desc:["1 missile autoguidé toutes les 1.2s · explosion AoE","2 missiles","3 missiles · AoE +60%","4 missiles · dégâts +40%","5 missiles · AoE ×2.5 · cadence ×1.5"] },
  floating:  { name:"Lames Suspendues",   icon:"✨", color:"#bcd0ff", type:"weapon",  max:5, desc:["2 lames flottent autour · se lancent sur les ennemis proches","3 lames maximum","4 lames · dégâts +30%","5 lames · génération plus rapide","6 lames · dégâts +50% · explosion à l'impact"] },
  grenade:   { name:"Grenade Spectrale",  icon:"💣", color:"#ffaa44", type:"weapon",  max:5, desc:["Lance 1 grenade toutes les 2s · AoE 70","AoE +30%","2 grenades par lancer","3 grenades · dégâts +30%","Cluster · 3 sous-explosions"] },
  flamethrower:{ name:"Lance-Flammes",    icon:"🌋", color:"#ff6633", type:"weapon",  max:5, desc:["Burst de flammes 2.5s (cône 60°, 150 px) · CD 5s","Cône 80°","Portée 180 px · CD 4s","Cône 100° · dégâts +30%","Double cône · burst 3s · CD 3.5s"] },
  cloud:     { name:"Nuages Foudroyants", icon:"⛈️", color:"#a0c4ff", type:"weapon",  max:5, desc:["1 nuage frappe les ennemis toutes les 1.5s","2 nuages","Cadence ×1.5 · dégâts +30%","3 nuages","4 nuages · chaîne sur 2 ennemis"] },
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
  bat:      { label:"Chauve-Souris", icon:"🦇", col:0x6a0dad, eyeCol:0xffff00, size:6,  baseHp:10,  baseSpd:58, dmg:4,  xpVal:1, behavior:"wavy",   wave:0,
              resists: { ice: 0.6, poison: 1.4, lightning: 1.3 } },
  zombie:   { label:"Zombie",        icon:"🧟", col:0x3a6b20, eyeCol:0xff8800, size:12, baseHp:50,  baseSpd:24, dmg:8,  xpVal:3, behavior:"direct",  wave:30,
              resists: { fire: 1.5, poison: 0, holy: 1.3 } },
  skeleton: { label:"Squelette",     icon:"💀", col:0xc8c8b0, eyeCol:0xff0000, size:10, baseHp:35,  baseSpd:32, dmg:6,  xpVal:4, behavior:"ranged",  wave:60,
              resists: { physical: 0.6, ice: 1.2, holy: 1.5, poison: 0.3 } },
  ghost:    { label:"Fantôme",       icon:"👻", col:0x8888ff, eyeCol:0x00ffff, size:11, baseHp:28,  baseSpd:28, dmg:10, xpVal:4, behavior:"phase",   wave:90,
              resists: { physical: 0.4, ice: 0.7, holy: 1.7, poison: 0.5 } },
  knight:   { label:"Chevalier",     icon:"🛡️", col:0x8b4513, eyeCol:0xff0000, size:15, baseHp:100, baseSpd:18, dmg:18, xpVal:7, behavior:"charge",  wave:120,
              resists: { physical: 0.7, ice: 0.6, lightning: 1.4 } },
  witch:    { label:"Sorcière",      icon:"🧙‍♀️", col:0x9932cc, eyeCol:0x00ff00, size:10, baseHp:40,  baseSpd:38, dmg:7,  xpVal:5, behavior:"kite",    wave:150,
              resists: { fire: 0, dark: 0.7, holy: 1.3 } },
  boss:     { label:"BOSS",          icon:"👹", col:0x8b0000, eyeCol:0xffff00, size:28, baseHp:600, baseSpd:26, dmg:22, xpVal:60, behavior:"boss",   wave:-1,
              resists: { all: 0.75 } },
  treasure: { label:"Sprite Doré",   icon:"💰", col:0xffd966, eyeCol:0xffffff, size:11, baseHp:35,  baseSpd:95, dmg:0,  xpVal:8, behavior:"treasure", wave:-1,
              resists: { all: 1 } },
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

// ════════════════════════════════════════
// Biomes (maps) — visual theme + favored enemy pool
// ════════════════════════════════════════
export const BIOMES = {
  cemetery: {
    name: 'Cimetière',
    icon: '🪦',
    bgColor: 0x0a0014,
    gridColor: 0x3c005f,
    accent: 0x7b2fbe,
    favored: ['zombie', 'skeleton', 'ghost', 'knight'],
  },
  forest: {
    name: 'Forêt Maudite',
    icon: '🌲',
    bgColor: 0x041007,
    gridColor: 0x143a1a,
    accent: 0x3a8a4a,
    favored: ['bat', 'ghost', 'witch'],
  },
  dungeon: {
    name: 'Donjon Oublié',
    icon: '🏰',
    bgColor: 0x1a0d04,
    gridColor: 0x4a2a14,
    accent: 0xc88040,
    favored: ['skeleton', 'knight', 'zombie'],
  },
  abyss: {
    name: 'Abysses',
    icon: '🌌',
    bgColor: 0x040014,
    gridColor: 0x18083a,
    accent: 0x4438aa,
    favored: ['ghost', 'witch', 'bat'],
  },
};
export const BIOME_LIST = Object.keys(BIOMES);

// ════════════════════════════════════════
// Game modes — global modifiers applied at scene start
// ════════════════════════════════════════
export const MODES = ['normal', 'horde', 'bossRush', 'oneShot'];

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
// Per-enemy loot table — drops a specific ITEM with the given chance on kill.
// Items map to ITEMS keys. Multiple entries roll independently.
// ════════════════════════════════════════
export const ENEMY_DROPS = {
  bat:      [],
  zombie:   [{ item: 'heal',     chance: 0.06 }],
  skeleton: [{ item: 'magnet',   chance: 0.06 }, { item: 'damageBuff', chance: 0.04 }],
  ghost:    [{ item: 'speed',    chance: 0.07 }, { item: 'shield',     chance: 0.04 }, { item: 'swiftness', chance: 0.05 }],
  knight:   [{ item: 'megaheal', chance: 0.18 }, { item: 'rage',       chance: 0.10 }, { item: 'shield', chance: 0.10 }, { item: 'swiftness', chance: 0.08 }],
  witch:    [{ item: 'regen',    chance: 0.10 }, { item: 'freeze',     chance: 0.08 }, { item: 'rage',   chance: 0.06 }, { item: 'swiftness', chance: 0.06 }],
  treasure: [{ item: 'magnet',   chance: 0.30 }, { item: 'megaheal',   chance: 0.20 }],
  boss:     [{ item: 'megaheal', chance: 0.50 }, { item: 'damageBuff', chance: 0.50 }, { item: 'shield', chance: 0.50 }],
};

// ════════════════════════════════════════
// XP curve
// ════════════════════════════════════════
const XP_TABLE = [0,12,32,65,110,170,240,330,440,570,720,890,1080,1290,1530,1810,2140,2530,2990,3530];
export const xpFor = lv => XP_TABLE[Math.min(lv, XP_TABLE.length-1)] || lv*300+4000;

// ════════════════════════════════════════
// Ground items
// ════════════════════════════════════════
export const ITEMS = {
  heal:      { name:'Potion de vie',    icon:'🧪', col:'#ff4d6d', colNum:0xff4d6d, desc:'+40 PV instantané'       },
  megaheal:  { name:'Grand calice',     icon:'🍷', col:'#ff8aa8', colNum:0xff8aa8, desc:'+80 PV instantané'       },
  regen:     { name:'Encens sacré',     icon:'🌿', col:'#8fff9b', colNum:0x8fff9b, desc:'Régénération +8 PV/s · 6s'},
  rage:      { name:'Rage de sang',     icon:'💢', col:'#ff4400', colNum:0xff4400, desc:'Dégâts ×2 · 8s'          },
  damageBuff:{ name:"Glyphe d'acuité",  icon:'⚡', col:'#ffe066', colNum:0xffe066, desc:'Dégâts +50% · 10s'        },
  swiftness: { name:"Élixir de hâte",    icon:'⏩', col:'#88ffdd', colNum:0x88ffdd, desc:'Vitesse d\'attaque ×1.6 · 10s' },
  shield:    { name:'Bouclier sacré',   icon:'🛡️', col:'#80ffdb', colNum:0x80ffdb, desc:'Invincible · 5s'         },
  freeze:    { name:'Cristal glacé',    icon:'❄️', col:'#88ddff', colNum:0x88ddff, desc:'Ennemis -70% vitesse · 6s'},
  speed:     { name:'Bottes ailées',    icon:'💨', col:'#ffe066', colNum:0xffe066, desc:'Vitesse ×2 · 8s'          },
  magnet:    { name:'Aimant arcane',    icon:'🌀', col:'#ffb347', colNum:0xffb347, desc:'Attire tous les XP orbes' },
  nuke:      { name:'Sceau du Néant',    icon:'☢️', col:'#ff4400', colNum:0xff4400, desc:'Tue tous les ennemis à l\'écran' },
  vacuum:    { name:'Aspiration arcane', icon:'🌟', col:'#88ddff', colNum:0x88ddff, desc:'Ramasse toutes les orbes XP' },
  elementFire:     { name:"Cœur de braise",   icon:'🔥', col:'#ff7733', colNum:0xff7733, desc:'Attaques physiques → feu · 12s' },
  elementIce:      { name:'Souffle glacial',  icon:'❄️', col:'#88ccff', colNum:0x88ccff, desc:'Attaques physiques → glace · 12s' },
  elementLightning:{ name:"Charge d'orage",   icon:'⚡', col:'#ffe066', colNum:0xffe066, desc:'Attaques physiques → foudre · 12s' },
  elementPoison:   { name:'Toxine spectrale', icon:'🧪', col:'#88dd33', colNum:0x88dd33, desc:'Attaques physiques → poison · 12s' },
  curseWeakness:    { name:'Sceau de faiblesse', icon:'🩸', col:'#8b2a3a', colNum:0x8b2a3a, desc:'Malédiction : dégâts -50% · 12s' },
  curseSlowness:    { name:'Chaîne lourde',     icon:'🐢', col:'#5a4a2a', colNum:0x5a4a2a, desc:'Malédiction : vitesse -50% · 12s' },
  curseFragility:   { name:'Voile fragile',     icon:'💀', col:'#6a2a4a', colNum:0x6a2a4a, desc:'Malédiction : +100% dégâts subis · 10s' },
  curseConfusion:   { name:'Brume confuse',     icon:'🌀', col:'#4a4a6a', colNum:0x4a4a6a, desc:'Malédiction : contrôles inversés · 8s' },
  curseHaste:       { name:'Hâte spectrale',    icon:'👁️', col:'#6a2a2a', colNum:0x6a2a2a, desc:'Malédiction : ennemis +50% vitesse · 10s' },
};
export const ITEM_DURATIONS = {
  heal:0, megaheal:0, regen:6, rage:8, damageBuff:10, swiftness:10, shield:5, freeze:6, speed:8, magnet:0, nuke:0, vacuum:0,
  elementFire:12, elementIce:12, elementLightning:12, elementPoison:12,
  curseWeakness:12, curseSlowness:12, curseFragility:10, curseConfusion:8, curseHaste:10,
};
export const ITEM_KEYS = Object.keys(ITEMS);

// ════════════════════════════════════════
// Helpers
// ════════════════════════════════════════
export const slv = (player, id) => player.skills[id] || 0;

// Slot limits: forces players to upgrade existing skills rather than spread thin.
export const MAX_WEAPONS = 6;
export const MAX_PASSIVES = 4;

// ════════════════════════════════════════
// Weapon evolutions (Vampire-Survivors style).
// Requires: weapon at MAX level + matching passive at MAX level. Picking one
// adds the evolution id to player.evolved (Set) and is checked in firePlayerWeapons
// to boost damage/count/cooldown/special properties.
// ════════════════════════════════════════
export const EVOLUTIONS = {
  dagger:    { name:'Pluie Spectrale',     icon:'🌌', color:'#a0c4ff', requires:'amulet', desc:'Dague évoluée : +3 projectiles, perforants, dégâts ×1.6' },
  nova:      { name:'Solaris',              icon:'☀️', color:'#ffaa44', requires:'heart',  desc:'Nova évoluée : rayon ×1.7, dégâts ×1.6, cadence ×1.5' },
  lightning: { name:'Fulgur Aeternum',      icon:'⚡', color:'#fff066', requires:'tome',   desc:'Foudre évoluée : chaîne illimitée, dégâts ×1.5, paralyse' },
  sword:     { name:'Vortex Spectral',      icon:'🌀', color:'#ff8aa8', requires:'boots',  desc:'Épée évoluée : 360° permanent, dégâts ×1.8' },
  cloud:     { name:'Tempête Céleste',      icon:'🌩️', color:'#80c4ff', requires:'tome',   desc:'Nuages évolués : +2 nuages, AoE ×1.5, dégâts ×1.4' },
  whip:      { name:'Lacération Mortelle',  icon:'⚜️', color:'#d4a4ff', requires:'amulet', desc:'Fouet évolué : 4 directions, portée ×1.5, dégâts ×1.5' },
  missile:   { name:'Salve Apocalyptique',  icon:'🔥', color:'#ff8844', requires:'tome',   desc:'Missiles évolués : +3 missiles, AoE ×1.5, cadence ×1.4' },
  orbit:     { name:'Couronne du Néant',    icon:'✴️', color:'#b894ff', requires:'amulet', desc:'Orbes évolués : +2 orbes, dégâts ×1.5, rayon étendu' },
};

// Returns evolution ids available right now: weapon at max + required passive at max + not already evolved.
export function getEvolutions(player) {
  const evolved = player.evolved instanceof Set ? player.evolved : new Set();
  const out = [];
  for (const [id, evo] of Object.entries(EVOLUTIONS)) {
    if (evolved.has(id)) continue;
    const wSkill = SKILLS[id];
    const pSkill = SKILLS[evo.requires];
    if (!wSkill || !pSkill) continue;
    if (slv(player, id) < wSkill.max) continue;
    if (slv(player, evo.requires) < pSkill.max) continue;
    out.push(id);
  }
  return out;
}

export function refreshStats(player) {
  const h=slv(player,'heart'), b=slv(player,'boots'), a=slv(player,'amulet'), t=slv(player,'tome');
  // Meta-progression multipliers (from permanent upgrades). Default to 1 when absent.
  const metaSpd = player.metaSpeedMul || 1;
  const metaDmg = player.metaDmgMul || 1;
  const metaXp  = player.metaXpMul || 1;
  const metaCritBonus = player.metaCritBonus || 0;
  player.speed  = 165*(b>=3?2:b>=2?1.5:b>=1?1.25:1) * metaSpd;
  player.dmgM   = (1+(a>=3?0.6:a>=2?0.4:a>=1?0.2:0)) * metaDmg;
  player.xpM    = (1+(t>=3?1:t>=2?0.6:t>=1?0.3:0)) * metaXp;
  player.magnet = t>=3?210:t>=2?130:60;
  player.regen  = h>=2?5:h>=1?2:0;
  player.canDash= b>=2;
  player.ls     = a>=2?0.1:a>=1?0.05:0;
  player.kh     = a>=3;
  // Critical hits: amulet boosts chance, tome boosts multiplier (small synergy).
  player.critChance = 0.05 + (a>=1?0.05:0) + (a>=2?0.05:0) + (a>=3?0.10:0) + metaCritBonus;
  player.critMult   = 2 + (t>=2?0.25:0) + (t>=3?0.25:0);
  // Attack speed = cadence multiplier on all weapon cooldowns. Boots boost atkSpd.
  player.atkSpdM = 1 + (b>=1?0.10:0) + (b>=2?0.15:0) + (b>=3?0.25:0);
}

// Returns up to 3 unique skill ids to offer on level-up.
// Filters: max level reached, banished, and slot-saturated (only offers upgrades).
// Evolutions (if any available) take priority — at least one shows up.
export function getChoices(player) {
  const banished = player.banished instanceof Set ? player.banished : new Set();
  const ownedWeapons = Object.keys(player.skills || {}).filter(id => SKILLS[id]?.type === 'weapon' && player.skills[id] > 0);
  const ownedPassives = Object.keys(player.skills || {}).filter(id => SKILLS[id]?.type === 'passive' && player.skills[id] > 0);
  const weaponsFull = ownedWeapons.length >= MAX_WEAPONS;
  const passivesFull = ownedPassives.length >= MAX_PASSIVES;
  const ids = Object.keys(SKILLS).filter(id => {
    const sk = SKILLS[id];
    if (slv(player, id) >= sk.max) return false;
    if (banished.has(id)) return false;
    const owned = slv(player, id) > 0;
    if (!owned) {
      if (sk.type === 'weapon' && weaponsFull) return false;
      if (sk.type === 'passive' && passivesFull) return false;
    }
    return true;
  });
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  // Prefix evolution ids (prefixed with "evo:") so the LevelUpScreen can render them specially.
  const evoIds = getEvolutions(player).map(id => `evo:${id}`);
  for(let i=evoIds.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[evoIds[i],evoIds[j]]=[evoIds[j],evoIds[i]];}
  // Take up to 1 evolution + fill the rest with normal choices, max 3 total.
  const result = [];
  if (evoIds.length > 0) result.push(evoIds[0]);
  for (const id of ids) {
    if (result.length >= 3) break;
    result.push(id);
  }
  return result;
}
