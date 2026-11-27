import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Check,
  Eye,
  Gamepad2,
  Home,
  Moon,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { getInitials } from '../lib/scoring';

export function Header() {
  const {
    state,
    setPlayerName,
    toggleTheme,
    toggleMuted,
    toggleColorblindMode,
  } = useAppState();
  const { playerName, theme, muted, colorblindMode } = state.preferences;
  const initials = getInitials(playerName);

  const [menuOpen, setMenuOpen] = useState(false);
  const [draftName, setDraftName] = useState(playerName);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    setDraftName(playerName);
  }, [playerName]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [menuOpen]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    setPlayerName(draftName);
    setMenuOpen(false);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
      isActive
        ? 'text-[var(--rr-text)]'
        : 'text-[var(--rr-text-muted)] hover:text-[var(--rr-text)]'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--rr-border)] bg-[var(--rr-canvas)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Brand Emblem + Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-3 whitespace-nowrap shrink-0 group"
            aria-label="ReflexRush Home"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8B5CF6] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_4px_12px_rgba(139,92,246,0.35)] transition-transform duration-150 group-hover:scale-105"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-current"
                aria-hidden="true"
              >
                <path d="M13.5 2L4 14h7l-1.5 8L20 10h-7l.5-8z" />
              </svg>
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-[var(--rr-text)]">
              ReflexRush
            </span>
          </Link>

          {/* Zone 2: Primary Nav */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-8"
          >
            <NavLink to="/" end className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <span>Home</span>
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-[21px] h-0.5 bg-[#8B5CF6] rounded-full" />
                  )}
                </>
              )}
            </NavLink>
            <NavLink to="/games" className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <span>Games</span>
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-[21px] h-0.5 bg-[#8B5CF6] rounded-full" />
                  )}
                </>
              )}
            </NavLink>
            <NavLink to="/stats" className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <span>Statistics</span>
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-[21px] h-0.5 bg-[#8B5CF6] rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          </nav>

          {/* Zone 3: Sound, Theme & Player Avatar */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleMuted}
              aria-label={muted ? 'Unmute game audio' : 'Mute game audio'}
              title={muted ? 'Unmute sound' : 'Mute sound'}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--rr-border)] bg-[var(--rr-surface)] text-[var(--rr-text-muted)] hover:text-[var(--rr-text)] hover:border-[var(--rr-border-strong)] transition-colors cursor-pointer"
            >
              {muted ? (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
              }
              title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--rr-border)] bg-[var(--rr-surface)] text-[var(--rr-text-muted)] hover:text-[var(--rr-text)] hover:border-[var(--rr-border-strong)] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen((prev) => !prev);
                  setTimeout(() => inputRef.current?.focus(), 20);
                }}
                aria-expanded={menuOpen}
                aria-haspopup="dialog"
                aria-label={`Player profile menu (${playerName})`}
                className="flex h-10 min-w-10 items-center justify-center rounded-full border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 px-2.5 font-mono-tabular text-xs font-bold text-[#8B5CF6] dark:text-[#C4B5FD] hover:bg-[#8B5CF6]/25 transition-colors cursor-pointer whitespace-nowrap"
              >
                {initials}
              </button>

              {menuOpen && (
                <div
                  role="dialog"
                  aria-label="Player Profile Settings"
                  className="absolute right-0 mt-2.5 w-72 rounded-2xl border border-[var(--rr-border-strong)] bg-[var(--rr-surface)] p-4 shadow-2xl z-50"
                >
                  <form onSubmit={handleSaveName} className="space-y-3">
                    <div>
                      <label
                        htmlFor="player-name-input"
                        className="block text-xs font-semibold text-[var(--rr-text-muted)] mb-1.5"
                      >
                        Player Name
                      </label>
                      <div className="flex gap-2">
                        <input
                          ref={inputRef}
                          id="player-name-input"
                          type="text"
                          maxLength={32}
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          placeholder="Player 1"
                          className="w-full rounded-xl border border-[var(--rr-border)] bg-[var(--rr-trough)] px-3 py-2 text-sm text-[var(--rr-text)] placeholder:text-[var(--rr-text-muted)] focus:border-[#8B5CF6] focus:outline-none"
                        />
                        <button
                          type="submit"
                          aria-label="Save player name"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6] text-white hover:brightness-110 transition cursor-pointer"
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-[var(--rr-border)] pt-3">
                      <button
                        type="button"
                        onClick={toggleColorblindMode}
                        role="switch"
                        aria-checked={colorblindMode}
                        className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left text-sm text-[var(--rr-text)] hover:bg-[var(--rr-surface-hover)] transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Eye
                            className="h-4 w-4 text-[var(--rr-text-muted)]"
                            aria-hidden="true"
                          />
                          <span>Colorblind-friendly cues</span>
                        </span>
                        <span
                          className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                            colorblindMode
                              ? 'bg-[#8B5CF6]'
                              : 'bg-[var(--rr-border-strong)]'
                          }`}
                        >
                          <span
                            className={`h-4 w-4 rounded-full bg-white transition-transform ${
                              colorblindMode ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav Bar (compact <= 56px, well under 15% mobile viewport height) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--rr-border)] bg-[var(--rr-canvas)]/95 backdrop-blur-md"
      >
        <div className="grid grid-cols-3 h-14">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                isActive
                  ? 'text-[#8B5CF6] dark:text-[#C4B5FD]'
                  : 'text-[var(--rr-text-muted)]'
              }`
            }
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Home</span>
          </NavLink>
          <NavLink
            to="/games"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                isActive
                  ? 'text-[#8B5CF6] dark:text-[#C4B5FD]'
                  : 'text-[var(--rr-text-muted)]'
              }`
            }
          >
            <Gamepad2 className="h-4 w-4" aria-hidden="true" />
            <span>Games</span>
          </NavLink>
          <NavLink
            to="/stats"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                isActive
                  ? 'text-[#8B5CF6] dark:text-[#C4B5FD]'
                  : 'text-[var(--rr-text-muted)]'
              }`
            }
          >
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            <span>Stats</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
}
