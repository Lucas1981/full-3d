/**
 * A mesh face defined by vertex indices and an optional visibility flag (e.g. after culling).
 */
export class Polygon {
  /**
   * @param {{ materialColor: number[], vertexIndices: number[], show?: boolean }} data
   */
  constructor({ materialColor, vertexIndices, show = true }) {
    this._materialColor  = [...materialColor];
    this._vertexIndices  = [...vertexIndices];
    this._show           = show;
  }

  get materialColor() { return this._materialColor; }
  set materialColor(value) { this._materialColor = [...value]; }

  get vertexIndices() { return this._vertexIndices; }

  get show() { return this._show; }
  set show(value) { this._show = value; }

  clone() {
    return new Polygon({
      materialColor: this._materialColor,
      vertexIndices: this._vertexIndices,
      show: this._show,
    });
  }
}
