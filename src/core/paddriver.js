// ---------------------------------------------------------------------------------------
// THE PAD DRIVER (docs/plans/MOBILE.md 6.1.1 and 10; the owner, 2026-10-24: no gamepad yet, so nothing waits on it): a controller in the
// Gamepad API's standard mapping, read once a frame. Its buttons press what the bindings table says they mean in the live context (core/
// actions.js); its left stick drives StickMove (a unit direction and the walk under 0.55; the sprint on LS clicked, latched until the push
// falls under 0.55, so a full push is still a run, as the genre has it; the skiff's analog steer, full at 0.9); its right stick turns the
// camera as the mouse does. Nothing is read until a pad says it is there (`gamepadconnected`).
//
// Prior art: the W3C Gamepad API's standard mapping; every console game's radial dead zone rescaled past it; the L3 sprint latch.
//
//   game.pad = new PadDriver(game, input, actions)   .update(rawDt)   .release()   PAD
// ---------------------------------------------------------------------------------------
import { PAD_BUTTONS } from './bindings.js';
import { StickMove, STICK } from './stickmove.js';

/** dead: a stick's dead zone (rescaled past it); steerFull: the push that is a full steer; look: camera px per real s at full tilt. */
export const PAD = { dead: 0.18, steerFull: 0.9, look: 700 };

export class PadDriver {
  constructor(game, input, actions) {
    this.game = game; this.input = input; this.actions = actions;
    this.stick = new StickMove(game, input, actions, 'pad');
    this.btn = {}; this.latch = false; this.on = false;
    addEventListener('gamepadconnected', () => { this.on = true; });
    addEventListener('gamepaddisconnected', () => { if (!this.pad()) { this.release(); this.on = false; } });
  }
  pad() { try { return [...(navigator.getGamepads?.() || [])].find((p) => p?.connected) || null; } catch { return null; } }
  stickOf(p, ix, iy) {
    let x = p.axes[ix] || 0, y = -(p.axes[iy] || 0); const m = Math.hypot(x, y);
    if (m < PAD.dead) return [0, 0];
    const k = Math.min(1, (m - PAD.dead) / (1 - PAD.dead)) / m; return [x * k, y * k];
  }

  update(dt) {
    if (!this.on) return;
    const p = this.pad(); if (!p) return;
    for (const [name, i] of Object.entries(PAD_BUTTONS)) {
      const b = p.buttons[i], on = !!b && (b.pressed || b.value > 0.5);
      if (on === !!this.btn[name]) continue;
      this.btn[name] = on; this.actions.press('pad', name, on);
      if (on) this.input.setDevice('pad');
    }
    const [x, y] = this.stickOf(p, 0, 1), push = Math.hypot(x, y);
    if (push > 0) this.input.setDevice('pad');
    if (this.btn.LS) this.latch = true;
    if (push < STICK.walk) this.latch = false;
    this.stick.set(x, y, { sprint: this.latch, steerFull: PAD.steerFull });
    const [rx, ry] = this.stickOf(p, 2, 3);
    if (rx || ry) { this.input.dx += rx * PAD.look * dt; this.input.dy -= ry * PAD.look * dt; this.input.setDevice('pad'); }
  }
  release() { for (const name of Object.keys(this.btn)) if (this.btn[name]) { this.btn[name] = false; this.actions.press('pad', name, false); } this.stick.clear(); this.latch = false; }
}
