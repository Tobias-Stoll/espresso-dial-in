import type { Archetype, RoastLevel } from './types';

export const DEFAULT_DOSE_G = 18;

/** Start ratio and target time window per roast level (from PRD 6.2). */
export const ROAST_DEFAULTS: Record<RoastLevel, { ratio: number; timeMinSec: number; timeMaxSec: number }> = {
  DARK: { ratio: 2.0, timeMinSec: 24, timeMaxSec: 27 },
  MEDIUM: { ratio: 2.2, timeMinSec: 25, timeMaxSec: 29 },
  LIGHT: { ratio: 2.4, timeMinSec: 27, timeMaxSec: 31 },
};

/**
 * Grind is only changed when time is MORE than this many seconds outside the window.
 * Prevents ping-ponging, since one grind step can move time by several seconds.
 */
export const TIME_BUFFER_SEC = 2;

/** Yield correction per iteration when flow is fine but taste is off. */
export const YIELD_STEP_G = 4;

/** Allowed brew ratio range (yield / dose). */
export const MIN_RATIO = 1.5;
export const MAX_RATIO = 3.0;

/** Grind step size per archetype, in the grinder's own units. */
export const GRIND_STEP: Record<Archetype, number> = {
  CLICKS: 2,
  STEPLESS: 0.5,
  MACRO_STEPS: 1,
};

/** From this run on (without calibration), the extended-help hint is attached. */
export const EXTENDED_HINT_FROM_RUN = 3;
