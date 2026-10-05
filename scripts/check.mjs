// ---------------------------------------------------------------------------------------
// THE CHECK: the part of Petra's gate a machine can do (docs/ARCHITECTURE.md, "The gate"). It reads every module under src/ and
// reports what breaks the house rules: imports that go nowhere, modules nothing imports, events named or shaped against the bus's
// rules, text feedback outside the log's rules, modules with no header, files past the size budget, retired words (docs/GLOSSARY.md),
// and anything kept in the browser outside the save (core/save.js).
//
// It fails only on NEW debt. What was already there when a rule arrived is written down in scripts/check-baseline.json (a count per rule
// per file); a count that rises, or a file that appears, fails the check. Paying debt down lowers the count, and `--update` writes the
// lower numbers back (Petra's, at the gate, so the baseline only ever falls).
//
// Prior art: ESLint's and Ruff's baselines (adopt a rule today, fail only on what is new), Rust's `#![deny]` ratchet, and the
// dependency-cruiser idea of an import graph checked in CI.
//
//   npm run check              report; exit 1 on new debt or on a hard error
//   npm run check -- --update  write today's counts to the baseline (only lower; a rise still fails)
//   npm run check -- --all     list every finding, the baselined ones too
//   npm run check -- --adopt=rule[,rule]  a NEW rule's findings as they stand today become its baseline (once, the day the rule lands)
// ---------------------------------------------------------------------------------------
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'src');
const BASELINE = path.join(ROOT, 'scripts', 'check-baseline.json');
const args = new Set(process.argv.slice(2));

// ---- the rules' numbers (docs/ARCHITECTURE.md)
const MAX_LINES = 800; // a module past this is doing more than one job
const ROOT_ALLOWED = new Set(['main.js']); // (the src/ root holds the composition root only, after the restructure)
// retired words (docs/GLOSSARY.md, "Retired words"): a new use of one fails; the old ones are in the baseline until the move renames them
const RETIRED = [
  { re: /\bsurfer\b|\bSurfer\b/g, say: "'surfer' (it is the skiff: Solar Skiffing)" },
  { re: /\blab mode\b|\bLab mode\b|\bsystem\.lab\b|\bsetLab\b/g, say: "'Lab mode' (the all-arts switch: `allArts`)" },
  { re: /\bpause card\b/gi, say: "'pause card' (the pause menu)" },
];

// ---- read the tree
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) { if (!p.startsWith(path.join(SRC, 'assets'))) walk(p); } else if (p.endsWith('.js')) files.push(p);
  }
})(SRC);
const rel = (p) => path.relative(ROOT, p);
const text = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));

const findings = []; // { rule, file, line, msg, hard }
const add = (rule, file, line, msg, hard = false) => findings.push({ rule, file: rel(file), line, msg, hard });
const lineOf = (src, i) => src.slice(0, i).split('\n').length;

// ---- 1. the import graph: every relative import resolves; every module is imported by something (main.js is the root)
const imported = new Set();
const IMPORT = /(?:(?:import|export)\s[^'";]*?from\s*|import\s*\(\s*|^\s*import\s*)['"](\.{1,2}\/[^'"]+)['"]/gm;
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' ')).replace(/\/\/[^\n]*/g, (c) => ' '.repeat(c.length)); // (comments blanked, positions kept)
for (const [f, raw] of text) {
  const src = code(raw);
  for (const m of src.matchAll(IMPORT)) {
    const spec = m[1].split('?')[0];
    if (!/\.m?js$/.test(spec) && path.extname(spec)) continue; // (an asset: a .glb, a .png?b64, a font)
    let t = path.resolve(path.dirname(f), spec);
    if (!t.endsWith('.js')) t += '.js';
    if (!fs.existsSync(t)) add('import.broken', f, lineOf(src, m.index), `imports ${m[1]}, which is not there`, true);
    imported.add(t);
  }
}
for (const tool of fs.readdirSync(path.join(ROOT, 'scripts')).filter((x) => /\.m?js$/.test(x))) {
  const src = fs.readFileSync(path.join(ROOT, 'scripts', tool), 'utf8');
  for (const m of src.matchAll(/['"](\.\.\/src\/[^'"?]+)['"]/g)) imported.add(path.resolve(ROOT, 'scripts', m[1]));
}
for (const f of files) if (!imported.has(f) && path.basename(f) !== 'main.js') add('module.orphan', f, 1, 'nothing imports it (dead code, or a missing import)');

// ---- 2. the event bus (CLAUDE.md, Feedback): game events are `domain.verb`, and their payloads never carry `name` or `t`
// (`this.ev(...)` is the player's forwarder to the bus: courier/player.js)
const EMIT = /\b(?:events\??\.emit|this\.ev)\(\s*['"]([^'"]+)['"]\s*(?:,\s*\{([^}]*)\})?/g;
for (const [f, raw] of text) {
  const src = code(raw);
  for (const m of src.matchAll(EMIT)) {
    const [, ev, body] = m, line = lineOf(src, m.index);
    if (!ev.includes('.')) add('event.name', f, line, `event '${ev}' is not domain.verb`);
    if (body && /(?:^|[,{\s])(name|t)\s*:/.test(body)) add('event.payload', f, line, `event '${ev}' carries \`name\` or \`t\` (the bus's own keys)`, true);
  }
}

// ---- 3. text feedback (CLAUDE.md, Feedback): only the tracking rules write to the log; a refusal at the point of use may, with a throttle
const SAY = /\blog\??\.say\(/g;
for (const [f, raw] of text) {
  const src = code(raw);
  if (/tracking(\/|\.js$)/.test(rel(f)) || /gamelog\.js$/.test(f) || /chat\.js$/.test(f) || /npc\/dialogue\.js$/.test(f)) continue;
  for (const m of src.matchAll(SAY)) {
    const callEnd = src.indexOf('\n', m.index), call = src.slice(m.index, callEnd);
    if (!/throttle\s*:/.test(call)) add('log.say', f, lineOf(src, m.index), 'writes to the log outside tracking.js without a throttle (a celebration belongs in a tracking rule)');
  }
}

// ---- 4. the module contract (docs/ARCHITECTURE.md): a header comment first; a size budget; nothing loose in the src/ root
for (const [f, src] of text) {
  const first = src.split('\n').find((l) => l.trim());
  if (!first || !/^\s*(\/\/|\/\*)/.test(first)) add('module.header', f, 1, 'no header comment (what it is, the prior art, the interface)');
  const n = src.split('\n').length;
  if (n > MAX_LINES) add('module.size', f, n, `${n} lines (budget ${MAX_LINES}): split it by job`);
  if (path.dirname(f) === SRC && !ROOT_ALLOWED.has(path.basename(f))) add('layout.root', f, 1, 'a module loose in the src/ root (docs/ARCHITECTURE.md, "Layout")');
}

// ---- 5. words (docs/GLOSSARY.md): retired words, and the Courier's pronouns (CLAUDE.md, The Courier)
const COURIER = /\b(the )?Courier\b[^.;\n]{0,60}?\b(she|he|her|him|his|hers|herself|himself)\b/gi;
for (const [f, src] of text) {
  for (const { re, say } of RETIRED) for (const m of src.matchAll(re)) add('word.retired', f, lineOf(src, m.index), `retired word: ${say}`);
  for (const m of src.matchAll(COURIER)) {
    const ctx = src.slice(Math.max(0, m.index - 40), m.index + m[0].length);
    if (/\b(the Prince|Raku|Grog|Saggar|Pip|Kaolin|the King|the Queen)\b/.test(ctx)) continue; // (the folk are he and she)
    add('word.courier', f, lineOf(src, m.index), `"${m[0].replace(/\s+/g, ' ')}": the Courier is "they" (or "you" where the game speaks)`);
  }
}

// ---- 6. records (docs/DESIGN.md): every achievement id is unique (a duplicate makes two entries share one completion, and what keys
// on the id, a glaze, a title, gets the wrong one)
for (const [f, raw] of text) {
  if (!f.endsWith(path.join('progress', 'achievements.js'))) continue;
  const src = code(raw), seen = new Map();
  for (const m of src.matchAll(/(?:^|[\s;{(,])[CFHS]\(\s*'([a-z0-9]+)'/gm)) {
    const id = m[1], line = lineOf(src, m.index);
    if (seen.has(id)) add('achievement.id', f, line, `achievement id '${id}' is used twice (first at line ${seen.get(id)})`);
    else seen.set(id, line);
  }
}

// ---- 7. the save (core/save.js): nothing keeps anything in the browser but the save; a module that keeps something registers a section
for (const [f, raw] of text) {
  if (f.endsWith(path.join('core', 'save.js'))) continue;
  const src = code(raw);
  for (const m of src.matchAll(/\blocalStorage\b/g)) add('save.storage', f, lineOf(src, m.index), 'keeps something in localStorage itself: register a section with game.save (core/save.js)');
}

// ---- 8. the same twice (docs/plans/COOP.md, C1): the simulation takes its chance from a seeded stream (core/rng.js `stream`), never
// Math.random; the cosmetic domains (vfx, audio, music, ui, title, render, cine, workbench, debug) may roll freely
const SIM = /^src\/(creatures|courier|world|tools|godhand|npc|pneuka|progress|core|feedback)\//;
for (const [f, raw] of text) {
  const r = rel(f).split(path.sep).join('/');
  if (!SIM.test(r) || r === 'src/core/rng.js') continue;
  const src = code(raw);
  for (const m of src.matchAll(/\bMath\.random\b|\.randomDirection\(|\bMathUtils\.(?:rand|seededRandom)\w*/g)) add('rand.sim', f, lineOf(src, m.index), 'the simulation takes its chance from a seeded stream (core/rng.js: `const simRand = stream(name)`, `randDir(simRand, v)`), never Math.random or three\'s random helpers (they call it)');
}

// ---- 9. the clocks (CLAUDE.md, Be specific; core/calendar.js): the simulation reads the calendar's `now()` or the game clock, never the
// wall clock itself (a replay pins the calendar; `Date.now()` it cannot pin, so the replay drifts and the gate's held clock is ignored)
for (const [f, raw] of text) {
  const r = rel(f).split(path.sep).join('/');
  if (!SIM.test(r) || r === 'src/core/calendar.js') continue;
  const src = code(raw);
  for (const m of src.matchAll(/\bDate\.now\(\)|\bnew Date\(\)/g)) add('clock.sim', f, lineOf(src, m.index), 'the simulation reads the wall clock: use `now()` from core/calendar.js (a replay and the gate hold it), or the game clock');
}

// ---- 10. what a Node script loads (docs/ARCHITECTURE.md, Imports): a table a script reads (economy.mjs, combat.mjs) must not pull in
// three.js through what it imports; the pure halves exist for that (render/zonemap.js beside render/zones.js)
const importsOf = new Map();
for (const [f, raw] of text) {
  const src = code(raw), out = [];
  for (const m of src.matchAll(IMPORT)) {
    const spec = m[1].split('?')[0]; if (!/\.m?js$/.test(spec) && path.extname(spec)) continue;
    let t = path.resolve(path.dirname(f), spec); if (!t.endsWith('.js')) t += '.js'; out.push(t);
  }
  importsOf.set(f, { out, three: /^\s*import[^;]*from\s*['"](three|three\/[^'"]*|@dimforge\/[^'"]*)['"]/m.test(src) });
}
const viaThree = new Set();
for (const tool of fs.readdirSync(path.join(ROOT, 'scripts')).filter((x) => /\.m?js$/.test(x))) {
  const tsrc = fs.readFileSync(path.join(ROOT, 'scripts', tool), 'utf8');
  if (/from\s*['"](three|playwright)['"]/.test(tsrc)) continue; // (a script that loads the renderer or a browser on purpose)
  const seen = new Set(), stack = [...tsrc.matchAll(/^\s*import[^;]*from\s*['"](\.\.\/src\/[^'"?]+)['"]/gm)].map((m) => path.resolve(ROOT, 'scripts', m[1]));
  while (stack.length) { const f = stack.pop(); if (seen.has(f) || !importsOf.has(f)) continue; seen.add(f); const n = importsOf.get(f); if (n.three) viaThree.add(f); stack.push(...n.out); }
}
for (const f of viaThree) add('data.three', f, 1, 'a Node script reaches this module, and it imports three.js or Rapier: split the pure part out (render/zonemap.js is the pattern)');

// ---- 11. merges finished (a hard error): no conflict markers anywhere the game, its scripts or its docs are
for (const dir of ['src', 'scripts', 'docs']) {
  (function walk(d) {
    for (const x of fs.readdirSync(d)) {
      const p = path.join(d, x);
      if (fs.statSync(p).isDirectory()) { if (!/assets|node_modules/.test(x)) walk(p); continue; }
      if (!/\.(m?js|md|html|json)$/.test(x)) continue;
      const src = fs.readFileSync(p, 'utf8');
      for (const m of src.matchAll(/^(<<<<<<<|>>>>>>>) /gm)) add('merge.marker', p, lineOf(src, m.index), 'a merge conflict left in the file', true);
    }
  })(path.join(ROOT, dir));
}
for (const x of ['CLAUDE.md', 'README.md']) { const src = fs.readFileSync(path.join(ROOT, x), 'utf8'); for (const m of src.matchAll(/^(<<<<<<<|>>>>>>>) /gm)) add('merge.marker', path.join(ROOT, x), lineOf(src, m.index), 'a merge conflict left in the file', true); }

// ---- 12. the clock named (CLAUDE.md, Be specific): what the game says to the player names its clock: a game day, a game hour, a real
// minute, never a bare "an hour" or "every day". Checked in the strings the game says as itself: the tracking rules, the items, the help
// pages (the folk's lines are speech: "one day" there is an idiom, Espada's to judge).
const SPOKEN = /^src\/(feedback\/tracking|pneuka\/items\.js|feedback\/help)/;
for (const [f, raw] of text) {
  const r = rel(f).split(path.sep).join('/');
  if (!SPOKEN.test(r)) continue;
  for (const m of raw.matchAll(/(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
    const str = m[2], w = str.match(/\b(an?|one|per|each|every|this|that|next|last|the)\s+(hour|day|minute)s?\b/i);
    if (w) add('words.clock', f, lineOf(raw, m.index), `"${w[0]}": name its clock (a game day, a game hour, a real minute)`);
  }
}

// ---- tally against the baseline
const counts = {};
for (const x of findings) if (!x.hard) counts[`${x.rule}|${x.file}`] = (counts[`${x.rule}|${x.file}`] || 0) + 1;
let base = {};
try { base = JSON.parse(fs.readFileSync(BASELINE, 'utf8')); } catch { /* no baseline yet */ }
const hard = findings.filter((x) => x.hard);
const fresh = Object.entries(counts).filter(([k, n]) => n > (base[k] ?? 0));
const paid = Object.entries(base).filter(([k, n]) => (counts[k] ?? 0) < n);

const byRule = {};
for (const x of findings) byRule[x.rule] = (byRule[x.rule] || 0) + 1;
console.log(`check: ${files.length} modules · ${findings.length} findings (${Object.entries(byRule).map(([r, n]) => `${r} ${n}`).join(', ') || 'none'})`);
const show = (list) => { for (const x of list) console.log(`  ${x.file}:${x.line}  [${x.rule}] ${x.msg}`); };
if (args.has('--all')) show(findings);
if (hard.length) { console.log(`\nHARD ERRORS (${hard.length}): these break the game or the bus`); show(hard); }
if (fresh.length) {
  console.log(`\nNEW DEBT (${fresh.length} rule/file pairs above the baseline):`);
  for (const [k] of fresh) { const [rule, file] = k.split('|'); show(findings.filter((x) => x.rule === rule && x.file === file)); }
}
if (paid.length) console.log(`\npaid down: ${paid.map(([k, n]) => `${k} ${n}→${counts[k] ?? 0}`).join(', ')}${args.has('--update') ? '' : '  (run with --update to lower the baseline)'}`);
const adopt = new Set([...args].filter((x) => x.startsWith('--adopt=')).flatMap((x) => x.slice(8).split(',')));
if (args.has('--update') || adopt.size) {
  // the baseline only falls: a pair may be lowered or removed, never raised (a rise is new debt, and fails above)
  const next = {};
  for (const [k, n] of Object.entries(counts)) next[k] = Math.min(n, base[k] ?? (Object.keys(base).length ? 0 : n));
  for (const [k, n] of Object.entries(counts)) if (adopt.has(k.split('|')[0]) && !Object.keys(base).some((b) => b.startsWith(`${k.split('|')[0]}|`))) next[k] = n; // (a new rule's debt as it stands)
  for (const k of Object.keys(next)) if (!next[k]) delete next[k];
  fs.writeFileSync(BASELINE, JSON.stringify(Object.fromEntries(Object.entries(next).sort()), null, 1) + '\n');
  console.log(`baseline written: ${Object.keys(next).length} rule/file pairs`);
}
const ok = !hard.length && !fresh.length;
console.log(ok ? '\ncheck: OK (no new debt)' : '\ncheck: FAILED');
process.exit(ok ? 0 : 1);
