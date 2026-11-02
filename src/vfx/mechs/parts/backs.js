// ---------------------------------------------------------------------------------------
// A MECH'S BACK (the part library: progress/mechs/parts.js slots `booster`, `generator` and `back`): what the core carries behind it,
// each built in its mount's frame (vfx/mechs/parts/kit.js; -Z out of the back), all of it clear of the cradle between the shoulder
// blades (vfx/mechs/parts/cores.js CRADLE): the boosters' nozzles low on the back, the generator's dome over the lumbar, the back unit
// on its mount below the well, reaching out over a shoulder.
//   clayBooster / highBooster        two dark porcelain nozzles with gold rims / bigger twin bells under a fairing, their throats lit;
//                                    each nozzle a yoke and a bell on a gimbal (nozzleYoke, nozzleBell, BOOSTER_NOZZLES: anim/boosters.js)
//   clayGenerator / bigGenerator / lightGenerator   a kiln's dome with its band and vents / two domes side by side / a small flask
//   missiles    two pod racks on a yoke over the shoulders, six tubes a pod, their caps of the stone
//   shield      a tall curved porcelain shield hung slanting over the left shoulder blade, its boss in trim
//   flamer      two fuel tanks banded in gold on the back, a hose up to an arm over the right shoulder, its nozzle facing forward
//               with a pilot flame lit in its mouth (the cone it throws is vfx/mechs/fire/flamer.js's, FIRE_LOOK.flamer.nozzle its mouth)
// Prior art: Medabots' back parts (a booster pack, a radar dish); Armored Core's back units and boosters (missile racks, radars,
// shields on the shoulders); Evangelion's umbilical socket (the cable's plug); a rocket engine's gimballed nozzle (the yoke and its trunnions); the bottle kiln's dome; the Speed Graphic's bellows.
//
//   BOOSTER_LOOKS[id](S, x) (the housing)   BOOSTER_NOZZLES[id](x)   nozzleYoke(S, r)   nozzleBell(S, r, h)   GENERATOR_LOOKS[id](S)   BACK_LOOKS[id](S)
// ---------------------------------------------------------------------------------------
import { MECH_LOOK as L, shell, plate, labTone, seam, ball } from './kit.js';

const PI = Math.PI;
/** A booster's nozzle as an articulated part (anim/boosters.js gimbals it): its yoke, a bronze collar on the mount and a gold fork
 *  either side of the bell's trunnions (built at the pivot, the yoke's joint, turning about X); its bell, lathed round -Y from the
 *  pivot (the bell's joint, turning about Z inside the fork), its rim gold, its throat lit. Pointed by the thrust, never fixed. */
export function nozzleYoke(S, r) {
  S.g.cyl(r * 0.5, r * 0.58, 0.3, { at: [0, 0.16, 0], c: L.bronze }, 16);
  for (const s of [-1, 1]) { S.g.slab(0.08, 0.34, 0.16, { at: [s * r * 0.62, -0.02, 0], c: L.gold }); ball(S.g, 0.07, [s * r * 0.58, -0.12, 0]); }
}
export function nozzleBell(S, r, h) {
  S.p.geo(shell([[r * 0.45, -0.08], [r * 0.5, -h * 0.3], [r * 0.75, -h * 0.65], [r, -h], [r * 1.04, -h * 1.02]], 24), { c: L.dark });
  S.g.geo(shell([[r * 1.05, -h * 0.98], [r * 1.1, -h * 1.05], [r * 1.02, -h * 1.1]], 24), { c: L.gold });
  S.e.geo(shell([[0.001, -h * 0.6], [r * 0.6, -h * 0.62]], 16), { c: 0xffffff });
  S.g.ring(r * 0.52, 0.035, { at: [0, -h * 0.3, 0], rot: [PI / 2, 0, 0], c: L.gold }, 24, 4); // (a band at the throat)
}
/** Each booster's nozzles: where their pivots stand on the mount (x from its centre, y, z) and their sizes (r the mouth, h the bell). */
export const BOOSTER_NOZZLES = {
  clayBooster: (x) => [-1, 1].map((s) => ({ x: s * x, y: 0, z: 0, r: 0.42, h: 0.9 })),
  highBooster: (x) => [-1, 1].map((s) => ({ x: s * (x + 0.1), y: 0, z: 0, r: 0.6, h: 1.25 })),
};
/** The booster's fixed housing (the nozzles are hung on their gimbals apart from it: anim/boosters.js). */
export const BOOSTER_LOOKS = {
  clayBooster(S, x) { S.g.rod([-x, 0.32, 0.05], [x, 0.32, 0.05], 0.09, { c: L.bronze }, 10); },
  highBooster(S, x) {
    S.g.rod([-x - 0.1, 0.32, 0.05], [x + 0.1, 0.32, 0.05], 0.11, { c: L.bronze }, 10);
    S.p.geo(plate([[-x - 0.8, 0.45], [x + 0.8, 0.45], [x + 0.6, -0.15], [-x - 0.6, -0.15]], 0.5, 0.1), { at: [0, 0.35, -0.15], c: L.mid }); // (the fairing, over the pivots)
    seam(S.g, [[-0.5, 0.75, -0.42], [0.1, 0.5, -0.42], [0.6, 0.7, -0.42]], 0.025);
  },
};

const dome = (S, x, r, c) => {
  S.p.ball(r, { at: [x, 0, -0.1], sc: [1, 0.85, 0.62], c }, 28, 18);
  S.core.ring(r * 1.04, 0.06, { at: [x, 0, -0.1], rot: [PI / 2, 0, 0], sc: [1, 0.85, 1], c: L.coreD }, 32, 4);
  for (let i = 0; i < 4; i++) S.g.slab(0.1, r * 0.36, 0.08, { at: [x - r * 0.36 + i * r * 0.24, r * 0.18, -0.1 - r * 0.6], c: L.bronze });
};
export const GENERATOR_LOOKS = {
  /** The kiln's dome dressed down (Calissa, 2026-11-02: it stood over the cradle): smaller, sunk into the back, a flush gilt rim, its
   *  vents five fine slots cut across its face. */
  clayGenerator(S) {
    const r = 0.62, c = 0.08, sz = 0.42, face = (x, y) => c - sz * r * Math.sqrt(Math.max(0, 1 - (x / r) ** 2 - (y / (0.85 * r)) ** 2));
    S.p.ball(r, { at: [0, 0, c], sc: [1, 0.85, sz], c: L.pale }, 28, 18);
    S.g.ring(r * 1.0, 0.03, { at: [0, 0, c - 0.02], rot: [PI / 2, 0, 0], sc: [1, 0.85, 1], c: L.gold }, 32, 4);
    for (let i = 0; i < 5; i++) { const y = (i - 2) * 0.1, w = r * 1.1 * Math.sqrt(Math.max(0, 1 - (y / (0.85 * r)) ** 2)) - 0.12, z = face(0, y); S.core.slab(w, 0.022, 0.05, { at: [0, y, z + 0.012], rot: [Math.atan2(-(y / (0.85 * r) ** 2) * sz * r, 1) * 0.9, 0, 0], c: L.coreD }); }
  },
  bigGenerator(S) { dome(S, -0.62, 0.78, L.pale); dome(S, 0.62, 0.78, L.mid); S.g.ring(0.3, 0.05, { at: [0, 0.2, -0.45], rot: [PI / 2, 0, 0], c: L.gold }, 16, 4); },
  lightGenerator(S) {
    S.p.lathe([[0.001, -0.5], [0.4, -0.45], [0.48, -0.15], [0.3, 0.15], [0.16, 0.3], [0.2, 0.42], [0.001, 0.45]], { at: [0, 0, -0.4], rot: [0.1, 0, 0], c: L.mid }, 24); // (the flask)
    S.g.ring(0.19, 0.04, { at: [0, 0.36, -0.37], c: L.gold }, 16, 4);
  },
};

export const BACK_LOOKS = {
  missiles(S) {
    const { p, g, l } = S;
    for (const s of [-1, 1]) {
      g.rod([s * 0.3, 0, -0.1], [s * 1.6, 1.5, -0.25], 0.12, { c: L.bronze }, 8); ball(g, 0.2, [s * 1.6, 1.5, -0.25]);
      p.box(1.0, 1.15, 1.7, { at: [s * 1.75, 2.0, -0.2], rot: [-0.35, 0, 0], c: L.pale }, 0.18);
      S.core.box(1.04, 0.1, 1.74, { at: [s * 1.75, 1.75, -0.29], rot: [-0.35, 0, 0], c: L.coreD }, 0.04);
      for (let i = 0; i < 6; i++) { const x = s * 1.75 + ((i % 3) - 1) * 0.3, y = 2.36 + Math.floor(i / 3) * 0.32; l.cyl(0.12, 0.12, 0.1, { at: [x, y + 0.2, 0.42 - Math.floor(i / 3) * 0.1], rot: [PI / 2 - 0.35, 0, 0], c: labTone(i / 6, 0.22) }, 12); }
    }
  },
  shield(S) {
    const { p, g, l } = S;
    g.rod([0.2, 0, -0.1], [1.0, 0.9, -0.4], 0.12, { c: L.bronze }, 8); ball(g, 0.2, [1.0, 0.9, -0.4]);
    p.geo(shell([[1.6, -1.6], [1.68, -0.6], [1.7, 0.6], [1.62, 1.6]], 24, PI - 0.55, 1.1), { at: [1.1, 1.3, 1.0], rot: [0.1, 0, -0.25], c: L.pale }); // (the shield's curve)
    S.trim.geo(shell([[1.64, -1.5], [1.72, -0.5]], 24, PI - 0.5, 1.0), { at: [1.1, 1.3, 1.0], rot: [0.1, 0, -0.25], c: L.trimM });
    S.trim.ball(0.36, { at: [1.5, 1.4, -0.62], sc: [1, 1, 0.5], c: L.trimL }, 20, 14); // (its boss)
    g.ring(0.4, 0.04, { at: [1.5, 1.4, -0.6], rot: [PI / 2, 0, 0], c: L.gold }, 24, 4);
  },
  // ------------------------------------------------------------ the flamer (the city's fire, MECHS.md 9.1: Dovina's back part, G held)
  flamer(S) {
    const { p, g, l } = S, z = -0.78;
    for (const s of [-1, 1]) { // (the fuel tanks, upright side by side, domed, banded)
      const x = s * 0.5;
      p.cyl(0.4, 0.4, 1.9, { at: [x, 0.95, z], c: L.pale }, 20); p.ball(0.4, { at: [x, 1.9, z], sc: [1, 0.55, 1], c: L.pale }, 20, 12); p.ball(0.4, { at: [x, 0, z], sc: [1, 0.45, 1], c: L.mid }, 20, 12);
      for (const y of [0.35, 1.0, 1.65]) g.ring(0.42, 0.045, { at: [x, y, z], c: L.gold }, 24, 4);
      l.ball(0.1, { at: [x, 1.3, z - 0.4], sc: [1, 1, 0.5] }, 12, 8); // (a gauge's lens)
    }
    S.core.rod([-0.5, 2.05, z], [-0.95, 2.35, -0.2], 0.09, { c: L.coreD }, 8); // (the hose up to the arm)
    g.rod([-0.3, 1.3, -0.1], [-1.25, 2.3, 0.3], 0.13, { c: L.bronze }, 8); ball(g, 0.22, [-1.25, 2.3, 0.3]); // (the arm over the right shoulder, its elbow)
    g.rod([-1.25, 2.3, 0.3], [-1.55, 2.45, 1.05], 0.11, { c: L.bronze }, 8);
    p.cyl(0.32, 0.2, 0.75, { at: [-1.55, 2.45, 1.33], rot: [PI / 2, 0, 0], c: L.dark }, 18); // (the nozzle, flaring to its mouth)
    g.ring(0.33, 0.05, { at: [-1.55, 2.45, 1.7], rot: [PI / 2, 0, 0], c: L.gold }, 20, 4);
    S.e.ring(0.16, 0.05, { at: [-1.55, 2.45, 1.66], rot: [PI / 2, 0, 0], c: 0xff8a3a }, 16, 4); // (the pilot flame)
  },
};
