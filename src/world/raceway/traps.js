// ---------------------------------------------------------------------------------------
// THE TRAPS IN THE WORLD (docs/plans/TRACK-EDITOR.md 4, 6; the rules and clocks: progress/traps.js): a track's traps (its `traps` feature,
// track.js) stood on its line: a made track's always, a park track's only for a haunted run on it (race.js, haunt.js: the park's races
// are never changed by them, a modifier you choose). Each on its own cycle, or POSSESSED: by the siblings as bots (the haunted race: progress/trapbot.js) or by you (the haunt mode:
// world/raceway/haunt.js). Each tells before it acts (trap.tell, the placeholder's glow; the looks are Calissa's), acts on whatever is in its
// reach (the Courier's board, and the rivals racing the track), and says so (trap.hit). A possessed trap keeps its tell; a hit resets a
// haunter's wrath, a lap without one grows it (Crawl's).
// What each does to the board goes through the board's own verbs (BoardRules.hit, the bail, a push, the grip's modifier: gripAt), so the
// core movement is untouched and every effect has a source you can see (DESIGN.md 22).
//
// Prior art: the traps' homework is in progress/traps.js; Crawl's possession (a trap a ghost holds keeps its own shape and timing); Mario
// Kart's item hits (a spin-out a rival recovers from: the takedown's `wreck`).
//
//   R.traps = new Traps(R)   .use(T | null) (a track's traps up; null: the made track's again, if any)   .build(T)   .clear()   .T   .list
//   .haunt(mode: null | 'bots' | 'courier')   .fire(i, opts?) -> bool
//   .gripAt(x, z) -> multiplier   .update(dt)   .nearest(lx, lz) (park-local) -> index | -1   events: trap.tell { kind, i, by }, trap.fire { kind, i, by,
//   possessor }, trap.hit { kind, target: 'courier' | 'rival', who, by, possessor }, trap.parry { by }, trap.stun { kind, by }, trap.warp { from, to, back, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RW } from './track.js';
import { TRAPS, TRAP, TrapClock, autoPhase } from '../../progress/traps.js';
import { HAUNTERS, wantsFire } from '../../progress/trapbot.js';
import { stream } from '../../core/rng.js';

const rand = stream('raceway/traps');
const HIT_AGAIN = 1.2; // (real seconds before one trap may hit the same racer again)
const GLOW = { idle: 0x3a2a24, tell: 0xffb04a, active: 0xff4a2a, red: 0xc0102a, lit: 0x7fdcff };

export class Traps {
  constructor(R) { this.R = R; this.list = []; this.t = 0; this.mode = null; this.group = null; this.balls = []; }
  get game() { return this.R.game; }

  /** A track's traps up (rebuilt only if it is another track), or with null the made track's again (or none). */
  use(T) {
    const want = T ?? this.R.made?.T ?? null;
    if (!want || !want.features?.traps?.length) { this.clear(); return; }
    if (want !== this.T || !this.group) this.build(want);
  }
  build(T) {
    this.clear();
    const g = this.game, group = (this.group = new THREE.Group()); group.userData.zone = 'raceway'; g.scene.add(group);
    this.T = T; const L = T.length;
    this.list = (T.features.traps || []).map((d, i) => {
      const K = TRAPS[d.kind]; if (!K) return null;
      const Tp = { i, kind: d.kind, K, d, s: T.sOf(d.cp, d.at), lat: d.lat || 0, period: d.period || K.cycle.period, offset: d.offset || 0, phase: 'idle', k: 0, hitT: new Map(), lane: 0, fires: 0, stun: 0, dir: 1, wrath: 0, quiet: 0, clock: null, haunter: null };
      if (K.pair) Tp.s2 = d.at2 != null ? T.sOf(d.cp, d.at2) : (Tp.s + 120) % L; // (a portal's second eye; 120 m on if none was set)
      Tp.look = this.place(Tp); return Tp;
    }).filter(Boolean);
    this.haunt(this.mode);
  }
  clear() {
    this.T = null;
    if (this.group) { this.group.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); this.group.removeFromParent(); this.group = null; }
    this.list = []; this.balls = [];
  }
  /** Who holds the traps: none (each on its own cycle), the siblings as bots, or you. */
  haunt(mode) {
    this.mode = mode || null;
    this.list.forEach((Tp, k) => { Tp.clock = this.mode ? new TrapClock(Tp.kind) : null; Tp.haunter = this.mode === 'bots' ? HAUNTERS[k % HAUNTERS.length] : null; Tp.wrath = 0; Tp.quiet = 0; });
  }

  // ---------------------------------------------------------------- where things are
  frameAt(s, lat, up = 0) { const F = this.T.frame(s), pos = this.R.local(F.x - F.fz * lat, F.z + F.fx * lat); pos.y += up; return { F, pos }; }
  /** A racer's place on the trapped track: its s, lat and world point (the Courier from the Raceway's own reading; a rival from its run). */
  racers() {
    const g = this.game, R = this.R, out = [], T = this.T, L = T.length;
    const S = g.techs?.active?.id === 'skiff' ? g.techs.active : null;
    if (R.track === T && S?.phase === 'ride') out.push({ who: 'you', target: 'courier', s: R.s, lat: R.lat, pos: g.player.pos, S, v: S.v.length(), air: S.air });
    const rv = g.haunt?.on ? g.haunt.rivals : g.race?.T === T ? g.race.rivals : null;
    for (const r of rv?.list || []) { if (r.s == null) continue; out.push({ who: r.name, target: 'rival', r, s: ((r.s % L) + L) % L, lat: r.lat, pos: r.group.position, v: r.v, air: false }); }
    return out;
  }
  /** The trap nearest a park-local point (for the haunt mode's click), or -1. */
  nearest(lx, lz, within = 18) { let best = -1, bd = within; this.list.forEach((Tp, i) => { const p = Tp.look.root.position, d = Math.hypot(p.x - (RW.x + lx), p.z - (RW.z + lz)); if (d < bd) { bd = d; best = i; } }); return best; }

  // ---------------------------------------------------------------- the placeholders (Calissa's to dress: a trap's body, its tell)
  place(Tp) {
    const K = Tp.K, root = new THREE.Group(), { F, pos } = this.frameAt(Tp.s, 0); root.position.copy(pos); root.rotation.y = Math.atan2(F.fx, F.fz); this.group.add(root);
    const mat = (c, o = 1) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, transparent: o < 1, opacity: o, flatShading: true });
    const glow = new THREE.MeshBasicMaterial({ color: GLOW.idle, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
    const look = { root, glow, parts: [] }, W = F.w;
    const pad = (w, len, x = 0, z = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len).rotateX(-Math.PI / 2), glow); m.position.set(x, 0.1, z); root.add(m); return m; };
    if (Tp.kind === 'pillars') { for (let l = 0; l < 3; l++) { const m = new THREE.Mesh(new THREE.BoxGeometry((2 * W) / 3 - 0.4, K.size.h, K.size.len), mat(0xd9906a)); m.position.set(-W + (2 * W * (l + 0.5)) / 3, -K.size.h, 0); root.add(m); look.parts.push(m); } pad(2 * W, K.size.len + 2); }
    else if (Tp.kind === 'pendulum') { for (const x of [-(W + 2), W + 2]) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.2, 13, 1.2), mat(0x8a4a3a)); p.position.set(x, 6.5, 0); root.add(p); } const top = new THREE.Mesh(new THREE.BoxGeometry(2 * W + 5, 1, 1.2), mat(0x8a4a3a)); top.position.y = 13; root.add(top);
      const arm = new THREE.Group(); arm.position.y = 13; root.add(arm); const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 11), mat(0x3a2a24)); rod.position.y = -5.5; arm.add(rod); const bob = new THREE.Mesh(new THREE.SphereGeometry(K.size.bob, 10, 8), mat(0xd9906a)); bob.position.y = -11.5; arm.add(bob); look.arm = arm; pad(2 * W, 3); }
    else if (Tp.kind === 'gust') { const fan = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.2, 12).rotateZ(Math.PI / 2), mat(0x8a6a5a)); fan.position.set(-(W + 3), 2.4, 0); root.add(fan); look.fan = fan; pad(2 * W, K.size.len); }
    else if (Tp.kind === 'sinkhole' || Tp.kind === 'gusher') { const lat = Tp.lat; const m = new THREE.Mesh(new THREE.CircleGeometry(K.size.r, 24).rotateX(-Math.PI / 2), glow); m.position.set(-lat, 0.1, 0); root.add(m); look.disc = m; if (Tp.kind === 'gusher') { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 1.4, 8), mat(0x2a2420)); v.position.set(-(W + 2), 0.7, 0); root.add(v); } }
    else if (Tp.kind === 'portal') { const ring = (s) => { const { F: F2, pos: p2 } = this.frameAt(s, 0, 3); const m = new THREE.Mesh(new THREE.TorusGeometry(K.size.r, 0.35, 8, 24), glow); m.position.copy(p2); m.rotation.y = Math.atan2(F2.fx, F2.fz); this.group.add(m); return m; }; look.a = ring(Tp.s); look.b = ring(Tp.s2 ?? Tp.s); }
    else if (Tp.kind === 'turret') { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 6, 8), mat(0x8a4a3a)); post.position.set(-(W + 4), 3, 0); root.add(post); const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), glow); lamp.position.set(-(W + 4), 6.6, 0); root.add(lamp); look.lamp = lamp; }
    return look;
  }
  show(Tp) {
    const L = Tp.look, active = Tp.phase === 'active', red = Tp.kind === 'portal' && Tp.red;
    L.glow.color.setHex(Tp.stun > 0 ? GLOW.idle : red ? GLOW.red : Tp.kind === 'portal' && active ? GLOW.lit : active ? GLOW.active : Tp.phase === 'tell' ? GLOW.tell : GLOW.idle);
    L.glow.opacity = Tp.phase === 'tell' ? 0.45 + 0.4 * Math.abs(Math.sin(this.t * 14)) : 0.6;
    if (Tp.kind === 'pillars') { const h = Tp.K.size.h; L.parts.forEach((m, l) => { const want = l !== Tp.lane ? -h / 2 : active ? h / 2 : Tp.phase === 'tell' ? -h / 2 + 0.5 : -h / 2; m.position.y += (want - m.position.y) * 0.35; }); } // (sunk: its top at the floor; told: peeking; up: standing)
    if (L.arm) L.arm.rotation.z = (Tp.swing ?? 0) * 1.0;
    if (L.fan) L.fan.rotation.x += (active ? 0.9 : 0.05) * Tp.dir;
  }

  // ---------------------------------------------------------------- firing
  /** A possessed trap fired (by its haunter or by you): refused while it is cooling, stunned, or within a gate's grace of a racer it would
   *  meet. `opts.lane` (pillars), `opts.dir` (the gust's side) are the possessor's choices. */
  fire(i, opts = {}) {
    const Tp = this.list[i]; if (!Tp?.clock || Tp.stun > 0 || !Tp.clock.ready) return false;
    if (opts.lane != null) Tp.lane = Math.max(0, Math.min(2, opts.lane)); if (opts.dir) Tp.dir = Math.sign(opts.dir);
    if (Tp.kind === 'portal') Tp.red = true;
    Tp.clock.fire(); Tp.quiet = 0;
    this.game.events?.emit('trap.fire', { kind: Tp.kind, i, by: this.mode === 'courier' ? 'courier' : 'environment', possessor: Tp.haunter?.name || (this.mode === 'courier' ? 'you' : null) });
    return true;
  }

  // ---------------------------------------------------------------- per frame
  update(dt) {
    if (!this.list.length || !this.T) return;
    const g = this.game; this.t += dt;
    const racers = this.racers(), L = this.T.length, you = racers.find((x) => x.who === 'you');
    for (const Tp of this.list) {
      Tp.stun = Math.max(0, Tp.stun - dt);
      for (const [k, v] of Tp.hitT) if (v - dt <= 0) Tp.hitT.delete(k); else Tp.hitT.set(k, v - dt);
      const was = Tp.phase;
      if (Tp.clock) {
        Tp.clock.step(dt); Tp.phase = Tp.stun > 0 ? 'idle' : Tp.clock.phase === 'idle' ? 'idle' : Tp.clock.phase; Tp.k = Tp.clock.k; if (Tp.kind === 'pendulum') Tp.swing = Tp.clock.swing;
        if (Tp.phase === 'idle' && was !== 'idle') Tp.red = false;
        // a haunter's wrath: a stretch without a hit grows the trap a step (Crawl's)
        if ((Tp.quiet += dt) > TRAP.wrath.every && Tp.wrath < TRAP.wrath.max) { Tp.wrath++; Tp.quiet = 0; }
        if (this.mode === 'bots' && Tp.haunter && you) this.decide(Tp, you, L);
      } else {
        const A = autoPhase(Tp.kind, Tp.period, Tp.offset, this.t); Tp.phase = Tp.stun > 0 ? 'idle' : A.phase; Tp.k = A.k; Tp.swing = A.swing;
        if (Tp.kind === 'pillars' && was !== 'tell' && Tp.phase === 'tell') Tp.lane = Tp.fires++ % 3;
      }
      if (Tp.phase === 'tell' && was !== 'tell') g.events?.emit('trap.tell', { kind: Tp.kind, i: Tp.i, by: 'environment' });
      this.show(Tp);
      if (Tp.phase === 'active' || Tp.kind === 'pendulum') for (const x of racers) this.act(Tp, x, dt, L);
      if (Tp.kind === 'turret' && Tp.phase === 'active' && was !== 'active') this.cast(Tp, racers);
    }
    this.stepBalls(dt, you);
  }
  /** A bot haunter's choice for one trap this frame (progress/trapbot.js): the rider's gap to it and speed, its grace, its roll. */
  decide(Tp, you, L) {
    const gap = ((Tp.s - you.s) % L + L) % L, gates = [this.T.line, ...this.T.gates], inGrace = gates.some((gs) => ((Tp.s - gs) % L + L) % L < TRAP.grace);
    if (gap > 160) return;
    const extra = Tp.kind === 'turret' ? Math.hypot(gap, Tp.K.size.range * 0.2) / Tp.K.ball.speed : 0;
    if (wantsFire({ kind: Tp.kind, gapM: gap, speed: you.v, ready: Tp.clock.ready && Tp.stun <= 0, inGrace, haunter: Tp.haunter, rand, extra })) this.fire(Tp.i, { lane: Math.max(0, Math.min(2, Math.floor(((you.lat + this.T.frame(Tp.s).w) / (2 * this.T.frame(Tp.s).w)) * 3))), dir: you.lat > 0 ? -1 : 1 });
  }
  along(Tp, x, L) { const d = ((x.s - Tp.s + L * 1.5) % L) - L / 2; return d; } // (metres the racer is past the trap: negative before it)
  /** One trap on one racer, while it acts. */
  act(Tp, x, dt, L) {
    const K = Tp.K, a = this.along(Tp, x, L), F = this.T.frame(Tp.s), grow = 1 + TRAP.wrath.k * Tp.wrath;
    let hit = false;
    if (Tp.kind === 'pillars') { const band = (2 * F.w) / 3, lane = Math.floor((x.lat + F.w) / band); hit = Math.abs(a) < K.size.len / 2 + 0.6 && lane === Tp.lane && !x.air; if (hit) this.strike(Tp, x, K.hit); return; }
    if (Tp.kind === 'pendulum') { const bobLat = (Tp.swing ?? 0) * Math.min(F.w, K.size.reach) * -1; hit = Math.abs(a) < K.size.len && Math.abs(x.lat - bobLat) < K.size.bob * grow + 0.8; if (hit) this.strike(Tp, x, K.hit, Math.sign(x.lat - bobLat) || 1); return; }
    if (Tp.kind === 'gust') { if (Math.abs(a) < K.size.len / 2) { const push = K.push * grow * Tp.dir * dt; if (x.S) { x.S.v.x += -F.fz * push; x.S.v.z += F.fx * push; } else if (x.r) x.r.lat += push * 0.5; if (!Tp.hitT.has(x.who)) { Tp.hitT.set(x.who, HIT_AGAIN); this.said(Tp, x); } } return; }
    if (Tp.kind === 'sinkhole') { if (Math.hypot(a, x.lat - Tp.lat) < K.size.r * grow && !x.air) this.strike(Tp, x, K.hit); return; }
    if (Tp.kind === 'gusher') { if (x.r && Math.hypot(a, x.lat - Tp.lat) < K.size.r * grow) { x.r.v *= 1 - 0.6 * dt; if (!Tp.hitT.has(x.who)) { Tp.hitT.set(x.who, 3); this.said(Tp, x); } } return; } // (the board's grip: gripAt)
    if (Tp.kind === 'portal') {
      if (a > K.size.r + 2) Tp.spared?.delete(x.who); // (past the eye: the send-back's mercy spent)
      if (Math.abs(a) < K.size.r + 1 && Math.abs(x.lat) < K.size.r + 1 && !Tp.hitT.has(x.who) && !(Tp.red && Tp.spared?.has(x.who))) { Tp.hitT.set(x.who, 2.5); this.warp(Tp, x, L); }
    }
  }
  /** A trap's blow on a racer: the board's own verbs (a wall hit and the speed lost, a shove, a bail), or a rival spun out. */
  strike(Tp, x, H, side = 1) {
    if (Tp.hitT.has(x.who)) return; Tp.hitT.set(x.who, HIT_AGAIN);
    if (x.S) {
      const S = x.S;
      if (H.kind === 'bail') S.bail('trap');
      else { if (H.keep != null) S.v.multiplyScalar(H.keep); if (H.shove) { const F = this.T.frame(Tp.s); S.v.x += -F.fz * H.shove * side; S.v.z += F.fx * H.shove * side; this.game.player.vel.y += H.up || 0; S.air = S.air || !!H.up; } S.rules?.hit?.(H.kind === 'wall' ? 'wall' : 'bump', H.size); }
    } else if (x.r) { x.r.wreck = 2.8; x.r.v *= 0.4; }
    this.said(Tp, x);
  }
  said(Tp, x) {
    Tp.quiet = 0; if (Tp.wrath) Tp.wrath = 0;
    this.game.events?.emit('trap.hit', { kind: Tp.kind, i: Tp.i, target: x.target, who: x.who, by: this.mode === 'courier' ? 'courier' : 'environment', possessor: Tp.haunter?.name || (this.mode === 'courier' ? 'you' : null) });
  }
  /** Through a portal: lit, on to its other eye (a shortcut); red (possessed), back as far as the shortcut would have taken it on. */
  warp(Tp, x, L) {
    const lit = Tp.phase === 'active', back = !!Tp.red; if (!lit && !back) return;
    if (back) (Tp.spared ||= new Set()).add(x.who); // (sent back once, never again until past it: no haunter loops a rider forever, TRAP's fairness)
    const span = ((Tp.s2 - Tp.s) % L + L) % L, to = back ? ((Tp.s - span) % L + L) % L : Tp.s2;
    if (x.r) { x.r.d += back ? -span : span; }
    else if (x.S) {
      const { F, pos } = this.frameAt(to, x.lat, 0.6), speed = x.S.v.length(), yaw = Math.atan2(F.fx, F.fz), g = this.game;
      // moved with the board still under them (player.moveTo: a move in play, not a setting down; course.teleport would end the ride and
      // refill the pool, casebook 285): the rider at the other eye, facing along the line, at the speed they came in with
      const P = g.player; pos.y = this.R.rideHeight(pos.x, pos.z) + 0.6;
      x.S.heading = yaw; x.S.v.set(F.fx * speed, 0, F.fz * speed);
      P.moveTo(pos, new THREE.Vector3(x.S.v.x, 0, x.S.v.z)); P.yaw = P.bodyYaw = yaw;
      g.race?.warp?.(Tp.s, to, back);
    }
    this.game.events?.emit('trap.warp', { from: +Tp.s.toFixed(1), to: +to.toFixed(1), back, target: x.target, by: back ? (this.mode === 'courier' ? 'courier' : 'environment') : 'environment' });
    this.said(Tp, x);
  }
  /** The board's grip here: a live gusher's slick takes it down (the board's rules ask: boardrules.js surfaceGrip). */
  gripAt(x, z) {
    let k = 1; for (const Tp of this.list) { if (Tp.kind !== 'gusher' || Tp.phase !== 'active') continue; const { pos } = this.frameAt(Tp.s, Tp.lat); if (Math.hypot(x - pos.x, z - pos.z) < Tp.K.size.r * (1 + TRAP.wrath.k * Tp.wrath)) k = Math.min(k, Tp.K.grip); }
    return k;
  }

  // ---------------------------------------------------------------- the turret's flame
  cast(Tp, racers) {
    const { pos } = this.frameAt(Tp.s, -(this.T.frame(Tp.s).w + 4), 6.6), K = Tp.K;
    let target = null, bd = K.size.range; for (const x of racers) { const d = x.pos.distanceTo(pos); if (d < bd) { bd = d; target = x; } }
    if (!target) return;
    const lead = target.S ? target.S.v.clone().multiplyScalar(bd / K.ball.speed) : new THREE.Vector3(), aim = target.pos.clone().add(lead).setY(target.pos.y + 1).sub(pos).normalize();
    const m = new THREE.Mesh(new THREE.SphereGeometry(K.ball.r * 0.7, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb04a })); m.position.copy(pos); this.group.add(m);
    this.balls.push({ Tp, m, v: aim.multiplyScalar(K.ball.speed), life: K.ball.life, target, home: false });
  }
  stepBalls(dt, you) {
    const g = this.game, parry = !!you && g.input?.wasPressed?.('KeyV');
    for (const B of this.balls) {
      B.life -= dt; const K = B.Tp.K;
      if (B.home) { const to = B.Tp.look.lamp.getWorldPosition(new THREE.Vector3()), d = to.clone().sub(B.m.position); if (d.length() < 1.5) { B.life = 0; B.Tp.stun = K.stun; g.events?.emit('trap.stun', { kind: B.Tp.kind, i: B.Tp.i, by: 'courier' }); } else B.v.copy(d.normalize().multiplyScalar(K.ball.speed * 1.4)); }
      else if (B.target?.pos) { const want = B.target.pos.clone().setY(B.target.pos.y + 1).sub(B.m.position).normalize().multiplyScalar(K.ball.speed); B.v.lerp(want, Math.min(1, K.ball.home * dt)); }
      B.m.position.addScaledVector(B.v, dt);
      if (B.home || !B.target) continue;
      const d = B.m.position.distanceTo(B.target.pos.clone().setY(B.target.pos.y + 1));
      if (parry && B.target.who === 'you' && d < K.ball.parry) { B.home = true; g.events?.emit('trap.parry', { kind: 'turret', by: 'courier' }); continue; }
      if (d < K.ball.r + 0.5) { B.life = 0; this.strike(B.Tp, B.target, K.hit, 1); }
    }
    for (const B of this.balls) if (B.life <= 0) { B.m.geometry.dispose(); B.m.material.dispose(); B.m.removeFromParent(); }
    this.balls = this.balls.filter((B) => B.life > 0);
  }
}
