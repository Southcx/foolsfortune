# The art bible (Calissa's)

The art **teaches**: an ornate box round things that are true (real glazes as they really fire, real stones with their real optics).
Cohesion is the cup's wall; inside it, push. Companions: `LOOK.md` (precepts, motion), `VFX.md` (how effects are built), `GLOSSARY.md`.

## 1. What a colour means

1. **Feeling rides lightness, saturation and warmth, not hue** (Valdez & Mehrabian 1994; Jonauskaite et al. 2020): calm is low
   saturation, a fight's marks are bright, a death drains to grey.
2. **Hue means what the world teaches, and keeps it:** labradorite = the **Mind** (reticles, wireframes); gold and violet = **Lachryma**;
   warm clay = the **made world**; each damage type owns one colour and one motif.
3. **Real materials carry authenticity:** a glaze as it fires, a gem as it behaves.

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
and rainbow, wonder diamond dust and halo, desire sand streaks and amber haze, grief long rain, dread the pall).

## 3. Materials and shapes

- **Lachryma:** liquid near-black with the oil film (fresh: cream glow, oxidising to black); solid is **bismuth** (stepped hoppers, oxide
  colours face by face: `vfx/bismuth.js`); mental is labradorite. **Crude is not water:** no white foam, never water-blue.
- **A note has one colour everywhere** (`DEGREE_COLOR`: gold the root, rose, green, blue, violet): the bell's vents, the rhythm lanes,
  and a crystal's **frets** (`vfx/crystalfrets.js`: the stave as five panes of stained glass, foot to point, leaded in Lachrymite violet,
  deepened so they hold on noon sand; Boomwhackers, tourmaline grown in layers of colour). Only the stave is fretted; the lesser
  spires stay lilac.
- **Liquids are drawn by one library** (`vfx/liquid.js`; packs baked by `scripts/bake_liquid.py` from the owner's noise photographs).
  Water paints its floor (ripples, caustics, depth colour, Fresnel short of a mirror, sparkle welcome); Lachryma is ink with the film in
  its cells and veins. Prior art: Sunshine's crossed waves, Portal 2's flow maps, Sea of Thieves' crest glow. **Water is never plastic**
  (the owner, 2026-10-08: the ripple read "a little too plastic-y"): its highlight is broad and soft and its gloss varies in slow
  patches, the rings bend the light and never whiten, and nothing glints in one even coat. **The caustics are a Voronoi cell texture
  in two layers** (`liqCaustics`, `causticTexture()`): curved threads that swell into knots where three cells meet, the second layer
  the same net a little apart in a cooler, more saturated hue and fainter, so the line is white where they meet and splits into colour
  where they part (a real caustic's dispersion); the marbling bends the net so it writhes, and a slow wash keeps it from tiling. On the
  floor under the shallows, and a faint web of it on the surface.
- **Sacred geometry is grammar:** the owner's wife's circles (`circle_lotus`, `circle_swirl`) layered and counter-turning; hexagons are the
  lawful mind, spirals the chaotic.
- **The world is thrown and fired** (lathe forms, slips, glazes, kiln marks); the tools are instruments with a silhouette and a stance.
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
- **The night sky** lives in the dome's shader (`vfx/sky.js` NIGHT_GLSL): our own stars, each at least 1.5 px, turning once a game day;
  meteors every 25 to 70 s; the aurora at the Shore. No draw call, no program.
- **The spirit press:** the soul colour is its only bright thing, shown as the soul bead, the drum's pool and the hue ring, never written;
  it is the vessel's Lachryma, so a new Courier looks exactly as made. **The bath is neutral** (SOUL-ALCHEMY.md 4.4, Albers): black
  Lachryma over a dished clay floor, pale over the grey centre and black at the lip, never lit in the soul colour. Every colour on it is
  `wheelColour` (`vfx/wheelcolour.js`, Oklab) and self-lit through `selfLit` (`vfx/selflit.js`, the tone curve and grade undone), so a
  tile shows its glaze exactly and the bead dead on it vanishes. Distinctions are carried four ways before colour: bearing and distance,
  the seals' shapes, value and gloss, motion. **The surround is grey while you judge** (4.3): the press view eases the garden's sky,
  haze and fog to the grey of their own lightness, and the HUD steps out but for the folded log. **Everything that answers is
  physical** (4.12, 4.13): the lever's ball up or down and warming, the eye brightening, the press's lantern tall or guttering; a firing
  is a hit-stop, a burning glass, a white kiln heat cooling to crazing and the tile shrinking a step; a refusal is a crawl, a break's
  glint or a gutter, never a flash or a word. The hokora is the garden's palette in small: grey stone, plum-dark wood, a moss roof.
- **The crossing:** the sea is ink; everything you can shoot carries the one warm or pale thing on it. Parryable things wear only the
  Lachryma outline (`vfx/parrymark.js`).
- **The shoal and the Mind's furniture** (`vfx/shoal.js`, `vfx/shoalsilhouette.js`, `vfx/railgeometry.js`): a glint is ink with mirror
  flanks (the storm's gold-white above, the crude below) and a labradorite edge; drawn up into the silhouette the school glows in the
  stone's blues, violet to peacock, so a shape of fish reads on a bright sky and the black crude alike, and its eye is the one lens.
  The ambient geometry is wire in the same blues over dark glass (gold is kept for a ring you threaded), black labradorite slabs, and
  the crude folded overhead. One program for all of it but the glints. The stone's colour on all of it is each piece's own, never the
  world's (the rail carries them through the world at 26 m/s), and the eye, which is shot at, is never bent by the storm.
- **The Great Slip Jelly's bowl:** stone is ammunition (seam, log, rubble); the sand streams toward the pool it is in; the slip ripples
  where it will rise, never a painted ring; **the body is the telegraph** (`vfx/foelook.js`, one shape per cast).
- **The catch:** one look for the Jar and the coffin: a mouth drinking a mind (`vfx/catch.js`).
- **The garden** (Dual Hearts): pastel air tinted by your draught, a cloud sea below, toy planetoids (`vfx/garden/`); a feature wears its
  feeling's colour; a form is its element plus a halo (Law) or horns (Chaos). **The grounds the hand paints wear their phase, not their
  feeling** (`vfx/garden/gardengrounds.js`): moss jade cushions, ash pale over embers, loam ochre clods and rootlets, slate silver-blue
  cleft, silt blue-black and crazed. The feeling is only the accent (dew, embers, flecks, sheen, the gleam in a crack), so a painted
  planetoid reads as ground first and mood second. Borders are height-blended (the higher one shows), never a smear across a cell.
  **The water is the feeling, outright** (`vfx/garden/gardenwater.js`): Lachryma in its feeling's canon colour, dark where the light
  goes in and glowing from inside as it deepens (and by night), the marbling's film in its veins and at its meniscus. Two feelings in
  one pool are an agate, wedged along the marbling and never blended; opposites that meet are fair water, milky as nacre. Ground it
  wets darkens and glosses for 20 real seconds, with caustics under the shallows (the shared Voronoi net), a faint web of them on the
  surface; still water lies level (its normal the planetoid's up, so no shore triangle catches the sky) and glows evenly by day. **The rain is your draught** (`gardenrain.js`): thin
  streaks drawn toward the sky's pale, each falling to its own planetoid's heart, a ring where it lands, the sky greying under it.
  **The plants are toys** (`gardenplants.js`): chunky moss cushions with fern sprigs, herb rosettes that bloom in desire's colour,
  reeds with a cattail; lit by up-turned normals like the ground they grow from, shrinking away past 18 m so the ground carries the
  green. **A cascade is a ribbon** (`gardencascade.js`): its feeling's colour scrolled down the fall, frayed white at the edges, spray
  at the foot. **The bought four** (`boughtplanetoids.js`) each keep one idea: the Moon's craters, the Koi Pond's teal crown, the Drill
  Yard's ring of posts, the Bone Bed's ribs. **The trees are grown, not built** (`leafcanopy.js`, `gardentree.js`; the owner's
  billboarded leaves): a crown is a few spheres of leaf clumps lit as one soft round mass, never leaf green but labradorite (dark stone
  walking ultramarine, blue, peacock and green as you go round it) edged and veined in gold, on plum-dark bark; the gold glows a little
  more by night, low and steady. A crown may take a tint (Myggdrasil's tincture), which leans its flash and keeps its value.

## 6. The Courier's face

The E-ink mask was rolled back (`d4872d0`). For the next try: **pupils much bigger** (15 px in a 116 px eye was too small); **sleepy read
well**; **no shadow rim** round a changed eye shape. **The owner makes the atlas**; the runtime (the swap after `map_fragment`, the stepped
blink and look, the event map) comes back from `d4872d0` to drive it.

## 7. What to replace first (the audit)

| what | verdict |
|---|---|
| the Courier, the painted sky, the spell circles, the maker's pixel art, the Lantern Wisp, the god hand and the Pneuka Jar (their rigs, clips and paintings: `vfx/vessoulpaint.js`) | **ours** (the owner's) |
| labradorite, filigree, damage looks, temper, bismuth, finishes, HUD ring, compass, vane, chest glazes | **ours** (made for the game) |
| the clapperjars' painting (`source_assets/clapperjar_base.png`, grey, tinted by each jar's colour: `vfx/greytint.js`) | **ours** (the owner's) |
| clapperjars, slip jelly, Psygun (GLBs) | ours, origin to confirm |
| **the five tools' models** (`tools/*/model.js`) | **placeholder: first for the owner's models** |
| **the clay folk** (`npc/folk.js`) | **placeholder: second** |
| chests and curios, Box things and lures, the Lockheart's wheel | placeholder |
| pots and jars | placeholder (good): a glaze atlas lifts them |
| the rooms | greybox: the room glaze atlas (restrained, historical) is deferred |
| the plain hit star | genre default: could become a kiln spark |
