// ---------------------------------------------------------------------------------------
// THE CONNECTOME: the codebase's wiring as a machine sees it (the deep clean, the owner, 2026-10-19). Every module under src/ is parsed
// (rollup's own parser, the one the build uses) and joined by what it imports: static imports, re-exports, `import()` with a literal
// path and `import.meta.glob`. From that graph it says:
//   - reach      which modules the game reaches from src/main.js; which only the Node scripts (scripts/) reach; which nothing reaches
//   - exports    each export no other module imports: kept only for its own file (drop the `export`) or used by nothing (dead)
//   - locals     top-level functions, classes and consts declared and never referenced (dead), and imports never used
//   - methods    class and object methods whose name nothing reads anywhere (a.b, a['b'], { b } = a, or the string 'b')
//   - stale      file paths named in comments and docs (not the handoffs) that no file in the tree ends with
//   - cycles     strongly connected groups over static imports (an init-order risk, and a sign two modules are one)
//   - owners     every finding under its division (CLAUDE.md, "Threads"), so each cleans its own
// It is a reader, never a gate: names reached by strings (a chat command's table, `game[kind + 'Wipe']`) look dead to it, so every
// finding is a lead to read, not a deletion to run.
//
// Prior art: knip and ts-prune (unused exports and files), madge and dependency-cruiser (the graph, its cycles), Tarjan's SCC algorithm.
//
//   node scripts/connectome.mjs                  summary to stdout
//   node scripts/connectome.mjs --json=<path>    the whole map as JSON
//   node scripts/connectome.mjs --md=<path>      the findings by division as Markdown
// ---------------------------------------------------------------------------------------
import fs from 'fs';
import path from 'path';
import { parseAst } from 'rollup/parseAst';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'src'), SCRIPTS = path.join(ROOT, 'scripts');
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const rel = (p) => path.relative(ROOT, p);

// ---- who owns a path (CLAUDE.md, "Threads"; the first match wins)
const OWNERS = [
  [/^src\/npc\/(talks|realmnames)\.js$/, 'espada'], [/^docs\/LORE\.md$/, 'espada'],
  [/^src\/npc\/clayese\.js$/, 'wanda'], [/^src\/(audio|music)\//, 'wanda'],
  [/^src\/(vfx|ui|assets)\//, 'calissa'], [/^scripts\/(export_|bake_)/, 'calissa'],
  [/^src\/progress\/(econ|duel|casino)\//, 'dovina'], [/^src\/progress\/(stats|achievements|unlocks|luck|feelings|godpowers|domains|knacks|familiarity|sight|poolcaps|skiffparts|alchemy|garden|mycelium|weather)\.js$/, 'dovina'],
  [/^scripts\/(economy|casino|duel)\.mjs$/, 'dovina'], [/^scripts\/sweeps\//, 'dovina'], [/^src\/world\/raceway\//, 'dovina'],
];
const ownerOf = (r) => (OWNERS.find(([re]) => re.test(r)) || [null, 'petra'])[1];

// ---- read the tree
const walk = (d, out = []) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p, out); else if (/\.(m?js)$/.test(f)) out.push(p); } return out; };
const srcFiles = walk(SRC), scriptFiles = walk(SCRIPTS);
const mods = new Map(); // abs path -> module record

function resolve(from, spec) {
  if (!spec.startsWith('.') && !spec.startsWith('/')) return { ext: spec.split('?')[0] };
  const clean = spec.split('?')[0], base = path.resolve(path.dirname(from), clean);
  for (const c of [base, base + '.js', base + '.mjs', path.join(base, 'index.js')]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return /\.(m?js)$/.test(c) ? { file: c } : { asset: c };
  return { missing: clean };
}
// import.meta.glob's patterns: only the 'dir/*.ext' shape the tree uses
function globFiles(from, pattern) {
  const abs = path.resolve(path.dirname(from), pattern), dir = path.dirname(abs), re = new RegExp('^' + path.basename(abs).replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => re.test(f)).map((f) => path.join(dir, f)) : [];
}

// a plain ESTree walk with parents
function visit(node, fn, parent = null, key = null) {
  if (!node || typeof node.type !== 'string') return;
  fn(node, parent, key);
  for (const k of Object.keys(node)) {
    if (k === 'parent') continue;
    const v = node[k];
    if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === 'string') visit(c, fn, node, k); }
    else if (v && typeof v.type === 'string') visit(v, fn, node, k);
  }
}
const patternNames = (p, out = []) => {
  if (!p) return out;
  if (p.type === 'Identifier') out.push(p.name);
  else if (p.type === 'ObjectPattern') for (const q of p.properties) patternNames(q.type === 'RestElement' ? q.argument : q.value, out);
  else if (p.type === 'ArrayPattern') for (const q of p.elements) patternNames(q, out);
  else if (p.type === 'AssignmentPattern') patternNames(p.left, out);
  else if (p.type === 'RestElement') patternNames(p.argument, out);
  return out;
};
// the names a dynamic import's result is read by: `const { a } = await import()`, `(await import()).a`, `.then(({ a }) => ...)`; else all
function dynamicNames(node, parents) {
  let i = parents.length - 1, cur = node, p = parents[i];
  if (p?.type === 'AwaitExpression') { cur = p; p = parents[--i]; }
  if (p?.type === 'MemberExpression' && p.object === cur && !p.computed) return [p.property.name];
  if (p?.type === 'VariableDeclarator' && p.init === cur && p.id.type === 'ObjectPattern') return p.id.properties.filter((q) => q.key).map((q) => q.key.name ?? q.key.value);
  if (p?.type === 'MemberExpression' && p.property?.name === 'then') { const call = parents[i - 1], fn = call?.arguments?.[0]; if (fn?.params?.[0]?.type === 'ObjectPattern') return fn.params[0].properties.filter((q) => q.key).map((q) => q.key.name); }
  return ['*'];
}

function parseModule(file) {
  const src = fs.readFileSync(file, 'utf8');
  const m = { file, rel: rel(file), owner: ownerOf(rel(file)), lines: src.split('\n').length, imports: [], exports: new Map(), refs: new Map(), topDecls: [], importLocals: [], methods: [], propReads: new Map(), parseError: null };
  let ast;
  try { ast = parseAst(src, { allowReturnOutsideFunction: true }); } catch (e) { m.parseError = e.message; return m; }
  const addEdge = (spec, names, kind) => { const r = resolve(file, spec); m.imports.push({ spec, names, kind, ...r }); };
  // imports, exports, the top level
  for (const n of ast.body) {
    if (n.type === 'ImportDeclaration') {
      const names = n.specifiers.map((s) => (s.type === 'ImportNamespaceSpecifier' ? '*' : s.type === 'ImportDefaultSpecifier' ? 'default' : s.imported.name ?? s.imported.value));
      addEdge(n.source.value, names.length ? names : [], 'static');
      for (const s of n.specifiers) m.importLocals.push({ local: s.local.name, line: lineAt(src, n.start), from: n.source.value });
    } else if (n.type === 'ExportNamedDeclaration') {
      if (n.source) addEdge(n.source.value, n.specifiers.map((s) => s.local.name ?? s.local.value), 'reexport');
      if (n.declaration) {
        const d = n.declaration, ids = d.type === 'VariableDeclaration' ? d.declarations.flatMap((x) => patternNames(x.id)) : [d.id?.name];
        for (const id of ids) if (id) m.exports.set(id, { local: id, line: lineAt(src, n.start) });
      }
      for (const s of n.specifiers) { const ex = s.exported.name ?? s.exported.value; m.exports.set(ex, { local: n.source ? null : s.local.name, line: lineAt(src, n.start), reexport: !!n.source }); }
    } else if (n.type === 'ExportDefaultDeclaration') {
      m.exports.set('default', { local: n.declaration?.id?.name || null, line: lineAt(src, n.start) });
    } else if (n.type === 'ExportAllDeclaration') {
      addEdge(n.source.value, ['*'], 'reexport');
      if (n.exported) m.exports.set(n.exported.name, { local: null, line: lineAt(src, n.start), reexport: true }); else m.exportAll = (m.exportAll || []).concat(n.source.value);
    } else if (n.type === 'FunctionDeclaration' || n.type === 'ClassDeclaration') {
      if (n.id) m.topDecls.push({ name: n.id.name, kind: n.type === 'FunctionDeclaration' ? 'function' : 'class', line: lineAt(src, n.start), size: lineAt(src, n.end) - lineAt(src, n.start) + 1 });
    } else if (n.type === 'VariableDeclaration') {
      for (const d of n.declarations) for (const id of patternNames(d.id)) m.topDecls.push({ name: id, kind: n.kind, line: lineAt(src, n.start), size: lineAt(src, n.end) - lineAt(src, n.start) + 1 });
    }
  }
  // every identifier read, dynamic imports, import.meta.glob
  const parents = [];
  (function walkP(node, parent, key) {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'Identifier') {
      const skip = (parent?.type === 'MemberExpression' && key === 'property' && !parent.computed)
        || ((parent?.type === 'Property' || parent?.type === 'MethodDefinition' || parent?.type === 'PropertyDefinition') && key === 'key' && !parent.computed && !(parent.shorthand))
        || parent?.type === 'ExportSpecifier' || parent?.type === 'ImportSpecifier' && key === 'imported' || parent?.type === 'LabeledStatement' || parent?.type === 'BreakStatement' || parent?.type === 'ContinueStatement';
      if (!skip) m.refs.set(node.name, (m.refs.get(node.name) || 0) + 1);
    }
    // a method or a function-valued property, and every read of a property name (a.b, a['b'], { b } = a, the string 'b')
    const nameOf = (k, computed) => (!computed && k?.type === 'Identifier' ? k.name : k?.type === 'Literal' && typeof k.value === 'string' ? k.value : null);
    if (node.type === 'MethodDefinition' && node.kind !== 'constructor') { const k = nameOf(node.key, node.computed); if (k) m.methods.push({ name: k, kind: node.kind, line: lineAt(src, node.start), size: lineAt(src, node.end) - lineAt(src, node.start) + 1 }); }
    if (node.type === 'Property' && parent?.type === 'ObjectExpression' && /FunctionExpression|ArrowFunctionExpression/.test(node.value?.type || '')) { const k = nameOf(node.key, node.computed); if (k) m.methods.push({ name: k, kind: 'prop', line: lineAt(src, node.start), size: lineAt(src, node.end) - lineAt(src, node.start) + 1 }); }
    const read = (k) => k && m.propReads.set(k, (m.propReads.get(k) || 0) + 1);
    if (node.type === 'MemberExpression') read(nameOf(node.property, node.computed));
    if (node.type === 'Property' && parent?.type === 'ObjectPattern') read(nameOf(node.key, node.computed));
    if (node.type === 'Literal' && typeof node.value === 'string' && node.value.length < 60) { read(node.value); for (const w of node.value.split(/[^A-Za-z0-9_$]+/)) read(w); } // (the whole string too: an event-keyed table, 'well.floor')
    if (node.type === 'TemplateElement') for (const w of (node.value.cooked || '').split(/[^A-Za-z0-9_$]+/)) read(w);
    if (node.type === 'ImportExpression' && node.source?.type === 'Literal' && typeof node.source.value === 'string') addEdge(node.source.value, dynamicNames(node, parents), 'dynamic');
    if (node.type === 'ImportExpression' && node.source?.type === 'TemplateLiteral' && !node.source.expressions.length) addEdge(node.source.quasis[0].value.cooked, dynamicNames(node, parents), 'dynamic');
    if (node.type === 'CallExpression' && node.callee?.type === 'MemberExpression' && node.callee.property?.name === 'glob' && node.callee.object?.type === 'MetaProperty') {
      const a = node.arguments[0], pats = a?.type === 'ArrayExpression' ? a.elements.map((e) => e.value) : [a?.value];
      for (const pat of pats.filter(Boolean)) for (const f of globFiles(file, pat)) { const r = /\.(m?js)$/.test(f) ? { file: f } : { asset: f }; m.imports.push({ spec: pat, names: ['*'], kind: 'glob', ...r }); }
    }
    parents.push(node);
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === 'string') walkP(c, node, k); }
      else if (v && typeof v.type === 'string') walkP(v, node, k);
    }
    parents.pop();
  })(ast, null, null);
  return m;
}
function lineAt(src, i) { let n = 1; for (let k = 0; k < i; k++) if (src.charCodeAt(k) === 10) n++; return n; }

for (const f of [...srcFiles, ...scriptFiles]) mods.set(f, parseModule(f));

// ---- who imports what, by name
const usedNames = new Map(); // file -> Set(names) ('*' = all)
const importers = new Map(); // file -> Set(importer files)
for (const m of mods.values()) for (const e of m.imports) if (e.file) {
  if (!usedNames.has(e.file)) usedNames.set(e.file, new Set());
  for (const n of e.names.length ? e.names : ['(side effect)']) usedNames.get(e.file).add(n);
  if (!importers.has(e.file)) importers.set(e.file, new Set());
  importers.get(e.file).add(m.file);
}
// re-exported names pass the use on to their source
for (let pass = 0; pass < 4; pass++) for (const m of mods.values()) {
  const used = usedNames.get(m.file); if (!used) continue;
  for (const e of m.imports) if (e.kind === 'reexport' && e.file) { const into = usedNames.get(e.file) || new Set(); for (const n of e.names) if (n === '*' || used.has(n) || used.has('*')) into.add(n); usedNames.set(e.file, into); }
}

// ---- reach: from the game's root, and from the scripts
const reach = (roots, follow = () => true) => { const seen = new Set(), stack = [...roots]; while (stack.length) { const f = stack.pop(); if (seen.has(f)) continue; seen.add(f); for (const e of mods.get(f)?.imports || []) if (e.file && follow(e)) stack.push(e.file); } return seen; };
const MAIN = path.join(SRC, 'main.js');
const gameReach = reach([MAIN]);
const scriptReach = reach(scriptFiles);

// ---- cycles (Tarjan) over static imports within src/
function sccs() {
  let idx = 0; const index = new Map(), low = new Map(), on = new Set(), st = [], out = [];
  const strong = (v) => {
    index.set(v, idx); low.set(v, idx); idx++; st.push(v); on.add(v);
    for (const e of mods.get(v).imports) if (e.file && e.kind !== 'dynamic' && e.file.startsWith(SRC)) {
      if (!index.has(e.file)) { strong(e.file); low.set(v, Math.min(low.get(v), low.get(e.file))); } else if (on.has(e.file)) low.set(v, Math.min(low.get(v), index.get(e.file)));
    }
    if (low.get(v) === index.get(v)) { const c = []; let w; do { w = st.pop(); on.delete(w); c.push(w); } while (w !== v); if (c.length > 1) out.push(c.map(rel).sort()); }
  };
  for (const f of srcFiles) if (!index.has(f)) strong(f);
  return out.sort((a, b) => b.length - a.length);
}

// ---- the findings
const F = { unreached: [], scriptOnly: [], deadExports: [], localOnlyExports: [], deadLocals: [], unusedImports: [], missing: [], parse: [] };
for (const m of mods.values()) {
  if (!m.file.startsWith(SRC)) { if (m.parseError) F.parse.push({ file: m.rel, owner: m.owner, msg: m.parseError }); continue; }
  if (m.parseError) { F.parse.push({ file: m.rel, owner: m.owner, msg: m.parseError }); continue; }
  const inGame = gameReach.has(m.file);
  if (!inGame && !scriptReach.has(m.file)) F.unreached.push({ file: m.rel, owner: m.owner, lines: m.lines });
  else if (!inGame) F.scriptOnly.push({ file: m.rel, owner: m.owner, lines: m.lines, by: [...(importers.get(m.file) || [])].map(rel).filter((r) => r.startsWith('scripts/')).slice(0, 3) });
  for (const e of m.imports) if (e.missing) F.missing.push({ file: m.rel, owner: m.owner, spec: e.spec });
  const used = usedNames.get(m.file) || new Set();
  for (const [name, ex] of m.exports) {
    if (used.has('*') || used.has(name) || ex.reexport) continue;
    const localUses = ex.local ? (m.refs.get(ex.local) || 0) - 1 : 0; // (less its own declaration)
    (localUses > 0 ? F.localOnlyExports : F.deadExports).push({ file: m.rel, owner: m.owner, name, line: ex.line, localUses });
  }
  const exportedLocals = new Set([...m.exports.values()].map((x) => x.local).filter(Boolean));
  for (const d of m.topDecls) if (!exportedLocals.has(d.name) && (m.refs.get(d.name) || 0) <= 1) F.deadLocals.push({ file: m.rel, owner: m.owner, name: d.name, kind: d.kind, line: d.line, size: d.size });
  for (const i of m.importLocals) if ((m.refs.get(i.local) || 0) <= 1) F.unusedImports.push({ file: m.rel, owner: m.owner, name: i.local, from: i.from, line: i.line });
}
// methods nothing reads by name anywhere (src/ and scripts/); the names an engine calls itself are kept
const CALLED_BY_ENGINES = new Set(['onBeforeCompile', 'onBeforeRender', 'onAfterRender', 'onBeforeShadow', 'onAfterShadow', 'customProgramCacheKey', 'raycast', 'dispose', 'handleEvent', 'toJSON', 'toString', 'valueOf', 'then', 'connectedCallback', 'disconnectedCallback', 'copy', 'clone']);
const allReads = new Map();
for (const m of mods.values()) for (const [k, n] of m.propReads) allReads.set(k, (allReads.get(k) || 0) + n);
F.deadMethods = [];
for (const m of mods.values()) if (m.file.startsWith(SRC)) for (const d of m.methods) if (!allReads.has(d.name) && !CALLED_BY_ENGINES.has(d.name)) F.deadMethods.push({ file: m.rel, owner: m.owner, name: d.name, kind: d.kind, line: d.line, size: d.size });
// stale references: a file path named in a comment or a doc that no file in the tree ends with (a module moved or deleted)
const ALL_FILES = [];
(function walkAll(d) { for (const f of fs.readdirSync(d)) { if (['node_modules', '.git', 'dist', '.claude', 'worktrees'].includes(f)) continue; const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walkAll(p); else ALL_FILES.push(rel(p)); } })(ROOT);
const exists = (ref) => { const r = ref.replace(/^\.?\//, ''); return ALL_FILES.some((f) => f === r || f.endsWith('/' + r)); };
const PATH_RE = /(?<![A-Za-z0-9_.@-])((?:[a-z0-9_.-]+\/)+[A-Za-z0-9_.-]+\.(?:js|mjs|md|glb|py))(?![A-Za-z0-9_])/g;
F.staleRefs = [];
const docFiles = ALL_FILES.filter((f) => /\.md$/.test(f) && !f.startsWith('docs/handoffs/'));
for (const m of mods.values()) {
  const src = fs.readFileSync(m.file, 'utf8'); let lineNo = 0;
  for (const line of src.split('\n')) { lineNo++; const c = line.indexOf('//'); const text = c >= 0 ? line.slice(c) : /^\s*\*/.test(line) ? line : ''; for (const [, ref] of text.matchAll(PATH_RE)) if (!ref.includes('*') && !ref.startsWith('node_modules') && !exists(ref)) F.staleRefs.push({ file: m.rel, owner: m.owner, line: lineNo, ref }); }
}
for (const d of docFiles) { let lineNo = 0; for (const line of fs.readFileSync(path.join(ROOT, d), 'utf8').split('\n')) { lineNo++; for (const [, ref] of line.matchAll(PATH_RE)) if (!ref.includes('*') && !exists(ref)) F.staleRefs.push({ file: d, owner: ownerOf(d === 'docs/LORE.md' ? d : d.startsWith('docs/plans/') || d === 'docs/ECONOMY.md' || d === 'docs/DESIGN.md' ? 'src/progress/econ/x' : d === 'docs/OST.md' ? 'src/audio/x' : d), line: lineNo, ref }); } }
const cycles = sccs();

// ---- the shape: fan-in, fan-out, size
const shape = [...mods.values()].filter((m) => m.file.startsWith(SRC)).map((m) => ({ file: m.rel, owner: m.owner, lines: m.lines, fanIn: importers.get(m.file)?.size || 0, fanOut: new Set(m.imports.filter((e) => e.file).map((e) => e.file)).size }));
const totals = { modules: shape.length, lines: shape.reduce((a, s) => a + s.lines, 0), gameReached: [...gameReach].filter((f) => f.startsWith(SRC)).length, cycles: cycles.length, inCycles: cycles.reduce((a, c) => a + c.length, 0) };
for (const k of Object.keys(F)) totals[k] = F[k].length;
totals.deadLocalLines = F.deadLocals.reduce((a, d) => a + d.size, 0);
totals.deadMethodLines = F.deadMethods.reduce((a, d) => a + d.size, 0);
totals.unreachedLines = F.unreached.reduce((a, d) => a + d.lines, 0);

// ---- out
console.log('connectome:', JSON.stringify(totals));
const byOwner = {};
for (const [k, list] of Object.entries(F)) for (const x of list) { (byOwner[x.owner] ||= {}); (byOwner[x.owner][k] ||= 0); byOwner[x.owner][k]++; }
console.log('by division:', JSON.stringify(byOwner));
const edges = []; for (const m of mods.values()) if (m.file.startsWith(SRC)) for (const e of m.imports) if (e.file?.startsWith(SRC)) edges.push([m.rel, rel(e.file), e.kind]);
if (args.json) fs.writeFileSync(args.json, JSON.stringify({ totals, byOwner, findings: F, cycles, shape, edges }, null, 1));
if (args.md) {
  const L = [`# The connectome: findings by division (${new Date().toISOString().slice(0, 10)})`, '', '`node scripts/connectome.mjs --md=<path>`. Leads to read, not deletions to run: a name reached by a string looks dead here.', '', '```', JSON.stringify(totals), '```', ''];
  const sec = (title, list, fmt) => { if (!list.length) return; L.push(`### ${title} (${list.length})`, '', ...list.map((x) => `- ${fmt(x)}`), ''); };
  for (const owner of ['petra', 'dovina', 'calissa', 'wanda', 'espada']) {
    const mine = (k) => F[k].filter((x) => x.owner === owner);
    L.push(`## ${owner[0].toUpperCase() + owner.slice(1)}`, '');
    sec('Modules nothing reaches', mine('unreached'), (x) => `\`${x.file}\` (${x.lines} lines)`);
    sec('Modules only the scripts reach', mine('scriptOnly'), (x) => `\`${x.file}\` (${x.by.join(', ')})`);
    sec('Imports that go nowhere', mine('missing'), (x) => `\`${x.file}\`: ${x.spec}`);
    sec('Exports nothing imports, used by nothing (dead)', mine('deadExports'), (x) => `\`${x.file}:${x.line}\` ${x.name}`);
    sec('Top-level declarations never read (dead)', mine('deadLocals'), (x) => `\`${x.file}:${x.line}\` ${x.kind} ${x.name} (${x.size} lines)`);
    sec('Methods nothing reads by name (dead, unless reached by a computed name)', mine('deadMethods'), (x) => `\`${x.file}:${x.line}\` ${x.kind === 'prop' ? '' : x.kind + ' '}${x.name} (${x.size} lines)`);
    sec('File paths named in comments or docs that no longer exist (stale)', mine('staleRefs'), (x) => `\`${x.file}:${x.line}\` ${x.ref}`);
    sec('Imports never used', mine('unusedImports'), (x) => `\`${x.file}:${x.line}\` ${x.name} from ${x.from}`);
    sec('Exports used only in their own file (drop the export)', mine('localOnlyExports'), (x) => `\`${x.file}:${x.line}\` ${x.name}`);
  }
  L.push('## Cycles over static imports', '', ...cycles.map((c) => `- ${c.length}: ${c.join(', ')}`), '');
  fs.writeFileSync(args.md, L.join('\n'));
}
