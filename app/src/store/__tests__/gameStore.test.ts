import { useGameStore, getNextPlayer, getPlayerColor, getOrbCounts } from '../gameStore';
import { CR_GRID_OPTIONS } from '../../utils/constants';
import { Board } from '../../types/game.types';

function resetStore() {
  useGameStore.getState().goHome();
}

function setBoardCell(board: Board, r: number, c: number, count: number, owner: number | null): void {
  (board.cells[r][c] as { count: number; owner: number | null }).count = count;
  (board.cells[r][c] as { count: number; owner: number | null }).owner = owner;
}

beforeEach(() => {
  resetStore();
});

describe('getNextPlayer', () => {
  it('advances to the next player', () => {
    expect(getNextPlayer(0, new Set(), 4)).toBe(1);
    expect(getNextPlayer(1, new Set(), 4)).toBe(2);
  });

  it('wraps around to player 0', () => {
    expect(getNextPlayer(3, new Set(), 4)).toBe(0);
    expect(getNextPlayer(1, new Set(), 2)).toBe(0);
  });

  it('skips eliminated players', () => {
    expect(getNextPlayer(0, new Set([1]), 4)).toBe(2);
    expect(getNextPlayer(0, new Set([1, 2]), 4)).toBe(3);
  });

  it('wraps around skipping eliminated players', () => {
    expect(getNextPlayer(2, new Set([3, 0]), 4)).toBe(1);
  });

  it('returns current if all others eliminated', () => {
    expect(getNextPlayer(0, new Set([1, 2, 3]), 4)).toBe(0);
  });

  it('returns current if all players including self are eliminated', () => {
    expect(getNextPlayer(0, new Set([0, 1, 2, 3]), 4)).toBe(0);
  });
});

describe('getPlayerColor', () => {
  it('returns correct color from neon palette', () => {
    expect(getPlayerColor('neon', 0)).toBe('#00E5FF');
    expect(getPlayerColor('neon', 1)).toBe('#FF2E93');
  });

  it('returns correct color from arcade palette', () => {
    expect(getPlayerColor('arcade', 0)).toBe('#3D8BFF');
  });

  it('returns correct color from toxic palette', () => {
    expect(getPlayerColor('toxic', 2)).toBe('#00F0FF');
  });
});

describe('getOrbCounts', () => {
  it('returns empty object for empty board', () => {
    const state = useGameStore.getState();
    expect(getOrbCounts(state.board)).toEqual({});
  });
});

describe('initial state', () => {
  it('starts in home phase', () => {
    const state = useGameStore.getState();
    expect(state.phase).toBe('home');
    expect(state.playerCount).toBe(2);
    expect(state.gridOption).toBe(CR_GRID_OPTIONS[1]);
    expect(state.paletteKey).toBe('neon');
    expect(state.currentPlayer).toBe(0);
    expect(state.winner).toBeNull();
    expect(state.turnNumber).toBe(0);
    expect(state.lastMoveSteps).toEqual([]);
    expect(state.hasPlayed.size).toBe(0);
    expect(state.eliminatedPlayers.size).toBe(0);
    expect(state.hapticsEnabled).toBe(true);
    expect(state.soundEnabled).toBe(true);
  });
});

describe('setters', () => {
  it('setPlayerCount updates player count', () => {
    useGameStore.getState().setPlayerCount(4);
    expect(useGameStore.getState().playerCount).toBe(4);
  });

  it('setGridOption updates grid option', () => {
    useGameStore.getState().setGridOption(CR_GRID_OPTIONS[0]);
    expect(useGameStore.getState().gridOption).toBe(CR_GRID_OPTIONS[0]);
  });

  it('setPaletteKey updates palette', () => {
    useGameStore.getState().setPaletteKey('toxic');
    expect(useGameStore.getState().paletteKey).toBe('toxic');
  });

  it('setDelayWinScreen updates setting', () => {
    useGameStore.getState().setDelayWinScreen(false);
    expect(useGameStore.getState().delayWinScreen).toBe(false);
    useGameStore.getState().setDelayWinScreen(true);
    expect(useGameStore.getState().delayWinScreen).toBe(true);
  });

  it('setHapticsEnabled updates setting', () => {
    useGameStore.getState().setHapticsEnabled(false);
    expect(useGameStore.getState().hapticsEnabled).toBe(false);
    useGameStore.getState().setHapticsEnabled(true);
    expect(useGameStore.getState().hapticsEnabled).toBe(true);
  });

  it('setSoundEnabled updates setting', () => {
    useGameStore.getState().setSoundEnabled(false);
    expect(useGameStore.getState().soundEnabled).toBe(false);
    useGameStore.getState().setSoundEnabled(true);
    expect(useGameStore.getState().soundEnabled).toBe(true);
  });
});

describe('startGame', () => {
  it('transitions to playing phase with correct board dimensions', () => {
    useGameStore.getState().setGridOption(CR_GRID_OPTIONS[0]); // 4x6
    useGameStore.getState().setPlayerCount(3);
    useGameStore.getState().startGame();

    const state = useGameStore.getState();
    expect(state.phase).toBe('playing');
    expect(state.board.cols).toBe(4);
    expect(state.board.rows).toBe(6);
    expect(state.playerCount).toBe(3);
    expect(state.currentPlayer).toBe(0);
    expect(state.winner).toBeNull();
    expect(state.turnNumber).toBe(0);
    expect(state.hasPlayed.size).toBe(0);
    expect(state.eliminatedPlayers.size).toBe(0);
  });

  it('resets game state on restart', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().playCell(0, 0);
    useGameStore.getState().startGame();

    const state = useGameStore.getState();
    expect(state.turnNumber).toBe(0);
    expect(state.hasPlayed.size).toBe(0);
  });
});

describe('playCell', () => {
  beforeEach(() => {
    useGameStore.getState().setPlayerCount(2);
    useGameStore.getState().setGridOption(CR_GRID_OPTIONS[1]); // 9x6
    useGameStore.getState().startGame();
  });

  it('places an orb on an empty cell and advances turn', () => {
    const result = useGameStore.getState().playCell(0, 0);
    expect(result).toBe(true);

    const state = useGameStore.getState();
    expect(state.board.cells[0][0].count).toBe(1);
    expect(state.board.cells[0][0].owner).toBe(0);
    expect(state.currentPlayer).toBe(1);
    expect(state.turnNumber).toBe(1);
    expect(state.hasPlayed.has(0)).toBe(true);
  });

  it('rejects a move on an opponent cell', () => {
    useGameStore.getState().playCell(0, 0); // player 0
    const result = useGameStore.getState().playCell(0, 0); // player 1 tries same cell
    expect(result).toBe(false);
    expect(useGameStore.getState().currentPlayer).toBe(1); // turn did not advance
  });

  it('rejects moves when not in playing phase', () => {
    useGameStore.getState().pauseGame();
    expect(useGameStore.getState().playCell(0, 0)).toBe(false);
  });

  it('stores explosion steps and enters animating state on chain reaction', () => {
    useGameStore.getState().playCell(0, 0); // p0: corner (0,0) = 1
    useGameStore.getState().playCell(1, 1); // p1
    const result = useGameStore.getState().playCell(0, 0); // p0: corner (0,0) = 2 => explodes

    expect(result).toBe(true);
    const state = useGameStore.getState();
    expect(state.lastMoveSteps.length).toBeGreaterThan(0);
    expect(state.animatingExplosion).toBe(true);
  });

  it('rejects moves while animating explosion', () => {
    useGameStore.getState().playCell(0, 0); // p0
    useGameStore.getState().playCell(1, 1); // p1
    useGameStore.getState().playCell(0, 0); // p0 triggers explosion

    expect(useGameStore.getState().animatingExplosion).toBe(true);
    expect(useGameStore.getState().playCell(2, 2)).toBe(false);
  });

  it('rotates turns correctly in a 3-player game', () => {
    useGameStore.getState().goHome();
    useGameStore.getState().setPlayerCount(3);
    useGameStore.getState().startGame();

    useGameStore.getState().playCell(0, 0); // p0
    expect(useGameStore.getState().currentPlayer).toBe(1);
    useGameStore.getState().playCell(1, 0); // p1
    expect(useGameStore.getState().currentPlayer).toBe(2);
    useGameStore.getState().playCell(2, 0); // p2
    expect(useGameStore.getState().currentPlayer).toBe(0);
  });

  it('detects winner after finishing explosion sequence', () => {
    useGameStore.getState().goHome();
    useGameStore.getState().setPlayerCount(2);
    useGameStore.getState().setGridOption(CR_GRID_OPTIONS[0]); // 6x4
    useGameStore.getState().startGame();

    const board = useGameStore.getState().board;
    setBoardCell(board, 0, 0, 1, 0);
    setBoardCell(board, 0, 1, 1, 1);
    useGameStore.setState({
      board,
      hasPlayed: new Set([0, 1]),
      currentPlayer: 0,
    });

    useGameStore.getState().playCell(0, 0); // p0 explodes, captures (0,1)

    // During animation, winner is pending
    expect(useGameStore.getState().animatingExplosion).toBe(true);
    expect(useGameStore.getState().pendingWinner).toBe(0);

    // Finish sequence to apply winner
    useGameStore.getState().finishExplosionSequence();

    const state = useGameStore.getState();
    expect(state.winner).toBe(0);
    expect(state.phase).toBe('won');
    expect(state.animatingExplosion).toBe(false);
  });

  it('does not declare winner before all players have moved', () => {
    const board = useGameStore.getState().board;
    setBoardCell(board, 0, 0, 1, 0);
    setBoardCell(board, 0, 1, 1, 1);
    useGameStore.setState({ board, currentPlayer: 0 });

    useGameStore.getState().playCell(0, 0); // p0 explodes, captures p1's cell

    // Explosion triggers animation path
    useGameStore.getState().finishExplosionSequence();

    const state = useGameStore.getState();
    expect(state.winner).toBeNull();
    expect(state.phase).toBe('playing');
  });

  it('eliminates a player after finishing explosion sequence', () => {
    useGameStore.getState().goHome();
    useGameStore.getState().setPlayerCount(3);
    useGameStore.getState().setGridOption(CR_GRID_OPTIONS[0]);
    useGameStore.getState().startGame();

    const board = useGameStore.getState().board;
    setBoardCell(board, 0, 0, 1, 0);
    setBoardCell(board, 0, 1, 1, 1);
    setBoardCell(board, 2, 2, 1, 2);
    useGameStore.setState({
      board,
      hasPlayed: new Set([0, 1, 2]),
      currentPlayer: 0,
    });

    useGameStore.getState().playCell(0, 0); // p0 explodes, captures p1's cell

    // Finish the animation sequence
    useGameStore.getState().finishExplosionSequence();

    const state = useGameStore.getState();
    expect(state.eliminatedPlayers.has(1)).toBe(true);
    expect(state.currentPlayer).toBe(2);
    expect(state.winner).toBeNull();
  });

  it('skips eliminated player turn in 3-player game after sequential play', () => {
    useGameStore.getState().goHome();
    useGameStore.getState().setPlayerCount(3);
    useGameStore.getState().setGridOption(CR_GRID_OPTIONS[0]); // 4x6
    useGameStore.getState().startGame();

    // Round 1: all players place once
    useGameStore.getState().playCell(0, 0); // p0 at corner
    expect(useGameStore.getState().currentPlayer).toBe(1);
    useGameStore.getState().playCell(0, 1); // p1 next to p0's corner
    expect(useGameStore.getState().currentPlayer).toBe(2);
    useGameStore.getState().playCell(2, 2); // p2 somewhere safe
    expect(useGameStore.getState().currentPlayer).toBe(0);

    // Round 2: p0 places on corner again — explodes, captures p1's cell
    useGameStore.getState().playCell(0, 0); // p0 corner (0,0) count=2, cm=2, EXPLODES

    // If explosion happened, finish it
    if (useGameStore.getState().animatingExplosion) {
      useGameStore.getState().finishExplosionSequence();
    }

    const state = useGameStore.getState();
    // p1 should be eliminated (their only cell was captured)
    expect(state.eliminatedPlayers.has(1)).toBe(true);
    // Turn should skip p1 and go to p2
    expect(state.currentPlayer).toBe(2);
  });

  it('rejected move from eliminated player if somehow their turn is reached', () => {
    useGameStore.getState().goHome();
    useGameStore.getState().setPlayerCount(3);
    useGameStore.getState().setGridOption(CR_GRID_OPTIONS[0]);
    useGameStore.getState().startGame();

    // Force state: p1 eliminated, but currentPlayer set to 1 (shouldn't happen but guard against it)
    const board = useGameStore.getState().board;
    setBoardCell(board, 0, 0, 1, 0);
    setBoardCell(board, 2, 2, 1, 2);
    useGameStore.setState({
      board,
      hasPlayed: new Set([0, 1, 2]),
      eliminatedPlayers: new Set([1]),
      currentPlayer: 1,
    });

    // p1 tries to place — should be rejected since they're eliminated
    const result = useGameStore.getState().playCell(1, 1);
    expect(result).toBe(false);
  });
});

describe('pauseGame / resumeGame', () => {
  it('pauses and resumes the game', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().pauseGame();
    expect(useGameStore.getState().phase).toBe('paused');
    useGameStore.getState().resumeGame();
    expect(useGameStore.getState().phase).toBe('playing');
  });
});

describe('resetGame', () => {
  it('returns to setup phase with preserved settings', () => {
    useGameStore.getState().setPlayerCount(3);
    useGameStore.getState().setGridOption(CR_GRID_OPTIONS[2]);
    useGameStore.getState().startGame();
    useGameStore.getState().playCell(0, 0);
    useGameStore.getState().resetGame();

    const state = useGameStore.getState();
    expect(state.phase).toBe('setup');
    expect(state.playerCount).toBe(3);
    expect(state.gridOption).toBe(CR_GRID_OPTIONS[2]);
    expect(state.currentPlayer).toBe(0);
    expect(state.winner).toBeNull();
    expect(state.turnNumber).toBe(0);
    expect(state.hasPlayed.size).toBe(0);
  });
});

describe('goHome', () => {
  it('fully resets all state', () => {
    useGameStore.getState().setPlayerCount(4);
    useGameStore.getState().setPaletteKey('toxic');
    useGameStore.getState().startGame();
    useGameStore.getState().goHome();

    const state = useGameStore.getState();
    expect(state.phase).toBe('home');
    expect(state.playerCount).toBe(2);
    expect(state.paletteKey).toBe('neon');
    expect(state.gridOption).toBe(CR_GRID_OPTIONS[1]);
    expect(state.animatingExplosion).toBe(false);
  });

  it('preserves settings across goHome', () => {
    useGameStore.getState().setDelayWinScreen(false);
    useGameStore.getState().setHapticsEnabled(false);
    useGameStore.getState().setSoundEnabled(false);
    useGameStore.getState().startGame();
    useGameStore.getState().goHome();

    const state = useGameStore.getState();
    expect(state.delayWinScreen).toBe(false);
    expect(state.hapticsEnabled).toBe(false);
    expect(state.soundEnabled).toBe(false);
  });
});

describe('applyExplosionStep', () => {
  it('updates board to step boardAfter', () => {
    useGameStore.getState().setPlayerCount(2);
    useGameStore.getState().setGridOption(CR_GRID_OPTIONS[1]);
    useGameStore.getState().startGame();

    useGameStore.getState().playCell(0, 0); // p0
    useGameStore.getState().playCell(1, 1); // p1
    useGameStore.getState().playCell(0, 0); // p0 triggers explosion

    const state = useGameStore.getState();
    expect(state.animatingExplosion).toBe(true);
    expect(state.lastMoveSteps.length).toBeGreaterThan(0);

    const stepBoard = state.lastMoveSteps[0].boardAfter;
    useGameStore.getState().applyExplosionStep(0);
    expect(useGameStore.getState().board).toBe(stepBoard);
  });

  it('ignores out-of-bounds step index', () => {
    useGameStore.getState().startGame();
    const boardBefore = useGameStore.getState().board;
    useGameStore.getState().applyExplosionStep(99);
    expect(useGameStore.getState().board).toBe(boardBefore);
  });

  it('ignores negative step index', () => {
    useGameStore.getState().startGame();
    const boardBefore = useGameStore.getState().board;
    useGameStore.getState().applyExplosionStep(-1);
    expect(useGameStore.getState().board).toBe(boardBefore);
  });
});

describe('finishExplosionSequence', () => {
  it('applies pending state and clears animation flag', () => {
    useGameStore.getState().setPlayerCount(2);
    useGameStore.getState().setGridOption(CR_GRID_OPTIONS[1]);
    useGameStore.getState().startGame();

    useGameStore.getState().playCell(0, 0); // p0
    useGameStore.getState().playCell(1, 1); // p1
    useGameStore.getState().playCell(0, 0); // p0 triggers explosion

    expect(useGameStore.getState().animatingExplosion).toBe(true);

    useGameStore.getState().finishExplosionSequence();

    const state = useGameStore.getState();
    expect(state.animatingExplosion).toBe(false);
    expect(state.lastMoveSteps).toEqual([]);
    expect(state.pendingFinalBoard).toBeNull();
    expect(state.hasPlayed.has(0)).toBe(true);
  });

  it('falls back to current board when pendingFinalBoard is null', () => {
    useGameStore.getState().startGame();
    const boardBefore = useGameStore.getState().board;
    useGameStore.getState().finishExplosionSequence();
    expect(useGameStore.getState().board).toBe(boardBefore);
  });
});

describe('non-explosion win path', () => {
  it('detects winner immediately when move has no explosions', () => {
    // This is an edge case: a move that results in one owner without explosions
    // Practically rare, but the code path exists at line 172
    useGameStore.getState().setPlayerCount(2);
    useGameStore.getState().setGridOption(CR_GRID_OPTIONS[0]);
    useGameStore.getState().startGame();

    // Set up: player 1 has no cells, player 0 places non-exploding move
    // after all have played. Force the state.
    const board = useGameStore.getState().board;
    setBoardCell(board, 1, 1, 1, 0);
    useGameStore.setState({
      board,
      hasPlayed: new Set([0, 1]),
      currentPlayer: 0,
    });

    // Place on interior cell (cm=4), count goes to 2 — no explosion
    useGameStore.getState().playCell(1, 1);

    const state = useGameStore.getState();
    // No explosion steps, so winner is applied immediately
    expect(state.animatingExplosion).toBe(false);
    expect(state.winner).toBe(0);
    expect(state.phase).toBe('won');
  });
});
