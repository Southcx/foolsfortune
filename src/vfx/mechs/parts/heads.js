// ---------------------------------------------------------------------------------------
// A MECH'S HEADS (the part library: progress/mechs/parts.js slot `head`): each head's look, built in its joint's frame (vfx/mechs/parts/
// kit.js), its neck's ball first so it seats in any core's neck cup. The head is the frame's face, the first thing read: a head is told
// apart by its silhouette alone (a Medabot is known by its head).
//   clayHead     the haniwa: three hollows in a face of the interstitial, lit from inside while sealed, under a beaked helmet with its neck
//                guard's lames and the mizura at the cheeks; a low blade for a crest
//   watcherHead  long sight: a tall narrow helm, one great lens in a labradorite bezel where a face would be, a visor's slit over it,
//                two antenna fins swept back off the crown
// In the doll form (kit.js FORMS) each head is smooth and smaller, a doll's: a rounded shell with a visor band of the interstitial and
// one lit slit for a face (clayHead a helm with its side pods and a low crest; watcherHead taller, its slit upright, a small lens on
// its brow and the fins swept back thin as two tails of hair).
// Prior art: Elemental Gearbolt's doll faces and Haydee's featureless helm (the doll form); Medabots' Medaparts (the head swapped, the Medal unchanged: each head its own character; Rokusho's horn, Metabee's
// antennae); the haniwa warrior in keikō armour (Ōta, Gunma); Gundam's GM and Zeta's visor-and-mono-eye (the Zaku's single eye);
// Armored Core's sensor heads (a head is a sensor, its shape its range).
//
//   HEAD_LOOKS[id] = { neck (m, the neck's length), ball (its radius), build(S) (the head, on the head joint; S.F its form), neckSeg(S)
//   (on the neck joint: the ball and its column) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, shell, sidePlate, plate, labTone, ball, seam } from './kit.js';

const PI = Math.PI;
const neckSeg = (len, r) => (S) => { const k = S.F.joint; ball(S.g, r * k); S.core.cyl(r * 0.6 * k, r * 0.72 * k, len, { at: [0, len / 2, 0], c: L.core }, 14); S.trim.lathe([[r * 0.95 * k, len * 0.35], [r * 1.05 * k, len * 0.5], [r * 0.95 * k, len * 0.65]], { c: L.trimD }, 20); };
/** A doll's head: an egg of a shell, a visor band of the interstitial round its face, one lit slit (across, or upright). */
function dollHead(S, { tall = 1, upright = false }) {
  const { p, g, e } = S, k = S.F.head;
  p.lathe([[0.001, -0.05], [0.36, 0], [0.5, 0.25], [0.54, 0.6 * tall], [0.48, 0.95 * tall], [0.3, 1.18 * tall], [0.001, 1.25 * tall]].map(([r, y]) => [r * k, y * k]), { sc: [1, 1, 1.08], c: L.pale }, 32);
  S.core.geo(shell([[0.5 * k, 0.32 * k], [0.55 * k, 0.48 * k], [0.55 * k, 0.66 * k], [0.5 * k, 0.8 * k]], 28, -1.0, 2.0), { sc: [1, 1, 1.12], c: L.coreD }); // (the visor's band)
  g.geo(shell([[0.56 * k, 0.3 * k], [0.57 * k, 0.33 * k]], 28, -1.05, 2.1), { sc: [1, 1, 1.12], c: L.gold });
  if (upright) e.box(0.06 * k, 0.4 * k, 0.05, { at: [0, 0.57 * k, 0.6 * k], c: 0xffffff }, 0.02);
  else e.box(0.6 * k, 0.05 * k, 0.05, { at: [0, 0.57 * k, 0.6 * k], c: 0xffffff }, 0.02);
}

export const HEAD_LOOKS = {
  clayHead: {
    neck: 0.42, ball: 0.4, neckSeg: neckSeg(0.42, 0.4),
    build(S) {
      const { p, e } = S, k = S.F.head;
      if (S.F.id === 'doll') {
        dollHead(S, {});
        for (const sd of [-1, 1]) { S.trim.ball(0.2 * k, { at: [sd * 0.55 * k, 0.55 * k, 0], sc: [0.6, 1, 1], c: L.trimM }, 16, 12); S.g.ring(0.17 * k, 0.03, { at: [sd * 0.6 * k, 0.55 * k, 0], rot: [0, 0, PI / 2], c: L.gold }, 20, 4); } // (the side pods: the mizura made small)
        S.trim.geo(sidePlate([[-0.2, 1.05], [0.25, 1.12], [-0.5, 1.6], [-0.62, 1.5]].map(([z, y]) => [z * k, y * k]), 0.05, 0.02), { c: L.trimL }); // (a low crest)
        return;
      }
      p.lathe([[0.001, -0.05], [0.42, -0.02], [0.52, 0.2], [0.55, 0.55], [0.5, 0.85], [0.3, 1.02], [0.001, 1.08]], { c: L.mid }, 28); // (the skull)
      S.core.box(0.72, 0.56, 0.2, { at: [0, 0.48, 0.44], c: L.coreD }, 0.08); // (the face's recess, where the hollows are cut)
      p.geo(shell([[0.7, 0.62], [0.76, 0.84], [0.68, 1.12], [0.44, 1.32], [0.18, 1.41], [0.001, 1.43]], 32), { sc: [1, 1, 1.1], c: L.mid }); // (the helmet's bowl)
      S.core.ring(0.72, 0.045, { at: [0, 0.63, 0], sc: [1, 1, 1.1], c: L.coreD }, 32, 4); // (its brim: a groove under the bowl)
      p.geo(sidePlate([[0.42, 0.9], [1.12, 0.98], [1.18, 1.03], [0.48, 1.28]], 0.3, 0.05), { c: L.pale }); // (the beak, ahead)
      for (let i = 0; i < 3; i++) p.geo(new THREE.CylinderGeometry(0.68 + i * 0.08, 0.74 + i * 0.09, 0.2, 28, 1, true, PI * 0.45, PI * 1.1), { at: [0, 0.5 - i * 0.23, -0.02], c: i % 2 ? L.mid : L.pale }); // (the neck guard's lames)
      for (const s of [-1, 1]) { S.trim.cyl(0.1, 0.14, 0.4, { at: [s * 0.6, 0.28, 0.1], c: L.trimM }, 12); S.trim.ball(0.15, { at: [s * 0.62, 0.05, 0.1], sc: [0.8, 1.1, 0.8], c: L.trimM }, 14, 10); } // (the mizura)
      S.trim.geo(sidePlate([[-0.1, 1.3], [0.3, 1.36], [-0.45, 1.95], [-0.62, 1.86]], 0.08, 0.03), { c: L.trimL }); // (the crest: a low blade)
      for (const s of [-1, 1]) e.box(0.22, 0.07, 0.06, { at: [s * 0.17, 0.58, 0.55], rot: [0, 0, s * -0.14], c: 0xffffff }, 0.03); // (the hollows)
      e.box(0.2, 0.07, 0.06, { at: [0, 0.36, 0.55], c: 0xffffff }, 0.03);
    },
  },
  watcherHead: {
    neck: 0.62, ball: 0.36, neckSeg: neckSeg(0.62, 0.36),
    build(S) {
      const { p, g, l, e } = S, k = S.F.head;
      if (S.F.id === 'doll') {
        dollHead(S, { tall: 1.25, upright: true });
        l.geo(shell([[0.06, 0], [0.12, 0.03], [0.1, 0.07]], 20).rotateX(PI / 2), { at: [0, 1.05 * k, 0.5 * k], c: labTone(0.4, 0.22) }); // (the small lens on the brow)
        e.geo(new THREE.CircleGeometry(0.07 * k, 20), { at: [0, 1.05 * k, 0.58 * k], c: 0xffffff });
        for (const sd of [-1, 1]) S.trim.geo(plate([[0, 0], [0.12, 0], [0.03, 1.6], [-0.03, 1.62]], 0.05, 0.02), { at: [sd * 0.22 * k, 1.2 * k, -0.2 * k], rot: [-1.15, 0, -sd * 0.25], c: L.trimL }); // (the fins as two tails)
        return;
      }
      p.geo(shell([[0.001, -0.04], [0.36, 0], [0.44, 0.3], [0.46, 0.9], [0.42, 1.45], [0.3, 1.82], [0.12, 1.98], [0.001, 2.0]], 32), { sc: [1, 1, 1.18], c: L.pale }); // (the tall helm)
      S.trim.geo(shell([[0.48, 0.05], [0.52, 0.2], [0.5, 0.36]], 32), { sc: [1, 1, 1.18], c: L.trimM }); // (its collar band)
      S.core.ring(0.47, 0.035, { at: [0, 1.0, 0], sc: [1, 1, 1.18], c: L.coreD }, 32, 4); // (a groove round its waist)
      S.core.box(0.62, 0.11, 0.18, { at: [0, 1.32, 0.45], c: L.coreD }, 0.05); // (the visor's slit)
      e.box(0.5, 0.04, 0.05, { at: [0, 1.32, 0.53], c: 0xffffff }, 0.02);
      // the great lens: a bezel of the stone, a gold ring, the glass lit from inside
      l.geo(shell([[0.2, 0], [0.34, 0.02], [0.4, 0.1], [0.38, 0.2], [0.28, 0.24]], 32).rotateX(PI / 2), { at: [0, 0.72, 0.48], c: labTone(0.4, 0.22) });
      g.ring(0.3, 0.035, { at: [0, 0.72, 0.7], rot: [PI / 2, 0, 0], c: L.gold }, 32, 5);
      e.geo(new THREE.CircleGeometry(0.27, 32), { at: [0, 0.72, 0.69], c: 0xffffff });
      for (let k = 0; k < 6; k++) { const a = (k / 6) * PI * 2; g.ball(0.035, { at: [Math.cos(a) * 0.36, 0.72 + Math.sin(a) * 0.36, 0.66], c: L.bronze }, 8, 6); }
      // the antenna fins, swept back off the crown, a groove between each and the helm
      for (const s of [-1, 1]) {
        p.geo(plate([[0, 0], [0.16, 0], [0.04, 1.3], [-0.04, 1.32]], 0.06, 0.02), { at: [s * 0.24, 1.55, -0.1], rot: [-0.62, 0, -s * 0.28], c: L.mid });
        S.trim.geo(plate([[0, 0], [0.1, 0], [0.02, 0.36], [-0.02, 0.36]], 0.04, 0.015), { at: [s * 0.33, 2.55, -0.85], rot: [-0.62, 0, -s * 0.28], c: L.trimL });
      }
      p.geo(sidePlate([[-0.45, 0.2], [0.1, 0.25], [0.05, 0.4], [-0.5, 0.44]], 0.86, 0.04), { c: L.dark }); // (the cheek guard round the back)
      seam(g, [[0.3, 1.7, 0.18], [0.18, 1.5, 0.4], [0.24, 1.15, 0.5]], 0.025);
    },
  },
};
