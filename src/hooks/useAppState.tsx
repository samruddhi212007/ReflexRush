import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { soundEngine } from '../lib/audio';
import {
  loadAppState,
  recordSessionInState,
  saveAppState,
} from '../lib/storage';
import type {
  GameId,
  StoredAppState,
  ThemeMode,
} from '../types/game';

interface RecordSessionResult {
  isNewBest: boolean;
  previousBest: number | undefined;
}

interface AppStateContextValue {
  state: StoredAppState;
  setPlayerName: (name: string) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleMuted: () => void;
  toggleColorblindMode: () => void;
  recordGameSession: (
    gameId: GameId,
    score: number,
    durationMs: number,
    meta?: Record<string, number | string>,
  ) => RecordSessionResult;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoredAppState>(() => loadAppState());

  useEffect(() => {
    const isDark = state.preferences.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, [state.preferences.theme]);

  useEffect(() => {
    soundEngine.setMuted(state.preferences.muted);
  }, [state.preferences.muted]);

  const updateAndPersist = useCallback(
    (updater: (prev: StoredAppState) => StoredAppState) => {
      setState((prev) => {
        const next = updater(prev);
        saveAppState(next);
        return next;
      });
    },
    [],
  );

  const setPlayerName = useCallback(
    (name: string) => {
      const cleaned = name.trim().slice(0, 32) || 'Player 1';
      updateAndPersist((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          playerName: cleaned,
        },
      }));
    },
    [updateAndPersist],
  );

  const setTheme = useCallback(
    (theme: ThemeMode) => {
      updateAndPersist((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          theme,
        },
      }));
    },
    [updateAndPersist],
  );

  const toggleTheme = useCallback(() => {
    updateAndPersist((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        theme: prev.preferences.theme === 'dark' ? 'light' : 'dark',
      },
    }));
  }, [updateAndPersist]);

  const toggleMuted = useCallback(() => {
    updateAndPersist((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        muted: !prev.preferences.muted,
      },
    }));
  }, [updateAndPersist]);

  const toggleColorblindMode = useCallback(() => {
    updateAndPersist((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        colorblindMode: !prev.preferences.colorblindMode,
      },
    }));
  }, [updateAndPersist]);

  const recordGameSession = useCallback(
    (
      gameId: GameId,
      score: number,
      durationMs: number,
      meta?: Record<string, number | string>,
    ): RecordSessionResult => {
      let result: RecordSessionResult = {
        isNewBest: false,
        previousBest: undefined,
      };
      setState((prev) => {
        const recorded = recordSessionInState(prev, gameId, score, durationMs, meta);
        result = {
          isNewBest: recorded.isNewBest,
          previousBest: recorded.previousBest,
        };
        saveAppState(recorded.nextState);
        return recorded.nextState;
      });
      return result;
    },
    [],
  );

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      setPlayerName,
      setTheme,
      toggleTheme,
      toggleMuted,
      toggleColorblindMode,
      recordGameSession,
    }),
    [
      state,
      setPlayerName,
      setTheme,
      toggleTheme,
      toggleMuted,
      toggleColorblindMode,
      recordGameSession,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}
