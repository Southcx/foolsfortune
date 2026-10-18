// ---------------------------------------------------------------------------------------
// THE CUBE PLATE (a part of the Lachrimeter's tube, vfx/lachrimetertube.js; the owner, 2026-10-18: "put the cube counter on the
// thermometer's base"): a small brass plate on the plinth's face, left of the pool's count, holding a Nixie window: a little bismuth
// cube (the cubes' hopper crystal, world/treasure/cubes.js and vfx/bismuth.js: near-black terraces stepping in, each lip catching the
// oil film) and the balance (game.cubes.balance) in the count face (Jersey 15), each digit in its own fixed cell, rolling within it
// when the count changes (up for a gain, down for a spend) while the cube jumps on a gain. The pool's count is a VFD (cyan-green);
// the cubes' is a Nixie's neon (orange): two tubes, two stuffs. The canvas is redrawn only while something in it moves.
//
// Prior art: the Nixie tube (Burroughs, 1955; the stacked cathodes glowing orange through a hex anode mesh); the odometer's and the
// flip counter's rolling wheels (a digit in its cell, turned to the next); the cubes' own retired DOM readout (its pop on a gain).
//
//   const C = new CubePlate()   C.canvas (its picture: the tube maps it on the plate's face)   C.update(dt, balance) -> true when redrawn
//   C.dirty = true (the fonts came in)
// ---------------------------------------------------------------------------------------
import { FONT } from '../../ui/theme.js';

const COUNT_FONT = `'Jersey 15', ${FONT.sys}`;
export const PLATE_W = 0.92, PLATE_H = 0.44; // (the plate's window in the tube's units)
const W = 368, H = 176, GLYPH = 104, CELLS = 4, ROLL = 0.28, JUMP = 0.42; // (canvas px; the glyph's share; the least cells; real seconds)
const FILM = ['#4c0fb3', '#0a8cbf', '#f2b82e', '#d91a80']; // (the labradorite film: vfx/oxidation.js)

/** A digit lit in its cell (the neon and its hot core); a blank cell stays dark. */
function glow(x, ch, cx, y) {
  if (ch === ' ') return;
  x.shadowColor = '#ff7a1a'; x.shadowBlur = 14; x.fillStyle = '#ffab4a'; x.fillText(ch, cx, y);
  x.shadowBlur = 4; x.fillStyle = '#ffe2b8'; x.fillText(ch, cx, y);
}

export class CubePlate {
  constructor() {
    this.canvas = document.createElement('canvas'); this.canvas.width = W; this.canvas.height = H;
    this.shown = -1; this.digits = ''; this.from = ''; this.dir = 1; this.u = 1; this.jump = 1; this.dirty = true; this.fs = 0;
  }

  update(dt, balance) {
    if (balance !== this.shown) {
      const next = String(Math.max(0, balance | 0)), cells = Math.max(CELLS, next.length);
      this.from = this.shown < 0 ? next.padStart(cells, ' ') : this.digits.padStart(cells, ' ');
      if (cells !== this.digits.length) this.fs = 0; // (a cell more: the face is fitted again)
      this.digits = next.padStart(cells, ' ');
      if (this.shown >= 0) { this.u = 0; this.dir = balance > this.shown ? 1 : -1; if (balance > this.shown) this.jump = 0; }
      this.shown = balance; this.dirty = true;
    }
    const moving = this.u < 1 || this.jump < JUMP;
    if (moving) { this.u = Math.min(1, this.u + dt / ROLL); this.jump = Math.min(JUMP, this.jump + dt); }
    if (!moving && !this.dirty) return false;
    this.dirty = false; this.draw(); return true;
  }

  draw() {
    const x = this.canvas.getContext('2d'), cells = this.digits.length;
    x.setTransform(1, 0, 0, 1, 0, 0); x.shadowBlur = 0; x.globalAlpha = 1;
    x.fillStyle = '#140705'; x.fillRect(0, 0, W, H);
    // the anode mesh (a Nixie's hex grid, faint)
    x.strokeStyle = 'rgba(255,140,60,.08)'; x.lineWidth = 1; x.beginPath();
    for (let j = 0; j < H; j += 6) for (let i = (j / 6) % 2 ? 3 : 0; i < W; i += 6) { x.moveTo(i, j); x.lineTo(i + 3, j + 3); }
    x.stroke();
    this.cube(x);
    // the digits, each in its cell, rolling
    const x0 = GLYPH, cw = (W - x0 - 8) / cells;
    if (!this.fs) { let fs = 100; x.font = `${fs}px ${COUNT_FONT}`; const asc = x.measureText('0').actualBoundingBoxAscent || fs * 0.62; fs = Math.round((fs * H * 0.66) / asc); x.font = `${fs}px ${COUNT_FONT}`;
      const dw = x.measureText('0').width; if (dw > cw * 0.92) fs = Math.floor((fs * cw * 0.92) / dw); this.fs = fs; }
    x.font = `${this.fs}px ${COUNT_FONT}`; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    const dh = x.measureText('0').actualBoundingBoxAscent || this.fs * 0.62, by = H / 2 + dh / 2, e = this.u * this.u * (3 - 2 * this.u);
    for (let i = 0; i < cells; i++) {
      const cx = x0 + cw * (i + 0.5), a = this.from[i], b = this.digits[i];
      x.save(); x.beginPath(); x.rect(x0 + cw * i + 2, 10, cw - 4, H - 20); x.clip();
      x.shadowBlur = 0; x.fillStyle = 'rgba(255,140,60,.08)'; x.fillText('8', cx, by); // (the unlit cathodes ghosting)
      if (a === b || e >= 1) glow(x, b, cx, by);
      else { const d = H * 0.8 * this.dir; glow(x, a, cx, by - d * e); glow(x, b, cx, by + d * (1 - e)); }
      x.restore();
    }
  }

  /** The bismuth cube: a hopper crystal face-on, its terraces stepping in to a dark heart, each lip a band of the film, offset a little
   *  each step as the crystal's spiral is; it jumps (squash and stretch) on a gain. */
  cube(x) {
    const j = this.jump < JUMP ? this.jump / JUMP : 1, ov = j < 1 ? Math.sin(j * Math.PI) : 0;
    const sx = 1 + 0.18 * ov * Math.cos(j * Math.PI * 2), sy = 1 - 0.14 * ov * Math.cos(j * Math.PI * 2), cx = GLYPH / 2 + 6, cy = H / 2 - ov * 10;
    x.save(); x.translate(cx, cy); x.rotate(Math.PI / 4); x.scale(sx * 0.92, sy * 0.92);
    let s = 78;
    x.shadowColor = 'rgba(160,120,255,.6)'; x.shadowBlur = 10;
    for (let k = 0; k < 5; k++) {
      const o = (k % 2 ? 1 : -1) * k * 1.6;
      x.fillStyle = k ? '#0c0812' : '#100b18'; x.fillRect(-s / 2 + o, -s / 2 - o, s, s);
      x.lineWidth = 4; x.strokeStyle = FILM[k % 4]; x.strokeRect(-s / 2 + o + 2, -s / 2 - o + 2, s - 4, s - 4); x.shadowBlur = 0;
      s -= 15;
    }
    x.restore();
  }
}
