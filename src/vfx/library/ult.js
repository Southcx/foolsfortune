// ---------------------------------------------------------------------------------------
// THE LOCKHEART'S OPENING: the ultimate's effects (tools/lockheart/ultimate.js and the cinematic, cine/sequences.js, play them; a
// cinematic owns the screen, so the budgets do not count them: `ctx.cine`). The owner's gold standard for a cinematic event: too much, on
// purpose. Everything the old stock had is kept (the circles the owner's wife drew, the baked meshes, the sprites, the screen's weight);
// the refresh (docs/plans/art/VFX-LIBRARY.md 1 and 5) lays the shape layer's scrolling, eroding forms in with them, two at most an effect:
//   the invocation's written ring and a wall of rays on the circle's rim; the key's star of rays and its bloom; the ascent's column
//   launched and a ring of rays at its foot; the pillar's scrolling core of rays and a gold ribbon winding up it; the crown's flame
//   spikes and its halo of stars; the landing's shock along the ground and a dome of rays blooming over the Courier
// Gold is the coffin's and the Opening's, the film Lachryma's, the labradorite the Mind's (docs/VFX.md).
//
// Prior art: Final Fantasy X's and Kingdom Hearts' summons (a circle written on the ground, a column to the sky, a landing that takes the
// screen), Riot's layering of an ultimate (docs/ref/VFX-PRIOR-ART.md 2: "visually loud FX for powerful skills, like ultimate abilities").
//
//   ULT_EFFECTS   'ult.invoke' (held)  'ult.key'  'ult.ascend'  'ult.pillar' (held)  'ult.crown' (held)  'ult.land'
// ---------------------------------------------------------------------------------------
const L = (o) => o; // (a layer: only for readability)

export const ULT_EFFECTS = {
  // (tools/lockheart/ultimate.js plays these; the owner's gold standard for a cinematic event: too much, on purpose)
  // the invocation, held while it lasts: the whirl on the ground, the invocation written round it, motes drawn in from all round, glints rising off the circle
  'ult.invoke': { layers: [
    // the circles the owner's wife drew (source_assets/circles/): the lotus mandala under the Courier, the whirling one inside it
    L({ type: 'decal', tex: 'circle_lotus', dur: Infinity, scale: 7, tint: 'gold', labradorite: 0.15, glow: 0.7, spin: 0.22, offset: [0, 0.05, 0], in: 2.2, out: 2 }),
    L({ type: 'decal', tex: 'circle_swirl', dur: Infinity, scale: 4.2, tint: 'lach', labradorite: 0.85, glow: 0.8, spin: -0.7, offset: [0, 0.07, 0], in: 1.6, out: 2 }),
    L({ type: 'decal', tex: 'circle_lotus', dur: Infinity, scale: 2, tint: 'white', labradorite: 0.4, glow: 0.6, spin: 1.4, offset: [0, 0.09, 0], in: 1.2, out: 2 }),
    L({ type: 'mesh', mesh: 'ult_vortex', dur: Infinity, scale: 1.25, tint: 'lach', labradorite: 0.6, opacity: 1.3, spin: -0.9, offset: [0, 0.06, 0], in: 2, out: 3 }),
    // PRIMARY (the refresh's): the invocation written round the circle, a ring of the running hand turning the lotus's way, gold
    L({ type: 'shape', form: 'ring', ramp: 'gold', main: 'script', tile: [10, 0.3], scroll: [0.04, 0], mask: 'noise', maskK: 0.3, maskTile: [4, 1], maskScroll: [-0.05, 0],
      dur: Infinity, scale: 3.4, offset: [0, 0.1, 0], edgeV: [0.3, 0.3], erode: 0.05, glow: 1.8, core: 0.3, in: 2, out: 2 }),
    // SECONDARY: a low wall of rays standing on the circle's rim, rising, in the film
    L({ type: 'shape', form: 'band', ramp: 'film', main: 'rays', tile: [6, 1], scroll: [0.03, 0.6], mask: 'noise', maskK: 0.45, maskTile: [3, 1], maskScroll: [0, 0.4],
      dur: Infinity, scale: 3.6, stretch: [1, 0.35, 1], offset: [0, 0.05, 0], edgeV: [0.05, 0.7], rim: -0.3, erode: 0.12, glow: 1.6, in: 2, out: 2 }),
    L({ type: 'sprites', rate: 70, dur: Infinity, shape: 'soft', spawn: 'ring', r: [3.5, 6.5], dir: 'in', speed: [3, 5], size: [0.08, 0.14], sizeEnd: 0.02, life: [0.8, 1.2], color: ['labradorite', 'gold', 'lach'], offset: [0, 0.3, 0] }),
    L({ type: 'sprites', rate: 40, dur: Infinity, shape: 'sparkle', spawn: 'ring', r: [2.6, 3.2], dir: 'up', speed: [1, 2.5], size: [0.16, 0.28], sizeEnd: 0, life: [0.8, 1.4], color: 'gold', twinkle: 16 }),
    L({ type: 'sprites', rate: 12, dur: Infinity, shape: 'diamond', spawn: 'ring', r: [1.2, 2.2], dir: 'swirl', lift: 1.2, speed: [1.5, 2.5], size: [0.18, 0.3], sizeEnd: 0.05, life: [1, 1.6], color: 'labradorite', spin: [-3, 3] }),
  ] },
  // a key plunged into the coffin: its colour (tint), loud
  'ult.key': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 1.4, sizeEnd: 0.2, life: 0.22, color: 'white' }),
    // PRIMARY (the refresh's): the key's star, a ring of rays in its colour stood to the eye, white for its first tenth (the old ring sprite's place)
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'tint', main: 'rays', tile: [1, 1], scroll: [0.3, 1.5], mask: 'noise', maskK: 0.45, maskTile: [3, 1], maskScroll: [0, 0.8],
      dur: 0.4, scale: [[0, 0.3], [0.3, 1.4], [1, 1.7]], edgeV: [0.25, 0.45], erode: [[0, 0.2], [0.35, 0.22], [1, 1]], rampShift: [[0, 0.3], [0.3, 0.05], [1, -0.3]], core: 0.9, coreAt: 0.6, glow: 2.6, turn: 'random' }),
    // SECONDARY: a bloom of its colour round the coffin's mouth, a shell lit at its edge breaking up through its cells
    L({ type: 'shape', form: 'sphere', ramp: 'tint', main: 'cells', tile: [3, 2], scroll: [0.1, 0.8], mask: 'noise', maskK: 0.5, maskTile: [2, 1],
      at: 0.03, dur: 0.5, scale: [[0, 0.2], [0.3, 0.9], [1, 1.2]], rim: 0.6, erode: [[0, 0.2], [0.3, 0.22], [1, 1]], rampShift: [[0, 0.2], [1, -0.3]], core: 0.5, coreAt: 0.8, glow: 2.2, turn: 'random' }),
    L({ type: 'sprites', count: 2, shape: 'star4', size: [1.0, 1.3], sizeEnd: 0.3, life: 0.35, color: 'tint', colorEnd: 'white', grow: 40, spin: [-2, 2] }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.3, sizeEnd: 4.4, life: 0.55, color: 'white', at: 0.05 }),
    L({ type: 'sprites', count: 26, shape: 'streak', dir: 'sphere', speed: [5, 12], size: [0.18, 0.3], sizeEnd: 0.04, life: [0.25, 0.45], drag: 5, stretch: 1.8, color: 'white', colorEnd: 'tint' }),
    L({ type: 'sprites', count: 14, shape: 'sparkle', dir: 'sphere', speed: [1, 3], size: [0.2, 0.35], sizeEnd: 0, life: [0.5, 0.9], drag: 2, color: 'tint', twinkle: 22 }),
    L({ type: 'sprites', count: 8, shape: 'petal', dir: 'sphere', speed: [1, 2.5], size: [0.14, 0.22], life: [1, 1.6], drag: 1.5, gravity: 1.2, color: 'tint', spin: [-6, 6] }),
    L({ type: 'light', color: 'tint', k: 40, range: 9, dur: 0.45 }),
    L({ type: 'shake', k: 0.16 }),
  ] },
  // the coffin's ascent: the column launched up out of it, rings stacked up the pillar's foot, a burst at the coffin's mouth
  'ult.ascend': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 2.6, sizeEnd: 0.3, life: 0.35, color: 'white' }),
    // PRIMARY (the refresh's): the column launched, a pillar of rays racing up out of the coffin to the sky, gold, eroding as the held pillar takes over
    L({ type: 'shape', form: 'pillar', ramp: 'gold', main: 'rays', tile: [3, 2], scroll: [0, 3], mask: 'noise', maskK: 0.4, maskTile: [2, 2], maskScroll: [0, 1.5],
      dur: 0.8, scale: 6, stretch: [1, [[0, 0.1], [0.25, 6], [1, 7]], 1], edgeV: [0.02, 0.35], rim: -0.5, erode: [[0, 0.2], [0.4, 0.22], [1, 1]], rampShift: [[0, 0.3], [0.4, 0.05], [1, -0.3]], core: 0.7, coreAt: 0.75, glow: 2.4 }),
    // SECONDARY: a ring of rays thrown out flat at its foot, in the film
    L({ type: 'shape', form: 'ring', ramp: 'film', main: 'rays', tile: [2, 1], scroll: [0.1, 1.5], mask: 'noise', maskK: 0.45, maskTile: [4, 1],
      dur: 0.7, scale: [[0, 0.5], [1, 5]], offset: [0, 0.1, 0], edgeV: [0.35, 0.35], erode: [[0, 0.2], [0.4, 0.22], [1, 1]], rampShift: [[0, 0.25], [1, -0.3]], glow: 2.2, turn: 'random' }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.8, scale: [[0, 0.6], [1, 4.5]], stretch: [1, [[0, 1.4], [1, 0.4]], 1], k: [[0, 1.5], [1, 0]], tint: 'gold', labradorite: 0.3 }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.9, at: 0.12, scale: [[0, 0.5], [1, 3.4]], k: [[0, 1.3], [1, 0]], tint: 'lach', labradorite: 0.7, offset: [0, 0.8, 0] }),
    L({ type: 'sprites', count: 50, shape: 'streak', dir: 'cone', axis: 'up', cone: 25, speed: [8, 16], size: [0.2, 0.35], sizeEnd: 0.05, life: [0.4, 0.7], drag: 2, stretch: 2, color: 'white', colorEnd: 'gold' }),
    L({ type: 'flash', color: 0xfff0d8, k: 0.35, dur: 0.35 }),
    L({ type: 'light', color: 'gold', k: 70, range: 14, dur: 0.8, up: 1.5 }),
    L({ type: 'shake', k: 0.35 }),
  ] },
  // the pillar, held from the ascent to the end: a column of Lachryma to the sky, its core of rays scrolling up, the great helix and a gold
  // ribbon round it, streaks and sparkles flowing up it, and motes orbiting
  'ult.pillar': { layers: [
    L({ type: 'mesh', mesh: 'ult_pillar', dur: Infinity, scale: 1, tint: 'lach', labradorite: 0.8, opacity: 1.2, spin: 0.6, offset: [0, 4.5, 0], in: 4, out: 2.5 }),
    L({ type: 'mesh', mesh: 'ult_pillar', dur: Infinity, scale: 0.55, tint: 'gold', labradorite: 0.1, opacity: 1.4, spin: -1.4, offset: [0, 4.5, 0], in: 5, out: 3 }),
    L({ type: 'mesh', mesh: 'ult_helix', dur: Infinity, scale: 1, tint: 'gold', labradorite: 0.45, opacity: 1.4, spin: 1.8, offset: [0, 4, 0], in: 3, out: 2 }),
    // PRIMARY (the refresh's): the column's core, a pillar of rays in the film scrolling up to the sky, soft at its edge
    L({ type: 'shape', form: 'pillar', ramp: 'film', main: 'rays', tile: [3, 4], scroll: [0.05, 0.9], mask: 'noise', maskK: 0.45, maskTile: [2, 3], maskScroll: [0, 0.5],
      dur: Infinity, scale: 7, stretch: [1, 6, 1], offset: [0, -0.2, 0], edgeV: [0.02, 0.3], rim: -0.5, erode: 0.1, glow: 2, core: 0.4, in: 4, out: 2.5 }),
    // SECONDARY: a gold ribbon winding up it, turning, dissolving and forming again every 2.4 real s
    L({ type: 'shape', form: 'spiral', ramp: 'gold', main: 'noise', tile: [6, 1], scroll: [0.8, 0], dur: Infinity, loop: 2.4, scale: 1.8, stretch: [1, 5, 1], spin: 1.6,
      erode: [[0, 0.5], [0.3, 0.12], [0.7, 0.12], [1, 0.5]], glow: 1.8, core: 0.3, in: 3, out: 2 }),
    L({ type: 'sprites', rate: 90, dur: Infinity, shape: 'streak', spawn: 'disc', r: 0.9, dir: 'up', speed: [6, 12], size: [0.15, 0.28], sizeEnd: 0.04, life: [0.6, 1.0], stretch: 2.4, color: ['white', 'gold', 'labradorite'] }),
    L({ type: 'sprites', rate: 50, dur: Infinity, shape: 'sparkle', spawn: 'column', r: [1.2, 2.2], height: 7, dir: 'swirl', lift: 0.6, speed: [1, 2], size: [0.2, 0.4], sizeEnd: 0, life: [0.7, 1.2], color: 'labradorite', twinkle: 14 }),
    L({ type: 'sprites', rate: 20, dur: Infinity, shape: 'petal', spawn: 'column', r: [2, 3.5], height: 6, dir: 'swirl', lift: -0.3, speed: [1, 2], size: [0.16, 0.26], life: [1.5, 2.4], drag: 0.6, color: ['labradorite', 'gold'], spin: [-5, 5] }),
  ] },
  // round the coffin while it hangs open in the air: a crown of flame and a halo
  'ult.crown': { layers: [
    L({ type: 'mesh', mesh: 'ult_crown', dur: Infinity, scale: 1.3, tint: 'gold', labradorite: 0.25, opacity: 1.5, spin: 1.2, offset: [0, 0.3, 0], in: 6, out: 3 }),
    L({ type: 'mesh', mesh: 'ult_crown', dur: Infinity, scale: 1.0, tint: 'lach', labradorite: 0.8, opacity: 1.3, spin: -2, offset: [0, 0.2, 0], in: 6, out: 3 }),
    // PRIMARY (the refresh's): the crown's flames, a ring of spikes standing round the coffin, gold, its noise running up them in a flow
    L({ type: 'shape', form: 'spikes', ramp: 'gold', main: 'noise', tile: [2, 1], scroll: [0, 1.4], flow: 'noise', flowK: 0.1, mask: 'streaks', maskK: 0.4, maskTile: [3, 1], maskScroll: [0, 1],
      dur: Infinity, scale: 1.2, stretch: [1, 0.9, 1], offset: [0, 0.25, 0], edgeV: [0, 0.35], spin: 0.8, erode: 0.15, glow: 2, core: 0.4, in: 6, out: 3 }),
    // SECONDARY: the halo, a ring of stars over it in the film, turning the other way
    L({ type: 'shape', form: 'ring', ramp: 'film', main: 'stars', tile: [8, 1], scroll: [0.05, 0], dur: Infinity, scale: 1.6, offset: [0, 1.3, 0], edgeV: [0.35, 0.35], spin: -0.5, glow: 1.8, core: 0.4, in: 6, out: 3 }),
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'ringthin', size: 0.6, sizeEnd: 2.4, life: 0.9, color: 'gold', alpha: 0.4, rot: 0 }),
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'glint', spawn: 'shell', r: 1.2, dir: 'out', speed: [0.5, 1.5], size: [0.3, 0.5], sizeEnd: 0, life: [0.4, 0.7], color: ['gold', 'white'], twinkle: 20 }),
  ] },
  // the wheel lands: everything at once
  'ult.land': { layers: [
    L({ type: 'decal', tex: 'circle_lotus', dur: 1.4, scale: [[0, 3], [1, 18]], k: [[0, 1.6], [0.4, 1], [1, 0]], tint: 'gold', labradorite: 0.3, spin: 0.6, offset: [0, -0.9, 0] }),
    L({ type: 'decal', tex: 'circle_swirl', dur: 1.0, face: 'camera', scale: [[0, 1], [1, 9]], k: [[0, 1.4], [1, 0]], tint: 'lach', labradorite: 0.9, spin: -2 }),
    L({ type: 'flash', color: 0xfff6e0, k: 0.85, dur: 0.6 }),
    L({ type: 'hitstop', dur: 0.14, scale: 0.02 }),
    L({ type: 'shake', k: 0.75 }),
    L({ type: 'smear', amt: 0.75, zoom: 0.01, spin: 0.004, dur: 0.9 }),
    L({ type: 'light', color: 'gold', k: 120, range: 22, dur: 1.2, up: 1.2 }),
    L({ type: 'light', color: 'lach', k: 80, range: 16, dur: 1.6, up: 3 }),
    L({ type: 'sprites', count: 1, shape: 'core', size: 5, sizeEnd: 0.5, life: 0.5, color: 'white', powerCount: false }),
    L({ type: 'sprites', count: 2, shape: 'star4', size: [5, 7], sizeEnd: 0.5, life: 0.6, color: 'gold', colorEnd: 'white', grow: 30, spin: [-1, 1], powerCount: false }),
    // PRIMARY (the refresh's): the wheel's shock along the ground, a ring of streaks racing out to 18 m, gold cooling to amber
    L({ type: 'shape', form: 'ring', ramp: 'gold', main: 'streaks', tile: [16, 1], scroll: [0, 2.5], mask: 'noise', maskK: 0.45, maskTile: [6, 1], maskScroll: [0.05, 0.8],
      dur: 1.1, scale: [[0, 1], [1, 18]], offset: [0, -0.85, 0], edgeV: [0.4, 0.2], erode: [[0, 0.2], [0.4, 0.22], [1, 1]], rampShift: [[0, 0.3], [1, -0.35]], core: 0.5, coreAt: 0.8, glow: 2.4, turn: 'random' }),
    // SECONDARY: a dome of rays blooming over the Courier in the film (beside the baked dome), breaking up as it rises
    L({ type: 'shape', form: 'dome', ramp: 'film', main: 'rays', tile: [5, 1], scroll: [0.05, 0.8], mask: 'noise', maskK: 0.45, maskTile: [3, 2], maskScroll: [0, 0.5],
      dur: 1.2, scale: [[0, 0.5], [0.3, 3.2], [1, 4.4]], offset: [0, -0.9, 0], rim: 0.6, erode: [[0, 0.2], [0.35, 0.26], [1, 1]], rampShift: [[0, 0.25], [1, -0.35]], glow: 1.6, turn: 'random' }),
    L({ type: 'mesh', mesh: 'ult_dome', dur: 1.3, scale: [[0, 0.5], [1, 9]], k: [[0, 1.6], [0.5, 0.9], [1, 0]], tint: 'gold', labradorite: 0.4, opacity: 1.2 }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.9, scale: [[0, 1], [1, 12]], stretch: [1, [[0, 2], [1, 0.3]], 1], k: [[0, 1.8], [1, 0]], tint: 'white', labradorite: 0.2, offset: [0, -0.8, 0] }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 1.1, at: 0.1, scale: [[0, 1], [1, 9]], k: [[0, 1.5], [1, 0]], tint: 'lach', labradorite: 0.9, offset: [0, -0.7, 0] }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 1.3, at: 0.22, scale: [[0, 1], [1, 6]], k: [[0, 1.4], [1, 0]], tint: 'gold', offset: [0, -0.6, 0] }),
    L({ type: 'sprites', count: 140, shape: 'streak', dir: 'sphere', speed: [8, 22], size: [0.25, 0.45], sizeEnd: 0.05, life: [0.4, 0.9], drag: 3, stretch: 2.2, color: 'white', colorEnd: ['gold', 'lach'], powerCount: false }),
    L({ type: 'sprites', count: 60, shape: 'star4', dir: 'sphere', speed: [3, 9], size: [0.3, 0.6], sizeEnd: 0, life: [0.7, 1.3], drag: 2, gravity: 2, color: ['gold', 'white', 'labradorite'], spin: [-4, 4], twinkle: 12, powerCount: false }),
    L({ type: 'sprites', count: 80, shape: 'petal', dir: 'sphere', speed: [3, 8], size: [0.18, 0.3], life: [2, 3.2], drag: 1.6, gravity: 1.4, color: ['labradorite', 'gold', 'lach'], spin: [-6, 6], at: 0.05, powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 24, shape: 'puff', spawn: 'ring', r: 0.8, dir: 'out', lift: 0.15, speed: [4, 8], size: [0.8, 1.2], sizeEnd: 2.4, life: [0.8, 1.3], drag: 3, color: 0xf3e6d8, alpha: 0.6, spin: [-1, 1], offset: [0, -0.8, 0], powerCount: false }),
    L({ type: 'sprites', count: 40, shape: 'sparkle', spawn: 'sphere', r: 5, size: [0.3, 0.5], sizeEnd: 0, life: [0.8, 1.6], color: 'labradorite', twinkle: 10, delay: [0.1, 0.9], powerCount: false }),
  ] },
};
