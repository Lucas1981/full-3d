import * as vec3 from './math/vec3.js';

/**
 * View-space backface culling.
 * Sets each polygon's `show` from the camera-space winding / normal test.
 *
 * @param {import('./polygon.js').Polygon[]} polygons
 * @param {number[][]} cameraSpaceVerts  [x,y,z] per vertex index
 */
export function cullBackFaces(polygons, cameraSpaceVerts) {
  for (const poly of polygons) {
    const indices = poly.vertexIndices;
    const v0 = cameraSpaceVerts[indices[0]];
    const v1 = cameraSpaceVerts[indices[1]];
    const v2 = cameraSpaceVerts[indices[2]];

    const e1 = vec3.sub(v1, v0);
    const e2 = vec3.sub(v2, v0);

    const n = vec3.cross(e1, e2);

    // dot(n, -v0) > 0  ≡  dot(n, v0) < 0
    poly.show = vec3.dot(n, v0) < 0;
  }
}
