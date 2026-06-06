import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useGameStore, getPlayerColor } from '../store/gameStore';
import { criticalMass } from '../engine/GameEngine';
import { Cell } from './Cell';
import { CR_PALETTES } from '../utils/colors';

const BOARD_PADDING = 16;
const HUD_RESERVE = 140;

interface GridProps {
  explodingCells?: ReadonlySet<string>;
}

function cellKey(c: number, r: number): string {
  return `${c},${r}`;
}

export function Grid({ explodingCells }: GridProps) {
  const board = useGameStore(s => s.board);
  const paletteKey = useGameStore(s => s.paletteKey);
  const playCell = useGameStore(s => s.playCell);
  const { width, height } = useWindowDimensions();

  const maxBoardWidth = width - BOARD_PADDING * 2;
  const maxBoardHeight = height - HUD_RESERVE;
  const cellSize = Math.floor(Math.min(maxBoardWidth / board.cols, maxBoardHeight / board.rows));

  const palette = CR_PALETTES[paletteKey];

  return (
    <View style={styles.container}>
      {board.cells.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((cell, c) => {
            const color = cell.owner !== null
              ? palette[cell.owner]
              : palette[0];

            const cm = criticalMass(c, r, board.cols, board.rows);
            const criticalSoon = cell.count > 0 && cell.count === cm - 1;
            const isExploding = explodingCells?.has(cellKey(c, r)) ?? false;

            return (
              <Cell
                key={c}
                cell={cell}
                cellSize={cellSize}
                color={color}
                onPress={() => playCell(c, r)}
                criticalSoon={criticalSoon}
                isExploding={isExploding}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export { cellKey };

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});
