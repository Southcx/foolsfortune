// ---------------------------------------------------------------------------------------
// THE SWIPES ON TOUCH (docs/plans/MOBILE.md 8, the skiff's table: "the shoulder (Q / E tapped twice): a swipe left or right on the right
// half"): a quick flick sideways on the look area presses the row the bindings give `swipe.left` or `swipe.right` in the live context
// (core/bindings.js: on the Solar Skiff the shoulder's Q and E), tapped twice where the row is a double tap, each tap held a beat and
// spaced a beat, so the board reads two presses inside its window (courier/skiff/boardrules.js SHOULDER.tap) as it reads the keys'.
// Off a context that names a swipe, a flick is only the look's drag.
//
// Prior art: Rocket League Sideswipe's flicks on the right half (a swipe is a dodge), Subway Surfers' lane swipes (judged on distance and
// time, the cross axis ignored).
//
//   const W = new TouchSwipes(game, input, actions)   W.down(finger, ms)   W.move(finger, ms) -> pressed?   W.update()   SWIPE
// ---------------------------------------------------------------------------------------
import { codeFor } from './bindings.js';

/** px: how far across a flick goes; ms: within how long of the finger landing (real ms); ratio: how much more across than up or down;
 *  beat: how long each tap of a double is held, and the gap between them (real ms). */
export const SWIPE = { px: 60, ms: 260, ratio: 2, beat: 50 };

export class TouchSwipes {
  constructor(game, input, actions) { this.game = game; this.input = input; this.actions = actions; this.steps = []; }
  /** The look finger came down (`finger`: the driver's { x0, y0, x, y }; `ms`: its event's timeStamp): watched for a flick. */
  down(f, ms) { f.swipe = { ms, done: false }; }
  /** It moved: a flick across, quick and mostly sideways, presses its row once. */
  move(f, ms) {
    const s = f.swipe; if (!s || s.done || ms - s.ms > SWIPE.ms) return false;
    const dx = f.x - f.x0, dy = f.y - f.y0;
    if (Math.abs(dx) < SWIPE.px || Math.abs(dx) < SWIPE.ratio * Math.abs(dy)) return false;
    s.done = true;
    const row = this.actions?.resolve?.('touch', dx > 0 ? 'swipe.right' : 'swipe.left'), code = row && codeFor(row); if (!code) return false;
    const t = performance.now(), n = row.how === 'double' ? 2 : 1;
    for (let k = 0; k < n; k++) this.steps.push([t + 2 * k * SWIPE.beat, code, true], [t + (2 * k + 1) * SWIPE.beat, code, false]);
    this.steps.sort((a, b) => a[0] - b[0]); // (a second flick under the first's taps: kept in time order)
    return true;
  }
  /** Once a frame: the next tap step due, a press with its edge (a person pressed it, core/input.js) or its letting go; one step a
   *  frame at most, so a long frame never folds a double tap into one frame the board cannot see. */
  update() {
    if (!this.steps.length || this.steps[0][0] > performance.now()) return;
    const [, code, on] = this.steps.shift(); this.input.hold(code, on, on);
  }
}
