// ---------------------------------------------------------------------------------------
// THE MAP SCREEN (M; docs/plans/MAP.md, Dovina's rules; the look is Calissa's, ui/mapdress/; the owner's ruling, 2026-10-25: the island
// as B1's glazed ring, an area's page as the ink scroll). The map's engine: what is open, the level shown (the island, or one area's
// page), the view on a page (pan and zoom), the input (mouse, wheel, fingers, a long press, a tap on the island), and the data handed
// to the dress, which draws it and keeps nothing. The cells, the anchors, the thread and the save stay with the chart
// (feedback/cartography.js); this reads them.
//   THE AREAS     an area is AREAS.md's: the Dunes as Dovina's five (progress/areas.js, cut by bearing round the oasis), every other
//                 layer one area until it is split; the workshop's three floors one area with a floor stack.
//   ONE WAYPOINT  a click (on touch, a long press) on charted ground calibrates the Sight to that point (game.sight.calibrate({ point }));
//                 the map keeps no mark of its own (`cartography.waypoint` reads the Sight's, for the wire compass).
//   ITS COST      2D canvas and DOM only, built on opening and let go on closing; drawn only when what it shows changes (the key).
//
// Prior art: Final Fantasy XII's region and area maps (a level up by zooming out, the exits named at the edge), Metroid Prime's floor
// stack, Hollow Knight's charted names, Spyro's N of M; the Pneuka Box's underside for the split (engine here, look in ui/).
//
//   game.cartography.screen = new MapScreen(game, carto)   .show()   .hide()   .toggle()   .open   .tick()   (each frame: drawn on change)
//   .level ('island' | 'area')   .areaId   .areaOf(pos) -> id   .islandGraph()   .areaData(id)   .pageWords(id)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';
import { sfx } from '../audio/sfx.js';
import { mapWindow, islandLook, islandHit, areaPage } from '../ui/mapdress/index.js';
import { DUNES_AREAS, AREA_PAGE, CHECKLIST_ROWS, areaAt } from '../progress/areas.js';
import { deviceWord } from '../progress/devicewords.js';

/** The map on touch: a long press's wait (ms), how far a finger may move and still be one (CSS px). A page zoomed out past `outK` of
 *  its fit goes up to the island. Zoom's limits, CSS px a metre. */
const MAP_TOUCH = { long: 420, still: 10 };
const VIEW = { min: 0.25, max: 40, outK: 0.55 };

/** The island's places (plain names; the graph Calissa's ring is laid out from). `layers`: the chart's layers it holds (the first is
 *  its page's floor by default); `ways`: its neighbours, a string a walked way, `{ id, via: 'index' }` the Index's spoke. */
const PLACES = [
  { id: 'workshop', name: 'The workshop', layers: ['ground', 'upper', 'basement'], silhouette: 'workshop',
    ways: [{ id: 'weir', via: 'index' }, { id: 'raceway', via: 'index' }, { id: 'bazaar', via: 'index' }] }, // (the Index sets you down by the oasis: the Weir)
  { id: 'dunes', name: 'The Dunes', layers: ['dunes'] },
  { id: 'well', name: 'The Great Dunemaw', layers: ['well'], silhouette: 'well', ways: [{ id: 'flats', label: 'the mouth' }] },
  { id: 'raceway', name: 'The Raceway', layers: ['raceway'], silhouette: 'raceway', ways: [{ id: 'workshop', via: 'index' }] },
  { id: 'bazaar', name: "Raku's bazaar", layers: ['bazaar'], silhouette: 'bazaar', ways: [{ id: 'weir', label: 'the gate' }] },
  { id: 'margarite', name: "Margarite's dock", layers: ['margarite'], silhouette: 'dock', ways: [{ id: 'shore', label: 'the jetty' }] },
  { id: 'opensea', name: 'The open sea', layers: ['opensea'], silhouette: 'sea', ways: [{ id: 'shore', label: 'the jetty' }] },
];
const SILHOUETTE = { weir: 'weir', shore: 'shore', ridges: 'ridges', flats: 'gnomon', ruins: 'ruins' };
const FLOORS = [{ id: 'upper', label: 'F2' }, { id: 'ground', label: 'F1' }, { id: 'basement', label: 'B1' }];
const PLACE_BY_ID = Object.fromEntries(PLACES.map((p) => [p.id, p]));
const D2R = Math.PI / 180;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export class MapScreen {
  constructor(game, carto) {
    this.game = game; this.carto = carto;
    this.level = 'area'; this.areaId = null; this.floor = null;
    this.view = { x: 0, z: 0, scale: 6, fit: 6 };
    this.fingers = new Map(); this.drag = null; this.drawn = null; this.hits = [];
    this.win = mapWindow({ closeKey: deviceWord('map', game.input?.device || 'keyboard') ?? '', onIsland: () => this.goIsland(), onClose: () => this.hide(true), onFloor: (id) => this.goFloor(id) });
    this.win.onResize = () => this.drawMap(true);
    // (M opens and closes it, in the key's own event: closing hands the mouse back with a pointer lock request, which the browser only
    // grants inside a user gesture. Handling it a frame later in the game loop is what lost the mouse before.)
    addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const g = this.game, tag = document.activeElement?.tagName;
      if (this.open && (e.code === 'KeyM' || e.code === 'Escape')) { this.hide(); e.preventDefault(); e.stopImmediatePropagation(); return; } // (spent: the pause menu does not open under it, GARDEN-SWEEP #9)
      if (!this.open && e.code === 'KeyM' && g.input.enabled && tag !== 'INPUT' && tag !== 'TEXTAREA' && !(g.windowOpen ? g.windowOpen() : g.codex?.open || g.indexMenu?.open)) { this.show(); e.preventDefault(); }
    });
    addEventListener('pointerup', (e) => this.pointerUp(e));
    addEventListener('pointercancel', (e) => { if (e.pointerType === 'touch') this.fingerUp(e, true); });
    addEventListener('pointermove', (e) => this.pointerMove(e));
  }

  get open() { return this.win.isOpen; }
  toggle() { if (this.open) this.hide(); else this.show(); }

  show() {
    const P = this.game.player;
    document.exitPointerLock?.();
    this.win.open();
    const c = this.win.canvas;
    c.addEventListener('pointerdown', (e) => this.pointerDown(e));
    c.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom(Math.exp(-e.deltaY * 0.0012)); }, { passive: false });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    this.goArea(this.areaOf(P.pos), { centre: P.pos });
    this.carto.firstOpen ??= true;
  }

  hide(closed = false) {
    if (!this.open && !closed) return;
    if (!closed) this.win.close();
    this.fingers.clear(); this.drag = null; this.drawn = null; this.hits = [];
    this.carto.firstOpen = false;
    this.carto.onClose?.();
  }

  /** Each frame while open: drawn again only when what it shows changed. */
  tick() { if (this.open) this.drawMap(); }

  // ------------------------------------------------------------------ the areas
  /** The area a point stands in: one of the Dunes' five, or the place a layer belongs to. */
  areaOf(p) {
    const l = this.carto.layerOf(p);
    if (l.id === 'dunes') { const o = this.game.dunes?.center; return (o && areaAt(p.x - o.x, p.z - o.z)) || 'weir'; }
    return PLACES.find((P) => P.layers.includes(l.id))?.id || 'workshop';
  }
  /** The chart's layer an area's page shows (the workshop's: the floor picked, else the one you stand on, else the ground floor). */
  layerOfArea(id) {
    if (DUNES_AREAS[id]) return 'dunes';
    const P = PLACE_BY_ID[id]; if (!P) return 'ground';
    const here = this.carto.layerOf(this.game.player.pos).id;
    return P.layers.includes(this.floor) ? this.floor : P.layers.includes(here) ? here : P.layers[0];
  }
  /** A point of a Dunes area in the world, from its bearing (degrees) and radius in the Dunes' frame. */
  dunesAt(b, r) { const o = this.game.dunes?.center || { x: 0, z: 0 }; return { x: o.x + r * Math.cos(b * D2R), z: o.z + r * Math.sin(b * D2R) }; }
  /** A Dunes area's outline: its sector's arcs, or the Weir's circle. */
  dunesOutline(id) {
    const A = DUNES_AREAS[id], pts = [];
    if (!A.bearing) { for (let i = 0; i <= 48; i++) { const q = this.dunesAt(i * 7.5, A.r[1]); pts.push([q.x, q.z]); } return pts; }
    let [b0, b1] = A.bearing; if (b1 <= b0) b1 += 360;
    const n = Math.max(6, Math.ceil((b1 - b0) / 5));
    for (let i = 0; i <= n; i++) { const q = this.dunesAt(b0 + (b1 - b0) * i / n, A.r[1]); pts.push([q.x, q.z]); }
    for (let i = n; i >= 0; i--) { const q = this.dunesAt(b0 + (b1 - b0) * i / n, A.r[0]); pts.push([q.x, q.z]); }
    pts.push(pts[0]);
    return pts;
  }
  /** An area's world box: a Dunes area's outline's, else its layer's charted cells' (padded), else round you. */
  boundsOf(id) {
    if (DUNES_AREAS[id]) { const o = this.dunesOutline(id); let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity; for (const [x, z] of o) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return { x0, z0, x1, z1 }; }
    const l = this.carto.layer(this.layerOfArea(id)), cells = this.carto.cells[l.id];
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const c of cells.values()) { if (c.k < 0.05) continue; x0 = Math.min(x0, c.ix * l.cell); x1 = Math.max(x1, (c.ix + 1) * l.cell); z0 = Math.min(z0, c.iz * l.cell); z1 = Math.max(z1, (c.iz + 1) * l.cell); }
    const P = this.game.player.pos;
    if (!isFinite(x0)) return { x0: P.x - 40, z0: P.z - 40, x1: P.x + 40, z1: P.z + 40 };
    const pad = l.cell * 4; return { x0: x0 - pad, z0: z0 - pad, x1: x1 + pad, z1: z1 + pad };
  }
  /** Is a cell of an area (a Dunes area cuts its layer by bearing)? */
  inArea(id, l, c) {
    if (!DUNES_AREAS[id]) return true;
    const o = this.game.dunes?.center; if (!o) return true;
    return areaAt((c.ix + 0.5) * l.cell - o.x, (c.iz + 0.5) * l.cell - o.z) === id;
  }
  /** Has the Courier been in an area: any charted ground of it. */
  visited(id) {
    const ids = DUNES_AREAS[id] ? ['dunes'] : PLACE_BY_ID[id]?.layers || [];
    for (const lid of ids) { const l = this.carto.layer(lid); for (const c of this.carto.cells[lid].values()) if (c.k >= 0.05 && this.inArea(id, l, c)) return true; }
    return false;
  }

  // ------------------------------------------------------------------ the levels
  goArea(id, { centre = null } = {}) {
    this.level = 'area'; this.areaId = id; if (!PLACE_BY_ID[id]?.layers.includes(this.floor)) this.floor = null;
    this.win.area(this.pageWords(id));
    const b = this.boundsOf(id), { w, h } = this.win.box();
    this.view.fit = THREE.MathUtils.clamp(Math.min((w || 600) / (b.x1 - b.x0), (h || 400) / (b.z1 - b.z0)) * 0.92, VIEW.min, VIEW.max);
    const P = this.game.player.pos, c = centre && this.areaOf(P) === id ? centre : { x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2 };
    this.view.x = c.x; this.view.z = c.z; this.view.scale = centre ? Math.max(this.view.fit, DUNES_AREAS[id] ? 1.2 : 6) : this.view.fit;
    this.drawMap(true);
  }
  goFloor(id) { this.floor = id; const a = this.areaId; this.goArea(a); }
  goIsland() {
    this.level = 'island';
    this.win.island({ title: 'Anagami Island', sub: 'THE ISLAND' });
    this.drawMap(true);
  }

  // ------------------------------------------------------------------ the data handed to the dress
  /** One node a place, the Dunes' five as its children (MAP.md 2). */
  islandGraph() {
    const here = this.areaOf(this.game.player.pos), out = [], sums = (id) => { const r = this.rowsOf(id) || []; return { n: r.reduce((s, x) => s + x.n, 0), m: r.reduce((s, x) => s + x.m, 0) }; };
    for (const P of PLACES) {
      if (P.id === 'dunes') { out.push({ id: 'dunes', name: 'The Dunes', neighbours: [], visited: Object.keys(DUNES_AREAS).some((a) => this.visited(a)), here: !!DUNES_AREAS[here], n: 0, m: 0 }); continue; }
      const v = this.visited(P.id), node = { id: P.id, name: P.name, neighbours: P.ways || [], visited: v, here: here === P.id, silhouette: P.silhouette, ...(v ? sums(P.id) : { n: 0, m: 0 }) };
      if (P.id === 'well' && this.game.well?.active) node.note = `FLOOR ${this.game.well.floor + 1}`;
      out.push(node);
    }
    for (const [id, A] of Object.entries(DUNES_AREAS)) {
      const v = this.visited(id); // (a sector's arc is its bearings, [from, to] in degrees: the Dunes' frame is the canvas's, 0 east, 90 down)
      out.push({ id, name: cap(A.name), parent: 'dunes', neighbours: A.meets.slice(), visited: v, here: here === id, silhouette: SILHOUETTE[id], ...(A.bearing ? { arc: A.bearing.slice() } : {}), ...(v ? sums(id) : { n: 0, m: 0 }) });
    }
    return out;
  }

  /** An area's checklist rows (MAP.md 4): only kinds the area holds and the engine can count; null before it is first entered. */
  rowsOf(id) {
    if (!this.visited(id)) return null;
    const g = this.game, L = g.ledger, C = this.carto, lid = this.layerOfArea(id), l = C.layer(lid), o = g.dunes?.center;
    const inHere = (p) => { if (!p) return false; const pl = C.layerOf(p); if (DUNES_AREAS[id]) return pl.id === 'dunes' && o && areaAt(p.x - o.x, p.z - o.z) === id; return (PLACE_BY_ID[id]?.layers || []).includes(pl.id); };
    const kinds = AREA_PAGE[id]?.rows || ['rooms', 'vantage', 'shrine'], rows = [];
    for (const kind of kinds) {
      const R = CHECKLIST_ROWS[kind]; if (!R || R.needs) continue; // (a row whose per-thing key is not written yet is left out: MAP.md 4)
      let n = 0, m = 0, extra = null;
      if (kind === 'rooms') {
        const As = C.anchors.filter((a) => inHere(a) && (DUNES_AREAS[id] || a.layer === l.id || (PLACE_BY_ID[id]?.layers || []).includes(a.layer)));
        m = As.length; n = As.filter((a) => a.done).length;
        extra = As.map((a) => ({ id: a.tag, name: a.name, charted: a.done, place: !!g.places?.get?.(a.tag) }));
      } else if (kind === 'vantage') {
        for (const p of g.places?.all?.() || []) if (p.id.startsWith('vantage.') && inHere({ x: p.pos[0], y: p.pos[1], z: p.pos[2] })) { m++; if (L?.has(`vantage.${p.id.slice(8)}`)) n++; }
      } else if (kind === 'shrine') {
        for (const s of g.shrines?.list || []) if (inHere(s.pos)) { m++; if (L?.get(`shrine.found.${s.id}`)) n++; }
      } else if (kind === 'ostracon') {
        for (const k of ['buried', 'loose', 'stelae']) for (const s of g.ostraca?.[k] || []) { const p = s.pos ?? s.at; if (p && inHere(p)) { m++; if (s.word && L?.get(`ostracon.${s.word}`)) n++; } }
      } else if (kind === 'fish') {
        m = R.of; n = Object.keys(L?.rec || {}).filter((k) => /^fish\.kg\.(?!max$)/.test(k)).length;
      } else if (kind === 'medal') {
        m = R.of; n = ['bronze', 'silver', 'gold'].filter((md) => L?.get(`trial.solar.${md}`)).length;
      } else continue;
      if (!m) continue;
      rows.push({ kind, label: R.label, n: Math.min(n, m), m, ...(extra ? { rooms: extra } : {}) });
    }
    return rows;
  }

  /** The window's words for an area's page. */
  pageWords(id) {
    const D = DUNES_AREAS[id], P = PLACE_BY_ID[id];
    const title = D ? cap(D.name) : P?.name || id;
    const path = D ? ['THE ISLAND', 'THE DUNES', D.name.toUpperCase()] : ['THE ISLAND', title.toUpperCase()];
    const here = this.carto.layerOf(this.game.player.pos).id, lid = this.layerOfArea(id);
    const floors = id === 'workshop' ? FLOORS.map((f) => ({ id: f.id, label: f.label, here: f.id === lid, ...(f.id === here ? { you: true } : {}) })) : null;
    return { title, path, floors, rows: this.rowsOf(id), line: AREA_PAGE[id]?.line || '', game: this.game };
  }

  /** The edges of a Dunes area: a chevron at the middle of each boundary it shares, pointing out, named once that neighbour is visited. */
  edgesOf(id) {
    const A = DUNES_AREAS[id]; if (!A) return [];
    const out = [], mid = (B) => { let [b0, b1] = B.bearing; if (b1 <= b0) b1 += 360; return (b0 + b1) / 2; };
    for (const nid of A.meets) {
      const N = DUNES_AREAS[nid]; let b, r, dir;
      if (!A.bearing) { b = mid(N); r = A.r[1]; dir = b * D2R; } // (from the Weir: out through its rim, toward the sector)
      else if (!N.bearing) { b = mid(A); r = A.r[0]; dir = b * D2R + Math.PI; } // (toward the Weir: in through the inner arc)
      else { // (a sector beside a sector: on their shared radial line, turned toward the neighbour)
        const shared = [A.bearing[0], A.bearing[1]].find((x) => x === N.bearing[0] || x === N.bearing[1]); if (shared === undefined) continue;
        b = shared; r = (A.r[0] + A.r[1]) / 2; dir = (b + (shared === A.bearing[0] ? -90 : 90)) * D2R;
      }
      const q = this.dunesAt(b, r);
      out.push({ x: q.x, z: q.z, dir, name: cap(N.name), visited: this.visited(nid) });
    }
    const mouth = id === 'flats' && this.game.well?.mouthSpot?.(); if (mouth) out.push({ x: mouth.pos.x, z: mouth.pos.z, dir: Math.PI / 2, name: 'The Great Dunemaw', visited: this.visited('well'), down: true });
    return out;
  }

  /** An area's page (Calissa's contract, docs/handoffs: the cells, the outline, places, plates, the thread, you, the waypoint, edges). */
  areaData(id) {
    const g = this.game, C = this.carto, P = g.player, l = C.layer(this.layerOfArea(id)), bounds = this.boundsOf(id), cells = [];
    for (const c of C.cells[l.id].values()) {
      const t = C.constructor.tierOfK(c.k); if (!t && !c.w) continue;
      const x = c.ix * l.cell, z = c.iz * l.cell;
      if (x + l.cell < bounds.x0 || x > bounds.x1 || z + l.cell < bounds.z0 || z > bounds.z1 || !this.inArea(id, l, c)) continue;
      cells.push({ ix: c.ix, iz: c.iz, tier: t, wall: !!c.w });
    }
    const onPage = (p) => C.layerOf(p).id === l.id && (!DUNES_AREAS[id] || this.inArea(id, l, { ix: Math.floor(p.x / l.cell), iz: Math.floor(p.z / l.cell) }));
    const sh = g.shrines?.get?.(g.shrines.last), threadOn = sh && g.knacks?.on('ariadnesThread');
    const wp = g.sight?.waypoint, here = C.layerOf(P.pos).id === l.id;
    return {
      area: id, bounds, cell: l.cell, cells, rev: `${l.id}:${C.rev || 0}`,
      ...(DUNES_AREAS[id] ? { outline: this.dunesOutline(id) } : {}),
      places: C.anchors.filter((a) => a.layer === l.id && onPage(a)).map((a) => ({ x: a.x, z: a.z, name: a.name, charted: a.done })),
      plates: (g.veritome?.book.pins || []).filter((p) => onPage(p)).map((p) => ({ x: p.x, z: p.z, yaw: p.yaw, stars: p.stars || 0 })),
      thread: threadOn ? { pts: [sh.pos, ...C.thread, P.pos].filter((q) => C.layerOf(q).id === l.id).map((q) => ({ x: q.x, z: q.z })), dashed: !C.thread.length } : null,
      you: here ? { x: P.pos.x, z: P.pos.z, yaw: C.headYaw ?? P.yaw } : null,
      waypoint: wp?.pos && C.layerOf(wp.pos).id === l.id ? { x: wp.pos.x, z: wp.pos.z } : null,
      edges: this.edgesOf(id),
      ...(l.id === 'raceway' ? { tracks: C.tracksOf() } : {}),
      godhand: g.god?.active && g.god.jar?.alive ? { x: g.god.jar.pos.x, z: g.god.jar.pos.z, r: T.explored.baseRadius } : null,
      key: !!(C.firstOpen || g.god?.active),
    };
  }

  // ------------------------------------------------------------------ drawing
  drawMap(force = false) {
    if (!this.open) return;
    const g = this.game, V = this.view, P = g.player, C = this.carto, wp = g.sight?.waypoint, { w, h } = this.win.box();
    if (!w || !h) return;
    const key = `${this.level} ${this.areaId} ${this.floor} ${V.x.toFixed(2)} ${V.z.toFixed(2)} ${V.scale.toFixed(3)} ${w}x${h} ${C.rev || 0} ${C.thread.length} ${g.veritome?.book.pins?.length || 0} ${wp?.pos ? `${wp.pos.x.toFixed(1)},${wp.pos.z.toFixed(1)}` : '-'} ${P.pos.x.toFixed(1)},${P.pos.z.toFixed(1)},${(C.headYaw ?? P.yaw).toFixed(2)} ${!!g.god?.active} ${C.anchors.reduce((n, a) => n + (a.done ? 1 : 0), 0)}`;
    if (!force && key === this.drawn) return;
    this.drawn = key;
    const c = this.win.canvas, dpr = Math.min(2, devicePixelRatio || 1);
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const ctx = c.getContext('2d');
    if (this.level === 'island') this.hits = islandLook(ctx, this.islandGraph(), { w, h, dpr }).hits;
    else areaPage(ctx, this.areaData(this.areaId), { x: V.x, z: V.z, scale: V.scale, w, h, dpr });
  }

  // ------------------------------------------------------------------ input
  /** CSS px inside the canvas to the world, on a page. */
  toWorld(cx, cy) { const { w, h } = this.win.box(), V = this.view; return { x: V.x + (cx - w / 2) / V.scale, z: V.z + (cy - h / 2) / V.scale }; }
  local(e) { const r = this.win.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  pan(dx, dy) { if (this.level !== 'area') return; this.view.x -= dx / this.view.scale; this.view.z -= dy / this.view.scale; }
  /** Zoom on a page by k; out past its fit goes up to the island. */
  zoom(k) {
    if (this.level !== 'area') { if (k > 1.05) { const A = this.areaOf(this.game.player.pos); this.goArea(A, { centre: this.game.player.pos }); } return; }
    this.view.scale = THREE.MathUtils.clamp(this.view.scale * k, VIEW.min, VIEW.max);
    if (this.view.scale < this.view.fit * VIEW.outK) this.goIsland();
  }
  /** A tap or click: on the island, into the area tapped; on a page, the Sight calibrated to that point of charted ground. */
  press(e, clear = false) {
    const q = this.local(e);
    if (this.level === 'island') { const hit = islandHit(this.hits, q.x, q.y); if (hit?.visited) { sfx.click?.(); this.goArea(hit.id, { centre: this.game.player.pos }); } return; }
    const S = this.game.sight; if (!S) return;
    if (clear) { S.clear?.(); sfx.click?.(); return; }
    const p = this.toWorld(q.x, q.y), l = this.carto.layer(this.layerOfArea(this.areaId)), c = this.carto.cell(l, Math.floor(p.x / l.cell), Math.floor(p.z / l.cell));
    const r = S.calibrate({ point: { x: p.x, y: c?.h ?? this.game.player.pos.y, z: p.z } });
    if (r?.ok !== false) sfx.click?.();
  }
  pointerDown(e) {
    e.stopPropagation();
    if (e.pointerType === 'touch') return this.fingerDown(e);
    this.drag = { x: e.clientX, y: e.clientY, moved: 0, button: e.button, e };
  }
  pointerUp(e) {
    if (e.pointerType === 'touch') return this.fingerUp(e);
    if (!this.open || !this.drag) return;
    const d = this.drag; this.drag = null;
    if (d.moved < 5) this.press(e, d.button === 2);
  }
  pointerMove(e) {
    if (e.pointerType === 'touch') return this.fingerMove(e);
    if (!this.open || !this.drag) return;
    const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
    this.drag.moved += Math.abs(dx) + Math.abs(dy); this.drag.x = e.clientX; this.drag.y = e.clientY;
    this.pan(dx, dy);
  }
  // ---- fingers: a drag pans, two pinch about their middle, a tap enters an area on the island, a long press calibrates on a page
  fingerDown(e) {
    if (!this.open || this.fingers.size >= 2) return;
    this.fingers.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, e });
    const L = this.game.touchUI?.longPress;
    clearTimeout(this.pressT); L?.cancel();
    if (this.fingers.size === 1 && this.level === 'area') {
      L?.show(e.clientX, e.clientY, { ms: MAP_TOUCH.long });
      this.pressT = setTimeout(() => { const f = this.fingers.get(e.pointerId); if (f && this.open && this.fingers.size === 1) { f.spent = true; this.press({ clientX: f.x, clientY: f.y }); } }, MAP_TOUCH.long);
    }
  }
  fingerMove(e) {
    const f = this.fingers.get(e.pointerId); if (!f || !this.open) return;
    const others = [...this.fingers.entries()].filter(([id]) => id !== e.pointerId);
    if (others.length) { const o = others[0][1], d0 = Math.hypot(f.x - o.x, f.y - o.y) || 1, d1 = Math.hypot(e.clientX - o.x, e.clientY - o.y) || 1; this.zoom(d1 / d0); this.pan((e.clientX - f.x) / 2, (e.clientY - f.y) / 2); }
    else this.pan(e.clientX - f.x, e.clientY - f.y);
    f.x = e.clientX; f.y = e.clientY;
    if (Math.hypot(f.x - f.x0, f.y - f.y0) > MAP_TOUCH.still) { f.moved = true; clearTimeout(this.pressT); this.game.touchUI?.longPress?.cancel(); }
  }
  fingerUp(e, cancel = false) {
    const f = this.fingers.get(e.pointerId); if (!f) return;
    this.fingers.delete(e.pointerId); clearTimeout(this.pressT); if (!cancel) this.game.touchUI?.longPress?.cancel();
    if (!cancel && !f.moved && !f.spent && this.level === 'island' && !this.fingers.size) this.press({ clientX: f.x, clientY: f.y }); // (a tap on the island: into the area)
  }
}

