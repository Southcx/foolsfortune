// Keyboard + mouse with pointer lock (falls back to free-cursor look if the
// browser/iframe refuses pointer lock).
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
    el.addEventListener('wheel', (e) => { if (this.enabled) { this.wheel += e.deltaY; e.preventDefault(); } }, { passive: false });
    el.addEventListener('auxclick', (e) => e.preventDefault());

    addEventListener('keydown', (e) => {
      const tag = e.target?.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA') return; // (typing in a field: the chat line, a save code)
      if (e.code === 'Tab') e.preventDefault();
      if (!e.repeat) this.pressed.add(e.code);
      this.down.add(e.code);
      if (this.enabled && ['Space', 'ArrowUp', 'ArrowDown', 'KeyF', 'AltLeft', 'AltRight', 'KeyE', 'KeyG', 'KeyV', 'Backquote', 'Minus'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => {
      this.down.delete(e.code);
      if (this.enabled && (e.code === 'AltLeft' || e.code === 'AltRight')) e.preventDefault(); // (no menu bar on Alt release)
    });
    addEventListener('blur', () => this.down.clear());
    el.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
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
      this.locked = document.pointerLockElement === this.el;
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
    this.onLockChange?.(false); // (still refused: back to the "click to play" card)
  }

  requestLock(retry = false) {
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
  wasPressed(code) { return this.pressed.has(code); }

  endFrame() {
    this.pressed.clear();
    this.dx = 0;
    this.dy = 0;
    this.wheel = 0;
  }
}
