# The overlay (a placeholder name, Espada's to give): the System's sight laid over the world

Kept by Dovina (the rules, the inventory, the worklist) and Calissa (the look: sections 2 to 5 and 7, and the style bible, section 10);
drawn through one module (`src/vfx/hudring.js`'s, shared) and the windows' own (section 8). One file: it was OVERLAY.md and OVERLAY-LOOK.md.

## 0. The direction (the owner, 2026-10-15; it replaces the "no words, no numbers" of 2026-10-06)

> "I feel like you guys get too anchored to the existing assets and have a hard time branching out into more novel JRPG design
> conventions and flair. [...] .hack//IMOQ, digimon world, persona 5? That sort of maximalist but also diegetic, representing a
> cyber-psychic world overlaid on a physical one. The HUD is supposed to more like mixed reality or augmented reality Watchdogs-like."
>
> "You know how in Log Horizon how Shiroe also has a spatial UI? Or in other isekai when they pull up a 'status' window? Or in HxH
> greed island when they summon 'book'? We should be moving in that direction. [...] I also encourage information having multiple
> avenues of communication, like with the lachrymato bottles going empty visually as well as having the flat lachrimeter on display.
> [...] If there's something I've noticed about good JRPGs, the UI is never 'stock'."

**The style in one line:** a diegetic augmented-reality interface (an FUI, a fictional user interface), maximalist, with moving type and
a strict hierarchy: the Vessoul's psychic sight drawn as the System's operating system, laid over a world of clay.

**The fiction already holds it.** The System is "the game's code made a voice" (the glossary): it is the isekai's System, and its
status window is ours to draw. The Veritome's bank is already called the Book: Greed Island's binder, summoned. Lachryma has a
signature everywhere (`core/signatures.js`): the overlay is what the Courier sees of it, as Dennō Coil's glasses see the city's cyber
layer. Nothing new has to be invented for the fiction; what was missing was the permission to draw it.

**Prior art, and what each gives** (Fagerholt and Lorentzon's *Beyond the HUD*, 2009, for the kinds: diegetic, spatial, meta, non-diegetic):
- **Dennō Coil** (Mitsuo Iso, 2007): the reference to hand everyone. A cyber layer over a real town, seen only through the glasses;
  its windows, tags and glitches belong to the place they sit in.
- **Log Horizon** (Shiroe's menus): spatial windows opened in the air in front of the body, the world still behind them.
- **The isekai status window**: summoned on a word, a framed sheet of stats and skills in the System's own type.
- **Hunter × Hunter's Greed Island** ("Book!"): the binder summoned out of the air, its slots and cards the game's state.
- **.hack//IMOQ**: the UI is the fiction (The World's client inside the ALTIMIT desktop); the data drain's glitch, the corrupted texture.
- **Watch Dogs** (the profiler): a spatial tag on each person, words and numbers, justified by the world's own network (here: Lachryma).
- **Persona 5**: kinetic type, collage, three colours, diagonals, every menu a transition; maximal, and legible because one thing at a
  time is huge.
- **Digimon World**, **The World Ends With You**: the data world and the psychic layer over a real Shibuya, their marks part of the place.

## 1. The rules (2026-10-15)

**The grammar (Calissa's, kept): matter counts what you have; line shows what you know; a crack is damage, drawn on matter only.**
- **Lachryma** (matter): a quantity you hold. **Labradorite** (line, `vfx/labradorite.js`): what the System knows. **The clay's
  crack**: damage, on matter only. The type the overlay speaks in is the System's, and it is labradorite: it is what the System knows.

The rules:
1. **The overlay reads what is; the log says what happened.** The overlay may carry words and numbers (a name, a count, a price, a
   rolling score) in the System's own type; it never narrates. A sentence about an event is the log's, always (CLAUDE.md, Feedback).
2. **It sits on the thing it is about, or opens in the air before you.** A readout is a tag pinned to its thing (the profiler); a whole
   sheet is a window summoned in front of the Courier (the status window, the Book), the world still there behind it. Nothing is a flat
   page under a veil when it could stand in the world.
3. **Maximal, with a strict hierarchy: three layers.** **The hero**: one thing at a time, huge, moving (the claim at Nebula, a title,
   the pool when it is low). **The readout**: the labels and numbers, near their things, at a readable size. **The texture**: data
   rain, hex grids, scanlines, glyph margins, running code: dense, alive, and carrying no meaning, so it can never be misread. If the
   hero is unclear, the texture is cut, never the hero.
4. **Every number that matters has two avenues or more** (the owner's bottles and Lachrimeter): the body or the world (a bottle
   drains, a crack spreads, a pot glows), the overlay (a meter, a tag), a sound (Wanda's), and the log when it changes. The table of
   them: section 9.
5. **Nothing is stock.** Banned: the dark see-through rounded rectangle, a browser's default font, a plain table, a drop-shadowed card,
   a web page's button. Every window has the house's frame (labradorite line on clay matter), the System's type, a corner glyph, and an
   entrance (it is summoned: it unfolds, scans in or glitches in; it never just appears).
6. **Motion is meaning.** A number that changes rolls (an odometer, a slot reel); a window opens and closes as an act; the texture
   layer moves on its own. Comfort holds: nothing flashes for attention, nothing large changes brightness at a variable rate (old rule 7).
7. **One toast: a title** (the owner, 2026-10-15: "toasts are okay as long as they're reserved for achievements of serious note, like
   something that awards a title"). `achievement.unlock` with a `title` opens the one pop-up: a ceremony window, the title rolled in,
   gone on its own; the log says it too. Nothing else pops up.
8. **Gold means won** (kept): a reward, a title, a rarity. Never on a passive mark.
9. **Ambition first, cost after** (the owner: "handicapping you with technical requirements before performance is an issue"). A look
   is built to its target; `npm run perf` measures it at the gate and a cut comes only from a measurement. A brief carries no budget but
   the present's (480 lines).
10. **Each art pass adds a layer.** A placeholder is replaced by something richer than it, never by its twin; the style bible (section
   10) is the target every pass is judged against, not what already exists.

The battle ring keeps its grammar (sections 2 to 5): it is the overlay's mark at the Courier's feet. Its old rule 2 ("no words, no
numbers; beads count to four") now holds for the ring itself only: the ring is a gauge, and a tag or a window beside it may say the number.

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

## 8. The surfaces (2026-10-15)

Four kinds, from the smallest to the biggest. Names are working names, Espada's and the owner's to rule.

| surface | what it is | prior art | first cases |
|---|---|---|---|
| **a tag** | a readout pinned to its thing in the world: a name, a state, a number or two, in the System's type, on a leader line | Watch Dogs' profiler, Dennō Coil | a creature's name, its EmO band and statuses (when Divination reads it); a crystal's fret; a price over the shop's goods; one of the folk's name |
| **the ring** | the gauge at the Courier's feet (sections 2 to 5), kept | Zone of the Enders, Dead Space | as now |
| **a System window** | a sheet summoned into the air in front of the Courier, facing the camera, the world still behind it; the System's frame and type; opened and closed as an act | the isekai status window, Shiroe's menus | the Codex (B) first: the STATUS shelf's radar charts as the status window; then the Pneuka Box (P) |
| **the Book** | the Veritome's binder summoned: its slots and cards as a held object that opens out of the air | Greed Island's "Book!" | the bank (the Book) beside the Pneuka Box; the Major Arcana page |
| **the title toast** | rule 7's one pop-up | an MMO's achievement banner, Persona 5's rank-up | `achievement.unlock` with a `title` |

Raku's tables (`docs/plans/CASINO-CLARITY.md`) were the overlay's first case under these rules: the coach is the readout, Calissa's
table view the window.

## 9. Two avenues or more (rule 4)

What each number that matters already has, and what it lacks. A cell marked "?" is unchecked: Calissa or Wanda says what is there.

| number | the body or the world | the overlay | a sound | the log | lacks |
|---|---|---|---|---|---|
| the pool | the Lachrymato Bottles drain (the reserve) | the Lachrimeter's tube; the ring's band | ? | none | a sound when low; the bottles reading the pool itself, not only the reserve |
| a cap on the pool (cracks) | the vessel's cracks by region | the held stretch on the Lachrimeter | ? | each crack (`vessel.crack`), the cap (`pool.cap`) | a tag on the cracked region |
| cubes | none | the Pneuka Box only | the pickup | each earn and spend (`cube.earn`, `cube.spend`) | a world avenue (a pouch that fills on the belt?) and a readout on change |
| the weather | the weather's look, the vane | none | the ambience | the change (`weather.change`) | a tag when the Dreamvane reads it |
| the game hour | the sky, the Gnomon's shadow | the date stamp (lens only) | the music's thinning at night | none | a readout outside the lens |
| a creature's state | its body (temper), its aura | the bracket at its eyes, the capture circle | its barks | its down | a tag with its name, EmO and statuses |
| a ship's hits on the rail | the hull's damage | ? | ? | the failure | to check on the rail |

## 10. The style bible (Calissa's; a target, never an inventory; first drawn 2026-10-16)

**The look in one line: the System's sight is black labradorite light laid over a world of clay; it writes in dots, it is summoned,
and one thing at a time is huge.** Dennō Coil's glasses over Persona 5's nerve: the city stays warm and solid, the overlay is cold
line and moving type, and the two never trade materials. The mock-up board (the three first cases, then the familiarity ladder and
the terminal; https://claude.ai/artifact/WM69qe38CSnLAJsjLJ5NCo, private to the owner) is the picture of this section; the owner judges it before anything is built (section 11, step 1).

### 10.1 The references board (what each gives; stills on the board, never shipped)
| reference | taken | left behind |
|---|---|---|
| **Dennō Coil** (first) | the cyber layer belongs to the place; two inks (pale line = known, flat black + `NO DATA` = unreadable); a window unfolds at the hands; mosaic blocks mean illegal | its daylight pastel: our light is the schiller on ink |
| Watch Dogs' profiler | detail by gaze: a dot far, a name mid, the full tag on focus; a leader line from the thing to its tag; the scan glitches in | the corporate grey and the sans |
| the isekai status window | `LABEL ······ value` rows, rank letters in bracket squares, sections split by a hairline and a glyph, never by boxes | the blue glass slab |
| Log Horizon's menus | windows stand in the air at chest height, angled to the eye, stacked with a clear order; a hex lattice at 5% behind rows | the frosted white (kept only for the Book's reading pages) |
| Greed Island's "Book!" | the binder summoned with a word; tabs on its edge; a slot shows its card or a ghost number when empty | |
| .hack//IMOQ | the UI is the fiction (the System is the game's code); one glitch means the data drain | the desktop chrome |
| Persona 5 | kinetic type, diagonals, a splash for the big moment; labels tilt 3 to 12°, **numbers never tilt**; three colours a screen | red-black-white as a house palette: ours is clay, ink, schiller, gold |
| TWEWY, Digimon World | the psychic layer marks the real street; pins and glyphs belong to the thing | |

### 10.2 The System's type: a name is carved, a count is computed, a line is read (the owner, 15.1)
| slot | face | size at the 480-line present (whole dots, upscaled ×k) | use |
|---|---|---|---|
| **names** (`--f-name`) | **Cinzel** (bundled), small caps for a heading | 14 to 36 px; the title toast's title up to 72 | a window's heading, a place, a title, a lore name, a Major Arcana: the fantasy |
| **counts** (`--f-count`) | **Jersey 15** with `tnum` | hero 36 to 72 px, a row's label or number 14 px | every number, a rank letter, a blow's readout, a label in a row: the cyber |
| **reading** (`--f-read`) | **DotGothic16** (already the System's) | 14 px, never 12, 16 or 18 | every line of words: a tag's line, a row's line, the log |
Every count that can change rolls: an odometer per digit (0.4 s, 50 ms stagger, overshoot), a slot reel for a word. Text sits on whole
pixels, unsmoothed; an ink outline one dot wide where it crosses the world. Labels may tilt; numbers stand square. No other face.

### 10.3 The frame (a System window)
- **Matter: the player's window colour, fired as the island's dress** (15.3, 15.4). The window's body is opaque (92% or more), the
  window colour (`ui/theme.js` THEMES: kiln, oxblood, midnight, verdigris, umber, and tenmoku, celadon, shino, lapis added) as the
  glaze, pooling lighter at its edges; on Anagami it is glazed clay with kiln marks and kintsugi, on Margarite nacre and lamp brass, on
  Entropolis etched glass and amethyst, at sea rope, tar and spray (Espada names each). Never a see-through navy slab.
- **In three dimensions where it earns it** (15.2): the frame may be a real extruded mesh with cast corner bosses, turning a few degrees
  in the overlay's own scene; the Lachrimeter a glass reservoir holding the pool. Petra's layer, my meshes.
- **Line: labradorite.** A 1-dot outer keyline and a 1-dot inner one 2 dots in, walking the schiller (10.4), chamfered at 45° on two
  opposite corners, one corner folded (Dennō's), a corner glyph in each of the others.
- **The header:** a tab standing off the top edge, cut on a diagonal, its name in the display face (`SYSTEM // STATUS`) and its kana
  beside it in the reading face; a strip under it with the path (`VESSOUL ▸ THE COURIER`), the game hour and the close key.
- **Sections** split by a hairline and a glyph, rows as `LABEL ······ value`, tabs as binder tabs of clay on the window's side.
- **Entrance (0.15 to 0.35 real s):** a point → a line at the summoning hand → the frame unfolds → the body scans in top to bottom (a
  bright band) → the header lands last. **Exit:** the reverse in two thirds the time. Threads of the schiller run from the bracelet to
  the window's corners while it is open (it is the bracelet's sight).
- **A tag** is a small window: no tab; a bracket at its thing's eyes, a leader line (one bend) to a plate with the name in the display
  face, the readouts in the reading face, a pip a familiarity level on its frame (section 13), a barcode of its id at its foot.

### 10.4 The palette
| role | colour | data |
|---|---|---|
| line, type, the System's light | the schiller walking violet → teal → gold → magenta along the line and over time (never stuck on one hue) | `FILM` stops `#4c0fb3`, `#0a8cbf`, `#f2b82e`, `#d91a80`; ink `#17111f`; `schillerInk`, `vfx/oxidation.js` |
| matter you hold | Lachryma's own | tint `#7fdcff`, schiller `#a48cf2`, deep `#2e1a52` |
| won | gold, only for a reward, a title, a rank won | the kintsugi gold |
| a feeling | its own colour, only where that feeling is meant | `progress/weather.js` |
| unreadable | flat black with a hairline schiller edge and `NO DATA` | |
| damage | the clay's crack, on matter only | |
**Three registers** (15.4): the System's (the line, the type, the readout grammar: the same everywhere), the island's dress (the
frame's material, ornament and margin motif), the player's window colour (the dress's glaze). A screen holds three colours at once at
most, besides the world behind it.

### 10.5 The texture layer (meaningless, alive, cut first)
| motif | where | density | speed |
|---|---|---|---|
| **the neuralese script, alive** (15.5) | a window's margins, the screen's edges, the log's gutter | a cellular automaton on the hex lattice (a hexagonal Life, B2/S34, or Lenia): 8 to 12% of cells alive, gliders for idle chatter | a generation every 0.15 to 0.3 real s, each cell easing in and out over 0.15 s (never a strobe); a word **condenses** into a still life; a **flow field** (curl noise) combs motes into a glyph for a big moment |
| hex mesh | behind rows | 5% alpha, 12 px cells | still; one slow drift of brightness |
| ruler ticks | window edges, round a focused tag | a tick every 4 px, a major every 5th | moves only when its thing moves |
| barcode strip, hex ids (`0x5LJ-0217`) | a window's foot, a tag's foot | one | redrawn on a change of state |
| scanlines, a phosphor bloom | the log, the scan band of an entrance | 1 line in 3 at 6% | the band once, on entrance |
**The Comb's reading size, measured (2026-10-16):** a neuralese word written to be read sets its cell at 28 dots (two reading
lines tall) at the 480-line present: every feature stands clear there; at 14 dots six features still touch, so at one line's height the
Comb is texture, never a sentence to read. The board's section 04 counts the merges size by size. The katakana is gone: no borrowed script appears anywhere (the neuralese script is Espada's orthography, my drawing). Nothing in the texture flickers or changes brightness at a variable rate (comfort). If the hero is unclear, the texture goes first.

### 10.5b The owner's notes of 2026-10-17 (they override 10.5's script line)
- **Neuralese is not the hex Comb.** Its reading hand is Thai and Tamil (the owner: "a combo of the two"), its strokes built like
  Goetic seals and chip layouts: "East Meets West retrofuture". Calissa's advice, on the board beside the owner's own option: our own
  glyphs drawn in that hand (loops, bowls, a hanging baseline, marks above and below), since real Thai or Tamil characters read to
  their native readers as broken words. Espada's sounds and syllable rules carry over.
- **The Comb lives on** as the etched barcode on things and the hanko: a seal face stamped in cinnabar.
- **The Pneuka Jar is a hanko and a cartridge** (the owner's idea; its rules Espada's and Dovina's): its base is a seal face carrying
  your name in the Comb, and it slots into things to make them work: larger vessels, machines, the Shrine gates, the ships.
- **3D is the warm direction:** the frames and gauges as meshes, more of them.
- **The Lachrimeter is a globe and a battery:** a glass globe tilted on its axis between thick inscribed clay discs, the anode and
  the cathode, holding the pool.
- **The title toast is a Jōmon placard from the System:** a heavy fired-clay plaque, flame-rimmed and cord-marked, baroque, the title
  carved and gilded, descending from the light and sealed; never cartoonish.
- **The eye tag is the heart of a creature's readout:** more of what it knows is said through the eyes (gaze, attention, pupil,
  shimmer, intent), subtly.

### 10.6 The hierarchy (sizes at the 480-line present)
| layer | size | rule |
|---|---|---|
| **hero** | 36 to 72 px, display face | one at a time on screen (a title, a maul, the claim, a window's total) |
| **readout** | 14 px reading face, 14 to 27 px for its key number | beside its thing, on its tag or row |
| **texture** | 8 to 14 px, 20 to 45% opacity | never over a word, never in the hero's box |
Detail by gaze: a creature far off shows a dot, mid-range its name, on focus its full tag; a tag holds its screen size whatever the
distance and fades past 30 m.

### 10.7 The banned list (rule 5), with what replaces each
| banned | how to know it | instead |
|---|---|---|
| the dark see-through rounded rectangle | `border-radius` + `rgba(0,0,0,.5)`-like fill (13 windows today root in `ui/theme.js`'s `W()`) | tenmoku matter, chamfered and folded corners, the keylines |
| a browser's font | Trebuchet, Segoe, Georgia, `monospace`, `serif` | the three slots (10.2) |
| a plain table | ruled cells, a header row | `LABEL ······ value` rows, hairline + glyph sections |
| a drop-shadowed card | `box-shadow: 0 6px 14px` | the keyline and the glaze pooling at the edge |
| a web page's button | a pill, a bevel, a hover tint | a slot in the frame: its key in a bracket square, the schiller lit when chosen |
| appearing | `display` or opacity snapping on | an entrance (10.3) |
The board shows a picture of each beside its replacement.

## 11. The worklist (in order)

1. **The style bible** (Calissa, section 10), with the three mock-ups. The owner judges them; nothing below is built before.
2. **The title toast** (Calissa's window; the event is there: `achievement.unlock` carries `title`).
3. **The Codex as a System window** (Calissa's look; Dovina's content: the STATUS shelf, the ledger, the arts).
4. **Tags on creatures** (Calissa's look; Dovina's data: what Divination reads at each level).
5. **Section 9's gaps**, one a round, each with its owner.
6. **Raku's tables again**, against the bible: the cloth as a window, the coach's lines in the System's type, the texture layer on.

## 12. The owner's answers (2026-10-16)

- **Damage numbers are not banned; they are earned** ("if you've never encountered a creature before, how would you know how much
  you've damaged it? The granularity of information you have on something is directly proportional to your experience with said
  thing"). Section 13.
- **A standing gets no toast.** The title toast stays for an achievement that awards a title.
- **The windows are private**: only the player sees their own System windows and tags, unless they let someone see them (a guest, a
  sibling: for multiplayer, later; `docs/plans/COOP.md` takes it up).
- **The log is reskinned as the System's terminal: full send.** Section 14.

## 13. Familiarity: what you know of a kind decides what the overlay reads (`src/progress/familiarity.js`)

How well the Courier knows a kind of creature, 0 to 4, is the better of two avenues: the Veritome's understanding of it (photographs of
it doing things: `bestiary.u.<kind>`) and fighting it (`creature.<kind>.down`: 1, 5, 20, 60 downs for levels 1 to 4). A photograph of a
rare moment skips ahead; fighting closes the gap (the design laws). A predicate over the ledger, reset by every build.

| level | name | a tag | health | a blow | more |
|---|---|---|---|---|---|
| 0 | UNKNOWN | none | none: the body shows it | none: the hit's flash and its cracks | |
| 1 | GLIMPSED | its name | a bar in quarters | a mark of its size: graze (under a tenth of its health), wound, maul (over a third) | |
| 2 | OBSERVED | its name | a bar in eighths | the number to its leading figure (~10, ~200) | |
| 3 | STUDIED | its name | the bar | the number | its statuses' build-up named |
| 4 | UNDERSTOOD | its name | numbers (34 / 60) | the number and its multiplier's reason (13 ×2 weak to Ego) | its EmO band, its grain |

- **A blow's readout is a readout, not narration**: it rises off the thing struck in the System's type, sized by the mark (a maul is
  the hero for a beat), and is gone in under a real second. The log never lists blows.
- **The agent sees what the player sees**: `game.agent.observe` gives a creature's readouts at the same familiarity, never the truth.
- **Two avenues for the level itself**: the tag's frame grows a pip a level; the log says a level reached once a kind ("You know this
  kind better: OBSERVED"); the Veritome's bestiary page shows it.
- **The event** (Petra's, 2026-10-16): `creature.struck { kind, dmg, hp, maxHp, kill, type, k, because?, by }` from `strike` after the
  blow lands (`because`: "weak to <Type>" or "annihilation"), and once for every clapperjar down (main.js `onClapper`). `creatures.add`
  gives every creature a `maxHp`. `feedback/tracking/familiarity.js` counts from it; `game.agent.observe` reads at the same level.
- **Asked of Calissa**: the tag and the blow's readout at each level, in the bible's type.

## 14. The log as the System's terminal (the owner, 2026-10-16: "Full send on the reskin")

The log stays the only narration and keeps every rule (events, `by`, throttles); its look becomes the System's own console, as .hack's
ALTIMIT desktop is The World's. Petra's module (`feedback/gamelog.js`), Calissa's look.
- **A terminal, not a chat box**: the System's reading type, monospaced; each line typed in a character at a time (fast: the whole
  line in about 0.15 real s), a block cursor at the chat line's prompt (`>`), scanlines and a faint phosphor bloom on the glass.
- **A channel is a prompt glyph and a colour** (battle, loot, record, art, ach, system, other): the glyph at the line's head, so a
  line's kind reads before its words.
- **A stamp on each line in game hours** (the System's clock), dim.
- **The texture layer lives in its margins**: neuralese glyphs running down the gutter, a line of hex under a record; never over a word.
- **The hero line**: an achievement, an art learned, a title: its line is printed bigger and glitches in (the glitch's own pass, short).
- **Commands answer as a terminal does**: `/howto` and its kind echo the typed command, then the System's reply.

## 15. The owner's second round (2026-10-16): fantasy beside cyber, 3D, the window colour, the islands, a script of our own

> "We're aiming for a mixture of cyber and fantasy; I don't see a problem with some Cinzel too. Also, what about using a combo of 3D
> elements for things like window bordering or a lachrimeter reservoir? Also I liked being able to choose the window color, verdigris and
> oxblood were my favorites but more options was really nice! Calissa's mockups are directionally correct but there's also the baked in
> supposition that all the islands of ego have the same color palette as Anagami Island. Also the neuralese is in katakana but is it
> Espada's conlang? I think we can do something more novel with the presentation, like flow field distribution or conways game of life
> type shi. Our own glyphs too, let's get ambitious." (the owner, 2026-10-16)

### 15.1 Three faces: Cinzel names, Jersey counts, DotGothic reads
Cyber and fantasy, each with its own job, so neither is decoration:
- **Cinzel** (the fantasy, engraved Roman capitals): **names of the world**: a title, a place, a lore name, a Major Arcana, the title
  toast's title, a System window's heading.
- **Jersey 15** (the cyber, pixel display): **the System's counts**: numbers, rolling numerals, a blow's readout, a rank letter, a label
  in a row.
- **DotGothic16** (reading): every line of words: tags' lines, rows, the log.
Calissa sets the split in the bible; the principle is the owner's mix and stays: a name is carved, a number is computed.

### 15.2 3D in the overlay
Frames and gauges may be **real meshes**, lit and turning: a System window's border as an extruded frame with corner ornaments; the
Lachrimeter as **a glass reservoir** with the pool's liquid in it (the Lachryma shader, its level the pool, its slosh the Courier's
motion); a Possibilikey or a tool's icon as a small turning model. Prior art: Dead Space's RIG (holograms projected from the body),
Metroid Prime's visor (the glass you look through), Ratchet & Clank's quick-select (3D models in the ring), Persona 5's menus. It is
drawn in the overlay's own scene after the world, at the 480-line present, so it pixelates as the world does. Petra's layer (render),
Calissa's meshes. Ambition first: built to the target, measured at the gate.

### 15.3 The window colour stays the player's, with more of them
The setting already exists (`ui/theme.js` THEMES: kiln, oxblood, midnight, verdigris, umber; the owner's favourites verdigris and
oxblood). The bible's frame is built **on** it: the window colour is the glaze of the frame's matter, never a fixed tenmoku. Tenmoku
becomes one window colour among them, and more are added (celadon, shino, lapis, ash, ...). Every window, tag and toast honours it.

### 15.4 Every island its own dress (REGISTERS.md)
The overlay has three layers, by register:
- **The System's** (the same on every island and at sea): the labradorite line, the three faces, the readout grammar, the hierarchy.
- **The island's dress** (island-local): the frame's material and ornament, the texture layer's motif, the toast's flourish. Anagami:
  glazed clay, kiln marks, kintsugi. Margarite: nacre and lamp brass, the King's marque. Entropolis: etched glass and amethyst. The
  Emocean: the sea's own (rope, tar, Lachryma spray). Espada's names (ruled by the owner, 2026-10-16): **Clay** (Anagami), **Nacre** (Margarite: mother-of-pearl, lamp brass, the marque as a hallmark),
  **Glass** (Entropolis: etched glass, amethyst, frost geometry), **Brine** (the Emocean: rope, tar, salt crust, knots, Lachryma spray).
  Calissa dresses each; the dress changes when you land.
- **The player's window colour**: the colour of the dress (15.3).
So the mock-ups' clay is Anagami's dress, not the overlay's; a window on Margarite is the same window in nacre.
**Ruled** (the owner, 2026-10-16): the window colour is the colour, the island the material. "Very very resonant with the idea that
you're in a foreign environment that changes you. (Very Kingdom Hearts 2!)" Prior art: Kingdom Hearts II's command menu, skinned by
the world you are in (Halloween Town's, Port Royal's, Space Paranoids'), as Sora's own form changes with it. The dress changes under a
seam when you land, so the moment of arrival is the moment the interface changes: one of the overlay's hero moments.

### 15.5 Neuralese: our own script, alive
**What it is now:** Espada's conlang, 22 words (STIL, HUSA, LUNO, HEMA ...: `npc/neuralese.js` LEXICON), written in Latin capitals in
code; LORE.md says "drawn as runes", but no script exists yet. **The katakana in the mock-ups is a placeholder** borrowed from the
Matrix's rain: not ours, and to go.
**What it becomes** (working name: **the neuralese script**):
- **Our own glyphs, decipherable.** A featural script on one frame (a hexagonal lattice: the labradorite's hex net), each glyph built
  from strokes that stand for sounds, so a player who studies can read it (Tunic's runes, Fez's alphabet, Hangul's featural design).
  The Crib Sheet and the ostraca (`progress/ostraca.js`) become the Rosetta: a glossed word shows its English beside the glyphs. The
  design law holds: the mechanic teaches a real thing, decipherment, without a tutorial.
- **Alive on screen, by rules, never by animation.** The texture layer runs **a cellular automaton** (Conway's Life, or a continuous one,
  Lenia) on the hex lattice: neuralese is what settles out of it. A word being written **condenses**: cells live and die until the
  glyph is a still life. Idle chatter in the margins is gliders. **A flow field** (curl noise, Tyler Hobbs' flow fields) carries motes
  that comb into a glyph's strokes, for big moments (a title, an awakening's line, reprogramming a mind). Prior art: Arrival's
  logograms (ink condensing into a ring), Conway, Bert Chan's Lenia, the demoscene.
- **Espada's orthography** (ruled by the owner, 2026-10-16: "I'm on board"; `docs/LORE.md`, "The neuralese script", on `claude/espada-lore`): a syllable is one
  flat-topped hex cell; consonants are strokes inside its border (top half the onset, bottom the coda; the edge the place, the stroke the
  manner, a dot for voiced); vowels are spokes from the centre (*a* the dot alone); a word is a chain of cells, a modifier half a row
  below, an empty cell a break, a six-spoke star a sentence's end. Every stroke lies on the hex sub-lattice, so the automaton can settle
  into it. **It must read at the overlay's reading size** at the 480-line present, not only in a close-up: Calissa proves a sentence
  at real size before the script is built into a surface.
- **Owners:** Espada, the orthography (which sounds, which strokes, how a word is built); Calissa, the glyphs' drawing and the
  automaton's and flow field's look; Dovina, the decipherment's progression (the Crib Sheet's ladder, what reading the script earns).

## Note on the merge

Where the two files differed, the later wording is kept. Rule 6 once put the Flash's readiness "in the viewfinder's margin"; the Flash
ruling (2026-10-06, after the rule's draft) puts it on the capture circle's outer rim, and the margin holds the photograph's quality
(section 5). Rule 7 now carries the look's "one pulse on a change of state". Repeats are cut: the gold sentence and the quiet
ring stand once (rules 4 and 5). No number or decision was dropped.
