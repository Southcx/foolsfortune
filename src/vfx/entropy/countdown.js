// ---------------------------------------------------------------------------------------
// THE BOMB'S COUNTDOWN (plain name; South, 2026-11-06: "the countdown of the Grand bomb should be readily visible"; ENTROPY-TACTICS.md 8:
// the counter from 30, down one a round and by every count, the bomb going off at 0). Two avenues, both always up while seated, looks
// only (CLAUDE.md: every number that matters has two avenues or more):
//   on the bomb   a dial over the Grand Bomb facing the camera: its number big in the board's stroke numerals (pieces.js strokeText)
//                 inside a ring of 30 ticks, the ones spent dark, the lowest one left the brightest; drawn white on its own canvas
//                 and tinted by the heat (a sprite's colour: no redraw as it heats), depth test off so neither the tiles nor the
//                 tilt-shift's blur hide it (its sharp copy rides above the pass: renderOrder 40); sized to read on a phone at 896 x 414
//   on the edge   a small readout at the screen's top-left (black glass, a thin ivory rule, the board plates' own grammar, boardplates.js):
//                 BOMB, the counter big in the stroke numerals and a hairline of what is left
//   the heat      bone while the counter is high, through the eldritch hue (pieces.js `eldritch`) to a hot vermilion under 10, the
//                 dial's heartbeat quickening under 10
//   a change      set(n, { delta }): both pulse (the dial swells and whitens), the number rolls down (the old one sliding up and out,
//                 the new one in from below, about 0.4 real s; a count by several rolls once)
//
// Prior art: Into the Breach's and XCOM's turn timers stood on the thing itself, the Majora's Mask clock's countdown (the hour's
// ring burning down), the split-flap board's roll, Teenage Engineering's hairline readouts.
//
//   new BombCountdown(game, look)   .attach(root)   .detach()   .set(counter, { max, delta })   .place(worldPos)   .tick(dt, t)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LOOK, eldritch, strokeText } from './pieces.js';

const DIAL = { px: 512, size: 2.6, lift: 2.9, ticks: 30, roll: 0.42, pulse: 0.6 };
const HOT = new THREE.Color(0xff4a26), BONE = new THREE.Color(LOOK.bone), WHITE = new THREE.Color(0xffffff);
const CSS = `
#etbomb { position: fixed; z-index: 9001; pointer-events: none; top: calc(env(safe-area-inset-top, 0px) + 10px); left: calc(env(safe-area-inset-left, 0px) + 12px);
  padding: 6px 12px 7px 11px; background: rgba(4, 3, 8, 0.8); border: 1px solid rgba(236, 230, 214, 0.5); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  color: #ece6d6; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-weight: 300; -webkit-font-smoothing: antialiased; transition: transform 0.12s; transform-origin: 0 0; }
#etbomb .lab { font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; opacity: 0.7; display: block; margin-bottom: 2px; }
#etbomb canvas { display: block; width: 84px; height: 42px; }
#etbomb .left { height: 1px; margin-top: 4px; background: rgba(236, 230, 214, 0.18); position: relative; }
#etbomb .left i { position: absolute; left: 0; top: 0; bottom: 0; background: currentColor; }
#etbomb.pulse { transform: scale(1.08); }
@media (max-height: 500px) { #etbomb { padding: 4px 9px 5px 8px; } #etbomb canvas { width: 66px; height: 33px; } }
`;
const _v = new THREE.Vector3(), _c = new THREE.Color();
const ease = (k) => 1 - (1 - k) ** 3;

export class BombCountdown {
  constructor(game, look) { this.game = game; this.look = look; this.root = null; this.n = 30; this.max = 30; this.from = 30; this.rollK = 1; this.pulse = 0; this.heat = new THREE.Color(LOOK.bone); }

  attach(root) {
    if (this.root) this.detach();
    this.root = root;
    // the dial on the bomb
    const cv = (this.cv = document.createElement('canvas')); cv.width = cv.height = DIAL.px; this.c = cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    this.mat = new THREE.SpriteMaterial({ map: this.tex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false });
    this.sprite = new THREE.Sprite(this.mat); this.sprite.name = 'entropy-bomb-countdown'; this.sprite.renderOrder = 40; this.sprite.scale.setScalar(DIAL.size); this.sprite.visible = false;
    this.sprite.frustumCulled = false; root.add(this.sprite);
    // the readout on the screen's edge
    if (!document.getElementById('etbomb-css')) { const st = document.createElement('style'); st.id = 'etbomb-css'; st.textContent = CSS; document.head.appendChild(st); }
    const el = (this.el = document.createElement('div')); el.id = 'etbomb';
    el.innerHTML = '<span class="lab">Bomb</span><canvas width="168" height="84"></canvas><div class="left"><i></i></div>';
    this.ec = el.querySelector('canvas').getContext('2d'); this.fill = el.querySelector('.left i');
    document.body.appendChild(el); this.lastCss = ''; this.lastEl = -1;
    this.draw();
  }

  detach() {
    if (!this.root) return;
    this.sprite?.parent?.remove(this.sprite); this.tex?.dispose(); this.mat?.dispose();
    this.el?.remove(); document.getElementById('etbomb-css')?.remove();
    this.root = this.sprite = this.tex = this.mat = this.el = this.ec = this.fill = this.cv = this.c = null;
  }

  /** The counter now (its max, and how much it just fell: a roll and a pulse when it changed). */
  set(counter, { max = this.max, delta = 0 } = {}) {
    const n = Math.max(0, Math.round(counter)); this.max = max || 30;
    if (n === this.n && !delta) return;
    if (n !== this.n) { this.from = this.n; this.rollK = 0; this.pulse = 1; this.el?.classList.add('pulse'); this.pulseOff = 0.18; }
    else if (delta) this.pulse = Math.max(this.pulse, 0.6);
    this.n = n; this.draw(); this.lastEl = -1;
  }

  /** Where the bomb stands (world), each frame. */
  place(worldPos) {
    if (!this.sprite) return;
    _v.copy(worldPos); this.root.worldToLocal(_v); _v.y += DIAL.lift; this.sprite.position.copy(_v); this.sprite.visible = true;
  }

  tick(dt, t) {
    if (!this.root) return;
    // the heat: bone, then the eldritch hue, then a hot vermilion under 10
    const n = this.n, hue = eldritch(t, _c, 0.6);
    if (n >= 20) this.heat.copy(BONE).lerp(hue, (30 - n) / 10 * 0.6); else if (n >= 10) this.heat.copy(hue).lerp(BONE, (n - 10) / 10 * 0.4); else this.heat.copy(hue).lerp(HOT, Math.min(1, 0.55 + (10 - n) * 0.05));
    if (this.rollK < 1) { this.rollK = Math.min(1, this.rollK + dt / DIAL.roll); this.draw(); }
    this.pulse = Math.max(0, this.pulse - dt / DIAL.pulse);
    if (this.pulseOff > 0) { this.pulseOff -= dt; if (this.pulseOff <= 0) this.el?.classList.remove('pulse'); }
    const beat = n < 10 && n > 0 ? Math.max(0, Math.sin(t * (4 + (10 - n) * 0.6))) ** 8 : 0;
    this.mat.color.copy(this.heat).lerp(WHITE, this.pulse * 0.7 + beat * 0.25);
    this.sprite.scale.setScalar(DIAL.size * (1 + this.pulse * 0.28 + beat * 0.06));
    // the edge's readout, redrawn only when its colour moves a visible step
    const css = `#${_c.copy(this.heat).lerp(WHITE, this.pulse * 0.5).getHexString()}`.replace(/(..)(..)(..)$/, (m, r, g, b) => [r, g, b].map((x) => (parseInt(x, 16) & 0xf0).toString(16).padStart(2, '0')).join(''));
    if (css !== this.lastCss || this.lastEl !== n) { this.lastCss = css; this.lastEl = n; this.drawEdge(css); }
  }

  /** The dial's canvas, white (the sprite's colour heats it): the ring of ticks and the number rolling. */
  draw() {
    const c = this.c; if (!c) return;
    const S = DIAL.px, h = S / 2, R = S * 0.44, n = this.n, max = this.max;
    c.clearRect(0, 0, S, S);
    c.fillStyle = 'rgba(3,2,6,0.55)'; c.beginPath(); c.arc(h, h, R * 0.86, 0, Math.PI * 2); c.fill(); // (a dark disc under the number: it reads over any tile)
    for (let i = 0; i < DIAL.ticks; i++) {
      const a = (i / DIAL.ticks) * Math.PI * 2 - Math.PI / 2, lit = i < Math.round((n / max) * DIAL.ticks), last = lit && i === Math.round((n / max) * DIAL.ticks) - 1;
      const r0 = R * (last ? 0.84 : 0.88), r1 = R * (i % 5 === 0 ? 1.02 : 0.98);
      c.strokeStyle = lit ? (last ? '#ffffff' : 'rgba(255,255,255,0.82)') : 'rgba(255,255,255,0.16)'; c.lineWidth = last ? 11 : i % 5 === 0 ? 8 : 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(h + Math.cos(a) * r0, h + Math.sin(a) * r0); c.lineTo(h + Math.cos(a) * r1, h + Math.sin(a) * r1); c.stroke();
    }
    c.save(); c.beginPath(); c.arc(h, h, R * 0.8, 0, Math.PI * 2); c.clip();
    const k = ease(this.rollK), H = S * 0.36, num = (str, y, a) => {
      c.globalAlpha = a; c.strokeStyle = c.fillStyle = 'rgba(3,2,6,0.9)'; strokeText(c, str, h, y, H, { lw: H * 0.2 });
      c.strokeStyle = c.fillStyle = '#ffffff'; strokeText(c, str, h, y, H, { lw: H * 0.095 });
    };
    if (k < 1) { num(this.from, h - k * H * 1.3, 1 - k); num(n, h + (1 - k) * H * 1.3, k); } else num(n, h, 1);
    c.restore(); c.globalAlpha = 1;
    this.tex.needsUpdate = true;
  }

  drawEdge(css) {
    const c = this.ec; if (!c) return;
    c.clearRect(0, 0, 168, 84); c.strokeStyle = c.fillStyle = css; strokeText(c, this.n, 6, 42, 62, { lw: 6.5, align: 'left' });
    this.el.style.color = css; this.fill.style.width = `${(100 * this.n) / this.max}%`;
  }
}
