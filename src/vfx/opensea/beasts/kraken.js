// ---------------------------------------------------------------------------------------
// THE KRAKEN'S BODY (docs/plans/OPEN-SEA.md 14.3; Dovina's row: progress/opensea/seabeasts.js SEA_BEASTS.bigSquid, the arms parts, the
// head opened once two arms are off, the ink): the open sea's dread-deep Egregore drawn as a fight, Petra's runtime driving it. Its dress
// is the safari's kraken (vfx/opensea/egregoreshapes2.js bigSquid: the red mantle mottled darker, the pale suckers, the great pearl eyes
// ringed in Dread) at the 5x ships' size, drawn in the sea serpent's program (seaserpentbody.js serpentMaterial: the rail foes' body with
// a rest frame), so a part's gold line and its crazing are the serpent's own (vfx/railfoes/materials.js uParts, vfx/partcraze.js's net).
//
//   SIX ARMS   each its own part, mesh and material (one program): a tapering suckered tube swept along a chain of 18 joints by
//              parallel transport (the serpent's hide), its suckers ridges of pale on the inner side of its curl. Each pose is a planar
//              curve integrated from its base (an angle down the arm, Pfeil's tentacle as a bent rod), eased toward each frame:
//                idle   risen out of the crude, leaning to the hull and the tip curled over it, writhing
//                grasp  reared over the near gunwale, then laid across the deck and down the far side (the gunwale's wrap), squeezing
//                slam   reared straight up and back, then whipped down flat along the water onto its ring: the ring a world mark on the
//                       water in Dread's colour (no words), from twice its size to its size with k; the crude bursts where it lands
//              A broken arm (`break`) is thrown off into the voxel batch (game.voxels, vfx/voxels/), its stub sinking.
//   THE HEAD   the mantle reared and the eyes at the water, surfacing between the arms once `open`; its own part, lined in gold up.
//   THE INK    a black cloud spread on the water round the ship (opaque, its edge broken, the film's sheen faint at it), hiding the
//              water's tells; grown over the ink's windup, held, faded over the row's `hold` (6 real s).
//   THE WATER  game.water.disturb where each arm goes through the surface (a wake ring every 0.45 real s, a crown where it first breaks),
//              round the head as it surfaces, along a slam's length where it lands, and round the ink as it spreads.
//
// Draws: 6 arms, the head, 6 slam rings (only during a slam), the ink (only inked): at most 14; about 1,000 triangles an arm.
//
// Prior art: Olaus Magnus's Carta Marina (1539: the kraken's arms over a ship's rail) and Pontoppidan (1752); Sea of Thieves' Kraken
// (tentacles risen round the hull, one wrapping it, the ink darkening the water: each arm shot apart); Shadow of the Colossus's Basaran
// and Phalanx and God of War's Scylla (parts of a beast as the arena); Star Fox 64's and Einhander's bosses (a part's gold, its hurt
// shown before it comes off); the safari's own kraken (egregoreshapes2.js); a tentacle as a bent rod (Pfeil and Thibault's octopus arm
// kinematics, 2005; Hanson and Ma's parallel-transport tube, 1995).
//
//   const K = new KrakenBody(game, { arms = 6, seaY? })   (in game.scene, zone 'opensea', hidden until driven; game.makeKraken)
//   K.drive({ hull: { pos, yaw, length, beam, deckY } | the helm, head?: Vector3, open = false, move: null|'ink', k: 0..1,
//             arms: [{ id: 0..5 | 'arm0'.., base?: Vector3, tip?: Vector3, move: null|'grasp'|'slam', k: 0..1, at?: Vector3, open? }] })
//     hull: the ship (the helm's pos and yaw, its look's length, beam, deckY: the helm itself is taken); head: where the head surfaces
//     (default beside the hull, abeam the bases' side); open: the head up and hittable; base: where the arm leaves the water (default
//     round the hull: K.baseAt(i, hull)); tip: the arm's tip sent there (idle); grasp k: the windup to the wrap (1 wrapped; held at 1
//     while it holds); slam k: the windup, landing at 1 on `at` (default 0.72 of its length toward the hull); arm open: its gold line
//     (default: alive and up out of the water). An arm not named keeps its last command.
//   K.update(dt)   K.hit('head' | 'arm3' | 3, k)   (k = 1 - hp / hpMax: a flash, its crazing)   K.break('arm3' | 3)   K.down()
//   K.parts() -> [{ id, pos, r, open }] (live; the arms' then the head)   K.arm(id) -> { joints [Vector3 x18], radii, alive }   K.dispose()
//   KRAKEN_LOOK (its numbers)   K.tris
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { serpentMaterial } from '../seaserpentbody.js';
import { FoeKit } from '../../railfoes/kit.js';
import { loft } from '../egregorekit.js';
import { FILM } from '../../oxidation.js';
import { voxelize } from '../../voxels/voxelize.js';
import { voxelsNow } from '../../voxels/now.js';
import { COLOR } from '../../../progress/weather.js';
import { SEA_BEASTS } from '../../../progress/opensea/seabeasts.js';
import { SEA } from '../../../world/opensea/seaprops.js';

/** Its numbers: an arm's length, its radius at the base and tip (m), joints, rings and sides; the head's scale on the safari kraken's
 *  units (its mantle 18 m there: 29 m here); a slam ring's radius at k 1 (m); the ink's radius (m) and hold (real s, Dovina's row). */
export const KRAKEN_LOOK = {
  arms: 6, armLength: 62, armR: 3.2, tipR: 0.3, joints: 18, rings: 48, sides: 10, head: 1.6, slamR: 10,
  ink: { r: 75, hold: SEA_BEASTS.bigSquid?.moves?.ink?.hold ?? 6 },
};
const KL = KRAKEN_LOOK, PI = Math.PI, CRAZE = 3.5; // (the rest frame's divisor: crazing cells the serpent's size)
const RED = 0x6a3640, RED_D = 0x5a2c36, PALE = 0xb89a9a, SUCK = 0xdcc6c0, SUCK_D = 0x8e7276, INK = 0x0a090c;
const DREAD = new THREE.Color(COLOR.dread ?? 0x3f6a4a), UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3(), _c = new THREE.Color(), _f = new THREE.Vector3(), _s = new THREE.Vector3();
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const hash = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };
const armIndex = (id) => (typeof id === 'number' ? id : parseInt(String(id).replace(/^arm/, ''), 10));
/** The hull as the drive gives it: the helm itself, or a plain { pos, yaw, length, beam, deckY }. */
const hullOf = (h) => (h ? { pos: h.pos, yaw: h.yaw ?? 0, length: h.length ?? h.look?.length ?? 35, beam: h.beam ?? h.look?.beam ?? 10, deckY: h.deckY ?? h.look?.deckY ?? 2 } : null);
/** An arm's radius along it, s 0 the base .. 1 the tip. */
const armR = (s) => (KL.armR - KL.tipR) * Math.pow(1 - s, 1.15) + KL.tipR;

/** Points resampled along a polyline at `d` apart, N of them (straight on past its end). */
function resample(pts, d, N, out) {
  let seg = 0, at = 0; out[0].copy(pts[0]);
  for (let i = 1; i < N; i++) {
    let left = d;
    while (seg < pts.length - 1) {
      const a = pts[seg], b = pts[seg + 1], L = a.distanceTo(b), rest = L - at;
      if (rest >= left) { at += left; out[i].lerpVectors(a, b, L > 1e-6 ? at / L : 0); left = 0; break; }
      left -= rest; seg++; at = 0;
    }
    if (left > 0) { const a = pts[pts.length - 2], b = pts[pts.length - 1]; _v.subVectors(b, a).normalize(); out[i].copy(out[i - 1]).addScaledVector(_v, d); }
  }
}

class KrakenArm {
  constructor(body, i) {
    this.body = body; this.i = i; this.id = `arm${i}`; this.N = KL.joints; this.L = KL.armLength; this.d = this.L / (this.N - 1);
    this.joints = Array.from({ length: this.N }, () => new THREE.Vector3()); this.target = Array.from({ length: this.N }, () => new THREE.Vector3());
    this.radii = Float32Array.from({ length: this.N }, (_, j) => armR(j / (this.N - 1)));
    this.base = new THREE.Vector3(); this.dir = new THREE.Vector3(1, 0, 0); this.side = new THREE.Vector3(); this.hasBase = false;
    this.cmd = { move: null, k: 0, tip: null, at: null, open: null }; this.atP = new THREE.Vector3(); this.wrap = Array.from({ length: 7 }, () => new THREE.Vector3());
    this.placed = false; this.phase = i * 1.7 + 0.4; this.flash = 0; this.hurt = 0; this.broken = -1; this.dead = -1; this.slamDone = false;
    this.waterT = i * 0.07; this.crossed = false; this.isOpen = 0;
    this.mat = serpentMaterial(); this.u = this.mat.userData.u;
    this.mesh = new THREE.Mesh(this.buildTube(), this.mat); this.mesh.name = `kraken.${this.id}`; this.mesh.castShadow = true;
    this.ring = new THREE.Mesh(body.ringGeo, new THREE.MeshBasicMaterial({ color: DREAD.clone().multiplyScalar(2.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.ring.visible = false; this.ring.renderOrder = 45;
    for (const m of [this.mesh, this.ring]) m.userData.zone = 'opensea';
  }

  /** The tube's topology once (its positions every frame): its colours, suckers' ridges and rest frame are fixed to the ring and side. */
  buildTube() {
    const R = KL.rings, S = KL.sides, n = R * S, g = new THREE.BufferGeometry(), idx = [];
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), rest = new Float32Array(n * 3);
    const fx = new Float32Array(n * 4), part = new Float32Array(n * 4), unit = new Float32Array(n * 2); this.bump = new Float32Array(n);
    for (let i = 0; i < R; i++) {
      const s = i / (R - 1), r = armR(s);
      for (let j = 0; j < S; j++) {
        const a = (j / S) * PI * 2, ca = Math.cos(a), v = i * S + j, under = ca < -0.3; // (the inner side of the curl: the suckers)
        let hex = hash(i * 0.7, j * 1.3, this.i) > 0.62 ? RED_D : RED;
        if (under) { hex = i % 2 ? SUCK_D : SUCK; fx[v * 4] = i % 2 ? 0 : 0.18; this.bump[v] = i % 2 ? 0.94 : 1.14; } else this.bump[v] = 1;
        if (ca < -0.05 && !under) hex = PALE;
        _c.setHex(hex); col[v * 3] = _c.r; col[v * 3 + 1] = _c.g; col[v * 3 + 2] = _c.b;
        rest[v * 3] = Math.sin(a) * r / CRAZE; rest[v * 3 + 1] = ca * r / CRAZE; rest[v * 3 + 2] = -s * this.L / CRAZE;
        if (i < R - 1) { const a0 = v, b0 = i * S + (j + 1) % S, c0 = a0 + S, d0 = b0 + S; idx.push(a0, c0, b0, b0, c0, d0); }
      }
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('rest', new THREE.BufferAttribute(rest, 3));
    g.setAttribute('fx', new THREE.BufferAttribute(fx, 4)); g.setAttribute('part', new THREE.BufferAttribute(part, 4)); g.setAttribute('unit', new THREE.BufferAttribute(unit, 2));
    g.setIndex(idx);
    this.rP = Array.from({ length: R }, () => new THREE.Vector3()); this.rT = Array.from({ length: R }, () => new THREE.Vector3());
    this.rN = Array.from({ length: R }, () => new THREE.Vector3()); this.rB = Array.from({ length: R }, () => new THREE.Vector3());
    this.tris = idx.length / 3;
    return g;
  }

  drive({ base = null, tip = null, move = null, k = 0, at = null, open = null } = {}, hull) {
    const C = this.cmd; C.move = move; C.k = Math.min(1, Math.max(0, k)); C.tip = tip; C.at = at; C.open = open;
    if (base) { this.base.copy(base); this.hasBase = true; } else if (!this.hasBase && hull) { this.body.baseAt(this.i, hull, this.base); this.hasBase = true; }
    if (!this.placed && this.hasBase) { // (first sight: laid under the crude, so it rises out of it)
      for (const j of this.joints) j.copy(this.base).y -= 30 + Math.random() * 10;
      this.placed = true;
    }
  }

  /** A curve in the arm's plane (up and `dir`): `th(s)` its angle from the vertical toward `dir` at s, integrated from the base. */
  planar(th, out, writhe = 0) {
    const t = this.body.t, N = this.N, d = this.d; out[0].copy(this.base);
    for (let i = 1; i < N; i++) {
      const s = (i - 0.5) / (N - 1), a = th(s), w = writhe * Math.sin(t * 0.9 + this.phase * 1.3 - s * 3) * s;
      out[i].copy(out[i - 1]).addScaledVector(UP, Math.cos(a) * d).addScaledVector(this.dir, Math.sin(a) * d).addScaledVector(this.side, w * d);
    }
  }

  /** The pose wanted this frame, into this.target: idle, grasp or slam. */
  pose(hull) {
    const C = this.cmd, T = this.target, t = this.body.t, ph = this.phase;
    const toward = C.move === 'slam' ? this.slamAt(hull) : C.tip ?? hull?.pos ?? _w.copy(this.base).add(this.dir);
    _v.subVectors(toward, this.base).setY(0); if (_v.lengthSq() > 1e-4) this.dir.copy(_v.normalize());
    this.side.set(this.dir.z, 0, -this.dir.x);
    const idle = (s) => 0.22 + 2.3 * s * s + 0.22 * Math.sin(t * 1.1 + ph - s * 4) * (0.3 + s);
    if (C.move === 'slam') {
      const k = C.k, rear = sstep(0, 0.55, k), w = Math.pow(sstep(0.8, 1, k), 1.5);
      const reared = (s) => -0.25 - 0.55 * s * s + 0.06 * Math.sin(t * 9 + s * 6) * rear, laid = (s) => (PI / 2) * sstep(0, 0.16, s) + 0.07 - 0.05 * s;
      this.planar((s) => lerp(lerp(idle(s), reared(s), rear), laid(s), w), T, 0.12 * (1 - rear));
      return;
    }
    this.planar(idle, T, 0.35);
    if (C.tip && C.move !== 'grasp') { _v.subVectors(C.tip, T[this.N - 1]); for (let i = 1; i < this.N; i++) T[i].addScaledVector(_v, Math.pow(i / (this.N - 1), 1.6)); }
    if (C.move === 'grasp' && hull) {
      const W = this.wrap, H = hull.pos, f = _f.set(Math.sin(hull.yaw), 0, Math.cos(hull.yaw)), sd = _s.set(Math.cos(hull.yaw), 0, -Math.sin(hull.yaw));
      _v.subVectors(this.base, H); const along = Math.max(-0.38, Math.min(0.38, _v.dot(f) / hull.length)) * hull.length, sg = Math.sign(_v.dot(sd)) || 1;
      const deck = H.y + hull.deckY, R0 = KL.armR, sq = 0.5 * Math.sin(t * 2.2 + ph) * sstep(0.95, 1, C.k), lift = (1 - sstep(0.55, 1, C.k)) * 9;
      const at = (x, y, o) => o.copy(H).addScaledVector(f, along).addScaledVector(sd, sg * x * hull.beam).setY(y);
      W[0].copy(this.base); W[1].copy(this.base).setY(this.body.seaY + 4).addScaledVector(this.dir, 3);
      at(0.62, deck + R0 * 1.4 + 3 + lift, W[2]); at(0.1, deck + R0 * 0.9 + lift * 0.6 + sq, W[3]); at(-0.52, deck + R0 * 0.5 + lift * 0.3, W[4]);
      at(-0.78, this.body.seaY - 2, W[5]); at(-0.9, this.body.seaY - 26, W[6]);
      const X = this.scratch ??= this.joints.map(() => new THREE.Vector3()), w = sstep(0.25, 1, C.k);
      resample(W, this.d, this.N, X);
      for (let i = 0; i < this.N; i++) T[i].lerp(X[i], w);
    }
  }

  /** Where a slam lands: `at` as given, else 0.72 of its length out toward the hull. */
  slamAt(hull) {
    if (this.cmd.at) return this.atP.copy(this.cmd.at);
    if (!this.slamFixed) { _v.copy(hull?.pos ?? this.base).sub(this.base).setY(0); if (_v.lengthSq() < 1e-4) _v.copy(this.dir); this.atP.copy(this.base).addScaledVector(_v.normalize(), this.L * 0.72); this.slamFixed = true; }
    return this.atP;
  }

  update(dt, hull) {
    if (!this.placed) { this.mesh.visible = false; return; }
    const C = this.cmd, B = this.body, sea = B.seaY;
    if (C.move !== 'slam') { this.slamDone = false; this.slamFixed = false; }
    if (this.broken >= 0) this.broken += dt;
    if (this.dead >= 0 || this.broken >= 0) {
      const tt = Math.max(this.dead, this.broken);
      for (const j of this.joints) j.y -= dt * (2 + 9 * tt);
      if (tt > 3) { this.mesh.visible = false; this.ring.visible = false; return; }
    } else {
      this.pose(hull);
      const rate = C.move === 'slam' && C.k > 0.8 ? 16 : C.move === 'grasp' ? 5 : 3.2, e = 1 - Math.exp(-dt * rate);
      for (let i = 0; i < this.N; i++) this.joints[i].lerp(this.target[i], i === 0 ? 1 : e);
    }
    this.sweep(this.broken >= 0 ? 0.3 : 1);
    this.mesh.visible = true;
    // the slam's ring on the water and its landing
    const slam = C.move === 'slam' && this.alive ? C.k : 0, R = this.ring;
    R.visible = slam > 0 && slam < 1 && !this.slamDone;
    if (R.visible) {
      const at = this.atP, r = KL.slamR * (2 - slam), throb = 0.5 + 0.5 * Math.sin(B.t * (6 + 10 * slam));
      R.position.set(at.x, sea + 0.6, at.z); R.scale.setScalar(r); R.material.opacity = sstep(0, 0.12, slam) * (0.45 + 0.4 * throb + 0.3 * slam);
    }
    const W = B.game.water;
    if (slam >= 0.98 && !this.slamDone) {
      this.slamDone = true;
      if (W?.disturb) { W.disturb(this.atP.x, this.atP.z, 1, 'dive', sea); for (let i = 4; i < this.N; i += 3) { const j = this.joints[i]; W.disturb(j.x, j.z, 0.8, 'dive', sea); } }
    }
    // where it goes through the surface: a crown the first time, a wake ring after
    this.waterT -= dt;
    if (W?.disturb && this.waterT <= 0 && (this.alive || this.broken < 1.5)) {
      for (let i = 0; i < this.N - 1; i++) {
        const a = this.joints[i], b = this.joints[i + 1];
        if ((a.y - sea) * (b.y - sea) > 0) continue;
        const t = (sea - a.y) / ((b.y - a.y) || 1e-3); W.disturb(lerp(a.x, b.x, t), lerp(a.z, b.z, t), this.crossed ? 0.45 : 1, this.crossed ? 'wake' : 'dive', sea);
        this.crossed = true; this.waterT = 0.45; break;
      }
    }
    // the material: the hit's flicker, the gold line while it can be hit, its crazing, the film's tint toward Dread
    const U = this.u; U.uTime.value = B.t; this.flash = Math.max(0, this.flash - dt);
    const up = this.joints[Math.round(this.N * 0.6)].y > sea;
    this.isOpen = this.alive ? (C.open ?? up) ? 1 : 0 : 0;
    U.uStates.value[0].y = this.flash > 0 ? 1 : 0; U.uStates.value[0].x = slam * 0.6 + (C.move === 'grasp' ? 0.4 * C.k : 0);
    U.uParts.value[0].set(this.alive ? this.hurt : 0, this.isOpen);
    U.uAspect.value.copy(B.film).lerp(DREAD, 0.55).multiplyScalar(this.alive ? 1 : Math.max(0, 1 - Math.max(this.dead, this.broken) / 2));
  }
  get alive() { return this.broken < 0 && this.dead < 0; }

  /** The tube: rings along a Catmull-Rom through the joints, framed by parallel transport from the arm's side (so the suckers face its curl). */
  sweep(keep) {
    const J = this.joints, N = this.N, G = this.mesh.geometry, P = G.attributes.position.array, Nr = G.attributes.normal.array, R = KL.rings, S = KL.sides;
    const grip = this.cmd.move === 'grasp' ? sstep(0.9, 1, this.cmd.k) : 0, t = this.body.t;
    for (let i = 0; i < R; i++) {
      const u = (i / (R - 1)) * (N - 1), k = Math.min(N - 2, Math.floor(u)), f = u - k, s = i / (R - 1);
      const p0 = J[Math.max(0, k - 1)], p1 = J[k], p2 = J[k + 1], p3 = J[Math.min(N - 1, k + 2)], f2 = f * f, f3 = f2 * f, Pp = this.rP[i], T = this.rT[i];
      for (const ax of ['x', 'y', 'z']) {
        const a = p0[ax], b = p1[ax], c = p2[ax], e = p3[ax];
        Pp[ax] = 0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - e) * f2 + (-a + 3 * b - 3 * c + e) * f3);
        T[ax] = 0.5 * ((-a + c) + 2 * (2 * a - 5 * b + 4 * c - e) * f + 3 * (-a + 3 * b - 3 * c + e) * f2);
      }
      if (T.lengthSq() < 1e-8) T.copy(i ? this.rT[i - 1] : UP);
      T.normalize();
      const Bv = this.rB[i], Nn = this.rN[i];
      if (i === 0) Bv.copy(this.side); else Bv.copy(this.rB[i - 1]);
      Bv.addScaledVector(T, -T.dot(Bv)); if (Bv.lengthSq() < 1e-6) Bv.crossVectors(T, UP); Bv.normalize();
      Nn.crossVectors(T, Bv).normalize(); // (away from the curl: the suckers on the far side)
      const r = armR(s) * (s > keep ? 0 : 1) * (1 - 0.1 * grip * (0.5 + 0.5 * Math.sin(t * 5 - s * 10)));
      for (let j = 0; j < S; j++) {
        const a = (j / S) * PI * 2, ca = Math.cos(a), sa = Math.sin(a), v = i * S + j, rr = r * this.bump[v];
        P[v * 3] = Pp.x + (Nn.x * ca + Bv.x * sa) * rr; P[v * 3 + 1] = Pp.y + (Nn.y * ca + Bv.y * sa) * rr; P[v * 3 + 2] = Pp.z + (Nn.z * ca + Bv.z * sa) * rr;
        _n.copy(Nn).multiplyScalar(ca).addScaledVector(Bv, sa); Nr[v * 3] = _n.x; Nr[v * 3 + 1] = _n.y; Nr[v * 3 + 2] = _n.z;
      }
    }
    G.attributes.position.needsUpdate = true; G.attributes.normal.needsUpdate = true; G.computeBoundingSphere();
  }

  /** Thrown off: its upper reach into the voxel batch (baked from its pose now), its stub sinking. */
  breakOff() {
    if (!this.alive) return;
    const V = this.body.game.voxels || voxelsNow();
    if (V?.burst) {
      const key = `kraken.${this.id}.${(this.body.breaks = (this.body.breaks || 0) + 1)}`;
      this.mesh.updateWorldMatrix(true, false); voxelize(this.mesh, { key, cells: 26, cap: 240 });
      V.burst({ object: this.mesh, key, at: this.joints[Math.round(this.N * 0.35)], power: 1.4, aspect: 'dread' });
    }
    const W = this.body.game.water; if (W?.disturb) for (let i = 2; i < this.N; i += 4) W.disturb(this.joints[i].x, this.joints[i].z, 0.9, 'dive', this.body.seaY);
    this.broken = 0; this.flash = 0;
  }

  dispose() { this.mesh.removeFromParent(); this.ring.removeFromParent(); this.mesh.geometry.dispose(); this.mat.dispose(); this.ring.material.dispose(); }
}

/** The head, +z forward (toward the ship), its origin at the water: the mantle reared up and back, the eyes at the waterline (the
 *  safari kraken's head, egregoreshapes2.js bigSquid, without its baked arms). */
function buildHead() {
  const k = new FoeKit(), mottle = (x, y, z) => (hash(Math.floor(x * 0.4), Math.floor(y * 0.4), Math.floor(z * 0.4)) > 0.66 ? RED_D : RED);
  k.add(loft([[-18, 0.4, 0.4, 0], [-15, 3, 3, 0], [-10, 5, 5, 0], [-4, 5.6, 5.6, 0], [0, 4.8, 4.8, 0]], 16), { c: mottle, p: [0, 2.5, -1], r: [1.15, 0, 0], g: 'mantle' });
  k.add(new THREE.SphereGeometry(1, 16, 10), { c: mottle, p: [0, 1.4, 2.4], s: [5.0, 3.4, 4.4], g: 'head' });
  for (const s of [-1, 1]) {
    k.add(new THREE.SphereGeometry(1.5, 12, 10), { c: PALE, fx: [0.3, 0, 0, 0], p: [s * 4.3, 2.2, 3.4], s: [0.6, 1, 1], g: 'eyes' });
    k.add(new THREE.SphereGeometry(1.1, 10, 8), { c: 0x6a9a7a, fx: [1.6, 0, 0, 0], p: [s * 4.75, 2.2, 3.5], s: [0.4, 0.9, 0.9], g: 'eyes' }); // (the iris, lit in Dread)
    k.add(new THREE.SphereGeometry(0.5, 8, 6), { c: INK, p: [s * 5.05, 2.2, 3.55], s: [0.3, 1.2, 0.5], g: 'eyes' });
  }
  for (let i = 0; i < 8; i++) { const a = PI * (-0.15 + 1.3 * (i / 7)); k.add(new THREE.CylinderGeometry(1.1, 1.5, 6, 8), { c: PALE, p: [Math.cos(a) * 4, -1.5, Math.sin(a) * 4 + 3], r: [0.9 * Math.sin(a), 0, -0.9 * Math.cos(a)], g: 'roots' }); } // (the arms' roots, under the eyes)
  const b = k.build(); b.geo.setAttribute('rest', new THREE.BufferAttribute(b.geo.attributes.position.array.map((x) => x / 2), 3));
  return b;
}

/** The ink: a disc on the water, its edge broken by a turning noise, opaque inside, the film's sheen faint at its rim. */
function inkMaterial() {
  const u = { uK: { value: 0 }, uT: { value: 0 } }, m = new THREE.MeshBasicMaterial({ color: 0x050407, transparent: true, depthWrite: false });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vInk;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvInk = position.xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uK, uT;
varying vec2 vInk;
float inkN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.55), b = fract(sin(dot(i + vec2(1, 0), vec2(127.1, 311.7))) * 43758.55);
  float c = fract(sin(dot(i + vec2(0, 1), vec2(127.1, 311.7))) * 43758.55), d = fract(sin(dot(i + vec2(1, 1), vec2(127.1, 311.7))) * 43758.55);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }`).replace('#include <alphamap_fragment>', `#include <alphamap_fragment>
{
  float r = length(vInk), a = atan(vInk.y, vInk.x) + uT * 0.05;
  vec2 q = vec2(cos(a), sin(a)) * r * 5.0;
  float n = 0.6 * inkN(q + uT * 0.12) + 0.4 * inkN(q * 2.3 - uT * 0.2);
  float edge = r + (n - 0.5) * 0.35;
  diffuseColor.a = uK * (1.0 - smoothstep(0.72, 1.0, edge)) * 0.97;
  diffuseColor.rgb += vec3(0.30, 0.06, 0.70) * 0.12 * smoothstep(0.6, 0.95, edge) * (0.5 + 0.5 * sin(a * 6.0 + uT));
}`);
  };
  m.customProgramCacheKey = () => 'kraken-ink'; m.userData.u = u;
  return m;
}

export class KrakenBody {
  constructor(game, { arms = KL.arms, seaY = SEA.y } = {}) {
    this.game = game; this.seaY = seaY; this.t = 0; this.dead = -1; this.placed = false; this.film = new THREE.Color();
    this.group = new THREE.Group(); this.group.visible = false; this.group.userData.zone = 'opensea';
    this.ringGeo = new THREE.RingGeometry(0.9, 1, 72, 1).rotateX(-PI / 2);
    const inner = new THREE.RingGeometry(0.42, 0.45, 48, 1).rotateX(-PI / 2); // (a hairline inside: the mark's centre)
    this.ringGeo = (() => { const g = new THREE.BufferGeometry(), a = this.ringGeo.toNonIndexed(), b = inner.toNonIndexed(), p = new Float32Array([...a.attributes.position.array, ...b.attributes.position.array]); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); a.dispose(); b.dispose(); inner.dispose(); return g; })();
    this.arms = Array.from({ length: arms }, (_, i) => new KrakenArm(this, i));
    const H = buildHead();
    this.headMat = serpentMaterial(); this.hu = this.headMat.userData.u;
    this.head = new THREE.Mesh(H.geo, this.headMat); this.head.scale.setScalar(KL.head); this.head.castShadow = true;
    this.headAt = new THREE.Vector3(); this.headSet = false; this.headRise = 0; this.headWant = 0; this.headFlash = 0; this.headHurt = 0; this.headYaw = 0; this.headWaterT = 0; this.headUp = false;
    this.headPos = new THREE.Vector3(); this.headRadius = 5.5 * KL.head;
    this.inkMat = inkMaterial(); this.ink = new THREE.Mesh(new THREE.CircleGeometry(1, 64).rotateX(-PI / 2), this.inkMat);
    this.ink.visible = false; this.ink.renderOrder = 40;
    this.inkK = 0; this.inkGrow = 0; this.inkHold = 0; this.inkAt = new THREE.Vector3(); this.inkWas = false; this.inkPuffT = 0;
    for (const m of [this.head, this.ink]) m.userData.zone = 'opensea';
    this.group.add(this.head, this.ink, ...this.arms.flatMap((a) => [a.mesh, a.ring]));
    this.hull = null; this.cmd = { open: false, move: null, k: 0 };
    this._parts = [...this.arms.map((a) => ({ id: a.id, pos: new THREE.Vector3(), r: 0, open: false })), { id: 'head', pos: this.headPos, r: this.headRadius, open: false }];
    this.tris = this.arms.reduce((n, a) => n + a.tris, 0) + H.tris + 128;
    game.scene?.add(this.group);
  }

  /** Arm i's default base: round the hull on an ellipse 9 m out from its sides, the arms spread bow to stern on both sides. */
  baseAt(i, hull, out = new THREE.Vector3()) {
    const H = hullOf(hull), n = this.arms.length, a = ((i + 0.5) / n) * PI * 2 + 0.3, f = Math.sin(H.yaw), g = Math.cos(H.yaw);
    const x = Math.cos(a) * (H.beam / 2 + 9), z = Math.sin(a) * (H.length / 2 + 9); // (x across, z along)
    return out.set(H.pos.x + g * x + f * z, this.seaY - 4, H.pos.z - f * x + g * z);
  }

  drive({ hull = null, head = null, open = false, move = null, k = 0, arms = [] } = {}) {
    const H = hullOf(hull); if (H) this.hull = H;
    const C = this.cmd; C.open = !!open; C.move = move; C.k = Math.min(1, Math.max(0, k));
    for (const a of arms || []) { const A = this.arms[armIndex(a.id)]; if (A) A.drive(a, this.hull); }
    for (const A of this.arms) if (!A.hasBase && this.hull) A.drive({}, this.hull);
    if (head) { this.headAt.copy(head); this.headSet = true; }
    else if (!this.headSet && this.hull) { // (beside the hull, abeam the way most bases lie)
      const Hh = this.hull, sd = _s.set(Math.cos(Hh.yaw), 0, -Math.sin(Hh.yaw)); let side = 0;
      for (const A of this.arms) side += Math.sign(_v.subVectors(A.base, Hh.pos).dot(sd));
      this.headAt.copy(Hh.pos).addScaledVector(sd, (side >= 0 ? 1 : -1) * (Hh.beam / 2 + this.headRadius + 10)).setY(this.seaY);
    }
    if (move === 'ink' && !this.inkWas && this.hull) this.inkAt.copy(this.hull.pos);
    this.inkWas = move === 'ink';
    if (!this.placed) { this.placed = true; this.headRise = 0; }
    this.group.visible = this.dead < 4;
  }

  arm(id) { return this.arms[armIndex(id)] || null; }
  hit(part = 'head', k = 0) {
    k = Math.min(1, Math.max(0, k));
    if (part === 'head') { this.headFlash = 0.3; this.headHurt = Math.max(this.headHurt, k); return; }
    const A = this.arm(part); if (A) { A.flash = 0.3; A.hurt = Math.max(A.hurt, k); }
  }
  break(id) { this.arm(id)?.breakOff(); }
  down() { if (this.dead >= 0) return; this.dead = 0; for (const A of this.arms) if (A.alive) A.dead = 0; }
  parts() {
    for (let i = 0; i < this.arms.length; i++) {
      const A = this.arms[i], P = this._parts[i], j = Math.round((A.N - 1) * 0.6);
      P.pos.copy(A.joints[j]); P.r = A.radii[j] + 1.5; P.open = !!A.isOpen;
    }
    const Hp = this._parts[this.arms.length]; Hp.open = this.hu.uParts.value[0].y > 0.5; Hp.r = this.headRadius;
    return this._parts;
  }

  update(dt) {
    if (!this.placed) return;
    this.t += dt;
    if (this.dead >= 0) { this.dead += dt; if (this.dead > 4) { this.group.visible = false; return; } }
    const f = 0.5 + 0.5 * Math.sin(this.t * 0.21), F0 = FILM[0], F1 = FILM[1];
    this.film.setRGB(lerp(F0[0], F1[0], f), lerp(F0[1], F1[1], f), lerp(F0[2], F1[2], f));
    for (const A of this.arms) A.update(dt, this.hull);
    this.updateHead(dt); this.updateInk(dt);
  }

  /** The head: risen from the deep once open, its eyes at the water, turned to the ship; sinks on down. */
  updateHead(dt) {
    const sea = this.seaY, want = this.dead >= 0 ? 0 : this.cmd.open ? 1 : 0;
    this.headRise += (want - this.headRise) * (1 - Math.exp(-dt * (want ? 0.7 : 1.2)));
    const M = this.head, r = this.headRise;
    if (this.hull) { const yaw = Math.atan2(this.hull.pos.x - this.headAt.x, this.hull.pos.z - this.headAt.z); this.headYaw += Math.atan2(Math.sin(yaw - this.headYaw), Math.cos(yaw - this.headYaw)) * (1 - Math.exp(-dt * 1.5)); }
    M.visible = r > 0.02;
    M.position.set(this.headAt.x, sea - 1.9 * KL.head + lerp(-36, 0, Math.pow(r, 0.7)) + 0.6 * Math.sin(this.t * 0.5) - (this.dead > 0 ? this.dead * this.dead * 3 : 0), this.headAt.z);
    M.rotation.set(-0.12 * Math.sin(this.t * 0.4) * r, this.headYaw, 0, 'YXZ'); M.updateMatrixWorld(true);
    this.headPos.set(0, 2.2, 3.4).applyMatrix4(M.matrixWorld);
    const up = this.headPos.y > sea - 2, W = this.game.water; this.headWaterT -= dt;
    if (W?.disturb && (up !== this.headUp || (up && this.headWaterT <= 0 && this.dead < 0))) {
      const R = this.headRadius * 1.2, n = up !== this.headUp ? 10 : 4;
      for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2 + this.t; W.disturb(M.position.x + Math.cos(a) * R, M.position.z + Math.sin(a) * R, up !== this.headUp ? 1 : 0.5, up !== this.headUp ? 'dive' : 'wake', sea); }
      this.headWaterT = 0.8;
    }
    this.headUp = up;
    const U = this.hu, live = this.dead < 0 ? 1 : 0; U.uTime.value = this.t; this.headFlash = Math.max(0, this.headFlash - dt);
    U.uStates.value[0].y = this.headFlash > 0 ? 1 : 0; U.uStates.value[0].x = this.cmd.move === 'ink' ? this.cmd.k : 0;
    U.uParts.value[0].set(live * this.headHurt, live * (this.cmd.open ? sstep(0.7, 0.9, r) : 0));
    U.uAspect.value.copy(DREAD).multiplyScalar(1.6).lerp(this.film, 0.25).multiplyScalar(this.dead < 0 ? 1 : Math.max(0, 1 - this.dead / 3));
  }

  /** The ink: grown over its windup round where the ship was when it began, held, then faded over the row's hold. */
  updateInk(dt) {
    const C = this.cmd, I = this.ink;
    if (C.move === 'ink' && this.dead < 0) { this.inkGrow = Math.max(this.inkGrow, C.k); this.inkK = Math.max(this.inkK, sstep(0, 0.4, C.k)); this.inkHold = KL.ink.hold; }
    else if (this.inkK > 0) { this.inkHold -= dt; if (this.inkHold < 1.5) this.inkK = Math.max(0, this.inkK - dt / 1.5); if (this.inkK <= 0) this.inkGrow = 0; }
    I.visible = this.inkK > 0.002;
    if (!I.visible) return;
    const r = KL.ink.r * (0.25 + 0.75 * sstep(0, 1, this.inkGrow));
    I.position.set(this.inkAt.x, this.seaY + 0.7, this.inkAt.z); I.scale.set(r, 1, r);
    this.inkMat.userData.u.uK.value = this.inkK; this.inkMat.userData.u.uT.value = this.t;
    const W = this.game.water; this.inkPuffT -= dt;
    if (W?.disturb && C.move === 'ink' && this.inkPuffT <= 0) { this.inkPuffT = 0.3; const a = this.t * 2.3; W.disturb(this.inkAt.x + Math.cos(a) * r * 0.9, this.inkAt.z + Math.sin(a) * r * 0.9, 0.6, 'wake', this.seaY); }
  }

  dispose() {
    this.group.removeFromParent();
    for (const A of this.arms) A.dispose();
    this.head.geometry.dispose(); this.headMat.dispose(); this.ink.geometry.dispose(); this.inkMat.dispose(); this.ringGeo.dispose();
  }
}
