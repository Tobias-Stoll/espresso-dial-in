import type { Archetype, GrindChange, Prescription, Rotation } from './types';

/**
 * German UI copy for prescriptions. Kept separate from the engine logic
 * so the designer can iterate on wording without touching the rules.
 */

export interface PrescriptionCopy {
  headline: string;
  detail: string;
  /** Optional secondary line, e.g. the "try something" nudge or the extended hint. */
  extra?: string;
}

const formatNumber = (n: number): string => n.toLocaleString('de-DE', { maximumFractionDigits: 1 });

const ROTATION_TEXT: Record<Rotation, string> = {
  CLOCKWISE: 'im Uhrzeigersinn',
  COUNTER_CLOCKWISE: 'gegen den Uhrzeigersinn',
};

function amountText(archetype: Archetype, amount: number): string {
  switch (archetype) {
    case 'CLICKS':
      return `${formatNumber(amount)} ${amount === 1 ? 'Klick' : 'Klicks'}`;
    case 'STEPLESS':
      return amount === 0.5 ? 'eine halbe Markierung' : `${formatNumber(amount)} Markierungen`;
    case 'MACRO_STEPS':
      return `${formatNumber(amount)} ${amount === 1 ? 'Stufe' : 'Stufen'}`;
  }
}

/** "Mahle 2 Klicks feiner" */
export function grindHeadline(archetype: Archetype, change: GrindChange): string {
  const dir = change.direction === 'FINER' ? 'feiner' : 'gröber';
  return `Mahle ${amountText(archetype, change.amount)} ${dir}`;
}

/** "Von 14 auf 12" (+ rotation for stepless) */
export function grindDetail(change: GrindChange): string {
  const base = `Von ${formatNumber(change.fromSetting)} auf ${formatNumber(change.toSetting)}`;
  return change.rotation ? `${base}, ${ROTATION_TEXT[change.rotation]} drehen` : base;
}

const HINT_TEXT = 'Noch nicht perfekt? Prüfe auch Verteilung und Tampen. (Weitere Hilfe folgt.)';

export function prescriptionCopy(p: Prescription, archetype: Archetype): PrescriptionCopy {
  switch (p.type) {
    case 'CALIBRATED':
      return {
        headline: 'Rezept gespeichert',
        detail: 'Dein Espresso schmeckt. Diese Einstellung ist jetzt im Kaffeeregal.',
        extra: p.optionalTip
          ? `Neugierig? Probier beim nächsten Mal: ${grindHeadline(archetype, p.optionalTip)}.`
          : undefined,
      };

    case 'ADJUST_GRIND': {
      const why =
        p.reason === 'TOO_FAST'
          ? 'Der Espresso lief zu schnell durch.'
          : p.reason === 'TOO_SLOW'
            ? 'Der Espresso lief zu langsam durch.'
            : 'Die Menge ist am Limit, jetzt hilft nur die Mühle.';
      return {
        headline: grindHeadline(archetype, p.grind),
        detail: `${why} ${grindDetail(p.grind)}.`,
        extra: p.hint ? HINT_TEXT : undefined,
      };
    }

    case 'ADJUST_YIELD': {
      const y = p.yieldChange;
      const more = y.direction === 'INCREASE';
      return {
        headline: `Beziehe ${formatNumber(y.toYieldG)} g statt ${formatNumber(y.fromYieldG)} g`,
        detail: more
          ? 'Mühle bleibt so. Etwas mehr in die Tasse zähmt die Säure.'
          : 'Mühle bleibt so. Früher stoppen nimmt die Bitterkeit raus.',
        extra: p.hint ? HINT_TEXT : undefined,
      };
    }
  }
}
