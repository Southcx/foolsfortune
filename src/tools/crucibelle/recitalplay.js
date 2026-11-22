// ---------------------------------------------------------------------------------------
// THE RECITAL'S PLAY (plain names; South, 2026-11-22: "make it more fun/suited for combat ... feel like a live concert and jamming
// out"): what the combat recital (tools/crucibelle/recital.js) does in a fight besides the plain strum, all of it judged on the music's
// beat (the bell's clock: crucibelle.js grid(), now(), offBeat(), WINDOW). Four moves:
//   - A LICK (1 to 5, 6 to 0): a note played on the beat throws a lick's bolt, a small ball of sound, out of the amp's mouth at the foe:
//     the lock-on's target if it holds a creature, else the nearest in front within reach. It flies in the note's colour (DEGREE_COLOR),
//     homing, and lands a light blow and a little stagger; the upper register's (6 to 0) is quicker and lighter. Off the beat the note
//     still sounds, and no bolt flies.
//   - THE STRUM CHAIN (LMB): strums on the beat, each no more than a beat (and the window) after the last, step a chain 1 to 4, the cone
//     wider, longer and harder a step (Guitar Hero's multiplier); the fourth is THE WINDMILL, the chord rung all round (Pete Townshend's
//     arm), and the chain starts over. A strum off the beat, or a beat let pass, drops it.
//   - FEEDBACK (LMB held past a strum): the held chord left to howl through the amp: a beam of sound out of the amp's mouth along the
//     aim, short, striking what stands in it on every beat, draining a little Lachryma a real second; let go, or the pool dry, it stops.
//   - THE ROCKSTAR MOMENT (the fever's peak, in the recital): the Courier down on their knees, leaning back into the chord (a knee slide
//     where they stand: the capsule never moves; the core movement is the gold standard), the stage's pyro and its lights in the film's
//     colours, about 1.5 real s.
// Every blow goes through game.creatures.strike with the strum's own damage ('bashed', by the courier), every stun through game.stun.
// The numbers are one table, RECITAL_PLAY, proposed to Dovina (docs/handoffs/dovina/2026-11-22-from-calissa-recital-numbers.md).
// Events: crucibelle.lick { degree, octave, hit, by } (as a bolt lands or fades), crucibelle.strum { onBeat, hits, chain, by },
// crucibelle.feedback { on, by }, crucibelle.rockstar { by }. The looks are vfx/recitallooks.js's; the sounds are Wanda's (the guitar
// voice their placeholder: docs/handoffs/wanda/2026-11-22-from-calissa-recital-sounds.md).
//
// Prior art: Brütal Legend (the guitar's solos thrown from the amp, Eddie's power slide), Guitar Hero (the streak's multiplier, star
// power's crowd), Hi-Fi Rush (every hit on the beat, a combo's finisher on the bar), Devil May Cry 3's Nevan (bats of sound thrown at
// the nearest foe, the guitar's held riff a beam), the Who's windmill, Jimi Hendrix's feedback held off the stack, Chuck Berry's
// knee slide and every arena show's pyro on the drop.
//
//   new RecitalPlay(recital)   .note(d, octave, on)   .strum(on, t, G) -> { chain, windmill, power, cone, range, stun }
//   .hold(down, dt)   .rockstar()   .update(dt)   .end()   .bolts   .chain   .feedbackOn   .rockT   .windT   RECITAL_PLAY
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DEGREE_COLOR } from './songs.js';

/** The recital's numbers (proposals: Dovina's to rule). Distances in metres, times in real seconds, power in creatures.strike's units. */
export const RECITAL_PLAY = {
  lick: { reach: 14, cone: 0.75, speed: 24, speedHigh: 32, power: 0.35, powerHigh: 0.25, stun: 0.08, life: 1.1, land: 0.45 },
  chain: { range0: 8, cone0: 0.9, stun0: 0.25, max: 4, gap: 1.0, slack: 0.17, cone: 0.16, range: 1.0, power: 0.22, windmill: { range: 7, power: 1.9, stun: 0.5 } },
  feedback: { after: 0.35, range: 10, width: 1.3, power: 0.3, stun: 0.06, drain: 4 },
  rockstar: { dur: 1.5 },
};
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();

export class RecitalPlay {
  constructor(recital) {
    this.r = recital; this.tool = recital.tool; this.game = recital.game;
    this.bolts = []; this.chain = 0; this.lastStrum = -99; this.feedbackOn = false; this.heldT = 0; this.tickBeat = -1;
    this.rockT = 0; this.windT = 0; this.held = false;
  }

  /** The foe a lick is thrown at: the lock-on's creature, else the nearest in front within reach. */
  target() {
    const g = this.game, P = this.tool.P, R = RECITAL_PLAY.lick, L = g.lock?.target;
    if (L?.type === 'creature' && L.ref?.alive && !L.ref.ally && L.ref.pos.distanceTo(P.pos) < R.reach + 4) return L.ref;
    const f = P.lookDir(_d).setY(0).normalize(), cos = Math.cos(R.cone);
    for (const c of g.creatures?.near?.(P.pos, R.reach) || []) {
      if (c.ally || !c.alive || c.aberrant) continue;
      _a.copy(c.pos).sub(P.pos).setY(0); const d = _a.length();
      if (d < 0.01 || _a.multiplyScalar(1 / d).dot(f) >= cos) return c;
    }
    return null;
  }
  aimAt(c, out) { return out.set(c.pos.x, c.pos.y + (c.height ?? 1.2) * 0.55, c.pos.z); }

  /** A note: on the beat, a lick's bolt out of the amp at the foe (octave > 0: the upper register's, quicker and lighter). */
  note(d, octave, on) {
    if (!on) return null;
    const c = this.target(); if (!c) return null;
    const R = RECITAL_PLAY.lick, high = octave > 0, from = this.r.mouth(new THREE.Vector3());
    const dir = this.aimAt(c, _a).sub(from).normalize();
    const b = { pos: from, vel: dir.multiplyScalar(high ? R.speedHigh : R.speed), c, degree: d, octave, color: DEGREE_COLOR[d - 1], t: 0, high, done: false };
    this.bolts.push(b);
    return b;
  }

  /** LMB's strum on the beat or off it: the chain stepped (or dropped) and what this strum rings with. */
  strum(on, t, G) {
    const C = RECITAL_PLAY.chain, gapOk = t - this.lastStrum <= G.spb * C.gap + C.slack;
    this.chain = on ? (gapOk ? Math.min(C.max, this.chain + 1) : 1) : 0;
    if (on) this.lastStrum = t;
    this.heldT = 0; this.held = true;
    const windmill = this.chain >= C.max, k = Math.max(0, this.chain - 1);
    const out = windmill
      ? { chain: this.chain, windmill, cone: Math.PI, range: C.windmill.range, power: C.windmill.power, stun: C.windmill.stun }
      : { chain: this.chain, windmill, cone: C.cone0 + C.cone * k, range: C.range0 + C.range * k, power: 1 + C.power * k, stun: C.stun0 * (1 + 0.25 * k) };
    if (windmill) { this.windT = 1e-3; this.chain = 0; }
    return out;
  }

  /** LMB held: past a strum by `after`, the feedback's beam comes on; let go, it stops. */
  hold(down, dt) {
    if (!down) { this.held = false; if (this.feedbackOn) this.feedback(false); return; }
    if (!this.held) return;
    this.heldT += dt;
    if (!this.feedbackOn && this.heldT > RECITAL_PLAY.feedback.after) this.feedback(true);
  }
  feedback(on) {
    if (this.feedbackOn === on) return;
    this.feedbackOn = on; this.tickBeat = -1;
    this.game.events?.emit('crucibelle.feedback', { on, by: 'courier' });
  }

  /** The fever's peak in the recital: the rockstar moment. */
  rockstar() {
    if (this.rockT > 0) return;
    this.rockT = 1e-3;
    this.game.events?.emit('crucibelle.rockstar', { by: 'courier' });
  }

  /** The feedback's beam: what stands in it struck on a beat. */
  feedbackTick(G) {
    const g = this.game, T = this.tool, P = T.P, F = RECITAL_PLAY.feedback, dir = P.lookDir(_d).setY(0).normalize();
    let n = 0;
    for (const c of g.creatures?.near?.(P.pos, F.range + 1) || []) {
      if (c.ally || !c.alive) continue;
      _a.copy(c.pos).sub(P.pos).setY(0); const along = _a.dot(dir);
      if (along < 0 || along > F.range || _b.copy(_a).addScaledVector(dir, -along).length() > F.width + (c.radius ?? 0.4)) continue;
      g.creatures.strike(c, this.aimAt(c, new THREE.Vector3()), dir.clone(), F.power * (1 + T.fever * 0.5), 'bashed', 'courier');
      g.stun?.add(c, F.stun, { by: 'courier', cause: 'feedback' }); n++;
    }
    // (the wail on the beat: the guitar voice retriggered an octave up, Wanda's placeholder)
    const sc = T.scaleNow(); T.guitarVoice(G.root + sc[0] + 12, 0.5, G.spb * 0.9); T.guitarVoice(G.root + sc[3] + 12, 0.35, G.spb * 0.9);
    this.r.guitar.pluck(0, 0.7); this.r.guitar.pluck(3, 0.7);
    return n;
  }

  update(dt) {
    const g = this.game, T = this.tool, R = RECITAL_PLAY.lick;
    // the bolts: homing on their foe, landing within `land`, gone at `life`
    for (const b of this.bolts) {
      b.t += dt;
      const alive = b.c?.alive;
      if (alive) { const want = this.aimAt(b.c, _a).sub(b.pos), dist = want.length(), sp = b.vel.length(); b.vel.lerp(want.multiplyScalar(sp / Math.max(dist, 1e-3)), 1 - Math.exp(-dt * 10)).setLength(sp);
        if (dist < R.land + (b.c.radius ?? 0.3)) { this.land(b); continue; } }
      b.pos.addScaledVector(b.vel, dt);
      if (b.t > R.life || !alive) { b.done = true; g.events?.emit('crucibelle.lick', { degree: b.degree, octave: b.octave, hit: false, by: 'courier' }); }
    }
    if (this.bolts.some((b) => b.done)) this.bolts = this.bolts.filter((b) => !b.done);
    // the feedback: Lachryma drained a real second, a tick on each beat
    if (this.feedbackOn) {
      if (!(g.lachryma?.drain?.(RECITAL_PLAY.feedback.drain * dt, 'feedback') > 0)) { this.feedback(false); g.log?.say('warn', 'Your mind is too dry to hold the feedback.', { key: 'feedback.dry', throttle: 3 }); }
      else { const G = T.grid(), beat = Math.floor((T.now() - G.t0) / G.spb); if (beat !== this.tickBeat) { this.tickBeat = beat; this.feedbackTick(G); } }
    }
    if (this.rockT > 0) { this.rockT += dt; if (this.rockT > RECITAL_PLAY.rockstar.dur) this.rockT = 0; }
    if (this.windT > 0) { this.windT += dt; if (this.windT > 0.5) this.windT = 0; }
  }

  land(b) {
    const g = this.game, T = this.tool, R = RECITAL_PLAY.lick;
    b.done = true;
    const dir = b.vel.clone().setY(0).normalize();
    const hit = !!g.creatures?.strike?.(b.c, b.pos.clone(), dir, (b.high ? R.powerHigh : R.power) * (1 + T.fever * 0.5), 'bashed', 'courier');
    if (hit) g.stun?.add(b.c, R.stun, { by: 'courier', cause: 'lick' });
    g.events?.emit('crucibelle.lick', { degree: b.degree, octave: b.octave, hit, at: b.pos.clone(), by: 'courier' });
  }

  /** The recital ended: the bolts dropped, the feedback stopped, the moments let go. */
  end() { this.bolts.length = 0; this.feedback(false); this.held = false; this.chain = 0; this.rockT = 0; this.windT = 0; }
}
