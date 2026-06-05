/**
 * Screen-space culling for projected triangles.
 *
 * Uses the triangle's axis-aligned bounding box after perspective divide.
 * If the AABB does not overlap the framebuffer, the triangle cannot cover any
 * on-screen pixels (triangles are convex). Partially visible triangles overlap
 * and are kept for rasterizer edge clipping.
 *
 * @param {[number, number][]} screenVerts  Three [x, y] corners in pixel space
 * @param {number} width
 * @param {number} height
 * @returns {boolean}  true when the triangle is entirely off-screen
 */
export function isTriangleOutsideScreen(screenVerts, width, height) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const [x, y] of screenVerts) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return true;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return maxX < 0 || minX >= width || maxY < 0 || minY >= height;
}
