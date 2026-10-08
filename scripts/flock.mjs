// ---------------------------------------------------------------------------------------
// THE FLOCK, MEASURED (src/creatures/ai/flock.js; RAIL-OVERHAUL.md section 5: a shoal of 300 to 800 glints, a third of the flock
// stepped a frame). Real milliseconds a frame at each size, whole and staggered, and the flock's shape kept (it still schools: its
// members stay together and heading one way). One PASS/FAIL line a check. `node scripts/flock.mjs`
// ---------------------------------------------------------------------------------------
import * as THREE from 'three'; // (on purpose: the flock steers with three's vectors, as it does in the game)
import { Flock } from '../src/creatures/ai/flock.js';

let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
const lcg = (s = 1) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
const BUDGET = 2; // (real milliseconds a frame for the shoal at its largest: an eighth of a 60 Hz frame)
function make(n, stride) {
  const r = lcg(7), F = new Flock({ max: n, sep: [0.8, 1.6], align: [3, 1], coh: [4.5, 0.8], speed: 12, turn: 6, stride });
  for (let i = 0; i < n; i++) F.add((r() - 0.5) * 40, (r() - 0.5) * 10, (r() - 0.5) * 40, r() - 0.5, 0, 1);
  return F;
}
const GOAL = new THREE.Vector3(0, 0, 200), seek = (i, out) => { out.copy(GOAL); return 0.4; };
function measure(n, stride) {
  const F = make(n, stride);
  for (let k = 0; k < 60; k++) F.step(1 / 60, { seek });
  const t0 = performance.now(); for (let k = 0; k < 240; k++) F.step(1 / 60, { seek }); const ms = (performance.now() - t0) / 240;
  // its shape: the mean heading's length (1: all one way) and the spread about its middle
  let hx = 0, hy = 0, hz = 0, cx = 0, cy = 0, cz = 0, n2 = 0;
  for (let i = 0; i < F.max; i++) { if (!F.alive[i]) continue; const k = i * 3, l = Math.hypot(F.v[k], F.v[k + 1], F.v[k + 2]) || 1; hx += F.v[k] / l; hy += F.v[k + 1] / l; hz += F.v[k + 2] / l; cx += F.p[k]; cy += F.p[k + 1]; cz += F.p[k + 2]; n2++; }
  cx /= n2; cy /= n2; cz /= n2; let spread = 0;
  for (let i = 0; i < F.max; i++) { if (!F.alive[i]) continue; const k = i * 3; spread += Math.hypot(F.p[k] - cx, F.p[k + 1] - cy, F.p[k + 2] - cz); }
  return { ms: +ms.toFixed(3), heading: +(Math.hypot(hx, hy, hz) / n2).toFixed(2), spread: +(spread / n2).toFixed(1) };
}
for (const n of [100, 300, 800]) {
  const whole = measure(n, 1), third = measure(n, 3);
  console.log(`  ${n} glints: whole ${whole.ms} ms, a third a frame ${third.ms} ms; heading ${whole.heading} / ${third.heading}, spread ${whole.spread} / ${third.spread} m`);
  if (n === 800) {
    check('800 glints, a third stepped a frame, under the budget', third.ms <= BUDGET, `${third.ms} ms (budget ${BUDGET})`);
    check('staggered, the flock still schools as it does whole', third.heading > 0.8 && Math.abs(third.spread - whole.spread) < whole.spread * 0.5, { whole, third });
  }
}
console.log(fails ? `flock: ${fails} FAILED` : 'flock: all passed'); process.exitCode = fails ? 1 : 0;
