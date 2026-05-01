// ════════════════════════════════════════
// Daily Challenge — deterministic config based on today's date.
// Same character + weapon + mode for everyone on a given day.
// ════════════════════════════════════════

import { CHARACTER_LIST } from './characters.js';
import { MODES } from './data.js';

const STORAGE_KEY = 'nightfall:daily:v1';

const STARTER_WEAPONS = ['dagger', 'sword', 'whip', 'missile', 'floating', 'grenade', 'flamethrower', 'cloud', 'nova', 'lightning', 'chargedBolt', 'orbit', 'trail', 'traps', 'turret'];

// Tiny string→32-bit hash (xfnv-style). Stable across reloads.
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDailyConfig() {
  const key = todayKey();
  const seed = hashStr(key);
  const charIdx = seed % CHARACTER_LIST.length;
  const wepIdx = ((seed >>> 8) | 0) % STARTER_WEAPONS.length;
  const modeIdx = ((seed >>> 16) | 0) % MODES.length;
  return {
    seed,
    date: key,
    character: CHARACTER_LIST[charIdx],
    weapon: STARTER_WEAPONS[wepIdx],
    mode: MODES[modeIdx],
  };
}

// Persist the best score for today's daily.
export function loadDailyState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: '', best: null };
    const parsed = JSON.parse(raw);
    return { date: parsed.date || '', best: parsed.best || null };
  } catch (_) {
    return { date: '', best: null };
  }
}

export function saveDailyState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
}

export function recordDaily(runData) {
  const key = todayKey();
  const cur = loadDailyState();
  // Reset best when the day changes
  if (cur.date !== key) {
    cur.date = key;
    cur.best = null;
  }
  const score = (runData.kills || 0) + (runData.victory ? 1000 : 0) + (runData.combo || 0) * 5;
  const prev = cur.best?.score ?? -1;
  if (score > prev) {
    cur.best = {
      score,
      kills: runData.kills || 0,
      time: runData.time || 0,
      combo: runData.combo || 0,
      victory: !!runData.victory,
      goldEarned: runData.goldEarned || 0,
    };
    saveDailyState(cur);
  }
  return cur.best;
}
