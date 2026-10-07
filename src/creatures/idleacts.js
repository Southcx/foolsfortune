// ---------------------------------------------------------------------------------------
// THE IDLE ACTS: what a clapperjar does with itself when nothing is happening, so that it is not forever running somewhere. Each is a
// few seconds of one small, slow thing, laid over the idle clip on the same bones the other layers use, eased in and out: it breathes,
// looks about, yawns, scratches its side, hums and sways, sits down, gazes up at the sky, polishes its lid, shuffles round to face a
// new way. Each jar has a TEMPER (0 lively, 1 calm): how often it stays rather than runs, and how slowly it does what it does.
// Prior art: Animal Crossing's villagers (most of their day is small idle business: a stretch, a yawn, a look round, humming), the
// idle breaks of character animation (an idle loop broken now and then by a one-off: Overwatch's and Street Fighter's idle variants),
// and The Sims' fidgets (chosen at random, weighted by personality).
//
//   actPose(c, dt) -> { squash, lid, look, armL, armR, foreR, rx, rz, hop, w }   startAct(game, c, name?)   (creatures/clappers.js lays it on)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stream } from '../core/rng.js';
const simRand = stream('creatures/idleacts'); // (the simulation's chance: core/rng.js, the same twice)

const ACTS = {
  breathe: { w: 3, dur: [4, 7] }, lookabout: { w: 3, dur: [4, 6] }, yawn: { w: 1.2, dur: [2.6, 3.4] }, scratch: { w: 1.5, dur: [2.5, 4] },
  hum: { w: 1.6, dur: [4, 7] }, sit: { w: 1.4, dur: [6, 11] }, gaze: { w: 1.2, dur: [3.5, 6] }, polish: { w: 1, dur: [2.5, 4] }, shuffle: { w: 1.2, dur: [2, 3] },
};
const ACT_W = Object.values(ACTS).reduce((a, x) => a + x.w, 0);
const ease = (x) => x * x * (3 - 2 * x);

/** The idle act's layer this frame: squash, lid, look, arms, a lean and a hop, all scaled by how far into the act it is. */
export function actPose(c, dt) {
  const O = { squash: 0, lid: 0, look: 0, armL: 0, armR: 0, foreR: 0, rx: 0, rz: 0, hop: 0, w: 0 };
  const on = c.state === 'idle' && c.act;
  if (on) c.actT += dt;
  const env = on ? ease(Math.min(1, c.actT / 0.7)) * ease(Math.min(1, Math.max(0, c.actDur - c.actT) / 0.7)) : 0;
  c.actW = THREE.MathUtils.damp(c.actW, env, 6, dt);
  if (!on && c.actW < 0.01) { c.act = null; return O; }
  const w = (O.w = c.actW), t = c.t * (1 - 0.35 * c.temper), p = Math.min(1, c.actT / Math.max(0.1, c.actDur)), s = c.actSeed;
  O.squash = 0.022 * Math.sin(t * 2.0 + s) * w; // (it always breathes)
  switch (c.act) {
    case 'breathe': O.lid = 0.07 * (0.5 + 0.5 * Math.sin(t * 2.0 + s)) * w; break;
    case 'lookabout': O.look = 0.95 * Math.sin(c.actT * 0.75 + s) * w; O.lid = 0.05 * w; break;
    case 'yawn': { const o = Math.sin(Math.PI * Math.min(1, p * 1.15)); O.lid = 0.95 * o * w; O.squash += 0.12 * o * w; O.armL = 0.9 * o * w; O.armR = -0.9 * o * w; O.rx = -0.08 * o * w; break; }
    case 'scratch': O.armR = -1.25 * w; O.foreR = (-0.6 + 0.4 * Math.sin(c.t * 9)) * w; O.look = 0.35 * w; O.rz = 0.05 * w; break;
    case 'hum': O.rz = 0.08 * Math.sin(t * 2.4 + s) * w; O.lid = 0.14 * Math.max(0, Math.sin(t * 4.8)) * w; O.squash += 0.02 * Math.sin(t * 4.8) * w; break;
    case 'sit': O.squash -= 0.17 * w; O.armL = -0.5 * w; O.armR = 0.5 * w; O.lid = 0.04 * w; break;
    case 'gaze': O.rx = -0.2 * w; O.lid = 0.22 * w; O.look = 0.2 * Math.sin(c.actT * 0.4 + s) * w; break;
    case 'polish': O.armR = -1.6 * w; O.foreR = (-0.4 + 0.5 * Math.sin(c.t * 6)) * w; O.armL = 0.35 * w; O.lid = 0.05 * Math.sin(c.t * 6) * w; break;
    case 'shuffle': c.heading += (c.actTurn * dt / Math.max(0.5, c.actDur)) * w; O.hop = 0.018 * Math.abs(Math.sin(c.t * 10)) * w; break;
  }
  return O;
}

/** Begin an idle act (a weighted pick, unless named): the jar stands still and does it for a few seconds. */
export function startAct(game, c, name = null) {
  if (!name) { let r = simRand() * ACT_W; for (const [k, A] of Object.entries(ACTS)) { r -= A.w; if (r <= 0) { name = k; break; } } }
  if (name === c.act && name !== 'breathe') name = 'breathe';
  const A = ACTS[name];
  c.state = 'idle'; c.act = name; c.actT = 0;
  c.actDur = (A.dur[0] + simRand() * (A.dur[1] - A.dur[0])) * (0.8 + 0.5 * c.temper);
  c.timer = c.actDur; c.actSeed = simRand() * 10; c.actTurn = (simRand() < 0.5 ? -1 : 1) * (0.5 + simRand() * 0.7);
  if (name === 'hum' && game.listenerDistance(c.pos) < 14) game.glyphs?.pop('note', c.pos.clone().setY(c.pos.y + 0.9), { color: 0xffe2b0, size: 0.32, life: 1.6, float: 0.5 });
}
