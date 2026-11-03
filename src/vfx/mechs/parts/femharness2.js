// ---------------------------------------------------------------------------------------
// THE DOLL'S HARNESS, THE SECOND SETS (plain names; South, 2026-11-02: "generate some more body ornamentation options, we can always
// cull what doesn't work later ... more experimentation with the varying of thickness of the gold lines, maybe more ribbon-like
// motifs"): eight more sets for femharness.js's HARNESSES, drawn with the kit's flat lines (femharnesskit.js: a ribbon whose face
// follows the surface under it, tapered and twisted; a bow; a two-strand rope; beads on a draped thread), each line in the frame of
// the plate it lies on (a chest plate's rides its spring). The pelvis's lines follow its curves as the first sets' do: cut high over
// the iliac crest, round under the gluteal masses.
//   bows       a ribbon bikini: a ribbon leg line and a ribbon waist meeting over each crest in a bow, ribbon rims on the tanks and a
//              halter tie up to a bow at the collar
//   corset     a corset laced up the waist: eyelets either side of the busk, laces crossed between them, a bow at the top, gilt edges
//              under the chest and over the hips, the basque dipping to a point under the navel
//   sling      a sling one-piece: one wide gold band from each shoulder down the flanks to the crotch, a V in front and a V behind,
//              tapering as it goes
//   rope       a two-strand rope tied in kinbaku's diamonds down the front: a line down the sternum knotted three times, the diamonds
//              opened from it, a rope over and under the tanks, round the hips, down over the hips and round each thigh
//   mucha      Mucha's ribbon: one long gold ribbon thrown round the hips from the left crest across the belly and under the right
//              cheek, turning its faces as it goes, a fine trim ribbon riding beside it; ribbons looped round the tanks
//   crisscross a crisscross cutout one-piece: gilt-edged straps crossed over the waist, the front panel's edges down to the crotch,
//              the hip cutouts crossed by straps
//   swag       a showgirl's beaded swag: a jewelled belt slung over the crests with strands of beads draped between its jewels in two
//              tiers and drops hanging from them; beads under the tanks and up to the collar
//   obi        a wide sash with gilt edges round the waist, its cord down the middle and a great bow behind; a plain line at the leg
// Prior art: the string bikini's side ties; the Victorian corset and its busk; the sling swimsuit (Rudi Gernreich's, 1960s-70s);
// kinbaku's hishi diamond and its two-strand hemp; Mucha's flowing ribbons and their turned faces; the 1980s cutout one-piece;
// the Folies Bergere's beaded swags; the obi's bow and its obijime cord (the otaiko and the cho-cho musubi).
//
//   MORE_HARNESSES[id] = { label, pelvis(S, P), chest(S, C), bust(S, B), thigh(S, T) }   (the contexts femharness.js's)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L } from './kit.js';
import { PI, smooth, gilt, onPelvis, path, mirror, legLine, beltLine, plateRim, ribbon, taper, swell, bow, rope, coin } from './femharnesskit.js';

const ROPE = 0xa83a2c; // (the rope's hemp dyed vermilion: the one colour here that is neither gold nor trim)
/** A ribbon on the pelvis along a path, laid on both sides (the +X half's path, mirrored), its face on the sculpt's normal. */
const lay = (S, P, pth, o = {}, piece = S.g) => { const q = onPelvis(P, pth); for (const pts of [q, mirror(q)]) ribbon(piece, pts, P.nrm, o); return q; };
/** A path [[phi, y]] through stations, linear between them, n samples. */
const via = (st, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const u = (i / n) * (st.length - 1), k = Math.min(st.length - 2, u | 0), t = u - k; return [st[k][0] + (st[k + 1][0] - st[k][0]) * t, st[k][1] + (st[k + 1][1] - st[k][1]) * t]; });
/** Points on the chest along a path [[phi, y]] (its plan's surface a hair out). */
const onChest = (C, pth, k = 1.05) => pth.map(([phi, y]) => C.on(phi, y, k));
/** A strap from a plate's rim up to a chest point, as points in the plate's frame (lifted over the chest). */
const strapPts = (B, from, to, lift = 0.12) => { const C = B.local(to); return [0, 0.25, 0.5, 0.75, 1].map((k) => { const m = new THREE.Vector3(...from).lerp(C, k); m.z += lift * Math.sin(PI * k); return m.toArray(); }); };
const rimPts = (B, a0 = 0, a1 = PI * 2, k = 1, n = 40) => Array.from({ length: n + 1 }, (_, i) => B.rim(a0 + ((a1 - a0) * i) / n, k));
const faceOut = () => [0, 0, 1];
/** A knot in the rope: a lump of it where lines meet. */
const knot = (S, q, r = 0.045) => S.trim.ball(r, { at: q, sc: [1.15, 0.9, 0.7], c: ROPE }, 10, 8);

export const MORE_HARNESSES = {
  bows: { label: 'ribbon bikini',
    pelvis(S, P) {
      const leg = legLine(0.34, -0.8, -1.0), waist = beltLine(-0.3, 0.34, 0.04);
      lay(S, P, path(0.1, 3.05, leg, 40), { w: swell(0.075, 0.03), th: 0.01 });
      lay(S, P, path(0, PI, waist, 36), { w: (u) => 0.03 + 0.03 * smooth(Math.abs(u - 0.47) < 0.47 ? 1 - Math.abs(u - 0.47) / 0.47 : 0), th: 0.01 });
      const q = onPelvis(P, [[1.5, 0.36]])[0]; // (the side tie over the crest, both sides)
      if (q) for (const s of [1, -1]) { const p = [s * q[0], q[1], q[2]]; bow(S, p, P.nrm(p), [0, 1, 0], { size: 0.22, w: 0.07 }); }
    },
    chest(S, C) { bow(S, C.choker.toArray(), [0, 0.25, 1], [0, 1, 0], { size: 0.16, w: 0.05, tails: 0.7 }); },
    bust(S, B) {
      ribbon(S.g, rimPts(B), faceOut, { w: 0.06, th: 0.01, n: 64 });
      const s = B.s; ribbon(S.g, strapPts(B, B.rim(s > 0 ? PI - 0.9 : 0.9), B.choker), faceOut, { w: taper(0.06, 0.035), th: 0.01, twist: (u) => s * 0.5 * Math.sin(PI * u) });
    },
  },
  corset: { label: 'corset',
    chest(S, C) {
      const ys = Array.from({ length: 8 }, (_, i) => 0.66 + i * 0.12), ph = 0.17;
      const eye = (s, y) => C.on(s * ph, y, 1.055);
      for (const y of ys) for (const s of [1, -1]) S.g.ball(0.026, { at: eye(s, y), sc: [1, 1, 0.55], c: L.gold }, 10, 6);
      for (let i = 0; i < ys.length - 1; i++) for (const s of [1, -1]) { // (the laces crossed between the eyelets, over the busk's gap)
        const a = eye(s, ys[i]), b = eye(-s, ys[i + 1]), m = C.on(0, (ys[i] + ys[i + 1]) / 2, 1.07);
        ribbon(S.trim, [a, m, b], C.nrm, { w: 0.022, th: 0.008, c: L.trimD, n: 10, twist: (u) => s * 0.6 * (u - 0.5) });
      }
      for (const s of [1, -1]) gilt(S, onChest(C, [[s * 0.27, 0.62], [s * 0.27, C.under - 0.08]], 1.05), 0.014); // (the busk's two edges)
      bow(S, C.on(0, ys.at(-1) + 0.09, 1.08), C.nrm(C.on(0, ys.at(-1), 1)), [0, 1, 0], { size: 0.15, w: 0.035, c: L.trimD, piece: S.trim, tails: 0.9 });
      const band = (y) => onChest(C, Array.from({ length: 25 }, (_, i) => [-1.55 + (3.1 * i) / 24, y]), 1.05);
      ribbon(S.trim, band(C.under - 0.04), C.nrm, { w: 0.07, th: 0.012, c: L.trimL, gild: { piece: S.g, r: 0.011 } }); // (the corset's top edge, gilt)
    },
    pelvis(S, P) {
      const basque = (p) => beltLine(0.06, 0.4, 0.3)(p) - 0.3 * Math.max(0, 1 - p / 0.6) ** 1.6; // (dipping to a point under the navel)
      lay(S, P, path(0, PI, basque, 36), { w: 0.085, th: 0.014, c: L.trimL, gild: { piece: S.g, r: 0.012 } }, S.trim);
    },
    bust(S, B) { plateRim(S, B, 0.022); },
  },
  sling: { label: 'sling',
    chest(S, C) {
      for (const s of [1, -1]) {
        const pts = onChest(C, via([[s * 0.92, C.top - 0.42], [s * 1.12, 1.86], [s * 0.98, 1.4], [s * 0.66, 0.98], [s * 0.46, 0.6]], 30), 1.05);
        ribbon(S.g, pts, C.nrm, { w: taper(0.17, 0.13), th: 0.014, gild: { piece: S.trim, r: 0.009, c: L.trimD } });
      }
    },
    pelvis(S, P) {
      lay(S, P, via([[0.46, 0.42], [0.3, 0.0], [0.14, -0.5], [0.07, -0.86]], 26), { w: taper(0.13, 0.07), th: 0.014, gild: { piece: S.trim, r: 0.009, c: L.trimD } });
      lay(S, P, via([[1.05, 0.4], [1.9, 0.1], [2.75, -0.45], [3.02, -0.95]], 26), { w: taper(0.1, 0.05), th: 0.014, gild: { piece: S.trim, r: 0.009, c: L.trimD } }); // (behind: over the crest and down round the cheek into the V)
    },
    bust(S, B) { plateRim(S, B, 0.02); },
  },
  rope: { label: 'knotted rope',
    chest(S, C) {
      const ys = [C.top - 0.2, 1.55, 1.1, 0.68], knots = ys.map((y) => C.on(0, y, 1.06));
      rope(S, [C.choker.toArray(), ...knots]); for (const k of knots) knot(S, k);
      for (let i = 1; i < ys.length - 1; i++) for (const s of [1, -1]) { // (a diamond opened out from each pair of knots)
        const mid = (ys[i] + ys[i + 1]) / 2; rope(S, onChest(C, via([[0.02 * s, ys[i]], [s * 0.62, mid], [0.02 * s, ys[i + 1]]], 14), 1.06));
      }
      for (const y of [C.top - 0.36, 1.32]) rope(S, onChest(C, Array.from({ length: 21 }, (_, i) => [-1.5 + (3 * i) / 20, y]), 1.06)); // (over and under the tanks)
    },
    pelvis(S, P) {
      const belt = beltLine(0.08, 0.38, 0.22), front = onPelvis(P, [[0.02, 0.1]])[0];
      const ring = onPelvis(P, path(0.02, PI - 0.02, belt, 30)); for (const q of [ring, mirror(ring)]) rope(S, q);
      rope(S, onPelvis(P, Array.from({ length: 12 }, (_, i) => [0.03, 0.08 - i * 0.085])));
      const hips = onPelvis(P, path(0.28, 2.7, legLine(0.12, -0.58, -0.96), 30)); for (const q of [hips, mirror(hips)]) rope(S, q);
      if (front) knot(S, front, 0.055);
    },
    thigh(S, T) { const y = -0.24 * T.len, r = T.rAt(y) + 0.02; for (const k of [0, 1]) S.trim.ring(r, 0.02, { at: [0, y - k * 0.06, 0], c: ROPE }, 40, 6); knot(S, [0, y - 0.03, r + 0.02]); },
    bust(S, B) { rope(S, rimPts(B, 0, PI * 2, 1.01, 48), { r: 0.018 }); },
  },
  mucha: { label: 'nouveau ribbon',
    pelvis(S, P) {
      // one ribbon thrown round: the left crest across the belly, round the right hip and under the right cheek, up over the sacrum
      const st = [[-1.5, 0.42], [-0.7, 0.05], [0.2, -0.3], [1.1, -0.28], [1.9, -0.6], [2.65, -0.92], [3.3, -0.4], [3.9, 0.18]];
      const pts = onPelvis(P, via(st, 60));
      ribbon(S.g, pts, P.nrm, { w: swell(0.15, 0.035), th: 0.012, twist: (u) => 2.4 * PI * u, n: 120 });
      ribbon(S.trim, onPelvis(P, via(st.map(([p, y]) => [p + 0.08, y - 0.12]), 60)), P.nrm, { w: swell(0.04, 0.012), th: 0.008, c: L.trimD, twist: (u) => -1.6 * PI * u, n: 100 });
    },
    bust(S, B) {
      const s = B.s; ribbon(S.g, rimPts(B, s * 0.4, s * 0.4 + s * PI * 2.15, 1.02, 60), faceOut, { w: swell(0.08, 0.02), th: 0.01, twist: (u) => 2 * PI * u, n: 90 });
      ribbon(S.g, strapPts(B, B.rim(s > 0 ? PI - 1.0 : 1.0), B.choker, 0.16), faceOut, { w: taper(0.06, 0.015), th: 0.01, twist: (u) => s * PI * u });
    },
  },
  crisscross: { label: 'crisscross',
    chest(S, C) {
      const o = { w: 0.075, th: 0.012, c: L.trimL, gild: { piece: S.g, r: 0.01 } };
      for (const s of [1, -1]) ribbon(S.trim, onChest(C, via([[s * 0.95, C.under - 0.06], [0, 1.1], [-s * 0.52, 0.62]], 30), 1.055), C.nrm, o);
    },
    pelvis(S, P) {
      const o = { w: 0.07, th: 0.012, c: L.trimL, gild: { piece: S.g, r: 0.01 } };
      lay(S, P, via([[0.5, 0.42], [0.32, -0.1], [0.1, -0.82]], 24), o, S.trim); // (the front panel's edge)
      lay(S, P, path(0.1, 3.05, legLine(0.42), 40), { ...o, w: 0.05 }, S.trim); // (the leg's high cut)
      lay(S, P, via([[0.72, 0.36], [1.9, -0.52]], 18), { ...o, w: 0.05 }, S.trim); lay(S, P, via([[1.85, 0.4], [0.82, -0.42]], 18), { ...o, w: 0.05 }, S.trim); // (the hip's cutout crossed)
    },
    bust(S, B) { plateRim(S, B, 0.024); const s = B.s; ribbon(S.trim, strapPts(B, B.rim(PI / 2 + s * 0.55), B.shoulder), faceOut, { w: 0.06, th: 0.012, c: L.trimL, gild: { piece: S.g, r: 0.009 } }); },
  },
  swag: { label: 'beaded swag',
    pelvis(S, P) {
      const belt = beltLine(-0.05, 0.38, 0.18), jew = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
      lay(S, P, path(0, PI, belt, 36), { w: 0.045, th: 0.012 });
      // beads laid on the body between jewels, each tier sagging lower (pushed out off the surface by the bead)
      const strand = (p0, p1, sag, r) => {
        const q = onPelvis(P, Array.from({ length: 11 }, (_, i) => { const u = i / 10, p = p0 + (p1 - p0) * u; return [p, belt(p) - sag * 4 * u * (1 - u) - 0.04]; }), 0);
        for (const v of q) for (const s of [1, -1]) { const w = [s * v[0], v[1], v[2]], n = P.nrm(w); S.g.ball(r, { at: w.map((c, k) => c + n[k] * (r + 0.006)), c: L.gold }, 8, 6); }
      };
      for (let i = 0; i < jew.length - 1; i++) { strand(jew[i], jew[i + 1], 0.12, 0.022); strand(jew[i], jew[i + 1], 0.26, 0.018); }
      for (const p of jew) for (const q of onPelvis(P, [[p, belt(p)]])) for (const s of [1, -1]) {
        const w = [s * q[0], q[1], q[2]], n = P.nrm(w); S.g.ball(0.05, { at: w.map((c, k) => c + n[k] * 0.03), sc: [1, 1.2, 0.6], c: L.gold }, 12, 8);
        for (let k = 1; k <= 4; k++) S.g.ball(0.02, { at: [w[0] + n[0] * 0.05, w[1] - 0.06 * k - 0.02, w[2] + n[2] * 0.05], c: L.gold }, 8, 6); // (a drop)
      }
    },
    bust(S, B) {
      const s = B.s, pts = rimPts(B, s > 0 ? -2.6 : -0.54, s > 0 ? -0.54 : -2.6, 1.04, 14);
      for (const [k, q] of pts.entries()) S.g.ball(0.022, { at: [q[0], q[1] - 0.04 * Math.sin((PI * k) / 14), q[2] + 0.02], c: L.gold }, 8, 6);
      for (const q of strapPts(B, B.rim(s > 0 ? PI - 0.9 : 0.9), B.choker)) coin(S, q, [0, 0, 1], 0.03);
    },
  },
  obi: { label: 'wide sash',
    chest(S, C) {
      const band = (y) => onChest(C, Array.from({ length: 41 }, (_, i) => [-PI + (2 * PI * i) / 40, y]), 1.06);
      ribbon(S.trim, band(0.86), C.nrm, { w: 0.32, th: 0.016, c: L.trimL, gild: { piece: S.g, r: 0.014 }, n: 80 });
      rope(S, band(0.86).map((q) => q.map((v, k) => (k === 1 ? v : v * 1.012))), { r: 0.016, c: L.gold, piece: S.g, twist: 16 }); // (the cord down its middle)
      const back = C.on(PI, 0.9, 1.1); bow(S, back, C.nrm(back), [0, 1, 0], { size: 0.42, w: 0.17, c: L.trimL, piece: S.trim, tails: 1.2 });
    },
    pelvis(S, P) { lay(S, P, path(0.1, 3.05, legLine(0.36), 40), { w: 0.03, th: 0.01 }); },
    bust(S, B) { plateRim(S, B, 0.026); },
  },
};
