import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAccuracyPct,
  createQuickTapTarget,
  scoreQuickTapHit,
} from './logic';

test('createQuickTapTarget spawns golden bonus orbs when roll < 0.18', () => {
  const bonus = createQuickTapTarget(1, 1000, 0, [], 0.05);
  const normal = createQuickTapTarget(2, 1000, 0, [], 0.5);
  assert.equal(bonus.isBonus, true);
  assert.equal(normal.isBonus, false);
});

test('scoreQuickTapHit awards higher points for bonus orbs and fast hits', () => {
  const normal = createQuickTapTarget(1, 1000, 0, [], 0.5);
  const bonus = createQuickTapTarget(2, 1000, 0, [], 0.05);
  const normalHit = scoreQuickTapHit(normal, 1200, 0);
  const bonusHit = scoreQuickTapHit(bonus, 1200, 3);
  assert.ok(bonusHit.pointsEarned > normalHit.pointsEarned);
  assert.equal(bonusHit.nextCombo, 4);
});

test('computeAccuracyPct returns 100 when empty and accurate percentage otherwise', () => {
  assert.equal(computeAccuracyPct(0, 0), 100);
  assert.equal(computeAccuracyPct(9, 1), 90);
});
