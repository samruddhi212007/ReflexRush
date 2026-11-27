import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendSequenceStep,
  evaluateSequenceInput,
  getPlaybackTimingForLevel,
} from './logic';

test('getPlaybackTimingForLevel accelerates tempo with higher levels', () => {
  const l1 = getPlaybackTimingForLevel(1);
  const l6 = getPlaybackTimingForLevel(6);
  assert.ok(l6.litMs < l1.litMs);
  assert.ok(l6.gapMs < l1.gapMs);
});

test('appendSequenceStep extends sequence by 1', () => {
  const next = appendSequenceStep([0, 2], () => 3);
  assert.deepEqual(next, [0, 2, 3]);
});

test('evaluateSequenceInput handles continue, level-complete, and wrong pad', () => {
  const seq = [0, 2, 1] as const;
  assert.deepEqual(evaluateSequenceInput(seq, 0, 0), {
    status: 'continue',
    nextIndex: 1,
  });
  assert.deepEqual(evaluateSequenceInput(seq, 2, 1), {
    status: 'level-complete',
    clearedLevel: 3,
  });
  assert.deepEqual(evaluateSequenceInput(seq, 1, 3), {
    status: 'wrong',
    expected: 2,
  });
});
