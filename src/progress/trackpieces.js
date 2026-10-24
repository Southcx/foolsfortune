// ---------------------------------------------------------------------------------------
// THE TRACK EDITOR'S PALETTE (docs/plans/TRACK-EDITOR.md 3, 12): what the hand raises on a made track besides its line and its traps. Each
// piece IS one of the house's own track features (world/raceway/track.js FEATURES: the Sun Circuit's kickers, side ramps, whoops, bowls,
// glide lips, sun plates, vein lanes, geysers, rails and rings; and the kit's columns, walls and arches), so a made track is built, ridden,
// raced and dressed by the same code as the park's tracks, and anything the park learns (a look of Calissa's, a rival's line round a rail)
// a made track has too. A piece is placed on the line by `u`, its share of the line's length from the start (it slides with the line as
// the line is edited), and `lat`, metres right of the line; a SPAN piece (whoops, a bowl, a glide lip, a rail) takes a second click, its
// end (`u2`, `lat2`). Each is made with a god power and open when that power is yours (the editor grows with your domains). Sizes are the
// park's own, so a made kicker is the Sun Circuit's kicker.
//
// Prior art: Trackmania's blocks and Hot Wheels Unleashed's pieces (a kit of shapes, each one job); ModNation Racers' props; the house's
// own track features, which this list only names for the hand.
//
//   PIECES[kind] = { label, line, power, cost, span?, feature: (P, at, at2) -> [list, entry] }   PIECE_KINDS   featureOf(P, L) -> [list, entry]
// ---------------------------------------------------------------------------------------

/** The kit. `power`: the god power that makes it (progress/godpowers.js); `cost`: of the track's budget; `feature`: the house feature it
 *  is, given its place in metres along the line (`at`, and `at2` for a span, never before `at`). */
export const PIECES = {
  kicker: { label: 'Kicker', line: 'A lip across the whole track: a pop off it goes high.', power: 'sculpt', cost: 3, feature: (P, at) => ['kickers', { cp: 0, at, h: 2.4, len: 9 }] },
  ramp: { label: 'Side ramp', line: 'A kicker over part of the track: taking it is a choice.', power: 'sculpt', cost: 3, feature: (P, at) => ['ramps', { cp: 0, at, lat: P.lat, w: 3.5, h: 2.6, len: 10 }] },
  whoops: { label: 'Whoops', line: 'A run of crests: pump them, or hop them.', power: 'shape', cost: 4, span: true, feature: (P, at, at2) => ['whoops', { from: [0, at], to: [0, at2], h: 2.2, wave: 22 }] },
  bowl: { label: 'Bowl', line: 'A stretch banked steep: lean on its wall.', power: 'shape', cost: 3, span: true, feature: (P, at, at2) => ['bowls', { from: [0, at], to: [0, at2], bank: 0.75 }] },
  lip: { label: 'Glide lip', line: 'Air over this stretch opens the glide by itself.', power: 'gust', cost: 3, span: true, feature: (P, at, at2) => ['glideLips', { cp: 0, from: at, to: at2 }] },
  plate: { label: 'Boost pad', line: 'A sun plate: a flare\'s push for free.', power: 'manifest', cost: 2, feature: (P, at) => ['plates', { cp: 0, at, lat: P.lat, len: 7, w: 2.6 }] },
  lane: { label: 'Recharge strip', line: 'A vein lane: ride it and the pool refills.', power: 'transmute', cost: 3, feature: (P, at) => ['lanes', { cp: 0, at, lat: P.lat, len: 45, w: 2.4 }] },
  geyser: { label: 'Geyser', line: 'A slip geyser: it throws the board high on its cycle.', power: 'scoop', cost: 4, feature: (P, at) => ['geysers', { cp: 0, at, lat: P.lat }] },
  rail: { label: 'Rail', line: 'A ruin\'s lintel along the line: grind it.', power: 'sculpt', cost: 4, span: true, feature: (P, at, at2) => ['rails', { from: [0, at, P.lat], to: [0, at2, P.lat2 ?? P.lat], lift: 1.6, along: true, clear: 0.9 }] },
  ring: { label: 'Sun ring', line: 'A ring in the air: fly through it for a push.', power: 'manifest', cost: 2, feature: (P, at) => ['rings', { cp: 0, at, lat: P.lat, over: 4.5 }] },
  column: { label: 'Column', line: 'A standing stone to weave round (a near miss past it counts).', power: 'sculpt', cost: 2, feature: (P, at) => ['columns', { cp: 0, at, lat: P.lat }] },
  wall: { label: 'Wall', line: 'A clay wall across part of the track: a lane closed.', power: 'manifest', cost: 3, feature: (P, at) => ['walls', { cp: 0, at, lat: P.lat, w: 4 }] },
  arch: { label: 'Arch', line: 'Two posts and a lintel: thread it.', power: 'sculpt', cost: 4, feature: (P, at) => ['arches', { cp: 0, at, lat: P.lat, w: 5 }] },
};
export const PIECE_KINDS = Object.keys(PIECES);

/** A piece as the house feature it is on a line `L` metres long: its list in `features` and its entry. A span's end is taken forward
 *  round the lap from its start (a span may cross the line). */
export function featureOf(P, L) {
  const K = PIECES[P.kind]; if (!K) return null;
  const at = P.u * L; let at2 = (P.u2 ?? P.u) * L; if (at2 < at) at2 += L;
  return K.feature(P, at, at2);
}
