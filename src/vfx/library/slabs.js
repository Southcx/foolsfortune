// ---------------------------------------------------------------------------------------
// CARVING A SLAB'S EFFECTS (library entries: vfx/library.js spreads them in; vfx/garden/slablook.js plays them on Petra's `slab.use` and
// `slab.carve`; docs/plans/SEEDS-SLABS-SCANS.md 2.2). Sized to a spirit slab's cells (5 cm) and played on a planetoid, whose up is the
// ground's own: every layer throws along the caller's `normal` (the face struck, out of the stone) or `dir` (the bench's up), and keeps the
// world's gravity off. `tint` is the stratum's colour (the stone that flew), `feeling` the creature's, `power` how many cells went.
//   slab.brush        the Soul Brush: dust swept off the face in a slow fan, a few grains, nothing sharp (it never cracks)
//   slab.pick         the Dreamvane's pick: a chunk knocked out, chips thrown hard off the face, a puff, the pick's gold glint
//   slab.crack        added when the blow reached the fossil: a crack star in the film over it, dark shards of Lachrymite
//   slab.blast        the psygun: a wide burst of the crust, a ring blown flat across the face, chips and dust everywhere
//   slab.slice        the Sondelass: a layer shaved off flat, a bright line drawn along the cut (`from`, `to`), flakes peeling off it
//   slab.hoover       the Lockheart: the rubble round the cell drawn in and gone, a swirl, a breath of dust following it
//   slab.toll         the Crucibelle: three rings of the bell's gold run out through the stone, flat in the slab's plane, a beat apart
//   slab.silhouette   the Veritome: the plate pressed to the slab's face, a flash of the film the size of the slab, its corners glinting
//   slab.lift         the carving's end: the fossil lifting off its bed, the film's motes rising off it
//   slab.crumble      the stone left falling away from it in its strata's colours, dust hanging
//   slab.wake         the spirit waking out of the fossil: a burst of its feeling, the film's sparks, a ring, a light
//   slab.wake.rare    a flawless dig's: the same, and a ring of white and gold stars round it (the shiny's, vfx/duelview/spoils.js)
//   slab.rare         a rare spirit's glint in the garden, now and then: two white and gold stars
//
// Prior art: Fossil Fighters' cleaning (the hammer's chunk, the drill's fine dust, the cracked bone's flash), Pokemon Diamond's
// Underground (the wall's crack spreading), Spectrobes: Origins' blower; a palaeontologist's air scribe throwing grit off a matrix.
// ---------------------------------------------------------------------------------------
const L = (o) => o;
const FILM = ['film', 'film1', 'film2', 'film3'];
const DARK = [0x1a1424, 0x2c2349, 0x3f3170];

export const SLAB_EFFECTS = {
  // the Soul Brush: dust swept off the face in a slow fan, a few grains, nothing sharp
  'slab.brush': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'puff', spawn: 'sphere', r: 0.02, dir: 'cone', axis: 'normal', cone: 75, speed: [0.05, 0.16], drag: 1.6, gravity: 0, size: [0.03, 0.05], sizeEnd: 0.12, life: [0.9, 1.5], color: 'tint', alpha: 0.5, spin: [-1, 1] }),
    L({ type: 'sprites', pool: 'alpha', count: [4, 6], shape: 'chip', spawn: 'sphere', r: 0.015, dir: 'cone', axis: 'normal', cone: 70, speed: [0.12, 0.3], drag: 2.4, gravity: 0, size: [0.004, 0.008], life: [0.5, 0.8], color: 'tint', alpha: 1, alphaEnd: 0.4, spin: [-8, 8] }),
    L({ type: 'sprites', count: 2, shape: 'glint', spawn: 'sphere', r: 0.02, size: [0.012, 0.02], sizeEnd: 0, life: [0.25, 0.4], color: 'gold', twinkle: 18 }),
  ] },
  // the Dreamvane's pick: a chunk knocked out, chips thrown hard off the face, a puff, the pick's gold glint
  'slab.pick': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 0.05, sizeEnd: 0.012, life: 0.1, color: 'white', alpha: 0.9 }),
    L({ type: 'sprites', pool: 'alpha', count: [8, 12], shape: 'chip', spawn: 'sphere', r: 0.012, dir: 'cone', axis: 'normal', cone: 50, speed: [0.5, 1.3], drag: 3.2, gravity: 0, size: [0.006, 0.014], life: [0.45, 0.8], color: 'tint', alpha: 1, alphaEnd: 0.6, spin: [-16, 16] }),
    L({ type: 'sprites', pool: 'alpha', count: [2, 3], shape: 'shard', spawn: 'sphere', r: 0.01, dir: 'cone', axis: 'normal', cone: 35, speed: [0.25, 0.55], drag: 2.4, gravity: 0, size: [0.016, 0.024], life: [0.6, 0.9], color: 'tint', alpha: 1, alphaEnd: 0.5, spin: [-10, 10] }),
    L({ type: 'sprites', pool: 'alpha', count: [3, 4], shape: 'puff', spawn: 'sphere', r: 0.015, dir: 'cone', axis: 'normal', cone: 60, speed: [0.08, 0.2], drag: 2, gravity: 0, size: [0.03, 0.045], sizeEnd: 0.1, life: [0.7, 1.1], color: 'tint', alpha: 0.45 }),
    L({ type: 'sprites', count: [2, 3], shape: 'glint', spawn: 'sphere', r: 0.015, dir: 'cone', axis: 'normal', cone: 60, speed: [0.2, 0.4], drag: 4, gravity: 0, size: [0.016, 0.026], sizeEnd: 0, life: [0.2, 0.35], color: 'gold', twinkle: 24 }),
  ] },
  // added when the blow reached the fossil: a crack star in the film over it, dark shards of Lachrymite
  'slab.crack': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 0.09, sizeEnd: 0.03, life: 0.22, color: 'film', rot: [0, 0.8] }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.02, sizeEnd: 0.12, life: 0.3, color: 'film2', alpha: 0.9 }),
    L({ type: 'sprites', pool: 'alpha', count: [4, 6], shape: 'shard', spawn: 'sphere', r: 0.01, dir: 'cone', axis: 'normal', cone: 55, speed: [0.3, 0.7], drag: 3, gravity: 0, size: [0.01, 0.018], life: [0.5, 0.8], color: DARK, alpha: 1, alphaEnd: 0.5, spin: [-12, 12] }),
    L({ type: 'sprites', count: [5, 7], shape: 'sparkle', spawn: 'sphere', r: 0.02, dir: 'cone', axis: 'normal', cone: 80, speed: [0.15, 0.45], drag: 3, gravity: 0, size: [0.01, 0.018], sizeEnd: 0, life: [0.3, 0.55], color: FILM, twinkle: 20 }),
  ] },
  // the psygun: a wide burst of the crust, a ring blown flat across the face, chips and dust everywhere
  'slab.blast': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 0.14, sizeEnd: 0.03, life: 0.14, color: 'gold' }),
    L({ type: 'shape', form: 'hoop', ramp: 'gold', main: 'noise', mainK: 0.3, tile: [6, 1], scroll: [0.4, 0], face: 'dir', dur: 0.4, scale: [[0, 0.02], [1, 0.16]], edgeV: [0.5, 0.5], erode: [[0, 0], [0.5, 0.1], [1, 1]], glow: 2, core: 0.8, coreAt: 0.85, turn: 'random' }),
    L({ type: 'sprites', pool: 'alpha', count: [16, 22], shape: 'chip', spawn: 'sphere', r: 0.03, dir: 'cone', axis: 'normal', cone: 70, speed: [0.5, 1.4], drag: 3, gravity: 0, size: [0.006, 0.014], life: [0.5, 0.9], color: 'tint', alpha: 1, alphaEnd: 0.5, spin: [-16, 16] }),
    L({ type: 'sprites', pool: 'alpha', count: [7, 9], shape: 'puff', spawn: 'sphere', r: 0.04, dir: 'cone', axis: 'normal', cone: 85, speed: [0.1, 0.3], drag: 1.8, gravity: 0, size: [0.05, 0.07], sizeEnd: 0.18, life: [0.9, 1.5], color: 'tint', alpha: 0.5, spin: [-1, 1] }),
    L({ type: 'sprites', count: [5, 7], shape: 'streak', spawn: 'sphere', r: 0.02, dir: 'cone', axis: 'normal', cone: 60, speed: [0.6, 1.2], drag: 4, gravity: 0, size: [0.02, 0.03], stretch: 2.5, sizeEnd: 0.004, life: [0.15, 0.25], color: 'gold' }),
  ] },
  // the Sondelass: a layer shaved off flat, a bright line drawn along the cut (from, to), flakes peeling off it
  'slab.slice': { layers: [
    L({ type: 'sprites', count: [14, 18], shape: 'streak', spawn: 'line', r: 0.004, dir: 'line', speed: [0.05, 0.2], drag: 3, gravity: 0, size: [0.02, 0.03], stretch: 3, sizeEnd: 0.004, life: [0.18, 0.32], color: ['white', 'gold'] }),
    L({ type: 'sprites', pool: 'alpha', count: [12, 16], shape: 'chip', spawn: 'line', r: 0.01, dir: 'cone', axis: 'normal', cone: 40, speed: [0.2, 0.6], drag: 2.6, gravity: 0, size: [0.008, 0.014], life: [0.6, 1], color: 'tint', alpha: 1, alphaEnd: 0.5, spin: [-12, 12] }),
    L({ type: 'sprites', pool: 'alpha', count: [6, 8], shape: 'puff', spawn: 'line', r: 0.01, dir: 'cone', axis: 'normal', cone: 70, speed: [0.05, 0.15], drag: 1.8, gravity: 0, size: [0.03, 0.05], sizeEnd: 0.12, life: [0.9, 1.4], color: 'tint', alpha: 0.45 }),
    L({ type: 'sprites', count: [4, 6], shape: 'glint', spawn: 'line', r: 0.004, size: [0.014, 0.022], sizeEnd: 0, life: [0.25, 0.4], color: 'white', twinkle: 24 }),
  ] },
  // the Lockheart: the rubble round the cell drawn in and gone, a swirl, a breath of dust following it
  'slab.hoover': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [12, 16], shape: 'chip', spawn: 'shell', r: 0.07, dir: 'in', speed: [0.18, 0.3], drag: 0.6, gravity: 0, size: [0.005, 0.01], sizeEnd: 0.001, life: [0.25, 0.4], color: 'tint', alpha: 1, alphaEnd: 0.3, spin: [-14, 14] }),
    L({ type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'puff', spawn: 'shell', r: 0.06, dir: 'in', speed: [0.1, 0.2], drag: 0.8, gravity: 0, size: [0.03, 0.045], sizeEnd: 0.01, life: [0.35, 0.55], color: 'tint', alpha: 0.4 }),
    L({ type: 'sprites', count: 1, shape: 'swirl', size: 0.1, sizeEnd: 0.02, life: 0.4, color: 'lach', alpha: 0.7, rot: [0, 6], spin: -9 }),
  ] },
  // the Crucibelle: three rings of the bell's gold run out through the stone, flat in the slab's plane, a beat apart
  'slab.toll': { layers: [0, 0.45, 0.9].map((at, k) => L({ type: 'shape', form: 'hoop', ramp: 'gold', main: 'noise', mainK: 0.2, tile: [8, 1], scroll: [0.3, 0], face: 'dir', at, dur: 0.6, scale: [[0, 0.03], [1, 0.26]],
    edgeV: [0.5, 0.5], erode: [[0, 0], [0.6, 0.08], [1, 1]], soft: 0.08, glow: 2.4 - k * 0.4, core: 0.9, coreAt: 0.85, kmul: 1 - k * 0.2, turn: 'random' }))
    .concat([0, 0.45, 0.9].map((at) => L({ type: 'sprites', count: 1, shape: 'ringthin', at, size: 0.04, sizeEnd: 0.5, life: 0.5, color: 'gold', alpha: 0.6 }))) },
  // the Veritome: the plate pressed to the slab's face, a flash of the film the size of the slab, its corners glinting
  'slab.silhouette': { layers: [
    L({ type: 'shape', form: 'disc', ramp: 'film', main: 'none', face: 'dir', dur: 0.5, scale: [[0, 0.22], [0.3, 0.3], [1, 0.32]], erode: [[0, 0], [0.4, 0.1], [1, 1]], glow: 1.6, core: 0.4, coreAt: 0.2, kmul: 0.6 }),
    L({ type: 'sprites', count: 6, shape: 'glint', spawn: 'ring', r: 0.26, size: [0.02, 0.035], sizeEnd: 0, life: [0.3, 0.5], color: FILM, twinkle: 16 }),
    L({ type: 'sprites', count: 1, shape: 'core', size: 0.4, sizeEnd: 0.1, life: 0.18, color: 'film1', alpha: 0.6 }),
  ] },
  // the carving's end: the fossil lifting off its bed, the film's motes rising off it
  'slab.lift': { layers: [
    L({ type: 'sprites', rate: 26, dur: 0.9, shape: 'sparkle', spawn: 'sphere', r: 0.14, dir: 'cone', axis: 'dir', cone: 25, speed: [0.06, 0.18], drag: 0.5, gravity: 0, size: [0.008, 0.016], sizeEnd: 0, life: [0.6, 1.1], color: FILM, twinkle: 10, powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: [8, 10], shape: 'puff', spawn: 'sphere', r: 0.14, dir: 'cone', axis: 'dir', cone: 80, speed: [0.03, 0.08], drag: 1.2, gravity: 0, size: [0.04, 0.06], sizeEnd: 0.14, life: [1, 1.6], color: 'tint', alpha: 0.35 }),
  ] },
  // the stone left falling away from it in its strata's colours, dust hanging
  'slab.crumble': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [26, 32], shape: 'chip', spawn: 'sphere', r: 0.16, dir: 'out', lift: 0.2, speed: [0.15, 0.45], drag: 1.6, gravity: 0, size: [0.008, 0.02], life: [0.7, 1.2], color: [0xb0653f, 0xdcbf86, 0x8e5034, 0xc47c52], alpha: 1, alphaEnd: 0.4, spin: [-10, 10] }),
    L({ type: 'sprites', pool: 'alpha', count: [10, 12], shape: 'puff', spawn: 'sphere', r: 0.18, dir: 'out', lift: 0.3, speed: [0.05, 0.15], drag: 1.2, gravity: 0, size: [0.06, 0.09], sizeEnd: 0.24, life: [1.2, 1.9], color: [0xcaa872, 0xb0653f, 0xe0cfa8], alpha: 0.42, spin: [-0.8, 0.8] }),
  ] },
  // the spirit waking out of the fossil: a burst of its feeling, the film's sparks, a ring, a light
  'slab.wake': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 0.5, sizeEnd: 0.1, life: 0.3, color: 'feeling' }),
    L({ type: 'shape', form: 'sphere', ramp: 'feeling', main: 'noise', mainK: 0.4, dur: 0.6, scale: [[0, 0.04], [1, 0.32]], erode: [[0, 0], [0.4, 0.1], [1, 1]], glow: 1.8, rim: 1.8 }),
    L({ type: 'shape', form: 'hoop', ramp: 'film', main: 'noise', mainK: 0.25, tile: [8, 1], face: 'dir', dur: 0.6, scale: [[0, 0.05], [1, 0.36]], edgeV: [0.5, 0.5], erode: [[0, 0], [0.6, 0.08], [1, 1]], glow: 2.2, core: 0.9, coreAt: 0.85, turn: 'random' }),
    L({ type: 'sprites', count: [22, 28], shape: 'sparkle', spawn: 'sphere', r: 0.06, dir: 'sphere', speed: [0.3, 0.9], drag: 2, gravity: 0, size: [0.015, 0.03], sizeEnd: 0, life: [0.6, 1.1], color: ['feeling', 'film', 'film2', 'gold'], twinkle: 14 }),
    L({ type: 'sprites', count: [8, 10], shape: 'soft', spawn: 'sphere', r: 0.1, dir: 'cone', axis: 'dir', cone: 50, speed: [0.1, 0.35], drag: 1, gravity: 0, size: [0.04, 0.07], sizeEnd: 0, life: [0.9, 1.4], color: 'feeling', alpha: 0.8 }),
    L({ type: 'light', color: 'feeling', k: 6, range: 3, dur: 0.8 }),
  ] },
  // a flawless dig's: the same, and a ring of white and gold stars round it (the shiny's)
  'slab.wake.rare': { extends: 'slab.wake', layers: [
    L({ type: 'sprites', count: 10, shape: 'star4', spawn: 'ring', r: 0.18, at: 0.1, size: [0.035, 0.05], sizeEnd: 0, life: [0.9, 1.3], color: ['white', 'gold'], twinkle: 6, spin: [-3, 3] }),
    L({ type: 'sprites', count: 14, shape: 'glint', spawn: 'sphere', r: 0.22, at: 0.2, size: [0.02, 0.035], sizeEnd: 0, life: [0.5, 0.9], color: ['white', 'gold'], twinkle: 20 }),
  ] },
  // a rare spirit's glint in the garden, now and then: two white and gold stars
  'slab.rare': { layers: [
    L({ type: 'sprites', count: 2, shape: 'star4', spawn: 'sphere', r: 0.35, size: [0.09, 0.14], sizeEnd: 0, life: [0.5, 0.8], color: ['white', 'gold'], twinkle: 6, spin: [-2, 2] }),
    L({ type: 'sprites', count: 3, shape: 'glint', spawn: 'sphere', r: 0.4, size: [0.05, 0.08], sizeEnd: 0, life: [0.3, 0.5], color: ['white', 'gold'], twinkle: 18 }),
  ] },
};
