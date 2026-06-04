/**
 * Flat-shaded triangle rasterization (scanline).
 * Vertex format: [x, y, invZ]
 */

function fillFlatScanline(contextData, zBuffer, cy, clx, crx, zl, zr, color) {
  const left = Math.ceil(clx < crx ? clx : crx);
  const right = Math.ceil(clx < crx ? crx : clx);
  const span = right - left;

  const startZ = clx <= crx ? zl : zr;
  const endZ = clx <= crx ? zr : zl;

  if (span <= 0) {
    if (!zBuffer.tryCommit(left, cy, startZ)) return;

    const base = (cy * contextData.width + left) * 4;
    contextData.data[base] = color[0];
    contextData.data[base + 1] = color[1];
    contextData.data[base + 2] = color[2];
    contextData.data[base + 3] = color[3];
    return;
  }

  const dzx = (endZ - startZ) / span;
  let z = startZ;

  for (let i = left; i <= right; i++) {
    if (zBuffer.tryCommit(i, cy, z)) {
      const base = (cy * contextData.width + i) * 4;
      contextData.data[base] = color[0];
      contextData.data[base + 1] = color[1];
      contextData.data[base + 2] = color[2];
      contextData.data[base + 3] = color[3];
    }
    z += dzx;
  }
}

function fillTriangleFlatBottom(triangle, color, contextData, zBuffer) {
  const dxl =
    (triangle[0][0] - triangle[2][0]) / (triangle[0][1] - triangle[2][1]);
  const dxr =
    (triangle[0][0] - triangle[1][0]) / (triangle[0][1] - triangle[1][1]);
  const dyzl =
    (triangle[2][2] - triangle[0][2]) / (triangle[2][1] - triangle[0][1]);
  const dyzr =
    (triangle[1][2] - triangle[0][2]) / (triangle[1][1] - triangle[0][1]);

  let clx = triangle[0][0];
  let crx = triangle[0][0];
  let zl = triangle[0][2];
  let zr = triangle[0][2];

  for (let cy = triangle[0][1]; cy <= triangle[2][1]; cy++) {
    fillFlatScanline(contextData, zBuffer, cy, clx, crx, zl, zr, color);

    crx += dxr;
    clx += dxl;
    zl += dyzl;
    zr += dyzr;
  }
}

function fillTriangleFlatTop(triangle, color, contextData, zBuffer) {
  const dxl =
    (triangle[2][0] - triangle[0][0]) / (triangle[2][1] - triangle[0][1]);
  const dxr =
    (triangle[2][0] - triangle[1][0]) / (triangle[2][1] - triangle[1][1]);
  const dyzl =
    (triangle[0][2] - triangle[2][2]) / (triangle[2][1] - triangle[0][1]);
  const dyzr =
    (triangle[1][2] - triangle[2][2]) / (triangle[2][1] - triangle[1][1]);

  let clx = triangle[2][0];
  let crx = triangle[2][0];
  let zl = triangle[2][2];
  let zr = triangle[2][2];

  for (let cy = triangle[2][1]; cy >= triangle[0][1]; cy--) {
    fillFlatScanline(contextData, zBuffer, cy, clx, crx, zl, zr, color);

    crx -= dxr;
    clx -= dxl;
    zl += dyzl;
    zr += dyzr;
  }
}

/**
 * Draw a flat-shaded triangle. Each vertex is [x, y, invZ].
 */
export function drawGeneralTriangle(triangle, color, contextData, zBuffer) {
  const tri = [...triangle].sort((a, b) => a[1] - b[1]);

  if (tri[1][1] === tri[2][1]) {
    fillTriangleFlatBottom(tri, color, contextData, zBuffer);
  } else if (tri[0][1] === tri[1][1]) {
    fillTriangleFlatTop(tri, color, contextData, zBuffer);
  } else {
    const v1 = [
      tri[0][0] +
        ((tri[2][0] - tri[0][0]) * (tri[1][1] - tri[0][1])) /
          (tri[2][1] - tri[0][1]),
      tri[1][1],
      tri[0][2] +
        ((tri[2][2] - tri[0][2]) / (tri[2][1] - tri[0][1])) *
          (tri[1][1] - tri[0][1]),
    ];
    fillTriangleFlatBottom([tri[0], v1, tri[1]], color, contextData, zBuffer);
    fillTriangleFlatTop([tri[1], v1, tri[2]], color, contextData, zBuffer);
  }
}
