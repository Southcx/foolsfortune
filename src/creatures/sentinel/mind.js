// ---------------------------------------------------------------------------------------
// THE SENTINEL'S MIND: what rejection's antibody wants and does, as the AI parts put it (creatures/ai/, docs/AI.md). Its body carries
// it out (for now the Lantern Wisp's: wisp/lanternwisp.js, its windUp and its moves).
//
// WHAT IT DOES (scored by the reasoner, utility.js)
//   what is done to it   stunned, asleep, melted: these overrule everything
//   guard                only what struck it (a grudge on the Courier or a creature): it keeps 7 m off, circling, and casts its flame
//   mend                 to the nearest warp mark (rejection's: where the god hand worked the island), and there wears the hand's
//                        creations back into the island's matter (creations.erode), the island's dissonance falling (SENTINEL.mend)
//   settle               nothing left to mend and no one to guard against: it waits, then sinks back into the island (vanish, 'settled')
// It never hunts for its own sake: the Courier is neutral to it until a blow (ecology's own exception, c.rel, is not needed: no grudge,
// no guard).
//
// Prior art: the slip jelly's and the Lantern Wisp's minds (their status acts and the wisp's keep-and-cast hunt, kept smaller);
// the white blood cell's homing on the damage, not the host.
//
//   sentinelMind(game, SENTINEL) -> { actions(W) }  (W: the body's module, game.wisps)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { st } from '../creatures.js';
import { steer } from '../ai/index.js';
import { stream } from '../../core/rng.js';
const simRand = stream('creatures/sentinel/mind'); // (the simulation's chance: core/rng.js)

const _w = new THREE.Vector3(), _o = new THREE.Vector3();
const rnd = (a, b) => a + simRand() * (b - a);
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const M = { speed: 2.2, travel: 1.8, keep: 7 };

export function sentinelMind(g, S) {
  /** What struck it, still fresh: a fact with a grudge, aware and seen in the last 8 s. */
  const foe = (x) => {
    let best = null, bs = 0;
    for (const f of x.mem.facts.values()) {
      const e = f.ent; if (!e || e === x.c || e.alive === false || f.grudge < 0.3 || f.aware < 0.4) continue;
      if (x.now - Math.max(f.seenAt, f.heardAt) > 8) continue;
      const s = f.grudge / (1 + hd(f.pos, x.c.pos) * 0.05); if (s > bs) { bs = s; best = f; }
    }
    return best;
  };
  const marks = () => g.rejection?.marks || [];
  const nearest = (x) => { let b = null, bd = Infinity; for (const m of marks()) { const d = hd(m.at, x.c.pos); if (d < bd) { bd = d; b = m; } } return b; };

  return {
    actions(W) {
      const A = [];
      const act = (a) => { A.push(a); return a; };
      for (const [id, s] of [['stunned', 'stun'], ['asleep', 'sleep'], ['melted', 'melt']]) act({ id, weight: 5, urgent: true, when: (x) => st(x.c, s) > 0, tick: (x) => { x.c.pose = s; x.c.want.set(0, 0, 0); return st(x.c, s) > 0 ? 'run' : 'done'; } });
      act({
        id: 'guard', hunt: true, weight: 1.8, cooldown: 1,
        when: (x) => !st(x.c, 'calm') && !st(x.c, 'charm') && !!foe(x),
        consider: [() => 0.9],
        lock: (x) => !!x.c.attack,
        enter: (x) => { x.c.foe = foe(x)?.ent ?? null; x.c.cd = rnd(0.8, 1.4); },
        exit: (x) => { x.c.foe = null; },
        tick: (x, dt) => {
          const c = x.c, f = foe(x);
          if (!f) return c.attack ? 'run' : 'done';
          const F = x.now - f.seenAt < 1 ? f.ent.pos : f.pos, d = hd(c.pos, F);
          c.pose = 'fight'; c.face = F; c.calmT = 0;
          if (!c.attack) {
            if (d > M.keep + 2) steer.seek(_w, c.pos, F, M.speed); else if (d < M.keep - 2) steer.flee(_w, c.pos, F, M.speed); else _w.set(0, 0, 0);
            steer.orbit(_o, c.pos, F, M.keep, c.id % 2 ? 1 : -1, 0.9);
            steer.blend(c.want, [[_w, 1], [_o, 1]], M.speed);
            c.cd -= dt;
            if (c.cd <= 0 && x.now - f.seenAt < 0.6 && d > 3 && d < 20) { W.windUp(c, 'cast', f.ent); c.cd = rnd(2.4, 3.6); }
          } else c.want.set(0, 0, 0);
          return 'run';
        },
      });
      act({
        id: 'mend', weight: 1.4,
        when: (x) => marks().length > 0,
        consider: [() => 0.85],
        enter: (x) => { x.bb.m = nearest(x); x.bb.t = 0; if (x.bb.m && !x.bb.m.sought) { x.bb.m.sought = true; g.events?.emit('sentinel.seek', { by: 'environment' }); } },
        tick: (x, dt) => {
          const c = x.c, m = x.bb.m; x.bb.t += dt;
          if (!m || !marks().includes(m) || x.bb.t > 40) return 'fail';
          c.pose = 'drift'; c.calmT = 0;
          steer.arrive(_w, c.pos, m.at, M.travel, 1.5); c.want.copy(_w);
          if (hd(c.pos, m.at) > S.reach) return 'run';
          const R = g.rejection, out = g.creations?.erode?.(m.at, S.wear);
          const i = R.marks.indexOf(m); if (i >= 0) R.marks.splice(i, 1);
          R.dissonance = Math.max(0, R.dissonance - S.mend);
          c.mended = (c.mended || 0) + 1;
          g.events?.emit('sentinel.mend', { volume: +(out?.volume || 0).toFixed(2), last: R.marks.length === 0, ground: S.ground(), by: 'environment' });
          return 'done';
        },
      });
      act({
        id: 'settle', weight: 0.5, consider: [() => 0.8],
        tick: (x, dt) => {
          const c = x.c; c.pose = 'idle'; c.want.set(0, 0, 0);
          c.calmT = (c.calmT || 0) + dt;
          if (c.calmT > S.settle) { W.vanish(c, 'environment', c.mended ? 'settled' : 'driven'); return 'done'; }
          return marks().length || foe(x) ? 'done' : 'run';
        },
      });
      return A;
    },
  };
}
