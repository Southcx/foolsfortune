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
// Also here: the
// map screen (M; drag to pan, wheel to zoom, click to set a waypoint, right click to clear it).
// Ariadne's Thread (a knack, progress/knacks.js): the way walked since the last Shrine rested at, a point every 3 m, a loop cut off
// where the way crosses itself (so it is the way back, not the way wandered), drawn on the map from you to that Shrine; switched off,
// nothing is drawn. Prior art: the thread itself, and Hansel's pebbles; kept for the session only (after a reload, a straight line).
// The Raceway's layer draws its tracks as roads with their names at their starts (`drawTracks`), as a racing game's course map does.
// ---------------------------------------------------------------------------------------
import { calibrateButton } from '../ui/calibratebutton.js';
import * as THREE from 'three';
import { T, PALETTE } from '../core/config.js';
import { sfx } from '../audio/sfx.js';
import { FONT } from '../ui/theme.js';
import { zoneOf } from '../render/zonemap.js';

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
];
const BY_ZONE = Object.fromEntries(LAYERS.filter((l) => l.zone).map((l) => [l.zone, l]));
const LAYER_BY_ID = Object.fromEntries(LAYERS.map((l) => [l.id, l]));
const KEY = 'foolsfortune.map.v1';
/** The map on touch: a long press's wait (ms, the choice card's), how far a finger may move and still be one (CSS px), how near the
 *  waypoint a long press clears it (CSS px). */
const MAP_TOUCH = { long: 420, still: 10, reach: 28 };
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
const staticOnly = (c) => !c.isSensor() && !c.parent()?.isDynamic();

const CSS = `
#mapui { position: fixed; inset: 0; z-index: 9; display: none; background: rgba(20,9,6,.9); cursor: grab; user-select: none; font-size: 12px; letter-spacing: .08em; }
#mapui.open { display: block; }
#mapui canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
#mapui .bar { position: absolute; left: 0; right: 0; top: 0; display: flex; gap: 10px; align-items: center; padding: 12px 18px; background: linear-gradient(rgba(20,9,6,.95), rgba(20,9,6,0)); pointer-events: none; }
#mapui .bar > * { pointer-events: auto; }
#mapui h2 { margin: 0; font-size: 18px; letter-spacing: .24em; color: var(--accent); font-weight: normal; flex: 1; }
#mapui button { font: inherit; color: var(--ink); background: rgba(28,13,8,.8); border: 1px solid rgba(255,178,122,.5); padding: 5px 12px; border-radius: 3px; cursor: var(--jcur-pointer, pointer); letter-spacing: .1em; }
#mapui button.on { background: rgba(var(--jsel),.45); border-color: var(--accent); }
#mapui button:hover { background: rgba(var(--jsel),.35); }
#mapui .side { position: absolute; left: 18px; bottom: 16px; padding: 10px 14px; background: rgba(28,13,8,.82); border: 1px solid rgba(255,178,122,.3); border-radius: 4px; max-width: 320px; line-height: 1.6; cursor: default; }
#mapui .side b { color: #fff1dc; font-weight: normal; }
#mapui .side .bar2 { display: inline-block; width: 70px; height: 5px; background: rgba(28,13,8,.9); border: 1px solid rgba(255,178,122,.3); margin: 0 8px; vertical-align: middle; }
#mapui .side .bar2 i { display: block; height: 100%; background: linear-gradient(90deg, #c46a45, #ffe0a0); }
#mapui .legend { position: absolute; right: 18px; bottom: 16px; padding: 8px 12px; background: rgba(28,13,8,.82); border: 1px solid rgba(255,178,122,.3); border-radius: 4px; opacity: .85; }
`;

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

export class Cartography {
  constructor(game) {
    this.game = game;
    this.cells = Object.fromEntries(LAYERS.map((l) => [l.id, new Map()]));
    this.anchors = []; // { name, tag, x, y, z, layer, covered }
    this.waypoint = null; // { x, z, layer }
    this.thread = []; // (Ariadne's Thread: { x, y, z } walked since the last rest)
    for (const n of ['shrine.rest', 'shrine.travel']) game.events?.on(n, () => { this.thread.length = 0; }); // (travel makes that Shrine the last)
    this.tickT = 0;
    this.saveT = 0;
    this.dirty = false;
    this.pulses = [];
    this.pulseCool = 0;
    this.open = false;
    this.view = { layer: 'ground', x: 0, z: 0, scale: 6, follow: true };
    this.stats = { charted: 0, understood: 0 };
    this.keep = game.save?.keyed?.(KEY, 'player') || null; // (the explored area, too big for the player's record: its own key, through the save)
    this.load();
    this.buildMap();
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
    if (k > c.k) c.k = Math.min(1, k);
    if (wall) c.w = 1;
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
  tickModal() { if (this.open) this.drawMap(); }

  update(dt) {
    const g = this.game, P = g.player;
    this.pulseCool -= dt;
    this.stepPulses(dt);
    this.tickT -= dt;
    if (this.tickT <= 0) { this.tickT = 0.16; this.passive(0.16); this.spool(P.pos); }
    if (this.dirty && (this.saveT -= dt) <= 0) { this.saveT = 6; this.save(); }
    this.headYaw = g.god?.controlling ? g.god.cam.yaw + Math.PI : P.yaw; // (the view's own facing: the map's arrow)
    if (this.open) this.drawMap();
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

  /** The thread drawn on the map's layer: from the Shrine rested at, along the way walked, to you. */
  drawThread(c, l, V, P) {
    const s = this.game.shrines, sh = s?.get?.(s.last); if (!sh || !this.game.knacks?.on('ariadnesThread')) return;
    const pts = [sh.pos, ...this.thread, P.pos];
    c.save(); c.strokeStyle = 'rgba(231,196,106,.85)'; c.lineWidth = 2; c.lineJoin = 'round';
    if (!this.thread.length) c.setLineDash([4, 5]); // (after a reload: only the way it lies)
    c.beginPath(); let pen = false, prev = null;
    for (const q of pts) {
      if (this.layerOf(q).id !== l.id) { pen = false; prev = q; continue; }
      if (prev && this.thread.length && q !== pts[1] && Math.hypot(q.x - prev.x, q.z - prev.z) > 30) pen = false; // (a seam or a fall: no line across it)
      const sx = (q.x - V.x) * V.scale, sy = (q.z - V.z) * V.scale;
      if (pen) c.lineTo(sx, sy); else c.moveTo(sx, sy); pen = true; prev = q;
    }
    c.stroke(); c.restore();
  }

  /** The Raceway's tracks on its layer (Dovina's round-six ask): each line as a road at its width, its name at its start. The points are
   *  taken once (a frame every 10 m, `raceway.local` to the world), since a track never moves. */
  drawTracks(c, l, V) {
    const R = this.game.raceway; if (l.id !== 'raceway' || !R?.tracks?.length) return;
    this.trackPts ||= R.tracks.map((T) => { const pts = []; for (let s = 0; s < T.length; s += 10) { const F = T.frame(s), p = R.local(F.x, F.z); pts.push({ x: p.x, z: p.z, w: F.w }); } const F0 = T.frame(T.line), p0 = R.local(F0.x, F0.z); return { name: T.name || T.id, pts, start: { x: p0.x, z: p0.z } }; });
    c.save(); c.lineJoin = c.lineCap = 'round'; c.font = `500 12px ${FONT.ui}`; c.textAlign = 'center';
    for (const [pass, style] of [[0, 'rgba(20,8,4,.7)'], [1, 'rgba(231,196,106,.55)']]) for (const K of this.trackPts) {
      c.strokeStyle = style; c.lineWidth = Math.max(2, 2 * K.pts[0].w * V.scale) + (pass ? 0 : 3);
      c.beginPath(); K.pts.forEach((q, i) => { const sx = (q.x - V.x) * V.scale, sy = (q.z - V.z) * V.scale; if (i) c.lineTo(sx, sy); else c.moveTo(sx, sy); }); c.closePath(); c.stroke();
    }
    for (const K of this.trackPts) { const sx = (K.start.x - V.x) * V.scale, sy = (K.start.z - V.z) * V.scale; c.fillStyle = '#ffe0a0'; c.fillRect(sx - 4, sy - 4, 8, 8); c.fillStyle = 'rgba(251,227,207,.9)'; c.fillText(K.name, sx, sy - 9); }
    c.restore();
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

  /** Paint the known cells of a layer around (x0, z0) into a context whose origin is the view's centre. */
  paint(c, l, x0, z0, scale, S, { cellsOnly = false, halfW = S / 2, halfH = S / 2, rotated = true } = {}) {
    const cs = l.cell, px = cs * scale;
    const nx = Math.ceil(halfW / px) + 2, nz = Math.ceil(halfH / px) + 2;
    const cx = Math.floor(x0 / cs), cz = Math.floor(z0 / cs);
    const R = Math.hypot(halfW, halfH);
    for (let dx = -nx; dx <= nx; dx++) {
      for (let dz = -nz; dz <= nz; dz++) {
        const cell = this.cell(l, cx + dx, cz + dz);
        if (!cell || cell.k < 0.05) continue;
        const wx = (cx + dx) * cs - x0, wz = (cz + dz) * cs - z0;
        const sx = wx * scale, sy = wz * scale;
        const t = Cartography.tierOfK(cell.k);
        c.fillStyle = cell.w ? 'rgba(20,9,6,.95)' : t >= 3 ? 'rgba(255,214,150,.85)' : t === 2 ? 'rgba(214,140,90,.7)' : 'rgba(150,90,60,.45)';
        c.fillRect(sx, sy, px + 0.6, px + 0.6);
        if (cell.w) { c.fillStyle = 'rgba(255,178,122,.35)'; c.fillRect(sx, sy, px + 0.6, Math.max(1, px * 0.18)); }
      }
    }
  }

  // ------------------------------------------------------------------ the map screen
  buildMap() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); // (the map's own rules, with the map: the compass's builder carried them until it was retired, CASEBOOK 2026-10-19)
    const root = el('div');
    root.id = 'mapui';
    this.canvas = document.createElement('canvas');
    root.appendChild(this.canvas);
    this.mctx = this.canvas.getContext('2d');
    const bar = el('div', 'bar');
    bar.appendChild(el('h2', '', 'MAP'));
    this.layerBtns = {};
    for (const l of LAYERS) {
      const b = el('button', '', l.name);
      b.onclick = () => { this.view.layer = l.id; this.view.follow = false; this.centreOnLayer(); };
      bar.appendChild(b);
      this.layerBtns[l.id] = b;
    }
    const close = el('button', '', 'CLOSE (M)');
    close.onclick = () => this.hide();
    bar.appendChild(close);
    root.appendChild(bar);
    this.side = el('div', 'side');
    root.appendChild(this.side);
    root.appendChild(el('div', 'legend', '<span style="opacity:.9">▒</span> sensed &nbsp; <span style="color:#d68c5a">■</span> charted &nbsp; <span style="color:#ffd696">■</span> understood &nbsp; <span style="color:#ffe0a0">◆</span> waypoint<br><span style="opacity:.6">drag · wheel · click sets waypoint · right click clears · the Dreamvane surveys (MMB) · on touch: drag to pan · pinch to zoom · hold to set or clear the waypoint</span>'));
    document.body.appendChild(root);
    this.root = root;
    // pointer events, so a finger works as the mouse does (docs/plans/MOBILE.md 9, M2): a drag pans; two fingers pinch to zoom and pan
    // by their middle; on touch a long press sets the waypoint (on it, clears it) where a click does with the mouse
    root.style.touchAction = 'none';
    this.fingers = new Map();
    root.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (e.pointerType === 'touch') return this.fingerDown(e);
      this.drag = { x: e.clientX, y: e.clientY, moved: 0, button: e.button }; root.style.cursor = 'grabbing';
    });
    addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') return this.fingerUp(e);
      if (!this.open || !this.drag) return;
      const d = this.drag; this.drag = null; root.style.cursor = '';
      if (d.moved < 5 && e.target === this.canvas) this.mark(e.clientX, e.clientY, d.button === 2);
    });
    addEventListener('pointercancel', (e) => { if (e.pointerType === 'touch') this.fingerUp(e, true); });
    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return this.fingerMove(e);
      if (!this.open || !this.drag) return;
      const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
      this.drag.moved += Math.abs(dx) + Math.abs(dy);
      this.drag.x = e.clientX; this.drag.y = e.clientY;
      this.pan(dx, dy);
    });
    root.addEventListener('wheel', (e) => { e.preventDefault(); e.stopPropagation(); this.view.scale = THREE.MathUtils.clamp(this.view.scale * Math.exp(-e.deltaY * 0.0012), 0.5, 40); }, { passive: false });
    root.addEventListener('contextmenu', (e) => e.preventDefault());
    // (M opens and closes it, here, in the key's own event: closing hands the mouse back with a pointer lock request, which the
    // browser only grants inside a user gesture. Handling it a frame later in the game loop is what lost the mouse before.)
    addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const g = this.game, tag = document.activeElement?.tagName;
      if (this.open && (e.code === 'KeyM' || e.code === 'Escape')) { this.hide(); e.preventDefault(); e.stopImmediatePropagation(); return; } // (spent: the pause menu does not open under it, GARDEN-SWEEP #9)
      if (!this.open && e.code === 'KeyM' && g.input.enabled && tag !== 'INPUT' && tag !== 'TEXTAREA' && !(g.windowOpen ? g.windowOpen() : g.codex?.open || g.indexMenu?.open)) { this.show(); e.preventDefault(); }
    });
  }

  toggle() { this.open ? this.hide() : this.show(); }

  /** The view moved by a drag of (dx, dy) CSS px. */
  pan(dx, dy) { this.view.x -= dx / this.view.scale; this.view.z -= dy / this.view.scale; this.view.follow = false; }
  /** The waypoint set where (x, y) is on screen, or cleared. */
  mark(x, y, clear = false) {
    const p = this.screenToWorld(x, y);
    this.waypoint = clear ? null : { x: p.x, z: p.z, layer: this.view.layer };
    sfx.click?.();
  }
  // ---- fingers (MAP_TOUCH: the long press's wait and its stillness, the waypoint's reach for a clear)
  fingerDown(e) {
    if (!this.open || this.fingers.size >= 2) return;
    this.fingers.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now() });
    const L = this.game.touchUI?.longPress;
    clearTimeout(this.pressT); L?.cancel();
    if (this.fingers.size === 1 && e.target === this.canvas) {
      L?.show(e.clientX, e.clientY, { ms: MAP_TOUCH.long });
      this.pressT = setTimeout(() => this.longPress(e.pointerId), MAP_TOUCH.long);
    }
  }
  fingerMove(e) {
    const f = this.fingers.get(e.pointerId); if (!f || !this.open) return;
    const others = [...this.fingers.entries()].filter(([id]) => id !== e.pointerId);
    if (others.length) { // (two fingers: the pinch about their middle, and their middle's drag)
      const o = others[0][1], d0 = Math.hypot(f.x - o.x, f.y - o.y) || 1, d1 = Math.hypot(e.clientX - o.x, e.clientY - o.y) || 1;
      this.view.scale = THREE.MathUtils.clamp(this.view.scale * (d1 / d0), 0.5, 40);
      this.pan((e.clientX - f.x) / 2, (e.clientY - f.y) / 2);
    } else this.pan(e.clientX - f.x, e.clientY - f.y);
    f.x = e.clientX; f.y = e.clientY;
    if (Math.hypot(f.x - f.x0, f.y - f.y0) > MAP_TOUCH.still) { clearTimeout(this.pressT); this.game.touchUI?.longPress?.cancel(); }
  }
  fingerUp(e, cancel = false) {
    if (!this.fingers.delete(e.pointerId)) return;
    clearTimeout(this.pressT); if (!cancel) this.game.touchUI?.longPress?.cancel();
  }
  /** A finger held still: the waypoint set there, or cleared if it was on it. */
  longPress(id) {
    const f = this.fingers.get(id); if (!f || !this.open || this.fingers.size !== 1) return;
    const W = this.waypoint, at = W && W.layer === this.view.layer ? this.worldToScreen(W.x, W.z) : null;
    this.mark(f.x, f.y, !!at && Math.hypot(at.x - f.x, at.y - f.y) < MAP_TOUCH.reach);
  }

  show() {
    const P = this.game.player, l = this.layerOf(P.pos);
    this.open = true;
    this.root.classList.add('open');
    document.exitPointerLock?.();
    this.view.layer = l.id; this.view.x = P.pos.x; this.view.z = P.pos.z; this.view.follow = true;
    this.view.scale = l.id === 'dunes' ? 1.2 : 6;
    this.resize();
    this.drawMap();
  }

  hide() {
    if (!this.open) return;
    this.open = false;
    this.root.classList.remove('open');
    this.onClose?.();
  }

  centreOnLayer() {
    const l = LAYER_BY_ID[this.view.layer];
    const cells = [...this.cells[l.id].values()];
    if (cells.length) {
      let sx = 0, sz = 0;
      for (const c of cells) { sx += (c.ix + 0.5) * l.cell; sz += (c.iz + 0.5) * l.cell; }
      this.view.x = sx / cells.length; this.view.z = sz / cells.length;
    }
    this.view.scale = l.id === 'dunes' ? 1.2 : 6;
  }

  resize() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    this.canvas.width = Math.round(innerWidth * dpr); this.canvas.height = Math.round(innerHeight * dpr);
    this.dpr = dpr;
  }

  screenToWorld(sx, sy) {
    return { x: this.view.x + (sx - innerWidth / 2) / this.view.scale, z: this.view.z + (sy - innerHeight / 2) / this.view.scale };
  }
  worldToScreen(x, z) { return { x: innerWidth / 2 + (x - this.view.x) * this.view.scale, y: innerHeight / 2 + (z - this.view.z) * this.view.scale }; }

  drawMap() {
    const c = this.mctx, V = this.view, P = this.game.player;
    if (this.canvas.width !== Math.round(innerWidth * (this.dpr || 1))) this.resize();
    const l = LAYER_BY_ID[V.layer], W = innerWidth, H = innerHeight;
    if (V.follow) { V.x = P.pos.x; V.z = P.pos.z; }
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    // parchment ground
    c.fillStyle = '#2a140d'; c.fillRect(0, 0, W, H);
    c.save();
    c.translate(W / 2, H / 2);
    this.paint(c, l, V.x, V.z, V.scale, W, { halfW: W / 2, halfH: H / 2 });
    this.drawTracks(c, l, V);
    // named places
    c.font = `500 12px ${FONT.ui}`; c.textAlign = 'center';
    for (const a of this.anchors) {
      if (a.layer !== l.id) continue;
      const cell = this.cell(l, Math.floor(a.x / l.cell), Math.floor(a.z / l.cell));
      const near = (() => { const n = 3; let best = 0; for (let dx = -n; dx <= n; dx++) for (let dz = -n; dz <= n; dz++) { const cc = this.cell(l, Math.floor(a.x / l.cell) + dx, Math.floor(a.z / l.cell) + dz); if (cc && cc.k > best) best = cc.k; } return best; })();
      if (near < 0.08) continue;
      const sx = (a.x - V.x) * V.scale, sy = (a.z - V.z) * V.scale;
      c.fillStyle = a.done ? '#ffe0a0' : '#ffb27a';
      c.beginPath(); c.arc(sx, sy, 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(251,227,207,.9)';
      c.fillText(a.name, sx, sy - 9);
    }
    // the photographs (the Veritome's): a small brass frame where each was taken, turned the way the lens looked, brighter for more stars
    for (const p of this.game.veritome?.book.pins || []) {
      if (this.layerOf(p).id !== l.id) continue;
      const sx = (p.x - V.x) * V.scale, sy = (p.z - V.z) * V.scale;
      c.save(); c.translate(sx, sy); c.rotate(Math.PI - p.yaw);
      c.globalAlpha = 0.45 + 0.15 * (p.stars || 0);
      c.strokeStyle = '#e7c46a'; c.lineWidth = 1.5; c.strokeRect(-5, -4, 10, 8);
      c.beginPath(); c.arc(0, 0, 2.2, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(-3, -4); c.lineTo(0, -9); c.lineTo(3, -4); c.stroke();
      c.restore();
    }
    c.globalAlpha = 1;
    // the waypoint
    if (this.waypoint && this.waypoint.layer === l.id) {
      const sx = (this.waypoint.x - V.x) * V.scale, sy = (this.waypoint.z - V.z) * V.scale;
      c.fillStyle = '#ffe0a0'; c.save(); c.translate(sx, sy); c.rotate(Math.PI / 4); c.fillRect(-6, -6, 12, 12); c.restore();
    }
    this.drawThread(c, l, V, P);
    // you (and the jar's tether)
    if (this.layerOf(P.pos).id === l.id) {
      const sx = (P.pos.x - V.x) * V.scale, sy = (P.pos.z - V.z) * V.scale;
      c.save(); c.translate(sx, sy); c.rotate(Math.PI - (this.headYaw ?? P.yaw));
      c.fillStyle = '#fff1dc'; c.beginPath(); c.moveTo(0, -11); c.lineTo(8, 9); c.lineTo(0, 4); c.lineTo(-8, 9); c.closePath(); c.fill();
      c.restore();
      const zr = T.explored.baseRadius * V.scale;
      if (this.game.god?.active) { c.strokeStyle = 'rgba(255,214,150,.6)'; c.setLineDash([6, 6]); c.beginPath(); c.arc(sx, sy, zr, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
    }
    c.restore();
    for (const [id, b] of Object.entries(this.layerBtns)) b.classList.toggle('on', id === l.id);
    // the side panel: what you know
    const here = this.layerOf(P.pos);
    const track = (a) => a.done && this.game.places?.get?.(a.tag); // (a charted room that is a place: the Sight's TRACK beside it, ui/calibratebutton.js)
    const rows = this.anchors.filter((a) => a.layer === l.id).sort((a, b) => b.cov - a.cov).slice(0, 9).map((a) => `<span${track(a) ? ` data-place="${a.tag}"` : ''}>${a.done ? '◆' : '◇'} <b>${a.name}</b><span class="bar2"><i style="width:${Math.round(a.cov * 100)}%"></i></span>${Math.round(a.cov * 100)}%</span>`).join('<br>');
    const html = `<b>${l.name}</b>${here.id === l.id ? ' · you are here' : ''}<br>${rows || '<span style="opacity:.6">nothing charted here yet</span>'}<br><span style="opacity:.6">${this.stats.charted} cells charted · ${this.stats.understood} understood</span>`;
    if (html !== this.sideHtml) { // (rebuilt only when it reads differently: a button made every frame cannot be clicked)
      this.side.innerHTML = this.sideHtml = html;
      for (const e of this.side.querySelectorAll('[data-place]')) calibrateButton(e, { place: e.dataset.place }, this.game);
    }
  }
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
