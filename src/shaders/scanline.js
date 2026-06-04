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
