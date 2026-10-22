// ---------------------------------------------------------------------------------------
// THE SEA SERPENT'S MIND: what the open sea's hunter wants and what it does about it, as the AI parts put it (src/creatures/ai/, docs/AI.md).
// The body (seaserpent.js) carries it out. Hostile by nature (progress/opensea/safari.js: its disposition): inside its `sense` it hunts
// the ship. What it watches is the hull (the Courier is sealed in at the helm: Brain's `sees`), and how loud the hull is is the sail
// you set: a ship stopped is hard to notice, one at full sail easy (Sea of Thieves' Megalodon, drawn by a ship under way).
//
// WHAT IT WANTS (drives, 0..1; traits: bold, lazy)
//   fear        a heavy blow (its own spit sent back, the head shot); enough and it dives away home, to come back with a grudge
//   rest        it tires as it hunts, and breaks off to lie on the surface of its own water
//   curiosity   a gun's report or a ship half-seen: it goes under to look
//
// WHAT IT DOES (scored by the reasoner, utility.js)
//   what is done to it   stunned, asleep (statuses: creatures.js): it floats on the top, its head on the water
//   hunting              it keeps 30 to 48 m off the ship, circling it with its humps showing (Lagiacrus, the Megalodon), and between a
//                        breath of a few seconds takes one of its four moves (seaserpent.js `windUp`): the coil when the ship is near and
//                        slow, the ram when it is under way, the spit at range, the dive to come up somewhere else
//   staying alive        flee (under, home)
//   living               stalk (under the water to where it half-saw you, and up to look), investigate (a shot heard), go home, roam,
//                        bask (lies at the top of its water, its head up: a plate's moment)
//
// Prior art: Monster Hunter's Lagiacrus and Plesioth (a sea monster that circles, dives and comes up where the water shows); Sea of
//   Thieves' Megalodon (drawn by a ship under way, circling the hull); the Lantern Wisp's mind (wisp/mind.js: a hunter that keeps its
//   distance and chooses a move between breaths), built from the same parts.
//
//   seaSerpentMind(S) -> { actions, drives, traits, mods, heard, sees }   SERPENT_MIND (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { st } from '../creatures.js';
import { enraged } from '../../progress/combat/emo.js';
import { AWARE, curve, norm, steer } from '../ai/index.js';
import { SEA_SERPENT } from '../../progress/opensea/seaserpent.js';
import { stream } from '../../core/rng.js';
const simRand = stream('creatures/seaserpent/mind'); // (the simulation's chance: core/rng.js, the same twice)

/** Its numbers: roam (m/s at its ease), roamR (m: its home water), leash (m from home a hunt may run), keep (m: the band it circles the
 *  ship in), breath (real s between two moves, at random in the range), fearFlees (fear past which it dives away), loud (how noticeable
 *  the hull is at each throttle step: stop, slow, cruise, full sail). */
export const SERPENT_MIND = { roam: 4, roamR: 160, leash: 650, keep: [30, 48], breath: [1.6, 3.4], fearFlees: 0.7, loud: [0.35, 0.7, 1, 1.4] };

const _w = new THREE.Vector3(), _o = new THREE.Vector3(), _k = new THREE.Vector3(), _hv = new THREE.Vector3();
const rnd = (a, b) => a + simRand() * (b - a);
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

export function seaSerpentMind(S) {
  const g = S.game, C = SERPENT_MIND, MV = SEA_SERPENT.moves, SP = SEA_SERPENT.speed;
  const ship = () => (g.opensea?.sailing ? g.opensea.helm : null);
  const distHome = (x) => hd(x.c.pos, x.c.home);
  /** The ship it knows of, if it means to hunt it: sure enough of it, or holding a grudge, and lately. */
  const foe = (x) => {
    const f = x.mem.fact(x.P);
    if (!f || x.now - Math.max(f.seenAt, f.heardAt) > 10) return null;
    return f.aware >= 0.55 || f.grudge >= 0.3 ? f : null;
  };
  const glyph = (x, kind, color = 0xffd27a) => g.glyphs?.pop(kind, x.c.spine[0].p, { color, size: 1.6, life: 1.4, follow: () => x.c.spine[0].p });
  /** Which move now, if any: each its gate, its cooldown, and a weight (seaserpent.js `windUp` lays it on the water). */
  const pickMove = (x, d) => {
    const c = x.c, H = ship(); if (!H) return null;
    const opts = [];
    if (c.cd.coil <= 0 && d < 26 && H.speed < H.cruise * 1.2) opts.push(['coil', 1.6]);
    if (c.cd.ram <= 0 && d > 22 && d < 90 && H.speed > 3) opts.push(['ram', 1]);
    if (c.cd.spit <= 0 && d > 12 && d < 80) opts.push(['spit', 1.4]);
    if (c.cd.dive <= 0 && d < 70) opts.push(['dive', 0.7]);
    for (const o of opts) if (o[0] === c.lastMove) o[1] *= 0.3; // (seldom the same move twice running)
    let sum = 0; for (const o of opts) sum += o[1];
    let r = simRand() * sum; for (const o of opts) if ((r -= o[1]) <= 0) return o[0];
    return null;
  };

  const A = [];
  const act = (a) => { A.push(a); return a; };
  for (const [id, s] of [['stunned', 'stun'], ['asleep', 'sleep']]) act({ id, weight: 5, urgent: true, when: (x) => st(x.c, s) > 0, tick: (x) => { x.c.goUnder = 0; x.c.wantRear = 0; x.c.want.set(0, 0, 0); return st(x.c, s) > 0 ? 'run' : 'done'; } });

  act({
    id: 'hunt', hunt: true, weight: 1.8, cooldown: 1,
    when: (x) => !st(x.c, 'calm') && !st(x.c, 'charm') && !st(x.c, 'forget') && !!ship() && !!foe(x) && distHome(x) < C.leash,
    consider: [(x) => curve.logistic(0.35, 9)(Math.max(0, Math.min(1, 0.5 + 0.6 * foe(x).grudge - 0.7 * x.drives.get('fear') - 0.4 * x.drives.get('rest')) * (x.c.traits.bold ?? 1)))],
    lock: (x) => !!x.c.attack || !!x.c.coiled,
    enter: (x) => {
      const c = x.c; x.bb.breath = rnd(1, 2); x.bb.dir = c.id % 2 ? 1 : -1; x.bb.underT = 0;
      if ((c.risenT ?? -99) < x.now - 30) { c.risenT = x.now; g.events?.emit('seaserpent.rise', { by: 'creature' }); glyph(x, 'bang1', 0xff9a4a); }
    },
    tick: (x, dt) => {
      const c = x.c, f = foe(x), H = ship(), b = x.bb;
      if (c.attack || c.coiled) return 'run';
      if (!f || !H) return 'done';
      if (distHome(x) > C.leash) { f.aware = Math.min(f.aware, 0.3); return 'fail'; }
      const F = x.now - f.seenAt < 1 ? H.pos : f.pos, d = hd(c.pos, F);
      if (b.underT > 0) { // (dived: it runs under to the ship's flank and comes up there)
        b.underT -= dt; c.goUnder = 1;
        _o.set(Math.sin(H.yaw + b.dir * 1.6), 0, Math.cos(H.yaw + b.dir * 1.6)).multiplyScalar(C.keep[0]).add(F);
        steer.arrive(c.want, c.pos, _o, SP * 1.3, 6);
        if (b.underT <= 0) { c.goUnder = 0; b.breath = rnd(0.6, 1.2); }
        return 'run';
      }
      c.goUnder = 0; // (up, its humps and head on the water: what the gun can reach); its head raised a third of the time
      if ((b.rearT = (b.rearT ?? rnd(2, 4)) - dt) <= 0) { b.rearT = rnd(2.5, 4.5); b.reared = !b.reared && simRand() < 0.6; }
      c.wantRear = b.reared ? 0.7 : 0;
      _hv.set(Math.sin(H.yaw) * H.speed, 0, Math.cos(H.yaw) * H.speed);
      if (d > C.keep[1]) steer.pursue(_w, c.pos, F, _hv, SP, 2); else if (d < C.keep[0]) steer.flee(_w, c.pos, F, SP * 0.7); else _w.set(0, 0, 0);
      steer.orbit(_o, c.pos, F, (C.keep[0] + C.keep[1]) / 2, b.dir, 1);
      steer.blend(c.want, [[_w, 1], [_o, d > C.keep[1] * 1.6 ? 0.2 : 1]], SP * 1.15);
      b.breath -= dt * (enraged(c.emo) ? 1.6 : 1);
      if (b.breath <= 0) {
        const m = pickMove(x, d);
        if (m && c.windUp(m, H)) { c.lastMove = m; b.breath = rnd(...C.breath) * (st(c, 'doubt') ? 1.6 : 1); if (m === 'dive') { b.underT = rnd(3, 6); b.dir = -b.dir; } }
        else b.breath = 0.5;
      }
      x.drives.add('rest', dt / 160);
      return 'run';
    },
  });
  act({
    id: 'flee', weight: 1.9,
    when: (x) => x.drives.get('fear') > C.fearFlees,
    consider: [(x) => norm(x.drives.get('fear'), C.fearFlees, 1)],
    enter: (x) => { x.c.goUnder = 1; x.bb.t = 0; },
    exit: (x) => { const f = x.mem.fact(x.P); if (f) f.grudge = Math.min(1, f.grudge + 0.4); }, // (it comes back for you)
    tick: (x, dt) => { const c = x.c; x.bb.t += dt; c.goUnder = 1; steer.arrive(c.want, c.pos, c.home, SP * 1.2, 10); return x.drives.get('fear') > C.fearFlees * 0.4 || x.bb.t < 10 ? 'run' : 'done'; },
  });
  act({
    id: 'stalk', weight: 1.2, cooldown: 4,
    when: (x) => { const f = x.mem.fact(x.P); return !!ship() && !!f && f.aware >= AWARE.SUSPECT * 0.6 && !foe(x) && distHome(x) < C.leash; },
    consider: [(x) => 0.4 + 0.6 * x.drives.get('curiosity')],
    enter: (x) => { x.bb.t = 0; x.bb.up = false; },
    tick: (x, dt) => {
      const c = x.c, f = x.mem.fact(x.P), b = x.bb; b.t += dt;
      if (!f || b.t > 25) return 'done';
      const d = hd(c.pos, f.pos);
      if (d > 70 && !b.up) { c.goUnder = 0.9; steer.arrive(c.want, c.pos, f.pos, SP, 10); return 'run'; }
      if (!b.up) { b.up = true; b.upT = 0; if ((c.askedT ?? -99) < x.now - 8) { c.askedT = x.now; glyph(x, 'ask'); } }
      b.upT += dt; c.goUnder = 0; c.wantRear = 0.8; c.want.set(0, 0, 0); // (up, its head out of the water, looking)
      return b.upT > 5 ? 'done' : 'run';
    },
  });
  act({
    id: 'investigate', weight: 0.9, cooldown: 3,
    when: (x) => !!x.mem.interest(),
    consider: [(x) => 0.3 + 0.7 * x.drives.get('curiosity')],
    enter: (x) => { x.bb.i = x.mem.interest(); x.bb.t = 0; },
    tick: (x, dt) => { const c = x.c, b = x.bb; b.t += dt; if (!b.i || b.t > 20) { x.mem.done(b.i); return 'fail'; } c.goUnder = 0.8; steer.arrive(c.want, c.pos, b.i.pos, SP * 0.8, 8); if (hd(c.pos, b.i.pos) < 12) { x.mem.done(b.i); x.drives.sat('curiosity', 0.4); return 'done'; } return 'run'; },
  });
  act({ id: 'go home', weight: 1.1, when: (x) => distHome(x) > C.roamR, consider: [(x) => norm(distHome(x), C.roamR, C.leash)], tick: (x) => { const c = x.c; c.goUnder = 0.6; steer.arrive(c.want, c.pos, c.home, C.roam * 1.6, 10); return distHome(x) < C.roamR * 0.5 ? 'done' : 'run'; } });
  act({
    id: 'roam', weight: 0.6, cooldown: 2, consider: [(x) => 0.35 + 0.4 * x.drives.get('curiosity')],
    enter: (x) => { x.bb.t = rnd(8, 16); x.bb.w = {}; x.bb.dive = simRand() < 0.35; },
    tick: (x, dt) => { const c = x.c; x.bb.t -= dt; c.goUnder = x.bb.dive ? 0.9 : 0.15; c.wantRear = 0; steer.wander(_w, x.bb.w, c.yaw, C.roam, dt, { jitter: 0.8, dist: 6, r: 3 }); steer.contain(_k, c.pos, c.home, C.roamR * 0.8, 1); steer.blend(c.want, [[_w, 1], [_k, 1]], C.roam * 1.3); return x.bb.t <= 0 ? 'done' : 'run'; },
  });
  act({
    id: 'bask', weight: 0.4, cooldown: 6, consider: [(x) => 0.4 + 0.6 * x.drives.get('rest')],
    enter: (x) => { x.bb.t = rnd(6, 12); },
    tick: (x, dt) => { const c = x.c; x.bb.t -= dt; c.goUnder = 0; c.wantRear = 0.7; c.want.set(Math.sin(c.yaw), 0, Math.cos(c.yaw)).multiplyScalar(0.8); x.drives.sat('rest', dt / 30); return x.bb.t <= 0 ? 'done' : 'run'; },
  });

  return {
    actions: A,
    drives: { fear: { fall: 1 / 25 }, curiosity: { rise: 1 / 70, start: [0.3, 0.6] }, rest: { rise: 1 / 600, start: [0, 0.2], trait: 'lazy' } },
    traits: { bold: [0.85, 1.25], lazy: [0.8, 1.3] },
    mods: () => undefined,
    /** A gun's report reaches it (an interest, kept by memory), or its own kind's death: a fright. */
    heard(c, s, reach) {
      if (s.kind === 'noise' && s.by === 'courier') { c.drives.add('curiosity', 0.2 * reach); c.brain.signal(); }
      if (s.kind === 'death' && s.source !== c && s.source?.kind === 'seaSerpent') c.drives.add('fear', 0.3 * reach);
    },
    /** What it watches: the ship, as the Courier sealed in at its helm, as loud as its sail (`SERPENT_MIND.loud`); ashore, nothing. */
    sees(c, out) {
      const H = ship(); if (!H) return out;
      out.push({ ent: g.player, kind: 'courier', pos: H.pos, vel: _hv.set(Math.sin(H.yaw) * H.speed, 0, Math.cos(H.yaw) * H.speed), loud: C.loud[H.throttle] ?? 1, height: 2.5, hidden: false });
      return out;
    },
  };
}
