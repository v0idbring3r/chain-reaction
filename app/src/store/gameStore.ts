import { create } from 'zustand';
import { Board, ExplosionStep, GridOption } from '../types/game.types';
import { makeBoard, playMove, ownersAlive, countOrbs, cloneBoard } from '../engine/GameEngine';
import { CR_GRID_OPTIONS, MIN_PLAYERS } from '../utils/constants';
import { CR_PALETTES } from '../utils/colors';

type GamePhase = 'home' | 'setup' | 'playing' | 'paused' | 'won';
type PaletteKey = keyof typeof CR_PALETTES;

interface GameState {
  phase: GamePhase;
  playerCount: number;
  gridOption: GridOption;
  paletteKey: PaletteKey;
  board: Board;
  currentPlayer: number;
  hasPlayed: Set<number>;
  eliminatedPlayers: Set<number>;
  winner: number | null;
  turnNumber: number;
  lastMoveSteps: ReadonlyArray<ExplosionStep>;
  animatingExplosion: boolean;
  pendingFinalBoard: Board | null;
  pendingWinner: number | null;
  pendingNextPlayer: number;
  pendingEliminated: Set<number>;
  pendingHasPlayed: Set<number>;
}

interface GameActions {
  setPlayerCount: (count: number) => void;
  setGridOption: (option: GridOption) => void;
  setPaletteKey: (key: PaletteKey) => void;
  startGame: () => void;
  playCell: (c: number, r: number) => boolean;
  applyExplosionStep: (stepIndex: number) => void;
  finishExplosionSequence: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  goHome: () => void;
}

export type GameStore = GameState & GameActions;

const DEFAULT_GRID = CR_GRID_OPTIONS[1];

function createInitialBoard(): Board {
  return makeBoard(DEFAULT_GRID.cols, DEFAULT_GRID.rows);
}

export function getNextPlayer(
  current: number,
  eliminated: ReadonlySet<number>,
  playerCount: number,
): number {
  for (let i = 1; i <= playerCount; i++) {
    const candidate = (current + i) % playerCount;
    if (!eliminated.has(candidate)) return candidate;
  }
  return current;
}

function findEliminatedPlayers(
  board: Board,
  hasPlayed: Set<number>,
  playerCount: number,
): Set<number> {
  const alive = ownersAlive(board);
  const eliminated = new Set<number>();
  for (let p = 0; p < playerCount; p++) {
    if (hasPlayed.has(p) && !alive.has(p)) {
      eliminated.add(p);
    }
  }
  return eliminated;
}

const INITIAL_STATE = {
  phase: 'home' as GamePhase,
  playerCount: MIN_PLAYERS,
  gridOption: DEFAULT_GRID,
  paletteKey: 'neon' as PaletteKey,
  board: createInitialBoard(),
  currentPlayer: 0,
  hasPlayed: new Set<number>(),
  eliminatedPlayers: new Set<number>(),
  winner: null as number | null,
  turnNumber: 0,
  lastMoveSteps: [] as ReadonlyArray<ExplosionStep>,
  animatingExplosion: false,
  pendingFinalBoard: null as Board | null,
  pendingWinner: null as number | null,
  pendingNextPlayer: 0,
  pendingEliminated: new Set<number>(),
  pendingHasPlayed: new Set<number>(),
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,

  setPlayerCount: (count) => set({ playerCount: count }),
  setGridOption: (option) => set({ gridOption: option }),
  setPaletteKey: (key) => set({ paletteKey: key }),

  startGame: () => {
    const { gridOption, playerCount } = get();
    set({
      phase: 'playing',
      board: makeBoard(gridOption.cols, gridOption.rows),
      currentPlayer: 0,
      hasPlayed: new Set(),
      eliminatedPlayers: new Set(),
      winner: null,
      turnNumber: 0,
      lastMoveSteps: [],
      animatingExplosion: false,
      pendingFinalBoard: null,
      pendingWinner: null,
      pendingNextPlayer: 0,
      pendingEliminated: new Set(),
      pendingHasPlayed: new Set(),
      playerCount,
    });
  },

  playCell: (c, r) => {
    const { board, currentPlayer, playerCount, hasPlayed, phase, animatingExplosion } = get();
    if (phase !== 'playing' || animatingExplosion) return false;

    const result = playMove(board, c, r, currentPlayer, playerCount, hasPlayed);
    if (result === null) return false;

    const updatedHasPlayed = new Set(hasPlayed);
    updatedHasPlayed.add(currentPlayer);

    const eliminated = findEliminatedPlayers(result.board, updatedHasPlayed, playerCount);
    const alive = ownersAlive(result.board);
    const allPlayed = updatedHasPlayed.size >= playerCount;
    const winner = allPlayed && alive.size === 1 ? [...alive][0] : null;

    const nextPlayer = winner !== null
      ? currentPlayer
      : getNextPlayer(currentPlayer, eliminated, playerCount);

    if (result.steps.length > 0) {
      // Build pre-explosion board: orb placed but no chain reactions yet
      const preExplosionBoard = cloneBoard(board);
      const cell = preExplosionBoard.cells[r][c] as { count: number; owner: number | null };
      cell.count += 1;
      cell.owner = currentPlayer;

      set({
        board: preExplosionBoard,
        lastMoveSteps: result.steps,
        animatingExplosion: true,
        pendingFinalBoard: result.board,
        pendingWinner: winner,
        pendingNextPlayer: nextPlayer,
        pendingEliminated: eliminated,
        pendingHasPlayed: updatedHasPlayed,
        turnNumber: get().turnNumber + 1,
      });
    } else {
      set({
        board: result.board,
        lastMoveSteps: [],
        hasPlayed: updatedHasPlayed,
        eliminatedPlayers: eliminated,
        currentPlayer: nextPlayer,
        winner,
        phase: winner !== null ? 'won' : 'playing',
        turnNumber: get().turnNumber + 1,
        animatingExplosion: false,
        pendingFinalBoard: null,
      });
    }

    return true;
  },

  applyExplosionStep: (stepIndex) => {
    const { lastMoveSteps } = get();
    if (stepIndex < 0 || stepIndex >= lastMoveSteps.length) return;
    set({ board: lastMoveSteps[stepIndex].boardAfter });
  },

  finishExplosionSequence: () => {
    const { pendingFinalBoard, pendingWinner, pendingNextPlayer, pendingEliminated, pendingHasPlayed } = get();
    set({
      board: pendingFinalBoard ?? get().board,
      animatingExplosion: false,
      hasPlayed: pendingHasPlayed,
      eliminatedPlayers: pendingEliminated,
      currentPlayer: pendingNextPlayer,
      winner: pendingWinner,
      phase: pendingWinner !== null ? 'won' : 'playing',
      pendingFinalBoard: null,
      pendingWinner: null,
      pendingEliminated: new Set(),
      pendingHasPlayed: new Set(),
      lastMoveSteps: [],
    });
  },

  pauseGame: () => set({ phase: 'paused' }),
  resumeGame: () => set({ phase: 'playing' }),

  resetGame: () => {
    const { gridOption } = get();
    set({
      phase: 'setup',
      board: makeBoard(gridOption.cols, gridOption.rows),
      currentPlayer: 0,
      hasPlayed: new Set(),
      eliminatedPlayers: new Set(),
      winner: null,
      turnNumber: 0,
      lastMoveSteps: [],
      animatingExplosion: false,
      pendingFinalBoard: null,
      pendingWinner: null,
      pendingEliminated: new Set(),
      pendingHasPlayed: new Set(),
    });
  },

  goHome: () => set({
    ...INITIAL_STATE,
    board: createInitialBoard(),
    hasPlayed: new Set(),
    eliminatedPlayers: new Set(),
    pendingEliminated: new Set(),
    pendingHasPlayed: new Set(),
  }),
}));

export function getPlayerColor(paletteKey: PaletteKey, playerIndex: number): string {
  return CR_PALETTES[paletteKey][playerIndex];
}

export function getOrbCounts(board: Board): Record<number, number> {
  return countOrbs(board);
}
