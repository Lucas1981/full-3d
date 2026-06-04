import * as vec3 from '../math/vec3.js';
import { LightType } from './light-types.js';

/**
 * Spotlight — cone from position along direction with distance attenuation.
 * @param {object} opts
 * @param {number[]} opts.position     [x, y, z] world space
 * @param {number[]} opts.direction    Normalized axis the light shines along (into scene)
 * @param {number[]} [opts.color]      [r, g, b] 0–255
 * @param {number}   [opts.intensity]
 * @param {number}   [opts.angle]      Outer cone half-angle in radians
 * @param {number}   [opts.penumbra]  0–1; inner cone = angle * (1 - penumbra)
 * @param {number}   [opts.constant]
 * @param {number}   [opts.linear]
 * @param {number}   [opts.quadratic]
 */
export class SpotLight {
  constructor({
    position,
    direction,
    color = [255, 255, 255],
    intensity = 1,
    angle = Math.PI / 7,
    penumbra = 0.35,
    constant = 1,
    linear = 0.09,
    quadratic = 0.032,
  }) {
    this.type       = LightType.SPOT;
    this.position   = [...position];
    this.direction  = vec3.normalize(direction);
    this.color      = color;
    this.intensity  = intensity;
    this.cosOuter   = Math.cos(angle);
    this.cosInner   = Math.cos(angle * (1 - penumbra));
    this.constant   = constant;
    this.linear     = linear;
    this.quadratic  = quadratic;
  }
}
