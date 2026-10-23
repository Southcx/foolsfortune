// ---------------------------------------------------------------------------------------
// THE POSE AUDIT, the runner (page side, after scripts/poseaudit.page.js): one STATE of the manifest (scripts/poseaudit.states.js) set
// up, stepped tick by tick with its plan's inputs, measured on every frame it asks for (every `every`th), the pose kept with each
// measured frame; then the measures gathered (the worst of each, its frame, the frames past each limit as ranges), the offences chosen
// (the held thing's deepest, the limb's deepest, the two joints furthest past their limits), and their frames drawn again from the front
// and their right with every other tool off the Courier and the offending part in red.
//
// A plan is a function of the kit `c` (below): it places the Courier, draws a tool, holds and presses keys and lets the frames run. Keys are
// put on the game's input directly (`input.down` / `input.pressed`, as the replay and the sweeps do). Frames are counted from the plan's
// first tick (setup included), so a frame number is the plan's own clock (k / 60 s).
//
// Prior art: the sweeps' harness (scripts/sweeps/harness.mjs: the page stepped in manual mode, the clock pinned) and Calissa's melee rig
// (a plan as a function of the frame, the camera put in front of them and their right with every other tool hidden); Unreal's Pose Watch
// for the pose kept and put back.
//
//   c.stand(at, yaw)  c.travel(placeId)  c.tool(id, form?)  c.posture('stand'|'crouch'|'prone')  c.hold(...keys)  c.free(...keys)
//   c.press(...keys) (one tick)  c.run(n) (measured)  c.warm(n) (not)  c.until(fn, max)  c.pool(v)  c.note(key, value)
//   __paRun.run(state, { every, draw }) -> { result, sheet (JPEG data URL) | null, tile ({ url, sx, sy, sw, sh, id }: a crop of the sheet) | null }
//   __paRun.overview(tiles, title) -> a JPEG data URL
// ---------------------------------------------------------------------------------------
window.__paRun = (() => {
  const G = window.__game, g = G.game, THREE = G.THREE, ch = g.character, I = G.input, P = g.player, A = window.__pa;
  const KEYS = { draw: 'KeyX', lend: 'KeyR' }; // (main and sub: X draws the main, R lends the sub's verb, tools/belt.js)
  const FORM_KEY = { cutlass: 'Digit1', rod: 'Digit2', hook: 'Digit3' };
  const tick = () => G.tick(1 / 60);
  try { g.lend?.set?.('moves', true); g.lend?.set?.('arts', true); } catch { /* (STORY: what is locked stays locked, and the plan says so) */ }

  /** Back to standing, nothing in the hands, nothing running. */
  function reset() {
    I.down.clear(); I.pressed.clear();
    const emote = g.techs.get('emote'); if (emote?.active || emote?.want) emote.stop();
    const carry = g.techs.get('carry'); if (carry?.item) carry.drop();
    const skiff = g.techs.get('skiff'); if (skiff?.active) skiff.stow?.();
    if (g.techs.active && g.techs.active.id !== 'death') g.techs.stop();
    for (const t of g.belt.tools) if (t.drawT > 0 || t.wants) t.stow();
    for (let i = 0; i < 420 && (g.belt.tools.some((t) => t.drawT > 0) || g.techs.active || g.death?.active || emote?.want); i++) tick();
    if (P.posture !== 'stand') { P.setPosture('stand'); for (let i = 0; i < 60; i++) tick(); }
    P.vel.set(0, 0, 0);
  }

  function kit(rec) {
    const held = new Set(); let taps = [];
    const c = {
      g, G, P, I, THREE, ch, V: (...a) => new THREE.Vector3(...a),
      stand(at, yaw = 0, settle = 40) { g.places.stand(Array.isArray(at) ? new THREE.Vector3(...at) : at.clone(), yaw); P.vel.set(0, 0, 0); return c.warm(settle); },
      travel(id) { g.places.travel(id); c.warm(10); for (let i = 0; i < 80 && g.seam?.busy; i++) c.warm(6); return c.warm(30); },
      hold(...k) { for (const x of k) { if (!held.has(x)) I.pressed.add(x); held.add(x); I.down.add(x); } return c; },
      free(...k) { for (const x of k) { held.delete(x); I.down.delete(x); } return c; },
      press(...k) { for (const x of k) { I.pressed.add(x); I.down.add(x); taps.push(x); } return c; },
      step(measure) { tick(); if (rec.after) { rec.after(c); ch.root.updateMatrixWorld(true); } for (const x of taps) if (!held.has(x)) I.down.delete(x); taps = []; rec.k++; if (measure && rec.k % rec.every === 0) rec.take(); },
      run(n) { for (let i = 0; i < n; i++) c.step(true); return c; },
      warm(n) { for (let i = 0; i < n; i++) c.step(false); return c; },
      until(fn, max = 240, measure = true) { for (let i = 0; i < max && !fn(); i++) c.step(measure); return c; },
      pool(v = 100) { if (g.lachryma) { g.lachryma.value = v; g.lachryma.reserved = 0; } return c; },
      note(k, v) { rec.notes[k] = v; return c; },
      /** A pose laid over each frame after the game's own (the self-test's deliberate faults): fn(c), or null to stop. */
      after(fn) { rec.after = fn; return c; },
      /** A tool into the hand (made the main first), whole; a form for the Sondelass. */
      tool(id, form = null) {
        const t = g.belt.get(id); if (!t) throw new Error(`no tool ${id}`);
        if (!g.belt.isMain(id)) { g.belt.equip(id, 'main', { quiet: true }); c.warm(4); }
        c.press(KEYS.draw); c.until(() => t.drawT >= 0.999, 150, false);
        if (form) { c.press(FORM_KEY[form]); c.warm(45); }
        c.warm(30);
        if (t.drawT < 0.999) throw new Error(`${id} did not come out (drawT ${t.drawT.toFixed(2)})`);
        return c;
      },
      posture(p) { P.setPosture(p); c.warm(p === 'prone' ? 90 : 45); return c; },
      sond() { return g.techs.get('sondelass'); },
    };
    return c;
  }

  /** What was playing this frame (the result's `seen`, frames of each: the tell that a plan reached the state it names). */
  function playing() {
    const out = [], a = g.techs.active, h = g.belt?.inHand;
    if (a) out.push(`tech:${a.id}${typeof a.phase === 'string' ? `:${a.phase}` : ''}`);
    for (const t of g.techs.list) if (t.passive && t.engaged && !['sondelass', 'soulbrush', 'veritome', 'dreamvane', 'crucibelle', 'lockheart'].includes(t.id)) out.push(`passive:${t.id}`);
    if (h) { const t = g.techs.get(h.id), M = h.id === 'psygun' ? g.weapon?.moves?.moves : t?.moves || t?.cutlass?.moves || t?.club?.moves || t?.pick?.moves; out.push(`tool:${h.id}${h.id === 'sondelass' ? `:${t?.form}` : ''}`); if (M?.cur) out.push(`move:${h.id}.${M.cur.id || M.cur.def?.id || '?'}`); }
    const cut = g.techs.get('sondelass')?.cutlass; if (cut?.iai) out.push('cutlass:iaido'); if (cut?.blade?.active) out.push('cutlass:bladeMode'); if (cut?.stinging) out.push('cutlass:stinger'); if (cut?.guardOn) out.push('cutlass:guard');
    if (P.wallrun) out.push('wallrun'); if (P.mantle) out.push('mantle'); if (P.sliding) out.push('slide'); if (!P.grounded) out.push('air'); if (P.posture !== 'stand') out.push(`posture:${P.posture}`);
    if ((ch.skidStop?.w ?? 0) > 0.5) out.push('skid');
    if (ch.idles?.brk) out.push(`idleB:${ch.idles.brk}`);
    if (ch.hidden) out.push('hidden');
    return out;
  }
  const r1 = (x) => Math.round(x * 10) / 10;
  function ranges(ks, every) { const r = []; for (const k of ks) { const last = r[r.length - 1]; if (last && k - last[1] <= every) last[1] = k; else r.push([k, k]); } return r; }
  function gather(frames, every) {
    const L = A.LIMITS;
    const tool = { frames: 0, held: {}, worst: null, parts: {}, over: [] };
    const limb = { worst: null, pairs: {}, over: [] };
    const joints = {}, ext = {};
    for (const fr of frames) {
      const t = fr.f.tool, k = fr.k;
      if (t) {
        tool.frames++; tool.held[t.id] = (tool.held[t.id] || 0) + 1;
        for (const [p, d] of Object.entries(t.parts)) if (d > 0 && (!tool.parts[p] || d * 100 > tool.parts[p].cm)) tool.parts[p] = { cm: r1(d * 100), frame: k };
        if (t.d > 0 && (!tool.worst || t.d * 100 > tool.worst.cm)) tool.worst = { cm: r1(t.d * 100), frame: k, part: t.part, hand: t.hand, grips: t.grips.join('') };
        if (t.d * 100 > L.toolCm) tool.over.push(k);
      }
      const l = fr.f.limb;
      for (const [p, d] of Object.entries(l.pairs)) if (d > 0 && (!limb.pairs[p] || d * 100 > limb.pairs[p].cm)) limb.pairs[p] = { cm: r1(d * 100), frame: k };
      if (l.d > 0 && (!limb.worst || l.d * 100 > limb.worst.cm)) limb.worst = { cm: r1(l.d * 100), frame: k, limb: l.limb, part: l.part };
      if (l.d * 100 > L.limbCm) limb.over.push(k);
      for (const [name, key, sign, lim] of A.JOINT_RULES) {
        const v = fr.f.joints[key] * sign, j = (joints[name] ||= { worst: -Infinity, frame: null, limit: lim, over: [] });
        if (v > j.worst) { j.worst = v; j.frame = k; }
        if (v > lim) j.over.push(k);
      }
      for (const [key, v] of Object.entries(fr.f.joints)) { const e = (ext[key] ||= [Infinity, -Infinity]); e[0] = Math.min(e[0], v); e[1] = Math.max(e[1], v); }
    }
    tool.over = ranges(tool.over, every); limb.over = ranges(limb.over, every);
    for (const j of Object.values(joints)) { j.worst = r1(j.worst); j.over = ranges(j.over, every); }
    for (const k in ext) ext[k] = ext[k].map(r1);
    return { tool, limb, joints, range: ext };
  }
  /** What is drawn: the held thing's worst, the limb's worst, and the two joints furthest past their limits. */
  function offences(agg) {
    const L = A.LIMITS, out = [];
    if (agg.tool.worst && agg.tool.worst.cm > L.toolCm) out.push({ kind: 'tool', frame: agg.tool.worst.frame, text: `${Object.keys(agg.tool.held).join('/')} into the ${agg.tool.worst.part} ${agg.tool.worst.cm} cm` });
    if (agg.limb.worst && agg.limb.worst.cm > L.limbCm) out.push({ kind: 'limb', frame: agg.limb.worst.frame, text: `${agg.limb.worst.limb} into the ${agg.limb.worst.part} ${agg.limb.worst.cm} cm` });
    const js = Object.entries(agg.joints).filter(([, j]) => j.over.length && j.worst > j.limit + L.jointSlack).sort((a, b) => (b[1].worst - b[1].limit) - (a[1].worst - a[1].limit));
    const seen = new Set();
    for (const [name, j] of js) { const at = name.replace(/^(wristFlexion|wristExtension|radialDeviation|ulnarDeviation)/, 'wrist').replace(/^(supination|pronation)/, 'forearm'); if (seen.has(at) || seen.size >= 2) continue; seen.add(at); out.push({ kind: 'joint', joint: name, frame: j.frame, text: `${name} ${j.worst}° (limit ${j.limit}°)` }); }
    return out;
  }

  function hideOthers(keepRoot) {
    const hid = [];
    for (const t of g.belt.tools) { const m = t.id === 'psygun' ? ch.gun : t.model; if (m && m !== keepRoot && m.visible) { m.visible = false; hid.push(m); } }
    return () => { for (const m of hid) m.visible = true; };
  }
  function drawOffences(state, offs, frames, agg) {
    const TW = A.TW, TH = A.TH, rows = offs.length, top = 40;
    const sheet = document.createElement('canvas'); sheet.width = TW * 2; sheet.height = top + rows * (TH + 22);
    const x = sheet.getContext('2d'); x.fillStyle = '#140c10'; x.fillRect(0, 0, sheet.width, sheet.height);
    A.label(x, 4, 16, `${state.id}: ${state.label || ''}`.slice(0, 84), '#ffe6c8', 13);
    A.label(x, 4, 34, `front | their right; every other tool off; red: the offending samples and the proxy they are in`.slice(0, 92), '#c8b8a8', 11);
    let tile = null;
    offs.forEach((o, i) => {
      const fr = frames.find((f) => f.k === o.frame); if (!fr) return;
      A.putBack(fr.snap.list, fr.snap.arr);
      const back = hideOthers(fr.heldRoot);
      const src = o.kind === 'tool' ? fr.f.tool : o.kind === 'limb' ? fr.f.limb : null;
      const m = A.marks(o.kind === 'joint' ? { joint: o.joint } : { cap: src?.cap, pts: src?.pts });
      g.scene.add(m);
      const focus = m.children.length ? new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()) : null;
      const y = top + i * (TH + 22);
      A.label(x, 4, y + 15, `f${o.frame} (${(o.frame / 60).toFixed(2)} s): ${o.text}`.slice(0, 84), o.kind === 'joint' ? '#ffd080' : '#ff8090', 12);
      ['front', 'side'].forEach((v, j) => A.shoot(v, focus, fr.yaw, o.kind === 'joint', x, j * TW, y + 20, [fr.heldRoot, m].filter(Boolean))); // (a joint: close up)
      tile ||= true;
      g.scene.remove(m); m.traverse((o2) => o2.geometry?.dispose());
      back();
    });
    const url = sheet.toDataURL('image/jpeg', 0.9); sheet.width = sheet.height = 0; // (its memory given back now)
    // (the overview's tile is cut from the sheet itself, later: a small canvas fed from a large one read the GPU back for 23 real seconds)
    return { sheet: url, tile: tile ? { url, sx: 0, sy: top + 20, sw: TW, sh: TH, id: state.id } : null };
  }

  async function run(state, { every = 1, draw = true } = {}) {
    const t0 = performance.now();
    if (state.social) await g.clipPack?.social;
    reset();
    const frames = [], rec = { k: 0, every: Math.max(1, every), notes: {}, take: null, after: null };
    let lastRoot = null, list = A.subjects([]); const seen = {};
    rec.take = () => {
      const f = A.measure(), h = A.held();
      const root = h?.root || null;
      if (root !== lastRoot) { list = A.subjects(root ? [root] : []); lastRoot = root; }
      for (const x of playing()) seen[x] = (seen[x] || 0) + 1;
      frames.push({ k: rec.k, f, heldRoot: root, yaw: A.facing(), snap: { list, arr: A.keep(list) } });
    };
    const c = kit(rec);
    let error = null;
    try { await state.plan(c); } catch (e) { error = String(e?.message || e); }
    for (const x of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'Mouse0', 'Mouse2', 'KeyV', 'KeyC', 'Space']) I.down.delete(x);
    const agg = gather(frames, rec.every);
    const offs = offences(agg);
    const result = { state: state.id, set: state.set, label: state.label || '', frames: rec.k, measured: frames.length, every: rec.every, error, notes: rec.notes, seen,
      verdict: error ? 'error' : !frames.length ? 'unmeasured' : offs.length ? 'dirty' : Object.values(agg.joints).some((j) => j.over.length) ? 'marginal' : 'clean', offences: offs.map(({ kind, frame, text, joint }) => ({ kind, frame, text, joint })), ...agg, ms: 0 };
    if (state.expect) { try { result.checks = state.expect(result).map(([id, ok, what]) => ({ id, ok: !!ok, what })); } catch (e) { result.checks = [{ id: 'expect', ok: false, what: String(e?.message || e) }]; } }
    let pics = { sheet: null, tile: null };
    const t1 = performance.now();
    if (draw && offs.length) { try { pics = drawOffences(state, offs, frames, agg); } catch (e) { result.drawError = String(e?.message || e); } }
    result.ms = Math.round(performance.now() - t0); result.msDraw = Math.round(performance.now() - t1);
    frames.length = 0;
    return { result, ...pics };
  }

  /** The worst frame of each dirty state, on one sheet: each tile cut from its state's sheet ({ url, sx, sy, sw, sh, id }). */
  async function overview(tiles, title) {
    const W = A.TW / 2, H = A.TH / 2 + 16, cols = 8, rows = Math.ceil(tiles.length / cols) || 1;
    const c = document.createElement('canvas'); c.width = W * cols; c.height = 24 + rows * H;
    const x = c.getContext('2d'); x.fillStyle = '#140c10'; x.fillRect(0, 0, c.width, c.height);
    A.label(x, 4, 16, title.slice(0, 160), '#ffe6c8', 13);
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i], im = new Image(); im.src = t.url; await im.decode();
      const X = (i % cols) * W, Y = 24 + Math.floor(i / cols) * H;
      x.drawImage(im, t.sx, t.sy, t.sw, t.sh, X, Y + 16, W, H - 16); A.label(x, X + 2, Y + 12, t.id.slice(0, 26), '#ffe6c8', 10);
    }
    return c.toDataURL('image/jpeg', 0.88);
  }
  return { run, overview, reset, kit, KEYS };
})();
