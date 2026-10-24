// ---------------------------------------------------------------------------------------
// WHAT CAN NEVER BE EARNED: every achievement (and so every art, which is one: `art_<id>`) and every knack whose ledger keys are never
// written by anything in the game. unbuilt.mjs finds an event listened for and never emitted; this is its twin one step on: a key read
// and never written (src/progress/stats.js: `inc`, `hi`, `lo`, `first`), so the thing it gates is dead content the owner would grind
// toward and never get (the sk4 case: a Margarite fog nothing counts). Dovina runs it each round and says what it lists; Petra may put
// it in the gate.
//
// How: the predicates are the game's own (buildAchievements, KNACKS), run against a SATURATED ledger: a key that some write could reach is
// huge (a `lo` record tiny), any other key is zero, `under`/`firstCount` see only keys some write could reach. A thing still false is
// dead, and the keys it read that nothing writes are named. This reads AND/OR/min/sum as the code does, with no parse of the predicates.
// The writes are found by text (`.inc('k'`, `.hi(`, `.lo(`, `.first(`, a template `${..}` a wildcard, a local wrapper such as
// `chained('chain.blink2'` followed by its name). A write whose key is no literal (`L.inc(key)`) is listed as unresolved, never guessed.
//
// Prior art: a dead-code / unused-symbol report (knip, ts-prune) read the other way round (not "defined, never used" but "read, never
// defined"), and the mutation-testing idea of running the real predicate against a model of the state.
//
//   node scripts/reachable.mjs        lists each thing that can never be earned, then the unresolved   --quiet: the count only
//                                     --strict: a template write counts for nothing (what then fails is reached only through one)
// ---------------------------------------------------------------------------------------
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { register } from 'node:module';
// (the circuits' file imports the UI's art: let Node read an asset as an empty string, as vite would hand its URL)
register('data:text/javascript,' + encodeURIComponent("export async function load(u, c, n) { return /\\.(woff2?|ttf|png|webp|jpe?g|gif|svg|glb|mp3|ogg|wav|json5?)(\\?|$)/.test(u) && !/\\.json$/.test(u) ? { format: 'module', source: 'export default \"\"', shortCircuit: true } : n(u, c); }"));

const root = new URL('..', import.meta.url).pathname;
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p); } };
walk(join(root, 'src'));
const rel = (f) => f.replace(root, '');
const text = Object.fromEntries(files.map((f) => [f, readFileSync(f, 'utf8')]));

// ---- the writes -----------------------------------------------------------------------
const KINDS = ['inc', 'hi', 'lo', 'first'];
const W = Object.fromEntries(KINDS.map((k) => [k, { lit: new Set(), pat: [] }]));
const dynamic = []; // writes whose key is no literal: { file, line, expr }
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** The first argument of the call whose `(` is at i: walks to the comma or close at depth 0, minding strings and templates. */
function firstArg(s, i) {
  let d = 0, q = null;
  for (let j = i + 1; j < s.length; j++) {
    const c = s[j];
    if (q) { if (c === '\\') j++; else if (c === q) q = null; else if (q === '`' && c === '$' && s[j + 1] === '{') { let n = 1; j += 2; while (j < s.length && n) { if (s[j] === '{') n++; else if (s[j] === '}') n--; j++; } j--; } continue; }
    if (c === "'" || c === '"' || c === '`') q = c;
    else if ('([{'.includes(c)) d++;
    else if (')]}'.includes(c)) { if (d === 0) return s.slice(i + 1, j); d--; } else if (c === ',' && d === 0) return s.slice(i + 1, j);
  }
  return s.slice(i + 1, i + 80);
}
function note(kind, arg, file, at) {
  const a = arg.replace(/['"][^'"]*['"]\s*[!=]==?|[!=]==?\s*['"][^'"]*['"]/g, ''); // ('debug' in `why === 'debug' ? 'cube.debug' : ..` is a test, not a key)
  const lits = [...a.matchAll(/'([^'\\]*)'|"([^"\\]*)"|`([^`]*)`/g)].map((m) => m[1] ?? m[2] ?? m[3]);
  const cat = /['"`]\s*\+|\+\s*['"`]/.test(a);
  let made = 0;
  for (const l of lits) {
    if (!l) continue;
    if (!/\$\{/.test(l) && !cat) { W[kind].lit.add(l); made++; continue; }
    const body = cat && !/\$\{/.test(l) ? `${l}\${}` : l, parts = body.split(/\$\{[^}]*\}/);
    if (parts.every((p) => !p)) continue; // (a bare `${x}`: no key to name)
    const re = new RegExp(`^${parts.map(esc).join('.+')}$`);
    W[kind].pat.push({ re, sample: parts.join('x'), head: parts[0] }); made++;
  }
  if (!made) dynamic.push({ file: rel(file), line: text[file].slice(0, at).split('\n').length, expr: `${kind}(${arg.trim().slice(0, 40)})` });
}
for (const f of files) {
  const s = text[f], wrap = {}; // wrap: local helper name -> kind
  const defs = [...s.matchAll(/const\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/g)].map((m) => ({ name: m[1], params: m[2], at: m.index }));
  const pending = [];
  for (const m of s.matchAll(/\.(inc|hi|lo|first)\(/g)) {
    const arg = firstArg(s, m.index + m[0].length - 1), id = arg.trim();
    const d = /^\w+$/.test(id) && defs.filter((x) => x.at < m.index && new RegExp(`\\b${id}\\b`).test(x.params)).pop();
    if (d) { wrap[d.name] = m[1]; continue; } // (`const first = (key, text) => { if (L.first(key)) ..`: the helper's calls are the writes)
    pending.push([m[1], arg, m.index]);
  }
  for (const [k, arg, at] of pending) note(k, arg, f, at);
  for (const [name, kind] of Object.entries(wrap)) for (const m of s.matchAll(new RegExp(`(?<![\\w.])${name}\\(`, 'g'))) note(kind, firstArg(s, m.index + m[0].length - 1), f, m.index);
}
// writes that name a table instead of a literal, resolved by importing the table (the drills' KEYS, the stelae's ids)
const { DRILLS, KEYS } = await import('../src/progress/combat/testroom.js');
const { STELAE } = await import('../src/progress/ostraca.js');
const RESOLVE = [
  [/KEYS\.runs/, () => Object.keys(DRILLS).map(KEYS.runs)], [/KEYS\.best/, () => Object.keys(DRILLS).map(KEYS.best)],
  [/KEYS\.medal/, () => Object.entries(DRILLS).flatMap(([id, D]) => Object.keys(D.medals).map((m) => KEYS.medal(id, m)))], [/\(e\.stele\)/, () => STELAE.map((x) => x.id)],
];
for (let i = dynamic.length - 1; i >= 0; i--) {
  const r = RESOLVE.find(([re]) => re.test(dynamic[i].expr)); if (!r) continue;
  for (const k of r[1]()) W[dynamic[i].expr.split('(')[0]].lit.add(k);
  dynamic.splice(i, 1);
}
const STRICT = process.argv.includes('--strict'); // (a template counts for nothing: what is left is what only a template reaches)
const wrote = (kinds, k) => kinds.some((kd) => W[kd].lit.has(k) || W[kd].pat.some((p) => !STRICT && p.re.test(k)));
const BIG = 1e9, TINY = 0.001;

// ---- the saturated ledger ---------------------------------------------------------------
class Probe {
  constructor() {
    this.reads = []; this.play = BIG; this.sessions = BIG; this.done = {}; this.version = 0;
    const view = (via, f) => new Proxy({}, { get: (_, k) => (typeof k === 'string' ? f.call(this, k) : undefined) }); // (`L.firsts[k]`, `L.rec[k]`, `L.life[k]` read raw)
    this.firsts = view('has', (k) => (this.has(k) ? 0 : undefined)); this.life = view('get', (k) => this.get(k)); this.rec = view('best', (k) => { const v = this.best(k); return v === undefined ? undefined : { v }; });
  }
  note(via, key, ok) { this.reads.push({ via, key, ok }); }
  get(k) { const ok = wrote(['inc'], k); this.note('get', k, ok); return ok ? BIG : 0; }
  session(k) { return this.get(k); }
  best(k) { const hi = wrote(['hi'], k), lo = wrote(['lo'], k); this.note('best', k, hi || lo); return hi ? BIG : lo ? TINY : undefined; }
  has(k) { const ok = wrote(['first'], k); this.note('has', k, ok); return ok; }
  keysUnder(kinds, p) {
    const out = new Set(); // (a template reaches a prefix if it can be made to start with it: `bestiary.u.${c}` can be `bestiary.u.fish.x`)
    for (const kd of kinds) { for (const k of W[kd].lit) if (k.startsWith(p)) out.add(k); for (const x of STRICT ? [] : W[kd].pat) for (let i = 0; i < 200; i++) for (const k of [x.sample.replace(/x/g, `x${i}`), `${p}x${i}`]) if (k.startsWith(p) && x.re.test(k)) out.add(k); }
    return [...out];
  }
  under(p) { const ks = this.keysUnder(['inc'], p); this.note('under', `${p}*`, ks.length > 0); return ks.map((k) => [k, BIG]); }
  firstCount(p = '') { const ks = this.keysUnder(['first'], p); this.note('firstCount', `${p}*`, ks.length > 0); return ks.length; }
}
// a game that answers anything: a touch of it is noted, since what it holds is not the ledger's
const touched = { n: 0 };
const any = () => new Proxy(function () {}, {
  get: (_, p) => { touched.n++; return p === Symbol.toPrimitive ? () => 1 : p === Symbol.iterator ? function* () {} : any(); },
  apply: () => { touched.n++; return true; },
});
const { CIRCUIT_DEFS } = await import('../src/world/basement/circuits.js'); // (the one thing the list is built from: a circuit's three medals and a flawless)
const base = any();
const game = new Proxy(base, { get: (t, p) => (p === 'circuits' ? { defs: new Map(CIRCUIT_DEFS.map((d) => [d.id, d])) } : p === 'techs' ? (touched.n++, { list: [] }) : p === 'cartography' ? { anchors: [] } : t[p]) });
const { buildAchievements, TIERS } = await import('../src/progress/achievements.js');
const { KNACKS } = await import('../src/progress/knacks.js');

const items = [];
const list = buildAchievements(game);
for (const a of list) items.push({ id: a.id, what: a.unlocks ? 'art' : 'achievement', tier: TIERS[a.tier]?.name, name: a.name, run: (L) => { const v = a.cur(L, game, { count: () => BIG }); return a.dir === 'down' ? a.goal / v >= 1 - 1e-9 : v / a.goal >= 1 - 1e-9; } });
for (const [id, k] of Object.entries(KNACKS)) items.push({ id, what: 'knack', name: k.name, run: (L) => !!k.opens(L) });
const home = (it) => (it.what === 'knack' ? 'src/progress/knacks.js' : it.what === 'art' ? 'src/progress/skills.js' : ['achievements', 'raceachievements', 'sealachievements', 'spreadachievements'].map((n) => `src/progress/${n}.js`).find((f) => new RegExp(`\\(\\s*['"\`]${esc(it.id)}['"\`]`).test(text[join(root, f)] || '')) || 'src/progress/achievements.js');

const dead = [], unresolved = [];
let n = 0;
for (const it of items) {
  n++;
  const L = new Probe(); touched.n = 0;
  let ok;
  try { ok = it.run(L); } catch (e) { unresolved.push({ it, why: `the predicate threw on the probe (${String(e.message).slice(0, 60)})` }); continue; }
  if (ok) continue;
  const byKey = new Map();
  for (const r of L.reads) { const e = byKey.get(r.key) || { ok: false, vias: new Set() }; e.ok ||= r.ok; e.vias.add(r.via); byKey.set(r.key, e); }
  const missing = [...byKey].filter(([, e]) => !e.ok).map(([k, e]) => {
    const other = KINDS.filter((kd) => W[kd].lit.has(k) || W[kd].pat.some((p) => p.re.test(k.replace(/\*$/, 'x'))));
    return `${k} (read by ${[...e.vias].join('/')}${other.length ? `; only written by ${other.join('/')}` : ''})`;
  });
  if (missing.length) dead.push({ it, missing });
  else unresolved.push({ it, why: touched.n ? 'false on the saturated ledger and it asks the game, not only the ledger' : 'false on the saturated ledger though every key it reads is written (an upper bound, a ratio?)' });
}
if (process.argv.includes('--quiet')) { console.log(dead.length); process.exit(0); }
console.log(`REACHABLE: ${n - dead.length - unresolved.length} of ${n} achievements, arts and knacks can be earned; ${dead.length} cannot (${unresolved.length} unresolved)\n`);
if (dead.length) console.log('CANNOT BE EARNED: it reads a ledger key nothing writes');
for (const { it, missing } of dead) console.log(`  ${it.id}  [${it.what}${it.tier ? `, ${it.tier}` : ''}]  ${it.name}\n    reads, never written: ${missing.join('; ')}\n    ${home(it)}`);
if (unresolved.length) console.log('\nUNRESOLVED: the probe cannot say');
for (const { it, why } of unresolved) console.log(`  ${it.id}  [${it.what}${it.tier ? `, ${it.tier}` : ''}]  ${it.name}: ${why}\n    ${home(it)}`);
if (dynamic.length) console.log(`\nWRITES NOT RESOLVED (${dynamic.length}): the key is no literal, so any of these may write a key listed above`);
for (const d of dynamic) console.log(`  ${d.file}:${d.line}  ${d.expr}`);
