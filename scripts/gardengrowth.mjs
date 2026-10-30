// ---------------------------------------------------------------------------------------
// THE CHECK OF SEEDS, SLABS AND SCANS (progress/seeds.js, progress/slabs.js, progress/scans.js; docs/plans/SEEDS-SLABS-SCANS.md): their
// numbers measured headless, one PASS/FAIL line a claim.
//   - seeds: the sizes in order, the feeding's minutes, a tint;
//   - slabs: a careful dig (the silhouette, then the right tool for each cell) is flawless inside the slab's time; a reckless one (the
//     blast everywhere) cracks the fossil and scores under half; a lazy one (the brush alone) bares little; every kind's fossil lies
//     inside the slab;
//   - scans: the same code gives the same hold; a thousand codes spread over the roster and the classes near their odds; the day's cap,
//     the repeat's cubes, a sealed slab.
// node scripts/gardengrowth.mjs
// ---------------------------------------------------------------------------------------
import { SIZES, sizeOf, feedOf, tintOf, SEEDS, seedsEarned } from '../src/progress/seeds.js';
import { SLAB, VERBS, newSlab, carve, scoreOf, spiritOf, exposed, secondsOf } from '../src/progress/slabs.js';
import { SCAN, ROSTER, readCode, holdOf, scanResult } from '../src/progress/scans.js';
import { ECON } from '../src/progress/econ/table.js';

let bad = 0;
const check = (ok, what) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`); if (!ok) bad++; };

// ---- seeds
check(SIZES.every((s, i) => !i || (s.at > SIZES[i - 1].at && s.r > SIZES[i - 1].r)), `sizes grow in order (${SIZES.map((s) => `${s.id} ${s.r} m at ${s.at}`).join(', ')})`);
check(sizeOf(0).size.id === 'moonlet' && sizeOf(60).size.id === 'small' && sizeOf(419).size.id === 'medium' && sizeOf(9999).size.id === 'large', 'sizeOf reads the ladder');
check(Math.abs(feedOf({ cubes: ECON.perMinute * 10 }).minutes - 10) < 1e-9 && feedOf({ matter: 20 }).minutes === 5, 'a minute of cubes is a minute; a full scoop of matter five');
check(tintOf({ grief: 30, none: 40 })?.feeling === 'grief' && tintOf({ grief: 10, none: 90 }) === null, 'the tint is the feeling fed most, from a third');
const L = { get: (k) => ({ 'garden.enter': 1, 'well.foe': 1, 'feeling.known.wonder': 1 })[k] || 0 };
check(seedsEarned(L).join() === 'clay,crystal,moonlet.wonder', `seeds earned from the ledger: ${seedsEarned(L).join(', ')} (of ${Object.keys(SEEDS).length})`);

// ---- slabs
const DIRS = [{ x: 0, y: 1, z: 0 }, { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }, { x: 0, y: -1, z: 0 }];
const at = (S, i) => ({ x: i % S.w, y: Math.floor(i / S.w) % S.h, z: Math.floor(i / (S.w * S.h)) });
const isBone = (S, x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < S.w && y < S.h && z < S.d && S.cells[x + S.w * (y + S.h * z)] < 0;
// (the bots dig from the top down, a row at a time, striking only what is open to the air: a player's way into a slab)
const openCells = (S, y) => { const out = []; for (let z = 0; z < S.d; z++) for (let x = 0; x < S.w; x++) if (exposed(S, x, y, z)) out.push({ x, y, z }); return out; };
const boneWithin = (S, c, r) => { for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (let e = -r; e <= r; e++) if (isBone(S, c.x + a, c.y + b, c.z + e)) return true; return false; };
const lowest = (S) => { let y = 0; for (let i = 0; i < S.cells.length; i++) if (S.cells[i] < 0) y = Math.max(y, at(S, i).y); return y; };
function careful(S) { // (the silhouette first; far from the fossil the blast, near it the brush on loose stone or a pick aimed away from the bone)
  carve(S, 'silhouette', { x: 0, y: 0, z: 0 });
  const floor = lowest(S);
  for (let y = 0; y <= floor && S.t < secondsOf(S.stars); y++) {
    for (let pass = 0; pass < 6; pass++) {
      const cells = openCells(S, y); if (!cells.length) break;
      for (const c of cells) {
        if (S.t >= secondsOf(S.stars)) break; const i = c.x + S.w * (c.y + S.h * c.z); if (S.cells[i] <= 0) continue;
        if (!boneWithin(S, c, 2)) { carve(S, 'blast', c); continue; }
        if (S.cells[i] === 1) { carve(S, 'brush', c); continue; }
        carve(S, 'pick', c, DIRS.find((d) => !isBone(S, c.x + d.x, c.y + d.y, c.z + d.z) && !(d.y < 0)) || DIRS[1]);
      }
    }
  }
  return scoreOf(S);
}
function reckless(S) { for (let y = 0; y < S.h && S.t < secondsOf(S.stars); y++) for (const c of openCells(S, y)) { if (S.t >= secondsOf(S.stars)) break; carve(S, 'blast', c); } return scoreOf(S); }
function lazy(S) { for (let y = 0; y < S.h && S.t < secondsOf(S.stars); y++) for (let pass = 0; pass < 3; pass++) for (const c of openCells(S, y)) { if (S.t >= secondsOf(S.stars)) break; carve(S, 'brush', c); } return scoreOf(S); }
for (const stars of [1, 2, 3]) {
  const c = careful(newSlab({ kind: 'slipjelly', stars })), r = reckless(newSlab({ kind: 'slipjelly', stars })), z = lazy(newSlab({ kind: 'slipjelly', stars }));
  check(c.flawless, `${stars} stars: a careful dig is flawless in the slab's time (bared ${c.bared}, cracked ${c.cracked}, ${c.t} of ${secondsOf(stars)} real s)`);
  check(r.cracked > 0 && r.score < 0.5, `${stars} stars: the blast everywhere cracks the fossil (score ${r.score}, cracked ${r.cracked})`);
  check(z.score < 0.5, `${stars} stars: the brush alone bares little (score ${z.score})`);
}
const kinds = ROSTER.map((k) => newSlab({ kind: k, stars: 2 })), bones = kinds.map((S) => S.cells.filter((c) => c < 0).length);
check(bones.every((n) => n >= 10), `every kind's fossil lies inside its slab (${Math.min(...bones)} to ${Math.max(...bones)} cells)`);
const sp = spiritOf({ score: 1, flawless: true }, 3);
check(sp.bond === 30 && sp.rare && sp.cls === 2 && spiritOf({ score: 0 }, 1).bond === 0, 'a flawless dig: bond 30 and the rare look; a dig of nothing still summons');
check(Object.values(VERBS).every((v) => v.tool && v.line && v.secs > 0), 'every verb has its tool, its line and its time');

// ---- scans
check(JSON.stringify(holdOf(readCode('0 12345 67890 5').hash)) === JSON.stringify(holdOf(readCode('012345678905').hash)), 'the same code (spaces aside) holds the same thing');
check(readCode('FF2-abc').own === 'track' && readCode('ffs-1').own === 'spirit', "the game's own codes are read as what they are");
const counts = {}, cls = [0, 0, 0, 0, 0]; let mats = 0;
for (let n = 0; n < 4000; n++) { const h = holdOf(readCode(String(400000000000 + n * 7919)).hash); if (h.what === 'material') { mats++; continue; } counts[h.kind] = (counts[h.kind] || 0) + 1; cls[h.cls]++; }
const slabs = 4000 - mats, share = (x) => x / slabs;
check(Math.abs(mats / 4000 - SCAN.material) < 0.03, `materials are ${(mats / 40).toFixed(1)}% of codes (${SCAN.material * 100}% asked)`);
check(ROSTER.every((k) => share(counts[k] || 0) > 0.5 / ROSTER.length), `every creature of the roster turns up (${ROSTER.length} kinds)`);
check(cls.every((n, i) => Math.abs(share(n) - SCAN.cls[i]) < 0.03), `classes near their odds (${cls.map((n) => (100 * share(n)).toFixed(0)).join('/')}%)`);
const seen = new Map(), code = '5012345678900', first = scanResult(code, { seen });
seen.set(first.hash, 1); const again = scanResult(code, { seen }); seen.set(first.hash, 2); const third = scanResult(code, { seen });
check(first.ok && again.again && again.cubes === Math.round(SCAN.again * ECON.perMinute) && !third.ok, 'a repeat gives its cubes once, then nothing');
check(!scanResult('9780140449136', { today: SCAN.perDay }).ok, `the game day's cap (${SCAN.perDay})`);
const s1 = scanResult(code, {}); check(s1.hold.what !== 'slab' || s1.sealed === true, 'a slab of a kind not met comes sealed');

console.log(bad ? `gardengrowth: ${bad} FAILED` : 'gardengrowth: all PASS');
process.exit(bad ? 1 : 0);
