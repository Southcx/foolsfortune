// ---------------------------------------------------------------------------------------
// THE SWEEPS' HARNESS: what every room's sweep (scripts/sweeps/<room>.mjs) shares. A sweep opens the game headless, drives it through
// a room as a person would and as a careless one would, takes a screenshot at every step and prints one PASS/FAIL line a check, so a
// thing once seen wrong stays checked (the owner, 2026-10-07: "make sure this codebase can survive another thousand iterations").
// Dovina's (mechanical testing: the owner, 2026-10-07). The garden's sweep (garden.mjs) came first and is where this was lifted from.
//
//   import { open } from './harness.mjs';
//   const S = await open('dunes');                         // (the page, manual mode, the clock pinned; `S.page` is Playwright's)
//   await S.go('oasis'); S.check('id', ok, what); await S.shot('name'); await S.common('oasis');  ...  await S.done();
//
// Run one: `npm run dev &` then `node scripts/sweeps/<room>.mjs [--out dir] [--seed 1] [--quick]`; all: `node scripts/sweeps/run.mjs`.
// URL=http://host:port/ points it at a build under `vite preview`. Screenshots go to <out>/shots (default <tmp>/sweeps/<room>).
//
// Prior art: scripts/stress.mjs and scripts/playtest/game.mjs (the page opened the same way, manual mode, the clock pinned: CASEBOOK
// rule 3), Playwright's screenshot assertions, and a QA team's smoke pass (every room entered, every window opened and shut).
// ---------------------------------------------------------------------------------------
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

const argv = process.argv.slice(2);
export const args = Object.fromEntries(argv.reduce((a, x, i) => { if (x.startsWith('--')) a.push([x.slice(2), argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true]); return a; }, []));

/** The page's side: stepping, drawing, and the measures every room shares (what is on screen beyond the canvas, the camera, the
 *  Courier, the renderer's own pixels). A room's sweep adds its own with `S.page.evaluate`. */
const PAGE_JS = `
window.__sw = (() => {
  const G = __game, g = G.game, THREE = G.THREE;
  const v = (p) => p ? [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)] : null;
  const S = {
    v,
    tick(n = 1, dt = 1 / 60) { for (let i = 0; i < n; i++) G.tick(dt); },
    draw() { G.draw(); },
    dom() {
      const seam = document.getElementById('seam'), im = document.getElementById('indexmenu'), ov = document.getElementById('overlay');
      const topAt = (x, y) => { const e = document.elementFromPoint(x, y); return e ? (e.id || e.className || e.tagName) : null; };
      return {
        seam: seam ? +getComputedStyle(seam).opacity : null, overlay: ov ? ov.style.display !== 'none' : null,
        index: !!g.indexMenu?.open, page: g.indexMenu?.page?.name || null,
        pneuka: !!g.pneukaUI?.open, codex: !!g.codex?.open, map: !!g.cartography?.open,
        calibration: [...(im?.querySelectorAll('.grp') || [])].map((e) => e.textContent).filter((t) => /CALIBRATION/.test(t)).length,
        top: topAt(innerWidth / 2, innerHeight / 2),
      };
    },
    state() {
      const P = g.player, cam = G.camera, ch = g.character;
      return { player: v(P.pos), nan: !Number.isFinite(P.pos.x + P.pos.y + P.pos.z), cam: v(cam.position), camUp: v(cam.up),
        roll: +(Math.asin(new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion).y) * 180 / Math.PI).toFixed(1),
        zone: g.zones?.current, courierShown: ch?.root ? ch.root.visible !== false && !ch.hidden : null,
        layer: g.cartography?.layerOf?.(P.pos.y)?.name || null, rescues: g.player?.rescues ?? null,
        bg: g.scene.background?.isColor ? '#' + g.scene.background.getHexString() : (g.scene.background ? 'texture' : null) };
    },
    /** The renderer's own pixels: mean luminance and the share near black, four 64 px squares across the middle. */
    lum() { const gl = G.renderer.getContext(); S.draw(); const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(4 * 64 * 64); let sum = 0, dark = 0, n = 0;
      for (let k = 0; k < 4; k++) { gl.readPixels(Math.floor(w * (0.2 + 0.2 * k)) - 32, Math.floor(h / 2) - 32, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, px); for (let i = 0; i < px.length; i += 4) { const L = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]; sum += L; if (L < 8) dark++; n++; } }
      return { mean: +(sum / n).toFixed(1), dark: +(dark / n).toFixed(2) }; },
    places() { return g.places?.all?.() || []; },
  };
  return S;
})();
`;

/** Open the game for one room's sweep. Returns the sweep's kit. */
/** The dev server up, or started (detached, left running for the next sweep) when the URL answers nothing: a sweep never fails because
 *  the server died between runs. */
async function serverUp(url) {
  const ok = async () => { try { return (await fetch(url)).ok; } catch { return false; } };
  if (await ok()) return;
  if (process.env.URL) throw new Error(`nothing answers at ${url}`);
  spawn('npx', ['vite', '--port', '5173', '--strictPort'], { cwd: path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..'), detached: true, stdio: 'ignore' }).unref();
  for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await ok()) return; }
  throw new Error('the dev server did not start in 60 real seconds');
}

export async function open(room) {
  const OUT = path.resolve(args.out || path.join(os.tmpdir(), 'sweeps', room)), SHOTS = path.join(OUT, 'shots');
  fs.mkdirSync(SHOTS, { recursive: true });
  const url = process.env.URL || 'http://127.0.0.1:5173/', seed = +args.seed || 1;
  await serverUp(url);
  const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [], warnings = [], results = [];
  let shotN = 0;
  const S = { room, OUT, SHOTS, browser, errors, warnings, results, quick: !!args.quick, phase: 'boot', page: null };

  S.openPage = async () => {
    const page = S.page = await browser.newPage({ viewport: { width: 960, height: 600 } });
    page.on('pageerror', (e) => errors.push(`[${S.phase}] ${e.message}`));
    page.on('console', (m) => {
      const t = m.text().slice(0, 300);
      if (m.type() === 'error' && !/Failed to load resource/.test(t)) errors.push(`[${S.phase}] ${t}`);
      else if (m.type() === 'warning' && !/authored (ladderUp|poleSlide)|KHR_parallel_shader_compile/.test(t)) warnings.push(`[${S.phase}] ${t}`);
    });
    await page.addInitScript(() => { window.__noPrime = true; Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
    const clock = process.env.CLOCK === 'now' ? '' : `&clock=${process.env.CLOCK || 1791160275000}`; // (a game noon: CASEBOOK rule 3)
    await page.goto(`${url}?seed=${seed}${clock}`, { waitUntil: 'commit' });
    for (let i = 0; i < 150; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
    await page.evaluate(`document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true;`);
    await page.addScriptTag({ content: PAGE_JS });
    return page;
  };

  const say = (tag, id, what) => console.log(`${tag} ${id.padEnd(44)} ${typeof what === 'string' ? what : JSON.stringify(what)}`);
  /** A check: `ok` true passes, false fails; `what` is the measure, said either way. */
  S.check = (id, ok, what) => { results.push({ id, ok: !!ok, what }); say(ok ? 'PASS' : 'FAIL', id, what); return !!ok; };
  /** A measure kept with the results but judged by no one. */
  S.note = (id, what) => { results.push({ id, ok: null, what }); say('note', id, what); };
  S.ev = (fn, a) => S.page.evaluate(fn, a);
  S.sw = (expr) => S.page.evaluate(`__sw.${expr}`);
  S.ticks = async (n) => { for (let k = 0; k < n; k += 30) await S.sw(`tick(${Math.min(30, n - k)})`); };
  S.hold = async (key, n) => { await S.page.keyboard.down(key); await S.ticks(n); await S.page.keyboard.up(key); };
  S.press = async (key, n = 2) => { await S.page.keyboard.press(key); await S.ticks(n); };
  S.settle = async () => { for (let i = 0; i < 30 && await S.ev(() => !!__game.game.seam?.busy); i++) await S.ticks(6); };
  S.resume = () => S.ev(() => { document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true; });
  S.closeAll = () => S.ev(() => { const g = __game.game; g.pneukaUI?.open && g.pneukaUI.close(); g.codex?.open && g.codex.close?.(); g.cartography?.open && g.cartography.hide?.(); g.indexMenu?.open && g.indexMenu.close(); document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true; });
  /** Send the Courier to a place (`game.places`) through the agent, as the bridge does, then let the seam settle. */
  S.go = async (place) => { const r = await S.ev((p) => __game.game.agent?.act?.({ do: 'travel', place: p }) ?? { ok: false, why: 'no agent' }, place); await S.ticks(4); await S.settle(); await S.ticks(20); return r; };
  /** A screenshot of what a person sees (the DOM's covers and windows included). */
  S.shot = async (name) => { await S.page.waitForTimeout(300); await S.sw('draw()'); const f = path.join(SHOTS, `${String(++shotN).padStart(2, '0')}-${name}.png`); await S.page.screenshot({ path: f }); return f; };
  /** Mean luminance and the share near black of a screenshot as composited. */
  S.shotLum = (file) => S.ev(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = 160; c.height = 100; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 160, 100); const d = x.getImageData(0, 0, 160, 100).data; let s = 0, dark = 0; for (let i = 0; i < d.length; i += 4) { const L = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; s += L; if (L < 10) dark++; } return { mean: +(s / (d.length / 4)).toFixed(1), dark: +(dark / (d.length / 4)).toFixed(2) }; }, fs.readFileSync(file).toString('base64'));

  /** The checks every place gets: a screenshot that is not black, the camera level, the Courier finite and shown, no window left open
   *  under a cover, no calibration where it does not belong, no page error since the last call. */
  let errSeen = 0;
  S.common = async (label, { courier = true, level = true } = {}) => {
    const f = await S.shot(label), L = await S.shotLum(f), st = await S.sw('state()'), d = await S.sw('dom()');
    S.check(`${label}: not black`, L.dark < 0.9, { screen: L, file: path.basename(f) });
    if (level) S.check(`${label}: camera level`, Math.abs(st.roll) < 3 && Math.abs(st.camUp[1] - 1) < 0.01, { roll: st.roll, camUp: st.camUp }); // (off on a planetoid: its up is the planetoid's)
    S.check(`${label}: Courier finite`, !st.nan, st.player);
    if (courier) S.check(`${label}: Courier shown`, st.courierShown !== false, { courierShown: st.courierShown });
    S.check(`${label}: nothing under the seam`, !(d.seam > 0.5 && (d.index || d.pneuka || d.codex || d.map)), d);
    S.check(`${label}: no calibration off the Index`, !(d.calibration && d.page), { page: d.page, calibration: d.calibration });
    const fresh = errors.slice(errSeen); errSeen = errors.length;
    S.check(`${label}: no page errors`, !fresh.length, fresh.length ? [...new Set(fresh)].slice(0, 6) : 'none');
    return { file: f, lum: L, state: st, dom: d };
  };

  /** Close the browser, write results.json, print the tally and exit (1 on any FAIL). */
  S.done = async () => {
    S.phase = 'end';
    S.note('console warnings', warnings.length ? [...new Set(warnings)].slice(0, 12) : 'none');
    const fails = results.filter((r) => r.ok === false).length, passes = results.filter((r) => r.ok === true).length;
    console.log(`\n${room}: ${passes} passed, ${fails} failed; screenshots in ${SHOTS}`);
    fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ room, results, errors, warnings }, null, 1));
    await browser.close();
    process.exit(fails ? 1 : 0);
  };

  await S.openPage();
  return S;
}
