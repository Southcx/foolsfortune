// ---------------------------------------------------------------------------
// Shells: special rounds for the psygun, fired with F / middle mouse.
//   slicer  – THE CLEAVE: a line of light that flies out level (or upright: press 1 again) and cuts everything it passes through
//   push    – a cone of force from the muzzle
//   well    – a lobbed singularity that drags everything in, then pops
//   mark    – stuns critters and marks things (marked things drop Lachryma)
//   bomb    – a lobbed clay grenade: splash damage, molten slip, hot pool
//   ricochet, homing – see specials.js
//   slip    – a lobbed ball of liquid clay that paints floors and walls wet (dive in: C)
// ---------------------------------------------------------------------------
import { PSYGUNS, DEFAULT_PSYGUN, capacityOf, typeNo } from './kinds.js';
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { T, DEG, PALETTE } from '../../core/config.js';
import { planeFrom } from '../slicing.js';
import { makeGlowOutline, addOutline } from '../../render/outline.js';
import { sfx } from '../../audio/sfx.js';
import { Specials } from './specials.js';
import { Casters } from './casters.js';
import { Spatter } from './spatter.js';
import { hasTag, registered } from '../../core/tags.js';
import { stream, randDir } from '../../core/rng.js';
const simRand = stream('tools/psygun/shells'); // (the simulation's chance: core/rng.js, the same twice)

// (each has a number, TYPE-00 to TYPE-10, by its place here: tools/psygun/kinds.js typeNo; which a psygun carries is its chambers)
export const SHELL_TYPES = [
  { id: 'slicer', name: 'CLEAVE', glyph: '═' }, // (the id is the old one: the ledger's counts are kept under it)
  { id: 'push', name: 'PUSH', glyph: '⟫' },
  { id: 'well', name: 'WELL', glyph: '◉' },
  { id: 'mark', name: 'MARK', glyph: '✳' },
  { id: 'bomb', name: 'BOMB', glyph: '●' },
  { id: 'ricochet', name: 'BANK', glyph: '⟀' },
  { id: 'homing', name: 'SEEK', glyph: '◇' },
  { id: 'slip', name: 'SLIP', glyph: '≈' }, // paints liquid clay to dive through (the slip tech)
  { id: 'groove', name: 'GROOVE', glyph: '♪' }, // caster shells: see casters.js
  { id: 'anchor', name: 'ANCHOR', glyph: '⚓︎' },
  { id: 'hatch', name: 'HATCH', glyph: '❦' },
];
export const SHELL_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'];
SHELL_TYPES.forEach((t, i) => { t.no = typeNo(i); });
const GUN_KEY = 'foolsfortune.psygun.v1';

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
const GLOW = new THREE.Color(0xe0673a); // (a bomb's trail and a well's motes: the hot of molten slip, tools/psygun/spatter.js)

export class Shells {
  constructor(game) {
    this.game = game;
    this.selected = 0;
    this.counts = Object.fromEntries(SHELL_TYPES.map((t) => [t.id, T.shells.start]));
    // the psygun they carry (tools/psygun/kinds.js): its chambers (which shell types are loaded) and how many of each it holds
    this.loadGun();
    this.bladeIdx = 0;
    this.projectiles = [];
    this.wells = [];
    this.marked = new Set();
    this.glowOutline = makeGlowOutline(PALETTE.hot, 0.014);
    this.xray = makeGlowOutline(PALETTE.glow, 0.004, true);
    this.spatter = new Spatter(game);
    this.specials = new Specials(this);
    this.casters = new Casters(this);
  }

  /** The shell types in the chambers, in order (what 1, 2, 3... pick; the HUD's slots). */
  get types() { return this.chambers.map((id) => SHELL_TYPES.find((t) => t.id === id)).filter(Boolean); }
  get type() { return this.types[this.selected] || this.types[0]; }
  /** How many of a type this psygun holds. */
  max(id) { return capacityOf(this.gun, id); }

  // ---------------------------------------------------------------- the psygun and its chambers (tools/psygun/kinds.js)
  loadGun() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(GUN_KEY) || 'null'); } catch { /* none kept */ }
    this.setGun(s?.gun && PSYGUNS[s.gun] ? s.gun : DEFAULT_PSYGUN, s?.chambers, true);
  }
  saveGun() { try { localStorage.setItem(GUN_KEY, JSON.stringify({ gun: this.gun.id, chambers: this.chambers })); } catch { /* this session only */ } }
  /** Carry another psygun: its own chambers (the loadout given, or its own), each type's count cut to what it holds. */
  setGun(id, chambers = null, quiet = false) {
    const G = PSYGUNS[id]; if (!G) return false;
    this.gun = G;
    const want = (chambers || G.loadout).filter((t, i, a) => SHELL_TYPES.some((x) => x.id === t) && a.indexOf(t) === i).slice(0, G.chambers);
    for (const t of G.loadout) if (want.length < G.chambers && !want.includes(t)) want.push(t);
    this.chambers = want;
    for (const t of SHELL_TYPES) this.counts[t.id] = Math.min(this.counts[t.id] ?? 0, this.max(t.id));
    this.selected = Math.min(this.selected, this.chambers.length - 1);
    this.saveGun();
    this.game.hud?.buildShells?.(this.types);
    if (!quiet) this.game.events?.emit('psygun.change', { gun: id, chambers: [...this.chambers] });
    return true;
  }
  /** Put a shell type into a chamber (a type already chambered swaps places with it). */
  chamber(i, typeId) {
    if (i < 0 || i >= this.chambers.length || !SHELL_TYPES.some((t) => t.id === typeId)) return false;
    const at = this.chambers.indexOf(typeId);
    if (at >= 0) this.chambers[at] = this.chambers[i];
    this.chambers[i] = typeId;
    this.saveGun();
    this.game.hud?.buildShells?.(this.types);
    this.game.events?.emit('psygun.chamber', { chamber: i, shell: typeId });
    return true;
  }

  select(i) {
    if (i < 0 || i >= this.types.length) return;
    if (i === this.selected) {
      // the Cleave's key again turns its line (level / upright), as the plasma cutter's alt-fire turns its three beams
      if (this.types[i].id === 'slicer') { this.cleaveUpright = !this.cleaveUpright; sfx.click(); this.cleaveGlyph(); }
      return;
    }
    this.selected = i;
    sfx.click();
  }
  /** The Cleave's slot shows which way its line lies. */
  cleaveGlyph() { const el = this.game.hud?.slots?.[this.types.findIndex((t) => t.id === 'slicer')]?.querySelector('i'); if (el) el.textContent = this.cleaveUpright ? '║' : '═'; }
  cycle(d) { const n = this.types.length; this.select((this.selected + d + n) % n); }
  refill(n = T.shells.refill) {
    let got = 0;
    for (const t of SHELL_TYPES) {
      const before = this.counts[t.id];
      this.counts[t.id] = Math.min(this.max(t.id), before + n);
      got += this.counts[t.id] - before;
    }
    return got;
  }

  /** Fire the selected shell. Returns false if the tube is empty. */
  fire(ctx) {
    const t = this.type;
    if (this.counts[t.id] <= 0) { sfx.dryFire(); this.game.log.say('warn', `You have no ${t.name.toLowerCase()} shells.`, { key: 'dry', throttle: 2 }); this.game.events?.emit('shell.dry', { id: t.id }); return false; }
    this.counts[t.id]--;
    this.game.events?.emit('shell.fire', { id: t.id, air: !ctx.player.grounded });
    const { camera, player, character, weapon } = ctx;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const ray = weapon.shotRay(camera, player, character, fwd);
    const muzzle = character.gunPoint('muzzle', new THREE.Vector3());
    this[t.id]({ ...ctx, ray, muzzle, fwd });
    // every shell kicks hard and needs racking
    const k = T.shells.kick * THREE.MathUtils.lerp(1, T.recoil.adsMult, weapon.adsEase);
    player.addRecoil(T.recoil.kickPitch * k, (simRand() * 2 - 1) * T.recoil.kickYaw * k);
    player.fovPunch = 4;
    weapon.kickV += 1.5 * T.recoil.gunRecoverSpeed * Math.E;
    this.game.fx.muzzleFlash(muzzle, new THREE.Vector3(1, 0, 0).applyQuaternion(character.gun.quaternion));
    weapon.ejectShell(character, player);
    weapon.moves?.shot(); // (the arms' recoil, over the aim: gunmoves.js)
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

  // ---- THE CLEAVE ---------------------------------------------------------
  // A line of light, four metres wide, that flies out from the muzzle along the aim, level or upright, and cuts in two everything it
  // passes through: pots, crates, the sliced halves of either, clapperjars, and anything in the world tagged sliceable (tags.js: the
  // dunes' ruined columns). It is stopped by what is not. The plane of the cut is the plane the line sweeps.
  // Prior art: Dead Space's plasma cutter (a line of three beams, turned from level to upright by its alt-fire, made for cutting
  // limbs: aim the line across the thing), and the thrown sword-beams of Zelda (a cut that travels).
  slicer({ camera, ray, muzzle }) {
    const g = this.game, C = T.shells.slicer;
    const fwd = ray.dir.clone().normalize();
    const along = new THREE.Vector3(this.cleaveUpright ? 0 : 1, this.cleaveUpright ? 1 : 0, 0).applyQuaternion(camera.quaternion);
    along.addScaledVector(fwd, -along.dot(fwd)).normalize();
    const n = new THREE.Vector3().crossVectors(fwd, along).normalize();
    // how far it can go: to the first thing in its path that it cannot cut
    const hit = g.physics.raycast(ray.origin, fwd, C.range, g.player.collider, undefined, (c) => {
      const e = g.physics.entityOf(c); const b = c.parent();
      return !c.isSensor() && !(e && (hasTag(e, 'sliceable') || e.type === 'clapper')) && !b?.isDynamic();
    });
    const range = hit ? hit.distance : C.range;
    const mesh = this.cleaveMesh();
    const cl = { o: ray.origin.clone(), fwd, along, n, plane: planeFrom(n, ray.origin), d: 0, range, done: new Set(), cuts: 0, mesh, from: muzzle.clone() };
    this.cleaves ||= [];
    this.cleaves.push(cl);
    sfx.slice();
    g.clappers?.spook(ray.origin.clone().addScaledVector(fwd, range));
  }

  /** The line's look: a bright bar across the flight with a node at each end and one in the middle (the cutter's three beams). */
  cleaveMesh() {
    const g = new THREE.Group();
    const W = T.shells.slicer.width;
    const mat = new THREE.MeshBasicMaterial({ color: 0xffb27a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.07), mat); g.add(bar);
    const core = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.98, 0.022), new THREE.MeshBasicMaterial({ color: 0xfff4e6, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    core.position.z = 0.001; g.add(core);
    for (const x of [-W / 2, 0, W / 2]) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.09, 10), mat); d.position.x = x; g.add(d); }
    for (const m of g.children) m.renderOrder = 8;
    g.userData.zoneFree = true;
    this.game.scene.add(g);
    return g;
  }

  /** Fly the lines: sweep each step's slab of space and cut what is in it. */
  updateCleaves(dt) {
    if (!this.cleaves?.length) return;
    const g = this.game, B = g.breakables, C = T.shells.slicer;
    const _c = new THREE.Vector3(), _s = new THREE.Sphere();
    for (let i = this.cleaves.length - 1; i >= 0; i--) {
      const cl = this.cleaves[i];
      const d0 = cl.d, d1 = Math.min(cl.range, cl.d + C.speed * dt);
      cl.d = d1;
      const W2 = C.width / 2;
      // what is in the slab between d0 and d1 (a sphere round each thing: its centre within reach of the line, the plane through it)
      const test = (ent, center, r) => {
        _c.copy(center).sub(cl.o);
        const s = _c.dot(cl.fwd);
        if (s < d0 - r || s > d1 + r) return false;
        if (Math.abs(_c.dot(cl.along)) > W2 + r * 0.5) return false;
        return Math.abs(_c.dot(cl.n)) < r * 0.85;
      };
      const sphereOf = (ent) => {
        const m = ent.mesh;
        if (!m?.geometry) return null;
        if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
        m.updateMatrixWorld();
        return _s.copy(m.geometry.boundingSphere).applyMatrix4(m.matrixWorld);
      };
      const cut = (ent) => {
        if (cl.done.has(ent)) return;
        const sp = sphereOf(ent);
        if (!sp || !test(ent, sp.center, sp.radius)) return;
        cl.done.add(ent);
        const pieces = B.slice(ent, cl.plane, cl.fwd);
        if (pieces) { cl.cuts++; for (const pc of pieces) cl.done.add(pc); g.events?.emit('cleave.cut', { what: ent.kind || ent.type }); }
      };
      for (const ent of [...B.items]) if (!ent.def?.hang) cut(ent);
      for (const ent of [...B.slices]) cut(ent);
      for (const ent of [...(g.level?.dynamic || [])]) if (hasTag(ent, 'sliceable')) cut(ent);
      for (const ent of registered('sliceable')) cut(ent);
      for (const c of g.clappers?.list || []) {
        if (cl.done.has(c) || !c.alive) continue;
        if (test(c, c.pos.clone().setY(c.pos.y + 0.4), 0.55)) { cl.done.add(c); g.clappers.hit(c, c.pos.clone().setY(c.pos.y + 0.4), cl.fwd, 1.2, 'sliced'); cl.cuts++; }
      }
      // the line, where it has got to
      const at = cl.o.clone().addScaledVector(cl.fwd, d1);
      const m = cl.mesh;
      m.position.copy(at);
      m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(cl.along, cl.n, cl.fwd));
      const k = d1 / Math.max(1, cl.range);
      m.children.forEach((c) => { c.material.opacity = 0.9 * (1 - k * k * 0.6); });
      if (d1 >= cl.range) {
        g.scene.remove(m);
        m.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
        this.cleaves.splice(i, 1);
        g.fx.impact?.(at, cl.fwd.clone().negate(), { sparks: 10, dust: 6 });
        if (cl.cuts) { g.hud.hitmarker(true); g.events?.emit('shell.slice', { cuts: cl.cuts }); }
      }
    }
  }

  ricochet(ctx) { this.specials.ricochet(ctx); }
  homing(ctx) { this.specials.homing(ctx); }
  groove(ctx) { this.casters.groove(ctx); }
  anchor(ctx) { this.casters.anchor(ctx); }
  hatch(ctx) { this.casters.hatch(ctx); }

  /** A ring of force from a point (the god hand's push): everything loose in range goes outward and up. */
  pushBurst(point, R, k) {
    const g = this.game;
    g.physics.world.forEachRigidBody((b) => {
      if (!b.isDynamic() || g.physics.links.has(b.handle)) return;
      const t = b.translation();
      _v.set(t.x - point.x, t.y - point.y, t.z - point.z);
      const d = _v.length();
      if (d > R || d < 1e-3) return;
      const ent = b.numColliders() ? g.physics.entityOf(b.collider(0)) : null;
      if (ent?.type === 'player') return;
      _v.divideScalar(d);
      const f = k * Math.pow(1 - d / R, 0.6) * b.mass();
      g.physics.kick(b, { x: _v.x * f, y: (Math.max(0, _v.y) * k * 0.5 + k * 0.25) * b.mass() * (1 - d / R), z: _v.z * f });
    });
    for (const c of g.clappers.list) {
      const d = c.pos.distanceTo(point);
      if (d < R) g.clappers.knock(c, _v.subVectors(c.pos, point).setY(0.5).normalize().multiplyScalar(k * 0.7 * (1 - d / R)));
    }
    g.fx.shockwave?.(point, R * 0.35);
    sfx.push();
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
      body.applyTorqueImpulse({ x: (simRand() - 0.5) * m * k * 0.1, y: 0, z: (simRand() - 0.5) * m * k * 0.1 }, true);
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
      : kind === 'slip' ? new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), new THREE.MeshStandardMaterial({ color: PALETTE.pale, roughness: 0.3 }))
      : kind === 'groove' ? new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), new THREE.MeshStandardMaterial({ color: 0xdff4ff, flatShading: true, metalness: 0.4, roughness: 0.15, emissive: 0x9a5cff, emissiveIntensity: 1 }))
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

  slip({ ray, muzzle }) {
    this.launch('slip', muzzle, ray.dir, T.shells.slip.speed, T.shells.slip.lift);
    sfx.thump();
  }

  /** A slip ball bursts: liquid clay everywhere, harmless, and wet enough to dive into. */
  burstSlip(pos, normal = UP) {
    const g = this.game, S = T.shells.slip;
    sfx.splosh(g.listenerDistance(pos));
    for (let k = 0; k < S.droplets; k++) {
      const v = randDir(simRand, new THREE.Vector3());
      v.addScaledVector(normal, 0.6).normalize().multiplyScalar(2 + simRand() * S.spread);
      this.addDroplet(pos.clone().addScaledVector(normal, 0.1), v, 0.04 + simRand() * 0.06, true);
    }
    // a big wet patch right where it hit (a wall too)
    this.addSplat(pos.clone().addScaledVector(normal, -0.08), normal, S.patch * 2.2, true);
    g.slip?.addDisc(pos.clone().addScaledVector(normal, -0.1), normal, S.patch, T.tech.slip.coverLife, 0, 'courier');
    g.events?.emit('slip.splat', {});
  }

  stepProjectiles(dt) {
    const g = this.game;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;
      p.prev.copy(p.pos);
      const grav = p.kind === 'well' ? T.shells.well.gravity : T.physics.gravity;
      if (p.kind === 'groove') p.mesh.rotation.y += dt * 10;
      p.vel.y -= grav * dt;
      const step = p.vel.clone().multiplyScalar(dt);
      const len = step.length();
      const hit = len > 1e-5 ? g.physics.raycast(p.pos, step.clone().divideScalar(len), len + 0.08, g.player.collider, undefined, (c) => !c.isSensor()) : null;
      let detonate = p.age > (p.kind === 'well' ? T.shells.well.maxFlight : T.shells.bomb.fuse);
      if (hit) {
        const ent = hit.entity;
        p.pos.copy(hit.point).addScaledVector(hit.normal, 0.1);
        if (p.kind === 'well' || p.kind === 'slip' || p.kind === 'groove' || ent?.type === 'breakable' || ent?.type === 'clapper' || p.bounces >= T.shells.bomb.bounces) detonate = true;
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
      if (p.kind === 'bomb' && simRand() < 0.6) g.fx.add.emit({ pos: p.pos, vel: randDir(simRand, new THREE.Vector3()), life: 0.3, size: 0.04, sizeEnd: 0.01, color: GLOW, drag: 2 });
      if (p.kind === 'well') g.fx.chargeTick(p.pos, 1, dt);
      if (detonate) {
        g.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        if (p.kind === 'well') this.openWell(p.pos.clone().addScaledVector(p.normal || UP, 0.5));
        else if (p.kind === 'slip') this.burstSlip(p.pos.clone(), p.normal || UP);
        else if (p.kind === 'groove') this.casters.openGroove(p.pos.clone().addScaledVector(p.normal || UP, 1.0));
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
      r.rotation.set(simRand() * 3, simRand() * 3, 0);
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
    if (n) { g.events?.emit('shell.mark', { n }); g.hud.hitmarker(false); }
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
      const v = randDir(simRand, new THREE.Vector3());
      v.addScaledVector(normal, 0.8).normalize().multiplyScalar(3 + simRand() * 7);
      this.addDroplet(pos.clone().addScaledVector(normal, 0.1), v, 0.025 + simRand() * 0.05);
    }
    // the pool: find the ground below and leave a hot puddle
    const down = g.physics.raycast(pos.clone().addScaledVector(UP, 0.2), new THREE.Vector3(0, -1, 0), 3, g.player.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    if (down) this.addPool(down.point, down.normal);
  }

  // ---- liquid clay (tools/psygun/spatter.js); kept here for the many that throw it through game.shells
  addDroplet(pos, vel, r, slip) { this.spatter.addDroplet(pos, vel, r, slip); }
  addSplat(point, normal, size, slip) { this.spatter.addSplat(point, normal, size, slip); }
  addPool(point, normal, slip) { this.spatter.addPool(point, normal, slip); }
  spill(center, dir, amount) { this.spatter.spill(center, dir, amount); }

  // ---- per-frame -------------------------------------------------------------
  fixedUpdate(dt) {
    this.stepProjectiles(dt);
    this.stepWells(dt);
    this.spatter.fixedUpdate(dt);
    this.specials.fixedUpdate(dt);
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
        const a = simRand() * Math.PI * 2, r = T.shells.well.radius * (0.4 + simRand() * 0.5);
        const p = w.pos.clone().add(new THREE.Vector3(Math.cos(a) * r, (simRand() - 0.5) * 2, Math.sin(a) * r));
        const v = w.pos.clone().sub(p).multiplyScalar(1.6).add(new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(4));
        g.fx.add.emit({ pos: p, vel: v, life: 0.5, size: 0.04, sizeEnd: 0.01, color: GLOW, drag: 0.5 });
      }
    }
    this.spatter.update(dt);
    // marks tick down
    for (const ent of this.marked) {
      ent.markT -= dt;
      if (ent.markMesh) ent.markMesh.visible = ent.markT > 2 || Math.sin(now * 20) > 0;
      if (ent.markT <= 0 || !ent.alive) this.unmark(ent);
    }
    this.glowOutline.opacity = 0.55 + 0.3 * Math.sin(now * 6);
    this.xray.opacity = 0.18 + 0.08 * Math.sin(now * 6);
    this.updateCleaves(dt);
    this.specials.update(dt);
    this.casters.update(dt);
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
    this.spatter.clear();
    g.slip?.clear();
    for (const e of [...this.marked]) this.unmark(e);
    this.specials.clear();
    this.casters.clear();
    this.projectiles = []; this.wells = [];
  }
}
