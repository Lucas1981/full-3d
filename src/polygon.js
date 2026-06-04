/**
 * A mesh face defined by vertex indices and an optional visibility flag (e.g. after culling).
 */
export class Polygon {
  /**
   * @param {{
   *   materialColor: number[],
   *   vertexIndices: number[],
   *   texture?: string | null,
   *   uvs?: number[][],
   *   show?: boolean,
   * }} data
   */
  constructor({ materialColor, vertexIndices, texture = null, uvs = null, show = true }) {
    this._materialColor  = [...materialColor];
    this._vertexIndices  = [...vertexIndices];
    this._texture        = texture;
    this._uvs            = uvs ? uvs.map(([u, v]) => [u, v]) : null;
    this._show           = show;
  }

  get materialColor() { return this._materialColor; }
  set materialColor(value) { this._materialColor = [...value]; }

  get vertexIndices() { return this._vertexIndices; }

  /** Image filename under assets/images, or null for flat vertex color. */
  get texture() { return this._texture; }
  set texture(value) { this._texture = value; }

  /** Per-corner [u, v] in 0–1, same order as vertexIndices. */
  get uvs() { return this._uvs; }
  set uvs(value) {
    this._uvs = value ? value.map(([u, v]) => [u, v]) : null;
  }

  get show() { return this._show; }
  set show(value) { this._show = value; }

  clone() {
    return new Polygon({
      materialColor: this._materialColor,
      vertexIndices: this._vertexIndices,
      texture: this._texture,
      uvs: this._uvs,
      show: this._show,
    });
  }
}
