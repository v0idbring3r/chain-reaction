import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Cell as CellType } from '../types/game.types';
import { AtomCluster } from './AtomCluster';
import { THEME } from '../utils/colors';

interface CellProps {
  cell: CellType;
  cellSize: number;
  color: string;
  onPress: () => void;
  criticalSoon: boolean;
  isExploding: boolean;
}

export function Cell({ cell, cellSize, color, onPress, criticalSoon, isExploding }: CellProps) {
  const borderColor = cell.owner !== null ? color : THEME.gridLine;

  // cr-wobble
  const rotation = useSharedValue(0);
  const wobbleScale = useSharedValue(1);

  useEffect(() => {
    if (criticalSoon) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 110 }),
          withTiming(2, { duration: 110 }),
          withTiming(-2, { duration: 110 }),
          withTiming(3, { duration: 110 }),
          withTiming(0, { duration: 110 }),
        ),
        -1,
        false,
      );
      wobbleScale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 110 }),
          withTiming(0.97, { duration: 110 }),
          withTiming(1.04, { duration: 110 }),
          withTiming(0.98, { duration: 110 }),
          withTiming(1, { duration: 110 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotation);
      cancelAnimation(wobbleScale);
      rotation.value = withTiming(0, { duration: 100 });
      wobbleScale.value = withTiming(1, { duration: 100 });
    }
  }, [criticalSoon, rotation, wobbleScale]);

  const wobbleStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: wobbleScale.value },
    ],
  }));

  // cr-explode-flash
  const flashScale = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    if (isExploding) {
      flashScale.value = 0.4;
      flashOpacity.value = 0;
      flashScale.value = withTiming(1.4, { duration: 200, easing: Easing.out(Easing.ease) });
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 60 }),
        withTiming(0, { duration: 140 }),
      );
    }
  }, [isExploding, flashScale, flashOpacity]);

  const flashStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flashScale.value }],
    opacity: flashOpacity.value,
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.cell,
          { width: cellSize, height: cellSize, borderColor },
          wobbleStyle,
        ]}
      >
        {cell.count > 0 && (
          <AtomCluster count={cell.count} color={color} cellSize={cellSize} />
        )}
        <Animated.View
          style={[
            styles.flash,
            {
              width: cellSize,
              height: cellSize,
              borderRadius: 6,
              backgroundColor: color,
            },
            flashStyle,
          ]}
          pointerEvents="none"
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  flash: {
    position: 'absolute',
    opacity: 0,
  },
});
