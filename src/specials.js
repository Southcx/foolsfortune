import * as THREE from 'three';
import { T, DEG, PALETTE } from './config.js';
import { sfx } from './audio.js';
import { GROUPS } from './physics.js';

// ---------------------------------------------------------------------------
// Ricochet + homing shells (the Shells class dispatches to these).
//   ricochet – a hitscan round that banks off walls and floors, gets stronger
//              with every bounce and bends toward a target after each one
//   homing   – hold to paint up to N targets with the lock-on reticle, release
//              to loose one seeker per lock
// ---------------------------------------------------------------------------

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _ndc = new THREE.Vector3();
const HOT = new THREE.Color(PALETTE.hot), GLOW = new THREE.Color(PALETTE.glow);
const ease = (x) => 1 - Math.pow(1 - x, 3);

/** A shootable thing the seekers and the ricochet can aim for. */
function targetOf(ent) {
  if (!ent) return null;
  if (ent.type === 'breakable') return ent.alive && !ent.def.hang ? ent : null;
  if (ent.type === 'clapper') return ent.alive ? ent : null;
  return null;
}
function aimPoint(ent, out = new THREE.Vector3()) {
  if (ent.type === 'clapper') return out.copy(ent.pos).setY(ent.pos.y + 0.3 * T.clappers.scale);
  const t = ent.body.translation();
  return out.set(t.x, t.y + ent.P.height * 0.45, t.z);
}
const isAlive = (ent) => ent.alive;

export class Specials {
  constructor(shells) {
    this.shells = shells;
    this.game = shells.game;
    this.seekers = [];
    this.painting = false;
    this.progress = new Map(); // ent -> 0..1 lock progress while painting
    this.locks = []; // ents, in lock order
    this.reticles = new Map(); // ent -> { el, t, locked, idx }
    this.layer = document.getElementById('locks');

    // ricochet ADS preview: where the first bounce goes
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
    this.preview = new THREE.Line(g, new THREE.LineDashedMaterial({ color: PALETTE.hot, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0, depthWrite: false }));
    this.preview.frustumCulled = false;
    this.preview.renderOrder = 6;
    this.previewDot = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.075, 16), new THREE.MeshBasicMaterial({ color: PALETTE.hot, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    this.previewDot.renderOrder = 6;
    this.game.scene.add(this.preview, this.previewDot);

    this.seekerGeo = new THREE.OctahedronGeometry(0.05, 0);
    this.seekerMat = new THREE.MeshBasicMaterial({ color: PALETTE.hot });
  }

  // ---- shared targeting --------------------------------------------------------
  /** Unobstructed line from `from` to the target? */
  visible(from, ent) {
    const p = aimPoint(ent, _v2);
    const d = _v.subVectors(p, from);
    const len = d.length();
    if (len < 1e-3) return true;
    // loose debris (shards, slices) doesn't block a lock
    const hit = this.game.physics.raycast(from, d.divideScalar(len), len, this.game.player.collider, GROUPS.controllerQuery, (c) => !c.isSensor());
    return !hit || hit.entity === ent || hit.distance > len - 0.35;
  }

  /** Every live target inside a cone, best (smallest angle, marked first) first. */
  inCone(origin, dir, coneDeg, range, exclude) {
    const g = this.game, cos = Math.cos(coneDeg * DEG), out = [];
    const consider = (ent) => {
      if (!targetOf(ent) || exclude?.has(ent)) return;
      const p = aimPoint(ent, _v);
      const to = p.sub(origin);
      const d = to.length();
      if (d > range || d < 0.3) return;
      const c = to.divideScalar(d).dot(dir);
      if (c < cos) return;
      out.push({ ent, score: c + (ent.marked ? 0.05 : 0) - d * 0.0015 });
    };
    for (const ent of g.breakables.items) consider(ent);
    for (const c of g.clappers.list) consider(c);
    out.sort((a, b) => b.score - a.score);
    return out.map((o) => o.ent);
  }

  // ---- RICOCHET ----------------------------------------------------------------
  ricochet({ ray, muzzle }) {
    const g = this.game, R = T.shells.ricochet;
    const skip = new Set();
    const origin = ray.origin.clone(), dir = ray.dir.clone();
    let from = muzzle.clone(), mult = 1, bounces = 0, hits = 0;
    const path = this.lastPath = [muzzle.clone()];
    for (let guard = 0; guard < R.bounces + 16; guard++) {
      const hit = g.physics.raycast(origin, dir, R.range, g.player.collider, undefined, (c) => !skip.has(c.handle));
      if (!hit) { g.fx.tracer(from, origin.clone().addScaledVector(dir, R.range)); break; }
      g.fx.tracer(from, hit.point);
      path.push(hit.point.clone());
      const ent = hit.entity;
      const body = hit.collider.parent();
      let through = false;
      if (ent?.type === 'breakable' && ent.alive) {
        hits++;
        const broke = g.breakables.damage(ent, R.damage * mult * (ent.marked ? T.shells.mark.damageMult : 1), hit.point, dir, 1 + 0.25 * bounces);
        through = broke; // a pot that survives (big stoneware) deflects the round
      } else if (ent?.type === 'clapper') { hits++; g.clappers.hit(ent, hit.point, dir, 1.2, bounces ? 'ricochet' : 'shot'); through = true; }
      else if (ent?.type === 'rope') { g.breakables.cutRope(ent.rope, ent.index, hit.point, dir); through = true; }
      else if (ent?.type === 'slice') { hits++; g.breakables.crumble(ent, hit.point, dir); through = true; }
      else if (ent?.type === 'bauble' || hit.collider.isSensor()) through = true;
      if (through) {
        skip.add(hit.collider.handle);
        origin.copy(hit.point).addScaledVector(dir, 0.01);
        from = hit.point.clone();
        continue;
      }
      if (bounces >= R.bounces) { g.fx.impact(hit.point, hit.normal, { sparks: 10, dust: 8, decal: !body?.isDynamic() }); break; }
      // bank: reflect, power up, then bend toward the best target in the new cone
      if (body?.isDynamic()) g.physics.kick(body, dir.clone().multiplyScalar(Math.min(T.weapon.impulse * 1.5, body.mass() * 20)), hit.point);
      const n = hit.normal;
      if (n.dot(dir) > 0) n.negate();
      dir.reflect(n).normalize();
      bounces++;
      mult *= R.bounceMult;
      const at = hit.point.clone().addScaledVector(n, 0.03);
      const cands = this.inCone(at, dir, R.seekAngle, R.seekRange);
      const tgt = cands.find((e) => this.visible(at, e));
      if (tgt) dir.copy(aimPoint(tgt, _v).sub(at).normalize());
      g.fx.impact(hit.point, n, { sparks: 12 + bounces * 3, dust: 4, decal: !body?.isDynamic() });
      sfx.ricochet(bounces, g.listenerDistance(hit.point));
      origin.copy(at);
      from = hit.point.clone();
    }
    if (hits) { g.hud.hitmarker(true); sfx.hitmarker(); }
    if (hits && bounces >= 2) g.events?.emit('shell.bank', { bounces });
    g.clappers?.spook(origin);
  }

  updatePreview(camera, weapon) {
    const g = this.game;
    const show = this.shells.type.id === 'ricochet' && weapon.adsEase > 0.2 && !weapon.reloading && this.shells.counts.ricochet > 0;
    const k = show ? weapon.adsEase : 0;
    this.preview.material.opacity = 0.75 * k;
    this.previewDot.material.opacity = 0.9 * k;
    this.preview.visible = this.previewDot.visible = k > 0.01;
    if (!this.preview.visible) return;
    const fwd = _v.set(0, 0, -1).applyQuaternion(camera.quaternion).clone();
    const hit = g.physics.raycast(camera.position, fwd, T.shells.ricochet.range, g.player.collider, undefined, (c) => !c.isSensor());
    if (!hit || targetOf(hit.entity)) { this.preview.visible = this.previewDot.visible = false; return; }
    const n = hit.normal.clone();
    if (n.dot(fwd) > 0) n.negate();
    const r = fwd.clone().reflect(n).normalize();
    const at = hit.point.clone().addScaledVector(n, 0.03);
    const cands = this.inCone(at, r, T.shells.ricochet.seekAngle, T.shells.ricochet.seekRange);
    const tgt = cands.find((e) => this.visible(at, e));
    if (tgt) r.copy(aimPoint(tgt, _v).sub(at).normalize());
    const h2 = g.physics.raycast(at, r, 5, g.player.collider, undefined, (c) => !c.isSensor());
    const end = h2 ? h2.point : at.clone().addScaledVector(r, 5);
    const pa = this.preview.geometry.attributes.position;
    pa.setXYZ(0, hit.point.x, hit.point.y, hit.point.z);
    pa.setXYZ(1, end.x, end.y, end.z);
    pa.setXYZ(2, end.x, end.y, end.z);
    pa.needsUpdate = true;
    this.preview.computeLineDistances();
    this.previewDot.position.copy(hit.point).addScaledVector(n, 0.01);
    this.previewDot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    this.previewDot.material.color.set(tgt ? PALETTE.cream : PALETTE.hot);
  }

  // ---- HOMING: paint -------------------------------------------------------------
  startPaint() {
    if (this.shells.counts.homing <= 0) { sfx.dryFire(); this.game.log.say('warn', 'You have no homing shells.', { key: 'dry', throttle: 2 }); return; }
    this.painting = true;
    this.progress.clear();
    this.locks = [];
    sfx.lockTick();
  }

  cancelPaint() {
    if (!this.painting) return;
    this.painting = false;
    this.progress.clear();
    for (const ent of this.locks) this.dropReticle(ent);
    this.locks = [];
  }

  stepPaint(dt, camera) {
    const H = T.shells.homing;
    const fwd = _v.set(0, 0, -1).applyQuaternion(camera.quaternion).clone();
    const locked = new Set(this.locks);
    const inside = new Set();
    if (this.locks.length < H.maxLocks) {
      for (const ent of this.inCone(camera.position, fwd, H.cone, H.range, locked)) {
        if (!this.visible(camera.position, ent)) continue;
        inside.add(ent);
        const p = Math.min(1, (this.progress.get(ent) || 0) + dt / H.lockTime);
        this.progress.set(ent, p);
        sfx.lockTick();
        if (p >= 1 && this.locks.length < H.maxLocks) {
          this.locks.push(ent);
          this.progress.delete(ent);
          sfx.lockOn(this.locks.length);
        }
      }
    }
    // candidates leaving the cone lose their progress quickly
    for (const [ent, p] of this.progress) {
      if (inside.has(ent)) continue;
      const q = p - dt / (H.lockTime * 0.6);
      if (q <= 0 || !isAlive(ent)) this.progress.delete(ent); else this.progress.set(ent, q);
    }
    this.locks = this.locks.filter(isAlive);
  }

  // ---- HOMING: fire --------------------------------------------------------------
  homing({ ray, muzzle, camera }) {
    const g = this.game, H = T.shells.homing;
    this.painting = false;
    this.progress.clear();
    let targets = this.locks.filter(isAlive);
    this.locks = [];
    // nothing painted: one dumb-fire seeker that grabs whatever is under the crosshair
    if (!targets.length) {
      const c = this.inCone(camera.position, ray.dir, H.cone * 1.5, H.range).find((e) => this.visible(camera.position, e));
      targets = [c || null];
    }
    const side = new THREE.Vector3().crossVectors(ray.dir, UP).normalize();
    const up = new THREE.Vector3().crossVectors(side, ray.dir).normalize();
    targets.forEach((ent, i) => {
      // bloom out in a fan before curling in
      const a = targets.length > 1 ? (i / (targets.length - 1) - 0.5) * 2 : 0;
      const vel = ray.dir.clone().multiplyScalar(H.launchSpeed)
        .addScaledVector(side, a * H.fan + (Math.random() - 0.5) * 1.5)
        .addScaledVector(up, H.fan * 0.6 + Math.random() * 1.5);
      const mesh = new THREE.Mesh(this.seekerGeo, this.seekerMat);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: g.fx.haloTexture, color: PALETTE.glow, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.scale.setScalar(0.45);
      mesh.add(glow);
      mesh.position.copy(muzzle);
      g.scene.add(mesh);
      this.seekers.push({ pos: muzzle.clone(), vel, target: ent, age: -i * H.stagger, mesh, done: false });
      if (ent) this.reticle(ent).firing = true;
    });
    sfx.seekers(targets.length);
    g.clappers?.spook(muzzle, 2);
  }

  retarget(s) {
    const H = T.shells.homing;
    const dir = s.vel.clone().normalize();
    const taken = new Set(this.seekers.filter((o) => o !== s && o.target).map((o) => o.target));
    const c = this.inCone(s.pos, dir, 70, H.range * 0.5, taken).find((e) => this.visible(s.pos, e));
    s.target = c || null;
    if (c) this.reticle(c).firing = true;
  }

  stepSeekers(dt) {
    const g = this.game, H = T.shells.homing;
    for (let i = this.seekers.length - 1; i >= 0; i--) {
      const s = this.seekers[i];
      s.age += dt;
      if (s.age < 0) { s.mesh.visible = false; continue; } // staggered launch
      s.mesh.visible = true;
      if (s.target && !isAlive(s.target)) { this.dropReticle(s.target); this.retarget(s); }
      const speed = THREE.MathUtils.lerp(H.launchSpeed, H.speed, Math.min(1, s.age / 0.5));
      if (s.target) {
        const want = aimPoint(s.target, _v).sub(s.pos);
        const dist = want.length();
        want.divideScalar(dist || 1);
        // turn toward the target at a rate that tightens with age (no orbiting forever)
        const cur = s.vel.clone().normalize();
        const ang = cur.angleTo(want);
        const maxTurn = (H.turn + H.turnGrow * s.age) * dt;
        if (ang > 1e-4) {
          const axis = _v2.crossVectors(cur, want);
          if (axis.lengthSq() < 1e-8) axis.set(0, 1, 0);
          cur.applyAxisAngle(axis.normalize(), Math.min(ang, maxTurn));
        }
        s.vel.copy(cur).multiplyScalar(speed);
        if (dist < 0.28) { this.detonate(s, i, s.pos.clone(), s.target, want); continue; }
      } else {
        s.vel.y -= 2 * dt;
        s.vel.setLength(speed);
      }
      const step = s.vel.clone().multiplyScalar(dt);
      const len = step.length();
      const hit = g.physics.raycast(s.pos, step.clone().divideScalar(len), len + 0.05, g.player.collider, undefined, (c) => !c.isSensor());
      if (hit) { this.detonate(s, i, hit.point, targetOf(hit.entity) || hit.entity, s.vel.clone().normalize(), hit); continue; }
      s.pos.add(step);
      if (s.age > H.maxFlight) { this.detonate(s, i, s.pos.clone(), null, s.vel.clone().normalize()); continue; }
      s.mesh.position.copy(s.pos);
      s.mesh.rotation.x += dt * 20; s.mesh.rotation.y += dt * 14;
      // trail
      g.fx.add.emit({ pos: s.pos, vel: s.vel.clone().multiplyScalar(-0.05), life: 0.25, size: 0.05, sizeEnd: 0.005, color: Math.random() < 0.5 ? HOT : GLOW, drag: 1 });
    }
  }

  detonate(s, i, point, ent, dir, hit) {
    const g = this.game, H = T.shells.homing;
    this.seekers.splice(i, 1);
    g.scene.remove(s.mesh);
    s.mesh.children[0]?.material.dispose();
    if (s.target) this.dropReticle(s.target, true);
    // read the collider before any damage below can remove its body
    const staticHit = !!hit && !hit.collider.parent()?.isDynamic();
    const normal = hit ? hit.normal.clone() : dir.clone().negate();
    if (ent?.type === 'breakable' && ent.alive) g.breakables.damage(ent, H.damage * (ent.marked ? T.shells.mark.damageMult : 1), point, dir, 1.2);
    else if (ent?.type === 'clapper' && ent.alive) g.clappers.hit(ent, point, dir, 1.1, 'homing');
    else if (ent?.type === 'rope') g.breakables.cutRope(ent.rope, ent.index, point, dir);
    else if (ent?.type === 'slice') g.breakables.crumble(ent, point, dir);
    // a small pop around the impact
    for (const e of [...g.breakables.items]) {
      if (e === ent) continue;
      const c = aimPoint(e, _v);
      const d = c.distanceTo(point);
      if (d < H.splash) g.breakables.damage(e, H.damage * 0.5 * (1 - d / H.splash), c.clone(), c.clone().sub(point).normalize(), 0.8, true);
    }
    g.breakables.explode(point, { radius: H.splash * 1.4, breakFrac: 0, velocity: 3.5, fx: false, cause: 'homing' });
    g.fx.impact(point, normal, { sparks: 16, dust: 6, decal: staticHit });
    g.fx.markBurst(point, hit ? normal : UP, 0.35);
    sfx.seekerPop(g.listenerDistance(point));
    if (ent && (ent.type === 'breakable' || ent.type === 'clapper')) { g.hud.hitmarker(!ent.alive); sfx.hitmarker(); }
  }

  // ---- lock-on reticles (DOM) --------------------------------------------------------
  // Two squares spin in opposite directions and shrink onto the target; when they
  // coincide (as one diamond) the lock snaps on.
  reticle(ent) {
    let r = this.reticles.get(ent);
    if (!r) {
      const el = document.createElement('div');
      el.className = 'lock';
      el.innerHTML = '<i class="a"></i><i class="b"></i><span></span>';
      this.layer?.appendChild(el);
      r = { el, t: 0, locked: false, idx: 0, firing: false, out: 0 };
      this.reticles.set(ent, r);
    }
    return r;
  }

  dropReticle(ent, hitIt = false) {
    const r = this.reticles.get(ent);
    if (!r) return;
    this.reticles.delete(ent);
    if (hitIt) {
      r.el.classList.add('burst');
      setTimeout(() => r.el.remove(), 250);
    } else r.el.remove();
  }

  updateReticles(dt, camera) {
    if (!this.layer) return;
    const w = window.innerWidth, h = window.innerHeight;
    const wanted = new Set([...this.progress.keys(), ...this.locks, ...this.seekers.map((s) => s.target).filter(Boolean)]);
    for (const ent of [...this.reticles.keys()]) if (!wanted.has(ent)) this.dropReticle(ent);
    for (const ent of wanted) {
      if (!isAlive(ent)) continue;
      const r = this.reticle(ent);
      const lockedIdx = this.locks.indexOf(ent);
      const locked = lockedIdx >= 0 || r.firing;
      const p = locked ? 1 : this.progress.get(ent) || 0;
      if (locked && !r.locked) { r.locked = true; r.el.classList.add('locked'); r.el.querySelector('span').textContent = lockedIdx >= 0 ? lockedIdx + 1 : ''; }
      r.t += dt;
      _ndc.copy(aimPoint(ent, _v)).project(camera);
      const behind = _ndc.z > 1;
      const x = (_ndc.x * 0.5 + 0.5) * w, y = (-_ndc.y * 0.5 + 0.5) * h;
      const e = ease(p);
      const size = THREE.MathUtils.lerp(96, 30, e) * (locked ? 1 + 0.12 * Math.sin(r.t * 18) * Math.exp(-r.t * 3) : 1);
      const spin = (1 - e) * 180;
      const idle = locked ? r.t * 90 : 0; // once locked, the pair turns together
      r.el.style.display = behind ? 'none' : '';
      r.el.style.transform = `translate(${x}px, ${y}px)`;
      r.el.style.setProperty('--s', `${size}px`);
      r.el.style.setProperty('--ra', `${45 + spin + idle}deg`);
      r.el.style.setProperty('--rb', `${45 - spin + idle}deg`);
      r.el.style.opacity = locked ? 1 : 0.35 + 0.65 * e;
      if (!locked) r.t = 0;
    }
  }

  // ---- per-frame -----------------------------------------------------------------
  fixedUpdate(dt) { this.stepSeekers(dt); }

  update(dt) {
    const g = this.game;
    if (this.painting) {
      if (this.shells.type.id !== 'homing') this.cancelPaint();
      else this.stepPaint(dt, g.camera);
    }
    this.updatePreview(g.camera, g.weapon);
    this.updateReticles(dt, g.camera);
  }

  clear() {
    for (const s of this.seekers) this.game.scene.remove(s.mesh);
    this.seekers = [];
    this.cancelPaint();
    for (const ent of [...this.reticles.keys()]) this.dropReticle(ent);
  }
}
