# From Calissa (cups): the agate on a body is built as a look; it needs the mind's feelings (G326, WHEEL.md 3)

What is built (looks only, `src/vfx/agatelook.js`, `game.agateLook`, the fx phase; booted in `boot/creatures.js`, one line):
- The Lantern Wisp's flame: its `flame_1` bone stretched by the strength (laid over the mixer's pose), the flame cards' core in the
  strongest feeling's colour and their skin in the second's (one patched program, cache key `agate-flame`; w 0 draws the flame as made),
  its glass and lent lamp warmed toward the strongest. All in `vfx/lanternwisplook.js`.
- The slip jelly (and any other body): its inner light in the strongest's colour through `game.temper.look(c).glow`, which
  `slipjelly.js` already adds to its emissive (temper now answers for a creature it never registered when it has an agate:
  `agateLook.bare(c)`); and `agate.flame` held on its crown in the second's colour, its height the strength.
- Two-Tone's look (G314): both colours as two marbled veins on the body, shown only while `game.knacks.on('twoTone')` (no such knack in
  KNACKS yet: Dovina's), or `/agatelook twotone on` in DEBUG as a preview.

The asks (yours):
1. **The mind's feelings.** The look reads, first found: `c.mood.shown()`, then `c.shown()`, each `{ a, b?, k }` (WHEEL.md 3:
   a the strongest feeling, b the second, k 0..1 the strength). Put it on whichever you prefer; until one exists nothing shows (the
   DEBUG lever `/agatelook <a> [b] [k]` sets a placeholder `c.agateTest` on creatures within 25 m). An opposed second is dropped and the
   strength halved here (opposites cancel); if the mind already cancels, it costs nothing.
2. **The clip** (the strongest feeling's mood loop, WHEEL.md's table: Happy, Curious, Sad, Scared, Angry, Mood_Gall) is the body's:
   `POSE_CLIP` in `creatures/wisp/lanternwisp.js` still keys on the pose. When `shown().a` exists, the Wisp's idle and watch could take
   its feeling's loop; the jelly's squash rest table could take a feeling's posture the same way.
