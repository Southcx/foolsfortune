// ---------------------------------------------------------------------------------------
// THE ADOBE CITY'S BLUEPRINT KIT (plain names; South, 2026-11-03: "take a stab at drafting some adobe buildings ... super fancy and with
// varied silhouettes"): the tools a blueprint (blueprints*.js) draws its cells with, pure data, no three.js. A plan is a grid of 1 m cells
// laid out as Dovina's newBuilding lays hers (progress/mechs/destruction.js: i = x + w * (z + d * y)), each cell a material (her MAT ids)
// and a look role (ROLE: what the dress paints it, vfx/mechs/city/dress.js), and a list of props keyed to the cell they hang from.
//   the shapes    fill, clear, walls (a hollow ring of t thick), ring / disc / cyl (round), dome (corbelled, two thick), stepped and
//                 tapered towers by layers; openings (a door, a window, an arch) cut through a wall with a lintel over them
//   the rule      a cell stands on a cell under it, or reaches sideways its material's span over air (her collapse(): brick 2, timber 3,
//                 stone 1); `settle()` runs that rule on the finished plan and drops any cell it would let fall, so a fresh blueprint
//                 never comes apart at build (the props on a dropped cell go with it), and says how many it dropped
// Prior art: Dovina's newBuilding and collapse (the cell layout and the support rule, copied here as a rule, never imported as code so
// the paper and furnishing of her fire branch are known before they are merged), MagicaVoxel's and Minecraft's builders' box-and-ring
// brushes, the corbelled dome of the Musgum and the Harran beehive houses (each course stepped in over the one below).
//
//   const P = new Plan(w, h, d, seed)   P.fill(x0, y0, z0, x1, y1, z1, role, mat?)   P.walls(x0, z0, x1, z1, y0, y1, role, t)
//   P.cyl(cx, cz, r, y0, y1, role, t)   P.dome(cx, cz, r, y0, role, { t, k })   P.door(x, y, z, face, w, h, role)   P.prop(kind, x, y, z, face, o)
//   P.finish() -> { w, h, d, mat, role, props, tint, dropped }   ROLE   ROLE_NAMES   ROLE_MAT   FACE   SPAN   rng(seed)
// ---------------------------------------------------------------------------------------

/** A cell's look role (the dress's palette and props read it; 0 air). Named for what it is on a real earthen building. */
export const ROLE = {
  plaster: 1,     // the mud plaster (adobe, banco, kahgel): the walls
  lime: 2,        // lime-washed plaster (Shibam's tops, a mission's facade, a casa's walls)
  trim: 3,        // a raised band or frame of plaster round an opening, a cornice
  viga: 4,        // a roof beam's cell (cedar, palm: its end shows)
  lintel: 5,      // the timber over an opening
  door: 6,        // a painted door (indigo, turquoise)
  shutter: 7,     // a painted shutter
  tile: 8,        // a glazed band (zellige greens, kashi cobalt, talavera)
  dome: 9,        // a dome's or vault's plaster, smoothed
  crenel: 10,     // a merlon, a pinnacle (the kasbah's, the mosque's)
  toron: 11,      // a buttress carrying the palm-wood toron (Djenné)
  lattice: 12,    // a mashrabiya's turned wood
  awning: 13,     // an awning's cloth (paper in her rules: fire's fodder)
  roofEarth: 14,  // a flat roof of packed earth over the vigas (timber in her rules)
  stone: 15,      // a plinth, a footing, a step
  glass: 16,      // a pane (few: adobe holds few windows)
  goods: 17,      // what is in the rooms and on the stalls (her furnishing)
  wood: 18,       // plain timber (a post, a rail, a ladder's pole, a balcony)
  gold: 19,       // a gilded accent (a finial's collar, a mihrab's frame): sparingly
  relief: 20,     // a carved relief pattern in the plaster (Hausa's arabesques, the Musgum's ribs)
  thatch: 21,     // a straw cap (paper in her rules)
  floor: 22,      // an inner floor of timber (no face shows from the street)
  cobalt: 23,     // a cobalt glazed tile (the kashi of Yazd and Isfahan)
  rose: 24,       // a rose clay plaster (Marrakech's red)
};
export const ROLE_NAMES = Object.fromEntries(Object.entries(ROLE).map(([k, v]) => [v, k]));

/** Dovina's material ids (MAT in progress/mechs/destruction.js; paper 6 and furnishing 7 from her fire branch). */
export const M = { glass: 1, timber: 2, brick: 3, stone: 4, steel: 5, paper: 6, furnishing: 7, adobe: 8 };
/** What each role is made of unless a blueprint says otherwise: the earth's plasters, crenels, domes and reliefs adobe (Dovina's MAT.adobe:
 *  sun-dried, softer than fired brick); the glazed tiles and the gilded accents fired brick. */
export const ROLE_MAT = {
  1: M.adobe, 2: M.adobe, 3: M.adobe, 4: M.timber, 5: M.timber, 6: M.timber, 7: M.timber, 8: M.brick, 9: M.adobe, 10: M.adobe, 11: M.adobe,
  12: M.timber, 13: M.paper, 14: M.timber, 15: M.stone, 16: M.glass, 17: M.furnishing, 18: M.timber, 19: M.brick, 20: M.adobe, 21: M.paper,
  22: M.timber, 23: M.brick, 24: M.adobe,
};
/** Each material's span (cells it may reach out over air from one that stands): her MATERIALS' spans, her fire branch's included. */
export const SPAN = { 1: 0, 2: 3, 3: 2, 4: 1, 5: 6, 6: 1, 7: 0, 8: 2 };

/** The faces a wall looks out of (a prop's or an opening's): n (-z), s (+z: the front, the street's side at yaw 0), w (-x), e (+x), up. */
export const FACE = { n: 0, s: 1, w: 2, e: 3, up: 4 };
export const FACE_DIR = [[0, 0, -1], [0, 0, 1], [-1, 0, 0], [1, 0, 0], [0, 1, 0]];

/** A small seeded stream (mulberry32, as hers): a blueprint's variation is its own and the same every visit. */
export function rng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export class Plan {
  constructor(w, h, d, seed = 1) {
    this.w = w; this.h = h; this.d = d; this.mat = new Uint8Array(w * h * d); this.role = new Uint8Array(w * h * d); this.props = [];
    this.r = rng(seed * 7919 + 13); this.tint = this.r();
  }
  /** A number in [a, b) or an integer in [a, b] (int), from the plan's own stream. */
  rand(a = 0, b = 1) { return a + this.r() * (b - a); }
  int(a, b) { return Math.floor(a + this.r() * (b - a + 1)); }
  pick(list) { return list[Math.floor(this.r() * list.length)]; }
  chance(p) { return this.r() < p; }
  idx(x, y, z) { return x + this.w * (z + this.d * y); }
  inside(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.h && z < this.d; }
  get(x, y, z) { return this.inside(x, y, z) ? this.mat[this.idx(x, y, z)] : 0; }
  roleAt(x, y, z) { return this.inside(x, y, z) ? this.role[this.idx(x, y, z)] : 0; }
  /** One cell: a role (and its material, or `mat`); role 0 empties it. */
  set(x, y, z, role, mat) {
    x = Math.round(x); y = Math.round(y); z = Math.round(z); if (!this.inside(x, y, z)) return;
    const i = this.idx(x, y, z); this.role[i] = role || 0; this.mat[i] = role ? (mat ?? ROLE_MAT[role]) : 0;
  }
  /** A box of cells, its corners inclusive. */
  fill(x0, y0, z0, x1, y1, z1, role, mat) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, z, role, mat);
  }
  clear(x0, y0, z0, x1, y1, z1) { this.fill(x0, y0, z0, x1, y1, z1, 0); }
  /** Re-role the cells that stand in a box (a band painted on a wall, a frame round a door), keeping their material unless `mat`. */
  paint(x0, y0, z0, x1, y1, z1, role, test = null, mat) {
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (!this.get(x, y, z) || (test && !test(x, y, z))) continue; const i = this.idx(x, y, z); this.role[i] = role; if (mat) this.mat[i] = mat;
    }
  }
  /** A hollow rectangle of walls t thick from y0 to y1 (its corners inclusive). */
  walls(x0, z0, x1, z1, y0, y1, role, t = 1) {
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (x - x0 < t || x1 - x < t || z - z0 < t || z1 - z < t) this.set(x, y, z, role);
    }
  }
  /** Inner floors (or a roof) of one layer over a box's inside. */
  slab(x0, z0, x1, z1, y, role = ROLE.floor) { this.fill(x0, y, z0, x1, y, z1, role); }
  /** Posts every `step` cells inside a box from y0 to y1 (what holds a wide floor up: a hypostyle hall, a portal's columns). */
  posts(x0, z0, x1, z1, y0, y1, step, role = ROLE.wood) {
    for (let z = z0; z <= z1; z += step) for (let x = x0; x <= x1; x += step) this.fill(x, y0, z, x, y1, z, role);
  }
  /** A layer of a round shape: the cells whose centres lie within r of (cx, cz), and further than r - t (t 0: a full disc). */
  ring(cx, cz, r, y, role, t = 0) {
    for (let z = Math.floor(cz - r - 1); z <= Math.ceil(cz + r + 1); z++) for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
      const d = Math.hypot(x - cx, z - cz); if (d <= r + 0.15 && (!t || d > r - t - 0.15)) this.set(x, y, z, role);
    }
  }
  /** A drum: rings from y0 to y1 (t 0: solid). `r` may be a function of the layer (a taper). */
  cyl(cx, cz, r, y0, y1, role, t = 0) { for (let y = y0; y <= y1; y++) this.ring(cx, cz, typeof r === 'function' ? r(y) : r, y, role, t); }
  /** A corbelled dome springing at y0: each course a ring drawn in over the last (a quarter ellipse of height r k), t thick, its last
   *  courses solid; a finial cell at the top. Returns the top layer. */
  dome(cx, cz, r, y0, role = ROLE.dome, { t = 2, k = 1, finial = 0 } = {}) {
    const H = Math.max(1, Math.round(r * k)); let top = y0;
    for (let j = 0; j <= H; j++) {
      const rr = r * Math.sqrt(Math.max(0, 1 - (j / (H + 0.6)) ** 2)), y = y0 + j;
      this.ring(cx, cz, Math.max(0.5, rr), y, role, rr < t + 1 ? 0 : t); top = y;
    }
    if (finial) { this.set(cx, top + 1, cz, finial); top++; }
    return top;
  }
  /** A wall cell's position on a box's face: the face's u-th cell from its left (seen from outside) at height y, and its inward step. */
  onFace(box, face, u) {
    const [x0, z0, x1, z1] = box;
    if (face === FACE.s) return { x: x0 + u, z: z1, ix: 0, iz: -1 };
    if (face === FACE.n) return { x: x1 - u, z: z0, ix: 0, iz: 1 };
    if (face === FACE.w) return { x: x0, z: z0 + u, ix: 1, iz: 0 };
    return { x: x1, z: z1 - u, ix: -1, iz: 0 };
  }
  /** An opening through a box's wall (t thick): w wide and h tall from its u-th cell at height y, a panel of `role` in its outer cell
   *  (0: open, dark), a lintel over it (timber, one cell each side) and, `arch`, its top corners left in (a stepped arch's shoulders). */
  opening(box, face, u, y, w, h, { role = 0, t = 1, lintel = ROLE.lintel, arch = false, frame = 0 } = {}) {
    const along = face === FACE.s || face === FACE.n ? 'x' : 'z';
    for (let k = 0; k < w; k++) for (let j = 0; j < h; j++) {
      if (arch && j === h - 1 && (k === 0 || k === w - 1) && w > 2) continue;
      const p = this.onFace(box, face, u + k);
      for (let s = 0; s < t; s++) this.set(p.x + p.ix * s, y + j, p.z + p.iz * s, s === 0 && role ? role : 0);
    }
    if (lintel) for (let k = -1; k <= w; k++) { const p = this.onFace(box, face, u + k); if (this.get(p.x, y + h, p.z)) this.set(p.x, y + h, p.z, lintel); }
    if (frame) for (let k = -1; k <= w; k++) for (let j = -1; j <= h; j++) {
      if (k >= 0 && k < w && j >= 0 && j < h) continue; const p = this.onFace(box, face, u + k);
      if (j < h && this.get(p.x, y + j, p.z) && this.roleAt(p.x, y + j, p.z) !== lintel) this.paint(p.x, y + j, p.z, p.x, y + j, p.z, frame);
    }
    void along;
  }
  /** A door: an opening with a painted panel (and its frame of trim); `prop` a ristra or a pot beside it. */
  door(box, face, u, y, w = 2, h = 3, o = {}) { this.opening(box, face, u, y, w, h, { role: ROLE.door, frame: ROLE.trim, ...o }); }
  /** A row of windows along a face at height y, every `every` cells from `from`, each w x h, open or shuttered. */
  windows(box, face, y, { from = 1, to, every = 3, w = 1, h = 1, role = 0, frame = 0, lintel = 0, t = 1, skip = 0 } = {}) {
    const len = face === FACE.s || face === FACE.n ? box[2] - box[0] + 1 : box[3] - box[1] + 1, end = to ?? len - 1 - w;
    for (let u = from; u <= end; u += every) { if (skip && this.chance(skip)) continue; this.opening(box, face, u, y, w, h, { role, frame, lintel, t }); }
  }
  /** Merlons on a box's top: every other cell of its outer ring at y raised (the kasbah's, a ksar's), stepped if `step`. */
  crenels(box, y, role = ROLE.crenel, { every = 2, step = 0 } = {}) {
    const [x0, z0, x1, z1] = box;
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || z === z0 || z === z1; if (!edge) continue;
      const u = x - x0 + z - z0; if (u % every) continue;
      this.set(x, y, z, role); if (step) this.set(x, y + 1, z, role);
    }
  }
  /** The cells of a box between y0 and y1 that face open air on a side (a wall's skin), re-roled for bands and reliefs: `pattern`
   *  (x, y, z) -> a role or 0 (left as it is). */
  skin(box, y0, y1, role, pattern = null) {
    const [x0, z0, x1, z1] = box;
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (!this.get(x, y, z)) continue;
      if (this.get(x - 1, y, z) && this.get(x + 1, y, z) && this.get(x, y, z - 1) && this.get(x, y, z + 1)) continue;
      const r = pattern ? pattern(x, y, z) : role; if (r) this.paint(x, y, z, x, y, z, r);
    }
  }
  /** A block of rooms: walls t thick from y0 to y1 + parapet, inner floors every `storey` layers, a roof at y1 over its inside, and
   *  cross walls every `bay` cells along its longer side (a doorway cut through each on every storey) so no floor reaches further
   *  than timber's span. Returns its inside box. */
  block(box, y0, y1, { role = ROLE.plaster, t = 1, storey = 0, roof = ROLE.roofEarth, parapet = 1, bay = 7, floor = ROLE.floor } = {}) {
    const [x0, z0, x1, z1] = box, ix0 = x0 + t, iz0 = z0 + t, ix1 = x1 - t, iz1 = z1 - t;
    this.walls(x0, z0, x1, z1, y0, y1 + parapet, role, t);
    if (ix1 < ix0 || iz1 < iz0) return [ix0, iz0, ix1, iz1];
    const alongX = ix1 - ix0 >= iz1 - iz0, short = alongX ? iz1 - iz0 + 1 : ix1 - ix0 + 1;
    if (short > 6) { // (both ways too wide for the roof: cross walls along the short side too)
      for (let z = iz0 + bay - 1; z < iz1 - 1; z += bay) this.cross(false, z, ix0, ix1, y0, y1, role, storey);
    }
    for (let a = (alongX ? ix0 : iz0) + bay - 1; a < (alongX ? ix1 : iz1) - 1; a += bay) this.cross(alongX, a, alongX ? iz0 : ix0, alongX ? iz1 : ix1, y0, y1, role, storey);
    if (storey) for (let y = y0 + storey; y < y1 - 1; y += storey) this.slab(ix0, iz0, ix1, iz1, y, floor);
    if (roof) this.slab(ix0, iz0, ix1, iz1, y1, roof);
    return [ix0, iz0, ix1, iz1];
  }
  /** A cross wall at x = a (alongX) or z = a, from b0 to b1, y0 to y1, a doorway through it each storey. */
  cross(alongX, a, b0, b1, y0, y1, role, storey) {
    for (let y = y0; y <= y1; y++) for (let b = b0; b <= b1; b++) this.set(alongX ? a : b, y, alongX ? b : a, role);
    const H = storey || y1 - y0;
    for (let y = y0; y < y1 - 1; y += Math.max(3, H)) {
      const at = this.int(b0, Math.max(b0, b1 - 1));
      for (let j = 0; j < Math.min(2, H - 1); j++) for (let k = 0; k < 2; k++) if (at + k <= b1) this.set(alongX ? a : at + k, y + (y === y0 ? 0 : 1) + j, alongX ? at + k : a, 0);
    }
  }
  /** A tower: walls t thick (two holds a taper) from y0 to y1, drawn in by `inset` cells from each layer in `steps` ([[y, inset]]),
   *  floors every `storey`, a roof at its top. Returns its top box. */
  tower(box, y0, y1, { role = ROLE.plaster, t = 2, steps = [], storey = 4, roof = ROLE.roofEarth, floor = ROLE.floor } = {}) {
    let b = box;
    for (let y = y0; y <= y1; y++) {
      let ins = 0; for (const [sy, s] of steps) if (y >= sy) ins = s;
      b = [box[0] + ins, box[1] + ins, box[2] - ins, box[3] - ins];
      this.walls(b[0], b[1], b[2], b[3], y, y, role, t);
      if ((storey && y > y0 && (y - y0) % storey === 0 && y < y1) || y === y1) this.slab(b[0] + t, b[1] + t, b[2] - t, b[3] - t, y, y === y1 ? roof : floor);
    }
    return b;
  }
  /** A prop hung from a cell (the dress draws it; it goes when that cell does): its kind, the host cell, the face it stands out of,
   *  and its own numbers (`len` a ladder's, `s` a scale, `c` a colour pick). */
  prop(kind, x, y, z, face = FACE.s, o = {}) { this.props.push({ kind, x, y, z, f: face, ...o }); }
  /** Vigas along a face's top: a beam end every `every` cells just under the roof (Taos, Santa Fe). */
  vigas(box, face, y, every = 2, from = 1) {
    const len = face === FACE.s || face === FACE.n ? box[2] - box[0] + 1 : box[3] - box[1] + 1;
    for (let u = from; u < len - 1; u += every) { const p = this.onFace(box, face, u); if (this.get(p.x, y, p.z)) this.prop('viga', p.x, y, p.z, face); }
  }

  /** The finished plan, settled by the support rule (what would fall at build is dropped: its count said), its props kept only on
   *  standing cells. */
  finish() {
    const dropped = settle(this);
    const props = this.props.filter((p) => this.get(p.x, p.y, p.z));
    return { w: this.w, h: this.h, d: this.d, mat: this.mat, role: this.role, props, tint: this.tint, dropped };
  }
}

/** Her collapse() rule run on a plan (a cell stands on a held cell under it, or reaches its span sideways along its layer from one
 *  that does): the cells it would let fall emptied, their count returned. */
export function settle(P) {
  const { w, h, d, mat } = P, held = new Uint8Array(mat.length), reach = new Uint8Array(mat.length);
  const I = (x, y, z) => x + w * (z + d * y);
  for (let y = 0; y < h; y++) {
    const q = [];
    for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) { const i = I(x, y, z); if (mat[i] && (y === 0 || held[I(x, y - 1, z)])) { held[i] = 1; q.push(i); } }
    for (let n = 0; n < q.length; n++) {
      const i = q[n], x = i % w, z = ((i - x) / w) % d;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Z = z + dz; if (X < 0 || Z < 0 || X >= w || Z >= d) continue; const j = I(X, y, Z);
        if (!mat[j] || held[j]) continue; const r = reach[i] + 1; if (r > (SPAN[mat[j]] ?? 0)) continue;
        held[j] = 1; reach[j] = r; q.push(j);
      }
    }
  }
  let n = 0; for (let i = 0; i < mat.length; i++) if (mat[i] && !held[i]) { mat[i] = 0; P.role[i] = 0; n++; }
  return n;
}
