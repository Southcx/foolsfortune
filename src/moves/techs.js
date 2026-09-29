import * as THREE from 'three';
import { T } from '../config.js';

// ---------------------------------------------------------------------------
// Movement techs: optional techniques layered over the core movement profile.
//
// The core (walk / sprint / crouch / slide / jump / double jump / wallrun / wall
// jump / mantle / air dash, tuned under `movement`) is the gold standard every
// room is measured against. Techs never change it: each one lives in its own
// module with its own `tech.<id>` tuning (and an `enabled` switch), and only acts
// through a few hooks, so switching one off gives back the core exactly.
//
//   step(dt)       an active tech owns the fixed step (the core doesn't run); an
//                  idle tech may claim it (`canStart`). One active tech at a time.
//   onLand(v)      landing events from the controller (fall speed, what's underfoot)
//   animate(...)   blend its own pose over the core animation, then IK (optional)
//   camera(...)    adjust the first-person eye / third-person pivot (optional)
//
// Techs read their own keys through `player.latch(code)` (edge presses held for a
// short buffer, since fixed steps don't line up with frames).
// ---------------------------------------------------------------------------

export class Tech {
  constructor(mgr, id) {
    this.mgr = mgr;
    this.id = id;
    this.w = 0; // animation blend (0..1), damped per frame
    this.t = 0; // time since start
  }
  get P() { return this.mgr.player; }
  get game() { return this.mgr.game; }
  get cfg() { return T.tech[this.id]; }
  get enabled() { return !!T.tech[this.id]?.enabled; }
  get active() { return this.mgr.active === this; }
  // overridables
  canStart() { return false; }
  start() {}
  update() { return false; } // return false to end
  end() {}
  tick() {} // every frame, active or not (cooldowns, visuals)
  onLand() {}
}

export class Techs {
  constructor(player, game) {
    this.player = player;
    this.game = game;
    this.list = [];
    this.active = null;
  }

  add(tech) { this.list.push(tech); return tech; }
  get(id) { return this.list.find((t) => t.id === id); }

  /** Fixed step. True if a tech moved the player this step (the core then skips it). */
  step(dt) {
    if (this.active) {
      const a = this.active;
      a.t += dt;
      if (a.update(dt) !== false && this.active === a) return true;
      if (this.active === a) this.stop();
      return !!this.active; // (it may have handed over to another tech)
    }
    for (const t of this.list) {
      if (!t.enabled || !t.canStart()) continue;
      this.begin(t);
      t.update(dt);
      return true;
    }
    return false;
  }

  begin(t) {
    if (this.active) this.stop();
    this.active = t;
    t.t = 0;
    t.start();
  }

  stop() {
    const a = this.active;
    this.active = null;
    a?.end();
  }

  /** Per render frame: blends, cooldowns, visuals. */
  tick(dt) {
    for (const t of this.list) {
      t.w = THREE.MathUtils.damp(t.w, this.active === t ? 1 : 0, t.blendIn && this.active === t ? t.blendIn : 12, dt);
      if (t.w < 0.001) t.w = 0;
      t.tick(dt);
    }
  }

  onLand(fallSpeed, under = []) {
    for (const t of this.list) if (t.enabled) t.onLand(fallSpeed, under);
  }

  // ---- animation / camera ----
  animate(ch, base, dt, s) {
    for (const t of this.list) if (t.w > 0 && t.animate) t.animate(ch, base, dt, s);
  }
  afterPose(ch, s) {
    for (const t of this.list) if (t.w > 0 && t.afterPose) t.afterPose(ch, s);
  }
  hands(ch, o) {
    for (const t of this.list) if (t.w > 0 && t.hands) t.hands(ch, o);
  }
  camera(fp, pivot, dt) {
    for (const t of this.list) if (t.camera) t.camera(fp, pivot, dt);
  }
  /** Something for the HUD's movement readout. */
  label() { return this.active?.label?.() || this.active?.id.toUpperCase() || ''; }
  /** How much of the core body animation is replaced (0 = none). */
  get override() { let m = 0; for (const t of this.list) m = Math.max(m, t.w * (t.overrides || 0)); return m; }
  reset() { if (this.active) this.stop(); for (const t of this.list) t.reset?.(); }
}
