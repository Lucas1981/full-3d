import * as vec3 from "../math/vec3.js";
import { LightType } from "../lights/light-types.js";

function clamp255(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Diffuse RGB contribution from material × light color × intensity factor k. */
function diffuseContribution(material, lightColor, k) {
  return [
    material[0] * (lightColor[0] / 255) * k,
    material[1] * (lightColor[1] / 255) * k,
    material[2] * (lightColor[2] / 255) * k,
  ];
}

function distanceAttenuation(dist, light) {
  return (
    1 / (light.constant + light.linear * dist + light.quadratic * dist * dist)
  );
}

/**
 * @param {number[]} worldNormal  Unit surface normal
 * @param {number[]} material
 * @param {import('../lights/directional-light.js').DirectionalLight} light
 * @returns {[number, number, number]}
 */
export function generateDirectionalLight(worldNormal, material, light) {
  const diff = Math.max(0, vec3.dot(worldNormal, light.direction));
  const k = diff * light.intensity;
  return diffuseContribution(material, light.color, k);
}

/**
 * @returns {[number, number, number] | null}
 */
export function generatePointLight(worldPos, worldNormal, material, light) {
  const toLight = vec3.sub(light.position, worldPos);
  const dist = vec3.length(toLight);
  if (dist === 0) return null;

  const L = vec3.scale(toLight, 1 / dist);
  const diff = Math.max(0, vec3.dot(worldNormal, L));
  const k = diff * light.intensity * distanceAttenuation(dist, light);
  return diffuseContribution(material, light.color, k);
}

/**
 * @returns {[number, number, number] | null}
 */
export function generateSpotLight(worldPos, worldNormal, material, light) {
  const toLight = vec3.sub(light.position, worldPos);
  const dist = vec3.length(toLight);
  if (dist === 0) return null;

  const L = vec3.scale(toLight, 1 / dist);
  const toSurf = vec3.scale(L, -1);
  const cosAngle = vec3.dot(light.direction, toSurf);

  if (cosAngle < light.cosOuter) return null;

  let spot = 1;
  if (cosAngle < light.cosInner) {
    spot = (cosAngle - light.cosOuter) / (light.cosInner - light.cosOuter);
  }

  const diff = Math.max(0, vec3.dot(worldNormal, L));
  const k = diff * light.intensity * distanceAttenuation(dist, light) * spot;
  return diffuseContribution(material, light.color, k);
}

const LIGHT_GENERATORS = {
  [LightType.DIRECTIONAL]: (_, worldNormal, material, light) =>
    generateDirectionalLight(worldNormal, material, light),
  [LightType.POINT]: (worldPos, worldNormal, material, light) =>
    generatePointLight(worldPos, worldNormal, material, light),
  [LightType.SPOT]: (worldPos, worldNormal, material, light) =>
    generateSpotLight(worldPos, worldNormal, material, light),
};

/**
 * Per-vertex Lambert shading in world space.
 * @param {number[]} worldPos
 * @param {number[]} worldNormal
 * @param {number[]} material     [r, g, b, a] 0–255
 * @param {object[]} lights
 * @param {number}   ambient      0–1
 * @returns {[number, number, number]}
 */
export function shadeVertex(
  worldPos,
  worldNormal,
  material,
  lights,
  ambient = 0.2,
) {
  const N = vec3.normalize(worldNormal);

  let r = material[0] * ambient;
  let g = material[1] * ambient;
  let b = material[2] * ambient;

  for (const light of lights) {
    const generate = LIGHT_GENERATORS[light.type];
    if (!generate) continue;

    const contribution = generate(worldPos, N, material, light);
    if (!contribution) continue;

    r += contribution[0];
    g += contribution[1];
    b += contribution[2];
  }

  return [clamp255(r), clamp255(g), clamp255(b)];
}

/**
 * Scalar Gouraud intensity 0–1 for textured shading (lighting on white).
 */
export function shadeIntensity(worldPos, worldNormal, lights, ambient = 0.2) {
  const lit = shadeVertex(
    worldPos,
    worldNormal,
    [255, 255, 255, 255],
    lights,
    ambient,
  );
  return (lit[0] + lit[1] + lit[2]) / (3 * 255);
}
