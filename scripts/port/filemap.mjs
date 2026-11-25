// PORT FILE MAP: one line a module of src/, from the first sentence of its header comment, grouped by folder, with its line count.
// And the event catalogue: every event name emitted (`events.emit('x.y'`), with the files that emit it and those that listen (`on('x.y'`).
//   node scripts/port/filemap.mjs   -> PORT/FILEMAP.md, PORT/EVENTS.md
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
const ROOT = new URL('../../', import.meta.url).pathname, SRC = join(ROOT, 'src');
const walk = (d) => readdirSync(d).sort().flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []; });
const files = walk(SRC);
const byDir = new Map(); const emits = new Map(), hears = new Map();
const add = (m, k, f) => { if (!m.has(k)) m.set(k, new Set()); m.get(k).add(f); };
for (const p of files) {
  const txt = readFileSync(p, 'utf8'), rel = relative(SRC, p), lines = txt.split('\n');
  const head = lines.slice(0, 30).filter((l) => l.startsWith('//') && !/^\/\/\s*-{5,}/.test(l)).map((l) => l.replace(/^\/\/\s?/, '')).join(' ');
  let one = head.replace(/\s+/g, ' ').trim(); const cut = one.search(/\.(\s|$)/); if (cut > 60) one = one.slice(0, cut + 1);
  if (one.length > 170) one = one.slice(0, 167) + '...';
  const d = dirname(rel); if (!byDir.has(d)) byDir.set(d, []); byDir.get(d).push(`- \`${rel.split('/').pop()}\` (${lines.length}) ${one || '(no header)'}`);
  for (const m of txt.matchAll(/emit\(\s*['"`]([a-z][\w.]*)['"`]/g)) add(emits, m[1], rel);
  for (const m of txt.matchAll(/\.on\(\s*['"`]([a-z][\w.*]*)['"`]/g)) add(hears, m[1], rel);
}
let out = `# File map of src/ (generated: node scripts/port/filemap.mjs)\n\nOne line a module: its file, its line count, the first sentence of its header. ${files.length} modules. Grep this, do not load it whole.\n`;
for (const [d, ls] of [...byDir].sort()) out += `\n## ${d}/ (${ls.length})\n${ls.join('\n')}\n`;
writeFileSync(join(ROOT, 'PORT/FILEMAP.md'), out);
const names = [...new Set([...emits.keys(), ...hears.keys()])].sort();
let ev = `# Event catalogue (generated: node scripts/port/filemap.mjs)\n\nEvery event name on the bus (\`game.events.emit(name, payload)\`; the bus adds \`name\` and \`t\`). \`E:\` the files that emit it, \`H:\` the files that listen. ${names.length} names. Grep this.\n`;
let grp = '';
for (const n of names) { const g = n.split('.')[0]; if (g !== grp) { grp = g; ev += `\n## ${g}\n`; } ev += `- \`${n}\` E: ${[...(emits.get(n) || [])].join(', ') || '-'}${hears.has(n) ? ` H: ${[...hears.get(n)].join(', ')}` : ''}\n`; }
writeFileSync(join(ROOT, 'PORT/EVENTS.md'), ev);
console.log(files.length, 'modules;', names.length, 'events');
