import { describe, it, expect, beforeEach } from 'vitest';
import { ACHIEVEMENTS, checkAchievements, getUnlockedSet } from './achievements.js';

beforeEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

describe('ACHIEVEMENTS', () => {
  it('every achievement has name, icon, desc, check', () => {
    for (const [id, a] of Object.entries(ACHIEVEMENTS)) {
      expect(typeof a.name, id).toBe('string');
      expect(typeof a.icon, id).toBe('string');
      expect(typeof a.desc, id).toBe('string');
      expect(typeof a.check, id).toBe('function');
    }
  });
});

describe('checkAchievements', () => {
  it('unlocks firstBlood at 10 kills', () => {
    const unlocks = checkAchievements({ totalKills: 10 });
    expect(unlocks).toContain('firstBlood');
  });

  it('unlocks slaughter at 1000 kills', () => {
    const unlocks = checkAchievements({ totalKills: 1000 });
    expect(unlocks).toContain('slaughter');
  });

  it('does NOT unlock twice (persistence)', () => {
    checkAchievements({ totalKills: 10 });
    const second = checkAchievements({ totalKills: 50 });
    expect(second).not.toContain('firstBlood');
  });

  it('survivor unlock requires victory', () => {
    expect(checkAchievements({ totalVictories: 0 })).not.toContain('survivor');
    if (typeof localStorage !== 'undefined') localStorage.clear();
    expect(checkAchievements({ totalVictories: 1 })).toContain('survivor');
  });

  it('speedrunner unlocks via per-run kills/time', () => {
    const unlocks = checkAchievements({ totalKills: 0 }, { kills: 250, time: 50 });
    expect(unlocks).toContain('speedrunner');
  });

  it('comboMaster unlock at bestCombo 50', () => {
    expect(checkAchievements({ bestCombo: 50 })).toContain('comboMaster');
  });

  it('legend unlock at 10 victories', () => {
    expect(checkAchievements({ totalVictories: 10 })).toContain('legend');
  });
});

describe('getUnlockedSet', () => {
  it('reflects unlocked achievements', () => {
    expect(getUnlockedSet().size).toBe(0);
    checkAchievements({ totalKills: 10 });
    expect(getUnlockedSet().has('firstBlood')).toBe(true);
  });
});
