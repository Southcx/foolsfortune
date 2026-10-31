// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S TRAINING TARGETS, THE TARGET HOPPER'S BODY: an archery butt of coiled straw (the boss a target face is pinned to),
// painted with Strawman's red and cream rings, two buttons sewn on for eyes and a spent arrow still stuck in it, straw bristling from its
// rim, sat on a bedspring screwed to a walnut block: Pip's idea of a target that comes to you. The spring sags as it crouches to pounce
// (its tell), stretches as it leaps, and the boss squashes when it lands.
//
// Prior art: the archery boss (coiled straw rope, a paper face pinned on), the jack-in-the-box's spring, Super Mario's Pokey and the
// hopping Goombrat's bounce, squash and stretch (Disney's twelve principles).
//
//   new TargetHopperBody()   (the contract: targets/kit.js TargetBody)   HOPPER_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TargetBody, TARGET_LOOK as L, Sheet, box, rgb, V, bullseye, buttonEye, strawTuft } from './kit.js';

/** Its sizes (m): the block, the spring (rest height, coil radius, turns, wire), the boss (radius, depth, its middle over the spring's
 *  top), the face; the spring's crouch and stretch, the landing's squash. */
export const HOPPER_LOOK = {
  block: [0.56, 0.1, 0.4], spring: { h: 0.42, r: 0.12, turns: 5.5, wire: 0.022 }, boss: { r: 0.42, depth: 0.24, lift: 0.38 }, face: 0.36,
  crouch: 0.5, stretch: 1.3, squash: 0.22, crouchFor: 0.45,
};
const H = HOPPER_LOOK;

/** A rod from a to b (a thin cylinder) into the sheet. */
function rod(S, a, b, r, col) {
  const d = b.clone().sub(a), geo = new THREE.CylinderGeometry(r, r, d.length(), 6);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize())).translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  S.add(geo, col); geo.dispose();
}

export class TargetHopperBody extends TargetBody {
  constructor() {
    super();
    const B = H.boss, Sp = H.spring;
    // the block
    const S0 = new Sheet(); const [bw, bh, bd] = H.block;
    box(S0, -bw / 2, bw / 2, 0, bh, -bd / 2, bd / 2, (f) => rgb(0x6b4226, f === 't' ? 1.1 : 0.75), 'ftlrb');
    for (const x of [-bw * 0.32, bw * 0.32]) box(S0, x - 0.025, x + 0.025, bh, bh + 0.012, -0.025, 0.025, rgb(L.brass, 1.2), 'ft'); // (its two screws)
    this.mesh(S0);
    // the spring: a helix of steel wire, scaled from its foot
    const turns = Sp.turns, pts = [];
    for (let i = 0; i <= 96; i++) { const t = i / 96, a = t * turns * Math.PI * 2; pts.push(V(Math.cos(a) * Sp.r, t * Sp.h, Math.sin(a) * Sp.r)); }
    const S1 = new Sheet(), tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, Sp.wire, 5, false);
    S1.add(tube, (p, n) => rgb(L.steel, 0.65 + 0.5 * Math.max(0, n.z * 0.7 + n.y * 0.3))); tube.dispose();
    this.springs = new THREE.Group(); this.springs.position.y = bh; this.flip.add(this.springs); this.mesh(S1, this.springs);
    // the boss: coiled straw (its rim banded by the rope's turns, a burlap binding), its face pinned on, eyes, the arrow, straw ends
    this.boss = new THREE.Group(); this.flip.add(this.boss);
    const S2 = new Sheet(), cyl = new THREE.CylinderGeometry(B.r, B.r, B.depth, 32, 1).rotateX(Math.PI / 2);
    S2.add(cyl, (p, n) => {
      if (Math.abs(n.z) > 0.5) return rgb(L.straw, n.z > 0 ? 0.9 : 0.8);
      const band = 0.5 + 0.5 * Math.sin(p.z * 70), bind = Math.abs(Math.atan2(p.y, p.x) - 1.2) < 0.09 || Math.abs(Math.atan2(p.y, p.x) + 1.9) < 0.09;
      return bind ? rgb(L.seam, 0.9) : rgb(band > 0.5 ? L.straw : L.strawDark, 0.85 + 0.15 * band);
    });
    cyl.dispose();
    const zf = B.depth / 2 + 0.004;
    bullseye(S2, 0, 0, zf, H.face, 5);
    // the face's paper edge, a cream ring between the rings and the straw
    for (let s = 0; s < 32; s++) {
      const a0 = (s / 32) * Math.PI * 2, a1 = ((s + 1) / 32) * Math.PI * 2, c = (rr, a) => V(Math.cos(a) * rr, Math.sin(a) * rr, zf - 0.001);
      S2.quad(c(H.face, a0), c(H.face + 0.025, a0), c(H.face + 0.025, a1), c(H.face, a1), rgb(L.cream, 0.8));
    }
    buttonEye(S2, -0.12, 0.21, zf, 0.052); buttonEye(S2, 0.12, 0.21, zf, 0.052);
    // the arrow it caught, fletched in Strawman's red and cream
    const nock = V(0.38, 0.02, 0.42), tip = V(0.13, -0.11, zf - 0.02);
    rod(S2, tip, nock, 0.012, rgb(0xc89a5c, 1));
    const dir = nock.clone().sub(tip).normalize(), up = V(0, 1, 0).cross(dir).normalize();
    for (const [k, col] of [[1, L.red], [-1, L.cream]]) {
      const b = nock.clone().addScaledVector(dir, -0.11), o = up.clone().multiplyScalar(0.05 * k);
      S2.tri(nock.clone(), b.clone().add(o), b.clone(), rgb(col)); S2.tri(nock.clone(), b.clone(), b.clone().add(o), rgb(col));
    }
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + 0.3; strawTuft(S2, Math.cos(a) * B.r * 0.98, Math.sin(a) * B.r * 0.98, 0, a, 0.13, 4, i + 3); }
    this.mesh(S2, this.boss);
    this.moveFor = H.crouchFor + 0.05; this.parts.right = this.boss; this.land = 0; this.wasAir = false;
  }

  pose(dt) {
    const Sp = H.spring, B = H.boss, mv = this.mv;
    if (this.wasAir && !this.air) this.land = 1;
    this.wasAir = this.air; this.land = Math.max(0, this.land - dt * 5);
    let s = 1 + 0.05 * Math.sin(this.t * 3.4);
    if (mv?.id === 'swing') s = THREE.MathUtils.lerp(1, H.crouch, Math.min(1, mv.t / H.crouchFor));
    else if (this.air) s = this.vy > 0 ? H.stretch : 1.05;
    s -= this.land * 0.35;
    const k = this.springs.scale.y + (s - this.springs.scale.y) * Math.min(1, dt * 18);
    this.springs.scale.y = k;
    const sq = this.land * H.squash + (mv?.id === 'swing' ? 0.08 : 0), hit = this.hitT > 0 ? 0.06 : 0;
    this.boss.position.y = H.block[1] + Sp.h * k + B.lift - sq * B.r;
    this.boss.scale.set(1 + sq + hit, 1 - sq, 1);
  }
}
