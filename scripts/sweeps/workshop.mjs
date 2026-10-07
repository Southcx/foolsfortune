// ---------------------------------------------------------------------------------------
// THE WORKSHOP SWEEP: the workshop's ground and upper floors and the Throwing Room, driven headless as a person would and as a careless
// one would, with a screenshot at every step and one PASS/FAIL line a check. What it sweeps: the kiln station (FIRE, MEND, Esc, F
// spammed, windows over it, set down elsewhere mid-firing), the folk (Mistress Saggar, Pip, Raku: F opens the dialogue box, every line
// goes to the log; Esc, travel and the windows mid-talk), the Tithe, the Bisque Shrine (rest, its page, the Spirit Garden's door, F
// spammed), the gong's time trial (begun, spammed, left mid-run), the Throwing Room (its Index page, the drills begun and left, Strawman's
// modes, the spray wall), and the windows that open anywhere (the pause menu, the Codex B, the Pneuka Box P, the map M, the tuning panel
// Tab, the chat line Enter, QAIS F8, the god hand ~): each opened and closed, opened over each other, opened mid-action, and toggled
// twenty times with the scene's objects counted before and after. Every event seen is kept; outcome events without `by` are listed.
// Exits non-zero on any FAIL.
//
//   npm run dev &                     (or URL=http://host:port/ for a build under `vite preview`)
//   node scripts/sweeps/workshop.mjs [--out dir] [--seed 1] [--quick] [--only kiln,folk,...]   (shots to <out>/shots, default <tmp>/sweeps/workshop)
//   parts: places kiln folk tithe shrine trial throwing windows   (--only runs some, in that order)
//
// Prior art: scripts/sweeps/garden.mjs (the page measured from inside through window.__game, the first sweep), scripts/stress.mjs
// (the page opened in manual mode, the clock pinned: the casebook's rule 3), a QA team's smoke pass (every window opened and shut, every
// pair of windows tried over each other: the "modal matrix" of a console certification pass), and Playwright's screenshot assertions.
// Dovina's (mechanical testing: the owner, 2026-10-07).
// ---------------------------------------------------------------------------------------
import path from 'path';
import { open, args } from './harness.mjs';

const S = await open('workshop');
const only = typeof args.only === 'string' ? new Set(args.only.split(',')) : null;
const part = (id) => !only || only.has(id);
const quick = S.quick;

// ---- the page's side: what this sweep measures beyond the harness's
const WS_JS = `
window.__ws = (() => {
  const G = __game, g = G.game, THREE = G.THREE, v = __sw.v;
  const seen = [];
  { const E = g.events, emit = E.emit; E.emit = function (n, d = {}) { seen.push({ name: n, keys: Object.keys(d || {}), by: d && 'by' in d ? d.by : undefined }); return emit.call(this, n, d); }; } // (the payload as sent, before the bus adds its name and t)
  const shown = (e) => { if (!e) return false; for (let p = e; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.display === 'none' || cs.visibility === 'hidden') return false; } const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }; // (offsetParent is null for every position:fixed window)
  const guiShown = () => shown(document.querySelector('.lil-gui.root') || document.querySelector('.lil-gui'));
  const W = {
    seen, shown,
    mark() { return { ev: seen.length, log: g.log.lines.length }; },
    eventsSince(m) { return seen.slice(m.ev); },
    logSince(m) { return g.log.lines.slice(Math.max(0, m.log - (g.log.lines.length >= g.log.max ? 999 : 0))).slice(-(g.log.lines.length - m.log)).map((l) => l.text); },
    logTail(n = 12) { return g.log.lines.slice(-n).map((l) => l.text); },
    /** Every window and hold a person could be in, at once. */
    win() {
      const ov = document.getElementById('overlay');
      return { pause: ov.style.display !== 'none', codex: !!g.codex?.open, pneuka: !!g.pneukaUI?.open, map: !!g.cartography?.open, tuning: guiShown(),
        chat: !!g.log?.typing, qais: !!g.qais?.open, god: g.god?.state, dialogue: !!g.dialogue?.open, kiln: !!g.kilnUI?.open, index: !!g.indexMenu?.open,
        page: g.indexMenu?.page?.name || null, shop: !!g.shopUI?.open, realm: !!g.realm?.active, tech: g.techs?.active?.id || null,
        cinema: !!g.cinema?.active, enabled: !!G.input.enabled, freeze: !!g.player.freeze };
    },
    /** The windows open now, by name (the god hand counts while it is on). */
    openList() { const w = W.win(); return ['pause', 'codex', 'pneuka', 'map', 'tuning', 'chat', 'qais', 'dialogue', 'kiln', 'index', 'shop', 'realm'].filter((k) => w[k]).concat(w.god && w.god !== 'off' ? ['god:' + w.god] : []); },
    /** Close every window the way the game would (no keys), and give the input back. */
    closeAll() {
      if (g.dialogue?.open) g.dialogue.end();
      if (g.kilnUI?.open) g.kilnUI.onLeave?.();
      g.qais?.open && g.qais.close(); g.log?.typing && g.log.close();
      g.pneukaUI?.open && g.pneukaUI.close(); g.codex?.open && g.codex.close?.(); g.cartography?.open && g.cartography.hide?.(); g.indexMenu?.open && g.indexMenu.close();
      if (guiShown()) G.input.pressed.add('Tab');
      document.getElementById('overlay').style.display = 'none'; G.input.enabled = true;
    },
    /** What is in the world: objects in the scene, the renderer's own counts. */
    counts() { let n = 0; g.scene.traverse(() => n++); const i = G.renderer.info; return { objects: n, top: g.scene.children.length, geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs?.length ?? null, breakables: g.breakables?.items?.size ?? g.breakables?.items?.length ?? null, creatures: g.creatures?.list?.length ?? null }; },
    /** The interact chevron against the thing it is on. */
    chevron() { const I = g.interact, C = I.chevron, cur = I.cur; return { cur: cur?.id || null, ref: typeof cur?.ref === 'string' ? cur.ref : null, at: cur ? v(cur.pos) : null, shown: C.group.visible, chev: v(C.group.position), off: cur ? +C.group.position.distanceTo(cur.pos).toFixed(2) : null }; },
    stand(p, yaw = 0) { return !!g.places.stand(new THREE.Vector3(...p), yaw); },
    pos() { return v(g.player.pos); },
    camToCourier() { return +G.camera.position.distanceTo(g.player.pos).toFixed(2); },
    /** A line in the log that calls the Courier he or she (the game says "you"; the folk's own pronouns are theirs). */
    gendered(lines) { return lines.filter((t) => /\\b(Courier|Couriers?'s?)\\b[^.]*\\b(she|he|her|him|his|hers|himself|herself)\\b/i.test(t) || /^(She|He) /.test(t)); },
  };
  return W;
})();
`;
await S.page.addScriptTag({ content: WS_JS });
const ws = (expr) => S.page.evaluate(`__ws.${expr}`);
const F = async (n = 6) => S.press('KeyF', n);
const shotCommon = async (label, o) => (await S.common(label, o)).file;
const moveTest = async () => { const a = await ws('pos()'); await S.hold('KeyW', 30); const b = await ws('pos()'); return +Math.hypot(b[0] - a[0], b[2] - a[2]).toFixed(2); };
const closeAll = async () => { await ws('closeAll()'); await S.ticks(4); await godOut(); };
/** The god hand put away: ~ is heard only when it is fully in or fully out ('in' and 'out' are its transitions). */
const godOut = async () => { for (let k = 0; k < 12; k++) { const st = (await ws('win()')).god; if (st === 'off') return true; if (st === 'on') await S.press('Backquote', 2); await S.ticks(30); } return false; };
const godIn = async () => { await S.press('Backquote', 2); for (let k = 0; k < 8 && (await ws('win()')).god !== 'on'; k++) await S.ticks(30); return (await ws('win()')).god; };
const settleCourier = async () => { await S.ticks(30); };
const base = path.basename;
/** In front of the kiln's mouth, a metre off (the kiln's place sets them down 1.6 m off, nearer Mistress Saggar than the kiln). */
const standKiln = async () => { await S.go('kiln'); await ws('stand([0, 0.05, 7.4], 0)'); await S.settle(); await settleCourier(); };

// =============================================================== 0. the places
if (part('places')) {
  S.phase = 'places';
  const all = await S.sw('places()');
  S.note('places known', all.map((p) => `${p.id}@${p.zone}`).join(' '));
  for (const id of ['workshop', 'kiln', 'throwing', 'folk.saggar', 'folk.pip', 'folk.raku', 'tithe']) {
    const r = await S.go(id);
    S.check(`travel to ${id}`, !!r?.ok || !!r?.pos || r === true, r);
    await settleCourier();
    await shotCommon(`place-${id}`);
  }
  // what F acts on in the workshop must be a place an agent can be sent to (world/places.js: "every room and landmark by name")
  const missing = await S.ev(() => { const g = __game.game, P = g.places.all(), near = (x, z, r = 3) => P.some((p) => Math.hypot(p.pos[0] - x, p.pos[2] - z) < r);
    const want = { 'the Bisque Shrine': g.shrines.get('workshop')?.pos || g.player.spawn.clone().setX(g.player.spawn.x + 2.2), 'the gong': { x: -2.6, z: -12.6 }, Strawman: g.testroom?.strawman?.pos, 'the spray wall': { x: 25, z: 2.5 } };
    return Object.entries(want).filter(([, p]) => p && !near(p.x, p.z)).map(([k]) => k); });
  S.check('places: every workshop landmark F acts on is a place', !missing.length, missing.length ? `no place within 3 m of: ${missing.join(', ')} (world/places.js installPlaces)` : 'all');
}

// =============================================================== 1. the kiln station
if (part('kiln')) {
  S.phase = 'kiln';
  await S.go('kiln'); await settleCourier();
  const c0 = await ws('counts()');
  const ch = await ws('chevron()');
  const who = await S.ev(() => { const g = __game.game, P = g.player.pos, n = g.folk.near(g.player); return { courier: __sw.v(P), kilnD: +Math.hypot(P.x, P.z - 8.4).toFixed(2), folk: n?.id || null, folkD: n ? +(Math.hypot(n.pos.x - P.x, n.pos.z - P.z) - 0.3).toFixed(2) : null }; });
  S.check('kiln: set down at the kiln\'s place, the chevron is on the kiln', ch.cur === 'kiln' && ch.shown && ch.off < 0.6, { chevron: ch.cur, ref: ch.ref, ...who });
  await standKiln();
  await F(20);
  let w = await ws('win()');
  S.check('kiln: F opens the kiln station', w.kiln && w.tech === 'kiln', w);
  await shotCommon('kiln-open');
  const chevOpen = await ws('chevron()');
  S.check('kiln: no chevron over the open station', !chevOpen.shown, chevOpen);
  // a swatch tried on, then FIRE (with and without the purse), then MEND
  await S.ev(async () => { const g = __game.game, V = g.vessel, m = await import('/src/courier/vessel/glazes.js'); const gz = Object.values(m.GLAZES).filter((x) => (x.kind || 'glaze') === 'glaze' && !V.has(x.id)).slice(0, 2); V.bought = { ...(V.bought || {}) }; for (const x of gz) V.bought[x.id] = true; g.kilnUI.render(); });
  const tried = await S.ev(() => { const s = document.querySelectorAll('#kiln .s:not(.on)'); if (!s.length) return null; s[0].click(); return s.length; });
  await S.ticks(10);
  const fire = await S.ev(() => { const g = __game.game, b = [...document.querySelectorAll('#kiln button')].find((x) => /^FIRE/.test(x.textContent)); const before = g.cubes.balance; const dis = b?.disabled; b?.click(); return { label: b?.textContent, disabled: dis, before, after: g.cubes.balance }; });
  S.note('kiln: FIRE with the purse as it is', { swatches: tried, ...fire });
  await S.ev(() => { __game.game.cubes.earn(500, 'sweep'); __game.game.kilnUI.render(); });
  await S.ev(() => { const s = document.querySelectorAll('#kiln .s:not(.on)'); s[1]?.click(); });
  const m1 = await ws('mark()');
  const fire2 = await S.ev(() => { const g = __game.game, b = [...document.querySelectorAll('#kiln button')].find((x) => /^FIRE/.test(x.textContent)); const before = g.cubes.balance; b?.click(); return { label: b?.textContent, before, after: g.cubes.balance }; });
  await S.ticks(10);
  S.check('kiln: FIRE spends the cubes it says', fire2.before - fire2.after === +((fire2.label || '').match(/(\d+)/)?.[1] ?? -1), fire2);
  await S.ev(() => { const D = __game.game.vesselDamage; __game.game.lachryma.drain(__game.game.lachryma.value, 'sweep'); D?.hit({ k: 0.5, why: 'sweep' }); __game.game.kilnUI.render(); });
  await S.ticks(4);
  const mend = await S.ev(() => { const g = __game.game, b = [...document.querySelectorAll('#kiln button')].find((x) => /^MEND/.test(x.textContent)); const w0 = g.vesselDamage?.worn; const before = g.cubes.balance; const lab = b?.textContent; b?.click(); return { label: lab, worn: [w0, g.vesselDamage?.worn], cubes: [before, g.cubes.balance] }; });
  S.check('kiln: MEND after a crack mends it for the cubes it says', mend.worn[0] > 0 && mend.worn[1] === 0 && mend.cubes[0] - mend.cubes[1] === +((mend.label || '').match(/(\d+)/)?.[1] ?? -1), mend);
  await shotCommon('kiln-fired');
  const ev1 = await ws(`eventsSince(${JSON.stringify(m1)})`);
  // Esc leaves; the camera and the Courier come back
  await S.press('Escape', 30);
  w = await ws('win()');
  S.check('kiln: Esc leaves the station and gives the Courier back', !w.kiln && w.tech !== 'kiln' && !w.cinema, w);
  const mv = await moveTest();
  S.check('kiln: the Courier walks after leaving', mv > 0.5, `${mv} m in 0.5 s of W`);
  S.check('kiln: the camera is back on the shoulder', (await ws('camToCourier()')) < 8, `camera ${await ws('camToCourier()')} m from the Courier`);
  await shotCommon('kiln-left');
  // careless: F and Esc fifteen times fast; then each window's key over the open station
  await standKiln();
  let opens = 0, lockedOpen = 0;
  for (let k = 0; k < (quick ? 6 : 15); k++) {
    await F(14); await S.page.waitForTimeout(250); await S.ticks(2); // (a lock asked for by the last leave lands in real time)
    const o = await S.ev(() => ({ kiln: __game.game.kilnUI.open, locked: __game.input.locked }));
    if (o.kiln) opens++; if (o.kiln && o.locked) lockedOpen++;
    await S.press('Escape', 8);
  }
  w = await ws('win()');
  S.check('kiln: F/Esc spammed ends closed, and unpaused', !w.kiln && w.tech !== 'kiln' && !w.pause, { opens, ...w });
  S.check('kiln: the pointer is never locked while the station is open', lockedOpen === 0, `${lockedOpen} of ${opens} openings had the pointer locked a quarter second in (main.js onLockChange releases a late lock only under modalOpen(), which leaves out kilnUI)`);
  await closeAll();
  const over = [];
  for (const [key, label] of [['KeyB', 'codex'], ['KeyP', 'pneuka'], ['KeyM', 'map'], ['Enter', 'chat'], ['F8', 'qais'], ['Backquote', 'god hand'], ['Tab', 'tuning']]) {
    await standKiln(); await F(20);
    if (!(await ws('win()')).kiln) { over.push({ key, why: 'the station did not open' }); continue; }
    await S.press(key, 40);
    const list = await ws('openList()');
    if (label === 'codex') await S.shot('kiln-with-codex');
    over.push({ key, open: list });
    await closeAll(); await S.ticks(30);
  }
  S.note('kiln: windows over the station', over.map((o) => `${o.key}: ${o.open?.join('+') || o.why}`));
  const stacked = over.filter((o) => o.open && o.open.filter((x) => x !== 'tuning').length > 1);
  S.check('kiln: no second window opens over the station', !stacked.length, stacked.map((o) => `${o.key} -> ${o.open.join(' + ')}`).join('; ') || 'none');
  // Esc with the Codex over the station: the window on top goes first
  await standKiln(); await F(20); await S.press('KeyB', 6);
  const before = await ws('openList()');
  await S.press('Escape', 10);
  const afterEsc = await ws('openList()');
  S.check('kiln: Esc with the Codex over the station closes the Codex first', before.includes('codex') && !afterEsc.includes('codex') && afterEsc.includes('kiln'), { before, afterEsc });
  await closeAll(); await S.ticks(30);
  // careless: set down elsewhere with the station open (a travel from the chat line, a shatter)
  await standKiln(); await F(20);
  await S.go('throwing'); await S.ticks(30);
  w = await ws('win()');
  S.check('kiln: travelling away closes the station', !w.kiln && w.tech !== 'kiln', w);
  await shotCommon('kiln-travelled-away');
  await closeAll();
  // the kiln twenty times: nothing left in the world
  await standKiln();
  const k0 = await ws('counts()');
  for (let k = 0; k < (quick ? 5 : 20); k++) { await F(16); await S.press('Escape', 10); }
  await S.ticks(30);
  const k1 = await ws('counts()');
  S.check('kiln: twenty openings leak nothing', k1.objects <= k0.objects + 2 && k1.geometries <= k0.geometries + 4, { before: k0, after: k1 });
  const noBy = ev1.filter((e) => e.by === undefined).map((e) => e.name);
  S.note('kiln: events without by', [...new Set(noBy)].join(' ') || 'none');
  S.note('kiln: counts at the start', c0);
}

// =============================================================== 2. the folk
if (part('folk')) {
  S.phase = 'folk';
  for (const id of ['saggar', 'pip', 'raku']) {
    await closeAll();
    const r = await S.go(`folk.${id}`); await settleCourier();
    const ch = await ws('chevron()');
    S.check(`folk ${id}: the chevron is on them`, ch.cur === 'npc' && ch.ref === id && ch.off < 0.6, ch);
    const m = await ws('mark()');
    await F(6);
    let w = await ws('win()');
    S.check(`folk ${id}: F opens the dialogue box`, w.dialogue, w);
    await S.ticks(40); await shotCommon(`folk-${id}-talk`);
    // through the talk: F finishes a line, F turns the page, the first choice taken each time (60 presses at most)
    // (a choice: the last one, the way out in every talk so far; otherwise F, as the box says)
    const talks0 = await S.ev(() => __game.game.events.counts['npc.talk'] || 0);
    let n = 0; for (; n < 40 && (await ws('win()')).dialogue; n++) { const k = await S.ev(() => __game.game.dialogue.opts?.length || 0); if (k) await S.press(`Digit${k}`, 14); else await F(14); }
    w = await ws('win()');
    const talks = (await S.ev(() => __game.game.events.counts['npc.talk'] || 0)) - talks0;
    S.check(`folk ${id}: F on the last line ends the talk (and does not begin another)`, !w.dialogue && talks === 0, `${n} presses, ${talks} talks begun again by the F that ended one (npc.talk events); open at the end: ${w.dialogue}`);
    // (out the other way, Space, so the rest can run)
    for (let k2 = 0; k2 < 30 && (await ws('win()')).dialogue; k2++) { const k = await S.ev(() => __game.game.dialogue.opts?.length || 0); if (k) await S.press(`Digit${k}`, 14); else await S.press('Space', 14); }
    S.check(`folk ${id}: Space on the last line ends the talk`, !(await ws('win()')).dialogue, await ws('win()'));
    const said = (await ws(`eventsSince(${JSON.stringify(m)})`)).filter((e) => e.name === 'npc.say').length;
    const lines = await S.ev((m) => __game.game.log.lines.slice(-200).map((l) => l.text), m);
    const say = await S.ev((m) => __game.game.events.log.filter((e) => e.name === 'npc.say').slice(-40).map((e) => e.line), m);
    const lost = say.filter((t) => !lines.some((l) => l.includes(t.slice(0, 40))));
    S.check(`folk ${id}: every finished line is in the log`, said > 0 && !lost.length, { said, notInLog: lost.slice(0, 3) });
    S.check(`folk ${id}: the log never calls the Courier he or she`, !(await S.ev((L) => __ws.gendered(L), lines)).length, (await S.ev((L) => __ws.gendered(L), lines)).slice(0, 3));
    await closeAll(); await S.ticks(10); // (Raku's talk ends in his counter: the shop's window)
    const mv = await moveTest();
    S.check(`folk ${id}: the Courier walks after the talk`, mv > 0.5, `${mv} m in 0.5 s of W`);
    // careless: Esc mid-talk (a person's way out of any window)
    await S.go(`folk.${id}`); await settleCourier(); await F(30);
    await S.press('Escape', 20);
    w = await ws('win()');
    S.check(`folk ${id}: Esc mid-talk leaves the dialogue box`, !w.dialogue, w);
    await S.shot(`folk-${id}-esc`);
    // careless: travelled away mid-talk (the chat line's /goto, an agent's travel, a shatter)
    if (!w.dialogue) { await S.go(`folk.${id}`); await settleCourier(); await F(30); }
    await S.go('throwing'); await S.ticks(40);
    w = await ws('win()');
    const camD = await ws('camToCourier()');
    S.check(`folk ${id}: travelling away ends the talk`, !w.dialogue && camD < 8, { dialogue: w.dialogue, cinema: w.cinema, cameraToCourier: camD });
    await S.shot(`folk-${id}-travelled`);
    await closeAll(); await S.ticks(20);
    // careless: each window's key mid-talk
    const over = [];
    for (const key of ['KeyB', 'KeyP', 'KeyM', 'F8', 'Backquote']) {
      await S.go(`folk.${id}`); await settleCourier(); await F(30);
      if (!(await ws('win()')).dialogue) { over.push(`${key}: did not open`); continue; }
      await S.press(key, 40);
      const list = await ws('openList()');
      over.push(`${key}: ${list.join('+')}`);
      await closeAll(); await S.ticks(30);
    }
    S.note(`folk ${id}: windows over the dialogue box`, over);
    const stacked = over.filter((t) => /dialogue\+|\+dialogue|god:/.test(t) && t.split('+').length > 1);
    S.check(`folk ${id}: no second window over the dialogue box`, !stacked.length, stacked.join('; ') || 'none');
    if (r && !r.ok && !r.pos) S.note(`folk ${id}: travel said`, r);
  }
  const noBy = [...new Set((await ws('seen')).filter((e) => /^npc\./.test(e.name) && e.by === undefined).map((e) => e.name))];
  S.note('folk: npc events without by', noBy.join(' ') || 'none');
}

// =============================================================== 3. the Tithe
if (part('tithe')) {
  S.phase = 'tithe';
  await closeAll();
  await S.go('tithe'); await settleCourier();
  const tch = await ws('chevron()'), tm = await S.ev(() => { const t = __game.game.chests.tithe, P = __game.game.player.pos; return { mark: __sw.v(t.mark), courier: __sw.v(P), fromMark: +Math.hypot(P.x - t.mark.x, P.z - t.mark.z).toFixed(2), reach: 1.3 }; });
  S.check('tithe: set down at the Tithe\'s place, F reaches it', tch.cur === 'chest', { chevron: tch.cur, ref: tch.ref, ...tm });
  await S.ev(() => { const t = __game.game.chests.tithe; __game.game.places.stand(t.mark.clone().setY(t.mark.y + 0.05), Math.atan2(t.slot.x - t.mark.x, t.slot.z - t.mark.z)); }); await S.settle(); await settleCourier();
  const ch = await ws('chevron()');
  S.check('tithe: on its mark, the chevron is on the Tithe', ch.cur === 'chest' && ch.ref === 'tithe' && ch.off < 0.8, ch);
  await S.ev(() => { const g = __game.game, b = g.cubes.balance; if (b) g.cubes.spend(b, 'sweep'); });
  const m = await ws('mark()'), t0 = Date.now();
  for (let k = 0; k < 8; k++) await F(4);
  const poor = (await ws(`logSince(${JSON.stringify(m)})`)).filter((t) => /Tithe/.test(t)), secs = (Date.now() - t0) / 1000; // (the log's throttle runs on the wall clock: 3 real seconds)
  S.check('tithe: refused without the cubes, said at most once in 3 real seconds', poor.length >= 1 && poor.length <= Math.ceil(secs / 3) + 1, { lines: poor.length, realSeconds: +secs.toFixed(1), said: poor[0] });
  await S.ev(() => { __game.game.cubes.earn(2000, 'sweep'); });
  // (stepped with the errors caught: a throw in the frame is the finding, and the sweep goes on)
  const tickSafe = (n) => S.ev((n) => { const errs = []; for (let i = 0; i < n; i++) { try { __game.tick(1 / 60); } catch (e) { if (errs.length < 3) errs.push(`${e.message} @ ${(e.stack || '').split('\n')[1]?.trim()}`); } } return errs; }, n);
  await S.page.keyboard.press('KeyF');
  const e1 = await tickSafe(10);
  let w = await ws('win()');
  S.check('tithe: F with the cubes begins the opening', w.tech === 'chests', w);
  const e2 = await tickSafe(60);
  S.check('tithe: the opening runs a frame without throwing', !e1.length && !e2.length, [...new Set([...e1, ...e2])].slice(0, 2).join(' | ') || 'none');
  await S.sw('draw()'); await S.shot('tithe-opening');
  // careless: Esc, B and ~ mid-opening
  await S.page.keyboard.press('Escape'); await tickSafe(4); await S.page.keyboard.press('KeyB'); await tickSafe(10);
  const mid = await ws('openList()');
  await ws('closeAll()');
  const e3 = await tickSafe(400);
  w = await ws('win()');
  S.check('tithe: the opening gives the Courier back', !w.tech && !w.cinema, { midOpening: mid, after: w, errors: e3.length });
  if (w.tech === 'chests') { await S.ev(() => __game.game.chests.cur?.abort?.()); await tickSafe(30); } // (let go, so the rest can run)
  await shotCommon('tithe-after');
}

// =============================================================== 4. the Bisque Shrine
if (part('shrine')) {
  S.phase = 'shrine';
  await closeAll(); await S.go('workshop'); await S.ticks(10);
  const at = await S.ev(() => { const s = __game.game.shrines.get('workshop'); if (!s) return null; const f = [Math.sin(s.yaw), 0, Math.cos(s.yaw)]; return { p: [s.pos.x + f[0] * 1.4, s.pos.y + 0.05, s.pos.z + f[2] * 1.4], yaw: s.yaw + Math.PI, built: __game.game.shrines.built }; });
  S.check('shrine: the Bisque Shrine is built', !!at, at);
  if (at) {
    await ws(`stand(${JSON.stringify(at.p)}, ${at.yaw})`); await S.settle(); await settleCourier();
    const ch = await ws('chevron()');
    S.check('shrine: the chevron is on the Bisque Shrine', ch.cur === 'shrine' && ch.off < 0.6, ch);
    const m = await ws('mark()');
    await S.ev(() => { __game.game.lachryma.value = 5; });
    await F(6);
    let w = await ws('win()');
    const pool = await S.ev(() => { const L = __game.game.lachryma; return { value: L.value, max: L.max }; });
    S.check('shrine: F rests (the pool full) and opens its page', w.index && w.page === 'workshop' && pool.value >= pool.max - 0.5, { ...w, pool });
    const shrineShot = await shotCommon('shrine-page');
    const text = await S.ev(() => document.querySelector('#indexmenu .im')?.innerText || '');
    S.check('shrine: its page carries no movement calibration', !/CALIBRATION/.test(text), /CALIBRATION/.test(text) ? `the page under THE BISQUE SHRINE lists ${text.split('\n').filter((t) => /CALIBRATION/.test(t)).join(' | ')} (feedback/indexmenu.js render(): calibration drawn under every page)` : 'none');
    S.check('shrine: its page shows no code id', !/\b(workshop|dunemaw|pier|margarite)\b/.test(text.split('\n').slice(0, 4).join(' ')), text.split('\n').slice(0, 4));
    // F closes it, and the same F does not open it again
    await F(10);
    w = await ws('win()');
    S.check('shrine: F closes its page (and does not reopen it)', !w.index, { index: w.index, page: w.page });
    // F spammed at the Shrine: it ends in one state and the rests are counted once a press, not twice
    const r0 = await S.ev(() => __game.game.events.counts['shrine.rest'] || 0);
    let k = 0; for (; k < (quick ? 6 : 16); k++) await F(4);
    const r1 = await S.ev(() => __game.game.events.counts['shrine.rest'] || 0);
    w = await ws('win()');
    S.check('shrine: F spammed rests at most once a press', r1 - r0 <= k, { presses: k, rests: r1 - r0, endsOpen: w.index });
    await closeAll(); await S.ticks(6);
    // the door to the Spirit Garden, and out again
    await F(6);
    const g1 = await S.ev(() => { const r = [...document.querySelectorAll('#indexmenu .room')].find((e) => /Spirit Garden/.test(e.textContent)); r?.click(); return !!r; });
    await S.ticks(10); await S.settle(); await S.ticks(30);
    w = await ws('win()');
    S.check('shrine: the Spirit Garden\'s door takes you in', g1 && w.realm, w);
    await S.shot('shrine-garden');
    await S.ev(() => { const im = document.querySelector('#indexmenu .room'); im?.click(); }); await S.ticks(10); // (named: its first offer)
    await closeAll(); await S.ticks(10); await S.settle(); await S.ticks(30); // (the seam waits while the naming page is up: it pauses the game)
    const left = await S.ev(() => { const sb = __game.game.seam.busy; __game.game.realm.leave(); return sb; }); await S.ticks(10); await S.settle(); await S.ticks(30);
    S.note('shrine: the seam busy when the garden was left', left);
    w = await ws('win()');
    const back = await S.sw('state()');
    S.check('shrine: out of the garden, the Courier stands at the Shrine', !w.realm && back.courierShown && back.zone === 'workshop', { realm: w.realm, courierShown: back.courierShown, zone: back.zone, pos: back.player });
    await shotCommon('shrine-back');
    S.check('shrine: out of the garden, camera.up is world +Y again', Math.abs(back.camUp[1] - 1) < 1e-3, { camUp: back.camUp });
    await S.ev(() => __game.camera.up.set(0, 1, 0)); // (put right here, so the parts after are not judged by it)
    const ev = (await ws(`eventsSince(${JSON.stringify(m)})`)).filter((e) => /^(shrine|garden)\./.test(e.name));
    S.check('shrine: its events say by', ev.every((e) => e.by), [...new Set(ev.filter((e) => !e.by).map((e) => e.name))].join(' ') || 'all carry by');
  }
}

// =============================================================== 5. the gong's time trial
if (part('trial')) {
  S.phase = 'trial';
  await closeAll();
  const GONG = [-2.6, 0, -12.6];
  const standGong = async () => { await ws(`stand([${GONG[0] + 1.2}, 0.05, ${GONG[2] + 0.9}], ${Math.atan2(-1.2, -0.9)})`); await S.settle(); await settleCourier(); };
  await S.go('workshop'); await standGong();
  const ch = await ws('chevron()');
  S.check('trial: the chevron is on the gong', ch.cur === 'trial' && ch.off < 0.6, ch);
  await F(6);
  let st = await S.ev(() => ({ state: __game.game.trial.state, jars: __game.game.trial.jars.length, box: document.getElementById('trial').style.display, freeze: __game.game.player.freeze }));
  S.check('trial: F at the gong begins the count', st.state === 'countdown' && st.jars > 0 && st.box === 'block', st);
  await S.shot('trial-countdown');
  await S.ticks(200);
  st = await S.ev(() => ({ state: __game.game.trial.state, freeze: __game.game.player.freeze }));
  S.check('trial: the count ends and the Courier is free', st.state === 'run' && !st.freeze, st);
  await shotCommon('trial-run');
  // careless: windows mid-run, then leave the workshop mid-run
  await S.press('KeyB', 6); const midB = await ws('openList()'); await closeAll();
  const midGod = await godIn(); const midState = await S.ev(() => __game.game.trial.state); await godOut(); await closeAll(); await S.ticks(10);
  S.note('trial: windows mid-run', { B: midB, god: midGod, trialWithTheHand: midState });
  S.check('trial: the god hand is refused mid-run (godhand.js canEnter asks the trial)', midGod !== 'on', `god hand ${midGod} with the trial '${midState}'; canEnter reads trial.active, which Trial never sets (it has state and running)`);
  await S.go('throwing'); await S.ticks(30);
  st = await S.ev(() => ({ state: __game.game.trial.state, jars: __game.game.trial.jars.length, box: document.getElementById('trial').style.display, arrow: document.getElementById('trialarrow').style.display, freeze: __game.game.player.freeze }));
  S.check('trial: leaving the workshop calls it off, board and jars', st.state === 'off' && st.jars === 0 && st.box === 'none' && st.arrow === 'none' && !st.freeze, st);
  // careless: the gong struck twenty times; Esc during the count; travel during the count
  await S.go('workshop'); await standGong();
  await F(6); await S.ev(() => __game.game.trial.abort()); await S.ticks(10); await standGong(); // (one start first: what a start builds once is not a leak)
  const c0 = await ws('counts()');
  for (let k = 0; k < (quick ? 5 : 20); k++) { await F(3); await S.ticks(3); if (k % 2) { await S.ev(() => __game.game.trial.abort()); await standGong(); } }
  st = await S.ev(() => ({ state: __game.game.trial.state, jars: __game.game.trial.jars.length, live: __game.game.trial.jars.filter((j) => j.alive).length }));
  S.check('trial: the gong spammed keeps one set of jars', st.jars <= 12 && st.live <= 12, st);
  await S.go('kiln'); await S.ticks(30);
  st = await S.ev(() => ({ state: __game.game.trial.state, freeze: __game.game.player.freeze }));
  S.note('trial: travelled to the kiln (the same zone) mid-count', st);
  await S.ev(() => __game.game.trial.abort()); await S.ticks(10);
  const mv = await moveTest();
  S.check('trial: after it is called off the Courier walks', mv > 0.5, `${mv} m in 0.5 s of W`);
  await S.go('workshop'); await S.ticks(60);
  const c1 = await ws('counts()');
  S.check('trial: twenty-odd starts leak nothing', c1.objects <= c0.objects + 4 && c1.geometries <= c0.geometries + 8 && c1.breakables <= c0.breakables, { before: c0, after: c1 });
  S.note('trial: its events', [...new Set((await ws('seen')).filter((e) => /^trial\./.test(e.name)).map((e) => `${e.name}${e.by ? '' : ' (no by)'}`))]);
}

// =============================================================== 6. the Throwing Room
if (part('throwing')) {
  S.phase = 'throwing';
  await closeAll();
  await ws('stand([12.4, 0.05, 0.6], 3.14159)'); await S.settle(); await settleCourier();
  const ch = await ws('chevron()');
  S.check('throwing: the chevron is on the Index\'s lectern', ch.cur === 'testroom.index' && ch.off < 0.6, ch);
  await F(6);
  let w = await ws('win()');
  S.check('throwing: F opens the Throwing Room\'s page', w.index && w.page === 'the Throwing Room', w);
  const f = await S.shot('throwing-index');
  const text = await S.ev(() => document.querySelector('#indexmenu .im')?.innerText || '');
  S.check('throwing: its page carries no movement calibration', !/CALIBRATION/.test(text), /CALIBRATION/.test(text) ? `${base(f)}: the drills' page lists ${text.split('\n').filter((t) => /CALIBRATION/.test(t)).join(' | ')} (feedback/indexmenu.js render())` : 'none');
  const header = text.split('\n')[0];
  S.check('throwing: its title is the room\'s name, not a code form', !/INDEX · /.test(header) || /THE THROWING ROOM/.test(header), header);
  await F(6);
  w = await ws('win()');
  S.check('throwing: F closes the page', !w.index, w);
  // each drill: begun from the page on the firing mark, then left (out of the room) mid-run
  for (const name of ['Flick', 'Track', 'Spray', 'Recover']) {
    await ws('stand([12.4, 0.05, 0.6], 3.14159)'); await S.ticks(20); await F(6);
    const ok = await S.ev((n) => { const r = [...document.querySelectorAll('#indexmenu .room')].find((e) => e.textContent.includes(n)); r?.click(); return !!r; }, name);
    await S.ticks(4);
    const a = await S.ev(() => ({ active: __game.game.testroom.drills.active?.id || null, shown: __game.game.testroom.drills.targets.filter((t) => t.mesh.visible).length }));
    S.check(`throwing: ${name} begins from its page`, ok && !!a.active, a);
    if (name === 'Spray') {
      await ws('stand([15, 0.05, 2.5], 1.5708)'); await S.ticks(20);
      const e0 = await S.ev(() => __game.game.events.counts['drill.end'] || 0);
      await S.page.mouse.move(480, 300);
      const f0 = await S.ev(() => __game.game.events.counts['shot.fire'] || 0);
      for (let k = 0; k < 20; k++) { await S.page.mouse.down(); await S.ticks(2); await S.page.mouse.up(); await S.ticks(24); } // (twenty taps: a held LMB is the psygun's charge)
      await S.ticks(10);
      const sp = await S.ev(() => { const D = __game.game.testroom.drills, e = __game.game.events.last('drill.end'); return { fired: (__game.game.events.counts['shot.fire'] || 0), dents: D.dentN, ends: __game.game.events.counts['drill.end'] || 0, run: e ? { shots: e.run.shots, group: e.run.group } : null }; });
      sp.fired -= f0;
      S.check('throwing: Spray, twenty taps end the drill with twenty shots, and the wall keeps a dent a hit', sp.fired === 20 && sp.dents > 0 && sp.ends === e0 + 1 && sp.run?.shots === 20, sp);
      await S.shot('throwing-spray-wall');
    } else await S.ticks(60);
    await shotCommon(`throwing-${name.toLowerCase()}`);
    await S.go('kiln'); await S.ticks(10);
    const b = await S.ev(() => ({ active: __game.game.testroom.drills.active?.id || null, shown: __game.game.testroom.drills.targets.filter((t) => t.mesh.visible).length }));
    S.check(`throwing: ${name} ends when the Courier leaves the room`, !b.active && b.shown === 0, b);
  }
  // Strawman: F cycles the mode, one step a press
  await ws('stand([20, 0.05, -2.1], 3.14159)'); await S.ticks(30);
  const sch = await ws('chevron()');
  S.check('throwing: the chevron is on Strawman', sch.cur === 'strawman' && sch.off < 0.8, sch);
  const s0 = await S.ev(() => __game.game.events.counts['strawman.mode'] || 0);
  for (let k = 0; k < 5; k++) await F(8);
  const s1 = await S.ev(() => __game.game.events.counts['strawman.mode'] || 0);
  S.check('throwing: F at Strawman changes the mode once a press', s1 - s0 === 5, { presses: 5, modeChanges: s1 - s0, mode: await S.ev(() => __game.game.testroom.strawman.mode) });
  await shotCommon('throwing-strawman');
  await S.ev(() => { const S = __game.game.testroom.strawman; while (S.mode !== 'still') S.setMode(['still', 'guard', 'swing'][0]); });
  // careless: the page opened twenty times, P and B over it
  const c0 = await ws('counts()');
  await ws('stand([12.4, 0.05, 0.6], 3.14159)'); await S.ticks(20);
  for (let k = 0; k < (quick ? 5 : 20); k++) { await F(4); await S.press('Escape', 4); }
  await F(6); await S.press('KeyP', 6); await S.press('KeyB', 6);
  const list = await ws('openList()');
  S.check('throwing: P and B over the page open neither the Pneuka Box nor the Codex', !list.includes('pneuka') && !list.includes('codex'), list);
  await closeAll(); await S.ticks(10);
  const c1 = await ws('counts()');
  S.check('throwing: twenty openings leak nothing', c1.objects <= c0.objects + 2, { before: c0, after: c1 });
  const noBy = [...new Set((await ws('seen')).filter((e) => /^(drill|strawman)\./.test(e.name) && e.by === undefined).map((e) => e.name))];
  S.note('throwing: drill/Strawman events without by', noBy.join(' ') || 'none');
}

// =============================================================== 7. the windows that open anywhere
if (part('windows')) {
  S.phase = 'windows';
  await closeAll(); await S.go('workshop'); await S.ticks(30);
  const W = [['codex', 'KeyB', 'KeyB'], ['pneuka', 'KeyP', 'KeyP'], ['map', 'KeyM', 'KeyM'], ['tuning', 'Tab', 'Tab'], ['chat', 'Enter', 'Escape'], ['qais', 'F8', 'F8'], ['god', 'Backquote', 'Backquote']];
  const isOpen = (w, id) => (id === 'god' ? w.god === 'on' || w.god === 'in' : w[id]);
  // each opened and closed with its key, and with Esc
  for (const [id, key, shut] of W) {
    await S.press(key, id === 'god' ? 90 : 6);
    let w = await ws('win()');
    S.check(`window ${id}: ${key} opens it`, isOpen(w, id), isOpen(w, id) ? 'open' : { ...w, log: await ws('logTail(2)') });
    await S.shot(`window-${id}`);
    await S.press(shut, id === 'god' ? 90 : 6);
    w = await ws('win()');
    const left = await ws('openList()');
    S.check(`window ${id}: ${shut} closes it, and nothing else is open`, !isOpen(w, id) && !left.length, left.join('+') || 'clean');
    if (id !== 'god' && id !== 'chat') {
      await S.press(key, 6); await S.press('Escape', 6);
      const l2 = await ws('openList()');
      if (id === 'tuning') S.note('window tuning: Esc (the panel is not a window that pauses; Tab is its key)', l2.join('+') || 'closed');
      else S.check(`window ${id}: Esc closes it`, !l2.length, l2.join('+') || 'clean');
    }
    await closeAll(); await S.go('workshop'); await S.ticks(10);
    const mv = await moveTest();
    S.check(`window ${id}: the Courier walks after it`, mv > 0.5, `${mv} m in 0.5 s of W`);
  }
  // each over each: the first window open, the second's key pressed. One window at a time, or the second refused.
  const pairs = [];
  for (const [a, ka] of W) for (const [b, kb] of W) {
    if (a === b || (quick && (a === 'god' || b === 'god'))) continue;
    await closeAll(); await S.ticks(a === 'god' || b === 'god' ? 60 : 2);
    await S.press(ka, a === 'god' ? 90 : 6);
    await S.press(kb, b === 'god' ? 90 : 6);
    const list = (await ws('openList()')).filter((x) => x !== 'god:off');
    pairs.push({ a, b, list });
    if (list.filter((x) => ['codex', 'pneuka', 'map', 'qais'].includes(x)).length > 1 && !pairs.shot) { pairs.shot = await S.shot(`windows-${a}-then-${b}`); }
    await closeAll(); await S.ticks(2);
  }
  const pausing = new Set(['codex', 'pneuka', 'map', 'qais', 'index', 'shop']); // (main.js modalOpen(): the windows that pause the game)
  const twoUp = pairs.filter((p) => p.list.filter((x) => pausing.has(x)).length > 1);
  S.note('windows: each over each', pairs.map((p) => `${p.a}>${p.b}: ${p.list.join('+') || '-'}`));
  S.check('windows: no two windows that pause open at once', !twoUp.length, twoUp.map((p) => `${p.a} then ${p.b}: ${p.list.join(' + ')}`).join('; ') || 'none');
  // the pause menu (the pointer lock lost, as Esc does in play): what opens over it
  await closeAll(); await S.ticks(4);
  const overPause = [];
  for (const [id, key] of W.filter(([i]) => i !== 'god' && i !== 'tuning')) {
    await S.ev(() => __game.input.onLockChange(false)); await S.ticks(2);
    const paused = (await ws('win()')).pause;
    await S.press(key, 4);
    overPause.push({ id, paused, list: await ws('openList()') });
    if (id === 'codex') await S.shot('pause-then-codex');
    await closeAll(); await S.ticks(2);
  }
  S.note('pause menu: keys pressed over it', overPause.map((p) => `${p.id}: ${p.list.join('+')}`));
  const overP = overPause.filter((p) => p.paused && p.list.filter((x) => x !== 'pause' && x !== 'qais').length); // (QAIS over the pause menu is wanted: a bug seen there is reported from there)
  S.check('pause menu: nothing opens over it', !overP.length, overP.map((p) => `${p.id} -> ${p.list.join(' + ')}`).join('; ') || 'none');
  await S.ev(() => __game.input.onLockChange(false)); await S.ticks(2);
  const help = await S.ev(() => document.getElementById('overlay')?.innerText.slice(0, 400));
  await shotCommon('pause-menu');
  S.check('pause menu: no retired word on it', !/pause card|Shrine Garden|Lab mode|Spellcasting|surfer/i.test(help || ''), help?.slice(0, 160));
  await closeAll();
  // mid-action: a jump, a slide, the psygun held, a charge; each window's key at its height
  const mids = [];
  for (const [label, act] of [['jump', async () => { await S.page.keyboard.press('Space'); await S.ticks(10); }], ['sprint-slide', async () => { await S.page.keyboard.down('ShiftLeft'); await S.page.keyboard.down('KeyW'); await S.ticks(30); await S.page.keyboard.press('KeyC'); await S.ticks(4); }], ['charging', async () => { await S.page.mouse.down(); await S.ticks(40); }]]) {
    for (const [id, key] of W.filter(([i]) => i !== 'tuning' && (!quick || i !== 'god'))) {
      await closeAll(); await S.go('workshop'); await S.ticks(20);
      await act();
      await S.press(key, id === 'god' ? 90 : 6);
      await S.page.mouse.up(); await S.page.keyboard.up('ShiftLeft'); await S.page.keyboard.up('KeyW');
      const w = await ws('win()');
      const st = await S.sw('state()');
      mids.push({ label, id, open: isOpen(w, id), nan: st.nan, charge: await S.ev(() => +(__game.game.weapon.charge || 0).toFixed(2)) });
      await closeAll();
      await S.ticks(20);
    }
  }
  S.note('windows mid-action', mids.map((m) => `${m.label}/${m.id}: ${m.open ? 'open' : 'refused'}${m.charge ? ' charge ' + m.charge : ''}`));
  const leftCharge = await S.ev(() => ({ charge: __game.game.weapon.charge || 0, holding: !!__game.game.weapon.holding }));
  S.check('windows mid-action: no charge left winding after', leftCharge.charge < 0.05 && !leftCharge.holding, leftCharge);
  S.check('windows mid-action: the Courier stays finite', !mids.some((m) => m.nan), 'checked after each');
  // a resize with each window open
  const resized = [];
  for (const [id, key, shut] of W.filter(([i]) => i !== 'god')) {
    await closeAll(); await S.press(key, 6);
    await S.page.setViewportSize({ width: 560, height: 820 }); await S.ticks(4);
    const f = await S.shot(`resize-${id}`);
    const fit = await S.ev(() => { const bad = [], seen = []; for (const sel of ['#codex', '#pneuka', '#mapui', '#indexmenu .im', '.lil-gui.root', '#qais', '#chatlog']) { for (const e of document.querySelectorAll(`${sel}, ${sel} > *`)) { if (!__ws.shown(e)) continue; seen.push(sel); const r = e.getBoundingClientRect(); if (r.right > innerWidth + 2 || r.left < -2) bad.push(`${sel}${e.matches(sel) ? '' : ' > ' + (e.id || e.className || e.tagName)} ${Math.round(r.left)}..${Math.round(r.right)} of ${innerWidth}`); } } return { bad: [...new Set(bad)].slice(0, 4), seen: [...new Set(seen)] }; });
    resized.push({ id, file: base(f), off: fit.bad, seen: fit.seen });
    await S.page.setViewportSize({ width: 960, height: 600 }); await S.ticks(4);
    await S.press(shut, 6); await closeAll();
  }
  S.note('windows at 560 px: what was measured', resized.map((r) => `${r.id}: ${r.seen.join(' ') || 'nothing shown'}`));
  const offs = resized.filter((r) => r.off.length);
  S.check('windows: each fits a narrow viewport (560 px)', !offs.length, offs.map((r) => `${r.id}: ${r.off.join(', ')} (${r.file})`).join('; ') || 'all fit');
  // twenty toggles of each: nothing left in the world
  await closeAll(); await S.go('workshop'); await S.ticks(30);
  const c0 = await ws('counts()');
  for (const [id, key, shut] of W) { for (let k = 0; k < (quick ? 3 : 20); k++) { await S.press(key, id === 'god' ? 70 : 2); await S.press(shut, id === 'god' ? 70 : 2); } await closeAll(); }
  await S.ticks(60);
  const c1 = await ws('counts()');
  S.check('windows: twenty toggles of each leak nothing', c1.objects <= c0.objects + 4 && c1.geometries <= c0.geometries + 8 && c1.textures <= c0.textures + 2, { before: c0, after: c1 });
  const st = await S.sw('state()');
  S.check('windows: after it all the Courier is shown and the camera level', st.courierShown && Math.abs(st.roll) < 3, st);
  await shotCommon('windows-after');
}

// =============================================================== what the log said, all parts
const said = await S.ev(() => __game.game.log.lines.map((l) => l.text));
const raw = said.filter((t) => /\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b|\b(?:mat|cask|cube|npc|shrine|drill|kiln|trial)\.[a-z]+\b/.test(t));
S.check('the log: no undefined, NaN, null or code id in what it says', !raw.length, raw.slice(0, 4).join(' | ') || `${said.length} lines read`);
S.check('the log: never "she" or "he" of the Courier', !(await S.ev((L) => __ws.gendered(L), said)).length, (await S.ev((L) => __ws.gendered(L), said)).slice(0, 3));
// =============================================================== the events seen, all parts
const all = await ws('seen');
const outcome = /\.(break|shatter|kill|down|hit|rest|find|travel|fire|refire|open|finish|end|catch|win|lose|buy|sell|spend|earn|gain)$/;
const noBy = [...new Set(all.filter((e) => outcome.test(e.name) && e.by === undefined).map((e) => e.name))];
S.note('outcome-like events seen without by', noBy.join(' ') || 'none');
S.note('payloads that use name or t (the bus writes its own)', [...new Set(all.filter((e) => e.keys.includes('name') || e.keys.includes('t')).map((e) => e.name))].join(' ') || 'none');
await S.done();
