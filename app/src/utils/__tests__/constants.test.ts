import { CR_GRID_OPTIONS, MAX_PLAYERS, MIN_PLAYERS, RUNAWAY_GUARD_LIMIT } from '../constants';

describe('constants', () => {
  it('defines three grid options', () => {
    expect(CR_GRID_OPTIONS).toHaveLength(3);
  });

  it('each grid option has required fields', () => {
    for (const option of CR_GRID_OPTIONS) {
      expect(option).toHaveProperty('key');
      expect(option).toHaveProperty('label');
      expect(option).toHaveProperty('cols');
      expect(option).toHaveProperty('rows');
      expect(option.cols).toBeGreaterThan(0);
      expect(option.rows).toBeGreaterThan(0);
    }
  });

  it('grid options are ordered by size', () => {
    const areas = CR_GRID_OPTIONS.map(o => o.cols * o.rows);
    for (let i = 1; i < areas.length; i++) {
      expect(areas[i]).toBeGreaterThan(areas[i - 1]);
    }
  });

  it('player count bounds are valid', () => {
    expect(MIN_PLAYERS).toBe(2);
    expect(MAX_PLAYERS).toBe(4);
    expect(MAX_PLAYERS).toBeGreaterThan(MIN_PLAYERS);
  });

  it('runaway guard is a reasonable limit', () => {
    expect(RUNAWAY_GUARD_LIMIT).toBe(400);
    expect(RUNAWAY_GUARD_LIMIT).toBeGreaterThan(0);
  });
});
