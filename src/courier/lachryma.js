import * as THREE from 'three';
import { RAPIER, G, groups } from '../core/physics.js';
import { T, PALETTE } from '../core/config.js';
import { sfx } from '../audio/sfx.js';

// ---------------------------------------------------------------------------
// Lachryma: the energy that runs the psygun (and, later, other mechanics).
//
// LachrymaPool is deliberately engine-agnostic: no Three.js, no physics.
//   - costs are looked up by tag ('shot', 'charge', ...) so modifiers can
//     discount or tax specific uses without touching the caller
//   - spend() is all-or-nothing, drain() takes what it can (continuous use)
//   - reserve()/commit()/refund() lets a mechanic hold energy while it winds
//     up (a charge) and give it back if cancelled
//   - modifiers stack: { regenMult, costMult: { tag|'*': x }, maxBonus, regenDelayMult }
//   - events: change, spend, gain, empty, full, overflow, denied
// ---------------------------------------------------------------------------
export class LachrymaPool {
  constructor({ max = 100, value = max, regenRate = 4, regenDelay = 2 } = {}) {
    this.baseMax = max;
    this.value = value;
    this.regenRate = regenRate;
    this.regenDelay = regenDelay;
    this.sinceSpend = Infinity;
    this.reserved = 0;
    this.modifiers = new Map();
    this.listeners = new Map();
  }

  // ---- events --------------------------------------------------------------
  on(evt, fn) {
    if (!this.listeners.has(evt)) this.listeners.set(evt, new Set());
    this.listeners.get(evt).add(fn);
    return () => this.listeners.get(evt)?.delete(fn);
  }
  emit(evt, payload) {
    for (const fn of this.listeners.get(evt) || []) fn(payload);
    if (evt !== 'change' && evt !== 'denied') for (const fn of this.listeners.get('change') || []) fn({ ...payload, evt });
  }

  // ---- modifiers -----------------------------------------------------------
  addModifier(id, mod) { this.modifiers.set(id, mod); this.value = Math.min(this.value, this.max); }
  removeModifier(id) { this.modifiers.delete(id); this.value = Math.min(this.value, this.max); }
  product(fn) { let k = 1; for (const m of this.modifiers.values()) k *= fn(m) ?? 1; return k; }

  get max() { let b = this.baseMax; for (const m of this.modifiers.values()) b += m.maxBonus || 0; return b; }
  get available() { return this.value - this.reserved; }
  get fraction() { return this.value / this.max; }

  cost(base, tag = '*') { return base * this.product((m) => m.costMult?.[tag] ?? m.costMult?.['*']); }
  canAfford(base, tag) { return this.available >= this.cost(base, tag) - 1e-6; }

  // ---- spending ------------------------------------------------------------
  /** All-or-nothing. Returns true if paid. */
  spend(base, tag = '*') {
    const c = this.cost(base, tag);
    if (this.available < c - 1e-6) { this.emit('denied', { tag, cost: c, value: this.value }); return false; }
    this.value -= c;
    this.sinceSpend = 0;
    this.emit('spend', { tag, amount: c, value: this.value });
    if (this.value <= 1e-6) this.emit('empty', { value: 0 });
    return true;
  }

  /** Takes up to `base` (after modifiers); returns how much was actually taken. */
  drain(base, tag = '*') {
    const c = Math.min(this.cost(base, tag), Math.max(0, this.available));
    if (c <= 0) return 0;
    this.value -= c;
    this.sinceSpend = 0;
    this.emit('spend', { tag, amount: c, value: this.value, partial: true });
    if (this.value <= 1e-6) this.emit('empty', { value: 0 });
    return c;
  }

  // Reservations: energy set aside while something winds up.
  reserve(amount) { const a = Math.min(amount, this.available); this.reserved += a; this.sinceSpend = 0; return a; }
  commit(amount, tag = '*') {
    const a = Math.min(amount, this.reserved);
    this.reserved -= a;
    this.value -= a;
    this.emit('spend', { tag, amount: a, value: this.value });
    return a;
  }
  refund(amount) { this.reserved = Math.max(0, this.reserved - amount); }

  gain(amount, source = 'pickup') {
    const before = this.value;
    this.value = Math.min(this.max, this.value + amount);
    const added = this.value - before;
    if (amount > added) this.emit('overflow', { source, amount: amount - added });
    if (added > 0) this.emit('gain', { source, amount: added, value: this.value });
    if (before < this.max && this.value >= this.max) this.emit('full', { value: this.value });
    return added;
  }

  update(dt) {
    this.sinceSpend += dt;
    const delay = this.regenDelay * this.product((m) => m.regenDelayMult);
    if (this.sinceSpend < delay || this.value >= this.max) return;
    const rate = this.regenRate * this.product((m) => m.regenMult);
    const before = this.value;
    this.value = Math.min(this.max, this.value + rate * dt);
    if (before < this.max && this.value >= this.max) this.emit('full', { value: this.value });
  }

  reset(value = this.max) { this.value = value; this.reserved = 0; this.sinceSpend = Infinity; this.emit('change', { value }); }
  serialize() { return { value: this.value, baseMax: this.baseMax, modifiers: [...this.modifiers.keys()] }; }
}

// ---------------------------------------------------------------------------
// Baubles: gummy, glowing drops of Lachryma. They bounce with a jelly squash,
// settle and wobble, get pulled toward the courier, then get absorbed.
//
// OXIDIZING: a bauble is Lachryma freshly come out of clay: pale cream and glowing. Left lying in the air it turns: from a few seconds
// on, the cream darkens through amber to what liquid Lachryma always is (near-black with the oil film over it: the Well, the cubes,
// vfx/water.js), and a while after that the drop runs into the ground and is gone. One shader for every stage: OX.steps materials share
// it and a bauble takes the next as it turns, so nothing is ever recompiled. A bauble can be born turned (`spawn(..., { ox: 1 })`: the
// Lachryma a zandatsu lets out is liquid already).
// Prior art: the pickups that fade before they vanish (the blinking hearts and rupees of Zelda, Kingdom Hearts' orbs that dim), made a
// change of matter rather than a blink (the comfort rule: nothing flickers).
// ---------------------------------------------------------------------------
const OX = { start: 7, full: 22, melt: 38, gone: 40.5, steps: 8 };
const PICKUP = 32;
const BAUBLE_GROUPS = groups(PICKUP, G.STATIC | G.PROP | G.DEBRIS | G.CRITTER);
const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();

export class Baubles {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.geo = new THREE.IcosahedronGeometry(1, 2);
    this.stages = Array.from({ length: OX.steps }, (_, i) => oxMaterial(i / (OX.steps - 1)));
    this.mat = this.stages[0];
    this.coreMat = new THREE.MeshBasicMaterial({ color: 0xfff6ea });
    this.glint = new THREE.SphereGeometry(1, 8, 6);
    game.physics.collisionHandlers.push((h1, h2) => this.onCollision(h1, h2));
    // (what lies loose on the ground is food for anything that eats Lachryma: creatures/ai/ecology.js)
    game.ai?.eco.provide('food', (pos, range) => this.near(pos, range).map((b) => ({ pos: b.root.position, ref: b, what: 'bauble', alive: () => this.list.includes(b) && b.state === 'loose', take: () => this.steal(b) })));
  }

  /** Pop `n` baubles out of `pos` in a little fountain. */
  spawn(pos, n = 5, { value = T.lachryma.baubleValue, spread = 1, up = 3.5, ox = 0 } = {}) {
    this.game.ai?.stimuli.emit('food', pos, { radius: 14, strength: 0.6 });
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 3 * spread, up * (0.7 + Math.random() * 0.6), (Math.random() - 0.5) * 3 * spread);
      this.spawnOne(pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.15, 0.1 + Math.random() * 0.1, (Math.random() - 0.5) * 0.15)), v, value, ox);
    }
  }

  spawnOne(pos, vel, value, ox = 0) {
    const g = this.game, w = g.physics.world;
    const r = T.lachryma.baubleRadius * (0.85 + Math.random() * 0.3);
    const body = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(pos.x, pos.y, pos.z)
      .setLinvel(vel.x, vel.y, vel.z).setLinearDamping(0.35).setAngularDamping(3).setCcdEnabled(true));
    const col = w.createCollider(RAPIER.ColliderDesc.ball(r).setDensity(400).setRestitution(T.lachryma.bounce)
      .setFriction(0.9).setCollisionGroups(BAUBLE_GROUPS).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), body);
    const root = new THREE.Group();
    const step = Math.round(ox * (OX.steps - 1));
    const mesh = new THREE.Mesh(this.geo, this.stages[step]);
    mesh.scale.setScalar(r);
    mesh.castShadow = true;
    const core = new THREE.Mesh(this.glint, this.coreMat);
    core.scale.setScalar(0.28);
    core.position.set(0.32, 0.38, 0.3);
    mesh.add(core);
    root.add(mesh);
    root.position.copy(pos);
    g.scene.add(root);
    const b = {
      type: 'bauble', body, col, root, mesh, r, value, age: ox > 0 ? OX.start + ox * (OX.full - OX.start) : 0, ox, step, state: 'loose',
      squash: 0, squashV: 0, axis: new THREE.Vector3(0, 1, 0), wob: Math.random() * 10, lastVel: vel.clone(),
    };
    g.physics.register(col, b);
    this.list.push(b);
    return b;
  }

  onCollision(h1, h2) {
    for (const h of [h1, h2]) {
      const b = this.game.physics.byCollider.get(h);
      if (b?.type !== 'bauble' || b.state !== 'loose') continue;
      // jelly: squash along the impact direction, proportional to how fast it was going
      const sp = b.lastVel.length();
      if (sp < 0.6) continue;
      b.axis.copy(b.lastVel).normalize();
      b.squashV -= Math.min(10, sp * 2.2);
      if (sp > 1.5) sfx.boing(sp, this.game.listenerDistance(b.root.position));
    }
  }

  update(dt) {
    const g = this.game, L = T.lachryma;
    const chest = g.player.renderPos.clone();
    chest.y += 1.05;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i];
      b.age += dt;
      b.wob += dt;
      if (b.state === 'loose') {
        const t = b.body.translation(), lv = b.body.linvel();
        b.root.position.set(t.x, t.y, t.z);
        b.lastVel.set(lv.x, lv.y, lv.z);
        if ((t.y < -5 && t.y > -150) || t.y < -600) { this.remove(i); continue; } // (fell out of a room; the dunes, far below, are a floor of their own)
        // it turns, as it lies: cream to the black of liquid Lachryma, and at last it runs into the ground
        if (b.age > OX.start && b.ox < 1) { b.ox = Math.min(1, (b.age - OX.start) / (OX.full - OX.start)); const s = Math.round(b.ox * (OX.steps - 1)); if (s !== b.step) { b.step = s; b.mesh.material = this.stages[s]; } }
        if (b.age > OX.gone) { this.remove(i); continue; }
        // magnet: once close enough (and a moment after spawning), fly to the courier
        const d = b.root.position.distanceTo(chest);
        if (b.age > L.magnetDelay && d < L.magnetRadius && !b.claimed) this.beginAbsorb(b);
      } else if (b.state === 'absorb') {
        // ease in, accelerating, stretching along the path
        b.t += dt;
        const target = chest;
        _v.subVectors(target, b.root.position);
        const d = _v.length();
        b.speed = Math.min(22, b.speed + dt * 40);
        const step = Math.min(d, b.speed * dt);
        if (d > 1e-3) b.root.position.addScaledVector(_v.divideScalar(d), step);
        b.axis.copy(_v);
        b.squash = -Math.min(0.45, b.speed * 0.03);
        if (d < 0.25) { this.absorb(b, i); continue; }
      }
      // jelly spring (critically under-damped for the gummy overshoot)
      if (b.state === 'loose') {
        const k = 260, c = 7;
        b.squashV += (-k * b.squash - c * b.squashV) * dt;
        b.squash += b.squashV * dt;
        b.squash = THREE.MathUtils.clamp(b.squash, -0.5, 0.5);
      }
      // settled: slow breathing wobble
      const settle = b.state === 'loose' && b.lastVel.lengthSq() < 0.05 ? 1 : 0;
      const breathe = settle * 0.05 * Math.sin(b.wob * 3.1);
      const s = b.squash + breathe;
      _q.setFromUnitVectors(UP, b.axis.lengthSq() > 0 ? b.axis.clone().normalize() : UP);
      b.mesh.quaternion.copy(_q);
      const sink = b.state === 'loose' && b.age > OX.melt ? Math.max(0, 1 - (b.age - OX.melt) / (OX.gone - OX.melt)) : 1; // (running into the ground: flatter, smaller)
      b.mesh.scale.set(b.r * (1 - s * 0.6) * (0.6 + 0.4 * sink) * Math.sqrt(sink), b.r * (1 + s) * sink * sink, b.r * (1 - s * 0.6) * (0.6 + 0.4 * sink) * Math.sqrt(sink));
      if (b.state === 'loose' && settle) b.mesh.position.y = Math.abs(Math.sin(b.wob * 2)) * 0.012;
    }
  }

  beginAbsorb(b) {
    b.claimed = true;
    b.state = 'absorb';
    b.t = 0;
    b.speed = 2;
    const lv = b.body.linvel();
    this.game.physics.removeBody(b.body);
    b.root.position.addScaledVector(new THREE.Vector3(lv.x, lv.y, lv.z), 0.016);
    b.squashV = 0;
  }

  absorb(b, i) {
    const g = this.game;
    const gained = g.lachryma.gain(b.value, 'bauble');
    g.fx.absorbSparkle(b.root.position.clone());
    this.combo = (this.comboT > 0 ? this.combo + 1 : 0);
    this.comboT = 0.5;
    sfx.absorb(this.combo);
    g.hud?.lachrymaPulse(gained > 0);
    g.scene.remove(b.root);
    this.list.splice(i, 1);
  }

  tick(dt) { this.comboT = (this.comboT || 0) - dt; }

  /** Loose baubles within `radius` of `pos` (used by clappers that eat them). */
  near(pos, radius) {
    return this.list.filter((b) => b.state === 'loose' && !b.claimed && b.root.position.distanceTo(pos) < radius);
  }

  /** Something else (a clapper) swallowed this bauble. */
  steal(b) {
    const i = this.list.indexOf(b);
    if (i < 0 || b.state !== 'loose') return false;
    this.game.physics.removeBody(b.body);
    this.game.scene.remove(b.root);
    this.list.splice(i, 1);
    return true;
  }

  remove(i) {
    const b = this.list[i];
    if (b.state === 'loose') this.game.physics.removeBody(b.body);
    this.game.scene.remove(b.root);
    this.list.splice(i, 1);
  }

  clear() { for (let i = this.list.length - 1; i >= 0; i--) this.remove(i); }
}

/** A bauble's look at oxidation k (0 fresh cream and glowing .. 1 liquid Lachryma: near-black, the oil film on it). */
function oxMaterial(k) {
  const cream = new THREE.Color(PALETTE.cream), glow = new THREE.Color(PALETTE.glow);
  const e = Math.pow(k, 0.8);
  const m = new THREE.MeshPhysicalMaterial({
    color: cream.clone().lerp(new THREE.Color(0x05040a), e), emissive: glow.clone().lerp(new THREE.Color(0x2a1450), k), emissiveIntensity: 0.45 * (1 - k) + 0.04,
    roughness: 0.18 + 0.04 * k, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05,
  });
  const uOil = { value: 1.25 * k * k };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uOil = uOil;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uOil;
vec3 oxFilm(float t) { t = fract(t) * 4.0; vec3 a = vec3(0.30, 0.06, 0.70), b = vec3(0.04, 0.55, 0.75), c = vec3(0.95, 0.72, 0.18), d = vec3(0.85, 0.10, 0.50);
  return t < 1.0 ? mix(a, b, smoothstep(0.0, 1.0, t)) : t < 2.0 ? mix(b, c, smoothstep(1.0, 2.0, t)) : t < 3.0 ? mix(c, d, smoothstep(2.0, 3.0, t)) : mix(d, a, smoothstep(3.0, 4.0, t)); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ float ndv = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0); float fres = pow(1.0 - ndv, 2.2);
  totalEmissiveRadiance += oxFilm(fres * 0.8 + normal.y * 0.2) * (0.03 + 1.5 * fres) * uOil; }`);
  };
  m.customProgramCacheKey = () => 'bauble-ox';
  return m;
}
