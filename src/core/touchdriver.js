// ---------------------------------------------------------------------------------------
// THE TOUCH DRIVER (docs/plans/MOBILE.md 4 and 10): a phone's touches as the game's own input, through the keys the game already reads.
//   THE MOVE AREA   the left half of the screen: a thumb put down anywhere there is a floating stick (its origin where it landed, dragged
//                   along when the thumb runs past TOUCH.follow), its push TOUCH.r px to the full; the push drives StickMove (the walk, the
//                   run, the sprint past the ring; the skiff's analog steer and its carve).
//   THE LOOK AREA   the right half: a drag turns the camera as the mouse does (input.dx / dy, TOUCH.look per px).
//   THE CURSOR      where the pointer is free (the god hand, the Spirit Garden, a duel, the track editor: `game.cursorFree`), a finger is
//                   the mouse: its point the cursor, its touch LMB held.
//   THE CONTROLS    a tile on screen (its look and layout Calissa's, its words Espada's) is bound by its control id (`bind(id, el)`) and
//                   presses what the bindings table says that control means in the live context (core/actions.js).
// Every touch is the driver's alone (`preventDefault`): no page scroll, no zoom, no mouse echo after a tap (core/input.js also refuses
// one within 0.8 real s of a touch).
//
// Prior art: the floating virtual stick of the genre (Genshin Impact, PUBG Mobile, Fortnite Mobile's left half), the right half as a
// camera drag; Pointer Events' and Touch Events' identifiers for multitouch; VirtualKeys (coop/sibling.js) driving by key codes.
//
//   game.touch = new TouchDriver(game, input, actions, el)   .update()   .bind(id, el)   .control(id, on)   .release()   .active
//   .state() -> { move, look, cursor } (the move area's origin and thumb, for the stick's look: Calissa's)   TOUCH
// ---------------------------------------------------------------------------------------
import { StickMove } from './stickmove.js';

/** r: px of drag for a full push; follow: past this many r the origin is dragged along; look: camera px per px of drag. */
export const TOUCH = { r: 60, follow: 1.6, look: 1.4 };

export class TouchDriver {
  constructor(game, input, actions, el) {
    this.game = game; this.input = input; this.actions = actions; this.el = el;
    this.stick = new StickMove(game, input, actions, 'touch');
    this.move = null; this.look = null; this.cursor = null;
    this.active = false; // (a touch seen this session: the shell's touch mode follows `input.device`)
    const opt = { passive: false };
    el.addEventListener('touchstart', (e) => this.start(e), opt);
    el.addEventListener('touchmove', (e) => this.moveTo(e), opt);
    el.addEventListener('touchend', (e) => this.end(e), opt);
    el.addEventListener('touchcancel', (e) => this.end(e), opt);
  }
  seen() { this.active = true; this.input.touchedAt = performance.now(); this.input.setDevice('touch'); }

  start(e) {
    e.preventDefault(); this.seen();
    if (!this.input.enabled) return;
    for (const t of e.changedTouches) {
      const at = { id: t.identifier, x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY };
      if (this.game.cursorFree?.()) { if (!this.cursor) { this.cursor = at; this.point(t); this.input.hold('Mouse0', true); } continue; }
      if (t.clientX < innerWidth / 2) { if (!this.move) this.move = at; } else if (!this.look) this.look = at;
    }
  }
  moveTo(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const m = this.move, l = this.look, c = this.cursor;
      if (m?.id === t.identifier) {
        m.x = t.clientX; m.y = t.clientY;
        const dx = m.x - m.x0, dy = m.y - m.y0, d = Math.hypot(dx, dy), far = TOUCH.follow * TOUCH.r;
        if (d > far) { m.x0 = m.x - (dx / d) * far; m.y0 = m.y - (dy / d) * far; } // (the stick follows a thumb that ran past it)
      } else if (l?.id === t.identifier) {
        this.input.dx += (t.clientX - l.x) * TOUCH.look; this.input.dy += (t.clientY - l.y) * TOUCH.look;
        l.x = t.clientX; l.y = t.clientY;
      } else if (c?.id === t.identifier) this.point(t);
    }
  }
  end(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (this.move?.id === t.identifier) { this.move = null; this.stick.clear(); }
      else if (this.look?.id === t.identifier) this.look = null;
      else if (this.cursor?.id === t.identifier) { this.point(t); this.cursor = null; this.input.hold('Mouse0', false); }
    }
  }
  point(t) { this.input.mx = t.clientX; this.input.my = t.clientY; }

  /** Once a frame, before the game reads its input: the move area's push as the moves. */
  update() {
    const m = this.move;
    if (!m) return;
    if (this.game.cursorFree?.()) { this.move = null; this.stick.clear(); return; } // (the pointer came free under a held thumb: the stick lets go)
    this.stick.set((m.x - m.x0) / TOUCH.r, -(m.y - m.y0) / TOUCH.r);
  }
  /** A tile bound to a control id: held while touched. */
  bind(id, el) {
    const down = (e) => { e.preventDefault(); e.stopPropagation(); this.control(id, true); }, up = (e) => { e.preventDefault(); this.control(id, false); };
    el.addEventListener('pointerdown', down); for (const k of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(k, up);
    return el;
  }
  control(id, on) { this.seen(); return this.actions.press('touch', id, on); }
  /** Everything let go (the page hidden, the window lost its focus). */
  release() {
    if (this.cursor) { this.cursor = null; this.input.hold('Mouse0', false); }
    this.move = null; this.look = null; this.stick.clear();
  }
  state() { return { move: this.move && { ...this.move }, look: !!this.look, cursor: !!this.cursor }; }
}
