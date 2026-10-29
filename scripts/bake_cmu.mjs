// Retarget clips from the CMU Graphics Lab Motion Capture Database (free for any use,
// commercial included; the data itself may not be resold) onto the Courier rig, and pack them
// next to the Universal Animation Library clips (src/assets/anims_cmu.bin, same format, same
// bone order as anims.bin).
//
//   node scripts/bake_cmu.mjs <cmu-bvh-dir> [--list] [--only name,name] [--find-loop file t0 t1 minDur maxDur]
//
// The source is the Motionbuilder-friendly BVH conversion of the database (Bruce Hahne's
// cgspeed release, one .bvh per trial: <dir>/<subject>/<subject>_<trial>.bvh; a copy is served
// file by file from the una-dinosauria/cmu-mocap repository, data/<subject>/<trial>.bvh). What to
// take from where lives in scripts/cmu_clips.json: a trial, a time window, and how to treat the
// root (in place or not), loop closing, mirroring, reversing; and for a blow (the melee loadout's
// Cmu_ clips): `faceYaw` (the strike's heading as the front), `reroot` (the pelvis from the
// window's first frame: casebook rule 19), `hold` (an anticipation beat), `pivot` (a follow-
// through's turn taken back to the front), `exaggerate` (ART.md 9's push), `despike` (a few wrong
// frames of named bones), `straight` (a knee or elbow bent back put straight), `fist`, `mask`.
// The whole pack is written every run: --only writes only the clips it names.
//
// Retargeting is a world-space delta transfer, with the two rigs' rest directions matched:
//   targetWorld(t) = sourceWorld(t) * R_match * targetRestWorld
// where a BVH bone's rest orientation is the identity (its offsets alone define the rest pose),
// so sourceWorld(t) already *is* the rotation away from rest, and R_match is the swing that
// turns the Courier bone's rest direction onto the mocap bone's. The pelvis moves by the
// mocap's hip travel scaled by the ratio of hip heights, with root yaw (and, per clip, the net
// horizontal and vertical travel) taken out, so clips play in place under game code.
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
if (!dir) { console.error('usage: node scripts/bake_cmu.mjs <cmu-bvh-dir> [--only a,b]'); process.exit(1); }
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx >= 0 ? new Set(args[onlyIdx + 1].split(',')) : null;
const FPS = 30;

// mocap bone -> Courier bone
const MAP = {
  Hips: 'spine', LowerBack: 'spine001', Spine: 'spine002', Spine1: 'spine003', Neck: 'spine004', Head: 'head',
  LeftArm: 'upper_armL', LeftForeArm: 'forearmL', LeftHand: 'handL',
  RightArm: 'upper_armR', RightForeArm: 'forearmR', RightHand: 'handR',
  LeftUpLeg: 'thighL', LeftLeg: 'shinL', LeftFoot: 'footL', LeftToeBase: 'toeL',
  RightUpLeg: 'thighR', RightLeg: 'shinR', RightFoot: 'footR', RightToeBase: 'toeR',
};
// the bone each one points at (for the rest direction); leaves reuse their parent's match
const CHILD_SRC = { Hips: 'Spine', LowerBack: 'Spine', Spine: 'Spine1', Spine1: 'Neck', Neck: 'Head', LeftArm: 'LeftForeArm', LeftForeArm: 'LeftHand', LeftHand: 'LeftFingerBase',
  RightArm: 'RightForeArm', RightForeArm: 'RightHand', RightHand: 'RightFingerBase', LeftUpLeg: 'LeftLeg', LeftLeg: 'LeftFoot', LeftFoot: 'LeftToeBase',
  RightUpLeg: 'RightLeg', RightLeg: 'RightFoot', RightFoot: 'RightToeBase' };
const CHILD_TGT = { spine: 'spine002', spine001: 'spine002', spine002: 'spine003', spine003: 'spine004', spine004: 'head', upper_armL: 'forearmL', forearmL: 'handL', handL: 'f_middle01L',
  upper_armR: 'forearmR', forearmR: 'handR', handR: 'f_middle01R', thighL: 'shinL', shinL: 'footL', footL: 'toeL', thighR: 'shinR', shinR: 'footR', footR: 'toeR' };

const packPath = path.join(root, 'src/assets/anims.bin');
const bin = fs.readFileSync(packPath);
const hl = bin.readUInt32LE(0);
const packHeader = JSON.parse(bin.subarray(4, 4 + hl).toString());
const order = packHeader.bones; // the game's bone order

const load = (f) => new Promise((res, rej) => {
  const b = fs.readFileSync(f);
  new GLTFLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '', res, rej);
});
const tgt = await load(path.join(root, 'src/assets/courier.glb'));
const TB = {};
tgt.scene.traverse((n) => { if (n.isBone) TB[n.name] = n; });
tgt.scene.updateMatrixWorld(true);
const tgtRest = new Map();
for (const b of Object.values(TB)) tgtRest.set(b, { q: b.quaternion.clone(), p: b.position.clone(), wq: b.getWorldQuaternion(new THREE.Quaternion()), wp: b.getWorldPosition(new THREE.Vector3()) });
const tHip0 = TB.spine.getWorldPosition(new THREE.Vector3());
const tFoot0 = TB.footL.getWorldPosition(new THREE.Vector3());
const tgtHipHeight = tHip0.y - tFoot0.y;

const spec = JSON.parse(fs.readFileSync(path.join(root, 'scripts/cmu_clips.json'), 'utf8'));
const header = { fps: FPS, bones: order, clips: [] };
const data = [];
const q16 = (x) => Math.max(-32767, Math.min(32767, Math.round(x * 32767)));
const P = 8192;
const cache = new Map();

function loadBvh(file) {
  if (cache.has(file)) return cache.get(file);
  const sub = file.split('_')[0].padStart(3, '0');
  const text = fs.readFileSync(path.join(dir, sub, `${file}.bvh`), 'utf8');
  const { skeleton, clip } = new BVHLoader().parse(text);
  const wrap = new THREE.Group();
  wrap.add(skeleton.bones[0]);
  const SB = {};
  for (const b of skeleton.bones) SB[b.name] = b;
  // rest (offsets only): world positions with identity rotations
  wrap.updateMatrixWorld(true);
  const restPos = {};
  for (const b of skeleton.bones) restPos[b.name] = b.getWorldPosition(new THREE.Vector3());
  const r = { skeleton, clip, wrap, SB, restPos, mixer: new THREE.AnimationMixer(wrap) };
  cache.set(file, r);
  return r;
}

// swing rotations matching the Courier's rest directions to the mocap's
function matches(src) {
  const R = {};
  for (const [s, t] of Object.entries(MAP)) {
    const cs = CHILD_SRC[s], ct = CHILD_TGT[t];
    if (cs && ct && src.restPos[cs] && TB[ct]) {
      const dS = src.restPos[cs].clone().sub(src.restPos[s]).normalize();
      const dT = tgtRest.get(TB[ct]).wp.clone().sub(tgtRest.get(TB[t]).wp).normalize();
      R[t] = new THREE.Quaternion().setFromUnitVectors(dT, dS);
    }
  }
  // leaves: the parent's
  R.head = R.spine004;
  R.toeL = R.footL; R.toeR = R.footR;
  return R;
}

const inv = new Map(Object.entries(MAP).map(([s, t]) => [t, s]));

// --probe FILE [step]: heading and heights over time, to find the parts of a trial worth taking
const pi = args.indexOf('--probe');
if (pi >= 0) {
  const file = args[pi + 1], step = +(args[pi + 2] || 0.25);
  const src = loadBvh(file);
  const { wrap, SB, mixer, clip } = src;
  const action = mixer.clipAction(clip); action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.reset().play();
  const at0 = (t) => { mixer.setTime(Math.min(clip.duration - 1e-4, t)); wrap.updateMatrixWorld(true); };
  at0(0);
  const hip0 = SB.Hips.getWorldPosition(new THREE.Vector3()), foot0 = SB.LeftFoot.getWorldPosition(new THREE.Vector3());
  const sc = tgtHipHeight / (hip0.y - foot0.y);
  console.log(`${file}: ${clip.duration.toFixed(2)} s, scale ${sc.toFixed(3)}; t  heading  hipY  LhandY RhandY LfootY RfootY  (m, relative to the start pose's feet)`);
  for (let t = 0; t < clip.duration; t += step) {
    at0(t);
    const f = new THREE.Vector3(0, 0, 1).applyQuaternion(SB.Hips.getWorldQuaternion(new THREE.Quaternion()));
    const y = (n) => ((SB[n].getWorldPosition(new THREE.Vector3()).y - foot0.y) * sc).toFixed(2).padStart(5);
    console.log(t.toFixed(2).padStart(6), (Math.atan2(f.x, f.z) * 57.3).toFixed(0).padStart(5), y('Hips'), y('LeftHand'), y('RightHand'), y('LeftFoot'), y('RightFoot'));
  }
  process.exit(0);
}

// --find-loop FILE t0 t1 minDur maxDur: the pairs of times in [t0, t1] whose poses match best (loop points)
const li = args.indexOf('--find-loop');
if (li >= 0) {
  const [file, a, b, mn, mx] = [args[li + 1], +args[li + 2], +args[li + 3], +args[li + 4], +args[li + 5]];
  const src = loadBvh(file);
  const { wrap, SB, mixer, clip } = src;
  const action = mixer.clipAction(clip); action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.reset().play();
  const names = Object.keys(MAP);
  const feats = [];
  const times = [];
  wrap.quaternion.identity();
  for (let t = a; t <= b; t += 1 / 30) {
    mixer.setTime(Math.min(clip.duration - 1e-4, t)); wrap.updateMatrixWorld(true);
    const hq = SB.Hips.getWorldQuaternion(new THREE.Quaternion()).invert();
    const v = [];
    for (const n of names.slice(1)) {
      // (relative to the hips, so heading and travel don't count)
      const q = hq.clone().multiply(SB[n].getWorldQuaternion(new THREE.Quaternion()));
      if (q.w < 0) q.set(-q.x, -q.y, -q.z, -q.w);
      v.push(q.x, q.y, q.z, q.w);
    }
    feats.push(v); times.push(t);
  }
  const res = [];
  for (let i = 0; i < feats.length; i++) for (let j = i + Math.round(mn * 30); j < feats.length && j <= i + Math.round(mx * 30); j++) {
    let d = 0;
    for (let k = 0; k < feats[i].length; k++) d += (feats[i][k] - feats[j][k]) ** 2;
    res.push([d, times[i], times[j]]);
  }
  res.sort((x, y) => x[0] - y[0]);
  const shown = [];
  for (const r of res) { if (shown.every((s) => Math.abs(s[1] - r[1]) > 0.3 || Math.abs(s[2] - r[2]) > 0.3)) shown.push(r); if (shown.length >= 8) break; }
  for (const [d, t0, t1] of shown) console.log(`t0 ${t0.toFixed(2)}  t1 ${t1.toFixed(2)}  dur ${(t1 - t0).toFixed(2)}  mismatch ${d.toFixed(3)}`);
  process.exit(0);
}

for (const c of spec.clips) {
  if (ONLY && !ONLY.has(c.name)) continue;
  const src = loadBvh(c.file);
  const { wrap, SB, mixer, clip } = src;
  const match = matches(src);
  const action = mixer.clipAction(clip);
  mixer.stopAllAction();
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.reset().play();
  const t0 = c.t0 ?? 0, t1 = Math.min(c.t1 ?? clip.duration, clip.duration);
  const hold = c.hold || null; // ([file s, real s]: the pose at that moment held a beat, the anticipation's: the clip grows by it)
  const dur = t1 - t0, outDur = dur + (hold ? hold[1] : 0);
  const frames = Math.max(2, Math.round(outDur * FPS) + 1);
  // sample the window (in the file's own time), reversed if asked; a held beat stands still at its moment
  const at = (f) => {
    let s = (f / (frames - 1)) * outDur;
    if (hold) { const h = hold[0] - t0; s = s <= h ? s : s <= h + hold[1] ? h : s - hold[1]; }
    return c.reverse ? t1 - s : t0 + s;
  };
  // heading of the hips (the circular mean over the window, or `faceYaw`): taken out of the whole clip
  const setTime = (t) => { mixer.setTime(Math.min(clip.duration - 1e-4, Math.max(0, t))); wrap.updateMatrixWorld(true); };
  wrap.quaternion.identity(); wrap.position.set(0, 0, 0);
  let hx = 0, hz = 0;
  for (let f = 0; f < frames; f += 2) {
    setTime(at(f));
    const fw = new THREE.Vector3(0, 0, 1).applyQuaternion(SB.Hips.getWorldQuaternion(new THREE.Quaternion()));
    hx += fw.x; hz += fw.z;
  }
  const yaw0 = c.faceYaw !== undefined ? c.faceYaw * Math.PI / 180 : Math.atan2(hx, hz);
  const Y = new THREE.Vector3(0, 1, 0), qBase = new THREE.Quaternion().setFromAxisAngle(Y, -yaw0);
  wrap.quaternion.copy(qBase);
  // the file's first frame is a standing T-pose: the hip and foot heights there give the scale
  setTime(0);
  const hip0 = SB.Hips.getWorldPosition(new THREE.Vector3());
  const foot0 = SB.LeftFoot.getWorldPosition(new THREE.Vector3());
  const scale = tgtHipHeight / (hip0.y - foot0.y);
  // `pivot` [file s, file s]: from the first to the second the whole body is turned back about the hips' place at the first, so that by
  // the second (and after) the hips face as they did at the window's start (whole turns kept: a spin kick lands a turn round, not
  // unwound): a kick that ends side-on (the roundhouse's follow-through) plays on into the next blow from the front
  const pivot = c.pivot || null, hipYaw = [], pivotAt = new THREE.Vector3();
  if (pivot) {
    let last = null;
    for (let f = 0; f < frames; f++) {
      setTime(at(f));
      const fw = new THREE.Vector3(0, 0, 1).applyQuaternion(SB.Hips.getWorldQuaternion(new THREE.Quaternion()));
      let a = Math.atan2(fw.x, fw.z);
      if (last != null) a = last + Math.atan2(Math.sin(a - last), Math.cos(a - last));
      hipYaw.push((last = a));
    }
    setTime(pivot[0]); SB.Hips.getWorldPosition(pivotAt); pivotAt.y = 0;
  }
  const turns = pivot ? Math.round((hipYaw[frames - 1] - hipYaw[0]) / (2 * Math.PI)) * 2 * Math.PI : 0;
  const _qx = new THREE.Quaternion(), _c = new THREE.Vector3();
  const place = (f) => { // (frame f: the base heading, and the pivot's share)
    const t = at(f);
    let d = 0;
    if (pivot) { const u = THREE.MathUtils.smoothstep(t, pivot[0], pivot[1]); d = (hipYaw[f] - hipYaw[0] - turns) * u; }
    _qx.setFromAxisAngle(Y, -d); // (d: the turn the hips made, undone; about the pivot's place)
    wrap.quaternion.copy(_qx).multiply(qBase);
    _c.copy(pivotAt).applyQuaternion(_qx); wrap.position.copy(pivotAt).sub(_c);
    setTime(t);
  };
  // hip path over the window, to take the net travel (and, for climbs, the height) out
  const pathPos = [];
  for (let f = 0; f < frames; f++) { place(f); pathPos.push(SB.Hips.getWorldPosition(new THREE.Vector3())); }
  // `reroot`: the pelvis taken relative to the window's own first frame, not the file's T-pose (casebook rule 19: the kick's CMU clips
  // stood up to 0.97 m off the base pose); its height stays the file's standing one
  if (c.reroot) { hip0.x = pathPos[0].x; hip0.z = pathPos[0].z; }
  const trend = pathPos[frames - 1].clone().sub(pathPos[0]);
  const mean = pathPos.reduce((a, v) => a.add(v), new THREE.Vector3()).multiplyScalar(1 / frames);
  const qs = order.map(() => []);
  const hip = [];
  for (const n of Object.keys(TB)) { const r = tgtRest.get(TB[n]); TB[n].quaternion.copy(r.q); TB[n].position.copy(r.p); }
  for (let f = 0; f < frames; f++) {
    place(f);

    for (const n of Object.keys(TB)) { const r = tgtRest.get(TB[n]); TB[n].quaternion.copy(r.q); TB[n].position.copy(r.p); }
    tgt.scene.updateMatrixWorld(true);
    order.forEach((tn, i) => {
      const sn = inv.get(tn);
      const b = TB[tn];
      let q;
      if (sn && SB[sn] && match[tn]) {
        const want = SB[sn].getWorldQuaternion(new THREE.Quaternion()).multiply(match[tn]).multiply(tgtRest.get(b).wq);
        b.parent.updateMatrixWorld(true);
        const pq = b.parent.getWorldQuaternion(new THREE.Quaternion());
        b.quaternion.copy(pq.invert().multiply(want));
        b.updateMatrixWorld(true);
        q = b.quaternion.clone();
      } else q = tgtRest.get(b).q.clone();
      const prev = qs[i][qs[i].length - 1];
      if (prev && prev[0] * q.x + prev[1] * q.y + prev[2] * q.z + prev[3] * q.w < 0) q.set(-q.x, -q.y, -q.z, -q.w);
      qs[i].push([q.x, q.y, q.z, q.w]);
    });
    const p = pathPos[f];
    const u = f / (frames - 1);
    const mode = c.inplace || 'xz';
    const dd = p.clone().sub(hip0);
    if (mode === 'xz' || mode === 'xyz') { dd.x -= trend.x * u; dd.z -= trend.z * u; }
    if (mode === 'xyz') dd.y = p.y - mean.y - trend.y * (u - 0.5) + (c.hipRise ?? 0) / scale; // (hips oscillate about the standing height; hipRise lifts or drops them)
    if (mode === 'still') { dd.x = 0; dd.z = 0; }
    dd.multiplyScalar(scale);
    const pw = tHip0.clone().add(dd);
    TB.spine.parent.worldToLocal(pw);
    hip.push([pw.x, pw.y, pw.z]);
  }
  // `despike` [bones]: a joint's few frames the capture got wrong, the pose leaping away and back (a wrist flipped 100 degrees in a frame and
  // back; a chest wrung round and straight back while the hips spin) put back on the straight way between the frames either side: up
  // to 8 frames whose path is over 90 degrees and three times the straight way, and the straight way under 40 (casebook rule 19, "mask
  // a bone the capture got wrong", here only the frames it got wrong). Longest first, so a run of them is taken whole. Named bones
  // only: a snap kick's knee is away and back in four frames too, and is the move
  if (c.despike) {
    const ang = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3])));
    const mid = (a, b, u) => { const A = new THREE.Quaternion().fromArray(a), B = new THREE.Quaternion().fromArray(b); A.slerp(B, u); return [A.x, A.y, A.z, A.w]; };
    const D = Math.PI / 180;
    for (const [i, Q] of qs.entries()) if (c.despike.includes(order[i])) for (let w = 8; w >= 1; w--) for (let f = 1; f + w < Q.length; f++) {
      const a = Q[f - 1], z = Q[f + w];
      let path = 0; for (let k = f; k <= f + w; k++) path += ang(Q[k - 1], Q[k]);
      const across = ang(a, z);
      if (path > 90 * D && path > 3 * across && across < 40 * D) for (let k = 0; k < w; k++) Q[f + k] = mid(a, z, (k + 1) / (w + 1));
    }
  }
  // `exaggerate` [k, bones regex]: each matched joint's swing from its own average over the window pushed k times (ART.md 9, "captured
  // motion, pushed": the stances' way, courier/anim/stances.js exaggerate; the support leg left out, so a planted foot stays planted)
  if (c.exaggerate) {
    const [k, only] = c.exaggerate, re = new RegExp(only), m = new THREE.Quaternion(), dq = new THREE.Quaternion(), ax = new THREE.Vector3(), q = new THREE.Quaternion();
    order.forEach((tn, i) => {
      if (!re.test(tn)) return;
      const Q = qs[i]; let x = 0, y = 0, z = 0, w = 0;
      for (const v of Q) { const s = v[0] * Q[0][0] + v[1] * Q[0][1] + v[2] * Q[0][2] + v[3] * Q[0][3] < 0 ? -1 : 1; x += v[0] * s; y += v[1] * s; z += v[2] * s; w += v[3] * s; }
      m.set(x, y, z, w).normalize();
      for (const v of Q) {
        q.fromArray(v); dq.copy(m).invert().multiply(q);
        if (dq.w < 0) dq.set(-dq.x, -dq.y, -dq.z, -dq.w);
        const a = 2 * Math.acos(Math.min(1, dq.w)), s = Math.sqrt(1 - dq.w * dq.w);
        if (a < 1e-5 || s < 1e-6) continue;
        ax.set(dq.x / s, dq.y / s, dq.z / s); dq.setFromAxisAngle(ax, a * k);
        q.copy(m).multiply(dq); v[0] = q.x; v[1] = q.y; v[2] = q.z; v[3] = q.w;
      }
    });
  }
  // `fist` 'L' | 'R' | 'LR': the capture has no fingers (they stand at the rest pose, open): that hand's fingers closed as UAL's jab
  // closes them (anims.bin punchJab, its middle frame), a punch thrown with a fist
  for (const side of c.fist || '') {
    const fc = packHeader.clips.find((x) => x.name === 'punchJab'), base = 4 + hl;
    order.forEach((tn, i) => {
      if (!new RegExp(`^(f_|thumb).*${side}$`).test(tn)) return;
      const tk = fc.tracks.find((x) => x.k === 'q' && packHeader.bones[x.b] === tn); if (!tk) return;
      const f = tk.n > 1 ? Math.floor(tk.n / 2) : 0, o = base + (tk.o + f * 4) * 2;
      const v = [0, 1, 2, 3].map((j) => bin.readInt16LE(o + j * 2) / 32767), l = Math.hypot(...v);
      qs[i] = qs[i].map(() => v.map((x) => x / l));
    });
  }
  // `straight` [lower bones]: a knee or an elbow the capture (or the retarget onto the Courier's proportions) bends back past straight is
  // turned back to straight about its hinge (the lower bone's rest X: courier/anim/hinges.js), its twist and the end bone kept; the hinge
  // repair at decode squares a limb off its hinge, but never one bent back (the pose audit: a heel kick's knee 64 degrees back)
  for (const tn of c.straight || []) {
    const i = order.indexOf(tn); if (i < 0) continue;
    const rL = tgtRest.get(TB[tn]).q, hx = new THREE.Vector3(1, 0, 0).applyQuaternion(rL), d0 = new THREE.Vector3(0, 1, 0).applyQuaternion(rL);
    const q = new THREE.Quaternion(), d = new THREE.Vector3(), a0 = new THREE.Vector3(), a1 = new THREE.Vector3(), turn = new THREE.Quaternion();
    let fixed = 0, lo = 9, hi = -9;
    qs[i] = qs[i].map((v) => {
      q.fromArray(v); d.set(0, 1, 0).applyQuaternion(q);
      a0.copy(d0).addScaledVector(hx, -d0.dot(hx)).normalize(); a1.copy(d).addScaledVector(hx, -d.dot(hx)).normalize();
      const bend = Math.atan2(hx.dot(a0.clone().cross(a1)), a0.dot(a1)); // (+: flexion, about the rest X)
      lo = Math.min(lo, bend); hi = Math.max(hi, bend);
      if (bend >= 0) return v;
      fixed++;
      turn.setFromAxisAngle(hx, -bend); q.premultiply(turn);
      return [q.x, q.y, q.z, q.w];
    });
    console.log(`   ${c.name} ${tn}: bent ${(lo * 57.3).toFixed(0)}..${(hi * 57.3).toFixed(0)} degrees, ${fixed} frames bent back put straight`);
  }
  // `mask` [bones]: held at the rest pose (casebook rule 19: the capture's popping toes)
  for (const tn of c.mask || []) { const i = order.indexOf(tn), r = tgtRest.get(TB[tn]).q; if (i >= 0) qs[i] = qs[i].map(() => [r.x, r.y, r.z, r.w]); }
  // loop closing: the last `xf` seconds ease into the first frame, so the seam disappears
  if (c.loop) {
    const n = Math.max(1, Math.round((c.xf ?? 0.25) * FPS));
    for (let k = 0; k < n; k++) {
      const f = frames - n + k, w = (k + 1) / n;
      for (let i = 0; i < order.length; i++) {
        const a = qs[i][f], b = qs[i][0];
        const sg = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3] < 0 ? -1 : 1;
        const x = a[0] + (b[0] * sg - a[0]) * w, y = a[1] + (b[1] * sg - a[1]) * w, z = a[2] + (b[2] * sg - a[2]) * w, ww = a[3] + (b[3] * sg - a[3]) * w;
        const l = Math.hypot(x, y, z, ww) || 1;
        qs[i][f] = [x / l, y / l, z / l, ww / l];
      }
      const hb = hip[0], ha = hip[f];
      hip[f] = [ha[0] + (hb[0] - ha[0]) * w, ha[1] + (hb[1] - ha[1]) * w, ha[2] + (hb[2] - ha[2]) * w];
    }
  }
  const outFrames = frames;
  const entry = { name: c.name, src: c.file, dur: (outFrames - 1) / FPS, frames: outFrames, tracks: [] };
  const push = (bi, kind, arr, k) => {
    const flat = arr.every((v) => v.every((x, j) => Math.abs(x - arr[0][j]) < 1e-4));
    const n = flat ? 1 : arr.length;
    entry.tracks.push({ b: bi, k: kind, o: data.length, n });
    for (let f = 0; f < n; f++) for (const x of arr[f]) data.push(k(x));
  };
  order.forEach((tn, i) => push(i, 'q', qs[i], q16));
  push(order.indexOf('spine'), 'p', hip, (x) => Math.max(-32767, Math.min(32767, Math.round(x * P))));
  header.clips.push(entry);
  console.log(`${c.name.padEnd(14)} ${c.file} ${t0.toFixed(2)}-${t1.toFixed(2)}s ${frames}f  scale ${scale.toFixed(3)}  travel ${trend.toArray().map((v) => (v * scale).toFixed(2)).join(',')} m  yaw ${(yaw0 * 57.3).toFixed(0)}°`);
}
header.posScale = 1 / P;
const hj = Buffer.from(JSON.stringify(header));
const pad = (4 - ((4 + hj.length) % 4)) % 4;
const out = Buffer.alloc(4 + hj.length + pad + data.length * 2);
out.writeUInt32LE(hj.length + pad, 0);
hj.copy(out, 4);
out.fill(32, 4 + hj.length, 4 + hj.length + pad);
Buffer.from(new Int16Array(data).buffer).copy(out, 4 + hj.length + pad);
const dst = path.join(root, 'src/assets/anims_cmu.bin');
fs.writeFileSync(dst, out);
console.log(`wrote ${dst} ${(out.length / 1024).toFixed(0)} KB, ${header.clips.length} clips`);
