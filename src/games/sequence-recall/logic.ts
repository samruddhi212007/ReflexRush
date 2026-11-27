import { randomInt } from '../../lib/rng';

export type PadId = 0 | 1 | 2 | 3;

export interface SequencePadConfig {
  id: PadId;
  label: string;
  keyHint: string;
  color: string;
  activeGlow: string;
  toneHz: number;
  symbol: string;
}

export const SEQUENCE_PADS: readonly SequencePadConfig[] = [
  {
    id: 0,
    label: 'Violet',
    keyHint: '1',
    color: '#8B5CF6',
    activeGlow: '0 0 32px rgba(139, 92, 246, 0.75)',
    toneHz: 329.63, // E4
    symbol: '▲',
  },
  {
    id: 1,
    label: 'Teal',
    keyHint: '2',
    color: '#14B8A6',
    activeGlow: '0 0 32px rgba(20, 184, 166, 0.75)',
    toneHz: 440.0, // A4
    symbol: '◆',
  },
  {
    id: 2,
    label: 'Olive',
    keyHint: '3',
    color: '#84CC16',
    activeGlow: '0 0 32px rgba(132, 204, 22, 0.75)',
    toneHz: 554.37, // C#5
    symbol: '●',
  },
  {
    id: 3,
    label: 'Rose',
    keyHint: '4',
    color: '#FB7185',
    activeGlow: '0 0 32px rgba(251, 113, 133, 0.75)',
    toneHz: 659.25, // E5
    symbol: '■',
  },
];

export function getPlaybackTimingForLevel(level: number): {
  litMs: number;
  gapMs: number;
} {
  // Tempo accelerates smoothly as level increases
  const clamped = Math.max(1, level);
  const litMs = Math.max(220, Math.round(540 - (clamped - 1) * 32));
  const gapMs = Math.max(90, Math.round(180 - (clamped - 1) * 10));
  return { litMs, gapMs };
}

export function appendSequenceStep(
  sequence: readonly PadId[],
  rng: (min: number, max: number) => number = randomInt,
): PadId[] {
  const next = rng(0, 3) as PadId;
  return [...sequence, next];
}

export type SequenceInputOutcome =
  | { status: 'wrong'; expected: PadId }
  | { status: 'continue'; nextIndex: number }
  | { status: 'level-complete'; clearedLevel: number };

export function evaluateSequenceInput(
  sequence: readonly PadId[],
  inputIndex: number,
  pressedPad: PadId,
): SequenceInputOutcome {
  const expected = sequence[inputIndex];
  if (pressedPad !== expected) {
    return { status: 'wrong', expected };
  }
  const nextIndex = inputIndex + 1;
  if (nextIndex >= sequence.length) {
    return { status: 'level-complete', clearedLevel: sequence.length };
  }
  return { status: 'continue', nextIndex };
}
