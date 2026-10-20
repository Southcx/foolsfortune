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
// from the view's far edge, holds while it fires, and leaves (fire only while holding): a placeholder body, shootable, its volleys
// cancelled if it is downed. Every play has a WINDUP before its first volley (patterns.js `leadOf`: a beat, half a bar for outlined
// shots, a bar for a beam), the rail's telegraph mark on the thrower; and nothing it fires lands in the bar before a swing. The pattern
// player is told the view's plane (`up`) and reads the leg's bar as its clock. Each windup emits `rail.tell { bar, beat, outlined, by }`,
// when its first volley will be heard on the music's clock (Wanda's muzzle cue).
//
// Prior art: the shmup stage script on the beat (Rez's layers, Cave's wave tables), and the waves' own let-go rule; Rez's emitters,
// always bodies; the Gummi ship's fly-in, hold, fire, fly-out.
//
//   const L = new LegRunner({ waves, player, object, onDirector, scene })   L.begin(waypoint, { feel, storm, strength })   L.update(bar)
//   L.plan   L.done   L.phaseAt(bar) -> { id, view }   (bar: from the leg's first, in the cue's bars)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { schedule, CARRIER_AT } from '../../progress/rail/legs.js';
import { leadOf } from '../../progress/rail/patterns.js';
import { BAR_S } from '../../progress/rail/crossing.js';
import { PatternPlayer } from './patternplayer.js';

const CARRIER = { hp: 6, pay: 20, radius: 1.2, lanes: [-8, 0, 8], exit: 1.2 };
const upOf = (view) => (view === 'side' ? [1, 0, 0] : [0, 1, 0]);
const LIGHT = { speed: 9, pay: 40 }; // (a light drifting by: lock it for its pay; it never fires)

export class LegRunner {
  constructor({ waves, player, object = () => null, onDirector = null, scene = null } = {}) {
    Object.assign(this, { waves, player, object, onDirector, scene });
    this.plan = null; this.next = 0; this.idx = 0; this.done = true; this.carriers = 0;
  }

  /** A waypoint's leg begins: { type, strength, feel, storm } (the sea chart's waypoint). */
  begin(w, extra = {}) {
    this.plan = schedule(w.type, { strength: w.strength ?? 1, feel: w.feel ?? null, storm: !!w.storm, ...extra });
    this.next = 0; this.idx = 0; this.done = !this.plan; this.feel = w.feel ?? null;
    return this.plan;
  }
  phaseAt(bar) { return this.plan?.phases.find((p) => bar >= p.from && bar < p.to) || null; }

  update(bar) {
    if (this.done) return;
    this.player.bar = bar; // (the pattern player's clock: the leg's bar, never frame time)
    const E = this.plan.events;
    while (this.next < E.length && E[this.next].bar <= bar) {
      const e = E[this.next++];
      if (bar - e.bar > 1) continue; // (more than a bar late: let go)
      if (e.wave) this.waves.spawn({ ...e.wave, lane: e.wave.lane ?? ((this.idx % 3) - 1), bar: e.bar }, this.idx++);
      else if (e.pattern) this.pattern(e.pattern, e.bar);
      else if (e.targets) this.lights(e.targets);
      else if (e.director) this.onDirector?.(e.director);
    }
    if (bar >= this.plan.bars) this.done = true;
  }

  /** A pattern from its thrower: a live foe of its role in frame, the director's part, or else a carrier; after its windup, and never
   *  into the bar before a swing. */
  pattern(p, bar) {
    const view = this.phaseAt(bar)?.view || 'chase', H = CARRIER_AT[view] || CARRIER_AT.chase, lead = leadOf(p.name);
    let from = null;
    if (p.from === 'object') from = this.object?.() || null;
    else if (p.from !== 'ahead') from = this.inFrame(p.from, H.box);
    const swing = (this.plan.swings || []).find((w) => w > bar), until = swing != null ? (swing - 1 - bar) * BAR_S : Infinity;
    const carried = !from;
    if (carried) from = this.carrier(view, H);
    const range = Math.hypot(from.local.x, from.local.y - 3, from.local.z);
    const run = this.player.play(p.name, p.params, { from, mode: p.mode, kind: p.kind, feel: this.feel, up: upOf(view), range, bar0: bar, lead, until });
    if (carried) from.hold = run ? lead + PatternPlayer.length(run) + 0.3 : 0; // (it leaves once its pattern is spent)
    if (run) {
      const g = this.waves.game;
      g?.emocean?.stage?.shots?.telegraphs?.mark(from.mesh || from.pos, lead, { radius: 1.1, alive: () => from.alive }); // (the windup: the rail's telegraph mark)
      const C = g?.music?.clock?.(); // (Wanda's muzzle cue: when the first volley will be heard, on the music's own bars)
      if (C) { const at = C.bar + (bar + lead / BAR_S - (this.player.bar ?? bar)), b = Math.floor(at); g.events?.emit('rail.tell', { bar: b, beat: +((at - b) * C.beats).toFixed(3), outlined: p.name === 'mixed', by: 'creature' }); }
    }
    return run;
  }
  /** The live foe of a role in the view's frame nearest the frame's middle (the newest of old fired from wherever it was). */
  inFrame(role, B) {
    let best = null, bd = Infinity;
    for (const f of this.waves.foes) {
      if (!f.alive || f.role !== role) continue;
      const L = f.local; if (Math.abs(L.x) > B.x || L.y < B.y[0] || L.y > B.y[1] || L.z < B.z[0] || L.z > B.z[1]) continue;
      const d = Math.abs(L.x) + Math.abs(L.z - (B.z[0] + B.z[1]) / 2) * 0.5; if (d < bd) { bd = d; best = f; }
    }
    return best;
  }
  /** A carrier: comes in from the view's far edge over the windup, holds while it fires, then leaves the way it came. A placeholder
   *  body (Calissa's to dress), shootable: downed, its unfired volleys go with it. */
  carrier(view, H) {
    const lane = CARRIER.lanes[this.carriers++ % CARRIER.lanes.length], side = view === 'side';
    const hold = new THREE.Vector3(...H.at), from = new THREE.Vector3(...H.from);
    if (side) hold.y += lane * 0.4; else hold.x += lane;
    const start = hold.clone().add(from), lead = BAR_S / 4;
    return this.waves.add({
      kind: 'rail.carrier', name: 'a carrier', role: 'carrier', cls: 1, aspect: this.feel, radius: CARRIER.radius, hp: CARRIER.hp, pay: CARRIER.pay, chain: false,
      local: start.clone(), mesh: this.carrierMesh(), hold: 99,
      tick: (dt, f) => {
        const t = f.t, inT = Math.max(lead, 0.25), outT = f.hold + CARRIER.exit;
        if (t < inT) { const k = t / inT, e = k * k * (3 - 2 * k); f.local.lerpVectors(start, hold, e); }
        else if (t < f.hold) f.local.copy(hold).y += Math.sin(t * 2) * 0.15;
        else { const k = Math.min(1, (t - f.hold) / CARRIER.exit); f.local.lerpVectors(hold, start, k * k); }
        return t < outT;
      },
    });
  }
  carrierMesh() { // (a placeholder: Calissa's carrier, the body every 'ahead' pattern now comes from)
    this.carrierGeo ||= new THREE.OctahedronGeometry(1.2, 0);
    this.carrierMat ||= new THREE.MeshLambertMaterial({ color: 0x2a2433, emissive: 0x6a4a8a, emissiveIntensity: 0.6, flatShading: true });
    return new THREE.Mesh(this.carrierGeo, this.carrierMat);
  }

  /** Lights to lock, set adrift across the frame (Rez's scanning orbs: the calm's score, the release's flotsam). */
  lights(n) {
    for (let i = 0; i < n; i++) {
      const x = -14 + 28 * (i + 0.5) / n, y = 3 + 3 * Math.sin(i * 1.7), z = 70 + (i % 3) * 8;
      this.waves.add({
        kind: 'rail.light', name: 'a light', role: 'light', cls: 0, aspect: this.feel, radius: 1.1, hp: 1, pay: LIGHT.pay, chain: false, count: false,
        local: new THREE.Vector3(x, y, z), mesh: this.lightMesh(),
        tick: (dt, f) => { f.local.z -= LIGHT.speed * dt; f.local.y += Math.sin(f.t * 2 + i) * 0.4 * dt; return f.local.z > -12; },
      });
    }
  }
  lightMesh() { // (a placeholder: Calissa's lights to lock)
    this.lightGeo ||= new THREE.OctahedronGeometry(0.7, 0);
    this.lightMat ||= new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    return new THREE.Mesh(this.lightGeo, this.lightMat);
  }
}
