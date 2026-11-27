import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <main className="mx-auto flex max-w-[1440px] flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <div className="font-mono-tabular text-5xl font-extrabold text-[#8B5CF6] dark:text-[#C4B5FD]">
        404
      </div>
      <h1 className="font-display mt-3 text-3xl font-bold text-[var(--rr-text)]">
        Arena Not Found
      </h1>
      <p className="mt-2 max-w-md text-sm text-[var(--rr-text-muted)]">
        The training route you requested does not exist. Jump back to the games grid to pick a discipline.
      </p>
      <Link
        to="/games"
        className="pill-cta mt-7 inline-flex items-center gap-2 rounded-full bg-[#8B5CF6] px-6 py-3 text-sm font-bold text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Back to Games</span>
      </Link>
    </main>
  );
}
