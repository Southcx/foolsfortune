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
//
// The cost is paid once: each drawing is painted into its own layer as it is drawn, a dab at a time (and once more, whole, when a
// stroke lifts, for its tapered end); a frame only lays the layers down. The glow is a second canvas blurred by the browser, not a
// shadow on every dab, so a long drawing costs no more to show than a short one.
// ---------------------------------------------------------------------------------------
import { PICTOGRAMS } from './gesture.js';
import { stream } from '../../core/rng.js';
const simRand = stream('tools/soulbrush/canvas'); // (the simulation's chance: core/rng.js, the same twice)

const CSS = `
#brushcanvas { position: fixed; inset: 0; pointer-events: none; z-index: 40; opacity: 0; transition: opacity .16s ease-out; }
#brushcanvas.on { opacity: 1; }
#brushcanvas .paper { position: absolute; inset: 0; backdrop-filter: sepia(.8) saturate(.7) contrast(.92) brightness(1.03);
  background: radial-gradient(ellipse at center, rgba(246,228,190,.16) 0%, rgba(214,180,128,.34) 72%, rgba(120,84,52,.55) 100%); }
#brushcanvas .grain { position: absolute; inset: 0; opacity: .2; mix-blend-mode: multiply; }
#brushcanvas canvas.ink, #brushcanvas canvas.glow { position: absolute; inset: 0; width: 100%; height: 100%; }
#brushcanvas canvas.glow { filter: blur(5px); opacity: .5; }
#brushcanvas .scroll { position: absolute; right: 18px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 6px;
  padding: 10px 7px; background: rgba(246,228,190,.42); border: 1px solid rgba(60,34,20,.35); border-radius: 3px; box-shadow: 0 2px 10px rgba(40,20,10,.25); }
#brushcanvas .scroll canvas { width: 38px; height: 38px; opacity: .72; }
`;
const INK = '#0e0a0c', GLOW = '#6e3caa';

function grainTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) { const v = 150 + simRand() * 105; img.data[i] = v; img.data[i + 1] = v * 0.95; img.data[i + 2] = v * 0.86; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  return c.toDataURL();
}

/** Stroke a path of points as a brush would: a chain of round dabs, the width following the pressure (w) and tapering at the ends
 *  (`from`: only the dabs from that point on, for a stroke still being drawn; `open`: its end is not yet known, so no taper there). */
function brushPath(g, pts, scale = 1, alpha = 1, from = 1, open = false) {
  if (pts.length < 2) return;
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const tin = open ? 16 : Math.min(16, L * 0.2), tout = Math.min(22, L * 0.25); // (the taper is by distance: a brush touches down and lifts off)
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(1, Math.ceil(d / 1.6));
    if (i < from) { s += d; continue; }
    for (let k = 0; k < steps; k++) {
      const u = k / steps, x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u, at = s + d * u;
      const taper = Math.min(1, 0.3 + 0.7 * at / (tin || 1), open ? 1 : 0.25 + 0.75 * (L - at) / (tout || 1));
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
    el.innerHTML = `<div class="paper"></div><div class="grain" style="background-image:url(${grainTexture()})"></div><canvas class="glow"></canvas><canvas class="ink"></canvas><div class="scroll"></div>`;
    document.body.appendChild(el);
    this.cv = el.querySelector('canvas.ink');
    this.g = this.cv.getContext('2d');
    this.glowCv = el.querySelector('canvas.glow');
    this.glow = this.glowCv.getContext('2d');
    this.groups = []; // { strokes, state: 'wet'|'take'|'run'|'fade', t, layer, tinted, cx, cy }
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
      for (const c of [this.cv, this.glowCv]) if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      this.cur.x = w / 2; this.cur.y = h / 2;
    } else if (this.wet) this.fade();
  }

  layer() { const c = document.createElement('canvas'); c.width = this.cv.width; c.height = this.cv.height; const g = c.getContext('2d'); g.fillStyle = INK; return { c, g }; }

  // ---------------------------------------------------------------- drawing
  begin(x, y) {
    if (!this.wet) { this.wet = { strokes: [], state: 'wet', t: 0, layer: this.layer() }; this.groups.push(this.wet); this.glow.clearRect(0, 0, this.glowCv.width, this.glowCv.height); }
    this.stroke = [{ x, y, w: 9, j: simRand(), t: performance.now() }];
    this.stroke.done = 1;
    this.wet.strokes.push(this.stroke);
  }
  extend(x, y) {
    const s = this.stroke;
    if (!s) return 0;
    const a = s[s.length - 1], d = Math.hypot(x - a.x, y - a.y);
    if (d < 2) return 0;
    const now = performance.now(), v = d / Math.max(1, now - a.t); // (px per ms)
    const w = Math.max(7, Math.min(17, 16 - v * 4));
    s.push({ x, y, w: a.w + (w - a.w) * 0.35, j: simRand(), t: now });
    // paint the new piece now, once (its end is still open: no taper yet)
    const L = this.wet.layer;
    brushPath(L.g, s, 1, 1, s.done, true);
    this.glow.fillStyle = GLOW; brushPath(this.glow, s, 1.6, 1, s.done, true);
    s.done = s.length;
    return d;
  }
  lift() {
    // the stroke is whole: paint it once more, from its start, so it tapers off where the brush lifted
    const s = this.stroke, q = this.wet;
    this.stroke = null;
    if (!s || !q) return;
    const L = q.layer;
    L.g.clearRect(0, 0, L.c.width, L.c.height);
    for (const st of q.strokes) brushPath(L.g, st);
  }
  get drawing() { return !!this.stroke; }
  /** The pending drawing's strokes (plain {x, y} arrays), or []. */
  pending() { return this.wet ? this.wet.strokes.map((s) => s.map((p) => ({ x: p.x, y: p.y }))) : []; }

  /** Close the pending drawing: what becomes of it (a flash in a tint, a run, a fade). */
  close(state, tint) {
    const q = this.wet;
    if (!q) return;
    q.state = state; q.t = 0; this.wet = null; this.stroke = null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of q.strokes) for (const p of s) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    q.cx = (x0 + x1) / 2; q.cy = (y0 + y1) / 2;
    if (tint) {
      // a tinted silhouette of it, made once: the flash is that laid over the ink
      const T = this.layer();
      T.g.drawImage(q.layer.c, 0, 0);
      T.g.globalCompositeOperation = 'source-in'; T.g.fillStyle = tint; T.g.fillRect(0, 0, T.c.width, T.c.height);
      q.tinted = T.c;
    }
    this.glow.clearRect(0, 0, this.glowCv.width, this.glowCv.height);
  }
  /** The pending drawing means something: it flashes (tinted) and draws in on itself. */
  take(tint = '#f2c35a') { this.close('take', tint); }
  /** It means nothing: it runs. */
  run() { this.close('run', '#4a4046'); }
  /** Let it go quietly (the brush closed mid-drawing). */
  fade() { this.close('fade'); }

  cursor(x, y, ink) { this.cur.x = x; this.cur.y = y; this.cur.ink = ink; }

  // ---------------------------------------------------------------- per frame (real seconds): lay the layers down
  update(dt) {
    const g = this.g, W = this.cv.width, H = this.cv.height;
    if (!this.open && !this.groups.length) return;
    g.clearRect(0, 0, W, H);
    for (let i = this.groups.length - 1; i >= 0; i--) {
      const q = this.groups[i];
      q.t += dt;
      let alpha = 1, scale = 1, flash = 0, over = null;
      if (q.state === 'take') {
        const k = q.t / 0.55;
        if (k >= 1) { this.groups.splice(i, 1); continue; }
        flash = Math.max(0, 1 - k / 0.4); alpha = 1 - Math.max(0, (k - 0.35) / 0.65); scale = 1 + 0.4 * Math.min(1, k * 3) * (1 - k); over = q.tinted;
      } else if (q.state === 'run') {
        const k = q.t / 0.7;
        if (k >= 1) { this.groups.splice(i, 1); continue; }
        alpha = 0.8 * (1 - k); scale = 1 + 1.2 * k; flash = 1; over = q.tinted;
      } else if (q.state === 'fade') {
        const k = q.t / 0.3;
        if (k >= 1) { this.groups.splice(i, 1); continue; }
        alpha = 1 - k;
      }
      g.save();
      if (scale !== 1) { g.translate(q.cx, q.cy); g.scale(scale, scale); g.translate(-q.cx, -q.cy); }
      g.globalAlpha = alpha; g.drawImage(q.layer.c, 0, 0);
      if (over && flash > 0) { g.globalAlpha = alpha * flash; g.drawImage(over, 0, 0); }
      g.restore();
    }
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
