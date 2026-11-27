import { pickRandom } from '../../lib/rng';

export const COLOR_CLASH_DURATION_MS = 30000;
export const COLOR_CLASH_PENALTY_MS = 450;

export type StroopColorId = 'rose' | 'cyan' | 'lime' | 'amber';

export interface StroopColorOption {
  id: StroopColorId;
  word: string;
  inkHex: string;
  keyHint: string;
}

export const STROOP_COLORS: readonly StroopColorOption[] = [
  { id: 'rose', word: 'ROSE', inkHex: '#FB7185', keyHint: '1' },
  { id: 'cyan', word: 'CYAN', inkHex: '#38BDF8', keyHint: '2' },
  { id: 'lime', word: 'LIME', inkHex: '#84CC16', keyHint: '3' },
  { id: 'amber', word: 'AMBER', inkHex: '#FBBF24', keyHint: '4' },
];

export interface StroopPrompt {
  wordText: string;
  inkColorId: StroopColorId;
  inkHex: string;
}

export function generateStroopPrompt(
  prevInkId?: StroopColorId,
): StroopPrompt {
  const inkChoices = prevInkId
    ? STROOP_COLORS.filter((c) => c.id !== prevInkId)
    : STROOP_COLORS;
  const inkOption = pickRandom(inkChoices);
  // Word must differ from ink color for genuine Stroop interference
  const wordChoices = STROOP_COLORS.filter((c) => c.id !== inkOption.id);
  const wordOption = pickRandom(wordChoices);

  return {
    wordText: wordOption.word,
    inkColorId: inkOption.id,
    inkHex: inkOption.inkHex,
  };
}

export interface StroopAnswerResult {
  correct: boolean;
  nextCorrectCount: number;
  nextAttempts: number;
  nextCombo: number;
  nextBestCombo: number;
  multiplier: number;
  nextBonusPoints: number;
  accuracyPct: number;
}

export function evaluateStroopAnswer(
  prompt: StroopPrompt,
  chosenId: StroopColorId,
  state: {
    correctCount: number;
    attempts: number;
    combo: number;
    bestCombo: number;
    bonusPoints: number;
  },
): StroopAnswerResult {
  const correct = chosenId === prompt.inkColorId;
  const nextAttempts = state.attempts + 1;

  if (correct) {
    const nextCorrectCount = state.correctCount + 1;
    const nextCombo = state.combo + 1;
    const nextBestCombo = Math.max(state.bestCombo, nextCombo);
    const multiplier = Math.min(4, 1 + Math.floor((nextCombo - 1) / 3));
    const nextBonusPoints = state.bonusPoints + multiplier;
    return {
      correct: true,
      nextCorrectCount,
      nextAttempts,
      nextCombo,
      nextBestCombo,
      multiplier,
      nextBonusPoints,
      accuracyPct: Math.round((nextCorrectCount / nextAttempts) * 100),
    };
  }

  return {
    correct: false,
    nextCorrectCount: state.correctCount,
    nextAttempts,
    nextCombo: 0,
    nextBestCombo: state.bestCombo,
    multiplier: 1,
    nextBonusPoints: state.bonusPoints,
    accuracyPct: Math.round((state.correctCount / nextAttempts) * 100),
  };
}
