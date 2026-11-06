// ---------------------------------------------------------------------------------------
// THE TOY CITY'S DESTRUCTION (docs/plans/MECHS.md 9.1; South, 2026-11-02: "a strong showcase of environmental destruction elements ... think
// incredible hulk's ultimate destruction for Ps2, or even the voxel carving mechanic we've already shown for fossils"). The proving ground's
// buildings are voxel volumes of 1 m cells, each cell a material with hits to break; a blow carves a shape out of them (a fist a ball, the
// assault boost a capsule along its path, the bell a cone, the beam a ray), and whatever the carving leaves with no path down to the ground
// through its neighbours comes away as a chunk and falls (the collapse). A chunk is a thing in the world: it falls, lands as an Impact blow
// on what it lands on (mass x the height it fell, the thrown hit's rule: progress/sandbox.js IMPACT), and breaks into rubble, or is
// picked up (techniques.js PROPS 'chunk'). Pure and seeded: the runtime meshes the cells and flies the chunks (world/hangar/city.js).
//
// The spirit slab's kernel at a mech's scale (progress/slabs.js: cells with hits, verbs as shapes, Fossil Fighters' and Minecraft's block
// hardness by stratum), with Red Faction Guerrilla's structural collapse (a piece with no support falls, whole) cut to its simplest honest
// rule: a cell stands on what is under it and reaches sideways only its material's span, steel's far, brick's two.
//
// Prior art: The Incredible Hulk: Ultimate Destruction (2005; every building breakable, chunks and posts as weapons, the city as the toy),
// Red Faction Guerrilla (supports and collapse), Rampage (a building that crumbles floor by floor), Teardown (voxels carved by shape, what is
// left unsupported falling whole), Spectrobes and Fossil Fighters (the carve by verb), Giant Clank's toy city, Minecraft (hardness by block).
//
//   MATERIALS[id] = { hp (full blows to break a cell), density (t a m³ of cell: a chunk's mass), span (cells a cell of it may bridge over air), look }
//   SOFT (fire.js's heated steel: half its span)   FURNISH[id]   GLASS   shatterGlass(b, at, r) -> [i]   SPLIT   splitChunk(chunk, fell) -> [chunk]
//   BUILDINGS[id] = { label, w, h, d, floors, shell, frame, glass } (and a row an adobe blueprint: { label, size, adobe: true, beam, whole: its mud burns too })
//   CITY = { cell, lots: [{ x, z, id, yaw, seed }] } (the adobe city's lots: adobe/lots.js)
//   newBuilding(id, seed) -> b { id, w, h, d, mat: Uint8Array, hp: Float32Array } (an adobe kind's from its blueprint, with role, props, tint)
//   at(b, x, y, z)   cellsLeft(b)   leavesBeam(id) (a felled building that leaves a beam to pick up: a steel frame's girder, a large adobe's viga)
//   carve(b, shape, k) -> { broke: [i], cracked: [i] }  (shape: { kind: 'ball'|'capsule'|'cone'|'ray', at, to?, r, dir?, angle? } in the building's cells)
//   footLeft(b) -> 0..1   FOOT   collapse(b) -> [{ cells: [[x,y,z]], mats, mass (t), at: [x,y,z] (its centre of mass, cells) }] (each cut loose; removed from b)
//   chunkMass(b, cells)   fallBlow(mass, height) -> k (a full blow's share on what it lands on)   SCORE (the ledger's counts)
// ---------------------------------------------------------------------------------------

/** What a building is made of. hp: full blows (a mech's fist at sync 0.5 lands about 0.6) to break one cell; density: t a cell (a 1 m
 *  cube; a building is mostly air inside, so a cell of wall is lighter than solid stone); span: how many cells it may reach out sideways
 *  from one that stands on something and still hold (a lintel's, a beam's cantilever: collapse()'s one allowance; steel's the long reach). */
export const MATERIALS = {
  0: null,
  1: { id: 'glass', hp: 0.15, density: 0.3, span: 0, look: 'glass' },     // windows: a fist's wind breaks them
  2: { id: 'timber', hp: 0.6, density: 0.4, span: 3, look: 'timber' },    // floors and roofs of the small houses
  3: { id: 'brick', hp: 1.2, density: 1.2, span: 2, look: 'brick' },      // the clay walls (Anagami's: fired brick)
  4: { id: 'stone', hp: 2.4, density: 2.2, span: 1, look: 'stone' },      // plinths, the tower's base
  5: { id: 'steel', hp: 4, density: 1.6, span: 6, look: 'steel' },        // the frame of the tall ones: what holds floors over a hole
  6: { id: 'paper', hp: 0.1, density: 0.1, span: 1, look: 'paper' },      // a lantern stall's walls: oiled paper on a timber frame (fire's fodder)
  7: { id: 'furnishing', hp: 0.3, density: 0.3, span: 0, look: 'furnishing' }, // what is in the rooms: shelves, beds, crates; a carved facade shows them, and they burn
  8: { id: 'adobe', hp: 1.0, density: 1.4, span: 2, look: 'adobe' },      // the adobe city's walls: sun-dried mud brick under plaster, softer than fired brick (a fist takes a room a blow sooner) and heavier (thick earthen walls: its chunks land harder); a brick's span (the blueprints stand on it: Calissa's guess, ruled)
};
export const MAT = { glass: 1, timber: 2, brick: 3, stone: 4, steel: 5, paper: 6, furnishing: 7, adobe: 8 };
/** A steel cell heated through (fire.js STATE.soft) holds half its span and half its hits: the frame sags under a fire. */
export const SOFT = 3;
const spanAt = (b, i) => { const s = MATERIALS[b.mat[i]].span; return b.fire && b.fire.state[i] === SOFT ? Math.floor(s / 2) : s; };

/** The building kinds (cells; a cell 1 m, the mech 14 m tall): a wall material, a frame (columns at the corners and every `bay` cells,
 *  floors every `floor` cells), windows in the walls. Sized so a fist takes a room, the charge goes through a house and stops in a tower. */
export const BUILDINGS = {
  house:  { label: 'House', w: 8, h: 7, d: 8, floor: 3, bay: 0, shell: MAT.brick, frame: MAT.timber, glass: 0.25 },
  shop:   { label: 'Shop row', w: 18, h: 8, d: 8, floor: 4, bay: 6, shell: MAT.brick, frame: MAT.timber, glass: 0.45 },
  block:  { label: 'Block', w: 12, h: 20, d: 12, floor: 4, bay: 4, shell: MAT.brick, frame: MAT.steel, glass: 0.35 },
  tower:  { label: 'Tower', w: 10, h: 34, d: 10, floor: 4, bay: 3, shell: MAT.glass, frame: MAT.steel, glass: 0, base: { h: 4, mat: MAT.stone } },
  kiln:   { label: 'Bottle kiln', w: 10, h: 16, d: 10, floor: 0, bay: 0, shell: MAT.brick, frame: 0, glass: 0, round: true }, // (a bottle kiln: a round brick shell, nothing inside to hold it once its foot goes)
  stall:  { label: 'Lantern stall', w: 6, h: 5, d: 6, floor: 0, bay: 5, shell: MAT.paper, frame: MAT.timber, glass: 0 }, // (a matsuri stall: paper walls on four timber posts under a timber roof; what fire takes first)
  // and a row an adobe blueprint (adobe/blueprints.js): its cells drawn by the blueprint, its shell adobe, its frame timber; a large one leaves a viga
  ...Object.fromEntries(ADOBE_IDS.map((id) => { const K = ADOBE[id]; return [id, { label: K.label, w: K.w, d: K.d, floor: 0, bay: 0, shell: MAT.adobe, frame: MAT.timber, glass: 0, size: K.size, adobe: true, beam: K.size === 'large', whole: !!K.whole }]; })),
};
/** A felled building leaves a beam on its street side to pick up (props.js 'girder'): a steel frame's girder, a large adobe's cedar viga
 *  (Djenne's, the kasbah's: the roof beams that outlast the mud). */
export const leavesBeam = (id) => { const B = BUILDINGS[id]; return !!B && (B.frame === MAT.steel || !!B.beam); };
/** What fills a building's rooms (`furnish`: the share of a room's floor-level cells, MAT.furnishing): a lived-in house the most, an
 *  office tower the least; a kiln none. A carved facade shows them (Ultimate Destruction's interiors), and they are a fire's fuel inside
 *  brick (fire.js), so a brick house burns from within. */
export const FURNISH = { house: 0.12, shop: 0.14, block: 0.06, tower: 0.04, kiln: 0, stall: 0.18 }; // (an adobe kind's rooms are drawn by its blueprint: its goods)

/** The proving ground's lots (metres from the yard's middle, PROVING.at): since 2026-11-03 the adobe city (South: "Those buildings are
 *  still very placeholder"; Calissa's 101 lots, adobe/lots.js: 9 large, 32 medium, 60 small either side of the street from the launch
 *  past the straw giant, the lanes and the yards kept clear). The first kinds (house .. stall) stay as rows for the simulator and a lot
 *  laid by hand; their 19 lots went with the change. */
export const CITY = { cell: 1, lots: ADOBE_LOTS };

/** The ledger's destruction counts are cells (mech.destroy.cells) and chunks (mech.destroy.chunks); a building is felled when fewer than
 *  `felled` of its cells stand (mech.destroy.buildings), toppled in one blow when one blow's collapse took `topple` of what stood. */
export const SCORE = { felled: 0.25, topple: 0.5 };
/** A building's foot (its cells under `footOf`, the ground floor or 3 cells) gives way whole once fewer than `foundation` of its first
 *  cells stand (it has lost 3 in 10): everything over it comes down at once (Ultimate Destruction's and Rampage's: a building has an integrity, and past it the
 *  whole thing goes, not a cell at a time). */
export const FOOT = { foundation: 0.7, min: 3 };
const footOf = (b) => Math.max(FOOT.min, BUILDINGS[b.id]?.floor || 0);

const idx = (b, x, y, z) => x + b.w * (z + b.d * y);
const inside = (b, x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < b.w && y < b.h && z < b.d;
export const at = (b, x, y, z) => (inside(b, x, y, z) ? b.mat[idx(b, x, y, z)] : 0);
export const cellsLeft = (b) => { let n = 0; for (let i = 0; i < b.mat.length; i++) if (b.mat[i]) n++; return n; };
import { ADOBE, ADOBE_IDS, adobePlan } from './adobe/blueprints.js';
import { ADOBE_LOTS } from './adobe/lots.js';

const xyz = (b, i) => { const x = i % b.w, r = (i - x) / b.w, z = r % b.d; return [x, (r - z) / b.d, z]; };

/** A small seeded stream (mulberry32): a building's windows are its own and the same every visit. */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** A building's cells: its shell on the outside (windows punched in it), its frame's columns and floors inside, the rest air. */
export function newBuilding(id, seed = 1) {
  const B = BUILDINGS[id]; if (!B) return null;
  if (B.adobe) { const b = fromPlan(id, adobePlan(id, seed)); if (b && B.whole) b.whole = true; return b; }
  const b = { id, w: B.w, h: B.h, d: B.d, mat: new Uint8Array(B.w * B.h * B.d), hp: new Float32Array(B.w * B.h * B.d), start: 0 };
  const r = rng(seed), cx = (B.w - 1) / 2, cz = (B.d - 1) / 2, R = Math.min(B.w, B.d) / 2;
  for (let y = 0; y < B.h; y++) for (let z = 0; z < B.d; z++) for (let x = 0; x < B.w; x++) {
    let m = 0;
    const edge = x === 0 || z === 0 || x === B.w - 1 || z === B.d - 1;
    if (B.round) { const d = Math.hypot(x - cx, z - cz), taper = R * (y < B.h * 0.6 ? 1 : 1 - 0.6 * (y - B.h * 0.6) / (B.h * 0.4)); m = d <= taper && d > taper - 1.2 ? B.shell : 0; } // (a bottle kiln: a round shell drawn in at the neck)
    else if (B.base && y < B.base.h) m = B.base.mat;
    else if (edge) m = B.glass && y % Math.max(1, B.floor) !== 0 && r() < B.glass ? MAT.glass : B.shell;
    if (!m && B.frame && !B.round) {
      const col = B.bay && (x % B.bay === 0 || x === B.w - 1) && (z % B.bay === 0 || z === B.d - 1);
      if (col || (B.floor && y > 0 && y % B.floor === 0)) m = B.frame;
    }
    if (y === B.h - 1 && !B.round && !m) m = B.frame || B.shell; // (the roof)
    if (!m && !edge && !B.round && (FURNISH[id] || 0) > 0 && (y === 0 || (B.floor && y % B.floor === 1)) && r() < FURNISH[id]) m = MAT.furnishing; // (the rooms: on the ground floor and on each floor's cells)
    const i = idx(b, x, y, z); b.mat[i] = m; b.hp[i] = m ? MATERIALS[m].hp : 0;
  }
  b.start = cellsLeft(b); b.foot0 = footCells(b); b.fallen = false;
  return b;
}

/** A building of an adobe blueprint's plan: its cells and their materials as drawn (the blueprint's own settle already stood every cell on
 *  this rule), each cell its material's hits, counted as a drawn building is; its look roles, props and tint kept for the dress. */
function fromPlan(id, p) {
  if (!p) return null;
  const n = p.mat.length, b = { id, w: p.w, h: p.h, d: p.d, mat: p.mat instanceof Uint8Array ? p.mat : Uint8Array.from(p.mat), hp: new Float32Array(n), start: 0, role: p.role, props: p.props, tint: p.tint, dropped: p.dropped };
  for (let i = 0; i < n; i++) if (b.mat[i]) b.hp[i] = MATERIALS[b.mat[i]]?.hp ?? 1;
  b.start = cellsLeft(b); b.foot0 = footCells(b); b.fallen = false;
  return b;
}

/** How much of a blow reaches a cell at distance d from the shape's heart out to r: all of it inside half, falling to a quarter at r. */
const falloff = (d, r) => (d <= r * 0.5 ? 1 : d > r ? 0 : 1 - 0.75 * (d - r * 0.5) / (r * 0.5));

const footCells = (b) => { let n = 0; const H = footOf(b); for (let y = 0; y < Math.min(H, b.h); y++) for (let z = 0; z < b.d; z++) for (let x = 0; x < b.w; x++) if (b.mat[idx(b, x, y, z)]) n++; return n; };
/** How much of a building's foot still stands (1 whole); under FOOT.foundation the rest comes down (collapse). */
export const footLeft = (b) => (b.foot0 ? footCells(b) / b.foot0 : 1);

/** One blow carved out of a building: each cell the shape reaches loses k x falloff of its hits; at none it breaks. `shape` is in the
 *  building's own cells (the runtime puts the world point into them). ball: a fist, a pound; capsule: the charge's path `at` to `to`;
 *  cone: the bell's toll and the clap from `at` along `dir` within `angle`; ray: the beam along `dir`, r thick, through everything. */
export function carve(b, shape, k) {
  const { kind, at: p, r = 2 } = shape, broke = [], cracked = [];
  const reachOf = (x, y, z) => {
    const dx = x - p[0], dy = y - p[1], dz = z - p[2];
    if (kind === 'ball') return Math.hypot(dx, dy, dz);
    if (kind === 'capsule' || kind === 'ray') {
      const q = kind === 'ray' ? [p[0] + shape.dir[0] * 200, p[1] + shape.dir[1] * 200, p[2] + shape.dir[2] * 200] : shape.to;
      const vx = q[0] - p[0], vy = q[1] - p[1], vz = q[2] - p[2], L2 = vx * vx + vy * vy + vz * vz || 1, t = Math.max(0, Math.min(1, (dx * vx + dy * vy + dz * vz) / L2));
      return Math.hypot(dx - vx * t, dy - vy * t, dz - vz * t);
    }
    if (kind === 'cone') { const d = Math.hypot(dx, dy, dz), c = d ? (dx * shape.dir[0] + dy * shape.dir[1] + dz * shape.dir[2]) / d : 1; return c >= Math.cos(shape.angle ?? 0.6) ? d * 0.25 : Infinity; } // (a cone reaches its length: r is its length here, its falloff a quarter as steep)
    return Infinity;
  };
  const span = kind === 'ray' || kind === 'cone' ? Math.max(b.w, b.h, b.d) : r + 1;
  const lo = (v, n) => Math.max(0, Math.floor(v - span)), hi = (v, n) => Math.min(n - 1, Math.ceil(v + span));
  const [x0, x1, y0, y1, z0, z1] = kind === 'ray' || kind === 'cone' ? [0, b.w - 1, 0, b.h - 1, 0, b.d - 1] : [lo(p[0]), hi(p[0], b.w), lo(p[1]), hi(p[1], b.h), lo(p[2]), hi(p[2], b.d)];
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const i = idx(b, x, y, z); if (!b.mat[i]) continue;
    const f = falloff(reachOf(x, y, z), r); if (!f) continue;
    b.hp[i] -= k * f;
    if (b.hp[i] <= 0) { b.mat[i] = 0; b.hp[i] = 0; broke.push(i); } else cracked.push(i);
  }
  return { broke, cracked };
}

/** What holds a cell up, layer by layer from the ground: a cell stands on a held cell under it; a cell with nothing under it may hang off a
 *  held neighbour beside it (four ways, along its own layer) only as far as its material's span, counted in cells from one that stands on
 *  something (a lintel over a door, a steel beam over a hole); nothing hangs from above. So a hole knocked in a wall's foot brings down the
 *  wall over it once it is wider than twice the brick's span, and a cut right through a ground floor brings down everything over it. */
export function collapse(b) {
  const held = new Uint8Array(b.mat.length), reach = new Uint8Array(b.mat.length), N = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const H = footOf(b), gone = !b.fallen && footLeft(b) < FOOT.foundation; if (gone) b.fallen = true; // (the foot given way: nothing over it is held)
  for (let y = 0; y < (gone || b.fallen ? Math.min(H, b.h) : b.h); y++) {
    const q = [];
    for (let z = 0; z < b.d; z++) for (let x = 0; x < b.w; x++) {
      const i = idx(b, x, y, z); if (!b.mat[i]) continue;
      if (y === 0 || held[idx(b, x, y - 1, z)]) { held[i] = 1; reach[i] = 0; q.push(i); } // (it stands: on the ground, or on a held cell)
    }
    while (q.length) { // (then along the layer, each step one cell further out over air, no further than the entered cell's span)
      const i = q.shift(), [x, y2, z] = xyz(b, i);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!inside(b, x + dx, y2, z + dz)) continue; const j = idx(b, x + dx, y2, z + dz); if (!b.mat[j] || held[j]) continue;
        const r = reach[i] + 1; if (r > spanAt(b, j)) continue;
        held[j] = 1; reach[j] = r; q.push(j);
      }
    }
  }
  // what is left unheld comes away in connected pieces, each a chunk
  const seen = new Uint8Array(b.mat.length), chunks = [];
  for (let i = 0; i < b.mat.length; i++) {
    if (!b.mat[i] || held[i] || seen[i]) continue;
    const cells = [], st = [i]; seen[i] = 1;
    while (st.length) { const c = st.pop(); cells.push(c); const [x, y, z] = xyz(b, c);
      for (const [dx, dy, dz] of N) { if (!inside(b, x + dx, y + dy, z + dz)) continue; const j = idx(b, x + dx, y + dy, z + dz); if (b.mat[j] && !held[j] && !seen[j]) { seen[j] = 1; st.push(j); } } }
    let sx = 0, sy = 0, sz = 0, m = 0; const mats = new Uint8Array(cells.length);
    cells.forEach((c, n) => { const w = MATERIALS[b.mat[c]].density, [x, y, z] = xyz(b, c); sx += x * w; sy += y * w; sz += z * w; m += w; mats[n] = b.mat[c]; });
    chunks.push({ cells: cells.map((c) => xyz(b, c)), mats, mass: +m.toFixed(1), at: [sx / m, sy / m, sz / m] });
    for (const c of cells) { b.mat[c] = 0; b.hp[c] = 0; }
  }
  return chunks;
}

/** A chunk's mass (t) from its cells. */
export const chunkMass = (mats) => { let m = 0; for (const v of mats) m += MATERIALS[v]?.density || 0; return m; };

/** A falling chunk landing on a creature or a mech: its energy m g h (kJ) as a share of a full blow, by the thrown hit's scale (a full blow
 *  is a 14 m mech's fist at its boost top: about 900 kJ, frame.js P0): a house's roof (20 t from 7 m, 1.4 MJ) a blow and a half, capped at 3
 *  (a tower's top on a giant: what fells it). */
export const fallBlow = (mass, height) => Math.min(3, (mass * 9.81 * Math.max(0, height)) / 900);

/** A steel-framed building's glass goes with a blow (Red Faction's, Ultimate Destruction's showering towers): every glass cell within
 *  `GLASS.shatter` cells of the blow's reach breaks with it. Returns the broken indices (the runtime throws them as a shower). */
export const GLASS = { shatter: 4 };
export function shatterGlass(b, at, r) {
  const B = BUILDINGS[b.id], out = []; if (!B || B.frame !== MAT.steel) return out;
  const R = r + GLASS.shatter, x0 = Math.max(0, Math.floor(at[0] - R)), x1 = Math.min(b.w - 1, Math.ceil(at[0] + R)), y0 = Math.max(0, Math.floor(at[1] - R)), y1 = Math.min(b.h - 1, Math.ceil(at[1] + R)), z0 = Math.max(0, Math.floor(at[2] - R)), z1 = Math.min(b.d - 1, Math.ceil(at[2] + R));
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const i = idx(b, x, y, z); if (b.mat[i] !== MAT.glass || Math.hypot(x - at[0], y - at[1], z - at[2]) > R) continue;
    b.mat[i] = 0; b.hp[i] = 0; out.push(i);
  }
  return out;
}

/** A chunk landing hard splits (Ultimate Destruction's slabs breaking in two, Teardown's): one that fell `SPLIT.fall` m or more and has
 *  `SPLIT.min` cells or more is cut across its longest axis into up to `SPLIT.pieces` slabs, each its own mass and centre, so a wall that
 *  came down leaves pieces to pick up (the ones of PROPS' slab mass are kept: city.js CHUNK.keep). */
export const SPLIT = { fall: 8, min: 24, pieces: 3 };
export function splitChunk(c, fell) {
  if (fell < SPLIT.fall || c.cells.length < SPLIT.min) return [c];
  const ext = [0, 1, 2].map((a) => { let lo = Infinity, hi = -Infinity; for (const p of c.cells) { lo = Math.min(lo, p[a]); hi = Math.max(hi, p[a]); } return [lo, hi]; });
  const ax = [0, 1, 2].reduce((m, a) => (ext[a][1] - ext[a][0] > ext[m][1] - ext[m][0] ? a : m), 0), [lo, hi] = ext[ax], n = Math.min(SPLIT.pieces, hi - lo + 1);
  if (n < 2) return [c];
  const parts = Array.from({ length: n }, () => ({ cells: [], mats: [] }));
  c.cells.forEach((p, k) => { const j = Math.min(n - 1, Math.floor(((p[ax] - lo) / (hi - lo + 1)) * n)); parts[j].cells.push(p); parts[j].mats.push(c.mats[k]); });
  return parts.filter((q) => q.cells.length).map((q) => {
    let sx = 0, sy = 0, sz = 0, m = 0; q.cells.forEach((p, k) => { const w = MATERIALS[q.mats[k]].density; sx += p[0] * w; sy += p[1] * w; sz += p[2] * w; m += w; });
    return { cells: q.cells, mats: Uint8Array.from(q.mats), mass: +m.toFixed(1), at: [sx / m, sy / m, sz / m] };
  });
}

/** Is a building felled (fewer than SCORE.felled of its cells stand)? */
export const felled = (b) => cellsLeft(b) < b.start * SCORE.felled;
