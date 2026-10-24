// ---------------------------------------------------------------------------------------
// THE TOUCH CURSOR (docs/plans/MOBILE.md 4, 8.2, 8.4, 8.5): where the pointer is free (the god hand, the Spirit Garden, a puzzle duel,
// the track editor, the haunt: `game.cursorFree`), a finger is the mouse, read as the hand reads LMB and RMB.
//   ONE FINGER   down: the cursor goes there (the hand hovers under it) and nothing is pressed yet. Moved past CURSOR.slop px: LMB is
//                pressed where it came down and held while it drags (a stroke, a throw, a path). Lifted first: a tap, LMB for one frame
//                (a pet, a click). Held still CURSOR.long ms: RMB, the long press, its ring shown while it fills (Calissa's
//                ui/touch/longpress.js), then dragged or lifted (the god hand's art wheel, a flick, a duel's drop).
//   TWO FINGERS  never reach the hand: the second cancels the first's press (a stroke already under way ends where it is). Their middle's
//                drag, their pinch and their twist are said each frame in `input.touchDrag` for the camera that wants them
//                (world/garden/gardencam.js, godhand/godhand.js); a pinch is also the wheel, a notch each CURSOR.notch of scale. Both
//                lifted soon and still: a two-finger tap (the Spirit Garden's undo, Ctrl+Z).
//   PANNING      where one finger moves the view instead (the garden's overhead view with WALK up: MOBILE.md 8.2), its drag is
//                `input.touchDrag.pan`, and nothing is pressed.
//   SIGNING      while the god hand's SIGN is held (MMB, a tile: MOBILE.md 8.4), a finger only moves the cursor: the sign is drawn
//                with it, and no LMB or RMB is pressed under it.
// Every press is made in `update()`, at the top of the frame (core/touchdriver.js calls it), never in a touch event, so the game reads
// a press at the point it was made, for one frame at least.
//
// Prior art: Procreate (the two-finger tap's undo), every maps app (one finger pans, two pinch and twist), iOS's haptic touch (the long
// press as the second button), Black & White's hand on a cursor.
//
//   new TouchCursor(game, input)   .down(touch)   .moveTo(touch)   .up(touch)   .has(id)   .busy   .update()   .release()   .state()   CURSOR
// ---------------------------------------------------------------------------------------

/** slop: px a finger may move and still be a tap or a long press; long: ms to the long press (the choice card's 420); notch: the log of
 *  the scale a pinch takes for one wheel notch (12%, the cameras' own step); twoTap: ms both fingers of a two-finger tap may stay down. */
export const CURSOR = { slop: 10, long: 420, notch: Math.log(1.12), twoTap: 300 };

const pt = (t) => ({ x: t.clientX, y: t.clientY });

export class TouchCursor {
  constructor(game, input) {
    this.game = game; this.input = input;
    this.fingers = new Map(); // id -> { x0, y0, x, y, t0 }
    this.mode = null; // null | 'pending' | 'left' | 'right' | 'follow' (SIGN held) | 'pan' | 'two' | 'done'
    this.first = null; this.two = null; this.held = null; this.tap = 0; this.keys = null;
  }
  has(id) { return this.fingers.has(id); }
  /** Anything still to do in `update()`: a finger down, a gesture under way, or a press it earned still to make or let go (a tap's
   *  LMB, a two-finger tap's Ctrl+Z: both are made after the fingers have lifted). */
  get busy() { return !!(this.fingers.size || this.mode || this.tap || this.keys); }

  down(t) {
    const p = pt(t), f = { x0: p.x, y0: p.y, x: p.x, y: p.y, t0: performance.now() };
    if (this.fingers.size >= 2) return; // (a third finger: nothing)
    this.fingers.set(t.identifier, f); this.input.touchDrag.fingers = this.fingers.size;
    if (this.fingers.size === 1) {
      if (this.mode) return; // (a finger left from the last touch: wait for all of them to lift)
      this.first = t.identifier; this.mode = this.pans() ? 'pan' : 'pending';
      if (this.mode === 'pending') this.ring(p);
      return;
    }
    // the second finger: the first's press is called off, and the two are the camera's
    this.letGo(); this.ring(null);
    const [a, b] = [...this.fingers.values()];
    this.mode = 'two';
    this.two = { mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, d: Math.hypot(b.x - a.x, b.y - a.y) || 1, ang: Math.atan2(b.y - a.y, b.x - a.x), acc: 0, moved: 0, t0: performance.now() };
  }
  moveTo(t) {
    const f = this.fingers.get(t.identifier); if (!f) return;
    const p = pt(t), dx = p.x - f.x, dy = p.y - f.y;
    f.x = p.x; f.y = p.y;
    if (this.mode === 'pan' && t.identifier === this.first) { const G = this.input.touchDrag; G.panX += dx; G.panY += dy; }
    else if (this.mode === 'two' && this.fingers.size === 2) this.twoMoved();
  }
  up(t) {
    const f = this.fingers.get(t.identifier); if (!f) return;
    f.x = t.clientX; f.y = t.clientY;
    if (t.identifier === this.first && this.mode === 'pending') { this.ring(null); if (!this.input.isDown('Mouse1')) { this.tap = 2; this.at = { x: f.x0, y: f.y0 }; } this.mode = 'done'; } // (a tap: LMB for one frame, pressed in update; none under SIGN)
    else if (t.identifier === this.first && (this.mode === 'left' || this.mode === 'right' || this.mode === 'pan' || this.mode === 'follow')) { this.letGo(); this.mode = 'done'; }
    else if (this.mode === 'two') {
      const T = this.two;
      if (T && T.moved < CURSOR.slop * 2 && performance.now() - T.t0 < CURSOR.twoTap) this.twoTap();
      this.mode = 'done';
    }
    this.fingers.delete(t.identifier); this.input.touchDrag.fingers = this.fingers.size;
    if (!this.fingers.size) { if (this.mode === 'done' && !this.tap) this.mode = null; this.first = null; this.two = null; }
  }

  /** The two fingers' change since the last move: the middle's drag, the pinch (and its wheel notches), the twist. */
  twoMoved() {
    const [a, b] = [...this.fingers.values()], T = this.two, G = this.input.touchDrag;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, d = Math.hypot(b.x - a.x, b.y - a.y) || 1, ang = Math.atan2(b.y - a.y, b.x - a.x);
    const px = mid.x - T.mid.x, py = mid.y - T.mid.y, k = Math.log(d / T.d);
    let tw = ang - T.ang; if (tw > Math.PI) tw -= 2 * Math.PI; else if (tw < -Math.PI) tw += 2 * Math.PI;
    G.panX += px; G.panY += py; G.pinch += k; G.twist += tw;
    T.acc += k; // (the wheel: a notch each 12% of spread, out (fingers apart) a zoom in, as the wheel rolled up)
    while (T.acc > CURSOR.notch) { this.input.wheel -= 100; T.acc -= CURSOR.notch; }
    while (T.acc < -CURSOR.notch) { this.input.wheel += 100; T.acc += CURSOR.notch; }
    T.moved += Math.hypot(px, py) + Math.abs(d - T.d);
    T.mid = mid; T.d = d; T.ang = ang;
  }
  /** Two fingers tapped: the Spirit Garden's undo (Ctrl+Z for one frame, as the UNDO tile: MOBILE.md 8.2). */
  twoTap() { if (this.game.realm?.active) this.keys = ['ControlLeft', 'KeyZ']; }

  /** Once a frame, before the game reads its input: the presses the fingers have earned, made where they came down. */
  update() {
    const I = this.input, f = this.fingers.get(this.first);
    I.touchDrag.fingers = this.fingers.size;
    if (this.keys) { if (this.keys.on) { for (const c of this.keys) I.hold(c, false); this.keys = null; } else { for (const c of this.keys) I.hold(c, true); this.keys.on = true; } }
    if (this.tap) { // (a tap: pressed this frame where the finger came down, let go the next)
      if (this.tap === 2) { this.point(this.at); I.hold('Mouse0', true); this.tap = 1; }
      else { I.hold('Mouse0', false); this.tap = 0; if (!this.fingers.size) this.mode = null; }
      return;
    }
    if (this.mode === 'pending' && f && I.isDown('Mouse1')) { this.ring(null); this.mode = 'follow'; } // (SIGN held, MMB: the finger draws the sign, pressing nothing)
    if (this.mode === 'pending' && f) {
      if (Math.hypot(f.x - f.x0, f.y - f.y0) > CURSOR.slop) { this.ring(null); this.point({ x: f.x0, y: f.y0 }); this.press('Mouse0', 'left'); return; } // (pressed where it came down; it follows from the next frame)
      if (performance.now() - f.t0 >= CURSOR.long) { this.point({ x: f.x0, y: f.y0 }); this.press('Mouse2', 'right'); return; }
      this.point(f); return; // (the hand hovers under the finger)
    }
    if ((this.mode === 'left' || this.mode === 'right' || this.mode === 'follow') && f) this.point(f);
  }
  press(code, mode) { this.input.hold(code, true); this.held = code; this.mode = mode; }
  letGo() { if (this.held) { this.input.hold(this.held, false); this.held = null; } }
  point(p) { this.input.mx = p.x; this.input.my = p.y; }
  /** The long press's ring under the finger while it waits (Calissa's), or put away. */
  ring(p) { const L = this.game.touchUI?.longPress; if (!L) return; if (p) L.show(p.x, p.y, { ms: CURSOR.long }); else L.cancel(); }
  /** Does one finger move the view here, not the hand? The garden's overhead view with WALK up (no art). */
  pans() { const R = this.game.realm; return !!(R?.active && R.camera?.over && R.hand?.art === 'walk'); }

  /** Everything let go (the page hidden, the pointer no longer free). */
  release() {
    this.letGo(); this.ring(null);
    if (this.tap === 1) this.input.hold('Mouse0', false);
    if (this.keys?.on) for (const c of this.keys) this.input.hold(c, false);
    this.fingers.clear(); this.input.touchDrag.fingers = 0; this.mode = null; this.first = null; this.two = null; this.tap = 0; this.keys = null;
  }
  state() { return { mode: this.mode, fingers: this.fingers.size, held: this.held }; }
}
