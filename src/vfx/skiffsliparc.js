// ---------------------------------------------------------------------------------------
// THE SLIP ARC (docs/plans/SKIFF-TUNING.md T7; Dovina's handoff, 2026-10-24): the board's slip angle read off the sand under it while you
// ride, with no words and no numbers. A flat arc lies round the Solar Skiff's bow just over the sand, its middle on the bow's line; its
// needle points the way the board is really going (atan2(vl, vf), the angle the run trace samples), so the needle off the middle is
// the slide itself. The arc's two ends are the band where the grip lets go: an ember from the slide's threshold (0.15 rad, the GARAGE's
// "sliding") outward, the threshold drawn in by the grip the board has now (a carve's, the sheet's Fin, a part's, wet sand's), so a
// grippy board shows a narrow band and a loose one a wide one. The calm middle is the labradorite's play (schillerInk), as the grind's
// balance mark is. Shown only on the ground and under way, faded in and out; in the air it goes.
//
// Prior art: Forza's and Gran Turismo's tyre slip telemetry (the slip angle against the grip's peak), the aircraft's turn-and-slip ball,
// Tony Hawk's balance arrow; the grind's balance mark (vfx/grindbalancemark.js) for how a mark is worn on the board.
//
//   const A = new SkiffSlipArc(game)   A.update(dt)   (it finds the skiff tech itself)   A.dispose()   SLIP_ARC (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { schillerInk, SCHILLER } from './oxidation.js';
import { SLIDE } from '../progress/skifftune.js';

/** The numbers, in the board's own frame (+Z the bow, Y up; m and rad): the arc's height over the deck (below it: just over the sand),
 *  its radius and width, its half-sweep from the bow, its segments; the slide's threshold (rad) and the grip that sets it (the band
 *  begins at threshold x grip, never past `maxEdge` of the sweep); the needle's length (share of the radius) and width; the least
 *  speed it shows at (m/s); the fade's rate; brightness of the calm and the band; the ember. */
export const SLIP_ARC = {
  y: -0.52, r: 1.75, w: 0.12, sweep: 1.1, segs: 36,
  minEdge: 0.03, maxEdge: 0.9,
  needle: { len: 1.12, w: 0.09 },
  minSpeed: 3, fade: 6,
  lit: { calm: 0.7, band: 0.95 },
  ember: 0xff7a2a,
};
const S = SLIP_ARC, EMBER = new THREE.Color(S.ember), _c = new THREE.Color(), _e = new THREE.Color();

export class SkiffSlipArc {
  constructor(game) {
    this.game = game; this.k = 0; this.t = 0; this.slip = 0;
    const N = S.segs, pos = new Float32Array((N + 1) * 2 * 3), idx = [];
    for (let i = 0; i <= N; i++) {
      const a = -S.sweep + (2 * S.sweep * i) / N, sa = Math.sin(a), ca = Math.cos(a);
      pos.set([sa * (S.r - S.w), 0, ca * (S.r - S.w), sa * (S.r + S.w), 0, ca * (S.r + S.w)], i * 6);
      if (i < N) { const j = i * 2; idx.push(j, j + 1, j + 2, j + 1, j + 3, j + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.length), 3)); g.setIndex(idx);
    const mat = () => new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, opacity: 0 });
    this.arc = new THREE.Mesh(g, this.arcMat = mat()); this.arc.name = 'skiff-slip-arc';
    const L = S.r * S.needle.len, w = S.needle.w, ng = new THREE.BufferGeometry(); // (a slim diamond from the hub out along +Z)
    ng.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, S.r * 0.35, w, 0, L * 0.7, 0, 0, L, -w, 0, L * 0.7], 3));
    ng.setAttribute('color', new THREE.Float32BufferAttribute(new Array(12).fill(1), 3)); ng.setIndex([0, 1, 2, 0, 2, 3]);
    this.needle = new THREE.Mesh(ng, this.needleMat = mat()); this.needle.name = 'skiff-slip-needle';
    this.group = new THREE.Group(); this.group.name = 'skiff-slip-arc'; this.group.position.y = S.y; this.group.renderOrder = 3;
    this.group.add(this.arc, this.needle); this.group.visible = false;
    for (const m of [this.arc, this.needle]) { m.raycast = () => {}; m.frustumCulled = false; m.renderOrder = 3; }
  }

  /** The skiff tech's word on now: under way on the ground, the slip, and the grip it has (1 the board as it came). */
  read() {
    const T = this.game.player?.techs?.get?.('skiff');
    if (!T?.active || !T.skiff?.group || T.phase !== 'ride' || !T.v) return null;
    const h = T.heading, vf = T.v.x * Math.sin(h) + T.v.z * Math.cos(h), vl = -T.v.x * Math.cos(h) + T.v.z * Math.sin(h);
    const grip = (T.carve ? 0.3 : 1) * (T.rules?.mult?.('grip') ?? 1) * (T.rules?.surfaceGrip?.(T.onWater) ?? 1);
    return { group: T.skiff.group, on: !T.air && !T.grind?.on && Math.hypot(vf, vl) > S.minSpeed, slip: Math.atan2(vl, Math.max(0.5, Math.abs(vf))), grip };
  }

  update(dt) {
    this.t += dt;
    const R = this.read();
    if (R && this.group.parent !== R.group) R.group.add(this.group);
    this.k += ((R?.on ? 1 : 0) - this.k) * Math.min(1, dt * S.fade);
    this.group.visible = !!R && this.k > 0.01; if (!this.group.visible) return;
    this.slip += (R.slip - this.slip) * Math.min(1, dt * 14); // (a touch of damping, so the needle never jitters on the sand's grain)
    const edge = Math.max(S.minEdge, Math.min(S.sweep * S.maxEdge, SLIDE.slip * R.grip)), over = Math.max(0, Math.abs(this.slip) - edge) / Math.max(1e-3, S.sweep - edge);
    // the arc's colours: the calm the schiller walking along it, the band the ember brightening out to each tip and with the slide
    const C = this.arc.geometry.attributes.color, N = S.segs;
    for (let i = 0; i <= N; i++) {
      const a = -S.sweep + (2 * S.sweep * i) / N, out = Math.abs(a) > edge;
      if (out) { const u = (Math.abs(a) - edge) / Math.max(1e-3, S.sweep - edge); _c.copy(EMBER).multiplyScalar(S.lit.band * (0.45 + 0.55 * u) * (Math.sign(a) === -Math.sign(this.slip) ? 1 + over : 0.8)); }
      else schillerInk(this.t * SCHILLER.rate + i * 0.02, _c).multiplyScalar(S.lit.calm);
      C.setXYZ(i * 2, _c.r, _c.g, _c.b); C.setXYZ(i * 2 + 1, _c.r, _c.g, _c.b);
    }
    C.needsUpdate = true;
    // the needle: along the board's real motion (its slip off the bow), warming as it crosses into the band
    const a = Math.max(-S.sweep, Math.min(S.sweep, this.slip)); this.needle.rotation.y = -a; // (vl is to the board's right, -X: the arc's +a side is its left)
    schillerInk(this.t * SCHILLER.rate, _e, { floor: 0.6 }).lerp(EMBER, Math.min(1, over * 1.5 + (Math.abs(a) > edge ? 0.4 : 0)));
    const NC = this.needle.geometry.attributes.color; for (let i = 0; i < 4; i++) NC.setXYZ(i, _e.r, _e.g, _e.b); NC.needsUpdate = true;
    this.arcMat.opacity = 0.85 * this.k; this.needleMat.opacity = this.k;
  }

  dispose() { this.group.removeFromParent(); this.arc.geometry.dispose(); this.needle.geometry.dispose(); this.arcMat.dispose(); this.needleMat.dispose(); }
}
