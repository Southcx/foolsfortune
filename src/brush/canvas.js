// ---------------------------------------------------------------------------------------
// THE CANVAS of the Celestial Brush: while it is open, the world is a painting and the screen is paper. The picture under it goes to
// sepia (a CSS backdrop filter over the game's canvas, faded in: no flicker, one soft change), a paper tint and grain lie over it,
// and the mouse draws in ink: black, with a violet sheen (the ink is Lachryma), thick where the hand goes slowly and thin where it
// flicks, tapering at both ends as a brush does. A drawing that means something TAKES (the ink flashes gold and draws into itself); one
// that means nothing RUNS (it greys and spreads and is gone). At the edge, a scroll of the shapes the brush knows, in faint ink, without
// a word on it.
//
// Prior art: Okami's Celestial Brush (the world pauses and turns to a sepia painting, the strokes are sumi-e ink and the brush's
// drawings are recognised when the brush lifts) and Magic Cat Academy (the symbol is drawn straight over the scene and vanishes the
// moment it is read). The line's weight follows the speed of the hand, as ink does (Okami, and every "brush" in a paint program).
//
//   const cv = new BrushCanvas()   cv.show(true|false)   cv.begin(x, y) / cv.extend(x, y) / cv.lift()   cv.pending() -> strokes
//   cv.take(tint) / cv.run() / cv.fade()  (what becomes of the pending drawing)   cv.cursor(x, y, ink)   cv.update(rawDt)
// ---------------------------------------------------------------------------------------
import { PICTOGRAMS } from './gesture.js';

const CSS = `
#brushcanvas { position: fixed; inset: 0; pointer-events: none; z-index: 40; opacity: 0; transition: opacity .16s ease-out; }
#brushcanvas.on { opacity: 1; }
#brushcanvas .paper { position: absolute; inset: 0; backdrop-filter: sepia(.8) saturate(.7) contrast(.92) brightness(1.03);
  background: radial-gradient(ellipse at center, rgba(246,228,190,.16) 0%, rgba(214,180,128,.34) 72%, rgba(120,84,52,.55) 100%); }
#brushcanvas .grain { position: absolute; inset: 0; opacity: .2; mix-blend-mode: multiply; }
#brushcanvas canvas.ink { position: absolute; inset: 0; width: 100%; height: 100%; }
#brushcanvas .scroll { position: absolute; right: 18px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 6px;
  padding: 10px 7px; background: rgba(246,228,190,.42); border: 1px solid rgba(60,34,20,.35); border-radius: 3px; box-shadow: 0 2px 10px rgba(40,20,10,.25); }
#brushcanvas .scroll canvas { width: 38px; height: 38px; opacity: .72; }
`;
const INK = '#0e0a0c', GLOW = 'rgba(110,60,170,0.3)';

function grainTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) { const v = 150 + Math.random() * 105; img.data[i] = v; img.data[i + 1] = v * 0.95; img.data[i + 2] = v * 0.86; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  return c.toDataURL();
}

/** Stroke a path of points as a brush would: a chain of round dabs, the width following the pressure (w) and tapering at the ends. */
function brushPath(g, pts, scale = 1, alpha = 1) {
  if (pts.length < 2) return;
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const tin = Math.min(16, L * 0.2), tout = Math.min(22, L * 0.25); // (the taper is by distance: a brush touches down and lifts off)
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(1, Math.ceil(d / 1.6));
    for (let k = 0; k < steps; k++) {
      const u = k / steps, x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u, at = s + d * u;
      const taper = Math.min(1, 0.3 + 0.7 * at / (tin || 1), 0.25 + 0.75 * (L - at) / (tout || 1));
      const w = (a.w + (b.w - a.w) * u) * taper * scale;
      g.globalAlpha = alpha * (0.82 + 0.18 * (a.j ?? 1));
      g.beginPath(); g.arc(x, y, Math.max(0.6, w * 0.5), 0, Math.PI * 2); g.fill();
    }
    s += d;
  }
  g.globalAlpha = 1;
}

export class BrushCanvas {
  constructor() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = (this.el = document.createElement('div')); el.id = 'brushcanvas';
    el.innerHTML = `<div class="paper"></div><div class="grain" style="background-image:url(${grainTexture()})"></div><canvas class="ink"></canvas><div class="scroll"></div>`;
    document.body.appendChild(el);
    this.cv = el.querySelector('canvas.ink');
    this.g = this.cv.getContext('2d');
    this.groups = []; // { strokes, state: 'wet'|'take'|'run'|'fade', t, tint }
    this.wet = null;
    this.cur = { x: 0, y: 0, ink: 1, on: false };
    this.open = false;
    const scroll = el.querySelector('.scroll');
    for (const [, strokes] of PICTOGRAMS) {
      const c = document.createElement('canvas'); c.width = c.height = 76;
      const g = c.getContext('2d'); g.fillStyle = INK;
      for (const s of strokes) brushPath(g, s.map((p, i) => ({ x: 8 + p.x * 60, y: 8 + p.y * 60, w: 5.5, j: 0.8 + 0.2 * Math.sin(i) })));
      scroll.appendChild(c);
    }
  }

  get size() { return { w: this.cv.width, h: this.cv.height }; }

  show(on) {
    this.open = on;
    this.el.classList.toggle('on', on);
    if (on) {
      const w = innerWidth, h = innerHeight;
      if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
      this.cur.x = w / 2; this.cur.y = h / 2;
    } else if (this.wet) this.fade();
  }

  // ---------------------------------------------------------------- drawing
  begin(x, y) {
    if (!this.wet) { this.wet = { strokes: [], state: 'wet', t: 0 }; this.groups.push(this.wet); }
    this.stroke = [{ x, y, w: 9, j: Math.random(), t: performance.now() }];
    this.wet.strokes.push(this.stroke);
  }
  extend(x, y) {
    const s = this.stroke;
    if (!s) return 0;
    const a = s[s.length - 1], d = Math.hypot(x - a.x, y - a.y);
    if (d < 2) return 0;
    const now = performance.now(), v = d / Math.max(1, now - a.t); // (px per ms)
    const w = Math.max(7, Math.min(17, 16 - v * 4));
    s.push({ x, y, w: a.w + (w - a.w) * 0.35, j: Math.random(), t: now });
    return d;
  }
  lift() { this.stroke = null; }
  get drawing() { return !!this.stroke; }
  /** The pending drawing's strokes (plain {x, y} arrays), or []. */
  pending() { return this.wet ? this.wet.strokes.map((s) => s.map((p) => ({ x: p.x, y: p.y }))) : []; }

  /** The pending drawing means something: it flashes (tinted) and draws in on itself. */
  take(tint = '#f2c35a') { if (this.wet) { this.wet.state = 'take'; this.wet.t = 0; this.wet.tint = tint; this.wet = null; } }
  /** It means nothing: it runs. */
  run() { if (this.wet) { this.wet.state = 'run'; this.wet.t = 0; this.wet = null; } }
  /** Let it go quietly (the brush closed mid-drawing). */
  fade() { if (this.wet) { this.wet.state = 'fade'; this.wet.t = 0; this.wet = null; } this.stroke = null; }

  cursor(x, y, ink) { this.cur.x = x; this.cur.y = y; this.cur.ink = ink; }

  // ---------------------------------------------------------------- per frame (real seconds)
  update(dt) {
    const g = this.g, W = this.cv.width, H = this.cv.height;
    if (!this.open && !this.groups.length) return;
    g.clearRect(0, 0, W, H);
    for (let i = this.groups.length - 1; i >= 0; i--) {
      const q = this.groups[i];
      q.t += dt;
      let alpha = 1, scale = 1, color = INK, glow = GLOW;
      if (q.state === 'take') {
        const k = q.t / 0.55;
        if (k >= 1) { this.groups.splice(i, 1); continue; }
        color = k < 0.3 ? q.tint : INK; glow = q.tint; alpha = 1 - Math.max(0, (k - 0.35) / 0.65); scale = 1 + 0.5 * Math.min(1, k * 3) * (1 - k);
      } else if (q.state === 'run') {
        const k = q.t / 0.7;
        if (k >= 1) { this.groups.splice(i, 1); continue; }
        color = '#4a4046'; glow = 'rgba(0,0,0,0)'; alpha = 0.8 * (1 - k); scale = 1 + 1.4 * k;
      } else if (q.state === 'fade') {
        const k = q.t / 0.3;
        if (k >= 1) { this.groups.splice(i, 1); continue; }
        alpha = 1 - k;
      }
      g.fillStyle = color; g.shadowColor = glow; g.shadowBlur = q.state === 'take' ? 18 : 7;
      for (const s of q.strokes) brushPath(g, s, scale, alpha);
    }
    g.shadowBlur = 0;
    // the brush's point
    if (this.open) {
      const c = this.cur;
      g.globalAlpha = 0.9;
      g.strokeStyle = 'rgba(30,18,26,.85)'; g.lineWidth = 2;
      g.beginPath(); g.arc(c.x, c.y, 9, 0, Math.PI * 2); g.stroke();
      g.fillStyle = c.ink > 0.15 ? INK : '#8a7a70';
      g.beginPath(); g.moveTo(c.x, c.y + 2); g.lineTo(c.x - 4, c.y - 7); g.quadraticCurveTo(c.x, c.y - 13, c.x + 4, c.y - 7); g.closePath(); g.fill();
      g.globalAlpha = 1;
    }
  }
}
