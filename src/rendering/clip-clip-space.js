/**
 * Near-plane clipping in homogeneous clip space.
 *
 * After the MVP transform, the near plane maps to z_clip = 0. Points with
 * z_clip > 0 are in front of the near plane (inside the frustum).
 *
 * Clipping here — before the perspective divide — is the natural place in a
 * mat4 pipeline: it avoids division by zero and correctly handles vertices
 * that straddle the camera. Clip-space components (x, y, z, w) and world-space
 * position are interpolated at cut edges so the subsequent perspective divide
 * and shading stay correct for newly created boundary vertices.
 *
 * Gouraud / textured intensity is not stored here — the renderer recomputes it
 * from the interpolated world position (wx, wy, wz) and the clipped triangle
 * normal at rasterization time, which is correct for diffuse lighting.
 */

/**
 * @param {{ x, y, z, w, u, v, wx, wy, wz }} a  inside vertex (z > 0)
 * @param {{ x, y, z, w, u, v, wx, wy, wz }} b  outside vertex (z ≤ 0)
 */
function intersect(a, b) {
  const t = a.z / (a.z - b.z);
  return {
    x: a.x + t * (b.x - a.x),
    y: a.y + t * (b.y - a.y),
    z: 0,
    w: a.w + t * (b.w - a.w),
    u: a.u + t * (b.u - a.u),
    v: a.v + t * (b.v - a.v),
    wx: a.wx + t * (b.wx - a.wx),
    wy: a.wy + t * (b.wy - a.wy),
    wz: a.wz + t * (b.wz - a.wz),
  };
}

/**
 * @param {{ x, y, z, w, u, v, wx, wy, wz }[]} verts
 * @returns {{ x, y, z, w, u, v, wx, wy, wz }[]}
 */
function clipPolygon(verts) {
  const output = [];

  for (let i = 0; i < verts.length; i++) {
    const current = verts[i];
    const next = verts[(i + 1) % verts.length];

    const currentInside = current.z > 0;
    const nextInside = next.z > 0;

    if (currentInside) {
      output.push(current);
      if (!nextInside) {
        output.push(intersect(current, next));
      }
    } else if (nextInside) {
      output.push(intersect(current, next));
    }
  }

  return output;
}

function polygonUvs(polygon) {
  return polygon.uv ?? polygon.uvs ?? null;
}

/**
 * Clips each polygon of a clip-space mesh against the near plane (z_clip > 0)
 * and fan-triangulates the results. Expects vertices already in clip space —
 * the MVP transform is a separate upstream step.
 *
 * When no clipping is needed, output polygons keep the original vertex indices
 * into the shared points array (no duplication). New points are appended only
 * for intersection vertices created during clipping.
 *
 * @param {{
 *   points: { x, y, z, w, wx, wy, wz }[],
 *   polygons: object[],
 * }} mesh
 */
export function clipAgainstNearPlane(mesh) {
  const points = [...mesh.points];
  const outPolygons = [];
  let clippingOccurred = false;

  for (const polygon of mesh.polygons) {
    const uvs = polygonUvs(polygon);
    const clipVerts = polygon.vertexIndices.map((idx, vi) => ({
      ...mesh.points[idx],
      u: uvs ? uvs[vi][0] : 0,
      v: uvs ? uvs[vi][1] : 0,
    }));

    const anyOutside = clipVerts.some((v) => v.z <= 0);

    if (!anyOutside) {
      outPolygons.push({
        materialColor: polygon.materialColor,
        texture: polygon.texture,
        shade: polygon.shade,
        vertexIndices: [...polygon.vertexIndices],
        uvs: uvs ? uvs.map(([u, v]) => [u, v]) : null,
      });
      continue;
    }

    clippingOccurred = true;

    const clipped = clipPolygon(clipVerts);

    if (clipped.length < 3) continue;

    const base = points.length;
    points.push(...clipped);

    for (let i = 1; i < clipped.length - 1; i++) {
      outPolygons.push({
        materialColor: polygon.materialColor,
        texture: polygon.texture,
        shade: polygon.shade,
        vertexIndices: [base, base + i, base + i + 1],
      });
    }
  }

  return { points, polygons: outPolygons, clippingOccurred };
}
