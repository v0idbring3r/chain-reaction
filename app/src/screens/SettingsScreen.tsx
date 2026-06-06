import React from 'react';
import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';
import { useGameStore } from '../store/gameStore';
import { THEME } from '../utils/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

interface SettingRowProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function SettingRow({ label, description, value, onValueChange }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#333', true: '#00E5FF55' }}
        thumbColor={value ? '#00E5FF' : '#888'}
      />
    </View>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const delayWinScreen = useGameStore(s => s.delayWinScreen);
  const setDelayWinScreen = useGameStore(s => s.setDelayWinScreen);
  const hapticsEnabled = useGameStore(s => s.hapticsEnabled);
  const setHapticsEnabled = useGameStore(s => s.setHapticsEnabled);
  const soundEnabled = useGameStore(s => s.soundEnabled);
  const setSoundEnabled = useGameStore(s => s.setSoundEnabled);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>SETTINGS</Text>

      <View style={styles.section}>
        <SettingRow
          label="DELAY WIN SCREEN"
          description="Show final board state before the win screen"
          value={delayWinScreen}
          onValueChange={setDelayWinScreen}
        />
        <SettingRow
          label="HAPTICS"
          description="Vibration feedback on moves and explosions"
          value={hapticsEnabled}
          onValueChange={setHapticsEnabled}
        />
        <SettingRow
          label="SOUND"
          description="Sound effects during gameplay"
          value={soundEnabled}
          onValueChange={setSoundEnabled}
        />
      </View>

      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>BACK</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    paddingHorizontal: 24,
  },
  title: {
    color: '#00E5FF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    marginVertical: 32,
  },
  section: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.gridLine,
  },
  rowText: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    color: THEME.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  description: {
    color: THEME.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  backButton: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: THEME.textSecondary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginTop: 40,
  },
  backButtonText: {
    color: THEME.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
