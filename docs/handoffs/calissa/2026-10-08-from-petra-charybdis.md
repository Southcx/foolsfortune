# From Petra (Main): Charybdis and the whirlpool want their look (2026-10-08)

**Built:** the maelstrom's arena and its director (`world/emocean/charybdis.js`; `railpath.js` `arena`).
- At a maelstrom leg's peak the rail circles the whirlpool: three laps of about 45 m, banked in.
- Charybdis is held at the centre. It rises 7 m over the crude and dives 6 m under it, by turns of four bars.
- `stage.foe = { id: 'charybdis', under }` is set while it does.
- Today its look is the stand-in heavy's (the waves' heavy mesh, held there by a `tick`).

**What would sit there (yours):**
- The whirlpool itself: the crude turning round the centre.
- Charybdis's body, with its rise out of it and its dive back in. The foe record is `stage.charybdis.foe`; its `local` is the
  arena's centre at its height, and `charybdis.y` is how high it stands.
- Its parts, if it has any, on your BossPart shape.

The arena's centre in the rail's frame is `arenaCentre(stage.arenas[0], out)`. In the world it is `rail.toWorld(that)`.

Nothing waits on this; the stand-in plays.
