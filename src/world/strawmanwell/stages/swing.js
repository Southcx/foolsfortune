// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE SWING (docs/plans/STRAWMANS-WELL.md 3.6): over pits on the end of the Sondelass's line. The Sondelass is lent for
// the stage in its hook form (the belt's main, given back on leaving: arsenalaim.js lendTool), and its hook aimed in the plane: LMB throws
// it along the keys' aim (none held: up and ahead, Bionic Commando's), drawn to the nearest hook ring or thread inside SWING.cone of it,
// else biting whatever the aim meets. The line, its reel (LMB held), its paying out (RMB held), its let go (RMB tapped, Space in the air)
// and the swing are the house's (tools/sondelass/hookshot.js, grapple.js); the stage wraps only the hook's throw and its aim on the
// instance while the Courier stands in it, the frame's way, and gives them back.
//   the rings      spools hung on threads from the fly loft over a pit: hook one, pump with A and D, let go at the top (one over the
//                  boards first, to try it where a miss costs nothing)
//   the elastic    a red band: on it the line stretches like rubber (a spring of ELASTIC.k about a rest a share of its length), so a drop
//                  stores a bounce and the reel and the paying out set its rest (Umihara Kawase's)
//   the zip        a thread strung downhill: the hook rides it, drawn along by its slope, and lets go at its end with the speed it had
// Placeholder looks; Calissa dresses them. Words placeholders, Espada's.
//
// Prior art: Bionic Commando (the hook as the only way over, a fixed aim up and ahead), Umihara Kawase (the elastic line, reeled in and
// out), Spider-Man's and Just Cause's zips and swing release; Worms' Ninja Rope (the house's grapple's own prior art).
//
//   default export: a stage module (stagemods.js's contract)   SWING   ELASTIC   ZIP
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { scaffold, floor, goalFlag, sign } from '../stages.js';
import { COLOR } from '../stagekit.js';
import { AT } from '../layout.js';
import { aimOf, lendTool } from './arsenalaim.js';

/** The hook's pick: the cone about the aim a ring or a thread is drawn into (rad), and how far (m). */
export const SWING = { cone: 0.62, reach: 14, chest: 0.9 };
/** The elastic band: its spring (1/s^2), its rest as a share of the line when it bit, the most it stretches (x rest), its damping along the
 *  line (1/s), how fast the reel and the paying out move its rest (m/s), and the stretch that counts as the verb (m). */
export const ELASTIC = { k: 14, rest: 0.6, max: 1.8, damp: 0.8, reel: 5, felt: 0.6, min: 1.5 };
/** The zip: the line it hangs by (m), its pull along the thread (m/s^2 at the thread's slope), its start and top speed (m/s). */
export const ZIP = { hang: 1.4, pull: 21, v0: 3, top: 15 };
const _c = new THREE.Vector3(), _d = new THREE.Vector3(), _a = new THREE.Vector3(), _p = new THREE.Vector3();

export default {
  id: 'swing',
  build(well, S) {
    const len = S.lane.len, X = (x) => AT.x + x, Y = (y) => AT.y + y;
    const st = (this.st = { well, S, holds: [], offs: [], att: null, on: null, pending: null });
    scaffold(S, len);
    S.box(-16, len + 16, 11.8, 12.4, COLOR.wing, { collide: false, outline: false }); // (the fly loft's beam the rings hang from: not to be hooked)
    const ring = (x, y, kind = 'ring', color = COLOR.gold) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.09, 8, 18), new THREE.MeshStandardMaterial({ color, roughness: 0.6, flatShading: true }));
      m.position.copy(S.at(x, y)); S.add(m);
      S.box(x - 0.03, x + 0.03, y + 0.4, 11.8, COLOR.thread, { collide: false, d: 0.05, outline: false });
      st.holds.push({ kind, p: S.at(x, y), mesh: m });
    };
    // a ring over the boards, to try it, then the pit of rings
    floor(S, -1, 10); sign(S, 'THE HOOK', 3.5, 4.4, 'LMB throws it: up and ahead, or where W A S D aim');
    ring(6, 6.2); sign(S, 'SWING', 8, 9.2, 'A and D pump; Space lets go; LMB again for the next');
    for (const x of [14, 20, 26]) ring(x, 7);
    floor(S, 30, 36);
    // the elastic band over a wide pit, a ledge up on the far side
    ring(44, 10, 'elastic', COLOR.spring); sign(S, 'ELASTIC', 40, 4.4, 'the red band stretches; LMB held reels in, RMB held pays out');
    S.box(52, 60, -4, 4, COLOR.boards);
    // the zip thread downhill over the last pit
    const A = S.at(61, 9), B = S.at(80, 3.6);
    st.thread = { a: A, b: B, len: A.distanceTo(B), u: B.clone().sub(A).normalize() };
    { const mid = A.clone().add(B).multiplyScalar(0.5), l = st.thread.len, a = Math.atan2(B.y - A.y, B.x - A.x);
      S.box(mid.x - AT.x - l / 2, mid.x - AT.x + l / 2, mid.y - AT.y - 0.03, mid.y - AT.y + 0.03, COLOR.thread, { collide: false, rotZ: a, d: 0.06, outline: false }); }
    S.box(60.8, 61.2, 4, 9.4, COLOR.spool, { collide: false }); S.box(79.8, 80.2, 0, 4, COLOR.spool, { collide: false });
    sign(S, 'ZIP', 57, 7.6, 'hook the thread: it carries you down');
    floor(S, 76, len + 1);
    goalFlag(S, 86, 0);
    st.offs.push(
      well.game.events?.on('grapple.swing', (e) => { if (well.stage?.id === 'swing' && e.phase === 'start' && st.on?.kind !== 'zip') well.verb('grapple'); }),
      well.game.events?.on('zone.acoustic', () => { if (!well.here) this.leave(well); }),
    );
    void X; void Y;
    return { goal: [86, 0], door: [88.5, 0], checks: [[2, 0], [31, 0], [53, 4], [77, 0]] };
  },

  get hook() { return this.st?.well.game.techs?.get?.('sondelass')?.hookshot ?? null; },
  get live() { const W = this.st?.well; return !!W && W.frame.on && W.here && W.stage?.id === 'swing'; },

  /** The hook's throw and aim wrapped on the instance (given back by unwrap). */
  wrap() {
    const st = this.st, h = this.hook; if (!h || st.wrapped) return;
    const self = this, own = (k) => (Object.prototype.hasOwnProperty.call(h, k) ? h[k] : null);
    st.wrapped = { h, fire: own('fire'), probe: own('probe') };
    const fire = own('fire') || Object.getPrototypeOf(h).fire, probe = own('probe') || Object.getPrototypeOf(h).probe;
    h.fire = function swingFire(at = null) {
      if (!self.live || at) return fire.call(this, at);
      const aim = self.aim(new THREE.Vector3()), pick = self.pick(aim);
      st.pending = pick;
      fire.call(this, pick.at);
      if (!this.result && this.flying) this.target.copy(self.chest(_c)).addScaledVector(aim, SWING.reach); // (a miss flies along the plane)
    };
    h.probe = function swingProbe(at = null) {
      if (!self.live || !at) return probe.call(this, at);
      return self.probe(at);
    };
  },
  unwrap() {
    const S = this.st?.wrapped; if (!S) return;
    for (const k of ['fire', 'probe']) { if (S[k]) S.h[k] = S[k]; else delete S.h[k]; }
    this.st.wrapped = null;
  },

  chest(out) { const P = this.st.well.game.player; return out.set(P.pos.x, P.pos.y + SWING.chest, P.pos.z); },
  /** The aim: the keys' eight ways, and with none held up and ahead. */
  aim(out) {
    const W = this.st.well, R = W.frame.realInput;
    if (R && !['KeyW', 'KeyA', 'KeyS', 'KeyD'].some((k) => R.isDown(k))) return out.set(W.frame.face, 1, 0).normalize();
    return aimOf(W, out);
  },
  /** Where the throw goes: the hold best inside the cone (a ring, a point of the thread), else along the aim. */
  pick(aim) {
    const st = this.st, c = this.chest(_c);
    let best = null, ba = SWING.cone;
    const consider = (p, kind, s = 0) => {
      _d.copy(p).sub(c); const d = _d.length(); if (d > SWING.reach || d < 0.8) return;
      const a = aim.angleTo(_d.divideScalar(d)); if (a < ba && this.sees(c, p)) { ba = a; best = { at: p.clone(), kind, s }; }
    };
    for (const H of st.holds) consider(H.p, H.kind);
    const T = st.thread;
    for (let i = 0; i <= 24; i++) { const s = (T.len * i) / 24; consider(_p.copy(T.a).addScaledVector(T.u, s), 'zip', s); }
    return best || { at: c.clone().addScaledVector(aim, SWING.reach), kind: 'surface' };
  },
  /** Nothing solid between the chest and a hold. */
  sees(from, to) {
    const g = this.st.well.game, d = _a.copy(to).sub(from), l = d.length();
    return !g.physics.raycast(from, d.divideScalar(l), Math.max(0, l - 0.2), g.player.collider, undefined, (c) => !c.isSensor());
  },
  /** The house's probe, from the chest along the plane: what the line meets first, or the hold itself (it hangs in the air). */
  probe(at) {
    const g = this.st.well.game, c = this.chest(new THREE.Vector3()), d = at.clone().sub(c), l = d.length(); d.divideScalar(l);
    const hit = g.physics.raycast(c, d, l + 0.4, g.player.collider, undefined, (x) => !x.isSensor());
    const solid = (h) => ({ point: h.point.clone(), normal: h.normal.clone(), ent: h.entity ?? null, body: h.collider?.parent?.() ?? null, kind: 'anchor' });
    if (hit && hit.point.distanceTo(c) < l - 0.3) return solid(hit); // (something solid in the way bites first)
    if (this.st.pending?.kind === 'surface') return hit ? solid(hit) : null; // (thrown at nothing held: what the aim meets, or a miss)
    return { point: at.clone(), normal: d.clone().negate(), ent: null, body: null, kind: 'anchor' };
  },

  enter(well) {
    const st = this.st; if (!st) return;
    st.lend?.restore(); st.lend = lendTool(well, 'sondelass', { form: 'hook', draw: true }); this.wrap();
    st.on = null; st.att = null; st.pending = null;
  },
  leave() {
    const st = this.st; if (!st) return;
    this.unwrap(); st.lend?.restore(); st.lend = null; st.on = null;
  },

  /** Before each fixed step: what the line bit, the elastic band's spring, the zip's ride. */
  pre(well, dt) {
    const st = this.st, h = this.hook; if (!st || well.stage?.id !== 'swing' || !h) return;
    const att = h.att?.mode === 'anchor' ? h.att : null;
    if (att !== st.att) {
      st.att = att; st.on = null;
      const p = st.pending; st.pending = null;
      if (att && p && p.kind !== 'surface' && att.point.distanceTo(p.at) < 0.35) {
        if (p.kind === 'elastic') st.on = { kind: 'elastic', rest: Math.max(ELASTIC.min, this.chest(_c).distanceTo(att.point) * ELASTIC.rest) };
        else if (p.kind === 'zip') { st.on = { kind: 'zip', s: p.s, v: ZIP.v0 }; h.L = Math.min(h.L, ZIP.hang); if (well.game.player.grounded) well.game.player.impulse(new THREE.Vector3(0, 3.5, 0), 'zip'); well.verb('zip'); } // (off the ledge onto the trolley)
        else st.on = { kind: 'ring' };
      }
    }
    const on = st.on; if (!on || !att) return;
    const P = well.game.player;
    if (on.kind === 'elastic') {
      if (h.reeling) on.rest = Math.max(ELASTIC.min, on.rest - ELASTIC.reel * dt);
      if (h.paying) on.rest += ELASTIC.reel * dt;
      const c = this.chest(_c), d = _d.copy(att.point).sub(c), l = d.length(); d.divideScalar(Math.max(1e-4, l));
      const stretch = l - on.rest;
      if (!P.grounded && stretch > 0) {
        P.vel.addScaledVector(d, ELASTIC.k * stretch * dt);
        const vr = P.vel.dot(d); P.vel.addScaledVector(d, -vr * ELASTIC.damp * dt);
        if (stretch > ELASTIC.felt) well.verb('elastic');
      }
      h.L = THREE.MathUtils.clamp(l + 0.05, on.rest, on.rest * ELASTIC.max);
    } else if (on.kind === 'zip') {
      const T = st.thread;
      on.v = Math.min(ZIP.top, on.v + ZIP.pull * Math.max(0.1, -T.u.y) * dt);
      on.s += on.v * dt;
      if (on.s >= T.len - 0.2) { h.release('tap'); st.on = null; st.att = null; return; }
      att.point.copy(T.a).addScaledVector(T.u, on.s);
      h.L = Math.min(h.L, ZIP.hang);
    }
  },

  update(well) {
    const st = this.st; if (!st) return;
    if (well.stage?.id !== 'swing' && st.lend) this.leave(well);
    if (well.stage?.id !== 'swing') return;
    for (const H of st.holds) if (H.kind === 'elastic') { const on = st.on?.kind === 'elastic'; H.mesh.scale.setScalar(on ? 1.15 : 1); }
  },

  clear(well) {
    const st = this.st; if (!st) return;
    this.leave(well);
    for (const off of st.offs) off?.();
    this.st = null;
  },
};
