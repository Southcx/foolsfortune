// ---------------------------------------------------------------------------------------
// THE ADOBE CITY'S LARGE BLUEPRINTS (plain names; South, 2026-11-03: "adobe buildings ... super fancy and with varied silhouettes"):
// five great earthen buildings for the proving ground's toy city, each a plan of 1 m cells drawn with the blueprint kit
// (vfx/mechs/city/blueprintkit.js), seeded so no two of a kind stand alike, every one settled by the support rule so it stands at build.
// The front is +z (the street's side at yaw 0). What each takes, and from where:
//   djenne    the Great Mosque of Djenné (Mali, 1907, Ismaila Traoré's masons): a raised platform, a hall of thick banco walls on a
//             forest of arcaded piers, buttress pilasters running up into pinnacles, three tall towers on the qibla front each crowned
//             with a pinnacle and an ostrich egg, the toron (palm-wood scaffold poles) bristling in rows from every face
//   pueblo    Taos Pueblo's Hlaauma (New Mexico, about 1000 to 1450): room blocks stacked in five setback terraces, small blue doors,
//             ladders leaning from one roof to the next, vigas poking through under each roof line, canales, ristras, hornos on the terraces
//   kasbah    the kasbahs of the Draa and Ounila valleys (Taourirt, Amridil, Aït Ben Haddou): four tapered corner towers with stepped
//             merlons and carved geometric bands near the top, curtain walls, a keep in the court, a horseshoe gate framed in zellige
//   shibam    Shibam's tower houses (Hadhramaut, Yemen, 16th century): a cluster of slender mud towers packed shoulder to shoulder on a
//             plinth, their top storeys lime-washed white, rows of small framed windows, bridges between neighbours high up
//   mission   the Spanish missions of New Mexico (San Esteban del Rey at Acoma, San Francisco de Asís at Ranchos de Taos, San Miguel):
//             a long nave with stepped sloping buttresses, a lime-washed facade with a curved espadaña gable holding two bells, twin
//             bell towers with domed caps and crosses, a cloister arcade along one side
//
//   LARGE[id] = { label, size: 'large', w, d, plan(seed) -> Plan.finish() }
// ---------------------------------------------------------------------------------------
import { Plan, ROLE as R, FACE as F } from './blueprintkit.js';

/** Toron in rows up a face: a palm-wood pole every `every` cells, every `rows` layers (Djenné's scaffold for the yearly re-plastering). */
function toron(P, box, face, y0, y1, every = 2, rows = 3) {
  const len = face === F.s || face === F.n ? box[2] - box[0] + 1 : box[3] - box[1] + 1;
  for (let y = y0; y <= y1; y += rows) for (let u = (y / rows) % 2 ? 0 : 1; u < len; u += every) {
    const p = P.onFace(box, face, u); if (P.get(p.x, y, p.z)) P.prop('toron', p.x, y, p.z, face);
  }
}
/** Buttress pilasters along a face: a cell stood out of the wall every `every`, from y0 to `top`, its top cells pinnacles. */
function pilasters(P, box, face, y0, top, every = 3, from = 1, pin = 2) {
  const len = face === F.s || face === F.n ? box[2] - box[0] + 1 : box[3] - box[1] + 1;
  for (let u = from; u < len; u += every) {
    const p = P.onFace(box, face, u), x = p.x - p.ix, z = p.z - p.iz;
    for (let y = y0; y <= top; y++) P.set(x, y, z, y > top - pin ? R.crenel : R.toron);
    for (let y = y0 + 2; y <= top - 2; y += 3) P.prop('toron', x, y, z, face);
  }
}

function djenne(seed) {
  const P = new Plan(34, 25, 26, seed), hallTop = 10 + P.int(0, 1);
  P.fill(0, 0, 0, 33, 0, 25, R.stone);                                                   // the platform
  P.fill(14, 0, 25, 19, 0, 25, 0);                                                       // (its stair's gap)
  const hall = [2, 1, 31, 18];
  P.walls(2, 1, 31, 18, 1, hallTop + 1, R.plaster, 2);
  for (const x of [10, 17, 24]) { P.fill(x, 1, 3, x, hallTop, 16, R.plaster); for (let z = 4; z < 16; z += 4) P.opening([x, 3, x, 16], F.e, z - 3, 1, 3, 5, { arch: true, lintel: 0 }); } // (the arcades of piers inside)
  P.slab(4, 3, 29, 16, hallTop, R.roofEarth);
  P.crenels(hall, hallTop + 2, R.crenel, { every: 2 });
  for (const f of [F.w, F.e, F.n]) { pilasters(P, hall, f, 1, hallTop + 4, 3, 1, 2); toron(P, hall, f, 3, hallTop, 2, 3); }
  // the facade wall and its gallery behind
  const fac = [2, 22, 31, 23], facTop = hallTop + 2;
  P.fill(2, 1, 22, 31, facTop, 23, R.plaster);
  P.fill(2, 1, 19, 2, hallTop, 21, R.plaster); P.fill(31, 1, 19, 31, hallTop, 21, R.plaster);
  P.slab(3, 19, 30, 21, hallTop, R.roofEarth);
  for (const u of [8, 19]) P.opening(fac, F.s, u, 1, 3, 5, { role: R.door, t: 2, arch: true, frame: R.trim });
  P.crenels(fac, facTop + 1, R.crenel);
  // the three towers
  const tall = 22 + P.int(-1, 2), side = tall - 4 - P.int(0, 1);
  for (const [x0, top] of [[3, side], [14, tall], [25, side]]) {
    const box = [x0, 19, x0 + 5, 24];
    const tb = P.tower(box, 1, top, { role: R.plaster, t: 2, steps: [[top - 5, 1]], storey: 4 });
    pilasters(P, box, F.s, 1, top + 2, 2, 0, 3);
    P.set(tb[0], top + 1, tb[1], R.crenel); P.set(tb[2], top + 1, tb[1], R.crenel); P.set(tb[0], top + 1, tb[3], R.crenel); P.set(tb[2], top + 1, tb[3], R.crenel);
    const cx = (tb[0] + tb[2]) >> 1; P.fill(cx, top + 1, tb[1] + 1, cx + 1, top + 2, tb[1] + 2, R.crenel); P.set(cx, top + 3, tb[1] + 1, R.crenel);
    P.prop('finial', cx, top + 3, tb[1] + 1, F.up, { c: 1 });                             // (the ostrich egg)
    for (let y = 5; y < top - 3; y += 4) P.opening(box, F.e, 2, y, 1, 2, { lintel: 0 }), P.opening(box, F.w, 2, y, 1, 2, { lintel: 0 });
    for (let y = 3; y < top - 2; y += 3) for (const f of [F.e, F.w]) { const p = P.onFace(box, f, 1); P.prop('toron', p.x, y, p.z, f); const q = P.onFace(box, f, 4); P.prop('toron', q.x, y, q.z, f); }
  }
  P.skin([2, 22, 31, 23], 6, 6, R.trim, (x) => (x % 2 ? R.trim : 0));                    // (a carved band across the facade)
  return P.finish();
}

function pueblo(seed) {
  const P = new Plan(32, 21, 22, seed), H = 4;
  const levels = [[0, 31, 21], [1 + P.int(0, 1), 29 - P.int(0, 1), 15], [4 + P.int(0, 2), 25 - P.int(0, 2), 10], [8 + P.int(0, 2), 21 - P.int(0, 2), 6], [11 + P.int(0, 2), 17, 3]];
  levels.forEach(([x0, x1, z1], k) => {
    const y0 = k * H, box = [x0, 0, x1, z1], wall = k === 4 ? R.lime : R.plaster;
    P.block(box, y0, y0 + H - 1, { role: wall, t: 1, roof: R.roofEarth, parapet: 1, bay: 6 });
    P.vigas(box, F.s, y0 + H - 1, 2, 1); P.vigas(box, F.e, y0 + H - 1, 3, 1); P.vigas(box, F.w, y0 + H - 1, 3, 1);
    for (let u = 2; u < x1 - x0 - 1; u += P.int(4, 6)) {
      if (P.chance(0.55)) { P.door(box, F.s, u, y0, 1, 2, { lintel: R.lintel }); if (P.chance(0.5)) P.prop('ristra', box[0] + u + 1, y0 + 2, z1, F.s); }
      else P.opening(box, F.s, u, y0 + 1, 1, 1, { frame: 0, lintel: 0, role: P.chance(0.3) ? R.shutter : 0 });
    }
    for (let u = 3; u < x1 - x0 - 2; u += P.int(5, 8)) { const p = P.onFace(box, F.s, u); P.prop('canale', p.x, y0 + H, p.z, F.s); }
    if (k > 0) { // ladders from the terrace below up this level's face
      for (let n = 0; n < 1 + P.int(0, 1); n++) { const u = P.int(1, x1 - x0 - 2); P.prop('ladder', x0 + u, y0, z1, F.s, { len: H + 2.2 }); }
    }
    if (k > 0 && k < 4 && P.chance(0.7)) { // a horno on the terrace below
      const tz = z1 + 2, tx = P.int(x0 + 1, x1 - 3), yb = y0;
      if (P.get(tx, yb - 1, tz) && P.get(tx + 1, yb - 1, tz + 1)) { P.fill(tx, yb, tz, tx + 1, yb, tz + 1, R.dome); P.set(tx, yb + 1, tz, R.dome); }
    }
  });
  // a smaller house block to the west, two storeys, the north house's kin
  P.block([0, 0, 4, 21], 0, 3, { role: R.plaster });
  P.prop('flag', 15, 20, 1, F.up, { c: 0 });
  return P.finish();
}

function kasbah(seed) {
  const P = new Plan(28, 27, 28, seed), wallTop = 12 + P.int(0, 1), towerTop = 22 + P.int(0, 2), rose = P.chance(0.6) ? R.rose : R.plaster;
  const band = (box, y0, y1) => P.skin(box, y0, y1, R.relief, (x, y, z) => ((x + z + y) % 4 === 0 || (x - z + y + 64) % 4 === 0 ? R.relief : 0));
  // the curtain walls
  for (const box of [[6, 0, 21, 1], [6, 26, 21, 27], [0, 6, 1, 21], [26, 6, 27, 21]]) {
    P.fill(box[0], 0, box[1], box[2], wallTop, box[3], rose);
    P.crenels(box, wallTop + 1, R.crenel);
  }
  // the gate in the south wall: a horseshoe arch framed in zellige
  P.opening([6, 26, 21, 27], F.s, 6, 0, 4, 6, { role: R.door, t: 2, arch: true, lintel: 0 });
  P.skin([10, 26, 17, 27], 0, 8, R.tile, (x, y) => ((x === 11 || x === 16 || y === 7 || y === 8) && P.roleAt(x, y, 27) !== R.door ? (y === 8 ? R.cobalt : R.tile) : 0));
  P.set(13, 8, 27, R.gold); P.set(14, 8, 27, R.gold);
  // the four towers, tapered, stepped merlons, carved bands
  for (const [x0, z0] of [[0, 0], [21, 0], [0, 21], [21, 21]]) {
    const box = [x0, z0, x0 + 6, z0 + 6], top = towerTop + P.int(-1, 1);
    const tb = P.tower(box, 0, top, { role: rose, t: 2, steps: [[10, 1]], storey: 4 });
    band(tb, top - 4, top - 2);
    P.crenels(tb, top + 1, R.crenel, { every: 2, step: 1 });
    for (let y = 6; y < top - 5; y += 5) for (const f of [F.s, F.n, F.e, F.w]) if (P.chance(0.5)) P.opening(tb, f, 2, y, 1, 2, { role: P.chance(0.5) ? R.lattice : 0, lintel: 0 });
    P.skin(tb, top - 1, top - 1, R.lime);
    for (const f of [F.s, F.n, F.e, F.w]) P.vigas(tb, f, top - 6, 2, 1);
  }
  // the keep in the court
  const keep = [9, 8, 18, 17], kTop = 18 + P.int(0, 2);
  const kb = P.tower(keep, 0, kTop, { role: rose, t: 2, steps: [[12, 1]], storey: 4 });
  band(kb, kTop - 3, kTop - 1); P.crenels(kb, kTop + 1, R.crenel, { every: 2, step: 1 });
  P.door(keep, F.s, 4, 0, 2, 3);
  for (let y = 5; y < kTop - 3; y += 4) P.windows(keep, F.s, y, { from: 2, every: 4, w: 1, h: 2, role: R.lattice, frame: R.trim });
  P.prop('flag', 13, kTop, 12, F.up, { c: 2 });
  return P.finish();
}

function shibam(seed) {
  const P = new Plan(26, 35, 18, seed);
  P.fill(0, 0, 0, 25, 0, 17, R.stone);                                                   // the plinth
  const towers = []; let x = 0;
  for (const [z0, z1] of [[0, 7], [9, 17]]) {
    x = P.int(0, 1);
    while (x < 21) { const w = P.int(5, 7); if (x + w - 1 > 25) break; towers.push([x, z0, x + w - 1, z1]); x += w + (P.chance(0.4) ? 1 : 0); }
  }
  towers.forEach((box, n) => {
    const top = (box[1] === 0 ? 24 : 17) + P.int(0, 9), lime = Math.round(top * (0.68 + P.rand(0, 0.12)));
    const tb = P.tower(box, 1, top, { role: R.plaster, t: 2, steps: [[Math.round(top * 0.55), 1]], storey: 3 });
    P.skin(box, 1, top, R.lime, (x2, y) => (y >= lime ? R.lime : 0));
    for (let y = 4; y < top - 1; y += 3) for (const f of [F.s, F.n, F.e, F.w]) {
      const len = f === F.s || f === F.n ? box[2] - box[0] + 1 : box[3] - box[1] + 1;
      for (let u = 2; u < len - 2; u += 2) P.opening(y >= Math.round(top * 0.55) ? tb : box, f, u, y, 1, 1, { lintel: 0, role: P.chance(0.15) ? R.shutter : 0 });
    }
    P.crenels(tb, top + 1, R.lime, { every: 2 });
    if (n % 3 === 1) P.prop('flag', tb[0] + 1, top + 1, tb[1], F.up, { c: 3 });
  });
  // bridges high up between a front tower and the one behind it
  for (const a of towers) for (const b of towers) {
    if (a[1] !== 0 || b[1] === 0 || a[2] < b[0] + 1 || b[2] < a[0] + 1) continue;
    const xm = Math.max(a[0], b[0]) + 1, y = 12 + ((xm * 7) % 6);
    if (P.get(xm, y, 7) && P.get(xm, y, 9)) { P.set(xm, y, 8, R.wood); P.set(xm, y + 1, 8, R.lattice); }
  }
  return P.finish();
}

function mission(seed) {
  const P = new Plan(24, 23, 34, seed), nTop = 11 + P.int(0, 1), tTop = 18 + P.int(0, 2);
  const nave = [7, 1, 16, 29];
  P.block(nave, 0, nTop, { role: R.plaster, t: 2, roof: R.roofEarth, parapet: 1, bay: 99 });
  P.block([3, 3, 20, 9], 0, nTop, { role: R.plaster, t: 2, roof: R.roofEarth, parapet: 1, bay: 99 });  // the transept
  for (let z = 12; z < 26; z += 5) for (const [x, xo] of [[6, 5], [17, 18]]) { P.fill(x, 0, z, x, nTop - 3, z + 2, R.plaster); P.fill(xo, 0, z, xo, nTop - 6, z + 2, R.plaster); } // (the stepped buttresses)
  for (let z = 12; z < 27; z += 5) { P.opening(nave, F.w, z - 1, 7, 1, 2, { role: R.glass, lintel: R.lintel }); }
  P.vigas(nave, F.w, nTop, 2, 1); P.vigas(nave, F.e, nTop, 2, 1);
  // the facade between the towers: lime-washed, a curved espadaña over it holding two bells
  const fac = [7, 29, 16, 30];
  P.fill(7, 0, 29, 16, nTop + 3, 30, R.lime);
  for (let x = 7; x <= 16; x++) { const k = Math.cos(((x - 11.5) / 5.5) * (Math.PI / 2)), top = nTop + 3 + Math.round(5 * Math.max(0, k)); P.fill(x, nTop + 4, 29, x, top, 30, R.lime); }
  P.opening(fac, F.s, 3, nTop + 4, 1, 2, { lintel: 0, t: 2 }); P.opening(fac, F.s, 6, nTop + 4, 1, 2, { lintel: 0, t: 2 });
  P.prop('bell', 10, nTop + 6, 30, F.s); P.prop('bell', 13, nTop + 6, 30, F.s);
  P.prop('cross', 11, nTop + 9, 30, F.up);
  P.opening(fac, F.s, 3, 0, 4, 5, { role: R.door, t: 2, arch: true, frame: R.trim });
  P.opening(fac, F.s, 4, 7, 2, 2, { t: 2, lintel: R.lintel, frame: R.trim });             // (the choir loft's window)
  P.skin(fac, nTop + 2, nTop + 2, R.tile);
  // the twin bell towers
  for (const x0 of [1, 17]) {
    const box = [x0, 28, x0 + 5, 33];
    const tb = P.tower(box, 0, tTop, { role: R.lime, t: 2, steps: [[tTop - 5, 1]], storey: 4 });
    for (const f of [F.s, F.e, F.w, F.n]) P.opening(tb, f, 1, tTop - 3, 2, 3, { arch: true, lintel: 0, t: 2 });
    P.prop('bell', Math.round((tb[0] + tb[2]) / 2), tTop, Math.round((tb[1] + tb[3]) / 2), F.s);
    P.skin(box, tTop - 6, tTop - 6, R.tile);
    const top = P.dome((tb[0] + tb[2]) / 2, (tb[1] + tb[3]) / 2, 1.8, tTop + 1, R.dome, { t: 1, k: 1 });
    P.prop('cross', Math.round((tb[0] + tb[2]) / 2), top, Math.round((tb[1] + tb[3]) / 2), F.up);
  }
  // the cloister's arcade along the east of the nave
  const arc = [17, 10, 20, 27];
  P.fill(20, 0, 10, 20, 4, 27, R.plaster);
  for (let z = 11; z < 26; z += 3) P.opening([20, 10, 20, 27], F.e, 27 - z - 1, 0, 2, 3, { arch: true, lintel: 0 });
  P.slab(17, 10, 19, 27, 4, R.roofEarth); P.vigas(arc, F.e, 4, 2, 1);
  P.fill(17, 0, 10, 20, 0, 10, R.plaster); P.fill(17, 0, 27, 20, 4, 27, R.plaster);
  return P.finish();
}

export const LARGE = {
  djenne: { label: 'Great mosque', size: 'large', w: 34, d: 26, plan: djenne },
  pueblo: { label: 'Terraced pueblo', size: 'large', w: 32, d: 22, plan: pueblo },
  kasbah: { label: 'Kasbah', size: 'large', w: 28, d: 28, plan: kasbah },
  shibam: { label: 'Tower houses', size: 'large', w: 26, d: 18, plan: shibam },
  mission: { label: 'Mission church', size: 'large', w: 24, d: 34, plan: mission },
};
