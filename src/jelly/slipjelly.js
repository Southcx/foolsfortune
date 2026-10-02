// ---------------------------------------------------------------------------------------
// THE SLIP JELLY: the first creature that lives in the world as well as fights in it. A mind jelly (the maker's model,
// Figment_MindJelly: an egg of sloppy wet sand over a skirt of four toes, always melting: deform.js's melt) that lives in the dunes
// round the Weir. This file is its BODY: how it moves, strikes, is hurt, bursts and forms again. What it DOES is its mind
// (jelly/mind.js), built from the AI parts every creature shares (src/ai/, docs/AI.md): it drinks at the oasis when it dries out,
// eats the Lachryma it finds, rests in the palms' shade, keeps to its kin, calls them when it sees the Courier, hunts her when it is
// hungry or she has hurt one of them, mourns where one burst, and flees when it is frightened enough.
//
// The body's moves, which the mind's actions ask for:
//   GLIDE   it slides on its own slip toward where the mind wants it (`c.want`, a velocity), laying a wet trail you can dive into
//   LUNGE   it sinks down and quivers (0.8 s, a rising swell), then throws itself in an arc at its foe; landing on it knocks it flat
//   SPIT    it leans back and swells (0.6 s), then lobs a glob of slip that splashes where it lands
//   CALL    a hop and a wet cry: kin within earshot learn what it has seen (an 'alarm' stimulus)
//   EAT     a bauble, a cube of Lachryma, a fish snatched from the shallows: pulled into it with a gulp
// A blow dents it where it lands and sets it wobbling; enough and it rears up and bursts: a fountain of slip that rains back down, a
// pool, a scatter of Lachryma, a rush of sand like a rainstick turned over; it forms again from its puddle at home a while later.
//
// It obeys the statuses every creature carries (creatures.js): halted it freezes, tinted cold; slowed, everything takes longer;
// asleep it slumps and breathes; stunned it sways with stars round its head (stun.js), and is open to the zandatsu and to
// reprogramming (veritome/reprogram.js); made to forget, it forgets; made to flee, it goes home; calmed, it never strikes; softened, it
// takes double; melted, it is a harmless puddle until the melt runs out. A wind-up can be CANCELLED.
//
// Prior art: Dragon Quest's slime (the hop, the squash, the friendly menace), Zelda's Chuchus (a jelly that sinks and springs at
// you, and leaves what it was made of when it bursts), Splatoon's ink trails (its slip is terrain you can use), and the telegraphed
// attack of every action game since Zelda: the wind-up is long, readable, and the body itself is the warning.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, G, groups } from '../physics.js';
import { addRim } from '../render/toon.js';
import { tag } from '../tags.js';
import { st } from '../creatures.js';
import { sfx } from '../audio.js';
import { PaintPath } from '../vfx/paintpath.js';
import { JellyDeform } from './deform.js';
import { Brain, Senses, Memory, Drives, rollTraits } from '../ai/index.js';
import { jellyMind } from './mind.js';

const H = 1.5, R = 0.5;
const COL = 0xffffff, COLD = new THREE.Color(0.65, 0.9, 1);
export const JELLY = {
  hp: 8, sight: 15, leash: 30, speed: 2.1, wander: 0.7, keep: 4.2,
  lunge: { wind: 0.8, reach: 8, flight: 0.8, hit: 1.4, push: 8, lift: 4.5, drain: 8, cd: [2.2, 3.4], dmg: 2.5 },
  spit: { wind: 0.6, min: 4.5, max: 13, speed: 11, cd: [2.6, 3.8], hit: 0.9, push: 5, dmg: 1 },
  respawn: 40, trailEvery: 0.35, poise: 1, stunFor: 5,
};
const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _acc = new THREE.Vector2();
const rnd = (a, b) => a + Math.random() * (b - a);
let NEXT = 1;

export class SlipJellies {
  constructor(game, gltf) {
    this.game = game;
    this.geo = null;
    // (the mesh as it stands in the file, its node's turn and scale baked in: the shader reads heights in metres)
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => { if (o.isMesh && !this.geo) { this.geo = o.geometry.clone().applyMatrix4(o.matrixWorld); this.geo.computeVertexNormals(); } });
    this.trail = new PaintPath(game.scene, { wet: 0x7d5f3e, dry: 0xb3905f, life: 10, max: 240 });
    this.globs = [];
    this.globGeo = new THREE.IcosahedronGeometry(0.16, 1);
    this.globMat = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.3 });
    this.list = [];
    this.mind = jellyMind(this);
    // its den, as the ecology knows it (each jelly's home: ai/ecology.js)
    game.ai?.eco.provide('den', (pos, range) => this.list.filter((c) => !c.spirit && c.home.distanceTo(pos) < range).map((c) => ({ pos: c.home, ref: c, radius: 1.5 })));
  }

  spawn(home, { yaw = Math.random() * 6.28, spirit = null } = {}) {
    const g = this.game, M = this.mind;
    // (sand, wet and sliding: the colour and the gloss are the melt's, deform.js; the material's colour only tints it)
    const mat = new THREE.MeshStandardMaterial({ color: COL, roughness: 0.7, metalness: 0, emissive: 0x000000, emissiveIntensity: 1 });
    // (a SPIRIT (spirits.js) is a jelly of smoke: the same body and the same mind, lit from inside, a little see-through)
    if (spirit) { mat.transparent = true; mat.opacity = 0.74; mat.depthWrite = true; }
    addRim(mat, 0.5);
    const deform = new JellyDeform(mat, H, { melt: true });
    const root = new THREE.Group();
    const body = new THREE.Mesh(this.geo, mat);
    body.castShadow = true; body.renderOrder = 2;
    root.add(body);
    root.position.copy(home); root.rotation.y = yaw;
    g.scene.add(root);
    const w = g.physics.world;
    const rb = w.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(home.x, home.y + H * 0.5, home.z));
    const col = w.createCollider(RAPIER.ColliderDesc.capsule(H * 0.5 - R * 0.85, R * 0.85).setCollisionGroups(groups(G.CRITTER, 0xffff)), rb);
    const traits = rollTraits(M.traits);
    const c = {
      type: 'creature', kind: spirit ? 'spirit' : 'slipjelly', name: spirit ? 'Smoke Spirit' : 'Slip Jelly', id: NEXT++, root, body, mat, deform, rb, col, spirit, ally: !!spirit,
      home: home.clone(), pos: home.clone(), prevPos: home.clone(), vel: new THREE.Vector3(), want: new THREE.Vector3(), vy: 0, yaw, radius: R, height: H,
      alive: true, hp: JELLY.hp, poise: JELLY.poise * (traits.bold ?? 1), stunFor: JELLY.stunFor, air: false, groundY: null, groundT: 0, trailT: 0,
      hurtT: 0, flash: 0, deadT: 0, lastHitBy: null, pose: 'idle', face: null, attack: null, traits, rel: new Map(), macro: null, loud: 1,
      macros: JELLY_MACROS,
      center: (out) => out.copy(c.pos).setY(c.pos.y + H * 0.55),
      head: () => this.head(c),
      hurt: (p, dir, power, cause, by, from) => this.hurt(c, p, dir, power, cause, by, from),
      cancel: (why) => this.cancel(c, why),
      vanish: (by, cause) => this.vanish(c, by, cause),
      knock: (v) => { c.vel.add(_a.copy(v).setY(0)); if (v.y > 1) { c.vy = v.y; c.air = true; } },
      onStatus: (name, dur, k, by) => this.onStatus(c, name, by), onStatusEnd: (name) => this.onStatusEnd(c, name),
    };
    const mem = new Memory({ hold: 2.5, ebb: 1 / 9 });
    const senses = new Senses(g, { sight: JELLY.sight, fov: 230, feel: 2.6, hear: 1, eye: 1.1, onHear: (s, reach) => M.heard(c, s, reach) });
    c.drives = new Drives(M.drives, traits);
    c.brain = new Brain(g, c, { senses, memory: mem, drives: c.drives, actions: M.actions, think: 0.2, near: 50, far: 140, mods: (ctx) => M.mods(ctx) });
    c.mem = mem;
    // what it is doing, in a word, for whoever looks (the Veritome's photograph reads it: veritome/subjects.js, the bestiary's facts):
    // its wind-up, the hunt, or the action its mind is running
    Object.defineProperty(c, 'state', { get: () => (c.attack?.phase === 'wind' ? 'wind' : c.brain?.action?.hunt ? 'chase' : ({ 'go home': 'home', 'sent home': 'home' })[c.brain?.action?.id] || c.brain?.action?.id || 'idle') });
    if (spirit) { c.hp = JELLY.hp * (spirit.power ?? 1); c.poise = 99; tag(c, 'hurtable', 'creature'); }
    else tag(c, 'hurtable', 'programmable', 'creature', 'sliceable');
    g.physics.register(col, c);
    g.creatures.add(c);
    g.ai?.add(c.brain);
    this.list.push(c);
    return c;
  }

  // ---------------------------------------------------------------- the world around it
  ground(c, x, z) {
    const g = this.game;
    const from = _a.set(x, (c.groundY ?? c.pos.y) + 3, z);
    const hit = g.physics.raycast(from, _b.set(0, -1, 0), 40, c.col, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic() && !g.physics.entityOf(k)?.type);
    return hit ? hit.point.y : null;
  }
  /** Is there something solid in the way along `dir` (for the steering's whiskers)? the wall's normal, or null. */
  probe(c, pos, dir, len) {
    const g = this.game;
    const hit = g.physics.raycast(_c.set(pos.x, pos.y + 0.6, pos.z), dir, len, c.col, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic() && !g.physics.entityOf(k)?.type);
    return hit && Math.abs(hit.normal.y) < 0.6 ? hit.normal : null;
  }
  head(c) { return new THREE.Vector3(c.pos.x, c.pos.y + H * c.deform.sq + 0.35, c.pos.z); }

  // ---------------------------------------------------------------- blows
  hurt(c, p, dir, power, cause, by, from = null) {
    const g = this.game;
    if (!c.alive) return;
    if (st(c, 'sleep')) g.creatures.clearStatus(c, 'sleep');
    const dmg = power * (st(c, 'melt') ? 1.5 : 1) * (g.stun?.bonus(c) ?? 1);
    c.hp -= dmg; c.lastHitBy = by; c.hurtT = 0.35; c.flash = 1;
    // where it was struck, dented; the whole of it set wobbling and leaning away
    const local = c.root.worldToLocal(_a.copy(p));
    c.deform.dent(local, 0.12 + 0.08 * Math.min(2, power));
    const away = _b.copy(dir).setY(0); if (away.lengthSq() < 1e-4) away.set(0, 0, 1); away.normalize();
    const lean = new THREE.Vector2(away.x, away.z).rotateAround(new THREE.Vector2(), c.root.rotation.y);
    c.deform.kick(-1.6 * power, lean.multiplyScalar(2.4 * power), 0.12 + 0.05 * power);
    if (!st(c, 'halt') && !st(c, 'melt')) c.vel.addScaledVector(away, Math.min(2.5, 0.8 * power)); // (a shove, soaked up by its own slip)
    if (c.attack?.phase === 'wind' && power >= 1.5) this.cancel(c, 'staggered'); // (a heavy blow breaks a wind-up)
    // its mind: who did it is a threat now (and one it will remember), and a cry goes up that its kin can hear
    const culprit = from ?? (by === 'courier' ? g.player : null);
    if (culprit) c.mem.hurt(culprit, culprit === g.player ? 'courier' : culprit.kind, 0.25 + 0.15 * power, culprit.pos);
    c.drives.add('fear', (0.12 + 0.08 * power) / (c.traits.bold ?? 1));
    g.ai?.stimuli.emit('pain', c.pos, { radius: 16, strength: 0.9, by, source: c, about: culprit, aboutPos: culprit?.pos });
    c.brain.signal();
    sfx.jellySquelch(g.listenerDistance(c.pos), Math.min(1.5, 0.7 + power * 0.3));
    g.fx?.impact?.(_c.copy(p), _a.copy(dir).negate(), { sparks: 0, dust: 3 });
    g.events?.emit('jelly.hit', { cause, by, hp: Math.max(0, +c.hp.toFixed(1)) });
    if (c.hp <= 0) this.burst(c, dir, by, cause, culprit);
  }

  /** Its end: it rears up, and a beat later it bursts (pop): a fountain of slip that rains back down, a pool, its Lachryma, a rush of sand. */
  burst(c, dir, by, cause, culprit = null) {
    const g = this.game;
    if (!c.alive) return;
    c.alive = false; c.dying = 0.14; c.deadT = 0; c.attack = null;
    c.col.setEnabled(false);
    c.deform.kick(9, null, 0.3); c.deform.target.squash = 1.55; // (the rearing: up on its toes, before it goes)
    c.brain.end('burst');
    g.ai?.stimuli.emit('death', c.pos, { radius: 26, strength: 1.2, by, source: c, about: culprit, aboutPos: culprit?.pos, ttl: 2 });
    c.burstBy = { dir: dir.clone(), by, cause };
    g.events?.emit(c.spirit ? 'spirit.fade' : 'jelly.burst', { by, cause });
    c.status.clear();
  }
  pop(c) {
    const g = this.game, { dir, by } = c.burstBy;
    c.root.visible = false;
    if (c.spirit) { this.smoke(c); return; }
    const at = c.pos.clone().setY(c.pos.y + 0.7);
    sfx.jellyPop(g.listenerDistance(at));
    sfx.rainstick?.(g.listenerDistance(at));
    // the fountain: big gobs thrown high (the pop is upward), and a fine shower of slip that rains back down round it
    for (let i = 0; i < 12; i++) {
      const v = new THREE.Vector3(rnd(-1, 1), rnd(1.6, 2.6), rnd(-1, 1)).normalize().multiplyScalar(rnd(5, 8.5)).addScaledVector(dir, 1.2);
      g.shells?.addDroplet?.(at.clone(), v, rnd(0.05, 0.1), true);
    }
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, r = rnd(0.2, 2.2);
      g.shells?.addDroplet?.(at.clone().setY(at.y + 0.3), new THREE.Vector3(Math.cos(a) * r, rnd(6.5, 10), Math.sin(a) * r), rnd(0.018, 0.035), true);
    }
    if (g.fx?.alpha?.emit) for (let i = 0; i < 14; i++) g.fx.alpha.emit({ pos: at.clone(), vel: new THREE.Vector3(rnd(-1.5, 1.5), rnd(3, 6), rnd(-1.5, 1.5)), life: rnd(0.8, 1.4), size: 0.06, sizeEnd: 0.02, color: new THREE.Color(0xb3905f), alpha: 0.85, drag: 0.6, gravity: 9 });
    g.shells?.addSplat?.(c.pos.clone().setY(c.pos.y + 0.02), UP, 2.6, true);
    g.slip?.addDisc(c.pos.clone(), UP, 1.6, 20);
    // (its Lachryma: what it was, and whatever it had swallowed of hers, back on the sand whoever burst it)
    if (by === 'courier' || c.stash) g.cubes?.burst?.(at, (by === 'courier' ? 6 : 0) + (c.stash || 0), { count: 4 + Math.min(8, c.stash || 0), up: 4, from: 'jelly' });
    c.stash = 0;
    g.glyphs?.pop('star', at.clone().setY(at.y + 0.4), { color: 0xd9c8ff, size: 0.5, life: 0.9, burst: true });
  }
  /** Gone without a burst (the zandatsu takes its body apart itself: veritome and sondelass call this). */
  vanish(c, by, cause) {
    if (!c.alive) return;
    c.alive = false; c.dying = null; c.deadT = 0; c.attack = null;
    c.col.setEnabled(false); c.root.visible = false;
    c.brain.end('gone');
    this.game.ai?.stimuli.emit('death', c.pos, { radius: 26, strength: 1.2, by, source: c, about: by === 'courier' ? this.game.player : null, aboutPos: this.game.player.pos, ttl: 2 });
    this.game.events?.emit(c.spirit ? 'spirit.fade' : 'jelly.burst', { by, cause });
    if (c.spirit) this.smoke(c);
    c.status.clear();
  }
  /** A spirit gone back into smoke (its time up, or struck down): a puff, and nothing left behind. */
  smoke(c) {
    const g = this.game, at = c.pos.clone().setY(c.pos.y + 0.6);
    if (g.fx?.alpha?.emit) for (let i = 0; i < 28; i++) g.fx.alpha.emit({ pos: at.clone().add(new THREE.Vector3(rnd(-0.4, 0.4), rnd(-0.3, 0.5), rnd(-0.4, 0.4))), vel: new THREE.Vector3(rnd(-0.8, 0.8), rnd(0.6, 2.2), rnd(-0.8, 0.8)), life: rnd(1.2, 2.2), size: 0.25, sizeEnd: 0.9, color: new THREE.Color(0x8f7fc0), alpha: 0.4, drag: 1.4, gravity: -0.6 });
    sfx.jellyPop?.(g.listenerDistance(at) * 1.6);
  }
  /** Gone for good (a spirit: it does not form again). */
  dispose(c) {
    const g = this.game;
    g.scene.remove(c.root); c.mat.dispose();
    try { g.physics.removeBody(c.rb); } catch { /* already gone */ }
    g.creatures.remove(c); g.ai?.remove(c.brain);
    this.trail.gap(c);
    const i = this.list.indexOf(c); if (i >= 0) this.list.splice(i, 1);
  }

  cancel(c, why = 'cancelled') {
    const g = this.game, A = c.attack;
    if (!A || A.phase !== 'wind') return false;
    A.phase = 'recover'; A.t = 0.9; c.deform.target.squash = 1; c.deform.kick(3, null, 0.2);
    g.glyphs?.pop('ask', this.head(c), { color: 0xd9c8ff, size: 0.45, life: 0.9, follow: () => this.head(c) });
    g.events?.emit('jelly.cancel', { why });
    c.brain.signal();
    return true;
  }

  onStatus(c, name) {
    const g = this.game, d = c.deform;
    if (name === 'halt') d.freeze();
    if (['sleep', 'stun', 'melt', 'calm', 'forget', 'flee'].includes(name) && c.attack?.phase === 'wind') this.cancel(c, name === 'stun' ? 'stunned' : name);
    if (name === 'sleep') g.glyphs?.pop('dots', this.head(c), { color: 0xd9c8ff, size: 0.5, life: 1.4 });
    if (name === 'forget') { c.mem.wipe(); c.drives.set('fear', 0); }
    if (name === 'melt') d.kick(-2, null, 0.3);
    if (name === 'stun') { d.kick(-4, null, 0.35); c.vel.multiplyScalar(0.2); }
    c.brain.signal();
  }
  onStatusEnd(c, name) {
    if (name === 'sleep' || name === 'melt' || name === 'stun') c.deform.kick(4, null, 0.22);
    c.brain.signal();
  }

  // ---------------------------------------------------------------- per frame
  update(dt) {
    const g = this.game, P = g.player;
    for (const c of this.list.slice()) { // (a copy: a spirit that goes back to smoke leaves the list)
      if (!c.alive) {
        if (c.dying != null) {
          c.dying -= dt; c.deform.update(dt, null); c.root.position.copy(c.pos);
          if (c.dying <= 0) { c.dying = null; this.pop(c); }
          continue;
        }
        c.deadT += dt;
        if (c.spirit) { if (c.deadT > 0.5) this.dispose(c); continue; }
        if (c.deadT > JELLY.respawn && Math.hypot(P.pos.x - c.home.x, P.pos.z - c.home.z) > 10) this.reform(c);
        continue;
      }
      if (c.spirit && (c.spirit.life -= dt) <= 0) { this.vanish(c, 'environment', 'faded'); continue; } // (its time is up: back into smoke)
      // (far from the Courier, it rests where it is: its mind keeps its wants ticking and no more (brain.js's level of detail))
      const far = Math.abs(P.pos.x - c.pos.x) > 150 || Math.abs(P.pos.z - c.pos.z) > 150 || Math.abs(P.pos.y - c.pos.y) > 60;
      if (far) { c.brain.update(dt); continue; }
      if (c.groundY == null) { const y = this.ground(c, c.pos.x, c.pos.z); if (y == null) continue; c.groundY = y; c.pos.y = y; c.home.y = y; }
      const halt = st(c, 'halt'), slow = st(c, 'slow');
      const k = (halt ? 0 : slow ? 0.35 : 1) * (1 + 0.5 * st(c, 'haste')), dtk = dt * k; // (haste: a song's rally, moves/crucibelle.js)
      c.prevPos.copy(c.pos);
      c.want.set(0, 0, 0); c.face = null;
      if (dtk > 0) { c.brain.update(dtk); this.attackTick(c, dtk); }
      this.move(c, dtk);
      this.pose(c, dt, dtk);
    }
    this.updateGlobs(dt);
    this.trail.update(dt);
  }

  // ---------------------------------------------------------------- attacks (the mind starts them; the body carries them through)
  windUp(c, move, foe) {
    const g = this.game, W = JELLY[move];
    c.attack = { move, foe, phase: 'wind', t: W.wind, hit: false };
    c.vel.multiplyScalar(0.2);
    sfx.jellyWind(g.listenerDistance(c.pos), W.wind * (st(c, 'slow') ? 2.8 : 1));
    g.events?.emit('jelly.wind', { move });
  }
  attackTick(c, dt) {
    const A = c.attack, D = c.deform;
    if (!A) return;
    if ((!A.foe || A.foe.alive === false) && A.phase === 'wind') { this.cancel(c, 'lost'); return; }
    A.t -= dt;
    if (A.phase === 'wind') {
      D.target.squash = A.move === 'lunge' ? 0.62 : 1.12;
      D.target.lean.set(0, A.move === 'spit' ? -0.18 : 0);
      D.wob = Math.max(D.wob, 0.05); // (the quiver)
      c.face = A.foe.pos;
      if (A.t <= 0) this.release(c);
    } else if (A.phase === 'air') {
      if (!c.air) { A.phase = 'recover'; A.t = 0.7; }
    } else if (A.phase === 'recover' && A.t <= 0) c.attack = null;
  }

  release(c) {
    const g = this.game, A = c.attack, D = c.deform, foe = A.foe;
    D.target.squash = 1; D.target.lean.set(0, 0);
    const F = foe.pos;
    if (A.move === 'lunge') {
      const L = JELLY.lunge, to = _a.set(F.x - c.pos.x, 0, F.z - c.pos.z), dist = Math.min(L.reach, to.length());
      to.setLength(dist / L.flight);
      c.vel.copy(to); c.vy = 9.81 * L.flight * 0.5; c.air = true; // (an arc that comes down where its foe stood)
      A.phase = 'air'; A.t = L.flight + 0.5;
      D.kick(7, null, 0.1);
      c.drives.add('thirst', 0.05); c.drives.add('rest', 0.04);
    } else {
      const S = JELLY.spit, from = this.head(c).setY(c.pos.y + H * 0.8), aim = _a.copy(F).setY(F.y + (foe === g.player ? 0.9 : 0.6));
      const flat = Math.hypot(aim.x - from.x, aim.z - from.z), tFlight = Math.max(0.15, flat / S.speed);
      const v = new THREE.Vector3(aim.x - from.x, 0, aim.z - from.z);
      if (v.lengthSq() < 1e-6) v.set(0, 0, 1);
      v.setLength(S.speed);
      v.y = (aim.y - from.y) / tFlight + 0.5 * 9.81 * tFlight;
      const m = new THREE.Mesh(this.globGeo, this.globMat); m.position.copy(from); g.scene.add(m);
      this.globs.push({ m, v, t: 0, c, foe });
      D.kick(5, new THREE.Vector2(0, 1.5), 0.15);
      sfx.jellySquelch(g.listenerDistance(c.pos), 0.9);
      A.phase = 'recover'; A.t = 0.7;
      c.drives.add('thirst', 0.04);
    }
    g.events?.emit('jelly.attack', { move: A.move });
  }

  move(c, dt) {
    const g = this.game, A = c.attack;
    if (st(c, 'melt') || st(c, 'sleep') || st(c, 'stun')) c.vel.multiplyScalar(Math.max(0, 1 - dt * 6));
    if (A?.phase === 'wind') c.vel.multiplyScalar(Math.max(0, 1 - dt * 8));
    else if (!c.air && dt > 0) { // (it glides toward what its mind wants, on its slip)
      const ax = c.want.x - c.vel.x, az = c.want.z - c.vel.z;
      c.vel.x += ax * Math.min(1, dt * 3); c.vel.z += az * Math.min(1, dt * 3);
    }
    // facing: what it faces, or where it goes
    const face = c.face ? _a.set(c.face.x - c.pos.x, 0, c.face.z - c.pos.z) : _a.set(c.vel.x, 0, c.vel.z);
    if (face.lengthSq() > (c.face ? 1e-3 : 0.04) && dt > 0) {
      const yaw = Math.atan2(face.x, face.z);
      let dy = yaw - c.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      c.yaw += dy * Math.min(1, dt * (A?.phase === 'wind' ? 8 : 4));
    }
    const nx = c.pos.x + c.vel.x * dt, nz = c.pos.z + c.vel.z * dt;
    c.groundT -= dt;
    let gy = c.groundY;
    if (c.groundT <= 0 || c.air) { const y = this.ground(c, nx, nz); c.groundT = 0.12; if (y != null) gy = y; }
    // (a step up of more than half a metre is a wall: it stops there)
    if (!c.air && gy != null && gy - c.groundY > 0.6) { c.vel.multiplyScalar(-0.3); } else { c.pos.x = nx; c.pos.z = nz; }
    if (gy != null) c.groundY = gy;
    if (c.air) {
      c.vy -= 9.81 * dt; c.pos.y += c.vy * dt;
      if (c.pos.y <= c.groundY && c.vy < 0) this.land(c);
      // (on the way, it can hit its foe bodily: a lunge not stepped out of)
      else if (A?.phase === 'air' && !A.hit && A.foe && !st(c, 'calm')) {
        const F = A.foe.pos, fy = A.foe === g.player ? F.y + 0.9 : F.y + (A.foe.height ?? 1) * 0.5;
        if (Math.hypot(F.x - c.pos.x, F.z - c.pos.z) < 0.9 && Math.abs(fy - (c.pos.y + H * 0.5)) < 1.2) { A.hit = true; this.strike(c, A.foe, 'lunge'); }
      }
    } else if (dt > 0) {
      c.pos.y += (c.groundY - c.pos.y) * Math.min(1, dt * 12);
      c.vel.multiplyScalar(Math.max(0, 1 - dt * (c.want.lengthSq() > 0.01 ? 0.6 : 3)));
    }
    // its slip, laid as it glides
    c.trailT -= dt;
    if (!c.air && c.trailT <= 0 && c.vel.lengthSq() > 0.15) {
      c.trailT = JELLY.trailEvery;
      const at = _a.set(c.pos.x, c.groundY + 0.015, c.pos.z);
      this.trail.add(at, UP, _b.copy(c.vel).normalize(), 0.7, c); // (each jelly its own stroke: two near each other never join)
      g.slip?.addDisc(at, UP, 0.42, 14, 0.4);
    } else if (c.vel.lengthSq() <= 0.15) this.trail.gap(c);
    c.rb.setNextKinematicTranslation({ x: c.pos.x, y: c.pos.y + H * 0.5, z: c.pos.z });
  }

  land(c) {
    const g = this.game, A = c.attack;
    c.pos.y = c.groundY; c.vy = 0; c.air = false;
    c.deform.kick(-6, null, 0.25);
    c.vel.multiplyScalar(0.25);
    sfx.jellyLand(g.listenerDistance(c.pos));
    g.shells?.addSplat?.(c.pos.clone().setY(c.groundY + 0.02), UP, 1.4, true);
    g.slip?.addDisc(c.pos.clone(), UP, 0.9, 16);
    if (A?.phase === 'air' && !A.hit && A.foe && !st(c, 'calm')) {
      const F = A.foe.pos;
      if (Math.hypot(F.x - c.pos.x, F.z - c.pos.z) < JELLY.lunge.hit && Math.abs(F.y - c.pos.y) < 1.6) { A.hit = true; this.strike(c, A.foe, 'lunge'); }
    }
  }

  /** It lands a blow on its foe: the Courier (knocked flat, her Lachryma drained: it feeds on it) or another creature. */
  strike(c, foe, move) {
    const g = this.game, P = g.player, S = move === 'lunge' ? JELLY.lunge : JELLY.spit;
    const v = _a.set(foe.pos.x - c.pos.x, 0, foe.pos.z - c.pos.z); if (v.lengthSq() < 1e-4) v.set(0, 0, 1);
    if (foe === P) {
      if (P.invuln > 0) return;
      v.setLength(S.push).setY(move === 'lunge' ? S.lift : 2);
      P.impulse(v.clone(), 'jelly');
      P.shake = Math.max(P.shake || 0, 0.5);
      const took = g.lachryma?.drain?.(move === 'lunge' ? S.drain : 4, 'jelly') ?? 0;
      if (took > 0) c.drives.sat('hunger', 0.04 * took); // (it fed on her: a hungry jelly is a dangerous one)
      g.events?.emit('jelly.strike', { move, by: 'environment' });
    } else if (foe.decoy) { foe.struck?.(); // (a Courier of smoke: struck, it is gone: crucibelle/mirage.js)
    } else if (foe.type === 'creature') {
      g.creatures.strike(foe, foe.center(new THREE.Vector3()), v.clone().normalize(), S.dmg * (1 + st(c, 'empower')) * (c.spirit?.power ?? 1), move, 'creature', c);
      foe.knock?.(v.clone().setLength(S.push * 0.4).setY(move === 'lunge' ? 2 : 0.5));
      g.events?.emit('jelly.brawl', { move, by: 'creature' });
    }
  }

  updateGlobs(dt) {
    const g = this.game, P = g.player;
    for (let i = this.globs.length - 1; i >= 0; i--) {
      const q = this.globs[i]; q.t += dt;
      q.v.y -= 9.81 * dt;
      const from = q.m.position.clone(); q.m.position.addScaledVector(q.v, dt);
      const step = q.m.position.clone().sub(from), len = step.length();
      const hitP = len > 1e-4 ? g.physics.raycast(from, step.normalize(), len, null, undefined, (k) => !k.isSensor() && !g.physics.entityOf(k)?.type) : null;
      const foe = q.foe, F = foe ? (foe === P ? _a.copy(P.pos).setY(P.pos.y + 0.9) : foe.center?.(_a) ?? _a.copy(foe.pos)) : null;
      const nearF = !!(F && foe.alive !== false && q.m.position.distanceTo(F) < JELLY.spit.hit);
      if (hitP || nearF || q.t > 4) {
        const at = hitP ? hitP.point : q.m.position.clone(), n = hitP && hitP.normal.lengthSq() > 0.5 ? hitP.normal : UP;
        if (hitP) g.shells?.addSplat?.(at, n, 1.2, true);
        g.slip?.addDisc(at, n, 0.8, 14);
        sfx.jellySquelch(g.listenerDistance(at), 0.8);
        if (nearF && q.c.alive) this.strike(q.c, foe, 'spit');
        g.scene.remove(q.m); this.globs.splice(i, 1);
      }
    }
  }

  // ---------------------------------------------------------------- the small things the mind asks for
  /** A wet cry and a hop: kin within earshot learn what it has seen (an 'alarm' stimulus about `about`). */
  call(c, about = null) {
    const g = this.game;
    c.deform.kick(6, null, 0.2);
    if (!c.air) { c.vy = 3.2; c.air = true; }
    sfx.jellySquelch(g.listenerDistance(c.pos), 1.25);
    g.glyphs?.pop('bang1', this.head(c), { color: 0xffd76a, size: 0.55, life: 1.0, follow: () => this.head(c) });
    g.ai?.stimuli.emit('alarm', c.pos, { radius: 26, strength: 1, source: c, about, aboutPos: about?.pos });
  }
  /** Something eaten: drawn into it with a gulp. */
  gulp(c, at, big = false) {
    const g = this.game;
    c.deform.kick(big ? -5 : -3, null, big ? 0.25 : 0.15);
    sfx.gulp?.(g.listenerDistance(c.pos));
    g.fx?.absorbSparkle?.(at.clone());
  }

  pose(c, dt, dtk) {
    const D = c.deform;
    if (dtk > 0) {
      // the body leans against its acceleration (the top lags), in its own frame
      const ax = (c.vel.x - (c.lvx ?? c.vel.x)) / Math.max(1e-4, dtk), az = (c.vel.z - (c.lvz ?? c.vel.z)) / Math.max(1e-4, dtk);
      c.lvx = c.vel.x; c.lvz = c.vel.z;
      const cy = Math.cos(-c.yaw), sy = Math.sin(-c.yaw);
      _acc.set(ax * cy - az * sy, ax * sy + az * cy).clampLength(0, 40);
      const sp = Math.hypot(c.vel.x, c.vel.z), t = performance.now() / 1000;
      if (c.attack?.phase !== 'wind') {
        // its pose: what its mind (or a status) says it is doing, as where the squash spring rests
        const stun = st(c, 'stun') > 0;
        const base = st(c, 'melt') ? 0.22 : stun ? 0.86 + 0.04 * Math.sin(t * 6) : st(c, 'sleep') ? 0.78 + 0.03 * Math.sin(t * 1.3) : ({ soak: 0.72, rest: 0.84, sleep: 0.78, mourn: 0.8, watch: 1.06, eat: 0.9 })[c.pose] ?? 1;
        const breathe = c.pose === 'idle' || c.pose === 'walk' ? 0.025 * Math.sin(t * 2.2 + c.home.x) - Math.min(0.06, sp * 0.02) : 0;
        D.target.squash = c.air ? 1.0 + Math.min(0.25, Math.abs(c.vy) * 0.03) : base + breathe;
        D.target.lean.set(stun ? 0.12 * Math.sin(t * 3.1) : 0, stun ? 0.12 * Math.cos(t * 2.6) : 0); // (stunned: it sways)
      }
      // the toes walk while it moves, and the whole of it ripples, more the faster it goes
      D.feet = THREE.MathUtils.damp(D.feet, c.air ? 0 : Math.min(1, sp / 2.2), 6, dtk);
      if (sp > 0.3) D.wob = Math.max(D.wob, 0.03 + sp * 0.012);
      D.wet = THREE.MathUtils.damp(D.wet, 1 - c.drives.get('thirst') * 0.85, 1.5, dtk);
      D.update(dtk, _acc);
    }
    c.root.position.copy(c.pos);
    c.root.rotation.y = c.yaw;
    // colour: a flash when struck, cold and pale when halted
    c.flash = Math.max(0, c.flash - dt * 4);
    const cold = st(c, 'halt') ? 1 : 0;
    c.mat.emissive.setRGB(c.flash * 0.6 + cold * 0.05, c.flash * 0.5 + cold * 0.15, c.flash * 0.4 + cold * 0.3);
    c.mat.color.setHex(COL).lerp(COLD, cold * 0.6);
  }

  reform(c) {
    const g = this.game;
    c.alive = true; c.hp = JELLY.hp; c.air = false; c.vel.set(0, 0, 0); c.attack = null; c.dying = null;
    c.pos.copy(c.home); c.root.visible = true; c.col.setEnabled(true);
    c.deform.sq = 0.1; c.deform.sqV = 0; c.deform.target.squash = 1; c.deform.kick(2, null, 0.3);
    c.rb.setTranslation({ x: c.pos.x, y: c.pos.y + H * 0.5, z: c.pos.z }, true);
    c.mem.wipe(); c.drives.set('fear', 0); c.drives.set('thirst', 0.1); c.rel.clear(); c.macro = null;
    c.brain.decide(); // (it has a mind again from its first moment)
    g.events?.emit('jelly.reform', {});
  }

  /** Is any of them after the Courier just now (the battle music: main.js)? */
  hunting(maxD = 24) {
    const P = this.game.player;
    return this.list.some((c) => c.alive && c.brain.action?.hunt && c.foe === P && Math.hypot(c.pos.x - P.pos.x, c.pos.z - P.pos.z) < maxD);
  }
}

// What the Veritome's reprogramming may write into a slip jelly (veritome/reprogram.js reads these): its macros.
export const JELLY_MACROS = ['halt', 'sleep', 'calm', 'forget', 'home', 'soften', 'melt', 'kin', 'fetch', 'turn'];
