// ---------------------------------------------------------------------------------------
// THE LOCKHEART'S RELIQUARY: its numbers and its wheel (part of vfx/lockheartreliquary.js), drawn in dots on the piece's canvas:
//   THE WHEEL OF ODDS  risen out of the open lid: each sector an outcome's colour and as wide as its chance (the coffin's table with the
//                      ring's Possibilikeys done to it), a pierced brass rim with the film on its edge, the pointer at the top flicked by
//                      each edge it passes; the landing flashes its sector and runs a ring out; an ECHO runs two rings of the film
//   THE ODDS HELD      RMB held short of the open (OVERLAY.md 19.8): the wheel still, each sector's rate in Jersey 15 beside it in its
//                      outcome's colour, a gold arc round the rim filling toward the open
//   THE OUTCOME PLATE  a slot reel reading the sector under the pointer while it turns, then what came out and how hard (x1.05), the
//                      first of a TWIN stamped small above, the WIDE's and the ECHO's glyphs beside the power
//   THE TAGS           one a Possibilikey under the ring, hung by a thread from its bit: its chance to break at the next Opening as a
//                      published rate (amber past 50%, ember at 100%), its key's colour along the top; brass a brass dot (always spent)
//   THE COUNT PLATE    what the coffin holds against its measure ("42 /40"), rolling digit by digit, gold once full
// Every number in the System's type (Jersey 15), every word an outcome's label (Cinzel): a readout of what is, never what happened.
//
// Prior art: the mock (board v10, r10-lockheart: wheelOfOdds(), outcomePlate(), peekRates(), keyTags(), countPlate()), ported; the prize
// wheel (Wheel of Fortune), the gacha's published rates, Persona's arcana roulette, a slot reel's ease-out and ticks, the astrolabe's
// rete for the rim, Balatro's rolling count.
//
//   drawWheel(x, W, S, t, k)   drawPeekRates(x, W, S, k)   drawOutcomePlate(x, X, Y, S, t)   drawTags(x, S, rc, rr, k)   drawCount(x, X, Y, S, t)
// ---------------------------------------------------------------------------------------
import { TAU, C01, sm, lerp, KEY, VERD, film, shade, rng, OUT, J15, CZ } from './look.js';
import { emblem, keyCh } from './coffin.js';

const FN = 14; // (the words' size in dots: the bible's floor)

/** The wheel of odds at W (dots), k dots a unit. S.wheel: { R, ang, rise, sink, landAge, chosen, echoAge, peek, hold }. */
export function drawWheel(x, W, S, t, k) {
  const w = S.wheel; if (!w) return;
  const r = lerp(4.4, 19, w.rise) * w.sink, r0 = r * 0.42; if (r < 0.5) return;
  x.save(); x.translate(W[0], W[1]); x.scale(k, k);
  const back = x.createRadialGradient(0, 0, r0, 0, 0, r * 1.6); back.addColorStop(0, film(t * 0.1, 0.35 * w.sink)); back.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = back; x.beginPath(); x.arc(0, 0, r * 1.6, 0, TAU); x.fill();
  x.beginPath(); x.arc(0, 0, r + 1.2, 0, TAU); x.fillStyle = KEY; x.fill();
  const turn = ((w.ang % TAU) + TAU) % TAU; let a = 0, under = 0;
  const sector = (a0, len) => { x.beginPath(); x.arc(0, 0, r, -Math.PI / 2 + a0 - w.ang, -Math.PI / 2 + a0 + len - w.ang); x.arc(0, 0, r0, -Math.PI / 2 + a0 + len - w.ang, -Math.PI / 2 + a0 - w.ang, true); x.closePath(); };
  w.R.forEach((s, i) => {
    const len = s.p * TAU; if (len < 1e-4) return;
    if (turn >= a && turn < a + len) under = i;
    sector(a, len); const c = OUT(s.id).c, g = x.createRadialGradient(0, 0, r0, 0, 0, r); g.addColorStop(0, shade(c, -0.25)); g.addColorStop(1, shade(c, 0.15)); x.fillStyle = g; x.fill(); x.lineWidth = 0.45; x.strokeStyle = KEY; x.stroke(); a += len;
  });
  S.under = w.R[under]?.id; { let aa = 0; S.underFrac = 0; for (const s of w.R) { const len = s.p * TAU; if (turn >= aa && turn < aa + len) { S.underFrac = (turn - aa) / len; break; } aa += len; } }
  if (w.landAge >= 0 && w.landAge < 0.45) { // (the landing: the sector flashes and a ring runs out)
    const ch = w.chosen ?? S.under; let aa = 0; for (const s of w.R) { const len = s.p * TAU; if (s.id === ch) { sector(aa, len); x.fillStyle = `rgba(255,255,255,${0.7 * (1 - w.landAge / 0.45)})`; x.fill(); } aa += len; }
    x.lineWidth = 1.2; x.strokeStyle = `rgba(255,248,225,${1 - w.landAge / 0.45})`; x.beginPath(); x.arc(0, 0, r + 2 + w.landAge * 30, 0, TAU); x.stroke();
  }
  if (w.echoAge >= 0 && w.echoAge < 0.5) { x.lineWidth = 0.9; x.strokeStyle = film(t * 0.3, 1 - w.echoAge / 0.5); for (const d of [0, 0.12]) { const q = C01((w.echoAge - d) / 0.38); x.beginPath(); x.arc(0, 0, r + 2 + q * 22, 0, TAU); x.stroke(); } }
  // the rim: a pierced brass ring, the film on its edge
  x.beginPath(); x.arc(0, 0, r + 0.6, 0, TAU); x.lineWidth = 1.6; x.strokeStyle = '#b48a3e'; x.stroke(); x.lineWidth = 0.4; x.strokeStyle = film(t * 0.06, 0.8); x.beginPath(); x.arc(0, 0, r + 1.5, 0, TAU); x.stroke();
  for (let i = 0; i < 16; i++) { const aa = (i * TAU) / 16 - w.ang; x.fillStyle = KEY; x.beginPath(); x.arc(Math.cos(aa) * (r + 0.6), Math.sin(aa) * (r + 0.6), 0.35, 0, TAU); x.fill(); }
  if (w.peek && w.hold > 0) { x.lineCap = 'round'; x.beginPath(); x.arc(0, 0, r + 3, -Math.PI / 2, -Math.PI / 2 + TAU * C01(w.hold)); x.lineWidth = 1.8; x.strokeStyle = KEY; x.stroke(); x.lineWidth = 0.9; x.strokeStyle = '#f2c35a'; x.stroke(); x.lineCap = 'butt'; } // (the hold toward the open)
  x.beginPath(); x.arc(0, 0, r0, 0, TAU); x.fillStyle = '#120c10'; x.fill(); x.lineWidth = 0.6; x.strokeStyle = S.look.trim; x.stroke(); emblem(x, S.look.emb, r0 * 0.55, S.look.trim);
  // the pointer at the top, flicked by each edge it passes (the tick)
  let past = 9; { let aa = 0; for (const s of w.R) { aa += s.p * TAU; const d = (((turn - aa) % TAU) + TAU) % TAU; past = Math.min(past, d); } }
  const flick = w.landAge < 0 && w.rise >= 1 && !w.peek ? 0.5 * Math.exp(-past * 14) : 0;
  x.save(); x.translate(0, -r - 2.2); x.rotate(flick); x.beginPath(); x.moveTo(-2.2, -1.6); x.lineTo(2.2, -1.6); x.lineTo(0, 2.4); x.closePath(); x.lineWidth = 1.1; x.strokeStyle = KEY; x.stroke(); x.fillStyle = '#f3d98f'; x.fill(); x.restore();
  x.restore();
}

/** The odds held short: each sector's chance round the still wheel, in its outcome's colour (the small ones staggered out). */
export function drawPeekRates(x, W, S, k) {
  const w = S.wheel; if (!w || !w.peek || w.rise < 0.6) return;
  const r = lerp(4.4, 19, w.rise) * w.sink;
  x.save(); x.globalAlpha *= C01((w.rise - 0.6) / 0.4) * w.sink; x.font = J15(FN); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  let a = 0, small = 0;
  for (const s of w.R) {
    const len = s.p * TAU; if (len < 1e-4) continue;
    const m = -Math.PI / 2 + a + len / 2, R = (r + 4.2) * k + FN * 0.75 + (s.p < 0.1 ? (small++ % 2) * FN * 1.05 : 0), px = Math.round(W[0] + Math.cos(m) * R), py = Math.round(W[1] + Math.sin(m) * R);
    const lab = `${(s.p * 100).toFixed(s.p < 0.095 ? 1 : 0).replace(/\.0$/, '')}%`;
    x.lineWidth = 3; x.strokeStyle = KEY; x.strokeText(lab, px, py); x.fillStyle = shade(OUT(s.id).c, 0.2); x.fillText(lab, px, py); a += len;
  }
  x.restore();
}

function chamfer(x, X, Y, w, h, c) { x.beginPath(); x.moveTo(X + c, Y); x.lineTo(X + w, Y); x.lineTo(X + w, Y + h - c); x.lineTo(X + w - c, Y + h); x.lineTo(X, Y + h); x.lineTo(X, Y + c); x.closePath(); }
/** A small System window: verdigris glaze, its grain, an inner line, the film's frame, a lit corner. */
function plateBox(x, X, Y, w, h, t) {
  const o = 1, c = 4; chamfer(x, X, Y, w, h, c);
  const g = x.createLinearGradient(0, Y, 0, Y + h); g.addColorStop(0, `rgb(${VERD.top})`); g.addColorStop(1, `rgb(${VERD.bot})`); x.fillStyle = g; x.fill();
  x.save(); x.clip(); const R = rng(9); for (let i = 0; i < (w * h) / 30; i++) { x.fillStyle = R() < 0.6 ? 'rgba(0,0,0,.22)' : 'rgba(226,243,230,.1)'; x.fillRect((X + R() * w) | 0, (Y + R() * h) | 0, o, o); } x.restore();
  x.strokeStyle = 'rgba(111,165,150,.55)'; x.lineWidth = o; chamfer(x, X + 2.5, Y + 2.5, w - 5, h - 5, c - o); x.stroke();
  const lg = x.createLinearGradient(X, Y, X + w, Y + h); [0, 0.33, 0.66, 1].forEach((p, i) => lg.addColorStop(p, film(i / 4 + t * 0.05, 1))); x.strokeStyle = lg; chamfer(x, X + 0.5, Y + 0.5, w - o, h - o, c); x.stroke();
  x.fillStyle = 'rgba(226,243,230,.55)'; x.beginPath(); x.moveTo(X + w - c - o, Y + o); x.lineTo(X + w - o, Y + o); x.lineTo(X + w - o, Y + c + o); x.closePath(); x.fill();
}
const digitW = (x) => { let dw = 0; for (let d = 0; d < 10; d++) dw = Math.max(dw, x.measureText(String(d)).width); return Math.ceil(dw) + 1; };
/** A number rolled digit by digit in fixed cells (the fraction turns the ones; a place turns over in its last tenth). */
function rollNum(x, v, X, Y, size, col, cells) {
  x.font = J15(size); const s = String(Math.max(0, Math.floor(v + 1e-6))).padStart(cells || 1, ' '), dw = digitW(x);
  const top = Math.round(Y - size * 0.78), ch = Math.round(size * 0.86), step = ch + 3; x.textAlign = 'center';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === ' ') continue;
    const place = 10 ** (s.length - 1 - i), base = Math.floor(v / place) % 10, raw = place === 1 ? v - Math.floor(v) : C01((v % place) - (place - 1)), frac = sm(C01((raw - 0.15) / 0.7)), cx = X + i * dw;
    x.save(); x.beginPath(); x.rect(cx, top, dw - 1, ch); x.clip(); x.fillStyle = col;
    x.fillText(String(base), cx + (dw - 1) / 2, Math.round(Y - frac * step)); x.fillText(String((base + 1) % 10), cx + (dw - 1) / 2, Math.round(Y + (1 - frac) * step)); x.restore();
  }
  x.textAlign = 'left'; return s.length * dw;
}

/** The count plate, its right edge at X and its middle at Y: the charge against the measure, gold once full. */
export function drawCount(x, X, Y, S, t) {
  x.font = J15(FN); const dw = digitW(x), ms = `/${S.fill}`, tw = Math.ceil(x.measureText(ms).width), pad = 5, wd = 2 * dw + 2 + tw + 2 * pad, h = Math.round(FN * 1.25 + 4);
  const PX = Math.round(X - wd), PY = Math.round(Y - h / 2); plateBox(x, PX, PY, wd, h, t);
  const full = S.charge >= S.fill, yb = PY + Math.round(h / 2 + FN * 0.36);
  rollNum(x, Math.min(99, S.shownCharge ?? S.charge), PX + pad, yb, FN, full ? '#f3d98f' : VERD.hi, 2); x.font = J15(FN); x.textAlign = 'left'; x.fillStyle = full ? '#c9a24a' : VERD.mid; x.fillText(ms, PX + pad + 2 * dw + 2, yb);
}

/** The outcome plate, its right edge at X and its middle at Y: the reel under the pointer, then what came out and how hard. */
export function drawOutcomePlate(x, X, Y, S, t) {
  const w = S.wheel; if (!w || w.rise < 1 || w.peek) return;
  x.save(); x.globalAlpha *= w.sink; x.font = CZ(FN);
  const w1 = Math.ceil(Math.max(...w.R.map((r) => x.measureText(OUT(r.id).l).width))); x.font = J15(FN);
  const subW = Math.ceil(Math.max(x.measureText('×2.00').width, x.measureText('100%').width));
  const pad = 6, inset = 4, lh = Math.round(FN * 1.3), gap = 3, mstep = 8, modW = w.mods.length * mstep, extra = w.prev ? Math.round(FN * 1.05) : 0;
  const wd = Math.max(w1 + 2 * inset + 8, subW + modW + 2 * pad + gap), y0rel = inset + extra, y2rel = y0rel + lh + gap + Math.round(FN * 0.78), h = y2rel + 5;
  const PX = Math.round(X - wd), PY = Math.round(Y - h / 2); plateBox(x, PX, PY, wd, h, t);
  if (w.prev) { x.font = J15(FN); x.textAlign = 'center'; x.fillStyle = VERD.mid; x.fillText(OUT(w.prev).l, Math.round(PX + wd / 2), PY + inset + Math.round(FN * 0.8)); }
  const rx = PX + inset, rw = wd - 2 * inset, y0 = PY + y0rel; x.fillStyle = 'rgba(2,14,12,.62)'; x.fillRect(rx, y0, rw, lh); // (the reel window: a recessed slot the label turns in)
  x.save(); x.beginPath(); x.rect(rx, y0, rw, lh); x.clip(); x.font = CZ(FN); x.textAlign = 'center';
  const i0 = Math.max(0, w.R.findIndex((r) => r.id === S.under)), landed = w.landAge >= 0, chosen = w.chosen ?? S.under, cur = landed ? chosen : S.under, nxt = w.R[(i0 + 1) % w.R.length]?.id;
  const roll = landed ? 0 : sm(C01(((S.underFrac || 0) - 0.86) / 0.14)), yb = y0 + Math.round((lh + FN * 0.66) / 2);
  for (const [id, y] of [[cur, yb - roll * lh], [nxt, yb + (1 - roll) * lh]]) {
    if (!id) continue;
    x.fillStyle = VERD.lo; x.fillText(OUT(id).l, Math.round(PX + wd / 2), Math.round(y) + 1);
    x.fillStyle = landed && id === chosen ? (OUT(id).r >= 3 ? '#f2c35a' : VERD.hi) : VERD.hi; x.fillText(OUT(id).l, Math.round(PX + wd / 2), Math.round(y));
  }
  const sg = x.createLinearGradient(0, y0, 0, y0 + lh); sg.addColorStop(0, 'rgba(0,0,0,.55)'); sg.addColorStop(0.25, 'rgba(0,0,0,0)'); sg.addColorStop(0.75, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = sg; x.fillRect(rx, y0, rw, lh); x.restore();
  x.lineWidth = 1; x.strokeStyle = 'rgba(111,165,150,.5)'; x.strokeRect(rx - 0.5, y0 - 0.5, rw + 1, lh + 1);
  x.font = J15(FN); x.textAlign = 'left'; const y2 = PY + y2rel;
  const caught = w.R.find((r) => r.id === 'caught'), sub = caught ? `${Math.round(caught.p * 100)}%` : landed ? `×${(w.power ?? 1).toFixed(2)}` : `${Math.round((w.R[i0]?.p || 0) * 100)}%`;
  x.fillStyle = VERD.lo; x.fillText(sub, PX + pad, y2 + 1); x.fillStyle = landed && !caught ? '#f3d98f' : VERD.mid; x.fillText(sub, PX + pad, y2);
  let mx = PX + wd - pad - 3; // (what the ring does to what comes out: the ECHO's rings, the WIDE's arrows, the TWIN's two)
  for (const m of w.mods) {
    x.save(); x.translate(mx, y2 - Math.round(FN * 0.3)); x.scale(0.9, 0.9); x.lineWidth = 1.2; x.strokeStyle = KEY;
    if (m === 'echo' || m === 'twin') { const lit = m === 'echo' ? (w.echoAge >= 0 ? 1 : 0.45) : 0.9, col = m === 'echo' ? `rgba(180,155,230,${lit})` : `rgba(232,160,200,${lit})`; for (const [cx, rr] of m === 'echo' ? [[0, 2.6], [0, 1.2]] : [[-1.3, 1.6], [1.3, 1.6]]) { x.beginPath(); x.arc(cx, 0, rr, 0, TAU); x.lineWidth = 1.3; x.strokeStyle = KEY; x.stroke(); x.lineWidth = 0.6; x.strokeStyle = col; x.stroke(); } }
    if (m === 'wide') { x.beginPath(); x.moveTo(-3, 0); x.lineTo(-1.6, -1.4); x.lineTo(-1.6, 1.4); x.closePath(); x.moveTo(3, 0); x.lineTo(1.6, -1.4); x.lineTo(1.6, 1.4); x.closePath(); x.rect(-1.6, -0.4, 3.2, 0.8); x.stroke(); x.fillStyle = '#8ad0b0'; x.fill(); }
    x.restore(); mx -= mstep;
  }
  x.restore(); x.textAlign = 'left';
}

/** The break-chance tags in ring order under the ring (rc its centre, rr its radius, dots), each on a thread from its key's bit. */
export function drawTags(x, S, rc, rr, k) {
  const ta = 1 - S.lift; if (ta < 0.02) return;
  const fN = 11, o = 1; x.save(); x.font = J15(fN); // (11 dots: under the plates' floor on purpose, a reading for the 2x present beside the cracks)
  const tw = Math.ceil(x.measureText('00%').width) + 5, th = Math.round(fN * 0.95 + 3), gp = 2, ty0 = rc[1] + rr + 12.5 * k, n = S.keys.filter((K) => K.st === 'ring' || K.st === 'back').length;
  for (const K of S.keys) {
    if (K.st !== 'ring' && K.st !== 'back') continue;
    const al = ta * (K.fadeIn ?? 1) * (K.st === 'back' ? K.a : 1); if (al < 0.02) continue; x.globalAlpha = al;
    const cx = Math.round(rc[0] + (K.slot - (n - 1) / 2) * (tw + gp)), ty = Math.round(ty0 - (K.wrapLift || 0) * k * 0.6), TX = cx - Math.round(tw / 2);
    if (K.tip) { x.beginPath(); x.moveTo(K.tip[0], K.tip[1]); x.lineTo(cx, ty); x.lineWidth = 0.6; x.strokeStyle = 'rgba(233,220,200,.55)'; x.stroke(); }
    x.fillStyle = KEY; x.fillRect(TX - o, ty - o, tw + 2 * o, th + 2 * o);
    const g = x.createLinearGradient(0, ty, 0, ty + th); g.addColorStop(0, `rgb(${VERD.top})`); g.addColorStop(1, `rgb(${VERD.bot})`); x.fillStyle = g; x.fillRect(TX, ty, tw, th);
    x.fillStyle = K.c; x.fillRect(TX, ty, tw, 1);
    if (K.s === 'brass') { const r = 2.6; x.beginPath(); x.arc(cx, ty + th / 2 + 0.5, r, 0, TAU); x.fillStyle = '#d9b048'; x.fill(); x.lineWidth = o; x.strokeStyle = KEY; x.stroke(); x.fillStyle = 'rgba(255,246,210,.8)'; x.fillRect(cx - 1, ty + Math.round(th / 2) - 1, o, o); }
    else { const ch = keyCh(K.id, K.uses), lab = `${Math.round(ch * 100)}%`, yb = ty + Math.round(th / 2 + fN * 0.33); x.textAlign = 'center'; x.fillStyle = VERD.lo; x.fillText(lab, cx, yb + o); x.fillStyle = ch >= 1 ? '#ff8a5a' : ch >= 0.5 ? '#ffc08a' : VERD.hi; x.fillText(lab, cx, yb); }
  }
  x.restore();
}
