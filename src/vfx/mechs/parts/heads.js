// ---------------------------------------------------------------------------------------
// A MECH'S HEADS (the part library: progress/mechs/parts.js slot `head`): each head's look, built in its joint's frame (vfx/mechs/parts/
// kit.js), its neck's ball first so it seats in any core's neck cup. The head is the frame's face, the first thing read: a head is told
// apart by its silhouette alone (a Medabot is known by its head).
//   clayHead     the haniwa: three hollows in a face of the interstitial, lit from inside while sealed, under a beaked helmet with its neck
//                guard's lames and the mizura at the cheeks; a low blade for a crest. The face sculpted (parts/sdf.js; South, 2026-11-02:
//                the head a focal point): brow ridges falling to a V over the nose, the eyes' hollows sunk under them, convex cheek
//                planes swelling below and turning back into the jaw, a small nose ridge, the mouth's hollow and a chin
//   watcherHead  long sight: a tall narrow helm, one great lens in a labradorite bezel where a face would be, a visor's slit over it,
//                two antenna fins swept back off the crown
// The feminine forms' heads are their own (femheads.js, by `headLookOf`).
// Prior art: Medabots' Medaparts (the head swapped, the Medal unchanged: each head its own character; Rokusho's horn, Metabee's
// antennae); the haniwa warrior in keikō armour (Ōta, Gunma); Gundam's GM and Zeta's visor-and-mono-eye (the Zaku's single eye);
// Armored Core's sensor heads (a head is a sensor, its shape its range).
//
//   HEAD_LOOKS[id] = { neck (m, the neck's length), ball (its radius), build(S) (the head, on the head joint; S.F its form), neckSeg(S)
//   (on the neck joint: the ball and its column) }   headLookOf(id, F) (the look for a form: the hero's here, a feminine form's femheads.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, shell, sidePlate, plate, labTone, jointBall, seam } from './kit.js';
import { blend, carve, meet, ellipsoid, capsule } from './sdf.js';
import { sideSculpt, aoTone } from './arms.js';
import { femHeadLook } from './femheads.js';

const PI = Math.PI;
/** The neck: its ball, and a column of porcelain from the ball up into the head's underside (the head stands HEAD_LIFT over the collar,
 *  partsbody.js), waisted, with one fine bead of trim at its waist; no dark ring. */
const neckSeg = (len, r) => (S) => {
  const k = S.F.joint, top = len + 0.22 * (S.F.head ?? 1) + 0.08, w = r * k;
  jointBall(S, w);
  S.p.lathe([[w * 0.66, w * 0.6], [w * 0.56, top * 0.45], [w * 0.52, top * 0.62], [w * 0.6, top * 0.85], [w * 0.7, top]], { c: L.mid }, 20);
  S.trim.ring(w * 0.56, 0.022, { at: [0, top * 0.55, 0], c: L.trimL }, 24, 4);
};

/** The haniwa's face as one field: a mask's front blended out of the skull, the brows, cheeks, nose and chin swelled on, the eyes'
 *  sockets and the mouth carved in (the hollows' glow sits at their floors). */
const FACE = (() => {
  const mask = meet(0.06, ellipsoid([0, 0.47, 0.18], [0.5, 0.42, 0.42]), (x, y, z) => 0.16 - z);
  let f = blend(0.07, mask,
    capsule([0.38, 0.75, 0.47], [0.05, 0.69, 0.56], 0.075), capsule([-0.38, 0.75, 0.47], [-0.05, 0.69, 0.56], 0.075), // (the brows, falling to a V)
    ellipsoid([0.27, 0.41, 0.44], [0.17, 0.13, 0.13]), ellipsoid([-0.27, 0.41, 0.44], [0.17, 0.13, 0.13]), // (the cheek planes)
    capsule([0, 0.64, 0.56], [0, 0.48, 0.61], 0.04), // (the nose's ridge)
    ellipsoid([0, 0.2, 0.4], [0.2, 0.12, 0.15])); // (the chin)
  f = carve(0.045, f, ellipsoid([0.18, 0.585, 0.62], [0.16, 0.085, 0.11]), ellipsoid([-0.18, 0.585, 0.62], [0.16, 0.085, 0.11]), // (the eyes' sockets)
    ellipsoid([0, 0.345, 0.62], [0.13, 0.055, 0.085])); // (the mouth)
  return f;
})();

export const HEAD_LOOKS = {
  clayHead: {
    neck: 0.42, ball: 0.4, neckSeg: neckSeg(0.42, 0.4),
    build(S) {
      const { p, e } = S;
      p.lathe([[0.001, 0.02], [0.2, -0.02], [0.3, -0.12], [0.4, -0.13], [0.48, -0.04], [0.53, 0.2], [0.55, 0.55], [0.5, 0.85], [0.3, 1.02], [0.001, 1.08]], { c: L.mid }, 28); // (the skull, its underside a rolled rim round a shallow socket the neck rises into)
      sideSculpt(S.core, FACE, [[-0.56, 0.08, 0.12], [0.56, 0.86, 0.72]], 0.042, { key: 'head.clay.face', tone: aoTone(FACE, L.core, L.coreD, 0.05) }); // (the face)
      p.geo(shell([[0.7, 0.62], [0.76, 0.84], [0.68, 1.12], [0.44, 1.32], [0.18, 1.41], [0.001, 1.43]], 32), { sc: [1, 1, 1.1], c: L.mid }); // (the helmet's bowl)
      S.g.ring(0.735, 0.016, { at: [0, 0.63, 0], sc: [1, 1, 1.1], c: L.gold }, 40, 4); // (its brim: a fine gold inlay under the bowl)
      p.geo(sidePlate([[0.42, 0.9], [1.12, 0.98], [1.18, 1.03], [0.48, 1.28]], 0.3, 0.05), { c: L.pale }); // (the beak, ahead)
      for (let i = 0; i < 3; i++) p.geo(new THREE.CylinderGeometry(0.68 + i * 0.08, 0.74 + i * 0.09, 0.2, 28, 1, true, PI * 0.45, PI * 1.1), { at: [0, 0.5 - i * 0.23, -0.02], c: i % 2 ? L.mid : L.pale }); // (the neck guard's lames)
      for (const s of [-1, 1]) { S.trim.cyl(0.1, 0.14, 0.4, { at: [s * 0.6, 0.28, 0.1], c: L.trimM }, 12); S.trim.ball(0.15, { at: [s * 0.62, 0.05, 0.1], sc: [0.8, 1.1, 0.8], c: L.trimM }, 14, 10); } // (the mizura)
      S.trim.geo(sidePlate([[-0.1, 1.3], [0.3, 1.36], [-0.45, 1.95], [-0.62, 1.86]], 0.08, 0.03), { c: L.trimL }); // (the crest: a low blade)
      for (const s of [-1, 1]) e.box(0.22, 0.07, 0.04, { at: [s * 0.18, 0.585, 0.515], rot: [0, s * 0.2, s * -0.14], c: 0xffffff }, 0.02); // (the hollows, at the sockets' floors)
      e.box(0.19, 0.06, 0.04, { at: [0, 0.345, 0.535], c: 0xffffff }, 0.02);
    },
  },
  watcherHead: {
    neck: 0.62, ball: 0.36, neckSeg: neckSeg(0.62, 0.36),
    build(S) {
      const { p, g, l, e } = S;
      p.geo(shell([[0.001, -0.04], [0.36, 0], [0.44, 0.3], [0.46, 0.9], [0.42, 1.45], [0.3, 1.82], [0.12, 1.98], [0.001, 2.0]], 32), { sc: [1, 1, 1.18], c: L.pale }); // (the tall helm)
      S.trim.geo(shell([[0.48, 0.05], [0.52, 0.2], [0.5, 0.36]], 32), { sc: [1, 1, 1.18], c: L.trimM }); // (its collar band)
      g.ring(0.465, 0.014, { at: [0, 1.0, 0], sc: [1, 1, 1.18], c: L.gold }, 40, 4); // (a fine gold inlay round its waist)
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
/** A head's look in a form: the feminine forms' are their own. */
export const headLookOf = (id, F) => (F?.fem ? femHeadLook(id, F) : HEAD_LOOKS[id] || HEAD_LOOKS.clayHead);
