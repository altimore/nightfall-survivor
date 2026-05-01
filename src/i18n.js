import { useEffect, useState } from 'react';

const dicts = {
  fr: {
    menu: {
      survivor: 'SURVIVOR',
      objective: 'Objectif : survivre',
      goalDuration: '5 minutes',
      startWeapon: 'ARME DE DÉPART',
      start: 'COMMENCER',
      textSize: 'TAILLE TEXTE',
      lang: 'LANGUE',
      controls: '🎮 ZQSD/WASD/Flèches · Espace = Dash · 📱 Joystick + 2ᵉ doigt = Dash',
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
  },
  en: {
    menu: {
      survivor: 'SURVIVOR',
      objective: 'Goal: survive',
      goalDuration: '5 minutes',
      startWeapon: 'STARTING WEAPON',
      start: 'START',
      textSize: 'TEXT SIZE',
      lang: 'LANGUAGE',
      controls: '🎮 ZQSD/WASD/Arrows · Space = Dash · 📱 Joystick + 2nd finger = Dash',
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
    },
    pause: {
      title: 'PAUSED',
      resume: 'RESUME',
      mainMenu: 'MAIN MENU',
      hint: 'ESC / ENTER to resume · M for menu',
    },
    levelup: {
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
