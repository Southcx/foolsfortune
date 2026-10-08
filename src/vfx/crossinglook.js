// ---------------------------------------------------------------------------------------
// THE CROSSING'S LOOK AS IT PLAYS: Calissa's storm looks laid on Petra's crossing (world/emocean/stage.js, triprun.js) and the trip's
// pressures shown as marks with no numbers (docs/plans/RAIL-OVERHAUL.md sections 4, 5 and 8; PASSAGE.md 14). The stage builds it with
// the sea and calls it once a frame; it reads the stage (the rail, the ship, the run, the trip's leg) and never changes what is played.
//
//   THE STORM     the storm warp's strength (vfx/stormwarp.js) from the leg as it is sailed: its phase (open, build, peak, release;
//                 a calm and an encounter quiet), a squall's waypoint a step stronger, the waypoint's feeling and strength as the
//                 storm's weather, the Courier's mental state (the warp's own: courier/mind.js); strongest in a turn of the rail.
//                 The setting `visual.warp` and the danger kept true are the warp's own (stormwarp.js)
//   THE UMBRAL    the ship in the Umbral form is under the Emocean: the DRAWN surface rises over the fight (vfx/crudesea.js `lift`: the
//                 logic's sea, its swells and everything riding it stay where they are) until the eye is under it too, so the
//                 meniscus, the deep's column and the caustics are the Umbral's own (vfx/umbral.js); a dive is the surface sweeping up
//                 past the ship and the lens (the splash where it meets the hull, the surface's line wiped across the lens), a breach
//                 the same down. It keeps over the eye whatever the view (rising fast when the camera climbs)
//   THE SURGE     R: the lances go at once (the shots' Itano ribbons, vfx/itano.js) and while the ship is untouchable a SHELL OF LIGHT
//                 turns round it: three great circles of a sphere, in the form's light, fading as the half bar runs out
//   THE GEOMETRY  the ambient geometry (vfx/railgeometry.js) hung on the spline: RINGS threaded through each turn of the rail (each on
//                 the heartline, square to the path where it stands: the ship flies through them and lights them), MONOLITHS rising
//                 out of the crude on the flanks of a fight leg; laid ahead as the rail comes to them, put down behind
//   THE WAKE      on the sea along the legs, and left in the air along a turn's figure (vfx/rail.js ShipWake `air`); none under the surface
//   THE PRESSURES the hull's cracks on the sloop as hits carry leg to leg (vfx/sloop.js scars: dark seams with the crude in them), and
//                 the gold they turn to when a haven caulks them; the bunker as a Lachrymato Bottle on the deck (vfx/bottle.js), its
//                 level the fuel left (never a number, never the word tank); adrift, the current's streaks running past the ship in the
//                 way it is carried. (On the sea chart, a waypoint's feeling, the squall's flame and a following sea are the chart's
//                 own look: ui/seachart/seachart.js.)
//
// Prior art: Rez's areas (the world's intensity following the music's layers, the wire rings flown through), Star Fox 64's rings in the
// loops, Ecco the Dolphin's and Abzu's surface (the line of the sea crossing the lens), Panzer Dragoon's Berserk (the shell round the
// dragon while it is untouchable), FTL's hull and fuel read off the ship itself, Splatoon's ink tank as a gauge worn on the body.
//
//   const L = new CrossingLook(stage)   L.build(scene) (after the sea and the ship)   L.parked() -> [objects] (the warm-up)   L.show(on)
//   L.begin() (a crossing cast off)   L.update(rawDt, bar) (once a frame, after the camera, before the sea)   L.end() (landed or broken)
//   CROSSING_LOOK   the numbers: the storm by phase, the lift, the shell, the rings and slabs, the streaks
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MarkBuffer, STYLE } from './railmark.js';
import { RailGeometry } from './railgeometry.js';
import { warpMaterial, keepTrue } from './stormwarp.js';
import { LachrymatoBottle } from './bottle.js';
import { CRUISE } from '../courier/ship/views.js';
import { BAR_S } from '../progress/rail/crossing.js';

export const CROSSING_LOOK = {
  /** The storm's strength (0..1) by the leg's phase, a calm's and an encounter's, a squall's step and a turn of the rail's least. */
  storm: { launch: 0.2, open: 0.25, build: 0.45, peak: 0.7, release: 0.3, calm: 0.08, encounter: 0.15, squall: 0.25, turn: 0.85 },
  /** The Umbral's drawn surface: at least `least` metres over the rail's sea, and `over` metres over the eye; eased at `rate` (a dive
   *  goes through in about half a bar), raised at `chase` when the eye would come out of it. */
  lift: { least: 7.5, over: 2.6, rate: 4, chase: 14 },
  /** The surge's shell: real seconds (Ship's SURGE.mercy), radius (m, about the 1.7 m ship), three great circles of 24 segments. */
  shell: { time: 1.1, r: 1.3, circles: 3, segs: 24, width: 0.04 },
  /** The rings in a turn of the rail: how many, their radius (m), how far ahead they are hung (m); the slabs on a fight leg's flanks. */
  rings: { per: 5, r: 3.2, up: 0.6, ahead: 280, behind: 40 }, // (up: above the heartline, so the ring clears the swells under it)
  slabs: { per: 10, ahead: 240, side: [16, 34], height: [12, 26], behind: 60 },
  /** Adrift: the current's streaks, how many, how fast they overtake the ship (m/s), their length (m). */
  drift: { n: 24, speed: 14, len: 3.2 },
};

const C = CROSSING_LOOK;
const SHELL_LIGHT = { astral: new THREE.Color(1.0, 0.86, 0.55), umbral: new THREE.Color(0.66, 0.56, 1.0) };
const CURRENT = new THREE.Color(0.55, 0.62, 0.85);
const damp = THREE.MathUtils.damp;
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(), _x = new THREE.Vector3(), _w = new THREE.Vector3(), _l = new THREE.Vector3();
const _u = new THREE.Vector3(), _v = new THREE.Vector3(), _n = new THREE.Vector3(), _prevVel = new THREE.Vector3(), _acc = new THREE.Vector3();
const PTS = Array.from({ length: C.shell.segs + 3 }, () => new THREE.Vector3());
/** A number 0..1 of a number (the same every time: where a slab stands is the rail's, never the frame's chance). */
const hash = (x) => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export class CrossingLook {
  constructor(stage) {
    this.st = stage; this.game = stage.game;
    this.lift = 0; this.side = 0; this.shellT = 0; this.shellForm = 'astral'; this.gilt = 0; this.hitsWas = 0;
    this.rings = []; this.slabs = []; this.plan = { rings: [], slabs: [] }; this.prevShip = new THREE.Vector3(); this.hasPrev = false;
    this.streaks = Array.from({ length: C.drift.n }, (_, i) => ({ x: (hash(i) - 0.5) * 22, y: 0.3 + hash(i + 7) * 1.8, z: -20 + hash(i + 13) * 100 }));
    this.game.events?.on?.('rail.surge', () => { this.shellT = C.shell.time; this.shellForm = this.st.ship?.form || 'astral'; });
  }

  /** At boot, after the sea and the ship: the marks (the rail's mark program), the geometry, the bottle on the deck. */
  build(scene) {
    const st = this.st;
    this.marks = new MarkBuffer(C.shell.circles * C.shell.segs + C.drift.n + 8, { renderOrder: 42 });
    keepTrue(this.marks.mat); this.marks.mesh.visible = false; scene.add(this.marks.mesh);
    for (const m of st.trip?.field?.meshes || []) keepTrue(m.material); // (the shot field's shots: the danger, never moved by the veil)
    if (st.trip?.field?.look) st.trip.field.look.camera ||= this.game.camera; // (its sort's eye and its beams' near limit before its first draw)
    this.geo = new RailGeometry({ env: this.game.sky?.env || null, seaY: st.sea?.y ?? 0, warp: warpMaterial, keepTrue, maxRings: 32, maxMonoliths: 16 });
    this.geo.group.visible = false; scene.add(this.geo.group);
    // one of each, parked for the warm-up's compile (casebook 17: a program first drawn in play is a hitch); put down at the first cast-off
    this.parkedRing = this.geo.ring(new THREE.Vector3(0, -1e4, 0), new THREE.Quaternion(), 1);
    this.parkedSlab = this.geo.monolith(new THREE.Vector3(0, -1e4, 0), { height: 4, rise: 1 });
    // the bunker: a Lachrymato Bottle stood on the deck aft of the mast (the sloop's own frame: +Z the bow, 7 m long)
    const body = st.ship?.sloop?.body;
    if (body) {
      this.bottle = new LachrymatoBottle({ size: 'large' });
      this.bottle.group.scale.setScalar(5.2); this.bottle.group.position.set(0.55, 0.38, 0.05); this.bottle.group.rotation.y = 0.5;
      this.bottle.group.visible = false; body.add(this.bottle.group);
    }
  }
  parked() { return [this.marks.mesh, this.geo.group]; }
  show(on) {
    this.marks.mesh.visible = on; this.geo.group.visible = on;
    if (this.bottle) this.bottle.group.visible = on && this.st.stage.fuel != null;
  }

  /** A crossing cast off: the rings and slabs laid out along the rail's turns and legs (hung when the rail comes to them). */
  begin() {
    this.parkedRing?.dispose(); this.parkedSlab?.dispose(); this.parkedRing = this.parkedSlab = null;
    this.clear();
    const st = this.st, R = st.rail, sp = R.speed, rings = [], slabs = [];
    for (const t of R.path.turns || []) for (let i = 0; i < C.rings.per; i++) rings.push({ s: t.at + (t.len * (i + 0.5)) / C.rings.per, h: null });
    const T = st.trip, BAR = BAR_S;
    if (T?.active && T.layout) T.layout.legs.forEach((L, k) => {
      const leg = T.legs[k]; if (!leg?.plan) return; // (a calm and an encounter: open water)
      for (let i = 0; i < C.slabs.per; i++) {
        const u = hash(k * 17 + i), s = (L.at + (L.end - L.at) * (i + 0.5) / C.slabs.per) * BAR * sp, side = hash(k * 31 + i * 3) < 0.5 ? -1 : 1;
        slabs.push({ s, x: side * (C.slabs.side[0] + u * (C.slabs.side[1] - C.slabs.side[0])), h: C.slabs.height[0] + hash(k + i * 5) * (C.slabs.height[1] - C.slabs.height[0]), yaw: u * 6.28, hd: null });
      }
    });
    this.plan = { rings, slabs };
    this.lift = 0; this.side = 0; this.shellT = 0; this.gilt = 0; this.hitsWas = 0; this.hasPrev = false;
  }
  clear() {
    for (const r of this.plan.rings) { r.h?.dispose(); r.h = null; }
    for (const s of this.plan.slabs) { s.hd?.dispose(); s.hd = null; }
  }
  /** Landed or broken: the geometry put down, the surface back at the sea, the hull and the deck as they were. */
  end() {
    this.clear(); this.plan = { rings: [], slabs: [] };
    this.lift = 0; if (this.st.sea) this.st.sea.lift = 0; this.shellT = 0;
    this.st.ship?.sloop?.scars?.({ open: 0, gilt: 0 });
    this.marks.count = 0; this.marks.flush();
  }

  /** Once a frame (after the camera is placed, before the sea is drawn). */
  update(raw, bar) {
    if (!this.st.stage.active || !this.st.run) return;
    const s = this.st.rail.speed * this.st.t, turning = this.st.rail.path.turning(s);
    this.storm(bar, turning);
    this.umbral(raw);
    this.geometry(raw, s);
    this.pressures(raw);
    this.wake(raw, turning);
    let k = this.shell(raw, 0);
    k = this.adrift(raw, k);
    this.marks.time(this.st.t); this.marks.count = k; this.marks.flush();
  }

  // ---------------------------------------------------------------- the storm
  storm(bar, turning) {
    const st = this.st, W = this.game.stormWarp; if (!W) return;
    const T = st.trip, S = C.storm;
    let s = S.launch, weather;
    if (T?.active && T.k >= 0) {
      const L = T.layout.legs[T.k], leg = T.legs[T.k], w = T.wps[T.k], rel = bar - L.at;
      const ph = leg.plan?.phases.find((p) => rel >= p.from && rel < p.to);
      s = leg.type === 'calm' ? S.calm : leg.type === 'encounter' ? S.encounter : S[ph?.id] ?? S.open;
      if (w.storm) s = Math.min(1, s + S.squall);
      weather = w.feel ? { aspect: w.feel, strength: Math.min(1, (w.strength ?? 1) / 4) } : 0;
    } else if (!T?.active) { s = st.piece ? 0.45 : 0.2 * (1 - (st.calm ?? 0)); weather = this.game.weather?.at?.(st.to) ?? 0; } // (a direct hop: the set piece's storm, quieter in the breathers)
    if (turning) s = Math.max(s, S.turn);
    W.set(weather === undefined ? { storm: s } : { storm: s, weather });
  }

  // ---------------------------------------------------------------- the Umbral
  umbral(raw) {
    const st = this.st, sea = st.sea, cam = this.game.camera, sl = st.ship?.sloop; if (!sea || !cam) return;
    const under = st.ship.form === 'umbral', L = C.lift;
    const want = under ? Math.max(L.least, cam.position.y - sea.y + L.over) : 0;
    const chase = under && want - this.lift > 1 && this.lift > L.least * 0.6; // (the dive done and the camera climbing: keep the eye under)
    this.lift = damp(this.lift, want, chase ? L.chase : L.rate, raw);
    if (!under && this.lift < 0.01) this.lift = 0;
    sea.lift = this.lift;
    if (!sl) return;
    sl.group.getWorldPosition(_p);
    const d = _p.y - sea.surfaceAt(_p.x, _p.z), side = d > 0.25 ? 1 : d < -0.25 ? -1 : this.side; // (a quarter metre either way: the swells never splash it twice)
    if (this.side && side !== this.side) this.game.umbral?.splash(_p, { power: 1, dive: side < 0 });
    this.side = side;
  }

  // ---------------------------------------------------------------- the ambient geometry on the spline
  geometry(raw, s) {
    const st = this.st, R = st.rail, G = this.geo, sea = st.sea, sl = st.ship?.sloop;
    for (const r of this.plan.rings) {
      if (!r.h && r.s > s - 5 && r.s < s + C.rings.ahead) {
        R.path.at(r.s, _p, _q); _up.set(0, 1, 0).applyQuaternion(_q); _p.addScaledVector(_up, CRUISE + C.rings.up); // (on the heartline, the cruise height, a little over it)
        r.h = G.ring(_p, _q, C.rings.r);
      } else if (r.h && r.s < s - C.rings.behind) { r.h.dispose(); r.h = null; }
    }
    for (const b of this.plan.slabs) {
      if (!b.hd && b.s > s && b.s < s + C.slabs.ahead) {
        R.path.at(b.s, _p, _q); _x.set(-1, 0, 0).applyQuaternion(_q); _x.y = 0; _x.normalize(); // (across: the rail's local x is the world's -x at no turn)
        _p.addScaledVector(_x, b.x); _p.y = sea?.y ?? _p.y;
        b.hd = G.monolith(_p, { height: b.h, yaw: b.yaw, rise: 0 });
      } else if (b.hd && b.s < s - C.slabs.behind) { b.hd.dispose(); b.hd = null; }
      if (b.hd && b.s < s + C.slabs.ahead * 0.7) b.hd.set({ rise: 1 });
    }
    // a ring flown through lights (the ship's world place last frame to this one)
    if (sl) {
      sl.group.getWorldPosition(_w);
      if (this.hasPrev) for (const r of this.plan.rings) if (r.h && r.h.litTo < 1) r.h.crossed(this.prevShip, _w);
      this.prevShip.copy(_w); this.hasPrev = true;
    }
    G.update(raw, { camera: this.game.camera });
  }

  // ---------------------------------------------------------------- the trip's pressures on the ship
  pressures(raw) {
    const st = this.st, r = st.run, sl = st.ship?.sloop; if (!sl || !r) return;
    if (r.hits < this.hitsWas) this.gilt += this.hitsWas - r.hits; // (caulked: the hits a haven or a coin mended turn to gold)
    this.hitsWas = r.hits;
    sl.scars?.({ open: r.bears ? r.hits / r.bears : 0, gilt: r.bears ? this.gilt / r.bears : 0 });
    const B = this.bottle; if (!B) return;
    const fuel = st.stage.fuel;
    B.group.visible = fuel != null && sl.group.visible;
    if (!B.group.visible) return;
    B.set({ fill: fuel });
    const v = st.ship.vel; _acc.copy(v).sub(_prevVel).divideScalar(Math.max(raw, 1e-3)); _prevVel.copy(v); // (the slosh: the ship's own pushes, in the rail's frame)
    st.rail.dirWorld(_acc, _w);
    B.update(raw, _w);
  }

  // ---------------------------------------------------------------- the wake
  wake(raw, turning) {
    const st = this.st, sl = st.ship?.sloop, W = st.wake; if (!sl || !W) return;
    const dry = this.lift < 0.3; // (under the surface there is no foam)
    for (const ln of W.lines) ln.m.visible = dry && st.sea.mesh.visible;
    W.update(raw, { group: sl.group, speed: st.rail.speed + st.ship.boostZ, length: 7 * sl.group.scale.x, beam: 2.4 * sl.group.scale.x, air: turning }, st.sea);
  }

  // ---------------------------------------------------------------- the surge's shell
  /** Three great circles of light turning round the ship while the surge keeps it untouchable; returns the marks written. */
  shell(raw, k) {
    if (this.shellT <= 0) return k;
    this.shellT = Math.max(0, this.shellT - raw);
    const S = C.shell, sl = this.st.ship?.sloop; if (!sl) return k;
    const age = S.time - this.shellT, a = Math.min(1, age / 0.08) * Math.min(1, this.shellT / 0.35), r = S.r * (1 + 0.12 * Math.min(1, age / 0.2));
    const col = SHELL_LIGHT[this.shellForm] || SHELL_LIGHT.astral, M = this.marks;
    sl.group.getWorldPosition(_p);
    for (let c = 0; c < S.circles; c++) {
      const tilt = c * (Math.PI / S.circles) + age * 1.6, lean = 0.6 + 0.3 * c;
      _n.set(Math.cos(tilt) * Math.sin(lean), Math.cos(lean), Math.sin(tilt) * Math.sin(lean)).normalize();
      _u.set(0, 1, 0).cross(_n); if (_u.lengthSq() < 1e-6) _u.set(1, 0, 0); _u.normalize(); _v.crossVectors(_n, _u);
      for (let i = 0; i < S.segs + 3; i++) { const t = ((i - 1) / S.segs) * Math.PI * 2 + age * (c % 2 ? -2.2 : 2.2); PTS[i].copy(_p).addScaledVector(_u, Math.cos(t) * r).addScaledVector(_v, Math.sin(t) * r); }
      for (let i = 1; i <= S.segs; i++) {
        const A = PTS[i], B = PTS[i + 1], P = PTS[i - 1], N = PTS[i + 2];
        M.put(k++, A.x, A.y, A.z, S.width, B.x, B.y, B.z, S.width, P.x, P.y, P.z, a, N.x, N.y, N.z, a, STYLE.ribbon, col.r, col.g, col.b);
      }
    }
    return k;
  }

  // ---------------------------------------------------------------- adrift
  /** The current carrying the ship: pale streaks low over the crude, overtaking it in the way it is carried (the rail's frame). */
  adrift(raw, k) {
    const st = this.st, on = !!st.stage.adrift;
    this.driftK = damp(this.driftK ?? 0, on ? 1 : 0, 2, raw);
    if (this.driftK < 0.01) return k;
    const D = C.drift, R = st.rail, M = this.marks;
    for (const q of this.streaks) {
      q.z += D.speed * raw; if (q.z > 80) q.z -= 100;
      const fade = this.driftK * Math.min(1, (q.z + 20) / 15) * Math.min(1, (80 - q.z) / 15) * 0.7;
      R.toWorld(_l.set(q.x, q.y, q.z), _w); R.toWorld(_l.set(q.x, q.y, q.z + D.len), _p);
      M.put(k++, _w.x, _w.y, _w.z, 0.03, _p.x, _p.y, _p.z, 0.03, _w.x, _w.y, _w.z, 0, _p.x, _p.y, _p.z, fade, STYLE.ribbon, CURRENT.r, CURRENT.g, CURRENT.b);
    }
    return k;
  }
}
