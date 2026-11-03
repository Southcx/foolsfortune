// ---------------------------------------------------------------------------------------
// THE ADOBE CITY'S SMALL BLUEPRINTS (plain names; South, 2026-11-03): ten small earthen things of 3 to 10 cells, the city's grain, drawn
// with the blueprint kit (vfx/mechs/city/blueprintkit.js), seeded, settled so each stands at build; the front is +z. From where:
//   horno      the Pueblo beehive oven (Taos, Acoma): a domed oven on a slab, its mouth and smoke hole
//   musgum     the Musgum's teleuk (Cameroon, the Logone): a tall shell-shaped hut of corbelled mud, ribbed with raised chevrons
//   wellhouse  a covered well (the Maghreb's and Persia's): four piers and arches under a little dome, a stone curb, a zellige band
//   souk       a souk's market stall: an adobe counter, posts and a slatted roof under striped cloth, goods on the counter
//   shrine     a wayside shrine (a Sahelian mud shrine, a New Mexican descanso's nicho): a stepped block, a niche framed in gold,
//              three pinnacles, an egg finial
//   granary    a Dogon granary (Bandiagara, Mali): a square mud body raised on stone feet, a carved shutter, a cone of thatch
//   kiosk      a garden pavilion (a köşk, Isfahan's and Fez's): four piers and arches on a stone plinth under a stepped tiled roof
//   dovecote   an Isfahan pigeon tower (the Safavid kabootar-khaneh): a fat drum honeycombed with nest holes, a narrower turret on
//              it with four little turrets round its foot, a lime-washed band
//   gatewall   a wall segment with a gate: a crenellated length of rose wall, an arched door, a tile plaque over it, buttresses
//   jars       a water-jar platform (the sabil, the tinaja stands of New Mexico): a stone base with a plaster step, jars on it, a
//              shade post and its cloth
//
//   SMALL[id] = { label, size: 'small', w, d, plan(seed) -> Plan.finish() }
// ---------------------------------------------------------------------------------------
import { Plan, ROLE as R, FACE as F } from './blueprintkit.js';

function horno(seed) {
  const P = new Plan(5, 5, 5, seed);
  P.fill(0, 0, 0, 4, 0, 4, R.stone);
  P.ring(2, 2, 2.2, 1, R.dome, 1); P.ring(2, 2, 1.8, 2, R.dome, 1); P.ring(2, 2, 1.2, 3, R.dome, 0); P.set(2, 4, 2, R.dome);
  P.set(2, 1, 4, 0); P.set(2, 1, 3, 0);                                                  // (its mouth)
  if (P.chance(0.5)) P.prop('pot', 0, 0, 4, F.up, { c: 2 });
  return P.finish();
}

function musgum(seed) {
  const P = new Plan(7, 11, 7, seed), H = 9 + P.int(0, 1);
  for (let y = 0; y <= H; y++) {
    const r = 3.2 * Math.pow(Math.max(0, 1 - y / (H + 0.8)), 0.62);
    P.ring(3, 3, Math.max(0.4, r), y, R.plaster, y < 4 ? 2 : r < 1.6 ? 0 : 1);
  }
  P.skin([0, 0, 6, 6], 0, H, 0, (x, y, z) => { const a = Math.round((Math.atan2(z - 3, x - 3) / Math.PI) * 6 + 6); return (a + y) % 2 === 0 && y % 2 === 0 ? R.relief : 0; });
  P.set(3, 0, 6, 0); P.set(3, 1, 6, 0); P.set(3, 0, 5, 0); P.set(3, 1, 5, 0); P.set(3, 2, 6, 0); // (its keyhole door)
  return P.finish();
}

function wellhouse(seed) {
  const P = new Plan(6, 9, 6, seed), top = 4;
  for (const [x, z] of [[0, 0], [4, 0], [0, 4], [4, 4]]) P.fill(x, 0, z, x + 1, top - 1, z + 1, R.plaster);
  P.walls(0, 0, 5, 5, top, top, R.trim, 1); P.slab(1, 1, 4, 4, top, R.dome);
  P.skin([0, 0, 5, 5], top, top, R.tile, (x, y, z) => ((x + z) % 2 ? R.tile : R.cobalt));
  P.dome(2.5, 2.5, 2.4, top + 1, R.dome, { t: 2, k: 1.2, finial: 0 });
  P.ring(2.5, 2.5, 1.2, 0, R.stone, 1); P.ring(2.5, 2.5, 1.2, 1, R.stone, 1);             // the well's curb
  P.prop('finial', 2, 8, 2, F.up, { c: 0 });
  P.prop('pot', 1, 1, 2, F.up, { c: 3 });
  return P.finish();
}

function souk(seed) {
  const P = new Plan(7, 6, 6, seed);
  P.fill(0, 0, 0, 6, 3, 0, R.plaster);
  P.fill(1, 0, 3, 5, 1, 3, R.plaster); P.paint(1, 1, 3, 5, 1, 3, R.trim);
  for (const x of [0, 6]) { P.fill(x, 0, 4, x, 3, 4, R.wood); P.fill(x, 0, 1, x, 3, 3, R.plaster); }
  P.fill(0, 4, 0, 6, 4, 4, R.wood);
  const c = P.int(0, 3);
  for (let x = 0; x <= 6; x++) P.fill(x, 5, 0, x, 5, 4, R.awning), x % 2 && P.paint(x, 5, 0, x, 5, 4, R.awning);
  P.prop('awning', 3, 4, 4, F.s, { c, len: 6 });
  for (let x = 1; x <= 5; x++) if (P.chance(0.7)) P.set(x, 2, 3, R.goods);
  P.prop('pot', 1, 2, 3, F.up, { c }); P.prop('pot', 5, 2, 3, F.up, { c: c + 1 });
  P.prop('rug', 3, 2, 0, F.s, { c });
  return P.finish();
}

function shrine(seed) {
  const P = new Plan(5, 9, 5, seed);
  P.fill(0, 0, 0, 4, 0, 4, R.stone);
  P.fill(1, 1, 1, 3, 4, 3, R.plaster);
  P.set(2, 2, 3, 0); P.set(2, 3, 3, 0);                                                  // the niche
  P.set(1, 2, 3, R.gold); P.set(3, 2, 3, R.gold); P.set(1, 3, 3, R.gold); P.set(3, 3, 3, R.gold); P.set(2, 4, 3, R.gold);
  P.fill(1, 5, 1, 1, 5, 1, R.crenel); P.fill(3, 5, 1, 3, 5, 1, R.crenel); P.fill(2, 5, 2, 2, 6 + P.int(0, 1), 2, R.crenel);
  P.set(1, 5, 3, R.crenel); P.set(3, 5, 3, R.crenel);
  const top = P.get(2, 7, 2) ? 7 : 6; P.prop('finial', 2, top, 2, F.up, { c: 1 });
  P.prop('pot', 2, 1, 3, F.up, { c: 4, s: 0.5 });
  P.prop('pot', 0, 0, 4, F.up, { c: 2 });
  return P.finish();
}

function granary(seed) {
  const P = new Plan(6, 9, 6, seed);
  for (const [x, z] of [[1, 1], [4, 1], [1, 4], [4, 4]]) P.set(x, 0, z, R.stone);
  P.walls(1, 1, 4, 4, 1, 4, R.plaster, 1); P.slab(2, 2, 3, 3, 1, R.floor);
  P.set(2, 2, 4, R.shutter); P.set(3, 2, 4, R.shutter);
  P.fill(0, 5, 0, 5, 5, 5, R.thatch); for (const [x, z] of [[0, 0], [5, 0], [0, 5], [5, 5]]) P.set(x, 5, z, 0);
  P.fill(1, 6, 1, 4, 6, 4, R.thatch); P.fill(2, 7, 2, 3, 7, 3, R.thatch);
  if (P.chance(0.6)) P.set(2, 8, 2, R.thatch);
  return P.finish();
}

function kiosk(seed) {
  const P = new Plan(6, 10, 6, seed), top = 5;
  P.fill(0, 0, 0, 5, 0, 5, R.stone);
  for (const [x, z] of [[0, 0], [5, 0], [0, 5], [5, 5]]) P.fill(x, 1, z, x, top - 1, z, R.lime);
  for (const f of [F.s, F.n, F.e, F.w]) { const p = P.onFace([0, 0, 5, 5], f, 1), q = P.onFace([0, 0, 5, 5], f, 4); P.set(p.x, top - 1, p.z, R.lime); P.set(q.x, top - 1, q.z, R.lime); } // (the arches' shoulders)
  P.walls(0, 0, 5, 5, top, top, R.lime, 1); P.slab(1, 1, 4, 4, top, R.floor);
  P.fill(0, top + 1, 0, 5, top + 1, 5, R.tile); P.fill(1, top + 2, 1, 4, top + 2, 4, R.cobalt); P.fill(2, top + 3, 2, 3, top + 3, 3, R.tile);
  P.set(2, top + 4, 2, R.gold); P.prop('finial', 2, top + 4, 2, F.up, { c: 0 });
  P.fill(1, 1, 1, 1, 1, 4, R.goods);                                                     // (a bench)
  return P.finish();
}

function dovecote(seed) {
  const P = new Plan(10, 15, 10, seed), dt = 6 + P.int(0, 1), tt = dt + 4;
  P.cyl(4.5, 4.5, 4.4, 0, dt, R.plaster, 2);
  P.ring(4.5, 4.5, 2.6, dt, R.floor, 0);
  P.cyl(4.5, 4.5, 2.8, dt + 1, tt, R.plaster, 1);
  P.dome(4.5, 4.5, 2.8, tt + 1, R.dome, { t: 1, k: 0.9 });
  for (const [x, z] of [[1, 1], [8, 1], [1, 8], [8, 8]]) if (P.get(x, dt, z)) { P.fill(x, dt + 1, z, x, dt + 2, z, R.plaster); P.set(x, dt + 3, z, R.dome); }
  for (let y = 3; y <= tt; y += 2) for (let z = 0; z < 10; z++) for (let x = 0; x < 10; x++) {
    if (!P.get(x, y, z) || (x + z + y) % 2) continue;
    const out = !P.get(x + 1, y, z) || !P.get(x - 1, y, z) || !P.get(x, y, z + 1) || !P.get(x, y, z - 1);
    const inner = Math.hypot(x - 4.5, z - 4.5) < (y > dt ? 2.1 : 3.4);
    if (out && !inner && y < tt) P.set(x, y, z, 0);                                     // (a nest hole)
  }
  P.skin([0, 0, 9, 9], dt, dt, R.lime); P.skin([0, 0, 9, 9], 2, 2, R.relief, (x, y, z) => ((x + z) % 2 ? R.relief : 0));
  P.set(4, 0, 9, R.door); P.set(4, 1, 9, R.door);
  return P.finish();
}

function gatewall(seed) {
  const P = new Plan(10, 7, 3, seed), top = 4;
  P.fill(0, 0, 0, 9, top, 1, R.rose);
  P.crenels([0, 0, 9, 1], top + 1, R.crenel, { every: 2 });
  P.opening([0, 0, 9, 1], F.s, 4, 0, 2, 3, { role: R.door, t: 2, lintel: R.lintel });
  P.skin([3, 0, 6, 1], top, top, R.tile, (x, y, z) => (z === 1 ? R.tile : 0));
  P.set(4, top, 1, R.cobalt); P.set(5, top, 1, R.cobalt);
  for (const x of [0, 9]) P.fill(x, 0, 2, x, 2, 2, R.rose);
  P.prop('flag', 0, top + 1, 0, F.up, { c: P.int(0, 4) });
  return P.finish();
}

function jars(seed) {
  const P = new Plan(6, 5, 6, seed);
  P.fill(0, 0, 0, 5, 0, 5, R.stone); P.fill(1, 1, 1, 4, 1, 4, R.trim);
  P.fill(0, 1, 0, 5, 2, 0, R.plaster); P.set(2, 2, 0, R.tile); P.set(3, 2, 0, R.tile);
  for (const [x, z] of [[1, 2], [2, 3], [3, 2], [4, 3], [2, 1], [4, 1]]) if (P.chance(0.8)) P.prop('jar', x, 1, z, F.up, { c: (x + z) % 4 });
  P.fill(5, 1, 5, 5, 3, 5, R.wood); P.prop('awning', 5, 3, 5, F.n, { c: P.int(0, 4), len: 2 });
  return P.finish();
}

export const SMALL = {
  horno: { label: 'Horno oven', size: 'small', w: 5, d: 5, plan: horno },
  musgum: { label: 'Shell hut', size: 'small', w: 7, d: 7, plan: musgum },
  wellhouse: { label: 'Well house', size: 'small', w: 6, d: 6, plan: wellhouse },
  souk: { label: 'Market stall', size: 'small', w: 7, d: 6, plan: souk },
  shrine: { label: 'Wayside shrine', size: 'small', w: 5, d: 5, plan: shrine },
  granary: { label: 'Raised granary', size: 'small', w: 6, d: 6, plan: granary },
  kiosk: { label: 'Kiosk', size: 'small', w: 6, d: 6, plan: kiosk },
  dovecote: { label: 'Pigeon tower', size: 'small', w: 10, d: 10, plan: dovecote },
  gatewall: { label: 'Wall and gate', size: 'small', w: 10, d: 3, plan: gatewall },
  jars: { label: 'Water jars', size: 'small', w: 6, d: 6, plan: jars },
};
