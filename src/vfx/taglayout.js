// ---------------------------------------------------------------------------------------
// TAG LAYOUT: the overlay's tags kept off one another (docs/plans/OVERLAY.md 8, 10.5f). One small solver shared by every tag that
// stands in the world: a creature's tag (vfx/creaturetags.js, in the 480-line present's dots) and a thing's tag (feedback/thingtags.js,
// in CSS px); it knows no units, only boxes. A frame begins it empty, lays in what must stay clear first (the instruments' corners,
// every tag's bracket), then each tag in turn: its wanted place tried, and where something is in the way, the nearest clear of the
// places beside that obstacle (left of it, right of it, under it, over it, and the caller's own extras), a few steps at most; what it
// then takes up is added for the next. Greedy, first come first placed, so a tag already standing keeps its place.
//
// Prior art: the cartographer's greedy label placement (candidate positions round the obstacle, first fit kept: Imhof's rules, the
// point-feature labelling of GIS tools); the MMO nameplate stack that slides a plate off another.
//
//   const L = new TagLayout(40)   L.begin()   L.rect(x0, y0, x1, y1) -> the box kept (null when full)   L.over(x0, y0, x1, y1, skip?) -> a box in the way
//   L.solve(x, y, w, h, { clamp(x, y) -> [x, y], hit(x, y) -> a box in the way | null, extra?: [[x, y]], padL?, tries? }) -> [x, y]
// ---------------------------------------------------------------------------------------

export class TagLayout {
  constructor(n = 40) { this.rects = Array.from({ length: n }, () => ({ x0: 0, y0: 0, x1: 0, y1: 0 })); this.n = 0; }

  begin() { this.n = 0; }

  rect(x0, y0, x1, y1) {
    if (this.n >= this.rects.length) return null;
    const R = this.rects[this.n++]; R.x0 = x0; R.y0 = y0; R.x1 = x1; R.y1 = y1; return R;
  }

  over(x0, y0, x1, y1, skip = null) {
    for (let i = 0; i < this.n; i++) { const R = this.rects[i]; if (R === skip) continue; if (x0 < R.x1 && x1 > R.x0 && y0 < R.y1 && y1 > R.y0) return R; }
    return null;
  }

  /** Its place: (x, y) if clear, else the nearest clear candidate round what is in the way, a step at a time. `padL` is how far the
   *  tag's box reaches left of x (the creature's lozenge), so a place right of an obstacle clears it. */
  solve(x, y, w, h, { clamp, hit, extra = [], padL = 0, tries = 6 }) {
    let [tx, ty] = clamp(x, y);
    for (let n = 0; n < tries; n++) {
      const R = hit(tx, ty); if (!R) break;
      const opts = [[R.x0 - w - 4, ty], [R.x1 + 4 + padL, ty], [tx, R.y1 + 4], [tx, R.y0 - h - 4], ...extra].map(([a, b]) => clamp(a, b)).filter(([a, b]) => !hit(a, b));
      if (!opts.length) break;
      opts.sort((a, c) => Math.hypot(a[0] - tx, a[1] - ty) - Math.hypot(c[0] - tx, c[1] - ty)); [tx, ty] = opts[0];
    }
    return [tx, ty];
  }
}
