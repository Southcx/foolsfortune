// ---------------------------------------------------------------------------------------
// THE SAFARI LENS: the Veritome's raised lens drawn as a safari camera (GAPS G246; STEALTH.md 8.6), over Petra's viewfinder
// (tools/veritome/viewfinder.js), whose numbers it reads and whose drawing it stands in for. Pokemon Snap's and Fatal Frame's camera in
// the house's dress (the drawing: ui/safarilensdraw.js):
//
//   THE FRAME      the Veritome's oxblood boards round the aperture, a brass bezel knurled and screwed down, the glass inside it with
//                  its rim and glare; the instruments the viewfinder kept, engraved and inked in gold: the heading's tape on the top
//                  board, the pitch's arc on the left, the cover's clock in a brass dial, along the foot the zoom, the focus scale, the
//                  preview's stars in brass sockets and the memory's plates as a frame counter. The date stamp stays in the glass's
//                  corner (the device's own display, ui/datestamp.js), the thirds and the capture circle etched in the glass.
//   THE FOCUS      the best subject's brackets wear a focus ring that hunts, then closes onto it while it holds still and locks gold
//                  with a pulse; the focus scale's pointer runs out from infinity to its distance; on the desk the glass round it goes
//                  soft (a backdrop blur masked clear round the subject, wider while hunting): the finder's depth of field, never the
//                  plate's (the plate is cut from the frame drawn, before any of this).
//   THE SHUTTER    on `photo.take`: a held white frame of the flash, the six blades of a leaf shutter turning shut and open again in a
//                  quarter of a real second. Raising the lens opens the same iris.
//   THE PRINT      the plate on a card with a wide foot, slid up in the glass's lower left, its stars stamped into the foot's four
//                  sockets one by one (the score ceremony's slam: in big, under, settled, a ring off each), a candid plate's vermilion
//                  seal pressed over the photograph's corner (a shut eye: it never saw you), a held plate's gold rim; held a beat,
//                  then put by into the book's corner. No words: the log says what happened.
//
// The viewfinder skips its own pages while this is its skin (Petra's `vf.skin`, boot/warmup.js) and hands each frame's state to `take(s,
// aperture)`; its lids and falling plate are hidden (`body.safari-lens`), this lens's shutter and print in their place, so nothing is
// drawn twice. Without a fresh hand-off it reads the Veritome's own fields; `photo.take` gives the plate's stars and candid mark.
//
// Prior art, as on a museum label: Pokemon Snap (1999) and New Pokemon Snap (2021): the dark rounded finder, the brackets, the photograph
// after the shot with its stars; Fatal Frame (2001): the capture circle and its charge; a Rolleiflex's and a Leica's focus scale and
// bayonet brass; a Compur leaf shutter; the Polaroid's foot; New Pokemon Snap's stars by behaviour, the plate's own rating.
//
//   const L = new SafariLens(game)    L.update(dt)  (marks, raw clock)    L.read() -> { on, lock, shot } (tests)    SAFARI_LENS (the look's numbers)
// ---------------------------------------------------------------------------------------
import { drawStamp, stampText } from './datestamp.js';
import { LENS_INK, leatherPattern, drawBody, drawGlass, drawCompass, drawPitch, drawClock, drawFootScale, drawSockets, drawMemory, drawThirds, drawCapture, drawBrackets, drawFocusRing, drawIris, drawPrint } from './safarilensdraw.js';

export const SAFARI_LENS = {
  raise: 0.22,                    // real seconds the iris takes to open as the lens comes up
  shutter: { flash: 0.05, close: 0.07, shut: 0.04, open: 0.13 }, // the beat: the white held frame, the blades in, held shut, out
  focus: { lock: 0.38, still: 0.09, lost: 2.5, far: 45, near: 1, r: 0.5 }, // the lock's time, how far (NDC) the subject may move and stay locked, the hunt's fall, the scale's ends (m), a subject's guessed radius (m)
  dof: { blur: 1.6, hunt: 0.5, clear: 1.8, fall: 2.6 }, // (px of blur, locked / hunting; the clear disc round the subject as its height x clear, the fall to full blur x fall)  // the desk's soft glass round the focus (px of blur, locked / hunting)
  print: { in: 0.18, star: 0.13, seal: 0.16, hold: 1.25, out: 0.32, w: [150, 270], share: 0.24 }, // the print: its slide in, a star's beat, the seal's, held, put by; its width (px, a share of the aperture's)
};
const CSS = `
body.safari-lens #viewfinder .lid, body.safari-lens #viewfinder .dev { display: none !important; } /* (the blink and the put-by are this lens's shutter and print; the viewfinder's own pages it skips for a skin) */
#safarilens { position: fixed; inset: 0; pointer-events: none; z-index: 31; display: none; }
#safarilens.on { display: block; }
#safarilens canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
#safarilens .dof { position: absolute; display: none; }
`;
/** What the lens pulls focus onto: centre-weighted, as a camera's autofocus is (the biggest subject nearest the middle), not the best
 *  score (a far small thing scoring well would steal it from the creature in the circle). */
export function focusOf(brackets) {
  let best = null, bk = -1;
  for (const b of brackets || []) { const k = (b.h + 0.02) * Math.max(0.15, 1.4 - Math.hypot(b.x, b.y)) * (b.engaged ? 1.3 : 1); if (k > bk) { bk = k; best = b; } }
  return best;
}
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const easeOut = (x) => 1 - (1 - x) ** 3;
const easeBack = (x) => { const c = 1.6; x -= 1; return 1 + (c + 1) * x * x * x + c * x * x; };

export class SafariLens {
  constructor(game) {
    this.game = game;
    if (!document.getElementById('safarilens-style')) { const st = document.createElement('style'); st.id = 'safarilens-style'; st.textContent = CSS; document.head.appendChild(st); }
    const el = (this.el = document.createElement('div')); el.id = 'safarilens';
    el.innerHTML = '<div class="dof"></div><canvas></canvas>';
    document.body.appendChild(el);
    document.body.classList.add('safari-lens');
    this.cv = el.querySelector('canvas'); this.g = this.cv.getContext('2d'); this.dof = el.querySelector('.dof');
    this.pat = leatherPattern();
    this.t = 0; this.openK = 0; this.wasUp = false;
    this.focus = { x: 0, y: 0, h: 0, lock: 0, t: 0, pulse: 0, scale: 0, has: false };
    this.shot = null; this.img = null;
    this.mobile = !!game.graphics?.machine?.mobile;
    game.events?.on('photo.take', (e) => this.onShot(e));
  }

  /** The viewfinder's hand-off each frame the lens is up (viewfinder.js draw: `skin.take(s, aperture)`). */
  take(s, aperture) { this.taken = { s, aperture, t: this.t }; }

  /** What the lens draws from: the viewfinder's hand-off while it is fresh, else the Veritome's own fields. */
  state() {
    const g = this.game, V = g.veritome, P = g.player;
    if (!V) return null;
    const k = this.taken;
    if (k?.s && this.t - k.t < 0.25) {
      const s = k.s, A = k.aperture;
      return {
        up: !!V.lens, heading: s.heading ?? 0, pitch: s.pitch ?? 0, tide: s.tide ?? 0, charge: s.charge ?? 0, chance: !!s.chance,
        brackets: s.brackets || [], stars: s.stars || 0, zoom: s.zoom ?? 0, left: s.memory?.left ?? 0, of: s.memory?.of ?? 0, thirds: !!s.thirds,
        aperture: (W, H) => (A && W === innerWidth && H === innerHeight ? A : V.vf?.aperture?.(W, H) ?? { x: W * 0.1, y: H * 0.12, w: W * 0.8, h: H * 0.76 }),
      };
    }
    return {
      up: !!V.lens, heading: P ? ((Math.PI - P.yaw) * 180) / Math.PI : 0, pitch: P?.pitch ?? 0, tide: V.tide ?? 0,
      charge: V.charge ?? 0, chance: !!V.chance, brackets: V.preview?.brackets || [], stars: V.preview?.stars || 0,
      zoom: V.zoom ?? 0, left: V.memory?.left ?? 0, of: (V.memory?.left ?? 0) + (V.memory?.plates?.length ?? 0),
      thirds: !!g.knacks?.on?.('ruleOfThirds'), aperture: (W, H) => V.vf?.aperture?.(W, H) ?? { x: W * 0.1, y: H * 0.12, w: W * 0.8, h: H * 0.76 },
    };
  }

  onShot(e) {
    const V = this.game.veritome, thumb = V?.memory?.plates?.[V.memory.plates.length - 1]?.thumb || null;
    if (thumb) { this.img = new Image(); this.img.src = thumb; }
    this.shot = { t: 0, stars: Math.max(0, Math.min(4, e?.stars | 0)), candid: e?.candid === 'candid', held: !!e?.held, img: this.img };
  }

  update(dt) {
    dt = Math.min(0.1, dt || 0); this.t += dt;
    const s = this.state();
    const up = !!s?.up;
    if (up && !this.wasUp) this.openK = 0;
    this.wasUp = up;
    this.openK = up ? Math.min(1, this.openK + dt / SAFARI_LENS.raise) : 0;
    if (this.shot) { this.shot.t += dt; const P = SAFARI_LENS.print, end = this.printStart() + P.in + this.shot.stars * P.star + P.seal + P.hold + P.out; if (this.shot.t > end) this.shot = null; }
    const show = up || !!this.shot;
    this.el.classList.toggle('on', show);
    if (!show) { this.dof.style.display = 'none'; return; }
    const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1), c = this.cv, g = this.g;
    if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const A = s.aperture(W, H), k = Math.max(0.6, Math.min(1.5, Math.min(W, H) / 640));
    if (up) this.drawFinder(g, s, W, H, A, k, dt);
    else this.dof.style.display = 'none';
    if (up) this.drawShutter(g, A);
    if (this.shot) this.drawShotPrint(g, W, H, A, k);
  }

  drawFinder(g, s, W, H, A, k, dt) {
    const F = SAFARI_LENS.focus, cx = W / 2, m = A.y;
    // the focus: the best subject (the preview sorts by score) hunted, then locked while it holds still
    const b = focusOf(s.brackets);
    if (b) {
      const moved = Math.hypot(b.x - this.focus.x, b.y - this.focus.y);
      if (!this.focus.has || moved > F.still * 2.5) this.focus.lock = Math.min(this.focus.lock, 0.25);
      const was = this.focus.lock;
      this.focus.lock = moved > F.still ? Math.max(0, this.focus.lock - dt * F.lost) : Math.min(1, this.focus.lock + dt / F.lock);
      if (was < 1 && this.focus.lock >= 1) this.focus.pulse = 1;
      this.focus.x += (b.x - this.focus.x) * Math.min(1, dt * 14); this.focus.y += (b.y - this.focus.y) * Math.min(1, dt * 14);
      this.focus.h = b.h; this.focus.has = true;
      const tanH = Math.tan(((this.game.camera?.fov ?? 50) * Math.PI) / 360), d = b.d ?? F.r / Math.max(0.01, b.h * tanH);
      const t = clamp01(Math.log(F.far / Math.max(F.near, d)) / Math.log(F.far / F.near));
      this.focus.scale += (t * (0.4 + 0.6 * this.focus.lock) - this.focus.scale) * Math.min(1, dt * 6);
    } else {
      this.focus.has = false; this.focus.lock = Math.max(0, this.focus.lock - dt * F.lost);
      this.focus.scale += (0 - this.focus.scale) * Math.min(1, dt * 4);
    }
    this.focus.pulse = Math.max(0, this.focus.pulse - dt * 2.2);
    this.drawDof(W, H, A);
    // the glass's contents: the thirds, the capture circle, the subjects' brackets, the focus ring
    if (s.thirds) drawThirds(g, W, H, A);
    drawCapture(g, cx, H / 2, H * 0.16, s.charge, s.chance);
    let fb = null;
    for (const br of s.brackets) { const r = drawBrackets(g, br, W, H); if (br === b) fb = r; }
    if (fb) drawFocusRing(g, (this.focus.x * 0.5 + 0.5) * W, (-this.focus.y * 0.5 + 0.5) * H, fb.h * 1.15, this.focus.lock, this.t, this.focus.pulse);
    drawGlass(g, A, k);
    { const h = Math.max(10, A.h * 0.035); drawStamp(g, stampText(), A.x + A.w - h * 0.8, A.y + A.h - h * 1.8, h); }
    // the body and its instruments
    drawBody(g, W, H, A, k, this.pat);
    drawCompass(g, cx, m - 12 * k, A.w * 0.5, s.heading, k);
    drawPitch(g, A.x - 22 * k, H / 2, A.h * 0.42, s.pitch, k);
    { const r = Math.min(20 * k, m * 0.36); drawClock(g, A.x + A.w - r - 4 * k, m - r - 14 * k, r, s.tide); }
    const fy = A.y + A.h + Math.min(m * 0.5, 26 * k), zw = Math.min(120 * k, A.w * 0.16);
    drawFootScale(g, A.x + 12 * k, fy, zw, s.zoom, k, { ticks: 6 });
    const fw = Math.min(150 * k, A.w * 0.2), fx = A.x + A.w * 0.5 - fw * 0.75;
    drawFootScale(g, fx, fy, fw, this.focus.scale, k, { infinity: true, ticks: 10 });
    drawSockets(g, fx + fw + 26 * k, fy, 4, s.stars, k);
    drawMemory(g, A.x + A.w - 10 * k, fy, s.left, Math.max(1, s.of), k);
  }

  /** The desk's soft glass round the focus: a backdrop blur over the aperture, masked clear round the subject (wide while hunting). */
  drawDof(W, H, A) {
    const D = this.dof;
    if (this.mobile) { D.style.display = 'none'; return; }
    const L = this.focus.lock, e = L * L * (3 - 2 * L);
    const blur = SAFARI_LENS.dof.hunt + (SAFARI_LENS.dof.blur - SAFARI_LENS.dof.hunt) * e;
    const fx = this.focus.has ? (this.focus.x * 0.5 + 0.5) * W - A.x : A.w / 2, fy = this.focus.has ? (-this.focus.y * 0.5 + 0.5) * H - A.y : A.h / 2;
    const diag = Math.hypot(A.w, A.h) / 2, sub = Math.max(A.h * 0.22, this.focus.h * H * SAFARI_LENS.dof.clear);
    const r0 = this.focus.has ? diag * 0.55 + (sub - diag * 0.55) * e : diag * 0.62, r1 = r0 * (this.focus.has ? SAFARI_LENS.dof.fall : 1.45);
    const mask = `radial-gradient(circle at ${fx.toFixed(0)}px ${fy.toFixed(0)}px, transparent ${r0.toFixed(0)}px, #000 ${r1.toFixed(0)}px)`;
    const key = `${A.x | 0},${A.y | 0},${A.w | 0},${A.h | 0},${mask},${blur.toFixed(1)}`;
    if (key === this.dofKey) return;
    this.dofKey = key;
    Object.assign(D.style, { display: 'block', left: `${A.x}px`, top: `${A.y}px`, width: `${A.w}px`, height: `${A.h}px`, borderRadius: '14px',
      backdropFilter: `blur(${blur.toFixed(1)}px)`, webkitBackdropFilter: `blur(${blur.toFixed(1)}px)`, maskImage: mask, webkitMaskImage: mask });
  }

  /** The iris: opening as the lens comes up, and the shutter's beat (the held white frame, the blades in, held, out). */
  drawShutter(g, A) {
    const S = SAFARI_LENS.shutter, full = Math.hypot(A.w, A.h) * 0.62;
    let open = easeOut(this.openK), flash = 0;
    const st = this.shot?.t ?? Infinity;
    if (st < S.flash + S.close + S.shut + S.open) {
      flash = st < S.flash ? 1 : Math.max(0, 1 - (st - S.flash) / 0.08);
      const a = S.flash * 0.4, b = a + S.close, c = b + S.shut, d = c + S.open;
      const k = st < a ? 1 : st < b ? 1 - easeOut((st - a) / S.close) : st < c ? 0 : easeOut((st - c) / S.open);
      open = Math.min(open, k); if (st >= d) open = Math.min(1, open);
    }
    if (open < 0.999) drawIris(g, A, Math.max(1.5, full * open), (1 - open) * 1.05); // (never a point: six blades round nothing have no edges to draw)
    if (flash > 0) { g.save(); g.globalAlpha = flash * 0.9; g.fillStyle = '#fffdf6'; g.fillRect(A.x, A.y, A.w, A.h); g.restore(); }
  }

  printStart() { const S = SAFARI_LENS.shutter; return S.flash + S.close + S.shut + S.open * 0.6; }

  /** The print, slid up in the glass's lower left, its stars stamped in, the seal, then put by into the book's corner (lower right). */
  drawShotPrint(g, W, H, A, k) {
    const P = SAFARI_LENS.print, sh = this.shot, t = sh.t - this.printStart();
    if (t <= 0) return;
    const w = Math.max(P.w[0], Math.min(P.w[1], A.w * P.share)) * Math.min(1, k * 1.1), h = w * 1.02;
    const hx = A.x + w * 0.62, hy = A.y + A.h - h * 0.58;
    const inK = easeBack(clamp01(t / P.in)), starsEnd = P.in + sh.stars * P.star, sealEnd = starsEnd + (sh.candid ? P.seal : 0), outAt = sealEnd + P.hold;
    const out = clamp01((t - outAt) / P.out), o2 = out * out;
    const x = hx + (W - 40 - hx) * o2, y = hy + h * (1 - inK) * 0.9 + (H - 30 - hy) * o2;
    const stamps = [0, 1, 2, 3].map((i) => (i < sh.stars ? clamp01((t - P.in - i * P.star) / (P.star * 2.2)) : 0));
    const seal = sh.candid ? clamp01((t - starsEnd - P.seal * 0.2) / (P.seal * 2)) : 0;
    drawPrint(g, { x, y, w, rot: -0.06 + 0.4 * o2, scale: 1 - 0.75 * o2, alpha: Math.min(1, t / 0.06) * (1 - out * 0.6), img: sh.img, stamps, seal, held: sh.held });
  }

  read() { return { on: this.el.classList.contains('on'), lock: +this.focus.lock.toFixed(2), focus: +this.focus.scale.toFixed(2), shot: this.shot ? { t: +this.shot.t.toFixed(2), stars: this.shot.stars, candid: this.shot.candid } : null, ink: LENS_INK.brass }; }
}
