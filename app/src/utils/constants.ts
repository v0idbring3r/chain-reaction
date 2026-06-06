import { GridOption } from '../types/game.types';

export const CR_GRID_OPTIONS: ReadonlyArray<GridOption> = [
  { key: 'small', label: '6×4', cols: 6, rows: 4 },
  { key: 'medium', label: '9×6', cols: 9, rows: 6 },
  { key: 'large', label: '12×8', cols: 12, rows: 8 },
] as const;

export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;
export const RUNAWAY_GUARD_LIMIT = 400;
