# Implementation Phases

## Phase 1 — Core Game Engine (Pure TypeScript) ✅

Build framework-agnostic logic. No React, no UI.

**Files to create:**
- `src/types/game.types.ts` — Cell, Board, Player, GameState, MoveResult, ExplosionStep
- `src/engine/GameEngine.ts` — makeBoard, criticalMass, neighbors, cloneBoard, playMove, ownersAlive, countOrbs
- `src/engine/ExplosionHandler.ts` — can be inline with GameEngine or separate
- `src/utils/constants.ts` — CR_GRID_OPTIONS, grid sizes
- `src/utils/colors.ts` — CR_PALETTES, CR_PLAYER_NAMES, THEME

**Acceptance criteria:**
- `playMove` returns correct board state after single moves and chain reactions
- Win condition detected correctly (all players having played, one owner left)
- First-turn rule enforced (no win on round 1)
- Player elimination works
- All logic covered by Jest unit tests

**Do NOT use `any` types. Strict TypeScript throughout.**

See `docs/GAME_ENGINE.md` for the full logic to port.

---

## Phase 2 — React Native UI (Local Multiplayer) ✅

Build the screens and components. Wire up to Phase 1 engine.

**Files to create:**
- `src/store/gameStore.ts` — Zustand store wrapping GameEngine
- `src/components/Cell.tsx` — TouchableOpacity, shows atom cluster
- `src/components/Orb.tsx` — single animated orb (pop animation on mount)
- `src/components/AtomCluster.tsx` — 1/2/3 orbs with wobble when criticalSoon
- `src/components/Grid.tsx` — renders board, handles taps
- `src/components/PlayerTab.tsx` — player color, name, orb count
- `src/screens/HomeScreen.tsx`
- `src/screens/GameSetupScreen.tsx` — player count (2–4) + grid size selector
- `src/screens/GameScreen.tsx` — HUD + board + pause
- `src/screens/WinScreen.tsx` — winner announcement + celebrate animation

**Do NOT add animations in this phase** — static display only. Animations come in Phase 3.

---

## Phase 3 — Animations & Polish ✅

Add all 7 animations from `docs/ANIMATIONS.md`:

1. `cr-pop` on orb placement
2. `cr-wobble` on pre-critical cells
3. `cr-atom-orbit` idle float
4. `cr-explode-flash` on cell explosion
5. `cr-travel` — orbs flying between cells during chain reaction
6. `cr-particle` — scatter particles on explosion
7. `cr-celebrate` — win screen confetti

Also:
- Haptics via `expo-haptics` (light on tap, medium on explosion, heavy on win)
- Sound via `expo-av` (placeholder sounds or silence toggle)
- Screen transitions
- Settings screen (grid size, sound, haptics)

---

## Phase 3b — App Store Readiness

**In progress.**

Pre-release polish and technical requirements for App Store submission.

**Polish:**
- ~~Migrate `expo-av` to `expo-audio`~~ ✅
- ~~Persist settings across app restarts via AsyncStorage~~ ✅
- Replace placeholder sound effects with polished game audio
- Custom fonts (Orbitron, Rajdhani, JetBrains Mono) for neon arcade aesthetic

**App Store requirements:**
- App icon (1024×1024) and splash screen
- EAS Build setup (`eas build --platform ios`) — requires Apple Developer account ($99/year)
- App Store metadata: screenshots, description, keywords, age rating
- Privacy policy URL (required even if no data is collected)

**Nice-to-have for v1:**
- Onboarding/tutorial for first-time players (critical mass, capturing rules)
- Landscape support (currently portrait-only)

**Portability:**
- Abstract haptics/audio behind a config flag (`useExpoModules`) to support both Expo packages (`expo-haptics`, `expo-audio`) and community RN packages (`react-native-haptic-feedback`, `react-native-sound`). Switching providers should be a one-line config change. Config is internal — not exposed in game settings.

---

## Phase 4 — Firebase Multiplayer (Future)

**Not started. Deferred.**

When ready:
- Option 1: Use Firebase JS SDK (works in Expo managed workflow, no ejection needed)
- Option 2: Eject to bare workflow and use `@react-native-firebase`

Database structure:
```
/games/{gameId}/state      — synced GameState
/games/{gameId}/players    — player info
/games/{gameId}/moves      — move log
/games/{gameId}/status     — waiting | active | finished
/lobbies/{lobbyId}/...     — matchmaking
```

See project instructions for full Firebase schema.

---

## Phase 5 — AI Opponents (Future)

- Easy: random valid moves
- Medium: heuristic (prefer corners/edges, avoid handing opponent critical cells)
- Hard: minimax 3–4 deep or MCTS

`src/engine/AIPlayer.ts` — `selectMove(gameState, difficulty): Promise<Position>`

---

## Phase 6 — Eject to Bare React Native (Future)

**Not started. Deferred.**

Remove Expo managed workflow dependency. One codebase, native iOS + Android projects in the repo, full control over builds.

**Prerequisites:**
- Complete the native module abstraction (Phase 3b Portability) first — ensures clean swap of Expo packages

**Steps:**
1. `npx expo prebuild` — generates `ios/` and `android/` directories
2. Replace Expo-specific packages (or keep them — they work in bare RN too):
   - `expo-haptics` → `react-native-haptic-feedback`
   - `expo-audio` → `react-native-sound`
   - `expo-status-bar` → React Native built-in `StatusBar`
3. Update Babel config: replace `babel-preset-expo` with `@babel/preset-env` + `react-native-reanimated/plugin`
4. Run `cd ios && pod install` for iOS native linking
5. Build iOS via Xcode or `xcodebuild`
6. Build Android via Android Studio or `./gradlew assembleRelease`

**What stays the same (no changes needed):**
- Game engine, types, store, all components, all screens
- `@react-navigation` (not Expo-specific)
- `react-native-reanimated` (works without Expo)
- Zustand + AsyncStorage
- All tests

**When to eject:**
- When you need a native module Expo doesn't support
- When you want to avoid Expo's build queue / account
- When you need full control over Xcode/Gradle configs (e.g., custom native code, specific SDK integrations)
