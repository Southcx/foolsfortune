// ---------------------------------------------------------------------------------------
// THE MIMICRY PUZZLES' CHECK (progress/mimicry.js; docs/plans/MIMICRY.md): every puzzle played headless on its own field.
// - The target stands far enough from the start to be a puzzle.
// - The System's own steps, replayed, solve it with three stars.
// - Doing nothing does not solve it.
// - A hand's copy, every step half a metre off (0.35 m each way) and its height 15% short, still solves it (the block compare forgives a hand).
// - Half the steps do not solve it (for a puzzle of two steps or more).
// One PASS/FAIL line a check; exit 1 on a FAIL.
//
//   node scripts/mimicry.mjs
// ---------------------------------------------------------------------------------------
import { MIMIC_PUZZLES, MIMIC_LADDER, framesOf, newPatch, lay, settle, snap, matchOf, gradeOf, dayPuzzle, MIMIC, restore } from '../src/progress/mimicry.js';

let fails = 0;
const line = (ok, s) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${s}`); };
const off = (p, d) => p && [p[0] + d, p[1] - d];
const sloppy = (s) => ({ ...s, at: off(s.at, 0.35), a: off(s.a, 0.35), b: off(s.b, 0.35), from: off(s.from, 0.35), to: off(s.to, 0.35), dh: s.dh != null ? s.dh * 0.85 : s.dh, vol: s.vol != null ? s.vol * 0.9 : s.vol });

function play(P, steps) {
  const F = newPatch(), fr = framesOf(P);
  if (P.mode === 'undo') { lay(F, P.setup); lay(F, P.steps); } else lay(F, P.setup);
  settle(F); restore(F, { x: 0, z: 0 }, fr.start); // (the start exactly as the frames have it)
  const r = lay(F, steps); settle(F);
  return { m: matchOf(snap(F), fr.target, fr.start), made: r.made };
}

const all = [...Object.values(MIMIC_PUZZLES), dayPuzzle(7), dayPuzzle(8)];
for (const P of all) {
  const fr = framesOf(P);
  let change = 0; for (let o = 0; o < fr.target.firm.length; o++) change += Math.abs(fr.target.firm[o] - fr.start.firm[o]) + Math.abs(fr.target.loose[o] - fr.start.loose[o]) + 0.5 * Math.abs(fr.target.w[o] - fr.start.w[o]);
  change *= MIMIC.cell * MIMIC.cell;
  line(change > MIMIC.floor, `${P.id}: the target stands ${change.toFixed(1)} m³ from the start (over ${MIMIC.floor})`);
  if (P.mode === 'undo') { // (the inverse is the player's to find: undoing each step is not a step the field has, so only nothing and the bed are checked)
    const z = matchOf(fr.start, fr.target, fr.start); line(z < MIMIC.solve, `${P.id}: doing nothing scores ${z.toFixed(2)} (under ${MIMIC.solve})`);
    continue;
  }
  const own = play(P, P.steps), g = gradeOf({ match: own.m, strokes: P.steps.length, par: P.par, made: own.made, allow: fr.made });
  line(g.stars === 3, `${P.id} (${P.mode}, ${P.powers.join(' ')}): the System's steps score ${own.m.toFixed(3)}, ${g.stars} stars, ${own.made.toFixed(2)} m³ made`);
  const none = matchOf(fr.start, fr.target, fr.start);
  line(none < MIMIC.solve, `${P.id}: doing nothing scores ${none.toFixed(2)} (under ${MIMIC.solve})`);
  const hand = play(P, P.steps.map(sloppy));
  line(hand.m >= MIMIC.solve, `${P.id}: a hand's copy (0.5 m off, 15% short) scores ${hand.m.toFixed(2)} (at least ${MIMIC.solve})`);
  if (P.steps.length >= 2) { const half = play(P, P.steps.slice(0, Math.floor(P.steps.length / 2))); line(half.m < MIMIC.solve, `${P.id}: half its steps score ${half.m.toFixed(2)} (under ${MIMIC.solve})`); }
}
line(MIMIC_LADDER.every((id) => MIMIC_PUZZLES[id]) && Object.keys(MIMIC_PUZZLES).every((id) => MIMIC_LADDER.includes(id)), 'the ladder holds every puzzle once');
console.log(fails ? `mimicry: ${fails} FAILED` : 'mimicry: all PASS');
process.exit(fails ? 1 : 0);
