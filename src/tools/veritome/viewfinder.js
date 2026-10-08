// ---------------------------------------------------------------------------------------
// THE VIEWFINDER: what the Veritome puts on the screen while the lens is up. The book is held up open before the eyes and the view is
// the picture on its pages (the lens is in the spine, behind them), so the frame is PARCHMENT: the margins of the two open pages
// round the picture, the gutter's shadow down the middle of the top and foot, and the instruments drawn in the margins in ink. No
// words, and one number only: the date stamp, the camera's own orange LCD in the picture's corner (ui/datestamp.js; the owner):
//
//  - along the top margin a compass tape (the heading); down the left margin a sextant's arc (how far the lens is tipped); in the
//    corner the clock (the tide, as the cover's hands keep it); along the foot the zoom, and the memory as a row of plates
//    (an empty square for each plate still to be exposed: a full roll is no squares at all);
//  - over each subject in frame a pair of focus brackets, darker for a better shot, in vermilion for a creature that is aware of
//    the Courier and in the thick of it with them (only those can be held by a charged shot);
//  - in the middle the capture circle, whose ring fills while such a creature is held in it (Fatal Frame's charge), white at the
//    shutter chance; the stars the best subject would get; and the shutter's one flash, after which the photograph drops away into
//    the book's corner (it goes on the plate: memory.js).
//
// Prior art: Fatal Frame's Camera Obscura (the capture circle and its filling charge ring, the shutter chance, film as a count: here the memory's room),
// Pokémon Snap's viewfinder brackets, Wind Waker's Picto Box (the frame is the box's own), the Sheikah Slate's camera, and a
// sextant's arc and a compass card in a ship's log.
//
//   vf.show(on)  vf.draw(dt, { heading, pitch, tide, charge, chance, brackets, zoom, stars, memory: { left, of }, thirds })  vf.flash(thumb)
// ---------------------------------------------------------------------------------------
import { drawStamp, stampText } from '../../ui/datestamp.js';
const CSS = `
#viewfinder { position: fixed; inset: 0; pointer-events: none; z-index: 30; opacity: 0; transition: opacity .12s; }
#viewfinder.on { opacity: 1; }
#viewfinder canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
/* the shutter is a blink: two lids of ink close over the picture and open again (no flash: the lens takes what light there is) */
#viewfinder .lid { position: absolute; left: -5%; right: -5%; height: 0; background: #140a06; box-shadow: 0 0 18px 6px rgba(20,10,6,.85); }
#viewfinder .lid.top { top: 0; border-radius: 0 0 50% 50% / 0 0 34% 34%; }
#viewfinder .lid.bot { bottom: 0; border-radius: 50% 50% 0 0 / 34% 34% 0 0; }
#viewfinder .dev { position: absolute; left: 50%; top: 50%; width: 200px; height: 125px; margin: -62px 0 0 -100px; border: 6px solid #f1dfba; box-shadow: 0 6px 24px rgba(0,0,0,.5);
  background-size: cover; background-position: center; opacity: 0; }
`;
const INK = '#4a2a18', VERM = '#b3321e', PAPER = 'rgba(232,214,178,.94)';

export class Viewfinder {
  constructor() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = (this.el = document.createElement('div')); el.id = 'viewfinder';
    el.innerHTML = '<canvas></canvas><div class="dev"></div><div class="lid top"></div><div class="lid bot"></div>';
    document.body.appendChild(el);
    this.cv = el.querySelector('canvas'); this.g = this.cv.getContext('2d');
    this.lidT = el.querySelector('.lid.top'); this.lidB = el.querySelector('.lid.bot'); this.devEl = el.querySelector('.dev');
    this.on = false; this.flashT = 1; this.devT = 1;
  }
  show(on) { this.on = on; this.el.classList.toggle('on', on); }
  /** The aperture: the part of the screen the photograph is of (px). */
  aperture(W = innerWidth, H = innerHeight) { const w = W * 0.8, h = H * 0.76; return { x: (W - w) / 2, y: (H - h) / 2, w, h }; }

  flash(thumb) {
    this.flashT = 0; this.devT = 0;
    if (thumb) this.devEl.style.backgroundImage = `url(${thumb})`;
  }

  /** One frame (real seconds). */
  draw(dt, s) {
    // the blink: shut in a twentieth of a second, open in a tenth (an eye's own: quick down, slower up), and the plate is filed away as
    // the lids part, as if what the eye just held were put by into the book
    this.flashT = Math.min(1, this.flashT + dt / 0.17);
    const f = this.flashT, shut = f < 0.3 ? f / 0.3 : f < 0.42 ? 1 : 1 - (f - 0.42) / 0.58;
    const h = `${(54 * (1 - (1 - shut) * (1 - shut))).toFixed(1)}%`;
    if (h !== this.lidH) { this.lidH = h; this.lidT.style.height = h; this.lidB.style.height = h; }
    if (f < 0.42) this.devT = Math.min(this.devT, 0); // (the plate waits behind the lids)
    this.devT = Math.min(1, this.devT + dt / 1.1);
    const u = this.devT;
    this.devEl.style.opacity = String(u < 1 ? Math.min(1, u * 6) * (1 - Math.max(0, (u - 0.6) / 0.4)) : 0);
    this.devEl.style.transform = `translate(${u * u * (innerWidth * 0.36)}px, ${u * u * innerHeight * 0.32}px) rotate(${8 * u}deg) scale(${1 - 0.55 * u})`;
    if (!this.on) return;
    const W = innerWidth, H = innerHeight, c = this.cv, g = this.g;
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    g.clearRect(0, 0, W, H);
    const A = this.aperture(W, H), r = 10, cx = W / 2;
    // the pages round the picture, and the gutter's shadow down the middle of the margins
    g.fillStyle = PAPER;
    g.beginPath(); g.rect(0, 0, W, H); roundRect(g, A.x, A.y, A.w, A.h, r); g.fill('evenodd');
    const gut = g.createLinearGradient(cx - 40, 0, cx + 40, 0);
    gut.addColorStop(0, 'rgba(90,55,30,0)'); gut.addColorStop(0.5, 'rgba(90,55,30,.35)'); gut.addColorStop(1, 'rgba(90,55,30,0)');
    g.fillStyle = gut; g.fillRect(cx - 40, 0, 80, A.y); g.fillRect(cx - 40, A.y + A.h, 80, H - A.y - A.h);
    g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); roundRect(g, A.x, A.y, A.w, A.h, r); g.stroke();
    g.lineWidth = 1; g.globalAlpha = 0.5; g.beginPath(); roundRect(g, A.x - 6, A.y - 6, A.w + 12, A.h + 12, r + 4); g.stroke(); g.globalAlpha = 1;
    g.strokeStyle = INK; g.fillStyle = INK;
    // the compass tape along the top margin
    const tapeY = A.y - 12, span = A.w * 0.5, degPx = span / 90;
    g.lineWidth = 1.5;
    const hd = ((s.heading % 360) + 360) % 360;
    for (let d = Math.floor((hd - 45) / 10) * 10; d <= hd + 45; d += 10) {
      const x = cx + (d - hd) * degPx, k = ((d % 360) + 360) % 360, big = k % 45 === 0;
      g.globalAlpha = Math.max(0, 1 - Math.abs(d - hd) / 50);
      g.beginPath(); g.moveTo(x, tapeY); g.lineTo(x, tapeY - (big ? 10 : 5)); g.stroke();
      if (k % 90 === 0) { g.beginPath(); g.arc(x, tapeY - 15, k === 0 ? 3.5 : 2, 0, Math.PI * 2); g.fill(); }
    }
    g.globalAlpha = 1;
    g.beginPath(); g.moveTo(cx, tapeY + 5); g.lineTo(cx - 5, tapeY + 11); g.lineTo(cx + 5, tapeY + 11); g.closePath(); g.fill();
    // the sextant's arc down the left margin
    const sx = A.x - 16, sy = H / 2, R = A.h * 0.42;
    g.beginPath(); g.arc(sx + R, sy, R, Math.PI * 0.8, Math.PI * 1.2); g.stroke();
    for (let a = -60; a <= 60; a += 15) { const t = Math.PI - (a * Math.PI) / 180 * 0.33, x = sx + R + Math.cos(t) * R, y = sy - Math.sin(t) * R; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (a % 30 === 0 ? 8 : 4), y); g.stroke(); }
    { const t = Math.PI - s.pitch * 0.33, x = sx + R + Math.cos(t) * R, y = sy - Math.sin(t) * R; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 9, y - 5); g.lineTo(x + 9, y + 5); g.closePath(); g.fill(); }
    // the clock, at the top right inside the picture's corner
    const kx = A.x + A.w - 36, ky = A.y + 36;
    g.strokeStyle = 'rgba(241,223,186,.85)'; g.fillStyle = 'rgba(241,223,186,.85)';
    g.lineWidth = 2; g.beginPath(); g.arc(kx, ky, 20, 0, Math.PI * 2); g.stroke();
    for (const [len, a] of [[15, s.tide * Math.PI * 2 * 4], [9, s.tide * Math.PI * 2]]) { g.beginPath(); g.moveTo(kx, ky); g.lineTo(kx + Math.sin(a) * len, ky - Math.cos(a) * len); g.stroke(); }
    // the date stamp, bottom right inside the picture: the camera's own orange LCD (ui/datestamp.js)
    { const h = Math.max(10, A.h * 0.035); drawStamp(g, stampText(), A.x + A.w - h * 0.8, A.y + A.h - h * 1.8, h); }
    // the Rule of Thirds knack (progress/knacks.js `ruleOfThirds`): two faint lines each way where photo.js's placement credits the thirds (the
    // screen's own NDC +-1/3, so the lines are honest to the score), drawn only inside the picture, with a small ring at each of the four crossings
    if (s.thirds) {
      g.save(); g.beginPath(); roundRect(g, A.x, A.y, A.w, A.h, r); g.clip();
      g.strokeStyle = 'rgba(255,240,210,.32)'; g.lineWidth = 1;
      for (const k of [1 / 3, 2 / 3]) { g.beginPath(); g.moveTo(W * k, A.y); g.lineTo(W * k, A.y + A.h); g.moveTo(A.x, H * k); g.lineTo(A.x + A.w, H * k); g.stroke(); }
      g.strokeStyle = 'rgba(255,240,210,.5)';
      for (const kx of [1 / 3, 2 / 3]) for (const ky of [1 / 3, 2 / 3]) { g.beginPath(); g.arc(W * kx, H * ky, 4, 0, Math.PI * 2); g.stroke(); }
      g.restore();
    }
    // the subjects in frame: focus brackets
    for (const b of s.brackets || []) {
      const x = (b.x * 0.5 + 0.5) * W, y = (-b.y * 0.5 + 0.5) * H, h = Math.max(14, b.h * H * 0.5), w2 = h * 0.8, L = h * 0.35;
      g.strokeStyle = b.engaged ? VERM : b.stars >= 3 ? '#fff6dc' : b.stars === 2 ? 'rgba(255,240,210,.85)' : 'rgba(255,240,210,.45)';
      g.lineWidth = b.stars >= 3 || b.engaged ? 2.5 : 1.5;
      for (const [sx2, sy2] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const px = x + sx2 * w2, py = y + sy2 * h; g.beginPath(); g.moveTo(px, py - sy2 * L); g.lineTo(px, py); g.lineTo(px - sx2 * L, py); g.stroke(); }
    }
    // the capture circle and its charge (Fatal Frame); the shutter chance turns it white
    const cr = H * 0.16;
    g.strokeStyle = 'rgba(255,240,210,.45)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, H / 2, cr, 0, Math.PI * 2); g.stroke();
    if (s.charge > 0) {
      g.strokeStyle = s.chance ? '#ffffff' : s.charge >= 1 ? '#ffd2b0' : VERM; g.lineWidth = s.charge >= 1 ? 5 : 3;
      g.beginPath(); g.arc(cx, H / 2, cr + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, s.charge)); g.stroke();
    }
    g.fillStyle = 'rgba(255,240,210,.8)'; g.beginPath(); g.arc(cx, H / 2, 2.5, 0, Math.PI * 2); g.fill();
    // along the foot margin: the zoom (left), the memory (right)
    g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 1.5;
    const zx = A.x + 20, zy = A.y + A.h + 16;
    g.beginPath(); g.moveTo(zx, zy); g.lineTo(zx + 120, zy); g.stroke();
    g.beginPath(); g.arc(zx + 120 * s.zoom, zy, 4, 0, Math.PI * 2); g.fill();
    if (s.memory) {
      const n = s.memory.of, gap = 9, x0 = A.x + A.w - 20 - n * gap;
      for (let i = 0; i < n; i++) { const x = x0 + i * gap; if (i < s.memory.left) g.strokeRect(x, zy - 4, 6, 8); else { g.globalAlpha = 0.25; g.fillRect(x, zy - 4, 6, 8); g.globalAlpha = 1; } }
    }
    // the stars the best subject would get, in the picture's lower right
    g.fillStyle = '#fff1c0';
    for (let i = 0; i < 4; i++) { g.globalAlpha = i < (s.stars || 0) ? 1 : 0.25; star(g, A.x + A.w - 24 - i * 22, A.y + A.h - 22, 8); }
    g.globalAlpha = 1;
  }
}

function roundRect(g, x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
