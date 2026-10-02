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
//   respawn     falling out of the world (a reset floor is fine, and a trial's start; below the map is not)
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
    out.push({ name: 'dunes', dunes: true }, { name: 'dunes skiff', dunes: true, mount: true }, { name: 'dunes edge', dunes: true, edge: true }, { name: 'edge skiff', dunes: true, edge: true, mount: true }, { name: 'siege', siege: true }, { name: 'weir', weir: true }, { name: 'braid', circuit: 'braid' }, { name: 'mill race', circuit: 'mill' }, { name: 'spindle', circuit: 'spindle' });
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
    else if (s.dunes) {
      g.course.toDunes();
      if (s.edge) { // (a few metres inside the barrier, facing it: the fuzz runs into the wall)
        const D = g.game.dunes, a = rnd() * Math.PI * 2, r = 470, x = D.center.x + Math.cos(a) * r, z = D.center.z + Math.sin(a) * r;
        g.course.teleport(new g.THREE.Vector3(x, D.heightAt(x, z) + 0.05, z), Math.atan2(Math.cos(a), Math.sin(a)));
      }
      if (s.mount) g.techs.get?.('surfer')?.mount();
    }
    else if (s.siege) g.course.toSiege();
    else if (s.weir) g.course.toWeir();
    else if (s.circuit) g.game.circuits.enter(s.circuit);
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
    const respawnOff = g.events.on('respawn', (e) => { if (e.why !== 'pit' && e.why !== 'trial') sink.violation('respawn', P, label + ' ' + e.why); }); // (a trial's start puts her at its line: by design)
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
      // the Sondelass: draw, change form, swing, cast, sink, sound, fire the grapnel
      if (!god.controlling && rnd() < 0.05) {
        const r = rnd();
        if (r < 0.1) inp.pressed.add('KeyQ');
        else if (r < 0.25) inp.pressed.add('Digit' + (1 + Math.floor(rnd() * 3)));
        else if (r < 0.5) { inp.pressed.add('Mouse0'); inp.down.add('Mouse0'); }
        else if (r < 0.7) inp.down.delete('Mouse0');
        else if (r < 0.8) { inp.pressed.add('Mouse2'); inp.down.add('Mouse2'); }
        else if (r < 0.9) inp.down.delete('Mouse2');
        else if (r < 0.95) inp.pressed.add('Mouse1');
        else inp.wheel += (rnd() - 0.5) * 400;
      }
      // (the Book's cards, or none)
      const B0 = (g) => g.game.veritome?.book.cards || {};
      // the Veritome: draw it now and then (J); raise the lens and expose plates; now and then appraise the roll or condense a card;
      // the Pneuka Box: things come into it (as a chest gives them), are dropped, stored, taken out, tied on; the Survey (N)
      if (!god.controlling && rnd() < 0.003) inp.pressed.add('KeyJ');
      if (!god.controlling && rnd() < 0.001) inp.pressed.add('KeyN');
      const book = g.techs.get('veritome');
      if (book?.held && rnd() < 0.04) {
        const r = rnd();
        if (r < 0.3) { inp.pressed.add('Mouse2'); inp.down.add('Mouse2'); }
        else if (r < 0.5) inp.down.delete('Mouse2');
        else if (r < 0.85) { inp.pressed.add('Mouse0'); inp.down.add('Mouse0'); }
        else inp.pressed.add('Mouse1');
      }
      if (book && rnd() < 0.002) {
        const B = book.book, r = rnd(), ids = Object.keys(B.cards);
        if (r < 0.5 && B.film.plates.length) book.appraise();
        else if (ids.length) B.condense(ids[Math.floor(rnd() * ids.length)]);
      }
      const box = g.game.pneuka;
      if (box && rnd() < 0.006) {
        const r = rnd(), full = box.slots.map((s, i) => (s ? i : -1)).filter((i) => i >= 0), any = full[Math.floor(rnd() * full.length)];
        if (r < 0.35) box.add(`curio.${['whelk', 'gull', 'pearl', 'skull', 'koi', 'bell', 'storm'][Math.floor(rnd() * 7)]}`, 'stress');
        else if (r < 0.45 && full.length) box.drop(any);
        else if (r < 0.6 && full.length) box.store(any);
        else if (r < 0.7) { const c = Object.keys(B0(g)).filter((k) => k.startsWith('curio.')); if (c.length) box.withdraw(c[Math.floor(rnd() * c.length)]); }
        else if (r < 0.8 && full.length) box.tieOn(any);
        else if (r < 0.88) { if (rnd() < 0.5) box.tie(['lure.bob', 'lure.eye', 'lure.fly'][Math.floor(rnd() * 3)]); else if (full.length) box.fitOn(any); }
        else if (r < 0.94 && full.length > 1) box.swap(any, full[0]);
        else { const n = g.game.ground.nearest(P); if (n) g.game.ground.pick(n.ref); }
      }
      if (book?.pending) book.afterRender(null); // (the shot develops: a test drive has no frame of its own)
      // the chat line and the emotes (a command now and then; moving ends an emote); the clay folk: talk to one when near, and
      // press through what it says (F / Space / a number for a choice), or walk off mid-sentence
      const gg = g.game;
      if (gg.chat && rnd() < 0.003) gg.chat.run(['/sit', '/dance', '/wave', '/faint', '/nod', '/no', '/fold', '/talk', '/kneel', '/em trips over a pot', 'hello', '/where', '/stand', '/help sit', '/nonsense'][Math.floor(rnd() * 15)]);
      if (gg.folk && !gg.dialogue?.open && rnd() < 0.002) { const near = gg.folk.list.filter((f) => f.pos.distanceTo(P.pos) < 60), n = near[Math.floor(rnd() * near.length)]; if (n) P.pos.set(n.pos.x + Math.sin(n.yaw) * 1.8, n.pos.y + 0.05, n.pos.z + Math.cos(n.yaw) * 1.8); P.prevPos?.copy(P.pos); if (n) inp.pressed.add('KeyF'); }
      if (gg.dialogue?.open && rnd() < 0.08) inp.pressed.add(['KeyF', 'Space', 'Enter', 'Digit1', 'Digit2', 'KeyS'][Math.floor(rnd() * 6)]);
      // the slip jellies, the stun and reprogramming: strike one when near, stun one (as the flash would), open its mind and type into
      // it (the line whole, a wrong key, nonsense), or Esc; now and then a cut in blade mode's way (resisted, or a zandatsu when it is down)
      const J = gg.jellies?.list.filter((c) => c.alive && c.pos.distanceTo(P.pos) < 80) || [];
      if (J.length && rnd() < 0.01) { const c = J[Math.floor(rnd() * J.length)]; gg.creatures.strike(c, c.center(new g.THREE.Vector3()), new g.THREE.Vector3(rnd() - 0.5, 0, rnd() - 0.5).normalize(), 0.5 + rnd() * 2, 'shot'); }
      if (J.length && rnd() < 0.006) gg.stun.add(J[Math.floor(rnd() * J.length)], 0.3 + rnd() * 0.8, { by: 'courier', cause: 'flash' });
      if (J.length && !gg.reprogram.open && rnd() < 0.004) { const c = J.find((x) => gg.stun.stunned(x)); if (c) gg.reprogram.start(c); }
      if (gg.reprogram.open && rnd() < 0.06) {
        const R = gg.reprogram, r = rnd();
        if (R.phase === 'choose') R.choose(Math.floor(rnd() * 6));
        else if (r < 0.5) { R.field.value = R.line.slice(0, R.typed.length + 1 + Math.floor(rnd() * 3)); R.typing(); }
        else if (r < 0.7) { R.field.value = R.typed + 'q'; R.typing(); }
        else if (r < 0.8) R.close('closed');
      }
      if (J.length && rnd() < 0.002) { const bm = g.techs.get('sondelass')?.cutlass?.blade, c = J[Math.floor(rnd() * J.length)]; if (bm) { const p = c.center(new g.THREE.Vector3()); bm.pt.copy(p); bm.size = 0.7; if (gg.stun.stunned(c) && rnd() < 0.5) bm.zandatsuCreature(c, new g.THREE.Vector3(1, 0, 0), new g.THREE.Vector3(0, 0, 1), new g.THREE.Vector3(0, 0, -1)); else bm.slicePlane({ n: new g.THREE.Vector3(1, 0, 0), d: p.x }, new g.THREE.Vector3(1, 0, 0)); } }
      // the Soul Brush: draw it now and then (G); with the canvas open, the mouse scribbles and LMB lifts and lays the brush
      if (!god.controlling && rnd() < 0.004) inp.pressed.add('KeyG');
      // the last three tools: put on and taken off through the box, drawn, played (K the Dreamvane, U the Crucibelle, I the Lockheart)
      if (rnd() < 0.002 && gg.pneuka) { const id = ['tool.dreamvane', 'tool.crucibelle', 'tool.lockheart'][Math.floor(rnd() * 3)], i = gg.pneuka.slots.findIndex((s) => s?.id === id); if (i >= 0) gg.pneuka.wear(i); }
      if (!god.controlling && rnd() < 0.004) inp.pressed.add(['KeyK', 'KeyU', 'KeyI'][Math.floor(rnd() * 3)]);
      if (gg.belt?.inHand && ['crucibelle'].includes(gg.belt.inHand.id) && rnd() < 0.08) inp.pressed.add('Digit' + (1 + Math.floor(rnd() * 5)));
      if (gg.lockheart && rnd() < 0.002) { gg.lockheart.charge = 80; const i = gg.pneuka?.slots.findIndex((s) => s?.id?.startsWith('key.')); if (i >= 0) gg.pneuka.fitOn(i); }
      const brush = g.techs.get('soulbrush');
      if (brush?.celestial.active) {
        inp.dx += (rnd() - 0.5) * 60; inp.dy += (rnd() - 0.5) * 60;
        if (rnd() < 0.06) { if (inp.down.has('Mouse0')) inp.down.delete('Mouse0'); else inp.down.add('Mouse0'); }
        if (rnd() < 0.01) inp.down.delete('Mouse2');
      }
      g.tick(1 / 60);
      if (god.state !== 'off') { if (god.state === 'on' || god.state === 'in') { sink.ticks++; continue; } }
      // taps last one step
      if (tapKey && !held.has(tapKey)) inp.down.delete(tapKey);

      // ---- invariants ----
      const v = P.vel, p = P.pos;
      if (!Number.isFinite(p.x + p.y + p.z + v.x + v.y + v.z)) { sink.violation('finite', P, label); break; }
      sink.talkStuck = g.techs.active?.id === 'talk' && !g.game.dialogue?.open ? (sink.talkStuck || 0) + 1 : 0; // (it ends on the next fixed step)
      if (sink.talkStuck > 3) sink.violation('talk-stuck', P, label);
      // a mind is never held open past its time, the chat line is no one's, no jelly leaves the world, every mind is doing something it
      // can say, and no stun outlasts its time (stun.js) unless a window holds it
      if (gg.reprogram?.open && gg.reprogram.phase === 'type' && gg.reprogram.t < -1) sink.violation('reprogram-stuck', P, label);
      if (gg.log?.mode) sink.violation('log-mode-stuck', P, label);
      for (const c of gg.jellies?.list || []) {
        if (!Number.isFinite(c.pos.x + c.pos.y + c.pos.z + c.deform.sq)) { sink.violation('jelly-finite', P, label); break; }
        if (c.alive && c.brain.lod !== 'far' && !c.brain.action && c.brain.now > 2) { sink.violation('mind-idle', P, label + ' ' + JSON.stringify({ st: [...c.status.keys()], dir: c.brain.directive?.action?.id, sc: c.brain.reasoner.actions.map((a) => a.id + ':' + (+c.brain.reasoner.score(a, c.brain.ctx)).toFixed(2) + (c.brain.cool.get(a.id) > c.brain.now ? 'c' : '')).join(' '), drives: c.drives.v, spirit: !!c.spirit })); break; }
        if (c.alive && Object.values(c.drives.v).some((v) => !Number.isFinite(v) || v < 0 || v > 1)) { sink.violation('drives-range', P, label); break; }
        const s = c.status?.get('stun'); if (s && s.t > 30) { sink.violation('stun-forever', P, label); break; }
        if (c.spirit && c.alive && !(c.spirit.life <= c.spirit.max + 1e-6)) { sink.violation('spirit-life', P, label); break; }
      }
      // the last three tools: the fork comes home, a spirit cap holds, the Lockheart's charge stays in range, no decoy outlives its time
      { const V = g.techs.get('dreamvane'); if (V && V.fork.state !== 'heel' && V.fork.t > 12) sink.violation('fork-lost', P, label); }
      if ((gg.spirits?.list.length || 0) > (gg.spirits?.max || 4)) sink.violation('spirits-over', P, label);
      if (gg.lockheart && !(gg.lockheart.charge >= 0 && gg.lockheart.charge <= gg.lockheart.cap)) sink.violation('lockheart-charge', P, label);
      if ((gg.ai?.decoys || []).some((d) => d.t > d.max + 0.1)) sink.violation('decoy-stuck', P, label);
      { const V = g.techs.get('dreamvane'), C = g.techs.get('crucibelle'), H = g.techs.get('lockheart'); for (const T of [V, C, H]) if (T && T.drawTarget > 0 && !gg.belt.isWorn(T.id)) { sink.violation('unworn-drawn:' + T.id, P, label); break; } }
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
