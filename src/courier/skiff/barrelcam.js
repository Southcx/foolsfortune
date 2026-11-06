// ---------------------------------------------------------------------------------------
// THE BARREL CAM (plain name; docs/ref/WAVE-RIDING.md 4): the camera while the lip covers the board on the wave pool (the surf ride,
// courier/skiff/surf.js). A modifier only, on the house's own follow camera (vfx/cinema.js `frame`, freed on the way out, so it eases
// back to the follow camera exactly as it was): the camera stays behind the board on the board's own heading (the skiff's follow keeps
// it there), never swung to a new angle, so A / D turn the board the same way round the whole time (South, 2026-11-06 night: "the
// controls flip with the camera sweeping around instead of the camera tightening in on the skiff itself"; the first and second firings
// stood a camera of their own in the tube looking down the crest, and that swing was the flip). In the tube it tightens: closer (the
// stand-off cut to `dist`), lower (`lift` m), the view a little wider with the depth (`fov`, degrees), eased in about 0.4 real s, so the
// tube closes round the shot; out of the mouth with the spit, a breath wider, then it lets go. The lip's ease of game time is the
// ride's (core/time.js pulse, at the lip passing over). The tint, the vignette and the spit's drops on the lens are the look's
// (vfx/waves/), read off `skiff.surf` (`cover`, `k`, `light`, `spit`).
//
// Prior art: the tube shots of Treyarch's Kelly Slater game (2002) and Surf World Series (behind and low, the mouth ahead), every surf
// film's follow cam from behind the rider in the barrel, SSX's tightening camera at speed; the house's cinema frame (the cutlass's blade
// mode, the fishing fight).
//
//   const C = new BarrelCam(surf)   C.update(dt) (each frame, real time)   C.k (0..1 how far in)   BARREL_CAM
// ---------------------------------------------------------------------------------------
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

/** fov: degrees added at the mouth and at the foam ball; dist: the follow camera's stand-off as a share of its own; lift: metres
 *  added to its height (down); ease: cinema's rate; in: the cover that begins it; spit: degrees more for its real seconds. */
export const BARREL_CAM = { fov: [6, 12], dist: 0.55, lift: -0.9, ease: 5, in: 0.25, spit: [4, 0.5] };

export class BarrelCam {
  constructor(surf) { this.surf = surf; this.k = 0; this.on = false; this.spitWas = 0; }
  get game() { return this.surf.sk.game; }
  update(dt) {
    const S = this.surf, sk = S.sk, g = this.game, C = g.cinema, B = BARREL_CAM;
    const want = sk.active && sk.phase === 'ride' && !!S.tube && S.cover > B.in;
    this.k += ((want ? 1 : 0) - this.k) * (1 - Math.exp(-B.ease * dt));
    if (!C) return;
    if (want) {
      C.frame('barrel', { bars: 0, dist: B.dist, lift: B.lift, fov: B.fov[0] + (B.fov[1] - B.fov[0]) * clamp(S.k, 0, 1), ease: B.ease }); // (re-asked each frame: its fov follows the depth)
      this.on = true;
    } else if (this.on) { C.free('barrel'); this.on = false; }
    if (S.spit > 0.9 && this.spitWas <= 0.9) C.frame('barrel.spit', { bars: 0, fov: B.spit[0], ttl: B.spit[1], ease: B.ease }); // (out with the spit: a breath wider, letting itself go)
    this.spitWas = S.spit;
  }
}
