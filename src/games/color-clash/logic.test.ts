import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateStroopAnswer, generateStroopPrompt } from './logic';

test('generateStroopPrompt always creates incongruent word vs ink color', () => {
  for (let i = 0; i < 20; i++) {
    const p = generateStroopPrompt();
    assert.notEqual(p.wordText.toLowerCase(), p.inkColorId);
  }
});

test('evaluateStroopAnswer tracks correct count, combo multiplier, and accuracy', () => {
  const prompt = { wordText: 'LIME', inkColorId: 'cyan' as const, inkHex: '#38BDF8' };
  const hit = evaluateStroopAnswer(prompt, 'cyan', {
    correctCount: 5,
    attempts: 5,
    combo: 3,
    bestCombo: 3,
    bonusPoints: 7,
  });
  assert.equal(hit.correct, true);
  assert.equal(hit.nextCorrectCount, 6);
  assert.equal(hit.nextCombo, 4);
  assert.equal(hit.multiplier, 2);
  assert.equal(hit.accuracyPct, 100);

  const miss = evaluateStroopAnswer(prompt, 'lime', {
    correctCount: 6,
    attempts: 6,
    combo: 4,
    bestCombo: 4,
    bonusPoints: 9,
  });
  assert.equal(miss.correct, false);
  assert.equal(miss.nextCombo, 0);
  assert.equal(miss.nextCorrectCount, 6);
  assert.equal(miss.accuracyPct, 86);
});
