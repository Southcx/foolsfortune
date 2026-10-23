// ---------------------------------------------------------------------------------------
// MANIFESTATION'S GOD POWERS (docs/plans/GODHAND.md section 8), as handlers for the runner (godhand/powers.js). Sculpt itself is one of
// the matter's verbs (godhand/matterarts.js).
//   SET     press on a creation: it is set where the hand is (set fast, set in stone), and the mending leaves it alone for a while; at 99,
//           for good (kept in the save: godhand/creations.js). Paid in Lachryma by how much it sets. On Anagami it looks like a firing;
//           each island dresses it its own way (docs/plans/REGISTERS.md, the owner's ruling: the mechanic's name is the psyche's).
//   TOTEM   press: a standing stone is raised, and the last miracle you called holds its weather round it for a while (its feeling must
//           be known, and the miracle is paid as a small one). A few at a high level.
// Prior art: Black & White 2's buildings that hold a miracle's influence; a thought set in stone; the kiln (a fired pot stands where a green one slumps).
// ---------------------------------------------------------------------------------------
import { MIRACLES, SET_FOREVER } from '../../progress/godpowers.js';

const SET_COST = 6; // (Lachryma a chunk set)

export const MAKE = {
  setfast: {
    begin(P, L) {
      const g = P.game, C = g.creations; if (!C) return false;
      const forever = (g.psyche?.level?.('manifestation') ?? 1) >= SET_FOREVER, r = P.ramp('setfast', 'r');
      const want = C.setFast(L.a, r, 0, false, true); if (!want) return false;
      if (!g.lachryma.spend(SET_COST * want, 'god')) { g.log.say('warn', 'Not enough Lachryma to set it.', { key: 'setfast.pay', throttle: 2 }); return false; }
      const n = C.setFast(L.a, r, P.ramp('setfast', 'hold'), forever);
      P.ring(L.a, r, P.domainColour('setfast'), 0.8);
      P.emit('setfast', { chunks: n, forever });
      return false;
    },
  },

  totem: {
    begin(P, L) {
      const g = P.game, Mi = P.god.miracles, feeling = Mi?.last;
      if (!feeling || !Mi?.known(feeling)) { g.log.say('warn', 'Call a miracle first: a totem holds the last one.', { key: 'totem.none', throttle: 2 }); return false; }
      const M = MIRACLES[feeling]; if (!g.lachryma.spend(M.cost[0], 'god')) { g.log.say('warn', 'Not enough Lachryma for the totem.', { key: 'totem.pay', throttle: 2 }); return false; }
      P.cap('totem', Math.round(P.ramp('totem', 'n')));
      const at = L.a.clone(), dur = P.ramp('totem', 'dur');
      g.creations?.raise('pillar', at, null, { r: 0.35, h: 1.8 });
      const look = g.godhandLooks?.totem(at, feeling, P.domainColour('totem')); // (its band in the feeling: vfx/godhand/marks.js)
      const m = { feeling, kind: 'miracle', x: at.x, y: at.y, z: at.z, r: P.ramp('totem', 'r'), dur, t: 0, tick: 0, every: 0, totem: true };
      Mi.begin(m);
      P.keep({ id: 'totem', tick: () => m.t >= m.dur || !Mi.live.includes(m), dispose() { look?.userData.dispose(); const i = Mi.live.indexOf(m); if (i >= 0) Mi.end(i); } });
      P.emit('totem', { feeling });
      return false;
    },
  },
};
