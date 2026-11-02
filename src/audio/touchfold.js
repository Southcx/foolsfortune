// ---------------------------------------------------------------------------------------
// THE ARC'S FOLD HEARD (Petra's ui/touch/arc.js; TOUCH-REBUILD.md 3.1.1, 7). The arc's deliberate column is hinged as a Jacob's ladder
// (the tablitas): its tiles fall open one under another, or climb back into the meter's tile. Each tile is a wooden tablet landing on
// its neighbour, so each gets a clack, stepped on the cascade's own stride (ARC_FOLD_TIME.flip, the order of `tiles`).
//   OPEN    (touch.fold { state: 'open', tiles }) a clack a tile, climbing a step each, the last one landing on a small knock
//   FOLDED  (touch.fold { state: 'folded', tiles }) the same clacks falling back, closing on a soft shut; one tile alone (the top bar's
//           fold tile folding the whole arc, ['A']) a single lower shut
//
// Prior art: the Jacob's ladder toy (tablitas) and its cascading clack; the woodblock's click (a hyoshigi struck lightly); a phone's
// keyboard tick for how small a UI sound sits under play.
//
//   sfx.touchFold(state, tiles)
// ---------------------------------------------------------------------------------------
import { ARC_FOLD_TIME } from '../progress/toucharc.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const STEP = [0, 2, 4, 7, 9, 12, 14]; // (the tablets up the pentatonic)
/** Each moment's level against the parry's clang (set by ear in the probe). */
const LEVEL = { open: 1.6, folded: 1.6, shut: 5 };

export class TouchFoldSounds {
  foldOut(key) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(0.25, 0.15, true)); setTimeout(() => d.disconnect(), 3000); return d; }
  /** One wooden tablet landing: a woodblock's click and its short body. */
  foldClack(t, m, g, d) {
    this.noise(t, 0.018, { type: 'bandpass', f0: hz(m) * 2.6, q: 5, gain: g, dest: d });
    this.tone(t, 0.06, { f0: hz(m), f1: hz(m) * 0.96, type: 'triangle', gain: g * 0.5, dest: d });
  }

  touchFold(state = 'open', tiles = null) {
    if (!this.ok() || !this.allow('touchFold', 6)) return;
    const open = state === 'open', n = Math.max(1, Math.min(7, Array.isArray(tiles) ? tiles.length : 1));
    const t = this.ctx.currentTime, d = this.foldOut(open ? 'open' : n === 1 ? 'shut' : 'folded');
    const flip = Number.isFinite(+ARC_FOLD_TIME?.flip) ? Math.max(0.02, Math.min(0.2, +ARC_FOLD_TIME.flip)) : 0.06;
    if (!open && n === 1) { this.foldClack(t, 64, 0.35, d); this.noise(t, 0.08, { type: 'lowpass', f0: 600, gain: 0.2, dest: d }); return; } // (the whole arc shut to one stack)
    for (let i = 0; i < n; i++) { const s = STEP[open ? i : n - 1 - i] ?? 12; this.foldClack(t + i * flip, 72 + s, 0.3, d); }
    const at = t + n * flip;
    if (open) this.tone(at, 0.08, { f0: hz(84 + (STEP[n - 1] ?? 12)), type: 'sine', gain: 0.06, dest: d }); // (the last landing's knock)
    else this.noise(at - flip * 0.5, 0.07, { type: 'lowpass', f0: 700, gain: 0.18, dest: d }); // (the soft shut)
  }
}
