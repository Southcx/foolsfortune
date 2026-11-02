// ---------------------------------------------------------------------------------------
// A MECH'S ARM WEAPONS (the part library: progress/mechs/parts.js slot `weapon`, for weaponL and weaponR): the seven tools at giant scale
// and the bare fist, each in porcelain and gold, built in the grip's frame (vfx/mechs/parts/kit.js): its origin where the haft sits in
// the closed hand, +Z the forearm's forward, -Y down it. The haft runs fore and aft through the fist, so a gun is held by its carry
// handle and a blade points ahead, as a giant robot's hand weapons are. Each says which way the hand closes (`grip`) and how far the
// wrist keeps it level as the arm swings up (`level`, 0 it follows the arm, 1 it stays pointing ahead).
//   fist        the bare hand clenched in a knuckle guard of porcelain and gold studs
//   bigGun      THE PSYGUN's giant form: a six-chambered cylinder over the carry handle, a long barrel with a gold muzzle, a stock back
//   greatBlade  the Sondelass's cutlass: a curved porcelain blade with a gold edge line and a labradorite fuller, a gold basket guard
//   greatBrush  the Soul Brush: a long ochre shaft with bronze nodes, a gold ferrule, a sumi head going to ink at its tip
//   greatBell   the Crucibelle: a hand bell, its mouth ahead (the toll's cone), gold with ivory bands, its clapper in it
//   greatFlail  the Lockheart: a coffin on a chain, its lid's gold cross and padlock, hanging off a short grip
// Prior art: Medabots' arm weapons (the weapon is the arm: Metabee's revolver, Rokusho's sword); Armored Core's arm units; Gundam's
// beam rifle and its carry handle; the seven tools' own looks (docs/GLOSSARY.md section 2).
//
//   WEAPON_LOOKS[id] = { grip: 'fist' | 'hold', level 0..1, build(S, s) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, plate, sidePlate, shell, seam, labTone, ball } from './kit.js';

const PI = Math.PI;
/** A shell along +Z (a profile [[r, z], ...] lathed round Z). */
const zShell = (prof, seg = 28) => shell(prof, seg).rotateX(PI / 2);

export const WEAPON_LOOKS = {
  fist: {
    grip: 'fist', level: 0,
    build(S) {
      const { p, g } = S;
      p.geo(new THREE.TorusGeometry(0.72, 0.16, 10, 24, PI * 0.9).rotateY(-PI / 2).rotateZ(PI), { at: [0, -0.05, 0.05], c: L.ivory }); // (the knuckle guard)
      for (let k = 0; k < 4; k++) { const a = -PI * 0.02 + (k / 3) * PI * 0.8; g.ball(0.1, { at: [0, -0.05 - Math.sin(a) * 0.86, 0.05 + Math.cos(a) * 0.86], c: L.gold }, 10, 8); }
    },
  },
  bigGun: {
    grip: 'hold', level: 1,
    build(S) {
      const { p, g, l } = S;
      p.cyl(0.14, 0.14, 1.3, { rot: [PI / 2, 0, 0], c: L.slate }, 12); // (the carry handle's haft)
      p.box(0.9, 0.7, 2.6, { at: [0, 0.95, 0.2], c: L.bone }, 0.2); // (the frame)
      p.box(0.95, 0.12, 2.65, { at: [0, 0.7, 0.2], c: L.umber }, 0.05);
      for (const z of [-0.6, 0.6]) p.box(0.22, 0.6, 0.24, { at: [0, 0.45, z], c: L.ivory }, 0.08); // (the handle's posts)
      p.geo(zShell([[0.68, -0.55], [0.74, -0.45], [0.74, 0.45], [0.68, 0.55]], 6), { at: [0, 1.15, 1.35], c: L.ivory }); // (the cylinder, six-sided)
      for (let k = 0; k < 6; k++) { const a = (k / 6) * PI * 2; l.cyl(0.16, 0.16, 0.08, { at: [Math.cos(a) * 0.44, 1.15 + Math.sin(a) * 0.44, 1.92], rot: [PI / 2, 0, 0], c: labTone(k / 6, 0.2) }, 12); }
      p.geo(zShell([[0.32, 0], [0.36, 0.3], [0.3, 0.5], [0.3, 3.6], [0.36, 3.7], [0.36, 4.0], [0.24, 4.05]]), { at: [0, 1.15, 1.9], c: L.bone }); // (the barrel)
      g.ring(0.38, 0.06, { at: [0, 1.15, 5.85], rot: [PI / 2, 0, 0], c: L.gold }, 24, 5); // (the muzzle)
      p.box(0.18, 0.4, 0.3, { at: [0, 1.6, 5.2], c: L.ivory }, 0.06); // (the sight)
      p.geo(sidePlate([[-1.1, 0.75], [-3.0, 0.4], [-3.1, 1.25], [-1.1, 1.2]], 0.55, 0.1), { c: L.sand }); // (the stock, back over the forearm)
      g.ball(0.18, { at: [0, 1.65, -0.9], c: L.gold }, 12, 8); // (the hammer)
      seam(g, [[0.46, 1.05, -0.4], [0.47, 0.85, 0.2], [0.46, 1.1, 0.8]], 0.025);
    },
  },
  greatBlade: {
    grip: 'hold', level: 0.35,
    build(S) {
      const { p, g, l } = S;
      p.cyl(0.18, 0.2, 1.6, { rot: [PI / 2, 0, 0], at: [0, 0, -0.1], c: L.umber }, 14); // (the hilt)
      g.ball(0.3, { at: [0, 0, -1.0], c: L.gold }, 16, 12); // (the pommel)
      g.geo(new THREE.TorusGeometry(0.7, 0.07, 6, 24, PI * 1.1).rotateZ(-PI * 0.05).rotateY(PI / 2), { at: [0, 0, 0.5], c: L.gold }); // (the basket guard)
      g.cyl(0.55, 0.55, 0.14, { rot: [PI / 2, 0, 0], at: [0, 0, 0.75], c: L.bronze }, 20);
      const blade = [[0.8, 0.28], [3.5, 0.45], [5.8, 0.85], [7.0, 1.45], [7.25, 1.85], [6.6, 1.0], [4.6, -0.32], [2.6, -0.42], [0.8, -0.32]];
      p.geo(sidePlate(blade, 0.16, 0.05), { c: L.bone });
      seam(g, [[0, -0.36, 0.9], [0, -0.42, 2.6], [0, -0.32, 4.6], [0, 1.0, 6.6], [0, 1.85, 7.25]], 0.05); // (the edge's gold line)
      l.geo(sidePlate([[1.2, 0.0], [4.2, 0.15], [5.6, 0.5], [5.5, 0.62], [4.1, 0.3], [1.2, 0.14]], 0.2, 0.02), { c: labTone(0.3, 0.2) }); // (the fuller)
    },
  },
  greatBrush: {
    grip: 'hold', level: 0.3,
    build(S) {
      const { p, g } = S;
      p.geo(zShell([[0.2, -1.6], [0.24, -1.5], [0.22, 0], [0.22, 5.0], [0.26, 5.1]]), { c: L.ochre }); // (the shaft)
      for (const z of [-1.0, 1.0, 2.6, 4.0]) g.ring(0.25, 0.05, { at: [0, 0, z], rot: [PI / 2, 0, 0], c: L.bronze }, 18, 4);
      g.geo(zShell([[0.26, 5.0], [0.42, 5.3], [0.48, 5.8], [0.46, 6.0]]), { c: L.gold }); // (the ferrule)
      p.geo(zShell([[0.46, 6.0], [0.7, 6.5], [0.66, 7.3], [0.38, 8.1], [0.001, 8.7]]), { c: L.ivory }); // (the head)
      p.geo(zShell([[0.52, 7.55], [0.38, 8.1], [0.001, 8.72]]), { sc: 1.01, c: 0x1e1916 }); // (its tip, in ink)
      g.ball(0.26, { at: [0, 0, -1.7], c: L.gold }, 14, 10);
    },
  },
  greatBell: {
    grip: 'hold', level: 0.8,
    build(S) {
      const { p, g } = S;
      p.geo(zShell([[0.2, -0.8], [0.24, -0.7], [0.22, 0.6], [0.3, 0.7]]), { c: L.umber }); // (the handle)
      g.ball(0.28, { at: [0, 0, -0.9], c: L.gold }, 14, 10);
      p.geo(zShell([[0.32, 0.7], [0.62, 0.85], [0.8, 1.1]]), { c: L.ivory }); // (the crown)
      g.geo(zShell([[0.8, 1.1], [0.92, 1.5], [0.98, 2.2], [1.2, 2.9], [1.62, 3.3], [1.66, 3.42]], 32), { c: L.gold }); // (the bell, its mouth ahead)
      for (const [z, r] of [[1.7, 0.97], [2.95, 1.27]]) p.geo(zShell([[r + 0.03, z - 0.08], [r + 0.06, z], [r + 0.03, z + 0.08]], 32), { c: L.ivory });
      g.rod([0, 0, 1.2], [0, -0.4, 2.8], 0.07, { c: L.bronze }, 6); g.ball(0.3, { at: [0, -0.45, 2.95], c: L.bronze }, 12, 8); // (the clapper)
    },
  },
  greatFlail: {
    grip: 'hold', level: 0.2,
    build(S) {
      const { p, g, l } = S;
      p.geo(zShell([[0.22, -0.9], [0.25, -0.8], [0.23, 0.7], [0.3, 0.8]]), { c: L.umber });
      g.ring(0.32, 0.07, { at: [0, 0, 0.9], rot: [PI / 2, 0, 0], c: L.gold }, 16, 5);
      for (let i = 0; i < 7; i++) g.geo(new THREE.TorusGeometry(0.22, 0.06, 6, 12).rotateY(i % 2 ? PI / 2 : 0), { at: [0, -0.35 - i * 0.38, 1.1], c: L.bronze }); // (the chain)
      const top = -0.35 - 7 * 0.38, coffin = [[-0.55, 0], [0.55, 0], [0.95, -1.1], [0.62, -3.4], [-0.62, -3.4], [-0.95, -1.1]];
      p.geo(plate(coffin, 0.8, 0.1), { at: [0, top, 1.1], c: L.bone }); // (the coffin)
      p.geo(plate(coffin.map(([x, y]) => [x * 0.84, -0.18 + y * 0.9]), 0.12, 0.04), { at: [0, top, 1.6], c: L.ivory }); // (its lid)
      g.slab(0.14, 1.7, 0.08, { at: [0, top - 1.35, 1.69], c: L.gold }); g.slab(0.9, 0.14, 0.08, { at: [0, top - 1.0, 1.69], c: L.gold }); // (the cross)
      g.lathe([[0.001, -0.25], [0.28, -0.22], [0.3, 0.1], [0.001, 0.12]], { at: [0, top - 2.3, 1.72], rot: [PI / 2, 0, 0], c: L.gold }, 16); // (the padlock)
      l.geo(plate([[-0.1, 0], [0.1, 0], [0.06, -0.5], [-0.06, -0.5]], 0.06, 0.02), { at: [0, top - 2.55, 1.76], c: labTone(0.5, 0.25) }); // (its keyhole's stone)
      ball(g, 0.2, [0, top + 0.05, 1.1]);
    },
  },
};
