// ---------------------------------------------------------------------------------------
// THE MAP'S DRESS: THE ISLAND LEVEL (board v1's B1, ruled by the owner 2026-10-25 because it lets an Island of Ego change its number of
// areas readily; Dovina's MAP.md 2). An island's places as a graph drawn in glazed tiles of the Clay dress, laid out from the graph
// alone, so a sixth area or a new island needs no art change:
//   A CLUSTER   a node others name as `parent` (the Dunes): its children as a ring of annular wedges round its hub (the child that meets
//               all the others, drawn as a disc in the middle), cut by each child's `arc` (degrees, the canvas's frame: 0 east, 90
//               down) or in equal shares in the graph's order. The first, biggest cluster is the ring; with none, the best-linked
//               place stands in the middle as a tile.
//   THE OTHERS  chamfered tiles hung off the ring toward the wedge they meet (or the tile they meet), pushed apart and kept inside.
//   THE WAYS    a neighbour as a string is a walked way (a solid line); `{ id, via: 'index' }` the Index's spoke (dotted); `label` names it.
//   A NODE      visited: glazed in the window colour, its ground's silhouette pressed in, one summed N of M (or its `note`, as a Great
//               Dunemaw's FLOOR 2). An unvisited neighbour of a visited one: cracked bisque and "???". Anything further: not drawn.
//               The node you are in is lit, its keyline the schiller; a whole one (n of n) wears a gold kintsugi rim.
// Pure: drawn when called (only when what it shows changed), from its arguments alone, into the canvas handed (sized by the map's
// engine at the device ratio); it returns its hit areas for a tap (Petra's engine owns input).
//
// Prior art: Final Fantasy XII's region map (named areas, the unvisited blank), Outer Wilds' rumour graph (places as nodes, ways as
// lines), Metroid Prime's per-area number, Spyro's N of M, the kintsugi repair's gold seam; the house's Clay dress and window colour.
//
//   islandLook(ctx, graph, state) -> { hits }      graph: [{ id, name, parent?, neighbours, visited, here, n, m, silhouette?, arc?, note? }]
//                                                  state: { w, h, dpr, glaze?, words? }   (the box in CSS px; the canvas sized at w x h x dpr)
//   islandHit(hits, x, y) -> { id, visited } | null
// ---------------------------------------------------------------------------------------
import { INK, FACE, GOLD, FILM, glaze, tone, silhouette, hash, wrap } from './ink.js';

/** The island level's numbers (CSS px): the least type, a tile's size against the box, the gaps. */
export const ISLAND_LOOK = { type: 14, count: 18, tileMin: 112, tileMax: 172, tileK: 0.24, gap: 26, pad: 10, chamfer: 9, iters: 40,
  words: { unknown: '???', of: 'of' } }; // (words: placeholders, Espada's)

const D2R = Math.PI / 180;
const idOf = (nb) => (typeof nb === 'string' ? nb : nb.id);

/** The graph's ways, each once: { a, b, via, label }. */
function waysOf(graph) {
  const seen = new Set(), out = [];
  for (const n of graph) for (const nb of n.neighbours || []) {
    const b = idOf(nb), k = [n.id, b].sort().join('|');
    if (seen.has(k)) continue; seen.add(k);
    out.push({ a: n.id, b, via: (typeof nb === 'object' && nb.via) || 'walk', label: typeof nb === 'object' ? nb.label : undefined });
  }
  return out;
}

/** What is drawn: visited nodes 'seen', their unvisited neighbours 'unknown'; a cluster when any child is drawn. */
function shownOf(graph, ways, byId) {
  const shown = new Map();
  for (const n of graph) if (n.visited) shown.set(n.id, 'seen');
  for (const w of ways) {
    const A = byId.get(w.a), B = byId.get(w.b); if (!A || !B) continue;
    if (A.visited && !B.visited && !shown.has(B.id)) shown.set(B.id, 'unknown');
    if (B.visited && !A.visited && !shown.has(A.id)) shown.set(A.id, 'unknown');
  }
  return shown;
}

/** The layout: the cluster's ring and every other node's tile, in CSS px. */
function layout(graph, byId, ways, shown, W, H) {
  const L = ISLAND_LOOK, kids = new Map();
  for (const n of graph) if (n.parent && byId.has(n.parent)) (kids.get(n.parent) || kids.set(n.parent, []).get(n.parent)).push(n);
  const clusterId = [...kids.keys()].sort((a, b) => kids.get(b).length - kids.get(a).length)[0] || null;
  const tileW = Math.max(L.tileMin, Math.min(L.tileMax, Math.min(W, H) * L.tileK)), tileH = Math.round(tileW * 0.5);
  const cx = W / 2, cy = H / 2, place = new Map();
  let ring = null;
  if (clusterId) {
    const members = kids.get(clusterId), ids = new Set(members.map((m) => m.id));
    const meets = (m) => (m.neighbours || []).filter((nb) => ids.has(idOf(nb))).length;
    const hubC = members.reduce((b, m) => (meets(m) > meets(b) ? m : b), members[0]);
    const hub = members.length > 2 && meets(hubC) >= members.length - 1 && !hubC.arc ? hubC : null;
    const field = members.filter((m) => m !== hub);
    const R = Math.min(W, H) * (W > H * 1.9 || H > W * 1.4 ? 0.42 : 0.36); // (a phone's box: the ring fills the short side, board D)
    const r0 = hub ? R * 0.38 : R * 0.3;
    ring = { id: clusterId, cx, cy, R, r0, hub, wedges: [] };
    let a = -90;
    const share = 360 / Math.max(1, field.length);
    for (const m of field) {
      const [a0, a1] = m.arc ? [m.arc[0], m.arc[1] < m.arc[0] ? m.arc[1] + 360 : m.arc[1]] : [a, a + share];
      a = a1;
      ring.wedges.push({ node: m, a0: a0 * D2R, a1: a1 * D2R, mid: ((a0 + a1) / 2) * D2R });
    }
    for (const w of ring.wedges) place.set(w.node.id, { kind: 'wedge', angle: w.mid, w });
    if (hub) place.set(hub.id, { kind: 'hub', angle: 0 });
    place.set(clusterId, { kind: 'cluster', angle: 0 });
  }
  // the others: tiles hung toward what they meet
  const free = graph.filter((n) => !place.has(n.id) && !(n.parent && byId.get(n.parent) && place.has(n.parent)) && shown.has(n.id));
  const support = (t) => Math.abs(Math.cos(t)) * tileW / 2 + Math.abs(Math.sin(t)) * tileH / 2;
  const tiles = [];
  if (!ring && free.length) { // (no cluster: the best-linked place in the middle)
    const mid = free.reduce((b, n) => ((n.neighbours || []).length > (b.neighbours || []).length ? n : b), free[0]);
    const t = { node: mid, x: cx, y: cy, fixed: true }; tiles.push(t); place.set(mid.id, { kind: 'tile', t, angle: 0 });
  }
  const angleToward = (n) => {
    const angs = [];
    for (const w of ways) {
      const o = w.a === n.id ? w.b : w.b === n.id ? w.a : null; if (!o) continue;
      const p = place.get(o) || place.get(byId.get(o)?.parent);
      if (p && p.kind !== 'cluster' && p.kind !== 'hub') angs.push(p.angle);
      else if (p) angs.push(null);
    }
    const real = angs.filter((x) => x != null);
    if (!real.length) return null;
    const sx = real.reduce((s, x) => s + Math.cos(x), 0), sy = real.reduce((s, x) => s + Math.sin(x), 0);
    return Math.atan2(sy, sx);
  };
  let pending = free.filter((n) => !place.has(n.id)), guard = 0;
  while (pending.length && guard++ < 8) {
    const next = [];
    for (const n of pending) {
      const ang = angleToward(n);
      if (ang == null && guard < 4) { next.push(n); continue; }
      const t = ang ?? (-Math.PI / 2 + (tiles.length / Math.max(1, free.length)) * Math.PI * 2);
      const Rr = ring ? ring.R : tileW * 0.6;
      const sides = W / 2 - Rr >= tileW + L.gap + L.pad, rows = H / 2 - Rr >= tileH + L.gap + L.pad;
      const lane = sides && (Math.abs(Math.cos(t)) > 0.35 || !rows) ? 'radial' : rows ? 'rows' : 'radial'; // (no room beside the ring: above or below it)
      const kin = tiles.filter((o) => !o.fixed && o.lane === lane && (lane === 'rows' ? Math.sign(o.y - cy) === (Math.sin(t) > 0 ? 1 : -1) && Math.abs(o.x - (cx + Math.cos(t) * Rr)) < tileW : Math.abs(Math.atan2(o.y - cy, o.x - cx) - t) < 0.2)).length;
      let tile;
      if (lane === 'rows') { const up = Math.sin(t) > 0 ? 1 : -1; tile = { node: n, lane, x: cx + Math.cos(t) * Rr, y: cy + up * (Rr + L.gap * 0.6 + tileH / 2 + kin * (tileH + 10)) }; }
      else { const d = Rr + L.gap + support(t) + kin * (support(t) * 2 + L.gap * 0.5); tile = { node: n, lane, x: cx + Math.cos(t) * d, y: cy + Math.sin(t) * d }; }
      tiles.push(tile); place.set(n.id, { kind: 'tile', t: tile, angle: t });
    }
    pending = next;
  }
  // pushed apart, kept off the ring and inside the box
  const hw = tileW / 2, hh = tileH / 2, minX = hw + L.pad, maxX = W - hw - L.pad, minY = hh + L.pad, maxY = H - hh - L.pad;
  for (let it = 0; it < L.iters; it++) {
    for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) {
      const A = tiles[i], B = tiles[j], ox = tileW + 10 - Math.abs(A.x - B.x), oy = tileH + 10 - Math.abs(A.y - B.y);
      if (ox <= 0 || oy <= 0) continue;
      const [ax, ay] = ox < oy ? [Math.sign(B.x - A.x || 1) * ox / 2, 0] : [0, Math.sign(B.y - A.y || 1) * oy / 2];
      if (!A.fixed) { A.x -= B.fixed ? ax * 2 : ax; A.y -= B.fixed ? ay * 2 : ay; }
      if (!B.fixed) { B.x += A.fixed ? ax * 2 : ax; B.y += A.fixed ? ay * 2 : ay; }
    }
    for (const t of tiles) {
      if (t.fixed) continue;
      if (ring) {
        const a = Math.atan2(t.y - cy, t.x - cx), need = ring.R + 8 + support(a), d = Math.hypot(t.x - cx, t.y - cy);
        if (d < need) { t.x = cx + Math.cos(a) * need; t.y = cy + Math.sin(a) * need; }
      }
      t.x = Math.min(maxX, Math.max(minX, t.x)); t.y = Math.min(maxY, Math.max(minY, t.y));
    }
  }
  return { ring, tiles, place, tileW, tileH, cx, cy };
}

// ---- drawing
const glazeFill = (ctx, G, x0, y0, x1, y1, here) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, tone(G.top, here ? 0.42 : 0.24)); g.addColorStop(0.55, tone(G.top, here ? 0.12 : 0)); g.addColorStop(1, tone(G.bot, here ? 0.3 : 0.12));
  return g;
};
const filmStroke = (ctx, x0, y0, x1, y1) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); FILM.concat(FILM[0]).forEach((c, i) => g.addColorStop(i / 4, c)); return g; };

/** Bisque: unglazed, pale, crazed with a few cracks (seeded by the node's id), inside the current path. */
function bisque(ctx, path, id, box) {
  ctx.save(); ctx.fillStyle = INK.bisque; ctx.fill(path); ctx.clip(path);
  const g = ctx.createRadialGradient(box.x + box.w * 0.3, box.y + box.h * 0.3, 2, box.x + box.w / 2, box.y + box.h / 2, Math.max(box.w, box.h));
  g.addColorStop(0, 'rgba(255,246,228,.35)'); g.addColorStop(1, 'rgba(120,90,60,.3)'); ctx.fillStyle = g; ctx.fill(path);
  ctx.strokeStyle = INK.crack; ctx.lineWidth = 1.1; ctx.lineJoin = 'round';
  for (let k = 0; k < 4; k++) {
    let x = box.x + hash(id, 10 + k) * box.w, y = box.y + hash(id, 20 + k) * box.h, a = hash(id, 30 + k) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let s = 0; s < 5; s++) { a += (hash(id, 40 + k * 7 + s) - 0.5) * 1.6; x += Math.cos(a) * 11; y += Math.sin(a) * 11; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = INK.bisqueDark; ctx.lineWidth = 1.5; ctx.stroke(path);
}

/** The gold rim of a whole node, and two kintsugi seams running in from it. */
function kintsugi(ctx, path, id, box) {
  ctx.save(); ctx.strokeStyle = INK.kintsugi; ctx.lineWidth = 3; ctx.shadowColor = 'rgba(255,211,106,.6)'; ctx.shadowBlur = 6; ctx.stroke(path); ctx.restore();
  ctx.save(); ctx.clip(path); ctx.strokeStyle = GOLD; ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
  for (let k = 0; k < 2; k++) {
    let x = box.x + (k ? box.w : 0), y = box.y + hash(id, 50 + k) * box.h, a = k ? Math.PI : 0;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let s = 0; s < 4; s++) { a += (hash(id, 60 + k * 5 + s) - 0.5) * 1.2; x += Math.cos(a) * box.w * 0.09; y += Math.sin(a) * box.w * 0.09; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  ctx.restore();
}

/** A silhouette pressed into the glaze at (x, y), `s` px across: the dark of the press and a lit lower lip. */
function pressed(ctx, key, x, y, s, G) {
  const p = silhouette(key); if (!p) return;
  ctx.save(); ctx.translate(x - s / 2, y - s / 2); ctx.scale(s / 24, s / 24);
  ctx.translate(0.7, 0.7); ctx.fillStyle = tone(G.top, 0.5, 0.45); ctx.fill(p, 'evenodd');
  ctx.translate(-0.7, -0.7); ctx.fillStyle = tone(G.bot, -0.35, 0.85); ctx.fill(p, 'evenodd');
  ctx.restore();
}

/** A node's words: name (wrapped), then its N of M, its note or "???", centred on (x, y) in a box `w` wide. */
function words(ctx, n, state, x, y, w, unknown) {
  const L = ISLAND_LOOK, W = { ...L.words, ...state.words };
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (unknown) { ctx.font = `400 ${L.count + 4}px ${FACE.count}`; ctx.fillStyle = 'rgba(70,46,28,.85)'; ctx.fillText(W.unknown, x, y); return; }
  ctx.font = `700 ${L.type}px ${FACE.name}`;
  const lines = wrap(ctx, String(n.name || n.id).toUpperCase(), w);
  const lh = L.type + 2, count = n.note || (n.m ? `${n.n || 0} ${W.of} ${n.m}` : '');
  const h = lines.length * lh + (count ? L.count + 2 : 0);
  let yy = y - h / 2 + lh / 2;
  ctx.fillStyle = INK.salt; ctx.shadowColor = 'rgba(10,4,2,.7)'; ctx.shadowOffsetY = 1;
  for (const s of lines) { ctx.fillText(s, x, yy); yy += lh; }
  if (count) { ctx.font = `400 ${L.count}px ${FACE.count}`; ctx.fillStyle = n.m && n.n >= n.m ? GOLD : INK.salt; ctx.fillText(count, x, yy + 1); }
  ctx.shadowColor = 'transparent'; ctx.shadowOffsetY = 0;
}

/** Fill, lit or whole, for a node's shape `path` in `box`. */
function finish(ctx, path, n, kind, G, box) {
  if (kind === 'unknown') { bisque(ctx, path, n.id, box); return; }
  ctx.fillStyle = glazeFill(ctx, G, box.x, box.y, box.x + box.w * 0.6, box.y + box.h, n.here); ctx.fill(path);
  ctx.save(); ctx.clip(path); ctx.strokeStyle = 'rgba(255,236,214,.22)'; ctx.lineWidth = 2; ctx.translate(1.2, 1.2); ctx.stroke(path); ctx.restore(); // (the glaze's lit inner lip)
  ctx.strokeStyle = 'rgba(20,8,4,.85)'; ctx.lineWidth = 1.5; ctx.stroke(path);
  if (n.m && (n.n || 0) >= n.m) kintsugi(ctx, path, n.id, box);
  if (n.here) { ctx.save(); ctx.strokeStyle = filmStroke(ctx, box.x, box.y, box.x + box.w, box.y + box.h); ctx.lineWidth = 3; ctx.shadowColor = 'rgba(255,240,200,.5)'; ctx.shadowBlur = 10; ctx.stroke(path); ctx.restore(); }
}

const tilePath = (x, y, w, h, c) => { const p = new Path2D(); p.moveTo(x + c, y); p.lineTo(x + w, y); p.lineTo(x + w, y + h - c); p.lineTo(x + w - c, y + h); p.lineTo(x, y + h); p.lineTo(x, y + c); p.closePath(); return p; };
const wedgePath = (cx, cy, r0, r1, a0, a1) => { const p = new Path2D(); p.arc(cx, cy, r1, a0, a1); p.arc(cx, cy, r0, a1, a0, true); p.closePath(); return p; };

/** The island level drawn into `ctx` (CSS px) inside state's box; returns the hit areas for a tap. */
export function islandLook(ctx, graph, state = {}) {
  const dpr = state.dpr || 1, W = state.w ?? ctx.canvas.width / dpr, H = state.h ?? ctx.canvas.height / dpr, L = ISLAND_LOOK, G = state.glaze || glaze();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const byId = new Map(graph.map((n) => [n.id, n])), ways = waysOf(graph), shown = shownOf(graph, ways, byId);
  for (const n of graph) if (n.parent && shown.has(n.id) && byId.has(n.parent)) shown.set(n.parent, 'seen');
  const lay = layout(graph, byId, ways, shown, W, H), { ring, place, tileW, tileH } = lay, hits = [];
  // the panel: a recessed clay ground under the tiles
  ctx.save();
  const bg = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.hypot(W, H) / 2);
  bg.addColorStop(0, tone(G.top, -0.35)); bg.addColorStop(1, tone(G.bot, -0.3)); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // where a node is, to draw a way to it: a tile's centre, a wedge's middle, the hub, the ring's edge for the cluster
  const at = (id) => {
    const p = place.get(id); if (!p) return null;
    if (p.kind === 'tile') return { x: p.t.x, y: p.t.y };
    if (p.kind === 'wedge') { const r = (ring.r0 + ring.R) / 2; return { x: ring.cx + Math.cos(p.angle) * r, y: ring.cy + Math.sin(p.angle) * r }; }
    return { x: ring.cx, y: ring.cy, ring: true };
  };
  // the ways
  for (const w of ways) {
    if (!shown.has(w.a) || !shown.has(w.b)) continue;
    let A = at(w.a), B = at(w.b); if (!A || !B) continue;
    const inRing = (id) => place.get(id)?.kind === 'wedge' || place.get(id)?.kind === 'hub';
    if (inRing(w.a) && inRing(w.b)) continue; // (wedges meet edge to edge: the ring says it)
    if (A.ring) { const a = Math.atan2(B.y - A.y, B.x - A.x); A = { x: A.x + Math.cos(a) * ring.R, y: A.y + Math.sin(a) * ring.R }; }
    if (B.ring) { const a = Math.atan2(A.y - B.y, A.x - B.x); B = { x: B.x + Math.cos(a) * ring.R, y: B.y + Math.sin(a) * ring.R }; }
    ctx.strokeStyle = w.via === 'index' ? 'rgba(239,230,210,.55)' : 'rgba(239,230,210,.75)'; ctx.lineWidth = w.via === 'index' ? 2 : 3;
    ctx.setLineDash(w.via === 'index' ? [2, 7] : []); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.setLineDash([]);
    if (w.label) {
      ctx.font = `italic 400 ${L.type}px ${FACE.lore}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = 'rgba(239,230,210,.7)';
      ctx.fillText(w.label, (A.x + B.x) / 2, (A.y + B.y) / 2 - 4);
    }
  }
  // the ring
  if (ring) {
    const C = byId.get(ring.id);
    ctx.font = `700 ${L.type + 2}px ${FACE.name}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = 'rgba(239,230,210,.6)';
    ctx.fillText(String(C?.name || ring.id).toUpperCase().split('').join(' '), ring.cx, ring.cy - ring.R - 8);
    ctx.beginPath(); ctx.arc(ring.cx, ring.cy, ring.R + 4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(10,4,2,.35)'; ctx.fill();
    for (const w of ring.wedges) {
      const kind = shown.get(w.node.id); if (!kind) continue;
      const gap = 0.012, path = wedgePath(ring.cx, ring.cy, ring.r0 + 3, ring.R, w.a0 + gap, w.a1 - gap);
      const box = { x: ring.cx - ring.R, y: ring.cy - ring.R, w: ring.R * 2, h: ring.R * 2 };
      finish(ctx, path, w.node, kind, G, box);
      const rm = (ring.r0 + ring.R) / 2 + 2, mx = ring.cx + Math.cos(w.mid) * rm, my = ring.cy + Math.sin(w.mid) * rm;
      const chord = Math.min(2 * rm * Math.sin((w.a1 - w.a0) / 2) * 0.86, (ring.R - ring.r0) * 1.25);
      const s = Math.min(30, (ring.R - ring.r0) * 0.3);
      if (kind === 'seen') { pressed(ctx, w.node.silhouette || 'generic', mx, my - s * 0.9, s, G); words(ctx, w.node, state, mx, my + s * 0.35, Math.max(60, chord), false); }
      else words(ctx, w.node, state, mx, my, chord, true);
      hits.push({ id: w.node.id, visited: !!w.node.visited, kind: 'wedge', cx: ring.cx, cy: ring.cy, r0: ring.r0, r1: ring.R, a0: w.a0, a1: w.a1 });
    }
    if (ring.hub && shown.get(ring.hub.id)) {
      const n = ring.hub, kind = shown.get(n.id), p = new Path2D(); p.arc(ring.cx, ring.cy, ring.r0, 0, Math.PI * 2);
      const box = { x: ring.cx - ring.r0, y: ring.cy - ring.r0, w: ring.r0 * 2, h: ring.r0 * 2 };
      finish(ctx, p, n, kind, G, box);
      const s = Math.min(26, ring.r0 * 0.45);
      if (kind === 'seen') { pressed(ctx, n.silhouette || 'generic', ring.cx, ring.cy - ring.r0 * 0.45, s, G); words(ctx, n, state, ring.cx, ring.cy + s * 0.3, ring.r0 * 1.7, false); }
      else words(ctx, n, state, ring.cx, ring.cy, ring.r0 * 1.6, true);
      hits.push({ id: n.id, visited: !!n.visited, kind: 'circle', cx: ring.cx, cy: ring.cy, r: ring.r0 });
    }
  }
  // the tiles
  for (const t of lay.tiles) {
    const n = t.node, kind = shown.get(n.id); if (!kind) continue;
    const x = t.x - tileW / 2, y = t.y - tileH / 2, path = tilePath(x, y, tileW, tileH, L.chamfer), box = { x, y, w: tileW, h: tileH };
    ctx.save(); ctx.translate(0, 3); ctx.fillStyle = 'rgba(8,3,1,.45)'; ctx.fill(path); ctx.restore(); // (its shadow on the panel)
    finish(ctx, path, n, kind, G, box);
    const s = Math.min(30, tileH * 0.5);
    if (kind === 'seen') { pressed(ctx, n.silhouette || 'generic', x + 8 + s / 2, y + tileH / 2, s, G); words(ctx, n, state, x + 14 + s + (tileW - 22 - s) / 2, t.y, tileW - 26 - s, false); }
    else words(ctx, n, state, t.x, t.y, tileW - 16, true);
    hits.push({ id: n.id, visited: !!n.visited, kind: 'rect', x, y, w: tileW, h: tileH });
  }
  ctx.restore();
  return { hits };
}

/** The node under a tap at (x, y) CSS px, or null. */
export function islandHit(hits, x, y) {
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i];
    if (h.kind === 'rect' && x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return { id: h.id, visited: h.visited };
    if (h.kind === 'circle' && Math.hypot(x - h.cx, y - h.cy) <= h.r) return { id: h.id, visited: h.visited };
    if (h.kind === 'wedge') {
      const d = Math.hypot(x - h.cx, y - h.cy); if (d < h.r0 || d > h.r1) continue;
      let a = Math.atan2(y - h.cy, x - h.cx); while (a < h.a0) a += Math.PI * 2;
      if (a <= h.a1) return { id: h.id, visited: h.visited };
    }
  }
  return null;
}
