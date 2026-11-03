// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PULLEY (docs/plans/STRAWMANS-WELL.md 3.7; GAPS G251): two platforms on one rope over a wheel, the house's kinematic
// movers (world/props/movers.js) posed by a fraction `k` of the travel instead of by the clock: A rises as B falls. What stands on a
// platform loads it (the Courier 1, a crate PULLEY.crate), and the heavier side falls, the lighter rises, at PULLEY.speed m/s; a brake holds
// it while nobody stands on either platform (so a crate set on the high side waits for you). Each platform is a mover, so the Courier
// rides it as any lift. Placeholder meshes are named for Calissa: wellPulleyPlatform, wellPulleyRope, wellPulleyWheel.
//
// Prior art: Limbo's and Little Big Planet's counterweight lifts, Donkey Kong Country's pulley platforms.
//
//   makePulley(machine, S, { a: [x0, x1], b: [x0, x1], aLow, bHigh, travel }) -> the machine item (kind 'pulley')   tickPulley(machine, it, dt)
//   a platform's top is aLow + k * travel (A) and bHigh - k * travel (B), in lane metres
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PULLEY } from '../../progress/strawmanwell.js';
import { COLOR, DEPTH } from './stagekit.js';
import { AT } from './layout.js';

const THICK = 0.4;

export function makePulley(machine, S, { a, b, aLow, bHigh, travel, beam = bHigh + travel + 3 }) {
  const M = machine.game.movers; if (!M?.shuttle) return null;
  const it = { kind: 'pulley', k: 0, travel, aLow, bHigh, beam, plats: [] };
  const mk = (xs, topAt) => {
    const w = xs[1] - xs[0], cx = AT.x + (xs[0] + xs[1]) / 2;
    const m = M.shuttle({ pos: [cx, AT.y + topAt(0) - THICK / 2, S.z], to: [0, 0, 0] });
    const mesh = m.box([w, THICK, DEPTH - 0.6], COLOR.spool, [0, 0, 0]); mesh.name = 'wellPulleyPlatform';
    m.pose = (t, p) => p.set(cx, AT.y + topAt(it.k) - THICK / 2, S.z);
    m.snap(); machine.movers.push(m);
    const rope = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1, 0.06), new THREE.MeshStandardMaterial({ color: COLOR.thread, roughness: 0.9 })); rope.name = 'wellPulleyRope';
    S.add(rope);
    it.plats.push({ m, x0: AT.x + xs[0], x1: AT.x + xs[1], cx, topAt, rope });
  };
  mk(a, (k) => aLow + k * travel); mk(b, (k) => bHigh - k * travel);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.3, 16), new THREE.MeshStandardMaterial({ color: COLOR.pin, metalness: 0.4, roughness: 0.4 })); wheel.name = 'wellPulleyWheel';
  wheel.rotation.x = Math.PI / 2; wheel.position.set((it.plats[0].cx + it.plats[1].cx) / 2, AT.y + beam, S.z); S.add(wheel);
  machine.add(it); return it;
}

/** What stands on a platform: the Courier riding it, and every crate resting on it. */
function load(machine, it, P) {
  const pl = machine.P, top = P.topAt(it.k);
  let n = pl.platform === P.m ? PULLEY.courier : 0;
  for (const c of machine.crates) {
    const t = c.e.body?.translation?.(); if (!t) continue;
    if (t.x > P.x0 - 0.3 && t.x < P.x1 + 0.3 && t.y > AT.y + top - 0.1 && t.y < AT.y + top + 1.5 && Math.abs(t.z - P.m.cur.p.z) < 2.5) n += PULLEY.crate;
  }
  return n;
}

export function tickPulley(machine, it, dt) {
  const [A, B] = it.plats, la = load(machine, it, A), lb = load(machine, it, B), riders = machine.P.platform === A.m || machine.P.platform === B.m;
  if (riders && la !== lb) {
    it.k = THREE.MathUtils.clamp(it.k + (lb > la ? 1 : -1) * (PULLEY.speed / it.travel) * dt, 0, 1); // (B the heavier: it falls, A rises)
    if (it.k > 0.05 && it.k < 0.95) machine.well.verb('pulley');
  }
  for (const P of it.plats) { // (the ropes: from the wheel down to each platform)
    const top = AT.y + P.topAt(it.k), len = Math.max(0.1, AT.y + it.beam - top);
    P.rope.scale.y = len; P.rope.position.set(P.cx, top + len / 2, P.m.cur.p.z);
  }
}
