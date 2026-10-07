# The overlay: how the game tells the player things (the owner, 2026-10-06)

Kept by Dovina (the rules and the inventory); the look is Calissa's, `docs/plans/OVERLAY-LOOK.md` (fold in here once both are on main);
Petra builds one module every overlay is drawn through (the battle ring's code, `src/vfx/hudring.js`, made the shared part). "Overlay"
is a placeholder name for Espada's. Units: real seconds, metres.

> "That charging circle in photograph mode isn't functioning as an indicator for the 'Flash' attack. ... lean in to the current design
> language of the HUD ring around the Courier during battle and make a more formalized system spec out of it. I love the esoteric
> digital interfaces overlaid on 'physical' objects motif." (the owner, 2026-10-06)

**The motif:** esoteric digital interfaces laid over physical things; the battle ring (a gauge on the ground round the Courier, made of
the world's matter, no words, no numbers) made the rule for everything. Prior art: Zone of the Enders, Dead Space, Metroid Prime,
Serial Experiments Lain, .hack, NieR: Automata, Parasite Eve, Vagrant Story.

## The rules

**The grammar (Calissa):** matter counts what you have; line shows what you know. Lachryma is held, labradorite is the System's
reading, a crack is damage, drawn on matter only.

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

The capture circle charged with the photograph's quality and was read as the Flash's (key 1: a cone of light, 1.1 real second
cooldown, 6 Lachryma, fills a creature's stun meter). Settled:
- **The meter lives where you aim from** (the owner, 2026-10-06: "why would the stun ring go around the enemy's feet when you're
  looking at them THROUGH the Veritome to stun them? Remember, Fatal Frame and Pokemon Snap"). The feet ring is withdrawn.
- **Through the lens the capture circle is the Flash's** (Fatal Frame): it locks onto the subject, the stun meter fills it, it closes to
  "open" when stunned (the reprogram cue), dashed while immune; status build-ups ride its rim in their aura's colour; its outer rim is
  the readiness hoop, closing with the cooldown.
- **The photograph's quality moves to the viewfinder's frame** (Pokemon Snap): the corners close on a subject held well; the shutter
  chance is one brief brightening. One circle, one meaning.
- **Without the lens:** a labradorite readiness hoop on the ring, and a bracket at the creature's eyes (never its feet), shown while its
  meter is above zero, fading 3 real seconds after the last flash.
- **A price tick** on the pool's band at 6 Lachryma. The log says once, the first time, which key is which.

## The inventory

| information | where it sits |
|---|---|
| Lachryma pool, held charge; the Blink's charges (beads); where a blow came from; what has noticed you (threat arcs) | the battle ring (kept) |
| the Flash's readiness | the capture circle's outer rim (lens); a labradorite hoop on the ring (no lens); a price tick on the band |
| a creature's stun meter and status build-ups | the capture circle on the subject (lens); a bracket at its eyes (no lens); build-ups as arcs in their aura's colour |
| a creature's mental state; its grain | its body (temper; Calissa's dials); the Veritome names the grain |
| the draught (the stones) | the ring's band tinted by the feeling drunk |
| your mental state (Stoic .. Prismatic) | the ring's frame: steady at Stoic, shimmering toward Prismatic (easing, never flicker) |
| the FOE's crown cracks; a ring lit in the Solar trial | kept, on the crown; the ring's own light |
| tuned knobs | the Tab panel, the log, QAIS (a panel, not the overlay; its gold is allowed) |
| what can be parried (the owner, 2026-10-06) | a Lachryma outline on the projectile and on the striking part of an answerable windup: `docs/plans/PARRY.md` |
| the Crucibelle's beat (the owner) | a pendulum or clapper on the bell that **swings** with the beat (motion, never a flash), its arc lit where a note would land |
| game day and game hour: the Veritome's clock (the owner) | the **date stamp** in the lens's corner (`ui/datestamp.js`: a 90s point-and-shoot's orange LCD), printed on every plate; rule 2's single exception. Without the lens: `/time` in the chat line, if you carry the Veritome |
| the weather where you stand: the Dreamvane's meter (the owner) | **the vane** on the crook's head turns to the mood's aspect in its colour (and the agate's), streamers longer with strength; shown while out, faintly when worn |
| the forecast (the Dreamvane's) | the dowse raised to the sky: the needle swings through the coming blocks in their colours; the log says it in one line; reach is `ECON.weather.forecast` blocks, widened by `divination.forecast` |

Dovina keeps the inventory as new systems arrive.
