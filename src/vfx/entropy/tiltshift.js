// THE TILT-SHIFT PASS (stub: its builder replaces this whole file; the interface below is fixed).
//   new TiltShift(game, look)   .set(on)   .focus (screen y 0..1 held sharp, 0 the bottom)   .band
export class TiltShift {
  constructor(game, look) { this.game = game; this.look = look; this.on = false; this.focus = 0.42; this.band = 0.32; }
  set(on) { this.on = !!on; }
}
