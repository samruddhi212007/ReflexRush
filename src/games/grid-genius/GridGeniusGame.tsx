import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { GameShell, type GameResultPayload } from '../../components/GameShell';
import { soundEngine } from '../../lib/audio';
import type { GameDefinition } from '../../types/game';
import {
  evaluateGridRecall,
  generatePatternIndices,
  GRID_GENIUS_MAX_STRIKES,
  GRID_GENIUS_REVEAL_MS,
  GRID_GENIUS_SIZE,
  GRID_GENIUS_START_N,
} from './logic';

interface GridGeniusGameProps {
  game: GameDefinition;
}

type GridPhase = 'memorize' | 'recall' | 'feedback';

export function GridGeniusGame({ game }: GridGeniusGameProps) {
  const [gridPhase, setGridPhase] = useState<GridPhase>('memorize');
  const [patternSize, setPatternSize] = useState<number>(GRID_GENIUS_START_N);
  const [targetIndices, setTargetIndices] = useState<number[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [strikes, setStrikes] = useState<number>(0);
  const [maxCleared, setMaxCleared] = useState<number>(0);
  const [lastPerfect, setLastPerfect] = useState<boolean | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');

  const gridPhaseRef = useRef<GridPhase>('memorize');
  const patternSizeRef = useRef<number>(GRID_GENIUS_START_N);
  const targetIndicesRef = useRef<number[]>([]);
  const selectedIndicesRef = useRef<number[]>([]);
  const strikesRef = useRef<number>(0);
  const maxClearedRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number>(0);
  const completeRunRef = useRef<((payload: GameResultPayload) => void) | null>(
    null,
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRound = useCallback(
    (size: number) => {
      clearTimer();
      const pattern = generatePatternIndices(size);
      targetIndicesRef.current = pattern;
      setTargetIndices(pattern);
      selectedIndicesRef.current = [];
      setSelectedIndices([]);
      setLastPerfect(null);
      gridPhaseRef.current = 'memorize';
      setGridPhase('memorize');
      setAnnouncement(`Memorize ${size} highlighted tiles.`);

      timerRef.current = window.setTimeout(() => {
        if (pausedRef.current) return;
        gridPhaseRef.current = 'recall';
        setGridPhase('recall');
        setAnnouncement(`Now tap the ${size} tiles.`);
      }, GRID_GENIUS_REVEAL_MS);
    },
    [clearTimer],
  );

  const handleStartRun = useCallback(() => {
    pausedRef.current = false;
    sessionStartRef.current = performance.now();
    patternSizeRef.current = GRID_GENIUS_START_N;
    strikesRef.current = 0;
    maxClearedRef.current = 0;
    setPatternSize(GRID_GENIUS_START_N);
    setStrikes(0);
    setMaxCleared(0);
    startRound(GRID_GENIUS_START_N);
  }, [startRound]);

  const handleResetRun = useCallback(() => {
    clearTimer();
    pausedRef.current = false;
    patternSizeRef.current = GRID_GENIUS_START_N;
    strikesRef.current = 0;
    maxClearedRef.current = 0;
    setPatternSize(GRID_GENIUS_START_N);
    setStrikes(0);
    setMaxCleared(0);
    setSelectedIndices([]);
    setTargetIndices([]);
    setLastPerfect(null);
  }, [clearTimer]);

  const handlePauseChange = useCallback(
    (paused: boolean) => {
      pausedRef.current = paused;
      if (paused) {
        clearTimer();
      } else if (gridPhaseRef.current === 'memorize') {
        startRound(patternSizeRef.current);
      }
    },
    [clearTimer, startRound],
  );

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const handleTileTap = useCallback(
    (index: number) => {
      if (pausedRef.current || gridPhaseRef.current !== 'recall') return;
      if (selectedIndicesRef.current.includes(index)) return;

      const nextSelected = [...selectedIndicesRef.current, index];
      selectedIndicesRef.current = nextSelected;
      setSelectedIndices(nextSelected);

      const isCorrectPick = targetIndicesRef.current.includes(index);
      if (isCorrectPick) {
        soundEngine.playTone(580 + nextSelected.length * 45, 0.08, 'sine', 0.11);
      } else {
        soundEngine.playError();
      }

      // Evaluate as soon as user taps a wrong tile OR selects N tiles
      if (!isCorrectPick || nextSelected.length >= targetIndicesRef.current.length) {
        clearTimer();
        const evalRes = evaluateGridRecall(
          targetIndicesRef.current,
          nextSelected,
          patternSizeRef.current,
          strikesRef.current,
          maxClearedRef.current,
        );

        gridPhaseRef.current = 'feedback';
        setGridPhase('feedback');
        setLastPerfect(evalRes.perfect);

        if (evalRes.perfect) {
          soundEngine.playSuccess();
          setAnnouncement(
            `Perfect! Pattern grows to ${evalRes.nextN} tiles.`,
          );
        } else {
          setAnnouncement(
            `Miss! Strike ${evalRes.nextStrikes} of ${GRID_GENIUS_MAX_STRIKES}.`,
          );
        }

        patternSizeRef.current = evalRes.nextN;
        strikesRef.current = evalRes.nextStrikes;
        maxClearedRef.current = evalRes.nextMaxCleared;

        setPatternSize(evalRes.nextN);
        setStrikes(evalRes.nextStrikes);
        setMaxCleared(evalRes.nextMaxCleared);

        if (evalRes.gameOver) {
          const durationMs = Math.max(
            1000,
            performance.now() - sessionStartRef.current,
          );
          timerRef.current = window.setTimeout(() => {
            completeRunRef.current?.({
              score: evalRes.nextMaxCleared,
              durationMs,
              extraStats: [
                {
                  label: 'Largest Pattern Cleared',
                  value: `${evalRes.nextMaxCleared} tiles`,
                },
                {
                  label: 'Strikes Used',
                  value: `${evalRes.nextStrikes} / ${GRID_GENIUS_MAX_STRIKES}`,
                },
              ],
              meta: { maxPattern: evalRes.nextMaxCleared },
            });
          }, 850);
        } else {
          timerRef.current = window.setTimeout(() => {
            if (!pausedRef.current) {
              startRound(evalRes.nextN);
            }
          }, 900);
        }
      }
    },
    [clearTimer, startRound],
  );

  return (
    <GameShell
      game={game}
      hudScore={`${maxCleared} tiles`}
      hudSecondary={`Pattern ${patternSize} · Strikes ${strikes}/${GRID_GENIUS_MAX_STRIKES}`}
      announcement={announcement}
      onStartRun={handleStartRun}
      onResetRun={handleResetRun}
      onPauseChange={handlePauseChange}
    >
      {({ phase, colorblindMode, completeRun }) => {
        completeRunRef.current = completeRun;

        const targetSet = new Set(targetIndices);
        const selectedSet = new Set(selectedIndices);

        return (
          <div className="flex flex-1 flex-col items-center justify-center p-5 sm:p-8 gap-5">
            <div className="flex flex-wrap items-center justify-between gap-4 w-full max-w-[380px]">
              <div
                data-testid="grid-phase-label"
                className="font-display text-lg font-bold text-[var(--rr-text)]"
              >
                {gridPhase === 'memorize'
                  ? `Memorize ${targetIndices.length} tiles`
                  : gridPhase === 'recall'
                    ? `Tap ${targetIndices.length - selectedIndices.length} remaining`
                    : lastPerfect
                      ? 'Perfect Recall!'
                      : 'Pattern Missed'}
              </div>

              {/* 3-Strike Indicator */}
              <div
                className="flex items-center gap-1.5"
                aria-label={`Strikes: ${strikes} of ${GRID_GENIUS_MAX_STRIKES}`}
              >
                {Array.from({ length: GRID_GENIUS_MAX_STRIKES }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-3 w-3 rounded-full border transition-colors ${
                      i < strikes
                        ? 'bg-rose-500 border-rose-400'
                        : 'bg-[var(--rr-trough)] border-[var(--rr-border-strong)]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 4x4 Matrix */}
            <div className="grid grid-cols-4 gap-3 w-full max-w-[380px]">
              {Array.from({ length: GRID_GENIUS_SIZE }).map((_, idx) => {
                const isTarget = targetSet.has(idx);
                const isSelected = selectedSet.has(idx);

                const showLit = gridPhase === 'memorize' && isTarget;
                const showHit =
                  (gridPhase === 'recall' || gridPhase === 'feedback') &&
                  isSelected &&
                  isTarget;
                const showMiss =
                  (gridPhase === 'recall' || gridPhase === 'feedback') &&
                  isSelected &&
                  !isTarget;
                const showMissedReveal =
                  gridPhase === 'feedback' && isTarget && !isSelected;

                let tileStyle =
                  'border-[var(--rr-border)] bg-[var(--rr-trough)] hover:border-[var(--rr-border-strong)]';
                if (showLit) {
                  tileStyle =
                    'border-[#22D3EE] bg-[#06B6D4] text-[#0B0D12] shadow-[0_0_24px_rgba(6,182,212,0.5)] scale-[1.03]';
                } else if (showHit) {
                  tileStyle =
                    'border-[#22D3EE] bg-[#06B6D4]/85 text-[#0B0D12]';
                } else if (showMiss) {
                  tileStyle =
                    'border-rose-400 bg-rose-500/80 text-white';
                } else if (showMissedReveal) {
                  tileStyle =
                    'border-[#06B6D4] bg-[#06B6D4]/25 text-[#22D3EE]';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    data-testid={`grid-cell-${idx}`}
                    data-target={isTarget ? 'true' : 'false'}
                    aria-label={`Grid cell ${idx + 1}`}
                    onPointerDown={(e) => {
                      if (phase !== 'playing' || gridPhase !== 'recall') return;
                      e.preventDefault();
                      handleTileTap(idx);
                    }}
                    className={`aspect-square min-h-[68px] flex items-center justify-center rounded-xl border-2 select-none touch-manipulation transition-all duration-150 ${
                      gridPhase === 'recall' ? 'cursor-pointer' : 'cursor-default'
                    } ${tileStyle}`}
                  >
                    {showLit && (colorblindMode || true) && (
                      <Sparkles className="h-5 w-5" aria-hidden="true" />
                    )}
                    {showHit && <Check className="h-6 w-6 stroke-[2.5]" aria-hidden="true" />}
                    {showMiss && <X className="h-6 w-6 stroke-[2.5]" aria-hidden="true" />}
                    {showMissedReveal && (
                      <span className="h-2.5 w-2.5 rounded-full bg-current" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }}
    </GameShell>
  );
}
