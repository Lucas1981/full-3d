/**
 * Gouraud-shaded triangle rasterization.
 * Vertex format: [x, y, r, g, b, depth]
 *   depth — camera-space depth (positive in front of camera), same as textured shader
 */

import {
  inclusiveSpan,
  isDegenerateSpan,
  clampMaxHorizontal,
  clampMaxVertical,
  isSpanPastRightEdge,
} from './scanline.js';

function plotGouraudPixel(contextData, zBuffer, x, y, invZ, r, g, b) {
  if (!zBuffer.tryCommit(x, y, invZ)) return;

  const base = (y * contextData.width + x) * 4;
  contextData.data[base] = r;
  contextData.data[base + 1] = g;
  contextData.data[base + 2] = b;
  contextData.data[base + 3] = 255;
}

function fillGouraudScanline(
  contextData,
  zBuffer,
  width,
  cy,
  cxl,
  cxr,
  rl,
  gl,
  bl,
  zl,
  rr,
  gr,
  br,
  zr,
) {
  const { left, right } = inclusiveSpan(cxl, cxr);
  if (isSpanPastRightEdge(left, width)) return;

  const drawRight = clampMaxHorizontal(right, width);

  if (isDegenerateSpan(cxl, cxr)) {
    if (left <= drawRight) {
      plotGouraudPixel(contextData, zBuffer, left, cy, zl, rl, gl, bl);
    }
    return;
  }

  const drx = (rr - rl) / (cxr - cxl);
  const dgx = (gr - gl) / (cxr - cxl);
  const dbx = (br - bl) / (cxr - cxl);
  const dzx = (zr - zl) / (cxr - cxl);
  let r = rl;
  let g = gl;
  let b = bl;
  let z = zl;

  for (let i = left; i <= drawRight; i++) {
    plotGouraudPixel(contextData, zBuffer, i, cy, z, r, g, b);
    r += drx;
    g += dgx;
    b += dbx;
    z += dzx;
  }
}

/**
 * Draw a Gouraud triangle. Each vertex is [x, y, r, g, b, depth].
 */
export function drawGeneralTriangleGouraud(triangle, contextData, zBuffer) {
  const width = contextData.width;
  const height = contextData.height;

  const tri = triangle.map((t) => [...t]).sort((a, b) => a[1] - b[1]);

  const y1 = tri[0][1];
  const y2 = tri[1][1];
  const y3 = tri[2][1];

  if (y1 >= height) return;

  let dxdy1 = (tri[1][0] - tri[0][0]) / (tri[1][1] - tri[0][1]);
  let dxdy2 = (tri[2][0] - tri[0][0]) / (tri[2][1] - tri[0][1]);

  let cxl = tri[0][0];
  let cxr = tri[0][0];

  const srl = tri[0][2];
  const sgl = tri[0][3];
  const sbl = tri[0][4];
  const szl = 1 / tri[0][5];
  const erl = tri[1][2];
  const egl = tri[1][3];
  const ebl = tri[1][4];
  const ezl = 1 / tri[1][5];
  const err = tri[2][2];
  const egr = tri[2][3];
  const ebr = tri[2][4];
  const ezr = 1 / tri[2][5];

  const drl1 = (erl - srl) / (y2 - y1);
  const dgl1 = (egl - sgl) / (y2 - y1);
  const dbl1 = (ebl - sbl) / (y2 - y1);
  const dzl1 = (ezl - szl) / (y2 - y1);
  const drr2 = (err - srl) / (y3 - y1);
  const dgr2 = (egr - sgl) / (y3 - y1);
  const dbr2 = (ebr - sbl) / (y3 - y1);
  const dzr2 = (ezr - szl) / (y3 - y1);

  let dxl, dxr, drdl, dgdl, dbdl, dzdl, drdr, dgdr, dbdr, dzdr;

  if (dxdy1 < dxdy2) {
    dxl = dxdy1;
    dxr = dxdy2;
    drdl = drl1;
    dgdl = dgl1;
    dbdl = dbl1;
    dzdl = dzl1;
    drdr = drr2;
    dgdr = dgr2;
    dbdr = dbr2;
    dzdr = dzr2;
  } else {
    dxl = dxdy2;
    dxr = dxdy1;
    drdl = drr2;
    dgdl = dgr2;
    dbdl = dbr2;
    dzdl = dzr2;
    drdr = drl1;
    dgdr = dgl1;
    dbdr = dbl1;
    dzdr = dzl1;
  }

  let rl = srl;
  let gl = sgl;
  let bl = sbl;
  let zl = szl;
  let rr = srl;
  let gr = sgl;
  let br = sbl;
  let zr = szl;

  for (let cy = y1; cy < clampMaxVertical(y2, height); cy++) {
    fillGouraudScanline(
      contextData, zBuffer, width, cy, cxl, cxr, rl, gl, bl, zl, rr, gr, br, zr,
    );

    rl += drdl;
    gl += dgdl;
    bl += dbdl;
    zl += dzdl;
    rr += drdr;
    gr += dgdr;
    br += dbdr;
    zr += dzdr;
    cxl += dxl;
    cxr += dxr;
  }

  if (dxdy1 < dxdy2) {
    dxl = (tri[2][0] - tri[1][0]) / (tri[2][1] - tri[1][1]);
    cxl = tri[1][0];
    rl = erl;
    gl = egl;
    bl = ebl;
    zl = ezl;
    drdl = (err - erl) / (y3 - y2);
    dgdl = (egr - egl) / (y3 - y2);
    dbdl = (ebr - ebl) / (y3 - y2);
    dzdl = (ezr - ezl) / (y3 - y2);
  } else {
    dxr = (tri[2][0] - tri[1][0]) / (tri[2][1] - tri[1][1]);
    cxr = tri[1][0];
    rr = erl;
    gr = egl;
    br = ebl;
    zr = ezl;
    drdr = (err - erl) / (y3 - y2);
    dgdr = (egr - egl) / (y3 - y2);
    dbdr = (ebr - ebl) / (y3 - y2);
    dzdr = (ezr - ezl) / (y3 - y2);
  }

  for (let cy = y2; cy < clampMaxVertical(y3, height); cy++) {
    fillGouraudScanline(
      contextData, zBuffer, width, cy, cxl, cxr, rl, gl, bl, zl, rr, gr, br, zr,
    );

    rl += drdl;
    gl += dgdl;
    bl += dbdl;
    zl += dzdl;
    rr += drdr;
    gr += dgdr;
    br += dbdr;
    zr += dzdr;
    cxl += dxl;
    cxr += dxr;
  }
}
