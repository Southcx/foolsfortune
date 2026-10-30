// ---------------------------------------------------------------------------------------
// STRAWMAN'S PRACTICE END (plain name; South, 2026-10-30, Strawman's identity): how a practice duel ends when Strawman loses. It never
// falls (vfx/strawman.js: built to be knocked down and stand up again, infinitely), and practice takes nothing, so its end is a mending,
// never a drain: about 3.3 real s, the same for either way it lost.
//   THE POP       the sack strains and swells, its two front seams' cross-stitches burst (thread flying), straw blows out of them in a
//                 puff and lands round its ball; it slumps on its bar, the sack gone slack, its sleeves hanging, its head down
//   THE MEND      Pip's needle comes: a silver needle with its thread running down one seam and up the other, in and out, each stitch
//                 back as it passes, and with each stitch the straw it let out lifts off the ground and flies home into the sack, which
//                 fills again; tied off with a glint
//   THE BOW       it stands up whole, bows, and claps its sleeves twice (its own body: the move `practiceEnd`, vfx/strawmanmoves.js)
// The yard's wind gusts with the pop (the elite's `gust`: the domains' clash's straw, domains.js). Sounds are Wanda's, each optional:
// `sfx.strawmanStrain`, `strawmanPop`, `strawmanNeedle`, `strawmanStitch`, `strawmanBow`, `strawmanClap`.
// Programs: the clay's with vertex colours (instanced, as junk's), the bursts' and the glow's (pieces.js): nothing new.
// Prior art: the scarecrow restuffed (the Wizard of Oz's, put back together after the flying monkeys), Toy Story's Woody re-stitched,
// a sewing machine's needle running a seam in close-up (cartoons' "zip" of a seam closing), the bow and the applause of a training
// dummy that is a good sport (Smash's sandbag, Punch-Out!!'s between-rounds clap).
//
//   const E = new PracticeEnd(view)   E.play(foe, elite) -> { dur, step(age), end } | null   E.clear()   PRACTICE_END (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { duelMaterials } from '../pieces.js';
import { worldIn } from '../fxkit.js';
import { sm, clamp01, lerp } from '../layout.js';
import { sfx } from '../../../audio/sfx.js';

/** The beats (real s from its start): strain, pop, slack (the slump done), mend (the needle's run), whole, bow, claps, dur; per: straws a
 *  stitch; home: a straw's flight back (real s); gravity (m/s²); swell and slack: the sack's scale at the strain and at its slackest. */
export const PRACTICE_END = { pop: 0.3, slack: 0.85, mend: [1.1, 1.9], bow: 2.0, claps: [2.7, 2.94], dur: 3.3, per: 6, home: 0.38, gravity: 7,
  swell: [1.09, 1.04], slackS: [0.86, 0.8], seams: [-1.0, 1.0], stitches: 7 };
const THREAD = 0x4a3322, CREAM = 0xf3e6c8, STRAW = [0xe8c96c, 0xd9b04f, 0xc99a3a, 0xf2dc94], GOLD = 0xffd36a, STEEL = 0xd8dce4;
const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler();
const hsh = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
function paint(g, hex) { g = g.index ? g.toNonIndexed() : g; const n = g.attributes.position.count, c = new Float32Array(n * 3); _c.set(hex); for (let i = 0; i < n; i++) c.set([_c.r, _c.g, _c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; }
/** The sack's surface at `th` round from its front and `t` up it (0 its foot, 1 its neck), in the sack's frame (vfx/strawman.js: the
 *  lathe's profile, turned to face +z, 0.85 deep), `k` out from it. */
function sackAt(th, t, k, out) { const r = (0.07 + 0.42 * Math.sin(Math.PI * Math.pow(t, 0.72)) * (1 - 0.3 * t)) * k; return out.set(r * Math.sin(th), -0.95 + 0.95 * t, 0.85 * r * Math.cos(th)); }

export class PracticeEnd {
  constructor(view) {
    this.view = view; this.group = new THREE.Group(); this.group.name = 'strawman-practice-end'; this.group.visible = false;
    const M = duelMaterials(), inst = (geo, n) => { const m = new THREE.InstancedMesh(geo, M.clayVc, n); m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.count = 0; this.group.add(m); return m; };
    const P = PRACTICE_END, S = P.seams.length * P.stitches;
    this.straws = inst(paint(new THREE.BoxGeometry(0.012, 0.11, 0.012), 0xffffff), S * P.per);
    const x = [new THREE.BoxGeometry(0.03, 0.006, 0.005), new THREE.BoxGeometry(0.03, 0.006, 0.005)]; x[0].rotateZ(Math.PI / 4); x[1].rotateZ(-Math.PI / 4);
    const xg = paint(x[0].clone(), 0xffffff), xg2 = paint(x[1].clone(), 0xffffff), stitch = new THREE.BufferGeometry();
    for (const k of ['position', 'normal', 'uv', 'color']) stitch.setAttribute(k, new THREE.BufferAttribute(new Float32Array([...xg.attributes[k].array, ...xg2.attributes[k].array]), xg.attributes[k].itemSize));
    this.stitches = inst(stitch, S);
    const shaft = paint(new THREE.ConeGeometry(0.012, 0.26, 6), STEEL), eye = paint(new THREE.TorusGeometry(0.012, 0.004, 4, 10).translate(0, -0.13, 0), STEEL); // (the needle points +y, its eye at the foot)
    const ng = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'uv', 'color']) ng.setAttribute(k, new THREE.BufferAttribute(new Float32Array([...shaft.attributes[k].array, ...eye.attributes[k].array]), shaft.attributes[k].itemSize));
    this.needle = new THREE.Mesh(ng, M.clayVc); this.needle.frustumCulled = false; this.group.add(this.needle);
    this.glint = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), M.glow); this.glint.frustumCulled = false; this.group.add(this.glint);
    this.thread = new THREE.Mesh(paint(new THREE.BoxGeometry(0.004, 1, 0.004).translate(0, 0.5, 0), THREAD), M.clayVc); this.thread.frustumCulled = false; this.group.add(this.thread);
    this.pts = []; for (let s = 0; s < P.seams.length; s++) for (let i = 0; i < P.stitches; i++) { const t = 0.9 - (0.75 * i) / (P.stitches - 1), th = P.seams[s]; this.pts.push({ th, t: s ? 1.05 - t : t }); } // (down the first seam, up the second: the needle's path)
  }

  /** The practice end for `foe` (Strawman: its model) as a timeline the session plays; null for a foe with no sack. */
  play(foe, elite) {
    const V = this.view, model = foe?.model; if (!model?.sack || !model.head) return null;
    this.clear(); worldIn(this.group, V.root); this.group.visible = true; this.model = model;
    const P = PRACTICE_END, sack = model.sack, head = model.head, base = { s: sack.scale.clone(), y: sack.position.y, hy: head.position.y };
    this.base = base; const gy = model.group.getWorldPosition(_a).y + 0.012; // (the floor under its ball: where the straw lies)
    model.play?.('practiceEnd'); sfx.strawmanStrain?.();
    const stitchM = this.pts.map((p, i) => { const pos = sackAt(p.th, p.t, 1.03, new THREE.Vector3()); _e.set(0, p.th, (hsh(i, 2) - 0.5) * 0.5); return new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(_e), new THREE.Vector3(1, 1, 1)); });
    const n = this.pts.length; this.stitches.count = n; for (let i = 0; i < n; i++) this.stitches.setColorAt(i, _c.setHex(THREAD)); this.stitches.instanceColor.needsUpdate = true;
    const sk = new Float32Array(n).fill(1), back = new Float32Array(n).fill(-1);
    const straws = []; let popped = false, last = 0, tied = false, bowed = false, claps = 0, stitched = 0;
    const world = (local, out) => out.copy(local).applyMatrix4(sack.matrixWorld);
    const frame = (w, out) => V.frame.worldToLocal(out.copy(w));
    const pop = () => {
      popped = true; sfx.strawmanPop?.(); V.stage?.jolt?.(0.45); if (elite) elite.gust = 1;
      for (let i = 0; i < n; i++) { sk[i] = 0; const p = this.pts[i], w = world(sackAt(p.th, p.t, 1.03, _a), new THREE.Vector3()), nrm = new THREE.Vector3(Math.sin(p.th), 0.15, Math.cos(p.th)).transformDirection(sack.matrixWorld);
        V.bursts?.burst?.(frame(w, _b), THREAD, 3, { speed: 0.9, life: 0.5, fall: 4, size: 0.012 }); V.bursts?.burst?.(frame(w, _b), CREAM, 2, { speed: 0.7, life: 0.4, fall: 3, size: 0.01 });
        for (let k = 0; k < P.per; k++) { const j = i * P.per + k, v = nrm.clone().multiplyScalar(1.1 + 1.2 * hsh(j, 1)).add(_b.set(hsh(j, 2) - 0.5, 0.8 + 1.2 * hsh(j, 3), hsh(j, 4) - 0.5));
          straws.push({ i, p: w.clone(), v, r: new THREE.Euler(hsh(j, 5) * 6, hsh(j, 6) * 6, 0, 'YXZ'), yaw: hsh(j, 8) * 6.28, w: (hsh(j, 7) - 0.5) * 16, lie: false, home: -1, from: null, src: sackAt(p.th * 0.6, p.t, 0.4, new THREE.Vector3()), col: STRAW[j % 4] }); } }
      this.straws.count = straws.length; straws.forEach((S, j) => this.straws.setColorAt(j, _c.setHex(S.col))); this.straws.instanceColor.needsUpdate = true;
      V.bursts?.burst?.(frame(world(_a.set(0, -0.45, 0.2), _b), _b), STRAW[0], 12, { speed: 1.4, life: 0.7, fall: 5, size: 0.02 });
    };
    const step = (age) => {
      const dt = Math.max(0, Math.min(0.1, age - last)); last = age; sack.updateWorldMatrix(true, false);
      // the sack: swelling to the pop, slack after it, filling as the needle runs, a little proud as it is whole, then itself
      const swell = sm(clamp01(age / P.pop)), slack = sm(clamp01((age - P.pop) / (P.slack - P.pop))), mend = clamp01((age - P.mend[0]) / (P.mend[1] - P.mend[0])), proud = Math.sin(Math.PI * clamp01((age - P.mend[1]) / 0.25));
      const q = popped ? lerp(1, 0, sm(mend)) * slack : 0, sx = popped ? lerp(1, P.slackS[0], q) * (1 + 0.04 * proud) : lerp(1, P.swell[0], swell) + 0.02 * Math.sin(age * 42) * swell, sy = popped ? lerp(1, P.slackS[1], q) * (1 + 0.03 * proud) : lerp(1, P.swell[1], swell);
      sack.scale.set(base.s.x * sx, base.s.y * sy, base.s.z * sx); sack.position.y = base.y - 0.08 * q; head.position.y = base.hy - 0.05 * q;
      if (!popped && age >= P.pop) pop();
      // the needle: down the first seam and up the second, in and out of each stitch, its thread behind it
      const run = clamp01((age - P.mend[0]) / (P.mend[1] - P.mend[0])) * (n - 1), on = age >= P.mend[0] - 0.12 && age < P.mend[1] + 0.12;
      this.needle.visible = this.thread.visible = this.glint.visible = on;
      if (on) { const k = Math.min(n - 2, Math.floor(run)), f = run - k, A = this.pts[k], B = this.pts[k + 1];
        const pa = world(sackAt(A.th, A.t, 1.05, _a), new THREE.Vector3()), pb = world(sackAt(B.th, B.t, 1.05, _a), new THREE.Vector3());
        const nrm = new THREE.Vector3(Math.sin(lerp(A.th, B.th, f)), 0, Math.cos(lerp(A.th, B.th, f))).transformDirection(sack.matrixWorld), arc = Math.sin(Math.PI * f);
        const at = pa.clone().lerp(pb, f).addScaledVector(nrm, 0.07 * arc), dir = pb.clone().sub(pa).normalize().addScaledVector(nrm, Math.cos(Math.PI * f) * 0.9).normalize();
        const grow = sm(clamp01((age - P.mend[0] + 0.12) / 0.12)) * (1 - sm(clamp01((age - P.mend[1]) / 0.12)));
        this.needle.position.copy(at); this.needle.quaternion.setFromUnitVectors(UP, dir); this.needle.scale.setScalar(Math.max(0.001, grow));
        this.glint.position.copy(at).addScaledVector(dir, 0.13); this.glint.scale.setScalar(0.6 + 0.6 * Math.abs(Math.sin(age * 23)));
        const eyeAt = at.clone().addScaledVector(dir, -0.12), tail = world(sackAt(A.th, A.t, 1.03, _a), _b), d = _a.subVectors(eyeAt, tail), L = Math.max(0.001, d.length());
        this.thread.position.copy(tail); this.thread.quaternion.setFromUnitVectors(UP, d.normalize()); this.thread.scale.set(1, L, 1);
        if (!this.whir) { this.whir = true; sfx.strawmanNeedle?.(); } }
      // each stitch back as the needle reaches it, and the straw it let out flying home
      if (popped) for (let i = stitched; i < n && i <= run + 0.001 && age >= P.mend[0]; i++) { stitched = i + 1; back[i] = age; sfx.strawmanStitch?.({ i, of: n });
        const w = world(sackAt(this.pts[i].th, this.pts[i].t, 1.03, _a), _b); V.bursts?.burst?.(frame(w, _b), GOLD, 2, { speed: 0.4, life: 0.3, fall: 0, size: 0.012 });
        for (const S of straws) if (S.i === i && S.home < 0) { S.home = age + 0.04 * (S.i % 3); S.from = S.p.clone(); } }
      for (let i = 0; i < n; i++) { if (back[i] >= 0) { const u = clamp01((age - back[i]) / 0.14); sk[i] = u < 1 ? 1.35 * sm(u) - 0.35 * sm(clamp01(u * 2 - 1)) : 1; } else if (!popped) sk[i] = sm(clamp01(age / 0.12)) * (1 + 0.25 * swell); // (taut at the strain)
        _m.multiplyMatrices(sack.matrixWorld, stitchM[i]); _m.decompose(_a, _q, _s); this.stitches.setMatrixAt(i, _m.compose(_a, _q, _s.multiplyScalar(Math.max(0.001, sk[i])))); }
      this.stitches.instanceMatrix.needsUpdate = true;
      if (!tied && age >= P.mend[1]) { tied = true; const w = world(sackAt(this.pts[n - 1].th, this.pts[n - 1].t, 1.05, _a), _b); V.bursts?.burst?.(frame(w, _b), GOLD, 6, { speed: 0.6, life: 0.4, fall: 0, size: 0.016 }); }
      // the straw: out, falling, lying on the ground round the ball; called home, along an arc into the sack, drawn in
      let j = 0;
      for (const S of straws) {
        let scale = 1;
        if (S.home >= 0 && age >= S.home) { const u = clamp01((age - S.home) / P.home), e = sm(u), to = world(S.src, _a); S.p.lerpVectors(S.from, to, e); S.p.y += Math.sin(Math.PI * e) * 0.35; S.r.x += dt * 14; scale = 1 - sm(clamp01((u - 0.6) / 0.4)); }
        else if (!S.lie) { S.v.y -= P.gravity * dt; S.v.multiplyScalar(Math.exp(-dt * 1.2)); S.p.addScaledVector(S.v, dt); S.r.x += S.w * dt; S.r.z += S.w * 0.6 * dt;
          if (S.p.y <= gy) { S.p.y = gy; S.lie = true; S.r.set(Math.PI / 2, S.yaw, 0); } } // (laid flat, each its own way round)
        _q.setFromEuler(S.r); this.straws.setMatrixAt(j++, _m.compose(S.p, _q, _s.set(1, Math.max(0.001, scale), 1)));
      }
      this.straws.instanceMatrix.needsUpdate = true;
      // whole again: the bow and the two claps are its own move; the sounds and a little straw dust between the cuffs here
      if (!bowed && age >= P.bow) { bowed = true; sfx.strawmanBow?.(); }
      if (claps < P.claps.length && age >= P.claps[claps]) { claps++; sfx.strawmanClap?.({ n: claps }); const A = model.arms?.[0], B = model.arms?.[1];
        if (A && B) { A.localToWorld(_a.set(-0.67, 0, 0)); B.localToWorld(_b.set(0.67, 0, 0)); _a.lerp(_b, 0.5); V.bursts?.burst?.(frame(_a, _b), STRAW[3], 6, { speed: 0.6, life: 0.45, fall: 2, size: 0.014 }); } }
    };
    return { dur: P.dur, step, end: () => this.clear() };
  }

  /** The sack as it was, the needle and the straw gone. */
  clear() {
    const m = this.model, b = this.base; if (m?.sack && b) { m.sack.scale.copy(b.s); m.sack.position.y = b.y; m.head.position.y = b.hy; }
    this.model = null; this.base = null; this.whir = false; this.straws.count = 0; this.stitches.count = 0; this.needle.visible = this.thread.visible = this.glint.visible = false; this.group.visible = false;
  }
}
