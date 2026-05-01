// ════════════════════════════════════════
// Achievements / unlocks. Stored in localStorage; checked after each run.
// ════════════════════════════════════════

const STORAGE_KEY = 'nightfall:achievements:v1';

export const ACHIEVEMENTS = {
  firstBlood: {
    name: 'Premier Sang',
    icon: '🩸',
    desc: 'Tuer 10 ennemis',
    check: s => s.totalKills >= 10,
  },
  slaughter: {
    name: 'Carnage',
    icon: '⚔',
    desc: 'Tuer 1 000 ennemis',
    check: s => s.totalKills >= 1000,
  },
  reaper: {
    name: 'Faucheur',
    icon: '☠',
    desc: 'Tuer 10 000 ennemis',
    check: s => s.totalKills >= 10000,
  },
  survivor: {
    name: 'Survivant',
    icon: '🏆',
    desc: 'Gagner une run',
    check: s => s.totalVictories >= 1,
  },
  legend: {
    name: 'Légende',
    icon: '👑',
    desc: 'Gagner 10 runs',
    check: s => s.totalVictories >= 10,
  },
  rich: {
    name: 'Cupide',
    icon: '💰',
    desc: 'Accumuler 1 000 or au total',
    check: s => s.totalGoldEarned >= 1000,
  },
  hoarder: {
    name: 'Trésorier',
    icon: '🏦',
    desc: 'Accumuler 10 000 or au total',
    check: s => s.totalGoldEarned >= 10000,
  },
  evolved: {
    name: 'Évolué',
    icon: '✦',
    desc: 'Débloquer une évolution',
    check: s => s.totalEvolutions >= 1,
  },
  evolutionMaster: {
    name: 'Maître des Évolutions',
    icon: '✶',
    desc: 'Débloquer 5 évolutions au total',
    check: s => s.totalEvolutions >= 5,
  },
  comboMaster: {
    name: 'Combo Master',
    icon: '⚡',
    desc: 'Atteindre un combo de 50',
    check: s => s.bestCombo >= 50,
  },
  ultraCombo: {
    name: 'Ultra Combo',
    icon: '🔥',
    desc: 'Atteindre un combo de 100',
    check: s => s.bestCombo >= 100,
  },
  endlessTier3: {
    name: 'Sans Fin',
    icon: '♾',
    desc: 'Atteindre le tier 3 du mode Endless',
    check: s => (s.bestEndlessTier || 0) >= 3,
  },
  speedrunner: {
    name: 'Speedrunner',
    icon: '⚡',
    desc: 'Tuer 200 ennemis en moins de 60 secondes',
    check: s => false, // Requires per-run check (handled in checkPerRun)
  },
  bossKiller: {
    name: 'Tueur de Boss',
    icon: '👹',
    desc: 'Tuer 10 boss au total',
    check: s => (s.totalBossKills || 0) >= 10,
  },
  veteran: {
    name: 'Vétéran',
    icon: '🎖',
    desc: 'Jouer 50 runs',
    check: s => s.totalRuns >= 50,
  },
};

export function loadUnlocked() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (_) {
    return new Set();
  }
}

export function saveUnlocked(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch (_) {}
}

// Returns the list of newly-unlocked achievement ids.
export function checkAchievements(stats, perRunData = {}) {
  const unlocked = loadUnlocked();
  const newUnlocks = [];
  for (const [id, def] of Object.entries(ACHIEVEMENTS)) {
    if (unlocked.has(id)) continue;
    let ok = false;
    try {
      ok = def.check(stats || {}, perRunData) === true;
    } catch (_) {}
    // Special per-run checks
    if (id === 'speedrunner' && (perRunData.kills || 0) >= 200 && (perRunData.time || 999) <= 60) ok = true;
    if (ok) {
      unlocked.add(id);
      newUnlocks.push(id);
    }
  }
  if (newUnlocks.length > 0) saveUnlocked(unlocked);
  return newUnlocks;
}

export function getUnlockedSet() {
  return loadUnlocked();
}
