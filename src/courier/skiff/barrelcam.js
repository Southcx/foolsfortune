// ---------------------------------------------------------------------------------------
// THE BARREL CAM (plain name; docs/ref/WAVE-RIDING.md 4): the camera while the lip covers the board on the wave pool (the surf ride,
// courier/skiff/surf.js). A modifier only, through the house's own camera shot (vfx/cinema.js `shot`, let go on the way out, so it eases
// back to the follow camera exactly as it was): stood inside the tube a little behind the rider and below the lip, a step toward its open
// side, looking down the crest at the mouth so the lip arcs overhead and the face falls away beside (the first firing's follow-camera
// frame left the camera above the crest, outside the tube: the 2026-11-06 headless play); the view widened with the depth (8 to 15
// degrees, about 0.4 real s in); out of the mouth with the spit, a short widening more, then the shot lets go. The lip's ease of game time is the ride's (core/time.js pulse, at the lip passing over). The
// tint, the vignette and the spit's drops on the lens are the look's (vfx/waves/), read off `skiff.surf` (`cover`, `k`, `light`, `spit`).
//
// Prior art: the tube shots of Treyarch's Kelly Slater game (2002) and Surf World Series (low, in the pocket, the mouth ahead), every surf film's
// follow cam from behind the rider in the barrel; the house's cinema frame (the cutlass's blade mode, the fishing fight).
//
//   const C = new BarrelCam(surf)   C.update(dt) (each frame, real time)   C.k (0..1 how far in)   BARREL_CAM
// ---------------------------------------------------------------------------------------
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const _pos = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } }, _look = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } }; // (cinema.shot copies them)

/** fov: degrees added at the mouth and at the foam ball; back: metres behind the rider, deeper in the tube; out: metres toward its open
 *  side; eye: metres over the face under it (kept under the rider's own height + eye, so it never rises through the lip); ahead: metres
 *  down the crest to the point looked at, aim its height over the rider's; ease: cinema's rate (about 0.4 real s); in: the cover that
 *  begins it; spit: degrees more for its real seconds. */
export const BARREL_CAM = { fov: [8, 15], back: 3.8, out: 1.0, eye: 1.5, ahead: 18, aim: 1.0, ease: 7.5, in: 0.25, spit: [4, 0.5] };

export class BarrelCam {
  constructor(surf) { this.surf = surf; this.k = 0; this.on = false; this.spitWas = 0; }
  get game() { return this.surf.sk.game; }
  update(dt) {
    const S = this.surf, sk = S.sk, g = this.game, C = g.cinema, B = BARREL_CAM, P = g.player;
    const want = sk.active && sk.phase === 'ride' && !!S.tube && S.cover > B.in;
    this.k += ((want ? 1 : 0) - this.k) * (1 - Math.exp(-B.ease * dt));
    if (!C || !P) return;
    if (want) {
      const f = S.pool?.frame(P.pos.x, P.pos.z), R = sk.dunes;
      if (f && R?.rideHeight) {
        const cx = f.crest.x, cz = f.crest.z, tx = f.travel.x, tz = f.travel.z;
        const px = P.pos.x - cx * B.back + tx * B.out, pz = P.pos.z - cz * B.back + tz * B.out;
        const py = Math.min(R.rideHeight(px, pz), P.pos.y) + B.eye;
        _pos.set(px, py, pz); _look.set(P.pos.x + cx * B.ahead, P.pos.y + B.aim, P.pos.z + cz * B.ahead);
        C.shot('barrel', { pos: _pos, look: _look, bars: 0, fov: B.fov[0] + (B.fov[1] - B.fov[0]) * clamp(S.k, 0, 1), roll: 0, ease: B.ease });
        this.on = true;
      }
    } else if (this.on) { C.unshot('barrel'); this.on = false; }
    if (S.spit > 0.9 && this.spitWas <= 0.9) C.frame('barrel.spit', { bars: 0, fov: B.spit[0], ttl: B.spit[1], ease: B.ease }); // (out with the spit: a breath wider, letting itself go)
    this.spitWas = S.spit;
  }
}
