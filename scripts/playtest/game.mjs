// ---------------------------------------------------------------------------------------
// THE GAME, HEADLESS, FOR AN AGENT: opens the game in a headless browser (seeded: ?seed=N; manual mode: the world waits between steps)
// and gives back the agent interface (src/agent/agent.js) as calls from Node. The playtest runner (run.mjs) and the bridge
// (scripts/agent.mjs) both open it here, so a scenario and a session play the same game the same way.
//
//   const g = await openGame({ seed, query?, before?(page) })   g.act(cmd) -> { ok, why }   g.look(opts) -> state   g.step(n)   g.until(fn, maxTicks) -> state
//   g.errors (the page's)   g.reloads (times the page was reloaded under it: the game started over)   g.close()
// ---------------------------------------------------------------------------------------
import { chromium } from 'playwright';
import fs from 'fs';

export async function openGame({ seed = 1, query = '', before = null, url = process.env.URL || 'http://127.0.0.1:5173/' } = {}) {
  const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 480, height: 300 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => { window.__noPrime = true; Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
  if (before) await before(page); // (what the page must find when it boots: a replay's save, say)
  await page.goto(`${url}?seed=${seed}${query}`, { waitUntil: 'commit' });
  // (ready: booted, the title's overlay away, the keys ours, the world waiting. Run again whenever the page was reloaded under us: the
  // dev server reloads it when a file changes, and a reloaded game starts over from the seed, which `reloads` counts)
  let reloads = -1;
  const ready = async () => {
    if (await page.evaluate('!!window.__agentReady').catch(() => false)) return;
    for (let i = 0; i < 90; i++) { if (await page.evaluate('!!window.__ready').catch(() => false)) break; await new Promise((r) => setTimeout(r, 1000)); }
    await page.evaluate(`document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true; __game.manual = true; __game.game.agent.observe(); window.__agentReady = true;`);
    reloads++;
  };
  await ready();
  const g = {
    seed, errors, page, get reloads() { return reloads; },
    act: async (cmd) => { await ready(); return page.evaluate((c) => __game.game.agent.act(c), cmd); },
    look: async (o = {}) => { await ready(); return page.evaluate((o) => __game.game.agent.observe(o), o); },
    step: async (n = 1) => { await ready(); return page.evaluate((n) => { for (let i = 0; i < n; i++) __game.tick(1 / 60); }, n); },
    /** Step until the predicate (over the state) holds, a second at a time; the last state. */
    async until(fn, max = 60 * 60) { let s; for (let n = 0; n < max; n += 60) { await g.step(60); s = await g.look(); if (fn(s)) return s; } return s; },
    close: () => browser.close(),
  };
  return g;
}
