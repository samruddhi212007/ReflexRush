import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateGridRecall, generatePatternIndices } from './logic';

test('generatePatternIndices returns N unique indices in 0..15', () => {
  const pat = generatePatternIndices(5);
  assert.equal(pat.length, 5);
  assert.equal(new Set(pat).size, 5);
  assert.ok(pat.every((i) => i >= 0 && i < 16));
});

test('evaluateGridRecall scales N up on perfect recall and down on miss with 3 strikes', () => {
  const perfect = evaluateGridRecall([1, 4, 9], [9, 1, 4], 3, 0, 0);
  assert.equal(perfect.perfect, true);
  assert.equal(perfect.nextN, 4);
  assert.equal(perfect.nextMaxCleared, 3);
  assert.equal(perfect.gameOver, false);

  const miss1 = evaluateGridRecall([1, 4, 9, 10], [1, 4, 9, 11], 4, 0, 3);
  assert.equal(miss1.perfect, false);
  assert.equal(miss1.nextN, 3);
  assert.equal(miss1.nextStrikes, 1);
  assert.equal(miss1.gameOver, false);

  const miss3 = evaluateGridRecall([1, 4], [1, 2], 2, 2, 3);
  assert.equal(miss3.nextStrikes, 3);
  assert.equal(miss3.gameOver, true);
});
