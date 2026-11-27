import { useCallback, useEffect, useRef, useState } from 'react';
import { GameShell, type GameResultPayload } from '../../components/GameShell';
import { soundEngine } from '../../lib/audio';
import type { GameDefinition } from '../../types/game';
import {
  FOCUS_FRENZY_TOTAL_MS,
  generateFocusRound,
  type FocusRoundConfig,
  type FocusTile,
} from './logic';

interface FocusFrenzyGameProps {
  game: GameDefinition;
}

export function FocusFrenzyGame({ game }: FocusFrenzyGameProps) {
  const [round, setRound] = useState<FocusRoundConfig>(() =>
    generateFocusRound(0, false),
  );
  const [roundsCleared, setRoundsCleared] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [totalRemainingMs, setTotalRemainingMs] = useState<number>(
    FOCUS_FRENZY_TOTAL_MS,
  );
  const [roundRemainingMs, setRoundRemainingMs] = useState<number>(
    round.roundTimerMs,
  );
  const [missFlashIndex, setMissFlashIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');

  const roundsClearedRef = useRef<number>(0);
  const attemptsRef = useRef<number>(0);
  const totalRemainingRef = useRef<number>(FOCUS_FRENZY_TOTAL_MS);
  const roundRemainingRef = useRef<number>(round.roundTimerMs);
  const roundDurationRef = useRef<number>(round.roundTimerMs);
  const colorblindRef = useRef<boolean>(false);
  const lastFrameRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);
  const endedRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const completeRunRef = useRef<((payload: GameResultPayload) => void) | null>(
    null,
  );

  const stopLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const spawnRound = useCallback((clearedCount: number) => {
    const next = generateFocusRound(clearedCount, colorblindRef.current);
    setRound(next);
    roundDurationRef.current = next.roundTimerMs;
    roundRemainingRef.current = next.roundTimerMs;
    setRoundRemainingMs(next.roundTimerMs);
    setMissFlashIndex(null);
  }, []);

  const finishSession = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    stopLoop();
    const cleared = roundsClearedRef.current;
    const acc =
      attemptsRef.current > 0
        ? Math.round((cleared / attemptsRef.current) * 100)
        : 100;

    completeRunRef.current?.({
      score: cleared,
      durationMs: FOCUS_FRENZY_TOTAL_MS,
      extraStats: [
        { label: 'Rounds Cleared', value: `${cleared}` },
        { label: 'Tap Accuracy', value: `${acc}%` },
        {
          label: 'Peak Grid',
          value: cleared >= 9 ? '5×5' : cleared >= 3 ? '4×4' : '3×3',
        },
      ],
      meta: { roundsCleared: cleared, accuracyPct: acc },
    });
  }, [stopLoop]);

  const startLoop = useCallback(() => {
    stopLoop();
    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      if (pausedRef.current || endedRef.current) return;
      const dt = Math.min(80, Math.max(0, now - lastFrameRef.current));
      lastFrameRef.current = now;

      totalRemainingRef.current = Math.max(0, totalRemainingRef.current - dt);
      roundRemainingRef.current = Math.max(0, roundRemainingRef.current - dt);

      setTotalRemainingMs(totalRemainingRef.current);
      setRoundRemainingMs(roundRemainingRef.current);

      if (totalRemainingRef.current <= 0) {
        finishSession();
        return;
      }

      if (roundRemainingRef.current <= 0) {
        soundEngine.playError();
        attemptsRef.current += 1;
        setAttempts(attemptsRef.current);
        setAnnouncement('Round timer expired. Next visual array.');
        spawnRound(roundsClearedRef.current);
      }

      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    rafIdRef.current = window.requestAnimationFrame(tick);
  }, [finishSession, spawnRound, stopLoop]);

  const handleStartRun = useCallback(() => {
    endedRef.current = false;
    pausedRef.current = false;
    roundsClearedRef.current = 0;
    attemptsRef.current = 0;
    totalRemainingRef.current = FOCUS_FRENZY_TOTAL_MS;

    setRoundsCleared(0);
    setAttempts(0);
    setTotalRemainingMs(FOCUS_FRENZY_TOTAL_MS);
    spawnRound(0);
    setAnnouncement('Focus Frenzy started. Tap the single outlier shape!');
    startLoop();
  }, [spawnRound, startLoop]);

  const handleResetRun = useCallback(() => {
    stopLoop();
    endedRef.current = true;
    pausedRef.current = false;
    setMissFlashIndex(null);
  }, [stopLoop]);

  const handlePauseChange = useCallback(
    (paused: boolean) => {
      pausedRef.current = paused;
      if (paused) {
        stopLoop();
      } else if (!endedRef.current) {
        startLoop();
      }
    },
    [startLoop, stopLoop],
  );

  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  const handleTileTap = useCallback(
    (tile: FocusTile) => {
      if (pausedRef.current || endedRef.current) return;
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);

      if (tile.isOutlier) {
        roundsClearedRef.current += 1;
        setRoundsCleared(roundsClearedRef.current);
        soundEngine.playTone(
          640 + Math.min(300, roundsClearedRef.current * 18),
          0.09,
          'sine',
          0.13,
        );
        spawnRound(roundsClearedRef.current);
      } else {
        soundEngine.playError();
        setMissFlashIndex(tile.index);
        // Small per-round clock penalty on wrong guess
        roundRemainingRef.current = Math.max(250, roundRemainingRef.current - 550);
      }
    },
    [spawnRound],
  );

  const roundProgressPct = Math.max(
    0,
    Math.min(100, (roundRemainingMs / roundDurationRef.current) * 100),
  );

  return (
    <GameShell
      game={game}
      hudScore={`${roundsCleared} rds`}
      hudTimer={`${(totalRemainingMs / 1000).toFixed(1)}s`}
      hudSecondary={`${round.gridSide}×${round.gridSide} grid`}
      announcement={announcement}
      onStartRun={handleStartRun}
      onResetRun={handleResetRun}
      onPauseChange={handlePauseChange}
    >
      {({ phase, colorblindMode, completeRun }) => {
        completeRunRef.current = completeRun;
        colorblindRef.current = colorblindMode;

        return (
          <div className="flex flex-1 flex-col items-center justify-center p-5 sm:p-8 gap-5">
            {/* Per-Round Countdown Bar */}
            <div className="w-full max-w-[400px]">
              <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--rr-text-muted)]">
                <span>Tap the single outlier</span>
                <span className="font-mono-tabular font-semibold text-[var(--rr-text)]">
                  {(roundRemainingMs / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--rr-trough)] border border-[var(--rr-border)]">
                <div
                  className="h-full rounded-full bg-[#A78BFA] transition-[width] duration-75"
                  style={{ width: `${roundProgressPct}%` }}
                />
              </div>
            </div>

            {/* Dynamic NxN Shape Grid */}
            <div
              data-testid="focus-frenzy-grid"
              style={{
                gridTemplateColumns: `repeat(${round.gridSide}, minmax(0, 1fr))`,
              }}
              className="grid gap-2.5 sm:gap-3 w-full max-w-[400px]"
            >
              {round.tiles.map((tile) => (
                <button
                  key={tile.index}
                  type="button"
                  data-testid={
                    tile.isOutlier ? 'focus-outlier-tile' : `focus-tile-${tile.index}`
                  }
                  aria-label={`Shape tile ${tile.index + 1}`}
                  onPointerDown={(e) => {
                    if (phase !== 'playing') return;
                    e.preventDefault();
                    handleTileTap(tile);
                  }}
                  className={`aspect-square min-h-[54px] flex items-center justify-center rounded-xl border transition-transform active:scale-95 cursor-pointer select-none touch-manipulation ${
                    missFlashIndex === tile.index
                      ? 'border-rose-500 bg-rose-500/15'
                      : 'border-[var(--rr-border)] bg-[var(--rr-trough)] hover:border-[var(--rr-border-strong)]'
                  }`}
                >
                  <ShapeGlyph tile={tile} />
                </button>
              ))}
            </div>
          </div>
        );
      }}
    </GameShell>
  );
}

function ShapeGlyph({ tile }: { tile: FocusTile }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className="h-8 w-8 sm:h-9 sm:w-9"
      style={{
        transform: `rotate(${tile.rotationDeg}deg)`,
        opacity: tile.opacity,
      }}
      aria-hidden="true"
    >
      {tile.shape === 'circle' && (
        <circle cx="20" cy="20" r="13" fill={tile.color} />
      )}
      {tile.shape === 'square' && (
        <rect x="8" y="8" width="24" height="24" rx="4" fill={tile.color} />
      )}
      {tile.shape === 'triangle' && (
        <polygon points="20,6 34,32 6,32" fill={tile.color} />
      )}
      {tile.shape === 'diamond' && (
        <polygon points="20,5 35,20 20,35 5,20" fill={tile.color} />
      )}
    </svg>
  );
}
