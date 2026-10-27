// ---------------------------------------------------------------------------------------
// THE UMIBOZU'S FIGHT BODY (docs/plans/OPEN-SEA.md 14.3; SEA_BEASTS.seaMonk, Dovina's numbers; its runtime Petra's, to this shape). A
// vast dark shaven head and shoulders risen out of a calm night sea, smooth and featureless but for two huge round pale eyes ringed in
// Dread: the safari's own umibozu (egregoreshapes2.js SHAPES_GREAT.seaMonk, built once more with the fight's parts), at the ships' 5x:
// UMIBOZU_LOOK.scale 5.5 against the safari's 12 m body, so its crown stands 36 m over the sea risen, its shoulders 70 m across, each
// eye 10 m wide. What the fight adds: its two HANDS (one geometry, two draws in the same program: a palm, four fingers hooked as on a
// rail, a thumb, a forearm running down into the sea) and the SEA it pours into the hull off them (one ribbon mesh, four streams a hand).
//   ITS MOVES  rise (k 0..1 over the windup: it swells up out of the water at the beam; rise is how far up, any time), dive (k 0..1:
//              under, a crown round it), and its signature GRIP:
//                k 0 .. 0.7   the hands come up out of the sea outside the gunwale, fingers to the sky
//                k 0.7 .. 1   they turn over and close on the gunwale, fore and aft of the middle on its side of the hull
//                k 1, held    (the runtime holds move 'grip' at k 1 for the move's `hold`) the grip squeezing, the sea running off its
//                             fingers onto the deck (`pour` 0..1, 1 by default while held); let go (any other move) the hands slide off
//              While gripping it sets itself abeam of `hull` on the side `at` is, facing it, leaning in: `at` says only the side.
//   THE EYES   its weak point: lined in gold and glowing while it grips (and faintly while it is up); hit('eyes', k) flashes and
//              flinches them (they squint shut a moment) and crazes them with its hurt.
//
// Draws: the body 1, the hands 2, the pour 1: 4.
//
// Prior art: the umibozu of the Edo prints (Toriyama Sekien's Konjaku Hyakki Shūi, 1781; the tale of the monk who asks the sailors for a
// ladle and fills their boat with it, answered with a ladle with no bottom); Ōkami and Ōkamiden's umibōzu (a black dome with eyes over
// a night sea); Sea of Thieves' Kraken (arms over the hull as the threat you see coming); Shadow of the Colossus's eyes-as-weak-points.
//
//   const m = new UmibozuBody(game, { seaY })   (zone 'opensea', hidden until driven)
//   m.drive({ at: Vector3, heading, rise: 0..1, move: null|'rise'|'grip'|'dive', k: 0..1, hull?: { pos, yaw, length, beam, deckY }, pour? })
//   m.update(dt)   m.hit('eyes'|'head'|'hands', k)   m.down()   (sinks over 3 s, the hands sliding off)
//   m.headPos (the eyes' midpoint: the weak point)   m.headRadius (14 m: both eyes)   m.parts [{ id: 'eyes'|'head'|'handL'|'handR', pos, r }]
//   m.segmentsAt() -> [eyes, dome, handL, handR]   m.gripping (0..1: the hands on the gunwale)   m.tris   m.dispose()   UMIBOZU_LOOK
//   heading: forward (sin h, 0, cos h): which way its face looks. at: its xz on the sea (its y ignored).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SHAPES_GREAT } from '../egregoreshapes2.js';
import { B, ball, cyl, clamp01, sm } from '../egregoreshapes.js';
import { limb } from '../egregorekit.js';
import { COLOR } from '../../../progress/weather.js';
import { SEA } from '../../../world/opensea/seaprops.js';
import { beastGeometry, beastMaterial, setPart, splashRing } from './beastkit.js';

const SH = SHAPES_GREAT.seaMonk;
/** The look's size against the ships: every length of the 12 m safari body x K (its hands at HK). */
export const UMIBOZU_LOOK = { scale: 5.5, hands: 4 };
const K = UMIBOZU_LOOK.scale, HK = UMIBOZU_LOOK.hands, DREAD = COLOR.dread;
const EYE = [1.55, 3.3, 3.3], DOME = [0, 3.4, 0]; // (an eye's and the dome's centres, the safari body's metres)
const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _e = new THREE.Euler();
const lerp = (a, b, t) => a + (b - a) * t;
const TIPS = [-0.62, -0.2, 0.22, 0.62]; // (the fingers across the palm, its metres)

/** A hand, its wrist the origin: the fingers along +Z hooked down over what it holds, the palm down, the forearm down into the sea. */
function buildHand(k) {
  const skin = (x, y, z) => (y > 0.25 ? B.hideD : B.ink);
  k.add(ball(1, 16, 10), { c: skin, p: [0, 0, 0.85], s: [0.95, 0.32, 0.9] }); // (the palm)
  TIPS.forEach((x, i) => {
    const l = i === 0 || i === 3 ? 0.82 : 1;
    k.add(limb([[x, 0.05, 1.55], [x * 1.05, 0.12, 1.55 + 0.75 * l], [x * 1.08, -0.35, 1.55 + 1.15 * l], [x * 1.08, -1.05, 1.55 + 1.05 * l]], 0.22, 0.15, 10, 6), { c: skin });
    k.add(ball(1, 6, 4), { c: B.pearl, mark: 0.9, glow: 0.05, p: [x * 1.08, -1.0, 1.66 + 1.05 * l], s: [0.12, 0.16, 0.06] }); // (a nail, wet: the film's)
  });
  k.add(limb([[0.85, -0.05, 0.5], [1.25, -0.1, 1.0], [1.3, -0.45, 1.45]], 0.24, 0.15, 8, 6), { c: skin }); // (the thumb)
  k.add(limb([[0, -0.05, 0.1], [0, -0.6, -1.3], [0, -2.0, -2.6], [0, -4.2, -3.4]], 0.62, 0.95, 10, 9), { c: B.ink }); // (the forearm, down into the sea)
  for (let i = 0; i < 6; i++) k.add(cyl(0.035, 0.02, 1.2, 4), { c: B.pearl, mark: 0.8, p: [Math.sin(i * 2.1) * 0.5, -0.6 - i * 0.5, -0.9 - i * 0.35], r: [0.7, 0, 0] }); // (the sea running off it)
}

const POUR_VERT = /* glsl */`
attribute float aV;
varying float vV;
varying float vX;
void main() { vV = aV; vX = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const POUR_FRAG = /* glsl */`
uniform float uT, uOn;
uniform vec3 uFeel;
varying float vV;
varying float vX;
void main() {
  float s = fract(vV * 2.5 - uT * 1.8 + vX * 0.37), streak = 0.55 + 0.45 * sin(vX * 19.0 + vV * 7.0 - uT * 9.0);
  float edge = 1.0 - pow(abs(vX * 2.0 - 1.0), 3.0), a = edge * (0.55 + 0.35 * streak) * uOn * smoothstep(0.0, 0.08, vV);
  vec3 c = mix(vec3(0.02, 0.05, 0.06), vec3(0.16, 0.3, 0.32), streak * smoothstep(0.3, 0.9, s)) + uFeel * 0.25 * smoothstep(0.85, 1.0, s);
  gl_FragColor = vec4(c, a);
}`;
const SEG = 8, STREAMS = TIPS.length * 2;

export class UmibozuBody {
  constructor(game, { seaY = SEA.y } = {}) {
    this.game = game; this.seaY = seaY;
    const b = beastGeometry(SH, DREAD, { seed: 'seaMonk'.length * 7919 + 13, partOf: (x, y, z) => (Math.hypot(Math.abs(x) - EYE[0], y - EYE[1], (z - EYE[2]) * 0.6) < 1.15 ? 1 : 0) });
    const hs = { L: 12, waveW: 0, build: buildHand }, h = beastGeometry(hs, DREAD, { partOf: () => 2 });
    this.mat = beastMaterial(SH, DREAD, { roughness: 0.3, craze: 3 }); this.u = this.mat.userData.u;
    this.mesh = new THREE.Mesh(b.geo, this.mat); this.mesh.scale.setScalar(K); this.mesh.frustumCulled = false; this.mesh.castShadow = true;
    this.pose = new THREE.Group(); this.pose.add(this.mesh);
    this.group = new THREE.Group(); this.group.add(this.pose); this.group.visible = false;
    this.hands = [0, 1].map(() => { const m = new THREE.Mesh(h.geo, this.mat); m.scale.setScalar(HK); m.frustumCulled = false; m.castShadow = true; m.visible = false; return m; });
    // the pour: a ribbon a finger, from its nail to the deck
    const g = new THREE.BufferGeometry(), n = STREAMS * (SEG + 1) * 2, idx = [], uv = new Float32Array(n * 2), av = new Float32Array(n);
    for (let s = 0; s < STREAMS; s++) for (let i = 0; i <= SEG; i++) for (let e = 0; e < 2; e++) { const v = (s * (SEG + 1) + i) * 2 + e; uv[v * 2] = e; av[v] = i / SEG; }
    for (let s = 0; s < STREAMS; s++) for (let i = 0; i < SEG; i++) { const a = (s * (SEG + 1) + i) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aV', new THREE.BufferAttribute(av, 1)); g.setIndex(idx);
    this.pu = { uT: { value: 0 }, uOn: { value: 0 }, uFeel: { value: new THREE.Color(DREAD) } };
    this.pour = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: this.pu, vertexShader: POUR_VERT, fragmentShader: POUR_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    this.pour.frustumCulled = false; this.pour.visible = false; this.pour.renderOrder = 2;
    for (const o of [this.group, this.mesh, this.pour, ...this.hands]) o.userData.zone = 'opensea';
    game.scene?.add(this.group); for (const m of [...this.hands, this.pour]) game.scene?.add(m);
    this.tris = b.tris + h.tris * 2 + idx.length / 3;
    this.headPos = new THREE.Vector3(); this.headRadius = (EYE[0] + 1.0) * K; this.domePos = new THREE.Vector3();
    this.handPos = [new THREE.Vector3(), new THREE.Vector3()]; this.tipPos = Array.from({ length: STREAMS }, () => new THREE.Vector3());
    this.parts = [{ id: 'eyes', pos: this.headPos, r: this.headRadius }, { id: 'head', pos: this.domePos, r: 4.2 * K }, { id: 'handL', pos: this.handPos[0], r: 1.6 * HK }, { id: 'handR', pos: this.handPos[1], r: 1.6 * HK }];
    this.joints = [this.headPos, this.domePos, ...this.handPos];
    this.cmd = { at: new THREE.Vector3(), heading: 0, rise: 0, move: null, k: 0, hull: null, pour: null };
    this.pos = new THREE.Vector3(); this.yaw = 0; this.y = -7.5; this.lean = 0; this.riseS = 0; this.gripping = 0; this.reach = 0; this.squint = 0;
    this.t = 0; this.placed = false; this.dead = -1; this.flash = [0, 0, 0]; this.hurt = [0, 0, 0]; this.wasUp = false; this.side = 1; this.dived = false;
  }

  drive({ at, heading = 0, rise = 0, move = null, k = 0, hull = null, pour = null } = {}) {
    const C = this.cmd; C.at.copy(at); C.heading = heading; C.rise = clamp01(rise); C.move = move; C.k = clamp01(k); C.hull = hull; C.pour = pour;
    if (!this.placed) { this.placed = true; this.pos.set(at.x, 0, at.z); this.yaw = heading; this.group.visible = this.dead < 3; }
  }
  hit(part = 'eyes', k = 0) {
    const u = part === 'eyes' ? 1 : part === 'hands' || part === 'handL' || part === 'handR' ? 2 : 0;
    this.flash[u] = 0.3; this.hurt[u] = Math.min(1, Math.max(this.hurt[u], k)); if (u === 1) this.squint = 1;
  }
  down() { if (this.dead < 0) this.dead = 0; }
  segmentsAt() { return this.joints; }

  update(dt) {
    if (!this.placed) return;
    this.t += dt;
    if (this.dead >= 0) { this.dead += dt; if (this.dead > 3) { this.group.visible = this.pour.visible = false; for (const m of this.hands) m.visible = false; return; } }
    const C = this.cmd, live = this.dead < 0 ? 1 : 0, dead = Math.max(0, this.dead), move = live ? C.move : null, H = C.hull;
    const grip = move === 'grip' && H ? C.k : -1, riseM = move === 'rise' ? C.k : -1, dive = move === 'dive' ? C.k : -1;
    let rise = C.rise; if (riseM >= 0) rise = Math.max(rise, sm(0, 1, riseM)); if (grip >= 0) rise = 1; if (dive >= 0) rise = Math.min(rise, 1 - sm(0, 1, dive));
    if (!live) rise = 0;
    this.riseS += (rise - this.riseS) * (1 - Math.exp(-dt * (live ? 1.2 : 0.8)));
    // where it stands: driven, or abeam of the hull it grips, facing it
    let tx = C.at.x, tz = C.at.z, tyaw = C.heading;
    this.gripping += ((grip >= 0.7 ? 1 : 0) - this.gripping) * (1 - Math.exp(-dt * 4));
    this.reach += ((grip >= 0 ? 1 : 0) - this.reach) * (1 - Math.exp(-dt * 3));
    if (H && this.reach > 0.01) {
      const hf = _f.set(Math.sin(H.yaw), 0, Math.cos(H.yaw)), hr = _r.set(Math.cos(H.yaw), 0, -Math.sin(H.yaw));
      if (grip >= 0 && grip < 0.05) this.side = (C.at.x - H.pos.x) * hr.x + (C.at.z - H.pos.z) * hr.z >= 0 ? 1 : -1;
      const off = (H.beam || 9) / 2 + 5 * K; // (its shoulders clear of the hull, its face leaning in over the gunwale)
      const ax = H.pos.x + hr.x * this.side * off - hf.x * 2, az = H.pos.z + hr.z * this.side * off - hf.z * 2, w = sm(0, 1, this.reach);
      tx = lerp(tx, ax, w); tz = lerp(tz, az, w); tyaw = Math.atan2(-hr.x * this.side, -hr.z * this.side);
      if (w > 0.6) tyaw = Math.atan2(H.pos.x - tx, H.pos.z - tz);
    }
    const follow = 1 - Math.exp(-dt * (this.reach > 0.3 ? 6 : 3));
    this.pos.x += (tx - this.pos.x) * follow; this.pos.z += (tz - this.pos.z) * follow;
    this.yaw += Math.atan2(Math.sin(tyaw - this.yaw), Math.cos(tyaw - this.yaw)) * (1 - Math.exp(-dt * 2.5));
    // the carriage: risen y (the safari body's metres), the lean in, breathing
    const breath = Math.sin(this.t * 0.33);
    let y = lerp(-7.5, 0.2, Math.pow(this.riseS, 0.8)) + 0.3 * breath * this.riseS;
    if (!live) y -= 2.4 * dead * dead;
    this.y += (y - this.y) * (1 - Math.exp(-dt * 3));
    this.lean += ((0.14 * this.gripping + 0.03 * Math.sin(this.t * 0.27)) - this.lean) * (1 - Math.exp(-dt * 2));
    this.group.position.set(this.pos.x, this.seaY + this.y * K, this.pos.z); this.group.rotation.set(0, this.yaw, 0);
    this.pose.rotation.set(this.lean, 0, 0.03 * Math.sin(this.t * 0.27));
    this.group.updateMatrixWorld(true);
    const M = this.mesh.matrixWorld;
    this.headPos.set(0, EYE[1], EYE[2]).applyMatrix4(M); this.domePos.set(...DOME).applyMatrix4(M);
    // the program's state: the eyes lined and lit while it grips, flinching when struck
    const U = this.u, out = live ? 1 : Math.max(0, 1 - dead / 2);
    this.squint = Math.max(0, this.squint - dt * 1.6);
    U.uT.value = this.t; U.uWave.value.set(0, 0, 0, 0); U.uFin.value.set(SH.fin[0], SH.fin[1], SH.fin[2], SH.fin[3] * (1 + this.gripping));
    U.uBend.value = 0; U.uShow.value = 0; U.uVanish.value = 0;
    U.uGlow.value = (0.25 + 0.6 * sm(0.5, 1, this.riseS) + 2.2 * this.gripping * (1 - 0.8 * this.squint)) * out;
    U.uSquint.value.set(EYE[1], Math.min(1, this.squint * 1.4));
    const line = live * Math.max(this.gripping, 0.35 * sm(0.6, 1, this.riseS));
    for (let i = 0; i < 3; i++) { this.flash[i] = Math.max(0, this.flash[i] - dt); setPart(U, i, this.hurt[i], i === 1 ? line : 0, this.flash[i] > 0 ? 1 : 0); }
    this.poseHands(dt, grip, H, live, dead);
    this.waterTick(dt, dive);
  }

  /** The hands: up out of the sea outside the gunwale (fingers to the sky), turned over and closed on it, squeezing; off when let go. */
  poseHands(dt, grip, H, live, dead) {
    const show = this.reach > 0.02 && H && this.group.visible;
    for (const m of this.hands) m.visible = !!show;
    if (!show) { this.pour.visible = false; this.handPos[0].copy(this.domePos); this.handPos[1].copy(this.domePos); return; }
    const hf = _f.set(Math.sin(H.yaw), 0, Math.cos(H.yaw)), hr = _r.set(Math.cos(H.yaw), 0, -Math.sin(H.yaw)), s = this.side;
    const top = H.pos.y + (H.deckY ?? 2.3) + 1.2, L = H.length || 35, beam = H.beam || 9;
    const up = grip >= 0 ? sm(0, 0.7, grip) : this.reach, close = grip >= 0 ? sm(0.7, 1, grip) : this.gripping, sq = this.gripping * (0.5 + 0.5 * Math.sin(this.t * 2.2));
    const slide = live ? 0 : sm(0, 1.5, dead);
    this.hands.forEach((m, i) => {
      const along = (i ? 1 : -1) * L * 0.2, out = beam / 2 + 1.55 * HK * (1 - close) + 1.4 * HK * close;
      const gx = H.pos.x + hf.x * along + hr.x * s * out, gz = H.pos.z + hf.z * along + hr.z * s * out;
      const gy = lerp(this.seaY - 4.5 * HK, top + 0.15 * HK, up) - slide * 4 * HK - sq * 0.08 * HK;
      m.position.set(gx, gy, gz);
      const yaw = Math.atan2(-hr.x * s, -hr.z * s), pitch = lerp(-1.45, -0.05, close) - 0.04 * sq + slide * 0.6;
      _e.set(pitch, yaw, (i ? 1 : -1) * 0.12 * (1 - close), 'YXZ'); m.quaternion.setFromEuler(_e);
      m.updateMatrixWorld(true); this.handPos[i].set(0, 0, 1.2).applyMatrix4(m.matrixWorld);
      TIPS.forEach((x, f) => this.tipPos[i * TIPS.length + f].set(x * 1.08, -1.05, 2.6).applyMatrix4(m.matrixWorld));
    });
    // the pour: from each nail to the deck, falling and spreading inboard
    const on = live * close * (this.cmd.pour ?? (grip >= 0.999 ? 1 : 0.35 * close));
    this.pour.visible = on > 0.02; this.pu.uT.value = this.t; this.pu.uOn.value = on;
    if (!this.pour.visible) return;
    const P = this.pour.geometry.attributes.position.array, deck = top - 1.2;
    for (let st = 0; st < STREAMS; st++) {
      const a = this.tipPos[st], w = 0.35 * HK * (0.7 + 0.3 * Math.sin(this.t * 3 + st));
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG, inb = 0.6 * HK * t * t, fx = a.x - hr.x * s * inb, fz = a.z - hr.z * s * inb, fy = lerp(a.y, deck, t);
        for (let e = 0; e < 2; e++) { const v = ((st * (SEG + 1) + i) * 2 + e) * 3, o = (e - 0.5) * w * (1 + t); P[v] = fx + hf.x * o; P[v + 1] = fy; P[v + 2] = fz + hf.z * o; }
      }
    }
    this.pour.geometry.attributes.position.needsUpdate = true;
  }

  /** The water: a ring round it as it comes up through the sea and goes back, the hands breaking it as they rise. */
  waterTick(dt, dive) {
    const W = this.game.water; if (!W?.disturb || this.dead > 2) return;
    const up = this.riseS > 0.25;
    if (up !== this.wasUp) { this.wasUp = up; splashRing(this.game, this.pos.x, this.pos.z, 4.5 * K, 8, 1, this.seaY, up ? 'wake' : 'dive'); }
    if (dive > 0.5 && !this.dived) { this.dived = true; splashRing(this.game, this.pos.x, this.pos.z, 3 * K, 6, 1, this.seaY); }
    if (dive < 0) this.dived = false;
    this.handT = (this.handT || 0) - dt;
    if (this.reach > 0.05 && this.reach < 0.95 && this.handT <= 0) { this.handT = 0.4; for (const h of this.handPos) W.disturb(h.x, h.z, 0.8, 'dive', this.seaY); }
  }

  dispose() {
    this.group.removeFromParent(); for (const m of [...this.hands, this.pour]) m.removeFromParent();
    this.mesh.geometry.dispose(); this.hands[0].geometry.dispose(); this.pour.geometry.dispose(); this.pour.material.dispose(); this.mat.dispose();
  }
}
