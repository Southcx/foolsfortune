// ---------------------------------------------------------------------------------------
// MIRACLES (docs/plans/GODHAND.md sections 4 and 5): a feeling's weather called down by the god hand. Hold the middle button and draw
// the feeling's sign over the ground (the Soul Brush's gesture reader, soulbrush/gesture.js, reads it); let go and it falls where the
// sign was drawn, as wide as the sign was drawn large (a fifth of the view's height small, three fifths great). It needs the feeling
// known (its awakening) and is paid in Lachryma. Each one does something to the creatures under it AND to the island's matter
// (godhand/matter.js), so two together make a third thing: Rain then Storm strikes the whole flood; Rain then Aurora freezes a lake to
// walk on. With Shift held the sign calls its domain's EPIC miracle instead (progress/godpowers.js EPICS), paid in the jar, one a game
// hour. Said by events with `by`: god.miracle { feeling, size, score }, god.epic { epic, domain }.
// The looks here are stand-ins (a ring on the ground in the feeling's colour, a flash for a bolt): Calissa's to dress, the weathers'
// heavy looks to borrow (vfx/weather.js).
//
// Prior art: Black & White 1 and 2 (the gesture is the spell; its size its strength); Okami's Celestial Brush (a sign drawn over the
// world, read by its shape); Populous (the earthquake, the volcano, the flood); From Dust (a miracle changes the matter, not just
// the units).
//
//   const M = new Miracles(god)   M.update(dt) (every frame the hand is up)   M.fixed(dt)   M.live   M.clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';
import { sfx } from '../audio/sfx.js';
import { COLOR } from '../progress/weather.js';
import { recognize } from '../tools/soulbrush/gesture.js';
import { MIRACLES, EPICS, EPIC_BY_SIGN, EPIC_EVERY, signOf, powerOpen } from '../progress/godpowers.js';
import { stream } from '../core/rng.js';
const simRand = stream('godhand/miracles'); // (the simulation's chance: core/rng.js, the same twice)

const UP = new THREE.Vector3(0, 1, 0);
const _ndc = new THREE.Vector2(), _rc = new THREE.Raycaster();
const lerp = (a, b, u) => a + (b - a) * u;
const strongest = (d) => { let best = null, bv = 0; for (const [f, v] of Object.entries(d || {})) if (v > bv) { bv = v; best = f; } return best; };

export class Miracles {
  constructor(god) {
    this.god = god; this.game = god.game;
    this.live = []; this.pts = null; this.epicReady = 0;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style', 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:5;display:none');
    this.line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    this.line.setAttribute('style', 'fill:none;stroke:#ffe0c0;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;opacity:.85');
    svg.appendChild(this.line);
    document.body.appendChild(svg);
    this.svg = svg;
  }

  known(feeling) { const g = this.game; return !!g.lend?.has?.('feelings') || (g.ledger?.get?.(`feeling.known.${feeling}`) || 0) > 0; }

  /** The sign under the middle button: drawn while held, read and cast on release. */
  update(dt) {
    const g = this.game, input = g.input;
    this.epicReady = Math.max(0, this.epicReady - dt);
    if (input.isDown('Mouse1')) {
      if (!this.pts) { this.pts = []; this.svg.style.display = 'block'; }
      const last = this.pts[this.pts.length - 1];
      if (!last || Math.hypot(input.mx - last.x, input.my - last.y) > 3) {
        this.pts.push({ x: input.mx, y: input.my });
        this.line.setAttribute('points', this.pts.map((p) => `${p.x},${p.y}`).join(' '));
      }
    } else if (this.pts) {
      const pts = this.pts, epic = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
      this.pts = null; this.svg.style.display = 'none'; this.line.setAttribute('points', '');
      if (pts.length > 6) this.cast(pts, epic);
    }
  }

  /** Where on the ground a screen point falls (the hand's camera's ray). */
  groundAt(x, y) {
    const g = this.game;
    _ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    _rc.setFromCamera(_ndc, this.god.camera);
    const o = _rc.ray.origin, d = _rc.ray.direction;
    const hit = g.physics.raycast({ x: o.x, y: o.y, z: o.z }, { x: d.x, y: d.y, z: d.z }, 250, null, undefined, (c) => !c.isSensor());
    return hit ? hit.point : null;
  }

  cast(pts, epic) {
    const g = this.game, rec = recognize([pts]), feeling = signOf(rec);
    if (!feeling) { g.log.say('warn', 'The hand does not know that sign.', { key: 'miracle.sign', throttle: 2 }); sfx.dryFire(); return; }
    if (!this.known(feeling)) { g.log.say('warn', `You have not awakened to ${feeling[0].toUpperCase() + feeling.slice(1)}.`, { key: 'miracle.feel', throttle: 2 }); sfx.dryFire(); return; }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) { if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
    const at = this.groundAt((x0 + x1) / 2, (y0 + y1) / 2);
    if (!at || g.cartography.tierAt(at.x, at.y, at.z).tier < 1) { g.log.say('warn', 'A miracle falls only on ground you know.', { key: 'miracle.zoi', throttle: 2 }); sfx.dryFire(); return; }
    if (epic) return this.castEpic(EPIC_BY_SIGN[feeling], at);
    const M = MIRACLES[feeling], u = THREE.MathUtils.clamp((Math.max(x1 - x0, y1 - y0) / innerHeight - 0.2) / 0.4, 0, 1);
    const cost = lerp(M.cost[0], M.cost[1], u);
    if (!g.lachryma.spend(cost, 'god')) { sfx.dryFire(); g.log.say('warn', 'Not enough Lachryma for that miracle.', { key: 'miracle.pay', throttle: 2 }); return; }
    const m = { feeling, kind: 'miracle', x: at.x, y: at.y, z: at.z, r: lerp(M.r[0], M.r[1], u), dur: lerp(M.dur[0], M.dur[1], u), t: 0, tick: 0, every: 0 };
    this.begin(m);
    g.events?.emit('god.miracle', { feeling, size: +u.toFixed(2), score: +(rec.score || 0).toFixed(2), by: 'courier' });
  }

  castEpic(id, at) {
    const g = this.game, E = EPICS[id];
    if (!E) return;
    if (!powerOpen(id, g)) { g.log.say('warn', `${E.label} opens at ${E.at} in its domain.`, { key: 'epic.locked', throttle: 2 }); sfx.dryFire(); return; }
    if (this.epicReady > 0) { g.log.say('warn', 'An epic miracle once a game hour.', { key: 'epic.wait', throttle: 2 }); sfx.dryFire(); return; }
    this.epicReady = EPIC_EVERY;
    this.god.hitJar(T.god.jarHp * E.jar, UP.clone(), 'epic'); // (the toll: paid in the god hand's body)
    this.god.cam.shake = Math.max(this.god.cam.shake, 1.2);
    const m = { epic: id, kind: 'epic', feeling: E.sign, x: at.x, y: at.y, z: at.z, r: E.r, dur: E.dur, t: 0, tick: 0, every: 0 };
    this.begin(m);
    g.events?.emit('god.epic', { epic: id, domain: E.domain, by: 'courier' });
  }

  begin(m) {
    const g = this.game, F = g.matter?.ensure(this.god.jar.pos);
    const ring = new THREE.Mesh(new THREE.RingGeometry(Math.max(0.1, m.r - 0.35), m.r, 64), new THREE.MeshBasicMaterial({ color: COLOR[m.feeling], transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(m.x, m.y + 0.06, m.z);
    g.scene.add(ring);
    m.ring = ring;
    sfx.thump();
    // what happens once, at the start
    if (m.feeling === 'desire' && m.kind === 'miracle') {
      F?.pull(m.x, m.z, m.r, m.dur);
      m.decoy = { alive: true, pos: new THREE.Vector3(m.x, m.y, m.z), vel: new THREE.Vector3(), kind: 'lure', loud: 3, height: 1 };
      (g.ai?.decoys || []).push(m.decoy);
    }
    if (m.epic === 'prophecy') {
      const R = this.god.raids;
      if (R) R.t += EPIC_EVERY; // (the next raid struck out for a game hour)
    }
    if (m.epic === 'maelstrom') F?.pull(m.x, m.z, m.r, m.dur, 3);
    this.live.push(m);
  }

  /** The miracles' work, on the physics step: on the creatures under them, the matter, and loose things. */
  fixed(dt) {
    const g = this.game, F = g.matter?.field, C = g.creatures;
    for (let i = this.live.length - 1; i >= 0; i--) {
      const m = this.live[i];
      m.t += dt; m.tick -= dt; m.every -= dt;
      const pulse = m.tick <= 0; if (pulse) m.tick = 1; // (once a real second: refresh what holds)
      const near = pulse ? C?.near?.({ x: m.x, y: m.y, z: m.z }, m.r) || [] : [];
      const ap = (name, d) => { for (const c of near) if (!c.friend) C.apply(c, name, d, 1, 'courier'); };
      if (m.kind === 'miracle') {
        const M = MIRACLES[m.feeling];
        if (m.feeling === 'wonder') { if (pulse) { ap('halt', 1.5); F?.freeze(m.x, m.z, m.r, 1.6); } }
        else if (m.feeling === 'mirth') { if (pulse) { ap('halt', 1.2); F?.pour(m.x, m.z, m.r * 0.6, 0.6, { kind: 'water', feeling: 'mirth' }); } }
        else if (m.feeling === 'grief') { if (pulse) ap('slow', 1.5); F?.pour(m.x, m.z, m.r, Math.PI * m.r * m.r * M.rain * dt, { kind: 'water', feeling: 'grief' }); }
        else if (m.feeling === 'dread') { if (pulse) { ap('flee', 1.5); F?.hold(m.x, m.z, m.r, 1.6); } }
        else if (m.feeling === 'gall') { if (m.every <= 0) { m.every = M.every; for (const c of C?.near?.({ x: m.x, y: m.y, z: m.z }, m.r) || []) if (!c.friend) C.apply(c, 'halt', M.retch, 1, 'courier'); } F?.corrode(m.x, m.z, m.r, M.corrode * dt); }
        else if (m.feeling === 'fury' && m.every <= 0) { m.every = M.every; this.bolt(m, M.power); }
      } else this.epicStep(m, dt, pulse, ap);
      m.ring.material.opacity = 0.35 + 0.25 * Math.sin(m.t * 4);
      if (m.t >= m.dur) this.end(i);
    }
  }

  /** A bolt from the Storm: the most agitated creature under it, else the highest ground; fuses sand where it lands, and strikes everything
   *  standing in the Lachryma it falls into. */
  bolt(m, power) {
    const g = this.game, C = g.creatures, F = g.matter?.field;
    const list = (C?.near?.({ x: m.x, y: m.y, z: m.z }, m.r) || []).filter((c) => !c.friend && c.alive);
    let at;
    if (list.length) { const c = list.reduce((a, b) => ((b.emo || 0) > (a.emo || 0) ? b : a)); at = c.pos.clone(); C.strike(c, c.pos, UP, power, 'miracle', 'courier', null, 'impact'); }
    else { const a = simRand() * Math.PI * 2, d = Math.sqrt(simRand()) * m.r; at = new THREE.Vector3(m.x + Math.cos(a) * d, m.y, m.z + Math.sin(a) * d); if (F) { const y = F.groundAt(at.x, at.z); if (Number.isFinite(y)) at.y = y; } }
    if (F) {
      F.fuse(at.x, at.z, 1.5);
      if (F.depthAt(at.x, at.z) > 0.05) for (const c of list) if (c.alive && F.depthAt(c.pos.x, c.pos.z) > 0.05) C.strike(c, c.pos, UP, power, 'miracle', 'courier', null, 'impact'); // (the whole pool is struck)
    }
    const flash = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 30, 5), new THREE.MeshBasicMaterial({ color: 0xfff6e0 }));
    flash.position.set(at.x, at.y + 15, at.z);
    g.scene.add(flash);
    setTimeout(() => { g.scene.remove(flash); flash.geometry.dispose(); flash.material.dispose(); }, 120);
    g.fx?.impact?.(at, UP, { sparks: 14, dust: 6 });
    sfx.thump();
  }

  epicStep(m, dt, pulse, ap) {
    const g = this.game, E = EPICS[m.epic], F = g.matter?.field, C = g.creatures;
    if (m.epic === 'stoppedHour') { if (pulse) { ap('halt', 1.5); F?.hold(m.x, m.z, m.r, 1.6); } this.bodies(m, (b) => { b.setLinvel({ x: 0, y: 0, z: 0 }, true); b.setAngvel({ x: 0, y: 0, z: 0 }, true); }); }
    else if (m.epic === 'volcano') {
      if (m.t < 6) F?.pour(m.x, m.z, E.cone, (Math.PI * E.cone * E.cone * E.cone / 3) * dt / 6, { kind: 'clay' }); // (the cone rises)
      else { F?.pour(m.x, m.z, 1.5, E.lava * dt * 3, { kind: 'water', feeling: 'fury' }); F?.heat(m.x, m.z, E.r, 2); }
      if (m.every <= 0 && m.t > 2) { m.every = 1.5; const a = simRand() * 6.28, d = 3 + simRand() * (E.r - 3), at = new THREE.Vector3(m.x + Math.cos(a) * d, m.y, m.z + Math.sin(a) * d); g.fx?.explosion?.(at, 1.6); for (const c of C?.near?.(at, 2.5) || []) if (!c.friend) C.strike(c, c.pos, UP, 4, 'miracle', 'courier', null, 'impact'); }
    }
    else if (m.epic === 'maelstrom') {
      this.bodies(m, (b, d, dx, dz) => { const s = E.swirl * (1 - d / m.r) + 2; b.setLinvel({ x: -dz / d * s - dx / d * 3, y: E.lift * (1 - d / m.r), z: dx / d * s - dz / d * 3 }, true); });
      if (pulse) ap('halt', 1.2);
    }
    else if (m.epic === 'stampede') { if (pulse) ap('flee', 2); }
    else if (m.epic === 'earthquake') {
      if (m.every <= 0) { m.every = 0.3; const a = simRand() * 6.28, d = simRand() * m.r; F?.raise(m.x + Math.cos(a) * d, m.z + Math.sin(a) * d, 2 + simRand() * 2, (simRand() - 0.4) * E.heave); this.god.cam.shake = Math.max(this.god.cam.shake, 0.8); this.bodies(m, (b) => b.applyImpulse({ x: 0, y: b.mass() * 2.5, z: 0 }, true)); }
      if (pulse) ap('halt', 1.2);
    }
    else if (m.epic === 'deluge') { F?.pour(m.x, m.z, m.r, Math.PI * m.r * m.r * E.rate * dt, { kind: 'water', feeling: strongest(g.draught) || 'grief' }); if (pulse) ap('slow', 1.5); }
  }

  /** Every loose dynamic body within the miracle (its distance and offset from the centre). */
  bodies(m, fn) {
    const g = this.game;
    g.physics.world.forEachRigidBody((b) => {
      if (!b.isDynamic()) return;
      const p = b.translation(), dx = p.x - m.x, dz = p.z - m.z, d = Math.hypot(dx, dz);
      if (d < m.r && d > 0.05 && Math.abs(p.y - m.y) < m.r) fn(b, d, dx, dz);
    });
  }

  end(i) {
    const g = this.game, m = this.live[i];
    this.live.splice(i, 1);
    g.scene.remove(m.ring); m.ring.geometry.dispose(); m.ring.material.dispose();
    if (m.decoy) { m.decoy.alive = false; const D = g.ai?.decoys; const j = D ? D.indexOf(m.decoy) : -1; if (j >= 0) D.splice(j, 1); }
    if (m.epic === 'maelstrom') this.bodies(m, (b, d, dx, dz) => b.setLinvel({ x: dx / d * 18, y: 6, z: dz / d * 18 }, true)); // (and flings it all out)
  }

  clear() { for (let i = this.live.length - 1; i >= 0; i--) this.end(i); this.pts = null; this.svg.style.display = 'none'; }
}
