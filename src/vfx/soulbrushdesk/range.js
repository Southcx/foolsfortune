// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S DESK: the brush rest and the brush (part of vfx/soulbrushdesk.js). The rest is a range of seven glazed peaks, right to
// left in display order (the brush's tip faces inboard, the left hand's rule: OVERLAY.md 10.5g), a feeling not yet awakened a bare dark
// bisque peak with no inlay; at its far end a cliff and a celadon trough of water, CLEAN. The chosen peak rises to 17 dots and the brush
// lies in its saddle; the wheel walks it peak to peak (a hop in 0.16 real s, a dark peak hopped higher in 0.24 with a shiver, a drop of
// the new colour falling from the tip as it lands). PAINT lies tip-down; MOP lifts it 11 dots and turns it 35 degrees, wrung. The hairs
// fill from the tip while LMB is held; the source's thread runs in at the heel (along the haft from the Bottles, or falling from the
// weather). In Celestial mode it all turns to ink. Drawn in dots, the origin at the range's right foot, x running left, y down.
//
// Prior art: the mock (board v11, r11-soulbrush: rangeDraw, brushDraw, streamDraw, tipFx), ported; the scholar's brush rest cast as a
// range of peaks (the bijia, the Song and Ming "brush mountain"; in Japan the fudeoki), the brush washer at its foot (shanshui, mountain
// and water); the Song kilns' monochromes, a glaze a peak (Ru celadon, Jun's lavender and copper red, Ding white).
//
//   rangeDraw(x, S, t)   brushPose(S, f?) -> { x, y, r }   brushDraw(x, S, t, P, ghost)   streamDraw(x, S, t, P)   tipFx(x, S, t, P)
//   ptOn(P, u) -> [x, y]   BR (the brush's stations along its axis: tip, heel, ferrule, cap, end, cord)
// ---------------------------------------------------------------------------------------
import { skinPalette } from '../toolskinwear.js';
import { SEATS, seatCol, featPath, motif, C01, sm, lerp, KEY, film, rgba, mixH, shade, rng, mod, SUMI, VERM, TAU, D } from './look.js';

const PK_H = [9, 10, 11, 12, 11, 10, 9], PK_X = (i) => -8 - 10 * i, PK_HW = 7.2, PK_UP = 17; // (a peak's height, its foot; the chosen rises to 17)
const POT = { x0: -104, x1: -81, h: 8 }, CLIFF = { x: -78, h: 16.2 };
const BY = -PK_UP + 1.2 - 1.8; // (the brush's axis, lying in a raised peak's saddle)
export const BR = { tip: -24, heel: -6, fer: -2, cap: 40, end: 43, cord: 46 };
const pickOf = (S) => SEATS[Math.round(Math.max(0, Math.min(7, S.selF)))].id;

/** Where the brush lies for a seat f (fractional while it walks). */
function poseOf(f) {
  const c = Math.max(-0.3, Math.min(7.3, f));
  if (c > 6) { const q = C01(c - 6), ov = c - 6 - q; return { x: lerp(PK_X(6), CLIFF.x, q) - ov * 4, y: lerp(BY, -CLIFF.h - 1.8 + 0.6, q), r: lerp(-7, -18, q) * D }; }
  const i0 = Math.max(0, Math.min(5, Math.floor(c))), q = c - i0; return { x: lerp(PK_X(i0), PK_X(i0 + 1), q), y: BY, r: -7 * D };
}
export function brushPose(S, f = S.selF) {
  const P = poseOf(f), a = Math.abs(f - Math.round(f)); P.y -= (S.shake ? 8 : 5) * Math.sin(Math.PI * Math.min(0.5, a));
  const mp = S.mp || 0; P.r = lerp(P.r, 28 * D, mp); P.y -= 11 * mp; P.x += 4 * mp;
  if (S.charge >= 0) P.y -= 5 * sm(S.charge * 4); if (S.burst >= 0) P.y -= 5 * (1 - sm(S.burst / 0.1));
  P.r += 0.6 * (S.tilt || 0); return P;
}
export const ptOn = (P, u) => [P.x + u * Math.cos(P.r), P.y + u * Math.sin(P.r)];

function peakPath(x, px, h) { const w = PK_HW; x.beginPath(); x.moveTo(px - w, 0); x.bezierCurveTo(px - w * 0.55, -h * 0.35, px - 3.8, -h, px - 2.3, -h); x.quadraticCurveTo(px, -h + 2.4, px + 2.3, -h); x.bezierCurveTo(px + 3.8, -h, px + w * 0.55, -h * 0.35, px + w, 0); x.closePath(); }

/** The cliff the brush rests on to dip, and the trough of water under it (CLEAN). */
function potDraw(x, S, t) {
  const cel = S.cel || 0, { x0, x1, h } = POT, ch = sm(C01(1 - Math.abs(S.selF - 7) * 1.4)), cx = CLIFF.x, ch2 = CLIFF.h;
  x.beginPath(); x.moveTo(cx - 3.4, 0); x.lineTo(cx - 3.2, -ch2 * 0.6); x.lineTo(cx - 2.6, -ch2); x.quadraticCurveTo(cx - 0.6, -ch2 + 1.8, cx + 1.6, -ch2 - 0.4); x.lineTo(cx + 2.8, -ch2 * 0.55); x.lineTo(cx + 4.6, 0); x.closePath();
  x.lineWidth = 1.3; x.strokeStyle = KEY; x.stroke(); let g = x.createLinearGradient(0, -ch2, 0, 0); g.addColorStop(0, mixH('#8d8476', '#2a2420', cel)); g.addColorStop(1, mixH('#3a342e', '#100c0a', cel)); x.fillStyle = g; x.fill();
  x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 0.4; x.beginPath(); x.moveTo(cx - 1.5, -ch2 * 0.8); x.lineTo(cx + 0.5, -ch2 * 0.5); x.lineTo(cx - 0.6, -ch2 * 0.25); x.stroke();
  x.beginPath(); x.moveTo(x0, -h); x.lineTo(x1, -h); x.lineTo(x1 - 1.6, 0); x.lineTo(x0 + 1.6, 0); x.closePath(); x.lineWidth = 1.3; x.strokeStyle = KEY; x.stroke();
  g = x.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, mixH('#9fd2c0', '#2a2420', cel)); g.addColorStop(1, mixH('#2c6a5c', '#0c0908', cel)); x.fillStyle = g; x.fill();
  x.fillStyle = `rgba(255,255,255,${0.25 * (1 - cel)})`; x.fillRect(x0 + 2, -h + 1, x1 - x0 - 4, 0.5);
  x.beginPath(); x.moveTo(x0, -h); x.lineTo(x0 + 2.4, -h - 3.2); x.lineTo(x1 - 2.4, -h - 3.2); x.lineTo(x1, -h); x.closePath(); x.lineWidth = 1.1; x.strokeStyle = KEY; x.stroke();
  const wc = cel > 0.5 ? SUMI : mixH('#3d7f86', SEATS[7].c, 0.35 + 0.5 * ch); g = x.createLinearGradient(0, -h - 3.2, 0, -h); g.addColorStop(0, shade(wc, 0.25)); g.addColorStop(1, wc); x.fillStyle = g; x.fill();
  x.save(); x.clip(); const sh = 0.35 + 0.5 * ch; x.lineWidth = 0.35;
  for (let i = 0; i < 3; i++) { const y = -h - 2.4 + i * 0.9, ph = t * 1.3 + i * 1.7; x.strokeStyle = `rgba(255,255,255,${sh * (1 - cel) * (0.5 + 0.5 * Math.sin(ph))})`; x.beginPath(); x.moveTo(x0 + 3 + mod(t * 4 + i * 5, 8), y); x.lineTo(x0 + 8 + mod(t * 4 + i * 5, 8), y); x.stroke(); }
  // ripples where the tip is in the water (washing, or landing)
  const wash = S.work && Math.round(S.selF) === 7 ? S.workAge : -1, land = S.dot && S.dot.i === 7 ? S.dot.age : -1;
  for (const [age, cont] of [[wash, true], [land, false]]) { if (age < 0) continue; for (let k = 0; k < 3; k++) { const q = cont ? mod(age * 1.4 + k / 3, 1) : age * 1.4 - k / 3; if (q < 0 || q > 1) continue; x.strokeStyle = `rgba(255,255,255,${0.8 * (1 - q) * (1 - cel)})`; x.lineWidth = 0.45; x.beginPath(); x.ellipse(-98.5, -h - 1.6, 1 + q * 7, (1 + q * 7) * 0.22, 0, 0, TAU); x.stroke(); } }
  x.restore();
  if (ch > 0.5 && cel < 0.5) { x.save(); x.globalCompositeOperation = 'lighter'; x.beginPath(); x.moveTo(x0 - 0.8, -h + 0.2); x.lineTo(x0 + 1.9, -h - 4); x.lineTo(x1 - 1.9, -h - 4); x.lineTo(x1 + 0.8, -h + 0.2); x.lineWidth = 0.7; x.strokeStyle = film(t * 0.15, 0.9 * (ch - 0.5) * 2); x.stroke(); x.restore(); }
}

/** The range: the plinth, the trough under its cliff, the seven peaks (the chosen risen and lit), the quick pick's ghost peak. */
export function rangeDraw(x, S, t) {
  const cel = S.cel || 0, f = S.selF, op = S.open || 0;
  x.beginPath(); x.rect(-106, 0, 110, 3.2); x.fillStyle = KEY; x.fill(); let g = x.createLinearGradient(0, 0, 0, 3.2); g.addColorStop(0, '#4a2c18'); g.addColorStop(1, '#1c0f08'); x.fillStyle = g; x.fillRect(-105.5, 0.4, 109, 2.4);
  x.fillStyle = `rgba(242,195,90,${0.7 - 0.3 * cel})`; x.fillRect(-105.5, 0.4, 109, 0.4);
  potDraw(x, S, t);
  for (const i of [0, 6, 1, 5, 2, 4, 3]) {
    const F = SEATS[i], lk = S.LK.has(F.id), ch = Math.max(0, 1 - Math.abs(f - i)), h = PK_H[i] + (PK_UP - PK_H[i]) * sm(ch);
    let px = PK_X(i); if (S.shake && S.shake.i === i) px += Math.sin(t * 90) * 0.8 * S.shake.amp;
    peakPath(x, px, h); x.lineWidth = 1.3; x.strokeStyle = KEY; x.stroke();
    if (lk) {
      g = x.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, '#4a403a'); g.addColorStop(1, '#1a1513'); x.fillStyle = g; x.fill();
      x.strokeStyle = 'rgba(255,240,220,.12)'; x.lineWidth = 0.4; x.beginPath(); x.moveTo(px - 4.6, -h * 0.45); x.quadraticCurveTo(px - 3.6, -h * 0.85, px - 2.2, -h + 0.4); x.stroke();
    } else {
      const lift = F.id === 'dread' ? 0.35 : F.id === 'fury' ? 0.2 : F.id === 'gall' ? 0.15 : 0, cc = shade(F.c, lift);
      g = x.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, shade(cc, 0.45)); g.addColorStop(0.35, cc); g.addColorStop(1, shade(cc, -0.55)); x.fillStyle = g; x.fill();
      x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 0.45; x.beginPath(); x.moveTo(px - 4.8, -h * 0.4); x.quadraticCurveTo(px - 3.8, -h * 0.82, px - 2.3, -h + 0.3); x.stroke();
      const r = (ch > 0.5 ? 2.3 : 1.85) * (1 + 0.35 * op); x.save(); x.translate(px, -Math.min(h * 0.42, 6.2)); featPath(x, F.id, r); x.lineWidth = 0.7; x.strokeStyle = rgba(KEY, 0.85); x.stroke(); x.fillStyle = shade(cc, ch > 0.5 ? 0.75 : 0.5); x.fill(); x.restore();
      if (ch > 0.5 && cel < 0.5) { x.save(); x.globalCompositeOperation = 'lighter'; peakPath(x, px, h + 0.9); x.lineWidth = 0.7; x.strokeStyle = film(t * 0.15 + i * 0.1, 0.9 * (ch - 0.5) * 2); x.stroke(); x.restore(); }
    }
    if (cel > 0) { x.save(); x.globalAlpha = cel; peakPath(x, px, h); x.fillStyle = SUMI; x.fill(); x.lineWidth = 0.55; x.strokeStyle = 'rgba(242,195,90,.75)'; x.stroke(); if (!lk) { x.translate(px, -Math.min(h * 0.42, 6.2)); featPath(x, F.id, 2); x.fillStyle = VERM; x.fill(); } x.restore(); }
  }
  if (S.ghostF != null) { // (1 held: the ghost's peak ringed in gold)
    const gi = Math.round(S.ghostF); x.save(); x.setLineDash([1.2, 1.2]); x.lineWidth = 0.7; x.strokeStyle = `rgba(242,195,90,${0.7 + 0.25 * Math.sin(t * 8)})`;
    if (gi < 7) peakPath(x, PK_X(gi), PK_H[gi] + 1.4); else { x.beginPath(); x.rect(POT.x0 - 1, -POT.h - 4.2, POT.x1 - POT.x0 + 2, POT.h + 4.6); } x.stroke(); x.restore();
  }
}

/** The brush, lying: goat-hair tuft, gold ferrule, mottled bamboo, horn cap, the cord the link ties to. `ghost`: the quick pick's gold outline. */
export function brushDraw(x, S, t, P, ghost) {
  const cel = S.cel || 0, press = S.charge >= 0 ? sm(S.charge) : S.burst >= 0 ? 1 - sm(S.burst / 0.12) : 0;
  x.save(); x.translate(P.x, P.y); x.rotate(P.r); const L = BR.heel - BR.tip;
  const K = skinPalette('soulbrush'); // (the brush's skin, vfx/toolskins.js: its haft, ferrule, cap and tuft in the skin's colours)
  const tw = (u) => { const f = C01(u / L); let w = 3.3 * Math.sin(Math.PI * Math.pow(f, 0.8) * 0.78); w *= 1 + press * (1 - f) * (1 - f) * 1.4; return Math.max(0.2, w); };
  const tip = BR.tip - press * 1.2, mop = S.mp || 0;
  const tuft = () => { x.beginPath(); x.moveTo(tip, 0); for (let u = 0.5; u <= L; u += 0.5) x.lineTo(BR.tip + u, -tw(u)); x.lineTo(BR.heel + 0.3, -2.3); x.lineTo(BR.heel + 0.3, 2.3); for (let u = L; u >= 0.5; u -= 0.5) x.lineTo(BR.tip + u, tw(u)); x.closePath(); };
  if (ghost) { x.setLineDash([1.2, 1.1]); x.lineWidth = 0.8; x.strokeStyle = `rgba(242,195,90,${0.75 + 0.2 * Math.sin(t * 8)})`; tuft(); x.stroke(); x.beginPath(); x.rect(BR.heel, -2.4, BR.end - BR.heel, 4.8); x.stroke(); x.restore(); return; }
  // the haft
  x.beginPath(); x.rect(BR.fer, -1.8, BR.cap - BR.fer, 3.6); x.lineWidth = 1.1; x.strokeStyle = KEY; x.stroke(); let g = x.createLinearGradient(0, -1.8, 0, 1.8);
  g.addColorStop(0, mixH(K?.wood ? shade(K.wood, -0.35) : '#5a4428', '#151010', cel)); g.addColorStop(0.3, mixH(K?.wood ? shade(K.wood, 0.25) : '#d8bb7e', '#3a3028', cel)); g.addColorStop(1, mixH(K?.wood ? shade(K.wood, -0.5) : '#6a4c26', '#0a0808', cel)); x.fillStyle = g; x.fill();
  const R = rng(17); x.fillStyle = `rgba(70,36,18,${0.6 * (1 - cel)})`; for (let i = 0; i < 14; i++) { x.beginPath(); x.ellipse(BR.fer + 1 + R() * (BR.cap - BR.fer - 2), (R() - 0.5) * 2.4, 0.4 + R() * 1.2, 0.3 + R() * 0.4, 0, 0, TAU); x.fill(); }
  for (const u of [12, 26]) { x.fillStyle = '#3a2814'; x.fillRect(u, -2, 0.8, 4); x.fillStyle = 'rgba(255,230,180,.4)'; x.fillRect(u + 0.8, -1.7, 0.35, 3.4); }
  x.fillStyle = 'rgba(255,240,210,.3)'; x.fillRect(BR.fer, -1.1, BR.cap - BR.fer, 0.4);
  x.beginPath(); x.rect(BR.cap, -2.1, BR.end - BR.cap, 4.2); x.lineWidth = 1; x.strokeStyle = KEY; x.stroke(); x.fillStyle = K?.wrap || '#24140c'; x.fill();
  x.beginPath(); x.moveTo(BR.end, 0); x.quadraticCurveTo(BR.end + 2, -1.8, BR.cord, 0); x.quadraticCurveTo(BR.end + 2, 1.8, BR.end, 0); x.lineWidth = 1.1; x.strokeStyle = KEY; x.stroke(); x.lineWidth = 0.6; x.strokeStyle = '#4fa08c'; x.stroke();
  // the ferrule
  x.beginPath(); x.moveTo(BR.heel, -2.6); x.lineTo(BR.fer, -2.2); x.lineTo(BR.fer, 2.2); x.lineTo(BR.heel, 2.6); x.closePath(); x.lineWidth = 1; x.strokeStyle = KEY; x.stroke();
  g = x.createLinearGradient(0, -2.6, 0, 2.6); g.addColorStop(0, K?.brass ? shade(K.brass, 0.4) : '#f3d98f'); g.addColorStop(0.5, K?.brass || '#b48a3e'); g.addColorStop(1, K?.brass ? shade(K.brass, -0.6) : '#4a3210'); x.fillStyle = g; x.fill();
  // the tuft: dry hair, the pick's colour at the very tip, filled from the tip by the hold
  tuft(); x.lineWidth = 1.1; x.strokeStyle = KEY; x.stroke(); g = x.createLinearGradient(0, -3, 0, 3); g.addColorStop(0, K?.hair ? shade(K.hair, 0.3) : '#f6eedc'); g.addColorStop(0.6, K?.hair || '#d9cdb2'); g.addColorStop(1, K?.hair ? shade(K.hair, -0.3) : '#9c8f78'); x.fillStyle = g; x.fill();
  x.save(); tuft(); x.clip(); x.lineWidth = 0.22; x.strokeStyle = 'rgba(120,100,80,.45)'; for (let v = -3; v <= 3; v += 0.8) { x.beginPath(); x.moveTo(BR.heel, v * 0.75); x.quadraticCurveTo(BR.tip + 8, v, BR.tip, v * 0.1); x.stroke(); }
  const pid = pickOf(S), load = cel > 0 ? Math.max(S.sat, cel) : S.sat;
  if (cel < 0.5 && mop < 0.5 && pid !== 'clean') { const tl = 2.6; x.fillStyle = S.seaFrom; x.fillRect(tip - 1, -4, tl + 1, 8); x.globalAlpha = S.seaFill; x.fillStyle = S.seaTo; x.fillRect(tip - 1, -4, tl + 1, 8); x.globalAlpha = 1; }
  if (pid === 'clean' && cel < 0.5 && mop < 0.5) { x.fillStyle = 'rgba(200,236,244,.55)'; x.fillRect(tip - 1, -4, 7, 8); }
  if (load > 0) {
    const Lf = load * L, mopL = S.loadMode === 1, col = cel > 0.5 ? SUMI : mopL ? '#17101c' : pid === 'clean' ? '#cfeef4' : S.seaTo;
    x.fillStyle = col; x.fillRect(tip - 1, -4, Math.max(0, Lf - 1.4) + 1, 8); const lg = x.createLinearGradient(BR.tip + Lf - 1.6, 0, BR.tip + Lf + 0.6, 0); lg.addColorStop(0, col); lg.addColorStop(1, rgba(col, 0)); x.fillStyle = lg; x.fillRect(BR.tip + Lf - 1.6, -4, 2.2, 8);
    if (cel < 0.5) { x.save(); x.beginPath(); x.rect(tip - 1, -4, Lf + 1, 8); x.clip(); x.globalAlpha = 0.7; motif(x, mopL ? 'crude' : pid, BR.tip, -3.5, BR.heel, 3.5, 0.3, t, 9); x.restore(); }
    x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(BR.tip + 1, -1.3, Math.max(0, Lf - 2), 0.35);
  }
  // MOP: the brush wrung, the twist travelling up the hairs to the heel
  if (mop > 0.01 && cel < 0.5) { x.lineWidth = 0.45; const wk = S.work && S.loadMode === 1, sp = wk ? 9 : 2.5; for (let j = 0; j < 6; j++) { const u = mod(j * 3.2 + t * sp, L + 3) - 1.5; x.strokeStyle = `rgba(${wk ? '190,170,255' : '60,44,30'},${0.75 * mop})`; x.beginPath(); x.moveTo(BR.tip + u - 1.4, -tw(u)); x.lineTo(BR.tip + u + 1.4, tw(u)); x.stroke(); } }
  if (S.workAge >= 0 && S.workAge < 0.35) { const u = BR.tip + (S.workAge / 0.35) * L, gg = x.createRadialGradient(u, 0, 0, u, 0, 2.6); gg.addColorStop(0, 'rgba(255,255,255,.95)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gg; x.fillRect(u - 3, -4, 6, 8); } // (full: the glint runs up)
  x.restore(); x.restore();
}

/** The refining: the source's thread into the hairs (OVERLAY.md 19.1). Along the haft from the cord for the Bottles' grade; three drops
 *  falling onto the heel for the weather. None on CLEAN, in MOP or in Celestial mode. */
export function streamDraw(x, S, t, P) {
  const cel = S.cel || 0; if (!S.src || cel > 0.5) return; const vis = (1 - sm((S.mp || 0) * 2)) * (1 - cel * 2); if (vis <= 0.01 || pickOf(S) === 'clean') return;
  const to = S.seaTo, sp = S.work && S.loadMode === 0 ? 1.15 : 0.45;
  const lane = (I, a) => {
    if (a <= 0.01) return; const ic = I.col; x.save(); x.globalAlpha = vis * a;
    if (!I.w) {
      x.translate(P.x, P.y); x.rotate(P.r); const g = x.createLinearGradient(BR.cap, 0, BR.heel, 0); g.addColorStop(0, ic); g.addColorStop(0.55, ic); g.addColorStop(1, to);
      x.strokeStyle = g; x.lineWidth = 0.8; x.beginPath(); x.moveTo(BR.cap - 1, -0.3); x.lineTo(BR.heel, -0.3); x.stroke();
      for (let k = 0; k < 4; k++) { const s = mod(t * sp + k / 4, 1), u = lerp(BR.cap - 1, BR.heel, s), col = mixH(ic, to, sm((s - 0.55) / 0.4)); x.beginPath(); x.arc(u, -0.3, 1.25, 0, TAU); x.fillStyle = KEY; x.fill(); x.beginPath(); x.arc(u, -0.3, 0.9, 0, TAU); x.fillStyle = col; x.fill(); }
    } else {
      const [hx, hy] = ptOn(P, BR.heel - 1);
      for (let k = 0; k < 3; k++) { const s = mod(t * sp * 1.3 + k / 3, 1), y = hy - 18 + 16 * s * s, xx = hx + 0.6 * Math.sin(k * 2.1), col = mixH(ic, to, sm((s - 0.6) / 0.35)), r = 0.9 + 0.3 * s;
        x.globalAlpha = vis * a * Math.sin(Math.PI * Math.min(1, s * 1.1)); x.beginPath(); x.moveTo(xx, y - r * 2.2); x.quadraticCurveTo(xx + r, y, xx, y + r); x.quadraticCurveTo(xx - r, y, xx, y - r * 2.2); x.lineWidth = 0.7; x.strokeStyle = KEY; x.stroke(); x.fillStyle = col; x.fill(); }
    }
    x.restore();
  };
  lane(S.src, S.srcMix); if (S.srcMix < 1 && S.srcPrev) lane(S.srcPrev, 1 - S.srcMix);
}

/** At the tip: the working drop (PAINT), the motes drawn in (MOP), the flick's five drops, the landing drop after a hop. */
export function tipFx(x, S, t, P) {
  const cel = S.cel || 0, pid = pickOf(S), [tx, ty] = ptOn(P, BR.tip);
  if (S.work && cel < 0.5) {
    if (S.loadMode === 0 && pid !== 'clean') { const ph = mod(S.workAge, 0.5) / 0.5, r = 0.8 + ph * 0.9; x.save(); x.translate(tx - 0.6, ty + ph * ph * 6 + r * 0.6); x.beginPath(); x.moveTo(0, -r * 2); x.quadraticCurveTo(r, -r * 0.2, 0, r); x.quadraticCurveTo(-r, -r * 0.2, 0, -r * 2); x.lineWidth = 0.8; x.strokeStyle = KEY; x.stroke(); x.fillStyle = S.seaTo; x.fill(); x.restore(); }
    else if (S.loadMode === 1) for (let i = 0; i < 6; i++) { const q = mod(S.workAge * 1.6 + i / 6, 1), a = i * 1.05 + 0.4, d = (1 - q) * 9; x.fillStyle = film(i / 6 + t * 0.1, 0.9 * Math.sin(q * Math.PI)); x.fillRect(tx - Math.cos(a) * d - 0.4, ty + Math.sin(a) * d * 0.6 - 0.4, 0.8, 0.8); }
  }
  if (S.flick >= 0) {
    const q = C01((S.flick - 0.08) / 0.35); if (q > 0) { const R = rng(5); for (let i = 0; i < 5; i++) { const a = Math.PI + (-0.7 + i * 0.3) + (R() - 0.5) * 0.1, d = lerp(1, 20 + R() * 6, 1 - Math.pow(1 - q, 2)), r = 1.1 * (1 - q * 0.5), px = tx + Math.cos(a) * d, py = ty - Math.abs(Math.sin(a)) * d * 0.4 - 6 * q + 10 * q * q;
      x.save(); x.translate(px, py); x.globalAlpha = 1 - q; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.lineWidth = 0.7; x.strokeStyle = KEY; x.stroke(); x.fillStyle = S.seaTo; x.fill(); x.restore(); } }
  }
  if (S.dot && S.dot.i < 7 && !S.LK.has(SEATS[S.dot.i].id) && cel < 0.5) {
    const Q = poseOf(S.dot.i), [qx, qy] = ptOn(Q, BR.tip), a = S.dot.age, col = seatCol(S.dot.i);
    if (a < 0.18) { const y = qy + 5 * sm(a / 0.18); x.beginPath(); x.arc(qx, y, 0.9, 0, TAU); x.lineWidth = 0.6; x.strokeStyle = KEY; x.stroke(); x.fillStyle = col; x.fill(); }
    else { const q = sm((a - 0.18) / 0.72); x.save(); x.globalAlpha = 1 - q; x.beginPath(); x.ellipse(qx, qy + 5.2, 1.7, 0.8, 0, 0, TAU); x.fillStyle = KEY; x.fill(); x.beginPath(); x.ellipse(qx, qy + 5, 1.4, 0.6, 0, 0, TAU); x.fillStyle = col; x.fill(); x.restore(); }
  }
}
