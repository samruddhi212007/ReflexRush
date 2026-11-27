export type GameId =
  | 'color-snap'
  | 'sequence-recall'
  | 'grid-genius'
  | 'color-clash'
  | 'quick-tap'
  | 'focus-frenzy';

export type GameCategory =
  | 'Speed'
  | 'Memory'
  | 'Spatial'
  | 'Focus'
  | 'Reflex'
  | 'Visual';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Adaptive' | 'Hard';

export type ScoreType = 'lower-better' | 'higher-better';

export type ThemeMode = 'dark' | 'light';

export interface GameDefinition {
  id: GameId;
  title: string;
  category: GameCategory;
  difficulty: DifficultyLevel;
  duration: string;
  description: string;
  accent: string;
  /** Accessible text color when placed on top of the accent fill */
  accentOnFill: string;
  /** Dark-mode text color for accent labels; light-mode darkened counterpart */
  accentLabelDark: string;
  accentLabelLight: string;
  scoreType: ScoreType;
  unitLabel: string;
  format: (score: number) => string;
  normalizeScore: (score: number) => number;
  howTo: string[];
  controlsHint: string;
  photosensitivityNotice?: string;
  implemented: boolean;
}

export interface SessionRecord {
  id: string;
  gameId: GameId;
  score: number;
  durationMs: number;
  timestamp: number;
  meta?: Record<string, number | string>;
}

export interface UserPreferences {
  playerName: string;
  theme: ThemeMode;
  muted: boolean;
  colorblindMode: boolean;
}

export interface StoredAppState {
  version: 1;
  preferences: UserPreferences;
  personalBests: Partial<Record<GameId, number>>;
  sessions: Partial<Record<GameId, SessionRecord[]>>;
}

export type GameShellPhase =
  | 'intro'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'result';
