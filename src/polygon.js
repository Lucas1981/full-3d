/**
 * A mesh face defined by vertex indices and a visibility flag updated each frame.
 */
export class Polygon {
  /**
   * @param {{ color: string, vertexIndices: number[], show?: boolean }} data
   */
  constructor({ color, vertexIndices, show = true }) {
    this._color          = color;
    this._vertexIndices  = [...vertexIndices];
    this._show           = show;
  }

  get color() { return this._color; }
  set color(value) { this._color = value; }

  get vertexIndices() { return this._vertexIndices; }

  get show() { return this._show; }
  set show(value) { this._show = value; }
}
