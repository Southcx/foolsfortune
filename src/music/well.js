// ---------------------------------------------------------------------------------------
// THE WELL'S AMBIENCE: three floors down a mind's Well (docs/plans/SLICE.md, E1), each a slow loop of eight bars at 60, each a step
// further from the light. Not tunes: places. The Well is a mind's own ground (a Lachryma distortion), so it is made of what a mind
// sounds like from inside: a drone held under everything, drips like thoughts surfacing, breath, a heartbeat, a voice far off.
//   FLOOR 1  "Surface Thoughts": the drone on E and B (a tanpura), drips in the pentatonic (bells, high and sparse), a breath swelling
//            in and out, a far voice on "oo" sinking from E to D, a bubble now and then. Uncanny and quiet: you can still hear yourself
//   FLOOR 2  "Undertow": the drone takes on F (the Tear against E, held soft), a slow heartbeat, the whale gliding down, an octatonic
//            celesta that does not resolve, the drips fewer and lower
//   FLOOR 3  "The Bottom of the Well": the FOE's floor. A sub pedal on E, a far taiko on the beat like something walking, strings
//            sustaining E, F and B (a cluster barely held), the heartbeat quickening, a low choir, a swell every four bars
// The Well's music gives way to the battle while something is after you (music/choose.js), and comes back after.
//
// Prior art: the dungeon ambiences of the sixth generation (Silent Hill's Akira Yamaoka, Metroid Prime's Kenji Yamamoto: drones and
// sparse events, not loops of tune), Hyper Light Drifter's Disasterpeace, the Indian tanpura as a ground that never moves, the
// heartbeat as tension (every horror score since Jaws's ostinato), and this game's Tear (F to E).
//
//   import { WELL_FLOORS } from './well.js'   WELL_FLOORS[floor - 1] (music/choose.js plays it while game.well.active)
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const DRIPS = [[0.7, 88], [2.3, 83], [3.5, 91]]; // (beat, midi: three drips, moved round each bar)
const drips = (i, v, down = 0, every = 1) => (i % every ? [] : DRIPS.filter((_, k) => (i + k) % 2 === 0).map(([b, n], k) => E('bell', (b + i * 0.37) % 4, 1, n - down - (i % 3) * 2, v * (k ? 0.7 : 1))));
const heart = (v, beats = [0, 2]) => beats.flatMap((b) => [E('kick', b, 1, null, v), E('kick', b + 0.28, 1, null, v * 0.6)]); // (lub-dub)

const FLOOR1 = {
  title: 'Surface Thoughts', root: 64, bpm: 60, arrange: true, loopFrom: 0, fadeIn: 2, moodless: true,
  sections: [{ id: 'surface', bars: 8, gain: 5, sweep: [5000, 5000], bar: (i) => [
    ...(i % 2 === 0 ? [E('tanpura', 0, 8, 40, 0.18)] : []), ...drips(i, 0.12),
    ...(i % 4 === 0 ? [E('breath', 0, 4, null, 0.12), E('voice', 1, 6, 76, 0.07, { vowel: 'u', vib: 0.01 })] : []),
    ...(i % 4 === 2 ? [E('voice', 0, 6, 74, 0.06, { vowel: 'u', vib: 0.01 })] : []), ...(i === 5 ? [E('bubble', 1.5, 1, null, 0.1, { size: 1.4 })] : []),
  ] }],
};
const FLOOR2 = {
  title: 'Undertow', root: 64, bpm: 60, arrange: true, loopFrom: 0, fadeIn: 2, moodless: true,
  sections: [{ id: 'undertow', bars: 8, gain: 4.5, sweep: [3200, 3200], bar: (i) => [
    ...(i % 2 === 0 ? [E('tanpura', 0, 8, 40, 0.16), E('strings', 0, 8, [53, 52], 0.035, { attack: 2.5, bright: 1200 })] : []), // (F on E, soft)
    ...drips(i, 0.1, 12, 2), ...heart(0.16), ...(i === 1 || i === 5 ? [E('whale', 0, 6, 55, 0.14, { to: 49 })] : []),
    ...(i % 2 ? [77, 79, 80, 82].map((n, k) => E('celesta', 0.5 + k * 0.75, 1, n - (i % 4) * 1, 0.07)) : []),
  ] }],
};
const FLOOR3 = {
  title: 'The Bottom of the Well', root: 64, bpm: 60, arrange: true, loopFrom: 0, fadeIn: 2, moodless: true,
  sections: [{ id: 'bottom', bars: 8, gain: 4, sweep: [2600, 2600], bar: (i) => [
    E('sub', 0, 4, 40, 0.015), ...[0, 1, 2, 3].map((b) => E('taiko', b, 1, null, b ? 0.07 : 0.12, { size: 1.05 })),
    ...(i % 2 === 0 ? [E('strings', 0, 8, [52, 53, 59], 0.06, { attack: 2, bright: 1800 })] : []),
    ...heart(0.12, i < 4 ? [0, 2] : [0, 1, 2, 3]), ...(i % 4 === 0 ? [E('voice', 0, 8, 52, 0.08, { vowel: 'a' }), E('voice', 0, 8, 47, 0.06, { vowel: 'o' })] : []),
    ...(i % 4 === 3 ? [E('riser', 0, 4, null, 0.12)] : []), ...drips(i, 0.07, 24, 4),
  ] }],
};

export const WELL_FLOORS = [FLOOR1, FLOOR2, FLOOR3];
