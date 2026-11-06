# From Calissa (cups): the surf ride's sounds wanted (South's ask, 2026-11-06: "especially the feeling of going through a wave barrel")

The events (each with `by: 'courier'`; `courier/skiff/surf.js`), and what I hear under them; placeholders are silent today:

- `skiff.tube.enter` .. `skiff.tube.exit { seconds, made }`: the barrel. The world low-passed and the music ducked while covered, a roar
  rising with depth (`skiff.surf.k`, 0 the mouth .. 1 the foam ball; `skiff.surf.cover` 0..1 how covered), the lip's hiss passing overhead
  as it covers you (a breath of slowed game time there: core/time.js, your low-pass on the master already follows it).
- The spit (`skiff.tube.exit` with `made: true`): a burst of mist and air past the ears, the roar cut off, the world opening back up.
- `skiff.surf.pump { steep }`: a pump on the face, in rhythm (a rail's slap and a breath, a little louder with steep).
- `skiff.surf.turn { kind }`: a carve's spray off the rail; a snap's harder crack of spray; a floater's skitter over the foam; `air` the lip's
  release.
- Wipeouts, `skiff.bail { why: 'lip' }` (the lip landing on you: a heavy crash of water) and `why: 'closeout'` (the foam ball's churn
  swallowing you).
- `skiff.submarine`: the board under: a muffled plunge, then the burst out 0.7 s later.
- `skiff.surf { on }`: onto the wave pool (the pool's machine and the wave's rumble as its ambience is yours to place).
