/**
 * Flat-shaded triangle rasterization (scanline).
 */

function fillTriangleFlatBottom(triangle, color, contextData) {
  const dxl =
    (triangle[0][0] - triangle[2][0]) / (triangle[0][1] - triangle[2][1]);
  const dxr =
    (triangle[0][0] - triangle[1][0]) / (triangle[0][1] - triangle[1][1]);
  let clx = triangle[0][0];
  let crx = triangle[0][0];

  for (let cy = triangle[0][1]; cy <= triangle[2][1]; cy++) {
    const base =
      (cy * contextData.width + Math.ceil(crx > clx ? clx : crx)) * 4;
    const left = Math.ceil(crx > clx ? clx : crx);
    const right = Math.ceil(crx > clx ? crx : clx);
    for (let i = left; i <= right; i++) {
      const off = base + (i - left) * 4;
      contextData.data[off] = color[0];
      contextData.data[off + 1] = color[1];
      contextData.data[off + 2] = color[2];
      contextData.data[off + 3] = color[3];
    }
    crx += dxr;
    clx += dxl;
  }
}

function fillTriangleFlatTop(triangle, color, contextData) {
  const dxl =
    (triangle[2][0] - triangle[0][0]) / (triangle[2][1] - triangle[0][1]);
  const dxr =
    (triangle[2][0] - triangle[1][0]) / (triangle[2][1] - triangle[1][1]);
  let clx = triangle[2][0];
  let crx = triangle[2][0];

  for (let cy = triangle[2][1]; cy >= triangle[0][1]; cy--) {
    const base =
      (cy * contextData.width + Math.ceil(crx > clx ? clx : crx)) * 4;
    const left = Math.ceil(crx > clx ? clx : crx);
    const right = Math.ceil(crx > clx ? crx : clx);
    for (let i = left; i <= right; i++) {
      const off = base + (i - left) * 4;
      contextData.data[off] = color[0];
      contextData.data[off + 1] = color[1];
      contextData.data[off + 2] = color[2];
      contextData.data[off + 3] = color[3];
    }
    crx -= dxr;
    clx -= dxl;
  }
}

/**
 * Draw a triangle (array of 3 [x,y] points) with flat color into contextData.
 */
export function drawGeneralTriangle(triangle, color, contextData) {
  const tri = [...triangle].sort((a, b) => a[1] - b[1]);

  if (tri[1][1] === tri[2][1]) {
    fillTriangleFlatBottom(tri, color, contextData);
  } else if (tri[0][1] === tri[1][1]) {
    fillTriangleFlatTop(tri, color, contextData);
  } else {
    const v1 = [
      tri[0][0] +
        ((tri[2][0] - tri[0][0]) * (tri[1][1] - tri[0][1])) /
          (tri[2][1] - tri[0][1]),
      tri[1][1],
    ];
    fillTriangleFlatBottom([tri[0], tri[1], v1], color, contextData);
    fillTriangleFlatTop([tri[1], v1, tri[2]], color, contextData);
  }
}
