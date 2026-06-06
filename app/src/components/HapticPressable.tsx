import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { hapticTap } from '../utils/haptics';

export function HapticPressable({ onPress, ...rest }: PressableProps) {
  const handlePress = onPress
    ? (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
        hapticTap();
        onPress(e);
      }
    : undefined;

  return <Pressable {...rest} onPress={handlePress} />;
}
