// ---------------------------------------------------------------------------------------
// THE LEG RUNNER: plays one waypoint's leg from its schedule (progress/rail/legs.js `schedule`; the split with Petra, 2026-10-08). On each
// event's bar it lets a wave in (world/emocean/waves.js `spawn`), sets a pattern going from its thrower (the pattern player into the shot
// field), sets lights adrift for the lock-on (a breath that still scores), or hands the peak to the leg's director (the stage's: the
// shoal, the Wreckers, Old Nobody). A thing more than a bar late (the game paused while the cue played on) is let go, never heaped, as
// the waves do. The waypoint shapes it: its Figment class (the waves' classes), its feeling (the patterns' kinds), a storm (more volleys).
//
// What it needs of the stage (Petra's), passed in, never reached for:
//   waves (spawn, add, foes)   player (a PatternPlayer)   object() -> the director's big thing to fire from, or null   onDirector(setPiece)
//
// THE THROWER (the owner's "no clear source", 2026-10-20: Calissa's measurements, RAIL-BUGS-MEASURED.md report 3; RAIL-MODULES.md 1): a
// pattern is thrown by a body you can see. A role's thrower is a live foe of that role IN FRAME for the view (the nearest the view's
// middle, never the newest wherever it is); 'object' is the director's part. Where there is none (and for 'ahead'), a CARRIER comes in
// from the view's far edge, holds while it fires, and leaves (fire only while holding): Calissa's carrier body, shootable, its volleys
// cancelled if it is downed. Every play has a WINDUP before its first volley (patterns.js `leadOf`: a beat, half a bar for outlined
// shots, a bar for a beam), the rail's telegraph mark on the thrower; and nothing it fires lands in the bar before a swing. The pattern
// player is told the view's plane (`up`) and reads the leg's bar as its clock. Each windup emits `rail.tell { bar, beat, outlined, by }`,
// when its first volley will be heard on the music's clock (Wanda's muzzle cue).
//
// THE STREAM (the owner's "dead air", 2026-10-21: docs/plans/RAIL-FLOW.md 1, law 1; legs.js `flow` is the model this plays): a phase's
// queued waves (events with `queue`, from a cue's `cycle`) wait for their bar no longer than they must. On each beat, while fewer foes
// are alive than the phase's `floor`, as many of the queue's next waves as fill the shortfall are pulled to now (no sooner than PULL_GAP
// after the last pull, PULL_MAX at most) and the rest of the queue moves up by as much; a queue run dry before its phase ends goes round its cycle again. So clearing fast brings the next
// wave fast (Ikaruga's chain waves, Star Fox 64's stream). A leg's first sailing begins with its LESSON (legs.js: `alone` waves, each
// kind of foe met once by itself): nothing is pulled while a lesson's foe lives, and a pull that takes one takes nothing else. A swing's FLOURISH (lights with `flourish`) is set round the ship, where both
// views see it, so the turn is shot through; other lights are laid across the view's frame (RAIL-FLOW.md 1, laws 2 and 4).
//
// Prior art: the shmup stage script on the beat (Rez's layers, Cave's wave tables), and the waves' own let-go rule; Rez's emitters,
// always bodies; the Gummi ship's fly-in, hold, fire, fly-out.
//
//   const L = new LegRunner({ waves, player, object, onDirector, scene })   L.begin(waypoint, { first })   L.update(bar)
//   L.plan   L.done   L.phaseAt(bar) -> { id, view }   (bar: from the leg's first, in the cue's bars)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { schedule, CARRIER_AT, THROW_MIN, PULL_GAP } from '../../progress/rail/legs.js';
import { viewFrame } from './foemoves.js';
import { leadOf } from '../../progress/rail/patterns.js';
import { BAR_S } from '../../progress/rail/crossing.js';
import { PatternPlayer, layOnPlane } from './patternplayer.js';
import { railFoeBody } from '../../vfx/railfoes.js';

const CARRIER = { hp: 6, pay: 20, radius: 1.5, scale: 1.8, lanes: [-8, 0, 8], exit: 1.2 }; // (scale and radius as waves.js draws a roster body: SIZE 1.8, its length 1.9 x 0.45 x SIZE)
const upOf = (view) => (view === 'side' ? [1, 0, 0] : [0, 1, 0]);
const LIGHT = { speed: 9, pay: 40 }; // (a light drifting by: lock it for its pay; it never fires)
const inBox = (L, B, depth = null) => (depth === 'x' || Math.abs(L.x) <= B.x) && (depth === 'y' || (L.y >= B.y[0] && L.y <= B.y[1])) && L.z >= B.z[0] && L.z <= B.z[1]; // (depth: the axis a plane view lays flat, not asked)
const PULL_MAX = 8; // (the most waves one pull lets in: a floor of ten in ones would otherwise be ten bodies on one beat)
const REST = new THREE.Vector3(0, 3, 0), _p = new THREE.Vector3(), _u = new THREE.Vector3(); // (the ship's rest, before the waves have seen it)

export class LegRunner {
  constructor({ waves, player, object = () => null, onDirector = null, scene = null } = {}) {
    Object.assign(this, { waves, player, object, onDirector, scene });
    this.plan = null; this.next = 0; this.idx = 0; this.done = true; this.carriers = 0;
  }

  /** A waypoint's leg begins: { type, strength, feel, storm } (the sea chart's waypoint). */
  begin(w, extra = {}) {
    this.plan = schedule(w.type, { strength: w.strength ?? 1, feel: w.feel ?? null, storm: !!w.storm, ...extra });
    this.next = 0; this.idx = 0; this.done = !this.plan; this.feel = w.feel ?? null; this.beat = -1; this.lone = null;
    this.queues = new Map(); // (each phase's queued waves, at their latest bars, and its cycle to go round again: THE STREAM)
    for (const e of this.plan?.events || []) if (e.queue) { if (!this.queues.has(e.queue)) this.queues.set(e.queue, { list: [], cycle: [], last: -9, n: 0 }); const q = this.queues.get(e.queue); q.list.push({ ...e }); if (!e.alone) q.cycle.push(e.wave); } // (a lesson's wave is met once: never in the cycle)
    return this.plan;
  }
  phaseAt(bar) { return this.plan?.phases.find((p) => bar >= p.from && bar < p.to) || null; }

  update(bar) {
    if (this.done) return;
    this.player.bar = bar; // (the pattern player's clock: the leg's bar, never frame time)
    const E = this.plan.events;
    while (this.next < E.length && E[this.next].bar <= bar) {
      const e = E[this.next++];
      if (e.queue) continue; // (a queued wave enters by its queue: below)
      if (bar - e.bar > 1) continue; // (more than a bar late: let go)
      if (e.wave) this.wave(e.wave, e.bar);
      else if (e.pattern) this.pattern(e.pattern, e.bar);
      else if (e.targets) this.lights(e.targets, e.flourish, e.bar);
      else if (e.director) this.onDirector?.(e.director);
    }
    this.stream(bar);
    if (bar >= this.plan.bars) this.done = true;
  }
  /** A queued wave let in; a lesson's (`alone`: legs.js LESSON) keeps its foes, and nothing is pulled while one of them lives. */
  letIn(e, bar) { const n0 = this.waves.foes.length; this.wave(e.wave, bar); if (e.alone) this.lone = this.waves.foes.slice(n0); }
  wave(w, bar) { this.waves.spawn({ ...w, lane: w.lane ?? ((this.idx % 3) - 1), bar, boss: this.phaseAt(bar)?.id === 'peak' }, this.idx++); } // (boss: a peak's foe that holds until beaten holds the peak too: triprun.js)
  /** THE STREAM: the phase's queue let in on its bars, and pulled forward on a beat while the live count is under the phase's floor. */
  stream(bar) {
    const ph = this.phaseAt(bar), q = ph && this.queues.get(ph.id); if (!q) return;
    while (q.list.length && q.list[0].bar <= bar) { const e = q.list.shift(); this.letIn(e, e.bar); q.n++; }
    const beat = Math.floor(bar * 4); if (beat === this.beat) return; this.beat = beat;
    let short = (ph.floor || 0) - this.live();
    if (short <= 0 || bar - q.last < PULL_GAP || bar >= ph.to - 0.5 || this.lone?.some((f) => f.alive)) return; // (a lesson's foe is met alone)
    q.last = bar;
    for (let k = 0; short > 0 && k < PULL_MAX; k++) { // (one pull fills the shortfall, its waves in together on this beat: legs.js flow, Dovina's)
      if (q.list.length) { const d = q.list[0].bar - bar; for (const e of q.list) e.bar -= d; const e = q.list.shift(); this.letIn(e, bar); q.n++; short -= e.wave.count || 1; if (e.alone) break; continue; } // (a pull that takes a lesson's wave takes nothing else)
      const w = q.cycle.length ? q.cycle[q.n % q.cycle.length] : null; if (!w) break; // (run dry: the cycle goes round again)
      this.wave(w, bar); q.n++; short -= w.count || 1;
    }
  }
  /** Foes alive the floor counts: a wave's members and lights to lock, entering or in frame (a set piece's parts, a carrier, a mine
   *  stand apart: the floor is what is beside the boss). */
  live() { let n = 0; for (const f of this.waves.foes) if (f.alive && (f.form != null || f.role === 'light')) n++; return n; }

  /** A pattern from its thrower: a live foe of its role in frame, the director's part, or else a carrier; after its windup, and never
   *  into the bar before a swing. */
  pattern(p, bar) {
    const view = this.phaseAt(bar)?.view || 'chase', H = CARRIER_AT[view] || CARRIER_AT.chase, lead = leadOf(p.name);
    let from = null;
    if (p.from === 'object') { const o = this.object?.() || null; from = o && this.throws(o, H.box, p.mode, view) ? o : null; } // (else a carrier: THROW_MIN)
    else if (p.from !== 'ahead') from = this.inFrame(p.from, H.box);
    const swing = (this.plan.swings || []).find((w) => w > bar), until = swing != null ? (swing - 1 - bar) * BAR_S : Infinity;
    const carried = !from;
    if (carried) from = this.carrier(view, H);
    const range = Math.hypot(from.local.x, from.local.y - 3, from.local.z);
    const run = this.player.play(p.name, p.params, { from, mode: p.mode, kind: p.kind, feel: this.feel, up: upOf(view), range, bar0: bar, lead, until });
    if (carried) from.hold = run ? lead + PatternPlayer.length(run) + 0.3 : 0; // (it leaves once its pattern is spent)
    if (run) {
      const g = this.waves.game;
      g?.rail?.stage?.shots?.telegraphs?.mark(from.mesh || from.pos, lead, { radius: 1.1, alive: () => from.alive }); // (the windup: the rail's telegraph mark)
      const C = g?.music?.clock?.(); // (Wanda's muzzle cue: when the first volley will be heard, on the music's own bars)
      if (C) { const at = C.bar + (bar + lead / BAR_S - (this.player.bar ?? bar)), b = Math.floor(at); g.events?.emit('rail.tell', { bar: b, beat: +((at - b) * C.beats).toFixed(3), outlined: p.name === 'mixed', by: 'creature' }); }
    }
    return run;
  }
  /** May a set piece's body throw this volley itself: inside the view's box and at least THROW_MIN from the ship, both asked where the
   *  pattern player lays it (a plane view lays it on the ship's plane along the camera's ray, and the box's depth is not asked:
   *  patternplayer.js layOnPlane). Dovina's rule, RAIL-MODULES.md 1.8: the brig abeam in the side view stood 1.4 m off the ship where
   *  its shots began, 17 m off in truth. */
  throws(f, B, mode, view) {
    const S = this.waves.ship?.local || REST;
    if (mode === 'cone') return inBox(f.local, B) && f.local.distanceTo(S) >= THROW_MIN;
    const up = _u.fromArray(upOf(view)), at = layOnPlane(f.local, S, up, this.player.eye, _p);
    return inBox(at, B, view === 'side' ? 'x' : 'y') && at.distanceTo(S) >= THROW_MIN;
  }
  /** The live foe of a role in the view's frame nearest the frame's middle (the newest of old fired from wherever it was). */
  inFrame(role, B) {
    let best = null, bd = Infinity;
    for (const f of this.waves.foes) {
      if (!f.alive || f.role !== role) continue;
      const L = f.local; if (!inBox(L, B)) continue;
      const d = Math.abs(L.x) + Math.abs(L.z - (B.z[0] + B.z[1]) / 2) * 0.5; if (d < bd) { bd = d; best = f; }
    }
    return best;
  }
  /** A carrier: comes in from the view's far edge over the windup, holds while it fires, then leaves the way it came. Its body is
   *  Calissa's (vfx/railfoes.js), shootable: downed, its unfired volleys go with it. */
  carrier(view, H) {
    const lane = CARRIER.lanes[this.carriers++ % CARRIER.lanes.length], side = view === 'side';
    const hold = new THREE.Vector3(...H.at), from = new THREE.Vector3(...H.from);
    if (side) hold.y += lane * 0.4; else hold.x += lane;
    const start = hold.clone().add(from), lead = BAR_S / 4, body = railFoeBody('carrier', this.feel || 'mirth');
    body.object.scale.setScalar(CARRIER.scale);
    return this.waves.add({
      kind: 'rail.carrier', name: 'a carrier', role: 'carrier', cls: 1, aspect: this.feel, radius: CARRIER.radius, hp: CARRIER.hp, pay: CARRIER.pay, chain: false,
      local: start.clone(), mesh: body.object, body, hold: 99,
      tick: (dt, f) => {
        const t = f.t, inT = Math.max(lead, 0.25), outT = f.hold + CARRIER.exit;
        body.tell(t < inT ? t / inT : 0); body.update(dt); // (its tell over the windup; a downed one reads its death in waves.js `dying`)
        if (t < inT) { const k = t / inT, e = k * k * (3 - 2 * k); f.local.lerpVectors(start, hold, e); }
        else if (t < f.hold) f.local.copy(hold).y += Math.sin(t * 2) * 0.15;
        else { const k = Math.min(1, (t - f.hold) / CARRIER.exit); f.local.lerpVectors(hold, start, k * k); }
        return t < outT;
      },
    });
  }

  /** Lights to lock (Rez's scanning orbs: the calm's score, the release's flotsam), drifting down the view's frame from beyond its far
   *  edge; a swing's flourish instead rings the ship (both views see the ship), turning slowly, for the turn and a bar after it. */
  lights(n, flourish = false, bar = 0) {
    const view = this.phaseAt(bar)?.view || 'chase', P = viewFrame(view), side = view === 'side', plane = side || view === 'above';
    const ship = this.waves.ship?.local || REST, run = plane ? 1.25 / (4 * BAR_S) : 0;
    for (let i = 0; i < n; i++) {
      const a = -0.8 + 1.6 * (i + 0.5) / n, k = i % 3, ring = (i / n) * Math.PI * 2, R = 8 + k * 1.5;
      const start = flourish ? null : plane ? (side ? P(1.15 + k * 0.08, (a + 1) / 2) : P(a, 1.15 + k * 0.08)) : new THREE.Vector3(-14 + 28 * (i + 0.5) / n, 3 + 3 * Math.sin(i * 1.7), 70 + k * 8);
      this.waves.add({
        kind: 'rail.light', name: 'a light', role: 'light', cls: 0, aspect: this.feel, radius: 1.1, hp: 1, pay: LIGHT.pay, chain: false, count: false,
        local: flourish ? ship.clone().add(_p.set(Math.cos(ring) * R, Math.sin(i * 1.7) * 2.5, Math.sin(ring) * R + 4)) : start.clone(), mesh: this.lightMesh(),
        tick: flourish
          ? (dt, f) => { const g = ring + f.t * 0.35, s = this.waves.ship?.local || ship; f.local.set(s.x + Math.cos(g) * R, s.y + Math.sin(i * 1.7 + f.t) * 2.5, s.z + Math.sin(g) * R + 4); return f.t < 2.5 * BAR_S; }
          : plane ? (dt, f) => { f.local.z -= run * dt * (CARRIER_AT[view].box.z[1] - CARRIER_AT[view].box.z[0]); return f.local.z > CARRIER_AT[view].box.z[0] - 6; }
            : (dt, f) => { f.local.z -= LIGHT.speed * dt; f.local.y += Math.sin(f.t * 2 + i) * 0.4 * dt; return f.local.z > -12; },
      });
    }
  }
  lightMesh() { // (a placeholder: Calissa's lights to lock)
    this.lightGeo ||= new THREE.OctahedronGeometry(0.7, 0);
    this.lightMat ||= new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    return new THREE.Mesh(this.lightGeo, this.lightMat);
  }
}
