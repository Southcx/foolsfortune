// ---------------------------------------------------------------------------------------
// THE CRUCIBELLE'S SONGBOOK: its tines and its amp strip (part of vfx/crucibellesongbook.js).
//   THE TINES   the bell's ten keys as a kalimba's: a walnut box, a brass bridge across it, ten steel tines hung from it in the keyboard's
//               order (1 to 5 the lower register, long; 6 to 0 the upper, short), each tipped in its degree's colour and wearing its neume,
//               its key on a bisque chip at its foot and the note it plays now over the bridge (the scale sounding: scaleNames). A note
//               played lights its tine and sets it ringing (a quiver that dies away); a chord (RMB held) lights its three.
//   THE AMP     in the combat recital only: a strip over the tines, a grille with the strum chain's four picks on it (each strum on the
//               beat lays the next, the fourth the windmill), and a wave across the grille: flat at rest, the feedback's when LMB is held
//               on it, bent flat and swept side to side by the whammy (RMB on it). No words.
//
// Prior art, as on a museum label: the kalimba and the mbira (tines on a box, longest in the low notes, struck by the thumbs), Hugh
// Tracey's kalimba with its painted tine heads; a guitar amplifier's grille cloth and its pilot light; the guitarist's picks; an
// oscilloscope's trace for a held note; Guitar Hero's star power and its whammy bend.
//
//   tinesDraw(x, S, t, X0, Y0, W, H)   ampDraw(x, S, t, X0, Y0, W, H)
// ---------------------------------------------------------------------------------------
import { J15, BRASS, BRASS_HI, BRASS_LO, WALNUT_HI, WALNUT_LO, PAPER, INK, DEG, KEY, rgba, neumePath, film, TAU } from './look.js';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const LEN = [30, 28, 26, 24, 22, 19, 17, 15, 13, 11]; // (dots below the bridge: the low notes long, as a kalimba's)

/** The kalimba in the box X0, Y0 (its top left), W x H dots. `S.tines[i]`: { age } since it was played (-1 never), `chord` if in a chord. */
export function tinesDraw(x, S, t, X0, Y0, W, H) {
  x.save(); x.globalAlpha = S.a;
  // the box: walnut, rounded, a sound hole under the tines' tips
  const r = 5; x.beginPath(); x.roundRect(X0, Y0, W, H, r);
  const g = x.createLinearGradient(0, Y0, 0, Y0 + H); g.addColorStop(0, WALNUT_HI); g.addColorStop(1, WALNUT_LO);
  x.fillStyle = g; x.fill(); x.lineWidth = 1.4; x.strokeStyle = KEY; x.stroke();
  x.beginPath(); x.roundRect(X0 + 2, Y0 + 2, W - 4, H - 4, r - 2); x.lineWidth = 0.7; x.strokeStyle = rgba(BRASS, 0.45); x.stroke();
  const pitch = (W - 10) / 10, by = Y0 + 9, cx = (i) => X0 + 5 + pitch * (i + 0.5) + (i >= 5 ? 1.5 : -1.5);
  // the note names over the bridge (the scale sounding now)
  x.font = J15(8); x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  for (let i = 0; i < 10; i++) { const nm = S.names[i % 5] || ''; x.fillStyle = KEY; x.fillText(nm, cx(i), by - 2.4); x.fillStyle = rgba(PAPER, i < 5 ? 0.82 : 0.62); x.fillText(nm, cx(i), by - 3.2); }
  // the bridge
  x.fillStyle = BRASS_LO; x.fillRect(X0 + 4, by - 0.5, W - 8, 4); x.fillStyle = BRASS; x.fillRect(X0 + 4, by - 0.5, W - 8, 2.2); x.fillStyle = BRASS_HI; x.fillRect(X0 + 4, by - 0.5, W - 8, 0.8);
  // the tines
  for (let i = 0; i < 10; i++) {
    const T = S.tines[i], d = (i % 5) + 1, age = T.age, lit = age >= 0 ? Math.exp(-age * 3.2) : 0, ring = age >= 0 ? Math.exp(-age * 5) : 0;
    const x0 = cx(i), tipY = by + 3 + LEN[i], q = ring * 1.6 * Math.sin(age * 70), tw = 2.6;
    x.beginPath(); x.moveTo(x0 - tw / 2, by + 3); x.lineTo(x0 + tw / 2, by + 3); x.lineTo(x0 + tw / 2 + q, tipY); x.lineTo(x0 - tw / 2 + q, tipY); x.closePath();
    const sg = x.createLinearGradient(x0 - tw, 0, x0 + tw, 0); sg.addColorStop(0, '#f2f4f8'); sg.addColorStop(0.5, '#a8b0bc'); sg.addColorStop(1, '#5c6470');
    x.fillStyle = sg; x.fill(); x.lineWidth = 0.9; x.strokeStyle = KEY; x.stroke();
    // its head: its degree's colour and its neume, lit as it is played
    const hx = x0 + q, hy = tipY - 3.6, col = DEG[d - 1];
    if (lit > 0.02) { const hg = x.createRadialGradient(hx, hy, 0.5, hx, hy, 9); hg.addColorStop(0, rgba(col, 0.7 * lit)); hg.addColorStop(1, rgba(col, 0)); x.fillStyle = hg; x.fillRect(hx - 10, hy - 10, 20, 20); }
    x.save(); x.translate(hx, hy); neumePath(x, d, 3.1); x.lineWidth = 2.2; x.strokeStyle = KEY; x.stroke();
    x.fillStyle = lit > 0.02 ? col : rgba(col, 0.55 + 0.1 * (i < 5)); x.fill();
    if (i >= 5) { neumePath(x, d, 4.6); x.lineWidth = 0.8; x.strokeStyle = rgba(col, 0.7 + 0.3 * lit); x.stroke(); } // (the upper register's line doubled)
    x.restore();
    // its key, on a bisque chip at the foot
    const ky = Y0 + H - 5.5;
    x.beginPath(); x.roundRect(x0 - 4.2, ky - 4.6, 8.4, 8.2, 1.6); x.fillStyle = lit > 0.02 ? rgba(PAPER, 0.75 + 0.25 * lit) : rgba(PAPER, 0.72); x.fill(); x.lineWidth = 0.8; x.strokeStyle = lit > 0.02 ? col : KEY; x.stroke();
    x.font = J15(9); x.fillStyle = INK; x.fillText(KEYS[i], x0, ky + 2.4);
  }
  // the register's divide: a brass stud between 5 and 6
  x.beginPath(); x.arc(X0 + W / 2, by + 26, 1.6, 0, TAU); x.fillStyle = BRASS; x.fill();
  x.restore();
}

/** The amp strip (the combat recital only), the box X0, Y0, W x H; `S.recital`: { a, chain, max, fb, wham, strumAge, chainAge }. */
export function ampDraw(x, S, t, X0, Y0, W, H) {
  const R = S.recital; if (!R || R.a <= 0.01) return;
  x.save(); x.globalAlpha = S.a * R.a;
  x.beginPath(); x.roundRect(X0, Y0, W, H, 2.5); x.fillStyle = '#16100c'; x.fill(); x.lineWidth = 1.2; x.strokeStyle = KEY; x.stroke();
  x.beginPath(); x.roundRect(X0 + 1, Y0 + 1, W - 2, H - 2, 2); x.lineWidth = 0.7; x.strokeStyle = BRASS_LO; x.stroke();
  // the grille cloth: a weave
  x.save(); x.beginPath(); x.rect(X0 + 30, Y0 + 2, W - 40, H - 4); x.clip();
  x.strokeStyle = 'rgba(120,96,70,.35)'; x.lineWidth = 0.5;
  for (let u = X0 + 22; u < X0 + W; u += 2.4) { x.beginPath(); x.moveTo(u, Y0); x.lineTo(u + H, Y0 + H); x.stroke(); x.beginPath(); x.moveTo(u + H, Y0); x.lineTo(u, Y0 + H); x.stroke(); }
  // the wave: flat at rest, the feedback's while held on, the whammy's bend flattening it and sweeping it
  const fb = R.fb, wh = R.wham, my = Y0 + H / 2, amp = (H / 2 - 2) * (0.12 + 0.88 * fb), freq = 0.5 * (1 - 0.45 * wh), sweep = wh * Math.sin(t * 2 * Math.PI * (R.barHz || 0.5)) * 6;
  x.beginPath();
  for (let u = X0 + 30; u <= X0 + W - 10; u += 1) { const v = my + amp * Math.sin((u - X0) * freq - t * 14) * (fb > 0.02 ? 1 : 0.15) + (wh * 2.5 * Math.sin((u - X0) * 0.08 + sweep)); u === X0 + 30 ? x.moveTo(u, v) : x.lineTo(u, v); }
  x.lineWidth = 2.6; x.strokeStyle = rgba(KEY, 0.8); x.stroke();
  x.lineWidth = 1.1; x.strokeStyle = fb > 0.02 ? film(t * 0.3, 0.95) : rgba('#b49be6', 0.55); x.stroke();
  x.restore();
  // the pilot light, lit while plugged in
  x.beginPath(); x.arc(X0 + W - 5, my, 1.8, 0, TAU); x.fillStyle = '#ff5a3a'; x.fill(); x.lineWidth = 0.6; x.strokeStyle = KEY; x.stroke();
  // the strum chain's picks: four, laid as the chain steps, the fourth the windmill's
  for (let i = 0; i < R.max; i++) {
    const px = X0 + 5 + i * 6.4, py = my, on = i < R.chain, fresh = on && i === R.chain - 1 ? Math.exp(-R.chainAge * 6) : 0, s = 2.6 + 0.8 * fresh;
    x.beginPath(); x.moveTo(px - s, py - s * 0.8); x.quadraticCurveTo(px, py - s * 1.3, px + s, py - s * 0.8); x.quadraticCurveTo(px + s * 0.6, py + s * 0.6, px, py + s * 1.2); x.quadraticCurveTo(px - s * 0.6, py + s * 0.6, px - s, py - s * 0.8); x.closePath();
    x.fillStyle = on ? (i === R.max - 1 ? BRASS_HI : film(i * 0.22 + 0.1, 1)) : '#2e241c'; x.fill(); x.lineWidth = 0.8; x.strokeStyle = on ? KEY : rgba(BRASS, 0.5); x.stroke();
  }
  x.restore();
}
