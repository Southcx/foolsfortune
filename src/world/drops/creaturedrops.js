// ---------------------------------------------------------------------------------------
// A CREATURE'S DROPS, IN THE WORLD: what falls out of a creature the Courier brought down, as a flat sprite facing the camera (a
// billboard: South, 2026-11-01), thrown up out of the body, bouncing to rest, bobbing over a soft ring; walked into, or within the
// magnet's reach, it flies to the Courier and goes into the Pneuka Box. The rules are progress/creaturedrops.js (what, how many);
// the sprites are Calissa's (`game.dropSprites.texture(category)`, 48 x 48, nearest-filtered); until hers stand, each is a placeholder
// drawn here from its item's colour and glyph. A full Box leaves it to the ground (pneuka/ground.js: kept, picked with F), so nothing
// is lost. A drop not taken fades after DROPS.life real seconds (the floor is not a store; the Box's storage is).
//
// A down is seen, not asked for: each frame the creatures the Courier struck (`c.touched`) that have gone down drop once, so no body
// module is edited for it. Events (with `by`): drop.fall { item, cat, kind, rare, by } as each is thrown, drop.take { item, cat, by } as
// it reaches the Box.
//
// Prior art: Kingdom Hearts and Diablo (loot bursts out and the walk takes it), Old School RuneScape (a full inventory leaves it on the
// floor), Doom and Minecraft's billboard pickups (a sprite turned to the eye reads from any angle, at a few pixels' cost).
//
//   game.creatureDrops = new CreatureDrops(game)   .update(dt)   .throw(at, drops, kind)   .list   .clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { rollDrops } from '../../progress/creaturedrops.js';
import { makeMaterial } from '../../progress/econ/materials.js';
import { yieldOf } from '../../progress/combat/emo.js';
import { luckOf } from '../../progress/luck.js';
import { itemOf } from '../../pneuka/items.js';
import { stream } from '../../core/rng.js';
import { RAPIER } from '../../core/physics.js';

const rand = stream('world/creaturedrops');

/** The numbers: a sprite's size (metres), its throw (up, out: m/s), gravity, the bounce kept, the bob, the reach it is walked into, the
 *  magnet's reach and pull, how long it waits (real s), the most on the ground at once (the oldest goes first). */
export const DROPS = { size: 0.42, up: [3.2, 4.6], out: [0.6, 1.6], g: 14, bounce: 0.35, bob: 0.06, take: 0.9, magnet: 2.6, pull: 9, life: 300, fade: 10, max: 40 };

export class CreatureDrops {
  constructor(game) {
    this.game = game; this.list = []; this.seen = new WeakSet(); this.tex = new Map(); this.primed = false;
    this.group = new THREE.Group(); this.group.name = 'creatureDrops'; game.scene?.add(this.group);
    this.ringGeo = new THREE.RingGeometry(0.12, 0.2, 20).rotateX(-Math.PI / 2);
  }

  /** A down's feeling: its own, else the weather's where it fell (the scatter's rule). */
  feelingOf(c) {
    const own = c.feeling ?? c.aspect; if (own) return own;
    const w = this.game.weather?.here?.(c.pos); return w?.aspect || null;
  }

  /** The sprite's picture: Calissa's when she has drawn it, else a placeholder from the item's colour and glyph (48 x 48, nearest). */
  textureOf(id, cat) {
    const theirs = cat ? this.game.dropSprites?.texture?.(cat) : null; if (theirs) return theirs;
    const key = cat || id; if (this.tex.has(key)) return this.tex.get(key);
    const it = itemOf(id), cv = document.createElement('canvas'); cv.width = cv.height = 48;
    const x = cv.getContext('2d'), col = `#${(it?.color ?? 0xd9c8ff).toString(16).padStart(6, '0')}`;
    x.fillStyle = '#1a1410'; x.beginPath(); x.arc(24, 24, 21, 0, Math.PI * 2); x.fill();
    x.fillStyle = col; x.beginPath(); x.arc(24, 24, 18, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#1a1410'; x.font = 'bold 22px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(it?.glyph || '?', 24, 25);
    const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
    this.tex.set(key, t); return t;
  }

  /** Throw these drops out of `at`. */
  throw(at, drops, kind) {
    const g = this.game, P = g.player;
    for (const d of drops) {
      while (this.list.length >= DROPS.max) this.remove(0);
      const a = rand() * Math.PI * 2, o = DROPS.out[0] + rand() * (DROPS.out[1] - DROPS.out[0]);
      const mat = new THREE.SpriteMaterial({ map: this.textureOf(d.id, d.cat), transparent: true, depthWrite: false });
      const sp = new THREE.Sprite(mat); sp.scale.setScalar(DROPS.size); sp.position.copy(at); sp.renderOrder = 2;
      const ring = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ color: d.rare ? 0xffd36a : 0xd9c8ff, transparent: true, opacity: 0, depthWrite: false }));
      this.group.add(sp, ring);
      const e = { ...d, sp, ring, pos: at.clone(), vel: new THREE.Vector3(Math.cos(a) * o, DROPS.up[0] + rand() * (DROPS.up[1] - DROPS.up[0]), Math.sin(a) * o), rest: false, floor: (P?.pos?.y ?? at.y) - 0.0, t: 0, fly: false };
      e.floor = this.floorAt(at, e.floor);
      this.list.push(e);
      g.events?.emit('drop.fall', { item: d.id, cat: d.cat, kind, ...(d.rare ? { rare: true } : {}), by: 'courier' });
    }
  }
  /** The ground under a point: a ray down through the fixed world (Rapier), from half a metre above it; the fallback (the Courier's
   *  feet) when nothing answers. */
  floorAt(p, fallback) {
    const world = this.game.physics?.world; if (!world) return fallback;
    this.ray ||= new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 });
    this.ray.origin = { x: p.x, y: p.y + 0.5, z: p.z };
    const h = world.castRay(this.ray, 6, true, RAPIER.QueryFilterFlags.ONLY_FIXED | RAPIER.QueryFilterFlags.EXCLUDE_SENSORS);
    const toi = h ? h.timeOfImpact ?? h.toi : null;
    return toi != null ? p.y + 0.5 - toi : fallback;
  }

  /** The downs since the last frame: each creature the Courier struck, down, drops once. */
  watch() {
    const g = this.game, list = g.creatures?.list || [];
    if (!this.primed) { for (const c of list) if (!c.alive) this.seen.add(c); this.primed = true; }
    for (const c of list) {
      if (c.alive || this.seen.has(c)) continue;
      this.seen.add(c);
      if (!c.touched || c.training || c.ally || c.aberrant || c.practice || g.mode === 'title') continue;
      const L = g.ledger, luck = L ? Math.max(-1, Math.min(1, (luckOf(L).level - 10) / 30)) : 0;
      const drops = rollDrops({ kind: c.kind, feeling: this.feelingOf(c), yield: yieldOf(c.emo ?? 0), luck }, rand);
      if (!drops.length) continue;
      const at = (c.center?.(new THREE.Vector3()) ?? c.pos.clone()); at.y += 0.2;
      this.throw(at, drops, c.kind);
    }
  }

  update(dt) {
    if (!this.game.creatures) return;
    this.watch();
    const P = this.game.player, me = P?.pos, cam = this.game.camera;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i]; e.t += dt;
      if (e.t > DROPS.life) { this.remove(i); continue; }
      const d = me ? Math.hypot(e.pos.x - me.x, e.pos.z - me.z) + Math.abs(e.pos.y - (me.y + 0.6)) * 0.5 : Infinity;
      if (e.rest && me && d < DROPS.magnet) e.fly = true;
      if (e.fly && me) { // (drawn to the chest; taken on arrival)
        const to = new THREE.Vector3(me.x, me.y + 0.9, me.z).sub(e.pos), n = to.length();
        if (n < DROPS.take * 0.6) { this.take(i); continue; }
        e.pos.addScaledVector(to.normalize(), Math.min(n, (DROPS.pull + e.t * 2) * dt));
      } else if (!e.rest) { // (thrown: falling, a bounce, then at rest)
        e.vel.y -= DROPS.g * dt; e.pos.addScaledVector(e.vel, dt);
        const floor = e.floor + DROPS.size * 0.5;
        if (e.pos.y < floor) { e.pos.y = floor; if (Math.abs(e.vel.y) > 1.2) { e.vel.y = -e.vel.y * DROPS.bounce; e.vel.x *= 0.5; e.vel.z *= 0.5; } else { e.rest = true; e.restY = floor; } }
      }
      e.sp.position.copy(e.pos);
      if (e.rest && !e.fly) e.sp.position.y = e.restY + DROPS.bob * Math.sin(e.t * 2.6 + i);
      e.ring.position.set(e.pos.x, (e.restY ?? e.floor) - DROPS.size * 0.5 + 0.02, e.pos.z);
      e.ring.material.opacity = e.rest && !e.fly ? 0.5 + 0.2 * Math.sin(e.t * 3) : 0;
      const left = DROPS.life - e.t; e.sp.material.opacity = left < DROPS.fade ? (Math.sin(e.t * 12) > 0 ? 1 : 0.35) : 1; // (blinking out its last seconds)
      if (cam && e.sp.position.distanceToSquared(cam.position) > 120 * 120) e.sp.visible = false; else e.sp.visible = true;
    }
  }

  /** Into the Pneuka Box (a material made with its own colour and path, remembering the weather it fell in). */
  take(i) {
    const e = this.list[i], g = this.game; this.remove(i);
    const data = e.mat ? makeMaterial(e.mat, Math.floor(rand() * 1e9), e.tier || 0, g.weather?.here?.(g.player?.pos)) : null;
    const slot = g.pneuka?.add(e.id, 'drop', 0, data);
    if (slot != null && slot >= 0) g.events?.emit('drop.take', { item: e.id, cat: e.cat, by: 'courier' });
  }
  remove(i) {
    const e = this.list[i]; if (!e) return;
    this.group.remove(e.sp, e.ring); e.sp.material.dispose(); e.ring.material.dispose(); this.list.splice(i, 1);
  }
  clear() { while (this.list.length) this.remove(0); }
}
