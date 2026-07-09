# Development Plan — Chain Reaction

**Date:** 2026-07-07
**Source:** Coding items from `PRODUCT_REVIEW.md` (§2 code quality, §3 P0/P1 enhancements). Written to be executed by an agent with no prior context on this session.
**Out of scope (non-coding):** store metadata, screenshots/preview video, privacy policy authoring, app rename decision, Play tester recruitment, sound asset *production* (see C3), icon/splash artwork *design* (see C1).

---

## How to Use This Plan

Read `CLAUDE.md` first — its rules are binding. The ones most often violated: 95% coverage is a hard floor (100% target) on all logic modules; strict TypeScript with no `any` and no type-assertion escape hatches; delete dead code; append every shell command to `COMMAND_LOG.md`; update `ARCHITECTURE.md` when modules/data flows change; never commit without explicit user approval; no `Co-Authored-By` lines.

Work items are IDs `A1…E5`, grouped into workstreams A–E. **Execute in the order given within each workstream.** Recommended overall order:

1. **B1, B2** (quality gates) — do first so every later item is linted/gated.
2. **A1, A2, A3** (engine correctness) — A1 changes the engine API surface that D1 builds on.
3. **C1, C2, C4** (release config, fonts, crash reporting) — independent, can interleave.
4. **D1, D2** (AI, tutorial) — the launch-critical product work.
5. **B3, B4** (UI/e2e tests) — after D1/D2 so tests cover final behavior.
6. **E1–E5** (post-launch fast-follows) — only after A–D are done.

Each item below states: context, files, approach, acceptance criteria. "AC" items are testable; do not mark an item done with any AC unmet.

---

## Workstream A — Engine Correctness

### A1 — Early-exit chain resolution on win (bug fix)

**Context.** `docs/GAME_ENGINE.md` specifies that the explosion loop breaks once all players have moved and ≤1 owner remains. The implementation dropped this: `resolveChainReactions` (`app/src/engine/GameEngine.ts`) loops until no cells are critical or the 400-iteration `RUNAWAY_GUARD_LIMIT` trips. On a board flooded by a winning move, cells stay critical forever, producing up to 400 `ExplosionStep`s. The GameScreen sequencer (`app/src/screens/GameScreen.tsx`) partially mitigates: it breaks early **only when `delayWinScreen` is false** (line ~149). With the default `delayWinScreen: true`, the player watches up to 400 steps × ~600ms ≈ 4 minutes of decided endgame. Related dead code: `playMove` computes `updatedHasPlayed` and never uses it; its `playerCount` and `hasPlayed` parameters are otherwise unused — they exist precisely for this fix.

**Files.** `app/src/engine/GameEngine.ts`, `app/src/engine/__tests__/GameEngine.test.ts`, `docs/GAME_ENGINE.md`, `ARCHITECTURE.md`.

**Approach.** Thread `playerCount` and the post-move `hasPlayed` set (the currently-dead `updatedHasPlayed`) into `resolveChainReactions`. After applying each wave and pushing its step, break when `updatedHasPlayed.size >= playerCount && ownersAlive(board).size <= 1`. Keep the runaway guard as a backstop. The store already derives winner from `result.board` after resolution, so no store change is needed — verify `playCell`'s winner logic still holds when the chain ends early (it does: the surviving owner owns every occupied cell). Do NOT remove the sequencer's existing `delayWinScreen === false` break; with the engine fix, `delayWinScreen: true` now means "watch the (short) remaining chain," which is the intended semantics. Reconcile the two docs: `GAME_ENGINE.md` is now accurate; fix `ARCHITECTURE.md`'s "chains always run to completion regardless of win state" claim.

**AC.**
- New test: a winning flood-move on a small board yields `steps.length` bounded (assert « 400, e.g. < 20) and a final board with one owner.
- New test: chain does NOT early-exit when only one owner remains but not all players have played (first-round rule preserved).
- Existing 100% engine coverage maintained; no unused parameters remain in `playMove`.
- Both docs updated and mutually consistent.

### A2 — Remove type-assertion escape hatches

**Context.** `GameEngine.ts` and `gameStore.ts` repeatedly cast readonly types to anonymous mutable shapes (`as { count: number; owner: number | null }`) to mutate cloned boards. This defeats the readonly modeling in `game.types.ts` and violates the no-escape-hatches rule.

**Files.** `app/src/types/game.types.ts`, `app/src/engine/GameEngine.ts`, `app/src/store/gameStore.ts`.

**Approach.** Add internal mutable counterparts — `MutableCell`, `MutableBoard` (plain non-readonly mirrors of `Cell`/`Board`). Change `cloneBoard` to return `MutableBoard` (a `MutableBoard` is assignable where `Board` is expected, not vice versa — this is the correct direction). Engine internals (`applyExplosions`, `resolveChainReactions`, `playMove`) operate on `MutableBoard`; public return types stay `Board`/`MoveResult`. In `gameStore.playCell`, the pre-explosion board construction uses the same typed path (or better: add an engine helper `placeOrb(board, c, r, playerId): Board` so the store stops hand-mutating cells — engine logic belongs in the engine).

**AC.** Zero `as {`-style structural casts in `src/engine/` and `src/store/`; `npx tsc --noEmit` clean; all tests pass; coverage floor held.

### A3 — Tap-to-skip chain animation

**Context.** Even with A1, large chains can run many seconds. Players who understand the outcome should be able to skip. UX-critical for repeated play.

**Files.** `app/src/screens/GameScreen.tsx`; test in B3.

**Approach.** During `animatingExplosion`, render a full-screen transparent `Pressable` above the board (below pause/restart overlays). On press, set a `skipRef` (ref, not state — the sequencer loop is async). In `runSequence`, check `skipRef.current` at the top of each iteration; when set, break immediately, clear travelers/particles/exploding sets, skip the `WIN_REVEAL_DELAY`, and call `finishExplosionSequence()` (which already applies the pending final board and turn state — no store change needed). Reset `skipRef` when the sequence ends. Show a subtle "tap to skip" hint after the second step (avoid noise on short chains).

**AC.** Tapping mid-chain lands the exact same final board/winner/turn as watching it out (assert store state equality in test); no stuck `sequencingRef`; hint does not appear for 1–2 step chains.

---

## Workstream B — Quality Gates & Tests

### B1 — ESLint + Prettier

**Files.** New `app/eslint.config.js` (flat config), `app/.prettierrc`, `package.json` scripts.

**Approach.** `typescript-eslint` strict + stylistic presets, `eslint-plugin-react-hooks`, `eslint-plugin-react-native` if compatible. Rules to enforce project law: `@typescript-eslint/no-explicit-any: error`, `@typescript-eslint/no-unused-vars: error`, `@typescript-eslint/consistent-type-assertions` with `assertionStyle: 'never'` for object-literal assertions (guards against A2 regressing). Add `"lint": "eslint src"`, `"format": "prettier --check src"`. Fix all findings (expect the A2 casts to flag if B1 lands first — acceptable, fix in A2).

**AC.** `npm run lint` and `npm run format` exit 0; no rule disabled inline without a comment explaining why.

### B2 — Coverage threshold + CI

**Files.** `app/jest.config.js` (or the `jest` key in `package.json`), new `.github/workflows/ci.yml`.

**Approach.** Add `coverageThreshold: { global: { branches: 95, functions: 95, lines: 95, statements: 95 } }` scoped via `collectCoverageFrom` to logic modules (`src/engine`, `src/store`, `src/utils`) — component coverage is B3's job and should get its own lower initial threshold rather than dragging the global one down. CI workflow: on push/PR → install (`npm ci` in `app/`), `npx tsc --noEmit`, `npm run lint`, `npx jest --coverage --watchman=false`.

**AC.** CI green on current main; deliberately deleting one test locally fails the coverage gate.

### B3 — Component & screen tests (React Native Testing Library)

**Context.** Logic modules are at 100%; no component or screen has any test. The explosion sequencer is the most timing-sensitive code in the app and is untested.

**Files.** New `app/src/screens/__tests__/GameScreen.test.tsx`, `app/src/components/__tests__/…`; possibly `src/__mocks__` additions for Reanimated (`react-native-reanimated/mock`), navigation, and timers.

**Approach.** Install `@testing-library/react-native`. Priority order: (1) sequencer — with fake timers, drive a 2-wave `lastMoveSteps` fixture through `runSequence`, assert `applyExplosionStep` ordering, cleanup of travelers/particles, `finishExplosionSequence` called once; include the A3 skip path and the `delayWinScreen=false` early break; (2) `Grid`/`Cell` — taps during `animatingExplosion` are rejected (store `playCell` returns false path); (3) settings persistence — toggling settings survives a simulated store rehydrate; (4) `HapticPressable`/`HapticSwitch` fire haptic+sound exactly once per interaction.

**AC.** Sequencer test covers: normal completion, skip, early-break, and win-reveal delay. No `act()` warnings. Component test suite runs headless in CI.

### B4 — Maestro e2e smoke flow

**Files.** New `app/.maestro/smoke.yml`; CI job optional (Maestro cloud or local runner — document, don't block CI on it).

**Approach.** One flow: launch → START GAME → select 2 players + small grid → START → play scripted moves to a win (2-player on 6×4 can be forced quickly; add `testID`s to cells as `cell-{c}-{r}` to make taps addressable) → assert Win screen text → PLAY AGAIN → assert Setup screen.

**AC.** Flow passes on iOS simulator and Android emulator against a release-mode build.

---

## Workstream C — Release Configuration & Instrumentation

### C1 — `app.json` release readiness + `eas.json`

**Context.** Current config cannot produce a store build: no `ios.bundleIdentifier`, no `android.package`, `userInterfaceStyle: "light"` on a `#070716` game (white flash on launch/system chrome), default Expo icons, no splash config, no `eas.json`. `ios.supportsTablet: true` is claimed but layouts are phone-sized.

**Files.** `app/app.json`, new `app/eas.json`.

**Approach.** Set `ios.bundleIdentifier` / `android.package` (ask the user for the reverse-DNS identifier — do not invent one; it is permanent). Set `userInterfaceStyle: "dark"`, add `expo-splash-screen` config with `backgroundColor: "#070716"`. Set `ios.supportsTablet: false` for v1 (revisit in E-tier). Set `android.versionCode`/`ios.buildNumber` strategy: use `eas.json` `autoIncrement`. `eas.json`: `development` (dev client, internal), `preview` (internal distribution APK/simulator build), `production` (store, autoIncrement). Wire `eas submit` config skeletons. Replace placeholder icon/splash assets when artwork is provided — the *config* is this task; the *artwork* is not.

**AC.** `eas build --profile preview` succeeds for both platforms (or `--local` equivalents); app launches with no white flash; `npx expo-doctor` clean.

### C2 — Custom fonts

**Context.** `docs/DESIGN_SYSTEM.md` specifies Orbitron (headings/scores), Rajdhani (body), JetBrains Mono (status labels). None are loaded; the neon aesthetic reads unfinished without them. Every screen currently uses system fonts with `fontWeight` styling.

**Files.** `app/App.tsx` (or a fonts hook), new `app/src/utils/typography.ts`, all five screens + `PlayerTab`.

**Approach.** Use `@expo-google-fonts/orbitron`, `@expo-google-fonts/rajdhani`, `@expo-google-fonts/jetbrains-mono` + `expo-font`/`useFonts`; hold splash until loaded. Create `typography.ts` exporting named text styles (`display`, `heading`, `body`, `label`, `mono`) per the design system's weight table, and refactor screens to use them instead of ad-hoc `fontWeight`. Note: with custom fonts, `fontWeight` styling is ignored on Android — each weight is a separate font family string; the typography util must encode this.

**AC.** All screens render the three families per the design-system table on both platforms; no flash of unstyled text; font files bundled (no runtime network fetch).

### C3 — Sound asset swap (verification only)

**Context.** `CLAUDE.md` states replacement WAVs need no code change — just drop into `app/assets/sounds/`. Producing the sounds is out of scope; the coding task is verification.

**Approach.** When assets arrive: confirm `sounds.ts` loader handles the new files (same filenames or update the require map), check clip length vs. animation timing (tap < 150ms, explode < 400ms), confirm volume normalization, run the sound tests.

**AC.** `loadSounds()` succeeds; no audible clipping/latency regression; tests pass.

### C4 — Crash reporting + minimal analytics

**Context.** Launching blind means store reviews are the only crash signal. Keep the privacy label honest: no accounts, no ad tracking.

**Files.** `app/App.tsx`, new `app/src/utils/telemetry.ts`, `app.json` plugins.

**Approach.** `@sentry/react-native` via its Expo config plugin (works in managed workflow with EAS builds). Wrap app root; upload source maps in the EAS build profile. Analytics: a privacy-light tool (e.g. Aptabase or PostHog with anonymous mode) behind a thin `telemetry.ts` interface (`trackEvent(name, props)`) so the vendor is swappable — do not scatter vendor calls through screens. Events: game_start (players/grid), game_end (turns, duration, winner index), tutorial_completed, setting_changed. No device identifiers beyond the vendor's anonymous default.

**AC.** A forced test crash appears in Sentry from a preview build; events visible in the analytics dashboard; `telemetry.ts` is the only file importing the vendor SDK; store privacy questionnaire answers documented in a comment block in `telemetry.ts`.

---

## Workstream D — P0 Product Features

### D1 — AI opponents (launch-critical)

**Context.** The game is pass-and-play only; every competitor ships solo play. `docs/PHASES.md` Phase 5 sketches the design: Easy = random valid move, Medium = heuristic, Hard = minimax/MCTS. Ship Easy + Medium for launch; Hard is post-launch.

**Files.** New `app/src/engine/AIPlayer.ts` + tests; `app/src/store/gameStore.ts`; `app/src/screens/GameSetupScreen.tsx`; `app/src/screens/GameScreen.tsx`; `app/src/types/game.types.ts`; `ARCHITECTURE.md`.

**Approach.**
- *Engine layer (pure, no React):* `selectMove(board, playerId, difficulty, rng): Position`. Take an injected `rng: () => number` for determinism in tests (default `Math.random`). Easy: uniform random over legal cells. Medium heuristic, in priority order: (1) any own cell at `criticalMass - 1` whose explosion captures enemy orbs; (2) avoid placing adjacent to an enemy cell at `criticalMass - 1` (it gifts a capture); (3) prefer corners, then edges (lower critical mass = cheaper to defend); (4) otherwise random legal. Keep it a scored evaluation over legal moves rather than nested ifs — Hard can later reuse the scorer as its leaf evaluation.
- *Store layer:* add `playerTypes: ReadonlyArray<'human' | 'ai-easy' | 'ai-medium'>` (length = playerCount, default all human) + setter; persist nothing (per-game choice). No AI logic in the store.
- *UI layer:* GameSetupScreen — per-seat toggle Human/AI (Easy/Medium) for seats 2–4; seat 1 stays human. GameScreen — a `useAITurn` hook: when `phase === 'playing' && !animatingExplosion && playerTypes[currentPlayer] !== 'human'`, wait ~600ms (feels deliberate), call `selectMove`, then `playCell`. Guard against double-fire with a ref keyed on `turnNumber`. Block human taps during an AI turn (Grid already routes through `playCell`; add a `playerTypes[currentPlayer] !== 'human'` rejection in `playCell` for taps — distinguish AI-invoked calls via an explicit action, e.g. `playAIMove`).
- Depends on A1 (engine signature stabilized) and A2 (typed mutation) landing first.

**AC.**
- `AIPlayer.ts` at 100% coverage with seeded-rng determinism; Medium beats Easy in ≥70% of ≥200 simulated 2-player games on the medium grid (write this as a (possibly skipped-in-CI, run-once) simulation test — it's the only honest check that the heuristic works).
- AI never selects an illegal cell (property-style test over random board states).
- Full app flow: human vs AI game completes; AI turns animate identically to human turns; pause during AI turn works.
- `ARCHITECTURE.md` updated (new module + data flow).

### D2 — First-game tutorial overlay

**Context.** Critical mass/capture rules are not self-evident. PHASES.md lists onboarding as nice-to-have; PRODUCT_REVIEW.md promotes it to launch-required.

**Files.** New `app/src/components/TutorialOverlay.tsx`; `gameStore.ts` (persisted `hasSeenTutorial` flag — add to `partialize`); `GameScreen.tsx`; optionally `HomeScreen.tsx` ("HOW TO PLAY" entry that re-opens it).

**Approach.** Three dismissible steps rendered as an overlay on the first game: (1) "Tap any empty cell or your own cells to add an orb"; (2) "A cell explodes at its critical mass — corners 2, edges 3, middle 4 — spreading orbs to neighbors and capturing them"; (3) "Capture every orb on the board to win." Static illustrations built from existing `Orb`/`AtomCluster` components (no new art). Auto-shows when `!hasSeenTutorial` on first entry to GameScreen; sets flag on completion or dismissal; re-openable from Home.

**AC.** Shows exactly once for a fresh install (persisted across restarts); never blocks input after dismissal; re-openable from Home; RNTL test for show-once logic.

---

## Workstream E — P1 Fast-Follows (post-launch order)

### E1 — Per-player orb shapes (colorblind accessibility)

Players are currently distinguishable by color only. The design system defines three orb shapes (`orb`, `hex`, `nucleus`) — a fourth is needed for 4-player games (suggest `ring`; confirm with user before inventing visual language). Add a persisted `distinguishByShape: boolean` setting; when on, seat N renders shape N everywhere (board, HUD `PlayerTab` dots, win screen). Files: `Orb.tsx` (shape prop + rendering variants), `AtomCluster.tsx`, `PlayerTab.tsx`, `SettingsScreen.tsx`, store partialize. AC: all four shapes distinguishable in grayscale screenshot; setting persists; default off.

### E2 — Expose palette + shape pickers in Settings

`CR_PALETTES` (neon/arcade/toxic) and `setPaletteKey` exist and are tested but have no UI, and `paletteKey` is not persisted. Add a palette selector (render swatch rows using actual palette colors) and the E1 shape toggle to `SettingsScreen.tsx`; add `paletteKey` to `partialize`. AC: palette survives restart; mid-game palette change reflects immediately (colors are read per-render from the store — verify).

### E3 — Undo last move (local play only)

Single-level undo. Store: before each successful `playCell`, snapshot `{ board, currentPlayer, hasPlayed, eliminatedPlayers, turnNumber }` into `lastSnapshot`; `undoLastMove()` restores it and clears itself. Disabled while `animatingExplosion`, when no snapshot exists, when `winner !== null`, and for moves made by AI (undo should rewind to before the *human's* previous move — i.e., snapshot only on human moves, restoring skips back over AI turns). UI: toolbar button on GameScreen next to restart. AC: undo after a chain reaction restores the exact pre-move state (deep-equality test); double-undo is a no-op; hidden in AI games mid-AI-turn.

### E4 — Lifetime stats

Persisted counters: games played/won, per player-count and grid size, plus longest chain (max `steps.length` seen). Increment in `playCell`/`finishExplosionSequence` where winner lands. New `StatsScreen` (or a section on Home), reset button with confirm. Add counters to `partialize`. AC: counters survive restart; reset works; no double-count when win arrives via the animated path vs. the immediate path (both code paths in `playCell` — test both).

### E5 — Native module abstraction (haptics/audio)

Per PHASES.md Phase 3b portability: put `haptics.ts` and `sounds.ts` behind provider interfaces (`HapticProvider`, `SoundProvider`) selected by an internal `useExpoModules` config constant (not a user setting). Expo implementations are the only ones shipped; the community-package implementations (`react-native-haptic-feedback`, `react-native-sound`) are added only if/when Phase 6 (eject) happens — do not add the dependencies now (that would be bloat). AC: swapping providers is a one-line change; existing haptics/sounds tests pass against the interface, not the Expo impl; 100% coverage held.

---

## Deliberately Not Planned

- **Phase 4 (online multiplayer)** — deferred past launch per PRODUCT_REVIEW.md §3; do not start.
- **Hard AI (minimax)** — post-launch; D1's scorer is the building block.
- **Phase 6 (eject)** — only on concrete native need.
- **Monetization code** — no decision made; ship v1 clean.
- **Tablet/landscape layouts, >4 local players** — P2.
