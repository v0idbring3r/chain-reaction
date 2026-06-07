import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { useGameStore } from '../store/gameStore';

let playerCache: Record<string, AudioPlayer> = {};
let loaded = false;

const SOUNDS = {
  tap: require('../../assets/sounds/tap.wav'),
  explode: require('../../assets/sounds/explode.wav'),
  win: require('../../assets/sounds/win.wav'),
} as const;

type SoundName = keyof typeof SOUNDS;

export async function loadSounds(): Promise<void> {
  if (loaded) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
    });
    for (const [name, source] of Object.entries(SOUNDS)) {
      playerCache[name] = createAudioPlayer(source);
    }
    loaded = true;
  } catch (e) {
    console.warn('Failed to load sounds:', e);
  }
}

export function resetSoundsForTest(): void {
  playerCache = {};
  loaded = false;
}

async function play(name: SoundName): Promise<void> {
  if (!useGameStore.getState().soundEnabled) return;
  const player = playerCache[name];
  if (!player) return;
  await player.seekTo(0);
  player.play();
}

export function soundTap(): void {
  play('tap');
}

export function soundExplode(): void {
  play('explode');
}

export function soundWin(): void {
  play('win');
}
