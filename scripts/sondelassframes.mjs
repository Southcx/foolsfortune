// The Sondelass's cutlass as frame data: every move the cutlass's combo engine plays (the 14 of cutlass.js MOVES and every row of the
// melee loadout's catalogue, sondelassloadout.js SONDELASS_MOVES), its phases in 60 Hz frames of game time (tools/movephases.js: startup,
// active, recovery, total, and today's cancel frame), read in the game itself on the dev server so the clips, the swing measure
// (tools/melee.js) and the rule rows (progress/combat/moves.js) are the engine's own. Printed as a markdown table, the default string
// (c1 .. c4) first, and written to the path given; a warped move (tools/movewarp.js) on its warped clock, with its on-hit cancel beside the
// whiff's. It measures only (docs/plans/SONDELASS-FEEL.md 3A, step 0; step 2's warp and cancel, section 10).
//
//   CHROMIUM=/path/to/chrome node scripts/sondelassframes.mjs [out.md]
//
// Prior art: Melee's frame data tables (SmashWiki) and the fighting games' published frame data (startup, active, recovery, cancel).
import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'node:fs';

const out = process.argv[2];
const server = await createServer({ root: process.cwd(), logLevel: 'error', server: { host: '127.0.0.1', port: 5232, strictPort: false } });
await server.listen();
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let code = 0;
try {
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.addInitScript(() => { Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'commit' });
  for (let i = 0; i < 180; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
  const rows = await page.evaluate(async () => {
    const g = __game.game;
    const { phasesOf } = await import('/src/tools/movephases.js');
    const { blowWeight } = await import('/src/vfx/blowfeel.js');
    const { SONDELASS_MOVES, SONDELASS_LOADOUT } = await import('/src/tools/sondelass/sondelassloadout.js');
    const M = g.techs.get('sondelass').cutlass.moves, C = g.character.clips.clips;
    for (let i = 0; i < 60 && !C.Sond_Combo1; i++) await new Promise((r) => setTimeout(r, 500)); // (the suite's clips: loaded with the pack)
    const S = M.S.strings, LABEL = { t1: 'Thrust (after 1)', t2: 'Thrust Combo (after 1)', j1: 'Wide Arc 1 (after 2)', j2: 'Wide Arc 2 (after 2)', j3: 'Wide Arc 3 (after 2)', up: 'Launcher', a1: 'Air Cut 1', a2: 'Air Cut 2', a3: 'Plunge', dash: 'Dash Slash', hold: 'Charge (held)', burst: 'Charged Slash', spin: 'Counter', iai: 'Draw Cut' };
    const KIND = { t1: 'pause', t2: 'pause', j1: 'pause', j2: 'pause', j3: 'pause', up: 'launcher', a1: 'air', a2: 'air', a3: 'air', dash: 'dash', hold: 'charge-hold', burst: 'charge', spin: 'counter', iai: 'iaido' };
    const string = SONDELASS_LOADOUT.string, last = string[string.length - 1];
    const FREE = new Set([last, 't2', 'j3', S.dash, S.charge.release]); // (no next: the free recovery cut, moveset.js freeCutOpen)
    const ids = [...string, ...Object.keys(SONDELASS_MOVES).filter((id) => !string.includes(id)), ...Object.keys(M.S.moves)];
    return ids.map((id) => {
      const row = SONDELASS_MOVES[id], def = M.def(id), kind = row ? (row.kind === 'special' ? 'special' : 'ground') : KIND[id];
      const base = { id, label: row?.label || LABEL[id] || id, clip: row?.clip || def?.clip || '', kind };
      if (!def) { const st = row?.sting; return { ...base, body: 'whole', own: true, note: st ? `played by cutlass.js: a ${Math.round(st.dash * 60)}-frame lunge at ${st.speed} m/s` : 'not on the engine', power: row?.stats?.power }; }
      const ph = phasesOf(M, id, FREE.has(id) ? { way: 'free' } : {}), R = M.rule(def);
      const c = { def, kind, last: kind === 'ground' && id === last };
      return { ...base, body: def.body === 'whole' ? 'whole' : 'upper', ...ph, lunge: def.lunge ?? null, power: R?.power ?? def.hit?.power ?? null, weight: def.hit ? blowWeight(c, def.hit) : null, plunge: !!def.plunge, rule: def.rule || null };
    });
  });
  if (errs.length) console.error('page errors:', errs.slice(0, 5).join(' | '));
  const f = (v) => (v == null ? '-' : v);
  const head = '| id | label | clip | kind | body | startup | active | recovery | total | cancel | cancel / total | on-hit cancel | lunge | power | weight |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |';
  const lines = rows.map((r) => r.own
    ? `| ${r.id} | ${r.label} | ${r.clip} | ${r.kind} | ${r.body} | - | - | - | - | - | - | - | - | ${f(r.power)} | - |`
    : `| ${r.id} | ${r.label} | ${r.clip} | ${r.kind} | ${r.body} | ${r.startup}${r.hits.length > 1 ? ` (hits on ${r.hits.join(', ')})` : ''} | ${r.active} | ${r.recovery} | ${r.total} | ${f(r.cancel)}${r.lateCancel ? ' (end)' : ''} | ${r.cancelShare == null ? '-' : `${Math.round(r.cancelShare * 100)}%`} | ${r.cancelHit == null ? '-' : `${r.cancelHit} (${Math.round(r.hitShare * 100)}%)`} | ${f(r.lunge)} | ${f(r.power)}${r.hits.length > 1 ? ` x${r.hits.length}` : ''} | ${f(r.weight)} |`);
  const notes = rows.filter((r) => r.own || r.plunge).map((r) => `- ${r.id}: ${r.own ? r.note : 'a plunge: its fall holds the clip at its hold until the ground, so its frames after the hold are the landing\'s, not the press\'s'}`);
  const md = `${head}\n${lines.join('\n')}\n\n${notes.join('\n')}\n`;
  console.log(md);
  if (out) { fs.writeFileSync(out, md); console.log(`wrote ${out}: ${rows.length} moves`); }
} catch (e) { console.error(e); code = 1; }
await browser.close(); await server.close();
process.exit(code);
