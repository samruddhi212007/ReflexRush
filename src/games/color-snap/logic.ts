import { computeAverageReactionTime } from '../../lib/scoring';

export const COLOR_SNAP_ROUNDS = 5;
export const COLOR_SNAP_MIN_REACTION_MS = 100;
export const COLOR_SNAP_MIN_DELAY_MS = 1500;
export const COLOR_SNAP_MAX_DELAY_MS = 5000;

export type ColorSnapRoundPhase = 'waiting' | 'ready' | 'too-soon' | 'round-result';

export type TapEvaluation =
  | {
      outcome: 'too-soon';
      message: string;
    }
  | {
      outcome: 'ignored-sub-100';
      message: string;
    }
  | {
      outcome: 'valid-round';
      reactionMs: number;
      nextSamples: number[];
      isFinished: boolean;
      averageMs: number | null;
    };

export function evaluateColorSnapTap(
  phase: ColorSnapRoundPhase,
  reactionMs: number,
  currentSamples: readonly number[],
  totalRounds: number = COLOR_SNAP_ROUNDS,
): TapEvaluation {
  if (phase === 'waiting') {
    return {
      outcome: 'too-soon',
      message: 'Too soon! Wait for Emerald before tapping.',
    };
  }

  if (phase !== 'ready') {
    return {
      outcome: 'too-soon',
      message: 'Wait for the next round.',
    };
  }

  const rounded = Math.round(reactionMs);
  if (!Number.isFinite(rounded) || rounded < COLOR_SNAP_MIN_REACTION_MS) {
    return {
      outcome: 'ignored-sub-100',
      message: 'Under 100 ms ignored — anticipatory click. Round repeating.',
    };
  }

  const nextSamples = [...currentSamples, rounded];
  const isFinished = nextSamples.length >= totalRounds;
  const averageMs = isFinished ? computeAverageReactionTime(nextSamples) : null;

  return {
    outcome: 'valid-round',
    reactionMs: rounded,
    nextSamples,
    isFinished,
    averageMs,
  };
}
