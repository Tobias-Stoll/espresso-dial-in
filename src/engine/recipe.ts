import { DEFAULT_DOSE_G, ROAST_DEFAULTS } from './constants';
import { roundHalf } from './math';
import type { Recipe, RoastLevel } from './types';

/** Start recipe for a new bean, based on its roast level. */
export function getStartRecipe(roast: RoastLevel, doseG: number = DEFAULT_DOSE_G): Recipe {
  const d = ROAST_DEFAULTS[roast];
  return {
    doseG,
    targetYieldG: roundHalf(doseG * d.ratio),
    timeMinSec: d.timeMinSec,
    timeMaxSec: d.timeMaxSec,
  };
}
