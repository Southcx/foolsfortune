// ---------------------------------------------------------------------------------------
// THE TOOLS IN HAND ON TOUCH (docs/plans/MOBILE.md 8.9, its column "the driver's part"): what the touch driver adds while a tool is drawn,
// beyond the tiles' presses (core/bindings.js's `tool.<id>` rows, the actions layer):
//   AIM ON THE BUTTON   FIRE or AIM held and dragged turns the view as the look area does: the finger never leaves the button to aim.
//   SPECIAL'S SWIPE     the cutlass's SPECIAL (its AIM tile) tapped is the special, fired on the lift; swiped up past TOOL_TOUCH.swipe px it
//                       is the forward special (W held, as the keyboard's), down the back one (S held), fired as the swipe crosses. Pressed
//                       crouched, it is RMB held at once (the iaido, then Blade Mode), as the keyboard's.
//   DRAWN               Celestial mode up (the Soul Brush's AIM held): a finger on the canvas is the brush on the paper, under the
//                       finger, LMB down while it touches (MOBILE.md 4.6: drawn where it is seen; the paper is the whole screen).
//   THE SHUTTER         the Veritome's lens up: a tap on the look area is the shutter (LMB for one frame).
//   THE WHEEL           where a tool reads the wheel (the lens's zoom, the dowse's attune, the Lockheart's ring of Possibilikeys), two
//                       fingers on the look area pinch it, a notch each CURSOR.notch of scale (the touch cursor's own).
// Every press is made in `update()`, at the top of the frame, and let go a frame later at the soonest (core/touchcursor.js's rule).
//
// Prior art: Call of Duty Mobile (the fire button dragged to aim), Genshin Impact (a skill button swiped for its variant), Brawl Stars
// (tap to fire, drag to aim), Okami HD's touch brush (the stroke under the finger), every phone camera (tap the shutter, pinch to zoom).
//
//   new TouchTools(game, input, actions)   .tile(id, down) -> taken   .lookDown(at)   .lookMove(at)   .lookUp(at)   .wantsWheel()
//   .pinch(a, b)   .update()   .release()   TOOL_TOUCH
// ---------------------------------------------------------------------------------------
import { CURSOR } from './touchcursor.js';

/** aimTiles: the tiles whose drag aims; aimK: their drag's turn, as a share of the look area's (TOUCH.look); swipe: px SPECIAL's finger
 *  goes up or down to be the forward or back special; tap: the longest press (real ms) and its slop (px) that is still the shutter. */
export const TOOL_TOUCH = { aimTiles: new Set(['fire', 'aim']), aimK: 1, swipe: 24, tap: { ms: 250, slop: 10 } };

export class TouchTools {
  constructor(game, input, actions, look = 1.4) {
    this.game = game; this.input = input; this.actions = actions; this.look = look;
    this.ptrs = new Map(); // pointerId -> { tile, x, y, x0, y0 } (a finger on a tile, followed through its capture)
    this.special = null; // the cutlass's SPECIAL held: { x0, y0, fired }
    this.owed = []; // [{ codes, frames }]: presses made in update() and let go when their frames run out
    this.drawing = false; // LMB held for Celestial mode's brush
    this.pin = null; // the pinch's last spread (px) and its notches' remainder
    const on = (k, f) => addEventListener(k, f, { capture: true, passive: true });
    on('pointerdown', (e) => { if (e.pointerType !== 'touch') return; const t = e.target?.closest?.('[data-tile]'); if (t) this.ptrs.set(e.pointerId, { tile: t.dataset.tile, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY }); });
    on('pointermove', (e) => this.tileMove(e));
    for (const k of ['pointerup', 'pointercancel']) on(k, (e) => this.ptrs.delete(e.pointerId));
  }

  /** The tool in hand (the tool itself, behind the belt's adapter), or null. */
  get tool() { return this.game.belt?.inHand?.tech || null; }
  get live() { return this.actions?.live?.() || new Set(); }

  // ---- tiles
  /** A finger on a tile moved: FIRE or AIM aims; the cutlass's SPECIAL, swiped, fires its forward or back special. */
  tileMove(e) {
    const p = this.ptrs.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (this.game.cursorFree?.()) return;
    const S = this.special;
    if (S && p.tile === 'aim') {
      const up = p.y0 - p.y;
      if (!S.fired && !S.held && Math.abs(up) > TOOL_TOUCH.swipe) { S.fired = true; this.owe(['Mouse2'], 1, up > 0 ? 'KeyW' : 'KeyS'); }
      if (!S.held) return; // (SPECIAL's finger swipes: it does not aim; held crouched, it aims as AIM does, the cut's line Blade Mode's own)
    }
    if (TOOL_TOUCH.aimTiles.has(p.tile)) { this.input.dx += dx * this.look * TOOL_TOUCH.aimK; this.input.dy += dy * this.look * TOOL_TOUCH.aimK; }
  }
  /** A tile pressed or let go (the touch shell asks first): true when it is taken here. The cutlass's SPECIAL waits for its swipe or its
   *  lift; everything else goes to the actions as ever. */
  tile(id, down) {
    if (id !== 'aim') return false;
    if (down) {
      if (!this.live.has('tool.cutlass')) return false;
      const held = !!this.game.player?.crouching; // (crouched: the iaido's hold, Blade Mode at its end; the special's swipe is the standing one)
      if (held) this.input.hold('Mouse2', true, true);
      this.special = { fired: false, held };
      return true;
    }
    const S = this.special; if (!S) return false; // (its press was the actions': so is its release)
    if (S.held) this.input.hold('Mouse2', false);
    else if (!S.fired) this.owe(['Mouse2'], 1); // (tapped: the special, on the lift)
    this.special = null;
    return true;
  }

  // ---- the look area
  /** Celestial mode's paper is up (the Soul Brush in hand, AIM held). */
  get paper() { return !!(this.held === 'soulbrush' && this.tool?.celestial?.active); }
  /** The Veritome's lens is raised. */
  get lens() { return !!(this.held === 'veritome' && this.tool?.lens); }
  /** A tool reads the wheel now: the lens's zoom, the dowse's attune, the Lockheart's ring (drawn, at rest). */
  wantsWheel() { const id = this.held, t = this.tool; return !!t && ((id === 'veritome' && t.lens) || (id === 'dreamvane' && t.dowsing) || (id === 'lockheart' && !t.busy)); }
  /** The belt's id of the tool in hand. */
  get held() { return this.game.belt?.inHand?.id || null; }

  /** The look area's finger came down (the driver's `look`): on the paper, the brush goes there and draws. True when it is the brush's. */
  lookDown(at) {
    at.t0 = performance.now();
    if (!this.paper) return false;
    this.brushAt(at); if (!this.drawing) { this.input.hold('Mouse0', true, true); this.drawing = true; }
    return true;
  }
  /** It moved: on the paper the brush follows it (true: the view is not turned). */
  lookMove(at) { if (!this.drawing) return false; this.brushAt(at); return true; }
  /** It lifted: the brush lifts; with the lens up, a short still tap is the shutter. */
  lookUp(at) {
    this.letBrush();
    if (this.lens && !at.pinched && performance.now() - (at.t0 ?? 0) <= TOOL_TOUCH.tap.ms && Math.hypot(at.x - at.x0, at.y - at.y0) <= TOOL_TOUCH.tap.slop) this.owe(['Mouse0'], 1); // (a pinch's finger is no tap)
  }
  brushAt(at) { const C = this.tool?.celestial; if (C) C.touchAt = { x: at.x, y: at.y }; }
  letBrush() { if (this.drawing) { this.input.hold('Mouse0', false); this.drawing = false; } const C = this.tool?.celestial; if (C) C.touchAt = null; }

  /** Two fingers on the look area, where a tool reads the wheel: their spread's change is the wheel, a notch each CURSOR.notch of scale
   *  (out, fingers apart, the wheel rolled up, as the cursor's pinch). Null ends the pinch. */
  pinch(a, b) {
    if (!a || !b) { this.pin = null; return; }
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    if (!this.pin) { this.pin = { d, acc: 0 }; return; }
    this.pin.acc += Math.log(d / this.pin.d); this.pin.d = d;
    while (this.pin.acc > CURSOR.notch) { this.input.wheel -= 100; this.pin.acc -= CURSOR.notch; }
    while (this.pin.acc < -CURSOR.notch) { this.input.wheel += 100; this.pin.acc += CURSOR.notch; }
  }

  // ---- presses owed
  /** Codes pressed in the next update() and let go `frames` updates later (each with its edge: a person's press); `hold`, a key held with
   *  them, no edge of its own (the forward special's W: held under the RMB, as the keyboard's player holds it). */
  owe(codes, frames = 1, hold = null) { this.owed.push({ codes, frames, hold, on: false }); }
  /** Once a frame, before the game reads its input. */
  update() {
    if (this.drawing && !this.paper) this.letBrush(); // (the paper folded under the finger: the brush lifts)
    for (let i = this.owed.length - 1; i >= 0; i--) {
      const o = this.owed[i];
      if (!o.on) { if (o.hold) this.input.hold(o.hold, true); for (const c of o.codes) this.input.hold(c, true, true); o.on = true; continue; }
      if (--o.frames > 0) continue;
      for (const c of o.codes) this.input.hold(c, false);
      if (o.hold) this.input.hold(o.hold, false);
      this.owed.splice(i, 1);
    }
  }
  /** Everything let go (the page hidden, the driver gone). */
  release() {
    this.letBrush(); this.pin = null; this.ptrs.clear();
    if (this.special?.held) this.input.hold('Mouse2', false);
    this.special = null;
    for (const o of this.owed) if (o.on) { for (const c of o.codes) this.input.hold(c, false); if (o.hold) this.input.hold(o.hold, false); }
    this.owed = [];
  }
}
