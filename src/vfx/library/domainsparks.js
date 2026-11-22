// ---------------------------------------------------------------------------------------
// A DOMAIN'S SPARK OF INSIGHT (plain name; South, 2026-11-22: "early levels should be like sparks of insight flashing, high levels are the
// current bombastic aura pulse"): the small level-up, played by vfx/domainlooks.js below a domain's 70th level in place of its
// `domain.<id>.level` (the whole grammar, kept for 70 and over). A thought striking at the brow: a white-hot pinprick, a thin ring in the
// camera's plane opening off it, a few glints flicked out and falling, in the domain's glaze; no flash, no shake, a tiny lamp. About
// 0.6 real s, under a tenth of the full level-up's weight, so a level that comes every few minutes never takes the screen.
//   domain.<id>.spark   the spark (its ctx.scale grows it with the level: domainlooks.js SPARK)
// Prior art, as a museum label: the light-bulb flash of a cartoon idea (Fleischer, 1930s), and Persona 5's social-stat "rank up" glint
// (Atlus, 2016): a small, quick, repeated reward kept below the big one, so the big one still lands.
// ---------------------------------------------------------------------------------------
import { DOMAIN_LOOK } from '../../ui/domainlook.js';

const hex = (s) => parseInt(s.slice(1), 16);
/** A colour let toward white by k (the spark's hot end). */
const pale = (s, k) => { const n = hex(s), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * k)); return (c[0] << 16) | (c[1] << 8) | c[2]; };
const BROW = [0, 0, 0]; // (played at the brow: vfx/domainlooks.js SPARK.brow sets its pos there, since a sprite's offset grows with ctx.scale and a shape's does not)

function spark(id) {
  const C = DOMAIN_LOOK[id].colours, body = C.body, acc = C.accent || C.body;
  return { layers: [
    // PRIMARY: the pinprick of the thought, white-hot for a tenth of a second
    { type: 'shape', form: 'sphere', ramp: id, main: 'cells', tile: [2, 2], dur: 0.12, scale: [[0, 0.05], [0.4, 0.2], [1, 0.08]], offset: BROW,
      rim: -0.6, glow: 2.6, core: 1, coreAt: 0.5, erode: [[0, 0], [1, 1]], rampShift: [[0, 0.6], [1, 0.1]], turn: 'random' },
    // SECONDARY: one thin ring in the camera's plane opening off it
    { type: 'shape', form: 'ring', face: 'camera', ramp: id, main: 'rays', tile: [24, 1], scroll: [0.6, 0], at: 0.02, dur: 0.32, scale: [[0, 0.12], [1, 0.75]], offset: BROW,
      edgeV: [0.48, 0.48], erode: [[0, 0.1], [0.5, 0.08], [1, 1]], rampShift: [[0, 0.3], [1, -0.2]], glow: 2, core: 0.4 },
    // TERTIARY: a few glints flicked out of it, falling as they go out
    { type: 'sprites', at: 0.03, count: [6, 9], shape: 'star4', spawn: 'sphere', r: 0.08, offset: BROW, dir: 'out', speed: [1.4, 2.4], drag: 2.2, gravity: 2.5,
      size: [0.05, 0.08], sizeEnd: 0, life: [0.35, 0.55], color: pale(acc, 0.7), colorEnd: hex(body), twinkle: 6 },
    { type: 'sprites', at: 0.05, count: [2, 3], shape: 'glint', spawn: 'sphere', r: 0.25, offset: BROW, dir: 'up', speed: [0.2, 0.4], size: [0.1, 0.16], sizeEnd: 0, life: [0.3, 0.45], color: pale(body, 0.85) },
    // the lamp: a small one, a beat
    { type: 'light', color: hex(body), k: 3, range: 2.5, dur: 0.3, up: 1.7 },
  ] };
}

export const DOMAIN_SPARK_EFFECTS = Object.fromEntries(Object.keys(DOMAIN_LOOK).map((id) => [`domain.${id}.spark`, spark(id)]));
