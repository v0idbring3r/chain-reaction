// CRBoard — orchestrates moves, plays chain-reaction animation steps,
// emits onMoveComplete(nextBoard, winner?) when settled.
//
// Animation timing per step: explode 180ms, travel 220ms = 400ms per wave.
// "speed" multiplier from tweaks scales these durations.

function CRBoard({
  board, currentPlayer, palette, shape,
  speed = 1, onMove, onWinner, animatingRef,
  cellSize, hasPlayed,
}) {
  const [displayBoard, setDisplayBoard] = React.useState(board);
  const [explodingCells, setExplodingCells] = React.useState([]); // [{c,r,color}]
  const [travelers, setTravelers] = React.useState([]); // [{from,to,color,id}]
  const [bursts, setBursts] = React.useState([]); // [{c,r,color,id}]
  const [justAdded, setJustAdded] = React.useState(null); // {c,r}
  const [animating, setAnimating] = React.useState(false);

  // keep displayBoard in sync when board changes externally (reset etc.)
  React.useEffect(() => {
    if (!animating) setDisplayBoard(board);
  }, [board]);

  React.useEffect(() => {
    if (animatingRef) animatingRef.current = animating;
  }, [animating]);

  const explodeMs = 180 / speed;
  const travelMs = 220 / speed;
  const stepMs = explodeMs + travelMs;

  function handleTap(c, r) {
    if (animating) return;
    const cell = board.cells[r][c];
    if (cell.owner !== null && cell.owner !== currentPlayer) return;
    const color = palette[currentPlayer % palette.length];

    // Apply the +1 visually with a pop, then run chain reaction if any.
    const result = playMove(board, c, r, currentPlayer, hasPlayed);
    if (!result) return;

    setJustAdded({ c, r });
    // Show the +1 pre-explosion
    const preBoard = cloneBoard(board);
    preBoard.cells[r][c].count += 1;
    preBoard.cells[r][c].owner = currentPlayer;
    setDisplayBoard(preBoard);

    if (result.steps.length === 0) {
      // No explosion — settle immediately after pop.
      setTimeout(() => {
        setJustAdded(null);
        onMove && onMove(result.board);
      }, 240 / speed);
      return;
    }

    setAnimating(true);
    // Run each wave with explode + travel
    let t = 240 / speed;
    let cur = preBoard;
    result.steps.forEach((step, idx) => {
      const explodeAt = t;
      const travelAt = t + explodeMs;
      const settleAt = t + stepMs;

      // schedule explosions
      setTimeout(() => {
        const exs = step.explode.map(e => ({
          c: e.c, r: e.r, color: palette[e.owner % palette.length],
        }));
        setExplodingCells(exs);
        // bursts
        setBursts(exs.map((e, i) => ({ ...e, id: `${idx}-${i}-${Date.now()}` })));
        // remove count from exploding cells now (visual)
        const mid = cloneBoard(cur);
        for (const e of step.explode) {
          mid.cells[e.r][e.c].count -= e.cm;
          if (mid.cells[e.r][e.c].count <= 0) {
            mid.cells[e.r][e.c].count = 0;
            mid.cells[e.r][e.c].owner = null;
          }
        }
        setDisplayBoard(mid);
        cur = mid;
      }, explodeAt);

      // travelers
      setTimeout(() => {
        const trvs = [];
        for (const e of step.explode) {
          const color = palette[e.owner % palette.length];
          for (const [nc, nr] of neighbors(e.c, e.r, board.cols, board.rows)) {
            trvs.push({
              from: { c: e.c, r: e.r }, to: { c: nc, r: nr },
              color, id: `${idx}-${e.c}-${e.r}-${nc}-${nr}-${Date.now()}`,
            });
          }
        }
        setTravelers(trvs);
        setExplodingCells([]);
      }, travelAt);

      // settle wave: replace board with step.after
      setTimeout(() => {
        setTravelers([]);
        setBursts([]);
        setDisplayBoard(step.after);
        cur = step.after;
      }, settleAt);

      t = settleAt;
    });

    // Final settle
    setTimeout(() => {
      setJustAdded(null);
      setAnimating(false);
      onMove && onMove(result.board);
      // Win detection: when >1 player has played, only one owner left
      const playedCount = Object.values(hasPlayed).filter(Boolean).length;
      if (playedCount >= 2) {
        const owners = ownersAlive(result.board);
        if (owners.size === 1) {
          onWinner && onWinner([...owners][0]);
        }
      }
    }, t + 40);
  }

  const explodingMap = {};
  for (const e of explodingCells) explodingMap[`${e.c},${e.r}`] = true;

  // critical-soon detection: a cell is at (criticalMass - 1) and is owned
  function isCriticalSoon(c, r, cell) {
    if (cell.count === 0) return false;
    return cell.count >= criticalMass(c, r, board.cols, board.rows) - 1;
  }

  return (
    <div style={{
      position: 'relative',
      width: board.cols * cellSize,
      height: board.rows * cellSize,
    }}>
      {displayBoard.cells.map((row, r) => (
        <div key={r} style={{ display: 'flex' }}>
          {row.map((cell, c) => (
            <CRCell
              key={`${c},${r}`}
              c={c} r={r} cell={cell}
              cellSize={cellSize}
              shape={shape}
              palette={palette}
              criticalSoon={isCriticalSoon(c, r, cell)}
              exploding={!!explodingMap[`${c},${r}`]}
              justAdded={justAdded && justAdded.c === c && justAdded.r === r}
              currentPlayerColor={palette[currentPlayer % palette.length]}
              onTap={() => handleTap(c, r)}
            />
          ))}
        </div>
      ))}
      {travelers.map(t => (
        <CRTraveler
          key={t.id}
          from={t.from} to={t.to} color={t.color}
          shape={shape} cellSize={cellSize}
          duration={travelMs}
        />
      ))}
      {bursts.map(b => (
        <CRBurst key={b.id} c={b.c} r={b.r} color={b.color} cellSize={cellSize} />
      ))}
    </div>
  );
}

Object.assign(window, { CRBoard });
