import * as mat4 from './math/mat4.js';
import { Polygon } from './polygon.js';
import { hexToRgba } from './color.js';

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
      }),
    );

    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale    = { x: 1, y: 1, z: 1 };
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
