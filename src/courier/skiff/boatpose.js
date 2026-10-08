// ---------------------------------------------------------------------------------------
// THE BOAT'S POSE: the Solar Skiff's own clips (solarskiff.glb, from the owner's courier_solarskiff.blend: scripts/export_solarskiff.py).
// Each is the partner of the rider's clip of the same name (Skiff_Summon ... Skiff_Bail: authored together in the .blend, the same frames
// and timing as courier_anims_skiff.glb's), so they are sampled and blended here exactly as the rider's are (courier/anim/animator.js
// Clips.sample and blend, frame for frame; courier/skiff/rider.js ride and phase, weight for weight): what the body does on the deck, the
// deck does under it. The code's own word on the boat (the boom to leeward, the hoist from the sail's L, the belly, the pennant to the
// wind) is laid on after this, in boat.js.
//
// Every clip is read once into dense frames (30 a second, the first key at frame 0, as scripts/bake_suite.mjs reads the rider's), a
// channel only for what the clip moves: the export dropped every channel that never leaves its bone's rest, so a pose starts from the
// rest and the clip writes what it moves.
//
// Prior art: the game's own pose buffers (animator.js: a pose sampled per frame, blended by normalised lerp); paired prop animation
// played in lockstep with a character's (a board, a weapon, a door: Unreal's and Unity's synced animation layers).
//
//   const P = new BoatPose(gltf.animations, bones)   P.ride(rider, { t, speed, steer, L })   P.phase('Skiff_Recall', t)   P.write(pose)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const FPS = 30;
const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const KIND = { position: 0, quaternion: 1, scale: 2 };

/** One pose of the boat's bones: a position, a quaternion and a scale each. */
class BoatFrame {
  constructor(nb) { this.p = new Float32Array(nb * 3); this.q = new Float32Array(nb * 4); this.s = new Float32Array(nb * 3); }
  copy(o) { this.p.set(o.p); this.q.set(o.q); this.s.set(o.s); return this; }
}

export class BoatPose {
  /** clips: the glTF's AnimationClips; bones: the skeleton's bones (the order every pose keeps). */
  constructor(clips, bones) {
    this.bones = bones;
    this.nb = bones.length;
    this.index = Object.fromEntries(bones.map((b, i) => [b.name, i]));
    this.rest = new BoatFrame(this.nb);
    bones.forEach((b, i) => { b.position.toArray(this.rest.p, i * 3); b.quaternion.toArray(this.rest.q, i * 4); b.scale.toArray(this.rest.s, i * 3); });
    this.A = new BoatFrame(this.nb); this.B = new BoatFrame(this.nb);
    this.clips = {};
    for (const c of clips) this.clips[c.name] = this.read(c);
    // the hull's up in its parent's frame (the Ollie's lift is taken off along it, as the rider's is off the hips)
    const hull = this.index.hull, par = bones[hull]?.parent;
    this.hullUp = new THREE.Vector3(0, 1, 0);
    if (par) { par.updateWorldMatrix(true, false); this.hullUp.applyQuaternion(par.getWorldQuaternion(new THREE.Quaternion()).invert()); }
  }

  /** A clip into dense frames: { n, dur, ch: [{ b, k, w, n, v }] } (a channel of one key holds its pose). */
  read(clip) {
    let t0 = Infinity, t1 = 0;
    for (const t of clip.tracks) { t0 = Math.min(t0, t.times[0]); t1 = Math.max(t1, t.times[t.times.length - 1]); }
    const n = Math.round((t1 - t0) * FPS) + 1, ch = [];
    for (const t of clip.tracks) {
      const dot = t.name.lastIndexOf('.'), b = this.index[t.name.slice(0, dot)], k = KIND[t.name.slice(dot + 1)];
      if (b == null || k == null) continue;
      const w = k === 1 ? 4 : 3, m = t.times.length > 1 ? n : 1, v = new Float32Array(m * w), I = t.createInterpolant();
      for (let f = 0; f < m; f++) {
        const r = I.evaluate(t0 + f / FPS);
        for (let j = 0; j < w; j++) v[f * w + j] = r[j];
        if (k === 1 && f > 0) { // (one hemisphere, frame to frame)
          const o = (f - 1) * 4, d = v[o] * v[f * 4] + v[o + 1] * v[f * 4 + 1] + v[o + 2] * v[f * 4 + 2] + v[o + 3] * v[f * 4 + 3];
          if (d < 0) for (let j = 0; j < 4; j++) v[f * 4 + j] = -v[f * 4 + j];
        }
      }
      ch.push({ b, k, w, n: m, v });
    }
    return { n, dur: (n - 1) / FPS, ch };
  }

  /** Sample `name` at t (seconds) into `out`, from the rest: loops wrap, one-shots clamp (animator.js Clips.sample, frame for frame). */
  sample(name, t, out, loop = true) {
    out.copy(this.rest);
    const c = this.clips[name];
    if (!c) return out;
    let f;
    if (loop) { const d = c.dur || 1; f = (((t % d) + d) % d) * FPS; } else f = Math.min(Math.max(t, 0) * FPS, c.n - 1);
    let i0 = Math.floor(f);
    if (i0 >= c.n - 1) i0 = Math.max(0, c.n - 2);
    const a = Math.min(1, f - i0), i1 = Math.min(c.n - 1, i0 + 1);
    for (const h of c.ch) {
      const { v, w } = h, o0 = h.n > 1 ? i0 * w : 0, o1 = h.n > 1 ? i1 * w : 0;
      const dst = h.k === 0 ? out.p : h.k === 1 ? out.q : out.s, d = h.b * w;
      for (let j = 0; j < w; j++) dst[d + j] = v[o0 + j] + (v[o1 + j] - v[o0 + j]) * a;
      if (h.k === 1) { const l = 1 / (Math.hypot(dst[d], dst[d + 1], dst[d + 2], dst[d + 3]) || 1); for (let j = 0; j < 4; j++) dst[d + j] *= l; }
    }
    return out;
  }

  /** out = lerp(out, src, w), every bone (animator.js Clips.blend, and the positions and scales with it). */
  blend(out, src, w) {
    if (w <= 0) return out;
    const k = Math.min(1, w), o = out.q, s = src.q;
    for (let i = 0; i < o.length; i += 4) {
      let x = s[i], y = s[i + 1], z = s[i + 2], ww = s[i + 3];
      if (o[i] * x + o[i + 1] * y + o[i + 2] * z + o[i + 3] * ww < 0) { x = -x; y = -y; z = -z; ww = -ww; }
      const nx = o[i] + (x - o[i]) * k, ny = o[i + 1] + (y - o[i + 1]) * k, nz = o[i + 2] + (z - o[i + 2]) * k, nw = o[i + 3] + (ww - o[i + 3]) * k;
      const l = 1 / (Math.hypot(nx, ny, nz, nw) || 1);
      o[i] = nx * l; o[i + 1] = ny * l; o[i + 2] = nz * l; o[i + 3] = nw * l;
    }
    for (let i = 0; i < out.p.length; i++) { out.p[i] += (src.p[i] - out.p[i]) * k; out.s[i] += (src.s[i] - out.s[i]) * k; }
    return out;
  }

  /**
   * The ride, weight for weight as the rider's (rider.js ride: R is the Rider, read after it has posed the body this frame):
   * RideIdle to RideCruise by speed, the carve by R.turnW, the sail's work by R.unfurlW / R.furlW, the flare by R.boost, the Ollie by
   * R.ollieW with its lift taken off the hull (the hop's physics carries the boat, as it carries the body). s: { t, speed, steer, L }.
   */
  ride(R, s) {
    const A = this.A, B = this.B;
    this.sample('Skiff_RideIdle', s.t, A, true);
    this.blend(A, this.sample('Skiff_RideCruise', s.t, B, true), smooth(1.5, 14, s.speed));
    if (R.turnW > 0.01) this.blend(A, this.sample(s.steer > 0 ? 'Skiff_RideTurnR' : 'Skiff_RideTurnL', s.t, B, true), R.turnW);
    if (R.unfurlW > 0.01) this.blend(A, this.sample('Skiff_Unfurl', s.L * 0.96, B, false), R.unfurlW);
    if (R.furlW > 0.01) this.blend(A, this.sample('Skiff_Furl', (1 - s.L) * 0.96, B, false), R.furlW);
    if (R.boostW > 0.01) {
      const clip = R.boost === 'start' ? 'Skiff_BoostStart' : R.boost === 'loop' ? 'Skiff_BoostLoop' : 'Skiff_BoostEnd';
      this.blend(A, this.sample(clip, R.boost === 'none' ? 0.46 : R.boostT, B, R.boost === 'loop'), R.boostW);
    }
    if (R.ollieW > 0.01 && R.ot != null) {
      this.sample('Skiff_Ollie', R.ot, B, false);
      const lift = R.lift('Skiff_Ollie', R.ot), h = this.index.hull * 3, u = this.hullUp;
      B.p[h] -= u.x * lift; B.p[h + 1] -= u.y * lift; B.p[h + 2] -= u.z * lift;
      this.blend(A, B, R.ollieW);
    }
    return A;
  }

  /** A phase's clip over the whole boat (rider.js phase: Skiff_Summon, Mount, Dismount, Recall, Bail). */
  phase(clip, t) { return this.sample(clip, t, this.A, false); }

  /** A pose onto the bones. */
  write(pose = this.A) {
    const B = this.bones;
    for (let i = 0; i < this.nb; i++) {
      const b = B[i];
      b.position.fromArray(pose.p, i * 3); b.quaternion.fromArray(pose.q, i * 4); b.scale.fromArray(pose.s, i * 3);
    }
  }
}
