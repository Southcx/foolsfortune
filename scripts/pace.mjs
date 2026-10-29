// ---------------------------------------------------------------------------------------
// PACE, READ (src/progress/pace.js; GAPS.md 5): when a ledger reached each milestone, against the design's target. Hand it a ledger as
// the save keeps it (its `ledger` section: { done, play, ... }), from a playtest, a QAIS session or a field report; with none, it checks
// that every milestone's achievement exists and prints the targets.
//
//   node scripts/pace.mjs [ledger.json]
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import { PACE, paceOf } from '../src/progress/pace.js';

const src = fs.readdirSync('src/progress').filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(`src/progress/${f}`, 'utf8')).join('\n');
let bad = 0;
for (const P of PACE) if (!new RegExp(`[CFHS]\\('${P.ach}',`).test(src)) { console.log(`FAIL  ${P.id}: no achievement ${P.ach}`); bad++; }
const file = process.argv[2];
if (!file) {
  console.log(PACE.map((P) => `${String(P.target).padStart(4)} min  ${P.label} (${P.ach})`).join('\n'));
} else {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')), L = raw.ledger || raw;
  console.log(`play: ${Math.round((L.play || 0) / 60)} real minutes`);
  for (const r of paceOf(L)) console.log(`${r.at == null ? '   -  ' : String(r.at).padStart(6)} / ${String(r.target).padStart(4)} min  ${r.late ? 'LATE ' : r.at == null ? 'not yet ' : 'on time '} ${r.label}`);
}
process.exit(bad ? 1 : 0);
