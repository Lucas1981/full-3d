import * as mat4 from './math/mat4.js';
import { cullBackFaces } from './culling.js';

const FOV_Y = Math.PI / 3; // 60°
const NEAR  = 0.1;
const FAR   = 1000;

export class Renderer {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
  }

  get width()       { return this.canvas.width; }
  get height()      { return this.canvas.height; }
  get aspectRatio() { return this.width / this.height; }

  clear(fillColor = '#000') {
    this.ctx.fillStyle = fillColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Model-view matrix: View * Model (local → camera space).
   */
  #buildMV(mesh, camera) {
    const model = mesh.getModelMatrix();
    const view  = camera.getViewMatrix();
    return mat4.multiply(view, model);
  }

  #buildProjection() {
    return mat4.perspective(FOV_Y, this.aspectRatio, NEAR, FAR);
  }

  /** Transform a local-space point through MV into camera-space [x, y, z]. */
  #toCameraSpace(mv, vertex) {
    const t = mat4.transformVec4(mv, [vertex[0], vertex[1], vertex[2], 1]);
    return [t[0], t[1], t[2]];
  }

  /**
   * Projects a camera-space vertex through P into canvas pixel coords.
   * Returns { x, y } or null when behind the near plane (w ≤ 0).
   */
  #projectVertex(proj, cameraVertex) {
    const clip = mat4.transformVec4(proj, [
      cameraVertex[0], cameraVertex[1], cameraVertex[2], 1,
    ]);
    const w = clip[3];
    if (w <= 0) return null;

    const ndcX = clip[0] / w;
    const ndcY = clip[1] / w;

    return {
      x: ( ndcX + 1) * 0.5 * this.width,
      y: (-ndcY + 1) * 0.5 * this.height,
    };
  }

  /**
   * Draws a single mesh as a coloured wireframe.
   * Pipeline: MV → backface cull → P → draw visible polygons.
   */
  drawMesh(mesh, camera) {
    const mv   = this.#buildMV(mesh, camera);
    const proj = this.#buildProjection();

    const cameraSpaceVerts = mesh.vertices.map(v => this.#toCameraSpace(mv, v));
    cullBackFaces(mesh.polygons, cameraSpaceVerts);

    const ctx = this.ctx;

    for (const poly of mesh.polygons) {
      if (!poly.show) continue;

      const pts = poly.vertexIndices.map(i =>
        this.#projectVertex(proj, cameraSpaceVerts[i]),
      );

      if (pts.some(p => p === null)) continue;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = poly.color;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }
  }
}
