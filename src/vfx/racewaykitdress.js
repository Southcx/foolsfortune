// ---------------------------------------------------------------------------------------
// THE RACEWAY KIT'S DRESS: a track's lone columns, walls and arches (Dovina's kit, world/raceway/kit.js kitOf: `features.columns`,
// `walls`, `arches`, clay placeholders with their colliders) dressed in the park's glazed stone and gold, as the bridge decks are
// (vfx/racewaypark.js). Each dressed piece is a shell laid just outside her placeholder on every side, so the placeholder never shows
// and no face of the two is coplanar (nothing to crawl); her colliders stay as they are, a few centimetres inside the look.
//   A COLUMN    a plinth, three clay drums of the Dunes' strata with a gold band between each, an amber-glazed capital and its dark
//               abacus (the slalom's broken column made whole)
//   A WALL      three courses of clay, a pale coping with a gold band under it, an end pier each side with a dark cap
//   AN ARCH     two posts on plinths with gold bands and capitals, and a lintel in the rails' amber ame glaze over an iron-dark drip
//               line, a gold band along its face, a pale coping, a sun's boss at its middle; deep enough to hold her posts' caps
// One painted geometry a track's pieces, into a builder's `add(geo, colour)` (the park's stone batch, or a made track's own: the kit's
// program, vertex colours, flat, no program added).
//
// Prior art: the house's own decks and ruin pillars (vfx/racewaypark.js, world/raceway/kit.js); the Roman triumphal arch's attic and
// the Doric column's drums, abacus and echinus; a sixth-generation level's dressing laid over its collision (the blockout kept, the
// look a shell round it).
//
//   kitDress(R, T, out)   out.add(geo, colour) (vfx/racewaypark.js Tris)   KIT_DRESS (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The numbers: how far outside her placeholder the shell stands (a share of its size, and metres at least); the colours. */
export const KIT_DRESS = {
  out: 1.06, pad: 0.06,
  colour: { strata: [0xd9906a, 0xc07a48, 0xa8643a], gold: 0xffd696, ame: 0xb8692e, drip: 0x4a2414, coping: 0xf0d6b0, cap: 0x8a4a3a, plinth: 0x8a4a3a, boss: 0xf6c04e },
};
const C = KIT_DRESS.colour;
const sideOf = (R, T, s, lat) => { const F = T.frame(s); return R.local(F.x - F.fz * lat, F.z + F.fx * lat); };
const yawAt = (T, s) => { const F = T.frame(s); return Math.atan2(F.fx, F.fz); };

/** A box (w x h x d) whose foot is at y0, turned by `yaw` and moved to (x, z). */
const box = (w, h, d, x, y0, z, yaw = 0) => new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0).rotateY(yaw).translate(x, y0, z);
const drum = (r0, r1, h, x, y0, z, seg = 12, turn = 0) => new THREE.CylinderGeometry(r1, r0, h, seg).rotateY(turn).translate(x, y0 + h / 2, z);

/** One track's columns, walls and arches, dressed into `out`. */
export function kitDress(R, T, out) {
  const F0 = T.features || {}, K = KIT_DRESS;
  // a lone column (kit.js column: a cylinder of radius w at its foot, 0.8 w at its top, h tall from 0.6 m under the ground; 8 sides)
  (F0.columns || []).forEach((Cl, k) => {
    const p = sideOf(R, T, T.sOf(Cl.cp, Cl.at), Cl.lat || 0), h = Cl.h ?? 6, w = Cl.r ?? 1.3, y0 = p.y - 0.6, top = y0 + h;
    out.add(drum(w * 1.3, w * 1.25, 0.95, p.x, y0, p.z, 12, k), C.plinth);
    const n = 3; for (let i = 0; i < n; i++) {
      const a = y0 + 0.9 + ((h - 0.9) * i) / n, b = y0 + 0.9 + ((h - 0.9) * (i + 1)) / n, ra = w * (1 - (0.2 * (a - y0)) / h), rb = w * (1 - (0.2 * (b - y0)) / h);
      out.add(drum(ra * K.out + K.pad, rb * K.out + K.pad, b - a, p.x, a, p.z, 12, k + i * 0.4), C.strata[(i + k) % 3]);
      if (i) out.add(drum(ra * K.out + 0.14, ra * K.out + 0.14, 0.22, p.x, a - 0.11, p.z, 12), C.gold);
    }
    out.add(drum(w * 0.9, w * 1.15, 0.5, p.x, top - 0.05, p.z, 12), C.ame);
    out.add(box(w * 2.3, 0.4, w * 2.3, p.x, top + 0.45, p.z, k), C.cap);
    out.add(box(w * 2.36, 0.12, w * 2.36, p.x, top + 0.42, p.z, k), C.gold);
  });
  // a wall across part of the line (kit.js: a box 2w by h by 0.9, its foot 0.3 m under the ground, broadside to the line)
  for (const Wl of F0.walls || []) {
    const s = T.sOf(Wl.cp, Wl.at), p = sideOf(R, T, s, Wl.lat || 0), w = Wl.w ?? 5, h = Wl.h ?? 3, yaw = yawAt(T, s) + Math.PI / 2, y0 = p.y - 0.4, top = p.y - 0.3 + h;
    for (let i = 0; i < 3; i++) out.add(box(w * 2 + 0.14 - 0.06 * i, (top - y0) / 3 + 0.02, 1.12, p.x, y0 + ((top - y0) * i) / 3, p.z, yaw), C.strata[i]);
    out.add(box(w * 2 + 0.3, 0.14, 1.2, p.x, top - 0.12, p.z, yaw), C.gold);
    out.add(box(w * 2 + 0.6, 0.34, 1.5, p.x, top + 0.02, p.z, yaw), C.coping);
    const ax = Math.cos(yaw), az = -Math.sin(yaw); // (the wall's own x, along it)
    for (const sg of [-1, 1]) { const x = p.x + ax * sg * (w + 0.4), z = p.z + az * sg * (w + 0.4);
      out.add(box(1.3, top - y0 + 0.6, 1.7, x, y0, z, yaw), C.strata[2]);
      out.add(box(1.36, 0.16, 1.76, x, top - 0.1, z, yaw), C.gold);
      out.add(new THREE.ConeGeometry(1.05, 1.0, 4).rotateY(Math.PI / 4 + yaw).translate(x, top + 1.0, z), C.cap); }
  }
  // an arch to thread (kit.js: two ruin pillars 1.6 m square at lat -/+ w, their tops 7 m over the higher foot and their caps 1.76 m over
  // that; a lintel 2w + 2 by 1.2 by 1.8 over them)
  for (const Ar of F0.arches || []) {
    const s = T.sOf(Ar.cp, Ar.at), w = Ar.w ?? 5, yaw = yawAt(T, s), a = sideOf(R, T, s, (Ar.lat || 0) - w), b = sideOf(R, T, s, (Ar.lat || 0) + w), top = Math.max(a.y, b.y) + 7;
    for (const q of [a, b]) {
      const y0 = q.y - 1.5;
      out.add(box(2.5, 1.9, 2.5, q.x, y0, q.z, yaw), C.plinth);
      out.add(box(1.6 * K.out + 0.08, top - y0 - 0.1, 1.6 * K.out + 0.08, q.x, y0 + 0.3, q.z, yaw), C.strata[0]);
      for (const f of [0.38, 0.72]) out.add(box(1.86, 0.24, 1.86, q.x, q.y + (top - q.y) * f, q.z, yaw), C.gold);
      out.add(box(2.3, 0.5, 2.3, q.x, top - 0.45, q.z, yaw), C.strata[1]);
    }
    const mid = a.clone().add(b).multiplyScalar(0.5), len = a.distanceTo(b.clone().setY(a.y)) + 2.3, ly = yaw + Math.PI / 2;
    out.add(box(len, 0.24, 2.06, mid.x, top - 0.12, mid.z, ly), C.drip);
    out.add(box(len, 2.0, 2.0, mid.x, top + 0.1, mid.z, ly), C.ame);
    out.add(box(len + 0.06, 0.22, 2.06, mid.x, top + 0.75, mid.z, ly), C.gold);
    out.add(box(len + 0.5, 0.36, 2.4, mid.x, top + 2.08, mid.z, ly), C.coping);
    const fx = Math.sin(yaw), fz = Math.cos(yaw); // (along the line: the boss on both faces)
    for (const sg of [-1, 1]) out.add(new THREE.CylinderGeometry(0.75, 0.75, 0.16, 16).rotateX(Math.PI / 2).rotateY(yaw).translate(mid.x + fx * sg * 1.06, top + 1.1, mid.z + fz * sg * 1.06), C.boss);
  }
}
/** Whether a track has any of the pieces this dresses. */
export const hasKitDress = (T) => !!(T?.features?.columns?.length || T?.features?.walls?.length || T?.features?.arches?.length);
