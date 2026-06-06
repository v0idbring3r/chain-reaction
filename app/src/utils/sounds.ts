import { Audio } from 'expo-av';
import { useGameStore } from '../store/gameStore';

let soundCache: Record<string, Audio.Sound> = {};
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
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    for (const [name, source] of Object.entries(SOUNDS)) {
      const { sound } = await Audio.Sound.createAsync(source);
      soundCache[name] = sound;
    }
    loaded = true;
  } catch (e) {
    console.warn('Failed to load sounds:', e);
  }
}

export function resetSoundsForTest(): void {
  soundCache = {};
  loaded = false;
}

async function play(name: SoundName): Promise<void> {
  if (!useGameStore.getState().soundEnabled) return;
  const sound = soundCache[name];
  if (!sound) return;
  await sound.setPositionAsync(0);
  await sound.playAsync();
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
