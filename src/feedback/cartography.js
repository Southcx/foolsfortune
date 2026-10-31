// ---------------------------------------------------------------------------------------
// MIND MAPPING (psychic cartography). The world is mapped in cells (2 m indoors, 8 m out on the dunes), one
// grid per LAYER (the dunes, the basement, the ground floor, the upper floor). Every cell holds
// how well the courier KNOWS it, k in 0..1, and whether it is wall:
//
//   0    unknown                        (nothing works there)
//   1    SENSED    k >= .08              walking past it: the hand can lift things there
//   2    CHARTED   k >= .45              lingering nearby (passive knowledge stops at .5)
//   3    UNDERSTOOD k >= .85             only a SURVEY does this: a psychic pulse (the Dreamvane's MMB; N in the hand) that sees
//                                        everything in line of sight, out to 14 m (20 from the jar)
//
// The EXPLORED AREA is where the god arts may be used: each art needs a tier of knowledge of
// the ground it is used on (see godhand/arts.js). Around the jar there is always a small charted
// zone. The more of a place you have walked and surveyed, the more you can do in it, and the
// higher its tier, the deeper the arts that work there.
//
// The map screen (M) is feedback/mapscreen.js, its look ui/mapdress/: it reads the cells, the anchors and the thread kept here.
// Ariadne's Thread (a knack, progress/knacks.js): the way walked since the last Shrine rested at, a point every 3 m, a loop cut off
// where the way crosses itself (so it is the way back, not the way wandered), drawn on the map from you to that Shrine; switched off,
// nothing is drawn. Prior art: the thread itself, and Hansel's pebbles; kept for the session only (after a reload, a straight line).
// The Raceway's tracks are handed to the map as roads with their names (`tracksOf`), as a racing game's course map does.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, PALETTE } from '../core/config.js';
import { sfx } from '../audio/sfx.js';
import { zoneOf } from '../render/zonemap.js';
import { MapScreen } from './mapscreen.js';

const LAYERS = [
  { id: 'well', name: 'THE GREAT DUNEMAW', below: -700, cell: 2, sight: 7 }, // (a Well's floor, far below the Dunes: world/well/dunemaw.js)
  { id: 'dunes', name: 'THE DUNES', below: -150, cell: 8, sight: 40 },
  { id: 'basement', name: 'THE BASEMENT', below: -3, cell: 2, sight: 7 },
  { id: 'ground', name: 'GROUND FLOOR', below: 2.6, cell: 2, sight: 7 },
  { id: 'upper', name: 'UPPER FLOOR', below: 1e9, cell: 2, sight: 7 },
  // places at the Dunes' height but not of the Dunes, told apart by their render zone (render/zonemap.js), never by y
  { id: 'raceway', name: 'THE RACEWAY', zone: 'raceway', cell: 8, sight: 40 }, // (the Solar Skiff's test circuit: world/raceway/)
  { id: 'opensea', name: 'THE OPEN SEA', zone: 'opensea', cell: 16, sight: 120 }, // (the Emocean off the lanes: world/opensea/)
  { id: 'margarite', name: "MARGARITE'S DOCK", zone: 'margarite', cell: 2, sight: 7 }, // (the King's island's quay: world/emocean/margarite.js)
  { id: 'bazaar', name: "RAKU'S BAZAAR", zone: 'bazaar', cell: 2, sight: 7 }, // (Raku's casino under its dome: world/bazaar/bazaar.js)
  { id: 'sandbox', name: 'THE SANDBOX', zone: 'sandbox', cell: 2, sight: 7 }, // (the hand's physics room: world/sandbox/sandbox.js)
  { id: 'strawmanwell', name: "STRAWMAN'S WELL", zone: 'strawmanwell', cell: 2, sight: 7 }, // (the 2D platformer's test bench: world/strawmanwell/)
  { id: 'touchstone', name: 'THE TOUCHSTONE', zone: 'touchstone', cell: 2, sight: 7 }, // (the Assay's dark room: world/touchstone/touchstone.js)
];
const BY_ZONE = Object.fromEntries(LAYERS.filter((l) => l.zone).map((l) => [l.zone, l]));
const LAYER_BY_ID = Object.fromEntries(LAYERS.map((l) => [l.id, l]));
const KEY = 'foolsfortune.map.v1';
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
const staticOnly = (c) => !c.isSensor() && !c.parent()?.isDynamic();



export class Cartography {
  constructor(game) {
    this.game = game;
    this.cells = Object.fromEntries(LAYERS.map((l) => [l.id, new Map()]));
    this.anchors = []; // { name, tag, x, y, z, layer, covered }
    this.thread = []; // (Ariadne's Thread: { x, y, z } walked since the last rest)
    for (const n of ['shrine.rest', 'shrine.travel']) game.events?.on(n, () => { this.thread.length = 0; }); // (travel makes that Shrine the last)
    this.tickT = 0;
    this.saveT = 0;
    this.dirty = false;
    this.pulses = [];
    this.pulseCool = 0;
    this.stats = { charted: 0, understood: 0 };
    this.keep = game.save?.keyed?.(KEY, 'player') || null; // (the explored area, too big for the player's record: its own key, through the save)
    this.load();
    this.screen = new MapScreen(game, this); // (the map screen, M: feedback/mapscreen.js)
    this.buildPulseFx();
  }

  // ------------------------------------------------------------------ layers, cells
  /** The layer of a point: its render zone's own layer if it has one (the Raceway, Margarite's dock), else by height. Takes a position,
   *  or (y, x, z); a bare y is told by height alone. */
  layerOf(y, x, z) {
    if (y && typeof y === 'object') ({ x, y, z } = y);
    if (x != null) { const zl = BY_ZONE[zoneOf({ x, y, z })]; if (zl) return zl; }
    for (const l of LAYERS) if (l.below != null && y < l.below) return l;
    return LAYER_BY_ID.upper;
  }
  layer(id) { return LAYER_BY_ID[id]; }
  key(ix, iz) { return `${ix},${iz}`; }
  cellIndex(l, x, z) { return [Math.floor(x / l.cell), Math.floor(z / l.cell)]; }
  cell(l, ix, iz, make = false) {
    const m = this.cells[l.id], k = this.key(ix, iz);
    let c = m.get(k);
    if (!c && make) { c = { ix, iz, k: 0, w: 0, h: 0 }; m.set(k, c); }
    return c;
  }
  static tierOfK(k) { const t = T.explored.tiers; return k >= t[2] ? 3 : k >= t[1] ? 2 : k >= t[0] ? 1 : 0; }

  /** What the courier knows about the ground at a point: { tier, k, base } (the god hand's jar charts its own zone). */
  tierAt(x, y, z) {
    const l = this.layerOf(y, x, z);
    const [ix, iz] = this.cellIndex(l, x, z);
    const c = this.cell(l, ix, iz);
    let tier = c ? Cartography.tierOfK(c.k) : 0;
    const g = this.game.god;
    if (g?.active && g.jar.alive) {
      const d = Math.hypot(x - g.jar.pos.x, z - g.jar.pos.z);
      if (d < T.explored.baseRadius && Math.abs(y - g.jar.pos.y) < 6) tier = Math.max(tier, T.explored.baseTier);
    }
    return { tier, k: c?.k || 0 };
  }

  /** Raise a cell's knowledge (never lowers it). Returns true if it crossed into a new tier. */
  learn(l, ix, iz, k, wall, h) {
    const c = this.cell(l, ix, iz, true);
    const before = Cartography.tierOfK(c.k);
    if (k > c.k) { c.k = Math.min(1, k); this.rev = (this.rev || 0) + 1; } // (rev: the map is drawn again only when something on it changed)
    if (wall && !c.w) { c.w = 1; this.rev = (this.rev || 0) + 1; }
    if (h !== undefined && !c.h) c.h = h;
    if (c.k > 0.02) this.dirty = true;
    const after = Cartography.tierOfK(c.k);
    if (after > before) {
      if (after >= 2 && before < 2) this.stats.charted++;
      if (after >= 3 && before < 3) this.stats.understood++;
      return true;
    }
    return false;
  }

  /** A point seen in a photograph (the Veritome): its cell, and those round it, are charted. */
  chartAt(p) {
    const l = this.layerOf(p), [ix, iz] = this.cellIndex(l, p.x, p.z);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) this.learn(l, ix + dx, iz + dz, dx || dz ? 0.3 : 0.5, false, p.y);
  }

  // ------------------------------------------------------------------ anchors (named places)
  addAnchor(name, tag, pos, layerId = null) {
    const l = layerId ? LAYER_BY_ID[layerId] : this.layerOf(pos);
    this.anchors.push({ name, tag, x: pos.x, y: pos.y, z: pos.z, layer: l.id, cov: 0, done: false });
  }

  /** The nearest named place on this layer within `max` metres. */
  roomAt(x, y, z, max = 30) {
    const l = this.layerOf(y, x, z);
    let best = null, bd = max;
    for (const a of this.anchors) {
      if (a.layer !== l.id) continue;
      const d = Math.hypot(a.x - x, a.z - z);
      if (d < bd) { bd = d; best = a; }
    }
    return best;
  }

  // ------------------------------------------------------------------ learning by looking
  /** Can something at `from` see the cell at (x, z)? Returns 0 blocked, 1 seen, 2 the cell is a wall face. */
  sees(from, x, z, y, l) {
    const g = this.game, phys = g.physics;
    _v.set(x - from.x, (y + 0.9) - from.y, z - from.z);
    const d = _v.length();
    if (d < 0.5) return 1;
    _v.divideScalar(d);
    const hit = phys.raycast(from, _v, d, g.player.collider, undefined, staticOnly);
    if (!hit) return 1;
    return d - hit.distance < l.cell * 0.55 ? 2 : 0; // (the ray ended in the cell itself: a wall)
  }

  /** While a menu has the game paused (the map redraws, pans and zooms). */
  tickModal() { this.screen.tick(); }
  get open() { return this.screen.open; }
  show() { this.screen.show(); }
  hide() { this.screen.hide(); }
  toggle() { this.screen.toggle(); }
  /** The Sight's waypoint on the chart's layers ({ x, z, layer }): the map keeps no mark of its own (MAP.md 3); the wire compass reads it. */
  get waypoint() { const w = this.game.sight?.waypoint; return w?.pos ? { x: w.pos.x, z: w.pos.z, layer: this.layerOf(w.pos).id } : null; }

  update(dt) {
    const g = this.game, P = g.player;
    this.pulseCool -= dt;
    this.stepPulses(dt);
    this.tickT -= dt;
    if (this.tickT <= 0) { this.tickT = 0.16; this.passive(0.16); this.spool(P.pos); }
    if (this.dirty && (this.saveT -= dt) <= 0) { this.saveT = 6; this.save(); }
    this.headYaw = g.god?.controlling ? g.god.cam.yaw + Math.PI : P.yaw; // (the view's own facing: the map's arrow)
    this.screen.tick();
  }

  /** Ariadne's Thread: a point every 3 m; where the way comes back within 3 m of an older point, the loop between is cut. */
  spool(p) {
    if (this.game.realm?.active) return;
    const T = this.thread, last = T[T.length - 1];
    if (last && Math.hypot(p.x - last.x, p.z - last.z) < 3 && Math.abs(p.y - last.y) < 3) return;
    for (let i = 0; i < T.length - 2; i++) if (Math.hypot(p.x - T[i].x, p.z - T[i].z) < 3 && Math.abs(p.y - T[i].y) < 3) { T.length = i; break; }
    T.push({ x: p.x, y: p.y, z: p.z });
    if (T.length > 800) T.splice(0, T.length - 800); // (a very long way: its oldest end let go)
  }


  /** The Raceway's tracks as roads for the map: a point every 10 m (`raceway.local` to the world) at its half width, taken once (a track
   *  never moves). */
  tracksOf() {
    const R = this.game.raceway; if (!R?.tracks?.length) return [];
    return (this.trackPts ||= R.tracks.map((T) => { const pts = []; for (let s = 0; s < T.length; s += 10) { const F = T.frame(s), p = R.local(F.x, F.z); pts.push({ x: p.x, z: p.z, w: F.w }); } return { name: T.name || T.id, pts }; }));
  }

  /** Walking about: what is near and in sight is slowly sensed, and charted with a little time (never past .5). */
  passive(dt) {
    const g = this.game, P = g.player, Z = T.explored;
    if (g.god?.controlling && g.god.state !== 'on') return;
    if (g.realm?.active) return; // (the Spirit Garden is not ground you explore: never charted, GARDEN-SWEEP #8)
    const l = this.layerOf(P.pos), cs = l.cell, R = l.sight;
    const eye = _v2.set(P.pos.x, P.pos.y + 1.3, P.pos.z).clone();
    const cx = Math.floor(P.pos.x / cs), cz = Math.floor(P.pos.z / cs), n = Math.ceil(R / cs);
    const budget = l.id === 'dunes' ? 120 : 64;
    let used = 0;
    for (let dx = -n; dx <= n && used < budget; dx++) {
      for (let dz = -n; dz <= n && used < budget; dz++) {
        const ix = cx + dx, iz = cz + dz;
        const x = (ix + 0.5) * cs, z = (iz + 0.5) * cs;
        const d = Math.hypot(x - P.pos.x, z - P.pos.z);
        if (d > R) continue;
        const c = this.cell(l, ix, iz);
        if (c && c.k >= Z.passiveCap && c.w) continue;
        if (c && c.k >= Z.passiveCap) continue;
        used++;
        const see = this.sees(eye, x, z, P.pos.y, l);
        if (!see) continue;
        const near = 1 - d / R;
        const gain = Z.passiveRate * dt * (0.15 + near * near);
        const cur = c?.k || 0;
        this.learn(l, ix, iz, Math.min(Z.passiveCap, cur + gain), see === 2, P.pos.y);
      }
    }
    this.checkRooms();
  }

  // ------------------------------------------------------------------ the survey pulse
  buildPulseFx() {
    const g = this.game;
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 72), new THREE.MeshBasicMaterial({ forceSinglePass: true, color: PALETTE.hot, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.visible = false;
    g.scene.add(this.ring);
  }

  /** A psychic pulse from the courier (or the god hand's jar): everything in line of sight is understood. */
  survey(byGod = false) {
    const g = this.game, P = g.player, Z = T.explored;
    if (this.pulseCool > 0) return false;
    const l = this.layerOf(P.pos);
    if (!g.lachryma.spend(Z.pulseCost, 'survey')) return false;
    this.pulseCool = Z.pulseCooldown;
    const R = (l.id === 'dunes' ? Z.pulseRadius * 3.2 : byGod ? Z.godPulseRadius : Z.pulseRadius) * (g.psyche?.widen?.('divination.survey') ?? 1);
    const origin = new THREE.Vector3(P.pos.x, P.pos.y + (byGod ? 1.0 : 1.3), P.pos.z);
    // (the cells it will reach, nearest first, so the ring reveals them as it passes)
    const cs = l.cell, n = Math.ceil(R / cs), cx = Math.floor(P.pos.x / cs), cz = Math.floor(P.pos.z / cs);
    const list = [];
    for (let dx = -n; dx <= n; dx++) for (let dz = -n; dz <= n; dz++) {
      const x = (cx + dx + 0.5) * cs, z = (cz + dz + 0.5) * cs, d = Math.hypot(x - P.pos.x, z - P.pos.z);
      if (d <= R) list.push({ ix: cx + dx, iz: cz + dz, x, z, d });
    }
    list.sort((a, b) => a.d - b.d);
    this.pulses.push({ origin, l, R, t: 0, dur: 0.5 + R / 24, list, i: 0, gained: 0, y: P.pos.y });
    this.ring.visible = true;
    sfx.survey?.();
    g.events?.emit('map.pulse', { god: byGod, layer: l.id });
    return true;
  }

  stepPulses(dt) {
    const g = this.game;
    for (let p = this.pulses.length - 1; p >= 0; p--) {
      const s = this.pulses[p];
      s.t += dt;
      const u = Math.min(1, s.t / s.dur), reach = s.R * u;
      let rays = 0;
      while (s.i < s.list.length && s.list[s.i].d <= reach && rays < 160) {
        const c = s.list[s.i++];
        const see = this.sees(s.origin, c.x, c.z, s.y, s.l);
        rays++;
        if (see) { if (this.learn(s.l, c.ix, c.iz, 0.92, see === 2, s.y)) s.gained++; }
      }
      this.ring.position.set(s.origin.x, s.y + 0.15, s.origin.z);
      this.ring.scale.setScalar(Math.max(0.1, reach));
      this.ring.material.opacity = 0.8 * (1 - u) * (1 - u);
      if (u >= 1 && s.i >= s.list.length) {
        this.pulses.splice(p, 1);
        this.ring.visible = this.pulses.length > 0;
        g.events?.emit('map.surveyed', { gained: s.gained, layer: s.l.id });
        this.checkRooms();
      }
    }
  }

  /** Named places whose surroundings are known well enough are understood (once). */
  checkRooms() {
    const Z = T.explored;
    for (const a of this.anchors) {
      if (a.done) continue;
      const l = LAYER_BY_ID[a.layer], cs = l.cell, n = Math.ceil(Z.roomRadius / cs);
      const cx = Math.floor(a.x / cs), cz = Math.floor(a.z / cs);
      let known = 0;
      for (let dx = -n; dx <= n; dx++) for (let dz = -n; dz <= n; dz++) {
        const c = this.cell(l, cx + dx, cz + dz);
        if (c && c.k >= Z.tiers[1]) known++;
      }
      a.cov = Math.min(1, known / Z.roomCells);
      if (a.cov >= 1) {
        a.done = true;
        this.game.events?.emit('map.room', { id: a.tag, place: a.name });
        this.dirty = true;
      }
    }
  }

  // ------------------------------------------------------------------ saving
  save() {
    this.dirty = false;
    try {
      const out = { v: 1, done: this.anchors.filter((a) => a.done).map((a) => a.tag), layers: {} };
      for (const l of LAYERS) {
        const arr = [];
        for (const c of this.cells[l.id].values()) if (c.k > 0.05) arr.push(c.ix, c.iz, Math.round(c.k * 100), c.w ? 1 : 0, Math.round(c.h * 10));
        out.layers[l.id] = arr;
      }
      this.keep?.put(JSON.stringify(out));
    } catch { /* a cell that would not write: this session only */ }
  }

  load() {
    const raw = this.keep?.json();
    if (!raw?.layers) return;
    this.doneTags = new Set(raw.done || []);
    for (const l of LAYERS) {
      const arr = raw.layers[l.id];
      if (!Array.isArray(arr)) continue;
      for (let i = 0; i + 4 < arr.length; i += 5) {
        const c = this.cell(l, arr[i], arr[i + 1], true);
        c.k = arr[i + 2] / 100; c.w = arr[i + 3]; c.h = arr[i + 4] / 10;
        const t = Cartography.tierOfK(c.k);
        if (t >= 2) this.stats.charted++;
        if (t >= 3) this.stats.understood++;
      }
    }
  }

  /** Forget one layer's cells (a Well's floors are laid out afresh each day: world/well/dunemaw.js clears its layer on every run). */
  clear(layerId) { this.cells[layerId]?.clear(); }
  /** How much of the ground inside `rects` ([{ x0, z0, x1, z1 }], world metres) on a layer is CHARTED or better, 0..1. */
  share(layerId, rects) {
    const l = LAYER_BY_ID[layerId], t = T.explored.tiers[1];
    if (!l) return 0;
    let n = 0, known = 0;
    for (const r of rects) {
      for (let ix = Math.floor(r.x0 / l.cell); ix < Math.ceil(r.x1 / l.cell); ix++) for (let iz = Math.floor(r.z0 / l.cell); iz < Math.ceil(r.z1 / l.cell); iz++) {
        n++; const c = this.cell(l, ix, iz); if (c && c.k >= t) known++;
      }
    }
    return n ? known / n : 0;
  }
  /** After the anchors are in: the ones already mapped in an earlier session. */
  restoreAnchors() { if (this.doneTags) for (const a of this.anchors) if (this.doneTags.has(a.tag)) { a.done = true; a.cov = 1; } }


}


// ---------------------------------------------------------------------------------------
// The explored area, drawn on the ground while you are the hand: what is unknown lies under
// a dark veil, what is only sensed under a thin one, and what is understood glows faintly.
// ---------------------------------------------------------------------------------------
export class ExploredVeil {
  constructor(game, carto) {
    this.game = game;
    this.carto = carto;
    this.hcache = new Map();
    this.last = { x: 1e9, z: 1e9, t: 0 };
    const tex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(32, 32, 6, 32, 32, 40);
      grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.72, 'rgba(255,255,255,.9)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
      const t = new THREE.CanvasTexture(c); return t;
    })();
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);
    const mk = (color, opacity, blending = THREE.NormalBlending) => {
      const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false, blending, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), 1400);
      m.count = 0; m.frustumCulled = false; m.renderOrder = 5; m.visible = false;
      game.scene.add(m);
      return m;
    };
    this.veils = [mk(0x120806, 0.62), mk(0x2a140d, 0.3), null, mk(0xffd696, 0.16, THREE.AdditiveBlending)];
    this.m4 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.sc = new THREE.Vector3(); this.p = new THREE.Vector3();
  }

  set visible(v) { for (const m of this.veils) if (m) m.visible = v; }

  groundY(l, ix, iz, refY) {
    const key = `${l.id},${ix},${iz},${Math.round(refY / 3)}`;
    if (this.hcache.has(key)) return this.hcache.get(key);
    const g = this.game, cs = l.cell;
    const hit = g.physics.raycast({ x: (ix + 0.5) * cs, y: refY + 2.2, z: (iz + 0.5) * cs }, { x: 0, y: -1, z: 0 }, 6, null, undefined, staticOnly);
    const y = hit && hit.normal.y > 0.6 ? hit.point.y : null;
    this.hcache.set(key, y);
    return y;
  }

  /** Rebuild the veils around `focus` (a Vector3 on the floor being looked at). */
  update(focus, dt, force = false) {
    this.last.t -= dt;
    const moved = Math.hypot(focus.x - this.last.x, focus.z - this.last.z);
    if (!force && this.last.t > 0 && moved < 1.5) return;
    this.last.x = focus.x; this.last.z = focus.z; this.last.t = 0.5;
    const l = this.carto.layerOf(focus);
    if (l.id === 'dunes') { for (const m of this.veils) if (m) m.count = 0; return; }
    const cs = l.cell, R = 24, n = Math.ceil(R / cs);
    const cx = Math.floor(focus.x / cs), cz = Math.floor(focus.z / cs);
    const counts = [0, 0, 0, 0];
    const G = this.game.god;
    for (let dx = -n; dx <= n; dx++) {
      for (let dz = -n; dz <= n; dz++) {
        const ix = cx + dx, iz = cz + dz;
        const x = (ix + 0.5) * cs, z = (iz + 0.5) * cs;
        if (Math.hypot(x - focus.x, z - focus.z) > R) continue;
        const y = this.groundY(l, ix, iz, focus.y);
        if (y === null) continue;
        const t = this.carto.tierAt(x, y, z).tier;
        const m = this.veils[t];
        if (!m || counts[t] >= 1400) continue;
        this.p.set(x, y + 0.04, z);
        this.sc.set(cs * 1.02, 1, cs * 1.02);
        this.m4.compose(this.p, this.q, this.sc);
        m.setMatrixAt(counts[t]++, this.m4);
      }
    }
    for (let t = 0; t < 4; t++) if (this.veils[t]) { this.veils[t].count = counts[t]; this.veils[t].instanceMatrix.needsUpdate = true; }
  }

  refresh() { this.last.t = 0; this.last.x = 1e9; }
}
