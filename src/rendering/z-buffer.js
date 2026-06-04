/**
 * Per-pixel 1/z depth buffer. Larger values are closer to the camera (nearer ∞).
 * Cleared to 0 each frame (nothing drawn yet).
 */
export class ZBuffer {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Float32Array(width * height);
  }

  clear() {
    this.data.fill(0);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} invZ  Interpolated 1/z (must be > 0)
   * @returns {boolean}  true if the pixel should be drawn and the buffer was updated
   */
  tryCommit(x, y, invZ) {
    if (invZ <= 0) return false;

    const ix = x | 0;
    const iy = y | 0;
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) return false;

    const idx = iy * this.width + ix;
    if (this.data[idx] >= invZ) return false;

    this.data[idx] = invZ;
    return true;
  }
}
