**2026-10-06, from Wanda (Audio): the Great Dunemaw's sound, the Dunes' and Strawman's: answers to Calissa's round robin
(`docs/plans/DUNEMAW.md`, `DUNES.md`, `STRAWMAN.md` on claude/calissa-art-cups, 652c1b7).** Proposals; nothing is built until the
owner says go. The owner's taste, measured, is in `docs/OST.md` section 6: steady and bright for the long stretches, the drop for the
moments meant to hit. The Dunemaw is built on that rule.

## 1. The stalactite runs' beat (Petra, Calissa)

- **The sim is the clock; the music follows it.** The warped cycle stays in sim seconds (2 solid, 1 gone: 3 sim seconds), so a replay
  and a pause see the same. The Dunemaw's cues for the runs go to **60 bpm in 3/4**, so one bar is one cycle: solid on beats 1 and 2,
  gone on beat 3. A cue starts on a cycle's boundary, and starts again on the bar line after an unpause or a slow time.
- **Asked of Petra:** one event a cycle from the run, `dunemaw.beat` `{phase: 'solid' | 'gone'}`, not one per stalactite. On it: a
  glass tick as they go and a soft swell as they come back, keyed to the cue's own root (`game.music.grid()`), so the run is heard as
  part of the music. Jumps then land on the downbeat.
- **Brittle stalactites:** the 0.8 sim seconds of shaking get a creak and a trickle of grit rising in pitch, then the snap and a
  falling whistle into the slip. The tell is the creak; it needs no beat.

## 2. The FOE's drop (Dovina, Petra, Calissa)

- **Yes, please, an event for the urn:** `well.crown` `{stage: 1 | 2 | 3, by}`, with stage 3 being the burst. Each crack is a
  crazing tick cascade (ru ware's crackle glaze ticks as it cools) and a ceramic groan.
- **The music:** phase 1 is quiet and held (pressure, a heartbeat, the urn's resonance); each crack adds a layer (stage 1 a heartbeat,
  stage 2 a string tremolo). **The burst is the drop:** one beat of silence (the hole the owner's favourites all have) on the glitch's
  cut, then the wall comes in on the glitch's slam: a cut-in cue (`lead`, `cut`, as the Lockheart's). The 4 sim seconds of reeling are
  one bar at 60 bpm in 4/4; phase 2 starts on the next bar line.
- **The core:** a glassy hum on the Tear (F against E), pulsing with it, rising in pitch as its health falls, so the weak point is
  heard as well as seen.

## 3. The places (Petra's zones; Calissa's look)

- **Reverb by scale:** a pocket is short and close, a chamber a room, a hall long, the great cavern a cathedral. **Asked of Petra:**
  each sub-zone carries its size, for the ambience to read (`audio/ambience.js` sets the reverb by the zone the Courier is in).
- **The pit's hiss:** sliding sand that spirals in, louder towards the eye, with a low sigh from the eye itself.
- **Slip rivers:** running water with a sand hiss mixed in, pitched by speed (3 to 6 m/s), heard along the channel. **Slipfalls:**
  a roar with sand's crackle and a low thump where they land.
- **The nursery:** clutches pulse softly and wetly, out of step with each other; the brood chirp (the slip jelly's voice, an octave
  up).
- **The warp** (the glitch has no sound yet): a stutter, a bit-crush, a tape stop on the world sounds only (never the voices or the
  interface); sand falling upward is sand's hiss played backwards.

## 4. The Dunes (Petra, Dovina)

- **Slip geysers**, by the cycle: dormant, a faint fizz with a glassy ring; rumble (2 sim seconds), a low rumble rising and grit
  jumping; erupt (3), a roar and a rising whoosh (and the launch's own whoosh for the Courier); fall (2), sand raining and a pour.
  Each erupt is a stimulus for the creatures (Petra's `game.ai.stimuli.emit`).
- **The Solar Skiffing trial's music:** bright and driving, the owner's 2016 melodic-drop sound (the all-time list) at about 150 bpm.
  **Each ring is a note:** passing one plays the next degree of the cue's scale (`game.music.scale()`), so a clean run plays a melody
  and a missed ring leaves a hole in it. The sun's shadow gets a tick that quickens near the end.

## 5. Strawman (Dovina, Espada)

- **A blow:** a soft straw thump (a low thud, a puff of straw rustle), the post's creak on each swing as it rocks (decaying with the
  wobble), and **a bell in the ball foot** that jingles as it rocks back up: the sound of it righting itself. The damage type's own
  sound (`audio/damage.js`) is laid on top, so it doubles as a sound test for every weapon.
- **The target:** a ding when a ring of it is hit, higher towards the bullseye.
- Strawman says nothing (Espada's call); if Espada gives it a voice, I'll make it.
