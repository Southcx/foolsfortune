// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S THEATRE, THE WING FLATS: Dovina's `wing` placeholders (stagekit.js COLOR) and her `mark` blast lines drawn as the
// toy theatre's standing pieces, over the same boxes (their colliders untouched):
//   A STAGE'S END     three flats standing in a walnut groove, staggered in depth as a toy theatre's wings are: downstage a velvet
//                     leg (gold braid down its edge), then burlap cut with pinking shears, then linen with a running stitch in mustard
//                     thread; each a cut-out with its card edge and its keyline, its inner edge never past the end's face, so the
//                     perspective fans them open from the stalls
//   THE WALL RUN      the Run's flat behind the plane is the painted flats' (flats.js: stacked bales); its placeholder hidden here
//   THE FLY BEAM      the wings' beam over the backstage a walnut batten (the fly lines hang from it: theatre/backstage.js)
//   THE BLAST LINES   the Brawl's two out-lines, Pip's tape measure pinned down the back flat
//
// Prior art: Pollock's wing pieces in their grooves (each wing a cut-out, the grooves in the stage floor), a flat's construction
// (canvas on a timber frame, toggled), pinking shears' zigzag, the stage manager's tape lines on the floor.
//
//   dressWingFlats(lane, palette)   WING_LOOK
// ---------------------------------------------------------------------------------------
import { box, rgb, uvOf, V } from './kit.js';

/** The numbers (m): each end flat's depth off the plane, its width out from the end's face, its stock and its tile; the pinking's
 *  teeth; the blast tape's width and its tile. */
export const WING_LOOK = {
  thick: 0.06, keyline: 0.06, foot: -6,
  ends: [
    { dz: 1.3, out: 7, stock: 'velvet', tile: 4, col: 'velvet', k: [1.1, 0.42] },
    { dz: 0.1, out: 8, stock: 'burlap', tile: 1.6, col: 0xffffff, k: [0.95, 0.5], pinked: 0.17 },
    { dz: -1.1, out: 9, stock: 'linen', tile: 1.6, col: 0xffffff, k: [0.9, 0.45], stitch: 0.22 },
  ],
  teeth: 0.32, groove: { w: 0.55, h: 0.11 },
  tape: { w: 0.34, tile: 2, tack: 3 },
};
const W = WING_LOOK;

/** A rectangle of a tiled region facing +z, columns `tile` wide from x `from` outward by `s`, darkening upward from `k[0]` to `k[1]`. */
function tiled(S, xFrom, xTo, y0, y1, z, region, tile, tint, k) {
  const a = Math.min(xFrom, xTo), b = Math.max(xFrom, xTo), lo = rgb(tint, k[0]), hi = rgb(tint, k[1]);
  const rows = Math.max(1, Math.ceil((y1 - y0) / 4));
  for (let r = 0; r < rows; r++) {
    const ya = y0 + ((y1 - y0) * r) / rows, yb = y0 + ((y1 - y0) * (r + 1)) / rows, ca = mix(lo, hi, (ya - y0) / (y1 - y0)), cb = mix(lo, hi, (yb - y0) / (y1 - y0));
    for (let x = a; x < b - 1e-3; x += tile) {
      const xe = Math.min(b, x + tile), vr = region === 'velvet' ? 1 : Math.min(1, (yb - ya) / tile);
      S.quad(V(x, ya, z), V(xe, ya, z), V(xe, yb, z), V(x, yb, z), [ca, ca, cb, cb], uvOf(region, 0, 0, (xe - x) / tile, vr));
    }
  }
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** A stage's end: its three flats, out from the end's inner face `xi` (`s` +1 the stage lies to +x), and the groove they stand in. */
function stageEnd(lane, P, b, s) {
  const S = lane.solid, xi = s > 0 ? b.x1 : b.x0, yt = lane.clear + 4, t = W.thick, edge = rgb(P.linen, 0.92), ink = rgb(P.ink);
  const top = lane.topAt(xi - s * 0.3);
  for (const F of W.ends) {
    // a hard flat stands in its groove on the boards; the velvet leg falls past the stage's edge as a curtain does (and where no
    // boards are under the end, every flat hangs to the end's foot)
    const yb = F.stock === 'velvet' || top == null ? lane.Y(W.foot) : top + 0.02;
    const z = lane.Z(F.dz), xo = xi - s * F.out, inner = F.pinked ? xi - s * F.pinked : xi;
    tiled(S, inner, xo, yb, yt, z + t / 2, F.stock, F.tile, F.col === 'velvet' ? P.velvet : F.col, F.k);
    // the card's inner edge, and the keyline behind the whole inner side
    if (!F.pinked) S.quad(V(inner, yb, z + (s * t) / 2), V(inner, yb, z - (s * t) / 2), V(inner, yt, z - (s * t) / 2), V(inner, yt, z + (s * t) / 2), edge);
    const ka = Math.min(xi + s * W.keyline, xi - s * 0.3), kb = Math.max(xi + s * W.keyline, xi - s * 0.3);
    S.quad(V(ka, yb, z - t / 2 - 0.01), V(kb, yb, z - t / 2 - 0.01), V(kb, yt, z - t / 2 - 0.01), V(ka, yt, z - t / 2 - 0.01), ink);
    if (F.stock === 'velvet') {
      // gold braid down the leg's inner edge, its twist running up the strip (the region turned: u along y)
      const bx0 = Math.min(xi, xi - s * 0.13), bx1 = Math.max(xi, xi - s * 0.13), zb = z + t / 2 + 0.01;
      for (let y = yb; y < yt - 1e-3; y += 1) { const ye = Math.min(yt, y + 1); S.quad(V(bx1, y, zb), V(bx1, ye, zb), V(bx0, ye, zb), V(bx0, y, zb), rgb(0xffffff, 1.0), uvOf('braid', 0, 0, ye - y, 1)); }
    }
    if (F.pinked) {
      // pinking shears' teeth along the inner edge, tips at the end's face
      const n = Math.ceil((yt - yb) / W.teeth), bu = uvOf('burlap', 0.2, 0.2, 0.3, 0.3);
      for (let i = 0; i < n; i++) {
        const y0 = yb + i * W.teeth, y1 = Math.min(yt, y0 + W.teeth), ym = (y0 + y1) / 2, c = mix(rgb(0xffffff, F.k[0]), rgb(0xffffff, F.k[1]), (ym - yb) / (yt - yb));
        const a = V(inner, y0, z + t / 2), tip = V(xi, ym, z + t / 2), c2 = V(inner, y1, z + t / 2);
        if (s > 0) S.tri(a, tip, c2, c, c, c, [bu[0], bu[1]], [bu[2], bu[1]], [bu[2], bu[3]]); else S.tri(a, c2, tip, c, c, c, [bu[0], bu[1]], [bu[2], bu[3]], [bu[2], bu[1]]);
        const e0 = V(inner, y0, z - t / 2), et = V(xi, ym, z - t / 2), e1 = V(inner, y1, z - t / 2);
        if (s > 0) { S.quad(e0, et, V(tip.x, tip.y, tip.z), V(a.x, a.y, a.z), edge); S.quad(et, e1, V(c2.x, c2.y, c2.z), V(tip.x, tip.y, tip.z), edge); } else { S.quad(et, e0, V(a.x, a.y, a.z), V(tip.x, tip.y, tip.z), edge); S.quad(e1, et, V(tip.x, tip.y, tip.z), V(c2.x, c2.y, c2.z), edge); }
      }
    }
    if (F.stitch) {
      // a running stitch in mustard thread down the linen's inner edge
      const sx = xi - s * F.stitch, mustard = rgb(P.mustard, 1.0);
      for (let y = yb + 0.1; y < yt - 0.3; y += 0.38) S.quad(V(sx - 0.03, y, z + t / 2 + 0.006), V(sx + 0.03, y, z + t / 2 + 0.006), V(sx + 0.03, y + 0.24, z + t / 2 + 0.006), V(sx - 0.03, y + 0.24, z + t / 2 + 0.006), mustard);
    }
  }
  // the groove the flats stand in, on the boards at the end (if there are boards there)
  if (top != null) {
    const g = W.groove, gx0 = Math.min(xi, xi - s * g.w), gx1 = Math.max(xi, xi - s * g.w);
    box(S, gx0, gx1, top, top + g.h, lane.Z(-1.5), lane.Z(1.5), (f) => rgb(P.walnut, f === 't' ? 1.0 : 0.7), 'ftlr');
    for (const F of W.ends) S.quad(V(gx0 + 0.04, top + g.h + 0.002, lane.Z(F.dz) + 0.05), V(gx1 - 0.04, top + g.h + 0.002, lane.Z(F.dz) + 0.05), V(gx1 - 0.04, top + g.h + 0.002, lane.Z(F.dz) - 0.05), V(gx0 + 0.04, top + g.h + 0.002, lane.Z(F.dz) - 0.05), rgb(P.ink, 0.8));
  }
}
/** The wings' fly beam: a walnut batten, its underside dark. */
function flyBeam(lane, P, b) {
  const S = lane.solid;
  for (let x = b.x0; x < b.x1 - 1e-3; x += 2.4) { const xe = Math.min(b.x1, x + 2.4); S.quad(V(x, b.y0, b.z1), V(xe, b.y0, b.z1), V(xe, b.y1, b.z1), V(x, b.y1, b.z1), rgb(0xffffff, 0.7), uvOf('walnut', 0, 0, (xe - x) / 2.4, 1)); }
  box(S, b.x0, b.x1, b.y0, b.y1, b.z0, b.z1, (f) => rgb(P.walnut, f === 'u' ? 0.35 : 0.6), 'ulr');
}

/** A blast line: the tape measure run up the back flat, brass tacks down it. */
function blastTape(lane, P, b) {
  const S = lane.solid, T = W.tape, cx = (b.x0 + b.x1) / 2, x0 = cx - T.w / 2, x1 = cx + T.w / 2, z = b.z1 + 0.004;
  for (let y = b.y0; y < b.y1 - 1e-3; y += T.tile) {
    const ye = Math.min(b.y1, y + T.tile), uv = uvOf('tape', 0, 0, (ye - y) / T.tile, 1);
    S.quad(V(x1, y, z), V(x1, ye, z), V(x0, ye, z), V(x0, y, z), rgb(0xffffff, 0.95), uv);
  }
  S.quad(V(x0 - 0.04, b.y0, z - 0.002), V(x1 + 0.04, b.y0, z - 0.002), V(x1 + 0.04, b.y1, z - 0.002), V(x0 - 0.04, b.y1, z - 0.002), rgb(P.ink));
  for (let y = b.y0 + T.tack / 2; y < b.y1; y += T.tack) box(S, cx - 0.05, cx + 0.05, y - 0.05, y + 0.05, z, z + 0.025, rgb(P.brass, 1.1), 'ft');
}

/** The lane's wing and mark placeholders dressed: each stage end, the fly beam, the blast lines (the wall run's flat is flats.js'). */
export function dressWingFlats(lane, P) {
  const mid = lane.X(lane.len / 2);
  for (const b of lane.wing) {
    const w = b.x1 - b.x0, h = b.y1 - b.y0, d = b.z1 - b.z0;
    if (d < 0.5) continue;
    if (h < 2 && w > 4) flyBeam(lane, P, b);
    else stageEnd(lane, P, b, (b.x0 + b.x1) / 2 < mid ? 1 : -1);
  }
  for (const b of lane.marks) blastTape(lane, P, b);
}
