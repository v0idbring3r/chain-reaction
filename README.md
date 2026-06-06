# Chain Reaction

A cross-platform Chain Reaction strategy game for iOS and Android, built with Expo + React Native + TypeScript. Neon arcade aesthetic with animated orbs, chain explosions, and local multiplayer for 2-4 players.

## Screenshots

_Coming soon_

## How to Play

1. Players take turns placing orbs on the grid
2. Each cell has a **critical mass** (corners: 2, edges: 3, interior: 4)
3. When a cell reaches critical mass, it **explodes** — sending orbs to all neighbors and capturing them
4. Explosions can trigger **chain reactions** across the board
5. Last player standing wins

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Expo Go](https://expo.dev/go) app on your phone (optional, for device testing)

### Install & Run

```bash
cd app
npm install
npx expo start
```

Then:
- Press `w` to open in a web browser
- Press `i` for iOS Simulator (requires Xcode)
- Press `a` for Android Emulator (requires Android Studio)
- Scan the QR code with Expo Go on your phone

### Run Tests

```bash
cd app
npx jest --coverage
```

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Expo 56 (managed workflow) |
| Language | TypeScript (strict) |
| Animations | React Native Reanimated 3 |
| State | Zustand |
| Navigation | React Navigation (native stack) |

## Project Structure

```
app/src/
  engine/        Pure game logic (no React imports)
  store/         Zustand state management
  components/    UI components with Reanimated animations
  screens/       Home, Setup, Game, Win
  types/         TypeScript interfaces
  utils/         Constants, colors, theme
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed component diagrams and data flow.

## Game Features

- **Local multiplayer**: 2-4 players, pass-and-play
- **3 grid sizes**: 6x4, 9x6, 12x8
- **3 color palettes**: Neon, Arcade, Toxic
- **7 animations**: Orb pop, idle float, pre-critical wobble, explosion flash, orb travel, particle scatter, win confetti
- **Chain reaction sequencing**: Explosions play out wave by wave with visual effects

## Development

- `docs/` — Design specs (animations, game engine logic, design system, phases)
- `prototype/` — Original HTML/CSS/JS prototype
- `COMMAND_LOG.md` — All shell commands run during development

## License

MIT
