// ---------------------------------------------------------------------------------------
// THE TARGET MARK: one mark for what the System sees you could act on, the chevron's prism (vfx/chevron.js) in states (South,
// 2026-11-22: "the lock-on system needs to be unified with the tags that show information about an enemy, as well as unified with
// the object interact pentagonal prism chevron"). It replaced the lock-on's brackets (the angling reticle, `{ mind: true }`) and the
// creature tag's eye bracket and dashed leader.
//
//   USABLE   F would use it (game.interact.cur): the chevron as it always was, rainbow-edged black labradorite.
//   LOCKED   the lock-on's target (game.lock): the same prism over the lock point, larger, its edges gold (the lock's GOLD), its
//            inner turning faster, and its five side edges run on past its point as blades that close round the thing as the lock
//            takes; let go, they open and fade. Locked and usable at once: the one gold prism, its inner flash pulsing (never two marks
//            on one thing: the usable one hands its pose over to the lock and is cut the same frame, and back when the lock lets go).
//   READ     a creature wearing a tag with no lock on it (the Veritome's raised lens, a flare's finds): a small dim prism over it,
//            its tag hung from the prism's top on a thread of the labradorite (vfx/creaturetags.js asks `topOf`).
//   A thing usable while another is locked: two marks, the usable one eased off the lock's prism and blades on the screen.
//
// World marks: no words (precept 7); the words are the tag's. Driven here, in the frame's `marks` phase, after the camera is placed
// (casebook 246: aimed through this frame's camera), from what the lock and the interact hold, so they never draw a mark themselves.
// Its sizes read the view's camera (the sparring mirror's leaves them out: vfx/sparringmirror.js). One prism a thing, pooled: the
// usable one, the lock's, and READS read prisms; every one in the Mind's one program (casebook 5).
//
// Prior art: Zelda's Z-target (the marker on the thing held), Rez's lock squares (a frame closing on a target), The Sims' Plumbob
// (the prism over a thing), Persona's and every action-RPG's interact arrow; Watch Dogs' profiler for the tag hung off its mark.
//
//   game.targetMarks = new TargetMarks(game)   .update(dt) (the marks phase)   .usableMark (the prism showing USABLE: the lock's
//   when merged; game.interact.chevron)   .topOf(creature, out) -> Vector3 | null   .markOf(creature) -> Chevron | null   .groups()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Chevron } from './chevron.js';

/** size: the prism's scale (the chevron is 1) and how it grows with the view's distance (m^-1, so it holds its size on the screen);
 *  lift: m between the thing's top and the prism's point; merge: m within which the lock and the usable thing are one thing;
 *  sep: how far apart on the screen the two marks are held (their radii's sum times this). */
export const TARGET_MARK = {
  lock: { size: 1.45, perM: 0.085, lift: 0.12, spin: 2.0, bob: 0.025 },
  read: { size: 0.7, perM: 0.042, lift: 0.08, dim: 0.5, bob: 0.02 },
  reads: 4, merge: 1.0, sep: 1.15,
};
const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3();

export class TargetMarks {
  constructor(game) {
    this.game = game; const S = game.scene;
    this.usable = new Chevron(S, { order: 40 });
    this.lock = new Chevron(S, { blades: true, order: 44 });
    this.reads = Array.from({ length: TARGET_MARK.reads }, () => Object.assign(new Chevron(S, { order: 42 }), { owner: null }));
    this.lockRef = null; this.taken = -1; this.merged = false; this.r = 0.5;
    this.ut = new THREE.Vector3(); this.nudge = new THREE.Vector3(); this.nudgeWant = new THREE.Vector3(); this.lt = new THREE.Vector3();
  }
  /** The prism that shows what F would use (the lock's while they are one thing). */
  get usableMark() { return this.merged ? this.lock : this.usable; }
  groups() { return [this.usable.group, this.lock.group, ...this.reads.map((r) => r.group)]; }
  /** Where a creature's tag is tied: the top of its lock or read prism, while drawn. */
  topOf(c, out) { const m = this.markOf(c); return m ? m.top(out) : null; }
  /** The prism drawn over a creature (its lock's or its read one), or null. */
  markOf(c) { return (c && c === this.lockRef && this.lock.group.visible ? this.lock : this.reads.find((r) => r.owner === c && r.group.visible)) || null; }
  /** A world size at distance d to CSS px on the view. */
  px(d) { const cam = this.game.camera; return innerHeight / (2 * Math.max(0.1, d) * Math.tan(THREE.MathUtils.degToRad(cam.fov || 60) / 2)); }

  update(dt) {
    const g = this.game, cam = g.camera, L = g.lock; if (!cam) return;
    cam.getWorldPosition(_a);
    const aboard = !!g.rail?.stage?.active || !!g.realm?.active || !!g.opensea?.sailing || !!g.trackEditor?.active || !!g.haunt?.on;
    const t = L?.target, lockOn = !!t && !g.god?.controlling && !aboard && !g.duel?.active && !g.duel?.pending && L.alive(t);
    const cur = g.interact?.cur;
    // ---- LOCKED
    if (lockOn) {
      L.shownOf(t, _p); const r = this.r = L.radiusOf(t), C = TARGET_MARK.lock, d = _p.distanceTo(_a), size = Math.max(C.size, d * C.perM);
      const fresh = t.ref !== this.lockRef || L.taken !== this.taken; this.lockRef = t.ref; this.taken = L.taken;
      const one = !!cur && (cur.ref === t.ref || cur.pos.distanceTo(_p) < TARGET_MARK.merge);
      this.lt.copy(_p).addScaledVector(THREE.Object3D.DEFAULT_UP, r * 0.9 + C.lift + 0.23 * size);
      if (fresh) { this.lock.close = 0; if (one && this.usable.k > 0) { this.lock.copyPose(this.usable); this.usable.cut(); } } // (the hand-over: one mark)
      this.lock.target(this.lt);
      this.lock.style({ size, gold: 1, spin: C.spin, pulse: one ? 1 : 0, dim: 1, bob: C.bob, blade: { r: Math.max(r, size * 0.22), l: r * 0.9 + C.lift + r * 0.45, k: 1 } });
      if (one && !this.merged && this.usable.k > 0) this.usable.cut();
      this.merged = one;
    } else {
      if (this.merged && cur && this.lock.k > 0) { this.usable.copyPose(this.lock); this.lock.cut(); } // (the lock let go of the thing F still would use: the mark goes back to its chevron)
      this.lock.target(null); this.lock.style({ blade: this.lock.st.blade && { ...this.lock.st.blade, k: 0 }, pulse: 0 }); this.lockRef = null; this.merged = false;
    }
    // ---- USABLE (eased off the lock's prism and blades on the screen: two marks, never over each other)
    if (cur && !this.merged) {
      this.nudgeWant.set(0, 0, 0);
      if (lockOn && this.lock.k > 0.2) {
        const du = cur.pos.distanceTo(_a), ku = this.px(du), ru = 0.3 * ku;
        for (const [c, rad] of [[this.lock.group.position, 0.3 * this.lock.group.scale.y], [_p, this.r * 1.2]]) {
          const s0 = _q.copy(c).project(cam), s1 = _b.copy(cur.pos).project(cam); if (s0.z > 1 || s1.z > 1) continue;
          const dx = (s1.x - s0.x) * innerWidth / 2, dy = (s1.y - s0.y) * innerHeight / 2, dist = Math.hypot(dx, dy), need = (rad * this.px(c.distanceTo(_a)) + ru) * TARGET_MARK.sep;
          if (dist >= need) continue;
          const ux = dist > 1 ? dx / dist : 0, uy = dist > 1 ? dy / dist : 1, push = (need - dist) / ku; // (px to m at the usable thing's depth)
          _r.setFromMatrixColumn(cam.matrixWorld, 0); _u.setFromMatrixColumn(cam.matrixWorld, 1);
          this.nudgeWant.addScaledVector(_r, ux * push).addScaledVector(_u, uy * push);
        }
      }
      this.nudge.lerp(this.nudgeWant, 1 - Math.exp(-dt * 10));
      this.usable.target(this.ut.copy(cur.pos).add(this.nudge), cur.up); this.usable.style({ size: 1, gold: 0, spin: 1, pulse: 0, dim: 1, bob: 0.05 });
    } else { this.usable.target(null); this.nudge.set(0, 0, 0); }
    // ---- READ (the tagged with no lock: the creature tags' own list, while they are drawn)
    const CT = g.creatureTags, R = TARGET_MARK.read, want = [];
    if (CT?.root && !CT.root.userData.overlayHidden && !g.god?.controlling && !aboard) for (const [c, T] of CT.tags) if (T.want && !(lockOn && c === t.ref) && want.length < this.reads.length) want.push(c);
    for (const m of this.reads) if (m.owner && !want.includes(m.owner)) { m.target(null); if (m.k <= 0) m.owner = null; }
    for (const c of want) {
      let m = this.reads.find((x) => x.owner === c) || this.reads.find((x) => !x.owner) || this.reads.find((x) => x.want === 0);
      if (!m) continue; if (m.owner !== c) { m.owner = c; m.cut(); }
      const type = g.clappers?.list?.includes(c) ? 'clapper' : 'creature', tt = { type, ref: c };
      L.shownOf(tt, _p); const r = L.radiusOf(tt), size = Math.max(R.size, _p.distanceTo(_a) * R.perM);
      m.mt ||= new THREE.Vector3(); m.target(m.mt.copy(_p).addScaledVector(THREE.Object3D.DEFAULT_UP, r * 0.9 + R.lift + 0.23 * size));
      m.style({ size, gold: 0, spin: 1, pulse: 0, dim: R.dim, bob: R.bob });
    }
    this.usable.update(dt); this.lock.update(dt); for (const m of this.reads) m.update(dt);
  }
}
