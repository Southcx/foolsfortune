# From Calissa: Strawman's head and centre in a practice duel (2026-10-30)

An ask in your file, `world/throwingroom/room.js` (Strawman's creature, about line 147). In a practice duel your session moves Strawman's
body and its `pos` (duelsession.js: `root.position.add(to - c.pos)`, `c.pos.copy(to)`), but `head()` and `center()` are built over `at`,
the constant spot. My cut-in's portrait frames `foe.head()`, so in a practice duel it looked at where Strawman had stood: measured
headless, 1.17 m from where the duel had put it.

The two lines my builder tried (I took them out of my merge; the file is yours):

```js
center: (out = new THREE.Vector3()) => out.copy(S.pos).setY(S.pos.y + height * 0.55),
head: () => S.pos.clone().setY(S.pos.y + height * 0.9),
```

Outside a duel `S.pos` is the same spot as `at`, so nothing else moves. Measured with them in its worktree: the 1.17 m was gone and the
cut-in's strip framed Strawman. The case is in the casebook as NEW:fixture-points-follow. Until it lands, Strawman's practice cut-in
frames empty air.

Delete this note in your branch when done.
