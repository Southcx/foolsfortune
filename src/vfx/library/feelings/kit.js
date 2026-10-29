// ---------------------------------------------------------------------------------------
// THE FEELINGS' EFFECTS, THEIR SMALL TOOLS: what the seven feelings' effect modules beside this one share (vfx/library/feelings/<feeling>.js,
// gathered by vfx/library/feelings.js): the layer helper of the library's data, the impact's hot core every one of them opens on, and
// nothing else. Data only: nothing here touches three.js (docs/ARCHITECTURE.md, a data module).
//
// THE HOT CORE: about a tenth of a second of white at the heart of an impact (six frames at 60: one frame alone does not read at 480
// lines), a sphere of the feeling's ramp pushed to white by its core, its edge in the feeling's own colour, gone through its cells as it
// cools. Every burst, splash, rise and drink has one (docs/plans/art/VFX-LIBRARY.md section 1, "impact").
//
// Prior art: Kevin Leroy's hit frame (Riot; 80.lv, 2017: a 0.1 s hot point that matches the hitbox, the most important part of a hit)
// and Smash Melee's hitlag (8 frames at 15 %, capped at 20): a held impact reads where one frame does not (docs/ref/VFX-PRIOR-ART.md 2.2).
//
//   L(layer)   hotCore({ ramp, at, size: [from, to], offset, dur })
// ---------------------------------------------------------------------------------------

/** A layer of an effect (only for readability, as library.js's). */
export const L = (o) => o;

/** The impact's hot core: a sphere of `ramp` pushed to white, `size` its radius from and to (a shrinking one is a light going out:
 *  Dread's), about 0.12 real s. */
export const hotCore = ({ ramp, at = 0, size = [0.3, 1], offset = [0, 0.5, 0], dur = 0.12 } = {}) =>
  L({ type: 'shape', form: 'sphere', ramp, main: 'cells', tile: [2, 2], scroll: [0.4, 0.8], at, dur, scale: [[0, size[0]], [1, size[1]]], offset,
    rim: -0.85, core: 1, coreAt: 0.3, glow: 2.8, erode: [[0, 0], [0.55, 0.12], [1, 1]], rampShift: [[0, 0.05], [1, 0]], turn: 'random' });

