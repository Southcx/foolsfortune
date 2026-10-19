// ---------------------------------------------------------------------------------------
// THE LOCKHEART'S RELIQUARY: the whole piece composed on its canvas (part of vfx/lockheartreliquary.js), from the hand's point on the
// chain: the swing's gold trail, the hoover's motes drawn in at the lid's head from the view's middle (the world side), the chain and
// its string, the coffin on it, the pour (the coffin's Lachryma rising out of its open lid into the wheel), the keyring hung from the
// foot ring (the first to turn on the left, the rest following round it in ring order, as the tags read; a Possibilikey flying to the hasp, turned, then held, melted
// (brass) or snapped at the Opening; the ring's turn arcing the last over the ring into the first), the tags, the count plate, and the
// wheel of odds with its rates or its outcome plate. The B orientation (the owner, 2026-10-19): the coffin hangs from the hand as a right
// hand would hold it, its chain out to the screen's edge, its back to the view's middle; so the link meets it on its right, the tube's side.
//
// Prior art: the mock (board v10, r10-lockheart: piece()), ported; the thurible swung on its chain (the swing's weight out on the
// chain), Luigi's Mansion's Poltergust for the motes drawn in.
//
//   drawPiece(x, P, S) -> S.anchor (the link's end, dots), S.W (the wheel's centre)
//     P: { hx, hy (the hand's point, dots), k (dots a unit), t, phi0 (the chain's rest angle) }
//     S: { look, charge, shownCharge, fill, keys, flail, swingT, swingAt(dt), trailA, lift, chainA, lid, snap, pour, hoover, hvCol, wheel, ghost, ... }
// ---------------------------------------------------------------------------------------
import { TAU, D, C01, lerp, KEY, film, rgba, hsh } from './look.js';
import { drawCoffin, drawKey, drawChain, CH_L, WIN_M } from './coffin.js';
import { drawWheel, drawPeekRates, drawOutcomePlate, drawTags, drawCount } from './dial.js';

const SLOT = [150, 118, 86, 54].map((d) => d * D); // (the keyring's four places, round from the hand's side)
const slotAng = (s) => { const i = Math.floor(s), f = s - i; if (i >= 3) return SLOT[3] + (s - 3) * -32 * D; if (s < 0) return SLOT[0] + s * -32 * D; return lerp(SLOT[i], SLOT[i + 1], f); };

export function drawPiece(x, P, S) {
  const k = P.k, t = P.t;
  const phiAt = (sw) => (P.phi0 + sw) * (1 - S.lift) + 0.12 * Math.sign(P.phi0) * S.lift, phi = phiAt(S.swingT); S.phi = phi;
  const hx = P.hx, hy = P.hy - S.lift * 4 * k, bail = [hx + Math.sin(phi) * CH_L * k, hy + Math.cos(phi) * CH_L * k];
  const c0 = Math.cos(-phi), s0 = Math.sin(-phi), toW = (lx, ly) => [bail[0] + (lx * c0 - ly * s0) * k, bail[1] + (lx * s0 + ly * c0) * k];
  // the swing's trail, gold behind the coffin as the flail swings it
  if (S.trailA > 0 && S.swingAt) {
    x.save(); x.lineCap = 'round'; let prev = null;
    for (let j = 0; j < 12; j++) {
      const p2 = phiAt(S.swingAt(j * 0.016)), pt = [hx + Math.sin(p2) * (CH_L + 22) * k, hy + Math.cos(p2) * (CH_L + 22) * k];
      if (prev) { x.beginPath(); x.moveTo(prev[0], prev[1]); x.lineTo(pt[0], pt[1]); x.lineWidth = (3.5 - (j - 1) * 0.25) * k; x.strokeStyle = `rgba(255,198,92,${S.trailA * 0.5 * (1 - (j - 1) / 11)})`; x.stroke(); }
      prev = pt;
    }
    x.restore();
  }
  // the hoover's motes, drawn in at the head from the view's middle (the world side: the coffin's back is to it)
  if (S.hoover > 0.02) {
    const head = toW(0, 2.5); x.save();
    for (let i = 0; i < 16; i++) {
      const p = (t * 0.9 + i / 16) % 1, e = p * p, sx = head[0] + (36 + 14 * hsh(i, 1)) * k * -1, sy = head[1] + (-14 + 30 * hsh(i, 2)) * k;
      const px = lerp(sx, head[0], e) + Math.sin(p * 9 + i) * 2 * k * (1 - p), py = lerp(sy, head[1], e) + Math.cos(p * 7 + i) * 2 * k * (1 - p), dark = hsh(i, 4) < 0.25;
      x.fillStyle = S.hvCol ? rgba(S.hvCol, S.hoover * (1 - p * 0.3)) : dark ? `rgba(70,40,120,${S.hoover})` : film(hsh(i, 3) + t * 0.1, S.hoover * (1 - p * 0.4));
      const r = (S.hvCol ? 1.1 : 0.7) * k; x.fillRect(px - r / 2, py - r / 2, r, r);
    }
    x.restore();
  }
  x.save(); x.translate(hx, hy); x.scale(k, k); drawChain(x, phi, S, t, S.chainA); x.restore();
  x.save(); x.translate(bail[0], bail[1]); x.scale(k, k); x.rotate(-phi); drawCoffin(x, S, t); x.restore();
  const W = [bail[0] - 2 * k, bail[1] - (S.wheel && S.wheel.peek ? 31 : 24) * k];
  if (S.pour >= 0) { // (the pour: the coffin's Lachryma rising out of its open lid into the wheel)
    const from = toW(0, 22), q = S.pour; x.save(); x.globalCompositeOperation = 'lighter';
    const g = x.createLinearGradient(from[0], from[1], W[0], W[1]); g.addColorStop(0, 'rgba(127,220,255,.9)'); g.addColorStop(1, film(t * 0.2, 0.8));
    x.beginPath(); x.moveTo(from[0], from[1]); x.quadraticCurveTo(from[0] + 6 * k, (from[1] + W[1]) / 2, W[0], W[1]); x.lineWidth = (3.2 * (1 - q) + 0.5) * k; x.strokeStyle = g; x.globalAlpha = 1 - q * q; x.stroke(); x.restore();
  }
  // the keyring: hung from the foot ring, under gravity; the first to turn on the left
  const foot = toW(0, 45.6), rc = [foot[0], foot[1] + (1.4 + 3.4) * k], rr = 3.4 * k;
  x.save(); x.beginPath(); x.arc(rc[0], rc[1], rr, 0, TAU); x.lineWidth = 1.5 * k; x.strokeStyle = KEY; x.stroke(); x.lineWidth = 0.6 * k; x.strokeStyle = '#d9b048'; x.stroke(); x.restore();
  const lag = (S.swingT - (S.swingAt ? S.swingAt(0.07) : S.swingT)) * 0.6, hole = toW(0, 20.6);
  S.keys.forEach((K, i) => {
    if (K.st === 'gone') return;
    const sa = slotAng(K.slot);
    let ax = rc[0] + Math.cos(sa) * rr, ay = rc[1] + Math.sin(sa) * rr, rot = lerp(sa - Math.PI / 2, 0, 0.55) - lag + Math.sin(t * 1.6 + i) * 0.03, sxk = 1;
    if (K.wrapLift) ay -= K.wrapLift * k;
    const hy11 = hole[1] - 11 * k;
    if (K.st === 'fly' || K.st === 'turn') { const q = K.st === 'fly' ? K.a : 1; ax = lerp(ax, hole[0], q); ay = lerp(ay, hy11, q); rot = lerp(rot, 0, q); if (K.st === 'turn') sxk = Math.cos((K.a * Math.PI) / 2) * 0.8 + 0.2; }
    if (K.st === 'back') { ax = lerp(hole[0], ax, K.a); ay = lerp(hy11, ay, K.a); rot = lerp(0, rot, K.a); }
    x.save(); x.globalAlpha *= K.fadeIn ?? 1;
    if (K.st === 'melt') { // (brass, spent: it melts into the lock in the film)
      x.globalAlpha *= 1 - K.a; x.translate(hole[0], hy11); x.scale(k, k); drawKey(x, K.s, K.c, K.uses, { glint: t }); x.restore();
      for (let j = 0; j < 8; j++) { const p = C01(K.a * 1.3 - j * 0.05); x.fillStyle = film(j / 8 + t * 0.3, 1 - p); x.fillRect(hole[0] + (hsh(j, 9) - 0.5) * 6 * k * (1 - p), hy11 + hsh(j, 8) * 10 * k * (1 - p) + p * 10 * k, k * 0.8, k * 0.8); }
      return;
    }
    if (K.st === 'snap') { // (broken: it snaps in two at the hasp and falls)
      x.translate(hole[0], hy11); const q = K.a;
      for (const part of [0, 1]) { x.save(); x.beginPath(); if (part) x.rect(-5 * k, 6 * k, 10 * k, 10 * k); else x.rect(-5 * k, -2 * k, 10 * k, 8 * k); x.clip(); x.translate(part ? 3 * k * q : -4 * k * q, (part ? 8 : 3) * k * q * q * 3); x.rotate(part ? q * 1.8 : -q * 1.2); x.globalAlpha *= 1 - q; x.scale(k, k); drawKey(x, K.s, K.c, K.uses, { ch: 1 }); x.restore(); }
      if (q < 0.3) { x.strokeStyle = `rgba(255,240,210,${1 - q / 0.3})`; x.lineWidth = 0.6 * k; for (let j = 0; j < 6; j++) { const a = (j * TAU) / 6; x.beginPath(); x.moveTo(Math.cos(a) * 2 * k, 6 * k + Math.sin(a) * 2 * k); x.lineTo(Math.cos(a) * (3 + q * 12) * k, 6 * k + Math.sin(a) * (3 + q * 12) * k); x.stroke(); } }
      x.restore(); return;
    }
    x.translate(ax, ay);
    K.tip = [ax + Math.cos(rot + Math.PI / 2) * 11.2 * k, ay + Math.sin(rot + Math.PI / 2) * 11.2 * k];
    x.rotate(rot); x.scale(k * sxk, k); drawKey(x, K.s, K.c, K.uses); x.restore();
  });
  drawTags(x, S, rc, rr, k);
  S.anchor = toW(6.2, WIN_M); S.W = W; S.bail = bail; // (the link's end: the coffin's right side, toward the tube, at the window)
  const cp = toW(-8, WIN_M); drawCount(x, cp[0] - 4 * k, cp[1], S, t); // (the count beside it, on the view's side)
  drawWheel(x, W, S, t, k); drawPeekRates(x, W, S, k); drawOutcomePlate(x, W[0] - 23 * k, W[1], S, t);
}
