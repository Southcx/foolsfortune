// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS WITH THE SONDELASS AS THE MAIN: the hook's claws and the cutlass's arc are the hero (the main's Swords: steel) and the
// sub's lent verb rides them in the sub's colour (kit.js). Played by vfx/pairspeciallooks.js on Petra's events (tools/pairspecials.js),
// authored at the feet of what it is on, heights in metres up, a line from the caller's `from` to its `to`:
//   VI    Rung Line (+ the Crucibelle, Wands)   .use the toll's ring running down the hook's line (played on the line: the looks move it
//         from the hand to the bite, its dir along the line, heights 0)   .hit the toll's blow at the line's end, stunning
//   VIII  Gentle Edge (+ the Soul Brush, Cups)   .use the blade's arc lined with the brush's ink   .hit a blow that calms: a pool of
//         still water, petals, no star
//   XI    Appraised Cut (+ the Veritome: Swords too, so the Flash's white; the weak point's gold)   .use a white glint running the edge
//         .hit the weak point's gold brackets snapped shut, the cut across it
//   XIII  Reaper's Draw (+ the Lockheart, Cups)   .use its Lachryma drunk into the coffin (played at the coffin's mouth, heights 0, its
//         line from the downed one)   .hit the blade's last stroke and its Lachryma torn out of it in a spiral
//
// Prior art: the kit's; the Crucibelle's own toll; Hookshot and Scorpion's spear (the line as a road for what follows), Sekiro's
// deathblow (the blow that takes something out of what it downs), Okami's Brush (Gentle Edge's stroke that soothes), Monster Hunter's
// weak-point hit (a gold mark where the right blow lands).
//
//   SONDELASS_MAIN_EFFECTS   pair.6.use .hit   pair.8.use .hit   pair.11.use .hit   pair.13.use .hit
// ---------------------------------------------------------------------------------------
import {
  K, RIM, RING_OUT, fx, pairSides, own, sprites, weight, core, lamp, pool, specks, spiralIn, haze, motesIn, flakes, inkMotes,
  bite, steelLine, bladeArc, tollRing, tollGround, tollSmoke, flashBurst, shutter, inkStroke, coffinGulp,
} from './kit.js';

const P6 = pairSides(6), P8 = pairSides(8), P11 = pairSides(11), P13 = pairSides(13);

export const SONDELASS_MAIN_EFFECTS = {
  // ---- VI Rung Line: hook a creature and the toll runs down the line, stunning it -----------------------------------------------
  // (on the line, moved from the hand to the bite; its dir along the line) the toll's ring running down it
  'pair.6.use': fx(
    // PRIMARY: the toll's ring round the line (stood across it: its axis the line's), the bell's colour; a steel hoop inside it; its heart
    own(P6.B.r, K, { ...RIM, face: 'dir', main: 'noise', tile: [8, 1], scroll: [0.6, 0], scale: [[0, 0.6], [0.15, 0.38], [0.75, 0.36], [1, 0.9]], dur: 0.36,
      core: 0.6, coreAt: 0.4, spin: 6, erode: [[0, 0.24], [0.1, 0.04], [0.75, 0.08], [1, 1]] }),
    own(P6.A.r, K, { ...RIM, face: 'dir', main: 'noise', tile: [6, 1], scroll: [-0.5, 0], scale: [[0, 0.32], [1, 0.24]], dur: 0.3, spin: -4, kmul: 0.7, erode: RING_OUT }),
    core(K, { s: 0.6, y: 0, dur: 0.3 }),
    // SECONDARY: the bell's sparks shed in its wake as it runs (they stay where they fell along the line)
    sprites(K, { rate: 90, dur: 0.26, shape: 'sparkle', spawn: 'sphere', r: 0.08, dir: 'sphere', speed: [0.2, 0.6], size: [0.06, 0.1], sizeEnd: 0, life: [0.25, 0.45], drag: 2,
      color: 'white', colorEnd: P6.B.c }),
    // TERTIARY: the line lit with steel the whole way
    steelLine(K, P6.A.c, { count: [10, 14] }),
  ),
  // (on the creature at the line's end) the toll's blow, stunning it
  'pair.6.hit': fx(
    // PRIMARY: the toll's ring burst at its chest (the bell's), the hook's claws biting deeper (the steel), its heart
    tollRing(P6.B.r, K, { r: 1.6, y: 1 }), bite(P6.A.r, K, { r: 0.55, y: 1, dur: 0.3 }), core(K, { s: 1.1, y: 1 }),
    // SECONDARY: the stun's hoop run out on the ground; sparks thrown round it
    tollGround(P6.B.r, K, { r: 2.2 }),
    sprites(K, { count: [10, 14], shape: 'sparkle', spawn: 'sphere', r: 0.3, offset: [0, 1, 0], dir: 'sphere', speed: [2, 4], size: [0.06, 0.1], sizeEnd: 0, life: [0.3, 0.5], drag: 2.5,
      color: 'white', colorEnd: P6.B.c }),
    // TERTIARY: smoke rings rising off it, steel specks hanging
    tollSmoke(K, P6.B.c, { y: 1.2 }), specks(K, { r: 0.6, height: 1.4, count: [6, 8], color: P6.A.c }),
    lamp(K, { color: P6.B.c, k: 20 }), weight(K, { shake: 0.15, stop: 0.06, color: P6.B.c }),
  ),

  // ---- VIII Gentle Edge: a cutlass string whose blows calm instead of hurt --------------------------------------------------------
  // (at the Courier, once a string) the blade's arc lined with the brush's ink
  'pair.8.use': fx(
    // PRIMARY: the cutlass's arc (steel), the brush's stroke of sumi under it, its heart
    bladeArc(P8.A.r, K, { r: 1.5 }), inkStroke(K, { r: 1.45, y: 0.95 }), core(K, { s: 0.7, y: 1 }),
    // SECONDARY: a softer arc in the brush's blue trailing it; petals shed along it
    bladeArc(P8.B.r, K, { r: 1.2, y: 0.85, at: 0.04, kmul: 0.6 }), flakes(K, { r: 1.2, count: [10, 14], color: P8.B.c, colorEnd: 'white' }),
    // TERTIARY: ink motes drifting down
    inkMotes(K, { color: P8.B.c }),
    lamp(K, { color: P8.B.c, k: 12 }),
  ),
  // (on the creature a blow calms) still water and petals: no star, no sparks
  'pair.8.hit': fx(
    // PRIMARY: a pool of the brush's blue stilling at its feet, a soft bloom at its chest, its heart soft
    pool(P8.B.r, K, { r: 1.6 }),
    own(P8.B.r, K, { form: 'sphere', main: 'noise', tile: [3, 2], scroll: [0, 0.3], scale: [[0, 0.3], [0.3, 0.75], [1, 0.9]], offset: [0, 1, 0], rim: -0.6, dur: 0.6, kmul: 0.45,
      erode: [[0, 0.3], [0.25, 0.08], [1, 1]] }),
    core(K, { s: 0.6, y: 1 }),
    // SECONDARY: the cut turned to a stroke of sumi, petals drifting down, a ripple run out on the ground
    inkStroke(K, { r: 0.8, y: 1, dur: 0.5 }), flakes(K, { r: 0.7, count: [8, 10], color: 'white', colorEnd: P8.B.c }),
    own(P8.B.r, K, { form: 'hoop', main: 'noise', tile: [8, 1], scroll: [0.2, 0], scale: [[0, 0.3], [1, 2]], offset: [0, 0.04, 0], dur: 0.8, erode: RING_OUT, turn: 'random' }),
    // TERTIARY: a haze of calm breathing low
    haze(P8.B.r, K, { r: 1.4 }),
    lamp(K, { color: P8.B.c, k: 10 }),
  ),

  // ---- XI Appraised Cut: a blow on a weak point you have photographed is always the right kind ------------------------------------
  // (at the Courier) the blade reading what it was shown: a white glint running its edge
  'pair.11.use': fx(
    // PRIMARY: the cutlass's arc, the Flash's white glint running its edge, its heart
    bladeArc(P11.A.r, K, { r: 1.5 }),
    own(P11.B.r, K, { form: 'wave', main: 'streaks', tile: [1, 1], scroll: [3, 0], scale: 1.52, stretch: [1, 0.05, 1], offset: [0, 1.06, 0], dur: 0.25, spin: 7, rot: -1, edgeV: [0.3, 0.3],
      edgeU: [0.3, 0.3], erode: [[0, 0.3], [0.2, 0.05], [1, 1]] }),
    core(K, { s: 0.6, y: 1 }),
    // SECONDARY: the lens's iris winking at the eyes
    shutter(P11.B.r, K, { r: 0.25, y: 1.6, dur: 0.3 }),
    // TERTIARY: the weak point's gold in specks
    specks(K, { r: 1, height: 1.2, offset: [0, 0.4, 0], count: [6, 8], color: 'gold' }),
  ),
  // (on the creature, at its weak point) the gold brackets snapped shut, the cut across it
  'pair.11.hit': fx(
    // PRIMARY: the weak point's gold brackets closing on it (a hoop of four marks), the cut across it, its heart
    own('gold', K, { ...RIM, face: 'camera', main: 'rays', tile: [4, 1], scroll: [0.2, 0], scale: [[0, 1.2], [0.3, 0.35], [1, 0.3]], offset: [0, 1, 0], dur: 0.35, core: 0.7,
      erode: [[0, 0.3], [0.3, 0.05], [0.7, 0.1], [1, 1]] }),
    bladeArc(P11.A.r, K, { r: 0.9, y: 1, dur: 0.25 }), core(K, { s: 1.2, y: 1 }),
    // SECONDARY: the plate's flash on it, gold and white shards thrown
    flashBurst(P11.B.r, K, { r: 0.7, y: 1, dur: 0.25 }),
    sprites(K, { count: [10, 14], shape: 'shard', spawn: 'sphere', r: 0.2, offset: [0, 1, 0], dir: 'sphere', speed: [3, 6], size: [0.08, 0.14], life: [0.3, 0.5], drag: 3,
      color: 'white', colorEnd: 'gold', spin: [-6, 6] }),
    // TERTIARY: gold specks hanging
    specks(K, { r: 0.5, height: 1, offset: [0, 0.5, 0], count: [8, 10], color: 'gold' }),
    lamp(K, { color: 'gold', k: 22 }), weight(K, { flash: 0.05, shake: 0.15, stop: 0.06, color: 'gold' }),
  ),

  // ---- XIII Reaper's Draw: a blow that downs a creature drinks its Lachryma straight into the coffin --------------------------------
  // (at the coffin's mouth, its line from the downed one) its Lachryma drunk in
  'pair.13.use': fx(
    // PRIMARY: the coffin's gulp (its ink shell and the cups' rim closing on the mouth), its heart as it drinks
    coffinGulp(P13.B.r, K, { r: 0.55, y: 0, dur: 0.5, at: 0.18 }), core(K, { s: 0.8, y: 0, at: 0.3 }),
    // SECONDARY: the downed one's Lachryma drawn along the line into the mouth, the film's colours to the coffin's
    sprites(K, { count: [20, 26], shape: 'soft', spawn: 'line', r: 0.15, dir: 'in', speed: [5, 8], size: [0.06, 0.12], sizeEnd: 0.02, life: [0.3, 0.5], color: 'film', colorEnd: P13.B.c }),
    // TERTIARY: motes of it drawn in round the mouth
    motesIn(K, { r: 1, offset: [0, 0, 0], color: P13.B.c, at: 0.25 }),
    lamp(K, { color: P13.B.c, k: 16, up: 0, at: 0.25 }),
  ),
  // (on the downed creature) the blade's last stroke and its Lachryma torn out of it
  'pair.13.hit': fx(
    // PRIMARY: the cutlass's arc through it, its heart; its Lachryma pulled up out of it in a spiral (the film's colours)
    bladeArc(P13.A.r, K, { r: 1.1, y: 0.9 }), core(K, { s: 1.1, y: 1 }), spiralIn('film', K, { r: 0.9, h: 1.8, kmul: 0.75 }),
    // SECONDARY: shards of it thrown, the coffin's links glinting round it
    sprites(K, { count: [10, 14], shape: 'shard', spawn: 'sphere', r: 0.3, offset: [0, 1, 0], dir: 'sphere', speed: [2, 4], size: [0.08, 0.13], life: [0.4, 0.6], drag: 2.5,
      color: 'white', colorEnd: 'film', spin: [-6, 6] }),
    sprites(K, { count: [6, 8], shape: 'ringthin', spawn: 'ring', r: 0.7, offset: [0, 1, 0], dir: 'swirl', lift: 0.4, speed: [1, 2], size: [0.1, 0.14], life: [0.4, 0.6], drag: 1,
      color: 'white', colorEnd: P13.B.c, spin: [-4, 4] }),
    // TERTIARY: an ink haze settling low (alpha-over): what it downs dims
    own('ink', K, { form: 'disc', add: 0, glow: 1, main: 'marble', tile: [2, 1], scroll: [0.03, 0.08], flow: 'noise', flowK: 0.06, scale: [[0, 1], [1, 2.2]], offset: [0, 0.03, 0], core: 0,
      kmul: 0.55, dur: 1.4, at: 0.1, rampShift: 0, erode: [[0, 0.2], [0.4, 0.25], [1, 1]], turn: 'random' }),
    lamp(K, { color: P13.B.c, k: 18 }), weight(K, { shake: 0.15, stop: 0.07, color: P13.A.c }),
  ),
};
