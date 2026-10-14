// ---------------------------------------------------------------------------------------
// THE FLYOVER (docs/plans/SKIFF-RACING.md section 12): before a race's countdown, a camera shows the line: a few cuts along it, each a
// short drift over a stretch the race will ask something of (a gate's), then back to the Courier on the grid. F or Space skips it.
// It is a camera shot (vfx/cinema.js `shot`), so the letterbox comes with it; the board is held on the grid meanwhile (race.js).
// Event: race.flyover { skipped } (with `by`).
//
// Prior art: Mario Kart's and Gran Turismo's pre-race flyovers (the track shown in cuts before the grid), F1's onboard lap preview.
//
//   const F = new Flyover(game)   F.begin(T, raceway)   F.update(dt)   F.on   F.stop()   FLYOVER (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The cuts: how many, real seconds each, metres drifted along the line in one, the camera's height over the line and metres behind
 *  the point it looks at, how far ahead it looks. */
export const FLYOVER = { cuts: 4, each: 1.8, drift: 60, up: 16, behind: 24, ahead: 30 };

export class Flyover {
  constructor(game) { this.game = game; this.on = false; }
  begin(T, R) {
    this.T = T; this.R = R; this.on = true; this.t = 0;
    const gs = T.gates, n = Math.min(FLYOVER.cuts, gs.length), stride = gs.length / n;
    this.cuts = Array.from({ length: n }, (_, k) => gs[Math.floor(k * stride + stride - 1)] - FLYOVER.drift); // (a stretch before every other gate)
  }
  /** Where the camera is at `s` on the line, and what it looks at. */
  at(s) {
    const T = this.T, R = this.R, F = T.frame(s - FLYOVER.behind), A = T.frame(s + FLYOVER.ahead);
    return { pos: R.local(F.x, F.z).add(new THREE.Vector3(0, FLYOVER.up, 0)), look: R.local(A.x, A.z).add(new THREE.Vector3(0, 2, 0)) };
  }
  update(dt) {
    if (!this.on) return;
    const g = this.game, P = g.player, skip = P?.peekLatch?.('KeyF') || P?.peekLatch?.('Space');
    if (skip) { P.latch?.('KeyF'); P.latch?.('Space'); }
    this.t += g.rawDt ?? dt;
    const k = Math.floor(this.t / FLYOVER.each);
    if (skip || k >= this.cuts.length) { this.stop(); g.events?.emit('race.flyover', { skipped: !!skip, by: 'courier' }); return; }
    const u = (this.t - k * FLYOVER.each) / FLYOVER.each, at = this.at(this.cuts[k] + u * FLYOVER.drift);
    if (k !== this.k) { this.k = k; g.cinema?.cut?.('race.flyover'); } // (a cut between stretches, not a sweep across the park)
    g.cinema?.shot('race.flyover', { pos: at.pos, look: at.look, bars: 1, ease: 30, fov: -4 });
  }
  stop() { if (!this.on) return; this.on = false; this.k = null; this.game.cinema?.unshot('race.flyover'); }
}
