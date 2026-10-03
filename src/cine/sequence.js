// ---------------------------------------------------------------------------------------
// SEQUENCES: a cinematic event as data. The camera's shots, the effects, the bars, the world's slow time, the room's dimming, the
// sounds, and the beats the game should hear, each on a timeline (cine/sequences.js), played by name against the things it is about:
//
//   const h = game.cine.play('lockheart.opening', { anchors: { courier: () => pos, coffin: () => coffinPos }, yaw, on: { land() {} } })
//   h.go('key', { tint })      a segment begins (the game says when: how many keys, when the wheel lands, are the game's)
//   h.stop()
//
// A sequence is SEGMENTS (`invoke`, `key`, `ascend`...), each a little timeline of its own, because the game decides when a beat
// comes and how often (a key per key, a spin per spin); the data decides what happens inside the beat. A segment's TRACKS:
//   camera   keys { t, pos, look, fov, roll, cut }: where the camera is and what it looks at, each as `{ at: anchor, off: [x, y, z] }`
//            in the anchor's own frame (x to its right, y up, z the way the sequence faces: `yaw`), so a sequence plays the same
//            wherever it happens; between keys the camera eases (a `cut` key jumps). Kept out of walls (shotclear.js)
//   fx       { t, fx, at, off, tint, power, hold, until }: an effect (vfx/library.js) at an anchor; `hold` keeps a held one for that
//            many seconds, `until: 'end'` until the sequence ends, `until: '<segment>'` until that segment begins, `until: 'segment'`
//            until this one ends, `follow` keeps it on its anchor as it moves
//   bars     { t, k }    the letterbox (cinema.js)          time   { t, scale }  the world's speed (1 normal, 0.05 nearly held)
//   mood     { t, dim, tint }  the room darkened (mood.js)   sound  { t, sfx, args }   cue  { t, cue }  the game's own beat, called back
// Times are in real seconds from the segment's start.
//
// Prior art: Unity's Timeline and Unreal's Sequencer (tracks of keys on one clock: camera cuts, animation, particles, events),
// Final Fantasy X's and Kingdom Hearts' scripted summons (a camera per beat, the beats driven by the battle), and the anchors of
// Source's choreographed scenes (a scene authored relative to its actors, played wherever they stand).
//
//   game.cine = new Cine(game)   .play(name, opts) -> handle   .update(rawDt)   .sequences (the data, editable live: the workbench)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SEQUENCES } from './sequences.js';
import { clearShot } from '../shotclear.js';
import { sfx } from '../audio.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3();
const smooth = (u) => u * u * (3 - 2 * u);
const UP = new THREE.Vector3(0, 1, 0);

/** A point `{ at, off }` in the world: the anchor's position, the offset in the sequence's frame (x right, y up, z forward). */
export function resolve(spec, anchors, yaw, out = new THREE.Vector3(), i = 0) {
  const A = anchors[spec?.at || 'origin'];
  const base = typeof A === 'function' ? A() : A;
  out.copy(base || out.set(0, 0, 0));
  const o = spec?.offs ? spec.offs[i % spec.offs.length] : spec?.off || [0, 0, 0]; // (offs: one per time the segment comes round: a cut per key)
  _f.set(Math.sin(yaw), 0, Math.cos(yaw)); _r.set(-Math.cos(yaw), 0, Math.sin(yaw));
  return out.addScaledVector(_r, o[0]).addScaledVector(UP, o[1]).addScaledVector(_f, o[2]);
}

/** The inverse: a world point as an offset from an anchor, in the sequence's frame (the workbench's "key this view"). */
export function offsetOf(p, anchorPos, yaw) {
  _f.set(Math.sin(yaw), 0, Math.cos(yaw)); _r.set(-Math.cos(yaw), 0, Math.sin(yaw));
  _a.subVectors(p, anchorPos);
  const r3 = (v) => Math.round(v * 100) / 100;
  return [r3(_a.dot(_r)), r3(_a.y), r3(_a.dot(_f))];
}

/** The camera at time t of a segment: { pos, look, fov, roll } (null if it has no camera track). */
export function cameraAt(seg, t, anchors, yaw, out = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0, roll: 0 }, i = 0) {
  const K = seg?.camera;
  if (!K?.length) return null;
  let j = 0;
  while (j < K.length - 1 && K[j + 1].t <= t) j++;
  const a = K[j], b = K[Math.min(K.length - 1, j + 1)];
  const span = Math.max(1e-4, b.t - a.t), u = b === a || b.cut ? 0 : THREE.MathUtils.clamp((t - a.t) / span, 0, 1), e = smooth(u);
  resolve(a.pos, anchors, yaw, out.pos, i); resolve(b.pos, anchors, yaw, _a, i); out.pos.lerp(_a, e);
  resolve(a.look, anchors, yaw, out.look, i); resolve(b.look, anchors, yaw, _b, i); out.look.lerp(_b, e);
  const pick = (v) => (Array.isArray(v) ? v[i % v.length] : v ?? 0);
  out.fov = pick(a.fov) + (pick(b.fov) - pick(a.fov)) * e;
  out.roll = pick(a.roll) + (pick(b.roll) - pick(a.roll)) * e;
  return out;
}

const STORE = 'ff.cine.overrides';
export const PRISTINE_SEQUENCES = JSON.parse(JSON.stringify(SEQUENCES));
/** Sequences edited in the workbench, kept in this browser: put back into the data at boot, so the world plays them too. */
export function applyCineOverrides() {
  try { const o = JSON.parse(localStorage.getItem(STORE) || '{}'); for (const [k, v] of Object.entries(o)) SEQUENCES[k] = v; } catch { /* none */ }
}
export const CINE_STORE = STORE;

export class Cine {
  constructor(game) {
    this.game = game;
    this.sequences = SEQUENCES;
    this.live = [];
  }

  play(name, { anchors = {}, yaw = 0, on = {}, start = null, id = null } = {}) {
    const def = this.sequences[name];
    const h = { name, def, anchors, yaw, on, seg: null, segName: null, t: 0, fired: new Set(), held: [], stopped: false, id: id || `cine:${name}`, ctx: {} };
    h.go = (seg, ctx = {}) => this.go(h, seg, ctx);
    h.fx = (name) => h.held.find((e) => e.k.fx === name)?.h || null; // (a held effect, to be steered by the game: its strength k)
    h.stop = () => this.stop(h);
    if (!def) return h;
    this.live.push(h);
    this.go(h, start || def.start || Object.keys(def.segments || {})[0]);
    return h;
  }

  go(h, segName, ctx = {}) {
    const seg = h.def?.segments?.[segName];
    h.segName = segName; h.seg = seg || null; h.t = 0; h.fired = new Set(); h.ctx = ctx;
    // (effects held "for this segment" end when it does, and those held "until" a segment end when it comes)
    const ends = (e) => e.until === 'segment' || e.until === segName;
    for (const e of h.held) if (ends(e)) e.h.stop?.();
    h.held = h.held.filter((e) => !ends(e));
  }

  stop(h) {
    if (h.stopped) return;
    h.stopped = true;
    const g = this.game;
    for (const e of h.held) e.h.stop?.();
    h.held = [];
    g.cinema?.unshot(h.id); g.cinema?.free(h.id); g.time?.free(h.id); g.mood?.free(h.id);
    this.live = this.live.filter((x) => x !== h);
  }

  update(raw) {
    for (const h of [...this.live]) this.step(h, raw);
  }

  step(h, raw) {
    const g = this.game, seg = h.seg;
    h.t += raw;
    if (!seg) return;
    const t = h.t;
    // one-shot keys, fired once as the clock passes them
    const once = (track, fn) => (seg[track] || []).forEach((k, i) => { const key = `${track}${i}`; if (t >= k.t && !h.fired.has(key)) { h.fired.add(key); fn(k); } });
    once('fx', (k) => {
      const pos = resolve(k, h.anchors, h.yaw, new THREE.Vector3(), h.ctx.i ?? 0);
      const fx = g.vfx?.play(k.fx, { pos, dir: _a.set(Math.sin(h.yaw), 0, Math.cos(h.yaw)), tint: k.tint === 'ctx' ? h.ctx.tint : k.tint ?? h.ctx.tint, power: k.power ?? h.ctx.power ?? 1 });
      if (fx && (k.hold || k.until || k.follow)) h.held.push({ h: fx, k, until: k.until || null, end: k.hold ? t + k.hold : Infinity });
    });
    once('bars', (k) => g.cinema?.frame(h.id, { bars: k.k ?? 1, ease: k.ease ?? 5 }));
    once('time', (k) => { if ((k.scale ?? 1) >= 0.999) g.time?.free(h.id); else g.time?.slow?.(h.id, k.scale); });
    once('mood', (k) => { if (k.dim === 0 || k.free) g.mood?.free(h.id); else g.mood?.set(h.id, { dim: k.dim ?? 0.7, tint: k.tint ?? 0x160a2e, tintK: k.tintK ?? 0.8, ease: k.ease ?? 5 }); });
    once('sound', (k) => sfx[k.sfx]?.(...(k.args || [])));
    once('cue', (k) => h.on[k.cue]?.(h, k));
    // held effects: follow their anchors, end when their time is up
    for (const e of h.held) {
      if (e.k.follow) resolve(e.k, h.anchors, h.yaw, e.h.pos);
      if (t >= e.end && e.until !== 'end') e.h.stop?.();
    }
    h.held = h.held.filter((e) => !(t >= e.end && e.until !== 'end'));
    // the camera
    const cam = cameraAt(seg, t, h.anchors, h.yaw, h.cam ||= { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0, roll: 0 }, h.ctx.i ?? 0);
    if (cam) {
      const target = resolve(seg.clearFrom || { at: 'courier', off: [0, 1.2, 0] }, h.anchors, h.yaw, _b);
      const pos = h.def.clear === false ? cam.pos : clearShot(g, target, cam.pos, _a.copy(cam.pos));
      g.cinema?.shot(h.id, { pos, look: cam.look, fov: cam.fov, roll: cam.roll, bars: seg.bars ?? h.def.bars ?? 1, ease: seg.ease ?? 30 });
    } else g.cinema?.unshot(h.id); // (a segment with no camera gives the camera back)
  }
}
