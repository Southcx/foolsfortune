# The look: visual motifs and precepts (draft)

What each kind of thing in Fool's Fortune looks like, so that a new feature knows how to draw itself before it is drawn. A
draft for the owner to cut and correct; kept by the Art division (Calissa). Every precept names what it is for, its colour,
line and motion, what already follows it, and what would change. CLAUDE.md's rules (the log is the only text feedback, marks in
the world are not text, no variable-rate flicker, the PS2/GameCube target) are assumed throughout.

The game's three materials of meaning are **clay** (the world and its folk), **Lachryma** (the substance: what things are made
of and spend) and **the Mind** (psychic technology, the System, sensing, targeting). Each has one visual language and they do
not borrow from one another.

## 1. Clay is solid, warm and outlined

The world, its folk, the clapperjars, the pots. Solid surfaces under the soft cel ramp (`render/toon.js`), a dark ink outline
(`outline.js`), terracotta palette (`PALETTE` in `config.js`, `PAL.clay` in `ui/pixel.js`). Built surfaces are plaster, fired tiles,
planks and brick (`vfx/surfaces.js`): one modest tiling texture multiplying a palette colour, the PS2 way. Clay moves by squash,
wobble and settle; it breaks into shards; it never glows except where it holds Lachryma or a kiln's heat.

- Follows it: the workshop, the pots, the folk, the clapperjars.
- To change: the lab, hub, siege and circuit rooms are one orange-red; each room should get its own clay (see **Palettes** below).

## 2. Lachryma is matter, never line

Near-black liquid with a thin-film sheen (violet, teal, gold, magenta) where it catches the light; cream and warm when fresh out
of clay, darkening through amber to black (`lachryma.js`), condensed into cubes (`cubes.js`), carried as beads, held in a glass
tube (`ui/lachrimeter.js`), worn as a thin rim on what holds it (`render/toon.js`). How much there is is shown by **volume, fill and
brightness**, never by a digit.

- Follows it: the Lachrimeter, the beads, the cubes, the rim, the dissolve.
- To change: the "100" beside the Lachrimeter (the tube already says it). The maker's three filigree masks for the Courier's
  armour (`source_assets/courier_filigree_*.png`) could be the most diegetic gauge of all: her armour's filigree lights with
  her Lachryma (a line that glows with its load beats a gauge). *Waiting on the owner: what the three masks are for.*

## 3. The Mind is wireframe

Psychic technology, the System, sensing, targeting, reprogramming: drawn as **lines, not surfaces**. One-pixel (at 480 lines)
additive lines in the mind's indigo-violet (`PAL.mind`: `#7650b8` to `#d2c3f4`), with a hot near-white on the edges that matter.
A wireframe **bursts in once** (grows from a point or closes from wide), then **holds or turns at a constant rate**; it fades out;
it never blinks or pulses at a variable rate. Low-poly on purpose (under ~40 segments: an icosphere, a dome, a ring of ticks).

Prior art: Vagrant Story's battle sphere (a wire sphere bursts out of Ashley; its radius is the weapon's reach and what is inside
lights), Parasite Eve's range dome (a low-poly wire dome stands around Aya while she chooses), Elemental Gearbolt's closing
frames (a box shrinks around what is about to fire: the closing is the warning and the timer), Rez's mind-space (wireframe is
the inside of a network; lock squares count to eight without numerals), Zone of the Enders' ring radar on the body.

- Follows it: the chevron's bright edges, the god-art ghost box (`godarts.js`), Reprogram's lattice (indigo).
- To decide: the chevron and the lock-on reticle are warm/gold today. Either they stay gold (they are *yours*: see 4) or the
  chevron becomes Mind (it is the System telling you what F would do). Proposal: the chevron becomes Mind; the lock-on stays gold.

## 4. Gold is yours

Gold (`PAL.gold`) means a thing is yours, won, or locked by you: the lock-on, a reward, an achievement's line in the log, a chest's
rarity. Kept off passive marks so that it keeps its meaning.

## 5. Reach is a volume on the body; state is a frame on the target

What the Courier can do is drawn **around her** (a dome, a ring at her feet); what a thing is doing is drawn **on it** (a closing
frame, a glyph, dizzy stars). Never a sentence for either.

- To change: the god-art cursor tip ("OUT OF REACH", "not yet learned") becomes a reach dome that the cursor is inside or not.

## 6. Magnitude is hue, size and closure

How near, how much, how soon: a ring's radius, a frame's closing, an arc's fill, a hue from cool (far, safe) to hot (near, now).
Not numerals.

- To change: the homing reticles' order digits (nesting squares instead, Rez), the compass waypoint's metres, the speed readout
  (a tuning tool: to the debug panel).

## 7. Words live in windows; the world gets punctuation

The log, the dialogue box and the menus are the windows of words (the maker's frames, the four faces of `ui/theme.js`). In the
world and on the HUD there is only punctuation: a glyph (`!`, `?`, `…`), a chevron, a frame, a bar.

- To change: the top-left room banner (key help and a live timer; it collides with the compass at the Weir), the compass's
  "M mind map · N survey" line, the log's key-help footer, the key help on the signs in the world, the trial's "3 2 1 GO!"
  (rings off the gong and a glyph pop on GO). Key help belongs in the Codex, or said once by the log on entering a room.

## 8. Comfort

Large wireframe volumes are low alpha, depth-tested, and shown only while the player is choosing. Nothing large changes
brightness at a variable rate. Motion in the world is things actually moving.

## Proposed persistent 3D HUD (the Mind's layer, in the world)

| Element | Replaces / joins | Prior art |
| --- | --- | --- |
| **Lachryma ring** at the Courier's feet: a filled arc of the pool, a paler arc of the reserve, the blink charges as beads on it | the Lachrimeter panel's always-on space (the panel could appear only when it changes) | ZoE's ring radar, Dead Space's spine gauge (the gauge on the body) |
| **Reach dome**: a low-poly wire hemisphere while an art or a weapon is readied | "OUT OF REACH" | Parasite Eve, Vagrant Story |
| **Threat arcs**: an arc on the ring facing each creature aware of her, cool to hot by distance | nothing yet | ZoE, Metal Gear Solid's alert |
| **Wire compass**: a tape of ticks at the horizon, the waypoint a wire diamond in the world | the compass block (the map stays on M) | Metroid Prime's visor, Skyrim's tape |
| **Homing squares**: nested wire squares on each locked target, order by nesting | the digits | Rez |
| **Trial rings**: rings off the gong for the count, a glyph on GO | the centre-screen countdown | Gearbolt's closing frames |

Together the ring, the compass and moving the speed and hint lines out free about 15-18% of a 960x540 frame.

## Palettes (proposal: each room its own clay)

Every room is terracotta now; a room should be told apart from its neighbours by its clay and its light, as Kingdom Hearts and
Jak told worlds apart by palette. Proposed families (the walls / the floor / one accent):

| Room | Clay | Accent |
| --- | --- | --- |
| The workshop | red earthenware (as now) | kiln orange |
| The hub and the index | grey stoneware, unglazed | celadon (the console) |
| The movement lab | buff bisque, a test-room grid | ochre |
| The mill and the kiln stack | iron-red and soot | ember |
| The siege | black basalt and raku white | oxblood |
| The circuits | porcelain white, blue underglaze | cobalt |
| The dunes | (the painted sky decides: as now) | |

## Not yet decided

- The three filigree masks (see 2).
- Whether the chevron joins the Mind (see 3).
- Which of the 3D HUD elements to build first (proposal: the Lachryma ring, then the reach dome).
