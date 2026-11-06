// ---------------------------------------------------------------------------------------
// THE BARREL CAM (plain name; docs/ref/WAVE-RIDING.md 4): the camera while the lip covers the board on the wave pool (the surf ride,
// courier/skiff/surf.js). A modifier only, through the house's composition (vfx/cinema.js `frame`, freed on the way out, so it eases back
// to the camera exactly as it was): dropped low and pulled toward the tube's open side, turned toward the mouth so the lip arcs over the
// top of the frame, the view widened with the depth (8 to 15 degrees, about 0.4 real s in); out of the mouth with the spit, a short
// widening more, then the frame clears. The lip's ease of game time is the ride's (core/time.js pulse, at the lip passing over). The
// tint, the vignette and the spit's drops on the lens are the look's (vfx/waves/), read off `skiff.surf` (`cover`, `k`, `light`, `spit`).
//
// Prior art: the tube shots of Treyarch's Kelly Slater game (2002) and Surf World Series (low, in the pocket, the mouth ahead), every surf film's
// follow cam from behind the rider in the barrel; the house's cinema frame (the cutlass's blade mode, the fishing fight).
//
//   const C = new BarrelCam(surf)   C.update(dt) (each frame, real time)   C.k (0..1 how far in)   BARREL_CAM
// ---------------------------------------------------------------------------------------
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** fov: degrees added at the mouth and at the foam ball; dist: the stand-off's share; lift and shoulder: metres (down, toward the open
 *  side); pitch: rad up (the lip over the top third); yaw: the share of the turn toward the mouth; ease: cinema's rate (about 0.4 real s);
 *  in: the cover that begins it; spit: degrees more for its real seconds. */
export const BARREL_CAM = { fov: [8, 15], dist: 0.72, lift: -0.75, shoulder: 1.3, pitch: 0.12, yaw: 0.55, ease: 7.5, in: 0.25, spit: [4, 0.5] };

export class BarrelCam {
  constructor(surf) { this.surf = surf; this.k = 0; this.on = false; this.spitWas = 0; }
  get game() { return this.surf.sk.game; }
  update(dt) {
    const S = this.surf, sk = S.sk, g = this.game, C = g.cinema, B = BARREL_CAM, P = g.player;
    const want = sk.active && sk.phase === 'ride' && !!S.tube && S.cover > B.in;
    this.k += ((want ? 1 : 0) - this.k) * (1 - Math.exp(-B.ease * dt));
    if (!C || !P) return;
    if (want) {
      const f = S.pool?.frame(P.pos.x, P.pos.z);
      if (f) {
        const right = { x: -Math.cos(P.yaw), z: Math.sin(P.yaw) }, open = f.travel.x * right.x + f.travel.z * right.z; // (the tube's open side: the way the wave travels, on the camera's right or left)
        const mouth = wrap(Math.atan2(f.crest.x, f.crest.z) - P.yaw);
        C.frame('barrel', { bars: 0, fov: B.fov[0] + (B.fov[1] - B.fov[0]) * clamp(S.k, 0, 1), dist: B.dist, lift: B.lift, shoulder: B.shoulder * open, pitch: B.pitch, yaw: mouth * B.yaw, roll: 0, ease: B.ease });
        this.on = true;
      }
    } else if (this.on) { C.free('barrel'); this.on = false; }
    if (S.spit > 0.9 && this.spitWas <= 0.9) C.frame('barrel.spit', { bars: 0, fov: B.spit[0], ttl: B.spit[1], ease: B.ease }); // (out with the spit: a breath wider, letting itself go)
    this.spitWas = S.spit;
  }
}
