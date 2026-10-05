// ---------------------------------------------------------------------------------------
// THE SHORE: where Anagami's sand sea ends at the Emocean. Due east of the oasis the dunes flatten into a beach that runs down to a
// waterline of crude, and beyond it there is nothing but the sea to the horizon (the far high dunes that close every other bearing are
// parted there). It is not a room apart: it is the dunes' own ground (dunes.js localHeight asks `beachBlend` for the sector), so the
// sky, the wind and the skiff carry on across it; the barrier opens on the sector and stands instead a step out into the crude, and
// the jetty runs out past it, where the sloop will moor (E4).
//
// What Calissa dresses (vfx/shore.js): `shoreAt(x, z)` is the signed distance in metres to the waterline (negative at sea), and
// `shore` the waterline as a polyline (world points); `sea` is the placeholder surface she replaces with the crude sea.
//
// Prior art: Wind Waker's islands meeting the sea on a shelf of sand (the ground itself tells you where you can go), Journey's dunes
// that end at an edge you can see, and the open-world habit of an invisible wall a step into the water (Breath of the Wild's shallows).
//
//   beachBlend(lx, lz, h) -> h (dunes.js, inside the height function)   farMask(lx, lz) -> 0..1 (the far dunes' rise is lowered by it)
//   inSector(lx, lz, pad?)   const beach = new Beach(game, { center, heightAt, barrier })   beach.shoreAt(x, z)   beach.shore   beach.seaY
//   beach.jetty { from, end, top }   beach.landing() -> { pos, yaw }   (the zone is 'beach', the dunes' own ground: render/zones.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { GROUPS } from '../../core/physics.js';

export const SHORE = {
  angle: 0,          // the bearing of the shore from the oasis (radians, from +x): due east
  half: 0.2,         // half the sector's width, fully beach (about 11 degrees: some 190 m of waterline)
  fade: 0.12,        // and the dunes blending back in on either side
  from: 340, to: 420, // where, going out, the dunes give way to the beach
  r: 495,            // the waterline's radius, at the middle of the sector
  sea: 3,            // the sea's level, local to the dunes (DUNE.y + sea)
  slope: 0.06,       // the beach's fall toward the water
  shelf: 0.25,       // and the sea floor's, past it
  floor: -14,        // the deepest the sea floor goes (it is never walked: the wall stands a step out)
  wall: 2.5,         // how far into the crude the wall stands
};
const angOf = (lx, lz) => { let a = Math.atan2(lz, lx) - SHORE.angle; a = Math.atan2(Math.sin(a), Math.cos(a)); return Math.abs(a); };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** How much of the sector a bearing is in (1 inside, 0 outside, smooth between). */
export function sectorW(lx, lz) { return 1 - sstep(SHORE.half, SHORE.half + SHORE.fade, angOf(lx, lz)); }
export function inSector(lx, lz, pad = 0) { return angOf(lx, lz) < SHORE.half + SHORE.fade * 0.5 + pad; }
/** The beach's own ground at a radius: down to the waterline, then the shelf under the sea. */
export function beachGround(r) {
  return r < SHORE.r ? SHORE.sea + (SHORE.r - r) * SHORE.slope : Math.max(SHORE.floor, SHORE.sea - (r - SHORE.r) * SHORE.shelf);
}
/** The far dunes' rise is lowered in the sector (the horizon opens on the sea). */
export function farMask(lx, lz) { return 1 - sectorW(lx, lz); }
/** The dunes' height blended into the beach in the sector (lx, lz local to the dunes' centre). */
export function beachBlend(lx, lz, h) {
  const r = Math.hypot(lx, lz), w = sectorW(lx, lz) * sstep(SHORE.from, SHORE.to, r);
  return w > 0 ? h + (beachGround(r) - h) * w : h;
}

export class Beach {
  constructor(game, { center, heightAt, barrier }) {
    this.game = game;
    this.center = center.clone(); // (the dunes' centre: DUNE.x, DUNE.y, DUNE.z)
    this.heightAt = heightAt; this.ring = barrier; // (the dunes' height, and the radius of the ring the shore's wall closes)
    this.seaY = center.y + SHORE.sea;
    this.buildShore();
    this.buildSea();
    this.buildJetty();
  }

  /** Signed metres to the waterline: positive on land, negative at sea; far from the shore (outside the sector), a large positive. */
  shoreAt(x, z) {
    const lx = x - this.center.x, lz = z - this.center.z;
    const r = Math.hypot(lx, lz);
    if (r < SHORE.from || !inSector(lx, lz, 0.1)) return 999;
    const h = this.heightAt(x, z) - this.seaY;
    return r < SHORE.r ? h / SHORE.slope : h / SHORE.shelf;
  }

  /** Where the Index and `travel('shore')` set you down: on the sand a little inland of the jetty's foot, facing the sea. */
  landing() {
    const x = this.center.x + SHORE.r - JETTY.land - 14, z = this.center.z + 4;
    return { pos: new THREE.Vector3(x, this.heightAt(x, z) + 0.05, z), yaw: Math.PI / 2 };
  }

  /** The waterline, found along each bearing of the sector (where the ground meets the sea), and the wall a step beyond it. */
  buildShore() {
    const D = this, a0 = SHORE.angle - SHORE.half - SHORE.fade * 0.5, a1 = SHORE.angle + SHORE.half + SHORE.fade * 0.5, n = 40;
    this.shore = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n), cx = Math.cos(a), cz = Math.sin(a);
      let lo = SHORE.from, hi = SHORE.r + 40; // (bisect for the ground at sea level)
      for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (D.heightAt(this.center.x + cx * m, this.center.z + cz * m) > this.seaY) lo = m; else hi = m; }
      this.shore.push(new THREE.Vector3(this.center.x + cx * lo, this.seaY, this.center.z + cz * lo));
    }
    // the wall: a step into the crude along the waterline, with a gap where the jetty runs out (its own rails close it)
    const W = this.game.physics.world, body = W.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const jetHalf = JETTY.w / 2 + 0.6, y0 = this.seaY - 20, y1 = this.seaY + 260, h = (y1 - y0) / 2;
    for (let i = 0; i < this.shore.length - 1; i++) {
      const p = this.shore[i], q = this.shore[i + 1], out = (v) => { const d = new THREE.Vector3(v.x - this.center.x, 0, v.z - this.center.z).normalize(); return v.clone().addScaledVector(d, SHORE.wall); };
      const A = out(p), B = out(q), mid = A.clone().add(B).multiplyScalar(0.5), len = A.distanceTo(B) / 2 + 0.6;
      if (Math.abs(mid.z - this.center.z) < jetHalf + len) { // (the segment the jetty crosses: split round it)
        this.wallAround(W, body, A, B, y0 + h, h, jetHalf);
        continue;
      }
      const yaw = Math.atan2(B.x - A.x, B.z - A.z);
      W.createCollider(RAPIER.ColliderDesc.cuboid(0.5, h, len).setTranslation(mid.x, y0 + h, mid.z).setRotation(yawQ(yaw)).setCollisionGroups(GROUPS.static).setFriction(0), body);
    }
    this.buildSides(W, body, y0 + h, h);
  }
  /** The sector's two sides, from the ring out to the shore's wall, so the opening leads only to the beach. */
  buildSides(W, body, y, h) {
    const ends = [this.shore[0], this.shore[this.shore.length - 1]];
    for (const e of ends) {
      const a = Math.atan2(e.z - this.center.z, e.x - this.center.x), r0 = this.ring - 1, r1 = Math.hypot(e.x - this.center.x, e.z - this.center.z) + SHORE.wall + 1;
      const rm = (r0 + r1) / 2, mx = this.center.x + Math.cos(a) * rm, mz = this.center.z + Math.sin(a) * rm;
      W.createCollider(RAPIER.ColliderDesc.cuboid(0.5, h, (r1 - r0) / 2).setTranslation(mx, y, mz).setRotation(yawQ(Math.atan2(Math.cos(a), Math.sin(a)))).setCollisionGroups(GROUPS.static).setFriction(0), body);
    }
  }
  wallAround(W, body, A, B, y, h, jetHalf) {
    const z0 = this.center.z;
    for (const [P, Q] of [[A, B]]) {
      // the part of the segment with |z - z0| > jetHalf, on each side (the segment runs mostly along z here, the shore facing east)
      for (const side of [-1, 1]) {
        const za = side < 0 ? Math.min(P.z, Q.z) : z0 + jetHalf, zb = side < 0 ? z0 - jetHalf : Math.max(P.z, Q.z);
        if (zb - za < 0.2) continue;
        const t = (z) => (z - P.z) / ((Q.z - P.z) || 1e-6), xa = P.x + (Q.x - P.x) * t(za), xb = P.x + (Q.x - P.x) * t(zb);
        const mx = (xa + xb) / 2, mz = (za + zb) / 2, len = Math.hypot(xb - xa, zb - za) / 2 + 0.3;
        W.createCollider(RAPIER.ColliderDesc.cuboid(0.5, h, len).setTranslation(mx, y, mz).setRotation(yawQ(Math.atan2(xb - xa, zb - za))).setCollisionGroups(GROUPS.static).setFriction(0), body);
      }
    }
  }

  /** The placeholder sea (Calissa's crude sea replaces it: vfx/shore.js): a dark sheet from the shore to the horizon, the sector only. */
  buildSea() {
    const a0 = SHORE.angle - SHORE.half - SHORE.fade * 1.5, len = (SHORE.half + SHORE.fade * 1.5) * 2;
    // (laid flat, the ring's angle θ lands at atan2(z, x) = -θ: so the sector is asked for mirrored, which keeps it facing up)
    const geo = new THREE.RingGeometry(SHORE.from, 6000, 48, 1, -(a0 + len), len);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a1838, emissive: 0x120a1c, roughness: 0.35, metalness: 0.1 });
    this.sea = new THREE.Mesh(geo, mat);
    this.sea.position.set(this.center.x, this.seaY, this.center.z); this.sea.name = 'shore-sea'; this.sea.receiveShadow = true;
    this.game.scene.add(this.sea);
  }

  /** The jetty: a plank walk from the beach out over the crude, railed by the air (the wall's own), the sloop's mooring (E4). */
  buildJetty() {
    const g = this.game, L = g.level, W = g.physics.world, body = W.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const x0 = this.center.x + SHORE.r - JETTY.land, x1 = this.center.x + SHORE.r + JETTY.out, z = this.center.z, top = this.seaY + JETTY.deck;
    const len = x1 - x0, cx = (x0 + x1) / 2;
    L.box([cx, top - 0.15, z], [len, 0.3, JETTY.w], 0x8a6a48); // (the deck)
    for (let x = x0 + 2; x < x1; x += 5) for (const s of [-1, 1]) L.box([x, top - 2.2, z + s * (JETTY.w / 2 - 0.2)], [0.35, 4.2, 0.35], 0x5e4632, { collide: false });
    // (the rails: the air along the sides and across the end, so the deck is the only way out over the crude)
    const rail = (x, zz, hx, hz) => W.createCollider(RAPIER.ColliderDesc.cuboid(hx, 2, hz).setTranslation(x, top + 1.5, zz).setCollisionGroups(GROUPS.static).setFriction(0), body);
    const seaFrom = this.center.x + SHORE.r + SHORE.wall - 1; // (from where the wall leaves off)
    for (const s of [-1, 1]) rail((seaFrom + x1) / 2, z + s * (JETTY.w / 2 + 0.25), (x1 - seaFrom) / 2, 0.25);
    rail(x1 + 0.25, z, 0.25, JETTY.w / 2 + 0.5);
    this.jetty = { from: new THREE.Vector3(x0, top, z), end: new THREE.Vector3(x1 - 2, top, z), top };
  }
}
export const JETTY = { land: 6, out: 34, w: 3.2, deck: 1.1 };
const yawQ = (yaw) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
