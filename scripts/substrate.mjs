// The substrate's measure (docs/plans/SUBSTRATE.md): every form of the vessel and how many full blows it takes, spread over its regions
// and on one region, checked against what each ship bore before the fold (ships.js `bears`); and every body's constitution with the
// type that bites it. Run: node scripts/substrate.mjs   (a FAIL line when a ship's fold strays more than one hit from its old bears)
import { FORMS, newVessel, blowOn, BREAK_AT } from '../src/progress/combat/vessel.js';
import { CONSTITUTION, typeWeaknessOf } from '../src/progress/combat/constitution.js';
import { SHIPS } from '../src/progress/rail/ships.js';

const hitsTo = (form, spread) => {
  let s = newVessel(form); const R = Object.keys(s.crack);
  for (let n = 1; n <= 200; n++) { const q = blowOn(s, { region: spread ? R[(n - 1) % R.length] : R[0], k: 1 }); s = q.state; if (q.shatter) return n; }
  return Infinity;
};
let fails = 0;
console.log(`the vessel's forms (BREAK_AT ${BREAK_AT}): full unshielded blows to shatter, spread / on one region`);
for (const form of Object.keys(FORMS)) {
  const spread = hitsTo(form, true), one = hitsTo(form, false), bears = SHIPS[form]?.bears;
  const ok = bears == null || Math.abs(spread - bears) <= 1; if (!ok) fails++;
  console.log(`  ${form.padEnd(10)} ${String(spread).padStart(3)} / ${String(one).padStart(2)}${bears != null ? `   (bore ${bears}: ${ok ? 'PASS' : 'FAIL'})` : ''}`);
}
console.log('\nconstitutions: affinity, body share, the type that bites it');
for (const [kind, c] of Object.entries(CONSTITUTION)) console.log(`  ${kind.padEnd(10)} ${String(c.affinity).padEnd(9)} ${c.body == null ? '  - ' : c.body.toFixed(2)}  ${typeWeaknessOf({ kind, aberrant: kind === 'aberrant' })}   ${c.line}`);
if (fails) { console.log(`\n${fails} FAIL`); process.exitCode = 1; }
