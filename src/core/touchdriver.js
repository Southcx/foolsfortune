// ---------------------------------------------------------------------------------------
// THE TOUCH DRIVER (docs/plans/MOBILE.md 4 and 10): a phone's touches as the game's own input, through the keys the game already reads.
//   THE MOVE AREA   the left half of the screen: a thumb put down anywhere there is a floating stick (its origin where it landed, dragged
//                   along when the thumb runs past TOUCH.follow), its push TOUCH.r px to the full; the push drives StickMove (the walk, the
//                   run, the sprint past the ring; the skiff's analog steer and its carve). While touch play's controls are up, their stick
//                   (Calissa's ring, ui/touch/stick.js) owns the area and is read instead.
//   THE LOOK AREA   the right half: a drag turns the camera as the mouse does (input.dx / dy, TOUCH.look per px).
//   THE CURSOR      where the pointer is free (the god hand, the Spirit Garden, a duel, the track editor: `game.cursorFree`), a finger is
//                   the mouse: a drag LMB, a tap a click, a long press RMB; two fingers the camera (core/touchcursor.js).
//   THE CONTROLS    a tile on screen (its look and layout Calissa's, its words Espada's) is bound by its control id (`bind(id, el)`) and
//                   presses what the bindings table says that control means in the live context (core/actions.js).
// Every touch is the driver's alone (`preventDefault`): no page scroll, no zoom, no mouse echo after a tap (core/input.js also refuses
// one within 0.8 real s of a touch).
//
// Prior art: the floating virtual stick of the genre (Genshin Impact, PUBG Mobile, Fortnite Mobile's left half), the right half as a
// camera drag; Pointer Events' and Touch Events' identifiers for multitouch; VirtualKeys (coop/sibling.js) driving by key codes.
//
//   game.touch = new TouchDriver(game, input, actions, el)   .update()   .bind(id, el)   .control(id, on)   .release()   .active
//   .state() -> { move, look, cursor } (the move area's origin and thumb, for the stick's look: Calissa's; the cursor's mode)   TOUCH
// ---------------------------------------------------------------------------------------
import { StickMove } from './stickmove.js';
import { TouchCursor } from './touchcursor.js';
import { skiffTouchKeys } from '../progress/skifftouch.js';

/** r: px of drag for a full push; follow: past this many r the origin is dragged along; look: camera px per px of drag. */
export const TOUCH = { r: 60, follow: 1.6, look: 1.4 };

export class TouchDriver {
  constructor(game, input, actions, el) {
    this.game = game; this.input = input; this.actions = actions; this.el = el;
    this.stick = new StickMove(game, input, actions, 'touch');
    this.move = null; this.look = null; this.cursor = new TouchCursor(game, input);
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
      if (this.game.cursorFree?.()) { this.cursor.down(t); continue; }
      if (t.clientX < innerWidth / 2) { if (!this.move) this.move = at; } else if (!this.look) this.look = at;
    }
  }
  moveTo(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const m = this.move, l = this.look;
      if (this.cursor.has(t.identifier)) this.cursor.moveTo(t);
      else if (m?.id === t.identifier) {
        m.x = t.clientX; m.y = t.clientY;
        const dx = m.x - m.x0, dy = m.y - m.y0, d = Math.hypot(dx, dy), far = TOUCH.follow * TOUCH.r;
        if (d > far) { m.x0 = m.x - (dx / d) * far; m.y0 = m.y - (dy / d) * far; } // (the stick follows a thumb that ran past it)
      } else if (l?.id === t.identifier) {
        this.input.dx += (t.clientX - l.x) * TOUCH.look; this.input.dy += (t.clientY - l.y) * TOUCH.look;
        l.x = t.clientX; l.y = t.clientY;
      }
    }
  }
  end(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (this.cursor.has(t.identifier)) this.cursor.up(t);
      else if (this.move?.id === t.identifier) { this.move = null; this.stick.clear(); }
      else if (this.look?.id === t.identifier) this.look = null;
    }
  }

  /** Once a frame, before the game reads its input: the move area's push as the moves. While touch play's controls are up, their stick
   *  owns the move area (ui/touch/stick.js: it reports x, y, outer and carve) and is read instead of this driver's own. */
  update() {
    if (this.cursor.busy) { if (this.game.cursorFree?.()) this.cursor.update(); else this.cursor.release(); } // (the pointer no longer free under a finger: it lets go; a press earned after the lift is still made)
    const UI = this.game.touchUI, S = UI?.on ? UI.stick : null;
    let x = 0, y = 0, held = false;
    if (S) { this.active = true; held = !!S.active; if (held) { x = S.x; y = S.y; } }
    else {
      const m = this.move;
      if (m && this.game.cursorFree?.()) { this.move = null; this.stick.clear(); } // (the pointer came free under a held thumb: the stick lets go)
      if (this.move) { held = true; x = (m.x - m.x0) / TOUCH.r; y = -(m.y - m.y0) / TOUCH.r; }
    }
    // (the Solar Skiff's auto-sail and glide: Dovina's rules, progress/skifftouch.js; BRAKE read from the tile itself, never from S, which
    //  the glide's own pitch holds)
    const sk = this.active && this.input.device === 'touch' ? skiffTouchKeys(this.game.techs?.get?.('skiff'), { x, y, brake: this.actions.held.has('touch:brake') }) : null;
    this.skiffKeys(sk);
    if (held) this.stick.set(x, y, S ? { outer: !!S.outer, carve: S.carve || 0, noAD: !!sk?.noAD } : { noAD: !!sk?.noAD });
    else if (S) this.stick.clear();
  }
  /** The skiff's keys from its touch rules, held while they say so (`null`: none held). */
  skiffKeys(want) {
    this.sk ||= new Set();
    for (const c of ['KeyW', 'KeyS', 'KeyQ', 'KeyE']) {
      const on = !!want?.[c]; if (on === this.sk.has(c)) continue;
      if (on) this.sk.add(c); else this.sk.delete(c); this.input.hold(c, on);
    }
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
    this.cursor.release();
    this.move = null; this.look = null; this.stick.clear(); this.skiffKeys(null);
  }
  state() { return { move: this.move && { ...this.move }, look: !!this.look, cursor: this.cursor.state() }; }
}
