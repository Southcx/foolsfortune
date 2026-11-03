// ---------------------------------------------------------------------------------------
// THE ADOBE CITY'S LOTS (plain names; South, 2026-11-03: "a healthy dense mixture of large, medium, and small destructible structures"):
// a proposal for Dovina's CITY.lots (progress/mechs/destruction.js) laid with the adobe blueprints (vfx/mechs/city/blueprints.js): many
// small, several medium and a few large, packed in rows either side of the street from the launch (x -130) past the straw giant (x 70)
// to the east wall, the alleys 2 m and more, every one facing the street (yaw 0 north of it, yaw pi south). What stays clear (KEEP):
// the street itself (|z| under 14, the mech skating through), four cross lanes 10 m wide, the launch's circle, the giant's yard, the
// sockets, the knee-high blocks, the boxing ring, the smash challenges' lane on the north strip, the door in the west wall. Laid once by
// a seeded packer and written here as plain data, so a lot can be moved by hand; `lotsClear()` says what overlaps or stands in the way.
// Prior art: Dovina's CITY.lots (a lot a building's middle, metres from PROVING.at), the medina's and the pueblo's dense grain (Fez el
// Bali, Taos), SimCity's zoned lots along a road, Rampage's and Ultimate Destruction's streets lined both sides.
//
//   ADOBE_LOTS [{ x, z, id, yaw?, seed }]   KEEP   lotBox(L) -> [x0, z0, x1, z1]   lotsClear(lots = ADOBE_LOTS) -> [problem]   lotCounts()
// ---------------------------------------------------------------------------------------
import { ADOBE } from './blueprints.js';
import { PROVING } from '../../../world/hangar/layout.js';

/** What the lots keep clear (local metres from PROVING.at): the street's half width, the cross lanes (x) and their half width, the yard's
 *  edge, the launch's circle, the giant's yard, a socket's and a block's and the ring's margins, the north strip's edge (the lane), the
 *  door's box, and the alley between two lots. */
export const KEEP = {
  street: 14, lanes: [-96, -40, 18, 122], lane: 5, edge: 165, launch: { x: -130, z: 0, r: 24 }, giant: { x0: 28, x1: 112, z: 40 },
  sockets: 12, block: 2, ring: 4, north: -128, door: { x0: -180, x1: -160, z0: -75, z1: -45 }, alley: 2,
};

export const ADOBE_LOTS = [
    { x: -157.5, z: -19.5, id: 'horno', seed: 1 }, { x: -110, z: -20, id: 'granary', seed: 2 }, { x: -87.5, z: -20.5, id: 'musgum', seed: 3 }, { x: -70, z: -20.5, id: 'ksar', seed: 4 },
    { x: -54, z: -20, id: 'granary', seed: 5 }, { x: -20.5, z: -17.5, id: 'horno', seed: 6 }, { x: -6, z: -20.5, id: 'bazaar', seed: 7 }, { x: 10.5, z: -19.5, id: 'shrine', seed: 8 },
    { x: 114.5, z: -19.5, id: 'shrine', seed: 9 }, { x: 141, z: -29, id: 'kasbah', seed: 10 }, { x: -153.5, z: -54.5, id: 'ghorfa', seed: 11 }, { x: -139, z: -50, id: 'wellhouse', seed: 12 },
    { x: -130, z: -51, id: 'wellhouse', seed: 13 }, { x: -113, z: -52, id: 'gate', seed: 14 }, { x: -78, z: -51, id: 'jars', seed: 15 }, { x: -59, z: -66, id: 'mission', seed: 16 },
    { x: -29, z: -53, id: 'dovecote', seed: 17 }, { x: -10, z: -50.5, id: 'ksar', seed: 18 }, { x: 7.5, z: -50, id: 'souk', seed: 19 }, { x: 41, z: -59, id: 'pueblo', seed: 20 },
    { x: 64.5, z: -50.5, id: 'shrine', seed: 21 }, { x: 73, z: -52, id: 'wellhouse', seed: 22 }, { x: 93, z: -64, id: 'mission', seed: 23 }, { x: 130, z: -51, id: 'kiosk', seed: 24 },
    { x: 141.5, z: -52.5, id: 'ghorfa', seed: 25 }, { x: 156, z: -52, id: 'kiosk', seed: 26 }, { x: -160.5, z: -91.5, id: 'horno', seed: 27 }, { x: -151, z: -92, id: 'kiosk', seed: 28 },
    { x: -141.5, z: -90.5, id: 'shrine', seed: 29 }, { x: -121, z: -97, id: 'shibam', seed: 30 }, { x: -88.5, z: -91.5, id: 'shrine', seed: 31 }, { x: -76, z: -94, id: 'dovecote', seed: 32 },
    { x: -63.5, z: -89.5, id: 'shrine', seed: 33 }, { x: -52, z: -94, id: 'dovecote', seed: 34 }, { x: -31.5, z: -91, id: 'souk', seed: 35 }, { x: -19.5, z: -91.5, id: 'horno', seed: 36 },
    { x: -9.5, z: -90.5, id: 'musgum', seed: 37 }, { x: 27.5, z: -91, id: 'souk', seed: 38 }, { x: 39, z: -92, id: 'dovecote', seed: 39 }, { x: 54.5, z: -93.5, id: 'ghorfa', seed: 40 },
    { x: 68, z: -91, id: 'kiosk', seed: 41 }, { x: 78.5, z: -90.5, id: 'horno', seed: 42 }, { x: 89, z: -93, id: 'dovecote', seed: 43 }, { x: 101, z: -90, id: 'kiosk', seed: 44 },
    { x: 111, z: -90, id: 'granary', seed: 45 }, { x: 135, z: -97, id: 'courtyard', seed: 46 }, { x: 150, z: -92, id: 'kiosk', seed: 47 }, { x: 161, z: -92, id: 'granary', seed: 48 },
    { x: -160, z: -114, id: 'granary', seed: 49 }, { x: -138, z: -113.5, id: 'gatewall', seed: 50 }, { x: -128, z: -114, id: 'wellhouse', seed: 51 }, { x: -110, z: -115, id: 'gate', seed: 52 },
    { x: -82, z: -116, id: 'gate', seed: 53 }, { x: -64, z: -117, id: 'hausa', seed: 54 }, { x: -51, z: -114, id: 'granary', seed: 55 }, { x: -31.5, z: -113, id: 'souk', seed: 56 },
    { x: -16, z: -116, id: 'hausa', seed: 57 }, { x: 2, z: -118, id: 'badgir', seed: 58 }, { x: 30, z: -118, id: 'badgir', seed: 59 }, { x: 44, z: -113.5, id: 'gatewall', seed: 60 },
    { x: 58, z: -117.5, id: 'casa', seed: 61 }, { x: 72, z: -114, id: 'jars', seed: 62 }, { x: 86, z: -118, id: 'badgir', seed: 63 }, { x: 104, z: -115, id: 'hausa', seed: 64 },
    { x: 134, z: -112.5, id: 'gatewall', seed: 65 }, { x: 149, z: -116, id: 'dovecote', seed: 66 }, { x: 161.5, z: -113.5, id: 'musgum', seed: 67 }, { x: -162.5, z: 17.5, id: 'horno', yaw: Math.PI, seed: 68 },
    { x: -153, z: 18, id: 'jars', yaw: Math.PI, seed: 69 }, { x: -110, z: 20, id: 'wellhouse', yaw: Math.PI, seed: 70 }, { x: -84, z: 21, id: 'badgir', yaw: Math.PI, seed: 71 }, { x: -70, z: 19, id: 'wellhouse', yaw: Math.PI, seed: 72 },
    { x: -60.5, z: 18.5, id: 'musgum', yaw: Math.PI, seed: 73 }, { x: -51, z: 18, id: 'jars', yaw: Math.PI, seed: 74 }, { x: -30.5, z: 20, id: 'souk', yaw: Math.PI, seed: 75 }, { x: -20.5, z: 18.5, id: 'musgum', yaw: Math.PI, seed: 76 },
    { x: -9.5, z: 19, id: 'souk', yaw: Math.PI, seed: 77 }, { x: 5, z: 22.5, id: 'casa', yaw: Math.PI, seed: 78 }, { x: 130.5, z: 19.5, id: 'musgum', yaw: Math.PI, seed: 79 }, { x: 146, z: 19.5, id: 'ksar', yaw: Math.PI, seed: 80 },
    { x: -155, z: 39, id: 'gate', yaw: Math.PI, seed: 81 }, { x: -124, z: 46, id: 'djenne', yaw: Math.PI, seed: 82 }, { x: -56, z: 34.5, id: 'gatewall', yaw: Math.PI, seed: 83 }, { x: -23, z: 38.5, id: 'bazaar', yaw: Math.PI, seed: 84 },
    { x: -3, z: 33.5, id: 'gatewall', yaw: Math.PI, seed: 85 }, { x: 133, z: 39.5, id: 'casa', yaw: Math.PI, seed: 86 }, { x: 151, z: 38.5, id: 'bazaar', yaw: Math.PI, seed: 87 }, { x: -156.5, z: 69.5, id: 'ghorfa', yaw: Math.PI, seed: 88 },
    { x: -135, z: 67.5, id: 'bazaar', yaw: Math.PI, seed: 89 }, { x: -116, z: 70.5, id: 'casa', yaw: Math.PI, seed: 90 }, { x: -88, z: 66, id: 'jars', yaw: Math.PI, seed: 91 }, { x: -68, z: 78, id: 'kasbah', yaw: Math.PI, seed: 92 },
    { x: -48, z: 67, id: 'jars', yaw: Math.PI, seed: 93 }, { x: -26, z: 69, id: 'hausa', yaw: Math.PI, seed: 94 }, { x: -3, z: 72, id: 'shibam', yaw: Math.PI, seed: 95 }, { x: 45, z: 64.5, id: 'gatewall', yaw: Math.PI, seed: 96 },
    { x: 70, z: 68.5, id: 'ksar', yaw: Math.PI, seed: 97 }, { x: 98, z: 72, id: 'courtyard', yaw: Math.PI, seed: 98 }, { x: 148, z: 71, id: 'courtyard', yaw: Math.PI, seed: 99 }, { x: -81, z: 105, id: 'courtyard', yaw: Math.PI, seed: 100 },
    { x: 41, z: 128, id: 'pueblo', yaw: Math.PI, seed: 101 },
];

/** A lot's footprint (its blueprint's w and d about its middle; a yaw of pi turns it in place). */
export const lotBox = (L) => { const K = ADOBE[L.id]; return [L.x - K.w / 2, L.z - K.d / 2, L.x + K.w / 2, L.z + K.d / 2]; };

/** What is wrong with a set of lots: an unknown kind, a lot over something KEEP holds clear, or two lots closer than an alley. */
export function lotsClear(lots = ADOBE_LOTS) {
  const out = [], K = KEEP, boxes = lots.map(lotBox);
  lots.forEach((L, n) => {
    if (!ADOBE[L.id]) { out.push(`${n} ${L.id}: no such blueprint`); return; }
    const [x0, z0, x1, z1] = boxes[n], say = (why) => out.push(`${n} ${L.id} at ${L.x}, ${L.z}: ${why}`);
    const near = (cx, cz, r) => Math.hypot(Math.max(x0, Math.min(x1, cx)) - cx, Math.max(z0, Math.min(z1, cz)) - cz) < r;
    const over = (a0, b0, a1, b1, m = 0) => x1 > a0 - m && x0 < a1 + m && z1 > b0 - m && z0 < b1 + m;
    if (x0 < -K.edge || x1 > K.edge || z0 < -K.edge || z1 > K.edge) say('past the yard\'s edge');
    if (z1 > -K.street && z0 < K.street) say('in the street');
    if (z0 < K.north) say('on the challenges\' lane');
    for (const x of K.lanes) if (x1 > x - K.lane && x0 < x + K.lane) say(`in the cross lane at x ${x}`);
    if (near(K.launch.x, K.launch.z, K.launch.r)) say('on the launch');
    if (over(K.giant.x0, -K.giant.z, K.giant.x1, K.giant.z)) say('in the giant\'s yard');
    for (const s of PROVING.sockets) if (near(s.x, s.z, K.sockets)) say('on a socket');
    for (const B of PROVING.blocks) if (over(B.x - B.w / 2, B.z - B.d / 2, B.x + B.w / 2, B.z + B.d / 2, K.block)) say('on a block');
    const R = PROVING.ring; if (over(R.x - R.half, R.z - R.half, R.x + R.half, R.z + R.half, K.ring)) say('on the ring');
    if (over(K.door.x0, K.door.z0, K.door.x1, K.door.z1)) say('at the door');
    for (let m = 0; m < n; m++) { const b = boxes[m]; if (over(b[0], b[1], b[2], b[3], K.alley)) say(`against lot ${m}`); }
  });
  return out;
}

/** How many lots of each size (and of each kind). */
export function lotCounts(lots = ADOBE_LOTS) {
  const size = { large: 0, medium: 0, small: 0 }, kind = {};
  for (const L of lots) { const K = ADOBE[L.id]; if (!K) continue; size[K.size]++; kind[L.id] = (kind[L.id] || 0) + 1; }
  return { size, kind, n: lots.length };
}
