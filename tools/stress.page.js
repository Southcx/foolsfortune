// The stress test (page side). Injected by tools/stress.mjs into a running game with the
// loop stopped (__game.manual = true); drives the simulation tick by tick with random,
// human-shaped input, from teleports all over the workshop, and checks invariants after
// every step:
//
//   finite      position and velocity are numbers
//   embedded    the body is not inside level geometry (the player's own guard fires: a
//               guard nudge/reset is a violation - it is the safety net, not a feature)
//   speed       nothing goes faster than the game can explain (dashes, platforms, blinks)
//   shape       the blob (slip) shape only exists while the slip tech is active
//   hitch       the controller has not stopped dead for half a second with no wall touching
//   tech-stuck  a tech has not held the player for a minute
//   respawn     falling out of the world (a reset floor is fine; below the map is not)
//
// Usage from the console / runner:
//   __stress.run({ seed: 1, runs: 20, ticks: 900 })            -> summary
//   __stress.pairs({ seed: 1, runs: 3, ticks: 600 })           -> summary per tech pair
(() => {
  const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const G = () => window.__game;

  const KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'KeyC', 'AltLeft', 'KeyF', 'KeyV'];
  const TAPS = ['Space', 'Space', 'Space', 'KeyE', 'KeyC', 'ShiftLeft', 'KeyF', 'KeyV', 'KeyV', 'KeyN', 'KeyY'];

  function starts(g) {
    const B = -14;
    const out = [{ name: 'ground floor', at: [0, 0.02, -8], yaw: 0 }, { name: 'ground floor 2', at: [5, 0.02, 6], yaw: 2 }];
    g.course.cps.forEach((cp, i) => out.push({ name: `cp ${cp.room}`, cp: i }));
    out.push({ name: 'hub', hub: true });
    out.push({ name: 'dunes', dunes: true }, { name: 'dunes 2', dunes: true }, { name: 'siege', siege: true });
    // on top of each moving platform (the fuzz then rides, jumps off, gets carried into things)
    for (const m of g.movers.list) if (m.colliders.length && !m.surface) out.push({ name: `on ${m.name || 'mover'}`, mover: m });
    return out;
  }

  function place(g, s, rnd) {
    const P = g.player;
    if (s.mover) {
      const m = s.mover;
      // a metre or so off centre (a millstone has a shaft through the middle), and not inside a wall:
      // try a few angles and radii
      let placed = false;
      for (let k = 0; k < 12 && !placed; k++) {
        const a = rnd() * Math.PI * 2, r = k < 6 ? 1 + rnd() * 0.4 : 0.5 + rnd() * 0.5, ox = Math.cos(a) * r, oz = Math.sin(a) * r;
        const hit = g.physics.raycast({ x: m.cur.p.x + ox, y: m.cur.p.y + 6, z: m.cur.p.z + oz }, { x: 0, y: -1, z: 0 }, 12, P.collider, undefined, (c) => g.physics.entityOf(c)?.mover === m);
        if (!hit) continue;
        g.course.teleport(new g.THREE.Vector3(hit.point.x, hit.point.y + 0.03, hit.point.z), rnd() * 6);
        placed = !P.embedded();
      }
      if (!placed) g.course.teleport(new g.THREE.Vector3(m.cur.p.x + 0.6, m.cur.p.y + 0.9, m.cur.p.z), 0);
    } else if (s.cp !== undefined) g.course.goTo(s.cp, 'dash');
    else if (s.hub) g.course.toHub();
    else if (s.dunes) g.course.toDunes();
    else if (s.siege) g.course.toSiege();
    else {
      P.pos.set(...s.at); P.prevPos.copy(P.pos); P.renderPos.copy(P.pos); P.vel.set(0, 0, 0); P.yaw = s.yaw; P.bodyYaw = s.yaw; P.place();
    }
    P.yaw += (rnd() - 0.5) * 1.5;
    P.pitch = 0;
    g.input.down.clear(); g.input.pressed.clear();
    // pots and shells come back so the bot can't run out of things to hit
    for (const k of Object.keys(g.shells.counts)) g.shells.counts[k] = 6;
    g.lachryma.value = g.lachryma.max ?? 100;
  }

  function fuzzRun(g, rnd, ticks, sink, label) {
    const P = g.player, inp = g.input, B = -14;
    const held = new Set();
    let keyT = 0, turn = 0, turnT = 0, tapT = 0, fireT = 0, shellT = 0, godT = 0, godLeft = 1e9;
    const pos0 = P.pos.clone();
    const lastPos = P.pos.clone();
    let path = 0, winT = 0, hitchT = 0, techT = 0, lastTech = null;
    // a ring of the last few moves, attached to violations
    const hist = [], origMove = P.move;
    P.move = function moveRec(dt) {
      const b = P.pos.clone(), v = P.vel.clone(), wasG = P.grounded;
      origMove.call(P, dt);
      hist.push({ b: b.toArray().map((x) => +x.toFixed(2)), a: P.pos.toArray().map((x) => +x.toFixed(2)), v: v.toArray().map((x) => +x.toFixed(1)), tech: g.techs.active?.id || '-', g: wasG, g2: P.grounded, sh: P.shape });
      if (hist.length > 8) hist.shift();
    };
    sink.hist = hist;
    // (a 'clip' is the controller's own miss caught and corrected inside the move: counted, not a failure)
    const guardOff = g.events.on('guard', (e) => { if (e.kind === 'clip') sink.clips = (sink.clips || 0) + 1; else sink.violation('guard:' + e.kind, P, label); });
    const respawnOff = g.events.on('respawn', (e) => { if (e.why !== 'pit') sink.violation('respawn', P, label + ' ' + e.why); });
    const techOff = g.events.on('tech.start', (e) => { sink.techs[e.id] = (sink.techs[e.id] || 0) + 1; });
    const evOff = g.events.on('*', (e) => { sink.events[e.name] = (sink.events[e.name] || 0) + 1; });
    for (let i = 0; i < ticks; i++) {
      // ---- input: a held key set that changes every so often, taps, look bursts, fire ----
      if ((keyT -= 1) <= 0) {
        keyT = 6 + Math.floor(rnd() * 40);
        held.clear();
        if (rnd() < 0.8) held.add('KeyW');
        if (rnd() < 0.25) held.add('KeyA'); else if (rnd() < 0.25) held.add('KeyD');
        if (rnd() < 0.08) held.add('KeyS');
        if (rnd() < 0.5) held.add('ShiftLeft');
        if (rnd() < 0.18) held.add('KeyC');
        if (rnd() < 0.06) held.add('AltLeft');
        if (rnd() < 0.08) held.add('KeyF'); // (hold F: a push / pull if there is a crate)
      }
      let tapKey = null;
      if ((tapT -= 1) <= 0) { tapT = 3 + Math.floor(rnd() * 30); tapKey = TAPS[Math.floor(rnd() * TAPS.length)]; inp.pressed.add(tapKey); inp.down.add(tapKey); }
      if ((turnT -= 1) <= 0) { turnT = 10 + Math.floor(rnd() * 60); turn = (rnd() - 0.5) * 0.05 * (rnd() < 0.3 ? 4 : 1); if (rnd() < 0.1) P.yaw += (rnd() - 0.5) * 3; }
      P.yaw += turn;
      P.pitch = Math.max(-1.3, Math.min(1.1, P.pitch + (rnd() - 0.5) * 0.06 - (rnd() < 0.02 ? 0.5 : 0)));
      if (rnd() < 0.01) P.pitch = -0.9 - rnd() * 0.4; // (looking down, for slams)
      if ((fireT -= 1) <= 0) { fireT = 20 + Math.floor(rnd() * 120); if (rnd() < 0.5) { inp.pressed.add('Mouse0'); inp.down.add('Mouse0'); } else inp.down.delete('Mouse0'); }
      if ((shellT -= 1) <= 0) { shellT = 60 + Math.floor(rnd() * 200); g.shells.select(Math.floor(rnd() * Object.keys(g.shells.counts).length)); }
      for (const k of KEYS) { if (held.has(k) || k === tapKey) inp.down.add(k); else inp.down.delete(k); }

      // ---- the god hand: now and then the Courier becomes a jar for a while; the hand is fuzzed (grabs, throws, casts, turns) ----
      const god = g.game.god;
      if (god.state === 'off' && rnd() < 0.0012 && god.canEnter()) { inp.pressed.add('Backquote'); godLeft = 150 + Math.floor(rnd() * 400); god.raids.t = Math.min(god.raids.t, 5 + rnd() * 10); }
      if (god.controlling) {
        if ((godT -= 1) <= 0) {
          godT = 5 + Math.floor(rnd() * 25);
          inp.mx = 60 + rnd() * (innerWidth - 120); inp.my = 60 + rnd() * (innerHeight - 120);
          if (rnd() < 0.5) inp.down.add('Mouse0'); else inp.down.delete('Mouse0');
          if (rnd() < 0.35) { inp.pressed.add('Mouse2'); inp.down.add('Mouse2'); } else inp.down.delete('Mouse2');
          if (rnd() < 0.3) { const d = 'Digit' + (1 + Math.floor(rnd() * 9)); inp.pressed.add(d); }
          if (rnd() < 0.1) inp.pressed.add(rnd() < 0.5 ? 'KeyQ' : 'KeyE');
          if (rnd() < 0.1) inp.wheel += (rnd() - 0.5) * 600;
        }
        if (--godLeft <= 0) { inp.pressed.add('Backquote'); inp.down.delete('Mouse0'); inp.down.delete('Mouse2'); godLeft = 1e9; }
      }
      g.tick(1 / 60);
      if (god.state !== 'off') { if (god.state === 'on' || god.state === 'in') { sink.ticks++; continue; } }
      // taps last one step
      if (tapKey && !held.has(tapKey)) inp.down.delete(tapKey);

      // ---- invariants ----
      const v = P.vel, p = P.pos;
      if (!Number.isFinite(p.x + p.y + p.z + v.x + v.y + v.z)) { sink.violation('finite', P, label); break; }
      const hs = Math.hypot(v.x, v.z);
      // (a blink is 5.5 m in 0.09 s: 60 m/s by design; the platforms add their own speed)
      if (g.techs.active?.id !== 'blink' && (hs > 45 || Math.abs(v.y) > 90)) sink.violation('speed', P, `${label} hs=${hs.toFixed(1)} vy=${v.y.toFixed(1)}`);
      if (P.shape === 'blob' && g.techs.active?.id !== 'slip') sink.violation('shape', P, label);
      if (!g.techs.active && !P.riding && !P.mantle && P.embedded()) sink.violation('embedded', P, label);
      // controller stalled: trying to move (grounded, no tech), zero progress, nothing touching
      if (!g.techs.active && P.grounded && (held.has('KeyW') || held.has('KeyA') || held.has('KeyD')) && P.stuck >= 30 && !blockedBySomething(P)) {
        if (++hitchT === 1) sink.violation('hitch', P, label);
      } else hitchT = 0;
      // a tech that never ends
      const at = g.techs.active?.id || null;
      if (at && at === lastTech) techT++; else techT = 0;
      lastTech = at;
      if (techT > 60 * 60) { sink.violation('tech-stuck:' + at, P, label); techT = 0; }
      // no progress at all for 6 s while pressing on (path length, so returning to the start doesn't hide it)
      path += Math.hypot(P.pos.x - lastPos.x, P.pos.y - lastPos.y, P.pos.z - lastPos.z);
      lastPos.copy(P.pos);
      if (++winT >= 360) {
        if (path < 1 && !g.techs.active && !P.platform) sink.note('no-progress', P, label);
        path = 0; winT = 0;
      }
      if (sink.tracing && i % 20 === 0) sink.tracing.push([i, ...P.pos.toArray().map((x) => +x.toFixed(2)), ...P.vel.toArray().map((x) => +x.toFixed(1)), P.shape, [...held].join('+'), g.techs.active?.id || '-', P.stuck]);
      sink.ticks++;
    }
    g.game.god.forceOff();
    P.move = origMove; sink.hist = null;
    guardOff(); respawnOff(); techOff(); evOff();
    for (const k of KEYS.concat(TAPS, ['Mouse0'])) inp.down.delete(k);
    return P.pos.distanceTo(pos0);
  }

  // is the controller's last move touching anything that could be blocking it (a wall, a ceiling, a steep slope)?
  function blockedBySomething(P) {
    const c = P.ctrl;
    for (let i = 0; i < c.numComputedCollisions(); i++) if (c.computedCollision(i).normal1.y < 0.7) return true;
    return false;
  }

  function makeSink(cap = 40) {
    const s = { ticks: 0, runs: 0, violations: [], notes: [], counts: {}, techs: {}, events: {} };
    const fmt = (P) => ({ pos: P.pos.toArray().map((x) => +x.toFixed(2)), vel: P.vel.toArray().map((x) => +x.toFixed(1)), shape: P.shape, tech: window.__game.techs.active?.id || null, grounded: P.grounded });
    s.violation = (kind, P, label) => {
      s.counts[kind] = (s.counts[kind] || 0) + 1;
      if (s.violations.length >= cap) return;
      const g = window.__game;
      const rec = { kind, label, ...fmt(P), recent: g.events.log.slice(-5).map((e) => `${e.name}@${e.t.toFixed(2)}`) };
      if (kind === 'hitch') {
        rec.col = []; const cc = P.ctrl;
        for (let i = 0; i < Math.min(6, cc.numComputedCollisions()); i++) { const c = cc.computedCollision(i); rec.col.push({ n: [c.normal1.x, c.normal1.y, c.normal1.z].map((v) => +v.toFixed(2)), ent: g.physics.entityOf(c.collider)?.type || 'static', at: [c.collider.translation().x, c.collider.translation().y, c.collider.translation().z].map((v) => +v.toFixed(1)) }); }
        rec.hist = s.hist ? s.hist.slice(-3) : null;
      }
      if (kind === 'embedded') { rec.push = g.events.last('mover.push'); rec.by = P.embeddedBy(); rec.hist = s.hist ? s.hist.slice(-6) : null; }
      s.violations.push(rec);
    };
    s.note = (kind, P, label) => { if (s.notes.length < cap) s.notes.push({ kind, label, ...fmt(P) }); };
    return s;
  }

  function run({ seed = 1, runs = 20, ticks = 900, only = null, trace = -1 } = {}) {
    const g = G(), rnd = mulberry(seed), sink = makeSink();
    const wasLab = g.system?.lab;
    g.system?.setLab(true); // (the System would otherwise keep the abilities locked away from the bot)
    const all = starts(g).filter((s) => !only || only.includes(s.name));
    for (let r = 0; r < runs; r++) {
      const s = all[Math.floor(rnd() * all.length)];
      place(g, s, rnd);
      sink.tracing = r === trace ? [] : null;
      fuzzRun(g, rnd, ticks, sink, `#${r} ${s.name}`);
      if (r === trace) sink.traceOut = sink.tracing;
      sink.runs++;
    }
    g.system?.setLab(!!wasLab);
    return { seed, runs: sink.runs, ticks: sink.ticks, clips: sink.clips || 0, counts: sink.counts, techs: sink.techs, violations: sink.violations, notes: sink.notes.slice(0, 10), events: sink.events, trace: sink.traceOut };
  }

  // every pair of techs on its own (the rest off): the interference matrix
  function pairs({ seed = 1, runs = 3, ticks = 600 } = {}) {
    const g = G(), T = g.T, ids = g.techs.list.map((t) => t.id);
    const saved = Object.fromEntries(ids.map((id) => [id, T.tech[id].enabled]));
    const configs = [[]];
    for (const a of ids) configs.push([a]);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) configs.push([ids[i], ids[j]]);
    const out = [];
    for (const cfg of configs) {
      for (const id of ids) T.tech[id].enabled = cfg.includes(id);
      const res = run({ seed: seed + out.length, runs, ticks });
      out.push({ techs: cfg.join('+') || '(none)', runs: res.runs, ticks: res.ticks, violations: res.counts });
    }
    for (const id of ids) T.tech[id].enabled = saved[id];
    return out;
  }

  window.__stress = { run, pairs, fuzzRun, place, starts, makeSink };
})();
