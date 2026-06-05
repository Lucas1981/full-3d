/**
 * View-frustum culling via bounding sphere vs six clip planes.
 * Planes are extracted from the combined projection × view matrix (world space).
 */

/**
 * @param {Float32Array} m  Row-major 4×4 where clip = m * worldPos
 * @returns {number[][]}  Six normalized planes [nx, ny, nz, w]; inside when dot(n,p)+w >= 0
 */
export function extractFrustumPlanes(m) {
  const rows = [
    [m[0], m[1], m[2], m[3]],
    [m[4], m[5], m[6], m[7]],
    [m[8], m[9], m[10], m[11]],
    [m[12], m[13], m[14], m[15]],
  ];

  const combos = [
    [3, 0, 1],
    [3, 0, -1],
    [3, 1, 1],
    [3, 1, -1],
    [3, 2, 1],
    [3, 2, -1],
  ];

  return combos.map(([r3, rA, sign]) => {
    const plane = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      plane[i] = rows[r3][i] + sign * rows[rA][i];
    }
    const len = Math.hypot(plane[0], plane[1], plane[2]);
    if (len < 1e-10) return plane;
    return [plane[0] / len, plane[1] / len, plane[2] / len, plane[3] / len];
  });
}

/**
 * True when the sphere lies entirely outside the frustum (safe to skip drawing).
 *
 * @param {number[]} center  World-space [x, y, z]
 * @param {number} radius
 * @param {number[][]} planes
 */
export function isSphereOutsideFrustum(center, radius, planes) {
  for (const plane of planes) {
    const dist =
      plane[0] * center[0] +
      plane[1] * center[1] +
      plane[2] * center[2] +
      plane[3];
    if (dist < -radius) return true;
  }
  return false;
}
