// ---------------------------------------------------------------------------------------
// A FEMININE MECH'S HEADS (the part library's heads for the forms with `fem`, kit.js FORMS; asked for by heads.js `headLookOf`): the two
// heads built in each feminine form, on the same contract as the hero's (heads.js: the neck's length, its ball, the neck's segment, the
// head), faceless in the house's way: a smooth shell with no features, one faint light set deep in a seam (lit with the cradle).
//   haydee (the `doll` form)
//     clayHead     Haydee's smooth helm: an egg with the face's outline cut as one panel line, two small swept ear fins, a slim neck in rings
//     watcherHead  taller, a keel crest from brow to nape, one small lens sunk in the brow
//   drossel (a long slender neck, a choker and its brooch)
//     clayHead     the elongated egg, widest above its middle, a dark face plate of the interstitial over its lower half, a gold
//                  tiara band with its gem, the ear discs as brooches
//     watcherHead  a bell jar: a porcelain foot and collar, a tall dome of the interstitial lit from inside, a gilt finial
// Prior art: Haydee (Haydee Interactive, 2016: the smooth, featureless helm); Drossel von Flügel of Fireball (Jinni's Animation
// Studios for Disney Japan, 2008: the robot duchess's long egg of a head on a slender neck); the Victorian bell jar (a cloche over a
// specimen) and the cameo choker; FFXI's automatons (the house's faceless heads, vfx/mechs/helms.js).
//
//   femHeadLook(id, F) -> { neck, ball, neckSeg(S), build(S) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, shell, panel, plate, sidePlate, labTone, ball, band } from './kit.js';

const PI = Math.PI;
const ring = (P, r, y, t, c, sc = [1, 1, 1]) => P.ring(r, t, { at: [0, y, 0], sc, c }, 36, 4);

/** A neck: its ball, a slim column of the interstitial, porcelain rings (Haydee's) or a choker with a brooch (Drossel's). */
const neckSeg = (len, r, D) => (S) => {
  const k = S.F.joint; ball(S.g, r * k);
  S.core.cyl(r * 0.5 * k, r * 0.6 * k, len, { at: [0, len / 2, 0], c: L.core }, 18);
  if (D) {
    S.trim.lathe([[r * 0.66, len * 0.55], [r * 0.74, len * 0.62], [r * 0.74, len * 0.72], [r * 0.66, len * 0.78]], { c: L.trimM }, 28);
    S.g.ring(r * 0.12, 0.025, { at: [0, len * 0.67, r * 0.74], rot: [PI / 2, 0, 0], c: L.gold }, 16, 4); S.l.ball(r * 0.09, { at: [0, len * 0.67, r * 0.78], sc: [1, 1, 0.5], c: labTone(0.5, 0.2) }, 12, 8);
  } else for (const t of [0.35, 0.65]) S.p.lathe([[r * 0.62, len * (t - 0.08)], [r * 0.7, len * t], [r * 0.62, len * (t + 0.08)]], { c: L.pale }, 24);
};

const HAYDEE_EGG = [[0.001, -0.08], [0.26, -0.05], [0.42, 0.14], [0.5, 0.45], [0.51, 0.78], [0.44, 1.05], [0.3, 1.22], [0.001, 1.28]];
const DROSSEL_EGG = [[0.001, -0.05], [0.18, -0.02], [0.3, 0.2], [0.42, 0.62], [0.48, 1.05], [0.46, 1.42], [0.34, 1.68], [0.16, 1.8], [0.001, 1.83]];

function haydeeHead(S, tall) {
  const { p, g, e } = S, k = S.F.head, E = HAYDEE_EGG.map(([r, y]) => [r * k, y * k * tall]);
  S.core.lathe(E.map(([r, y]) => [r * 0.97, y]), { sc: [1, 1, 1.1], c: L.coreD }, 32);
  p.geo(panel(band(E, 0.12 * k, 0.9 * k * tall, 1.01, 12), -0.95, 0.95, 24), { sc: [1, 1, 1.1], c: L.pale }); // (the face's plate)
  p.geo(panel(E, 0.95 + 0.04, 2 * PI - 0.95 - 0.04, 24), { sc: [1, 1, 1.1], c: L.pale }); // (the skull round it)
  p.geo(panel(band(E, 0.9 * k * tall + 0.04, E[E.length - 1][1], 1.0, 8), -0.95, 0.95, 24), { sc: [1, 1, 1.1], c: L.pale }); // (the brow over it)
  p.geo(panel(band(E, E[0][1], 0.12 * k - 0.04, 1.0, 4), -0.95, 0.95, 24), { sc: [1, 1, 1.1], c: L.pale }); // (the chin under it)
  e.box(0.36 * k, 0.018, 0.03, { at: [0, 0.1 * k, 0.47 * k * 1.06], c: 0xffffff }, 0.008); // (the one faint light, in the seam under the face)
  for (const s of [-1, 1]) S.trim.geo(plate([[0, 0], [0.16, 0.04], [0.5, 0.42], [0.42, 0.48], [0, 0.22]].map(([x, y]) => [x * k, y * k]), 0.05, 0.02), { at: [s * 0.5 * k, 0.55 * k * tall, -0.12 * k], rot: [0, s > 0 ? -PI / 2 : PI / 2, s * 0.15], sc: [1, 1, 1], c: L.trimL }); // (the ear fins)
  g.ring(0.5 * k, 0.018, { at: [0, 0.02 * k, 0], sc: [1, 1, 1.1], c: L.gold }, 36, 4);
}

function drosselHead(S) {
  const { p, g, e } = S, k = S.F.head, E = DROSSEL_EGG.map(([r, y]) => [r * k, y * k]);
  p.lathe(E, { sc: [1, 1, 1.05], c: L.pale }, 40);
  S.core.geo(panel(band(E, 0.3 * k, 1.1 * k, 1.02, 12), -0.75, 0.75, 22), { sc: [1, 1, 1.05], c: L.coreD }); // (the dark face plate)
  g.geo(panel(band(E, 1.1 * k, 1.14 * k, 1.03, 1), -0.8, 0.8, 22), { sc: [1, 1, 1.05], c: L.gold });
  e.box(0.3 * k, 0.02, 0.03, { at: [0, 0.78 * k, 0.48 * k * 1.06], c: 0xffffff }, 0.01); // (the one faint light behind the plate)
  ring(g, 0.47 * k * 1.0, 1.3 * k, 0.035, L.gold, [1, 1, 1.05]); // (the tiara's band)
  S.trim.geo(sidePlate([[-0.1, 0], [0.1, 0], [0.04, 0.36], [-0.04, 0.36]].map(([z, y]) => [z * k, y * k]), 0.12 * k, 0.02), { at: [0, 1.32 * k, 0.45 * k], c: L.trimL }); // (its point)
  S.l.ball(0.07 * k, { at: [0, 1.4 * k, 0.5 * k], sc: [1, 1.3, 0.6], c: labTone(0.7, 0.2) }, 14, 10);
  for (const s of [-1, 1]) { g.ring(0.13 * k, 0.025, { at: [s * 0.47 * k, 0.95 * k, 0], rot: [0, 0, PI / 2], c: L.gold }, 18, 4); S.trim.ball(0.11 * k, { at: [s * 0.48 * k, 0.95 * k, 0], sc: [0.5, 1, 1], c: L.trimM }, 14, 10); } // (the ear discs)
}

function bellJar(S) {
  const { p, g, e } = S, k = S.F.head;
  p.lathe([[0.001, -0.05], [0.34, -0.04], [0.42, 0.06], [0.4, 0.2], [0.46, 0.26], [0.001, 0.27]].map(([r, y]) => [r * k, y * k]), { c: L.pale }, 36); // (its foot)
  S.core.lathe([[0.42, 0.26], [0.44, 0.6], [0.42, 1.1], [0.36, 1.45], [0.22, 1.66], [0.001, 1.7]].map(([r, y]) => [r * k, y * k]), { c: L.core }, 40); // (the dome, lit from inside)
  ring(S.trim, 0.45 * k, 0.3 * k, 0.04, L.trimM); ring(g, 0.46 * k, 0.36 * k, 0.02, L.gold);
  g.ball(0.1 * k, { at: [0, 1.76 * k, 0], c: L.gold }, 14, 10); g.cyl(0.04 * k, 0.06 * k, 0.12 * k, { at: [0, 1.68 * k, 0], c: L.gold }, 10); // (the finial)
  e.ball(0.06 * k, { at: [0, 0.82 * k, 0.12 * k], c: 0xffffff }, 12, 8); // (the faint light inside)
}

export function femHeadLook(id, F) {
  const D = F.fem === 'drossel', W = id === 'watcherHead';
  const neck = D ? 1.05 : W ? 0.6 : 0.5, r = D ? 0.32 : 0.36;
  return {
    neck, ball: r, neckSeg: neckSeg(neck, r, D),
    build(S) {
      if (D) { if (W) bellJar(S); else drosselHead(S); return; }
      haydeeHead(S, W ? 1.2 : 1);
      if (W) { // (the keel crest, brow to nape, and the lens sunk in the brow)
        const k = S.F.head;
        S.trim.geo(sidePlate([[0.25, 1.28], [0.0, 1.5], [-0.42, 1.48], [-0.6, 1.2], [-0.2, 1.36]].map(([z, y]) => [z * k, y * k]), 0.06, 0.02), { c: L.trimL });
        S.l.geo(shell([[0.04, 0], [0.09, 0.02], [0.07, 0.05]].map(([a, b]) => [a * k, b * k]), 20).rotateX(PI / 2), { at: [0, 1.12 * k, 0.4 * k], c: labTone(0.4, 0.22) });
        S.e.geo(new THREE.CircleGeometry(0.035 * k, 16), { at: [0, 1.12 * k, 0.455 * k], c: 0xffffff });
      }
    },
  };
}
