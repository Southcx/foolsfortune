// ---------------------------------------------------------------------------------------
// THE FLOCK: many bodies moving as one (docs/AI.md, "Flocking"). Where steer.js moves one creature on the ground, this moves a hundred
// in three dimensions at once: a school of fish, a murmuration of birds, a swarm of motes. Each member follows Reynolds' three rules
// over its neighbours (SEPARATION: not into each other; ALIGNMENT: the way they go; COHESION: toward their middle), plus whatever the
// one who owns the flock asks of each (a `seek`: a point to make for, with a weight; a `speed`: cruise, or a burst), turning no faster
// than `turn` radians a second, so a flock wheels and never snaps. Members are kept in flat arrays (no object a fish) and found
// through a spatial hash of cells a neighbourhood wide (numeric keys: no string a member a frame), so a hundred cost a hundred, not
// ten thousand. At the rail's scale (300 to 800 glints: RAIL-OVERHAUL.md section 5) a `stride` of 3 steers a third of the flock a frame
// in turn, each over the time since its own last turn, while every member flies on every frame (`node scripts/flock.mjs` measures it).
//
// Prior art: Craig Reynolds, "Flocks, Herds, and Schools: A Distributed Behavioral Model" (SIGGRAPH 1987), and his steering
// behaviours (GDC 1999); the spatial hash of every particle system since (Teschner et al., "Optimized Spatial Hashing for Collision
// Detection of Deformable Objects", 2003); the sardine run's bait ball and the moonfish of Finding Nemo for the mood a flock can be
// given from outside.
//
//   const F = new Flock({ max, sep: [r, w], align: [r, w], coh: [r, w], speed, turn, stride })
//   F.add(x, y, z, vx, vy, vz) -> i | -1   F.remove(i)   F.alive[i]   F.count   F.get(i, outPos, outVel?)   F.set(i, x, y, z)
//   F.step(dt, { seek(i, out) -> weight, speed(i) -> m/s })   (out: a THREE.Vector3 to fill with the point to make for)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** A cell's key as a number (1024 an axis, wrapping: cells that far apart are never neighbours that matter). */
const keyOf = (x, y, z) => ((x & 1023) << 20) | ((y & 1023) << 10) | (z & 1023);
const _g = new THREE.Vector3(), _v = new THREE.Vector3(), _d = new THREE.Vector3(), _s = new THREE.Vector3(), _a = new THREE.Vector3(), _c = new THREE.Vector3();

export class Flock {
  constructor({ max = 128, sep = [0.8, 1.6], align = [3, 1], coh = [4.5, 0.8], speed = 12, turn = 6, stride = 1 } = {}) {
    this.max = max; this.sep = sep; this.align = align; this.coh = coh; this.speed = speed; this.turn = turn; this.stride = Math.max(1, stride | 0); this.phase = 0;
    this.p = new Float32Array(max * 3); this.v = new Float32Array(max * 3); this.alive = new Uint8Array(max);
    this.cell = Math.max(sep[0], align[0], coh[0]); this.grid = new Map(); this.next = new Int32Array(max);
    this.count = 0;
  }

  add(x, y, z, vx = 0, vy = 0, vz = 1) {
    for (let i = 0; i < this.max; i++) if (!this.alive[i]) {
      this.alive[i] = 1; this.p.set([x, y, z], i * 3); this.v.set([vx, vy, vz], i * 3); this.count++;
      return i;
    }
    return -1;
  }
  remove(i) { if (this.alive[i]) { this.alive[i] = 0; this.count--; } }
  clear() { this.alive.fill(0); this.count = 0; }
  get(i, pos, vel = null) { const k = i * 3; pos.set(this.p[k], this.p[k + 1], this.p[k + 2]); if (vel) vel.set(this.v[k], this.v[k + 1], this.v[k + 2]); return pos; }
  set(i, x, y, z) { this.p.set([x, y, z], i * 3); }
  setVel(i, x, y, z) { this.v.set([x, y, z], i * 3); }

  /** The hash: each live member into the cell it is in (a linked list a cell; the key a number: 1024 cells an axis, wrapping far out). */
  hash() {
    const G = this.grid, c = this.cell; G.clear();
    for (let i = 0; i < this.max; i++) {
      if (!this.alive[i]) continue;
      const k = i * 3, key = keyOf(Math.floor(this.p[k] / c), Math.floor(this.p[k + 1] / c), Math.floor(this.p[k + 2] / c));
      const h = G.get(key); this.next[i] = h === undefined ? -1 : h; G.set(key, i);
    }
  }

  /** One step: the three rules over the neighbours, the owner's seek, a turn limited to `turn`, a speed eased to `speed(i)`. */
  step(dt, { seek = null, speed = null } = {}) {
    if (dt <= 0) return;
    this.hash();
    const P = this.p, V = this.v, c = this.cell, [sr, sw] = this.sep, [ar, aw] = this.align, [cr, cw] = this.coh;
    const S = this.stride, ph = this.phase, sdt = dt * S; this.phase = (this.phase + 1) % S;
    for (let i = 0; i < this.max; i++) {
      if (!this.alive[i]) continue;
      const k = i * 3, px = P[k], py = P[k + 1], pz = P[k + 2];
      if (S > 1 && i % S !== ph) { P[k] += V[k] * dt; P[k + 1] += V[k + 1] * dt; P[k + 2] += V[k + 2] * dt; continue; } // (not its turn: it flies on)
      _s.set(0, 0, 0); _a.set(0, 0, 0); _c.set(0, 0, 0); let na = 0, nc = 0;
      const gx = Math.floor(px / c), gy = Math.floor(py / c), gz = Math.floor(pz / c);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        let j = this.grid.get(keyOf(gx + dx, gy + dy, gz + dz)); if (j === undefined) continue;
        for (; j !== -1; j = this.next[j]) {
          if (j === i) continue;
          const m = j * 3, ex = px - P[m], ey = py - P[m + 1], ez = pz - P[m + 2], d2 = ex * ex + ey * ey + ez * ez;
          if (d2 < sr * sr && d2 > 1e-8) { const d = Math.sqrt(d2), w = (sr - d) / (sr * d); _s.x += ex * w; _s.y += ey * w; _s.z += ez * w; }
          if (d2 < ar * ar) { _a.x += V[m]; _a.y += V[m + 1]; _a.z += V[m + 2]; na++; }
          if (d2 < cr * cr) { _c.x += P[m]; _c.y += P[m + 1]; _c.z += P[m + 2]; nc++; }
        }
      }
      // the desired heading: the three rules, and what the owner asks
      _d.set(0, 0, 0);
      if (_s.lengthSq() > 0) _d.addScaledVector(_s.normalize(), sw);
      if (na) _d.addScaledVector(_a.normalize(), aw);
      if (nc) { _c.divideScalar(nc).sub(_v.set(px, py, pz)); if (_c.lengthSq() > 1e-6) _d.addScaledVector(_c.normalize(), cw); }
      const gw = seek ? seek(i, _g) : 0;
      if (gw > 0) { _g.sub(_v.set(px, py, pz)); if (_g.lengthSq() > 1e-6) _d.addScaledVector(_g.normalize(), gw); }
      // turn toward it no faster than `turn`, and ease to the speed asked
      _v.set(V[k], V[k + 1], V[k + 2]); const sp = _v.length() || 1e-3, want = speed ? speed(i) : this.speed;
      if (_d.lengthSq() > 1e-6) {
        _d.normalize(); const cur = _v.divideScalar(sp), ang = Math.acos(THREE.MathUtils.clamp(cur.dot(_d), -1, 1)), max = this.turn * sdt;
        if (ang > max) { _a.crossVectors(cur, _d); if (_a.lengthSq() < 1e-8) _a.set(0, 1, 0); cur.applyAxisAngle(_a.normalize(), max); } else cur.copy(_d);
      } else _v.divideScalar(sp);
      const ns = sp + (want - sp) * Math.min(1, sdt * 3);
      V[k] = _v.x * ns; V[k + 1] = _v.y * ns; V[k + 2] = _v.z * ns;
      P[k] += V[k] * dt; P[k + 1] += V[k + 1] * dt; P[k + 2] += V[k + 2] * dt;
    }
  }
}
