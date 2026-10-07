// ---------------------------------------------------------------------------------------
// THE VESSEL'S DAMAGE: the Lachryma pool is the shield and takes a blow first (Halo's regenerating shield: it fills again on its own);
// what it cannot pay for cracks the clay where the blow lands, and the cracks mend, slowly, or at once at the kiln for cubes. A blow on
// clay cracked through shatters the vessel (courier/vessel/death.js). The Courier carries six HIT REGIONS (the mask,
// the torso, each arm, each leg), each a few capsules riding their bones (the HITBOXES: geometric, not physics bodies, so they never touch
// how they move). A blow is resolved to the region it struck: by the point, when the blow has one (a lob's shell), or by the line from
// where it came (a jelly's lunge comes from the jelly) to their middle, first capsule it meets. That region's CRACK rises; after a few
// quiet seconds it mends, cell by cell, until nothing is left. Nothing about how they move changes (CLAUDE.md: the core is the gold
// standard); the cracks are shown on them (courier/vessel/kintsugi.js: the same net the gold seams use, dark, with Lachryma at the heart of
// the line), and each crack and mend is an event (`vessel.crack`, `vessel.mend`) for the log, the ledger and the sounds.
//
// Prior art: locational damage of the hitbox kind (Soldier of Fortune's and Fallout's regions, Monster Hunter's breakable parts shown
// on the body), the cracked-armour states of Halo's shields and Dead Space's suit, and kintsugi again: the cracks that mend are
// drawn on the same lines the gold will one day fill.
//
//   REGIONS (names, in order)   regionOfBone(name)   new Hitboxes(character)  .nearest(point) .raycast(origin, dir) -> { region, t }
//   new VesselDamage(game, vessel)   .hit({ point?, from?, dir?, k, why, by })   .update(dt)   .crack (Float32Array per region)
//   .mend (Float32Array per region, 0..1: how far a mending region's cracks have turned to gold; the owner, 2026-10-04: gold where a
//   crack mends, gone when the mend is done)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { HURT } from '../../vfx/filigree.js';
import { sfx } from '../../audio/sfx.js';

export const REGIONS = ['mask', 'torso', 'armL', 'armR', 'legL', 'legR'];
const MEND_AFTER = 6, MEND_RATE = 0.025; // (seconds of quiet before a region mends, and how much of it mends a second: ~40 s from full;
//                                          the kiln mends it at once, for cubes: vessel.mend / kilnui.js)
const SHIELD = 35; // (Lachryma a full blow (k = 1) costs the pool, Halo's shield: the pool takes the blow first, the clay only what is left)
const BREAK_AT = 3.6; // (the vessel shatters when a blow lands on a region already cracked through, or the cracks together pass this)

/** The region a bone belongs to (the Courier's rig: three.js drops the dots from the names: 'upper_arm.L' is 'upper_armL'). */
export function regionOfBone(name = '') {
  if (/^head|^spine00[45]/.test(name)) return 0;
  const side = /L$/.test(name) ? 0 : /R$/.test(name) ? 1 : -1;
  if (side >= 0 && /arm|hand|^f_|thumb|palm/.test(name)) return 2 + side;
  if (side >= 0 && /thigh|shin|foot|toe|heel/.test(name)) return 4 + side;
  return 1;
}

/** Each vertex of their armour and mask told its region (the bone that moves it most), once per geometry, for the cracks' shader. */
export function tagRegions(ch) {
  ch.model.traverse((o) => {
    if (!o.isSkinnedMesh || o.geometry.attributes.aRegion) return;
    const g = o.geometry, n = g.attributes.position.count, out = new Float32Array(n);
    const si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bones = o.skeleton?.bones || [];
    const byBone = bones.map((b) => regionOfBone(b.name));
    for (let i = 0; i < n; i++) {
      if (o.name === 'Courier_Mask') { out[i] = 0; continue; }
      let best = 0, bw = -1;
      for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
      out[i] = byBone[best] ?? 1;
    }
    g.setAttribute('aRegion', new THREE.BufferAttribute(out, 1));
  });
}

// the capsules: [region, from bone, to bone (or null: a length along the bone's own up), radius]
const CAPS = [
  [0, 'head', null, 0.13, 0.22], [1, 'spine', 'spine003', 0.18], [1, 'spine003', 'spine004', 0.16],
  [2, 'upper_armL', 'forearmL', 0.065], [2, 'forearmL', 'handL', 0.055], [3, 'upper_armR', 'forearmR', 0.065], [3, 'forearmR', 'handR', 0.055],
  [4, 'thighL', 'shinL', 0.085], [4, 'shinL', 'footL', 0.065], [5, 'thighR', 'shinR', 0.085], [5, 'shinR', 'footR', 0.065],
];
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _up = new THREE.Vector3(), _q = new THREE.Quaternion();

export class Hitboxes {
  constructor(ch) {
    this.ch = ch;
    this.caps = CAPS.filter(([, a, b]) => ch.bones[a] && (!b || ch.bones[b])).map(([region, a, b, r, len = 0]) => ({ region, a: ch.bones[a], b: b ? ch.bones[b] : null, r, len, p0: new THREE.Vector3(), p1: new THREE.Vector3() }));
  }
  /** The capsules where their bones are now. */
  refresh() {
    for (const c of this.caps) {
      c.a.getWorldPosition(c.p0);
      if (c.b) c.b.getWorldPosition(c.p1);
      else c.p1.copy(c.p0).add(_up.set(0, 1, 0).applyQuaternion(c.a.getWorldQuaternion(_q)).multiplyScalar(c.len));
    }
    return this;
  }
  /** The region nearest a point (and how far outside its capsule the point is). */
  nearest(p) {
    this.refresh();
    let best = null, bd = Infinity;
    for (const c of this.caps) { const d = segDist(p, c.p0, c.p1) - c.r; if (d < bd) { bd = d; best = c; } }
    return best ? { region: best.region, d: bd } : { region: 1, d: Infinity };
  }
  /** The first region a line from `origin` along `dir` meets (or the nearest to the line, if it misses them all). */
  raycast(origin, dir) {
    this.refresh();
    let best = null, bt = Infinity, near = null, nd = Infinity;
    for (const c of this.caps) {
      const { t, d } = rayToSeg(origin, dir, c.p0, c.p1);
      if (d <= c.r && t < bt) { bt = t; best = c; }
      if (d - c.r < nd) { nd = d - c.r; near = c; }
    }
    const c = best || near;
    return c ? { region: c.region, t: best ? bt : null } : { region: 1, t: null };
  }
}
function segDist(p, a, b) {
  const ab = _a.copy(b).sub(a), t = THREE.MathUtils.clamp(_b.copy(p).sub(a).dot(ab) / Math.max(1e-6, ab.lengthSq()), 0, 1);
  return _c.copy(a).addScaledVector(ab, t).distanceTo(p);
}
/** The closest approach of a ray (o + t d, t >= 0) to a segment: the ray's t there and the distance. */
function rayToSeg(o, d, a, b) {
  let best = { t: 0, d: Infinity };
  for (let i = 0; i <= 8; i++) { // (a short search along the segment: plenty for a capsule's worth of accuracy)
    const p = _d.copy(a).lerp(b, i / 8), t = Math.max(0, _a.copy(p).sub(o).dot(d)), dist = _b.copy(o).addScaledVector(d, t).distanceTo(p);
    if (dist < best.d) best = { t, d: dist };
  }
  return best;
}

export class VesselDamage {
  constructor(game, vessel) {
    this.game = game; this.vessel = vessel;
    this.crack = new Float32Array(REGIONS.length);
    this.quiet = new Float32Array(REGIONS.length).fill(99);
    this.mend = new Float32Array(REGIONS.length); // (the cracks gold while they mend: kintsugi.js uMend)
    this.glow = new Float32Array(REGIONS.length); this.peak = new Float32Array(REGIONS.length); // (the trail of gold on the cells a mend has closed, and how far each region cracked: uTrail, uPeak)
    this.boxes = game.character ? new Hitboxes(game.character) : null;
    // the blows: a jelly's (from where the jelly is), a lob's and an explosion's (from the way it pushed them)
    game.events?.on('jelly.strike', (e) => this.hit({ from: e.from ? new THREE.Vector3(...e.from) : null, k: e.move === 'lunge' ? 0.7 : 0.4, why: 'jelly', by: 'creature' }));
    game.events?.on('courier.impulse', (e) => { if (HURT.has(e.why) && e.why !== 'jelly') this.hit({ dir: e.dir ? new THREE.Vector3(...e.dir) : null, k: Math.min(1, 0.3 + (e.mag || 0) / 18), why: e.why, by: 'environment' }); });
  }
  get P() { return this.game.player; }

  /** A blow on them: resolved to a region, that region cracked by `k` (0..1). */
  hit({ point = null, from = null, dir = null, k = 0.5, why = 'blow', by = 'environment' } = {}) {
    if (!this.boxes || this.game.death?.active) return -1;
    // the shield first (Halo's): the Lachryma in the pool takes the blow; only what it cannot pay for reaches the clay
    const pool = this.game.lachryma;
    if (pool) {
      const cost = k * SHIELD, had = pool.value;
      if (had >= cost) { pool.drain(cost, 'shield'); this.game.events?.emit('vessel.shield', { k: +k.toFixed(2), left: +pool.fraction.toFixed(2), why, by }); return -1; }
      if (had > 0.5) { pool.drain(had, 'shield'); this.game.events?.emit('vessel.shieldbreak', { why, by }); }
      k *= 1 - had / cost;
    }
    const P = this.P, mid = new THREE.Vector3(P.pos.x, P.pos.y + 1.0, P.pos.z);
    let region = 1;
    if (point) region = this.boxes.nearest(point).region;
    else {
      // the line the blow came along: from the attacker toward their middle, or back along the push (its own vectors: the capsule tests
      // use the module's scratch ones)
      const o = from ? from.clone().setY(Math.max(from.y + 0.4, P.pos.y + 0.3)) : mid.clone().addScaledVector(dir || new THREE.Vector3(0, 0, 1), -2.5);
      region = this.boxes.raycast(o, mid.clone().sub(o).normalize()).region;
    }
    const was = this.crack[region];
    // a blow on clay already cracked through, or one that takes the cracks past what a vessel holds: it shatters (courier/vessel/death.js)
    const sum = this.crack.reduce((a, c) => a + c, 0) + k * 0.65;
    if (was >= 0.95 || sum >= BREAK_AT) { this.game.death?.begin({ why, by, region: REGIONS[region] }); return region; }
    this.crack[region] = Math.min(1, was + k * 0.65);
    this.quiet[region] = 0; this.peak[region] = Math.max(this.peak[region], this.crack[region]);
    sfx.vesselCrack?.(this.crack[region], REGIONS[region]); // (Wanda's: docs/HANDOFFS.md)
    this.game.events?.emit('vessel.crack', { region: REGIONS[region], k: +this.crack[region].toFixed(2), why, by });
    return region;
  }

  /** Mended at once (the kiln's refiring, or made whole again after shattering): every region, or the one named. */
  mendAll(quiet = false) {
    for (let i = 0; i < this.crack.length; i++) {
      if (this.crack[i] <= 0) continue;
      this.crack[i] = 0; this.glow[i] = 1; // (mended at once: the gold flashes through every crack and fades)
      if (!quiet) { sfx.vesselMend?.(REGIONS[i]); this.game.events?.emit('vessel.mend', { region: REGIONS[i], by: 'courier' }); }
    }
  }
  /** How cracked the vessel is, 0 (whole) .. 1 (at the edge of shattering). */
  get worn() { return Math.min(1, this.crack.reduce((a, c) => a + c, 0) / BREAK_AT); }

  update(dt) {
    for (let i = 0; i < this.crack.length; i++) {
      this.quiet[i] += dt;
      if (this.crack[i] > 0 && this.quiet[i] > MEND_AFTER) {
        this.crack[i] = Math.max(0, this.crack[i] - MEND_RATE * dt);
        if (this.crack[i] === 0) { sfx.vesselMend?.(REGIONS[i]); this.game.events?.emit('vessel.mend', { region: REGIONS[i], by: 'courier' }); }
      }
      // the gold comes into the cracks over a second once they mend, and goes dark again if a blow lands first; the cells it fills go
      // out one by one as the crack closes, so the last of the gold leaves with the last of the crack
      const to = this.crack[i] > 0 && this.quiet[i] > MEND_AFTER ? 1 : 0;
      this.mend[i] = to ? Math.min(1, this.mend[i] + dt) : this.crack[i] > 0 ? Math.max(0, this.mend[i] - dt * 3) : 0;
    }
    // the trail: the cells a mend has just closed stay gold, and all of it is gone within a couple of seconds of the last crack closing
    for (let i = 0; i < this.crack.length; i++) {
      const mending = this.crack[i] > 0 && this.quiet[i] > MEND_AFTER;
      this.glow[i] = mending ? Math.min(1, this.glow[i] + dt * 2) : Math.max(0, this.glow[i] - dt * 0.6);
      if (this.crack[i] === 0 && this.glow[i] === 0) this.peak[i] = 0;
    }
    const U = this.vessel?.kinU;
    if (U?.uDmg) for (let i = 0; i < this.crack.length; i++) { U.uDmg.value[i] = this.crack[i]; U.uMend.value[i] = this.mend[i]; U.uTrail.value[i] = this.glow[i]; U.uPeak.value[i] = this.peak[i]; }
  }
}
