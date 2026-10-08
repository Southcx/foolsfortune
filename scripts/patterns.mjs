// ---------------------------------------------------------------------------------------
// THE PATTERN LIBRARY, CHECKED (docs/plans/RAIL-OVERHAUL.md section 7): every emitter of progress/rail/patterns.js fired at a ship 30 m
// off, in the plane and in a cone, held to the fairness rules (a gap of three ship widths through every volley, half a real second to
// react, no spawn within 4 m, homers capped). One PASS/FAIL line a pattern, as the sweeps. `node scripts/patterns.mjs`.
// ---------------------------------------------------------------------------------------
import { PATTERNS, emit, fair } from '../src/progress/rail/patterns.js';

let fails = 0, seed = 7; const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const ship = { pos: [0, 0, 30], width: 1.2 };
for (const name of Object.keys(PATTERNS)) for (const mode of ['plane', 'cone']) {
  const shots = emit(name, {}, { origin: [0, 0, 0], aim: [0, 0, 1], mode, rng });
  const r = fair(shots, ship, PATTERNS[name].defaults, 12, mode);
  if (!r.ok) fails++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${name.padEnd(13)} ${mode.padEnd(5)} shots ${String(shots.length).padStart(4)} ${JSON.stringify(r.worst)}${r.blind ? ' blind spot' : ''}`);
}
console.log(fails ? `patterns: ${fails} FAILED` : 'patterns: all passed'); process.exitCode = fails ? 1 : 0;
