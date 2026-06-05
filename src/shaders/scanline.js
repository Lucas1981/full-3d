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

/** Clamp exclusive vertical loop end to the bottom screen edge. */
export function clampMaxVertical(yEnd, height) {
  return Math.min(yEnd, height);
}

/** Span is entirely past the right edge of the screen. */
export function isSpanPastRightEdge(left, width) {
  return left > width - 1;
}
