import * as mat4 from './math/mat4.js';

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
   * Assembles MVP = Projection * View * Model.
   * View is an identity matrix — camera sits at the world origin, looking down −Z.
   */
  #buildMVP(mesh) {
    const model = mesh.getModelMatrix();
    const view  = mat4.identity();
    const proj  = mat4.perspective(FOV_Y, this.aspectRatio, NEAR, FAR);
    return mat4.multiply(proj, mat4.multiply(view, model));
  }

  /**
   * Projects a local-space vertex through the MVP matrix into canvas pixel coords.
   * Returns { x, y } in pixels (origin at canvas top-left, Y↓), or null when the
   * vertex is behind the near plane (w ≤ 0).
   */
  #projectVertex(mvp, vertex) {
    const clip = mat4.transformVec4(mvp, [vertex[0], vertex[1], vertex[2], 1]);
    const w = clip[3];
    if (w <= 0) return null;

    const ndcX =  clip[0] / w;
    const ndcY =  clip[1] / w;

    // Map NDC [−1,1] → pixel coords; centre of NDC maps to centre of canvas.
    // Y is flipped because canvas Y increases downward.
    return {
      x: ( ndcX + 1) * 0.5 * this.width,
      y: (-ndcY + 1) * 0.5 * this.height,
    };
  }

  /** Draws a single mesh as a coloured wireframe. */
  drawMesh(mesh) {
    const mvp = this.#buildMVP(mesh);
    const ctx = this.ctx;

    const projected = mesh.vertices.map(v => this.#projectVertex(mvp, v));

    for (const { color, vertexIndices } of mesh.polygons) {
      const pts = vertexIndices.map(i => projected[i]);

      // Skip the polygon if any vertex ended up behind the camera
      if (pts.some(p => p === null)) continue;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }
  }
}
