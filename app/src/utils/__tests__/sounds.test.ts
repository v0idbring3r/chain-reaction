import { useGameStore } from '../../store/gameStore';

const mockPlay = jest.fn();
const mockSeekTo = jest.fn().mockResolvedValue(undefined);
const mockCreateAudioPlayer = jest.fn().mockReturnValue({
  play: mockPlay,
  seekTo: mockSeekTo,
});
const mockSetAudioModeAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-audio', () => ({
  createAudioPlayer: (...args: unknown[]) => mockCreateAudioPlayer(...args),
  setAudioModeAsync: (...args: unknown[]) => mockSetAudioModeAsync(...args),
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
    expect(mockSetAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: true });
    expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(3);
  });

  it('only loads once', async () => {
    await loadSounds();
    mockCreateAudioPlayer.mockClear();
    await loadSounds();
    expect(mockCreateAudioPlayer).not.toHaveBeenCalled();
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
    expect(mockSeekTo).toHaveBeenCalledWith(0);
    expect(mockPlay).toHaveBeenCalled();
  });

  it('does not play when disabled', async () => {
    await loadSounds();
    useGameStore.getState().setSoundEnabled(false);
    soundTap();
    await new Promise(r => setTimeout(r, 0));
    expect(mockSeekTo).not.toHaveBeenCalled();
  });
});

describe('soundExplode', () => {
  it('plays when enabled', async () => {
    await loadSounds();
    mockPlay.mockClear();
    soundExplode();
    await new Promise(r => setTimeout(r, 0));
    expect(mockPlay).toHaveBeenCalled();
  });

  it('does not play when disabled', async () => {
    await loadSounds();
    mockPlay.mockClear();
    mockSeekTo.mockClear();
    useGameStore.getState().setSoundEnabled(false);
    soundExplode();
    await new Promise(r => setTimeout(r, 0));
    expect(mockPlay).not.toHaveBeenCalled();
  });
});

describe('soundWin', () => {
  it('plays when enabled', async () => {
    await loadSounds();
    mockPlay.mockClear();
    soundWin();
    await new Promise(r => setTimeout(r, 0));
    expect(mockPlay).toHaveBeenCalled();
  });

  it('does not play when disabled', async () => {
    await loadSounds();
    mockPlay.mockClear();
    mockSeekTo.mockClear();
    useGameStore.getState().setSoundEnabled(false);
    soundWin();
    await new Promise(r => setTimeout(r, 0));
    expect(mockPlay).not.toHaveBeenCalled();
  });
});

describe('play before load', () => {
  it('does nothing if sounds not loaded', () => {
    soundTap();
    expect(mockPlay).not.toHaveBeenCalled();
    expect(mockSeekTo).not.toHaveBeenCalled();
  });
});
