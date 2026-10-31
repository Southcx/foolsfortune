// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S LOOK, THE SEWING KIT'S PROPS, THE TURNED ONES: the things of Pip's sewing basket made on a lathe, each drawn into a
// placeholder box's own metres (x along it, y up it, z toward the stalls; props/kit.js) at giant scale:
//   a spool         a cotton reel stood upright, its top flange the walkable top, the bottom flange under it; between them the barrel
//                   wound with thread (a few windings' grooves, swelling a little at its middle); a hole bored through. Squat, it is a
//                   bobbin; gilded (the ? spool), its flanges brass and a mark on its thread; spent, its flanges walnut and its barrel bare
//   a thimble       a dimpled brass or steel cap, open end down, its rolled rim and domed top
//   a pin           a dressmaker's pin hung point down, steel, its round glass head at the top (a wall)
//   a needle        a sewing needle hung point down from the flies on its thread, its eye near the top (the Flood's spigot)
//   a button        a sewing button: a rim, a dished middle, four holes
//   a glass bead    a faceted bead
// Prior art: Pip's sewing basket (LORE.md: the clay folk's stoneware apprentice), the cotton reel and the bobbin as Yoshi's Woolly
// World and LittleBigPlanet stage them (a household thing at giant scale is a platform), Kirby's Epic Yarn's wound thread.
//
//   spool(K, w, h, d, { thread, wood, gilded, bare, mark, seed })   thimble(K, r0, r1, h, { col, soup, place, y })   pin(K, w, h, { head })
//   needle(K, w, h, d, { fly, thread })   button(K, r, h, { col, place, y })   bead(K, x, y, z, r, col)   star(K, x, y, z, r, col, turn)
//   SEW (the numbers)   FLY (the flies' height)   (K: a PropKit, props/kit.js, its palette K.pal: WELL_LOOK.palette)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { turned, extruded, hash, shade } from './kit.js';

/** The numbers (metres, or shares of a box's size). */
export const SEW = {
  spool: { flange: 0.12, flangeMin: 0.07, flangeMax: 0.34, barrel: 0.8, band: 0.3, groove: 0.8, hole: 0.14, bulge: 0.04 },
  thimble: { rim: 1.07, dimpleRows: 4 },
  pin: { shaft: 0.85, head: 0.7, headMax: 0.62, taper: 2.2 },
  needle: { shaft: 0.9, taper: 3, eye: 0.08, thread: 0.07 },
  mark: { outer: 0.24, inner: 0.22, twinkle: 0.5 },
};
const segsOf = (r) => Math.max(12, Math.min(22, Math.round(r * 10)));

/** A cotton reel in a box w x h x d (centred), upright: the flanges at the box's top and bottom, the barrel wound between. `gilded`: its
 *  flanges brass (the metal soup) and a gold twinkle on its thread at the front; `bare`: a spent reel, its barrel wood. */
export function spool(K, w, h, d, { thread = K.pal.rose, wood = K.pal.maple, gilded = false, bare = false, mark = false, seed = 0 } = {}) {
  const PAL = K.pal, S = SEW.spool, rx = w / 2, kz = Math.min(1, d / w), y0 = -h / 2, y1 = h / 2;
  const ft = Math.min(h * 0.3, Math.max(S.flangeMin, Math.min(S.flangeMax, h * S.flange)));
  const bev = Math.min(ft * 0.45, rx * 0.06), rb = rx * S.barrel, rh = rx * S.hole, rec = Math.min(0.06, ft * 0.5);
  const fs = gilded ? 'metal' : 'matte', W = gilded ? PAL.gold : wood, R = shade(W, 0.78), ink = PAL.ink;
  const T = bare ? shade(PAL.maple, 1.08) : thread, G = bare ? T : shade(thread, 0.72);
  const yb0 = y0 + ft, yb1 = y1 - ft, n = Math.max(1, Math.round((yb1 - yb0) / S.band)), bulge = (u) => rb * (1 + (bare ? 0 : S.bulge) * Math.sin(Math.PI * u));
  const P = [[0, y0 + rec, ink], [rh, y0 + rec, ink], [rh, y0, W, fs], [rx - bev, y0, R, fs], [rx, y0 + bev, R, fs], [rx, yb0, W, fs]];
  // (each winding's band its thread, its top fifth a groove)
  for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + S.groove) / n;
    P.push([bulge(u0), yb0 + (yb1 - yb0) * u0, T], [bulge(u1), yb0 + (yb1 - yb0) * u1, G]);
  }
  P.push([rb, yb1, W, fs], [rx, yb1, R, fs], [rx, y1 - bev, R, fs], [rx - bev, y1, W, fs], [rh, y1, ink], [rh, y1 - rec, ink], [0, y1 - rec, ink]);
  turned(K, P, segsOf(rx), { kz, phase: hash(seed) * 0.6 });
  if (mark && !bare) {
    // (a twinkle, never a plus: a thin four-point star over a smaller one turned an eighth, so no red-and-white cross reads)
    const z = rb * (1 + S.bulge) * kz + 0.012, r = Math.min(SEW.mark.outer, (yb1 - yb0) * 0.42);
    star(K, 0, 0, z + 0.015, r, PAL.gold); star(K, 0, 0, z, r * SEW.mark.twinkle, PAL.gold, Math.PI / 4);
  }
}

/** A four-pointed star, flat, facing the stalls at (x, y, z), turned `turn`: the ? spool's mark (no word: a sparkle). */
export function star(K, x, y, z, r, col = K.pal.gold, turn = 0) {
  const pts = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 2 + turn, rr = i % 2 ? r * SEW.mark.inner : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  K.gloss.add(extruded(pts, 0.03, z), col);
}

/** A thimble, open end down on y (its foot), domed at the top: r0 its foot, r1 its shoulder, h tall; dimpled in a checker of its metal. */
export function thimble(K, r0, r1, h, { col = K.pal.brass, soup = 'metal', place = null, y = 0, segs = 16 } = {}) {
  const k = SEW.thimble.rim, dark = shade(col, 0.72), rows = SEW.thimble.dimpleRows, side0 = y + h * 0.18, side1 = y + h * 0.78;
  const P = [[0, y, dark, soup], [r0, y, dark, soup], [r0 * k, y + h * 0.04, dark, soup], [r0 * k, y + h * 0.14, dark, soup]];
  for (let i = 0; i < rows; i++) { const u = i / rows; P.push([r0 + (r1 - r0) * u, side0 + (side1 - side0) * u, col, soup]); }
  P.push([r1, side1, col, soup], [r1 * 0.9, y + h * 0.9, col, soup], [r1 * 0.62, y + h * 0.975, col, soup], [0, y + h, col, soup]);
  const first = 4, last = first + rows + 1;
  turned(K, P, segs, { place, at: (row, s) => (row >= first && row <= last && (row + s) % 2 ? dark : null) });
}

/** A dressmaker's pin hung point down in a box w wide, h tall (a wall): its steel shaft, the point at the foot, its glass head at the top
 *  (a touch wider than the wall, its top the box's top). */
export function pin(K, w, h, { head = K.pal.rose } = {}) {
  const PAL = K.pal, S = SEW.pin, r = (w / 2) * S.shaft, rh = Math.min(S.headMax, w * S.head), y0 = -h / 2, y1 = h / 2, steel = PAL.steel, lit = shade(steel, 1.18);
  const P = [[0, y0, shade(steel, 0.7), 'metal'], [r * 0.35, y0 + r * 0.5, steel, 'metal'], [r, y0 + r * S.taper, steel, 'metal'], [r, y1 - rh * 1.4, steel, 'metal'], [0, y1 - rh * 1.4]];
  const segs = 14;
  turned(K, P, segs, { at: (row, s) => (row >= 1 && (s === 0 || s === segs - 1) ? lit : null) });
  K.gloss.add(new THREE.SphereGeometry(rh, 16, 12).translate(0, y1 - rh, 0), head);
  K.gloss.add(new THREE.SphereGeometry(rh * 0.2, 8, 6).translate(-rh * 0.35, y1 - rh * 0.62, rh * 0.82), PAL.chalk);
}

/** A sewing needle hung point down in a box (the Flood's spigot): its eye near the top, its thread up through it to the flies (`fly`: the
 *  flies' height in the box's metres). */
export function needle(K, w, h, d, { fly = h, thread = K.pal.mustard } = {}) {
  const PAL = K.pal, S = SEW.needle, r = (Math.min(w, d) / 2) * S.shaft, y0 = -h / 2, y1 = h / 2, steel = PAL.steel, segs = 12;
  const P = [[0, y0, shade(steel, 0.7), 'metal'], [r * 0.4, y0 + r * 0.9, steel, 'metal'], [r, y0 + r * S.taper, steel, 'metal'], [r, y1 - r * 1.2, steel, 'metal'], [r * 0.75, y1 - r * 0.45, steel, 'metal'], [r * 0.4, y1 - r * 0.1, steel, 'metal'], [0, y1]];
  turned(K, P, segs, { at: (row, s) => (row >= 1 && (s === 0 || s === segs - 1) ? shade(steel, 1.18) : null) });
  const L = Math.min(1.2, Math.max(0.35, h * S.eye)), ew = r * 0.55, ey = y1 - r * 1.4 - L / 2, slot = [];
  for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; slot.push([Math.cos(a) * ew / 2, ey - L / 2 + ew / 2 + Math.sin(a) * ew / 2]); }
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; slot.push([Math.cos(a) * ew / 2, ey + L / 2 - ew / 2 + Math.sin(a) * ew / 2]); }
  K.matte.add(extruded(slot, 0.02, r * 0.97), PAL.ink);
  const t = S.thread;
  K.matte.box(-t / 2, t / 2, ey - L * 0.3, Math.max(ey + 0.5, fly), r + 0.03, r + 0.03 + t, thread);
}

/** A sewing button lying on y (its foot), r round, h thick: a rim, a dished middle and four holes; `place` turns it (a wheel). */
export function button(K, r, h, { col = K.pal.velvet, place = null, y = 0, soup = 'matte' } = {}) {
  const b = Math.min(h * 0.35, r * 0.12), dish = y + h * 0.7, dark = shade(col, 0.78);
  turned(K, [[0, y, dark, soup], [r - b, y, dark, soup], [r, y + b, col, soup], [r, y + h - b, col, soup], [r - b, y + h, col, soup], [r * 0.74, y + h, dark, soup], [r * 0.68, dish, col, soup], [0, dish]], segsOf(r) + 4, { place });
  const ink = K.pal.ink;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const g = new THREE.CylinderGeometry(r * 0.1, r * 0.1, 0.03, 8).translate(sx * r * 0.21, dish + 0.008, sz * r * 0.21);
    if (place) g.applyMatrix4(place);
    K.matte.add(g, ink);
  }
}

/** A faceted glass bead at (x, y, z). */
export function bead(K, x, y, z, r, col) { K.gloss.add(new THREE.IcosahedronGeometry(r, 0).translate(x, y, z), col); }

/** The flies' height (lane metres over the floor) where a thing hung from them is tied. */
export const FLY = 30;
