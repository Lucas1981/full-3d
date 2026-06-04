import * as mat4 from '../math/mat4.js';
import * as vec3 from '../math/vec3.js';

/**
 * UVN camera.
 *
 * The three orthonormal axes that define the camera's orientation are:
 *   N — forward  (normalised direction from position toward target)
 *   U — right    (N × worldUp, normalised)
 *   V — up       (U × N, re-orthogonalised so it stays perpendicular to both)
 *
 * The view matrix is produced by lookAt(position, target, worldUp).
 */
export class Camera {
  constructor() {
    this.position = [0, 0, 0];
    this.target   = [0, 0, -1]; // looking down −Z by default
    this.worldUp  = [0, 1, 0];  // Y-up world
  }

  // ── Derived UVN axes ──────────────────────────────────────────────────────

  /** Forward direction (unit vector from position toward target). */
  get n() {
    return vec3.normalize(vec3.sub(this.target, this.position));
  }

  /** Right direction (N × worldUp, normalised). */
  get u() {
    return vec3.normalize(vec3.cross(this.n, this.worldUp));
  }

  /** Up direction (U × N, guaranteed orthogonal to both). */
  get v() {
    return vec3.cross(this.u, this.n);
  }

  // ── Matrix ────────────────────────────────────────────────────────────────

  /** Returns the 4×4 view matrix for this camera. */
  getViewMatrix() {
    return mat4.lookAt(this.position, this.target, this.worldUp);
  }

  // ── Convenience movement helpers ──────────────────────────────────────────

  /** Move camera and target together along an axis. */
  #translate(axis, amount) {
    const delta = vec3.scale(axis, amount);
    this.position = vec3.add(this.position, delta);
    this.target   = vec3.add(this.target,   delta);
  }

  moveForward(amount)  { this.#translate(this.n,  amount); }
  moveRight(amount)    { this.#translate(this.u,  amount); }
  moveUp(amount)       { this.#translate(this.worldUp, amount); }
}
