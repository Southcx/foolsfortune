// ---------------------------------------------------------------------------------------
// THE GUNBLADE / A GUNBLADE'S VARIANT (plain names; South, 2026-11-02: "It's gotta be a gunblade ... Make a couple variants of
// cutlasses+gun to show off as well"): the looks of the mech's blade weapon (Dovina's PARTS `greatBlade`, progress/mechs/parts.js:
// its numbers stay hers), each the Sondelass's cutlass grown a gun, one weapon in silhouette and never two things bolted together.
// Built in the grip's frame as every arm weapon is (vfx/mechs/parts/weapons.js: the haft through the fist at the origin, +Z ahead, -Y
// down, the edge on -Y), in the parts' one family: porcelain over the umber core, the edges and the works in gold, the lacquer in the
// trim, labradorite only on a lens. Each names its `muzzle` (the point a shot leaves from, in the grip's frame, x mirrored by the
// hand's side; the twin barrels' pair as `muzzles`), which the parts body hangs as `mech.muzzleL` / `mech.muzzleR` on the grip.
//   gunblade    the default: the Sondelass's cutlass with a revolver action in its basket (the psygun's six-chambered cylinder, a
//               hammer spur, a trigger) and a barrel run straight along its spine, its muzzle past where the clip point drops away
//   pepperbox   a pepperbox saber: a ring of six barrels round the blade's root as its cup guard, a bar hammer over them, a long saber
//   bayonet     a cutlass between twin barrels slung either side of its flat, a break-action breech at the guard, the barrels' gold ring
//               holding the blade as a bayonet's does
//   wheellock   a flintlock hanger: a short broad hanger with a D knuckle bow, a wheel-lock on the guard's outer face (the wheel, the
//               dog and its pyrite jaw, the pan), an octagonal barrel flaring to a trumpet muzzle
//   gatling     a scimitar with a gatling spine: a dao's broad belly under six barrels turning in three gold clamps, a crank at the drum
//   saya        a katana-like sabre whose lacquered saya clips on along its back as the barrel, firing out past the kissaki: a round
//               tsuba, a habaki, the kurikata clips, a bolt at the koiguchi
// Prior art: Final Fantasy VIII's gunblade (Squall's Revolver: the cylinder in the guard, the barrel along the back); the pistol sword
// and the pistol hanger of the 17th and 18th centuries (a hunting hanger with a flintlock or wheel-lock barrel along its spine); the
// pepperbox pistol (Ethan Allen's, 1837: a ring of barrels turned by the trigger); the combination weapon's bayonet ring; Gatling's
// gun (1861); the shikomizue's saya-as-mount; the Sondelass's cutlass (vfx/mechs/parts/weapons.js, the first pass's `greatBlade`) and
// THE PSYGUN's cylinder (vfx/psyguncylinder.js).
//
//   GUNBLADES[id] = { grip, level, muzzle [x, y, z], muzzles?, build(S, s) }   GUNBLADE_IDS   GUNBLADE_DEFAULT
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, sidePlate, shell, seam, labTone, tube } from './kit.js';

const PI = Math.PI;
/** A shell along +Z (a profile [[r, z], ...] lathed round Z). */
const zShell = (prof, seg = 28) => shell(prof, seg).rotateX(PI / 2);
/** A torus round the Z axis (a band on a barrel, a crown). */
const zRing = (R, t, seg = 24) => new THREE.TorusGeometry(R, t, 5, seg);
const ZROT = [PI / 2, 0, 0];

// ------------------------------------------------------------------ the kit's shared pieces
/** The hilt: the grip's core and a gold pommel. */
function hilt(S, { z0 = -0.9, z1 = 0.7, r = 0.19, pommel = 0.3 } = {}) {
  S.core.cyl(r * 0.95, r * 1.05, z1 - z0, { rot: ZROT, at: [0, 0, (z0 + z1) / 2], c: L.coreD }, 14);
  if (pommel) S.g.ball(pommel, { at: [0, 0, z0 - 0.1], c: L.gold }, 16, 12);
}
/** The Sondelass's basket: its gold bow and its bronze shell (the first pass's guard). */
function basket(S, z = 0.5) {
  S.g.geo(new THREE.TorusGeometry(0.7, 0.07, 6, 24, PI * 1.1).rotateZ(-PI * 0.05).rotateY(PI / 2), { at: [0, 0, z], c: L.gold });
  S.g.cyl(0.55, 0.55, 0.14, { rot: ZROT, at: [0, 0, z + 0.25], c: L.bronze }, 20);
}
/** The blade: an outline [[z, y], ...] in porcelain, its edge's gold line, its fuller in the trim. */
function blade(S, outline, edge, fuller = null, w = 0.16) {
  S.p.geo(sidePlate(outline, w, 0.05), { c: L.pale });
  seam(S.g, edge.map(([z, y]) => [0, y, z]), 0.05);
  if (fuller) S.trim.geo(sidePlate(fuller, w + 0.04, 0.02), { c: L.trimM });
}
/** A barrel along +Z from z0 to z1 at (x, y): a thicker breech, a gold crown, the bore's dark and its throat (lit while sealed). */
function barrel(S, { z0, z1, y, x = 0, r = 0.2, breech = 1.25, seg = 24, flare = 1.22, c = L.pale }) {
  const n = z1 - z0;
  S.p.geo(zShell([[r * breech, 0], [r * breech, 0.3], [r, 0.42], [r, n - 0.22], [r * flare, n - 0.14], [r * flare, n], [r * 0.6, n]], seg), { at: [x, y, z0], c });
  S.g.geo(zRing(r * flare, r * 0.2), { at: [x, y, z1], c: L.gold });
  S.core.cyl(r * 0.6, r * 0.6, 0.34, { rot: ZROT, at: [x, y, z1 - 0.18], c: L.hollow }, 14);
  S.e.cyl(r * 0.5, r * 0.5, 0.03, { rot: ZROT, at: [x, y, z1 - 0.3] }, 14);
}
/** A gold band round a barrel (or a bundle) at z. */
const band = (S, z, y, R, x = 0) => S.g.geo(zRing(R, 0.045), { at: [x, y, z], c: L.gold });
/** THE PSYGUN's cylinder at giant scale: n chambers round its gold pin, their mouths ringed in gold, dark flutes between. */
function revolver(S, { z0, z1, y, r, n = 6 }) {
  const len = z1 - z0, zc = (z0 + z1) / 2;
  S.p.geo(zShell([[r * 0.5, 0], [r * 0.9, 0.015], [r, 0.08], [r, len - 0.08], [r * 0.9, len - 0.015], [r * 0.5, len]], 30), { at: [0, y, z0], c: L.mid });
  S.g.cyl(r * 0.15, r * 0.15, len + 0.14, { rot: ZROT, at: [0, y, zc], c: L.gold }, 12);
  S.g.geo(zRing(r * 0.98, 0.03), { at: [0, y, z0 + 0.06], c: L.gold }); // (the ratchet's band)
  for (let k = 0; k < n; k++) {
    const a = (k / n) * PI * 2 + PI / 2, cx = Math.cos(a) * r * 0.6, cy = Math.sin(a) * r * 0.6;
    S.g.geo(zRing(r * 0.21, r * 0.05, 14), { at: [cx, y + cy, z1 + 0.005], c: L.gold });
    S.core.cyl(r * 0.19, r * 0.19, 0.04, { rot: ZROT, at: [cx, y + cy, z1], c: L.hollow }, 12);
    const f = a + PI / n; // (a flute between two chambers: a dark groove let into the cylinder's side)
    S.core.rod([Math.cos(f) * r * 0.95, y + Math.sin(f) * r * 0.95, z0 + 0.2], [Math.cos(f) * r * 0.95, y + Math.sin(f) * r * 0.95, z1 - 0.2], r * 0.11, { c: L.coreD }, 6);
  }
}
/** A gold trigger hanging from (z, y): a curved finger blade, and its bow. */
function trigger(S, z, y, k = 1) {
  S.g.geo(sidePlate([[z, y], [z + 0.08 * k, y - 0.2 * k], [z + 0.02 * k, y - 0.36 * k], [z - 0.06 * k, y - 0.32 * k], [z - 0.01 * k, y - 0.18 * k], [z - 0.07 * k, y]], 0.08, 0.02), { c: L.gold });
}
/** A hammer's spur rising behind (z, y), its pivot a gold ball. */
function hammer(S, z, y, k = 1) {
  S.g.geo(sidePlate([[z + 0.1 * k, y - 0.05], [z - 0.05 * k, y + 0.3 * k], [z - 0.32 * k, y + 0.46 * k], [z - 0.24 * k, y + 0.27 * k], [z - 0.1 * k, y - 0.08]], 0.16, 0.03), { c: L.gold });
  S.g.ball(0.09 * k, { at: [0, y, z], c: L.gold }, 12, 8);
}
/** A labradorite lens in a gold bezel, facing up (the sight's eyepiece). */
function lens(S, z, y, r = 0.09) {
  S.g.geo(new THREE.TorusGeometry(r, 0.025, 5, 16).rotateX(PI / 2), { at: [0, y, z], c: L.gold });
  S.l.cyl(r, r, 0.05, { at: [0, y, z], c: labTone(0.35, 0.2) }, 16);
}

// ------------------------------------------------------------------ the variants
export const GUNBLADES = {
  // the default: the Sondelass's cutlass, a revolver in its basket and a barrel along its back
  gunblade: {
    grip: 'hold', level: 0.35, muzzle: [0, 1.0, 6.85],
    build(S) {
      const Y = 1.0;
      hilt(S); basket(S);
      // the receiver: its recoil shield behind the cylinder, its top strap over it, its lug ahead, one frame flowing into the blade
      S.p.geo(sidePlate([[-0.95, 0.66], [-0.82, 1.24], [-0.5, 1.42], [0.05, 1.46], [0.05, 0.6], [-0.4, 0.52]], 0.5, 0.07), { c: L.pale });
      S.p.box(0.34, 0.12, 0.95, { at: [0, 1.43, 0.44], c: L.pale }, 0.04);
      S.p.geo(sidePlate([[0.82, 0.58], [0.82, 1.46], [1.5, 1.3], [1.95, 1.08], [1.95, 0.72], [1.25, 0.58]], 0.44, 0.07), { c: L.pale });
      S.core.box(0.52, 0.08, 1.2, { at: [0, 0.6, 0.45], c: L.coreD }, 0.03); // (the frame's floor under the cylinder)
      revolver(S, { z0: 0.08, z1: 0.8, y: Y, r: 0.38 });
      hammer(S, -0.85, 1.3); trigger(S, 0.3, 0.55);
      seam(S.g, [[0.26, 0.9, -0.9], [0.26, 1.3, -0.5], [0.26, 1.42, 0.05]], 0.025); // (a gold line round the shield)
      lens(S, -0.55, 1.47); // (the rear sight's lens)
      barrel(S, { z0: 1.6, z1: 6.85, y: Y, r: 0.2 });
      for (const z of [2.6, 4.6]) band(S, z, Y, 0.23);
      S.g.box(0.08, 0.2, 0.14, { at: [0, 1.25, 6.45], c: L.gold }, 0.02); // (the front sight)
      // the blade: its spine straight under the barrel, its belly a cutlass's, its clip point dropping away under the muzzle
      blade(S, [[0.9, 0.84], [6.55, 0.84], [7.55, 0.42], [7.85, 0.32], [7.2, 0.05], [5.6, -0.42], [3.4, -0.52], [1.6, -0.42], [0.9, -0.34]],
        [[0.9, -0.36], [1.6, -0.44], [3.4, -0.54], [5.6, -0.44], [7.2, 0.03], [7.85, 0.32]],
        [[1.6, 0.06], [5.4, 0.06], [6.2, 0.3], [5.4, 0.4], [1.6, 0.4]]);
    },
  },
  // a pepperbox saber: six barrels round the blade's root as its cup guard
  pepperbox: {
    grip: 'hold', level: 0.35, muzzle: [0, 0.56, 1.9],
    build(S) {
      hilt(S, { z1: 0.5 });
      const R = 0.56, n = 6, z0 = 0.35, z1 = 1.9;
      S.core.cyl(R * 0.72, R * 0.6, z1 - z0 - 0.1, { rot: ZROT, at: [0, 0, (z0 + z1) / 2], c: L.core }, 20); // (the core between the barrels)
      for (let k = 0; k < n; k++) {
        const a = (k / n) * PI * 2 + PI / 2, x = Math.cos(a) * R, y = Math.sin(a) * R;
        barrel(S, { z0, z1, x, y, r: 0.15, breech: 1.18, seg: 16, flare: 1.18 });
      }
      S.g.cyl(R + 0.24, R + 0.2, 0.12, { rot: ZROT, at: [0, 0, z0 + 0.02], c: L.gold }, 28); // (the breech plate)
      S.g.geo(zRing(R + 0.04, 0.06, 28), { at: [0, 0, 1.25], c: L.gold }); // (the barrels' band)
      S.p.geo(zShell([[0.24, 0], [0.52, 0.14], [0.6, 0.3], [0.2, 0.36]], 24), { at: [0, 0, -0.06], c: L.mid }); // (the shell behind the drum, over the hand)
      // the bar hammer riding over the top barrel, its trigger and bow under the drum
      S.g.geo(sidePlate([[0.4, 0.92], [-0.35, 0.95], [-0.62, 1.12], [-0.58, 0.9], [-0.3, 0.78], [0.4, 0.8]], 0.14, 0.03), { c: L.gold });
      trigger(S, 0.15, -0.6, 0.9);
      tube(S.g, [[0, -0.86, z0 + 0.05], [0, -0.92, -0.2], [0, -0.6, -0.85], [0, -0.22, -1.0]], 0.06, L.gold, 18); // (the knuckle bow to the pommel)
      lens(S, 1.5, 0.79, 0.07);
      // the saber: long, nearly straight, rising a little to its point
      blade(S, [[1.9, 0.24], [7.6, 0.3], [8.6, 0.56], [7.9, 0.12], [5.0, -0.16], [1.9, -0.22]],
        [[1.9, -0.24], [5.0, -0.18], [7.9, 0.1], [8.6, 0.56]],
        [[2.2, 0.04], [7.2, 0.12], [7.2, 0.2], [2.2, 0.14]], 0.12);
    },
  },
  // a cutlass between twin barrels slung either side of its flat, held by their ring as a bayonet is
  bayonet: {
    grip: 'hold', level: 0.35, muzzle: [0.26, 0.0, 4.75], muzzles: [[0.26, 0.0, 4.75], [-0.26, 0.0, 4.75]],
    build(S) {
      hilt(S); basket(S);
      // the break-action breech, its top lever and two hammers
      S.p.geo(sidePlate([[0.72, -0.36], [0.72, 0.42], [1.5, 0.36], [1.9, 0.2], [1.9, -0.22], [1.3, -0.36]], 0.82, 0.08), { c: L.pale });
      S.g.ball(0.11, { at: [0.44, -0.22, 0.95], c: L.gold }, 12, 8); S.g.ball(0.11, { at: [-0.44, -0.22, 0.95], c: L.gold }, 12, 8); // (the hinge pin's ends)
      S.g.geo(sidePlate([[1.1, 0.42], [0.95, 0.62], [0.55, 0.7], [0.6, 0.58], [0.95, 0.42]], 0.12, 0.02), { c: L.gold }); // (the top lever)
      for (const x of [0.3, -0.3]) { S.g.geo(sidePlate([[0.85, 0.3], [0.7, 0.56], [0.48, 0.66], [0.56, 0.5], [0.7, 0.28]], 0.1, 0.02), { at: [x, 0, 0], c: L.gold }); }
      trigger(S, 1.05, -0.36, 0.8);
      for (const s of [1, -1]) barrel(S, { z0: 1.7, z1: 4.75, x: s * 0.26, y: 0, r: 0.17, breech: 1.2, flare: 1.15 });
      S.trim.box(0.08, 0.1, 2.6, { at: [0, 0.2, 3.2], c: L.trimM }, 0.02); // (the rib between the barrels, over the blade's back)
      // the bayonet's ring: a gold yoke round both muzzles, clasping the blade
      S.g.geo(sidePlate([[4.25, -0.3], [4.25, 0.3], [4.6, 0.32], [4.6, -0.32]], 0.88, 0.05), { c: L.gold });
      S.g.cyl(0.05, 0.05, 0.9, { rot: [0, 0, PI / 2], at: [0, 0, 2.9], c: L.gold }, 8); // (the middle band)
      blade(S, [[0.9, 0.28], [3.5, 0.45], [5.8, 0.85], [7.0, 1.45], [7.25, 1.85], [6.6, 1.0], [4.6, -0.32], [2.6, -0.42], [0.9, -0.32]],
        [[1.9, -0.39], [2.6, -0.42], [4.6, -0.32], [6.6, 1.0], [7.25, 1.85]],
        [[4.8, 0.2], [5.6, 0.5], [5.5, 0.62], [4.75, 0.34]]);
    },
  },
  // a flintlock hanger: the hunting hanger, a wheel-lock on its guard, a trumpet muzzle
  wheellock: {
    grip: 'hold', level: 0.35, muzzle: [0, 0.78, 4.7],
    build(S, s = 1) {
      hilt(S, { z0: -0.8, r: 0.2, pommel: 0.26 });
      S.g.ball(0.3, { at: [0, 0, -0.95], c: L.gold }, 16, 12); // (a cap pommel)
      // the D knuckle bow from the quillon block to the pommel, and the quillon running back down
      tube(S.g, [[0, 0.1, 0.72], [0, -0.55, 0.62], [0, -0.82, 0.1], [0, -0.72, -0.6], [0, -0.28, -0.92]], 0.07, L.gold, 22);
      S.g.geo(sidePlate([[0.62, -0.5], [0.62, 0.62], [0.86, 0.6], [0.86, -0.46]], 0.62, 0.05), { c: L.bronze }); // (the quillon block)
      tube(S.g, [[0, 0.55, 0.74], [0, 0.85, 0.5], [0, 0.9, 0.18]], 0.06, L.gold, 10); // (the rear quillon curling up)
      // the stock's porcelain over the breech, the lock plate on the guard's outer face
      S.p.geo(sidePlate([[0.86, 0.48], [0.86, 1.08], [1.9, 1.02], [2.2, 0.85], [2.2, 0.55], [1.4, 0.44]], 0.5, 0.07), { c: L.pale });
      const X = s * 0.29;
      S.p.geo(sidePlate([[0.95, 0.5], [0.95, 1.0], [1.95, 0.96], [2.05, 0.6]], 0.06, 0.02), { at: [X, 0, 0], c: L.mid });
      // the wheel (its gold disc and toothed rim, axis across), the dog clasping its pyrite to it, the pan
      S.g.cyl(0.24, 0.24, 0.08, { rot: [0, 0, PI / 2], at: [X + s * 0.05, 0.74, 1.35], c: L.gold }, 24);
      S.g.geo(new THREE.TorusGeometry(0.25, 0.03, 4, 24).rotateY(PI / 2), { at: [X + s * 0.07, 0.74, 1.35], c: L.bronze });
      S.g.ball(0.06, { at: [X + s * 0.1, 0.74, 1.35], c: L.gold }, 10, 8);
      tube(S.g, [[X + s * 0.06, 0.6, 1.95], [X + s * 0.08, 0.98, 1.85], [X + s * 0.08, 1.12, 1.55], [X + s * 0.08, 0.98, 1.45]], 0.045, L.gold, 14); // (the dog)
      S.g.box(0.1, 0.1, 0.14, { at: [X + s * 0.08, 0.96, 1.45], c: L.bronze }, 0.02); // (its jaw, the pyrite)
      S.g.box(0.16, 0.06, 0.24, { at: [X - s * 0.02, 1.0, 1.2], c: L.bronze }, 0.02); // (the pan)
      trigger(S, 1.45, 0.44, 0.85);
      // the octagonal barrel flaring to a trumpet
      S.p.geo(zShell([[0.22, 0], [0.22, 0.25], [0.18, 0.35], [0.17, 1.6], [0.2, 2.2], [0.3, 2.42], [0.36, 2.5], [0.24, 2.5]], 8), { at: [0, 0.78, 2.2], rot: [0, 0, PI / 8], c: L.pale });
      S.g.geo(zRing(0.36, 0.05, 16), { at: [0, 0.78, 4.7], c: L.gold });
      S.core.cyl(0.22, 0.2, 0.4, { rot: ZROT, at: [0, 0.78, 4.5], c: L.hollow }, 14);
      S.e.cyl(0.18, 0.18, 0.03, { rot: ZROT, at: [0, 0.78, 4.32] }, 14);
      band(S, 2.7, 0.78, 0.2); band(S, 3.6, 0.78, 0.2);
      // the hanger: short and broad, its curve rising to a clipped point under the trumpet
      blade(S, [[0.86, 0.58], [4.2, 0.6], [5.3, 0.42], [5.9, 0.3], [5.3, -0.1], [3.8, -0.52], [2.0, -0.55], [0.86, -0.46]],
        [[0.86, -0.48], [2.0, -0.57], [3.8, -0.54], [5.3, -0.12], [5.9, 0.3]],
        [[1.3, -0.1], [4.0, -0.04], [4.6, 0.12], [4.0, 0.22], [1.3, 0.16]], 0.2);
    },
  },
  // a scimitar with a gatling spine: a dao's belly under six turning barrels
  gatling: {
    grip: 'hold', level: 0.3, muzzle: [0, 1.15, 5.65],
    build(S, s = 1) {
      const Y = 1.15, R = 0.2;
      hilt(S); basket(S);
      // the drum behind the barrels (its porcelain housing over the guard), its crank on the outer face
      S.p.geo(zShell([[0.18, 0], [0.4, 0.06], [0.44, 0.3], [0.44, 1.1], [0.38, 1.25], [0.26, 1.3]], 24), { at: [0, Y, -0.35], c: L.pale });
      S.p.geo(sidePlate([[-0.2, 0.55], [-0.2, 0.95], [1.1, 0.95], [1.4, 0.55]], 0.5, 0.06), { c: L.mid }); // (its saddle onto the guard)
      S.g.geo(zRing(0.44, 0.04, 24), { at: [0, Y, 0.0], c: L.gold });
      tube(S.g, [[s * 0.44, Y, 0.3], [s * 0.62, Y, 0.3], [s * 0.62, Y + 0.42, 0.18]], 0.045, L.gold, 8); // (the crank)
      S.g.cyl(0.06, 0.06, 0.24, { at: [s * 0.62, Y + 0.52, 0.18], c: L.bronze }, 8);
      trigger(S, 0.35, 0.55);
      S.core.cyl(0.08, 0.08, 4.6, { rot: ZROT, at: [0, Y, 3.25], c: L.coreD }, 10); // (the spindle)
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * PI * 2, x = Math.cos(a) * R, y = Math.sin(a) * R;
        barrel(S, { z0: 0.95, z1: 5.65, x, y: Y + y, r: 0.085, breech: 1.1, seg: 12, flare: 1.15 });
      }
      for (const z of [1.25, 3.35, 5.3]) { S.g.cyl(0.33, 0.33, 0.12, { rot: ZROT, at: [0, Y, z], c: L.gold }, 24); }
      lens(S, 0.4, Y + 0.47, 0.08);
      // the scimitar: its back flat under the barrels, the dao's belly swelling toward the point
      blade(S, [[0.9, 0.82], [5.9, 0.82], [7.3, 0.55], [7.75, 0.48], [7.3, 0.0], [6.2, -0.7], [4.6, -0.86], [2.6, -0.6], [0.9, -0.34]],
        [[0.9, -0.36], [2.6, -0.62], [4.6, -0.88], [6.2, -0.72], [7.3, -0.02], [7.75, 0.48]],
        [[1.4, 0.32], [5.4, 0.36], [6.2, 0.5], [5.4, 0.58], [1.4, 0.54]], 0.18);
      for (const z of [1.25, 3.35, 5.3]) S.g.box(0.1, 0.16, 0.12, { at: [0, 0.88, z], c: L.gold }, 0.02); // (the clamps' feet on the back)
    },
  },
  // a katana-like sabre whose saya clips on along its back as the barrel
  saya: {
    grip: 'hold', level: 0.4, muzzle: [0, 0.86, 9.25],
    build(S, s = 1) {
      const Y = 0.86;
      // the tsuka (its core under a diamond wrap in the trim), the kashira, the tsuba and the habaki
      S.core.cyl(0.18, 0.19, 1.5, { rot: ZROT, at: [0, 0, -0.1], c: L.coreD }, 14);
      for (let i = 0; i < 6; i++) S.trim.geo(zRing(0.195, 0.035, 14).rotateY(i % 2 ? 0.5 : -0.5), { at: [0, 0, -0.7 + i * 0.22], c: L.trimD });
      S.g.cyl(0.22, 0.2, 0.18, { rot: ZROT, at: [0, 0, -0.92], c: L.gold }, 16);
      S.g.cyl(0.68, 0.68, 0.12, { rot: ZROT, at: [0, 0.22, 0.72], c: L.gold }, 32);
      S.p.cyl(0.58, 0.58, 0.13, { rot: ZROT, at: [0, 0.22, 0.72], c: L.mid }, 32);
      S.g.box(0.24, 0.5, 0.26, { at: [0, 0.02, 0.92], c: L.gold }, 0.04);
      trigger(S, 0.55, -0.45, 0.8);
      // the saya over the blade's back: lacquered in the trim, its koiguchi with a bolt, two kurikata clips, its kojiri the muzzle
      S.trim.geo(zShell([[0.25, 0], [0.26, 0.4], [0.26, 7.2], [0.23, 7.9], [0.15, 8.1]], 24), { at: [0, Y, 1.1], sc: [0.78, 1, 1], c: L.trimD });
      S.g.geo(zRing(0.27, 0.05), { at: [0, Y, 1.12], sc: [0.78, 1, 1], c: L.gold });
      tube(S.g, [[s * 0.2, Y, 1.4], [s * 0.42, Y + 0.08, 1.4], [s * 0.48, Y + 0.08, 1.2]], 0.045, L.gold, 8);
      S.g.ball(0.08, { at: [s * 0.49, Y + 0.08, 1.15], c: L.gold }, 10, 8); // (the bolt's knob)
      for (const z of [3.0, 6.0]) { S.g.geo(zRing(0.27, 0.05), { at: [0, Y, z], sc: [0.78, 1, 1], c: L.gold }); S.g.box(0.08, 0.28, 0.2, { at: [0, Y - 0.3, z], c: L.gold }, 0.02); }
      S.g.geo(zShell([[0.2, 0], [0.21, 0.16], [0.16, 0.3], [0.1, 0.3]], 20), { at: [0, Y, 8.95], sc: [0.78, 1, 1], c: L.gold }); // (the kojiri, cut through)
      S.core.cyl(0.1, 0.1, 0.3, { rot: ZROT, at: [0, Y, 9.12], c: L.hollow }, 12);
      S.e.cyl(0.08, 0.08, 0.03, { rot: ZROT, at: [0, Y, 9.0] }, 12);
      // the blade: narrow, its sori gentle, the shinogi in the trim, the hamon's gold line waving along its edge
      blade(S, [[0.98, 0.42], [7.4, 0.5], [8.2, 0.48], [8.75, 0.3], [8.3, 0.06], [5.0, -0.12], [0.98, -0.16]],
        [[1.05, -0.18], [2.4, -0.12], [3.8, -0.15], [5.0, -0.1], [6.4, -0.06], [7.6, -0.02], [8.3, 0.04], [8.75, 0.3]],
        [[1.05, 0.18], [8.1, 0.24], [8.1, 0.29], [1.05, 0.23]], 0.12);
    },
  },
};
/** The gunblade's variants in the order they are offered; the first is the blade weapon's default look. */
export const GUNBLADE_IDS = Object.keys(GUNBLADES);
export const GUNBLADE_DEFAULT = 'gunblade';
