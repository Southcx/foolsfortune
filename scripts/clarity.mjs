// ---------------------------------------------------------------------------------------
// THE CLARITY CHECK (docs/plans/CLARITY.md section 11, Dovina's): every table the player chooses from carries a `name` (the label, a
// genre word) and a `does` (the card line: verb first, at most 8 words, grade 6 or under, no clock but real time, no world word). One
// PASS/FAIL line a table; a FAIL lists the rows. Tables join the list as their windows are redone (section 12).
//
// Prior art: the Hemingway editor's grade (Flesch-Kincaid), and the project's own check (scripts/check.mjs): a rule written down is a
// rule enforced.
//
//   node scripts/clarity.mjs
// ---------------------------------------------------------------------------------------
import { MOUNTS } from '../src/progress/rail/mounts.js';
import { FEATURES } from '../src/progress/realm.js';

/** The tables checked: each row's `name` (its label) and `does` (its card line). */
const TABLES = {
  'the mounts (progress/rail/mounts.js)': Object.entries(MOUNTS).map(([id, m]) => ({ id, name: m.name, does: m.does })),
  "the garden's features (progress/realm.js)": Object.entries(FEATURES).map(([id, f]) => ({ id, name: f.name, does: f.does })),
};
/** Words of the world (the glossary's world section and the lore names) that never stand in a label or a card line. */
const WORLD = /\b(Lachrymite|Emocean|Vessoul|Egregore|Figment|Tulpa|Contractor|Anagami|Margarite|Entropolis|draught|formation|Firing|reckon(ing)?|rutter|waypoint|bars?|game hours?)\b/i;

const words = (s) => (s.match(/[A-Za-z']+/g) || []);
const syllables = (w) => { w = w.toLowerCase().replace(/e$/, ''); const m = w.match(/[aeiouy]+/g); return Math.max(1, m ? m.length : 1); };
/** Flesch-Kincaid grade of one line (a card line is one sentence). */
const grade = (s) => { const W = words(s); if (!W.length) return 0; const syl = W.reduce((a, w) => a + syllables(w), 0); return 0.39 * W.length + 11.8 * (syl / W.length) - 15.59; };

let fails = 0;
for (const [table, rows] of Object.entries(TABLES)) {
  const bad = [];
  for (const r of rows) {
    const why = [];
    if (!r.name) why.push('no label');
    if (!r.does) why.push('no card line');
    else {
      const n = words(r.does).length; if (n > 8) why.push(`${n} words`);
      const g = grade(r.does); if (g > 6) why.push(`grade ${g.toFixed(1)}`);
      const w = r.does.match(WORLD) || (r.name || '').match(WORLD); if (w) why.push(`world word "${w[0]}"`);
      if (/[/\\]|\.js\b/.test(r.does)) why.push('a path');
    }
    if (why.length) bad.push(`${r.id}: ${why.join(', ')}`);
  }
  if (bad.length) fails++;
  console.log(`${bad.length ? 'FAIL' : 'PASS'} ${table}: ${rows.length} rows${bad.length ? ` ${JSON.stringify(bad)}` : ''}`);
}
console.log(fails ? `clarity: ${fails} FAILED` : 'clarity: all passed'); process.exitCode = fails ? 1 : 0;
