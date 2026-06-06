import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';
import { THEME } from '../utils/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CHAIN{'\n'}REACTION</Text>
      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('Setup')}
      >
        <Text style={styles.buttonText}>START GAME</Text>
      </Pressable>
      <Pressable
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.settingsText}>SETTINGS</Text>
      </Pressable>
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
  title: {
    color: '#00E5FF',
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 4,
    lineHeight: 56,
  },
  button: {
    borderWidth: 2,
    borderColor: '#00E5FF',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#00E5FF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  settingsButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  settingsText: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
