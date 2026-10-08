// ---------------------------------------------------------------------------------------
// MYGGDRASIL, THE WORLD MUSHROOM, AS DRAWN (the owner, 2026-10-08, through Dovina: "I love Myggdrasil, that's so cute. Make sure its
// model is BIG"; docs/plans/MYCELIUM.md section 4; the name Espada's). A mushroom the size of a world tree, 48 m from the ground to the
// top of its crown (ECON.myggdrasil.treeHeight), on the garden's largest planetoid, a landmark from every other. Grown, not built: the
// three layers every world tree has, as a fungus has them.
//
//   THE ROOTS    hyphae buttresses flaring from the stipe's foot and running out over the planetoid's crown, half sunk in it; between
//                two of them THE FEEDING MOUTH, a gold lip round a dark throat lit from below in the tincture's colour (`mouthWorld`)
//   THE TRUNK    a pale fibrous stipe of grey clay (its fibres are ridges in the clay, no texture), flared into a volva at its foot and
//                ringed in gold under the crown (the veil's remnant); THE MYCELIUM'S THREADS run on from the roots' ends over the ground
//                as faint veins, their light running in toward the tree (`threadsTo(points)` sends them to the spore beds; until then
//                they fan out over the planetoid)
//   THE CROWN    ten CAPS on the Tree of Life's places, root up as Espada names them for the sephiroth (the Kingdom to the Crown,
//                CAP_SITES): the middle pillar's ring the stipe (the Kingdom, the Foundation, Beauty) and top it (the Crown, the great
//                cap); the side pillars' stand on arms of the stipe, spiralling round it, so the tree reads from every side (never a
//                flat chart). A cap is the leaf canopy (vfx/garden/leafcanopy.js): a dome of shingled scales over a disc of gills, both
//                turned out from the axis. Shut, it is a BUTTON (a round bud; a collar where the stipe runs through). It opens from the
//                middle out over MYGG.openSeconds real seconds, one after another from the root up (`caps`), and the tincture's colour
//                (wheelColour) leans every cap's flash. TWENTY-TWO BRANCHES (the Golden Dawn's paths 11 to 32, BRANCH_PATHS, Dovina's
//                BRANCHES by their trump) join the caps as threads of light: a hung one gold and running, the rest a ghost. FRUIT hangs
//                under the open caps on threads, glowing in the tincture's colour (a breath, never a flicker; as many as the crown
//                holds); PERCHES (shelf brackets on the stipe in the crown) are where the sporelings sit (`perchWorld`)
//   ITS COST     the garden's one canopy program; the stipe, the gold, the throat and the fruit plain standard materials; the branches
//                and threads the spirit veins' program (vfx/garden/veins.js): no new program. Two canopies, built once: near, and a far
//                one of fewer, larger leaves beyond MYGG.lodFar metres. A cap opening moves its slot's gate and hides the other state's
//                leaves in the index (canopyShow): never a rebuild. The fruit and the branches are rebuilt only when what they show changes
//
// Prior art: the world trees (Yggdrasil; the Siberian shamans' birch with the fly agaric at its foot; Legend of Mana's Trent), the
// Kabbalists' Tree of Life and the Golden Dawn's tarot on its paths, Nausicaa's fungal forest (trees that are fungi, many caps on
// branching stems), real fungi (Amanita's volva and ring, a parasol's shingled scales, an agaric's radiating gills, the shelf
// polypores for the perches, foxfire's steady glow), and the leaf canopy itself (vfx/garden/leafcanopy.js).
//
//   const M = new WorldMushroom({ radius: 26, surface: (dir) => metres })   M.group (at the planetoid's heart, the tree up its +Y)
//   M.update(rawDt, state)   (state: game.myggdrasil, read defensively: caps 0..10, branches { id: true } | Set | [ids], tincture { h, s }
//   | null, crown [fruit]; missing, caps 3 and nothing hung)   M.threadsTo(points)   M.mouthWorld(out)   M.capWorld(i, out)
//   M.perchWorld(i, out)   M.perches (how many)   M.snap()   M.dispose()   CAP_SITES   BRANCH_PATHS   MYGG
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { canopyGeometry, canopyMesh, canopySlot, canopyFree, canopyTint, canopyOpen, canopyShow } from './leafcanopy.js';
import { barkMaterial } from './gardentree.js';
import { veinMaterial } from './veins.js';
import { GROUND_UNIFORMS } from './gardengrounds.js';
import { wheelColour } from '../wheelcolour.js';

/** Its numbers: height (m, the ground to the crown's top), the far canopy's distance (m), a cap's opening (real seconds), the caps open
 *  when the state says nothing, the most fruit drawn. */
export const MYGG = { height: 48, lodFar: 95, openSeconds: 2.6, defaultCaps: 3, fruitMax: 30, nearDensity: 0.65, farDensity: 0.3 };

/** The ten caps, root up (Dovina's CAPS order: the Kingdom .. the Crown): height of the cap's heart over the ground (m), how far out
 *  (0: on the stipe), its bearing (degrees), its radius (m), where its arm leaves the stipe (m; `stalk`: it rises from the ground among
 *  the roots). The Kingdom and the Foundation are small caps at the foot (the Kingdom is the earth); Beauty rings the stipe; the side
 *  pillars spiral on arms, Wisdom 0, Mercy 60, Victory 120 (the right), Understanding 180, Severity 240, Splendour 300 (the left), the
 *  highest farthest out, past the Crown's brim; the Crown is the great cap. */
export const CAP_SITES = [
  { id: 'kingdom', y: 3.6, out: 7.6, az: 210, r: 3.4, stalk: true },
  { id: 'foundation', y: 11.5, out: 8, az: 20, r: 4.2, arm: 7.8 },
  { id: 'splendour', y: 20.5, out: 12.5, az: 300, r: 5.2, arm: 13 },
  { id: 'victory', y: 20.5, out: 12.5, az: 120, r: 5.2, arm: 13 },
  { id: 'beauty', y: 26.5, out: 0, az: 0, r: 8, ring: true },
  { id: 'severity', y: 31, out: 15, az: 240, r: 5.6, arm: 21.4 },
  { id: 'mercy', y: 31, out: 15, az: 60, r: 5.6, arm: 21.4 },
  { id: 'understanding', y: 35.5, out: 19, az: 180, r: 5.4, arm: 30.6 },
  { id: 'wisdom', y: 35.5, out: 19, az: 0, r: 5.4, arm: 30.6 },
  { id: 'crown', y: 39.5, out: 0, az: 0, r: 17.5, top: true },
];
/** The twenty-two branches: each trump's path between two caps (indices into CAP_SITES, the lower first), the Golden Dawn's
 *  attribution of paths 11 to 32 (the Fool Kether to Chokmah .. the World Yesod to Malkuth). */
export const BRANCH_PATHS = {
  fool: [8, 9], magician: [7, 9], priestess: [4, 9], empress: [7, 8], emperor: [4, 8], hierophant: [6, 8], lovers: [4, 7], chariot: [5, 7],
  strength: [5, 6], hermit: [4, 6], wheel: [3, 6], justice: [4, 5], hanged: [2, 5], death: [3, 4], temperance: [1, 4], devil: [2, 4],
  tower: [2, 3], star: [1, 3], moon: [0, 3], sun: [1, 2], judgement: [0, 2], world: [0, 1],
};
const BRANCH_IDS = Object.keys(BRANCH_PATHS);
const SPIRAL = { priestess: 200 }; // (a branch between two caps on the stipe winds round it from this bearing)
const STIPE = [[-2.4, 6.7], [0, 6.2], [1.2, 5.0], [2.6, 4.25], [5, 3.85], [9, 3.6], [15, 3.42], [22, 3.25], [30, 3.0], [34, 2.85], [38.4, 2.7], [41, 2.6]];
const PERCH_AT = [[13.4, 165, 1.2], [15.6, 285, 1.1], [18.4, 75, 1.3], [22.6, 200, 1.2], [24.2, 340, 1.3], [31.6, 150, 1.4], [33.4, 300, 1.2], [35.2, 95, 1.1]];
const ROOT_AZ = [110, 150, 190, 230, 270, 310, 350, 30, 70], MOUTH = { az: 90, s: 8.6 };
const D2R = Math.PI / 180, GOLD = 0xd8ae58;

/** The stipe's radius at a height over the ground (m). */
export function stipeR(y) {
  if (y <= STIPE[0][0]) return STIPE[0][1];
  for (let i = 1; i < STIPE.length; i++) if (y <= STIPE[i][0]) { const [y0, r0] = STIPE[i - 1], [y1, r1] = STIPE[i]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0); }
  return STIPE[STIPE.length - 1][1];
}

export class WorldMushroom {
  constructor({ radius = 26, surface = null, seed = 1 } = {}) {
    this.R = radius; this.surface = surface || (() => radius); this.rnd = lcg(seed * 53 + 11);
    const g = this.group = new THREE.Group(); g.name = 'myggdrasil';
    this.y0 = this.surface(_up.set(0, 1, 0)); // (the ground under the stipe: the tree's heights are over it)
    this.mats = {
      stipe: new THREE.MeshStandardMaterial({ name: 'myggdrasil-stipe', color: 0xd9d1c6, roughness: 0.86, metalness: 0 }), // (grey clay, pale: a plain standard material)
      gold: new THREE.MeshStandardMaterial({ name: 'myggdrasil-gold', color: GOLD, roughness: 0.34, metalness: 0.85 }),
      glow: new THREE.MeshStandardMaterial({ name: 'myggdrasil-fruit', color: 0x6a5a3a, roughness: 0.6, emissive: 0xe8c878, emissiveIntensity: 1 }),
      fruitThread: new THREE.LineBasicMaterial({ color: 0xe8e2d8 }),
    };
    this.cap = CAP_SITES.map((C, i) => ({ ...C, i, k: 0, shown: -1, matrix: capMatrix(C, this.y0, this.rnd), open: canopySlot(), shut: canopySlot() }));
    this.buildBody(); this.buildCanopies(); this.buildMouth();
    this.vein = { u: { uT: { value: 0 }, uK: { value: 0.55 }, uC: { value: new THREE.Color(0xf0dca0) } } };
    this.veins = new THREE.Mesh(new THREE.BufferGeometry(), veinMaterial(this.vein.u)); this.veins.name = 'myggdrasil-threads'; g.add(this.veins);
    this.threadsTo(null);
    this.lit = { u: { uT: { value: 0 }, uK: { value: 1 }, uC: { value: new THREE.Color(0xffcf6a) } } }; this.ghost = { u: { uT: { value: 0 }, uK: { value: 0.16 }, uC: { value: new THREE.Color(0x8a86b8) } } };
    for (const B of [this.lit, this.ghost]) { B.mesh = new THREE.Mesh(new THREE.BufferGeometry(), veinMaterial(B.u)); B.mesh.name = 'myggdrasil-branches'; g.add(B.mesh); }
    this.fruit = new THREE.Mesh(new THREE.BufferGeometry(), this.mats.glow); this.fruit.name = 'myggdrasil-fruit'; g.add(this.fruit);
    this.fruitLines = new THREE.LineSegments(new THREE.BufferGeometry(), this.mats.fruitThread); this.fruitLines.name = 'myggdrasil-fruit-threads'; g.add(this.fruitLines);
    this.colour = new THREE.Color(0xe8c878); this.colourWant = this.colour.clone(); this.tintAmt = 0; this.tintWant = 0;
    this.keys = { fruit: null, lit: null }; this.pulse = 0; this.t = 0; this.ready = false;
  }

  /** A point over the ground in the tree's frame: bearing (degrees), distance out from the axis (m), height over the ground (m). */
  at(az, rho, y, out = new THREE.Vector3()) { return out.set(Math.sin(az * D2R) * rho, this.y0 + y, Math.cos(az * D2R) * rho); }
  /** A point on the ground: bearing (degrees), distance along the ground from the stipe (m), lifted along the ground's up. */
  ground(az, s, lift = 0, out = new THREE.Vector3()) {
    const a = az * D2R, phi = s / this.R; _d.set(Math.sin(phi) * Math.sin(a), Math.cos(phi), Math.sin(phi) * Math.cos(a));
    return out.copy(_d).multiplyScalar(this.surface(_d) + lift);
  }

  // ---- the body: the stipe, its ring, the roots, the arms, the perches (one mesh of grey clay; the ring and the lip gold)
  buildBody() {
    const geos = [], rnd = this.rnd;
    // the stipe: a lathe of the profile, its fibres ridges round it and a slow twist up it
    const prof = []; for (let y = STIPE[0][0]; y < 41; y += 0.7) prof.push(new THREE.Vector2(stipeR(y), y));
    prof.push(new THREE.Vector2(2.6, 41), new THREE.Vector2(2.3, 41.7), new THREE.Vector2(1.4, 42.15), new THREE.Vector2(0.001, 42.3)); // (its top, inside the Crown's dome)
    const st = new THREE.LatheGeometry(prof, 64), P = st.attributes.position;
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i), r = Math.hypot(x, z), a = Math.atan2(x, z) + y * 0.006;
      const f = (1 + 0.026 * Math.sin(a * 18 + y * 0.12 + 2 * Math.sin(y * 0.05)) + 0.011 * Math.sin(a * 41 - y * 0.3)) * (1 + 0.03 * Math.sin(y * 0.31 + 1));
      P.setXYZ(i, Math.sin(a) * r * f, y + this.y0, Math.cos(a) * r * f);
    }
    geos.push(smooth(st));
    // the roots: buttresses from the stipe's foot out over the ground, half sunk; a fork off each
    for (const az0 of ROOT_AZ) {
      const az = az0 + (rnd() - 0.5) * 8, pts = [this.at(az, 2.4, 3.6), this.at(az, 5.2, 2.0)];
      for (const s of [7.5, 10, 12.5, 15.5]) pts.push(this.ground(az + (rnd() - 0.5) * 9, s, 0.55 * (16.5 - s) / 9)); // (half sunk: a buttress, then a root under the moss)
      geos.push(tube(pts, 2.0, 0.24, 9, 22, 0.75));
      const f = pts[3], side = rnd() < 0.5 ? -1 : 1, fp = [f.clone(), this.ground(az + side * 14, 12.5, 0.15), this.ground(az + side * 22, 15, 0)];
      geos.push(tube(fp, 0.55, 0.12, 6, 10, 1));
    }
    // the arms: from the stipe out and up to each side cap's heart
    for (const C of this.cap) if (C.out) {
      const r0 = stipeR(C.arm || 0), pts = C.stalk ? [this.ground(C.az, C.out - 0.4, -1.2), this.ground(C.az, C.out - 0.1, 0.9), this.at(C.az, C.out, C.y * 0.6), this.at(C.az, C.out, C.y - 0.4)]
        : [this.at(C.az, r0 * 0.6, C.arm), this.at(C.az, r0 + 2.4, C.arm + 0.9), this.at(C.az, C.out * 0.68, C.arm + (C.y - C.arm) * 0.45), this.at(C.az, C.out, C.y - 0.5)];
      geos.push(C.stalk ? tube(pts, 1.0, 0.55, 9, 12, 1) : tube(pts, 1.4, 0.8, 9, 24, 1));
      const knob = new THREE.SphereGeometry(1.05, 10, 8); knob.scale(1, 0.7, 1); knob.translate(...this.at(C.az, C.out, C.y - 0.35).toArray()); geos.push(knob);
    }
    // the perches: shelf brackets on the stipe in the crown (a sporeling sits on each)
    this.perchAt = [];
    for (const [y, az, rp] of PERCH_AT) {
      const r = stipeR(y), out = _o.set(Math.sin(az * D2R), 0, Math.cos(az * D2R)), b = new THREE.CylinderGeometry(rp, rp * 0.82, 0.3, 12, 1, false, 0, Math.PI);
      b.rotateY(-Math.PI / 2); // (its round edge out along +Z, its cut face against the stipe)
      const m = new THREE.Matrix4().makeBasis(_t.crossVectors(_up.set(0, 1, 0), out).normalize(), _up, out).setPosition(this.at(az, r - 0.15, y));
      b.applyMatrix4(m); geos.push(b);
      this.perchAt.push(this.at(az, r + rp * 0.45, y + 0.16));
    }
    const body = new THREE.Mesh(mergeGeometries(geos.map(plain), false), this.mats.stipe); geos.forEach((x) => x.dispose());
    body.name = 'myggdrasil-stipe'; body.castShadow = body.receiveShadow = true; this.group.add(body); this.body = body;
    // the gold: the veil's ring under the crown
    const ring = new THREE.TorusGeometry(stipeR(35.6) + 0.12, 0.34, 8, 56); ring.rotateX(Math.PI / 2); ring.translate(0, this.y0 + 35.6, 0);
    this.goldGeos = [ring];
  }

  // ---- the feeding mouth: a gold lip on the ground between two roots, a dark throat, a glow at its floor
  buildMouth() {
    const G = this.ground(MOUTH.az, MOUTH.s, 0), N = G.clone().normalize(), q = new THREE.Quaternion().setFromUnitVectors(_up.set(0, 1, 0), N);
    const place = (geo, lift) => { geo.applyQuaternion(q); geo.translate(G.x + N.x * lift, G.y + N.y * lift, G.z + N.z * lift); return geo; };
    const lip = new THREE.TorusGeometry(1.75, 0.3, 8, 28); lip.rotateX(-Math.PI / 2); this.goldGeos.push(place(lip, 0.12));
    const gold = new THREE.Mesh(mergeGeometries(this.goldGeos.map(plain), false), this.mats.gold); this.goldGeos.forEach((x) => x.dispose()); this.goldGeos = null;
    gold.name = 'myggdrasil-gold'; gold.castShadow = gold.receiveShadow = true; this.group.add(gold); this.gold = gold;
    const prof = [[1.7, 0.18], [1.58, -0.1], [1.2, -0.8], [0.7, -1.5], [0.3, -1.9]].map(([x, y]) => new THREE.Vector2(x, y)); // (lip first, down to its floor: the lathe's faces turned in, so the throat is seen from above)
    const throat = place(new THREE.LatheGeometry(prof, 20), 0); throat.computeVertexNormals();
    this.throat = new THREE.Mesh(throat, barkMaterial()); this.throat.name = 'myggdrasil-mouth'; this.throat.receiveShadow = true; this.group.add(this.throat);
    const floor = place(new THREE.CircleGeometry(0.62, 16).rotateX(-Math.PI / 2), -1.75);
    this.mouthGlow = new THREE.Mesh(floor, this.mats.glow); this.mouthGlow.name = 'myggdrasil-mouth-glow'; this.group.add(this.mouthGlow);
    this.mouthAt = G.clone().addScaledVector(N, 0.2);
  }

  // ---- the crown's canopies: every cap twice (open, shut) in one geometry, near and far
  buildCanopies() {
    const entries = (far) => {
      const E = [], sz = (v, lo, hi) => Math.min(3.9, THREE.MathUtils.clamp(v, lo, hi) * (far ? 1.8 : 1));
      for (const C of this.cap) {
        const ring = !!C.ring, rs = ring ? stipeR(C.y) : C.top ? stipeR(38) : 0, dome = C.top ? 0.48 : ring ? 0.36 : 0.5;
        E.push({ matrix: C.matrix, seed: C.i * 7 + (far ? 101 : 1), unify: 0, spheres: [
          { c: [0, 0, 0], r: C.r, squash: [1, dome, 1], half: 1, leaf: 'cap', grow: true, slot: C.open, hole: ring ? rs - 0.4 : 0, size: sz(C.r * 0.12, 0.75, 2.2) },
          { c: [0, -0.15, 0], r: C.r * 0.97, squash: [1, 0.14, 1], half: -1, leaf: 'gill', grow: true, radial: -1, shell: 0, slot: C.open, hole: rs ? rs - 0.1 : C.r * 0.06, size: sz(C.r * 0.12, 0.7, 2.1) },
        ] });
        const bud = C.top ? { c: [0, 2.6, 0], r: 5.2 } : ring ? { c: [0, 0.3, 0], r: rs + 1.3, squash: [1, 0.55, 1], hole: rs - 0.25 } : { c: [0, 0.75, 0], r: Math.max(1.2, C.r * 0.33) };
        E.push({ matrix: C.matrix, seed: C.i * 7 + (far ? 105 : 5), unify: 0, spheres: [{ ...bud, leaf: 'cap', grow: true, slot: C.shut, size: sz(bud.r * 0.42, 0.75, 1.6) }] });
      }
      return E;
    };
    this.lod = new THREE.LOD(); this.lod.name = 'myggdrasil-crown'; this.lod.position.set(0, this.y0 + 24, 0);
    this.canopies = [];
    for (const [far, dist] of [[false, 0], [true, MYGG.lodFar]]) {
      const geo = canopyGeometry(entries(far).map((e) => ({ ...e, density: far ? MYGG.farDensity : MYGG.nearDensity }))), mesh = canopyMesh(geo);
      mesh.position.set(0, -(this.y0 + 24), 0); mesh.name = far ? 'myggdrasil-crown-far' : 'myggdrasil-crown-near';
      const holder = new THREE.Group(); holder.add(mesh); this.lod.addLevel(holder, dist, 0.08); this.canopies.push(geo);
    }
    this.group.add(this.lod);
  }

  /** Sends the mycelium's threads to these points (world positions: the spore beds on this planetoid), each from its nearest root; with
   *  none, they fan out over the planetoid. */
  threadsTo(points) {
    const strips = [], rnd = lcg(29), here = [];
    if (points?.length) { this.group.updateWorldMatrix(true, false); for (const p of points) { const l = this.group.worldToLocal(_p.copy(p)); if (Math.abs(l.length() - this.R) < 12) here.push(l.clone()); } }
    if (here.length) {
      for (const l of here) {
        const az = Math.atan2(l.x, l.z) / D2R, s = Math.acos(THREE.MathUtils.clamp(l.y / l.length(), -1, 1)) * this.R;
        const az0 = ROOT_AZ.reduce((b, a) => (Math.abs(angDiff(a, az)) < Math.abs(angDiff(b, az)) ? a : b));
        strips.push(this.veinPath(az0, az, 15, Math.max(16, s), rnd));
      }
    } else for (const az0 of ROOT_AZ) {
      const az1 = az0 + (rnd() - 0.5) * 30, s1 = 26 + rnd() * 10; strips.push(this.veinPath(az0, az1, 15, s1, rnd));
      const f = 0.45 + rnd() * 0.2; strips.push(this.veinPath(az0 + (az1 - az0) * f, az1 + (rnd() < 0.5 ? -1 : 1) * (14 + rnd() * 12), 15 + (s1 - 15) * f, s1 - 3 - rnd() * 5, rnd));
    }
    this.veins.geometry.dispose(); this.veins.geometry = ribbonGeometry(strips, 0.34, false);
  }
  /** A vein over the ground from (az0, s0) out to (az1, s1), wandering a little; its points far end first (the light runs in). */
  veinPath(az0, az1, s0, s1, rnd) {
    const n = Math.max(8, Math.round((s1 - s0) / 0.9)), pts = [], w1 = rnd() * 6, w2 = rnd() * 6;
    for (let i = n; i >= 0; i--) { const t = i / n, az = az0 + angDiff(az0, az1) * t + 4 * Math.sin(t * 7 + w1) + 2 * Math.sin(t * 17 + w2); pts.push({ p: this.ground(az, s0 + (s1 - s0) * t, 0.07), n: _d.clone() }); }
    return pts;
  }

  /** The branches' threads of light for the hung set (lit) and the rest (ghost). */
  buildBranches(lit) {
    const L = [], G = [];
    BRANCH_IDS.forEach((id, i) => {
      const [a, b] = BRANCH_PATHS[id], A = this.cap[a], B = this.cap[b];
      let azA, azB;
      if (A.out && B.out) { azA = A.az; azB = B.az; } else if (A.out) { azA = azB = A.az; } else if (B.out) { azA = azB = B.az; } else { azA = SPIRAL[id] ?? 0; azB = azA + 100; }
      const node = (C, az) => (C.out ? { az: C.az, rho: C.out, y: C.y - 0.75 } : C.top ? { az, rho: stipeR(36) + 1.3, y: C.y - 3 } : { az, rho: stipeR(C.y) + 1.1, y: C.y - 1.1 });
      const nA = node(A, azA), nB = node(B, azB), d = angDiff(nA.az, nB.az) || 0, span = Math.abs(d) * D2R, flat = Math.abs(nB.y - nA.y) < 3;
      const pts = [];
      for (let k = 0; k <= 40; k++) {
        const t = k / 40, y = nA.y + (nB.y - nA.y) * t - (flat ? 0.7 : 0.2) * Math.sin(Math.PI * t), az = nA.az + d * t;
        const dip = THREE.MathUtils.smoothstep(Math.abs(d), 70, 170) * Math.sin(Math.PI * t) ** 0.8; // (a branch across the tree runs in to the stipe and round it, never a hoop round the whole crown)
        const rho = Math.max(stipeR(y) + 0.9, THREE.MathUtils.lerp(nA.rho + (nB.rho - nA.rho) * t + (0.4 + 0.45 * span) * Math.sin(Math.PI * t), stipeR(y) + 1.3, dip));
        pts.push({ p: this.at(az, rho, y) });
      }
      (lit.has(i) ? L : G).push(pts);
    });
    for (const [B, S] of [[this.lit, L], [this.ghost, G]]) { B.mesh.geometry.dispose(); B.mesh.geometry = ribbonGeometry(S, 0.5, true); B.mesh.visible = S.length > 0; }
  }

  /** The fruit for `n` (at most MYGG.fruitMax), hung under the open caps in turn from the root up. */
  buildFruit(n) {
    const hosts = this.cap.filter((C) => C.k >= 1), geos = [], lines = [], rnd = lcg(71);
    for (let j = 0; j < n && hosts.length; j++) {
      const C = hosts[j % hosts.length], k = Math.floor(j / hosts.length), a = (k * 137.5 + C.i * 41) * D2R, out = C.r * (C.out ? 0.42 + 0.12 * (k % 2) : 0.62);
      const top = _p.set(Math.sin(a) * out, -C.r * 0.13 * Math.sqrt(Math.max(0, 1 - (out / C.r) ** 2)) - 0.15, Math.cos(a) * out).applyMatrix4(C.matrix).clone();
      const len = 1.0 + rnd() * 1.4, size = (C.top ? 1.25 : 0.95) * (0.85 + rnd() * 0.3), end = top.clone().setY(top.y - len);
      const f = fruitGeometry(size); f.translate(end.x, end.y, end.z); geos.push(f);
      lines.push(top.x, top.y, top.z, end.x, end.y, end.z);
    }
    this.fruit.geometry.dispose(); this.fruitLines.geometry.dispose();
    this.fruit.geometry = geos.length ? mergeGeometries(geos, false) : new THREE.BufferGeometry(); geos.forEach((x) => x.dispose());
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3)); this.fruitLines.geometry = lg;
    this.fruit.visible = this.fruitLines.visible = geos.length > 0; this.fruitShown = geos.length;
  }

  /** Each frame: the caps toward the state (one at a time, from the root up), the branches, the fruit, the tincture, the glow. */
  update(raw = 1 / 60, state = null) {
    const S = readState(state); this.t += raw; this.state = S;
    if (!this.ready) { for (const C of this.cap) C.k = C.i < S.caps ? 1 : 0; this.ready = true; this.settle = true; } // (as it is when first seen: nothing opens at the garden's door)
    else {
      let m = this.cap.find((C) => C.i < S.caps && C.k < 1); if (!m) for (let i = 9; i >= 0; i--) if (i >= S.caps && this.cap[i].k > 0) { m = this.cap[i]; break; }
      if (m) m.k = THREE.MathUtils.clamp(m.k + (m.i < S.caps ? 1 : -1) * raw / MYGG.openSeconds, 0, 1);
    }
    for (const C of this.cap) if (C.k !== C.shown) {
      C.shown = C.k; const e = C.k * C.k * (3 - 2 * C.k), bud = 1 - THREE.MathUtils.smoothstep(C.k, 0, 0.55);
      canopyOpen(C.open, e); canopyOpen(C.shut, bud);
      for (const geo of this.canopies) { canopyShow(geo, geo.userData.ranges[C.i * 2], C.k > 0); canopyShow(geo, geo.userData.ranges[C.i * 2 + 1], bud > 0); }
    }
    const litKey = [...S.lit].sort((a, b) => a - b).join(',');
    if (litKey !== this.keys.lit) { if (this.keys.lit !== null && S.lit.size > this.litCount) this.pulse = 1; this.buildBranches(S.lit); this.keys.lit = litKey; this.litCount = S.lit.size; } // (a card hung: the lit threads flare once)
    const fruitKey = `${Math.min(S.fruit, MYGG.fruitMax)}|${this.cap.map((C) => (C.k >= 1 ? 1 : 0)).join('')}`;
    if (fruitKey !== this.keys.fruit) { this.keys.fruit = fruitKey; this.buildFruit(Math.min(S.fruit, MYGG.fruitMax)); }
    // the tincture: the caps' flash leaned to its colour, the fruit and the mouth glowing in it, eased over about two real seconds
    if (S.tincture) { wheelColour(S.tincture.h, Math.max(0.6, S.tincture.s), this.colourWant); this.tintWant = 0.18 + 0.6 * THREE.MathUtils.smoothstep(S.tincture.s, 0.05, 0.6); }
    else { this.colourWant.setHex(0xe8c878); this.tintWant = 0; }
    const ease = this.settle ? 1 : 1 - Math.exp(-raw * 1.6); this.settle = false; this.colour.lerp(this.colourWant, ease); this.tintAmt += (this.tintWant - this.tintAmt) * ease;
    if (Math.abs(this.tintAmt - this.tintWant) < 0.004 && Math.abs(this.colour.r - this.colourWant.r) + Math.abs(this.colour.g - this.colourWant.g) + Math.abs(this.colour.b - this.colourWant.b) < 0.004) { this.colour.copy(this.colourWant); this.tintAmt = this.tintWant; } // (settled: the table is written no more)
    if (this.tintAmt !== this.tintShown || !this.colour.equals(this.colourShown || _black)) {
      this.tintShown = this.tintAmt; this.colourShown = (this.colourShown || new THREE.Color()).copy(this.colour);
      for (const C of this.cap) { canopyTint(C.open, this.colour, this.tintAmt); canopyTint(C.shut, this.colour, this.tintAmt); }
    }
    const night = GROUND_UNIFORMS.uGNight.value ?? 0, breath = 0.9 + 0.1 * Math.sin(this.t * 0.7); // (foxfire: a slow breath, never a flicker)
    this.mats.glow.emissive.copy(this.colour).multiplyScalar((0.35 + 0.75 * night) * breath); this.mats.glow.color.copy(this.colour).multiplyScalar(0.45);
    this.vein.u.uC.value.setHex(0xf0dca0).lerp(this.colour, 0.5); this.vein.u.uK.value = 0.4 + 0.4 * night;
    this.pulse = Math.max(0, this.pulse - raw / 2.5); this.lit.u.uK.value = (0.75 + 0.35 * night) * (1 + 1.2 * this.pulse);
    this.ghost.u.uK.value = 0.1 + 0.1 * night;
    for (const u of [this.vein.u, this.lit.u, this.ghost.u]) u.uT.value = (u.uT.value + raw) % 3600;
  }

  /** The next update takes the state at once (the caps, the tincture): for a test, or a planetoid made again. */
  snap() { this.ready = false; }
  /** Where the hand feeds it: the mouth's middle, in the world. */
  mouthWorld(out = new THREE.Vector3()) { return this.group.localToWorld(out.copy(this.mouthAt)); }
  /** Cap i's heart, in the world (its fruit hangs under it). */
  capWorld(i, out = new THREE.Vector3()) { const C = this.cap[i]; return C ? this.group.localToWorld(out.setFromMatrixPosition(C.matrix)) : null; }
  get perches() { return this.perchAt.length; }
  /** Perch i's seat (where a sporeling sits), in the world. */
  perchWorld(i, out = new THREE.Vector3()) { const p = this.perchAt[i]; return p ? this.group.localToWorld(out.copy(p)) : null; }

  dispose() {
    this.group.parent?.remove(this.group);
    this.group.traverse((o) => { o.geometry?.dispose?.(); if (o.material && !o.material.userData?.shared) o.material.dispose?.(); });
    for (const C of this.cap) { canopyFree(C.open); canopyFree(C.shut); C.open = C.shut = 0; }
  }
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

/** Where a cap stands in the tree's frame, tilted a little: a side cap outward off its arm, a ring a degree or two. */
function capMatrix(C, y0, rnd) {
  const r = _o.set(Math.sin(C.az * D2R), 0, Math.cos(C.az * D2R)), axis = C.out ? new THREE.Vector3(r.z, 0, -r.x) : new THREE.Vector3(rnd() - 0.5, 0, rnd() - 0.5).normalize();
  const q = new THREE.Quaternion().setFromAxisAngle(axis, (C.out ? 9 : 1.5 + rnd() * 1.5) * D2R);
  return new THREE.Matrix4().compose(new THREE.Vector3(r.x * C.out, y0 + C.y, r.z * C.out), q, _one);
}

/** A tube along points (Catmull-Rom), radius r0 at its start to r1 at its end (`taper` the curve of it). */
function tube(pts, r0, r1, radial = 8, segs = 24, taper = 1) {
  const C = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), F = C.computeFrenetFrames(segs, false), pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, p = C.getPointAt(t), r = THREE.MathUtils.lerp(r0, r1, t ** taper);
    for (let j = 0; j <= radial; j++) { const a = (j / radial) * Math.PI * 2, rr = r * (1 + 0.05 * Math.sin(j * 2.3 + i * 0.7)); _n.copy(F.normals[i]).multiplyScalar(Math.cos(a)).addScaledVector(F.binormals[i], Math.sin(a)); pos.push(p.x + _n.x * rr, p.y + _n.y * rr, p.z + _n.z * rr); }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return smooth(g);
}
/** Its seam welded and its normals smooth (no uv: the clay is plain). */
function smooth(g) { if (g.attributes.uv) g.deleteAttribute('uv'); if (g.attributes.normal) g.deleteAttribute('normal'); const m = mergeVertices(g, 1e-3); g.dispose(); m.computeVertexNormals(); return m; }
/** Position and normal only, indexed (so every part merges into one). */
function plain(g) { for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); if (!g.attributes.normal) g.computeVertexNormals(); return g.index ? g : mergeVertices(g); }

/** A fruit: a little bell of a fruiting body hung by its stem (its top at the origin), `size` metres tall. */
function fruitGeometry(size) {
  const prof = [[0.001, -0.9], [0.18, -0.86], [0.42, -0.78], [0.5, -0.66], [0.4, -0.5], [0.22, -0.38], [0.08, -0.3], [0.07, -0.05], [0.001, 0]].map(([x, y]) => new THREE.Vector2(x * size, y * size));
  const g = new THREE.LatheGeometry(prof, 10); g.deleteAttribute('uv'); g.computeVertexNormals(); return g;
}

/** Ribbons of the veins' light along paths ([{ p }] each; the light runs from the first point to the last): flat on the ground (one strip
 *  lying along the ground's up) or, `crossed`, two strips crossed so a thread hung in the air stays broad from most ways. */
function ribbonGeometry(paths, width, crossed) {
  const pos = [], uv = [], idx = [];
  for (const P of paths) for (const tw of crossed ? [0, Math.PI / 2] : [0]) {
    const o = pos.length / 3, n = P.length - 1;
    for (let i = 0; i <= n; i++) {
      const p = P[i].p, tan = _t.copy(P[Math.min(n, i + 1)].p).sub(P[Math.max(0, i - 1)].p).normalize();
      const up = P[i].n || (Math.hypot(p.x, p.z) > 0.01 ? _up.set(p.x, 0, p.z).normalize() : _up.set(1, 0, 0)); // (on the ground its own up; in the air out from the stipe)
      const side = crossed ? _s.crossVectors(tan, up).normalize().applyAxisAngle(tan, tw) : _s.crossVectors(tan, up).normalize();
      const w = width * 0.5 * (crossed ? 1 : 0.6 + 0.4 * Math.sin(Math.PI * Math.min(1, i / n * 1.2)));
      pos.push(p.x - side.x * w, p.y - side.y * w, p.z - side.z * w, p.x + side.x * w, p.y + side.y * w, p.z + side.z * w); uv.push(i / n, 0, i / n, 1);
      if (i < n) { const k = o + i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}

const angDiff = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;
function lcg(seed) { let a = Math.floor(Math.abs(seed) * 1000) % 2147483647 || 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); }
const _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _p = new THREE.Vector3(), _t = new THREE.Vector3(), _s = new THREE.Vector3(), _n = new THREE.Vector3(), _o = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1), _black = new THREE.Color(0, 0, 0);
