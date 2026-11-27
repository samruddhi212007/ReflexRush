import { pickRandom, randomInt } from '../../lib/rng';

export const FOCUS_FRENZY_TOTAL_MS = 45000;

export type ShapeKind = 'circle' | 'square' | 'triangle' | 'diamond';
export type OutlierKind = 'shape' | 'hue' | 'orientation' | 'shade';

export interface FocusTile {
  index: number;
  shape: ShapeKind;
  color: string;
  rotationDeg: number;
  opacity: number;
  isOutlier: boolean;
}

export interface FocusRoundConfig {
  gridSide: number;
  roundTimerMs: number;
  outlierKind: OutlierKind;
  tiles: FocusTile[];
  outlierIndex: number;
}

const BASE_HUES = [
  { base: '#A78BFA', altHue: '#38BDF8', subtleShade: '#C4B5FD' },
  { base: '#38BDF8', altHue: '#34D399', subtleShade: '#7DD3FC' },
  { base: '#34D399', altHue: '#FBBF24', subtleShade: '#6EE7B7' },
  { base: '#FB7185', altHue: '#FBBF24', subtleShade: '#FDA4AF' },
  { base: '#FBBF24', altHue: '#FB7185', subtleShade: '#FDE047' },
];

export function getRoundDifficultyParams(roundsCleared: number): {
  gridSide: number;
  roundTimerMs: number;
  shadeOpacityDelta: number;
  hueDiffAllowed: boolean;
} {
  const gridSide = roundsCleared < 3 ? 3 : roundsCleared < 9 ? 4 : 5;
  const roundTimerMs = Math.max(1800, 4200 - roundsCleared * 140);
  const shadeOpacityDelta = Math.max(0.18, 0.45 - roundsCleared * 0.02);
  return {
    gridSide,
    roundTimerMs,
    shadeOpacityDelta,
    hueDiffAllowed: roundsCleared < 12,
  };
}

export function generateFocusRound(
  roundsCleared: number,
  colorblindMode: boolean = false,
): FocusRoundConfig {
  const { gridSide, roundTimerMs, shadeOpacityDelta } =
    getRoundDifficultyParams(roundsCleared);
  const total = gridSide * gridSide;
  const outlierIndex = randomInt(0, total - 1);

  const palette = pickRandom(BASE_HUES);
  const shapes: ShapeKind[] = ['circle', 'square', 'triangle', 'diamond'];
  const baseShape = pickRandom(shapes);

  // In colorblind mode, favor shape & orientation differences over subtle hue/shade alone
  const outlierKinds: OutlierKind[] = colorblindMode
    ? ['shape', 'orientation', 'shape', 'shade']
    : roundsCleared < 4
      ? ['shape', 'hue', 'orientation']
      : ['shape', 'hue', 'orientation', 'shade'];

  let outlierKind = pickRandom(outlierKinds);
  // Circle rotation wouldn't look different; ensure non-circle if orientation is picked
  const effectiveBaseShape: ShapeKind =
    outlierKind === 'orientation' && baseShape === 'circle'
      ? 'triangle'
      : baseShape;

  if (outlierKind === 'orientation' && effectiveBaseShape === 'square') {
    // 45 deg rotation makes a square clearly distinct
  }

  let outlierShape: ShapeKind = effectiveBaseShape;
  let outlierColor = palette.base;
  let outlierRotation = 0;
  let outlierOpacity = 0.88;

  if (outlierKind === 'shape') {
    const others = shapes.filter((s) => s !== effectiveBaseShape);
    outlierShape = pickRandom(others);
  } else if (outlierKind === 'hue') {
    outlierColor = palette.altHue;
  } else if (outlierKind === 'orientation') {
    outlierRotation = effectiveBaseShape === 'triangle' ? 180 : 45;
  } else {
    outlierColor = palette.subtleShade;
    outlierOpacity = Math.max(0.35, 0.88 - shadeOpacityDelta);
    if (roundsCleared >= 8) {
      outlierKind = 'shade';
    }
  }

  const tiles: FocusTile[] = Array.from({ length: total }, (_, index) => {
    const isOutlier = index === outlierIndex;
    return {
      index,
      shape: isOutlier ? outlierShape : effectiveBaseShape,
      color: isOutlier ? outlierColor : palette.base,
      rotationDeg: isOutlier ? outlierRotation : 0,
      opacity: isOutlier ? outlierOpacity : 0.88,
      isOutlier,
    };
  });

  return {
    gridSide,
    roundTimerMs,
    outlierKind,
    tiles,
    outlierIndex,
  };
}
