import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const PARTICLE_COUNT = 8;
const PARTICLE_DISTANCE = 40;
const PARTICLE_SIZE = 4;
const DURATION = 480;

interface ExplosionParticlesProps {
  x: number;
  y: number;
  color: string;
}

function Particle({ x, y, color, angle }: { x: number; y: number; color: string; angle: number }) {
  const tx = Math.cos(angle) * PARTICLE_DISTANCE;
  const ty = Math.sin(angle) * PARTICLE_DISTANCE;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const particleOpacity = useSharedValue(1);

  useEffect(() => {
    translateX.value = withTiming(tx, { duration: DURATION, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(ty, { duration: DURATION, easing: Easing.out(Easing.ease) });
    scale.value = withTiming(0, { duration: DURATION });
    particleOpacity.value = withTiming(0, { duration: DURATION });
  }, [translateX, translateY, scale, particleOpacity, tx, ty]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: particleOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: x - PARTICLE_SIZE / 2,
          top: y - PARTICLE_SIZE / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

export function ExplosionParticles({ x, y, color }: ExplosionParticlesProps) {
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    angle: (i / PARTICLE_COUNT) * Math.PI * 2,
    key: i,
  }));

  return (
    <>
      {particles.map(p => (
        <Particle key={p.key} x={x} y={y} color={color} angle={p.angle} />
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
  },
});
