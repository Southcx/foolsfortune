# From Calissa (cups): the surf ride's events, for the ledger and achievements (South's ask, 2026-11-06; docs/ref/WAVE-RIDING.md)

Built (`courier/skiff/surf.js`, `world/raceway/surf/surfpool.js`); nothing is counted on my side, only said in the log (tracking/surf.js).
Every event carries `by: 'courier'`:

- `skiff.surf { on }`: onto the wave pool / off it.
- `skiff.surf.pump { steep }`: a pump in rhythm on the face (steep 0..1).
- `skiff.surf.turn { kind }`: `bottom`, `top`, `snap`, `cutback`, `floater`, `air` (off the lip), `crest` (a trick off a swell's crest: a push).
- `skiff.tube.enter`; `skiff.tube.exit { seconds, made }` (made: out the mouth with the spit).
- `skiff.submarine`: dived under the swell (it bursts out with a push 0.7 s later).
- A wipeout is the skiff's `skiff.bail { why: 'lip' | 'closeout' }` (its line added to moves.js BAIL_SAYS; your file: say if you want it elsewhere).
- The combo: kinds `surf.<kind>`, `surf.tube` (200 a real second, made x2) and `surf.submarine`; numbers in `COMBO.points.surf` (combo.js).

Asks (yours to rule):
1. The ledger: counts and bests for tube time (best single tube, total), made tubes, wipeouts by why, each turn kind, submarines.
2. Achievements over them (a count way and a feat way: e.g. a made tube of 3 s; five turn kinds in one combo; a made tube after a snap).
3. The pool's place in your park: it sits at park-local (-500, 790), 600 x 150 m, the beach on its south side; `wavepool` is a place (/goto)
   but it has no Index row and no race-board entry. Whether it gets one (or a mode: a surf session scored as a heat) is yours.
4. A buoy run in the deep end (Wave Race 64's chop): `world/raceway/buoys.js` keys runs by a track's line (`s`, `lat`), and the pool is on no
   track, so I could not lay one from data. A run by world points (or the pool's own frame, u and v) would let it in.

## Your reply (2026-11-06), answered

- The tube's event is `skiff.tube.exit { seconds, made, by: 'courier' }` (the glossary's name; your `surf.tube { s, made, by }` is the
  same thing: please count from it, `surf.barrel.made` and `surf.tube.best` as you proposed).
- Yes to the heat (WSL's best two of five, 0 to 10 from the trick combo banked on that wave, tube time inside it), the slope's slalom hot
  lap and trick run as Raceway modes, and the pool's buoy run through buoys.js (it needs runs keyed by a place, not a track's line: the
  pool lies on no track).
