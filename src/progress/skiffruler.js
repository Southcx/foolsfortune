// ---------------------------------------------------------------------------------------
// THE SKIFF'S RULER (docs/plans/SKIFF-TUNING.md 2.3, T3): a reference lap of a Raceway track by a point mass on its line, so a build has
// one number, the Performance Index, and a track has reference times its medals can be set from. It is not the game's physics: it is a
// ruler, as `scripts/economy.mjs` is for cubes. It reads the board's own numbers (T.tech.skiff, the carve's), the line's curvature, its
// slopes and its wind, and a multiplier for each of the board's keys (the parts and the sheet, through `mult(key)`).
//
// The model, kept small on purpose (a racer who carves every bend and never flares):
//   - a bend's speed is capped where the board's turn rate, carving, meets the line's curvature (v x kappa = omega(v));
//   - on a straight it chases the sail's speed (cruise x the wind's polar x top) at its acceleration, and coasts down above it;
//   - a slope adds gravity along the line (x slopeGain); a bend bleeds speed by its slip (v x omega^2 / grip);
//   - a bend carved long enough loads a tier, and its exit pays the carve's push (tiers, add, dur);
//   - mass divides acceleration and the coast's loss by mass^MASS.exp (a heavy board winds up slowly and keeps its way: T1's "mass made
//     real", measured here first);
//   - a forward pass, a backward pass for the braking (S on the sand at half its force, and the coast);
//   - two rulers: a FLYING lap (a lap to get up to speed, the second timed: the hot lap's), and a RACE (three laps from a standing
//     start, knocked down to `RACE_REF.keep` of its speed `RACE_REF.perKm` times a kilometre: the bumps, the hard landings and the
//     wobbles of a field). The first prices top speed alone; the second gives acceleration its due. The PI is the race's.
//
// Prior art: the point-mass lap-time simulation of motorsport engineering (a speed trace bounded by the cornering limit, a forward pass
// for traction, a backward pass for braking: the "quasi-steady-state" lap sim); Forza's Performance Index, read off it.
//
//   refLap(T, mult?, { race }) -> { seconds, trace: Float32Array(speed), length }   MASS = { exp }   RACE_REF   CARVE_REF
// ---------------------------------------------------------------------------------------
import { T as CFG } from '../core/config.js';

/** The carve's numbers as the board has them (courier/skiff/skiff.js CARVE: kept equal by hand, since skiff.js loads the scene). */
export const CARVE_REF = { min: 10, tiers: [0.48, 1.04, 1.76], add: [5, 8, 12], dur: [0.7, 1.0, 1.3], turn: 1.7, grip: 0.3 };
/** How strongly mass divides acceleration and the coast's loss (0: not at all; 1: as a real mass would). */
export const MASS = { exp: 0.25 };
/** The race ruler's knocks: how many a kilometre, and the share of its speed the board keeps through one. */
export const RACE_REF = { laps: 3, perKm: 3, keep: 0.55 };
const POLAR = [[-1, 0.28], [-0.6, 0.42], [-0.2, 0.7], [0.2, 0.92], [0.7, 1.0], [1, 1.0]]; // (skiff.js's, the sail's push by the wind's angle)
const polar = (c) => { for (let i = 1; i < POLAR.length; i++) if (c <= POLAR[i][0]) { const [a, b] = [POLAR[i - 1], POLAR[i]]; return a[1] + (b[1] - a[1]) * (c - a[0]) / (b[0] - a[0]); } return 1; };
const KAPPA_BEND = 0.004; // (a bend: the line turning faster than 1 rad in 250 m)

/** A lap of track `Tk` (world/raceway/track.js's output) by the reference rider on the board whose numbers are multiplied by `mult(key)`. */
export function refLap(Tk, mult = () => 1, { step = 2, race = false } = {}) {
  const c = CFG.tech.skiff, g = CFG.physics.gravity, m = (k) => mult(k) ?? 1, massK = Math.pow(m('mass'), MASS.exp);
  const n = Math.max(8, Math.floor(Tk.length / step)), ds = Tk.length / n;
  const H = new Float32Array(n), Y = new Float32Array(n), WF = new Float32Array(n), K = new Float32Array(n);
  for (let i = 0; i < n; i++) { const f = Tk.frame(i * ds); H[i] = Math.atan2(f.fx, f.fz); Y[i] = f.y; WF[i] = polar(Math.cos(f.wind || 0)); }
  for (let i = 0; i < n; i++) { let d = H[(i + 1) % n] - H[(i + n - 1) % n]; d = Math.atan2(Math.sin(d), Math.cos(d)); K[i] = Math.abs(d) / (2 * ds); }
  const omega = (v) => c.turn * m('turn') * (0.35 + 0.65 * Math.min(1, v / 7)) * (1 - 0.4 * Math.min(1, v / c.maxSpeed)) * CARVE_REF.turn;
  const vmax = new Float32Array(n);
  for (let i = 0; i < n; i++) { let lo = 0, hi = c.maxSpeed; if (hi * K[i] <= omega(hi)) { vmax[i] = hi; continue; } for (let j = 0; j < 30; j++) { const v = (lo + hi) / 2; if (v * K[i] <= omega(v)) lo = v; else hi = v; } vmax[i] = lo; }
  const grip = c.grip * m('grip') * (1 + CARVE_REF.grip) / 2; // (a carve slides out: half-way between its grip and the sand's)
  const v = new Float32Array(n);
  let speed = c.cruise * 0.6, carveT = 0, turbo = 0, turboAdd = 0;
  const knockEvery = race ? Math.max(1, Math.round(1000 / RACE_REF.perKm / ds)) : 0;
  const run = (timed) => {
    let time = 0;
    for (let i = 0; i < n; i++) {
      if (knockEvery && i % knockEvery === knockEvery >> 1) speed *= RACE_REF.keep; // (a knock: a bump, a hard landing, a wobble)
      const j = (i + 1) % n, top = c.cruise * WF[i] * m('top') + (turbo > 0 ? turboAdd : 0);
      let a = speed < top ? (turbo > 0 ? c.boostAccel : c.accel * m('accel')) / massK : -(c.coast + 0.012 * speed * speed) * m('coast') / massK;
      a -= g * c.slopeGain * ((Y[j] - Y[i]) / ds);
      const w = speed * K[i]; a -= (speed * w * w) / grip;
      let nv = Math.sqrt(Math.max(1, speed * speed + 2 * a * ds));
      if (speed < top && nv > top && a > 0) nv = Math.max(speed, top);
      const dt = ds / Math.max(1, (speed + nv) / 2);
      // the carve: loaded through a bend, paid at its exit
      if (K[i] > KAPPA_BEND && speed > CARVE_REF.min) carveT += dt * m('carveRate');
      else if (carveT > 0) { const tier = CARVE_REF.tiers.filter((t) => carveT >= t).length; if (tier) { turbo = CARVE_REF.dur[tier - 1]; turboAdd = CARVE_REF.add[tier - 1]; } carveT = 0; }
      turbo = Math.max(0, turbo - dt);
      speed = Math.min(nv, vmax[j], c.maxSpeed);
      v[j] = speed; if (timed) time += dt;
    }
    return time;
  };
  // the braking: back from each bend, the board can shed speed at half the sand's brake plus its coast
  for (let pass = 0; pass < 2; pass++) for (let i = n - 1; i >= 0; i--) { const j = (i + 1) % n, dec = c.brake * 0.5 + c.coast; vmax[i] = Math.min(vmax[i], Math.sqrt(vmax[j] * vmax[j] + 2 * dec * ds)); }
  let seconds = 0;
  if (race) { speed = 0; for (let l = 0; l < RACE_REF.laps; l++) seconds += run(true); } // (a standing start, three laps)
  else { run(false); seconds = run(true); } // (a lap to get up to speed: the second is flying)
  return { seconds, trace: v, length: Tk.length };
}
