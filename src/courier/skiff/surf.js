// ---------------------------------------------------------------------------------------
// THE SURF RIDE (plain name, South's ask 2026-11-06: "expand the solar skiff racing module to encapsulate wave rider ... and surfing
// mechanics, and especially the feeling of going through a wave barrel"; docs/ref/WAVE-RIDING.md 2): the Solar Skiff on the Raceway
// park's wave pool. Every rule here is a MODIFIER on the board's own ride (DESIGN.md 22): off the pool `step` does nothing and the board
// is exactly as before. The skiff calls it at three small hooks (courier/skiff/skiff.js): the water's normal and its rise into the ride's
// slope and height follow (`rise`), W given to the pump while on the face (`ownsW`), and `step` once the board has moved.
//
//   ON THE WATER the board's own speed is relative to it: the water's carry (raceway.carry) moves its place each step and is never
//   folded into its velocity; leaving the water it keeps the carry it had, easing out (a launch off the face takes the wave's way with it).
//   THE POCKET'S PUSH: the wave's power along the crest toward the shoulder (wavepool.js push), and the tube's draw while covered.
//   THE PUMP: on the face the sail furls itself and W is the pump: each press in its window after the last (a rhythm) pushes the board on,
//   more on a steeper face (Surf World Series, Barton Lynch Pro Surfing: "use the wave's power"). Off the face W is the sail again.
//   TURNS READ AS TRICKS (into the trick combo, courier/skiff/combo.js): a bottom turn (down the face, turned back up it low), a top turn
//   or a snap (up it, turned back down high; a snap is a fast one), a cutback (turned back toward the pocket from the shoulder), a floater
//   (ridden over the crest on the water). An air off the lip; a trick off a swell's crest pays a small push (Mario Kart's trick boost).
//   THE BARREL: S held is the stall (the skiff's own brake: the board falls back under the lip). Covered, the tube's clock runs and its
//   balance wobbles with the height off the ideal and the foam ball's nearness; A / D answer it (Treyarch's Kelly Slater game's meter, 2002; shown
//   on the grind's balance mark, vfx/grindbalancemark.js). Out of the mouth = made: the spit's push and the combo's big link. Too high under
//   the lip (or the needle off its top): the lip lands on you, a wipeout (skiff.bail { why: 'lip' }); too deep (or off its foot): the foam
//   ball takes you (why: 'closeout'). The lip passing over eases game time a breath (core/time.js pulse).
//   THE SUBMARINE (Wave Race 64's): landing nose down and fast on the pool's water, or with S held as you land, dives the board under;
//   it slows, then bursts out with a push.
// Events (each with `by`): skiff.surf { on }, skiff.surf.pump { steep }, skiff.surf.turn { kind: bottom | top | snap | cutback | floater |
// air | crest }, skiff.tube.enter, skiff.tube.exit { seconds, made }, skiff.submarine; a wipeout is the skiff's skiff.bail. The ledger and
// achievements are Dovina's (asked in docs/handoffs/dovina/); the log's lines feedback/tracking/surf.js; the look's numbers are read here
// (`cover`, `k`, `hr`, `lipOver`, `tube`, `balance`, `stall`, `spit`, `light`, `sub`) by vfx/waves/ and the barrel cam (barrelcam.js).
//
// Prior art: Treyarch's Kelly Slater game, 2002 (the tube's balance meter), TransWorld Surf (tube time), Surf World Series and Barton Lynch Pro
// Surfing (pump, pocket, foam ball, the spit), Wave Race 64 (the water's momentum, the submarine), SSX Tricky (tricks pay speed), Mario
// Kart 8 (a trick off a ramp's lip pays a push).
//
//   skiff.surf = new SurfRide(skiff)   .rise() -> m/s   .ownsW   .step(dt)   .frame(dt) (per frame: the camera, the look's easing)   SURF
// ---------------------------------------------------------------------------------------
import { COMBO } from './combo.js';
import { HandDrag } from './handdrag.js';
import { BarrelCam } from './barrelcam.js';
import { WAVE } from '../../world/raceway/surf/wavepool.js';

/** The numbers. push: m/s^2 along the crest at the pocket's full power; draw: the tube's, at full cover. pump: m/s a press at the steepest
 *  face (and its least share), the window after the last press (real s), the face's steepness that counts (1 - n.y from .. to). turn:
 *  rad/s that begins one, below which it ends, the least turned (rad), a snap's rate, a kind's cooldown (real s). floater: m/s along the
 *  crest. tube: cover to be in it, to be out of it, real s out before it ends, the least tube time that counts, the ideal height (a share
 *  of H), the balance's gain, A / D's answer, its wobble, its pull home; too high (hr) with the lip over you, too deep (k); the spit's push
 *  [m/s, s, kick now]. sub: the fall (m/s) and speed that dive, the depth (m), the time under (s), its drag, the burst [m/s, s, kick] and
 *  its lift (m/s). crest: a swell's trick's push. carryAir: the carry's ease a real second off the water. */
export const SURF = {
  push: 12, draw: 6, seat: 0.35, // seat: the deck's height over the pool's water (m): a board sits in the water, where on the sand it hovers (skiff cfg.hover + 0.1)
  pump: { add: 2.8, least: 0.35, win: [0.22, 0.95], steep: [0.06, 0.4] },
  turn: { rate: 1.1, end: 0.5, min: 0.7, snap: 2.6, cool: 0.8 },
  floater: { speed: 8 },
  tube: { cover: 0.45, out: 0.2, grace: 0.18, min: 0.6, ideal: 0.38, gain: 2.0, hold: 2.6, wobble: 0.9, home: 0.4, lip: 0.7, deep: 0.94, spit: [9, 1.2, 4] },
  sub: { fall: -9, speed: 16, depth: 1.4, t: 0.7, drag: 1.6, burst: [10, 1.0, 5], up: 6 },
  crest: [4, 0.6, 1.5],
  carryAir: 0.6,
  rail: 9, // (the rail's bite on the face: the board's slide across its heading held this hard, /s; the stall lets a third through)
};
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const FACE_ZONES = { pocket: 1, barrel: 1, shoulder: 1 };

export class SurfRide {
  constructor(sk) {
    this.sk = sk; this.c = { x: 0, z: 0 }; this.n = { x: 0, y: 1, z: 0 }; this.on = false; this.ownsW = false;
    this.reset();
    this.cam = new BarrelCam(this); this.drag = new HandDrag(this); // (the stall's hand in the face: handdrag.js)
    sk.game?.systems?.add?.('fx', (dt) => this.frame(dt), { clock: 'raw', name: 'surfRide' }); // (each frame, ridden or not: the barrel cam freed, the dip and the spit eased out)
  }
  get game() { return this.sk.game; }
  /** The Raceway's wave pool, while the board is at the Raceway. */
  get pool() { const R = this.sk.dunes; return R?.active ? R.surf || null : null; }
  reset() {
    this.c.x = 0; this.c.z = 0; this.tube = null; this.sub = null; this.turn = null; this.launch = null; this.cool = {};
    this.cover = 0; this.k = 0; this.hr = 0; this.lipOver = -99; this.balance = 0; this.stall = false; this.light = 0;
    this.pumpT = 9; this.wWas = false; this.h0 = this.sk.heading || 0; this.d0 = null; this.wasAir = false; this.fallVy = 0; this.onFace = false;
    this.spit = this.spit || 0;
  }

  /** The surface's own rise under the board (m/s), added to the skiff's height follow (its vyT): zero off the pool. */
  rise() { const S = this.pool, P = this.sk.P; return S && S.inPool(P.pos.x, P.pos.z) ? S.riseAt(P.pos.x, P.pos.z) : 0; }

  /** Once the board has moved this step (the ride's fixed step). */
  step(dt) {
    const sk = this.sk, P = sk.P, g = this.game, S = this.pool;
    const over = !!S && S.inPool(P.pos.x, P.pos.z);
    if (over !== this.on) { this.on = over; g.events?.emit('skiff.surf', { on: over, by: 'courier' }); if (!over) { this.reset(); this.ownsW = false; } }
    if (!over) return;
    const f = S.frame(P.pos.x, P.pos.z), wet = !!sk.onWater && !sk.air, inp = P.input;
    // the water's carry: moving the board's place, never its own velocity; off the water what it had eases out
    if (wet) S.carry(P.pos.x, P.pos.z, this.c);
    else if (sk.air) { const e = Math.exp(-SURF.carryAir * dt); this.c.x *= e; this.c.z *= e; }
    else { this.c.x = 0; this.c.z = 0; }
    P.pos.x += this.c.x * dt; P.pos.z += this.c.z * dt;
    // on the face: the sail furls itself and W is the pump
    const onFace = (this.onFace = wet && f.H > 3 && f.d > -0.5 && f.d < f.F && !!FACE_ZONES[f.zone]);
    this.ownsW = onFace;
    if (onFace) sk.L = Math.max(0, sk.L - dt / sk.cfg.furlTime);
    // the rail's bite: on the face the board's slide across its own heading (the fall line's pull, the base ride's vl) is held, as a
    // surfboard's rail holds a line across a wave; the stall lets some through, so a stall drops you back and down into the tube
    if (onFace) { const rx = -Math.cos(sk.heading), rz = Math.sin(sk.heading), vl = sk.v.x * rx + sk.v.z * rz, k = 1 - Math.exp(-SURF.rail * (this.stall ? 0.33 : 1) * dt); sk.v.x -= rx * vl * k; sk.v.z -= rz * vl * k; }
    // the pocket's push, and the tube's draw
    const pu = S.push(P.pos.x, P.pos.z), B = S.barrel(P.pos.x, P.pos.y - (sk.cfg.hover + 0.1), P.pos.z);
    this.cover = wet ? B.cover : 0; this.k = B.k; this.hr = B.hr; this.lipOver = B.lipOver;
    this.light = this.cover * (0.45 + 0.55 * clamp(1 - this.hr, 0, 1));
    if (wet && pu.k > 0) { const a = (SURF.push * pu.k + SURF.draw * this.cover * (1 - 0.5 * Math.abs(this.balance))) * dt; sk.v.x += pu.x * a; sk.v.z += pu.z * a; }
    // the stall: S under the lip (the skiff's own brake slows it: here only said, for the look's hand in the face)
    this.stall = onFace && inp.isDown('KeyS') && (f.zone === 'barrel' || f.zone === 'pocket');
    this.pump(dt, onFace, inp);
    this.turns(dt, f, wet);
    this.airs(f, inp);
    this.barrel(dt, f, wet);
    this.diving(dt);
  }

  /** W in rhythm on a steep face: a push each press in its window after the last. */
  pump(dt, onFace, inp) {
    const sk = this.sk, w = inp.isDown('KeyW'), press = w && !this.wWas; this.wWas = w;
    this.pumpT += dt;
    if (!onFace || !press) return;
    const Pm = SURF.pump, steep = clamp((1 - sk.n.y - Pm.steep[0]) / (Pm.steep[1] - Pm.steep[0]), 0, 1), gap = this.pumpT;
    this.pumpT = 0;
    if (steep <= 0 || gap < Pm.win[0]) return; // (mashed, or the face too flat to pump)
    const add = Pm.add * (Pm.least + (1 - Pm.least) * steep) * (gap <= Pm.win[1] ? 1 : 0.5); // (the first of a rhythm, half)
    sk.v.x += Math.sin(sk.heading) * add; sk.v.z += Math.cos(sk.heading) * add;
    this.game.events?.emit('skiff.surf.pump', { steep: +steep.toFixed(2), by: 'courier' });
  }

  /** The turns on the face, read as tricks; the floater over the crest. */
  turns(dt, f, wet) {
    const sk = this.sk, T = SURF.turn, rate = wrap(sk.heading - this.h0) / Math.max(1e-4, dt); this.h0 = sk.heading;
    for (const k in this.cool) this.cool[k] -= dt;
    const vx = sk.v.x, vz = sk.v.z, up = -(vx * f.travel.x + vz * f.travel.z), along = vx * f.crest.x + vz * f.crest.z, hrf = f.H > 0.5 ? clamp(f.h / f.H, 0, 1) : 0;
    if (wet && f.zone !== 'flat' && f.H > 3) {
      if (!this.turn && Math.abs(rate) > T.rate) this.turn = { acc: 0, t: 0, up0: up, along0: along, hr0: hrf, zone0: f.zone, s0: f.s, sign: Math.sign(rate) };
      const Tn = this.turn;
      if (Tn) { Tn.acc += rate * dt; Tn.t += dt; if (Math.abs(rate) < T.end || Math.sign(rate) !== Tn.sign || Tn.t > 1.6) { this.turn = null; this.judge(Tn, up, along); } }
      // the floater: over the crest on the water, along the wave
      const d0 = this.d0; this.d0 = f.d;
      if (d0 != null && d0 > 0 && f.d <= 0 && f.H > 8 && (f.zone === 'pocket' || f.zone === 'barrel') && Math.abs(along) > SURF.floater.speed) this.trick('floater');
    } else { this.turn = null; this.d0 = null; }
  }
  judge(Tn, up, along) {
    const T = SURF.turn; if (Math.abs(Tn.acc) < T.min) return;
    let kind = null;
    if (Tn.along0 > 4 && along < -1 && (Tn.zone0 === 'shoulder' || Tn.s0 > WAVE.pocket)) kind = 'cutback';
    else if (Tn.up0 < -2 && up > 2 && Tn.hr0 < 0.4) kind = 'bottom';
    else if (Tn.up0 > 2 && up < -1 && Tn.hr0 > 0.5) kind = Math.abs(Tn.acc) / Math.max(0.05, Tn.t) > T.snap ? 'snap' : 'top';
    if (kind) this.trick(kind);
  }
  /** A surf trick: said on the bus, linked into the combo (its own kind, so variety raises the multiplier). */
  trick(kind, points = COMBO.points.surf[kind]) {
    if ((this.cool[kind] || 0) > 0) return;
    this.cool[kind] = SURF.turn.cool;
    this.game.events?.emit('skiff.surf.turn', { kind, by: 'courier' });
    this.sk.combo.add(`surf.${kind}`, points);
  }

  /** Airs: off the lip, a trick in the air; off a swell's crest with a trick, a small push; and the submarine on landing. */
  airs(f, inp) {
    const sk = this.sk, P = sk.P, air = !!sk.air;
    if (air && !this.wasAir) this.launch = { lip: f.H > 5 && f.zone !== 'flat' && f.zone !== 'whitewater' && f.h > 0.5 * f.H, n0: sk.combo.n };
    if (!air && this.wasAir && this.launch && sk.phase === 'ride') {
      const L = this.launch, at = sk.airT || 0, Pt = COMBO.points.surf;
      if (L.lip && at > 0.35) this.trick('air', Pt.air + Pt.airT * at * at);
      else if (!L.lip && sk.combo.n > L.n0) { const [a, d, k] = SURF.crest; sk.kick(a, d, k); this.trick('crest'); }
      const speed = Math.hypot(sk.v.x, sk.v.z);
      const water = !!this.pool?.waterNormal(P.pos.x, P.pos.z, this.n); // (landed on the basin's water: the skiff calls it wet only from the next step)
      if (water && !this.sub && !(this.subWait > 0) && ((this.fallVy < SURF.sub.fall && speed > SURF.sub.speed) || (inp.isDown('KeyS') && speed > SURF.sub.speed * 0.6))) { // (once a dive: its own bob out of the dip is no new landing, and a held S needs way on)
        this.sub = { t: 0, depth: 0 };
        this.game.events?.emit('skiff.submarine', { by: 'courier' });
      }
      this.launch = null;
    }
    if (air) this.fallVy = P.vel.y;
    this.wasAir = air;
  }

  /** The submarine: under, slowed, then out with a push. */
  diving(dt) {
    const U = this.sub, sk = this.sk, P = sk.P, S = this.pool, D = S?.dip;
    this.subWait = Math.max(0, (this.subWait || 0) - dt);
    if (!U || !D) return;
    U.t += dt;
    const k = Math.exp(-SURF.sub.drag * dt); sk.v.x *= k; sk.v.z *= k;
    U.depth = Math.min(SURF.sub.depth, U.depth + dt * 6);
    D.x = P.pos.x; D.z = P.pos.z; D.depth = U.depth;
    if (U.t >= SURF.sub.t) {
      const [a, d, kk] = SURF.sub.burst; sk.kick(a, d, kk); P.vel.y += SURF.sub.up; this.sub = null; this.burst = 1; this.subWait = 1.0;
      this.sk.combo.add('surf.submarine', COMBO.points.surf.submarine);
    }
  }

  /** The tube: in, its clock and balance, out made or not, or wiped out. */
  barrel(dt, f, wet) {
    const sk = this.sk, g = this.game, X = SURF.tube;
    this.tubeWait = Math.max(0, (this.tubeWait || 0) - dt);
    if (!this.tube && wet && this.cover > X.cover && this.tubeWait <= 0) { this.tube = { t: 0, out: 0, lipped: false }; this.balance = 0; g.events?.emit('skiff.tube.enter', { by: 'courier' }); }
    const Tb = this.tube; if (!Tb) { this.balance *= Math.exp(-4 * dt); return; }
    Tb.t += dt; sk.combo.t = COMBO.link; // (the chain lives while the lip is over you)
    if (!Tb.lipped && this.cover > 0.5) { Tb.lipped = true; g.time?.pulse?.('surf.lip', 0.55, 0.22, { release: 0.3 }); } // (the lip passing over: a breath of game time)
    // the balance: off the ideal height (+ the lip's side), the foam ball's pull (- the deep side), a wobble growing deeper; A / D answer it
    const tt = sk.time || 0, err = X.gain * (this.hr - X.ideal) - 2 * Math.max(0, this.k - 0.55);
    const wob = X.wobble * (0.3 + this.k) * (Math.sin(tt * 2.3) * 0.6 + Math.sin(tt * 3.7 + 1.3) * 0.4);
    this.balance = clamp(this.balance + ((err + wob) - X.home * this.balance + X.hold * (sk.steer || 0)) * dt, -1.2, 1.2);
    // wiped out: the lip lands on you, or the foam ball takes you
    const underLip = f.zone === 'barrel' && this.k > 0.05 && f.d > 0 && f.d < f.F && this.hr > X.lip; // (up the face where the lip is thrown: it lands on you; the cover test stops counting you covered above 0.88 H, so it is asked of the wave, not of the cover)
    if (underLip || this.balance >= 1) return this.wipe('lip');
    if (this.k > X.deep || (f.zone === 'whitewater' && f.d > 0 && wet) || this.balance <= -1) return this.wipe('closeout');
    // out of it: made through the mouth, or out over the face or the back
    Tb.out = this.cover < X.out ? Tb.out + dt : 0;
    if (Tb.out < X.grace && wet) return;
    const along = sk.v.x * f.crest.x + sk.v.z * f.crest.z, made = Tb.t >= X.min && f.s > -3 && along > 0 && wet;
    this.tube = null;
    g.events?.emit('skiff.tube.exit', { seconds: +Tb.t.toFixed(2), made, by: 'courier' });
    if (made) { const [a, d, k] = X.spit; sk.kick(a, d, k); this.spit = 1; }
    if (Tb.t >= X.min) sk.combo.add('surf.tube', COMBO.points.surf.tube * Tb.t * (made ? COMBO.points.surf.made : 1));
  }
  wipe(why) {
    const sk = this.sk;
    if (this.tube) this.game.events?.emit('skiff.tube.exit', { seconds: +this.tube.t.toFixed(2), made: false, by: 'courier' });
    this.tube = null; this.balance = 0; this.tubeWait = 0.8; // (not back in at once: a wipeout in the bail's grace would re-enter every step)
    if ((sk.rideT || 0) > 0.5) sk.bail(why);
  }

  /** Each frame (real time): the barrel cam, the spit and the dip eased out, the dive let go if the ride ended under. */
  frame(dt) {
    this.spit = Math.max(0, this.spit - dt / 0.8); this.burst = Math.max(0, (this.burst || 0) - dt / 0.6);
    const S = this.sk.dunes?.surf, riding = this.sk.active && this.sk.phase === 'ride';
    if (!riding && (this.tube || this.sub)) { this.tube = null; this.sub = null; }
    if (S && !this.sub && S.dip.depth > 0) S.dip.depth = Math.max(0, S.dip.depth - dt * 4);
    if (!riding) { this.cover = 0; this.stall = false; }
    this.cam.update(dt); this.drag.ease(dt);
  }
}
