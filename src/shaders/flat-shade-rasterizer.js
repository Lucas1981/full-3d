/**
 * Flat-shaded triangle rasterization.
 * Vertex format: [x, y, depth]
 *   depth — camera-space depth (positive in front of camera), same as textured shader
 */

import {
  inclusiveSpan,
  isDegenerateSpan,
  clampMaxHorizontal,
  clampMaxVertical,
  isSpanPastRightEdge,
} from './scanline.js';

function plotFlatPixel(contextData, zBuffer, x, y, invZ, color) {
  if (!zBuffer.tryCommit(x, y, invZ)) return;

  const base = (y * contextData.width + x) * 4;
  contextData.data[base] = color[0];
  contextData.data[base + 1] = color[1];
  contextData.data[base + 2] = color[2];
  contextData.data[base + 3] = color[3];
}

function fillFlatScanline(contextData, zBuffer, width, cy, cxl, cxr, zl, zr, color) {
  const { left, right } = inclusiveSpan(cxl, cxr);
  if (isSpanPastRightEdge(left, width)) return;

  const drawRight = clampMaxHorizontal(right, width);

  if (isDegenerateSpan(cxl, cxr)) {
    if (left <= drawRight) {
      plotFlatPixel(contextData, zBuffer, left, cy, zl, color);
    }
    return;
  }

  const dzx = (zr - zl) / (cxr - cxl);
  let z = zl;

  for (let i = left; i <= drawRight; i++) {
    plotFlatPixel(contextData, zBuffer, i, cy, z, color);
    z += dzx;
  }
}

/**
 * Draw a flat-shaded triangle. Each vertex is [x, y, depth].
 */
export function drawGeneralTriangle(triangle, color, contextData, zBuffer) {
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

  const szl = 1 / tri[0][2];
  const ezl = 1 / tri[1][2];
  const ezr = 1 / tri[2][2];

  const dzl1 = (ezl - szl) / (y2 - y1);
  const dzr2 = (ezr - szl) / (y3 - y1);

  let dxl, dxr, dzdl, dzdr;

  if (dxdy1 < dxdy2) {
    dxl = dxdy1;
    dxr = dxdy2;
    dzdl = dzl1;
    dzdr = dzr2;
  } else {
    dxl = dxdy2;
    dxr = dxdy1;
    dzdl = dzr2;
    dzdr = dzl1;
  }

  let zl = szl;
  let zr = szl;

  for (let cy = y1; cy < clampMaxVertical(y2, height); cy++) {
    fillFlatScanline(contextData, zBuffer, width, cy, cxl, cxr, zl, zr, color);

    zl += dzdl;
    zr += dzdr;
    cxl += dxl;
    cxr += dxr;
  }

  if (dxdy1 < dxdy2) {
    dxl = (tri[2][0] - tri[1][0]) / (tri[2][1] - tri[1][1]);
    cxl = tri[1][0];
    zl = ezl;
    dzdl = (ezr - ezl) / (y3 - y2);
  } else {
    dxr = (tri[2][0] - tri[1][0]) / (tri[2][1] - tri[1][1]);
    cxr = tri[1][0];
    zr = ezl;
    dzdr = (ezr - ezl) / (y3 - y2);
  }

  for (let cy = y2; cy < clampMaxVertical(y3, height); cy++) {
    fillFlatScanline(contextData, zBuffer, width, cy, cxl, cxr, zl, zr, color);

    zl += dzdl;
    zr += dzdr;
    cxl += dxl;
    cxr += dxr;
  }
}
