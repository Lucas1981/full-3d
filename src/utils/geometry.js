import * as vec3 from '../math/vec3.js';

/** Unit face normal from three world-space triangle vertices (winding-dependent). */
export function triangleNormal(v0, v1, v2) {
  const e1 = vec3.sub(v1, v0);
  const e2 = vec3.sub(v2, v0);
  return vec3.normalize(vec3.cross(e1, e2));
}
