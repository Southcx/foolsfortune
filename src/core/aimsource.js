// ---------------------------------------------------------------------------------------
// THE AIM SOURCE: where the Courier's tools aim from, one place every tool asks (South, 2026-11-01: "not being able to grapple or swing
// with the Sondelass, or aim with the Psygun" in Strawman's Well). By default it is the camera, as before: the crosshair's ray from the
// eye. A mode whose camera is not the aim (the Well's side-on frame, whose camera looks at the stage from the audience's seat) lends its
// own: an aim camera set where the aim really starts and pointed where it really goes, and the screen point its reticle sits on. A tool
// reads `game.aim.camera()` where it used to read `game.camera` for its aim, and keeps reading `game.camera` for what is drawn (the first
// person's view model, a billboard turned to the eye, a photograph). One owner lends at a time; `clear(owner)` gives the camera back.
//
// Prior art: the dependency the tools had on the camera inverted behind one small interface (the Dependency Inversion principle); twin-
// stick and side-on shooters' aim decoupled from the view (Contra, Metroid Dread's free aim, Celeste-likes' mouse reticle).
//
//   game.aim = new AimSource(game)   .camera() -> a THREE.Camera to aim with   .lend(owner, { camera(), screen?(out) })   .clear(owner)
//   .lent (bool)   .dir(out: Vector3) -> the aim's way   .screen(out: Vector2) -> the reticle's offset from the view's middle in CSS px (0, 0 when it is the crosshair)
// ---------------------------------------------------------------------------------------

export class AimSource {
  constructor(game) { this.game = game; this.owner = null; this.src = null; }
  get lent() { return !!this.src; }
  /** A mode lends its aim (`src.camera()` each read; `src.screen(out)` where its reticle is). */
  lend(owner, src) { this.owner = owner; this.src = src; }
  /** The camera given back, if `owner` still holds it. */
  clear(owner) { if (this.owner === owner) { this.owner = null; this.src = null; } }
  /** The camera to aim with: the lent one, else the view's own. */
  camera() { return this.src?.camera?.() || this.game.camera; }
  /** Where the reticle sits on the screen, from the view's middle (CSS px, y up). */
  screen(out) { return this.src?.screen ? this.src.screen(out) : out.set(0, 0); }
  /** The way the aim points (world, unit). */
  dir(out) { return this.camera().getWorldDirection(out); }
}
