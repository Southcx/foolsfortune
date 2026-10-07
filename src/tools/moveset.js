// ---------------------------------------------------------------------------------------
// THE MOVESET: one combo engine for every tool that strikes (the owner, 2026-10-07: "much more room to expand melee combos ... air
// combos or special attacks", from the Courier's own suite). A tool hands it a table of MOVES (clips of the suite, and how each one
// strikes) and its STRINGS (which move follows which); the engine reads the presses, plays the moves, sweeps what each one hits
// (melee.js), lands the blow, and carries the body through the moves that take it (courier/moves/launch.js, with the clip's own travel).
// Built once (CLAUDE.md, "Built once"): the cutlass, the club, the pick, the bell, the flail, the book, the gun and the unarmed kick are
// the same machine with different tables. What a move is WORTH is Dovina's (progress/combat/moves.js: its power a hit, its hits, the
// real seconds before the next may begin, its cost, the status it puts on, its unlock as a ledger predicate): a move names its row
// there (`rule`), and the row wins over the tool's own numbers; a locked move falls back to the string (a locked special refuses).
//
//   THE GRAMMAR (every tool the same; what a tool lacks it simply has not got)
//     LMB                  the GROUND string: each press inside a move's chain window goes on to the next; at a string's last
//                          blow, a press once its row's time is spent and its strike past cuts the recovery short into a new
//                          opener (the RECOVERY CUT)
//     LMB after a pause    the PAUSE string: pressed 0.25-0.8 s after a move ends, at the move the string branches from
//     hold LMB             CHARGE: held past 0.3 s into the opener, the hold clip loops; released, the charged blow
//     S + LMB (ground)     the LAUNCHER: it lifts them and what it strikes (`knock` upward: each creature decides what that means)
//     LMB in the air       the AIR string (once a jump): they hang while it plays (gravity x0.12); its last move may PLUNGE to the ground
//     LMB while sprinting  the DASH: the clip's own travel, carried
//     R                    the SPECIAL: a costly move of the tool's own (Lachryma)
//   A MOVE  { clip, from, to, rate, body: 'upper'|'whole', chain: [t0, t1] (clip seconds), hit: { power, dmg, cause, push, lift },
//             lunge (m/s, a step in), root: 'xz'|'xyz' (a whole-body move's travel, read from its hips: casebook rule 19),
//             gravity, plunge: { hold, speed } (falls from clip time `hold` until the ground, then plays on), ring (m: the landing's
//             blast radius), cost, trail: [t0, t1], heat, arc ('r2l'|'l2r'|'over'|'raise': first person), kind (for the events) }
//   THE EVENTS  the tool's own swing and hit events (`cut.swing {n, move, by}`, `cut.hit {what, combo, move, by}`); and Dovina's
//               (feedback/tracking/moves.js): `move.launch { tool, by }` when a launcher lifts something, `move.air { tool, hits, by }`
//               when an air string ends, `move.special { tool, special, by }` when a special is loosed.
//
// Prior art: Devil May Cry's grammar (the Launcher on back + attack, the air string and the Helm Breaker plunge, the pause combo),
// Bayonetta's "Wicked Weave" strings (the same buttons, the rhythm of the presses choosing the branch), Kingdom Hearts' air combo
// and finisher, and the data-driven move tables of the fighting games (each move a row: its startup, active and recovery frames,
// here read from the clip itself by melee.js rather than typed).
//
//   const M = new Moveset(tool, { id, moves, strings, reach, pot, k, cause, events: { swing, hit }, segment(a, b), trail, button ('Mouse0'),
//                                 specialKey ('KeyR'), tip, limb ('R' | 'L' | 'footR' | 'footL' | 'auto': what a move's reach is measured on),
//                                 onBegin(c), onAt(c) (once a move, at def.at or its strike's start), onUpdate(c, dt), onHit(...), onEnd(c) })
//   strings.charge: { hold, release?, after? } (no release: letting go ends the hold; `after`: how long the opener is held first)
//   M.update(dt, inp, { allow })   M.pose(C, out) -> { pose, w } (an upper-body move, over the stance)   M.afterHands(dt)   M.cancel()
//   M.busy   M.playing   M.whole (a whole-body move is playing)   M.fpArc()   M.combo   M.rule(def) (its row of moves.js)
//   M.worth(h, c) (what a blow is worth to a creature)   M.struck(ent, c) (its row's status, the launcher's lift: a tool's own blow rules call both)
//   spec.rules: the tool's key in moves.js (default its id); a move's `rule`: its row (combo1, launcher, air1, plunge, special ...)
//   spec.sound: the swing's sound (heavy) -> (default sfx.slash; false when the tool sounds its own in onBegin)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../audio/sfx.js';
import { measureSwing, sweep as sweepArc, magnet, targets } from './melee.js';
import { MOVES as RULES, unlocked } from '../progress/combat/moves.js';

const STATUS_DUR = { stagger: 0.8, airborne: 1.6, trip: 1.0 }; // (how long a move's status holds, real seconds; each creature decides what it means)

const BUFFER = 0.35, PAUSE = [0.25, 0.8], RESET = 0.9, HOLD = 0.3, HANG = 0.12;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _e = new THREE.Vector3(), _f = new THREE.Vector3(), _k = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const roots = new Map();

/** A clip's hip travel from its first frame, per frame (body space: +Z ahead, +X their left): the move's own motion. */
export function rootOf(C, name) {
  if (roots.has(name)) return roots.get(name);
  const c = C.clips[name]; if (!c) return null;
  const p = c.p, n = c.n, off = new Float32Array(n * 3);
  for (let f = 0; f < n; f++) for (let k = 0; k < 3; k++) off[f * 3 + k] = p[f * 3 + k] - p[k];
  const at = (t, out) => { const x = THREE.MathUtils.clamp(t * C.fps, 0, n - 1), i = Math.min(n - 2, Math.floor(x)), u = n > 1 ? x - i : 0, j = Math.min(n - 1, i + 1); return out.set(off[i * 3] + (off[j * 3] - off[i * 3]) * u, off[i * 3 + 1] + (off[j * 3 + 1] - off[i * 3 + 1]) * u, off[i * 3 + 2] + (off[j * 3 + 2] - off[i * 3 + 2]) * u); };
  const r = { at, end: at(c.dur, new THREE.Vector3()) };
  roots.set(name, r);
  return r;
}
/** Body space to the world, facing `yaw`. */
const toWorld = (v, yaw, out) => out.set(v.x * Math.cos(yaw) + v.z * Math.sin(yaw), v.y, -v.x * Math.sin(yaw) + v.z * Math.cos(yaw));

export class Moveset {
  constructor(tool, spec) {
    this.tool = tool; this.S = spec; this.id = spec.id;
    this.cur = null; this.n = -1; this.str = 'ground'; this.after = 9; this.buffer = 0; this.airN = 0; this.airHits = 0;
    this.hit = new Set(); this.combo = 0; this.charge = 0; this.held = false; this.wholeOn = false;
  }
  get game() { return this.tool.game; }
  get P() { return this.tool.P; }
  get busy() { return !!this.cur; }
  get playing() { return !!this.cur || (this.rec && this.rec.t < this.rec.dur); }
  get whole() { return !!this.cur && this.cur.def.body === 'whole'; }
  def(id) { return this.S.moves[id]; }
  /** A move's row in Dovina's table (progress/combat/moves.js), or null. */
  rule(def) { return (def?.rule && RULES[this.S.rules || this.id]?.[def.rule]) || null; }
  /** Whether a move is open to the Courier (its row's unlock over the ledger; a move with no row always is). */
  open(id) { const d = this.def(id); return !d?.rule || !this.rule(d) || unlocked(this.S.rules || this.id, d.rule, this.game.ledger); }
  /** The pause strings: [{ at: the ground move they branch from, to: [moves] }]. */
  branches() { const p = this.S.strings.pause; return !p ? [] : Array.isArray(p) ? p : [p]; }

  cancel() {
    if (this.cur?.def.body === 'whole') { const L = this.P.techs.get('launch'); if (L?.o?.tag?.startsWith(this.id)) L.o.onEnd = null; }
    this.cur = null; this.rec = null; this.buffer = 0; this.charge = 0; this.S.trail?.gap();
  }

  /** Once a frame while the tool is in the hand. `allow`: the tool is not doing something of its own (a guard, blade mode). */
  update(dt, inp, { allow = true } = {}) {
    const P = this.P, S = this.S, st = S.strings;
    this.after += dt;
    if (P.grounded) { if (this.airN && this.airHits >= 1) this.game.events?.emit('move.air', { tool: this.S.rules || this.id, hits: this.airHits, by: 'courier' }); this.airN = 0; this.airHits = 0; }
    if (this.rec) { this.rec.t += dt * (Math.hypot(P.vel.x, P.vel.z) > 2 ? 2.2 : 1); if (this.rec.t >= this.rec.dur) this.rec = null; }
    const B = S.button || 'Mouse0';
    if (inp.wasPressed(B)) this.buffer = BUFFER;
    this.buffer -= dt;
    if (allow && st.special && inp.wasPressed(S.specialKey || 'KeyR') && (!this.cur || this.cur.def.body !== 'whole')) {
      if (this.open(st.special)) { this.begin(st.special, 'special'); return; }
      sfx.fizzle?.(); this.game.log?.say('warn', 'You have not mastered that yet.', { key: 'move.locked', throttle: 3 }); // (a refusal at the point of use; Espada's words to come)
    }
    const c = this.cur;
    if (!c) {
      if (this.after > RESET) { this.n = -1; this.str = 'ground'; }
      if (allow && this.buffer > 0) this.opener(inp);
      return;
    }
    // the move plays on
    c.tPrev = c.t;
    if (c.phase === 'fall') { if (P.grounded) this.land(); }
    else c.t += dt * (c.def.rate || 1);
    if (c.phase !== 'fall' && c.def.plunge && c.t >= c.def.plunge.hold && !c.landed) { c.t = c.def.plunge.hold; c.phase = 'fall'; }
    // charge: the opener held becomes the hold, the hold released becomes the blow
    if (c.kind === 'charge-hold') { this.charge = Math.min(1, this.charge + dt / 1.1); if (!inp.isDown(B)) { if (st.charge.release) this.begin(st.charge.release, 'charge'); else this.finish(); return; } }
    else if (st.charge && c.kind === 'ground' && this.n === 0 && this.held && c.t >= (st.charge.after ?? HOLD)) { if (inp.isDown(B)) { this.charge = 0; this.begin(st.charge.hold, 'charge-hold'); return; } this.held = false; }
    if (!inp.isDown(B)) this.held = false;
    this.sweep();
    const at = c.def.at ?? c.def.track?.strike[0];
    if (at != null && c.tPrev < at && c.t >= at && c.phase !== 'fall') S.onAt?.(c);
    S.onUpdate?.(c, dt);
    if (c.def.ringAt != null && c.tPrev < c.def.ringAt && c.t >= c.def.ringAt) this.ring(this.rule(c.def)?.radius ?? c.def.ring, c.def.hit);
    // the next move: a press inside the chain window
    const next = this.nextOf(c), R = this.rule(c.def), soon = R?.time ?? 0;
    c.age = (c.age || 0) + dt;
    if (next && this.buffer > 0 && c.def.chain && c.t >= c.def.chain[0] && c.age >= soon && (c.t <= c.def.chain[1] || c.age <= soon + 0.25)) { this.begin(next.id, next.kind, next.n); return; } // (never sooner than its row's time: the rate the raids are sized to)
    // the recovery cut: a string's last blow, its row's time spent and its strike past, is cut short by a press into a new opener
    // (Devil May Cry's cancels: the string runs at its rows' rate, not its clips' length)
    if (!next && R && this.buffer > 0 && (c.kind === 'ground' || c.kind === 'pause') && c.age >= soon && c.t > (c.def.track?.strike[1] ?? 0)) { this.opener(inp); if (this.cur !== c) return; }
    if (c.kind !== 'charge-hold' && c.phase !== 'fall' && c.t >= (c.def.to ?? this.dur(c.def))) this.finish(); // (the hold loops until let go)
  }

  // the first press after a pause (or none): which string it opens
  opener(inp) {
    const P = this.P, st = this.S.strings, grounded = P.grounded;
    const speed = Math.hypot(P.vel.x, P.vel.z);
    if (!grounded && st.air && this.airN < st.air.length && P.techs.active?.id !== 'swim' && this.open(st.air[this.airN])) return this.begin(st.air[this.airN], 'air', this.airN);
    if (st.launcher && grounded && inp.isDown('KeyS') && this.open(st.launcher)) return this.begin(st.launcher, 'launcher');
    if (st.dash && grounded && speed > 5.6 && this.open(st.dash)) return this.begin(st.dash, 'dash');
    const g = st.ground || [];
    if (!g.length) return;
    const br = this.str === 'ground' && this.n >= 0 && this.after >= PAUSE[0] && this.after <= PAUSE[1] && this.branches().find((b) => b.at === this.n && this.open(b.to[0]));
    if (br) { this.branch = br; return this.begin(br.to[0], 'pause', 0); }
    if (this.str === 'pause' && this.n >= 0 && this.after <= RESET && this.branch && this.n + 1 < this.branch.to.length) return this.begin(this.branch.to[this.n + 1], 'pause', this.n + 1);
    const n = this.str === 'ground' && this.n >= 0 && this.after <= RESET ? (this.n + 1) % g.length : 0;
    this.held = true;
    return this.begin(g[n], 'ground', n);
  }

  /** What follows move `c` on a press inside its window: { id, kind, n } | null. */
  nextOf(c) {
    const st = this.S.strings;
    if (c.def.next) return { id: c.def.next, kind: c.kind === 'launcher' ? 'air' : c.kind, n: c.n + 1 };
    if (c.kind === 'ground' && st.ground && c.n + 1 < st.ground.length) return { id: st.ground[c.n + 1], kind: 'ground', n: c.n + 1 };
    if (c.kind === 'pause' && this.branch && c.n + 1 < this.branch.to.length) return { id: this.branch.to[c.n + 1], kind: 'pause', n: c.n + 1 };
    if ((c.kind === 'air' || c.kind === 'launcher') && st.air) { const k = c.kind === 'launcher' ? 0 : c.n + 1; if (k < st.air.length && this.airN < st.air.length && this.open(st.air[k])) return { id: st.air[k], kind: 'air', n: k }; }
    return null;
  }

  dur(def) { const c = this.tool.game.character?.clips.clips[def.clip]; return c ? c.dur : 1; }

  /** Start move `id`. */
  begin(id, kind = 'ground', n = 0) {
    const def = this.def(id), g = this.game, P = this.P, ch = g.character;
    if (!def || !ch?.clips.clips[def.clip]) return false;
    const R = this.rule(def), cost = R?.cost ?? def.cost;
    if (cost && !g.lachryma.spend(cost, `${this.id}.${id}`)) { sfx.fizzle?.(); g.hud?.lachrymaPulse?.(false); return false; }
    const prev = this.cur;
    if (prev && this.last) { (this.from ||= this.last.constructor ? new this.last.constructor(this.last.q.length / 4) : null)?.copy(this.last); this.fadeT = 0; } // (what was showing, held and faded out over the new move: no pop at a join)
    if (prev?.def.body === 'whole' && def.body !== 'whole') { const L = P.techs.get('launch'); if (L?.o?.tag?.startsWith(this.id)) { L.o.onEnd = null; L.o.time = 0; } } // (the whole-body move's launch ends: the core has the step again)
    if (!def.track) { def.track = measureSwing(ch, def.clip, { tip: def.tip ?? this.S.tip ?? 0.9, limb: def.limb ?? this.S.limb ?? 'R' }); if (def.track && def.strike) def.track = { ...def.track, strike: def.strike }; } // (a typed strike window wins: a flourish can be faster than the blow)
    const c = (this.cur = { id, def, kind, n, t: def.from || 0, tPrev: def.from || 0, phase: 'play', landed: false });
    this.hit.clear(); this.buffer = 0; this.rec = null;
    if (kind === 'ground' || kind === 'pause') { this.n = n; this.str = kind; }
    if (kind === 'air' || kind === 'launcher') this.airN = kind === 'air' ? n + 1 : 0;
    if (kind !== 'charge-hold') this.combo = kind === 'ground' || kind === 'pause' ? n + 1 : this.combo + 1;
    // facing and the step in: toward the lock, or drawn to the best thing in front of them (melee.js magnet)
    const f = this.aimDir(_f);
    const m = !g.lock?.active && magnet(g, P, f, { range: def.body === 'whole' ? 6 : 4.2, cone: 1.0 });
    if (m) f.set(m.pos.x - P.pos.x, 0, m.pos.z - P.pos.z).normalize();
    c.yaw = P.bodyYaw = Math.atan2(f.x, f.z);
    if (def.body === 'whole') this.carry(c, m);
    else if (def.lunge) {
      let lunge = def.lunge * (P.grounded ? 1 : 0.5);
      if (m) lunge = Math.min(lunge, Math.max(0, m.dist - m.r - 1.0) * 3.2);
      if (g.lock?.active) { g.lock.point(_e); lunge = Math.min(lunge, Math.max(0, _e.distanceTo(P.pos) - 1.3) * 3.2); }
      P.impulse(_b.copy(f).setY(0).normalize().multiplyScalar(lunge), this.S.cause === 'bashed' ? 'brush' : 'cut');
      if (!P.grounded && kind === 'air') P.vel.y = Math.max(P.vel.y, 1);
    }
    if (this.S.sound) this.S.sound(def.heat > 0.5); else if (this.S.sound !== false) sfx.slash?.(def.heat > 0.5); // (the tool's own swing, else the cutlass's slash, called on sfx; false: the tool sounds its own)
    if (kind !== 'charge-hold') g.events?.emit(this.S.events.swing, { n, move: id, by: 'courier' }); // (a hold is not a swing: its release is)
    if (kind === 'special') g.events?.emit('move.special', { tool: this.S.rules || this.id, special: R?.id || id, by: 'courier' });
    c.lifted = false;
    this.S.onBegin?.(c);
    return true;
  }

  /** A whole-body move owns the step (Launch): carried by its clip's own travel, hung in the air, or falling to a plunge. */
  carry(c, m) {
    const P = this.P, L = P.techs.get('launch'), def = c.def, C = this.game.character.clips;
    if (!L || P.mantle || P.freeze || (P.techs.active && P.techs.active !== L)) { c.def = { ...def, body: 'upper' }; return; } // (never mid-mantle: ending the core's climb there leaves them in the ledge)
    const R = def.root ? rootOf(C, def.clip) : null, span = ((def.to ?? this.dur(def)) - (def.from || 0)) / (def.rate || 1);
    const yaw = c.yaw, xyz = def.root === 'xyz';
    // never through what it was aimed at: the travel is cut to stop a reach short of it
    let scale = 1;
    if (R && m) { const want = Math.hypot(R.end.x, R.end.z); if (want > 0.3) scale = THREE.MathUtils.clamp((m.dist - m.r - 0.9) / want, 0.15, 1); }
    c.scale = scale; c.tag = `${this.id}.${c.id}`;
    const v0 = new THREE.Vector3(P.vel.x * 0.3, def.lift ?? (P.grounded ? 0 : Math.max(0, P.vel.y)), P.vel.z * 0.3);
    L.go(v0, {
      time: def.plunge ? 6 : span + 0.02, gravity: def.plunge ? 0 : xyz ? 0 : def.gravity ?? (P.grounded ? 1 : HANG), drag: 0, tag: c.tag, yaw, face: true,
      until: def.plunge ? 'time' : 'time', endSpeed: def.endSpeed ?? 4,
      clip: def.clip, clipMap: () => (this.cur === c ? c.t : c.t),
      drive: (vel, dt) => {
        if (this.cur !== c) return;
        if (c.phase === 'fall') { vel.x *= 0.9; vel.z *= 0.9; vel.y = -(def.plunge.speed || 24); return; }
        if (!R) return;
        const t0 = c.t, t1 = c.t + dt * (def.rate || 1);
        R.at(t1, _a).sub(R.at(t0, _b)).multiplyScalar(scale / Math.max(1e-4, dt)); toWorld(_a, yaw, _k);
        vel.x = _k.x; vel.z = _k.z; if (xyz) vel.y = _k.y;
      },
      poseFix: (pose) => { if (R) { R.at(c.t, _a); pose.p[0] -= _a.x; pose.p[2] -= _a.z; if (xyz) pose.p[1] -= _a.y; } this.joined(C, pose); },
      onEnd: () => { if (this.cur === c && c.phase !== 'fall') this.finish(); },
    });
    this.wholeOn = true;
  }

  /** A plunge meets the ground: the blast, then the rest of the clip. */
  land() {
    const c = this.cur, def = c.def, g = this.game, P = this.P;
    c.phase = 'play'; c.landed = true;
    if (def.ring && def.ringAt == null) this.ring(this.rule(def)?.radius ?? def.ring, def.hit);
    P.landed = Math.max(P.landed || 0, 10);
    const L = P.techs.get('launch'), rest = ((def.to ?? this.dur(def)) - c.t) / (def.rate || 1);
    if (L?.active && L.o?.tag === c.tag) { L.o.time = L.t + rest + 0.02; L.o.gravity = 1; }
  }

  finish() {
    const c = this.cur; if (!c) return;
    this.cur = null; this.after = 0; this.S.trail?.gap();
    if (c.def.rec) this.rec = { clip: c.def.rec, t: 0, dur: 0.75 };
    if (c.def.body === 'whole') { const L = this.P.techs.get('launch'); if (L?.active && L.o?.tag === c.tag) { L.o.onEnd = null; L.o.time = 0; } }
    this.S.onEnd?.(c);
  }

  /** Where a move goes: toward the lock, or where they are looking (flat). */
  aimDir(out) {
    const g = this.game, P = this.P;
    if (g.lock?.active) { g.lock.point(_e); out.copy(_e).sub(P.pos).setY(0); if (out.lengthSq() > 1e-4) return out.normalize(); }
    P.lookDir(out); out.y = 0;
    return out.lengthSq() > 1e-6 ? out.normalize() : out.set(Math.sin(P.bodyYaw), 0, Math.cos(P.bodyYaw));
  }

  /** What the move swept since the last frame, struck once a move each. */
  sweep() {
    const c = this.cur, def = c.def, g = this.game, P = this.P;
    if (!def.hit || c.phase === 'fall') return;
    let struck = 0;
    const R = this.rule(def), n = R?.hits || 1;
    if (n > 1 && def.track) { const [a, b] = def.track.strike, k = Math.floor(((c.t - a) / Math.max(1e-3, b - a)) * n); if (k > (c.part ?? 0) && k < n) { c.part = k; this.hit.clear(); } }
    sweepArc(g, P, c.yaw ?? P.bodyYaw, def.track, c.tPrev, c.t, { reach: this.S.reach ?? 0.6, seen: this.hit, hit: (kind, ent, at, dir) => { struck++; this.blow(kind, ent, at, dir, def.hit, c); } });
    if (struck) this.impact(def.hit.dmg ?? 1, c);
  }

  /** A blast around them (a plunge's landing, a slam): everything within R struck, thrown out and up. */
  ring(R, h) {
    const g = this.game, P = this.P;
    let struck = 0;
    for (const tg of targets(g, P.pos, R)) { if (Math.hypot(tg.pos.x - P.pos.x, tg.pos.z - P.pos.z) > R + tg.r || this.hit.has(tg.ent)) continue; this.hit.add(tg.ent); struck++; this.blow(tg.kind, tg.ent, tg.pos, _a.copy(tg.pos).sub(P.pos).setY(0).normalize(), h, this.cur); }
    g.fx?.shockwave?.(P.pos.clone(), R);
    P.shake = Math.max(P.shake, 0.3);
    if (struck) this.impact((h?.dmg ?? 1) * 1.3, this.cur);
  }

  /** One blow on one thing: its damage, its knock (the launcher's lift, the plunge's spike), its event. */
  blow(kind, ent, at, dir, h, c) {
    const g = this.game, S = this.S, cause = h.cause || S.cause || 'sliced';
    const power = (h.power ?? 1) * (c?.kind === 'charge' ? 1 + this.charge : 1);
    const kv = _k.copy(dir).setY(0).normalize().multiplyScalar(h.push ?? 0); kv.y = h.lift ?? 0;
    if (kind === 'thing') ent.struck?.(at, dir, power, 'courier', this.id);
    else if (kind === 'pot') g.breakables.damage(ent, (S.pot ?? 62) * (h.dmg ?? 1), at, dir, power);
    else if (kind === 'clapper') { g.clappers.hit(ent, at, dir, power, cause); if (h.lift || h.push) g.clappers.knock?.(ent, kv.clone()); if (h.lift) this.lifted(c); }
    else if (kind === 'creature') {
      g.creatures.strike(ent, at, dir, this.worth(h, c), cause); if (h.lift || h.push) ent.knock?.(kv.clone());
      this.struck(ent, c);
    }
    if (c && (c.kind === 'air' || c.kind === 'launcher')) { this.airHits++; this.P.vel.y = Math.max(this.P.vel.y, 0.6); } // (a hit in the air holds them up a beat)
    g.events?.emit(S.events.hit, { what: kind === 'creature' ? ent.kind : kind, combo: this.combo, move: c?.id, by: 'courier' });
    S.onHit?.(kind, ent, at, dir, h, c, this.rule(c?.def));
  }

  /** What a blow is worth to a creature (creatures.strike's power): its row's, a charge from half of it to all; with no row, the tool's
   *  k times the blow's own (a tool with its own rules for a blow asks here too). */
  worth(h, c) {
    const R = this.rule(c?.def), charged = c?.kind === 'charge';
    return R ? R.power * (charged ? 0.5 + 0.5 * this.charge : 1) : (this.S.k ?? 1.4) * (h.power ?? 1) * (charged ? 1 + this.charge : 1);
  }
  /** A creature struck: its row's status put on it (each creature decides what it means), and a launcher's first lift counted. */
  struck(ent, c) {
    const R = this.rule(c?.def);
    if (R?.status && ent.alive) this.game.creatures.apply(ent, R.status, STATUS_DUR[R.status] ?? 1, 1, 'courier');
    this.lifted(c);
  }

  /** A launcher's first lift of something: Dovina's count (move.launch opens the air string). */
  lifted(c) { if (c?.kind !== 'launcher' || c.lifted) return; c.lifted = true; this.game.events?.emit('move.launch', { tool: this.S.rules || this.id, by: 'courier' }); }

  /** What a hit does to the world: the sound, the shake, the flash, and the stop. */
  impact(dmg, c) {
    const g = this.game, P = this.P;
    sfx.cutHit?.(dmg);
    P.shake = Math.max(P.shake, 0.12 * dmg);
    if (this.S.segment) { this.S.segment(_a, _b); g.fx?.slash?.(_a.clone(), _b.clone(), _up); }
    g.time.pulse('hit', 0.07, 0.035 + 0.03 * dmg * (c?.def.stop ?? 1), { release: 0.12 });
  }

  /** The upper-body layer while an upper move (or its recovery) plays: { pose, w } | null. */
  pose(C, out) {
    const c = this.cur;
    if (!c) {
      const r = this.rec; if (!r) return null;
      C.sample(r.clip, r.t, out, false);
      return { pose: out, w: 1 - THREE.MathUtils.smoothstep(r.t, r.dur - 0.3, r.dur) };
    }
    if (c.def.body === 'whole') return null;
    C.sample(c.def.clip, c.t, out, c.kind === 'charge-hold');
    this.joined(C, out);
    const end = c.def.to ?? this.dur(c.def), fade = c.def.fade;
    const w = Math.min(1, (c.t - (c.def.from || 0)) / 0.05 + (this.from && this.fadeT < 1 ? 1 : 0)) * (fade ? 1 - THREE.MathUtils.smoothstep(c.t, end - fade, end) : 1);
    return { pose: out, w: Math.min(1, w) };
  }

  /** A chained move begins from what was showing: the last pose held and faded out over 0.1 s (the join's pop smoothed), and the pose kept. */
  joined(C, pose) {
    if (this.from && this.fadeT < 1) {
      this.fadeT = Math.min(1, this.fadeT + (this.game.rawDt || 1 / 60) / 0.1);
      const k = this.fadeT * this.fadeT * (3 - 2 * this.fadeT), tmp = (this._jt ||= C.pose());
      tmp.copy(pose); pose.copy(this.from); C.blend(pose, tmp, k);
    }
    (this.last ||= C.pose()).copy(pose);
  }

  /** Standing still, an upper move's legs are the clip's too (its step, its weight), its own travel taken out of the hips; moving,
   *  the legs are the run's. `w`: the tool's layer weight (its draw, the override). */
  legs(ch, base, w = 1, dt = 1 / 60) {
    const c = this.cur, P = this.P, C = ch.clips;
    const want = c && c.def.body !== 'whole' && P.grounded ? 1 - THREE.MathUtils.smoothstep(Math.hypot(P.vel.x, P.vel.z), 0.3, 1.6) : 0;
    this.legW = THREE.MathUtils.damp(this.legW || 0, want, want > (this.legW || 0) ? 14 : 8, dt);
    if (this.legW < 0.01 || !c) return;
    const pose = C.sample(c.def.clip, c.t, (this._lp ||= C.pose()), c.kind === 'charge-hold'), R = rootOf(C, c.def.clip);
    if (R) { R.at(c.t, _a); pose.p[0] -= _a.x; pose.p[2] -= _a.z; }
    if (!this.LOWER || this.LOWER.length !== C.nb) this.LOWER = Float32Array.from(ch.MASK_UPPER, (v) => 1 - v);
    const end = c.def.to ?? this.dur(c.def), fw = c.def.fade ? 1 - THREE.MathUtils.smoothstep(c.t, end - c.def.fade, end) : 1;
    C.blend(base, pose, this.legW * w * fw, this.LOWER, 1);
  }

  /** After the tool is placed this frame: the ribbon while the move is in its strike. */
  afterHands(dt) {
    const T = this.S.trail; if (!T) return;
    const c = this.cur, win = c?.def.trail || (c?.def.track ? [c.def.track.strike[0] - 0.04, c.def.track.strike[1] + 0.04] : null);
    if (c && win && c.t >= win[0] && c.t <= win[1] && c.phase !== 'fall') { this.S.segment(_a, _b); T.push(_a, _b); }
    else T.gap();
    T.power = c ? 1 + (c.def.heat || 0) * 1.4 : 1;
    T.update(dt);
  }

  /** First person: the arc for what plays. */
  fpArc() {
    const c = this.cur; if (!c) return null;
    const tr = c.def.track, s = tr?.strike || [0.2, 0.3], end = c.def.to ?? this.dur(c.def);
    const u = c.t < s[0] ? (c.t / Math.max(0.01, s[0])) * 0.3 : c.t < s[1] ? 0.3 + ((c.t - s[0]) / Math.max(0.01, s[1] - s[0])) * 0.5 : 0.8 + ((c.t - s[1]) / Math.max(0.01, end - s[1])) * 0.2;
    return { arc: c.def.arc || ['r2l', 'l2r', 'over'][c.n % 3], u: Math.min(1, u) };
  }
}
