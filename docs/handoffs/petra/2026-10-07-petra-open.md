**Petra's open items** (the folder closed out 2026-10-15: fourteen notes read against the code; what is done was deleted; this is what is
still open, one line each, with its source. The owner's calls are marked.)

- **The Crucibelle plays in the bar's scale**: wire it to `game.music.scale()` (Wanda's). Nothing in `tools/crucibelle/` asks it yet.
- **The weather's effects where a thing stands**: `mindDrift`, `fishPull`, `signatureMult` have no callers; `buildMult` reaches
  `friendly.js` only. Grain (`progress/combat/temperament.js`) is imported by nothing (Dovina, 2026-10-07).
- **Wanda's two asks**: the ground's material under a step (`move.step { surface }`) and an `acoustic` on each zone.
- **The renames' pass** (SWEEPS.md: testroom -> throwingRoom, game.emocean -> game.rail, the rail's foe -> hostile, the film -> memory,
  rank.up -> standing.up): one round, with the mapping sent to every division first. Polarity's 30 uses are the check's list.
- **The slip jelly mount** (gj3's drop): a feature of its own, not begun.
- **The Throwing Room over 450 calls** where the Workshop's door is in view (455 to 497 measured by Calissa, 2026-10-10): an occlusion
  test through the doorway, or a portal backdrop. Not yet measured since the wing's later rounds.
- **The belt's draw calls** (about 30 in every zone): `render/restbake.js` merging a tool's meshes by material (the Veritome 10 to 2).
- **The pier's islands and ships are mouse-only** (`.room` rows): the mounts' cards take the keyboard, those rows do not. The compare
  arrows on a mount's card wait on which mount a pick bumps (`slice(-n)`). The rail is in flux: the owner's call when.
- **The parry's press in three places**: `parries.js` WINDOW 0.25, the kick's `PARRY_TO` 0.26, the cutlass's 0.28; the parry mark reads
  the shortest. One number means a feel change of up to 0.03 real s: the owner's call. And `jelly/deform.js` could export its GLSL
  so the parry mark stops copying it.
- **A photo finish** (Dovina, round six): a rival within 0.3 s of you at the line (`race.rival.finish` against `race.finish`) takes a
  plate at the line. Not built: it wants the Veritome's plate taken without the lens up, which does not exist yet.
- **Co-op, still to build**: the tools in the siblings' hands, the guests'
  shared errand (the Dunemaw run, host-owned), siblings a guest can see, the room's lag with two real people (T114).
- **The Dunes made bigger** (DUNES.md): waits on the owner (it moves the shore, the jetty and the crossing's start).
