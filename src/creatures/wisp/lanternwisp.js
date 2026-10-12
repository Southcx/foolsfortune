// ---------------------------------------------------------------------------------------
// THE LANTERN WISP'S BODY: the second creature of the Dunes (the owner, v170: "one more enemy type running around"), on the owner's
// model and its animation suite (src/assets/lantern_wisp.glb: 34 joints, twenty clips). It hovers over the sand, drifts, and keeps its
// distance in a fight, throwing a ball of its flame that the parry sends back. Its mind is data (wisp/mind.js) built from the AI parts
// (creatures/ai/); this module is what carries it out: the hover, the clips, the cast, a blow taken, being put out and coming back.
//
//   game.wisps = new LanternWisps(game, gltf)   .spawn(home)   .update(dt)   .list   WISP (its numbers)
//   a Lantern Wisp is a creature (creatures.js's contract): hurt, knock, center, head, vanish, cancel; tagged hurtable, programmable
//   events: wisp.hit { cause, by }, wisp.burst { cause, by } (put out), wisp.cast { by }, wisp.notice { by }
//
// Prior art: the slip jelly's body (jelly/slipjelly.js: a kinematic capsule, a mind that sets `want`, a body that moves and poses);
// the hovering casters of the action game (Zelda's Wizzrobe, Dark Souls' Wisp, Kingdom Hearts' Wizard Heartless); a crossfaded clip a
// state (three.js AnimationMixer, as the Courier's and the clapperjars' rigs are played).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { RAPIER, G, groups } from '../../core/physics.js';
import { tag } from '../../core/tags.js';
import { st } from '../creatures.js';
import { ECON } from '../../progress/econ/table.js';
import { yieldOf } from '../../progress/combat/emo.js';
import { Brain, Senses, Memory, Drives, rollTraits } from '../ai/index.js';
import { wispMind } from './mind.js';
import { stream } from '../../core/rng.js';
const simRand = stream('creatures/wisp/lanternwisp'); // (the simulation's chance: core/rng.js, the same twice)

/** Its numbers. hp in blows of power 1; hover: its feet over the ground (m); cast: wind (s), speed (m/s), life (s), k (a vessel
 *  blow's size), reach (m from the Courier's chest it hits at); respawn: real s before it forms again at home (if the Courier is away). */
export const WISP = { hp: 5, poise: 2.5, stunFor: 2, sight: 18, scale: 0.9, hover: 1.3, bob: 0.18, radius: 0.4, height: 1.5, respawn: 45,
  cast: { wind: 0.75, speed: 11, life: 4, k: 0.45, reach: 0.75, power: 2 } };

const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion();
let NEXT = 1;
/** Each pose the mind asks for, as the suite's clip (the mood loops for how it feels). */
const POSE_CLIP = { idle: 'Idle', rest: 'Mood_Sad', watch: 'Mood_Curious', drift: 'Float_Forward', fight: 'Mood_Angry', flee: 'Mood_Scared', stun: 'Emote_Surprised', sleep: 'Mood_Sad', melt: 'Mood_Gall' };

export class LanternWisps {
  constructor(game, gltf) {
    this.game = game; this.gltf = gltf; this.list = []; this.bolts = [];
    this.clips = new Map(gltf.animations.map((c) => [c.name, c]));
    this.mind = wispMind(this);
    this.boltGeo = new THREE.IcosahedronGeometry(0.16, 1);
    this.boltMat = new THREE.MeshStandardMaterial({ color: 0xffb060, emissive: 0xff8a2a, emissiveIntensity: 2, roughness: 0.4 });
  }

  // ---------------------------------------------------------------- a body
  spawn(home, { yaw = simRand() * 6.28 } = {}) {
    const g = this.game, M = this.mind;
    const model = cloneSkinned(this.gltf.scene); model.scale.setScalar(WISP.scale);
    model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    const root = new THREE.Group(); root.add(model); root.position.copy(home); root.rotation.y = yaw; g.scene.add(root);
    const lantern = model.getObjectByName('lantern') || model;
    const mixer = new THREE.AnimationMixer(model);
    const w = g.physics.world, H = WISP.height, R = WISP.radius;
    const rb = w.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(home.x, home.y + WISP.hover + H * 0.5, home.z));
    const col = w.createCollider(RAPIER.ColliderDesc.capsule(H * 0.5 - R, R).setCollisionGroups(groups(G.CRITTER, 0xffff)), rb);
    const traits = rollTraits(M.traits);
    const c = {
      type: 'creature', kind: 'wisp', name: 'Lantern Wisp', id: NEXT++, root, model, lantern, mixer, rb, col,
      home: home.clone(), pos: home.clone(), vel: new THREE.Vector3(), want: new THREE.Vector3(), yaw, radius: R, height: H, lift: 0,
      alive: true, hp: WISP.hp, poise: WISP.poise * (traits.bold ?? 1), stunFor: WISP.stunFor, deadT: 0, dying: null, pose: 'idle', face: null,
      attack: null, traits, rel: new Map(), macro: null, loud: 1.2, playing: null, flash: 0,
      center: (out) => out.copy(c.pos).setY(c.pos.y + WISP.hover + H * 0.5),
      head: () => this.head(c),
      hurt: (p, dir, power, cause, by, from) => this.hurt(c, p, dir, power, cause, by, from),
      cancel: (why) => this.cancel(c, why),
      vanish: (by, cause) => this.vanish(c, by, cause),
      knock: (v) => { c.vel.add(_a.copy(v).setY(0)); if (v.y > 1) c.lift = Math.min(4, c.lift + v.y * 0.3); },
    };
    const mem = new Memory({ hold: 3, ebb: 1 / 8 });
    const senses = new Senses(g, { sight: WISP.sight, fov: 260, feel: 3, hear: 1.2, eye: 1.6, rate: 3.6, onHear: (s, reach) => M.heard(c, s, reach) });
    c.drives = new Drives(M.drives, traits);
    c.brain = new Brain(g, c, { senses, memory: mem, drives: c.drives, actions: M.actions, think: 0.2, near: 50, far: 140, mods: (ctx) => M.mods(ctx) });
    c.mem = mem;
    Object.defineProperty(c, 'state', { get: () => (c.attack ? 'wind' : c.brain?.action?.hunt ? 'chase' : c.brain?.action?.id || 'idle') });
    tag(c, 'hurtable', 'programmable', 'creature');
    g.physics.register(col, c);
    g.creatures.add(c); g.ai?.add(c.brain);
    this.list.push(c);
    this.play(c, 'Idle');
    return c;
  }
  head(c) { return new THREE.Vector3(c.pos.x, c.pos.y + WISP.hover + WISP.height + 0.2, c.pos.z); }
  /** The ground under it (the world's static shapes only), or null. */
  ground(c) {
    const g = this.game;
    const hit = g.physics.raycast(_a.set(c.pos.x + 0.0013, c.pos.y + WISP.hover + 1, c.pos.z + 0.0017), DOWN, 40, c.col, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic() && !g.physics.entityOf(k)?.type && k.handle !== g.player?.collider?.handle);
    return hit ? hit.point.y : (g.dunes?.heightAt?.(c.pos.x, c.pos.z) ?? null);
  }

  // ---------------------------------------------------------------- its clips (a loop a pose, crossfaded; a one-shot over it)
  play(c, name, { once = false, fade = 0.25 } = {}) {
    const clip = this.clips.get(name); if (!clip) return null;
    const a = c.mixer.clipAction(clip);
    if (c.playing === a && !once) return a;
    a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = once;
    a.enabled = true; a.setEffectiveWeight(1); a.play();
    if (c.playing && c.playing !== a) c.playing.crossFadeTo(a, fade, false);
    c.playing = a; c.once = once ? (clip.duration || 1) : 0;
    return a;
  }

  // ---------------------------------------------------------------- a blow taken, being put out, coming back
  hurt(c, p, dir, power, cause, by, from = null) {
    const g = this.game; if (!c.alive) return;
    if (st(c, 'sleep')) g.creatures.clearStatus(c, 'sleep');
    c.hp -= power * (g.stun?.bonus?.(c) ?? 1); c.flash = 1;
    c.vel.addScaledVector(_a.copy(dir).setY(0).normalize(), Math.min(3, power));
    if (c.attack && power >= 1.2) this.cancel(c, 'staggered');
    const culprit = from ?? (by === 'courier' ? g.player : null);
    if (culprit) c.mem.hurt(culprit, culprit === g.player ? 'courier' : culprit.kind, 0.3 + 0.15 * power, culprit.pos);
    c.drives.add('fear', (0.15 + 0.1 * power) / (c.traits.bold ?? 1));
    g.ai?.stimuli.emit('pain', c.pos, { radius: 16, strength: 0.9, by, source: c, about: culprit, aboutPos: culprit?.pos });
    c.brain.signal();
    g.events?.emit('wisp.hit', { cause, by });
    if (c.hp <= 0) this.burst(c, by, cause, culprit); else this.play(c, 'Hit', { once: true, fade: 0.08 });
  }
  /** Put out: the Death clip, its flame gone, its Lachryma on the sand; it forms again at home in a while. */
  burst(c, by, cause, culprit = null) {
    const g = this.game; if (!c.alive) return;
    c.alive = false; c.dying = 1.6; c.deadT = 0; this.cancel(c, 'put out'); c.col.setEnabled(false);
    c.brain.end('burst'); c.status.clear();
    g.ai?.stimuli.emit('death', c.pos, { radius: 26, strength: 1.2, by, source: c, about: culprit, aboutPos: culprit?.pos, ttl: 2 });
    this.play(c, 'Death', { once: true, fade: 0.1 });
    const at = c.center(new THREE.Vector3());
    if (by === 'courier') g.cubes?.burst?.(at, Math.round(ECON.wisp.burst * yieldOf(c.emo)), { count: 4, up: 3, from: 'wisp' });
    g.fx?.absorbSparkle?.(at);
    g.events?.emit('wisp.burst', { by, cause });
  }
  vanish(c, by, cause) {
    if (!c.alive) return;
    c.alive = false; c.dying = null; c.deadT = 0; this.cancel(c, cause); c.col.setEnabled(false); c.root.visible = false;
    c.brain.end('gone'); c.status.clear();
    this.game.events?.emit('wisp.burst', { by, cause });
  }
  reform(c) {
    c.alive = true; c.hp = WISP.hp; c.dying = null; c.attack = null; c.pos.copy(c.home); c.vel.set(0, 0, 0); c.lift = 0;
    c.root.visible = true; c.col.setEnabled(true); c.mem.wipe(); c.drives.set('fear', 0); c.rel.clear(); c.macro = null;
    this.play(c, 'Idle'); c.brain.decide();
  }
  /** A place it is set down (a shell's swap, a rift). */
  place(c, at) { c.pos.copy(at); c.vel.set(0, 0, 0); c.root.position.copy(at); c.rb.setTranslation({ x: at.x, y: at.y + WISP.hover + WISP.height * 0.5, z: at.z }, true); }

  // ---------------------------------------------------------------- the cast: a ball of its flame at the Courier, parryable
  windUp(c, move, foe) {
    const g = this.game, W = WISP.cast;
    c.attack = { move, foe, t: W.wind * (st(c, 'doubt') ? 1.6 : 1) };
    g.creatures.windup?.(c, { at: foe?.pos ?? c.pos, radius: 1, eta: c.attack.t, kind: 'cast', parry: false, type: 'illusion', read: true });
    this.play(c, 'Attack_Cast', { once: true, fade: 0.1 });
  }
  cancel(c) { if (!c.attack) return; c.attack = null; this.game.creatures.unwind?.(c, 'cancel'); }
  release(c) {
    const g = this.game, W = WISP.cast, A = c.attack; c.attack = null; g.creatures.unwind?.(c, 'end');
    const foe = A?.foe; if (!foe || !c.alive) return;
    const from = c.lantern.getWorldPosition(new THREE.Vector3());
    const to = foe === g.player ? _a.copy(g.player.pos).setY(g.player.pos.y + 1.1) : (foe.center?.(_a) ?? _a.copy(foe.pos));
    const flight = from.distanceTo(to) / W.speed, lead = _b.copy(foe.vel ?? UP.clone().set(0, 0, 0)).setY(0).multiplyScalar(Math.min(0.8, flight));
    const v = to.clone().add(lead).sub(from).normalize().multiplyScalar(W.speed);
    const m = new THREE.Mesh(this.boltGeo, this.boltMat); m.position.copy(from); m.userData.zoneFree = true; g.scene.add(m);
    const q = { m, pos: m.position, vel: v, v, t: 0, c, foe, lachryma: 1, from: c, mark: g.parryMark?.mark(m), vanish: () => { q.gone = true; } };
    this.bolts.push(q); (g.projectiles ||= new Set()).add(q);
    g.events?.emit('wisp.cast', { by: 'creature' });
  }
  updateBolts(dt) {
    const g = this.game, P = g.player, W = WISP.cast;
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const q = this.bolts[i]; q.t += dt;
      const from = q.pos.clone(); q.pos.addScaledVector(q.vel, dt); q.m.rotation.y += dt * 9;
      const step = q.pos.clone().sub(from), len = step.length();
      const wall = len > 1e-4 ? g.physics.raycast(from, step.normalize(), len, P?.collider, undefined, (k) => !k.isSensor() && !g.physics.entityOf(k)?.type) : null;
      const chest = P ? _a.copy(P.pos).setY(P.pos.y + 1.1) : null;
      const onCourier = !q.reflected && chest && q.pos.distanceTo(chest) < W.reach;
      const onFoe = q.reflected ? g.creatures.near(q.pos, 0.6).find((k) => !k.ally) : null; // (sent back by a parry, it strikes what it meets, its own caster too)
      if (q.gone || wall || onCourier || onFoe || q.t > W.life) {
        if (onCourier && !(P.invuln > 0)) g.vesselDamage?.hit({ from: q.c.pos.clone(), k: W.k, why: 'wisp', by: 'creature' });
        if (onFoe) g.creatures.strike(onFoe, q.pos.clone(), q.vel.clone().normalize(), W.power, 'parry', 'courier');
        if (!q.gone) g.fx?.impact?.(q.pos.clone(), q.vel.clone().normalize().negate(), { sparks: 8, dust: 0 });
        g.scene.remove(q.m); q.mark?.clear?.(); g.projectiles?.delete(q); this.bolts.splice(i, 1);
      }
    }
  }

  // ---------------------------------------------------------------- per tick
  update(dt) {
    const g = this.game, P = g.player;
    for (const c of this.list) {
      c.mixer.update(dt);
      if (!c.alive) {
        if (c.dying != null && (c.dying -= dt) <= 0) { c.dying = null; c.root.visible = false; }
        c.deadT += dt;
        if (c.deadT > WISP.respawn && Math.hypot(P.pos.x - c.home.x, P.pos.z - c.home.z) > 12) this.reform(c);
        continue;
      }
      if (c.taking || c.stashed) continue;
      const far = Math.abs(P.pos.x - c.pos.x) > 150 || Math.abs(P.pos.z - c.pos.z) > 150 || Math.abs(P.pos.y - c.pos.y) > 60;
      if (far) { c.brain.update(dt); continue; }
      const k = (st(c, 'halt') ? 0 : st(c, 'slow') ? 0.35 : 1) * (1 + 0.5 * st(c, 'haste')), dtk = dt * k;
      c.want.set(0, 0, 0); c.face = null;
      if (dtk > 0) { if (c.driven) c.driven(dtk); else c.brain.update(dtk); }
      if (c.attack && (c.attack.t -= dtk) <= 0) this.release(c);
      // moving: it eases toward what its mind wants, and hovers over the ground with a slow bob
      c.vel.x += (c.want.x - c.vel.x) * Math.min(1, dtk * 3); c.vel.z += (c.want.z - c.vel.z) * Math.min(1, dtk * 3);
      if (st(c, 'stun') || st(c, 'sleep')) c.vel.multiplyScalar(Math.max(0, 1 - dt * 6));
      c.pos.x += c.vel.x * dtk; c.pos.z += c.vel.z * dtk;
      const gy = this.ground(c); if (gy != null) c.pos.y += (gy - c.pos.y) * Math.min(1, dt * 6);
      c.lift = Math.max(0, c.lift - dt * 2);
      const face = c.face ? _a.set(c.face.x - c.pos.x, 0, c.face.z - c.pos.z) : _a.set(c.vel.x, 0, c.vel.z);
      if (face.lengthSq() > 0.02) { let dy = Math.atan2(face.x, face.z) - c.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); c.yaw += dy * Math.min(1, dt * 4); }
      const bob = Math.sin((g.events?.time ?? 0) * 2 + c.id) * WISP.bob * (st(c, 'sleep') ? 0.3 : 1);
      c.root.position.set(c.pos.x, c.pos.y + WISP.hover + bob + c.lift, c.pos.z); c.root.rotation.y = c.yaw;
      c.rb.setNextKinematicTranslation({ x: c.pos.x, y: c.pos.y + WISP.hover + c.lift + WISP.height * 0.5, z: c.pos.z });
      // its pose: a one-shot plays out, then the loop for what it is doing
      if (c.once > 0) { c.once -= dt; continue; }
      const sp = Math.hypot(c.vel.x, c.vel.z);
      let clip = POSE_CLIP[c.pose] || 'Idle';
      if (sp > 1.4 && ['drift', 'fight', 'flee'].includes(c.pose)) { const lx = Math.sin(-c.yaw) * c.vel.z + Math.cos(-c.yaw) * c.vel.x, lz = Math.cos(-c.yaw) * c.vel.z - Math.sin(-c.yaw) * c.vel.x; clip = Math.abs(lx) > Math.abs(lz) ? (lx > 0 ? 'Float_Right' : 'Float_Left') : (lz >= 0 ? 'Float_Forward' : 'Float_Backward'); }
      this.play(c, clip);
    }
    this.updateBolts(dt);
  }
}
