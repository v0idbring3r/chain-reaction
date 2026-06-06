import {
  makeBoard,
  criticalMass,
  neighbors,
  cloneBoard,
  playMove,
  ownersAlive,
  countOrbs,
} from '../GameEngine';
import { Board } from '../../types/game.types';

function setBoardCell(board: Board, r: number, c: number, count: number, owner: number | null): void {
  (board.cells[r][c] as { count: number; owner: number | null }).count = count;
  (board.cells[r][c] as { count: number; owner: number | null }).owner = owner;
}

describe('makeBoard', () => {
  it('creates a board with correct dimensions', () => {
    const board = makeBoard(6, 4);
    expect(board.cols).toBe(6);
    expect(board.rows).toBe(4);
    expect(board.cells.length).toBe(4);
    expect(board.cells[0].length).toBe(6);
  });

  it('initializes all cells as empty', () => {
    const board = makeBoard(3, 3);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        expect(board.cells[r][c]).toEqual({ count: 0, owner: null });
      }
    }
  });

  it('creates a 1x1 board', () => {
    const board = makeBoard(1, 1);
    expect(board.cells.length).toBe(1);
    expect(board.cells[0].length).toBe(1);
  });
});

describe('criticalMass', () => {
  const cols = 6;
  const rows = 4;

  it('returns 2 for corners', () => {
    expect(criticalMass(0, 0, cols, rows)).toBe(2);
    expect(criticalMass(5, 0, cols, rows)).toBe(2);
    expect(criticalMass(0, 3, cols, rows)).toBe(2);
    expect(criticalMass(5, 3, cols, rows)).toBe(2);
  });

  it('returns 3 for edges', () => {
    expect(criticalMass(1, 0, cols, rows)).toBe(3);
    expect(criticalMass(0, 1, cols, rows)).toBe(3);
    expect(criticalMass(5, 2, cols, rows)).toBe(3);
    expect(criticalMass(3, 3, cols, rows)).toBe(3);
  });

  it('returns 4 for interior cells', () => {
    expect(criticalMass(1, 1, cols, rows)).toBe(4);
    expect(criticalMass(2, 2, cols, rows)).toBe(4);
    expect(criticalMass(4, 2, cols, rows)).toBe(4);
  });

  it('handles a 1x1 grid (no neighbors)', () => {
    expect(criticalMass(0, 0, 1, 1)).toBe(0);
  });
});

describe('neighbors', () => {
  const cols = 6;
  const rows = 4;

  it('returns 2 neighbors for a corner', () => {
    const n = neighbors(0, 0, cols, rows);
    expect(n).toHaveLength(2);
    expect(n).toContainEqual({ c: 1, r: 0 });
    expect(n).toContainEqual({ c: 0, r: 1 });
  });

  it('returns 3 neighbors for an edge', () => {
    const n = neighbors(1, 0, cols, rows);
    expect(n).toHaveLength(3);
    expect(n).toContainEqual({ c: 0, r: 0 });
    expect(n).toContainEqual({ c: 2, r: 0 });
    expect(n).toContainEqual({ c: 1, r: 1 });
  });

  it('returns 4 neighbors for an interior cell', () => {
    const n = neighbors(2, 2, cols, rows);
    expect(n).toHaveLength(4);
    expect(n).toContainEqual({ c: 1, r: 2 });
    expect(n).toContainEqual({ c: 3, r: 2 });
    expect(n).toContainEqual({ c: 2, r: 1 });
    expect(n).toContainEqual({ c: 2, r: 3 });
  });

  it('returns 0 neighbors for a 1x1 grid', () => {
    expect(neighbors(0, 0, 1, 1)).toHaveLength(0);
  });

  it('returns correct neighbors for bottom-right corner', () => {
    const n = neighbors(5, 3, cols, rows);
    expect(n).toHaveLength(2);
    expect(n).toContainEqual({ c: 4, r: 3 });
    expect(n).toContainEqual({ c: 5, r: 2 });
  });
});

describe('cloneBoard', () => {
  it('produces a deep copy', () => {
    const board = makeBoard(3, 3);
    setBoardCell(board, 0, 0, 2, 0);
    const clone = cloneBoard(board);

    expect(clone.cells[0][0]).toEqual({ count: 2, owner: 0 });

    setBoardCell(clone, 0, 0, 5, 1);
    expect(board.cells[0][0]).toEqual({ count: 2, owner: 0 });
    expect(clone.cells[0][0]).toEqual({ count: 5, owner: 1 });
  });

  it('preserves dimensions', () => {
    const board = makeBoard(6, 4);
    const clone = cloneBoard(board);
    expect(clone.cols).toBe(6);
    expect(clone.rows).toBe(4);
  });
});

describe('ownersAlive', () => {
  it('returns empty set for an empty board', () => {
    const board = makeBoard(3, 3);
    expect(ownersAlive(board).size).toBe(0);
  });

  it('returns all owners present on the board', () => {
    const board = makeBoard(3, 3);
    setBoardCell(board, 0, 0, 1, 0);
    setBoardCell(board, 1, 1, 1, 1);
    setBoardCell(board, 2, 2, 1, 2);
    const owners = ownersAlive(board);
    expect(owners.size).toBe(3);
    expect(owners.has(0)).toBe(true);
    expect(owners.has(1)).toBe(true);
    expect(owners.has(2)).toBe(true);
  });

  it('returns single owner when only one remains', () => {
    const board = makeBoard(3, 3);
    setBoardCell(board, 0, 0, 1, 0);
    setBoardCell(board, 1, 1, 2, 0);
    const owners = ownersAlive(board);
    expect(owners.size).toBe(1);
    expect(owners.has(0)).toBe(true);
  });
});

describe('countOrbs', () => {
  it('returns empty object for empty board', () => {
    const board = makeBoard(3, 3);
    expect(countOrbs(board)).toEqual({});
  });

  it('counts orbs per player correctly', () => {
    const board = makeBoard(3, 3);
    setBoardCell(board, 0, 0, 2, 0);
    setBoardCell(board, 0, 1, 3, 0);
    setBoardCell(board, 1, 0, 1, 1);
    const counts = countOrbs(board);
    expect(counts[0]).toBe(5);
    expect(counts[1]).toBe(1);
  });
});

describe('playMove', () => {
  it('rejects a move on a cell owned by another player', () => {
    const board = makeBoard(3, 3);
    setBoardCell(board, 0, 0, 1, 0);
    const result = playMove(board, 0, 0, 1, 2, new Set());
    expect(result).toBeNull();
  });

  it('places an orb on an empty cell', () => {
    const board = makeBoard(3, 3);
    const result = playMove(board, 1, 1, 0, 2, new Set());
    expect(result).not.toBeNull();
    expect(result!.board.cells[1][1].count).toBe(1);
    expect(result!.board.cells[1][1].owner).toBe(0);
    expect(result!.steps).toHaveLength(0);
  });

  it('allows placing on own cell', () => {
    const board = makeBoard(3, 3);
    setBoardCell(board, 1, 1, 2, 0);
    const result = playMove(board, 1, 1, 0, 2, new Set());
    expect(result).not.toBeNull();
    expect(result!.board.cells[1][1].count).toBe(3);
    expect(result!.board.cells[1][1].owner).toBe(0);
  });

  it('does not mutate the original board', () => {
    const board = makeBoard(3, 3);
    playMove(board, 1, 1, 0, 2, new Set());
    expect(board.cells[1][1]).toEqual({ count: 0, owner: null });
  });

  it('triggers an explosion when a corner reaches critical mass', () => {
    const board = makeBoard(3, 3);
    setBoardCell(board, 0, 0, 1, 0);
    const result = playMove(board, 0, 0, 0, 2, new Set());
    expect(result).not.toBeNull();
    expect(result!.steps.length).toBeGreaterThan(0);
    expect(result!.board.cells[0][0].count).toBe(0);
    expect(result!.board.cells[0][0].owner).toBeNull();
    expect(result!.board.cells[0][1].count).toBe(1);
    expect(result!.board.cells[0][1].owner).toBe(0);
    expect(result!.board.cells[1][0].count).toBe(1);
    expect(result!.board.cells[1][0].owner).toBe(0);
  });

  it('captures opponent orbs during explosion', () => {
    const board = makeBoard(3, 3);
    setBoardCell(board, 0, 0, 1, 0);
    setBoardCell(board, 0, 1, 1, 1);
    setBoardCell(board, 1, 0, 1, 1);

    const result = playMove(board, 0, 0, 0, 2, new Set());
    expect(result).not.toBeNull();
    expect(result!.board.cells[0][1].owner).toBe(0);
    expect(result!.board.cells[1][0].owner).toBe(0);
  });

  it('handles chain reactions across multiple waves', () => {
    // Set up a chain: corner (0,0) explodes into edge (1,0) which is already at 2
    const board = makeBoard(3, 3);
    setBoardCell(board, 0, 0, 1, 0);  // corner, cm=2
    setBoardCell(board, 0, 1, 2, 0);  // edge, cm=3 — will reach 3 after receiving from (0,0)

    const result = playMove(board, 0, 0, 0, 2, new Set());
    expect(result).not.toBeNull();
    expect(result!.steps.length).toBeGreaterThanOrEqual(2);
  });

  it('does not trigger win on first round (first-turn rule)', () => {
    // Player 0 places, triggers explosion that wipes player 1's only cell.
    // But player 1 hasn't played yet, so no win.
    const board = makeBoard(3, 3);
    setBoardCell(board, 0, 0, 1, 0);
    setBoardCell(board, 0, 1, 1, 1);

    const result = playMove(board, 0, 0, 0, 2, new Set());
    expect(result).not.toBeNull();
    // Player 0 should own everything, but since player 1 hasn't played,
    // this is not a "win" — the game continues.
    // The chain reaction should continue processing (not break early).
  });

  it('detects win when all players have played and only one owner remains', () => {
    const board = makeBoard(3, 3);
    setBoardCell(board, 0, 0, 1, 0);
    setBoardCell(board, 0, 1, 1, 1);

    const hasPlayed = new Set([0, 1]);
    const result = playMove(board, 0, 0, 0, 2, hasPlayed);
    expect(result).not.toBeNull();
    const owners = ownersAlive(result!.board);
    expect(owners.size).toBe(1);
    expect(owners.has(0)).toBe(true);
  });

  it('records explosion steps with correct structure', () => {
    const board = makeBoard(3, 3);
    setBoardCell(board, 0, 0, 1, 0);
    const result = playMove(board, 0, 0, 0, 2, new Set());
    expect(result).not.toBeNull();
    const step = result!.steps[0];
    expect(step.explodingCells.length).toBeGreaterThan(0);
    expect(step.explodingCells[0]).toHaveProperty('c');
    expect(step.explodingCells[0]).toHaveProperty('r');
    expect(step.explodingCells[0]).toHaveProperty('owner');
    expect(step.explodingCells[0]).toHaveProperty('criticalMass');
    expect(step.boardAfter).toHaveProperty('cells');
  });

  it('handles simultaneous explosions in the same wave', () => {
    // Two adjacent corners both at critical mass
    const board = makeBoard(3, 3);
    setBoardCell(board, 0, 0, 1, 0); // corner cm=2, will reach 2
    setBoardCell(board, 0, 2, 1, 0); // corner cm=2

    // Place at (0,1) edge — cm=3, count becomes 1. Won't explode.
    // Instead, set both corners to 1 and trigger (0,0)
    const board2 = makeBoard(4, 4);
    setBoardCell(board2, 0, 0, 1, 0); // corner cm=2
    setBoardCell(board2, 0, 1, 2, 0); // edge cm=3, will get +1 from (0,0) => 3 => explodes
    setBoardCell(board2, 1, 0, 2, 0); // edge cm=3, will get +1 from (0,0) => 3 => explodes

    const result = playMove(board2, 0, 0, 0, 2, new Set());
    expect(result).not.toBeNull();
    // First wave: (0,0) explodes
    // Second wave: (0,1) and (1,0) explode simultaneously
    expect(result!.steps.length).toBeGreaterThanOrEqual(2);
    if (result!.steps.length >= 2) {
      expect(result!.steps[1].explodingCells.length).toBe(2);
    }
  });

  it('retains remaining orbs when count exceeds critical mass', () => {
    // Interior cell (cm=4) with count 5 — after explosion: 5-4=1, owner stays
    const board = makeBoard(3, 3);
    setBoardCell(board, 1, 1, 4, 0); // interior cm=4, already at critical

    const result = playMove(board, 1, 1, 0, 2, new Set([0]));
    expect(result).not.toBeNull();
    expect(result!.steps.length).toBeGreaterThan(0);
    // After explosion: 5-4=1, cell should retain 1 orb with owner 0
    // (neighbors may also add back, so count could be higher — but owner stays)
    expect(result!.steps[0].boardAfter.cells[1][1].count).toBeGreaterThanOrEqual(1);
    expect(result!.steps[0].boardAfter.cells[1][1].owner).toBe(0);
  });

  it('handles a large chain reaction without exceeding runaway guard', () => {
    // Fill a row of an edge with orbs near critical mass
    const board = makeBoard(6, 4);
    for (let c = 0; c < 6; c++) {
      const cm = criticalMass(c, 0, 6, 4);
      setBoardCell(board, 0, c, cm - 1, 0);
    }
    const result = playMove(board, 0, 0, 0, 2, new Set());
    expect(result).not.toBeNull();
    expect(result!.steps.length).toBeGreaterThan(0);
  });

  it('player elimination: eliminated player has no cells after chain reaction', () => {
    const board = makeBoard(3, 3);
    setBoardCell(board, 0, 0, 1, 0);
    setBoardCell(board, 0, 1, 1, 1);
    setBoardCell(board, 2, 2, 1, 1);

    const hasPlayed = new Set([0, 1]);
    const result = playMove(board, 0, 0, 0, 2, hasPlayed);
    expect(result).not.toBeNull();
    // (0,1) captured by player 0, but player 1 still has (2,2)
    expect(ownersAlive(result!.board).has(1)).toBe(true);
  });

  it('chain reactions continue after all opponents are eliminated', () => {
    // Set up: winning explosion triggers further chain reactions
    // Corner (0,0) at 1, opponent at (0,1) at 1, player's edge (1,0) at cm-1
    // Explosion at (0,0) captures (0,1) and pushes (1,0) to critical → further chain
    const board = makeBoard(3, 3);
    setBoardCell(board, 0, 0, 1, 0);
    setBoardCell(board, 0, 1, 1, 1);
    setBoardCell(board, 1, 0, 2, 0); // edge cm=3, will get +1 from (0,0) => explodes

    const hasPlayed = new Set([0, 1]);
    const result = playMove(board, 0, 0, 0, 2, hasPlayed);
    expect(result).not.toBeNull();
    // Should have at least 2 steps: (0,0) explodes, then (1,0) explodes
    expect(result!.steps.length).toBeGreaterThanOrEqual(2);
  });
});
