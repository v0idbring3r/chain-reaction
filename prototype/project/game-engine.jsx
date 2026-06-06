// Chain Reaction game engine — pure logic, no UI.
// Cells store { count, owner } where owner is null for empty.
// Critical mass = number of orthogonal neighbors (corners=2, edges=3, interior=4).

function makeBoard(cols, rows) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push({ count: 0, owner: null });
    cells.push(row);
  }
  return { cols, rows, cells };
}

function criticalMass(c, r, cols, rows) {
  let n = 0;
  if (c > 0) n++;
  if (c < cols - 1) n++;
  if (r > 0) n++;
  if (r < rows - 1) n++;
  return n;
}

function neighbors(c, r, cols, rows) {
  const out = [];
  if (c > 0) out.push([c - 1, r]);
  if (c < cols - 1) out.push([c + 1, r]);
  if (r > 0) out.push([c, r - 1]);
  if (r < rows - 1) out.push([c, r + 1]);
  return out;
}

function cloneBoard(b) {
  return {
    cols: b.cols,
    rows: b.rows,
    cells: b.cells.map(row => row.map(cell => ({ ...cell }))),
  };
}

// Returns { board, steps } where steps is an array of explosion frames:
// each frame { explode: [{c,r,owner}], after: board-snapshot }
// playMove returns null if move is illegal.
function playMove(board, c, r, playerId, hasPlayed) {
  const cell = board.cells[r][c];
  if (cell.owner !== null && cell.owner !== playerId) return null;
  if (cell.count === 0 && hasPlayed[playerId] && false) {
    // not a real rule — placeholder
  }
  const b = cloneBoard(board);
  b.cells[r][c].count += 1;
  b.cells[r][c].owner = playerId;

  const steps = [];
  // BFS-style explode any cell at/over critical, in waves.
  let safety = 0;
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

    // Apply all explosions simultaneously.
    // First subtract critical mass from each exploding cell, then add 1 to each neighbor with new owner.
    const adds = []; // {c, r, owner}
    for (const e of explode) {
      const cm = e.cm;
      b.cells[e.r][e.c].count -= cm;
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

    // After explosion, check if game is over (one owner left & every player has had a turn)
    const owners = new Set();
    for (let rr = 0; rr < b.rows; rr++) {
      for (let cc = 0; cc < b.cols; cc++) {
        if (b.cells[rr][cc].owner !== null) owners.add(b.cells[rr][cc].owner);
      }
    }
    if (owners.size <= 1) break;

    safety++;
    if (safety > 400) break; // prevent runaway
  }

  return { board: b, steps };
}

function ownersAlive(board) {
  const set = new Set();
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (board.cells[r][c].owner !== null) set.add(board.cells[r][c].owner);
    }
  }
  return set;
}

function countOrbs(board) {
  const map = {};
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const o = board.cells[r][c].owner;
      if (o !== null) map[o] = (map[o] || 0) + board.cells[r][c].count;
    }
  }
  return map;
}

Object.assign(window, {
  makeBoard, criticalMass, neighbors, cloneBoard, playMove, ownersAlive, countOrbs,
});
