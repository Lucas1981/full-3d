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
 * View (look-at) matrix.
 *
 * Builds the UVN camera frame, then encodes it as V = R * T:
 *   N = normalize(target − eye)   forward  (maps to camera −Z)
 *   U = normalize(N × worldUp)    right    (maps to camera +X)
 *   V = U × N                     up       (maps to camera +Y, re-orthogonalised)
 *
 * @param {number[]} eye      [x,y,z] camera position
 * @param {number[]} target   [x,y,z] point being looked at
 * @param {number[]} worldUp  [x,y,z] reference up vector (typically [0,1,0])
 */
export function lookAt(eye, target, worldUp) {
  // N — forward
  const nx = target[0] - eye[0];
  const ny = target[1] - eye[1];
  const nz = target[2] - eye[2];
  const nLen = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
  const Nx = nx/nLen, Ny = ny/nLen, Nz = nz/nLen;

  // U — right = N × worldUp, normalised
  let ux = Ny*worldUp[2] - Nz*worldUp[1];
  let uy = Nz*worldUp[0] - Nx*worldUp[2];
  let uz = Nx*worldUp[1] - Ny*worldUp[0];
  const uLen = Math.sqrt(ux*ux + uy*uy + uz*uz) || 1;
  const Ux = ux/uLen, Uy = uy/uLen, Uz = uz/uLen;

  // V — recomputed up = U × N  (guaranteed unit length)
  const Vx = Uy*Nz - Uz*Ny;
  const Vy = Uz*Nx - Ux*Nz;
  const Vz = Ux*Ny - Uy*Nx;

  // Full matrix: rotate world axes into UVN frame, then translate by −eye
  return new Float32Array([
     Ux,  Uy,  Uz,  -(Ux*eye[0] + Uy*eye[1] + Uz*eye[2]),
     Vx,  Vy,  Vz,  -(Vx*eye[0] + Vy*eye[1] + Vz*eye[2]),
    -Nx, -Ny, -Nz,   (Nx*eye[0] + Ny*eye[1] + Nz*eye[2]),
      0,   0,   0,   1,
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
