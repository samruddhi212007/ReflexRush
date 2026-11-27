import { randomBetween } from '../../lib/rng';

export const QUICK_TAP_DURATION_MS = 30000;
export const QUICK_TAP_MAX_CONCURRENT = 3;

export interface QuickTapTarget {
  id: number;
  /** Normalized arena coordinates in percentage [12..88] */
  xPct: number;
  yPct: number;
  isBonus: boolean;
  spawnedAt: number;
  lifetimeMs: number;
}

export function computeTargetLifetimeMs(combo: number): number {
  // Base 1950ms, tightens subtly with combo down to 1100ms
  return Math.max(1100, Math.round(1950 - combo * 45));
}

export function createQuickTapTarget(
  id: number,
  now: number,
  combo: number,
  existing: readonly QuickTapTarget[],
  bonusRoll: number = Math.random(),
): QuickTapTarget {
  const isBonus = bonusRoll < 0.18;
  const lifetimeMs = isBonus
    ? Math.max(950, computeTargetLifetimeMs(combo) - 250)
    : computeTargetLifetimeMs(combo);

  // Pick coordinates away from edges and existing targets when possible
  let bestX = randomBetween(14, 86);
  let bestY = randomBetween(16, 84);
  for (let attempt = 0; attempt < 8; attempt++) {
    const cx = randomBetween(14, 86);
    const cy = randomBetween(16, 84);
    const tooClose = existing.some(
      (t) => Math.hypot(t.xPct - cx, t.yPct - cy) < 18,
    );
    if (!tooClose) {
      bestX = cx;
      bestY = cy;
      break;
    }
  }

  return {
    id,
    xPct: bestX,
    yPct: bestY,
    isBonus,
    spawnedAt: now,
    lifetimeMs,
  };
}

export function scoreQuickTapHit(
  target: QuickTapTarget,
  hitAt: number,
  currentCombo: number,
): {
  pointsEarned: number;
  nextCombo: number;
  reactionMs: number;
} {
  const reactionMs = Math.max(40, Math.round(hitAt - target.spawnedAt));
  const progress = Math.min(1, Math.max(0, reactionMs / target.lifetimeMs));
  const speedBonus = Math.round((1 - progress) * 60);
  const nextCombo = currentCombo + 1;
  const multiplier = Math.min(4, 1 + Math.floor((nextCombo - 1) / 4) * 0.5);
  const base = target.isBonus ? 250 : 100;
  const pointsEarned = Math.round((base + speedBonus) * multiplier);

  return {
    pointsEarned,
    nextCombo,
    reactionMs,
  };
}

export function computeAccuracyPct(hits: number, misses: number): number {
  const total = hits + misses;
  if (total === 0) return 100;
  return Math.round((hits / total) * 100);
}
