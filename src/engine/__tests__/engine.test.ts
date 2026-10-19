import { describe, expect, it } from '@jest/globals';
import {
  computeGrindChange,
  evaluateShot,
  getStartRecipe,
  grindHeadline,
  prescriptionCopy,
  type GrinderProfile,
  type ShotInput,
} from '..';

const clicks: GrinderProfile = { archetype: 'CLICKS', finerDirection: 'DECREASE', currentSetting: 14 };
const clicksReversed: GrinderProfile = { archetype: 'CLICKS', finerDirection: 'INCREASE', currentSetting: 14 };
const stepless: GrinderProfile = {
  archetype: 'STEPLESS',
  finerDirection: 'DECREASE',
  finerRotation: 'CLOCKWISE',
  currentSetting: 2.5,
};
const macro: GrinderProfile = { archetype: 'MACRO_STEPS', finerDirection: 'DECREASE', currentSetting: 8 };

const dark = getStartRecipe('DARK'); // 18 -> 36 g, 24-27 s

const shot = (over: Partial<ShotInput>): ShotInput => ({
  runNumber: 1,
  doseG: 18,
  yieldG: 36,
  timeSec: 26,
  taste: 'BALANCED',
  ...over,
});

describe('getStartRecipe', () => {
  it('matches PRD defaults per roast', () => {
    expect(getStartRecipe('DARK')).toEqual({ doseG: 18, targetYieldG: 36, timeMinSec: 24, timeMaxSec: 27 });
    expect(getStartRecipe('MEDIUM').targetYieldG).toBe(39.5);
    expect(getStartRecipe('LIGHT').targetYieldG).toBe(43);
  });
});

describe('computeGrindChange (hardware abstraction)', () => {
  it('clicks: finer = number down by 2', () => {
    expect(computeGrindChange(clicks, 'FINER')).toMatchObject({ amount: 2, fromSetting: 14, toSetting: 12 });
  });
  it('respects reversed finer direction', () => {
    expect(computeGrindChange(clicksReversed, 'FINER').toSetting).toBe(16);
    expect(computeGrindChange(clicksReversed, 'COARSER').toSetting).toBe(12);
  });
  it('stepless: 0.5 marks and rotation follows finer/coarser', () => {
    expect(computeGrindChange(stepless, 'FINER')).toMatchObject({ toSetting: 2, rotation: 'CLOCKWISE' });
    expect(computeGrindChange(stepless, 'COARSER')).toMatchObject({ toSetting: 3, rotation: 'COUNTER_CLOCKWISE' });
  });
  it('macro: 1 step', () => {
    expect(computeGrindChange(macro, 'COARSER').toSetting).toBe(9);
  });
  it('clamps at 0', () => {
    const c = computeGrindChange({ ...clicks, currentSetting: 1 }, 'FINER');
    expect(c).toMatchObject({ toSetting: 0, clamped: true });
  });
});

describe('evaluateShot – Rule 1: taste wins', () => {
  it('balanced in window -> calibrated, no tip', () => {
    expect(evaluateShot(shot({}), dark, clicks)).toEqual({ type: 'CALIBRATED' });
  });
  it('balanced but very fast -> calibrated + optional finer tip', () => {
    const p = evaluateShot(shot({ timeSec: 18 }), dark, clicks);
    expect(p.type).toBe('CALIBRATED');
    if (p.type === 'CALIBRATED') expect(p.optionalTip?.direction).toBe('FINER');
  });
  it('balanced but very slow -> calibrated + optional coarser tip', () => {
    const p = evaluateShot(shot({ timeSec: 35 }), dark, clicks);
    if (p.type !== 'CALIBRATED') throw new Error('expected CALIBRATED');
    expect(p.optionalTip?.direction).toBe('COARSER');
  });
  it('balanced slightly off (within buffer) -> no tip', () => {
    expect(evaluateShot(shot({ timeSec: 22 }), dark, clicks)).toEqual({ type: 'CALIBRATED' });
  });
});

describe('evaluateShot – Rule 2: time clearly off -> grind', () => {
  it('sour + too fast -> finer', () => {
    const p = evaluateShot(shot({ taste: 'SOUR', timeSec: 18 }), dark, clicks);
    expect(p).toMatchObject({ type: 'ADJUST_GRIND', reason: 'TOO_FAST', grind: { direction: 'FINER', toSetting: 12 } });
  });
  it('bitter + too slow -> coarser', () => {
    const p = evaluateShot(shot({ taste: 'BITTER', timeSec: 34 }), dark, clicks);
    expect(p).toMatchObject({ type: 'ADJUST_GRIND', reason: 'TOO_SLOW', grind: { direction: 'COARSER' } });
  });
  it('buffer boundary: exactly min-2 s is NOT too fast', () => {
    const p = evaluateShot(shot({ taste: 'SOUR', timeSec: 22 }), dark, clicks);
    expect(p.type).toBe('ADJUST_YIELD');
  });
  it('buffer boundary: just below min-2 s is too fast', () => {
    const p = evaluateShot(shot({ taste: 'SOUR', timeSec: 21.9 }), dark, clicks);
    expect(p.type).toBe('ADJUST_GRIND');
  });
  it('uses the roast-specific window (light is slower)', () => {
    // 23 s is fine for DARK (24-2=22) but too fast for LIGHT (27-2=25)
    const light = getStartRecipe('LIGHT');
    expect(evaluateShot(shot({ taste: 'SOUR', timeSec: 23 }), dark, clicks).type).toBe('ADJUST_YIELD');
    expect(evaluateShot(shot({ taste: 'SOUR', timeSec: 23, yieldG: 43 }), light, clicks).type).toBe('ADJUST_GRIND');
  });
});

describe('evaluateShot – Rule 3: time OK -> yield', () => {
  it('sour -> +4 g', () => {
    const p = evaluateShot(shot({ taste: 'SOUR' }), dark, clicks);
    expect(p).toMatchObject({ type: 'ADJUST_YIELD', yieldChange: { direction: 'INCREASE', fromYieldG: 36, toYieldG: 40 } });
  });
  it('bitter -> -4 g', () => {
    const p = evaluateShot(shot({ taste: 'BITTER' }), dark, clicks);
    expect(p).toMatchObject({ type: 'ADJUST_YIELD', yieldChange: { direction: 'DECREASE', toYieldG: 32 } });
  });
  it('sour clamps at ratio 1:3', () => {
    const p = evaluateShot(shot({ taste: 'SOUR', yieldG: 52 }), dark, clicks);
    expect(p).toMatchObject({ type: 'ADJUST_YIELD', yieldChange: { toYieldG: 54, deltaG: 2 } });
  });
  it('sour at ratio limit -> falls back to finer grind', () => {
    const p = evaluateShot(shot({ taste: 'SOUR', yieldG: 54 }), dark, clicks);
    expect(p).toMatchObject({ type: 'ADJUST_GRIND', reason: 'YIELD_LIMIT', grind: { direction: 'FINER' } });
  });
  it('bitter at ratio 1:1.5 -> falls back to coarser grind', () => {
    const p = evaluateShot(shot({ taste: 'BITTER', yieldG: 27 }), dark, clicks);
    expect(p).toMatchObject({ type: 'ADJUST_GRIND', reason: 'YIELD_LIMIT', grind: { direction: 'COARSER' } });
  });
  it('never changes two variables at once', () => {
    const p = evaluateShot(shot({ taste: 'SOUR' }), dark, clicks);
    expect('grind' in p && 'yieldChange' in p).toBe(false);
  });
});

describe('extended hint placeholder', () => {
  it('not attached on runs 1-2', () => {
    expect(evaluateShot(shot({ taste: 'SOUR', runNumber: 2 }), dark, clicks).hint).toBeUndefined();
  });
  it('attached from run 3 when not calibrated', () => {
    expect(evaluateShot(shot({ taste: 'SOUR', runNumber: 3 }), dark, clicks).hint).toBe('EXTENDED_DIAL_IN');
  });
  it('never attached when calibrated', () => {
    expect(evaluateShot(shot({ runNumber: 5 }), dark, clicks).hint).toBeUndefined();
  });
});

describe('German copy', () => {
  it('clicks: "Mahle 2 Klicks feiner"', () => {
    expect(grindHeadline('CLICKS', computeGrindChange(clicks, 'FINER'))).toBe('Mahle 2 Klicks feiner');
  });
  it('stepless: half mark + rotation', () => {
    const p = evaluateShot(shot({ taste: 'SOUR', timeSec: 15 }), dark, stepless);
    const c = prescriptionCopy(p, 'STEPLESS');
    expect(c.headline).toBe('Mahle eine halbe Markierung feiner');
    expect(c.detail).toContain('Von 2,5 auf 2, im Uhrzeigersinn drehen');
  });
  it('macro: "Mahle 1 Stufe gröber"', () => {
    expect(grindHeadline('MACRO_STEPS', computeGrindChange(macro, 'COARSER'))).toBe('Mahle 1 Stufe gröber');
  });
  it('yield copy', () => {
    const c = prescriptionCopy(evaluateShot(shot({ taste: 'SOUR' }), dark, clicks), 'CLICKS');
    expect(c.headline).toBe('Beziehe 40 g statt 36 g');
  });
  it('calibrated with tip', () => {
    const c = prescriptionCopy(evaluateShot(shot({ timeSec: 18 }), dark, clicks), 'CLICKS');
    expect(c.headline).toBe('Rezept gespeichert');
    expect(c.extra).toContain('Mahle 2 Klicks feiner');
  });
});
