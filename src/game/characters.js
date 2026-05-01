// ════════════════════════════════════════
// Playable characters with unique base stats and starter weapon.
// Applied to a fresh Player after meta-progression.
// ════════════════════════════════════════
export const CHARACTERS = {
  vampire: {
    name: 'Vampire',
    icon: '🦇',
    color: '#c77dff',
    desc: 'Le survivant équilibré. PV moyens, dague auto.',
    starterWeapon: 'dagger',
    apply: p => {
      // baseline; nothing extra
    },
  },
  witch: {
    name: 'Sorcière',
    icon: '🧙‍♀️',
    color: '#88ddff',
    desc: 'PV faibles mais XP +30%, crit +5%. Démarre avec la Foudre.',
    starterWeapon: 'lightning',
    apply: p => {
      p.maxHp = Math.max(60, Math.floor(p.maxHp * 0.7));
      p.hp = p.maxHp;
      p.metaXpMul = (p.metaXpMul || 1) * 1.3;
      p.metaCritBonus = (p.metaCritBonus || 0) + 0.05;
      p.speed = Math.max(p.speed, 175);
    },
  },
  knight: {
    name: 'Chevalier',
    icon: '🛡️',
    color: '#ff8aa8',
    desc: 'Tank : +50 PV, regen passive, dégâts +10%. Démarre avec l\'Épée.',
    starterWeapon: 'sword',
    apply: p => {
      p.maxHp = p.maxHp + 50;
      p.hp = p.maxHp;
      p.regen = Math.max(p.regen || 0, 2);
      p.metaDmgMul = (p.metaDmgMul || 1) * 1.1;
      p.speed = Math.max(140, p.speed * 0.9);
    },
  },
  rogue: {
    name: 'Voleur',
    icon: '🗡',
    color: '#80ffdb',
    desc: 'Vitesse +25%, crit +10%, +1 reroll. PV faibles.',
    starterWeapon: 'dagger',
    apply: p => {
      p.maxHp = Math.max(70, Math.floor(p.maxHp * 0.85));
      p.hp = p.maxHp;
      p.speed = Math.floor(p.speed * 1.25);
      p.metaCritBonus = (p.metaCritBonus || 0) + 0.10;
      p.rerollsLeft = (p.rerollsLeft || 3) + 1;
    },
  },
  necromancer: {
    name: 'Nécromancien',
    icon: '☠',
    color: '#b894ff',
    desc: 'Démarre avec un Esprit Fidèle déjà invoqué. +20% XP.',
    starterWeapon: 'summon',
    apply: p => {
      p.metaXpMul = (p.metaXpMul || 1) * 1.2;
      // Skill is set elsewhere — bonus level-1 free
    },
  },
  paladin: {
    name: 'Paladin',
    icon: '⚜️',
    color: '#ffd966',
    desc: 'Démarre avec Cœur niv 1 (Heart). Dégâts +15%, +1 banish.',
    starterWeapon: 'nova',
    apply: p => {
      p.skills = { ...(p.skills || {}), heart: 1 };
      p.maxHp += 50;
      p.hp = p.maxHp;
      p.regen = Math.max(p.regen || 0, 2);
      p.metaDmgMul = (p.metaDmgMul || 1) * 1.15;
      p.banishesLeft = (p.banishesLeft || 1) + 1;
    },
  },
};

export const CHARACTER_LIST = Object.keys(CHARACTERS);
