// Top-level app — manages screens (home → setup → game → win),
// renders the gameplay HUD around <CRBoard>.

function CRGameScreen({
  board, currentPlayer, palette, shape, speed,
  hasPlayed, onMove, onWinner, paused, onPause,
  scores, eliminated, playerCount, animationsRef,
  pulse,
}) {
  // Compute cell size to fit ~352px wide working area on the phone
  const maxBoardWidth = 352;
  const maxBoardHeight = 560;
  const cellSize = Math.floor(Math.min(maxBoardWidth / board.cols, maxBoardHeight / board.rows));

  const turnColor = palette[currentPlayer % palette.length];

  return (
    <CRGridBg pattern={pulse}>
      {/* turn glow tint */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${turnColor}18 0%, transparent 65%)`,
        transition: 'background 280ms',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Top bar: pause + turn indicator */}
        <div style={{
          paddingTop: 56, paddingLeft: 16, paddingRight: 16, paddingBottom: 10,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div onClick={onPause} style={{
            width: 36, height: 36, borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <div style={{
              display: 'flex', gap: 3,
            }}>
              <div style={{ width: 3, height: 12, background: '#fff' }} />
              <div style={{ width: 3, height: 12, background: '#fff' }} />
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, letterSpacing: 3, opacity: 0.5,
            }}>// CURRENT TURN</div>
            <div style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 14, fontWeight: 800, letterSpacing: 4,
              color: turnColor, textShadow: `0 0 8px ${turnColor}`,
              marginTop: 2,
            }}>P{currentPlayer + 1} · {CR_PLAYER_NAMES[currentPlayer]}</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 4,
            border: `1px solid ${turnColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${turnColor}12`,
          }}>
            <CRAtom size={14} color={turnColor} shape={shape} />
          </div>
        </div>

        {/* Player tabs */}
        <div style={{
          margin: '0 16px',
          display: 'flex',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          {Array.from({ length: playerCount }).map((_, i) => (
            <CRPlayerTab
              key={i}
              idx={i}
              color={palette[i]}
              count={scores[i] || 0}
              active={i === currentPlayer}
              eliminated={!!eliminated[i]}
            />
          ))}
        </div>

        {/* Board */}
        <div style={{
          flex: 1, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          padding: '14px 0',
        }}>
          <CRBoard
            board={board}
            currentPlayer={currentPlayer}
            palette={palette}
            shape={shape}
            speed={speed}
            cellSize={cellSize}
            hasPlayed={hasPlayed}
            onMove={onMove}
            onWinner={onWinner}
            animatingRef={animationsRef}
          />
        </div>

        {/* Hint footer */}
        <div style={{
          padding: '8px 16px 40px', textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, letterSpacing: 2, opacity: 0.4,
        }}>TAP A CELL · YOUR COLOR OR EMPTY</div>
      </div>

      {paused && (
        <CRPauseOverlay
          onResume={paused.onResume}
          onRestart={paused.onRestart}
          onQuit={paused.onQuit}
          palette={palette}
          soundOn={paused.soundOn}
          setSoundOn={paused.setSoundOn}
        />
      )}
    </CRGridBg>
  );
}

// ── Top app: pure router, manages all state ──────────────
function ChainReactionApp({ deviceWidth = 390, tweaks }) {
  const [screen, setScreen] = React.useState('home'); // home, tutorial, setup, game, win
  const [playerCount, setPlayerCount] = React.useState(tweaks.playerCount);
  const [gridKey, setGridKey] = React.useState(tweaks.gridKey);
  const [board, setBoard] = React.useState(() => {
    const opt = CR_GRID_OPTIONS.find(o => o.key === tweaks.gridKey);
    return makeBoard(opt.cols, opt.rows);
  });
  const [currentPlayer, setCurrentPlayer] = React.useState(0);
  const [hasPlayed, setHasPlayed] = React.useState({});
  const [paused, setPaused] = React.useState(false);
  const [winner, setWinner] = React.useState(null);
  const [soundOn, setSoundOn] = React.useState(true);

  // Sync tweak changes (player count + grid + speed + shape + palette)
  React.useEffect(() => { setPlayerCount(tweaks.playerCount); }, [tweaks.playerCount]);
  React.useEffect(() => { setGridKey(tweaks.gridKey); }, [tweaks.gridKey]);

  const palette = CR_PALETTES[tweaks.paletteKey] || CR_PALETTES.neon;
  const shape = tweaks.atomShape;
  const speed = tweaks.speed;
  const pulse = tweaks.background;

  function startGame() {
    const opt = CR_GRID_OPTIONS.find(o => o.key === gridKey);
    setBoard(makeBoard(opt.cols, opt.rows));
    setCurrentPlayer(0);
    setHasPlayed({});
    setWinner(null);
    setPaused(false);
    setScreen('game');
  }

  function handleMove(nextBoard) {
    setBoard(nextBoard);
    const newPlayed = { ...hasPlayed, [currentPlayer]: true };
    setHasPlayed(newPlayed);

    // Check eliminations + advance
    const owners = ownersAlive(nextBoard);
    const playedAll = Object.keys(newPlayed).length >= playerCount;
    if (playedAll && owners.size === 1) {
      setWinner([...owners][0]);
      setTimeout(() => setScreen('win'), 700);
      return;
    }

    // Advance to next player who hasn't been eliminated
    let next = (currentPlayer + 1) % playerCount;
    let safety = 0;
    while (safety < playerCount) {
      // a player is eliminated if they've played AND no longer have any owned cells
      const eliminated = newPlayed[next] && !owners.has(next);
      if (!eliminated) break;
      next = (next + 1) % playerCount;
      safety++;
    }
    setCurrentPlayer(next);
  }

  function handleWinner(w) {
    setWinner(w);
    setTimeout(() => setScreen('win'), 700);
  }

  // Compute scores + eliminated
  const scores = countOrbs(board);
  const owners = ownersAlive(board);
  const eliminated = {};
  for (let i = 0; i < playerCount; i++) {
    if (hasPlayed[i] && !owners.has(i)) eliminated[i] = true;
  }

  // Render the active screen
  if (screen === 'home') {
    return (
      <CRHomeScreen
        palette={palette}
        onPlay={() => setScreen('setup')}
        onTutorial={() => setScreen('tutorial')}
      />
    );
  }
  if (screen === 'tutorial') {
    return <CRTutorialScreen palette={palette} onClose={() => setScreen('home')} />;
  }
  if (screen === 'setup') {
    return (
      <CRSetupScreen
        playerCount={playerCount} setPlayerCount={setPlayerCount}
        gridKey={gridKey} setGridKey={setGridKey}
        palette={palette}
        onBack={() => setScreen('home')}
        onStart={startGame}
      />
    );
  }
  if (screen === 'win') {
    return (
      <CRWinScreen
        winner={winner !== null ? winner : 0}
        palette={palette}
        onRematch={startGame}
        onHome={() => setScreen('home')}
      />
    );
  }
  // game
  return (
    <CRGameScreen
      board={board}
      currentPlayer={currentPlayer}
      palette={palette}
      shape={shape}
      speed={speed}
      hasPlayed={hasPlayed}
      onMove={handleMove}
      onWinner={handleWinner}
      paused={paused ? {
        onResume: () => setPaused(false),
        onRestart: startGame,
        onQuit: () => { setPaused(false); setScreen('home'); },
        soundOn, setSoundOn,
      } : null}
      onPause={() => setPaused(true)}
      scores={scores}
      eliminated={eliminated}
      playerCount={playerCount}
      pulse={pulse}
    />
  );
}

Object.assign(window, { ChainReactionApp, CRGameScreen });
