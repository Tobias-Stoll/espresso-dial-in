import { EXTENDED_HINT_FROM_RUN, MAX_RATIO, MIN_RATIO, TIME_BUFFER_SEC, YIELD_STEP_G } from './constants';
import { computeGrindChange } from './grinder';
import { roundHalf } from './math';
import type { GrinderProfile, Hint, Prescription, Recipe, ShotInput } from './types';

/**
 * Deterministic calibration engine (Engine v2, agreed 2026-10-19).
 *
 * Rules, in priority order:
 *  1. Taste wins: BALANCED always calibrates. If time was clearly off
 *     (outside window + buffer), attach an optional grind tip to experiment.
 *  2. SOUR/BITTER and time clearly off (outside window + buffer): change grind.
 *       too fast -> finer, too slow -> coarser.
 *  3. SOUR/BITTER and time OK: change yield by +/-4 g (SOUR more, BITTER less),
 *     clamped to ratio 1:1.5 ... 1:3. If the limit leaves no room to move,
 *     fall back to grind (SOUR -> finer, BITTER -> coarser).
 *
 * Exactly ONE variable is changed per prescription.
 * From run 3 on without calibration, a placeholder hint is attached.
 */
export function evaluateShot(shot: ShotInput, recipe: Recipe, grinder: GrinderProfile): Prescription {
  const tooFast = shot.timeSec < recipe.timeMinSec - TIME_BUFFER_SEC;
  const tooSlow = shot.timeSec > recipe.timeMaxSec + TIME_BUFFER_SEC;

  // Rule 1: taste wins
  if (shot.taste === 'BALANCED') {
    if (tooFast) return { type: 'CALIBRATED', optionalTip: computeGrindChange(grinder, 'FINER') };
    if (tooSlow) return { type: 'CALIBRATED', optionalTip: computeGrindChange(grinder, 'COARSER') };
    return { type: 'CALIBRATED' };
  }

  const hint: Hint | undefined = shot.runNumber >= EXTENDED_HINT_FROM_RUN ? 'EXTENDED_DIAL_IN' : undefined;

  // Rule 2: time clearly off -> grind
  if (tooFast) {
    return { type: 'ADJUST_GRIND', grind: computeGrindChange(grinder, 'FINER'), reason: 'TOO_FAST', hint };
  }
  if (tooSlow) {
    return { type: 'ADJUST_GRIND', grind: computeGrindChange(grinder, 'COARSER'), reason: 'TOO_SLOW', hint };
  }

  // Rule 3: time OK -> yield, within ratio limits
  const minYield = roundHalf(shot.doseG * MIN_RATIO);
  const maxYield = roundHalf(shot.doseG * MAX_RATIO);
  const base = shot.yieldG;

  if (shot.taste === 'SOUR') {
    const target = Math.min(roundHalf(base + YIELD_STEP_G), maxYield);
    if (target > base) {
      return {
        type: 'ADJUST_YIELD',
        yieldChange: { direction: 'INCREASE', deltaG: target - base, fromYieldG: base, toYieldG: target },
        hint,
      };
    }
    return { type: 'ADJUST_GRIND', grind: computeGrindChange(grinder, 'FINER'), reason: 'YIELD_LIMIT', hint };
  }

  // BITTER
  const target = Math.max(roundHalf(base - YIELD_STEP_G), minYield);
  if (target < base) {
    return {
      type: 'ADJUST_YIELD',
      yieldChange: { direction: 'DECREASE', deltaG: base - target, fromYieldG: base, toYieldG: target },
      hint,
    };
  }
  return { type: 'ADJUST_GRIND', grind: computeGrindChange(grinder, 'COARSER'), reason: 'YIELD_LIMIT', hint };
}
