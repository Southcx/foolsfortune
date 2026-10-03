import * as THREE from 'three';
import { PALETTE } from '../config.js';
import { makeWaterMaterial, waterGeometry } from '../vfx/water.js';

// Level features the environmental techs read: water volumes, ladders, and slip
// (liquid clay) coverage on floors and walls.

/**
 * Axis-aligned water: { x0, x1, z0, z1, bottom, surface, kind?: 'water' | 'lachryma', depthAt?(x, z) }. What it looks like is vfx/water.js's (banded, translucent,
 * with the painted sky in it); what it does to a swimmer is swim.js's, which reads only the volumes.
 */
export class Water {
  constructor(scene, sky = null) {
    this.scene = scene; this.sky = sky;
    this.volumes = [];
    this.time = 0;
    this.mats = {};
  }

  add(v) {
    this.volumes.push(v);
    const kind = v.kind || 'water';
    const mat = (this.mats[kind] ||= makeWaterMaterial(this.sky, kind));
    const m = new THREE.Mesh(waterGeometry(v), mat);
    m.position.set((v.x0 + v.x1) / 2, v.surface, (v.z0 + v.z1) / 2);
    m.renderOrder = 2;
    this.scene.add(m);
    return v;
  }

  /** The volume containing (x, y, z) - y anywhere from its bottom to 0.5 above the surface. */
  at(x, y, z) {
    for (const v of this.volumes) if (x > v.x0 && x < v.x1 && z > v.z0 && z < v.z1 && y > v.bottom - 0.5 && y < v.surface + 0.5) return v;
    return null;
  }

  update(dt) {
    this.time += dt;
    for (const m of Object.values(this.mats)) m.uniforms.uTime.value = this.time;
  }
}

/** Ladders: { x, z, y0, y1, n (outward normal, horizontal), width }. */
export class Ladders {
  constructor(scene) { this.scene = scene; this.list = []; }

  add(l) {
    l.n = l.n.clone().normalize();
    l.width = l.width || 0.6;
    this.list.push(l);
    return l;
  }

  /** Build the rails and rungs (static meshes via the level's box helper, no colliders). */
  build(L, rung = 0.3) {
    for (const l of this.list) {
      if (l.built) continue;
      l.built = true;
      const along = new THREE.Vector3(-l.n.z, 0, l.n.x);
      const face = new THREE.Vector3(l.x, 0, l.z).addScaledVector(l.n, 0.08);
      const rotY = Math.atan2(l.n.x, l.n.z);
      const h = l.y1 - l.y0;
      for (const s of [-1, 1]) {
        const p = face.clone().addScaledVector(along, s * l.width / 2);
        L.box([p.x, l.y0 + h / 2, p.z], [0.07, h + 0.3, 0.07], PALETTE.wood, { rotY, collide: false });
      }
      for (let y = l.y0 + rung; y < l.y1 - 0.05; y += rung) L.box([face.x, y, face.z], [l.width, 0.045, 0.045], PALETTE.wood, { rotY, collide: false, outline: false });
    }
  }

  /** The ladder in front of p (feet), within reach, or null. */
  near(p, reach = 0.75) {
    for (const l of this.list) {
      const dx = p.x - l.x, dz = p.z - l.z;
      const out = dx * l.n.x + dz * l.n.z; // distance out from the ladder's face
      const side = Math.abs(dx * -l.n.z + dz * l.n.x);
      if (out > 0 && out < reach && side < l.width / 2 + 0.25 && p.y > l.y0 - 0.3 && p.y < l.y1 - 0.2) return l;
    }
    return null;
  }
}

/**
 * Slip coverage: where liquid clay lies wet enough to dive into. Permanent patches
 * (rectangles on a plane: the lab's lanes and walls) and splats that dry out
 * (discs: slip shells, burst barrels).
 */
export class SlipField {
  constructor(scene, game = null) {
    this.scene = scene;
    this.rects = [];
    this.discs = [];
    // (wet slip is water to anything made of sand and water: ai/ecology.js)
    game?.ai?.eco.provide('slip', (pos, range) => this.discs.filter((d) => d.age > d.delay && d.life - d.age > 4 && d.r > 0.7 && d.n.y > 0.7 && d.c.distanceTo(pos) < range).slice(0, 6).map((d) => ({ pos: d.c, radius: d.r, ref: d })));
    this.mat = new THREE.MeshStandardMaterial({ color: PALETTE.pale, roughness: 0.25, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, emissive: PALETTE.pale, emissiveIntensity: 0.08 });
  }

  /** A permanent slip rectangle: centre c, normal n, in-plane half extents along u (and v = n x u). */
  addRect(c, n, u, hu, hv, visible = true) {
    const r = { c: c.clone(), n: n.clone().normalize(), u: u.clone().normalize(), hu, hv };
    r.v = new THREE.Vector3().crossVectors(r.n, r.u).normalize();
    this.rects.push(r);
    if (visible) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(hu * 2, hv * 2), this.mat);
      m.matrixAutoUpdate = false;
      m.matrix.makeBasis(r.u, r.v, r.n).setPosition(c.clone().addScaledVector(r.n, 0.012));
      m.renderOrder = 1;
      this.scene.add(m);
    }
    return r;
  }

  /** A splat that dries: wet (diveable) for `life` seconds, but not until it is `delay` seconds old (the Soul Brush's fresh trail
   *  under a sliding Courier must not pull them under the moment it is laid). */
  addDisc(c, n, r, life, delay = 0) {
    if (this.discs.length > 400) this.discs.shift();
    this.discs.push({ c: c.clone(), n: n.clone().normalize(), r, life, age: 0, delay });
  }

  update(dt) {
    for (let i = this.discs.length - 1; i >= 0; i--) {
      const d = this.discs[i];
      d.age += dt;
      if (d.age > d.life) this.discs.splice(i, 1);
    }
  }

  /**
   * Is there wet slip at p (within `depth` of a surface)? Optionally only on surfaces
   * facing `n` (dot > 0.7). Returns the surface normal, or null.
   */
  at(p, n = null, depth = 0.3) {
    for (const r of this.rects) {
      if (n && r.n.dot(n) < 0.7) continue;
      const d = new THREE.Vector3().subVectors(p, r.c);
      const h = d.dot(r.n);
      if (h < -0.15 || h > depth) continue;
      if (Math.abs(d.dot(r.u)) > r.hu || Math.abs(d.dot(r.v)) > r.hv) continue;
      return r.n;
    }
    for (const c of this.discs) {
      if (c.age < c.delay || (n && c.n.dot(n) < 0.7)) continue;
      const d = new THREE.Vector3().subVectors(p, c.c);
      const h = d.dot(c.n);
      if (h < -0.15 || h > depth) continue;
      if (d.addScaledVector(c.n, -h).length() > c.r) continue;
      return c.n;
    }
    return null;
  }

  clear() { this.discs.length = 0; }
}
