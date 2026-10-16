// ---------------------------------------------------------------------------------------
// THE REWIND (docs/plans/SKIFF-RACING.md section 12): in practice, Backspace held runs the board back along the way it came, the clock
// with it, at real speed; let go, it rides on from there with the speed it had then (Forza's rewind, GRID's flashback, Braid's time).
// Practice only (modes.js `rewind`): a time rewound is not a time, so practice keeps none. The race keeps the frames (keep) while it
// runs; a restart or a finish clears them. Event: race.rewind { seconds } when it is let go (with `by`).
//
// Prior art: Forza Motorsport 4's rewind (held, scrubbed, let go to ride on), GRID's flashbacks, Prince of Persia: The Sands of Time.
//
//   const W = new Rewind(game, race)   W.keep(dt)   W.back(dt)   W.release()   W.clear()   REWIND (the numbers)
// ---------------------------------------------------------------------------------------

/** Frames kept a real second, and real seconds kept at most (the oldest dropped). */
export const REWIND = { hz: 20, keep: 30 };

export class Rewind {
  constructor(game, race) { this.game = game; this.race = race; this.frames = []; this.acc = 0; this.went = 0; }
  get skiff() { return this.game.techs?.active?.id === 'skiff' ? this.game.techs.active : null; }
  /** A frame of the run kept (where, which way, how fast, and the race's clock and gates). */
  keep(dt) {
    const S = this.skiff, P = this.game.player, r = this.race; if (!S || S.phase !== 'ride') return;
    if ((this.acc += dt) < 1 / REWIND.hz) return; this.acc = 0;
    this.frames.push({ x: P.pos.x, y: P.pos.y, z: P.pos.z, h: S.heading, vx: S.v.x, vz: S.v.z, t: r.t, lapT: r.lapT, lap: r.lap, next: r.next, splits: r.splits.length, s: this.game.raceway?.s });
    if (this.frames.length > REWIND.hz * REWIND.keep) this.frames.shift();
  }
  /** Backspace held: back one frame's worth of the way it came. */
  back(dt) {
    const S = this.skiff, P = this.game.player, r = this.race, f = this.frames[this.frames.length - 1]; if (!S || !f) return;
    if ((this.acc += dt) >= 1 / REWIND.hz && this.frames.length > 1) { this.acc = 0; this.frames.pop(); this.went += 1 / REWIND.hz; }
    S.hold = true; S.air = false; S.v.set(0, 0, 0); S.heading = f.h;
    P.pos.set(f.x, f.y, f.z); P.prevPos.copy(P.pos); P.renderPos?.copy(P.pos); P.vel.set(0, 0, 0); P.place?.();
    r.t = f.t; r.lapT = f.lapT; r.lap = f.lap; r.next = f.next; r.splits.length = Math.min(r.splits.length, f.splits); if (f.s != null) r.prevS = f.s;
    this.held = f;
  }
  /** Let go: ride on from the frame it stopped at, with the speed it had there. */
  release() {
    const S = this.skiff, f = this.held; this.held = null; if (!f) return;
    if (S) { S.hold = false; S.v.set(f.vx, 0, f.vz); }
    this.game.events?.emit('race.rewind', { seconds: +this.went.toFixed(1), by: 'courier' }); this.went = 0;
  }
  clear() { this.frames.length = 0; this.acc = 0; this.held = null; this.went = 0; }
}
