# The overlay: the look (Calissa's section of `OVERLAY.md`)

Units: metres, real seconds, pixels at the 480-line present. **Matter counts what you have; line shows what you know.**
- **Lachryma** (matter): a quantity you hold (the pool, the Blink's charges, a held charge). It fills and drains; never a line.
- **Labradorite** (line, `vfx/labradorite.js`): what the System knows (frames, brackets, ticks, arcs, readiness, a creature's meter).
- **The clay's crack** (cream in a dark wound): damage, and only ever on matter (a band, a vessel, a crown).

Prior art: ZoE's ring radar, Dead Space's spine, Metroid Prime's visor, Rez's lock squares, NieR's floor circles, Fatal Frame's camera.

## The marks

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

## The states (each eases; **nothing repeats a flash**: one pulse on a change of state, never while it holds)

| state | reads as | change |
|---|---|---|
| empty | the frame only, its inside at 18% | drains over 0.25 s |
| filling | from one end (clockwise from the near side; a bead from the bottom) | eased 0.12 s |
| ready | whole; a labradorite bead gets a white glint top left | one pulse outward, 0.35 s |
| open (stunned) | closed, ticks turning one turn in 6 s | one bright head runs round it, 0.4 s |
| refusing / immune | frame dashed (quarter gaps), fill at 40% | 0.3 s; a refusal at the moment of use is the ward glyph |
| gone | fades 0.6 s; a creature's 2 s after its value last changed | |

## Colour: two materials and one ramp

Lachryma is **held**; labradorite is **known**; **heat is a place on the schiller** (copper near, blue far: `labradorite(0.93)` to
`labradorite(0.3)`). A status's own colour (its `aura.<status>`) fills only its build-up arc, never a frame. **Gold stays off the overlay**
(gold is *won*: LOOK.md). Raising a tool with a cost out of a fight brings the battle ring up quiet (online, 40%, no pulse).

## The Flash (the owner's ruling, 2026-10-06: "Fatal Frame and Pokemon Snap": the meter lives where you aim from)

The margins are the book's (ink); the picture is the overlay's (labradorite).
- **Through the lens, the capture circle is the Flash's.** It eases onto a stunnable creature (0.15 s) and back to the middle when lost
  (0.3 s), keeping its screen size. A labradorite band inside fills clockwise from the top with the stun meter (each flash a visible
  step). Open: it closes with a running head, ticks turning. Immune: dashed, 40%. Status build-ups ride outside the rim as arcs (up to
  four). **Its outer rim is the readiness hoop:** it draws round over `FLASH.cool` (1.1 s), glints and pulses once when ready, and is whole
  but dark when you hold too little Lachryma.
- **Photo quality is the frame's:** four ink corner brackets on the parchment's inner edge close inward as the plate improves (flush to
  6% of the picture's height, eased 0.2 s). The shutter chance lifts the margin 25% toward white over 0.08 s and settles over 0.4 s, once.
- **Without the lens: `[ ]` at the creature's eyes** (`head(out)`), as wide as the head plus 20%, at least 28 px. The uprights fill bottom
  to top with the meter. Open: they slide into a square that turns. Shown only while its meter is above zero, fading 0.6 s from 3 s after
  its last flash. Readiness stays on the battle ring. **The price tick:** a fine tick across the pool's band where the Flash would spend
  it to, while the book is out.

## For Petra: one module

`ring({ at, radius, band: 'lachryma' | 'mind', fill, frame: 'solid' | 'dashed', state })` with `.bead(i, kind, k)`, `.arc(angle, width,
heat | color)`, `.tick(at)`, `.seam(angle, width)`. One shader, three placements (on the ground, the capture circle on screen, the
bracket at the eyes). Budget: all creature brackets one instanced draw; the overlay at most 3 draws.
