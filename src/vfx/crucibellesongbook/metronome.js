// ---------------------------------------------------------------------------------------
// THE CRUCIBELLE'S SONGBOOK: its metronome (part of vfx/crucibellesongbook.js). A Maelzel's pyramid of walnut on a brass-trimmed plinth,
// its scale plate up the open face filled with ember to the bell's fever, the arc the rod's tip sweeps with a notch at each end exactly
// as wide as the bell's on-beat window (the rod inside it at a press: on the beat), the end the next downbeat lands on standing taller,
// the bar's beats as brass studs along the plinth's top (the beat that is, raised; the downbeat a lozenge), the tempo on the plinth.
// The rod and its weight are their own plane (rodDraw), turned every frame by the songbook, never redrawn for the swing.
// The notes pressed are written where the rod's tip was, as their neumes: solid in the notch, hollow outside it, the upper register's
// line doubled. Fever: the weight an ember, smoke off it, the plate filling; its peak a brighten that settles and a ring of smoke.
// No flash, no pulse of light on the beat: shape and motion only (docs/plans/CRUCIBELLE-UI.md 3).
//
// Prior art, as on a museum label: Maelzel's metronome (1815), its pyramid, its sliding weight and its tempo scale behind the rod; the
// conductor's downbeat (the heaviest stroke of the bar, in the same place every bar); Rhythm Heaven (every cue given to the ear also
// given to the eye); Patapon's fever as fire; the Botafumeiro's smoke drawing its swing.
//
//   metronomeDraw(x, S, t)   rodDraw(x, heat)   METRO { X, PY, L, AMP, RW, RH, RPX, RPY }
// ---------------------------------------------------------------------------------------
import { C01, sm, J15, BRASS, BRASS_HI, BRASS_LO, WALNUT, WALNUT_HI, WALNUT_LO, EMBER, DEG, KEY, rgba, neumePath, TAU, shade } from './look.js';

/** Where it stands in the canvas (dots from the songbook's foot): the pivot's x, its y, the rod's length to its tip, the half-arc. The
 *  rod's own canvas: RW x RH dots, the pivot at RPX, RPY in it. */
export const METRO = { X: -58, PY: -24, L: 92, AMP: 0.6, RW: 22, RH: 104, RPX: 11, RPY: 100 };
const BASE = { w: 34, top: -14 }, APEX = { y: -124, w: 5 }, PLATE = { w: 5, y0: -32, y1: -104 }, WEIGHT = 62;

function pyramid(x) {
  const { X } = METRO;
  x.beginPath(); x.moveTo(X - 28, BASE.top); x.lineTo(X - APEX.w, APEX.y); x.lineTo(X + APEX.w, APEX.y); x.lineTo(X + 28, BASE.top); x.closePath();
}

export function metronomeDraw(x, S, t) {
  const { X, PY, L, AMP } = METRO, sw = S.sw, heat = S.heat, faint = S.own ? 0.62 : 1;
  x.save(); x.globalAlpha = S.a;
  // the plinth: walnut with a brass band, the bar's beats as studs on its top, the tempo on its face
  x.fillStyle = WALNUT_LO; x.fillRect(X - BASE.w - 1, BASE.top - 1, BASE.w * 2 + 2, 16);
  const pg = x.createLinearGradient(0, BASE.top, 0, 0); pg.addColorStop(0, WALNUT_HI); pg.addColorStop(1, WALNUT_LO);
  x.fillStyle = pg; x.fillRect(X - BASE.w, BASE.top, BASE.w * 2, 14);
  x.fillStyle = BRASS; x.fillRect(X - BASE.w, BASE.top, BASE.w * 2, 1.5); x.fillStyle = BRASS_LO; x.fillRect(X - BASE.w, -1.5, BASE.w * 2, 1.5);
  x.font = J15(10); x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.fillStyle = KEY; x.fillText(`${S.bpm} BPM`, X, -2.5); x.fillStyle = S.own ? '#b8a98e' : BRASS_HI; x.fillText(`${S.bpm} BPM`, X, -3.5);
  // the pyramid: walnut, lit from the left, its face cut open for the scale plate
  pyramid(x); const wg = x.createLinearGradient(X - 28, 0, X + 28, 0); wg.addColorStop(0, WALNUT_HI); wg.addColorStop(0.45, WALNUT); wg.addColorStop(1, WALNUT_LO);
  x.fillStyle = wg; x.fill(); x.lineWidth = 1.2; x.strokeStyle = KEY; x.stroke();
  x.save(); pyramid(x); x.clip(); x.strokeStyle = 'rgba(30,17,10,.35)'; x.lineWidth = 0.6;
  for (let i = 0; i < 7; i++) { x.beginPath(); x.moveTo(X - 26 + i * 8, BASE.top); x.quadraticCurveTo(X - 18 + i * 6, -70, X - 4 + i * 1.4, APEX.y); x.stroke(); } // (the grain)
  x.restore();
  // the open face, and the scale plate in it: brass ticks, ember to the fever
  x.beginPath(); x.moveTo(X - 12, PLATE.y0 + 6); x.lineTo(X - 6, PLATE.y1 - 4); x.lineTo(X + 6, PLATE.y1 - 4); x.lineTo(X + 12, PLATE.y0 + 6); x.closePath();
  x.fillStyle = '#140b07'; x.fill(); x.strokeStyle = BRASS_LO; x.lineWidth = 1; x.stroke();
  const pw = PLATE.w, ph = PLATE.y0 - PLATE.y1;
  x.fillStyle = '#2a1d10'; x.fillRect(X - pw, PLATE.y1, pw * 2, ph);
  const fy = PLATE.y0 - ph * C01(heat), pk = S.peak;
  if (heat > 0.004) {
    const eg = x.createLinearGradient(0, PLATE.y0, 0, fy); eg.addColorStop(0, '#7a1e08'); eg.addColorStop(0.7, EMBER); eg.addColorStop(1, '#ffd08a');
    x.fillStyle = eg; x.fillRect(X - pw + 1, fy, pw * 2 - 2, PLATE.y0 - fy);
    x.fillStyle = rgba('#ffd08a', 0.25 + 0.5 * pk); x.fillRect(X - pw - 1, fy - 1.5, pw * 2 + 2, 2.5); // (the ember's top, brighter at the peak and settling)
  }
  x.fillStyle = BRASS; for (let i = 0; i <= 12; i++) { const y = PLATE.y0 - (ph * i) / 12, w = i % 4 ? 2 : 4; x.fillRect(X - pw, y - 0.4, w, 0.8); x.fillRect(X + pw - w, y - 0.4, w, 0.8); }
  x.strokeStyle = BRASS; x.lineWidth = 0.8; x.strokeRect(X - pw, PLATE.y1, pw * 2, ph);
  // the arc the tip sweeps, its notches: a groove the rod runs into at each end, as wide as the bell's window; the downbeat's end taller
  const arc = (r, a0, a1, w, col) => { x.beginPath(); x.arc(X, PY, r, -Math.PI / 2 + a0, -Math.PI / 2 + a1); x.lineWidth = w; x.strokeStyle = col; x.stroke(); };
  arc(L + 2, -AMP, AMP, 2.6, rgba(KEY, 0.7 * faint)); arc(L + 2, -AMP, AMP, 1, rgba(BRASS, 0.55 * faint));
  const gate = (a0, a1, tall) => {
    const lo = a0 < a1 ? a0 : a1, hi = a0 < a1 ? a1 : a0;
    x.beginPath(); x.arc(X, PY, L - 4, -Math.PI / 2 + lo, -Math.PI / 2 + hi); x.arc(X, PY, L + 8 + tall, -Math.PI / 2 + hi, -Math.PI / 2 + lo, true); x.closePath();
    x.fillStyle = rgba(KEY, 0.8 * faint); x.fill(); x.lineWidth = 1.4; x.strokeStyle = rgba(KEY, 0.8 * faint); x.stroke();
    x.fillStyle = rgba(BRASS_HI, 0.85 * faint); x.fill();
  };
  for (const side of [1, -1]) {
    const tall = side === sw.side ? 3 + 7 * sw.down : 3;
    gate(side * sw.notch, side * (AMP + 0.035), tall);
    const a = side * (AMP + 0.035), sa = Math.sin(a), ca = -Math.cos(a); // (the end stop, a post standing out of the arc)
    x.beginPath(); x.moveTo(X + sa * (L - 6), PY + ca * (L - 6)); x.lineTo(X + sa * (L + 10 + tall), PY + ca * (L + 10 + tall)); x.lineWidth = side === sw.side ? 1.4 + 1.4 * sw.down : 1.4; x.strokeStyle = BRASS_HI; x.stroke();
  }
  if (sw.half && sw.centre > 0.004) gate(-sw.centre, sw.centre, 0); // (Half Time: the beat between, in the middle)
  // the pivot's boss
  x.beginPath(); x.arc(X, PY, 3.2, 0, TAU); x.fillStyle = BRASS; x.fill(); x.lineWidth = 1; x.strokeStyle = KEY; x.stroke();
  // the bar's beats: studs on the plinth's top, the beat that is raised (its height, never a lamp), the downbeat a lozenge
  const n = sw.beats, gap = Math.min(10, 56 / n);
  for (let i = 0; i < n; i++) {
    const sx = X + (i - (n - 1) / 2) * gap, up = i === sw.beat, hgt = up ? 5 : 2;
    x.beginPath();
    if (i === 0) { x.moveTo(sx, BASE.top - hgt - 2.6); x.lineTo(sx + 2.6, BASE.top - hgt); x.lineTo(sx, BASE.top - hgt + 2.6); x.lineTo(sx - 2.6, BASE.top - hgt); x.closePath(); }
    else x.rect(sx - 1.6, BASE.top - hgt - 1.6, 3.2, hgt + 1.6);
    x.fillStyle = BRASS; x.fill(); x.lineWidth = 0.8; x.strokeStyle = KEY; x.stroke();
  }
  // the notes pressed, written on the arc where the tip was
  for (const m of S.arcNotes) {
    const k = 1 - C01((m.age - 0.6) / 0.5); if (k <= 0) continue;
    const r = L + 15, px = X + Math.sin(m.th) * r, py = PY - Math.cos(m.th) * r, s = 3.6 * (1 + 0.25 * Math.exp(-m.age * 6));
    x.save(); x.translate(px, py); x.globalAlpha *= k;
    neumePath(x, m.d, s); x.lineWidth = 2.4; x.strokeStyle = KEY; x.stroke();
    if (m.on) { x.fillStyle = DEG[m.d - 1]; x.fill(); } else { x.lineWidth = 1.2; x.strokeStyle = DEG[m.d - 1]; x.stroke(); }
    if (m.high) { neumePath(x, m.d, s + 2); x.lineWidth = 0.9; x.strokeStyle = DEG[m.d - 1]; x.stroke(); }
    x.restore();
  }
  // the smoke off the weight, rising with the fever, the swing bending it
  for (let i = S.smoke.length - 1; i > 0; i--) {
    const a = S.smoke[i], b = S.smoke[i - 1], k = (1 - b.age / S.smokeLife) * (0.25 + 0.55 * heat);
    if (k <= 0) continue;
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.lineWidth = 1 + 2 * (b.age / S.smokeLife); x.strokeStyle = heat > 0.6 ? rgba('#b49be6', k) : rgba('#8a8090', k); x.stroke();
  }
  // the fever's peak: a ring of smoke out from the weight once
  if (S.ringAge >= 0 && S.ringAge < 1.4) {
    const k = S.ringAge / 1.4, r = 8 + 40 * (1 - (1 - k) * (1 - k));
    x.beginPath(); x.ellipse(S.ringAt[0], S.ringAt[1], r, r * 0.42, 0, 0, TAU); x.lineWidth = 2.5 * (1 - k) + 0.5; x.strokeStyle = rgba('#b49be6', 0.7 * (1 - k)); x.stroke();
  }
  x.restore();
}

/** The rod and its weight on their own canvas (the pivot at RPX, RPY): brass rod, a walnut-and-brass weight with the ember in its face. */
export function rodDraw(x, heat) {
  const { RW, RH, RPX, RPY, L } = METRO;
  x.clearRect(0, 0, RW, RH);
  const tip = RPY - L, wy = RPY - WEIGHT;
  x.lineCap = 'round';
  x.beginPath(); x.moveTo(RPX, RPY); x.lineTo(RPX, tip); x.lineWidth = 3; x.strokeStyle = KEY; x.stroke();
  x.lineWidth = 1.4; x.strokeStyle = BRASS_HI; x.stroke();
  x.beginPath(); x.arc(RPX, tip, 2, 0, TAU); x.fillStyle = BRASS_HI; x.fill(); x.lineWidth = 0.8; x.strokeStyle = KEY; x.stroke();
  if (heat > 0.02) { const g = x.createRadialGradient(RPX, wy, 1, RPX, wy, 10); g.addColorStop(0, rgba(EMBER, 0.75 * heat)); g.addColorStop(1, rgba(EMBER, 0)); x.fillStyle = g; x.fillRect(RPX - 11, wy - 11, 22, 22); }
  x.beginPath(); x.moveTo(RPX - 7, wy + 5); x.lineTo(RPX + 7, wy + 5); x.lineTo(RPX + 5, wy - 5); x.lineTo(RPX - 5, wy - 5); x.closePath();
  const g = x.createLinearGradient(RPX - 7, 0, RPX + 7, 0); g.addColorStop(0, BRASS_HI); g.addColorStop(0.5, BRASS); g.addColorStop(1, BRASS_LO);
  x.fillStyle = g; x.fill(); x.lineWidth = 1.2; x.strokeStyle = KEY; x.stroke();
  // its face: an ember window, dark cold, glowing with the fever
  x.beginPath(); x.ellipse(RPX, wy, 2.6, 2.2, 0, 0, TAU); x.fillStyle = heat > 0.02 ? shade(EMBER, -0.6 + 0.8 * heat) : '#2a1d10'; x.fill();
}
