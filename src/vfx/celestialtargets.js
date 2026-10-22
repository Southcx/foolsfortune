// ---------------------------------------------------------------------------------------
// CELESTIAL MODE'S TARGETS OVER THE PAPER (Dovina's TOOLS-TOGETHER.md 9; the owner, 2026-10-22: "selectable figment targets rendered on top
// of the paper ... the player can immediately see which figments they can affect"). While the Soul Brush's paper is up, what a dot can mark
// is shown clear of it: the paper parts round it (its sepia masked away in a soft hole, so the thing shows in its own colours), a thin sumi
// ring drawn round the hole as if brushed. Marked, the ring turns vermilion and your seal (drawSealFace, cradles.mine) is stamped beside it
// in vermilion ink, on the paper's top layer where nothing washes it; a second dot lifts it. The cheaper first route of the plan: the
// paper stays CSS (tools/soulbrush/canvas.js, `.paper`), this layer sits just over it; a screen pass is Petra's to take later.
//
// What is selectable and where it is on screen are the brush's (Dovina's rule, Petra's pick): each frame the paper is up the brush hands
// the list here. Nothing is decided here.
//
// Prior art: Okami's Celestial Brush (the canvas turns to paper, the brush's targets stay readable on it), Magic Cat Academy (only what
// you can affect drawn bright), the hanko pressed on a scroll painting beside what it claims, sumi-e's single ring (the ensō).
//
//   game.celestialTargets = new CelestialTargets(game)
//   .show([{ id, x, y, r, marked }])   (each frame while the paper is up: x, y, r in CSS pixels, the thing's screen centre and radius)
//   .hide()                            (the paper put away)
// ---------------------------------------------------------------------------------------
import { drawSealFace } from './sealface.js';

export const CELESTIAL_TARGETS = {
  ring: '#16100e', vermilion: '#e0442a', // (the sumi and the seal ink)
  hole: 0.86, soft: 0.16,                // (the paper parts from this share of the radius, over this share more)
  minR: 14, maxR: 160,                   // (px: the ring's radius clamped, a far clapperjar still gets a ring a dot can find)
  stamp: 1.35, stampMin: 36, stampIn: 0.16, // (the seal's size against the radius, and at least (px, so a far thing's still reads); real s it takes to press down)
};
const C = CELESTIAL_TARGETS;
const hashId = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };

export class CelestialTargets {
  constructor(game) { this.game = game; this.cv = null; this.marks = new Map(); this.sealKey = ''; this.seal = null; this.on = false; }

  build() {
    if (this.cv || typeof document === 'undefined') return;
    const cv = (this.cv = document.createElement('canvas'));
    cv.id = 'celestialtargets';
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:41';
    document.body.appendChild(cv);
  }

  /** Your seal in vermilion, drawn once (and again if it changes). */
  stampOf() {
    const mine = this.game.cradles?.mine || null, key = JSON.stringify(mine);
    if (this.seal && key === this.sealKey) return this.seal;
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d'); drawSealFace(x, mine || { name: '', outline: 'round', carving: 'relief' }, { size: S, ink: C.vermilion });
    x.globalCompositeOperation = 'source-in'; x.fillStyle = C.vermilion; x.fillRect(0, 0, S, S); // (all of it the seal ink, whatever the face was drawn in)
    this.sealKey = key; this.seal = c; return c;
  }

  /** This frame's selectable things: the paper parts round each, a ring is brushed, the marked ones stamped. */
  show(list = []) {
    this.build(); if (!this.cv) return;
    const cv = this.cv, dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const now = performance.now() / 1000, seen = new Set(), holes = [];
    for (const t of list) {
      const r = Math.max(C.minR, Math.min(C.maxR, t.r || 0)), k = hashId(t.id ?? `${t.x | 0},${t.y | 0}`);
      holes.push(`radial-gradient(circle ${(r * (C.hole + C.soft)).toFixed(1)}px at ${t.x.toFixed(1)}px ${t.y.toFixed(1)}px, transparent ${(C.hole * 100).toFixed(0)}%, #000 100%)`);
      let m = this.marks.get(t.id);
      if (t.marked && !m) { m = { t0: now }; this.marks.set(t.id, m); }
      if (t.marked) seen.add(t.id);
      this.ring(g, t.x, t.y, r, k, t.marked ? C.vermilion : C.ring);
      if (t.marked) this.press(g, t.x, t.y, r, k, Math.min(1, (now - m.t0) / C.stampIn));
    }
    for (const id of this.marks.keys()) if (!seen.has(id)) this.marks.delete(id); // (lifted: a dot again, or gone)
    this.mask(holes);
    if (!this.on) { this.on = true; cv.style.display = 'block'; }
  }

  hide() {
    if (!this.on) return; this.on = false;
    if (this.cv) { this.cv.getContext('2d').clearRect(0, 0, this.cv.width, this.cv.height); this.cv.style.display = 'none'; }
    this.marks.clear(); this.mask([]);
  }

  /** The paper's sepia masked away in a soft hole round each (the paper's own element, tools/soulbrush/canvas.js `.paper`). */
  mask(holes) {
    const p = (this.paper && this.paper.isConnected) ? this.paper : (this.paper = document.querySelector('#brushcanvas .paper'));
    if (!p) return;
    const v = holes.length ? holes.join(',') : '';
    if (v === this.lastMask) return; this.lastMask = v;
    for (const s of [p.style]) {
      s.maskImage = s.webkitMaskImage = v; // (each layer hides only its own hole; intersected, the paper stays everywhere else)
      s.maskComposite = v ? 'intersect' : ''; s.webkitMaskComposite = v ? 'source-in' : '';
    }
  }

  /** An ensō-like ring brushed round it: two passes, thick to thin, a gap where the brush lifted. */
  ring(g, x, y, r, k, ink) {
    const a0 = k * Math.PI * 2, gap = 0.35 + k * 0.3;
    g.save(); g.lineCap = 'round'; g.strokeStyle = ink;
    for (let pass = 0; pass < 2; pass++) {
      const rr = r * (1 + pass * 0.035), w0 = pass ? 1.2 : 2.6, n = 28;
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n, t0 = a0 + u0 * (Math.PI * 2 - gap), t1 = a0 + u1 * (Math.PI * 2 - gap);
        g.lineWidth = w0 * (1.15 - 0.75 * u0); g.globalAlpha = pass ? 0.55 : 0.9;
        g.beginPath(); g.arc(x, y, rr + Math.sin(u0 * 9 + k * 20) * 0.8, t0, t1); g.stroke();
      }
    }
    g.restore();
  }

  /** Your seal pressed beside it, at its upper right over the ring, landing from a little larger as a stamp does. */
  press(g, x, y, r, k, p) {
    const S = this.stampOf(), size = Math.max(C.stampMin, r * C.stamp), e = 1 - (1 - p) ** 3, sc = 1.5 - 0.5 * e;
    const cx = x + r * 0.62, cy = y - r * 0.62;
    g.save(); g.translate(cx, cy); g.rotate((k - 0.5) * 0.3); g.scale(sc, sc); g.globalAlpha = 0.3 + 0.7 * e;
    g.shadowColor = 'rgba(224,68,42,.55)'; g.shadowBlur = 2; // (the ink's bleed into the paper)
    g.drawImage(S, -size / 2, -size / 2, size, size); g.drawImage(S, -size / 2, -size / 2, size, size); // (twice: a firm press, the lines full)
    g.restore();
  }
}
