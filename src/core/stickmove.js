// ---------------------------------------------------------------------------------------
// A STICK'S PUSH AS THE MOVES (docs/plans/MOBILE.md 10, answer 1; shared by core/touchdriver.js's move area and core/paddriver.js's left
// stick). The core movement is the gold standard (CLAUDE.md), so a stick never invents a speed: on foot it gives a UNIT direction (the
// keys' own wish, at any angle) and the push chooses the gait the keys already have: under STICK.walk the walk (Alt held), past the
// outer ring or with the pad's latch the sprint (Shift held, taken only on the ground or kept once held, so crossing the ring in the air
// is never the air dash's Shift press). On the Solar Skiff the push is the steer, truly analog (`steer` axis), and A / D are held past
// STICK.key for what reads them (the grind's balance); W and S are never pressed there (the sail and the brake are their own controls),
// and on touch the ring is the carve (`move.outerL` / `move.outerR`). The keys W / A / S / D are held by direction for every reader of
// keys; `input.axes` carries the push for the two that read it (courier/player.js, courier/skiff/skiff.js).
//
// Prior art: every twin-stick game's radial dead zone (rescaled past it, so a small push is still a small push); Zelda: Breath of the
// Wild's walk / run by the stick's tilt; the genre's L3 sprint latched until the stick eases off.
//
//   const S = new StickMove(game, input, actions, kind)   S.set(x, y, { sprint, steerFull })   S.clear()   STICK
// ---------------------------------------------------------------------------------------

/** dead: the push under which there is none; walk: under it, the walk; key: a direction's component past which its key is held;
 *  outer: the ring, a push past it the sprint (on foot) or the carve (on the skiff, touch). */
export const STICK = { dead: 0.15, walk: 0.55, key: 0.38, outer: 1.15 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class StickMove {
  constructor(game, input, actions, kind) { this.game = game; this.input = input; this.actions = actions; this.kind = kind; this.keys = new Set(); this.ctl = null; }
  key(code, on) { if (on === this.keys.has(code)) return; if (on) this.keys.add(code); else this.keys.delete(code); this.input.hold(code, on); }

  /** x right, y forward; their length is the push (past 1 is past the ring). `sprint`: the driver's own (the pad's latch); `steerFull`:
   *  the push that is a full steer (touch 1, the pad's 0.9). */
  set(x, y, { sprint = false, steerFull = 1 } = {}) {
    const push = Math.hypot(x, y), L = this.actions.live(), inp = this.input;
    if (push < STICK.dead) return this.clear();
    this.on = true;
    const ux = x / push, uy = y / push, skiff = L.has('skiff');
    inp.axes.moveX = ux; inp.axes.moveY = uy; // (a unit direction: the core movement's own speeds)
    inp.axes.steer = clamp(x / steerFull, -1, 1);
    this.key('KeyD', ux > STICK.key); this.key('KeyA', ux < -STICK.key);
    this.key('KeyW', !skiff && uy > STICK.key); this.key('KeyS', !skiff && uy < -STICK.key);
    const foot = L.has('foot');
    this.key('AltLeft', foot && push < STICK.walk);
    const wantSprint = foot && (sprint || push >= STICK.outer);
    this.key('ShiftLeft', wantSprint && (this.keys.has('ShiftLeft') || this.game.player?.grounded !== false));
    const carve = skiff && !L.has('skiff.air') && this.kind === 'touch' && push >= STICK.outer ? (x < 0 ? 'move.outerL' : 'move.outerR') : null;
    if (carve !== this.ctl) { if (this.ctl) this.actions.press('touch', this.ctl, false); if (carve) this.actions.press('touch', carve, true); this.ctl = carve; }
  }
  clear() {
    if (!this.on) return; this.on = false; // (only what this stick set: a pad at rest never wipes a thumb's push)
    for (const c of [...this.keys]) this.key(c, false);
    if (this.ctl) { this.actions.press('touch', this.ctl, false); this.ctl = null; }
    delete this.input.axes.moveX; delete this.input.axes.moveY; delete this.input.axes.steer;
  }
}
