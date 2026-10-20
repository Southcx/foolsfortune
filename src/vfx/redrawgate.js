// ---------------------------------------------------------------------------------------
// THE REDRAW GATE: when a canvas texture is worth redrawing and re-uploading (the low-spec round, docs/handoffs/calissa/
// 2026-10-20-from-petra-low-spec.md item 6; evidence docs/plans/research/TICK-PROFILE.md). The tool instruments (the psygun's reticle,
// the Carbine's scope, the Soul Brush's desk, the Lockheart's reliquary, the cylinder's plate and inset) each own a canvas that was drawn
// and uploaded every update while shown, 0.1 to 1.15 MB a frame. A gate says "draw now" only when the picture can differ, and never
// faster than a rate: a signature of what is drawn (a string of the numbers the draw reads, each quantised to what the eye can tell
// apart, a timer capped where its animation settles), or, for an instrument with an ambient shimmer that never settles, a busy flag
// that picks the fast rate while something moves and a slow one while it only breathes.
//
// Prior art: React's memo and Qt's dirty-rect repaint (draw when the inputs changed), a game loop's fixed UI tick (Unity's UI Toolkit
// repaints on a dirty flag, capped to the frame), Dear ImGui's "idle" mode (wake on input, a slow tick for animation).
//
//   const gate = new RedrawGate(30)       the fastest rate (Hz)
//   if (gate.sig(dt, `${a}|${b}`)) draw()  drawn when the signature changed and 1/30 s has passed
//   if (gate.rate(dt, busy, 10)) draw()    drawn at the fast rate while busy, at 10 Hz otherwise
//   gate.reset()                          the next call draws (shown again, a font arrived)
// ---------------------------------------------------------------------------------------
export class RedrawGate {
  constructor(hz = 30) { this.gap = 1 / hz; this.acc = this.gap; this.last = null; this.n = 0; }
  reset() { this.last = null; this.acc = this.gap; }
  /** True when `key` is not the one last drawn and the rate allows. */
  sig(dt, key) {
    this.acc += dt;
    if (key === this.last || this.acc < this.gap) return false;
    this.acc = 0; this.last = key; this.n++; return true;
  }
  /** True at the fast rate while `busy`, at `idleHz` while not. */
  rate(dt, busy, idleHz = 10) {
    this.acc += dt;
    if (this.acc < (busy ? this.gap : 1 / idleHz) - 1e-4) return false;
    this.acc = 0; this.n++; return true;
  }
}
