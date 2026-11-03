// ---------------------------------------------------------------------------------------
// THE SIX LATER TRAPS IN THE WORLD (G305, 2026-11-03; docs/plans/TRACK-EDITOR.md 4; the rules progress/traps.js, the geometry
// progress/trapzones.js): the antlion, boulder, hasten field, storm cell, ward gate and pot catapult, each with the seven first traps'
// shape: a cycle (traps.js runs it), a tell (the placeholder's reach drawn on the sand, glowing through the tell), an answer (a lane,
// a hop, a shoulder, a detour), a possessed mode (traps.js `fire` with the possessor's lane). This file is what is particular to the six:
// their placeholders (plain meshes; the looks are Calissa's, src/vfx/racewaytraps/: her `place` is asked first and answers nothing for
// these kinds yet), what each does to a racer, and the moments that happen once in a cycle (a bolt, a landing, a smashed pot).
// Every effect goes through the traps' own verbs (Traps.strike: a wall hit, a bump, a bail; a drag on the board's speed like the gust's
// push), so the core movement and the Solar Skiff's handling are untouched and every effect has a source you can see.
//
// Prior art: the six traps' homework is in progress/traps.js; Mario Kart's lightning and Chain Chomp; Excitebike's obstacles.
//
//   LANED (the kinds that take a lane)   isNew(kind)   placeNew(traps, Tp) -> look   showNew(traps, Tp)   tickNew(traps, Tp, was, racers)
//   actNew(traps, Tp, x, dt, a, F, grow) (a racer under a sweeping or standing trap)   events: trap.bolt { kind, i, mark, by }, trap.lob
//   { kind, i, by }, trap.land { kind, i, smashed, by }, trap.smash { kind, by }, trap.break { kind, by }, with trap.hit by traps.js
// Tp.phase / Tp.k as every trap's; Tp.lane (the lane taken); Tp.marks, Tp.struck (the storm); Tp.landed, Tp.smashed (the pot);
// Tp.broken (the boulder).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { laneLat, mawAt, boulderAt, stormMarks, potAt, potLands, hitOf } from '../../progress/trapzones.js';

const NEW = new Set(['antlion', 'boulder', 'hasten', 'storm', 'ward', 'catapult']);
export const LANED = new Set(['pillars', 'antlion', 'boulder', 'storm', 'catapult']);
export const isNew = (kind) => NEW.has(kind);
const SHOULDER_WINDOW = 0.45; // (real seconds after a shoulder in which the boulder can be broken by it)
const LAND_AT = 0.92; // (the pot lands at this share of its flight: the frame before the phase ends)
const loc = (a, lat, y = 0) => [-lat, y, a]; // (the trap's frame: local x is -lat, local z along the line, as traps.js frameAt lays it)
const centre = (Tp, W) => (Tp.clock ? laneLat(Tp.lane, W) : Tp.lat);
const by = (T) => (T.mode === 'courier' ? 'courier' : 'environment');

/** The placeholders: plain flat-shaded meshes in the first seven's palette, the lane or patch in the glow the tell lights. */
export function placeNew(T, Tp) {
  const { F, pos } = T.frameAt(Tp.s, 0), K = Tp.K, W = F.w, root = new THREE.Group();
  root.position.copy(pos); root.rotation.y = Math.atan2(F.fx, F.fz); T.group.add(root);
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, flatShading: true });
  const glow = new THREE.MeshBasicMaterial({ color: 0x3a2a24, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
  const look = { root, glow, parts: [], W }, add = (m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); root.add(m); return m; };
  const flat = (g) => new THREE.Mesh(g.rotateX(-Math.PI / 2), glow), S = K.size;
  if (Tp.kind === 'antlion') {
    look.pad = add(flat(new THREE.PlaneGeometry((2 * W) / 3, S.back + S.reach)), 0, 0.1, (S.reach - S.back) / 2);
    look.maw = add(new THREE.Mesh(new THREE.ConeGeometry(S.r * 0.8, 4, 10), mat(0x8a4a3a)), 0, -4, -S.back);
  } else if (Tp.kind === 'boulder') {
    look.pad = add(flat(new THREE.PlaneGeometry((2 * W) / 3, S.reach + S.tail)), 0, 0.1, (S.reach - S.tail) / 2);
    look.rock = add(new THREE.Mesh(new THREE.IcosahedronGeometry(S.r, 0), mat(0xb08a6a)), 0, S.r, S.reach);
  } else if (Tp.kind === 'hasten') {
    look.disc = add(flat(new THREE.CircleGeometry(S.r, 28)), -Tp.lat, 0.1, 0);
    look.ring = add(new THREE.Mesh(new THREE.TorusGeometry(S.r, 0.3, 6, 28).rotateX(Math.PI / 2), mat(0x7fdcff)), -Tp.lat, 0.5, 0);
  } else if (Tp.kind === 'storm') {
    look.discs = [0, 1, 2].map(() => add(flat(new THREE.CircleGeometry(S.r, 18))));
    const bolt = new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.9 });
    look.bolts = [0, 1, 2].map(() => { const b = add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 40, 5), bolt), 0, -50, 0); return b; });
  } else if (Tp.kind === 'ward') {
    look.disc = add(flat(new THREE.CircleGeometry(S.r, 28)), -Tp.lat, 0.1, 0);
    look.wall = add(new THREE.Mesh(new THREE.CylinderGeometry(S.r, S.r, 3, 28, 1, true), mat(0xc0a0ff)), -Tp.lat, -1.5, 0);
  } else if (Tp.kind === 'catapult') {
    add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 3, 1.4), mat(0x8a4a3a)), W + 4, 1.5, 0);
    look.arm = add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 6), mat(0x3a2a24)), W + 4, 3, 0);
    look.pot = add(new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat(0xd9906a)), W + 4, 3, 0);
    look.land = add(flat(new THREE.CircleGeometry(S.r, 22)), 0, 0.1, S.range);
  }
  return look;
}

/** The six placeholders' per frame: the reach where this cycle will put it, and the body in the cycle's phase. */
export function showNew(T, Tp) {
  const L = Tp.look, K = Tp.K, S = K.size, W = L.W, ph = Tp.phase, on = ph !== 'idle', act = ph === 'active', k = Tp.k;
  const set = (m, a, lat, y) => m.position.set(...loc(a, lat, y));
  if (Tp.kind === 'antlion') {
    const lat = laneLat(Tp.lane, W); L.pad.position.x = -lat; L.pad.visible = on;
    const m = mawAt(K, act ? k : 0, Tp.lane, W); set(L.maw, act ? m.a : -S.back, lat, act ? 1 : ph === 'tell' ? -4 + 3 * k : -4);
  } else if (Tp.kind === 'boulder') {
    const lat = laneLat(Tp.lane, W); L.pad.position.x = -lat; L.pad.visible = on; L.rock.visible = on && !Tp.broken;
    const m = boulderAt(K, act ? k : 0, Tp.lane, W); set(L.rock, m.a, lat, S.r); L.rock.rotation.x = -m.a * 0.3;
  } else if (Tp.kind === 'hasten') {
    const lat = centre(Tp, W); L.disc.position.x = -lat; L.ring.position.x = -lat; L.ring.rotation.y += act ? 0.2 : 0.02; L.ring.scale.setScalar(act ? 1 : ph === 'tell' ? 0.5 + 0.5 * k : 0.6);
  } else if (Tp.kind === 'storm') {
    L.discs.forEach((d, i) => { const M = Tp.marks?.[i]; d.visible = !!M && on; if (M) set(d, M.a, M.lat, 0.12); });
    L.bolts.forEach((b, i) => { const M = Tp.marks?.[i], flash = Tp.struck?.[i] && T.t - Tp.struck[i] < 0.25; b.visible = !!M && !!flash; if (M) set(b, M.a, M.lat, 20); });
  } else if (Tp.kind === 'ward') {
    const lat = centre(Tp, W); L.disc.position.x = -lat; L.wall.position.x = -lat; L.wall.position.y += ((act ? 1.5 : -1.5) - L.wall.position.y) * 0.4;
  } else if (Tp.kind === 'catapult') {
    const lane = Tp.lane, to = potLands(K, lane, W); L.land.visible = on; L.land.position.set(-to.lat, 0.1, to.a);
    const p = potAt(K, act ? k : 0, lane, W); L.pot.visible = !(act && (Tp.smashed || Tp.landed)); if (act) set(L.pot, p.a, p.lat, p.h); else set(L.pot, 0, -(W + 4), 3.4);
    L.arm.rotation.x = ph === 'tell' ? -0.9 * k : act ? 0.5 : 0;
  }
}

/** What happens once in a cycle, on the frame it comes: the cycle's start sets its marks, the storm's bolts fall when their time comes, the
 *  pot lands (or is popped in the air by the rider). `racers` as traps.js reads them. */
export function tickNew(T, Tp, was, racers) {
  const K = Tp.K, S = K.size, W = Tp.look.W, g = T.game, L = T.T.length, grow = 1 + 0.15 * Tp.wrath;
  if (Tp.phase === 'tell' && was !== 'tell') { Tp.broken = false; Tp.smashed = false; Tp.landed = false; Tp.struck = []; Tp.marks = Tp.kind === 'storm' ? stormMarks(K, Tp.lane, W) : null; }
  const kk = Tp.phase === 'active' ? Tp.k : was === 'active' ? 1 : -1; if (kk < 0) return;
  if (Tp.kind === 'storm') {
    Tp.marks?.forEach((M, i) => {
      if (Tp.struck[i] || kk < M.at) return; Tp.struck[i] = T.t;
      g.events?.emit('trap.bolt', { kind: 'storm', i: Tp.i, mark: i, by: by(T) });
      for (const x of racers) if (Math.hypot(T.along(Tp, x, L) - M.a, x.lat - M.lat) < S.r * grow) T.strike(Tp, x, K.hit);
    });
  } else if (Tp.kind === 'catapult') {
    if (Tp.phase === 'active' && was !== 'active') g.events?.emit('trap.lob', { kind: 'catapult', i: Tp.i, by: by(T) });
    if (Tp.landed || Tp.smashed) return;
    const p = potAt(K, Math.min(1, kk), Tp.lane, W), you = racers.find((x) => x.who === 'you');
    if (you?.air && Math.hypot(T.along(Tp, you, L) - p.a, you.lat - p.lat) < S.smash) { Tp.smashed = true; g.events?.emit('trap.smash', { kind: 'catapult', by: 'courier' }); return; } // (popped in the air: the pot's answer)
    if (kk >= LAND_AT) {
      Tp.landed = true; const to = potLands(K, Tp.lane, W); g.events?.emit('trap.land', { kind: 'catapult', i: Tp.i, smashed: false, by: by(T) });
      for (const x of racers) if (!x.air && Math.hypot(T.along(Tp, x, L) - to.a, x.lat - to.lat) < S.r * grow) T.strike(Tp, x, K.hit);
    }
  }
}

/** A racer under the antlion's maw, the boulder, the hasten field or the ward's circle, while the trap acts (traps.js `act` asks). */
export function actNew(T, Tp, x, dt, a, F, grow) {
  const K = Tp.K, st = { k: Tp.k, lane: Tp.lane, lat: centre(Tp, F.w) }, xr = { a, lat: x.lat, air: x.air };
  if (Tp.kind === 'boulder') {
    if (Tp.broken) return;
    const m = boulderAt(K, Tp.k, Tp.lane, F.w);
    if (x.who === 'you' && T.t - (T.shoulderAt ?? -9) < SHOULDER_WINDOW && Math.hypot(a - m.a, x.lat - m.lat) < K.size.split + m.r) { Tp.broken = true; T.game.events?.emit('trap.break', { kind: 'boulder', by: 'courier' }); return; } // (the shoulder: the boulder's answer)
  }
  if (!hitOf(Tp.kind, st, xr, F.w, grow)) return;
  if (Tp.kind === 'hasten') {
    const f = Math.max(0, 1 - K.drag * dt); if (x.S) x.S.v.multiplyScalar(f); else if (x.r) x.r.v *= f;
    if (!Tp.hitT.has(x.who)) { Tp.hitT.set(x.who, 3); T.said(Tp, x); }
    return;
  }
  T.strike(Tp, x, K.hit);
}
