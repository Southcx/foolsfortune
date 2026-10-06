# The overlay: the look (Calissa's section of `docs/plans/OVERLAY.md`)

Kept in its own file so that two branches never add the same file twice (OVERLAY.md lives on `claude/dovina-design` until it merges);
Dovina links it from her "Who does what", or folds it in as a section when both are on main. Units: metres, **real seconds**, and
pixels at the 480-line present (`src/render/present.js`), the resolution every mark has to survive.

## The motif in one line

**Matter counts what you have; line shows what you know.** Every overlay is made of two materials the game already has, and that
split is the whole grammar:

- **Lachryma** (matter: near-black liquid with its oil film, `docs/LOOK.md` 2): a quantity you *hold*. The pool, the Blink's charges, a
  held charge. It fills, pours, drains; it never draws itself as a line.
- **Labradorite** (line: the Mind's schiller on black, `src/vfx/labradorite.js`): what the System *knows* about a thing. Frames,
  brackets, ticks, arcs, readiness, a creature's meter. It draws itself, closes, turns; it is never a liquid.

A third thing, not a colour, completes it: **the clay's crack** (pale cream in a dark wound, the battle ring's blow on the clay, the
vessel's cracks, the urn crown's seams). A seam is damage done to matter, so it only ever appears on matter.

Prior art, as a museum label: Zone of the Enders' ring radar (the model), Dead Space's spine (the gauge is part of the body), Metroid
Prime's visor (the interface belongs to a device and is drawn in its perspective), Rez's wireframes and lock squares (counting with
marks, never digits), .hack//IMOQ's and Lain's esoteric panels (the data showing through the world), NieR: Automata's floor-borne
target circles, and Monster Hunter's flash-pod KO (a hidden meter, which this one is not).

## The family of marks

Five marks. Each has one job, one geometry, one material, and the same handful of states, so learning one teaches the rest.

| mark | job | geometry | material | where |
|---|---|---|---|---|
| **ring** | a gauge round its object | a flat annulus on the ground, band between two fine frame lines | band: Lachryma (yours) or labradorite fill (the Mind's reading of a thing); frame: labradorite | at the object's foot, laid on the ground |
| **arc** | a direction or a share | a segment of a ring, outside its frame | labradorite, its hue by heat | on a ring, toward the thing |
| **bead** | one charge or one act's readiness | a disc set in a ring's frame | Lachryma disc = a charge you hold; labradorite hoop = an act that is ready | in the frame of the ring it belongs to |
| **bracket** | attention: *this* is the one | two or four corner ticks, or the viewfinder's focus pair | labradorite (on the lens: ink) | round the thing, a fixed size on the screen |
| **seam** | damage, a crack | a jagged pale line in a dark wedge | the clay's cream in a wound | on matter only: a band, a vessel, a crown |

### Sizes (what survives 480 lines)

- **Lines:** 1 to 1.6 px at 480 lines (the battle ring's frame is `fwidth`-based for exactly this). Never a line under 1 px: it
  crawls (CLAUDE.md, aliasing).
- **A ring on the ground:** its outer radius is the object's footprint times 1.25, at least 0.6 m (the Courier's is 0.85 m today). The
  band is 14% of the radius; the frame lines sit at its two edges; arcs sit outside at 106 to 114%.
- **A ring at a distance:** it keeps at least 24 px across on the screen (as the wire marks keep their size), fading out past 30 m
  rather than shrinking into noise.
- **A bead:** 0.09 of its ring's radius (0.075 m on the Courier's), at least 6 px; up to four in a row. Past four, a count becomes a
  fill (rule 2 below): four beads read at a glance, seven do not.
- **A bracket:** 28 to 40 px on the screen whatever the distance, drawn through walls (a target has to be found).

### The states, and how each eases

One vocabulary of states across the family. No state change is a cut and none repeats; every one eases (`docs/LOOK.md` 8).

| state | how it reads | the change |
|---|---|---|
| **empty / spent** | a socket: the frame's line only, its inside the ground's dark at 18% | drains over 0.25 s |
| **filling** | fills from one end (a ring clockwise on the screen from the near side, a bead from the bottom up) | the fill follows the value, eased at 0.12 s |
| **full / ready** | the fill whole; a labradorite bead gets a white glint at its top left (the lens's own) | **one** pulse rings outward from it (0.35 s), never repeated |
| **open** (stunned: the mind can be entered) | the ring closed, its ticks turning slowly (one turn in 6 s, a constant rate) | the ring closes with one bright head running round it (0.4 s), the battle ring's coming-online in small |
| **refusing / immune** | the frame drawn dashed (gaps of a quarter), its fill dimmed to 40% | the dashes ease in over 0.3 s; a refusal at the moment of use is the ward (`src/vfx/glyphs.js`), not the ring |
| **gone** | fades over 0.6 s, and 2 s after its value last changed if it is a creature's | |

## Colour: one meaning each (Dovina's rule 4, cut)

The overlay has **two materials and one ramp**, not a palette:

1. **Lachryma, near-black with its oil film:** what you hold. The pool, a held charge, a charge bead.
2. **Labradorite's schiller:** what the System knows. Every frame, bracket, arc, readiness hoop and creature meter.
3. **Heat is a place on the schiller, not a new colour.** "Copper close, blue far" is already labradorite at two ends of its own ramp
   (`labradorite(0.93)` and `labradorite(0.3)` in `hudring.js`'s threat arcs). Anything that wants "how urgent" walks that ramp.

Plus two things that are not the overlay's but appear on it:
- **The clay's crack** (cream in a dark wound): damage, only on matter.
- **A status's own colour**, taken from its aura in the library (`aura.<status>`, `src/vfx/auras.js`). It is used only as the fill of a
  status's build-up arc on a creature's ring, so the arc and the aura on the creature are the same colour. It never goes on a frame.

**Gold stays off the overlay.** `docs/LOOK.md` 4 keeps gold for what is yours *won* (a reward, an achievement's line, a chest's rarity,
kintsugi), and the Tab panel's "tuned" is in a window, not on the world. A mark in gold would say "you won something" every time it
lit.

## Where Dovina's rules are wrong (cards face up)

1. **Rule 4's colours.**
   - "The Lachryma is yours" and "Mirth's gold means tuned" both claim *yours* (`LOOK.md` 4 gives it to gold, for won things), and
     gold must not mean two things on the world. The fix is the split above: Lachryma is *held*, gold is *won*, and gold stays off the
     overlay.
   - Copper and blue are not two colours. They are one ramp of the stone.
2. **Rule 6 against the Flash's bead on the battle ring.** With the lens raised (RMB) the view is through the book, and the battle ring
   is hidden in first person (`hudring.js`: `ring.visible = false` in first person). The bead would vanish exactly when you aim the
   narrow beam. The readiness needs **two homes, one mark**:
   - on the battle ring when the book is out in third person;
   - in the viewfinder's margin when the lens is up.

   It is the same hoop in both, drawn in ink on the parchment, the way the lens draws everything.
3. **Rule 5 needs one more case.** Raising a tool with a cost or a cooldown out of a fight must bring the battle ring up in its quiet
   state (online, at 40%, no pulse), or the Flash's bead is unseen before the first flash. That is the moment you need it most: the
   flash that starts the fight. This is a hook for Petra: `combat.engaged || belt.out?.overlay`.
4. **Rule 7, "nothing blinks", is right but too blunt to build from.** The rule is: **nothing repeats a flash**. One pulse on a change
   of state (ready, open) is how the overlay says "now"; a pulse that repeats while a state holds is the blink the rule forbids.
5. **Rule 2's "no numbers" also needs a ceiling on counting.** Beads count up to four, and past four it is a fill. A row of nine
   beads is a number written in dots.

## The Flash, specified

- **The Flash's bead** is a labradorite hoop. It is not a Lachryma disc, because it shows an act's readiness, not a charge held.
  - **On the battle ring** (book out) it sits in the frame *after* the band's end, across the ring from the Blink's Lachryma beads.
    They are never confused: different side, different material.
  - **The cooldown** (1.1 s, `FLASH.cool`) draws the hoop round clockwise.
  - **Ready** (cooled down, and at least `FLASH.cost` Lachryma held) fills it with the lens's white glint and rings its one pulse.
  - **Cooled down but too poor:** the hoop is whole and its inside stays dark.
- **The price tick.** While the book is out, a fine labradorite tick crosses the pool's band at the level the Flash would spend it down
  to. This is the general mark for any act's cost: the same tick serves every priced act. You see before you press it what the flash
  will take.
- **In the viewfinder** (lens up) the same hoop sits in the right-hand margin at the height of the capture circle, in ink on the
  parchment, with its glint in vermilion (the lens's colour for a creature that can be held). The capture circle in the middle stays
  the photograph's alone.
- **A creature's stun meter** is a ring at its feet (the family's ring: labradorite fill, labradorite frame).
  - It sits at its ground contact, its footprint times 1.25.
  - It shows only in a fight, and only while the meter is above zero or the Flash is aimed at the creature (the cone's edge touching
    it).
  - It fills clockwise as flashes land, eased at 0.12 s, so each flash is a visible step. It drains as the meter drains.
  - **Stunned:** the ring closes with its running head and its ticks turn, which is the **open** state. That *is* the reprogram cue;
    the interact chevron still hangs over it when you are near enough to press the middle button.
  - **Immune** (coming to: its meter fills at a quarter of the rate, `src/creatures/stun.js`): the frame is dashed, so the next flash
    is seen to be worth less.
  - **Status build-ups** (doubt, charm, blind, confusion) are arcs outside the same ring, filled in their aura's colour.
- **The log** says the keys once (Espada's line, Dovina's ask). The marks never do.

## For Petra: the one module

What the shared part needs, from the look's side:
- `ring({ at, radius, band: 'lachryma' | 'mind', fill, frame: 'solid' | 'dashed', state })`, with `.bead(i, kind, k)`,
  `.arc(angle, width, heat | color)`, `.tick(at)`, `.seam(angle, width)`.
- All in **one shader**: the battle ring's fragment shader, generalised. Every ring is a quad on the ground, so many rings are one
  instanced draw, with no lights and no shadow.
- A screen-size floor (24 px) and a distance fade (30 m).
- Brackets stay `src/vfx/wiremarks.js`'s; seams stay on the matter they crack.

My budget ask: every creature ring in a room together costs **one** draw call (instanced quads, the ring's state in instance
attributes), and the frame's overlay costs at most 3 (the battle ring, the creature rings, the wire marks).

**Open (to settle with Petra and Dovina, then the owner):**
- Whether the stun ring shows on creatures the Flash is not aimed at, in a fight with several. I lean to: only the aimed one and any
  above zero.
- The overlay's name: Espada's to give.
- Mental state on the frame (Stoic to Prismatic) as the schiller's strength rather than a shimmer. It is a constant-rate drift whose
  amplitude rises, never a faster flicker.
