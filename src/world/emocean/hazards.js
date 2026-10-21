// ---------------------------------------------------------------------------------------
// WHERE YOU FLY: a leg's hazards set in the lane and met by the hull, and the ring run paid (docs/plans/RAIL-STANDARDS.md 4; the data is
// Dovina's: legs.js HAZARDS and RING_RUN, a plan's `hazard` events; the glossary's "a hazard / the ring run").
//   A HAZARD is set LEAD bars before its bar on the rail where the ship will be then (railpath.js `at`: the world stands still and the
//   rail carries the ship through it), in its lane of the frame's three (8 m apart, the carriers' lanes), placed again each frame from
//   its event, so a boss hold that moves its bar or a relaid rail carries it along. Its edge mark shows a bar before it enters the frame,
//   as a wave's does (game.edgeMark). It is judged once, as it passes the hull's own depth (boost and brake included), against the
//   hurtbox (T.ship.hurt):
//     pillar  a column HAZARDS.pillar.radius wide: touched, a blow of `hits` the roll does not turn (rock is not a shot)
//     arch    a span of HAZARDS.arch.span: flown through, it pays `pays`. Every arch of the leg threaded pays `all` more and is a find:
//             the next fighting leg is sailed below, as the Light Whale's dive is (encounters.js ENCOUNTER.dive), by a hull that can dive
//     gate    a wall across the frame with one gap HAZARDS.gate.gap wide in its lane: outside the gap, a blow of `hits`
//   A hazard is set only where it can be seen coming: chase and free. Astern the camera stands ahead of the ship looking back, so a
//   pillar or a gate would pass through the camera before it reached the hull, unseen: there only an arch is set (it can only pay).
// THE RING RUN: the rings hung in each turn of the rail (vfx/crossinglook.js CROSSING_LOOK.rings, Calissa's: `per` a turn, radius `r`,
//   `up` over the heartline), judged where they hang: the hull inside a ring as it passes pays RING_RUN.pays and `pool` Lachryma; all of
//   one turn's mend `all.mend` hits and pay `all.pays` (the trip's hull with it: triprun.js mend).
// Events: rail.hazard { kind, passed: 'clear' | 'hit' | 'through', near, side, all, by }   rail.ring { all, by }
// The bodies are placeholders in plain stone until Calissa's: game.hazardLooks?.body(kind, spec) -> an Object3D built symmetric across,
// y up from the heartline and z along the rail, set at the hazard's place and turn each frame and handed back with game.hazardLooks.free(body).
//
// Prior art: Star Fox 64's Corneria (its buildings and pillars make where you fly matter, its arches flown under open Sector Y, its gold
// rings mend the shield), Rez's rings flown through.
//
//   const H = new Hazards(stage)   H.build(scene)   H.begin()   H.update()   H.end()   H.parked
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { HAZARDS, RING_RUN, CARRIER_AT } from '../../progress/rail/legs.js';
import { BAR_S } from '../../progress/rail/crossing.js';
import { ENCOUNTER } from '../../progress/rail/encounters.js';
import { SHIPS } from '../../progress/rail/ships.js';
import { CROSSING_LOOK } from '../../vfx/crossinglook.js';
import { CRUISE } from '../../courier/ship/views.js';

const LANE = 8, NEAR = 2.5, TOP = 22, FOOT = -6, WALL = 34; // (the lanes' spacing, m; how close a pass is near, m; a body's top and foot in the rail frame, m; a gate's half width, m)
const SEEN = { chase: ['pillar', 'arch', 'gate'], free: ['pillar', 'arch', 'gate'], astern: ['arch'] }; // (what may be set in a view)
const LEAD = (CARRIER_AT.chase.box.z[1] / (T.ship.speed * BAR_S)) + 1; // (bars: from beyond the chase frame's far edge, a bar before it enters: its edge mark's time)
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _l = new THREE.Vector3(), _o = new THREE.Vector3();

/** A placeholder body (plain stone, a few boxes and a cylinder) in the rail frame's axes: what a hazard is until Calissa's look. */
function placeholder(kind, mat) {
  const g = new THREE.Group(), add = (geo, x, y) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, 0); g.add(m); };
  const H = TOP - FOOT, mid = (TOP + FOOT) / 2;
  if (kind === 'pillar') add(new THREE.CylinderGeometry(HAZARDS.pillar.radius, HAZARDS.pillar.radius * 1.2, H, 10), 0, mid);
  else if (kind === 'arch') { const s = HAZARDS.arch.span / 2 + 0.6; add(new THREE.BoxGeometry(1.2, H, 1.6), -s, mid); add(new THREE.BoxGeometry(1.2, H, 1.6), s, mid); add(new THREE.BoxGeometry(2 * s + 1.2, 2, 1.6), 0, TOP - 1); }
  else { const gap = HAZARDS.gate.gap / 2, w = WALL - gap; add(new THREE.BoxGeometry(w, H, 1), -(gap + w / 2), mid); add(new THREE.BoxGeometry(w, H, 1), gap + w / 2, mid); }
  g.userData.zoneFree = true; g.visible = false;
  return g;
}

export class Hazards {
  constructor(stage) { this.st = stage; this.game = stage.game; this.live = []; this.pool = { pillar: [], arch: [], gate: [] }; this.parked = null; }
  build(scene) {
    this.scene = scene;
    this.mat = new THREE.MeshStandardMaterial({ color: 0x6f6a63, roughness: 0.9, flatShading: true }); // (a placeholder: Calissa's stone)
    this.parked = placeholder('pillar', this.mat); scene.add(this.parked); this.pool.pillar.push(this.parked); // (parked for the warm-up's compile)
  }
  begin() { this.end(); this.done = new WeakSet(); this.sAt = null; this.turn = new Map(); this.arches = new Map(); }
  end() { for (const h of this.live) this.free(h); this.live = []; }

  body(kind) {
    const L = this.game.hazardLooks?.body?.(kind, { span: HAZARDS.arch.span, gap: HAZARDS.gate.gap, radius: HAZARDS.pillar.radius, top: TOP, foot: FOOT, wall: WALL });
    if (L) { L.userData.look = true; if (!L.parent) this.scene.add(L); return L; }
    const b = this.pool[kind].pop() || placeholder(kind, this.mat); if (!b.parent) this.scene.add(b); return b;
  }
  free(h) {
    h.body.visible = false; h.mark?.stop?.();
    if (h.body.userData.look) this.game.hazardLooks?.free?.(h.body); else this.pool[h.kind].push(h.body);
  }

  /** Once a frame, after the trip: this leg's hazards set as they come within LEAD bars, carried, judged as they pass; the rings. */
  update() {
    const S = this.st, trip = S.trip, ship = S.ship?.local; if (!S.run || S.ending || !ship) return;
    const k = trip?.active ? trip.k : -1, L = k >= 0 ? trip.layout?.legs?.[k] : null, plan = k >= 0 ? trip.runner?.plan : null;
    if (L && plan && !trip.runner.done) {
      const rel = S.bar - L.at;
      for (const e of plan.events) {
        if (!e.hazard || this.done.has(e) || e.bar - LEAD > rel) continue;
        this.done.add(e);
        const view = trip.viewAt(L.at + e.bar), kind = e.hazard.kind;
        if (!SEEN[view]?.includes(kind) || e.bar < rel) continue; // (not where it can be seen coming, or already past)
        if (kind === 'arch') { const a = this.arches.get(k) || { of: 0, through: 0 }; a.of++; this.arches.set(k, a); }
        const h = { e, L, k, kind, x: (e.hazard.lane || 0) * LANE, body: this.body(kind), z: Infinity, judged: false };
        this.place(h); h.body.visible = true;
        const far = CARRIER_AT[view]?.box.z[1]; // (astern the frame lies behind the hull: an arch there has no mark to come in by)
        if (view !== 'astern') h.mark = this.game.edgeMark?.show?.(_o.set(h.x, CRUISE + 1, far), Math.max(0.3, (h.z - far) / S.rail.speed), { kind: 'hazard' });
        this.live.push(h);
      }
    }
    for (let i = this.live.length - 1; i >= 0; i--) {
      const h = this.live[i], was = h.z; this.place(h);
      if (!h.judged && was > ship.z && h.z <= ship.z) this.judge(h, ship);
      if (h.z < -60) { this.free(h); this.live.splice(i, 1); }
    }
    this.rings(ship);
  }
  /** A hazard set from its event's bar on the rail as it is now laid, and where that is in the rail's frame this frame. */
  place(h) {
    const S = this.st, R = S.rail, s = R.speed * BAR_S * (h.L.at + h.e.bar);
    R.path.at(s, _p, _q);
    h.body.position.copy(_p).add(_o.set(-h.x, 0, 0).applyQuaternion(_q)); h.body.quaternion.copy(_q); // (the rail frame's x is the world's -X, rail.toWorld; every body is symmetric across, so none is mirrored)
    h.body.updateMatrixWorld();
    R.toLocal(h.body.position, _l); h.z = _l.z; h.lx = _l.x;
  }
  /** A hazard passing the hull: a scrape, a gap missed, an arch threaded. */
  judge(h, ship) {
    h.judged = true;
    const S = this.st, r = S.run, hurt = T.ship.hurt, dx = ship.x - h.lx, ax = Math.abs(dx), H = HAZARDS[h.kind];
    let passed = 'clear', near = false, all = false;
    if (h.kind === 'pillar') { if (ax < H.radius + hurt) passed = 'hit'; else near = ax < H.radius + hurt + NEAR; }
    else if (h.kind === 'gate') { if (ax > H.gap / 2 - hurt) passed = 'hit'; else near = ax > H.gap / 2 - hurt - 1; }
    else if (ax < H.span / 2 - hurt) passed = 'through'; else near = ax < H.span / 2 + NEAR;
    if (passed === 'hit') S.blow(H.hits || 1, { by: 'environment', what: h.kind, rollable: false }); // (the roll does not pass through rock)
    if (passed === 'through') {
      r.score += H.pays;
      const a = this.arches.get(h.k); a.through++;
      const left = (S.trip?.runner?.plan?.events || []).some((e) => e.hazard?.kind === 'arch' && !this.done.has(e));
      if (!left && a.through === a.of) { all = true; r.score += H.all; this.find(); }
    }
    this.game.events?.emit('rail.hazard', { kind: h.kind, passed, near, side: dx >= 0 ? 1 : -1, all, by: 'courier' });
  }
  /** Every arch of a leg threaded: the next fighting leg sailed below (the Light Whale's dive's form and pay), by a hull that dives. */
  find() {
    const trip = this.st.trip; if (!trip?.active || trip.hidden || !SHIPS[trip.state?.ship]?.dive) return;
    trip.hidden = { form: ENCOUNTER.dive.form, pays: ENCOUNTER.dive.pays, k: null };
  }

  /** The ring run: each ring of a turn the hull passes inside pays; all of a turn's mend. */
  rings(ship) {
    const S = this.st, R = S.rail, C = CROSSING_LOOK.rings, s = R.speed * S.t + ship.z, was = this.sAt; this.sAt = s;
    if (was == null || s <= was || s - was > R.speed) return; // (a jump of the clock, a second's way or more, threads nothing)
    (R.path.turns || []).forEach((t, ti) => {
      if (t.at + t.len < was || t.at > s) return;
      for (let i = 0; i < C.per; i++) {
        const at = t.at + (t.len * (i + 0.5)) / C.per; if (at <= was || at > s) continue;
        const n = this.turn.get(ti) || 0, inside = Math.hypot(ship.x, ship.y - (CRUISE + C.up)) <= C.r;
        if (inside) { this.turn.set(ti, n + 1); S.run.score += RING_RUN.pays; this.game.lachryma?.gain(RING_RUN.pool, 'ring'); }
        const all = inside && n + 1 === C.per;
        if (all) { S.run.score += RING_RUN.all.pays; S.trip?.mend?.(RING_RUN.all.mend); }
        if (inside) this.game.events?.emit('rail.ring', { all, by: 'courier' });
      }
    });
  }
}
