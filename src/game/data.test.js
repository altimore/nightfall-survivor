import { describe, it, expect } from 'vitest';
import { SKILLS, EVOLUTIONS, ETYPES, ITEMS, ITEM_DURATIONS, MODES, BIOMES, BIOME_LIST, slv, refreshStats, getChoices, getEvolutions, MAX_WEAPONS, MAX_PASSIVES } from './data.js';

describe('data integrity', () => {
  it('every weapon SKILL has 5 desc levels', () => {
    for (const [id, sk] of Object.entries(SKILLS)) {
      if (sk.type !== 'weapon') continue;
      expect(sk.desc.length, `${id} should have ${sk.max} desc entries`).toBe(sk.max);
    }
  });

  it('every passive SKILL has 3 desc levels', () => {
    for (const [id, sk] of Object.entries(SKILLS)) {
      if (sk.type !== 'passive') continue;
      expect(sk.desc.length).toBe(sk.max);
    }
  });

  it('EVOLUTIONS reference real weapons + passives', () => {
    for (const [id, evo] of Object.entries(EVOLUTIONS)) {
      expect(SKILLS[id], `evo ${id} should reference a real weapon`).toBeTruthy();
      expect(SKILLS[id]?.type).toBe('weapon');
      expect(SKILLS[evo.requires], `evo ${id} requires ${evo.requires}`).toBeTruthy();
      expect(SKILLS[evo.requires]?.type).toBe('passive');
    }
  });

  it('every ITEM has a corresponding ITEM_DURATIONS entry', () => {
    for (const id of Object.keys(ITEMS)) {
      expect(typeof ITEM_DURATIONS[id], `${id}`).toBe('number');
    }
  });

  it('every ETYPE has resists object', () => {
    for (const [id, et] of Object.entries(ETYPES)) {
      expect(typeof et.resists, `${id}`).toBe('object');
    }
  });

  it('BIOMES + BIOME_LIST consistent', () => {
    expect(BIOME_LIST.length).toBe(Object.keys(BIOMES).length);
    for (const id of BIOME_LIST) {
      expect(BIOMES[id]).toBeTruthy();
      expect(typeof BIOMES[id].bgColor).toBe('number');
      expect(Array.isArray(BIOMES[id].favored)).toBe(true);
    }
  });

  it('MODES contains the expected entries', () => {
    expect(MODES).toContain('normal');
    expect(MODES).toContain('horde');
    expect(MODES).toContain('bossRush');
    expect(MODES).toContain('oneShot');
    expect(MODES).toContain('sandbox');
  });
});

describe('slv', () => {
  it('returns 0 for missing skill', () => {
    expect(slv({ skills: {} }, 'dagger')).toBe(0);
  });
  it('returns the level when present', () => {
    expect(slv({ skills: { dagger: 3 } }, 'dagger')).toBe(3);
  });
  it('handles missing skills object', () => {
    expect(slv({}, 'dagger')).toBe(0);
  });
});

describe('refreshStats', () => {
  const fresh = (skills = {}) => {
    const p = { skills, hp: 100, maxHp: 100 };
    refreshStats(p);
    return p;
  };

  it('default values when no passive', () => {
    const p = fresh();
    expect(p.dmgM).toBe(1);
    expect(p.xpM).toBe(1);
    expect(p.regen).toBe(0);
    expect(p.canDash).toBe(false);
    expect(p.critChance).toBeGreaterThanOrEqual(0.05);
  });

  it('amulet 1 grants lifesteal + crit chance', () => {
    const p = fresh({ amulet: 1 });
    expect(p.ls).toBeGreaterThan(0);
    expect(p.critChance).toBeGreaterThan(0.05);
  });

  it('boots 2 enables dash', () => {
    const p = fresh({ boots: 2 });
    expect(p.canDash).toBe(true);
  });

  it('respects metaDmgMul', () => {
    const p = { skills: {}, metaDmgMul: 1.2 };
    refreshStats(p);
    expect(p.dmgM).toBeCloseTo(1.2);
  });
});

describe('getChoices', () => {
  it('returns at most 3 entries', () => {
    const p = { skills: {}, evolved: new Set(), banished: new Set() };
    const c = getChoices(p);
    expect(c.length).toBeLessThanOrEqual(3);
  });

  it('does not return banished skills', () => {
    const p = { skills: {}, evolved: new Set(), banished: new Set(['dagger']) };
    const c = getChoices(p);
    expect(c.includes('dagger')).toBe(false);
  });

  it('caps weapons at MAX_WEAPONS — only existing weapons appear after cap', () => {
    // Fill 6 different weapons
    const skills = { dagger: 1, sword: 1, whip: 1, missile: 1, floating: 1, grenade: 1 };
    const p = { skills, evolved: new Set(), banished: new Set() };
    const c = getChoices(p);
    // Any new weapon must already be owned (since slots full)
    for (const id of c.filter(x => !x.startsWith('evo:'))) {
      const sk = SKILLS[id];
      if (sk.type === 'weapon') {
        expect(skills[id], `weapon ${id} should be owned (slot saturation)`).toBeGreaterThan(0);
      }
    }
  });

  it('exposes an evolution as evo:<id> when ready', () => {
    const skills = { dagger: 5, amulet: 3 };
    const p = { skills, evolved: new Set(), banished: new Set() };
    const c = getChoices(p);
    expect(c.some(id => id === 'evo:dagger')).toBe(true);
  });
});

describe('getEvolutions', () => {
  it('returns dagger evolution when prerequisites are met', () => {
    const p = { skills: { dagger: 5, amulet: 3 }, evolved: new Set() };
    expect(getEvolutions(p)).toContain('dagger');
  });

  it('does not return already-taken evolution', () => {
    const p = { skills: { dagger: 5, amulet: 3 }, evolved: new Set(['dagger']) };
    expect(getEvolutions(p)).not.toContain('dagger');
  });

  it('returns empty when no prerequisite is met', () => {
    const p = { skills: { dagger: 4, amulet: 3 }, evolved: new Set() };
    expect(getEvolutions(p)).not.toContain('dagger');
  });
});

describe('slot constants', () => {
  it('MAX_WEAPONS and MAX_PASSIVES are numbers > 0', () => {
    expect(MAX_WEAPONS).toBeGreaterThan(0);
    expect(MAX_PASSIVES).toBeGreaterThan(0);
  });
});
