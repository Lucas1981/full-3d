import * as mat4 from './math/mat4.js';
import { cullBackFaces } from './culling.js';
import { drawGeneralTriangleGouraud } from './shaders/gouraud-shaded-rasterizer.js';
import { drawGeneralTriangleGouraudTexture } from './shaders/gouraud-shaded-textured-rasterizer.js';
import { triangleNormal } from './geometry.js';
import { shadeVertex, shadeIntensity } from './lighting/shade-vertex.js';
import { getTexture } from './textures/texture-cache.js';

const FOV_Y = Math.PI / 3;
const NEAR = 0.1;
const FAR = 1000;
const AMBIENT = 0.2;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  get width() { return this.canvas.width; }
  get height() { return this.canvas.height; }
  get aspectRatio() { return this.width / this.height; }

  clear(fillColor = '#000') {
    this.ctx.fillStyle = fillColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  #getContextData() {
    return this.ctx.getImageData(0, 0, this.width, this.height);
  }

  #buildProjection() {
    return mat4.perspective(FOV_Y, this.aspectRatio, NEAR, FAR);
  }

  #toWorldSpace(model, vertex) {
    const t = mat4.transformVec4(model, [vertex[0], vertex[1], vertex[2], 1]);
    return [t[0], t[1], t[2]];
  }

  #toCameraSpace(view, worldVertex) {
    const t = mat4.transformVec4(view, [
      worldVertex[0], worldVertex[1], worldVertex[2], 1,
    ]);
    return [t[0], t[1], t[2]];
  }

  #projectVertex(proj, cameraVertex) {
    const clip = mat4.transformVec4(proj, [
      cameraVertex[0], cameraVertex[1], cameraVertex[2], 1,
    ]);
    const w = clip[3];
    if (w <= 0) return null;

    const ndcX = clip[0] / w;
    const ndcY = clip[1] / w;

    return [
      (ndcX + 1) * 0.5 * this.width,
      (-ndcY + 1) * 0.5 * this.height,
    ];
  }

  #toRasterPoint(point) {
    if (point === null) return null;

    const x = Math.round(point[0]);
    const y = Math.round(point[1]);

    return [
      Math.max(0, Math.min(this.width - 1, x)),
      Math.max(0, Math.min(this.height - 1, y)),
    ];
  }

  #drawTexturedPolygon(poly, indices, worldVerts, faceNormal, cameraSpaceVerts, projected, lights, contextData) {
    const texture = getTexture(poly.texture);
    if (!texture || !poly.uvs) return false;

    const tw = texture.width;
    const th = texture.height;
    const triangle = [];

    for (let corner = 0; corner < 3; corner++) {
      const i = indices[corner];
      const screen = this.#toRasterPoint(projected[i]);
      const depth = -cameraSpaceVerts[i][2];

      if (screen === null || depth <= 0) {
        triangle.length = 0;
        break;
      }

      const intensity = shadeIntensity(
        worldVerts[i],
        faceNormal,
        lights,
        AMBIENT,
      );

      const [u, v] = poly.uvs[corner];
      triangle.push([
        screen[0],
        screen[1],
        intensity,
        0,
        0,
        u * (tw - 1),
        v * (th - 1),
        depth,
      ]);
    }

    if (triangle.length !== 3) return true;

    drawGeneralTriangleGouraudTexture(triangle, texture, contextData);
    return true;
  }

  #drawGouraudPolygon(poly, indices, worldVerts, faceNormal, projected, lights, contextData) {
    const triangle = [];

    for (const i of indices) {
      const screen = this.#toRasterPoint(projected[i]);
      if (screen === null) {
        triangle.length = 0;
        break;
      }

      const lit = shadeVertex(
        worldVerts[i],
        faceNormal,
        poly.materialColor,
        lights,
        AMBIENT,
      );

      triangle.push([screen[0], screen[1], lit[0], lit[1], lit[2]]);
    }

    if (triangle.length !== 3) return;

    drawGeneralTriangleGouraud(triangle, contextData);
  }

  render(mesh, camera, lights = []) {
    const model = mesh.getModelMatrix();
    const view = camera.getViewMatrix();
    const proj = this.#buildProjection();

    const worldVerts = mesh.vertices.map(v => this.#toWorldSpace(model, v));
    const cameraSpaceVerts = worldVerts.map(w => this.#toCameraSpace(view, w));
    const culledPolygons = cullBackFaces(mesh.polygons, cameraSpaceVerts);
    const projected = cameraSpaceVerts.map(v => this.#projectVertex(proj, v));
    const contextData = this.#getContextData();

    for (const poly of culledPolygons) {
      if (!poly.show) continue;

      const indices = poly.vertexIndices;
      const w0 = worldVerts[indices[0]];
      const w1 = worldVerts[indices[1]];
      const w2 = worldVerts[indices[2]];
      const faceNormal = triangleNormal(w0, w1, w2);

      if (poly.texture && this.#drawTexturedPolygon(
        poly, indices, worldVerts, faceNormal, cameraSpaceVerts, projected, lights, contextData,
      )) {
        continue;
      }

      this.#drawGouraudPolygon(
        poly, indices, worldVerts, faceNormal, projected, lights, contextData,
      );
    }

    this.ctx.putImageData(contextData, 0, 0);
  }
}
