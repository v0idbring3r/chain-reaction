import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface OrbProps {
  color: string;
  size: number;
}

export function Orb({ color, size }: OrbProps) {
  const scale = useSharedValue(0);
  const orbOpacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // cr-pop: bounce on mount
    scale.value = withSpring(1, { damping: 8, stiffness: 200, mass: 0.8 });
    orbOpacity.value = withTiming(1, { duration: 120 });

    // cr-atom-orbit: idle float
    translateY.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [scale, orbOpacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: orbOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  orb: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
});
