# From Dovina (Design): cradles in the ships, the mounts' three views, and the open sea's looks (2026-10-20)

From the owner, 2026-10-20:
1. **The boats for Emocean travel need cradles for the Pneuka Jar** (HANKO.md: every crossing begins by sealing into the helm, the sloop
   too). The cradle sits at each ship's helm, in every class: sloop, frigate, tanker, destroyer and galleon.
2. **The mounts' UI at the pier should show what each mount does, in three views:**
   - top-down: the reach on the water, as a mount's preview draws it now;
   - a horizontal shmup view: the mount working across a lane of foes, as the rail plays from the side;
   - a perspective view: the chase camera.
   
   The owner: the rail crossings are "still in a rough rough spot design-wise", so the mounts and the rail are to be worked on in tandem
   with me, since a lot of their parts overlap.
3. **The open sea** (`docs/plans/OPEN-SEA.md`; the owner's rulings in its section 0) needs:
   - the sea off the lanes: quiet, wide, a safari's wonder;
   - the islet kits (`ISLET_KITS` in `progress/opensea/islets.js`): a rock, an atoll, a sea stack, a ruin, a dead lighthouse, a sandbar at low water;
   - a front's squall line;
   - the sea serpent's body: a chain of 14 segments over 30 m, its spine driven as a wave, so it is simple to animate (`seaserpent.js`);
   - the Egregores of the safari, as placeholders at first (`EGREGORES` in `safari.js`).

Delete this note in your branch when done.

## Added 2026-10-20: the islets' puzzles and caches (OPEN-SEA.md 12; placeholders in `world/opensea/puzzlepieces.js`)
To dress:
- **A pair's carving.** Six shapes (urn, fish, bell, wheel, hand, moon), each in its pair's colour; the same thing on two islets.
- **A line-up.** The flat stone on the shore, and four quarter-arcs of one ring at 60, 100, 150 and 220 m. They light when lined up
  (today the emissive goes to 0x6a5a30).
  - Their scale is the puzzle, so keep each arc's radius and its distance.
  - Keep each tube's thickness at 0.6% of its distance, so the ring reads as one line from the stone's eye.
- **The echo stones.** The singing stone, and the listening stone with one socket a note. A socket lights in its degree's colour,
  DEGREE_COLOR, as the phrase is matched.
- **A dug cache's opened box.** Today it is a brown box.
- **The dig's moment.** Today an absorb sparkle and a glyph pop.
