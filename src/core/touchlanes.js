// ---------------------------------------------------------------------------------------
// THE RHYTHM MODE'S LANES ON TOUCH (docs/plans/MOBILE.md 5: "the rhythm mode's ten lanes as pads"; Wanda's rhythm mode reads them,
// music/rhythm/rhythm.js pads() and stamp()): while the rhythm mode plays, the screen is ten pads, five a hand as the highway parts
// them (the left half lanes 1 to 5, the right half 6 to 10), and a finger landing on one holds that lane's control (core/bindings.js
// `rh.l1` .. `rh.l10`, ctx `rhythm`) until it lifts. The touch's own timestamp is handed over first (`stamp`), so the press is judged
// on the moment the finger landed, not on the frame that read it. A finger is its lane's until it lifts: sliding never changes lanes,
// and two fingers on one lane hold it once. What the pads look like is the highway's look (Calissa's, vfx/rhythmhighway.js), which
// stands its lanes over `rect(lane)`.
//
// Prior art: every phone rhythm game's lanes as screen columns judged on the touch's own time (Cytus, Deemo, Project Sekai); a
// controller's pads (DDR's, Guitar Hero's frets: a held pad is one press); Wanda's pads() (a lane held through the input, its moment kept).
//
//   const L = new TouchLanes(game, actions)   L.active   L.down(touch, ms) -> bool   L.up(touch) -> bool   L.release()
//   L.rect(lane) -> { x, y, w, h } (CSS px)   L.laneAt(x) -> 0..9   LANE_KEYS
// ---------------------------------------------------------------------------------------

/** The lanes' keys, lane 0 first (the rhythm mode's own: music/rhythm/chart.js KEYS). */
export const LANE_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];

export class TouchLanes {
  constructor(game, actions) {
    this.game = game; this.actions = actions;
    this.fingers = new Map(); // (touch id -> lane)
    this.held = new Array(LANE_KEYS.length).fill(0); // (fingers on each lane)
  }
  get active() { return !!this.game.rhythm?.active; }
  /** The lane under a point: five across each half of the screen. */
  laneAt(x) {
    const half = innerWidth / 2, right = x >= half, k = Math.min(4, Math.max(0, Math.floor(((right ? x - half : x) / half) * 5)));
    return right ? 5 + k : k;
  }
  /** Where a lane's pad stands (CSS px from the view's top left): the whole height, a fifth of a half wide. */
  rect(lane) { const half = innerWidth / 2, w = half / 5; return { x: (lane >= 5 ? half : 0) + (lane % 5) * w, y: 0, w, h: innerHeight }; }
  /** A finger landed (`ms` its event's timeStamp, on the page's clock): its lane pressed, if the rhythm mode plays. */
  down(t, ms) {
    if (!this.active || this.fingers.has(t.identifier)) return false;
    const lane = this.laneAt(t.clientX);
    this.fingers.set(t.identifier, lane);
    if (this.held[lane]++ === 0) {
      this.game.rhythm?.stamp?.(LANE_KEYS[lane], ms); // (its own moment first: pads() reads it with the key)
      this.actions.press('touch', `rh.l${lane + 1}`, true);
    }
    return true;
  }
  /** A finger lifted: its lane let go once no finger holds it. */
  up(t) {
    const lane = this.fingers.get(t.identifier);
    if (lane == null) return false;
    this.fingers.delete(t.identifier);
    if (--this.held[lane] <= 0) { this.held[lane] = 0; this.actions.press('touch', `rh.l${lane + 1}`, false); }
    return true;
  }
  /** Every lane let go (the mode ended under a finger, the page hidden). */
  release() {
    for (let lane = 0; lane < this.held.length; lane++) if (this.held[lane] > 0) { this.held[lane] = 0; this.actions.press('touch', `rh.l${lane + 1}`, false); }
    this.fingers.clear();
  }
}
