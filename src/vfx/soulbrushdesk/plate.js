// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S DESK: the plate (part of vfx/soulbrushdesk.js), the house's verdigris plate beside the hanging scroll, its words the
// System's labels (CLARITY.md): PAINT or MOP (or CELESTIAL) in Cinzel, rolling over 0.3 real s when the mode changes; the pick's name in
// its colour (a feeling not yet awakened ? ? ?), rolling as the brush walks; and the third line, where the paint comes from (OVERLAY.md
// 19.1): FROM WONDER (the Bottles' grade) or FROM MIRTH WEATHER, crossfading when the source changes, gone on CLEAN and in MOP. In
// Celestial mode the second line is the techniques read and held, gold, or a pale ". . ." while none is.
//
// Prior art: the mock (board v11, r11-soulbrush: plate), ported; the Sondelass's guard's plate (vfx/sondelassguard/plate.js) and the
// reliquary's count plate for the house's verdigris and its rolling words.
//
//   plateDraw(x, S, t, right, bottom)   (in dots, the plate's right edge and its foot)
// ---------------------------------------------------------------------------------------
import { SEATS, NS, mod, sm, plateBox, nameCol, srcCol, srcLine, VERD, J15, CZ } from './look.js';

const FN = 14, F3 = 12, PAD = 8, LH = Math.round(FN * 1.2), LH3 = Math.round(F3 * 1.15);
let W0 = 0; // (the plate's width, measured once the faces have loaded)

function width(x) {
  x.font = CZ(FN); const w1 = Math.max(...['PAINT', 'MOP', 'CELESTIAL'].map((s) => x.measureText(s).width));
  x.font = J15(FN); const w2 = Math.max(x.measureText('MEND  BOLT').width, ...SEATS.map((F) => x.measureText(F.id.toUpperCase()).width));
  x.font = J15(F3); const w3 = Math.max(x.measureText('FROM FAIR WEATHER').width, ...SEATS.slice(0, 7).map((F) => x.measureText(srcLine({ w: true, id: F.id })).width));
  return Math.round(Math.max(w1, w2, w3) + 2 * PAD);
}
/** Forget the measured width (the faces loaded late). */
export function plateRemeasure() { W0 = 0; }

export function plateDraw(x, S, t, right, bottom) {
  const w = W0 || (W0 = width(x)), h = Math.round(2 * LH + LH3 + 5), X = Math.round(right - w), Y = Math.round(bottom - h), cx = Math.round(X + w / 2);
  plateBox(x, X, Y, w, h, t);
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  const say = (s, y, col) => { x.fillStyle = VERD.lo; x.fillText(s, cx, y + 1); x.fillStyle = col; x.fillText(s, cx, y); };
  // line 1: the mode, rolling
  const nm = S.word; x.save(); x.beginPath(); x.rect(X + 1, Y + 1, w - 2, LH + 2); x.clip(); x.font = CZ(FN);
  const dy = Math.round(nm.p * LH), ty = Y + 2 + Math.round(FN * 0.95);
  for (const [s, y] of [[nm.a, ty - dy], [nm.b, ty - dy + LH]]) say(s, y, s === 'CELESTIAL' ? '#f4e6c8' : VERD.hi);
  x.restore();
  // line 2: the pick, rolling as the brush walks (or, in Celestial mode, what is read and held)
  const y0 = Y + LH + 2; x.save(); x.beginPath(); x.rect(X + 1, y0, w - 2, LH); x.clip(); x.font = J15(FN);
  if (S.cel > 0.5) { const s = S.names.length ? S.names.slice(-2).join('  ') : '. . .'; say(s, y0 + Math.round(FN * 0.9), S.names.length ? '#f2c35a' : '#8c837d'); }
  else {
    const f = mod(S.selF, NS), i0 = Math.floor(f), ff = f - i0, i1 = Math.min(NS - 1, i0 + 1), d2 = Math.round(ff * LH), ty2 = y0 + Math.round(FN * 0.9);
    for (const [i, y] of [[i0, ty2 - d2], [i1, ty2 - d2 + LH]]) { const F = SEATS[i], lk = S.LK.has(F.id); say(lk ? '? ? ?' : F.id.toUpperCase(), y, lk ? '#8c837d' : nameCol(F.id)); }
  }
  x.restore();
  // line 3: where the paint comes from (hidden on CLEAN, in MOP and in Celestial mode, which lay no refined paint)
  const y3 = y0 + LH, vis = (1 - sm(S.mp || 0)) * (1 - sm((S.cel || 0) * 2)) * (S.pickId !== 'clean' ? 1 : 0);
  if (vis > 0.01 && S.src) {
    x.save(); x.beginPath(); x.rect(X + 1, y3, w - 2, LH3 + 2); x.clip(); x.font = J15(F3); const ty3 = y3 + Math.round(F3 * 0.92);
    for (const [I, a] of [[S.src, S.srcMix], [S.srcPrev, 1 - S.srcMix]]) { if (!I || a <= 0.01) continue; x.globalAlpha = a * vis; say(srcLine(I), ty3, srcCol(I)); }
    x.restore();
  }
  x.textAlign = 'left';
}
