import {
  Board,
  Cell,
  ExplodingCell,
  ExplosionStep,
  MoveResult,
  Position,
} from '../types/game.types';
import { RUNAWAY_GUARD_LIMIT } from '../utils/constants';

export function makeBoard(cols: number, rows: number): Board {
  const cells: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ count: 0, owner: null });
    }
    cells.push(row);
  }
  return { cols, rows, cells };
}

export function criticalMass(c: number, r: number, cols: number, rows: number): number {
  let n = 0;
  if (c > 0) n++;
  if (c < cols - 1) n++;
  if (r > 0) n++;
  if (r < rows - 1) n++;
  return n;
}

export function neighbors(c: number, r: number, cols: number, rows: number): Position[] {
  const out: Position[] = [];
  if (c > 0) out.push({ c: c - 1, r });
  if (c < cols - 1) out.push({ c: c + 1, r });
  if (r > 0) out.push({ c, r: r - 1 });
  if (r < rows - 1) out.push({ c, r: r + 1 });
  return out;
}

export function cloneBoard(board: Board): Board {
  return {
    cols: board.cols,
    rows: board.rows,
    cells: board.cells.map(row => row.map(cell => ({ ...cell }))),
  };
}

export function ownersAlive(board: Board): Set<number> {
  const owners = new Set<number>();
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const owner = board.cells[r][c].owner;
      if (owner !== null) owners.add(owner);
    }
  }
  return owners;
}

export function countOrbs(board: Board): Record<number, number> {
  const counts: Record<number, number> = {};
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const { owner, count } = board.cells[r][c];
      if (owner !== null) {
        counts[owner] = (counts[owner] || 0) + count;
      }
    }
  }
  return counts;
}

function isMoveLegal(cell: Cell, playerId: number): boolean {
  return cell.owner === null || cell.owner === playerId;
}

function findExplodingCells(board: Board): ExplodingCell[] {
  const exploding: ExplodingCell[] = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const cm = criticalMass(c, r, board.cols, board.rows);
      const cell = board.cells[r][c];
      if (cell.count >= cm) {
        exploding.push({ c, r, owner: cell.owner!, criticalMass: cm });
      }
    }
  }
  return exploding;
}

function applyExplosions(board: Board, exploding: ExplodingCell[]): void {
  const pendingAdds: Array<{ c: number; r: number; owner: number }> = [];

  for (const e of exploding) {
    const cell = board.cells[e.r][e.c] as { count: number; owner: number | null };
    cell.count -= e.criticalMass;
    if (cell.count <= 0) {
      cell.count = 0;
      cell.owner = null;
    }
    for (const neighbor of neighbors(e.c, e.r, board.cols, board.rows)) {
      pendingAdds.push({ c: neighbor.c, r: neighbor.r, owner: e.owner });
    }
  }

  for (const add of pendingAdds) {
    const cell = board.cells[add.r][add.c] as { count: number; owner: number | null };
    cell.count += 1;
    cell.owner = add.owner;
  }
}

function resolveChainReactions(board: Board): ExplosionStep[] {
  const steps: ExplosionStep[] = [];

  for (let safety = 0; safety < RUNAWAY_GUARD_LIMIT; safety++) {
    const exploding = findExplodingCells(board);
    if (exploding.length === 0) break;

    applyExplosions(board, exploding);
    steps.push({ explodingCells: exploding, boardAfter: cloneBoard(board) });
  }

  return steps;
}

export function playMove(
  board: Board,
  c: number,
  r: number,
  playerId: number,
  playerCount: number,
  hasPlayed: ReadonlySet<number>,
): MoveResult | null {
  if (!isMoveLegal(board.cells[r][c], playerId)) return null;

  const mutableBoard = cloneBoard(board) as { cols: number; rows: number; cells: Cell[][] };
  const cell = mutableBoard.cells[r][c] as { count: number; owner: number | null };
  cell.count += 1;
  cell.owner = playerId;

  const updatedHasPlayed = new Set(hasPlayed);
  updatedHasPlayed.add(playerId);

  const steps = resolveChainReactions(mutableBoard);

  return { board: mutableBoard, steps };
}
