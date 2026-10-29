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
//   A TOOL IN HAND  FIRE and AIM dragged aim, the cutlass's SPECIAL swiped, Celestial mode drawn under the finger, the lens's tap the
//                   shutter, two fingers the wheel where a tool reads it (core/touchtools.js).
//   THE TILT        with gyro steering on, the Solar Skiff steered by turning the phone, fed to the stick as a sideways push where no thumb
//                   pushes it (core/gyrosteer.js); a lifted touch is the tap iOS asks motion access in.
//   THE LANES       while the rhythm mode plays, the screen is its ten pads, five a hand, each finger its lane's until it lifts, judged on
//                   the touch's own moment (core/touchlanes.js). `screenTaken()` says the whole screen is a tool's (the lanes, Celestial
//                   mode's paper), so the touch controls' stick stands aside.
//   THE SWIPES      a quick flick sideways on the look area presses the row the live context gives it (on the Solar Skiff the shoulder,
//                   Q or E tapped twice): core/touchswipes.js.
//   THE DOUBLE TAP  two quick still taps on a thing, either half: F on what it offers there, or the lock on what stands there
//                   (core/touchdoubletap.js).
// Every touch is the driver's alone (`preventDefault`): no page scroll, no zoom, no mouse echo after a tap (core/input.js also refuses
// one within 0.8 real s of a touch).
//
// Prior art: the floating virtual stick of the genre (Genshin Impact, PUBG Mobile, Fortnite Mobile's left half), the right half as a
// camera drag; Pointer Events' and Touch Events' identifiers for multitouch; VirtualKeys (coop/sibling.js) driving by key codes.
//
//   game.touch = new TouchDriver(game, input, actions, el)   .update()   .bind(id, el)   .control(id, on)   .release()   .active   .tools   .gyro
//   .state() -> { move, look, cursor } (the move area's origin and thumb, for the stick's look: Calissa's; the cursor's mode)   .screenTaken()   .lanes   .swipes   .dtap   TOUCH
// ---------------------------------------------------------------------------------------
import { StickMove, STICK } from './stickmove.js';
import { TouchCursor } from './touchcursor.js';
import { TouchTools } from './touchtools.js';
import { TouchDoubleTap } from './touchdoubletap.js';
import { GyroSteer } from './gyrosteer.js';
import { TouchLanes } from './touchlanes.js';
import { TouchSwipes } from './touchswipes.js';
import { skiffTouchKeys } from '../progress/skifftouch.js';

/** r: px of drag for a full push; follow: past this many r the origin is dragged along; look: camera px per px of drag. */
export const TOUCH = { r: 60, follow: 1.6, look: 1.4 };

export class TouchDriver {
  constructor(game, input, actions, el) {
    this.game = game; this.input = input; this.actions = actions; this.el = el;
    this.stick = new StickMove(game, input, actions, 'touch');
    this.move = null; this.look = null; this.look2 = null; this.cursor = new TouchCursor(game, input);
    this.tools = new TouchTools(game, input, actions, TOUCH.look); // (a second look finger, `look2`, is the wheel's pinch where a tool reads it)
    this.gyro = new GyroSteer(game, input); this.tilted = false; // (the tilt as the skiff's steer, a setting: core/gyrosteer.js)
    this.lanes = new TouchLanes(game, actions); // (the rhythm mode's ten pads: core/touchlanes.js)
    this.swipes = new TouchSwipes(game, input, actions); // (a flick on the look area as its row: the skiff's shoulder, core/touchswipes.js)
    this.dtap = new TouchDoubleTap(game, input, el); // (two quick taps on a thing: use it or lock it, core/touchdoubletap.js)
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
      if (this.take?.(t, e.timeStamp)) continue; // (a standard trial holds the screen: its answer, timed by the touch: world/touchstone/trialrun.js)
      if (this.lanes.down(t, e.timeStamp)) continue; // (the rhythm mode's pads: the whole screen, judged on this touch's own moment)
      if (this.game.cursorFree?.()) { this.cursor.down(t); continue; }
      if (this.tools.paper && !this.look) { this.look = at; this.tools.lookDown(at); continue; } // (Celestial mode's paper: the whole screen is drawn on)
      if (t.clientX < innerWidth / 2) { if (!this.move) this.move = at; }
      else if (!this.look) { this.look = at; this.tools.lookDown(at); this.swipes.down(at, e.timeStamp); }
      else if (!this.look2 && this.tools.wantsWheel()) { this.look2 = at; this.look.pinched = true; this.tools.pinch(this.look, at); }
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
        const dx = t.clientX - l.x, dy = t.clientY - l.y; l.x = t.clientX; l.y = t.clientY;
        this.swipes.move(l, e.timeStamp); // (a flick across on the skiff is its shoulder: the look turns all the same)
        if (this.look2) this.tools.pinch(l, this.look2); // (two fingers are the wheel: the view is not turned)
        else if (!this.tools.lookMove(l)) { this.input.dx += dx * TOUCH.look; this.input.dy += dy * TOUCH.look; }
      } else if (this.look2?.id === t.identifier) { this.look2.x = t.clientX; this.look2.y = t.clientY; this.tools.pinch(l, this.look2); }
    }
  }
  end(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (this.lanes.up(t)) continue;
      if (this.cursor.has(t.identifier)) this.cursor.up(t);
      else if (this.move?.id === t.identifier) { this.move = null; this.stick.clear(); }
      else if (this.look?.id === t.identifier) { this.tools.lookUp(this.look); this.look = null; if (this.look2) { this.look2 = null; this.tools.pinch(null); } }
      else if (this.look2?.id === t.identifier) { this.look2 = null; this.tools.pinch(null); }
    }
    this.gyro.gesture(); // (a lifted touch is a tap: where motion access is asked inside one, it is asked here)
  }

  /** Once a frame, before the game reads its input: the move area's push as the moves. While touch play's controls are up, their stick
   *  owns the move area (ui/touch/stick.js: it reports x, y, outer and carve) and is read instead of this driver's own. */
  update() {
    if (this.cursor.busy) { if (this.game.cursorFree?.()) this.cursor.update(); else this.cursor.release(); } // (the pointer no longer free under a finger: it lets go; a press earned after the lift is still made)
    if (!this.lanes.active) this.lanes.release(); // (the song ended under a finger: its lane let go)
    this.tools.update();
    this.swipes.update(); this.dtap.update();
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
    const tilt = this.gyro.steer(held && Math.hypot(x, y) >= STICK.dead); // (gyro steering, where no thumb pushes the stick: core/gyrosteer.js)
    if (tilt != null) this.stick.set(tilt, 0, { noAD: !!sk?.noAD });
    else if (held) this.stick.set(x, y, S ? { outer: !!S.outer, carve: S.carve || 0, noAD: !!sk?.noAD } : { noAD: !!sk?.noAD });
    else if (S || this.tilted) this.stick.clear();
    this.tilted = tilt != null;
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
  control(id, on) { this.seen(); return this.tools.tile(id, on) ? null : this.actions.press('touch', id, on); } // (a tool's own first: SPECIAL's swipe)
  /** Everything let go (the page hidden, the window lost its focus). */
  release() {
    this.cursor.release(); this.tools.release(); this.lanes.release();
    this.move = null; this.look = null; this.look2 = null; this.stick.clear(); this.skiffKeys(null); this.tilted = false;
  }
  state() { return { move: this.move && { ...this.move }, look: !!this.look, cursor: this.cursor.state() }; }
  /** Whether the whole screen is a tool's now (the rhythm mode's pads, Celestial mode's paper): the touch controls' stick stands aside. */
  screenTaken() { return this.lanes.active || !!this.tools.paper || !!this.take; }
}
