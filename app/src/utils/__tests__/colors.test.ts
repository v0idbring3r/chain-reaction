import { CR_PALETTES, CR_PLAYER_NAMES, THEME } from '../colors';

describe('CR_PALETTES', () => {
  it('defines three palettes', () => {
    const keys = Object.keys(CR_PALETTES);
    expect(keys).toEqual(['neon', 'arcade', 'toxic']);
  });

  it('each palette has exactly 4 colors', () => {
    for (const palette of Object.values(CR_PALETTES)) {
      expect(palette).toHaveLength(4);
    }
  });

  it('all colors are valid hex strings', () => {
    for (const palette of Object.values(CR_PALETTES)) {
      for (const color of palette) {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      }
    }
  });
});

describe('CR_PLAYER_NAMES', () => {
  it('defines 4 player names', () => {
    expect(CR_PLAYER_NAMES).toHaveLength(4);
  });

  it('all names are uppercase strings', () => {
    for (const name of CR_PLAYER_NAMES) {
      expect(name).toBe(name.toUpperCase());
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

describe('THEME', () => {
  it('defines all required theme keys', () => {
    expect(THEME).toHaveProperty('background');
    expect(THEME).toHaveProperty('gridLine');
    expect(THEME).toHaveProperty('textPrimary');
    expect(THEME).toHaveProperty('textSecondary');
    expect(THEME).toHaveProperty('textMono');
  });

  it('background is a dark color', () => {
    expect(THEME.background).toBe('#070716');
  });
});
