// ---------------------------------------------------------------------------------------
// THE AGATE'S LOOKS: what a creature that feels two things at once wears on a body with no flame of its own (held by vfx/agatelook.js:
// centred on the creature's crown or body, `scale` its height times its strength, `feeling` the colour the layer is skinned in). The
// Lantern Wisp's own flame carries its agate (vfx/lanternwisplook.js); these are for every other body, the slip jelly first.
//   'agate.flame'  a tongue of Lachryma standing on its crown in the second feeling's colour, its height the mind's strength (WHEEL.md 3:
//                  "the flame's height how strong, the flame's colour the second"); its body glows from inside in the strongest's
//                  (vfx/temper.js look().glow, which the body adds to its emissive). PRIMARY a cone of streaks licking up; SECONDARY
//                  a hot inner pillar; TERTIARY motes shed off its tip
//   'agate.vein'   the Two-Tone knack's (G314): one feeling's marbling wedged over the body, played twice (each agate's colour, its own
//                  seed), so the two lie side by side and never blend, as agateware's clays
//
// Prior art: agateware (two clays wedged, never blended: Espada's word), the Wisp's own lantern (the flame as the body's mood), Okami's
// and Ico's restraint (the state in the surface, never a label); the temper's held band (vfx/library/temper.js), a candle's cone.
//
//   AGATE_EFFECTS   'agate.flame' 'agate.vein'
// ---------------------------------------------------------------------------------------
const L = (o) => o; // (a layer: only for readability)
const HELD = { dur: Infinity, offsetScale: true, in: 2.5, out: 2 };

export const AGATE_EFFECTS = {
  // a tongue of the second feeling on the creature's crown; its scale (the agate look's) is its height
  'agate.flame': { layers: [
    // PRIMARY: a cone of streaks running up, wobbled by a flow, soft at its edges: the flame's skin
    L({ type: 'shape', form: 'cone', ramp: 'feeling', main: 'streaks', tile: [5, 1], scroll: [0.05, 1.4], flow: 'noise', flowK: 0.12, flowScroll: [0, 0.9], mask: 'noise', maskK: 0.35, maskTile: [2, 1], maskScroll: [0, 0.7],
      ...HELD, scale: 0.42, stretch: [0.75, 1.6, 0.75], offset: [0, 0, 0], edgeV: [0.05, 0.55], rim: -0.6, erode: 0.12, rampShift: -0.18, glow: 1.3, core: 0.25, coreAt: 0.35, back: 0.6 }), // (rampShift and back: kept in the feeling's own hue on a bright sky, never washed to white)
    // SECONDARY: the hot inner tongue, thinner and brighter
    L({ type: 'shape', form: 'pillar', ramp: 'feeling', main: 'noise', tile: [2, 1], scroll: [0, 1.8], ...HELD, scale: 0.5, stretch: [1.6, 1.1, 1.6], offset: [0, 0.02, 0], edgeV: [0.04, 0.6], glow: 1.6, core: 0.5, coreAt: 0.5 }),
    // TERTIARY: motes shed off its tip
    L({ type: 'sprites', dur: Infinity, rate: 5, shape: 'soft', offset: [0, 0.55, 0], spawn: 'disc', r: 0.06, dir: 'up', speed: [0.3, 0.7], size: [0.03, 0.06], sizeEnd: 0, life: [0.5, 0.9], drag: 0.6, color: 'feeling', alpha: 0.9 }),
  ] },
  // one of the agate's two feelings marbled over the body (the Two-Tone knack's): played once a feeling
  'agate.vein': { layers: [
    L({ type: 'shape', form: 'band', ramp: 'feeling', main: 'marble', tile: [2, 1], scroll: [0.03, -0.06], flow: 'noise', flowK: 0.06, mask: 'noise', maskK: 0.85, maskTile: [2, 1], maskScroll: [0.015, 0.01],
      ...HELD, scale: 0.42, stretch: [1, 2.3, 1], offset: [0, -0.5, 0], edgeV: [0.12, 0.35], rim: 0.6, erode: 0.25, rampShift: -0.15, glow: 1, core: 0.1, add: 0.35, back: 0.9 }), // (mostly laid over, not added: a vein reads on a lit body by day)
  ] },
};
