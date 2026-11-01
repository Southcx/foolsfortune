// ---------------------------------------------------------------------------------------
// A DUMMY'S PERCENT TAG: The Brawl's damage percent (Dovina's rule, progress/strawmanwell.js PERCENT; world/strawmanwell/dummy.js) worn
// over its straw dummy as the overlay's tag (docs/plans/OVERLAY.md 8 and 10.2): the count in the System's count face (Jersey 15), an ink
// outline a dot wide where it crosses the world, a hairline under it and a dashed leader down to the dummy's head (the house's tags, the
// leader line of vfx/creaturetags.js). Smash's readout in the house's grammar:
//   THE ROLL     every count that changes rolls (OVERLAY.md 10.2): an odometer a digit, the ones first and each digit after it 50 ms
//                later, 0.4 real s, overshooting and settling; the ones spin through the whole blow (a +24 turns them 24 places)
//   THE COLOUR   Super Smash Bros.' damage colour: white at 0%, yellow, orange, red, a dark red past 200 (eased as it rolls)
//   THE SHAKE    a blow shakes the tag a moment, harder the more it added (a light one barely), and pops it a size bigger
// It is never narration: the KO is said by the log and burst in straw by the troupe (vfx/strawmanwell/dummies.js). Drawn as a sprite on
// a canvas of its own in the material Dovina's placeholder used (one program, already the game's), redrawn only while it rolls.
//
// Prior art: Super Smash Bros.' damage percent (64 and Melee: the colour ramp, the shake on a hit), the odometer and the slot reel
// (OVERLAY.md 10.2's rolling counts), Watch Dogs' leader line (vfx/creaturetags.js).
//
//   const T = new DummyPercentTag()   parent.add(T.sprite)   T.update(dt, percent, at: Vector3 (its head), toward: +1 | -1 (the camera's
//   side in z))   T.redraw() (the faces have loaded)   T.dispose()   percentColour(p) -> [r, g, b] (0..255)   PERCENT_TAG
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FONT } from '../../ui/theme.js';

/** Its size in the world (m), its lift over the head and toward the camera (m), the roll (real s) and its stagger a digit, the shake
 *  (real s, m at its hardest) and the pop (a share bigger), and the canvas (px: about two a line of the 480-line present). */
export const PERCENT_TAG = { w: 2.3, h: 0.96, lift: 0.12, toward: 0.5, roll: 0.4, stagger: 0.05, shake: 0.34, amp: 0.14, pop: 0.2, cw: 192, ch: 80 };
/** Smash's damage colour by percent (sRGB): white, yellow, orange, red, a dark red. */
const RAMP = [[0, [255, 255, 255]], [30, [255, 240, 122]], [70, [255, 180, 60]], [110, [255, 90, 40]], [160, [216, 30, 30]], [240, [140, 10, 20]]];
const INK = '#0d0a12', COUNT = `'Jersey 15', ${FONT.sys}`, PX = 64, BASE = 56, LINE = 58;
export function percentColour(p) {
  if (p <= RAMP[0][0]) return RAMP[0][1].slice();
  for (let i = 1; i < RAMP.length; i++) {
    const [b, cb] = RAMP[i], [a, ca] = RAMP[i - 1];
    if (p <= b) { const t = (p - a) / (b - a); return ca.map((v, k) => Math.round(v + (cb[k] - v) * t)); }
  }
  return RAMP[RAMP.length - 1][1].slice();
}
const backOut = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }; // (an overshoot that settles)

export class DummyPercentTag {
  constructor() {
    const C = PERCENT_TAG, cv = this.canvas = document.createElement('canvas'); cv.width = C.cw; cv.height = C.ch;
    this.g = cv.getContext('2d');
    this.texture = new THREE.CanvasTexture(cv); this.texture.colorSpace = THREE.SRGBColorSpace;
    this.material = new THREE.SpriteMaterial({ map: this.texture, transparent: true, depthWrite: false, depthTest: false }); // (Dovina's placeholder's: one program)
    this.sprite = new THREE.Sprite(this.material); this.sprite.scale.set(C.w, C.h, 1); this.sprite.renderOrder = 3; this.sprite.name = 'well-percent';
    this.target = -1; this.digits = []; this.t = 0; this.shown = 0; this.shakeT = 0; this.shakeK = 0; this.key = '';
  }

  /** The count asked for: a rise rolls (and shakes by what it added), a fall (back at 0%) is set at once. */
  set(n) {
    n = Math.max(0, Math.round(n)); if (n === this.target) return;
    const C = PERCENT_TAG, rise = this.target >= 0 && n > this.target, d = n - this.target, len = String(n).length;
    if (!rise) { this.digits = [...String(n)].reverse().map((ch) => ({ from: +ch, to: +ch, at: 0 })); this.shown = n; }
    else {
      const now = this.t, next = [];
      for (let i = 0; i < len; i++) {
        const was = this.digits[i] ? this.pos(this.digits[i]) : 0, to = Math.floor(n / 10 ** i) % 10;
        const steps = (((to - Math.round(was)) % 10) + 10) % 10 + 10 * Math.min(2, Math.floor(d / 10 ** (i + 1)));
        next.push({ from: was, to: Math.round(was) + steps, at: now + i * C.stagger });
      }
      this.digits = next;
      this.shakeT = C.shake; this.shakeK = THREE.MathUtils.clamp((d - 4) / 20, 0.15, 1);
    }
    this.target = n;
  }
  pos(D) { const k = THREE.MathUtils.clamp((this.t - D.at) / PERCENT_TAG.roll, 0, 1); return D.from + (D.to - D.from) * (k >= 1 ? 1 : backOut(k)); }

  update(dt, percent, at, toward = 1) {
    const C = PERCENT_TAG; this.t += dt; this.set(percent);
    this.shown += (this.target - this.shown) * (1 - Math.exp(-dt / 0.12));
    const pos = this.digits.map((D) => this.pos(D)), col = percentColour(this.shown);
    const key = pos.map((p) => p.toFixed(2)).join() + col.join();
    if (key !== this.key) { this.key = key; this.draw(pos, col); }
    // the shake (a motion, at a steady rate) and the pop
    this.shakeT = Math.max(0, this.shakeT - dt);
    const k = this.shakeT / C.shake, a = C.amp * this.shakeK * k * k, ox = a * Math.sin(this.t * 83), oy = a * 0.6 * Math.cos(this.t * 61);
    const s = 1 + C.pop * this.shakeK * Math.sin(Math.min(1, (C.shake - this.shakeT) / 0.2) * Math.PI) * (this.shakeT > 0 ? 1 : 0);
    this.sprite.scale.set(C.w * s, C.h * s, 1);
    this.sprite.position.set(at.x + ox, at.y + C.lift + (C.h * s) / 2 + oy, at.z + toward * C.toward);
  }

  /** The digits at their rolled places, the % small after them, the hairline and the leader, in the count face. */
  draw(pos, col) {
    const C = PERCENT_TAG, g = this.g, W = C.cw, H = C.ch;
    g.clearRect(0, 0, W, H);
    g.font = `${PX}px ${COUNT}`; const adv = Math.ceil(g.measureText('0').width) + 1;
    g.font = `${Math.round(PX * 0.5)}px ${COUNT}`; const pw = Math.ceil(g.measureText('%').width);
    const n = Math.max(1, pos.length), total = n * adv + 3 + pw, x0 = Math.round((W - total) / 2);
    const fill = g.createLinearGradient(0, BASE - PX * 0.72, 0, BASE);
    fill.addColorStop(0, `rgb(${col.map((v) => Math.min(255, v + 60)).join(',')})`); fill.addColorStop(1, `rgb(${col.join(',')})`);
    const glyph = (ch, x, y, px) => {
      g.font = `${px}px ${COUNT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
      g.lineWidth = 7; g.strokeStyle = 'rgba(13,10,18,0.5)'; g.strokeText(ch, x, y + 3); // (its drop shadow)
      g.lineWidth = 5; g.strokeStyle = INK; g.strokeText(ch, x, y); g.fillStyle = fill; g.fillText(ch, x, y);
    };
    // each digit on its wheel, clipped to its window: the ones at the right, rolling up (the next number comes up from below)
    for (let i = 0; i < n; i++) {
      const p = pos[i], cx = x0 + (n - 1 - i) * adv + adv / 2, lo = Math.floor(p), f = p - lo;
      g.save(); g.beginPath(); g.rect(cx - adv / 2 - 4, BASE - PX * 0.86, adv + 8, PX * 0.98); g.clip();
      glyph(String(((lo % 10) + 10) % 10), cx, BASE - f * LINE, PX);
      if (f > 0.001) glyph(String((((lo + 1) % 10) + 10) % 10), cx, BASE + (1 - f) * LINE, PX);
      g.restore();
    }
    glyph('%', x0 + n * adv + 3 + pw / 2, BASE, Math.round(PX * 0.5));
    // the hairline under the count and the leader down to the head (the tag's own line)
    g.fillStyle = INK; g.fillRect(x0 - 2, BASE + 4, total + 4, 4);
    g.fillStyle = 'rgba(244,239,226,0.9)'; g.fillRect(x0, BASE + 5, total, 2);
    for (let y = BASE + 9; y < H; y += 6) { g.fillStyle = INK; g.fillRect(W / 2 - 2, y, 4, 4); g.fillStyle = 'rgba(244,239,226,0.9)'; g.fillRect(W / 2 - 1, y + 1, 2, 2); }
    this.texture.needsUpdate = true;
  }

  /** Drawn again from scratch (the count face has loaded). */
  redraw() { this.key = ''; }

  dispose() { this.sprite.removeFromParent(); this.texture.dispose(); this.material.dispose(); }
}
