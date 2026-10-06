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
   - in the view through the lens when it is raised.

   (Since the owner's ruling, the lens's home is the capture circle's own outer rim, not the margin: see "The Flash, specified".)
3. **Rule 5 needs one more case.** Raising a tool with a cost or a cooldown out of a fight must bring the battle ring up in its quiet
   state (online, at 40%, no pulse), or the Flash's bead is unseen before the first flash. That is the moment you need it most: the
   flash that starts the fight. This is a hook for Petra: `combat.engaged || belt.out?.overlay`.
4. **Rule 7, "nothing blinks", is right but too blunt to build from.** The rule is: **nothing repeats a flash**. One pulse on a change
   of state (ready, open) is how the overlay says "now"; a pulse that repeats while a state holds is the blink the rule forbids.
5. **Rule 2's "no numbers" also needs a ceiling on counting.** Beads count up to four, and past four it is a fill. A row of nine
   beads is a number written in dots.

## The Flash, specified

**The owner's ruling (2026-10-06):** "why would the stun ring go around the enemy's feet when you're looking at them THROUGH the Veritome
to stun them? Remember, Fatal Frame and Pokemon Snap." The meter lives **where you aim from**. My feet ring is withdrawn (Dovina's
OVERLAY.md, `claude/dovina-design` f0da7ef, has the rules). One more line for the grammar falls out of it: **the margins are the book's,
and the picture is the overlay's.** The viewfinder's parchment margins draw in ink, as they always have. Anything laid over the picture
itself is the System's reading, so it is labradorite.

**Through the lens (the Veritome raised): the capture circle is the Flash's.** This is Fatal Frame's Camera Obscura.
- **It locks on.** When a creature that can be stunned is inside it, the circle eases onto the creature over 0.15 s and holds there. It
  eases back to the middle of the picture over 0.3 s when the creature is lost. It keeps its size on the screen.
- **The stun meter fills it.** A labradorite band inside the circle fills clockwise from the top as flashes land. The fill is eased at
  0.12 s, so each flash is a visible step, and it drains as the meter drains.
- **Open** (stunned: the reprogram cue): the circle closes with one bright head running round it (0.4 s), and its ticks turn, one turn
  in 6 s. The interact chevron still hangs over the creature once you are near enough to press the middle button.
- **Immune** (coming to): the band is drawn dashed (gaps of a quarter), at 40%, so the next flash is seen to be worth less.
- **Status build-ups** (doubt, charm, blind, confusion) ride outside the circle's rim as arcs filled in their aura's colour, at most
  four.
- **The circle's outer rim is the readiness hoop.**
  - It draws itself round over the 1.1 s cooldown (`FLASH.cool`).
  - When ready, it gets the lens's white glint at its top left and rings one pulse.
  - When the Flash is cooled but you hold too little Lachryma, the hoop is whole but hollow and dark.

  It sits on the circle, so readiness is where you aim, and the margin home from my first cut is no longer needed.
- With no subject held, the circle sits empty in the middle with only its readiness hoop: it is a sight, ready or not.

**The photograph's quality moves to the frame.** This is Pokemon Snap's viewfinder.
- **Four corner brackets** of ink sit on the inner edge of the parchment, one at each corner of the picture. They close inward as the
  held plate improves: from flush with the margin to 6% of the picture's height in. They ease at 0.2 s and never jump.
- **The shutter chance** is the frame's one brief brightening. The parchment margin lifts 25% toward white over 0.08 s and settles
  over 0.4 s, once per chance and never repeated while the chance holds (rule 7).
- The focus brackets over each subject stay as they are (darker for a better shot, vermilion for one that can be held).

**Without the lens (the book out, a third-person Flash): a bracket at the creature's eyes.**
- **The mark.** Two labradorite brackets, `[` and `]`, sit either side of the creature's head (`head(out)`, the point stun.js puts
  its stars at). They are as wide as the head with a 20% margin, and never under 28 px on the screen.
- **The fill.** Each bracket's upright is the gauge: it fills bottom to top with the stun meter, both sides together, eased at 0.12 s.
- **Open:** the two brackets slide together and join into a closed square round the head (0.4 s, the running head along its edges),
  and the square turns slowly, one turn in 6 s.
- **Immune:** the uprights are dashed.
- **Status build-ups:** short ticks on the outside of the uprights, in their aura's colour.
- **When it shows:** only on a creature whose meter is above zero. It fades over 0.6 s, starting 3 real seconds after that creature's
  last flash. At zero it shows nothing, so a fight with several creatures shows only the ones you have flashed. That settles our
  "unaimed creatures" question.
- **Readiness in this view** stays on the battle ring: the hoop in the frame after the band's end, across from the Blink's beads.

**And for both views:**
- **The price tick.** While the book is out, a fine labradorite tick crosses the pool's band at the level the Flash would spend it down
  to. The battle ring is up in its quiet state, so the tick reads before the fight.
- **The log** says the keys once (Espada's line, Dovina's ask). The marks never do.

## For Petra: the one module

What the shared part needs, from the look's side:
- `ring({ at, radius, band: 'lachryma' | 'mind', fill, frame: 'solid' | 'dashed', state })`, with `.bead(i, kind, k)`,
  `.arc(angle, width, heat | color)`, `.tick(at)`, `.seam(angle, width)`.
- The same band, frame, arcs and hoop also serve the capture circle on the screen (a ring drawn in screen space instead of on the
  ground) and the bracket at a creature's eyes (a ring cut to two uprights). One shader, three placements.
- All in **one shader**: the battle ring's fragment shader, generalised. Every ring is a quad on the ground, so many rings are one
  instanced draw, with no lights and no shadow.
- A screen-size floor (24 px) and a distance fade (30 m).
- Brackets stay `src/vfx/wiremarks.js`'s; seams stay on the matter they crack.

My budget ask: every creature bracket in a room together costs **one** draw call (instanced quads, the ring's state in instance
attributes), and the frame's overlay costs at most 3 (the battle ring, the creature brackets, the wire marks; the capture circle is the viewfinder's own canvas).

**Open (to settle with Petra and Dovina, then the owner):**
- The overlay's name: Espada's to give.
- Mental state on the frame (Stoic to Prismatic) as the schiller's strength rather than a shimmer. It is a constant-rate drift whose
  amplitude rises, never a faster flicker.
