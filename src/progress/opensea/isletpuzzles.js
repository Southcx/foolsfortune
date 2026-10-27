// ---------------------------------------------------------------------------------------
// THE ISLETS' PUZZLES AND THE BURIED CACHES (docs/plans/OPEN-SEA.md section 12; the owner, 2026-10-20: "please write them into the
// plan and implement them! Oh and of course we need a metal-detecting treasure hunt for the dreamvane"). Dealt once from the sea's
// seed over its islets, so the same sea has the same puzzles; each islet carries one piece at most, beside its own secret.
//   THE PAIR: two islets hold the same carved thing (a shape and a colour). Seen on one and then on the other, in either order, it is
//     a find of `PAIR.tier`, reported at a dock as any find is (discoveries.js). It teaches noticing: the sea is the puzzle box.
//   THE LINE-UP: one islet has a spot on its shore and a few broken arcs hung out over the water at different distances; from the
//     spot, looking the right way, they close into one ring (anamorphosis, The Witness's environmental puzzles). Lined up, it is a
//     fix (your doubt cleared) and the eight squares round it charted: it pays knowledge, never cubes.
//   THE ECHO: a stone on one islet sings a phrase of `ECHO.notes` notes of the Crucibelle's five when you come near; its twin stone,
//     on an islet a square or two away, listens. Play the phrase back on the Crucibelle there and its cache rises out of the sand (pitch
//     and interval memory, taught by doing: Ocarina of Time's songs, the Crucibelle's own).
//   THE STELE: an islet whose secret is a stele carries three neuralese words of the ostraca in one line; read in the context of the
//     words you have glossed, it is Heaven's Vault's way of learning a language. The words are passed in (the ostraca's split).
//   THE CACHES: the treasure hunt. Every atoll and sandbar and some rocks have a cache buried in the sand: no mark on it, only the
//     Dreamvane's dowse (attuned to chests, it sings as you face it and the sand shivers when you are on it) finds it; dug, it pays its
//     islet's tier of `ECON.openSea.cache` once, for good. The echo's cache is sealed until its phrase is played, and is never less
//     than rare.
//
// Prior art: Islands of Insight's matchboxes, sightseers and hidden pieces (the open world as many small puzzles that pay knowledge);
// The Witness's anamorphic and environmental lines; Ocarina of Time's songs; Heaven's Vault's inscriptions read in context; Ratchet &
// Clank's metal detector (Rift Apart's and the Up Your Arsenal's) and Pokemon's Dowsing Machine (beep faster, then dig); Animal
// Crossing's fossils (one dig a spot, once).
//
//   dealPuzzles(islets: [{ id, kit, tier }], seed) -> { pairs: [{ id, a, b, shape, colour }], lineups: [{ id, islet, bearing, pitch,
//     size, dists }], echoes: [{ id, hear, play, phrase }], caches: [{ id, islet, tier, sealed? }] }
//   riddles: [{ id, islet, kit, bottle: [col, row], offset }]   riddleText(riddle) -> the bottle's note   RIDDLE
//   steleWords(isletId, seed, words) -> [3 words]   phraseHeard(phrase, played) -> 0..n (how many of the phrase's notes the last
//   played ones match, from the start)   cachePay(tier) -> cubes   PAIR  LINEUP  ECHO  CACHE
// ---------------------------------------------------------------------------------------
import { seeded } from '../../core/rng.js';
import { ECON } from '../econ/table.js';

/** How many of each a sea deals (a sea has about 18 islets: 3 pairs take 6, 3 line-ups 3, 2 echoes 4; the rest keep their secret alone). */
export const PUZZLE_COUNT = { pairs: 3, lineups: 3, echoes: 2, riddles: 2 };
/** The pair: its find's tier; how near (m) a carved thing must be come to count as seen; the shapes and colours it is carved in. */
export const PAIR = { tier: 'rare', seen: 6, shapes: ['urn', 'fish', 'bell', 'wheel', 'hand', 'moon'], colours: [0xd4a53c, 0x2f8f9d, 0xe07a5f, 0x9be36a, 0xb49be6, 0x3e3a8c] }; // (the pale cyan and the white washed out on the sand: Calissa, 2026-10-23; deep teal and indigo now)
/** The line-up: the arcs' distances out from the spot (m); how near the spot you stand (m), how close your look to the line (rad);
 *  the ring's apparent half-angle (rad), and how far up the line looks (rad). Four arcs a quarter each: from anywhere else they are four broken pieces. */
export const LINEUP = { dists: [60, 100, 150, 220], stand: 1.4, aim: 0.07, size: 0.1, pitch: 0.12 }; // (far, so the camera a few metres behind the eye sees nearly the same ring; pitched over the size, so the ring's foot is above the eye)
/** The echo: notes a phrase; how near (m) the singing stone sings and the listening stone listens; the gap between sung notes (real s). */
export const ECHO = { notes: 4, hear: 7, listen: 8, gap: 0.55 };
/** The drift bottle's riddle (OPEN-SEA.md 14.7; Sea of Thieves' riddle maps): a bottle adrift `away` squares off its islet, its note the
 *  way there in the sea's own words; read, it unseals a cache on that islet (never under `floor`) that only the dowse then finds. */
export const RIDDLE = { away: [2, 3], floor: 'rare', reach: 20, kits: { rock: 'a bare rock', atoll: 'an atoll', stack: 'a sea stack', ruin: 'a ruin', lighthouse: 'a dead lighthouse', sandbar: 'a sandbar that shows at low water' } };
/** The caches: which kits bury one (a rock only sometimes), and the echo's floor tier. */
export const CACHE = { kits: { atoll: 1, sandbar: 1, rock: 0.35 }, echoFloor: 'rare', dig: 1.6 };

const TIERS = ['common', 'uncommon', 'rare', 'legend'];
const squareOf = (i) => String(i.id).split(':')[1].split(',').map(Number); // (a feature's id is kind:col,row:n, seagrid.js)
const apart = (a, b) => { const [c1, r1] = squareOf(a), [c2, r2] = squareOf(b); return Math.max(Math.abs(c1 - c2), Math.abs(r1 - r2)); };
const hash = (s, seed) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h ^ seed) >>> 0; };

/** The sea's puzzles, the same every time for the same islets and seed. */
export function dealPuzzles(islets, seed = 1) {
  const r = seeded(hash('puzzles', seed)), pool = [...islets].sort((a, b) => (a.id < b.id ? -1 : 1));
  for (let i = pool.length - 1; i > 0; i--) { const j = r.int(i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const take = () => pool.shift() || null, out = { pairs: [], lineups: [], echoes: [], caches: [], riddles: [] };
  for (let i = 0; i < PUZZLE_COUNT.pairs; i++) {
    const a = take(), b = take(); if (!a || !b) break;
    out.pairs.push({ id: `pair:${i}`, a: a.id, b: b.id, shape: PAIR.shapes[i % PAIR.shapes.length], colour: PAIR.colours[(i * 2 + 1) % PAIR.colours.length] });
  }
  for (let i = 0; i < PUZZLE_COUNT.lineups; i++) {
    const s = take(); if (!s) break;
    out.lineups.push({ id: `lineup:${i}`, islet: s.id, bearing: r.range(0, Math.PI * 2), pitch: LINEUP.pitch, size: LINEUP.size, dists: LINEUP.dists });
  }
  for (let i = 0; i < PUZZLE_COUNT.echoes; i++) {
    const hear = take(); if (!hear || !pool.length) break;
    const play = pool.splice(pool.reduce((best, x, k) => (apart(hear, x) < apart(hear, pool[best]) ? k : best), 0), 1)[0]; // (its twin the nearest islet left: a square or two off)
    const phrase = []; while (phrase.length < ECHO.notes) { const d = 1 + r.int(5); if (d !== phrase[phrase.length - 1]) phrase.push(d); } // (no note twice running: a phrase, not a drone)
    out.echoes.push({ id: `echo:${i}`, hear: hear.id, play: play.id, phrase });
    out.caches.push({ id: `cache:echo:${i}`, islet: play.id, tier: TIERS[Math.max(TIERS.indexOf(play.tier), TIERS.indexOf(CACHE.echoFloor))], sealed: `echo:${i}` });
  }
  for (let i = 0; i < PUZZLE_COUNT.riddles; i++) {
    const s = take(); if (!s) break;
    const [c, row] = squareOf(s); let bottle = null;
    for (let k = 0; k < 16 && !bottle; k++) { // (a way at least RIDDLE.away[0] squares long that stays on the sea's grid, 9 by 7)
      const a = r.range(0, Math.PI * 2), d = RIDDLE.away[0] + r.int(RIDDLE.away[1] - RIDDLE.away[0] + 1), bc = Math.round(c + Math.cos(a) * d) + 0, br = Math.round(row + Math.sin(a) * d) + 0; // (+ 0: never a -0 in the save)
      if (bc >= 0 && bc <= 8 && br >= 0 && br <= 6 && Math.max(Math.abs(bc - c), Math.abs(br - row)) >= RIDDLE.away[0]) bottle = [bc, br];
    }
    if (!bottle) bottle = [c < 4 ? c + 2 : c - 2, row];
    out.riddles.push({ id: `riddle:${i}`, islet: s.id, kit: s.kit, bottle, offset: [r.range(-120, 120), r.range(-120, 120)] });
    out.caches.push({ id: `cache:riddle:${i}`, islet: s.id, tier: TIERS[Math.max(TIERS.indexOf(s.tier), TIERS.indexOf(RIDDLE.floor))], sealed: `riddle:${i}` });
  }
  for (const i of islets) {
    const p = CACHE.kits[i.kit] ?? 0; if (!p || out.caches.some((c) => c.islet === i.id)) continue;
    if (seeded(hash(`cache:${i.id}`, seed))() < p) out.caches.push({ id: `cache:${i.id}`, islet: i.id, tier: i.tier || 'common' });
  }
  return out;
}

/** A bottle's note: the way from where it drifted to its islet, in the board's words (squares north or south, east or west, as the
 *  dock's board gives a herd's), and what the islet is. */
export function riddleText(rd) {
  const [c, row] = squareOf({ id: rd.islet }), [bc, br] = rd.bottle, dc = c - bc, dr = row - br; // (the board's own words: rows grow south, columns east; herds.js bearing)
  const sq = (n) => `${n} square${n === 1 ? '' : 's'}`, parts = [];
  if (dr) parts.push(`${sq(Math.abs(dr))} ${dr > 0 ? 'south' : 'north'}`);
  if (dc) parts.push(`${sq(Math.abs(dc))} ${dc > 0 ? 'east' : 'west'}`);
  return `From where I drifted, ${parts.join(' and ') || 'here'}: ${RIDDLE.kits[rd.kit] || 'an islet'}. Dig where the dowse sings.`;
}

/** A sea stele's three words: drawn from the ostraca's words by the islet, so the same stone says the same thing. */
export function steleWords(isletId, seed, words) {
  if (!words?.length) return [];
  const r = seeded(hash(`stele:${isletId}`, seed)), out = [];
  while (out.length < Math.min(3, words.length)) { const w = r.pick(words); if (!out.includes(w)) out.push(w); }
  return out;
}

/** How far into the phrase the notes just played reach: the longest run at the end of `played` that is the phrase's start. */
export function phraseHeard(phrase, played) {
  for (let n = Math.min(phrase.length, played.length); n > 0; n--) {
    let ok = true; for (let k = 0; k < n; k++) if (played[played.length - n + k] !== phrase[k]) { ok = false; break; }
    if (ok) return n;
  }
  return 0;
}

/** What a cache of `tier` pays, in cubes: its minutes of the aim. */
export const cachePay = (tier) => Math.round((ECON.openSea.cache[tier] ?? ECON.openSea.cache.common) * ECON.perMinute);
