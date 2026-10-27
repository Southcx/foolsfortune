// ---------------------------------------------------------------------------------------
// THE DOUBLE TAP ON TOUCH (the owner, 2026-10-27: "double tapping on an entity for use/lock on"): two quick still taps on the same spot of
// the screen, either half, name the thing under the finger. What F would use there (an offer of courier/interact.js drawn within DTAP.px
// of the tap: a pot, a chest, the folk, the moored ship) is pinned as F's and F pressed a beat later; else a lock target there (the lock's
// own candidates, courier/lockon.js `pickAt`) is locked, or let go if it is the one held. A tap anywhere else does nothing: the look's drag
// and the stick's push are as they were (a tap is too short and too still to turn or move).
// Off while the pointer is free (a window's cursor), the rhythm mode's pads, Celestial mode's paper or the Veritome's lens (its tap is
// the shutter): what owns a tap there keeps it.
//
// Prior art: the genre's tap-to-target (Diablo Immortal, Genshin Impact's tap on an enemy to lock on; Pokémon GO's tap to interact),
// a double tap as the deliberate one so a stray tap never acts (iOS's double tap to zoom).
//
//   const D = new TouchDoubleTap(game, input, canvas)   D.update()   D.act(x, y) -> 'use' | 'lock' | 'release' | false   DTAP
// ---------------------------------------------------------------------------------------

/** ms: the longest a tap may be held; slop: px it may move and stay a tap; gap: real ms from the first tap's lift to the second's
 *  landing; near: px between the two taps; px: how near the tap a thing must be drawn; beat: F held this long, after this long. */
export const DTAP = { ms: 250, slop: 14, gap: 320, near: 50, px: 70, beat: 50 };

export class TouchDoubleTap {
  constructor(game, input, canvas) {
    this.game = game; this.input = input; this.last = null; this.steps = []; this.fingers = new Map();
    // (heard at the document, before anyone takes the touch: the move area's stick is Calissa's own element, ui/touch/stick.js;
    // only touches on the world itself, the canvas or that stick, count: a tile, a window or a button keeps its own taps)
    const world = (e) => e.pointerType === 'touch' && (e.target === canvas || !!e.target?.closest?.('.tstick'));
    const opt = { capture: true, passive: true };
    document.addEventListener('pointerdown', (e) => { if (world(e)) { const at = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY }; this.fingers.set(e.pointerId, at); this.down(at, e.timeStamp); } }, opt);
    document.addEventListener('pointermove', (e) => { const at = this.fingers.get(e.pointerId); if (at) { at.x = e.clientX; at.y = e.clientY; if (this.fingers.size > 1) at.pinched = true; } }, opt);
    document.addEventListener('pointerup', (e) => { const at = this.fingers.get(e.pointerId); if (at) { this.fingers.delete(e.pointerId); this.up(at, e.timeStamp); } }, opt);
    document.addEventListener('pointercancel', (e) => this.fingers.delete(e.pointerId), opt);
  }
  /** A finger came down: its landing kept on it. */
  down(at, ms) { at.tapMs = ms; }
  /** It lifted: a tap, and the second of two, names what is under it. */
  up(at, ms) {
    if (at.pinched || ms - (at.tapMs ?? -1e9) > DTAP.ms || Math.hypot(at.x - at.x0, at.y - at.y0) > DTAP.slop) { this.last = null; return false; }
    const l = this.last;
    if (!l || at.tapMs - l.ms > DTAP.gap || Math.hypot(at.x - l.x, at.y - l.y) > DTAP.near) { this.last = { ms, x: at.x, y: at.y }; return false; }
    this.last = null;
    return this.act(at.x, at.y);
  }
  /** What a double tap at (x, y) does: use what F offers there, else lock (or let go of) the target there. */
  act(x, y) {
    const g = this.game;
    if (g.cursorFree?.() || g.touch?.screenTaken?.() || g.touch?.tools?.lens) return false;
    const offer = this.offerAt(x, y);
    if (offer) { g.interact.pin(offer.ref, 0.5); const t = performance.now(); this.steps.push([t + DTAP.beat, true], [t + 2 * DTAP.beat, false]); return 'use'; }
    const L = g.lock, t = L?.pickAt?.(x, y, DTAP.px);
    if (!t) return false;
    if (L.target?.ref === t.ref) { L.release(); return 'release'; }
    L.set(t); return 'lock';
  }
  offerAt(x, y) {
    const g = this.game, cam = g.camera, W = innerWidth, H = innerHeight; let best = null, bd = DTAP.px;
    for (const o of g.interact?.offers || []) {
      const p = o.pos.clone().project(cam); if (p.z > 1) continue;
      const d = Math.hypot((p.x * 0.5 + 0.5) * W - x, (0.5 - p.y * 0.5) * H - y);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }
  /** Once a frame: F's press and its letting go, a frame apart at least (a person pressed it, core/input.js). */
  update() {
    if (!this.steps.length || this.steps[0][0] > performance.now()) return;
    const [, on] = this.steps.shift(); this.input.hold('KeyF', on, on);
  }
}
