# Round v133 from QAIS, routed, and the owner's Build rulings (from Dovina, 2026-10-09)

The owner's morning session: 18 QAIS tests and 14 reports (R7 to R20). Each report carries a screenshot, the marked-up frame, a `/goto`
stand line and the attached state (`bugs/R<n>` on the build's page). All are marked "seen" and taken by their owner.

## Yours, by severity
- **R16 (blocks): the Blaster does not fire on the rail.** LMB, held or clicked, fires nothing in any passage section.
- **R17 (blocks): rail readability.** You can't tell which entity fired which shot, or from which view. Shots fired from above are
  still on screen after the swing to the side view. The ship disappears under the shots' draw order. The design half (the legs' pacing
  and length) is mine; see "The rail overhaul" below. Yours: the ship's draw order over the shots, and a shot's thrower readable at a
  glance (a tell at the muzzle, its line back to the thrower).
- **R7 (wrong): QAIS will not open while the Pneuka Box is open.** F8 should open over any window; it is the bug report.
- **R12 (wrong): Esc closing the Pneuka Box also opens the pause menu.** The same family as T10: one key, one window.
- **T10 (passed, but the note):** talking to Pip still brings up the pause menu now and then.
- **T142 (failed): the log's scroll.** The mouse wheel doesn't scroll it (it fights the camera's zoom), and the chat tabs can't be
  selected. PageUp, PageDown and minimise work.
- **R13 (wrong): the Throwing Room's shadow flickers** as the camera moves. `/goto 16 0.01 0.16 -2.92`.
- **R19 (rough): aiming feels damped**, as if mouse x and y have different accelerations (the psygun's reticle, the Soul Brush's
  painting). The owner: if it's a soft aim assist, it must be a setting.
- **T51 (failed again).** The log says "You slash x pots" for blows on Strawman. Strawman builds up stun even when it blocks. Swing
  mode never swings at the Courier, so there's no parry practice. The arms are Calissa's.
- **R8 (wrong): Solar Skiffing bails too easily** (small drops off ledges), and the dismount is jarring. The owner's idea: a **glide**
  using the skiff's oars as wings (they're rigged already), and a ragdoll as the in-between into the dismount. The glide is a Movement
  Art (a tech), so its unlock is mine to set when you build it.
- **R9 (wrong): Wanda's sibling stands on a Shrine,** and the Weir's busker's mat is inside slip jelly aggro range. Move both.
  `/goto 2004.91 -408.04 -22.71 4.15`.
- **R18 (wish): Celestial mode's targeting.** Glyphs meant for a clapperjar's overhead paint the things round it. The owner's design:
  open Celestial mode, mark targets with a dot first, and every glyph drawn in that window applies only to the marked ones.
- **R6 (from v132) still stands:** the 0.25 m step-up.

## The owner's Build rulings (QAIS Questions, v131) that are yours to wire
- **Prismatic and Stoic on the Courier.** The numbers are in `progress/stones.js`: `courierMindEffect(game.courierMind.mind)` gives
  `{ power, fragility }` (Stoic 0.67 and 0.5, Resolved 0.83 and 0.75, Balanced 1 and 1, Fluid 1.25 and 1.5, Prismatic 1.5 and 2). Multiply
  the Courier's outgoing damage by `power` where blows land, and the damage the Courier takes (shield and clay) by `fragility`.
- **Friendly fire:** wire `progress/combat/friendly.js` (`friendlyDamage`, `tolerance`) into the strike path for allies.
- **The parry at sea is the roll only:** E turns shots back; V retires on the rail (RAIL-OVERHAUL.md).
- **Bigger Dunemaw floors** (13, then 19, then 25 rooms, as DUNEMAW.md), and **the Great Slip Jelly about 12 Couriers tall** (about 21 m).
  The owner: "we want it scaled up to be BIG". Calissa has the model's scale. The bowl, the ram, the slam's reach and the camera are
  yours, and the fight is in flux.

## The rail overhaul (mine, coming next round)
I'm doubling every leg's length (the owner: "too short to even process what is going on") and adding three pacing laws to the leg
schedules (`progress/rail/legs.js`, checked by `node scripts/legs.mjs`):
- no shot emitted during a swing, and none alive across one;
- a breath after each swing before the next wave;
- the Astral and Umbral phases designed as their own beats, not mixed in one bar.
You'll get the new schedules. The runner's job (clearing shots at a swing) may need a line from you.

Delete this note when done.
