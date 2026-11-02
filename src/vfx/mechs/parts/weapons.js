// ---------------------------------------------------------------------------------------
// A MECH'S ARM WEAPONS (the part library: progress/mechs/parts.js slot `weapon`, for weaponL and weaponR): the seven tools at giant scale
// and the bare fist, each in porcelain and gold, built in the grip's frame (vfx/mechs/parts/kit.js): its origin where the haft sits in
// the closed hand, +Z the forearm's forward, -Y down it. The haft runs fore and aft through the fist, so a gun is held by its carry
// handle and a blade points ahead, as a giant robot's hand weapons are. Each says which way the hand closes (`grip`) and how far the
// wrist keeps it level as the arm swings up (`level`, 0 it follows the arm, 1 it stays pointing ahead).
//   fist        the bare hand clenched (its knuckle guard and gold studs are the hand's own, arms.js)
//   bigGun      THE PSYGUN's giant form: a six-chambered cylinder over the carry handle, a long barrel with a gold muzzle, a stock back
//   greatBlade  the blade weapon (PARTS `greatBlade`): worn as a gunblade's variant (vfx/mechs/parts/gunblades.js: the gunblade, the
//               Sondelass's cutlass with a revolver in its basket and a barrel along its back, the default; the pepperbox, bayonet,
//               wheellock, gatling and saya), chosen by the mech's style (`gunblade`), read through `weaponLook(id, gunblade)`
// Prior art: Medabots' arm weapons (the weapon is the arm: Metabee's revolver, Rokusho's sword); Armored Core's arm units; Gundam's
// beam rifle and its carry handle; the seven tools' own looks (docs/GLOSSARY.md section 2).
//
//   WEAPON_LOOKS[id] = { grip: 'fist' | 'hold', level 0..1, muzzle? [x, y, z] (where a shot leaves, in the grip's frame), build(S, s) }
//   weaponLook(partId, gunblade) -> the look a weapon part is drawn in (the blade weapon's: its gunblade's variant)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, sidePlate, shell, seam, labTone } from './kit.js';
import { GUNBLADES, GUNBLADE_DEFAULT } from './gunblades.js';

const PI = Math.PI;
/** A shell along +Z (a profile [[r, z], ...] lathed round Z). */
const zShell = (prof, seg = 28) => shell(prof, seg).rotateX(PI / 2);

export const WEAPON_LOOKS = {
  fist: {
    grip: 'fist', level: 0,
    build() { /* (the hand clenches; its knuckle guard is the hand's own: vfx/mechs/parts/arms.js) */ },
  },
  bigGun: {
    grip: 'hold', level: 1, muzzle: [0, 1.15, 5.85],
    build(S) {
      const { p, g, l } = S;
      S.core.cyl(0.14, 0.14, 1.3, { rot: [PI / 2, 0, 0], c: L.coreD }, 12); // (the carry handle's haft)
      p.box(0.9, 0.7, 2.6, { at: [0, 0.95, 0.2], c: L.pale }, 0.2); // (the frame)
      S.core.box(0.95, 0.12, 2.65, { at: [0, 0.7, 0.2], c: L.coreD }, 0.05);
      for (const z of [-0.6, 0.6]) p.box(0.22, 0.6, 0.24, { at: [0, 0.45, z], c: L.mid }, 0.08); // (the handle's posts)
      p.geo(zShell([[0.68, -0.55], [0.74, -0.45], [0.74, 0.45], [0.68, 0.55]], 6), { at: [0, 1.15, 1.35], c: L.mid }); // (the cylinder, six-sided)
      for (let k = 0; k < 6; k++) { const a = (k / 6) * PI * 2; l.cyl(0.16, 0.16, 0.08, { at: [Math.cos(a) * 0.44, 1.15 + Math.sin(a) * 0.44, 1.92], rot: [PI / 2, 0, 0], c: labTone(k / 6, 0.2) }, 12); }
      p.geo(zShell([[0.32, 0], [0.36, 0.3], [0.3, 0.5], [0.3, 3.6], [0.36, 3.7], [0.36, 4.0], [0.24, 4.05]]), { at: [0, 1.15, 1.9], c: L.pale }); // (the barrel)
      g.ring(0.38, 0.06, { at: [0, 1.15, 5.85], rot: [PI / 2, 0, 0], c: L.gold }, 24, 5); // (the muzzle)
      p.box(0.18, 0.4, 0.3, { at: [0, 1.6, 5.2], c: L.mid }, 0.06); // (the sight)
      p.geo(sidePlate([[-1.1, 0.75], [-3.0, 0.4], [-3.1, 1.25], [-1.1, 1.2]], 0.55, 0.1), { c: L.mid }); // (the stock, back over the forearm)
      g.ball(0.18, { at: [0, 1.65, -0.9], c: L.gold }, 12, 8); // (the hammer)
      seam(g, [[0.46, 1.05, -0.4], [0.47, 0.85, 0.2], [0.46, 1.1, 0.8]], 0.025);
    },
  },
  ...GUNBLADES, // (the blade weapon's looks: vfx/mechs/parts/gunblades.js)
};
/** The look a weapon part is drawn in: the blade weapon wears its gunblade's variant (the default the gunblade), every other its own. */
export const weaponLook = (id, gunblade = GUNBLADE_DEFAULT) => (id === 'greatBlade' ? GUNBLADES[gunblade] || GUNBLADES[GUNBLADE_DEFAULT] : WEAPON_LOOKS[id]);
