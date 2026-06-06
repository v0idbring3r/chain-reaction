import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/gameStore';

function isEnabled(): boolean {
  return useGameStore.getState().hapticsEnabled;
}

export function hapticTap(): void {
  if (!isEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticExplode(): void {
  if (!isEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function hapticWin(): void {
  if (!isEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
