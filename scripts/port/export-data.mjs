// ---------------------------------------------------------------------------------------
// PORT DATA EXPORT: every pure-data module's plain exports written as JSON for the Godot/C# port.
// Imports core/config.js (the tuning, DEFAULTS) and each module under src/progress/ (and a few pure ones elsewhere) in Node; for each,
// every export that is a plain object, array, number, string or boolean is kept (functions are dropped and listed by name, so the
// port knows a rule lives there as code). A module that will not import in Node (it reaches three.js or the DOM) is listed as skipped.
//   node scripts/port/export-data.mjs        -> PORT/data/<path>.json, PORT/data/INDEX.json
// ---------------------------------------------------------------------------------------
import { readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = new URL('../../', import.meta.url).pathname;
const OUT = join(ROOT, 'PORT/data');
globalThis.window ??= globalThis; globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.navigator ??= { userAgent: 'node' }; globalThis.document ??= undefined;

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []; });
const files = ['src/core/config.js', ...walk(join(ROOT, 'src/progress')).map((p) => relative(ROOT, p)),
  'src/core/calendar.js', 'src/core/tags.js', 'src/npc/talks.js', 'src/npc/realmnames.js', 'src/npc/neuraleseroots.js'];

// JSON with cycles, Maps, Sets and functions made safe
function plain(v, seen = new WeakSet(), depth = 0) {
  if (v === null || typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return Number.isFinite(v) || typeof v !== 'number' ? v : String(v);
  if (typeof v === 'function') return undefined;
  if (typeof v !== 'object' || depth > 14) return undefined;
  if (seen.has(v)) return '[cycle]'; seen.add(v);
  if (v instanceof Map) v = Object.fromEntries(v); else if (v instanceof Set) v = [...v];
  if (ArrayBuffer.isView(v)) v = Array.from(v);
  if (Array.isArray(v)) return v.map((x) => plain(x, seen, depth + 1) ?? null);
  const proto = Object.getPrototypeOf(v); if (proto && proto !== Object.prototype && depth === 0) return undefined; // (a class instance at the top: runtime, not data)
  const o = {}; for (const [k, x] of Object.entries(v)) { const p = plain(x, seen, depth + 1); if (p !== undefined) o[k] = p; } return o;
}

const index = { written: [], skipped: [] };
for (const f of files) {
  let mod; try { mod = await import(pathToFileURL(join(ROOT, f)).href); } catch (e) { index.skipped.push({ file: f, why: String(e.message).split('\n')[0].slice(0, 160) }); continue; }
  const data = {}, code = [];
  for (const [k, v] of Object.entries(mod)) { if (typeof v === 'function') { code.push(k); continue; } const p = plain(v); if (p !== undefined) data[k] = p; }
  if (!Object.keys(data).length) { index.skipped.push({ file: f, why: 'no data exports', code }); continue; }
  const out = join(OUT, f.replace(/^src\//, '').replace(/\.js$/, '.json'));
  mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify(data, null, 1));
  index.written.push({ file: f, json: relative(join(ROOT, 'PORT'), out), tables: Object.keys(data), code });
}
writeFileSync(join(OUT, 'INDEX.json'), JSON.stringify(index, null, 1));
console.log(`written ${index.written.length}, skipped ${index.skipped.length}`);

// the achievements are built by a function over the game (predicates over the ledger): built once against a stub and written with
// each predicate's source, so the port can see which ledger counts it reads (`cur` returns the count toward `goal`)
{
  const stub = () => new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : stub(), apply: () => stub() });
  const { buildAchievements } = await import(pathToFileURL(join(ROOT, 'src/progress/achievements.js')).href);
  const list = buildAchievements(stub()).map((a) => Object.fromEntries(Object.entries(a).map(([k, v]) => [k, typeof v === 'function' ? String(v).replace(/\s+/g, ' ').slice(0, 300) : v])));
  writeFileSync(join(OUT, 'progress/achievements.list.json'), JSON.stringify(list, null, 1));
  console.log(`achievements ${list.length}`);
}
