/**
 * Point light — radiates from a world-space position with distance attenuation.
 * @param {object} opts
 * @param {number[]} opts.position     [x, y, z] in world space
 * @param {number[]} [opts.color]      [r, g, b] 0–255
 * @param {number}   [opts.intensity]
 * @param {number}   [opts.constant]   Attenuation constant term
 * @param {number}   [opts.linear]     Attenuation linear term
 * @param {number}   [opts.quadratic]  Attenuation quadratic term
 */
export class PointLight {
  constructor({
    position,
    color = [255, 255, 255],
    intensity = 1,
    constant = 1,
    linear = 0.09,
    quadratic = 0.032,
  }) {
    this.type       = 'point';
    this.position   = [...position];
    this.color      = color;
    this.intensity  = intensity;
    this.constant   = constant;
    this.linear     = linear;
    this.quadratic  = quadratic;
  }
}
