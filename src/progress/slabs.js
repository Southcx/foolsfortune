// ---------------------------------------------------------------------------------------
// SLABS: carving a captured plate free to summon its spirit (South, 2026-10-30, by Calissa: "the voxel destruction fossil carving section
// from Spectrobe Origins ... as part of our spirit summoning mechanic from captured plates"; docs/plans/SEEDS-SLABS-SCANS.md section 2).
// A plate (a Veritome photograph of a creature) condenses into a SLAB: a block of the island's layered stone with the creature set inside
// it in Lachrymite (the FOSSIL). Carving it free at the bench summons the spirit; how cleanly decides what it comes out with. Every tool
// is a carving verb, so the slab teaches the kit without saying so (the law: the mechanic is the lesson). The slab sets again after
// secondsOf(stars) real seconds (the Lachrymite hardening): what is bared then is the dig.
// The score is Fossil Fighters' two meters: the share of the stone round the fossil cleared (BARED) against the share of the fossil
// cracked (CRACKED). It sets the spirit's starting bond and a share of every stat; a flawless dig (all bared, nothing cracked) gives the
// rare look and counts toward the bone seed (progress/seeds.js).
// This module is the kernel: a slab's cells and what each verb does to them, pure and seeded; the bench, its voxels and the tools'
// bodies are Petra's (the god hand's voxels mesh it: godhand/voxels.js), the look Calissa's.
//
// Prior art: Spectrobes (DS, 2007) and Spectrobes: Origins (Wii, 2009): excavation with drill and blower, the fossil's silhouette and the
// timer; Fossil Fighters (DS, 2008): hammer and drill, the X-ray, the damage meter and cleaning score deciding the creature's strength;
// Pokemon Diamond's Underground (the wall that gives way, the hammer's crack against the pick's); Minecraft's block hardness by stratum.
//
//   SLAB   secondsOf(stars)   STRATA   VERBS[verb] = { tool, line, dmg, reach | radius | layer, only?, cracks, secs }   newSlab({ kind, stars, seed }) -> slab
//   carve(slab, verb, cell, dir?) -> { broke, cracked, revealed }   (one use of a verb; the slab changes in place)   exposed(slab, x, y, z)
//   scoreOf(slab) -> { bared, cracked, score, flawless }            spiritOf(score, stars) -> { cls, bond, statShare, rare }
//   slab: { w, h, d, cells: Int8Array (stone hp, 0 cleared, -1 bone), bone: Int8Array (bone integrity), near: [i], tolls, seen, t }
// ---------------------------------------------------------------------------------------

/** The slab: its size in cells (a cell 5 cm: a slab half a metre wide, a creature the size of a cat in it), the real seconds before it
 *  sets (`seconds` and `perStar` more a plate's star: a careful dig with the silhouette takes about two thirds of it, scripts/
 *  gardengrowth.mjs, so a flawless one is a skill, never a race against the impossible), the tolls of the Crucibelle a slab allows (each
 *  a look through the stone), a bone cell's integrity (two cracks break it), the bared share a flawless dig needs. */
export const SLAB = { w: 10, h: 7, d: 5, seconds: 90, perStar: 30, tolls: 3, integrity: 2, flawless: 0.97 };
export const secondsOf = (stars = 1) => SLAB.seconds + SLAB.perStar * Math.max(1, stars);
/** The layers from the top (hp: hits to clear a cell): the island's own, Anagami's clay over sand over sandstone. A plate of more stars
 *  is a deeper, harder slab (its creature rarer). */
export const STRATA = [{ id: 'loose', hp: 1 }, { id: 'firm', hp: 2 }, { id: 'hard', hp: 3 }];

/** What each tool does to the slab: `dmg` to each cell it reaches (`reach` behind the one struck, a `radius`, a whole `layer`), `only`
 *  the hardest stone it can clear, `cracks` whether it cracks the fossil it reaches, `secs` real seconds a use (the check's clock). */
export const VERBS = {
  brush:     { tool: 'soulbrush', line: 'Brushes loose stone away. Slow, never cracks.', reach: 0, dmg: 1, only: 1, cracks: false, secs: 0.35 },
  pick:      { tool: 'dreamvane', line: 'Chips a cell and the one behind it. Fast; cracks the fossil if it reaches it.', reach: 1, dmg: 2, cracks: true, secs: 0.5 },
  blast:     { tool: 'psygun', line: 'Blasts a round patch of crust. Quick and wide; cracks any fossil in it.', radius: 1.8, dmg: 1, cracks: true, secs: 0.8 },
  slice:     { tool: 'sondelass', line: 'Slices one layer off flat across the slab; cracks the fossil where the layer crosses it.', layer: true, dmg: 1, cracks: true, secs: 1.5 },
  hoover:    { tool: 'lockheart', line: 'Draws out loose stone round a cell. Never cracks.', radius: 1.2, dmg: 1, only: 1, cracks: false, secs: 0.6 },
  toll:      { tool: 'crucibelle', line: 'The fossil\'s outline rings through the stone for a moment. Three a slab.', reveal: 1.5, secs: 1.2 },
  silhouette: { tool: 'veritome', line: 'Holds the plate to the slab: the creature\'s shape drawn faintly on its face to aim by.', ghost: true, secs: 1 },
};

function rng(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** A new slab from a plate: its strata by depth (more stars, harder sooner), and the fossil inside: a spine, a head and four limbs drawn
 *  as lines of cells from a seed of its kind, so the same kind always lies the same way (a kind's skeleton). */
export function newSlab({ kind = 'spirit', stars = 1, seed = 0 } = {}) {
  const { w, h, d } = SLAB, n = w * h * d, cells = new Int8Array(n), bone = new Int8Array(n), r = rng(hashStr(kind) ^ seed);
  const I = (x, y, z) => x + w * (y + h * z);
  const firm = Math.max(1, 3 - stars), hard = Math.max(firm + 1, 6 - stars); // (rows from the top where firm and hard begin)
  for (let z = 0; z < d; z++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cells[I(x, y, z)] = STRATA[y < firm ? 0 : y < hard ? 1 : 2].hp;
  // (the fossil: a spine along x at a depth of 3 to 4 rows, a head at one end, four limbs down and back; never touching the faces)
  const put = (x, y, z) => { x = Math.round(x); y = Math.round(y); z = Math.round(z); if (x < 1 || y < 1 || z < 1 || x > w - 2 || y > h - 2 || z > d - 2) return; const i = I(x, y, z); cells[i] = -1; bone[i] = SLAB.integrity; };
  const y0 = 3 + Math.floor(r() * 2), z0 = Math.floor(d / 2), bend = (r() - 0.5) * 0.4;
  for (let x = 2; x <= w - 3; x++) put(x, y0 + Math.round(bend * (x - w / 2)), z0);
  const hx = r() < 0.5 ? 2 : w - 3; put(hx, y0 - 1, z0); put(hx, y0, z0 - 1); put(hx, y0, z0 + 1);
  for (const lx of [4, w - 5]) for (const s of [-1, 1]) { put(lx, y0 + 1, z0 + s); put(lx + (r() < 0.5 ? -1 : 1), y0 + 2, z0 + s); }
  const near = []; // (the stone cells over and beside the fossil: what "bared" is measured over; it lifts off its bed, so not those under it)
  for (let z = 0; z < d; z++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = I(x, y, z); if (cells[i] < 0) continue;
    if ([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1]].some(([a, b, c]) => { const X = x + a, Y = y + b, Z = z + c; return X >= 0 && Z >= 0 && X < w && Y < h && Z < d && cells[I(X, Y, Z)] < 0; })) near.push(i);
  }
  return { kind, stars, w, h, d, cells, bone, near, tolls: SLAB.tolls, seen: false, t: 0, cracks: 0, uses: 0 };
}

const idx = (S, x, y, z) => (x < 0 || y < 0 || z < 0 || x >= S.w || y >= S.h || z >= S.d ? -1 : x + S.w * (y + S.h * z));
/** Can a cell be struck: stone open to the air (the top face or a side, or beside a cleared cell; the bed beneath is not open). */
export function exposed(S, x, y, z) {
  const i = idx(S, x, y, z); if (i < 0 || S.cells[i] <= 0) return false;
  if (y === 0 || x === 0 || z === 0 || x === S.w - 1 || z === S.d - 1) return true;
  for (const [a, b, c] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { const j = idx(S, x + a, y + b, z + c); if (j >= 0 && S.cells[j] === 0) return true; }
  return false;
}
/** One use of a verb at a cell ({ x, y, z }), `dir` the way in (default down, from the top face). The cell struck must be open to the
 *  air (`exposed`): a verb at buried stone does nothing but spend its time. The slab changes in place. */
export function carve(S, verb, at, dir = { x: 0, y: 1, z: 0 }) {
  const V = VERBS[verb], out = { broke: 0, cracked: 0, revealed: 0 }; if (!V) return out; S.uses++; S.t += V.secs || 0;
  if (V.reveal) { if (S.tolls > 0) { S.tolls--; out.revealed = V.reveal; } return out; }
  if (V.ghost) { S.seen = true; return out; }
  if (!V.layer && !exposed(S, at.x, at.y, at.z) && S.cells[idx(S, at.x, at.y, at.z)] >= 0) return out;
  const targets = [];
  if (V.layer) { for (let z = 0; z < S.d; z++) for (let x = 0; x < S.w; x++) targets.push(idx(S, x, at.y, z)); }
  else if (V.radius) { const R = Math.ceil(V.radius); for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) for (let c = -R; c <= R; c++) if (a * a + b * b + c * c <= V.radius * V.radius) targets.push(idx(S, at.x + a, at.y + b, at.z + c)); }
  else { for (let k = 0; k <= (V.reach || 0); k++) targets.push(idx(S, at.x + dir.x * k, at.y + dir.y * k, at.z + dir.z * k)); }
  for (const i of targets) {
    if (i < 0) continue;
    const c = S.cells[i];
    if (c < 0) { if (V.cracks && S.bone[i] > 0) { S.bone[i]--; S.cracks++; out.cracked++; } continue; }
    if (c === 0 || (V.only && c > V.only)) continue;
    S.cells[i] = Math.max(0, c - V.dmg); if (S.cells[i] === 0) out.broke++;
  }
  return out;
}

/** The dig's score: the stone touching the fossil cleared (bared) against the fossil's integrity lost (cracked); score is bared less
 *  twice the cracked, so a careless pick costs more than it saves (Fossil Fighters' damage meter). */
export function scoreOf(S) {
  const bared = S.near.length ? S.near.filter((i) => S.cells[i] === 0).length / S.near.length : 0;
  let bones = 0; for (let i = 0; i < S.cells.length; i++) if (S.cells[i] < 0) bones++;
  const cracked = bones ? S.cracks / (bones * SLAB.integrity) : 0;
  const score = Math.max(0, Math.min(1, bared - 2 * cracked));
  return { bared: +bared.toFixed(3), cracked: +cracked.toFixed(3), score: +score.toFixed(3), flawless: bared >= SLAB.flawless && S.cracks === 0, t: +S.t.toFixed(1) };
}
/** What the spirit comes out with: its class from the plate's stars as before (awaken.js), a starting bond (a flawless dig 30: trust,
 *  so its first wish comes at once, GARDEN-COZY.md C2), a share of its stats' start (statShare x 100 each, Monster Rancher's disc
 *  stats), and the rare look on a flawless dig (the shiny's inversion, Calissa's). A dig of nothing (score 0) still summons it: grind
 *  closes the gap. */
export const spiritOf = ({ score = 0, flawless = false } = {}, stars = 1) => ({
  cls: Math.min(4, Math.max(0, stars - 1)), bond: Math.round(30 * score), statShare: +score.toFixed(2), rare: !!flawless,
});
