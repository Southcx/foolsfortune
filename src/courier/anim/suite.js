// ---------------------------------------------------------------------------------------
// THE COURIER'S CLIPS: the game's clip pack, put together at boot from the Courier's own animation suite (the owner's, 2026-10-07:
// source_assets/Courier/courier_anims_*.glb, 386 clips baked by scripts/bake_suite.mjs) and the older packs (anims.bin: UAL retargeted;
// anims_cmu.bin: CMU mocap), on one bone order: the old 50 driven bones with spine005, the second neck bone, between spine004 and head.
//
//   FETCHED, NOT INLINED  the suite is 8 MB of clips; inlined as base64 it would take the bundle past the publish limit (16 MB a file)
//                         and keep the string in the heap for the session. Each pack is a plain .bin beside the bundle (`?url`),
//                         fetched once: CORE (every move, skiff and melee clip the code names: scripts/bake_suite.mjs) before the
//                         Courier is built, SOCIAL (the emotes, dances, flirts and taunts, and every clip nothing names yet) the first
//                         time anything asks (`pack.social`, a promise: it resolves when its clips are in `pack.clips`; a session that
//                         never emotes never fetches it).
//   DECODED ON FIRST USE  a clip's frames become Float32 the first time anything reads its `q` or `p` (Clips.sample, a stance bake);
//                         until then it is a few numbers over the pack's int16 data. A session that never dances never decodes a dance.
//   ONE BONE ORDER        the old packs' clips decode onto the suite's order, spine005 held at its rest (as it always was).
//   SAME MOTIONS          SAME names the old clips the suite recalibrates (the same capture: lengths and hip curves equal, 5-15 degrees
//                         a bone, the neck and toes now moving); the game keeps playing them by their old names (the two compared front
//                         and side: docs/ref/suite_same.png).
//   KNEES AND ELBOWS      a clip of the set being polished (hinges.js HINGED: the core movement's) has its knees and elbows put back
//                         on their hinge as it is decoded (hinges.js: the retarget turned no bone about its length, so they bent off it)
//
// Prior art: the game's own decoder (anims.js) and pack layout (scripts/bake_anims.mjs); streaming animation sets by need, as
// Unreal's and Unity's addressable animation bundles do; lazy decompression of animation data on first sample (ACL's runtime).
//
//   const pack = await loadClips({ packs: [animsB64, cmuB64] })   -> { fps, bones, rest, clips, social: Promise (asked: fetched) }   (Clips(pack))
// ---------------------------------------------------------------------------------------
import coreUrl from '../../assets/clips/core.bin?url';
import socialUrl from '../../assets/clips/social.bin?url';
import { HINGED, repairHinges } from './hinges.js';

// the old name -> the suite clip that is the same capture (front-and-side sheets of both: docs/ref/suite_same.png)
export const SAME = {
  idle: 'Loco_IdleMasc', walk: 'Loco_WalkMasc', jog: 'Loco_RunMasc', sprint: 'Loco_Sprint', crouchIdle: 'Loco_CrouchIdle', crouchWalk: 'Loco_CrouchWalk',
  jumpStart: 'Air_JumpStart', jumpLoop: 'Air_JumpLoop', jumpLand: 'Air_JumpLand', roll: 'Loco_Roll',
  slideStart: 'Trav_SlideStart', slideLoop: 'Trav_SlideLoop', slideExit: 'Trav_SlideExit', climb: 'Trav_Mantle',
};

/** A pack's bytes -> { fps, bones, rest, clips } with each clip's frames decoded the first time they are read. `to`: another bone order
 *  ({ bones, rest }) to decode onto: a bone the pack lacks is held at its rest (the old packs' spine005). */
export function readPack(buf, to = null) {
  const bin = new Uint8Array(buf), hl = new DataView(buf).getUint32(0, true);
  const H = JSON.parse(new TextDecoder().decode(bin.subarray(4, 4 + hl)));
  const data = new Int16Array(buf, 4 + hl, (bin.length - 4 - hl) >> 1), bones = to?.bones || H.bones, nb = bones.length, ps = H.posScale, clips = {};
  const map = H.bones.map((b) => bones.indexOf(b)), missing = bones.map((b, i) => (H.bones.includes(b) ? -1 : i)).filter((i) => i >= 0);
  for (const c of H.clips) {
    const T = new Int32Array(c.tracks.length * 4); c.tracks.forEach((t, i) => T.set([t.k === 'q' ? map[t.b] : t.b, t.k === 'q' ? 0 : 1, t.o, t.n], i * 4)); // (the header's track objects let go)
    clips[c.name] = lazy({ name: c.name, src: c.src, dur: c.dur, n: c.frames, loop: !!c.loop }, () => {
      const f = unpack(data, T, c.frames, nb, ps, missing, to?.rest), rest = H.rest || to?.rest;
      if (rest && HINGED(c.name)) repairHinges(f.q, c.frames, bones, rest, undefined, !!c.loop, H.fps); // (the knees and elbows back on their hinge: hinges.js)
      return f;
    });
  }
  return { fps: H.fps, bones, rest: H.rest || to?.rest, clips };
}

function unpack(data, T, n, nb, ps, missing = [], rest = null) {
  const q = new Float32Array(n * nb * 4), p = new Float32Array(n * 3);
  for (const b of missing) for (let f = 0; f < n; f++) q.set(rest[b], (f * nb + b) * 4); // (a bone the pack never drove: at rest, as it always was)
  for (let i = 0; i < T.length; i += 4) {
    const b = T[i], isQ = T[i + 1] === 0, o = T[i + 2], tn = T[i + 3], w = isQ ? 4 : 3;
    if (isQ && b < 0) continue;
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

const fetchPack = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error(`clips: ${url} ${r.status}`); return r.arrayBuffer(); }).then(readPack);

/** The game's clip pack: the suite's core clips, the old packs onto its bones, the same motions renamed; social when asked for. */
export async function loadClips({ packs = [] } = {}) {
  const core = await fetchPack(coreUrl);
  const pack = { fps: core.fps, bones: core.bones, rest: core.rest, clips: {} };
  for (const b64 of packs) Object.assign(pack.clips, readPack(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer, pack).clips); // (the old packs, decoded onto the suite's bones as each clip is first read)
  Object.assign(pack.clips, core.clips);
  for (const [old, now] of Object.entries(SAME)) if (core.clips[now]) pack.clips[old] = { ...core.clips[now], name: old };
  let social = null; // (fetched the first time anything asks for it: the first emote, not the boot)
  Object.defineProperty(pack, 'social', { get: () => (social ||= fetchPack(socialUrl).then((s) => { Object.assign(pack.clips, s.clips); return true; }, (e) => { console.warn(e); return false; })) });
  return pack;
}
