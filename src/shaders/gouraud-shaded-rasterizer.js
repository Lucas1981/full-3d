/**
 * Gouraud-shaded triangle rasterization.
 * Vertex format: [x, y, r, g, b, depth]
 *   depth — camera-space depth (positive in front of camera), same as textured shader
 */

import {
  inclusiveSpan,
  isDegenerateSpan,
  clampMaxHorizontal,
  clampMinHorizontal,
  clampMaxVertical,
  isSpanPastRightEdge,
  isSpanPastLeftEdge,
  isTriangleAboveScreen,
  clipMinVerticalStart,
  lerpAlongEdge,
} from './scanline.js';

function plotGouraudPixel(contextData, zBuffer, x, y, invZ, r, g, b) {
  if (!zBuffer.tryCommit(x, y, invZ)) return;

  const base = ((y | 0) * contextData.width + (x | 0)) * 4;
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
  if (isSpanPastRightEdge(left, width) || isSpanPastLeftEdge(right)) return;

  const drawLeft = clampMinHorizontal(left);
  const drawRight = clampMaxHorizontal(right, width);
  if (drawLeft > drawRight) return;

  if (isDegenerateSpan(cxl, cxr)) {
    plotGouraudPixel(contextData, zBuffer, drawLeft, cy, zl, rl, gl, bl);
    return;
  }

  const drx = (rr - rl) / (cxr - cxl);
  const dgx = (gr - gl) / (cxr - cxl);
  const dbx = (br - bl) / (cxr - cxl);
  const dzx = (zr - zl) / (cxr - cxl);
  let r = lerpAlongEdge(cxl, cxr, rl, rr, drawLeft);
  let g = lerpAlongEdge(cxl, cxr, gl, gr, drawLeft);
  let b = lerpAlongEdge(cxl, cxr, bl, br, drawLeft);
  let z = lerpAlongEdge(cxl, cxr, zl, zr, drawLeft);

  for (let i = drawLeft; i <= drawRight; i++) {
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

  if (y1 >= height || isTriangleAboveScreen(y3)) return;

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

  const advanceBy = (n) => {
    rl += drdl * n;
    gl += dgdl * n;
    bl += dbdl * n;
    zl += dzdl * n;
    rr += drdr * n;
    gr += dgdr * n;
    br += dbdr * n;
    zr += dzdr * n;
    cxl += dxl * n;
    cxr += dxr * n;
  };

  const advanceRow = () => advanceBy(1);

  let cy = clipMinVerticalStart(y1, advanceBy);
  const endY1 = clampMaxVertical(y2, height);
  for (; cy < endY1; cy++) {
    fillGouraudScanline(
      contextData, zBuffer, width, cy, cxl, cxr, rl, gl, bl, zl, rr, gr, br, zr,
    );
    advanceRow();
  }

  if (y2 > 0 && cy < y2) return;

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

  if (y2 < 0) {
    const n = -y2;
    if (dxdy1 < dxdy2) {
      cxl += dxl * n;
      rl += drdl * n;
      gl += dgdl * n;
      bl += dbdl * n;
      zl += dzdl * n;
    } else {
      cxr += dxr * n;
      rr += drdr * n;
      gr += dgdr * n;
      br += dbdr * n;
      zr += dzdr * n;
    }
    cy = 0;
  } else {
    cy = y2;
  }

  const endY2 = clampMaxVertical(y3, height);
  for (; cy < endY2; cy++) {
    fillGouraudScanline(
      contextData, zBuffer, width, cy, cxl, cxr, rl, gl, bl, zl, rr, gr, br, zr,
    );
    advanceRow();
  }
}
