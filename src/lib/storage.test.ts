import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultState,
  MAX_SESSIONS_PER_GAME,
  parseStoredState,
  recordSessionInState,
} from './storage';

test('parseStoredState handles corrupted JSON and invalid shapes gracefully', () => {
  const fromBadJson = parseStoredState('{not-valid-json');
  assert.equal(fromBadJson.preferences.playerName, 'Player 1');
  assert.deepEqual(fromBadJson.personalBests, {});

  const fromArray = parseStoredState('[]');
  assert.equal(fromArray.preferences.theme, 'dark');

  const fromPartial = parseStoredState(
    JSON.stringify({
      preferences: { playerName: 'Mira', theme: 'light', muted: 'bad' },
      personalBests: { 'color-snap': 230, 'unknown-game': 999 },
      sessions: {
        'color-snap': [
          { score: 230, durationMs: 12000, timestamp: 1700000000000 },
          { score: 'invalid', durationMs: 12000 },
        ],
      },
    }),
  );
  assert.equal(fromPartial.preferences.playerName, 'Mira');
  assert.equal(fromPartial.preferences.theme, 'light');
  assert.equal(fromPartial.preferences.muted, false);
  assert.equal(fromPartial.personalBests['color-snap'], 230);
  assert.equal(fromPartial.sessions['color-snap']?.length, 1);
});

test('recordSessionInState keeps last 50 sessions and updates personal best', () => {
  let state = createDefaultState();
  for (let i = 0; i < 55; i++) {
    const res = recordSessionInState(state, 'color-snap', 300 - i, 15000, undefined, 1000 + i);
    state = res.nextState;
  }
  assert.equal(state.sessions['color-snap']?.length, MAX_SESSIONS_PER_GAME);
  assert.equal(state.personalBests['color-snap'], 300 - 54);

  const worse = recordSessionInState(state, 'color-snap', 400, 15000, undefined, 2000);
  assert.equal(worse.isNewBest, false);
  assert.equal(worse.nextState.personalBests['color-snap'], 246);

  const better = recordSessionInState(worse.nextState, 'color-snap', 195, 15000, undefined, 2001);
  assert.equal(better.isNewBest, true);
  assert.equal(better.nextState.personalBests['color-snap'], 195);
});
