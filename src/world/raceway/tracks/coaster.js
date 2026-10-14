// ---------------------------------------------------------------------------------------
// THE COASTER (working name, Espada's to rule; docs/plans/SKIFF-RACING.md section 10): the park's third layer, a grinder's track in its
// north-east. The ground road leaves the hub east and climbs THE LIFT, a long banked sweep up onto THE STATION, a mesa 40 m over the
// sand (a coaster's chain hill: the climb is the price of the fall). From the station two lines: the road, a wide sweeper down the
// mesa's back with a Karussell bowl and kickers; or THE COASTER RAIL, hopped onto at the station's edge: a first drop, camelback hills,
// a banked turn, a LOOP, a HELIX round a ruin tower, and down onto the road again near the end (courier/skiff/grind.js rides it). Rail
// to rail: a second rail leaves the road's bowl and crosses under the first.
// Data only, in the park's frame: control points [x, z, y, halfWidth, wind, cut], features as track.js reads them; `coaster` rails as
// coasterrail.js lays them ([x, z, y] points, { loop }, { helix }).
//
// Prior art: roller coasters (the chain lift, the first drop, camelbacks, the loop, the helix finale), Mario Kart 8's Mount Wario and
// Cloudtop Cruise (a climb paid back as a descent), Sonic Adventure 2's City Escape and Sonic Riders' rails, Hot Wheels' loops, SSX Tricky's
// rail lines over a course, the Nordschleife's Karussell.
// ---------------------------------------------------------------------------------------

const CONTROL = [
  [60, 120, 24, 13, 0, 0], [230, 140, 25, 13, 0, 0], //                         0-1 the start straight, east off the hub
  [410, 190, 30, 12, 0.3, 0], [570, 280, 38, 12, 0.3, 0], [680, 410, 47, 12, 0.5, 0], [730, 560, 56, 12, 0.3, 0], // 2-5 THE LIFT
  [710, 690, 63, 14, 0, 0], [630, 780, 63, 14, 0, 0], //                        6-7 THE STATION (the rail leaves from its edge)
  [510, 860, 57, 12, 0, 0], [370, 900, 47, 12, 0.4, 0], [230, 870, 37, 12, 0.4, 0], // 8-10 the road down the mesa's back
  [150, 760, 31, 12, 0, 0], [130, 650, 28, 13, 0, 0], [190, 560, 27, 13, 0, 0], // 11-13 the bowl (the rail comes down here)
  [150, 440, 25, 12, 0.6, 0], [60, 330, 24, 12, 0.6, 0], [20, 210, 24, 12, 0, 0], // 14-16 home
];

export const COASTER = {
  id: 'coaster', name: 'the Coaster', at: { x: 0, z: 0, rot: 0 },
  control: CONTROL,
  features: {
    start: { cp: 0, at: 20 },
    gates: [[1, 40], [3, 0], [5, 0], [7, 0], [9, 0], [11, 0], [13, 0], [15, 0]],
    kickers: [[2, 30, 2.4, 9], [8, 40, 3, 11], [10, 30, 2.4, 9], [14, 20, 2.6, 10]].map(([cp, at, h, len]) => ({ cp, at, h, len })),
    ramps: [[4, 20, 5, 3.5, 2.6, 9], [9, -30, -5, 3.5, 2.4, 9], [15, 30, 5, 3.5, 2.4, 8]].map(([cp, at, lat, w, h, len]) => ({ cp, at, lat, w, h, len })),
    plates: [[1, 60, 0], [3, 20, 3], [5, 10, -3], [8, 10, 0], [12, 30, 0], [16, 10, 0]].map(([cp, at, lat]) => ({ cp, at, lat, len: 7, w: 2.6 })),
    bowls: [{ from: [11, -40], to: [13, 0], bank: 0.7 }],
    glideLips: [{ cp: 8, from: 40, to: 90 }],
    rails: [
      { from: [2, -20, -5], to: [3, 40, -5], lift: 1.6, along: true }, //  (up the lift's inside)
      { from: [12, -10, 4], to: [14, 30, 4], lift: 1.8, along: true, wave: 1.5 }, // (out of the bowl, under the coaster's run-out)
    ].map((r) => ({ ...r, clear: 0.9 })),
    // THE COASTER RAIL: [x, z, y], from the station's edge (hopped onto from the road: it begins a board's hop over the road)
    coaster: [{
      id: 'coaster', clear: 1.5, path: [
        [690, 705, 64.8], [672, 728, 64.8], [655, 745, 64.4], //                          on the station, along the road, then off its edge
        [625, 740, 60], [590, 715, 44], //                                                THE FIRST DROP
        [555, 690, 47], [520, 668, 40], [485, 650, 45], [450, 630, 39], //                camelbacks
        [420, 600, 36], [410, 565, 36], //                                                a banked turn south
        { loop: 9, shift: 3.5, push: 16 }, //                                             THE LOOP
        [400, 520, 35], [370, 490, 35], [330, 480, 36], //                                out, west
        { helix: { r: 16, turns: 1.5, drop: 6, side: 1, push: 2 } }, //                    THE HELIX round the tower
        [290, 520, 30], [250, 560, 30], [215, 575, 29.5], //                              down onto the road's bowl
      ],
    }],
    rings: [[7, 30, 0, 6], [10, 60, 0, 5], [13, 20, 0, 4]],
    ringGlide: 5,
  },
};
