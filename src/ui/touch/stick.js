// ---------------------------------------------------------------------------------------
// THE STICK'S RING: the floating stick of touch play (docs/plans/MOBILE.md 4.1 and 8), standing where a thumb lands in the move area (the
// HUD layout's `areas.move`) and gone when it lifts. It owns the move area's hit layer and REPORTS only: the driver (Petra's) reads it
// and presses what it means (the steer's axis, the gaits, the carve's Q / E); it moves nothing itself.
//   THE RING   a well of dark clay under the thumb, the full push's ring at 60 px in the labradorite's play (vfx/oxidation.js
//              schillerInk: calm, in the film), the knob a round glazed tile (the touch tiles' clay and the window colour's glaze) that
//              follows the thumb out to the outer band and no further.
//   THE BAND   past 90 px: on the Solar Skiff it is the carve's, drawn in the slip arc's language (vfx/skiffsliparc.js): its two sides an
//              ember band, the side the thumb is in brightening while the carve is live; off the skiff it is the sprint's, a faint
//              dashed ring.
//   READ       x, y (-1 .. 1, full at 60 px; y forward is up the screen), carve (-1 left, 0, 1 right: past 90 px on that side, on the
//              skiff), outer (past 90 px at all: the sprint on foot), active, and the push (0 .. outer / 60).
//   AT REST    the ring and knob drawn faint (a third) at the stick's home (hudlayout.js stickHome: the touch layout editor's, kept, or
//              low in the move area), so a thumb knows where to land; a thumb anywhere in the move area still makes the stick there.
// Redrawn on a move and, while held, at most 15 times a real second for the schiller's walk; no per-frame DOM.
//
// Prior art: Genshin Impact's and Mario Kart Tour's floating sticks (a stick where the thumb lands; MKT's slide past the edge is the
// drift), the slip arc's calm and ember band (vfx/skiffsliparc.js), the touch tiles' clay (ui/touch/tile.js).
//
//   new TouchStick(game)   .x .y .carve .outer .active .push   .onChange = (stick) => {}   .press(cx, cy) .move(cx, cy) .release() (driven
//   by hand: a test, the headless look)   .update(now, on)   .relayout()   STICK (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { schillerInk, SCHILLER } from '../../vfx/oxidation.js';
import { placeOf, windowOpen } from './areas.js';
import { stationView } from './artbar.js';

/** The numbers (CSS px): the full push, the outer band's start and end, the knob's radius; the band's half-sweep round each side (rad);
 *  the ember (the slip arc's); the schiller's redraw rate while held (a real second). */
export const STICK = { full: 60, outer: 90, band: 112, knob: 26, sweep: 0.95, ember: '#ff7a2a', rate: 15, rest: 0.32 };

const CSS = `
.tstick{position:fixed;left:0;top:0;z-index:5;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;
  -webkit-tap-highlight-color:transparent;pointer-events:auto}
.tstick.off{display:none}
.tstick canvas{position:absolute;left:0;top:0;pointer-events:none;display:none}
.tstick.held canvas,.tstick.rest canvas{display:block}
`;
const _c = new THREE.Color();
const glaze = () => { const s = getComputedStyle(document.documentElement); return { top: s.getPropertyValue('--jtop').trim() || '104,50,32', bot: s.getPropertyValue('--jbot').trim() || '34,15,9' }; };

/** The knob: a round glazed tile, drawn once a window colour. */
let knobCache = null;
function knob(dpr) {
  const G = glaze(), key = `${dpr}|${G.top}|${G.bot}`;
  if (knobCache?.key === key) return knobCache.c;
  const R = STICK.knob, D = (R + 3) * 2, c = document.createElement('canvas'); c.width = c.height = Math.round(D * dpr);
  const g = c.getContext('2d'); g.scale(dpr, dpr); const o = D / 2;
  g.beginPath(); g.arc(o, o + 2, R, 0, Math.PI * 2); g.fillStyle = '#2a120b'; g.fill(); // (its foot)
  g.beginPath(); g.arc(o, o, R, 0, Math.PI * 2);
  const clay = g.createLinearGradient(o - R, o - R, o + R * 0.4, o + R); clay.addColorStop(0, '#9a5638'); clay.addColorStop(1, '#5a2b1d'); g.fillStyle = clay; g.fill();
  g.beginPath(); g.arc(o, o, R * 0.74, 0, Math.PI * 2);
  const pool = g.createRadialGradient(o - R * 0.25, o - R * 0.3, R * 0.05, o, o, R * 0.8);
  pool.addColorStop(0, `rgba(${G.top},.98)`); pool.addColorStop(1, `rgba(${G.bot},1)`); g.fillStyle = pool; g.fill();
  g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,226,196,.28)'; g.stroke();
  const sh = g.createRadialGradient(o - R * 0.35, o - R * 0.4, 0, o - R * 0.35, o - R * 0.4, R * 0.5);
  sh.addColorStop(0, 'rgba(255,248,236,.24)'); sh.addColorStop(1, 'rgba(255,248,236,0)'); g.fillStyle = sh; g.fill();
  g.beginPath(); g.arc(o, o, R, 0, Math.PI * 2); g.lineWidth = 1.5; g.strokeStyle = '#1c0d08'; g.stroke();
  knobCache = { key, c };
  return c;
}

export class TouchStick {
  constructor(game) {
    this.game = game; this.x = 0; this.y = 0; this.carve = 0; this.outer = false; this.active = false; this.push = 0; this.onChange = null;
    this.pid = null; this.o = { x: 0, y: 0 }; this.d = { x: 0, y: 0 }; this.on = false; this.drawnAt = -9; this.dirty = false;
    if (!document.querySelector('style[data-touchstick]')) { const s = document.createElement('style'); s.setAttribute('data-touchstick', ''); s.textContent = CSS; document.head.appendChild(s); }
    const el = (this.el = document.createElement('div')); el.className = 'tstick off';
    this.cv = document.createElement('canvas'); el.append(this.cv);
    el.addEventListener('pointerdown', (e) => {
      if (this.pid != null) return;
      e.preventDefault(); this.pid = e.pointerId; try { el.setPointerCapture(e.pointerId); } catch { /* synthetic */ }
      this.press(e.clientX, e.clientY);
    });
    el.addEventListener('pointermove', (e) => { if (e.pointerId === this.pid) this.move(e.clientX, e.clientY); });
    const end = (e) => { if (e.pointerId === this.pid) { this.pid = null; this.release(); } };
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, end);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    document.body.appendChild(el);
    this.relayout();
  }

  /** On the Solar Skiff, riding: the outer band is the carve's. */
  get skiff() { const T = this.game.player?.techs?.get?.('skiff') || this.game.techs?.get?.('skiff'); return !!(T?.active && T.phase === 'ride'); }

  /** A thumb down at (cx, cy) (CSS px, the page's): the stick stands there. */
  press(cx, cy) { this.active = true; this.o = { x: cx, y: cy }; this.d = { x: 0, y: 0 }; this.el.classList.add('held'); this.read(); }
  /** The thumb at (cx, cy). */
  move(cx, cy) { if (!this.active) return; this.d = { x: cx - this.o.x, y: cy - this.o.y }; this.read(); }
  /** The thumb lifted: everything back to rest. */
  release() { this.active = false; this.d = { x: 0, y: 0 }; this.el.classList.remove('held'); this.read(); }

  read() {
    const { x: dx, y: dy } = this.d, r = Math.hypot(dx, dy), k = r > 0 ? Math.min(1, r / STICK.full) / r : 0;
    const was = `${this.x}|${this.y}|${this.carve}|${this.outer}|${this.active}`;
    this.x = +(dx * k).toFixed(3); this.y = +(-dy * k).toFixed(3); this.push = +(Math.min(r, STICK.band) / STICK.full).toFixed(3);
    this.outer = this.active && r > STICK.outer;
    this.carve = this.outer && this.skiff && Math.abs(dx) > Math.abs(dy) * 0.6 ? Math.sign(dx) : 0;
    this.dirty = true;
    if (was !== `${this.x}|${this.y}|${this.carve}|${this.outer}|${this.active}`) try { this.onChange?.(this); } catch (e) { console.warn('stick.onChange', e); }
  }

  /** The move area changed: the hit layer stands over it again. */
  relayout() {
    const A = placeOf(this.game).areas.move;
    Object.assign(this.el.style, { transform: `translate(${Math.round(A.x)}px, ${Math.round(A.y)}px)`, width: `${Math.round(A.w)}px`, height: `${Math.round(A.h)}px` });
    this.area = A; this.restKey = '';
  }

  /** Each frame: stand down off touch or under a window (a held thumb let go), redraw while held. */
  update(now, on) {
    const g = this.game, P = placeOf(g);
    // (the finger is the hand in the garden held upright and under the god hand: no stick there to take its touches, MOBILE.md 8.2)
    // (and wherever the pointer is free, the duel, the track editor, the haunt, the hand: the finger is the cursor there; the garden held sideways keeps the Jar's stick)
    const show = !!on && !windowOpen(g) && !g.god?.controlling && !(g.realm?.active && P.portrait) && !(g.cursorFree?.() && !g.realm?.active) && !g.touch?.screenTaken?.() && !stationView(g.realm); // (a station's view holds the hand: artbar.js stationView) // (screenTaken: Celestial mode's paper or the rhythm mode's pads hold the whole screen, Petra's core/touch)
    if (show !== this.on) { this.on = show; this.el.classList.toggle('off', !show); if (!show && this.active) { this.pid = null; this.release(); } }
    if (!show) return;
    if (!this.active) { this.rest(); return; }
    this.restKey = '';
    if (!this.dirty && now - this.drawnAt < 1 / STICK.rate) return;
    this.dirty = false; this.drawnAt = now; this.draw(now);
  }

  /** At rest: the ring stands faint at its home (the HUD layout's stickHome, the kept one or the default), Genshin's resting stick;
   *  drawn once a place. */
  rest() {
    const H = this.game.hudLayout?.touch ? this.game.hudLayout.stickHome?.() : null;
    const key = H ? `${Math.round(H.x)},${Math.round(H.y)}` : '';
    if (key === this.restKey) return;
    this.restKey = key; this.el.classList.toggle('rest', !!H);
    if (!H) return;
    const o = this.o, d = this.d; this.o = H; this.d = { x: 0, y: 0 };
    this.draw(0, STICK.rest); this.o = o; this.d = d;
  }

  draw(now, alpha = 1) {
    const dpr = Math.max(1, Math.min(3, devicePixelRatio || 1)), B = STICK.band + 8, D = B * 2, cv = this.cv;
    if (cv.width !== Math.round(D * dpr)) { cv.width = cv.height = Math.round(D * dpr); cv.style.width = cv.style.height = `${D}px`; }
    cv.style.transform = `translate(${Math.round(this.o.x - this.area.x - B)}px, ${Math.round(this.o.y - this.area.y - B)}px)`;
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, D, D); g.globalAlpha = alpha;
    const o = B, ph = now * SCHILLER.rate, skiff = this.skiff;
    // the well: dark clay under the thumb, so the ring reads on noon sand
    const well = g.createRadialGradient(o, o, STICK.full * 0.3, o, o, STICK.band);
    well.addColorStop(0, 'rgba(28,13,8,.34)'); well.addColorStop(1, 'rgba(28,13,8,0)'); g.beginPath(); g.arc(o, o, STICK.band, 0, Math.PI * 2); g.fillStyle = well; g.fill();
    // the full push's ring, calm, in the film: the schiller walking round it
    const N = 48; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
      schillerInk(ph + i * 0.01, _c, { floor: 0.5, sheen: 1, bright: 1.4 });
      g.beginPath(); g.arc(o, o, STICK.full, a0, a1 + 0.01); g.strokeStyle = _c.getStyle(); g.stroke();
    }
    g.beginPath(); g.arc(o, o, STICK.full + 2.5, 0, Math.PI * 2); g.lineWidth = 1; g.strokeStyle = 'rgba(23,17,31,.8)'; g.stroke();
    // the outer band: the carve's two ember sides on the skiff, the sprint's faint ring off it
    const mid = (STICK.outer + STICK.band) / 2, wB = STICK.band - STICK.outer;
    if (skiff) {
      for (const side of [-1, 1]) {
        const c0 = side > 0 ? 0 : Math.PI, live = this.carve === side;
        const grad = g.createRadialGradient(o, o, STICK.outer, o, o, STICK.band);
        grad.addColorStop(0, live ? 'rgba(255,170,90,.95)' : 'rgba(255,122,42,.55)'); grad.addColorStop(1, live ? 'rgba(255,122,42,.9)' : 'rgba(255,122,42,.25)');
        g.beginPath(); g.arc(o, o, mid, c0 - STICK.sweep, c0 + STICK.sweep); g.lineWidth = wB * (live ? 1 : 0.7); g.lineCap = 'butt'; g.strokeStyle = grad; g.stroke();
        g.beginPath(); g.arc(o, o, STICK.outer, c0 - STICK.sweep, c0 + STICK.sweep); g.lineWidth = 1; g.strokeStyle = 'rgba(23,17,31,.75)'; g.stroke();
      }
    } else {
      g.setLineDash([4, 6]); g.beginPath(); g.arc(o, o, STICK.outer, 0, Math.PI * 2); g.lineWidth = 1.5;
      g.strokeStyle = this.outer ? 'rgba(255,211,106,.85)' : 'rgba(239,230,210,.3)'; g.stroke(); g.setLineDash([]);
    }
    // the knob, following the thumb out to the band and no further
    const r = Math.hypot(this.d.x, this.d.y), k = r > STICK.band ? STICK.band / r : 1, kx = o + this.d.x * k, ky = o + this.d.y * k;
    const K = knob(dpr), kd = K.width / dpr;
    g.drawImage(K, kx - kd / 2, ky - kd / 2, kd, kd);
    if (this.carve) { g.beginPath(); g.arc(kx, ky, STICK.knob + 1.5, 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = STICK.ember; g.stroke(); }
  }
}
