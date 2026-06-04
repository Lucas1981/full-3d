/**
 * Gouraud-shaded triangle rasterization (vertex colors interpolated).
 * Vertex format: [x, y, r, g, b]
 */

function fillTriangleFlatBottomGouraud(triangle, contextData) {
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

  const y1 = tri[0][1];
  const y2 = tri[1][1];
  const y3 = tri[2][1];

  const dyr1 = (eyr1 - syr1) / Math.abs(y2 - y1);
  const dyg1 = (eyg1 - syg1) / Math.abs(y2 - y1);
  const dyb1 = (eyb1 - syb1) / Math.abs(y2 - y1);
  const dyr2 = (eyr2 - syr2) / Math.abs(y3 - y1);
  const dyg2 = (eyg2 - syg2) / Math.abs(y3 - y1);
  const dyb2 = (eyb2 - syb2) / Math.abs(y3 - y1);

  let r1 = syr1;
  let g1 = syg1;
  let b1 = syb1;
  let r2 = syr2;
  let g2 = syg2;
  let b2 = syb2;

  for (let cy = tri[0][1]; cy <= tri[2][1]; cy++) {
    const drx = (r2 - r1) / (crx - clx);
    const dgx = (g2 - g1) / (crx - clx);
    const dbx = (b2 - b1) / (crx - clx);
    let r = r1;
    let g = g1;
    let b = b1;

    for (let i = Math.ceil(clx); i < Math.ceil(crx); i++) {
      const base = (cy * contextData.width + i) * 4;
      contextData.data[base] = r;
      contextData.data[base + 1] = g;
      contextData.data[base + 2] = b;
      contextData.data[base + 3] = 255;
      r += drx;
      g += dgx;
      b += dbx;
    }

    r1 += dyr1;
    g1 += dyg1;
    b1 += dyb1;
    r2 += dyr2;
    g2 += dyg2;
    b2 += dyb2;
    crx += dxr;
    clx += dxl;
  }
}

function fillTriangleFlatTopGouraud(triangle, contextData) {
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

  const y1 = tri[2][1];
  const y2 = tri[1][1];
  const y3 = tri[0][1];

  const dyr1 = (eyr1 - syr1) / (y1 - y2);
  const dyg1 = (eyg1 - syg1) / (y1 - y2);
  const dyb1 = (eyb1 - syb1) / (y1 - y2);
  const dyr2 = (eyr2 - syr2) / (y1 - y3);
  const dyg2 = (eyg2 - syg2) / (y1 - y3);
  const dyb2 = (eyb2 - syb2) / (y1 - y3);

  let r1 = syr1;
  let g1 = syg1;
  let b1 = syb1;
  let r2 = syr2;
  let g2 = syg2;
  let b2 = syb2;

  for (let cy = tri[2][1]; cy >= tri[0][1]; cy--) {
    const drx = (r2 - r1) / (crx - clx);
    const dgx = (g2 - g1) / (crx - clx);
    const dbx = (b2 - b1) / (crx - clx);
    let r = r1;
    let g = g1;
    let b = b1;

    for (let i = Math.floor(clx); i < Math.ceil(crx); i++) {
      const base = (cy * contextData.width + i) * 4;
      contextData.data[base] = r;
      contextData.data[base + 1] = g;
      contextData.data[base + 2] = b;
      contextData.data[base + 3] = 255;
      r += drx;
      g += dgx;
      b += dbx;
    }

    r1 += dyr1;
    g1 += dyg1;
    b1 += dyb1;
    r2 += dyr2;
    g2 += dyg2;
    b2 += dyb2;
    crx -= dxr;
    clx -= dxl;
  }
}

/**
 * Draw a Gouraud triangle. Each vertex is [x, y, r, g, b].
 */
export function drawGeneralTriangleGouraud(triangle, contextData) {
  const tri = triangle.map((t) => [...t]).sort((a, b) => a[1] - b[1]);

  if (tri[1][1] === tri[2][1]) {
    fillTriangleFlatBottomGouraud(tri, contextData);
  } else if (tri[0][1] === tri[1][1]) {
    fillTriangleFlatTopGouraud(tri, contextData);
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
    ];
    fillTriangleFlatBottomGouraud([tri[0], v1, tri[1]], contextData);
    fillTriangleFlatTopGouraud([tri[1], v1, tri[2]], contextData);
  }
}
