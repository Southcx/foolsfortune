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

## 3. The Mind is black labradorite, and drawn in lines

Mental energy, focus and psychic technology (the System, sensing, targeting, reprogramming) are Lachryma's **black, iridescent,
ultraviolet** face, after the owner's own Lachryma shaders, whose main influence was **labradorite**: a near-black stone with a
flash of colour (its schiller) that comes up when it is turned, mostly blue and ultramarine, sometimes peacock, green, gold or copper,
edged in violet. One module draws it: `vfx/labradorite.js`.

- **Lines** (wireframes, reticles, edges) are the schiller itself, **very softly rainbow**: the stone's palette leaned toward a pale
  ultraviolet, its hue a function of where the line is and where it is seen from. Additive, one pixel at 480 lines.
- **Surfaces** (a marker's body, a dome, the Courier's filigree) are **ink with the schiller coming up through it** at the turn of
  the surface, in broad bands that move with the eye like oil on water.
- **Motion**: a wireframe bursts in once (grows from a point or closes from wide), then holds or turns at a constant rate; its
  colours move only with the eye and a slow constant drift. Nothing blinks or pulses at a variable rate. Low-poly on purpose
  (under ~40 segments: an icosphere, a dome, a ring of ticks).

Prior art: labradorite and spectrolite; the thin-film (oil, soap) shaders; Vagrant Story's battle sphere (a wire sphere bursts out of
Ashley; its radius is the weapon's reach and what is inside lights), Parasite Eve's range dome (a low-poly wire dome stands around
Aya while she chooses), Elemental Gearbolt's closing frames (a box shrinks around what is about to fire: the closing is the warning
and the timer), Rez's mind-space (lock squares count to eight without numerals), Zone of the Enders' ring radar on the body.

- Follows it: the chevron (`vfx/chevron.js`), the lock-on reticle and the angler's brackets (`angling/reticle.js`), the sounding
  pulse (`vfx/pulse.js`), the god-art ghost box's edges (`godarts.js`), and the 3D HUD below.

## 4. Gold is yours

Gold (`PAL.gold`) means a thing is yours or won: a reward, an achievement's line in the log, a chest's rarity, kintsugi. Kept off
passive marks so that it keeps its meaning. (Targeting is the Mind's, not gold: see 3.)

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

## 9. Motion: exaggerated, whimsical, grounded

The owner's direction for how things move: exaggerated movements, whimsical and a little cartoonish, but still grounded, as Monster
Hunter's animations are. In practice:

- **A silhouette per tool.** Every Lachryma tool has its own idle stance, known from across a room (`src/anim/stances.js`): the
  Dreamvane a pilgrim's upright crook held high in both hands; the Soul Brush on the shoulder like Monster Hunter's hammer, the other
  hand on the hip; the cutlass a fencer's low guard with the free hand up behind; the rod held out over the water; the Crucibelle a
  handbell by the ear, head tipped to listen; the Lockheart held to the ear like a ticking watch; the Veritome read at the chest.
- **Captured motion, pushed.** Clips come from the free libraries (UAL, CMU) and are modified, not replaced: their swing from their
  own average is exaggerated (1.3 to 1.5 times), and a pose is laid over them. The weight and timing stay the capture's (grounded);
  the shapes are pushed (cartoonish).
- **Clear poses, clean arcs.** A stance has one strong line through the body and the tool; no limb crosses the face or passes
  through the body; a held tool is held where its weight would want it.
- **Anticipation and follow-through on actions**, timed to the game's own beats (a move's timings are its feel and do not change:
  the clip is time-warped onto them, as the carry is).

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
- Which of the 3D HUD elements to build first (proposal: the Lachryma ring, then the reach dome).
