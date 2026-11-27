import { shuffle } from '../../lib/rng';

export const GRID_GENIUS_SIZE = 16; // 4x4
export const GRID_GENIUS_START_N = 3;
export const GRID_GENIUS_MIN_N = 2;
export const GRID_GENIUS_MAX_N = 12;
export const GRID_GENIUS_MAX_STRIKES = 3;
export const GRID_GENIUS_REVEAL_MS = 1500;

export function generatePatternIndices(count: number): number[] {
  const clamped = Math.max(
    GRID_GENIUS_MIN_N,
    Math.min(GRID_GENIUS_MAX_N, count),
  );
  const all = Array.from({ length: GRID_GENIUS_SIZE }, (_, i) => i);
  return shuffle(all).slice(0, clamped);
}

export interface GridRoundResult {
  perfect: boolean;
  nextN: number;
  nextStrikes: number;
  nextMaxCleared: number;
  gameOver: boolean;
}

export function evaluateGridRecall(
  targetIndices: readonly number[],
  selectedIndices: readonly number[],
  currentN: number,
  currentStrikes: number,
  currentMaxCleared: number,
): GridRoundResult {
  const targetSet = new Set(targetIndices);
  const selectedSet = new Set(selectedIndices);

  const perfect =
    targetSet.size === selectedSet.size &&
    [...targetSet].every((idx) => selectedSet.has(idx));

  if (perfect) {
    const nextMaxCleared = Math.max(currentMaxCleared, currentN);
    const nextN = Math.min(GRID_GENIUS_MAX_N, currentN + 1);
    return {
      perfect: true,
      nextN,
      nextStrikes: currentStrikes,
      nextMaxCleared,
      gameOver: false,
    };
  }

  const nextStrikes = currentStrikes + 1;
  const gameOver = nextStrikes >= GRID_GENIUS_MAX_STRIKES;
  const nextN = Math.max(GRID_GENIUS_MIN_N, currentN - 1);

  return {
    perfect: false,
    nextN,
    nextStrikes,
    nextMaxCleared: currentMaxCleared,
    gameOver,
  };
}
