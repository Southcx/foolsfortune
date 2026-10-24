// ---------------------------------------------------------------------------------------
// A STICK'S PUSH AS THE MOVES (docs/plans/MOBILE.md 10, answer 1; shared by core/touchdriver.js's move area and core/paddriver.js's left
// stick). The core movement is the gold standard (CLAUDE.md), so a stick never invents a speed: on foot it gives a UNIT direction (the
// keys' own wish, at any angle) and the push chooses the gait the keys already have: under STICK.walk the walk (Alt held), past the
// outer ring or with the pad's latch the sprint (Shift held, taken only on the ground or kept once held, so crossing the ring in the air
// is never the air dash's Shift press). On the Solar Skiff the push is the steer, truly analog (`steer` axis), and A / D are held past
// STICK.key for what reads them (the grind's balance); W and S are never pressed there (the sail and the brake are their own controls),
// and on touch the ring is the carve (`move.outerL` / `move.outerR`); at the open sea's helm W and S are not pressed either (the
// throttle's taps, a step each). The keys W / A / S / D are held by direction for every reader of
// keys; `input.axes` carries the push for the two that read it (courier/player.js, courier/skiff/skiff.js).
//
// Prior art: every twin-stick game's radial dead zone (rescaled past it, so a small push is still a small push); Zelda: Breath of the
// Wild's walk / run by the stick's tilt; the genre's L3 sprint latched until the stick eases off.
//
//   const S = new StickMove(game, input, actions, kind)   S.set(x, y, { sprint, steerFull })   S.clear()   STICK
// ---------------------------------------------------------------------------------------

/** dead: the push under which there is none; walk: under it, the walk; key: a direction's component past which its key is held;
 *  outer: the ring, a push past it the sprint (on foot) or the carve (on the skiff, touch). */
export const STICK = { dead: 0.15, walk: 0.55, key: 0.38, outer: 1.5 }; // (the ring at 90 px of a 60 px push: the stick's own band, ui/touch/stick.js)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class StickMove {
  constructor(game, input, actions, kind) { this.game = game; this.input = input; this.actions = actions; this.kind = kind; this.keys = new Set(); this.ctl = null; }
  key(code, on) { if (on === this.keys.has(code)) return; if (on) this.keys.add(code); else this.keys.delete(code); this.input.hold(code, on); }

  /** x right, y forward; their length is the push (past 1 is past the ring). `sprint`: the driver's own (the pad's latch); `steerFull`:
   *  the push that is a full steer (touch 1, the pad's 0.9); `outer` and `carve`: what a stick that measures its own band says (the touch
   *  controls' ring, ui/touch/stick.js: past its band; -1, 0, 1), in place of the push's; `noAD`: the glide's thumb is the bank
   *  (progress/skifftouch.js), so A / D are let go. */
  set(x, y, { sprint = false, steerFull = 1, outer = null, carve = null, noAD = false } = {}) {
    const push = Math.hypot(x, y), L = this.actions.live(), inp = this.input;
    if (push < STICK.dead) return this.clear();
    this.on = true;
    const ux = x / push, uy = y / push, skiff = L.has('skiff');
    inp.axes.moveX = ux; inp.axes.moveY = uy; // (a unit direction: the core movement's own speeds)
    inp.axes.steer = clamp(x / steerFull, -1, 1);
    this.key('KeyD', !noAD && ux > STICK.key); this.key('KeyA', !noAD && ux < -STICK.key); // (noAD: the glide's thumb is the bank, progress/skifftouch.js)
    const noWS = skiff || L.has('helm'); // (the helm's W / S are the throttle's taps, a step each: the stick is the rudder alone there, MOBILE.md 5)
    this.key('KeyW', !noWS && uy > STICK.key); this.key('KeyS', !noWS && uy < -STICK.key);
    const foot = L.has('foot');
    this.key('AltLeft', foot && push < STICK.walk);
    const past = outer ?? push >= STICK.outer, wantSprint = foot && (sprint || past);
    this.key('ShiftLeft', wantSprint && (this.keys.has('ShiftLeft') || this.game.player?.grounded !== false));
    const side = carve ?? (past ? Math.sign(x) : 0), ctl = skiff && !L.has('skiff.air') && this.kind === 'touch' && side ? (side < 0 ? 'move.outerL' : 'move.outerR') : null;
    if (ctl !== this.ctl) { if (this.ctl) this.actions.press('touch', this.ctl, false); if (ctl) this.actions.press('touch', ctl, true); this.ctl = ctl; }
  }
  clear() {
    if (!this.on) return; this.on = false; // (only what this stick set: a pad at rest never wipes a thumb's push)
    for (const c of [...this.keys]) this.key(c, false);
    if (this.ctl) { this.actions.press('touch', this.ctl, false); this.ctl = null; }
    delete this.input.axes.moveX; delete this.input.axes.moveY; delete this.input.axes.steer;
  }
}
