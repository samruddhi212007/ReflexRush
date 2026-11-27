import type {
  GameCategory,
  GameDefinition,
  GameId,
  ScoreType,
  SessionRecord,
} from '../types/game';

export function isBetterScore(
  candidate: number,
  currentBest: number | undefined,
  scoreType: ScoreType,
): boolean {
  if (!Number.isFinite(candidate)) return false;
  if (currentBest === undefined || !Number.isFinite(currentBest)) return true;
  if (scoreType === 'lower-better') {
    return candidate < currentBest;
  }
  return candidate > currentBest;
}

export function computeAverageReactionTime(samples: readonly number[]): number {
  const valid = samples.filter((ms) => Number.isFinite(ms) && ms >= 100);
  if (valid.length === 0) return 0;
  const total = valid.reduce((sum, ms) => sum + ms, 0);
  return Math.round(total / valid.length);
}

export function getInitials(playerName: string): string {
  const trimmed = playerName.trim();
  if (!trimmed || trimmed.toLowerCase() === 'player 1') {
    return 'P1';
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function toLocalDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  return toLocalDateKey(date.getTime());
}

export function calculateDailyStreak(
  allSessions: readonly SessionRecord[],
  todayKey: string = toLocalDateKey(Date.now()),
): number {
  if (allSessions.length === 0) return 0;
  const activeDays = new Set(allSessions.map((s) => toLocalDateKey(s.timestamp)));

  let cursor = todayKey;
  if (!activeDays.has(cursor)) {
    const yesterday = shiftDateKey(todayKey, -1);
    if (!activeDays.has(yesterday)) {
      return 0;
    }
    cursor = yesterday;
  }

  let streak = 0;
  while (activeDays.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

export interface CategoryRadarPoint {
  category: GameCategory;
  gameId: GameId;
  score: number;
  rawBest: number | null;
}

export interface OverallStatsSummary {
  totalPlays: number;
  totalPlayTimeMs: number;
  dailyStreak: number;
  bestCategory: GameCategory | null;
  radarData: CategoryRadarPoint[];
}

export function computeOverallStats(
  sessionsByGame: Partial<Record<GameId, SessionRecord[]>>,
  personalBests: Partial<Record<GameId, number>>,
  registry: readonly GameDefinition[],
  todayKey: string = toLocalDateKey(Date.now()),
): OverallStatsSummary {
  const allSessions: SessionRecord[] = [];
  let totalPlayTimeMs = 0;

  for (const game of registry) {
    const list = sessionsByGame[game.id] ?? [];
    for (const session of list) {
      allSessions.push(session);
      if (Number.isFinite(session.durationMs) && session.durationMs > 0) {
        totalPlayTimeMs += session.durationMs;
      }
    }
  }

  const radarData: CategoryRadarPoint[] = registry.map((game) => {
    const best = personalBests[game.id];
    const hasBest = best !== undefined && Number.isFinite(best);
    return {
      category: game.category,
      gameId: game.id,
      score: hasBest ? game.normalizeScore(best) : 0,
      rawBest: hasBest ? best : null,
    };
  });

  let bestCategory: GameCategory | null = null;
  let bestNormalized = 0;
  for (const point of radarData) {
    if (point.rawBest !== null && point.score > bestNormalized) {
      bestNormalized = point.score;
      bestCategory = point.category;
    }
  }

  return {
    totalPlays: allSessions.length,
    totalPlayTimeMs,
    dailyStreak: calculateDailyStreak(allSessions, todayKey),
    bestCategory,
    radarData,
  };
}

export function formatPlayDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return '0s';
  const totalSeconds = Math.round(durationMs / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
}
