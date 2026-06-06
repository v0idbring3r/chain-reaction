import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../utils/colors';

interface PlayerTabProps {
  name: string;
  color: string;
  orbCount: number;
  isActive: boolean;
  isEliminated: boolean;
}

export function PlayerTab({ name, color, orbCount, isActive, isEliminated }: PlayerTabProps) {
  const opacity = isEliminated ? 0.3 : 1;

  return (
    <View style={[styles.container, { opacity, borderColor: isActive ? color : 'transparent' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.name, { color: isActive ? color : THEME.textSecondary }]}>
        {name}
      </Text>
      <Text style={[styles.count, { color: THEME.textMono }]}>
        {orbCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  count: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
});
