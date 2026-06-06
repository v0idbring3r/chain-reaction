import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';
import { useGameStore, getPlayerColor } from '../store/gameStore';
import { Confetti } from '../components/Confetti';
import { HapticPressable } from '../components/HapticPressable';
import { CR_PALETTES, CR_PLAYER_NAMES, THEME } from '../utils/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Win'>;

export function WinScreen({ navigation }: Props) {
  const [snapshot] = useState(() => {
    const { winner, paletteKey } = useGameStore.getState();
    return { winner, paletteKey };
  });

  const resetGame = useGameStore(s => s.resetGame);
  const goHome = useGameStore(s => s.goHome);

  const winner = snapshot.winner;
  const paletteKey = snapshot.paletteKey;
  const winnerColor = winner !== null ? getPlayerColor(paletteKey, winner) : '#FFFFFF';
  const winnerName = winner !== null ? CR_PLAYER_NAMES[winner] : 'UNKNOWN';
  const palette = CR_PALETTES[paletteKey];

  const handlePlayAgain = () => {
    resetGame();
    navigation.navigate('Setup');
  };

  const handleHome = () => {
    goHome();
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.confettiContainer}>
        <Confetti colors={palette} />
      </View>

      <Text style={[styles.winnerText, { color: winnerColor }]}>
        {winnerName}{'\n'}WINS!
      </Text>

      <View style={styles.buttonGroup}>
        <HapticPressable
          style={[styles.button, { borderColor: winnerColor }]}
          onPress={handlePlayAgain}
        >
          <Text style={[styles.buttonText, { color: winnerColor }]}>PLAY AGAIN</Text>
        </HapticPressable>

        <HapticPressable
          style={[styles.button, { borderColor: THEME.textSecondary }]}
          onPress={handleHome}
        >
          <Text style={[styles.buttonText, { color: THEME.textSecondary }]}>HOME</Text>
        </HapticPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  confettiContainer: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
  },
  winnerText: {
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 4,
    lineHeight: 56,
  },
  buttonGroup: {
    gap: 16,
  },
  button: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
