// ---------------------------------------------------------------------------------------
// THE DUEL'S VIEW, ITS LAYOUT: the numbers every part of the duel's view shares (vfx/duelview.js), and where a cell of a puzzle duel's
// board stands on the tsuitate. The board's own frame: +X runs from the Courier's end to the foe's (column 0 at the Courier's end),
// +Y is the world's up (row 0 at the top: the kernel's gravity S is the world's down), +Z is the face the camera reads (the slab's face
// at z 0, the pieces standing a little proud of it). Pure numbers and helpers: no meshes.
//
// Prior art: the tsuitate (衝立), the Japanese single-panel standing screen on its two feet; Super Puzzle Fighter II Turbo's wells, a
// cell a fixed size so a gem reads at arcade resolution (here 15 dots at the 480-line present, from about 6 m: board v11, figure 08).
//
//   DUEL_VIEW (the knobs: sizes in metres, times in real seconds)   cellLocal(x, y, board, out) -> Vector3 (the board's frame)
//   FEELING_ORDER (the kernel's COLOURS: a gem family's index)   feelColour(aspect, out) -> THREE.Color   sm(t) ease(t, s)   clamp01
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../../progress/weather.js';

export const DUEL_VIEW = {
  cs: 0.15,          // a cell's side (m): 20 cells, a 3 m slab
  base: 0.62,        // the slab's foot above the ground (m): the frame's feet below it
  border: 0.15,      // the clay frame's width round the slab (m)
  depth: 0.16,       // the frame's depth behind the slab's face (m)
  lip: 0.05,         // how far the frame stands proud of the face (m)
  front: 0.055,      // a piece's centre in front of the face (m)
  radius: 18,        // the domains' clash's sphere (m), round the board's foot
  unfold: 1.2,       // the domains' opening (real s)
  collapse: 0.8,     // and their closing
  push: 0.9,         // the seam's push on a `line` (real s, decaying)
  maxPieces: 400,    // instances a family may hold (the whole board)
  fallG: 2 / (0.08 * 0.08), // free fall in cells a real second squared: the first cell in 0.08 real s (board v11, figure 06)
  squash: 0.07,      // the land's squash along the gravity's axis
  ma: 0.04,          // the stillness between two phases
};

/** The kernel's colours, in its order (progress/duel/board.js COLOURS): a gem family's index. */
export const FEELING_ORDER = ['wonder', 'mirth', 'desire', 'fury', 'gall', 'grief', 'dread'];

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const sm = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
/** An ease out with an overshoot (the mock's oB: the Line's step, a numeral's pop). */
export const ease = (t, s = 1.70158) => { t = clamp01(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
export const lerp = (a, b, t) => a + (b - a) * t;
/** A stable hash of two numbers into 0..1 (a piece's own wobble, a shard's own way: never the sim's stream). */
export const hash = (a, b = 0) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };

/** A feeling's colour (the one table, progress/weather.js COLOR), Fury's when it has none. */
export const feelColour = (aspect, out = new THREE.Color()) => out.setHex(COLOR[aspect] ?? COLOR.fury);

/** Where cell (x, y) stands in the board's frame (fractional cells are fine: a piece between two). */
export function cellLocal(x, y, board, out = new THREE.Vector3()) {
  const { cs, base, front } = DUEL_VIEW;
  return out.set((x + 0.5 - board.w / 2) * cs, base + (board.h - y - 0.5) * cs, front);
}
