// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S TRAINING TARGETS, THE QUINTAIN'S BODY: the jousting knight's old practice target, made by Pip: a walnut post on a
// plank cart rolling on two thread spools, a burlap sack for a head (Strawman's buttons, a stitched mouth, straw out of its crown), and
// across its shoulders the pivoting arm (broken once and splinted in twine: one of Pip's first tries, LORE.md), a target shield (Strawman's
// red and cream rings) on one end and a sandbag on a rope on the other. Strike it and the arm swings round: it winds back a beat (its
// tell), then the sandbag comes about, flung out by the turn.
//
// Prior art: the quintain (medieval tilting practice: strike the shield, and the sandbag on the far arm swings round at the rider who is
// too slow), the scarecrow on its post, Strawman's sack head (vfx/strawman.js), cotton-reel tanks (the spool on wheels, a child's toy).
//
//   new QuintainBody()   (the contract: targets/kit.js TargetBody)   QUINTAIN_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TargetBody, TARGET_LOOK as L, Sheet, box, rgb, uvOf, V, bullseye, buttonEye, strawTuft } from './kit.js';

/** Its sizes (m) and its swing: the cart, the spools, the post's top, the head, the arm (its pivot's height and half-length), the shield,
 *  the rope and bag; the wind back (rad) and its time (s), the swing's turn (rad) and time (s), the bag's fling (rad at full speed). */
export const QUINTAIN_LOOK = {
  cart: [0.92, 0.1, 0.56], axle: 0.16, spool: { r: 0.12, flange: 0.16, w: 0.46 }, post: 1.46, beam: 0.075, head: 0.21, pivot: 1.3, arm: 0.8,
  shield: 0.35, rope: 0.32, bag: [0.2, 0.27],
  windBack: 0.55, wind: 0.42, turn: Math.PI * 2, swing: 0.6, fling: 1.15,
};
const Q = QUINTAIN_LOOK;

const ease = (t) => 1 - (1 - t) ** 3;

export class QuintainBody extends TargetBody {
  constructor() {
    super();
    const [cw, ch, cd] = Q.cart, Sp = Q.spool, wood = (f) => rgb(0x6b4226, f === 't' ? 1.1 : f === 'f' ? 0.9 : 0.7);
    // the cart and its post
    const S0 = new Sheet();
    box(S0, -cw / 2, cw / 2, Q.axle, Q.axle + ch, -cd / 2, cd / 2, wood, 'ftlrb');
    for (let x = -cw / 2; x < cw / 2 - 1e-3; x += cw) S0.quad(V(x, Q.axle, cd / 2 + 0.002), V(x + cw, Q.axle, cd / 2 + 0.002), V(x + cw, Q.axle + ch, cd / 2 + 0.002), V(x, Q.axle + ch, cd / 2 + 0.002), rgb(0xffffff, 0.8), uvOf('walnut', 0, 0, 1, 0.3));
    const pb = Q.beam; box(S0, -pb, pb, Q.axle + ch, Q.post, -pb, pb, (f) => rgb(L.post, f === 'f' ? 1.2 : 0.8), 'ftlrb');
    for (const s of [-1, 1]) box(S0, s * 0.05 - (s > 0 ? 0 : 0.12), s * 0.05 + (s > 0 ? 0.12 : 0), Q.axle + ch, Q.axle + ch + 0.05, -0.03, 0.03, wood, 'ftlr'); // (two braces)
    // the head: a sack, its buttons and stitched mouth, its tied neck, straw from its crown
    const hy = Q.post + Q.head * 0.85, sack = new THREE.SphereGeometry(Q.head, 16, 12).scale(1, 0.92, 0.85).translate(0, hy, 0);
    S0.add(sack, (p, n) => rgb(L.burlap, 0.7 + 0.35 * Math.max(0, n.z * 0.6 + n.y * 0.4 + 0.3))); sack.dispose();
    const zf = Q.head * 0.85 - 0.01;
    buttonEye(S0, -0.06, hy + 0.035, zf, 0.034); buttonEye(S0, 0.06, hy + 0.035, zf, 0.034);
    for (let i = 0; i < 5; i++) { const x = -0.06 + i * 0.03; box(S0, x - 0.008, x + 0.008, hy - 0.06 - (i % 2) * 0.01, hy - 0.05 - (i % 2) * 0.01, zf - 0.02, zf - 0.005, rgb(L.seam), 'f'); }
    box(S0, -0.09, 0.09, Q.post - 0.03, Q.post + 0.03, -0.09, 0.09, rgb(L.seam, 0.9), 'ftlrb'); // (the neck's tie)
    strawTuft(S0, 0, hy + Q.head * 0.85, 0, Math.PI / 2, 0.12, 5, 11);
    this.mesh(S0);
    // the spools: thread wound between two walnut flanges, one colour each, turning as it rolls
    this.wheels = [];
    for (const [i, x] of [-cw * 0.32, cw * 0.32].entries()) {
      const S = new Sheet(), g = new THREE.Group(); g.position.set(x, Q.axle, 0); this.flip.add(g);
      const core = new THREE.CylinderGeometry(Sp.r, Sp.r, Sp.w * 0.8, 16).rotateX(Math.PI / 2);
      S.add(core, (p, n) => rgb(L.thread[i], 0.7 + 0.3 * Math.sin(p.z * 120) * 0.5 + 0.2 * Math.max(0, n.y))); core.dispose();
      for (const z of [-Sp.w / 2, Sp.w / 2]) {
        const fl = new THREE.CylinderGeometry(Sp.flange, Sp.flange, 0.04, 16).rotateX(Math.PI / 2).translate(0, 0, z);
        S.add(fl, (p, n) => rgb(0xc89a5c, 0.6 + 0.4 * Math.max(0, n.z * Math.sign(z)) + 0.1 * Math.cos(Math.atan2(p.y, p.x) * 4))); fl.dispose();
      }
      this.mesh(S, g); this.wheels.push(g);
    }
    // the arm: its beam and brass cap, the shield on one end, the rope and bag on the other
    this.arm = new THREE.Group(); this.arm.position.y = Q.pivot; this.flip.add(this.arm);
    const S1 = new Sheet(), A = Q.arm;
    box(S1, -A, A, -0.045, 0.045, -0.045, 0.045, (f) => rgb(0x6b4226, f === 't' ? 1.15 : 0.8), 'ftulrb');
    // the arm's old break, splinted: two slats over it, bound in twine (LORE.md: patched where it failed)
    for (const z of [-0.05, 0.05]) box(S1, -0.36, -0.08, -0.03, 0.03, z - 0.008, z + 0.008, (f) => rgb(0xc89a5c, f === 'f' || f === 'b' ? 1 : 0.75), 'ftbulr');
    for (const x of [-0.32, -0.22, -0.12]) box(S1, x - 0.018, x + 0.018, -0.055, 0.055, -0.062, 0.062, rgb(L.seam, 1.15), 'ftbulr');
    const cap = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12); S1.add(cap, rgb(L.brass, 1.1)); cap.dispose();
    const sx = A - 0.12, sy = -0.05 - Q.shield;
    box(S1, sx - 0.02, sx + 0.02, sy, -0.035, -0.02, 0.02, rgb(L.post), 'ftlr');
    bullseye(S1, sx, sy, 0.025, Q.shield, 5);
    for (let s = 0; s < 28; s++) { // (the shield's rim between its two faces)
      const a0 = (s / 28) * Math.PI * 2, a1 = ((s + 1) / 28) * Math.PI * 2, c = (a, z) => V(sx + Math.cos(a) * Q.shield, sy + Math.sin(a) * Q.shield, z);
      S1.quad(c(a0, -0.025), c(a1, -0.025), c(a1, 0.025), c(a0, 0.025), rgb(L.post, 0.9));
    }
    this.mesh(S1, this.arm);
    // the back of the shield: the rings drawn facing -z too (the arm turns it about)
    const Sb = new Sheet(); bullseye(Sb, 0, 0, 0, Q.shield, 5); const back = this.mesh(Sb, this.arm); back.position.set(sx, sy, -0.026); back.rotation.y = Math.PI;
    this.bag = new THREE.Group(); this.bag.position.set(-A + 0.06, 0, 0); this.arm.add(this.bag);
    const S2 = new Sheet(), [br, bh] = Q.bag;
    box(S2, -0.01, 0.01, -Q.rope, 0, -0.01, 0.01, rgb(L.seam, 1.1), 'ftlrb');
    const bag = new THREE.SphereGeometry(1, 14, 10).scale(br, bh, br).translate(0, -Q.rope - bh * 0.9, 0);
    S2.add(bag, (p, n) => rgb(L.burlap, 0.62 + 0.3 * Math.max(0, n.z * 0.7 + n.y * 0.3 + 0.2) - (Math.abs(p.x) < 0.01 ? 0.25 : 0))); bag.dispose();
    box(S2, -0.06, 0.06, -Q.rope - bh * 0.85, -Q.rope - bh * 0.85 + 0.09, br * 0.92, br * 0.95, rgb(L.red, 0.9), 'f'); // (a patch)
    box(S2, -0.03, 0.03, -Q.rope - 0.03, -Q.rope + 0.01, -0.03, 0.03, rgb(L.seam, 0.8), 'ftlr'); // (its tie)
    this.mesh(S2, this.bag);
    this.moveFor = Q.wind + Q.swing + 0.1; this.parts.right = this.bag; this.lastX = null; this.armA = 0; this.armV = 0;
  }

  pose(dt) {
    const mv = this.mv, x = this.group.position.x;
    if (this.lastX != null) { const roll = (x - this.lastX) / Q.spool.r; for (const w of this.wheels) w.rotation.z -= roll * this.flip.scale.x; }
    this.lastX = x;
    let a = 0.12 * Math.sin(this.t * 0.9) + 0.05 * Math.sin(this.t * 2.3);
    if (mv?.id === 'swing') {
      const t = mv.t;
      a = t < Q.wind ? -Q.windBack * ease(t / Q.wind) : -Q.windBack + (Q.turn + Q.windBack) * ease(Math.min(1, (t - Q.wind) / Q.swing));
    }
    const prev = this.armA; this.armA += (a - this.armA) * Math.min(1, dt * (mv ? 30 : 6));
    this.armV = (this.armA - prev) / Math.max(dt, 1e-3);
    this.arm.rotation.y = this.armA;
    this.bag.rotation.z += (-Math.min(Q.fling, Math.abs(this.armV) * 0.12) - this.bag.rotation.z) * Math.min(1, dt * 8);
    if (!mv) this.armA = Math.atan2(Math.sin(this.armA), Math.cos(this.armA)); // (a whole turn done: back to the near way round)
  }
}
