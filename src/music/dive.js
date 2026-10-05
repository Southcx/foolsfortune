// ---------------------------------------------------------------------------------------
// THE DIVE: two cues for under the water, chosen by depth (music/choose.js).
//   THE SHALLOWS   near the surface, in the light: 76 bpm in E Lydian (the raised fourth: a major that floats), a Rhodes rolling in
//                  eighths through Emaj9, F#/E, C#m9, D#m7, G#m7, F#sus; a pad; bubbles; the vibraphone singing Calissa's pour (the
//                  water is the cups') slowed to half speed, and the second time a flute, the steel pan glinting
//   THE DEEP       far down, or in the Well's Lachryma: 54 bpm on the In scale (E F A B C: the Tear's), a tanpura drone (the deep
//                  keeps its secrets: Espada's), whales calling across it, a sonar's bell, a choir far off singing the Tear, a slow
//                  heartbeat, a phased chord that swells and goes
// Both loop and never cadence: the water does not end.
//
// Prior art: Koji Kondo's "Dire, Dire Docks" (Super Mario 64: the Rhodes rolling under a slow tune), David Wise's "Aquatic
// Ambience" (Donkey Kong Country: pads and patience), Spencer Nilsen's Ecco the Dolphin, Simon Chylinski's deep biomes in
// Subnautica, Austin Wintory's Abzû; the humpback's song and the sonar ping of every film submarine.
// ---------------------------------------------------------------------------------------
import { MOTIF, quote } from './motifs.js';

const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
// a few bubbles in a bar, at places that look random but are the same every time round
const BUB = [[0.3, 1], [0.45, 0.7], [1.7, 1.4], [2.2, 0.6], [2.35, 0.8], [3.4, 1.1], [3.55, 0.6]];
const bubbles = (i, n = 3, v = 0.18) => BUB.filter((_, k) => (k + i) % 3 === 0).slice(0, n).map(([b, size]) => E('bubble', b, 0.2, null, v, { size }));

// ---- the shallows
const SH = [
  { arp: [52, 59, 63, 66, 68, 66, 63, 59], root: 40, pad: [63, 66, 68, 71] }, // Emaj9
  { arp: [52, 58, 61, 66, 70, 66, 61, 58], root: 40, pad: [61, 66, 70, 73] }, // F#/E (the Lydian's lift)
  { arp: [52, 59, 63, 66, 68, 66, 63, 59], root: 40, pad: [63, 66, 68, 71] },
  { arp: [52, 58, 61, 66, 70, 66, 61, 58], root: 40, pad: [61, 66, 70, 73] },
  { arp: [49, 56, 59, 63, 64, 63, 59, 56], root: 37, pad: [64, 68, 71, 75] }, // C#m9
  { arp: [51, 54, 58, 61, 66, 61, 58, 54], root: 39, pad: [61, 66, 70, 73] }, // D#m7
  { arp: [44, 51, 56, 59, 63, 59, 56, 51], root: 44, pad: [63, 66, 71, 75] }, // G#m7
  { arp: [42, 49, 54, 59, 61, 59, 54, 49], root: 42, pad: [61, 66, 71, 73] }, // F#sus
];
const SH_TUNE = [
  () => quote(MOTIF.CALISSA, 'vibes', { x: 2, v: 0.36 }),
  () => [],
  () => [E('vibes', 0, 2, 80, 0.34), E('vibes', 2, 2, 82, 0.34)],
  () => [E('vibes', 0, 4, 83, 0.34)],
  () => [E('vibes', 0, 1.5, 80, 0.34), E('vibes', 1.5, 0.5, 78, 0.3), E('vibes', 2, 2, 75, 0.34)],
  () => [E('vibes', 0, 2, 78, 0.34), E('vibes', 2, 2, 73, 0.3)],
  () => [E('vibes', 0, 1, 75, 0.3), E('vibes', 1, 1, 78, 0.32), E('vibes', 2, 2, 80, 0.34)],
  () => [E('vibes', 0, 4, 78, 0.32)],
];
const shallows = (i, second) => {
  const C = SH[i], ev = [
    ...C.arp.map((n, k) => E('rhodes', k * 0.5, 0.9, n + 12, k ? 0.16 : 0.2, { pan: (k % 2 ? 0.3 : -0.3) })),
    E('upright', 0, 4, C.root, 0.28), E('pad', 0, 4.2, C.pad, 0.08, { cutoff: 1100 }), ...bubbles(i),
  ];
  const tune = SH_TUNE[i]();
  ev.push(...(second ? tune.map((e) => ({ ...e, i: 'flute', v: e.v * 0.9 })) : tune));
  if (second && i % 2 === 0) ev.push(E('steelpan', 3.5, 0.5, C.arp[4] + 24, 0.12));
  return ev;
};

export const SHALLOWS = {
  title: 'The Shallows', root: 68, bpm: 76, arrange: true, loopFrom: 0,
  sections: [
    { id: 'light', bars: 8, gain: 1.5, bar: (i) => shallows(i, false) },
    { id: 'light2', bars: 8, gain: 1.5, bar: (i) => shallows(i, true) },
  ],
};

// ---- the deep
const deep = (i) => {
  const ev = [
    E('tanpura', 0, 4, 52, 0.12), E('pad', 0, 4.4, [40, 47, 52], 0.07, { cutoff: 520 }), E('sub', 0, 4, 28, 0.05),
    ...bubbles(i, 1, 0.12),
  ];
  const whale = { 0: [52, 59], 3: [59, 53], 5: [57, 52], 7: [60, 59] }[i];
  if (whale) ev.push(E('whale', 0.5, 6, whale[0], 0.34, { to: whale[1], pan: i % 2 ? 0.45 : -0.45 }));
  if (i % 4 === 0) ev.push(E('bell', 0, 1, 88, 0.13));
  if (i === 3) ev.push(...quote(MOTIF.TEAR, 'hum', { x: 2, up: 0, v: 0.2 }).map((e) => ({ ...e, n: [e.n, e.n - 12] })));
  if (i === 6) ev.push(E('hum', 0, 2, [72, 60], 0.18), E('hum', 2, 4, [71, 59], 0.18)); // (C to B: the Tear a fifth up)
  if (i === 4) ev.push(E('phaseguitar', 0, 4, [64, 69, 71], 0.14, { rate: 0.15, pan: 0 }));
  ev.push(...[[1, 77], [2.5, 76], [3, 84]].filter((_, k) => (i + k) % 3 === 1).map(([b, n]) => E('celesta', b, 1, n, 0.12)));
  if (i >= 4) ev.push(E('taiko', 0, 1, null, 0.13, { size: 1.5 }), E('taiko', 0.35, 1, null, 0.09, { size: 1.5 })); // (a heartbeat: the pressure)
  return ev;
};

export const DEEP = {
  title: 'The Deep', root: 64, bpm: 54, arrange: true, loopFrom: 0, scale: [0, 1, 5, 7, 8], // (the In scale: player.scale())
  sections: [{ id: 'deep', bars: 8, gain: 3.0, bar: deep }],
};
