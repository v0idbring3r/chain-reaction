import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { hapticTap } from '../utils/haptics';
import { soundTap } from '../utils/sounds';

export function HapticPressable({ onPress, ...rest }: PressableProps) {
  const handlePress = onPress
    ? (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
        hapticTap();
        soundTap();
        onPress(e);
      }
    : undefined;

  return <Pressable {...rest} onPress={handlePress} />;
}
