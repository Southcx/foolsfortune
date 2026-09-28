import * as THREE from 'three';
import { RAPIER, GROUPS } from './physics.js';
import { T, DEG, PALETTE } from './config.js';
import { planeFrom } from './slicing.js';
import { makeGlowOutline, addOutline } from './outline.js';
import { sfx } from './audio.js';

// ---------------------------------------------------------------------------
// Shells: special rounds for the psygun, fired with F / middle mouse.
//   slicer  – a planar blade along the shot; cuts pots, shards, crates in two
//   push    – a cone of force from the muzzle
//   well    – a lobbed singularity that drags everything in, then pops
//   mark    – stuns critters and marks things (marked things drop Lachryma)
//   bomb    – a lobbed clay grenade: splash damage, molten slip, hot pool
// ---------------------------------------------------------------------------
export const SHELL_TYPES = [
  { id: 'slicer', name: 'SLICE', glyph: '╱' },
  { id: 'push', name: 'PUSH', glyph: '⟫' },
  { id: 'well', name: 'WELL', glyph: '◉' },
  { id: 'mark', name: 'MARK', glyph: '✳' },
  { id: 'bomb', name: 'BOMB', glyph: '●' },
];

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
// molten slip: starts glowing orange, cools through terracotta to dark clay
const HOT = new THREE.Color(0xffa25a), GLOW = new THREE.Color(0xe0673a), COOL = new THREE.Color(PALETTE.dark);
const SLIP = new THREE.Color(PALETTE.pale), SLIP_DRY = new THREE.Color(PALETTE.mid);

function blobTexture(seed) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(64, 64, 34, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2, r = 24 + rnd() * 30, rr = 5 + rnd() * 14;
    g.beginPath(); g.arc(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, rr, 0, Math.PI * 2); g.fill();
  }
  // soften: blur the hard-edged blob into a second canvas, then use luminance as alpha
  const c2 = document.createElement('canvas');
  c2.width = c2.height = 128;
  const g2 = c2.getContext('2d');
  g2.filter = 'blur(5px)';
  g2.drawImage(c, 0, 0);
  const d = g2.getImageData(0, 0, 128, 128);
  for (let i = 0; i < d.data.length; i += 4) {
    const a = d.data[i] / 255;
    d.data[i + 3] = Math.round(255 * THREE.MathUtils.smoothstep(a, 0.25, 0.75));
    d.data[i] = d.data[i + 1] = d.data[i + 2] = 255;
  }
  g2.putImageData(d, 0, 0);
  return new THREE.CanvasTexture(c2);
}

export class Shells {
  constructor(game) {
    this.game = game;
    this.selected = 0;
    this.counts = Object.fromEntries(SHELL_TYPES.map((t) => [t.id, T.shells.start]));
    this.bladeIdx = 0;
    this.projectiles = [];
    this.wells = [];
    this.droplets = [];
    this.splats = [];
    this.pools = [];
    this.marked = new Set();
    this.blobTex = [0, 1, 2, 3].map(blobTexture);
    this.glowOutline = makeGlowOutline(PALETTE.hot, 0.014);
    this.xray = makeGlowOutline(PALETTE.glow, 0.004, true);

    // instanced molten droplets
    const dg = new THREE.IcosahedronGeometry(1, 1);
    this.dropMesh = new THREE.InstancedMesh(dg, new THREE.MeshBasicMaterial({ color: 0xffffff }), 400);
    this.dropMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.dropMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(400 * 3), 3);
    this.dropMesh.count = 0;
    this.dropMesh.frustumCulled = false;
    game.scene.add(this.dropMesh);
  }

  get type() { return SHELL_TYPES[this.selected]; }
  select(i) {
    if (i < 0 || i >= SHELL_TYPES.length || i === this.selected) return;
    this.selected = i;
    sfx.click();
  }
  cycle(d) { this.select((this.selected + d + SHELL_TYPES.length) % SHELL_TYPES.length); }
  refill(n = T.shells.refill) {
    let got = 0;
    for (const t of SHELL_TYPES) {
      const before = this.counts[t.id];
      this.counts[t.id] = Math.min(T.shells.max, before + n);
      got += this.counts[t.id] - before;
    }
    return got;
  }

  /** Fire the selected shell. Returns false if the tube is empty. */
  fire(ctx) {
    const t = this.type;
    if (this.counts[t.id] <= 0) { sfx.dryFire(); this.game.hud.popup(`NO ${t.name} SHELLS`); return false; }
    this.counts[t.id]--;
    const { camera, player, character, weapon } = ctx;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const ray = weapon.shotRay(camera, player, character, fwd);
    const muzzle = character.gunPoint('muzzle', new THREE.Vector3());
    this[t.id]({ ...ctx, ray, muzzle, fwd });
    // every shell kicks hard and needs racking
    const k = T.shells.kick * THREE.MathUtils.lerp(1, T.recoil.adsMult, weapon.adsEase);
    player.addRecoil(T.recoil.kickPitch * k, (Math.random() * 2 - 1) * T.recoil.kickYaw * k);
    player.fovPunch = 4;
    weapon.kickV += 1.5 * T.recoil.gunRecoverSpeed * Math.E;
    this.game.fx.muzzleFlash(muzzle, new THREE.Vector3(1, 0, 0).applyQuaternion(character.gun.quaternion));
    weapon.ejectShell(character, player);
    weapon.startRack();
    return true;
  }

  // ---- pierce helper -------------------------------------------------------
  pierce(origin, dir, max, onEnt) {
    const g = this.game, skip = new Set();
    let end = null, normal = UP.clone();
    for (let i = 0; i <= max; i++) {
      const hit = g.physics.raycast(origin, dir, T.weapon.range, g.player.collider, undefined, (c) => !skip.has(c.handle));
      if (!hit) break;
      skip.add(hit.collider.handle);
      end = hit.point; normal = hit.normal;
      const ent = hit.entity;
      const body = hit.collider.parent();
      const solid = !ent || ent.type === 'player' || (!body?.isDynamic() && !['breakable', 'clapper', 'rope'].includes(ent.type));
      if (solid) break;
      if (onEnt(ent, hit, skip) === false) break;
    }
    return { end: end || origin.clone().addScaledVector(dir, T.weapon.range), normal };
  }

  // ---- SLICER --------------------------------------------------------------
  slicer({ camera, ray, muzzle }) {
    const g = this.game;
    const angles = [0, 90, 45, -45];
    const ang = angles[this.bladeIdx++ % angles.length] * DEG;
    const fwd = ray.dir;
    const blade = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).applyAxisAngle(fwd, ang);
    const plane = planeFrom(new THREE.Vector3().crossVectors(fwd, blade), ray.origin);
    let cuts = 0;
    const { end } = this.pierce(ray.origin, fwd, T.shells.slicer.pierce, (ent, hit, skip) => {
      if (ent.type === 'clapper') { g.clappers.hit(ent, hit.point, fwd, 1.2, 'sliced'); cuts++; return; }
      if (ent.type === 'rope') { g.breakables.cutRope(ent.rope, ent.index, hit.point, fwd); return; }
      const pieces = g.breakables.slice(ent, plane, fwd);
      if (pieces) { cuts++; for (const pc of pieces) skip.add(pc.body.collider(0).handle); } // don't re-cut this shot's own halves
    });
    g.fx.slash(muzzle, end, blade);
    sfx.slice();
    if (cuts) { g.hud.hitmarker(true); if (cuts >= 3) g.hud.popup(`×${cuts} SLICED`); }
    g.clappers?.spook(end);
  }

  // ---- PUSH ----------------------------------------------------------------
  push({ ray, muzzle, player }) {
    const g = this.game, P = T.shells.push;
    const origin = ray.origin, axis = ray.dir;
    const cosA = Math.cos(P.angle * DEG);
    const shove = (body, strength = 1) => {
      const t = body.translation();
      _v.set(t.x - origin.x, t.y - origin.y, t.z - origin.z);
      const d = _v.length();
      if (d > P.range || d < 0.05) return;
      _v.divideScalar(d);
      if (_v.dot(axis) < cosA) return;
      const k = P.velocity * Math.pow(1 - d / P.range, 0.6) * strength;
      const dir = _v.multiplyScalar(0.55).addScaledVector(axis, 0.45).normalize();
      const m = body.mass();
      g.physics.kick(body, { x: dir.x * k * m, y: (dir.y * k + k * 0.18) * m, z: dir.z * k * m });
      body.applyTorqueImpulse({ x: (Math.random() - 0.5) * m * k * 0.1, y: 0, z: (Math.random() - 0.5) * m * k * 0.1 }, true);
    };
    g.physics.world.forEachRigidBody((b) => { if (b.isDynamic()) shove(b); });
    for (const c of g.clappers.list) {
      _v.subVectors(c.pos, origin);
      const d = _v.length();
      if (d < P.range && _v.normalize().dot(axis) > cosA) g.clappers.knock(c, _v.clone().setY(0.4).normalize().multiplyScalar(P.velocity * 0.8 * (1 - d / P.range)));
    }
    player.vel.addScaledVector(axis, -P.selfKnock);
    g.fx.pushWave(muzzle, axis, P.range, P.angle);
    sfx.push();
  }

  // ---- projectiles (well + bomb) ---------------------------------------------
  launch(kind, from, dir, speed, lift) {
    const g = this.game;
    const mesh = kind === 'well'
      ? new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), new THREE.MeshBasicMaterial({ color: 0x1c0d08 }))
      : new THREE.Mesh(new THREE.DodecahedronGeometry(0.09, 0), new THREE.MeshStandardMaterial({ color: PALETTE.dark, flatShading: true, emissive: PALETTE.glow, emissiveIntensity: 0.3 }));
    if (kind === 'well') {
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: g.fx.haloTexture, color: PALETTE.glow, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.scale.setScalar(0.7);
      mesh.add(halo);
    } else addOutline(mesh);
    mesh.position.copy(from);
    g.scene.add(mesh);
    const vel = dir.clone().multiplyScalar(speed).addScaledVector(UP, lift);
    this.projectiles.push({ kind, mesh, pos: from.clone(), prev: from.clone(), vel, age: 0, bounces: 0 });
  }

  well({ ray, muzzle }) {
    this.launch('well', muzzle, ray.dir, T.shells.well.speed, 1.2);
    sfx.thump();
  }

  bomb({ ray, muzzle }) {
    this.launch('bomb', muzzle, ray.dir, T.shells.bomb.speed, T.shells.bomb.lift);
    sfx.thump();
  }

  stepProjectiles(dt) {
    const g = this.game;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;
      p.prev.copy(p.pos);
      const grav = p.kind === 'well' ? T.shells.well.gravity : T.physics.gravity;
      p.vel.y -= grav * dt;
      const step = p.vel.clone().multiplyScalar(dt);
      const len = step.length();
      const hit = len > 1e-5 ? g.physics.raycast(p.pos, step.clone().divideScalar(len), len + 0.08, g.player.collider, undefined, (c) => !c.isSensor()) : null;
      let detonate = p.age > (p.kind === 'well' ? T.shells.well.maxFlight : T.shells.bomb.fuse);
      if (hit) {
        const ent = hit.entity;
        p.pos.copy(hit.point).addScaledVector(hit.normal, 0.1);
        if (p.kind === 'well' || ent?.type === 'breakable' || ent?.type === 'clapper' || p.bounces >= T.shells.bomb.bounces) detonate = true;
        else {
          // bounce: reflect with loss
          p.vel.reflect(hit.normal).multiplyScalar(0.45);
          p.bounces++;
          sfx.clonk(g.listenerDistance(p.pos));
        }
        p.normal = hit.normal;
      } else p.pos.add(step);
      p.mesh.position.copy(p.pos);
      p.mesh.rotation.x += dt * 12; p.mesh.rotation.z += dt * 9;
      if (p.kind === 'bomb' && Math.random() < 0.6) g.fx.add.emit({ pos: p.pos, vel: new THREE.Vector3().randomDirection(), life: 0.3, size: 0.04, sizeEnd: 0.01, color: GLOW, drag: 2 });
      if (p.kind === 'well') g.fx.chargeTick(p.pos, 1, dt);
      if (detonate) {
        g.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        if (p.kind === 'well') this.openWell(p.pos.clone().addScaledVector(p.normal || UP, 0.5));
        else this.explodeBomb(p.pos.clone(), p.normal);
      }
    }
  }

  // ---- GRAVITY WELL --------------------------------------------------------
  openWell(pos) {
    const g = this.game, W = T.shells.well;
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 2), new THREE.MeshBasicMaterial({ color: 0x120804 }));
    const rimMat = new THREE.MeshBasicMaterial({ color: PALETTE.glow, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const rings = [0, 1, 2].map((k) => {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.55 + k * 0.28, 0.018, 4, 40), rimMat.clone());
      r.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      group.add(r);
      return r;
    });
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: g.fx.haloTexture, color: PALETTE.glow, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.setScalar(2.4);
    group.add(core, halo);
    group.position.copy(pos);
    g.scene.add(group);
    this.wells.push({ pos, t: 0, dur: W.duration, group, core, rings, halo, sound: sfx.wellLoop() });
    sfx.thump();
  }

  stepWells(dt) {
    const g = this.game, W = T.shells.well;
    for (let i = this.wells.length - 1; i >= 0; i--) {
      const w = this.wells[i];
      w.t += dt;
      const ramp = Math.min(1, w.t / 0.35);
      const eat = [], swirled = [];
      // the crush zone grows as the well feeds, so the debris ball can't pile up
      const crushR = W.compressRadius * (1 + W.compressGrow * Math.min(1, w.t / w.dur));
      g.physics.world.forEachRigidBody((b) => {
        if (!b.isDynamic()) return;
        const t = b.translation();
        _v.set(w.pos.x - t.x, w.pos.y - t.y, w.pos.z - t.z);
        const d = _v.length();
        if (d > W.radius || d < 1e-3) return;
        const ent = b.numColliders() ? g.physics.entityOf(b.collider(0)) : null;
        const debris = ent && (ent.type === 'shard' || ent.type === 'slice');
        // debris that reaches the core gets crushed (collected, removed after the loop)
        if (debris && d < crushR && w.t > 0.3 && eat.length < W.compressMax) { eat.push(ent); return; }
        if (debris && ent.type === 'shard' && !ent.swirled) swirled.push(ent);
        _v.divideScalar(d);
        const f = 1 - d / W.radius;
        const m = b.mass();
        _v2.crossVectors(UP, _v).normalize();
        const pull = W.pull * Math.pow(f, 0.4) * ramp;
        const swirl = W.swirl * f * ramp;
        const lift = T.physics.gravity * 0.85 * Math.min(1, f * 1.8) * ramp;
        g.physics.kick(b, { x: (_v.x * pull + _v2.x * swirl) * m * dt, y: (_v.y * pull + lift) * m * dt, z: (_v.z * pull + _v2.z * swirl) * m * dt });
        if (d < 0.9) { const lv = b.linvel(); b.setLinvel({ x: lv.x * 0.94, y: lv.y * 0.94, z: lv.z * 0.94 }, true); }
      });
      for (const ent of eat) this.compress(w, ent);
      for (const ent of swirled) {
        ent.swirled = true;
        const col = ent.body.collider(0);
        col.setCollisionGroups(GROUPS.swirl);
        col.setActiveEvents(RAPIER.ActiveEvents.NONE);
      }
      for (const c of g.clappers.list) {
        const d = c.pos.distanceTo(w.pos);
        if (d < W.radius) g.clappers.pull(c, w.pos, (1 - d / W.radius) * ramp, dt);
      }
      const pd = g.player.renderPos.clone().setY(g.player.renderPos.y + 0.9).distanceTo(w.pos);
      if (pd < W.radius) g.player.vel.addScaledVector(w.pos.clone().sub(g.player.pos).setY(0).normalize(), W.playerPull * (1 - pd / W.radius) * dt);
      if (w.t >= w.dur) this.collapseWell(i);
    }
  }

  /** Crush a piece of debris into the well core; every few condense into a bauble. */
  compress(w, ent) {
    const g = this.game, W = T.shells.well;
    const t = ent.body.translation();
    const p = new THREE.Vector3(t.x, t.y, t.z);
    g.breakables.removeAny(ent);
    g.fx.absorbSparkle(p);
    w.eaten = (w.eaten || 0) + 1;
    w.core.scale.setScalar(1 + Math.min(0.8, w.eaten * 0.03));
    if (w.eaten % W.compressPer === 0 && w.eaten / W.compressPer <= W.compressDrops) {
      g.baubles?.spawn(w.pos, 1, { spread: 0.3, up: 0.5 });
      sfx.gulp?.(g.listenerDistance(w.pos));
    }
  }

  collapseWell(i) {
    const g = this.game, W = T.shells.well;
    const w = this.wells[i];
    this.wells.splice(i, 1);
    g.scene.remove(w.group);
    w.sound?.stop();
    g.breakables.explode(w.pos, { radius: W.popRadius, breakFrac: 0.5, velocity: W.popVelocity, fx: false, cause: 'well' });
    for (const c of g.clappers.list) if (c.pos.distanceTo(w.pos) < W.popRadius * 0.5 && c.alive) g.clappers.hit(c, c.pos.clone().setY(c.pos.y + 0.3), c.pos.clone().sub(w.pos).normalize(), 1.4, 'well');
    g.fx.shockwave(w.pos, W.popRadius);
    g.fx.implode(w.pos);
    g.onExplosion(w.pos, W.popRadius * 0.7);
    sfx.explosion(g.listenerDistance(w.pos));
  }

  // ---- MARK / STUN ---------------------------------------------------------
  mark({ ray, muzzle }) {
    const g = this.game, M = T.shells.mark;
    const hit = g.physics.raycast(ray.origin, ray.dir, T.weapon.range, g.player.collider, undefined, (c) => !c.isSensor());
    const end = hit ? hit.point : ray.origin.clone().addScaledVector(ray.dir, T.weapon.range);
    g.fx.tracer(muzzle, end);
    g.fx.markBurst(end, hit ? hit.normal : UP, M.radius);
    sfx.mark();
    let n = 0;
    const tryMark = (ent) => { if (ent?.type === 'breakable' && ent.alive && !ent.marked) { this.markEnt(ent); n++; } };
    tryMark(hit?.entity);
    for (const ent of g.breakables.items) {
      const t = ent.body.translation();
      if (_v.set(t.x, t.y + ent.P.height * 0.4, t.z).distanceTo(end) < M.radius) tryMark(ent);
    }
    for (const c of g.clappers.list) {
      if (c.alive && (hit?.entity === c || c.pos.distanceTo(end) < M.radius + 0.4)) { g.clappers.stun(c, M.stun, this.glowOutline, this.xray); n++; }
    }
    if (n) { g.hud.popup(`MARKED ×${n}`); g.hud.hitmarker(false); }
  }

  markEnt(ent) {
    ent.marked = true;
    ent.markT = T.shells.mark.duration;
    ent.markMesh = addOutline(ent.mesh, this.glowOutline);
    ent.markMesh.renderOrder = 9;
    ent.xrayMesh = new THREE.Mesh(ent.mesh.geometry, this.xray);
    ent.xrayMesh.renderOrder = 10;
    ent.mesh.add(ent.xrayMesh);
    this.marked.add(ent);
  }

  // ---- BOMBSHELL -----------------------------------------------------------
  explodeBomb(pos, normal = UP) {
    const g = this.game, B = T.shells.bomb;
    g.fx.explosion(pos, B.radius * 0.7);
    sfx.explosion(g.listenerDistance(pos));
    sfx.sizzle(g.listenerDistance(pos));
    g.onExplosion(pos, B.radius * 0.8);
    // splash damage with falloff (big stoneware may survive the edge of it)
    for (const ent of [...g.breakables.items]) {
      const t = ent.body.translation();
      const c = new THREE.Vector3(t.x, t.y + ent.P.height * 0.4, t.z);
      const d = c.distanceTo(pos);
      if (d < B.radius) g.breakables.damage(ent, B.damage * (1 - d / B.radius), c, c.clone().sub(pos).normalize(), 1.3);
    }
    g.breakables.explode(pos, { radius: B.radius, breakFrac: 0, velocity: B.velocity, fx: false, cause: 'bomb' });
    // molten slip: a burst of droplets
    for (let k = 0; k < B.droplets; k++) {
      const v = new THREE.Vector3().randomDirection();
      v.addScaledVector(normal, 0.8).normalize().multiplyScalar(3 + Math.random() * 7);
      this.addDroplet(pos.clone().addScaledVector(normal, 0.1), v, 0.025 + Math.random() * 0.05);
    }
    // the pool: find the ground below and leave a hot puddle
    const down = g.physics.raycast(pos.clone().addScaledVector(UP, 0.2), new THREE.Vector3(0, -1, 0), 3, g.player.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    if (down) this.addPool(down.point, down.normal);
  }

  addDroplet(pos, vel, r, slip = false) {
    if (this.droplets.length >= 400) this.droplets.shift();
    this.droplets.push({ pos, vel, r, age: 0, life: 2.5, slip });
  }

  /** A burst barrel: cold liquid clay slops out (harmless, just messy). */
  spill(center, dir, amount = 1) {
    const g = this.game;
    for (let k = 0; k < 70 * amount; k++) {
      const v = new THREE.Vector3().randomDirection();
      v.y = Math.abs(v.y) * 0.8;
      v.multiplyScalar(1.5 + Math.random() * 3.5).addScaledVector(dir, 1.5);
      this.addDroplet(center.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.3) * 0.4, (Math.random() - 0.5) * 0.3)), v, 0.03 + Math.random() * 0.05, true);
    }
    const down = g.physics.raycast(center, new THREE.Vector3(0, -1, 0), 3, g.player.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    if (down) this.addPool(down.point, down.normal, true);
    sfx.splosh(g.listenerDistance(center));
  }

  stepDroplets(dt) {
    const g = this.game;
    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const d = this.droplets[i];
      d.age += dt;
      d.vel.y -= T.physics.gravity * dt;
      d.vel.multiplyScalar(Math.exp(-0.4 * dt));
      const step = d.vel.clone().multiplyScalar(dt);
      const len = step.length();
      const hit = len > 1e-5 ? g.physics.raycast(d.pos, step.clone().divideScalar(len), len + d.r, g.player.collider, undefined, (c) => !c.isSensor()) : null;
      if (hit || d.age > d.life) {
        if (hit) {
          const ent = hit.entity;
          if (!hit.collider.parent()?.isDynamic()) this.addSplat(hit.point, hit.normal, d.r * (6 + Math.random() * 5), d.slip);
          if (!d.slip && ent?.type === 'breakable') g.breakables.damage(ent, T.shells.bomb.dropletDamage, hit.point, d.vel.clone().normalize(), 0.5);
          if (!d.slip && ent?.type === 'clapper') g.clappers.scald(ent, 0.4);
          // splash: sometimes spit two smaller droplets
          if (d.r > 0.035 && Math.random() < 0.35) {
            for (let k = 0; k < 2; k++) {
              const v = d.vel.clone().reflect(hit.normal).multiplyScalar(0.3).add(new THREE.Vector3().randomDirection().multiplyScalar(1.2));
              this.addDroplet(hit.point.clone().addScaledVector(hit.normal, 0.03), v, d.r * 0.5, d.slip);
            }
          }
        }
        this.droplets.splice(i, 1);
        continue;
      }
      d.pos.add(step);
    }
  }

  addSplat(point, normal, size, slip = false) {
    const g = this.game;
    // don't stack decals on decals: grow a nearby one a little instead
    for (let i = this.splats.length - 1; i >= Math.max(0, this.splats.length - 60); i--) {
      const o = this.splats[i];
      if (o.m.position.distanceToSquared(point) < (size * 0.35) ** 2) {
        if ((o.grown = (o.grown || 0) + 1) < 12) o.m.scale.multiplyScalar(1.04);
        o.age = Math.min(o.age, o.life * 0.3); // fresh slip keeps it wet
        return;
      }
    }
    const mat = new THREE.MeshBasicMaterial({ map: this.blobTex[Math.floor(Math.random() * 4)], color: (slip ? SLIP : HOT).clone(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
    const m = new THREE.Mesh(g.fx.decalGeo, mat);
    m.position.copy(point).addScaledVector(normal, 0.004 + (this.splats.length % 16) * 0.0004);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    m.rotateZ(Math.random() * Math.PI * 2);
    m.scale.setScalar(size / 0.16);
    g.scene.add(m);
    this.splats.push({ m, age: 0, life: T.shells.bomb.splatLife * (0.8 + Math.random() * 0.4), slip });
    if (this.splats.length > 220) { const s = this.splats.shift(); g.scene.remove(s.m); s.m.material.dispose(); }
  }

  addPool(point, normal, slip = false) {
    const g = this.game, B = T.shells.bomb;
    const mat = new THREE.MeshBasicMaterial({ map: this.blobTex[slip ? 2 : 0], color: (slip ? SLIP : HOT).clone(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.position.copy(point).addScaledVector(normal, 0.01);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    m.scale.setScalar(B.poolRadius * 2.2);
    m.renderOrder = 1;
    g.scene.add(m);
    this.pools.push({ m, pos: point.clone(), age: 0, life: B.poolLife, r: B.poolRadius * (slip ? 0.8 : 1), slip });
  }

  stepPools(dt) {
    const g = this.game, B = T.shells.bomb;
    for (let i = this.pools.length - 1; i >= 0; i--) {
      const p = this.pools[i];
      p.age += dt;
      const heat = 1 - p.age / p.life;
      if (heat <= 0) { g.scene.remove(p.m); p.m.material.dispose(); this.pools.splice(i, 1); continue; }
      const r = p.r * (0.55 + 0.45 * heat);
      if (p.slip) continue; // cold slip: just a mess
      // hot floor: scalds critters, slowly cooks pots sitting in it
      for (const c of g.clappers.list) if (c.alive && Math.abs(c.pos.y - p.pos.y) < 0.4 && c.pos.distanceTo(p.pos) < r) g.clappers.scald(c, dt * heat);
      for (const ent of g.breakables.items) {
        const t = ent.body.translation();
        if (Math.abs(t.y - p.pos.y) < 0.3 && Math.hypot(t.x - p.pos.x, t.z - p.pos.z) < r) g.breakables.damage(ent, B.poolDps * heat * dt, new THREE.Vector3(t.x, t.y + 0.1, t.z), UP, 0.3, true);
      }
      if (Math.random() < heat * 0.5) {
        const a = Math.random() * Math.PI * 2, rr = Math.random() * r * 0.8;
        g.fx.alpha.emit({ pos: p.pos.clone().add(new THREE.Vector3(Math.cos(a) * rr, 0.05, Math.sin(a) * rr)), vel: new THREE.Vector3(0, 0.6, 0), life: 1.2, size: 0.12, sizeEnd: 0.5, color: new THREE.Color(PALETTE.pale), alpha: 0.2 * heat, drag: 1 });
      }
    }
  }

  // ---- per-frame -------------------------------------------------------------
  fixedUpdate(dt) {
    this.stepProjectiles(dt);
    this.stepWells(dt);
    this.stepDroplets(dt);
    this.stepPools(dt);
  }

  update(dt) {
    const g = this.game;
    const now = performance.now() * 0.001;
    for (const w of this.wells) {
      const k = Math.min(1, w.t / 0.3) * (w.t > w.dur - 0.25 ? Math.max(0.05, (w.dur - w.t) / 0.25) : 1);
      w.core.scale.setScalar(k * (1 + 0.08 * Math.sin(now * 30)));
      w.rings.forEach((r, j) => { r.rotation.x += dt * (2 + j); r.rotation.y += dt * (3 - j); r.scale.setScalar(k * (1 + 0.15 * Math.sin(now * 8 + j))); });
      w.halo.material.opacity = 0.6 + 0.4 * Math.sin(now * 12);
      w.sound?.set(Math.min(1, w.t / w.dur));
      for (let s = 0; s < 3; s++) {
        const a = Math.random() * Math.PI * 2, r = T.shells.well.radius * (0.4 + Math.random() * 0.5);
        const p = w.pos.clone().add(new THREE.Vector3(Math.cos(a) * r, (Math.random() - 0.5) * 2, Math.sin(a) * r));
        const v = w.pos.clone().sub(p).multiplyScalar(1.6).add(new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(4));
        g.fx.add.emit({ pos: p, vel: v, life: 0.5, size: 0.04, sizeEnd: 0.01, color: GLOW, drag: 0.5 });
      }
    }
    // droplets: stretched along velocity, cooling from white-hot to clay
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), col = new THREE.Color();
    this.droplets.forEach((d, i) => {
      const sp = d.vel.length();
      q.setFromUnitVectors(UP, sp > 1e-3 ? d.vel.clone().divideScalar(sp) : UP);
      const st = 1 + Math.min(2.5, sp * 0.18);
      sc.set(d.r / Math.sqrt(st), d.r * st, d.r / Math.sqrt(st));
      mtx.compose(d.pos, q, sc);
      this.dropMesh.setMatrixAt(i, mtx);
      if (d.slip) col.copy(SLIP); else col.copy(HOT).lerp(GLOW, Math.min(1, d.age / 1.2));
      this.dropMesh.setColorAt(i, col);
    });
    this.dropMesh.count = this.droplets.length;
    this.dropMesh.instanceMatrix.needsUpdate = true;
    if (this.dropMesh.instanceColor) this.dropMesh.instanceColor.needsUpdate = true;
    // splats + pool cool down and fade away
    for (let i = this.splats.length - 1; i >= 0; i--) {
      const s = this.splats[i];
      s.age += dt;
      const t = s.age / s.life;
      if (t >= 1) { g.scene.remove(s.m); s.m.material.dispose(); this.splats.splice(i, 1); continue; }
      if (s.slip) s.m.material.color.copy(SLIP).lerp(SLIP_DRY, THREE.MathUtils.smoothstep(t, 0.1, 0.7));
      else s.m.material.color.copy(HOT).lerp(GLOW, Math.min(1, t * 4)).lerp(COOL, THREE.MathUtils.smoothstep(t, 0.15, 0.6));
      s.m.material.opacity = 1 - THREE.MathUtils.smoothstep(t, 0.7, 1);
    }
    for (const p of this.pools) {
      const t = p.age / p.life;
      if (p.slip) p.m.material.color.copy(SLIP).lerp(SLIP_DRY, THREE.MathUtils.smoothstep(t, 0.2, 0.8));
      else p.m.material.color.copy(HOT).lerp(GLOW, Math.min(1, t * 3)).lerp(COOL, THREE.MathUtils.smoothstep(t, 0.3, 0.85));
      p.m.material.opacity = (1 - THREE.MathUtils.smoothstep(t, 0.75, 1)) * (0.85 + 0.15 * Math.sin(now * 5));
      p.m.scale.setScalar(p.r * 2.2 * (0.6 + 0.4 * (1 - t)));
    }
    // marks tick down
    for (const ent of this.marked) {
      ent.markT -= dt;
      if (ent.markMesh) ent.markMesh.visible = ent.markT > 2 || Math.sin(now * 20) > 0;
      if (ent.markT <= 0 || !ent.alive) this.unmark(ent);
    }
    this.glowOutline.opacity = 0.55 + 0.3 * Math.sin(now * 6);
    this.xray.opacity = 0.18 + 0.08 * Math.sin(now * 6);
  }

  unmark(ent) {
    ent.marked = false;
    if (ent.markMesh) ent.markMesh.parent?.remove(ent.markMesh);
    if (ent.xrayMesh) ent.xrayMesh.parent?.remove(ent.xrayMesh);
    ent.markMesh = null;
    ent.xrayMesh = null;
    this.marked.delete(ent);
  }

  clear() {
    const g = this.game;
    for (const p of this.projectiles) g.scene.remove(p.mesh);
    for (const w of this.wells) { g.scene.remove(w.group); w.sound?.stop(); }
    for (const s of this.splats) g.scene.remove(s.m);
    for (const p of this.pools) g.scene.remove(p.m);
    for (const e of [...this.marked]) this.unmark(e);
    this.projectiles = []; this.wells = []; this.splats = []; this.pools = []; this.droplets = [];
  }
}
