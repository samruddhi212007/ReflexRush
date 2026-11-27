import { HashRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { AppStateProvider } from './hooks/useAppState';
import { GamesPage } from './pages/GamesPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlayPage } from './pages/PlayPage';
import { StatsPage } from './pages/StatsPage';

export default function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <div className="min-h-screen bg-[var(--rr-canvas)] text-[var(--rr-text)]">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/play/:gameId" element={<PlayPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </HashRouter>
    </AppStateProvider>
  );
}
