import { GridOption } from '../types/game.types';

export const CR_GRID_OPTIONS: ReadonlyArray<GridOption> = [
  { key: 'small', label: '4×6', cols: 4, rows: 6 },
  { key: 'medium', label: '6×9', cols: 6, rows: 9 },
  { key: 'large', label: '8×12', cols: 8, rows: 12 },
] as const;

export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;
export const RUNAWAY_GUARD_LIMIT = 400;
