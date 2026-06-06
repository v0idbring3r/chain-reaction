import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';
import { useGameStore } from '../store/gameStore';
import { CR_GRID_OPTIONS, MIN_PLAYERS, MAX_PLAYERS } from '../utils/constants';
import { HapticPressable } from '../components/HapticPressable';
import { THEME } from '../utils/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>;

const PLAYER_COUNTS = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, i) => i + MIN_PLAYERS,
);

export function GameSetupScreen({ navigation }: Props) {
  const playerCount = useGameStore(s => s.playerCount);
  const gridOption = useGameStore(s => s.gridOption);
  const setPlayerCount = useGameStore(s => s.setPlayerCount);
  const setGridOption = useGameStore(s => s.setGridOption);
  const startGame = useGameStore(s => s.startGame);

  const handleStart = () => {
    startGame();
    navigation.navigate('Game');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>PLAYERS</Text>
      <View style={styles.optionRow}>
        {PLAYER_COUNTS.map(count => (
          <HapticPressable
            key={count}
            style={[styles.option, count === playerCount && styles.optionSelected]}
            onPress={() => setPlayerCount(count)}
          >
            <Text style={[styles.optionText, count === playerCount && styles.optionTextSelected]}>
              {count}
            </Text>
          </HapticPressable>
        ))}
      </View>

      <Text style={styles.heading}>GRID SIZE</Text>
      <View style={styles.optionRow}>
        {CR_GRID_OPTIONS.map(option => (
          <HapticPressable
            key={option.key}
            style={[styles.option, option.key === gridOption.key && styles.optionSelected]}
            onPress={() => setGridOption(option)}
          >
            <Text style={[styles.optionText, option.key === gridOption.key && styles.optionTextSelected]}>
              {option.label}
            </Text>
          </HapticPressable>
        ))}
      </View>

      <HapticPressable style={styles.startButton} onPress={handleStart}>
        <Text style={styles.startButtonText}>START</Text>
      </HapticPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  heading: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 16,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    borderWidth: 1,
    borderColor: THEME.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  optionSelected: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  optionText: {
    color: THEME.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#00E5FF',
  },
  startButton: {
    marginTop: 32,
    borderWidth: 2,
    borderColor: '#00E5FF',
    borderRadius: 12,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  startButtonText: {
    color: '#00E5FF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
