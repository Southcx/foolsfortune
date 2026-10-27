// ---------------------------------------------------------------------------------------
// THE AKHLUT'S FIGHT BODY (docs/plans/OPEN-SEA.md 14.3; SEA_BEASTS.wolfWhale, Dovina's numbers; its mind and chassis Petra's: creatures/
// seaserpent/seaserpent.js with BEAST_BODY.wolfWhale, which drives this through `game.makeSeaBeast('wolfWhale', ...)` exactly as it drives
// the sea serpent's body). Fury's hunter: an orca's body, its tall dorsal and white saddle, ending in a wolf's head with its ruff in Fury,
// the safari's own akhlut (egregoreshapes.js SHAPES_SMALL.wolfWhale, built once more here with the fight's parts, never redrawn), at the
// ships' 5x: AKHLUT_LOOK.scale 3.5 against the 8 m safari body, so 27 m nose to fluke, the back 4.4 m broad, the dorsal 10 m tall.
//   THE LEGS   what the fight adds: a wolf's four legs, forelegs stretched ahead and hind legs back as in a wolf's pounce, built as a
//              habit's part (the kit's `show`: grown out of the hips by uShow, folded into them otherwise), so it is an orca in the
//              water and a wolf only in the air (the tale: it comes out of the sea as a wolf, its tracks running into the water).
//   ITS MOVES  the swim at the top (rise 0 under .. 1 its back and dorsal out), the RAM (the head up and the tail driving, a bow wave
//              off its jaws), the DIVE (nose down, the fluke last, a crown where it goes), and the BREACH (k 0..1 over its windup):
//                k 0 .. 0.55  it sounds, deep, then turns nose up under where it will rise; the landing ring tightens on the water
//                k 0.55 .. 1  clear of the sea in an arc, legs out, onto `land` (or where its head is driven, if no land: Petra's
//                             head runs under to the ring through the windup, so the arc lands on it at k 1)
//                then         the crash (when the move ends or k reaches 1): a great splash round it, the legs folded, under and up
//   THE HEAD   its weak point: lined in gold while it can be hit (up at the top, ramming, in the air), crazing with its hurt.
//
// One draw for the body (the safari's program, its fight parts: beastkit.js), one for the landing ring: 2.
//
// Prior art: the akhlut of the Yup'ik and Inupiat (an orca that is a wolf: Nelson's The Eskimo about Bering Strait, 1899, and the
// tales of its tracks leading from the shore into the sea); Sea of Thieves' Megalodon (a hunter read by its fin and its leap); Monster
// Hunter's Lagiacrus and the leviathans' breaches; real orcas' breaching and wolves' pounce (mousing) for the pose; Jaws' ring of
// barrels for the water telling you where.
//
//   const a = new AkhlutBody(game, { segments = 8, length = 24, seaY })   (zone 'opensea', hidden until driven)
//   a.drive({ head: Vector3, heading, rise: 0..1, move: null|'ram'|'dive'|'breach', k: 0..1, land?: Vector3, landR?: m })
//   a.update(dt)   a.hit('head'|'body'|'coil', k)   (k = 1 - hp / hpMax: a flash and its crazing)   a.down()   (sinks over 3 s)
//   a.headPos (the skull's centre)   a.headRadius (2.6 m)   a.parts [{ id: 'head'|'body', pos, r }]   a.segmentsAt() -> [Vector3]
//   (`segments` points from the skull to the fluke, live)   a.radii   a.tris   a.dispose()   AKHLUT_LOOK, AKHLUT_BODY (numbers for BEAST_BODY)
//   heading: forward (sin h, 0, cos h). head: its xz is the skull's place; the body sets the heights itself (head.y ignored).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SHAPES_SMALL, B, ball, clamp01, sm } from '../egregoreshapes.js';
import { limb } from '../egregorekit.js';
import { COLOR } from '../../../progress/weather.js';
import { SEA } from '../../../world/opensea/seaprops.js';
import { beastGeometry, beastMaterial, setPart, crossings, splashRing, landRing } from './beastkit.js';

const SH = SHAPES_SMALL.wolfWhale;
/** The look's size against the ships: every length of the 8 m safari body x K. */
export const AKHLUT_LOOK = { scale: 3.5 };
const K = AKHLUT_LOOK.scale;
const SKULL = [0, 1.25, 3.0], Z0 = 3.0, Z1 = -3.45; // (the skull's centre and the spine's run, skull to fluke, in the safari body's metres)
const PROFILE = [[-3.55, 0.08, 0.1], [-3.0, 0.35, 0.05], [-2.2, 0.7, 0], [-1.0, 1.1, 0], [0.3, 1.25, 0.05], [1.4, 1.15, 0.1], [2.2, 0.95, 0.28], [3.0, 0.65, 1.2]]; // (z, radius, height: the loft's)
/** Its body's numbers for the chassis (creatures/seaserpent/seaserpent.js BEAST_BODY.wolfWhale): m, as drawn. */
export const AKHLUT_BODY = { segments: 8, length: (Z0 - Z1) * K, headR: 0.75 * K, tailR: 0.3 * K, headUp: 1.5 * K, deep: 4.5 * K, wakeAt: 1.6 * K, ram: 12, breachUp: 22 };
const FURY = COLOR.fury;
const _w = new THREE.Vector3();
const lerp = (a, b, t) => a + (b - a) * t;
const profileAt = (z) => { for (let i = 1; i < PROFILE.length; i++) if (z <= PROFILE[i][0]) { const a = PROFILE[i - 1], b = PROFILE[i], t = (z - a[0]) / (b[0] - a[0]); return [lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; } return PROFILE[PROFILE.length - 1].slice(1); };

/** The wolf's legs as a pounce, a habit's part grown out of the hips (fin: the root it grows from). */
function legs(k) {
  const fur = (x, y, z) => (y < -1.25 ? B.hideD : y < -0.7 ? B.hide : B.saddle);
  for (const s of [-1, 1]) {
    const fore = [[s * 0.62, -0.55, 1.75], [s * 0.72, -1.15, 2.45], [s * 0.66, -1.38, 3.3], [s * 0.62, -1.42, 3.75]];
    const hind = [[s * 0.6, -0.45, -1.15], [s * 0.74, -1.05, -1.55], [s * 0.66, -1.05, -2.35], [s * 0.6, -1.42, -2.85]];
    for (const [pts, r0] of [[fore, 0.34], [hind, 0.4]]) {
      const root = pts[0];
      k.add(limb(pts, r0, 0.14, 10, 7), { c: fur, show: 1, fin: [...root, 0], wave: 0 });
      const paw = pts[pts.length - 1];
      k.add(ball(1, 8, 6), { c: B.hideD, show: 1, fin: [...root, 0], wave: 0, p: [paw[0], paw[1] - 0.04, paw[2] + 0.12], s: [0.2, 0.11, 0.3] });
      for (let c = -1; c <= 1; c++) k.add(ball(1, 5, 4), { c: B.tooth, glow: 0.15, show: 1, fin: [...root, 0], wave: 0, p: [paw[0] + c * 0.08, paw[1] - 0.06, paw[2] + 0.38], s: [0.035, 0.03, 0.08] }); // (the claws)
    }
  }
}

export class AkhlutBody {
  constructor(game, { segments = AKHLUT_BODY.segments, length = AKHLUT_BODY.length, seaY = SEA.y } = {}) {
    this.game = game; this.N = Math.max(2, segments); this.seaY = seaY; this.L = length;
    const b = beastGeometry(SH, FURY, { extra: legs, seed: 'wolfWhale'.length * 7919 + 13, partOf: (x, y, z, show) => (show > 0.5 ? 2 : z > 2.25 && y > 0.35 ? 1 : 0) });
    this.mat = beastMaterial(SH, FURY); this.u = this.mat.userData.u;
    this.mesh = new THREE.Mesh(b.geo, this.mat); this.mesh.scale.setScalar(K); this.mesh.castShadow = true; this.mesh.frustumCulled = false;
    this.pose = new THREE.Group(); this.pose.add(this.mesh);
    this.group = new THREE.Group(); this.group.add(this.pose); this.group.visible = false;
    this.ring = landRing(FURY);
    for (const o of [this.group, this.mesh]) o.userData.zone = 'opensea';
    game.scene?.add(this.group); game.scene?.add(this.ring.mesh);
    this.tris = b.tris + 2;
    this.joints = Array.from({ length: this.N }, () => new THREE.Vector3());
    this.radii = Float32Array.from({ length: this.N }, (_, i) => profileAt(lerp(Z0, Z1, i / (this.N - 1)))[0] * K);
    this.headPos = new THREE.Vector3(); this.headRadius = 0.75 * K; this.bodyPos = new THREE.Vector3();
    this.parts = [{ id: 'head', pos: this.headPos, r: this.headRadius }, { id: 'body', pos: this.bodyPos, r: 1.2 * K }];
    this.cmd = { head: new THREE.Vector3(), heading: 0, rise: 0, move: null, k: 0, land: null, landR: AKHLUT_BODY.ram };
    this.pos = new THREE.Vector3(); this.last = new THREE.Vector3(); this.p0 = new THREE.Vector3(); this.landAt = new THREE.Vector3();
    this.y = -4.5; this.rx = 0; this.rz = 0; this.yaw = 0; this.yawRate = 0; this.speed = 0; this.riseS = 0; this.show = 0; this.t = 0; this.wavePh = 0;
    this.placed = false; this.dead = -1; this.flash = [0, 0, 0]; this.hurt = [0, 0, 0]; this.launched = false; this.crash = -1; this.bowT = 0; this.prevK = 0; this.prevMove = null;
    this.water = {};
  }

  // ------------------------------------------------------------------ the interface the mind drives
  drive({ head, heading = 0, rise = 0, move = null, k = 0, land = null, landR = null } = {}) {
    const C = this.cmd;
    if (this.prevMove === 'breach' && (move !== 'breach' || k >= 0.999) && this.prevK > 0.8 && this.crash < 0) this.crashDown();
    if (move === 'breach' && this.prevMove !== 'breach') { this.launched = false; this.crash = -1; }
    this.prevMove = move; this.prevK = k;
    C.head.copy(head); C.heading = heading; C.rise = clamp01(rise); C.move = move; C.k = clamp01(k); C.land = land; if (landR) C.landR = landR;
    if (!this.placed || Math.hypot(head.x - this.last.x, head.z - this.last.z) > 60 * K) { this.placed = true; this.last.copy(head); this.yaw = heading; this.group.visible = this.dead < 3; }
  }

  hit(part = 'head', k = 0) { const u = part === 'head' ? 1 : part === 'legs' ? 2 : 0; this.flash[u] = 0.3; this.hurt[u] = Math.min(1, Math.max(this.hurt[u], k)); if (u === 0) this.hurt[2] = this.hurt[0]; }
  down() { if (this.dead < 0) this.dead = 0; }
  segmentsAt() { return this.joints; }

  /** The breach's end: the body slammed onto the sea, a great splash round it and at its four paws. */
  crashDown() {
    this.crash = 0; const p = this.headPos;
    splashRing(this.game, p.x, p.z, 1.4 * K, 6, 1, this.seaY);
    splashRing(this.game, this.bodyPos.x, this.bodyPos.z, 2.6 * K, 8, 1, this.seaY);
  }

  // ------------------------------------------------------------------ a frame
  update(dt) {
    if (!this.placed) return;
    this.t += dt;
    if (this.dead >= 0) { this.dead += dt; if (this.dead > 3) { this.group.visible = false; this.ring.set(null, 0, 0, 0, 0); return; } }
    const C = this.cmd, live = this.dead < 0 ? 1 : 0, dead = Math.max(0, this.dead), move = live ? C.move : null;
    const ram = move === 'ram' ? C.k : 0, dive = move === 'dive' ? C.k : -1, breach = move === 'breach' ? C.k : -1;
    // the pace and the turn, from where the head is driven
    const moved = Math.hypot(C.head.x - this.last.x, C.head.z - this.last.z); this.last.copy(C.head);
    this.speed += (moved / Math.max(dt, 1e-4) - this.speed) * (1 - Math.exp(-dt * 4));
    const dy = Math.atan2(Math.sin(C.heading - this.yaw), Math.cos(C.heading - this.yaw));
    this.yawRate += (dy / Math.max(dt, 1e-4) - this.yawRate) * (1 - Math.exp(-dt * 5)); this.yaw = C.heading;
    let riseT = C.rise; if (ram) riseT = 1; if (this.crash >= 0) riseT = 0.6;
    this.riseS += (riseT - this.riseS) * (1 - Math.exp(-dt * 2.2));
    const rv = (riseT - this.riseS) * 2.2; // (how fast it is coming up: the nose leads)
    // the carriage: its height (the safari body's metres at its origin), pitch (nose down +) and roll
    let y = lerp(-4.5, -0.55, Math.pow(this.riseS, 0.8)) + 0.12 * Math.sin(this.t * 0.9) * this.riseS, rx = -0.25 * rv + 0.02 * Math.sin(this.t * 0.9 + 1), rz = -0.25 * clamp01(Math.abs(this.yawRate) / 1.2) * Math.sign(this.yawRate);
    let show = 0, ox = C.head.x, oz = C.head.z, air = 0;
    if (ram) { y += 0.35 * ram; rx -= 0.14 * ram; }
    if (dive >= 0) { y = lerp(y, -5.2, sm(0.15, 1, dive)); rx += 0.75 * Math.sin(Math.PI * Math.min(1, dive * 1.3)); }
    if (breach >= 0) {
      if (breach < 0.55) { const s = breach / 0.55; y = lerp(-4.5, -6.5, sm(0, 0.6, s)) + 3.5 * sm(0.75, 1, s); rx = -1.1 * sm(0.55, 1, s); this.p0.set(C.head.x, 0, C.head.z); }
      else {
        const t = (breach - 0.55) / 0.45;
        if (!this.launched) { this.launched = true; this.p0.set(C.head.x, 0, C.head.z); splashRing(this.game, C.head.x, C.head.z, 1.2 * K, 6, 0.9, this.seaY); }
        if (C.land) { ox = lerp(this.p0.x, C.land.x, t); oz = lerp(this.p0.z, C.land.z, t); }
        const dist = C.land ? Math.hypot(C.land.x - this.p0.x, C.land.z - this.p0.z) : Math.max(20, this.speed * 1.8), H = Math.max(AKHLUT_BODY.breachUp, 10 + 0.12 * dist);
        air = 4 * t * (1 - t); y = (H * air) / K + lerp(1.2, -0.8, t);
        rx = -Math.atan2(H * 4 * (1 - 2 * t), Math.max(dist, 18)) * 0.95; rz += 0.25 * Math.sin(Math.PI * t);
        show = sm(0, 0.12, t) * (1 - sm(0.9, 1, t) * 0.4);
      }
    }
    if (this.crash >= 0) {
      this.crash += dt; const c = this.crash;
      y = lerp(-0.8, -2.2, sm(0, 0.4, c)) * (1 - sm(0.9, 1.6, c)) + lerp(-0.8, -0.55, sm(0.9, 1.6, c)) * sm(0.9, 1.6, c); rx = 0.35 * (1 - sm(0.2, 1.2, c));
      show = 0.6 * (1 - sm(0, 0.5, c)); if (c > 1.6) this.crash = -1;
    }
    if (!live) { y -= 1.6 * dead * dead; rx = lerp(rx, 0.9, sm(0, 2, dead)); }
    const ease = 1 - Math.exp(-dt * (breach >= 0.55 || this.crash >= 0 ? 30 : 5));
    this.y += (y - this.y) * ease; this.rx += (rx - this.rx) * ease; this.rz += (rz - this.rz) * (1 - Math.exp(-dt * 3));
    this.show += (show - this.show) * (1 - Math.exp(-dt * 10));
    // the body placed: the skull at the head's xz (the arc's on a breach), the origin a skull's length behind it
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    this.group.position.set(ox - fx * Z0 * K, this.seaY + this.y * K, oz - fz * Z0 * K); this.group.rotation.set(0, this.yaw, 0);
    this.pose.rotation.set(this.rx, 0, this.rz, 'XYZ');
    this.group.updateMatrixWorld(true);
    // the swim and the shared program's state
    const U = this.u, go = Math.min(1.5, this.speed / (8 * K) * 2 + ram);
    this.wavePh += dt * (1.6 + 2.6 * go) * 0.7;
    U.uT.value = this.t; U.uWave.value.y = this.wavePh; U.uWave.value.x = SH.wave[0] * (0.7 + 0.4 * go) * (air > 0.1 ? 0.4 : 1);
    U.uFin.value.set(SH.fin[0], SH.fin[1] * (0.8 + 0.3 * go), SH.fin[2], SH.fin[3]);
    const bend = this.speed > 1 && air < 0.05 ? THREE.MathUtils.clamp(this.yawRate / this.speed, -0.02, 0.02) : 0;
    U.uBend.value = bend * K; U.uShow.value = this.show; U.uVanish.value = 0;
    U.uGlow.value = (0.2 + 1.2 * Math.max(ram, breach >= 0 ? sm(0.3, 0.6, breach) : 0)) * (live ? 1 : Math.max(0, 1 - dead / 2));
    const lineK = live * Math.max(sm(0.5, 0.7, this.riseS) * (dive >= 0 ? 1 - sm(0, 0.3, dive) : 1), breach >= 0.55 ? 1 : 0, this.crash >= 0 ? 1 : 0);
    for (let i = 0; i < 3; i++) { this.flash[i] = Math.max(0, this.flash[i] - dt); setPart(U, i, this.hurt[i], i === 1 ? lineK : 0, this.flash[i] > 0 ? 1 : 0); }
    this.readBack();
    this.waterTick(dt, ram, dive);
    // the landing ring: centred on `land`, tightening over the windup, held while it flies, gone at the crash
    if (breach >= 0 && C.land && live) {
      const tight = sm(0, 0.55, breach), r = C.landR * lerp(2.2, 1, tight) * (1 + 0.04 * Math.sin(this.t * 9) * tight);
      _w.copy(C.land); _w.y = (C.land.y || this.seaY) + 0.35;
      this.ring.set(_w, r, tight, Math.min(1, breach * 6), this.t);
    } else this.ring.set(null, 0, 0, 0, 0);
  }

  /** The skull, the body and the joints where they are drawn (the bend left out: a turn's curvature is slight). */
  readBack() {
    const M = this.mesh.matrixWorld;
    this.headPos.set(...SKULL).applyMatrix4(M); this.bodyPos.set(0, 0.1, 0.3).applyMatrix4(M);
    for (let i = 0; i < this.N; i++) { const z = lerp(Z0, Z1, i / (this.N - 1)), pr = profileAt(z); this.joints[i].set(0, i === 0 ? SKULL[1] : pr[1], z).applyMatrix4(M); }
  }

  /** The water: the back breaking the surface and going under (crossings), the ram's bow wave off its jaws, the dive's crown at the fluke. */
  waterTick(dt, ram, dive) {
    const W = this.game.water; if (!W?.disturb || this.dead > 1.5) return;
    crossings(this.game, this.joints, this.radii, this.water, dt, this.seaY, { wide: 0.6 * K });
    this.bowT -= dt;
    if (ram > 0.3 && this.bowT <= 0) {
      this.bowT = Math.min(0.5, (1.3 * K) / Math.max(this.speed, 3));
      const h = this.yaw, cx = Math.cos(h) * this.headRadius, cz = -Math.sin(h) * this.headRadius;
      for (const s of [-1, 1]) W.disturb(this.headPos.x + cx * s, this.headPos.z + cz * s, 0.5 + 0.5 * ram, 'dive', this.seaY);
    }
    if (dive > 0.6 && !this.dived) { this.dived = true; const t = this.joints[this.N - 1]; W.disturb(t.x, t.z, 0.9, 'dive', this.seaY); }
    if (dive < 0) this.dived = false;
  }

  dispose() { this.group.removeFromParent(); this.ring.dispose(); this.mesh.geometry.dispose(); this.mat.dispose(); }
}
