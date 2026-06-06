# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        App Entry                            │
│                       (App.tsx)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Screens                                │
│  HomeScreen ─► GameSetupScreen ─► GameScreen ─► WinScreen   │
└──────────────────────┬──────────────────────────────────────┘
                       │ uses
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Components                               │
│  Grid  ──►  Cell  ──►  AtomCluster  ──►  Orb               │
│  PlayerTab                                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ reads/writes
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  State (Zustand)                            │
│                   gameStore.ts                               │
│  board │ currentPlayer │ hasPlayed │ winner │ settings      │
└──────────────────────┬──────────────────────────────────────┘
                       │ delegates logic to
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Engine (Pure TypeScript)                        │
│                  GameEngine.ts                               │
│  makeBoard │ playMove │ ownersAlive │ countOrbs             │
│  criticalMass │ neighbors │ cloneBoard                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ uses
                       ▼
┌──────────────────────┴──────────────────────────────────────┐
│                      Utils                                  │
│  constants.ts (grid options, limits)                        │
│  colors.ts (palettes, player names, theme)                  │
└─────────────────────────────────────────────────────────────┘
```

## Module Responsibilities

### Types (`src/types/game.types.ts`)

Shared type definitions used across all modules. No logic.

- `Cell` — single grid cell (count + owner)
- `Board` — grid dimensions + 2D cell array
- `Position` — column/row coordinate
- `ExplodingCell` — cell that reached critical mass
- `ExplosionStep` — one wave of simultaneous explosions + resulting board snapshot
- `MoveResult` — final board + all explosion steps for animation
- `GridOption` — selectable grid size preset

### Engine (`src/engine/GameEngine.ts`)

Pure game logic. No React imports, no side effects, no UI awareness. Framework-agnostic so it can be tested independently.

```
playMove(board, c, r, playerId, playerCount, hasPlayed)
    │
    ├── isMoveLegal(cell, playerId)
    │       └── Reject if cell owned by another player
    │
    ├── Place orb (clone board, increment count, set owner)
    │
    └── resolveChainReactions(board, playerCount, hasPlayed)
            │
            └── Loop:
                ├── findExplodingCells(board)
                │       └── Scan all cells where count >= criticalMass
                │
                ├── applyExplosions(board, exploding)
                │       ├── Subtract criticalMass from each exploding cell
                │       └── Add 1 orb to each neighbor, set owner
                │
                ├── Record ExplosionStep (snapshot)
                │
                └── Check win condition (all played + 1 owner left)
```

Key design decisions:
- **Immutable interface**: `playMove` clones the board before mutating. Callers never see mutation.
- **BFS-style waves**: All cells at critical mass explode simultaneously per wave, not one at a time.
- **Runaway guard**: Hard limit of 400 iterations prevents infinite loops.

### Utils (`src/utils/`)

Static configuration. No logic, no state.

- **`constants.ts`** — Grid size presets (`6×4`, `9×6`, `12×8`), player count bounds, runaway guard limit
- **`colors.ts`** — Three color palettes (neon/arcade/toxic), player names, theme colors

### Store (`src/store/gameStore.ts`)

Zustand store wrapping the engine. Manages:
- Game phase (`home | setup | playing | paused | won`)
- Current board state and turn tracking
- Player elimination via `ownersAlive` check after each move
- Win detection (all players played + single owner remaining)
- Game settings (player count, grid size, palette)
- Explosion animation state (`animatingExplosion`, `lastMoveSteps`, pending board/winner)

Key actions:
- `playCell(c, r)` — validates move, calls engine. If explosions: sets pre-explosion board, stores steps, enters animation mode. If no explosions: applies final board immediately.
- `applyExplosionStep(index)` — applies intermediate board snapshot during animation sequencing
- `finishExplosionSequence()` — applies pending final board, winner, turn advancement
- `startGame()` / `resetGame()` / `goHome()` — lifecycle transitions

Exported helpers:
- `getNextPlayer(current, eliminated, playerCount)` — turn rotation skipping eliminated players
- `getPlayerColor(paletteKey, playerIndex)` — palette color lookup
- `getOrbCounts(board)` — orb totals per player

### Components (`src/components/`)

React Native UI components with Reanimated 3 animations:
- **Grid** — reads board from store, computes responsive cell size, passes `criticalSoon` and `isExploding` flags to Cells
- **Cell** — Pressable with wobble animation (cr-wobble) when near critical mass, explosion flash overlay (cr-explode-flash)
- **AtomCluster** — positions 1-3 Orbs using absolute layout within a cell
- **Orb** — Animated.View with pop on mount (cr-pop) and idle float (cr-atom-orbit)
- **PlayerTab** — HUD element showing player dot, name, orb count
- **TravelerOrb** — absolutely positioned orb that flies between cells during explosions (cr-travel)
- **ExplosionParticles** — 8 radial scatter dots on explosion (cr-particle)
- **Confetti** — 20 staggered particles for win celebration (cr-celebrate)

### Screens (`src/screens/`)

Stack navigation via `@react-navigation/native-stack`:

```
Home ──► Setup ──► Game ──► Win
                     │        │
                     │  ┌─────┘
                     │  ▼
                     Setup (Play Again)
                     Home  (Home button)
```

- **HomeScreen** — title + START GAME button
- **GameSetupScreen** — player count (2-4) + grid size selector + START button
- **GameScreen** — HUD + turn indicator + Grid + explosion sequencer overlay (TravelerOrbs + ExplosionParticles) + pause menu
- **WinScreen** — winner announcement + confetti + PLAY AGAIN / HOME buttons

## Data Flow

```
User taps cell
       │
       ▼
gameStore.playCell(col, row)
       │
       ├── engine.playMove(board, col, row, currentPlayer, ...)
       │       └── Returns MoveResult { board, steps[] }
       │
       ├── If no explosions:
       │       ├── Apply final board immediately
       │       ├── Check winner, advance turn
       │       └── Done
       │
       └── If explosions:
               ├── Set pre-explosion board (orb placed, no chain)
               ├── Store steps + pending state
               └── Set animatingExplosion = true
                       │
                       ▼
               GameScreen explosion sequencer:
                 for each step:
                   ├── Render TravelerOrbs + ExplosionParticles
                   ├── Trigger Cell flash (cr-explode-flash)
                   ├── await 220ms (travel)
                   ├── applyExplosionStep(i) → board = step.boardAfter
                   └── await 150ms (chain delay)
                 finishExplosionSequence()
                   ├── Apply pending winner/elimination/turn
                   └── Set animatingExplosion = false
```

## Current Implementation Status

| Module | Status | Coverage |
|---|---|---|
| Types | Done | N/A (no logic) |
| Navigation Types | Done | N/A (no logic) |
| Engine | Done | 100% |
| Constants | Done | 100% |
| Colors | Done | 100% |
| Store | Done | 100% |
| Components | Done | N/A (UI only) |
| Screens | Done | N/A (UI only) |
| Animations | Done | N/A (Reanimated) |
| Haptics/Sound | Phase 3b | — |
