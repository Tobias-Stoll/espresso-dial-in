/**
 * Core domain types for the Espresso Dial-In calibration engine.
 * Pure TypeScript, no React Native imports, so the engine is fully unit-testable.
 */

export type Archetype = 'CLICKS' | 'STEPLESS' | 'MACRO_STEPS';

/** Does the number on the grinder go DOWN or UP when grinding finer? */
export type FinerDirection = 'DECREASE' | 'INCREASE';

/** For stepless grinders: which way do you turn to grind finer? */
export type Rotation = 'CLOCKWISE' | 'COUNTER_CLOCKWISE';

export type RoastLevel = 'LIGHT' | 'MEDIUM' | 'DARK';

export type Taste = 'SOUR' | 'BALANCED' | 'BITTER';

export type GrindDirection = 'FINER' | 'COARSER';

export interface GrinderProfile {
  archetype: Archetype;
  finerDirection: FinerDirection;
  /** Only relevant for STEPLESS grinders. */
  finerRotation?: Rotation;
  /** Current setting as shown on the grinder, e.g. 14 or 2.5 */
  currentSetting: number;
}

export interface Recipe {
  doseG: number;
  targetYieldG: number;
  /** Target time window in seconds (inclusive). */
  timeMinSec: number;
  timeMaxSec: number;
}

export interface ShotInput {
  /** 1-based iteration counter for this bean. */
  runNumber: number;
  doseG: number;
  yieldG: number;
  timeSec: number;
  taste: Taste;
}

export interface GrindChange {
  direction: GrindDirection;
  /** Amount in grinder units: 2 clicks, 0.5 marks, 1 step. */
  amount: number;
  fromSetting: number;
  toSetting: number;
  /** Only for STEPLESS: which way to turn. */
  rotation?: Rotation;
  /** True if the target setting had to be clamped at 0. */
  clamped: boolean;
}

export interface YieldChange {
  direction: 'INCREASE' | 'DECREASE';
  deltaG: number;
  fromYieldG: number;
  toYieldG: number;
}

/** Placeholder for the "extended help" flow after shot 3. Will be expanded later. */
export type Hint = 'EXTENDED_DIAL_IN';

export type Prescription =
  | {
      type: 'CALIBRATED';
      /** Optional nudge to experiment further, when taste is good but time is off. */
      optionalTip?: GrindChange;
      hint?: undefined;
    }
  | { type: 'ADJUST_GRIND'; grind: GrindChange; reason: 'TOO_FAST' | 'TOO_SLOW' | 'YIELD_LIMIT'; hint?: Hint }
  | { type: 'ADJUST_YIELD'; yieldChange: YieldChange; hint?: Hint };
