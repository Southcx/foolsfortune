// ---------------------------------------------------------------------------------------
// THE SLIP JELLY: the first creature that fights back. A mind jelly (the maker's model, Figment_MindJelly: an egg of translucent
// Lachryma over a skirt of four toes) that lives in the dunes past the Weir. It glides on its own slip, leaving a wet trail you can
// dive into (the Slip dive), notices the Courier, closes in, and attacks with two moves whose wind-ups are its whole body:
//   LUNGE   it sinks down and quivers (0.8 s, a rising swell), then throws itself in an arc at where she stands; landing near her
//           knocks her flat back and spills a pool of slip
//   SPIT    it leans back and swells (0.6 s), then lobs a glob of slip that splashes where it lands
// A blow dents it where it lands and sets it wobbling; enough of them and it bursts into droplets, a pool of slip and a scatter of
// Lachryma cubes, and forms again from a puddle at its home a while later. It has no bones: it is moved by springs (deform.js).
//
// It obeys the statuses every creature carries (creatures.js): halted it freezes in place, tinted cold; slowed, everything it does
// takes longer; asleep it slumps and breathes; made to forget, it wanders off; made to flee, it slides away; calmed, it follows but
// never strikes; softened, it takes double; melted, it is a harmless puddle until the melt runs out. A wind-up can be CANCELLED.
// These are what the Veritome's Flash lets the Courier type into it (veritome/flash.js).
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

const H = 1.5, R = 0.5;
const COL = 0x9d72ff, CORE = 0xfff0fb, COLD = new THREE.Color(0.65, 0.9, 1);
export const JELLY = {
  hp: 8, sight: 15, leash: 26, speed: 2.1, wander: 0.7, keep: 4.2,
  lunge: { wind: 0.8, reach: 8, flight: 0.8, hit: 1.4, push: 8, lift: 4.5, drain: 8, cd: [2.2, 3.4] },
  spit: { wind: 0.6, min: 4.5, max: 13, speed: 11, cd: [2.6, 3.8], hit: 0.9, push: 5 },
  respawn: 40, trailEvery: 0.35,
};
const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _acc = new THREE.Vector2();
const rnd = (a, b) => a + Math.random() * (b - a);

export class SlipJellies {
  constructor(game, gltf) {
    this.game = game;
    this.geo = null;
    // (the mesh as it stands in the file, its node's turn and scale baked in: the shader reads heights in metres)
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => { if (o.isMesh && !this.geo) { this.geo = o.geometry.clone().applyMatrix4(o.matrixWorld); this.geo.computeVertexNormals(); } });
    this.trail = new PaintPath(game.scene, { wet: 0xd9c8ff, dry: 0x8f78c8, life: 18, max: 500 });
    this.globs = [];
    this.globGeo = new THREE.IcosahedronGeometry(0.16, 1);
    this.globMat = new THREE.MeshStandardMaterial({ color: COL, roughness: 0.2, emissive: 0x2a1458, transparent: true, opacity: 0.85 });
    this.list = [];
  }

  spawn(home, { yaw = Math.random() * 6.28 } = {}) {
    const g = this.game;
    const mat = new THREE.MeshStandardMaterial({ color: COL, roughness: 0.16, metalness: 0, transparent: true, opacity: 0.88, emissive: 0x3b1a7a, emissiveIntensity: 1 });
    addRim(mat, 1.2);
    const deform = new JellyDeform(mat, H);
    const root = new THREE.Group();
    const body = new THREE.Mesh(this.geo, mat);
    body.castShadow = true; body.renderOrder = 2;
    // the mind inside: a soft light that shows through, and moves with the body's middle
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), new THREE.MeshBasicMaterial({ color: CORE, transparent: true, opacity: 0.95 }));
    core.position.y = H * 0.55;
    root.add(body, core);
    root.position.copy(home); root.rotation.y = yaw;
    g.scene.add(root);
    const w = g.physics.world;
    const rb = w.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(home.x, home.y + H * 0.5, home.z));
    const col = w.createCollider(RAPIER.ColliderDesc.capsule(H * 0.5 - R * 0.85, R * 0.85).setCollisionGroups(groups(G.CRITTER, 0xffff)), rb);
    const c = {
      type: 'creature', kind: 'slipjelly', name: 'Slip Jelly', root, body, core, mat, deform, rb, col,
      home: home.clone(), pos: home.clone(), prevPos: home.clone(), vel: new THREE.Vector3(), vy: 0, yaw, radius: R, height: H,
      alive: true, hp: JELLY.hp, state: 'idle', t: rnd(0.5, 2), cd: rnd(1, 2), aggro: false, target: null, air: false,
      groundY: null, groundT: 0, trailT: 0, hurtT: 0, flash: 0, deadT: 0, lastHitBy: null, spawned: 0, verbs: JELLY_VERBS,
      center: (out) => out.copy(c.pos).setY(c.pos.y + H * 0.55),
      hurt: (p, dir, power, cause, by) => this.hurt(c, p, dir, power, cause, by),
      cancel: (why) => this.cancel(c, why),
      knock: (v) => { c.vel.add(_a.copy(v).setY(0)); if (v.y > 1) { c.vy = v.y; c.air = true; } },
      onStatus: (name) => this.onStatus(c, name), onStatusEnd: (name) => this.onStatusEnd(c, name),
    };
    tag(c, 'hurtable', 'programmable', 'creature');
    g.physics.register(col, c);
    g.creatures.add(c);
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
  playerNear(c) {
    const P = this.game.player.pos;
    return Math.hypot(P.x - c.pos.x, P.z - c.pos.z);
  }

  // ---------------------------------------------------------------- blows
  hurt(c, p, dir, power, cause, by) {
    const g = this.game;
    if (!c.alive || c.state === 'reform') return;
    if (st(c, 'sleep')) g.creatures.clearStatus(c, 'sleep');
    const dmg = power * (st(c, 'melt') ? 1.5 : 1);
    c.hp -= dmg; c.lastHitBy = by; c.hurtT = 0.35; c.flash = 1;
    // where it was struck, dented; the whole of it set wobbling and leaning away
    const local = c.root.worldToLocal(_a.copy(p));
    c.deform.dent(local, 0.12 + 0.08 * Math.min(2, power));
    const away = _b.copy(dir).setY(0); if (away.lengthSq() < 1e-4) away.set(0, 0, 1); away.normalize();
    const lean = new THREE.Vector2(away.x, away.z).rotateAround(new THREE.Vector2(), c.root.rotation.y);
    c.deform.kick(-1.6 * power, lean.multiplyScalar(2.4 * power), 0.12 + 0.05 * power);
    if (!st(c, 'halt') && !st(c, 'melt')) c.vel.addScaledVector(away, 2.2 * power);
    if (c.state === 'wind' && power >= 1.5) this.cancel(c, 'staggered'); // (a heavy blow breaks a wind-up)
    if (by === 'courier' && !st(c, 'forget')) c.aggro = true;
    sfx.jellySquelch(g.listenerDistance(c.pos), Math.min(1.5, 0.7 + power * 0.3));
    g.fx?.impact?.(_c.copy(p), _a.copy(dir).negate(), { sparks: 0, dust: 3 });
    g.events?.emit('jelly.hit', { cause, by, hp: Math.max(0, +c.hp.toFixed(1)) });
    if (c.hp <= 0) this.burst(c, dir, by, cause);
  }

  burst(c, dir, by, cause) {
    const g = this.game;
    c.alive = false; c.state = 'dead'; c.deadT = 0;
    c.root.visible = false;
    c.col.setEnabled(false);
    const at = c.pos.clone().setY(c.pos.y + 0.6);
    sfx.jellyPop(g.listenerDistance(at));
    for (let i = 0; i < 14; i++) {
      const v = new THREE.Vector3(rnd(-1, 1), rnd(0.6, 1.4), rnd(-1, 1)).normalize().multiplyScalar(rnd(3, 6)).addScaledVector(dir, 1.5);
      g.shells?.addDroplet?.(at.clone(), v, rnd(0.05, 0.1), true);
    }
    g.shells?.addSplat?.(c.pos.clone().setY(c.pos.y + 0.02), UP, 2.6, true);
    g.slip?.addDisc(c.pos.clone(), UP, 1.6, 20);
    if (by === 'courier') g.cubes?.burst?.(at, 6, { count: 4, up: 4, from: 'jelly' });
    g.glyphs?.pop('star', at.clone().setY(at.y + 0.4), { color: 0xd9c8ff, size: 0.5, life: 0.9, burst: true });
    g.events?.emit('jelly.burst', { by, cause });
    g.creatures.status && c.status.clear();
  }

  cancel(c, why = 'cancelled') {
    const g = this.game;
    if (c.state !== 'wind') return false;
    c.state = 'recover'; c.t = 0.9; c.cd = rnd(1.4, 2.2); c.deform.target.squash = 1; c.deform.kick(3, null, 0.2);
    g.glyphs?.pop('ask', this.head(c), { color: 0xd9c8ff, size: 0.45, life: 0.9, follow: () => this.head(c) });
    g.events?.emit('jelly.cancel', { why });
    return true;
  }
  head(c) { return new THREE.Vector3(c.pos.x, c.pos.y + H * c.deform.sq + 0.35, c.pos.z); }

  onStatus(c, name) {
    const g = this.game, d = c.deform;
    if (name === 'halt') d.freeze();
    if (name === 'sleep') { if (c.state === 'wind') this.cancel(c, 'asleep'); c.state = 'sleep'; g.glyphs?.pop('dots', this.head(c), { color: 0xd9c8ff, size: 0.5, life: 1.4 }); }
    if (name === 'forget' || name === 'flee') { c.aggro = name === 'flee'; if (c.state === 'wind') this.cancel(c, name); }
    if (name === 'melt') { if (c.state === 'wind') this.cancel(c, 'melted'); c.state = 'melt'; d.target.squash = 0.22; d.kick(-2, null, 0.3); }
    if (name === 'calm' && c.state === 'wind') this.cancel(c, 'calmed');
  }
  onStatusEnd(c, name) {
    if (name === 'sleep' && c.state === 'sleep') { c.state = 'idle'; c.t = 0.6; c.deform.kick(4, null, 0.2); }
    if (name === 'melt' && c.state === 'melt') { c.state = 'idle'; c.t = 0.8; c.deform.target.squash = 1; c.deform.kick(5, null, 0.25); }
  }

  // ---------------------------------------------------------------- per frame
  update(dt) {
    const g = this.game, P = g.player;
    for (const c of this.list) {
      if (!c.alive) {
        c.deadT += dt;
        if (c.deadT > JELLY.respawn && Math.hypot(P.pos.x - c.home.x, P.pos.z - c.home.z) > 10) this.reform(c);
        continue;
      }
      // (far from the Courier, it sleeps where it is: nothing to think about, nothing to draw)
      const far = Math.abs(P.pos.x - c.pos.x) > 140 || Math.abs(P.pos.z - c.pos.z) > 140 || Math.abs(P.pos.y - c.pos.y) > 60;
      if (far) continue;
      if (c.groundY == null) { const y = this.ground(c, c.pos.x, c.pos.z); if (y == null) continue; c.groundY = y; c.pos.y = y; c.home.y = y; }
      const halt = st(c, 'halt'), slow = st(c, 'slow');
      const k = halt ? 0 : slow ? 0.35 : 1, dtk = dt * k;
      c.prevPos.copy(c.pos);
      if (dtk > 0) this.think(c, dtk);
      this.move(c, dtk);
      this.pose(c, dt, dtk);
    }
    this.updateGlobs(dt);
    this.trail.update(dt);
  }

  think(c, dt) {
    const g = this.game, P = g.player.pos, d = this.playerNear(c), D = c.deform;
    c.t -= dt; c.cd -= dt;
    const fromHome = Math.hypot(c.pos.x - c.home.x, c.pos.z - c.home.z);
    const forget = st(c, 'forget'), flee = st(c, 'flee'), calm = st(c, 'calm');
    // noticing: in sight, near enough, and not made to forget
    if (!c.aggro && !forget && d < JELLY.sight && Math.abs(P.y - c.pos.y) < 6 && !g.god?.active) {
      c.aggro = true;
      g.glyphs?.pop('bang1', this.head(c), { color: 0xffd76a, size: 0.55, life: 1.0, follow: () => this.head(c) });
      D.kick(4, null, 0.15); sfx.jellySquelch(g.listenerDistance(c.pos), 0.6);
      g.events?.emit('jelly.notice', {});
    }
    if (c.aggro && (forget || fromHome > JELLY.leash || d > JELLY.sight * 1.8) && !flee) { c.aggro = false; c.state = 'return'; }
    const want = _a.set(0, 0, 0);
    switch (c.state) {
      case 'sleep': case 'melt': break;
      case 'idle': case 'wander': case 'return': {
        if (c.aggro && !flee) { c.state = 'chase'; break; }
        if (flee) { want.set(c.pos.x - P.x, 0, c.pos.z - P.z).setLength(JELLY.speed * 1.2); break; }
        if (c.state === 'return' && fromHome < 1.5) c.state = 'idle';
        if (c.state === 'return') { want.set(c.home.x - c.pos.x, 0, c.home.z - c.pos.z).setLength(JELLY.speed * 0.8); break; }
        if (c.t <= 0) {
          if (c.state === 'idle') { c.state = 'wander'; c.t = rnd(2, 4); const a = rnd(0, 6.28), r = rnd(1, 7); c.target = new THREE.Vector3(c.home.x + Math.cos(a) * r, 0, c.home.z + Math.sin(a) * r); }
          else { c.state = 'idle'; c.t = rnd(2, 5); c.target = null; }
        }
        if (c.state === 'wander' && c.target) { want.set(c.target.x - c.pos.x, 0, c.target.z - c.pos.z); if (want.length() < 0.5) c.t = 0; else want.setLength(JELLY.wander); }
        break;
      }
      case 'chase': {
        if (!c.aggro) { c.state = 'return'; break; }
        if (flee) { c.state = 'idle'; break; }
        const to = _b.set(P.x - c.pos.x, 0, P.z - c.pos.z), dist = to.length();
        if (dist > JELLY.keep) want.copy(to).setLength(JELLY.speed);
        else if (dist < JELLY.keep - 1.2) want.copy(to).setLength(-JELLY.speed * 0.5);
        // circling a little while it waits for its moment
        want.addScaledVector(_c.set(-to.z, 0, to.x).normalize(), 0.6 * Math.sin(g.time?.now?.() ?? performance.now() / 1000));
        if (c.cd <= 0 && !calm) {
          if (dist < JELLY.lunge.reach) this.windUp(c, 'lunge');
          else if (dist > JELLY.spit.min && dist < JELLY.spit.max) this.windUp(c, 'spit');
        }
        break;
      }
      case 'wind': {
        D.target.squash = c.move === 'lunge' ? 0.62 : 1.12;
        D.target.lean.set(0, c.move === 'spit' ? -0.18 : 0);
        D.wob = Math.max(D.wob, 0.05); // (the quiver)
        if (c.t <= 0) this.release(c);
        break;
      }
      case 'recover': if (c.t <= 0) { c.state = c.aggro ? 'chase' : 'idle'; c.t = rnd(1, 3); } break;
    }
    // face where it goes, or the Courier when it means her
    const face = c.state === 'chase' || c.state === 'wind' ? _c.set(P.x - c.pos.x, 0, P.z - c.pos.z) : want;
    if (face.lengthSq() > 1e-3) {
      const yaw = Math.atan2(face.x, face.z);
      let dy = yaw - c.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      c.yaw += dy * Math.min(1, dt * (c.state === 'wind' ? 8 : 4));
    }
    if (!c.air) {
      const ax = (want.x - c.vel.x), az = (want.z - c.vel.z);
      c.vel.x += ax * Math.min(1, dt * 3); c.vel.z += az * Math.min(1, dt * 3);
    }
  }

  windUp(c, move) {
    const g = this.game, W = JELLY[move];
    c.state = 'wind'; c.move = move; c.t = W.wind; c.vel.multiplyScalar(0.2);
    sfx.jellyWind(g.listenerDistance(c.pos), W.wind * (st(c, 'slow') ? 2.8 : 1));
    g.events?.emit('jelly.wind', { move });
  }

  release(c) {
    const g = this.game, P = g.player.pos, D = c.deform;
    D.target.squash = 1; D.target.lean.set(0, 0);
    if (c.move === 'lunge') {
      const L = JELLY.lunge, to = _a.set(P.x - c.pos.x, 0, P.z - c.pos.z), dist = Math.min(L.reach, to.length());
      to.setLength(dist / L.flight);
      c.vel.copy(to); c.vy = 9.81 * L.flight * 0.5; c.air = true; c.lunging = true; // (an arc that comes down where she stood)
      D.kick(7, null, 0.1);
    } else {
      const S = JELLY.spit, from = this.head(c).setY(c.pos.y + H * 0.8), aim = _a.copy(P).setY(P.y + 0.9);
      const flat = Math.hypot(aim.x - from.x, aim.z - from.z), tFlight = flat / S.speed;
      const v = new THREE.Vector3(aim.x - from.x, 0, aim.z - from.z).setLength(S.speed);
      v.y = (aim.y - from.y) / tFlight + 0.5 * 9.81 * tFlight;
      const m = new THREE.Mesh(this.globGeo, this.globMat); m.position.copy(from); g.scene.add(m);
      this.globs.push({ m, v, t: 0 });
      D.kick(5, new THREE.Vector2(0, 1.5), 0.15);
      sfx.jellySquelch(g.listenerDistance(c.pos), 0.9);
    }
    c.state = 'recover'; c.t = 0.7; c.cd = rnd(...JELLY[c.move].cd);
    g.events?.emit('jelly.attack', { move: c.move });
  }

  move(c, dt) {
    const g = this.game, P = g.player;
    if (st(c, 'melt') || st(c, 'sleep')) c.vel.multiplyScalar(Math.max(0, 1 - dt * 6));
    if (c.state === 'wind') c.vel.multiplyScalar(Math.max(0, 1 - dt * 8));
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
      // (on the way, it can hit her bodily: a lunge she did not step out of)
      else if (c.lunging && Math.hypot(P.pos.x - c.pos.x, P.pos.z - c.pos.z) < 0.9 && Math.abs(P.pos.y + 0.9 - (c.pos.y + H * 0.5)) < 1.2 && !(P.invuln > 0) && !st(c, 'calm')) {
        c.lunging = false; const L = JELLY.lunge; this.strikeCourier(c, L.push, L.lift, L.drain, 'lunge');
      }
    } else {
      c.pos.y += (c.groundY - c.pos.y) * Math.min(1, dt * 12);
      if (!c.air) c.vel.multiplyScalar(Math.max(0, 1 - dt * 1.2));
    }
    // its slip, laid as it glides
    c.trailT -= dt;
    if (!c.air && c.trailT <= 0 && c.vel.lengthSq() > 0.15) {
      c.trailT = JELLY.trailEvery;
      const at = _a.set(c.pos.x, c.groundY + 0.015, c.pos.z);
      this.trail.add(at, UP, _b.copy(c.vel).normalize(), 0.7);
      g.slip?.addDisc(at, UP, 0.42, 14, 0.4);
    } else if (c.vel.lengthSq() <= 0.15) this.trail.gap();
    c.rb.setNextKinematicTranslation({ x: c.pos.x, y: c.pos.y + H * 0.5, z: c.pos.z });
    void P;
  }

  land(c) {
    const g = this.game, P = g.player;
    c.pos.y = c.groundY; c.vy = 0; c.air = false;
    c.deform.kick(-6, null, 0.25);
    c.vel.multiplyScalar(0.25);
    sfx.jellyLand(g.listenerDistance(c.pos));
    g.shells?.addSplat?.(c.pos.clone().setY(c.groundY + 0.02), UP, 1.4, true);
    g.slip?.addDisc(c.pos.clone(), UP, 0.9, 16);
    if (c.lunging) {
      c.lunging = false;
      const L = JELLY.lunge, d = Math.hypot(P.pos.x - c.pos.x, P.pos.z - c.pos.z);
      if (d < L.hit && Math.abs(P.pos.y - c.pos.y) < 1.6 && !(P.invuln > 0) && !st(c, 'calm')) this.strikeCourier(c, L.push, L.lift, L.drain, 'lunge');
    }
  }

  strikeCourier(c, push, lift, drain, move) {
    const g = this.game, P = g.player;
    const v = _a.set(P.pos.x - c.pos.x, 0, P.pos.z - c.pos.z); if (v.lengthSq() < 1e-4) v.set(0, 0, 1);
    v.setLength(push).setY(lift);
    P.impulse(v.clone(), 'jelly');
    P.shake = Math.max(P.shake || 0, 0.5);
    g.lachryma?.drain?.(drain, 'jelly');
    g.events?.emit('jelly.strike', { move, by: 'environment' });
  }

  updateGlobs(dt) {
    const g = this.game, P = g.player;
    for (let i = this.globs.length - 1; i >= 0; i--) {
      const q = this.globs[i]; q.t += dt;
      q.v.y -= 9.81 * dt;
      const from = q.m.position.clone(); q.m.position.addScaledVector(q.v, dt);
      const step = q.m.position.clone().sub(from), len = step.length();
      const hitP = len > 1e-4 ? g.physics.raycast(from, step.normalize(), len, null, undefined, (k) => !k.isSensor() && !g.physics.entityOf(k)?.type) : null;
      const nearP = q.m.position.distanceTo(_a.copy(P.pos).setY(P.pos.y + 0.9)) < JELLY.spit.hit;
      if (hitP || nearP || q.t > 4) {
        const at = hitP ? hitP.point : q.m.position.clone();
        g.shells?.addSplat?.(at, hitP ? hitP.normal : UP, 1.2, true);
        g.slip?.addDisc(at, hitP ? hitP.normal : UP, 0.8, 14);
        sfx.jellySquelch(g.listenerDistance(at), 0.8);
        if (nearP && !(P.invuln > 0)) this.strikeCourier({ pos: _b.copy(at).setY(P.pos.y) }, JELLY.spit.push, 2, 4, 'spit');
        g.scene.remove(q.m); this.globs.splice(i, 1);
      }
    }
  }

  pose(c, dt, dtk) {
    const D = c.deform;
    if (dtk > 0) {
      // the body leans against its acceleration (the top lags), in its own frame
      const ax = (c.vel.x - (c.lvx ?? c.vel.x)) / Math.max(1e-4, dtk), az = (c.vel.z - (c.lvz ?? c.vel.z)) / Math.max(1e-4, dtk);
      c.lvx = c.vel.x; c.lvz = c.vel.z;
      const cy = Math.cos(-c.yaw), sy = Math.sin(-c.yaw);
      _acc.set(ax * cy - az * sy, ax * sy + az * cy).clampLength(0, 40);
      // breathing at rest, a glide's ripple when moving, a deep slump asleep, and a stretch in the air
      const sp = Math.hypot(c.vel.x, c.vel.z), t = performance.now() / 1000;
      if (c.state !== 'wind' && c.state !== 'melt') D.target.squash = c.state === 'sleep' ? 0.78 + 0.03 * Math.sin(t * 1.3) : c.air ? 1.0 + Math.min(0.25, Math.abs(c.vy) * 0.03) : 1 + 0.025 * Math.sin(t * 2.2 + c.home.x) - Math.min(0.06, sp * 0.02);
      if (sp > 0.3) D.wob = Math.max(D.wob, 0.02 + sp * 0.006);
      D.update(dtk, _acc);
    }
    c.root.position.copy(c.pos);
    c.root.rotation.y = c.yaw;
    // the mind rides in the body's middle: it sinks when it is squashed
    c.core.position.set(D.lean.x * 0.3, H * 0.55 * D.sq, D.lean.y * 0.3);
    c.core.scale.setScalar(1 + 0.1 * Math.sin(performance.now() / 300));
    // colour: a flash when struck, cold and pale when halted, dim asleep
    c.flash = Math.max(0, c.flash - dt * 4);
    const halt = st(c, 'halt'), cold = halt ? 1 : 0, dim = c.state === 'sleep' ? 0.5 : 1;
    c.mat.emissive.setRGB(0.16 * dim + c.flash * 0.9 + cold * 0.1, 0.08 * dim + c.flash * 0.8 + cold * 0.3, 0.34 * dim + c.flash * 0.9 + cold * 0.5);
    c.mat.color.setHex(COL).lerp(COLD, cold * 0.6);
    c.core.material.color.setHex(CORE).multiplyScalar(dim);
  }

  reform(c) {
    const g = this.game;
    c.alive = true; c.hp = JELLY.hp; c.state = 'idle'; c.t = 1; c.aggro = false; c.air = false; c.vel.set(0, 0, 0);
    c.pos.copy(c.home); c.root.visible = true; c.col.setEnabled(true);
    c.deform.sq = 0.1; c.deform.sqV = 0; c.deform.target.squash = 1; c.deform.kick(2, null, 0.3);
    c.rb.setTranslation({ x: c.pos.x, y: c.pos.y + H * 0.5, z: c.pos.z }, true);
    g.events?.emit('jelly.reform', {});
  }
}

// What the Veritome's Flash may type into a slip jelly (veritome/flash.js reads these): the verbs it answers to.
export const JELLY_VERBS = ['halt', 'slow', 'sleep', 'forget', 'flee', 'soft', 'calm', 'melt', 'cancel'];
