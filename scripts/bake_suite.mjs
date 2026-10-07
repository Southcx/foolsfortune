// Bake the Courier's own animation suite (source_assets/Courier/courier_anims_*.glb, the owner's, 2026-10-07: 440 clips authored on
// the Courier's skeleton) into the game's clip packs. No retarget: the suite's rest pose is the Courier's to the bit, so each frame's
// local bone rotation is exactly what Character.applyPose writes, and the hips' translation is already in the pack's space.
//
//   node scripts/bake_suite.mjs          -> src/assets/clips/{core,social}.bin   (bake again when code names a new clip)
//   node scripts/bake_suite.mjs --check  says whether core.bin holds every clip the code names, and fails if not (bakes nothing)
//
// The packs keep anims.bin's layout (scripts/bake_anims.mjs: uint32 header length, JSON header, int16 data; quaternions x32767, the
// pelvis x8192, a track of one frame is constant) with three additions the old decoder ignores:
//   bones   anims.bin's 50 driven bones with spine005 between spine004 and head (the second neck bone: animated in 418 of the 440
//           clips, up to 31 degrees)
//   rest    each bone's rest quaternion, so a clip baked without a bone (the old packs' spine005) can be widened to this order
//   loop    per clip: first and last frame agree (under 1 degree on every body joint, 1 cm at the hips), so it wraps seamlessly
// Timing: every channel's first key is at 1/30 s, not 0 (Blender's frame 1). The frames are the keys themselves: frame i is key i,
// dur = (keys - 1) / 30. Sampling from t = 0, as bake_anims.mjs does, would hold frame 0 twice and stall every loop two frames.
//
// What goes where (by need, src/courier/anim/suite.js): CORE, fetched at boot, holds every move, skiff and melee clip the game's code
// NAMES (a string in src/ that is the clip's name, or its prefix before a `${`: `Bell_Note${n}`); SOCIAL, fetched the first time anything
// asks, holds the emotes, dances, flirts and taunts and every clip nothing names yet (the workbench's to browse). A clip in the heap
// is a clip the game plays (the JS heap's budget, docs/ARCHITECTURE.md). Left out: the Vane_Rev* set (the Dreamvane's left-hand
// mirror, re-posed by hand so a runtime mirror would not reproduce it; the game holds the Vane right-handed) and the tools' IdleB..E
// fidgets (2-5 degrees from their idle), 51 clips, 1.2 MB.
//
// Prior art: the game's own bake_anims.mjs (the layout and the writer); the glTF 2.0 animation sampler (keys read as they are, LINEAR).
import fs from 'node:fs';
import path from 'node:path';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const SRC = path.join(root, 'source_assets/Courier');
const OUT = path.join(root, 'src/assets/clips');
const FPS = 30, P = 8192;

const old = fs.readFileSync(path.join(root, 'src/assets/anims.bin'));
const BONES = JSON.parse(old.subarray(4, 4 + old.readUInt32LE(0)).toString()).bones;
BONES.splice(BONES.indexOf('spine004') + 1, 0, 'spine005'); // (parent before child, as Character.mirrorPose's FK needs: spine004 > spine005 > head)
const BODY = BONES.filter((b) => !/^(f_|thumb)/.test(b));
const skip = (n) => /^Vane_Rev/.test(n) || /^(Sond|Brush|Vane|Bell|Lock|Tome|Gun)_Idle[B-E]$/.test(n);
const FILES = ['move', 'skiff', 'melee', 'emotes', 'social'];
// what the code names (a clip's name in a string; or its prefix before a template's `${`)
const named = new Set(), prefixes = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []));
for (const f of walk(path.join(root, 'src'))) for (const m of fs.readFileSync(f, 'utf8').matchAll(/['"`]((?:Loco|Air|Trav|Skiff|Sond|Fist|Brush|Vane|Bell|Lock|Tome|Gun)_[A-Za-z0-9]*)(\$\{)?/g)) (m[2] ? prefixes.push(m[1]) : named.add(m[1]));
const boot = (n) => named.has(n) || prefixes.some((p) => n.startsWith(p));
const PACKS = { core: (file, n) => file !== 'emotes' && file !== 'social' && boot(n), social: (file, n) => !(file !== 'emotes' && file !== 'social' && boot(n)) };

const load = (f) => new Promise((res, rej) => { const b = fs.readFileSync(f); new GLTFLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '', res, rej); });
const q16 = (x) => Math.max(-32767, Math.min(32767, Math.round(x * 32767)));
const p16 = (x) => Math.max(-32767, Math.min(32767, Math.round(x * P)));
if (process.argv.includes('--check')) {
  const bin = fs.readFileSync(path.join(OUT, 'core.bin')), have = new Set(JSON.parse(bin.subarray(4, 4 + bin.readUInt32LE(0))).clips.map((c) => c.name));
  const suite = [];
  for (const file of ['move', 'skiff', 'melee']) { const g = await load(path.join(SRC, `courier_anims_${file}.glb`)); for (const a of g.animations) if (!skip(a.name) && boot(a.name)) suite.push(a.name); }
  const missing = suite.filter((n) => !have.has(n));
  console.log(missing.length ? `core.bin is out of date: ${missing.length} clip(s) the code names are not in it: ${missing.join(', ')} (node scripts/bake_suite.mjs)` : `core.bin holds every clip the code names (${have.size})`);
  process.exit(missing.length ? 1 : 0);
}
fs.mkdirSync(OUT, { recursive: true });

for (const [pack, takes] of Object.entries(PACKS)) {
  const header = { fps: FPS, bones: BONES, rest: null, clips: [], posScale: 1 / P, src: 'source_assets/Courier' };
  const data = [];
  for (const file of FILES) {
    const gltf = await load(path.join(SRC, `courier_anims_${file}.glb`));
    const bone = {}; gltf.scene.traverse((n) => { if (n.isBone) bone[n.name] = n; });
    for (const b of BONES) if (!bone[b]) throw new Error(`${file}: no bone ${b}`);
    header.rest ??= BONES.map((b) => bone[b].quaternion.toArray().map((x) => +x.toFixed(6)));
    for (const clip of gltf.animations) {
      if (skip(clip.name) || !takes(file, clip.name)) continue;
      const tr = {}; for (const t of clip.tracks) tr[t.name] = t;
      let t0 = Infinity, t1 = 0; for (const t of clip.tracks) { t0 = Math.min(t0, t.times[0]); t1 = Math.max(t1, t.times[t.times.length - 1]); }
      const frames = Math.round((t1 - t0) * FPS) + 1;
      const at = (f) => t0 + f / FPS;
      const qs = BONES.map((b) => {
        const t = tr[`${b}.quaternion`], I = t?.createInterpolant(), out = [];
        for (let f = 0; f < frames; f++) {
          const v = I ? [...I.evaluate(at(f))] : bone[b].quaternion.toArray();
          const l = Math.hypot(...v) || 1; for (let k = 0; k < 4; k++) v[k] /= l;
          const prev = out[f - 1]; if (prev && prev[0] * v[0] + prev[1] * v[1] + prev[2] * v[2] + prev[3] * v[3] < 0) for (let k = 0; k < 4; k++) v[k] = -v[k]; // (one hemisphere, frame to frame)
          out.push(v);
        }
        return out;
      });
      const hp = tr['spine.position'], HI = hp?.createInterpolant();
      const hip = Array.from({ length: frames }, (_, f) => (HI ? [...HI.evaluate(at(f))] : bone.spine.position.toArray()));
      const ang = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3])));
      const loop = frames > 2 && BODY.every((b) => ang(qs[BONES.indexOf(b)][0], qs[BONES.indexOf(b)][frames - 1]) < 0.0175) && Math.hypot(...hip[0].map((x, k) => x - hip[frames - 1][k])) < 0.01;
      const c = { name: clip.name, src: file, dur: +((frames - 1) / FPS).toFixed(5), frames, loop, tracks: [] };
      const push = (b, k, arr, enc) => {
        const flat = arr.every((v) => v.every((x, j) => Math.abs(x - arr[0][j]) < 1e-4));
        const n = flat ? 1 : arr.length;
        c.tracks.push({ b, k, o: data.length, n });
        for (let f = 0; f < n; f++) for (const x of arr[f]) data.push(enc(x));
      };
      BONES.forEach((b, i) => push(i, 'q', qs[i], q16));
      push(0, 'p', hip, p16);
      header.clips.push(c);
    }
  }
  const hj = Buffer.from(JSON.stringify(header));
  const pad = (4 - ((4 + hj.length) % 4)) % 4;
  const out = Buffer.alloc(4 + hj.length + pad + data.length * 2);
  out.writeUInt32LE(hj.length + pad, 0); hj.copy(out, 4); out.fill(32, 4 + hj.length, 4 + hj.length + pad);
  Buffer.from(new Int16Array(data).buffer).copy(out, 4 + hj.length + pad);
  fs.writeFileSync(path.join(OUT, `${pack}.bin`), out);
  const loops = header.clips.filter((c) => c.loop).length;
  console.log(`${pack}.bin ${(out.length / 1048576).toFixed(2)} MB, ${header.clips.length} clips (${loops} loop), header ${(hj.length / 1024).toFixed(0)} KB`);
}
