import { useCallback, useEffect, useRef, useState } from 'react';
import { GameShell, type GameResultPayload } from '../../components/GameShell';
import { soundEngine } from '../../lib/audio';
import type { GameDefinition } from '../../types/game';
import {
  appendSequenceStep,
  evaluateSequenceInput,
  getPlaybackTimingForLevel,
  SEQUENCE_PADS,
  type PadId,
} from './logic';

interface SequenceRecallGameProps {
  game: GameDefinition;
}

type SeqTurnPhase = 'playback' | 'input' | 'level-clear' | 'failed';

export function SequenceRecallGame({ game }: SequenceRecallGameProps) {
  const [sequence, setSequence] = useState<PadId[]>([]);
  const [turnPhase, setTurnPhase] = useState<SeqTurnPhase>('playback');
  const [activePad, setActivePad] = useState<PadId | null>(null);
  const [inputIndex, setInputIndex] = useState<number>(0);
  const [highestCleared, setHighestCleared] = useState<number>(0);
  const [announcement, setAnnouncement] = useState<string>('');

  const sequenceRef = useRef<PadId[]>([]);
  const turnPhaseRef = useRef<SeqTurnPhase>('playback');
  const inputIndexRef = useRef<number>(0);
  const highestClearedRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);
  const timersRef = useRef<number[]>([]);
  const sessionStartRef = useRef<number>(0);
  const completeRunRef = useRef<((payload: GameResultPayload) => void) | null>(
    null,
  );

  const clearAllTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const flashPad = useCallback(
    (padId: PadId, durationMs: number) => {
      const pad = SEQUENCE_PADS[padId];
      setActivePad(padId);
      soundEngine.playTone(pad.toneHz, Math.max(0.12, durationMs / 1000), 'sine', 0.16);
      scheduleTimeout(() => {
        setActivePad((curr) => (curr === padId ? null : curr));
      }, durationMs);
    },
    [scheduleTimeout],
  );

  const playSequence = useCallback(
    (seq: readonly PadId[]) => {
      clearAllTimers();
      turnPhaseRef.current = 'playback';
      setTurnPhase('playback');
      inputIndexRef.current = 0;
      setInputIndex(0);
      setActivePad(null);
      setAnnouncement(`Watch sequence of ${seq.length}.`);

      const { litMs, gapMs } = getPlaybackTimingForLevel(seq.length);
      const stepMs = litMs + gapMs;

      seq.forEach((padId, idx) => {
        scheduleTimeout(() => {
          if (pausedRef.current) return;
          flashPad(padId, litMs);
        }, 380 + idx * stepMs);
      });

      scheduleTimeout(() => {
        if (pausedRef.current) return;
        turnPhaseRef.current = 'input';
        setTurnPhase('input');
        setAnnouncement(`Your turn. Repeat ${seq.length} steps.`);
      }, 420 + seq.length * stepMs);
    },
    [clearAllTimers, flashPad, scheduleTimeout],
  );

  const handleStartRun = useCallback(() => {
    pausedRef.current = false;
    sessionStartRef.current = performance.now();
    const initial = appendSequenceStep([]);
    sequenceRef.current = initial;
    setSequence(initial);
    highestClearedRef.current = 0;
    setHighestCleared(0);
    playSequence(initial);
  }, [playSequence]);

  const handleResetRun = useCallback(() => {
    clearAllTimers();
    pausedRef.current = false;
    sequenceRef.current = [];
    setSequence([]);
    setActivePad(null);
    inputIndexRef.current = 0;
    setInputIndex(0);
    highestClearedRef.current = 0;
    setHighestCleared(0);
    turnPhaseRef.current = 'playback';
    setTurnPhase('playback');
  }, [clearAllTimers]);

  const handlePauseChange = useCallback(
    (paused: boolean) => {
      pausedRef.current = paused;
      if (paused) {
        clearAllTimers();
        setActivePad(null);
      } else if (sequenceRef.current.length > 0 && turnPhaseRef.current !== 'failed') {
        playSequence(sequenceRef.current);
      }
    },
    [clearAllTimers, playSequence],
  );

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const handlePadPress = useCallback(
    (padId: PadId) => {
      if (pausedRef.current || turnPhaseRef.current !== 'input') return;

      const pad = SEQUENCE_PADS[padId];
      setActivePad(padId);
      scheduleTimeout(() => {
        setActivePad((curr) => (curr === padId ? null : curr));
      }, 180);

      const outcome = evaluateSequenceInput(
        sequenceRef.current,
        inputIndexRef.current,
        padId,
      );

      if (outcome.status === 'wrong') {
        clearAllTimers();
        soundEngine.playError();
        turnPhaseRef.current = 'failed';
        setTurnPhase('failed');
        setAnnouncement(
          `Incorrect pad. Expected ${SEQUENCE_PADS[outcome.expected].label}.`,
        );

        const reached = highestClearedRef.current;
        const durationMs = Math.max(
          1000,
          performance.now() - sessionStartRef.current,
        );
        scheduleTimeout(() => {
          completeRunRef.current?.({
            score: reached,
            durationMs,
            extraStats: [
              { label: 'Levels Cleared', value: `${reached}` },
              {
                label: 'Longest Sequence',
                value: `${reached} ${reached === 1 ? 'step' : 'steps'}`,
              },
            ],
            meta: { levelReached: reached },
          });
        }, 650);
        return;
      }

      soundEngine.playTone(pad.toneHz, 0.16, 'sine', 0.16);

      if (outcome.status === 'continue') {
        inputIndexRef.current = outcome.nextIndex;
        setInputIndex(outcome.nextIndex);
        return;
      }

      // Level complete!
      highestClearedRef.current = outcome.clearedLevel;
      setHighestCleared(outcome.clearedLevel);
      turnPhaseRef.current = 'level-clear';
      setTurnPhase('level-clear');
      setAnnouncement(`Level ${outcome.clearedLevel} cleared!`);

      const nextSeq = appendSequenceStep(sequenceRef.current);
      sequenceRef.current = nextSeq;
      setSequence(nextSeq);

      scheduleTimeout(() => {
        if (!pausedRef.current) {
          playSequence(nextSeq);
        }
      }, 650);
    },
    [clearAllTimers, playSequence, scheduleTimeout],
  );

  return (
    <GameShell
      game={game}
      hudScore={`Lvl ${highestCleared}`}
      hudSecondary={`Step ${Math.min(sequence.length, inputIndex + (turnPhase === 'input' ? 1 : 0))} / ${sequence.length || 1}`}
      announcement={announcement}
      onStartRun={handleStartRun}
      onResetRun={handleResetRun}
      onPauseChange={handlePauseChange}
    >
      {({ phase, colorblindMode, completeRun }) => {
        completeRunRef.current = completeRun;

        return (
          <SequenceRecallSurface
            shellPhase={phase}
            turnPhase={turnPhase}
            activePad={activePad}
            level={sequence.length || 1}
            inputIndex={inputIndex}
            colorblindMode={colorblindMode}
            onPadPress={handlePadPress}
          />
        );
      }}
    </GameShell>
  );
}

interface SequenceRecallSurfaceProps {
  shellPhase: string;
  turnPhase: SeqTurnPhase;
  activePad: PadId | null;
  level: number;
  inputIndex: number;
  colorblindMode: boolean;
  onPadPress: (padId: PadId) => void;
}

function SequenceRecallSurface({
  shellPhase,
  turnPhase,
  activePad,
  level,
  inputIndex,
  colorblindMode,
  onPadPress,
}: SequenceRecallSurfaceProps) {
  useEffect(() => {
    if (shellPhase !== 'playing') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === '1') onPadPress(0);
      if (e.key === '2') onPadPress(1);
      if (e.key === '3') onPadPress(2);
      if (e.key === '4') onPadPress(3);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shellPhase, onPadPress]);

  const statusText =
    turnPhase === 'playback'
      ? `Watch Sequence (${level} ${level === 1 ? 'step' : 'steps'})`
      : turnPhase === 'input'
        ? `Your Turn (${inputIndex} / ${level})`
        : turnPhase === 'level-clear'
          ? 'Level Clear! Tempo Increasing...'
          : 'Wrong Pad — Session Complete';

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-5 sm:p-8 gap-6">
      <div
        data-testid="seq-status"
        data-turn-phase={turnPhase}
        className="font-display text-lg sm:text-xl font-bold text-[var(--rr-text)] text-center"
      >
        {statusText}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-5 w-full max-w-[420px]">
        {SEQUENCE_PADS.map((pad) => {
          const isLit = activePad === pad.id;
          const canClick = shellPhase === 'playing' && turnPhase === 'input';

          return (
            <button
              key={pad.id}
              type="button"
              data-testid={`seq-pad-${pad.id}`}
              data-lit={isLit ? 'true' : 'false'}
              disabled={!canClick && turnPhase !== 'playback'}
              aria-label={`${pad.label} pad (Key ${pad.keyHint})`}
              onPointerDown={(e) => {
                if (!canClick) return;
                e.preventDefault();
                onPadPress(pad.id);
              }}
              style={{
                backgroundColor: isLit ? pad.color : `${pad.color}24`,
                borderColor: isLit ? '#FFFFFF' : `${pad.color}88`,
                boxShadow: isLit ? pad.activeGlow : 'none',
                color: isLit ? '#0B0D12' : 'var(--rr-text)',
              }}
              className={`relative flex h-36 sm:h-44 flex-col items-center justify-center rounded-2xl border-2 select-none touch-manipulation transition-all duration-100 ${
                canClick ? 'cursor-pointer active:scale-[0.97]' : 'cursor-default'
              } ${isLit ? 'scale-[1.03]' : ''}`}
            >
              {(colorblindMode || isLit) && (
                <span className="text-3xl sm:text-4xl font-bold mb-1" aria-hidden="true">
                  {pad.symbol}
                </span>
              )}
              <span className="font-display text-base font-bold">
                {pad.label}
              </span>
              <span className="font-mono-tabular mt-1 text-xs opacity-75">
                Key {pad.keyHint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
