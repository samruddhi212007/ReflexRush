import { useCallback, useEffect, useRef, useState } from 'react';
import { GameShell, type GameResultPayload } from '../../components/GameShell';
import { soundEngine } from '../../lib/audio';
import type { GameDefinition } from '../../types/game';
import {
  COLOR_CLASH_DURATION_MS,
  COLOR_CLASH_PENALTY_MS,
  evaluateStroopAnswer,
  generateStroopPrompt,
  STROOP_COLORS,
  type StroopColorId,
  type StroopPrompt,
} from './logic';

interface ColorClashGameProps {
  game: GameDefinition;
}

export function ColorClashGame({ game }: ColorClashGameProps) {
  const [prompt, setPrompt] = useState<StroopPrompt>(() => generateStroopPrompt());
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [bestCombo, setBestCombo] = useState<number>(0);
  const [bonusPoints, setBonusPoints] = useState<number>(0);
  const [remainingMs, setRemainingMs] = useState<number>(COLOR_CLASH_DURATION_MS);
  const [lockedOut, setLockedOut] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [announcement, setAnnouncement] = useState<string>('');

  const promptRef = useRef<StroopPrompt>(prompt);
  const correctRef = useRef<number>(0);
  const attemptsRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const bestComboRef = useRef<number>(0);
  const bonusPointsRef = useRef<number>(0);
  const remainingMsRef = useRef<number>(COLOR_CLASH_DURATION_MS);
  const lastFrameRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);
  const endedRef = useRef<boolean>(false);
  const lockedRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const lockoutTimerRef = useRef<number | null>(null);
  const completeRunRef = useRef<((payload: GameResultPayload) => void) | null>(
    null,
  );

  const stopLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (lockoutTimerRef.current !== null) {
      window.clearTimeout(lockoutTimerRef.current);
      lockoutTimerRef.current = null;
    }
  }, []);

  const finishSession = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    stopLoop();
    const acc =
      attemptsRef.current > 0
        ? Math.round((correctRef.current / attemptsRef.current) * 100)
        : 100;

    completeRunRef.current?.({
      score: correctRef.current,
      durationMs: COLOR_CLASH_DURATION_MS,
      extraStats: [
        { label: 'Accuracy', value: `${acc}%` },
        { label: 'Combo Points', value: `${bonusPointsRef.current}` },
        { label: 'Best Streak', value: `${bestComboRef.current}x` },
      ],
      meta: {
        accuracyPct: acc,
        comboPoints: bonusPointsRef.current,
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
      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    rafIdRef.current = window.requestAnimationFrame(tick);
  }, [finishSession, stopLoop]);

  const handleStartRun = useCallback(() => {
    endedRef.current = false;
    pausedRef.current = false;
    lockedRef.current = false;
    correctRef.current = 0;
    attemptsRef.current = 0;
    comboRef.current = 0;
    bestComboRef.current = 0;
    bonusPointsRef.current = 0;
    remainingMsRef.current = COLOR_CLASH_DURATION_MS;

    const first = generateStroopPrompt();
    promptRef.current = first;
    setPrompt(first);
    setCorrectCount(0);
    setAttempts(0);
    setCombo(0);
    setBestCombo(0);
    setBonusPoints(0);
    setRemainingMs(COLOR_CLASH_DURATION_MS);
    setLockedOut(false);
    setFeedback('none');
    setAnnouncement('Color Clash started. Select the ink color, not the word!');
    startLoop();
  }, [startLoop]);

  const handleResetRun = useCallback(() => {
    stopLoop();
    endedRef.current = true;
    pausedRef.current = false;
    lockedRef.current = false;
    setLockedOut(false);
    setFeedback('none');
  }, [stopLoop]);

  const handlePauseChange = useCallback(
    (paused: boolean) => {
      pausedRef.current = paused;
      if (paused) {
        stopLoop();
      } else if (!endedRef.current) {
        lockedRef.current = false;
        setLockedOut(false);
        startLoop();
      }
    },
    [startLoop, stopLoop],
  );

  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  const handleChooseColor = useCallback((chosenId: StroopColorId) => {
    if (pausedRef.current || endedRef.current || lockedRef.current) return;

    const evalRes = evaluateStroopAnswer(promptRef.current, chosenId, {
      correctCount: correctRef.current,
      attempts: attemptsRef.current,
      combo: comboRef.current,
      bestCombo: bestComboRef.current,
      bonusPoints: bonusPointsRef.current,
    });

    correctRef.current = evalRes.nextCorrectCount;
    attemptsRef.current = evalRes.nextAttempts;
    comboRef.current = evalRes.nextCombo;
    bestComboRef.current = evalRes.nextBestCombo;
    bonusPointsRef.current = evalRes.nextBonusPoints;

    setCorrectCount(evalRes.nextCorrectCount);
    setAttempts(evalRes.nextAttempts);
    setCombo(evalRes.nextCombo);
    setBestCombo(evalRes.nextBestCombo);
    setBonusPoints(evalRes.nextBonusPoints);

    if (evalRes.correct) {
      soundEngine.playTone(620 + Math.min(280, evalRes.nextCombo * 22), 0.08, 'sine', 0.12);
      setFeedback('correct');
      const next = generateStroopPrompt(promptRef.current.inkColorId);
      promptRef.current = next;
      setPrompt(next);
    } else {
      soundEngine.playError();
      setFeedback('wrong');
      lockedRef.current = true;
      setLockedOut(true);
      setAnnouncement('Wrong ink color — streak reset.');
      lockoutTimerRef.current = window.setTimeout(() => {
        lockedRef.current = false;
        setLockedOut(false);
        setFeedback('none');
        const next = generateStroopPrompt(promptRef.current.inkColorId);
        promptRef.current = next;
        setPrompt(next);
      }, COLOR_CLASH_PENALTY_MS);
    }
  }, []);

  const accuracy =
    attempts > 0 ? Math.round((correctCount / attempts) * 100) : 100;
  const multiplier = Math.min(4, 1 + Math.floor(Math.max(0, combo - 1) / 3));

  return (
    <GameShell
      game={game}
      hudScore={`${correctCount} pts`}
      hudTimer={`${(remainingMs / 1000).toFixed(1)}s`}
      hudSecondary={`${multiplier}x · ${accuracy}% acc`}
      announcement={announcement}
      onStartRun={handleStartRun}
      onResetRun={handleResetRun}
      onPauseChange={handlePauseChange}
    >
      {({ phase, completeRun }) => {
        completeRunRef.current = completeRun;

        return (
          <ColorClashSurface
            shellPhase={phase}
            prompt={prompt}
            combo={combo}
            multiplier={multiplier}
            lockedOut={lockedOut}
            feedback={feedback}
            onChooseColor={handleChooseColor}
          />
        );
      }}
    </GameShell>
  );
}

interface ColorClashSurfaceProps {
  shellPhase: string;
  prompt: StroopPrompt;
  combo: number;
  multiplier: number;
  lockedOut: boolean;
  feedback: 'none' | 'correct' | 'wrong';
  onChooseColor: (id: StroopColorId) => void;
}

function ColorClashSurface({
  shellPhase,
  prompt,
  combo,
  multiplier,
  lockedOut,
  feedback,
  onChooseColor,
}: ColorClashSurfaceProps) {
  useEffect(() => {
    if (shellPhase !== 'playing') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === '1') onChooseColor('rose');
      if (e.key === '2') onChooseColor('cyan');
      if (e.key === '3') onChooseColor('lime');
      if (e.key === '4') onChooseColor('amber');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shellPhase, onChooseColor]);

  return (
    <div className="flex flex-1 flex-col items-center justify-between p-6 sm:p-10 gap-8">
      <div className="flex items-center gap-3 text-xs font-medium text-[var(--rr-text-muted)]">
        <span>Pick the INK COLOR of the word</span>
        <span aria-hidden="true">·</span>
        <span className="font-mono-tabular font-bold text-[var(--rr-text)]">
          Streak {combo} ({multiplier}x)
        </span>
      </div>

      {/* Central Stroop Word Display */}
      <div
        data-testid="stroop-prompt"
        data-ink-color={prompt.inkColorId}
        className={`flex flex-1 w-full max-w-lg items-center justify-center rounded-2xl border p-8 transition-colors ${
          feedback === 'wrong'
            ? 'border-rose-500/70 bg-rose-500/10'
            : 'border-[var(--rr-border)] bg-[var(--rr-trough)]'
        }`}
      >
        <span
          style={{ color: prompt.inkHex }}
          className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight select-none"
        >
          {prompt.wordText}
        </span>
      </div>

      {/* 4 Color Choice Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-xl">
        {STROOP_COLORS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={lockedOut || shellPhase !== 'playing'}
            data-testid={`stroop-btn-${opt.id}`}
            onPointerDown={(e) => {
              if (shellPhase !== 'playing' || lockedOut) return;
              e.preventDefault();
              onChooseColor(opt.id);
            }}
            style={{
              backgroundColor: opt.inkHex,
              color: '#0B0D12',
            }}
            className="pill-cta flex flex-col items-center justify-center rounded-2xl py-4 px-4 font-display text-base font-extrabold shadow-md select-none touch-manipulation cursor-pointer disabled:opacity-50"
          >
            <span>{opt.word}</span>
            <span className="font-mono-tabular text-[11px] font-semibold opacity-75 mt-0.5">
              Key {opt.keyHint}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
