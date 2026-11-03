// ---------------------------------------------------------------------------------------
// A SONG FOR THE WIND (docs/plans/OPEN-SEA.md 15.6, built; GAPS.md G160): the Crucibelle played at the helm in a three-note phrase calls the
// wind to blow one of four ways for a game hour, at a cost from the pool. Sailing's one real decision is the heading against the wind
// (wind.js); a song moves the wind instead of the ship, and teaches the same lesson from the other side: a wind from where you are
// going is no help, a wind behind you is a gift. The phrase is the lesson in music too: the notes climb for the way the wind will blow
// toward the Chaos end (east) and fall for the Law end (west), as the Crucibelle's scale climbs.
//
// WHAT IT COSTS AND WHAT IT IS WORTH (every number answers to the aim, ECON.perMinute):
//   worth      a song at best turns the hour's wind dead astern: the sail then carries up to `save` (0.8) of every square's burn
//              (wind.js). A sloop crosses about 3.75 squares a game hour (a square 40 real s, a game hour 150), a square burns 0.35 measures
//              of 0.8 minutes at the aim (2.24 cubes), so a wholly fair hour spares at most 3.75 x 2.24 x 0.8 = about 6.7 cubes, and an ordinary
//              hour's wind would have spared a third of that anyway. The song is worth under a minute of play: a convenience and a
//              lesson, never a faucet (the price is the pool, not cubes: nothing to pay it back).
//   cost       `cost` of the pool's whole (0.4): a song sung twice in a row leaves the ship's gun and its mounts dry; the pool regenerates
//              in play, so the cost is the fight you cannot then take.
//   hour       it sets the wind for `hours` game hour (150 real s); a new song may not be sung until `rest` game hours from the first.
//   strength   the called wind blows at least `floor` (0.6) of a gale (a sail fills): never past the gale, never dead.
//   opened     by playing the sea: `open.count` squares charted, or `open.feat` fair squares (a square sailed with the sail carrying
//              0.6 of it or more, `sea.sail.fair`: a wind used well); the same rule as any art (a count way and a feat way).
//
// Prior art: The Legend of Zelda: The Wind Waker's Wind's Requiem (the Wind Waker, a conductor's baton: a three-note song turns the
// wind to the way you choose), Ocarina of Time's songs as spells with a cost of attention, real sailors whistling for the wind.
//
//   SONGS[id] = { name, to, notes }   songOf(notes) -> id | null   called(base, id) -> wind   WINDSONG { cost, hours, rest, floor, gap, open }
//   songOpen(L) -> bool   costOf(poolMax) -> pool   after(state, hour) / ready(state, hour)   (the rest is the room's: world/opensea/seafolds.js)
// ---------------------------------------------------------------------------------------
/** to: the yaw the wind blows toward as the helm keeps them (forward is (sin yaw, cos yaw): east +x, the Chaos end; north -z); notes: the
 *  Crucibelle's degrees 1..5 (crucibelle.note { degree }). Plain names until the owner calls it final. */
export const SONGS = {
  east:  { name: 'Wind to the Chaos end', to: Math.PI / 2, notes: [1, 2, 3] },
  west:  { name: 'Wind to the Law end', to: -Math.PI / 2, notes: [3, 2, 1] },
  north: { name: 'Wind to the north', to: Math.PI, notes: [1, 3, 5] },
  south: { name: 'Wind to the south', to: 0, notes: [5, 3, 1] },
};
/** cost: the share of the pool's max; hours: how long the wind holds (game hours); rest: game hours from a song to the next; floor: the
 *  called wind's least strength; gap: real s a note may wait for the next of its phrase; open: the count way and the feat way. */
export const WINDSONG = { cost: 0.4, hours: 1, rest: 2, floor: 0.6, gap: 4, open: { count: 20, feat: 12 } };

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** The song a phrase of degrees is (the last three of them), or null. */
export function songOf(notes) {
  const n = (notes || []).slice(-3); if (n.length < 3) return null;
  return Object.keys(SONGS).find((id) => SONGS[id].notes.every((d, i) => d === n[i])) ?? null;
}

/** The wind a song calls over the hour's own: it blows toward the song's way, at least `floor` strong (a front's gale stays a gale). */
export function called(base, id) {
  const S = SONGS[id]; if (!S) return base;
  return { to: wrap(S.to), from: wrap(S.to + Math.PI), k: Math.max(base.k, WINDSONG.floor) };
}

/** Whether the song is opened by the ledger: a count of squares charted, or a wind used well. */
export const songOpen = (L) => (L?.get?.('sea.chart') || 0) >= WINDSONG.open.count || (L?.get?.('sea.sail.fair') || 0) >= WINDSONG.open.feat;

/** The pool a song asks, of a pool whose max is `max`. */
export const costOf = (max = 100) => Math.round(WINDSONG.cost * max);

/** The state after a song at game hour `hour`: { song, until, rest } (the room keeps it; nothing here is saved, a song is for the hour). */
export const after = (id, hour) => ({ song: id, until: hour + WINDSONG.hours, rest: hour + WINDSONG.rest });
/** Whether a song may be sung at `hour` given the state of the last. */
export const ready = (state, hour) => !state || hour >= state.rest;
/** Whether a state's song is still blowing at `hour`. */
export const blowing = (state, hour) => !!state && hour < state.until;
