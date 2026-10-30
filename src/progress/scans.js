// ---------------------------------------------------------------------------------------
// SCANS: any real barcode or QR code read into the game (South, 2026-10-30, by Calissa: "use the phone camera and bar codes/QR codes as
// a vehicle for disseminating items/Figments like a modern version of Skannerz or Monster Rancher with their CDs"; docs/plans/
// SEEDS-SLABS-SCANS.md section 3). A code is hashed; the hash picks what it holds, so THE SAME CODE GIVES EVERYONE THE SAME THING (a
// cereal box is a shared secret, as Monster Rancher's discs were). Most codes hold a slab (progress/slabs.js: a creature to carve free),
// some a material. A slab of a kind you have never photographed comes SEALED: kept, uncarvable, until you meet one in the world (the
// code points you at the world, never past it). The game's own codes (a made track's FF2-, a spirit's FFS-) are read as what they are,
// never hashed. Only the hash is kept (to know a code was scanned), never the code, and camera frames never leave the device.
// A few a game day (SCAN.perDay): a supermarket aisle must never replace the world. A code scanned again gives a minute of play in cubes
// once, then nothing (Skannerz' duplicates).
// The camera, the decoder and the typed digits on the desk are Petra's; the scan's moment Calissa's; the words Espada's.
//
// Prior art: Monster Rancher (PS1, 1997: any CD's table of contents seeds a monster, the same disc the same monster), Skannerz (Radica,
// 2000: real UPCs as monsters and items, by tribe), Barcode Battler (Epoch, 1991), Pokemon's QR scanner in Sun and Moon (a few a day),
// Yo-kai Watch's QR medals.
//
//   SCAN   ROSTER   photoKindOf(kind)   readCode(text) -> { own?, digits, hash }    holdOf(hash, roster) -> { what: 'slab' | 'material', kind, feeling, cls, grain | tier }
//   scanResult(text, { seen: Set<hash>, today: n, met: Set<kind>, roster }) -> { ok, why?, hold?, sealed?, cubes?, hash }
// ---------------------------------------------------------------------------------------
import { KIND_IDS } from './econ/materials.js';
import { ECON } from './econ/table.js';

/** `perDay`: new codes a game day (Pokemon Sun's scanner, a handful). `again`: minutes of play in cubes the first repeat gives.
 *  `material`: the share of codes that hold a material (Skannerz' items). `cls`: the odds of a slab's class 0..4 (common to rare, each
 *  about half the one before, so a class-4 code is a find worth sharing). */
export const SCAN = { perDay: 3, again: 1, material: 0.25, cls: [0.5, 0.25, 0.13, 0.08, 0.04] };
/** The creatures a code may hold, and a plate may become a slab of (world/garden/awaken.js plates): only kinds a photo can carry,
 *  so a sealed slab can always be opened by meeting its kind. Glint and lobber are garden visitors that settle on their own, never in the
 *  world to photograph (Petra, v607c676), so a code holding one would stay sealed for good. The Lantern Wisp waits on a garden body. */
export const ROSTER = ['slipjelly', 'clapperjar', 'spirit'];
/** The Veritome's Book keys a photo by the creature's own code kind (tools/veritome/bestiary.js creatureOf: 'clapper'), the garden by the
 *  glossary's word ('clapperjar'): one kind, two spellings. `photoKindOf` turns the garden's into the Book's, so a clapperjar met is met. */
export const PHOTO_KIND = { clapperjar: 'clapper' };
export const photoKindOf = (kind) => PHOTO_KIND[kind] || kind;
const FEELINGS = ['wonder', 'mirth', 'desire', 'fury', 'gall', 'grief', 'dread'];

/** The game's own codes, read as what they are. */
const OWN = [{ prefix: 'FF2-', what: 'track' }, { prefix: 'FFS-', what: 'spirit' }];
/** A code's text, normalised (a barcode's digits; a QR's text trimmed), and its hash (FNV-1a, then mixed: stable across machines). */
export function readCode(text = '') {
  const t = String(text).trim(); const own = OWN.find((o) => t.toUpperCase().startsWith(o.prefix));
  if (own) return { own: own.what, digits: t, hash: null };
  const digits = /^[\d\s-]+$/.test(t) ? t.replace(/\D/g, '') : t;
  let h = 2166136261; for (let i = 0; i < digits.length; i++) { h ^= digits.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d); h ^= h >>> 15; h = Math.imul(h, 0x846ca68b); h ^= h >>> 16;
  return { own: null, digits, hash: h >>> 0 };
}
function rng(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/** What a hash holds: a slab (its creature, feeling, class and grain's seed) or a material (its kind and tier). */
export function holdOf(hash, roster = ROSTER) {
  const r = rng(hash);
  if (r() < SCAN.material) { const tier = pickOdds(r(), SCAN.cls); return { what: 'material', kind: KIND_IDS[Math.floor(r() * KIND_IDS.length)], tier }; }
  return { what: 'slab', kind: roster[Math.floor(r() * roster.length)], feeling: FEELINGS[Math.floor(r() * FEELINGS.length)], cls: pickOdds(r(), SCAN.cls), grain: Math.floor(r() * 2 ** 31) };
}
function pickOdds(u, odds) { let acc = 0; for (let i = 0; i < odds.length; i++) { acc += odds[i]; if (u < acc) return i; } return odds.length - 1; }

/** A scan, judged: refused when the game day's are spent; a code seen before gives its repeat's cubes once (`seen` maps hash -> times);
 *  else what it holds, sealed if a slab of a kind not yet met. The caller keeps `seen` and the game day's count. */
export function scanResult(text, { seen = new Map(), today = 0, met = new Set(), roster = ROSTER, perMinute = ECON.perMinute } = {}) {
  const c = readCode(text);
  if (c.own) return { ok: true, own: c.own, code: c.digits };
  if (!c.digits) return { ok: false, why: 'empty' };
  const times = seen.get(c.hash) || 0;
  if (times === 1) return { ok: true, hash: c.hash, again: true, cubes: Math.round(SCAN.again * perMinute) };
  if (times > 1) return { ok: false, why: 'known', hash: c.hash };
  if (today >= SCAN.perDay) return { ok: false, why: 'day', hash: c.hash };
  const hold = holdOf(c.hash, roster);
  return { ok: true, hash: c.hash, hold, sealed: hold.what === 'slab' && !met.has(hold.kind) && !met.has(photoKindOf(hold.kind)) };
}
