// ---------------------------------------------------------------------------------------
// WHAT IS SPECIFIED BUT NOT BUILT: every event a tracking rule listens for (src/feedback/tracking.js and tracking/*.js: `on('x', ...)`)
// that nothing in the game emits (`emit('x'`). A rule with no emitter is a feature designed, handed off and never wired, so the owner
// would play the build and find it missing (the owner, 2026-10-07: "Is stuff getting lost in translation on the way to Petra?" The
// Great Dunemaw's crown, nursery and finds were: their events are listened for and never emitted). Dovina runs it each round and
// says what it lists; Petra may put it in the gate.
//
// Prior art: a test coverage report, read the other way round (not "what code is untested" but "what design is uncoded"), and a
// requirements traceability matrix (every requirement traced to the thing that meets it).
//
//   node scripts/unbuilt.mjs        lists each unemitted event with the rule's file      --quiet: the count only
// ---------------------------------------------------------------------------------------
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p); } };
walk('src');
const text = Object.fromEntries(files.map((f) => [f, readFileSync(f, 'utf8')]));
const rules = files.filter((f) => f.includes('feedback/tracking'));
const heard = new Map(); // event -> [rule files]
for (const f of rules) for (const m of text[f].matchAll(/\bon\(\s*'([a-z][\w.]*)'/g)) { if (!heard.has(m[1])) heard.set(m[1], new Set()); heard.get(m[1]).add(f.replace('src/', '')); }
const emitted = new Set();
for (const f of files) for (const m of text[f].matchAll(/emit\??\.?\(?\s*'([a-z][\w.]*)'/g)) emitted.add(m[1]);
// (an event emitted through a variable name is invisible here: `emit(name, ...)`; such emitters name their events in a comment or a
//  table, so a string literal of the event anywhere outside the rules counts as emitted)
const named = (ev) => files.some((f) => !f.includes('feedback/tracking') && !f.endsWith('progress/achievements.js') && !f.endsWith('feedback/codex/ledger.js') && /emit/.test(text[f]) && text[f].includes(`'${ev}'`)); // (achievements and the ledger's page name ledger keys, which share events' names)
const missing = [...heard.keys()].filter((ev) => !emitted.has(ev) && !named(ev)).sort();
if (process.argv.includes('--quiet')) { console.log(missing.length); process.exit(0); }
console.log(`UNBUILT: ${missing.length} of ${heard.size} events the log listens for are emitted by nothing in the game.\n`);
const by = {};
for (const ev of missing) for (const f of heard.get(ev)) (by[f] ||= []).push(ev);
for (const [f, evs] of Object.entries(by).sort()) console.log(`  ${f}\n    ${evs.join(', ')}`);
