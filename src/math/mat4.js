/**
 * 4×4 matrix utilities, row-major layout: index = row * 4 + col.
 * Convention: column vectors on the right → v' = M * v.
 *
 * Layout visualised:
 *   [ 0  1  2  3 ]   row 0
 *   [ 4  5  6  7 ]   row 1
 *   [ 8  9 10 11 ]   row 2
 *   [12 13 14 15 ]   row 3
 */

export function identity() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

/** C = A * B */
export function multiply(a, b) {
  const out = new Float32Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[r * 4 + k] * b[k * 4 + c];
      }
      out[r * 4 + c] = sum;
    }
  }
  return out;
}

export function translation(tx, ty, tz) {
  return new Float32Array([
    1, 0, 0, tx,
    0, 1, 0, ty,
    0, 0, 1, tz,
    0, 0, 0,  1,
  ]);
}

export function scaling(sx, sy, sz) {
  return new Float32Array([
    sx,  0,  0, 0,
     0, sy,  0, 0,
     0,  0, sz, 0,
     0,  0,  0, 1,
  ]);
}

export function rotationX(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    1,  0,  0, 0,
    0,  c, -s, 0,
    0,  s,  c, 0,
    0,  0,  0, 1,
  ]);
}

export function rotationY(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
     c, 0, s, 0,
     0, 1, 0, 0,
    -s, 0, c, 0,
     0, 0, 0, 1,
  ]);
}

export function rotationZ(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    c, -s, 0, 0,
    s,  c, 0, 0,
    0,  0, 1, 0,
    0,  0, 0, 1,
  ]);
}

/**
 * Standard perspective projection (right-handed, camera looks down −Z).
 * @param {number} fovY  Vertical field of view in radians.
 * @param {number} aspect  width / height.
 * @param {number} near  Positive near-plane distance.
 * @param {number} far   Positive far-plane distance.
 */
export function perspective(fovY, aspect, near, far) {
  const f   = 1.0 / Math.tan(fovY / 2);
  const nf  = 1.0 / (near - far);
  return new Float32Array([
    f / aspect,  0,                    0,                      0,
    0,           f,                    0,                      0,
    0,           0,  (far + near) * nf,      2 * far * near * nf,
    0,           0,                   -1,                      0,
  ]);
}

/**
 * Multiply a mat4 by a vec4 [x, y, z, w].
 * Returns [x', y', z', w'].
 */
export function transformVec4(m, v) {
  return [
    m[ 0] * v[0] + m[ 1] * v[1] + m[ 2] * v[2] + m[ 3] * v[3],
    m[ 4] * v[0] + m[ 5] * v[1] + m[ 6] * v[2] + m[ 7] * v[3],
    m[ 8] * v[0] + m[ 9] * v[1] + m[10] * v[2] + m[11] * v[3],
    m[12] * v[0] + m[13] * v[1] + m[14] * v[2] + m[15] * v[3],
  ];
}
