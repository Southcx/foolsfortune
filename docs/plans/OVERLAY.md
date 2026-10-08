# The overlay (a placeholder name, Espada's to give): how the game tells the player things (the owner, 2026-10-06)

Kept by Dovina (the rules, the inventory) and Calissa (the look: sections 2 to 5 and 7); drawn through one module (`src/vfx/hudring.js`'s,
shared). One file: it was OVERLAY.md and OVERLAY-LOOK.md (see the note at the end).

> "...lean in to the current design language of the HUD ring around the Courier during battle and make a more formalized system spec
> out of it. I love the esoteric digital interfaces overlaid on 'physical' objects motif." (the owner, 2026-10-06)

The battle ring (a gauge of the world's matter, no words, no numbers) made the rule for everything. Prior art: Zone of the Enders (the
ring radar), Dead Space (the spine), Metroid Prime (the visor), Rez (the lock squares), NieR: Automata (the floor circles), Fatal Frame
(the camera), Serial Experiments Lain, .hack.

Units: metres, real seconds, pixels at the 480-line present.

## 1. The rules

**The grammar (Calissa): matter counts what you have; line shows what you know; a crack is damage, drawn on matter only.**
- **Lachryma** (matter): a quantity you hold (the pool, the Blink's charges, a held charge). It fills and drains; never a line.
- **Labradorite** (line, `vfx/labradorite.js`): what the System knows (frames, brackets, ticks, arcs, readiness, a creature's meter).
- **The clay's crack** (cream in a dark wound): damage, and only ever on matter (a band, a vessel, a crown).

The seven rules:
1. **It sits on the thing it is about.** Nothing floats in a screen corner that could sit on the object.
2. **No words, no numbers.** Sentences go to the log, counts to the ledger; the overlay shows state by shape, fill and colour. **Beads
   count to four; past four it is a fill.** (One exception: the Veritome's date stamp, section 6.)
3. **One family of marks** (ring, arc, bead, bracket, seam), so learning one teaches the rest.
4. **Colour has one meaning each** (section 4). Lachryma is what you have; labradorite the System's reading; a threat's distance is one
   labradorite ramp. **Gold stays off the overlay: gold means won** (`docs/ART.md`, precept 4).
5. **It speaks in a fight, or quietly when a priced tool is raised out of one** (the ring comes up faint: online, 40%, no pulse).
6. **Readiness is shown where the act comes from, in every view**: on the ring, and, with the lens raised, on the capture circle's
   outer rim (section 5).
7. **Nothing repeats a flash**: a state changes once and eases (one pulse on the change of state, never while it holds); nothing pulses
   for attention.

## 2. The marks

| mark | job | geometry | material |
|---|---|---|---|
| **ring** | a gauge round its object | a flat annulus at its foot, a band between two frame lines | band Lachryma (yours) or labradorite (the Mind's reading); frame labradorite |
| **arc** | a direction or a share | a segment outside the ring's frame | labradorite, hue by heat |
| **bead** | one charge, or one act ready | a disc in the ring's frame | Lachryma disc = a charge; labradorite hoop = ready |
| **bracket** | attention: this one | two or four corner ticks | labradorite (ink on the lens) |
| **seam** | damage | a jagged pale line in a dark wedge | the clay's cream, on matter only |

**Sizes:** lines 1 to 1.6 px (`fwidth`-based; never under 1 px). A ground ring: footprint × 1.25, at least 0.6 m; band 14% of the
radius; arcs at 106 to 114%; at least 24 px on screen, fading past 30 m. A bead: 0.09 of its ring's radius, at least 6 px, **at most four**
(past four a count becomes a fill). A bracket: 28 to 40 px whatever the distance, drawn through walls.

## 3. The states

Each eases; **nothing repeats a flash** (one pulse on a change of state, never while it holds).

| state | reads as | change |
|---|---|---|
| empty | the frame only, its inside at 18% | drains over 0.25 s |
| filling | from one end (clockwise from the near side; a bead from the bottom) | eased 0.12 s |
| ready | whole; a labradorite bead gets a white glint top left | one pulse outward, 0.35 s |
| open (stunned) | closed, ticks turning one turn in 6 s | one bright head runs round it, 0.4 s |
| refusing / immune | frame dashed (quarter gaps), fill at 40% | 0.3 s; a refusal at the moment of use is the ward glyph |
| gone | fades 0.6 s; a creature's 2 s after its value last changed | |

## 4. Colour: two materials and one ramp

Lachryma is **held**; labradorite is **known**; **heat is a place on the schiller** (copper near, blue far: `labradorite(0.93)` to
`labradorite(0.3)`). A status's own colour (its `aura.<status>`) fills only its build-up arc, never a frame. Gold: rule 4.

## 5. The Flash, the first case (settled 2026-10-06)

The capture circle showed the photograph's quality and was misread as the Flash's (key 1: 1.1 real second cooldown, `FLASH.cool`; 6
Lachryma). **The meter lives where you aim from** (the owner: "why would the stun ring go around the enemy's feet when you're looking at
them THROUGH the Veritome to stun them? Remember, Fatal Frame and Pokemon Snap"); the feet ring is withdrawn. The margins are the book's
(ink); the picture is the overlay's (labradorite).

**Through the lens, the capture circle is the Flash's:** locked on the subject, filled by its stun meter, "open" when stunned (the
reprogram cue), dashed while immune, build-ups on its rim in their aura's colour, its outer rim the readiness hoop.
- It eases onto a stunnable creature (0.15 s) and back to the middle when lost (0.3 s), keeping its screen size.
- A labradorite band inside fills clockwise from the top with the stun meter (each flash a visible step).
- Open: it closes with a running head, ticks turning. Immune: dashed, 40%.
- Status build-ups ride outside the rim as arcs (up to four).
- **Its outer rim is the readiness hoop:** it draws round over `FLASH.cool` (1.1 s), glints and pulses once when ready, and is whole
  but dark when you hold too little Lachryma.

**The photograph's quality** moves to the viewfinder's corners, closing on a subject held well: four ink corner brackets on the
parchment's inner edge close inward as the plate improves (flush to 6% of the picture's height, eased 0.2 s). The shutter chance lifts the
margin 25% toward white over 0.08 s and settles over 0.4 s, once.

**Without the lens:** a labradorite hoop on the ring (readiness stays on the battle ring), and `[ ]` at the creature's eyes
(`head(out)`), as wide as the head plus 20%, at least 28 px. The uprights fill bottom to top with the meter. Open: they slide into a
square that turns. Shown only while its meter is above zero, fading 0.6 s from 3 s after its last flash.

**The price tick:** a fine tick across the pool's band where the Flash would spend it to (6 Lachryma), while the book is out. The log
says once, the first time, which key is which.

## 6. The inventory

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

## 7. The module (for Petra)

`ring({ at, radius, band: 'lachryma' | 'mind', fill, frame: 'solid' | 'dashed', state })` with `.bead(i, kind, k)`, `.arc(angle, width,
heat | color)`, `.tick(at)`, `.seam(angle, width)`. One shader, three placements (on the ground, the capture circle on screen, the
bracket at the eyes). Budget: all creature brackets one instanced draw; the overlay at most 3 draws.

## Note on the merge

Where the two files differed, the later wording is kept. Rule 6 once put the Flash's readiness "in the viewfinder's margin"; the Flash
ruling (2026-10-06, after the rule's draft) puts it on the capture circle's outer rim, and the margin holds the photograph's quality
(section 5). Rule 7 now carries the look's "one pulse on a change of state". Repeats are cut: the gold sentence and the quiet
ring stand once (rules 4 and 5). No number or decision was dropped.
