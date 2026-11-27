import { useCallback, useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { GameShell, type GameResultPayload } from '../../components/GameShell';
import { soundEngine } from '../../lib/audio';
import type { GameDefinition } from '../../types/game';
import {
  computeAccuracyPct,
  createQuickTapTarget,
  QUICK_TAP_DURATION_MS,
  QUICK_TAP_MAX_CONCURRENT,
  scoreQuickTapHit,
  type QuickTapTarget,
} from './logic';

interface QuickTapGameProps {
  game: GameDefinition;
}

export function QuickTapGame({ game }: QuickTapGameProps) {
  const [targets, setTargets] = useState<QuickTapTarget[]>([]);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [hits, setHits] = useState<number>(0);
  const [misses, setMisses] = useState<number>(0);
  const [remainingMs, setRemainingMs] = useState<number>(QUICK_TAP_DURATION_MS);
  const [announcement, setAnnouncement] = useState<string>('');

  const targetsRef = useRef<QuickTapTarget[]>([]);
  const scoreRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const bestComboRef = useRef<number>(0);
  const hitsRef = useRef<number>(0);
  const missesRef = useRef<number>(0);
  const hitTimesRef = useRef<number[]>([]);
  const nextIdRef = useRef<number>(1);
  const remainingMsRef = useRef<number>(QUICK_TAP_DURATION_MS);
  const lastFrameRef = useRef<number>(0);
  const lastSpawnAtRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);
  const endedRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const ringRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const completeRunRef = useRef<((payload: GameResultPayload) => void) | null>(
    null,
  );

  const stopLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const finishSession = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    stopLoop();
    const totalHits = hitsRef.current;
    const totalMisses = missesRef.current;
    const accuracy = computeAccuracyPct(totalHits, totalMisses);
    const avgHitMs =
      hitTimesRef.current.length > 0
        ? Math.round(
            hitTimesRef.current.reduce((a, b) => a + b, 0) /
              hitTimesRef.current.length,
          )
        : 0;

    completeRunRef.current?.({
      score: scoreRef.current,
      durationMs: QUICK_TAP_DURATION_MS,
      extraStats: [
        { label: 'Accuracy', value: `${accuracy}%` },
        {
          label: 'Average Hit Time',
          value: avgHitMs > 0 ? `${avgHitMs} ms` : '—',
        },
        { label: 'Best Combo', value: `${bestComboRef.current}x` },
        { label: 'Targets Hit', value: `${totalHits}` },
      ],
      meta: {
        accuracyPct: accuracy,
        avgHitMs,
        bestCombo: bestComboRef.current,
      },
    });
  }, [stopLoop]);

  const startLoop = useCallback(() => {
    stopLoop();
    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      if (pausedRef.current || endedRef.current) return;
      const dt = Math.min(80, Math.max(0, now - lastFrameRef.current));
      lastFrameRef.current = now;

      remainingMsRef.current = Math.max(0, remainingMsRef.current - dt);
      setRemainingMs(remainingMsRef.current);

      if (remainingMsRef.current <= 0) {
        finishSession();
        return;
      }

      // Check expired targets
      const active: QuickTapTarget[] = [];
      let expiredCount = 0;
      for (const t of targetsRef.current) {
        if (now - t.spawnedAt >= t.lifetimeMs) {
          expiredCount += 1;
        } else {
          active.push(t);
        }
      }

      if (expiredCount > 0) {
        missesRef.current += expiredCount;
        setMisses(missesRef.current);
        comboRef.current = 0;
        setCombo(0);
        soundEngine.playError();
        targetsRef.current = active;
        setTargets(active);
      }

      // Spawn new target if room
      const spawnInterval = Math.max(460, 780 - comboRef.current * 18);
      if (
        targetsRef.current.length === 0 ||
        (targetsRef.current.length < QUICK_TAP_MAX_CONCURRENT &&
          now - lastSpawnAtRef.current >= spawnInterval)
      ) {
        const created = createQuickTapTarget(
          nextIdRef.current++,
          now,
          comboRef.current,
          targetsRef.current,
        );
        lastSpawnAtRef.current = now;
        const nextList = [...targetsRef.current, created];
        targetsRef.current = nextList;
        setTargets(nextList);
      }

      // Animate shrinking ring transforms directly via DOM refs for 60fps smoothness
      for (const t of targetsRef.current) {
        const ringEl = ringRefs.current[t.id];
        if (ringEl) {
          const progress = Math.min(1, Math.max(0, (now - t.spawnedAt) / t.lifetimeMs));
          const scale = 2.1 - progress * 1.15;
          ringEl.style.transform = `scale(${scale.toFixed(3)})`;
          ringEl.style.opacity = `${(0.35 + progress * 0.65).toFixed(2)}`;
        }
      }

      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    rafIdRef.current = window.requestAnimationFrame(tick);
  }, [finishSession, stopLoop]);

  const handleStartRun = useCallback(() => {
    endedRef.current = false;
    pausedRef.current = false;
    scoreRef.current = 0;
    comboRef.current = 0;
    bestComboRef.current = 0;
    hitsRef.current = 0;
    missesRef.current = 0;
    hitTimesRef.current = [];
    remainingMsRef.current = QUICK_TAP_DURATION_MS;
    targetsRef.current = [];
    setScore(0);
    setCombo(0);
    setHits(0);
    setMisses(0);
    setRemainingMs(QUICK_TAP_DURATION_MS);

    const first = createQuickTapTarget(
      nextIdRef.current++,
      performance.now(),
      0,
      [],
    );
    lastSpawnAtRef.current = performance.now();
    targetsRef.current = [first];
    setTargets([first]);
    setAnnouncement('Quick Tap started. Tap targets before rings collapse!');
    startLoop();
  }, [startLoop]);

  const handleResetRun = useCallback(() => {
    stopLoop();
    endedRef.current = true;
    pausedRef.current = false;
    targetsRef.current = [];
    setTargets([]);
    setScore(0);
    setCombo(0);
    setHits(0);
    setMisses(0);
    setRemainingMs(QUICK_TAP_DURATION_MS);
  }, [stopLoop]);

  const pauseStartedAtRef = useRef<number>(0);

  const handlePauseChange = useCallback(
    (paused: boolean) => {
      pausedRef.current = paused;
      if (paused) {
        pauseStartedAtRef.current = performance.now();
        stopLoop();
      } else if (!endedRef.current) {
        const pausedDuration = performance.now() - pauseStartedAtRef.current;
        targetsRef.current = targetsRef.current.map((t) => ({
          ...t,
          spawnedAt: t.spawnedAt + pausedDuration,
        }));
        lastSpawnAtRef.current += pausedDuration;
        startLoop();
      }
    },
    [startLoop, stopLoop],
  );

  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  const handleTargetHit = useCallback((target: QuickTapTarget) => {
    if (pausedRef.current || endedRef.current) return;
    const now = performance.now();
    const res = scoreQuickTapHit(target, now, comboRef.current);

    scoreRef.current += res.pointsEarned;
    comboRef.current = res.nextCombo;
    bestComboRef.current = Math.max(bestComboRef.current, res.nextCombo);
    hitsRef.current += 1;
    hitTimesRef.current.push(res.reactionMs);

    setScore(scoreRef.current);
    setCombo(res.nextCombo);
    setHits(hitsRef.current);

    if (target.isBonus) {
      soundEngine.playGoSignal();
    } else {
      soundEngine.playTone(540 + Math.min(360, res.nextCombo * 24), 0.08, 'sine', 0.12);
    }

    const remaining = targetsRef.current.filter((t) => t.id !== target.id);
    targetsRef.current = remaining;
    setTargets(remaining);
  }, []);

  const handleArenaMiss = useCallback(() => {
    if (pausedRef.current || endedRef.current) return;
    missesRef.current += 1;
    comboRef.current = 0;
    setMisses(missesRef.current);
    setCombo(0);
    soundEngine.playError();
  }, []);

  const accuracy = computeAccuracyPct(hits, misses);

  return (
    <GameShell
      game={game}
      hudScore={`${score} pts`}
      hudTimer={`${(remainingMs / 1000).toFixed(1)}s`}
      hudSecondary={`Combo ${combo}x · ${accuracy}%`}
      announcement={announcement}
      onStartRun={handleStartRun}
      onResetRun={handleResetRun}
      onPauseChange={handlePauseChange}
    >
      {({ phase, colorblindMode, completeRun }) => {
        completeRunRef.current = completeRun;

        return (
          <div className="flex flex-1 flex-col p-4 sm:p-5">
            <div
              data-testid="quick-tap-arena"
              onPointerDown={(e) => {
                if (phase !== 'playing') return;
                if (e.target === e.currentTarget) {
                  handleArenaMiss();
                }
              }}
              className="relative flex-1 min-h-[380px] sm:min-h-[420px] w-full overflow-hidden rounded-2xl border border-[var(--rr-border)] bg-[var(--rr-trough)] select-none touch-manipulation"
            >
              {targets.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  data-testid={
                    target.isBonus ? 'quick-tap-bonus' : 'quick-tap-target'
                  }
                  aria-label={
                    target.isBonus ? 'Golden bonus orb' : 'Reaction target'
                  }
                  onPointerDown={(e) => {
                    if (phase !== 'playing') return;
                    e.stopPropagation();
                    e.preventDefault();
                    handleTargetHit(target);
                  }}
                  style={{
                    left: `${target.xPct}%`,
                    top: `${target.yPct}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute flex h-14 w-14 items-center justify-center rounded-full cursor-pointer focus-visible:outline-none"
                >
                  {/* Shrinking timing ring */}
                  <span
                    ref={(el) => {
                      ringRefs.current[target.id] = el;
                    }}
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-0 rounded-full border-2 ${
                      target.isBonus
                        ? 'border-amber-300'
                        : 'border-[#FBBF24]/80'
                    }`}
                  />
                  {/* Core target disc */}
                  <span
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90 ${
                      target.isBonus
                        ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-[#0B0D12] ring-2 ring-white'
                        : 'bg-[#FBBF24] text-[#0B0D12]'
                    }`}
                  >
                    {target.isBonus ? (
                      <Star className="h-5 w-5 fill-current" aria-hidden="true" />
                    ) : colorblindMode ? (
                      <span className="font-mono-tabular text-xs font-extrabold">
                        +
                      </span>
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#0B0D12]" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      }}
    </GameShell>
  );
}
