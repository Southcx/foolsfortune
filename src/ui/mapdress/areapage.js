// ---------------------------------------------------------------------------------------
// THE MAP'S DRESS: AN AREA'S PAGE (board v1's B2 hand laid out as panel C, ruled by the owner 2026-10-25; Dovina's MAP.md 2 and 3). The
// area's ground as charted, in sumi on washi:
//   THE SKETCH   the cells by tier as washes: sensed a dry hatch, charted a sepia wash, understood a full wash flecked with gold; each
//                tier one path of soft discs a cell, so its edge is a brush's, never a square's. Walls brushed as strokes joining wall
//                cells, a dark stroke over a lit lip. The area's outline (its sector of the ring) dotted faintly; the Raceway's tracks as
//                roads. Built once into an offscreen canvas at the sketch's size (its long side at most SKETCH.max px) and blitted
//                through the view: a pan or a zoom is one drawImage. Built again only when the cells' `rev`, the box or the needed
//                resolution changes.
//   ON IT        places as ink dots, named only once charted; your plates as small brass frames; Ariadne's Thread; the Sight's
//                waypoint (a vermilion ring, the Sight's own: never a mark of the map's); each edge as a glazed chevron on the outline
//                with its neighbour's name ("???" unvisited, DOWN for a way below); the Pneuka Jar's tether in the god hand; you, the
//                arrow; the tiers' key in the god hand and on the first opening.
// Pure: no timers and no game state, drawn only when called. disposeAreaPage() lets the sketch's canvas go (the map closed).
//
// Prior art: Okami's scroll (the world in sumi on paper), Hollow Knight (a place's name only once you have charted it), Final Fantasy
// XII's exits marked at the area's edge with where they lead, Outer Wilds' ship log (the unknown a "?"), sumi-e's washes.
//
//   areaPage(ctx, page, view)      page: { area, bounds: { x0, z0, x1, z1 }, cell, cells: [{ ix, iz, tier, wall }], rev?, outline?: [[x, z]],
//                                          walls?, places: [{ x, z, name, charted }], plates: [{ x, z, yaw, stars }], thread: { pts: [{ x, z }],
//                                          dashed }, you: { x, z, yaw }, waypoint: { x, z } | null, edges: [{ x, z, dir, name, visited, down }],
//                                          tracks?: [{ name, pts: [{ x, z, w }] }], godhand: { x, z, r } | null, key?: bool }
//                                  view: { x, z, scale (CSS px a metre), w, h (CSS px), dpr }
//   disposeAreaPage()
// ---------------------------------------------------------------------------------------
import { INK, FACE, GOLD, glaze, tone, hash, paperPattern, disposePaper } from './ink.js';

/** The page's numbers: the sketch's long side at most (px), a cell's disc against its size, the least type (CSS px), words. */
export const SKETCH = { max: 1024, disc: 0.74, bleed: 0.98, type: 14, chevron: 13,
  words: { unknown: '???', down: 'DOWN', sensed: 'SENSED', charted: 'CHARTED', understood: 'UNDERSTOOD' } }; // (words: placeholders, Espada's)

let cache = null; // { canvas, key, ppm, x0, z0 }

/** The sketch's static layers (washes, walls, outline, tracks) for this page at `ppm` px a metre. */
function build(page, ppm) {
  const b = page.bounds, bw = b.x1 - b.x0, bh = b.z1 - b.z0, cs = page.cell || 8;
  const c = cache?.canvas || document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(bw * ppm)); c.height = Math.max(1, Math.ceil(bh * ppm));
  const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
  const X = (x) => (x - b.x0) * ppm, Z = (z) => (z - b.z0) * ppm, cpx = cs * ppm;
  const ground = [], walls = new Set();
  for (const q of page.cells || []) { if (q.wall) walls.add(`${q.ix},${q.iz}`); else if (q.tier > 0) ground.push(q); }
  const discs = (min, k) => { const p = new Path2D(), r = cpx * k; for (const q of ground) if (q.tier >= min) { const x = X((q.ix + 0.5) * cs), y = Z((q.iz + 0.5) * cs); p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); } return p; };
  // sensed: a pale wash and a dry hatch over it
  const p1 = discs(1, SKETCH.bleed);
  g.fillStyle = `rgba(${INK.sepia},.10)`; g.fill(p1);
  g.save(); g.clip(p1); g.strokeStyle = INK.hatch; g.lineWidth = Math.max(0.8, cpx * 0.06);
  const step = Math.max(3, cpx * 0.32); g.beginPath();
  for (let d = -c.height; d < c.width; d += step) { const w = hash(d, 3) * step * 0.4; g.moveTo(d + w, 0); g.lineTo(d + w + c.height, c.height); }
  g.stroke(); g.restore();
  // charted: a sepia wash, its edge pooled darker (the bleed under a smaller core)
  g.fillStyle = `rgba(${INK.sepia},.20)`; g.fill(discs(2, SKETCH.bleed));
  g.fillStyle = `rgba(${INK.sepia},.20)`; g.fill(discs(2, SKETCH.disc * 0.92));
  // understood: the full wash, flecked with gold
  g.fillStyle = `rgba(${INK.deep},.30)`; g.fill(discs(3, SKETCH.disc));
  g.fillStyle = INK.fleck;
  for (const q of ground) if (q.tier >= 3 && hash(`${q.ix},${q.iz}`, 9) < 0.2) { g.beginPath(); g.arc(X((q.ix + 0.2 + hash(q.ix, q.iz) * 0.6) * cs), Z((q.iz + 0.2 + hash(q.iz, q.ix) * 0.6) * cs), Math.max(0.9, cpx * 0.09), 0, Math.PI * 2); g.fill(); }
  // the outline: the area's shape, dotted faintly (the unknown has a shape and no contents)
  if (page.outline?.length) {
    g.save(); g.strokeStyle = 'rgba(42,24,16,.38)'; g.lineWidth = 1.5; g.setLineDash([2, 6]); g.beginPath();
    page.outline.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.closePath(); g.stroke(); g.restore();
  }
  // the Raceway's tracks: roads at their width
  for (const T of page.tracks || []) for (const [pass, style] of [[0, 'rgba(42,24,16,.55)'], [1, 'rgba(236,224,196,.9)']]) {
    g.strokeStyle = style; g.lineJoin = g.lineCap = 'round'; g.lineWidth = Math.max(2, 2 * (T.pts[0]?.w || 6) * ppm) + (pass ? 0 : 3);
    g.beginPath(); T.pts.forEach((q, i) => (i ? g.lineTo(X(q.x), Z(q.z)) : g.moveTo(X(q.x), Z(q.z)))); g.closePath(); g.stroke();
  }
  // the walls: strokes joining wall cells, three widths by a hash (the brush's pressure), a lit lip under each
  const groups = [new Path2D(), new Path2D(), new Path2D()];
  for (const k of walls) {
    const [ix, iz] = k.split(',').map(Number), x = X((ix + 0.5) * cs), y = Z((iz + 0.5) * cs), p = groups[Math.floor(hash(k, 4) * 3)];
    let joined = false;
    for (const [dx, dz] of [[1, 0], [0, 1], [1, 1], [1, -1]]) if (walls.has(`${ix + dx},${iz + dz}`)) { p.moveTo(x, y); p.lineTo(x + dx * cpx, y + dz * cpx); joined = true; }
    if (!joined) { p.moveTo(x - cpx * 0.2, y); p.lineTo(x + cpx * 0.2, y); }
  }
  g.lineCap = g.lineJoin = 'round';
  groups.forEach((p, i) => { const w = Math.max(1.4, cpx * (0.42 + i * 0.12)); g.save(); g.translate(-w * 0.25, -w * 0.25); g.strokeStyle = INK.lip; g.lineWidth = w * 0.45; g.stroke(p); g.restore(); g.strokeStyle = 'rgba(42,24,16,.9)'; g.lineWidth = w; g.stroke(p); });
  return { canvas: c, ppm, x0: b.x0, z0: b.z0 };
}

/** An edge's mark laid out (no drawing): the chevron's place and its chip's rect, so the labels can keep clear of it. */
function edgeLayout(ctx, e, sx, sy, words, W, H, taken) {
  const s = SKETCH.chevron, x = Math.min(W - s - 4, Math.max(s + 4, sx)), y = Math.min(H - s - 4, Math.max(s + 4, sy));
  const label = e.down ? `${words.down}${e.name && e.visited ? ` · ${e.name}` : ''}` : e.visited ? e.name : words.unknown;
  ctx.font = `700 ${SKETCH.type}px ${FACE.name}`;
  const t = String(label).toUpperCase(), tw = ctx.measureText(t).width + 12, th = SKETCH.type + 10;
  const ox = Math.cos(e.dir || 0), oy = Math.sin(e.dir || 0);
  // the chip inside the outline, behind the chevron; a way down's beside it
  let lx = x - ox * (s + 6 + tw / 2), ly = y - oy * (s + 6 + th / 2);
  if (e.down) { lx = x + s + 6 + tw / 2; ly = y; }
  lx = Math.min(W - tw / 2 - 2, Math.max(tw / 2 + 2, lx)); ly = Math.min(H - th / 2 - 2, Math.max(th / 2 + 2, ly));
  taken.push([x - s, y - s, x + s, y + s]);
  [lx, ly] = placeLabel(taken, x, y, tw, th, W, H, s + 4, [lx - x, ly - y]);
  return { e, x, y, s, t, lx, ly, tw, th };
}

/** An edge's mark: a glazed chevron pointing out along `dir`, its neighbour's name on a paper chip beside it. */
function edgeMark(ctx, L, G) {
  const { e, x, y, s, t, lx, ly, tw, th } = L;
  ctx.save(); ctx.translate(x, y); ctx.rotate(e.dir || 0);
  const p = new Path2D(); p.moveTo(s, 0); p.lineTo(-s * 0.4, -s); p.lineTo(-s * 0.05, 0); p.lineTo(-s * 0.4, s); p.closePath();
  const gr = ctx.createLinearGradient(-s, -s, s, s); gr.addColorStop(0, tone(G.top, 0.35)); gr.addColorStop(1, tone(G.bot, 0.1));
  ctx.fillStyle = e.visited ? gr : INK.bisque; ctx.fill(p); ctx.strokeStyle = e.down ? GOLD : INK.sumi; ctx.lineWidth = 1.5; ctx.stroke(p);
  ctx.restore();
  ctx.font = `700 ${SKETCH.type}px ${FACE.name}`;
  ctx.fillStyle = 'rgba(236,224,196,.92)'; ctx.strokeStyle = 'rgba(42,24,16,.6)'; ctx.lineWidth = 1;
  ctx.fillRect(lx - tw / 2, ly - th / 2, tw, th); ctx.strokeRect(lx - tw / 2 + 0.5, ly - th / 2 + 0.5, tw - 1, th - 1);
  ctx.fillStyle = INK.sumi; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, lx, ly + 1);
}

/** Greedy label placement (the cartographer's rule, Imhof's: above first, then below, right, left, then further out): the first
 *  candidate centre whose rect is on the page and clear of every rect taken; none clear, the least overlapped. Takes its rect. */
function placeLabel(taken, x, y, w, h, W, H, gap = 10, first = null) {
  const cands = [...(first ? [first] : []), [0, -gap - h / 2], [0, gap + h / 2], [gap + 4 + w / 2, 0], [-gap - 4 - w / 2, 0],
    [0, -gap - h * 1.6], [0, gap + h * 1.6], [gap + 4 + w / 2, -h], [-gap - 4 - w / 2, -h], [gap + 4 + w / 2, h], [-gap - 4 - w / 2, h]];
  let best = null, bestHit = Infinity;
  for (const [dx, dy] of cands) {
    const cx = x + dx, cy = y + dy, r = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
    if (r[0] < 2 || r[1] < 2 || r[2] > W - 2 || r[3] > H - 2) continue;
    let hit = 0;
    for (const q of taken) hit += Math.max(0, Math.min(r[2], q[2]) - Math.max(r[0], q[0])) * Math.max(0, Math.min(r[3], q[3]) - Math.max(r[1], q[1]));
    if (hit < bestHit) { best = [cx, cy, r]; bestHit = hit; if (!hit) break; }
  }
  if (!best) best = [x, y - gap - h / 2, [x - w / 2, y - gap - h, x + w / 2, y - gap]];
  taken.push(best[2]);
  return best;
}

const KEY_ROWS = [['sensed', `rgba(${INK.sepia},.22)`], ['charted', `rgba(${INK.sepia},.45)`], ['understood', `rgba(${INK.deep},.6)`]];

/** The key's rect [x0, y0, x1, y1], so the labels keep clear of it. */
function keyRect(ctx, H, words) {
  ctx.font = `400 ${SKETCH.type}px ${FACE.ui}`;
  const w = 26 + Math.max(...KEY_ROWS.map(([k]) => ctx.measureText(words[k]).width)) + 14, h = KEY_ROWS.length * 22 + 10;
  return [10, H - h - 10, 10 + w, H - 10];
}

/** The tiers' key, in the sketch's lower left corner (the god hand, and the first opening). */
function key(ctx, H, words) {
  const rows = KEY_ROWS, [x, y, x1, y1] = keyRect(ctx, H, words), w = x1 - x, h = y1 - y;
  ctx.fillStyle = 'rgba(236,224,196,.9)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(42,24,16,.5)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  rows.forEach(([k, c], i) => {
    const yy = y + 8 + i * 22; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 15, yy + 8, 7, 0, Math.PI * 2); ctx.fill();
    if (k === 'understood') { ctx.fillStyle = INK.fleck; ctx.fillRect(x + 15, yy + 5, 2, 2); }
    ctx.fillStyle = INK.sumi; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(words[k], x + 28, yy + 9);
  });
}

/** An area's page drawn into `ctx` (its canvas sized w x h x dpr by the map's engine) at the view. */
export function areaPage(ctx, page, view) {
  const dpr = view.dpr || 1, W = view.w ?? ctx.canvas.width / dpr, H = view.h ?? ctx.canvas.height / dpr, V = view, words = { ...SKETCH.words, ...page.words };
  const G = page.glaze || glaze(), b = page.bounds;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sx = (x) => W / 2 + (x - V.x) * V.scale, sy = (z) => H / 2 + (z - V.z) * V.scale;
  // the washi, its fibres moving with the ground
  const pat = paperPattern(ctx);
  if (pat?.setTransform && typeof DOMMatrix === 'function') pat.setTransform(new DOMMatrix().translate(sx(0) % 192, sy(0) % 192));
  ctx.fillStyle = pat || INK.paper; ctx.fillRect(0, 0, W, H);
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
  vig.addColorStop(0, 'rgba(120,86,50,0)'); vig.addColorStop(1, 'rgba(120,86,50,.28)'); ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  // the sketch, from its cache
  if (b) {
    const need = Math.min(SKETCH.max / Math.max(1, b.x1 - b.x0, b.z1 - b.z0), V.scale * dpr);
    const k = `${page.area}|${page.rev ?? (page.cells || []).length}|${b.x0},${b.z0},${b.x1},${b.z1}|${(page.tracks || []).length}`;
    if (!cache || cache.key !== k || need > cache.ppm * 1.5 || need < cache.ppm / 3) { cache = build(page, need); cache.key = k; }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(cache.canvas, sx(cache.x0), sy(cache.z0), cache.canvas.width / cache.ppm * V.scale, cache.canvas.height / cache.ppm * V.scale);
  }
  // what the labels keep clear of: you, the waypoint, each edge's chevron and chip, every place's dot
  const taken = [], box = (x, y, r) => taken.push([x - r, y - r, x + r, y + r]);
  const Y = page.you, wp = page.waypoint;
  if (Y) box(sx(Y.x), sy(Y.z), 14);
  if (wp) box(sx(wp.x), sy(wp.z), 17);
  for (const p of page.places || []) box(sx(p.x), sy(p.z), 8);
  if (page.godhand || page.key) taken.push(keyRect(ctx, H, words));
  const edges = (page.edges || []).map((e) => edgeLayout(ctx, e, sx(e.x), sy(e.z), words, W, H, taken));
  ctx.font = `700 ${SKETCH.type}px ${FACE.name}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const th0 = SKETCH.type + 2, label = (t, x, y, halo) => {
    const [lx, ly] = placeLabel(taken, x, y, ctx.measureText(t).width + 6, th0, W, H);
    if (halo) { ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(236,224,196,.9)'; ctx.lineJoin = 'round'; ctx.strokeText(t, lx, ly); }
    ctx.fillStyle = INK.sumi; ctx.fillText(t, lx, ly);
  };
  // the places: an ink dot; named once charted (labels placed before the tracks' names, which are fewer and longer)
  for (const p of page.places || []) {
    const x = sx(p.x), y = sy(p.z);
    ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fillStyle = INK.sumi; ctx.fill();
    if (!p.charted) continue;
    ctx.strokeStyle = INK.fleck; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();
  }
  for (const p of page.places || []) if (p.charted) label(String(p.name).toUpperCase(), sx(p.x), sy(p.z), true);
  // the tracks' names
  for (const T of page.tracks || []) if (T.pts?.length) { const q = T.pts[0]; label(String(T.name).toUpperCase(), sx(q.x), sy(q.z), true); }
  // your plates: small brass frames, turned the way the lens looked
  for (const p of page.plates || []) {
    ctx.save(); ctx.translate(sx(p.x), sy(p.z)); ctx.rotate(Math.PI - (p.yaw || 0)); ctx.globalAlpha = 0.55 + 0.15 * Math.min(3, p.stars || 0);
    ctx.strokeStyle = '#8a6420'; ctx.lineWidth = 1.5; ctx.strokeRect(-4.5, -3.5, 9, 7); ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2.5, -3.5); ctx.lineTo(0, -7.5); ctx.lineTo(2.5, -3.5); ctx.stroke(); ctx.restore();
  }
  // Ariadne's Thread
  const th = page.thread;
  if (th?.pts?.length > 1) {
    ctx.save(); ctx.strokeStyle = INK.thread; ctx.lineWidth = 2.5; ctx.lineJoin = ctx.lineCap = 'round'; if (th.dashed) ctx.setLineDash([4, 6]);
    ctx.beginPath(); th.pts.forEach((q, i) => (i ? ctx.lineTo(sx(q.x), sy(q.z)) : ctx.moveTo(sx(q.x), sy(q.z)))); ctx.stroke(); ctx.restore();
  }
  // the Sight's waypoint: a vermilion ring with four ticks
  if (wp) {
    const x = sx(wp.x), y = sy(wp.z); ctx.strokeStyle = INK.vermilion; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.moveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); ctx.lineTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16); } ctx.stroke();
    ctx.fillStyle = INK.vermilion; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  // the edges
  for (const L of edges) edgeMark(ctx, L, G);
  // the god hand's tether, and you
  if (page.godhand) { ctx.save(); ctx.strokeStyle = 'rgba(176,122,30,.75)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(sx(page.godhand.x), sy(page.godhand.z), page.godhand.r * V.scale, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  if (Y) {
    ctx.save(); ctx.translate(sx(Y.x), sy(Y.z)); ctx.rotate(Math.PI - (Y.yaw || 0));
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(9, 10); ctx.lineTo(0, 5); ctx.lineTo(-9, 10); ctx.closePath();
    ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(236,224,196,.95)'; ctx.stroke(); ctx.fillStyle = INK.you; ctx.fill();
    ctx.restore();
  }
  if (page.godhand || page.key) key(ctx, H, words);
}

/** The sketch's canvas and the paper's tile let go (the map closed): nothing of the page stays resident. */
export function disposeAreaPage() {
  if (cache) { cache.canvas.width = cache.canvas.height = 0; cache = null; }
  disposePaper();
}
