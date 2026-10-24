// Keyboard + mouse with pointer lock (falls back to free-cursor look if the
// browser/iframe refuses pointer lock). The touch and pad drivers (core/touchdriver.js, core/paddriver.js) press the same codes through
// `hold`, so every key read works on them; `axis(id)` is a move read with a stick's push (the keys give exactly -1, 0 or 1, as before),
// and `device` is the device last touched (keyboard, touch, pad), which the HUD and the help follow (docs/plans/MOBILE.md 6.1).
//   input.isDown(code)  wasPressed(code)  spend(...codes)  hold(code, on) (a driver's press)  axis(id) (core/bindings.js AXES)
//   input.axes[id] = v | undefined (a driver's analog push)  input.device  input.onDevice(d)  input.setDevice(d)
//   input.touchDrag { panX, panY (px), pinch (the log of the scale), twist (rad), fingers }: the fingers on glass this frame, where the
//   pointer is free (core/touchcursor.js); a camera that wants them reads them, and they are cleared with the frame as the wheel is
import { AXES } from './bindings.js';

export class Input {
  constructor(el) {
    this.el = el;
    this.down = new Set();
    this.pressed = new Set();
    this.dx = 0;
    this.dy = 0;
    this.locked = false;
    this.lockFailed = false;
    this.enabled = false;
    this.onLockChange = null;
    this.wheel = 0;
    this.mx = innerWidth / 2; // the cursor (only meaningful while the pointer is free: the god hand)
    this.my = innerHeight / 2;
    this.device = 'keyboard'; this.axes = {}; this.touchedAt = -1e9; this.holdN = new Map(); // (touchedAt: a mouse event this soon after a touch is the browser's echo of it)
    this.touchDrag = { panX: 0, panY: 0, pinch: 0, twist: 0, fingers: 0 }; // (the fingers' drag this frame: core/touchcursor.js)
    el.addEventListener('wheel', (e) => { if (this.enabled) { this.wheel += e.deltaY; e.preventDefault(); } }, { passive: false });
    el.addEventListener('auxclick', (e) => e.preventDefault());

    // an Esc that a window spends closing itself is marked before any window's own handler can stop it (each window's is registered
    // later, and some stop the event: the Pneuka Box's did, so the mark never came, casebook 125's second case); main.js says which spend
    addEventListener('keydown', (e) => { if (e.code === 'Escape' && this.escSpends?.()) this.escSpentAt = performance.now(); }, true);
    addEventListener('keydown', (e) => {
      const tag = e.target?.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA') return; // (typing in a field: the chat line, a save code)
      if (e.code === 'Tab') e.preventDefault();
      if (!e.repeat) this.pressed.add(e.code);
      this.down.add(e.code); if (e.isTrusted) this.setDevice('keyboard'); // (a key event the touch bar sends is not the keyboard: feedback/touchbar.js)
      if (this.enabled && ['Space', 'ArrowUp', 'ArrowDown', 'KeyF', 'AltLeft', 'AltRight', 'KeyE', 'KeyG', 'KeyV', 'Backquote', 'Minus'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => {
      this.down.delete(e.code);
      if (this.enabled && (e.code === 'AltLeft' || e.code === 'AltRight')) e.preventDefault(); // (no menu bar on Alt release)
    });
    addEventListener('blur', () => { this.down.clear(); this.holdN.clear(); this.onBlur?.(); }); // (the drivers let go too: main.js)
    addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') { this.touchedAt = performance.now(); this.setDevice('touch'); } }, true); // (any touch, the start card's too: the device is the thumb)
    el.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      if (performance.now() - this.touchedAt < 800) return; // (the browser's mouse echo of a tap: the touch driver had it)
      this.setDevice('keyboard');
      if (!this.locked && this.everLocked && (this.wantLock?.() ?? true)) this.requestLock(); // (a click is the user's say-so: the lock a window's close could not take back without one, R12/T10)
      if (e.button === 1) e.preventDefault();
      const code = `Mouse${e.button}`;
      this.pressed.add(code);
      this.down.add(code);
    });
    addEventListener('mouseup', (e) => this.down.delete(`Mouse${e.button}`));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    addEventListener('mousemove', (e) => {
      this.mx = e.clientX; this.my = e.clientY;
      if (!this.enabled) return;
      if (this.locked || this.lockFailed) {
        this.dx += e.movementX || 0;
        this.dy += e.movementY || 0;
      }
    });
    document.addEventListener('mouseleave', () => { this.mx = -1; this.my = -1; }); // (the cursor left the window: no edge-scroll)
    document.addEventListener('pointerlockchange', () => {
      const was = this.locked;
      this.locked = document.pointerLockElement === this.el;
      if (this.locked === was) return; // (a change that changes nothing: requests racing after a window's close, one refused, fire one while unlocked; read as you leaving, it paused over the lock the next took: casebook rule 276)
      if (this.locked) { this.everLocked = true; this.lockFailed = false; }
      this.onLockChange?.(this.locked);
    });
    document.addEventListener('pointerlockerror', () => this.lockError());
  }

  // A failed request is only "pointer lock isn't available here" (free-cursor look) if it has
  // never worked. Once it has, a failure is the browser's cooldown after Esc (it refuses a new
  // lock for a moment): try again shortly, and never give up for good.
  lockError() {
    if (!this.everLocked) { this.lockFailed = true; this.onLockChange?.(false); return; }
    if (this.tries++ < 2) {
      setTimeout(() => { if (!this.locked && this.enabled && (this.wantLock?.() ?? true)) this.requestLock(true); }, 1400); // (asking the game first: the garden's cursor is free, GARDEN-SWEEP #10)
      return;
    }
    this.tries = 0;
    this.onLockChange?.(false, 'refused'); // (still refused: the game says how to take it back, and the next click does: main.js)
  }

  requestLock(retry = false) {
    if (this.device === 'touch') return; // (a phone has no pointer lock: the thumbs are the look, and losing a lock is never the pause)
    if (!retry) this.tries = 0;
    try {
      const p = this.el.requestPointerLock?.({ unadjustedMovement: true });
      if (p && p.catch) {
        p.catch(() => {
          // unadjustedMovement unsupported -> retry plain; otherwise it's a real failure
          try {
            const p2 = this.el.requestPointerLock();
            if (p2 && p2.catch) p2.catch(() => this.lockError());
          } catch { this.lockError(); }
        });
      }
    } catch { this.lockError(); }
  }

  isDown(code) { return this.down.has(code); }
  /** A driver's press or release of a code (a pressed edge on the way down, as a key's), counted: a code two holders hold (the pad's
   *  dash button and its sprint latch, both Shift) stays down until both let go, and is never pressed twice. */
  hold(code, on) {
    const n = (this.holdN.get(code) || 0) + (on ? 1 : -1);
    if (on && !this.down.has(code)) this.pressed.add(code);
    if (n > 0) { this.holdN.set(code, n); this.down.add(code); } else { this.holdN.delete(code); this.down.delete(code); }
  }
  /** A move axis, -1 .. 1: a driver's analog push while it gives one, else the keys (exactly -1, 0 or 1). */
  axis(id) { const v = this.axes[id]; if (v != null) return v; const A = AXES[id]; return A ? (this.down.has(A.pos) ? 1 : 0) - (this.down.has(A.neg) ? 1 : 0) : 0; }
  setDevice(d) { if (this.device === d) return; this.device = d; this.onDevice?.(d); }
  wasPressed(code) { return this.pressed.has(code); }
  /** A press that closed or picked something is spent: no one else this frame, nor the Courier's latch, sees it (CASEBOOK rule 20). */
  spend(...codes) { for (const c of codes) { this.pressed.delete(c); this.onSpend?.(c); } }

  endFrame() {
    this.pressed.clear();
    this.dx = 0;
    this.dy = 0;
    this.wheel = 0;
    const G = this.touchDrag; G.panX = 0; G.panY = 0; G.pinch = 0; G.twist = 0;
  }
}
