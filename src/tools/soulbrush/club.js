// ---------------------------------------------------------------------------------------
// THE CLUB: the Soul Brush as a melee weapon. Where the cutlass is quick and cuts, the brush is heavy and hits: a hammer with a head of
// wet hair. Its blows are the Courier's own suite (Brush_*), run by the shared combo engine (tools/moveset.js, the grammar every tool
// keeps); they BAT what they meet rather than cut it (a clapperjar struck by the light blows is sent flying; the third, overhead blow, or a
// blow on one already in the air, leaves it reeling: the juggle rule), and every blow FLICKS slip off the bristles in the direction the
// head was going, which splats where it lands and is wet enough to dive into.
//
//   LMB             three blows (Brush_Combo1-3), the third an overhead that strikes the ground; LMB in the air, the same three
//   LMB, pause, LMB after the second blow: the SPIN (Brush_Spin), the brush swung all the way round them
//   sprinting LMB   the DIVE (Brush_Dive): a lunge that swings the brush through what is ahead, cut before it lies them down
//   LMB held        on the ground, the bristles SATURATE and the load's mode works (tools/soulbrush/load.js: Brush_ChargeHold while they
//                   fill, Brush_Paint while it paints or mops); in the air, the CHARGE (Brush_ChargeHold): let go to bring it down,
//                   the harder the longer it was held. Let go in the air: the AIR SLAM (Brush_AirSlam: wound up over the head, then
//                   down with them, struck where they land). Landed while still holding: the GROUND SLAM (Brush_ChargeSlam). Either
//                   way a ring that throws what is near (what breaks, breaks where it lands), and a pool of slip where it struck.
//   RMB tap         the FLICK's body (Brush_Flick): the fan of slip leaves the bristles at the top of the throw (soulbrush.js spends it)
//
// Prior art, and what was taken:
//  - Splatoon's Inkbrush and Octobrush: the flick. A swing throws a fan of ink along the swing, the brush's only ranged reach.
//  - Zelda's hold-to-charge (the spin attack, the Megaton Hammer's ground pound) and the ground pound of every platformer since Mario 64:
//    a held button that commits, a slam that answers with a shockwave, and a hit-stop on contact (game.time.pulse) for the weight.
//  - Dark Souls' great hammers: a light string that staggers, a heavy that finishes, a lunge that steps into the blow; Devil May Cry's
//    Helm Breaker for the air slam's shape (wound up in the air, then straight down, the blow where they land).
//  - Bayonetta's pause combos for the spin (the same button, the rhythm choosing the branch).
// What a blow does is the club's own (`ClubMoves.blow`, the engine's machine with the club's rules); the head is tested along its sweep
// (melee.js) against pots, clapperjars, creatures and anything struckable, once a blow each, and the loose pieces by its segment.
//
//   const C = new Club(tool)   C.update(dt, inp)   C.tick(dt) (always)   C.pose(clips, buf, dt) -> { pose, w } | null   C.legs (the
//   clip under an own pose, for tools/toolbody.js standLegs)   C.afterHands(dt)   C.fpArc()   C.startFlick(onRelease)   C.cancel()
//   C.busy  C.playing  C.charge (-1, or seconds held)  C.tipVel  C.moves (the Moveset)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { hasTag } from '../../core/tags.js';
import { arcAt } from '../viewmodel.js';
import { BRUSH } from './model.js';
import { Moveset } from '../moveset.js';
import { carryInto } from '../toolbody.js';
import { stream, randDir } from '../../core/rng.js';
const simRand = stream('tools/soulbrush/club'); // (the simulation's chance: core/rng.js, the same twice)

// The blows, in clip seconds (the moveset's table: tools/moveset.js). When the head can hurt is measured from each clip (melee.js);
// `strike` overrides that where the fastest moment is the wind-up (the dive's swing round behind them), `ground` is when the overhead
// meets the floor, `flick` how much slip leaves the bristles at the strike, `carry` the sprint's speed (m/s) kept into a whole-body
// move and eased away over it (the dive's own travel is half a metre before it would lie them down).
// Numbers for Dovina (proposals): the three blows keep the club's power and damage (1.4 / 1.5 / 2.0, 1.0 / 1.1 / 1.8); the spin 1.6
// power, 1.3 damage and a 5 m/s shove (a finisher of the second branch, a little under the overhead); the dive 1.8 and 1.5 with a 6 m/s
// shove (a sprint's committed lunge, the cutlass's dash slash scaled to the brush's weight).
const MOVES = {
  c1: { rule: 'combo1', clip: 'Brush_Combo1', chain: [0.42, 0.85], to: 0.88, fade: 0.3, hit: { power: 1.4, dmg: 1.0, bat: true }, lunge: 2.6, arc: 'r2l', flick: 1 },
  c2: { rule: 'combo2', clip: 'Brush_Combo2', chain: [0.52, 0.92], to: 0.95, fade: 0.3, hit: { power: 1.5, dmg: 1.1, bat: true }, lunge: 2.6, arc: 'l2r', flick: 1 },
  c3: { rule: 'combo3', clip: 'Brush_Combo3', rate: 1.05, to: 1.45, fade: 0.45, hit: { power: 2.0, dmg: 1.8, bat: false }, lunge: 4, ground: 0.75, heat: 0.6, arc: 'over', flick: 1.2 },
  spin: { rule: 'spin', clip: 'Brush_Spin', body: 'whole', hit: { power: 1.6, dmg: 1.3, bat: true, push: 5 }, heat: 0.6, arc: 'r2l', flick: 1.4 },
  dive: { rule: 'dash', clip: 'Brush_Dive', body: 'whole', root: 'xz', from: 0.08, rate: 1.1, to: 0.44, strike: [0.29, 0.4], carry: 6, hit: { power: 1.8, dmg: 1.5, bat: true, push: 6 }, heat: 0.7, arc: 'r2l', endSpeed: 5, flick: 1.2 },
};
const STRINGS = { ground: ['c1', 'c2', 'c3'], air: ['c1', 'c2', 'c3'], pause: [{ at: 1, to: ['spin'] }], dash: 'dive' };
// the slams: held up (the charge), then down. Clip seconds; `hold` is where the air slam waits while they fall, `strike` where the head
// meets the ground. Proposals for Dovina: the club's own (4 Lachryma, a quarter of a full 1.1 s charge at least, a 2.4 m ring).
const SLAM = {
  hold: 0.32, full: 1.1, cost: 4, radius: 2.4, reach: 1.45, charge: 'Brush_ChargeHold',
  ground: { clip: 'Brush_ChargeSlam', rate: 1.15, flick: 0.22, strike: 0.27, end: 1.1 },
  air: { clip: 'Brush_AirSlam', rate: 1.5, hold: 0.47, flick: 0.55, strike: 0.55, end: 1.3, speed: 18 },
};
const LOAD = { fill: 'Brush_ChargeHold', work: 'Brush_Paint' }; // (the bristles filling, held up; then worked against the ground)
const FLICK = { clip: 'Brush_Flick', from: 0.05, rate: 1.15, at: 0.2, end: 0.63 }; // (the slip leaves at the top of the throw)
const REACH = BRUSH.tip - BRUSH.ferrule + 0.45; // (the head is further out than a sword's tip, and some forgiveness)
const DMG = 30, HEAD_R = 0.3; // (a pot takes a few blows: the brush alters things; it is a poor way to break them)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Vector3(), _e = new THREE.Vector3(), _k = new THREE.Vector3();
const smooth = THREE.MathUtils.smoothstep;

function segDist(a, b, p) {
  _d.subVectors(b, a);
  const l2 = _d.lengthSq();
  const t = l2 > 0 ? THREE.MathUtils.clamp(_c.subVectors(p, a).dot(_d) / l2, 0, 1) : 0;
  return _c.copy(a).addScaledVector(_d, t).distanceTo(p);
}

/** The engine with the club's rules for what a blow does: pots broken only when the blow finishes them (else knocked about), creatures
 *  `bashed`, clapperjars batted away, or knocked reeling by the overhead or when already in the air (the juggle rule). */
class ClubMoves extends Moveset {
  blow(kind, ent, at, dir, h, c) {
    const g = this.game, power = h.power ?? 1, n = c?.n ?? 0, move = c?.id;
    if (kind === 'clapper' && ent.ally) return; // (an ally's: the Courier's blows pass through it)
    this.landed = true;
    if (kind === 'thing') ent.struck?.(at, dir, power, 'courier', 'club');
    else if (kind === 'pot') {
      const amt = DMG * (h.dmg ?? 1);
      if (hasTag(ent, 'breakable') && ent.hp - amt <= 0) g.breakables.shatter(ent, at, dir, power, 'bashed', 'courier');
      else {
        g.breakables.damage(ent, amt, at, dir, power, false, 'courier');
        if (ent.alive && hasTag(ent, 'pushable')) g.physics.kick(ent.body, dir.clone().setY(Math.max(0.35, dir.y)).multiplyScalar(ent.body.mass() * 4.5 * power));
      }
      g.events?.emit('brush.hit', { what: 'pot', n, move, by: 'courier' });
    } else if (kind === 'creature') {
      g.creatures.strike(ent, at, dir, this.worth(h, c), 'bashed'); // (the row's power: progress/combat/moves.js brush)
      if (h.push || h.lift) ent.knock?.(_k.copy(dir).setY(0).normalize().multiplyScalar(h.push ?? 0).setY(h.lift ?? 0).clone());
      this.struck(ent, c);
      g.events?.emit('brush.hit', { what: ent.kind, n, move, by: 'courier' });
    } else if (kind === 'clapper') {
      const flat = _k.copy(dir).setY(0).normalize();
      if (h.bat !== false && ent.state !== 'knocked') { g.clappers.knock(ent, flat.multiplyScalar(9 * power).setY(4.5).clone()); g.events?.emit('brush.hit', { what: 'clapper', n, move, bat: true, by: 'courier' }); }
      else { g.clappers.knock(ent, flat.multiplyScalar(11 * power).setY(6).clone()); g.clappers.stun(ent, 2.5, g.shells.glowOutline, g.shells.xray); g.events?.emit('brush.hit', { what: 'clapper', n, move, stun: true, by: 'courier' }); }
    }
    if (c && (c.kind === 'air' || c.kind === 'launcher')) { this.airHits++; this.P.vel.y = Math.max(this.P.vel.y, 0.6); } // (a blow in the air holds them up a beat)
  }

  /** The head lands: the padded thud, the shake, the dust off the bristles, and the stop. */
  impact(dmg, c) {
    if (!this.landed) return; // (only an ally was in the way)
    this.landed = false;
    const g = this.game, P = this.P, club = this.tool.club;
    sfx.brushHit?.(dmg);
    P.shake = Math.max(P.shake, 0.14 * dmg);
    g.time.pulse('hit', 0.06, 0.045 + 0.035 * dmg * (c?.def.stop ?? 1), { release: 0.14 });
    this.tool.model.headWorld(_p);
    g.fx?.impact?.(_p.clone(), club.tipVel.clone().normalize().negate(), { color: 0xe8ab86, sparks: 2, dust: 12 });
  }
}

export class Club {
  constructor(tool) {
    this.tool = tool;
    const g = tool.game;
    this.trail = g?.vfx?.swing('swing.brush') || null; // (the head's arc through the air: its look is vfx/library.js 'swing.brush')
    this.moves = new ClubMoves(tool, {
      id: 'club', rules: 'brush', moves: MOVES, strings: STRINGS, reach: REACH, pot: DMG, k: 1.2, cause: 'bashed', events: { swing: 'brush.swing', hit: 'brush.hit' },
      trail: this.trail, segment: (a, b) => this.tool.model.headSegment(a, b),
      onBegin: (c) => this.onBegin(c), onAt: (c) => this.flick(c.def.flick ?? 1), onUpdate: (c) => this.onMove(c),
    });
    this.held = -1; // (LMB held through a blow: how long)
    this.charge = -1; this.chargeT = 0; // -1: not charging; else seconds held up
    this.slam = null; // { S, t, phase: 'wind' | 'fall' | 'play', power, air, struck, wait, whole }
    this.flickT = -1; this.onFlick = null;
    this.loadW = 0; this.workW = 0; this.loadT = 0; this.legs = null;
    this.tipPrev = new THREE.Vector3(); this.tipVel = new THREE.Vector3(); this.hasPrev = false;
  }
  get game() { return this.tool.game; }
  get P() { return this.tool.P; }
  get busy() { return this.moves.busy || this.charge >= 0 || !!this.slam; }
  get playing() { return this.busy || this.moves.playing || this.flickT >= 0; }

  cancel() {
    this.moves.cancel(); this.charge = -1; this.held = -1; this.flickT = -1; this.onFlick = null;
    if (this.slam) this.endSlam();
  }

  aimDir(out) {
    const g = this.game, P = this.P;
    if (g.lock?.active) {
      g.lock.point(_e);
      out.copy(_e).sub(_a.set(P.pos.x, P.pos.y + 0.9, P.pos.z)).setY(0);
      if (out.lengthSq() > 1e-4) return out.normalize();
    }
    return P.lookDir(out).setY(0).normalize();
  }

  // ---------------------------------------------------------------- the engine's hooks
  onBegin(c) {
    this.held = 0;
    if (c.def.strike && c.def.track && c.def.track.strike !== c.def.strike) c.def.track = { ...c.def.track, strike: c.def.strike }; // (a copy: melee.js shares its tracks)
    sfx.brushSwing?.(c.def.heat ? 1.4 : 1);
    carryInto(this.moves, c); // (the sprint kept into the dive: tools/toolbody.js)
  }
  /** The overhead meets the floor: a little ring of its own. */
  onMove(c) {
    if (c.def.ground != null && !c.struckGround && c.t >= c.def.ground) { c.struckGround = true; if (this.P.grounded) this.strike(0.45, 'bashed'); }
  }

  // ---------------------------------------------------------------- per frame
  update(dt, inp) {
    const P = this.P, M = this.moves;
    if (this.slam) { this.slamUpdate(dt); return; }
    if (this.charge >= 0) {
      this.charge += dt; this.chargeT += dt;
      this.tool.model.setInk(Math.max(this.tool.model.ink, Math.min(1, this.charge / SLAM.full)));
      if (!inp.isDown('Mouse0')) this.release();
      return;
    }
    M.update(dt, inp, { allow: P.techs.active?.id !== 'swim' });
    this.held = inp.isDown('Mouse0') && this.held >= 0 ? this.held + dt : -1;
    // held through a blow, once it is striking: on the ground the bristles saturate (the load), in the air it goes up and gathers
    const c = M.cur;
    if (c && (c.kind === 'ground' || c.kind === 'air') && this.held >= SLAM.hold && c.t >= (c.def.track?.strike[0] ?? 0)) {
      M.cancel(); this.held = -1;
      if (P.grounded && this.tool.load) this.tool.load.begin();
      else { this.charge = 0; this.chargeT = 0; sfx.brushCharge?.(); }
    }
  }

  /** Always (the flick's throw runs while the load is worked, too). */
  tick(dt) {
    if (this.flickT < 0) return;
    const t0 = FLICK.from + this.flickT * FLICK.rate;
    this.flickT += dt;
    const t1 = FLICK.from + this.flickT * FLICK.rate;
    if (t0 < FLICK.at && t1 >= FLICK.at) { this.onFlick?.(); this.onFlick = null; }
    if (t1 >= FLICK.end) this.flickT = -1;
  }
  /** RMB tapped (paid for already): the throw, and `onRelease` at the top of it. */
  startFlick(onRelease) { this.flickT = 0; this.onFlick = onRelease; }

  // ---------------------------------------------------------------- the slams
  /** Let go of a charge: it comes down. */
  release() {
    const P = this.P, g = this.game;
    const k = THREE.MathUtils.clamp(this.charge / SLAM.full, 0, 1);
    this.charge = -1;
    if (k < 0.25 || !g.lachryma.spend(SLAM.cost, 'brushslam')) { sfx.fizzle?.(); return; }
    const air = !P.grounded, f = this.aimDir(_b);
    P.bodyYaw = Math.atan2(f.x, f.z); // (it comes down where they are looking, or on what they are locked to)
    const s = (this.slam = { S: air ? SLAM.air : SLAM.ground, t: 0, power: 0.6 + 0.8 * k, air, struck: false, flicked: false, wait: 0, yaw: P.bodyYaw, phase: air ? 'wind' : 'play' });
    s.whole = this.carry(s);
    if (air && !s.whole) { s.phase = 'fall'; s.t = s.S.hold; P.vel.y = Math.min(P.vel.y, -16); P.impulse(_a.set(0, -6, 0), 'brush'); } // (nothing to carry them: straight down)
    sfx.brushSwing?.(1.8);
    g.events?.emit('brush.swing', { n: 3, slam: true, air });
  }

  /** The slam owns the step (Launch, as the engine's whole-body moves do): the ground slam stands, the air slam winds up hanging, falls,
   *  and plays on from where they land. False when something else has the body (then it is the arms' only). */
  carry(s) {
    const P = this.P, L = P.techs.get('launch'), S = s.S;
    if (!L || (P.techs.active && P.techs.active !== L)) return false;
    s.tag = 'club.slam';
    L.go(_a.set(s.air ? P.vel.x * 0.2 : 0, s.air ? Math.max(0, P.vel.y) * 0.3 : 0, s.air ? P.vel.z * 0.2 : 0), {
      time: s.air ? 6 : (S.end - s.t) / S.rate + 0.02, gravity: s.air ? 0.12 : 1, drag: 0, tag: s.tag, yaw: s.yaw, face: true, until: 'time', endSpeed: 2,
      clip: S.clip, clipMap: () => s.t,
      drive: (vel) => {
        if (this.slam !== s) return;
        if (s.phase === 'fall') { vel.x *= 0.9; vel.z *= 0.9; vel.y = -S.speed; }
        else if (s.phase === 'wind') { vel.x *= 0.9; vel.z *= 0.9; }
        else { vel.x = 0; vel.z = 0; }
      },
      onEnd: () => { if (this.slam === s) this.slam = null; },
    });
    return true;
  }

  slamUpdate(dt) {
    const s = this.slam, S = s.S, P = this.P;
    if (s.phase === 'wind') { s.t += dt * S.rate; if (s.t >= S.hold) { s.t = S.hold; s.phase = 'fall'; } }
    else if (s.phase === 'fall') {
      s.wait += dt;
      if (P.grounded || s.wait > 2.5) this.landSlam(s);
    } else s.t += dt * S.rate;
    if (!s.flicked && s.t >= S.flick && s.phase === 'play') { s.flicked = true; this.flick(1.6); }
    if (!s.struck && s.t >= S.strike && s.phase === 'play') { s.struck = true; this.strike(s.air ? s.power * (1 + Math.min(0.6, s.wait * 0.5)) : s.power, 'slam', true); }
    if (s.t >= S.end) this.endSlam();
  }

  /** The air slam meets the ground: the rest of the clip, standing. */
  landSlam(s) {
    s.phase = 'play';
    this.P.landed = Math.max(this.P.landed || 0, 10);
    const L = this.P.techs.get('launch');
    if (L?.active && L.o?.tag === s.tag) { L.o.time = L.t + (s.S.end - s.t) / s.S.rate + 0.02; L.o.gravity = 1; }
  }

  endSlam() {
    const s = this.slam; this.slam = null;
    const L = this.P.techs.get('launch');
    if (s?.tag && L?.active && L.o?.tag === s.tag) { L.o.onEnd = null; L.o.time = 0; }
    this.trail?.gap();
  }

  /** The head strikes the ground: a ring that breaks what is near and throws what is not, and a pool of slip where it hit. */
  strike(power, cause, big = false) {
    const g = this.game, P = this.P, m = this.tool.model;
    m.group.updateMatrixWorld(true);
    m.headWorld(_p);
    // where it strikes: in FRONT of them, at the brush's reach, the way they face (the head says how high, the facing says where)
    const fwd = _e.set(Math.sin(P.bodyYaw), 0, Math.cos(P.bodyYaw));
    _p.set(P.pos.x, _p.y, P.pos.z).addScaledVector(fwd, SLAM.reach);
    const down = g.physics.raycast(_a.copy(_p).setY(Math.max(_p.y, P.pos.y) + 0.6), _b.set(0, -1, 0), 2.6, P.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    const at = down ? down.point.clone() : _p.clone().setY(P.pos.y);
    const R = SLAM.radius * power * (big ? 1 : 0.7);
    // a shove, not a blast: what is near is thrown, and what breaks is broken by where it lands
    const c0 = at.clone().setY(at.y + 0.3), B = g.breakables;
    for (const ent of [...B.items]) {
      if (!ent.alive || ent.def?.trial || ent.def?.hang) continue;
      const t = ent.body.translation();
      if (_a.set(t.x, t.y, t.z).distanceTo(c0) > R) continue;
      B.instigate(ent, 'courier'); B.push(ent.body, c0, R, 7 * power);
    }
    for (const s of [...B.slices, ...B.debris]) if (s.body?.isValid?.()) B.push(s.body, c0, R, 7 * power);
    for (const cl of [...g.clappers.list]) {
      if (!cl.alive) continue;
      const d = cl.pos.distanceTo(c0);
      if (d > R * 1.3) continue;
      g.clappers.knock(cl, cl.pos.clone().sub(c0).setY(0).normalize().multiplyScalar(7 * power * (1 - d / (R * 1.3))).setY(4 + 2 * power));
      if (big && d < R * 0.6) g.clappers.stun(cl, 2.5, g.shells.glowOutline, g.shells.xray);
    }
    g.techs?.get('slam')?.ring(at, R);
    if (down) g.shells?.addPool(down.point, down.normal, true);
    const n = big ? 22 : 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + simRand() * 0.3;
      const v = _c.set(Math.cos(a), 0, Math.sin(a)).multiplyScalar(3 + simRand() * 4 * power).setY(2.5 + simRand() * 3);
      g.shells?.addDroplet(at.clone().setY(at.y + 0.2), v.clone(), 0.03 + simRand() * 0.04, true);
    }
    P.shake = Math.max(P.shake, (big ? 0.55 : 0.3) * power);
    P.fovPunch = Math.max(P.fovPunch || 0, big ? 8 : 4);
    g.time.pulse('brushslam', 0.06, big ? 0.09 : 0.05, { release: 0.15 });
    sfx.brushSlam?.(power);
    g.events?.emit('brush.slam', { power: +power.toFixed(2), air: !!this.slam?.air, big, by: 'courier' });
  }

  /** Slip off the bristles, flung the way the head is moving (Splatoon's flick). */
  flick(k) {
    const g = this.game, m = this.tool.model;
    if (!g.shells) return;
    m.tipWorld(_p);
    const v = this.tipVel.lengthSq() > 4 ? _a.copy(this.tipVel).normalize() : this.P.lookDir(_a);
    const speed = 7 + 3 * k;
    for (let i = 0; i < 6 + 4 * k; i++) {
      const d = _b.copy(v).add(randDir(simRand, _c).multiplyScalar(0.28)).normalize().multiplyScalar(speed * (0.7 + simRand() * 0.5));
      d.y += 2;
      g.shells.addDroplet(_p.clone(), d.clone(), 0.03 + simRand() * 0.035, true);
    }
  }

  /** The loose pieces the head passes through (by its segment: they are small and many), batted about. */
  bat() {
    const g = this.game, P = this.P, c = this.moves.cur, B = g.breakables;
    if (!c?.def.hit || !c.def.track) return;
    const s = c.def.track.strike;
    if (c.t < s[0] - 0.05 || c.t > s[1] + 0.05) return;
    this.tool.model.headSegment(_a, _b);
    const dir = this.tipVel.lengthSq() > 1 ? _e.copy(this.tipVel).normalize() : P.lookDir(_e);
    for (const list of [B.slices, B.shards]) for (const p of list || []) {
      if (!p.body?.isValid?.() || this.moves.hit.has(p)) continue;
      const t = p.body.translation();
      _p.set(t.x, t.y, t.z);
      if (_p.distanceToSquared(P.pos) > 25 || segDist(_a, _b, _p) > HEAD_R + 0.15) continue;
      this.moves.hit.add(p);
      B.instigate(p, 'courier');
      g.physics.kick(p.body, dir.clone().setY(Math.max(0.4, dir.y)).multiplyScalar(p.body.mass() * 6 * (c.def.hit.power ?? 1)));
    }
  }

  // ---------------------------------------------------------------- what is drawn
  /** After the brush is placed for the frame: the head's velocity (the flick, the hair's lag), the ribbon, the loose pieces. */
  afterHands(dt) {
    const m = this.tool.model;
    m.tipWorld(_p);
    if (this.hasPrev && dt > 1e-4) this.tipVel.subVectors(_p, this.tipPrev).divideScalar(dt).clampLength(0, 60);
    else this.tipVel.set(0, 0, 0);
    if (!Number.isFinite(this.tipVel.x + this.tipVel.y + this.tipVel.z)) this.tipVel.set(0, 0, 0);
    this.tipPrev.copy(_p); this.hasPrev = true;
    const s = this.slam;
    if (s && this.trail) {
      if (s.phase === 'play' && s.t >= s.S.strike - 0.12 && s.t <= s.S.strike + 0.03) { m.headSegment(_a, _b); this.trail.power = 2.4; this.trail.push(_a, _b); }
      else this.trail.gap();
    } else this.moves.afterHands(dt);
    if (this.moves.cur) this.bat();
  }

  /** The first-person arc for what is playing: { arc, u } (tools/viewmodel.js). */
  fpArc() {
    if (this.charge >= 0) return { arc: 'raise', u: Math.min(1, this.charge * 4) };
    const s = this.slam;
    if (s) return { arc: 'over', u: s.phase === 'play' ? arcAt(s.t, [s.S.strike - 0.15, s.S.strike], s.S.end) : 0.25 };
    return this.moves.fpArc();
  }

  /** The clip layer ({ pose, w }) over the stance: an arms-only slam, the charge, a blow, the flick, the load. `this.legs` says which clip
   *  stands under an own pose (for the legs while they stand: tools/toolbody.js). */
  pose(C, out, dt = 1 / 60) {
    const L = this.tool.load;
    this.loadW = THREE.MathUtils.damp(this.loadW, L?.busy ? 1 : 0, 10, dt);
    this.workW = THREE.MathUtils.damp(this.workW, L?.working ? 1 : 0, 6, dt);
    if (L?.busy || this.loadW > 0.01) this.loadT += dt; else this.loadT = 0;
    this.legs = null;
    const s = this.slam;
    if (s) {
      if (s.whole) return null; // (the slam has the whole body: Launch poses it)
      C.sample(s.S.clip, s.t, out, false);
      this.legs = { clip: s.S.clip, t: s.t };
      return { pose: out, w: 1 - smooth(s.t, s.S.end - 0.25, s.S.end) };
    }
    if (this.charge >= 0) {
      C.sample(SLAM.charge, this.chargeT, out, true); // (up and back, and gathering)
      this.legs = { clip: SLAM.charge, t: this.chargeT, loop: true };
      return { pose: out, w: 1 };
    }
    const m = this.moves.pose(C, out);
    if (m) return m;
    if (this.flickT >= 0) {
      const t = FLICK.from + this.flickT * FLICK.rate;
      C.sample(FLICK.clip, t, out, false);
      return { pose: out, w: Math.min(1, this.flickT / 0.06) * (1 - smooth(t, FLICK.end - 0.2, FLICK.end)) };
    }
    if (this.loadW > 0.01) {
      C.sample(LOAD.fill, this.loadT, out, true);
      if (this.workW > 0.01) C.blend(out, C.sample(LOAD.work, this.loadT, (this.workBuf ||= C.pose()), true), this.workW);
      this.legs = { clip: this.workW > 0.5 ? LOAD.work : LOAD.fill, t: this.loadT, loop: true };
      return { pose: out, w: this.loadW };
    }
    return null;
  }

  /** What is playing now, for the crossfade between two of them (tools/toolbody.js). */
  get playKey() { return this.slam || (this.charge >= 0 ? 'charge' : this.moves.cur || (this.flickT >= 0 ? 'flick' : this.tool.load?.busy ? 'load' : null)); }
}
