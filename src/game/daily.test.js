import { describe, it, expect, beforeEach } from 'vitest';
import { getDailyConfig, todayKey, recordDaily, loadDailyState } from './daily.js';
import { CHARACTER_LIST } from './characters.js';
import { MODES } from './data.js';

beforeEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

describe('todayKey', () => {
  it('matches YYYY-MM-DD format', () => {
    const k = todayKey();
    expect(/^\d{4}-\d{2}-\d{2}$/.test(k)).toBe(true);
  });
});

describe('getDailyConfig', () => {
  it('returns valid character/weapon/mode', () => {
    const cfg = getDailyConfig();
    expect(CHARACTER_LIST).toContain(cfg.character);
    expect(MODES).toContain(cfg.mode);
    expect(typeof cfg.weapon).toBe('string');
  });

  it('is deterministic for the same date', () => {
    const a = getDailyConfig();
    const b = getDailyConfig();
    expect(a.character).toBe(b.character);
    expect(a.weapon).toBe(b.weapon);
    expect(a.mode).toBe(b.mode);
    expect(a.seed).toBe(b.seed);
  });
});

describe('recordDaily', () => {
  it('persists best score for the day', () => {
    recordDaily({ kills: 100, time: 60, combo: 20, victory: false });
    const s1 = loadDailyState();
    expect(s1.best.kills).toBe(100);

    // A worse run should NOT replace it
    recordDaily({ kills: 50, time: 60, combo: 10, victory: false });
    const s2 = loadDailyState();
    expect(s2.best.kills).toBe(100);

    // A better run replaces it
    recordDaily({ kills: 200, time: 200, combo: 50, victory: true });
    const s3 = loadDailyState();
    expect(s3.best.kills).toBe(200);
    expect(s3.best.victory).toBe(true);
  });
});
