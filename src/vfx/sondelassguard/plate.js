// ---------------------------------------------------------------------------------------
// THE SONDELASS'S GUARD: its words (part of vfx/sondelassguard.js), the only words it carries, in the System's type (ui/theme.js; the
// style bible, OVERLAY.md 10.2: a name is carved, a count is computed):
//   THE PLATE   under the guard, a small System window glazed in the window colour with the schiller's frame (the tube's tag's hand,
//               vfx/lachrimetertube.js drawTag): the form in hand in Cinzel (CUTLASS, ROD, HOOK), rolled as a slot reel when the form
//               changes; in the rod form a second line, the lure's feeling in Jersey 15 in its own colour, rolled as the ring turns, and
//               "? ? ?" in grey while the ring passes over a dark seat
//   THE COUNT   on the hook's ruler, the distance to where the aim would bite, "22 m" in Jersey 15, outlined dark
// Each a canvas redrawn only when what it says changes (two texture pixels a dot), on a plane in the guard's own dots.
//
// Prior art: the slot reel (OVERLAY.md 10.2, Balatro's rolling count), the mock's plate() and hookCount() (board v9), the brass name
// plate under an instrument's dial.
//
//   const P = new GuardPlate()        P.mesh   P.draw({ a, b, p, feel, i0, i1, ff, known, fr })   (sizes the mesh, in dots)
//   const N = new GuardCount()        N.mesh   N.draw(text, colour)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { overlayFlat } from '../lachrimetertube.js';
import { FONT, THEMES, theme } from '../../ui/theme.js';
import { COLOR } from '../../progress/weather.js';
import { FEELINGS } from './atlas.js';

const K = 2, FN = 14; // (texture pixels a dot; the words' size in dots: the bible's floor)
const NAME_FONT = `600 ${FN * K}px ${FONT.title}`, COUNT_FONT = `${FN * K}px 'Jersey 15', ${FONT.sys}`;
const FILM = ['#4c0fb3', '#0a8cbf', '#f2b82e', '#d91a80'];
const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;
const lift = (h, f) => { const n = parseInt(h.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * f)); return `rgb(${c.join(',')})`; };

function chamfer(x, X, Y, w, h, c) { x.beginPath(); x.moveTo(X + c, Y); x.lineTo(X + w, Y); x.lineTo(X + w, Y + h - c); x.lineTo(X + w - c, Y + h); x.lineTo(X, Y + h); x.lineTo(X, Y + c); x.closePath(); }
const texOf = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t; };

export class GuardPlate {
  constructor() {
    this.c = document.createElement('canvas'); this.c.width = this.c.height = 8; this.t = texOf(this.c);
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), overlayFlat({ map: this.t, depthTest: false, depthWrite: false }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 20; this.w = 1; this.h = 1;
  }
  /** a, b: the names rolling (p 0..1 from a to b); fr: the feeling line's share (0 none, 1 whole); i0, i1, ff: the feelings rolling (display
   *  order) and how far; known: which are awakened (display order). */
  draw({ a, b, p, fr, i0, i1, ff, known }) {
    const t = THEMES[theme.id] || THEMES.verdigris, c = this.c; let x = c.getContext('2d');
    x.font = NAME_FONT; const w1 = Math.max(x.measureText(a).width, x.measureText(b).width);
    x.font = COUNT_FONT; const w2 = fr > 0.02 ? Math.max(...FEELINGS.map((f) => x.measureText(f.toUpperCase()).width)) : 0;
    const pad = 9 * K, o = K, lh = Math.round(FN * 1.2 * K), W = Math.ceil(Math.max(w1, w2) + 2 * pad), H = Math.round(lh + 6 * K + lh * fr);
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; this.t.dispose(); this.t = this.mesh.material.uniforms.uMap.value = texOf(c); }
    x = c.getContext('2d'); x.clearRect(0, 0, W, H);
    const cut = 4 * K; chamfer(x, 0, 0, W, H, cut);
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgb(${t.top})`); g.addColorStop(1, `rgb(${t.bot})`); x.fillStyle = g; x.fill();
    x.strokeStyle = t.mid; x.globalAlpha = 0.55; x.lineWidth = o; chamfer(x, 2.5 * o, 2.5 * o, W - 5 * o, H - 5 * o, cut - o); x.stroke(); x.globalAlpha = 1;
    const lg = x.createLinearGradient(0, 0, W, H); FILM.forEach((col, i) => lg.addColorStop(i / 3, col)); x.strokeStyle = lg; chamfer(x, 0.5 * o, 0.5 * o, W - o, H - o, cut); x.stroke();
    x.fillStyle = t.hi; x.globalAlpha = 0.55; x.beginPath(); x.moveTo(W - cut - o, o); x.lineTo(W - o, o); x.lineTo(W - o, cut + o); x.closePath(); x.fill(); x.globalAlpha = 1;
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    // the name, a reel
    x.save(); x.beginPath(); x.rect(o, o, W - 2 * o, lh + 3 * K); x.clip();
    const dy = Math.round(p * lh), ty = 3 * K + Math.round(FN * K * 0.95); x.font = NAME_FONT;
    for (const [s, y] of [[a, ty - dy], [b, ty - dy + lh]]) { x.fillStyle = t.lo; x.fillText(s, W / 2, y + o); x.fillStyle = t.hi; x.fillText(s, W / 2, y); }
    x.restore();
    // the lure's feeling, a reel (the rod form)
    if (fr > 0.02) {
      x.save(); x.globalAlpha = fr; const y0 = lh + 3 * K; x.beginPath(); x.rect(o, y0, W - 2 * o, lh); x.clip(); x.font = COUNT_FONT;
      const d2 = Math.round(ff * lh), ty2 = y0 + Math.round(FN * K * 0.9);
      for (const [i, y] of [[i0, ty2 - d2], [i1, ty2 - d2 + lh]]) {
        const f = FEELINGS[i], k = known[i], wd = k ? f.toUpperCase() : '? ? ?';
        x.fillStyle = t.lo; x.fillText(wd, W / 2, y + o); x.fillStyle = !k ? '#8c837d' : f === 'dread' ? '#7fae8a' : lift(hex(COLOR[f]), 0.2); x.fillText(wd, W / 2, y);
      }
      x.restore();
    }
    this.t.needsUpdate = true; this.w = W / K; this.h = H / K;
    this.mesh.scale.set(this.w, this.h, 1);
  }
}

export class GuardCount {
  constructor() {
    this.c = document.createElement('canvas'); this.c.width = 60 * K; this.c.height = 20 * K; this.t = texOf(this.c);
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), overlayFlat({ map: this.t, depthTest: false, depthWrite: false }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 21; this.mesh.scale.set(60, 20, 1);
  }
  draw(text, colour) {
    const c = this.c, x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height);
    x.font = COUNT_FONT; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    x.lineWidth = 2.2 * K; x.strokeStyle = 'rgba(16,11,22,.9)'; x.strokeText(text, c.width / 2, c.height / 2); x.fillStyle = colour; x.fillText(text, c.width / 2, c.height / 2);
    this.t.needsUpdate = true;
  }
}
