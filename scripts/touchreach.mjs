// ---------------------------------------------------------------------------------------
// WHAT A PHONE CANNOT REACH: every verb of the bindings table (src/core/bindings.js: `ACTIONS`, `AXES`) traced to the thing on a phone
// that presses it. A verb with a keyboard key and no touch control is a verb the person on the glass never gets; a touch control no
// module draws is a row that looks reachable and is not (MOBILE.md 6.1.1: "a touch control shows only in its ctx"). Three lists, per
// ctx: (1) rows with no touch control and no home (the pause menu, a gesture, the top bar) written in the row's comment or in MOBILE.md;
// (2) rows whose touch id nothing in ui/touch/ or the drivers ever draws or presses (a bare id is a cluster tile and only the
// cluster's own list for that ctx counts; `top.<id>` and `art.<id>` are the bars' tiles; `move.*`, `swipe.*` the drivers' own); (3) tiles
// the UI draws that no row names (orphans). Each row carries the phase its section is planned for (M1 .. M3, MOBILE.md 9), so a gap
// in M1 reads apart from a verb that is simply not built yet.
//
// Dovina runs it each round and says what it lists. It reads text only (the touch UI imports fonts and three, which Node refuses), so
// the tiles are found the way the code writes them: if ui/touch/ changes how it names tiles, this goes quiet before it goes wrong; its
// numbers are a floor of what is missing, never a ceiling of what works.
//
// Prior art: unbuilt.mjs (a listener with no emitter, read the other way round: a verb with no control), a requirements traceability
// matrix (each requirement traced to what meets it), and a controller-mapping audit (every action bound on every device).
//
//   node scripts/touchreach.mjs        per ctx: the three lists, then a summary      --quiet: the summary line only
// ---------------------------------------------------------------------------------------
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname, at = (p) => join(ROOT, p);
const read = (p) => (existsSync(at(p)) ? readFileSync(at(p), 'utf8') : '');
const { ACTIONS, AXES, CTX_ORDER } = await import(new URL('../src/core/bindings.js', import.meta.url));
const quiet = process.argv.includes('--quiet');

// ---- the table's comments: each row's trailing note, and the phase its section header names (`// ---- the god hand (M1: ...`) ----
const note = {}, phaseOf = {};
{ let phase = '-';
  for (const line of read('src/core/bindings.js').split('\n')) {
    const sec = line.match(/^\s*\/\/ ----\s*(.*)$/); if (sec) { phase = sec[1].match(/\bM\d\b/)?.[0] || '-'; continue; }
    const row = line.match(/\{\s*id:\s*'(\w+)'/); if (!row) continue;
    phaseOf[row[1]] = phase; note[row[1]] = line.match(/\}\s*,?\s*\/\/\s*(.*)$/)?.[1] || '';
  } }
const phase = (r) => phaseOf[r.id] || '-';

// ---- what MOBILE.md puts elsewhere on purpose: a table line naming the key in brackets, e.g. "first person (Z) | the pause menu" ----
const mobile = read('docs/plans/MOBILE.md').split('\n');
const letterOf = (c) => (c || '').replace(/^Key|^Digit/, '');
const HOMES = [[/pause menu/i, 'the pause menu'], [/top bar/i, 'the top bar'], [/gesture|swipe|long press|pinch|two[- ]finger|\bdriver/i, 'a gesture']];
const homeOf = (text) => HOMES.find(([re]) => re.test(text))?.[1] || null;
function homeFor(r) {
  const own = homeOf(note[r.id] || ''); if (own) return `${own} (the row's comment)`;
  const k = letterOf(r.keys?.[0]); if (!k) return null;
  for (const l of mobile) {
    if (!l.startsWith('|') || !(l.includes(`(${k})`) || l.includes(`(${k},`))) continue;
    const h = homeOf(l.split('|')[2] || ''); if (h) return `${h} (MOBILE.md: ${l.split('|')[1].trim().slice(0, 40)})`;
  }
  return null;
}

// ---- the tiles the UI draws, found in its text ----
const lits = (s) => [...s.matchAll(/'([A-Za-z][\w.]*)'/g)].map((m) => m[1]);
const listIn = (src, re) => lits(src.match(re)?.[1] || '');
const cluster = read('src/ui/touch/cluster.js'), topbar = read('src/ui/touch/topbar.js'), artbar = read('src/ui/touch/artbar.js');
const ARTS = listIn(read('src/world/garden/hand.js'), /export const ARTS = \[([^\]]*)\]/);
const TOP = [...listIn(topbar, /TOP_BAR = \{\s*ids: \[([^\]]*)\]/), 'pause'];
const BAR = [...lits(artbar.match(/ids: \[([^\]]*)\]/)?.[1] || ''), ...ARTS, 'undo', ...listIn(artbar, /for \(const id of \[('turn'[^\]]*)\]\) this\.tiles\.set/)];
// the cluster: each `return` of clusterContext, with the ctx its condition names (a ride is the skiff's, the realm the garden's, else foot)
const fn = cluster.match(/export function clusterContext[\s\S]*?\n}\n/)?.[0] || '';
const IGNORE = new Set(['skiff', 'ride']), vars = {}; // (a tile held in a variable: `const boost = ... ? 'boost' : null`)
for (const m of fn.matchAll(/const (\w+) = [^;]*\?\s*'(\w+)'\s*:\s*null/g)) vars[m[1]] = m[2];
const blocks = []; { let from = 0;
  for (const m of fn.matchAll(/return\s+([^;]*);/g)) {
    const cond = fn.slice(from, m.index); from = m.index + m[0].length;
    const ids = lits(m[1]).filter((x) => !IGNORE.has(x)); for (const [v, id] of Object.entries(vars)) if (new RegExp(`\\b${v}\\b`).test(m[1])) ids.push(id);
    const ctx = /'ride'/.test(cond) ? 'skiff' : /realm/.test(cond) ? 'garden' : /god\.controlling/.test(cond) ? null : 'foot';
    if (ctx && ids.length) blocks.push({ ctx, ids });
  } }
const clusterIds = new Set(blocks.flatMap((b) => b.ids));
const ctxCovers = (b, ctx) => b === ctx || (b === 'skiff' && ctx.startsWith('skiff'));
const drawn = new Set([...clusterIds, ...TOP.map((x) => `top.${x}`), ...BAR.map((x) => `art.${x}`)]);
const walk = (d, out = []) => { for (const f of readdirSync(at(d))) { const p = join(d, f); if (statSync(at(p)).isDirectory()) walk(p, out); else if (p.endsWith('.js')) out.push(p); } return out; };
for (const f of walk('src')) for (const m of read(f).matchAll(/new TouchTile\('([\w.]+)'/g)) drawn.add(m[1]); // (any other tile made by a literal id: QAIS's REPORT)

// ---- the drivers' own pseudo-controls (a stick, a swipe, a held key): named in a driver's text as a literal ----
const DRIVERS = ['src/core/touchdriver.js', 'src/core/touchcursor.js', 'src/core/elementlongpress.js', 'src/core/stickmove.js', 'src/progress/skifftouch.js', 'src/feedback/touchshell.js', 'src/ui/touch/stick.js', 'src/ui/touch/longpress.js'];
const driverText = DRIVERS.map(read).join('\n');
// (controls that are an area or a rule, not a literal: the move and look areas, the skiff's auto-sail)
const PSEUDO = { 'move.x': /THE MOVE AREA/, 'move.y': /THE MOVE AREA/, 'look.x': /THE LOOK AREA/, 'look.y': /THE LOOK AREA/, auto: /AUTO-SAIL/ };
const byDriver = (id) => (PSEUDO[id] ? PSEUDO[id].test(driverText) : new RegExp(`['"\`]${id.replace(/\./g, '\\.')}['"\`]`).test(driverText));

// ---- the table's ids that the UI names otherwise (the shell bridges them: feedback/touchshell.js OPENS and ART, artbar.js events) ----
const ALIAS = {}; // (an id the table names that the UI draws under another: none since the garden's rows took the art bar's ids)

function reach(r) {
  const id = r.touch, via = ALIAS[id] || id;
  if (drawn.has(via)) {
    if (!clusterIds.has(via)) return via === id ? 'drawn' : `drawn as ${via}`;
    const ok = blocks.some((x) => x.ids.includes(via) && ctxCovers(x.ctx, r.ctx)); // (a bare id is the cluster's: only in the ctx it lists it for)
    return ok ? 'drawn' : `the cluster draws ${id} only for ${[...new Set(blocks.filter((x) => x.ids.includes(via)).map((x) => x.ctx))].join(', ')}`;
  }
  return byDriver(id) ? 'driver' : 'MISSING';
}

// ---- 1 and 2, per ctx ----
const ctxs = [...new Set([...CTX_ORDER, ...ACTIONS.map((r) => r.ctx)])];
const out = [], tally = { rows: 0, noTouch: 0, unhomed: 0, homed: 0, missing: 0, wrong: 0, m1: 0, bridged: 0 };
const pad = (s, n) => String(s).padEnd(n);
for (const ctx of ctxs) {
  const rows = ACTIONS.filter((r) => r.ctx === ctx); if (!rows.length) continue;
  const lines = [];
  for (const r of rows) {
    tally.rows++;
    if (!r.touch) {
      tally.noTouch++; const h = homeFor(r);
      if (h) { tally.homed++; lines.push(`  homed     ${pad(r.id, 11)} no touch id; ${h}`); }
      else { tally.unhomed++; lines.push(`  NO HOME   ${pad(r.id, 11)} no touch id, no pause-menu or gesture home; ${phase(r)}`); }
      continue;
    }
    const s = reach(r);
    if (s === 'drawn' || s === 'driver') continue;
    if (s.startsWith('drawn as')) { tally.bridged++; lines.push(`  renamed   ${pad(r.id, 11)} ${pad(r.touch, 13)} ${s}`); continue; }
    if (phase(r) === 'M1' || phase(r) === '-') tally.m1++;
    if (s === 'MISSING') {
      tally.missing++;
      const why = /^menu\./.test(r.touch) ? 'pause-menu id; nothing draws a menu row' : /^(top|art)\./.test(r.touch) ? `the ${r.touch.split('.')[0]} bar draws no such tile` : 'no module draws or presses it';
      lines.push(`  MISSING   ${pad(r.id, 11)} ${pad(r.touch, 13)} ${pad(phase(r), 2)} ${why}`);
    } else { tally.wrong++; lines.push(`  WRONG CTX ${pad(r.id, 11)} ${pad(r.touch, 13)} ${pad(phase(r), 2)} ${s}`); }
  }
  if (lines.length) out.push(`[${ctx}]  ${rows.length} rows\n${lines.join('\n')}`);
}
// the axes: a stick and a look area, the drivers' own
const axisGap = Object.entries(AXES).filter(([, a]) => a.touch && !byDriver(a.touch) && !drawn.has(a.touch)).map(([k, a]) => `${k} (${a.touch})`);

// ---- 3: tiles drawn that no row names (through the alias too) ----
const named = new Set([...ACTIONS.map((r) => r.touch).filter(Boolean).map((t) => ALIAS[t] || t), ...Object.values(AXES).map((a) => a.touch)]);
const orphans = [...drawn].filter((id) => !named.has(id)).sort();

// the pause menu is where MOBILE.md sends view, shoulder, step off, back, restart, retire and give up: is any of them built?
const PAUSE_WORDS = ['FIRST PERSON', 'SHOULDER', 'STEP OFF', 'BACK', 'RESTART', 'RETIRE', 'GIVE UP'], pauseText = read('index.html') + read('src/feedback/help/menu.js');
const pauseHas = PAUSE_WORDS.filter((w) => pauseText.includes(w)), pauseLacks = PAUSE_WORDS.filter((w) => !pauseText.includes(w));
if (!quiet) {
  const fields = [...new Set(ACTIONS.flatMap((r) => Object.keys(r)))].filter((k) => !['id', 'keys', 'mouse', 'pad', 'touch', 'ctx', 'how', 'mods'].includes(k));
  console.log(`TOUCH REACH: ${ACTIONS.length} rows of the bindings table against ${drawn.size} tiles drawn (${clusterIds.size} cluster, ${TOP.length} top bar, ${BAR.length} art bar, others by literal).`);
  console.log(fields.length ? `Rows carry marker fields: ${fields.join(', ')}.` : 'The rows carry no marker for "deliberately elsewhere" (no field beyond id, keys, mouse, pad, touch, ctx, how, mods): homes are read from each row\'s trailing comment and from MOBILE.md\'s tables.');
  console.log('Phase is the section header\'s (M1 first play .. M3 the tools; "-" the always-on rows). WRONG CTX: the tile exists, not in this ctx. renamed: the UI draws it under another id.\n');
  console.log(out.join('\n\n') || '  every row is homed or drawn.');
  console.log(`\n[axes] ${axisGap.length ? `no driver names: ${axisGap.join(', ')}` : 'every axis\'s touch control is named by a driver'}`);
  console.log(`\n[pause menu] the home of ${PAUSE_WORDS.join(', ')}: built ${pauseHas.join(', ') || 'none'}; absent from index.html and feedback/help/menu.js: ${pauseLacks.join(', ') || 'none'}`);
  console.log(`\n[orphans] tiles drawn that no row names: ${orphans.length ? orphans.join(', ') : 'none'}\n`);
}
console.log(`TOUCH REACH: ${tally.rows} rows; ${tally.noTouch} with no touch id (${tally.homed} homed, ${tally.unhomed} without a home); ${tally.missing} touch ids nothing draws or presses, ${tally.wrong} drawn only in another ctx (${tally.m1} of these in M1 or always-on rows); ${tally.bridged} renamed between table and UI; ${orphans.length} orphan tiles.`);
