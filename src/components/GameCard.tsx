import type React from 'react';
import { Link } from 'react-router-dom';
import { GamePreviewArt } from './GamePreviewArt';
import { useAppState } from '../hooks/useAppState';
import type { GameDefinition } from '../types/game';

interface GameCardProps {
  game: GameDefinition;
  personalBest?: number;
}

export function GameCard({ game, personalBest }: GameCardProps) {
  const { state } = useAppState();
  const isDark = state.preferences.theme === 'dark';
  const accentLabelColor = isDark ? game.accentLabelDark : game.accentLabelLight;

  const hasBest = personalBest !== undefined && Number.isFinite(personalBest);

  return (
    <article
      style={{ '--card-accent': game.accent } as React.CSSProperties}
      className="game-card group flex flex-col justify-between rounded-2xl p-6"
    >
      <div>
        {/* Preview Art Frame (r_inner = 16px - 8px = 12px) */}
        <div className="mb-5 h-36 w-full overflow-hidden rounded-xl border border-[var(--rr-border)] bg-[var(--rr-trough)] text-[var(--rr-text)]">
          <GamePreviewArt gameId={game.id} accent={game.accent} />
        </div>

        {/* Clean Unboxed Metadata Line: Category · Difficulty · Duration */}
        <div className="mb-2 flex items-center gap-2 text-xs font-medium">
          <span
            className="font-mono-tabular font-semibold"
            style={{ color: accentLabelColor }}
          >
            {game.category}
          </span>
          <span aria-hidden="true" className="text-[var(--rr-text-muted)]">
            ·
          </span>
          <span className="text-[var(--rr-text-muted)]">{game.difficulty}</span>
          <span aria-hidden="true" className="text-[var(--rr-text-muted)]">
            ·
          </span>
          <span className="font-mono-tabular text-[var(--rr-text-muted)]">
            {game.duration}
          </span>
        </div>

        <h2 className="font-display text-xl font-bold tracking-tight text-[var(--rr-text)] mb-2">
          {game.title}
        </h2>

        <p className="text-sm leading-relaxed text-[var(--rr-text-muted)] line-clamp-2">
          {game.description}
        </p>
      </div>

      {/* Bottom Metric + Primary Action */}
      <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--rr-border)] pt-4">
        <div className="min-w-0">
          <div className="text-xs font-medium text-[var(--rr-text-muted)]">
            Personal Best
          </div>
          <div
            data-testid={`best-${game.id}`}
            className="font-mono-tabular text-base font-bold text-[var(--rr-text)] truncate"
          >
            {hasBest ? game.format(personalBest) : '—'}
          </div>
        </div>

        <Link
          to={`/play/${game.id}`}
          style={{
            backgroundColor: game.accent,
            color: game.accentOnFill,
          }}
          className="pill-cta inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold whitespace-nowrap shrink-0 shadow-sm"
        >
          Play →
        </Link>
      </div>
    </article>
  );
}
