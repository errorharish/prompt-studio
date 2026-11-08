// Pure value rules shared by RangeSlider and NumberField so both always agree.

/** Clamp to [min, max] and snap to the nearest step counted from `min`. */
export function clampStep(value: number, min: number, max: number, step: number): number {
  if (!Number.isFinite(value)) return min;
  const clamped = Math.min(max, Math.max(min, value));
  const snapped = min + Math.round((clamped - min) / step) * step;
  // Remove floating-point noise (e.g. 0.30000000000000004) and re-clamp after snapping.
  const decimals = (String(step).split(".")[1] ?? "").length;
  return Math.min(max, Math.max(min, Number(snapped.toFixed(decimals))));
}

/** Position of `value` between min and max as 0–1 (used for track fill and marks). */
export function fraction(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}
