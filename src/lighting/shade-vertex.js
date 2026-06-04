import * as vec3 from '../math/vec3.js';

function clamp255(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/**
 * Per-vertex Lambert shading in world space.
 * @param {number[]} worldPos     Vertex position in world space
 * @param {number[]} worldNormal  Face or vertex normal (world space)
 * @param {number[]} material     [r, g, b, a] material color 0–255
 * @param {object[]} lights
 * @param {number}   ambient      Ambient factor 0–1
 * @returns {[number, number, number]} lit [r, g, b]
 */
export function shadeVertex(worldPos, worldNormal, material, lights, ambient = 0.2) {
  void worldPos; // used by point/spot lights later
  const N = vec3.normalize(worldNormal);

  let r = material[0] * ambient;
  let g = material[1] * ambient;
  let b = material[2] * ambient;

  for (const light of lights) {
    if (light.type !== 'directional') continue;

    const diff = Math.max(0, vec3.dot(N, light.direction));
    const k = diff * light.intensity;

    r += material[0] * (light.color[0] / 255) * k;
    g += material[1] * (light.color[1] / 255) * k;
    b += material[2] * (light.color[2] / 255) * k;
  }

  return [clamp255(r), clamp255(g), clamp255(b)];
}
