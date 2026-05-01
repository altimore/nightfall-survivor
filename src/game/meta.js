// ════════════════════════════════════════
// Meta-progression: persistent gold + permanent upgrades stored in localStorage.
// ════════════════════════════════════════

const STORAGE_KEY = 'nightfall:meta:v1';

// Permanent upgrades. Each level costs gold and applies a stat bonus to every new Player.
export const META_UPGRADES = {
  hpBoost:    { name: 'Vitalité',         icon: '❤', desc: '+10 PV max par niveau',           cost: [50, 120, 220, 360, 540], apply: (p, lv) => { p.maxHp += lv * 10; p.hp = p.maxHp; } },
  dmgBoost:   { name: 'Puissance',        icon: '⚔', desc: '+5% dégâts par niveau',           cost: [60, 140, 260, 420, 620], apply: (p, lv) => { p.metaDmgMul = 1 + lv * 0.05; } },
  speedBoost: { name: 'Célérité',         icon: '👢', desc: '+3% vitesse par niveau',          cost: [40, 100, 180, 280, 400], apply: (p, lv) => { p.metaSpeedMul = 1 + lv * 0.03; } },
  xpBoost:    { name: 'Sagesse',          icon: '📜', desc: '+5% XP gagnée par niveau',        cost: [50, 120, 220, 360, 540], apply: (p, lv) => { p.metaXpMul = 1 + lv * 0.05; } },
  goldBoost:  { name: 'Cupidité',         icon: '💰', desc: '+10% or gagné par niveau',        cost: [80, 180, 320, 500, 720], apply: (p, lv) => { p.metaGoldMul = 1 + lv * 0.10; } },
  critBoost:  { name: 'Précision',        icon: '🎯', desc: '+2% chance critique par niveau',  cost: [70, 160, 280, 440, 640], apply: (p, lv) => { p.metaCritBonus = lv * 0.02; } },
  rerollExtra:{ name: 'Lucidité',         icon: '🔄', desc: '+1 reroll par run',               cost: [120, 280, 480], apply: (p, lv) => { p.rerollsLeft = (p.rerollsLeft || 3) + lv; } },
  banishExtra:{ name: 'Anathème',         icon: '🚫', desc: '+1 bannissement par run',         cost: [150, 350],      apply: (p, lv) => { p.banishesLeft = (p.banishesLeft || 1) + lv; } },
  reviveOnce: { name: 'Seconde chance',   icon: '⚱',  desc: 'Ressuscite 1 fois par run à 50% PV', cost: [400], apply: (p, lv) => { p.metaReviveLeft = lv; } },
};

const DEFAULT_STATE = {
  gold: 0,
  upgrades: {}, // upgradeId → owned level
  stats: {
    totalKills: 0,
    totalRuns: 0,
    totalVictories: 0,
    totalGoldEarned: 0,
    totalBossKills: 0,
    bestTime: 0,
    bestKills: 0,
    bestRunGold: 0,
    bestCombo: 0,
    bestEndlessTier: 0,
    totalEvolutions: 0,
  },
};

export function loadMeta() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, stats: { ...DEFAULT_STATE.stats } };
    const parsed = JSON.parse(raw);
    return {
      gold: typeof parsed.gold === 'number' ? Math.max(0, parsed.gold) : 0,
      upgrades: typeof parsed.upgrades === 'object' && parsed.upgrades ? parsed.upgrades : {},
      stats: { ...DEFAULT_STATE.stats, ...(parsed.stats || {}) },
    };
  } catch (_) {
    return { ...DEFAULT_STATE, stats: { ...DEFAULT_STATE.stats } };
  }
}

export function saveMeta(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      gold: Math.floor(state.gold || 0),
      upgrades: state.upgrades || {},
      stats: state.stats || { ...DEFAULT_STATE.stats },
    }));
  } catch (_) {}
}

// Record a finished run's stats. `runData` shape: { kills, time, goldEarned, combo, victory, evolutions, bossKills, endlessTier }
export function recordRun(runData) {
  const state = loadMeta();
  const s = { ...DEFAULT_STATE.stats, ...(state.stats || {}) };
  s.totalRuns += 1;
  s.totalKills += runData.kills || 0;
  s.totalGoldEarned += runData.goldEarned || 0;
  s.totalEvolutions += runData.evolutions || 0;
  s.totalBossKills += runData.bossKills || 0;
  if (runData.victory) s.totalVictories += 1;
  if ((runData.time || 0) > s.bestTime) s.bestTime = runData.time;
  if ((runData.kills || 0) > s.bestKills) s.bestKills = runData.kills;
  if ((runData.goldEarned || 0) > s.bestRunGold) s.bestRunGold = runData.goldEarned;
  if ((runData.combo || 0) > s.bestCombo) s.bestCombo = runData.combo;
  if ((runData.endlessTier || 0) > (s.bestEndlessTier || 0)) s.bestEndlessTier = runData.endlessTier;
  state.stats = s;
  saveMeta(state);
  return s;
}

// Add gold and immediately persist.
export function addGold(amount) {
  const state = loadMeta();
  state.gold = Math.max(0, Math.floor((state.gold || 0) + amount));
  saveMeta(state);
  return state.gold;
}

// Spend gold for an upgrade. Returns { ok, gold, level } or { ok: false, reason }.
export function buyUpgrade(id) {
  const def = META_UPGRADES[id];
  if (!def) return { ok: false, reason: 'unknown' };
  const state = loadMeta();
  const lv = state.upgrades[id] || 0;
  if (lv >= def.cost.length) return { ok: false, reason: 'max' };
  const cost = def.cost[lv];
  if ((state.gold || 0) < cost) return { ok: false, reason: 'gold' };
  state.gold -= cost;
  state.upgrades[id] = lv + 1;
  saveMeta(state);
  return { ok: true, gold: state.gold, level: state.upgrades[id] };
}

// Apply currently owned upgrades to a fresh Player at run start.
export function applyMetaToPlayer(player) {
  const state = loadMeta();
  for (const [id, lv] of Object.entries(state.upgrades || {})) {
    if (lv > 0 && META_UPGRADES[id]) {
      META_UPGRADES[id].apply(player, lv);
    }
  }
}

export function getMetaState() {
  return loadMeta();
}

// Reset everything (debug / panic button).
export function resetMeta() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
}
