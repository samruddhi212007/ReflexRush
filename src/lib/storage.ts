import { GAME_BY_ID, GAME_REGISTRY } from './registry';
import { isBetterScore } from './scoring';
import type {
  GameId,
  SessionRecord,
  StoredAppState,
  UserPreferences,
} from '../types/game';

export const STORAGE_KEY = 'reflexrush_v1_state';
export const MAX_SESSIONS_PER_GAME = 50;

export const DEFAULT_PREFERENCES: UserPreferences = {
  playerName: 'Player 1',
  theme: 'dark',
  muted: false,
  colorblindMode: false,
};

export function createDefaultState(): StoredAppState {
  return {
    version: 1,
    preferences: { ...DEFAULT_PREFERENCES },
    personalBests: {},
    sessions: {},
  };
}

function isValidGameId(value: string): value is GameId {
  return Boolean((GAME_BY_ID as Record<string, unknown>)[value]);
}

function sanitizeSession(raw: unknown, expectedGameId: GameId): SessionRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const score = typeof obj.score === 'number' && Number.isFinite(obj.score) ? obj.score : null;
  const durationMs =
    typeof obj.durationMs === 'number' && Number.isFinite(obj.durationMs) && obj.durationMs >= 0
      ? obj.durationMs
      : 0;
  const timestamp =
    typeof obj.timestamp === 'number' && Number.isFinite(obj.timestamp) && obj.timestamp > 0
      ? obj.timestamp
      : Date.now();
  if (score === null) return null;

  const id =
    typeof obj.id === 'string' && obj.id.length > 0
      ? obj.id
      : `${expectedGameId}-${timestamp}`;

  let meta: Record<string, number | string> | undefined;
  if (obj.meta && typeof obj.meta === 'object' && !Array.isArray(obj.meta)) {
    const cleanMeta: Record<string, number | string> = {};
    for (const [k, v] of Object.entries(obj.meta as Record<string, unknown>)) {
      if (typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v))) {
        cleanMeta[k] = v;
      }
    }
    if (Object.keys(cleanMeta).length > 0) {
      meta = cleanMeta;
    }
  }

  return {
    id,
    gameId: expectedGameId,
    score,
    durationMs,
    timestamp,
    meta,
  };
}

export function parseStoredState(rawJson: string | null): StoredAppState {
  if (!rawJson) return createDefaultState();
  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return createDefaultState();
    }
    const obj = parsed as Record<string, unknown>;

    const rawPrefs =
      obj.preferences && typeof obj.preferences === 'object'
        ? (obj.preferences as Record<string, unknown>)
        : {};

    const preferences: UserPreferences = {
      playerName:
        typeof rawPrefs.playerName === 'string' && rawPrefs.playerName.trim().length > 0
          ? rawPrefs.playerName.slice(0, 32)
          : DEFAULT_PREFERENCES.playerName,
      theme: rawPrefs.theme === 'light' ? 'light' : 'dark',
      muted: typeof rawPrefs.muted === 'boolean' ? rawPrefs.muted : false,
      colorblindMode:
        typeof rawPrefs.colorblindMode === 'boolean' ? rawPrefs.colorblindMode : false,
    };

    const personalBests: Partial<Record<GameId, number>> = {};
    if (obj.personalBests && typeof obj.personalBests === 'object') {
      for (const [key, val] of Object.entries(obj.personalBests as Record<string, unknown>)) {
        if (isValidGameId(key) && typeof val === 'number' && Number.isFinite(val)) {
          personalBests[key] = val;
        }
      }
    }

    const sessions: Partial<Record<GameId, SessionRecord[]>> = {};
    if (obj.sessions && typeof obj.sessions === 'object') {
      for (const game of GAME_REGISTRY) {
        const rawList = (obj.sessions as Record<string, unknown>)[game.id];
        if (Array.isArray(rawList)) {
          const valid = rawList
            .map((item) => sanitizeSession(item, game.id))
            .filter((item): item is SessionRecord => item !== null)
            .slice(-MAX_SESSIONS_PER_GAME);
          if (valid.length > 0) {
            sessions[game.id] = valid;
          }
        }
      }
    }

    return {
      version: 1,
      preferences,
      personalBests,
      sessions,
    };
  } catch {
    return createDefaultState();
  }
}

let memoryFallback: StoredAppState = createDefaultState();

export function loadAppState(): StoredAppState {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return memoryFallback;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = parseStoredState(raw);
    memoryFallback = parsed;
    return parsed;
  } catch {
    return memoryFallback;
  }
}

export function saveAppState(state: StoredAppState): void {
  memoryFallback = state;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Storage quota exceeded or blocked; in-memory state stays intact.
  }
}

export function recordSessionInState(
  state: StoredAppState,
  gameId: GameId,
  score: number,
  durationMs: number,
  meta?: Record<string, number | string>,
  timestamp: number = Date.now(),
): { nextState: StoredAppState; isNewBest: boolean; previousBest: number | undefined } {
  const game = GAME_BY_ID[gameId];
  const previousBest = state.personalBests[gameId];
  const isNewBest = isBetterScore(score, previousBest, game.scoreType);

  const existingList = state.sessions[gameId] ?? [];
  const entry: SessionRecord = {
    id: `${gameId}-${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
    gameId,
    score,
    durationMs: Math.max(0, Math.round(durationMs)),
    timestamp,
    meta,
  };

  const nextList = [...existingList, entry].slice(-MAX_SESSIONS_PER_GAME);

  const nextState: StoredAppState = {
    ...state,
    personalBests: {
      ...state.personalBests,
      [gameId]: isNewBest ? score : previousBest,
    },
    sessions: {
      ...state.sessions,
      [gameId]: nextList,
    },
  };

  return { nextState, isNewBest, previousBest };
}
