import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateColorSnapTap } from './logic';

test('evaluateColorSnapTap flags early click during waiting phase', () => {
  const res = evaluateColorSnapTap('waiting', 0, []);
  assert.equal(res.outcome, 'too-soon');
});

test('evaluateColorSnapTap ignores sub-100ms reaction times', () => {
  const res = evaluateColorSnapTap('ready', 82, [210]);
  assert.equal(res.outcome, 'ignored-sub-100');
});

test('evaluateColorSnapTap records valid rounds and computes average on round 5', () => {
  const r1 = evaluateColorSnapTap('ready', 210, []);
  assert.equal(r1.outcome, 'valid-round');
  if (r1.outcome === 'valid-round') {
    assert.equal(r1.isFinished, false);
    assert.deepEqual(r1.nextSamples, [210]);
  }

  const r5 = evaluateColorSnapTap('ready', 250, [200, 210, 220, 220]);
  assert.equal(r5.outcome, 'valid-round');
  if (r5.outcome === 'valid-round') {
    assert.equal(r5.isFinished, true);
    assert.equal(r5.averageMs, 220);
  }
});
