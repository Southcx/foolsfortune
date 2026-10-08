# Soul Alchemy at the Athanor: the system spec (the owner, 2026-10-08)

Kept by Dovina; the UX is Calissa's (section 4, hers to amend); Petra builds it. Numbers are in `src/progress/alchemy.js` and
`ECON.alchemy`; the new ones below are marked **(new)** and land in my files before Petra starts. Units: real seconds, cubes, the
wheel's distance (0 .. 1: the grey centre to the rim).

> "Soul alchemy is about Color theory, color matching, navigating around the color wheel. It indirectly trains the artist's eye."
> "High skill skips grind, but long grind closes the gap in skill."

## 1. Why it is the next round

Built already: the seven attributes, the soul colour, pressing (`press`), the targets that narrow with each rank, firing for cubes, the
ledger's counts and Calissa's spirit press model (`vfx/spiritpress.js`); since d4597a1 (Petra) the press stands on the Athanor with a first page, and the seven widenings are read. **Until then there was no press in the game.** Nothing presses or fires,
so no attribute ever ranks, so the Firings (read from the ranks' sum) never pass the first, so half the garden stays locked (the
features of the second Firing and up, the bought planetoids, the Heavenly Kiln). And six of the seven attributes' widenings are read by
nothing. Soul Alchemy is the garden's keystone and the vessel's whole growth.

## 2. The loop, at three scales

- **The moment (a minute at the press):** choose materials and their order, watch the colour walk each one's path across the wheel,
  stop inside an attribute's swatch, fire. The closer to the swatch's heart, the cheaper and the prouder the firing.
- **The session:** gather what the press eats: materials from every livelihood (the Wells' finds, angling, crystals, the beds,
  a spirit's work, the Wreckers' cargo), and **seasoning** (below) from simply doing each attribute's thing.
- **The long run:** ten ranks an attribute, seventy in all; the Firings they open (7, 14, 24, 36, 50, then every 20); each rank widens
  the vessel (section 6). The press is the long sink for cubes.

## 3. The rules (ruled 2026-10-08 on Calissa's eight; the numbers in `ECON.alchemy`, the functions in `alchemy.js` and `materials.js`)

### 3.1 Pressing: the painter's pull (ruled; built in `materials.js`)
The hopper takes up to five materials from the Pneuka Box, in order; they are used up. **Each material pulls the soul colour toward its
own colour** (its hue and saturation), a share of the way over its three to five steps (`ECON.alchemy.pull.share`: 0.3 at tier 0, 0.12
more a tier), bent sideways by its kind's winding (`pull.wind`: a spiral swings both ways, a zigzag alternates, an arc leans one way, a
line runs straight). This is Newton's centre of gravity: a mixture lies between its parts. So **a lump's colour says where it goes**,
and **a complement greys by itself**: the straight way to the opposite colour runs through the grey centre (measured: a tier-1
complement pressed on a Willpower colour takes it from saturation 0.65 to 0.10). The 30-degree complement window and its number are
gone. The order still matters: each pull is a share of what is left.

### 3.2 Seasoning: the grind that closes the gap (ruled)
Each attribute has **seasoning**, 0 .. 100, filled by doing that attribute's thing anywhere (section 6), at most 10 a game hour from any
one source. It widens that swatch **toward a ceiling**: r = r_rank + (0.13 - r_rank) x seasoning / 100. A rank-0 swatch (0.12) barely
grows; a rank-9 one (0.04) grows to 0.13, three and a quarter times: the grind's gift where the skill gap is widest. No swatch ever
reaches a neighbour's heart, the rim or the grey centre (the nearest is 0.141 away), so a dark seam always shows between tiles.
Firing spends the seasoning.

### 3.3 Firing: the skill that skips the grind (ruled)
- **One firing a press.** Pressing cocks the lever (kept in the save); a firing lets it down. Without it, a colour at a heart stays inside
  every narrower rank and ten pulls took an attribute from 0 to 10 off one press (520 cubes).
- **The cost follows the aim:** fuel x (0.5 + 0.5 x d / r) **/ the press's formation** (clamped 0.5 .. 2): d the colour's distance from the
  swatch's centre, r its radius now. A dead-centre firing at a hot press costs a quarter; at rank 0, 8 to 64 cubes.
- **A true firing** is one inside **a tile's heart**: a quarter of the **bare** rank radius (seasoning widens where a firing counts, never
  where it is true). Said, counted (`alchemy.true`), kept as a yohen star on the tile.
- The log names the cubes taken (never "half the fuel", which is right only dead centre).
- Refusals carry a code: `outside` (no swatch), `full` (rank 10), `poor` (too few cubes), `spent` (nothing pressed since the last firing).

### 3.4 The draught's current (ruled)
Keyed on **the draught** (`game.draught`, fading over a real minute), not on brimming (2 real seconds, `courier/mind.js` `BRIM`): while a
draught lasts, each material pressed pulls a further `draughtPull` (0.08) x its strength toward the draught's feeling at the swatches'
saturation. **It is in the preview** (the one walk, `SoulAlchemy.walk`, is what the press runs and what the ghost paths draw), as is a
spirit at work's extra step (`press.extra()`). Each feeling's hue comes from **the one feeling table**, `weather.js` `COLOR` (Plutchik's
petals; `FEELING_HUE` derives the hues: wonder 191, mirth 45, desire 16, grief 222, dread 135). The guessed `feelingHue` (dread 280) is
gone; `plots.js` `FEELING_COLOR` reads `COLOR` and `game.draughtHex` is written from it (Petra).

### 3.5 Where it stands
At **the Athanor**, the basin at the press's feet (section 4.2). **The press's formation** (its planetoid's features and ground in Wu Xing)
**sets the fuel, never the radius**: the map the eye is learning keeps its size however the garden is laid out. It shows in the Athanor's
vent and the price in the log, never on the bath.

## 4. The UX (Calissa's, 2026-10-08: `docs/handoffs/dovina/2026-10-08-from-calissa-soul-alchemy-ux.md` on her branch, 12d0f33)

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
- **Departs: a tile's heart is a quarter of the tile's bare radius,** not of the radius now. Seasoning widens where a firing counts, never where it is true (ruled: 3.3).

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
  - Two spreads never touch, which needs the ceiling (ruled: 3.2). A dark seam of bath always shows between neighbours, at least 5 px.
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
| Visualization | 277 | Jun lavender | the Cloud (was the Finder: Espada, shapes seen in clouds) |
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
- **The ring only tells the truth with the pull** (ruled: 3.1). Ruled in (3.1): a lump wears its own colour, and that colour is where it pulls.
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
- While the draught's step applies (ruled: 3.4), a slow current crosses the bath toward the draught's bearing on the rim.
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
- **After a firing** the ball rests at its stop until something is pressed: one firing per press (ruled: 3.3).
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
  - the Swift against the Cloud (a diagonal solid against hollow right angles);
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
- **A firing names the attribute, the new rank and the cubes it took,** and a true firing is marked as one. "Half the fuel" is right only dead centre (ruled: 3.3).
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

### 4.24 The seven seals (names confirmed by Espada, LORE.md 5da0e85: the Finder is the Cloud)

| attribute | hue | glyph (16 px; 64 px carving) | why |
|---|---|---|---|
| Willpower | 20 | **The Peak.** 16 px: a solid triangle, base 15 px on row 14, apex on row 2; the only solid glyph. 64 px: the same mass with a snowcap's V line a fifth down and two strata slanting across. | Fudoshin, the immovable mind: Willpower widens the shield's pool and is seasoned by blows taken and by settling. Solid, bottom-heavy and pointing up. It parts from the Still Point and the Fan (deutan pairs) by solidity and direction, and from the Tumbler (tritan) by straight sides against a necked, leaning gourd. |
| Focus | 71 | **The Still Point.** 16 px: a closed ring 14 px across with 2 px walls round a 4 px dot, a clean gap between. 64 px: a thinner ring between them and a highlight on the dot. | Attention held on one point (Eliot's still point of the turning world): Focus makes the statuses you build hold, and is seasoned by building them and by holding a rhythm combo. It is the only closed round figure. It is not the ward glyph (a ring barred across). It shares nothing with the Fan or the Peak, its protan and deutan colour twins. |
| Charisma | 123 | **The Fan.** 16 px: a sensu opened about 120°, a wedge whose point (the rivet, a 2 px stem below it) is at the bottom and whose arc runs along the top, with four ribs knocked out. 64 px: the leaf over its sticks, the guard sticks heavier, a cord and tassel from the rivet. | The rakugo storyteller's fan: one voice and a fan hold a room, which is reading people and being read. That is what Charisma trains (talks, sales, tips) and does (what the folk pay and ask). It is the only glyph pointing down, the Peak's inverse. It is ribbed against the Still Point and a wedge against the Gaze's flat almond, its three colour twins. A first pass: at 16 px it reads as a fan or scallop shell, and the ribs want a hand-tidy. |
| Perception | 174 | **The Gaze.** 16 px: a wide almond 16 × 9 px with sharp corners left and right, a 4 px pupil, and three short lashes standing on the upper lid. 64 px: five lashes, an iris ring, a catchlight, the upper lid heavier. | Seeing it coming: Perception shows a creature's windup sooner, and is seasoned by a parry in its window and by a plate appraised at three stars or more. It is the only glyph twice as wide as tall. The lashes break its top so it never reads as the Still Point. Named the Gaze so "the eye" stays the press's. |
| Dexterity | 226 | **The Swift.** 16 px: a bird banked toward the upper right, scythe wings swept back across a short body, a forked tail trailing to the lower left. 64 px: separated primaries, a deep fork, a pale throat. | Swift twice: the bird that turns in its own length, and quick hands (draw and stow, a swap mid-fight; tsubame-gaeshi, the cut that comes back before a bird could turn). It is the only diagonal, many-pointed glyph, set against the Finder's hollow right angles, its colour twin for protanopes and deuteranopes (ΔE 0.026 to 0.044). It is never called a swallow (retired). |
| Visualization | 277 | **The Cloud** (Espada's name; Calissa's drawing was "the Finder"). 16 px: two right-angle brackets 2 px thick with 7 px arms, at the top-left and bottom-right corners of a 14 px square, the middle empty. 64 px: the brackets as two hands' thumb and forefinger (the painter's finder), a faint sketched circle floating in the middle. | Holding a picture before it is made: Visualization widens the canvas the Soul Brush and the hand work on. The painter's finder is the artist's eye itself, which is the owner's lesson. It is the only hollow, straight-cornered glyph, kept furthest from the Swift. |
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

### 4.25 Who builds what

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

**Dovina:** the rulings (section 3), done 2026-10-08. **Espada:** the log lines in 4.20 and the seals' names. **Wanda:** the sound in 4.19.

### 4.26 Prior art (museum labels)

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

## 5. Teaching without saying (the owner's commandment)

What the player learns, never told: **hue as an angle; saturation as distance from grey; complements cancel to grey; analogous
colours are neighbours; a colour is reached by a path, not a jump.** The swatches carry no names on the wheel, only their colour and
glyph, so in a week of play the eye learns to see "a little too warm, a little too grey" and steer for it. That is the artist's eye.

## 6. The seven attributes: what they widen, how they season (each widening now read by something)

| attribute | widens (at rank 10) | read by (Petra wires) | seasoned by doing | what doing it trains |
|---|---|---|---|---|
| Willpower | the shield's pool x1.5 | `courier/lachryma.js` max | a blow taken on the shield; brimming and settling | composure under pressure |
| Focus | statuses you build hold x1.3 | `creatures.apply` hold | a status built on a creature; a rhythm combo of 25 | sustained attention |
| Charisma | what the folk pay and ask x1.15 | shops (built) | a talk, a sale, a busking tip | reading people |
| Perception | a creature's windup shows x1.5 sooner | `creatures.windup` lead | a parry in its window; a plate appraised 3 stars or more | anticipation |
| Dexterity | draw and stow x1.3 faster | `tools/belt.js` | a tool swapped mid-fight; a Throwing Room drill finished | hand speed |
| Visualization | the Soul Brush's and the hand's canvas x1.4 | Celestial mode, the garden's brush size | a sigil drawn clean; a terraforming stroke | holding a shape in mind |
| Resilience | the clay mends x1.5 faster; +2 hits a ship bears | `courier/vessel/`, the rail | a crack mended at the kiln; a crossing survived | recovering, persisting |

## 7. Synergies (what it ties together)

- **Every livelihood feeds it:** materials are the press's food; a Well run, a fish, a crystal, a bed's harvest each mean a step on the
  wheel. (The economy: materials have a press value, not only a cube value: ECONOMY.md gets the line.)
- **The garden:** the Athanor's layout sets the press's kindness (3.5); the ranks open the Firings, the Firings open the garden.
- **Lachryma and mood:** the draught tints the bath (3.4); the mental state's keeper is now built (`courier/mind.js`).
- **The spirits:** a spirit of a feeling at work on the Athanor gives that feeling's materials one extra step (`workBonus`, as the
  beds and slots).
- **The look:** the soul glow (the vessel lit in the soul colour) shows where you stand on the wheel to anyone who sees you; a
  glaze matched to your soul colour is said by the folk (Espada).
- **Achievements and Arts:** true firings, a rank in all seven, the first Firing each opens (section 3 of TRAINING.md).

## 7a. What it means (the owner, 2026-10-08)

> "Enemy drops are like remnants of an 'experience' and much like in real life we take in 'experiences' and process them mentally,
> which then changes our personality over time."

So the press is **processing**. A material is an experience kept; pressing is thinking it through, in an order (the same experiences
in another order make another person); the soul colour is who you are becoming; a firing is a trait settling. It holds together:
an experience at odds with where you stand (the complement) brings you back toward grey, the calm centre; brimming tints what you
take in with your mood (3.4); seasoning is practice. **Proposed, to make a material remember its experience** (revised on Calissa's measure, 2026-10-08): a material won in a weather is
**more vivid the stronger the feeling it was won in** (its saturation leans toward 1 by `ECON.alchemy.memory`, proposed 0.3 x the
weather's strength; won in fair weather, it leans grey). Not its hue: the five feelings' hues leave stretches of the colour wheel with no
feeling, so leaning hue would starve the attributes there; and since the pull (3.1) makes a lump go where its colour says, a lump's
lived colour is honestly where it goes. A drop won in a storm pushes harder; a fair-weather one gently. Owner to rule.

## 8. Acceptance (each a check in the garden sweep, section 14)

1. At the Athanor the press stands; the hand drops a material in and the drop walks its path; the material leaves the Pneuka Box.
2. A complement greys the colour.
3. Fired inside a swatch, the attribute ranks, cubes are spent at the aimed price, the log says it; outside, refused with why.
4. Seasoning from playing (a parry, a crack mended...) widens the matching swatch, and firing spends it.
5. Seven ranks summed past 7 pass the second Firing; the garden's second-Firing features appear on the PLACE page.
6. Each attribute's widening changes what it names (the shield's pool, a windup's lead, draw time...), measured.
7. No number on the bath; every tile has its seal in the kerb.
8. One firing a press: a second pull without a press between is refused (`spent`).
9. The ghost path's end is the colour the press leaves (the one walk), with a draught and without.
10. The garden's sky and haze come back after the press view.

## Asked of the sisters
- **Calissa:** answered (section 4, the seven seals); builds the look once Petra's station stands.
- **Espada:** answered (section 4.20's lines; the seals' names to confirm); the folk noticing the soul glow read `game.alchemy.colour` (`s`, 0 .. 1, is the glow's strength; `h` its hue).
- **Wanda:** answered (section 4: the sound); builds it on `alchemy.step` and `alchemy.fire`.
- **Petra:** built the first pass (d4597a1); now the press view, the station of 4.2 to 4.13 and the events of 4.19 (4.25), on section 3 as ruled.
