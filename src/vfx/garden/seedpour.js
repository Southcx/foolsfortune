// ---------------------------------------------------------------------------------------
// THE POUR'S STREAM AND ITS RING OF ACCRETION: the island's matter the god hand carries, falling from its palm onto a seed's planetoid
// while it pours (GRAB held over a seed: Petra's `realm.orbit.pouring`, { id, m3 } while it pours, world/garden/orbit.js and hand.js),
// and the matter gathering round where it lands. Drawn in the matter's own look and program (vfx/godhand/matterlook.js: sand and clay
// by the loose share it holds, or Lachryma's ink when it holds mostly water, as the held ball is), so it adds no program.
//
//   THE STREAM     a rope of matter from the palm to the ground, narrowing as it falls, pulsing as it runs, wavering a little, with clods
//                  tumbling down beside it; its look slides down it (the mesh's frame moves along the fall while its vertices stay on
//                  the line, so the atlas's grain runs down the rope: a pour, not a pipe). Started, its front falls from the hand in 0.14
//                  real s; stopped, its tail drains down into the ground in 0.22
//   THE ACCRETION  where it lands: a lumpy band of the matter round the point, breathing, and clods spiralling in to it and shrinking
//                  as they are taken in, faster as they near the middle (a disc gathering, as planets form), laid on the ground as it is
//                  (each piece stood on the planetoid's own `radiusAt`); dust thrown up there (`garden.seed.pour`, held)
//   Two draws (the stream's frame moves, the accretion's does not), about 670 vertices written a frame while it is seen; none at rest.
//
// Prior art: accretion discs (matter spiralling in, quicker toward the middle, Kepler's way), sand poured from a fist (a rope that thins
// as it accelerates, grains peeling off it), From Dust's matter poured from the breath's sphere, and Super Mario Galaxy's Hungry Luma
// fed a stream of Star Bits until it swells.
//
//   const S = new SeedPour(game, realm)   S.update(rawDt)   POUR (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { matterMaterial, matterAttrs } from '../godhand/matterlook.js';
import { groundOf } from '../../godhand/matter.js';

/** The look's numbers: the rope's radius at the palm (m) and how much it narrows to the ground, its sides and rings, the clods down it,
 *  how fast it runs (m a real second), its fall and drain (real s); the accretion's band (m), clods, their spiral in, and its fade. */
export const POUR = {
  r0: 0.2, taper: 0.45, sides: 8, rings: 18, clods: 12, run: 3.2, fall: 0.14, drain: 0.22,
  band: { r: 1.0, tube: 0.075, seg: 36, around: 5, lift: 0.03 }, swirl: { n: 16, inner: 0.25, outer: 1.6, size: 0.11, turn: 0.25 }, fade: 0.5,
};
const TAU = Math.PI * 2;
// a unit icosahedron (12 corners, 20 faces): every clod is one, pressed lumpy
const ICO_V = (() => { const t = (1 + Math.sqrt(5)) / 2, C = [-1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1], l = Math.hypot(1, t); return C.map((v) => v / l); })();
const ICO_F = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1];
const hashOf = (i, k = 0) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
const approach = (v, to, step) => (v < to ? Math.min(to, v + step) : Math.max(to, v - step));
const _ca = new THREE.Color(), _cb = new THREE.Color();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3(), _c = new THREE.Vector3(), _q = new THREE.Vector3(), _d = new THREE.Vector3(), _o = new THREE.Vector3();

/** An indexed geometry of `n` vertices with the matter look's attributes, its triangles from `index`, written a frame. */
function liveGeometry(n, index) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  matterAttrs(g, n); g.setIndex(index); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
  return g;
}
/** A tube of `around` x (`along` + 1) vertices (its quads into `idx`, from vertex `at`), closed round, open at its ends unless `loop`;
 *  wound to face out when its around runs anticlockwise looking down its along (`flip` when it runs the other way: the band's). */
function tubeIndex(idx, at, along, around, loop = false, flip = false) {
  const rows = loop ? along : along + 1;
  for (let j = 0; j < along; j++) for (let k = 0; k < around; k++) {
    const a = at + j * around + k, b = at + j * around + ((k + 1) % around), c = at + ((j + 1) % rows) * around + k, d = at + ((j + 1) % rows) * around + ((k + 1) % around);
    if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
}
const clodIndex = (idx, at) => { for (let f = 0; f < 60; f++) idx.push(at + ICO_F[f]); };

export class SeedPour {
  constructor(game, realm) {
    this.game = game; this.R = realm;
    this.head = 0; this.tail = 1; this.ringK = 0; this.t = 0; this.run = 0; this.share = -1; this.on = false;
    this.from = new THREE.Vector3(); this.to = new THREE.Vector3(); this.n = new THREE.Vector3(); this.axis = new THREE.Vector3(0, -1, 0); this.planet = null; this.dust = null;
    const P = POUR, tubeN = (P.rings + 1) * P.sides, si = []; tubeIndex(si, 0, P.rings, P.sides); for (let i = 0; i < P.clods; i++) clodIndex(si, tubeN + i * 12);
    const ai = [], bandN = P.band.seg * P.band.around; tubeIndex(ai, 0, P.band.seg, P.band.around, true, true); for (let i = 0; i < P.swirl.n; i++) clodIndex(ai, bandN + i * 12);
    this.stream = new THREE.Mesh(liveGeometry(tubeN + P.clods * 12, si), matterMaterial('ground'));
    this.accretion = new THREE.Mesh(liveGeometry(bandN + P.swirl.n * 12, ai), matterMaterial('ground'));
    for (const [m, name] of [[this.stream, 'garden-pour-stream'], [this.accretion, 'garden-pour-accretion']]) { m.name = name; m.visible = false; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true; realm.site.group.add(m); }
    this.tubeN = tubeN; this.bandN = bandN;
  }

  update(raw = 1 / 60) {
    const R = this.R, O = R.orbit, p = R.active ? O?.pouring : null, H = R.hand, P = p ? O.of(p.id)?.planet : null;
    const now = !!(P && H?.hit?.planet === P);
    if (now) { if (!this.on) { this.head = 0; this.tail = 0; this.run = 0; } this.planet = P; this.to.copy(H.point); this.n.copy(H.point).sub(P.c).normalize(); this.palm(); }
    this.on = now;
    this.head = approach(this.head, 1, raw / POUR.fall);
    if (!now) this.tail = approach(this.tail, 1, raw / POUR.drain);
    this.ringK = approach(this.ringK, now && this.head >= 1 ? 1 : 0, raw / POUR.fade);
    const seen = this.tail < 1 || this.ringK > 0;
    if (!seen || !this.planet || !R.active) { this.stream.visible = this.accretion.visible = false; this.dustOff(); return; }
    this.t += raw; this.run += raw * POUR.run;
    this.dress();
    this.stream.visible = this.tail < 1; this.accretion.visible = this.ringK > 0;
    if (this.stream.visible) this.writeStream();
    if (this.accretion.visible) this.writeAccretion();
    this.dustAt(now && this.head >= 1);
  }

  /** Where the matter leaves the hand: its palm (the model's tip, half way back), a little under it; a step over the point without one. */
  palm() {
    const H = this.game.god?.hand;
    if (H?.root?.visible) { H.root.updateMatrixWorld(); H.root.localToWorld(this.from.copy(H.tip).multiplyScalar(0.55)); this.from.addScaledVector(this.n, -0.12); }
    if (!H?.root?.visible || this.from.distanceTo(this.to) < 0.4) this.from.copy(this.to).addScaledVector(this.n, 1.3);
  }
  /** What it is: the held matter's look (Lachryma's ink when it holds mostly water, else sand and clay by the loose share), as the ball. */
  dress() {
    const M = this.game.god?.arts?.matter, H = M?.held || { water: 0, loose: 1, firm: 1 }, wet = H.water > 0.05 && H.water >= H.loose && H.water >= H.firm;
    const mat = matterMaterial(wet ? 'lachryma' : 'ground'); if (this.stream.material !== mat) this.stream.material = this.accretion.material = mat;
    const share = Math.round((H.loose / Math.max(1e-6, H.loose + H.firm)) * 20) / 20;
    if (share !== this.share) {
      this.share = share;
      for (const m of [this.stream, this.accretion]) { const A = m.geometry.attributes.aMl; for (let i = 0; i < A.count; i++) A.array[i * 4] = share; A.needsUpdate = true; }
    }
    const G = groundOf();
    this.tint = wet ? 0x2a2440 : _ca.setHex(G.firm.colour).lerp(_cb.setHex(G.loose.colour), share).getHex();
  }

  /** The rope and its clods, from the palm to the ground between where its tail has drained to and where its front has fallen to; its
   *  frame slid along the fall by how far it has run, so the look runs down it. */
  writeStream() {
    const P = POUR, G = this.stream.geometry, pos = G.attributes.position.array, nor = G.attributes.normal.array;
    _a.copy(this.to).sub(this.from); const len = _a.length(); this.axis.copy(_a).divideScalar(len || 1);
    _e1.set(1, 0, 0).cross(this.axis); if (_e1.lengthSq() < 1e-4) _e1.set(0, 0, 1).cross(this.axis); _e1.normalize(); _e2.crossVectors(this.axis, _e1);
    const off = _o.copy(this.axis).multiplyScalar(this.run % 40); this.stream.position.copy(off);
    const s0 = this.tail, s1 = this.head, t = this.t;
    const centre = (s, out) => out.copy(this.from).addScaledVector(_a, s).addScaledVector(_e1, 0.035 * s * Math.sin(t * 6.1 - s * 8)).addScaledVector(_e2, 0.035 * s * Math.cos(t * 5.3 - s * 7)).sub(off);
    const radius = (s) => P.r0 * (1 - P.taper * s) * (0.85 + 0.15 * Math.sin(this.run * 2.8 - s * 14));
    for (let j = 0; j <= P.rings; j++) {
      const s = s0 + (s1 - s0) * (j / P.rings), end = (j === P.rings && s1 < 1) || (j === 0 && s0 > 0) ? 0.35 : 1, r = radius(s) * end;
      centre(s, _c);
      for (let k = 0; k < P.sides; k++) {
        const th = (k / P.sides) * TAU, cx = Math.cos(th), sx = Math.sin(th), v = (j * P.sides + k) * 3;
        _d.copy(_e1).multiplyScalar(cx).addScaledVector(_e2, sx);
        pos[v] = _c.x + _d.x * r; pos[v + 1] = _c.y + _d.y * r; pos[v + 2] = _c.z + _d.z * r; nor[v] = _d.x; nor[v + 1] = _d.y; nor[v + 2] = _d.z;
      }
    }
    // the clods tumbling down beside it, each its own way round, only on the stretch that is falling
    for (let i = 0; i < P.clods; i++) {
      const h = hashOf(i), s = (this.run / Math.max(0.5, len) * 0.8 + i / P.clods) % 1, here = s >= s0 && s <= s1, size = here ? 0.045 + 0.045 * h : 0, ph = h * TAU + s * 2;
      centre(s, _c).addScaledVector(_e1, Math.cos(ph) * radius(s) * (1.15 + 0.5 * hashOf(i, 1))).addScaledVector(_e2, Math.sin(ph) * radius(s) * (1.15 + 0.5 * hashOf(i, 1)));
      this.clod(pos, nor, this.tubeN + i * 12, _c, size, i);
    }
    G.attributes.position.needsUpdate = true; G.attributes.normal.needsUpdate = true;
  }

  /** The band round where it lands and the clods spiralling in to it, each stood on the ground there. */
  writeAccretion() {
    const P = POUR, B = P.band, W = P.swirl, Pl = this.planet, G = this.accretion.geometry, pos = G.attributes.position.array, nor = G.attributes.normal.array, k = this.ringK, t = this.t;
    _e1.set(1, 0, 0).cross(this.n); if (_e1.lengthSq() < 1e-4) _e1.set(0, 0, 1).cross(this.n); _e1.normalize(); _e2.crossVectors(this.n, _e1);
    const ground = (q, lift, out) => { _d.copy(q).sub(Pl.c).normalize(); return out.copy(Pl.c).addScaledVector(_d, (Pl.radiusAt ? Pl.radiusAt(_d) : Pl.r) + lift); };
    const rb = B.r * (0.92 + 0.08 * Math.sin(t * 3.1));
    for (let i = 0; i < B.seg; i++) {
      const th = (i / B.seg) * TAU, out = _b.copy(_e1).multiplyScalar(Math.cos(th)).addScaledVector(_e2, Math.sin(th)), minor = B.tube * k * (0.75 + 0.5 * hashOf(Math.floor(th * 5 + t * 2), 3));
      ground(_q.copy(this.to).addScaledVector(out, rb), B.lift + minor * 0.6, _c);
      const up = _d;
      for (let j = 0; j < B.around; j++) {
        const ph = (j / B.around) * TAU, v = (i * B.around + j) * 3, nx = out.x * Math.cos(ph) + up.x * Math.sin(ph), ny = out.y * Math.cos(ph) + up.y * Math.sin(ph), nz = out.z * Math.cos(ph) + up.z * Math.sin(ph);
        pos[v] = _c.x + nx * minor; pos[v + 1] = _c.y + ny * minor; pos[v + 2] = _c.z + nz * minor; nor[v] = nx; nor[v + 1] = ny; nor[v + 2] = nz;
      }
    }
    for (let i = 0; i < W.n; i++) {
      const u = (i / W.n + t * W.turn) % 1, rho = W.inner + (W.outer - W.inner) * (1 - u) ** 0.8, th = i * 2.399963 + t * (1.4 + 2.6 * u), size = W.size * (1 - u * u * u) * k * (0.7 + 0.6 * hashOf(i, 5));
      _q.copy(this.to).addScaledVector(_e1, Math.cos(th) * rho).addScaledVector(_e2, Math.sin(th) * rho);
      this.clod(pos, nor, this.bandN + i * 12, ground(_q, size * 0.55, _c), size, i + 40);
    }
    G.attributes.position.needsUpdate = true; G.attributes.normal.needsUpdate = true;
  }

  /** One clod: the unit icosahedron at `c`, `size` across, pressed lumpy by its own seed; its normals the corners' own (round). */
  clod(pos, nor, at, c, size, seed) {
    for (let v = 0; v < 12; v++) {
      const x = ICO_V[v * 3], y = ICO_V[v * 3 + 1], z = ICO_V[v * 3 + 2], s = size * (0.8 + 0.4 * hashOf(seed, v)), o = (at + v) * 3;
      pos[o] = c.x + x * s; pos[o + 1] = c.y + y * s; pos[o + 2] = c.z + z * s; nor[o] = x; nor[o + 1] = y; nor[o + 2] = z;
    }
  }

  /** The dust thrown up where it lands while it pours (a held effect, moved with the point; stopped when the pour is). */
  dustAt(on) {
    if (!on) { this.dustOff(); return; }
    if (!this.dust && this.game.vfx?.play) this.dust = this.game.vfx.play('garden.seed.pour', { pos: this.to, normal: this.n, dir: this.n, tint: this.tint });
    if (this.dust) { this.dust.pos.copy(this.to); this.dust.normal.copy(this.n); this.dust.dir.copy(this.n); if (this.dust.ctx) this.dust.ctx.tint = this.tint; }
  }
  dustOff() { this.dust?.stop?.(); this.dust = null; }
}
