# The overlay (a placeholder name, Espada's to give): how the game tells the player things (the owner, 2026-10-06)

Kept by Dovina (rules, inventory); the look: Calissa's `OVERLAY-LOOK.md`; drawn through one module (`src/vfx/hudring.js`'s, shared).

> "...lean in to the current design language of the HUD ring around the Courier during battle and make a more formalized system spec
> out of it. I love the esoteric digital interfaces overlaid on 'physical' objects motif." (the owner, 2026-10-06)

The battle ring (a gauge of the world's matter, no words, no numbers) made the rule for everything. Prior art: Zone of the Enders,
Dead Space, Metroid Prime, Serial Experiments Lain, .hack, NieR: Automata.

## The rules

**The grammar (Calissa):** matter counts what you have; line shows what you know; a crack is damage, drawn on matter only.
1. **It sits on the thing it is about.** Nothing floats in a screen corner that could sit on the object.
2. **No words, no numbers.** Sentences go to the log, counts to the ledger; the overlay shows state by shape, fill and colour. **Beads
   count to four; past four it is a fill.** (One exception: the Veritome's date stamp, below.)
3. **One family of marks** (ring, arc, bead, bracket, seam), so learning one teaches the rest.
4. **Colour has one meaning each.** Lachryma is what you have; labradorite the System's reading; a threat's distance is one
   labradorite ramp. **Gold stays off the overlay: gold means won** (LOOK.md section 4).
5. **It speaks in a fight, or quietly when a priced tool is raised out of one** (the ring comes up faint).
6. **Readiness is shown where the act comes from, in every view**: on the ring, and in the viewfinder's margin with the lens raised.
7. **Nothing repeats a flash**: a state changes once and eases; nothing pulses for attention.

## The Flash, the first case (settled 2026-10-06)
The capture circle showed the photograph's quality and was misread as the Flash's (key 1: 1.1 real second cooldown, 6 Lachryma).
**The meter lives where you aim from** (the owner: "why would the stun ring go around the enemy's feet when you're looking at them
THROUGH the Veritome to stun them? Remember, Fatal Frame and Pokemon Snap"); the feet ring is withdrawn. **Through the lens** the
capture circle is the Flash's: locked on the subject, filled by its stun meter, "open" when stunned (the reprogram cue), dashed while
immune, build-ups on its rim in their aura's colour, its outer rim the readiness hoop. The photograph's quality moves to the
viewfinder's corners closing on a subject held well. **Without the lens:** a labradorite hoop on the ring, and a bracket at the
creature's eyes while its meter is above zero, fading 3 real seconds after the last flash. **A price tick** on the pool's band at 6
Lachryma. The log says once, the first time, which key is which.

## The inventory

| information | where it sits |
|---|---|
| Lachryma pool, held charge; the Blink's charges (beads); where a blow came from; what has noticed you (threat arcs) | the battle ring (kept) |
| the Flash's readiness; a creature's stun meter and build-ups | the capture circle (lens); a hoop on the ring and a bracket at its eyes (no lens) |
| a creature's mental state; its grain | its body (temper; Calissa's dials); the Veritome names the grain |
| the draught (the stones) | the ring's band tinted by the feeling drunk |
| your mental state (Stoic .. Prismatic) | the ring's frame: steady at Stoic, shimmering toward Prismatic (easing, never flicker) |
| the FOE's crown cracks; a ring lit in the Solar trial; tuned knobs | kept: the crown; the ring's light; the Tab panel (its gold allowed) |
| what can be parried (the owner, 2026-10-06) | a Lachryma outline on the projectile and on the striking part of an answerable windup: `docs/plans/PARRY.md` |
| the Crucibelle's beat (the owner) | a pendulum or clapper on the bell that **swings** with the beat (motion, never a flash), its arc lit where a note would land |
| game day and game hour: the Veritome's clock (the owner) | the **date stamp** in the lens's corner (`ui/datestamp.js`: a 90s point-and-shoot's orange LCD), printed on every plate; rule 2's single exception. Without the lens: `/time` in the chat line, if you carry the Veritome |
| the weather where you stand: the Dreamvane's meter (the owner) | **the vane** on the crook's head turns to the mood's aspect in its colour (and the agate's), streamers longer with strength; shown while out, faintly when worn |
| the forecast (the Dreamvane's) | the dowse raised to the sky: the needle swings through the coming blocks in their colours; the log says it in one line; reach is `ECON.weather.forecast` blocks, widened by `divination.forecast` |
