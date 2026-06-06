# Design System

Aesthetic: **Neon arcade** — deep dark background, glowing orbs, vibrant neon player colors.

## Color Palettes

Three selectable palettes. Default is `neon`.

```typescript
export const CR_PALETTES = {
  neon:   ['#00E5FF', '#FF2E93', '#B6FF3C', '#FFB020'], // cyan / magenta / lime / amber
  arcade: ['#3D8BFF', '#FF4D6D', '#7CFFB2', '#FFE45E'],
  toxic:  ['#39FF14', '#FF00E5', '#00F0FF', '#FFD600'],
};

export const CR_PLAYER_NAMES = ['CYAN', 'MAGENTA', 'LIME', 'AMBER'];
```

## Theme / Background

```typescript
export const THEME = {
  background: '#070716',       // deep navy-black
  gridLine: 'rgba(255,255,255,0.07)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.5)',
  textMono: 'rgba(255,255,255,0.4)',
};
```

## Typography

Three fonts loaded from Google Fonts:

| Font | Weight | Usage |
|---|---|---|
| Orbitron | 500, 700, 800, 900 | Player names, scores, headings (arcade display) |
| Rajdhani | 400, 500, 600, 700 | Body text, labels |
| JetBrains Mono | 400, 500, 700 | Status labels, small monospace UI |

In React Native, use `expo-font` to load these, or include them as local assets.

## Glow Effect

Player colors always have a multi-layer glow. In React Native, approximate with `shadowColor` + elevated `shadowRadius`, or use a custom glow component with multiple overlapping Views.

```typescript
// CSS reference: used for boxShadow on orbs and cell borders
function crGlow(hex: string, strength: number = 1) {
  return `0 0 ${10 * strength}px ${hex}cc, 0 0 ${22 * strength}px ${hex}80, 0 0 ${40 * strength}px ${hex}40`;
}

// React Native approximation:
const glowStyle = {
  shadowColor: playerColor,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.9,
  shadowRadius: 12,
  elevation: 8,
};
```

## Atom (Orb) Shapes

Three selectable shapes (user tweak, default `orb`):

```
orb      — round with radial gradient, white highlight at top-left
hex      — hexagonal clip-path
nucleus  — orb with inner glow ring, border
```

## Cell Sizing

Board fills a max area of `352px wide × 560px tall` (within the phone shell). Cell size is calculated as:

```typescript
const cellSize = Math.floor(Math.min(352 / board.cols, 560 / board.rows));
```

Cell visual: 1px border in player color (or dim white if empty), 6px border-radius, subtle background tint in player color.

## Atom Layout Within a Cell

Atoms are positioned relative to cell center, offset by `orbit = cellSize * 0.18`:

| Count | Layout |
|---|---|
| 1 | Centered |
| 2 | Side by side, ±orbit×0.6 on X axis |
| 3 | Triangle: top center, bottom-left, bottom-right |

Atom size: `Math.max(8, cellSize * 0.32)` px.

## Screen Flow

```
Home → Setup → Game → (Win | Pause)
             ↑_________________________|
Home → Tutorial → Home
```

## Grid Background Patterns (selectable)

- `grid` — faint grid lines
- `dots` — dot matrix  
- `none` — plain dark background

## Turn Indicator

Active player's color is used as:
- Text color for player name in HUD
- Radial gradient background tint on entire board (`${color}18` at center, transparent at edges)
- Glow on the orb icon in top-right corner of HUD
