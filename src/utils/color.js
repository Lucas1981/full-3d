/**
 * @param {string} hex  '#rrggbb' or 'rrggbb'
 * @returns {[number, number, number, number]}  [r, g, b, a] in 0–255
 */
export function hexToRgba(hex) {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}
