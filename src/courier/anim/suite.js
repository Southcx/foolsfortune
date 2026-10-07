// ---------------------------------------------------------------------------------------
// THE COURIER'S CLIPS: the game's clip pack, put together at boot from the Courier's own animation suite (the owner's, 2026-10-07:
// source_assets/Courier/courier_anims_*.glb, 386 clips baked by scripts/bake_suite.mjs) and the older packs (anims.bin: UAL retargeted;
// anims_cmu.bin: CMU mocap), on one bone order: the old 50 driven bones with spine005, the second neck bone, between spine004 and head.
//
//   FETCHED, NOT INLINED  the suite is 8 MB of clips; inlined as base64 it would take the bundle past the publish limit (16 MB a file)
//                         and keep the string in the heap for the session. Each pack is a plain .bin beside the bundle (`?url`),
//                         fetched once: CORE (move + skiff) and COMBAT (melee) before the Courier is built, SOCIAL (emotes, dances,
//                         flirts, taunts) after, unawaited (`pack.social` resolves when its clips are in `pack.clips`).
//   DECODED ON FIRST USE  a clip's frames become Float32 the first time anything reads its `q` or `p` (Clips.sample, a stance bake);
//                         until then it is a few numbers over the pack's int16 data. A session that never dances never decodes a dance.
//   ONE BONE ORDER        the old packs' clips are widened to the suite's order, spine005 held at its rest (as it always was).
//   SAME MOTIONS          SAME names the old clips the suite recalibrates (the same capture: lengths and hip curves equal, 5-15 degrees
//                         a bone, the neck and toes now moving); the game keeps playing them by their old names, and the old clip
//                         stays under `ual:<name>` for the workbench to compare.
//
// Prior art: the game's own decoder (anims.js) and pack layout (scripts/bake_anims.mjs); streaming animation sets by need, as
// Unreal's and Unity's addressable animation bundles do; lazy decompression of animation data on first sample (ACL's runtime).
//
//   const pack = await loadClips({ packs: [animsB64, cmuB64] })   -> { fps, bones, rest, clips, social: Promise }   (Clips(pack))
// ---------------------------------------------------------------------------------------
import { decodeAnims } from './anims.js';
import coreUrl from '../../assets/clips/core.bin?url';
import combatUrl from '../../assets/clips/combat.bin?url';
import socialUrl from '../../assets/clips/social.bin?url';

// the old name -> the suite clip that is the same capture (front-and-side sheets of both: docs/ref/suite_same.png)
export const SAME = {
  idle: 'Loco_IdleMasc', walk: 'Loco_WalkMasc', jog: 'Loco_RunMasc', sprint: 'Loco_Sprint', crouchIdle: 'Loco_CrouchIdle', crouchWalk: 'Loco_CrouchWalk',
  jumpStart: 'Air_JumpStart', jumpLoop: 'Air_JumpLoop', jumpLand: 'Air_JumpLand', roll: 'Loco_Roll',
  slideStart: 'Trav_SlideStart', slideLoop: 'Trav_SlideLoop', slideExit: 'Trav_SlideExit', climb: 'Trav_Mantle',
};

/** A pack's bytes -> { fps, bones, rest, clips } with each clip's frames decoded the first time they are read. */
export function readPack(buf) {
  const bin = new Uint8Array(buf), hl = new DataView(buf).getUint32(0, true);
  const H = JSON.parse(new TextDecoder().decode(bin.subarray(4, 4 + hl)));
  const data = new Int16Array(buf, 4 + hl, (bin.length - 4 - hl) >> 1), nb = H.bones.length, ps = H.posScale, clips = {};
  for (const c of H.clips) {
    const T = new Int32Array(c.tracks.length * 4); c.tracks.forEach((t, i) => T.set([t.b, t.k === 'q' ? 0 : 1, t.o, t.n], i * 4)); // (the header's track objects let go)
    clips[c.name] = lazy({ name: c.name, src: c.src, dur: c.dur, n: c.frames, loop: !!c.loop }, () => unpack(data, T, c.frames, nb, ps));
  }
  return { fps: H.fps, bones: H.bones, rest: H.rest, clips };
}

function unpack(data, T, n, nb, ps) {
  const q = new Float32Array(n * nb * 4), p = new Float32Array(n * 3);
  for (let i = 0; i < T.length; i += 4) {
    const b = T[i], isQ = T[i + 1] === 0, o = T[i + 2], tn = T[i + 3], w = isQ ? 4 : 3;
    for (let f = 0; f < n; f++) {
      const s = o + Math.min(f, tn - 1) * w;
      if (isQ) {
        const x = data[s], y = data[s + 1], z = data[s + 2], ww = data[s + 3], l = 1 / (Math.hypot(x, y, z, ww) || 1), d = (f * nb + b) * 4;
        q[d] = x * l; q[d + 1] = y * l; q[d + 2] = z * l; q[d + 3] = ww * l;
      } else { p[f * 3] = data[s] * ps; p[f * 3 + 1] = data[s + 1] * ps; p[f * 3 + 2] = data[s + 2] * ps; }
    }
  }
  return { q, p };
}

// a clip whose q and p are made when first read, then kept as plain fields
function lazy(c, make) {
  const fill = () => { const { q, p } = make(); Object.defineProperty(c, 'q', { value: q, writable: true, enumerable: true }); Object.defineProperty(c, 'p', { value: p, writable: true, enumerable: true }); };
  for (const k of ['q', 'p']) Object.defineProperty(c, k, { get() { fill(); return c[k]; }, set(v) { fill(); Object.defineProperty(c, k, { value: v, writable: true, enumerable: true }); }, enumerable: true, configurable: true });
  return c;
}

/** An old pack's clips (decodeAnims) on the suite's bone order: a bone the old pack lacks is held at its rest. */
export function widen(old, bones, rest) {
  const from = bones.map((b) => old.bones.indexOf(b)), nb = bones.length, ob = old.bones.length, out = {};
  for (const [name, c] of Object.entries(old.clips)) {
    const q = new Float32Array(c.n * nb * 4);
    for (let f = 0; f < c.n; f++) for (let b = 0; b < nb; b++) {
      const d = (f * nb + b) * 4;
      if (from[b] < 0) q.set(rest[b], d); else q.set(c.q.subarray((f * ob + from[b]) * 4, (f * ob + from[b]) * 4 + 4), d);
    }
    out[name] = { ...c, q };
  }
  return out;
}

const fetchPack = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error(`clips: ${url} ${r.status}`); return r.arrayBuffer(); }).then(readPack);

/** The game's clip pack: the suite's core and combat clips, the old packs widened, the same motions renamed; social to follow. */
export async function loadClips({ packs = [] } = {}) {
  const [core, combat] = await Promise.all([fetchPack(coreUrl), fetchPack(combatUrl)]);
  const pack = { fps: core.fps, bones: core.bones, rest: core.rest, clips: {} };
  for (const b64 of packs) Object.assign(pack.clips, widen(decodeAnims(b64), pack.bones, pack.rest));
  for (const [old, now] of Object.entries(SAME)) if (pack.clips[old] && core.clips[now]) pack.clips[`ual:${old}`] = pack.clips[old];
  Object.assign(pack.clips, core.clips, combat.clips);
  for (const [old, now] of Object.entries(SAME)) if (core.clips[now]) pack.clips[old] = { ...core.clips[now], name: old };
  pack.social = fetchPack(socialUrl).then((s) => { Object.assign(pack.clips, s.clips); return true; }, (e) => { console.warn(e); return false; });
  return pack;
}
