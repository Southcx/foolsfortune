// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S THEATRE, THE BOARDS: a stage's floor boxes (Dovina's `boards` placeholders, stagekit.js COLOR) drawn as a toy
// theatre's stage built from Pip's sewing box, over the same boxes (their colliders untouched):
//   THE TOP      maple planks laid up and down stage, a board 0.32 m wide, its grain, seams and nails painted; Pip's tailor's chalk on
//                the boards where a body is meant to stand (a dash across, an X on the middle board: the stage's spike marks, at each
//                checkpoint and the start, and at each door in the wings), a stray chalk tick here and there
//   THE APRON    each box's camera-facing front: a maple nosing proud of the boards, a walnut fascia, a gold braid under it, then the
//                sewing box's walnut front in raised panels down to a plinth, darkening away from the footlights above it
//   THE SIDES    walnut end grain, as dark
//   FOOTLIGHTS   a row along each front's top: a brass thimble for a cup, a shell (a button's mother-of-pearl) for its hood toward the
//                audience, and the light only as glow: a soft spot over each cup and a fan of warmth thrown back across the boards
//                (the light material's, no lamp: CLAUDE.md, the light budget)
// A box's front that another boards box covers (a ledge raised over a floor) is left out there, so no two fronts fight; a footlight
// is left out where anything of the lane's stands in its place.
//
// Prior art: the raked stage of a Victorian theatre (boards up and down stage, the nosing, the footlight trough and its hoods), Pollock's
// printed stage fronts, the stage manager's spike tape (here Pip's chalk), a Shaker sewing box's raised panels.
//
//   dressBoards(lane, palette)   (lane: theatre.js's; its `solid` and `glow` sheets take what is drawn)   BOARDS_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { box, rgb, uvOf, V, hash, PLANKS, CHALK } from './kit.js';

/** The numbers (m): a plank's width, the apron's courses from the top down, a panel's size, how the front darkens (per m below the top,
 *  to a floor), and the footlights (their spacing, inset from the front, the thimble's radii and height, the shell's radius, the glow's
 *  and the spill's sizes and strengths). */
export const BOARDS_LOOK = {
  plank: 0.32, nosing: { h: 0.09, out: 0.05 }, fascia: { h: 0.34, out: 0.015 }, braid: { h: 0.08, out: 0.03, tile: 1.0 }, plinth: 0.28,
  panel: { w: 2.2, h: 2.4, stile: 0.17, groove: 0.035, bevel: 0.075, raise: 0.014 }, fade: { per: 0.15, floor: 0.34 },
  foot: { every: 1.55, end: 0.6, inset: 0.15, cup: [0.12, 0.1, 0.17], shell: 0.2, glow: [1.05, 0.8, 0.55], core: [0.3, 0.24, 1.15], spill: [1.6, 1.5, 0.2] },
  warm: 0xffc68a,
};
const B = BOARDS_LOOK;

/** The parts of [x0, x1] that no other box of `list` covers (`covers(o)` true): a list of [a, b]. */
export function freeOf(x0, x1, list, covers) {
  let out = [[x0, x1]];
  for (const o of list) {
    if (!covers(o)) continue;
    const next = [];
    for (const [a, b] of out) { if (o.x1 <= a || o.x0 >= b) { next.push([a, b]); continue; } if (o.x0 > a) next.push([a, o.x0]); if (o.x1 < b) next.push([o.x1, b]); }
    out = next.filter(([a, b]) => b - a > 0.02);
  }
  return out;
}

/** The top: planks across each free stretch, chalk where a spike mark falls. */
function planks(lane, b, P) {
  const S = lane.solid, y = b.y1, free = freeOf(b.x0, b.x1, lane.boards, (o) => o !== b && o.y0 < y - 0.01 && o.y1 > y + 0.01);
  const spikes = lane.spikes.filter(([x, sy]) => x > b.x0 && x < b.x1 && Math.abs(lane.Y(sy) - y) < 0.3).map(([x]) => lane.X(x));
  for (const [xa, xb] of free) {
    const i0 = Math.floor((xa - lane.X(0)) / B.plank), i1 = Math.ceil((xb - lane.X(0)) / B.plank);
    for (let i = i0; i < i1; i++) {
      const pa = Math.max(xa, lane.X(0) + i * B.plank), pb = Math.min(xb, lane.X(0) + (i + 1) * B.plank); if (pb - pa < 0.01) continue;
      const mid = (pa + pb) / 2, near = spikes.find((x) => Math.abs(x - mid) < B.plank * 1.6);
      let k = near != null ? (Math.abs(near - mid) < B.plank / 2 ? CHALK.spike : CHALK.dash) : Math.floor(hash(i * 1.37 + lane.k * 9.1) * 6);
      if (k === 5 && hash(i * 0.71) > 0.35) k = 0;
      const tone = 0.9 + 0.12 * hash(i * 2.9 + 1), f0 = (pa - (lane.X(0) + i * B.plank)) / B.plank, f1 = (pb - (lane.X(0) + i * B.plank)) / B.plank;
      const front = rgb(0xffffff, tone * 1.04), back = rgb(0xffffff, tone * 0.82);
      S.quad(V(pa, y, b.z1), V(pb, y, b.z1), V(pb, y, b.z0), V(pa, y, b.z0), [front, front, back, back], uvOf('planks', (k + f0) / PLANKS, 0, (k + f1) / PLANKS, 1));
    }
  }
}

/** A strip of a region tiled along x every `tile` m, its colour faded by height. */
function strip(S, xa, xb, ya, yb, z, region, tile, tint, fade) {
  for (let x = xa; x < xb - 1e-3; x += tile) {
    const xe = Math.min(xb, x + tile), lo = rgb(tint, fade(ya)), hi = rgb(tint, fade(yb));
    S.quad(V(x, ya, z), V(xe, ya, z), V(xe, yb, z), V(x, yb, z), [lo, lo, hi, hi], uvOf(region, 0, 0, (xe - x) / tile, 1));
  }
}

/** One raised panel in its cell of the frame: the groove round it, its bevels (lit from above and the left) and its field. */
function panel(S, x0, x1, y0, y1, z, P, fade) {
  const Pn = B.panel, g = Pn.groove, bv = Pn.bevel, zr = z + Pn.raise, zg = z + 0.003;
  const ink = (y) => rgb(P.walnut, 0.32 * fade(y));
  S.quad(V(x0 - g, y0 - g, zg), V(x1 + g, y0 - g, zg), V(x1 + g, y0, zg), V(x0 - g, y0, zg), ink(y0));
  S.quad(V(x0 - g, y1, zg), V(x1 + g, y1, zg), V(x1 + g, y1 + g, zg), V(x0 - g, y1 + g, zg), ink(y1));
  S.quad(V(x0 - g, y0, zg), V(x0, y0, zg), V(x0, y1, zg), V(x0 - g, y1, zg), [ink(y0), ink(y0), ink(y1), ink(y1)]);
  S.quad(V(x1, y0, zg), V(x1 + g, y0, zg), V(x1 + g, y1, zg), V(x1, y1, zg), [ink(y0), ink(y0), ink(y1), ink(y1)]);
  const a0 = V(x0, y0, z + 0.004), a1 = V(x1, y0, z + 0.004), a2 = V(x1, y1, z + 0.004), a3 = V(x0, y1, z + 0.004);
  const i0 = V(x0 + bv, y0 + bv, zr), i1 = V(x1 - bv, y0 + bv, zr), i2 = V(x1 - bv, y1 - bv, zr), i3 = V(x0 + bv, y1 - bv, zr);
  const c = (k, y) => rgb(P.walnut, k * fade(y));
  S.quad(a0, a1, i1, i0, c(0.55, y0));
  S.quad(i3, i2, a2, a3, c(1.6, y1));
  S.quad(a0, i0, i3, a3, [c(1.25, y0), c(1.25, y0), c(1.25, y1), c(1.25, y1)]);
  S.quad(i1, a1, a2, i2, [c(0.7, y0), c(0.7, y0), c(0.7, y1), c(0.7, y1)]);
  const lo = rgb(0xffffff, 1.08 * fade(i0.y)), hi = rgb(0xffffff, 1.08 * fade(i3.y));
  S.quad(i0, i1, i2, i3, [lo, lo, hi, hi], uvOf('walnut', 0, 0, Math.min(1, (x1 - x0) / 2.4), Math.min(1, (y1 - y0) / 1.2)));
}

/** The apron: the front of a box over each free stretch (its nosing, fascia, braid, panels and plinth), and its sides. */
function apron(lane, b, P, zf) {
  const S = lane.solid, fade = (y) => Math.max(B.fade.floor, 1 - B.fade.per * (b.y1 - y));
  const free = freeOf(b.x0, b.x1, lane.boards, (o) => o !== b && o.y0 <= b.y0 + 0.01 && o.y1 >= b.y1 - 0.01 && o.z1 >= b.z1 - 0.01);
  const n = B.nosing, f = B.fascia, br = B.braid;
  const yN = b.y1 - n.h, yF = yN - f.h, yB = yF - br.h, yP = b.y0 + B.plinth;
  for (const [xa, xb] of free) {
    box(S, xa, xb, yN, b.y1, b.z1 - 0.001, zf + n.out, (k) => rgb(P.maple, k === 't' ? 1.0 : k === 'u' ? 0.3 : 0.86), 'ftu');
    strip(S, xa, xb, yF, yN, zf + f.out, 'walnut', 2.4, 0xffffff, (y) => 0.82 * fade(y));
    strip(S, xa, xb, yB, yF, zf + br.out, 'braid', br.tile, 0xffffff, fade);
    S.quad(V(xa, yF, zf + br.out), V(xb, yF, zf + br.out), V(xb, yF, zf), V(xa, yF, zf), rgb(P.gold, 0.7 * fade(yF)));
    box(S, xa, xb, b.y0, yP, zf, zf + 0.02, (k) => rgb(P.walnut, (k === 't' ? 0.7 : 0.55) * fade(yP)), 'ft');
    // the frame (walnut, dark) and its panels, a row and a column a cell
    const H = yB - yP, W = xb - xa; if (H < 0.4) continue;
    const rows = Math.max(1, Math.round(H / B.panel.h)), cols = Math.max(1, Math.round(W / B.panel.w)), ph = H / rows, pw = W / cols, st = B.panel.stile;
    for (let r = 0; r < rows; r++) {
      const cy0 = yP + r * ph, cy1 = cy0 + ph, lo = rgb(P.walnut, 0.62 * fade(cy0)), hi = rgb(P.walnut, 0.62 * fade(cy1));
      S.quad(V(xa, cy0, zf), V(xb, cy0, zf), V(xb, cy1, zf), V(xa, cy1, zf), [lo, lo, hi, hi]);
      if (ph - 2 * st < 0.3) continue;
      for (let c = 0; c < cols; c++) {
        const cx0 = xa + c * pw, cx1 = cx0 + pw; if (pw - 2 * st < 0.3) continue;
        panel(S, cx0 + (c === 0 ? st : st / 2), cx1 - (c === cols - 1 ? st : st / 2), cy0 + (r === 0 ? st * 0.6 : st / 2), cy1 - (r === rows - 1 ? st * 0.6 : st / 2), zf, P, fade);
      }
    }
    // the keyline down each end of the stretch: the printed edge of a cut-out
    for (const x of [xa, xb]) { const s = x === xa ? 1 : -1, ink = rgb(P.ink, 0.9); S.quad(V(Math.min(x, x + s * 0.05), b.y0, zf + 0.025), V(Math.max(x, x + s * 0.05), b.y0, zf + 0.025), V(Math.max(x, x + s * 0.05), yN, zf + 0.025), V(Math.min(x, x + s * 0.05), yN, zf + 0.025), ink); }
  }
  const lo = rgb(P.walnut, 0.5 * fade(b.y0)), hi = rgb(P.walnut, 0.5 * fade(b.y1));
  S.quad(V(b.x0, b.y0, b.z0), V(b.x0, b.y0, b.z1), V(b.x0, b.y1, b.z1), V(b.x0, b.y1, b.z0), [lo, lo, hi, hi]);
  S.quad(V(b.x1, b.y0, b.z1), V(b.x1, b.y0, b.z0), V(b.x1, b.y1, b.z0), V(b.x1, b.y1, b.z1), [lo, lo, hi, hi]);
}

/** The shell a footlight hides its flame behind: a scallop of ribs fanned from its hinge, leaning back from the audience. */
function shell(S, x, y, z, P) {
  const r = B.foot.shell, ribs = 7, lean = 0.32, pearl = rgb(P.linen, 1.02), rose = rgb(P.rose, 1.25), back = rgb(P.linen, 0.55);
  const at = (a, k) => V(x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * Math.cos(lean), z - Math.sin(a) * r * k * Math.sin(lean));
  const hinge = V(x, y, z);
  for (let i = 0; i < ribs; i++) {
    const a0 = (i / ribs) * Math.PI, a1 = ((i + 1) / ribs) * Math.PI, am = (a0 + a1) / 2, col = i % 2 ? pearl : rose;
    const p0 = at(a0, 1), p1 = at(a1, 1), pm = at(am, 1.08);
    S.tri(hinge, p0, pm, col, col, rgb(P.linen, 1.1)); S.tri(hinge, pm, p1, col, rgb(P.linen, 1.1), col);
    S.tri(hinge, pm, p0, back); S.tri(hinge, p1, pm, back);
  }
}

/** The footlights along a box's front: the cups, the shells, and their light as glow. */
function footlights(lane, b, P, zf) {
  const F = B.foot, S = lane.solid, G = lane.glow, y = b.y1, zc = zf - F.inset, warm = B.warm;
  const free = freeOf(b.x0, b.x1, lane.boards, (o) => o !== b && o.y0 <= b.y0 + 0.01 && o.y1 >= b.y1 - 0.01 && o.z1 >= b.z1 - 0.01);
  for (const [xa, xb] of free) {
    const span = xb - xa - 2 * F.end; if (span < 0) continue;
    const n = Math.floor(span / F.every) + 1, x0 = (xa + xb) / 2 - ((n - 1) * F.every) / 2;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * F.every;
      if (lane.occupied(V(x, y + 0.12, zc), b) || lane.occupied(V(x, y + 0.12, zf - 0.02), b)) continue;
      const [r1, r0, h] = F.cup, cup = new THREE.CylinderGeometry(r1, r0, h, 8, 1, true).translate(x, y + h / 2, zc);
      S.add(cup, (p, nm) => rgb(P.brass, 0.62 + 0.38 * Math.max(0, nm.z) + 0.1 * (p.y - y) / h)); cup.dispose();
      const socket = new THREE.CircleGeometry(r1 * 0.92, 8).rotateX(-Math.PI / 2).translate(x, y + h - 0.03, zc); S.add(socket, rgb(P.ink, 0.8)); socket.dispose();
      shell(S, x, y + 0.01, zc + r0 + 0.035, P);
      const [gw, gh, gk] = F.glow, [cw, ch, ck] = F.core, [sw, sd, sk] = F.spill;
      G.quad(V(x - gw / 2, y + h - gh * 0.3, zc - 0.03), V(x + gw / 2, y + h - gh * 0.3, zc - 0.03), V(x + gw / 2, y + h + gh * 0.7, zc - 0.03), V(x - gw / 2, y + h + gh * 0.7, zc - 0.03), rgb(warm, gk), [0, 0, 1, 1]);
      G.quad(V(x - cw / 2, y + h - ch * 0.4, zc - 0.02), V(x + cw / 2, y + h - ch * 0.4, zc - 0.02), V(x + cw / 2, y + h + ch * 0.6, zc - 0.02), V(x - cw / 2, y + h + ch * 0.6, zc - 0.02), rgb(0xfff1d8, ck), [0, 0, 1, 1]);
      G.quad(V(x - sw / 2, y + 0.006, zc + 0.1), V(x + sw / 2, y + 0.006, zc + 0.1), V(x + sw / 2, y + 0.006, zc + 0.1 - sd), V(x - sw / 2, y + 0.006, zc + 0.1 - sd), rgb(warm, sk), [0, 0, 1, 1]);
    }
  }
}

/** Every boards box of the lane dressed: the top, the apron, the sides and the footlights. Fronts are nudged forward a hair by height
 *  (a higher ledge's front before a lower floor's), so coplanar fronts never fight. */
export function dressBoards(lane, P) {
  const order = [...lane.boards].sort((a, b) => a.y1 - b.y1);
  for (const b of lane.boards) {
    const zf = b.z1 + 0.003 * order.indexOf(b);
    planks(lane, b, P);
    apron(lane, b, P, zf);
    footlights(lane, b, P, zf);
  }
}
