// ---------------------------------------------------------------------------------------
// THE LURE: the Courier's mind, projected. A ghost of their mask on a line of light, tinted by the ASPECT they have chosen to think
// (dread, wonder, grief, desire, mirth, gall, fury), that floats where it lands, sinks when asked, comes home when reeled and is what the
// entities are drawn to. Also the ripples: rings of light spread on the water for a splash, a nibble, a bite.
// Gall and Fury also wear their paint's motif on the mask (vfx/paintmotifs.js), so neither is told by colour alone: Gall's curds (dark
// bumps, each with a pale skin) and Fury's cracks (the mask charred, split by lines of light).
//
//   air     thrown along an arc to where the cast was aimed (a ballistic lob solved for the flight time)
//   float   on the surface until it sinks toward `depthT` (RMB sinks it, the wheel sets it, reeling raises it); it HOLDS the depth it is
//           left at (it does not float back up: fighting buoyancy to keep a depth was no fun), and remembers it for the next cast (`pref`)
//   reel    drawn to the rod (LMB held) at reel speed
//   ground  it landed on something that is not water: it lies there, and nothing will bite
// `twitch` is the jig's memory (a hop that fish notice for a couple of seconds); `dip` is the spring the bites press on.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LURES, tasteOf, attraction } from './lures.js';
import { ASPECTS, knownAspects } from './species.js';
import { sfx } from '../../../audio/sfx.js';
import { stream } from '../../../core/rng.js';
const simRand = stream('tools/sondelass/angling/lure'); // (the simulation's chance: core/rng.js, the same twice)

const G = 9.81;
const _v = new THREE.Vector3(), _w = new THREE.Vector3();

/** Gall's and Fury's marks on the mask (`head`, an icosahedron of radius 0.085): curds round the crown and cheeks, cracks across the brow
 *  and down one cheek; each shown only while its aspect is on the lure (setAspect). The front (+Z, the eyes) is left clear. */
function maskMotifs(head) {
  const R = 0.085, onSkin = (x, y, z, lift = 1) => new THREE.Vector3(x, y, z).normalize().multiplyScalar(R * lift);
  const gall = new THREE.Group(), fury = new THREE.Group();
  const curd = new THREE.MeshStandardMaterial({ color: 0x2c1640, emissive: 0x3a1c5a, emissiveIntensity: 0.6, roughness: 0.25, flatShading: true }); // (wetter than the rest)
  const curdSkin = new THREE.MeshStandardMaterial({ color: 0xe8dcf4, emissive: 0x8a5ac8, emissiveIntensity: 0.35, roughness: 0.5, flatShading: true });
  const CURDS = [[0.2, 0.9, 0.1, 0.018], [-0.5, 0.75, -0.1, 0.014], [0.7, 0.5, -0.3, 0.012], [-0.85, 0.2, 0.2, 0.016], [0.9, -0.1, 0.3, 0.011], [-0.3, 0.6, -0.7, 0.013], [0.4, -0.2, -0.85, 0.017], [-0.6, -0.5, -0.4, 0.01], [0.1, 0.5, -0.9, 0.009]];
  for (const [x, y, z, r] of CURDS) {
    const p = onSkin(x, y, z, 0.96), n = p.clone().normalize();
    const d = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), curd); d.position.copy(p); gall.add(d);
    const sk = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.55, 0), curdSkin); sk.position.copy(p).addScaledVector(n, r * 0.6); gall.add(sk);
  }
  const crack = new THREE.MeshBasicMaterial({ color: 0xffc890, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  // (each crack a zigzag of directions on the mask, drawn as thin bars from one to the next)
  const CRACKS = [[[-0.1, 1, 0.35], [0.2, 0.85, 0.5], [0.05, 0.6, 0.8], [0.3, 0.35, 0.9]], [[0.2, 0.85, 0.5], [0.55, 0.75, 0.35], [0.8, 0.5, 0.35], [0.85, 0.15, 0.5]],
    [[-0.3, 0.9, 0.2], [-0.6, 0.7, 0.3], [-0.65, 0.35, 0.65], [-0.85, 0.05, 0.5]], [[0.8, 0.5, 0.35], [0.9, 0.35, -0.2], [0.7, 0.1, -0.7]]];
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _m = new THREE.Vector3();
  for (const pts of CRACKS) for (let i = 1; i < pts.length; i++) {
    _a.copy(onSkin(...pts[i - 1], 1.01)); _b.copy(onSkin(...pts[i], 1.01));
    const len = _a.distanceTo(_b), bar = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.003, len + 0.003), crack);
    bar.position.copy(_m.addVectors(_a, _b).multiplyScalar(0.5)).normalize().multiplyScalar(R * 1.012);
    bar.lookAt(_b); // (along the crack: +Z at the next point; it has no parent yet, so this is the mask's own frame)
    fury.add(bar);
  }
  gall.visible = fury.visible = false;
  head.add(gall, fury);
  return { gall, fury };
}

export class Ripples {
  constructor(scene, n = 10) {
    this.geo = new THREE.RingGeometry(0.92, 1, 28);
    this.geo.rotateX(-Math.PI / 2);
    this.list = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({ forceSinglePass: true, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      m.visible = false; m.renderOrder = 4;
      scene.add(m);
      this.list.push({ m, t: 1, life: 1, r: 1 });
    }
  }
  /** A ring at (x, y, z): grows to radius r over `life` seconds. */
  ring(x, y, z, r = 1, color = 0xffffff, life = 1.3) {
    const s = this.list.find((q) => q.t >= q.life) || this.list[0];
    s.t = 0; s.life = life; s.r = r;
    s.m.material.color.set(color);
    s.m.position.set(x, y + 0.02, z);
    s.m.visible = true;
  }
  update(dt) {
    for (const q of this.list) {
      if (q.t >= q.life) { q.m.visible = false; continue; }
      q.t += dt;
      const k = Math.min(1, q.t / q.life);
      q.m.scale.setScalar(Math.max(0.02, q.r * (1 - (1 - k) * (1 - k))));
      q.m.material.opacity = 0.75 * (1 - k) * (1 - k);
    }
  }
}

export class Lure {
  constructor(game, ripples) {
    this.game = game;
    this.ripples = ripples;
    this.state = 'none';
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.prev = new THREE.Vector3();
    this.aspect = 0; this.depth = 0; this.depthT = 0; this.pref = 0;
    this.echo = null;
    this.item = LURES[0]; // (what is tied on: lures.js; its taste is what the fish come to)
    this.boost = ASPECTS.map(() => 0); // (what the soundings have pushed into it: fades)
    this._taste = ASPECTS.map(() => 0); this._known = ASPECTS.map(() => true);
    this.speed = 0; this.twitch = 0; this.dip = 0; this.dipV = 0; this.attention = 0; this.claimed = false;
    this.pool = null; this.ground = 0;
    const g = (this.group = new THREE.Group());
    g.visible = false;
    const m = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.4, flatShading: true, ...o });
    this.skin = m(0xf3c9a8, { emissive: 0xffb27a, emissiveIntensity: 0.9 });
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.085, 1), this.skin);
    head.scale.set(1, 1.1, 0.9);
    g.add(head);
    const eyeM = new THREE.MeshBasicMaterial({ color: 0x1c0d08 });
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.02), eyeM); e.position.set(s * 0.038, 0.012, 0.075); g.add(e); }
    this.motifs = maskMotifs(head);
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: game.fx.haloTexture, color: 0xffb27a, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.halo.scale.setScalar(0.75);
    g.add(this.halo);
    game.scene.add(g);
    // the plumb line: a thread of light from the lure up to the surface, so that its depth can be read where it is
    this.plumbGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]);
    this.plumb = new THREE.Line(this.plumbGeo, new THREE.LineBasicMaterial({ color: 0xffb27a, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.plumb.frustumCulled = false; this.plumb.visible = false; this.plumb.renderOrder = 4;
    game.scene.add(this.plumb);
    this.plumbRing = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.2, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ forceSinglePass: true, color: 0xffb27a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.plumbRing.visible = false; this.plumbRing.renderOrder = 4;
    game.scene.add(this.plumbRing);
    this.moteT = 0;
  }

  get inWater() { return this.state === 'float' || this.state === 'reel'; }
  get active() { return this.state !== 'none'; }
  get color() { return ASPECTS[this.aspect].color; }

  setAspect(a) {
    this.aspect = a;
    const c = new THREE.Color(ASPECTS[a].color), id = ASPECTS[a].id;
    this.motifs.gall.visible = id === 'gall'; this.motifs.fury.visible = id === 'fury';
    this.skin.color.setHex(id === 'fury' ? 0x5a2418 : 0xf3c9a8); // (Fury's mask is charred, its cracks lit)
    this.skin.emissiveIntensity = id === 'fury' ? 0.55 : 0.9;
    this.skin.emissive.copy(c);
    this.halo.material.color.copy(c);
    this.plumb.material.color.copy(c); this.plumbRing.material.color.copy(c);
  }

  /** Throw from `from` to land at `to` (the flight's time follows the distance). */
  cast(from, to, aspect) {
    this.setAspect(aspect);
    this.state = 'air';
    this.pos.copy(from); this.prev.copy(from);
    const d = _v.subVectors(to, from).length();
    this.T = THREE.MathUtils.clamp(0.42 + d * 0.028, 0.5, 1.5);
    this.vel.copy(to).sub(from).multiplyScalar(1 / this.T);
    this.vel.y += 0.5 * G * this.T;
    this.target = to.clone();
    this.t = 0; this.depth = 0; this.depthT = 0; this.attention = 0; this.claimed = false; this.twitch = 0; this.dip = 0; this.dipV = 0;
    this.boost.fill(0);
    this.group.visible = true;
  }

  /** How much a species wants this lure now: its taste and the soundings' push, against the species' own (lures.js). */
  tasteFor(sp) { return attraction(tasteOf(this.item, this.boost, this._taste, knownAspects(this.game, this._known)), sp); } // (a sounding's push counts only once known)
  /** A sounding: the aspect pushed into the lure for a while. */
  push(aspect, k = 0.9) { this.boost[aspect] = Math.min(1.2, this.boost[aspect] + k); }

  retrieve() { this.state = 'none'; this.group.visible = false; this.claimed = false; this.plumb.visible = false; this.plumbRing.visible = false; }

  /** The bites: a spring pressed down. */
  nudge(k) { this.dipV -= k * 9; }
  jig() { this.twitch = 2.4; this.dipV += 2.4; this.ripples.ring(this.pos.x, this.poolY(), this.pos.z, 0.9, this.color, 1.0); sfx.plink(4); }
  poolY() { return this.pool ? this.pool.surface : this.pos.y; }

  /** ctx: { poolAt(x, z) -> pool|null, ground(x, z, y) -> y|null, player: Vector3, reeling, sinking, reelSpeed, dt } */
  update(dt, ctx) {
    if (this.state === 'none') return;
    this.twitch = Math.max(0, this.twitch - dt);
    for (let i = 0; i < this.boost.length; i++) this.boost[i] *= Math.exp(-dt / 7); // (a sounding's push lasts some seconds)
    // the dip spring
    this.dipV += (-90 * this.dip - 11 * this.dipV) * dt;
    this.dip += this.dipV * dt;
    this.prev.copy(this.pos);
    if (this.state === 'air') {
      this.t += dt;
      this.vel.y -= G * dt;
      this.pos.addScaledVector(this.vel, dt);
      if (this.t >= this.T) this.land(ctx);
    } else if (this.state === 'float' || this.state === 'reel') {
      const P = this.pool;
      this.state = ctx.reeling ? 'reel' : 'float';
      if (ctx.reeling) {
        const to = _v.set(ctx.player.x - this.pos.x, 0, ctx.player.z - this.pos.z);
        const d = to.length();
        if (d < 1.8) { this.retrieve(); ctx.onHome?.(); return; }
        this.pos.addScaledVector(to.multiplyScalar(1 / d), Math.min(d, ctx.reelSpeed * dt));
        this.depthT = Math.max(0, this.depthT - 2.5 * dt);
        // out of the pool: onto the deck it goes
        if (!ctx.poolAt(this.pos.x, this.pos.z)) { this.state = 'ground'; this.pool = null; this.pos.y = (ctx.ground?.(this.pos.x, this.pos.z, this.pos.y + 1) ?? this.pos.y - 0.4) + 0.1; return; }
      }
      // (the depth is only ever changed on purpose: it sinks while asked to, is set by the wheel, and rises as it is reeled in)
      const asked = (ctx.sinking ? 1.15 * dt : 0) + (ctx.depthNudge || 0);
      if (asked) { this.depthT += asked; }
      const floor = P ? P.depthAt(this.pos.x, this.pos.z) - 0.25 : 1;
      this.depthT = THREE.MathUtils.clamp(this.depthT, 0, Math.min((P?.maxDepth ?? 8) - 0.4, Math.max(0, floor)));
      if (asked && !ctx.reeling) this.pref = this.depthT; // (what it will sink to, next cast)
      this.depth += THREE.MathUtils.clamp((this.depthT - this.depth) * 4 * dt, -2.8 * dt, 2.8 * dt); // (eased, and never faster than it can sink)
      this.pos.y = (P ? P.surface : this.pos.y) - this.depth + (this.depth < 0.15 ? Math.sin(performance.now() * 0.0018 + this.pos.x) * 0.012 : 0);
    } else if (this.state === 'ground') {
      if (ctx.reeling) {
        const to = _v.set(ctx.player.x - this.pos.x, 0, ctx.player.z - this.pos.z);
        const d = to.length();
        if (d < 1.8) { this.retrieve(); ctx.onHome?.(); return; }
        this.pos.addScaledVector(to.multiplyScalar(1 / d), Math.min(d, ctx.reelSpeed * dt));
        const gy = ctx.ground?.(this.pos.x, this.pos.z, this.pos.y + 1);
        if (gy != null) this.pos.y = gy + 0.1;
      }
    }
    this.speed = _v.subVectors(this.pos, this.prev).length() / Math.max(dt, 1e-4);
    if (this.state === 'air') this.speed = 0;
    // the object
    const g = this.group;
    g.position.copy(this.pos); g.position.y += this.dip * 0.6 + (this.state === 'float' ? 0.06 : 0);
    if (ctx.player) g.rotation.y = Math.atan2(ctx.player.x - this.pos.x, ctx.player.z - this.pos.z);
    const pulse = 0.8 + 0.2 * Math.sin(performance.now() * 0.004);
    this.halo.scale.setScalar((0.6 + 0.12 * this.attention) * pulse * (this.state === 'ground' ? 0.5 : 1));
    // the plumb line, when it is down in the water
    const under = this.inWater && this.pool && this.depth > 0.25;
    this.plumb.visible = this.plumbRing.visible = !!under;
    if (under) {
      const p = this.plumbGeo.attributes.position, sy = this.pool.surface;
      p.setXYZ(0, this.pos.x, this.pos.y, this.pos.z); p.setXYZ(1, this.pos.x, sy, this.pos.z); p.needsUpdate = true;
      this.plumb.material.opacity = 0.18 + 0.3 * Math.min(1, this.depth / 3);
      this.plumbRing.position.set(this.pos.x, sy + 0.03, this.pos.z);
      this.plumbRing.scale.setScalar(0.8 + 0.25 * Math.min(1, this.depth / 4));
    }
    // a few motes rising from it (the projected mind, unravelling a little)
    this.moteT -= dt;
    if (this.moteT <= 0 && this.state !== 'air') {
      this.moteT = 0.16;
      const fx = this.game.fx;
      fx.add.emit({ pos: _w.copy(this.pos).add(_v.set((simRand() - 0.5) * 0.1, 0.1, (simRand() - 0.5) * 0.1)), vel: _v.set(0, 0.3, 0), life: 1.1, size: 0.035, sizeEnd: 0.005, color: new THREE.Color(this.color), alpha: 0.7, drag: 1, floor: -100 });
    }
  }

  land(ctx) {
    const pool = ctx.poolAt(this.pos.x, this.pos.z);
    if (pool && this.pos.y <= pool.surface + 0.4) {
      this.pool = pool; this.state = 'float'; this.pos.y = pool.surface;
      this.depth = 0; this.depthT = Math.min(this.pref, Math.max(0, pool.depthAt(this.pos.x, this.pos.z) - 0.25), pool.maxDepth - 0.4); this.dipV = -3;
      this.ripples.ring(this.pos.x, pool.surface, this.pos.z, 1.7, this.color, 1.6);
      this.ripples.ring(this.pos.x, pool.surface, this.pos.z, 0.8, 0xffffff, 0.9);
      sfx.splash(0.6); sfx.plink(0);
      this.game.events?.emit('lure.land', { water: true, x: this.pos.x, z: this.pos.z });
    } else {
      this.state = 'ground'; this.pool = null;
      const gy = ctx.ground?.(this.pos.x, this.pos.z, this.pos.y + 2);
      this.pos.y = (gy ?? this.pos.y) + 0.1;
      sfx.plink(-7);
      this.game.events?.emit('lure.land', { water: false, x: this.pos.x, z: this.pos.z });
    }
  }
}
