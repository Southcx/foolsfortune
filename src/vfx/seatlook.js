// ---------------------------------------------------------------------------------------
// THE SEAT LOOK (docs/handoffs/dovina/casino-clarity-art-brief.md section 2a): what each of the eight seat colours looks like at Raku's
// tables. A seat colour means only "whose"; it always travels with a SECOND CUE (a shape and a pattern), so the table reads for
// colour-blind players, and a seat token is never mistaken for one of Raku's chips (a chip is a flat round disk with its value printed;
// a seat token stands upright on a foot and is its shape: the circle's included).
//   Red circle solid / Yellow triangle h-stripes / Green square dots / Blue diamond v-stripes / Purple hexagon checks /
//   Pink star diagonal stripes / Black cross solid (pale rim) / White crescent plain (dark keyline).
// Which seat gets which colour is Dovina's data; this file is only the look.
//
// Prior art: the Okabe-Ito colour-blind-safe palette (Red #D55E00, Green #009E73, Blue #0072B2, Pink #CC79A7, Yellow #F0E442), Wong's
// "Points of view: color blindness" (2011) and the rule of redundant coding (shape plus colour: Brewer's ColorBrewer notes; Mario Party,
// Catan and Ticket to Ride's player pieces differ in shape as well as hue). The film tint is oxidation.js's own (schillerInk / featTint):
// no second iridescence is invented here.
//
//   SEAT_NAMES   SEAT_COLOURS { name: hex }   SEAT_LOOK { name: { hex, rim, shape, pattern, ink, outline } }
//   seatColour(name) -> hex string   seatCue(name) -> { shape, pattern }   seatRimTint(name, phase, out) -> THREE.Color (linear, film-lit)
//   shapeOutline(shape) -> [[x, y]...] (y up, radius 1)   seatCellIndex(colour, kind)   drawSeatCell(g, colour, kind, s)   SEAT_KINDS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { schillerInk } from './oxidation.js';

export const SEAT_NAMES = ['Red', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink', 'Black', 'White'];
/** hex: the colour; rim: a lighter lift for a band's edge; ink: the pattern's contrast colour; outline: 'dark' | 'pale' | null. */
export const SEAT_LOOK = {
  Red: { hex: '#D55E00', rim: '#f08a3a', shape: 'circle', pattern: 'solid', ink: '#7a2f00', outline: null },
  Yellow: { hex: '#F0E442', rim: '#fff58a', shape: 'triangle', pattern: 'hstripes', ink: '#8a7f10', outline: 'dark' },
  Green: { hex: '#009E73', rim: '#3fd0a3', shape: 'square', pattern: 'dots', ink: '#00533c', outline: null },
  Blue: { hex: '#0072B2', rim: '#4aa6de', shape: 'diamond', pattern: 'vstripes', ink: '#003a5c', outline: null },
  Purple: { hex: '#7B4FA6', rim: '#a984d0', shape: 'hexagon', pattern: 'checks', ink: '#3e2458', outline: null },
  Pink: { hex: '#CC79A7', rim: '#eba3c9', shape: 'star', pattern: 'dstripes', ink: '#7a2e57', outline: null },
  Black: { hex: '#1A1A1A', rim: '#6a6a6a', shape: 'cross', pattern: 'solid', ink: '#2e2e2e', outline: 'pale' },
  White: { hex: '#F2F2F2', rim: '#ffffff', shape: 'crescent', pattern: 'none', ink: '#bdbdbd', outline: 'dark' },
};
export const SEAT_COLOURS = Object.fromEntries(SEAT_NAMES.map((n) => [n, SEAT_LOOK[n].hex]));
export const SEAT_KINDS = ['rim', 'token', 'plate'];

const look = (name) => SEAT_LOOK[name] || SEAT_LOOK.White;
/** A seat colour's hex (an unknown name falls back to White). */
export const seatColour = (name) => look(name).hex;
/** The second cue: the shape a token takes and the pattern a rim or plate carries. */
export const seatCue = (name) => ({ shape: look(name).shape, pattern: look(name).pattern });

const _f = new THREE.Color(), _s = new THREE.Color();
/** A seat's film-rim tint at phase `phase` (walk it by SCHILLER.rate x real seconds): the seat's colour with oxidation.js's schiller
 *  coming up through it, so a lit rim is both whose (the hue's body) and now (the film). Linear colour, for an emissive or a rim. */
export function seatRimTint(name, phase = 0, out = new THREE.Color()) {
  schillerInk(phase, _f, { sheen: 1, floor: 0.5 });
  return out.set(look(name).hex).lerp(_s.copy(_f), 0.45);
}

// ------------------------------------------------------------------ shapes (one outline for the atlas' glyph and the token's body)
const ngon = (n, rot = -Math.PI / 2, r = 1) => Array.from({ length: n }, (_, i) => [Math.cos(rot + (i * 2 * Math.PI) / n) * r, -Math.sin(rot + (i * 2 * Math.PI) / n) * r]);
/** A shape's outline, counter-clockwise, y up, within the unit circle (the token's polygon and the cell's glyph are the same points). */
export function shapeOutline(shape) {
  switch (shape) {
    case 'triangle': return [[0, 1], [-0.95, -0.7], [0.95, -0.7]];
    case 'square': return [[-0.78, 0.78], [-0.78, -0.78], [0.78, -0.78], [0.78, 0.78]];
    case 'diamond': return [[0, 1], [-0.78, 0], [0, -1], [0.78, 0]];
    case 'hexagon': return Array.from({ length: 6 }, (_, i) => [Math.cos((i * Math.PI) / 3 + Math.PI / 6), Math.sin((i * Math.PI) / 3 + Math.PI / 6)]);
    case 'star': { const p = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.46 : 1; p.push([Math.cos(a) * r, Math.sin(a) * r]); } return p; }
    case 'cross': { const a = 0.33, b = 1; return [[-a, b], [-a, a], [-b, a], [-b, -a], [-a, -a], [-a, -b], [a, -b], [a, -a], [b, -a], [b, a], [a, a], [a, b]]; }
    case 'crescent': { // (open to the right: the outer disk's left, then the inner arc back)
      const p = [], t0 = (50 * Math.PI) / 180, t1 = (310 * Math.PI) / 180, cx = 0.5, rho = Math.hypot(Math.cos(t0) - cx, Math.sin(t0)), s0 = Math.atan2(-Math.sin(t0), Math.cos(t0) - cx) + 2 * Math.PI, s1 = Math.atan2(Math.sin(t0), Math.cos(t0) - cx);
      for (let i = 0; i <= 14; i++) { const a = t0 + ((t1 - t0) * i) / 14; p.push([Math.cos(a), Math.sin(a)]); }
      for (let i = 1; i < 14; i++) { const a = s0 + ((s1 - s0) * i) / 14; p.push([cx + Math.cos(a) * rho, Math.sin(a) * rho]); }
      return p;
    }
    default: return ngon(20, 0, 1); // circle
  }
}

// ------------------------------------------------------------------ atlas cells
/** Where a seat colour's cell lies among the 24 (its index in the seat strip). */
export const seatCellIndex = (colour, kind) => Math.max(0, SEAT_NAMES.indexOf(colour)) * 3 + Math.max(0, SEAT_KINDS.indexOf(kind));

function patternOver(g, L, s) { // (the pattern's ink over the colour, drawn in the cell's clip)
  g.strokeStyle = L.ink; g.fillStyle = L.ink; g.lineWidth = s * 0.07; g.lineCap = 'butt';
  const step = s / 6;
  if (L.pattern === 'hstripes') for (let y = step / 2; y < s; y += step * 1.5) g.fillRect(0, y, s, step * 0.5);
  else if (L.pattern === 'vstripes') for (let x = step / 2; x < s; x += step * 1.5) g.fillRect(x, 0, step * 0.5, s);
  else if (L.pattern === 'dstripes') { for (let k = -s; k < s * 2; k += step * 1.5) { g.beginPath(); g.moveTo(k, s); g.lineTo(k + s, 0); g.stroke(); } }
  else if (L.pattern === 'dots') for (let y = step * 0.8; y < s; y += step * 1.5) for (let x = step * 0.8; x < s; x += step * 1.5) { g.beginPath(); g.arc(x, y, step * 0.38, 0, Math.PI * 2); g.fill(); }
  else if (L.pattern === 'checks') for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) if ((i + j) % 2) g.fillRect(i * step, j * step, step, step);
}
function glyph(g, shape, cx, cy, r) { const P = shapeOutline(shape); g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(cx + x * r, cy - y * r) : g.moveTo(cx + x * r, cy - y * r))); g.closePath(); }
const KEY = { dark: '#17111f', pale: '#d8d8d8' };

/** Paints one seat cell (s x s px) into canvas context `g` at its origin: 'rim' (a band's colour and pattern, with a keyline at its
 *  edges), 'token' (the shape on the colour; the token's body is cut to the same shape), 'plate' (lacquer with a colour strip and the glyph). */
export function drawSeatCell(g, colour, kind, s = 64) {
  const L = look(colour), key = KEY[L.outline] || null;
  g.save(); g.beginPath(); g.rect(0, 0, s, s); g.clip();
  if (kind === 'plate') {
    g.fillStyle = '#17111f'; g.fillRect(0, 0, s, s);
    g.fillStyle = L.hex; g.fillRect(0, 0, s * 0.22, s); patternOver(g, L, s); g.fillStyle = '#17111f'; g.fillRect(s * 0.22, 0, s, s);
    g.fillStyle = L.hex; glyph(g, L.shape, s * 0.62, s * 0.5, s * 0.3); g.fill();
    g.save(); glyph(g, L.shape, s * 0.62, s * 0.5, s * 0.3); g.clip(); patternOver(g, L, s); g.restore();
    glyph(g, L.shape, s * 0.62, s * 0.5, s * 0.3); g.lineWidth = 1.5; g.strokeStyle = key || '#17111f'; g.stroke();
    g.strokeStyle = '#a87a22'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, s - 1, s - 1);
  } else if (kind === 'token') {
    g.fillStyle = L.hex; g.fillRect(0, 0, s, s); patternOver(g, L, s);
    glyph(g, L.shape, s / 2, s / 2, s * 0.4); g.lineWidth = Math.max(2, s * 0.05); g.strokeStyle = key || L.ink; g.stroke(); // (the glyph on the face, keylined)
  } else { // rim
    g.fillStyle = L.hex; g.fillRect(0, 0, s, s); patternOver(g, L, s);
    g.fillStyle = L.rim; g.fillRect(0, 0, s, s * 0.12);
    if (key) { g.fillStyle = key; g.fillRect(0, s * 0.88, s, s * 0.12); g.fillRect(0, 0, s, s * 0.04); }
  }
  g.restore();
}
