import { useGameStore } from '../../store/gameStore';
import { hapticTap, hapticExplode, hapticWin } from '../haptics';
import * as Haptics from 'expo-haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
  NotificationFeedbackType: { Success: 'Success' },
}));

beforeEach(() => {
  jest.clearAllMocks();
  useGameStore.getState().setHapticsEnabled(true);
});

describe('hapticTap', () => {
  it('fires light impact when enabled', () => {
    hapticTap();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Light');
  });

  it('does not fire when disabled', () => {
    useGameStore.getState().setHapticsEnabled(false);
    hapticTap();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

describe('hapticExplode', () => {
  it('fires medium impact when enabled', () => {
    hapticExplode();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Medium');
  });

  it('does not fire when disabled', () => {
    useGameStore.getState().setHapticsEnabled(false);
    hapticExplode();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

describe('hapticWin', () => {
  it('fires success notification when enabled', () => {
    hapticWin();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('Success');
  });

  it('does not fire when disabled', () => {
    useGameStore.getState().setHapticsEnabled(false);
    hapticWin();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});
