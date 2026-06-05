/** Minimum horizontal span treated as a single pixel (avoids diagonal gaps). */
export const SPAN_EPS = 1e-6;

export function inclusiveSpan(cxl, cxr) {
  const left = Math.ceil(Math.min(cxl, cxr));
  const right = Math.ceil(Math.max(cxl, cxr));
  return { left, right };
}

export function isDegenerateSpan(cxl, cxr) {
  return Math.abs(cxr - cxl) < SPAN_EPS;
}

/** Clamp inclusive horizontal end to the right screen edge (no interpolant fix needed). */
export function clampMaxHorizontal(right, width) {
  return Math.min(right, width - 1);
}

/** Clamp inclusive horizontal start to the left screen edge. */
export function clampMinHorizontal(left) {
  return Math.max(0, left);
}

/** Span is entirely past the left edge of the screen. */
export function isSpanPastLeftEdge(right) {
  return right < 0;
}

/** Interpolate a value along an edge at fractional x between c0 and c1. */
export function lerpAlongEdge(c0, c1, v0, v1, c) {
  if (Math.abs(c1 - c0) < SPAN_EPS) return v0;
  const t = (c - c0) / (c1 - c0);
  return v0 + (v1 - v0) * t;
}

/** Clamp exclusive vertical loop end to the bottom screen edge. */
export function clampMaxVertical(yEnd, height) {
  return Math.min(yEnd, height);
}

/** Span is entirely past the right edge of the screen. */
export function isSpanPastRightEdge(left, width) {
  return left > width - 1;
}

/** Triangle's lowest scanline is above the framebuffer. */
export function isTriangleAboveScreen(yBottom) {
  return yBottom <= 0;
}

/**
 * Clip scanline start to y >= 0, advancing edge state from yStart by `steps` rows.
 * @param {number} yStart
 * @param {(steps: number) => void} advanceBy  Applies per-row deltas × steps
 * @returns {number}  cy where drawing should begin (always >= 0)
 */
export function clipMinVerticalStart(yStart, advanceBy) {
  if (yStart >= 0) return yStart;
  advanceBy(-yStart);
  return 0;
}
