/**
 * Gouraud + texture triangle rasterization.
 * Vertex format: [x, y, intensity, _, _, u, v, z]
 *   u, v — texture pixel coords; z — camera-space depth (positive in front of camera)
 */

const SPAN_EPS = 1e-6;

function sampleTexturedPixel(texture, contextData, zBuffer, x, y, invZ, tu, tv, intensity) {
  if (!zBuffer.tryCommit(x, y, invZ)) return;

  const tw = texture.width;
  const th = texture.height;
  const tx = Math.max(0, Math.min(tw - 1, Math.floor(tu)));
  const ty = Math.max(0, Math.min(th - 1, Math.floor(tv)));
  const contextBase = (y * contextData.width + x) * 4;
  const textureBase = (ty * tw + tx) * 4;

  contextData.data[contextBase] = Math.min(texture.data[textureBase] * intensity, 255);
  contextData.data[contextBase + 1] = Math.min(
    texture.data[textureBase + 1] * intensity,
    255,
  );
  contextData.data[contextBase + 2] = Math.min(
    texture.data[textureBase + 2] * intensity,
    255,
  );
  contextData.data[contextBase + 3] = 255;
}

function fillTexturedScanline(texture, contextData, zBuffer, cy, cxl, cxr, ul, vl, zl, il, ur, vr, zr, ir) {
  const left = Math.ceil(Math.min(cxl, cxr));
  const right = Math.ceil(Math.max(cxl, cxr));

  if (Math.abs(cxr - cxl) < SPAN_EPS) {
    sampleTexturedPixel(texture, contextData, zBuffer, left, cy, zl, ul / zl, vl / zl, il);
    return;
  }

  const dux = (ur - ul) / (cxr - cxl);
  const dvx = (vr - vl) / (cxr - cxl);
  const dzx = (zr - zl) / (cxr - cxl);
  const dix = (ir - il) / (cxr - cxl);
  let u = ul;
  let v = vl;
  let z = zl;
  let intensity = il;

  for (let i = left; i <= right; i++) {
    sampleTexturedPixel(texture, contextData, zBuffer, i, cy, z, u / z, v / z, intensity);
    u += dux;
    v += dvx;
    z += dzx;
    intensity += dix;
  }
}

/**
 * Draw a textured triangle with Gouraud intensity and perspective-correct UV.
 */
export function drawGeneralTriangleGouraudTexture(triangle, texture, contextData, zBuffer) {
  const tri = triangle.map((t) => [...t]).sort((a, b) => a[1] - b[1]);

  const y1 = tri[0][1];
  const y2 = tri[1][1];
  const y3 = tri[2][1];

  let dxdy1 = (tri[1][0] - tri[0][0]) / (tri[1][1] - tri[0][1]);
  let dxdy2 = (tri[2][0] - tri[0][0]) / (tri[2][1] - tri[0][1]);

  let cxl = tri[0][0];
  let cxr = tri[0][0];

  let syu1 = tri[0][5] / tri[0][7];
  let syv1 = tri[0][6] / tri[0][7];
  let syz1 = 1 / tri[0][7];
  let syi1 = tri[0][2];
  let eyu1 = tri[1][5] / tri[1][7];
  let eyv1 = tri[1][6] / tri[1][7];
  let eyz1 = 1 / tri[1][7];
  let eyi1 = tri[1][2];
  let syu2 = tri[0][5] / tri[0][7];
  let syv2 = tri[0][6] / tri[0][7];
  let syz2 = 1 / tri[0][7];
  let syi2 = tri[0][2];
  let eyu2 = tri[2][5] / tri[2][7];
  let eyv2 = tri[2][6] / tri[2][7];
  let eyz2 = 1 / tri[2][7];
  let eyi2 = tri[2][2];

  const dyu1 = (eyu1 - syu1) / (y2 - y1);
  const dyu2 = (eyu2 - syu2) / (y3 - y1);
  const dyv1 = (eyv1 - syv1) / (y2 - y1);
  const dyv2 = (eyv2 - syv2) / (y3 - y1);
  const dyz1 = (eyz1 - syz1) / (y2 - y1);
  const dyz2 = (eyz2 - syz2) / (y3 - y1);
  const dyi1 = (eyi1 - syi1) / (y2 - y1);
  const dyi2 = (eyi2 - syi2) / (y3 - y1);

  let dxl, dxr, dyul, dyur, dyvl, dyvr, dyzl, dyzr, dyil, dyir;

  if (dxdy1 < dxdy2) {
    dxl = dxdy1;
    dxr = dxdy2;
    dyul = dyu1;
    dyur = dyu2;
    dyvl = dyv1;
    dyvr = dyv2;
    dyzl = dyz1;
    dyzr = dyz2;
    dyil = dyi1;
    dyir = dyi2;
  } else {
    dxl = dxdy2;
    dxr = dxdy1;
    dyul = dyu2;
    dyur = dyu1;
    dyvl = dyv2;
    dyvr = dyv1;
    dyzl = dyz2;
    dyzr = dyz1;
    dyil = dyi2;
    dyir = dyi1;
  }

  let ul = syu1;
  let vl = syv1;
  let zl = syz1;
  let il = syi1;
  let ur = syu1;
  let vr = syv1;
  let zr = syz1;
  let ir = syi1;

  for (let cy = y1; cy < y2; cy++) {
    fillTexturedScanline(texture, contextData, zBuffer, cy, cxl, cxr, ul, vl, zl, il, ur, vr, zr, ir);

    ul += dyul;
    vl += dyvl;
    zl += dyzl;
    il += dyil;
    ur += dyur;
    vr += dyvr;
    zr += dyzr;
    ir += dyir;
    cxr += dxr;
    cxl += dxl;
  }

  // Flat top part (y2 to y3)
  if (dxdy1 < dxdy2) {
    dxl = (tri[2][0] - tri[1][0]) / (tri[2][1] - tri[1][1]);
    cxl = tri[1][0];
    ul = eyu1;
    vl = eyv1;
    zl = eyz1;
    il = eyi1;
    dyul = (eyu2 - eyu1) / (y3 - y2);
    dyvl = (eyv2 - eyv1) / (y3 - y2);
    dyzl = (eyz2 - eyz1) / (y3 - y2);
    dyil = (eyi2 - eyi1) / (y3 - y2);
  } else {
    dxr = (tri[2][0] - tri[1][0]) / (tri[2][1] - tri[1][1]);
    cxr = tri[1][0];
    ur = eyu1;
    vr = eyv1;
    zr = eyz1;
    ir = eyi1;
    dyur = (eyu2 - eyu1) / (y3 - y2);
    dyvr = (eyv2 - eyv1) / (y3 - y2);
    dyzr = (eyz2 - eyz1) / (y3 - y2);
    dyir = (eyi2 - eyi1) / (y3 - y2);
  }

  for (let cy = y2; cy < y3; cy++) {
    fillTexturedScanline(texture, contextData, zBuffer, cy, cxl, cxr, ul, vl, zl, il, ur, vr, zr, ir);

    ul += dyul;
    vl += dyvl;
    zl += dyzl;
    il += dyil;
    ur += dyur;
    vr += dyvr;
    zr += dyzr;
    ir += dyir;
    cxr += dxr;
    cxl += dxl;
  }
}
