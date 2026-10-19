/** Round to the nearest 0.5 (used for grams). */
export function roundHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/** Round to one decimal to avoid floating point noise (e.g. 2.5 - 0.5). */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
