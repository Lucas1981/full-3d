import * as mat4 from '../math/mat4.js';
import * as vec3 from '../math/vec3.js';
import { Polygon } from './polygon.js';
import { hexToRgba } from '../utils/color.js';

/** Local-space center for bounding-sphere tests (meshes are authored around the origin). */
const LOCAL_ORIGIN = [0, 0, 0];

export class Mesh {
  /**
   * @param {{ vertices: {x,y,z}[], polygons: object[] }} json
   */
  constructor(json) {
    this.vertices = json.vertices.map(v => [v.x, v.y, v.z]);
    this.polygons = json.polygons.map(
      p => new Polygon({
        materialColor: hexToRgba(p.color),
        vertexIndices: p.vertexIndices,
        texture: p.texture ?? null,
        uvs: p.uvs ?? null,
        shade: p.shade ?? 'gouraud',
      }),
    );

    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale    = { x: 1, y: 1, z: 1 };

    let radius = 0;
    for (const v of this.vertices) {
      const d = vec3.length(v);
      if (d > radius) radius = d;
    }
    this.boundingRadius = radius;
  }

  /** Local-space bounding sphere center (always the mesh origin). */
  get boundingCenter() {
    return LOCAL_ORIGIN;
  }

  /**
   * World-space bounding sphere after the model transform.
   * Radius is scaled conservatively by the largest scale factor.
   */
  getWorldBounds() {
    const model = this.getModelMatrix();
    const world = mat4.transformVec4(model, [0, 0, 0, 1]);
    const scale = Math.max(
      Math.abs(this.scale.x),
      Math.abs(this.scale.y),
      Math.abs(this.scale.z),
    );
    return {
      center: [world[0], world[1], world[2]],
      radius: this.boundingRadius * scale,
    };
  }

  /** Unique texture filenames referenced by this mesh. */
  getTextureNames() {
    return [...new Set(
      this.polygons.map(p => p.texture).filter(Boolean),
    )];
  }

  getModelMatrix() {
    const T  = mat4.translation(this.position.x, this.position.y, this.position.z);
    const Rx = mat4.rotationX(this.rotation.x);
    const Ry = mat4.rotationY(this.rotation.y);
    const Rz = mat4.rotationZ(this.rotation.z);
    const S  = mat4.scaling(this.scale.x, this.scale.y, this.scale.z);
    return mat4.multiply(T, mat4.multiply(Rx, mat4.multiply(Ry, mat4.multiply(Rz, S))));
  }
}
