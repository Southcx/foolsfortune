// ---------------------------------------------------------------------------------------
// THE MIMICRY PUZZLES' CHECK (progress/mimicry.js; docs/plans/MIMICRY.md): every puzzle played headless on its own field.
// - The target stands far enough from the start to be a puzzle.
// - The System's own steps, replayed, solve it with three stars.
// - Doing nothing does not solve it.
// - A hand's copy, every step half a metre off (0.35 m each way) and its height 15% short, still solves it (the block compare forgives a hand).
// - Half the steps do not solve it (for a puzzle of two steps or more).
// The families (MIMICRY.md 7): a creation is played on a VoxelGrid and judged voxel to voxel, a herd on the flock's places; a herd's one
// drag from between its knots does not solve it; a veiled puzzle hides something, its seen steps alone do not solve it, and three reads
// across the patch lift its veil.
// One PASS/FAIL line a check; exit 1 on a FAIL.
//
//   node scripts/mimicry.mjs
// ---------------------------------------------------------------------------------------
import { MIMIC_PUZZLES, MIMIC_LADDER, framesOf, newPatch, lay, settle, snap, matchOf, gradeOf, dayPuzzle, MIMIC, restore, scoreOf, unveil } from '../src/progress/mimicry.js';
import { layHerd } from '../src/progress/mimicryherd.js';
import { sculptOf, voxelSnap } from '../src/progress/mimicrysculpt.js';
import { VoxelGrid, SHAPES } from '../src/godhand/voxels.js';

let fails = 0;
const line = (ok, s) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${s}`); };
const off = (p, d) => p && [p[0] + d, p[1] - d];
const sloppy = (s) => ({ ...s, at: off(s.at, 0.35), a: off(s.a, 0.35), b: off(s.b, 0.35), from: off(s.from, 0.35), to: off(s.to, 0.35), dh: s.dh != null ? s.dh * 0.85 : s.dh, vol: s.vol != null ? s.vol * 0.9 : s.vol });

function play(P, steps) {
  const fr = framesOf(P);
  if (P.family === 'herd') return { m: scoreOf(fr, { bodies: layHerd(fr.flock, steps) }), made: 0 };
  if (P.family === 'creation') {
    const F = newPatch(); lay(F, P.setup); settle(F);
    const G = new VoxelGrid(); let made = 0;
    for (const s of steps) { const c = sculptOf(s, (x, z) => F.groundAt(x, z)), sh = c.shape === 'pillar' ? SHAPES.pillar(c.a, c.opts) : SHAPES[c.shape](c.a, c.b, c.opts); G.stamp(sh.sdf, sh.box); made += c.est; }
    return { m: scoreOf(fr, { voxels: voxelSnap(G, { x: 0, z: 0, y: 0 }) }), made };
  }
  const F = newPatch();
  if (P.mode === 'undo') { lay(F, P.setup); lay(F, P.steps); } else lay(F, P.setup);
  settle(F); restore(F, { x: 0, z: 0 }, fr.start); // (the start exactly as the frames have it)
  const r = lay(F, steps); settle(F);
  return { m: matchOf(snap(F), fr.target, fr.start), made: r.made };
}

const all = [...Object.values(MIMIC_PUZZLES), dayPuzzle(7), dayPuzzle(8)];
for (const P of all) {
  const fr = framesOf(P);
  if (P.family !== 'matter') { // (a creation's target stands over the ground, a herd's in the pen: judged by their own measures)
    const own = play(P, P.steps), g = gradeOf({ match: own.m, strokes: P.steps.length, par: P.par, made: own.made, allow: fr.made });
    line(g.stars === 3, `${P.id} (${P.family}, ${P.mode}, ${P.powers.join(' ')}): the System's steps score ${own.m.toFixed(3)}, ${g.stars} stars`);
    const none = play(P, []).m; line(none < MIMIC.solve, `${P.id}: doing nothing scores ${none.toFixed(2)} (under ${MIMIC.solve})`);
    const hand = play(P, P.steps.map(sloppy)); line(hand.m >= MIMIC.solve, `${P.id}: a hand's copy (0.5 m off) scores ${hand.m.toFixed(2)} (at least ${MIMIC.solve})`);
    const half = play(P, P.steps.slice(0, Math.floor(P.steps.length / 2))); line(half.m < MIMIC.solve, `${P.id}: half its steps score ${half.m.toFixed(2)} (under ${MIMIC.solve})`);
    if (P.family === 'herd') { const mid = play(P, [{ op: 'herd', from: [0, -3], to: [0, 3] }]).m; line(mid < MIMIC.solve, `${P.id}: one drag from between its knots scores ${mid.toFixed(2)} (under ${MIMIC.solve})`); }
    continue;
  }
  if (P.veil) { // (Layer View's: something hidden, the seen steps alone short, three reads across lift it all)
    const hid = fr.veil.reduce((a, v) => a + v, 0), read = new Uint8Array(fr.veil.length);
    for (const z of [-4, 0, 4]) unveil(read, [-6, z], [6, z]);
    const left = fr.veil.reduce((a, v, o) => a + (v && !read[o] ? 1 : 0), 0);
    line(hid > 20 && left === 0, `${P.id}: the veil hides ${hid} cells, three reads across leave ${left}`);
    const seen = play(P, P.steps.filter((s) => !(s.dh < 0))).m; line(seen < MIMIC.solve, `${P.id}: copying only what is shown scores ${seen.toFixed(2)} (under ${MIMIC.solve})`);
  }
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
