// ---------------------------------------------------------------------------------------
// THE ARENA'S KEYS (docs/plans/FIGHTER.md 2): while the fighter kit is on, the keys its controls table takes (Shift the shield, E the
// smash, R the grab, LMB the attack, RMB the special) are the kit's alone: hidden from everything else that reads the game's input (the
// psygun's trigger and draw, the belt's lend and swap, the techs' latches, the core's dash and slide) by the input's own claim
// (`input.claim('arena', MASKED)`, core/input.js: the claimed codes read up and unpressed to every other reader, `axis` too), released
// whole when the kit leaves. The kit reads the true keys underneath (`input.rawDown`, `input.rawPressed`). A press is latched once a
// render frame and spent by the first fixed step that reads it, so a tap in a frame with no fixed step (a fast display) is never lost,
// and none is read twice. W, F, A, D, S, Space, Esc and the windows' keys pass through (W at a door, F at a lectern, the core's run
// and crouch).
//
// Prior art: the input's claim (Petra's, core/input.js, built for this); the psygun's `deadInput` (tools/psygun/weapon.js: a view of
// the keys with some held up); Melee's controller read once a frame and buffered by the game, not the pad.
//
//   const K = new ArenaKeys(game.input)   K.on()   K.off()   K.down(code)   K.fresh(code) (once a press)   K.frame() (each render frame)
//   MASKED (the codes claimed while on)
// ---------------------------------------------------------------------------------------

/** Hidden from the rest of the game while the kit is on: its own keys, and what else they would set going (the tools and techs). */
export const MASKED = new Set(['Mouse0', 'Mouse1', 'Mouse2', 'ShiftLeft', 'ShiftRight', 'KeyE', 'KeyR', 'KeyQ', 'KeyX', 'KeyV', 'KeyG', 'KeyC', 'KeyH', 'KeyY', 'KeyT']);
/** What the kit reads fresh: latched each render frame until a fixed step spends it. */
const READ = ['KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space', 'Mouse0', 'Mouse2', 'KeyE', 'KeyR', 'ShiftLeft', 'ShiftRight'];

const OWNER = 'arena';

export class ArenaKeys {
  constructor(input) { this.input = input; this.live = false; this.latch = new Set(); this.spent = new Map(); this.n = 0; }

  on() {
    if (!this.input || this.live) return;
    this.input.claim(OWNER, MASKED); this.live = true;
    this.latch.clear(); this.spent.clear();
  }
  off() {
    if (!this.input || !this.live) return;
    this.input.release(OWNER); this.live = false; this.latch.clear();
  }

  down(c) { return this.live ? this.input.rawDown(c) : !!this.input?.isDown(c); }
  /** A press not yet spent: this frame's (if no fixed step has read it) or one latched from a frame with none. */
  fresh(c) {
    if (!this.live) return false;
    if (this.latch.has(c)) { this.latch.delete(c); this.spent.set(c, this.n); return true; }
    if (this.input.rawPressed(c) && this.spent.get(c) !== this.n) { this.spent.set(c, this.n); return true; }
    return false;
  }
  /** Each render frame, after its fixed steps: a press no step read is latched for the next; the frame's token moves on. */
  frame() {
    if (!this.live) return;
    for (const c of READ) if (this.input.rawPressed(c) && this.spent.get(c) !== this.n) this.latch.add(c);
    this.n++;
  }
}
