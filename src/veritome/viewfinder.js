// ---------------------------------------------------------------------------------------
// THE VIEWFINDER and THE HAND: what the Veritome puts on the screen. Both are instruments, not messages: no words on them.
//
//  - The VIEWFINDER, while the lens is up: the view through the clock's glass, framed in brass. Along its top a compass tape (the
//    heading); down its left a sextant's arc (how far the lens is tipped up or down); in its corner the clock (the tide, as the cover's
//    hands keep it); over each subject in frame a pair of focus brackets, brighter for a better shot; in the middle the capture circle,
//    whose ring fills while a clapperjar is held in it (Fatal Frame's charge); and the shutter's one flash, after which the photograph
//    drops away into the Book's corner.
//  - The HAND, while the book is out: the card drawn (its face, or the Book's back when there is none), the clasp's three seal
//    sockets, and the draw's charges as pips.
//
// Prior art: Fatal Frame's Camera Obscura (the capture circle and its filling charge ring, the shutter chance), Pokémon Snap's
// viewfinder brackets, the Sheikah Slate's camera, and a sextant's arc and a compass card in brass.
//
//   vf.show(on)  vf.draw({ heading, pitch, tide, charge, brackets, zoom, chance })  vf.flash(thumb)   hand.render(book)  hand.show(on)
// ---------------------------------------------------------------------------------------
import { cardArt, SEALS } from './arcana.js';

const CSS = `
#viewfinder { position: fixed; inset: 0; pointer-events: none; z-index: 30; opacity: 0; transition: opacity .12s; }
#viewfinder.on { opacity: 1; }
#viewfinder canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
#viewfinder .flash { position: absolute; inset: 0; background: #fff8e6; opacity: 0; }
#viewfinder .dev { position: absolute; left: 50%; top: 50%; width: 200px; height: 125px; margin: -62px 0 0 -100px; border: 6px solid #f1dfba; box-shadow: 0 6px 24px rgba(0,0,0,.5);
  background-size: cover; background-position: center; opacity: 0; }
#bookhand { position: absolute; right: 24px; bottom: 20px; display: none; align-items: flex-end; gap: 10px; }
#bookhand.on { display: flex; }
#bookhand canvas.card { width: 46px; height: 77px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,.5); }
#bookhand .clasp { display: flex; flex-direction: column; gap: 5px; margin-bottom: 4px; }
#bookhand .clasp i { width: 16px; height: 16px; border-radius: 50%; border: 1px solid rgba(231,196,106,.6); background: rgba(20,14,40,.6); font-style: normal; font-size: 11px; line-height: 16px; text-align: center; }
#bookhand .pips { display: flex; gap: 3px; margin-bottom: 4px; }
#bookhand .pips b { width: 6px; height: 14px; border-radius: 2px; background: rgba(231,196,106,.25); border: 1px solid rgba(231,196,106,.5); }
#bookhand .pips b.on { background: #e7c46a; }
#bookhand .fx { display: flex; flex-direction: column; gap: 3px; margin-bottom: 4px; }
#bookhand .fx canvas { width: 18px; height: 30px; border-radius: 2px; opacity: .85; }
`;

export class Viewfinder {
  constructor() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = (this.el = document.createElement('div')); el.id = 'viewfinder';
    el.innerHTML = '<canvas></canvas><div class="dev"></div><div class="flash"></div>';
    document.body.appendChild(el);
    this.cv = el.querySelector('canvas'); this.g = this.cv.getContext('2d');
    this.flashEl = el.querySelector('.flash'); this.devEl = el.querySelector('.dev');
    this.on = false; this.flashT = 1; this.devT = 1;
  }
  show(on) { this.on = on; this.el.classList.toggle('on', on); }
  /** The aperture: the part of the screen the photograph is of (px). */
  aperture(W = innerWidth, H = innerHeight) { const w = W * 0.82, h = H * 0.8; return { x: (W - w) / 2, y: (H - h) / 2, w, h }; }

  flash(thumb) {
    this.flashT = 0; this.devT = 0;
    if (thumb) this.devEl.style.backgroundImage = `url(${thumb})`;
  }

  /** One frame (real seconds). */
  draw(dt, s) {
    this.flashT = Math.min(1, this.flashT + dt / 0.18);
    this.flashEl.style.opacity = String(0.85 * (1 - this.flashT) ** 2);
    this.devT = Math.min(1, this.devT + dt / 1.1);
    const u = this.devT;
    this.devEl.style.opacity = String(u < 1 ? Math.min(1, u * 6) * (1 - Math.max(0, (u - 0.6) / 0.4)) : 0);
    this.devEl.style.transform = `translate(${u * u * -(innerWidth * 0.36)}px, ${u * u * innerHeight * 0.32}px) rotate(${-8 * u}deg) scale(${1 - 0.55 * u})`;
    if (!this.on) return;
    const W = innerWidth, H = innerHeight, c = this.cv, g = this.g;
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    g.clearRect(0, 0, W, H);
    const A = this.aperture(W, H), r = 26;
    // the dark round the glass, and the brass frame
    g.fillStyle = 'rgba(10,6,4,.78)';
    g.beginPath(); g.rect(0, 0, W, H); roundRect(g, A.x, A.y, A.w, A.h, r); g.fill('evenodd');
    g.strokeStyle = '#c9923e'; g.lineWidth = 5; g.beginPath(); roundRect(g, A.x, A.y, A.w, A.h, r); g.stroke();
    g.strokeStyle = 'rgba(255,214,150,.35)'; g.lineWidth = 1.5; g.beginPath(); roundRect(g, A.x + 7, A.y + 7, A.w - 14, A.h - 14, r - 6); g.stroke();
    const gold = '#e7c46a';
    g.strokeStyle = gold; g.fillStyle = gold;
    // the compass tape along the top: a tick every 10 degrees, a long one every 45
    const cx = W / 2, tapeY = A.y - 16, span = A.w * 0.5, degPx = span / 90;
    g.lineWidth = 1.5;
    const hd = ((s.heading % 360) + 360) % 360;
    for (let d = Math.floor((hd - 45) / 10) * 10; d <= hd + 45; d += 10) {
      const x = cx + (d - hd) * degPx, k = ((d % 360) + 360) % 360, big = k % 45 === 0;
      g.globalAlpha = 1 - Math.abs(d - hd) / 50;
      g.beginPath(); g.moveTo(x, tapeY); g.lineTo(x, tapeY - (big ? 11 : 5)); g.stroke();
      if (k % 90 === 0) { g.beginPath(); g.arc(x, tapeY - 17, k === 0 ? 3.5 : 2, 0, Math.PI * 2); g.fill(); }
    }
    g.globalAlpha = 1;
    g.beginPath(); g.moveTo(cx, tapeY + 6); g.lineTo(cx - 5, tapeY + 13); g.lineTo(cx + 5, tapeY + 13); g.closePath(); g.fill();
    // the sextant's arc down the left: how far the lens is tipped
    const sx = A.x - 18, sy = H / 2, R = A.h * 0.42;
    g.beginPath(); g.arc(sx + R, sy, R, Math.PI * 0.8, Math.PI * 1.2); g.stroke();
    for (let a = -60; a <= 60; a += 15) { const t = Math.PI - (a * Math.PI) / 180 * 0.33, x = sx + R + Math.cos(t) * R, y = sy - Math.sin(t) * R; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (a % 30 === 0 ? 9 : 5), y); g.stroke(); }
    { const t = Math.PI - s.pitch * 0.33, x = sx + R + Math.cos(t) * R, y = sy - Math.sin(t) * R; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 10, y - 5); g.lineTo(x + 10, y + 5); g.closePath(); g.fill(); }
    // the clock in the corner: the tide
    const kx = A.x + A.w - 44, ky = A.y + 44;
    g.lineWidth = 2; g.beginPath(); g.arc(kx, ky, 24, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; g.beginPath(); g.arc(kx + Math.sin(a) * 18, ky - Math.cos(a) * 18, 2, 0, Math.PI * 2); g.fill(); }
    for (const [len, a] of [[18, s.tide * Math.PI * 2 * 4], [11, s.tide * Math.PI * 2]]) { g.beginPath(); g.moveTo(kx, ky); g.lineTo(kx + Math.sin(a) * len, ky - Math.cos(a) * len); g.stroke(); }
    // the subjects in frame: focus brackets, brighter for a better shot
    for (const b of s.brackets || []) {
      const x = (b.x * 0.5 + 0.5) * W, y = (-b.y * 0.5 + 0.5) * H, h = Math.max(14, b.h * H * 0.5), w2 = h * 0.8, L = h * 0.35;
      g.strokeStyle = b.stars >= 3 ? '#fff1c0' : b.stars === 2 ? gold : 'rgba(231,196,106,.55)'; g.lineWidth = b.stars >= 3 ? 2.5 : 1.5;
      for (const [sx2, sy2] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const px = x + sx2 * w2, py = y + sy2 * h; g.beginPath(); g.moveTo(px, py - sy2 * L); g.lineTo(px, py); g.lineTo(px - sx2 * L, py); g.stroke(); }
    }
    // the capture circle and its charge (Fatal Frame); a shutter chance turns it white
    const cr = H * 0.16;
    g.strokeStyle = 'rgba(231,196,106,.45)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, H / 2, cr, 0, Math.PI * 2); g.stroke();
    if (s.charge > 0) {
      g.strokeStyle = s.chance ? '#ffffff' : s.charge >= 1 ? '#fff1c0' : gold; g.lineWidth = s.charge >= 1 ? 5 : 3;
      g.beginPath(); g.arc(cx, H / 2, cr + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, s.charge)); g.stroke();
    }
    g.fillStyle = gold; g.beginPath(); g.arc(cx, H / 2, 2.5, 0, Math.PI * 2); g.fill();
    // the zoom along the foot
    const zx = cx - 60, zy = A.y + A.h + 16;
    g.strokeStyle = gold; g.lineWidth = 1.5; g.beginPath(); g.moveTo(zx, zy); g.lineTo(zx + 120, zy); g.stroke();
    g.beginPath(); g.arc(zx + 120 * s.zoom, zy, 4, 0, Math.PI * 2); g.fill();
    // the stars the best subject would get, as stars
    for (let i = 0; i < 4; i++) { g.globalAlpha = i < (s.stars || 0) ? 1 : 0.25; star(g, A.x + A.w - 26 - i * 22, A.y + A.h - 24, 8); }
    g.globalAlpha = 1;
  }
}

export class Hand {
  constructor() {
    const el = (this.el = document.createElement('div')); el.id = 'bookhand';
    document.getElementById('hud')?.appendChild(el);
    this.key = '';
  }
  show(on) { this.el.classList.toggle('on', on); }
  render(book) {
    const key = `${book.hand}|${book.seals.join()}|${book.charges}|${book.active.map((a) => a.id).join()}`;
    if (key === this.key) return;
    this.key = key;
    const el = this.el;
    el.innerHTML = '';
    const fx = document.createElement('div'); fx.className = 'fx';
    for (const a of book.active) { const c = small(a.id); if (c) fx.appendChild(c); }
    el.appendChild(fx);
    const card = cardArt(book.hand || 'back', 92, 154, !book.hand);
    const cv = document.createElement('canvas'); cv.className = 'card'; cv.width = 92; cv.height = 154; cv.getContext('2d').drawImage(card, 0, 0);
    el.appendChild(cv);
    const clasp = document.createElement('div'); clasp.className = 'clasp';
    for (let i = 0; i < 3; i++) { const s = book.seals[i], d = document.createElement('i'); if (s) { d.textContent = SEALS[s].glyph; d.style.color = SEALS[s].color; d.style.borderColor = SEALS[s].color; } clasp.appendChild(d); }
    el.appendChild(clasp);
    const pips = document.createElement('div'); pips.className = 'pips';
    for (let i = 0; i < 3; i++) { const b = document.createElement('b'); if (i < book.charges) b.className = 'on'; pips.appendChild(b); }
    el.appendChild(pips);
  }
}
function small(id) { if (id.startsWith('astrodyne')) return null; const c = document.createElement('canvas'); c.width = 36; c.height = 60; c.getContext('2d').drawImage(cardArt(id, 36, 60), 0, 0); return c; }
function roundRect(g, x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
