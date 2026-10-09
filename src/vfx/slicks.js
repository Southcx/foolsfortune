// ---------------------------------------------------------------------------------------
// SLICKS: crude thrown or welled up in a fight, drawn where it lies (Espada's word, docs/plans/LACHRYMA-LOOP.md section 0: crude
// underfoot is a blot, which stays and grows, or a slick, which oxidises and fades; the owner, 2026-10-09: "All Slip is now a form of
// Lachryma"). A creature's slip on the ground is a slick: the Great Slip Jelly's cast puddles (the Slick Trail's drops, the rings, the
// Decant, its slam), a spit glob landing, a burst jelly, a broken clutch, a gusher's spill. Fresh it is black and glossy, the oil film
// only at its rim and at a grazing look; it thins, and the film's bands come up through it, their hue walking; it goes to a pale sheen
// and soaks away (the oxidation ramp: vfx/oxidation.js, OXIDATION.slick). Diving into it is the slip's (courier/moves/env.js), and what
// the mop and Clean take of it is the paint map's (world/ground/paintmap.js `slick` cells): a slick laid there shrinks from its rim as
// they are taken, and lives as long as they do, or its own life if that is longer.
//
// Drawn with the blots' program (vfx/stains.js, `uSlick` 1): no program of its own. One mesh a slick, draped over the ground under it
// (a few rays a frame, so a cast's ten puddles never cost one frame), the newest drawn over the older; a spill inside a live slick
// feeds it instead of laying another; at most `max` at once, the oldest soaking away early to make room.
//
// Prior art: Super Mario Sunshine's goop (a creature's spill that lies on the ground and is hosed away, the shape of its splash),
// Splatoon's ink puddles (a decal with a glossy edge), the Bonn Agreement Oil Appearance Code (thick oil black, then metallic, rainbow,
// sheen: the slick's ramp), and decals draped over terrain by vertex (every sixth-generation blob shadow and scorch mark that followed
// the ground instead of floating over it).
//
//   game.slicks = new Slicks(game)   game.slicks.spill(pos, radius, life, { normal })   game.slicks.update(rawDt)   .list   .clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stainUniforms, stainMaterial, STAIN_R } from './stains.js';

const EDGE = 1.41; // (a slick's middle edge in the stain disc's own units (vfx/stains.js, uSlick): its mesh is scaled radius / EDGE)
const SEG = 12; // (the disc's grid, draped vertex by vertex)
const RAYS = 220; // (ground rays a frame for the draping: a cast's ten puddles drape over a frame or two)
const LIFT = 0.03; // (metres over the ground: with the program's polygon offset, the casebook's rule 1)
const FAR = 300; // (metres from the camera past which a slick is taken up: the place it lay in was left (a Well's floor, the bowl); the bowl is 140 m across)
const _o = new THREE.Vector3(), _down = new THREE.Vector3(0, -1, 0), _w = new THREE.Vector3();

export class Slicks {
  constructor(game, { max = 24, minRadius = 0.6 } = {}) {
    this.game = game; this.max = max; this.minRadius = minRadius;
    this.list = []; this.seq = 0; this.queue = [];
  }

  /** Crude spilled at `pos` (on the ground), `radius` metres, lying at least `life` real seconds. A spill inside a live slick feeds it
   *  (fresh again, its life the longer); one smaller than `minRadius` that falls on bare ground is not drawn (a jelly's trail draws its
   *  own path). On a wall (`normal` steep) it is not a slick. */
  spill(pos, radius, life = 30, { normal = null, seed = null } = {}) {
    if (!pos || !(radius > 0) || (normal && normal.y < 0.5)) return null;
    for (const s of this.list) {
      if (s.dying || Math.abs(s.y - pos.y) > 1 || Math.hypot(s.x - pos.x, s.z - pos.z) + radius > s.r * 1.1) continue; // (only one that falls within it: a bigger spill over it is a slick of its own, drawn over)
      s.age = Math.min(s.age, s.life * 0.12); s.life = Math.max(s.life, life); s.amount = 1;
      return s;
    }
    if (radius < this.minRadius) return null;
    const live = this.list.filter((s) => !s.dying);
    if (live.length >= this.max) this.soak(live[0]);
    if (this.list.length >= this.max + 8) this.remove(this.list[0]);
    const u = stainUniforms({ seed: seed ?? Math.random(), slick: 1 });
    const geo = new THREE.PlaneGeometry(2 * STAIN_R, 2 * STAIN_R, SEG, SEG);
    const mesh = new THREE.Mesh(geo, stainMaterial(u));
    mesh.name = 'slick'; mesh.rotation.x = -Math.PI / 2; mesh.position.set(pos.x, pos.y, pos.z);
    mesh.scale.set(radius / EDGE, radius / EDGE, 1); mesh.renderOrder = 1 + (this.seq++ % 10000) * 1e-4; // (the newest over the older: never by distance, which swaps as the camera moves)
    mesh.visible = false; mesh.frustumCulled = true;
    this.game.scene?.add(mesh); // (each its own top-level object: render/zones.js hides it with the place it lies in)
    const pm = this.game.paintmap, at = pm?.at(pos.x, pos.y, pos.z);
    const s = { mesh, u, x: pos.x, y: pos.y, z: pos.z, r: radius, age: 0, life: Math.max(1, life), amount: 1, dying: false, draped: 0,
      k0: at?.slick ? at.k : 0, cells0: at?.slick ? pm.count(pos.x, pos.y, pos.z, radius, 'slick') : 0, cellsLast: 0, check: 1, measured: false };
    s.cellsLast = s.cells0;
    this.list.push(s); this.queue.push(s);
    return s;
  }

  /** Make room: the slick soaks away over the next breath instead of vanishing. */
  soak(s) { s.dying = true; s.life = Math.min(s.life, s.age + Math.max(0.6, (1 - s.age / s.life) * 0.6)); }

  /** Once a frame (raw seconds): drape what is new, age every slick along the ramp, follow what the mop and Clean took of it. */
  update(raw = 1 / 60) {
    this.drape();
    const pm = this.game.paintmap, P = this.game.player?.pos, cam = this.game.camera?.position;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const s = this.list[i];
      if (cam && Math.hypot(cam.x - s.x, cam.y - s.y, cam.z - s.z) > FAR) { this.remove(s); continue; } // (left behind: nothing of a place stays when it is left)
      s.age += raw; s.u.uT.value += raw;
      if (pm && s.cells0 > 0 && (s.check -= raw) <= 0) this.follow(s, pm, P);
      const k = s.age / s.life;
      if (k >= 1 || s.amount < 0.04) { this.remove(s); continue; }
      s.u.uOx.value = k; s.u.uAmount.value += (s.amount - s.u.uAmount.value) * (1 - Math.exp(-raw * 6)); // (it shrinks from the rim as it is taken, never at once)
    }
  }

  /** The paint map's cells of it: how long they will last (measured once, a second in), and what the mop or Clean took. */
  follow(s, pm, P) {
    s.check = 0.25;
    if (!s.measured && s.age >= 1) {
      s.measured = true;
      const at = pm.at(s.x, s.y, s.z), rate = at?.slick ? (s.k0 - at.k) / s.age : 0;
      if (rate > 1e-4) s.life = Math.max(s.life, s.k0 / rate); // (as long as its crude lies there, if that is longer)
    }
    const n = pm.count(s.x, s.y, s.z, s.r, 'slick'), near = P && Math.hypot(P.x - s.x, P.z - s.z) < s.r + 14;
    if (n === 0 && s.cellsLast > 0.8 * s.cells0) { s.cells0 = 0; return; } // (all of it at once: its time ran out (or the map's window moved), not a mop)
    if (near && n < s.cellsLast) s.amount = Math.min(s.amount, n / s.cells0);
    s.cellsLast = n;
  }

  /** Lay the new ones over the ground under them, a few rays a frame. */
  drape() {
    let budget = RAYS;
    while (this.queue.length && budget > 0) {
      const s = this.queue[0];
      if (!this.list.includes(s)) { this.queue.shift(); continue; }
      const pos = s.mesh.geometry.attributes.position, n = pos.count;
      if (!s.draped) s.mesh.updateMatrixWorld(true);
      while (s.draped < n && budget > 0) {
        const i = s.draped++; budget--;
        _w.set(pos.getX(i), pos.getY(i), 0).applyMatrix4(s.mesh.matrixWorld);
        pos.setZ(i, this.groundAt(_w.x, s.y, _w.z, 0.12 + 0.09 * Math.hypot(_w.x - s.x, _w.z - s.z)) - s.y + LIFT); // (the mesh lies flat: its local z is the world's up)
      }
      if (s.draped >= n) { pos.needsUpdate = true; s.mesh.geometry.computeBoundingSphere(); s.mesh.visible = true; this.queue.shift(); }
    }
  }

  /** The static ground under (x, z) within `rise` of height y (a slope of 5 degrees from the middle, so a dish is followed but a chest, a
   *  dummy or a step up beside it is not climbed: a ray onto the debug chest once drew the slick up its sides), else y. */
  groundAt(x, y, z, rise = 0.5) {
    const hit = this.game.physics?.raycast(_o.set(x, y + rise + 0.05, z), _down, 2 * rise + 2, undefined, undefined, (c) => !c.isSensor() && (!c.parent() || c.parent().isFixed()));
    return hit && hit.point.y <= y + rise ? hit.point.y : y;
  }

  remove(s) {
    const i = this.list.indexOf(s); if (i >= 0) this.list.splice(i, 1);
    s.mesh.parent?.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose();
  }

  clear() { for (const s of this.list.slice()) this.remove(s); this.queue.length = 0; }
}
