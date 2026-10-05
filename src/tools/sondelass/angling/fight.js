// ---------------------------------------------------------------------------------------
// THE FIGHT: what happens between setting the hook and landing the fish, as a small model with three numbers and a pair of hands.
//
//   tension   how hard the line is loaded (0..1.3). Over 1 for long enough and it snaps; near nothing for long enough and the
//             hook slips. The sweet band, 0.34 to 0.78, is where the fish tires.
//   stamina   the fish's, 1 to 0, worn down only while the tension sits in the sweet band (and faster when you answer it well).
//             Below half it can be brought in; at nothing it is spent.
//   dist      how much line is out to it. Reeling and hauling bring it in, its runs take it out.
//
//   THE HANDS (the Courier cannot walk while a fish is on: the keys are the rod's):
//     LMB   reel: takes up line, loads it.                      RMB   give line: takes the load off and lets it run.
//     A / D lean the rod against a run (away from the way it is going: the reticle shows the way, a beat ahead).
//     S     haul: heave the rod back against a dive or a heavy run (and pump the fish in a little).
//     W     bow: lower the rod to a leap, so the line is not snapped when it comes down; a light give of the load in general.
//     C     brace (crouch): plant your feet; it drags you less, and a thrash tells less.
//   Every segment of the fish's script asks for one of these (its `need`); answering it takes 55% off its pull, and an answered
//   pull wears the fish faster. Nothing else is asked for: a rest is for reeling.
//
// The fish's own script is a chain of short segments picked by its STYLE (species.js): a rest, a run, a sweep, a thrash with a
// half second's warning, a leap that leaves the water and comes down hard. Each has a pull and a side. The NEXT segment is chosen
// ahead of time (`next`), and the reticle (reticle.js) shows it while the current one runs out: that is the precognition.
//
// Prior art, and what was taken:
//  - Final Fantasy XI's fishing: the fish's stamina bar that the fight wears down, and a pull in a direction (its arrows) that must
//    be answered, or the rod and line are lost.
//  - Real fishing's own techniques, which are the answers: lean the rod against a run ("turn its head"), pump and reel (haul the
//    rod up, reel as you lower it), bow to a leaping fish (drop the tip so the line has slack when it falls back).
//  - Red Dead Redemption 2 / Zelda: Twilight Princess: tension against a snap threshold, lean the rod against the run, give line to
//    the big pulls, reel when it tires: the rhythm of reel, rest, reel.
//  - Stardew Valley's fishing bar: a band to keep something in, the fish moves and you follow it; here the band is the tension
//    and the fish moves it.
//  - Monster Hunter and Hades: a telegraph before the heavy hit, so that a good player is never surprised.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stream } from '../../../core/rng.js';
const simRand = stream('tools/sondelass/angling/fight'); // (the simulation's chance: core/rng.js, the same twice)

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const rnd = (a, b) => a + simRand() * (b - a);
const pick = (a) => a[Math.floor(simRand() * a.length)];
const cl = THREE.MathUtils.clamp;
export const BAND = [0.34, 0.78];
/** How far ahead of a change the reticle shows it (seconds). */
export const LOOK = 1.4;
/** What each kind of segment asks of the hands: lean (A/D against the pull), haul (S), bow (W), brace (C), or nothing (reel). */
export const NEED = { swim: 'lean', flick: 'lean', run: 'lean', sweep: 'lean', heave: 'haul', sound: 'haul', dive: 'haul', leap: 'bow', breach: 'bow', splash: 'bow', thrash: 'brace', coil: null, rest: null, sulk: null, spent: null };

export class Fight {
  constructor(fish, p0, ctx) {
    this.fish = fish; this.sp = fish.sp;
    this.ctx = ctx; // { pool, onEvent(kind, data), maxLine }
    this.tension = 0.35; this.stamina = 1; this.over = 0; this.slackT = 0; this.t = 0;
    const dx = fish.pos.x - p0.x, dz = fish.pos.z - p0.z;
    this.bearing = Math.atan2(dx, dz);
    this.dist = Math.max(3, Math.hypot(dx, dz));
    this.maxLine = ctx.maxLine;
    this.seg = null; this.next = null; this.warned = false; this.phase = 0; this.spent = false;
    this.sizeK = cl((fish.cm - this.sp.size[0]) / Math.max(1, this.sp.size[1] - this.sp.size[0]), 0, 1);
    this.power = cl(this.sp.pull * (0.8 + 0.4 * this.sizeK) * 1.25, 0.3, 1.25);
    this.depth = ctx.pool.surface - fish.pos.y;
    this.side = 0; this.pull = 0; this.relief = 0; this.leanS = 0; this.answered = false;
    this.airborne = 0;
    this.stats = { peak: 0, bandT: 0, slackMax: 0, thrashes: 0, dodged: 0, maxOver: 0 };
    this.outBurst = 0;
    this.adopt();
  }

  // ---- the fish's script
  /** Choose a segment to follow one of kind `last` (with side `lastSide`). */
  pick(last, lastSide = 0) {
    const s = this.sp, st = s.style;
    const side = () => (simRand() < 0.5 ? -1 : 1);
    const S = (kind, dur, pull, sd = 0, o = {}) => ({ kind, t: dur, dur, pull, side: sd, need: NEED[kind] ?? null, ...o });
    const lowStam = this.stamina < 0.34;
    let g;
    if (this.stamina <= 0.03) g = S('spent', 9, 0.06, 0);
    else switch (st) {
      case 'drift': g = last === 'swim' ? S('rest', rnd(1.6, 3.2), 0.16) : S('swim', rnd(1.6, 3), 0.85, side()); break;
      case 'dart': g = last === 'flick' ? S('rest', rnd(0.25, 0.6), 0.2) : S('flick', rnd(0.45, 0.9), rnd(0.7, 1), side()); break;
      case 'thrash':
        if (last === 'coil') g = S('thrash', 0.95, 1.2, side(), { warn: 0.5 });
        else { g = S('coil', rnd(1.4, 2.6), 0.32, side()); }
        break;
      case 'run': g = last === 'run' ? S('rest', rnd(1.2, 2), 0.2) : S('run', rnd(2, 3.6), 1.0, side()); break;
      case 'sweep': g = S('sweep', rnd(0.9, 1.5), 0.85, last === 'sweep' && lastSide ? -lastSide : side()); break;
      case 'leap': g = last === 'dive' ? S('leap', 0.85, 0, 0, { air: true }) : last === 'leap' ? S('splash', 0.4, 1.1, side()) : S('dive', rnd(1.2, 2), 0.7, side()); break;
      case 'anchor': g = last === 'heave' ? S('sulk', rnd(0.8, 1.6), 0.25) : S('heave', rnd(2.6, 5), 1.0, 0); break;
      case 'legend': {
        const ph = this.stamina > 0.66 ? 0 : this.stamina > 0.33 ? 1 : 2;
        if (ph === 0) g = last === 'run' ? S('sweep', 1.3, 0.85, side()) : S('run', rnd(2.4, 3.6), 1.0, side());
        else if (ph === 1) g = last === 'breach' ? S('splash', 0.5, 1.2, side()) : last === 'run' ? S('breach', 1.1, 0, 0, { air: true, huge: true }) : S('run', rnd(2, 3), 1.05, side());
        else g = last === 'sound' ? S('thrash', 0.9, 1.25, side(), { warn: 0.55 }) : last === 'thrash' ? S('rest', 1.1, 0.25) : S('sound', rnd(1.6, 2.4), 1.1, 0);
        break;
      }
      default: g = S('swim', 2, 0.6, side());
    }
    if (lowStam && g.kind !== 'spent' && g.pull > 0.5) g.pull *= 0.7 + 0.3 * (this.stamina / 0.34);
    return g;
  }

  /** The next segment begins (it was chosen ahead of time, so that the reticle could show it), and another is chosen. */
  adopt() {
    const prev = this.seg;
    if (this.stamina <= 0.03 && this.next?.kind !== 'spent') this.next = this.pick(prev?.kind, prev?.side);
    this.seg = this.next || this.pick(prev?.kind, prev?.side);
    this.next = this.pick(this.seg.kind, this.seg.side);
    this.warned = false; this.hit = false;
    this.ctx.onEvent?.('seg', this.seg);
  }

  /**
   * input: { reel, give, brace, lean (-1 A .. 1 D), haul (S), ease (W), pullDir (which way the pull goes on the screen: -1, 0, 1), player: Vector3 }.
   * Returns the result when it ends: 'snap' | 'slip' | 'spool' | 'land' | null.
   */
  update(dt, input) {
    this.t += dt;
    const s = this.seg, sp = this.sp;
    s.t -= dt;
    if (s.t <= 0) this.adopt();
    const g = this.seg;
    this.side = g.side;
    let pull = g.pull * this.power;
    // a thrash telegraphs (the fish surfaces and shudders), then hits
    if (g.warn && !this.warned && g.t < g.dur) { this.warned = true; this.ctx.onEvent?.('warn', g); }
    const thrashHit = g.kind === 'thrash' && g.t < g.dur - g.warn && g.t > g.dur - g.warn - 0.3;
    if (g.kind === 'thrash' && !thrashHit) pull *= g.t > g.dur - g.warn ? 0.35 : 0.4;
    if (g.kind === 'thrash' && thrashHit && !this.hit) { this.hit = true; this.stats.thrashes++; this.ctx.onEvent?.('thrash', g); }
    if (g.air) { pull = 0; this.airborne = g.t > 0 ? Math.sin(Math.PI * (1 - g.t / g.dur)) : 0; if (!this.leapAnnounced) { this.leapAnnounced = true; this.ctx.onEvent?.(g.huge ? 'breach' : 'leap', g); } } else { this.airborne = 0; this.leapAnnounced = false; }
    if (g.kind === 'splash' && !this.splashed) { this.splashed = true; this.ctx.onEvent?.('splash', g); }
    if (g.kind !== 'splash') this.splashed = false;
    // what the hands are answering: the segment's need
    this.leanS = THREE.MathUtils.damp(this.leanS, input.lean ?? 0, 9, dt);
    let counter = 0.5;
    if (g.need === 'lean') counter = cl(0.3 + 0.7 * (-this.leanS * (input.pullDir ?? 0)), 0, 1);
    else if (g.need === 'haul') counter = input.haul ? 1 : 0.25;
    else if (g.need === 'bow') counter = input.ease ? 1 : 0.25;
    else if (g.need === 'brace') counter = input.brace ? 1 : 0.2;
    if (input.brace && g.need !== 'brace') counter = Math.min(1, counter + 0.12);
    const relief = counter;
    this.relief = relief; this.pull = pull; this.answered = counter > 0.75 && !!g.need;
    // the line
    let target = pull * (1 - 0.55 * relief) + (input.reel ? 0.3 : 0) - (input.give ? 0.5 : 0) + (input.haul ? 0.18 : 0) - (input.ease ? 0.14 : 0);
    if (thrashHit) target = 1.3 * (input.reel ? 1 : input.give ? 0.55 : 0.85) * (input.brace ? 0.8 : 1) * (input.ease ? 0.92 : 1);
    if (g.kind === 'splash') target = 0.95 * (input.reel ? 1.15 : input.give ? 0.6 : 0.95) * (input.ease ? 0.85 : 1);
    if (this.forceSlack) target = 0;
    this.tension += (target - this.tension) * Math.min(1, dt * (target > this.tension ? 8 : 4.5));
    this.tension = cl(this.tension, 0, 1.3);
    this.stats.peak = Math.max(this.stats.peak, this.tension);
    // stamina: worn down in the band
    const inBand = this.tension > BAND[0] && this.tension < BAND[1];
    if (inBand && !g.air) { this.stamina -= dt / sp.stamina * (0.7 + 0.9 * relief); this.stats.bandT += dt; }
    else if (this.tension < 0.12 && this.stamina > 0.02) this.stamina += dt * 0.02;
    this.stamina = cl(this.stamina, 0, 1);
    if (this.stamina <= 0.02 && !this.spent) { this.spent = true; this.ctx.onEvent?.('spent', g); }
    // distance
    const tired = 1 - this.stamina;
    let out = pull > 0.5 ? (pull - 0.35) * 2.4 * (1 - 0.5 * relief) * (0.5 + 0.5 * this.stamina) : 0;
    if (g.kind === 'sound') out += 1.6;
    if (input.give) out += 1.3;
    out += this.outBurst; this.outBurst = Math.max(0, this.outBurst - dt * 2);
    const held = 1 - 0.8 * cl(pull, 0, 1) * this.stamina;
    let inn = (input.reel ? (2.4 + 3 * tired) * held : 0) + (input.haul ? (1.2 + 1.2 * tired) * held : 0);
    if (g.air) inn = input.reel ? 2 : 0;
    this.dist = cl(this.dist + (out - inn) * dt, 0.6, this.maxLine + 2);
    // the fish's bearing (it pulls across, and turns at the pool's edge)
    const ang = g.side * (0.16 + 0.35 * pull) * (g.kind === 'rest' || g.kind === 'spent' ? 0.2 : 1) * (0.5 + 0.5 * this.stamina);
    this.bearing += ang * dt;
    // depth: it dives when it runs, comes up when it tires
    const d0 = this.depth;
    const want = g.air ? -0.4 : this.spent ? 0.3 : g.kind === 'sound' ? Math.min(this.ctx.pool.maxDepth - 0.6, this.depth + 3) : cl(sp.depth[0] + (sp.depth[1] - sp.depth[0]) * (0.3 + 0.5 * this.stamina) - (this.dist < 6 ? (6 - this.dist) * 0.25 : 0), 0.2, this.ctx.pool.maxDepth - 0.5);
    this.depth = THREE.MathUtils.damp(d0, want, g.air ? 12 : 1.6, dt);
    // its place
    const P = input.player;
    const f = this.fish, pool = this.ctx.pool;
    f.pos.set(P.x + Math.sin(this.bearing) * this.dist, pool.surface - this.depth, P.z + Math.cos(this.bearing) * this.dist);
    // (kept inside the water: at an edge the fish turns back along it)
    const px = cl(f.pos.x, pool.x0 + 0.5, pool.x1 - 0.5), pz = cl(f.pos.z, pool.z0 + 0.5, pool.z1 - 0.5);
    if (px !== f.pos.x || pz !== f.pos.z) { f.pos.x = px; f.pos.z = pz; this.dist = Math.hypot(px - P.x, pz - P.z); this.bearing = Math.atan2(px - P.x, pz - P.z); g.side = -g.side; }
    const floor = pool.surface - pool.depthAt(f.pos.x, f.pos.z) + 0.2;
    if (f.pos.y < floor && !g.air) f.pos.y = floor;
    f.heading = Math.atan2(f.pos.z - P.z, f.pos.x - P.x) + g.side * 0.9;
    f.pitch = THREE.MathUtils.damp(f.pitch, g.air ? 0.6 * Math.cos(Math.PI * (1 - g.t / g.dur)) : 0, 6, dt);
    f.speed = 0.8 + pull * 3.2 * (0.4 + 0.6 * this.stamina);
    f.turn = g.side * 1.4 * pull;
    // ends
    if (this.tension > 1.0) this.over += dt; else this.over = Math.max(0, this.over - dt * 2);
    this.stats.maxOver = Math.max(this.stats.maxOver, this.over);
    if (this.over > 0.42) return 'snap';
    if (this.tension < 0.06 && !g.air) this.slackT += dt; else this.slackT = Math.max(0, this.slackT - dt * 2);
    this.stats.slackMax = Math.max(this.stats.slackMax, this.slackT);
    if (this.slackT > 1.5 && this.stamina > 0.12) return 'slip';
    if (this.dist >= this.maxLine + 1.5) return 'spool';
    if (this.dist <= 2.6) {
      if (this.stamina < 0.5) return 'land';
      this.outBurst = 2.2; this.ctx.onEvent?.('bolt', g); this.dist += 0.8;
    }
    return null;
  }
}
