# Chain Reaction — Claude Code Project Brief

## What This Is

A cross-platform Chain Reaction strategy game for iOS and Android, built with Expo + React Native + TypeScript. The design was prototyped in HTML/CSS/JS (neon arcade aesthetic, fully playable), and the goal is to faithfully port it to a polished mobile app with matching animations.

## Current Status

Phases 1–3 complete. The game is playable with full animations, haptics, and sound.

- Phase 1: Game engine (pure TypeScript, 100% test coverage)
- Phase 2: React Native UI with local multiplayer
- Phase 3: All 7 Reanimated animations + settings screen + haptics + sound

**Next: Phase 4 (Firebase multiplayer) or Phase 5 (AI opponents) — both deferred.**

See `docs/PHASES.md` for the full phased plan.

## Pending Polish

- **Improve sound effects** — Current sounds are ffmpeg-generated sine wave placeholders. Replace with polished game audio from a free SFX library or synth tool. No code changes needed — just drop new WAV files into `app/assets/sounds/`.
- **Migrate expo-av to expo-audio** — `expo-av` is deprecated and will be removed in SDK 54. Replace with `expo-audio` package in `src/utils/sounds.ts`.
- **Phase 3b polish** — Custom fonts (Orbitron, Rajdhani, JetBrains Mono) for the neon arcade aesthetic.

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Expo 54 (managed workflow) |
| Language | TypeScript (strict) |
| Animations | React Native Reanimated 4 |
| State | Zustand |
| Haptics | expo-haptics |
| Audio | expo-av |
| Future multiplayer | Firebase (Phase 4, deferred) |

## Project Structure

```
chain-reaction/
  app/                    # Expo project
    assets/sounds/        # WAV sound effects (tap, explode, win)
    src/
      types/              # game.types.ts, navigation.types.ts
      engine/             # GameEngine.ts (pure logic, no React)
      components/         # Grid, Cell, Orb, HapticPressable, HapticSwitch, etc.
      screens/            # Home, GameSetup, Game, Win, Settings
      store/              # gameStore.ts (Zustand)
      utils/              # constants.ts, colors.ts, haptics.ts, sounds.ts
  docs/                   # Design specs
  prototype/              # Original HTML/CSS/JS prototype
  CLAUDE.md               # This file
  ARCHITECTURE.md         # System design + ASCII diagrams
  COMMAND_LOG.md           # Shell command audit trail
```

## Code Quality Standards

- **Test coverage**: Target 100% unit test coverage. 95% is the absolute floor — anything below is a blocker.
- **SOLID principles**: Single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion. Every module should have one reason to change.
- **Readability first**: Code should read like prose. Clear naming, small functions, no clever tricks. If it needs a comment to explain what it does, rename or restructure instead.
- **No bloat**: Do not add unused code, speculative abstractions, or dead paths. Every line should be reachable and tested.
- **No `any` types**: Strict TypeScript throughout. No escape hatches.
- **Remove unused code**: If something is no longer called, delete it. Don't leave commented-out code or TODO placeholders.

## Key Design Decisions

- **Expo over vanilla RN**: Reanimated 3 works out of the box, no native module linking needed. Firebase multiplayer is Phase 4 — can use JS SDK or eject when needed.
- **Game engine is framework-agnostic pure TypeScript**: No React imports in `src/engine/`. All logic tested independently.
- **Immutable state**: Engine uses spread operators, no mutations. Returns new board snapshots + animation step sequences.
- **Animation fidelity is a success criterion**: The HTML prototype has 7 named animations that must be replicated exactly in Reanimated. See `docs/ANIMATIONS.md`.

## Important Files

- `docs/ANIMATIONS.md` — CSS → Reanimated mapping for all 7 animations
- `docs/GAME_ENGINE.md` — full game engine logic ported from the HTML prototype
- `docs/DESIGN_SYSTEM.md` — colors, typography, visual style from the design
- `docs/PHASES.md` — phased implementation plan
- `COMMAND_LOG.md` — log of all shell commands run during development
- `ARCHITECTURE.md` — component diagram, responsibilities, data flow (keep up to date)

## Running Locally

```bash
cd app
npx expo start
# Scan QR with Expo Go app, or press i/a for simulator
```

## Command Log

**All shell commands run during development must be appended to `COMMAND_LOG.md`** at the project root. Log each command with a short description, grouped by date. This provides a reproducible audit trail.

## Package Registry

The `app/.npmrc` pins `registry=https://registry.npmjs.org/`. Do NOT use internal/corporate registries — this project must install dependencies from public npm so it runs out-of-the-box on any machine.

## Architecture Documentation

**`ARCHITECTURE.md` must be kept up to date** whenever modules, components, or data flows are added or changed. It contains ASCII diagrams showing component responsibilities and interactions. Update the "Current Implementation Status" table and any affected diagrams when completing a phase or adding new modules.

## Git Commits

Do NOT add `Co-Authored-By` lines to commit messages.
