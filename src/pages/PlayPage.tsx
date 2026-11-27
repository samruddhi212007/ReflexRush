import { useParams } from 'react-router-dom';
import { ColorClashGame } from '../games/color-clash/ColorClashGame';
import { ColorSnapGame } from '../games/color-snap/ColorSnapGame';
import { FocusFrenzyGame } from '../games/focus-frenzy/FocusFrenzyGame';
import { GridGeniusGame } from '../games/grid-genius/GridGeniusGame';
import { QuickTapGame } from '../games/quick-tap/QuickTapGame';
import { SequenceRecallGame } from '../games/sequence-recall/SequenceRecallGame';
import { getGameById } from '../lib/registry';
import { NotFoundPage } from './NotFoundPage';

export function PlayPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const game = getGameById(gameId);

  if (!game) {
    return <NotFoundPage />;
  }

  switch (game.id) {
    case 'color-snap':
      return <ColorSnapGame game={game} />;
    case 'sequence-recall':
      return <SequenceRecallGame game={game} />;
    case 'grid-genius':
      return <GridGeniusGame game={game} />;
    case 'color-clash':
      return <ColorClashGame game={game} />;
    case 'quick-tap':
      return <QuickTapGame game={game} />;
    case 'focus-frenzy':
      return <FocusFrenzyGame game={game} />;
  }
}
