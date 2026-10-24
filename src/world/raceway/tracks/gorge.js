// ---------------------------------------------------------------------------------------
// THE GORGE RUN (working name, Espada's to rule; docs/plans/SKIFF-RACING.md section 10): the park's second layer, a track of lines and
// hazards in its south-east. From the hub east along a plateau, over a blind crest (the Corkscrew's: the line hidden until you are over it)
// and off THE BREAK, a cliff with a sandfall down its face, into a SLOT CANYON that winds south between walls to the sand (Antelope
// Canyon's, wide enough for a board), down THE STEP, a second fall, and out onto the rim of THE CRATER: a road spirals down its wall
// round the antlion's pit at the bottom (lean in too far and the sand takes you down), then climbs out west through a cut that passes
// UNDER the spiral's first turn (a bridge: Suzuka's crossover, world/raceway/features.js), fords THE
// MIRROR (a lake: the board skims it), dips and flicks up an Eau Rouge to the plateau, and round a banked hairpin home.
// Data only, in the park's frame (world/raceway/park.js): control points [x, z, y, halfWidth, wind, cut], features as track.js reads them.
//
// Prior art: Laguna Seca's Corkscrew (a blind crest and a fall), Spa's Eau Rouge (a dip and a climb), Antelope Canyon and Star Wars
// Episode I's Beggar's Canyon (a slot to thread), Mario Kart's Shy Guy Falls (a fall with a line down it), Dry Dry Desert's and Sonic
// Riders' Sand Ruins' quicksand pits, the Nordschleife's Karussell (a banked bowl), Wave Race 64 (the water itself as the course).
// ---------------------------------------------------------------------------------------

import { trapRows } from '../track.js';

/** The crater's spiral, as control points: from `a0` (radians round its middle) for `turns`, from radius `r0` to `r1`, its road on the
 *  bowl's wall a little under its surface (park.js craterAt). */
const CRATER = { x: 560, z: -760, r: 260, rf: 60, y: 10, floor: -45 };
function spiral({ a0, turns, r0, r1, step = 0.62, w = 11 }) {
  const out = [], n = Math.round((turns * Math.PI * 2) / step);
  for (let k = 0; k <= n; k++) {
    const a = a0 - k * step, r = r0 + (r1 - r0) * (k / n), d = r, y = d < CRATER.rf ? CRATER.floor : CRATER.floor + ((d - CRATER.rf) / (CRATER.r - CRATER.rf)) * (CRATER.y - CRATER.floor);
    out.push([CRATER.x + Math.cos(a) * r, CRATER.z + Math.sin(a) * r, y - 0.6, w, 0, 0]);
  }
  return out;
}

const CONTROL = [
  [110, -40, 25, 13, 0, 0], [260, -32, 26, 13, 0, 0], //                   0-1 the start straight, east off the hub
  [400, -26, 29, 12, 0.3, 0], [470, -28, 33, 12, 0.3, 0], //             2-3 the rise to the blind crest
  [530, -34, 30, 12, 0, 0], [580, -40, 31, 12, 0, 0], //                 4-5 the fall behind it (the Corkscrew), the lip of the Break
  [598, -46, 12, 12, 0, 4], //                                           6 THE BREAK's foot (19 m: the sandfall)
  [660, -100, 10, 11, 0.4, 3], [690, -200, 9, 10, 0.6, 3], [755, -300, 8, 9, 0.6, 3], [735, -410, 7, 10, 0.4, 3], // 7-10 the slot canyon
  [762, -500, 6, 11, 0, 3], [770, -516, -5, 11, 0, 3], //                11-12 THE STEP (11 m: a second fall, onto the crater's rim)
  ...spiral({ a0: 0.8, turns: 1.63, r0: 203, r1: 92 }), //               the crater's spiral, down its wall (ends facing west)
  [400, -735, -28, 11, 0, 3], [330, -740, -14, 11, 0, 3], [290, -720, 0, 12, 0, 3], // the climb out, west, through a cut UNDER the spiral
  [250, -640, 8, 12, 0, 0],
  [244, -560, 8.4, 13, 0, 0], [240, -470, 8.4, 13, 0.3, 0], [236, -380, 8.4, 13, 0.3, 0], // THE MIRROR's ford (the lake at 9: skimmed)
  [214, -300, 2, 12, 0, 0], [180, -230, 20, 12, 0, 0], //               the dip, and Eau Rouge's flick up
  [120, -190, 25, 13, 0, 0], [40, -150, 25, 14, 0, 0], [10, -90, 25, 14, 0, 0], // the Karussell: a banked hairpin home
];
const at = (i) => i; // (control points by index: the spiral's are counted in)
const SPIRAL0 = 13, SPIRAL1 = CONTROL.length - 13; // (the first and last of the spiral's points)

export const GORGE = {
  id: 'gorge', name: 'the Gorge Run', at: { x: 0, z: 0, rot: 0 },
  control: CONTROL,
  features: {
    start: { cp: 0, at: 20 },
    gates: [[2, 0], [7, 0], [10, 0], [SPIRAL0 + 2, 0], [SPIRAL1, 0], [CONTROL.length - 7, 0], [CONTROL.length - 4, 0], [CONTROL.length - 2, 0]],
    kickers: [[1, 30, 2.4, 9], [8, 20, 2, 8], [SPIRAL1 + 2, -20, 2.6, 10]].map(([cp, at, h, len]) => ({ cp, at, h, len })),
    ramps: [[9, 30, -4, 3, 2.4, 8], [SPIRAL0 + 5, 0, 5, 3.5, 2.2, 8]].map(([cp, at, lat, w, h, len]) => ({ cp, at, lat, w, h, len })),
    plates: [[0, 60, 0], [2, 40, 3], [9, 10, 0], [SPIRAL0 + 8, 0, 0], [CONTROL.length - 6, 20, 0], [CONTROL.length - 3, 20, -3]].map(([cp, at, lat]) => ({ cp, at, lat, len: 7, w: 2.6 })),
    lanes: [[0, 110, -8, 50], [0, 2400, 7, 60]].map(([cp, at, lat, len]) => ({ cp, at, lat, len, w: 2.4 })), // (the vein lanes: the pool refilled: boardrules.js)
    geysers: [[SPIRAL1 + 1, 20, 3]].map(([cp, at, lat]) => ({ cp, at, lat })),
    glideLips: [{ cp: 5, from: -4, to: 60 }, { cp: 11, from: -2, to: 30 }],
    sandfalls: [{ cp: 5 }, { cp: 11 }],
    bowls: [{ from: [CONTROL.length - 4, -20], to: [CONTROL.length - 1, 20], bank: 0.75 }], // (the Karussell: banked 37 degrees)
    bridges: [{ from: [SPIRAL0 + 5, 0], to: [SPIRAL0 + 8, 0] }], // (where the spiral passes over the climb out: a deck)
    rails: [
      { from: [3, -30, 4], to: [5, -10, 4], lift: 1.8, along: true }, //        (over the blind crest, its line shown)
      { from: [8, -40, 0], to: [10, 20, 0], lift: 1.6, along: true, wave: 2 }, // (down the slot canyon, weaving)
      { from: [SPIRAL0 + 1, 0, -6], to: [SPIRAL0 + 9, 0, -6], lift: 1.4, along: true }, // (the spiral's inside: a long curve, fast)
    ].map((r) => ({ ...r, clear: 0.9 })),
    rings: [[0, 120, 0, 5], [5, 30, 0, 0], [5, 55, 0, 0], [CONTROL.length - 5, 10, 0, 5]],
    ringGlide: 5,
    // the traps, for a haunted run only (track.js FEATURES.traps): the plateau, the crest, the slot, the spiral, the ford's dip
    traps: trapRows([['pillars', 1, 60, 0], ['turret', 4, 20, 0], ['sinkhole', 8, 50, 2], ['pendulum', SPIRAL0 + 6, 0, 0], ['gust', SPIRAL0 + 10, 0, 0], ['gusher', CONTROL.length - 6, 40, 0]]),
  },
};
export { CRATER as GORGE_CRATER, at as gorgeAt };
