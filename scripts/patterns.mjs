// ---------------------------------------------------------------------------------------
// THE PATTERN LIBRARY, CHECKED (docs/plans/RAIL-OVERHAUL.md section 7; RAIL-MODULES.md 1): every emitter of progress/rail/patterns.js
// laid out as the pattern player lays it (aimed down -z, up +y, about a nought origin), then turned onto a ship in each of the three
// views as the player turns it (`orient`, keeping the view's plane), and held to the fairness rules: a gap of three ship widths through
// every volley, half a real second to react, no spawn within 4 m, homers capped; and, since the owner's crossing bugs (2026-10-20,
// Calissa's measurements), an aimed volley heads at the ship (the cone's 20-degree lean), a plane view's shots stay in its plane (the
// side view's fans in depth), every shot on the sixteenth. One PASS/FAIL line a pattern and view. `node scripts/patterns.mjs`.
// ---------------------------------------------------------------------------------------
import { PATTERNS, emit, fair, frameOf, orient } from '../src/progress/rail/patterns.js';

let fails = 0, seed = 7; const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], plus = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** The three views, in the rail's frame: where the thrower stands, where the ship is, the plane's normal (world/emocean views.js). */
const VIEWS = {
  chase: { mode: 'cone', up: [0, 1, 0], from: [4, 6, 40], ship: [0, 4, 0], box: 7.5 }, // (the ship braked: ±7.7 m, Petra's depth box of v239)
  above: { mode: 'plane', up: [0, 1, 0], from: [6, 4, 26], ship: [0, 4, 0], box: 12 },
  side:  { mode: 'plane', up: [1, 0, 0], from: [0, 7, 24], ship: [0, 4, 0], box: 12 },
};
const LAYOUT = frameOf([0, 0, -1], [0, 1, 0]);
for (const name of Object.keys(PATTERNS)) for (const [view, V] of Object.entries(VIEWS)) {
  let aim = sub(V.ship, V.from); const d = aim[0] * V.up[0] + aim[1] * V.up[1] + aim[2] * V.up[2];
  if (V.mode === 'plane') aim = sub(aim, V.up.map((x) => x * d)); // (flattened onto the plane: a plane view's aim never leaves it)
  const range = Math.hypot(...aim), to = frameOf(aim, V.up);
  const laid = emit(name, {}, { origin: [0, 0, 0], aim: [0, 0, -1], mode: V.mode, rng, range });
  const shots = laid.map((s) => { const o = orient(s, LAYOUT, to); if (o.motion?.at) o.motion = { ...o.motion, at: plus(o.motion.at, V.from), to: plus(o.motion.to, V.from) }; return { ...o, pos: plus(o.pos, V.from), up: V.up }; });
  const ship = { pos: plus(V.from, aim), width: 1.2 };
  const r = fair(shots, ship, PATTERNS[name].defaults, V.box, V.mode, V.up, V.from);
  if (!r.ok) fails++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${name.padEnd(13)} ${view.padEnd(5)} shots ${String(shots.length).padStart(4)} ${JSON.stringify(r.worst)}${r.blind ? ' blind spot' : ''}`);
}
console.log(fails ? `patterns: ${fails} FAILED` : 'patterns: all passed'); process.exitCode = fails ? 1 : 0;
