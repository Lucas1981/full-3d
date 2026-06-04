import * as vec3 from '../math/vec3.js';

function clamp255(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function applyDiffuse(material, lightColor, k, r, g, b) {
  return [
    r + material[0] * (lightColor[0] / 255) * k,
    g + material[1] * (lightColor[1] / 255) * k,
    b + material[2] * (lightColor[2] / 255) * k,
  ];
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
  const N = vec3.normalize(worldNormal);

  let r = material[0] * ambient;
  let g = material[1] * ambient;
  let b = material[2] * ambient;

  for (const light of lights) {
    if (light.type === 'directional') {
      const diff = Math.max(0, vec3.dot(N, light.direction));
      const k = diff * light.intensity;
      [r, g, b] = applyDiffuse(material, light.color, k, r, g, b);
    } else if (light.type === 'point') {
      const toLight = vec3.sub(light.position, worldPos);
      const dist = vec3.length(toLight);
      if (dist === 0) continue;

      const L = vec3.scale(toLight, 1 / dist);
      const diff = Math.max(0, vec3.dot(N, L));
      const atten = 1 / (
        light.constant + light.linear * dist + light.quadratic * dist * dist
      );
      const k = diff * light.intensity * atten;
      [r, g, b] = applyDiffuse(material, light.color, k, r, g, b);
    }
  }

  return [clamp255(r), clamp255(g), clamp255(b)];
}
