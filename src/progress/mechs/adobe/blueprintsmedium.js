// ---------------------------------------------------------------------------------------
// THE ADOBE CITY'S MEDIUM BLUEPRINTS (plain names; South, 2026-11-03): eight earthen houses and works of 10 to 20 cells, drawn with the
// blueprint kit (vfx/mechs/city/blueprintkit.js), seeded, settled so each stands at build; the front is +z. What each takes, from where:
//   courtyard   the Spanish-Pueblo hacienda (Martínez Hacienda, Taos; Santa Fe's placitas): rooms round a paved placita behind a
//               zaguán's double door, a portal of posts and vigas round the court, a torreón at one corner, canales and ristras
//   badgir      a Yazd house with its windcatcher (badgir; the Dowlatabad garden's): a kahgel house, a small dome, a tall square tower
//               slotted on all four faces at its head, cobalt kashi bands, an iwan door framed in tile
//   bazaar      a vaulted bazaar row (the Grand Bazaar of Isfahan, the souks of Aleppo): bays under corbelled domes, an arch a bay
//               with a cloth awning and goods spilling out, a zellige band over the arches
//   ghorfa      the fortified granary of Ksar Ouled Soltane (Tataouine, Tunisia): barrel-vaulted cells stacked three to five high,
//               small doors, timber pegs and stone steps up their face
//   gate        a caravanserai's monumental portal (a pishtaq: Zein-o-din, Ganjali Khan's): a deep pointed niche in a tall frame
//               banded in kashi, two slender minarets beside it, low walls with a blind arcade either side
//   hausa       a Hausa house of Zaria and Kano: a block with rounded parapets, zanko horns at its corners and over the entrance's
//               raised zaure front, the facade carved in interlocking reliefs, a room on the roof
//   ksar        a ksar's wall and gate (Aït Ben Haddou, the ksour of the Ziz): two tapered towers with stepped merlons and carved
//               bands flanking an arched gate, a crenellated wall running out either side
//   casa        a two-storey colonial casa (Andalusia's and Mexico's adobe houses): lime-washed walls, turquoise shutters, a wooden
//               balcony on posts along the upper floor with pots on it, a talavera cornice
//
//   MEDIUM[id] = { label, size: 'medium', w, d, plan(seed) -> Plan.finish() }
// ---------------------------------------------------------------------------------------
import { Plan, ROLE as R, FACE as F } from './blueprintkit.js';

function courtyard(seed) {
  const P = new Plan(16, 10, 16, seed), top = 4;
  P.block([0, 0, 15, 15], 0, top, { role: R.plaster, roof: R.roofEarth, parapet: 1, bay: 99 });
  P.clear(5, 0, 5, 10, top + 1, 10);                                                     // the placita, open to the sky
  P.walls(4, 4, 11, 11, 0, top, R.plaster, 1);
  P.fill(5, 0, 5, 10, 0, 10, R.stone);                                                   // (its paving)
  P.slab(5, 5, 10, 10, top, 0);
  for (const f of [F.s, F.n, F.e, F.w]) P.windows([4, 4, 11, 11], f, 1, { from: 1, every: 3, w: 2, h: 2, lintel: R.viga, t: 1 }); // (the portal's openings round the court)
  P.clear(5, 1, 5, 10, top, 10);
  P.door([0, 0, 15, 15], F.s, 6, 0, 3, 3, { t: 1 }); P.clear(6, 0, 12, 9, 2, 14);          // the zaguán through the front rooms
  P.opening([4, 4, 11, 11], F.s, 2, 0, 3, 3, { lintel: R.viga });
  const tq = P.chance(0.5) ? 0 : 11;                                                     // the torreón on a back corner
  P.tower([tq, 0, tq + 4, 4], top + 1, top + 4, { role: R.plaster, t: 1, storey: 0 }); P.crenels([tq, 0, tq + 4, 4], top + 5, R.crenel);
  P.vigas([0, 0, 15, 15], F.s, top, 2, 1); P.vigas([0, 0, 15, 15], F.e, top, 2, 1); P.vigas([0, 0, 15, 15], F.w, top, 2, 1);
  for (const u of [2, 13]) { const p = P.onFace([0, 0, 15, 15], F.s, u); P.prop('canale', p.x, top + 1, p.z, F.s); }
  P.prop('ristra', 5, 2, 15, F.s); P.prop('ristra', 10, 2, 15, F.s);
  for (let k = 0; k < 3; k++) P.prop('pot', P.int(5, 10), 0, P.int(5, 10), F.up, { c: k });
  P.windows([0, 0, 15, 15], F.s, 1, { from: 1, to: 3, every: 3, h: 2, role: R.shutter, lintel: R.lintel });
  P.windows([0, 0, 15, 15], F.e, 1, { from: 2, every: 4, h: 2, role: R.shutter, lintel: R.lintel });
  return P.finish();
}

function badgir(seed) {
  const P = new Plan(14, 20, 12, seed), top = 5, wt = 16 + P.int(0, 2);
  P.block([0, 0, 13, 11], 0, top, { role: R.plaster, roof: R.roofEarth, parapet: 1, bay: 7 });
  P.dome(3.5, 5.5, 2.6, top + 1, R.dome, { t: 2, k: 1, finial: 0 });
  // the iwan door framed in tile
  P.opening([0, 0, 13, 11], F.s, 4, 0, 3, 4, { role: R.door, arch: true, lintel: 0 });
  P.skin([3, 0, 7, 11], 0, 5, 0, (x, y, z) => (z === 11 && (x === 3 || x === 7 || y === 4 || y === 5) && P.roleAt(x, y, z) !== R.door ? (y === 5 ? R.cobalt : R.tile) : 0));
  // the windcatcher: a square tower slotted at its head, vanes inside
  const box = [8, 1, 12, 5];
  P.tower(box, top + 1, wt, { role: R.plaster, t: 1, storey: 0 });
  for (const f of [F.s, F.n, F.e, F.w]) for (const u of [1, 3]) P.opening(box, f, u, wt - 4, 1, 3, { lintel: 0 });
  P.fill(10, wt - 4, 2, 10, wt - 1, 4, R.plaster); P.fill(9, wt - 4, 3, 11, wt - 1, 3, R.plaster); // (its vanes)
  P.skin(box, wt - 5, wt - 5, R.cobalt); P.skin(box, wt, wt, R.tile);
  P.crenels(box, wt + 1, R.crenel);
  P.windows([0, 0, 13, 11], F.e, 2, { from: 2, every: 4, h: 2, role: R.lattice, frame: R.trim, lintel: 0 });
  P.prop('pot', 1, top, 10, F.up, { c: 1 });
  return P.finish();
}

function bazaar(seed) {
  const P = new Plan(20, 10, 9, seed), bays = 4, bw = 5, top = 4;
  P.walls(0, 0, 19, 8, 0, top, R.plaster, 1);
  for (let k = 1; k < bays; k++) P.fill(k * bw, 0, 1, k * bw, top, 7, R.plaster);
  P.slab(1, 1, 18, 7, top + 1, R.dome); P.walls(0, 0, 19, 8, top + 1, top + 1, R.plaster, 1);
  for (let k = 0; k < bays; k++) {
    const x0 = k * bw, cx = x0 + 2.5, r = P.chance(0.5) ? 2.4 : 2.0;
    P.dome(cx, 4, r, top + 2, R.dome, { t: 2, k: P.chance(0.4) ? 1.3 : 1 });
    P.opening([0, 0, 19, 8], F.s, x0 + 1, 0, 3, 4, { arch: true, lintel: 0 });
    P.prop('awning', x0 + 2, 4, 8, F.s, { c: P.int(0, 4), len: 3 });
    for (let n = 0; n < 2; n++) P.set(x0 + 1 + P.int(0, 2), 0, P.int(4, 6), R.goods);
    P.prop('pot', x0 + 1, 0, 7, F.up, { c: P.int(0, 3) });
  }
  P.skin([0, 0, 19, 8], top, top, R.tile, (x, y, z) => (z === 8 ? (x % 2 ? R.tile : R.cobalt) : 0));
  P.crenels([0, 0, 19, 8], top + 2, R.crenel, { every: 2 });
  return P.finish();
}

function ghorfa(seed) {
  const P = new Plan(13, 17, 11, seed), cols = 4;
  for (let c = 0; c < cols; c++) {
    const x0 = c * 3, n = 3 + P.int(0, 2) + (c === 1 || c === 2 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const y = k * 3;
      P.fill(x0, y, 0, x0, y + 2, 7, R.plaster); P.fill(x0 + 2, y, 0, x0 + 2, y + 2, 7, R.plaster);
      P.fill(x0 + 1, y + 2, 0, x0 + 1, y + 2, 7, R.dome); P.fill(x0 + 1, y, 0, x0 + 1, y + 1, 0, R.plaster);
      if (k < n - 1 || P.chance(0.6)) P.set(x0 + 1, y, 7, R.door); else P.set(x0 + 1, y, 7, R.plaster);
      if (k > 0) P.prop('viga', x0 + 1, y + 2, 7, F.s);
      if (k === n - 1) { P.set(x0, y + 3, 3, R.dome); P.set(x0 + 2, y + 3, 4, R.dome); P.fill(x0 + 1, y + 3, 1, x0 + 1, y + 3, 6, R.dome); }
    }
  }
  P.fill(12, 0, 0, 12, 8, 7, R.plaster);
  for (let s = 0; s < 6; s++) P.fill(s + 1, 0, 8, s + 1, s, 9, R.stone);                // the stair up the face
  P.fill(7, 0, 8, 7, 6, 8, R.stone);
  P.prop('pot', 3, 5, 8, F.up, { c: 2 });
  return P.finish();
}

function gate(seed) {
  const P = new Plan(18, 21, 10, seed), ht = 14 + P.int(0, 1);
  P.fill(0, 0, 3, 17, 7, 6, R.plaster); P.clear(1, 0, 4, 16, 6, 5);
  P.slab(1, 4, 16, 5, 7, R.roofEarth); P.crenels([0, 3, 17, 6], 8, R.crenel);
  for (const x0 of [1, 13]) for (let k = 0; k < 2; k++) P.opening([0, 3, 17, 6], F.s, x0 + k * 2, 2, 1, 4, { arch: false, lintel: 0, role: R.trim }); // (the blind arcade)
  // the pishtaq
  const box = [4, 5, 13, 9];
  P.walls(4, 5, 13, 9, 0, ht, R.plaster, 2); P.slab(6, 7, 11, 7, ht, R.roofEarth);
  P.clear(6, 0, 7, 11, 9, 9); P.clear(7, 10, 7, 10, 10, 9); P.clear(8, 11, 8, 9, 11, 9); // the deep pointed niche
  P.fill(6, 0, 6, 11, 11, 6, R.plaster); P.opening([6, 6, 11, 6], F.s, 2, 0, 2, 4, { role: R.door, arch: true, lintel: 0 });
  P.skin(box, 0, ht, 0, (x, y, z) => (z === 9 && (x === 4 || x === 13 || y === ht || y === ht - 1) ? (y % 2 ? R.cobalt : R.tile) : z === 9 && (x === 5 || x === 12) ? R.tile : 0));
  P.set(6, 10, 9, R.gold); P.set(11, 10, 9, R.gold); P.set(7, 11, 9, R.gold); P.set(10, 11, 9, R.gold);
  P.crenels(box, ht + 1, R.crenel, { every: 2 });
  // the minarets either side of it
  for (const x0 of [2, 14]) {
    P.fill(x0, 0, 7, x0 + 1, ht + 3, 8, R.plaster);
    P.skin([x0, 7, x0 + 1, 8], ht - 2, ht - 1, R.cobalt); P.skin([x0, 7, x0 + 1, 8], ht + 2, ht + 3, R.tile);
    P.set(x0, ht + 4, 7, R.dome); P.prop('finial', x0, ht + 4, 7, F.up, { c: 0 });
  }
  return P.finish();
}

function hausa(seed) {
  const P = new Plan(12, 12, 10, seed), top = 5;
  P.block([0, 0, 11, 9], 0, top, { role: R.plaster, roof: R.roofEarth, parapet: 1, bay: 6 });
  for (const [x, z] of [[0, 0], [11, 0], [0, 9], [11, 9]]) P.clear(x, top + 1, z, x, top + 1, z); // (the rounded corners of the parapet)
  for (const [x, z, dx, dz] of [[1, 0, -1, 0], [10, 0, 1, 0], [1, 9, -1, 0], [10, 9, 1, 0]]) { P.set(x, top + 2, z, R.crenel); P.set(x, top + 3, z, R.crenel); P.set(x + dx, top + 3, z + dz, R.crenel); } // (the zanko horns)
  // the zaure front raised over the door, carved, horned
  P.fill(3, top + 1, 9, 8, top + 3, 9, R.plaster);
  for (const [x, dx] of [[3, -1], [8, 1]]) { P.set(x, top + 4, 9, R.crenel); P.set(x, top + 5, 9, R.crenel); P.set(x + dx, top + 5, 9, R.crenel); }
  P.door([0, 0, 11, 9], F.s, 5, 0, 2, 3, { lintel: R.lintel });
  P.skin([2, 0, 9, 9], 0, top + 3, 0, (x, y, z) => (z === 9 && P.roleAt(x, y, z) === R.plaster && ((x + y) % 3 === 0 || (x - y + 30) % 3 === 0) ? R.relief : 0));
  P.windows([0, 0, 11, 9], F.e, 3, { from: 2, every: 4, w: 1, h: 1, lintel: 0 });
  P.windows([0, 0, 11, 9], F.w, 3, { from: 2, every: 4, w: 1, h: 1, lintel: 0 });
  if (P.chance(0.7)) { P.block([1, 1, 5, 4], top + 1, top + 3, { role: R.plaster, parapet: 1 }); P.prop('pot', 2, top + 1, 6, F.up, { c: 0 }); }
  for (const u of [2, 9]) { const p = P.onFace([0, 0, 11, 9], F.s, u); P.prop('canale', p.x, top + 1, p.z, F.s); }
  return P.finish();
}

function ksar(seed) {
  const P = new Plan(20, 16, 7, seed), wt = 8 + P.int(0, 1), tt = 12 + P.int(0, 1);
  P.fill(0, 0, 2, 19, wt, 4, R.rose); P.clear(1, 1, 3, 18, wt - 1, 3);
  P.crenels([0, 2, 19, 4], wt + 1, R.crenel, { every: 2 });
  for (const x0 of [3, 11]) {
    const box = [x0, 0, x0 + 5, 6], tb = P.tower(box, 0, tt, { role: R.rose, t: 2, steps: [[7, 1]], storey: 4 });
    P.skin(tb, tt - 3, tt - 2, 0, (x, y, z) => ((x + z + y) % 3 === 0 ? R.relief : 0));
    P.crenels(tb, tt + 1, R.crenel, { every: 2, step: 1 });
    for (const y of [4, 8]) P.opening(y > 6 ? tb : box, F.s, 2, y, 1, 2, { lintel: 0 });
  }
  P.clear(9, 0, 2, 10, 5, 4); P.fill(9, 0, 4, 10, 4, 4, R.door);                           // the gate between them
  P.set(9, 5, 4, R.lintel); P.set(10, 5, 4, R.lintel); P.set(8, 5, 4, R.lintel); P.set(11, 5, 4, R.lintel);
  P.skin([8, 2, 11, 4], 5, 7, 0, (x, y, z) => (z === 4 ? (y === 7 ? R.tile : R.trim) : 0));
  P.prop('flag', 5, tt, 3, F.up, { c: 4 });
  return P.finish();
}

function casa(seed) {
  const P = new Plan(12, 11, 11, seed), g = 3, top = 7, wall = P.chance(0.7) ? R.lime : R.rose;
  const box = [0, 0, 11, 8];
  P.block(box, 0, top, { role: wall, roof: R.roofEarth, parapet: 1, storey: 4, bay: 7 });
  P.door(box, F.s, 5, 0, 2, 3, { lintel: R.lintel });
  P.windows(box, F.s, 1, { from: 1, to: 3, every: 2, w: 1, h: 2, role: R.shutter, frame: R.trim, lintel: 0 });
  P.windows(box, F.s, 1, { from: 8, to: 10, every: 2, w: 1, h: 2, role: R.shutter, frame: R.trim, lintel: 0 });
  for (const u of [2, 5, 8]) P.opening(box, F.s, u, 4, 2, 3, { role: u === 5 ? R.door : R.shutter, lintel: R.lintel });
  P.fill(1, g + 1, 9, 10, g + 1, 9, R.wood);                                              // the balcony
  for (let x = 1; x <= 10; x += 3) P.fill(x, 0, 9, x, g, 9, R.wood);
  for (let x = 1; x <= 10; x++) if (x % 2) P.set(x, g + 2, 9, R.wood);
  P.fill(1, top + 1, 9, 10, top + 1, 9, R.wood); for (let x = 1; x <= 10; x += 3) P.fill(x, g + 2, 9, x, top, 9, R.wood);
  P.skin(box, top, top, R.tile, (x, y, z) => (z === 8 || x === 0 || x === 11 ? ((x + z) % 2 ? R.tile : R.cobalt) : 0));
  P.windows(box, F.e, 5, { from: 2, every: 3, w: 1, h: 2, role: R.shutter, lintel: 0 });
  for (let k = 0; k < 3; k++) P.prop('pot', 2 + k * 3, g + 1, 9, F.up, { c: k + 1 });
  P.prop('ristra', 4, 2, 8, F.s);
  return P.finish();
}

export const MEDIUM = {
  courtyard: { label: 'Courtyard house', size: 'medium', w: 16, d: 16, plan: courtyard },
  badgir: { label: 'Windcatcher house', size: 'medium', w: 14, d: 12, plan: badgir },
  bazaar: { label: 'Domed bazaar row', size: 'medium', w: 20, d: 9, plan: bazaar },
  ghorfa: { label: 'Vaulted granary', size: 'medium', w: 13, d: 11, plan: ghorfa },
  gate: { label: 'Caravanserai gate', size: 'medium', w: 18, d: 10, plan: gate },
  hausa: { label: 'Hausa house', size: 'medium', w: 12, d: 10, plan: hausa },
  ksar: { label: 'Ksar gate', size: 'medium', w: 20, d: 7, plan: ksar },
  casa: { label: 'Casa with balcony', size: 'medium', w: 12, d: 11, plan: casa },
};
