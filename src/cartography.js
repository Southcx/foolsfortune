import * as THREE from 'three';
import { T, PALETTE } from './config.js';
import { sfx } from './audio.js';
import { FONT, THEMES, theme } from './ui/theme.js';

// ---------------------------------------------------------------------------------------
// MIND MAPPING (psychic cartography). The world is mapped in cells (2 m indoors, 8 m out on the dunes), one
// grid per LAYER (the dunes, the basement, the ground floor, the upper floor). Every cell holds
// how well the courier KNOWS it, k in 0..1, and whether it is wall:
//
//   0    unknown                        (nothing works there)
//   1    SENSED    k >= .08              walking past it: the hand can lift things there
//   2    CHARTED   k >= .45              lingering nearby (passive knowledge stops at .5)
//   3    UNDERSTOOD k >= .85             only a SURVEY does this: a psychic pulse (N) that sees
//                                        everything in line of sight, out to 14 m (20 from the jar)
//
// The ZONE OF INFLUENCE is where the god arts may be used: each art needs a tier of knowledge of
// the ground it is used on (see godarts.js). Around the vessel there is always a small charted
// zone. The more of a place you have walked and surveyed, the more you can do in it, and the
// higher its tier, the deeper the arts that work there.
//
// Also here: the compass (top right: a dial with the local map, heading, room, waypoint) and the
// map screen (M; drag to pan, wheel to zoom, click to set a waypoint, right click to clear it).
// ---------------------------------------------------------------------------------------
export const TIER_NAMES = ['UNKNOWN', 'SENSED', 'CHARTED', 'UNDERSTOOD'];
const LAYERS = [
  { id: 'dunes', name: 'THE DUNES', below: -150, cell: 8, sight: 40 },
  { id: 'basement', name: 'THE LAB', below: -3, cell: 2, sight: 7 },
  { id: 'ground', name: 'GROUND FLOOR', below: 2.6, cell: 2, sight: 7 },
  { id: 'upper', name: 'UPPER FLOOR', below: 1e9, cell: 2, sight: 7 },
];
const LAYER_BY_ID = Object.fromEntries(LAYERS.map((l) => [l.id, l]));
const KEY = 'foolsfortune.map.v1';
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
const staticOnly = (c) => !c.isSensor() && !c.parent()?.isDynamic();

const CSS = `
#compass { position: absolute; right: 24px; top: 18px; width: 150px; text-align: center; pointer-events: none; font-size: 10px; letter-spacing: .12em; }
#compass canvas { width: 150px; height: 150px; display: block; }
#compass { text-shadow: 1px 1px 0 rgba(8,3,1,.8); }
#compass .brg { font: 16px var(--f-sys); color: #fff1dc; letter-spacing: .04em; margin-top: 0; }
#compass .rm { opacity: .9; margin-top: 2px; text-transform: uppercase; font: 600 10px var(--f-title); letter-spacing: .14em; }
#compass .wp { color: var(--accent); margin-top: 2px; min-height: 12px; }
#compass .hint { opacity: .5; margin-top: 3px; }
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
    this.tickT = 0;
    this.saveT = 0;
    this.dirty = false;
    this.pulses = [];
    this.pulseCool = 0;
    this.open = false;
    this.view = { layer: 'ground', x: 0, z: 0, scale: 6, follow: true };
    this.stats = { charted: 0, understood: 0 };
    this.load();
    this.buildHud();
    this.buildMap();
    this.buildPulseFx();
  }

  // ------------------------------------------------------------------ layers, cells
  layerOf(y) { for (const l of LAYERS) if (y < l.below) return l; return LAYERS[LAYERS.length - 1]; }
  layer(id) { return LAYER_BY_ID[id]; }
  key(ix, iz) { return `${ix},${iz}`; }
  cellIndex(l, x, z) { return [Math.floor(x / l.cell), Math.floor(z / l.cell)]; }
  cell(l, ix, iz, make = false) {
    const m = this.cells[l.id], k = this.key(ix, iz);
    let c = m.get(k);
    if (!c && make) { c = { ix, iz, k: 0, w: 0, h: 0 }; m.set(k, c); }
    return c;
  }
  static tierOfK(k) { const t = T.zoi.tiers; return k >= t[2] ? 3 : k >= t[1] ? 2 : k >= t[0] ? 1 : 0; }

  /** What the courier knows about the ground at a point: { tier, k, base } (the vessel's own charted zone counts). */
  tierAt(x, y, z) {
    const l = this.layerOf(y);
    const [ix, iz] = this.cellIndex(l, x, z);
    const c = this.cell(l, ix, iz);
    let tier = c ? Cartography.tierOfK(c.k) : 0;
    const g = this.game.god;
    if (g?.active && g.vessel.alive) {
      const d = Math.hypot(x - g.vessel.pos.x, z - g.vessel.pos.z);
      if (d < T.zoi.baseRadius && Math.abs(y - g.vessel.pos.y) < 6) tier = Math.max(tier, T.zoi.baseTier);
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
    const l = this.layerOf(p.y), [ix, iz] = this.cellIndex(l, p.x, p.z);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) this.learn(l, ix + dx, iz + dz, dx || dz ? 0.3 : 0.5, false, p.y);
  }

  // ------------------------------------------------------------------ anchors (named places)
  addAnchor(name, tag, pos, layerId = null) {
    const l = layerId ? LAYER_BY_ID[layerId] : this.layerOf(pos.y);
    this.anchors.push({ name, tag, x: pos.x, y: pos.y, z: pos.z, layer: l.id, cov: 0, done: false });
  }

  /** The nearest named place on this layer within `max` metres. */
  roomAt(x, y, z, max = 30) {
    const l = this.layerOf(y);
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
    if (this.tickT <= 0) { this.tickT = 0.16; this.passive(0.16); }
    if (this.dirty && (this.saveT -= dt) <= 0) { this.saveT = 6; this.save(); }
    this.updateHud(dt);
    if (this.open) this.drawMap();
  }

  /** Walking about: what is near and in sight is slowly sensed, and charted with a little time (never past .5). */
  passive(dt) {
    const g = this.game, P = g.player, Z = T.zoi;
    if (g.god?.controlling && g.god.state !== 'on') return;
    const l = this.layerOf(P.pos.y), cs = l.cell, R = l.sight;
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
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 72), new THREE.MeshBasicMaterial({ color: PALETTE.hot, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.visible = false;
    g.scene.add(this.ring);
  }

  /** A psychic pulse from the courier (or the vessel): everything in line of sight is understood. */
  survey(byGod = false) {
    const g = this.game, P = g.player, Z = T.zoi;
    if (this.pulseCool > 0) return false;
    const l = this.layerOf(P.pos.y);
    if (!g.lachryma.spend(Z.pulseCost, 'survey')) return false;
    this.pulseCool = Z.pulseCooldown;
    const R = l.id === 'dunes' ? Z.pulseRadius * 3.2 : byGod ? Z.godPulseRadius : Z.pulseRadius;
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
    const Z = T.zoi;
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
      localStorage.setItem(KEY, JSON.stringify(out));
    } catch { /* storage unavailable */ }
  }

  load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* corrupt */ }
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

  /** Forget everything (a new game). */
  erase() {
    for (const l of LAYERS) this.cells[l.id].clear();
    for (const a of this.anchors) { a.done = false; a.cov = 0; }
    this.stats = { charted: 0, understood: 0 };
    this.save();
  }

  /** After the anchors are in: the ones already mapped in an earlier session. */
  restoreAnchors() { if (this.doneTags) for (const a of this.anchors) if (this.doneTags.has(a.tag)) { a.done = true; a.cov = 1; } }

  // ------------------------------------------------------------------ the compass
  buildHud() {
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    const box = el('div');
    box.id = 'compass';
    this.dial = document.createElement('canvas');
    this.dial.width = this.dial.height = 300;
    this.dialCtx = this.dial.getContext('2d');
    this.dEl = { brg: el('div', 'brg'), rm: el('div', 'rm'), wp: el('div', 'wp'), hint: el('div', 'hint', '') }; // (no key help on the HUD: the Codex and the log say it)
    box.append(this.dial, this.dEl.brg, this.dEl.rm, this.dEl.wp, this.dEl.hint);
    document.getElementById('hud').appendChild(box);
    this.compassEl = box;
  }

  /** North is -Z (the workshop's long axis runs that way): bearing 0 = facing -Z, clockwise. */
  static bearing(yaw) { return ((((Math.PI - yaw) * 180 / Math.PI) % 360) + 360) % 360; }

  updateHud() {
    const g = this.game, P = g.player;
    if (g.god?.controlling) { this.headYaw = g.god.cam.yaw + Math.PI; } // (the view's own facing)
    else this.headYaw = P.yaw;
    const brg = Cartography.bearing(this.headYaw);
    const room = this.roomAt(P.pos.x, P.pos.y, P.pos.z, 40);
    const l = this.layerOf(P.pos.y);
    const card = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(brg / 45) % 8];
    this.dEl.brg.textContent = `${card} ${String(Math.round(brg)).padStart(3, '0')}°`;
    this.dEl.rm.textContent = `${l.name}${room && room.name !== l.name ? ` · ${room.name}` : ''}`;
    if (this.waypoint && this.waypoint.layer === l.id) {
      const d = Math.hypot(this.waypoint.x - P.pos.x, this.waypoint.z - P.pos.z);
      this.dEl.wp.textContent = `◆ ${d < 1000 ? Math.round(d) : (d / 1000).toFixed(1) + 'k'} m`;
    } else this.dEl.wp.textContent = this.waypoint ? `◆ on another layer (${LAYER_BY_ID[this.waypoint.layer].name.toLowerCase()})` : '';
    // (the wire compass (vfx/wirecompass.js) is the compass while it is up: the dial steps aside for it; the map is still M)
    this.compassEl.style.display = g.god?.controlling || g.wireCompass?.visible ? 'none' : '';
    if (this.compassEl.style.display !== 'none') this.drawDial(P, l, brg);
  }

  drawDial(P, l, brg) {
    const c = this.dialCtx, S = 300, r = 138, cx = S / 2, cy = S / 2;
    c.clearRect(0, 0, S, S);
    c.save();
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.clip();
    c.fillStyle = 'rgba(28,13,8,.62)'; c.fillRect(0, 0, S, S);
    // the local map, turned so that the way you face is up
    const scale = l.id === 'dunes' ? 1.5 : 7; // px per metre
    c.translate(cx, cy);
    c.rotate((this.headYaw ?? 0) - Math.PI); // (the way you face is up)
    this.paint(c, l, P.pos.x, P.pos.z, scale, S, { cellsOnly: true });
    c.restore();
    // the ring (the windows' bevel, ui/theme.js: dark, light to mid, dark), the cardinals, the you
    const TH = THEMES[theme.id], ring = (w, st, rr = r) => { c.strokeStyle = st; c.lineWidth = w; c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.stroke(); };
    const bev = c.createLinearGradient(cx - r, cy - r, cx + r, cy + r); bev.addColorStop(0, TH.hi); bev.addColorStop(1, TH.mid);
    ring(10, TH.lo, r + 2); ring(5, bev, r + 2); ring(1.5, TH.lo, r - 1.5);
    c.font = `600 22px ${FONT.title}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const [ch, ang] of [['N', 0], ['E', 90], ['S', 180], ['W', 270]]) {
      const a = (ang - brg) * Math.PI / 180;
      c.fillStyle = ch === 'N' ? '#ff9a6a' : 'rgba(251,227,207,.8)';
      c.fillText(ch, cx + Math.sin(a) * (r - 16), cy - Math.cos(a) * (r - 16));
    }
    // waypoint
    if (this.waypoint && this.waypoint.layer === l.id) {
      const dx = this.waypoint.x - P.pos.x, dz = this.waypoint.z - P.pos.z;
      const worldAng = Math.atan2(dx, -dz) * 180 / Math.PI; // bearing of the waypoint
      const a = (worldAng - brg) * Math.PI / 180;
      const dd = Math.min(r - 30, Math.hypot(dx, dz) * scale);
      c.fillStyle = '#ffe0a0';
      c.save(); c.translate(cx + Math.sin(a) * dd, cy - Math.cos(a) * dd); c.rotate(Math.PI / 4); c.fillRect(-6, -6, 12, 12); c.restore();
    }
    c.fillStyle = '#fff1dc';
    c.beginPath(); c.moveTo(cx, cy - 12); c.lineTo(cx + 8, cy + 9); c.lineTo(cx, cy + 4); c.lineTo(cx - 8, cy + 9); c.closePath(); c.fill();
  }

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
    const root = el('div');
    root.id = 'mapui';
    this.canvas = document.createElement('canvas');
    root.appendChild(this.canvas);
    this.mctx = this.canvas.getContext('2d');
    const bar = el('div', 'bar');
    bar.appendChild(el('h2', '', 'MIND MAPPING'));
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
    root.appendChild(el('div', 'legend', '<span style="opacity:.9">▒</span> sensed &nbsp; <span style="color:#d68c5a">■</span> charted &nbsp; <span style="color:#ffd696">■</span> understood &nbsp; <span style="color:#ffe0a0">◆</span> waypoint<br><span style="opacity:.6">drag · wheel · click sets waypoint · right click clears · N surveys</span>'));
    document.body.appendChild(root);
    this.root = root;
    root.addEventListener('mousedown', (e) => { e.stopPropagation(); this.drag = { x: e.clientX, y: e.clientY, moved: 0, button: e.button }; root.style.cursor = 'grabbing'; });
    addEventListener('mouseup', (e) => {
      if (!this.open || !this.drag) return;
      const d = this.drag; this.drag = null; root.style.cursor = '';
      if (d.moved < 5 && e.target === this.canvas) {
        const p = this.screenToWorld(e.clientX, e.clientY);
        if (d.button === 2) this.waypoint = null;
        else this.waypoint = { x: p.x, z: p.z, layer: this.view.layer };
        sfx.click?.();
      }
    });
    addEventListener('mousemove', (e) => {
      if (!this.open || !this.drag) return;
      const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
      this.drag.moved += Math.abs(dx) + Math.abs(dy);
      this.drag.x = e.clientX; this.drag.y = e.clientY;
      this.view.x -= dx / this.view.scale; this.view.z -= dy / this.view.scale; this.view.follow = false;
    });
    root.addEventListener('wheel', (e) => { e.preventDefault(); e.stopPropagation(); this.view.scale = THREE.MathUtils.clamp(this.view.scale * Math.exp(-e.deltaY * 0.0012), 0.5, 40); }, { passive: false });
    root.addEventListener('contextmenu', (e) => e.preventDefault());
    // (M opens and closes it, here, in the key's own event: closing hands the mouse back with a pointer lock request, which the
    // browser only grants inside a user gesture. Handling it a frame later in the game loop is what lost the mouse before.)
    addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const g = this.game, tag = document.activeElement?.tagName;
      if (this.open && (e.code === 'KeyM' || e.code === 'Escape')) { this.hide(); e.preventDefault(); return; }
      if (!this.open && e.code === 'KeyM' && g.input.enabled && tag !== 'INPUT' && tag !== 'TEXTAREA' && !g.codex?.open && !g.indexMenu?.open) { this.show(); e.preventDefault(); }
    });
  }

  toggle() { this.open ? this.hide() : this.show(); }

  show() {
    const P = this.game.player, l = this.layerOf(P.pos.y);
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
      if (this.layerOf(p.y).id !== l.id) continue;
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
    // you (and the vessel's tether)
    if (this.layerOf(P.pos.y).id === l.id) {
      const sx = (P.pos.x - V.x) * V.scale, sy = (P.pos.z - V.z) * V.scale;
      c.save(); c.translate(sx, sy); c.rotate(Math.PI - (this.headYaw ?? P.yaw));
      c.fillStyle = '#fff1dc'; c.beginPath(); c.moveTo(0, -11); c.lineTo(8, 9); c.lineTo(0, 4); c.lineTo(-8, 9); c.closePath(); c.fill();
      c.restore();
      const zr = T.zoi.baseRadius * V.scale;
      if (this.game.god?.active) { c.strokeStyle = 'rgba(255,214,150,.6)'; c.setLineDash([6, 6]); c.beginPath(); c.arc(sx, sy, zr, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
    }
    c.restore();
    for (const [id, b] of Object.entries(this.layerBtns)) b.classList.toggle('on', id === l.id);
    // the side panel: what you know
    const here = this.layerOf(P.pos.y);
    const rows = this.anchors.filter((a) => a.layer === l.id).sort((a, b) => b.cov - a.cov).slice(0, 9).map((a) => `${a.done ? '◆' : '◇'} <b>${a.name}</b><span class="bar2"><i style="width:${Math.round(a.cov * 100)}%"></i></span>${Math.round(a.cov * 100)}%`).join('<br>');
    this.side.innerHTML = `<b>${l.name}</b>${here.id === l.id ? ' · you are here' : ''}<br>${rows || '<span style="opacity:.6">nothing charted here yet</span>'}<br><span style="opacity:.6">${this.stats.charted} cells charted · ${this.stats.understood} understood</span>`;
  }
}


// ---------------------------------------------------------------------------------------
// The Zone of Influence, drawn on the ground while you are the hand: what is unknown lies under
// a dark veil, what is only sensed under a thin one, and what is understood glows faintly.
// ---------------------------------------------------------------------------------------
export class ZoiVeil {
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
    const l = this.carto.layerOf(focus.y);
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
