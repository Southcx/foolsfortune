// ---------------------------------------------------------------------------------------
// THE DRAWN SIGN (godhand/miracles.js: MMB held draws a feeling's sign over the ground; GODHAND.md section 4): written in the house's
// hand, the Soul Brush's ink (tools/soulbrush/canvas.js `brushPath`, `INK`, `GLOW`: a chain of round dabs, thick where the hand goes
// slowly and thin where it flicks, tapering where it touches down and lifts off), its violet sheen a second canvas the browser blurs
// (the Lachryma in the ink), straight over the world and with no paper under it: the hand writes on the island, not on a page. A sign
// read and called TAKES: it flashes in the feeling's colour and draws into itself (0.55 real s); a sign that is not read, or not paid,
// RUNS: it greys and spreads and is gone (0.7). Painted once as it is drawn, a dab at a time, and once more whole when the button lifts
// (its tapered end); a frame only lays the layers down.
//
// Prior art: Okami's Celestial Brush (the stroke in sumi ink, read when the brush lifts), Black & White's gesture drawn over the land
// (the hand's trail glowing as it goes), and Magic Cat Academy (the symbol vanishing the moment it is read); the stroke itself is the
// Soul Brush's, reused.
//
//   const S = new GodSign()   S.begin(x, y)   S.extend(x, y)   S.lift()   S.close(tint | null) (take in a CSS colour, or run)   S.fade()
//   S.update(rawDt)   S.dispose()
// ---------------------------------------------------------------------------------------
import { brushPath, INK, GLOW } from '../../tools/soulbrush/canvas.js';

const CSS = `
#godsign { position: fixed; inset: 0; pointer-events: none; z-index: 5; }
#godsign canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
#godsign canvas.glow { filter: blur(6px); opacity: .7; }
`;
const TAKE = 0.55, RUN = 0.7, FADE = 0.3; // (real seconds)

export class GodSign {
  constructor() {
    this.el = null; this.groups = []; this.wet = null; this.stroke = null;
  }
  make() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = (this.el = document.createElement('div')); el.id = 'godsign';
    el.innerHTML = '<canvas class="glow"></canvas><canvas class="ink"></canvas>';
    document.body.appendChild(el);
    this.glowCv = el.querySelector('canvas.glow'); this.glow = this.glowCv.getContext('2d');
    this.cv = el.querySelector('canvas.ink'); this.g = this.cv.getContext('2d');
    this.style = st;
  }
  fit() { const w = innerWidth, h = innerHeight; for (const c of [this.cv, this.glowCv]) if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } }
  layer() { const c = document.createElement('canvas'); c.width = this.cv.width; c.height = this.cv.height; const g = c.getContext('2d'); g.fillStyle = INK; return { c, g }; }

  begin(x, y) {
    if (!this.el) this.make();
    this.fit();
    if (!this.wet) { this.wet = { strokes: [], state: 'wet', t: 0, layer: this.layer() }; this.groups.push(this.wet); this.glow.clearRect(0, 0, this.glowCv.width, this.glowCv.height); }
    this.stroke = [{ x, y, w: 10, j: Math.random(), t: performance.now() }]; this.stroke.done = 1;
    this.wet.strokes.push(this.stroke);
  }
  extend(x, y) {
    const s = this.stroke; if (!s) return;
    const a = s[s.length - 1], d = Math.hypot(x - a.x, y - a.y); if (d < 2) return;
    const now = performance.now(), v = d / Math.max(1, now - a.t), w = Math.max(7, Math.min(19, 18 - v * 4)); // (px per ms: slow is thick)
    s.push({ x, y, w: a.w + (w - a.w) * 0.35, j: Math.random(), t: now });
    brushPath(this.wet.layer.g, s, 1, 1, s.done, true);
    this.glow.fillStyle = GLOW; brushPath(this.glow, s, 1.8, 1, s.done, true);
    s.done = s.length;
  }
  /** The button lifted: the strokes painted again whole, so each tapers off where it lifted. */
  lift() {
    const q = this.wet; this.stroke = null; if (!q) return;
    q.layer.g.clearRect(0, 0, q.layer.c.width, q.layer.c.height);
    for (const st of q.strokes) brushPath(q.layer.g, st);
  }
  /** What becomes of the sign: taken in a tint (it was read and called), or run (null: not read, not known, not paid). */
  close(tint) {
    const q = this.wet; if (!q) return;
    this.wet = null; this.stroke = null; q.t = 0; q.state = tint ? 'take' : 'run';
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of q.strokes) for (const p of s) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    q.cx = (x0 + x1) / 2; q.cy = (y0 + y1) / 2;
    const T = this.layer(); T.g.drawImage(q.layer.c, 0, 0); T.g.globalCompositeOperation = 'source-in'; T.g.fillStyle = tint || '#4a4046'; T.g.fillRect(0, 0, T.c.width, T.c.height);
    q.tinted = T.c;
    this.glow.clearRect(0, 0, this.glowCv.width, this.glowCv.height);
  }
  /** Let it go quietly (the hand put away mid-sign). */
  fade() { const q = this.wet; if (!q) return; this.wet = null; this.stroke = null; q.state = 'fade'; q.t = 0; this.glow?.clearRect(0, 0, this.glowCv.width, this.glowCv.height); }

  update(dt) {
    if (!this.el || (!this.groups.length && !this.drawn)) return;
    const g = this.g; g.clearRect(0, 0, this.cv.width, this.cv.height);
    this.drawn = this.groups.length > 0;
    for (let i = this.groups.length - 1; i >= 0; i--) {
      const q = this.groups[i]; q.t += dt;
      let alpha = 1, scale = 1, flash = 0;
      if (q.state === 'take') { const k = q.t / TAKE; if (k >= 1) { this.groups.splice(i, 1); continue; } flash = Math.max(0, 1 - k / 0.5); alpha = 1 - Math.max(0, (k - 0.35) / 0.65); scale = 1 - 0.35 * Math.max(0, k - 0.3); }
      else if (q.state === 'run') { const k = q.t / RUN; if (k >= 1) { this.groups.splice(i, 1); continue; } alpha = 0.8 * (1 - k); scale = 1 + 1.2 * k; flash = 1; }
      else if (q.state === 'fade') { const k = q.t / FADE; if (k >= 1) { this.groups.splice(i, 1); continue; } alpha = 1 - k; }
      g.save();
      if (scale !== 1) { g.translate(q.cx, q.cy); g.scale(scale, scale); g.translate(-q.cx, -q.cy); }
      g.globalAlpha = alpha; g.drawImage(q.layer.c, 0, 0);
      if (q.tinted && flash > 0) { g.globalAlpha = alpha * flash; g.drawImage(q.tinted, 0, 0); }
      g.restore();
    }
  }

  dispose() { this.el?.remove(); this.style?.remove(); this.el = null; this.groups.length = 0; }
}
