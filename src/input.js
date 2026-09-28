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

    addEventListener('keydown', (e) => {
      if (e.code === 'Tab') e.preventDefault();
      if (!e.repeat) this.pressed.add(e.code);
      this.down.add(e.code);
      if (this.enabled && ['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.down.delete(e.code));
    addEventListener('blur', () => this.down.clear());
    el.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      const code = `Mouse${e.button}`;
      this.pressed.add(code);
      this.down.add(code);
    });
    addEventListener('mouseup', (e) => this.down.delete(`Mouse${e.button}`));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      if (this.locked || this.lockFailed) {
        this.dx += e.movementX || 0;
        this.dy += e.movementY || 0;
      }
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.el;
      this.onLockChange?.(this.locked);
    });
    document.addEventListener('pointerlockerror', () => {
      this.lockFailed = true;
      this.onLockChange?.(false);
    });
  }

  requestLock() {
    try {
      const p = this.el.requestPointerLock?.({ unadjustedMovement: true });
      if (p && p.catch) {
        p.catch(() => {
          // unadjustedMovement unsupported -> retry plain; otherwise fall back
          try {
            const p2 = this.el.requestPointerLock();
            if (p2 && p2.catch) p2.catch(() => { this.lockFailed = true; this.onLockChange?.(false); });
          } catch { this.lockFailed = true; }
        });
      }
    } catch { this.lockFailed = true; }
  }

  isDown(code) { return this.down.has(code); }
  wasPressed(code) { return this.pressed.has(code); }

  endFrame() {
    this.pressed.clear();
    this.dx = 0;
    this.dy = 0;
  }
}
