// ---------------------------------------------------------------------------------------
// MYGGDRASIL, AS DRAWN (South, 2026-10-30: "much much more alien fungus mixed with large coral structures. Twisting gnarled roots, very
// Studio Ghibli environment art"; before it, the owner, 2026-10-08: "make sure its model is BIG"; docs/plans/MYCELIUM.md section 4; the
// name Espada's). A world tree 48 m from its ground to the top of its Crown (ECON.myggdrasil.treeHeight), on the garden's largest
// planetoid, a landmark from every other: a knot of roots that grew into a reef in the air, and fruits as a fungus does.
//
//   THE ROOTS    ten strands gripping the planetoid, half sunk and humping over it, braided up into the trunk: a wide bole round a dark
//                hollow, then a lattice you see through, then a column of four that carries the Crown (./myggdrasil/roots.js). THE
//                ROOTS' MOUTH is the arch where two strands part at the bole's foot; in the hollow behind it a pool glows in the
//                tincture's colour (`mouthAt`: the world's F stands at its threshold)
//   THE CROWN    six strands peel off as coral limbs to the side caps; staghorn forks, tables in two tiers, sea fans, brain corals and
//                tube sponges round them (./myggdrasil/coral.js); shelf fungi, lion's mane and morels on it all (./myggdrasil/fungi.js)
//   THE CAPS     the ten fruiting bodies on the Tree of Life's places (CAP_SITES: Espada's sephiroth, root up), great caps with glowing
//                gills under them (./myggdrasil/caps.js). Shut, a button; one opens at a time from the root up over MYGG.openSeconds
//                real seconds, its vertices morphed in the one geometry (no rebuild). The tincture leans their tops, their gills more
//   THE BRANCHES twenty-two threads of light between the caps (BRANCH_PATHS, the Golden Dawn's paths 11 to 32, Dovina's BRANCHES by
//                their trump): a hung one gold and running, the rest a ghost. THE MYCELIUM'S THREADS run on over the ground from the
//                roots' tips (`threadsTo(points)` to the spore beds; until then they fan out). FRUIT hangs under the open caps,
//                glowing in the tincture's colour (as many as the crown holds)
//   ITS AIR      spores always: falling from the open gills, breathing out of the sponges, wandering out of the mouth
//                (./myggdrasil/spores.js); by night the gills, the polyps, the sponges' throats and the mouth luminous
//   ITS COST     the body is ONE geometry and ONE program (./myggdrasil/material.js), near and far (MYGG.lodFar: the far one fewer
//                sides and rings, its smallest things left out, built from the same chances so the swap never moves a part); the
//                fruit the same program; the threads and branches the ribbons' program (vfx/ribbonlight.js); the spores the game's
//                sprite particles (vfx/sprites.js). Five draws and two shadows; a cap moving writes only its own vertices
//
// Prior art: Nausicaa's Sea of Corruption (the Fukai: a forest of fungus and coral, spore-fall, the Ohmu's colours), Laputa's great tree
// (roots knotted round a world), Princess Mononoke's forest, the strangler fig's lattice trunk, the reef (staghorn and table Acropora,
// Gorgonia, Diploria, Aplysina), the world trees (Yggdrasil; Legend of Mana's Trent), the Kabbalists' Tree of Life and the Golden Dawn's
// tarot on its paths, and real glowing fungi (Mycena's gills, Panellus's foxfire).
//
//   const M = new WorldMushroom({ radius: 26, surface: (dir) => metres })   M.group (at the planetoid's heart, the tree up its +Y)
//   M.update(rawDt, state)   (state: game.myggdrasil, read defensively: caps 0..10, branches { id: true } | Set | [ids], tincture { h, s }
//   | null, crown [fruit]; missing, caps 3 and nothing hung)   M.threadsTo(points)   M.mouthWorld(out)   M.mouthAt (local)
//   M.snap()   M.dispose()   M.tris   CAP_SITES   BRANCH_PATHS   MYGG   trunkR   myggdrasilParked()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { veinMaterial } from './veins.js';
import { GROUND_UNIFORMS } from './gardengrounds.js';
import { wheelColour } from '../wheelcolour.js';
import { MYGG, CAP_SITES, BRANCH_PATHS, trunkR, treeFrame, lcg, angDiff, D2R } from './myggdrasil/layout.js';
import { myggdrasilMaterial } from './myggdrasil/material.js';
import { buildBody } from './myggdrasil/body.js';
import { setCap, fruitAt } from './myggdrasil/caps.js';
import { TreeKit, tube, sheet, ink, lin } from './myggdrasil/kit.js';
import { MyggSpores } from './myggdrasil/spores.js';
import { PAL } from './myggdrasil/palette.js';

export { MYGG, CAP_SITES, BRANCH_PATHS, trunkR };
const BRANCH_IDS = Object.keys(BRANCH_PATHS);
const SPIRAL = { priestess: 200 }; // (a branch between two caps on the column winds round it from this bearing)
const AMBER = lin(0xe8c878);

export class WorldMushroom {
  constructor({ radius = 26, surface = null, seed = 1 } = {}) {
    this.R = radius; this.F = treeFrame(radius, surface); this.y0 = this.F.y0;
    const g = this.group = new THREE.Group(); g.name = 'myggdrasil';
    this.mat = myggdrasilMaterial(); this.u = this.mat.userData.u;
    // the body, near and far (one LOD: the far body past MYGG.lodFar)
    this.bodies = [buildBody(this.F, 0, seed), buildBody(this.F, 1, seed)];
    this.lod = new THREE.LOD(); this.lod.name = 'myggdrasil-crown'; this.lod.position.set(0, this.y0 + 24, 0);
    this.eye = new THREE.Vector3(1e6, 0, 0);
    const seen = (r, s, cam) => { this.eye.setFromMatrixPosition(cam.matrixWorld); };
    this.bodies.forEach((B, i) => {
      const mesh = new THREE.Mesh(B.geometry, this.mat); mesh.position.set(0, -(this.y0 + 24), 0); mesh.name = i ? 'myggdrasil-body-far' : 'myggdrasil-body-near';
      mesh.castShadow = mesh.receiveShadow = true; mesh.onBeforeRender = seen; B.mesh = mesh;
      const holder = new THREE.Group(); holder.add(mesh); this.lod.addLevel(holder, i ? MYGG.lodFar : 0, 0.08);
    });
    g.add(this.lod);
    this.cap = CAP_SITES.map((C, i) => ({ ...C, i, k: 1, shown: 1, near: this.bodies[0].caps[i], far: this.bodies[1].caps[i] }));
    this.mouthAt = this.bodies[0].mouthAt.clone(); this.tips = this.bodies[0].tips;
    // the mycelium's threads and the branches' lights (the ribbons' program)
    this.vein = { u: { uT: { value: 0 }, uK: { value: 0.55 }, uC: { value: new THREE.Color(0xf0dca0) } } };
    this.veins = new THREE.Mesh(new THREE.BufferGeometry(), veinMaterial(this.vein.u)); this.veins.name = 'myggdrasil-threads'; g.add(this.veins);
    this.threadsTo(null);
    this.lit = { u: { uT: { value: 0 }, uK: { value: 1 }, uC: { value: new THREE.Color(0xffcf6a) } } }; this.ghost = { u: { uT: { value: 0 }, uK: { value: 0.16 }, uC: { value: new THREE.Color(0x9a8cc8) } } };
    for (const B of [this.lit, this.ghost]) { B.mesh = new THREE.Mesh(new THREE.BufferGeometry(), veinMaterial(B.u)); B.mesh.name = 'myggdrasil-branches'; g.add(B.mesh); }
    // the fruit (the body's program) and the spores (the game's sprite particles)
    this.fruit = new THREE.Mesh(new THREE.BufferGeometry(), this.mat); this.fruit.name = 'myggdrasil-fruit'; this.fruit.visible = false; g.add(this.fruit);
    this.spores = new MyggSpores(g, this.bodies[0].emit);
    this.colour = new THREE.Color(0xe8c878); this.colourWant = this.colour.clone(); this.tintAmt = 0; this.tintWant = 0;
    this.keys = { fruit: null, lit: null }; this.pulse = 0; this.t = 0; this.ready = false;
  }
  /** Triangles in the near body and the far (for a probe). */
  get tris() { return this.bodies.map((B) => B.tris); }

  /** Sends the mycelium's threads to these points (world positions: the spore beds on this planetoid), each from its nearest root's tip;
   *  with none, they fan out over the planetoid. */
  threadsTo(points) {
    const key = points?.length ? points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}`).join('|') : '';
    if (key === this.threadKey) return; this.threadKey = key; // (the same beds: nothing to lay again)
    const strips = [], rnd = lcg(29), here = [];
    if (points?.length) { this.group.updateWorldMatrix(true, false); for (const p of points) { const l = this.group.worldToLocal(_p.copy(p)); if (Math.abs(l.length() - this.R) < 12) here.push(l.clone()); } }
    if (here.length) {
      for (const l of here) {
        const az = Math.atan2(l.x, l.z) / D2R, s = Math.acos(THREE.MathUtils.clamp(l.y / l.length(), -1, 1)) * this.R;
        const T = this.tips.reduce((b, a) => (Math.abs(angDiff(a.az, az)) < Math.abs(angDiff(b.az, az)) ? a : b)), s0 = Math.min(T.s, Math.max(10, s - 3));
        strips.push(this.veinPath(T.az, az, s0, Math.max(s0 + 1, s), rnd));
      }
    } else for (const T of this.tips) {
      const az1 = T.az + (rnd() - 0.5) * 30, s1 = T.s + 9 + rnd() * 8; strips.push(this.veinPath(T.az, az1, T.s, s1, rnd));
      const f = 0.45 + rnd() * 0.2; strips.push(this.veinPath(T.az + (az1 - T.az) * f, az1 + (rnd() < 0.5 ? -1 : 1) * (14 + rnd() * 12), T.s + (s1 - T.s) * f, s1 - 2 - rnd() * 4, rnd));
    }
    this.veins.geometry.dispose(); this.veins.geometry = ribbonGeometry(strips, 0.34, false);
  }
  /** A vein over the ground from (az0, s0) out to (az1, s1), wandering a little; its points far end first (the light runs in). */
  veinPath(az0, az1, s0, s1, rnd) {
    const n = Math.max(8, Math.round((s1 - s0) / 0.9)), pts = [], w1 = rnd() * 6, w2 = rnd() * 6;
    for (let i = n; i >= 0; i--) { const t = i / n, az = az0 + angDiff(az0, az1) * t + 4 * Math.sin(t * 7 + w1) + 2 * Math.sin(t * 17 + w2), s = s0 + (s1 - s0) * t; pts.push({ p: this.F.ground(az, s, 0.07), n: this.F.up(az, s) }); }
    return pts;
  }

  /** The branches' threads of light for the hung set (lit) and the rest (ghost), each between its two caps, round the column. */
  buildBranches(lit) {
    const L = [], G = [], ring = (y) => trunkR(y) + (y < 22 ? 1.8 : 1.4);
    BRANCH_IDS.forEach((id, i) => {
      const [a, b] = BRANCH_PATHS[id], A = this.cap[a], B = this.cap[b];
      let azA, azB;
      if (A.out && B.out) { azA = A.az; azB = B.az; } else if (A.out) { azA = azB = A.az; } else if (B.out) { azA = azB = B.az; } else { azA = SPIRAL[id] ?? 0; azB = azA + 100; }
      const node = (C, az) => (C.out ? { az: C.az, rho: C.out, y: C.y - (C.stalk ? 0.6 : 1.0) } : C.top ? { az, rho: ring(38.5), y: C.y - 3.6 } : { az, rho: ring(C.y) + 0.5, y: C.y - 1.6 });
      const nA = node(A, azA), nB = node(B, azB), d = angDiff(nA.az, nB.az) || 0, span = Math.abs(d) * D2R, flat = Math.abs(nB.y - nA.y) < 3, pts = [];
      for (let k = 0; k <= 40; k++) {
        const t = k / 40, y = nA.y + (nB.y - nA.y) * t - (flat ? 0.7 : 0.2) * Math.sin(Math.PI * t), az = nA.az + d * t;
        const dip = THREE.MathUtils.smoothstep(Math.abs(d), 70, 170) * Math.sin(Math.PI * t) ** 0.8; // (a branch across the tree runs in to the column and round it, never a hoop round the whole crown)
        const rho = Math.max(ring(y), THREE.MathUtils.lerp(nA.rho + (nB.rho - nA.rho) * t + (0.4 + 0.45 * span) * Math.sin(Math.PI * t), ring(y) + 0.4, dip));
        pts.push({ p: this.F.at(az, rho, y) });
      }
      (lit.has(i) ? L : G).push(pts);
    });
    for (const [B, S] of [[this.lit, L], [this.ghost, G]]) { B.mesh.geometry.dispose(); B.mesh.geometry = ribbonGeometry(S, 0.5, true); B.mesh.visible = S.length > 0; }
  }

  /** The fruit for `n` (at most MYGG.fruitMax), hung under the caps open or opening (`hosts` of them, from the root up) on stems. */
  buildFruit(n, hosts) {
    const K = new TreeKit(), H = this.cap.filter((C) => C.i < Math.max(1, hosts)), rnd = lcg(71);
    for (let j = 0; j < n && H.length; j++) {
      const C = H[j % H.length], k = Math.floor(j / H.length), a = (k * 137.5 + C.i * 41) * D2R, top = fruitAt(C.near, a, C.out ? 0.45 + 0.14 * (k % 2) : 0.55 + 0.1 * (k % 3), new THREE.Vector3());
      const len = 1.0 + rnd() * 1.4, size = (C.top ? 1.25 : 0.95) * (0.85 + rnd() * 0.3), end = top.clone().setY(top.y - len);
      tube(K, [top, top.clone().lerp(end, 0.5).add(new THREE.Vector3(0.08, 0, 0.05)), end], { r: 0.05, radial: 4, segs: 3, paint: () => ink(PAL.boneShade, 0.6, null, 0, 0, 0, 0, 0.9) });
      const prof = [[0.07, 0], [0.08, -0.05], [0.22, -0.38], [0.4, -0.5], [0.5, -0.66], [0.42, -0.78], [0.18, -0.86], [0.01, -0.9]];
      sheet(K, prof.length, 10, (i, jj, o) => { const ph = (jj / 10) * Math.PI * 2; return o.set(end.x + Math.sin(ph) * prof[i][0] * size, end.y + prof[i][1] * size, end.z + Math.cos(ph) * prof[i][0] * size); }, { wrap: true, paint: (u) => ink(AMBER, 0.45, AMBER, 0.55 + 0.25 * u, 1, 0, 0.6, 0.45) });
    }
    this.fruit.geometry.dispose(); this.fruit.geometry = K.n ? K.geometry() : new THREE.BufferGeometry();
    this.fruit.visible = K.n > 0; this.fruitShown = n;
  }

  /** Each frame: the caps toward the state (one at a time, from the root up), the branches, the fruit, the tincture, the glow, the spores. */
  update(raw = 1 / 60, state = null) {
    const S = readState(state); this.t += raw; this.state = S;
    if (!this.ready) { for (const C of this.cap) C.k = C.i < S.caps ? 1 : 0; this.ready = true; this.settle = true; } // (as it is when first seen: nothing opens at the garden's door)
    else {
      let m = this.cap.find((C) => C.i < S.caps && C.k < 1); if (!m) for (let i = 9; i >= 0; i--) if (i >= S.caps && this.cap[i].k > 0) { m = this.cap[i]; break; }
      if (m) m.k = THREE.MathUtils.clamp(m.k + (m.i < S.caps ? 1 : -1) * raw / MYGG.openSeconds, 0, 1);
    }
    for (const C of this.cap) if (C.k !== C.shown) { C.shown = C.k; setCap(this.bodies[0].geometry, C.near, C.k); setCap(this.bodies[1].geometry, C.far, C.k); }
    const litKey = [...S.lit].sort((a, b) => a - b).join(',');
    if (litKey !== this.keys.lit) { if (this.keys.lit !== null && S.lit.size > this.litCount) this.pulse = 1; this.buildBranches(S.lit); this.keys.lit = litKey; this.litCount = S.lit.size; } // (a card hung: the lit threads flare once)
    const hosts = this.cap.reduce((n, C) => n + (C.k > 0 ? 1 : 0), 0), fruitKey = `${Math.min(S.fruit, MYGG.fruitMax)}|${hosts}|${this.cap.map((C) => (C.k >= 1 ? 1 : 0)).join('')}`; // (fruit hangs under a cap only once it has begun to open; laid again as each finishes, under its open gills)
    if (fruitKey !== this.keys.fruit && (!this.cap.some((C) => C.k > 0 && C.k < 1) || this.keys.fruit === null)) { this.keys.fruit = fruitKey; this.buildFruit(Math.min(S.fruit, MYGG.fruitMax), hosts); }
    // the tincture: the caps, the gills, the fruit and the mouth leaned to its colour, eased over about two real seconds
    if (S.tincture) { wheelColour(S.tincture.h, Math.max(0.6, S.tincture.s), this.colourWant); this.tintWant = 0.3 + 0.7 * THREE.MathUtils.smoothstep(S.tincture.s, 0.05, 0.6); }
    else { this.colourWant.setHex(0xe8c878); this.tintWant = 0; }
    const ease = this.settle ? 1 : 1 - Math.exp(-raw * 1.6); this.settle = false; this.colour.lerp(this.colourWant, ease); this.tintAmt += (this.tintWant - this.tintAmt) * ease;
    this.u.uMygTint.value.copy(this.colour); this.u.uMygTintK.value = this.tintAmt;
    const night = GROUND_UNIFORMS.uGNight.value ?? 0;
    this.vein.u.uC.value.setHex(0xf0dca0).lerp(this.colour, 0.5); this.vein.u.uK.value = 0.4 + 0.4 * night;
    this.pulse = Math.max(0, this.pulse - raw / 2.5); this.lit.u.uK.value = (0.75 + 0.35 * night) * (1 + 1.2 * this.pulse);
    this.ghost.u.uK.value = 0.1 + 0.1 * night;
    for (const u of [this.vein.u, this.lit.u, this.ghost.u]) u.uT.value = (u.uT.value + raw) % 3600;
    // the spores, only near (the eye as last drawn, in the tree's frame)
    const near = this.eye.distanceTo(this.group.localToWorld(_p.set(0, this.y0 + 20, 0))) < MYGG.sporesNear;
    this.spores.update(raw, { near, open: (i) => this.cap[i]?.k ?? 0, tint: this.tintAmt > 0.05 ? this.colour : null });
  }

  /** The next update takes the state at once (the caps, the tincture): for a test, or a planetoid made again. */
  snap() { this.ready = false; }
  /** Where the hand feeds it: the mouth's threshold, in the world. */
  mouthWorld(out = new THREE.Vector3()) { return this.group.localToWorld(out.copy(this.mouthAt)); }

  dispose() {
    if (this.gone) return; this.gone = true;
    this.group.parent?.remove(this.group); this.spores.dispose();
    for (const B of this.bodies) B.geometry.dispose();
    for (const o of [this.veins, this.lit.mesh, this.ghost.mesh, this.fruit]) { o.geometry.dispose(); if (o.material !== this.mat) o.material.dispose(); }
    this.mat.dispose();
  }
}

/** A small mesh in the body's program, for a warm-up to compile it before the tree is first given (never disposed). */
let PARKED = null;
export function myggdrasilParked() {
  if (PARKED) return PARKED;
  const K = new TreeKit(); sheet(K, 2, 3, (i, j, o) => o.set(j * 0.1, i * 0.1, 0), { paint: () => ink(PAL.bone, 1, PAL.gTeal, 0.1, 0, 0.5, 0.2, 0.8) });
  const m = myggdrasilMaterial(); m.userData.shared = true;
  PARKED = new THREE.Mesh(K.geometry(), m); PARKED.name = 'myggdrasil-parked'; PARKED.castShadow = PARKED.receiveShadow = true;
  return PARKED;
}

// ---- the state, read defensively (Dovina's game.myggdrasil; any part of it may be missing)
function readState(st) {
  const c = Number(st?.caps), caps = Number.isFinite(c) ? THREE.MathUtils.clamp(Math.round(c), 0, 10) : MYGG.defaultCaps;
  const lit = new Set(), take = (id) => { const i = branchIndex(id); if (i >= 0) lit.add(i); }, b = st?.branches;
  if (b instanceof Set || Array.isArray(b)) for (const id of b) take(id);
  else if (b && typeof b === 'object') for (const [id, on] of Object.entries(b)) if (on) take(id);
  const t = st?.tincture, tincture = t && Number.isFinite(+t.h) && Number.isFinite(+t.s) ? { h: ((+t.h % 360) + 360) % 360, s: THREE.MathUtils.clamp(+t.s, 0, 1) } : null;
  const fruit = Array.isArray(st?.crown) ? st.crown.length : Number.isFinite(+st?.crown) ? Math.max(0, Math.floor(+st.crown)) : 0;
  return { caps, lit, tincture, fruit };
}
/** A branch's index from its id: a trump's name (Dovina's BRANCHES keys, 'arcana.' before it or not) or an index 0..21. */
function branchIndex(id) {
  if (typeof id === 'number') return Number.isInteger(id) && id >= 0 && id < 22 ? id : -1;
  return BRANCH_IDS.indexOf(String(id).replace(/^arcana\./, '').toLowerCase());
}

/** Ribbons of the veins' light along paths ([{ p, n? }] each; the light runs from the first point to the last): flat on the ground (one
 *  strip lying along the ground's up) or, `crossed`, two strips crossed so a thread hung in the air stays broad from most ways. */
function ribbonGeometry(paths, width, crossed) {
  const pos = [], uv = [], idx = [];
  for (const P of paths) for (const tw of crossed ? [0, Math.PI / 2] : [0]) {
    const o = pos.length / 3, n = P.length - 1;
    for (let i = 0; i <= n; i++) {
      const p = P[i].p, tan = _t.copy(P[Math.min(n, i + 1)].p).sub(P[Math.max(0, i - 1)].p).normalize();
      const up = P[i].n || (Math.hypot(p.x, p.z) > 0.01 ? _up.set(p.x, 0, p.z).normalize() : _up.set(1, 0, 0)); // (on the ground its own up; in the air out from the column)
      const side = crossed ? _s.crossVectors(tan, up).normalize().applyAxisAngle(tan, tw) : _s.crossVectors(tan, up).normalize();
      const w = width * 0.5 * (crossed ? 1 : 0.6 + 0.4 * Math.sin(Math.PI * Math.min(1, i / n * 1.2)));
      pos.push(p.x - side.x * w, p.y - side.y * w, p.z - side.z * w, p.x + side.x * w, p.y + side.y * w, p.z + side.z * w); uv.push(i / n, 0, i / n, 1);
      if (i < n) { const k = o + i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}

const _up = new THREE.Vector3(0, 1, 0), _p = new THREE.Vector3(), _t = new THREE.Vector3(), _s = new THREE.Vector3();
