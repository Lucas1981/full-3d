import * as mat4 from './math/mat4.js';
import { cullBackFaces } from './culling.js';
import { drawGeneralTriangle } from './flat-shade-rasterizer.js';
import { hexToRgba } from './color.js';

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

  /** ImageData buffer the rasterizer writes into. */
  #getContextData() {
    return this.ctx.getImageData(0, 0, this.width, this.height);
  }

  #buildMV(mesh, camera) {
    const model = mesh.getModelMatrix();
    const view  = camera.getViewMatrix();
    return mat4.multiply(view, model);
  }

  #buildProjection() {
    return mat4.perspective(FOV_Y, this.aspectRatio, NEAR, FAR);
  }

  #toCameraSpace(mv, vertex) {
    const t = mat4.transformVec4(mv, [vertex[0], vertex[1], vertex[2], 1]);
    return [t[0], t[1], t[2]];
  }

  /**
   * Projects a camera-space vertex through P into canvas pixel coords [x, y].
   * Returns null when behind the near plane (w ≤ 0).
   */
  #projectVertex(proj, cameraVertex) {
    const clip = mat4.transformVec4(proj, [
      cameraVertex[0], cameraVertex[1], cameraVertex[2], 1,
    ]);
    const w = clip[3];
    if (w <= 0) return null;

    const ndcX = clip[0] / w;
    const ndcY = clip[1] / w;

    return [
      ( ndcX + 1) * 0.5 * this.width,
      (-ndcY + 1) * 0.5 * this.height,
    ];
  }

  /**
   * Round to integer pixel coords and clamp to the canvas so raster indices stay valid.
   * @param {[number, number] | null} point
   * @returns {[number, number] | null}
   */
  #toRasterPoint(point) {
    if (point === null) return null;

    const x = Math.round(point[0]);
    const y = Math.round(point[1]);

    return [
      Math.max(0, Math.min(this.width - 1, x)),
      Math.max(0, Math.min(this.height - 1, y)),
    ];
  }

  /**
   * Flat-shaded solid render.
   * Pipeline: MV → backface cull → P → rasterize visible triangles.
   */
  render(mesh, camera) {
    const mv   = this.#buildMV(mesh, camera);
    const proj = this.#buildProjection();

    const cameraSpaceVerts = mesh.vertices.map(v => this.#toCameraSpace(mv, v));
    cullBackFaces(mesh.polygons, cameraSpaceVerts);

    const projected = cameraSpaceVerts.map(v => this.#projectVertex(proj, v));
    const contextData = this.#getContextData();

    for (const poly of mesh.polygons) {
      if (!poly.show) continue;

      const triangle = poly.vertexIndices.map(i => this.#toRasterPoint(projected[i]));
      if (triangle.some(p => p === null)) continue;

      drawGeneralTriangle(triangle, hexToRgba(poly.color), contextData);
    }

    this.ctx.putImageData(contextData, 0, 0);
  }
}
