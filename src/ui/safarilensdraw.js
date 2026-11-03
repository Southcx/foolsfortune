// ---------------------------------------------------------------------------------------
// THE SAFARI LENS'S DRAWING: the pieces ui/safarilens.js lays on its canvas each frame, as pure functions of a 2D context and numbers
// (no state of their own, nothing read from the game). One look: the Veritome's boards (its cover's oxblood leather, model.js `leather`
// and `dark`) round a brass bezel and a glass rim, its instruments engraved in the brass and inked in gold on the leather; inside the
// glass, only what a finder etches (the thirds, the capture circle) and what it projects (the focus marks); the iris and the flash at the
// shutter; and the print with its stars stamped in.
//
// Prior art, as on a museum label:
//   Pokemon Snap (1999) and New Pokemon Snap (2021): the camera's dark rounded viewfinder, the corner brackets round each subject, the
//   photograph shown after the shot with its stars; Fatal Frame (2001): the Camera Obscura's capture circle and its filling ring;
//   a Leica's or a Rolleiflex's focus scale (the distances along the barrel, infinity at its end) and the bayonet bezel's knurled brass;
//   a leaf shutter's six blades; a Polaroid's wide foot, where a photograph is written on; a hanko pressed in vermilion (the candid mark).
//
//   leatherPattern() -> canvas    drawBody(g, W, H, A, k, pat)    drawGlass(g, A, k)    drawCompass(g, cx, y, w, heading, k)
//   drawPitch(g, x, cy, R, pitch, k)    drawClock(g, x, y, r, tide)    drawFootScale(g, x, y, w, t, k, { infinity })
//   drawSockets(g, x, y, n, lit, k)    drawMemory(g, x1, y, left, of, k)    drawThirds(g, W, H, A)    drawCapture(g, cx, cy, r, charge, chance)
//   drawBrackets(g, b, W, H)    drawFocusRing(g, x, y, r, lock, t)    drawIris(g, A, open, turn)    drawPrint(g, P)
//   roundRect(g, x, y, w, h, r)    star(g, x, y, r)
// ---------------------------------------------------------------------------------------

export const LENS_INK = {
  leather: '#3b1a10', leatherHi: '#5a2616', grain: 'rgba(0,0,0,.22)',
  brassLo: '#6e4a1c', brass: '#d9a04a', brassHi: '#f6d68e', engrave: '#3a2410',
  gold: '#e8c27a', cream: '#fff1d6', verm: '#b3321e', glass: 'rgba(205,225,255,.55)',
  blade: '#17100c', bladeHi: '#3a2c22', paper: '#f6ead0', paperShade: '#d9c49c',
};
const TAU = Math.PI * 2;

export function roundRect(g, x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function star(g, x, y, r, inner = 0.45) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, rr = i % 2 ? r * inner : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }

/** The cover's pebble grain, once: a small tile of soft dots laid over the leather at low strength. */
export function leatherPattern() {
  const c = document.createElement('canvas'); c.width = c.height = 96;
  const g = c.getContext('2d');
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 420; i++) {
    const x = rnd() * 96, y = rnd() * 96, r = 1 + rnd() * 2.6;
    g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.35)' : 'rgba(255,200,160,.08)';
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  return c;
}

const brassGrad = (g, x0, y0, x1, y1) => {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, LENS_INK.brassLo); gr.addColorStop(0.22, LENS_INK.brassHi); gr.addColorStop(0.5, LENS_INK.brass);
  gr.addColorStop(0.78, '#a8742e'); gr.addColorStop(1, LENS_INK.brassHi);
  return gr;
};

/** The body round the aperture: leather, lit from the top left, then the brass bezel with its knurling and four screws. */
export function drawBody(g, W, H, A, k, pat) {
  const r = 14 * k;
  g.save();
  g.beginPath(); g.rect(0, 0, W, H); roundRect(g, A.x, A.y, A.w, A.h, r); g.clip('evenodd');
  const lg = g.createLinearGradient(0, 0, W * 0.4, H);
  lg.addColorStop(0, LENS_INK.leatherHi); lg.addColorStop(1, LENS_INK.leather);
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
  if (pat) { g.globalAlpha = 0.7; g.fillStyle = g.createPattern(pat, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  // a stitched welt a little out from the bezel (the cover's own seam)
  g.strokeStyle = 'rgba(232,194,122,.35)'; g.lineWidth = Math.max(1, 1.2 * k); g.setLineDash([5 * k, 4 * k]);
  g.beginPath(); roundRect(g, A.x - 22 * k, A.y - 22 * k, A.w + 44 * k, A.h + 44 * k, r + 18 * k); g.stroke(); g.setLineDash([]);
  g.restore();
  // the bezel: a band of brass, a dark line either side, knurled where the thumb would turn it
  const bw = 7 * k;
  g.save();
  g.lineWidth = bw; g.strokeStyle = brassGrad(g, A.x, A.y, A.x + A.w, A.y + A.h);
  g.beginPath(); roundRect(g, A.x - bw / 2, A.y - bw / 2, A.w + bw, A.h + bw, r + bw / 2); g.stroke();
  g.lineWidth = Math.max(1, 1.2 * k); g.strokeStyle = LENS_INK.engrave;
  g.beginPath(); roundRect(g, A.x - bw, A.y - bw, A.w + bw * 2, A.h + bw * 2, r + bw); g.stroke();
  g.beginPath(); roundRect(g, A.x, A.y, A.w, A.h, r); g.stroke();
  // the knurl: short dark ticks across the band along the four straight runs, thinned toward the corners
  g.strokeStyle = 'rgba(58,36,16,.55)'; g.lineWidth = 1;
  const step = 5 * k;
  for (let x = A.x + r + bw; x < A.x + A.w - r - bw; x += step) for (const y of [A.y - bw, A.y + A.h]) { g.beginPath(); g.moveTo(x, y + 1.5); g.lineTo(x + step * 0.4, y + bw - 1.5); g.stroke(); }
  // four screws at the corners, their slots each turned its own way
  [[A.x - bw * 2.4, A.y - bw * 2.4, 0.4], [A.x + A.w + bw * 2.4, A.y - bw * 2.4, 1.3], [A.x - bw * 2.4, A.y + A.h + bw * 2.4, 2.2], [A.x + A.w + bw * 2.4, A.y + A.h + bw * 2.4, 0.9]].forEach(([x, y, a]) => {
    const sr = 4.2 * k;
    g.fillStyle = brassGrad(g, x - sr, y - sr, x + sr, y + sr); g.beginPath(); g.arc(x, y, sr, 0, TAU); g.fill();
    g.strokeStyle = LENS_INK.engrave; g.lineWidth = Math.max(1, k); g.stroke();
    g.beginPath(); g.moveTo(x - Math.cos(a) * sr * 0.7, y - Math.sin(a) * sr * 0.7); g.lineTo(x + Math.cos(a) * sr * 0.7, y + Math.sin(a) * sr * 0.7); g.stroke();
  });
  g.restore();
}

/** The glass inside the bezel: its rim catching the light at the top left, a long glare across that corner, the lens's own dark at the
 *  corners (a finder's vignette, kept light so the picture still reads). */
export function drawGlass(g, A, k) {
  const r = 14 * k;
  g.save();
  g.beginPath(); roundRect(g, A.x, A.y, A.w, A.h, r); g.clip();
  const cx = A.x + A.w / 2, cy = A.y + A.h / 2, R = Math.hypot(A.w, A.h) / 2;
  const vg = g.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
  vg.addColorStop(0, 'rgba(10,6,4,0)'); vg.addColorStop(1, 'rgba(10,6,4,.42)');
  g.fillStyle = vg; g.fillRect(A.x, A.y, A.w, A.h);
  // the glare: a soft band across the top-left corner, and a thinner one after it
  g.translate(A.x, A.y); g.rotate(-0.62);
  const gl = g.createLinearGradient(0, -A.h * 0.05, 0, A.h * 0.12);
  gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.5, 'rgba(235,245,255,.07)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gl; g.fillRect(-A.w, -A.h * 0.05, A.w * 3, A.h * 0.17);
  g.fillStyle = 'rgba(235,245,255,.05)'; g.fillRect(-A.w, A.h * 0.2, A.w * 3, A.h * 0.025);
  g.restore();
  // the rim: bright where the light comes from, gone on the far side
  g.save();
  const rg = g.createLinearGradient(A.x, A.y, A.x + A.w * 0.6, A.y + A.h * 0.6);
  rg.addColorStop(0, 'rgba(225,240,255,.75)'); rg.addColorStop(0.5, 'rgba(225,240,255,.12)'); rg.addColorStop(1, 'rgba(225,240,255,0)');
  g.strokeStyle = rg; g.lineWidth = Math.max(1.2, 2 * k);
  g.beginPath(); roundRect(g, A.x + 2 * k, A.y + 2 * k, A.w - 4 * k, A.h - 4 * k, r - 2 * k); g.stroke();
  g.restore();
}

/** The heading as a tape engraved along the top: ticks in the cover's gold ink, a bead at the quarters, a brass pointer below. */
export function drawCompass(g, cx, y, w, heading, k) {
  const hd = ((heading % 360) + 360) % 360, degPx = w / 90;
  g.save(); g.strokeStyle = LENS_INK.gold; g.fillStyle = LENS_INK.gold; g.lineWidth = Math.max(1, 1.4 * k);
  for (let d = Math.floor((hd - 45) / 5) * 5; d <= hd + 45; d += 5) {
    const x = cx + (d - hd) * degPx, q = ((d % 360) + 360) % 360, big = q % 45 === 0, mid = q % 15 === 0;
    g.globalAlpha = Math.max(0, 1 - Math.abs(d - hd) / 48);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - (big ? 10 : mid ? 6 : 3) * k); g.stroke();
    if (q % 90 === 0) { g.beginPath(); g.arc(x, y - 15 * k, (q === 0 ? 3.4 : 2) * k, 0, TAU); g.fill(); }
  }
  g.globalAlpha = 1; g.fillStyle = LENS_INK.brassHi; g.strokeStyle = LENS_INK.engrave; g.lineWidth = 1;
  g.beginPath(); g.moveTo(cx, y + 3 * k); g.lineTo(cx - 5 * k, y + 10 * k); g.lineTo(cx + 5 * k, y + 10 * k); g.closePath(); g.fill(); g.stroke();
  g.restore();
}

/** How far the lens is tipped, as a sextant's arc down the left leather. */
export function drawPitch(g, x, cy, R, pitch, k) {
  g.save(); g.strokeStyle = LENS_INK.gold; g.fillStyle = LENS_INK.brassHi; g.lineWidth = Math.max(1, 1.4 * k);
  g.beginPath(); g.arc(x + R, cy, R, Math.PI * 0.8, Math.PI * 1.2); g.stroke();
  for (let a = -60; a <= 60; a += 15) { const t = Math.PI - (a * Math.PI) / 180 * 0.33, px = x + R + Math.cos(t) * R, py = cy - Math.sin(t) * R; g.beginPath(); g.moveTo(px, py); g.lineTo(px + (a % 30 === 0 ? 8 : 4) * k, py); g.stroke(); }
  const t = Math.PI - pitch * 0.33, px = x + R + Math.cos(t) * R, py = cy - Math.sin(t) * R;
  g.strokeStyle = LENS_INK.engrave; g.lineWidth = 1;
  g.beginPath(); g.moveTo(px - 4 * k, py); g.lineTo(px + 9 * k, py - 5 * k); g.lineTo(px + 9 * k, py + 5 * k); g.closePath(); g.fill(); g.stroke();
  g.restore();
}

/** The cover's clock, as a brass dial let into the leather: the tide's two hands. */
export function drawClock(g, x, y, r, tide) {
  g.save();
  g.fillStyle = brassGrad(g, x - r, y - r, x + r, y + r); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.fillStyle = '#f1e2c0'; g.beginPath(); g.arc(x, y, r * 0.78, 0, TAU); g.fill();
  g.strokeStyle = LENS_INK.engrave; g.lineWidth = 1; g.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.beginPath(); g.moveTo(x + Math.sin(a) * r * 0.62, y - Math.cos(a) * r * 0.62); g.lineTo(x + Math.sin(a) * r * 0.72, y - Math.cos(a) * r * 0.72); g.stroke(); }
  g.lineCap = 'round';
  for (const [len, a, w] of [[0.66, tide * TAU * 4, 1.4], [0.42, tide * TAU, 2.2]]) { g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * r * len, y - Math.cos(a) * r * len); g.stroke(); }
  g.restore();
}

/** A scale engraved on a brass strip along the foot (the zoom's, the focus's): ticks, a knob at t (0..1); `infinity` draws the focus
 *  scale's lemniscate at its far end (the one glyph a focus scale carries that is not a number). */
export function drawFootScale(g, x, y, w, t, k, { infinity = false, ticks = 8 } = {}) {
  const h = 6 * k;
  g.save();
  g.fillStyle = brassGrad(g, x, y - h, x, y + h); g.strokeStyle = LENS_INK.engrave; g.lineWidth = 1;
  g.beginPath(); roundRect(g, x, y - h / 2, w, h, h / 2); g.fill(); g.stroke();
  for (let i = 0; i <= ticks; i++) { const tx = x + (w * i) / ticks; g.beginPath(); g.moveTo(tx, y - h / 2); g.lineTo(tx, y - h / 2 - (i % 2 ? 3 : 6) * k); g.strokeStyle = LENS_INK.gold; g.stroke(); }
  if (infinity) {
    const ix = x - 10 * k, iy = y, s = 3.2 * k;
    g.strokeStyle = LENS_INK.gold; g.lineWidth = Math.max(1, 1.3 * k);
    g.beginPath(); for (let i = 0; i <= 40; i++) { const a = (i / 40) * TAU, d = 1 + Math.sin(a) ** 2; g.lineTo(ix + (s * 1.6 * Math.cos(a)) / d, iy + (s * 1.6 * Math.sin(a) * Math.cos(a)) / d); } g.stroke();
  }
  const kx = x + w * Math.max(0, Math.min(1, t));
  g.fillStyle = LENS_INK.cream; g.strokeStyle = LENS_INK.engrave; g.lineWidth = 1;
  g.beginPath(); g.moveTo(kx, y + h / 2 + 1); g.lineTo(kx - 5 * k, y + h / 2 + 8 * k); g.lineTo(kx + 5 * k, y + h / 2 + 8 * k); g.closePath(); g.fill(); g.stroke();
  g.restore();
}

/** Four star sockets in a row from (x, y) leftward-anchored: brass rings, `lit` of them filled gold (the preview's stars). */
export function drawSockets(g, x, y, n, lit, k, r = 6.5) {
  g.save();
  for (let i = 0; i < n; i++) {
    const sx = x + i * r * 2.6 * k;
    star(g, sx, y, r * k);
    if (i < lit) { g.fillStyle = LENS_INK.brassHi; g.fill(); g.strokeStyle = LENS_INK.engrave; g.lineWidth = 1; g.stroke(); }
    else { g.strokeStyle = 'rgba(232,194,122,.55)'; g.lineWidth = Math.max(1, k); g.stroke(); }
  }
  g.restore();
}

/** The memory as a frame counter of plates, right-aligned to x1: an empty square a plate still to be exposed, a filled dim one used. */
export function drawMemory(g, x1, y, left, of, k) {
  const gap = 8.5 * k, s = 5.5 * k, x0 = x1 - of * gap;
  g.save(); g.lineWidth = 1;
  for (let i = 0; i < of; i++) {
    const x = x0 + i * gap;
    if (i < left) { g.strokeStyle = LENS_INK.gold; g.strokeRect(x, y - s * 0.7, s, s * 1.4); }
    else { g.fillStyle = 'rgba(232,194,122,.22)'; g.fillRect(x, y - s * 0.7, s, s * 1.4); }
  }
  g.restore();
}

/** The Rule of Thirds knack's lines, etched faint in the glass (photo.js's own NDC +-1/3). */
export function drawThirds(g, W, H, A) {
  g.save(); g.beginPath(); g.rect(A.x, A.y, A.w, A.h); g.clip();
  g.strokeStyle = 'rgba(255,245,225,.28)'; g.lineWidth = 1;
  for (const t of [1 / 3, 2 / 3]) { g.beginPath(); g.moveTo(W * t, A.y); g.lineTo(W * t, A.y + A.h); g.moveTo(A.x, H * t); g.lineTo(A.x + A.w, H * t); g.stroke(); }
  g.strokeStyle = 'rgba(255,245,225,.5)';
  for (const tx of [1 / 3, 2 / 3]) for (const ty of [1 / 3, 2 / 3]) { g.beginPath(); g.arc(W * tx, H * ty, 4, 0, TAU); g.stroke(); }
  g.restore();
}

/** The capture circle etched in the glass, a fine ring inside it, and its charge filling (vermilion, peach at full, white at the
 *  shutter chance: Fatal Frame's). */
export function drawCapture(g, cx, cy, r, charge, chance) {
  g.save();
  g.strokeStyle = 'rgba(255,245,225,.42)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
  g.strokeStyle = 'rgba(255,245,225,.18)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, r * 0.93, 0, TAU); g.stroke();
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86); g.lineTo(cx + Math.cos(a) * r * 1.05, cy + Math.sin(a) * r * 1.05); g.strokeStyle = 'rgba(255,245,225,.42)'; g.stroke(); }
  if (charge > 0) {
    g.strokeStyle = chance ? '#ffffff' : charge >= 1 ? '#ffd2b0' : LENS_INK.verm; g.lineWidth = charge >= 1 ? 5 : 3;
    g.beginPath(); g.arc(cx, cy, r + 6, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, charge)); g.stroke();
  }
  g.fillStyle = 'rgba(255,245,225,.8)'; g.beginPath(); g.arc(cx, cy, 2.5, 0, TAU); g.fill();
  g.restore();
}

/** A subject's brackets, as the viewfinder's (vermilion for one engaged with the Courier, brighter for a better shot). */
export function drawBrackets(g, b, W, H) {
  const x = (b.x * 0.5 + 0.5) * W, y = (-b.y * 0.5 + 0.5) * H, h = Math.max(14, b.h * H * 0.5), w2 = h * 0.8, L = h * 0.35;
  g.save();
  g.strokeStyle = b.engaged ? LENS_INK.verm : b.stars >= 3 ? '#fff6dc' : b.stars === 2 ? 'rgba(255,240,210,.85)' : 'rgba(255,240,210,.45)';
  g.lineWidth = b.stars >= 3 || b.engaged ? 2.5 : 1.5;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const px = x + sx * w2, py = y + sy * h; g.beginPath(); g.moveTo(px, py - sy * L); g.lineTo(px, py); g.lineTo(px - sx * L, py); g.stroke(); }
  g.restore();
  return { x, y, h };
}

/** The focus ring on the subject the lens is pulling onto: four arcs closing from wide (hunting, a little wobble) to the subject's own
 *  size; locked, they meet into a gold ring with four ticks in and a pulse. `lock` 0..1, `t` real seconds (the hunt's wobble). */
export function drawFocusRing(g, x, y, r, lock, t, pulse = 0) {
  const e = lock * lock * (3 - 2 * lock), rr = r * (1 + 0.9 * (1 - e)) + (lock < 1 ? Math.sin(t * 19) * r * 0.04 * (1 - e) : 0);
  const gap = 0.55 * (1 - e) + 0.06, turn = (1 - e) * 0.8;
  g.save();
  g.strokeStyle = lock >= 1 ? LENS_INK.brassHi : `rgba(255,245,225,${0.45 + 0.4 * e})`; g.lineWidth = lock >= 1 ? 2.5 : 1.6;
  for (let i = 0; i < 4; i++) { const a0 = (i / 4) * TAU + turn + gap / 2, a1 = ((i + 1) / 4) * TAU + turn - gap / 2; g.beginPath(); g.arc(x, y, rr, a0, a1); g.stroke(); }
  if (lock >= 1) {
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; g.beginPath(); g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); g.lineTo(x + Math.cos(a) * rr * 0.86, y + Math.sin(a) * rr * 0.86); g.stroke(); }
    if (pulse > 0) { g.globalAlpha = pulse; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, rr * (1 + 0.5 * (1 - pulse)), 0, TAU); g.stroke(); }
  }
  g.restore();
}

/** The leaf shutter: six blades turned in round a hexagon of radius `open` (px; past the aperture's corners it is fully open), each a
 *  blade of blued steel with its lit edge, overlapping as a real iris does; clipped to the glass. */
export function drawIris(g, A, open, turn) {
  const cx = A.x + A.w / 2, cy = A.y + A.h / 2, BIG = Math.hypot(A.w, A.h) * 1.2;
  const v = [];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + turn; v.push([cx + Math.cos(a) * open, cy + Math.sin(a) * open]); }
  g.save();
  g.beginPath(); roundRect(g, A.x, A.y, A.w, A.h, 14); g.clip();
  for (let i = 0; i < 6; i++) {
    const [ax, ay] = v[i], [bx, by] = v[(i + 1) % 6], ex = bx - ax, ey = by - ay, el = Math.hypot(ex, ey) || 1, ux = ex / el, uy = ey / el;
    const nx = uy, ny = -ux; // (outward from the edge)
    const om = Math.hypot(ax - cx, ay - cy) > 0 ? 1 : 0;
    g.beginPath();
    g.moveTo(ax - ux * BIG * 0.02 * om, ay - uy * BIG * 0.02 * om);
    g.lineTo(bx + ux * BIG, by + uy * BIG);
    g.lineTo(bx + ux * BIG + nx * BIG, by + uy * BIG + ny * BIG);
    g.lineTo(ax + nx * BIG, ay + ny * BIG);
    g.closePath();
    const gr = g.createLinearGradient(ax, ay, ax + nx * BIG * 0.3, ay + ny * BIG * 0.3);
    gr.addColorStop(0, i % 2 ? LENS_INK.bladeHi : '#2a2018'); gr.addColorStop(1, LENS_INK.blade);
    g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(255,225,180,.35)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx + ux * BIG, by + uy * BIG); g.stroke();
  }
  g.restore();
}

/** The print: the plate on a card with a wide foot (a Polaroid's), the four star sockets on the foot and the stars stamped into them
 *  one by one (each slammed in big and settled, a ring off it), the candid seal pressed over the photograph's corner, a held plate's
 *  gold rim. P: { x, y, w, rot, alpha, img, sockets, stamps: [0..1 a star's progress], seal: 0..1 | -1, held } */
export function drawPrint(g, P) {
  const w = P.w, ph = w * (120 / 192) * 0.9, pad = w * 0.05, foot = w * 0.2, h = pad * 2 + ph + foot;
  g.save();
  g.globalAlpha = P.alpha; g.translate(P.x, P.y); g.rotate(P.rot); g.scale(P.scale ?? 1, P.scale ?? 1);
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 14; g.shadowOffsetY = 5;
  g.fillStyle = LENS_INK.paper; g.beginPath(); roundRect(g, -w / 2, -h / 2, w, h, 3); g.fill();
  g.shadowColor = 'transparent';
  const px = -w / 2 + pad, py = -h / 2 + pad, pw = w - pad * 2;
  g.fillStyle = '#20140e'; g.fillRect(px, py, pw, ph);
  if (P.img?.complete && P.img.naturalWidth) { try { g.drawImage(P.img, px, py, pw, ph); } catch { /* (a bad thumb: the dark stands) */ } }
  g.strokeStyle = P.held ? LENS_INK.brassHi : 'rgba(80,50,30,.5)'; g.lineWidth = P.held ? 2.5 : 1; g.strokeRect(px, py, pw, ph);
  // the foot: four sockets pressed blind into the card, and the stars stamped into them
  const fy = py + ph + foot * 0.55, sr = Math.min(foot * 0.32, pw / 13), step = sr * 2.9, sx0 = -step * 1.5;
  for (let i = 0; i < 4; i++) {
    const x = sx0 + i * step;
    star(g, x, fy, sr); g.strokeStyle = LENS_INK.paperShade; g.lineWidth = 1.2; g.stroke();
    const s = P.stamps[i];
    if (s == null || s <= 0) continue;
    const slam = s < 0.45 ? 2.2 - 1.3 * (s / 0.45) : 0.9 + 0.1 * Math.min(1, (s - 0.45) / 0.25); // (in big, under, settled)
    g.save(); g.translate(x, fy); g.rotate((1 - Math.min(1, s / 0.45)) * 0.5); g.globalAlpha = P.alpha * Math.min(1, s * 3);
    star(g, 0, 0, sr * slam);
    const sg = g.createLinearGradient(0, -sr, 0, sr); sg.addColorStop(0, '#fff2b8'); sg.addColorStop(0.55, LENS_INK.brass); sg.addColorStop(1, '#a8742e');
    g.fillStyle = sg; g.fill(); g.strokeStyle = LENS_INK.engrave; g.lineWidth = 1.4; g.stroke();
    if (s > 0.45 && s < 1) { g.globalAlpha = P.alpha * (1 - (s - 0.45) / 0.55); g.strokeStyle = LENS_INK.brassHi; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, sr * (1.2 + 1.6 * (s - 0.45)), 0, TAU); g.stroke(); }
    g.restore();
  }
  // the candid seal: a vermilion hanko pressed over the photograph's top right, a shut eye cut white in it (it never saw you)
  if (P.seal > 0) {
    const s = P.seal, R = w * 0.11, slam = s < 0.4 ? 1.9 - 0.95 * (s / 0.4) : 0.95 + 0.05 * Math.min(1, (s - 0.4) / 0.3);
    g.save(); g.translate(px + pw - R * 0.7, py + R * 0.75); g.rotate(-0.22); g.scale(slam, slam); g.globalAlpha = P.alpha * Math.min(1, s * 3) * 0.92;
    g.fillStyle = LENS_INK.verm; g.beginPath();
    for (let i = 0; i <= 28; i++) { const a = (i / 28) * TAU, rr = R * (1 + 0.04 * Math.sin(i * 2.7)); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.fill();
    g.strokeStyle = LENS_INK.paper; g.lineWidth = Math.max(1.4, R * 0.1); g.lineCap = 'round';
    g.beginPath(); g.arc(0, -R * 0.42, R * 0.62, Math.PI * 0.22, Math.PI * 0.78); g.stroke(); // (the shut lid)
    for (let i = 0; i < 4; i++) { const a = Math.PI * (0.3 + i * 0.13), x0 = Math.cos(a) * R * 0.62, y0 = -R * 0.42 + Math.sin(a) * R * 0.62; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 * 1.18, y0 + R * 0.2); g.stroke(); }
    g.lineWidth = Math.max(1, R * 0.07); g.beginPath(); g.arc(0, 0, R * 0.84, 0, TAU); g.stroke();
    g.restore();
  }
  g.restore();
  return { h };
}
