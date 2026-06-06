# Game Engine Logic

Source: ported from `game-engine.jsx` in the HTML prototype.

## Core Data Structures

```typescript
// A single cell on the board
interface Cell {
  count: number;   // number of orbs (0+)
  owner: number | null;  // player index (0,1,2,3) or null if empty
}

// The board
interface Board {
  cols: number;
  rows: number;
  cells: Cell[][];  // cells[row][col]
}

// Result of playMove()
interface MoveResult {
  board: Board;
  steps: ExplosionStep[];  // animation frames
}

// One wave of simultaneous explosions
interface ExplosionStep {
  explode: Array<{ c: number; r: number; owner: number; cm: number }>;
  after: Board;  // board snapshot after this wave
}
```

## Grid Options (selectable by user)

```typescript
const CR_GRID_OPTIONS = [
  { key: 'small',  label: '6×4',  cols: 6,  rows: 4  },
  { key: 'medium', label: '9×6',  cols: 9,  rows: 6  },
  { key: 'large',  label: '12×8', cols: 12, rows: 8  },
];
```

## Critical Mass

A cell explodes when `count >= criticalMass`. Critical mass equals the number of orthogonal neighbors:

```typescript
function criticalMass(c: number, r: number, cols: number, rows: number): number {
  let n = 0;
  if (c > 0) n++;
  if (c < cols - 1) n++;
  if (r > 0) n++;
  if (r < rows - 1) n++;
  return n;
  // corners = 2, edges = 3, interior = 4
}
```

## Neighbors

```typescript
function neighbors(c: number, r: number, cols: number, rows: number): [number, number][] {
  const out: [number, number][] = [];
  if (c > 0) out.push([c - 1, r]);
  if (c < cols - 1) out.push([c + 1, r]);
  if (r > 0) out.push([c, r - 1]);
  if (r < rows - 1) out.push([c, r + 1]);
  return out;
}
```

## playMove — Main Entry Point

```typescript
// Returns null if the move is illegal (cell owned by a different player).
// Returns { board, steps } on success.
// steps is an array of explosion waves for animation sequencing.
function playMove(
  board: Board,
  c: number,
  r: number,
  playerId: number,
  hasPlayed: Record<number, boolean>  // tracks which players have moved at least once
): MoveResult | null {

  const cell = board.cells[r][c];
  // Illegal if the cell is owned by someone else
  if (cell.owner !== null && cell.owner !== playerId) return null;

  // Place orb
  const b = cloneBoard(board);
  b.cells[r][c].count += 1;
  b.cells[r][c].owner = playerId;

  const steps: ExplosionStep[] = [];
  let safety = 0;

  // BFS-style: process all simultaneously-critical cells in waves
  while (true) {
    const explode = [];
    for (let rr = 0; rr < b.rows; rr++) {
      for (let cc = 0; cc < b.cols; cc++) {
        const cm = criticalMass(cc, rr, b.cols, b.rows);
        if (b.cells[rr][cc].count >= cm) {
          explode.push({ c: cc, r: rr, owner: b.cells[rr][cc].owner, cm });
        }
      }
    }
    if (explode.length === 0) break;

    // Apply all explosions simultaneously
    const adds: Array<{ c: number; r: number; owner: number }> = [];
    for (const e of explode) {
      b.cells[e.r][e.c].count -= e.cm;
      if (b.cells[e.r][e.c].count <= 0) {
        b.cells[e.r][e.c].count = 0;
        b.cells[e.r][e.c].owner = null;
      }
      for (const [nc, nr] of neighbors(e.c, e.r, b.cols, b.rows)) {
        adds.push({ c: nc, r: nr, owner: e.owner });
      }
    }
    for (const a of adds) {
      b.cells[a.r][a.c].count += 1;
      b.cells[a.r][a.c].owner = a.owner;
    }

    steps.push({ explode, after: cloneBoard(b) });

    // Check win condition: only one owner left, and all players have had a turn
    const owners = ownersAlive(b);
    const playedAll = Object.keys(hasPlayed).length >= /* playerCount — pass in */;
    if (playedAll && owners.size <= 1) break;

    if (++safety > 400) break; // runaway guard
  }

  return { board: b, steps };
}
```

## Win Condition

```typescript
function ownersAlive(board: Board): Set<number> {
  const set = new Set<number>();
  for (let r = 0; r < board.rows; r++)
    for (let c = 0; c < board.cols; c++)
      if (board.cells[r][c].owner !== null)
        set.add(board.cells[r][c].owner);
  return set;
}

// Win check (called after each move, once all players have played at least once):
// owners.size === 1  =>  winner is [...owners][0]
```

**First-turn rule**: A player cannot be eliminated on the first round. Only check win condition once every player has made at least one move (`hasPlayed[playerId] = true` for all active players).

## Player Elimination

A player is eliminated when:
- They have played at least once (`hasPlayed[playerId] === true`), AND
- They own zero cells (`!ownersAlive(board).has(playerId)`)

Eliminated players are skipped in turn order.

## Score (orb count per player)

```typescript
function countOrbs(board: Board): Record<number, number> {
  const map: Record<number, number> = {};
  for (let r = 0; r < board.rows; r++)
    for (let c = 0; c < board.cols; c++) {
      const o = board.cells[r][c].owner;
      if (o !== null) map[o] = (map[o] || 0) + board.cells[r][c].count;
    }
  return map;
}
```
