/**
 * Flat-shaded triangle rasterization.
 * Vertex format: [x, y, depth]
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

function plotFlatPixel(contextData, zBuffer, x, y, invZ, color) {
  if (!zBuffer.tryCommit(x, y, invZ)) return;

  const base = ((y | 0) * contextData.width + (x | 0)) * 4;
  contextData.data[base] = color[0];
  contextData.data[base + 1] = color[1];
  contextData.data[base + 2] = color[2];
  contextData.data[base + 3] = color[3];
}

function fillFlatScanline(contextData, zBuffer, width, cy, cxl, cxr, zl, zr, color) {
  const { left, right } = inclusiveSpan(cxl, cxr);
  if (isSpanPastRightEdge(left, width) || isSpanPastLeftEdge(right)) return;

  const drawLeft = clampMinHorizontal(left);
  const drawRight = clampMaxHorizontal(right, width);
  if (drawLeft > drawRight) return;

  if (isDegenerateSpan(cxl, cxr)) {
    plotFlatPixel(contextData, zBuffer, drawLeft, cy, zl, color);
    return;
  }

  const dzx = (zr - zl) / (cxr - cxl);
  let z = lerpAlongEdge(cxl, cxr, zl, zr, drawLeft);

  for (let i = drawLeft; i <= drawRight; i++) {
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

  if (y1 >= height || isTriangleAboveScreen(y3)) return;

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

  const advanceBy = (n) => {
    zl += dzdl * n;
    zr += dzdr * n;
    cxl += dxl * n;
    cxr += dxr * n;
  };

  const advanceRow = () => advanceBy(1);

  let cy = clipMinVerticalStart(y1, advanceBy);
  const endY1 = clampMaxVertical(y2, height);
  for (; cy < endY1; cy++) {
    fillFlatScanline(contextData, zBuffer, width, cy, cxl, cxr, zl, zr, color);
    advanceRow();
  }

  if (y2 > 0 && cy < y2) return;

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

  if (y2 < 0) {
    const n = -y2;
    if (dxdy1 < dxdy2) {
      cxl += dxl * n;
      zl += dzdl * n;
    } else {
      cxr += dxr * n;
      zr += dzdr * n;
    }
    cy = 0;
  } else {
    cy = y2;
  }

  const endY2 = clampMaxVertical(y3, height);
  for (; cy < endY2; cy++) {
    fillFlatScanline(contextData, zBuffer, width, cy, cxl, cxr, zl, zr, color);
    advanceRow();
  }
}
