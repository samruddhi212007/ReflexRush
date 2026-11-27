import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  Pause,
  Play,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { soundEngine } from '../lib/audio';
import { formatPlayDuration } from '../lib/scoring';
import type { GameDefinition, GameShellPhase } from '../types/game';

export interface GameResultPayload {
  score: number;
  durationMs: number;
  extraStats?: Array<{ label: string; value: string }>;
  meta?: Record<string, number | string>;
}

export interface GameShellRenderContext {
  phase: GameShellPhase;
  elapsedMs: number;
  colorblindMode: boolean;
  completeRun: (payload: GameResultPayload) => void;
}

interface GameShellProps {
  game: GameDefinition;
  hudScore: string;
  hudTimer?: string;
  hudSecondary?: string;
  announcement?: string;
  onStartRun: () => void;
  onResetRun: () => void;
  onPauseChange?: (paused: boolean) => void;
  children: (ctx: GameShellRenderContext) => React.ReactNode;
}

interface FrozenResult extends GameResultPayload {
  isNewBest: boolean;
  personalBest: number;
}

export function GameShell({
  game,
  hudScore,
  hudTimer,
  hudSecondary,
  announcement,
  onStartRun,
  onResetRun,
  onPauseChange,
  children,
}: GameShellProps) {
  const { state, recordGameSession, toggleColorblindMode } = useAppState();
  const { colorblindMode } = state.preferences;
  const isDark = state.preferences.theme === 'dark';
  const accentLabelColor = isDark ? game.accentLabelDark : game.accentLabelLight;

  const [searchParams] = useSearchParams();
  const autostart = searchParams.get('autostart') === '1';

  const [phase, setPhase] = useState<GameShellPhase>(() =>
    autostart && game.implemented ? 'playing' : 'intro',
  );
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [pauseReason, setPauseReason] = useState<'user' | 'focus-lost'>('user');
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [frozenResult, setFrozenResult] = useState<FrozenResult | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>('');

  const playAccumulatedMsRef = useRef<number>(0);
  const playSegmentStartRef = useRef<number | null>(null);
  const autostartTriggeredRef = useRef<boolean>(false);

  const personalBest = state.personalBests[game.id];

  // Mirror state to document.body.dataset.state for accessibility & automated checks
  useEffect(() => {
    const mapped =
      phase === 'intro'
        ? 'title'
        : phase === 'result'
          ? 'gameover'
          : phase;
    document.body.dataset.state = mapped;
    return () => {
      delete document.body.dataset.state;
    };
  }, [phase]);

  useEffect(() => {
    if (announcement) {
      setLiveMessage(announcement);
    }
  }, [announcement]);

  // Trigger onStartRun once if ?autostart=1
  useEffect(() => {
    if (autostart && game.implemented && !autostartTriggeredRef.current) {
      autostartTriggeredRef.current = true;
      playAccumulatedMsRef.current = 0;
      playSegmentStartRef.current = performance.now();
      onStartRun();
    }
  }, [autostart, game.implemented, onStartRun]);

  // Track active play elapsed clock
  useEffect(() => {
    if (phase !== 'playing') {
      if (playSegmentStartRef.current !== null) {
        playAccumulatedMsRef.current +=
          performance.now() - playSegmentStartRef.current;
        playSegmentStartRef.current = null;
      }
      return;
    }

    playSegmentStartRef.current = performance.now();
    const interval = window.setInterval(() => {
      if (playSegmentStartRef.current !== null) {
        setElapsedMs(
          playAccumulatedMsRef.current +
            (performance.now() - playSegmentStartRef.current),
        );
      }
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [phase]);

  // 3-2-1 Countdown sequence
  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdownValue(3);
    soundEngine.playCountdownTick(false);
    setLiveMessage('Starting in 3');

    const t1 = window.setTimeout(() => {
      setCountdownValue(2);
      soundEngine.playCountdownTick(false);
      setLiveMessage('2');
    }, 750);

    const t2 = window.setTimeout(() => {
      setCountdownValue(1);
      soundEngine.playCountdownTick(true);
      setLiveMessage('1');
    }, 1500);

    const t3 = window.setTimeout(() => {
      playAccumulatedMsRef.current = 0;
      setElapsedMs(0);
      setPhase('playing');
      setLiveMessage('Go! Session started.');
      onStartRun();
    }, 2250);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [phase, onStartRun]);

  const startWithCountdown = useCallback(() => {
    if (!game.implemented) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setFrozenResult(null);
    playAccumulatedMsRef.current = 0;
    setElapsedMs(0);
    onResetRun();
    setPhase('countdown');
  }, [game.implemented, onResetRun]);

  const handlePause = useCallback(
    (reason: 'user' | 'focus-lost' = 'user') => {
      setPhase((curr) => {
        if (curr === 'playing' || curr === 'countdown') {
          setPauseReason(reason);
          onPauseChange?.(true);
          setLiveMessage(
            reason === 'focus-lost'
              ? 'Game paused because tab lost focus.'
              : 'Game paused.',
          );
          return 'paused';
        }
        return curr;
      });
    },
    [onPauseChange],
  );

  const handleResume = useCallback(() => {
    setPhase((curr) => {
      if (curr !== 'paused') return curr;
      onPauseChange?.(false);
      setLiveMessage('Game resumed.');
      return 'playing';
    });
  }, [onPauseChange]);

  const completeRun = useCallback(
    (payload: GameResultPayload) => {
      const totalMs =
        payload.durationMs > 0
          ? payload.durationMs
          : playAccumulatedMsRef.current +
            (playSegmentStartRef.current !== null
              ? performance.now() - playSegmentStartRef.current
              : 0);

      const { isNewBest } = recordGameSession(
        game.id,
        payload.score,
        totalMs,
        payload.meta,
      );

      if (isNewBest) {
        soundEngine.playNewBest();
      } else {
        soundEngine.playSuccess();
      }

      const nextBest =
        personalBest === undefined
          ? payload.score
          : game.scoreType === 'lower-better'
            ? Math.min(personalBest, payload.score)
            : Math.max(personalBest, payload.score);

      setFrozenResult({
        ...payload,
        durationMs: totalMs,
        isNewBest,
        personalBest: nextBest,
      });
      setPhase('result');
      setLiveMessage(
        `Session complete. Score: ${game.format(payload.score)}.${
          isNewBest ? ' New personal best!' : ''
        }`,
      );
    },
    [game, personalBest, recordGameSession],
  );

  // Pause when tab loses focus or visibility changes
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && (phase === 'playing' || phase === 'countdown')) {
        handlePause('focus-lost');
      }
    };
    const onWindowBlur = () => {
      if (phase === 'playing' || phase === 'countdown') {
        handlePause('focus-lost');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [phase, handlePause]);

  // Global keyboard shortcuts for Intro, Pause, and Result
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (phase === 'intro' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startWithCountdown();
        return;
      }

      if (phase === 'playing' && (e.key === 'Escape' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        handlePause('user');
        return;
      }

      if (phase === 'paused' && (e.key === 'Escape' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        handleResume();
        return;
      }

      if (phase === 'result' && e.key === 'Enter') {
        e.preventDefault();
        startWithCountdown();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, startWithCountdown, handlePause, handleResume]);

  const displayTimer = hudTimer ?? formatPlayDuration(elapsedMs);

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
      {/* Screen-reader live state announcer */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>

      {/* Top Breadcrumb + Utility Strip */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/games"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--rr-text-muted)] hover:text-[var(--rr-text)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Games</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-medium">
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
      </div>

      {/* Main Arena Surface */}
      <section
        aria-label={`${game.title} Arena`}
        className="relative overflow-hidden rounded-2xl border border-[var(--rr-border)] bg-[var(--rr-surface)] shadow-lg"
      >
        {/* Playing HUD Bar */}
        {(phase === 'playing' || phase === 'paused' || phase === 'countdown') && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--rr-border)] bg-[var(--rr-trough)] px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: game.accent }}
                aria-hidden="true"
              />
              <h1 className="font-display text-lg font-bold text-[var(--rr-text)]">
                {game.title}
              </h1>
              {hudSecondary && (
                <span className="font-mono-tabular text-xs font-medium text-[var(--rr-text-muted)]">
                  · {hudSecondary}
                </span>
              )}
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right">
                <div className="text-[11px] font-medium text-[var(--rr-text-muted)]">
                  Timer
                </div>
                <div
                  data-testid="hud-timer"
                  className="font-mono-tabular text-base font-bold text-[var(--rr-text)]"
                >
                  {displayTimer}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-medium text-[var(--rr-text-muted)]">
                  Score
                </div>
                <div
                  data-testid="hud-score"
                  className="font-mono-tabular text-base font-bold"
                  style={{ color: accentLabelColor }}
                >
                  {hudScore}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePause('user')}
                aria-label="Pause game"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--rr-border)] bg-[var(--rr-surface)] text-[var(--rr-text)] hover:border-[var(--rr-border-strong)] transition-colors cursor-pointer"
              >
                <Pause className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Stage Content */}
        <div className="relative min-h-[460px] sm:min-h-[500px] flex flex-col">
          {phase === 'intro' && (
            <div className="flex flex-1 flex-col justify-between p-6 sm:p-10">
              <div className="max-w-2xl">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium">
                  <span
                    className="font-mono-tabular font-semibold"
                    style={{ color: accentLabelColor }}
                  >
                    {game.category}
                  </span>
                  <span aria-hidden="true" className="text-[var(--rr-text-muted)]">
                    ·
                  </span>
                  <span className="text-[var(--rr-text-muted)]">
                    {game.difficulty}
                  </span>
                  <span aria-hidden="true" className="text-[var(--rr-text-muted)]">
                    ·
                  </span>
                  <span className="font-mono-tabular text-[var(--rr-text-muted)]">
                    {game.duration}
                  </span>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--rr-text)] mb-3">
                  {game.title}
                </h1>
                <p className="text-base leading-relaxed text-[var(--rr-text-muted)] mb-6">
                  {game.description}
                </p>

                <div className="mb-6 space-y-2.5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--rr-text-muted)]">
                    How to play
                  </h2>
                  <ol className="space-y-2 text-sm text-[var(--rr-text)]">
                    {game.howTo.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono-tabular text-xs font-bold"
                          style={{
                            backgroundColor: `${game.accent}22`,
                            color: accentLabelColor,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {game.photosensitivityNotice && (
                  <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                    <AlertTriangle
                      className="h-4 w-4 shrink-0 mt-0.5 text-amber-500"
                      aria-hidden="true"
                    />
                    <div>
                      <strong className="font-semibold">
                        Photosensitivity Notice:{' '}
                      </strong>
                      {game.photosensitivityNotice}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[var(--rr-border)] pt-6">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <div className="text-xs font-medium text-[var(--rr-text-muted)]">
                      Personal Best
                    </div>
                    <div className="font-mono-tabular text-xl font-bold text-[var(--rr-text)]">
                      {personalBest !== undefined
                        ? game.format(personalBest)
                        : '—'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={toggleColorblindMode}
                    role="switch"
                    aria-checked={colorblindMode}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--rr-border)] bg-[var(--rr-trough)] px-3 py-2 text-xs font-medium text-[var(--rr-text)] hover:border-[var(--rr-border-strong)] transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-[var(--rr-text-muted)]" aria-hidden="true" />
                    <span>Colorblind cues: {colorblindMode ? 'On' : 'Off'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {game.implemented ? (
                    <button
                      type="button"
                      data-start="true"
                      onClick={startWithCountdown}
                      style={{
                        backgroundColor: game.accent,
                        color: game.accentOnFill,
                      }}
                      className="pill-cta inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-sm font-bold whitespace-nowrap cursor-pointer shadow-md"
                    >
                      <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                      <span>Start Game</span>
                    </button>
                  ) : (
                    <Link
                      to="/games"
                      className="inline-flex items-center justify-center rounded-full border border-[var(--rr-border-strong)] bg-[var(--rr-trough)] px-6 py-3 text-sm font-semibold text-[var(--rr-text)] hover:bg-[var(--rr-surface-hover)] transition-colors"
                    >
                      Available in next build step
                    </Link>
                  )}
                </div>
              </div>

              <p className="mt-4 text-xs text-[var(--rr-text-muted)]">
                {game.controlsHint}
              </p>
            </div>
          )}

          {phase !== 'intro' && (
            <div className="relative flex flex-1 flex-col">
              {children({
                phase,
                elapsedMs,
                colorblindMode,
                completeRun,
              })}

              {/* 3-2-1 Countdown Overlay */}
              {phase === 'countdown' && (
                <div
                  role="status"
                  aria-label={`Starting in ${countdownValue}`}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--rr-surface)]/95 p-6 text-center"
                >
                  <div className="text-xs font-semibold uppercase tracking-widest text-[var(--rr-text-muted)] mb-2">
                    Get Ready
                  </div>
                  <div
                    className="font-mono-tabular text-7xl font-extrabold"
                    style={{ color: accentLabelColor }}
                  >
                    {countdownValue}
                  </div>
                  <p className="mt-3 text-sm text-[var(--rr-text-muted)]">
                    Keep your pointer ready on the arena
                  </p>
                </div>
              )}

              {/* Pause Modal Overlay */}
              {phase === 'paused' && (
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Game Paused"
                  className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
                >
                  <div className="w-full max-w-sm rounded-2xl border border-[var(--rr-border-strong)] bg-[var(--rr-surface)] p-6 text-center shadow-2xl">
                    <h2 className="font-display text-2xl font-bold text-[var(--rr-text)] mb-1.5">
                      Session Paused
                    </h2>
                    <p className="text-sm text-[var(--rr-text-muted)] mb-6">
                      {pauseReason === 'focus-lost'
                        ? 'Paused automatically because the window lost focus.'
                        : 'Take a breather, then jump straight back in.'}
                    </p>
                    <div className="flex flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={handleResume}
                        style={{
                          backgroundColor: game.accent,
                          color: game.accentOnFill,
                        }}
                        className="pill-cta w-full rounded-full px-6 py-3 text-sm font-bold cursor-pointer"
                      >
                        Resume
                      </button>
                      <button
                        type="button"
                        onClick={startWithCountdown}
                        className="w-full rounded-full border border-[var(--rr-border-strong)] bg-[var(--rr-trough)] px-6 py-2.5 text-sm font-semibold text-[var(--rr-text)] hover:bg-[var(--rr-surface-hover)] transition-colors cursor-pointer"
                      >
                        Restart
                      </button>
                      <Link
                        to="/games"
                        className="w-full rounded-full px-6 py-2.5 text-sm font-medium text-[var(--rr-text-muted)] hover:text-[var(--rr-text)] transition-colors"
                      >
                        Back to games
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Result Modal Overlay */}
              {phase === 'result' && frozenResult && (
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${game.title} Results`}
                  className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-4"
                >
                  <div className="w-full max-w-md rounded-2xl border border-[var(--rr-border-strong)] bg-[var(--rr-surface)] p-6 sm:p-7 shadow-2xl">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="text-xs font-medium text-[var(--rr-text-muted)]">
                          {game.title} · Complete
                        </div>
                        <h2 className="font-display text-2xl font-bold text-[var(--rr-text)] mt-0.5">
                          Session Summary
                        </h2>
                      </div>

                      {frozenResult.isNewBest && (
                        <span
                          data-testid="new-best-badge"
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap"
                          style={{
                            backgroundColor: `${game.accent}24`,
                            color: accentLabelColor,
                          }}
                        >
                          <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>New best!</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="rounded-xl border border-[var(--rr-border)] bg-[var(--rr-trough)] p-4">
                        <div className="text-xs font-medium text-[var(--rr-text-muted)]">
                          Your Score
                        </div>
                        <div
                          data-testid="result-score"
                          className="font-mono-tabular text-2xl font-extrabold mt-1"
                          style={{ color: accentLabelColor }}
                        >
                          {game.format(frozenResult.score)}
                        </div>
                      </div>

                      <div className="rounded-xl border border-[var(--rr-border)] bg-[var(--rr-trough)] p-4">
                        <div className="text-xs font-medium text-[var(--rr-text-muted)]">
                          Personal Best
                        </div>
                        <div
                          data-testid="result-best"
                          className="font-mono-tabular text-2xl font-extrabold text-[var(--rr-text)] mt-1"
                        >
                          {game.format(frozenResult.personalBest)}
                        </div>
                      </div>
                    </div>

                    {frozenResult.extraStats && frozenResult.extraStats.length > 0 && (
                      <div className="mb-6 divide-y divide-[var(--rr-border)] rounded-xl border border-[var(--rr-border)] bg-[var(--rr-trough)] px-4">
                        {frozenResult.extraStats.map((stat) => (
                          <div
                            key={stat.label}
                            className="flex items-center justify-between py-2.5 text-sm"
                          >
                            <span className="text-[var(--rr-text-muted)]">
                              {stat.label}
                            </span>
                            <span className="font-mono-tabular font-semibold text-[var(--rr-text)]">
                              {stat.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        data-start="true"
                        onClick={startWithCountdown}
                        style={{
                          backgroundColor: game.accent,
                          color: game.accentOnFill,
                        }}
                        className="pill-cta flex-1 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold cursor-pointer"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        <span>Play again</span>
                      </button>

                      <Link
                        to="/games"
                        className="flex-1 inline-flex items-center justify-center rounded-full border border-[var(--rr-border-strong)] bg-[var(--rr-trough)] px-6 py-3 text-sm font-semibold text-[var(--rr-text)] hover:bg-[var(--rr-surface-hover)] transition-colors"
                      >
                        Back to games
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
