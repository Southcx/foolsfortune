// ---------------------------------------------------------------------------------------
// ALL THE SWEEPS (scripts/sweeps/*.mjs, the harness's rooms): each run in turn against the dev server, its tally kept, one table at the
// end. Exit 1 if any sweep failed a check. Dovina's (mechanical testing).
//
//   npm run dev &   then   node scripts/sweeps/run.mjs [room ...] [--quick]      (no rooms: every sweep)
// ---------------------------------------------------------------------------------------
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const want = process.argv.slice(2).filter((a) => !a.startsWith('--')), flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
const rooms = fs.readdirSync(here).filter((f) => f.endsWith('.mjs') && !['harness.mjs', 'run.mjs'].includes(f)).map((f) => f.slice(0, -4))
  .filter((r) => !want.length || want.includes(r));
const rows = [];
for (const room of rooms) {
  const t0 = Date.now();
  const r = spawnSync('node', [path.join(here, `${room}.mjs`), ...flags], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], timeout: 40 * 60e3 });
  const out = r.stdout || '';
  process.stdout.write(out);
  const pass = (out.match(/^PASS /gm) || []).length, fail = (out.match(/^FAIL /gm) || []).length;
  rows.push({ room, pass, fail, exit: r.status, seconds: Math.round((Date.now() - t0) / 1000), failed: out.split('\n').filter((l) => l.startsWith('FAIL ')).map((l) => l.slice(5, 49).trim()) });
}
console.log('\nroom          pass  fail  real s');
for (const r of rows) console.log(`${r.room.padEnd(13)} ${String(r.pass).padStart(4)}  ${String(r.fail).padStart(4)}  ${String(r.seconds).padStart(6)}${r.exit !== 0 && !r.fail ? '  (crashed: exit ' + r.exit + ')' : ''}`);
process.exit(rows.some((r) => r.exit !== 0) ? 1 : 0);
