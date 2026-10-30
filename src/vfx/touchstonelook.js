// ---------------------------------------------------------------------------------------
// THE TOUCHSTONE'S LOOK (plain name; Petra's room, world/touchstone/; docs/plans/APTITUDE.md 10.3: "dark stone where what you do leaves a
// streak", Calissa's to dress): the Assay's room dressed as a dark assay hall over Petra's placeholders, a look only. Her rules, her
// colliders, her lamps, her labels and her timing are untouched; her placeholder meshes are hidden where this one stands in for them.
//   - THE STONE: a slab of black lydite (the goldsmith's touchstone), set in a glazed clay socle, its shoulders arched a little, its
//     arrises polished and bevelled. The middle of its face is THE HONED FACE (a matte finish, as a real touchstone's working face is, so
//     it takes a streak), where her stimuli are shown: her stone's own colour, ringed by a soft incised line of pale stone.
//   - THE STREAKS: under the honed face, one column a trial (in the plinths' order), the last three runs the Assay recorded of each rubbed
//     in gold (the ledger's `aptitude.trial.<id>.n`), the newest the brightest, the oldest dulled and broken as if the acid had been
//     at it (the assayer's touch needles, rubbed side by side to compare). A run recorded rubs its streak in left to right
//     (`aptitude.trial`); faint old streaks of other golds on the stone's flanks.
//   - THE PLINTHS: five glazed clay pedestals, a terracotta body dipped in a black iron glaze that breaks to rust on its rims, the dip
//     line wandering a little; on each cap its trial's sign in gold (a light and a ring; two shards; three tiles, one off; a bell and
//     its beat; a windup's flash), on its face its number in neuralese (the numerals worn, vfx/wornnumerals.js). Lit when you stand at
//     it (the interact chevron on it, the same predicate as F): its gold brighter and a warm pool of light on the floor round it.
//   - THE HALL: honed basalt flags with soft joints, a brass meridian from the door to the stone and a brass line round the field; a
//     dado of glazed tiles under a brass rail, dark plaster, pilasters, a cornice and a beamed ceiling; a lighter niche behind the stone;
//     the door as two studded leaves in an architrave. Her two lamps wear hooded brass troughs hung from the ceiling, the stone's opening
//     toward the stone, so no bright source stands in the view while you are measured.
// THE STIMULI ARE NEVER DRESSED (APTITUDE.md 10.3: the fixed conditions). Her disc, rings, tiles and shards are drawn on her stone's face
// as she builds them; this dresses around them: the honed face wears her stone's own colour (read from her material) at a matte finish,
// nothing of this look lies within 0.25 m of a stimulus, and the colour trial's tiles keep her flat material (trialrun.js). While a
// trial runs nothing here moves: the glows settle within the trial's first breath (1.2 real s before the first stimulus), the pool
// goes out, the other plinths go quiet, and the stone shows the running trial's sign, steady, on its top border.
// PROGRAMS, meant to add none: the hall's four bodies and the streaks are the kit's vertex-coloured standard (vfx/racewaypark.js's,
// vfx/bazaarhall.js's parameters, smoothed by the present as built); the signs, numerals and the pool the numerals' decal (vfx/
// wornnumerals.js's parameters); the outline hulls the props'. Measured headless on the Minimum tier (scripts/touchstone-shot.mjs,
// 2026-10-30): the bodies draw with programs built before the way in; the decals drew with one compiled on entry (a program's key
// carries the point lights and the tone mapping of the moment it is first drawn). DRAWS: the four bodies, the streaks, six decals and
// the pool (the stone's sign and the pool only while shown), and two outline hulls on a tier that draws them = 12 to 14, in place of
// her 11 it hides (six bodies, four hulls, her streak), only in the Touchstone's zone.
//
// Prior art: the goldsmith's touchstone (Theophrastus' Lydian stone, "On Stones" 45-47; the touch needles of the assay office, rubbed
// beside the sample and compared after the acid), the assayer's hall (Agricola's De Re Metallica VII, Ercker's Treatise of 1574, the
// Goldsmiths' Hall in London where the hallmark was struck), the psychophysics booth (a uniform dark surround, no glare in the field),
// the gallery's hooded picture light, the dipped glazes of a potter's yard (a bare foot under a dipped body); the house's own colours
// for the Assay (the Codex's STATUS shelf, its Assay card: the peach accent and the number cream) and the kit's vertex-coloured bodies.
//
//   game.touchstoneLook = new TouchstoneLook(game)   (boot/world.js, after game.touchstone)   .update(rawDt) (each frame)
//   .build() / .teardown() (on `area.build` / `area.teardown` for 'touchstone', or when her room is seen built)   .built
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TOUCHSTONE } from '../world/touchstone/touchstone.js';
import { Tris } from './racewaypark.js';
import { numeralFit } from './wornnumerals.js';
import { bakedCanvasTexture } from '../render/bakedcanvas.js';
import { addOutline, OUTLINES } from '../render/outline.js';
import { zoneOf } from '../render/zonemap.js';
import { T } from '../core/config.js';

/** The numbers (local metres from her TOUCHSTONE's x, y, z; north is -z). The stone: how much bigger than hers (each side), its face
 *  in front of hers, its back, the arch, the bevel, the honed face (half sizes round her stone's middle) and its incised band. The streaks:
 *  the trials' columns, the three rows, their thickness and length, the golds, their brightness by age, the rub's time. The socle and
 *  the plinths' profile; the clay's colours; the floor, the walls, the door, the lamps; the glows (dim, near, held in a trial, quiet). */
export const TOUCHSTONE_LOOK = {
  stone: { grow: 0.25, front: 0.015, back: 0.03, top: 0.02, arch: 0.14, bevel: 0.06, honed: { hx: 1.88, hy: 1.0, band: 0.06 }, body: 0x16151a, frame: 0x4e4b54, face: 0x060507 },
  streak: { cols: [-1.6, -0.8, 0, 0.8, 1.6], rows: [1.035, 0.965, 0.895], h: 0.045, len: [0.34, 0.56], lift: 0.004, rub: 0.7,
    golds: [0xf3d27a, 0xe9c25e, 0xd8c27a, 0xe7b07a, 0xf6dc8a], age: [1, 0.62, 0.42], old: 0x5a4c34 },
  socle: { base: [2.05, 0], h: 0.45, top: 0.81, dip: 0.36 },
  plinth: { foot: 0.48, shaft: 0.37, cap: 0.48, top: 1.06, dip: 0.42 },
  clay: { body: 0x6a3a28, dark: 0x4a2618, glaze: 0x1c120c, roll: 0x120a07, rust: 0x6b3416 },
  floor: { flags: [16, 13], border: 0.6, bevel: 0.02, y: 0.012, basalt: 0x2b2b31, edge: 0x1f1e23, inlay: 0x5a4428, inlayY: 0.016, inlayW: 0.06 },
  walls: { lining: 0.015, dado: 1.1, rail: 0.06, cornice: [6.9, 7.15], plaster: 0x3a3540, niche: 0x433d49, frieze: 0x2a2630, pilaster: 0x2e2a33,
    cornish: 0x36313b, ceiling: 0x201d24, beam: 0x2e241c, tile: [0x2a1a12, 0x3a2416, 0x5a2a12], brass: 0x8a6d38, beams: [-5.4, -1.8, 1.8, 5.4] },
  door: { wood: 0x3a2418, panel: 0x2e1c12, stud: 0x8a6d38, frame: 0x2e2a33, sill: 0x26252b },
  lamp: { len: 1.4, r: 0.26, brass: 0x6e5a36, inner: 0x3a2a1a, arcs: [[-40, 150], [-10, 190]], at: [[0, 5.5, -3.5], [0, 6, 3]] },
  glow: { idle: 0.55, near: 1.5, held: 1.0, quiet: 0.35, rate: 6, pool: 0xffc46a, poolK: 0.06, poolR: 1.1, stone: 0.8 },
  ink: { gold: '#f0c25a', key: '#24140a', pale: '#fff1dc' },
};
const L = TOUCHSTONE_LOOK, B = TOUCHSTONE, TRIAL_IDS = B.plinths.map((p) => p.id);
const ATLAS = { cell: 160, cols: TRIAL_IDS.length, rows: 2 };
const V = (x, y, z) => new THREE.Vector3(x, y, z), UP = V(0, 1, 0);
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mix = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k).getHex();
const shade = (hex, f) => new THREE.Color(hex).multiplyScalar(f).getHex();
const _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3();

/** A quad facing `n` (its winding turned to face it), a colour a corner (a b c d round its edge). */
function face(Tr, a, b, c, d, n, ca, cb = ca, cc = ca, cd = ca) {
  _e1.subVectors(b, a).cross(_e2.subVectors(c, a));
  if (_e1.dot(n) < 0) Tr.quad(a, d, c, b, ca, cd, cc, cb); else Tr.quad(a, b, c, d, ca, cb, cc, cd);
}
/** An axis box from (x0, y0, z0) to (x1, y1, z1), its faces in `col` (a colour, or fn(key)); `skip` lists faces never seen ('ny pz'). */
function box(Tr, x0, y0, z0, x1, y1, z1, col, skip = '') {
  const c = (k) => (typeof col === 'function' ? col(k) : col);
  const F = [['px', V(1, 0, 0), [V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1), V(x1, y0, z1)]], ['nx', V(-1, 0, 0), [V(x0, y0, z0), V(x0, y0, z1), V(x0, y1, z1), V(x0, y1, z0)]],
    ['py', V(0, 1, 0), [V(x0, y1, z0), V(x0, y1, z1), V(x1, y1, z1), V(x1, y1, z0)]], ['ny', V(0, -1, 0), [V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1)]],
    ['pz', V(0, 0, 1), [V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1)]], ['nz', V(0, 0, -1), [V(x0, y0, z0), V(x0, y1, z0), V(x1, y1, z0), V(x1, y0, z0)]]];
  for (const [k, n, q] of F) if (!skip.includes(k)) face(Tr, q[0], q[1], q[2], q[3], n, c(k));
}
/** A ring round (cx, cz): half sizes bx + h by bz + h, its corners chamfered by k, `sub` points along each side, at height y (or ys[i]). */
function ring(cx, cz, bx, bz, h, k, sub, y) {
  const hx = bx + h, hz = bz + h, out = [];
  const sides = [[[hx, -(hz - k)], [hx, hz - k]], [[hx - k, hz], [-(hx - k), hz]], [[-hx, hz - k], [-hx, -(hz - k)]], [[-(hx - k), -hz], [hx - k, -hz]]];
  for (const [[ax, az], [bx2, bz2]] of sides) for (let i = 0; i <= sub + 1; i++) { const s = i / (sub + 1); out.push(V(cx + ax + (bx2 - ax) * s, y, cz + az + (bz2 - az) * s)); }
  return out;
}
/** A body lofted through rings [{ y, h, col, jit }] round (cx, cz) (jit: the ring's heights moved by jit(i), a dip line's wander), each
 *  face outward along its profile, and capped at the top. */
function loft(Tr, cx, cz, bx, bz, k, sub, rings, jit) {
  const R = rings.map((r) => { const p = ring(cx, cz, bx, bz, r.h, k, sub, r.y); if (r.jit) p.forEach((q, i) => (q.y += jit(i))); return p; });
  for (let i = 0; i < R.length - 1; i++) {
    const a = R[i], b = R[i + 1], A = rings[i], Bn = rings[i + 1], m = a.length;
    for (let j = 0; j < m; j++) {
      const j2 = (j + 1) % m, rad = V((a[j].x + a[j2].x) / 2 - cx, 0, (a[j].z + a[j2].z) / 2 - cz).normalize();
      const n = rad.multiplyScalar(Math.max(1e-3, (b[j].y + b[j2].y - a[j].y - a[j2].y) / 2)).addScaledVector(UP, A.h - Bn.h); // (the profile's outward normal)
      if (n.lengthSq() < 1e-10) continue;
      face(Tr, a[j], a[j2], b[j2], b[j], n, A.col, A.col, Bn.col, Bn.col);
    }
  }
  const top = R[R.length - 1], c = V(cx, top[0].y, cz), col = rings[rings.length - 1].cap ?? rings[rings.length - 1].col;
  for (let j = 0; j < top.length; j++) { const p = top[j], q = top[(j + 1) % top.length]; _e1.subVectors(p, c).cross(_e2.subVectors(q, c)); if (_e1.y < 0) Tr.tri(c, q, p, col); else Tr.tri(c, p, q, col); }
}
/** A streak of gold rubbed on the stone's face: from x0 along `len`, its middle at y, `h` thick, tapered at both ends, its edges and
 *  ends fading into the stone (soft at 480 lines); `broken`: some of it eaten. */
function streak(Tr, x0, y, len, h, col, base, seed, z, broken = false) {
  const n = 10, tilt = (hash(seed) - 0.5) * 0.05, N = V(0, 0, 1);
  const at = (u, s) => { const w = (h / 2) * Math.pow(Math.max(0, Math.sin(Math.PI * u)), 0.4) * (0.85 + 0.3 * hash(seed + Math.round(u * n) * 1.7)); return V(x0 + len * u, y + tilt * len * u + s * w, z); };
  const tone = (u, s) => mix(col, base, s ? 0.85 : 1 - Math.min(1, 5 * u, 5 * (1 - u)));
  for (let i = 0; i < n; i++) {
    if (broken && hash(seed + i * 7.3) < 0.28) continue;
    const u0 = i / n, u1 = (i + 1) / n;
    face(Tr, at(u0, -1), at(u1, -1), at(u1, 0), at(u0, 0), N, tone(u0, 1), tone(u1, 1), tone(u1, 0), tone(u0, 0));
    face(Tr, at(u0, 0), at(u1, 0), at(u1, 1), at(u0, 1), N, tone(u0, 0), tone(u1, 0), tone(u1, 1), tone(u0, 1));
  }
}

// ---------------------------------------------------------------- the signs and numerals: one atlas, a column a trial
/** A trial's sign in gold with a dark keyline, centred on (cx, cy) in a 160 px cell: what its stimuli are, drawn small. */
function drawSign(g, id, cx, cy) {
  const I = L.ink;
  const two = (path, fill) => {
    g.lineJoin = g.lineCap = 'round';
    path(); g.strokeStyle = I.key; g.lineWidth = 16; g.stroke(); if (fill) { g.fillStyle = I.key; g.fill(); }
    path(); if (fill) { g.fillStyle = fill; g.fill(); } else { g.strokeStyle = I.gold; g.lineWidth = 7; g.stroke(); }
  };
  const circle = (x, y, r) => () => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); };
  if (id === 'gonogo') { two(circle(cx - 30, cy, 22), I.gold); two(circle(cx + 30, cy, 21)); }
  else if (id === 'pitch') {
    const shard = (x, h, w) => () => { const b = cy + 34; g.beginPath(); g.moveTo(x, b); g.lineTo(x - w, b - h * 0.45); g.lineTo(x, b - h); g.lineTo(x + w, b - h * 0.45); g.closePath(); };
    two(shard(cx - 26, 40, 14), I.gold); two(shard(cx + 26, 70, 17), I.gold);
  } else if (id === 'colour') {
    const sq = (x) => () => { g.beginPath(); g.rect(x - 15, cy - 15, 30, 30); };
    two(sq(cx - 38), I.gold); two(sq(cx), I.gold); two(sq(cx + 38), I.pale);
  } else if (id === 'rhythm') {
    two(() => { g.beginPath(); g.moveTo(cx - 24, cy + 4); g.quadraticCurveTo(cx - 24, cy - 34, cx, cy - 34); g.quadraticCurveTo(cx + 24, cy - 34, cx + 24, cy + 4); g.lineTo(cx + 31, cy + 12); g.lineTo(cx - 31, cy + 12); g.closePath(); }, I.gold);
    two(circle(cx, cy + 19, 5), I.gold);
    for (const dx of [-28, 0, 28]) two(() => { g.beginPath(); g.moveTo(cx + dx, cy + 34); g.lineTo(cx + dx, cy + 44); });
  } else if (id === 'react') {
    g.lineJoin = g.lineCap = 'round';
    for (const [w, c] of [[22, I.key], [11, I.gold]]) { g.beginPath(); g.arc(cx, cy, 22, 0, Math.PI * 2); g.strokeStyle = c; g.lineWidth = w; g.stroke(); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; two(() => { g.beginPath(); g.moveTo(cx + Math.cos(a) * 38, cy + Math.sin(a) * 38); g.lineTo(cx + Math.cos(a) * 48, cy + Math.sin(a) * 48); }); }
  }
}
/** The atlas: the signs on the top row, the numerals (1 .. 5, the plinths' order) under them; drawn once (render/bakedcanvas.js). */
function signAtlas() {
  const C = ATLAS.cell, W = C * ATLAS.cols, H = C * ATLAS.rows;
  const map = bakedCanvasTexture((g) => {
    g.clearRect(0, 0, W, H);
    TRIAL_IDS.forEach((id, i) => {
      drawSign(g, id, i * C + C / 2, C / 2);
      const o = { x: i * C + C / 2, y: C + C / 2, w: C * 0.72, h: C * 0.6, max: 99 };
      numeralFit(g, i + 1, { ...o, ink: L.ink.key, lw: 15 }); numeralFit(g, i + 1, { ...o, ink: L.ink.gold, lw: 7 });
    });
  }, W, H);
  map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  return map;
}
/** The pool's falloff: white at the middle to black at the rim, opaque (added, so black adds nothing and no edge can show). */
function poolTexture() {
  const N = 64, map = bakedCanvasTexture((g) => {
    const r = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
    for (const [s, v] of [[0, 255], [0.35, 190], [0.7, 60], [1, 0]]) r.addColorStop(s, `rgb(${v},${v},${v})`);
    g.fillStyle = r; g.fillRect(0, 0, N, N);
  }, N, N);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}
/** Quads of the atlas: each { c, r (its cell), at (its middle), right, up, w, h }, one geometry. */
function decalGeometry(items) {
  const pos = [], uv = [], idx = [];
  items.forEach((it, k) => {
    const u0 = it.c / ATLAS.cols, u1 = (it.c + 1) / ATLAS.cols, v1 = 1 - it.r / ATLAS.rows, v0 = 1 - (it.r + 1) / ATLAS.rows;
    for (const [a, b, U, W] of [[-1, -1, u0, v0], [1, -1, u1, v0], [1, 1, u1, v1], [-1, 1, u0, v1]]) {
      const p = it.at.clone().addScaledVector(it.right, (a * it.w) / 2).addScaledVector(it.up, (b * it.h) / 2);
      pos.push(p.x, p.y, p.z); uv.push(U, W);
    }
    idx.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3);
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

export class TouchstoneLook {
  constructor(game) {
    this.game = game; this.built = false; this.room = null; this.fresh = null;
    this.wire();
  }

  /** The bus: her area built and torn down, a trial begun, a run recorded (the events exist from boot; asked again at the first frame). */
  wire() {
    const E = this.game.events; if (this.wired || !E?.on) return; this.wired = true;
    E.on('area.build', (e) => { if (e?.area === 'touchstone') this.build(); });
    E.on('area.teardown', (e) => { if (e?.area === 'touchstone') this.teardown(); });
    E.on('assay.trial.start', () => this.settleFresh());
    E.on('aptitude.trial', (e) => { if (e?.ok && this.built && TRIAL_IDS.includes(e.trial)) this.rub(e.trial); });
  }

  // ---------------------------------------------------------------- built with her room, taken down with it
  build() {
    const g = this.game, ts = g.touchstone; if (!ts?.built || !ts.room) return;
    if (this.built) this.teardown();
    this.built = true; this.room = ts.room;
    const found = this.hidePlaceholders(ts.room);
    const std = (name, roughness, metalness = 0, o = {}) => new THREE.MeshStandardMaterial({ name, color: 0xffffff, vertexColors: true, roughness, metalness, flatShading: true, ...o }); // (the kit's parameters: its program)
    const decal = (name, map, o = {}) => new THREE.MeshBasicMaterial({ name, map, transparent: true, alphaTest: 0.05, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, ...o }); // (the numerals' decal: its program, vfx/wornnumerals.js)
    this.atlas = signAtlas(); this.poolMap = poolTexture();
    const M = (this.mats = {
      polish: std('touchstone-look-polish', 0.28), honed: std('touchstone-look-honed', 0.85), glaze: std('touchstone-look-glaze', 0.35),
      hall: std('touchstone-look-hall', 0.8), gold: std('touchstone-look-gold', 0.45, 0.15, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      pool: decal('touchstone-look-pool', this.poolMap, { blending: THREE.AdditiveBlending, color: 0x000000 }),
    });
    const grp = (this.group = new THREE.Group()); grp.name = 'touchstone-look'; grp.userData.zone = 'touchstone'; grp.position.set(B.x, B.y, B.z);
    this.meshes = []; this.outlines = [];
    const smooth = T.visual.smooth !== false;
    const put = (geo, mat, outline = false, name = mat.name) => {
      const m = new THREE.Mesh(geo, mat); m.name = name; m.castShadow = false; m.receiveShadow = true; grp.add(m); this.meshes.push(m);
      if (mat.isMeshStandardMaterial) g.present?.shadeOne?.(m, true, smooth); // (shaded as it is built: CASEBOOK 171)
      if (outline) { const o = addOutline(m); if (o) this.outlines.push(o); }
      return m;
    };
    const polish = new Tris(), honed = new Tris(), glaze = new Tris(), hall = new Tris();
    this.stone(polish, honed, found.face ?? L.stone.face);
    this.socle(glaze); this.plinths(glaze); this.floor(hall); this.walls(hall, glaze); this.door(glaze);
    this.lamps(glaze, ts.lamps?.length ? ts.lamps.map((l) => l.position.clone().sub(V(B.x, B.y, B.z))) : L.lamp.at.map((p) => V(...p)));
    put(polish.geometry(), M.polish, true); put(honed.geometry(), M.honed); put(glaze.geometry(), M.glaze, true); put(hall.geometry(), M.hall);
    this.streaks = put(new THREE.BufferGeometry(), M.gold); this.writeStreaks();
    // the signs and numerals: a plinth's sign on its cap, its number on its face, one decal a plinth (its gold lit on its own)
    const P = L.plinth;
    this.signs = B.plinths.map((p, i) => {
      const mat = decal(`touchstone-look-sign-${p.id}`, this.atlas), k = L.glow.idle; mat.color.setScalar(k);
      const geo = decalGeometry([{ c: i, r: 0, at: V(p.x, P.top + 0.015, B.plinthZ), right: V(1, 0, 0), up: V(0, 0, -1), w: 0.6, h: 0.6 },
        { c: i, r: 1, at: V(p.x, 0.63, B.plinthZ + P.shaft + 0.012), right: V(1, 0, 0), up: UP, w: 0.31, h: 0.22 }]);
      return { id: p.id, x: p.x, k, mat, mesh: put(geo, mat) };
    });
    const S = B.stone, zF = S.z + S.t / 2 + L.stone.front;
    this.stoneSign = { k: 0, id: null, mat: decal('touchstone-look-stone-sign', this.atlas, { color: 0x000000 }) };
    const top = S.y + S.h / 2 + L.stone.top - L.stone.bevel, mid = (S.y + L.stone.honed.hy + top) / 2; // (between the honed face's band and the face's top edge)
    this.stoneSign.mesh = put(decalGeometry([{ c: 0, r: 0, at: V(0, mid, zF + 0.008), right: V(1, 0, 0), up: UP, w: 0.2, h: 0.2 }]), this.stoneSign.mat);
    this.stoneSign.mesh.visible = false;
    // the pool of light round the plinth you stand at
    this.pool = { k: 0, at: null, mesh: put(new THREE.PlaneGeometry(L.glow.poolR * 2, L.glow.poolR * 2).rotateX(-Math.PI / 2), M.pool) };
    this.pool.mesh.position.y = 0.035; this.pool.mesh.visible = false; this.pool.mesh.renderOrder = 1;
    g.scene.add(grp);
  }

  teardown() {
    if (!this.built) return; this.built = false;
    const g = this.game;
    for (const o of this.outlines || []) OUTLINES.delete(o);
    if (this.fresh?.mesh) this.meshes.push(this.fresh.mesh);
    g.scene?.remove(this.group);
    for (const m of this.meshes || []) m.geometry.dispose();
    for (const m of Object.values(this.mats || {})) m.dispose();
    for (const s of this.signs || []) s.mat.dispose();
    this.stoneSign?.mat.dispose(); this.atlas?.dispose(); this.poolMap?.dispose();
    this.group = this.room = this.fresh = this.signs = this.stoneSign = this.pool = this.streaks = null; this.meshes = []; this.outlines = []; this.mats = null;
  }

  /** Her placeholders this stands in for, hidden (her meshes found by her own numbers, TOUCHSTONE: CASEBOOK 141; one not found is left
   *  to show, a wrong look and nothing else). Returns her stone's colour, the honed face's ground. */
  hidePlaceholders(room) {
    const S = B.stone, near = (a, b) => Math.abs(a - b) < 0.02, out = {}, maxX = Math.max(...B.plinths.map((p) => Math.abs(p.x))) + 0.45;
    for (const m of room.children) {
      if (!m.isMesh || m.userData.isOutline) continue;
      const G = m.geometry;
      if (G.type === 'PlaneGeometry') { if (Math.abs(G.parameters.width - S.w * 0.8) < 1e-3 && Math.abs(G.parameters.height - 0.05) < 1e-3) m.visible = false; continue; } // (her gold streak)
      if (!G.boundingBox) G.computeBoundingBox();
      const lo = G.boundingBox.min.clone().add(m.position).sub(V(B.x, B.y, B.z)), hi = G.boundingBox.max.clone().add(m.position).sub(V(B.x, B.y, B.z));
      const floor = near(hi.y, 0) && near(lo.y, -1), walls = near(lo.y, 0) && near(hi.y, B.h + 1);
      const stone = near(lo.x, -S.w / 2) && near(hi.x, S.w / 2) && near(lo.y, S.y - S.h / 2) && near(hi.y, S.y + S.h / 2);
      const plinths = near(lo.y, 0) && near(hi.y, 1) && near(hi.x, maxX), tops = near(lo.y, 1) && near(hi.y, 1.04), door = near(lo.y, 0) && near(hi.y, 5) && lo.z > B.d / 2;
      if (stone) out.face = [].concat(m.material)[0]?.color?.getHex?.();
      if (floor || walls || stone || plinths || tops || door) m.visible = false;
    }
    return out;
  }

  // ---------------------------------------------------------------- the stone, its socle and its streaks
  stone(polish, honed, faceHex) {
    const S = B.stone, St = L.stone, c = St.bevel, zF = S.z + S.t / 2 + St.front, zBk = S.z - S.t / 2 - St.back;
    const hx = S.w / 2 + St.grow - c, yb = S.y - S.h / 2 + c, yt = S.y + S.h / 2 + St.top - c;
    const shape = new THREE.Shape(); shape.moveTo(-hx, yb); shape.lineTo(hx, yb);
    for (let i = 0; i <= 16; i++) { const x = hx - (2 * hx * i) / 16; shape.lineTo(x, yt - St.arch * (x / hx) ** 2); } // (closed back to its start by itself)
    // the body: the extrusion's sides, bevels and back (its front cap dropped: the face is laid in parts below)
    const D = zF - zBk - 2 * c, ex = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: c, bevelSize: c, bevelSegments: 1, steps: 1 }).translate(0, 0, zBk + c);
    const p = ex.attributes.position, a = V(0, 0, 0), b = V(0, 0, 0), q = V(0, 0, 0);
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); q.fromBufferAttribute(p, i + 2);
      if (Math.abs(a.z - zF) < 1e-4 && Math.abs(b.z - zF) < 1e-4 && Math.abs(q.z - zF) < 1e-4) continue;
      polish.tri(a, b, q, St.body);
    }
    ex.dispose();
    // the face: the polished border round the honed face, then its incised band (soft: body, pale, her ground) and the honed face
    const W = St.honed, hole = new THREE.Path(), wx = W.hx, wy0 = S.y - W.hy, wy1 = S.y + W.hy;
    hole.moveTo(-wx, wy0); hole.lineTo(-wx, wy1); hole.lineTo(wx, wy1); hole.lineTo(wx, wy0);
    shape.holes.push(hole);
    polish.add(new THREE.ShapeGeometry(shape).translate(0, 0, zF), St.body);
    const N = V(0, 0, 1), rect = (d) => [V(-wx + d, wy0 + d, zF), V(wx - d, wy0 + d, zF), V(wx - d, wy1 - d, zF), V(-wx + d, wy1 - d, zF)];
    const R0 = rect(0), R1 = rect(W.band / 2), R2 = rect(W.band), cols = [St.body, St.frame, faceHex];
    for (const [A, Bq, ca, cb] of [[R0, R1, cols[0], cols[1]], [R1, R2, cols[1], cols[2]]]) for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; face(honed, A[i], A[j], Bq[j], Bq[i], N, ca, ca, cb, cb); }
    face(honed, R2[0], R2[1], R2[2], R2[3], N, faceHex);
  }
  socle(Tr) {
    const So = L.socle, C = L.clay, S = B.stone, j = (i) => (hash(i * 3.1 + 7) - 0.5) * 0.08;
    loft(Tr, 0, S.z, So.base[0], So.base[1], 0.04, 6, [
      { y: 0, h: So.h + 0.06, col: C.dark }, { y: 0.1, h: So.h + 0.06, col: C.body }, { y: 0.1, h: So.h, col: C.body },
      { y: So.dip - 0.005, h: So.h, col: C.body, jit: true }, { y: So.dip + 0.005, h: So.h + 0.002, col: C.roll, jit: true }, { y: So.dip + 0.05, h: So.h + 0.001, col: C.glaze, jit: true },
      { y: 0.72, h: So.h, col: C.glaze }, { y: 0.72, h: So.h + 0.03, col: C.glaze }, { y: 0.79, h: So.h + 0.03, col: C.rust }, { y: So.top, h: So.h + 0.01, col: C.rust, cap: C.glaze },
    ], j);
  }
  /** The streaks' body: the flanks' old ones, and the record's (the last three runs of each trial: slot (run - 1) mod 3, so a new run
   *  takes the slot of the run three before it and the others stay put); `except` a run being rubbed in now. */
  writeStreaks(except = null) {
    const S = B.stone, Sk = L.streak, z = S.z + S.t / 2 + L.stone.front + Sk.lift, base = L.stone.body, Tr = new Tris();
    for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) {
      const s = 40 + i * 11 + (sd > 0 ? 100 : 0), len = 0.12 + 0.18 * hash(s), x = sd * (L.stone.honed.hx + 0.1 + 0.32 * hash(s + 1)) - (sd > 0 ? 0 : len);
      streak(Tr, Math.max(-2.36, Math.min(2.36 - len, x)), S.y - 0.85 + 1.7 * hash(s + 2), len, 0.035, mix(Sk.old, Sk.golds[i % Sk.golds.length], 0.25), base, s, z, true);
    }
    TRIAL_IDS.forEach((id, t) => {
      const n = this.game.ledger?.get?.(`aptitude.trial.${id}.n`) || 0;
      for (let age = 0; age < Math.min(3, n); age++) {
        const run = n - age; if (except && except.id === id && except.run === run) continue;
        const g = this.streakOf(t, run); streak(Tr, g.x0, g.y, g.len, Sk.h, shade(g.col, Sk.age[age]), base, g.seed, z, age === 2);
      }
    });
    this.streaks.geometry.dispose(); this.streaks.geometry = Tr.pos.length ? Tr.geometry() : new THREE.BufferGeometry();
  }
  streakOf(t, run) {
    const Sk = L.streak, seed = t * 97 + run * 13.7, len = Sk.len[0] + (Sk.len[1] - Sk.len[0]) * hash(seed);
    return { seed, len, x0: Sk.cols[t] - len / 2 + (hash(seed + 3) - 0.5) * 0.1, y: Sk.rows[(run - 1) % 3], col: Sk.golds[Math.floor(hash(seed + 5) * Sk.golds.length)] };
  }
  /** A run recorded (`aptitude.trial`): its streak rubbed in, left to right, over the rub's time; the rest of the record stays put. */
  rub(id) {
    this.settleFresh();
    const t = TRIAL_IDS.indexOf(id), run = this.game.ledger?.get?.(`aptitude.trial.${id}.n`) || 0; if (t < 0 || run < 1) return;
    const S = B.stone, z = S.z + S.t / 2 + L.stone.front + L.streak.lift, g = this.streakOf(t, run), Tr = new Tris();
    streak(Tr, 0, g.y, g.len, L.streak.h, g.col, L.stone.body, g.seed, z);
    const mesh = new THREE.Mesh(Tr.geometry(), this.mats.gold); mesh.name = 'touchstone-look-rub'; mesh.position.x = g.x0; mesh.scale.x = 0.001;
    this.group.add(mesh); this.game.present?.shadeOne?.(mesh, true, T.visual.smooth !== false);
    this.fresh = { id, run, t: 0, mesh };
    this.writeStreaks({ id, run });
  }
  /** The rub finished at once (a trial begun: nothing moves while one runs), or at its end. */
  settleFresh() {
    const f = this.fresh; if (!f) return; this.fresh = null;
    f.mesh.parent?.remove(f.mesh); f.mesh.geometry.dispose();
    if (this.built) this.writeStreaks();
  }

  // ---------------------------------------------------------------- the plinths
  plinths(Tr) {
    const P = L.plinth, C = L.clay;
    B.plinths.forEach((p, i) => {
      const j = (k) => (hash(i * 31 + k * 5.3) - 0.5) * 0.09;
      loft(Tr, p.x, B.plinthZ, 0, 0, 0.07, 0, [
        { y: 0, h: P.foot, col: C.dark }, { y: 0.1, h: P.foot, col: C.body }, { y: 0.1, h: P.foot - 0.04, col: C.body }, { y: 0.14, h: P.shaft + 0.03, col: C.body },
        { y: 0.16, h: P.shaft, col: C.body }, { y: P.dip - 0.005, h: P.shaft, col: C.body, jit: true }, { y: P.dip + 0.005, h: P.shaft + 0.002, col: C.roll, jit: true },
        { y: P.dip + 0.04, h: P.shaft + 0.001, col: C.glaze, jit: true }, { y: 0.8, h: P.shaft, col: C.glaze }, { y: 0.8, h: P.shaft + 0.03, col: C.glaze },
        { y: 0.86, h: P.shaft + 0.05, col: C.rust }, { y: 0.9, h: P.shaft + 0.03, col: C.glaze }, { y: 0.9, h: P.shaft + 0.05, col: C.glaze },
        { y: 0.95, h: P.cap, col: C.glaze }, { y: P.top - 0.03, h: P.cap, col: C.rust }, { y: P.top, h: P.cap - 0.03, col: C.rust, cap: C.glaze },
      ], j);
    });
  }

  // ---------------------------------------------------------------- the floor
  floor(Tr) {
    const F = L.floor, X = B.w / 2, Z = B.d / 2, e = F.border, y = F.y, bv = F.bevel, [nx, nz] = F.flags, fx = (2 * (X - e)) / nx, fz = (2 * (Z - e)) / nz;
    const slab = (x0, z0, x1, z1, col, edges = 'xXzZ') => { // (a flag: its top at y, bevelled down to the floor's 0 at the edges named: x x0, X x1, z z0, Z z1)
      const has = (k) => edges.includes(k), i0 = has('x') ? bv : 0, i1 = has('X') ? bv : 0, k0 = has('z') ? bv : 0, k1 = has('Z') ? bv : 0, dark = shade(col, 0.7);
      const t = [V(x0 + i0, y, z0 + k0), V(x1 - i1, y, z0 + k0), V(x1 - i1, y, z1 - k1), V(x0 + i0, y, z1 - k1)], o = [V(x0, 0, z0), V(x1, 0, z0), V(x1, 0, z1), V(x0, 0, z1)];
      face(Tr, t[0], t[1], t[2], t[3], UP, col);
      for (const [k, a, b] of [['z', 0, 1], ['X', 1, 2], ['Z', 2, 3], ['x', 3, 0]]) if (has(k)) face(Tr, o[a], o[b], t[b], t[a], UP, dark, dark, col, col);
    };
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
      const h = hash(i * 31 + k * 17), col = new THREE.Color(F.basalt).multiplyScalar(0.86 + 0.28 * h).lerp(new THREE.Color(0x30282a), 0.25 * hash(i * 7 + k * 3)).getHex();
      slab(-X + e + i * fx, -Z + e + k * fz, -X + e + (i + 1) * fx, -Z + e + (k + 1) * fz, col);
    }
    slab(-X, -Z, X, -Z + e, F.edge, 'Z'); slab(-X, Z - e, X, Z, F.edge, 'z'); slab(-X, -Z + e, -X + e, Z - e, F.edge, 'X'); slab(X - e, -Z + e, X, Z - e, F.edge, 'x');
    slab(-2, Z, 2, Z + 0.74, L.door.sill, ''); // (the threshold, in the doorway)
    // the brass: the meridian from the door to the socle, and the line round the field
    const w = F.inlayW / 2, iy = F.inlayY, strip = (x0, z0, x1, z1) => face(Tr, V(x0, iy, z0), V(x1, iy, z0), V(x1, iy, z1), V(x0, iy, z1), UP, F.inlay);
    strip(-w, B.stone.z + 0.45 + 0.12, w, Z - e);
    const r = e - 0.06; strip(-X + r, -Z + r, X - r, -Z + r + 2 * w); strip(-X + r, Z - r - 2 * w, X - r, Z - r); strip(-X + r, -Z + r + 2 * w, -X + r + 2 * w, Z - r - 2 * w); strip(X - r - 2 * w, -Z + r + 2 * w, X - r, Z - r - 2 * w);
  }

  // ---------------------------------------------------------------- the walls, the ceiling, the door, the lamps
  walls(hall, glaze) {
    const Wl = L.walls, X = B.w / 2, Z = B.d / 2, lin = Wl.lining, [c0, c1] = Wl.cornice, top = B.h - lin, rail = Wl.dado + Wl.rail;
    // a wall: its plane `at` along `axis`, facing `n` (+1 / -1) into the room, along u from u0 to u1 (bands from b0 to b1: the minor walls' bands stop inside the major walls' ones)
    const wall = (axis, at, n, u0, u1, o = {}) => {
      const P = (u, y, d) => (axis === 'x' ? V(at + n * d, y, u) : V(u, y, at + n * d)), N = axis === 'x' ? V(n, 0, 0) : V(0, 0, n), b0 = o.b0 ?? u0, b1 = o.b1 ?? u1;
      const quad = (ua, ub, ya, yb, d, col, Tr = hall) => face(Tr, P(ua, ya, d), P(ub, ya, d), P(ub, yb, d), P(ua, yb, d), N, col);
      const block = (ua, ub, ya, yb, d, col, Tr = glaze, skip = '') => { // (a box standing off the wall by d; its back never seen)
        const A = P(ua, ya, 0), Bp = P(ub, yb, d), lo = V(Math.min(A.x, Bp.x), ya, Math.min(A.z, Bp.z)), hi = V(Math.max(A.x, Bp.x), yb, Math.max(A.z, Bp.z));
        const back = axis === 'x' ? (n > 0 ? 'nx' : 'px') : n > 0 ? 'nz' : 'pz';
        box(Tr, lo.x, lo.y, lo.z, hi.x, hi.y, hi.z, col, `${back} ${skip}`);
      };
      // the dado: glazed tiles in a checker, a rust one here and there; the brass rail over it
      for (const [s0, s1] of o.gaps ? o.gaps : [[b0, b1]]) {
        const nT = Math.max(1, Math.round(Math.abs(s1 - s0) / 0.37)), du = (s1 - s0) / nT;
        for (let i = 0; i < nT; i++) for (let r = 0; r < 3; r++) { const h = hash(i * 13 + r * 7 + at * 3); quad(s0 + i * du, s0 + (i + 1) * du, (r * Wl.dado) / 3, ((r + 1) * Wl.dado) / 3, 0.05, h > 0.93 ? Wl.tile[2] : Wl.tile[(i + r) % 2], glaze); }
        block(s0, s1, Wl.dado, rail, 0.09, Wl.brass); // (it covers the dado's top)
      }
      // the plaster (the niche's lighter; over the doorway only above it), the pilasters, the cornice, the frieze
      const cuts = [u0, ...(o.niche || []), ...(o.door ? o.door.slice(0, 2) : []), u1].sort((a, b) => a - b), within = (r, i) => r && cuts[i] >= r[0] - 1e-6 && cuts[i + 1] <= r[1] + 1e-6;
      for (let i = 0; i < cuts.length - 1; i++) {
        const inN = within(o.niche, i), lo = within(o.door, i) ? o.door[2] : rail;
        quad(cuts[i], cuts[i + 1], lo, inN ? o.nicheTop : c0, 0, inN ? Wl.niche : Wl.plaster); if (inN) quad(cuts[i], cuts[i + 1], o.nicheTop, c0, 0, Wl.plaster);
      }
      if (o.niche) block(o.niche[0] - 0.2, o.niche[1] + 0.2, o.nicheTop, o.nicheTop + 0.3, 0.1, Wl.pilaster, hall);
      for (const u of o.pil || []) block(u - 0.225, u + 0.225, rail, c0, 0.12, Wl.pilaster, hall, 'ny py');
      block(b0, b1, c0, c1, 0.14, Wl.cornish, hall); quad(u0, u1, c1, top, 0, Wl.frieze);
    };
    wall('z', -Z + lin, 1, -X + lin, X - lin, { b0: -X, b1: X, pil: [-7.4, -3.6, 3.6, 7.4], niche: [-3.4, 3.4], nicheTop: 6.0 });
    wall('z', Z - lin, -1, -X + lin, X - lin, { b0: -X, b1: X, pil: [-8.5, -5.0, 5.0, 8.5], gaps: [[-X, -2.3], [2.3, X]], door: [-2, 2, 5] });
    for (const sd of [-1, 1]) wall('x', sd * (X - lin), -sd, -Z + lin, Z - lin, { b0: -Z + lin + 0.03, b1: Z - lin - 0.03, pil: [-5.4, -1.8, 1.8, 5.4] }); // (their bands' ends buried in the end walls' bands)
    // the ceiling and its beams (their ends in the walls)
    face(hall, V(-X + lin, top, -Z + lin), V(X - lin, top, -Z + lin), V(X - lin, top, Z - lin), V(-X + lin, top, Z - lin), V(0, -1, 0), Wl.ceiling);
    for (const z of Wl.beams) box(hall, -X, top - 0.34, z - 0.15, X, top, z + 0.15, Wl.beam, 'py');
  }
  door(Tr) {
    const D = L.door, Z = B.d / 2 - L.walls.lining, back = B.d / 2 + 0.9 - 0.15 - 0.01, w = 2.0, h = 5.0; // (her door slab's face, B.d / 2 + 0.9 less its half 0.15, and 1 cm in front of it; her doorway 4 m by 5)
    for (const sd of [-1, 1]) { box(Tr, sd > 0 ? w : -w - 0.3, 0, Z - 0.08, sd > 0 ? w + 0.3 : -w, h + 0.3, Z, D.frame, 'ny pz'); face(Tr, V(sd * w, 0, Z), V(sd * w, 0, back), V(sd * w, h, back), V(sd * w, h, Z), V(-sd, 0, 0), L.walls.plaster); }
    box(Tr, -w, h, Z - 0.08, w, h + 0.3, Z, D.frame, 'pz');
    face(Tr, V(-w, h, Z), V(w, h, Z), V(w, h, back), V(-w, h, back), V(0, -1, 0), L.walls.frieze);
    for (const sd of [-1, 1]) {
      const x0 = sd > 0 ? 0.01 : -w + 0.01, x1 = sd > 0 ? w - 0.01 : -0.01;
      box(Tr, x0, 0, back - 0.06, x1, h - 0.01, back, D.wood, 'pz ny');
      for (const [y0, y1] of [[0.4, 2.3], [2.7, 4.6]]) {
        box(Tr, x0 + 0.22, y0, back - 0.08, x1 - 0.22, y1, back - 0.06, D.panel, 'pz ny');
        for (let s = 0; s <= 4; s++) for (const yy of [y0 - 0.12, y1 + 0.12]) { const x = x0 + 0.22 + ((x1 - x0 - 0.44) * s) / 4; box(Tr, x - 0.03, yy - 0.03, back - 0.09, x + 0.03, yy + 0.03, back - 0.06, D.stud, 'pz ny'); }
      }
      box(Tr, sd * 0.18 - 0.05, 2.35, back - 0.12, sd * 0.18 + 0.05, 2.65, back - 0.06, D.stud, 'pz'); // (a pull)
    }
  }
  /** Her two lamps' hoods: a brass trough along x round each (its arc open toward what it lights: the stone's down and north, the
   *  plinths' straight down), hung on two rods from the ceiling; the inside dark, lit by the lamp. */
  lamps(Tr, at) {
    const Lp = L.lamp, top = B.h - L.walls.lining;
    at.forEach((p, k) => {
      const [a0, a1] = Lp.arcs[k % Lp.arcs.length], c = p.clone().add(V(0, 0.04, 0)), n = 8, hx = Lp.len / 2;
      const pt = (deg, r, x) => { const t = THREE.MathUtils.degToRad(deg); return V(c.x + x, c.y + Math.sin(t) * r, c.z + Math.cos(t) * r); };
      for (let i = 0; i < n; i++) {
        const t0 = a0 + ((a1 - a0) * i) / n, t1 = a0 + ((a1 - a0) * (i + 1)) / n, tm = THREE.MathUtils.degToRad((t0 + t1) / 2), rad = V(0, Math.sin(tm), Math.cos(tm));
        face(Tr, pt(t0, Lp.r, -hx), pt(t1, Lp.r, -hx), pt(t1, Lp.r, hx), pt(t0, Lp.r, hx), rad, Lp.brass);
        face(Tr, pt(t0, Lp.r - 0.015, -hx), pt(t1, Lp.r - 0.015, -hx), pt(t1, Lp.r - 0.015, hx), pt(t0, Lp.r - 0.015, hx), rad.clone().negate(), Lp.inner);
      }
      for (const sd of [-1, 1]) for (const [r, col, out] of [[Lp.r, Lp.brass, 1], [Lp.r - 0.015, Lp.inner, -1]]) { // (the ends: the segment between the arc and its chord)
        const m = pt(a0, r, sd * hx).lerp(pt(a1, r, sd * hx), 0.5), N = V(sd * out, 0, 0);
        for (let i = 0; i < n; i++) { const A = pt(a0 + ((a1 - a0) * i) / n, r, sd * hx), Bp = pt(a0 + ((a1 - a0) * (i + 1)) / n, r, sd * hx); _e1.subVectors(A, m).cross(_e2.subVectors(Bp, m)); if (_e1.dot(N) < 0) Tr.tri(m, Bp, A, col); else Tr.tri(m, A, Bp, col); }
      }
      for (const x of [-0.5, 0.5]) { box(Tr, c.x + x - 0.018, c.y + Lp.r - 0.02, c.z - 0.018, c.x + x + 0.018, top, c.z + 0.018, Lp.brass, 'py ny'); box(Tr, c.x + x - 0.08, top - 0.03, c.z - 0.08, c.x + x + 0.08, top, c.z + 0.08, Lp.brass, 'py'); }
    });
  }

  // ---------------------------------------------------------------- each frame
  update(dt) {
    this.wire();
    const g = this.game, ts = g.touchstone; if (!ts) return;
    if (ts.built && this.room !== ts.room) this.build(); // (a room built before this look heard of it, or built again)
    else if (!ts.built && this.built) this.teardown();
    if (!this.built || zoneOf(g.camera.position) !== 'touchstone') return;
    const G = L.glow, run = ts.run && !ts.run.done ? ts.run : null, it = g.interact?.cur;
    const near = !run && it?.id === 'touchstone' && it.ref !== 'door' ? it.ref : null, e = 1 - Math.exp(-G.rate * dt);
    const ease = (k, want) => (Math.abs(want - k) < 0.004 ? want : k + (want - k) * e); // (settled exactly: nothing creeps while a trial runs)
    for (const s of this.signs) { s.k = ease(s.k, run ? (s.id === run.id ? G.held : G.quiet) : s.id === near ? G.near : G.idle); s.mat.color.setScalar(s.k); }
    // the stone's sign of the trial running, on its top border
    const St = this.stoneSign;
    if (run && St.id !== run.id) { St.id = run.id; const c = TRIAL_IDS.indexOf(run.id), uv = St.mesh.geometry.attributes.uv, u0 = c / ATLAS.cols, u1 = (c + 1) / ATLAS.cols; for (let i = 0; i < 4; i++) uv.setX(i, i === 0 || i === 3 ? u0 : u1); uv.needsUpdate = true; }
    St.k = ease(St.k, run ? G.stone : 0); St.mat.color.setScalar(St.k); St.mesh.visible = St.k > 0.002; if (!run && St.k <= 0.002) St.id = null;
    // the pool: out while a trial runs; moved only once it has gone out
    const P = this.pool, want = !run && near ? 1 : 0;
    if (P.at !== near && !run) { P.k = Math.max(0, P.k - dt * 8); if (P.k <= 0) { P.at = near; const p = B.plinths.find((q) => q.id === near); if (p) P.mesh.position.set(p.x, 0.035, B.plinthZ); } }
    else P.k = ease(P.k, P.at === near ? want : 0);
    P.mesh.material.color.setHex(G.pool).multiplyScalar(P.k * G.poolK); P.mesh.visible = P.k > 0.002;
    // a run's streak rubbed in
    const f = this.fresh; if (f) { f.t += dt; const s = Math.min(1, f.t / L.streak.rub); f.mesh.scale.x = Math.max(0.001, 1 - (1 - s) ** 3); if (s >= 1) this.settleFresh(); }
  }
}
