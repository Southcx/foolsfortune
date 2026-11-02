// ---------------------------------------------------------------------------------------
// A MECH'S BACK (the part library: progress/mechs/parts.js slots `booster`, `generator` and `back`): what the core carries behind it,
// each built in its mount's frame (vfx/mechs/parts/kit.js; -Z out of the back), all of it clear of the cradle between the shoulder
// blades (vfx/mechs/parts/cores.js CRADLE): the boosters' nozzles low on the back, the generator's dome over the lumbar, the back unit
// on its mount below the well, reaching out over a shoulder.
//   clayBooster / highBooster        two dark porcelain nozzles with gold rims / bigger twin bells under a fairing, their throats lit
//   clayGenerator / bigGenerator / lightGenerator   a kiln's dome with its band and vents / two domes side by side / a small flask
//   missiles    two pod racks on a yoke over the shoulders, six tubes a pod, their caps of the stone
//   shield      a tall curved porcelain shield hung slanting over the left shoulder blade, its boss in trim
// Prior art: Medabots' back parts (a booster pack, a radar dish); Armored Core's back units and boosters (missile racks, radars,
// shields on the shoulders); Evangelion's umbilical socket (the cable's plug); the bottle kiln's dome; the Speed Graphic's bellows.
//
//   BOOSTER_LOOKS[id](S, x)   GENERATOR_LOOKS[id](S)   BACK_LOOKS[id](S)
// ---------------------------------------------------------------------------------------
import { MECH_LOOK as L, shell, plate, labTone, seam, ball } from './kit.js';

const PI = Math.PI;
/** A nozzle hanging down and back: its bell lathed round -Y, its rim gold, its throat lit. */
function nozzle(S, x, r, h) {
  const at = [x, 0, 0], rot = [-0.5, 0, 0];
  S.p.geo(shell([[r * 0.45, 0], [r * 0.5, -h * 0.3], [r * 0.75, -h * 0.65], [r, -h], [r * 1.04, -h * 1.02]], 24), { at, rot, c: L.dark });
  S.g.geo(shell([[r * 1.05, -h * 0.98], [r * 1.1, -h * 1.05], [r * 1.02, -h * 1.1]], 24), { at, rot, c: L.gold });
  S.e.geo(shell([[0.001, -h * 0.6], [r * 0.6, -h * 0.62]], 16), { at, rot, c: 0xffffff });
  S.g.cyl(r * 0.5, r * 0.55, 0.3, { at: [x, 0.1, 0.05], c: L.bronze }, 16);
}

export const BOOSTER_LOOKS = {
  clayBooster(S, x) { for (const s of [-1, 1]) nozzle(S, s * x, 0.42, 0.9); },
  highBooster(S, x) {
    for (const s of [-1, 1]) nozzle(S, s * (x + 0.1), 0.6, 1.25);
    S.p.geo(plate([[-x - 0.8, 0.45], [x + 0.8, 0.45], [x + 0.6, -0.15], [-x - 0.6, -0.15]], 0.5, 0.1), { at: [0, 0.2, -0.15], c: L.mid }); // (the fairing)
    seam(S.g, [[-0.5, 0.6, -0.42], [0.1, 0.35, -0.42], [0.6, 0.55, -0.42]], 0.025);
  },
};

const dome = (S, x, r, c) => {
  S.p.ball(r, { at: [x, 0, -0.1], sc: [1, 0.85, 0.62], c }, 28, 18);
  S.core.ring(r * 1.04, 0.06, { at: [x, 0, -0.1], rot: [PI / 2, 0, 0], sc: [1, 0.85, 1], c: L.coreD }, 32, 4);
  for (let i = 0; i < 4; i++) S.g.slab(0.1, r * 0.36, 0.08, { at: [x - r * 0.36 + i * r * 0.24, r * 0.18, -0.1 - r * 0.6], c: L.bronze });
};
export const GENERATOR_LOOKS = {
  clayGenerator(S) { dome(S, 0, 0.85, L.pale); },
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
};
