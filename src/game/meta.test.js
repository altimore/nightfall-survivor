import { describe, it, expect, beforeEach } from 'vitest';
import { META_UPGRADES, applyMetaToPlayer, addGold, buyUpgrade, getMetaState, recordRun, recordCharacterRun, resetMeta } from './meta.js';

beforeEach(() => {
  // Reset state for isolation
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

describe('META_UPGRADES', () => {
  it('every upgrade has cost array and apply fn', () => {
    for (const [id, def] of Object.entries(META_UPGRADES)) {
      expect(Array.isArray(def.cost), `${id}.cost`).toBe(true);
      expect(def.cost.length, `${id} has at least one level`).toBeGreaterThan(0);
      expect(typeof def.apply, `${id}.apply`).toBe('function');
    }
  });
});

describe('addGold + buyUpgrade', () => {
  it('addGold persists', () => {
    addGold(100);
    expect(getMetaState().gold).toBe(100);
    addGold(50);
    expect(getMetaState().gold).toBe(150);
  });

  it('buyUpgrade refuses when not enough gold', () => {
    addGold(10);
    const r = buyUpgrade('hpBoost');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('gold');
  });

  it('buyUpgrade succeeds and decrements gold', () => {
    addGold(500);
    const r = buyUpgrade('hpBoost');
    expect(r.ok).toBe(true);
    expect(r.level).toBe(1);
    expect(getMetaState().gold).toBe(450);
  });

  it('buyUpgrade returns max when fully purchased', () => {
    const def = META_UPGRADES.reviveOnce;
    addGold(def.cost.reduce((s, c) => s + c, 0));
    for (let i = 0; i < def.cost.length; i++) {
      buyUpgrade('reviveOnce');
    }
    const r = buyUpgrade('reviveOnce');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('max');
  });
});

describe('applyMetaToPlayer', () => {
  it('applies hpBoost level', () => {
    addGold(500);
    buyUpgrade('hpBoost');
    const p = { maxHp: 100, hp: 100, skills: {} };
    applyMetaToPlayer(p);
    expect(p.maxHp).toBeGreaterThan(100);
  });
});

describe('recordRun', () => {
  it('increments totals', () => {
    recordRun({ kills: 100, time: 120, victory: true, goldEarned: 50, evolutions: 1, bossKills: 2, combo: 30 });
    const s = getMetaState().stats;
    expect(s.totalRuns).toBe(1);
    expect(s.totalKills).toBe(100);
    expect(s.totalVictories).toBe(1);
    expect(s.totalGoldEarned).toBe(50);
    expect(s.totalEvolutions).toBe(1);
    expect(s.totalBossKills).toBe(2);
    expect(s.bestTime).toBe(120);
    expect(s.bestKills).toBe(100);
    expect(s.bestCombo).toBe(30);
  });

  it('keeps best across multiple runs', () => {
    recordRun({ kills: 50, time: 60, combo: 10 });
    recordRun({ kills: 80, time: 90, combo: 30 });
    recordRun({ kills: 30, time: 30, combo: 50 });
    const s = getMetaState().stats;
    expect(s.bestKills).toBe(80);
    expect(s.bestTime).toBe(90);
    expect(s.bestCombo).toBe(50);
    expect(s.totalKills).toBe(160);
  });
});

describe('recordCharacterRun', () => {
  it('tracks per-character', () => {
    recordCharacterRun('vampire', { kills: 50, time: 60, victory: false });
    recordCharacterRun('vampire', { kills: 80, time: 120, victory: true });
    recordCharacterRun('witch', { kills: 30, time: 50, victory: false });
    const cs = getMetaState().charStats;
    expect(cs.vampire.runs).toBe(2);
    expect(cs.vampire.wins).toBe(1);
    expect(cs.vampire.kills).toBe(130);
    expect(cs.vampire.bestTime).toBe(120);
    expect(cs.witch.runs).toBe(1);
  });
});

describe('resetMeta', () => {
  it('clears stored state', () => {
    addGold(200);
    resetMeta();
    expect(getMetaState().gold).toBe(0);
  });
});
