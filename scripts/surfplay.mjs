// ---------------------------------------------------------------------------------------
// THE WAVE RIDING PLAYTEST (headless): the surf ride and the slope ride driven by a simple pilot, scenario by scenario, each from a fresh
// placing, reporting the events each fired. Not a sweep (the mechanics are in flux): a probe for the builder's one look and for South's
// "does it work" before play. Scenarios:
//   barrel   set in the pocket, stall into the tube, hold the line and the balance, pump when deep: a made tube wants skiff.tube.exit made
//   pump     on the shoulder's face, W in rhythm: skiff.surf.pump
//   lip      set in the tube and driven up the face under the lip: a wipeout, skiff.bail { why: 'lip' }
//   human    ten tries driven like a person (W / A / D / S, a quarter second's reaction, taps): how many make the tube
//   slope    off the slope's crest down the face: an edge, a hop with a pre-wind countered, landings graded; a butter on the bench
// A shot of the barrel cam's view is taken while covered (shots/surfplay-barrel.png).
//   node scripts/surfplay.mjs [outDir] [--only barrel,pump] [--phone [--throttle: the first-draw budget left on, 60 frames drawn before the shot]]
// Prior art: the surf builder's probe (the pocket's placing, the barrel's frame), scripts/wavepool-shot.mjs (the manual frame).
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium, devices } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : fs.mkdtempSync(path.join(os.tmpdir(), 'surfplay-')));
const oi = process.argv.indexOf('--only'), only = oi > 0 ? process.argv[oi + 1].split(',') : null;
fs.mkdirSync(out, { recursive: true });
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5198, strictPort: false } });
await server.listen();
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = [], report = {};
try {
  const phone = process.argv.includes('--phone'); // (an iPhone XR held landscape, 896 x 414 at 2x, its renderer named Apple's so it boots the phone's tier)
  const page = await (await browser.newContext(phone ? { ...devices['iPhone XR landscape'] } : { viewport: { width: 1280, height: 720 } })).newPage();
  if (phone) await page.addInitScript(() => { for (const P of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) { const gp = P.getParameter; P.getParameter = function (k) { return k === 0x9246 ? 'Apple GPU' : k === 0x9245 ? 'Apple Inc.' : gp.call(this, k); }; } });
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 240)); });
  await page.addInitScript(() => { Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
  await page.goto(`${server.resolvedUrls.local[0]}?seed=1&clock=1791160275000${phone && !process.argv.includes('--throttle') ? '&firstdraws=0' : ''}`, { waitUntil: 'commit' }); // (the phone's first-draw budget admits a few new materials a frame: a shot from a manual frame or two would be near empty, render/firstdraws.js)
  for (let i = 0; i < 300; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
  await page.evaluate(`document.getElementById('overlay') && (document.getElementById('overlay').style.display = 'none'); __game.input.enabled = true;`);
  await page.evaluate(async () => {
    const G = __game, g = G.game;
    window.__keys = new Set(); g.input.isDown = (c) => __keys.has(c);
    window.__ev = []; for (const n of ['skiff.surf', 'skiff.surf.pump', 'skiff.surf.turn', 'skiff.tube.enter', 'skiff.tube.exit', 'skiff.submarine', 'skiff.bail', 'skiff.slope', 'skiff.edge.skid', 'skiff.butter', 'skiff.slope.land', 'skiff.buoy', 'skiff.surf.drag']) g.events.on(n, (e) => __ev.push(n + ' ' + JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k]) => k !== 'name' && k !== 't' && k !== 'by')))));
    g.places.travel('wavepool');
    let f = 0; do { G.tick(1 / 30); f++; if (f % 5 === 0) await new Promise((q) => setTimeout(q, 0)); } while ((g.seam?.busy || !g.raceway?.built) && f < 1500);
    for (let i = 0; i < 30; i++) G.tick(1 / 60);
  });
  // ---- set the board on the wave at (s, d as a share of F), along the crest, at speed
  const placeOnWave = (s, dK, speed, t = 19.3) => page.evaluate(async ({ s, dK, speed, t }) => {
    { const sk0 = __game.game.player.techs.get('skiff'); sk0.skiff?.load?.(__game.game); for (let i = 0; i < 200 && !sk0.skiff?.ready; i++) await new Promise((q) => setTimeout(q, 100)); } // (the board's model loaded: a ride begun before it rides an undrawn board)
    const G = __game, g = G.game, P = g.player, R = g.raceway, S = R.surf, W = S.S, PO = W.POOL, RW = { x: 6000, z: 0 };
    S.t = t; const st = W.state(t), ax = W.axes, F = W.WAVE.face, d = dK * F, u = st.ub + s * st.tu + d * st.nu, v = PO.vb + s * st.tv + d * st.nv, du = u - PO.L / 2, dv = v - PO.W / 2;
    const wx = RW.x + PO.x + du * ax.ux + dv * ax.vx, wz = RW.z + PO.z + du * ax.uz + dv * ax.vz, cx = st.tu * ax.ux + st.tv * ax.vx, cz = st.tu * ax.uz + st.tv * ax.vz;
    g.course.teleport(new P.pos.constructor(wx, R.rideHeight(wx, wz) + 0.7, wz), Math.atan2(cx, cz));
    P.vel.set(cx * speed, 0, cz * speed);
    const sk = P.techs.get('skiff'); if (sk.phase !== 'ride') sk.mount(); G.tick(1 / 60);
    for (let i = 0; i < 120 && !sk.active; i++) { sk.mount(); G.tick(1 / 60); } // (the board summoned under them, as the Y press does)
    sk.heading = Math.atan2(cx, cz); sk.v.set(cx * speed, 0, cz * speed); sk.rideT = 5; __ev.length = 0; window.__dbg = { active: sk.active, phase: sk.phase, cur: P.techs.active?.id ?? P.techs.active?.constructor?.name }; return true;
  }, { s, dK, speed, t });
  // ---- the surf pilot: hold the line along the crest at an ideal height, answer the balance, stall when shallow, pump when deep
  const surfPilot = (secs, opt) => page.evaluate(async ({ secs, opt }) => {
    const G = __game, g = G.game, P = g.player, S = g.raceway.surf, sk = P.techs.get('skiff'), rows = [], wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    let shot = false, pumpW = 0;
    for (let i = 0; i < secs * 60; i++) {
      __keys.clear();
      const f = S.frame(P.pos.x, P.pos.z), su = sk.surf;
      if (sk.phase === 'ride' && f && f.H > 0.5) {
        const hrf = f.h / f.H, aim = opt.climb ? 0.95 : opt.ideal ?? 0.4, tilt = Math.max(-0.6, Math.min(0.6, (hrf - aim) * 2.2)); // (+: down the face)
        const want = Math.atan2(f.crest.x + f.travel.x * tilt, f.crest.z + f.travel.z * tilt), dh = wrap(sk.heading - want);
        if (!opt.climb && Math.abs(su.balance) > 0.3) __keys.add(su.balance > 0 ? 'KeyA' : 'KeyD'); else if (Math.abs(dh) > 0.06) __keys.add(dh > 0 ? 'KeyD' : 'KeyA');
        if (opt.stall && su.k < 0.3 && f.s > -6) __keys.add('KeyS');
        if (opt.pump && su.onFace && f.s < (opt.pumpFrom ?? 99)) { pumpW += 1 / 60; if (pumpW > 0.42) pumpW = 0; if (pumpW < 0.1) __keys.add('KeyW'); }
      }
      G.tick(1 / 60);
      if (i % (opt.every || 15) === 0) rows.push([i, sk.phase, sk.surf.tube ? 'T' : '-', +((f?.d ?? 0) / (f?.F || 1)).toFixed(2), f?.zone, +(f?.s ?? 0).toFixed(1), +(sk.surf.hr).toFixed(2), +sk.surf.cover.toFixed(2), +sk.surf.k.toFixed(2), +sk.surf.balance.toFixed(2), +sk.speed.toFixed(1)].join(' '));
      if (opt.shot && !shot && sk.surf.cover > 0.8 && g.cinema?.reqs?.has?.('barrel') && (g.cinema?.cam?.dist ?? 0) < 0.62) { shot = true; if (opt.nolip && g.wavePoolLook?.parts) { g.wavePoolLook.parts.lip.mesh.visible = false; g.wavePoolLook.parts.water.near.visible = false; } for (let k = 0; k < (opt.warm || 2); k++) G.draw(); window.__shot = true; const skb = sk.skiff?.group; window.__board = skb ? { drag: +(sk.surf.drag?.w ?? 0).toFixed(2), side: sk.surf.drag?.side, hand: sk.surf.drag ? +(sk.surf.drag.gap ?? -1).toFixed(2) : null, vis: skb.visible, y: +(skb.getWorldPosition(new G.THREE.Vector3()).y + 420).toFixed(2), water: +(g.raceway.rideHeight(P.pos.x, P.pos.z) + 420).toFixed(2), py: +(P.pos.y + 420).toFixed(2) } : null; const W = g.wavePoolLook, c = g.camera; window.__lookDbg = { near: W.near, vis: W.group?.visible, lipVis: W.parts?.lip?.mesh?.visible, wt: W.t, st: S.t, same: W.S === S.S, cam: [c.position.x - 6000, c.position.y + 420, c.position.z].map((x) => +x.toFixed(1)), pl: [P.pos.x - 6000, P.pos.y + 420, P.pos.z].map((x) => +x.toFixed(1)), cover: W.screen?.cover, inScene: !!W.group?.parent, layers: W.group?.layers?.mask }; return { rows, ev: __ev.slice(), shot: true }; }
      if (i % 30 === 0) await new Promise((q) => setTimeout(q, 0));
    }
    return { rows, ev: __ev.slice(), shot: false };
  }, { secs, opt });
  const want = (k) => !only || only.includes(k);
  const dbg = () => page.evaluate('window.__dbg').then((d) => console.log('placed', JSON.stringify(d)));
  if (want('barrel')) {
    await placeOnWave(2, 0.45, 13); await dbg();
    let r = await surfPilot(10, { stall: true, pump: true, pumpFrom: -8, shot: true, warm: process.argv.includes('--throttle') ? 60 : 2, nolip: process.argv.includes('--nolip') });
    if (r.shot) { console.log('board', JSON.stringify(await page.evaluate('window.__board'))); console.log('lookDbg', JSON.stringify(await page.evaluate('window.__lookDbg'))); await page.screenshot({ path: path.join(out, `surfplay-barrel${phone ? '-phone' : ''}.png`), timeout: 180000 }); const r2 = await surfPilot(9, { pump: true, pumpFrom: -8 }); r = { rows: r.rows.concat(r2.rows), ev: r.ev.concat(r2.ev) }; }
    report.barrel = r;
  }
  if (want('human')) {
    // ten tries driven like a person: W / A / D / S only, a quarter second's reaction, taps, no reading of the ideal height (the line
    // held is the assist's: courier/skiff/surf.js holdLine); a try made is a tube exit with made: true
    const tries = [[4, 0.4, 13], [6, 0.35, 12], [2, 0.45, 14], [5, 0.5, 13], [3, 0.3, 12], [7, 0.42, 15], [4, 0.55, 13], [1, 0.38, 12], [6, 0.48, 14], [3, 0.4, 13]];
    report.human = { rows: [], ev: [], tries: [] };
    for (const [i, [s0, dK, v0]] of tries.entries()) {
      await placeOnWave(s0, dK, v0, 19.3 + i * 0.4);
      const r = await page.evaluate(async (seed) => {
        const G = __game, g = G.game, P = g.player, S = g.raceway.surf, sk = P.techs.get('skiff'), wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
        let held = null, heldT = 0, look = 0, pumpT = 0, rnd = seed * 9301 + 49297;
        const rand = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
        for (let i = 0; i < 60 * 9; i++) {
          __keys.clear(); const su = sk.surf, f = S.frame(P.pos.x, P.pos.z);
          if (sk.phase !== 'ride') break;
          if (i < 150 && !su.tube && su.k < 0.25) __keys.add('KeyS'); // (a stall until the lip is over them, as a person waits for the tube to come)
          look -= 1 / 60;
          if (look <= 0 && f) { // (a person looks every quarter second or so, and taps)
            look = 0.22 + rand() * 0.08;
            const dh = wrap(sk.heading - Math.atan2(f.crest.x, f.crest.z));
            if (Math.abs(su.balance) > 0.6) { held = su.balance > 0 ? 'KeyA' : 'KeyD'; heldT = 0.15; }
            else if (Math.abs(dh) > 0.4) { held = dh > 0 ? 'KeyD' : 'KeyA'; heldT = 0.12; }
          }
          if (heldT > 0) { __keys.add(held); heldT -= 1 / 60; }
          pumpT += 1 / 60; if (su.onFace && su.k > 0.4 && pumpT > 0.5) { if (pumpT > 0.6) pumpT = 0; __keys.add('KeyW'); }
          G.tick(1 / 60);
          if (i % 30 === 0) await new Promise((q) => setTimeout(q, 0));
        }
        return __ev.slice();
      }, i + 1);
      const made = r.some((e) => /tube\.exit .*"made":true/.test(e)), bail = r.find((e) => /bail/.test(e)) || null, entered = r.some((e) => /tube\.enter/.test(e));
      report.human.tries.push({ s0, dK, v0, entered, made, bail }); report.human.ev.push(...r);
    }
  }
  if (want('pump')) { await placeOnWave(30, 0.4, 14); report.pump = await surfPilot(5, { pump: true }); }
  if (want('lip')) { await placeOnWave(-8, 0.4, 12); report.lip = await surfPilot(2, { climb: true, every: 2 }); }
  if (want('buoys')) {
    // wave riding's slalom: in the lull's swell, down the deep end, each buoy passed on its side (sail up: on the swell the board sails)
    report.buoys = await page.evaluate(async () => {
      const G = __game, g = G.game, P = g.player, R = g.raceway, S = R.surf, W = S.S, PO = W.POOL, sk = P.techs.get('skiff'), ax = W.axes, rows = [];
      const { POOL_BUOYS } = await import('/src/world/raceway/surf/poolbuoys.js');
      S.t = (PO.L + 2 * W.WAVE.margin) / W.WAVE.c + 1; // (the lull: no wave running)
      const at = (u, v) => { const du = u - PO.L / 2, dv = v - PO.W / 2; return { x: 6000 + PO.x + du * ax.ux + dv * ax.vx, z: PO.z + du * ax.uz + dv * ax.vz }; };
      const p0 = at(50, 120); g.course.teleport(new P.pos.constructor(p0.x, R.rideHeight(p0.x, p0.z) + 0.7, p0.z), Math.atan2(ax.ux, ax.uz));
      for (let i = 0; i < 120 && !sk.active; i++) { sk.mount(); G.tick(1 / 60); }
      sk.heading = Math.atan2(ax.ux, ax.uz); sk.v.set(ax.ux * 14, 0, ax.uz * 14); sk.L = 1; sk.rideT = 5; __ev.length = 0; S.t = (PO.L + 2 * W.WAVE.margin) / W.WAVE.c + 1;
      const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
      for (let i = 0; i < 60 * 40; i++) {
        __keys.clear(); __keys.add('KeyW');
        const lx = P.pos.x - 6000, lz = P.pos.z, u = W.toU(lx, lz);
        const next = POOL_BUOYS.find(([bu]) => bu > u + 2); if (!next) break;
        const [bu, bv, pass] = next, aim = at(bu, bv + (pass === 'right' ? 7 : -7)), want = Math.atan2(aim.x - P.pos.x, aim.z - P.pos.z), dh = wrap(sk.heading - want);
        if (Math.abs(dh) > 0.05) __keys.add(dh > 0 ? 'KeyD' : 'KeyA');
        G.tick(1 / 60);
        if (i % 60 === 0) rows.push(`${i} u ${u.toFixed(0)} v ${W.toV(lx, lz).toFixed(0)} speed ${sk.speed?.toFixed?.(1)} power ${R.buoys?.power}`);
        if (i % 30 === 0) await new Promise((q) => setTimeout(q, 0));
      }
      return { rows, ev: __ev.slice() };
    });
  }
  if (want('sub')) {
    // wave riding's dive: in the lull's swell out by the deep wall, dropped onto it nose down with S held
    report.sub = await page.evaluate(async () => {
      const G = __game, g = G.game, P = g.player, R = g.raceway, S = R.surf, W = S.S, PO = W.POOL, sk = P.techs.get('skiff'), ax = W.axes, rows = [];
      S.t = (W.WAVE ? (PO.L + 2 * W.WAVE.margin) / W.WAVE.c : 45) + 6; // (into the lull)
      const du = 0, dv = PO.W / 2 - 20, wx = 6000 + PO.x + du * ax.ux + dv * ax.vx, wz = PO.z + du * ax.uz + dv * ax.vz;
      g.course.teleport(new P.pos.constructor(wx, R.rideHeight(wx, wz) + 0.7, wz), Math.atan2(ax.ux, ax.uz));
      for (let i = 0; i < 120 && !sk.active; i++) { sk.mount(); G.tick(1 / 60); }
      sk.heading = Math.atan2(ax.ux, ax.uz); sk.v.set(ax.ux * 18, 0, ax.uz * 18); sk.rideT = 5; __ev.length = 0;
      // off a swell: in the air 3 m up, falling, S held as it lands
      P.pos.y += 3; P.vel.y = -9; sk.air = true; sk.airT = 0.6;
      for (let i = 0; i < 150; i++) { __keys.clear(); if (i < 40) __keys.add('KeyS'); G.tick(1 / 60); if (i % 15 === 0) rows.push(`${i} air ${sk.air} sub ${!!sk.surf?.sub} y ${(P.pos.y - (R.rideHeight(P.pos.x, P.pos.z))).toFixed(2)} speed ${sk.speed?.toFixed?.(1)}`); }
      for (let i = 0; i < 90; i++) { __keys.clear(); G.tick(1 / 60); }
      return { rows, ev: __ev.slice() };
    });
  }
  if (want('slope')) {
    report.slope = await page.evaluate(async () => {
      const G = __game, g = G.game, P = g.player, sk = P.techs.get('skiff'), rows = [];
      g.places.travel('raceway.slope'); for (let i = 0; i < 60; i++) G.tick(1 / 60);
      for (let i = 0; i < 200 && !sk.active; i++) { sk.mount(); G.tick(1 / 60); }
      // just over the lip, furled, facing down the face (the slope's line: A west to B east)
      const ax = 334 - -619, az = -1027 - -885, l = Math.hypot(ax, az), fx = ax / l, fz = az / l, RW = { x: 6000, z: 0 }, u = 458;
      P.pos.x = RW.x - 619 + fx * u; P.pos.z = RW.z - 885 + fz * u; P.pos.y = g.raceway.rideHeight(P.pos.x, P.pos.z) + 0.7;
      sk.heading = Math.atan2(fx, fz); sk.v.set(fx * 8, 0, fz * 8); sk.L = 0; G.tick(1 / 60); __ev.length = 0;
      rows.push(`start active ${sk.active} phase ${sk.phase} y ${P.pos.y.toFixed(1)}`);
      const step = async (n, keys) => { for (let i = 0; i < n; i++) { __keys.clear(); for (const k of keys(i)) __keys.add(k); G.tick(1 / 60); if (i % 30 === 0) await new Promise((q) => setTimeout(q, 0)); } };
      await step(90, () => []); // (the drop-in, straight)
      rows.push(`after drop-in speed ${sk.v.length().toFixed(1)} slope ${!!sk.slope?.on}`);
      await step(50, (i) => (i < 30 ? ['KeyD'] : ['KeyA'])); // (an edge each way)
      // slowed with S on the face, then a lone W: a nose butter, pivoted with A (before any landing can end the ride)
      for (let i = 0; i < 200 && sk.v.length() > 7; i++) { __keys.clear(); __keys.add('KeyS'); G.tick(1 / 60); }
      sk.L = 0; await step(100, (i) => (i < 20 ? ['KeyW'] : ['KeyW', 'KeyA']));
      rows.push(`after butter slope ${!!sk.slope?.on} speed ${sk.v.length().toFixed(1)}`);
      // the landings from a fresh placing on the third pitch (u 692, 26 degrees), furled, at speed
      { const ax = 953, az = -142, l = Math.hypot(ax, az), fx = ax / l, fz = az / l, u = 697; P.pos.x = 6000 - 619 + fx * u; P.pos.z = -885 + fz * u; P.pos.y = g.raceway.rideHeight(P.pos.x, P.pos.z) + 0.7;
        sk.heading = Math.atan2(fx, fz); sk.v.set(fx * 15, 0, fz * 15); sk.L = 0; sk.spin = 0; await step(3, () => []); rows.push(`pitch 3 slope ${!!sk.slope?.on} speed ${sk.v.length().toFixed(1)}`); }
      // a plain hop, straight: a landing on the face
      await step(5, () => ['Space']); await step(1, () => []); // (a tap: a short hop, landed on the same pitch)
      for (let i = 0; i < 240 && sk.air; i++) G.tick(1 / 60);
      await step(60, () => []);
      // a hop with a pre-wind: D wound while Space charges, launched, the spin let run out (from the same pitch again)
      { const ax = 953, az = -142, l = Math.hypot(ax, az), fx = ax / l, fz = az / l, u = 697; P.pos.x = 6000 - 619 + fx * u; P.pos.z = -885 + fz * u; P.pos.y = g.raceway.rideHeight(P.pos.x, P.pos.z) + 0.7;
        sk.heading = Math.atan2(fx, fz); sk.v.set(fx * 15, 0, fz * 15); sk.L = 0; sk.spin = 0; await step(3, () => []); }
      await step(12, () => ['Space', 'KeyD']); await step(1, () => []);
      // in the air: the wound spin countered (A against D's wind), then squared to the nearest whole turn (D lowers the spin, A raises it)
      for (let i = 0; i < 240 && sk.air; i++) { __keys.clear(); const TAU = Math.PI * 2, off = sk.spin - Math.round(sk.spin / TAU) * TAU; if ((sk.slope?.spinRate || 0) > 0.6) __keys.add('KeyA'); else if (Math.abs(off) > 0.1) __keys.add(off > 0 ? 'KeyD' : 'KeyA'); G.tick(1 / 60); }
      await step(20, () => []);
      rows.push(`end phase ${sk.phase} speed ${sk.speed?.toFixed?.(1)} slope ${!!sk.slope?.on}`);
      return { rows, ev: __ev.slice() };
    });
  }
} finally { await browser.close(); await server.close(); }
const ev = (k) => (report[k]?.ev || []);
const had = (k, re) => ev(k).some((e) => re.test(e));
const verdict = {
  human: report.human && { made: report.human.tries.filter((x) => x.made).length + ' of ' + report.human.tries.length, wipeouts: report.human.tries.filter((x) => x.bail).length, tries: report.human.tries },
  barrel: report.barrel && { entered: had('barrel', /tube\.enter/), made: had('barrel', /tube\.exit .*"made":true/), exit: ev('barrel').filter((e) => /tube\.exit|bail/.test(e)) },
  pump: report.pump && { pumps: ev('pump').filter((e) => /pump/.test(e)).length },
  lip: report.lip && { wipeout: ev('lip').filter((e) => /bail/.test(e)) },
  buoys: report.buoys && { passed: ev('buoys').filter((e) => /buoy/.test(e)) },
  sub: report.sub && { dives: ev('sub').filter((e) => /submarine/.test(e)) },
  slope: report.slope && { on: had('slope', /skiff\.slope /), skids: ev('slope').filter((e) => /skid/.test(e)).length, landings: ev('slope').filter((e) => /slope\.land/.test(e)), butter: ev('slope').filter((e) => /butter/.test(e)) },
};
fs.writeFileSync(path.join(out, 'surfplay.json'), JSON.stringify({ report, verdict, errs }, null, 1));
console.log(JSON.stringify(verdict, null, 1));
for (const k of Object.keys(report)) { console.log(`--- ${k}`); console.log((report[k].rows || []).join('\n')); }
console.log(`out: ${out}`); if (errs.length) console.log('errors:\n  ' + [...new Set(errs)].slice(0, 8).join('\n  '));
