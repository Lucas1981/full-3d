import * as vec3 from '../math/vec3.js';
import { LightType } from './light-types.js';

/**
 * Directional light — parallel rays, defined in world space.
 * @param {object} opts
 * @param {number[]} opts.direction  Normalized direction light travels (sceneward).
 * @param {number[]} [opts.color]    [r, g, b] 0–255
 * @param {number}   [opts.intensity]
 */
export class DirectionalLight {
  constructor({ direction, color = [255, 255, 255], intensity = 1 }) {
    this.type      = LightType.DIRECTIONAL;
    this.direction = vec3.normalize(direction);
    this.color     = color;
    this.intensity = intensity;
  }
}
