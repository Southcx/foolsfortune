// ---------------------------------------------------------------------------------------
// THE PLAYTEST RUNNER: opens the game headless (seeded: ?seed=N, manual mode: the world waits between steps), and hands a scenario
// the agent interface (src/agent/agent.js) to play it through: look, act, step, check. A scenario is a module in scripts/playtest/
// that exports `name` and `async play(t)`, and ends by calling t.check(...) for each thing the slice promises (docs/plans/COOP.md, C3).
// The stress test fuzzes; a playtest plays.
//
// Prior art: Rare's automated playtests of Sea of Thieves, Unreal's Gauntlet, and an RL environment's observe/act/step.
//
//   node scripts/playtest/run.mjs well [--seed 1]      (the dev server on 5173, as for the stress test)
//   t.act(cmd) -> { ok, why }   t.look(opts) -> state   t.step(n)   t.until(fn(state) -> bool, maxTicks) -> state   t.check(what, ok, detail)
// ---------------------------------------------------------------------------------------
import { chromium } from 'playwright';
import fs from 'fs';

const args = process.argv.slice(2), name = args[0] || 'well';
const seed = +(args[args.indexOf('--seed') + 1] || 1) || 1;
const url = process.env.URL || 'http://127.0.0.1:5173/';
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const scenario = await import(`./${name}.mjs`);

const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 480, height: 300 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.addInitScript(() => { window.__noPrime = true; Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
await page.goto(`${url}?seed=${seed}`, { waitUntil: 'commit' });
for (let i = 0; i < 90; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
await page.evaluate(`document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true; __game.manual = true; __game.game.agent.observe();`);

const checks = [];
const t = {
  act: (cmd) => page.evaluate((c) => __game.game.agent.act(c), cmd),
  look: (o = {}) => page.evaluate((o) => __game.game.agent.observe(o), o),
  step: (n = 1) => page.evaluate((n) => { for (let i = 0; i < n; i++) __game.tick(1 / 60); }, n),
  /** Step until the predicate (over the state) holds, a second at a time; the last state. */
  async until(fn, max = 60 * 60) { let s; for (let n = 0; n < max; n += 60) { await t.step(60); s = await t.look(); if (fn(s)) return s; } return s; },
  check(what, ok, detail = '') { checks.push({ what, ok: !!ok, detail }); console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? `  (${detail})` : ''}`); },
  log: (...a) => console.log('   ', ...a),
};
const t0 = Date.now();
try { await scenario.play(t); } catch (e) { t.check(`the scenario ran to its end`, false, e.message); }
const bad = checks.filter((c) => !c.ok).length;
console.log(`\nplaytest ${name}, seed ${seed}: ${checks.length - bad}/${checks.length} checks passed in ${((Date.now() - t0) / 1000).toFixed(0)} s${errors.length ? `; page errors: ${errors.slice(0, 3).join(' | ')}` : ''}`);
await browser.close();
process.exit(bad || errors.length ? 1 : 0);
