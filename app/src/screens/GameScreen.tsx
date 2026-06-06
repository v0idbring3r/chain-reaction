import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';
import { useGameStore, getPlayerColor, getOrbCounts } from '../store/gameStore';
import { neighbors, ownersAlive } from '../engine/GameEngine';
import { ExplosionStep } from '../types/game.types';
import { Grid, cellKey } from '../components/Grid';
import { PlayerTab } from '../components/PlayerTab';
import { TravelerOrb } from '../components/TravelerOrb';
import { ExplosionParticles } from '../components/ExplosionParticles';
import { CR_PALETTES, CR_PLAYER_NAMES, THEME } from '../utils/colors';
import { HapticPressable } from '../components/HapticPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const BOARD_PADDING = 16;
const TRAVEL_DURATION = 350;
const CHAIN_DELAY = 250;
const WIN_REVEAL_DELAY = 500;

interface TravelerData {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  size: number;
}

interface ParticleData {
  id: string;
  x: number;
  y: number;
  color: string;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function GameScreen({ navigation }: Props) {
  const winner = useGameStore(s => s.winner);
  const phase = useGameStore(s => s.phase);
  const currentPlayer = useGameStore(s => s.currentPlayer);
  const playerCount = useGameStore(s => s.playerCount);
  const paletteKey = useGameStore(s => s.paletteKey);
  const board = useGameStore(s => s.board);
  const eliminatedPlayers = useGameStore(s => s.eliminatedPlayers);
  const animatingExplosion = useGameStore(s => s.animatingExplosion);
  const lastMoveSteps = useGameStore(s => s.lastMoveSteps);
  const pauseGame = useGameStore(s => s.pauseGame);
  const resumeGame = useGameStore(s => s.resumeGame);
  const goHome = useGameStore(s => s.goHome);
  const applyExplosionStep = useGameStore(s => s.applyExplosionStep);
  const finishExplosionSequence = useGameStore(s => s.finishExplosionSequence);

  const [travelers, setTravelers] = useState<TravelerData[]>([]);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [explodingCells, setExplodingCells] = useState<Set<string>>(new Set());
  const sequencingRef = useRef(false);

  const { width, height } = useWindowDimensions();
  const maxBoardWidth = width - BOARD_PADDING * 2;
  const maxBoardHeight = height - 140;
  const cellSize = Math.floor(Math.min(maxBoardWidth / board.cols, maxBoardHeight / board.rows));

  const orbCounts = getOrbCounts(board);
  const palette = CR_PALETTES[paletteKey];

  const getCellCenter = useCallback((c: number, r: number) => ({
    x: c * cellSize + cellSize / 2,
    y: r * cellSize + cellSize / 2,
  }), [cellSize]);

  // Explosion sequencer
  useEffect(() => {
    if (!animatingExplosion || lastMoveSteps.length === 0 || sequencingRef.current) return;
    sequencingRef.current = true;

    const runSequence = async () => {
      const steps = lastMoveSteps as ReadonlyArray<ExplosionStep>;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const orbSize = Math.max(8, cellSize * 0.32);

        // Set exploding cells for flash
        const exploding = new Set(step.explodingCells.map(e => cellKey(e.c, e.r)));
        setExplodingCells(exploding);

        // Create travelers
        const newTravelers: TravelerData[] = [];
        const newParticles: ParticleData[] = [];

        for (const e of step.explodingCells) {
          const from = getCellCenter(e.c, e.r);
          const color = palette[e.owner];

          // Particles at explosion center
          newParticles.push({
            id: `p-${i}-${e.c}-${e.r}`,
            x: from.x,
            y: from.y,
            color,
          });

          // Travelers to each neighbor
          const nbrs = neighbors(e.c, e.r, board.cols, board.rows);
          for (const nbr of nbrs) {
            const to = getCellCenter(nbr.c, nbr.r);
            newTravelers.push({
              id: `t-${i}-${e.c}-${e.r}-${nbr.c}-${nbr.r}`,
              fromX: from.x,
              fromY: from.y,
              toX: to.x,
              toY: to.y,
              color,
              size: orbSize,
            });
          }
        }

        setTravelers(newTravelers);
        setParticles(newParticles);

        // Wait for travel animation
        await delay(TRAVEL_DURATION);

        // Apply this step's board state
        applyExplosionStep(i);

        // Clear effects
        setTravelers([]);
        setExplodingCells(new Set());

        // Chain delay before next wave
        await delay(CHAIN_DELAY);

        // Clear particles after their animation completes
        setParticles([]);

        // Skip remaining steps if winner detected and delay setting is off
        if (!useGameStore.getState().delayWinScreen && ownersAlive(step.boardAfter).size <= 1) {
          break;
        }
      }

      setTravelers([]);
      setParticles([]);
      setExplodingCells(new Set());

      const { pendingWinner } = useGameStore.getState();
      if (pendingWinner !== null) {
        await delay(WIN_REVEAL_DELAY);
      }

      finishExplosionSequence();
      sequencingRef.current = false;
    };

    runSequence();
  }, [animatingExplosion, lastMoveSteps, applyExplosionStep, finishExplosionSequence, cellSize, getCellCenter, palette, board.cols, board.rows]);

  useEffect(() => {
    if (winner !== null) {
      navigation.replace('Win');
    }
  }, [winner, navigation]);

  const currentColor = getPlayerColor(paletteKey, currentPlayer);
  const isPaused = phase === 'paused';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hud}>
        {Array.from({ length: playerCount }, (_, i) => (
          <PlayerTab
            key={i}
            name={CR_PLAYER_NAMES[i]}
            color={getPlayerColor(paletteKey, i)}
            orbCount={orbCounts[i] || 0}
            isActive={i === currentPlayer}
            isEliminated={eliminatedPlayers.has(i)}
          />
        ))}
      </View>

      <Text style={[styles.turnText, { color: currentColor }]}>
        {animatingExplosion ? 'CHAIN REACTION!' : `${CR_PLAYER_NAMES[currentPlayer]}'S TURN`}
      </Text>

      <View style={styles.boardContainer}>
        <View style={styles.boardWrapper}>
          <Grid explodingCells={explodingCells} />
          {/* Overlay layer for travelers and particles */}
          <View style={styles.effectsOverlay} pointerEvents="none">
            {travelers.map(t => (
              <TravelerOrb
                key={t.id}
                fromX={t.fromX}
                fromY={t.fromY}
                toX={t.toX}
                toY={t.toY}
                color={t.color}
                size={t.size}
                duration={TRAVEL_DURATION}
              />
            ))}
            {particles.map(p => (
              <ExplosionParticles
                key={p.id}
                x={p.x}
                y={p.y}
                color={p.color}
              />
            ))}
          </View>
        </View>
      </View>

      <HapticPressable style={styles.pauseButton} onPress={pauseGame}>
        <Text style={styles.pauseText}>PAUSE</Text>
      </HapticPressable>

      {isPaused && (
        <View style={styles.overlay}>
          <View style={styles.pauseMenu}>
            <Text style={styles.pauseTitle}>PAUSED</Text>
            <HapticPressable style={styles.menuButton} onPress={resumeGame}>
              <Text style={styles.menuButtonText}>RESUME</Text>
            </HapticPressable>
            <HapticPressable
              style={styles.menuButton}
              onPress={() => {
                resumeGame();
                navigation.navigate('Settings');
              }}
            >
              <Text style={styles.menuButtonText}>SETTINGS</Text>
            </HapticPressable>
            <HapticPressable
              style={[styles.menuButton, styles.menuButtonQuit]}
              onPress={() => {
                goHome();
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.menuButtonTextQuit}>QUIT</Text>
            </HapticPressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexWrap: 'wrap',
  },
  turnText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boardWrapper: {
    position: 'relative',
  },
  effectsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pauseButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginBottom: 16,
  },
  pauseText: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 7, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseMenu: {
    alignItems: 'center',
    gap: 20,
  },
  pauseTitle: {
    color: THEME.textPrimary,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
  },
  menuButton: {
    borderWidth: 2,
    borderColor: '#00E5FF',
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  menuButtonQuit: {
    borderColor: THEME.textSecondary,
  },
  menuButtonTextQuit: {
    color: THEME.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
