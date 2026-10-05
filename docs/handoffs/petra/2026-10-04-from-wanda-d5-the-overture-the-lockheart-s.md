**2026-10-04, from Wanda (R43: D5, the overture, the Lockheart's cues, Round 40, B5)**
- **The rhythm mode wants a stage in a room** (D5; `game.rhythm`, `src/music/rhythm/`). F at it calls `game.rhythm.begin(trackId, level)`
  (`TRACKS` from `rhythm.js` for a menu; levels `light`, `steady`, `full`). It takes the digit keys itself (a capture listener: the field
  never sees 1 to 0 while it plays) and Esc ends it; the place's music stands aside (`choose.js`). Two things are yours: hold the
  Courier still while `game.rhythm.active` (as the dialogue does), and the room. `/rhythm [track] [level]` is a director's command for
  now (keep or drop it when the stage stands); `/rhythm offset <ms>` sets the judging's offset.
- **B5, one line in `creatures.strike`:** beside `g.vfx?.hit({ ..., type })`, add `sfx.damage?.(type, Math.min(1, power))` (the blow's
  type heard over its hit, `src/audio/damage.js`). The same in `breakables.damage` and `clappers.hit` if they take a type. And when a
  creature's mind crosses into Prismatic, `sfx.prismatic?.(k)` (k 0..1, how far), or an event (`creature.mind { kind, state, by }`)
  and I'll give it a rule. Annihilation already sounds (`combat.annihilate`, `src/audio/cues.js`).
- **Round 40's sounds are in**, through the event table (`src/audio/cues.js`): `vessel.shield`, `vessel.shieldbreak`, `courier.shatter`,
  `courier.reform`, `vessel.refire`, `lockheart.ultimate.end`. They sit over your placeholders (the cracks and the burst at the
  shatter fit under them); drop a placeholder where it now doubles, if you hear one.
- **The Opening has its cue** (`src/music/lockheart.js`, chosen in `choose.js` from `game.ultimate.phase` and the coffin's mode): its
  mode's cue from the invocation through the wheel, its landing cut in when the wheel lands. `ultimate.js`'s `music.duck(12, 0.12)` at
  `begin` now only takes the place's music out of the way, which is still right.
- The arranger learned `then` (a score hands on to the next on the bar line) and `lead`, `fadeIn`, `cut` (a cue that must land on a
  moment); `src/music/rock.js` is the band's rock rig. Build, check, stress (below), driven headless.
- **Perf, for the gate:** draw calls, triangles, tick and draw are unchanged. The heap reads 270 to 277 MB here against the 235
  baseline (over its 12%), but the default branch itself reads 250 to 269 on this machine (four runs), so the measure moves about 20 MB
  run to run. Bisected without a culprit: the branch with the rhythm mode not imported still read 271, and nothing new allocates at
  boot (a note chart is built only on `begin`). It may cost about 10 MB, unexplained; please measure it on yours.
