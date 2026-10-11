// ---------------------------------------------------------------------------------------
// THE ANIM LAB'S STAND-IN WORLD: what the Anim Lab's Courier and tools are built on, so the game's own classes (courier/character.js,
// the techs, the belt, each tool) run unchanged on a stage of the Workbench's and touch nothing of the game's. Two parts:
//
//   labGame(game, own)   the game as the Anim Lab's things see it: a Proxy over `game` that answers first from `own` (the lab's scene,
//                        rig, body, techs, belt, keys, camera), puts down every service that would reach the world (the bus, the
//                        pool, the clock's pulses, the lock, the log, the HUD, the save, the creatures, the pots, the clapperjars,
//                        physics, the AI's ears, the effects, the cinema) and keeps what a constructor writes on itself
//                        (`g.veritome = this`) in `own`, never on the game. What it does not name is read from the game's (tables,
//                        settings, the ledger and the lends for unlocks, the domains' widening).
//   new LabBody(keys)    the Courier's body as the tools and the techs read it (courier/player.js's fields, and the methods they call:
//                        lookDir, wishDir, latch, impulse, endCore, move, addRecoil), with no capsule: `move` carries it over a level
//                        floor at y 0 in open space; `core(dt)` is the core movement's ground pull reduced to a spring toward the
//                        stance's wished speed (groundAccel, groundDecel) and its gravity, for the frames no tech owns the step.
//
// Prior art: the test double (a fake that keeps the interface and drops the side effects: Meszaros, xUnit Test Patterns), the
// Workbench's own shims (workbench.js: the effects' VFX of their own, the cinema's Cine on a stand-in director), and the sibling's
// virtual keyboard (coop/sibling.js VirtualKeys), which the Anim Lab presses as a person would.
//
//   const g = labGame(game, own)     const B = new LabBody(keys)   B.wish.set(0, 0, 4.2)   B.core(dt)   B.move(dt)   B.travel
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';

/** Nothing, all the way down: called, it does nothing; asked for a member, it is nothing again (a pool's `fx.add.emit(...)`). Never
 *  iterable and never a promise, so a loop or an await over it fails loudly instead of quietly. */
const nothing = new Proxy(function nothing() {}, { get: (t, k) => (typeof k === 'string' && k !== 'then' ? nothing : undefined), apply: () => undefined });
/** A service put down: every member nothing, and the fields given kept as they are (a list, a flag, a number). */
const quiet = (fields = {}) => new Proxy(fields, { get: (t, k) => (k in t ? t[k] : typeof k === 'string' && k !== 'then' ? nothing : undefined) });

/** The lab's own bus: what the lab's tools say to one another stays among them (a move's blink cancel, the Veritome's survey); nothing
 *  reaches the game's tracking, ledger or log. */
export function labBus() {
  const on = new Map();
  return {
    on(n, fn) { if (!on.has(n)) on.set(n, new Set()); on.get(n).add(fn); return () => on.get(n)?.delete(fn); },
    off(n, fn) { on.get(n)?.delete(fn); },
    emit(n, d = {}) { for (const fn of on.get(n) || []) { try { fn(d); } catch (e) { console.warn('animlab bus', n, e); } } },
  };
}

/** The game as the Anim Lab's things see it (see the header). `own` holds the lab's own services and takes every write. */
export function labGame(game, own) {
  const pneuka = game.pneuka;
  const put = {
    events: labBus(),
    lachryma: quiet({ available: 1e9, value: 1e9, max: 1e9, cost: (x) => x, spend: () => true, drain: (x) => x }),
    time: quiet({ scale: 1, holds: new Map(), update: () => 1 }),
    lock: quiet({ active: false, target: null, point: (o) => o.set(0, 1, 6), pointOf: (t, o) => o.set(0, 1, 6) }),
    log: quiet(), hud: quiet(), glyphs: quiet(), portrait: quiet(), post: quiet(), mood: quiet(), trial: quiet(), spirits: quiet({ list: [] }),
    mirage: quiet(), ultimate: quiet(), parries: quiet(), cubes: quiet(), baubles: quiet({ near: () => [] }), slip: quiet(), stains: quiet(),
    paintmap: quiet(), crystals: quiet(), ostraca: quiet(), chests: quiet(), shells: quiet({ projectiles: [] }), stun: quiet(),
    fx: quiet({ alpha: quiet(), haloTexture: game.fx?.haloTexture }),
    vfx: quiet({ swing: () => quiet() }), // (a swing's ribbon put down too: the Anim Lab replays poses, not effects)
    cinema: quiet({ shots: new Map(), reqs: new Map() }),
    creatures: quiet({ list: [], friends: [], near: () => [], windups: () => [] }),
    breakables: quiet({ items: new Set(), slices: [], shards: [], debris: [] }),
    clappers: quiet({ list: [], floors: [], canSeePlayer: () => false }),
    movers: quiet({ list: [] }),
    level: quiet({ dynamic: [] }),
    physics: quiet({ raycast: () => null, entityOf: () => null, links: new Map(), world: null, gravity: game.physics?.gravity }),
    ai: { stimuli: quiet(), eco: quiet({ relation: () => null }) },
    projectiles: own.projectiles || new Set(), // (the lab's own: a shot flown at the guard for its parry, animplays.js)
    reprogram: quiet({ open: false }),
    combat: { engaged: false },
    god: { controlling: false, active: false, jar: null },
    dunes: quiet({ active: false, heightAt: () => 0, mix: 0 }),
    water: quiet({ at: () => null }),
    pneuka: quiet({ get lure() { return pneuka?.lure; }, fitted: (...a) => pneuka?.fitted?.(...a), count: (...a) => pneuka?.count?.(...a) ?? 0 }),
    system: game.system ? new Proxy(game.system, { get: (t, k) => (k === 'allows' ? () => true : Reflect.get(t, k, t)) }) : null, // (every tech the lab's: the System's tuning, its gates open)
    save: null, codex: null, agent: null, workbench: null, tracking: null, ledgerWatch: null,
  };
  return new Proxy(game, {
    get(t, k) { if (k in own) return own[k]; if (k in put) return put[k]; return Reflect.get(t, k, t); },
    set(t, k, v) { own[k] = v; return true; },
    has(t, k) { return k in own || k in put || k in t; },
  });
}

const UP = new THREE.Vector3(0, 1, 0);
const LOOK_SCALE = () => ({ lock: 1, blade: 1, brush: 1, lens: 1, shot: 1, wheel: 1 });

/** The Courier's body as the tools and techs read it (see the header): pinned over a level floor at y 0. */
export class LabBody {
  constructor(keys) {
    this.input = keys; this.techs = null; this.game = null; this.collider = null; this.isPlayer = false; this.kind = 'animlab';
    this.wish = new THREE.Vector3(); // (the stance's speed: what the core movement's keys would ask for, in the world)
    this.latches = {};
    this.reset(new THREE.Vector3());
  }

  /** Put down at `at`, still, standing, facing +Z (the lab's front). */
  reset(at) {
    this.start = (this.start || new THREE.Vector3()).copy(at);
    this.pos = (this.pos || new THREE.Vector3()).copy(at); this.prevPos = (this.prevPos || new THREE.Vector3()).copy(at); this.renderPos = (this.renderPos || new THREE.Vector3()).copy(at);
    this.vel = (this.vel || new THREE.Vector3()).set(0, 0, 0); this.groundVel = new THREE.Vector3(); this.shove = new THREE.Vector3();
    this.grounded = at.y <= 1e-4; this.coyote = 0; this.airT = 0;
    this.yaw = 0; this.bodyYaw = 0; this.pitch = 0; this.view = 'tp'; this.fpWeight = 0;
    this.shake = 0; this.fovPunch = 0; this.lookScale = LOOK_SCALE(); this.lookDX = 0; this.lookDY = 0; this.bobPhase = 0;
    this.crouching = false; this.crouchBlend = 0; this.posture = 'stand'; this.prone = false; this.shape = 'stand';
    this.sliding = false; this.wallrun = null; this.mantle = null; this.freeze = false; this.invuln = 0; this.guarding = false;
    this.sprinting = false; this.walking = false; this.inCombat = false; this.landed = 0; this.landedOut = 0; this.jumpBuf = 0; this.jumpHeldLast = false;
    this.slideBlend = 0; this.wallBlend = 0; this.mantleBlend = 0; this.dashBlend = 0; this.dashT = 0;
    this.latches = {}; this.wish.set(0, 0, 0);
  }

  get fp() { return this.view === 'fp'; }
  get height() { return this.shape === 'stand' ? 1.78 : this.shape === 'low' ? 1.2 : 0.6; }
  /** How far the body has gone from where the take put it down (the pinned body's travel: the ghost line). */
  get travel() { return this.pos.clone().sub(this.start); }
  forward(o = new THREE.Vector3()) { return o.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  right(o = new THREE.Vector3()) { return o.set(-Math.cos(this.yaw), 0, Math.sin(this.yaw)); }
  lookDir(o = new THREE.Vector3()) { return o.set(Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), Math.cos(this.yaw) * Math.cos(this.pitch)); }
  wishDir(o = new THREE.Vector3()) { const l = this.wish.length(); return l > 1e-4 ? o.copy(this.wish).divideScalar(l) : o.set(0, 0, 0); }
  latch(code) { if (!(this.latches[code] > 0)) return false; this.latches[code] = 0; return true; }
  peekLatch(code) { return this.latches[code] > 0; }
  endCore() { this.sliding = false; this.wallrun = null; this.dashT = 0; this.mantle = null; this.jumpBuf = 0; }
  impulse(v) { this.vel.add(v); if (v.y > 0.5) { this.grounded = false; this.coyote = 0; } }
  addRecoil() {}
  selfKnock() {}
  tryMantle() { return false; }
  fits() { return true; }
  canStand() { return true; }
  groundNormal() { return UP; }
  markSafe() {}

  /** The edge presses of this frame latched for the fixed step, as player.js look() latches them. */
  latchKeys() {
    for (const k of Object.keys(this.latches)) this.latches[k] = Math.max(0, this.latches[k] - 1 / 60);
    for (const code of ['KeyE', 'KeyC', 'Space', 'KeyG', 'KeyF', 'KeyV', 'Mouse0', 'KeyY']) if (this.input.wasPressed(code)) this.latches[code] = 0.15;
  }

  /** Carried by `vel` over the level floor (y 0): what player.js's move() does in an empty room. */
  move(dt) {
    this.pos.addScaledVector(this.vel, dt);
    if (this.pos.y <= 0 && this.vel.y <= 0.01) {
      const fall = -this.vel.y;
      if (!this.grounded && fall > 0.5) this.landed = fall; // (the landing's speed: character.js's `landed`, read next in blends())
      this.pos.y = 0; this.vel.y = 0; this.grounded = true;
    } else if (this.pos.y > 0.02) this.grounded = false;
  }

  /** The core movement's step, reduced (no tech owns it): on the ground the speed eases to the wished one, in the air gravity. */
  core(dt) {
    const M = T.movement;
    if (this.grounded) {
      const dx = this.wish.x - this.vel.x, dz = this.wish.z - this.vel.z, d = Math.hypot(dx, dz);
      const a = (this.wish.lengthSq() > Math.hypot(this.vel.x, this.vel.z) ** 2 ? M.groundAccel : M.groundDecel) * dt;
      if (d > 1e-6) { const k = Math.min(1, a / d); this.vel.x += dx * k; this.vel.z += dz * k; }
      this.vel.y = 0;
    } else this.vel.y -= M.gravity * dt;
    this.move(dt);
  }

  /** The posture's blends, as player.js eases them (crouchBlend at 12/s). */
  blends(dt) {
    this.crouching = this.posture !== 'stand' && this.grounded;
    this.prone = this.posture === 'prone';
    this.shape = this.prone ? 'prone' : this.crouching ? 'low' : 'stand';
    this.crouchBlend = THREE.MathUtils.damp(this.crouchBlend, this.crouching ? 1 : 0, 12, dt);
    this.sprinting = Math.hypot(this.wish.x, this.wish.z) > T.movement.walkSpeed + 0.1;
    this.walking = Math.hypot(this.wish.x, this.wish.z) > 0.1 && Math.hypot(this.wish.x, this.wish.z) < T.movement.walkSpeed - 0.1;
    this.landedOut = this.landed; this.landed = 0;
  }
}
