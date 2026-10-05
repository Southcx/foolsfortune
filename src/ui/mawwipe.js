// ---------------------------------------------------------------------------------------
// THE MAW WIPE: the seam into a Well covered (the owner: entering a Well lagged; Dovina's: "a descent through the maw"). The Great
// Dunemaw's own pool (vfx/dunemaw.js: ink, the labradorite's arms wound inward, an iridescent lip) opens from the middle of the view
// until it fills it, turns while the floor is built behind it, then its eye widens and lets the floor through. A loading screen with no
// words, and diegetic: you go down the thing you stepped into.
//
// It is drawn in the page, not in the scene, on purpose: the floor's building blocks the main thread, and a CSS rotation keeps turning on
// the compositor while it does, so the pool never freezes mid-turn (a WebGL wipe would hold its last frame). The swirl is painted once
// to a small canvas in the labradorite's colours; the iris in and out is a clip and a mask driven by the frame clock. Nothing flickers:
// one slow turn, two eased irises.
//
// Prior art: the iris wipe (silent film, Looney Tunes, Mario's star wipe), the swirl transition into battle of the sixth-generation
// RPGs (Final Fantasy X's shattering, Dragon Quest's spiral), and Okami's ink-swallow into another place.
//
//   game.mawWipe = new MawWipe(game)   .close(onCovered)  (about 0.6 s; calls back once the view is covered)   .open()  (about 0.7 s)
//   .covered   .active   (Petra times it: close, build the floor, open)
// ---------------------------------------------------------------------------------------

const CLOSE = 0.6, OPEN = 0.7;
const ease = (x) => x * x * (3 - 2 * x);

/** The pool, painted once: the arms of a whirlpool in the labradorite's flash, darker toward the eye, a lit lip at the rim. */
function paintPool(n = 384) {
  const c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), img = g.createImageData(n, n), d = img.data;
  const pal = (t) => { // (the labradorite's flash: blue, teal, gold, violet, round again)
    const k = [[0.18, 0.4, 0.95], [0.1, 0.78, 0.68], [0.92, 0.72, 0.22], [0.55, 0.3, 0.9]];
    t = ((t % 1) + 1) % 1 * 4; const i = Math.floor(t), f = t - i, a = k[i], b = k[(i + 1) % 4];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  };
  const sm = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const u = (x + 0.5) / n * 2 - 1, v = (y + 0.5) / n * 2 - 1, r = Math.hypot(u, v), a = Math.atan2(v, u), o = (y * n + x) * 4;
    if (r > 1) { d[o + 3] = 0; continue; }
    const arm = 0.5 + 0.5 * Math.sin(a * 3 + Math.log(Math.max(r, 0.02)) * 7);
    const arms = sm(0.6, 0.95, arm) * sm(0.04, 0.35, r);
    const p = pal(a * 0.16 + r * 0.6), lip = sm(0.82, 0.93, r) * (1 - sm(0.93, 1, r)), lp = pal(a * 0.16 + 0.3);
    const depth = 0.12 + 0.88 * sm(0, 0.6, r);
    let R = 0.02 + (p[0] * 0.85 - 0.02) * arms * 0.85, G = 0.015 + (p[1] * 0.85 - 0.015) * arms * 0.85, B = 0.03 + (p[2] * 0.85 - 0.03) * arms * 0.85;
    R = (R + (lp[0] * 1.1 - R) * lip * 0.9) * depth; G = (G + (lp[1] * 1.1 - G) * lip * 0.9) * depth; B = (B + (lp[2] * 1.1 - B) * lip * 0.9) * depth;
    d[o] = Math.min(255, R * 255); d[o + 1] = Math.min(255, G * 255); d[o + 2] = Math.min(255, B * 255); d[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export class MawWipe {
  constructor(game) {
    this.game = game;
    const el = this.el = document.createElement('div');
    el.id = 'mawwipe';
    Object.assign(el.style, { position: 'fixed', inset: '0', zIndex: '40', pointerEvents: 'none', display: 'none', overflow: 'hidden', background: 'transparent' });
    const pool = this.pool = paintPool();
    Object.assign(pool.style, { position: 'absolute', left: '50%', top: '50%', width: '160vmax', height: '160vmax', transform: 'translate(-50%, -50%)', animation: 'mawturn 9s linear infinite' });
    el.appendChild(pool);
    const st = document.createElement('style');
    st.textContent = '@keyframes mawturn { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(-360deg); } }'; // (inward: the arms wind toward the eye)
    document.head.appendChild(st);
    document.body.appendChild(el);
    this.k = 0; this.dir = 0; this.cb = null; this.raf = 0;
  }
  get covered() { return this.k >= 1 && this.dir >= 0; }
  get active() { return this.el.style.display !== 'none'; }

  /** The pool opens from the middle until it fills the view; then `onCovered` (build the floor behind it). */
  close(onCovered) { this.cb = onCovered || null; this.dir = 1; this.mode = 'close'; if (this.k >= 1) this.k = 0; this.show(); this.loop(); }
  /** Its eye widens and lets the floor through; then it is gone. */
  open() { this.dir = -1; this.mode = 'open'; this.k = 1; this.show(); this.loop(); }

  show() { this.el.style.display = ''; }
  loop() {
    cancelAnimationFrame(this.raf);
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now; // (a stalled frame does not jump the iris: it carries on from where it was)
      this.k = Math.min(1, Math.max(0, this.k + (this.dir > 0 ? dt / CLOSE : -dt / OPEN)));
      this.paint();
      if (this.dir > 0 && this.k >= 1) { const cb = this.cb; this.cb = null; cb?.(); return; } // (covered: held, still turning, until open())
      if (this.dir < 0 && this.k <= 0) { this.el.style.display = 'none'; this.el.style.clipPath = ''; this.pool.style.webkitMaskImage = this.pool.style.maskImage = ''; return; }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
  /** Closing: a circle of the pool grows from the middle. Opening: the pool stays and its eye widens to a hole the floor shows through. */
  paint() {
    const e = ease(this.k);
    if (this.mode === 'close') { this.el.style.clipPath = `circle(${(e * 75).toFixed(2)}vmax at 50% 50%)`; this.pool.style.webkitMaskImage = this.pool.style.maskImage = ''; }
    else {
      this.el.style.clipPath = '';
      const hole = ((1 - e) * 52).toFixed(2); // (in % of the pool's size: 52% is past every corner of the view)
      const m = `radial-gradient(circle at 50% 50%, transparent ${hole}%, black ${(+hole + 3).toFixed(2)}%)`;
      this.pool.style.webkitMaskImage = this.pool.style.maskImage = m;
    }
  }

  dispose() { cancelAnimationFrame(this.raf); this.el.remove(); }
}
