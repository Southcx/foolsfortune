// ---------------------------------------------------------------------------------------
// THE SEA SERPENT'S BODY (docs/plans/OPEN-SEA.md section 7; progress/opensea/seaserpent.js SEA_SERPENT, Dovina's numbers): the open
// sea's Marlin-class Egregore drawn, a chain of joints the mind drives (Petra's, from creatures/ai/) and a hide swept over it. Its look
// is the Egregores' Brine dress (vfx/railfoes/egregores.js): a wet grey-blue hide over a pale belly, countershaded as a sea animal is,
// barnacles on the skull, a pearl spot line down each flank lit faintly in the Emocean's film; the throat glowing in crude's violet as
// the spit's tell; a part's gold line (vfx/bossparts.js, 0xffd36a) round the head while it is up and can be hit, and the crazing
// (vfx/partcraze.js's net) opening over the head or the coils as each is hurt.
//
//   THE SPINE  follow-the-leader (Snake; a rope chain): the head goes where it is told, and each joint lies on the head's own path at
//              a fixed spacing behind it (length / (segments - 1)), the path kept as a history of where the head has been. Over the
//              path a travelling vertical wave arches the humps through the surface (the Loch Ness humps), its size growing with
//              `rise`, so at rise 0 it is all under; the joints keep their spacing in 3D (a reared neck draws the path in, never
//              stretches). The moves bend it: the coil lays the joints on a helix round the ship, the ram lifts the back under the
//              bow with the head low, the spit rears the head and opens the jaw, the dive arcs it down head first, the tail last.
//   THE HIDE   ONE mesh whose vertices are rewritten on the CPU each frame: rings swept along a Catmull-Rom through the joints, the
//              normals analytic (a ring's own frame, carried down the body by parallel transport), a dorsal ridge of fin spines,
//              thinning to a whip at the tail. The head and its jaw are two meshes of the same material (FoeKit, kit.js), built at
//              the 30 m serpent's size and scaled by K whole; the hide's rest frame is divided by K, so the crazing reads as it did.
//   THE WATER  where a joint breaks or goes back through the surface, a disturbance on the water's service (`game.water.disturb`:
//              the ripple tank's rings and the dive's crown, vfx/waterfx.js), three across a thick joint's breadth; the ram throws
//              a bow wave of them off both cheeks.
//
// One material (the rail foes' body program, materials.js, with a rest-frame coordinate so the crazing stays on the hide as it bends)
// and one halo material (the throat's glow): 4 draws (hide, head, jaw, the throat's halo).
//
// Prior art: Olaus Magnus's Carta Marina (1539: the sea serpent of Norway, its coils arched through the sea round a ship), Leviathan
// and Jörmungandr for the head (horned, maned, a horse's long skull); Snake and the rope chain for follow-the-leader; the
// parallel-transport frame of every tube-along-a-curve (Hanson and Ma, 1995; three.js's TubeGeometry frames); Monster Hunter's Lagiacrus
// and Plesioth (a sea beast read by the water it breaks).
//
//   const s = new SeaSerpentBody(game, { segments = 20, length = 105, seaY? })   (in game.scene, zone 'opensea', hidden until driven;
//   what the game passes wins: SEA_SERPENT's)   SERPENT_LOOK.scale (K, 3.5): the look's every length x K against the 30 m serpent it
//   was drawn at, for the ships at 5x (the sloop about 35 m): the hide 3.7 m thick, the head about 12 m long, reared 21 m over the sea
//   s.drive({ head: Vector3, heading, rise: 0..1, move: null|'ram'|'spit'|'coil'|'dive', k: 0..1, coil?: { centre: Vector3, r } })
//   (on the hunt's beats 0 and 3, music/clock.js, the hide's film flares and, under, a ring leaves the head: ostinato())
//   s.update(dt)   s.hit('head'|'coil', k)   (k = 1 - hp / hpMax: a flash, and its crazing)   s.down()   (sinks, spots out over 3 s)
//   s.headPos (Vector3, the skull's centre)   s.headRadius (1.3 K: 4.55 m)   s.segmentsAt() -> [Vector3] (the joints, live; read only)   s.radii
//   s.tris   s.dispose()
//   heading: forward is (sin h, 0, cos h), the helm's. head: its x and z are the head's place; the body sets its height from rise and
//   the move (the head's y is ignored); under the coil the head lies on the coil, at the side of coil.centre the mind's head is.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { bodyMaterial, haloMaterial } from '../railfoes/materials.js';
import { FoeKit, PAL, HALO_CH, haloGeometry, slab } from '../railfoes/kit.js';
import { FILM } from '../oxidation.js';
import { SEA } from '../../world/opensea/seaprops.js';

/** The look's size against the ships (the sloop's hull about 35 m since the ships went 5x): every length below is the 30 m serpent's x K. */
export const SERPENT_LOOK = { scale: 3.5 };
const K = SERPENT_LOOK.scale;                         // (lengths only: never times, angles or 0..1 shares)
const RINGS = 60, SIDES = 12, HIST = 512, STEP = 0.2 * K; // (rings along the hide, vertices a ring; the head's path: points kept, metres apart)
const RMAX = 1.05 * K;                                // (the hide's radius at its thickest, metres: 3.7)
const CRUDE_GLOW = new THREE.Color(0x7a3ce0);         // (crude's violet lit from within: the spit's throat)
const SPOTS = 0.4;                                    // (the pearl spots' glow: faint, the film's)
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0), BELLY = new THREE.Color(PAL.belly);
const turn = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t; // (an angle eased the short way round)
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/** The hide's radius along it, s 0 the neck .. 1 the tail's whip. */
const radiusAt = (s) => (0.78 + 0.22 * sstep(0, 0.12, s)) * RMAX * Math.pow(1 - s, 1.25) * (s < 0.97 ? 1 : 1 - (s - 0.97) * 20) + 0.035 * K;

/** The rail foes' body program with a rest coordinate: the crazing's cells read the hide's straight pose, so they ride on it. */
export function serpentMaterial() {
  const m = bodyMaterial({ death: 'sink', roughness: 0.42, metalness: 0.08 }), base = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    base(sh, r);
    sh.vertexShader = sh.vertexShader.replace('attribute vec4 part;', 'attribute vec4 part;\nattribute vec3 rest;').replace('vObj = position;', 'vObj = rest;');
  };
  m.customProgramCacheKey = () => 'railfoe-body-rest';
  return m;
}

const ball = (r, w = 10, h = 7, ...arc) => new THREE.SphereGeometry(r, w, h, ...arc);
const cone = (r, h, n = 6) => new THREE.ConeGeometry(r, h, n);
const fin = (pts, d) => slab(pts, d).rotateY(-Math.PI / 2); // (an outline in (z, y), standing in the body's middle plane)
const shade = (line, top = PAL.hide, under = PAL.belly) => (x, y) => (y < line ? under : top);

/** The head, +z forward, its origin the neck's joint: a long horse's skull with a dragon's horns and mane (Leviathan, the Carta Marina). */
function buildHead() {
  const k = new FoeKit(), P = Math.PI;
  k.add(ball(0.78, 12, 8), { c: shade(-0.2), s: [0.95, 0.82, 1.15], p: [0, 0.1, 0.55], g: 'skull' });
  k.add(new THREE.CylinderGeometry(0.34, 0.62, 1.9, 10, 1), { c: shade(-0.12), r: [P / 2, 0, 0], s: [1, 1, 0.66], p: [0, 0.02, 1.75], g: 'snout' });
  k.add(ball(0.36, 8, 6), { c: shade(-0.08), s: [1, 0.62, 0.9], p: [0, 0.03, 2.66], g: 'snout' }); // (the muzzle's round end)
  k.add(new THREE.BoxGeometry(0.52, 0.06, 1.7), { c: PAL.mouth, p: [0, -0.18, 1.75], g: 'palate' }); // (the mouth's roof, seen when it gapes)
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) k.add(cone(0.045, 0.2, 4), { c: PAL.tooth, p: [s * (0.28 - i * 0.022), -0.24, 1.15 + i * 0.27], r: [P, 0, 0], g: 'teeth' });
  for (const s of [-1, 1]) {
    k.add(ball(0.11, 8, 6), { c: PAL.pearl, fx: [1.4, 0, 0, 0], p: [s * 0.5, 0.32, 0.95], g: 'eyes' });
    k.add(ball(0.17, 8, 4, 0, P * 2, 0, P / 2), { c: PAL.hideD, s: [1.2, 0.6, 1.6], p: [s * 0.47, 0.4, 0.95], g: 'brows' }); // (the brow over it)
    k.add(cone(0.12, 1.3, 6), { c: PAL.hideD, p: [s * 0.32, 0.72, 0.05], r: [-1.05, 0, s * 0.35], g: 'horns' }); // (swept back)
    k.add(cone(0.06, 0.55, 5), { c: PAL.hideD, p: [s * 0.62, 0.15, 0.25], r: [-1.2, 0, s * 1.0], g: 'horns' }); // (the cheek's spur)
    k.add(ball(0.05, 5, 4), { c: PAL.mouth, p: [s * 0.16, 0.2, 2.72], g: 'nostrils' });
  }
  k.add(fin([[0.6, 0.55], [-0.6, 1.5], [-0.2, 0.6], [-0.9, 0.95], [-0.6, 0.35]], 0.06), { c: PAL.hideD, g: 'mane' }); // (the mane, down the nape)
  for (let i = 0; i < 9; i++) { const a = i * 2.3, r = 0.18 + (i % 3) * 0.12; k.add(cone(0.05, 0.08, 5), { c: PAL.barn, p: [Math.cos(a) * r, 0.68 - r * 0.3, 0.6 + Math.sin(a) * r * 1.4], g: 'barnacles' }); }
  k.add(ball(0.4, 8, 6), { c: PAL.mouth, fx: [0, 1.2, 0, 0], s: [1, 0.7, 0.6], p: [0, -0.2, 0.7], g: 'throat' }); // (the throat: the spit's tell)
  k.halo([0, -0.22, 1.05], 0.85, HALO_CH.tell);
  return k.build();
}

/** The lower jaw, its origin the hinge: +z forward, opened by turning about x. */
function buildJaw() {
  const k = new FoeKit(), P = Math.PI;
  k.add(new THREE.CylinderGeometry(0.26, 0.52, 2.2, 10, 1, false, P, P), { c: PAL.belly, r: [P / 2, 0, 0], s: [1, 1, 0.55], p: [0, 0, 1.1], g: 'jaw' });
  k.add(new THREE.BoxGeometry(0.44, 0.05, 1.9), { c: PAL.mouth, p: [0, -0.02, 1.05], g: 'tongue' });
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) k.add(cone(0.04, 0.17, 4), { c: PAL.tooth, p: [s * (0.3 - i * 0.03), 0.07, 0.35 + i * 0.3], g: 'teeth' });
  return k.build();
}

/** A unit (0 the hide, 1 the head) and the rest coordinate written into a kit-built geometry. */
function asUnit(geo, u) {
  const n = geo.attributes.position.count, U = geo.attributes.unit.array;
  for (let i = 0; i < n; i++) U[i * 2] = u;
  geo.setAttribute('rest', new THREE.BufferAttribute(geo.attributes.position.array.slice(), 3));
  return geo;
}

export class SeaSerpentBody {
  constructor(game, { segments = 20, length = 105, seaY = SEA.y } = {}) {
    this.game = game; this.S = segments; this.L = length; this.d = length / (segments - 1); this.seaY = seaY;
    this.joints = Array.from({ length: segments }, () => new THREE.Vector3());
    this.radii = Float32Array.from({ length: segments }, (_, i) => radiusAt(i / (segments - 1)));
    this.yS = new Float32Array(segments); this.above = new Uint8Array(segments); this.splashT = new Float32Array(segments);
    this.hx = new Float32Array(HIST); this.hz = new Float32Array(HIST); this.hn = 0; this.h0 = 0; // (the head's path, a ring buffer)
    this.cmd = { head: new THREE.Vector3(), heading: 0, rise: 0, move: null, k: 0, coil: null };
    this.coilW = 0; this.phase = 0; this.speed = 0; this.moved = 0; this.t = 0; this.placed = false; this.dead = -1; this.bowT = 0; this.splashes = 0;
    this.flash = [0, 0]; this.hurt = [0, 0]; this.headPos = new THREE.Vector3(); this.headRadius = 1.3 * K; this.last = new THREE.Vector3();

    this.mat = serpentMaterial(); this.u = this.mat.userData.u;
    this.haloMat = haloMaterial(); this.hu = this.haloMat.userData.u; this.hu.uAspect.value.copy(CRUDE_GLOW);
    this.group = new THREE.Group(); this.group.visible = false; this.group.userData.zone = 'opensea';
    this.hide = new THREE.Mesh(this.buildHide(), this.mat);
    const H = buildHead(), J = buildJaw();
    this.head = new THREE.Mesh(asUnit(H.geo, 1), this.mat);
    this.jaw = new THREE.Mesh(asUnit(J.geo, 1), this.mat); this.jaw.position.set(0, -0.22, 0.42); this.head.add(this.jaw); this.head.scale.setScalar(K); // (the head built at the 30 m serpent's size, scaled whole)
    this.halo = new THREE.Mesh(haloGeometry(H.halos.map((h) => ({ ...h, size: h.size * K, unit: 1 }))), this.haloMat); this.halo.frustumCulled = false; this.head.add(this.halo);
    for (const m of [this.hide, this.head, this.jaw, this.halo]) m.userData.zone = 'opensea';
    this.group.add(this.hide, this.head);
    this.tris = this.hide.geometry.index.count / 3 + H.tris + J.tris + H.halos.length * 2;
    game.scene?.add(this.group);
  }

  // ------------------------------------------------------------------ the hide's geometry (its topology once; positions every frame)
  buildHide() {
    const nT = RINGS * SIDES, spines = []; // (a spine on every second ring from the nape to near the whip)
    for (let i = 3; i < RINGS - 6; i += 2) spines.push(i);
    this.spines = spines;
    const nV = nT + spines.length * 6, g = new THREE.BufferGeometry();
    const pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), col = new Float32Array(nV * 3), rest = new Float32Array(nV * 3);
    const fx = new Float32Array(nV * 4), part = new Float32Array(nV * 4), unit = new Float32Array(nV * 2), idx = [];
    const setC = (i, hex) => { _c.setHex(hex); col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; };
    for (let i = 0; i < RINGS; i++) {
      const s = i / (RINGS - 1), r = radiusAt(s);
      for (let j = 0; j < SIDES; j++) {
        const a = (j / SIDES) * Math.PI * 2, v = i * SIDES + j, up = Math.cos(a);
        _c.setHex(PAL.hide).lerp(BELLY, sstep(-0.15, -0.6, up)); if (up > 0.95) _c.setHex(PAL.hideD);
        col[v * 3] = _c.r; col[v * 3 + 1] = _c.g; col[v * 3 + 2] = _c.b;
        if ((j === 3 || j === 9) && i % 3 === 1 && s > 0.04 && s < 0.86) { setC(v, PAL.pearl); fx[v * 4] = SPOTS; } // (the flanks' pearl line)
        rest[v * 3] = Math.sin(a) * r / K; rest[v * 3 + 1] = up * r / K; rest[v * 3 + 2] = -s * this.L / K; // (the rest frame in the head's units, so the crazing's cells are the head's size)
        if (i < RINGS - 1) { const a0 = v, b0 = i * SIDES + (j + 1) % SIDES, c0 = a0 + SIDES, d0 = b0 + SIDES; idx.push(a0, b0, c0, b0, d0, c0); }
      }
    }
    spines.forEach((ri, q) => { // (each spine two faces, one a side, so a single-sided material shows it from both)
      const base = nT + q * 6, s = ri / (RINGS - 1), r = radiusAt(s);
      for (let m = 0; m < 6; m++) { setC(base + m, PAL.hideD); const z = -s * this.L / K; rest[(base + m) * 3 + 1] = r * 1.3 / K; rest[(base + m) * 3 + 2] = z; }
      idx.push(base, base + 1, base + 2, base + 3, base + 5, base + 4);
    });
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('rest', new THREE.BufferAttribute(rest, 3));
    g.setAttribute('fx', new THREE.BufferAttribute(fx, 4)); g.setAttribute('part', new THREE.BufferAttribute(part, 4)); g.setAttribute('unit', new THREE.BufferAttribute(unit, 2));
    g.setIndex(idx);
    this.ringP = Array.from({ length: RINGS }, () => new THREE.Vector3()); this.ringT = Array.from({ length: RINGS }, () => new THREE.Vector3());
    this.ringN = Array.from({ length: RINGS }, () => new THREE.Vector3()); this.ringB = Array.from({ length: RINGS }, () => new THREE.Vector3());
    return g;
  }

  // ------------------------------------------------------------------ the interface the mind drives
  drive({ head, heading = 0, rise = 0, move = null, k = 0, coil = null } = {}) {
    const C = this.cmd; C.head.copy(head); C.heading = heading; C.rise = Math.min(1, Math.max(0, rise)); C.move = move; C.k = Math.min(1, Math.max(0, k)); C.coil = coil;
    const jump = Math.hypot(head.x - this.hx[this.h0], head.z - this.hz[this.h0]);
    if (!this.placed || this.hn === 0 || jump > 20 * K) this.place(head, heading);
    else this.moved += Math.hypot(head.x - this.last.x, head.z - this.last.z);
    this.last.copy(head);
    if (Math.hypot(head.x - this.hx[this.h0], head.z - this.hz[this.h0]) >= STEP) this.push(head.x, head.z);
  }

  /** Placed (or moved too far to swim there): the path laid straight behind the heading, the body under. */
  place(head, heading) {
    this.hn = 0; const fx = Math.sin(heading), fz = Math.cos(heading), n = Math.ceil((this.L + 6 * K) / STEP);
    for (let i = n; i >= 0; i--) this.push(head.x - fx * i * STEP, head.z - fz * i * STEP);
    for (let i = 0; i < this.S; i++) { this.yS[i] = this.seaY - 3 * K; this.above[i] = 0; }
    this.placed = true; this.group.visible = this.dead < 3;
  }
  push(x, z) { this.h0 = (this.h0 + 1) % HIST; this.hx[this.h0] = x; this.hz[this.h0] = z; this.hn = Math.min(HIST, this.hn + 1); }

  /** The point `dist` metres back along the head's path (straight on past its end). */
  pathAt(dist, out) {
    let x = this.cmd.head.x, z = this.cmd.head.z, left = dist;
    for (let n = 0; n < this.hn; n++) {
      const i = (this.h0 - n + HIST) % HIST, px = this.hx[i], pz = this.hz[i], seg = Math.hypot(px - x, pz - z);
      if (seg >= left && seg > 1e-6) return out.set(x + (px - x) * (left / seg), 0, z + (pz - z) * (left / seg));
      left -= seg; x = px; z = pz;
    }
    const fx = Math.sin(this.cmd.heading), fz = Math.cos(this.cmd.heading);
    return out.set(x - fx * left, 0, z - fz * left);
  }

  hit(part = 'head', k = 0) { const u = part === 'head' ? 1 : 0; this.flash[u] = 0.3; this.hurt[u] = Math.min(1, Math.max(this.hurt[u], k)); }
  down() { if (this.dead < 0) this.dead = 0; }
  segmentsAt() { return this.joints; }

  // ------------------------------------------------------------------ a frame
  update(dt) {
    if (!this.placed) return;
    this.t += dt;
    if (this.dead >= 0) { this.dead += dt; if (this.dead > 3) { this.group.visible = false; return; } }
    const C = this.cmd, d = this.d, L = this.L, sea = this.seaY, dead = this.dead >= 0 ? this.dead : 0;
    const coilOn = C.move === 'coil' && C.coil && this.dead < 0;
    this.coilW += ((coilOn ? 1 : 0) - this.coilW) * (1 - Math.exp(-dt * 3));
    if (!C.coil) this.coilW = Math.max(0, this.coilW - dt * 2);
    const ram = C.move === 'ram' ? C.k : 0, spit = C.move === 'spit' ? C.k : 0, dive = C.move === 'dive' ? C.k : -1;
    let rise = C.rise; if (C.move === 'spit') rise = Math.max(rise, 0.9); if (ram) rise = Math.max(rise, 0.5 + 0.4 * ram);
    this.speed += (this.moved / Math.max(dt, 1e-4) - this.speed) * (1 - Math.exp(-dt * 4)); this.moved = 0;
    this.phase += dt * (this.speed + 1.5 * K) / (10 * K) * Math.PI * 2; // (the humps' wave runs tailward as fast as it swims, and a little more: they hold in the water, drifting back)
    // the head's height
    let headY = sea + K * (-2.4 + 8.4 * Math.pow(rise, 1.2));
    if (ram) headY = sea + K * lerp(-2.4, 0.15, ram);
    // each joint's height: the humps, the neck to the head, the dive's arc, the sinking
    const depth = K * lerp(-2.6, -0.9, rise), A = K * lerp(0, 2.3, rise) * (ram ? 1.25 : 1), neck = K * (3 + 6 * rise);
    for (let i = 0; i < this.S; i++) {
      const sL = i * d, s = sL / L, env = sstep(0, 4 * K, sL) * (1 - 0.45 * s);
      let y = sea + depth + A * env * Math.sin((sL / (10 * K)) * Math.PI * 2 - this.phase);
      y = lerp(y, headY, 1 - sstep(0, neck, sL));
      if (dive >= 0) {
        const p = dive * (L + 8 * K) - 2 * K;
        if (sL < p) y = sea - 1.2 * K - (p - sL) * 0.55; // (0.55 a slope: the arc's angle, kept)
        y += 1.8 * K * Math.exp(-(((sL - p) / (3.5 * K)) ** 2)) * (1 - dive * 0.5);
        if (dive > 0.7) y += 3.5 * K * Math.sin(Math.PI * (dive - 0.7) / 0.3) * sstep(0.75, 1, s);
      }
      if (this.dead >= 0) y -= K * (1.6 * dead * dead + 0.8 * dead * (1 - s));
      this.yS[i] += (y - this.yS[i]) * (1 - Math.exp(-dt * 6));
    }
    // follow the leader: each joint on the head's path, its spacing kept in 3D
    let h = 0;
    for (let i = 0; i < this.S; i++) {
      if (i > 0) { const dy = this.yS[i] - this.yS[i - 1]; h += Math.sqrt(Math.max(d * d - dy * dy, d * d * 0.06)); }
      this.pathAt(h, this.joints[i]).y = this.yS[i];
    }
    if (this.coilW > 1e-3 && C.coil) this.layCoil(C);
    this.sweep();
    this.poseHead(spit, dive);
    this.water(dt, ram);
    // the material's state: the hit's flicker, the gold line while the head is up, the crazing, the spots and the throat's tell
    const U = this.u, live = this.dead < 0 ? 1 : 0;
    U.uTime.value = this.hu.uTime.value = this.t;
    for (let u = 0; u < 2; u++) { this.flash[u] = Math.max(0, this.flash[u] - dt); U.uStates.value[u].y = this.flash[u] > 0 ? 1 : 0; U.uParts.value[u].x = this.hurt[u]; }
    U.uParts.value[1].y = live * sstep(0.45, 0.55, rise) * (dive >= 0 ? 1 - sstep(0, 0.3, dive) : 1);
    U.uStates.value[1].x = spit; this.hu.uStates.value[1].x = spit * live;
    const f = 0.5 + 0.5 * Math.sin(this.t * 0.21), F0 = FILM[0], F1 = FILM[1], out = this.dead < 0 ? 1 : Math.max(0, 1 - dead / 3);
    const beat = this.ostinato(dt, rise);
    U.uAspect.value.setRGB(lerp(F0[0], F1[0], f), lerp(F0[1], F1[1], f), lerp(F0[2], F1[2], f)).lerp(CRUDE_GLOW, spit).multiplyScalar(out * (1 + 1.6 * beat));
    this.hu.uAspect.value.copy(CRUDE_GLOW).multiplyScalar(out);
  }

  /** The hunt's ostinato seen (Wanda's: its bass and taiko on beats 0 and 3 of the sea's 6/8, read off the heard clock, music/clock.js): the
   *  hide's film flaring on each, and a ring off the head while it swims under, so it is seen coming before it rises (Jaws' barrels). */
  ostinato(dt, rise) {
    const C = this.game.music?.clock?.(), under = this.dead < 0 ? 1 - sstep(0.3, 0.6, rise) : 0;
    this.beatK = (this.beatK || 0) * Math.exp(-dt * 7);
    if (C) {
      const b = Math.floor(C.beat), on = C.beats === 6 ? b === 0 || b === 3 : b % 2 === 0;
      if (b !== this.beatAt) { this.beatAt = b; if (on) { this.beatK = 1; const W = this.game.water; if (under > 0.5 && W?.disturb) W.disturb(this.headPos.x, this.headPos.z, 0.35, 'wake', this.seaY); } }
    }
    return this.beatK * (0.35 + 0.65 * under);
  }

  /** The coil: the joints drawn onto a helix round the centre, the head reared over the ship on its inside. */
  layCoil(C) {
    const c = C.coil.centre, r = C.coil.r, w = this.coilW * this.coilW * (3 - 2 * this.coilW);
    const th0 = Math.atan2(C.head.z - c.z, C.head.x - c.x), fx = Math.sin(C.heading), fz = Math.cos(C.heading);
    const sign = fx * -Math.sin(th0) + fz * Math.cos(th0) >= 0 ? 1 : -1; // (the body trails behind the way the head goes round)
    for (let i = 0; i < this.S; i++) {
      const sL = i * this.d, head = 1 - sstep(0, 6 * K, sL), rr = r * (1 - 0.3 * head) + this.radii[i] * 0.6, th = th0 - sign * sL / rr;
      const y = this.seaY + K * (-0.3 + 0.75 * Math.sin(sL * 0.85 / K - this.t * 1.5) * (1 - head) + 4.2 * head) - 0.02 * sL; // (0.02 a slope, kept)
      _v.set(c.x + Math.cos(th) * rr, y, c.z + Math.sin(th) * rr);
      this.joints[i].lerp(_v, w);
    }
  }

  /** The hide: rings along a Catmull-Rom through the joints, framed by parallel transport, the dorsal side kept up. */
  sweep() {
    const J = this.joints, S = this.S, G = this.hide.geometry, P = G.attributes.position.array, N = G.attributes.normal.array;
    for (let i = 0; i < RINGS; i++) {
      const u = (i / (RINGS - 1)) * (S - 1), k = Math.min(S - 2, Math.floor(u)), t = u - k;
      const p0 = J[Math.max(0, k - 1)], p1 = J[k], p2 = J[k + 1], p3 = J[Math.min(S - 1, k + 2)];
      const t2 = t * t, t3 = t2 * t, R = this.ringP[i], T = this.ringT[i];
      for (const ax of ['x', 'y', 'z']) {
        const a = p0[ax], b = p1[ax], c = p2[ax], e = p3[ax];
        R[ax] = 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - e) * t2 + (-a + 3 * b - 3 * c + e) * t3);
        T[ax] = -0.5 * ((-a + c) + 2 * (2 * a - 5 * b + 4 * c - e) * t + 3 * (-a + 3 * b - 3 * c + e) * t2); // (pointing headward: the joints run head to tail)
      }
      if (T.lengthSq() < 1e-8) T.copy(i ? this.ringT[i - 1] : _v.set(Math.sin(this.cmd.heading), 0, Math.cos(this.cmd.heading)));
      T.normalize();
      const B = this.ringB[i], Nn = this.ringN[i];
      _b.crossVectors(UP, T); const flat = _b.length();
      if (i === 0) { if (flat > 0.2) B.copy(_b).normalize(); else B.set(Math.cos(this.cmd.heading), 0, -Math.sin(this.cmd.heading)); }
      else { B.copy(this.ringB[i - 1]).addScaledVector(T, -T.dot(this.ringB[i - 1])); if (flat > 0.2) B.lerp(_b.normalize(), 0.2); B.addScaledVector(T, -T.dot(B)).normalize(); }
      Nn.crossVectors(T, B).normalize(); // (the dorsal side)
      const r = radiusAt(i / (RINGS - 1));
      for (let j = 0; j < SIDES; j++) {
        const a = (j / SIDES) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), v = (i * SIDES + j) * 3;
        P[v] = R.x + (Nn.x * ca * 0.86 + B.x * sa) * r; P[v + 1] = R.y + (Nn.y * ca * 0.86 + B.y * sa) * r; P[v + 2] = R.z + (Nn.z * ca * 0.86 + B.z * sa) * r;
        _n.set(0, 0, 0).addScaledVector(Nn, ca / 0.86).addScaledVector(B, sa).normalize(); N[v] = _n.x; N[v + 1] = _n.y; N[v + 2] = _n.z;
      }
    }
    // the dorsal spines: a blade raked back from the ridge, two faces
    const base0 = RINGS * SIDES;
    this.spines.forEach((ri, q) => {
      const R0 = this.ringP[ri], R1 = this.ringP[Math.min(RINGS - 1, ri + 2)], Nn = this.ringN[ri], B = this.ringB[ri], T = this.ringT[ri], r = radiusAt(ri / (RINGS - 1));
      const hgt = 0.15 * K + r * 0.55, e = 0.025 * K;
      for (let side = 0; side < 2; side++) {
        const o = side ? -e : e, b = (base0 + q * 6 + side * 3) * 3;
        _v.copy(R0).addScaledVector(Nn, r * 0.8).addScaledVector(B, o); P[b] = _v.x; P[b + 1] = _v.y; P[b + 2] = _v.z;
        _v.copy(R1).addScaledVector(this.ringN[Math.min(RINGS - 1, ri + 2)], r * 0.8).addScaledVector(B, o); P[b + 3] = _v.x; P[b + 4] = _v.y; P[b + 5] = _v.z;
        _v.copy(R0).addScaledVector(Nn, r * 0.8 + hgt).addScaledVector(T, -hgt * 0.7).addScaledVector(B, o); P[b + 6] = _v.x; P[b + 7] = _v.y; P[b + 8] = _v.z;
        for (let m = 0; m < 3; m++) { const s = side ? -1 : 1; N[b + m * 3] = B.x * s; N[b + m * 3 + 1] = B.y * s; N[b + m * 3 + 2] = B.z * s; }
      }
    });
    G.attributes.position.needsUpdate = true; G.attributes.normal.needsUpdate = true;
    G.computeBoundingSphere();
  }

  /** The head on the neck's joint, looking along the neck but held nearer level (a swan's neck); the jaw opened by the spit. */
  poseHead(spit, dive) {
    const J = this.joints, H = this.head, fwd = _v.subVectors(J[0], J[1]), hl = Math.hypot(fwd.x, fwd.z);
    const yaw = turn(this.cmd.heading, Math.atan2(fwd.x, fwd.z), Math.min(1, this.coilW * 2));
    let pitch = -Math.atan2(fwd.y, Math.max(hl, 1e-3)) * (dive >= 0 ? 0.9 : 0.35);
    if (spit) pitch += 0.25 * spit; // (the head bowed at the ship as it gapes)
    if (this.coilW > 0.5) pitch += 0.35; // (over the ship, looking down into it)
    H.position.copy(J[0]); H.rotation.set(pitch, yaw, 0, 'YXZ');
    this.jaw.rotation.x = 0.95 * spit;
    H.updateMatrixWorld(true);
    this.headPos.set(0, 0.1, 1.2).applyMatrix4(H.matrixWorld);
  }

  /** The water: a disturbance where a joint breaks or goes back through the surface, and the ram's bow wave. A disturbance has a
   *  strength, never a size (courier/moves/env.js: 0..1, its crown the Courier's), so a joint wider than half the thickest breaks
   *  the water at three points across its breadth, and the bow wave at the head's two cheeks, each laid a 1.3 K m of the head's way. */
  water(dt, ram) {
    const W = this.game.water; if (!W?.disturb || this.dead > 1.5) return;
    this.splashes = Math.max(0, this.splashes - dt * 8);
    for (let i = 0; i < this.S; i++) {
      const j = this.joints[i], r = this.radii[i], up = j.y + r * 0.6 > this.seaY && j.y - r < this.seaY + 0.4 * K ? 1 : 0;
      this.splashT[i] = Math.max(0, this.splashT[i] - dt);
      if (up !== this.above[i] && this.splashT[i] <= 0 && this.splashes < 12) {
        const o = this.joints[Math.min(this.S - 1, i + 1)], ax = j.z - o.z, az = o.x - j.x, al = Math.hypot(ax, az) || 1, n = r > RMAX * 0.5 ? 1 : 0;
        for (let q = -n; q <= n; q++) W.disturb(j.x + (ax / al) * q * r * 0.8, j.z + (az / al) * q * r * 0.8, 0.25 + 0.6 * r / RMAX, up ? 'dive' : 'wake', this.seaY);
        this.splashT[i] = 0.5; this.splashes += 1 + 2 * n;
      }
      this.above[i] = up;
    }
    this.bowT -= dt;
    if (ram > 0.4 && this.bowT <= 0) {
      this.bowT = Math.min(0.5, (1.3 * K) / Math.max(this.speed, 3)); // (a ring every 1.3 K m the head goes: the 30 m serpent's 0.14 s at its ram)
      const h = this.cmd.heading, cx = Math.cos(h) * this.headRadius * 0.7, cz = -Math.sin(h) * this.headRadius * 0.7;
      for (const s of [-1, 1]) W.disturb(this.headPos.x + cx * s, this.headPos.z + cz * s, 0.5 + 0.5 * ram, 'dive', this.seaY);
    }
  }

  dispose() {
    this.group.removeFromParent();
    for (const m of [this.hide, this.head, this.jaw, this.halo]) m.geometry.dispose();
    this.mat.dispose(); this.haloMat.dispose();
  }
}
