// ---------------------------------------------------------------------------------------
// THE REACTIONS' BASE: `art.react`, the one look every class art's reaction fires on (docs/plans/art/VFX-LIBRARY.md 4): a quick ring
// rising up the body and the suit's colour lifting off it, about 0.4 real s, in the caller's suit (ctx.suit: the art's own, passed by
// vfx/classartlooks.js). Each reaction's own effect (`art.<id>.fire`, beside its class's action in the suit's file) `extends` it and adds
// its class's action quietened (vfx/library/classarts/kit.js RANK.whisper): change this and all 38 follow.
//
// Prior art: Final Fantasy Tactics' reaction abilities (Square, 1997): a reaction announces itself the same way whatever it does, credited
// as the idea, not a seen look (VFX-PRIOR-ART.md 6); the recipe the sources agree on, one shared base for a kind (VFX-PRIOR-ART.md 4).
//
//   REACTION_BASE   'art.react' (a one-shot, at the body; ctx.suit its colour)
// ---------------------------------------------------------------------------------------
import { RANK, piece, sprites, cools } from './kit.js';

const B = RANK.knight; // (the base reads at a knight's weight: the reaction's own image on it is the whisper)

export const REACTION_BASE = {
  // a reaction firing: a quick ring stood up at the chest, the suit's colour rising up the body, a flat ring snapped out at the feet (0.4 s)
  'art.react': { layers: [
    // PRIMARY: the quick vertical ring: stood facing the view at the chest, snapped open, white for 0.1 s then the suit's
    piece('suit', B, { dur: 0.32 }, {}, (p) => ({
      form: 'ring', face: 'camera', main: 'rays', tile: [16, 1], scroll: [0.4, 0], mask: 'noise', maskK: 0.5, maskTile: [3, 1], maskScroll: [-0.3, 0], scale: [[0, 0.2], [0.4, 0.75], [1, 0.9]],
      offset: [0, 1.15, 0], edgeV: [0.45, 0.12], core: 0.7, glow: 2.4, erode: [[0, 0], [0.45, 0.05], [1, 1]], rampShift: cools(p.dur, 0.36) })),
    // PRIMARY: the suit's colour rising off the body: a band grown up from the feet, its top edge lit, a gradient trailing under it
    piece('suit', B, { dur: 0.42 }, {}, (p) => ({
      form: 'band', main: 'noise', tile: [4, 1], scroll: [0, 1.6], mask: 'streaks', maskK: 0.6, maskTile: [8, 1], maskScroll: [0.1, 2.2], scale: [[0, 0.42], [1, 0.6]],
      stretch: [1, [[0, 0.3], [0.45, 3.4], [1, 3.6]], 1], edgeV: [0.6, 0.08], rim: -0.3, core: 0.5, glow: 2.2, erode: [[0, 0], [0.65, 0.08], [1, 1]], rampShift: cools(p.dur, 0.3) })),
    // PRIMARY (its foot): a flat ring snapped out at the feet as it fires
    piece('suit', B, { dur: 0.3 }, {}, () => ({
      form: 'ring', main: 'rays', tile: [16, 1], scroll: [0, 1.5], scale: [[0, 0.3], [1, 1.05]], offset: [0, 0.04, 0], edgeV: [0.6, 0.1], erode: [[0, 0], [0.4, 0.06], [1, 1]], turn: 'random' })),
    // SECONDARY: the suit's colour lifting off the body in streaks
    sprites(B, { count: [10, 14], shape: 'streak', spawn: 'ring', r: 0.4, offset: [0, 0.3, 0], dir: 'up', speed: [2, 3.6], size: [0.06, 0.1], sizeEnd: 0.02, life: [0.3, 0.45],
      drag: 2, stretch: 1.6, color: 'white', colorEnd: 'suit' }),
    // TERTIARY: a few motes left hanging over the head, faint, the last to go
    sprites(B, { at: 0.12, count: [5, 7], shape: 'sparkle', spawn: 'disc', r: 0.45, offset: [0, 1.9, 0], dir: 'up', speed: [0.2, 0.5], size: [0.05, 0.08], sizeEnd: 0, life: [0.6, 0.9],
      drag: 1.5, color: 'suit', alpha: 0.75, twinkle: 4 }),
  ] },
};
