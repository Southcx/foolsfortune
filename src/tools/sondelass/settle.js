// ---------------------------------------------------------------------------------------
// THE SETTLE (plain name; docs/plans/SONDELASS-FEEL.md 3F): at a string's end, left alone, the Courier settles through the suite's
// flourish (Sond_Flourish: the owner's, courier_anims_melee.glb, unused until now) back to the cutlass's stance: the blade turned in the
// hand and flicked down and out at the last (a chiburi's shape), the breath after the line. A look on the tool's upper layer only, laid
// where the combo engine's own pose would be (cutlass.js pose); it changes no rule, no timing and no window of the string.
//   - WHEN: the string's last blow (the engine's `c.last`, the finisher) ended on its own, or the string's window ran out (the engine's
//     lapse, RESET after a blow: `moves.n` back to -1 then) with nothing pressed, the Courier standing on the ground and still, in the
//     third person; once a string (a blow begun arms it again).
//   - CUT AT ONCE by any press at all (an attack, a move, the jump, the guard, the blink, the stow, a form), a movement key held, the body
//     moving or off the ground, or anything else of the tool's posing: its last pose let go over CUT real s (three frames: never a pop).
//   - IN AND OUT: come in from the stance over IN clip s, played at RATE, crossfaded back into the stance over its last OUT clip s.
// Event for the ear: `cutlass.settle { beat: 'begin' | 'flick' | 'cut' }` (the flick: the flourish's last cut, FLICK clip s).
//
// Prior art: the iaido's chiburi and noto (the blood flicked from the blade, the blade returned: the breath after the cut); the idle
// flourishes of character action games after a combo (Devil May Cry's sword twirl when a string is left alone, Bayonetta's pose);
// fighting games' recovery animations cancelled by any input.
//
//   const st = new CutlassSettle(cutlass)   st.update(dt, inp) (each frame the cutlass is read)   st.arm(c) (a blow ended: moves' onEnd)
//   st.reset() (a blow began)   st.cut()   st.pose(C, out) -> { pose, w } | null   st.active
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const SETTLE = { clip: 'Sond_Flourish', rate: 1.3, in: 0.24, out: 0.3, cut: 0.05, still: 0.6, flick: 1.73, lapse: 1.1 };

const smooth = (a, b, x) => { const k = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };

export class CutlassSettle {
  constructor(cutlass) { this.cutlass = cutlass; this.t = -1; this.armed = false; this.spent = false; this.nPrev = -1; this.last = null; this.lastW = 0; this.drop = 0; this.flicked = false; }
  get active() { return this.t >= 0; }
  get game() { return this.cutlass.game; }

  /** A blow of the string ended on its own: the finisher arms the settle at once. */
  arm(c) { if (c?.last) this.armed = true; }
  /** A blow began: the string is going on; the settle is the next string's to have. */
  reset() { this.armed = false; this.spent = false; this.cut(); }

  cut(why = 'cut') {
    if (this.t < 0) return;
    this.t = -1; this.drop = this.lastW > 0.01 ? 1 : 0;
    this.game.events?.emit('cutlass.settle', { beat: why, by: 'courier' });
  }

  /** Whether the Courier is left alone this frame: nothing pressed or held to move, on the ground and still, nothing else posing. */
  quiet(inp) {
    const P = this.cutlass.tool.P, cl = this.cutlass;
    if (inp.pressed?.size || inp.axis('moveX') || inp.axis('moveY')) return false;
    if (!P.grounded || P.fp || Math.hypot(P.vel.x, P.vel.z) > SETTLE.still) return false;
    return !cl.moves.cur && !cl.busy && !cl.blade.active && cl.parryT >= 0.9 && cl.guardW < 0.02 && cl.iaiW < 0.01;
  }

  update(dt, inp) {
    const M = this.cutlass.moves, C = this.game.character?.clips;
    const lapsed = this.nPrev >= 0 && M.n === -1 && !M.cur && M.after < SETTLE.lapse; // (the string's window just ran out: moveset.js lapse)
    this.nPrev = M.n;
    if (this.drop > 0) this.drop = Math.max(0, this.drop - (this.game.rawDt || dt) / SETTLE.cut);
    const quiet = this.quiet(inp);
    if (this.t >= 0) {
      if (!quiet) { this.cut(); return; }
      this.t += dt * SETTLE.rate;
      if (!this.flicked && this.t >= SETTLE.flick) { this.flicked = true; this.game.events?.emit('cutlass.settle', { beat: 'flick', by: 'courier' }); }
      if (this.t >= this.dur) { this.t = -1; this.lastW = 0; }
      return;
    }
    if ((this.armed || lapsed) && !this.spent) {
      this.armed = false;
      if (!quiet || !C?.clips[SETTLE.clip]) return; // (pressed, moving, in the air: no settle this string)
      this.spent = true; this.t = 0; this.flicked = false; this.dur = (C.clips[SETTLE.clip].n - 1) / C.fps;
      this.game.events?.emit('cutlass.settle', { beat: 'begin', by: 'courier' });
    }
  }

  /** The flourish's pose over the stance while it plays; once cut, its last pose let go over CUT. */
  pose(C, out) {
    if (this.t >= 0) {
      C.sample(SETTLE.clip, this.t, out, false);
      this.lastW = smooth(0, SETTLE.in, this.t) * (1 - smooth(this.dur - SETTLE.out, this.dur, this.t));
      (this.last ||= C.pose()).copy(out);
      return { pose: out, w: this.lastW };
    }
    if (this.drop > 0 && this.last) { out.copy(this.last); return { pose: out, w: this.lastW * this.drop }; }
    return null;
  }
}
