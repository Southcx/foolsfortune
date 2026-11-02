// ---------------------------------------------------------------------------------------
// A MECH'S BACK (the part library: progress/mechs/parts.js slots `booster`, `generator` and `back`): what the core carries behind it,
// each built in its mount's frame (vfx/mechs/parts/kit.js; -Z out of the back), all of it clear of the cradle between the shoulder
// blades (vfx/mechs/parts/cores.js CRADLE): the boosters' nozzles low on the back, the generator's dome over the lumbar, the back unit
// on its mount below the well, reaching out over a shoulder.
//   clayBooster / highBooster        two slate nozzles with gold rims / bigger twin bells under a fairing, their throats lit
//   clayGenerator / bigGenerator / lightGenerator   a kiln's dome with its band and vents / two domes side by side / a small flask
//   missiles    two pod racks on a yoke over the shoulders, six tubes a pod, their caps of the stone
//   shield      a tall curved porcelain shield hung slanting over the left shoulder blade, its boss of the stone
//   greatVane   the Dreamvane's dowsing vane as a radar: a mast up past the right shoulder, a turning dish ring and a gold arrow vane
//   greatLens   the Veritome as a bellows camera: a book-bodied box over the right shoulder, its bellows and its lens ahead, the glass lit
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
  S.p.geo(shell([[r * 0.45, 0], [r * 0.5, -h * 0.3], [r * 0.75, -h * 0.65], [r, -h], [r * 1.04, -h * 1.02]], 24), { at, rot, c: L.slate });
  S.g.geo(shell([[r * 1.05, -h * 0.98], [r * 1.1, -h * 1.05], [r * 1.02, -h * 1.1]], 24), { at, rot, c: L.gold });
  S.e.geo(shell([[0.001, -h * 0.6], [r * 0.6, -h * 0.62]], 16), { at, rot, c: 0xffffff });
  S.g.cyl(r * 0.5, r * 0.55, 0.3, { at: [x, 0.1, 0.05], c: L.bronze }, 16);
}

export const BOOSTER_LOOKS = {
  clayBooster(S, x) { for (const s of [-1, 1]) nozzle(S, s * x, 0.42, 0.9); },
  highBooster(S, x) {
    for (const s of [-1, 1]) nozzle(S, s * (x + 0.1), 0.6, 1.25);
    S.p.geo(plate([[-x - 0.8, 0.45], [x + 0.8, 0.45], [x + 0.6, -0.15], [-x - 0.6, -0.15]], 0.5, 0.1), { at: [0, 0.2, -0.15], c: L.ivory }); // (the fairing)
    seam(S.g, [[-0.5, 0.6, -0.42], [0.1, 0.35, -0.42], [0.6, 0.55, -0.42]], 0.025);
  },
};

const dome = (S, x, r, c) => {
  S.p.ball(r, { at: [x, 0, -0.1], sc: [1, 0.85, 0.62], c }, 28, 18);
  S.p.ring(r * 1.04, 0.06, { at: [x, 0, -0.1], rot: [PI / 2, 0, 0], sc: [1, 0.85, 1], c: L.umber }, 32, 4);
  for (let i = 0; i < 4; i++) S.g.slab(0.1, r * 0.36, 0.08, { at: [x - r * 0.36 + i * r * 0.24, r * 0.18, -0.1 - r * 0.6], c: L.bronze });
};
export const GENERATOR_LOOKS = {
  clayGenerator(S) { dome(S, 0, 0.85, L.bone); },
  bigGenerator(S) { dome(S, -0.62, 0.78, L.bone); dome(S, 0.62, 0.78, L.ivory); S.g.ring(0.3, 0.05, { at: [0, 0.2, -0.45], rot: [PI / 2, 0, 0], c: L.gold }, 16, 4); },
  lightGenerator(S) {
    S.p.lathe([[0.001, -0.5], [0.4, -0.45], [0.48, -0.15], [0.3, 0.15], [0.16, 0.3], [0.2, 0.42], [0.001, 0.45]], { at: [0, 0, -0.4], rot: [0.1, 0, 0], c: L.sand }, 24); // (the flask)
    S.g.ring(0.19, 0.04, { at: [0, 0.36, -0.37], c: L.gold }, 16, 4);
  },
};

export const BACK_LOOKS = {
  missiles(S) {
    const { p, g, l } = S;
    for (const s of [-1, 1]) {
      g.rod([s * 0.3, 0, -0.1], [s * 1.6, 1.5, -0.25], 0.12, { c: L.bronze }, 8); ball(g, 0.2, [s * 1.6, 1.5, -0.25]);
      p.box(1.0, 1.15, 1.7, { at: [s * 1.75, 2.0, -0.2], rot: [-0.35, 0, 0], c: L.bone }, 0.18);
      p.box(1.04, 0.1, 1.74, { at: [s * 1.75, 1.75, -0.29], rot: [-0.35, 0, 0], c: L.umber }, 0.04);
      for (let i = 0; i < 6; i++) { const x = s * 1.75 + ((i % 3) - 1) * 0.3, y = 2.36 + Math.floor(i / 3) * 0.32; l.cyl(0.12, 0.12, 0.1, { at: [x, y + 0.2, 0.42 - Math.floor(i / 3) * 0.1], rot: [PI / 2 - 0.35, 0, 0], c: labTone(i / 6, 0.22) }, 12); }
    }
  },
  shield(S) {
    const { p, g, l } = S;
    g.rod([0.2, 0, -0.1], [1.0, 0.9, -0.4], 0.12, { c: L.bronze }, 8); ball(g, 0.2, [1.0, 0.9, -0.4]);
    p.geo(shell([[1.6, -1.6], [1.68, -0.6], [1.7, 0.6], [1.62, 1.6]], 24, PI - 0.55, 1.1), { at: [1.1, 1.3, 1.0], rot: [0.1, 0, -0.25], c: L.bone }); // (the shield's curve)
    p.geo(shell([[1.64, -1.5], [1.72, -0.5]], 24, PI - 0.5, 1.0), { at: [1.1, 1.3, 1.0], rot: [0.1, 0, -0.25], c: L.terracotta });
    l.ball(0.36, { at: [1.5, 1.4, -0.62], sc: [1, 1, 0.5], c: labTone(0.35, 0.22) }, 20, 14); // (its boss)
    g.ring(0.4, 0.04, { at: [1.5, 1.4, -0.6], rot: [PI / 2, 0, 0], c: L.gold }, 24, 4);
  },
  greatVane(S) {
    const { p, g, l } = S;
    p.cyl(0.14, 0.2, 3.6, { at: [-1.3, 1.8, -0.3], rot: [0, 0, -0.08], c: L.ivory }, 14); // (the mast)
    g.rod([-0.2, 0, -0.1], [-1.25, 0.6, -0.3], 0.12, { c: L.bronze }, 8);
    g.ring(1.0, 0.05, { at: [-1.45, 3.4, -0.3], rot: [PI / 2, 0, 0.5], c: L.gold }, 36, 4); // (the dish ring)
    g.ring(0.7, 0.04, { at: [-1.45, 3.4, -0.3], rot: [PI / 2, 0, -0.4], c: L.bronze }, 32, 4);
    g.geo(plate([[-0.9, -0.08], [0.6, -0.08], [0.6, -0.25], [1.0, 0], [0.6, 0.25], [0.6, 0.08], [-0.9, 0.08], [-1.1, 0.35], [-1.1, -0.35]], 0.05, 0.02), { at: [-1.45, 3.95, -0.3], rot: [-PI / 2, 0, 0], c: L.gold }); // (the arrow vane)
    l.geo(shell([[0.001, 0.35], [0.18, 0.1], [0.001, -0.3]], 6), { at: [-1.45, 2.75, -0.3], c: labTone(0.6, 0.3) }); // (the dowsing bob)
  },
  greatLens(S) {
    const { p, g, l, e } = S;
    g.rod([-0.2, 0, -0.1], [-1.4, 1.5, -0.2], 0.13, { c: L.bronze }, 8); ball(g, 0.22, [-1.4, 1.5, -0.2]);
    p.box(1.3, 1.1, 1.0, { at: [-1.6, 2.1, -0.4], c: L.bone }, 0.12); // (the book's body)
    p.box(0.2, 1.14, 1.04, { at: [-0.98, 2.1, -0.4], c: L.terracotta }, 0.06); // (its spine)
    for (let i = 0; i < 4; i++) p.box(0.95 - i * 0.12, 0.85 - i * 0.1, 0.24, { at: [-1.6, 2.1, 0.22 + i * 0.22], c: i % 2 ? L.umber : L.slate }, 0.06); // (the bellows)
    p.geo(shell([[0.32, 0], [0.36, 0.1], [0.36, 0.5], [0.4, 0.6]], 24).rotateX(PI / 2), { at: [-1.6, 2.1, 1.1], c: L.ivory }); // (the lens barrel)
    l.ring(0.38, 0.06, { at: [-1.6, 2.1, 1.72], rot: [PI / 2, 0, 0], c: labTone(0.45, 0.22) }, 24, 5);
    e.geo(shell([[0.001, 0], [0.33, 0]], 24).rotateX(PI / 2), { at: [-1.6, 2.1, 1.7], c: 0xffffff });
  },
};
