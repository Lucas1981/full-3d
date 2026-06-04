/** All functions operate on plain [x, y, z] arrays. */

export function add(a, b)    { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
export function sub(a, b)    { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
export function scale(v, s)  { return [v[0]*s, v[1]*s, v[2]*s]; }
export function dot(a, b)    { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
export function lengthSq(v)  { return dot(v, v); }
export function length(v)    { return Math.sqrt(lengthSq(v)); }

export function normalize(v) {
  const len = length(v);
  if (len === 0) return [0, 0, 0];
  return scale(v, 1 / len);
}

export function cross(a, b) {
  return [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0],
  ];
}
