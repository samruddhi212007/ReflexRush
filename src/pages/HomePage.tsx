import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Zap } from 'lucide-react';
import { GamePreviewArt } from '../components/GamePreviewArt';
import { useAppState } from '../hooks/useAppState';
import { GAME_REGISTRY } from '../lib/registry';
import { computeOverallStats, formatPlayDuration } from '../lib/scoring';

export function HomePage() {
  const { state } = useAppState();
  const isDark = state.preferences.theme === 'dark';
  const [spotlightIndex, setSpotlightIndex] = useState<number>(0);

  const summary = useMemo(
    () => computeOverallStats(state.sessions, state.personalBests, GAME_REGISTRY),
    [state.sessions, state.personalBests],
  );

  const spotlight = GAME_REGISTRY[spotlightIndex] ?? GAME_REGISTRY[0];
  const spotlightBest = state.personalBests[spotlight.id];
  const spotlightLabel = isDark
    ? spotlight.accentLabelDark
    : spotlight.accentLabelLight;

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 sm:py-10 sm:px-6 lg:px-8 pb-24 md:pb-12">
      {/* Hero Split */}
      <section className="mb-10 rounded-2xl border border-[var(--rr-border)] bg-[var(--rr-surface)] p-6 sm:p-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-[#8B5CF6] dark:text-[#C4B5FD]">
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                <span>ReflexRush Cognitive Arena</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--rr-text)] text-balance leading-[1.1]">
                Train your reflexes at millisecond precision.
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--rr-text-muted)]">
                Six focused drills built to measure reaction latency, working memory, spatial recall, and selective focus—saved privately in your browser.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/games"
                  className="pill-cta inline-flex items-center gap-2 rounded-full bg-[#8B5CF6] px-7 py-3 text-sm font-bold text-white shadow-md whitespace-nowrap"
                >
                  <span>Start Training</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <Link
                  to="/stats"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--rr-border-strong)] bg-[var(--rr-trough)] px-6 py-3 text-sm font-semibold text-[var(--rr-text)] hover:bg-[var(--rr-surface-hover)] transition-colors whitespace-nowrap"
                >
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                  <span>View Statistics</span>
                </Link>
              </div>
            </div>

            {/* Compact Live Player Summary Strip */}
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[var(--rr-border)] pt-6">
              <div>
                <div className="text-xs font-medium text-[var(--rr-text-muted)]">
                  Sessions Played
                </div>
                <div className="font-mono-tabular mt-1 text-2xl font-bold text-[var(--rr-text)]">
                  {summary.totalPlays}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--rr-text-muted)]">
                  Training Time
                </div>
                <div className="font-mono-tabular mt-1 text-2xl font-bold text-[var(--rr-text)]">
                  {formatPlayDuration(summary.totalPlayTimeMs)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--rr-text-muted)]">
                  Top Category
                </div>
                <div className="font-display mt-1 text-xl sm:text-2xl font-bold text-[#8B5CF6] dark:text-[#C4B5FD] truncate">
                  {summary.bestCategory ?? '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Discipline Spotlight */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-[var(--rr-border)] bg-[var(--rr-trough)] p-5 sm:p-6">
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--rr-text-muted)]">
                  Discipline Spotlight
                </span>
                <div
                  role="tablist"
                  aria-label="Select spotlight discipline"
                  className="flex items-center gap-1"
                >
                  {GAME_REGISTRY.map((g, idx) => {
                    const active = idx === spotlightIndex;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-label={`Preview ${g.title}`}
                        onClick={() => setSpotlightIndex(idx)}
                        className="flex h-7 items-center px-1 cursor-pointer"
                      >
                        <span
                          style={{
                            backgroundColor: active ? g.accent : undefined,
                          }}
                          className={`h-2.5 rounded-full transition-all ${
                            active
                              ? 'w-6'
                              : 'w-2.5 bg-[var(--rr-border-strong)] hover:opacity-80'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4 h-40 w-full overflow-hidden rounded-xl border border-[var(--rr-border)] bg-[var(--rr-surface)] text-[var(--rr-text)]">
                <GamePreviewArt
                  gameId={spotlight.id}
                  accent={spotlight.accent}
                />
              </div>

              <div className="mb-1.5 flex items-center gap-2 text-xs font-medium">
                <span
                  className="font-mono-tabular font-semibold"
                  style={{ color: spotlightLabel }}
                >
                  {spotlight.category}
                </span>
                <span aria-hidden="true" className="text-[var(--rr-text-muted)]">
                  ·
                </span>
                <span className="text-[var(--rr-text-muted)]">
                  {spotlight.difficulty}
                </span>
                <span aria-hidden="true" className="text-[var(--rr-text-muted)]">
                  ·
                </span>
                <span className="font-mono-tabular text-[var(--rr-text-muted)]">
                  {spotlight.duration}
                </span>
              </div>

              <h2 className="font-display text-2xl font-bold text-[var(--rr-text)]">
                {spotlight.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--rr-text-muted)]">
                {spotlight.description}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-[var(--rr-border)] pt-4">
              <div>
                <div className="text-xs font-medium text-[var(--rr-text-muted)]">
                  Personal Best
                </div>
                <div className="font-mono-tabular text-base font-bold text-[var(--rr-text)]">
                  {spotlightBest !== undefined
                    ? spotlight.format(spotlightBest)
                    : '—'}
                </div>
              </div>

              <Link
                to={`/play/${spotlight.id}`}
                style={{
                  backgroundColor: spotlight.accent,
                  color: spotlight.accentOnFill,
                }}
                className="pill-cta inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold whitespace-nowrap"
              >
                Play →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Launch Row for All 6 Disciplines */}
      <section aria-label="All Disciplines Quick Launch">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-[var(--rr-text)]">
            All Six Disciplines
          </h2>
          <Link
            to="/games"
            className="text-sm font-semibold text-[#8B5CF6] dark:text-[#C4B5FD] hover:underline whitespace-nowrap"
          >
            Browse full gallery →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAME_REGISTRY.map((game) => {
            const best = state.personalBests[game.id];
            const accentText = isDark
              ? game.accentLabelDark
              : game.accentLabelLight;

            return (
              <Link
                key={game.id}
                to={`/play/${game.id}`}
                style={{ '--card-accent': game.accent } as React.CSSProperties}
                className="game-card flex items-center justify-between gap-4 rounded-2xl p-5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: game.accent }}
                      aria-hidden="true"
                    />
                    <span style={{ color: accentText }}>{game.category}</span>
                    <span aria-hidden="true" className="text-[var(--rr-text-muted)]">
                      ·
                    </span>
                    <span className="text-[var(--rr-text-muted)]">
                      {game.duration}
                    </span>
                  </div>
                  <div className="font-display mt-1 text-lg font-bold text-[var(--rr-text)] truncate">
                    {game.title}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-medium text-[var(--rr-text-muted)]">
                    Best
                  </div>
                  <div className="font-mono-tabular text-sm font-bold text-[var(--rr-text)]">
                    {best !== undefined ? game.format(best) : '—'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
