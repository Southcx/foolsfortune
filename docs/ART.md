# The art bible (Calissa's)

The art **teaches**: an ornate box round things that are true (real glazes as they really fire, real stones with their real optics).
Cohesion is the cup's wall; inside it, push.

CLAUDE.md's rules hold throughout: the log is the only text, marks in the world are not text, no aliasing crawl, the PS2 target.
Read sections 1 and 7 first (what a colour means; what each kind of thing looks like). Companions: `VFX.md` (how effects are built),
`GLOSSARY.md`.

## 1. What a colour means

- **Feeling rides lightness, saturation and warmth, not hue** (Valdez & Mehrabian 1994; Jonauskaite et al. 2020): calm is low
  saturation, a fight's marks are bright, a death drains to grey.
- **Hue means what the world teaches, and keeps it:** labradorite = the **Mind** (reticles, wireframes); gold and violet = **Lachryma**;
  warm clay = the **made world**; each damage type owns one colour and one motif.
- **Real materials carry authenticity:** a glaze as it fires, a gem as it behaves.

Every distinction that matters also differs in **shape and lightness**, so it reads without colour vision and at 480 lines. Sound
agrees with colour (Spence 2011, with Wanda): high and short for light and small, low and long for dark and heavy.

## 2. The damage types (`damage.<type>`, its status `aura.<status>` wears the same)

| type | line | colour | motif |
|---|---|---|---|
| Impact | lawful, physical | bone and gold | facets thrown straight, a square flash |
| Ego | lawful, mental | lapis | a hex lattice that opens and holds (doubt) |
| Influence | neutral, social | rose, warm gold | slow ripples, drifting petals (charm) |
| Illusion | chaotic, perceptual | labradorite | curls that turn, glints that never hold (blind) |
| Delirium | chaotic, entropic | ink, violet-green | smoke up, drips down, bubbles (confusion) |

Lawful is straight, crystalline, still; chaotic curls, flows, never rests. **A weather wears its feeling's damage type** (mirth sunshower
and rainbow, wonder diamond dust and halo, desire sand streaks and amber haze, grief long rain, dread the pall), and Gall and Fury their
own motifs (docs/plans/GALL-AND-FURY.md): **the miasma** is rot (violet fog greyed toward bile lying in the hollows, flies, a curdled film
on still water, a bruise at the horizon), **the hail** is heat turned hard (white stones that bounce once and lie melting, pocks on
water, a bright grey-green overcast with a red edge; no thunder until it runs heavy). Each is known by what it does before its colour.

**Built (2026-10-11): the heavy looks and the flood.** Each weather has a **heavy look** at strength 1 (`LOOK[aspect].heavy`,
`vfx/weather.js`), its feeling's big gesture in its colour and paint motif: Wonder's aurora filling the sky (frost), Mirth's confetti
of light under a double bow (dots), Desire's rippling dust storm (ripples), Grief's rain in sheets (streaks), Dread's sky pressing down
(marbling), Fury's close forked bolts (cracks), Gall's risen miasma (curds). On the weather's own programs: no program added. The
awakening borrows it as **the flood** round the Courier, indoors too (`vfx/awakeninglook.js`), and the Courier answers with **a
feeling's clip** (`courier/anim/feelingclips.js`).

## 3. Materials and shapes

- **Lachryma:** liquid is near-black with the oil film's thin-film sheen (fresh: cream glow, through amber, oxidising to black); solid
  is **bismuth** (stepped hoppers, oxide colours face by face: `vfx/bismuth.js`); mental is labradorite. **Crude is not water:** no
  white foam, never water-blue. How much you hold is shown as matter, never a digit (precept 2).
- **A note has one colour everywhere** (`DEGREE_COLOR`: gold the root, rose, green, blue, violet): the bell's vents, the rhythm lanes,
  and a crystal's **frets** (`vfx/crystalfrets.js`: the stave as five panes of stained glass, foot to point, leaded in Lachrymite violet,
  deepened so they hold on noon sand; Boomwhackers, tourmaline grown in layers of colour). Only the stave is fretted; the lesser
  spires stay lilac.
- **Liquids are drawn by one library** (`vfx/liquid.js`; packs baked by `scripts/bake_liquid.py` from the owner's noise photographs).
  Water paints its floor (ripples, caustics, depth colour, Fresnel short of a mirror, sparkle welcome); Lachryma is ink with the film in
  its cells and veins. Prior art: Sunshine's crossed waves, Portal 2's flow maps, Sea of Thieves' crest glow.
  - **Water is never plastic** (the owner, 2026-10-08: the ripple read "a little too plastic-y"): its highlight is broad and soft and
    its gloss varies in slow patches, the rings bend the light and never whiten, and nothing glints in one even coat.
  - **The caustics are a Voronoi cell texture in two layers** (`liqCaustics`, `causticTexture()`): curved threads that swell into knots
    where three cells meet, the second layer the same net a little apart in a cooler, more saturated hue and fainter, so the line is
    white where they meet and splits into colour where they part (a real caustic's dispersion); the marbling bends the net so it
    writhes, and a slow wash keeps it from tiling. On the floor under the shallows, and a faint web of it on the surface.
- **Sacred geometry is grammar:** the owner's wife's circles (`circle_lotus`, `circle_swirl`) layered and counter-turning; hexagons are
  the lawful mind, spirals the chaotic.
- **The world is thrown and fired** (lathe forms, slips, glazes, kiln marks; clay: precept 1); the tools are instruments with a
  silhouette and a stance.
- **The Vessoul's forms are one hand's work:** the sloop is the Pneuka Jar on its side, the garden is inside the Jar.
- **Skirts:** a model on the ground declares its foot (`render/triplanar.js` `foot: { tex, height }`), so no hard line shows where it
  stands. Left to skirt: cave pillars and stalactites, finds, clutches, datura stems, solar rings and geyser vents, the crown chimneys.

## 4. The glazes (`courier/vessel/glazes.js`; patterns `vfx/finish.js`)

Start: terracotta, bisque, shino. Achievements: celadon, tenmoku, raku, oribe, oxblood, jun, nuka, copper lustre, Lachryma black.
Medals: hare's fur, oil spot, guan, kinrande, ru, yohen tenmoku. Shop: natural ash, kaki, ame, cobalt, majolica, salt glaze. Each rare
glaze carries its kiln pattern drawn as the real one forms, fading as its cells shrink below two pixels (no shimmer at range). The kiln
also sets gems with their real optics, hair finishes and skin tones.

The Great Slip Jelly's two (its drops: `gj1`, `gj5`) are the fight worn home, and both paint the part in colours of their own:
- **JELLY-CROWN** (pattern 7, **the dip**): a slip-green celadon (0x8ab894) dipped to the chest, as the crown sat in the jelly. It stops
  in the urn crown's own broken lip (`urncrown.js`'s jag round the lathe's forty sides, straight between them, as a fracture runs),
  thick and deep green along the lip and in every hollow of the painting, crawled apart just above that thick edge (**kairagi**, as
  on a Korean Ido bowl's foot) with the slip dry between, a few blunt runs below; under the lip the jelly's wet
  slip (0x7a5434), glossy. Nothing in it glows: a lit crackle on the vessel reads as its cracks. After Ru and Longquan dipped celadon,
  and the Ido bowls' kairagi.
- **EYE CUP** (pattern 6, **the eye**: `vfx/eyecup.js`): Attic black-figure in the ware's colours (`blackfigure.js` WARE): the red clay
  (0xc8643a) with the black (0x1c1410), added white and added red, and an eye placed on every part, staring: one on the chest, the
  chest's stone its pupil; a mirrored pair on the back either side of the Lachrymato Bottle; one on the back of each hand; one on the
  outside of each thigh; the black below the knees as a cup's foot, two lines reserved in it. On the trim, the black (a cup's lip and
  handles); on the mask, a black-figure face, the painting's pale eyes in added white with the crown's blue iris (the Eye Cup cast's
  eye, `foelook.js`), its marks in added red. Each eye: an almond of two arcs, outlined in the black with a line incised through it,
  the iris rimmed and ringed, a pupil, a catchlight, a brow; every line fades under two pixels. After the Attic eye-cups (kylix type
  A, c. 540 to 500 BC: Exekias's Dionysos cup) and the Gorgoneion of their tondos.

## 5. The rules each place keeps

- **The glitch** (`vfx/glitch.js`, the owner: "lean into it"): an event's pulse with an end (the FOE showing itself, an ultimate, a mind
  rewritten), stepped at 6 to 10 a second, under the WCAG flash line, off by `visual.glitch`. Never ambient, never decoration.
- **The data drain** (`vfx/datadrain.js`): polygons streaming into the bracelet, unlit, so it reads on white sand and in the dark.
- **The night sky** lives in the dome's shader (`vfx/sky.js` NIGHT_GLSL): our own stars, a soft Gaussian never under a pixel wide,
  turning once a game day; each its own temperature on the Planckian locus (a lognormal round 6300 K) and brightness on a power law;
  behind the cloud layer (its field read in the dome), thinned by the night painting's swirls and a slow high cirrus, dimmer low down;
  meteors every 25 to 70 s; the aurora at the Shore. No draw call, no program.
- **The wire compass reads on any sky** (`vfx/wirecompass.js`): every line keylined in the opposite tone, and the device's ink from
  what is behind it (the sky's state in memory, never the GPU): pale light on a dark sky, dark ink on a bright one. One program for
  the tape, the vane's marks and the pendulum.
- **The spirit press:** the soul colour is its only bright thing, shown as the soul bead, the drum's pool and the hue ring, never
  written; it is the vessel's Lachryma, so a new Courier looks exactly as made.
  - **The bath is neutral** (SOUL-ALCHEMY.md 4.4, Albers): black Lachryma over a dished clay floor, pale over the grey centre and black
    at the lip, never lit in the soul colour.
  - Every colour on it is `wheelColour` (`vfx/wheelcolour.js`, Oklab) and self-lit through `selfLit` (`vfx/selflit.js`, the tone curve
    and grade undone), so a tile shows its glaze exactly and the bead dead on it vanishes.
  - Distinctions are carried four ways before colour: bearing and distance, the seals' shapes, value and gloss, motion.
  - **The surround is grey while you judge** (4.3): the press view eases the garden's sky, haze and fog to the grey of their own
    lightness, and the HUD steps out but for the folded log.
  - **Everything that answers is physical** (4.12, 4.13): the lever's ball up or down and warming, the eye brightening, the press's
    lantern tall or guttering; a firing is a hit-stop, a burning glass, a white kiln heat cooling to crazing and the tile shrinking a
    step; a refusal is a crawl, a break's glint or a gutter, never a flash or a word.
  - The hokora is the garden's palette in small: grey stone, plum-dark wood, a moss roof.
- **The choice card and its icons** (`ui/choicecard.js`, `ui/icons/`, `ui/keywords.js`; CLARITY.md sections 4, 5 and 8): a choice is
  a card, never a grey sentence. One order on every card (icon, label, one line, chips, key, state), so the eye learns where to look
  once. **The icons are enamel in a wire** (cloisonne): only the light shape is drawn, bevelled from the top left, and the hand keylines
  it in the darkest grey, so it reads on all five window colours and on a pale ground (casebook rule 105); 16 px at 2 px a pixel
  (8 px chips at 1), whole numbers only. Each is a picture of what the thing DOES (the Grapple's grapnel, the Bomb's bell ringing out,
  the Absorb Spray's aerosol), never the tool ashore: the label is a genre word, so the picture is a genre picture too. **Gold is the
  icons' own colour and the keywords'**: one accent for "this is a rule you can use". A state is a palette swap, never a redraw (grey
  for locked), and **no colour stands alone**: equipped carries a tick and its word, locked a padlock and its opening line, a compared
  number a solid arrow for better and a hollow one for worse beside its green or red. The lore lives in the detail, in the lore face
  (IM Fell), shown on hover only.
- **The crossing:** the sea is ink; everything you can shoot carries the one warm or pale thing on it. Parryable things wear only the
  Lachryma outline (`vfx/parrymark.js`).
- **A mount's preview** (`vfx/mountpreview.js`; CLARITY.md section 6, after Into the Breach): what a mount does is drawn on the crude
  round the moored hull before it is a word, at the size it has round the ship at sea, one at a time. A shape a mount: the line of fire,
  a fan, a blast ring, a cone, a viewfinder, a grapnel line, a radar's scan; its motion says which way it works (a spray's arcs go out,
  a vacuum's come in, a shockwave leaves the hull, a hook is thrown and reeled, a scan line turns clockwise). In the mount's own colour
  (the Blaster and Absorb Spray wear the ship's feeling, the moored hull's, as they do at sea; the Bomb coral, the Vacuum violet, the Snapshot the Flash's warm
  white, the Grapple sea-teal, the Radar the vane's green), each line shaded dark at its edges so it holds on noon sand and on the black
  crude, the Mind's schiller along its heart. Lines are screen-space (never under a pixel and a half, a pixel of soft edge: they cannot
  crawl), lifted a hand over the drawn crude and hidden by whatever stands in front (the jetty, the hull, the Courier, the sand). It
  breathes at one slow rate and carries no word or number. It is seen as the mount is chosen, not after: the pier's page is set aside from
  the hull with no veil, and the game's loop keeps the preview moving under it.
- **The shoal and the Mind's furniture** (`vfx/shoal.js`, `vfx/shoalsilhouette.js`, `vfx/railgeometry.js`): a glint is ink with mirror
  flanks (the storm's gold-white above, the crude below) and a labradorite edge; drawn up into the silhouette the school glows in the
  stone's blues, violet to peacock, so a shape of fish reads on a bright sky and the black crude alike, and its eye is the one lens.
  The ambient geometry is wire in the same blues over dark glass (gold is kept for a ring you threaded), black labradorite slabs, and
  the crude folded overhead. One program for all of it but the glints. The stone's colour on all of it is each piece's own, never the
  world's (the rail carries them through the world at 26 m/s), and the eye, which is shot at, is never bent by the storm.
- **The Great Slip Jelly's bowl:** stone is ammunition (seam, log, rubble); the sand streams toward the pool it is in; the slip ripples
  where it will rise, never a painted ring; **the body is the telegraph** (`vfx/foelook.js`, one shape per cast).
- **The catch:** one look for the Jar and the coffin: a mouth drinking a mind (`vfx/catch.js`).
- **The garden** (Dual Hearts): pastel air tinted by your draught, a cloud sea below, toy planetoids (`vfx/garden/`); a feature wears
  its feeling's colour; a form is its element plus a halo (Law) or horns (Chaos).
  - **The grounds the hand paints wear their phase, not their feeling** (`vfx/garden/gardengrounds.js`): moss jade cushions, ash pale
    over embers, loam ochre clods and rootlets, slate silver-blue cleft, silt blue-black and crazed. The feeling is only the accent
    (dew, embers, flecks, sheen, the gleam in a crack), so a painted planetoid reads as ground first and mood second. Borders are
    height-blended (the higher one shows), never a smear across a cell.
  - **The water is the feeling, outright** (`vfx/garden/gardenwater.js`): Lachryma in its feeling's canon colour, dark where the light
    goes in and glowing from inside as it deepens (and by night), the marbling's film in its veins and at its meniscus. Two feelings in
    one pool are an agate, wedged along the marbling and never blended; opposites that meet are fair water, milky as nacre. Ground it
    wets darkens and glosses for 20 real seconds, with caustics under the shallows (the shared Voronoi net, section 3); still water
    lies level (its normal the planetoid's up, so no shore triangle catches the sky) and glows evenly by day.
  - **The rain is your draught** (`gardenrain.js`): thin streaks drawn toward the sky's pale, each falling to its own planetoid's
    heart, a ring where it lands, the sky greying under it.
  - **The plants are toys** (`gardenplants.js`): chunky moss cushions with fern sprigs, herb rosettes that bloom in desire's colour,
    reeds with a cattail; lit by up-turned normals like the ground they grow from, shrinking away past 18 m so the ground carries the
    green.
  - **A cascade is a ribbon** (`gardencascade.js`): its feeling's colour scrolled down the fall, frayed white at the edges, spray at the
    foot.
  - **The bought four** (`boughtplanetoids.js`) each keep one idea: the Moon's craters, the Koi Pond's teal crown, the Drill Yard's ring
    of posts, the Bone Bed's ribs.
  - **The trees are grown, not built** (`leafcanopy.js`, `gardentree.js`; the owner's billboarded leaves): a crown is a few spheres of
    leaf clumps lit as one soft round mass, never leaf green but labradorite (dark stone walking ultramarine, blue, peacock and green
    as you go round it) edged and veined in gold, on plum-dark bark; the gold glows a little more by night, low and steady. A crown
    may take a tint (Myggdrasil's tincture), which leans its flash and keeps its value.

### The room glazes (built 2026-10-11: `vfx/roomglazes.js`, drawn by the room glaze atlas in `vfx/surfaces.js`)

One look: **the building is fired clay**, and a potter's building at that. Downstairs is the making, upstairs the showing, the hub the
measuring. Terracotta stays the ground everywhere (the floors, the walls, the iron-dark wood); a glaze goes only where a potter would
put it, a few to a room, never a rainbow. A room glaze is not a glaze (the Courier's, section 4): it is a row of `ROOM_GLAZES`, chosen for
each kind of built surface in one table (`ROOM_SURFACES`), and the rooms carry one colour id each (`ROOM_GLAZE_ID.kiln`).

| where | room glaze | why |
| --- | --- | --- |
| both kiln domes, the lintel over the mouth | **natural ash** (Bizen's goma where thin, Shigaraki's green bidoro pooled) on firebrick | the kiln's own glaze: the fire lays ash on whatever faces it, the kiln first; it lies on the shoulder and runs down the sides. The body is firebrick now (it was drawn as planks) |
| both chimneys | firebrick, bare | |
| the ground floor's ware | bisque and terracotta (as they were) | a workshop's shelves hold ware waiting for its glaze firing |
| the gallery's plinths and bases | **majolica white** (tin glaze) | haniwa, dogu and Jomon pots were unglazed earthenware: the sculpture stays bare and stands on white, as a museum shows it |
| the showroom's stepped stand | **tenmoku** (Jian), rust only as specks | a dark ground for the pale ware; hare's fur streaks are not drawn (on a flat slab they read as wood grain) |
| the showroom's ware | **celadon** on the west table; white porcelain and **tenmoku** tea bowls on the east; **shino** with one **oribe** on the stand; one **sang de boeuf** vase at its top | the showing: Longquan, Jian, Mino and Jingdezhen side by side; the building's one red glaze is as rare as the real one |
| the hub's four walls | **salt glaze** on grey stoneware brick | the glazed brick of a Victorian works, put where a wall must wash and throw the lamplight back; grey where the salt lay thin, toffee where the flame flashed it. Their backs are the course's inner walls: the hub is a grey box in the red course, a landmark |
| the Index's pedestal | **celadon** (Longquan) | the hub's one glaze; Pip in bisque beside it |
| the hub's heights ladder | its tone ramp, unglazed | a code by what each height takes, already the clay's own firing range, bisque to iron |

**How a room glaze is drawn** (no new program: the built surfaces' one program, `dress`, reads it, and a palette colour has no glaze and
draws exactly as it did). The clay body's pattern first (plaster, tiles, planks, brick), then the glaze over it from **the room glaze
atlas**: one 128 x 128 texture, a metre a tile, mipmapped. **R the pooling** (soft blotches, read at 2.7 m and at 1 m a tile and mixed, so a
40 m wall shows no repeat), **G the runs** (rivulets 6 to 12 cm wide that start thin and end in a bead), **B the orange peel** (6 and 12 cm
dimples), **A the specks** (3 to 5.5 cm: iron, ash, rust, a pinhole). A glaze **lies** where its row says (on floor-facing faces, on
wall-facing faces, and for a glaze the fire laid, the ash, on top and running down the sides), **pools thick** in the floor-facing faces,
the pooling's blotches and the body's recesses (mortar, grout, a seam), and **runs thin** over what stands proud, where its specks show.
A clear glaze (salt, ash) shows the body's relief through it; an opaque one (majolica, tenmoku) hides it. **The gloss** is the glass's
own (the ash's glass 0.5, a lamp's highlight broad and soft; the bare firebrick 0.88), and **the sheen** is the room's own light (its
ambient and hemisphere) taken as a dim surround and reflected by the standard material, so the glass shows at its turn and not face on;
a black glaze takes little of it (the tenmoku 0.3: an even sheen on black lies as a grey veil, and its lustre is the lamps' highlights).

**No crawl:** the finest mark is 4 texels (3 cm, three pixels at 4 m at 480 lines), mipmapped to plain tone beyond. Where a glaze stops
is a fixed band of its cover, never one widened by `fwidth()` (one value a 2x2 quad: the edge moved with the quads as the camera slid),
and its runs are their own soft profile, never cut at a level (a cut sharpens what the mips softened); on a curved face the atlas is
read along the three axes and blended by the normal, so the box mapping's switch of axis leaves no seam (NEW:threshold-fixed-band).
**Not drawn, and why:** crackle (a net a texel wide would crawl), slip-trailed earthenware (a
trailed line is the same; it belongs later on the drying rack's plates, with the dip), hare's fur on a built surface (see the stand).
The glazed ware's bare foot (**the dip**) is asked of Petra (`world/props/pottery.js`).

Prior art: the glazes' own history (each row in `roomglazes.js` says where and when); Okami's and The Wind Waker's painted surfaces, a
few broad colours to a surface and the light doing the rest; the PS2's tiling texture over a colour (section 7, precept 1).

| room | clay | accent | state |
|---|---|---|---|
| the workshop | red earthenware | kiln orange; the ash glaze's green on the kilns | built (2026-10-11) |
| the hub and the index | grey stoneware (salt glaze) | celadon | built (2026-10-11) |
| the movement lab | buff bisque, a test grid | ochre | proposed |
| the mill and kiln stack | iron-red and soot | ember | proposed |
| the siege | black basalt, raku white | oxblood | proposed |
| the circuits | porcelain, blue underglaze | cobalt | proposed |

## 6. The Courier's face

The E-ink mask was rolled back (`d4872d0`). For the next try: **pupils much bigger** (15 px in a 116 px eye was too small); **sleepy read
well**; **no shadow rim** round a changed eye shape. **The owner makes the atlas**; the runtime (the swap after `map_fragment`, the stepped
blink and look, the event map) comes back from `d4872d0` to drive it.

## 7. The precepts

What each kind of thing looks like, so a new feature knows how to draw itself (this was LOOK.md; code cites it as "docs/ART.md,
precept N"). Precepts 1 to 3 are three materials of meaning, each with one language, never borrowing.

1. **Clay is solid, warm and outlined:** the world, the folk, the pots. The cel ramp (`render/toon.js`), an ink outline, the terracotta
   palette; built surfaces are one modest tiling texture times a palette colour (`vfx/surfaces.js`), a room glaze over it where a potter would
   put one (section 5, "The room glazes"). Clay squashes, wobbles, settles,
   breaks into shards; it never glows except where it holds Lachryma or a kiln's heat.
2. **Lachryma is matter, never line** (its colours: section 3). How much is shown by **volume, fill and brightness**, never a digit
   (the tube, the beads, the rim, the filigree lit with its load).
3. **The Mind is black labradorite, drawn in lines** (`vfx/labradorite.js`): lines are the schiller, softly rainbow toward pale
   ultraviolet, additive, a pixel wide at 480 lines; surfaces are ink with the schiller rising at the turn. A wireframe bursts in once,
   then holds or turns at a constant rate; nothing blinks at a variable rate; low-poly on purpose (under ~40 segments). Prior art:
   Vagrant Story's sphere, Parasite Eve's dome, Gearbolt's closing frames, Rez's lock squares, ZoE's ring radar.
4. **Gold is yours:** a reward, an achievement, a rarity, kintsugi. Kept off passive marks (and off the overlay: gold means won).
5. **Reach is a volume on the body; state is a frame on the target** (a dome round the Courier, a closing frame or glyph on the thing).
6. **Magnitude is hue, size and closure:** a ring's radius, a frame closing, an arc's fill, cool (far, safe) to hot (near, now). No
   numerals.
7. **Words live in windows** (the log, the dialogue box, menus); the world gets punctuation: a glyph, a chevron, a frame, a bar. Key
   help belongs in the Codex or is said once by the log.
8. **Comfort:** large wire volumes are low alpha, depth-tested, shown only while choosing; nothing large changes brightness at a
   variable rate; motion is things actually moving.
9. **Motion is exaggerated, whimsical, grounded** (the owner: Monster Hunter's way):
   - **A silhouette per tool**, its idle stance known across a room (`courier/anim/stances.js`).
   - **Captured motion, pushed:** UAL and CMU clips, their swing from their own average exaggerated 1.3 to 1.5 times, a pose laid
     over; the capture's weight and timing kept.
   - **Clear poses, clean arcs:** one strong line through body and tool; no limb through the face or body.
   - **Anticipation and follow-through**, time-warped onto the game's own beats (a move's timings are its feel and never change).

The overlay (the HUD ring and the marks round it) applies these in one grammar: `docs/plans/OVERLAY.md`.

## 8. Effect meshes: made in Blender

One file, `source_assets/vfx/effects.blend`: one object per mesh in its **FX** collection, named as the game asks for it
(`vfx/library.js`). Its flow is on the object's Custom Properties: `fx_speedU`, `fx_speedV` (tiles a second), `fx_blend`
(`additive` | `alpha`), `fx_side` (`double` | `front`). Export with `python3 -I scripts/export_vfx.py`. Any GLB in `src/assets/vfx/` is in
the game by its file name; any PNG in `src/assets/vfx/tex/` is a texture a `decal` layer can wear. `node scripts/meshflow.mjs --author`
roughs a shape out headless; `export_vfx.py --import <glb>` brings it into the .blend to finish.

## 9. The placeholder audit

What to replace first (ours, placeholder, genre default) was kept here until 2026-10-08; it is now a dated note: `docs/archive/2026-10-08-art-placeholder-audit.md`.

## 10. The core movement's clips (the locomotion pass, 2026-10-10)

Every clip below is the Courier's suite (`source_assets/Courier/courier_anims_move.glb`, baked into `core.bin`; the base file
`courier_base_rigged.blend` holds no clips, only a camera rig's and one held pose), its knees and elbows put on their hinge as it is
decoded and the posed body squared again after IK (the hinge repair, `courier/anim/hinges.js`). The gait shares one phase (each loop's
left heel strike at phase 0) and plays at the ground speed over the loop's own (measured from its planted foot: walk 0.77 m/s, jog
4.81, sprint 4.43, the prowl 0.61), part longer strides (to 1.65x walking, 1.3x running, 1.4x prowling), the rest cadence; planted
feet lock. The skid stop and the half turn are one-shots over it (`courier/anim/stopturn.js`), the hips' travel out in the clip's own
frame and, for the turn, its yaw too (casebook rule 180): player.js keeps the speeds and the body's yaw.

| state | clip | blend |
| --- | --- | --- |
| idle | `idle:upright` (Loco_IdleC's body, Loco_IdleFem's left arm and its mirror); under a tool's layer `idle` (Loco_IdleMasc, its left hand's flick held out); fighting Loco_IdleAlert; the Bs: breaks Loco_IdleLookAround, Loco_IdleStretch, Loco_IdleShiftTap, and an idle's own captured loop (below) | into the walk by 0.5 m/s, the idle's share at most a whole in 0.15 s (a start); a B after a random 4 to 5 of the idle's loops still (the owner, 2026-10-10); breaks in 0.5, out 0.6, cut 0.15; an own B in step with A, in and out 0.25; alert 3/s |
| walk | `walk` (Loco_WalkMasc) | 0.5 to 2.4 m/s |
| run | `jog` (Loco_RunMasc) | smoothstep from the walk, 2.4 to 3.4; whole at 4.2 |
| sprint | `sprint` (Loco_Sprint) | linear from the run, 4.2 to 6.8 |
| run, sprint with the cutlass drawn (new) | `stance:cutlassRun` (`jog` baked: `courier/anim/stances.js`) and `stance:cutlassSprint` (`sprint`): the loop's chest and free arm as captured, the blade arm's swing at 0.3 of the run's, its hand turned so the blade points back, a little down and out, held 0.8 of the way to that (`steady`), the hand moved to the hip, behind it; no blade run in the suite, UAL or CMU (`tools/sondelass/sondelass.js` drawnRun) | the upper body's tool layer in place of the en garde idle, by the gait's running share (`st.run`: the jog's and the sprint's weights, out in the air, a slide, mantle, dash, wallrun, crouch, crawl or skid; damped 12/s), the sprint's bake by its share, on the shared phase; a stroke or the guard over it |
| backpedal, strafe | the same loops, run backward past 110 degrees | the hips turned toward the move (70 at most), the chest back to the aim |
| starts, stops, turns | the gait on its speed (damped 12/s) | a let-go foot lock eases out and waits for the next step; the body leans into a turn |
| skid stop (new) | Loco_SprintStop from its brace (0.07 s) at 1.15x, in place: when the speed falls under 4 m/s within 0.25 s of 5.6 m/s or more, still heading within 20 degrees of the sprint (a stop, or a reversal on its way through zero) | in 0.08; out as it stands (its 0.72 to 0.95 s); cut over 0.12 s when the move picks up 1.2 m/s again or the ground, a crouch, slide, mantle or dash takes over; not in first person |
| half turn (new) | Loco_Turn180, its frame the one whose hips have turned as far as the body (time-warped onto player.js's turn; at its own pace once the body is round), in place and unturned, mirrored for a turn to the right; to 0.7 s (its frame 22 is its first again) | on a reversal: the move over 100 degrees behind, from 3 m/s or more through under 1.5 within 0.3 s, the body turning to it at 1.5 rad/s or more; in 0.06, out 0.42 to 0.58 s (the run back on the legs as the body faces the move); the skid gives way to it; its feet planted only under 1 to 3 m/s (the capsule is back at a run 0.08 s after the reversal) |
| crouch | Loco_CrouchIdle; moving, the prowl: Loco_CrouchWalk (`PROWL`, `courier/anim/prowl.js`; new, after Loco_SneakWalk) by 0.5 m/s; the head held half still (below) | the idle at 0.8 of the crouch's weight, the prowl whole once moving, on the shared phase; the foot IK lifts its hips 0.14 m over the clip's squat (0.51 to 0.56 m: the trailing knee 25 cm off the ground, where at the clip's own 0.37 it knelt at 13 and read as a lunge); strides to 1.4x, the rest cadence (2.6 steps a second); posed top 1.40 m, under the basement tunnel's 1.5 |
| crawl (new, its body to come) | Loco_CrawlEnter, Loco_Crawl (hands and knees), Loco_CrawlProne (the belly), Loco_CrawlExit (`CRAWL`, `courier/anim/crawl.js`) | while `s.crawl` (player.js has no body for it yet: docs/handoffs/petra/2026-10-10-from-calissa-crawl.md); down by the enter from its squat (0.2 s in) when crouched, faded in 0.15; the loops on their own phase at the move's speed over theirs (0.29 and 0.39 m/s), strides to 1.3x; `s.prone` blends to the belly; up by the exit to its squat (0.4 s) or standing (0.64); the foot IK, the reach drop, the knee guard and the prowl's head give way to it. Posed top 1.05 m (hands and knees), 0.74 (belly). The belly lies past its capsule (fingers 0.97 m ahead of the axis, toes 1.25 m behind, 0.46 m to each side; `CRAWL.outline`), so the clearance (`Crawl.clear`) casts 48 rays round the axis at 0.3 m and slides the pelvis along each surface's normal until nothing met is inside the outline (opposite walls cancel, a corner adds, the poke of a conflict shared over 4 rounds), by at most 1 m, in 0.017 s and out in about 0.15 s; ~0.09 ms a frame prone |
| jump, rise | Air_JumpStart from 0.15 s, then Air_JumpLoop | in 0.06; to the loop at 0.9 s over 0.3 |
| off a ledge | Air_JumpLoop from 0.5 s | 0.25 |
| fall | Air_FallLoop past 5 m/s down after 0.45 s in the air | 0.35 |
| double jump | Air_DoubleJump from 0.07 s, 1.25x until upright | in 0.08; to the loop at 0.82 s over 0.2 |
| land soft, hard | Air_JumpLand from 0.1 s, by the fall (7 m/s whole); Loco_LandHard from 9 m/s (whole at 11), 1.5x | out 0.12 to 0.5 s, and 0.4 to 0.7; less of both while moving |
| slide | Trav_SlideStart from 0.15 s, Trav_SlideLoop; out by Trav_SlideExit | 0.2 into the loop; the exit over the slide's own fade |
| wallrun | the sprint at the wall's speed, the body rolled 24 degrees off the wall; the wall hand and foot put on it | the wall's blend (player.js) |
| wall jump | Trav_WallJump's push from 0.13 s, 1.1x, in place and unturned, over Air_JumpLoop (new: it had played the ground jump's spring) | in 0.06; out 0.35 to 0.6 s |
| mantle | Trav_Mantle 0.15 to 0.62 s; a knee-high wall Trav_Vault; from a hang Trav_LedgeClimbUp | time-warped onto the mantle |
| air dash | Air_AirDash, AirDashL, AirDashR, AirDashBack by the dash's direction | from 0.1 s at 1.5x through the dash |
| ladder, swim | Trav_LadderClimb, Trav_LadderIdle, Trav_LadderEnter; the old pack's swim and tread | the techs' own (moves/ladder.js, moves/swim.js) |

In the suite and not played (the social pack): Loco_WalkFem, Loco_RunFem and Loco_SprintHero (other walks and runs), Loco_SneakWalk
and Loco_CreepSideR. Loco_SprintStop and Loco_Turn180 moved into the core pack (2026-10-10: core.bin 2,920,462 to 2,950,390 bytes, 161
to 163 clips); then the prowl round (2026-10-10): Loco_CrouchWalk and the four crawl clips in, Loco_SneakWalk out (core.bin to
3,004,786 bytes, 167 clips).

**The prowl** (the owner, 2026-10-10: "a hunting, predatory sort of movement, like a lion prowling. Note that felines have a very still
head"). The three crouched loops rendered at the crouch's 2.2 m/s, every tool off, front and side, the head measured in the world against
the capsule (bob up and down, sway side to side, its turn's speed):

| loop at 2.2 m/s | its own speed | head bob | sway | turn, mean / fastest |
| --- | --- | --- | --- | --- |
| Loco_SneakWalk, let down 0.38 m (the crouch to now) | 0.40 m/s, 4.8x its cadence | 19 cm | 56 cm | 1,448 / 2,731 degrees a second |
| Loco_CreepSideR (a sidestep creep) | 0.32 | 15 | 38 | 712 / 1,824 |
| Loco_CrouchWalk, as it is | 0.61 | 8.5 | 11 | 23 / 36 |
| the prowl: Loco_CrouchWalk, the head held (2026-10-10) | 0.61, 1.4x strides | 3.0 | 4.1 | 3 / 6 |
| the prowl now: the hold at half (`PROWL.still` 0.5, 2026-10-11) | 0.61, 1.4x strides | 5.2 | 6.9 | 11 / 18 |

The owner (2026-10-11): "the head is a little TOO still. Can we split the difference between the two versions?" Both passes below are laid
on at `PROWL.still` of their weight (1 the cat's whole hold, 0 the clip's own head): at 0.5 the head lives a little, halfway in bob, sway
and turn between the two; the body under it (the hands, the knees, the hips, the feet) measures the same to the millimetre. The sneak's
head swings with its tiptoe at any pace, and its cadence multiplied it (casebook rule 188). The head held is a cat's: its turn
in the body's heading frame followed slowly (2.5/s) and levelled to a gaze 10 degrees below the horizon, shared up the neck (spine004 a
quarter, spine005 three tenths, the head the rest, each capped at 22, 20 and 30 degrees off the clip), before the aim's look; after the
feet, its place against the capsule followed slowly (2/s) and the neck's base swung to hold it there (0.85 of the way). A turning prowl
(1.2 rad/s): bob 3.0, sway 4.1, the head turning with the body at 69 degrees a second. The first-person eye rides the posed head while
crouched (player.js), so it is as still.

**The cutlass's drawn run** (the owner, 2026-10-11: "The Sondelass needs an animation for running while the Sondelass is drawn"). Before,
the run's legs carried the en garde idle's upper body (Sond_Idle over the upper-body mask): both arms held out still, the blade up and
ahead of them to the right (its tip 0.9 to 1.3 m out to the right, 1.4 to 1.8 m up, 0.8 to 1.2 m ahead). No blade run is in the suite
(courier_anims_melee.glb, courier_anims_move.glb), UAL (anims.bin) or CMU, so the run's own loop is baked into one: the hand's turn solved
from the blade's own direction (the socket's), averaged over the loop, then held to it 0.8 of the way (`steady`, new in stances.js), the
hand moved to the hip by IK. Measured in game, the run (4.2 m/s) / the sprint (6.8): the hand 0.76 to 1.02 m up, 0.03 to 0.29 m behind;
the tip 0.44 to 0.79 / 0.42 to 0.74 m up, 1.16 to 1.47 m behind, 0.31 to 0.41 m out to the right; the chest and the free arm the run's.
Judged front and side, every other tool off (Calissa's scratchpad, `melee-p1a/drawnrun/`).

**The idles' A and B** (the owner, 2026-10-10: "A should play 4x to 5x more often than the B"). A is the standing idle's loop; a B a
break, or an idle's own gesture held out of its loop (`IDLES.calm`, idlebreak.js: the bones' frames bridged, the loop as captured kept as
`<clip>:B`). Measured over 20 real minutes of standing: upright (4.0 s loop) 4.45 of its loops a B (4.0 to 5.0), braced (2.5 s) 4.52,
weightShift (5.0 s) 4.46 (3.7 to 5.3: its own B waits for its loop to begin). Per idle:

| idle | A | B |
| --- | --- | --- |
| upright, akimbo, hipCocked, handsBehind, armsDown | the loop | the three breaks in turn |
| braced (Loco_IdleMasc, and IDLE.under) | the loop, the left hand's flick held out (frames 14 to 56): the hand off the chest 13.4 cm/s mean, 51 fastest, to 9.6 and 16; the index finger 344 degrees a second to 3 | the breaks (the flick is gone: the owner's ask) |
| weightShift (Loco_IdleD) | the loop, the right hand's throw held out (frames 29 to 133): 37 cm/s mean, 2.1 m/s fastest, to 7.4 and 20 | `Loco_IdleD:B` (the throw, as captured) and the breaks, in turn |
| restless (Loco_IdleE) | itself: never still, its B is what it is | the breaks |

The stances baked over braced keep its left arm (the Crucibelle's and the Soul Brush's, at 1.4x): their left hands are as calm.
