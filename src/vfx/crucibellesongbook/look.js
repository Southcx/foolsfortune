// ---------------------------------------------------------------------------------------
// THE CRUCIBELLE'S SONGBOOK: its look as data and its small helpers (part of vfx/crucibellesongbook.js). The five neumes (a shape a
// degree, Aikin's shape-note heads read from la), a song's neume, the degree colours as css, the note names of the scale sounding, the
// swing of the songbook's metronome on the bell's own beat (one function, so what is drawn and what read() says are the same numbers),
// the brass, the walnut, the paper and the ink. Everything in dots (a line of the 480-line present), as the other tool UIs draw.
//
// Prior art, as on a museum label: shape-note singing (Little and Smith's The Easy Instructor, 1801; Aikin's seven shapes, 1846), a
// notehead whose shape is its degree, so a singer who cannot read a staff can read the tune; neumes themselves (the chant's signs,
// written without a staff) and their ligatures; Maelzel's metronome (1815), whose rod swings as a pendulum turned upside down, slowing
// into each end.
//
//   NEUMES[d - 1] -> { id, pts, c }   songNeume(id)   neumePath(x, d, s)   DEG[d - 1] (css)   noteName(midi)   scaleNames(cb)
//   swing(t, G, half, AMP) -> { ph, th, notch, centre, half, inNotch, towardEnd, toBar, side, down, beat, beats }
//   BRASS WALNUT PAPER INK EMBER and the reliquary's helpers re-exported (C01 sm oB lerp KEY VERD J15 CZ film rgba mixH shade rng TAU D)
// ---------------------------------------------------------------------------------------
import { SONGS, DEGREE_COLOR } from '../../tools/crucibelle/songs.js';
import { WINDOW } from '../../tools/crucibelle/crucibelle.js';
import { C01, sm, oB, lerp, KEY, VERD, J15, CZ, film, rgba, mixH, shade, rng, hexOf, TAU, D } from '../lockheartreliquary/look.js';
export { C01, sm, oB, lerp, KEY, VERD, J15, CZ, film, rgba, mixH, shade, rng, hexOf, TAU, D };

export const BRASS = '#d9b048', BRASS_HI = '#f6dc8a', BRASS_LO = '#6e5418';
export const WALNUT = '#4a2c1c', WALNUT_HI = '#7a4c30', WALNUT_LO = '#1e110a';
export const PAPER = '#efe4cc', PAPER_LO = '#c9b894', INK = '#191310', VERM = '#c8402a', EMBER = '#ff7a2a';
/** The degrees' colours (the bell's vents and its smoke: tools/crucibelle/songs.js DEGREE_COLOR), as css. */
export const DEG = DEGREE_COLOR.map(hexOf);

const ring = (n, rx, ry = rx, cx = 0, cy = 0, a0 = 0, a1 = Math.PI * 2) => Array.from({ length: n }, (_, i) => { const a = a0 + ((a1 - a0) * i) / (a1 - a0 === Math.PI * 2 ? n : n - 1); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
/** The five neumes, one a degree of the bell's scale (keys 1 to 5, and 6 to 0 an octave up), Aikin's shape-note heads read in the minor
 *  from la: closed outlines on a unit square (x right, y up). */
export const NEUMES = [
  // 1, the root (la): the square, the floor the tune stands on
  { id: 'square', pts: [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]], c: [0, 0] },
  // 2, the minor third (do): the triangle, point up, the note that lifts the tune
  { id: 'triangle', pts: [[0, 1], [0.98, -0.78], [-0.98, -0.78]], c: [0, -0.19] },
  // 3, the fourth (re): the bowl, flat side up, a cup waiting to be filled
  { id: 'bowl', pts: ring(13, 1, 1.45, 0, 0.6, 0, -Math.PI), c: [0, 0.6 - (4 * 1.45) / (3 * Math.PI)] },
  // 4, the fifth (mi): the diamond, the point of the tune
  { id: 'diamond', pts: [[0, 1.05], [0.85, 0], [0, -1.05], [-0.85, 0]], c: [0, 0] },
  // 5, the minor seventh (sol): the circle, rolling home to the root above
  { id: 'circle', pts: ring(18, 0.9), c: [0, 0] },
];
/** A song's neume: its notes' heads, heighted by degree, side by side (the chant's compound neume). Unit half-width. */
export function songNeume(id) {
  const notes = SONGS[id]?.notes || [], n = notes.length, step = n > 1 ? 1.8 / (n - 1) : 0, s = Math.min(0.3, 0.7 / n + 0.08);
  return { s, heads: notes.map((d, i) => ({ d, x: -0.9 + i * step, y: (d - 3) * 0.32 })) };
}
/** The neume of degree `d` as a canvas path at the origin, `s` its half-size (canvas y is down: the shapes are flipped to stand up). */
export function neumePath(x, d, s) {
  const N = NEUMES[d - 1]; x.beginPath();
  N.pts.forEach(([u, v], i) => { const px = (u - N.c[0]) * s, py = -(v - N.c[1]) * s; i ? x.lineTo(px, py) : x.moveTo(px, py); });
  x.closePath();
}

const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
/** A MIDI pitch's name, flats spelled 'b' (the faces have no flat sign). */
export const noteName = (m) => NAMES[((Math.round(m) % 12) + 12) % 12];
/** The five degrees' names in the scale sounding now (the bell's own: its root and scaleNow()). */
export function scaleNames(cb) {
  const G = cb.grid(), sc = cb.scaleNow();
  return sc.map((s) => noteName((G.root ?? 63) + s));
}

/** The songbook's metronome at time `t` on the bell's grid `G`: the rod's angle and everything the eye can read off it. Each end of the
 *  swing lands on a beat of the bell's (its grid: spb one beat, folded to BEAT.max); Half Time, on every other beat, a notch in the middle
 *  for the beat between. `notch` is the angle past which the rod stands inside the bell's own window (WINDOW real s either side of a
 *  beat): the notch is the window, never wider. */
export function swing(t, G, half, AMP) {
  const e = G.spb, ph = (t - G.t0) / e;
  const sw = half ? ph / 2 : ph, th = AMP * Math.cos(Math.PI * sw);
  const wE = Math.min(WINDOW / e, half ? 1 : 0.5);
  const notch = AMP * Math.cos(Math.PI * Math.min(half ? wE / 2 : wE, 0.5));
  const centre = half ? AMP * Math.sin(Math.PI * Math.min(wE / 2, 0.5)) : 0;
  const beats = G.beats || 4, pb = ((ph % beats) + beats) % beats, toBar = Math.min(pb, beats - pb);
  const barAt = pb < beats / 2 ? ph - pb : ph + beats - pb, side = Math.cos(Math.PI * (half ? barAt / 2 : barAt)) >= 0 ? 1 : -1;
  const abs = Math.abs(th), inNotch = abs >= notch - 1e-6 || (half && abs <= centre + 1e-6);
  const towardEnd = Math.sin(2 * Math.PI * sw) < 0; // (|th| growing: d|th|/dt has the sign of -sin(2 pi sw))
  return { ph, th, notch, centre, half, inNotch, towardEnd, toBar, side, down: sm(1 - toBar / 0.75), beat: Math.floor(pb + 0.5) % beats, beats };
}
