// ---------------------------------------------------------------------------------------
// THE CASEBOOK'S NUMBERS, GIVEN AT THE GATE (CLAUDE.md, The casebook; the owner, 2026-10-11). A division writes a new rule as
// `NEW:<slug>` (a short slug of its own: `NEW:prone-reach`) in the casebook's short list, in its case's **Rule:** line
// (docs/CASEBOOK-CASES.md), and anywhere it cites it (a plan, a comment: "casebook rule NEW:prone-reach"). Petra runs this after the
// merge: each `NEW:<slug>` in the short list, in its order there, takes the next free number, and every mention of it in docs/, src/
// and scripts/ is rewritten. `npm run check` fails on a number used twice, so a rule numbered in a branch and merged beside another is
// caught too.
//
// Prior art: the RFC Editor's numbers (a draft is named by its author, the number is given only on publication) and IANA's registries
// (one registrar hands out the numbers; nobody picks their own).
//
//   node scripts/casebook-number.mjs          number them, write the files, print what became what
//   node scripts/casebook-number.mjs --dry    print only
// ---------------------------------------------------------------------------------------
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CASEBOOK = path.join(ROOT, 'docs', 'CASEBOOK.md');
const dry = process.argv.includes('--dry');

const cb = fs.readFileSync(CASEBOOK, 'utf8'), lines = cb.split('\n');
const start = lines.findIndex((l) => /^## The rules, short/.test(l)), end = ((e) => e < 0 ? lines.length : e)(lines.findIndex((l, i) => i > start && /^## /.test(l)));
let max = 0;
const fresh = [];
for (let i = start + 1; i < end; i++) {
  const m = lines[i].match(/^(\d+|NEW:[\w-]+)\. \*\*/); if (!m) continue;
  if (m[1].startsWith('NEW:')) { if (!fresh.includes(m[1])) fresh.push(m[1]); } else max = Math.max(max, +m[1]);
}
if (!fresh.length) { console.log('casebook: no NEW rules to number'); process.exit(0); }
const map = new Map(fresh.map((slug, k) => [slug, max + 1 + k]));
for (const [slug, n] of map) console.log(`${slug} -> ${n}`);
if (dry) process.exit(0);

// every mention, in the docs and the code (longest slug first, so NEW:a never eats NEW:ab)
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out); } else if (/\.(md|js|mjs)$/.test(e.name)) out.push(p); } return out; };
const slugs = [...map.keys()].sort((a, b) => b.length - a.length);
let files = 0;
for (const f of [...walk(path.join(ROOT, 'docs')), ...walk(path.join(ROOT, 'src')), ...walk(path.join(ROOT, 'scripts'))]) {
  const raw = fs.readFileSync(f, 'utf8');
  let s = raw;
  for (const slug of slugs) s = s.split(slug).join(String(map.get(slug)));
  if (s !== raw) { fs.writeFileSync(f, s); files++; }
}
console.log(`casebook: ${map.size} rule${map.size === 1 ? '' : 's'} numbered, ${files} file${files === 1 ? '' : 's'} rewritten`);
