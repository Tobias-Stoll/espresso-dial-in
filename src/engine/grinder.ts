import { GRIND_STEP } from './constants';
import { round1 } from './math';
import type { GrindChange, GrindDirection, GrinderProfile, Rotation } from './types';

const opposite = (r: Rotation): Rotation => (r === 'CLOCKWISE' ? 'COUNTER_CLOCKWISE' : 'CLOCKWISE');

/**
 * Hardware abstraction: translate "finer/coarser" into a relative change
 * on the user's specific grinder, respecting its finer direction.
 */
export function computeGrindChange(grinder: GrinderProfile, direction: GrindDirection): GrindChange {
  const amount = GRIND_STEP[grinder.archetype];

  // Does the number go down for this change?
  const numberGoesDown =
    (direction === 'FINER' && grinder.finerDirection === 'DECREASE') ||
    (direction === 'COARSER' && grinder.finerDirection === 'INCREASE');

  const raw = round1(grinder.currentSetting + (numberGoesDown ? -amount : amount));
  const clamped = raw < 0;
  const toSetting = clamped ? 0 : raw;

  let rotation: Rotation | undefined;
  if (grinder.archetype === 'STEPLESS' && grinder.finerRotation) {
    rotation = direction === 'FINER' ? grinder.finerRotation : opposite(grinder.finerRotation);
  }

  return {
    direction,
    amount,
    fromSetting: grinder.currentSetting,
    toSetting,
    rotation,
    clamped,
  };
}
