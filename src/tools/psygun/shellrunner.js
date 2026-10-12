// ---------------------------------------------------------------------------------------
// THE SHELL RUNNER: one module that flies a caster shell from its row (progress/combat/castershells.js, docs/plans/CASTER-SHELLS.md):
// how it goes (its CARRIER: bolt, lob, bounce, cone, swarm, deploy, self) and, where it lands, what it does (its payloads:
// tools/psygun/shellpayloads.js). The founding eleven keep their own code in shells.js, specials.js and casters.js; every shell after
// them is flown here, so a new one is a row (and, if its recipe says more than its parts, an entry in LANDS or FIRES). What lasts is a
// TIMED effect ticked here (a burn, a cloud, a status kept on), with Wanda's field sound (`sfx.shellField`) while it runs. The plan's
// new mechanics (M1 to M12) are PARTS in modules of their own, each adding its carriers, hits, fires and lands to the tables here and
// ticked with the runner: shellsplitchain.js (M1, M2, the Storm), shelldeployables.js (M4, the Company), shellbodies.js (M7, M8, M9,
// M11), shellspacetime.js (M5, M6, M10, M12), shellcastersown.js (M3, the lock-on, the Feelings' last three, the Caster's own).
//
// Prior art: Ratchet & Clank's arsenal (the Disc Blade Gun's return, the Bouncer, the Walloper, the Agents of Doom, the Taunter, the
// Suck Cannon's store), Noita's wands (a projectile is a carrier and its effects are parts), Monster Hunter's bowgun pellets (a spread
// of small hitscan rounds).
//
//   game.shells.runner = new ShellRunner(shells)   .fire(row, ctx)   .onShellFired()   .timed({ delay, t, every, field, tier, tick, end })
//   .arm({ row, at, target })   .rod   .fixedUpdate(dt)   .update(dt)   .clear()   RUNNER_SHELLS (the numbers it flies: 11 to 99)
//   a part: { carrier, hit, fly, expire, fires, lands, tick(R, dt), frame(R, dt), clear(R), onShot(R, e), onShellFired(R) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { T, DEG } from '../../core/config.js';
import { hasTag } from '../../core/tags.js';
import { COLOR } from '../../progress/weather.js';
import { stream } from '../../core/rng.js';
import { land, blast, foesNear, LANDS } from './shellpayloads.js';
import { spreadDir, graze } from './shellkit.js';
import { SPLIT_CHAIN } from './shellsplitchain.js';
import { DEPLOYABLES } from './shelldeployables.js';
import { BODIES } from './shellbodies.js';
import { SPACETIME } from './shellspacetime.js';
import { CASTERS_OWN } from './shellcastersown.js';
import { shellLook } from '../../vfx/shelllooks.js'; // (Calissa's: each shell's look, by its id)
const simRand = stream('tools/psygun/shellrunner'); // (the simulation's chance: core/rng.js, the same twice)

/** The shells this runner flies, by number: every one after the founding eleven (CASTER-SHELLS.md section 5, all four batches). */
export const RUNNER_SHELLS = Array.from({ length: 89 }, (_, i) => 11 + i);

/** A family's colour for its rounds (the look until Calissa's: a feeling's own colour for the Feelings). */
const FAMILY_COLOR = { edge: 0xe6dccb, ember: 0xff7a2a, storm: 0x9fd0ff, pull: 0x8a7aff, clock: 0xe8d080, will: 0xd080c0, company: 0xc0a070, feelings: 0xffffff };
const colourOf = (row) => (row.n.feeling ? COLOR[row.n.feeling] : FAMILY_COLOR[row.family]) ?? 0xffffff;

/** How each carrier flies: speed (m/s), lift (m/s up at the muzzle), grav (a share of gravity), life (real s before it lands or is
 *  gone), r (its own radius against a creature, m). */
export const CARRIER = {
  bolt: { speed: 60, lift: 0, grav: 0, life: 1.2, r: 0.12 },
  lob: { speed: 18, lift: 3, grav: 1, life: 3, r: 0.15 },
  saw: { speed: 30, lift: 0, grav: 0, life: 6, r: 0.3 },
  skip: { speed: 20, lift: 1, grav: 1, life: 6, r: 0.2 },
  pinball: { speed: 16, lift: 0, grav: 0, life: 6, r: 0.18, cap: 48 },
  cinder: { speed: 8, lift: 1, grav: 0, life: 10, r: 0.2, seek: 4, sight: 10 },
  agent: { speed: 6, lift: 2, grav: 1, life: 10, r: 0.2, sight: 25 },
  clod: { speed: 40, lift: 0.5, grav: 0.3, life: 1.5, r: 0.2 },
  lobPart: { speed: 18, lift: 3, grav: 1, life: 3, r: 0.15 }, // (a part's lob: where it lands (or its time runs out) it calls its own `land(R, p, at, contact)`)
};

const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0);
const _v = new THREE.Vector3(), _c = new THREE.Vector3();

export class ShellRunner {
  constructor(shells) {
    this.shells = shells;
    this.game = shells.game;
    this.flying = [];
    this.effects = [];
    this.armed = [];
    this.decoys = [];
    this.stored = 0; // (the Inhaler's: what it has swallowed and will spit)
    this.rod = null;
    this.geo = new THREE.IcosahedronGeometry(0.08, 0);
    this.mats = new Map();
    this.game.events?.on('shot.fire', (e) => this.onShot(e));
  }

  mat(col) {
    if (!this.mats.has(col)) this.mats.set(col, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.6, roughness: 0.5 })); // (lit, the scene's own program: an unlit one was compiled late, the first time a shell flew)
    return this.mats.get(col);
  }

  // ---------------------------------------------------------------- firing
  /** Fly a shell from its row (the Shells class has already counted and paid for it). */
  fire(row, ctx) {
    sfx.shellFire?.(row.carrier, row.tier);
    shellLook(this.game, 'fire', row, ctx);
    const own = FIRES[row.id];
    if (own) return own(this, row, ctx);
    this.launch(['lob', 'deploy', 'call'].includes(row.carrier) ? 'lob' : 'bolt', row, ctx.muzzle, ctx.ray.dir);
  }

  /** A round in flight: a small bright stone in its family's colour. */
  launch(kind, row, from, dir, opts = {}) {
    const C = CARRIER[kind], g = this.game;
    const mesh = new THREE.Mesh(opts.geo || this.geo, this.mat(opts.col ?? colourOf(row)));
    if (opts.scale) mesh.scale.setScalar(opts.scale);
    mesh.position.copy(from); mesh.userData.zoneFree = true;
    g.scene.add(mesh);
    const p = { kind, row, mesh, pos: from.clone(), vel: dir.clone().multiplyScalar(opts.speed ?? C.speed).addScaledVector(UP, C.lift), age: 0, life: opts.life ?? C.life, C, bounces: 0, struck: new Map(), ...opts.extra };
    this.flying.push(p);
    shellLook(g, 'fly', row, { mesh, p, kind });
    return p;
  }

  /** Called before any shell is fired: the Detonator's charges go off (and a part's own: the Visibomb bursts). */
  onShellFired() {
    for (const a of this.armed) this.detonate(a);
    this.armed.length = 0;
    for (const P of PARTS) P.onShellFired?.(this);
  }

  // ---------------------------------------------------------------- what the payloads ask of the runner
  /** A timed effect: `tick(e)` every `every` s for `t` s (after `delay`), `end(e)` once; `e.left` and `e.age` are its clock. */
  timed({ delay = 0, t = 1, every = 0.25, field = null, tier = 1, tick = null, end = null }) {
    const e = { delay, left: t, age: 0, every, acc: every, field, tier, tick, end, sound: null, started: false };
    this.effects.push(e);
    return e;
  }
  /** The Detonator: a charge stuck where it landed (on a creature, it rides it) until the next shell is fired. */
  arm({ row, at, target }) {
    const mesh = new THREE.Mesh(this.geo, this.mat(0xff3a2a)); mesh.scale.setScalar(1.4); mesh.userData.zoneFree = true;
    mesh.position.copy(at); this.game.scene.add(mesh); shellLook(this.game, 'set', row, { obj: mesh });
    this.armed.push({ row, at: at.clone(), target, mesh, t: 0 });
  }
  detonate(a) {
    const at = a.target?.alive ? a.target.pos.clone().setY(a.target.pos.y + a.target.height * 0.5) : a.at;
    this.game.scene.remove(a.mesh);
    blast(this, at, a.row.n.r, a.row.n.power, 'explosion');
    sfx.explosion?.(this.game.listenerDistance?.(at));
    this.game.onExplosion?.(at, a.row.n.r * 0.8);
  }
  /** The Lightning Rod: a plain shot that misses bends to the creature it marked, if it passed within `bend` m of it. */
  onShot(e) {
    for (const P of PARTS) P.onShot?.(this, e);
    const r = this.rod; if (!r || !e?.dir || !e.at) return;
    if (e.ent && hasTag(e.ent, 'hurtable')) return;
    const c = r.c; if (!c.alive) return;
    _c.copy(c.pos).setY(c.pos.y + c.height * 0.5);
    _v.subVectors(_c, e.at);
    const off = _v.clone().addScaledVector(e.dir, -_v.dot(e.dir)).length();
    if (off > r.bend + c.radius) return;
    this.game.fx?.tracer?.(e.at, _c.clone());
    this.game.creatures.strike(c, _c.clone(), e.dir.clone(), 1, 'shot', 'courier', null, 'impact');
    this.game.hud?.hitmarker?.(!c.alive);
  }

  // ---------------------------------------------------------------- the flight
  /** The first creature (a foe) whose body the segment from `from` along `dir` for `len` m passes within `pr` of. */
  creatureOn(from, dir, len, pr, skip = null) {
    let best = null, bd = len;
    _v.copy(from).addScaledVector(dir, len * 0.5);
    for (const c of foesNear(this.game, _v, len * 0.5 + 2)) {
      if (skip?.(c)) continue;
      _c.copy(c.pos).setY(c.pos.y + c.height * 0.5).sub(from);
      const s = Math.max(0, Math.min(len, _c.dot(dir)));
      const off = _c.addScaledVector(dir, -s).length();
      if (off < c.radius + pr + c.height * 0.25 && s < bd) { bd = s; best = c; }
    }
    return best ? { c: best, d: bd } : null;
  }

  step(p, dt) {
    const g = this.game, C = p.C;
    p.age += dt;
    for (const [c, t] of p.struck) if ((t - dt) <= 0) p.struck.delete(c); else p.struck.set(c, t - dt);
    if (FLY[p.kind]) FLY[p.kind](this, p, dt); // (its own steering)
    p.vel.y -= T.physics.gravity * C.grav * dt;
    const len = p.vel.length() * dt;
    if (len < 1e-5) return p.age > p.life ? 'expire' : false;
    const dir = p.vel.clone().normalize();
    const hit = p.ghost ? null : g.physics.raycast(p.pos, dir, len + 0.08, g.player.collider, undefined, (col) => !col.isSensor());
    const foe = this.creatureOn(p.pos, dir, hit ? hit.distance : len, C.r, (c) => p.struck.has(c));
    let contact = null;
    if (foe) contact = { at: p.pos.clone().addScaledVector(dir, foe.d), normal: dir.clone().negate(), target: foe.c, ent: null };
    else if (hit) {
      const ent = hit.entity, target = ent && hasTag(ent, 'hurtable') && ent.alive && !ent.ally ? ent : null;
      contact = { at: hit.point.clone(), normal: hit.normal.clone(), target, ent };
    }
    if (!contact) { p.pos.addScaledVector(dir, len); p.mesh.position.copy(p.pos); return p.age > p.life ? 'expire' : false; }
    p.pos.copy(contact.at).addScaledVector(contact.normal, 0.1);
    p.mesh.position.copy(p.pos);
    shellLook(g, 'touch', p.row, contact);
    return (HIT[p.kind] || HIT.bolt)(this, p, contact, dir) ? 'hit' : false; // (spent on a touch: its landing was the hit's, so no expiry after)
  }

  // ---------------------------------------------------------------- per tick
  fixedUpdate(dt) {
    for (let i = this.flying.length - 1; i >= 0; i--) {
      const p = this.flying[i];
      const end = this.step(p, dt);
      if (end) { if (end === 'expire') EXPIRE[p.kind]?.(this, p); this.game.scene.remove(p.mesh); this.flying.splice(i, 1); }
    }
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      if (e.delay > 0) { e.delay -= dt; continue; }
      if (!e.started) { e.started = true; if (e.field) e.sound = sfx.shellField?.(e.field, e.tier) || null; }
      e.age += dt; e.left -= dt; e.acc += dt;
      while (e.acc >= e.every && e.left > 0) { e.acc -= e.every; e.tick?.(e); }
      if (e.left <= 0) { this.effects.splice(i, 1); e.end?.(e); e.sound?.stop?.(); }
    }
    if (this.rod && ((this.rod.t -= dt) <= 0 || !this.rod.c.alive)) this.rod = null;
    for (const P of PARTS) P.tick?.(this, dt);
    for (let i = this.decoys.length - 1; i >= 0; i--) {
      const d = this.decoys[i];
      if ((d.t -= dt) > 0 && d.alive) continue;
      this.decoys.splice(i, 1); this.unDecoy(d);
    }
  }

  update(dt) {
    for (const a of this.armed) {
      a.t += dt;
      if (a.target?.alive) a.mesh.position.copy(a.target.pos).setY(a.target.pos.y + a.target.height * 0.5);
    }
    for (const d of this.decoys) d.grp.rotation.y += dt * 2;
    for (const P of PARTS) P.frame?.(this, dt);
  }

  /** The Taunt Doll set down: every creature that sees it takes it for the Courier (game.ai.decoys) until its time is up. */
  decoy(row, at) {
    const g = this.game, grp = new THREE.Group(), m = this.mat(colourOf(row));
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.6, 8).translate(0, 0.3, 0), m);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 1).translate(0, 0.75, 0), m);
    grp.add(body, head); grp.position.copy(at); grp.userData.zoneFree = true; g.scene.add(grp); shellLook(g, 'set', row, { obj: grp });
    const d = { type: 'player', kind: 'courier', decoy: true, pos: grp.position, vel: new THREE.Vector3(), alive: true, loud: 2, height: 0.9, t: row.n.dur, grp, row,
      struck: () => { d.t = Math.min(d.t, 0.01); } };
    g.ai?.decoys.push(d); this.decoys.push(d);
    g.ai?.stimuli?.emit?.('noise', at, { radius: row.n.r, strength: 1.2, by: 'courier', source: d, ttl: row.n.dur });
  }
  unDecoy(d, quiet = false) {
    const g = this.game; d.alive = false; g.scene.remove(d.grp);
    d.grp.traverse((o) => o.geometry?.dispose());
    const j = g.ai?.decoys.indexOf(d); if (j >= 0) g.ai.decoys.splice(j, 1);
    if (!quiet) { blast(this, d.pos.clone().setY(d.pos.y + 0.4), 2.5, d.row.n.power, 'explosion'); sfx.explosion?.(g.listenerDistance?.(d.pos)); }
  }

  clear() {
    const g = this.game;
    for (const p of this.flying) g.scene.remove(p.mesh);
    for (const a of this.armed) g.scene.remove(a.mesh);
    for (const e of this.effects) e.sound?.stop?.();
    for (const d of this.decoys) this.unDecoy(d, true);
    this.flying = []; this.effects = []; this.armed = []; this.decoys = [];
    this.rod = null; this.stored = 0;
    if (g.weapon) g.weapon.haste = 1;
    for (const P of PARTS) P.clear?.(this);
  }
}

/** What a round does on touching something, by its kind; true: it is spent. */
const HIT = {
  bolt: (R, p, k, dir) => {
    if (k.ent?.type === 'clapper' && k.ent.alive) R.game.clappers.hit(k.ent, k.at, dir, 1, 'shot');
    if (k.target) R.game.hud?.hitmarker?.(!k.target.alive);
    land(R, p.row, k.at, k.normal, k.target, dir, k.ent);
    return true;
  },
  lob: (R, p, k, dir) => { land(R, p.row, k.at.clone().addScaledVector(k.normal, 0.15), k.normal, k.target, dir, k.ent); return true; },
  lobPart: (R, p, k) => { if (!p.landed) { p.landed = true; p.land?.(R, p, k.at.clone().addScaledVector(k.normal, 0.15), k); } return true; },
  // the Ricochet Saw: through every creature and on to the next nearest (M2's chain: up to `count`, none twice), off every wall, then
  // home to the muzzle
  saw: (R, p, k, dir) => {
    if (k.target) {
      graze(R, p, k.target, k.at, dir, p.row.n.power, 99); sfx.shellHit?.(['blast'], { tier: p.row.tier, type: 'impact' });
      const next = foesNear(R.game, k.target.pos, 10).find((c) => c !== k.target && !p.struck.has(c));
      if (++p.bounces >= p.row.n.count) { p.ghost = true; p.home = true; } else if (next) p.vel.copy(_v.copy(next.pos).setY(next.pos.y + next.height * 0.5).sub(p.pos).normalize().multiplyScalar(p.C.speed));
      return false;
    }
    if (k.ent?.type === 'clapper') R.game.clappers.hit(k.ent, k.at, dir, 1, 'sliced');
    if (k.ent?.type === 'breakable') R.game.breakables.damage(k.ent, 120, k.at, dir, 1);
    p.vel.reflect(k.normal); sfx.clonk?.(R.game.listenerDistance?.(k.at));
    if (++p.bounces >= p.row.n.count) { p.ghost = true; p.home = true; }
    return false;
  },
  // the Skipstone: every touch is a small blast; on water it skips harder
  skip: (R, p, k, dir) => {
    blast(R, k.at, p.row.n.r, p.row.n.power, 'explosion');
    sfx.shellHit?.(['blast'], { tier: p.row.tier });
    if (k.target) p.struck.set(k.target, 0.5);
    p.vel.reflect(k.normal); p.vel.y = Math.abs(p.vel.y) * 0.6 + 3; p.vel.multiplyScalar(0.9);
    return ++p.bounces >= p.row.n.count;
  },
  // the Pinball: off everything, faster each time, for `dur`
  pinball: (R, p, k, dir) => {
    if (k.target) { graze(R, p, k.target, k.at, dir, p.row.n.power, 0.3); _v.subVectors(p.pos, k.target.pos).setY(0).normalize(); p.vel.reflect(_v.lengthSq() ? _v : k.normal); }
    else p.vel.reflect(k.normal);
    if (k.ent?.type === 'clapper' && k.ent.alive) R.game.clappers.hit(k.ent, k.at, dir, 1, 'shot');
    if (k.ent?.type === 'breakable') R.game.breakables.damage(k.ent, 60, k.at, dir, 1);
    p.vel.multiplyScalar(p.row.n.gain); if (p.vel.length() > p.C.cap) p.vel.setLength(p.C.cap);
    sfx.clonk?.(R.game.listenerDistance?.(k.at));
    return false;
  },
  // a Cinder: a creature touched burns a little; the world is passed by
  cinder: (R, p, k, dir) => { if (k.target) graze(R, p, k.target, k.at, dir, p.row.n.power, 0.6); else p.vel.reflect(k.normal).multiplyScalar(0.5); return false; },
  // an Agent: on the ground it runs; on a creature it bursts
  agent: (R, p, k, dir) => {
    if (k.target) { AGENT_BURST(R, p); return true; }
    if (k.normal.y > 0.5) { p.grounded = true; p.vel.y = 0; } else p.vel.reflect(k.normal).multiplyScalar(0.4);
    return false;
  },
  // the Taunt Doll: set down where it lands
  doll: (R, p, k) => { R.decoy(p.row, k.normal.y > 0.5 ? k.at : k.at.clone().addScaledVector(k.normal, 0.3)); return true; },
  // what the Inhaler spits: a clod that bursts
  clod: (R, p, k) => { blast(R, k.at, 1.5, 2, 'explosion'); sfx.shellHit?.(['blast'], { tier: p.row.tier }); return true; },
};

const AGENT_BURST = (R, p) => { blast(R, p.pos, p.row.n.r, p.row.n.power, 'explosion'); R.game.fx?.explosion?.(p.pos, 0.6); sfx.shellHit?.(['blast'], { tier: p.row.tier }); };

/** What a round does when its time runs out in flight. */
const EXPIRE = {
  lob: (R, p) => land(R, p.row, p.pos, UP, null, p.vel.clone().normalize()),
  doll: (R, p) => R.decoy(p.row, p.pos),
  pinball: (R, p) => { blast(R, p.pos, 1.5, p.row.n.power * 2, 'explosion'); sfx.shellHit?.(['blast'], { tier: p.row.tier }); },
  lobPart: (R, p) => { if (!p.landed) { p.landed = true; p.land?.(R, p, p.pos.clone(), null); } },
  agent: AGENT_BURST,
};

/** A kind's own steering, each tick before it moves. */
const FLY = {
  // a part's lob that hangs at its apex (`hangAt`: Petal Rain), then lands where it hangs
  lobPart: (R, p, dt) => {
    if (!p.hangAt || p.landed) return;
    if (p.hanging == null && p.vel.y <= 0) { p.hanging = p.row.n.hang ?? 0.5; p.vel.set(0, 0, 0); p.C = { ...p.C, grav: 0 }; }
    if (p.hanging != null && (p.hanging -= dt) <= 0) { p.landed = true; p.land?.(R, p, p.pos.clone(), null); p.age = p.life + 1; }
  },
  // the saw on its way home
  saw: (R, p) => {
    if (!p.home) return;
    const m = R.game.player.pos; _v.set(m.x, m.y + 1.2, m.z).sub(p.pos);
    if (_v.length() < 1) { p.age = p.life + 1; return; }
    p.vel.copy(_v.normalize().multiplyScalar(p.C.speed));
  },
  // the skipstone off a water surface
  skip: (R, p) => {
    const w = R.game.water?.at?.(p.pos.x, p.pos.y, p.pos.z);
    if (!w || p.vel.y >= 0 || p.pos.y > w.surface + 0.05) return;
    p.pos.y = w.surface + 0.05; p.vel.y = Math.abs(p.vel.y) * 0.7 + 2.5;
    blast(R, p.pos, p.row.n.r, p.row.n.power * p.row.n.water, 'explosion');
    R.game.water.disturb?.(p.pos.x, p.pos.z, 1, 'drop', w.surface);
    if (++p.bounces >= p.row.n.count) p.age = p.life + 1;
  },
  // a Cinder drifts and leans toward the nearest foe
  cinder: (R, p, dt) => {
    const c = foesNear(R.game, p.pos, p.C.sight)[0];
    if (c) { _v.copy(c.pos).setY(c.pos.y + c.height * 0.5).sub(p.pos).normalize(); p.vel.addScaledVector(_v, p.C.seek * 3 * dt); }
    else p.vel.add(_v.set(simRand() - 0.5, simRand() - 0.45, simRand() - 0.5).multiplyScalar(4 * dt));
    if (p.vel.length() > p.C.seek * 1.5) p.vel.multiplyScalar(0.96);
    if (simRand() < 0.3) R.game.fx?.add?.emit?.({ pos: p.pos.clone(), vel: new THREE.Vector3(0, 0.5, 0), life: 0.3, size: 0.04, sizeEnd: 0.01, color: new THREE.Color(0xff7a2a), drag: 2 });
  },
  // an Agent runs along the ground at the nearest foe, and bursts beside it
  agent: (R, p) => {
    if (!p.grounded) return;
    const g = R.game, c = foesNear(g, p.pos, p.C.sight)[0];
    if (c && c.pos.distanceTo(p.pos) < c.radius + 1) { p.age = p.life + 1; return; }
    _v.set(0, 0, 0); if (c) _v.subVectors(c.pos, p.pos).setY(0).normalize();
    p.vel.set(_v.x * p.C.speed, 0, _v.z * p.C.speed);
    const down = g.physics.raycast(p.pos.clone().addScaledVector(UP, 0.5), DOWN, 1.5, g.player.collider, undefined, (col) => !col.isSensor() && !col.parent()?.isDynamic());
    if (down) p.pos.y = down.point.y + 0.15; else p.grounded = false;
  },
};

/** The shells whose firing is more than one round: each takes the runner, its row and the firing (ray, muzzle, camera, character, weapon). */
const FIRES = {
  ricochetSaw: (R, row, { muzzle, ray }) => { const p = R.launch('saw', row, muzzle, ray.dir, { scale: 2.2 }); p.mesh.scale.y = 0.3; },
  skipstone: (R, row, { muzzle, ray }) => { R.launch('skip', row, muzzle, ray.dir); },
  pinball: (R, row, { muzzle, ray }) => { R.launch('pinball', row, muzzle, ray.dir, { life: row.n.dur, scale: 1.6 }); },
  // Hailstorm: `count` pellets in a `spread` degree cone, each a hitscan round
  hailstorm: (R, row, { muzzle, ray }) => {
    const g = R.game, n = row.n; let any = 0;
    for (let i = 0; i < n.count; i++) {
      const d = spreadDir(ray.dir, n.spread);
      const hit = g.physics.raycast(ray.origin, d, T.weapon.range * 0.6, g.player.collider, undefined, (c) => !c.isSensor());
      const foe = R.creatureOn(ray.origin, d, hit ? hit.distance : T.weapon.range * 0.6, 0.05);
      const end = foe ? ray.origin.clone().addScaledVector(d, foe.d) : hit ? hit.point : ray.origin.clone().addScaledVector(d, T.weapon.range * 0.6);
      if (i % 3 === 0) g.fx?.tracer?.(muzzle, end);
      const ent = foe ? foe.c : hit?.entity;
      if (ent && hasTag(ent, 'hurtable') && ent.alive && !ent.ally) { g.creatures.strike(ent, end, d, n.power, 'shot', 'courier', null, 'impact'); any++; }
      else if (ent?.type === 'clapper' && ent.alive) { g.clappers.hit(ent, end, d, 0.6, 'shot'); any++; }
      else if (ent?.type === 'breakable') { g.breakables.damage(ent, 26, end, d, 0.5); any++; }
      else if (hit) g.fx?.impact?.(end, hit.normal, { sparks: 2, dust: 1 });
    }
    if (any) { sfx.shellHit?.(row.payloads, { tier: row.tier, type: 'impact' }); g.hud?.hitmarker?.(false); }
  },
  // Flamer: a cone of fire from the muzzle along the aim for `dur`, a burn every third of a second
  flamer: (R, row, { camera, character }) => {
    const g = R.game, n = row.n, cosA = Math.cos(30 * DEG), col = new THREE.Color(0xff7a2a);
    R.timed({ t: n.dur, every: 1 / 3, field: 'pool', tier: row.tier, tick: () => {
      const m = character.gunPoint('muzzle', new THREE.Vector3()), axis = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      for (const c of foesNear(g, m, n.r)) { _v.copy(c.pos).setY(c.pos.y + c.height * 0.5).sub(m); if (_v.normalize().dot(axis) > cosA) g.creatures.strike(c, c.pos.clone(), axis.clone(), n.power, 'shot', 'courier', null, 'impact'); }
      for (const c of g.clappers?.list || []) { _v.subVectors(c.pos, m); const d = _v.length(); if (c.alive && d < n.r && _v.normalize().dot(axis) > cosA) g.clappers.hit(c, c.pos, axis, 0.5, 'shot'); }
      for (let i = 0; i < 10; i++) g.fx?.add?.emit?.({ pos: m.clone(), vel: spreadDir(axis, 40).multiplyScalar(n.r * (1.2 + simRand())), life: 0.5, size: 0.08, sizeEnd: 0.25, color: col, drag: 1.5 });
    } });
  },
  // Inhaler: with nothing stored it draws loose things in front of the muzzle in and keeps up to `count`; with something stored it spits it all
  inhaler: (R, row, { muzzle, ray, camera, character }) => {
    const g = R.game, n = row.n;
    if (R.stored > 0) { for (let i = 0; i < R.stored; i++) R.launch('clod', row, muzzle, spreadDir(ray.dir, 8), { col: 0x8a6a4a, scale: 2 }); R.stored = 0; return; }
    const cosA = Math.cos(35 * DEG);
    R.timed({ t: 1.2, every: 0.05, tick: () => {
      const m = character.gunPoint('muzzle', new THREE.Vector3()), axis = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion), eat = [];
      g.physics.world.forEachRigidBody((b) => {
        if (!b.isDynamic() || g.physics.links.has(b.handle) || b.mass() > 40) return;
        const t = b.translation(); _v.set(m.x - t.x, m.y - t.y, m.z - t.z); const d = _v.length();
        if (d > n.r || d < 1e-3 || -_v.dot(axis) / d < cosA) return;
        const ent = b.numColliders() ? g.physics.entityOf(b.collider(0)) : null;
        if (ent?.type === 'player') return;
        if (d < 1.3 && R.stored + eat.length < n.count && ['slice', 'shard', 'prop'].includes(ent?.type)) { eat.push(ent); return; }
        g.physics.kick(b, { x: _v.x / d * 0.6 * b.mass(), y: (_v.y / d * 0.6 + 0.3) * b.mass(), z: _v.z / d * 0.6 * b.mass() });
      });
      for (const ent of eat) { g.breakables.removeAny(ent); R.stored++; sfx.gulp?.(0); }
      for (const c of g.clappers?.list || []) { const d = c.pos.distanceTo(m); if (c.alive && d < n.r) g.clappers.pull?.(c, m, 0.5 * (1 - d / n.r), 0.05); }
    } });
  },
  // Cinder: sparks that drift a while, leaning toward foes
  cinder: (R, row, { muzzle, ray }) => { for (let i = 0; i < 8; i++) R.launch('cinder', row, muzzle, spreadDir(ray.dir, 50), { life: row.n.dur, scale: 0.6, speed: 4 + simRand() * 4 }); },
  // Agents: little runners that drop, find their feet and go for the nearest foe
  agents: (R, row, { muzzle, ray }) => { for (let i = 0; i < row.n.count; i++) R.launch('agent', row, muzzle, spreadDir(ray.dir, 40), { scale: 1.5, speed: 6 }); },
  tauntDoll: (R, row, { muzzle, ray }) => { R.launch('doll', row, muzzle, ray.dir, { speed: 14, scale: 2 }); },
  // Overdrive: the tools in the hands work faster for `dur` (the weapon's haste); the core movement is untouched
  overdrive: (R, row) => {
    const g = R.game, w = g.weapon; if (w) w.haste = row.n.tools;
    R.timed({ t: row.n.dur, end: () => { if (w) w.haste = 1; } });
  },
};
// (the doll and the clod fly as lobs and bolts)
CARRIER.doll = CARRIER.lob;

// ---------------------------------------------------------------- the parts (CASTER-SHELLS.md section 1's mechanics), merged in
const PARTS = [SPLIT_CHAIN, DEPLOYABLES, BODIES, SPACETIME, CASTERS_OWN];
for (const P of PARTS) {
  Object.assign(CARRIER, P.carrier || {}); Object.assign(HIT, P.hit || {}); Object.assign(FLY, P.fly || {});
  Object.assign(EXPIRE, P.expire || {}); Object.assign(FIRES, P.fires || {}); Object.assign(LANDS, P.lands || {});
}
