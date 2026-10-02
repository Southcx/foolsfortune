// ---------------------------------------------------------------------------------------
// UTILITY: how a creature chooses what to do. Every thing it could do is an ACTION, and every action scores itself from 0 to 1 by
// multiplying a few CONSIDERATIONS, each a number about the world (how thirsty, how far, how afraid, how long since) bent through a
// RESPONSE CURVE into how much that number argues for the action. The best score wins. Nothing is a branch in code: a creature that
// is a little thirsty and very afraid runs before it drinks because the numbers say so, and a new want is one more action in a list.
//
//   const r = new Reasoner([...actions])      r.choose(ctx) -> { action, score }      r.scores(ctx) (all of them, for the debugger)
//
//   an action:  { id, weight = 1,                    its band: 1 ordinary, 2 urgent (a threat), 3 overriding (a scripted macro)
//                 when(ctx) -> bool,                  a hard gate (it cannot happen at all: no water known, on cooldown elsewhere)
//                 consider: [ (ctx) -> 0..1, ... ],    each already shaped by a curve (below)
//                 cooldown = 0,                        seconds after it ends before it may be chosen again
//                 lock(ctx) -> bool,                   while true, it will not be interrupted (a wind-up, a bite)...
//                 urgent = false,                      ...except by an action marked urgent that outscores it (a stun, a flinch)
//                 enter(ctx), tick(ctx, dt) -> 'run' | 'done' | 'fail', exit(ctx, why) }
//
// The current action keeps a MOMENTUM bonus (it is multiplied by 1.25 when compared), so two near scores do not flicker between them
// every think; an action that has just ended rests for its cooldown. A score is the product of its considerations, with the
// compensation of Dave Mark's Infinite Axis Utility System (a product of many factors sinks however good each is, so each is lifted a
// little by how many there are).
//
// Prior art: Dave Mark's "Behavioral Mathematics for Game AI" and the Infinite Axis Utility System (GDC 2010-2015 with Kevin Dill:
// response curves, compensation, weights as bands), the needs and advertisements of The Sims (Will Wright, Don Hopkins), and the
// momentum ("commitment") every utility system adds so an agent finishes what it starts.
// ---------------------------------------------------------------------------------------

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : Number.isFinite(x) ? x : 0);

/** Response curves: each returns a function of x (0..1 in, 0..1 out). Shape the input first with `norm`. */
export const curve = {
  /** a straight line: m x + b */
  linear: (m = 1, b = 0) => (x) => clamp01(m * x + b),
  /** a power: x^k (k > 1 holds back until late, k < 1 rises early); `inv` turns it round (1 - x)^k */
  power: (k = 2, inv = false) => (x) => clamp01(Math.pow(clamp01(inv ? 1 - x : x), k)),
  /** the S: low until `mid`, high after, `k` how sharply */
  logistic: (mid = 0.5, k = 10) => (x) => clamp01(1 / (1 + Math.exp(-k * (x - mid)))),
  /** the reverse S: high until `mid`, low after */
  fall: (mid = 0.5, k = 10) => (x) => clamp01(1 - 1 / (1 + Math.exp(-k * (x - mid)))),
  /** a bump at `mid`, `w` wide: a distance the creature likes (a lunge's reach) */
  bell: (mid = 0.5, w = 0.2) => (x) => clamp01(Math.exp(-((x - mid) * (x - mid)) / (2 * w * w))),
  /** yes or no at `at` */
  step: (at = 0.5, lo = 0, hi = 1) => (x) => (x >= at ? hi : lo),
  /** a constant floor: never less than `lo` (a want that is always a little there) */
  floor: (lo, f) => (x) => lo + (1 - lo) * f(x),
};

/** x from [lo, hi] to [0, 1] (clamped). */
export const norm = (x, lo, hi) => clamp01((x - lo) / (hi - lo || 1));
/** A consideration: an input read from the context, shaped by a curve. */
export const consider = (input, shape = curve.linear()) => (ctx) => shape(clamp01(input(ctx)));

export class Reasoner {
  constructor(actions, { momentum = 1.25 } = {}) {
    this.actions = actions;
    this.momentum = momentum;
  }

  score(a, ctx) {
    if (a.when && !a.when(ctx)) return 0;
    const cs = a.consider || [];
    let s = 1;
    for (const c of cs) { const v = clamp01(c(ctx)); s *= v; if (s <= 0) return 0; }
    if (cs.length > 1) { const mod = 1 - 1 / cs.length; s += (1 - s) * mod * s; } // (the IAUS compensation)
    return s * (a.weight ?? 1);
  }

  /** The best action now (and its score), honouring cooldowns, the current action's lock, and momentum. */
  choose(ctx) {
    const b = ctx.brain, cur = b.action, now = b.now;
    let best = null, bs = 0;
    const locked = cur && cur.lock?.(ctx);
    for (const a of this.actions) {
      if (a !== cur && (b.cool.get(a.id) ?? -1) > now) continue;
      if (locked && a !== cur && !a.urgent) continue;
      let s = this.score(a, ctx);
      if (a === cur) s *= this.momentum;
      if (s > bs) { bs = s; best = a; }
    }
    return { action: best, score: bs };
  }

  /** Every action's score, best first (the F3 overlay's view of a mind). */
  scores(ctx) { return this.actions.map((a) => [a.id, this.score(a, ctx)]).sort((x, y) => y[1] - x[1]); }
}
