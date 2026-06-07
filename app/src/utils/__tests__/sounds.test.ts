import { useGameStore } from '../../store/gameStore';

const mockPlayAsync = jest.fn().mockResolvedValue(undefined);
const mockSetPositionAsync = jest.fn().mockResolvedValue(undefined);
const mockCreateAsync = jest.fn().mockResolvedValue({
  sound: {
    playAsync: mockPlayAsync,
    setPositionAsync: mockSetPositionAsync,
  },
});
const mockSetAudioModeAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: (...args: unknown[]) => mockSetAudioModeAsync(...args),
    Sound: {
      createAsync: (...args: unknown[]) => mockCreateAsync(...args),
    },
  },
}));

import { loadSounds, soundTap, soundExplode, soundWin, resetSoundsForTest } from '../sounds';

beforeEach(() => {
  jest.clearAllMocks();
  resetSoundsForTest();
  useGameStore.getState().setSoundEnabled(true);
});

describe('loadSounds', () => {
  it('loads all sound assets', async () => {
    await loadSounds();
    expect(mockSetAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    expect(mockCreateAsync).toHaveBeenCalledTimes(3);
  });

  it('only loads once', async () => {
    await loadSounds();
    mockCreateAsync.mockClear();
    await loadSounds();
    expect(mockCreateAsync).not.toHaveBeenCalled();
  });

  it('handles load failure gracefully', async () => {
    mockSetAudioModeAsync.mockRejectedValueOnce(new Error('audio fail'));
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    await loadSounds();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load sounds:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});

describe('soundTap', () => {
  it('plays when enabled', async () => {
    await loadSounds();
    soundTap();
    await new Promise(r => setTimeout(r, 0));
    expect(mockSetPositionAsync).toHaveBeenCalledWith(0);
    expect(mockPlayAsync).toHaveBeenCalled();
  });

  it('does not play when disabled', async () => {
    await loadSounds();
    useGameStore.getState().setSoundEnabled(false);
    soundTap();
    await new Promise(r => setTimeout(r, 0));
    expect(mockSetPositionAsync).not.toHaveBeenCalled();
  });
});

describe('soundExplode', () => {
  it('plays when enabled', async () => {
    await loadSounds();
    soundExplode();
    await new Promise(r => setTimeout(r, 0));
    expect(mockPlayAsync).toHaveBeenCalled();
  });

  it('does not play when disabled', async () => {
    await loadSounds();
    useGameStore.getState().setSoundEnabled(false);
    soundExplode();
    await new Promise(r => setTimeout(r, 0));
    expect(mockPlayAsync).not.toHaveBeenCalled();
  });
});

describe('soundWin', () => {
  it('plays when enabled', async () => {
    await loadSounds();
    soundWin();
    await new Promise(r => setTimeout(r, 0));
    expect(mockPlayAsync).toHaveBeenCalled();
  });

  it('does not play when disabled', async () => {
    await loadSounds();
    useGameStore.getState().setSoundEnabled(false);
    soundWin();
    await new Promise(r => setTimeout(r, 0));
    expect(mockPlayAsync).not.toHaveBeenCalled();
  });
});

describe('play before load', () => {
  it('does nothing if sounds not loaded', () => {
    soundTap();
    expect(mockPlayAsync).not.toHaveBeenCalled();
    expect(mockSetPositionAsync).not.toHaveBeenCalled();
  });
});
