// ---------------------------------------------------------------------------------------
// THE RUTTER'S MODEL (docs/plans/PASSAGE.md, section 6): the map a passage sailed to its end gives, as a sailor's book. A small bound
// book (11 by 15 cm, a little over 2 cm thick), its boards in a black-green morocco, raised bands on the spine, a brass clasp,
// the page edges cream; its front board tooled in gilt with its own passage (the island left at the foot, the island made at the head,
// the waypoints sailed as gilt studs along a line, the storm a star) inside a blind double fillet and a gilt one, a fleuron at each
// corner. Open, its spread is that game day's sea chart drawn in ink across both pages (ui/seachart/seachart.js, `look: 'ink'`: the
// passage gilt, the feelings washed in, the portolan's rhumb lines), ruled round in red, and the crossing's rank stamped in vermilion
// at the foot of the right page.
//
// Prior art: the rutter itself (the routier, the pilot's book of courses, 15th to 17th century) and the portolan chart it went with
// (rhumb lines from wind roses, hand-coloured); gold tooling on a 17th-century calf binding (fillets, corner fleurons, a centre panel);
// the red chop of an East Asian seal for the crossing's rank (the rank's chop: a mark of the hand that made the thing).
//
//   const R = new Rutter({ rutter, chart, portents })   scene.add(R.group)   R.open(k 0..1)   R.dispose()
//   rutterThing(rutter?) -> { group, dispose }   (the Pneuka Box's model of the item `rutter`: pneuka/thingmodels.js buildThing, Petra's)
//   rutterCover(rutter) -> { color, orm } canvases   rutterSpread(rutter, { chart, portents }) -> canvas (1024 x 704)
//   rutter: { from, to, day, passage: [waypoint ids 'col:row'], legs: [their types], rank: 'S' .. 'D', read, storms? }; chart: the
//   sea chart of that route and game day (Dovina's seaChart), else one is pieced together from the passage alone.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { drawSeaChart, CHART_SIZE } from '../ui/seachart/seachart.js';
import { islandIcon, markIcon, scaled } from '../ui/seachart/icons.js';

const W = 0.11, H = 0.15, TB = 0.0028, TH = 0.008, Y0 = TB + TH; // (the boards' and each half of the text block's thickness; the hinge)
const SAMPLE = { from: 'anagami', to: 'margarite', day: 0, passage: ['0:1', '1:2', '2:1'], legs: ['shoal', 'calm', 'wreckers'], rank: 'A', read: 0.6 };

function seeded(s) { let a = 0; for (let i = 0; i < s.length; i++) a = (Math.imul(a ^ s.charCodeAt(i), 2654435761) + 1) | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const sheet = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/** A sea chart pieced together from a rutter alone (its passage's ids carry their columns and rows): the waypoints sailed, and the
 *  lanes between them. */
export function chartOfRutter(r) {
  const waypoints = {}, edges = [];
  (r.passage || []).forEach((id, i) => { const [col, row] = id.split(':').map(Number); waypoints[id] = { id, col, row, type: r.legs?.[i] || 'shoal', strength: 1, feel: r.feels?.[i] ?? null, storm: !!r.stormsAt?.includes(id) }; if (i) edges.push([r.passage[i - 1], id]); });
  const ids = Object.keys(waypoints), cols = Math.max(1, ...ids.map((id) => waypoints[id].col + 1)), rows = Math.max(4, ...ids.map((id) => waypoints[id].row + 1));
  return { route: [r.from, r.to].sort().join('-'), from: r.from, to: r.to, day: r.day || 0, columns: cols, rows, waypoints, edges, first: ids.slice(0, 1), last: ids.slice(-1) };
}

// ---- the cover: black morocco, the tooling
const GILT = '#d4a440', GILT_HI = '#ffe08a', GILT_LO = '#6a4a14';
function grain(g, w, h, rnd) {
  g.fillStyle = '#1a2725'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { const t = rnd(); g.fillStyle = t < 0.5 ? 'rgba(40,58,60,.35)' : t < 0.8 ? 'rgba(6,8,10,.5)' : 'rgba(70,86,84,.22)'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd()); }
  const wear = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.55);
  wear.addColorStop(0, 'rgba(0,0,0,0)'); wear.addColorStop(1, 'rgba(96,104,96,.28)'); // (the corners and edges rubbed paler with handling)
  g.fillStyle = wear; g.fillRect(0, 0, w, h);
}
/** A tooled line: pressed into the leather (a dark lip below and to the right) and gilt on top. */
function tool(g, draw, width, gilt = true) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.translate(1.2, 1.4); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = width + 1; draw(); g.stroke();
  g.translate(-1.2, -1.4); g.strokeStyle = gilt ? GILT : 'rgba(4,6,8,.85)'; g.lineWidth = width; draw(); g.stroke();
  if (gilt) { g.translate(-0.6, -0.6); g.strokeStyle = 'rgba(255,224,138,.55)'; g.lineWidth = Math.max(1, width * 0.35); draw(); g.stroke(); }
  g.restore();
}
function fleuron(g, x, y, r) { // (four petals and a stud)
  for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2 + Math.PI / 4; tool(g, () => { g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, r * 0.22, a, 0, Math.PI * 2); }, 2); }
  g.fillStyle = GILT_HI; g.beginPath(); g.arc(x, y, r * 0.18, 0, Math.PI * 2); g.fill();
}

/** The front board's two faces: its colour, and its occlusion-roughness-metalness (gilt metal and smooth, leather neither). */
export function rutterCover(r = SAMPLE) {
  const w = 512, h = 704, color = sheet(w, h), orm = sheet(w, h), g = color.getContext('2d'), o = orm.getContext('2d'), rnd = seeded(`cover:${r.from}:${r.to}:${r.day}`);
  grain(g, w, h, rnd);
  // the fillets: blind double, then gilt; a fleuron at each corner of the panel
  for (const [inset, gilt, wd] of [[18, false, 3], [26, false, 2], [36, true, 3]]) tool(g, () => { g.beginPath(); g.rect(inset, inset, w - inset * 2, h - inset * 2); }, wd, gilt);
  for (const [x, y] of [[36, 36], [w - 36, 36], [36, h - 36], [w - 36, h - 36]]) fleuron(g, x, y, 15);
  // a wind rose struck blind in the middle of the panel, under the route (the sea chart's own rose: the book and the chart are kin)
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, L = i % 4 === 0 ? 150 : i % 2 ? 70 : 105; tool(g, () => { g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * 14, h / 2 + Math.sin(a) * 14); g.lineTo(w / 2 + Math.cos(a) * L, h / 2 + Math.sin(a) * L); }, i % 4 === 0 ? 3 : 2, false); }
  tool(g, () => { g.beginPath(); g.arc(w / 2, h / 2, 40, 0, Math.PI * 2); }, 2, false);
  // the route: from the foot (the island left) to the head (the island made), the waypoints sailed as studs along a winding line
  const chart = chartOfRutter(r), C = chart.columns, pts = (r.passage || []).map((id) => { const [col, row] = id.split(':').map(Number); return { x: w / 2 + (row - (chart.rows - 1) / 2) * 52, y: h - 150 - ((col + 0.5) / C) * (h - 300), storm: chart.waypoints[id]?.storm }; });
  const from = { x: w / 2 - 70, y: h - 92 }, to = { x: w / 2 + 70, y: 92 }, line = [from, ...pts, to];
  tool(g, () => { g.beginPath(); g.moveTo(line[0].x, line[0].y); for (let i = 1; i < line.length; i++) { const a = line[i - 1], b = line[i], my = (a.y + b.y) / 2; g.bezierCurveTo(a.x, my, b.x, my, b.x, b.y); } }, 4);
  for (const p of pts) {
    tool(g, () => { g.beginPath(); g.arc(p.x, p.y, 9, 0, Math.PI * 2); }, 3);
    g.fillStyle = GILT; g.beginPath(); g.arc(p.x, p.y, 4, 0, Math.PI * 2); g.fill();
    if (p.storm) for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; tool(g, () => { g.beginPath(); g.moveTo(p.x + Math.cos(a) * 12, p.y + Math.sin(a) * 12); g.lineTo(p.x + Math.cos(a) * 17, p.y + Math.sin(a) * 17); }, 2); }
  }
  // the islands, struck with the sea chart's own icons as gilt stamps (the pixel art at 3x: a binder's tool is a little picture too)
  for (const [isl, at] of [[r.from, from], [r.to, to]]) {
    const ic = scaled(islandIcon(isl, 'crude'), 3), gc = sheet(ic.width, ic.height), q = gc.getContext('2d');
    q.drawImage(ic, 0, 0); q.globalCompositeOperation = 'source-in'; const gr = q.createLinearGradient(0, 0, 0, ic.height); gr.addColorStop(0, GILT_HI); gr.addColorStop(0.5, GILT); gr.addColorStop(1, GILT_LO); q.fillStyle = gr; q.fillRect(0, 0, ic.width, ic.height);
    g.globalAlpha = 0.6; g.filter = 'none'; g.drawImage(gc, at.x - ic.width / 2 + 2, at.y - ic.height / 2 + 2); g.globalAlpha = 1; // (its pressed shadow)
    g.drawImage(gc, at.x - ic.width / 2, at.y - ic.height / 2);
  }
  // the ORM: occlusion 1, roughness from the gilt (smooth) against the leather (rough), metalness only in the gilt
  const d = g.getImageData(0, 0, w, h).data, od = o.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const R = d[i * 4], G = d[i * 4 + 1], B = d[i * 4 + 2], gilt = R > 110 && R > B * 1.5 ? Math.min(1, (R - 110) / 60) : 0;
    od.data[i * 4] = 255; od.data[i * 4 + 1] = Math.round(255 * (0.78 - 0.45 * gilt)); od.data[i * 4 + 2] = Math.round(255 * gilt); od.data[i * 4 + 3] = 255;
  }
  o.putImageData(od, 0, 0);
  return { color, orm };
}

// ---- the spread: vellum, the sea chart in ink, the red rules, the rank's chop
const CHOP = '#c23a22';
/** The two pages open (1024 x 704: the left page is the left half). */
export function rutterSpread(r = SAMPLE, { chart = null, portents = null } = {}) {
  const w = 1024, h = 704, c = sheet(w, h), g = c.getContext('2d'), rnd = seeded(`page:${r.from}:${r.to}:${r.day}`);
  g.fillStyle = '#eadcbf'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 7000; i++) { const t = rnd(); g.fillStyle = t < 0.5 ? 'rgba(196,170,126,.18)' : t < 0.8 ? 'rgba(250,240,220,.3)' : 'rgba(160,128,86,.12)'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1); } // (the fibres)
  for (let i = 0; i < 26; i++) { const x = rnd() * w, y = rnd() * h, rr = 2 + rnd() * 7, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(150,104,52,.22)'); gr.addColorStop(1, 'rgba(150,104,52,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); } // (the foxing)
  // the edges darkened with handling, and the gutter's shadow down the middle
  const edge = g.createRadialGradient(w / 2, h / 2, h * 0.42, w / 2, h / 2, w * 0.62); edge.addColorStop(0, 'rgba(120,88,52,0)'); edge.addColorStop(1, 'rgba(120,88,52,.3)'); g.fillStyle = edge; g.fillRect(0, 0, w, h);
  const gut = g.createLinearGradient(w / 2 - 60, 0, w / 2 + 60, 0); gut.addColorStop(0, 'rgba(70,46,24,0)'); gut.addColorStop(0.5, 'rgba(70,46,24,.42)'); gut.addColorStop(1, 'rgba(70,46,24,0)'); g.fillStyle = gut; g.fillRect(w / 2 - 60, 0, 120, h);
  // the red rules round each page (the rubricator's frame)
  g.strokeStyle = 'rgba(176,52,34,.55)'; g.lineWidth = 2;
  for (const x0 of [40, w / 2 + 28]) { g.strokeRect(x0, 40, w / 2 - 68, h - 80); g.lineWidth = 1; g.strokeRect(x0 + 6, 46, w / 2 - 80, h - 92); g.lineWidth = 2; }
  // the sea chart of that game day, in ink, across both pages: what was sailed exact, the rest as last seen
  const sea = chart || chartOfRutter(r), P = { ...(portents || {}) };
  for (const id of r.passage || []) P[id] = { tier: 'exact', confidence: 1, feel: sea.waypoints[id]?.feel ?? null, storm: !!sea.waypoints[id]?.storm };
  if (!portents && chart) for (const id of Object.keys(sea.waypoints)) if (!P[id]) P[id] = { tier: 'star', confidence: 0.1, candidates: [], cls: null };
  const ink = drawSeaChart(sheet(1, 1), sea, { look: 'ink', scale: 2, portents: P, drafted: r.passage || [], ship: false });
  g.drawImage(ink, Math.round((w - CHART_SIZE.w * 2) / 2), Math.round((h - CHART_SIZE.h * 2) / 2) - 8);
  // the rank, stamped at the foot of the right page: a vermilion chop, the letter inside, the impression broken where the ink was thin
  const rank = 'SABCD'.includes(r.rank) ? r.rank : 'C', sx = w - 132, sy = h - 128, chop = sheet(120, 120), q = chop.getContext('2d');
  q.translate(60, 60); q.rotate(-0.17); q.fillStyle = CHOP; q.strokeStyle = CHOP;
  q.lineWidth = 7; q.beginPath(); q.arc(0, 0, 46, 0, Math.PI * 2); q.stroke(); q.lineWidth = 2; q.beginPath(); q.arc(0, 0, 37, 0, Math.PI * 2); q.stroke();
  const L = scaled(markIcon(rank, 'crude', 'grey'), 6), lc = sheet(L.width, L.height), lq = lc.getContext('2d');
  lq.drawImage(L, 0, 0); lq.globalCompositeOperation = 'source-in'; lq.fillStyle = CHOP; lq.fillRect(0, 0, L.width, L.height);
  q.drawImage(lc, -L.width / 2, -L.height / 2);
  q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 420; i++) { q.fillStyle = `rgba(0,0,0,${(0.3 + rnd() * 0.7).toFixed(2)})`; q.fillRect(rnd() * 120, rnd() * 120, 1 + rnd() * 2.5, 1 + rnd() * 2); }
  g.globalAlpha = 0.88; g.drawImage(chop, sx - 60, sy - 60); g.globalAlpha = 1;
  return c;
}

// ---- the book
function tex(canvas, srgb = true) {
  const t = new THREE.CanvasTexture(canvas); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; return t;
}
let EDGES = null;
function edgeCanvas() { // (the page edges: fine lines of the leaves)
  if (EDGES) return EDGES;
  const c = sheet(64, 256), g = c.getContext('2d'); g.fillStyle = '#e4d4b0'; g.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y += 2) { g.fillStyle = y % 6 ? 'rgba(150,120,80,.18)' : 'rgba(120,90,56,.28)'; g.fillRect(0, y, 64, 1); }
  return (EDGES = c);
}

export class Rutter {
  constructor({ rutter = SAMPLE, chart = null, portents = null } = {}) {
    this.rutter = rutter; this.group = new THREE.Group(); this.group.name = 'rutter';
    const cover = rutterCover(rutter), spread = rutterSpread(rutter, { chart, portents });
    const T = (this.tex = { color: tex(cover.color), orm: tex(cover.orm, false), spread: tex(spread), edges: tex(edgeCanvas()) });
    T.edges.wrapS = T.edges.wrapT = THREE.RepeatWrapping;
    const M = (this.mats = {
      leather: new THREE.MeshStandardMaterial({ color: 0x1f302d, roughness: 0.78, metalness: 0 }),
      cover: new THREE.MeshStandardMaterial({ map: T.color, roughnessMap: T.orm, metalnessMap: T.orm, roughness: 1, metalness: 1 }),
      edges: new THREE.MeshStandardMaterial({ map: T.edges, roughness: 0.9 }),
      page: new THREE.MeshStandardMaterial({ map: T.spread, roughness: 0.92 }),
      brass: new THREE.MeshStandardMaterial({ color: 0xd9b048, metalness: 0.75, roughness: 0.32 }),
    });
    const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    const page = (u0, u1) => { const geo = new THREE.PlaneGeometry(W - 0.006, H - 0.006); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * (u1 - u0)); return new THREE.Mesh(geo, M.page); };
    const blockMats = [M.edges, M.leather, M.page, M.page, M.edges, M.edges]; // (+x the fore-edge, -x the spine side, the faces, the head and the foot)
    // the back half: its board, half the text block, the right page on it
    const back = new THREE.Group(); this.group.add(back);
    const bb = box(W, TB, H, M.leather); bb.position.set(0, TB / 2, 0); back.add(bb);
    const bk = box(W - 0.006, TH, H - 0.006, blockMats); bk.position.set(-0.003, TB + TH / 2, 0); back.add(bk); // (the boards stand proud of the leaves at the head, the foot and the fore-edge: the squares)
    const right = page(0.5, 1); right.rotation.x = -Math.PI / 2; right.position.set(-0.003, Y0 + 0.0003, 0); back.add(right);
    // the front half, hinged at the spine: its board (the tooled cover on top), half the block, the left page underneath
    const hinge = (this.hinge = new THREE.Group()); hinge.position.set(-W / 2, Y0, 0); this.group.add(hinge);
    const front = new THREE.Group(); front.position.set(W / 2, 0, 0); hinge.add(front);
    const fk = box(W - 0.006, TH, H - 0.006, blockMats); fk.position.set(-0.003, TH / 2, 0); front.add(fk);
    const left = page(0, 0.5); left.rotation.x = Math.PI / 2; left.rotation.z = Math.PI; left.position.set(-0.003, -0.0003, 0); front.add(left); // (faces down while closed; up once turned over)
    const fb = box(W, TB, H, [M.leather, M.leather, M.cover, M.leather, M.leather, M.leather]); fb.position.set(0, TH + TB / 2, 0); front.add(fb);
    // the clasp: a brass catch on the front board's fore-edge and its strap down to the back board
    const catchP = box(0.012, 0.0012, 0.022, M.brass); catchP.position.set(W / 2 - 0.006, TH + TB + 0.0006, 0); front.add(catchP);
    const strap = box(0.0014, 2 * (TH + TB), 0.016, M.brass); strap.position.set(W / 2 + 0.0007, 0, 0); front.add(strap); // (from the front board's top to the back board's foot: the hinge is halfway)
    // the spine: a half round of leather about the hinge, with four raised bands; it turns half as far as the cover, under the gutter
    const spine = (this.spine = new THREE.Group()); spine.position.set(-W / 2, Y0, 0); this.group.add(spine);
    const R = Y0 + 0.0004, sp = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 14, 1, true, Math.PI, Math.PI), M.leather); sp.rotation.x = Math.PI / 2; spine.add(sp);
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.TorusGeometry(R, 0.0011, 4, 10, Math.PI), M.leather); b.rotation.set(0, 0, Math.PI / 2); b.position.z = -H / 2 + (H * (i + 1)) / 5; spine.add(b); }
    sp.material.side = THREE.DoubleSide;
    this.open(0);
  }

  /** Open it: 0 shut, 1 lying open at its spread. */
  open(k = 0) {
    const a = Math.max(0, Math.min(1, k)) * Math.PI * 0.985;
    this.hinge.rotation.z = a; this.spine.rotation.z = a / 2; this.k = k;
  }

  dispose() {
    this.group.traverse((o) => o.geometry?.dispose());
    for (const m of Object.values(this.mats)) m.dispose();
    for (const t of Object.values(this.tex)) t.dispose();
  }
}

/** The Pneuka Box's model of a rutter: the book shut, turned to show its tooled board (a three-quarter view, as the other things). */
export function rutterThing(rutter = SAMPLE) {
  const R = new Rutter({ rutter });
  R.group.rotation.set(0.55, 0.5, -0.12);
  return { group: R.group, dispose: () => R.dispose() };
}

