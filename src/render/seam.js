// ---------------------------------------------------------------------------------------
// THE SEAM: a place changed under a cover. Going down into a Well (or any change that builds a place and teleports the Courier into
// it) dips to the dark, makes the change while nothing can be seen, holds for a couple of drawn frames so the first frame of the new
// place is already done, and comes back up. The cover carries no words (CLAUDE.md: marks in the world are not text); its look is a
// `kind` for Calissa to dress (`data-kind` on the cover: 'maw' for a Well, a swirl of the pool closing over the view).
//
// Prior art: the console way of hiding a load inside a transition (Metroid Prime's doors and elevators, Jak and Daxter's streamed
// world behind a fade, the RPG battle wipe), timed on the game's own clock so a playtest and a replay step through it the same.
//
//   game.seam = new Seam(game)   game.seam.cross(fn, { kind, out, hold, back }) -> false if one is already under way
//   game.seam.update(rawDt) (main.js, each tick)   game.seam.busy
// ---------------------------------------------------------------------------------------

export class Seam {
  constructor(game) {
    this.game = game;
    this.job = null;
    this.el = document.createElement('div');
    this.el.id = 'seam';
    this.el.style.cssText = 'position:fixed;inset:0;background:#07030d;opacity:0;pointer-events:none;z-index:11';
    document.body.appendChild(this.el);
  }

  get busy() { return !!this.job; }

  /** Dip to the dark over `out` seconds, run `fn` there, hold `hold` drawn frames, come back over `back` seconds. */
  cross(fn, { kind = 'plain', out = 0.22, hold = 2, back = 0.35 } = {}) {
    if (this.job) return false;
    this.job = { fn, out, hold, back, t: 0, phase: 'out' };
    this.el.dataset.kind = kind;
    return true;
  }

  update(dt) {
    const J = this.job; if (!J) return;
    if (J.phase === 'out') {
      J.t += dt; this.el.style.opacity = String(Math.min(1, J.t / J.out));
      if (J.t >= J.out) { this.el.style.opacity = '1'; try { J.fn(); } finally { J.phase = 'hold'; J.n = J.hold; } }
    } else if (J.phase === 'hold') {
      if (--J.n <= 0) { J.phase = 'back'; J.t = 0; }
    } else {
      J.t += dt; this.el.style.opacity = String(Math.max(0, 1 - J.t / J.back));
      if (J.t >= J.back) { this.el.style.opacity = '0'; this.job = null; }
    }
  }
}
