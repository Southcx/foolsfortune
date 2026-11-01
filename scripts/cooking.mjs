// ---------------------------------------------------------------------------------------
// SPIRIT COOKING, PRICED: what a served dish's draught is worth at the press, against the press's own materials (docs/plans/
// SPIRIT-COOKING.md 9: "a draught's lift to the press must not out-earn the press's own tiers"; the graft's test in ECONOMY.md). A dish
// pays no cubes. Its draught pulls each material pressed while it lasts a further `draughtPull` x strength toward its feeling
// (progress/alchemy.js walk). This prints, for every loaf and grade, the draught's strength, how long it lasts, the pull it adds to
// one material, that pull as a share of a common material's own and of one tier's step, and how far a hopper of five commons walks
// toward the feeling's hue with it and without it. Read it beside a drink's draught (a stone's tint x the weather, a real minute).
//
//   node scripts/cooking.mjs
// ---------------------------------------------------------------------------------------
import { ECON } from '../src/progress/econ/table.js';
import { makeMaterial, press, pullStep, distance } from '../src/progress/econ/materials.js';
import { FAMILIES, GRADES, serve } from '../src/progress/cooking/dishes.js';
import { ADDIN_OF } from '../src/progress/cooking/flavour.js';
import { FEELING_HUE } from '../src/progress/alchemy.js';

const A = ECON.alchemy, P = A.pull, common = P.share[0], tierStep = P.share[1];
const pad = (s, n) => String(s).padEnd(n), f = (v, d = 2) => (+v).toFixed(d);

console.log(`THE DRAUGHT AT THE PRESS (a common material pulls ${common} of the way to its own colour; a tier adds ${tierStep}; a draught adds ${A.draughtPull} x strength)`);
console.log(`${pad('dish', 16)}${pad('grade', 9)}${pad('feeling', 9)}${pad('strength', 10)}${pad('lasts s', 9)}${pad('pull+', 8)}${pad('/common', 9)}${pad('/tier', 7)}walk to hue, 5 commons: without -> with`);
const feelings = Object.keys(ADDIN_OF);
let worst = 0;
for (const addin of [null, ...feelings.map((k) => ADDIN_OF[k])]) {
  for (const G of GRADES.filter((g) => g.id !== 'dubious')) {
    const hits = G.id === 'true' ? [1, 1, 1] : [0, 0, 0], sc = G.id === 'true' ? [1, 1, 1] : [Math.min(0.99, G.at + 0.02)].flatMap((v) => [v, v, v]);
    const r = serve({ family: 'bread', addin, scores: sc, hits }); const D = r.draught; if (!D) continue;
    const plus = A.draughtPull * D.strength; worst = Math.max(worst, plus / tierStep);
    // five commons of mixed kinds pressed from grey, with and without the draught, measured to the feeling's hue at the swatches' saturation
    const to = { h: FEELING_HUE[D.feeling], s: A.sat }, mats = ['provision', 'art', 'finery', 'arcane', 'edge'].map((k, i) => makeMaterial(k, 11 + i, 0));
    let a = { h: 0, s: 0 }, b = { h: 0, s: 0 };
    for (const m of mats) { a = press(a, [m]).colour; b = press(b, [m]).colour; b = pullStep(b, to, plus); }
    if (G.id === 'good' || G.id === 'true') console.log(`${pad(r.dish.label, 16)}${pad(G.label, 9)}${pad(D.feeling, 9)}${pad(f(D.strength), 10)}${pad(D.hold, 9)}${pad(f(plus, 3), 8)}${pad(f(plus / common), 9)}${pad(f(plus / tierStep), 7)}${f(distance(a, to))} -> ${f(distance(b, to))}`);
  }
}
console.log(`\nVERDICT: the largest lift a dish gives one material is ${f(worst)} of a tier's step (${worst < 1 ? 'under one tier: a dish leans the press, it never buys a tier' : 'OVER one tier: retune draughtPull or the grades'}).`);
console.log(`A drink's draught for comparison: a stone's tint x the weather's strength (at most 1), a real minute; the same pull at the same strength.`);
