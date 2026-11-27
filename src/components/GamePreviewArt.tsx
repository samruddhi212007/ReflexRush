import type { GameId } from '../types/game';

interface GamePreviewArtProps {
  gameId: GameId;
  accent: string;
}

export function GamePreviewArt({ gameId, accent }: GamePreviewArtProps) {
  switch (gameId) {
    case 'color-snap':
      return (
        <svg
          viewBox="0 0 320 140"
          className="h-full w-full game-card-art"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="snap-glow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="320" height="140" fill="url(#snap-glow)" />
          <rect
            x="44"
            y="26"
            width="104"
            height="88"
            rx="14"
            fill="#EF4444"
            fillOpacity="0.18"
            stroke="#EF4444"
            strokeOpacity="0.6"
            strokeWidth="1.5"
          />
          <rect
            x="172"
            y="26"
            width="104"
            height="88"
            rx="14"
            fill={accent}
            fillOpacity="0.24"
            stroke={accent}
            strokeWidth="2"
          />
          <path
            d="M148 70h24m-6-6 6 6-6 6"
            stroke={accent}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M227 52l-12 18h10l-3 18 14-20h-10l1-16z"
            fill={accent}
          />
        </svg>
      );

    case 'sequence-recall':
      return (
        <svg
          viewBox="0 0 320 140"
          className="h-full w-full game-card-art"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="seq-glow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="320" height="140" fill="url(#seq-glow)" />
          <rect
            x="104"
            y="18"
            width="50"
            height="46"
            rx="10"
            fill={accent}
            fillOpacity="0.85"
          />
          <rect
            x="166"
            y="18"
            width="50"
            height="46"
            rx="10"
            fill="#2DD4BF"
            fillOpacity="0.25"
            stroke="#2DD4BF"
            strokeOpacity="0.6"
            strokeWidth="1.5"
          />
          <rect
            x="104"
            y="76"
            width="50"
            height="46"
            rx="10"
            fill="#84CC16"
            fillOpacity="0.25"
            stroke="#84CC16"
            strokeOpacity="0.6"
            strokeWidth="1.5"
          />
          <rect
            x="166"
            y="76"
            width="50"
            height="46"
            rx="10"
            fill="#FB7185"
            fillOpacity="0.45"
            stroke="#FB7185"
            strokeWidth="1.5"
          />
          <path
            d="M129 41l62 58"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.75"
            strokeDasharray="4 4"
          />
        </svg>
      );

    case 'grid-genius':
      return (
        <svg
          viewBox="0 0 320 140"
          className="h-full w-full game-card-art"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="grid-glow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.24" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="320" height="140" fill="url(#grid-glow)" />
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3].map((col) => {
              const active =
                (row === 0 && col === 1) ||
                (row === 1 && col === 2) ||
                (row === 2 && col === 0) ||
                (row === 2 && col === 3) ||
                (row === 3 && col === 1);
              return (
                <rect
                  key={`${row}-${col}`}
                  x={106 + col * 28}
                  y={16 + row * 28}
                  width="22"
                  height="22"
                  rx="5"
                  fill={active ? accent : 'currentColor'}
                  fillOpacity={active ? 0.9 : 0.08}
                  stroke={active ? accent : 'currentColor'}
                  strokeOpacity={active ? 1 : 0.16}
                  strokeWidth="1"
                />
              );
            }),
          )}
        </svg>
      );

    case 'color-clash':
      return (
        <svg
          viewBox="0 0 320 140"
          className="h-full w-full game-card-art"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="clash-glow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="320" height="140" fill="url(#clash-glow)" />
          <text
            x="160"
            y="62"
            textAnchor="middle"
            fill="#38BDF8"
            fontFamily="Bricolage Grotesque, sans-serif"
            fontWeight="800"
            fontSize="32"
            letterSpacing="-1"
          >
            CRIMSON
          </text>
          <rect x="64" y="88" width="42" height="22" rx="11" fill="#FB7185" />
          <rect x="114" y="88" width="42" height="22" rx="11" fill="#38BDF8" stroke="currentColor" strokeOpacity="0.65" strokeWidth="1.5" />
          <rect x="164" y="88" width="42" height="22" rx="11" fill="#A3E635" />
          <rect x="214" y="88" width="42" height="22" rx="11" fill="#FBBF24" />
        </svg>
      );

    case 'quick-tap':
      return (
        <svg
          viewBox="0 0 320 140"
          className="h-full w-full game-card-art"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="tap-glow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="320" height="140" fill="url(#tap-glow)" />
          <circle
            cx="116"
            cy="72"
            r="34"
            fill="none"
            stroke={accent}
            strokeOpacity="0.35"
            strokeWidth="2"
          />
          <circle
            cx="116"
            cy="72"
            r="22"
            fill="none"
            stroke={accent}
            strokeOpacity="0.7"
            strokeWidth="2"
          />
          <circle cx="116" cy="72" r="10" fill={accent} />
          <circle
            cx="214"
            cy="52"
            r="20"
            fill="none"
            stroke="#FDE047"
            strokeOpacity="0.55"
            strokeWidth="1.75"
            strokeDasharray="4 3"
          />
          <circle cx="214" cy="52" r="9" fill="#FDE047" />
          <circle cx="192" cy="100" r="6" fill={accent} fillOpacity="0.65" />
        </svg>
      );

    case 'focus-frenzy':
      return (
        <svg
          viewBox="0 0 320 140"
          className="h-full w-full game-card-art"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="frenzy-glow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.26" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="320" height="140" fill="url(#frenzy-glow)" />
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3, 4].map((col) => {
              const isOutlier = row === 1 && col === 3;
              const cx = 84 + col * 38;
              const cy = 34 + row * 36;
              return isOutlier ? (
                <polygon
                  key={`${row}-${col}`}
                  points={`${cx},${cy - 12} ${cx + 12},${cy} ${cx},${cy + 12} ${cx - 12},${cy}`}
                  fill={accent}
                />
              ) : (
                <circle
                  key={`${row}-${col}`}
                  cx={cx}
                  cy={cy}
                  r="10"
                  fill={accent}
                  fillOpacity="0.35"
                />
              );
            }),
          )}
        </svg>
      );
  }
}
