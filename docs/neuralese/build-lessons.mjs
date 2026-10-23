// ---------------------------------------------------------------------------------------
// BUILD THE NEURALESE LESSONS: the in-house tutorial page (Espada's, 2026-10-23, the owner asking to learn the language) made from the
// game's own sources, so the page can never drift from the language: the roots, phrases and titles (src/npc/neuraleseroots.js), the
// game's words and stelae (src/npc/neuralese.js), the spelling (src/npc/neuralesespelling.js) and the running hand itself
// (src/ui/runninghand.js, Calissa's, final), each inlined with its `export`s stripped into the template docs/neuralese/lessons.html.
//
//   node docs/neuralese/build-lessons.mjs [out.html]   (default: docs/neuralese/lessons.built.html, not committed)
// ---------------------------------------------------------------------------------------
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..', '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const strip = (src) => src.split('\n').filter((l) => !/^\s*(import|export \{)/.test(l)).join('\n').replace(/^export (const|function|let) /gm, '$1 ');

const roots = read('src/npc/neuraleseroots.js');
// the fields: the TABLE's comment lines head each group of roots
const fields = []; let inTable = false;
for (const line of roots.split('\n')) {
  if (line.startsWith('const TABLE')) { inTable = true; continue; }
  if (inTable && line.startsWith('];')) break;
  if (!inTable) continue;
  const c = line.match(/^\s*\/\/\s*(.+)$/); if (c) { fields.push({ field: c[1].replace(/\s*\(.*$/, '').replace(/:.*/, ''), words: [] }); continue; }
  const w = line.match(/^\s*\['([A-Z]+)'/); if (w && fields.length) fields[fields.length - 1].words.push(w[1]);
}

const engine = [
  '// ---- inlined from src/npc/neuraleseroots.js', strip(roots),
  '// ---- inlined from src/npc/neuralese.js', strip(read('src/npc/neuralese.js')),
  '// ---- inlined from src/npc/neuralesespelling.js', strip(read('src/npc/neuralesespelling.js')),
  '// ---- inlined from src/ui/runninghand.js', strip(read('src/ui/runninghand.js')),
  `const FIELDS = ${JSON.stringify(fields)};`,
].join('\n');

const out = process.argv[2] || join(here, 'lessons.built.html');
const html = read('docs/neuralese/lessons.html').replace('/*@ENGINE@*/', () => engine);
writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB, ${fields.length} fields)`);
