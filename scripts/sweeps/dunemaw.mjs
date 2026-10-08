// ---------------------------------------------------------------------------------------
// THE DUNEMAW SWEEP: the Great Dunemaw driven headless as a person would and as a careless one would, with a screenshot at every step and
// one PASS/FAIL line a check. What it sweeps: the mouth out on the sand (its interact chevron on the pool, the Dreamvane's signature, F
// and the maw wipe, F spammed); each of the three floors (the way up and the way down with the chevron on them, the arches, the lanes'
// clear middles, the sandfalls that never close on the Courier, the floor taken down whole when it is left, no help or banner of the
// basement's said or shown below); a run taken down and walked back up with its haul (a floor's material); a shatter inside a run (the
// run lost, the floors gone, the Courier made whole and controllable); the Wake Whistle (whistle.wake: 1.5 real seconds of breath, broken
// by a blow, refused outside a Well, spammed); and the great cavern's bowl against docs/plans/DUNEMAW-EXTREME.md's acceptance list: the
// FOE and the Lip Stone seen before the pull, clutches round the rim, a clutch broken and the log counting it, the crown cracked by rams
// into a pillar and broken in three, every cast named in the log as it begins and Lidfall parryable, the transition (Unstopped: the
// sink, the Blowout, the brood), the Sherds and their mend, the enrage (The Dunemaw Swallows) and a wipe that returns the Courier to the
// Lip Stone with the run kept, and the end: the way up, the haul home, the cosmetics dropped. Careless: Esc and the Pneuka Box under the
// maw wipe, a resize mid-floor and mid-fight, travel away mid-run and back, and enter-and-leave many times with the scene, the renderer's
// memory, the physics world and the jellies counted before and after. Every event the Well and the fight send is kept; one without `by`
// fails, and a log line calling the Courier he or she, or showing a code id, fails.
//
//   npm run dev &                     (or URL=http://host:port/ for a build under `vite preview`)
//   node scripts/sweeps/dunemaw.mjs [--out dir] [--seed 1] [--quick] [--only mouth,floors,run,shatter,whistle,cavern,fight,careless]
//   (shots to <out>/shots, default <tmp>/sweeps/dunemaw; --quick runs fewer repeats and a shorter fight)
//
// The fight's clock is the game's own (ticks of 1/60 s); where a test needs a later moment it moves the FOE's health (the phase is
// picked by its share, as in play) or the timeline's clock (the enrage), never the code under test. The Courier is kept whole between
// checks in the fight (the pool and the cracks mended), a tester's god mode, so the casts can be watched to the end.
//
// Prior art: scripts/sweeps/garden.mjs, dunes.mjs and the harness (the page measured from inside through window.__game), scripts/
// stress.mjs (manual mode, the clock pinned: the casebook's rule 3), a QA team's smoke pass (every place entered, every window opened and
// shut), and a raid team's timeline check (Cactbot's and ACT's timeline files: every cast seen at its time, the log line for each).
// Dovina's (mechanical testing: the owner, 2026-10-07).
// ---------------------------------------------------------------------------------------
import path from 'path';
import { open, args } from './harness.mjs';

const S = await open('dunemaw');
const only = typeof args.only === 'string' ? new Set(args.only.split(',')) : null;
const part = (id) => !only || only.has(id);
const quick = S.quick;
const REPS = quick ? 3 : 10;

// ---- the page's side: what this sweep measures beyond the harness's
const DM_JS = `
window.__dm = (() => {
  const G = __game, g = G.game, THREE = G.THREE, v = __sw.v, W = g.well;
  const seen = [];
  const flat = (d) => { const o = {}; for (const [k, x] of Object.entries(d || {})) o[k] = x === null || typeof x !== 'object' ? x : Array.isArray(x) ? x.slice(0, 8).map((y) => (y !== null && typeof y === 'object' ? '[object]' : y)) : x.isVector3 ? v(x) : (x.constructor === Object ? JSON.parse(JSON.stringify(x)) : '[object]'); return o; };
  { const E = g.events, emit = E.emit; E.emit = function (n, d = {}) { if (!/\\.tick$/.test(n)) seen.push({ name: n, keys: Object.keys(d || {}), by: d && 'by' in d ? d.by : undefined, d: flat(d) }); return emit.call(this, n, d); }; } // (the payload as sent, before the bus adds its own)
  const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const D = {
    seen,
    mark() { return { ev: seen.length, log: g.log.said || 0 }; }, // (the log keeps its last 400 lines; each line has its seq: Petra, v114)
    eventsSince(m) { return seen.slice(m.ev).map((e) => ({ name: e.name, keys: e.keys, by: e.by, d: e.d })); },
    logSince(m) { return g.log.lines.filter((l) => l.seq > m.log).map((l) => l.text); },
    logTail(n = 6) { return g.log.lines.slice(-n).map((l) => l.text); },
    win() {
      const ov = document.getElementById('overlay');
      return { pause: ov.style.display !== 'none', index: !!g.indexMenu?.open, codex: !!g.codex?.open, pneuka: !!g.pneukaUI?.open, map: !!g.cartography?.open,
        dialogue: !!g.dialogue?.open, tech: g.techs?.active?.id || null, enabled: !!G.input.enabled, freeze: !!g.player.freeze, seamBusy: !!g.seam?.busy, death: !!g.death?.active, cinema: !!g.cinema?.active };
    },
    closeAll() {
      g.pneukaUI?.open && g.pneukaUI.close(); g.codex?.open && g.codex.close?.(); g.cartography?.open && g.cartography.hide?.(); g.indexMenu?.open && g.indexMenu.close();
      document.getElementById('overlay').style.display = 'none'; G.input.enabled = true;
    },
    counts() {
      let n = 0, floors = 0, bowls = 0; const sib = new Set(); g.scene.children.forEach((c) => { if (/^Waiting-/.test(c.name)) c.traverse((o) => sib.add(o)); }); // (the siblings waiting at their meeting spots are the party's, not the Well's: Petra, v112)
      g.scene.traverse((o) => { if (sib.has(o)) return; n++; if (/^well-floor-/.test(o.name) && o !== W.warm?.group) floors++; if (o.name === 'well-bowl') bowls++; });
      const i = G.renderer.info, Wd = g.physics.world;
      return { objects: n, top: g.scene.children.length, floors, bowls, geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs?.length ?? null,
        bodies: Wd.bodies.len(), colliders: Wd.colliders.len(), jellies: g.jellies?.list.length ?? null, creatures: g.creatures?.list?.length ?? null };
    },
    chevron() { const I = g.interact, C = I.chevron, cur = I.cur; return { cur: cur?.id || null, ref: typeof cur?.ref === 'string' ? cur.ref : null, at: cur ? v(cur.pos) : null, shown: C.group.visible, chev: v(C.group.position), off: cur ? +C.group.position.distanceTo(cur.pos).toFixed(2) : null }; },
    /** Stand at a point (a tester's teleport). In a Well, places.stand refuses (its floors are gone into from the mouth), so the Well's
     *  own way is used: course.teleport with the Well's two frames of grace (dunemaw.js toArrival). */
    stand(p, yaw = 0) {
      const to = new THREE.Vector3(...p);
      if (W.active && W.cur) { W.moving = 2; g.course.teleport(to, yaw, { keepPool: true }); } else if (!g.places.stand(to, yaw)) return false;
      g.player.yaw = yaw; g.player.vel?.set?.(0, 0, 0); return true;
    },
    pos() { return v(g.player.pos); },
    gendered(lines) { return lines.filter((t) => /\\b(Courier|Couriers?'s?)\\b[^.]*\\b(she|he|her|him|his|hers|himself|herself)\\b/i.test(t) || /^(She|He) /.test(t)); },
    /** A code id shown to the player: a dotted id (mat.edge, foe.cast) or a camelCase word (crownBash). */
    codeIds(lines) { return lines.filter((t) => /\\b[a-z]+\\.[a-z][a-zA-Z]+\\b/.test(t.replace(/\\b\\d+\\.\\d+/g, '')) || /\\b[a-z]+[A-Z][a-z]+[a-zA-Z]*\\b/.test(t)); },
    heal() { g.vesselDamage?.mendAll?.(true); g.lachryma && (g.lachryma.value = g.lachryma.max); },
    // ---- the Well
    well() {
      const F = W.cur, R = W.run;
      return { active: W.active, floor: W.floor, cavern: !!F?.isCavern, zone: g.zones.current, killY: +g.player.killY.toFixed(1), haul: R ? R.haul.map((h) => h.id) : null, deepest: R?.deepest ?? null,
        up: F?.up ? v(F.up.pos) : null, down: F?.down ? v(F.down.pos) : null, arrive: F ? v(F.arrive.pos) : null, mobs: W.mobs.length, escaping: !!W.escaping,
        falls: F?.sandfalls?.map((s) => s.state) || null, cells: F?.cells?.length ?? null };
    },
    /** What is drawn of the floor: the pools shown, the arches (a doorway's ring), each room's middle clear (the lanes meet there). */
    floorLook() {
      const F = W.cur; if (!F || F.isCavern) return null;
      const by = (re) => { const out = []; F.group.traverse((o) => { if (re.test(o.name)) out.push(o); }); return out; };
      const up = by(/^pool-up$/), down = by(/^pool-down$/);
      const doors = F.cells.reduce((n, c) => n + c.doors.length, 0) / 2;
      // a ray down at each room's middle: what it meets first should be the room's sand (the middle is kept clear: prefabs.js, the socket)
      const ray = new THREE.Raycaster(), hits = [];
      for (const c of F.cells) { ray.set(new THREE.Vector3(c.x, c.y + 12, c.z), new THREE.Vector3(0, -1, 0)); ray.far = 24; const h = ray.intersectObject(F.group, true).find((h) => shown(h.object) && h.object.material?.visible !== false); hits.push({ cell: c.c + ',' + c.r, tpl: c.tpl?.id || c.tpl?.name || null, first: h ? (h.object.name || h.object.parent?.name || h.object.type) : null, dy: h ? +(h.point.y - c.y).toFixed(2) : null }); }
      return { upShown: up.some(shown), downShown: down.some(shown), doors, sandfalls: F.sandfalls.length, middles: hits };
    },
    /** Put every jelly on this floor down, as the Courier's blows would (creatures.strike, the weapons' one door). */
    clearFloor() {
      let n = 0;
      for (const c of W.mobs) { let k = 0; while (c.alive && k++ < 60) g.creatures.strike(c, c.pos.clone().setY(c.pos.y + 0.5), new THREE.Vector3(0, 0, 1), 4, 'shot', 'courier'); if (!c.alive) n++; }
      return n;
    },
    nearPool(which, off = 1.2) { const F = W.cur, p = F?.[which]?.pos; if (!p) return false; return D.stand([p.x + off, p.y + 0.15, p.z], -Math.PI / 2); },
    box() { return g.pneuka.slots.filter(Boolean).map((s) => s.id); },
    // ---- the great cavern
    cavern() {
      const C = W.cur; if (!C?.isCavern) return null;
      const F = C.foe, R = C.raid, B = C.bowl;
      let lip = null; B.group.traverse((o) => { if (o.name === 'lip-stone') lip = o; });
      const lipAt = lip ? lip.getWorldPosition(new THREE.Vector3()) : null;
      return { foe: F ? { state: F.state, shown: shown(F.c.root), stage: F.stage, share: +F.share.toFixed(3), phase: F.phase, ended: F.ended, at: v(F.c.pos), plates: F.plates } : null,
        raid: R ? { pulled: R.pulled, phase: R.phaseName, t: +R.T.t.toFixed(1), casting: R.T.casting?.id || null, sherds: R.sherds ? R.sherds.filter((c) => c.alive).length : null, over: !!R.over, rec: R.record() } : null,
        lip: lipAt ? { at: v(lipAt), shown: shown(lip) } : null, lipFromCourier: lipAt ? +Math.hypot(lipAt.x - g.player.pos.x, lipAt.z - g.player.pos.z).toFixed(1) : null,
        arrive: v(C.arrive.pos), clutches: C.nursery.clutches.map((k) => ({ alive: k.alive, eggs: k.look?.alive ?? null, shown: shown(k.root || k.look?.group) })), whole: C.nursery.whole,
        brood: C.nursery.brood.filter((c) => c.alive).length, guards: C.guards.filter((c) => c.alive).length, up: C.up ? v(C.up.pos) : null,
        pillars: B.pillars.map((p) => p.state), broken: [...(W.run?.broken || [])] };
    },
    foe() { return W.cur?.foe; },
    wake() { const F = W.cur.foe; F.wake(); return F.state; },
    setShare(s) { const F = W.cur.foe; F.c.hp = Math.max(1, Math.round(F.c.maxHp * s)); return +F.share.toFixed(3); },
    breakClutch(i) { const N = W.cur.nursery, k = N.clutches[i]; if (!k?.alive) return false; N.break(k, 'courier'); return true; },
    /** A ram into pillar i, as the FOE's charge meets it (bowl.ramHit, then the body's own rammed()). */
    ramPillar(i) { const C = W.cur, F = C.foe, B = C.bowl, p = B.pillars[i]; const hit = B.ramHit(p.x, p.z, 1.5); if (!hit) return { hit: null }; F.rammed(hit); return { hit: hit.kind, pillar: p.state, stage: F.stage }; },
    windups() { const w = W.cur?.foe?.c.windup; return w ? [{ kind: w.kind, parry: w.parry, mark: !!w.mark, listed: g.creatures.windups(g.player.pos, 60).includes(W.cur.foe.c) }] : []; },
    parryFoe() { const F = W.cur.foe; g.creatures.parried(F.c); return { state: F.state, parried: !!F.parried }; },
    burstFoe() { const F = W.cur.foe; let k = 0; F.c.hp = 2; while (F.c.alive && k++ < 40) g.creatures.strike(F.c, F.c.pos.clone().setY(F.c.pos.y + 0.6), new THREE.Vector3(0, 0, 1), 4, 'shot', 'courier'); return { alive: F.c.alive, hp: F.c.hp }; },
    enrageSoon(s = 6) { const T = W.cur.raid.T; T.t = Math.max(T.t, 570 - 5 - s); return +T.t.toFixed(1); },
    basementBanner() { const B = g.course, el = B?.el; return el ? { display: el.style.display, text: (el.textContent || '').trim().slice(0, 80), visible: el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden' && el.style.display !== 'none' } : null; },
  };
  return D;
})();
`;
await S.page.addScriptTag({ content: DM_JS });
const dm = (expr) => S.page.evaluate(`__dm.${expr}`);
const heal = () => dm('heal()');
/** Ticks with the Courier kept whole every half second (the fight's god mode). */
const godTicks = async (n) => { for (let k = 0; k < n; k += 30) { await S.sw(`tick(${Math.min(30, n - k)})`); await heal(); } };
/** Every event since a mark sent without `by` (the Well's and the fight's, and the Courier's own). */
const OURS = /^((well|foe|clutch|find|floor|cogitomap)\.|courier\.(shatter|reform)$|cube\.(earn|spill)$)/;
const noBy = (evs) => [...new Set(evs.filter((e) => OURS.test(e.name) && e.by === undefined).map((e) => e.name))];
const words = async (label, m) => {
  const lines = await dm(`logSince(${JSON.stringify(m)})`);
  S.check(`${label}: no log line calls the Courier he or she`, !(await S.ev((l) => __dm.gendered(l), lines)).length, (await S.ev((l) => __dm.gendered(l), lines)).slice(0, 3));
  const ids = await S.ev((l) => __dm.codeIds(l), lines);
  S.check(`${label}: no code id in the log`, !ids.length, ids.length ? ids.slice(0, 4) : `${lines.length} lines`);
  const evs = await dm(`eventsSince(${JSON.stringify(m)})`), missing = noBy(evs);
  S.check(`${label}: every event carries by`, !missing.length, missing.length ? missing : `${evs.length} events`);
  return { lines, evs };
};
const W0 = (w) => `${w.zone}, floor ${w.floor}${w.cavern ? ' (the great cavern)' : ''}`;
/** The flythrough (a floor's preview on arrival, 3 to 5.5 real seconds) watched to its end. */
const flyDone = async () => { for (let i = 0; i < 16 && await S.ev(() => !!__game.game.flythrough?.active); i++) await S.ticks(30); };
/** Into the Well by F at the mouth (the maw wipe), as a person does. */
const enterByF = async () => { await S.go('well.mouth'); await S.ticks(10); await S.press('KeyF', 4); await S.settle(); await flyDone(); await S.ticks(10); return dm('well()'); };
/** Down a floor by F at the way down. */
const downByF = async () => { await dm(`nearPool("down")`); await S.ticks(40); const c = await dm('chevron()'); await S.press('KeyF', 4); await S.settle(); await flyDone(); await S.ticks(10); return { chev: c, well: await dm('well()') }; };
/** Out of any run, back on the sand, the world as it was (a tester's reset between parts). */
const reset = async () => { await dm('closeAll()'); await S.ev(() => { const W = __game.game.well; if (W.active) W.leave('walk'); }); await S.ticks(10); await S.settle(); await dm('heal()'); };

// =====================================================================================================================================
if (part('mouth')) {
  S.phase = 'mouth';
  const r = await S.go('well.mouth');
  S.check('mouth: the place well.mouth travels', r?.ok !== false, r);
  await S.ticks(20);
  await S.common('mouth');
  const ch = await dm('chevron()');
  S.check('mouth: interact chevron offered on the mouth', ch.cur === 'well' && ch.ref === 'mouth', ch);
  S.check('mouth: interact chevron sits over the pool', ch.shown && ch.off !== null && ch.off < 0.6, ch);
  const sig = await S.ev(() => { const g = __game.game, s = g.signatures; const m = (s?.around?.(g.well.mouthPos, 6) || []).find((x) => x.kind === 'well'); return m ? { kind: m.kind, strength: m.strength, d: +m.pos.distanceTo(g.well.mouthPos).toFixed(2) } : null; });
  S.check('mouth: the Dreamvane hears a signature of kind well', sig && sig.d < 2, sig);
  // F: the maw wipe, the first floor
  const m = await dm('mark()'), before = await dm('counts()');
  await S.press('KeyF', 3);
  const kind = await S.ev(() => { const j = __game.game.seam?.job; return j ? { phase: j.phase, maw: !!j.wipe, cover: document.getElementById('seam')?.dataset?.kind || null } : null; });
  await S.shot('mouth-maw-wipe');
  await S.settle(); await S.ticks(30);
  const w = await dm('well()');
  S.check('mouth: F goes down under the maw wipe', kind && kind.maw, kind);
  S.check('mouth: F at the mouth goes down to floor 1', w.active && w.floor === 1 && w.zone === 'well', W0(w));
  const evs = await dm(`eventsSince(${JSON.stringify(m)})`);
  S.check('mouth: one well.enter and one well.floor on F', evs.filter((e) => e.name === 'well.enter').length === 1 && evs.filter((e) => e.name === 'well.floor').length === 1, evs.filter((e) => /^well\./.test(e.name)).map((e) => e.name));
  const lines = await dm(`logSince(${JSON.stringify(m)})`);
  S.check('floor 1: the basement hub help is not said in a Well', !lines.some((t) => /index console|Tab panel/i.test(t)), lines.filter((t) => /index|Tab panel/i.test(t)));
  const ban = await dm('basementBanner()');
  S.check('floor 1: the basement course banner is not shown in a Well', !ban || ban.display === 'none' || !ban.text, ban);
  await words('mouth and floor 1', m);
  await S.common('floor-1-arrival');
  await reset();
  // F spammed at the mouth: one run, one floor standing
  await S.go('well.mouth'); await S.ticks(10);
  const m2 = await dm('mark()');
  for (let i = 0; i < 12; i++) { await S.page.keyboard.press('KeyF'); await S.ticks(1); }
  await S.settle(); await S.ticks(30);
  const c2 = await dm('counts()'), e2 = await dm(`eventsSince(${JSON.stringify(m2)})`);
  S.check('mouth: F spammed starts one run', e2.filter((e) => e.name === 'well.enter').length === 1, { enters: e2.filter((e) => e.name === 'well.enter').length, floors: e2.filter((e) => e.name === 'well.floor').map((e) => e.d.floor) });
  S.check('mouth: F spammed leaves one floor standing', c2.floors === 1 && (await dm('well()')).floor === 1, { floorsInScene: c2.floors, floor: (await dm('well()')).floor });
  await reset();
  S.note('mouth: counts before the first entry', before);
}

// =====================================================================================================================================
if (part('floors')) {
  S.phase = 'floors';
  await reset();
  const base = await dm('counts()');
  let w = await enterByF();
  const m = await dm('mark()');
  for (let n = 1; n <= 3; n++) {
    S.check(`floor ${n}: arrived on floor ${n}`, w.floor === n && !w.cavern && w.zone === 'well', W0(w));
    await S.common(`floor-${n}`);
    const L = await dm('floorLook()');
    S.check(`floor ${n}: the way up and the way down both drawn`, L.upShown && (L.downShown), { up: L.upShown, down: L.downShown });
    const blocked = L.middles.filter((h) => h.first && !/sand/i.test(h.first) && h.dy > 0.6);
    S.check(`floor ${n}: every room's middle is clear sand (the lanes meet there)`, !blocked.length, blocked.length ? blocked.slice(0, 4) : `${L.middles.length} rooms, ${L.doors} doorways, ${L.sandfalls} sandfalls`);
    // the Courier walks: shown and controllable
    const p0 = await dm('pos()'); await S.hold('KeyW', 40); const p1 = await dm('pos()');
    S.check(`floor ${n}: the Courier walks (W held)`, Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) > 1, { from: p0, to: p1 });
    // the way up's chevron, then the way down's
    await dm(`nearPool("up")`); await S.ticks(40);
    const cu = await dm('chevron()');
    S.check(`floor ${n}: interact chevron on the way up`, cu.cur === 'well' && cu.ref === 'up' && cu.off < 0.6, cu);
    const before = await dm('counts()');
    const d = await downByF();
    S.check(`floor ${n}: interact chevron on the way down`, d.chev.cur === 'well' && d.chev.ref === 'down' && d.chev.off < 0.6, d.chev);
    w = d.well;
    const after = await dm('counts()');
    S.check(`floor ${n}: left whole (one floor or the cavern standing after the way down)`, after.floors + after.bowls === 1, { floors: after.floors, bowls: after.bowls, before });
  }
  S.check('floors: the third floor\'s way down leads into the great cavern', w.cavern && w.zone === 'well', W0(w));
  await words('floors', m);
  // the sandfalls: never closing on the Courier (a floor with one: walk back up from the cavern by a fresh run)
  await reset();
  w = await enterByF();
  const fall = await S.ev(() => { const s = __game.game.well.cur.sandfalls[0]; return s ? { i: s.i, pos: __sw.v(s.pos), state: s.state } : null; });
  if (fall) {
    // stand in its doorway and run a whole cycle: it must never fall while they are there
    await dm(`stand([${fall.pos[0]}, ${fall.pos[1] + 0.2}, ${fall.pos[2]}], 0)`);
    let fell = false, states = new Set();
    for (let k = 0; k < (quick ? 30 : 90); k++) { await S.ticks(30); const st = await S.ev((i) => { const s = __game.game.well.cur.sandfalls.find((x) => x.i === i); return { state: s.state, held: s.held }; }, fall.i); states.add(st.state); if (st.state === 'falling') { const inDoor = await S.ev((i) => { const F = __game.game.well.cur, s = F.sandfalls.find((x) => x.i === i); const P = __game.game.player.pos; const dx = P.x - s.pos.x, dz = P.z - s.pos.z, c = Math.cos(s.yaw), n = Math.sin(s.yaw); return Math.abs(dx * c - dz * n) < 2.5 && Math.abs(dx * n + dz * c) < 1.1; }, fall.i); if (inDoor) fell = true; } }
    S.check('floor 1: a sandfall never falls on the Courier in its doorway', !fell, { states: [...states], seconds: quick ? 15 : 45 });
    await S.shot('floor-1-sandfall');
  } else S.note('floor 1: sandfalls', 'none on this seed\'s first floor');
  await reset();
  const end = await dm('counts()');
  S.check('floors: nothing left of the floors on the sand', end.floors === 0 && end.bowls === 0, end);
  S.note('floors: counts before and after', { base, end });
}

// =====================================================================================================================================
if (part('run')) {
  S.phase = 'run';
  await reset();
  const boxBefore = await dm('box()');
  let w = await enterByF();
  const m = await dm('mark()');
  const down = await dm('clearFloor()');
  await S.ticks(20);
  w = await dm('well()');
  S.check('run: floor 1 cleared gives a material to the haul', w.haul && w.haul.some((h) => /^mat\./.test(h)), { down, haul: w.haul });
  const d = await downByF();
  S.check('run: down to floor 2 with the haul kept', d.well.floor === 2 && d.well.haul.length >= w.haul.length, { floor: d.well.floor, haul: d.well.haul });
  // and back up the way up
  await dm(`nearPool("up")`); await S.ticks(40);
  const cubes0 = await S.ev(() => __game.game.cubes.balance);
  await S.press('KeyF', 4); await S.settle(); await S.ticks(30);
  w = await dm('well()');
  const evs = await dm(`eventsSince(${JSON.stringify(m)})`), leave = evs.find((e) => e.name === 'well.leave');
  S.check('run: up the way up ends the run on the sand', !w.active && w.zone === 'dunes', W0(w));
  S.check('run: well.leave says walked, not shattered, with pay', leave && leave.d.how === 'walk' && !leave.d.shattered && leave.d.pay > 0, leave?.d);
  const boxAfter = await dm('box()');
  const gained = boxAfter.filter((id) => /^mat\./.test(id)).length - boxBefore.filter((id) => /^mat\./.test(id)).length;
  S.check('run: the haul comes home into the Pneuka Box', gained >= 1, { gained, box: boxAfter.slice(0, 12) });
  const st = await S.sw('state()');
  const mouth = await S.ev(() => __sw.v(__game.game.well.mouthPos));
  S.check('run: made whole beside the mouth', Math.hypot(st.player[0] - mouth[0], st.player[2] - mouth[2]) < 8, { at: st.player, mouth });
  S.check('run: the dunes\' floor of the world back (killY)', w.killY > -600, { killY: w.killY });
  const cubes1 = await S.ev(() => __game.game.cubes.balance);
  S.check('run: the run\'s pay is earned in cubes', leave && cubes1 - cubes0 === leave.d.pay, { before: cubes0, after: cubes1, pay: leave?.d.pay });
  await words('run', m);
  await S.common('run-home');
}

// =====================================================================================================================================
if (part('shatter')) {
  S.phase = 'shatter';
  await reset();
  const base = await dm('counts()'), boxBefore = await dm('box()');
  await enterByF(); await dm('clearFloor()'); await S.ticks(20); await downByF();
  const m = await dm('mark()');
  await S.ev(() => __game.game.death.begin({ why: 'blow', by: 'creature' }));
  await S.ticks(90); await S.shot('shatter-mid');
  for (let i = 0; i < 12 && await S.ev(() => __game.game.death.active); i++) await S.ticks(30);
  await S.settle(); await S.ticks(30);
  const w = await dm('well()'), evs = await dm(`eventsSince(${JSON.stringify(m)})`), leave = evs.find((e) => e.name === 'well.leave');
  S.check('shatter: the run is lost', !w.active && leave && leave.d.shattered && leave.d.pay === 0, leave?.d ?? 'no well.leave');
  S.check('shatter: the haul does not come home', (await dm('box()')).filter((id) => /^mat\./.test(id)).length === boxBefore.filter((id) => /^mat\./.test(id)).length, { box: (await dm('box()')).slice(0, 10) });
  const reform = evs.find((e) => e.name === 'courier.reform');
  S.check('shatter: courier.reform says where', !!reform, reform?.d);
  const c = await dm('counts()');
  S.check('shatter: the floor is taken down', c.floors === 0 && c.bowls === 0, c);
  const win = await dm('win()');
  S.check('shatter: no cinema shot or freeze left on the Courier', !win.cinema && !win.freeze && !win.death, win);
  const p0 = await dm('pos()'); await S.hold('KeyW', 40); const p1 = await dm('pos()');
  S.check('shatter: the Courier walks after being made whole', Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) > 1, { from: p0, to: p1 });
  await words('shatter', m);
  await S.common('shatter-made-whole');
  S.note('shatter: counts before and after', { base, after: c });
}

// =====================================================================================================================================
if (part('whistle')) {
  S.phase = 'whistle';
  await reset();
  const has = () => S.ev(() => __game.game.pneuka.count('whistle.wake'));
  // outside a Well: refused, and the whistle kept
  await S.ev(() => { const g = __game.game; if (!g.pneuka.count('whistle.wake')) g.pneuka.add('whistle.wake', 'test'); });
  let m = await dm('mark()');
  const out = await S.ev(() => __game.game.well.escape());
  await S.ticks(120);
  S.check('whistle: refused outside a Well and kept', out === false && (await has()) === 1 && (await dm(`logSince(${JSON.stringify(m)})`)).some((t) => /not in a Well/.test(t)), { returned: out, whistles: await has(), log: await dm(`logSince(${JSON.stringify(m)})`) });
  // in a Well: 1.5 real seconds of breath, then out to the mouth with the haul
  await enterByF(); await dm('clearFloor()'); await S.ticks(20);
  const haul = (await dm('well()')).haul;
  m = await dm('mark()');
  const boxBefore = await dm('box()');
  for (let i = 0; i < 8; i++) await S.ev(() => __game.game.well.escape()); // (spammed: one channel)
  const starts = (await dm(`eventsSince(${JSON.stringify(m)})`)).filter((e) => e.name === 'well.escape.start').length;
  S.check('whistle: blown eight times starts one channel', starts === 1, { starts });
  await S.ticks(84); // 1.4 real seconds
  const mid = await dm('well()');
  S.check('whistle: still in the Well at 1.4 real seconds', mid.active && mid.escaping, W0(mid));
  await S.ticks(12); await S.settle(); await S.ticks(30);
  const w = await dm('well()'), evs = await dm(`eventsSince(${JSON.stringify(m)})`), leave = evs.find((e) => e.name === 'well.leave');
  S.check('whistle: out to the mouth by 1.6 real seconds and the seam', !w.active && leave?.d.how === 'escape', leave?.d ?? W0(w));
  S.check('whistle: the Wake Whistle breaks when blown', (await has()) === 0, { whistles: await has() });
  const boxAfter = await dm('box()');
  S.check('whistle: the haul comes home', boxAfter.filter((id) => /^mat\./.test(id)).length - boxBefore.filter((id) => /^mat\./.test(id)).length >= haul.length, { haul, box: boxAfter.slice(0, 10) });
  await S.common('whistle-home');
  // broken by a blow
  await S.ev(() => __game.game.pneuka.add('whistle.wake', 'test'));
  await enterByF();
  m = await dm('mark()');
  await S.ev(() => __game.game.well.escape()); await S.ticks(30);
  await S.ev(() => { const g = __game.game; g.vesselDamage.hit({ from: g.player.pos.clone().setX(g.player.pos.x + 1), k: 0.2, why: 'foe', by: 'creature' }); });
  await S.ticks(90);
  const wb = await dm('well()');
  S.check('whistle: a blow breaks the breath; still in the Well, whistle kept', wb.active && !wb.escaping && (await has()) === 1, { well: W0(wb), escaping: wb.escaping, whistles: await has(), log: await dm('logTail(3)') });
  // the whistle taken out of the box mid-breath (P is open to the Courier during the channel: dropped or sold there): no way out for free
  const m3 = await dm('mark()');
  await S.ev(() => __game.game.well.escape()); await S.ticks(30);
  await S.ev(() => { const g = __game.game, i = g.pneuka.slots.findIndex((s) => s?.id === 'whistle.wake'); if (i >= 0) g.pneuka.take(i); }); // (as a drop from the box takes it)
  await S.ticks(100); await S.settle();
  const free = (await dm(`eventsSince(${JSON.stringify(m3)})`)).find((e) => e.name === 'well.leave');
  S.check('whistle: no escape once the Wake Whistle has left the box mid-breath', !free, free ? free.d : { stillIn: (await dm('well()')).active });
  await words('whistle', m);
  await reset();
}

// =====================================================================================================================================
let cav = null, preCavern = null;
const toCavern = async () => { // (a fresh run straight to the great cavern: floors 1 to 3 by the way down, under the seam)
  await reset(); preCavern = await dm('counts()'); await enterByF();
  for (let n = 1; n <= 3; n++) await downByF();
  await S.ticks(60);
  for (let i = 0; i < 20 && await S.ev(() => !!__game.game.flythrough?.active); i++) await S.ticks(30);
  return dm('cavern()');
};
if (part('cavern') || part('fight')) {
  S.phase = 'cavern';
  cav = await toCavern();
  S.check('cavern: arrived in the great cavern', !!cav, cav ? 'the bowl' : await dm('well()'));
  await S.common('cavern-arrival');
  // acceptance 1: the FOE and the Lip Stone seen before the fight; clutches round the rim, with eggs, guarded
  S.check('accept 1: the FOE asleep and shown before the pull', cav.foe && cav.foe.state === 'asleep' && cav.foe.shown && !cav.raid.pulled, cav.foe);
  S.check('accept 1: the Lip Stone stands on the ledge', cav.lip && cav.lip.shown, cav.lip);
  const eggs = cav.clutches.filter((k) => k.alive && k.eggs > 0 && k.shown);
  S.check('accept 1: clutches round the rim with eggs', eggs.length >= 4, { clutches: cav.clutches.length, withEggs: eggs.length });
  S.check('accept 1: clutches guarded', cav.guards >= eggs.length, { guards: cav.guards });
  S.check('cavern: the Courier arrives at the Lip Stone', cav.lipFromCourier !== null && cav.lipFromCourier < 4, { metres: cav.lipFromCourier, arrive: cav.arrive, lip: cav.lip?.at });
  // acceptance 2: a clutch broken before the pull; the log counts it
  const m = await dm('mark()');
  await dm('breakClutch(0)'); await dm('breakClutch(1)'); await S.ticks(20);
  const c2 = await dm('cavern()'), lines = await dm(`logSince(${JSON.stringify(m)})`);
  S.check('accept 2: a clutch broken is gone from the nursery', c2.whole === cav.whole - 2 && c2.broken.length === 2, { whole: [cav.whole, c2.whole], broken: c2.broken });
  S.check('accept 2: the log counts a clutch broken', lines.some((t) => /clutch/i.test(t)), lines.length ? lines : 'no log line');
  await words('cavern', m);
  cav = c2;
}

if (part('fight')) {
  S.phase = 'fight';
  const m = await dm('mark()');
  await dm('wake()'); await godTicks(60);
  let c = await dm('cavern()');
  S.check('fight: the pull starts the timeline', c.raid.pulled && c.raid.phase === 'crown', c.raid);
  // acceptance 3: rams into a pillar crack it and crack the crown; three rams break the crown
  const rams = [];
  for (let i = 0; i < 3; i++) { rams.push(await dm(`ramPillar(${i})`)); await godTicks(30); }
  c = await dm('cavern()');
  S.check('accept 3: a pillar cracks, then falls', rams[0]?.hit === 'pillar' && ['cracked', 'fallen', 'rubble'].includes(c.pillars[0]), { rams, pillars: c.pillars });
  S.check('accept 3: the crown breaks in three rams', c.foe.stage >= 3, { stage: c.foe.stage, rams: rams.map((r) => r.stage) });
  // the crown phase's casts: watched for (quick) 40 or 110 real seconds, each named in the log as it begins
  await S.ev(() => { const F = __game.game.well.cur.foe; F.c.hp = F.c.maxHp; }); // (back to full: the rams' cracks must not push the phase)
  let lidfall = null;
  const secs = quick ? 40 : 110;
  for (let k = 0; k < secs * 2; k++) {
    await godTicks(30);
    if (!lidfall) { const cs = await dm('cavern()'); if (cs.raid.casting === 'crownBash') { lidfall = { windups: await dm('windups()') }; lidfall.parry = await dm('parryFoe()'); } }
  }
  await S.shot('fight-crown');
  S.check('accept 4: Lidfall wears the parry outline in its windup', lidfall && lidfall.windups.some((w) => w.parry), lidfall);
  S.check('accept 4: Lidfall can be parried (it staggers)', lidfall && lidfall.parry.parried, lidfall?.parry);
  // acceptance 5: at 65% it sinks, the Blowout lands, the brood hatch
  await dm('setShare(0.6)'); await godTicks(120);
  c = await dm('cavern()');
  S.check('accept 5: at 65% the transition (Unstopped) begins', c.raid.phase === 'clutch', c.raid);
  await godTicks(quick ? 600 : 1500);
  c = await dm('cavern()');
  let evs = await dm(`eventsSince(${JSON.stringify(m)})`);
  const casts = evs.filter((e) => e.name === 'foe.cast').map((e) => e.d.cast), moments = evs.filter((e) => e.name === 'foe.moment').map((e) => e.d.what);
  S.check('accept 5: it sinks and the Blowout is cast', moments.includes('sink') && casts.includes('slipNova'), { moments: [...new Set(moments)], casts: [...new Set(casts)] });
  const hatched = evs.filter((e) => e.name === 'clutch.hatch').length;
  S.check('accept 5: the brood hatch from the clutches still whole', hatched > 0 && hatched <= 2 * cav.whole * 2, { hatched, whole: cav.whole });
  await S.shot('fight-transition');
  // acceptance 6: at 30% the Sherds; one left alive for 30 s mends and heals it
  await dm('setShare(0.29)'); await godTicks(60 * 5);
  c = await dm('cavern()');
  S.check('accept 6: at 30% it breaks into four sherds', c.raid.sherds === 4, c.raid);
  await S.shot('fight-sherds');
  const shareBefore = c.foe.share;
  await godTicks(60 * 31);
  c = await dm('cavern()'); evs = await dm(`eventsSince(${JSON.stringify(m)})`);
  S.check('accept 6: sherds left 30 s mend and heal it', evs.some((e) => e.name === 'foe.moment' && e.d.what === 'mend') && c.foe.share > shareBefore, { share: [shareBefore, c.foe.share] });
  // acceptance 4 (the log): every cast seen was named in the log as it began
  const allLines = await dm(`logSince(${JSON.stringify(m)})`);
  const NAMES = await S.ev(async () => (await import('/src/progress/combat/greatjelly.js')).NAMES);
  const seenCasts = [...new Set(evs.filter((e) => e.name === 'foe.cast').map((e) => e.d.cast))];
  const unnamed = seenCasts.filter((id) => !allLines.some((t) => t.includes(`readies ${NAMES[id]}`)));
  S.check('accept 4: the log names every cast as it begins', seenCasts.length >= 4 && !unnamed.length, { seen: seenCasts.map((id) => NAMES[id] || id), unnamed });
  // acceptance 7: the enrage at 9:30, the wipe back to the Lip Stone with the run kept
  const runBefore = await S.ev(() => { const R = __game.game.well.run; return { haul: R.haul.length, deepest: R.deepest, broken: [...(R.broken || [])], seed: R.seed }; });
  const m7 = await dm('mark()');
  await dm('enrageSoon(6)');
  await S.ticks(60 * 12);
  for (let i = 0; i < 12 && await S.ev(() => __game.game.death.active); i++) await S.ticks(30);
  await S.settle(); await S.ticks(30);
  const e7 = await dm(`eventsSince(${JSON.stringify(m7)})`), l7 = await dm(`logSince(${JSON.stringify(m7)})`);
  S.check('accept 7: the enrage is cast and swallows the bowl', e7.some((e) => e.name === 'foe.cast' && e.d.cast === 'swallow') && e7.some((e) => e.name === 'foe.moment' && e.d.what === 'swallowed'), e7.filter((e) => /^foe\./.test(e.name)).map((e) => e.name + (e.d.cast ? ':' + e.d.cast : e.d.what ? ':' + e.d.what : '')));
  S.check('accept 7: a wipe is said in the log', e7.some((e) => e.name === 'foe.wipe') && l7.some((t) => /Lip Stone/.test(t)), l7.slice(-6));
  c = await dm('cavern()');
  const runAfter = await S.ev(() => { const R = __game.game.well.run; return R ? { haul: R.haul.length, deepest: R.deepest, broken: [...(R.broken || [])], seed: R.seed } : null; });
  S.check('accept 7: the run kept after the wipe (haul, floors, clutches broken)', runAfter && runAfter.seed === runBefore.seed && runAfter.haul >= runBefore.haul && runAfter.broken.length === runBefore.broken.length, { before: runBefore, after: runAfter });
  S.check('accept 7: the cavern laid again, the FOE whole and asleep', c && c.foe.state === 'asleep' && c.foe.share === 1 && !c.raid.pulled, c?.foe);
  S.check('accept 7: made whole at the Lip Stone', c && c.lipFromCourier < 4, { metres: c?.lipFromCourier });
  await S.common('fight-after-wipe');
  // acceptance 8: it bursts; the way up; the drops; the haul home
  const m8 = await dm('mark()'), box0 = await dm('box()');
  await dm('wake()'); await godTicks(30);
  await dm('burstFoe()'); await godTicks(90);
  c = await dm('cavern()');
  S.check('accept 8: burst, the way up forms', c.foe.ended === 'burst' && !!c.up, { ended: c.foe.ended, up: c.up });
  const e8 = await dm(`eventsSince(${JSON.stringify(m8)})`), end = e8.find((e) => e.name === 'foe.end');
  const bursts = (await dm(`logSince(${JSON.stringify(m8)})`)).filter((t) => /Great Slip Jelly bursts/.test(t));
  S.check('accept 8: the burst is said once in the log', bursts.length === 1, bursts);
  S.check('accept 8: foe.end carries the run\'s record', end && 'hitBy' in end.d && 'clutchesLeft' in end.d && 'seconds' in end.d, end?.d);
  await S.shot('fight-won');
  await dm('nearPool("up")');
  await S.ticks(12); await S.press('KeyF', 4); await S.settle(); await S.ticks(30);
  const w = await dm('well()'), box1 = await dm('box()');
  S.check('accept 8: up the way up out of the cavern', !w.active && w.zone === 'dunes', W0(w));
  // the sherds burst and the fight over, nothing of the cavern stays behind (Calissa's survey; Petra's fix, e0730dd and b45367d)
  await S.ticks(60); const postCavern = await dm('counts()'), K = ['bodies', 'colliders', 'jellies', 'creatures'];
  S.check('fight: left, the bodies, colliders, jellies and creatures are back to before the cavern', preCavern && K.every((k) => postCavern[k] <= preCavern[k]), Object.fromEntries(K.map((k) => [k, [preCavern?.[k], postCavern[k]]])));
  const DROP = ['glaze.jellycrown', 'curio.crown', 'mount.slipjelly', 'title.jellybane', 'pattern.crowneye'];
  const got = await S.ev(async (ids) => { const g = __game.game, { ITEMS } = await import('/src/pneuka/items.js'), { GLAZES } = await import('/src/courier/vessel/glazes.js');
    return ids.map((id) => ({ id, item: !!ITEMS[id], glaze: !!(GLAZES[id] || GLAZES[id.replace(/^glaze\./, '')]), inBox: g.pneuka.count(id), ledger: g.ledger.get(`foe.drop.${id}`) })); }, DROP);
  // (as defined in greatjelly.js DROPS' give: the glaze opens at the kiln through its achievement; the log says each drop)
  S.check('accept 8: beating it opens the Jelly-crown glaze at the kiln (GLAZES.jellycrown, gated by gj1)', got[0].glaze && got[0].ledger > 0, got[0]);
  const dropSaid = await S.ev(() => __game.game.log.lines.map((l) => l.text).filter((t) => /^It drops /.test(t)));
  S.check('accept 8: the log says what it drops', dropSaid.some((t) => /Jelly-crown/.test(t)), dropSaid);
  S.note('accept 8: the five cosmetics, as the game knows them', got);
  S.check('accept 8: the haul comes home (finds and slip roe)', box1.length > box0.length, { before: box0.length, after: box1.length, new: box1.filter((x, i) => !box0.includes(x)).slice(0, 8) });
  await words('fight', m);
}

// =====================================================================================================================================
if (part('careless')) {
  S.phase = 'careless';
  await reset();
  // Esc and the Pneuka Box under the maw wipe
  await S.go('well.mouth'); await S.ticks(10);
  await S.page.keyboard.press('KeyF'); await S.ticks(3);
  await S.page.keyboard.press('KeyP'); await S.ticks(1);
  const underP = await dm('win()');
  S.check('careless: the Pneuka Box does not open under the maw wipe (casebook rule 49)', !(underP.seamBusy && underP.pneuka), underP);
  await S.shot('careless-p-under-maw-wipe');
  await S.page.keyboard.press('Escape'); await S.ticks(3);
  await S.page.keyboard.press('Escape'); await S.ticks(3); // (and the pause menu, mid-wipe)
  await S.settle(); await S.resume(); await dm('closeAll()'); await S.settle(); await flyDone(); await S.ticks(30);
  const w = await dm('well()');
  S.check('careless: F then P and Esc mid-wipe still lands on floor 1', w.active && w.floor === 1, W0(w));
  await S.common('careless-after-esc');
  // a resize mid-floor
  await S.page.setViewportSize({ width: 640, height: 400 }); await S.ticks(10);
  const small = await S.ev(() => { const c = __game.renderer.domElement; return [c.clientWidth, c.clientHeight]; });
  await S.common('careless-resized');
  await S.page.setViewportSize({ width: 960, height: 600 }); await S.ticks(10);
  S.check('careless: the canvas follows a resize in a Well', Math.abs(small[0] - 640) < 2 && Math.abs(small[1] - 400) < 2, { canvas: small });
  // travel away mid-run, and back
  await dm('clearFloor()'); await S.ticks(20); // (a material in the haul: what a run left by travel must not pretend to bring home)
  const m = await dm('mark()'), cubesT = await S.ev(() => __game.game.cubes.balance), boxT = await dm('box()');
  await S.go('workshop');
  let w2 = await dm('well()');
  const ev = (await dm(`eventsSince(${JSON.stringify(m)})`)).find((e) => e.name === 'well.leave'), linesT = await dm(`logSince(${JSON.stringify(m)})`);
  S.check('careless: travel away mid-run ends the run', !w2.active && !!ev, ev?.d ?? W0(w2));
  const paidT = (await S.ev(() => __game.game.cubes.balance)) - cubesT, homeT = (await dm('box()')).length - boxT.length;
  S.check('careless: a run left by travel reports only what it pays (well.leave, the log, the cubes agree)', ev && (ev.d.pay === paidT) && !linesT.some((t) => /climb out of the Well/.test(t) && paidT === 0 && ev.d.pay > 0), { how: ev?.d.how, shattered: ev?.d.shattered, reported: ev?.d.pay, paid: paidT, haulHome: homeT, log: linesT.filter((t) => /Well/.test(t)) });
  const c0 = await dm('counts()');
  S.check('careless: travel away takes the floor down', c0.floors === 0, c0);
  await S.common('careless-workshop');
  w2 = await enterByF();
  S.check('careless: back to the mouth and down again', w2.active && w2.floor === 1, W0(w2));
  await reset();
  // travel asked for while the maw wipe closes (a careless person's fast travel, an agent's turn): one place wins, the Courier shown
  await S.go('well.mouth'); await S.ticks(10);
  const mW = await dm('mark()');
  await S.page.keyboard.press('KeyF'); await S.ticks(3);
  const tr = await S.ev(() => __game.game.agent.act({ do: 'travel', place: 'workshop' }));
  await S.settle(); await S.ticks(60); await S.settle(); await flyDone(); await S.ticks(20);
  const wW = await dm('well()'), stW = await S.sw('state()'), evW = (await dm(`eventsSince(${JSON.stringify(mW)})`)).filter((e) => /^well\.(enter|leave)$/.test(e.name)).map((e) => e.name);
  S.check('careless: travel during the maw wipe ends in one place, the Courier shown', stW.courierShown !== false && (wW.active ? wW.zone === 'well' : wW.zone !== 'well'), { travel: tr, well: W0(wW), courierShown: stW.courierShown, events: evW, at: stW.player });
  await S.common('careless-travel-mid-wipe');
  await reset();
  // enter and leave many times: nothing left behind
  await S.ticks(30);
  const before = await dm('counts()');
  for (let i = 0; i < REPS; i++) {
    await S.ev(() => { const W = __game.game.well; W.enter(); }); await S.ticks(20);
    await S.ev(() => __game.game.well.down()); await S.ticks(10);
    await S.ev(() => __game.game.well.leave('walk')); await S.ticks(10);
  }
  await S.ticks(60);
  const after = await dm('counts()');
  const grew = Object.fromEntries(Object.keys(before).filter((k) => typeof before[k] === 'number' && after[k] > before[k]).map((k) => [k, after[k] - before[k]]));
  S.check(`careless: ${REPS} runs in and out leave no objects`, after.objects <= before.objects + 2 && after.top <= before.top, { grew, before, after });
  S.check(`careless: ${REPS} runs leave no geometry or textures`, after.geometries <= before.geometries + 4 && after.textures <= before.textures, { geometries: [before.geometries, after.geometries], textures: [before.textures, after.textures] });
  S.check(`careless: ${REPS} runs leave no physics bodies or jellies`, after.bodies <= before.bodies && after.colliders <= before.colliders && after.jellies <= before.jellies, { bodies: [before.bodies, after.bodies], colliders: [before.colliders, after.colliders], jellies: [before.jellies, after.jellies] });
  // the great cavern in and out: a wipe-free leave by travel
  if (!quick) {
    const b2 = await dm('counts()');
    for (let i = 0; i < 3; i++) { await toCavern(); await S.go('workshop'); }
    await reset(); await S.ticks(60);
    const a2 = await dm('counts()');
    S.check('careless: the great cavern three times leaves no objects or bodies', a2.objects <= b2.objects + 2 && a2.bodies <= b2.bodies && a2.colliders <= b2.colliders && a2.jellies <= b2.jellies && a2.bowls === 0, { before: b2, after: a2 });
  }
}

await S.done();
