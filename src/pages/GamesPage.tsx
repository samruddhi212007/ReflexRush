import { useMemo, useState } from 'react';
import { GameCard } from '../components/GameCard';
import { useAppState } from '../hooks/useAppState';
import { GAME_REGISTRY } from '../lib/registry';
import type { GameCategory } from '../types/game';

const CATEGORIES: Array<'All' | GameCategory> = [
  'All',
  'Speed',
  'Memory',
  'Spatial',
  'Focus',
  'Reflex',
  'Visual',
];

export function GamesPage() {
  const { state } = useAppState();
  const [selectedCategory, setSelectedCategory] = useState<'All' | GameCategory>('All');

  const filteredGames = useMemo(() => {
    if (selectedCategory === 'All') return GAME_REGISTRY;
    return GAME_REGISTRY.filter((g) => g.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-12">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--rr-text)] text-balance">
            Training Disciplines
          </h1>
          <p className="mt-2 text-base text-[var(--rr-text-muted)]">
            Six targeted cognitive and reflex drills. Choose a discipline to benchmark your speed, memory, and visual focus.
          </p>
        </div>

        {/* Category Filter Segmented Control */}
        <div
          role="tablist"
          aria-label="Filter games by category"
          className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--rr-border)] bg-[var(--rr-surface)] p-1 self-start lg:self-auto"
        >
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#8B5CF6] text-white shadow-sm'
                    : 'text-[var(--rr-text-muted)] hover:text-[var(--rr-text)]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            personalBest={state.personalBests[game.id]}
          />
        ))}
      </div>
    </main>
  );
}
