# Chain Reaction

A cross-platform Chain Reaction strategy game for iOS and Android, built with Expo + React Native + TypeScript.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo` — no global install needed)
- iOS Simulator (Xcode) or Android Emulator (Android Studio), or the **Expo Go** app on a physical device

## Setup

```bash
npm install
```

## Running the App

```bash
# Start the Expo dev server
npx expo start

# Launch directly on a platform
npx expo start --ios        # iOS Simulator
npx expo start --android    # Android Emulator
npx expo start --web        # Web browser
```

Scan the QR code with the Expo Go app (iOS/Android) to run on a physical device.

## Testing

```bash
# Run all tests
npx jest

# Run tests in watch mode
npx jest --watch

# Run tests with coverage
npx jest --coverage
```

## Type Checking

```bash
npx tsc --noEmit
```

## Project Structure

```
app/
  src/
    types/         # TypeScript type definitions
    engine/        # Pure game engine logic (no React)
    components/    # React Native UI components
    hooks/         # Custom React hooks
    screens/       # App screens
    store/         # Zustand state management
    utils/         # Constants, colors, helpers
  assets/          # Images, fonts, sounds
  App.tsx          # App entry point
```

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Expo (managed workflow) |
| Language | TypeScript (strict) |
| Animations | React Native Reanimated 3 |
| State | Zustand |
| Haptics | expo-haptics |
| Audio | expo-av |
