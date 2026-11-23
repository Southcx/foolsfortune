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
//     aim, short, striking what stands in it once a bar on its downbeat (no stun, no pluck: the chord rings on, it is never strummed again
//     while held), draining Lachryma a real second; let go, or the pool dry, it stops.
//   - HARMONY AND THE WHAMMY (RMB held; tools/crucibelle/harmony.js): a chord on the beat throws three bolts fanned, one a voice, each
//     HARMONY.share of a lick's blow; on the feedback, RMB is the whammy: the wail bent flat, the beam swept side to side twice a bar,
//     wider and dizzier (WHAMMY). crucibelle.whammy { on, by } as the bar goes down and comes back.
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
//   .hold(down, dt, bar)   .beamDir(out)   .wham (0..1)   .rockstar()   .update(dt)   .end()   .bolts   .chain   .feedbackOn   .rockT   .windT   RECITAL_PLAY
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DEGREE_COLOR } from './songs.js';
import { HARMONY, WHAMMY } from './harmony.js';

/** The recital's numbers (proposals: Dovina's to rule). Distances in metres, times in real seconds, power in creatures.strike's units. */
export const RECITAL_PLAY = {
  lick: { reach: 14, cone: 0.75, speed: 24, speedHigh: 32, power: 0.35, powerHigh: 0.25, stun: 0.08, life: 1.1, land: 0.45 },
  chain: { range0: 8, cone0: 0.9, stun0: 0.25, max: 4, gap: 1.0, slack: 0.17, cone: 0.16, range: 1.0, power: 0.22, windmill: { range: 7, power: 1.9, stun: 0.5 } },
  feedback: { after: 0.35, range: 10, width: 1.3, power: 0.45, stun: 0, every: 4, drain: 6 }, // (South, 2026-11-23: held LMB "just deletes enemies": one blow a bar, no stun, never a strum again)
  rockstar: { dur: 1.5 },
};
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();

export class RecitalPlay {
  constructor(recital) {
    this.r = recital; this.tool = recital.tool; this.game = recital.game;
    this.bolts = []; this.chain = 0; this.lastStrum = -99; this.feedbackOn = false; this.heldT = 0; this.tickBeat = -1;
    this.rockT = 0; this.windT = 0; this.held = false; this.wham = 0; this.whamOn = false;
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

  /** A note: on the beat, a lick's bolt out of the amp at the foe (octave > 0: the upper register's, quicker and lighter); a chord
   *  (harmony: [{ d, up }] x3), three bolts fanned, one a voice, each a share of the blow. */
  note(d, octave, on, chord = null) {
    if (!on) return null;
    const c = this.target(); if (!c) return null;
    const R = RECITAL_PLAY.lick, high = octave > 0, from = this.r.mouth(new THREE.Vector3());
    const dir = this.aimAt(c, _a).sub(from).normalize();
    const voices = chord || [{ d, up: octave }], fan = chord ? HARMONY.fan : 0;
    let first = null;
    voices.forEach((v, i) => {
      const yaw = (i - (voices.length - 1) / 2) * fan, cs = Math.cos(yaw), sn = Math.sin(yaw);
      const vd = new THREE.Vector3(dir.x * cs + dir.z * sn, dir.y, -dir.x * sn + dir.z * cs);
      const b = { pos: from.clone(), vel: vd.multiplyScalar(high ? R.speedHigh : R.speed), c, degree: v.d, octave, color: DEGREE_COLOR[v.d - 1], t: 0, high, done: false, k: chord ? HARMONY.share : 1, chord: !!chord };
      this.bolts.push(b); first ??= b;
    });
    return first;
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

  /** LMB held: past a strum by `after`, the feedback's beam comes on; let go, it stops. RMB on it (`bar`): the whammy, eased in. */
  hold(down, dt, bar = false) {
    const want = down && this.feedbackOn && bar ? 1 : 0;
    this.wham += (want - this.wham) * (1 - Math.exp(-dt * WHAMMY.ease));
    if (want !== +this.whamOn) { this.whamOn = !!want; this.game.events?.emit('crucibelle.whammy', { on: this.whamOn, by: 'courier' }); }
    if (!down) { this.held = false; if (this.feedbackOn) this.feedback(false); return; }
    if (!this.held) return;
    this.heldT += dt;
    if (!this.feedbackOn && this.heldT > RECITAL_PLAY.feedback.after) this.feedback(true);
  }
  /** The feedback beam's way along the ground: the aim, swept side to side by the whammy twice a bar (the looks read it too). */
  beamDir(out) {
    const T = this.tool, P = T.P; P.lookDir(out).setY(0).normalize();
    if (this.wham < 1e-3) return out;
    const G = T.grid(), bar = (T.now() - G.t0) / (G.spb * 4), yaw = WHAMMY.sweep * this.wham * Math.sin(bar * WHAMMY.per * Math.PI * 2);
    const cs = Math.cos(yaw), sn = Math.sin(yaw), x = out.x, z = out.z;
    return out.set(x * cs + z * sn, 0, -x * sn + z * cs);
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
    const g = this.game, T = this.tool, P = T.P, F = RECITAL_PLAY.feedback, W = this.wham, dir = this.beamDir(_d);
    const width = F.width * (1 + (WHAMMY.width - 1) * W), stun = (F.stun || 0.04) * (WHAMMY.stun - 1) * W, // (only the whammy dazes)
      power = F.power * (1 + (WHAMMY.power - 1) * W);
    let n = 0;
    for (const c of g.creatures?.near?.(P.pos, F.range + 1) || []) {
      if (c.ally || !c.alive) continue;
      _a.copy(c.pos).sub(P.pos).setY(0); const along = _a.dot(dir);
      if (along < 0 || along > F.range || _b.copy(_a).addScaledVector(dir, -along).length() > width + (c.radius ?? 0.4)) continue;
      g.creatures.strike(c, this.aimAt(c, new THREE.Vector3()), dir.clone(), power * (1 + T.fever * 0.5), 'bashed', 'courier');
      if (stun > 0.005) g.stun?.add(c, stun, { by: 'courier', cause: 'whammy' }); n++;
    }
    // (the wail swelling once a bar, held the bar long: the guitar voice an octave up, Wanda's placeholder; no pluck, so it never reads as a
    //  strum; the whammy bends it flat)
    const sc = T.scaleNow(), bend = WHAMMY.bend * W, len = G.spb * F.every * 0.95;
    T.guitarVoice(G.root + sc[0] + 12, 0.4, len, bend); T.guitarVoice(G.root + sc[3] + 12, 0.28, len, bend);
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
    // the feedback: Lachryma drained a real second, a blow on each bar's downbeat
    if (this.feedbackOn) {
      if (!(g.lachryma?.drain?.(RECITAL_PLAY.feedback.drain * dt, 'feedback') > 0)) { this.feedback(false); g.log?.say('warn', 'Your mind is too dry to hold the feedback.', { key: 'feedback.dry', throttle: 3 }); }
      else { const G = T.grid(), bar = Math.floor((T.now() - G.t0) / (G.spb * RECITAL_PLAY.feedback.every)); if (bar !== this.tickBeat) { const first = this.tickBeat < 0; this.tickBeat = bar; if (!first) this.feedbackTick(G); } } // (a bar's downbeat; the bar it came on in is the strum's)
    }
    if (this.rockT > 0) { this.rockT += dt; if (this.rockT > RECITAL_PLAY.rockstar.dur) this.rockT = 0; }
    if (this.windT > 0) { this.windT += dt; if (this.windT > 0.5) this.windT = 0; }
  }

  land(b) {
    const g = this.game, T = this.tool, R = RECITAL_PLAY.lick;
    b.done = true;
    const dir = b.vel.clone().setY(0).normalize();
    const hit = !!g.creatures?.strike?.(b.c, b.pos.clone(), dir, (b.high ? R.powerHigh : R.power) * (b.k ?? 1) * (1 + T.fever * 0.5), 'bashed', 'courier');
    if (hit) g.stun?.add(b.c, R.stun, { by: 'courier', cause: 'lick' });
    g.events?.emit('crucibelle.lick', { degree: b.degree, octave: b.octave, hit, chord: b.chord, at: b.pos.clone(), by: 'courier' });
  }

  /** The recital ended: the bolts dropped, the feedback stopped, the moments let go. */
  end() { for (const b of this.bolts) b.done = true; this.bolts.length = 0; this.feedback(false); this.held = false; this.wham = 0; if (this.whamOn) { this.whamOn = false; this.game.events?.emit('crucibelle.whammy', { on: false, by: 'courier' }); } this.chain = 0; this.rockT = 0; this.windT = 0; }
}
