import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface TravelerOrbProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  size: number;
  duration?: number;
  onComplete?: () => void;
}

export function TravelerOrb({
  fromX,
  fromY,
  toX,
  toY,
  color,
  size,
  duration = 220,
  onComplete,
}: TravelerOrbProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.6);
  const orbOpacity = useSharedValue(0.7);

  const dx = toX - fromX;
  const dy = toY - fromY;
  const easing = Easing.bezier(0.55, 0.05, 0.5, 1);

  useEffect(() => {
    translateX.value = withTiming(dx, { duration, easing });
    translateY.value = withTiming(dy, { duration, easing }, (finished) => {
      if (finished && onComplete) {
        runOnJS(onComplete)();
      }
    });
    scale.value = withSequence(
      withTiming(1.1, { duration: duration * 0.2 }),
      withTiming(0.8, { duration: duration * 0.8 }),
    );
    orbOpacity.value = withSequence(
      withTiming(1, { duration: duration * 0.2 }),
      withTiming(1, { duration: duration * 0.6 }),
      withTiming(0, { duration: duration * 0.2 }),
    );
  }, [translateX, translateY, scale, orbOpacity, dx, dy, duration, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: orbOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.traveler,
        {
          left: fromX - size / 2,
          top: fromY - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  traveler: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
});
