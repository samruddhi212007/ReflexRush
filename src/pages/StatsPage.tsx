import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { GAME_BY_ID, GAME_REGISTRY } from '../lib/registry';
import { computeOverallStats, formatPlayDuration } from '../lib/scoring';
import type { GameId } from '../types/game';

export function StatsPage() {
  const { state } = useAppState();
  const isDark = state.preferences.theme === 'dark';

  const [selectedGameId, setSelectedGameId] = useState<GameId>('color-snap');

  const summary = useMemo(
    () => computeOverallStats(state.sessions, state.personalBests, GAME_REGISTRY),
    [state.sessions, state.personalBests],
  );

  const selectedGame = GAME_BY_ID[selectedGameId];
  const selectedSessions = state.sessions[selectedGameId] ?? [];

  const lineChartData = useMemo(() => {
    return selectedSessions.map((session, idx) => {
      const date = new Date(session.timestamp);
      const label = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      return {
        index: idx + 1,
        label: `#${idx + 1} · ${label}`,
        shortLabel: `#${idx + 1}`,
        score: session.score,
      };
    });
  }, [selectedSessions]);

  const gridStroke = isDark ? '#1F2430' : '#E2E8F0';
  const tickColor = isDark ? '#8E9BB5' : '#64748B';
  const tooltipBg = isDark ? '#1A1F2C' : '#FFFFFF';
  const tooltipBorder = isDark ? '#2D3546' : '#E2E8F0';
  const tooltipText = isDark ? '#FFFFFF' : '#0F172A';

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-12">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--rr-text)]">
            Performance Statistics
          </h1>
          <p className="mt-2 text-base text-[var(--rr-text-muted)]">
            Session history, category balance, and personal records saved locally for{' '}
            <span className="font-semibold text-[var(--rr-text)]">
              {state.preferences.playerName}
            </span>
            .
          </p>
        </div>

        <Link
          to="/games"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--rr-border-strong)] bg-[var(--rr-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--rr-text)] hover:bg-[var(--rr-surface-hover)] transition-colors self-start sm:self-auto whitespace-nowrap"
        >
          <span>Play a Drill</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Overall KPI Tiles */}
      <section
        aria-label="Overall Metrics"
        className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <div className="rounded-2xl border border-[var(--rr-border)] bg-[var(--rr-surface)] p-5">
          <div className="text-xs font-medium text-[var(--rr-text-muted)]">
            Total Plays
          </div>
          <div
            data-testid="stat-total-plays"
            className="font-mono-tabular mt-2 text-3xl font-bold text-[var(--rr-text)]"
          >
            {summary.totalPlays}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--rr-border)] bg-[var(--rr-surface)] p-5">
          <div className="text-xs font-medium text-[var(--rr-text-muted)]">
            Total Play Time
          </div>
          <div
            data-testid="stat-total-time"
            className="font-mono-tabular mt-2 text-3xl font-bold text-[var(--rr-text)]"
          >
            {formatPlayDuration(summary.totalPlayTimeMs)}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--rr-border)] bg-[var(--rr-surface)] p-5">
          <div className="text-xs font-medium text-[var(--rr-text-muted)]">
            Daily Streak
          </div>
          <div
            data-testid="stat-daily-streak"
            className="font-mono-tabular mt-2 text-3xl font-bold text-[var(--rr-text)]"
          >
            {summary.dailyStreak}{' '}
            <span className="text-sm font-medium text-[var(--rr-text-muted)]">
              {summary.dailyStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--rr-border)] bg-[var(--rr-surface)] p-5">
          <div className="text-xs font-medium text-[var(--rr-text-muted)]">
            Best Category
          </div>
          <div
            data-testid="stat-best-category"
            className="font-display mt-2 text-2xl sm:text-3xl font-bold text-[#8B5CF6] dark:text-[#C4B5FD] truncate"
          >
            {summary.bestCategory ?? '—'}
          </div>
        </div>
      </section>

      {/* Radar Chart + Per-Game Personal Bests */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 6-Category Radar Chart */}
        <section className="lg:col-span-6 rounded-2xl border border-[var(--rr-border)] bg-[var(--rr-surface)] p-6 flex flex-col">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold text-[var(--rr-text)]">
                Cognitive Profile
              </h2>
              <p className="text-xs text-[var(--rr-text-muted)] mt-0.5">
                Normalized 0–100 score across all six disciplines
              </p>
            </div>
          </div>

          <div className="relative h-72 sm:h-80 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="72%"
                data={summary.radarData}
              >
                <PolarGrid stroke={gridStroke} />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: tickColor, fontSize: 12, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: tickColor, fontSize: 10 }}
                  axisLine={false}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  fill="#8B5CF6"
                  fillOpacity={0.32}
                  isAnimationActive={false}
                  dot={{ r: 4.5, fill: '#A78BFA', stroke: '#8B5CF6', strokeWidth: 1.5 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '12px',
                    color: tooltipText,
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${value ?? 0} / 100`, 'Index']}
                />
              </RadarChart>
            </ResponsiveContainer>

            {summary.totalPlays === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-xl border border-[var(--rr-border)] bg-[var(--rr-surface)]/90 px-4 py-2.5 text-center shadow-sm">
                  <p className="text-xs font-medium text-[var(--rr-text-muted)]">
                    Complete a game to populate your radar profile
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Per-Game Personal Bests List */}
        <section className="lg:col-span-6 rounded-2xl border border-[var(--rr-border)] bg-[var(--rr-surface)] p-6">
          <div className="mb-4">
            <h2 className="font-display text-xl font-bold text-[var(--rr-text)]">
              Personal Bests
            </h2>
            <p className="text-xs text-[var(--rr-text-muted)] mt-0.5">
              Top recorded mark for every discipline
            </p>
          </div>

          <div className="divide-y divide-[var(--rr-border)]">
            {GAME_REGISTRY.map((game) => {
              const best = state.personalBests[game.id];
              const count = state.sessions[game.id]?.length ?? 0;
              const accentText = isDark
                ? game.accentLabelDark
                : game.accentLabelLight;

              return (
                <div
                  key={game.id}
                  className="flex items-center justify-between gap-4 py-3.5 first:pt-1 last:pb-1"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: game.accent }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/play/${game.id}`}
                          className="font-display text-sm font-bold text-[var(--rr-text)] hover:underline truncate"
                        >
                          {game.title}
                        </Link>
                        <span
                          className="text-xs font-medium"
                          style={{ color: accentText }}
                        >
                          {game.category}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--rr-text-muted)]">
                        {count} {count === 1 ? 'session' : 'sessions'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {best !== undefined ? (
                      <div className="font-mono-tabular text-base font-bold text-[var(--rr-text)]">
                        {game.format(best)}
                      </div>
                    ) : (
                      <Link
                        to={`/play/${game.id}`}
                        className="text-xs font-semibold text-[var(--rr-text-muted)] hover:text-[var(--rr-text)]"
                      >
                        Not played →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Recent Scores Line Chart with Game Filter */}
      <section className="rounded-2xl border border-[var(--rr-border)] bg-[var(--rr-surface)] p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--rr-text)]">
              Recent Score Trend
            </h2>
            <p className="text-xs text-[var(--rr-text-muted)] mt-0.5">
              Up to last 50 recorded runs · {selectedGame.unitLabel}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <label
              htmlFor="stats-game-filter"
              className="text-xs font-medium text-[var(--rr-text-muted)] whitespace-nowrap"
            >
              Discipline:
            </label>
            <select
              id="stats-game-filter"
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value as GameId)}
              className="rounded-xl border border-[var(--rr-border)] bg-[var(--rr-trough)] px-3.5 py-2 text-sm font-medium text-[var(--rr-text)] focus:border-[#8B5CF6] focus:outline-none cursor-pointer"
            >
              {GAME_REGISTRY.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {lineChartData.length === 0 ? (
          <div
            data-testid="line-chart-empty"
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--rr-border-strong)] bg-[var(--rr-trough)] py-14 px-6 text-center"
          >
            <BarChart3
              className="h-9 w-9 text-[var(--rr-text-muted)] mb-3"
              aria-hidden="true"
            />
            <h3 className="font-display text-lg font-bold text-[var(--rr-text)]">
              No runs recorded for {selectedGame.title} yet
            </h3>
            <p className="mt-1 max-w-md text-sm text-[var(--rr-text-muted)]">
              Play a session of {selectedGame.title} to start tracking your progression curve and personal bests.
            </p>
            <Link
              to={`/play/${selectedGame.id}`}
              style={{
                backgroundColor: selectedGame.accent,
                color: selectedGame.accentOnFill,
              }}
              className="pill-cta mt-5 inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold"
            >
              Play {selectedGame.title} →
            </Link>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineChartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fill: tickColor, fontSize: 11 }}
                  stroke={gridStroke}
                />
                <YAxis
                  tick={{ fill: tickColor, fontSize: 11 }}
                  stroke={gridStroke}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '12px',
                    color: tooltipText,
                    fontSize: '12px',
                  }}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.label ?? ''
                  }
                  formatter={(value) => [
                    selectedGame.format(Number(value ?? 0)),
                    selectedGame.title,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={selectedGame.accent}
                  strokeWidth={2.5}
                  isAnimationActive={false}
                  dot={{ r: 4, fill: selectedGame.accent, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </main>
  );
}
