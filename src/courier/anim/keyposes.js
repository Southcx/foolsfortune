// ---------------------------------------------------------------------------------------
// KEY POSES AND HOLDS, PLAYED (South, 2026-10-31: "Strong key poses and holds are the answer!"; docs/plans/KEY-POSES.md 6, 7): a move
// written as a list of keys, each a still of an existing clip at a numbered frame, held a counted number of 60 Hz frames of game time and
// snapped into over a few. `KeyTrack` is a sibling of animator.js's `Track`: it writes a pose a layer blends into `base` at its weight,
// before applyPose, and everything after (the feet, the hands, the hinges, rom.js last) corrects whatever it wrote. Inside a hold the clip
// is sampled at the key's integer frame exactly (no lerp: the contact sheet's still is what plays); inside a snap the pose stood before is
// eased into the key with an ease-out (snap 0: a cut). Its clock is game dt in 60 Hz frames, never display frames, so the hitstop
// (tools/moveset.js impact slowing game time) holds a key for free. A key with `holdWhile` names a predicate (HOLDS) that stops the
// clock at the key's end while it says yes: a hold is data, never a flag. A key's `plant` is read by footIK through `plantFeet` (the soles
// held in the world while a key move owns the legs: character/feet.js), and its `active` is a readout only (gameplay reads the move's own
// data). The tables are Calissa's (`courier/anim/keys/<tool>.js`, `KEYS[move]`), registered with `registerKeys`; a table may give a
// `fill(move, keys)` to take its timing from elsewhere (the fighter's from platformfighter.js MOVES). A move with no keys plays as before.
//
// Prior art: limited animation (Guilty Gear Xrd, Arc System Works, GDC 2015: every frame a held drawing, the game at 60), Smash's attack
// as lead-in, strike and follow-through with its hitstop held (Sakurai), Spider-Verse on twos, the mudras' clip-frame-plus-offsets
// (godhand/mudras.js MUDRA_FRAMES).
//
//   registerKeys(tool, KEYS, fill?)   keysOf(tool, move) -> [key] | null   HOLDS[name] = (ctx) => bool
//   const k = new KeyTrack(clips)   k.play(keys, from?, ctx?)   k.update(dt)   k.sample(out) -> out | null   k.key  k.plant  k.active
//   k.done   k.frame (60 Hz frames in)   k.total   plantFeet(ch, plant, w)
// key: { pose, clip, frame, fix?: { bone: [x, y, z] }, hold, snap, plant?: 'L' | 'R' | 'LR', holdWhile?, active? }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The 60 Hz frame every hold and snap is counted in (game time). */
export const KEY_FPS = 60;

const TABLES = new Map();
/** A tool's table of keys (Calissa's, `courier/anim/keys/<tool>.js`); `fill(move, keys)` may return keys with their timing filled in. */
export function registerKeys(tool, KEYS, fill = null) { TABLES.set(tool, { KEYS, fill }); }

/** A move's keys, timing filled, or null: a move without keys plays as before. */
export function keysOf(tool, move) {
  const T = TABLES.get(tool), raw = T?.KEYS?.[move];
  if (!raw?.length) return null;
  const keys = T.fill ? T.fill(move, raw) : raw;
  return keys?.length ? keys : null;
}

/** The named predicates a key's `holdWhile` stops the clock with: (ctx) => bool, ctx the play's own. Added by whoever owns the state. */
export const HOLDS = {};

const _q = new THREE.Quaternion(), _qf = new THREE.Quaternion(), _e = new THREE.Euler();
const ease = (u) => 1 - (1 - u) * (1 - u); // (an ease-out: the snap lands fast and settles)

export class KeyTrack {
  constructor(clips) {
    this.c = clips; this.keys = null; this.f = 0; this.ctx = null;
    this.from = clips.pose(); this.cur = clips.pose(); this.hasFrom = false;
    this.i = 0; this.ks = 0; // (the key now, and the frame it began on)
  }

  /** Begin `keys`. `from`: the pose standing as it begins (the body's base): the first key's snap eases out of it (none: a cut). */
  play(keys, from = null, ctx = null) {
    this.keys = keys; this.f = 0; this.i = 0; this.ks = 0; this.ctx = ctx;
    this.hasFrom = !!from; if (from) this.from.copy(from);
    let t = 0; for (const k of keys) t += Math.max(0, k.hold | 0); this.total = t;
    return this;
  }
  stop() { this.keys = null; }

  get playing() { return !!this.keys; }
  get key() { return this.keys?.[this.i] || null; }
  get plant() { return this.key?.plant || null; }
  get active() { return !!this.key?.active; }
  get frame() { return this.f; }
  get done() { return !!this.keys && this.i >= this.keys.length - 1 && this.f >= this.ks + this.span(this.i) && !this.holding; }
  span(i) { return Math.max(0, this.keys[i].hold | 0); }

  /** dt: game seconds (the hitstop's slowed dt holds the key). */
  update(dt) {
    const K = this.keys; if (!K) return;
    this.f += dt * KEY_FPS;
    // (walk forward through the keys whose hold has run out; a key whose holdWhile says yes keeps the clock at its end)
    this.holding = false;
    for (;;) {
      const k = K[this.i], end = this.ks + this.span(this.i);
      if (this.f < end) break;
      const P = k.holdWhile && HOLDS[k.holdWhile];
      if (P && P(this.ctx)) { this.f = end; this.holding = true; break; }
      if (this.i >= K.length - 1) { this.f = end; break; }
      this.prevKeyPose(); this.ks = end; this.i++;
    }
  }

  /** The pose the key leaving stood in, kept as the next key's snap's start. */
  prevKeyPose() { this.from.copy(this.keyPose(this.keys[this.i], this.cur)); this.hasFrom = true; }

  /** A key's own still: its clip at its integer frame, its fix laid over. */
  keyPose(k, out) {
    const C = this.c, c = C.clips[k.clip];
    if (!c) return out;
    C.sample(k.clip, Math.min(c.n - 1, Math.max(0, k.frame | 0)) / C.fps, out, false);
    if (k.fix) for (const b in k.fix) {
      const i = C.index[b]; if (i === undefined) continue;
      const [x, y, z] = k.fix[b];
      _q.fromArray(out.q, i * 4).multiply(_qf.setFromEuler(_e.set(x, y, z))).toArray(out.q, i * 4);
    }
    return out;
  }

  /** The pose now into `out`: the key's still, or eased from the pose before over the key's snap. null when nothing plays. */
  sample(out) {
    const K = this.keys; if (!K) return null;
    const k = K[this.i];
    this.keyPose(k, out);
    const snap = Math.max(0, k.snap | 0), into = this.f - this.ks;
    if (snap > 0 && this.hasFrom && into < snap - 1) { // (a snap of n frames: its first frame already moves, its last is the key)
      this.cur.copy(out); out.copy(this.from);
      this.c.blend(out, this.cur, ease((Math.floor(Math.max(0, into)) + 1) / snap));
    }
    return out;
  }
}

/** A key move owning the legs says its planted soles to footIK this frame (`w`: its share of the legs). Read and cleared each frame. */
export function plantFeet(ch, plant, w = 1) {
  if (!plant || w <= 0) return;
  ch.st.keyPlant = { L: plant.includes('L') ? 1 : 0, R: plant.includes('R') ? 1 : 0, w: Math.min(1, w) };
}
