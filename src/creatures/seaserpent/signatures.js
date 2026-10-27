// ---------------------------------------------------------------------------------------
// THE SEA BEASTS' SIGNATURE MOVES THAT HOLD THE SHIP (docs/plans/OPEN-SEA.md 14.3; Dovina's rows, progress/opensea/seabeasts.js): the moves
// a chain-bodied beast (seaserpent.js's chassis) makes past a ring and a blow, each held a while round the ship and ended by its answer.
//   circle      Jormungandr's: its body run round the ship at `r` for the move's `hold`; any of it at the surface touching the hull is a
//               ram (one hit each `every` real s); where it dives the ring is open. Answered by reading where it goes under.
//   coilWorld   Jormungandr's last phase: a ring laid round where the ship is, closing from `r0` to `r1` over the move's `hold`, the
//               head running round it; the ship outside it as it runs is free (`escape`), inside at the end takes the move's hits; the
//               head shot for `breaks` while it closes breaks it (its head at the peak).
// Each is { wind(S, c, m, target), tick(S, c, dt) (the windup), hold(S, c, dt) (after it: `c.held`), struck(S, c, dmg), end(S, c, why) }.
// `c.held` is { move, t, hold, centre, r, ... }: the body draws the ring from its centre and r (vfx/opensea/beasts/).
// The breach (the akhlut's) is the ram led further ahead (seaserpent.js `windUp`); the umibozu's grip and the kraken's arms wait for their
// bodies. Prior art: Shadow of the Colossus's Phalanx and Monster Hunter's Dalamadur (a body that is the arena), Sea of Thieves' Megalodon.
//
//   SIGNATURES[move]   SIGNATURE (their numbers)
//   events: seaserpent.move { id, move, hit, by } (via S.finish), seaserpent.free { how: 'escape' | 'shot' | 'time', by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** circle: the ring's radius round the ship (m), how near the hull a surfaced part touches it (m), real s between two of its hits;
 *  coilWorld: the ring's first and last radius (m), the head's damage that breaks it, how far past it the hull is free (m). */
export const SIGNATURE = { circle: { r: 125, touch: 2, every: 2 }, coilWorld: { r0: 120, r1: 15, breaks: 12, margin: 4 } };
const _a = new THREE.Vector3();
const ship = (S) => (S.game.opensea?.sailing ? S.game.opensea.helm : null);

/** The head run round `centre` at `r`, the way it already turns (`dir`). */
function orbit(c, centre, r, dir, speed) {
  const a = Math.atan2(c.pos.x - centre.x, c.pos.z - centre.z) + dir * 0.35;
  _a.set(centre.x + Math.sin(a) * r - c.pos.x, 0, centre.z + Math.cos(a) * r - c.pos.z);
  const d = _a.length(); c.want.copy(_a).multiplyScalar(d > 1e-3 ? speed / d : 0);
}

export const SIGNATURES = {
  circle: {
    wind(S, c, m, T) {
      c.goUnder = 0.6; c.wantRear = 0;
      S.game.creatures.windup(c, { at: T, radius: SIGNATURE.circle.r, eta: c.attack.t, kind: 'circle', parry: false, read: false });
    },
    tick(S, c, dt) {
      const A = c.attack, H = ship(S); if (H) orbit(c, H.pos, SIGNATURE.circle.r, 1, c.row.speed);
      if (A.t > 0) return;
      c.attack = null; S.game.creatures.unwind(c);
      c.held = { move: 'circle', t: c.row.moves.circle.hold, hold: c.row.moves.circle.hold, centre: (H ? H.pos : c.pos).clone(), r: SIGNATURE.circle.r, dir: c.id % 2 ? 1 : -1, hitT: 0 };
    },
    hold(S, c, dt) {
      const Hd = c.held, H = ship(S); Hd.t -= dt; Hd.hitT -= dt;
      if (!H || Hd.t <= 0) return this.end(S, c, 'time');
      c.goUnder = 0; Hd.centre.copy(H.pos); orbit(c, H.pos, SIGNATURE.circle.r, Hd.dir, c.row.speed); // (the ring follows the ship: the body reads Hd.centre and Hd.r)
      if (Hd.hitT > 0) return;
      for (let i = 0; i < c.N; i++) { // (a part of it up and against the hull: crossing its ring is a ram)
        if (!S.exposed(c, i)) continue;
        if (H.hullDist(S.at(c, i)) <= S.rOf(c, i) + SIGNATURE.circle.touch) { Hd.hitT = SIGNATURE.circle.every; S.finish(c, 'ram', true); return; }
      }
    },
    end(S, c, why) { if (!c.held) return; c.held = null; S.game.events?.emit('seaserpent.free', { how: why, by: 'creature' }); },
  },
  coilWorld: {
    wind(S, c, m, T) {
      c.goUnder = 0; c.wantRear = 0.5;
      S.game.creatures.windup(c, { at: T, radius: SIGNATURE.coilWorld.r0, eta: c.attack.t, kind: 'coilWorld', parry: false, area: { shape: 'circle', radius: SIGNATURE.coilWorld.r0, at: 'courier' }, type: 'impact', answer: 'out' });
    },
    tick(S, c, dt) {
      const A = c.attack, H = ship(S); if (H) orbit(c, H.pos, SIGNATURE.coilWorld.r0, 1, c.row.speed * 1.2);
      if (A.t > 0) return;
      c.attack = null; S.game.creatures.unwind(c);
      c.held = { move: 'coilWorld', t: c.row.moves.coilWorld.hold, hold: c.row.moves.coilWorld.hold, centre: (H ? H.pos : c.pos).clone(), r: SIGNATURE.coilWorld.r0, dmg: 0, dir: 1 };
    },
    /** The ring now: its radius from r0 to r1 as the hold runs out. */
    radius(Hd) { const W = SIGNATURE.coilWorld, k = 1 - Hd.t / Hd.hold; return W.r0 + (W.r1 - W.r0) * k; },
    hold(S, c, dt) {
      const Hd = c.held, H = ship(S), W = SIGNATURE.coilWorld; Hd.t -= dt;
      const r = (Hd.r = this.radius(Hd)); c.goUnder = 0; c.wantRear = 0.6; orbit(c, Hd.centre, r, Hd.dir, c.row.speed * 1.4);
      if (!H) return this.end(S, c, 'time');
      if (Math.hypot(H.pos.x - Hd.centre.x, H.pos.z - Hd.centre.z) > r + W.margin + (H.look?.length ?? 7) / 2) return this.end(S, c, 'escape');
      if (Hd.t > 0) return;
      c.held = null; S.finish(c, 'coilWorld', true); // (closed with the ship inside: the move's hits, seafight.js)
    },
    struck(S, c, dmg) { const Hd = c.held; if ((Hd.dmg += dmg) >= SIGNATURE.coilWorld.breaks) { c.held = null; S.game.events?.emit('seaserpent.free', { how: 'shot', by: 'courier' }); } },
    end(S, c, why) { if (!c.held) return; c.held = null; S.game.events?.emit('seaserpent.free', { how: why, by: why === 'escape' ? 'courier' : 'creature' }); },
  },
};
