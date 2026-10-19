// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S DESK: the two scrolls (part of vfx/soulbrushdesk.js). THE HANGING SCROLL holds the club's string: each blow unrolls it
// a hand's breadth (13 dots in 0.12 real s) and writes its stroke of 永 there, sumi flashing gold for 0.22 s; the next blow's stroke
// waits as a gold ghost in the blank breadth below; the string cooled, it rolls back up from its foot (0.5 s). The first blow 側 (the
// dot), the second 勒 (the bridle), the overhead 努 with 趯 (the crossbow and its hook), the spin 掠 (the sweep), the dive 策 (the whip);
// the slam's charge presses a dot of ink into a fresh breadth and, let go, 磔 (the split) with its spatter. At its foot the source's
// red chop (OVERLAY.md 19.1). THE HANDSCROLL is Celestial mode's: unrolled leftward along the top of the piece, each drawing echoed in
// its own column as it is drawn, a film line scanning it until it reads; read, it flashes gold, its name is written under it in the
// System's type and its cost stands held in a verdigris chip until paid (OVERLAY.md 19.3); a drawing that is not read runs.
//
// Prior art: the mock (board v11, r11-soulbrush: scrollDraw, sheetDraw), ported; the kakejiku and its mount (hyōgu: the hanging rod,
// the ichimonji strips, the roller and its knobs); the Eight Principles of Yong (永字八法, attributed to Wang Xizhi, taught since the
// Tang): 側 勒 努 趯 策 掠 啄 磔; the emakimono and the Chinese handscroll, unrolled right to left a section at a time; Ōkami's
// Celestial Brush for the ink that takes or runs.
//
//   scrollDraw(x, S, t)   (S.str { strokes: [{ k, age }], cool, next, rest }, S.charge, S.burst, S.src)   sheetDraw(x, S, t)   (S.cols)
// ---------------------------------------------------------------------------------------
import { chop, stroke, polyP, film, sm, lerp, C01, KEY, VERD, J15, SUMI, PAPER, INK, rng, mixH, mod } from './look.js';

const SCR = { x: -18, top: -122, pw: 18, mw: 24, B: 13, foot: 11 };
const SHEET = { r: -6, top: -150, bot: -90, col: 34, maxW: 124 };
// the strokes of 永 a blow, cell-local in a breadth 18 by 13
const STROKES = { c1: [[-2.2, -4.2], [0.3, -1.2], [2.2, 2.4]], c2: [[-6.6, 0.8], [0, -0.3], [6.6, -1.2]], c3: [[0.2, -5.6], [0.6, 0.6], [0.4, 4.2], [-3.4, 2.2]], spin: [[5.6, -5], [2.2, -1.4], [-2, 2.2], [-7, 5]], dive: [[-6.6, 4.4], [0, 0.8], [6.8, -3.8]], slam: [[-6, -5], [-0.6, -1.4], [3, 1.6], [7.2, 4.4]] };
const SW = { c1: 3.8, c2: 2.4, c3: 3.0, spin: 2.3, dive: 2.2, slam: 3.4 };
const PATHS = Object.fromEntries(Object.keys(STROKES).map((k) => [k, polyP(STROKES[k])]));

function strokeAt(x, k, cx, cy, age) {
  const [P, Ln] = PATHS[k], fl = age < 0.22 ? 1 - age / 0.22 : 0;
  x.save(); x.translate(cx, cy); stroke(x, P, Ln, SW[k], C01(age / (k === 'c3' || k === 'slam' ? 0.16 : 0.12)), () => (fl > 0 ? mixH(INK, '#e2a83a', fl) : INK), (cx * 7 + cy) | 0); x.restore();
}
function ghostAt(x, k, cx, cy, a) {
  x.save(); x.setLineDash([1, 1.1]); x.lineWidth = 0.75; x.lineCap = 'round'; x.strokeStyle = `rgba(200,140,40,${a})`; x.beginPath();
  STROKES[k].forEach(([u, v], i) => (i ? x.lineTo(cx + u, cy + v) : x.moveTo(cx + u, cy + v))); x.stroke(); x.restore();
}

/** The hanging scroll: the club's string, a stroke a breadth; the source's chop at its foot. */
export function scrollDraw(x, S, t) {
  const cel = S.cel || 0; if (cel >= 0.45) return; const E = S.str, a = 1 - sm(cel / 0.45); x.save(); x.globalAlpha = a;
  const slamOn = S.charge >= 0 || (S.burst >= 0 && S.burst < 0.6);
  let n = 1; for (const s of E.strokes) n += sm(s.age / 0.12); if (!E.next && E.strokes.length) n -= sm(E.strokes[E.strokes.length - 1].age / 0.12);
  if (slamOn && !E.strokes.length) n = 1;
  if (E.cool > 0) n = lerp(n, 1, sm(E.cool));
  const { x: X, top: T, pw, mw, B, foot } = SCR, p0 = T + 5, p1 = p0 + n * B + foot;
  // the hanging cord and its nail, the rod
  x.strokeStyle = '#6a4c26'; x.lineWidth = 0.5; x.beginPath(); x.moveTo(X - 10, T - 0.6); x.lineTo(X, T - 7.5); x.lineTo(X + 10, T - 0.6); x.stroke(); x.fillStyle = '#b48a3e'; x.fillRect(X - 1, T - 8.6, 2, 2);
  x.beginPath(); x.rect(X - 13, T - 1.8, 26, 2.6); x.lineWidth = 1; x.strokeStyle = KEY; x.stroke(); x.fillStyle = '#2a1a10'; x.fill(); x.fillStyle = 'rgba(242,195,90,.6)'; x.fillRect(X - 13, T - 1.8, 1.2, 2.6); x.fillRect(X + 11.8, T - 1.8, 1.2, 2.6);
  // the mount (hyōgu): verdigris brocade, gold ichimonji at the paper's head and foot
  x.beginPath(); x.rect(X - mw / 2, T + 0.8, mw, p1 - T - 0.8); x.lineWidth = 1.1; x.strokeStyle = KEY; x.stroke(); let g = x.createLinearGradient(X - mw / 2, 0, X + mw / 2, 0); g.addColorStop(0, `rgb(${VERD.bot})`); g.addColorStop(0.5, `rgb(${VERD.top})`); g.addColorStop(1, `rgb(${VERD.bot})`); x.fillStyle = g; x.fill();
  const R = rng(9); x.fillStyle = 'rgba(226,243,230,.14)'; for (let yy = T + 2; yy < p1 - 1; yy += 2.2) for (const xx of [X - mw / 2 + 1.2, X + mw / 2 - 1.8]) x.fillRect(xx + (R() < 0.5 ? 0 : 0.6), yy, 0.6, 0.6);
  // the paper
  x.fillStyle = PAPER; x.fillRect(X - pw / 2, p0, pw, p1 - p0 - 0.6); x.fillStyle = 'rgba(120,90,50,.12)'; for (let i = 0; i < (p1 - p0) * 2; i++) x.fillRect(X - pw / 2 + R() * pw, p0 + R() * (p1 - p0 - 1), 0.5, 0.5);
  x.fillStyle = 'rgba(242,195,90,.85)'; x.fillRect(X - pw / 2, p0, pw, 0.6); x.fillRect(X - pw / 2, p1 - 0.9, pw, 0.4);
  // the strokes, a breadth each, clipped to what is unrolled
  x.save(); x.beginPath(); x.rect(X - pw / 2, p0 + 0.6, pw, Math.max(0, p1 - foot - p0 - 0.6)); x.clip();
  E.strokes.forEach((s, j) => strokeAt(x, s.k, X, p0 + B * (j + 0.5) + 0.4, s.age));
  const hide = S.sat > 0 || slamOn || S.flick >= 0; if (E.next && !hide && STROKES[E.next]) ghostAt(x, E.next, X, p0 + B * (E.strokes.length + 0.5) + 0.4, E.rest ? 0.45 : 0.75 + 0.2 * Math.sin(t * 6));
  // the slam: the charge presses a dot of ink into the first breadth; let go, 磔 and the spatter
  if (slamOn && !E.strokes.length) {
    const cy = p0 + B * 0.5 + 0.4;
    if (S.charge >= 0) { const r = 0.8 + 3.2 * sm(S.charge); x.beginPath(); x.arc(X - 1, cy, r, 0, Math.PI * 2); x.fillStyle = INK; x.fill(); if (S.charge >= 1) { x.lineWidth = 0.6; x.strokeStyle = `rgba(226,168,58,${0.6 + 0.35 * Math.sin(t * 14)})`; x.beginPath(); x.arc(X - 1, cy, r + 1.2, 0, Math.PI * 2); x.stroke(); } }
    else { const fa = 1 - sm((S.burst - 0.3) / 0.3); x.globalAlpha = a * fa; strokeAt(x, 'slam', X, cy, S.burst); const R2 = rng(77), q = C01(S.burst / 0.25); for (let i = 0; i < 9; i++) { const an = R2() * Math.PI * 2, d = lerp(1, 4 + R2() * 5, 1 - Math.pow(1 - q, 2)); x.beginPath(); x.arc(X + Math.cos(an) * d, cy + Math.sin(an) * d * 0.8, 0.3 + R2() * 0.6, 0, Math.PI * 2); x.fillStyle = INK; x.fill(); } x.globalAlpha = a; }
  }
  x.restore();
  // the source's chop at the foot (hidden on CLEAN and in MOP, which lay no refined paint)
  const vis = (1 - sm(S.mp || 0)) * (S.pickId !== 'clean' ? 1 : 0);
  if (S.src && vis > 0.01) { const cx = X - pw / 2 + 5, cy = p1 - foot / 2 - 0.4; if (S.srcMix < 1) chop(x, S.srcPrev, cx, cy, 7, (1 - S.srcMix) * vis, -1); chop(x, S.src, cx, cy, 7, vis, S.srcMix < 1 ? S.srcAge : -1); }
  // the roller and its knobs
  x.beginPath(); x.rect(X - mw / 2 - 1, p1, mw + 2, 3); x.lineWidth = 1; x.strokeStyle = KEY; x.stroke(); x.fillStyle = '#2a1a10'; x.fill();
  for (const sx of [-1, 1]) { x.beginPath(); x.rect(X + sx * (mw / 2 + 1) - (sx < 0 ? 2.6 : 0), p1 - 0.6, 2.6, 4.2); x.lineWidth = 0.9; x.strokeStyle = KEY; x.stroke(); x.fillStyle = '#e8dcc0'; x.fill(); }
  x.restore();
}

/** A drawing's echo: its strokes fitted into a box `r` dots each way about the column's eye. */
function echoPath(strokes, r) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of strokes) for (const p of s) { if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
  const k = (2 * r) / Math.max(1, x1 - x0, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return strokes.filter((s) => s.length).map((s) => polyP((s.length > 40 ? s.filter((_, i) => i % Math.ceil(s.length / 40) === 0 || i === s.length - 1) : s).map((p) => [(p.x - cx) * k, (p.y - cy) * k])));
}

/** Celestial mode's handscroll: a column a drawing, right to left; the read written and the cost held. */
export function sheetDraw(x, S, t) {
  const cel = S.cel || 0; if (cel <= 0) return;
  const op = sm(C01((cel - 0.25) / 0.75)), W = SHEET.maxW * op, Rr = SHEET.r, Lx = Rr - W, T = SHEET.top, Bt = SHEET.bot;
  x.save(); x.globalAlpha = C01(cel * 3);
  x.beginPath(); x.rect(Lx, T - 1.5, W, Bt - T + 3); x.fillStyle = SUMI; x.fill(); x.lineWidth = 1; x.strokeStyle = KEY; x.stroke();
  if (W > 4) { x.fillStyle = PAPER; x.fillRect(Lx + 0.5, T + 2.2, W - 1, Bt - T - 4.4); const R = rng(3); x.fillStyle = 'rgba(120,90,50,.12)'; for (let i = 0; i < W * 3; i++) x.fillRect(Lx + R() * W, T + 2.2 + R() * (Bt - T - 4.4), 0.5, 0.5); x.fillStyle = 'rgba(242,195,90,.8)'; x.fillRect(Lx, T + 1.6, W, 0.5); x.fillRect(Lx, Bt - 2.1, W, 0.5); }
  for (const rx of [Rr, Lx - 3]) { x.beginPath(); x.rect(rx, T - 3.5, 3, Bt - T + 7); x.lineWidth = 0.9; x.strokeStyle = KEY; x.stroke(); x.fillStyle = '#1c120c'; x.fill(); x.fillStyle = '#e8dcc0'; x.fillRect(rx, T - 4.5, 3, 1.4); x.fillRect(rx, Bt + 3, 3, 1.4); }
  x.save(); x.beginPath(); x.rect(Lx + 0.5, T + 2.2, Math.max(0, W - 1), Bt - T - 4.4); x.clip();
  const fs = 14, cols = S.cols || [];
  cols.forEach((k, j) => {
    const cx = Rr - 4 - SHEET.col * j - SHEET.col / 2, ey = T + 15;
    let al = 1; const flash = k.st === 'take' && k.atAge < 0.18; if (k.st === 'run') al = 1 - sm(k.atAge / 0.7);
    x.save(); x.translate(cx, ey); x.globalAlpha *= al;
    for (const [P, Ln] of echoPath(k.strokes, 8.5)) stroke(x, P, Ln, 1.5, 1, () => (flash ? '#d9a43a' : INK), 11);
    if (k.st === 'run') { const q = k.atAge; for (let i = 0; i < 5; i++) { x.fillStyle = 'rgba(25,19,16,.6)'; x.fillRect(-6 + i * 3, -2, 0.9, sm(q / 0.6) * 9 * (0.5 + 0.1 * i)); } }
    x.restore();
    x.font = J15(fs); x.textAlign = 'center';
    if (k.st === 'read') { const s = mod(k.age * 2.4, 1), y = T + 5 + 20 * s; x.fillStyle = film(s + t * 0.2, 0.85); x.fillRect(cx - 13, y, 26, 0.6); x.fillStyle = 'rgba(60,50,40,.55)'; x.fillText('· · ·', cx, T + 40); }
    else if (k.st === 'take') {
      x.fillStyle = INK; x.fillText(k.name || '', cx, T + 40);
      const paid = k.paidAge >= 0, q = paid ? C01(k.paidAge / 0.4) : 0, cw = 12, chh = 11, cyy = T + 44 + q * 4;
      x.save(); x.globalAlpha *= 1 - q;
      if (!paid) { x.fillStyle = `rgb(${VERD.top})`; x.fillRect(cx - cw / 2, cyy, cw, chh); x.fillStyle = '#ecfaff'; x.font = J15(12); x.fillText(String(Math.round(k.cost)), cx, cyy + chh - 2.2);
        x.strokeStyle = '#f3d98f'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(cx - cw / 2 - 0.6, cyy - 0.6); x.lineTo(cx - cw / 2 - 1.6, cyy - 0.6); x.lineTo(cx - cw / 2 - 1.6, cyy + chh + 0.6); x.lineTo(cx - cw / 2 - 0.6, cyy + chh + 0.6); x.stroke(); }
      else { x.strokeStyle = 'rgba(60,90,80,.9)'; x.lineWidth = 0.6; x.strokeRect(cx - cw / 2 + 0.3, cyy + 0.3, cw - 0.6, chh - 0.6); }
      x.restore();
    }
    x.textAlign = 'left';
  });
  x.restore(); x.restore();
}
