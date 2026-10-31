// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S THEATRE, OVERHEAD: what hangs in the flies over a lane, every piece of it above the lane's clear line (theatre.js:
// the camera's height band's top plus a margin, so it never covers play; it comes into view as the camera climbs), in depth like a
// theatre's borders, nearest first:
//   THE VELVET BORDER   a pelmet of crimson velvet the lane's length, its hem swagged, a gold braid along it and a tassel at each swag
//   THE TAPE            Pip's tape measure hung in long swags between dressmaker's pins
//   THE FLY LINES       hemp lines down from the grid, a burlap sandbag on each (the counterweights of the flies)
//   THE RIBBON          satin ribbon in teal, rose and mustard, swagged, a bow at each pin
// The wings take a gap over centre stage, where Strawman's spot comes down (theatre/backstage.js).
//
// Prior art: a proscenium theatre's borders and teasers (masking the flies, upstage ones hung lower), the counterweight sandbags of a
// hemp house, Pollock's printed border pieces (the swagged pelmet and its tassels), a haberdasher's window dressed in ribbon swags.
//
//   dressOverhead(lane, palette)   hang(S, x, yTop, yBag, z, palette, seed) (a fly line and its sandbag: theatre/backstage.js too)   OVERHEAD_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { box, rgb, uvOf, V, hash } from './kit.js';

/** The numbers (m over the lane's clear line, and depth from the plane): each border's depth, its height, its swag and its period. */
export const OVERHEAD_LOOK = {
  reach: 14, col: 0.25,
  velvet: { dz: 1.25, hem: 0.55, swag: 0.35, period: 2.5, top: 6.5, tile: 4, braid: 0.13, tassel: [0.075, 0.26] },
  tape: { dz: -0.25, top: 1.55, sag: 0.85, period: 7.5, width: 0.42, tile: 2 },
  lines: { dz: -0.85, top: 7, every: 9.5, from: 3.75, bag: 0.55 },
  ribbon: { dz: -1.45, top: 1.15, sag: 0.65, period: 5, width: 0.3, tile: 3 },
};
const O = OVERHEAD_LOOK;

/** A fly line from yTop down to its sandbag (its top at yBag): hemp, then a burlap sack tied at the neck. */
export function hang(S, x, yTop, yBag, z, P, seed = 0) {
  box(S, x - 0.035, x + 0.035, yBag + 0.08, yTop, z - 0.035, z + 0.035, (f) => rgb(P.linen, f === 'f' ? 0.78 : 0.55), 'flr');
  const neck = new THREE.CylinderGeometry(0.045, 0.085, 0.16, 6).translate(x, yBag, z);
  S.add(neck, (p, n) => rgb(P.burlapDark, 0.8 + 0.3 * Math.max(0, n.z))); neck.dispose();
  const bag = new THREE.IcosahedronGeometry(0.3, 1).scale(1, 1.3, 0.85).rotateY(hash(seed) * 3).translate(x, yBag - 0.38, z);
  S.add(bag, (p, n) => rgb(P.burlap, 0.62 + 0.3 * Math.max(0, n.y) + 0.22 * Math.max(0, n.z))); bag.dispose();
}

/** The points a band is cut at from xa to xb: every `steps` m (a column, a span's pin, a tile's seam), so no cusp is cut and no tile
 *  is clamped. */
function breaks(xa, xb, steps) {
  const s = new Set([xa, xb]);
  for (const st of steps) for (let k = 1; xa + k * st < xb - 1e-4; k++) s.add(Math.round((xa + k * st) * 1e4) / 1e4);
  return [...s].sort((a, b) => a - b);
}

/** A swagged band: its centreline sags `sag` between pins `period` apart from y `top`, `width` tall, facing the audience, in a region
 *  tiled along it; `tint(span)` its colour by span. */
function swag(S, xa, xb, z, { top, sag, period, width, tile }, region, tint) {
  const xs = breaks(xa, xb, [O.col, period, tile]), spans = Math.max(1, Math.round((xb - xa) / period));
  const at = (x, span) => { const u = (x - xa) / period - span; return top - sag * 4 * u * (1 - u); };
  for (let i = 0; i < xs.length - 1; i++) {
    const x = xs[i], xe = xs[i + 1], m = (x + xe) / 2, span = Math.min(spans - 1, Math.floor((m - xa) / period)), t = Math.floor((m - xa) / tile);
    const ya = at(x, span), ye = at(xe, span), c = tint(span);
    S.quad(V(x, ya - width / 2, z), V(xe, ye - width / 2, z), V(xe, ye + width / 2, z), V(x, ya + width / 2, z), c, uvOf(region, (x - xa) / tile - t, 0, (xe - xa) / tile - t, 1));
  }
}

/** The velvet border: pleated velvet from its swagged hem up, the braid along the hem, a keyline under it, a tassel at each swag's pin;
 *  `gaps` (world x pairs) left open, the card's edge showing at each end and each side of a gap. */
function velvetBorder(lane, P, xa, xb, gaps) {
  const S = lane.solid, Vv = O.velvet, z = lane.Z(Vv.dz), y0 = lane.clear, yTop = y0 + Vv.top;
  const hem = (x, span) => y0 + Vv.hem - Vv.swag * Math.sin(Math.PI * ((x - xa) / Vv.period - span));
  const open = (x) => gaps.some(([a, b]) => x > a && x < b);
  const xs = breaks(xa, xb, [O.col, Vv.period, Vv.tile, 1]), lo = rgb(P.velvet, 1.15), hi = rgb(P.velvet, 0.4), edge = rgb(P.linen, 0.8);
  const cardEdge = (x) => S.quad(V(x, y0 + Vv.hem - Vv.swag, z - 0.03), V(x, y0 + Vv.hem - Vv.swag, z + 0.03), V(x, yTop, z + 0.03), V(x, yTop, z - 0.03), edge);
  let was = true;
  for (let i = 0; i < xs.length - 1; i++) {
    const x = xs[i], xe = xs[i + 1], m = (x + xe) / 2, shut = open(m);
    if (shut !== was) cardEdge(x);
    was = shut; if (shut) continue;
    const span = Math.floor((m - xa) / Vv.period), ha = hem(x, span), he = hem(xe, span), t = Math.floor((m - xa) / Vv.tile), bt = Math.floor(m - xa);
    S.quad(V(x, ha, z), V(xe, he, z), V(xe, yTop, z), V(x, yTop, z), [lo, lo, hi, hi], uvOf('velvet', (x - xa) / Vv.tile - t, 0, (xe - xa) / Vv.tile - t, 1));
    S.quad(V(x, ha - 0.02, z + 0.02), V(xe, he - 0.02, z + 0.02), V(xe, he + Vv.braid, z + 0.02), V(x, ha + Vv.braid, z + 0.02), rgb(0xffffff, 1.05), uvOf('braid', x - xa - bt, 0, xe - xa - bt, 1));
    S.quad(V(x, ha - 0.07, z - 0.01), V(xe, he - 0.07, z - 0.01), V(xe, he, z - 0.01), V(x, ha, z - 0.01), rgb(P.ink, 0.9));
  }
  if (!was) cardEdge(xb);
  for (let k = 0; xa + k * Vv.period <= xb + 1e-3; k++) {
    const x = xa + k * Vv.period; if (open(x - 0.2) || open(x + 0.2)) continue;
    const [r, h] = Vv.tassel, yh = y0 + Vv.hem;
    const ball = new THREE.IcosahedronGeometry(0.07, 0).translate(x, yh - 0.04, z + 0.04); S.add(ball, (p, n) => rgb(P.gold, 0.8 + 0.4 * Math.max(0, n.z))); ball.dispose();
    const cone = new THREE.ConeGeometry(r, h, 6).translate(x, yh - 0.1 - h / 2, z + 0.04); S.add(cone, (p, n) => rgb(P.gold, 0.7 + 0.45 * Math.max(0, n.z) - 0.25 * (yh - p.y))); cone.dispose();
  }
}

/** Everything that hangs over the lane: the velvet border, the tape, the fly lines and the ribbon, outside any gap the lane asks for. */
export function dressOverhead(lane, P) {
  const S = lane.solid, xa = lane.X(-O.reach), xb = lane.X(lane.len + O.reach), y0 = lane.clear;
  const gaps = (lane.gap ? [lane.gap.map((x) => lane.X(x))] : []);
  const open = (x) => gaps.some(([a, b]) => x > a - 0.4 && x < b + 0.4);
  const runs = gaps.length ? [[xa, gaps[0][0]], [gaps[0][1], xb]] : [[xa, xb]];
  velvetBorder(lane, P, xa, xb, gaps);
  // the tape measure, pinned: a dressmaker's pin at each hang point, its head a coloured bead
  const T = O.tape, zt = lane.Z(T.dz);
  for (const [a, b] of runs) {
    const n = Math.max(1, Math.round((b - a) / T.period)), period = (b - a) / n;
    swag(S, a, b, zt, { ...T, top: y0 + T.top, period }, 'tape', () => rgb(0xffffff, 0.98));
    for (let i = 0; i <= n; i++) {
      const x = a + i * period, yh = y0 + T.top;
      const head = new THREE.IcosahedronGeometry(0.085, 0).translate(x, yh + T.width / 2 + 0.06, zt + 0.03); S.add(head, (p, nm) => rgb(i % 2 ? P.teal : P.rose, 0.8 + 0.5 * Math.max(0, nm.z))); head.dispose();
      box(S, x - 0.025, x + 0.025, yh + T.width / 2 + 0.12, yh + 1.6, zt + 0.015, zt + 0.045, rgb(P.steel, 0.85), 'f');
    }
  }
  // the fly lines and their sandbags
  const Ln = O.lines, zl = lane.Z(Ln.dz);
  for (let x = lane.X(Ln.from), i = 0; x < lane.X(lane.len); x += Ln.every, i++) {
    if (open(x)) continue;
    hang(S, x, y0 + Ln.top, y0 + Ln.bag + 0.5 * hash(i * 3.1 + lane.k), zl, P, i + lane.k * 7);
    hang(S, x + 0.2, y0 + Ln.top, y0 + Ln.bag + 1.1 + 0.4 * hash(i * 5.7 + lane.k), zl - 0.12, P, i * 3 + 1);
  }
  // the ribbon, a colour a span, a bow at each pin
  const R = O.ribbon, zr = lane.Z(R.dz), dyes = [P.teal, P.rose, P.mustard];
  for (const [a, b] of runs) {
    const n = Math.max(1, Math.round((b - a) / R.period)), period = (b - a) / n;
    swag(S, a, b, zr, { ...R, top: y0 + R.top, period }, 'ribbon', (span) => rgb(dyes[(span + lane.k) % 3], 1.1));
    for (let i = 0; i <= n; i++) bow(S, a + i * period, y0 + R.top, zr + 0.02, rgb(dyes[(i + lane.k) % 3], 1.15), rgb(dyes[(i + lane.k) % 3], 0.6));
  }
}

/** A ribbon's bow at a pin: two loops out to the sides, two tails hanging, the knot between (satin: the ribbon's sheen down each). */
function bow(S, x, y, z, col, dark) {
  const sheen = uvOf('ribbon');
  for (const s of [-1, 1]) {
    S.quad(V(x, y - 0.06, z), V(x + s * 0.42, y - 0.16, z), V(x + s * 0.42, y + 0.2, z), V(x, y + 0.06, z), s > 0 ? col : [col, col, col, col].map((c, i) => (i % 3 ? dark : c)), sheen);
    S.quad(V(x + s * 0.03, y - 0.05, z + 0.01), V(x + s * 0.13, y - 0.05, z + 0.01), V(x + s * 0.3, y - 0.62, z + 0.01), V(x + s * 0.17, y - 0.66, z + 0.01), col, sheen);
  }
  S.quad(V(x - 0.07, y - 0.09, z + 0.02), V(x + 0.07, y - 0.09, z + 0.02), V(x + 0.07, y + 0.09, z + 0.02), V(x - 0.07, y + 0.09, z + 0.02), dark);
}
