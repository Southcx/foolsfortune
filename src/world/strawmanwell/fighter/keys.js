// ---------------------------------------------------------------------------------------
// THE ARENA'S KEYS (docs/plans/FIGHTER.md 2): while the fighter kit is on, the keys its controls table takes (Shift the shield, E the
// smash, R the grab, LMB the attack, RMB the special) are the kit's alone: hidden from everything else that reads the game's input (the
// psygun's trigger and draw, the belt's lend and swap, the techs' latches, the core's dash and slide) by a mask laid over the input's
// own `isDown` and `wasPressed` on the instance, and taken off whole when the kit leaves (the frame's Proxy over the Courier's input
// does the same for the Player: wellframe.js). The kit reads the true keys underneath. A press is latched once a render frame and
// spent by the first fixed step that reads it, so a tap in a frame with no fixed step (a fast display) is never lost, and none is read
// twice. W, F, A, D, S, Space, Esc and the windows' keys pass through (W at a door, F at a lectern, the core's run and crouch).
//
// Prior art: the frame's own input Proxy (wellframe.js) and the psygun's `deadInput` (tools/psygun/weapon.js: a view of the keys with
// some held up); Melee's controller read once a frame and buffered by the game, not the pad.
//
//   const K = new ArenaKeys(game.input)   K.on()   K.off()   K.down(code)   K.fresh(code) (once a press)   K.frame() (each render frame)
//   MASKED (the codes hidden while on)
// ---------------------------------------------------------------------------------------

/** Hidden from the rest of the game while the kit is on: its own keys, and what else they would set going (the tools and techs). */
export const MASKED = new Set(['Mouse0', 'Mouse1', 'Mouse2', 'ShiftLeft', 'ShiftRight', 'KeyE', 'KeyR', 'KeyQ', 'KeyX', 'KeyV', 'KeyG', 'KeyC', 'KeyH', 'KeyY', 'KeyT']);
/** What the kit reads fresh: latched each render frame until a fixed step spends it. */
const READ = ['KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space', 'Mouse0', 'Mouse2', 'KeyE', 'KeyR', 'ShiftLeft', 'ShiftRight'];

export class ArenaKeys {
  constructor(input) { this.input = input; this.own = null; this.latch = new Set(); this.spent = new Map(); this.n = 0; }
  get onNow() { return !!this.own; }

  on() {
    const inp = this.input; if (!inp || this.own) return;
    const has = (k) => Object.prototype.hasOwnProperty.call(inp, k);
    this.own = { isDown: has('isDown') ? inp.isDown : null, wasPressed: has('wasPressed') ? inp.wasPressed : null };
    const isDown = inp.isDown, wasPressed = inp.wasPressed;
    this.rawDown = (c) => isDown.call(inp, c); this.rawPressed = (c) => wasPressed.call(inp, c);
    inp.isDown = (c) => (MASKED.has(c) ? false : isDown.call(inp, c));
    inp.wasPressed = (c) => (MASKED.has(c) ? false : wasPressed.call(inp, c));
    this.latch.clear(); this.spent.clear();
  }
  off() {
    const inp = this.input; if (!inp || !this.own) return;
    for (const k of ['isDown', 'wasPressed']) { if (this.own[k]) inp[k] = this.own[k]; else delete inp[k]; }
    this.own = null; this.latch.clear();
  }

  down(c) { return this.own ? this.rawDown(c) : !!this.input?.isDown(c); }
  /** A press not yet spent: this frame's (if no fixed step has read it) or one latched from a frame with none. */
  fresh(c) {
    if (!this.own) return false;
    if (this.latch.has(c)) { this.latch.delete(c); this.spent.set(c, this.n); return true; }
    if (this.rawPressed(c) && this.spent.get(c) !== this.n) { this.spent.set(c, this.n); return true; }
    return false;
  }
  /** Each render frame, after its fixed steps: a press no step read is latched for the next; the frame's token moves on. */
  frame() {
    if (!this.own) return;
    for (const c of READ) if (this.rawPressed(c) && this.spent.get(c) !== this.n) this.latch.add(c);
    this.n++;
  }
}
