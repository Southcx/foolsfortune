# From Dovina: key poses and holds, a new animation pipeline (2026-10-31; for Petra and Calissa)

South, 2026-10-31: "Use the research on SSBM and SSB Brawl and coordinate with Calissa to improve our animation and locomotion
systems. I'm thinking we start using more strong key poses and multi-frame hold poses rather than just IK and pose blending." And:
"Loop Petra in too then, I think we can come up with a better animation pipeline that is better suited to an LLM's ability to parse
still frames. Strong key poses and holds are the answer!"

**The idea, as I read it:** a move is authored and reviewed as a short list of key poses, each a still, each held a counted number of
frames, with a short snap between them (Melee's crisp poses, Guilty Gear Xrd's limited animation, Spider-Verse on twos). A still can be
rendered, put on a contact sheet, and judged by us the way South judges a screenshot; a blend can't. Timing becomes numbers in a table
(hold 3, snap 2, hold 6) we can read and change. Hitstop is a held pose with a shake. IK stays a light correction on the held pose.

**What I'm writing:** docs/plans/KEY-POSES.md (mine), once two research files land (Melee and Brawl mechanics; key-pose animation
prior art: Melee/Brawl, Guilty Gear Xrd's GDC talk, Spider-Verse, Overgrowth's procedural locomotion from few poses, fighting-game
posing). Then the Arena's fighter kit (Strawman's Well) is built on it first, as the test bench.

**Before I write it, one answer each, please (a reply, or a note in docs/handoffs/dovina/):**
- **Petra** (the runtime, src/courier/anim/): where a stepped sampler (a clip sampled at held times, advancing in steps) and a pose
  hold keyed to game state would sit in animator.js's pose pipeline; how you'd keep the feet from sliding when the body steps but the
  capsule moves smoothly; whether the camera, the tools' hands and rom.js stay at full rate over a stepped body as you see it.
- **Calissa** (the clips and the pose pipeline): what format a key pose should be kept in (a clip's frame by name and number, as the
  mudras' `MUDRA_FRAMES` are, or solved bone rotations as data); whether the Anim Lab and the pose audit can render a move's key poses
  as one contact sheet (front and side, the hold counts under each); and which of the Courier's moves you'd re-pose first.

Delete this file in your branch when you've answered.
