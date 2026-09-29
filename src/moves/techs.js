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
//   passive        (`passive = true`) doesn't own the step: `fixed(dt)` runs every fixed step beside
//                  whatever else is going on (carry, kick, recoil); `engaged` says when its pose
//                  layer is in use, `busy` that both hands are taken, `speedMult` / `noSprint`
//                  what it costs the core
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
  // (tuning, with the chosen variant laid over it by the System)
  get cfg() { return this.game.system ? this.game.system.cfgFor(this.id) : T.tech[this.id]; }
  get enabled() { return !!T.tech[this.id]?.enabled; }
  /** Switched on in the tuning, and the System says it's yours. */
  usable() { return this.enabled && (this.game.system?.allows(this.id) ?? true); }
  get active() { return this.mgr.active === this; }
  // overridables
  canStart() { return false; }
  start() {}
  update() { return false; } // return false to end
  end() {}
  tick() {} // every frame, active or not (cooldowns, visuals)
  onLand() {}
  fixed() {} // (passive techs) every fixed step
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
      if (t.passive || !t.usable() || !t.canStart()) continue;
      this.begin(t);
      t.update(dt);
      return true;
    }
    return false;
  }

  /** Passive techs (`passive = true`: carry, kick, recoil) run beside whatever else is going on. */
  passives(dt) {
    for (const t of this.list) if (t.passive && (t.usable() || t.busy)) t.fixed(dt);
  }

  begin(t) {
    if (this.active) this.stop();
    this.active = t;
    t.t = 0;
    t.start();
    this.game.events?.emit('tech.start', { id: t.id });
  }

  stop() {
    const a = this.active;
    this.active = null;
    a?.end();
    if (a) this.game.events?.emit('tech.end', { id: a.id, dur: a.t });
  }

  /** Per render frame: blends, cooldowns, visuals. */
  tick(dt) {
    for (const t of this.list) {
      const on = this.active === t || (t.passive && t.engaged);
      t.w = THREE.MathUtils.damp(t.w, on ? 1 : 0, t.blendIn && on ? t.blendIn : 12, dt);
      if (t.w < 0.001) t.w = 0;
      t.tick(dt);
    }
  }

  onLand(fallSpeed, under = []) {
    for (const t of this.list) if (t.usable()) t.onLand(fallSpeed, under);
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
  /** The fire button belongs to something else for now (a throw): the weapon ignores it. */
  get fireBlocked() { return this.list.some((t) => t.passive && t.blocksFire); }
  /** Both hands taken (a ladder, swimming, carrying something): the gun goes away. */
  get handsBusy() { return !!this.active?.handsBusy || this.list.some((t) => t.passive && t.busy); }
  /** Something for the HUD's movement readout. */
  label() {
    const a = this.active || this.list.find((t) => t.passive && t.engaged);
    return a?.label?.() || a?.id.toUpperCase() || '';
  }
  /** Where the body must face (a ladder faces its ladder, a kick its target), or null. */
  faceYaw() {
    const v = this.active?.faceYaw?.();
    if (v != null) return v;
    for (const t of this.list) if (t.passive && t.engaged) { const y = t.faceYaw?.(); if (y != null) return y; }
    return null;
  }
  /** Slower while carrying something, and no sprint (from the passive techs). */
  get speedMult() { let m = 1; for (const t of this.list) if (t.passive && t.speedMult) m *= t.speedMult; return m; }
  get noSprint() { return this.list.some((t) => t.passive && t.noSprint); }
  /** How much of the core body animation is replaced (0 = none). */
  get override() { let m = 0; for (const t of this.list) m = Math.max(m, t.w * (t.overrides || 0)); return m; }
  reset() { if (this.active) this.stop(); for (const t of this.list) t.reset?.(); }
}
