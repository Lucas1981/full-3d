import * as mat4 from "../math/mat4.js";
import {
  extractFrustumPlanes,
  isSphereOutsideFrustum,
} from "./frustum-culling.js";
import { clipAgainstNearPlane } from "./clip-clip-space.js";
import { drawGeneralTriangle } from "../shaders/flat-shade-rasterizer.js";
import { drawGeneralTriangleGouraud } from "../shaders/gouraud-shaded-rasterizer.js";
import { drawGeneralTriangleGouraudTexture } from "../shaders/gouraud-shaded-textured-rasterizer.js";
import { triangleNormal } from "../utils/geometry.js";
import { shadeVertex, shadeIntensity } from "../lights/shade-vertex.js";
import { getTexture } from "../textures/texture-cache.js";
import { ZBuffer } from "./z-buffer.js";

const FOV_Y = Math.PI / 3;
const NEAR = 0.1;
const FAR = 1000;
const AMBIENT = 1;
/** Avoid division by zero in the perspective divide when clip.w is exactly 0. */
const W_EPS = 1e-8;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  get width() {
    return this.canvas.width;
  }
  get height() {
    return this.canvas.height;
  }
  get aspectRatio() {
    return this.width / this.height;
  }

  clear(fillColor = "#000") {
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

  #safePerspectiveW(w) {
    if (w === 0) return W_EPS;
    if (Math.abs(w) < W_EPS) return w < 0 ? -W_EPS : W_EPS;
    return w;
  }

  #clipToScreen(x, y, w) {
    const safeW = this.#safePerspectiveW(w);
    const ndcX = x / safeW;
    const ndcY = y / safeW;
    return [(ndcX + 1) * 0.5 * this.width, (-ndcY + 1) * 0.5 * this.height];
  }

  #worldPos(pt) {
    return [pt.wx, pt.wy, pt.wz];
  }

  #cameraDepth(view, worldPos) {
    const cam = mat4.transformVec4(view, [...worldPos, 1]);
    return -cam[2];
  }

  #cornerUv(poly, pt, cornerIdx) {
    if (pt.u !== undefined && pt.v !== undefined) {
      return [pt.u, pt.v];
    }
    return poly.uvs[cornerIdx];
  }

  #buildClipMesh(mesh, view, proj) {
    const model = mesh.getModelMatrix();
    const mvp = mat4.multiply(proj, mat4.multiply(view, model));
    const worldVerts = mesh.vertices.map((v) => this.#toWorldSpace(model, v));

    const clipPoints = mesh.vertices.map((_, i) => {
      const clip = mat4.transformVec4(mvp, [
        mesh.vertices[i][0],
        mesh.vertices[i][1],
        mesh.vertices[i][2],
        1,
      ]);
      return {
        x: clip[0],
        y: clip[1],
        z: clip[2],
        w: clip[3],
        wx: worldVerts[i][0],
        wy: worldVerts[i][1],
        wz: worldVerts[i][2],
      };
    });

    const clipResult = clipAgainstNearPlane({
      points: clipPoints,
      polygons: mesh.polygons.map((poly) => ({
        materialColor: poly.materialColor,
        texture: poly.texture,
        shade: poly.shade,
        vertexIndices: poly.vertexIndices,
        uvs: poly.uvs,
      })),
    });

    return { ...clipResult, clipPoints, worldVerts };
  }

  #drawClippedTexturedPolygon(
    poly,
    points,
    indices,
    faceNormal,
    view,
    lights,
    contextData,
    zBuffer,
  ) {
    const texture = getTexture(poly.texture);
    if (!texture) return;

    const tw = texture.width;
    const th = texture.height;
    const triangle = [];

    for (let corner = 0; corner < 3; corner++) {
      const idx = indices[corner];
      const pt = points[idx];
      const screen = this.#clipToScreen(pt.x, pt.y, pt.w);
      const worldPos = this.#worldPos(pt);
      const depth = this.#cameraDepth(view, worldPos);

      const intensity = shadeIntensity(worldPos, faceNormal, lights, AMBIENT);

      const [u, v] = this.#cornerUv(poly, pt, corner);
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

    drawGeneralTriangleGouraudTexture(triangle, texture, contextData, zBuffer);
  }

  #drawClippedFlatPolygon(
    poly,
    points,
    indices,
    faceNormal,
    view,
    lights,
    contextData,
    zBuffer,
  ) {
    const w0 = this.#worldPos(points[indices[0]]);
    const w1 = this.#worldPos(points[indices[1]]);
    const w2 = this.#worldPos(points[indices[2]]);
    const centroid = [
      (w0[0] + w1[0] + w2[0]) / 3,
      (w0[1] + w1[1] + w2[1]) / 3,
      (w0[2] + w1[2] + w2[2]) / 3,
    ];
    const lit = shadeVertex(
      centroid,
      faceNormal,
      poly.materialColor,
      lights,
      AMBIENT,
    );
    const color = [lit[0], lit[1], lit[2], 255];
    const triangle = [];

    for (const idx of indices) {
      const pt = points[idx];
      const screen = this.#clipToScreen(pt.x, pt.y, pt.w);
      const depth = this.#cameraDepth(view, this.#worldPos(pt));
      triangle.push([screen[0], screen[1], depth]);
    }

    drawGeneralTriangle(triangle, color, contextData, zBuffer);
  }

  #drawClippedGouraudPolygon(
    poly,
    points,
    indices,
    faceNormal,
    view,
    lights,
    contextData,
    zBuffer,
  ) {
    const triangle = [];

    for (const idx of indices) {
      const pt = points[idx];
      const screen = this.#clipToScreen(pt.x, pt.y, pt.w);
      const worldPos = this.#worldPos(pt);
      const lit = shadeVertex(
        worldPos,
        faceNormal,
        poly.materialColor,
        lights,
        AMBIENT,
      );
      const depth = this.#cameraDepth(view, worldPos);

      triangle.push([screen[0], screen[1], lit[0], lit[1], lit[2], depth]);
    }

    drawGeneralTriangleGouraud(triangle, contextData, zBuffer);
  }

  #renderClippedMesh(mesh, view, proj, lights, contextData, zBuffer) {
    const { points, polygons } = this.#buildClipMesh(mesh, view, proj);

    for (const poly of polygons) {
      const indices = poly.vertexIndices;
      const w0 = this.#worldPos(points[indices[0]]);
      const w1 = this.#worldPos(points[indices[1]]);
      const w2 = this.#worldPos(points[indices[2]]);
      const faceNormal = triangleNormal(w0, w1, w2);

      if (poly.texture) {
        this.#drawClippedTexturedPolygon(
          poly,
          points,
          indices,
          faceNormal,
          view,
          lights,
          contextData,
          zBuffer,
        );
        continue;
      }

      if (poly.shade === "flat") {
        this.#drawClippedFlatPolygon(
          poly,
          points,
          indices,
          faceNormal,
          view,
          lights,
          contextData,
          zBuffer,
        );
      } else {
        this.#drawClippedGouraudPolygon(
          poly,
          points,
          indices,
          faceNormal,
          view,
          lights,
          contextData,
          zBuffer,
        );
      }
    }

  }

  /**
   * @param {import('../scene/mesh.js').Mesh[]} meshes  Drawn in order (later = on top without z-buffer).
   */
  render(meshes, camera, lights = []) {
    const view = camera.getViewMatrix();
    const proj = this.#buildProjection();
    const contextData = this.#getContextData();

    if (
      !this.zBuffer ||
      this.zBuffer.width !== this.width ||
      this.zBuffer.height !== this.height
    ) {
      this.zBuffer = new ZBuffer(this.width, this.height);
    }
    this.zBuffer.clear();

    const viewProj = mat4.multiply(proj, view);
    const frustumPlanes = extractFrustumPlanes(viewProj);
    for (const mesh of meshes) {
      const { center, radius } = mesh.getWorldBounds();
      if (isSphereOutsideFrustum(center, radius, frustumPlanes)) {
        continue;
      }

      this.#renderClippedMesh(
        mesh,
        view,
        proj,
        lights,
        contextData,
        this.zBuffer,
      );
    }

    this.ctx.putImageData(contextData, 0, 0);
  }
}
