// Retarget Quaternius' Universal Animation Library clips (CC0) onto the Courier rig
// and pack them into a compact binary the game imports (src/assets/anims.bin).
//
//   node tools/bake_anims.mjs <ual1_standard.glb> <ual2_standard.glb> [--all]
//
// The sources are the free "Standard" tiers of Universal Animation Library 1 and 2
// (https://quaternius.com, CC0 1.0) in their Unreal/Godot bone naming, no root motion.
//
// Retargeting is the usual world-space delta transfer: both rigs rest in a T-pose
// facing +Z, so for every mapped bone
//     targetWorld(t) = sourceWorld(t) * inverse(sourceRestWorld) * targetRestWorld
// which carries each bone's rotation away from the T-pose over regardless of how
// the two rigs orient their bone axes. Bones the source lacks (Courier's second neck
// bone) stay at rest; bones Courier lacks (clavicles) fold into their children
// because the transfer is done in world space. The pelvis translation is scaled by
// the ratio of leg lengths.
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const ALL = process.argv.includes('--all');
if (args.length < 2) { console.error('usage: node tools/bake_anims.mjs ual1.glb ual2.glb [--all]'); process.exit(1); }

const FPS = 30;
// source clip -> name in game (and whether it loops)
const WANT = {
  Idle_Loop: 'idle', Walk_Loop: 'walk', Jog_Fwd_Loop: 'jog', Sprint_Loop: 'sprint',
  Crouch_Idle_Loop: 'crouchIdle', Crouch_Fwd_Loop: 'crouchWalk',
  Jump_Start: 'jumpStart', Jump_Loop: 'jumpLoop', Jump_Land: 'jumpLand',
  NinjaJump_Start: 'flipStart', NinjaJump_Idle_Loop: 'flipLoop', NinjaJump_Land: 'flipLand',
  Slide_Start: 'slideStart', Slide_Loop: 'slideLoop', Slide_Exit: 'slideExit',
  ClimbUp_1m: 'climb',
  Pistol_Idle_Loop: 'pistolIdle', Pistol_Aim_Neutral: 'aimMid', Pistol_Aim_Up: 'aimUp', Pistol_Aim_Down: 'aimDown',
  Pistol_Reload: 'reload',
};

const MAP = {
  pelvis: 'spine', spine_01: 'spine001', spine_02: 'spine002', spine_03: 'spine003', neck_01: 'spine004', Head: 'head',
  thigh_l: 'thighL', calf_l: 'shinL', foot_l: 'footL', ball_l: 'toeL',
  thigh_r: 'thighR', calf_r: 'shinR', foot_r: 'footR', ball_r: 'toeR',
  upperarm_l: 'upper_armL', lowerarm_l: 'forearmL', hand_l: 'handL',
  upperarm_r: 'upper_armR', lowerarm_r: 'forearmR', hand_r: 'handR',
};
for (const s of ['l', 'r']) {
  const S = s.toUpperCase();
  for (const f of ['index', 'middle', 'ring', 'pinky']) for (const i of [1, 2, 3]) MAP[`${f}_0${i}_${s}`] = `f_${f}0${i}${S}`;
  for (const i of [1, 2, 3]) MAP[`thumb_0${i}_${s}`] = `thumb0${i}${S}`;
}

const load = (f) => new Promise((res, rej) => {
  const b = fs.readFileSync(f);
  new GLTFLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '', res, rej);
});
const bonesOf = (scene) => { const o = {}; scene.traverse((n) => { if (n.isBone) o[n.name] = n; }); return o; };

const tgt = await load(path.join(root, 'src/assets/courier.glb'));
const TB = bonesOf(tgt.scene);
tgt.scene.updateMatrixWorld(true);
const tgtRest = new Map();
for (const b of Object.values(TB)) tgtRest.set(b, { q: b.quaternion.clone(), p: b.position.clone(), wq: b.getWorldQuaternion(new THREE.Quaternion()) });
// bones driven, in parent-before-child order
const order = [];
tgt.scene.traverse((n) => { if (n.isBone && Object.values(MAP).includes(n.name)) order.push(n.name); });

const tHip0 = TB.spine.getWorldPosition(new THREE.Vector3());
const legT = tHip0.y - TB.footL.getWorldPosition(new THREE.Vector3()).y;
const header = { fps: FPS, bones: order, clips: [] };
const data = [];
const q16 = (x) => Math.max(-32767, Math.min(32767, Math.round(x * 32767)));
const P = 8192; // position scale

for (const file of args) {
  const src = await load(file);
  const SB = bonesOf(src.scene);
  src.scene.updateMatrixWorld(true);
  const srcRestWInv = new Map();
  for (const [s] of Object.entries(MAP)) srcRestWInv.set(s, SB[s].getWorldQuaternion(new THREE.Quaternion()).invert());
  const sHip0 = SB.pelvis.getWorldPosition(new THREE.Vector3());
  const legS = sHip0.y - SB.foot_l.getWorldPosition(new THREE.Vector3()).y;
  const scale = legT / legS;
  const inv = new Map(Object.entries(MAP).map(([s, t]) => [t, s]));
  const mixer = new THREE.AnimationMixer(src.scene);

  for (const clip of src.animations) {
    const name = WANT[clip.name] || (ALL ? clip.name : null);
    if (!name) continue;
    const action = mixer.clipAction(clip);
    mixer.stopAllAction();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().play();
    const frames = Math.max(1, Math.round(clip.duration * FPS)) + 1;
    const qs = order.map(() => []);
    const hip = [];
    for (let f = 0; f < frames; f++) {
      mixer.setTime(Math.min(clip.duration - 1e-4, f / FPS));
      src.scene.updateMatrixWorld(true);
      for (const n of Object.keys(TB)) { const r = tgtRest.get(TB[n]); TB[n].quaternion.copy(r.q); TB[n].position.copy(r.p); }
      order.forEach((tn, i) => {
        const sn = inv.get(tn);
        const want = SB[sn].getWorldQuaternion(new THREE.Quaternion()).multiply(srcRestWInv.get(sn)).multiply(tgtRest.get(TB[tn]).wq);
        const b = TB[tn];
        b.parent.updateMatrixWorld(true);
        const pq = b.parent.getWorldQuaternion(new THREE.Quaternion());
        b.quaternion.copy(pq.invert().multiply(want));
        b.updateMatrixWorld(true);
        const q = b.quaternion;
        // keep the hemisphere continuous between frames
        const prev = qs[i][qs[i].length - 1];
        if (prev && prev[0] * q.x + prev[1] * q.y + prev[2] * q.z + prev[3] * q.w < 0) q.set(-q.x, -q.y, -q.z, -q.w);
        qs[i].push([q.x, q.y, q.z, q.w]);
      });
      // pelvis offset from rest, in the parent (armature) space of the Courier hips
      const d = SB.pelvis.getWorldPosition(new THREE.Vector3()).sub(sHip0).multiplyScalar(scale);
      const pw = tHip0.clone().add(d);
      TB.spine.parent.worldToLocal(pw);
      hip.push([pw.x, pw.y, pw.z]);
    }
    const c = { name, src: clip.name, dur: clip.duration, frames, tracks: [] };
    const push = (bi, kind, arr, k) => {
      const flat = arr.every((v) => v.every((x, j) => Math.abs(x - arr[0][j]) < 1e-4));
      const n = flat ? 1 : arr.length;
      c.tracks.push({ b: bi, k: kind, o: data.length, n });
      for (let f = 0; f < n; f++) for (const x of arr[f]) data.push(k(x));
    };
    order.forEach((tn, i) => push(i, 'q', qs[i], q16));
    push(order.indexOf('spine'), 'p', hip, (x) => Math.max(-32767, Math.min(32767, Math.round(x * P))));
    header.clips.push(c);
    console.log(`${name.padEnd(12)} ${clip.name.padEnd(22)} ${clip.duration.toFixed(2)}s ${frames}f`);
  }
}
header.posScale = 1 / P;
const hj = Buffer.from(JSON.stringify(header));
const pad = (4 - ((4 + hj.length) % 4)) % 4;
const out = Buffer.alloc(4 + hj.length + pad + data.length * 2);
out.writeUInt32LE(hj.length + pad, 0);
hj.copy(out, 4);
out.fill(32, 4 + hj.length, 4 + hj.length + pad);
const i16 = new Int16Array(data);
Buffer.from(i16.buffer).copy(out, 4 + hj.length + pad);
const dst = path.join(root, ALL ? 'src/assets/anims_all.bin' : 'src/assets/anims.bin');
fs.writeFileSync(dst, out);
console.log(`wrote ${dst} ${(out.length / 1024).toFixed(0)} KB, ${header.clips.length} clips`);
