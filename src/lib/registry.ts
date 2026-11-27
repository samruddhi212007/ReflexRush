import type { GameDefinition, GameId } from '../types/game';

export const GAME_REGISTRY: readonly GameDefinition[] = [
  {
    id: 'color-snap',
    title: 'Color Snap',
    category: 'Speed',
    difficulty: 'Easy',
    duration: '~30s',
    description:
      'Wait for the crimson field to snap emerald, then strike instantaneously across five precision rounds.',
    accent: '#84CC16',
    accentOnFill: '#0B0D12',
    accentLabelDark: '#A3E635',
    accentLabelLight: '#3F6212',
    scoreType: 'lower-better',
    unitLabel: 'Average Reaction (ms)',
    format: (score: number) => `${Math.round(score)} ms`,
    normalizeScore: (score: number) => {
      if (!Number.isFinite(score) || score <= 0) return 0;
      // 160 ms => 100, 480 ms => 15
      const clamped = Math.max(160, Math.min(550, score));
      return Math.round(((550 - clamped) / (550 - 160)) * 85 + 15);
    },
    howTo: [
      'Click, tap, or press Space as soon as the panel switches from Crimson (Wait) to Emerald (GO!).',
      'Clicking early before the signal triggers a "Too soon" warning and repeats the round.',
      'Complete 5 valid rounds. Sub-100ms anticipatory clicks are ignored. Lowest average time wins.',
    ],
    controlsHint: 'Click / Tap / Space to strike · Esc or P to pause',
    photosensitivityNotice:
      'Contains sudden full-panel color transitions between crimson and emerald.',
    implemented: true,
  },
  {
    id: 'sequence-recall',
    title: 'Sequence Recall',
    category: 'Memory',
    difficulty: 'Medium',
    duration: '1–3m',
    description:
      'Track and echo escalating light-and-tone sequences across four harmonic pads as tempo accelerates.',
    accent: '#8B5CF6',
    accentOnFill: '#FFFFFF',
    accentLabelDark: '#A78BFA',
    accentLabelLight: '#5B21B6',
    scoreType: 'higher-better',
    unitLabel: 'Highest Level',
    format: (score: number) => `Lvl ${Math.round(score)}`,
    normalizeScore: (score: number) => {
      if (!Number.isFinite(score) || score <= 0) return 0;
      return Math.min(100, Math.round((score / 14) * 100));
    },
    howTo: [
      'Watch and listen as the four pads illuminate in sequence.',
      'Repeat the exact order by tapping the pads or pressing keys 1–4.',
      'Each cleared round adds one step and speeds up playback.',
    ],
    controlsHint: 'Tap pads or Keys 1–4 · Esc or P to pause',
    photosensitivityNotice:
      'Features rhythmic illuminated pad flashes during sequence playback.',
    implemented: true,
  },
  {
    id: 'grid-genius',
    title: 'Grid Genius',
    category: 'Spatial',
    difficulty: 'Adaptive',
    duration: '1–3m',
    description:
      'Memorize fleeting tile constellations on a 4×4 matrix that adapts its complexity to your accuracy.',
    accent: '#06B6D4',
    accentOnFill: '#0B0D12',
    accentLabelDark: '#22D3EE',
    accentLabelLight: '#0E7490',
    scoreType: 'higher-better',
    unitLabel: 'Max Pattern Size',
    format: (score: number) => `${Math.round(score)} tiles`,
    normalizeScore: (score: number) => {
      if (!Number.isFinite(score) || score <= 0) return 0;
      return Math.min(100, Math.round((score / 10) * 100));
    },
    howTo: [
      'Observe the highlighted tiles on the 4×4 grid for 1.5 seconds.',
      'Re-tap every tile from memory after they fade.',
      'Pattern size adapts up on perfect clears and down on misses (3 strikes ends run).',
    ],
    controlsHint: 'Tap or click grid tiles · Esc or P to pause',
    implemented: true,
  },
  {
    id: 'color-clash',
    title: 'Color Clash',
    category: 'Focus',
    difficulty: 'Hard',
    duration: '30s',
    description:
      'Override automatic reading impulses in a high-speed Stroop clash—select the ink hue, not the word.',
    accent: '#FB7185',
    accentOnFill: '#0B0D12',
    accentLabelDark: '#FDA4AF',
    accentLabelLight: '#BE123C',
    scoreType: 'higher-better',
    unitLabel: 'Score (pts)',
    format: (score: number) => `${Math.round(score)} pts`,
    normalizeScore: (score: number) => {
      if (!Number.isFinite(score) || score <= 0) return 0;
      return Math.min(100, Math.round((score / 45) * 100));
    },
    howTo: [
      'Read the ink color of the displayed word while ignoring what the text spells.',
      'Select the matching ink color button before the 30-second clock expires.',
      'Consecutive hits build your combo multiplier; wrong picks break the streak.',
    ],
    controlsHint: 'Tap color buttons or Keys 1–4 · Esc or P to pause',
    implemented: true,
  },
  {
    id: 'quick-tap',
    title: 'Quick Tap',
    category: 'Reflex',
    difficulty: 'Medium',
    duration: '30s',
    description:
      'Intercept shrinking target rings across an open arena and snipe rare golden orbs for surge multipliers.',
    accent: '#FBBF24',
    accentOnFill: '#0B0D12',
    accentLabelDark: '#FCD34D',
    accentLabelLight: '#B45309',
    scoreType: 'higher-better',
    unitLabel: 'Points',
    format: (score: number) => `${Math.round(score)} pts`,
    normalizeScore: (score: number) => {
      if (!Number.isFinite(score) || score <= 0) return 0;
      return Math.min(100, Math.round((score / 2400) * 100));
    },
    howTo: [
      'Tap targets before their outer timing ring collapses.',
      'Golden bonus orbs yield higher points when caught quickly.',
      'Build consecutive hit combos—missing a target resets your multiplier.',
    ],
    controlsHint: 'Pointer tap / click on arena targets · Esc or P to pause',
    implemented: true,
  },
  {
    id: 'focus-frenzy',
    title: 'Focus Frenzy',
    category: 'Visual',
    difficulty: 'Hard',
    duration: '45s',
    description:
      'Spot the subtle geometric outlier in dense visual arrays as variance tightens and round clocks shrink.',
    accent: '#A78BFA',
    accentOnFill: '#0B0D12',
    accentLabelDark: '#C4B5FD',
    accentLabelLight: '#6D28D9',
    scoreType: 'higher-better',
    unitLabel: 'Rounds Cleared',
    format: (score: number) => `${Math.round(score)} rds`,
    normalizeScore: (score: number) => {
      if (!Number.isFinite(score) || score <= 0) return 0;
      return Math.min(100, Math.round((score / 22) * 100));
    },
    howTo: [
      'Scan the grid of shapes to locate the single outlier differing in hue, angle, or form.',
      'Tap the outlier before the round bar runs empty.',
      'Each clear tightens the difference and shortens your decision window.',
    ],
    controlsHint: 'Tap the outlier tile · Esc or P to pause',
    implemented: true,
  },
];

export const GAME_BY_ID: Record<GameId, GameDefinition> = GAME_REGISTRY.reduce(
  (acc, game) => {
    acc[game.id] = game;
    return acc;
  },
  {} as Record<GameId, GameDefinition>,
);

export function getGameById(id: string | undefined): GameDefinition | undefined {
  if (!id) return undefined;
  return (GAME_BY_ID as Record<string, GameDefinition | undefined>)[id];
}
