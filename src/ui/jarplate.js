// ---------------------------------------------------------------------------------------
// THE PNEUKA JAR'S PLATE: your Pneuka Jar's state while the god hand is taken, as an instrument in the System's sight (OVERLAY.md 15.4,
// Anagami's Clay dress), drawn from Petra's `game.god.readout()` -> { hp, max, alive, scars, helpers, raid }. It replaces the god hand's
// stock bar (2026-10-30). The jar's own body is the number's first avenue (its cracks and flinch, godhand/jar.js); this is the second;
// what happened (a raid begun, a seam closed) is the log's.
//
//   THE JAR     a small Pneuka Jar drawn on a canvas: Lachryma standing inside it to hp / max, its meniscus breathing; ember below 40%;
//               a white flash and a shudder when it drops; a gold seam drawn across its body for each scar (kintsugi: the mended Jar
//               wears its breaks); emptied and split dark while it is being made whole
//   THE COUNTS  its share in the counts face beside it (RE-FORMING while it is not whole), the helpers at its side as small pots and their
//               count, and in the siege the raid's line (raids.status())
//   WHERE       top-left on the desk (out of the way of the goals window: it steps aside while that stands), under the log's ticker on touch
//               (the HUD layout's --hud-log-*: the place Petra gave the old bar)
//
// Prior art: the Brine frame and the goals window's Clay dress (ui/brineframe.js, ui/goalswindow.js), the sea hull's pips (ui/seahull.js),
// Zelda's heart container (the vessel of your life as the gauge itself), kintsugi (a mend shown in gold, never hidden).
//
//   game.jarPlate = new JarPlate(game)   .update(rawDt)   (each frame; built the first time the god hand is taken)   JAR_PLATE (the numbers)
// ---------------------------------------------------------------------------------------
import { brineFrame, dot, GOLD, SALT, INK, LACHRYMA_TINT, COUNT_FACE } from './brineframe.js';
import { clayDress } from './goalswindow.js';
import { FONT } from './theme.js';

export const JAR_PLATE = { w: 20, h: 25, low: 0.4, ember: '#ff7a4a', flash: 0.35, seams: 6, pots: 6, fps: 12 }; // (the jar in dots; the share where it warms to ember; the flash in real s; the most seams and pots drawn; the meniscus's redraws a real second)

const CSS = `
.jp{position:fixed;left:calc(10*var(--d));top:calc(18*var(--d));z-index:3;pointer-events:none;opacity:0;transition:opacity .3s}
body.hud-touch .jp{left:var(--hud-log-x,12px);top:calc(var(--hud-log-y,60px) + var(--hud-log-h,20px) + calc(9*var(--d)))}
.jp.on{opacity:1}
.jp .jp-row{display:flex;align-items:center;gap:calc(5*var(--d))}
.jp canvas{display:block;width:calc(${JAR_PLATE.w}*var(--d));height:calc(${JAR_PLATE.h}*var(--d))}
.jp .jp-col{display:flex;flex-direction:column;gap:calc(1*var(--d));min-width:calc(46*var(--d))}
.jp .jp-hp{font-family:${COUNT_FACE};font-size:calc(14*var(--d));line-height:1;color:${SALT};letter-spacing:.04em;font-variant-numeric:tabular-nums}
.jp .jp-hp.low{color:${JAR_PLATE.ember}}
.jp .jp-hp.gone{font-size:calc(9*var(--d));letter-spacing:.16em;opacity:.8}
.jp .jp-sub{display:flex;align-items:center;gap:calc(3*var(--d));font-family:${COUNT_FACE};font-size:calc(9*var(--d));color:${SALT};opacity:.85}
.jp .jp-pot{display:inline-block;width:calc(4*var(--d));height:calc(5*var(--d));border-radius:40% 40% 45% 45%/30% 30% 60% 60%;
  background:linear-gradient(180deg,#c98a62,#7a4630);box-shadow:0 0 0 calc(.5*var(--d)) ${INK}}
.jp .jp-seam{color:${GOLD}}
.jp .jp-raid{font-family:${FONT.sys};font-size:calc(8*var(--d));letter-spacing:.06em;color:${SALT};opacity:.8;text-transform:uppercase}
.jp .jp-raid:empty{display:none}
${clayDress('.jp.clay')}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-jarplate', ''); s.textContent = CSS; document.head.appendChild(s);
}
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** The Pneuka Jar's outline in the canvas's unit square (x 0..1 across, y 0 top .. 1 foot): lip, neck, shoulders, belly, foot. */
function jarPath(c, W, H) {
  const X = (u) => u * W, Y = (v) => v * H;
  c.beginPath();
  c.moveTo(X(0.34), Y(0.04)); c.lineTo(X(0.66), Y(0.04)); c.lineTo(X(0.64), Y(0.1)); c.lineTo(X(0.6), Y(0.16));
  c.bezierCurveTo(X(0.95), Y(0.22), X(1.0), Y(0.5), X(0.9), Y(0.72));
  c.bezierCurveTo(X(0.84), Y(0.86), X(0.72), Y(0.92), X(0.68), Y(0.93));
  c.lineTo(X(0.7), Y(0.98)); c.lineTo(X(0.3), Y(0.98)); c.lineTo(X(0.32), Y(0.93));
  c.bezierCurveTo(X(0.28), Y(0.92), X(0.16), Y(0.86), X(0.1), Y(0.72));
  c.bezierCurveTo(X(0.0), Y(0.5), X(0.05), Y(0.22), X(0.4), Y(0.16));
  c.lineTo(X(0.36), Y(0.1)); c.closePath();
}
/** A seam's zigzag across the belly, the same for the same index every time (no flicker as they are redrawn). */
function seam(c, W, H, i) {
  const r = (k) => { const s = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
  const y0 = 0.3 + 0.55 * r(1), slope = (r(2) - 0.5) * 0.3;
  c.beginPath();
  for (let k = 0; k <= 5; k++) { const u = 0.12 + (k / 5) * 0.76, v = y0 + slope * (u - 0.5) + (k % 2 ? 0.04 : -0.03) * (0.6 + r(k + 3)); k ? c.lineTo(u * W, v * H) : c.moveTo(u * W, v * H); }
  c.stroke();
}

export class JarPlate {
  constructor(game) { this.game = game; this.root = null; this.on = false; this.k = 1; this.flash = 0; this.t = 0; this.drawT = 0; this.last = { hp: -1, alive: null, scars: -1, helpers: -1, raid: null }; }

  build() {
    if (this.root || typeof document === 'undefined') return;
    style();
    const root = (this.root = make('div', 'jp clay')); root.style.setProperty('--d', `${dot()}px`);
    const f = (this.frame = brineFrame(root, { tab: 'PNEUKA JAR' }));
    const row = make('div', 'jp-row'), col = make('div', 'jp-col');
    this.cv = make('canvas'); this.hp = make('div', 'jp-hp'); this.sub = make('div', 'jp-sub'); this.raid = make('div', 'jp-raid');
    col.append(this.hp, this.sub, this.raid); row.append(this.cv, col); f.body.append(row);
    document.body.appendChild(root);
    const size = () => { const d = dot(), pr = Math.min(2, devicePixelRatio || 1); root.style.setProperty('--d', `${d}px`); this.cv.width = Math.round(JAR_PLATE.w * d * pr); this.cv.height = Math.round(JAR_PLATE.h * d * pr); this.drawT = 0; f.layout(); };
    size(); addEventListener('resize', size);
  }

  /** Each frame: shown while the god hand is taken (out of a cinematic and the goals window's way), its numbers written when they change, the jar redrawn at a few frames a real second. */
  update(raw = 1 / 60) {
    const g = this.game, H = g.god, B = typeof document !== 'undefined' ? document.body.classList : null;
    const want = !!(H?.active && H.state !== 'off' && H.readout) && !g.title?.active && !B?.contains('cine') && !g.goalsWindow?.root?.classList.contains('on');
    if (want && !this.root) this.build();
    if (want !== this.on && this.root) { this.on = want; this.root.classList.toggle('on', want); if (want) this.frame.layout(); }
    if (!this.on) return;
    const R = H.readout(), L = this.last, k = R.max > 0 ? Math.max(0, Math.min(1, R.hp / R.max)) : 0;
    if (R.hp < L.hp && L.alive) this.flash = JAR_PLATE.flash;
    this.t += raw; this.flash = Math.max(0, this.flash - raw); this.k += (k - this.k) * (1 - Math.exp(-8 * raw));
    if (R.hp !== L.hp || R.alive !== L.alive) {
      this.hp.textContent = R.alive ? `${Math.round(k * 100)}%` : 'RE-FORMING';
      this.hp.classList.toggle('low', R.alive && k < JAR_PLATE.low); this.hp.classList.toggle('gone', !R.alive);
    }
    if (R.helpers !== L.helpers || R.scars !== L.scars) {
      this.sub.textContent = '';
      for (let i = 0; i < Math.min(R.helpers, JAR_PLATE.pots); i++) this.sub.append(make('span', 'jp-pot'));
      this.sub.append(make('span', '', `${R.helpers}`));
      if (R.scars) this.sub.append(make('span', 'jp-seam', `◆${R.scars}`));
    }
    const raid = (R.raid || '').replace(/[\s·]+$/, '');
    if (raid !== L.raid) { this.raid.textContent = raid; this.frame.layout(); }
    Object.assign(L, { hp: R.hp, alive: R.alive, scars: R.scars, helpers: R.helpers, raid });
    if ((this.drawT -= raw) <= 0 || this.flash > 0) { this.drawT = 1 / JAR_PLATE.fps; this.draw(R); }
  }

  /** The jar: its Lachryma to the eased share, ember when low, its seams in gold, a flash when struck; split and empty while re-forming. */
  draw(R) {
    const cv = this.cv, c = cv.getContext('2d'), W = cv.width, Hh = cv.height, px = W / JAR_PLATE.w, k = R.alive ? this.k : 0;
    c.clearRect(0, 0, W, Hh);
    const shake = this.flash > 0 ? Math.sin(this.t * 90) * px * 0.6 * (this.flash / JAR_PLATE.flash) : 0;
    c.save(); c.translate(shake, 0);
    jarPath(c, W, Hh); c.fillStyle = R.alive ? '#3a1e14' : '#1c100c'; c.fill(); // (the clay inside, dark)
    if (k > 0) { // the Lachryma standing in it, its meniscus breathing
      c.save(); jarPath(c, W, Hh); c.clip();
      const top = 0.98 - k * 0.86, wob = Math.sin(this.t * 2.4) * 0.012, liq = k < JAR_PLATE.low ? JAR_PLATE.ember : LACHRYMA_TINT;
      const gr = c.createLinearGradient(0, top * Hh, 0, Hh); gr.addColorStop(0, liq); gr.addColorStop(1, k < JAR_PLATE.low ? '#7a2010' : '#1f5a8a');
      c.fillStyle = gr; c.beginPath(); c.moveTo(0, (top + wob) * Hh); c.quadraticCurveTo(W / 2, (top - wob) * Hh, W, (top + wob) * Hh); c.lineTo(W, Hh); c.lineTo(0, Hh); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = px; c.beginPath(); c.moveTo(0, (top + wob) * Hh); c.quadraticCurveTo(W / 2, (top - wob) * Hh, W, (top + wob) * Hh); c.stroke();
      c.restore();
    }
    if (R.scars) { // the gold seams of what mended
      c.save(); jarPath(c, W, Hh); c.clip();
      c.strokeStyle = GOLD; c.lineWidth = px * 0.9; c.shadowColor = GOLD; c.shadowBlur = px * 1.5; c.lineJoin = 'round';
      for (let i = 0; i < Math.min(R.scars, JAR_PLATE.seams); i++) seam(c, W, Hh, i);
      c.restore();
    }
    if (!R.alive) { c.strokeStyle = 'rgba(239,230,210,.55)'; c.lineWidth = px; c.beginPath(); c.moveTo(W * 0.52, Hh * 0.06); c.lineTo(W * 0.44, Hh * 0.4); c.lineTo(W * 0.58, Hh * 0.62); c.lineTo(W * 0.48, Hh * 0.97); c.stroke(); }
    jarPath(c, W, Hh); c.lineWidth = px; c.strokeStyle = INK; c.stroke(); // (the ink keyline, then the clay's lit rim inside it)
    c.save(); jarPath(c, W, Hh); c.clip(); c.lineWidth = px * 1.4; c.strokeStyle = R.alive ? 'rgba(232,170,128,.8)' : 'rgba(120,80,60,.6)'; jarPath(c, W, Hh); c.stroke(); c.restore();
    if (this.flash > 0) { c.save(); jarPath(c, W, Hh); c.clip(); c.fillStyle = `rgba(255,255,255,${(this.flash / JAR_PLATE.flash) * 0.8})`; c.fillRect(0, 0, W, Hh); c.restore(); }
    c.restore();
  }
}
