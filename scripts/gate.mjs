// ---------------------------------------------------------------------------------------
// THE GATE, IN ONE COMMAND: everything a branch must pass before it is handed over (docs/ARCHITECTURE.md, "The gate" and "The
// handover"), run in order, with one report to paste into the handover note. It starts its own dev server (a free port), so nothing
// else need be running; perf starts its own as it always has.
//
//   npm run gate                  check, the unbuilt report, build, stress 1 and 2, the Well playtest, the replay test, the QAIS test, the contracts, perf, the lanes
//   npm run gate -- --quick       check, build, stress 1, the contracts (a minute or two: for between commits)
//   npm run gate -- --lanes       the lanes only (BRANCH=<name> for a detached head)
//   writes gate-report.txt (the summary and each step's last lines; not committed)
//
// The lanes: the files this branch changed since it left the default branch, against the owners in CLAUDE.md ("Threads"). A file in
// another division's lane is a warning, not a failure: the handover note says why (a hub edit, a string, a handed-off fix).
//
// Prior art: a CI pipeline's stages run locally (the pre-push hook of many a studio), and Chromium's try bots: one command, one report,
// the same steps the integrator runs.
// ---------------------------------------------------------------------------------------
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createServer } from 'vite';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const quick = process.argv.includes('--quick'), lanesOnly = process.argv.includes('--lanes');
const MAIN = 'claude/fps-third-person-demo-8zp2kx';

// the lanes (CLAUDE.md, "Threads"): first match wins; the hubs are everyone's to touch a little
const LANES = [
  ['hub', /^(src\/main\.js|src\/feedback\/tracking(\.js|\/)|CLAUDE\.md|README\.md|docs\/(HANDOFFS\.md|handoffs\/|GLOSSARY\.md)|package(-lock)?\.json|scripts\/(check|perf)-baseline\.json)/],
  ['Dovina', /^(src\/progress\/(?!shop\/(shops|ui)\.js)|scripts\/(economy|combat)\.mjs|docs\/(ECONOMY|DESIGN)\.md|docs\/(plans|checklist)\/|src\/tools\/lockheart\/(table|outcomes)\.js)/],
  ['Wanda', /^(src\/audio\/|src\/music\/|src\/npc\/clayese\.js|docs\/(OST|voice_recording)\.md)/],
  ['Calissa', /^(src\/vfx\/|src\/ui\/|src\/assets\/|source_assets\/|src\/workbench\/|src\/cine\/|scripts\/(export_|bake_)|docs\/ART\.md)/],
  ['Espada', /^(docs\/LORE\.md|src\/npc\/talks\.js)/],
  ['Petra', /./],
];
const BRANCH_OF = { 'claude/dovina-design': 'Dovina', 'claude/friendly-knuth-vbv82r': 'Wanda', 'claude/calissa-art-cups': 'Calissa', 'claude/espada-lore': 'Espada', [MAIN]: 'Petra' };
const laneOf = (f) => LANES.find(([, re]) => re.test(f))[0];

const steps = [], report = [];
// (each step runs as its own process, awaited: the dev server lives in this one and must keep answering while it runs)
const exec = (cmd, args, env) => new Promise((res) => {
  const p = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, ...env } });
  let buf = '';
  p.stdout.on('data', (d) => { buf += d; }); p.stderr.on('data', (d) => { buf += d; });
  p.on('close', (code) => res({ code, buf }));
});
const run = async (name, cmd, args, env = {}) => {
  const t0 = Date.now();
  process.stdout.write(`${name.padEnd(22)} ... `);
  const r = await exec(cmd, args, env);
  const out = r.buf.trim().split('\n');
  const ok = r.code === 0, s = ((Date.now() - t0) / 1000).toFixed(0);
  // (each step's own last word: the verdict line it prints)
  const verdict = out.filter((l) => /OK|FAIL|OVER|violations|passed|exactly|differ|built in|contracts:|qais:|UNBUILT/.test(l)).slice(-1).join(' | ') || out.slice(-1)[0] || '';
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${s.padStart(4)} s  ${verdict.slice(0, 140)}`);
  steps.push({ name, ok, s, verdict });
  report.push(`## ${name}: ${ok ? 'ok' : 'FAILED'} (${s} s)`, ...out.slice(-(ok ? 8 : 40)), '');
  return ok;
};

let built = false;
if (!lanesOnly) {
  await run('check', 'node', ['scripts/check.mjs']);
  await run('unbuilt', 'node', ['scripts/unbuilt.mjs']); // (a report line, never a failure: events the log hears that nothing emits, Dovina's scripts/unbuilt.mjs; BUILD.md says which round each belongs to)
  built = await run('build', 'npx', ['vite', 'build']);
  const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5190, strictPort: false } });
  await server.listen();
  const URL_ = server.resolvedUrls.local[0], env = { URL: URL_ };
  try {
    await run('stress, seed 1', 'node', ['scripts/stress.mjs', '--seed', '1'], env);
    if (!quick) await run('stress, seed 2', 'node', ['scripts/stress.mjs', '--seed', '2', '--party'], env); // (with the five siblings: coop/)
    if (!quick) await run('playtest well', 'node', ['scripts/playtest/run.mjs', 'well'], env);
    if (!quick) await run('replay test', 'node', ['scripts/replaytest.mjs'], env);
    if (!quick) await run('qais test', 'node', ['scripts/qaistest.mjs'], env);
    await run('contracts', 'node', ['scripts/contracts.mjs'], env);
  } finally { await server.close(); }
  if (!quick && built) await run('perf', 'node', ['scripts/perf.mjs']);
}

// the lanes: what this branch changed outside its own
const git = (c) => { try { return execSync(`git ${c}`, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return ''; } };
const branch = process.env.BRANCH || git('rev-parse --abbrev-ref HEAD'), who = BRANCH_OF[branch] || null, head = git('rev-parse --short HEAD');
const base = process.env.BASE || git(`merge-base HEAD origin/${MAIN}`); // (BASE=<commit>: against another starting point)
const changed = base ? git(`diff --name-only ${base} HEAD`).split('\n').filter(Boolean) : [];
const outside = who ? changed.filter((f) => { const l = laneOf(f); return l !== who && l !== 'hub' && !(who === 'Petra'); }) : [];
const lanes = !who ? `branch ${branch}: not a division's branch, lanes not checked`
  : who === 'Petra' ? `${changed.length} files changed since the default branch (Petra's: everything not listed)`
    : outside.length ? `${outside.length} of ${changed.length} files outside ${who}'s lane (say why in the handover): ${outside.map((f) => `${f} [${laneOf(f)}]`).join(', ')}`
      : `${changed.length} files changed, all in ${who}'s lane or the hubs`;
console.log(`${'lanes'.padEnd(22)} ...      ${lanes.slice(0, 300)}`);

const failed = steps.filter((s) => !s.ok);
const summary = [
  `gate: ${branch} @ ${head}${base ? ` (from ${git(`rev-parse --short ${base}`)})` : ''}, ${new Date().toISOString().slice(0, 16)}Z${quick ? ', quick' : ''}`,
  ...steps.map((s) => `  ${s.ok ? 'ok  ' : 'FAIL'} ${s.name.padEnd(16)} ${s.verdict.slice(0, 160)}`),
  `  lanes: ${lanes}`,
  failed.length ? `\ngate: FAILED (${failed.map((s) => s.name).join(', ')})` : '\ngate: OK',
];
fs.writeFileSync(path.join(ROOT, 'gate-report.txt'), `${summary.join('\n')}\n\n${report.join('\n')}\n`);
console.log(`\n${summary.join('\n')}\n(the full report: gate-report.txt)`);
process.exit(failed.length ? 1 : 0);
