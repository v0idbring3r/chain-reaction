export interface Cell {
  readonly count: number;
  readonly owner: number | null;
}

export interface Board {
  readonly cols: number;
  readonly rows: number;
  readonly cells: ReadonlyArray<ReadonlyArray<Cell>>;
}

export interface Position {
  readonly c: number;
  readonly r: number;
}

export interface ExplodingCell {
  readonly c: number;
  readonly r: number;
  readonly owner: number;
  readonly criticalMass: number;
}

export interface ExplosionStep {
  readonly explodingCells: ReadonlyArray<ExplodingCell>;
  readonly boardAfter: Board;
}

export interface MoveResult {
  readonly board: Board;
  readonly steps: ReadonlyArray<ExplosionStep>;
}

export interface GridOption {
  readonly key: string;
  readonly label: string;
  readonly cols: number;
  readonly rows: number;
}
