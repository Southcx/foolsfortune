**2026-10-08, from Calissa (Art): Soul Alchemy's UX (section 4 of SOUL-ALCHEMY.md), the seven seals, what fights the look; and my rows of TRAINING.md section 5**

Your asks, answered in this one note. Paste section 4 over your draft as it stands, or cut it to your taste: the look is the spine, the
numbers are mine to hold, and everything marked "needs Dovina" is yours to rule.

**The one look: test tiles in a glaze bath.** The colour wheel is a dished basin of still Lachryma at the press's feet, fed by the press
the way a bamboo spout feeds a garden basin. The seven attributes are glazed test tiles lying in it. Your soul colour is one bead of
glaze riding the surface. A match is seen, never told: at a tile's heart the bead melts into the tile's glaze, and only its glint is left.

**Where it departs from your draft, each measured (section 4.1):**
- The bath leaves the drum. The drum's pool shows about 70 px wide from the overhead view, so the bath becomes a 5 m basin.
- It has a camera of its own, the press view. The overhead view turns, and a colour wheel must hold still while the eye learns it.
- The bath is neutral, not lit in the soul colour (Albers: a colour is judged on grey).
- The seals are carved in the kerb, not on the tiles. At rank 9 a tile is 20 px wide, so a glyph on it would cover it.
- "A drop of glaze" becomes **the soul bead**. In 7a, "drop" is loot.

**What I need from you (rulings; the conflicts section has each with its fix):**
1. The painter's rule for paths: each material pulls toward its own colour, so complements grey by themselves. Today a path turns by a
   coin toss, so a lump's colour says nothing about where it walks.
2. Seasoning grows toward a ceiling (r_rank + (0.13 - r_rank) x seasoning). Today rank 0 seasoned, times the formation, overlaps all seven.
3. The formation sets the fuel, not the radius.
4. A tile's heart is a quarter of its **bare** radius, so "true" still means skill.
5. One firing per press. Today ten pulls take an attribute from 0 to 10 off one press.
6. The draught's step keyed on `game.draught`, not on brimming, which lasts 2 real seconds.
7. One feeling colour table for the game (four disagree today).
8. 7a's memory taken only with the pull.

Who builds what is at the end of section 4: the look is mine (`vfx/spiritpress.js` refired, a shared `vfx/wheelcolour.js`, `vfx/alchemy/`),
the station and the press view's camera are Petra's. I build the look when the rulings land.

---

## 4. The UX (Calissa's)

**One look: test tiles in a glaze bath.** The colour wheel is a dished basin of still Lachryma at the press's feet. The press pours into it the way a bamboo spout pours into a garden basin (the tsukubai and its kakei). Seven glazed test tiles lie in the basin like stepping stones, one for each attribute. Each attribute's seal is carved into the stone kerb at its bearing. Your soul colour is one bead of glaze riding the surface. Everything that moves does something real glaze does: it pools, runs onto the shelf, breaks thin over an edge, crawls when refused, sets in the fire and shrinks with the clay. The ground is neutral so that every colour reads true. A match is seen, never told: at a tile's heart the bead melts into the tile's glaze, and only its glint is left.

Three rules hold everywhere:
- **No number, word or tick on the bath.** Numbers and names live in the log and the Codex. On the bath, size, depth, gloss and motion show how much. A hue only ever means a place on the colour wheel.
- **Every distinction is carried four ways:** position (bearing and distance), shape (the seals, the tiles' outlines), value and gloss, and motion. Colour is a fifth way, on top. That fifth way is the one the bath trains.
- **One colour function.** Every colour at the press comes from `wheelColour(h, s)` (4.16), so the bead and its tile can actually match.

Times are real seconds. Sizes are pixels at 480 lines in the press view, fully zoomed out. They were measured on a sketch at true scale (the last section), not in the engine.

### 4.1 The fixed points: what is kept, and where this departs
- **Kept:**
  - no numbers on the colour wheel;
  - seven glazed tiles that swell with seasoning;
  - the soul colour as a bead of glaze;
  - the hopper's materials drawing their paths ahead as faint trails (Potion Craft);
  - a complement visibly greying the bead toward the centre;
  - a true firing bringing that attribute's hue-ring light close to burn;
  - a glyph for every attribute as well as a colour;
  - the soul glow brighter on the Courier when you leave.
- **Departs: the bath leaves the drum.** On the model (`vfx/spiritpress.js`) the drum's pool is 1.8 m across, with the trunk standing on it and the platter and crown roofing it. From above, about 12 cm of its rim shows. At the overhead view's nearest zoom (9 m up, a 70° lens) the whole pool is about 70 px wide. So the bath becomes a 5 m basin at the press's foot, fed by the press. It is still the press's bath, because the press pours into it. The drum keeps its own pool (as built), now called **the drum's pool**.
- **Departs: not the overhead view.** The press gets a camera of its own, **the press view** (4.3). The overhead view turns and zooms, and a colour wheel has to stay put while the eye learns it.
- **Departs: the bath is not lit in the soul colour.** A colour is judged on a neutral ground (Albers). The soul colour shows in the soul bead, the press's eye, the crucible's bead and the thread, never across the bath.
- **Departs: the glyph is carved in the kerb, not on the tile.** At rank 9 a tile is 20 px wide and its heart is 5 px, so a 16 px glyph on the tile would cover both. In the kerb, the seal never moves, never shrinks and is never covered.
- **Departs: the hue ring's lights hold still in the press view.** A light drifting round the press would put a hue in the wrong place. While the press view is open, each light settles into its seal (4.6).
- **Renamed: "a drop of glaze" becomes the soul bead.** In 7a, "drop" is loot, and a rare drop is already the deck's word. The crucible already holds "a bead of the soul colour".
- **Departs (needs Dovina): a tile's heart is a quarter of the tile's bare radius,** not of the radius now. Seasoning widens where a firing counts, never where it is true (conflicts, 4).

### 4.2 Where it stands
- **On the Athanor's crown**, replacing the placeholder pill furnace (`world/garden/place.js`):
  - **The basin:** 5 m across, sunk level into the crown.
  - **The kerb:** a ring of dark basalt 0.45 m wide, with its inner arris in shadow.
  - **The ware ring:** a step 0.5 m wide just outside the kerb, a hand lower.
  - **The press:** 4.35 m north of the basin's centre, facing it.
- **The spout:** a root grown out of the drum's front lip, reaching over the ware ring and the kerb. The soul's thread runs from the eye's drop down through the hourglass and along the root into the bath, where it lands in the gap at north. The hourglass and the lantern stay on the drum, off the colour wheel.
- **The plate shrine** moves to a small hokora on the crown's east shoulder, with its own F. Today F at the Athanor opens THE PLATE SHRINE page.
- The interact chevron shows over the basin while the Pneuka Jar is within reach of the kerb. **F** opens the press view, and the Jar stays where it stood, just below the frame.

### 4.3 The press view
- **Opening (0.8 s):**
  - The camera eases from whichever garden view it was in to the press view, narrowing its lens as it climbs (a dolly zoom), so the bath arrives flat, like a map.
  - Over the same 0.8 s the garden outside the kerb eases to a neutral grey: the sky's draught tint, the fog and the haze (Okami's still canvas; the colour booth's grey surround).
  - The hand gives a **`beckon`**. The seven lights drop out of their orbit one at a time, clockwise from Willpower, 0.08 s apart. Each settles into its seal and lights the carving from within, with one soft tuned tick each (Wanda's).
  - The soul bead wells up out of the dark at its place (0.3 s).
- **The framing:**
  - A 44° vertical lens, 12.6 m from a point 1 m north of the basin's centre, pitched 68° down.
  - North is locked to the press, so the framing is identical every time and a bearing is learnt once for good. Q/E do not turn the view, and the number keys sleep. The hand is GRAB throughout.
- **What the frame holds (853 × 480):**
  - the bath, about 245 px across, a little below the middle;
  - the kerb and its seals all round;
  - the ware ring down to the bottom edge;
  - the press's face in the top 100 px: the spiral mouth, the eye under it, and the lever's ball at the top right.
- **The mouse wheel zooms up to 3×** by narrowing the lens. The view leans toward the hand and follows it to the frame's edge, then settles back as you zoom out. At 3× a rank-9 tile is about 60 px wide and its heart about 15 px. The top ranks are judged zoomed in.
- **Self-lit:** the tiles, the seals' glaze, the soul bead, the ghost paths and the droplets are self-lit and unfogged, so neither the game hour nor the haze shifts a hue.
- **Leaving (0.5 s): F, Esc, or W A S D** (the Jar steps back from the kerb).
  - The hand gives a small **`shoo`**, and the lights rise out of their seals and drift back into orbit round the press.
  - The bead sinks, the line blend clears, the camera returns to the view it came from, and the garden's colour comes back.
  - Nothing is lost. Lumps waiting in the mouth go back to the ware ring, because a lump leaves the Pneuka Box only when it is pressed. Whether the lever is cocked is kept in the save.
  - Nothing of the press view stays on screen.

### 4.4 The bath: the colour wheel
- **A neutral dish.** Still black Lachryma over a dished floor:
  - At **the grey centre**, a disc of bare unglazed grey clay 25 cm across lies under a thin skin of liquid and reads pale. A new Courier's bead rests here.
  - The floor deepens toward the lip, so the bath darkens to black there.
  - So how grey the soul is reads as how pale and shallow the water under the bead is, for every eye.
- **No oil film on its face,** because the film's rainbow would lie about colour. The film lives only in the meniscus at the lip.
- **The surface is still while you think.** It stirs only while pressing (the three slow arms, as built, read as sheen and never as colour), or under the draught's current (4.11).
- **Hue is the bearing**, rising clockwise as seen from above. The press stands over the gap between Resilience and Willpower (hue 354.5 at north), so no tile sits against the press's face. Warm hues run down the right side and cool ones up the left. Each tile's bearing:

| tile | bearing |
|---|---|
| Willpower | 1 o'clock |
| Focus | half past two |
| Charisma | a quarter past four |
| Perception | 6 o'clock, nearest the Jar |
| Dexterity | a quarter to eight |
| Visualization | half past nine |
| Resilience | ten past eleven |

- **Saturation is the distance** from the grey centre out to the lip, where colour is most vivid. The tiles sit two thirds of the way out: a bead that is too vivid overshoots its tile, and one that is too grey falls short.
- **The throwing lines:** three faint rings, like those a potter's fingers leave on a wheel head. They sit a third of the way out, on the tiles' circle, and at the lip, so distance reads without colour.

### 4.5 The seven tiles: the swatches
A swatch is drawn as three things: **the tile** (its rank), **the spread** (its seasoning) and **the heart** (where a firing is true).
- **The tile:**
  - A glazed test tile laid flush on the tiles' circle at its bearing, glazed in its target colour (`wheelColour(hue, 0.65)`). Each glaze is named after a real one: the table in 4.6.
  - Its glaze's character lives only at the rim, where the glaze breaks thin. The middle is flat, exact colour, so that a match can vanish into it.
- **The tile's size is its rank.** Its width is twice its radius at that rank: 1.2 m at rank 0 (about 57 px), down to 0.4 m from rank 9 on (about 20 px). Each firing shrinks it a step, as clay shrinks in the kiln.
- **The tile's body is its rank too.** The clay shows at the tile's edge, where the glaze breaks thin, and climbs the folk's ladder as it ranks:
  - matte raw clay at rank 0;
  - red earthenware (ranks 1 to 3);
  - grey stoneware (4 to 6);
  - white porcelain, translucent at the edge (7 to 9);
  - a gilt rim at rank 10, the Prince's own.
  - The ladder reads by lightness as much as by colour.
- **The spread is the seasoning:**
  - A seasoned tile's glaze runs off its edge and pools on the bath round it, translucent and glossy, like glaze run onto a kiln shelf.
  - The spread reaches exactly to the swatch's radius now (the counted edge). Its edge is **the spread's break**: a thin pale line where the glaze thins, so the edge reads by lightness.
  - Two spreads never touch, which needs the ceiling (conflicts, 3). A dark seam of bath always shows between neighbours, at least 5 px.
- **The heart:**
  - A fine bright ring scribed in the glaze round the tile's centre, a quarter of the tile's radius: about 14 px across at rank 0 and 5 px at rank 9.
  - It is always written in full as "a tile's heart", because the Lockheart's coffin has a heart.
- **A finished tile (rank 10):** gilt-rimmed and glassy, with no spread and its yohen stars on its face (4.13).

### 4.6 The seals and the hue ring's lights
- **The seals:**
  - Each attribute's seal (the potter's chop) is carved into the kerb at its tile's bearing, 16 px, standing upright toward the press and never turned round the circle.
  - The cut is filled with the tile's glaze, as glaze pools darker in a carving (Yaozhou's carved celadon).
  - While the press view is open, the attribute's light sits in the carving and lights the glaze from within. Measured on dark basalt, a lit seal stands 6.7:1 to 8.7:1 against the stone, so all seven read in grey and under every colour-blind simulation (the last section).
  - The full table, with the 16 px drawings, follows this section.

| attribute | hue | the tile's glaze | its seal |
|---|---|---|---|
| Willpower | 20 | kaki (persimmon iron) | the Peak |
| Focus | 71 | ki-seto (yellow Seto ash) | the Still Point |
| Charisma | 123 | oribe green | the Fan |
| Perception | 174 | Persian turquoise | the Gaze |
| Dexterity | 226 | cobalt | the Swift |
| Visualization | 277 | Jun lavender | the Finder |
| Resilience | 329 | peach bloom | the Tumbler |

- **The lights** answer the bead and never move otherwise:
  - When the bead enters a spread, that attribute's light lifts out of its seal (0.5 s) and hangs over its tile, leaning in. Its seal stays lit, dimmed to an ember, so it still reads.
  - In the tile's heart the light stops bobbing and its halo tightens.
  - When the bead leaves the spread, the light goes home to its seal.
  - At a firing the light comes down into the tile (4.13).
- **The bath never names a tile.** The Codex's attribute page shows each seal beside its name, rank and seasoning (a window of words, which is allowed). The log names an attribute at each firing.

### 4.7 The soul bead: the soul colour
- **The bead:**
  - One bead of glaze riding the surface, 12 cm across (about 6 px, 18 px at full zoom), in `wheelColour(h, s)`.
  - A dark meniscus a sixth of its width rims it, and one white glint at its centre marks its exact point: the glint is the point the press measures from.
  - It trembles faintly at rest and sends out a small ring when it stops.
- **The match:** at its tile's heart the bead is the tile's own colour, so its edge melts into the glaze and only the meniscus and the glint stay. That vanishing is the match.
- **The concentric seat:** at rank 9 the heart (10 cm) is a little narrower than the bead. Seated true, the bead hides the heart's ring all round. Off by a hair, the ring peeks out on one side, a judgement the eye makes to the pixel (vernier acuity). At lower ranks the bead sits inside the ring.
- **Near grey** it keeps a cast, so a warm grey and a cool grey read apart. On the grey centre it is the clay's own grey.
- **At the lip** it presses into the meniscus and rides up against the kerb: it can get no more vivid.

### 4.8 The ware ring: the materials
- **The ring is the Pneuka Box's materials, laid out:**
  - Each material lies on the ware ring at its own hue's bearing, like the wells of a painter's plum-blossom palette.
  - In hue order round the bath it is a Farnsworth-Munsell row: neighbouring lumps ask the eye "which is warmer?".
  - Several of one material make a heap of one to five lumps. Materials at nearly one hue lie in a short row outward, three deep at most.
- **It is a view of the Box, not a store.** A lump leaves the Box only when it is pressed.
- **A lump's look:**
  - It wears its own hue and saturation (its lived colour, if 7a is ruled in).
  - Its form is its kind's winding (Atelier): a coil for a spiral, a toothed shard for a zigzag, a crescent for an arc, a rod for a line.
  - A rarer lump is bigger and glints.
- **The ring only tells the truth with the pull** (conflicts, 1). Until Dovina rules on it, lumps lie in plain unglazed clay at their kind's arc, because a coloured lump that walks the other way would teach the eye a lie.
- The Box's own material icons are palette-swapped to the same colours (`ui/pixel.js`), so choosing in the Box trains the same eye as the bath.

### 4.9 Loading the hopper: the ghost paths
- **Hover a lump:**
  - It lifts a finger's breadth, and the hand takes **`point`**.
  - Its **ghost path** draws on (0.25 s). It starts from the soul bead, or from where the lumps already waiting would leave it. It is a soft ribbon 2 px wide along the exact path the lump would walk, in the colours it would pass through.
  - It ends in **the ghost bead**: a hollow ring in the colour the bead would be. Before pressing, you compare that ring's colour with the tile it lands in.
- **A step at one saturation is an arc round the centre,** so a ghost path curves: a colour is reached by a path, never by a jump.
- **The ghost bead over a spread:** that spread's break brightens and holds (steady, never pulsing), and its light leans a little out of its seal. This plan lands here.
- **A path that greys** is drawn bending in toward the grey centre, and its ghost bead goes matte before the bead ever gets there.
- **Loading:** **`pinch`** the lump, carry it (the lump swinging a little behind the hand), and **`release`** it over the crown's spiral mouth (0.3 s). It falls into the spiral, which turns a quarter, and circles the mouth with the others in order (five at most: the model's queue). Its path firms and dims, with a small hollow ring at the end of each material's walk. The first walk is the brightest, and each after it is fainter, down to a third.
- **Taking one back:** **`flick`** a lump circling the mouth (the right button, as for a spirit). It springs back to the ware ring, and every path after it redraws from the earlier end. The order is the craft, and changing it is free until the press runs.
- **The preview never lies.** The ghost paths include everything the press will do: the pull, the greying, the draught's step (4.11) and a working spirit's extra step (section 7). They are drawn from the same function the press uses (the build list).

### 4.10 Pressing
- **To press:** lay the hand flat on the spiral mouth and hold the left button (**`press`**, the pat clip looped).
  - Wind-up (0.25 s): the press dips 2 cm and both spirals turn. The lever's ball rises: the press is cocked.
  - **One material at a time.** Its lump spirals into the mouth, and the thread runs from the eye down the root into the bath. The bead walks the path in 3 to 5 glides of 0.2 to 0.33 s, each easing out and settling. That makes about a second a material, with a 0.15 s beat before the next.
  - Let go, and the press stops after the material it is on; the rest wait in the mouth. Hold Shift for twice the speed. Click while a material walks to finish it at once (0.15 s).
- **The line blend:** each step leaves a droplet of glaze in the colour the bead had there. This is the potter's row of test tiles walked from one glaze into another: the gradient you pressed stays on the bath until the next press begins or you leave. Neighbours blend through the colours between them, and a complement crosses through grey.
- **A complement:** the bead loses its gloss as it slides toward the grey centre, its colour draining, and a dull grey ring folds in from it toward the centre (0.4 s). It is seen in position, gloss and value, and heard as the tritone resolving into the drone (Wanda's). The gloss comes back when it stops.
- **Inside a spread:** rings run inward through the spread's glaze toward the tile's heart. They are quick near the break and slower as the bead nears. In the heart they stop, and the glaze lies still as glass under the light. This is Wanda's beating, seen: motion, never a blink. Only one spread ever ripples at a time.
- **Aqua regia:** a gilded material makes the bath fume gold-orange for about 4 s (as built). The neutral ground comes back as it clears.

### 4.11 The draught's current (3.4)
- While the draught's step applies (conflicts, 7), a slow current crosses the bath toward the draught's bearing on the rim.
- It is drawn as streaks in the film's own pale sheen, in the draught's damage-type motif (grief's long streaks, dread's smoke, mirth's thrown facets...), and **never in a colour**. Nothing on the bath tints, so nothing lies about a hue.
- The bath brims with it: its surface stands proud of the lip in a trembling meniscus (the press's `fill`).
- The ghost paths bend with the current, so the step is planned rather than met by surprise. It fades as the draught fades.

### 4.12 The press answers before it is touched
- **The lever's ball** (the cocked lever):
  - Up after a press, down after a firing, so its height says whether the press can fire.
  - With the bead inside a spread, the ball lifts a touch more and warms (an ember in the lacquer). Outside every spread it hangs dark.
- **The press's eye** brightens in the soul colour as the bead nears the tile's heart, as the price falls with it. Outside every spread the lens is dark.
- **The lantern:** its flame stands tall when your cubes cover a firing here, and gutters low when they do not.

### 4.13 Firing, and the refusals
- **To fire: `grab` the lever's ball** (the hand curls, then `grabHold`) and drag it down (**`pull`**). The ball follows to its stop (0.25 s).
- **A firing** (the bead inside a spread), about 1.6 s:
  1. A hit-stop of 0.1 s: the view holds, and the knuckles squash round the ball (**`fistClench`** through the hold).
  2. The eye flares and lays a pinpoint of light on the bead, like a burning glass (0.3 s).
  3. The bead dips into the tile, with a ring spreading from it (0.25 s).
  4. The glaze sets: a white kiln heat runs out from the bead across the tile and cools back to its glaze, crazing lines spreading to the ping of fresh glaze cooling (0.75 s).
  5. The attribute's light, already over the tile, burns where it hangs.
  6. The spread draws back into the tile, its seasoning spent (0.4 s).
  7. The tile shrinks a step round the bead (0.8 s). Its body steps up the ladder when the new rank enters the next band.
  8. The bead surfaces where it was. A firing never moves the soul colour.
- **A true firing** (the glint inside the tile's heart), about 2.2 s, is all of that, plus:
  - For a beat the bead's edge vanishes into the heart and its meniscus fades out.
  - The light comes all the way down into the heart and burns there for a beat, with frame accumulation. Its seal warms to gold for a beat and cools (gold is a reward; a warmth, never a blink), and the light leaves a **yohen star** on the tile's face: the kiln-change fleck of `vfx/finish.js`, 2 px and never smaller. A tile's stars are its true firings, ten at most, and they are kept.
  - Then the light goes home to its seal.
  - On leaving, the Pneuka Jar's mouth breathes the soul colour for a few real seconds, and the soul glow is brighter on the Courier.
- **Skipping:** any firing can be skipped with a click after its first 0.6 s.
- **After a firing** the ball rests at its stop until something is pressed: one firing per press (conflicts, 5).
- **Refused, outside every spread** (0.35 s):
  - The ball goes a third of the way, sticks, and springs back up, throwing the hand open (**`release`**).
  - The bead crawls: it beads up tight and bares the bath round it, as crawling glaze does.
  - The nearest spread's break glints once on the side facing the bead, showing the way.
  - The log says why.
- **Refused, too few cubes:** the ball goes down, the lantern gutters out in a thread of smoke, the eye lights faintly and dies, and nothing sets. The log gives the price.
- **Refused, at the top rank:** over a finished tile the ball will not move and the light hangs unlit. The log says so.
- **Spent:** the ball is already down, and pulling it does nothing but a throttled log line.

### 4.14 Away from the press
- **Seasoning:**
  - Nothing pops for each deed.
  - When an attribute's seasoning crosses a quarter, a half, three quarters and full, its seal pops once from the Courier's chest: a glyph pop in its glaze, small, rising and fading (`vfx/glyphs.js`). A parry, and then the Gaze. The player learns what seasons what without being told.
  - The log says it once, at full.
- **The soul glow** (the vessel lit from inside, `vfx/finish.js`) is drawn by `wheelColour` too, carrying the soul's chroma, never its brightness. The Courier carries their place on the colour wheel out into the world.
- **The Codex** gives each attribute's name, seal, rank and seasoning in words.

### 4.15 Every eye
- **Measured** (Machado 2009 simulation of the tiles' glazes as drawn by `wheelColour`; Oklab ΔE, where about 0.02 to 0.05 is "the same" at this size). The colliding pairs:

| vision | pairs that fall together (Oklab ΔE) |
|---|---|
| deuteranopia | Dexterity and Visualization 0.026; Willpower and Focus 0.033; Willpower and Charisma 0.045 |
| protanopia | Dexterity and Visualization 0.044; Focus and Charisma 0.055 |
| tritanopia | Charisma and Perception 0.050; Willpower and Resilience 0.055 |

  - So 51° between hues does not tell the tiles apart without full colour vision: the seals are required, not an extra.
- **Every colliding pair has the most unlike seals:**
  - the Swift against the Finder (a diagonal solid against hollow right angles);
  - the Peak against the Still Point (a solid triangle against a ring);
  - the Peak against the Fan (point up against point down);
  - the Still Point against the Fan (closed round against ribbed);
  - the Fan against the Gaze (a wedge against a flat almond);
  - the Peak against the Tumbler (a straight solid against a necked, leaning gourd).
- **Every other cue is value, shape or motion:**
  - the dished bath's depth (saturation as pale-to-black);
  - the spread's pale break;
  - the heart's bright ring;
  - the bead's meniscus and glint;
  - the dark seam between spreads;
  - the inward rings stilling at the heart;
  - the lever's height;
  - the stars.
- **The match for every eye.** "The bead melts into its tile" is a colour-normal reward. The concentric seat (4.7), the stilled rings and the light's dive carry the same moment for everyone.
- **Marks:** every mark is 2 px or more at 480 lines, because the bilinear upscale softens anything thinner. There are no flashes: the burning glass is a 0.3 s glow, and the gold is a beat.

### 4.16 The colour: one function
- **`wheelColour(h, s)`** draws everything at the press and the soul glow:
  - the tiles and the seals' glaze;
  - the soul bead, the ghost paths, the ghost bead and the droplets;
  - the lumps and the Box's icons;
  - the lights, the eye, the crucible's bead and the thread.
- **Today there are three conversions:**
  - `soulColour`, with saturation ×1.3 and darker as it saturates;
  - the lights, at HSL .65/.55;
  - the lumps, at HSL .65/.5.
  - Measured: a bead dead on a target differs from its own light by Oklab ΔE 0.046 to 0.072, two to three times what the eye can see, so a match could never vanish.
- **Drawn perceptually (Oklab):**
  - The model's angle is an Oklab hue offset so that 0 sits at sRGB red.
  - Chroma follows saturation, clipped to the screen's gamut.
  - Lightness is grey at the centre and leans lighter toward yellow and darker toward violet as saturation grows, so each hue carries its natural value.
  - Measured: neighbouring attributes are then evenly spaced (closest neighbours ΔE 0.096). The HSL ring as built runs from 0.112 to 0.326, with yellow and green crowded. Equal steps on the wheel look equal (Munsell's point).
- **The cost:** the colours are glazes, not neon (chroma about 0.11 at the target saturation). The push lives at the lip (saturation 1, chroma 0.17).

### 4.17 The hand (the god hand's own clips, `godhand/godhandclips.js`)
| moment | clip | on | does |
|---|---|---|---|
| over the bath, empty | `idle`, raised higher and half-dithered; its fingertip's shadow dot on the bath is the cursor | anywhere | the hand never hides the bead |
| over a lump | `point` (held) | a lump | its ghost path draws on |
| pick up, carry | `pinch` (held) | a lump | the lump swings a little behind |
| let go | `release` | the spiral mouth | loads |
| take back | `flick` (the right button) | a lump circling the mouth | back to the ware ring |
| press | `press` (the pat clip looped), palm flat | the spiral mouth, empty-handed | presses, a material at a time |
| take the lever | `grab`, then `grabHold` | the lever's ball | |
| fire | `pull` (held); `fistClench` through the hit-stop | the lever's ball | fires |
| refused | `release`, thrown open as the ball springs back | | |
| open | `beckon` | | the lights come down to their seals |
| leave | `shoo` | | the lights rise back to their orbit |

### 4.18 Timing
| moment | s | what moves |
|---|---|---|
| open | 0.8 | the camera climbs and narrows; the garden greys; the bead wells up; the lights land 0.08 apart |
| hover a lump | 0.25 | the lump lifts; its ghost path draws on to the ghost bead |
| pinch | 0.08 | thumb and forefinger close |
| load | 0.3 | the lump falls; the spiral turns a quarter; the path firms |
| take back | 0.25 | the lump springs to the ware ring; the paths redraw |
| press, wind-up | 0.25 | the press dips; the spirals start; the ball rises |
| press, a material | about 1 | 3 to 5 glides; 0.15 between materials (halved with Shift) |
| greying | the step + 0.4 | the gloss dulls; a ring folds in |
| enter a spread | 0.5 | its light lifts and leans over the tile; the inward rings begin |
| enter a tile's heart | 0.3 | the rings still; the halo tightens |
| firing | about 1.6 | pull 0.25, hit-stop 0.1, eye 0.3, dip 0.25, set 0.75, spread 0.4, shrink 0.8 (overlapping) |
| true firing | about 2.2 | the same, plus the dive, the star and the gold |
| refusal | 0.35 | the ball springs back; the bead crawls; the nearest break glints |
| leave | 0.5 | the lights rise; the bead sinks; the camera returns |

### 4.19 Events (each with `by: 'courier'`; never `name` or `t`)
- `alchemy.open`, `alchemy.close`.
- `alchemy.load { count }`, `alchemy.unload { count }`.
- `alchemy.step { hue, sat }` (Dovina's), `alchemy.grey { sat }`.
- `alchemy.enter { attribute, heart }`: the bead enters a spread or a tile's heart; `attribute: null` when it leaves every spread.
- `alchemy.press { count, hue, sat, near }` (built).
- `alchemy.fire { attribute, rank, true, d, fuel }` (Dovina's).
- `alchemy.refuse { why: 'outside' | 'poor' | 'full' | 'spent' }`.
- `alchemy.season { attribute, quarter }`: the seal pop.
- The lever's creak follows the ball (the press reports `pull` each frame; it is not an event).
- **Wanda's, to build:** the drone rising as the camera climbs; seven tuned ticks as the lights land; a note a step (a fifth for each 30°); the tritone resolving into the drone on greying; the beating stilling at the heart; at a firing, the creak, a held beat of silence, the kiln's ping, and on a true firing the Answer. Each refusal gets a dull wooden knock, with the lantern guttering added for too few cubes.

### 4.20 The log (Espada's words; nothing else on the screen speaks)
- **One line a press, never one a material:** "You press {a}, {b} and {c} into the bath." Five lines in six seconds would flood the log.
- **"The colour greys."** once, after a press in which a complement greyed it.
- **A firing names the attribute, the new rank and the cubes it took,** and a true firing is marked as one. "Half the fuel" is right only dead centre (conflicts, 6).
- **Each refusal with its why:** outside every swatch; too few cubes (with the price); the last rank; spent.
- **"Your {Attribute} is seasoned."** once, when a seasoning fills.
- **Nothing** on opening, hovering, loading or a step.

### 4.21 Assists (settings, off by default; offered plainly and never judged, Celeste's way)
- **The colour wheel's spokes** (`alchemy.spokes`): seven faint labradorite spokes from the grey centre to the seals. Still no numbers.
- **The seals at twice the size** (`alchemy.seals2x`): 32 px, a whole-number scale. They stand on the ware ring's step, outside the kerb.
- **Left out on purpose:** a setting that names the soul colour in words. The owner's lesson is the eye.

### 4.22 What it costs to draw
- **The bath:** one mesh and one shader. It draws the dish, the throwing lines, the meniscus, the inward rings, the current and the seven spreads (breaks and hearts) from seven uniforms: no extra geometry, nothing to z-fight.
- **The tiles:** one instanced mesh (glaze, body band, stars). The seals are one 64 px atlas on the kerb.
- **The lumps and the droplets:** instance pools (`render/propbatch.js`).
- **The ghost paths:** one ribbon mesh, rebuilt only when the waiting lumps or the hover change.
- **No new lamps.** The lights, the eye and the lantern are emissive; a PointLight is used only if the light budget lends one.
- **The surround:** the press view's grey is an ease on the garden's sky and fog uniforms, and the sweep checks that it comes back.
- **Not yet measured:** `npm run perf` before and after.

### 4.23 Words for the glossary (Calissa's, in the same commit)
- **the bath**: moved from the drum's pool to the basin.
- **the drum's pool**: what stays on the drum.
- **the press view**: a fourth among the garden's views.
- **the kerb**, **the ware ring**, **the grey centre**, **the throwing lines**.
- **a tile**, **a tile's spread**, **a spread's break**, **a tile's heart**: always "a tile's heart".
- **the soul bead**, **the ghost path**, **the ghost bead**, **the line blend**, **the draught's current**.
- **an attribute's seal**: not "glyph", which is the glyph pop's word.
- **a yohen star**.
- **the colour wheel**: always in full, added as a fourth meaning in the "wheel" homonym row; in play it is the bath.
- **Avoided on purpose:** drop (loot), pool (the Courier's), run (a Well's), stain (spilled crude), well (a Well), eye (kept for the press's eye; Perception's seal is the Gaze), "the Swallow" (retired for the Great Dunemaw; Dexterity's bird is the Swift).

---

## The seven glyphs (each attribute's seal; names are Espada's to confirm)

| attribute | hue | glyph (16 px; 64 px carving) | why |
|---|---|---|---|
| Willpower | 20 | **The Peak.** 16 px: a solid triangle, base 15 px on row 14, apex on row 2; the only solid glyph. 64 px: the same mass with a snowcap's V line a fifth down and two strata slanting across. | Fudoshin, the immovable mind: Willpower widens the shield's pool and is seasoned by blows taken and by settling. Solid, bottom-heavy and pointing up. It parts from the Still Point and the Fan (deutan pairs) by solidity and direction, and from the Tumbler (tritan) by straight sides against a necked, leaning gourd. |
| Focus | 71 | **The Still Point.** 16 px: a closed ring 14 px across with 2 px walls round a 4 px dot, a clean gap between. 64 px: a thinner ring between them and a highlight on the dot. | Attention held on one point (Eliot's still point of the turning world): Focus makes the statuses you build hold, and is seasoned by building them and by holding a rhythm combo. It is the only closed round figure. It is not the ward glyph (a ring barred across). It shares nothing with the Fan or the Peak, its protan and deutan colour twins. |
| Charisma | 123 | **The Fan.** 16 px: a sensu opened about 120°, a wedge whose point (the rivet, a 2 px stem below it) is at the bottom and whose arc runs along the top, with four ribs knocked out. 64 px: the leaf over its sticks, the guard sticks heavier, a cord and tassel from the rivet. | The rakugo storyteller's fan: one voice and a fan hold a room, which is reading people and being read. That is what Charisma trains (talks, sales, tips) and does (what the folk pay and ask). It is the only glyph pointing down, the Peak's inverse. It is ribbed against the Still Point and a wedge against the Gaze's flat almond, its three colour twins. A first pass: at 16 px it reads as a fan or scallop shell, and the ribs want a hand-tidy. |
| Perception | 174 | **The Gaze.** 16 px: a wide almond 16 × 9 px with sharp corners left and right, a 4 px pupil, and three short lashes standing on the upper lid. 64 px: five lashes, an iris ring, a catchlight, the upper lid heavier. | Seeing it coming: Perception shows a creature's windup sooner, and is seasoned by a parry in its window and by a plate appraised at three stars or more. It is the only glyph twice as wide as tall. The lashes break its top so it never reads as the Still Point. Named the Gaze so "the eye" stays the press's. |
| Dexterity | 226 | **The Swift.** 16 px: a bird banked toward the upper right, scythe wings swept back across a short body, a forked tail trailing to the lower left. 64 px: separated primaries, a deep fork, a pale throat. | Swift twice: the bird that turns in its own length, and quick hands (draw and stow, a swap mid-fight; tsubame-gaeshi, the cut that comes back before a bird could turn). It is the only diagonal, many-pointed glyph, set against the Finder's hollow right angles, its colour twin for protanopes and deuteranopes (ΔE 0.026 to 0.044). It is never called a swallow (retired). |
| Visualization | 277 | **The Finder.** 16 px: two right-angle brackets 2 px thick with 7 px arms, at the top-left and bottom-right corners of a 14 px square, the middle empty. 64 px: the brackets as two hands' thumb and forefinger (the painter's finder), a faint sketched circle floating in the middle. | Holding a picture before it is made: Visualization widens the canvas the Soul Brush and the hand work on. The painter's finder is the artist's eye itself, which is the owner's lesson. It is the only hollow, straight-cornered glyph, kept furthest from the Swift. |
| Resilience | 329 | **The Tumbler.** 16 px: a gourd leaning about 20°, a small lobe up and right on a short stem, a waist, a big weighted lobe, with a 1 px zigzag seam knocked out across it. 64 px: the seam inlaid in gold, a cord at the waist, a short arc under the foot to show the rock. | It falls and rights itself: the okiagari-koboshi ("fall seven times, rise eight"), as Strawman rocks back up on its weighted foot. It is drawn as the hulu, the alchemist's gourd of long life, mended with the vessel's kintsugi: the clay mends, the ship bears one more hit. It is the only two-lobed, leaning glyph. Its seam is a connected zigzag, because loose knocked-out pixels read as a face. |

The 16 px drawings (`#` is the cut). Calissa draws the 16 px art in the maker's style, and the maker may redraw it at 1x:
```
Willpower         Focus             Charisma          Perception
................  ................  ................  ................
................  .....######.....  ................  ................
.......##.......  ...##########...  .....######.....  ................
......####......  ..###......###..  ..###.####.###..  ....#..##..#....
......####......  ..##........##..  .####..##..####.  ....########....
.....######.....  .##..........##.  #..###.##.###..#  ..###......###..
.....######.....  .##....##....##.  ##.###.##.###.##  .##....##....##.
....########....  .##...####...##.  ###.##.##.##.###  ##....####....##
....########....  .##...####...##.  ###..#.##.#..###  ##....####....##
...##########...  .##....##....##.  ####.#....#.####  .##....##....##.
...##########...  .##..........##.  ..###.####.###..  ..###......###..
..############..  ..##........##..  ....########....  ....########....
..############..  ..###......###..  .....######.....  ................
.##############.  ...##########...  .......##.......  ................
.##############.  .....######.....  .......##.......  ................
................  ................  ................  ................

Dexterity         Visualization     Resilience
................  ................  ................
...........###..  .#######........  ...........##...
..........####..  .#######........  ..........##....
.........####...  .##.............  .........####...
........####....  .##.............  ........######..
###....#######..  .##.............  ........######..
.####.#######.##  .##.............  .........####...
..###########...  .##.............  ........######..
....#######.....  .............##.  ......#########.
....#####.......  .............##.  .....##########.
...####.........  .............##.  ....###########.
..###.##........  .............##.  ....#.#.#.#.##..
.##....#........  .............##.  ....##.#.#.#.#..
##..............  ........#######.  ....##########..
................  ........#######.  .....########...
................  ................  .......####.....
```

---

## Conflicts: what in sections 3 and 7 fights the look, and the fix

1. **3.1 and `materials.js`: a material's colour says nothing about where it walks.**
   - Each path turns by a coin toss (`dir = r() < 0.5 ? -1 : 1`), so a red lump turns a green soul toward blue as readily as toward red.
   - The 30° complement window is a cliff: 29° off the opposite greys, 31° does not. Its greying is half a step's saturation, 0.7 to 4 px at 480 lines, which nobody will see.
   - **Fix:** the painter's rule (Newton's centre of gravity). Each material pulls the soul colour a share of the way toward its own (hue, saturation), by tier, with its kind's winding on top. Complements then grey on their own, because the straight way to the opposite runs through grey, and the 30° window and `complement` can go. Until it is ruled, the ware ring shows plain clay (4.8).
2. **3.2 with 3.5: the multipliers overflow the colour wheel.**
   - Neighbours' hearts are 0.282 apart, the grey centre 0.325 from each heart, and the rim 0.175 beyond.
   - Rank 0 seasoned ×2.5 is 0.30, reaching past both neighbours' hearts. With the formation's ×2 it is 0.60, so a fresh grey Courier is "inside" all seven, and `near()` keeps Willpower.
   - **Fix:** seasoning widens toward a ceiling, r = r_rank + (0.13 − r_rank) × seasoning / 100. Rank 9 grows ×3.25, the grind's gift where the skill gap is widest, and rank 0 barely grows. No spread reaches a neighbour, the rim or the grey centre, and a dark seam always shows.
3. **3.5: the formation scales the radius.**
   - The map the eye is learning changes size whenever the garden is rearranged. At ×0.5 a rank-9 swatch is 0.02 (a 2.5 px heart under a 6 px bead).
   - **Fix:** the formation sets the fuel instead (a hotter furnace burns fewer cubes). It shows in the Athanor's vent and the price in the log, never on the bath.
4. **3.3: a true firing is "within a quarter of the radius now",** so a full seasoning makes the heart 2.5 times wider and "true" (counted, read by achievements, kept as a star) stops meaning skill.
   - **Fix:** a tile's heart is a quarter of the bare rank radius. The price still uses the radius now.
5. **3.3: a firing does not move the soul colour,** so a bead in a heart stays inside every narrower rank.
   - Ten pulls take an attribute from 0 to 10 off one press, for 520 cubes at half price (`fuelAt(0..9)` sums to 1040 at `perMinute` 8).
   - **Fix:** one firing per press. Pressing cocks the lever and a firing lets it down, and the cocked state is kept in the `alchemy` section.
6. **3.3 / section 4: "Half the fuel" is right only dead centre.** Inside the heart a firing costs 0.5 to 0.625 of the fuel.
   - **Fix:** the log names the cubes taken.
7. **3.4: brimming lasts 2 real seconds** (`courier/mind.js` `BRIM`), so the step and its current would be gone in a moment, and nobody brims at a press.
   - The step also has to be in the preview: 0.02 is half a rank-9 radius, so five materials would miss by 2.5 radii while the paths showed a hit. Section 7's spirit `workBonus` has the same problem.
   - **Fix:** key the step on the draught (`game.draught`, which fades over a real minute), scaled by its strength. Draw both steps in the ghost paths. Show the current in the film's sheen and motif, never as a tint (4.11).
8. **3.4 / 7: the five feelings wear four sets of colours, and the sky's draught is never written.**
   - The four sets: `weather.js` `COLOR` (dread a green, 0x3f6a4a); `plots.js` `FEELING_COLOR` (wonder a mint green); `feelingHue` (dread 280); and the art bible's damage-type colours.
   - `game.draughtHex`, which `realm.js` reads for the garden's sky, is written nowhere.
   - **Fix:** one table for the game. `feelingHue` is derived from it, `plots.js` reads it, and `draughtHex` is written from it. Calissa and Dovina settle the table before Petra builds the current.
9. **3.5 against the model:** the drum's pool cannot be seen from above, and the overhead view is too far and turns.
   - **Fix:** the basin with its root spout, and the press view (4.1, 4.3). The glossary's "the bath" moves.
10. **3.5: F at the Athanor opens THE PLATE SHRINE** (`realm.js` `athanor()`).
    - **Fix:** the plate shrine becomes a small hokora with its own F, and F at the basin opens the press view.
11. **7: the soul glow cannot show "where you stand on the colour wheel".**
    - It maps saturation to brightness at a fixed 0.85 saturation, so a half-grey soul glows a vivid hue, dimly. The press itself has three colour conversions (4.16).
    - **Fix:** `wheelColour` everywhere. The glow carries the soul's chroma at a constant strength once off grey, and the folk's "a glaze matched to your soul colour" is measured in the same space.
12. **7a: the memory's hue lean starves the green quarter,** because there is no feeling between 50° and 191°. Charisma (123) and Perception (174) would lose their materials while red-gold and blue-violet crowd.
    - It also moves a lump's colour without moving its path, so the ware ring would lie.
    - Section 7's spirit bonus means nothing without it, because a material has a kind, not a feeling.
    - **Fix:** take the memory only with the pull (1). Lean saturation rather than hue (won in a storm, more vivid; won in fair weather, greyer), as the art bible has feeling ride saturation, or wait for Faith to fill the green.
13. **Words:**
    - "A drop of glaze" (the soul colour) and 7a's "the drop" (loot) are one word for two things: say the soul bead.
    - "The wheel" bare has three meanings already: say "the colour wheel" in full.
    - "Glyph" is the glyph pop's word: say an attribute's seal.

---

## Who builds what

**Calissa (the look: `src/vfx/`, the models, the animation pipeline, the art bible)**
- `vfx/spiritpress.js` refired:
  - the press at the basin's north lip, the root spout and the thread down it;
  - the drum's pool kept;
  - the lights' press-view behaviour (settle into seals, lift, lean, dive, go home);
  - `soulColour` and the lights' HSL replaced by `wheelColour`;
  - the burning-glass pinpoint, the lantern's height, the ball's ember.
- `vfx/wheelcolour.js` (new, shared): `wheelColour(h, s)` in Oklab, read by the press, `vfx/finish.js`'s soul glow and the Box's icons.
- `vfx/alchemy/basin.js` (new): the dished basin, the grey centre, the basalt kerb with the seals' 64 px carving atlas, the ware ring's step.
- `vfx/alchemy/bath.js` (new):
  - the bath shader (dish, throwing lines, meniscus, inward rings, the draught's current, seven spreads with breaks and hearts as uniforms);
  - the tiles (one instanced mesh: glaze, body ladder, gilt, yohen stars);
  - the soul bead and the ghost bead.
- `vfx/alchemy/paths.js` (new): the ghost path ribbon, the line blend's droplets and the lumps (prop batches; a lump's form by kind).
- The firing and refusal looks:
  - the kiln heat and crazing;
  - the dive with frame accumulation;
  - the gold seal;
  - the crawl;
  - the gutter.
- The press view's neutral surround: easing the garden's sky and fog (`vfx/garden/`).
- The seven seals:
  - 16 px pixel art for the Codex, the glyph pops (`vfx/glyphs.js`) and the log if it carries icons;
  - the 64 px carving;
  - the Box's material icons palette-swapped (`ui/pixel.js`);
  - the hokora model.
- The hand's clips at the press (`godhand/godhandclips.js`: hover lift and dither, `point`, `pinch` carry, `press`, `grab`/`pull`, `fistClench`, `beckon`, `shoo`).
- `docs/ART.md` (the spirit press line: the bath is neutral now), and the glossary entries in 4.23.

**Petra (the logic: `src/world/garden/`, `src/progress/` wiring, the gate)**
- The press view as a fourth view in `world/garden/gardencam.js`: lens, framing, north lock, zoom that leans toward the hand, the 0.8 s climb and the way back.
- `world/garden/press.js` (new), the station:
  - F at the kerb, and Esc, F or WASD to leave;
  - the hotspots by ray (lumps, the mouth, the ball), hover, pinch, release, flick, hold to press, Shift, click to finish, dragging the lever;
  - the queue, the cocked lever (saved), the refusals, the events in 4.19.
- `progress/alchemy.js`:
  - section 3 as Dovina rules it (the ceiling, the heart from the bare radius, aimed fuel, seasoning, one firing per press);
  - **one walk function used by both the press and the ghost paths** (the pull, greying, the draught's step, a spirit's step), so the preview is the press.
- `world/garden/place.js` and `realm.js`: the basin and the press on the Athanor's crown with the plots kept clear; the hokora with its own F; F routed to each.
- `feedback/tracking.js` rules for the events, and the log lines (Espada's words).
- With Dovina: the one feeling table (`weather.js` `COLOR`; `plots.js` reading it; `draughtHex` written).
- The garden sweep's new checks:
  - the sky and haze come back after the press view;
  - no number on the bath;
  - each refusal;
  - one firing per press;
  - the ghost path's end equals the pressed colour.

**Dovina:** the rulings in conflicts 1 to 8 and 12 (the pull in `materials.js`, the ceiling, the heart, fuel by formation, one firing per press, the draught's step). **Espada:** the log lines in 4.20 and the seals' names. **Wanda:** the sound in 4.19.

---

## Prior art (museum labels)

- **Glaze test tiles, line blends and the triaxial grid.** Studio practice; Ian Currie, *Revealing Glazes* (2000). Taken: the swatches as test tiles, and the line blend the bead leaves on the bath.
- **Carved celadon.** Yaozhou ware, Northern Song. Glaze pools darker in a cut. Taken: the seals carved into the kerb and filled with their glaze, reading in lightness as well as hue.
- **The potter's chop and the Japanese kamon.** A seal stamped in a pot's foot; crests drawn to read as silhouettes at any size. Taken: an attribute's seal.
- **Glaze as it really fires.** Pooling, running onto the shelf, breaking thin over an edge, crawling, shrinking with the clay; the clay ladder from earthenware to porcelain. Taken: the spread and its break, the refusal's crawl, the tile shrinking a step a rank, the tile's body climbing the folk's ladder.
- **Yohen tenmoku.** Jian ware, Song dynasty; already the game's kiln pattern (`vfx/finish.js`). Taken: a star left by each true firing.
- **The tsukubai and its kakei.** The Japanese garden's stone basin and bamboo spout. Taken: the basin, and the press as its spout.
- **Josef Albers, *Interaction of Color*** (1963), and the colour-matching booth's grey surround. Taken: the neutral bath, the garden greyed at the press, self-lit tiles, a match seen as a lost edge.
- **Albert Munsell, *A Color Notation*** (1905). Hue, value and chroma kept apart, in steps that look equal. Taken: the colour wheel's geometry, and the glow carrying chroma, never brightness.
- **Isaac Newton, *Opticks*** (1704). A mixture as the centre of gravity of its parts, so complements mix to grey. Taken: the pull (conflicts, 1).
- **Oklab.** Björn Ottosson (2020). Taken: `wheelColour`, which spaces the seven evenly to the eye.
- **The Farnsworth-Munsell 100 Hue Test** (1943). Caps in hue order, with the error between neighbours as the measure. Taken: the ware ring in hue order.
- **Potion Craft: Alchemist Simulator.** niceplay games (2022). Taken: ingredients as paths with the path previewed before it is walked, dilution toward the centre, strength by closeness, brewing at a point.
- **Ōkami.** Clover Studio (2006). The world stills into a canvas for the Celestial Brush. Taken: the press view's grey surround.
- **The Atelier series.** Gust. A material's shape is what it does in the cauldron. Taken: a lump's form is its kind's winding.
- **Black & White.** Lionhead (2001). The hand as your whole presence. Taken: pinch, release, flick, press and pull as the only controls.
- **Townscaper.** Oskar Stålberg (2020). Every act answered by a small physical reaction, with no fail screen. Taken: the crawl, the gutter and the spring-back instead of an error.
- **Hades.** Supergiant Games (2020). A hit-stop and a held beat on a reward. Taken: the firing's beat.
- **Hue** (Fiddlesticks, 2016) and **The Witness** (Thekla, 2016). The first puts a symbol on every colour in its colour-blind mode; the second has coloured puzzles some players could not solve. Taken: the seals, and the warning.
- **Celeste.** Maddy Makes Games (2018). Assists offered plainly and never judged. Taken: the two assists.
- **Vertigo.** Alfred Hitchcock (1958), the dolly zoom. Taken: the press view's arrival, flattening the bath into a map.
- **Machado, Oliveira and Fernandes** (2009). A physiologically based simulation of colour-vision deficiency. Used to measure the glazes and check the seals.
- **The seals' sources:**
  - fudoshin, the immovable mind;
  - T. S. Eliot's still point (*Four Quartets*);
  - the rakugo storyteller's sensu;
  - tsubame-gaeshi;
  - the painter's finder;
  - the okiagari-koboshi and the daruma proverb;
  - the hulu gourd of Daoist alchemy;
  - kintsugi, already the game's (`courier/vessel/kintsugi.js`).

---

## What was checked, and what was not

**Checked (scratch only, under `/tmp/claude-0/-home-user-foolsfortune/60222257-7177-5bc0-9f7e-a90ec12db629/scratchpad/alchemy/synth/`):**
- **Sources read:** Dovina's spec in full, `spiritpress.js`, `alchemy.js`, `materials.js`, `ECON.alchemy`, `gardencam.js`, `hand.js`, `godhandclips.js` (on the `art-godhand-jar` worktree), `place.js`, `realm.js`, `courier/mind.js`, `weather.js` and `plots.js` (the feeling colours), and the art bible.
- **`press_view_synth_480.png`:** a 480-line sketch of the press view at true scale (`mock.py`). It gave the framing and sizes: the bath about 245 px across, tiles 56 to 59 px at rank 0 and 20 px at rank 9, the heart 5 px at rank 9, the lever's ball in frame at the top, the ware ring to y 467.
- **`chops_final_check2.png`:** the seven seals at 16 px on their glazes, in grey and under protan, deutan and tritan simulation (`check_final.py`). All seven read in every row. Lit seals stand 6.7:1 to 8.7:1 against the basalt. The closest blurred-silhouette overlaps are the Fan and the Gaze (0.54), the Still Point and the Fan (0.51), and the Peak and the Tumbler (0.50), and each pair still reads apart in the upscaled strip.
- **The numbers in the conflicts:** recomputed from the code (overlaps 0.282, 0.325 and 0.175; 1040 and 520 cubes; `BRIM` 2 real seconds; `draughtHex` never written; the three colour conversions, ΔE 0.046 to 0.072).

**Not checked:** nothing was built or run in the engine. There is no screenshot of a real basin. The framing numbers come from a pinhole sketch. The 64 px carvings are descriptions only. The Fan's 16 px ribs need a hand pass. `npm run perf` has not been run. No file in the repo was changed.

---

## My rows of TRAINING.md section 5 (the Veritome's plates, Celestial mode's sigils, the parry's telegraphs)

The short of it: each of the three already measures quality in its code and drops it before the event. And one collision: Second Look
duplicates Perception's rank-10 widening, so I propose Held Breath instead. Everything below is read from the code (file:line); nothing
was run.


Everything below is read from the code; nothing was run or rendered. The files I cite are identical on this checkout and on `origin/claude/dovina-design` (`git diff` is empty). Knack names are placeholders for Espada.

### 1. The Veritome's plates (composition)

1. **Is the skill right? Half.**
   - **Taught now:**
     - Framing: a size band, full credit from a third to 85% of the frame's height (`photo.js:46-47`).
     - The moment: the pose table is the biggest term after size, 20 to 80 points (`photo.js:22,51`).
     - Angle: facing the lens (`:49`).
     - Variety: a same-kind bonus of up to 60 (`:57-59`).
   - **What teaches it:** the live preview. It is scored every 0.15 real seconds (`veritome.js:217-223`). The brackets darken with stars and the best subject's stars show in the corner (`viewfinder.js:107-112,130-133`). The player moves, zooms and waits, and watches the stars climb.
   - **The thirds are taught backwards.** `centre` peaks at the exact middle (`photo.js:48`), and the capture circle sits dead centre (`viewfinder.js:114-120`). A subject on a power point loses about 26 of roughly 280 points. The game teaches "centre it".
   - **Light is not measured.** The sky and sun plates are a flat 3 stars (`photo.js:68`).
   - **What would teach it:**
     - Replace `centre` with a placement term. It peaks at the four power points (±0.33, ±0.33), gives 0.7 dead centre, and credits lead room ahead of `s.facing`.
     - Add a light term of 0 to 30. It reads `phaseAt`/`lightAt` (`weather.js:73,83`) and front-lit against `dunes.sunDir` (`dunes.js:133`, Dunes only). The plate already keeps the game hour (`veritome.js:268`).
     - `serial()` (`photo.js:78`) should also keep `ndc` and the hour.
     - Those are Petra's files. The look change that is mine: the book's margin in `viewfinder.js` gets a brass tick where a subject sits on a third.
2. **EXP.** The event is `photo.take` (`veritome.js:293`). It is already a Divination source (`domains.js:44`), but its quality is only `(stars-1)/3`, which is four steps. The continuous `score` (`photo.js:59`) is never emitted.
   - Add `score` and `fresh` to the payload. `fresh` is true when the Compendium holds nothing of that kind at an equal or higher score (`darkroom.js:36-37`).
   - Then `q = clamp((score-50)/200) × (fresh ? 1 : 0.5)`, and sky/sun keep 0.67.
   - The `fresh` factor is needed because a memory holds 24 plates (`film.js:15`), appraisal is free, and 24 identical 4-star plates of one pot would pay 24 times at full rate. That is the repetition `domains.js:9-10` forbids.
3. **Knack.**
   - **Wide Lens:** right idea, wrong order. Ship the placement term first. A thirds grid over today's score would teach a rule the score punishes.
   - **Pair:**
     - The count, 300 plates appraised, is `photo.appraised` (`tracking.js:354`) and exists.
     - The feat, a four-star plate, already exists as `vl3` "Four Stars" (`achievements.js:312`). One lucky centred clapperjar in the air scores 260 and clears it, so I would tighten it to four 4-star plates of four kinds.
4. **No home.**
   - **Light reading** (golden hour, front-lit or backlit). It belongs under Divination with the forecast, but nothing is wired.
   - **Candid observation.** Aware and engaged flags are in `subjects.js:7-10`, and a candid plate is how habits are learned. The Bestiary's understanding tiers are its only home. The bestiary is knowledge, not a domain.

### 2. Celestial mode's sigils

1. **Is the skill right? Half.**
   - **Right:** order of the queue.
     - Only `keys[0]` pops, and one mark pops every queue it heads (`sigils.js:109-115`).
     - Reading a crowd for the commonest head is the real optimisation (`bg3`, `achievements.js:303`).
     - Planning is the second order lesson. Time drops to 0.04 (`celestial.js:19`), up to 4 drawings queue, and they run in the order drawn, 0.16 real seconds apart (`:56`).
     - There is also an ink budget: 0.004 per px plus 1.5 a real second (`:19,64,77`).
   - **Wrong:** stroke order and direction inside a mark are not taught. The recogniser is blind to both on purpose (`gesture.js:7-11,115-125`).
   - **Suggested wording:** "a mark is a stroke or two, a sentence is marks in order, and the hand has an ink budget."
   - **What teaches the order:** the queue over each jar. The head is only 15% bigger and 25% more opaque than the rest (`sigils.js:85-87`), so order is weakly shown.
   - **Look changes (mine):**
     - The head is inked wet. The rest are thinner and unrimmed, and the next one darkens on a pop.
     - The reference scroll (`canvas.js:83-89`) gets entry dots and exit tapers.
     - The take flash (`canvas.js:176-179`) scales with how neat the drawing was.
2. **EXP.** The event is `brush.glyph` (`techniques.js:134,357`). It is already a Spellscription source, but its quality is `sigils/3 + 0.4` (`domains.js:53`). That ignores `n`, the things changed, and ignores neatness.
   - The measure that exists but is dropped is `rec.score` (`gesture.js:195-202`, accept 0.72). It is hard-coded 1 for circle, heart, spiral and bomb (`:169,182,186,187`).
   - Compute `fit` in `plan()` (`techniques.js:126-134`), where `rec` is in scope:
     - Template shapes: `(score-0.72)/0.28`.
     - Loops: `1 - gap/(0.32·size)`, using the closure gap from `closedLoop` (`gesture.js:84-91`).
   - Then `q = fit × min(1, (n+sigils)/3)`.
   - `sigil.pop` (`domains.js:54`) double-pays the same act, because it always fires beside a `brush.glyph`.
   - "A sigil drawn clean" (Visualization's seasoning, `SOUL-ALCHEMY.md:92`) can then be `fit ≥ 0.75`.
3. **Knack: Slow Hand.** The read waits longer after the last stroke (`REST` 0.42 → 0.7 real seconds, `celestial.js:19`), so a two-stroke V or bomb is not cut off between strokes. It is a motor-access assist and does not do the drawing.
   - **Pair:** the count is 100 `brush.miss` (exists, `tracking.js:560`), so persistence through failure is the patient path. The feat is `bg3`.
4. **No home.**
   - **Inscriptions teach intuitive physics** (heavy, light, bounce, still). `brush.inscribe` (`inscribe.js:110`) feeds no domain. It is a natural Alteration source, since Alteration's sources today are only the god hand's.
   - **Wash** (`techniques.js:357`) lays slip on the world. It is Manifestation's "coverage without waste", but today it pays Spellscription at a flat 0.4.
   - **Ink economy.** `this.drew` (`celestial.js:76`) is measured and unused.

### 3. The parry's telegraphs

1. **Is the skill right? Yes, but blow timing is not tested today.**
   - **Blows:** `blow()` takes `windups(at, radius)[0]` with no `eta` test (`parry.js:140-143`, `creatures.js:125-130`).
   - **Why mashing works:**
     - `answer` runs every frame of the window (`parries.js:49-52`).
     - A whiff costs nothing.
     - A press on the first frame of a lunge's 0.8 real seconds (`slipjelly.js:46`) answers it.
     - So V teaches "tap near the outline", and the windup's "when" is never needed.
   - **The sibling AI already gates:** it parries only in the last 0.35 real seconds (`coop/fight.js:62-64`).
   - **Projectiles do test timing:** the projectile must be within reach (`parry.js:44-56`).
   - **A broken promise to flag to Petra and Dovina:** the kick and the cutlass only call `deflect` (`kick.js:293`, `cutlass.js:252`) and never `windups`. So blows are answerable only by the six V tools, while PARRY.md says every tool answers every outlined thing.
   - **Look changes (mine):**
     - The outline ramp is weak. A lunge starts at 2.4 px and alpha 0.69 and ends at 3.6 px and 1.0 (`parrymark.js:72-73`). The eye reads on/off faster than "a bit thicker".
       - Keep the outline thin and dull until about 0.4 real seconds before the strike.
       - Then bloom the oil film, which is only 10% of the colour now (`:37`), and pop the width for 0.1 real seconds. This is Sekiro's glint, in the same ink language.
     - **Contrast risk:** the outline is near-black ink on the ink-black crude sea (`ART.md:60-61`), on dark Well floors and at night. The sigils already solve this with a pale rim (`sigils.js:8-9,34`). I have not rendered it, so capture it before changing it.
2. **EXP.** The event is `move.parry` (`parry.js:99,136,147`). It is counted (`tracking.js:231-233`) but has no `domains.js` row and carries no quality.
   - Add `lead` for a blow: `c.windup.t - 0.3`, read in `blow()` before `parried()` unwinds it (`:143`).
   - Then `q = 1` if `lead ≤ 0.25`, else `clamp(1 - (lead-0.25)/0.8)`. This is the outline's own ramp, so the score matches what the eye saw.
   - For a projectile, emit `d` and use `q = 1 - d/radius`.
   - Make the Divination row (blows only) `what === 'blow'`. `kind` is already in the event, so a FOE's Lidfall (`greatjelly.js:324`) can weigh more than a spit.
   - An early press still parries and pays at about 0.4×, so the grind stays open.
3. **Knack.**
   - **Second Look: do not ship as written.**
     - It duplicates Perception's rank-10 widening, "windup shows ×1.5 sooner" (`SOUL-ALCHEMY.md:90`). TRAINING §3 forbids stacking a knack on a widening.
     - It does nothing today, since any press answers.
     - With the quality in, an earlier glow makes players press earlier and score lower.
   - **Replacement, Held Breath:** the glint and the real window both a beat longer for blows (0.25 → 0.40 real seconds).
   - **Pair:** the count is 500 `move.parry` (`pa2` is 100, `achievements.js:163`). The feat "25 without a miss" has no key today.
     - `parry.try` (`parries.js:46`) is emitted but never ledgered, and a press with nothing near is not a miss.
     - Define a miss as an outlined windup that runs out unanswered with the Courier in reach (`creatures.js:147`), emitted as `parry.missed`.
     - Add a `parry.run.best` record.
     - A cheaper first feat is 50 `parry.clean`, a blow with `lead ≤ 0.25`, which needs only the new `lead` field.
4. **No home.**
   - **Reading the body.** The Great Slip Jelly's non-outlined casts are dodged, not parried (`foelook.js:2-4`). That is trained and unmeasured. Perception's seasoning could include "a cast avoided".
   - **Willpower's seasoning rewards being hit.** It is "a blow taken on the shield", whereas a parry streak is composure.

### Across the three

- Each system's continuous quality measure exists in the code and is dropped before the event: `photo.js:59`, `gesture.js:202`, `creatures.js:121,147`.
- The one design collision is Second Look against Perception.

Not verified: any rendered look, any run, and the numeric effect of the proposed formulas on pace (`scaleOf` in `domains.js` would need Dovina's re-run).