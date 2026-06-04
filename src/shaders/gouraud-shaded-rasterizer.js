/**
 * Gouraud-shaded triangle rasterization (vertex colors interpolated).
 * Vertex format: [x, y, r, g, b, invZ]
 */

/** Inclusive span — matches flat-shade-rasterizer (left..right, both endpoints). */
function fillInclusiveScanline(
  contextData,
  zBuffer,
  cy,
  clx,
  crx,
  r1,
  g1,
  b1,
  r2,
  g2,
  b2,
  z1,
  z2,
) {
  const left = Math.ceil(crx > clx ? clx : crx);
  const right = Math.ceil(crx > clx ? crx : clx);
  const span = right - left;

  const startR = clx <= crx ? r1 : r2;
  const startG = clx <= crx ? g1 : g2;
  const startB = clx <= crx ? b1 : b2;
  const endR = clx <= crx ? r2 : r1;
  const endG = clx <= crx ? g2 : g1;
  const endB = clx <= crx ? b2 : b1;
  const startZ = clx <= crx ? z1 : z2;
  const endZ = clx <= crx ? z2 : z1;

  if (span <= 0) {
    if (!zBuffer.tryCommit(left, cy, startZ)) return;

    const base = (cy * contextData.width + left) * 4;
    contextData.data[base] = startR;
    contextData.data[base + 1] = startG;
    contextData.data[base + 2] = startB;
    contextData.data[base + 3] = 255;
    return;
  }

  const drx = (endR - startR) / span;
  const dgx = (endG - startG) / span;
  const dbx = (endB - startB) / span;
  const dzx = (endZ - startZ) / span;
  let r = startR;
  let g = startG;
  let b = startB;
  let z = startZ;

  for (let i = left; i <= right; i++) {
    if (zBuffer.tryCommit(i, cy, z)) {
      const base = (cy * contextData.width + i) * 4;
      contextData.data[base] = r;
      contextData.data[base + 1] = g;
      contextData.data[base + 2] = b;
      contextData.data[base + 3] = 255;
    }
    r += drx;
    g += dgx;
    b += dbx;
    z += dzx;
  }
}

function fillTriangleFlatBottomGouraud(triangle, contextData, zBuffer) {
  let tri = triangle.map((t) => [...t]);
  if (tri[2][0] < tri[1][0]) {
    [tri[2], tri[1]] = [tri[1], tri[2]];
  }

  let dxl = (tri[0][0] - tri[2][0]) / (tri[0][1] - tri[2][1]);
  let dxr = (tri[0][0] - tri[1][0]) / (tri[0][1] - tri[1][1]);
  if (dxl > dxr) {
    [dxl, dxr] = [dxr, dxl];
  }

  let clx = tri[0][0];
  let crx = tri[0][0];

  let syr1 = tri[0][2];
  let syg1 = tri[0][3];
  let syb1 = tri[0][4];
  const eyr1 = tri[1][2];
  const eyg1 = tri[1][3];
  const eyb1 = tri[1][4];
  let syr2 = tri[0][2];
  let syg2 = tri[0][3];
  let syb2 = tri[0][4];
  const eyr2 = tri[2][2];
  const eyg2 = tri[2][3];
  const eyb2 = tri[2][4];
  let syz1 = tri[0][5];
  const eyz1 = tri[1][5];
  let syz2 = tri[0][5];
  const eyz2 = tri[2][5];

  const y1 = tri[0][1];
  const y2 = tri[1][1];
  const y3 = tri[2][1];

  const dyr1 = (eyr1 - syr1) / Math.abs(y2 - y1);
  const dyg1 = (eyg1 - syg1) / Math.abs(y2 - y1);
  const dyb1 = (eyb1 - syb1) / Math.abs(y2 - y1);
  const dyr2 = (eyr2 - syr2) / Math.abs(y3 - y1);
  const dyg2 = (eyg2 - syg2) / Math.abs(y3 - y1);
  const dyb2 = (eyb2 - syb2) / Math.abs(y3 - y1);
  const dyz1 = (eyz1 - syz1) / Math.abs(y2 - y1);
  const dyz2 = (eyz2 - syz2) / Math.abs(y3 - y1);

  let r1 = syr1;
  let g1 = syg1;
  let b1 = syb1;
  let r2 = syr2;
  let g2 = syg2;
  let b2 = syb2;
  let z1 = syz1;
  let z2 = syz2;

  for (let cy = tri[0][1]; cy <= tri[2][1]; cy++) {
    fillInclusiveScanline(
      contextData, zBuffer, cy, clx, crx, r1, g1, b1, r2, g2, b2, z1, z2,
    );

    r1 += dyr1;
    g1 += dyg1;
    b1 += dyb1;
    r2 += dyr2;
    g2 += dyg2;
    b2 += dyb2;
    z1 += dyz1;
    z2 += dyz2;
    crx += dxr;
    clx += dxl;
  }
}

function fillTriangleFlatTopGouraud(triangle, contextData, zBuffer) {
  let tri = triangle.map((t) => [...t]);
  if (tri[0][0] > tri[1][0]) {
    [tri[0], tri[1]] = [tri[1], tri[0]];
  }

  const dxl = (tri[2][0] - tri[0][0]) / (tri[2][1] - tri[0][1]);
  const dxr = (tri[2][0] - tri[1][0]) / (tri[2][1] - tri[1][1]);
  let clx = tri[2][0];
  let crx = tri[2][0];

  let syr1 = tri[2][2];
  let syg1 = tri[2][3];
  let syb1 = tri[2][4];
  const eyr1 = tri[0][2];
  const eyg1 = tri[0][3];
  const eyb1 = tri[0][4];
  let syr2 = tri[2][2];
  let syg2 = tri[2][3];
  let syb2 = tri[2][4];
  const eyr2 = tri[1][2];
  const eyg2 = tri[1][3];
  const eyb2 = tri[1][4];
  let syz1 = tri[2][5];
  const eyz1 = tri[0][5];
  let syz2 = tri[2][5];
  const eyz2 = tri[1][5];

  const y1 = tri[2][1];
  const y2 = tri[1][1];
  const y3 = tri[0][1];

  const dyr1 = (eyr1 - syr1) / (y1 - y2);
  const dyg1 = (eyg1 - syg1) / (y1 - y2);
  const dyb1 = (eyb1 - syb1) / (y1 - y2);
  const dyr2 = (eyr2 - syr2) / (y1 - y3);
  const dyg2 = (eyg2 - syg2) / (y1 - y3);
  const dyb2 = (eyb2 - syb2) / (y1 - y3);
  const dyz1 = (eyz1 - syz1) / (y1 - y2);
  const dyz2 = (eyz2 - syz2) / (y1 - y3);

  let r1 = syr1;
  let g1 = syg1;
  let b1 = syb1;
  let r2 = syr2;
  let g2 = syg2;
  let b2 = syb2;
  let z1 = syz1;
  let z2 = syz2;

  for (let cy = tri[2][1]; cy >= tri[0][1]; cy--) {
    fillInclusiveScanline(
      contextData, zBuffer, cy, clx, crx, r1, g1, b1, r2, g2, b2, z1, z2,
    );

    r1 += dyr1;
    g1 += dyg1;
    b1 += dyb1;
    r2 += dyr2;
    g2 += dyg2;
    b2 += dyb2;
    z1 += dyz1;
    z2 += dyz2;
    crx -= dxr;
    clx -= dxl;
  }
}

/**
 * Draw a Gouraud triangle. Each vertex is [x, y, r, g, b, invZ].
 */
export function drawGeneralTriangleGouraud(triangle, contextData, zBuffer) {
  const tri = triangle.map((t) => [...t]).sort((a, b) => a[1] - b[1]);

  if (tri[1][1] === tri[2][1]) {
    fillTriangleFlatBottomGouraud(tri, contextData, zBuffer);
  } else if (tri[0][1] === tri[1][1]) {
    fillTriangleFlatTopGouraud(tri, contextData, zBuffer);
  } else {
    const v1 = [
      tri[0][0] +
        ((tri[2][0] - tri[0][0]) * (tri[1][1] - tri[0][1])) /
          (tri[2][1] - tri[0][1]),
      tri[1][1],
      Math.abs(
        tri[0][2] +
          ((tri[2][2] - tri[0][2]) / (tri[2][1] - tri[0][1])) *
            (tri[1][1] - tri[0][1]),
      ),
      Math.abs(
        tri[0][3] +
          ((tri[2][3] - tri[0][3]) / (tri[2][1] - tri[0][1])) *
            (tri[1][1] - tri[0][1]),
      ),
      Math.abs(
        tri[0][4] +
          ((tri[2][4] - tri[0][4]) / (tri[2][1] - tri[0][1])) *
            (tri[1][1] - tri[0][1]),
      ),
      tri[0][5] +
        ((tri[2][5] - tri[0][5]) / (tri[2][1] - tri[0][1])) *
          (tri[1][1] - tri[0][1]),
    ];
    fillTriangleFlatBottomGouraud([tri[0], v1, tri[1]], contextData, zBuffer);
    fillTriangleFlatTopGouraud([tri[1], v1, tri[2]], contextData, zBuffer);
  }
}
