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
│                                       │                     │
│                                  SettingsScreen             │
└──────────────────────┬──────────────────────────────────────┘
                       │ uses
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Components                               │
│  Grid  ──►  Cell  ──►  AtomCluster  ──►  Orb               │
│  TravelerOrb                                                │
│  ExplosionParticles                                         │
│  Confetti                                                   │
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
│  haptics.ts (haptic feedback effects)                       │
│  sounds.ts (sound effect playback)                          │
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
    └── resolveChainReactions(board)
            │
            └── Loop:
                ├── findExplodingCells(board)
                │       └── Scan all cells where count >= criticalMass
                │
                ├── applyExplosions(board, exploding)
                │       ├── Subtract criticalMass from each exploding cell
                │       └── Add 1 orb to each neighbor, set owner
                │
                └── Record ExplosionStep (snapshot)
```

Key design decisions:
- **Immutable interface**: `playMove` clones the board before mutating. Callers never see mutation.
- **BFS-style waves**: All cells at critical mass explode simultaneously per wave, not one at a time.
- **Full chain resolution**: Chains always run to completion regardless of win state. Win detection is the store's responsibility.
- **Runaway guard**: Hard limit of 400 iterations prevents infinite loops.

### Utils (`src/utils/`)

Static configuration and side-effect utilities.

- **`constants.ts`** — Grid size presets (`4×6`, `6×9`, `8×12`), player count bounds, runaway guard limit
- **`colors.ts`** — Three color palettes (neon/arcade/toxic), player names, theme colors
- **`haptics.ts`** — Haptic feedback functions (`hapticTap`, `hapticExplode`, `hapticWin`). Each checks the store's `hapticsEnabled` flag before firing.
- **`sounds.ts`** — Sound effect functions (`soundTap`, `soundExplode`, `soundWin`). Pre-loads WAV assets on app start via `loadSounds()`. Each checks the store's `soundEnabled` flag before playing.

### Store (`src/store/gameStore.ts`)

Zustand store wrapping the engine. Manages:
- Game phase (`home | setup | playing | paused | won`)
- Current board state and turn tracking
- Player elimination via `ownersAlive` check after each move
- Win detection (all players played + single owner remaining)
- Game settings (player count, grid size, palette, delayWinScreen, hapticsEnabled, soundEnabled)
- Explosion animation state (`animatingExplosion`, `lastMoveSteps`, pending board/winner)

Settings (`delayWinScreen`, `hapticsEnabled`, `soundEnabled`) persist across `goHome()` and `resetGame()` — they are not reset with game state.

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

React Native UI components with Reanimated 3 animations.

**Colocated effects principle**: Each component owns its own animation + haptic + sound triggers. For example, `HapticPressable` fires `hapticTap` + `soundTap` on every press, `Cell` fires `hapticExplode` + `soundExplode` when its flash triggers, and `Confetti` fires `hapticWin` + `soundWin` on mount. This ensures effects never drift apart.

- **Grid** — reads board from store, computes responsive cell size using full screen dimensions (width minus padding, height minus 140px HUD reserve), passes `criticalSoon` and `isExploding` flags to Cells
- **Cell** — HapticPressable with wobble animation (cr-wobble) when near critical mass, explosion flash overlay + haptic + sound (cr-explode-flash)
- **AtomCluster** — positions 1-3 Orbs using absolute layout within a cell
- **Orb** — Animated.View with pop on mount (cr-pop) and idle float (cr-atom-orbit)
- **PlayerTab** — HUD element showing player dot, name (with "(E)" if eliminated), orb count
- **HapticPressable** — drop-in Pressable replacement that fires hapticTap + soundTap on every press
- **HapticSwitch** — drop-in Switch replacement that fires hapticTap + soundTap on value change
- **TravelerOrb** — absolutely positioned orb that flies between cells during explosions (cr-travel)
- **ExplosionParticles** — 8 radial scatter dots on explosion (cr-particle)
- **Confetti** — 20 staggered particles + haptic + sound for win celebration (cr-celebrate)

### Screens (`src/screens/`)

Stack navigation via `@react-navigation/native-stack`:

```
Home ──► Setup ──► Game ──► Win
  │                  │        │
  │                  │  ┌─────┘
  │                  │  ▼
  │                  Setup (Play Again)
  │                  Home  (Home button)
  │                  │
  ▼                  ▼
Settings ◄──── Pause Menu
```

- **HomeScreen** — title + START GAME + SETTINGS buttons
- **GameSetupScreen** — player count (2-4) + grid size selector + START button
- **GameScreen** — HUD + turn indicator + Grid + explosion sequencer overlay (TravelerOrbs + ExplosionParticles) + pause menu (RESUME / SETTINGS / QUIT)
- **WinScreen** — winner announcement + confetti + PLAY AGAIN / HOME buttons
- **SettingsScreen** — toggles for delay win screen, haptics, sound. Accessible from Home and pause menu

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
                   ├── await 350ms (travel)
                   ├── applyExplosionStep(i) → board = step.boardAfter
                   └── await 250ms (chain delay)
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
| Haptics | Done | 100% |
| Store | Done | 100% |
| Components | Done | N/A (UI only) |
| Screens | Done | N/A (UI only) |
| Animations | Done | N/A (Reanimated) |
| Settings | Done | N/A (UI only) |
| Sound | Done | 100% |
