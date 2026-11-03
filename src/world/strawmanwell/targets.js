// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S TRAINING TARGETS: filler foes for the Well's stages, target practice (South, 2026-11-02: "little ramshackle
// contraptions with an obvious training target motif", Strawman's family). Three kinds, each a creature on its stage's plane:
//   a target hopper   an archery butt on a bedspring: hops at you, crouches and pounces in reach
//   a quintain        the jousting target on a spool cart: it never starts a fight; strike it and its arm swings the sandbag round
//   a gallery duck    a tin shooting-gallery duck on a bobbin rotor: patrols its stretch in the air and dives at you
// They are straw dummies in all but body, mind and size (world/strawmanwell/dummy.js, Dovina's): the same percent and launch, the same
// blast lines and KO (`well.dummy.ko`), trophies, the same verbs heard, the same windup the parry answers; this runtime extends it,
// adding each kind's body (vfx/strawmanwell/targets/), mind (targetminds.js), size, weight (a heavier one is thrown less far) and blow.
// Only the stage you are in moves. The Well's area builds and takes them down with the room (boot/services.js: `populate`, `clear`).
// Each says its moments for the ear as `well.target { kind, beat, id, at, by }` (Wanda's audio/welltargets.js): the hopper's hop, crouch,
// leap and land; the quintain's wind, swing and home; the duck's fly (each leg, again every FLY_EVERY real s to keep its rotor up), tip,
// dive and stop; any kind's struck.
//
// Prior art: Super Smash Bros.' Subspace Emissary's filler foes (Primids, Bytans: small, many, there to be launched), the quintain, the
// shooting gallery, the archery boss; the straw dummies, extended.
//
//   game.wellTargets = new TrainingTargets(well)   .populate()   .clear()   .update(dt)   .list   TARGETS (by kind)   PLACES
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, G, groups } from '../../core/physics.js';
import { tag } from '../../core/tags.js';
import { Brain, Senses, Memory, Drives, rollTraits } from '../../creatures/ai/index.js';
import { StrawDummies, DUMMY } from './dummy.js';
import { AT, LANES, WINGS } from './layout.js';
import { targetMinds } from './targetminds.js';
import { TARGET_BODIES } from '../../vfx/strawmanwell/targets/bodies.js';

/** Each kind's numbers: its capsule (m), its weight (a blow's throw divided by it), its blow's windup (s), reach (m) and shove (m/s);
 *  the hopper's hop and leap (m/s up, along), the quintain's swing to the blow (s), the duck's height over its floor, flight, dive
 *  (s, m/s). */
export const TARGETS = {
  hopper: { name: 'target hopper', height: 1.25, radius: 0.4, weight: 0.9, wind: 0.45, reach: 1.15, shove: 5.5, hop: [4.4, 2.3], leap: [7.4, 3.7] },
  quintain: { name: 'quintain', height: 1.75, radius: 0.42, weight: 1.7, wind: 0.42, reach: 1.9, shove: 6.5, swing: 0.32 },
  duck: { name: 'gallery duck', height: 1.05, radius: 0.46, weight: 0.75, wind: 0.6, reach: 1.15, shove: 4.5, cruise: 3.4, fly: 2.1, dive: 0.55, speed: 9.5 },
};
/** Where they stand: [stage, kind, m along its lane, its floor's height there (m, 0 if left out)]; a flyer keeps its height over that
 *  floor. Dovina's ruling (2026-10-31): never a duck over a pit (a dive that shoves you into one you could not see coming is cheap), so
 *  the Run's flies over the far ledge; waves 2 to 4 hers by lane, checked against the stages as laid (the Arsenal's second duck clear of
 *  its cracked wall, the Swing's quintain on its first floor; none in the Maze, whose rooms are laid anew each game day). A lane not on
 *  this branch yet is passed over. */
export const PLACES = [
  ['wings', 'quintain', WINGS.strawman + 2.3], ['run', 'hopper', 75], ['run', 'duck', 70, 5], ['run', 'hopper', 96], ['climb', 'duck', 30],
  ['stomp', 'hopper', 30], ['brawl', 'duck', 25], ['machine', 'quintain', 16],
  ['arsenal', 'duck', 30, 3], ['arsenal', 'duck', 67], ['swing', 'quintain', 7], ['pit', 'hopper', 40], ['pit', 'hopper', 95],
];

/** How often a flying duck says `fly` again (real s): its rotor's whirr lasts 4 s a call (Wanda's). */
const FLY_EVERY = 3;
const DOWN = new THREE.Vector3(0, -1, 0), _o = new THREE.Vector3(), _v = new THREE.Vector3();
let NEXT = 1;

export class TrainingTargets extends StrawDummies {
  constructor(well) { super(well); this.minds = targetMinds(this); }
  /** A moment said for the ear (no rule narrates it: it is a sound's cue). */
  beat(c, beat) { this.game.events?.emit('well.target', { kind: c.target, beat, id: c.id, at: c.pos, by: 'environment' }); } // (`at`: the ear holds the duck's whirr by its distance, case 407)

  /** Every target in its place (the room just built). */
  populate() {
    const W = this.well, K = W.kit; if (!W.built || !K || this.list.length) return;
    for (const [stage, kind, x, fy = 0] of PLACES) {
      const L = LANES[stage], into = stage === 'brawl' ? W.stages.brawl?.arena?.into : K.groups.get(stage); if (!L || !into) continue;
      const arena = stage === 'brawl' ? W.stages.brawl.arena : { x0: AT.x - 1, x1: AT.x + L.len + 1, top: AT.y, z: L.z, stage, into };
      // (the room's colliders are not in the physics' queries until its next step: each spot stands on its floor's height as written,
      // and a target settles from there; a duck holds its height over it)
      const at = new THREE.Vector3(AT.x + x, AT.y + fy + 0.05, L.z);
      if (kind === 'duck') at.y += TARGETS.duck.cruise;
      this.spawn(at, arena, kind);
    }
  }

  /** One target (the straw dummy's spawn, with the kind's body, mind and size). */
  spawn(at, arena, kind = 'hopper') {
    const g = this.game, K = TARGETS[kind], M = this.minds[kind], H = K.height, R = K.radius;
    const model = new TARGET_BODIES[kind](); arena.into.add(model.group);
    const w = g.physics.world;
    const rb = w.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(at.x, at.y + H / 2, at.z));
    const col = w.createCollider(RAPIER.ColliderDesc.capsule(Math.max(0.05, H / 2 - R), R).setCollisionGroups(groups(G.CRITTER, 0xffff)), rb);
    const traits = rollTraits(M.traits);
    const c = {
      type: 'creature', kind: 'target', target: kind, K, name: K.name, training: true, id: `t${NEXT++}`, model, rb, col, arena, home: at.clone(),
      pos: at.clone(), vel: new THREE.Vector3(), want: new THREE.Vector3(), face: -1, radius: R, height: H, alive: true, out: 0,
      hp: 999, maxHp: 999, poise: DUMMY.poise * (traits.bold ?? 1), stunFor: DUMMY.stunFor, traits, rel: new Map(),
      percent: 0, tumble: 0, grounded: false, attack: null, chain: 0, lastT: -99, lastBy: null, cd: 0,
      center: (out) => out.copy(c.pos).setY(c.pos.y + H * 0.55),
      head: () => new THREE.Vector3(c.pos.x, c.pos.y + H + 0.25, c.pos.z),
      hurt: (p, dir, power, cause, by) => this.hurt(c, p, dir, power, cause, by),
      knock: (v) => { if (v.y > 1) { c.vel.y = Math.max(c.vel.y, v.y * 0.8); c.grounded = false; } },
      cancel: () => this.cancel(c),
      vanish: () => this.out(c, null),
    };
    const mem = new Memory({ hold: 4, ebb: 1 / 10 });
    const senses = new Senses(g, { sight: 30, fov: 360, feel: 14, hear: 1, eye: H * 0.8 });
    c.mem = mem; c.drives = new Drives(M.drives, traits);
    c.brain = new Brain(g, c, { senses, memory: mem, drives: c.drives, actions: M.actions, think: 0.2, near: 60, far: 120 });
    tag(c, 'hurtable', 'creature', 'straw');
    g.physics.register(col, c); g.creatures.add(c); g.ai?.add(c.brain); g.lock?.add?.(c); // (training: the creature counts skip it, the Well's own events count it)
    c.tag = this.tag(arena.into);
    this.list.push(c);
    return c;
  }

  /** A blow: the dummy's percent and throw, the throw divided by the kind's weight, straw out of it; a quintain struck swings back (a
   *  swing already under way rides on through the blows that follow). */
  hurt(c, point, dir, power, cause, by) {
    if (!c.alive || c.out > 0) return;
    this.riding = c.target === 'quintain' && !!c.attack;
    super.hurt(c, point, dir, power, cause, by);
    this.riding = false;
    if (!c.alive || c.out > 0) return;
    this.beat(c, 'struck');
    const k = 1 / c.K.weight; c.vel.x *= k; if (c.vel.y > 0) c.vel.y *= Math.sqrt(k); c.tumble *= k;
    this.game.vfx?.play?.('hit.blunt.straw', { pos: point || c.center(_v), dir: dir || _v.set(Math.sign(c.vel.x) || 1, 0.3, 0), power: Math.min(2, power), scale: 0.7 });
    if (c.target === 'quintain' && by === 'courier' && !c.attack) this.swipe(c);
  }
  cancel(c) { if (this.riding && c.target === 'quintain') return; super.cancel(c); }

  /** The kind's blow begun: its tell (the windup the parry answers) and its body's move. */
  swipe(c) {
    const g = this.game, K = c.K, eta = c.target === 'duck' ? K.wind + K.dive : c.target === 'hopper' ? K.wind + 0.6 : K.wind + K.swing;
    c.attack = c.target === 'quintain' ? { t: K.wind + K.swing, phase: 'swing' } : { t: K.wind, phase: 'wind' };
    c.want.set(0, 0, 0);
    g.creatures.windup?.(c, { at: c.pos, radius: K.reach, eta, kind: 'blow', parry: true, part: c.model.parts?.right ?? null, type: 'impact', read: true });
    c.model.play?.('swing');
    this.beat(c, c.target === 'hopper' ? 'crouch' : c.target === 'duck' ? 'tip' : 'wind');
  }
  /** A hop (the hopper's step): up and along, `k` of its full hop. */
  hop(c, dir, k = 1) { if (!c.grounded) return; c.vel.y = c.K.hop[0] * Math.sqrt(k); c.vel.x = dir * c.K.hop[1] * k; c.grounded = false; this.beat(c, 'hop'); }
  /** Is there floor where a hop or leap that way would land? */
  safe(c, dir, how) {
    const v = c.K[how] || c.K.hop, t = (2 * v[0]) / DUMMY.gravity, x = c.pos.x + dir * v[1] * t;
    if (x < c.arena.x0 + 0.5 || x > c.arena.x1 - 0.5) return false;
    const gy = this.groundAt(x, c.pos.y + 2.5, c.pos.z); return gy != null && gy > c.pos.y - 1.5;
  }
  /** The kind's blow, at the end of each stage: the hopper's crouch becomes its leap, the duck's tip its dive; then it lands. */
  release(c) {
    const g = this.game, K = c.K, A = c.attack, P = g.player;
    if (c.target === 'hopper' && A?.phase === 'wind') {
      const dx = (c.foeX ?? c.pos.x + c.face) - c.pos.x, along = THREE.MathUtils.clamp(Math.abs(dx) / ((2 * K.leap[0]) / DUMMY.gravity), 0.6, K.leap[1]);
      c.vel.y = K.leap[0]; c.vel.x = c.face * along; c.grounded = false; c.attack = { t: 2.5, phase: 'air', up: false }; this.beat(c, 'leap');
      return;
    }
    if (c.target === 'duck' && A?.phase === 'wind') {
      _v.set(P.pos.x - c.pos.x, P.pos.y + 0.6 - c.pos.y, 0); if (_v.lengthSq() < 1e-4) _v.set(c.face, -1, 0);
      c.dive = _v.normalize().multiplyScalar(K.speed).clone(); c.attack = { t: K.dive, phase: 'dive' }; this.beat(c, 'dive');
      return;
    }
    c.attack = null; c.dive = null; g.creatures.unwind?.(c, 'end');
    const dx = P.pos.x - c.pos.x, dy = P.pos.y - c.pos.y;
    const facing = c.target === 'quintain' || Math.sign(dx) === c.face || Math.abs(dx) < 0.5;
    if (Math.abs(dx) < K.reach && dy > -1.3 && dy < (c.target === 'quintain' ? 1.8 : 1.3) && facing && !(P.invuln > 0)) {
      P.impulse(new THREE.Vector3((Math.sign(dx) || c.face) * K.shove, 2.4, 0), 'strawman'); P.shake = Math.max(P.shake || 0, 0.3); this.well.hit();
    }
  }

  /** Out (a KO or a trophy): a duck's rotor stops with it. */
  out(c, ko, why) { if (c.target === 'duck' && c.out <= 0) this.beat(c, 'stop'); super.out(c, ko, why); }

  /** The floor under (x, from y down) on a lane, or null: the static world only. */
  groundAt(x, y, z) {
    const g = this.game; _o.set(x, y, z);
    const hit = g.physics.raycast(_o, DOWN, 30, null, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic() && !g.physics.entityOf(k)?.type && k.handle !== g.player?.collider?.handle);
    return hit ? hit.point.y : null;
  }

  /** Only the stage you are in moves: the duck held up and flown first, then the dummies' own step, then each body told how it flies. */
  update(dt) {
    const id = this.well.stage?.id; if (!id || !this.list.length) return;
    const all = this.list; this.list = all.filter((c) => c.arena.stage === id);
    for (const c of this.list) {
      if (c.target !== 'duck' || c.out > 0 || c.tumble > 0) continue;
      c.vel.y += DUMMY.gravity * dt; // (held up: the dummies' fall undone)
      if (c.attack?.phase === 'dive' && c.dive) { c.vel.copy(c.dive); continue; }
      const ty = c.home.y + 0.15 * Math.sin((this.game.events?.time ?? 0) * 1.7 + c.home.x);
      c.vel.y += ((ty - c.pos.y) * 2.4 - c.vel.y) * Math.min(1, dt * 4);
      c.vel.x += ((c.attack ? 0 : c.want.x) - c.vel.x) * Math.min(1, dt * 3);
    }
    super.update(dt);
    for (const c of this.list) {
      if (c.out > 0) continue;
      const A = c.attack;
      if (c.target === 'hopper' && A?.phase === 'air') { if (!c.grounded) A.up = true; else if (A.up) this.release(c); }
      // the ear's moments the step itself makes: a hopper's landing, the quintain's swing coming round and its roll home, the duck's legs
      if (c.target === 'hopper' && c.grounded && c.model.air) this.beat(c, 'land');
      if (c.target === 'quintain') {
        if (A?.phase === 'swing' && !A.round && A.t <= c.K.swing) { A.round = true; this.beat(c, 'swing'); }
        const rolling = !A && c.want.x !== 0; if (rolling && !c.rolling) this.beat(c, 'home'); c.rolling = rolling;
      }
      if (c.target === 'duck' && !A && c.tumble <= 0) {
        if (c.way !== c.leg || (c.flyT = (c.flyT ?? 0) - dt) <= 0) { c.leg = c.way; c.flyT = FLY_EVERY; this.beat(c, 'fly'); }
      } else if (c.target === 'duck') c.flyT = 0;
      c.model.air = !c.grounded; c.model.vy = c.vel.y;
    }
    this.list = all;
  }
}
