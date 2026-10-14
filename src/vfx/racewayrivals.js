// ---------------------------------------------------------------------------------------
// THE RIVALS' LOOK (docs/plans/SKIFF-RACING.md section 11; Dovina's handoff of 2026-10-14, the owner's v198 notes: "a clapperjar riding,
// a real mini skiff"): Dovina's three placeholder bodies (world/raceway/rivals.js, a box and a sail with the creatures' clapperjar held
// still on it) dressed as a little Solar Skiff with a clapperjar riding it.
//   - THE MINI SKIFF: the Solar Skiff's own model (boat.js), cloned skinned at MINI.scale: its geometry, the hull's and the parts' very
//     materials (never changed in play, so shared), the energy's one copy (the Courier's flare must not light theirs), the cloth a painted
//     material of its own a rival (the same program: vfx/vessoulpaint.js), its sail dyed that rival's glaze. Its bones played from the
//     Solar Skiff's own Skiff_RideCruise (boatpose.js, sampled, not a second copy of the clips): the hull's bob as the Courier's board
//     bobs; the boom a little to leeward of the bend; through the skiff's range of motion last (rom.js SKIFF_ROM).
//   - THE RIDER: the creatures' clapperjar (creatures/clappers.js's model and tinted clay, its pupils merged into one mesh) in a glaze of
//     its own (celadon, jun, oxblood: three that read as three at a glance), its joints moved as the creatures' are (no clip: the body's
//     squash, the head's lid, the arms about their hinges), through CLAPPER_ROM last:
//       the lean   the whole unit banked into the bend by the turn rate (v x yaw rate against gravity), the rider a little further,
//                  arms out for balance, swaying with it
//       the bob    the body squashed and hopped with speed (a stride's beat on the sand), the head nodding the lid
//       the clap   the lid clapping and an arm waving when it passes the Courier or gets a bump in on them (race.bump), as a taunting
//                  clapperjar does in the workshop (its clap's sound, sfx.clap)
//       the tumble while spun out by a takedown (r.wreck: the group's spin is Dovina's): the rider cartwheels off the deck and lands
//                  back, lid open, arms flung; dizzy wobble after
//       the cheer  arms up and the lid open when it finishes (race.rival.finish)
//   THE SIBLINGS (the Sibling roster): no clapperjar; each its own rig riding the board at the Courier's size, its hull in its division's
//     body glaze and its sail dyed its trim's (vfx/racewaysiblingriders.js; the hull's glaze: vfx/hullglaze.js). The rivals' hull is a
//     painted copy of the Courier's own, so a hull glaze fired at the kiln stays on the Courier's board.
// Ticked by the rivals themselves (rivals.js update: one line). Materials all already built or a copy of one: 0 programs added. Draw
// calls a rival: the board's meshes and the hull's and parts' outlines (as the Courier's board), the clapperjar, its outline, its
// pupils; the placeholders' three removed.
//
// Prior art: Mario Kart's and Crash Team Racing's CPU racers (each its own colour and body, a taunt as it passes you, a tumble when hit),
// Burnout 3's takedown spin, Kirby Air Ride's little riders leaning on their stars; the workshop's own clapperjars (creatures/clappers.js:
// the lid's clap, the arm's wave, the stunned wobble), whose numbers these follow.
//
//   const L = new RacewayRivals(game)   L.update(dt, rivals, race)  (rivals.js: dresses each rival's group once both models are in)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addOutline } from '../render/outline.js';
import { vessoulPainted } from './vessoulpaint.js';
import { cloneTinted } from './greytint.js';
import { JointLimits, SKIFF_ROM, CLAPPER_ROM } from '../courier/anim/rom.js';
import { GLAZES } from '../courier/vessel/glazes.js';
import { sfx } from '../audio/sfx.js';
import { RacewaySiblingRiders, SIBLING_RIDE } from './racewaysiblingriders.js';
import { glazeHull } from './hullglaze.js';

/** The numbers. The board: its scale of the Solar Skiff, the boom's swing to leeward (rad per rad/s of turn); the rider: its scale, where
 *  it stands (m, the board's frame: +Z the bow), how far it sits into the deck; the lean (rad at most, the board's share of it, the
 *  rider's extra); the bob (hops a second at top speed, its height m, squash); the clap (real s, flaps a second); the tumble (real s of
 *  the spin-out it takes, its hop m); the glazes, one a rival; the sail's dye (share of the glaze over the cream). */
export const RIVAL_LOOK = {
  mini: { scale: 0.72, boom: 0.5, boomRest: 0.35 },
  rider: { scale: 2.0, z: -0.34, sink: 0.02 },
  lean: { max: 0.55, board: 0.6, rider: 0.3, ease: 6 },
  bob: { rate: 2.6, hop: 0.05, squash: 0.06, top: 30 },
  clap: { dur: 1.1, rate: 13 },
  tumble: { dur: 1.1, hop: 0.9 },
  glazes: ['celadon', 'jun', 'oxblood'],
  dye: 0.55,
};

const UP = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1);
const _q = new THREE.Quaternion(), _v = new THREE.Vector3();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = THREE.MathUtils.clamp, damp = THREE.MathUtils.damp;
const smooth = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };

export class RacewayRivals {
  constructor(game) {
    this.game = game;
    this.t = 0;
    const E = game.events;
    const of = (e) => this.V?.list?.[e.rival]?.group?.userData.rivalLook;
    // a bump the Courier made that did not take it down: it claps back; a finish: it cheers (a takedown is its r.wreck, read each frame)
    E?.on('race.bump', (e) => { const L = of(e); if (L) this.clap(L); });
    E?.on('race.rival.finish', (e) => { const L = of(e); if (L) L.cheer = 1; });
  }

  /** The skiff's model and the clapperjar's, when both are in (until then the placeholders stand). */
  get sources() {
    const sk = this.game.techs?.get?.('skiff')?.skiff, cl = this.game.clappers;
    return sk?.ready && sk.model && sk.P && cl?.gltf?.scene && cl.mat ? { sk, cl } : null;
  }

  /** The materials every rival shares (built once): the hull's and the parts' are the Solar Skiff's own, the energy's one copy. */
  shared(sk) {
    if (this.mats) return this.mats;
    const M = { hull: null, parts: null, energy: null, cloth: null };
    sk.model.traverse((o) => {
      if (!o.isMesh || o.userData.isOutline) return;
      const n = o.material?.name;
      if (n === 'Skiff_Hull') { M.hull = vessoulPainted(o.material.map ?? null, {}); M.hull.name = n; } // (its own copy, the same program: the Courier's hull carries a glaze fired at the kiln, theirs does not)
      else if (n === 'Skiff_Parts') M.parts = o.material;
      else if (n === 'CourierEnergy') { M.energy = o.material.clone(); M.energy.emissiveIntensity = 0.3; }
      else if (n === 'Skiff_Cloth') M.cloth = o.material;
    });
    // (the pupils: the creatures' own, two little spheres merged into one mesh)
    const eye = (x) => new THREE.SphereGeometry(0.028, 6, 4).scale(0.7, 1.5, 0.7).translate(x, 0.01, 0);
    M.pupils = mergeGeometries([eye(-0.081), eye(0.081)]);
    return (this.mats = M);
  }

  /** Dress one rival's group: the placeholders out, the mini skiff and its clapperjar in. */
  dress(r, { sk, cl }) {
    const M = this.shared(sk), group = r.group, i = r.i ?? 0, A = RIVAL_LOOK;
    for (const o of [...group.children]) {
      o.removeFromParent();
      if (o.isMesh && !o.isSkinnedMesh) { o.geometry?.dispose(); o.material?.dispose?.(); } // (her box, sail and pot are her own; the jar's clone shares the creatures')
    }
    const sib = r.P?.sibling ? (this.siblings ||= new RacewaySiblingRiders(this.game)).of(r.name) : null, look = sib ? this.siblings.look(sib) : null;
    const glaze = new THREE.Color(GLAZES[sib ? look.trim : A.glazes[i % A.glazes.length]]?.color ?? 0xb4603f);
    const scale = sib ? SIBLING_RIDE.board : A.mini.scale;
    let hull = M.hull; if (sib) { hull = vessoulPainted(M.hull.map, {}); hull.name = 'Skiff_Hull'; glazeHull(hull, look.body); } // (a sibling's board in its body's glaze)
    const unit = new THREE.Group(); // (banked as one: the board and its rider)
    group.add(unit);
    // ---- the mini skiff
    // (the Courier's board's meshes keep a reference to their outline in userData, which a clone would copy as JSON: set aside for it)
    const kept = [];
    sk.model.traverse((o) => { if (o.userData.outline) { kept.push([o, o.userData.outline]); delete o.userData.outline; } });
    const board = cloneSkinned(sk.model);
    for (const [o, ol] of kept) o.userData.outline = ol;
    board.scale.setScalar(scale);
    const cloth = vessoulPainted(M.cloth?.map ?? null, { side: THREE.DoubleSide, roughness: 0.9 }); // (the Courier's cloth's program, its fade its own)
    cloth.color.set(0xffffff).lerp(glaze, A.dye); cloth.emissive.copy(cloth.color); cloth.name = 'Skiff_Cloth';
    board.traverse((o) => {
      if (!o.isMesh || o.userData.isOutline) return;
      const n = o.material?.name;
      o.material = n === 'Skiff_Hull' ? hull : n === 'Skiff_Parts' ? M.parts : n === 'CourierEnergy' ? M.energy : n === 'Skiff_Cloth' ? cloth : o.material;
      o.castShadow = n === 'Skiff_Hull'; o.receiveShadow = false; // (one shadow a board: the hull's)
    });
    let skin = null;
    board.traverse((o) => { if (!skin && o.isSkinnedMesh && !o.userData.isOutline && o.skeleton.bones.length === sk.P.nb) skin = o; });
    const bones = skin ? skin.skeleton.bones : sk.P.bones.map((b) => board.getObjectByName(b.name)); // (the skeleton's own order, as boatpose.js keeps it)
    const rom = new JointLimits();
    for (const [name, spec] of Object.entries(SKIFF_ROM)) { const k = sk.P.index[name], b = bones[k]; if (b) rom.add(b, _q.fromArray(sk.P.rest.q, k * 4), spec); }
    unit.add(board);
    if (sib) { // ---- a sibling riding it (its rig seated when it is in: vfx/racewaysiblingriders.js)
      const L = { unit, board, bones, rom, cloth, mat: hull, scale, sibling: sib, frame: new sk.P.A.constructor(sk.P.nb), phase: i * 1.7, lean: 0, yaw: null, turn: 0, clapT: 0, cheer: 0, tumble: 0, out: 0, rel: null };
      group.userData.rivalLook = L;
      return L;
    }
    // ---- the clapperjar riding it
    const jar = cloneSkinned(cl.gltf.scene);
    jar.scale.setScalar(A.rider.scale);
    jar.position.set(0, -A.rider.sink, A.rider.z);
    const mat = cloneTinted(cl.mat); mat.color.copy(glaze); // (its own glaze over the owner's grey painting: vfx/greytint.js, the same program)
    const meshes = [];
    jar.traverse((o) => { if (o.isMesh) meshes.push(o); });
    const isEye = (o) => /eye/i.test(o.name) || [].concat(o.material).some((m) => /eye/i.test(m?.name || ''));
    const ownEyes = meshes.some(isEye);
    for (const o of meshes) {
      o.frustumCulled = false;
      if (isEye(o)) { o.castShadow = false; continue; }
      o.material = mat; o.castShadow = true;
      addOutline(o);
    }
    const bone = (n) => jar.getObjectByName(n);
    const eyes = bone('eyes');
    if (eyes && !ownEyes && cl.eyeMat) eyes.add(new THREE.Mesh(M.pupils, cl.eyeMat));
    unit.add(jar);
    jar.updateMatrixWorld(true);
    const mq = jar.getWorldQuaternion(new THREE.Quaternion()).invert();
    const restInv = (b) => (b ? b.getWorldQuaternion(new THREE.Quaternion()).premultiply(mq).invert() : null);
    const jb = { body: bone('body'), head: bone('head'), armL: bone('upper_armL'), armR: bone('upper_armR'), foreL: bone('forearmL'), foreR: bone('forearmR') };
    const rest = {}, inv = {};
    for (const [k, b] of Object.entries(jb)) if (b) { rest[k] = b.quaternion.clone(); inv[k] = restInv(b); }
    const jrom = new JointLimits();
    for (const [name, spec] of Object.entries(CLAPPER_ROM)) { const b = bone(name); if (b) jrom.add(b, b.quaternion.clone(), spec); }
    const L = { unit, board, bones, rom, jar, jb, rest, inv, jrom, cloth, mat, frame: new sk.P.A.constructor(sk.P.nb),
      phase: i * 1.7, lean: 0, yaw: null, turn: 0, clapT: 0, clapLatch: false, cheer: 0, tumble: 0, out: 0, rel: null, look: 0 };
    group.userData.rivalLook = L;
    return L;
  }

  clap(L) { if (L.clapT <= 0) L.clapT = RIVAL_LOOK.clap.dur; }

  /** Per frame, from rivals.js: dress what is new, then ride each. */
  update(dt, V, race) {
    this.V = V; this.t += dt;
    if (!V?.list?.length) return;
    // a new race's rivals: the last race's own copies let go (the cloth's and the clay's; the shared materials and geometry kept)
    if (this.list !== V.list) { for (const L of this.dressed || []) { L.cloth.dispose(); L.mat?.dispose(); } this.dressed = []; this.list = V.list; }
    const src = this.sources;
    const me = race && V.T ? V.mine(race) : null, running = race?.state === 'run';
    for (const r of V.list) {
      let L = r.group.userData.rivalLook;
      if (!L) { if (!src) continue; L = this.dress(r, src); this.dressed.push(L); }
      // it passes the Courier: a clap (only one way: overtaking, never being overtaken)
      if (me != null && running) { const rel = r.d - me; if (L.rel != null && L.rel < 0 && rel >= 0 && r.done == null) this.clap(L); L.rel = rel; }
      this.ride(L, r, dt, src?.sk);
    }
  }

  /** One rival's frame: the board's bob and boom, the lean, the rider's body. */
  ride(L, r, dt, sk) {
    const A = RIVAL_LOOK, t = this.t + L.phase, v = r.v || 0, k = clamp(v / A.bob.top, 0, 1);
    // the turn rate from the line's heading (never the takedown's spin), and the lean it asks for (into the bend: the top toward it)
    const yaw = r.F ? Math.atan2(r.F.fx, r.F.fz) : 0;
    const rate = L.yaw == null || dt <= 0 ? 0 : wrap(yaw - L.yaw) / dt;
    L.yaw = yaw;
    L.turn = damp(L.turn, rate, A.lean.ease, dt);
    const want = clamp(Math.atan((v * L.turn) / 9.8), -A.lean.max, A.lean.max);
    L.lean = damp(L.lean, want, A.lean.ease, dt);
    // the takedown's tumble: from the moment r.wreck jumps up, the rider's cartwheel over the first A.tumble.dur, then a dizzy wobble
    if (r.wreck > L.out + 0.05) { L.out = r.wreck; L.tumble = 0; }
    if (r.wreck <= 0) L.out = 0;
    const wrecked = r.wreck > 0;
    if (wrecked) L.tumble += dt;
    const tp = wrecked ? clamp(L.tumble / A.tumble.dur, 0, 1) : 1, tumbling = wrecked && tp < 1;
    // ---- the board: banked (its share), a wobble while spun out
    L.unit.quaternion.setFromAxisAngle(Z, -L.lean * A.lean.board + (wrecked ? Math.sin(t * 11) * 0.12 * (r.wreck / (L.out || 1)) : 0));
    if (sk?.P) {
      const P = sk.P, F = P.sample('Skiff_RideCruise', t, L.frame, true), B = L.bones;
      for (let i = 0; i < P.nb; i++) { const b = B[i]; if (!b) continue; b.position.fromArray(F.p, i * 3); b.quaternion.fromArray(F.q, i * 4); b.scale.fromArray(F.s, i * 3); }
      const boom = B[P.index.boom];
      if (boom) boom.quaternion.multiply(_q.setFromAxisAngle(Z, clamp(A.mini.boomRest * Math.sign(L.turn || 1) + L.turn * A.mini.boom, -1, 1)));
      L.rom.apply();
    }
    // ---- a sibling's rider (seated once its rig is in): vfx/racewaysiblingriders.js
    if (L.sibling) {
      if (!L.rider) this.siblings.seat(L, L.sibling);
      if (L.rider) this.siblings.ride(L, r, dt, t, { turn: L.turn, tumble: tumbling ? tp : -1 });
      return;
    }
    // ---- the rider: reset to rest, then the layers, then the limits
    const J = L.jb, R = L.rest, I = L.inv;
    for (const n in R) J[n].quaternion.copy(R[n]);
    if (J.body) J.body.scale.set(1, 1, 1);
    const bobPh = t * A.bob.rate * Math.PI * 2 * (0.4 + 0.6 * k), bob = Math.abs(Math.sin(bobPh)) * k;
    let squash = (bob - 0.5) * A.bob.squash * k, lid = 0.12 * bob * k, armL = 0.9 + L.lean * 1.4, armR = -0.9 + L.lean * 1.4, foreL = 0, foreR = 0;
    // the clap: the lid flapping, the right arm waving (a taunting clapperjar's, clappers.js)
    if (L.clapT > 0) {
      L.clapT -= dt;
      const ph = Math.sin(t * A.clap.rate);
      lid = Math.max(lid, Math.max(0, ph) * 0.9);
      armR = -1.9 - Math.sin(t * 14) * 0.5; foreR = -Math.sin(t * 14 + 1) * 0.6;
      if (ph > 0.97 && !L.clapLatch) L.clapLatch = true;
      if (ph < 0 && L.clapLatch) { L.clapLatch = false; sfx.clap?.(this.game.listenerDistance?.(r.group.position) ?? 30); }
    }
    if (r.done != null) L.cheer = 1;
    if (L.cheer > 0) { armL = 1.8 + Math.sin(t * 9) * 0.2; armR = -1.8 - Math.sin(t * 9 + 1) * 0.2; lid = Math.max(lid, 0.6); }
    if (wrecked) { lid = Math.max(lid, tumbling ? 0.9 : 0.4); armL = 2.2 + Math.sin(t * 17) * 0.4; armR = -2.2 - Math.sin(t * 15) * 0.4; foreL = Math.sin(t * 13) * 0.8; foreR = -Math.sin(t * 12) * 0.8; squash = tumbling ? -0.08 : squash; }
    if (J.body) J.body.scale.set(1 - squash * 0.5, 1 + squash, 1 - squash * 0.5);
    // the head: the lid (about its hinge) and a look toward the Courier when near, a dizzy sway after a takedown
    const P0 = this.game.player?.renderPos ?? this.game.player?.pos;
    let look = 0;
    if (wrecked && !tumbling) look = Math.sin(t * 5) * 0.8;
    else if (P0) { _v.copy(P0).sub(r.group.position); if (_v.lengthSq() < 15 * 15) look = clamp(wrap(Math.atan2(_v.x, _v.z) - yaw), -1.2, 1.2); }
    L.look = damp(L.look, look, 6, dt);
    if (J.head && I.head) {
      J.head.quaternion.multiply(_q.setFromAxisAngle(_v.copy(UP).applyQuaternion(I.head).normalize(), L.look));
      J.head.quaternion.multiply(_q.setFromAxisAngle(_v.copy(X).applyQuaternion(I.head).normalize(), -lid));
    }
    const arm = (b, inv, ang) => { if (b && inv && ang) b.quaternion.multiply(_q.setFromAxisAngle(_v.copy(Z).applyQuaternion(inv).normalize(), ang)); };
    arm(J.armL, I.armL, armL); arm(J.armR, I.armR, armR); arm(J.foreL, I.foreL, foreL); arm(J.foreR, I.foreR, foreR);
    L.jrom.apply(); // (the joints' limits, last)
    // the whole jar: its extra lean, the bob's hop, the tumble's cartwheel about the bow (about its middle, up off the deck and back)
    const half = 0.32 * A.rider.scale; // (the clapperjar's middle over its feet: creatures/clappers.js HALF + RADIUS)
    const spin = tumbling ? smooth(tp) * Math.PI * 2 : 0, hop = tumbling ? Math.sin(Math.PI * tp) * A.tumble.hop : bob * A.bob.hop;
    L.jar.position.set(half * Math.sin(spin), -A.rider.sink + hop + half * (1 - Math.cos(spin)), A.rider.z);
    L.jar.rotation.set(0, 0, -L.lean * A.lean.rider + spin);
  }
}
