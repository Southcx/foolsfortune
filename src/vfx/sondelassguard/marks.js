// ---------------------------------------------------------------------------------------
// THE SONDELASS'S GUARD: its marks, drawn each frame it shows (part of vfx/sondelassguard.js). The board v9 mock's drawing (r9-sondelass:
// tsuba, feelRing, ping, blade, notch, hookShaft, grapnel) ported to quads of the guard's batch (sondelassguard/batch.js) in the guard's
// own dots, y up, its heart at the origin. Three batches: `under` (additive, beneath the made parts: the halo), `marks` (the keylined
// marks over them) and `over` (additive: glows, glints, flashes). It reads the state the guard keeps (sondelassguard.js) and writes nothing
// back. No words here: the plate and the count are sondelassguard/plate.js.
//
//   THE GUARD   the halo; the film ring inside the rim; the three windows (a blade slit, a ring of beads, a hook claw) at 9.5 dots, the
//               one at the link lit with the film; the boss at the heart (out of the rod form); the click glint after a change
//   THE RING    (the rod) the hoop, drained by a sounding and re-inked clockwise from the pawl over the 3 real s cooldown, a glint and a
//               tick when whole; the seven beads in display order (a dark seat for a feeling not yet awakened, passed over with a shiver);
//               the pawl, lifted while MMB holds the ring open; the sounding's ripple in the feeling's colour and the echoes closing on
//               the ring as pointers at each lit fish's bearing; the lure at the heart, filled with the feeling
//   THE BLADE   (the cutlass) the string as notches on the temper line, the next gold, the struck lit, a blow's light running notch to
//               notch; the paid cut's window as the oil film on the edge with a glint running it; the pause string as a second temper
//               line branching toward the back
//   THE HOOK    the reach ruler, the marker where the aim would bite (a catch's brackets closing), the rope straight and keylined, the
//               bite's flash, the grapnel's glint, the catch's pot
//
// Prior art: the mock (Calissa's board v9); God Hand's Combo Tree and Devil May Cry's pause combos (the notches and the second line);
// Guilty Gear's Roman Cancel flash (the paid cut's film); a combination lock's dial and a revolver's detent (the ring's notch and
// overshoot); the PPI sonar scope (the ripple out, the echo back as a blip that fades); a surveyor's tape (the ruler).
//
//   drawGuard(X)  drawRing(X)  drawRod(X)  drawBlade(X)  drawHook(X)   X: { b: { under, marks, over }, C (the atlas's cells), t, anchor,
//   ang, S, R, B, H, F }   film(s, out) -> out (the labradorite film's colour at s, sRGB 0..1)   rgbOf(hex, out)   shade(c, f, out)
// ---------------------------------------------------------------------------------------
import { SABRE } from './forms.js';

const TAU = Math.PI * 2;
const C01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const sm = (t) => { t = C01(t); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const FILM = [[76, 15, 179], [10, 140, 191], [242, 184, 46], [217, 26, 128]];
/** The labradorite film's colour at s (sRGB, 0..1), as the link and the tube walk it. */
export function film(s, out) {
  s = (((s % 1) + 1) % 1) * 4; const i = Math.floor(s), f = s - i, A = FILM[i], B = FILM[(i + 1) % 4], m = f * f * (3 - 2 * f);
  out[0] = (A[0] + (B[0] - A[0]) * m) / 255; out[1] = (A[1] + (B[1] - A[1]) * m) / 255; out[2] = (A[2] + (B[2] - A[2]) * m) / 255; return out;
}
export const rgbOf = (hex, out = [0, 0, 0]) => { out[0] = ((hex >> 16) & 255) / 255; out[1] = ((hex >> 8) & 255) / 255; out[2] = (hex & 255) / 255; return out; };
export const shade = (c, f, out) => { for (let k = 0; k < 3; k++) out[k] = f > 0 ? c[k] + (1 - c[k]) * f : c[k] * (1 + f); return out; };

const KEY = rgbOf(0x0b0710), BRASS = rgbOf(0xd6b064), BRASS_HI = rgbOf(0xf3d98f), BRASS_LO = rgbOf(0xd9b468), HOOP = rgbOf(0x3a3046);
const STRUCK = rgbOf(0xfff2c8), NEXT = rgbOf(0xf2c35a), AHEAD = rgbOf(0xb9c3cc), GOLD_GLOW = rgbOf(0xffe3a0), ROPE = rgbOf(0xe8cf9a), PALE = rgbOf(0xece6ff), EMBER = rgbOf(0xff8a3a), GREY = rgbOf(0x9a90a8);
const _f = [0, 0, 0], _g = [0, 0, 0], _p = [0, 0];
/** A point of a form's axis (u along it, v off it, dots) in the guard's dots. */
const ax = (X, u, v, out = _p) => { const c = X.ca, s = X.sa; out[0] = c * u - s * v; out[1] = s * u + c * v; return out; };

// ---------------------------------------------------------------- the guard
export function drawGuard(X) {
  const { b, C, t, S, anchor } = X;
  film(t * 0.05 + 0.1, _f); b.under.quad(0, 0, 30, 30, 0, C.dot, _f[0], _f[1], _f[2], 0.2);
  for (let i = 0; i < 40; i++) { const a0 = (i / 40) * TAU, a1 = ((i + 1) / 40) * TAU; film(t * 0.06 + i / 40, _f); b.marks.seg(Math.cos(a0) * 12.7, Math.sin(a0) * 12.7, Math.cos(a1) * 12.7, Math.sin(a1) * 12.7, 0.5, _f[0], _f[1], _f[2], 0.75); }
  for (let j = 0; j < 3; j++) {
    const a = anchor + (j * TAU) / 3 - S.rot, da = Math.abs(Math.atan2(Math.sin(a - anchor), Math.cos(a - anchor))), act = 1 - C01(da / (TAU / 6));
    const x = Math.cos(a) * 9.5, y = Math.sin(a) * 9.5, r = a - Math.PI / 2;
    b.marks.quad(x, y, 10, 10, r, C.win[j], 1, 1, 1, 1);
    if (act > 0.02) {
      film(t * 0.08 + j * 0.3, _f); b.marks.quad(x, y, 10, 10, r, C.winFill[j], _f[0], _f[1], _f[2], act);
      b.over.quad(x, y, 10, 10, r, C.winFill[j], 1, 1, 1, 0.35 * act); b.over.quad(x, y, 6, 6, 0, C.dot, _f[0], _f[1], _f[2], 0.4 * act);
    }
  }
  if (S.ring < 0.99) { // (the boss: a brass bead, a dark well, the film at its heart)
    const k = 1 - sm(S.ring); b.marks.quad(0, 0, 4, 4, 0, C.disc, 0.71, 0.54, 0.24, k); b.marks.quad(0, 0, 2.1, 2.1, 0, C.disc, 0.03, 0.02, 0.04, k);
    film(t * 0.1, _f); b.marks.quad(0, 0, 1.15, 1.15, 0, C.disc, _f[0], _f[1], _f[2], 0.9 * k);
  }
  if (S.click >= 0 && S.click < 0.25) { const q = S.click / 0.25, a = anchor - q * TAU; b.over.arc(0, 0, 14.4, a + 0.6, a, 1.2, 6, 1, 0.97, 0.88, 1 - q * 0.6); } // (a glint runs the rim once, clockwise)
}

// ---------------------------------------------------------------- the ring of the seven (the rod)
const ORDER = [0, 1, 2, 3, 4, 5, 6];
export const hoopR = (S, R) => lerp(13.5, 20.5, sm(S.ring)) + 4.5 * R.open;
export const pawlR = (S, R) => hoopR(S, R) + 7.6 + 2.2 * R.open;
export function drawRing(X) {
  const { b, C, t, S, R, anchor } = X, G = sm(S.ring), rr = hoopR(S, R), op = R.open;
  if (G <= 0.002) return;
  // the hoop: drained dark after a sounding, re-inked clockwise from the pawl over the cooldown; whole, it is brass
  b.marks.arc(0, 0, rr, 0, TAU, 2.2, 48, KEY[0], KEY[1], KEY[2], G); b.marks.arc(0, 0, rr, 0, TAU, 1, 48, HOOP[0], HOOP[1], HOOP[2], G);
  const inkA = R.cool >= 1 ? TAU : TAU * R.cool;
  if (inkA > 0.001) {
    const n = Math.max(2, Math.ceil((48 * inkA) / TAU));
    b.marks.arc(0, 0, rr, anchor, anchor - inkA, 1.1, n, BRASS[0], BRASS[1], BRASS[2], G);
    if (R.cool < 1) {
      for (let i = 0; i < n; i++) { const a0 = anchor - (inkA * i) / n, a1 = anchor - (inkA * (i + 1)) / n; film(i / n + t * 0.1, _f); b.over.seg(Math.cos(a0) * rr, Math.sin(a0) * rr, Math.cos(a1) * rr, Math.sin(a1) * rr, 0.6, _f[0], _f[1], _f[2], G); }
      const ha = anchor - inkA; b.over.quad(Math.cos(ha) * rr, Math.sin(ha) * rr, 2.6, 2.6, 0, C.dot, 1, 0.96, 0.85, G);
    }
  }
  if (R.readyAge >= 0 && R.readyAge < 0.4) { // (whole again: a glint runs the hoop once, a tick sparkles at the pawl)
    const p = R.readyAge / 0.4, a = anchor - p * TAU; b.over.arc(0, 0, rr, a + 0.7, a, 1.8, 6, 1, 0.98, 0.92, G * (1 - p * 0.7));
    const q = C01(R.readyAge / 0.25), s = 4.5 * (1 - q) + 1; b.over.quad(Math.cos(anchor) * (rr + 3.5), Math.sin(anchor) * (rr + 3.5), s * 1.1, s * 1.1, 0, C.star, 1, 0.98, 0.9, G * (1 - q));
  }
  // the sounding: two fronts out in the feeling's colour, the echoes closing on the ring, then their pointers (held the sounding's light)
  const col = R.lure, br = rr + 8;
  if (R.pAge >= 0 && S.ring > 0.5) {
    for (const off of [0, 0.08]) {
      const q = (R.pAge - off) / 0.9; if (q < 0 || q > 1) continue;
      const r = lerp(6, 64, 1 - Math.pow(1 - q, 3)), al = Math.pow(1 - q, 1.3);
      shade(col, 0.2, _g); b.marks.arc(0, 0, r, 0, TAU, 1.3, 48, _g[0], _g[1], _g[2], al * 0.9 * G);
      film(t * 0.3 + q, _f); b.over.arc(0, 0, r + 1.3, 0, TAU, 0.5, 48, _f[0], _f[1], _f[2], al * 0.8 * G);
    }
    shade(col, 0.35, _g);
    for (let i = 0; i < R.echoN; i++) {
      const e = R.echoes[i], ea = R.pAge - e.at; if (ea < 0 || ea >= 0.35) continue;
      const r = lerp(62, br, sm(ea / 0.35)), bb = Math.PI / 2 - e.b;
      b.marks.arc(0, 0, r, bb - 0.22, bb + 0.22, 1.1, 6, _g[0], _g[1], _g[2], 0.95 * G);
    }
  }
  shade(col, 0.45, _g);
  for (let i = 0; i < R.echoN; i++) {
    const e = R.echoes[i], ea = R.pAge - e.at - 0.35; if (ea < 0 || ea > 2) continue;
    const bb = Math.PI / 2 - e.b, al = 1 - sm(C01((ea - 1.6) / 0.4));
    b.marks.quad(Math.cos(bb) * br, Math.sin(bb) * br, 10, 10, bb, C.echo, _g[0], _g[1], _g[2], al * G);
  }
  // the beads: the chosen at the pawl, the rest round in display order; nearer ones drawn last
  const rf = R.pAge >= 0 && R.pAge < 0.9 ? lerp(6, 64, 1 - Math.pow(1 - R.pAge / 0.9, 3)) : -99;
  for (let i = 1; i < 7; i++) { const v = ORDER[i]; let j = i - 1; while (j >= 0 && Math.abs(ORDER[j] - R.selF) < Math.abs(v - R.selF)) { ORDER[j + 1] = ORDER[j]; j--; } ORDER[j + 1] = v; }
  for (let k = 0; k < 7; k++) {
    const i = ORDER[k], a = anchor - ((i - R.selF) * TAU) / 7, lk = !R.known[i];
    let rad = rr + 0.9 * Math.exp(-((rf - rr) ** 2) / 6);
    if (R.shakeI === i) rad += Math.sin(t * 95) * 0.6 * R.shakeAmp;
    const near = 1 - C01(Math.abs(i - R.selF)), r = 4.2 + (lk ? 0 : 1.2 * sm(near)), x = Math.cos(a) * rad, y = Math.sin(a) * rad;
    if (lk) b.marks.quad(x, y, 2 * r, 2 * r, 0, C.seat, 1, 1, 1, G);
    else {
      b.marks.quad(x, y, 2 * r, 2 * r, 0, C.bead[i], 1, 1, 1, G);
      if (near > 0.5) { film(t * 0.15, _f); b.over.quad(x, y, 2 * r, 2 * r, 0, C.beadLine[i], _f[0], _f[1], _f[2], 0.95 * G); }
    }
  }
  // the pawl: a brass tooth where the link comes in; held open, it lifts off the hoop
  const pr = rr + 5.3 + 2.2 * op + 1.7, pc = op > 0.5 ? BRASS_HI : BRASS_LO;
  b.marks.quad(Math.cos(anchor) * pr, Math.sin(anchor) * pr, 10, 10, anchor, C.pawl, pc[0], pc[1], pc[2], G);
  if (op > 0.02) { const q = pr - 2.3, ca = Math.cos(anchor), sa = Math.sin(anchor); film(t * 0.3, _f); b.over.seg(ca * q + sa * 3.2, sa * q - ca * 3.2, ca * q - sa * 3.2, sa * q + ca * 3.2, 0.6, _f[0], _f[1], _f[2], 0.9 * op * G); }
  // the lure at the heart, filled with the feeling (the new colour rising into it)
  const lr = 6 * lerp(0.3, 1, G), lc = R.lureNow;
  b.marks.quad(0, 0, (lr * 10) / 6, (lr * 10) / 6, R.lureKind === 'spoon' ? -0.5 : 0, C.lure[R.lureKind] || C.lure.ball, lc[0], lc[1], lc[2], G);
  const ga = t * 0.8; b.over.arc(0, 0, lr * 0.55, -ga, -ga - 1.6, 0.8, 5, 1, 1, 1, (0.15 + 0.5 * R.flash) * G);
  if (R.flash > 0.01) b.over.quad(0, 0, lr * 1.3, lr * 1.3, 0, C.dot, 1, 1, 1, 0.5 * R.flash * G);
  film(t * 0.1, _f); b.over.arc(0, 0, lr + 0.9, 0, TAU, 0.5, 20, _f[0], _f[1], _f[2], 0.6 * G);
}

// ---------------------------------------------------------------- the rod's line (out of the water it swings short; in it, a surface
// mark crosses it and the sinker hangs at the depth the wheel set)
export function drawRod(X) {
  const { b, C, t, S, R, F } = X, e = S.ext.rod;
  if (e <= 0.3 || F.rodTip == null) return;
  const al = C01((e - 0.3) / 0.7), T = ax(X, F.rodTip, 0, _q), w = R.water, sw = Math.sin(t * 1.7) * 1.1 * (1 - w), drop = 9 + w * (5 + R.depth * 6);
  const lc = R.lureNow; let px = T[0], py = T[1];
  for (let i = 1; i <= 6; i++) { const q = i / 6, x = T[0] + sw * Math.sin(q * Math.PI) * 0.8, y = T[1] - drop * q; b.marks.seg(px, py, x, y, 0.5, lc[0], lc[1], lc[2], 0.85 * al); px = x; py = y; }
  if (w > 0.01) {
    const sy = T[1] - 7; let qx = T[0] - 6, qy = sy;
    for (let i = 1; i <= 12; i++) { const x = T[0] - 6 + i, y = sy + Math.sin(i * 1.4 + t * 3) * 0.5; b.marks.seg(qx, qy, x, y, 1.6, KEY[0], KEY[1], KEY[2], w * al); qx = x; qy = y; }
    qx = T[0] - 6; qy = sy;
    for (let i = 1; i <= 12; i++) { const x = T[0] - 6 + i, y = sy + Math.sin(i * 1.4 + t * 3) * 0.5; b.marks.seg(qx, qy, x, y, 0.8, 0.81, 0.93, 0.96, w * al); qx = x; qy = y; }
    for (let d = 1; d <= 2; d++) { const y = sy - d * 6; b.marks.seg(T[0] - 1.2, y, T[0] + 1.2, y, 0.5, 0.81, 0.93, 0.96, 0.6 * w * al); }
    if (R.splash >= 0 && R.splash < 0.5) { const q = R.splash / 0.5; b.over.arc(T[0], sy, 2 + q * 9, 0, TAU, 0.7, 16, 0.9, 0.98, 1, (1 - q) * w * al); }
    b.marks.quad(px, py, 1.6, 1.6, 0, C.disc, 0.91, 0.86, 0.78, w * al);
  }
}

// ---------------------------------------------------------------- the blade: the string on the temper line
const sN = (B, i) => (B.n > 1 ? 0.1 + (i * Math.min(0.72, 0.15 * (B.n - 1))) / (B.n - 1) : 0.1);
const _a = [0, 0], _c = [0, 0], _q = [0, 0];
const HAMON = 0, EDGE = 1, BRANCH = 2;
/** A line of the blade at s, v off its axis by `mode` (the temper line, the edge, the pause string's line). */
function bladeV(X, mode, s) {
  if (mode === HAMON) return SABRE.hamon(s);
  if (mode === EDGE) return SABRE.edge(s) + 0.25;
  const sb = X.sb, mid = (SABRE.hamon(s) + SABRE.back(s) - 1.4) / 2 + 0.3 * Math.sin(s * 40);
  return lerp(SABRE.hamon(sb), mid, sm((s - sb) / 0.1));
}
const bladeP = (X, s, v, out) => ax(X, SABRE.U(s) - X.shf, v, out);
const shown = (X, s) => SABRE.U(s) - X.shf >= 17; // (inside the guard it is hidden, as the blade is)
function bladePath(X, s0, s1, mode, w, col, a, batch, n = 24) {
  let on = false;
  for (let i = 0; i <= n; i++) {
    const s = lerp(s0, s1, i / n);
    if (!shown(X, s)) { on = false; continue; }
    bladeP(X, s, bladeV(X, mode, s), _c);
    if (on) batch.seg(_a[0], _a[1], _c[0], _c[1], w, col[0], col[1], col[2], a);
    _a[0] = _c[0]; _a[1] = _c[1]; on = true;
  }
}
function notch(X, x, y, eff, st, age, filmOn, sc) {
  const { b, C, t } = X, pop = age < 0.18 ? 1 + 0.6 * (1 - age / 0.18) : 1, k = 10 * pop * (st === 'ahead' ? 0.92 : st === 'next' ? 1.15 : 1) * (sc || 1);
  const col = filmOn ? film(t * 1.5, _f) : st === 'struck' ? STRUCK : st === 'next' ? NEXT : AHEAD;
  b.marks.quad(x, y, k, k, 0, C.notch[eff] || C.notch.stagger, col[0], col[1], col[2], 1);
  if (st === 'next' && !filmOn) b.over.quad(x, y, k, k, 0, C.notchFill[eff] || C.notchFill.stagger, 1, 0.96, 0.85, 0.35 + 0.35 * Math.sin(t * 6));
  if (age < 0.2) { const q = 1 - age / 0.2, sz = (k / 10) * 3; for (let i = 0; i < 4; i++) { const a = (i * TAU) / 4 + 0.4, r0 = sz + 0.8 + age * 12; b.over.seg(x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * (r0 + 1.6), y + Math.sin(a) * (r0 + 1.6), 0.45, 1, 0.94, 0.78, q); } }
}
const WHITE = [1, 1, 1], STEEL_LINE = [0.98, 0.99, 1];
export function drawBlade(X) {
  const { b, C, t, S, B } = X, e = S.ext.cutlass;
  if (e <= 0.001) return;
  X.shf = (1 - e) * 90;
  // the temper line, unlit: a pale thread along the edge's curve (the sabre's, not a katana's)
  bladePath(X, 0.02, 0.97, HAMON, 0.5, STEEL_LINE, 0.45, b.marks);
  // the paid cut's window: the edge wears the film, a glint runs it
  if (B.cutOpen) {
    for (let i = 0; i < 30; i++) {
      const s0 = i / 30, s1 = (i + 1) / 30; if (!shown(X, s0)) continue;
      film(s0 * 1.3 + t * 1.5, _f); bladeP(X, s0, bladeV(X, EDGE, s0), _a); bladeP(X, s1, bladeV(X, EDGE, s1), _c); b.marks.seg(_a[0], _a[1], _c[0], _c[1], 1.3, _f[0], _f[1], _f[2], 1);
    }
    const gs = (t / 0.26) % 1; bladePath(X, Math.max(0, gs - 0.08), gs, EDGE, 1.7, WHITE, 0.95, b.over, 4);
    if (shown(X, gs)) { bladeP(X, gs, bladeV(X, EDGE, gs), _a); bladeP(X, gs, SABRE.back(gs) - 0.6, _c); b.over.seg(_a[0], _a[1], _c[0], _c[1], 0.9, 1, 1, 1, 0.45); }
  }
  // the lit stretch: from the guard to the last struck notch, the blow's light running notch to notch
  let litS = 0.02;
  if (B.lit > 0) { const to = sN(B, B.lit - 1), fr = B.lit > 1 ? sN(B, B.lit - 2) : 0.02; litS = lerp(fr, to, sm(B.runP)); }
  litS = lerp(0.02, litS, 1 - sm(B.cool));
  if (litS > 0.03) { bladePath(X, 0.02, litS, HAMON, 2.4, NEXT, 0.35, b.over); bladePath(X, 0.02, litS, HAMON, 1, GOLD_GLOW, 1, b.marks); bladePath(X, 0.02, litS, HAMON, 0.4, WHITE, 1, b.marks); }
  if (B.runP < 1 && B.cool <= 0 && shown(X, litS)) { bladeP(X, litS, bladeV(X, HAMON, litS), _q); b.over.quad(_q[0], _q[1], 3, 3, 0, C.dot, 1, 0.97, 0.88, 1); }
  // the pause string: a second temper line leaving its notch for the back of the blade, with its own notches
  const Br = B.branch;
  if (Br && Br.n > 0) {
    const sb = (X.sb = sN(B, Br.at)), g2 = Br.g * (1 - sm(B.cool)), end = sb + 0.38 * g2;
    if (end > sb + 0.005) { bladePath(X, sb, end, BRANCH, 0.5, STEEL_LINE, 0.6, b.marks, 12); if (Br.st === 0 && Br.g < 1.01) { film(t * 0.4, _f); bladePath(X, sb, end, BRANCH, 1.2, _f, 0.35, b.over, 12); } }
    if (Br.st > 0) {
      let lb = lerp(Br.st > 1 ? sb + 0.12 + (Br.st - 2) * 0.12 : sb, sb + 0.12 + (Br.st - 1) * 0.12, sm(Br.runP)); lb = lerp(sb, lb, 1 - sm(B.cool));
      if (lb > sb + 0.005) { bladePath(X, sb, lb, BRANCH, 2.4, NEXT, 0.35, b.over, 12); bladePath(X, sb, lb, BRANCH, 1, GOLD_GLOW, 1, b.marks, 12); }
    }
    for (let j = 0; j < Br.n; j++) {
      const s = sb + 0.12 + j * 0.12; if (s > end + 0.001 || !shown(X, s)) continue;
      bladeP(X, s, bladeV(X, BRANCH, s), _q);
      notch(X, _q[0], _q[1], Br.eff[j], j < Br.st && B.cool < 1 ? 'struck' : j === Br.next ? 'next' : 'ahead', j === Br.st - 1 ? Br.hitAge : 9, B.cutOpen && j === Br.next, 0.9);
    }
  }
  const nk = B.n > 6 ? 0.82 : 1;
  for (let i = 0; i < B.n; i++) {
    const s = sN(B, i); if (!shown(X, s)) continue;
    bladeP(X, s, bladeV(X, HAMON, s), _q);
    const lit = B.lit > i && litS >= s - 0.001;
    notch(X, _q[0], _q[1], B.eff[i], lit ? 'struck' : i === B.next ? 'next' : 'ahead', i === B.lit - 1 ? B.hitAge : 9, B.cutOpen && i === B.next, nk);
  }
}

// ---------------------------------------------------------------- the hook: the reach on the ruler, the throw and the reel
export const R0U = 65, DPM = 1.1;
export function drawHook(X) {
  const { b, C, t, S, H, F } = X, e = S.ext.hook;
  if (e <= 0.05) return;
  const rg = H.range, ra = C01((e - 0.6) / 0.4), dim = H.low ? 0.4 : 1, out = H.out, R1 = R0U + rg * DPM, A = ra * dim;
  if (ra > 0) {
    ax(X, R0U, 0, _a); ax(X, R1, 0, _c); b.marks.seg(_a[0], _a[1], _c[0], _c[1], 1.3, KEY[0], KEY[1], KEY[2], 0.5 * A);
    for (let u = R0U; u < R1; u += 2.2) { ax(X, u, 0, _a); ax(X, Math.min(R1, u + 1), 0, _c); film(t * 0.08 + u * 0.01, _f); b.marks.seg(_a[0], _a[1], _c[0], _c[1], 0.5, _f[0], _f[1], _f[2], 0.8 * A); }
    for (let m = 0; m <= rg; m += 5) { const u = R0U + m * DPM, l = m % 10 ? 1.1 : 2.2; ax(X, u, 0, _a); ax(X, u, l, _c); b.marks.seg(_a[0], _a[1], _c[0], _c[1], 0.9, KEY[0], KEY[1], KEY[2], 0.5 * A); b.marks.seg(_a[0], _a[1], _c[0], _c[1], 0.4, 0.91, 0.88, 0.98, 0.75 * A); }
    { const c = out ? EMBER : PALE; ax(X, R1, -2.4, _a); ax(X, R1, 2.4, _c); b.marks.seg(_a[0], _a[1], _c[0], _c[1], 0.8, c[0], c[1], c[2], (out ? 0.7 + 0.3 * Math.sin(t * 8) : 0.6) * A); }
    // the marker: where the aim would bite (hollow past the reach, parked beyond the ruler's end)
    const m = ax(X, H.um, 0, _q);
    b.marks.arc(m[0], m[1], 2.5, 0, TAU, 1.3, 12, KEY[0], KEY[1], KEY[2], 0.55 * A);
    const mc = out ? GREY : PALE; b.marks.arc(m[0], m[1], 2.5, 0, TAU, 0.55, 12, mc[0], mc[1], mc[2], (out ? 0.7 : 0.95) * A);
    if (!out) b.marks.quad(m[0], m[1], 0.9, 0.9, 0, C.disc, PALE[0], PALE[1], PALE[2], 0.95 * A);
    if (H.kind === 'catch' && !out && H.closeP > 0) { // (a catch: the world hook mark's four brackets closing on it)
      const bb = lerp(6.5, 3.8, sm(H.closeP)) - (H.bit && H.biteAge < 0.15 ? 0.6 * (1 - H.biteAge / 0.15) : 0), l = 1.5, al = sm(H.closeP) * A, ca = X.ca, sa = X.sa;
      for (let k = 0; k < 4; k++) { // (each corner and its two arms, turned with the ruler)
        const sx = k === 1 || k === 2 ? 1 : -1, sy = k < 2 ? -1 : 1, cx = m[0] + ca * sx * bb - sa * sy * bb, cy = m[1] + sa * sx * bb + ca * sy * bb;
        b.marks.seg(cx, cy, cx + sa * sy * l, cy - ca * sy * l, 0.55, PALE[0], PALE[1], PALE[2], al); b.marks.seg(cx, cy, cx - ca * sx * l, cy - sa * sx * l, 0.55, PALE[0], PALE[1], PALE[2], al);
      }
    }
    if (H.bit && H.biteAge < 0.3) b.over.arc(m[0], m[1], 3 + H.biteAge * 14, 0, TAU, 0.5, 16, 1, 0.94, 0.78, 1 - H.biteAge / 0.3);
  }
  // the rope: one straight line, keylined; at the bite it snaps taut in a white flash
  const tip = F.hookTip, gU = H.gU;
  if (gU > tip + 0.6) {
    const a = ax(X, tip, 0, _a), c = ax(X, gU, 0, _c);
    b.marks.seg(a[0], a[1], c[0], c[1], 1.6, KEY[0], KEY[1], KEY[2], 1);
    if (H.reel) b.over.seg(a[0], a[1], c[0], c[1], 1.4, 1, 0.67, 0.31, 0.35);
    b.marks.seg(a[0], a[1], c[0], c[1], 0.7, ROPE[0], ROPE[1], ROPE[2], 1);
    if (H.bit && H.biteAge < 0.18) b.over.seg(a[0], a[1], c[0], c[1], 1, 1, 1, 1, 1 - H.biteAge / 0.18);
  }
  if (H.pot) { const p = ax(X, gU + 13.4, 0); b.marks.quad(p[0], p[1], 10, 10, 0, C.pot, 1, 1, 1, 1); }
  const glintAge = H.fly >= 0 && H.fly < 1 ? -1 : H.bit ? H.biteAge : -1;
  if ((H.fly >= 0 && H.fly < 1) || (glintAge >= 0 && glintAge < 0.3)) {
    const q = glintAge < 0 ? 0.5 : glintAge / 0.3, s = (glintAge < 0 ? 2 : 4.5) * (glintAge < 0 ? 1 : 1 - q * 0.6), p = ax(X, gU + 10, 0);
    b.over.quad(p[0], p[1], s * 1.1, s * 1.1, 0, C.star, 1, 0.98, 0.9, glintAge < 0 ? 0.8 : 1 - q);
  }
}

