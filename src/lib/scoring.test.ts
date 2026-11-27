import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDailyStreak,
  computeAverageReactionTime,
  computeOverallStats,
  getInitials,
  isBetterScore,
} from './scoring';
import { GAME_REGISTRY } from './registry';
import type { SessionRecord } from '../types/game';

test('isBetterScore compares lower-better and higher-better accurately', () => {
  assert.equal(isBetterScore(220, undefined, 'lower-better'), true);
  assert.equal(isBetterScore(210, 220, 'lower-better'), true);
  assert.equal(isBetterScore(230, 220, 'lower-better'), false);
  assert.equal(isBetterScore(220, 220, 'lower-better'), false);

  assert.equal(isBetterScore(12, undefined, 'higher-better'), true);
  assert.equal(isBetterScore(15, 12, 'higher-better'), true);
  assert.equal(isBetterScore(10, 12, 'higher-better'), false);
});

test('computeAverageReactionTime ignores values under 100ms', () => {
  assert.equal(computeAverageReactionTime([45, 200, 300, 99]), 250);
  assert.equal(computeAverageReactionTime([50, 80]), 0);
});

test('getInitials defaults to P1 and derives initials cleanly', () => {
  assert.equal(getInitials(''), 'P1');
  assert.equal(getInitials('Player 1'), 'P1');
  assert.equal(getInitials('Alex Rivera'), 'AR');
  assert.equal(getInitials('Zoe'), 'ZO');
});

test('calculateDailyStreak counts consecutive days ending today or yesterday', () => {
  const mkSession = (dateStr: string): SessionRecord => ({
    id: dateStr,
    gameId: 'color-snap',
    score: 240,
    durationMs: 20000,
    timestamp: new Date(`${dateStr}T12:00:00`).getTime(),
  });

  const streak3 = calculateDailyStreak(
    [mkSession('2026-11-23'), mkSession('2026-11-24'), mkSession('2026-11-25')],
    '2026-11-25',
  );
  assert.equal(streak3, 3);

  const streakYesterday = calculateDailyStreak(
    [mkSession('2026-11-23'), mkSession('2026-11-24')],
    '2026-11-25',
  );
  assert.equal(streakYesterday, 2);

  const brokenStreak = calculateDailyStreak([mkSession('2026-11-22')], '2026-11-25');
  assert.equal(brokenStreak, 0);
});

test('computeOverallStats aggregates totals and selects best category', () => {
  const sessions = {
    'color-snap': [
      {
        id: '1',
        gameId: 'color-snap' as const,
        score: 200,
        durationMs: 25000,
        timestamp: new Date('2026-11-25T10:00:00').getTime(),
      },
    ],
  };
  const bests = { 'color-snap': 200 };
  const summary = computeOverallStats(sessions, bests, GAME_REGISTRY, '2026-11-25');
  assert.equal(summary.totalPlays, 1);
  assert.equal(summary.totalPlayTimeMs, 25000);
  assert.equal(summary.dailyStreak, 1);
  assert.equal(summary.bestCategory, 'Speed');
  assert.equal(summary.radarData.length, 6);
});
