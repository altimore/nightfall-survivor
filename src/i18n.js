import { useEffect, useState } from 'react';

const dicts = {
  fr: {
    menu: {
      survivor: 'SURVIVOR',
      objective: 'Objectif : survivre',
      goalDuration: '5 minutes',
      startWeapon: 'ARME DE DÉPART',
      character: 'PERSONNAGE',
      biome: 'BIOME',
      daily: 'DÉFI DU JOUR',
      start: 'COMMENCER',
      textSize: 'TAILLE TEXTE',
      lang: 'LANGUE',
      controls: '🎮 ZQSD/WASD/Flèches · Espace = Dash · I = Inventaire · ÉCHAP = Pause · 📱 Joystick + 2ᵉ doigt = Dash',
      version: 'v0.5 · Phaser 4 · 7 ennemis · 9 pouvoirs · 6 items · 4 boss',
    },
    end: {
      victory: 'VICTOIRE',
      defeat: 'VAINCU',
      survived: 'Vous avez survécu 5 minutes !',
      kills: 'ennemis vaincus',
      replay: 'REJOUER',
      restart: 'RECOMMENCER',
      menu: 'MENU',
      damageReport: 'DÉGÂTS PAR ARME',
      total: 'TOTAL',
      avgDps: 'DPS moyen',
    },
    pause: {
      title: 'PAUSE',
      resume: 'REPRENDRE',
      mainMenu: 'MENU PRINCIPAL',
      hint: 'ECHAP / ENTRÉE pour reprendre · M pour menu',
    },
    levelup: {
      level: 'NIVEAU',
      choose: 'Choisir un Pouvoir',
      auto: 'AUTO',
      weapon: '⚔ ARME',
      passive: '🛡 PASSIF',
      new: '✦ NOUVEAU',
      hint: '← → pour choisir · ↵ / ESPACE pour valider · 1-9 raccourci',
      reroll: 'Reroll',
      banish: 'Bannir',
    },
    hud: {
      powers: 'POUVOIRS',
      level: 'Niv.',
      hpUnit: 'PV',
    },
    boss: {
      tag: '⚠ BOSS ⚠',
    },
    compendium: {
      title: 'GUIDE',
      open: '📖 GUIDE',
      back: 'RETOUR',
      weapons: 'ARMES',
      passives: 'PASSIFS',
      evolutions: 'ÉVOLUTIONS',
      enemies: 'ENNEMIS',
      items: 'ITEMS',
      hint: 'ÉCHAP / B pour revenir',
      hp: 'PV',
      speed: 'Vit.',
      damage: 'Dgt',
      behavior: 'Comportement',
      unlocksAt: 'apparaît à',
      seconds: 's',
      level: 'Niv.',
    },
    modes: {
      label: 'MODE',
      normal: { name: 'Normal', desc: 'Vagues standards' },
      horde: { name: 'Horde', desc: '×2 spawn · ennemis 0.6× HP' },
      bossRush: { name: 'Boss Rush', desc: 'Que des boss · toutes les 15s' },
      oneShot: { name: 'Mort Instantanée', desc: '1 PV · dégâts ×100' },
    },
    players: {
      label: 'JOUEURS',
      solo: 'Solo',
      duo: 'Duo (2 joueurs)',
      duoHint: 'P1 : WASD + Espace · P2 : Flèches + Entrée',
    },
    shop: {
      title: 'BOUTIQUE',
      open: 'BOUTIQUE',
      back: 'RETOUR',
      hint: 'L\'or se gagne en tuant des ennemis · ÉCHAP / B pour fermer',
    },
    inventory: {
      title: 'INVENTAIRE',
      stats: 'STATS',
      activeBuffs: 'BUFFS ACTIFS',
      hint: 'I / ÉCHAP pour fermer',
      regen: 'Régen',
      lifesteal: 'Vol de vie',
      magnet: 'Magnet',
      dash: 'Dash',
    },
    skills: {
      dagger: 'Dague Spectrale',
      sword: 'Épée Spectrale',
      whip: "Fouet d'Ombre",
      missile: 'Missile Traqueur',
      floating: 'Lames Suspendues',
      grenade: 'Grenade Spectrale',
      flamethrower: 'Lance-Flammes',
      cloud: 'Nuages Foudroyants',
      nova: 'Nova de Feu',
      lightning: 'Foudre Maudite',
      chargedBolt: 'Décharge',
      bow: 'Arc Spectral',
      boomerang: 'Lame Boomerang',
      iceRing: 'Cercle Glacial',
      orbit: 'Orbe Maudite',
      trail: 'Sentier Maudit',
      traps: 'Pièges Spectraux',
      turret: 'Tourelle Spectrale',
      charm: 'Charme Maudit',
      summon: 'Esprits Fidèles',
      gather: 'Esprit Quêteur',
      heart: 'Cœur des Ténèbres',
      boots: 'Bottes du Néant',
      amulet: 'Amulette du Sang',
      tome: 'Grimoire Interdit',
    },
  },
  en: {
    menu: {
      survivor: 'SURVIVOR',
      objective: 'Goal: survive',
      goalDuration: '5 minutes',
      startWeapon: 'STARTING WEAPON',
      character: 'CHARACTER',
      biome: 'BIOME',
      daily: 'DAILY CHALLENGE',
      start: 'START',
      textSize: 'TEXT SIZE',
      lang: 'LANGUAGE',
      controls: '🎮 ZQSD/WASD/Arrows · Space = Dash · I = Inventory · ESC = Pause · 📱 Joystick + 2nd finger = Dash',
      version: 'v0.5 · Phaser 4 · 7 enemies · 9 powers · 6 items · 4 bosses',
    },
    end: {
      victory: 'VICTORY',
      defeat: 'DEFEATED',
      survived: 'You survived 5 minutes!',
      kills: 'enemies slain',
      replay: 'PLAY AGAIN',
      restart: 'RESTART',
      menu: 'MENU',
      damageReport: 'DAMAGE BY WEAPON',
      total: 'TOTAL',
      avgDps: 'avg DPS',
    },
    pause: {
      title: 'PAUSED',
      resume: 'RESUME',
      mainMenu: 'MAIN MENU',
      hint: 'ESC / ENTER to resume · M for menu',
    },
    levelup: {
      reroll: 'Reroll',
      banish: 'Banish',
      level: 'LEVEL',
      choose: 'Choose a Power',
      auto: 'AUTO',
      weapon: '⚔ WEAPON',
      passive: '🛡 PASSIVE',
      new: '✦ NEW',
      hint: '← → to navigate · ↵ / SPACE to confirm · 1-9 shortcut',
    },
    hud: {
      powers: 'POWERS',
      level: 'Lv.',
      hpUnit: 'HP',
    },
    boss: {
      tag: '⚠ BOSS ⚠',
    },
    compendium: {
      title: 'GUIDE',
      open: '📖 GUIDE',
      back: 'BACK',
      weapons: 'WEAPONS',
      passives: 'PASSIVES',
      evolutions: 'EVOLUTIONS',
      enemies: 'ENEMIES',
      items: 'ITEMS',
      hint: 'ESC / B to go back',
      hp: 'HP',
      speed: 'Spd',
      damage: 'Dmg',
      behavior: 'Behaviour',
      unlocksAt: 'appears at',
      seconds: 's',
      level: 'Lv.',
    },
    modes: {
      label: 'MODE',
      normal: { name: 'Normal', desc: 'Standard waves' },
      horde: { name: 'Horde', desc: '×2 spawn · enemies 0.6× HP' },
      bossRush: { name: 'Boss Rush', desc: 'Bosses only · every 15s' },
      oneShot: { name: 'Glass Cannon', desc: '1 HP · damage ×100' },
    },
    players: {
      label: 'PLAYERS',
      solo: 'Solo',
      duo: 'Duo (2 players)',
      duoHint: 'P1: WASD + Space · P2: Arrows + Enter',
    },
    shop: {
      title: 'SHOP',
      open: 'SHOP',
      back: 'BACK',
      hint: 'Earn gold by killing enemies · ESC / B to close',
    },
    inventory: {
      title: 'INVENTORY',
      stats: 'STATS',
      activeBuffs: 'ACTIVE BUFFS',
      hint: 'I / ESC to close',
      regen: 'Regen',
      lifesteal: 'Lifesteal',
      magnet: 'Magnet',
      dash: 'Dash',
    },
    skills: {
      dagger: 'Spectral Dagger',
      sword: 'Spectral Sword',
      whip: 'Shadow Whip',
      missile: 'Tracking Missile',
      floating: 'Floating Blades',
      grenade: 'Spectral Grenade',
      flamethrower: 'Flamethrower',
      cloud: 'Storm Clouds',
      nova: 'Fire Nova',
      lightning: 'Cursed Lightning',
      chargedBolt: 'Charged Bolt',
      bow: 'Spectral Bow',
      boomerang: 'Spectral Boomerang',
      iceRing: 'Frost Ring',
      orbit: 'Cursed Orb',
      trail: 'Cursed Trail',
      traps: 'Spectral Traps',
      turret: 'Spectral Turret',
      charm: 'Cursed Charm',
      summon: 'Faithful Spirits',
      gather: 'Quest Spirit',
      heart: 'Heart of Darkness',
      boots: 'Void Boots',
      amulet: 'Blood Amulet',
      tome: 'Forbidden Tome',
    },
  },
};

let currentLang = 'fr';
const listeners = new Set();

try {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : null;
  if (saved === 'en' || saved === 'fr') currentLang = saved;
} catch (_) {}

export function setLang(lang) {
  if (lang !== 'en' && lang !== 'fr') return;
  currentLang = lang;
  try { localStorage.setItem('lang', lang); } catch (_) {}
  for (const fn of listeners) fn(lang);
}

export function getLang() { return currentLang; }

export function t(path, params) {
  const parts = path.split('.');
  let v = dicts[currentLang];
  for (const p of parts) v = v?.[p];
  if (typeof v !== 'string') {
    let f = dicts.fr;
    for (const p of parts) f = f?.[p];
    v = typeof f === 'string' ? f : path;
  }
  if (params) return v.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
  return v;
}

export function useT() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force(n => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return t;
}
