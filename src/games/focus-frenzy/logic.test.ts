import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFocusRound, getRoundDifficultyParams } from './logic';

test('getRoundDifficultyParams grows grid and shrinks round timer as rounds advance', () => {
  const early = getRoundDifficultyParams(0);
  const mid = getRoundDifficultyParams(5);
  const late = getRoundDifficultyParams(10);
  assert.equal(early.gridSide, 3);
  assert.equal(mid.gridSide, 4);
  assert.equal(late.gridSide, 5);
  assert.ok(late.roundTimerMs < early.roundTimerMs);
});

test('generateFocusRound produces exactly one distinguishable outlier tile', () => {
  for (let r = 0; r < 12; r++) {
    const round = generateFocusRound(r, r % 2 === 0);
    const outliers = round.tiles.filter((t) => t.isOutlier);
    assert.equal(outliers.length, 1);
    const outlier = outliers[0];
    const normal = round.tiles.find((t) => !t.isOutlier)!;
    const differs =
      outlier.shape !== normal.shape ||
      outlier.color !== normal.color ||
      outlier.rotationDeg !== normal.rotationDeg ||
      outlier.opacity !== normal.opacity;
    assert.equal(differs, true);
  }
});
