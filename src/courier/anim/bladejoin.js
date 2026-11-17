// ---------------------------------------------------------------------------------------
// THE JOIN / DRAG / OVERSHOOT (plain names; docs/plans/SONDELASS-FEEL.md 3C, step 3): one unbroken line through a string. Three pieces
// on a combo engine move whose row asks for them (`join` on its `play`, tools/sondelass/sondelassloadout.js; casebook 210: every other
// row and every other tool plays exactly as before), all on the move's own pose, before the skeleton is posed, so the hinges, the wrist
// ease and the joint limits (rom.js) still have the last word:
//   THE JOIN       a chained move enters its clip not at frame 0 (or its warp's `skip`) but at the frame of its windup whose blade arm
//                  is nearest the pose on screen: the hand where the hand is, the tip where the tip is, the hand turned as it is turned
//                  (a feature table a clip, 60 frames a second, read off the skeleton once). The search is made once a pair and a
//                  2-frame bin of where the move before stood, and kept. It never enters at or past the strike's start, nor so near it
//                  that fewer than LEAD frames of startup are left: the active frames are never skipped. The last pose shown is faded
//                  into it over the frames the startup has (2 to 6). A row may type its entry for a pair (`join.at[prevId]`, clip s)
//                  where the search finds no clean meeting; a pair whose best is not clean is said in `table()`.
//   DRAG           the spine and the off arm follow their clip on a damped spring (a few frames behind), laid over at a share; the
//                  blade arm's upper arm is turned back by what the spine's lag turned it, so the blade keeps its own arc and the body
//                  arrives after it.
//   OVERSHOOT      the wrist of the blade hand follows its clip on a looser spring, so where the clip's arc stops it carries a few
//                  degrees past and settles, capped.
//   A whole-body move (the leap strike) takes the same through its launch's `poseFix` (courier/moves/launch.js); the tool's layer under
//   it holds the last pose shown, so the launch's own blend in never shows the stance between two cuts.
//
// Prior art: Melee's and Devil May Cry's cancels (a string's next blow taken from the one before, mid-motion: docs/ref/combat/MELEE.md,
// DEVIL-MAY-CRY.md); motion matching's pose search (Ubisoft's For Honor, Clavet, GDC 2016: the next clip entered at the frame whose
// features, a few bone positions and their facing, are nearest what is shown) cut down to one arm and one search a pair; CEDEC 2026's
// "sketch the tip's arc first, then fit the body to it" and "a master throws the blow first and lets the body catch up" (MUSOU.md 5);
// follow-through and overlapping action (Thomas and Johnston, The Illusion of Life: the parts that drag and the parts that carry past);
// a critically and an under-damped spring on a rotation (the quaternion spring of Daniel Holden's "Spring-It-On", 2021).
//
//   const J = new BladeJoin(warpOf)   (one a combo engine: tools/moveset.js keeps it as `bj`, handing it movewarp.js's warpOf: no import of tools/)
//   J.enter(M, prev, def, id) -> W | null     the move's time warp entered at the join (movewarp.js warpOf with its start), or null (no join)
//   J.shape(M, C, pose, c)                drag and overshoot on an upper move's sampled pose        J.whole(M, C, pose, c) (a launch's poseFix)
//   J.under(M, out, c) -> { pose, w } | null   the layer under a joined whole-body move: the last pose shown
//   featuresOf(ch, clip) -> { n, F, dur } (the blade arm a 60th of a clip second: hand, tip, the hand's turn)
//   J.table() -> [{ pair, bin, from, at, frames, score, tip (m), pace (m/s), clean, typed }]   the joins made so far (the look, the plan's table)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const FPS = 60, DEG = Math.PI / 180;
/** The numbers (SONDELASS-FEEL.md 11). Score: metres of the hand's gap + half the tip's + 0.15 a radian of the hand's turn. */
export const JOIN = {
  lead: 1, maxFade: 6, minFade: 2, bin: 2, stay: 0.04, // (frames; `stay`: a score a clip second for leaving the row's own skip, a tie-break)
  clean: 18, // (m/s: the tip's pace through the fade at most, a cut's own (the strikes peak at 20 to 45 m/s warped); past it the pair wants a typed entry)
  tip: 0.9, // (m past the hand along the forearm: melee.js's tip, the swing measure's)
  drag: { hz: 6, zeta: 0.9, w: 0.7, max: 9 * DEG, bones: { spine001: 0.5, spine002: 0.75, spine003: 0.9, spine004: 0.6, shoulderL: 1, upper_armL: 1, forearmL: 0.9, handL: 0.7 } },
  over: { hz: 10, zeta: 0.35, max: 6 * DEG, bone: 'handR' },
};

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _h = new THREE.Vector3(), _q = new THREE.Quaternion(), _p = new THREE.Quaternion(), _r = new THREE.Quaternion(), _e = new THREE.Vector3();
const tables = new Map(); // (clip -> its blade arm's features: one table, whoever asks)

/** The blade arm's features of `clip` a 60th of a clip second: hand and tip (m, the body's frame, the hips' travel taken out) and the
 *  hand's turn; read off the skeleton as melee.js measures a swing. */
export function featuresOf(ch, clip) {
  if (tables.has(clip)) return tables.get(clip);
  const C = ch.clips, c = C.clips[clip]; if (!c) return null;
  const B = ch.bones, p = ch.P.tmp, root = ch.root, save = { p: root.position.clone(), q: root.quaternion.clone() };
  const dur = (c.n - 1) / C.fps, n = Math.max(2, Math.round(dur * FPS) + 1), F = new Float32Array(n * 10);
  root.position.set(0, 0, 0); root.rotation.set(0, 0, 0);
  for (let i = 0; i < n; i++) {
    ch.applyPose(C.sample(clip, i / FPS, p, false)); root.updateMatrixWorld(true);
    B.handR.getWorldPosition(_h); B.forearmR.getWorldPosition(_a); B.spine.getWorldPosition(_b);
    _a.subVectors(_h, _a).normalize().multiplyScalar(JOIN.tip).add(_h);
    _h.x -= _b.x; _h.z -= _b.z; _a.x -= _b.x; _a.z -= _b.z;
    B.handR.getWorldQuaternion(_q);
    F.set([_h.x, _h.y, _h.z, _a.x, _a.y, _a.z, _q.x, _q.y, _q.z, _q.w], i * 10);
  }
  root.position.copy(save.p); root.quaternion.copy(save.q); root.updateMatrixWorld(true);
  const T = { n, F, dur };
  tables.set(clip, T);
  return T;
}
const at = (T, t) => Math.min(T.n - 1, Math.max(0, Math.round(t * FPS))) * 10;
function score(A, i, B, j) {
  const a = A.F, b = B.F;
  const dh = Math.hypot(a[i] - b[j], a[i + 1] - b[j + 1], a[i + 2] - b[j + 2]), dt = Math.hypot(a[i + 3] - b[j + 3], a[i + 4] - b[j + 4], a[i + 5] - b[j + 5]);
  const dq = Math.abs(a[i + 6] * b[j + 6] + a[i + 7] * b[j + 7] + a[i + 8] * b[j + 8] + a[i + 9] * b[j + 9]);
  return dh + dt * 0.5 + 2 * Math.acos(Math.min(1, dq)) * 0.15;
}

/** A spring on one bone's local turn: `s` follows the clip's, its angular speed `w` (rad/s, the parent's frame). */
function stepSpring(S, target, hz, zeta, dt) {
  const k = (2 * Math.PI * hz) ** 2, d = 2 * zeta * 2 * Math.PI * hz;
  for (let h = Math.min(dt, 1 / 120), left = dt; left > 1e-6; left -= h, h = Math.min(h, left)) {
    _p.copy(target).multiply(_r.copy(S.s).invert()); if (_p.w < 0) { _p.x = -_p.x; _p.y = -_p.y; _p.z = -_p.z; _p.w = -_p.w; }
    const ang = 2 * Math.acos(Math.min(1, _p.w)), sn = Math.sqrt(Math.max(1e-12, 1 - _p.w * _p.w));
    _e.set(_p.x / sn, _p.y / sn, _p.z / sn).multiplyScalar(ang); // (the error as a rotation vector)
    S.w.addScaledVector(_e, k * h).multiplyScalar(1 / (1 + d * h)); // (semi-implicit: the damping taken implicitly)
    const wl = S.w.length(); if (wl > 1e-9) { _r.setFromAxisAngle(_a.copy(S.w).divideScalar(wl), wl * h); S.s.premultiply(_r).normalize(); }
  }
}
/** `q` moved toward `s` by share `k`, never more than `max` from where it was. */
function lean(q, s, k, max) {
  _p.copy(q).slerp(s, k);
  const ang = 2 * Math.acos(Math.min(1, Math.abs(_p.dot(q))));
  if (ang > max) _p.copy(q).slerp(s, k * (max / ang));
  q.copy(_p);
}

export class BladeJoin {
  constructor(warpOf) { this.warpOf = warpOf; this.cache = new Map(); this.springs = null; this.lastC = null; this.pending = null; }

  /** Where a chained move enters (its warp begun there), or null: no join (the row asks for none, nothing came before, or a whole-body
   *  move's launch would not take it). Sets the engine's fade to the frames the startup has. */
  enter(M, prev, def, id = def.id) {
    M.fadeDur = null; this.pending = null; this.entered = null; // (`entered`: the def this begin joined, else none: under() holds the last pose only for it)
    if (!def.join || !def.warp || !prev || !prev.def.join || !M.from) return null;
    const ch = M.game.character, dur = M.dur(def), W0 = this.warpOf(def, def.track, dur); if (!W0) return null;
    const key = `${prev.id}>${id}@${Math.round((prev.t * FPS) / JOIN.bin)}`;
    let J = this.cache.get(key);
    if (!J) {
      const A = featuresOf(ch, prev.def.clip), B = featuresOf(ch, def.clip); if (!A || !B) return null;
      const s0 = W0.s[0], from = def.from || 0, skip = from + (def.warp.skip || 0), rin = def.warp.in ?? def.rate ?? 1;
      const last = Math.max(from, s0 - (JOIN.lead / FPS) * rin), ia = at(A, prev.t), typed = def.join.at?.[prev.id];
      const fr = (t) => Math.max(JOIN.minFade, Math.min(JOIN.maxFade, Math.floor(((s0 - t) / rin) * FPS) - 1)); // (the fade's frames entered at t, near enough)
      let best = skip, bs = Infinity; // (the gap over the frames there are to close it: the fade's pace, not the gap alone, so an earlier frame with room may win)
      for (let t = from; t <= last + 1e-6; t += 1 / FPS) { const sc = score(A, ia, B, at(B, t)) / fr(t) + JOIN.stay * Math.abs(t - skip); if (sc < bs) { bs = sc; best = t; } }
      const use = typed != null ? Math.min(typed, last) : best, ib = at(B, use), tip = Math.hypot(A.F[ia + 3] - B.F[ib + 3], A.F[ia + 4] - B.F[ib + 4], A.F[ia + 5] - B.F[ib + 5]);
      J = { pair: `${prev.id}>${id}`, bin: Math.round((prev.t * FPS) / JOIN.bin) * JOIN.bin, from: +prev.t.toFixed(3), at: +use.toFixed(3), score: +score(A, ia, B, ib).toFixed(3), tip: +tip.toFixed(2), typed: typed != null };
      this.cache.set(key, J);
    }
    const W = this.warpOf(def, def.track, dur, J.at); if (!W) return null;
    const frames = Math.max(JOIN.minFade, Math.min(JOIN.maxFade, Math.floor(W.m0 * FPS) - 1));
    J.frames = frames; J.pace = +(J.tip / (frames / FPS)).toFixed(1); J.clean = J.pace <= JOIN.clean; M.fadeDur = frames / FPS; this.pending = def; this.entered = def;
    return W;
  }

  /** Drag and overshoot laid on move `c`'s sampled pose (a joined row only). */
  shape(M, C, pose, c) {
    if (!c?.def.join) return;
    const g = M.game, dt = Math.min(0.05, g.rawDt || 1 / 60);
    let fresh = !this.springs;
    if (c !== this.lastC) { fresh ||= this.pending !== c.def; this.pending = null; this.lastC = c; } // (a string begun, or a move not joined: the springs start from its clip)
    if (!this.springs) this.build(C, g.character);
    const D = JOIN.drag, O = JOIN.over, q = pose.q;
    // the arm's chain before the drag: what the blade's upper arm is turned by
    const arm = this.arm, chainBefore = this.chain(q, _q.identity());
    for (const S of this.springs) {
      const tq = (S.t ||= new THREE.Quaternion()).fromArray(q, S.i * 4);
      if (fresh) { S.s.copy(tq); S.w.set(0, 0, 0); continue; }
      stepSpring(S, tq, S.over ? O.hz : D.hz, S.over ? O.zeta : D.zeta, dt);
      if (S.over) continue; // (the wrist after the arm is put back)
      lean(tq, S.s, D.w * S.k, D.max); tq.toArray(q, S.i * 4);
    }
    if (arm != null) { // (the blade's upper arm turned back by what the drag turned its chain: its arc is its clip's)
      const after = this.chain(q, _b4.identity());
      _q4.fromArray(q, arm * 4).premultiply(chainBefore).premultiply(after.invert()).normalize().toArray(q, arm * 4);
    }
    const W = this.wrist;
    if (W && !fresh) { const tq = W.t; lean(tq, W.s, 1, O.max); tq.toArray(q, W.i * 4); }
  }

  /** A joined whole-body move's pose (its launch's poseFix): the drag and overshoot, the fade from the last pose shown (its hips' place
   *  on the ground kept: the launch carries the body), the pose kept as the one shown. */
  whole(M, C, pose, c) {
    if (M.cur !== c) return; // (the launch fading out after the next move began: that move is the one shown)
    this.shape(M, C, pose, c);
    const x = pose.p[0], z = pose.p[2];
    M.joined(C, pose); // (the hips' height faded with the rest: a hop's landing into a crouch)
    pose.p[0] = x; pose.p[2] = z;
  }

  /** The tool's layer under a joined whole-body move: the last pose shown, so the launch blends in over the cut before, not the stance. */
  under(M, out, c) {
    if (!c.def.join || !M.last || this.entered !== c.def) return null; // (a joined row begun cold, the launcher from a stand: no stale pose under it)
    out.copy(M.last); return { pose: out, w: 1 };
  }

  /** The joins made so far. */
  table() { return [...this.cache.values()]; }

  build(C, ch) {
    this.springs = [];
    for (const [name, k] of Object.entries(JOIN.drag.bones)) { const i = C.index[name]; if (i !== undefined) this.springs.push({ i, k, s: new THREE.Quaternion(), w: new THREE.Vector3() }); }
    const wi = C.index[JOIN.over.bone];
    if (wi !== undefined) { this.wrist = { i: wi, over: true, s: new THREE.Quaternion(), w: new THREE.Vector3() }; this.springs.push(this.wrist); }
    // the blade's upper arm and the driven bones between it and the hips (its chain), root first
    this.arm = C.index.upper_armR ?? null; this.chainIdx = [];
    for (let b = ch?.bones?.upper_armR?.parent; b && b !== ch.bones.spine; b = b.parent) { const i = C.index[b.name]; if (i !== undefined) this.chainIdx.unshift(i); }
  }
  /** The product of the chain's local turns (root first) in pose `q`, into `out`. */
  chain(q, out) { for (const i of this.chainIdx) out.multiply(_c4.fromArray(q, i * 4)); return out; }
}
const _b4 = new THREE.Quaternion(), _q4 = new THREE.Quaternion(), _c4 = new THREE.Quaternion();
