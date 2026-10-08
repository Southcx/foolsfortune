// ---------------------------------------------------------------------------------------
// THE SEA CHART'S LOOK (docs/plans/PASSAGE.md, sections 2 to 5 and 14): the constellation of waypoints between two islands, drawn at the
// pier for drafting the passage. The pier's window is a page of the Index's window (world/emocean/pier.js, feedback/indexmenu.js: DOM),
// so the sea chart is 2D: pixel art at 1x on the maker's ramp (ui/seachart/icons.js, ui/pixel.js), scaled by a whole number, over the
// crude (black, its oil film in dithered bands of labradorite, a portolan's rhumb lines and wind rose laid faint across it).
//
//   THE ISLANDS stand at the two ends, the one you leave on the left. THE LANES are lines of light between waypoints: faint where they
//   run into the fog (their light falls with the confidence of the far end), awake where they are the ways on from the passage's head,
//   gold-white once drafted, each newly drafted one brightening from its start to its end, a mote of light running the passage.
//   A WAYPOINT is drawn by its portent's tier: exact (its silhouette and emblem crisp, its strength in pips); two or three candidates
//   (each emblem out of focus and faded by the confidence, overlaid a little apart, the one in front changing slowly; the silhouette
//   crisp when the candidates share a class, since then the class is known); its class (the silhouette alone, crisp); a dim star
//   (something is there). The icons are in the line hand; the feeling is a nimbus round the icon with its weather's motif, from the
//   silhouette tier up (ui/seachart/nimbus.js). The storm mark's flame is always shown, and the lanes at a storm bend with it. Where the
//   draught's trump holds (the pier says which: `trumpOf`) the lane takes the trumping feeling's colour, beads of it running toward the
//   trumped waypoint. The day's best is a pale line beside its lanes; a stretch sailed adrift, a dashed current. The sloop marks you.
//   THE SAME DRAWING IN INK (`look: 'ink'`) is a rutter's page (vfx/rutter.js): iron-gall lines and emblems on vellum, the passage gilt,
//   the feelings washed in as a hand-coloured chart's are, the rhumb lines in the portolan's black, green and red.
//
// Prior art: Slay the Spire's map (columns of rooms, lanes that merge and never cross, the drafted path drawn over the rest), FTL's
// sector map (the next jumps lit), the medieval portolan chart (the rhumb lines from a wind rose, hand-coloured, in black, green and
// red), and the hurricane cone and quantile dotplots behind PASSAGE.md's portents (counts, never a crisp edge where knowledge ends).
//
//   const sc = new SeaChart({ maxWidth, onPick, onHover })   el.appendChild(sc.canvas)
//   sc.set(chart, { portents, drafted, at, hover, trumpOf, ghost, drift, classOf, ship })   sc.pick(clientX, clientY) -> id | 'from' | 'to' | null
//   sc.draw(t?)   sc.dispose()        drawSeaChart(canvas, chart, { scale, look, t, since, ...the same })   layout(chart)   CHART_SIZE
//   chart: Dovina's seaChart() (progress/econ/passage.js): { route, from, to, day, columns, rows, waypoints: { id: { col, row, type,
//   strength, feel, storm } }, edges: [[a, b]], first, last }.  portents: { id: portent(chart, w, depth, sight, level) } (a missing one
//   is drawn exact; depth counts from where the ship is).  drafted: the passage so far, waypoint ids in column order.  at: the waypoint
//   the ship is at (null: the pier).  trumpOf(a, b) -> 'trumps' | 'trumped' | null (trip.js draughtTrump of the two feelings).
//   ghost: the day's best passage, waypoint ids (voyage.bestOf's run).  drift: [[a, b], ...] the lanes a ship was carried along adrift.
//   classOf(type) -> 'threat' | 'haven' | 'boss' (passage.js classOf; the icons' own table if left out).  ship: false hides the sloop.
// ---------------------------------------------------------------------------------------
import { px } from '../pixel.js';
import { waypointIcon, silhouetteIcon, emblemIcon, islandIcon, markIcon, ringIcon, scaled, blurred, classOfType } from './icons.js';
import { drawNimbus, drawBead, feelColor } from './nimbus.js';

export const CHART_SIZE = { w: 336, h: 200 }; // (art pixels: twice it, 672, fits the Index's window, 720 wide less its padding)
const MID = CHART_SIZE.h / 2, X0 = 70, X1 = 266, FROM_X = 22, TO_X = CHART_SIZE.w - 22;
const GAP = { threat: 12, haven: 10, boss: 13, island: 15, star: 4 }; // (how far short of a waypoint's centre a lane stops, art pixels)

function hash01(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; return (h >>> 0) / 4294967296; }

/** Where everything stands, in art pixels: each waypoint at its column and row (a little off the grid, the same every time for a game
 *  day's sea, so it reads as a constellation rather than a table), the islands at the two ends. */
export function layout(chart) {
  const C = chart.columns || 1, R = chart.rows || 1, rowH = R > 1 ? Math.min(38, 144 / (R - 1)) : 0, at = {};
  for (const w of Object.values(chart.waypoints)) {
    const x = C > 1 ? X0 + (w.col * (X1 - X0)) / (C - 1) : (X0 + X1) / 2, y = MID + (w.row - (R - 1) / 2) * rowH;
    const jx = Math.round((hash01(`${w.id}:x:${chart.day}`) - 0.5) * 7), jy = Math.round((hash01(`${w.id}:y:${chart.day}`) - 0.5) * 5);
    at[w.id] = { x: Math.round(x) + jx, y: Math.round(y) + jy };
  }
  at.from = { x: FROM_X, y: MID }; at.to = { x: TO_X, y: MID };
  return at;
}

// ---- the ground: the crude (or the bare page, for the ink), with the rhumb lines and the wind rose, at 1x, cached
const GROUND = new Map();
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
function noise(x, y, seed) { // (value noise: a lattice of the hash, smoothed)
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const h = (i, j) => hash01(`${seed}:${i}:${j}`);
  return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
}
const FILM = [[22, 34, 66], [16, 52, 62], [40, 44, 24], [44, 26, 64], [22, 34, 66]]; // (labradorite's sheen in order: blue, teal, gold, violet, blue)
function filmAt(f) { const k = (((f % 1) + 1) % 1) * (FILM.length - 1), i = Math.floor(k), t = k - i, a = FILM[i], b = FILM[i + 1]; return [0, 1, 2].map((c) => a[c] + (b[c] - a[c]) * t); }
const ROSE = { x: CHART_SIZE.w / 2, y: CHART_SIZE.h - 18 };
function groundOf(look, seed) {
  const key = `${look}|${seed}`; if (GROUND.has(key)) return GROUND.get(key);
  const { w, h } = CHART_SIZE, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (look !== 'ink') {
    const d = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = noise(x / 70, y / 46, seed) * 0.65 + noise(x / 23, y / 17, `${seed}b`) * 0.35;
      const swell = Math.abs(((y + 2.5 * Math.sin(x / 19 + y / 9) + n * 6) % 9) - 4.5) < 0.6 ? 0.9 : 0; // (the engraved swells)
      const vig = 1 - Math.min(1, Math.hypot((x - w / 2) / (w * 0.62), (y - h / 2) / (h * 0.7))) ** 2 * 0.55;
      const b = Math.max(0, Math.min(1, (n - 0.28) * 1.5)) * vig, level = Math.min(6, Math.floor(b * 4 + swell * b + BAYER[(y & 3) * 4 + (x & 3)]));
      const [r, gg, bb] = filmAt(n * 1.8 + y / 260), k = 0.22 + level * 0.13, o = (y * w + x) * 4;
      d.data[o] = 5 + r * k; d.data[o + 1] = 4 + gg * k; d.data[o + 2] = 9 + bb * k; d.data[o + 3] = 255;
    }
    g.putImageData(d, 0, 0);
  }
  // the rhumb lines: sixteen winds from the rose (the portolan's eight main winds in black, the half winds green, the quarter red;
  // on the crude, all faint gold)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, main = i % 2 === 0;
    g.strokeStyle = look === 'ink' ? (i % 4 === 0 ? 'rgba(40,28,18,.32)' : main ? 'rgba(46,92,52,.3)' : 'rgba(150,44,30,.28)') : main ? 'rgba(242,204,90,.09)' : 'rgba(242,204,90,.05)';
    g.lineWidth = 1; g.beginPath(); g.moveTo(ROSE.x + Math.cos(a) * 9, ROSE.y + Math.sin(a) * 9); g.lineTo(ROSE.x + Math.cos(a) * 420, ROSE.y + Math.sin(a) * 420); g.stroke();
  }
  if (look === 'ink') { g.strokeStyle = 'rgba(40,28,18,.6)'; g.lineWidth = 1; g.strokeRect(1.5, 1.5, w - 3, h - 3); g.strokeStyle = 'rgba(40,28,18,.3)'; g.strokeRect(4.5, 4.5, w - 9, h - 9); } // (the neatline: a chart drawn on a page ends at a ruled edge)
  // the rose: an eight-point star, the north point longest
  const pt = (r, a) => [ROSE.x + Math.cos(a) * r, ROSE.y + Math.sin(a) * r];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2, L = i === 0 ? 11 : i % 2 ? 5 : 8;
    g.fillStyle = look === 'ink' ? (i === 0 ? 'rgba(150,44,30,.7)' : 'rgba(40,28,18,.55)') : i === 0 ? 'rgba(255,230,150,.32)' : 'rgba(242,204,90,.16)';
    g.beginPath(); g.moveTo(...pt(L, a)); g.lineTo(...pt(2, a + 0.6)); g.lineTo(ROSE.x, ROSE.y); g.lineTo(...pt(2, a - 0.6)); g.closePath(); g.fill();
  }
  if (GROUND.size > 24) GROUND.clear();
  GROUND.set(key, c);
  return c;
}

// ---- the lanes: each a line, or, where a storm stands at either end, a line the storm bends (the warp the crossing uses, seen from above)
const LINE = {
  crude: { lane: [182, 160, 236], open: [255, 224, 150], drafted: [255, 246, 214], glow: [242, 204, 90], ghost: [214, 232, 255], drift: [159, 224, 232] },
  ink: { lane: [58, 40, 26], open: [58, 40, 26], drafted: [201, 150, 44], glow: [201, 150, 44], drift: [58, 90, 96] }, // (no day's best on a rutter's page: the trip is sailed)
};
const rgba = ([r, g, b], a) => `rgba(${r | 0},${g | 0},${b | 0},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
function gapOf(chart, id) {
  if (id === 'from' || id === 'to') return GAP.island;
  const w = chart.waypoints[id]; return w ? GAP[classOfType(w.type)] : GAP.threat;
}
/** The points of a lane from A to B, cut short of both ends by `ga` and `gb`, from share k0 to k1 of it (a lane brightening), bent
 *  across itself when `bend` (a storm at an end: two art pixels at most, at the middle, never at the ends, its wave moving slowly), and
 *  set `off` art pixels to one side (the day's best beside the passage). */
function lanePath(A, B, ga, gb, { k0 = 0, k1 = 1, bend = false, t = 0, off = 0 } = {}) {
  const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, len = Math.max(0, L - ga - gb), n = bend ? 14 : 1, out = [];
  for (let i = 0; i <= n; i++) {
    const k = k0 + ((k1 - k0) * i) / n, u = (ga + len * k) / L, w = bend ? 2 * Math.sin(Math.PI * u) * Math.sin(Math.PI * 3 * u - t * 0.9) : 0;
    out.push([A.x + dx * u - uy * (w + off), A.y + dy * u + ux * (w + off)]);
  }
  return out;
}
const at01 = (pts, k) => { const f = Math.max(0, Math.min(1, k)) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), r = f - i; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r]; };
function stroke(g, s, pts, color, width, alpha, dash = null, dashOff = 0) {
  g.strokeStyle = rgba(color, alpha); g.lineWidth = width * s; g.setLineDash(dash ? dash.map((d) => d * s) : []); g.lineDashOffset = dashOff * s;
  g.beginPath(); g.moveTo(pts[0][0] * s, pts[0][1] * s); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] * s, pts[i][1] * s); g.stroke();
}

// ---- the waypoints
const TIER_OF = (p) => p?.tier || 'exact';
/** How far out of focus (art pixels) a candidate is at a confidence, and how bright the one in front and the ones behind: from
 *  1 px at 0.35 to 0.35 px at 0.85 (soft enough never to be crisp, sharp enough to be read: the tier above is the exact icon). */
const focus = (c) => { const k = Math.max(0, Math.min(1, (c - 0.35) / 0.5)); return { r: 0.35 + 0.65 * (1 - k), front: 0.62 + 0.33 * k, behind: 0.14 + 0.1 * k }; };
const OFFSETS = { 2: [[-4, -1], [4, 1]], 3: [[0, -4], [-4, 3], [4, 3]] };

function blit(g, src, x, y, s, alpha = 1) { if (alpha <= 0.003) return; g.globalAlpha = alpha; g.drawImage(scaled(src, s), Math.round(x - src.width / 2) * s, Math.round(y - src.height / 2) * s); g.globalAlpha = 1; }
function blitSoft(g, src, x, y, s, r, alpha = 1) {
  if (alpha <= 0.003) return;
  const b = blurred(src, s, r * s); g.globalAlpha = alpha;
  g.drawImage(b.canvas, Math.round(x - src.width / 2) * s - b.pad, Math.round(y - src.height / 2) * s - b.pad); g.globalAlpha = 1;
}

function drawWaypoint(g, w, p, at, s, t, look, classOf) {
  const tier = TIER_OF(p), c = tier === 'exact' ? 1 : p.confidence ?? 0, feel = tier === 'star' ? null : (p ? p.feel : w.feel) ?? null;
  if (feel) drawNimbus(g, feel, at.x, at.y, s, t, w.id, look); // (the feeling round the icon, from the silhouette tier up; never in it)
  if (tier === 'exact') {
    const icon = waypointIcon(w.type, look); blit(g, icon, at.x, at.y, s);
    const n = Math.max(1, Math.min(5, (w.strength ?? 0) + 1)), pip = markIcon('pip', look), y = at.y + Math.ceil(icon.height / 2) + 2;
    for (let i = 0; i < n; i++) blit(g, pip, at.x - (n - 1) * 1.5 + i * 3, y, s);
  } else if (tier === 'two' || tier === 'three') {
    const cands = p.candidates?.length ? p.candidates : [w.type], cls = cands.map(classOf), shared = cls.every((k) => k === cls[0]);
    const { r, front, behind } = focus(c), off = OFFSETS[cands.length] || [[0, 0]], period = 2.4 * cands.length;
    if (shared) blit(g, silhouetteIcon(cls[0], look), at.x, at.y, s); // (the class is known: its silhouette is crisp)
    const e = cands.map((_, i) => Math.exp(3 * Math.cos(((t / period) - i / cands.length) * Math.PI * 2))), sum = e.reduce((x, y) => x + y, 0);
    cands.forEach((type, i) => {
      const lead = Math.pow(e[i] / sum, 0.7), alpha = behind + (front - behind) * lead; // (one in front at a time, handing over slowly: never a flicker, never all faint at once)
      const icon = shared ? emblemIcon(type, look) : waypointIcon(type, look), [ox, oy] = off[i] || [0, 0];
      blitSoft(g, icon, at.x + ox, at.y + oy + (shared && icon.height % 2 === 0 ? 1 : 0), s, r, alpha);
    });
  } else if (tier === 'class') {
    const k = Math.max(0, Math.min(1, (c - 0.15) / 0.2));
    blit(g, silhouetteIcon(p.cls || classOf(w.type), look), at.x, at.y, s, 0.55 + 0.45 * k);
    blitSoft(g, markIcon('star', look), at.x, at.y, s, 1.6, 0.35 + 0.25 * k); // (something inside, out of focus)
  } else {
    const k = Math.max(0, Math.min(1, c / 0.15)), breathe = 0.85 + 0.15 * Math.sin(t * 1.3 + at.x * 0.13);
    blitSoft(g, markIcon('star', look), at.x, at.y, s, 0.7, (0.4 + 0.45 * k) * breathe);
  }
}

/** Draw the sea chart into a canvas, sized to it at the whole-number `scale`. `t` (real seconds) moves the motes, the nimbuses, the bent
 *  lanes and the candidates; `since` ({ 'a>b': seconds since that lane was drafted }) brightens a lane drafted just now. */
export function drawSeaChart(canvas, chart, o = {}) {
  const s = Math.max(1, Math.round(o.scale || 1)), look = o.look === 'ink' ? 'ink' : 'crude', t = o.t || 0, { w: W1, h: H1 } = CHART_SIZE;
  if (canvas.width !== W1 * s || canvas.height !== H1 * s) { canvas.width = W1 * s; canvas.height = H1 * s; }
  const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, canvas.width, canvas.height);
  if (!chart) return canvas;
  g.drawImage(scaled(groundOf(look, `${chart.route}:${chart.day}`), s), 0, 0);
  const at = layout(chart), P = o.portents || {}, classOf = o.classOf || classOfType, WP = chart.waypoints, C = chart.columns, L = LINE[look];
  const confOf = (id) => (id === 'from' || id === 'to' ? 1 : !P[id] || P[id].tier === 'exact' ? 1 : P[id].confidence ?? 1);
  const pathOf = (ids) => { const d = (ids || []).filter((id) => WP[id]), last = d[d.length - 1]; return ['from', ...d, ...(last && WP[last].col === C - 1 ? ['to'] : [])]; };
  const path = pathOf(o.drafted), head = path.length > 1 && path[path.length - 1] !== 'to' ? path[path.length - 1] : null, done = path[path.length - 1] === 'to';
  const key = (a, b) => `${a}>${b}`, draftedSet = new Set(path.slice(1).map((b, i) => key(path[i], b)));
  const ways = done ? [] : head == null ? chart.first : chart.edges.filter(([a]) => a === head).map(([, b]) => b);
  const openSet = new Set(ways.map((b) => key(head ?? 'from', b)));
  const lanes = [...chart.first.map((b) => ['from', b]), ...chart.edges, ...chart.last.map((a) => [a, 'to'])];
  const since = o.since || {}, starGap = {};
  for (const [id, p] of Object.entries(P)) if (p?.tier === 'star') starGap[id] = GAP.star;
  const gap = (id) => starGap[id] ?? gapOf(chart, id), bent = (a, b) => !!(WP[a]?.storm || WP[b]?.storm);
  const lp = (a, b, opt = {}) => lanePath(at[a], at[b], gap(a), gap(b), { bend: bent(a, b), t, ...opt });
  g.lineCap = 'round'; g.lineJoin = 'round';
  // the lanes, faint into the fog
  for (const [a, b] of lanes) {
    const k = key(a, b); if (draftedSet.has(k) || openSet.has(k)) continue;
    const fog = Math.min(confOf(a), confOf(b)), pts = lp(a, b);
    if (look === 'ink') stroke(g, s, pts, L.lane, 1, 0.22 + 0.3 * fog, [2, 2]);
    else { stroke(g, s, pts, L.lane, 3, 0.03 + 0.04 * fog); stroke(g, s, pts, L.lane, 1, 0.12 + 0.3 * fog); }
  }
  // the day's best, a pale line beside its lanes (the rival's: the Glass races it); the current that carried a ship adrift, dashed
  const ghost = o.ghost?.length ? pathOf(o.ghost) : null;
  if (ghost && look !== 'ink') for (let i = 1; i < ghost.length; i++) { const pts = lp(ghost[i - 1], ghost[i], { off: 2 }); stroke(g, s, pts, L.ghost, 3, 0.06); stroke(g, s, pts, L.ghost, 1, 0.32); }
  for (const [a, b] of o.drift || []) if (at[a] && at[b]) stroke(g, s, lp(a, b, { off: -2 }), L.drift, 1, 0.75, [2, 3], -t * 5);
  // the ways on from the passage's head, then the passage over everything
  const breathe = 0.5 + 0.5 * Math.sin(t * 3.9);
  for (const k of openSet) {
    const [a, b] = k.split('>'), pts = lp(a, b), fog = confOf(b);
    if (look === 'ink') stroke(g, s, pts, L.open, 1, 0.5, [2, 2]);
    else { stroke(g, s, pts, L.open, 3, (0.06 + 0.05 * breathe) * (0.5 + 0.5 * fog)); stroke(g, s, pts, L.open, 1, (0.42 + 0.22 * breathe) * (0.6 + 0.4 * fog)); }
  }
  const brighten = (k) => { const x = since[k]; return x == null ? 1 : Math.max(0, Math.min(1, x / 0.45)); };
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i], e = brighten(key(a, b)), ease = 1 - (1 - e) ** 3, pts = lp(a, b, { k1: ease });
    if (look === 'ink') { stroke(g, s, pts, [58, 40, 26], 3, 0.7); stroke(g, s, pts, L.drafted, 2, 1); continue; }
    if (ease < 1) stroke(g, s, lp(a, b), L.lane, 1, 0.3 * (1 - ease)); // (what is not lit yet of a lane being drafted)
    stroke(g, s, pts, L.glow, 5, 0.07); stroke(g, s, pts, L.glow, 3, 0.2); stroke(g, s, pts, L.drafted, 1, 0.95);
  }
  if (look !== 'ink' && path.length > 1) { // (the mote: a bead of light running the passage from the pier to its head, again and again)
    const n = path.length - 1, per = 0.55, cycle = n * per + 1.2, u = (t % cycle) / per, i = Math.floor(u);
    if (i < n) {
      const [px1, py1] = at01(lp(path[i], path[i + 1]), u - i), x = px1 * s, y = py1 * s, gr = g.createRadialGradient(x, y, 0, x, y, 3 * s);
      gr.addColorStop(0, 'rgba(255,250,232,.95)'); gr.addColorStop(0.35, 'rgba(255,224,150,.45)'); gr.addColorStop(1, 'rgba(242,204,90,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, 3 * s, 0, Math.PI * 2); g.fill();
    }
  }
  g.setLineDash([]); g.lineDashOffset = 0;
  // the draught's trump: the lane takes the trumping feeling's colour and beads of it run toward the trumped waypoint, where both
  // feelings are shown (Calissa's ruling; trip.js draughtTrump says which)
  if (o.trumpOf && look !== 'ink') for (const [a, b] of chart.edges) {
    const pa = P[a], pb = P[b]; if ((pa && pa.feel === undefined) || (pb && pb.feel === undefined)) continue;
    const kind = o.trumpOf(a, b); if (kind !== 'trumps' && kind !== 'trumped') continue;
    const [from, to] = kind === 'trumps' ? [a, b] : [b, a], feel = WP[from].feel, col = feelColor(feel); if (!col) continue;
    const pts = lanePath(at[from], at[to], gap(from), gap(to), { bend: bent(a, b), t });
    stroke(g, s, pts, col, 1, 0.5);
    for (let i = 0; i < 3; i++) { const [x, y] = at01(pts, (t * 0.45 + i / 3) % 1); drawBead(g, feel, x, y, s); }
  }
  // the islands, and the waypoints by their portents
  for (const id of ['from', 'to']) {
    const isl = islandIcon(id === 'from' ? chart.from : chart.to, look), A = at[id];
    if (look !== 'ink') { const gr = g.createRadialGradient(A.x * s, A.y * s, 0, A.x * s, A.y * s, 18 * s); gr.addColorStop(0, 'rgba(242,204,90,.14)'); gr.addColorStop(1, 'rgba(242,204,90,0)'); g.fillStyle = gr; g.fillRect((A.x - 18) * s, (A.y - 18) * s, 36 * s, 36 * s); }
    blit(g, isl, A.x, A.y, s);
  }
  for (const w of Object.values(WP)) drawWaypoint(g, w, P[w.id], at[w.id], s, t, look, classOf);
  // the storm mark: always shown, whatever the tier; black, its core labradorite, swaying (its two leans handed over slowly)
  for (const w of Object.values(WP)) if (w.storm) {
    const A = at[w.id], x = A.x + 8, y = A.y - 13, lean = 0.5 + 0.5 * Math.sin(t * 1.2 + A.x);
    if (look !== 'ink') { const gr = g.createRadialGradient(x * s, y * s, 0, x * s, y * s, 8 * s); gr.addColorStop(0, 'rgba(154,138,230,.3)'); gr.addColorStop(1, 'rgba(106,122,208,0)'); g.fillStyle = gr; g.fillRect((x - 8) * s, (y - 8) * s, 16 * s, 16 * s); }
    blit(g, markIcon('flame', look), x, y, s, look === 'ink' ? 1 : 1 - lean * 0.85); if (look !== 'ink') blit(g, markIcon('flameB', look), x, y, s, lean * 0.85 + 0.15);
  }
  // the hover, and the sloop where you are
  if (o.hover && at[o.hover]) blit(g, ringIcon(o.hover === 'from' || o.hover === 'to' ? 17 : 15, look === 'ink' ? 'ink' : 'gold'), at[o.hover].x, at[o.hover].y, s);
  if (o.ship !== false && look !== 'ink') {
    const id = o.at && at[o.at] ? o.at : 'from', A = at[id], ship = markIcon('ship', look), hh = id === 'from' ? 12 : 15;
    blit(g, ship, A.x, A.y - hh - (Math.sin(t * 2.4) > 0 ? 1 : 0), s);
  }
  return canvas;
}

/** The sea chart as an element of the pier's page: its canvas at the whole-number scale the window allows, moving while it is shown,
 *  picking what is under the pointer. */
export class SeaChart {
  constructor({ maxWidth = 672, scale = null, look = 'crude', onPick = null, onHover = null } = {}) {
    this.maxWidth = maxWidth; this.fixed = scale; this.look = look; this.onPick = onPick; this.onHover = onHover;
    this.canvas = document.createElement('canvas'); this.canvas.className = 'px seachart';
    this.canvas.style.imageRendering = 'pixelated';
    this.chart = null; this.o = {}; this.lit = new Map(); this.hover = null; this.raf = 0;
    this.canvas.addEventListener('pointermove', (e) => { const id = this.pick(e.clientX, e.clientY); if (id !== this.hover) { this.hover = id; this.onHover?.(id); } });
    this.canvas.addEventListener('pointerleave', () => { if (this.hover) { this.hover = null; this.onHover?.(null); } });
    this.canvas.addEventListener('click', (e) => { const id = this.pick(e.clientX, e.clientY); if (id) this.onPick?.(id); });
  }

  /** The whole number the art is drawn at: the pixel kit's, as large as the window's width allows. */
  scale() {
    if (this.fixed) return this.fixed;
    const dpr = window.devicePixelRatio || 1;
    return Math.max(1, Math.min(px.scale(), Math.floor((this.maxWidth * dpr) / CHART_SIZE.w)));
  }

  /** A new sea chart or a new state of it (the passage drafted further, the ship moved on, the portents read again). */
  set(chart, o = {}) {
    const now = performance.now() / 1000;
    if (chart !== this.chart) this.lit.clear();
    const d = (o.drafted || []).filter((id) => chart?.waypoints[id]), head = d[d.length - 1], done = head && chart.waypoints[head].col === chart.columns - 1;
    const path = ['from', ...d, ...(done ? ['to'] : [])], keys = new Set(path.slice(1).map((b, i) => `${path[i]}>${b}`));
    for (const k of keys) if (!this.lit.has(k)) this.lit.set(k, now);
    for (const k of [...this.lit.keys()]) if (!keys.has(k)) this.lit.delete(k);
    this.chart = chart; this.o = o;
    this.draw();
    if (!this.raf) this.loop();
    return this;
  }

  /** What is under a point of the screen: a waypoint's id, 'from' or 'to' (the islands), or null. */
  pick(clientX, clientY) {
    if (!this.chart) return null;
    const r = this.canvas.getBoundingClientRect(); if (!r.width) return null;
    const x = ((clientX - r.left) / r.width) * CHART_SIZE.w, y = ((clientY - r.top) / r.height) * CHART_SIZE.h, at = layout(this.chart);
    let best = null, bd = 1e9;
    for (const [id, p] of Object.entries(at)) { const d = Math.hypot(p.x - x, p.y - y), lim = id === 'from' || id === 'to' ? 17 : 14; if (d < lim && d < bd) { bd = d; best = id; } }
    return best;
  }

  draw(t = performance.now() / 1000) {
    const s = this.scale(), since = {};
    for (const [k, t0] of this.lit) since[k] = t - t0;
    drawSeaChart(this.canvas, this.chart, { ...this.o, hover: this.o.hover !== undefined ? this.o.hover : this.hover, look: this.look, scale: s, t, since });
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${this.canvas.width / dpr}px`; this.canvas.style.height = `${this.canvas.height / dpr}px`;
  }

  loop() {
    this.raf = requestAnimationFrame((ms) => {
      this.raf = 0;
      if (!this.chart || !this.canvas.isConnected) return; // (stops when the page closes; set() starts it again)
      if (ms - (this.last || 0) >= 33) { this.last = ms; this.draw(ms / 1000); } // (thirty a second: everything on it moves slowly)
      this.loop();
    });
  }

  dispose() { cancelAnimationFrame(this.raf); this.raf = 0; this.chart = null; this.canvas.remove(); }
}

