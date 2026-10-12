// ---------------------------------------------------------------------------------------
// THE CRAWL: on all fours under what the crouch cannot pass (the owner, 2026-10-10: "a proper full-prone crawling animation or two to
// use for situations where crawling is warranted (like under a wall, tight spaces)"). The look only, built ahead of its body: the low
// capsule that lets the Courier under is player.js's (Petra's: docs/handoffs/petra/2026-10-10-from-calissa-crawl.md). Until it sets the
// state below, nothing here plays.
//   THE STATE    s.crawl (truthy: down on all fours) and s.prone (0..1: flat on the belly instead of the hands and knees), on the
//                animation state as s.crouch is; the speed is the capsule's.
//   GETTING DOWN Loco_CrawlEnter (0.67 s: standing to the hands and knees), from its squat (CRAWL.enterFrom.crouch) when crouched;
//                faded in over CRAWL.fade. GETTING UP Loco_CrawlExit, to the crouch's squat (CRAWL.exitTo.crouch) when the body stays
//                low after, or to standing; the crawl's weight fades out over its last CRAWL.fade s. `busy`: the getting up still playing
//                (the capsule should stay low until it is done).
//   THE LOOPS    Loco_Crawl (hands and knees: the posed top, hair included, 1.05 m; 0.29 m/s of its own) and Loco_CrawlProne (the
//                belly: 0.74 m; 0.39 m/s), blended by s.prone on one phase, at the move's speed over theirs: strides to CRAWL.stride
//                times their own, the rest cadence; held where they are when the move stops.
//   THE BODY     while the crawl is on, the gait's feet (the foot IK's planting and locks) and the prowl's head give way to it by its
//                weight: hands, knees and feet are where the clips put them, on flat ground.
//   THE CLEARANCE the belly lies 2.2 m long on a capsule 0.27 m in radius (player.js's PRONE_HALF: the body is Petra's), so a wall near
//                pokes fingers, shins or toes through it (measured at a plain wall, the capsule's axis 0.32 m off the plane: fingers
//                0.64 m through crawling straight at it, shins 0.15 m along it, toes 0.92 m turning to face away). 48 rays from the
//                axis find the surfaces inside CRAWL.outline (the belly's reach about the axis by angle, a convex polygon); each such
//                point is moved out along its surface's normal by the polygon's nearest edge, the planes found added by the way they
//                face (two walls facing cancel, a corner adds), and the body so slid tried again (CRAWL.rounds: a prop's push into a
//                wall is given back, the poke shared). Only the pelvis (`base.p`) moves: the pose is the clips'. In at once, out over
//                about CRAWL.fade; `slide` is how far it has moved the body.
//
// Prior art: Metal Gear Solid's crawl (prone from the crouch, its own speed, the camera low; getting up a beat of its own the player
// waits out), and The Last of Us's and Uncharted's crawl spaces (a one-shot down and up framing a loop matched to the move). The
// clearance is the depenetration every kinematic character controller does (Bullet's btKinematicCharacterController
// `recoverFromPenetration`, Unity's `Physics.ComputePenetration`: push the shape out along the contact normal), moved from the capsule
// to the look; the outline is the support function of a convex shape (Gilbert, Johnson and Keerthi, 1988), the rays Reynolds' feelers
// for wall avoidance (Steering Behaviors for Autonomous Characters, 1999), the rounds a relaxed contact solver's.
//
//   const crawl = new Crawl(ch)
//   crawl.pose(dt, s, gs, base, cr) -> w   lays the crawl over base (gs: the ground speed; cr: the crouch's weight); its weight
//   crawl.w, crawl.busy, crawl.slide        the weight laid; the getting up still playing; the clearance's slide (a Vector2, world x z, m)
//   CRAWL                                   the table
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';

/** The crawl's clips and its timing (s), measured on the Courier (docs/ART.md section 10). */
export const CRAWL = {
  knees: 'Loco_Crawl', belly: 'Loco_CrawlProne', enter: 'Loco_CrawlEnter', exit: 'Loco_CrawlExit',
  enterFrom: { stand: 0, crouch: 0.2 }, // (s into Loco_CrawlEnter: its frame 6 is a squat near the crouch's)
  exitTo: { stand: 0.64, crouch: 0.4 }, // (s into Loco_CrawlExit it plays to: standing; its frame 12, a squat)
  fade: 0.15,
  stride: 1.3,
  // the clearance: the belly's outline about the capsule's axis, the farthest any vertex (hair, fingers and toes too) lies along a
  // direction |a| from the facing, 0 to 180 in 15 degree steps, over a crawl cycle and the rest (left and right alike, to a cm)
  outline: [0.953, 0.972, 0.929, 0.823, 0.661, 0.458, 0.458, 0.645, 0.867, 1.061, 1.194, 1.247, 1.226],
  rays: 48, rayY: 0.3, // (horizontal probes from the axis, evenly round, each as long as the outline reaches that way; the belly's height, m)
  beyond: 0.5, rounds: 4, margin: 0.01, slideMax: 1.0, // (m: how far past the outline a surface is felt, for what a slide would run into; tries at settling it; m left clear; the most the body is slid: the outline's farthest reach less the capsule's)
  slideIn: 60, slideOut: 18, // (1/s: how fast the slide follows a wall closing in, and lets go of one: about CRAWL.fade, but never behind a crawl at its own speed)
};

const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
/** The belly's outline as a convex polygon: one half-plane x . (sin t, cos t) <= h for each direction t round the facing (x: right, z:
 *  forward about the capsule's axis), h the support table above (left and right alike). */
const PLANES = (() => {
  const n = (CRAWL.outline.length - 1) * 2, ux = [], uz = [], h = [];
  for (let k = 0; k < n; k++) { const t = (k / n) * Math.PI * 2; ux.push(Math.sin(t)); uz.push(Math.cos(t)); h.push(CRAWL.outline[Math.min(k, n - k)]); }
  return { n, ux, uz, h };
})();
/** How far the polygon reaches along each probe ray (its angle from the facing): a ray's hit counts only when it lies inside. */
const RHO = Array.from({ length: CRAWL.rays }, (_, i) => {
  const a = (i / CRAWL.rays) * Math.PI * 2, P = PLANES; let r = 9;
  for (let k = 0; k < P.n; k++) { const c = Math.sin(a) * P.ux[k] + Math.cos(a) * P.uz[k]; if (c > 0.1) r = Math.min(r, P.h[k] / c); }
  return r;
});
const HITS = { x: new Float32Array(CRAWL.rays), z: new Float32Array(CRAWL.rays), nx: new Float32Array(CRAWL.rays), nz: new Float32Array(CRAWL.rays), bx: new Float32Array(CRAWL.rays), bz: new Float32Array(CRAWL.rays), k: new Uint8Array(CRAWL.rays), need: new Float32Array(12), pnx: new Float32Array(12), pnz: new Float32Array(12) }; // (this frame's surface points about the axis and their normals, in the world and in the body's frame; the planes by the way they face)
const _ray = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
const solid = (c) => !c.isSensor();

export class Crawl {
  constructor(ch) {
    this.ch = ch; this.C = ch.clips;
    this.w = 0; this.on = false; this.t = 0; this.out = null; this.phi = 0;
    this.p = this.C.pose(); this.p2 = this.C.pose();
    this.slide = new THREE.Vector2(); // (the clearance's: how far the body is slid off the capsule's axis, world x z)
    this.speed = Object.fromEntries([CRAWL.knees, CRAWL.belly].map((n) => [n, this.C.clips[n] ? ch.analyseGait(n).speed : 0.3])); // (built with the gait's, before the first frame: it poses the body)
  }

  get busy() { return !!this.out; }

  pose(dt, s, gs, base, cr = 0) {
    const C = this.C, want = !!s.crawl;
    if (!C.clips[CRAWL.knees]) return 0;
    if (want && !this.on) { this.on = true; this.out = null; this.t = cr > 0.5 ? CRAWL.enterFrom.crouch : CRAWL.enterFrom.stand; }
    if (!want && this.on) { this.on = false; this.out = { t: 0, to: (s.posture ? s.posture === 'crouch' : cr > 0.5) ? CRAWL.exitTo.crouch : CRAWL.exitTo.stand }; } // (the posture C chose, where the body gives it: crouchBlend stays 1 while prone)
    if (!this.on && !this.out) { this.w = 0; return 0; }
    // the loop, on its own phase at the move's speed
    const prone = THREE.MathUtils.clamp(s.prone || 0, 0, 1), sp = this.speed;
    const own = THREE.MathUtils.lerp(sp[CRAWL.knees], sp[CRAWL.belly], prone), dur = THREE.MathUtils.lerp(C.clips[CRAWL.knees].dur, C.clips[CRAWL.belly]?.dur ?? 1, prone);
    const ratio = gs / Math.max(0.05, own), stride = THREE.MathUtils.clamp(Math.sqrt(ratio), 0.8, CRAWL.stride);
    this.phi = (this.phi + (ratio / stride / dur) * dt) % 1;
    const pose = C.sample(CRAWL.knees, this.phi * C.clips[CRAWL.knees].dur, this.p);
    if (prone > 0.001 && C.clips[CRAWL.belly]) C.blend(pose, C.sample(CRAWL.belly, this.phi * C.clips[CRAWL.belly].dur, this.p2), prone);
    // getting down: the enter clip over the loop until its end
    if (this.on) {
      const e = C.clips[CRAWL.enter];
      this.t += dt;
      if (e && this.t < e.dur) C.blend(pose, C.sample(CRAWL.enter, this.t, this.p2, false), 1 - smooth(e.dur - CRAWL.fade, e.dur, this.t));
      this.w = Math.min(1, this.w + dt / CRAWL.fade);
    } else {
      // getting up: the exit clip from its start, the crawl's weight out over its last fade
      const o = this.out;
      o.t += dt;
      if (C.clips[CRAWL.exit]) C.blend(pose, C.sample(CRAWL.exit, Math.min(o.t, o.to), this.p2, false), smooth(0, CRAWL.fade * 0.5, o.t));
      this.w = 1 - smooth(o.to - CRAWL.fade, o.to, o.t);
      if (o.t >= o.to) { this.out = null; this.w = 0; return 0; }
    }
    C.blend(base, pose, this.w);
    this.clear(dt, s, base, this.w * prone);
    return this.w;
  }

  /** THE CLEARANCE: probe the ring of rays from the capsule's axis, then slide the body until the surfaces met are out of its outline:
   *  each surface point inside it is moved along its normal by the polygon's nearest edge, the planes found added by the way they face
   *  (two facing cancel, a corner adds), and the body, so moved, tried again against every point (a prop's push into a wall is given
   *  back, the poke shared) a few rounds. Eased, then laid on base. k: how much of the belly crawl is on (0 lets the slide go). */
  clear(dt, s, base, k) {
    const game = s.techs?.game, W = game?.physics?.world, A = this.slide, Q = PLANES, H = HITS;
    let tx = 0, tz = 0;
    if (W && s.pos && k > 0.01 && Number.isFinite(s.pos.x + s.pos.y + s.pos.z)) {
      const yaw = s.yaw || 0, c = Math.cos(yaw), sn = Math.sin(yaw), n = CRAWL.rays, collider = game.player?.collider;
      let m = 0;
      _ray.origin.x = s.pos.x; _ray.origin.y = s.pos.y + CRAWL.rayY; _ray.origin.z = s.pos.z;
      for (let i = 0; i < n; i++) {
        const dx = Math.sin(yaw + (i / n) * Math.PI * 2), dz = Math.cos(yaw + (i / n) * Math.PI * 2);
        _ray.dir.x = dx; _ray.dir.z = dz;
        const hit = W.castRayAndGetNormal(_ray, RHO[i] + CRAWL.beyond, true, undefined, GROUPS.controllerQuery, collider, undefined, solid);
        if (!hit) continue;
        const nl = Math.hypot(hit.normal.x, hit.normal.z), t = hit.timeOfImpact;
        if (nl < 0.5 || t < 0.02) continue; // (a floor or a ceiling, or the axis inside something)
        const nx = hit.normal.x / nl, nz = hit.normal.z / nl;
        H.x[m] = t * dx; H.z[m] = t * dz; H.nx[m] = nx; H.nz[m] = nz; H.bx[m] = nx * c - nz * sn; H.bz[m] = nx * sn + nz * c; H.k[m] = (Math.round(Math.atan2(nx, nz) / (Math.PI / 6)) + 12) % 12; m++;
      }
      let ax = 0, az = 0;
      for (let round = 0; round < CRAWL.rounds && m; round++) {
        const need = H.need; need.fill(0);
        for (let j = 0; j < m; j++) {
          const rx = H.x[j] - ax, rz = H.z[j] - az, px = rx * c - rz * sn, pz = rx * sn + rz * c; // (the point against the body as slid so far, in its frame)
          let out = 9, inside = true;
          for (let q = 0; q < Q.n; q++) {
            const over = Q.h[q] - px * Q.ux[q] - pz * Q.uz[q];
            if (over < 0) { inside = false; break; }
            const mv = -(H.bx[j] * Q.ux[q] + H.bz[j] * Q.uz[q]); // (how fast moving the point against its normal nears this edge)
            if (mv > 0.05) out = Math.min(out, over / mv);
          }
          if (inside && out < 9 && out + CRAWL.margin > need[H.k[j]]) { need[H.k[j]] = out + CRAWL.margin; H.pnx[H.k[j]] = H.nx[j]; H.pnz[H.k[j]] = H.nz[j]; }
        }
        let dx = 0, dz = 0;
        for (let b = 0; b < 12; b++) if (need[b] > 0) { dx += H.pnx[b] * need[b]; dz += H.pnz[b] * need[b]; }
        if (dx * dx + dz * dz < 1e-6) break;
        const w = round ? 0.5 : 1; // (the first round is the whole of a lone wall; later ones share a conflict)
        ax += dx * w; az += dz * w;
        const len = Math.hypot(ax, az);
        if (len > CRAWL.slideMax) { ax *= CRAWL.slideMax / len; az *= CRAWL.slideMax / len; }
      }
      tx = ax; tz = az;
    }
    const rate = Math.hypot(tx, tz) > A.length() ? CRAWL.slideIn : CRAWL.slideOut;
    A.set(THREE.MathUtils.damp(A.x, tx, rate, dt), THREE.MathUtils.damp(A.y, tz, rate, dt));
    if (A.lengthSq() < 1e-8) { A.set(0, 0); return; }
    const yaw = s.yaw || 0, c = Math.cos(yaw), sn = Math.sin(yaw); // (the pelvis lies in the root's frame, which is the body's yaw: world to local)
    base.p[0] += (A.x * c - A.y * sn) * k; base.p[2] += (A.x * sn + A.y * c) * k;
  }
}
