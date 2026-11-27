import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Hand, Zap } from 'lucide-react';
import { GameShell, type GameResultPayload } from '../../components/GameShell';
import { soundEngine } from '../../lib/audio';
import { randomBetween } from '../../lib/rng';
import { computeAverageReactionTime } from '../../lib/scoring';
import type { GameDefinition } from '../../types/game';
import {
  COLOR_SNAP_MAX_DELAY_MS,
  COLOR_SNAP_MIN_DELAY_MS,
  COLOR_SNAP_ROUNDS,
  type ColorSnapRoundPhase,
  evaluateColorSnapTap,
} from './logic';

interface ColorSnapGameProps {
  game: GameDefinition;
}

export function ColorSnapGame({ game }: ColorSnapGameProps) {
  const [roundPhase, setRoundPhase] = useState<ColorSnapRoundPhase>('waiting');
  const [samples, setSamples] = useState<number[]>([]);
  const [lastReactionMs, setLastReactionMs] = useState<number | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string>('');
  const [announcement, setAnnouncement] = useState<string>('');

  const roundPhaseRef = useRef<ColorSnapRoundPhase>('waiting');
  const samplesRef = useRef<number[]>([]);
  const greenPaintedAtRef = useRef<number>(0);
  const timerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number>(0);
  const completeRunRef = useRef<((payload: GameResultPayload) => void) | null>(
    null,
  );

  const clearScheduledTimers = useCallback(() => {
    if (timerIdRef.current !== null) {
      window.clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const scheduleNextSignal = useCallback(() => {
    clearScheduledTimers();
    roundPhaseRef.current = 'waiting';
    setRoundPhase('waiting');
    setFeedbackBanner('');
    setAnnouncement(
      `Round ${samplesRef.current.length + 1} of ${COLOR_SNAP_ROUNDS}. Wait for Emerald.`,
    );

    const delayMs = randomBetween(
      COLOR_SNAP_MIN_DELAY_MS,
      COLOR_SNAP_MAX_DELAY_MS,
    );

    timerIdRef.current = window.setTimeout(() => {
      // Transition to ready and start the performance.now() clock inside rAF after green paints
      roundPhaseRef.current = 'ready';
      setRoundPhase('ready');
      soundEngine.playGoSignal();
      setAnnouncement('GO! Tap now!');

      rafIdRef.current = window.requestAnimationFrame(() => {
        greenPaintedAtRef.current = performance.now();
      });
    }, delayMs);
  }, [clearScheduledTimers]);

  const handleStartRun = useCallback(() => {
    sessionStartRef.current = performance.now();
    samplesRef.current = [];
    setSamples([]);
    setLastReactionMs(null);
    scheduleNextSignal();
  }, [scheduleNextSignal]);

  const handleResetRun = useCallback(() => {
    clearScheduledTimers();
    samplesRef.current = [];
    setSamples([]);
    setLastReactionMs(null);
    setFeedbackBanner('');
    roundPhaseRef.current = 'waiting';
    setRoundPhase('waiting');
  }, [clearScheduledTimers]);

  const handlePauseChange = useCallback(
    (paused: boolean) => {
      if (paused) {
        clearScheduledTimers();
      } else {
        // Re-arm the current waiting round safely after resuming
        scheduleNextSignal();
      }
    },
    [clearScheduledTimers, scheduleNextSignal],
  );

  useEffect(() => {
    return () => {
      clearScheduledTimers();
    };
  }, [clearScheduledTimers]);

  const handleTrigger = useCallback(() => {
    const now = performance.now();
    const currentPhase = roundPhaseRef.current;

    if (currentPhase === 'too-soon' || currentPhase === 'round-result') {
      return;
    }

    const reaction =
      currentPhase === 'ready' && greenPaintedAtRef.current > 0
        ? now - greenPaintedAtRef.current
        : 0;

    const result = evaluateColorSnapTap(
      currentPhase,
      reaction,
      samplesRef.current,
      COLOR_SNAP_ROUNDS,
    );

    if (result.outcome === 'too-soon') {
      clearScheduledTimers();
      soundEngine.playError();
      roundPhaseRef.current = 'too-soon';
      setRoundPhase('too-soon');
      setFeedbackBanner(result.message);
      setAnnouncement(result.message);
      timerIdRef.current = window.setTimeout(() => {
        scheduleNextSignal();
      }, 1100);
      return;
    }

    if (result.outcome === 'ignored-sub-100') {
      clearScheduledTimers();
      soundEngine.playError();
      roundPhaseRef.current = 'too-soon';
      setRoundPhase('too-soon');
      setFeedbackBanner(result.message);
      setAnnouncement(result.message);
      timerIdRef.current = window.setTimeout(() => {
        scheduleNextSignal();
      }, 1100);
      return;
    }

    // Valid round reaction recorded
    clearScheduledTimers();
    soundEngine.playSuccess();
    samplesRef.current = result.nextSamples;
    setSamples(result.nextSamples);
    setLastReactionMs(result.reactionMs);
    roundPhaseRef.current = 'round-result';
    setRoundPhase('round-result');
    setAnnouncement(`${result.reactionMs} milliseconds`);

    if (result.isFinished && result.averageMs !== null) {
      const totalDurationMs = Math.max(1000, performance.now() - sessionStartRef.current);
      const fastest = Math.min(...result.nextSamples);
      const slowest = Math.max(...result.nextSamples);
      timerIdRef.current = window.setTimeout(() => {
        completeRunRef.current?.({
          score: result.averageMs!,
          durationMs: totalDurationMs,
          extraStats: [
            { label: 'Fastest Round', value: `${fastest} ms` },
            { label: 'Slowest Round', value: `${slowest} ms` },
            {
              label: 'Round Splits',
              value: result.nextSamples.map((s) => `${s}`).join(' · ') + ' ms',
            },
          ],
          meta: {
            fastestMs: fastest,
            rounds: COLOR_SNAP_ROUNDS,
          },
        });
      }, 650);
    } else {
      timerIdRef.current = window.setTimeout(() => {
        scheduleNextSignal();
      }, 850);
    }
  }, [clearScheduledTimers, scheduleNextSignal]);

  const liveAvg =
    samples.length > 0 ? `${computeAverageReactionTime(samples)} ms` : '—';
  const currentRoundDisplay = Math.min(
    COLOR_SNAP_ROUNDS,
    samples.length + (roundPhase === 'round-result' ? 0 : 1),
  );

  return (
    <GameShell
      game={game}
      hudScore={liveAvg}
      hudSecondary={`Round ${currentRoundDisplay} / ${COLOR_SNAP_ROUNDS}`}
      announcement={announcement}
      onStartRun={handleStartRun}
      onResetRun={handleResetRun}
      onPauseChange={handlePauseChange}
    >
      {({ phase, colorblindMode, completeRun }) => {
        completeRunRef.current = completeRun;

        return (
          <ColorSnapSurface
            shellPhase={phase}
            roundPhase={roundPhase}
            samples={samples}
            lastReactionMs={lastReactionMs}
            feedbackBanner={feedbackBanner}
            colorblindMode={colorblindMode}
            onTrigger={handleTrigger}
          />
        );
      }}
    </GameShell>
  );
}

interface ColorSnapSurfaceProps {
  shellPhase: string;
  roundPhase: ColorSnapRoundPhase;
  samples: number[];
  lastReactionMs: number | null;
  feedbackBanner: string;
  colorblindMode: boolean;
  onTrigger: () => void;
}

function ColorSnapSurface({
  shellPhase,
  roundPhase,
  samples,
  lastReactionMs,
  feedbackBanner,
  colorblindMode,
  onTrigger,
}: ColorSnapSurfaceProps) {
  useEffect(() => {
    if (shellPhase !== 'playing') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        onTrigger();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shellPhase, onTrigger]);

  const isReady = roundPhase === 'ready';
  const isWaiting = roundPhase === 'waiting';
  const isTooSoon = roundPhase === 'too-soon';
  const isRoundResult = roundPhase === 'round-result';

  const panelColors = isReady
    ? 'bg-emerald-600 text-white border-emerald-400'
    : isTooSoon
      ? 'bg-amber-600 text-white border-amber-400'
      : isRoundResult
        ? 'bg-[#141821] text-white border-[#84CC16]/60'
        : 'bg-rose-700 text-white border-rose-500';

  const colorblindPatternStyle: React.CSSProperties | undefined =
    colorblindMode && isWaiting
      ? {
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 10px, transparent 10px, transparent 20px)',
        }
      : colorblindMode && isReady
        ? {
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.18) 2px, transparent 2px)',
            backgroundSize: '18px 18px',
          }
        : undefined;

  return (
    <div className="flex flex-1 flex-col p-5 sm:p-6 gap-5">
      {/* Interactive Reaction Field */}
      <button
        type="button"
        data-testid="color-snap-panel"
        data-round-phase={roundPhase}
        onPointerDown={(e) => {
          if (shellPhase !== 'playing') return;
          e.preventDefault();
          onTrigger();
        }}
        style={colorblindPatternStyle}
        className={`relative flex flex-1 min-h-[300px] sm:min-h-[340px] w-full flex-col items-center justify-center rounded-2xl border-2 p-8 text-center select-none touch-manipulation transition-colors duration-75 cursor-pointer ${panelColors}`}
      >
        {isWaiting && (
          <>
            <Hand className="h-12 w-12 mb-4 opacity-90" aria-hidden="true" />
            <div className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">
              WAIT FOR EMERALD
            </div>
            <p className="mt-2.5 text-sm sm:text-base font-medium text-white/85">
              Hold steady — tap or press Space the instant it turns emerald
            </p>
          </>
        )}

        {isReady && (
          <>
            <Zap className="h-14 w-14 mb-4 fill-current" aria-hidden="true" />
            <div className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight">
              TAP NOW!
            </div>
            <p className="mt-2.5 text-sm sm:text-base font-semibold text-emerald-50">
              Strike immediately
            </p>
          </>
        )}

        {isTooSoon && (
          <>
            <AlertCircle className="h-12 w-12 mb-4" aria-hidden="true" />
            <div className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              TOO SOON
            </div>
            <p className="mt-2 text-sm sm:text-base font-medium text-amber-50">
              {feedbackBanner || 'Wait for the emerald signal. Repeating round...'}
            </p>
          </>
        )}

        {isRoundResult && lastReactionMs !== null && (
          <>
            <CheckCircle2
              className="h-11 w-11 mb-3 text-[#84CC16]"
              aria-hidden="true"
            />
            <div className="font-mono-tabular text-5xl sm:text-6xl font-extrabold text-white">
              {lastReactionMs} <span className="text-2xl font-semibold text-white/75">ms</span>
            </div>
            <p className="mt-2 text-sm text-white/75">
              {samples.length >= COLOR_SNAP_ROUNDS
                ? 'Calculating final average...'
                : `Round ${samples.length} locked — next signal incoming`}
            </p>
          </>
        )}
      </button>

      {/* Round Progress Strip */}
      <div
        aria-label="Round splits"
        className="grid grid-cols-5 gap-2.5"
      >
        {Array.from({ length: COLOR_SNAP_ROUNDS }).map((_, idx) => {
          const val = samples[idx];
          const isCurrent = idx === samples.length;
          return (
            <div
              key={idx}
              className={`rounded-xl border px-3 py-2.5 text-center transition-colors ${
                val !== undefined
                  ? 'border-[#84CC16]/50 bg-[#84CC16]/10'
                  : isCurrent
                    ? 'border-[var(--rr-border-strong)] bg-[var(--rr-trough)]'
                    : 'border-[var(--rr-border)] bg-[var(--rr-trough)] opacity-60'
              }`}
            >
              <div className="text-[11px] font-medium text-[var(--rr-text-muted)]">
                R{idx + 1}
              </div>
              <div className="font-mono-tabular text-sm font-bold text-[var(--rr-text)] mt-0.5">
                {val !== undefined ? `${val} ms` : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
