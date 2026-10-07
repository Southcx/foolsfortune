// ---------------------------------------------------------------------------------------
// THE TOOLS SWEEP: the Courier's psychic tools on the belt (tools/belt.js, tools/heldtool.js), driven headless as a person would and as
// a careless one would, with a screenshot at every step and one PASS/FAIL line a check. What it sweeps: each tool drawn and stowed by its
// own key (the psygun X, the Sondelass Q in each form: cutlass, rod, hook; the Soul Brush G in paint and mop with the Lachrymato Bottle
// worn; the Veritome J; the Dreamvane K; the Crucibelle U; the Lockheart I), worn from the Pneuka Box where it is not; each one's verbs
// (LMB, LMB held, RMB, RMB held, the parry V), then stowed mid-verb; tools swapped fast and one key spammed; a tool drawn mid-jump,
// mid-slide, swimming and on a ladder; the god hand (~) with a tool out and mid-Blade-Mode; the pause and a resize mid-verb; a tool
// taken off while it is out. After each: one tool at most in the hand, none drawn unseen, the time scale, the camera's look and FOV and
// the cinema's requests given back, and the core movement (walk, sprint, jump, slide, measured on one stretch of the movement lab's
// floor) exactly what it was before any tool came out. The fittings worn (the bottle on the upper back, the coffin and the Possibilikeys
// on the Lockheart) are checked against the Pneuka Box, and the scene's objects are counted across twenty draws of each tool.
// Exits non-zero on any FAIL.
//
//   npm run dev &                     (or URL=http://host:port/ for a build under `vite preview`)
//   node scripts/sweeps/tools.mjs [--out dir] [--seed 1] [--quick] [--only places,base,draw,...]   (shots: <out>/shots, default <tmp>/sweeps/tools)
//   parts: places base draw sondelass brush fittings swap moves god careless leak   (--only runs some, in that order; base is always run)
//
// Mouse buttons are put on the game's input directly (`input.pressed` / `input.down`, as the replay does): headless, the canvas under the
// crosshair is not always the element Playwright's click lands on. Keys go through the page's keyboard, as a person's do.
//
// Prior art: scripts/sweeps/garden.mjs and workshop.mjs (the page measured from inside through window.__game), scripts/stress.mjs (manual
// mode, the clock pinned: the casebook's rule 3), and a QA team's weapon-switch matrix (every weapon drawn from every state: mid-air,
// swimming, climbing, mid-reload; Halo's and Destiny's certification passes). Dovina's (mechanical testing: the owner, 2026-10-07).
// ---------------------------------------------------------------------------------------
import { open, args } from './harness.mjs';

const S = await open('tools');
const only = typeof args.only === 'string' ? new Set(args.only.split(',')) : null;
const part = (id) => !only || only.has(id);
const quick = S.quick;

// ---- the page's side: what this sweep measures beyond the harness's
const TL_JS = `
window.__tl = (() => {
  const G = __game, g = G.game, THREE = G.THREE, v = __sw.v, V = (a) => new THREE.Vector3(...a), I = G.input;
  const seen = [];
  { const E = g.events, emit = E.emit; E.emit = function (n, d = {}) { seen.push({ name: n, keys: Object.keys(d || {}), by: d && 'by' in d ? d.by : undefined }); return emit.call(this, n, d); }; } // (the payload as sent)
  const KEYS = { psygun: 'KeyX', sondelass: 'KeyQ', soulbrush: 'KeyG', veritome: 'KeyJ', dreamvane: 'KeyK', crucibelle: 'KeyU', lockheart: 'KeyI' };
  const modelOf = (t) => t.id === 'psygun' ? g.character.gun : t.model;
  const shownUp = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const T = {
    seen, KEYS,
    mark() { return { ev: seen.length, log: g.log.lines.length }; },
    eventsSince(m) { return seen.slice(m.ev); },
    logSince(m) { return g.log.lines.slice(m.log).map((l) => l.text); },
    /** Every tool: worn, how far out, asked for, its model shown (itself and every parent), where it is on the body and from the right hand. */
    tools() {
      const ch = g.character; ch.root.updateMatrixWorld(true);
      const hR = ch.bones.handR.getWorldPosition(new THREE.Vector3());
      return g.belt.tools.map((t) => { const m = modelOf(t); let hand = null, body = null;
        if (m) { m.updateWorldMatrix(true, false); const w = m.getWorldPosition(new THREE.Vector3()); hand = +w.distanceTo(hR).toFixed(2); body = v(ch.root.worldToLocal(w.clone())); }
        return { id: t.id, worn: g.belt.isWorn(t.id), drawT: +t.drawT.toFixed(2), wants: !!t.wants, vis: m ? m.visible : null, shown: m ? shownUp(m) : null, hand, body }; });
    },
    out() { return g.belt.tools.filter((t) => t.drawT > 0.02).map((t) => t.id); },
    inHand() { return g.belt.inHand?.id || null; },
    /** Tools drawn (drawT over 0.02) whose model is not drawn while the Courier is shown and the god hand is off: a tool out unseen. */
    unseen() { const ch = g.character; if (ch.hidden || g.god?.active) return []; return g.belt.tools.filter((t) => t.drawT > 0.02 && modelOf(t) && !shownUp(modelOf(t))).map((t) => t.id); },
    /** Worn tools not drawn and not shown on the body (the Courier shown, the god hand off): a worn tool gone missing. */
    missing() { const ch = g.character; if (ch.hidden || g.god?.active) return []; return g.belt.tools.filter((t) => g.belt.isWorn(t.id) && t.drawT <= 0.02 && modelOf(t) && !shownUp(modelOf(t))).map((t) => t.id); },
    /** What a tool can leave behind in the world: the time scale and its holds, the camera's look scale and FOV, the cinema's requests,
     *  the view, the tech running, the Sondelass's strip and the psygun's shells shown. */
    world() {
      const P = g.player, ls = {}; for (const k in P.lookScale) if (P.lookScale[k] !== 1) ls[k] = P.lookScale[k];
      return { scale: +(g.time.scale ?? 1).toFixed(3), holds: [...(g.time.holds?.keys?.() || [])], look: ls, fov: +G.camera.fov.toFixed(1), view: P.view, tech: g.techs.active?.id || null,
        cinema: [...(g.cinema.reqs?.keys?.() || [])], shots: [...(g.cinema.shots?.keys?.() || [])], speedMult: +(g.techs.speedMult ?? 1).toFixed(3),
        strip: !!document.getElementById('toolstrip')?.classList.contains('on'), shells: document.getElementById('shells')?.style.display ?? null,
        god: g.god?.state, hidden: !!g.character.hidden, freeze: !!P.freeze, enabled: !!I.enabled };
    },
    stand(p, yaw) { g.places.stand(V(p), yaw); g.player.vel.set(0, 0, 0); __sw.tick(30); return v(g.player.pos); },
    /** Walk or sprint 40 ticks to speed, then measure 30 (m/s over flat ground). */
    move(sprint) { const P = g.player; P.vel.set(0, 0, 0); I.down.add('KeyW'); if (sprint) I.down.add('ShiftLeft'); __sw.tick(40); const b = P.pos.clone(); __sw.tick(30); const c = P.pos.clone(); I.down.delete('KeyW'); I.down.delete('ShiftLeft'); __sw.tick(40);
      return +(Math.hypot(c.x - b.x, c.z - b.z) / 0.5).toFixed(2); },
    jump() { const P = g.player; __sw.tick(20); const y0 = P.pos.y; let top = y0; I.pressed.add('Space'); I.down.add('Space'); __sw.tick(1); I.down.delete('Space'); for (let i = 0; i < 90; i++) { __sw.tick(1); top = Math.max(top, P.pos.y); } return +(top - y0).toFixed(3); },
    /** A sprint, then C: how far the slide carries in 40 ticks. */
    slide() { const P = g.player; P.vel.set(0, 0, 0); I.down.add('KeyW'); I.down.add('ShiftLeft'); __sw.tick(40); const a = P.pos.clone(); I.pressed.add('KeyC'); I.down.add('KeyC'); __sw.tick(40); const b = P.pos.clone(); I.down.delete('KeyC'); I.down.delete('KeyW'); I.down.delete('ShiftLeft'); __sw.tick(50);
      return +Math.hypot(b.x - a.x, b.z - a.z).toFixed(2); },
    /** A mouse button: pressed this tick and held for n ticks (0: a tap). */
    mouse(b, n = 0) { I.pressed.add(b); I.down.add(b); __sw.tick(Math.max(1, n)); I.down.delete(b); __sw.tick(1); },
    mdown(b) { I.pressed.add(b); I.down.add(b); }, mup(b) { I.down.delete(b); },
    /** Every object in the scene, and the renderer's own counts. */
    counts() { let n = 0; g.scene.traverse(() => n++); const i = G.renderer.info; return { objects: n, top: g.scene.children.length, geometries: i.memory.geometries, textures: i.memory.textures }; },
    /** The Lachrymato Bottle as worn: the box's fitting against the model on the upper back. */
    bottle() {
      const L = g.techs.get?.('soulbrush')?.load || g.belt.get('soulbrush') && g.techs.list.find((t) => t.id === 'soulbrush')?.load, box = g.pneuka, ch = g.character;
      const fit = box.fitted('bottle')[0] || null, look = L?.look; let at = null, spine = null, parent = null;
      if (look) { look.group.updateWorldMatrix(true, false); const w = look.group.getWorldPosition(new THREE.Vector3()); at = v(ch.root.worldToLocal(w.clone())); parent = look.group.parent?.name || look.group.parent?.type; const top = ch.bones.spine003 || ch.bones.spine004; spine = top ? +w.distanceTo(top.getWorldPosition(new THREE.Vector3())).toFixed(2) : null; }
      return { fit, held: +(box.uses.bottle[0] || 0).toFixed(1), lookId: L?.lookId ?? null, look: !!look, shown: look ? shownUp(look.group) : null, parent, at, spine, fill: look?.fill ?? look?.level ?? null, mode: L?.mode };
    },
    /** The Lockheart's chain against the box: the coffin hung and the Possibilikeys strung. */
    ring() { const L = g.techs.list.find((t) => t.id === 'lockheart'), box = g.pneuka; return { heart: box.fitted('heart')[0] || null, coffin: L?.coffinId || null, keys: box.fitted('keys'), strung: (L?.keyMeshes || []).length, keySig: L?.keySig ?? null }; },
    slotOf(id) { return g.pneuka.slots.findIndex((s) => s?.id === id); },
    worn() { return g.belt.tools.filter((t) => g.belt.isWorn(t.id)).map((t) => t.id); },
    /** A worn set put back as it was (through the box, as a person would: P, then Wear). */
    wearSet(ids) { for (const t of g.belt.tools) if (g.belt.isWorn(t.id) && !ids.includes(t.id)) g.pneuka.takeOff(t.id); for (const id of ids) if (!g.belt.isWorn(id)) { const i = T.slotOf('tool.' + id); if (i >= 0) g.pneuka.wear(i); } __sw.tick(4); return T.worn(); },
    tech(id) { return g.techs.list.find((t) => t.id === id) || null; },
    sond() { const s = T.tech('sondelass'); return { form: s.form, ext: +s.ext.toFixed(2), blade: +s.blade.toFixed(2), hook: !!s.hookshot?.busy, att: !!s.hookshot?.att, lure: !!s.angler?.lure?.active, casting: !!s.angler?.casting, bladeMode: !!s.cutlass?.blade?.active, guard: !!s.cutlass?.guardOn }; },
    brush() { const b = T.tech('soulbrush'); return { mode: b.load.mode, busy: !!b.load.busy, sat: +(b.load.sat ?? 0).toFixed(2), celestial: !!b.celestial?.active, club: !!b.club?.busy }; },
    gendered(lines) { return lines.filter((t) => /\\b(Courier|Couriers?'s?)\\b[^.]*\\b(she|he|her|him|his|hers|himself|herself)\\b/i.test(t) || /^(She|He) /.test(t)); },
    /** A code id shown to the player: tool.x, heart.x, key.x, bottle.x, lure.x, mat.x, or undefined/NaN/[object. */
    codeIds(lines) { return lines.filter((t) => /\\b(tool|heart|key|bottle|lure|mat|cask)\\.[a-z]/.test(t) || /undefined|NaN|\\[object/.test(t)); },
  };
  return T;
})();
`;
await S.page.addScriptTag({ content: TL_JS });
const tl = (e) => S.page.evaluate(`__tl.${e}`);
const J = JSON.stringify;
const LAB = [0, -14, -38], LAB_YAW = 1.57; // (a clear stretch of the movement lab's floor, measured: 4.2 m/s walking, 6.8 sprinting, both ways)
const KEYS = { psygun: 'KeyX', sondelass: 'KeyQ', soulbrush: 'KeyG', veritome: 'KeyJ', dreamvane: 'KeyK', crucibelle: 'KeyU', lockheart: 'KeyI' };
const NAMES = { psygun: 'the psygun', sondelass: 'the Sondelass', soulbrush: 'the Soul Brush', veritome: 'the Veritome', dreamvane: 'the Dreamvane', crucibelle: 'the Crucibelle', lockheart: 'the Lockheart' };
const key = async (k, n = 2) => S.press(k, n);
const sinceMark = async (m) => ({ evs: await tl(`eventsSince(${J(m)})`), log: await tl(`logSince(${J(m)})`) });
/** The core movement on the lab's stretch: walk, sprint, jump, slide. */
const core = async () => { const r = {}; await tl(`stand(${J(LAB)}, ${LAB_YAW})`); r.walk = await tl('move(false)'); await tl(`stand(${J(LAB)}, ${LAB_YAW})`); r.sprint = await tl('move(true)'); r.jump = await tl('jump()'); await tl(`stand(${J(LAB)}, ${LAB_YAW})`); r.slide = await tl('slide()'); return r; };
let BASE = null, WORLD0 = null, WORN0 = null;
const sameCore = (a) => BASE && ['walk', 'sprint', 'jump', 'slide'].every((k) => Math.abs(a[k] - BASE[k]) <= Math.max(0.02, Math.abs(BASE[k]) * 0.01));
/** What a tool may leave behind, against the world before any tool came out. */
const leftBehind = (w) => { const bad = {}; for (const k of ['scale', 'fov', 'view', 'tech', 'speedMult', 'strip', 'god', 'hidden', 'freeze', 'enabled']) if (J(w[k]) !== J(WORLD0[k])) bad[k] = [WORLD0[k], w[k]]; for (const k of ['holds', 'look', 'cinema', 'shots']) if (J(w[k]) !== J(WORLD0[k])) bad[k] = [WORLD0[k], w[k]]; return bad; };
/** The state after a step settles: at most one tool out, none unseen, none worn and missing, nothing left behind (when nothing is out). */
const settledChecks = async (label, { expectOut = undefined, world = true } = {}) => {
  await S.ticks(90);
  const out = await tl('out()'), unseen = await tl('unseen()'), missing = await tl('missing()'), w = await tl('world()');
  S.check(`${label}: one tool in the hand at most`, out.length <= 1, { out });
  S.check(`${label}: no tool out unseen`, !unseen.length, { unseen });
  S.check(`${label}: every worn tool shown on the body`, !missing.length, { missing });
  if (expectOut !== undefined) S.check(`${label}: ${expectOut ? expectOut + ' in the hand' : 'nothing in the hand'}`, expectOut ? out.length === 1 && out[0] === expectOut : !out.length, { out, want: expectOut || null });
  if (world && !out.length) { const bad = leftBehind(w); S.check(`${label}: nothing left behind (time, look, FOV, cinema, view)`, !Object.keys(bad).length, Object.keys(bad).length ? bad : 'as before'); }
  return { out, w };
};
const stowAll = async () => { for (let i = 0; i < 3; i++) { const out = await tl('out()'); if (!out.length) break; await key(KEYS[out[0]], 4); await S.ticks(60); } };

// ================================================================== 0. the places the tools are used in
if (part('places')) {
  S.phase = 'places';
  for (const p of ['workshop', 'lab', 'dunes', 'weir']) { const r = await S.go(p); S.check(`travel ${p}`, r?.ok !== false, r); await S.common(`place ${p}`); }
}

// ================================================================== 1. the core movement before any tool comes out (the gold standard)
S.phase = 'base';
await S.go('lab');
WORN0 = await tl('worn()');
await stowAll();
BASE = await core();
WORLD0 = await tl('world()');
S.check('base: the core movement measured on the lab floor', BASE.walk > 3 && BASE.sprint > BASE.walk && BASE.jump > 0.5 && BASE.slide > 1, BASE);
S.note('base: the world with no tool out', WORLD0);
S.note('base: worn at the start', WORN0);
await S.common('base lab');

// ================================================================== 2. every tool drawn and stowed by its key, its verbs, and the core movement after
const VERBS = {
  psygun: [['LMB', 'Mouse0', 0], ['LMB held', 'Mouse0', 80], ['RMB held (aim)', 'Mouse2', 40], ['V (parry: the stagger)', 'KeyV']],
  sondelass: [['LMB (the cutlass string)', 'Mouse0', 0], ['LMB held', 'Mouse0', 60], ['RMB tap (the Stinger)', 'Mouse2', 0], ['RMB held (Blade Mode)', 'Mouse2', 50], ['V (parry: the deflect, the guard)', 'KeyV']],
  soulbrush: [['LMB (the club)', 'Mouse0', 0], ['LMB held (saturate)', 'Mouse0', 90], ['RMB tap', 'Mouse2', 0], ['RMB held (Celestial mode)', 'Mouse2', 50], ['V (parry: the bat)', 'KeyV']],
  veritome: [['LMB', 'Mouse0', 0], ['RMB held (the lens)', 'Mouse2', 50], ['V (parry: the shutter)', 'KeyV']],
  dreamvane: [['LMB (the pick)', 'Mouse0', 0], ['LMB held', 'Mouse0', 60], ['RMB tap (the fork)', 'Mouse2', 0], ['RMB held (dowse)', 'Mouse2', 60], ['V (parry: the twirl)', 'KeyV']],
  crucibelle: [['LMB (the toll)', 'Mouse0', 0], ['1-5 (the notes)', 'Digit1'], ['RMB held', 'Mouse2', 40], ['V (parry: the toll)', 'KeyV']],
  lockheart: [['LMB held (hoover)', 'Mouse0', 60], ['RMB (open: no key on the ring)', 'Mouse2', 0], ['V (parry: the gulp)', 'KeyV']],
};
/** One tool: drawn, seen in the hand, each verb, then stowed by its key mid-verb, and the core movement measured. */
async function toolPass(id) {
  S.phase = `draw ${id}`;
  await tl(`stand(${J(LAB)}, ${LAB_YAW})`);
  const before = await tl('tools()'), b = before.find((t) => t.id === id);
  const m = await tl('mark()');
  await key(KEYS[id], 2); await S.ticks(60);
  const after = await tl('tools()'), a = after.find((t) => t.id === id), others = after.filter((t) => t.id !== id && t.drawT > 0.02).map((t) => t.id);
  const moved = a.body && b.body ? +Math.hypot(...a.body.map((x, i) => x - b.body[i])).toFixed(2) : null;
  S.check(`${id}: drawn by ${KEYS[id]}`, a.drawT === 1 && a.wants, { drawT: a.drawT, wants: a.wants });
  S.check(`${id}: shown, in the hand`, a.shown && a.hand !== null && a.hand < 0.75 && moved > 0.15, { shown: a.shown, fromRightHand: a.hand, movedFromHolster: moved });
  S.check(`${id}: the only tool out`, !others.length, { others });
  await S.common(`${id} drawn`);
  for (const [label, b2, n] of VERBS[id]) {
    S.phase = `${id} ${label}`;
    if (b2.startsWith('Mouse')) await tl(`mouse('${b2}', ${n})`); else await key(b2, 4);
    await S.ticks(20);
    const st = await S.sw('state()');
    S.check(`${id} ${label}: Courier finite, the tool still the one out`, !st.nan && J(await tl('out()')) === J([id]), { player: st.player, out: await tl('out()') });
  }
  await S.shot(`${id}-verbs`);
  // stowed mid-verb: the held button still down when the key is pressed
  S.phase = `${id} stow mid-verb`;
  const held = VERBS[id].find((x) => x[1].startsWith('Mouse') && x[2] > 0);
  if (held) { await tl(`mdown('${held[1]}')`); await S.ticks(20); }
  await key(KEYS[id], 2);
  if (held) { await S.ticks(10); await tl(`mup('${held[1]}')`); }
  await S.ticks(60);
  const ev = await sinceMark(m);
  S.note(`${id}: events`, [...new Set(ev.evs.map((e) => e.name))].slice(0, 30));
  const outcome = /\.(hit|down|break|broke|catch|caught|outcome|unearth|strike|block|pull|fling|creature|drain|parried|stagger|kill)$|^(parry|guard)\./;
  const noBy = [...new Set(ev.evs.filter((e) => outcome.test(e.name) && e.by === undefined).map((e) => e.name))];
  S.check(`${id}: its outcome events say by`, !noBy.length, noBy.join(' ') || 'all carry by');
  S.check(`${id}: log never says she/he of the Courier`, !(await tl(`gendered(${J(ev.log)})`)).length, ev.log.slice(-6));
  S.check(`${id}: log shows no code ids`, !(await tl(`codeIds(${J(ev.log)})`)).length, await tl(`codeIds(${J(ev.log)})`));
  if (id === 'psygun') {
    // (the psygun is the one tool any combat input draws: a held LMB after its key brings it back out, as designed; let go, stow again)
    await S.ticks(30); if ((await tl('out()')).includes('psygun')) { await key('KeyX', 2); await S.ticks(60); }
  }
  await settledChecks(`${id} stowed`, { expectOut: null });
  const c = await core();
  S.check(`${id} stowed: the core movement exactly as before`, sameCore(c), { base: BASE, now: c });
}

if (part('draw')) {
  for (const id of ['psygun', 'sondelass', 'soulbrush', 'veritome', 'lockheart']) await toolPass(id);
  // the two not worn at the start: put on from the Pneuka Box (each takes the place of one worn there)
  for (const id of ['dreamvane', 'crucibelle']) {
    S.phase = `wear ${id}`;
    const m = await tl('mark()'), slot = await tl(`slotOf('tool.${id}')`);
    S.check(`${id}: carried in the Pneuka Box`, slot >= 0, { slot });
    await S.ev((s) => __game.game.pneuka.wear(s), slot); await S.ticks(10);
    const ev = await sinceMark(m), worn = await tl('worn()');
    S.check(`${id}: worn from the box`, worn.includes(id), { worn, log: ev.log });
    S.check(`${id}: the wear's log line names no code id`, !(await tl(`codeIds(${J(ev.log)})`)).length, ev.log);
    await toolPass(id);
  }
  S.phase = 'restore worn';
  const back = await tl(`wearSet(${J(WORN0)})`);
  S.check('the worn set put back from the box', J([...back].sort()) === J([...WORN0].sort()), { now: back, was: WORN0 });
}

// ================================================================== 3. the Sondelass's forms (1 cutlass, 2 rod, 3 hook), and stowed mid-form
if (part('sondelass')) {
  S.phase = 'sondelass forms';
  await tl(`stand(${J(LAB)}, ${LAB_YAW})`);
  await key('KeyQ', 2); await S.ticks(60);
  for (const [k, form] of [['Digit2', 'rod'], ['Digit3', 'hook'], ['Digit1', 'cutlass']]) {
    await key(k, 2); await S.ticks(40);
    const s = await tl('sond()');
    S.check(`sondelass: ${k} takes the ${form} form`, s.form === form, s);
    await S.shot(`sondelass-${form}`);
  }
  // the rod: a cast charged and thrown, then stowed with the lure out
  await key('Digit2', 2); await S.ticks(30);
  await tl("mouse('Mouse0', 50)"); await S.ticks(60);
  const cast = await tl('sond()');
  S.note('sondelass rod: after a cast', cast);
  await key('KeyQ', 2); await S.ticks(60);
  const r1 = await tl('sond()');
  S.check('sondelass: stowed with the lure out, the lure comes home', !r1.lure && !r1.casting, r1);
  await settledChecks('sondelass stowed from the rod', { expectOut: null });
  // the hook: fired, stowed in flight
  await key('KeyQ', 2); await S.ticks(60); await key('Digit3', 2); await S.ticks(30);
  await S.ev(() => { __game.game.player.pitch = 0.5; }); // (aimed up at the lab's rigging)
  await tl("mdown('Mouse0')"); await S.ticks(3); await key('KeyQ', 2); await tl("mup('Mouse0')"); await S.ticks(60);
  const h1 = await tl('sond()');
  S.check('sondelass: stowed with the grapnel in flight, the line comes away', !h1.hook && !h1.att, h1);
  await S.ev(() => { __game.game.player.pitch = 0; });
  await settledChecks('sondelass stowed from the hook', { expectOut: null });
  // Blade Mode held, then stowed while held
  await key('KeyQ', 2); await S.ticks(60); await key('Digit1', 2); await S.ticks(20);
  await tl("mdown('Mouse2')"); await S.ticks(40);
  const bm = await tl('world()');
  S.note('sondelass: Blade Mode held', { holds: bm.holds, scale: bm.scale, look: bm.look, cinema: bm.cinema, sond: await tl('sond()') });
  await key('KeyQ', 2); await S.ticks(10); await tl("mup('Mouse2')"); await S.ticks(30);
  const bq = await tl('world()'), bs = await tl('sond()'), bt = (await tl('tools()')).find((t) => t.id === 'sondelass');
  S.check('sondelass: Q in Blade Mode, RMB let go: Blade Mode ends and time runs again', !bs.bladeMode && !bq.holds.includes('blade') && bq.scale > 0.9,
    { bladeMode: bs.bladeMode, holds: bq.holds, scale: bq.scale, drawT: bt.drawT, cause: bs.bladeMode ? 'sondelass.js: Q sets drawTarget 0, so held (drawT >= 1) goes false and cutlass.update (which runs blade.update, the RMB let-go and the drain) stops; cutlass.cancel() waits for drawT <= 0.02, and the holster runs on dt scaled by Blade Mode\'s own 0.05' : null });
  for (let i = 0; i < 40 && (await tl('world()')).holds.length; i++) await S.ticks(30); // (let it wind down before measuring the rest)
  await settledChecks('sondelass stowed mid-Blade-Mode (wound down)', { expectOut: null });
  const c = await core();
  S.check('sondelass forms: the core movement exactly as before', sameCore(c), { base: BASE, now: c });
}

// ================================================================== 4. the Soul Brush's modes and the Lachrymato Bottle worn
if (part('brush')) {
  S.phase = 'brush';
  await tl(`stand(${J(LAB)}, ${LAB_YAW})`); await S.ticks(10);
  const b0 = await tl('bottle()');
  S.check('Lachrymato Bottle: the box\'s fitting is worn on the upper back', b0.fit && b0.look && b0.lookId === b0.fit && b0.shown && b0.spine !== null && b0.spine < 0.35 && b0.at && b0.at[2] < 0, b0);
  await key('KeyG', 2); await S.ticks(60);
  for (const [k, mode] of [['Digit2', 'mop'], ['Digit1', 'paint']]) {
    await key(k, 2); await S.ticks(10);
    const br = await tl('brush()');
    S.check(`soulbrush: ${k} takes the ${mode} mode`, br.mode === mode, br);
  }
  const held0 = (await tl('bottle()')).held;
  await tl("mdown('Mouse0')"); await S.ticks(150); await S.shot('soulbrush-paint-saturated');
  const mid = await tl('brush()'); await tl("mup('Mouse0')"); await S.ticks(60);
  const held1 = (await tl('bottle()')).held;
  S.note('soulbrush paint: LMB held 2.5 s', { mid, bottleHeld: [held0, held1] });
  await key('Digit2', 2);
  await tl("mdown('Mouse0')"); await S.ticks(40); await key('KeyG', 2); await S.ticks(10); await tl("mup('Mouse0')"); await S.ticks(60);
  const br2 = await tl('brush()');
  S.check('soulbrush: stowed mid-saturate, the load ends', !br2.busy && !br2.celestial && !br2.club, br2);
  await key('KeyG', 2); await S.ticks(60); await tl("mdown('Mouse2')"); await S.ticks(40); await key('KeyG', 2); await S.ticks(10); await tl("mup('Mouse2')");
  await settledChecks('soulbrush stowed mid-Celestial-mode', { expectOut: null });
  // the bottle taken off in the box, then put back: the model goes and comes with the fitting
  const fitted = (await tl('bottle()')).fit;
  await S.ev(() => __game.game.pneuka.fitOff('bottle')); await S.ticks(10);
  const off = await tl('bottle()');
  S.check('Lachrymato Bottle: taken off in the box, gone from the back', !off.fit && !off.shown, off);
  await S.ev((id) => { const b = __game.game.pneuka; return b.fitOn(b.slots.findIndex((s) => s?.id === id)); }, fitted); await S.ticks(10);
  const on = await tl('bottle()');
  S.check('Lachrymato Bottle: put back on, worn again with what it held', on.fit === fitted && on.shown && Math.abs(on.held - (await tl('bottle()')).held) < 0.01, on);
  const c = await core();
  S.check('soulbrush: the core movement exactly as before', sameCore(c), { base: BASE, now: c });
}

// ================================================================== 5. the fittings: the Lockheart's coffin and Possibilikeys against the box
if (part('fittings')) {
  S.phase = 'fittings';
  await S.ticks(5);
  const r0 = await tl('ring()');
  S.check('Lockheart: the coffin hung is the one fitted', r0.coffin === (r0.heart || 'heart.plain'), r0);
  S.check('Lockheart: the Possibilikeys strung are the ones on the ring', r0.strung === r0.keys.length, r0);
  const added = await S.ev(() => { const b = __game.game.pneuka; const ok = b.add?.('key.brass', 'test'); const i = b.slots.findIndex((s) => s?.id === 'key.brass'); return { ok, fit: i >= 0 ? b.fitOn(i) : false }; });
  await S.ticks(10);
  const r1 = await tl('ring()');
  S.check('Lockheart: a brass Possibilikey fitted is strung on the chain', added.fit && r1.keys.includes('key.brass') && r1.strung === r1.keys.length, { added, ...r1 });
  await key('KeyI', 2); await S.ticks(60); await S.shot('lockheart-with-key');
  await key('KeyI', 2); await S.ticks(60);
  await S.ev(() => __game.game.pneuka.fitOff('keys', __game.game.pneuka.fitted('keys').indexOf('key.brass'))); await S.ticks(10);
  const r2 = await tl('ring()');
  S.check('Lockheart: the Possibilikey taken off is gone from the chain', r2.strung === r2.keys.length && !r2.keys.includes('key.brass'), r2);
}

// ================================================================== 6. swapped fast, and one key spammed
if (part('swap')) {
  S.phase = 'swap';
  await tl(`stand(${J(LAB)}, ${LAB_YAW})`);
  const order = ['KeyX', 'KeyQ', 'KeyG', 'KeyJ', 'KeyI'];
  const n = quick ? 4 : 12;
  for (let r = 0; r < n; r++) for (const k of order) await key(k, 2);
  await S.ticks(120);
  await S.shot('swap-fast');
  const after = await tl('out()');
  S.check('swap: five keys pressed 2 ticks apart, the last one asked for is the one out', after.length === 1 && after[0] === 'lockheart', { out: after, tools: (await tl('tools()')).map((t) => [t.id, t.drawT, t.wants]) });
  await settledChecks('swap fast', { world: false });
  // a draw cut off by the next key at every point of the draw (0..30 ticks in)
  const stuck = [];
  for (let d = 0; d <= 30; d += quick ? 15 : 5) { await stowAll(); await key('KeyQ', d); await key('KeyG', 2); await S.ticks(90); const o = await tl('out()'); if (J(o) !== J(['soulbrush'])) stuck.push({ after: d, out: o }); }
  S.check('swap: the Sondelass cut off at any point of its draw, the Soul Brush comes out', !stuck.length, stuck.length ? stuck : 'every point');
  // one key spammed: twenty presses a tick apart (an even number: it should end put away)
  await stowAll();
  for (const id of ['sondelass', 'veritome', 'lockheart']) {
    for (let i = 0; i < 20; i++) await key(KEYS[id], 1);
    await S.ticks(90);
    const t = (await tl('tools()')).find((x) => x.id === id);
    S.check(`swap: ${KEYS[id]} spammed 20 times (even), ${id} ends consistent`, (t.drawT === 0 && !t.wants) || (t.drawT === 1 && t.wants), t);
    await stowAll();
  }
  await settledChecks('swap spam', { expectOut: null });
  const c = await core();
  S.check('swap: the core movement exactly as before', sameCore(c), { base: BASE, now: c });
}

// ================================================================== 7. drawn mid-jump, mid-slide, swimming and on a ladder
if (part('moves')) {
  S.phase = 'moves';
  // mid-jump
  await tl(`stand(${J(LAB)}, ${LAB_YAW})`);
  await tl("mdown('Space')"); await S.ticks(1); await tl("mup('Space')"); await S.ticks(8); await key('KeyQ', 2); await S.ticks(10);
  const air = await S.ev(() => ({ grounded: __game.game.player.grounded, drawT: __tl.tools().find((t) => t.id === 'sondelass').drawT }));
  await S.shot('draw-mid-jump');
  S.check('moves: the Sondelass drawn mid-jump comes out in the air', !air.grounded && air.drawT > 0.1, air);
  await settledChecks('moves mid-jump landed', { expectOut: 'sondelass', world: false });
  await stowAll();
  // mid-slide
  await tl(`stand(${J(LAB)}, ${LAB_YAW})`);
  await S.page.keyboard.down('KeyW'); await S.page.keyboard.down('ShiftLeft'); await S.ticks(40); await key('KeyC', 6);
  const sl = await S.ev(() => ({ slideT: __game.game.player.slideT, crouch: __game.game.player.crouching }));
  await key('KeyG', 2); await S.ticks(10); await S.shot('draw-mid-slide');
  await S.page.keyboard.up('KeyW'); await S.page.keyboard.up('ShiftLeft');
  S.note('moves: the slide when the Soul Brush was asked for', sl);
  await settledChecks('moves mid-slide', { expectOut: 'soulbrush', world: false });
  await stowAll();
  // swimming: drawn before the water, in the water, then out again
  await key('KeyQ', 2); await S.ticks(60);
  await tl('stand([-28, -16.5, -60], 0)'); await S.ticks(40);
  const sw = await tl('world()'), swT = await tl('tools()');
  await S.shot('swimming-with-sondelass');
  S.check('moves: swimming, the Sondelass goes away (both hands swim)', sw.tech === 'swim' && swT.find((t) => t.id === 'sondelass').drawT <= 0.02, { tech: sw.tech, sondelass: swT.find((t) => t.id === 'sondelass') });
  for (const id of ['veritome', 'lockheart', 'psygun']) { await key(KEYS[id], 2); await S.ticks(30); }
  const swo = await tl('out()');
  S.check('moves: swimming, no tool comes out by its key', !swo.length, { out: swo });
  await tl(`stand(${J(LAB)}, ${LAB_YAW})`); await S.ticks(90);
  const back = await tl('out()');
  S.note('moves: out of the water, what came back to the hand', back);
  await settledChecks('moves after swimming', { world: false });
  await stowAll();
  // a ladder: drawn while climbing (W held into it)
  await tl('stand([-28, -14, -46.2], 3.14159)');
  await S.page.keyboard.down('KeyW'); await S.ticks(30);
  for (const id of ['sondelass', 'soulbrush', 'lockheart']) {
    await key(KEYS[id], 2); await S.ticks(60);
    const st = await tl('world()'), t = (await tl('tools()')).find((x) => x.id === id);
    await S.shot(`ladder-${id}`);
    S.note(`moves: on the ladder with ${id} asked for`, { tech: st.tech, drawT: t.drawT, fromRightHand: t.hand });
    S.check(`moves: on the ladder, ${id} is in the hand or away (never between)`, t.drawT === 0 || (t.drawT === 1 && t.hand < 0.75), t);
  }
  await S.page.keyboard.up('KeyW');
  await tl(`stand(${J(LAB)}, ${LAB_YAW})`);
  await stowAll();
  await settledChecks('moves after the ladder', { expectOut: null });
  const c = await core();
  S.check('moves: the core movement exactly as before', sameCore(c), { base: BASE, now: c });
}

// ================================================================== 8. the god hand (~) with a tool out
if (part('god')) {
  S.phase = 'god';
  await tl(`stand(${J(LAB)}, ${LAB_YAW})`);
  const godOut = async () => { for (let i = 0; i < 4 && (await S.ev(() => __game.game.god.state)) !== 'off'; i++) { await key('Backquote', 2); await S.ticks(120); } };
  for (const id of ['sondelass', 'psygun', 'lockheart']) {
    await key(KEYS[id], 2); await S.ticks(60);
    await key('Backquote', 2); await S.ticks(90);
    const st = await tl('world()'), shown = (await tl('tools()')).filter((t) => t.shown).map((t) => t.id);
    await S.shot(`god-with-${id}`);
    S.check(`god hand over ${id} out: the god hand is on`, st.god !== 'off', { god: st.god });
    S.check(`god hand over ${id} out: no tool of the Courier's shown`, !shown.length, { shown, hidden: st.hidden });
    await godOut(); await S.ticks(60);
    const t = (await tl('tools()')).find((x) => x.id === id);
    S.note(`god hand left: ${id}`, t);
    await settledChecks(`god hand left (${id} was out)`, { world: false });
    await stowAll();
  }
  // mid-Blade-Mode
  await key('KeyQ', 2); await S.ticks(60); await tl("mdown('Mouse2')"); await S.ticks(40);
  await key('Backquote', 2); await tl("mup('Mouse2')"); await S.ticks(120);
  const gb = await tl('world()'), gs = await tl('sond()'), gt = await S.ev(() => +__game.game.god.t.toFixed(2));
  S.check('god hand over Blade Mode: refused, or Blade Mode ends and time runs again', gb.god === 'off' || (!gs.bladeMode && gb.scale > 0.9),
    { god: gb.god, godT: gt, after: '2 real s', bladeMode: gs.bladeMode, holds: gb.holds, scale: gb.scale, cause: gs.bladeMode ? "godhand.js canEnter() does not ask for Blade Mode; the tools' ticks stop under the god hand, so blade.update (RMB let go, the drain) never runs and the hold 'blade' (0.05) stays: the god hand's 1.2 s entry takes 24 real s" : null });
  for (let i = 0; i < 120; i++) { const w = await tl('world()'); if (w.god === 'off' && !w.holds.length) break; if (w.god === 'on') await key('Backquote', 2); await S.ticks(60); } // (wound down: up to 2 real minutes of ticks)
  await stowAll();
  await settledChecks('god hand mid-Blade-Mode (wound down)', { expectOut: null });
  await S.common('god hand left');
  const c = await core();
  S.check('god: the core movement exactly as before', sameCore(c), { base: BASE, now: c });
}

// ================================================================== 9. careless: the pause mid-verb, a resize mid-draw, a tool taken off while out, travel mid-verb
if (part('careless')) {
  S.phase = 'careless';
  const pause = () => S.ev(() => { document.getElementById('overlay').style.display = 'flex'; __game.input.enabled = false; });
  for (const [id, b, n] of [['psygun', 'Mouse0', 40], ['lockheart', 'Mouse0', 40], ['veritome', 'Mouse2', 40], ['soulbrush', 'Mouse0', 40]]) {
    await tl(`stand(${J(LAB)}, ${LAB_YAW})`);
    if (id !== 'psygun') { await key(KEYS[id], 2); await S.ticks(60); }
    await tl(`mdown('${b}')`); await S.ticks(n);
    await pause(); await S.ticks(10); await tl(`mup('${b}')`); await S.ticks(30); await S.resume(); await S.ticks(30);
    const w = await tl('world()');
    S.check(`careless: paused mid ${id} ${b} and let go, the slow is given back`, w.speedMult === 1 && !w.holds.length, { speedMult: w.speedMult, holds: w.holds, look: w.look, fov: w.fov });
    await stowAll();
    await settledChecks(`careless after the pause mid ${id}`, { expectOut: null });
  }
  // a resize mid-draw
  await key('KeyJ', 2); await S.ticks(10);
  await S.page.setViewportSize({ width: 640, height: 900 }); await S.ticks(30); await S.shot('resize-tall-veritome');
  await S.page.setViewportSize({ width: 960, height: 600 }); await S.ticks(60);
  await settledChecks('careless resize mid-draw', { expectOut: 'veritome', world: false });
  await stowAll();
  // a tool taken off while it is out (the box's Take off), and its key pressed after
  await key('KeyQ', 2); await S.ticks(60);
  const m = await tl('mark()');
  await S.ev(() => __game.game.pneuka.takeOff('sondelass')); await S.ticks(30);
  await key('KeyQ', 2); await S.ticks(30);
  const ev = await sinceMark(m), t = (await tl('tools()')).find((x) => x.id === 'sondelass');
  S.check('careless: the Sondelass taken off while out is put away and not shown', t.drawT === 0 && !t.shown && !t.worn, t);
  S.check('careless: its key then says it is in the Pneuka Box', ev.log.some((l) => /Pneuka Box/.test(l)), ev.log);
  S.check('careless: those lines show no code ids', !(await tl(`codeIds(${J(ev.log)})`)).length, ev.log);
  await tl(`wearSet(${J(WORN0)})`);
  await settledChecks('careless after taking the Sondelass off', { expectOut: null });
  // travel away mid-verb and back
  await key('KeyI', 2); await S.ticks(60); await tl("mdown('Mouse0')"); await S.ticks(20);
  await S.go('workshop'); await tl("mup('Mouse0')"); await S.ticks(30);
  await S.common('careless travelled mid-hoover');
  await S.go('lab'); await stowAll();
  await settledChecks('careless travelled and back', { expectOut: null });
  const c = await core();
  S.check('careless: the core movement exactly as before', sameCore(c), { base: BASE, now: c });
}

// ================================================================== 10. leaks: twenty draws and stows of each tool
if (part('leak')) {
  S.phase = 'leak';
  await tl(`stand(${J(LAB)}, ${LAB_YAW})`);
  const cycle = async (id, k) => { for (let i = 0; i < k; i++) { await key(KEYS[id], 2); await S.ticks(40); if (id === 'psygun' || id === 'sondelass' || id === 'soulbrush') await tl("mouse('Mouse0', 0)"); await key(KEYS[id], 2); await S.ticks(40); } };
  for (const id of WORN0) await cycle(id, 1); // (a warm pass: pools and first-use things made once)
  await S.ticks(300);
  const c0 = await tl('counts()');
  for (const id of WORN0) await cycle(id, quick ? 5 : 20);
  await S.ticks(300);
  const c1 = await tl('counts()');
  S.check('leak: the scene\'s objects after twenty draws of each worn tool', c1.objects <= c0.objects + 2 && c1.geometries <= c0.geometries + 4, { before: c0, after: c1 });
  await settledChecks('leak', { expectOut: null });
}

// ================================================================== the end: the whole log read once
S.phase = 'end';
const all = await S.ev(() => __game.game.log.lines.map((l) => l.text));
S.check('log: never says she/he of the Courier', !(await tl(`gendered(${J(all)})`)).length, await tl(`gendered(${J(all)})`));
S.check('log: shows no code ids', !(await tl(`codeIds(${J(all)})`)).length, await tl(`codeIds(${J(all)})`));
await S.done();
