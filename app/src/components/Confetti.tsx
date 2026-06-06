import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { hapticWin } from '../utils/haptics';
import { soundWin } from '../utils/sounds';

const CONFETTI_COUNT = 20;
const PARTICLE_SIZE = 6;

interface ConfettiProps {
  colors: readonly string[];
}

function ConfettiParticle({ color, angle, delayMs }: { color: string; angle: number; delayMs: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      ),
    );
  }, [progress, delayMs]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [0, -180]);
    const scale = interpolate(progress.value, [0, 0.1, 1], [0, 1, 1]);
    const opacity = interpolate(progress.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    return {
      transform: [
        { rotate: `${angle}deg` },
        { translateY },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

export function Confetti({ colors }: ConfettiProps) {
  useEffect(() => {
    hapticWin();
    soundWin();
  }, []);

  const particles = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    key: i,
    color: colors[i % colors.length],
    angle: (i / CONFETTI_COUNT) * 360,
    delayMs: (i / CONFETTI_COUNT) * 400,
  }));

  return (
    <>
      {particles.map(p => (
        <ConfettiParticle
          key={p.key}
          color={p.color}
          angle={p.angle}
          delayMs={p.delayMs}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    borderRadius: PARTICLE_SIZE / 2,
    alignSelf: 'center',
  },
});
