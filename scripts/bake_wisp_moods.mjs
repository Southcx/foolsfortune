// ---------------------------------------------------------------------------------------
// THE LANTERN WISP'S GALL CLIPS: two clips the suite lacked (docs/plans/GALL-AND-FURY.md section 10: "the one gap"), made from its own
// and written into src/assets/lantern_wisp.glb beside the eighteen, so every creature that wears the suite has Gall as it has the rest.
//
//   Mood_Gall      Gall's mood loop (the basic ring): a recoil. Mood_Scared played twice over (3.2 s, so it loops on itself), the body
//                  turned aside from what it faces and drawn back, the head turned further and dropped, and the flame low and guttering
//                  (flame_1's chain shrunk to about 0.6, dipping hard twice in a loop and catching again, leaning off the draught).
//   Emote_Shudder  Gall's emote (the intense ring's onset): Hit's flinch, small (a third of it) and three times over, each fainter, with
//                  a fast tremble through the chest and the head; over Idle, so it begins and ends where the idle is.
//
// Fury needs nothing new: its mood loop is the suite's Mood_Angry (WHEEL.md, GALL-AND-FURY.md 10). Nothing in the game plays the
// Wisp's suite yet (WHEEL.md: creatures/anim/suite.js is not built); the workbench (/lab, models, lantern_wisp) plays every clip.
//
// Prior art: additive layering of a clip's change from its own first frame (Unreal's and Unity's additive animation; the Courier's own
// recoils, courier/anim/layers.js `additive`); a mood made by offsetting a base loop (Spore's and The Sims' procedural mood layers);
// a guttering flame's flicker as a sum of a few incommensurate sines with sharp dips (the candle shaders of the sixth generation).
//
// Run from the repo root: `node scripts/bake_wisp_moods.mjs` (it refuses if the clips are already in the file: take the file from
// git first to bake them again). Constant channels are written as two keys, as the export wrote the suite's.
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import * as THREE from 'three';

const FILE = 'src/assets/lantern_wisp.glb';
const FPS = 30;
const buf = fs.readFileSync(FILE);
const jl = buf.readUInt32LE(12), J = JSON.parse(buf.subarray(20, 20 + jl).toString());
const binStart = 20 + jl + 8, binLen = buf.readUInt32LE(20 + jl);
let BIN = Buffer.from(buf.subarray(binStart, binStart + binLen));
if (J.animations.some((a) => a.name === 'Mood_Gall' || a.name === 'Emote_Shudder')) { console.log('already baked: Mood_Gall / Emote_Shudder are in the file'); process.exit(0); }

const W = { SCALAR: 1, VEC3: 3, VEC4: 4 };
const read = (i) => {
  const a = J.accessors[i], bv = J.bufferViews[a.bufferView], n = W[a.type];
  const off = (bv.byteOffset || 0) + (a.byteOffset || 0);
  return new Float32Array(BIN.buffer.slice(BIN.byteOffset + off, BIN.byteOffset + off + a.count * n * 4));
};
const node = (name) => J.nodes.findIndex((n) => n.name === name);
const clip = (name) => {
  const a = J.animations.find((x) => x.name === name);
  const ch = new Map();
  for (const c of a.channels) {
    const s = a.samplers[c.sampler];
    ch.set(`${c.target.node}.${c.target.path}`, { T: read(s.input), V: read(s.output), n: c.target.path === 'rotation' ? 4 : 3, step: s.interpolation === 'STEP' });
  }
  const dur = Math.max(...[...ch.values()].map((c) => c.T[c.T.length - 1]));
  return { name, ch, dur };
};
/** A channel's value at t (clamped to its keys; quaternions in one hemisphere, normalised). */
function at(c, t) {
  const { T, V, n } = c, out = new Array(n);
  if (t <= T[0] || T.length === 1) { for (let k = 0; k < n; k++) out[k] = V[k]; return out; }
  if (t >= T[T.length - 1]) { const o = (T.length - 1) * n; for (let k = 0; k < n; k++) out[k] = V[o + k]; return out; }
  let i = 0; while (T[i + 1] < t) i++;
  const u = c.step ? 0 : (t - T[i]) / (T[i + 1] - T[i]), a = i * n, b = (i + 1) * n;
  let sgn = 1;
  if (n === 4) { let d = 0; for (let k = 0; k < 4; k++) d += V[a + k] * V[b + k]; if (d < 0) sgn = -1; }
  for (let k = 0; k < n; k++) out[k] = V[a + k] + (sgn * V[b + k] - V[a + k]) * u;
  if (n === 4) { const l = Math.hypot(...out) || 1; for (let k = 0; k < 4; k++) out[k] /= l; }
  return out;
}
const restOf = (ni, path) => { const N = J.nodes[ni]; return path === 'rotation' ? (N.rotation || [0, 0, 0, 1]) : path === 'scale' ? (N.scale || [1, 1, 1]) : (N.translation || [0, 0, 0]); };
const sample = (C, ni, path, t) => { const c = C.ch.get(`${ni}.${path}`); return c ? at(c, t) : restOf(ni, path); };

const SCARED = clip('Mood_Scared'), HIT = clip('Hit'), IDLE = clip('Idle');
// every channel the suite writes (the export wrote all of them for every clip): the new clips write the same set
const CHANNELS = [...SCARED.ch.keys()].map((k) => { const d = k.lastIndexOf('.'); return { ni: +k.slice(0, d), path: k.slice(d + 1) }; });

// the rig: hips and everything up the spine to the head sit square with the world at rest (root -90 X, hips +90 X), Y up, +Z the way
// the Wisp faces; so a turn about the world's up is a turn about each of their own Y, and a nod about their own X (never in the hips'
// parent's frame: the root is turned -90 about X, where a turn about Y is a roll)
const Q = (x, y, z, w) => new THREE.Quaternion(x, y, z, w);
const qAxis = (x, y, z, a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(x, y, z).normalize(), a);
const qPost = (arr, off) => Q(...arr).multiply(off).toArray(); // (an offset in the bone's own frame)
const N = Object.fromEntries(['hips', 'spine', 'chest', 'neck', 'head', 'flame_1', 'flame_2', 'flame_3', 'eye_L', 'eye_R', 'lantern', 'upperarm_L', 'upperarm_R'].map((n) => [n, node(n)]));

// ---- Mood_Gall: the recoil
const GALL = { dur: 3.2, turn: 0.62, headTurn: 0.38, headDrop: 0.22, lean: -0.16, back: -0.05, flame: 0.6, gutter: 0.38, lanternAway: 0.35 };
/** The flame's height, 0..1 of its own, at loop time u (0..1): low, uneven, two hard gutters a loop and the catch after each. */
function flameAt(u) {
  const tau = Math.PI * 2;
  let k = GALL.flame + 0.05 * Math.sin(tau * 3 * u) + 0.035 * Math.sin(tau * 7 * u + 1.3) + 0.025 * Math.sin(tau * 11 * u + 0.4);
  for (const [c, w] of [[0.28, 0.07], [0.71, 0.05]]) { // (a gutter: down fast, back slower)
    let d = u - c; d -= Math.round(d);
    const dip = d < 0 ? Math.exp(-((d / (w * 0.5)) ** 2)) : Math.exp(-((d / w) ** 2));
    k -= (GALL.flame - GALL.gutter) * dip;
  }
  return k;
}
function gallFrame(ni, path, t) {
  const u = t / GALL.dur, tau = Math.PI * 2;
  let v = sample(SCARED, ni, path, t % SCARED.dur);
  const breathe = 0.5 + 0.5 * Math.sin(tau * u * 2); // (twice a loop: Scared's own beat, held off and drawn in again)
  if (path === 'rotation') {
    if (ni === N.hips) v = qPost(v, qAxis(0, 1, 0, GALL.turn * (0.9 + 0.1 * breathe)).multiply(qAxis(1, 0, 0, GALL.lean)));
    if (ni === N.chest) v = qPost(v, qAxis(0, 1, 0, 0.12).multiply(qAxis(1, 0, 0, -0.08 * breathe)));
    if (ni === N.head) v = qPost(v, qAxis(0, 1, 0, GALL.headTurn).multiply(qAxis(1, 0, 0, GALL.headDrop)).multiply(qAxis(0, 0, 1, -0.12)));
    if (ni === N.lantern) v = qPost(v, qAxis(0, 0, 1, GALL.lanternAway)); // (the lantern held off, as from a bad smell)
    if (ni === N.flame_2 || ni === N.flame_3) { // (the tips leaning off the draught and shivering)
      const s = ni === N.flame_2 ? 1 : 1.6;
      v = qPost(v, qAxis(0, 0, 1, s * (0.16 + 0.06 * Math.sin(tau * 9 * u + s))).multiply(qAxis(1, 0, 0, s * 0.05 * Math.sin(tau * 13 * u))));
    }
  }
  if (path === 'translation' && ni === N.hips) v = [v[0], v[1] - 0.025 * breathe, v[2] + GALL.back]; // (drawn back and down a little)
  if (path === 'scale' && ni === N.flame_1) { const k = flameAt(u); v = [v[0] * (0.75 + 0.25 * k), v[1] * k, v[2] * (0.75 + 0.25 * k)]; }
  if (path === 'scale' && (ni === N.eye_L || ni === N.eye_R)) v = [v[0], v[1] * 0.62, v[2]]; // (the eyes narrowed: distaste)
  return v;
}

// ---- Emote_Shudder: Hit, small and repeated, with a tremble
const SHUDDER = { dur: 1.1, at: [0, 0.3, 0.58], k: [0.36, 0.26, 0.17], flinch: 0.32, tremble: 0.035, hz: 14 };
const H0 = (ni, path) => sample(HIT, ni, path, 0);
function shudderFrame(ni, path, t) {
  let v = sample(IDLE, ni, path, t);
  for (let i = 0; i < SHUDDER.at.length; i++) {
    const s = t - SHUDDER.at[i];
    if (s < 0 || s > SHUDDER.flinch) continue;
    const k = SHUDDER.k[i] * Math.sin((Math.PI * s) / SHUDDER.flinch), h = sample(HIT, ni, path, Math.min(HIT.dur * 0.5, s * 1.1)), h0 = H0(ni, path);
    if (path === 'rotation') { const d = Q(...h0).invert().multiply(Q(...h)); v = qPost(v, new THREE.Quaternion().slerp(d, k)); }
    else if (path === 'translation') v = v.map((x, j) => x + (h[j] - h0[j]) * k);
    else v = v.map((x, j) => x * (1 + (h[j] / (h0[j] || 1) - 1) * k));
  }
  if (path === 'rotation' && (ni === N.chest || ni === N.head)) { // (the tremble: fast, small, dying away)
    const e = SHUDDER.tremble * Math.max(0, 1 - t / SHUDDER.dur) * (ni === N.head ? 1.3 : 1);
    v = qPost(v, qAxis(0, 0, 1, e * Math.sin(Math.PI * 2 * SHUDDER.hz * t)).multiply(qAxis(0, 1, 0, e * 0.6 * Math.sin(Math.PI * 2 * SHUDDER.hz * 1.37 * t + 0.8))));
  }
  return v;
}

// ---- write: a time accessor per clip, an output accessor per channel (two keys when it never moves)
const chunks = [];
let tail = BIN.length;
const pad4 = (n) => (n + 3) & ~3;
function addAccessor(arr, type, minmax = false) {
  const bytes = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength), off = pad4(tail);
  if (off > tail) chunks.push(Buffer.alloc(off - tail));
  chunks.push(bytes); tail = off + bytes.length;
  J.bufferViews.push({ buffer: 0, byteOffset: off, byteLength: bytes.length });
  const a = { bufferView: J.bufferViews.length - 1, componentType: 5126, count: arr.length / W[type], type };
  if (minmax) { a.min = [arr[0]]; a.max = [arr[arr.length - 1]]; }
  J.accessors.push(a);
  return J.accessors.length - 1;
}
function bake(name, dur, frame) {
  const n = Math.round(dur * FPS) + 1, times = Float32Array.from({ length: n }, (_, f) => f / FPS);
  const tAll = addAccessor(times, 'SCALAR', true), tTwo = addAccessor(Float32Array.of(0, dur), 'SCALAR', true);
  const anim = { name, channels: [], samplers: [] };
  let moving = 0;
  for (const { ni, path } of CHANNELS) {
    const w = path === 'rotation' ? 4 : 3, vals = new Float32Array(n * w);
    for (let f = 0; f < n; f++) {
      const v = frame(ni, path, times[f]);
      if (w === 4 && f > 0) { let d = 0; for (let k = 0; k < 4; k++) d += v[k] * vals[(f - 1) * 4 + k]; if (d < 0) for (let k = 0; k < 4; k++) v[k] = -v[k]; }
      vals.set(v, f * w);
    }
    let still = true;
    for (let f = 1; f < n && still; f++) for (let k = 0; k < w; k++) if (Math.abs(vals[f * w + k] - vals[k]) > 1e-5) { still = false; break; }
    const out = still ? addAccessor(Float32Array.from([...vals.subarray(0, w), ...vals.subarray(0, w)]), w === 4 ? 'VEC4' : 'VEC3') : addAccessor(vals, w === 4 ? 'VEC4' : 'VEC3');
    if (!still) moving++;
    anim.samplers.push({ input: still ? tTwo : tAll, interpolation: 'LINEAR', output: out });
    anim.channels.push({ sampler: anim.samplers.length - 1, target: { node: ni, path } });
  }
  J.animations.push(anim);
  console.log(`${name}: ${dur} s, ${n} frames, ${anim.channels.length} channels (${moving} moving)`);
}
bake('Mood_Gall', GALL.dur, gallFrame);
bake('Emote_Shudder', SHUDDER.dur, shudderFrame);
// keep the suite's order: alphabetical, as the export wrote it
J.animations.sort((a, b) => a.name.localeCompare(b.name));

BIN = Buffer.concat([BIN, ...chunks]);
const binPadded = Buffer.concat([BIN, Buffer.alloc(pad4(BIN.length) - BIN.length)]);
J.buffers[0].byteLength = binPadded.length;
let js = Buffer.from(JSON.stringify(J));
js = Buffer.concat([js, Buffer.alloc(pad4(js.length) - js.length, 0x20)]);
const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + binPadded.length, 8);
const jh = Buffer.alloc(8); jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
const bh = Buffer.alloc(8); bh.writeUInt32LE(binPadded.length, 0); bh.writeUInt32LE(0x004e4942, 4);
const before = buf.length;
fs.writeFileSync(FILE, Buffer.concat([head, jh, js, bh, binPadded]));
console.log(`${FILE}: ${before} -> ${fs.statSync(FILE).size} bytes`);
