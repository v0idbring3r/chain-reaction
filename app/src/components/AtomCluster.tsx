import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Orb } from './Orb';

interface AtomClusterProps {
  count: number;
  color: string;
  cellSize: number;
}

function computeOrbPositions(count: number, cellSize: number): Array<{ x: number; y: number }> {
  const center = cellSize / 2;
  const orbit = cellSize * 0.18;

  if (count === 1) {
    return [{ x: center, y: center }];
  }
  if (count === 2) {
    const offsetX = orbit * 0.6;
    return [
      { x: center - offsetX, y: center },
      { x: center + offsetX, y: center },
    ];
  }
  const offsetX = orbit * 0.6;
  const offsetYUp = orbit * 0.6;
  const offsetYDown = orbit * 0.4;
  return [
    { x: center, y: center - offsetYUp },
    { x: center - offsetX, y: center + offsetYDown },
    { x: center + offsetX, y: center + offsetYDown },
  ];
}

export function AtomCluster({ count, color, cellSize }: AtomClusterProps) {
  if (count === 0) return null;

  const atomSize = Math.max(8, cellSize * 0.32);
  const displayCount = Math.min(count, 3);
  const positions = computeOrbPositions(displayCount, cellSize);

  return (
    <View style={[styles.container, { width: cellSize, height: cellSize }]}>
      {positions.map((pos, i) => (
        <View
          key={i}
          style={[
            styles.orbWrapper,
            {
              left: pos.x - atomSize / 2,
              top: pos.y - atomSize / 2,
            },
          ]}
        >
          <Orb color={color} size={atomSize} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  orbWrapper: {
    position: 'absolute',
  },
});
