# Fool's Fortune: Clay Workshop (mechanics prototype)

A one-room, greyboxed shooting sandbox for tuning feel: a hybrid first/third-person
character controller, a semi-auto hand-cannon with aim-down-sights, tracer rounds, and
terracotta pots that shatter into physics shards.

Built with **Three.js** (rendering), **Rapier** (physics, via WASM) and **Vite**.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static bundle in dist/
```

## Controls

| Input | Action |
| --- | --- |
| WASD / Shift | move / sprint (any direction but backwards) |
| Space / again in the air | jump / double jump (into a ledge: mantle; a jump pressed during a mantle leaves from the top) |
| run into a low wall | a wall up to 0.55 m is **stepped over** without breaking stride |
| Space by a wall, holding W | wallrun; Space again to wall jump |
| C | crouch; while running, slide (jump out of it to keep the speed) |
| Shift in the air | air-dash (costs Lachryma, one per airtime) |
| Hold Alt | walk |
| Shift while crouched | roll: a dodge, invulnerable for its first third (also automatic out of a fall of 20 m or more) |
| F | interact (the chevron marks what F would act on): **open a chest** / feed the Tithe · strike the **gong** by the workshop door to start the time trial · pick up something small (hoisted overhead in both open hands: fire throws, F sets down) · hold F at a heavy crate: W push, S pull · at the index console (basement hub): pick a room to teleport to |
| V | kick (on the run, or standing; parry a projectile with the timing) |
| E | blink (a learned ability, see The System) |
| B | the System's Codex: Movement Arts, variants, Lab mode, save code (pauses the game) |
| Mouse | look |
| Left click | fire (semi-auto, one shot per click, inputs are buffered) |
| Hold left click | charge the psygun (from cold, no round fired first); release for a piercing beam |
| Middle click | fire the selected shell (seek: hold to paint targets, release to fire) |
| 1–9, 0, − / mouse wheel | pick a shell: cleave, push, well, mark, bomb, bank, seek, slip, groove, anchor, hatch (1 again turns the Cleave level / upright) |
| M / N | the map / a survey pulse (charts the ground around you) |
| ~ | **the god hand**: the Courier becomes a jar and you become a hand (see below); ~ again to come back |
| Right click (hold) | aim down sights |
| X | holster / draw (firing, aiming or a shell draws it; third person puts it away after 5 s out of combat) |
| Z | toggle first / third person |
| Q | draw / stow the Sondelass (the Psygun goes away first; not while carrying); 1 / 2 / 3 while it is out: cutlass / rod / hook (rod: 4–8 the aspect a sounding pushes, 9 / 0 the lure) |
| G | draw / stow the Soul Brush (worn at the left hip, drawn across the body); with it out: LMB the club (hold for the slam), RMB tap a flick of slip, RMB hold the Celestial Brush (LMB draws), C at speed the brush slide |
| J | draw / stow the Veritome (on a chain at the right hip); with it out: RMB hold the lens (LMB the shutter, wheel the zoom); lens down, LMB draws a card and LMB again plays it, middle click redraws |
| Middle click (cutlass, brush) | lock on to a target (Zelda-style: the camera and the blade hold it); a flick of the mouse changes target. Z is always first / third person: every tool has a first person (`tools/viewmodel.js`) |
| V (cutlass out) | guard: a raised blade turns a projectile aside, and a well-timed one sends it back |
| O | swap shoulder (third person) |
| R / H (basement) | back to the last checkpoint / to the hub |
| T | reset the room |
| Tab | tuning panel (frees the mouse) |
| F2 | hide the interface (cycle: everything / the frame of a shot only / nothing but the picture), for a clean screenshot |
| F3 | physics debug wireframe |
| \\ | fold the log away to its tabs (or its – button); again to open it |

## Tuning

Every number that affects feel is in `src/config.js`, and the **Tab** panel edits them live.
Changes persist in your browser's local storage. Use **Copy settings JSON** to share a
tuned set, and paste it back into `DEFAULTS` to make it the new baseline.

Main groups: `movement` (speeds, accel, jump, coyote time), `camera` (FOVs, shoulder
offsets, ADS sensitivity), `weapon` (fire interval, spread and bloom, ADS time, gun scale),
`recoil` (view kick, how much of it stays, gun kick), `tracer`, `shatter` (break speed,
burst forces, shard size and lifetime), and `explosion` (ember urn radius and force).

## Lachryma (energy)

The psygun runs on **Lachryma**. Plain shots cost a little, and a charge reserves it as it
winds up (refunded if you let go too early). It trickles back slowly, and the rest comes from
**baubles**, gummy cream-coloured drops that pop out of clapperjars, lanterns and marked
pots. They bounce, settle and wobble, then fly to you when you get close. Clapperjars will
eat baubles you leave lying around, and grow fatter (and juicier) for it.

`src/lachryma.js` has the pool as a standalone class meant to be shared by future mechanics:
costs looked up by tag, stacking modifiers (cost multipliers per tag, regen, max bonus),
reservations for wind-ups, all-or-nothing `spend()` and partial `drain()`, and events
(`change`, `spend`, `gain`, `empty`, `full`, `overflow`, `denied`).

## Shells

Special rounds loaded one at a time (the support hand racks each one). Refill at the glowing
**reliquaries** (one per floor).

| Shell | Effect |
| --- | --- |
| Cleave | a four-metre line of light flies out along the aim, **level or upright** (press its key again to turn it), and cuts in two everything it sweeps: pots, crates, sliced halves, clapperjars, and anything in the world tagged *sliceable* (the dunes' obelisks and columns). Dead Space's plasma cutter was the model |
| Push | a cone of force: shelves get swept, clapperjars go flying |
| Well | a lobbed singularity that drags everything into orbit for 3 s, then pops; debris that reaches the core is crushed, and every few pieces condense into a Lachryma bauble |
| Mark | stuns clapperjars (dizzy stars) and marks pots in a radius; marked things glow through walls, take double damage and drop Lachryma |
| Bomb | a lobbed clay grenade: splash damage, a spray of molten slip that splats and cools, and a hot pool that cooks pots and scalds clapperjars |
| Bank | a ricochet round: banks off walls and floors up to 5 times, hits harder each bounce and bends toward a target after each one. ADS previews the first bounce |
| Seek | hold to paint up to 6 targets (the lock-on squares spin in and snap together), release to loose a fan of seekers |
| Slip | a lobbed ball of liquid clay that paints floors and walls wet (dive in: C) |
| Groove | a mirror-ball orb opens where it lands (9 s, 128 bpm): every clapperjar nearby dances and forgets what it was doing, pots and crates hop to the beat |
| Anchor | pins one thing where it is, in mid-air if that's where it was: it turns solid and stays for 12 s (a crate becomes a step, a thrown ball hangs there, a critter is stuck) |
| Hatch | a pot cracks open and a clapperjar climbs out, friendly (a helper that mends cracked pots); a clapperjar hit by it turns friendly. At most 5 helpers |

## The Sondelass (Q)

A telescoping instrument worn on the back, parallel to the Psygun, drawn the same way: **a fishing rod, a cutlass and a grapple hook**, and the first melee tool. It is a passive tech (`src/moves/sondelass.js`): you run, jump and slide with it out; it only owns the right arm and puts the Psygun away. **1 / 2 / 3** change form (the sections slide in and out); the mouse is the tool's while it is out.

| Form | Controls |
| --- | --- |
| **Cutlass** | LMB a three-stroke combo (a buffered press inside the chain window continues it, the third is the overhead), RMB a lunge. The blade is swept along its length against pots and clapperjars during each stroke's hit window. |
| **Hook** | LMB fires the grapnel along the aim (2 Lachryma). Solid ground draws you to it at 27 m/s (jump cuts the line and keeps the momentum; a ledge's lip mantles), something loose is yanked to you. RMB holds the arm out on the aim. |
| **Rod** | **9 / 0** change the **lure** (six made ones, and any curio you hold); **4–8** (or the wheel) pick the **aspect** (dread, wonder, grief, hunger, mirth) a sounding pushes into it. Hold LMB to charge a cast, release to throw. Then: tap LMB to twitch the lure; hold RMB to sink it; hold LMB to reel it home; middle click to **sound** (a psychic ping that lights up every entity in reach, pushes the aspect into the lure for a while, and stirs every fish in that water, the nearer the more). |

**Angling** (`src/angling/`) is played at **THE WEIR**, the oasis at the heart of the dunes (hub index, D): a pond of four terraces cut into the sand, a pier from the south beach, a 9.5 m stone well of liquid Lachryma, a cutlass yard, a timber pergola over the water with hook rings and the tide lamp, the Tally stone, palms and reeds. **Lures** (`lures.js`) are things you own: each has a *taste* over the five aspects and each species answers to its own (the passive lure, which draws fish from across the water); every curio you hold can be tied on, stronger the rarer it is; and a sounding pushes the chosen aspect into the lure and stirs the whole pond (the active lure). Bites come in seconds. The lure's body is the Courier's own mind projected (a ghost of her mask); casting reserves Lachryma and the fight drains it; a landed fish comes apart into baubles. Ten entities (`species.js`), each with an aspect it likes, a depth band, tides it comes at, a way of biting (a nibble, a tug, a gulp: the last probe is the bite you answer, press LMB inside the window; the middle of the window is a *perfect* hook set) and a way of fighting (drift, dart, thrash with a half-second warning, run, sweep, leap, anchor). **The fight** (`fight.js`) is a tension gauge with a sweet band (the fish tires only while the needle sits in it), the fish's stamina, and the line out: LMB reels, RMB gives line, lean the camera against its pull (the arrow on screen), crouch to brace. Over the limit too long and the line snaps; slack too long and the hook slips. A fish just landed leaves an **echo** on the next cast (FFXIV's mooching): predators come to the echo of what they eat, and the Drowned Lachryma, who comes to the Well at the top of the tide, comes to nothing less than the echo of something large. The Codex's ANGLING shelf is the bestiary, filling in as you land more of each.

Prior art (also in the module headers): FFXIV (the graded bite, hook sets, tides as fishing windows, the Fish Guide, mooching), FFXI (fish stamina and its pull, arrows), Zelda: Twilight Princess (aim, cast, work the lure) and the Hookshot, Stardew Valley (the band), Red Dead 2 (reel, lean, give line), Dredge (what is in the water is wrong), Monster Hunter (form switching, the telegraphed hit), Animal Crossing (the shadow in the water). The animation is CC0: the Universal Animation Library's sword clips carry the tool with no IK (its socket is measured from the sword pose), and the cast is `Sword_Regular_C` held at its raised frame while a cast charges.

## The Soul Brush (G)

A calligrapher's brush the size of a club, worn at the left hip like a sword in a sash and drawn across the body (`src/moves/soulbrush.js`, `src/brush/`). Its bristles are soaked in **slip**, and its ink, on the Celestial Brush's paper, is **Lachryma**. Drawn from three games, one part each:

| Part | From | What it does |
| --- | --- | --- |
| **The club** (`brush/club.js`) | Splatoon's Inkbrush, Zelda's hammer and spin charge | LMB: three heavy blows (the UAL sword clips at four fifths speed). It is a poor way to break things (a pot takes several blows): the light blows **bat** clapperjars away, the overhead, or a blow on one already flying, leaves it reeling. Every swing **flicks** slip off the bristles along the swing. Hold LMB: the brush goes up and gathers; let go to **slam** (a ring that throws what is near, a pool of slip; in the air she comes down with it). RMB tap: a flick at range. |
| **The brush slide** | Splatoon's Inkbrush dash and ink-swim | With the brush out, the core slide is the same slide (the movement is untouched), but she rides it sideways and low with the brush trailing on the ground (an authored clip, `brush/clips.js`: nothing in the free libraries does it), and it paints a **stroke of slip** behind her (`vfx/paintpath.js`). Once it has settled (half a second) it is wet enough to dive into: C on her own trail melts her into it. |
| **The Celestial Brush** (`brush/celestial.js`, `canvas.js`, `gesture.js`, `techniques.js`) | Okami | Hold RMB: time all but stops, the screen goes to sepia paper, and LMB draws in ink. A drawing is read when the hand rests and may take **several strokes** (the **Penny Pincher** recognizer, Taranta and LaViola 2015: resampled direction vectors scored by dot product against templates generated for the ways a hand draws each shape, a tenth of a millisecond a drawing; plain geometry first for closed loops, spirals and the bomb; decoy templates so a triangle or a cross is not a circle); several drawings can be made in one breath, and when RMB is let go they all take, in order. Each drawing is painted once into its own layer as it is drawn, so a long drawing costs no more to show than a short one. The paper and the ink cost Lachryma. |
| **Sigils** (`brush/sigils.js`) | Magic Cat Academy | While the brush is out, clapperjars near her carry a queue of brushed marks (a stroke across, a stroke down, V, ^, a bolt; raiders three). Drawing a mark lifts it off the front of every queue it heads, all at once; an emptied queue unwrites the jar. |

What the Celestial Brush knows (the reference scroll at the canvas's edge shows the shapes). The brush **alters things rather than hurting them**: most drawings write a PROPERTY onto what they are drawn over (`brush/inscribe.js`: the body's type, mass, gravity, bounce, and the tags every tool asks), for a while, and wear a small brushed seal while they last; what happens next is the world's doing.

| Drawing | Technique | |
| --- | --- | --- |
| a stroke across | **Still** | what it crosses on the screen is held where it is (a pot in mid-air is a step); a clapperjar is rooted; also a sigil |
| a stroke down | **Bounce** | what it crosses springs back from whatever it meets; also a sigil |
| a circle | **Mend** | round a cracked pot mends it with gold, round a wreck rebuilds it, round a clapperjar befriends it |
| a circle and a fuse out of it | **Ember** | Okami's Cherry Bomb, as a property: the pots in it become ember pots (they burst when broken) |
| a spiral | **Gale** | a gust the way the spiral ended: throws what is loose, carries her in the air, and in the dunes turns the wind itself (the skiff sails on it) |
| a lightning bolt (or a Z) | **Bolt** | a strike where it was drawn: clapperjars near it stunned, what it hits only cracked; also a sigil |
| ^ | **Light** | what is under it floats (a tenth of its gravity); over nothing, lifts her; also a sigil |
| V | **Heavy** | what is under it is five times as heavy and falls hard; over nothing, dives her down (or bursts slip about her on the ground); also a sigil |
| a heart | **Solace** | every clapperjar in view forgets itself and dances; the god-hand's vessel is soothed |
| anything else | a wash | laid on the world as slip where the strokes pass over surfaces |

## The Veritome (J)

A grimoire with a clock set in its cover, on a chain at the right hip (`src/moves/veritome.js`, `src/veritome/`): a camera to ground the Courier against what is not real, and a book whose cards project the rules of her own reality. Built over the Codex and the map.

| Part | From | What it does |
| --- | --- | --- |
| **The lens** (`viewfinder.js`, `photo.js`, `subjects.js`) | Pokémon Snap, Fatal Frame, the Sheikah Slate, Dead Rising | Hold RMB: the view goes through the clock's glass (first person; the wheel zooms), framed in brass with a compass tape, a sextant's arc, the tide clock and focus brackets on whatever is worth a photograph. LMB is the shutter. A photograph is scored as Snap scores one (size, pose, technique, more than one of a kind) and the best of each of nineteen kinds of thing goes into the **Compendium**; it is pinned on the map where it was taken, and what it saw is charted. It is the **truth** of a thing: what the Soul Brush wrote on what it shows is undone. And it is Fatal Frame's camera: a clapperjar held in the capture circle fills the ring; a full shot holds it to the real (stunned and marked), and a full shot at the **shutter chance** (while it is in the air, or rushing at her) takes it whole. |
| **The Book** (`book.js`, `arcana.js`, `ui.js`) | Greed Island (Hunter x Hunter) | Twenty-two designated pages, one for each card of the **Major Arcana** (0, The Fool, to XXI, The World), and twelve free slots for spare copies; each card has a rank (SS to H) and a limit. A card is bound by photographing its **sitting** (The Fool is a clapperjar caught in the air; The Hanged Man a pot hanging by its cord; The Tower the kiln from its foot; The Sun the sun itself, in the dunes): the sitting must be what the photograph is of. The Codex's VERITOME shelf is the binder (an empty page shows only its riddle) and the Compendium; a spare copy can be **gained** from it into the hand. |
| **The reading** (`effects.js`) | Final Fantasy XIV's Astrologian | Lens down: LMB **draws** a card the Book knows (three charges), LMB again **plays** it, middle click redraws once. Each card is a rule laid over the world for a while (The Magician: nothing costs Lachryma; The Emperor: everything near held still; The Hanged Man: loose things fall upward; The Moon: the clapperjars cannot see her; Justice: what is thrown at her goes back; Death: cracked pots come apart and every jar loses a sigil...). Each leaves its seal (sun, moon, star) in the clasp; three seals are an **Astrodyne**, stronger the more kinds it held. |

## Treasure: chests, cubes, curios and the Tithe

**Chests** come in five tiers, common, fine, rare, epic and prismatic, climbing the game's terracotta ladder (pale bisque, terracotta, brick, oxblood) and then past it to the black iridescence of Lachryma. Each is a rig, not a mesh (`src/chestmodel.js`): a squash spring on the body (volume-preserving squash and stretch), a hop, and a lid on a hinge with its own spring that can rattle, be thrown open and bounce off its stop. The higher the tier, the more of the chest there is: terracotta bound in dark clay; brick with pale bronze and a gem; oxblood and gold with a crest and shards that circle it; and the prismatic one is black glass with a film of oil on it, bands that run through a spectrum, two rings and a ring of cubes. Waiting chests call to you now and then (a crouch, a hop, a rattle). **F** by one opens it.

**The opening** (`src/ceremony.js`) is a script of beats: the camera cuts to a low three-quarter shot and the bars come in (`cinema.shot`); the chest rattles harder and faster while light leaks from its seam, a beam of light stands on it and the room dims (`src/mood.js`); one frame of held time, a last squash, and the lid is thrown off with the body stretching, a flash, a ring, stars and confetti, a camera punch and a moment of slow motion; the cubes fountain out one at a time (each pop climbs in pitch); a **curio** rises out of the chest and is held up in a beam (a duplicate is condensed into cubes in front of you); the bars go and the cubes on the floor are drawn to you in a run whose pitch climbs. Every beat is louder than the tier below it. F / Space / click after the burst hurries the rest. **A prismatic chest is a micro blacklight rave** (`src/vfx/rave.js`, 124 bpm, about seven seconds): the room goes near-black and violet, eight coloured beams sweep the chest, a mirror ball lowers and throws forty specks of light onto whatever the room really has, neon splatter fades in on the walls, a ring of light leaves the floor on each beat, the cubes glow, and the camera cuts four times on the bar lines; then the lights come back. Nothing strobes.

**Lachryma cubes** (`src/cubes.js`) are what Lachryma is when it is condensed: small rounded black cubes with an oil-slick film whose colour follows the angle you look at it from. They are the currency, one instanced mesh with a rigid body each, so they fall, clack (a glass tick), pile up and are drawn to you after a moment. The balance is the ledger's (`cube.earned` minus `cube.spent`); a zandatsu takes a few out of a clapperjar.

**The Tithe** is a console on the north beach of THE WEIR beside five plinths with a chest of each tier (they shut again after 30 s). Pay 25 cubes and a **sealed** chest, one of no colour, falls onto its dais. Its tier is rolled from published odds (common 60%, fine 26%, rare 10.5%, epic 3%, prismatic 0.5%) and three **pity** counters (10 pulls without a rare or better guarantee one, 40 an epic, 100 a prismatic), shown on the console as rows of lamps and listed in the Codex. Opening it, the beam **rolls through the five colours**, slowing and ticking, sometimes climbing past what it lands on (the near miss) or climbing in stumbles (the upgrade), and lands on its true colour before it turns into that chest. A sealed chest tells nothing before that. Placed chests also stand in the hub (common) and on a dune (rare), and a legendary catch pays in an epic chest that falls out of the air.

**Curios** are twenty small collectibles, four to a tier, each with a procedural model (a whistling whelk, a glass gull, a storm in a stoppered jar, a kaleidoscope koi...). The Codex's CURIOS shelf shows what you hold, the odds and the pity counts. The log writes the sentences (the line is coloured by the tier); nothing in the world carries text but the floor labels of the treasury.

Prior art (also in the module headers): the loot box and the gacha pull (Overwatch's boxes, Genshin and Fire Emblem Heroes' reveals, published odds and pity counters, the near miss of a slot machine), "Juice it or lose it" and Vlambeer's screenshake talk (squash and stretch, anticipation, hit-stop), Diablo's and Borderlands' gold and rarity beams, Mario's coin chime, thin-film iridescence, and the blacklight parties, mirror balls and Rez.

## Water

The pools (`src/vfx/water.js`) are drawn in the manner of the sixth generation's water (Final Fantasy X and X-2, Skies of Arcadia): a flat, translucent, cel-banded surface whose colour is chosen by the pool's depth (a depth per vertex: pale turquoise over the shelf, teal, then marine blue in the trench, hard edges between), the painted skybox reflected in it and posterised, a toon glint, and foam at the shore and on a few crests. All its motion is geometry (a few sines lift the plane); nothing scrolls. The Weir's Well holds **liquid Lachryma**: the same plane made heavy, near-black, slow, with the cubes' own oil-slick film and an iridescent meniscus. The Solar Skiff skims the oasis's water as it does the sand.

## Performance, and the console look

The world is one scene with every room in it (the workshop and its basement, the circuits three kilometres out, the dunes and their oasis four hundred metres down). Four services keep that cheap, in the manner of the sixth-generation consoles the game takes its look from (`src/render/`):

| | What it does | Before → after (workshop, same view) |
| --- | --- | --- |
| **Light budget** (`lightbudget.js`) | Every `PointLight` stays an ordinary object its owner moves and dims, but only the eight that matter most near the camera light anything; they are copied onto eight pooled lights each frame (a lamp coming into the budget fades up). three.js compiles the light count into every shader, so this also stops rebuilds. | 63 lights in every pixel's shader → 8 |
| **Zones** (`zones.js`) | The world is split into places (workshop, basement, circuits, dunes). Only the place the camera is in, and what can be seen from it (the basement through the hole in the workshop floor, when the hole is on screen), is drawn; its lamps alone are candidates for the budget. The static level is merged per zone and per 64 m cell (`level.js`), so a merged mesh no longer spans the world, and floor labels are not drawn beyond reading distance. | static meshes 1.6 km across → per room |
| **Prop batches** (`propbatch.js`) | A pot whose body is asleep is drawn inside a `BatchedMesh` (one per material and zone, plus one for the outlines) and its own mesh is hidden; the moment anything happens to it (it wakes, is carried, cracked, scaled, broken) it gets its mesh back. Rope segments are one `InstancedMesh`. | ~700 draws of pots and ropes → a handful |
| **Merge** (`merge.js`) | A model built from primitives (a chest) has its static parts baked into one mesh per look inside each moving group. | a chest: ~80 draws → ~25 |

Draw calls went from 1345 to about 650 in the workshop, 360 to 150 in the hub and 600 to 160 in the lab; a frame of the workshop costs a twenty-eighth of what it did on the software renderer the tests run on. Loading: every shader is compiled behind the loading screen (so the first frame and the first teleport do not stall), vertex welding for outlines and smooth shading uses an integer spatial hash instead of string keys (`weld.js`), and textures that are only needed later are made on first use. `window.__boot` holds the time at each stage of loading.

**The picture** (`present.js`, settings under Tab › visual): the scene is drawn at **480 lines** (the PS2's 448, the GameCube's 480) and scaled up to the window with a **bilinear** filter, as a console's frame was by the television; the HUD and the log are HTML over it and stay sharp. `resolution` can be `ps2`, `540`, `720` or `native`; `upscale` `bilinear` or `pixel` (nearest neighbour). **Smooth shading** (`smooth`) is on: every flat-shaded material is drawn with smooth (Gouraud) normals, and triangle-soup meshes such as the pots get creased normals (smooth across their curves, hard at the rim and the base, at 50°). One sun shadow at 1024 (`shadowRes`), filtered, not softened.

## The tool belt

The Courier's psychic tools share one set of rules (`src/tools/belt.js`): seven places on the belt, one tool in the hands at a time, drawing one puts the other away first and the new one comes out only once the hands are free, and while a tool is out it says what it takes (the mouse, the number keys) and what it allows (the kick, first person). Four are on it: **the Psygun** (X), **the Sondelass** (Q), **the Soul Brush** (G) and **the Veritome** (J). Tools share their pieces: where a tool sits in the hand is measured from the animation (`tools/grip.js`), and the reach, grab and whip of a draw is one module (`tools/draw.js`). Everything that asks "is a tool out?" asks the belt, so a new tool is its own module, an entry in the belt and nothing else.

## The god hand (~)

Press **~** on solid ground and the Courier turns into a **Pneuka jar**, an immobile vessel
(`courier_pneuka.blend`), and you become a disembodied **hand** (`courier_godhand.blend`): the
camera pulls up into a turnable isometric view, the cursor is the hand, and the game becomes a
physics god game over the same rooms. Ceilings and everything above head height are cut away.

| | |
| --- | --- |
| Left click (hold) | the selected God Art: by default telekinesis, grab anything loose; release throws it (as fast as the hand was going); Shift lifts it higher |
| Right click (hold) | the art wheel (1–5 pick too): telekinesis, sunder, swell, wring, manifest, each usable only inside the ground you have explored (see below). Shells are the Courier's; the hand's powers are God Arts |
| Q / E, wheel, WASD or the screen edges | turn the view an eighth of a turn, zoom, pan |
| ~ | back to the Courier where the jar stood (once the vessel is whole) |

The hand is on a **tether**: it can't reach further than 36 m from the vessel. The vessel can be
hurt: **raids** (in the Siege room only, see Raids: crimson clapperjars, kamikaze, from 22 s in and every 34 s, one more
each wave), a lobber's balls, blasts (your own bombs too), and whatever you throw at it. Hits
crack it (the cracks are drawn on the jar); at zero it shatters, and reforges 7 s later at 60%,
its old cracks now gold seams. Counters: grab a raider and throw it away, cut or blow it up, pin it
(anchor), make it dance (groove), or turn it (hatch: a turned clapperjar guards the vessel against
raiders and mends it, the way clapperjars mend cracked pots). A wave cleared gives a shell of each
kind and mends the vessel a little. Everything is in `src/godmode.js`; the shells' new effects in
`src/casters.js`. The stress test drops into it now and then and fuzzes the hand.

## God Arts

In god-hand mode the psygun's shell strip gives way to the **art bar**. Shells are prepackaged
one-shot rounds and cost no Lachryma; **God Arts** are powers of the hand itself and run on
Lachryma (regenerating a little faster while you are the hand). Pick with **1–5** or hold
**right click** for the radial wheel.

| Art | Does |
| --- | --- |
| 1 Telekinesis | hold left click: lift anything loose and throw it (costs Lachryma while held, by weight) |
| 2 Sunder | drag a blade across the floor: everything it passes through above is cut in two on that plane |
| 3 Swell | on a pot or crate, drag up / down: grow or shrink it (its weight follows) |
| 4 Wring | on a pot, drag sideways: twist it; drag up: scallop its walls (pots are re-lathed live) |
| 5 Manifest | drag: raise a wall of clay from the floor, hold for height; it crumbles after a while |

They live in the Codex (**B**) on a second shelf beside the Movement Arts, with variants, and
their numbers are in `T.arts`. Code: `src/godarts.js`.

## The Zone of Influence and Mind Mapping

Arts work only where you have **been**: the Zone of Influence is, for now, simply the ground you have explored (there are
no "understanding" prompts; outside it the ground just doesn't answer, and the ring under the hand shows it). Every layer
of the world (the dunes, the basement, the ground floor, the upper floor) is a grid of cells, each holding *knowledge* from
0 to 1 that the veil on the floor shows (grey, amber, gold). Knowledge comes from walking about, from line of sight around
you, and from the **survey pulse** (**N**: a ring of psychic sonar, costs Lachryma, stronger from the hand); around the
vessel the ground is always known. Mapping a whole named room fills it in, and it stays known: it is saved.

* **Compass** (top right): bearing, the layer and place you are in, the mapped cells around you as a little radar, a
  waypoint arrow. North is −Z.
* **Map** (**M**, again to close, or Esc): every layer, drag / wheel to pan and zoom, click to set a waypoint, right
  click to clear, layer tabs, and the named places with how well you know each.
* `src/cartography.js` (grid, pulses, compass, map, the veil); `T.zoi` has the numbers.

## Raids

Raids (waves of crimson clapperjars that make for the vessel) happen in **one room, THE SIEGE** (the index: S; an arena
south of the lab with cover, pots and crates, and a dais), and nowhere else: the timer does not run elsewhere, so the
hand can be learned in peace. `src/raids.js` sends the attackers; `src/siege.js` is the room; the vessel itself only
knows how to be hurt (`src/godmode.js`).

## The dunes, the oasis, and Solar Skiffing

Far below the workshop there is an open layer: a sand sea (twice the size it was: a kilometre across inside its edge), low gold sun,
half-buried ruins, a pale spire with a beam of light to sail toward, and at its heart **an oasis**: a pond on a flat of packed sand with
palms and grass round it, where the Weir now stands (see the Sondelass). Nothing walls the sea in any more: the dunes run on to high
dunes on the horizon, and the edge is an **invisible barrier** (`src/barrier.js`) that shows itself only where you run into it, a ring
of light spreading on the curve of the air with a glassy lattice and a soft note. A layer of **cloud** drifts downwind across the painted
sky (`src/vfx/clouds.js`: a noise texture scrolled across a flat sky-plane mapping, carried on a low-poly shell inside the dome). The
ground is drawn in chunks with levels of detail, one draw call (`src/render/terrain.js`: geomipmapping with skirts), and the camera sees
further down here than in a room (420 m, with the fog closing it). Take the index console (**F** in the hub) to **THE DUNES**, or come
back any time with **H**. You arrive on foot at the oasis, by the pier; **Y** brings the **Solar Skiff**: a small hovering skiff with a
lug sail, modelled on the King of Red Lions in *The Wind Waker*, with a little acrobatics on top. Riding it is **Solar Skiffing**.

| Key | Action |
| --- | --- |
| W (hold) | hoist the sail; it stays up. How far up is how much you sail |
| S (hold) | let it down, and brake. Hoist it again quickly from nearly down and it is a **pump**: a burst of speed (as in Wind Waker) |
| A / D | steer (it turns on the spot, and carves at speed) |
| Space | hold to crouch the springs, release to hop; in the air A / D spin the whole skiff, rider and all: land a whole turn for a boost |
| Shift | solar flare: the emblem blazes, top speed and acceleration jump, for Lachryma |
| Y | stow / summon the board |
| R | start again at the oasis |

The psygun is stowed and cannot be fired while you ride. The boat is driven by the wind alone (a swallowtail pennant streams from
the masthead and shows where it goes: it flutters fast and straight in a strong wind and droops in a light one, all in its vertex shader): a tailwind is fastest, into the wind is slow but never a stall, and with the sail furled you
can sit perfectly still. The boom swings out to leeward and the cloth bellies or luffs. The wake is drawn as Wind Waker draws it: crisp white bubbles at the bow,
two thin white lines opening into a V behind, and a paler band between them (built from geometry laid down where the boat went and
faded by age, with nothing scrolling); on top of that the sand keeps its own fading trail and footprints.

The skiff and the rider are **one rigid unit** (one quaternion for heading, slope, lean and spin; `character.js` places the
body in the skiff's frame), and the rider is animated by clips authored for it (`src/surfclips.js`: idle, ride, hoist, brake,
crouch, air; blended by what the board is doing) rather than solved onto the deck. Prior art and what was taken is in the headers of
`src/moves/surfer.js` (Wind Waker's sailing: wind and speed, the sail you manage, pumping), `src/skiff.js` (the boat's rigging and
the pennant), `src/wake.js` (bow bubbles and the V), `src/trailmap.js` and `src/marks.js` (Journey's trails, render-to-texture trail maps).
Tuning is `T.tech.surfer`.

## Lap circuits

Three timed courses, in the index under LAP CIRCUITS (`src/circuits.js` is the runner, `src/circuitrooms.js` the halls; the design
and the analysis behind them are in `docs/CIRCUITS.md`). Cross the first gate to start the clock; each gate shows a split against your best;
a gate crossed slower than it asks costs a second; **a fall** puts you back on the last gate with +3 s and loses the *clean* mark; the finish gives a
medal from the par times. **R** restarts, **H** leaves.

| Circuit | What it asks |
| --- | --- |
| **The Braid** (B) | five junction platforms across a pit, and three lines between each pair: a balance beam, overhead bars, and islands to blink or double-jump between (gaps of 4.5 to 5.4 m). Change line at any junction: the fast line is the one with the resources for it. Par 34 / 46 / 65 s |
| **The Mill Race** (C) | the clockwork mill in one loop: the cogs, the millstone, then a fork (the belts under the gates, or the lifts, the gantry and the shuttle), the ferris wheel to its deck, back west and up the steam to the ledge, and drop to the start. The split table shows which fork you took. Par 62 / 80 / 105 s |
| **The Spindle** (P) | up through a chain of skills: a slot to slide under, a 3.5 m gap, a 12 m wallrun, a latch up a 4.2 m pillar, a hang and pull-up, a 3.0 m mantle, a 7.6 m dash gap, the steam to the top; then a long 19 degree chute (arrive fast) and a last 6 m gap. Par 48 / 64 / 88 s |

*The Sandbar* (a slalom in the dunes) waits until the Solar Skiff's design is settled.

## Moving around

Titanfall-flavoured. Sprint works in any direction but backwards. Crouch while running (above
5 m/s, or straight out of a sprint) to slide: the first slide in a while gets a speed boost,
slopes keep you going, and jumping out keeps the momentum (land with C held to chain another).
Jump beside a wall while holding W to wallrun (the camera tilts away from the wall; gravity
eases back in over a second or so), and jump again to kick off it. One air jump, refilled on
the ground and on walls. Push into a ledge while jumping or falling to mantle onto it. Shift in
the air dashes. Air steering never bleeds speed above a run, and landing fast bleeds it over a
moment instead of snapping to run speed, so a quick hop keeps it. Top speed is capped at 14 m/s.
The speedometer (bottom left) shows speed, a short peak hold, and the current move.

Crouching and sliding shorten the capsule to 1.35 m (you only stand up with headroom), and the
first-person eye follows the posed head. In first person only the hands and gun are drawn.

**The walking hitch** was Rapier's character controller occasionally returning zero motion
for a step while the capsule rested in its contact margin, which then zeroed the velocity.
Grounded steps no longer push into the floor, a stalled move is retried, and walls only take
away the velocity pointing into them. Stairs collide as smooth ramps.

## The basement (movement lab)

Drop through the glowing hole in the ground floor's south-east corner; the geyser beside the
landing fires you back up. Hub and spoke, about 5,000 m² (the old basement was ~600):

**The hub** (40 × 40 m) is the metrics gym: fixed, labelled references everything else is
measured against, so future spaces share one rubric.

- a height ladder (0.25 to 4 m, toned by what it takes: step, mantle, jump + mantle,
  double jump + mantle)
- clearance gates (1.2 to 2.2 m; the courier is 1.7 m standing, 1.9 with the hair, 1.35 m crouched)
- slope ramps (10° to 55°; 46° is the steepest you can walk up)
- a long-jump lane with 1 m ticks and the measured chain distances marked
- a metrics board: live values from the tuning panel next to the measured chains
- the index: a console in the hub (F) that lists the rooms (one entry each: THE COURSE, THE MOVEMENT LAB, the lap circuits, the Siege,
  the dunes) and, under them, the **calibration numbers**: the live values from the tuning and the measured chains (the board's)

**The course** (16 m wide, round the hub) is one room: a loop of eight stations, one skill each (they were eight rooms behind
dividers; the only wall kept is the one that makes the low tunnel the way through), with a checkpoint at every station and
split times (and a lap time) between them:

| Station | Skill | What's in it |
| --- | --- | --- |
| 1 S | run / slide / hop | 1.5 m slots to slide under, 0.6 and 0.7 m hurdles, two speed gates |
| 2 SE | mantle | 1.4, 2.4 and 3.0 m blocks up to the platforms |
| 3 E | gaps | 3.5 m (sprint jump), 5.5 m (double jump), 7.5 m (jump, then dash) |
| 4 NE | wallrun + wall jump | run the wall, jump across before the pillar, run the panel |
| 5 N | zigzag | wallrun and wall jump between four staggered panels |
| 6 NW | climb | 2.8 m (jump + mantle), 3.4 m (double jump + mantle) |
| 7 W | speed | slide a 17° ramp to top speed, jump a 7 m gap at the bottom |
| 8 SW | low | slide chute into a 1.5 m tunnel, back to room 1 |

Stations 3 to 7 are over a reset floor: touch it and you're back at the station's checkpoint.

**The movement lab** (south of the course) is one hall of five wings open to each other through wide arches: the hands (crates,
throw, parry, recoil), the rigging (hang, bars, cable, beams, grates, poles), the tech lab (pool, ladders, slam, slip, blink, stomp,
climb), the clockwork mill and the kiln stack. One entry in the index; its stations are checkpoints.
**R** returns to the last checkpoint, **H** to the hub. Teleports refill Lachryma.

**The rubric.** Distances were measured by simulating the controller at default tuning
(takeoff to landing at the same height): walk jump 2.45 m, sprint jump 4.0, slide-hop 5.3,
sprint + double jump 6.7, max-speed jump 7.9, slide-hop + double 8.5, sprint jump + dash 9.1,
sprint + dash + double 12.9, slide-hop + dash + double 13.7, max speed + dash + double 15.2.
Jump height 0.92 m, double jump 1.66 m. (Re-measured in round 10: the first run's test
teleport left the body 0.85 m up, which read about 2% long. The controller didn't change.) A wallrun over a drop covers about 16.8 m in 1.8 s and
ends 2.75 m below where it started; a wall jump carries 3 m out and about 9.5 m along. Gaps
are sized at about 85% of the measured distance.

Underground, the sun is switched off (it would light the lab outside its shadow frustum) and
the fog thins.

## Movement techs

Optional techniques over the core movement (`src/moves/`). The core (walk, sprint, crouch,
slide, jumps, wallrun, wall jump, mantle, air dash, tuned under `movement`) is the gold
standard the basement is measured against, and techs never change it: each lives in its own
module with its own `tech.<id>` tuning and an `enabled` switch, and acts only through a few
hooks (an active tech owns the fixed step; landing events; its own pose layer and camera).
Switching one off gives back the core exactly; the measured metrics above are identical with
every tech on or off. Techs start in priority order and only one is active at a time.

Some techs are *Movement Arts* you learn (see **The System**); the body moves (swim, ladders,
hanging, poles and ropes, grates, balance, carrying, pushing) come with a humanoid. In **Lab mode**
(Codex, B; the default while it's just us testing) every art is unlocked: that's what the tech
lab and the stress test use. Techs are *active* (one owns the movement step at a time) or
*passive* (carry, kick, recoil: they run beside whatever else is going on).

| Tech | Input | What it does |
| --- | --- | --- |
| Blink | E | a near-instant 5.5 m dodge along the move keys (or the view), sliding along anything in the way; leaves an afterimage, comes out with your momentum pointed where you blinked; 2 charges |
| Slam | C in the air, looking down, 1.8 m+ up | straight down; the landing breaks pots nearby and throws the rest (and clapperjars). Then Space: slam jump, higher the further you fell (about 2 m from 5 m); hold C with a direction: slam slide, the fall turned into speed. (Looking ahead, C in the air stays the core's landing slide) |
| Stomp | land on a pot or a clapperjar | it breaks under you and throws you up (+1.66 m), air jump refilled |
| Roll | Shift while crouched; automatic only out of a fall of 20 m or more | a low dash the way you steer (or face) with invulnerability frames at the start (`player.invuln`, ready for a damage system); out of a fall it also mitigates the landing and turns the fall into forward speed (above slide speed the core slides instead). Space out of the second half keeps the speed |
| Slip dive | hold C on slip | melt into liquid clay: a fast blob (10 m/s) through slip, crawling off it; climbs slip-coated walls, fits through 0.8 m gaps, Space launches out (higher than a jump, keeping the speed), let go of C to stand. Lachryma soaks back in meanwhile. The SLIP shell (8) paints floors and walls wet; burst slip barrels leave puddles |
| Swim | deep water | float with your head out and paddle (Shift faster); C dives and you swim where you look; Space rises, and at the surface hops out; swim into an edge to climb out |
| Ladder | walk (or jump) into one | W / S climb (Shift faster), C slides down, Space kicks off, climbing past the top steps off; the limbs climb contralateral (right hand with left foot, a rung apart) and each hops two rungs when the body has passed it. The gun stays out at a walk (one hand climbs, one shoots); a fast climb or a slide stows it |
| Hang | jump at a ledge 1.9-2.95 m up with W held; jump at an overhead bar or cable | both hands catch it and you dangle (the gun hand stays on the gun: aim and fire). A / D shimmy along a ledge, W pulls up onto it, Space kicks off, C drops. On a bar, W / S go hand over hand and Space swings you on (a 2.6 m gap is a swing-jump). A slanted cable is a **zipline**: it runs you down, hanging, and lets go at the end |
| Wall latch | C in the air beside a wall (not looking down) | cling by the feet and one hand (the other free for the gun), WASD crawl along it, Space kicks off, over the top is a mantle. 2.2 s a jump, then you slide; the time comes back on the ground |
| Pole / rope | walk (or jump) into one | arms and legs round it: W / S climb (Shift faster), A / D swing round a pole, C slides, Space jumps off. A rope hangs from its top and sways with you |
| Grate | walk into a grate wall; jump up under a grate ceiling | any direction, for as long as you like. W / S / A / D on a wall; up under a roof it meets, W carries you on out under it (until you look elsewhere), then WASD crawls where you look; the roof's edge lets go. C drops, Space kicks off a wall or hops off a roof |
| Balance | walk onto a beam | a careful step (1.9 m/s) with your arms out, settling on the middle by itself; Shift is a trot that wobbles you off it and takes steering back. The beam is as wide as your boots (0.3 m and 0.2 m in the lab) |
| Carry | Z at something small (pots, crates up to 0.9 m) | Zelda-style: a crouch and both hands under it, hoisted over your head (0.55 s), then 72% speed, no sprint, no gun. Fire throws it along where you look (pots shatter where they land, targets ring); Z sets it down |
| Push / pull | hold Z at a heavy crate (over 0.9 m) | take hold and slide it along the way you face: W pushes, S pulls. It can't turn; a wall stops it and lets go if it gets away |
| Kick / parry | Z on the run, or with nothing to lift | a leg swing that knocks pots (and cracks them), crates, clapperjars, and rings targets. The first 0.25 s is also a parry: kick a projectile coming at you and it goes back where you look (with a little help toward a target), and you are invulnerable for a beat |
| Recoil jump | shoot down (steeper than ~20°) in the air | the gun's kick is real: up and back the way the barrel points, three shots a jump (a charged shot counts two), back on the ground; costs what a shot costs |

**The tech lab** is through room 1's south door (or the LAB entry in the hub's index): a
station per tech, each with a checkpoint (T1-T6, R returns to it). The pool (4.5 m deep, a 5 m dive tower, a wall to swim under, a ladder out), 6 and
8 m ladder towers (the 8 m one is the slam / roll platform over a field of pots), the slip
lane (a 0.8 m gap only the blob fits, a slip-coated 6 m wall), a 9 m blink gap over a reset
pit, stomp stairs (pots on rising pillars, a bounce apart) and a 4 m wall to climb.

**The rigging and the hands** are two more wings, west of the lab (through its west door, or
the index console's RIGGING / HANDS entries). *The rigging* (`src/riglab.js`, built with the
`Rigging` class in `src/moves/rigging.js`: bars, poles, ropes, grates, beams): R1 a 2.7 m ledge to
catch and shimmy with a shelf of targets behind you, and a 5.5 m pillar to latch up; R2 a pit
crossed three ways at once, on two overhead bars a swing-jump apart, a 15 m zipline from a tower,
and two balance beams (0.3 and 0.2 m); R3 an 8.6 m grate wall up to a grate roof that runs out
over a pit to a tower; R4 a pole to slide down, a rope to climb, and a tower to get back up.
*The hands* (`src/moves/carry.js`, `push.js`, `kick.js`, `recoil.js`, `src/lobber.js`): H1 heavy
and small crates and a 3.2 m wall to stack up to; H2 a throwing range (targets at 10, 16 and 22
m) with pots and crates on a bench; H3 a mortar that throws a glazed ball at you every few
seconds (kick it back at the two targets beside it: a parry); H4 a 7.2 m platform you can only
reach by shooting down in the air.

## Moving ground, and the clockwork mill

**Movers** (`src/movers.js`) are kinematic platforms driven by a pose function of time: shuttles
(lifts, gates, rail carts), cogs (a turning disc), pendulum swings, orbiters (a wheel's
gondolas), belts (a fixed surface that moves), plus updraft columns. A rider is **carried** by the
platform (the controller moves the rider against it, then the whole move is carried by the
platform's displacement under the feet, which is exact for a turning cog: the radius holds to the
millimetre) and **keeps its velocity** when it leaves: a jump off a 4 m/s shuttle starts at 4 m/s,
a step off a rising lift keeps rising. Locked feet ride the platform, mantles aim at a moving
ledge, and anything a platform moves into is pushed out along the shortest way. The core
controller only ever sees a `carry`: with none, the measured metrics are unchanged.

**The mill** is east of the tech lab (the lab's east door, or the MILL pad in the hub):
- **Cog walk**: a chasm crossed on four meshing cogs (12 teeth, phased so they really mesh; each
  turns the opposite way, so at the contact the surfaces move together). Steer, or the turn
  carries you off the side.
- **Millstone**: a stone wheel raised 0.6 m that turns under your feet, under a hopper.
- **Belts and gates**: conveyors with and against you (3 m/s) and gates that lift and drop.
- **Lifts, gantry, shuttle**: two staggered freight lifts up to a 10 m gantry, a 14 m gap crossed
  on a shuttle (jump off it moving and clear it by metres), a ladder down.
- **Ferris wheel**: board a gondola low, ride round, hop onto the deck at the top (ladder down).
- **Steam**: an updraft column to a 9 m ledge.
- Wall gears (three meshing on the south wall, two on the north), a line shaft with pulleys
  turning overhead.

**The kiln stack** beyond it is a 57 m well: depth bands on every wall, a ladder floor to brink,
a freight lift (the slow way up), and two rail carts running on the floor: the moving targets.
Look down and slam from the brink (or from higher): a 57 m fall takes about 2.4 s, and you
steer 3 m/s to meet a cart that has moved. That is the **Super Slam** feat.

## The stress test

`tools/stress.mjs` (Playwright; `npm i --no-save playwright`, `npm run dev`, then
`npm run stress -- --seed 1 --runs 40 --ticks 900`) drives the simulation with random,
human-shaped input from teleports all over the workshop, in Lab mode, and checks after every step:
finite numbers, the body not inside geometry, sane speeds, the blob form only while slip diving,
no controller stall, no tech stuck for a minute, no falling out of the world. `--pairs` runs every
pair of techs alone with the rest off (the interference matrix: 154 configurations with 17 techs). It exits
non-zero on a violation and prints where, with the last few moves and what the body was inside.
The player's own safety net (`Player.guard()`, and a check on every move that pulls a move back
to the last clear spot if the controller leaves the capsule inside a wall) is counted, not hidden:
the stress test reports how often the controller needed catching.

## The System

Nothing here is bought with experience points: **skills are learned by doing.** The core movement
(and the body moves: swimming, ladders, hanging, poles, grates, balance, carrying, pushing) is yours from the start; the Movement Arts are earned, each by something you
can do with what you already have, and each has variants with harder asks. Press **B** for the
Codex: the Movement Arts, what you know, the shapes of what you don't (a hint, and a bar that only fills as
you get closer), and which variant is selected. The game pauses while it's open.

| Ability | Learned by | Variants (and what earns them) |
| --- | --- | --- |
| Blink | 20 air dashes | **Rush** (30 blinks): 8 m; **Flicker** (a blink right after a blink, 8 times): 3 short charges |
| Slam | 3 drops of 12 m or more | **Quake** (40 slams): a wider shockwave; **Super Slam** (slam onto a *moving* target from 50 m up: the kiln stack's carts): a huge double ring, a taller slam jump |
| Roll | 5 hard landings | **Tumble** (15 rolls): rolls from lower falls, faster, longer invulnerable |
| Stomp | 25 pots broken | **Spring** (three stomps in a row): a higher bounce |
| Slip dive | 6 slip-shell splats | **Tide** (90 seconds under the slip): faster, higher launch |
| Wall latch | 6 ledge and bar hangs | **Iron Grip** (15 latches): longer, faster |
| Kick & parry | 15 pots broken | **Counter** (4 parries): a wider parry window, thrown back harder, longer invulnerable |
| Recoil jump | 15 shots fired in mid-air | **Boost** (25 recoil jumps): harder kicks, one more a jump |

All the arts you've learned are always on (there is no loadout: the Codex shows how to earn the
rest, and which variant of each is selected). Progress saves as you go, and **EXPORT CODE / IMPORT** carries a save between
browsers (`FFS1.<base64>.<checksum>`). A variant only changes its ability's tuning
(`skills.js: cfg`), laid over `tech.<id>` through a live proxy, so nothing about the core moves.

How it works: everything that happens is reported to an event bus (`src/events.js`:
`jump`, `land {drop, fall}`, `slide.end`, `wallrun.end`, `dash`, `blink`, `slam.impact {height,
target}`, `target.hit {cause, drop, moving}`, `break`, `tech.start/end`, ...). `src/system/skills.js`
is the data: a goal is `count`, `feat`, `sum` or `chain` over events. `system.js` feeds events
to the goals of whatever's still to learn, unlocks and saves; a tech asks
`system.allows(id)` before it may start (`Tech.usable()`). New moves ship with an unlock rule, a
variant and a lab station.

## The log, the ledger and the achievements

**The game has one place for text feedback: the log**, in the lower left, after Final Fantasy XI's chat window: a dark blue
translucent window with a pale bevelled frame, white outlined text, and a colour for every kind of message (combat lines
white, hurts soft red, gains yellow, moves cyan, surfing sea green, arts blue, the hand violet, circuits amber, records
ice blue, achievements gold), so the colour says what happened before the words are read. Tabs after FFXIV's chat window (ALL, BATTLE,
MOVE, EVENT, SYSTEM) each carry a filter and an unread mark; timestamps; repeats fold into one line ("You shatter 4 jars.");
**PgUp / PgDn** scroll, **End** jumps to the newest, **[** and **]** change tab; the window settles to half strength when quiet. There
are no pop-ups, toasts, banners or counters on the screen: what used to announce itself ("Chain!", "Clapped!") is counted quietly and,
where it deserves a sentence, written in the plain voice of a combat log ("The clapperjar is cleaved in two.").

Behind it is **the ledger** (`stats.js`), which counts everything: counters that only go up (time and distance by movement state, every
move, every kind of pot and cause of death, shells and lachryma by kind and use, the hand, surfing, maps, circuits), personal bests with
where and when (Old School RuneScape's hiscores rank a score and then the time it took), and *firsts* (its collection log: a slot by thing,
not by source). `tracking.js` is the only place that turns events into counts and lines. It saves to the browser as it goes.

**Achievements** (`achievements.js`, on the LEDGER shelf of the Codex, **B**) are predicates over the ledger, so they are retroactive: one added later
completes at once for whoever has already done it. From OSRS: six tiers worth 1 to 6 points (Easy to Grandmaster), a type on every task
(count, speed, perfection, mechanic, stamina, collection), a running points total that buys a standing (Sweeper to Fool's Fortune). From FFXIV:
categories with sub-groups, a number behind every entry (so it reads 37/100 before it is done), hidden entries as ???, titles for some, and
nothing missable. The RECORDS shelf is the hiscores page: lifetime totals, personal bests, and where the time went.

## What's in the room

- **Ground floor**: shelves, workbenches, pottery wheels, slip barrels, a drying rack, a
  balcony with stairs (storage bay underneath), a ramp platform, and the kiln flanked by
  jōmon flame-rim pots.
- **Second floor** (up the balcony stairs, or ride the **Lachryma geyser**, the glowing ring
  under the atrium): a sculpture gallery (a giant goggle-eyed dogū, haniwa figures, busts,
  endless columns), a porcelain showroom, teetering bowl towers, an upper kiln, and a mobile
  of lanterns hanging through the atrium.
- ~290 procedurally lathed pots and sculptures in three clay bodies that break differently:
  **stoneware** (big slabs), **earthenware** (mid shards), **porcelain** (slivers and
  glittering dust).
- **Ember urns** explode and chain-react. **Slip barrels** burst into a mess of liquid clay.
- **Lanterns** on 8-segment ropes: shoot the rope to drop them, shoot the lantern and the
  rope whips.
- **Clapperjars** on both floors. They wander, taunt you (lid clapping, waving), nap when
  you're far away, eat baubles, stumble and bolt from near misses, hide behind big pots and
  peek out, and shatter from shots, slices, blasts, scalding and long falls.

## Animation

Motion comes from three places, in this order of preference: baked clips (Quaternius UAL Standard,
retargeted to the Courier by `tools/bake_anims.mjs` into `src/assets/anims.bin`), clips authored
once at startup from key poses (`src/authoring.js`, `src/authored.js`), and only then a light
runtime IK correction on the contact points.

- **Authored clips** are built on the Courier itself: for every frame the body is put in a base
  pose, the hips and spine are placed, and each hand and foot is solved with two-bone IK onto a
  contact taken from the level's geometry (ladder rung pitch and reach, a ledge's lip, a pole's
  radius, a grate's face). The result is stored like any other clip. `warn.mjs`-style checks (the
  builder logs `contacts out of reach` in the console) keep every contact within 2 cm. At runtime
  a tech plays them **by distance**, not time: a ladder cycle is two rungs of climbing, a hang
  shimmy is 0.4 m of travel, a pole cycle 0.9 m, so the limbs in stance stay planted while the body
  moves past them, and going the other way is the same clip in reverse. Stopped, the cycle eases
  to the nearest phase where every limb holds.
- **Clips authored**: `ladderUp` / `ladderSlide`, `hangLedge` / `hangShimmy` / `hangBar` /
  `hangBarGo`, `poleUp` / `poleSlide`, `grateSide` (the wall latch and grates reuse the ladder
  cycle up and down, and blend to `grateSide` moving sideways; under a grate roof the hang bar
  clips play).
- **Aim profile**: a tech can say `get aim() { return { arm: 'R', turn: 0.3 } }`: only the gun
  arm aims (arm IK) while the other hand keeps its hold and the torso hardly turns, so you can
  shoot one-handed off a ladder, a ledge, a pole or a grate.
- **Layers**: the base locomotion clip, then each tech's `animate` (a clip, weighted), the aim
  layer (masked), stride warp and foot IK, the tech's `afterPose` (small body corrections: the
  torso under a carried load, the lean of a kick, the body drawn in toward a ledge wall), and
  last `hands`: the contact correction that puts palms and soles on the surface, capped at a few
  centimetres so the clip's motion is what you see.
- Push uses the UAL `push` clip; balance beams keep the locomotion clip with soft, bobbing arms.
- `tools/bake_cmu.mjs` (with `tools/cmu_clips.json`) probes, finds loops in, and retargets BVH
  files from the CMU database onto the Courier; use it to add real climbing or kicking clips.

## How it works

| File | Role |
| --- | --- |
| `src/main.js` | bootstrap, fixed-step loop (60 Hz physics, interpolated camera) |
| `src/player.js` | Rapier kinematic character controller (slide, wallrun, mantle, dash), FP/TP camera, recoil punch |
| `src/weapon.js` | firing, spread/bloom, hitscan, reload, holster timing, first-person gun pose |
| `src/character.js` | the Courier: clip blending by movement state, pistol aim offset, gun socket, IK corrections |
| `src/animator.js`, `src/anims.js` | pose buffers, clip sampling/blending, the baked clip pack decoder |
| `src/authoring.js`, `src/authored.js` | the clip author (IK key poses baked into clips) and the ladder / hang / pole / grate clips |
| `src/indexmenu.js` | the index console UI (one teleport per room) |
| `src/pottery.js` | pot profiles, shape modifiers (lobes, twist, flame rims), surface patterns, clay materials, fracture. A pot is built on its profile's own points (no extra rings to carry painted bands: a jar is ~130 triangles, an urn ~220), with an inside wall only where it can be seen and a flat foot at least 45% of its width so it stands still |
| `src/breakables.js` | spawning, shattering into physics shards, ropes, impact breaks, explosions; who each break was (the Courier, a clapperjar, the environment: only the Courier's are the Courier's records) |
| `src/tags.js` | what a thing in the world is for the physics and the tools (sliceable, breakable, liftable, pushable, static): defaults per kind, per-thing tags, and a registry of static things a sweeping tool can find |
| `src/clappers.js` | clapperjar AI (wander, forage, taunt, nap, hide, flee) + procedural layers over the authored clips |
| `src/lachryma.js` | the Lachryma energy pool + collectable baubles |
| `src/shells.js` | shell inventory and the first five shell effects (the Cleave's travelling line among them), projectiles, molten/slip fluid |
| `src/specials.js` | ricochet and homing shells, lock-on reticles |
| `src/cracks.js` | crack paths on pot surfaces, kintsugi gold seams |
| `src/trial.js` | the time trial |
| `src/basement.js` | the basement movement course |
| `src/techlab.js` | the tech lab annex |
| `src/mill.js` | the clockwork mill and the kiln stack |
| `src/riglab.js` | the rigging and the hands wings west of the lab |
| `src/lobber.js` | clay mortars that throw balls to parry |
| `src/godarts.js` | the five God Arts, the radial wheel, the art bar |
| `src/cartography.js` | the map grid, Zone of Influence tiers, compass, map screen, survey pulses |
| `src/dunes.js`, `src/moves/surfer.js` | the sand-sea layer (the height field with the oasis cut in, sky, ruins, wind) and Solar Skiffing |
| `src/render/terrain.js`, `src/barrier.js`, `src/vfx/clouds.js` | chunked LOD terrain (one draw call, skirts), the invisible edge that shows where it is touched, the drifting cloud layer |
| `src/skiff.js`, `src/wake.js`, `src/surfclips.js` | the Surfer's boat (hull, sail, arrow), its Wind Waker wake, and the rider's authored clips |
| `src/circuits.js`, `src/circuitrooms.js` | the lap-circuit runner (gates, splits, medals) and the halls of The Braid and The Spindle |
| `src/trailmap.js`, `src/marks.js` | a fading top-down trail map any surface can read, and what feet and boards write into it |
| `src/rom.js`, `src/romdata.js` | range-of-motion limits applied after every pose (the fingers; elbows and knees are held by per-state poles, `src/poles.js`, and a knee guard) |
| `src/siege.js`, `src/raids.js` | the Siege room and the raids that only happen there |
| `src/godmode.js`, `src/casters.js` | the god hand (isometric view, grab / cast, the vessel, raids) and the groove / anchor / hatch shells |
| `src/movers.js` | moving ground: shuttles, cogs, swings, orbiters, belts, updrafts, rail carts and targets |
| `src/events.js` | the event bus everything reports to |
| `src/gamelog.js`, `src/stats.js`, `src/tracking.js`, `src/achievements.js` | the log (the game's only text feedback), the ledger of counts and records, the rules that feed both from events, and the achievements over the ledger |
| `src/moves/sondelass.js`, `src/sondelass/`, `src/moves/zip.js` | the Sondelass tool (model, cutlass, hook) and the pull of the grapnel |
| `src/angling/` | angling: species, fish meshes and minds, lures (tastes, curios as lures), lure, line, fight, angler (the rod form), the Weir at the oasis (and its treasury), gauges |
| `src/render/` | the renderer's services: zones, the light budget, prop batches and instancing, static merging, vertex welding, and the presentation (resolution, upscale, smooth shading, shadow) |
| `src/tools/belt.js`, `src/tools/grip.js`, `src/tools/draw.js` | the tool belt: the contract and the rules for the seven psychic tools (the Psygun, the Sondelass, the Soul Brush and the Veritome on it); the grip socket measured from a clip; the draw |
| `src/moves/soulbrush.js`, `src/brush/`, `src/vfx/paintpath.js` | the Soul Brush: the model, the club, the brush slide's clip, the Celestial Brush (canvas, Penny Pincher recognizer, techniques), inscriptions (properties written on things), the sigils, and paint laid on the world |
| `src/moves/veritome.js`, `src/veritome/` | the Veritome: the book, the lens and its viewfinder, the subjects and the photograph's score, the Book's binder and hand, the 22 Major Arcana and their effects, the Codex shelf |
| `src/tools/viewmodel.js` | where a held tool is drawn in first person, and the arcs it swings along |
| `src/treasure.js`, `src/chests.js`, `src/chestmodel.js`, `src/ceremony.js`, `src/curiomodel.js`, `src/cubes.js` | tiers, odds and pity; the chests, the Tithe and F; the chest rig; the opening's script; the twenty curios; the Lachryma cubes |
| `src/vfx/rave.js`, `src/vfx/beam.js`, `src/vfx/water.js`, `src/mood.js` | the prismatic rave, a column of light, the banded water and liquid Lachryma, and the room's lights borrowed by a ceremony |
| `src/timescale.js`, `src/lockon.js`, `src/parry.js`, `src/hideui.js`, `src/sky.js`, `src/interact.js`, `src/vfx/` | time (slow-mo, hit-stop), Z-targeting, the shared parry, hide-UI, the painted sky, the interact chevron, and the shared visual services (cinema bars and shots, glyphs, rope, trails, portrait) |
| `src/poles.js` | knee pole targets per animation state (gait, crouch, air, slide) |
| `src/system/` | the System: `skills.js` (what can be learned, and how), `system.js` (progress, saves), `codex.js` (the Codex), `ledgerui.js` (its LEDGER and RECORDS shelves) |
| `tools/stress.mjs`, `tools/stress.page.js` | the stress test (random-input fuzzing with invariants) |
| `tools/learn_rom.mjs` | learns finger joint limits from the game's own clips into `src/romdata.js` |
| `src/moves/` | movement techs (`techs.js` the framework, one module per tech, `env.js` water, ladders, slip coverage, `rigging.js` bars, poles, grates, beams) |
| `src/slicing.js` | plane cutting for triangle meshes (with wall caps) and convex point sets |
| `src/fx.js` | tracers, muzzle flash, particles, chips, bullet-hole decals |
| `src/audio.js` | all SFX synthesized with WebAudio (no audio files) |
| `src/level.js` | greybox workshop and prop placement |
| `src/outline.js` | inverted-hull outlines (matches the .blend's Solidify outline look) |

**Fracture.** Each pot is a lathe (profile × radial segments) with optional lobes, twist and
flame crests. On break, the surface is resampled on a jittered grid whose cell size comes from
the clay body and the pot's size, each cell is cut along a random diagonal, and neighbouring
triangles are grouped into shards. Each shard is the convex hull of its outer points plus
the matching inner-wall points, so it gets both a render mesh and an exact Rapier collider.
Shards near the bullet's impact are smaller and get more push.

**Animation.** The Courier is driven by authored clips with IK corrections on top. The
clips are from Quaternius' [Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html)
1 and 2 (the free Standard tiers, CC0), retargeted offline onto the Courier rig by
`tools/bake_anims.mjs` into `src/assets/anims.bin` (about 220 KB). Both rigs rest in a
T-pose, so each bone's world rotation away from the T-pose carries straight over.

- **Locomotion:** idle, walk, jog and sprint play on one shared phase and blend by speed.
  Each loop is measured at load: an in-place clip's planted foot slides back under the hips at
  the speed the character is meant to travel, so that's its ground speed (walk 0.75 m/s, jog
  4.7, sprint 4.7: the jog is authored almost exactly at the 4.2 m/s run), and each loop
  plays at ground speed / its own, split between cadence and longer strides, so the feet
  don't skate. The walk
  covers up to a brisk 2.4 m/s (Alt to walk, aiming while moving) by lengthening its steps
  before its cadence, then hands over to the jog; the hips drop for long strides so the legs
  can reach. Foot locking pins a planted foot where it landed until the cycle lifts it (or
  the body gets 35 cm away), which catches what's left: speeding up, turning, blending.
  Aiming while strafing or backpedalling turns the hips toward the move and the chest back to
  the aim (orientation warping); backpedalling runs the loops in reverse.
- **Moves:** jump take-off into the airborne loop, a tuck flip on the double jump, the
  landing squat (lighter at a run), slide drop-in and hold, the climb clip timed to the
  mantle, a stretched-out take-off frame pitched forward for the air dash, and a sprint with a
  roll off the wall for wallruns.
- **Gun:** the psygun sits in a socket on the right hand (fitted to the palm from the pistol
  aim pose), so the gun follows the hand rather than the hands chasing the gun. When the gun
  is up, a pistol aim offset (aim down / level / up) is layered over the upper body and the
  chest turns the last few degrees so the barrel lines up with the crosshair. The support
  hand is IK'd onto the gun. Relaxed, the gun just rides in the hand through the run cycle.
- **IK corrections:** feet onto slopes and stairs (the hips drop for the lower foot), the
  wall-side hand flat on the wall while wallrunning, both hands on the ledge at the start of
  a mantle, the support hand on the gun. Each chain bends toward its *animated* elbow or knee,
  so the correction stays on the animated side and can't flip.
- **Holster:** the gun lies across the small of the back like a fanny pack, barrel to the
  left, grip out on the right (on show from behind). The draw (0.26 s) reaches back, the
  shoulders turning to help, grabs the grip, and whips the gun round the right hip up into
  the hand; holstering reverses it. Clicking while holstered draws and fires as soon as the
  gun is out. Swimming, fast ladder climbs and slides, and carrying stow it (both hands are busy) and bring it back after; hanging, latching, walking a ladder and the rest leave the gun hand alone.
- **Hand swap:** on a right-side wallrun the gun passes to the left hand (a quick hand-off,
  both hands on it mid-way) so the right can take the wall; aiming then uses the mirrored
  pistol pose, and in first person the gun moves to the left of the screen. Poses mirror
  left/right in character space, corrected per bone so the rest pose maps to itself (the
  rig's left and right bones don't share axis conventions).
- **Slopes:** a slide lies along the ground under it (pitched down a hill, rolled across one).
- **First person:** only the hands and the gun are drawn. The arms are view-model arms: the
  shoulders hang off the camera, and the hands are pinned to the gun.

To rebake after changing the clip list or the rig, get the Standard `.glb` files of both
libraries and run `node tools/bake_anims.mjs ual1.glb ual2.glb`. `npm run dev` then
`/dev/animlab.html` is a clip viewer for picking frames.

Crouching uses a 1.35 m capsule, which is where the crouched body (hair included) tops out;
crawlspaces are 1.5 m.

**Impulses on ropes**: Rapier recomputes a multibody link's velocity from its joint
coordinates, so a raw impulse on a rope link or a hung pot is lost. `physics.kick()` turns
impulses on links into a one-step force instead.

**Ropes** are chains of sensor links on Rapier multibody (reduced-coordinate) joints, so they
stay stiff under heavy pots. The links are sensors because contacts on multibody links
produce NaNs; cutting a rope needs Rapier 0.21+ (0.14 panics on joint removal).

## Character assets

Animation clips: Quaternius, Universal Animation Library 1 & 2 (Standard), CC0 1.0 -
https://quaternius.com. Retargeted to the Courier; see **Animation** above. (Only the free
Standard tiers are used; the paid full tiers are not included.) Motion capture: CMU Graphics Lab
Motion Capture Database, free for research and games, no resale of the data itself
(http://mocap.cs.cmu.edu), retargeted with `tools/bake_cmu.mjs` from the BVH conversion;
`src/assets/anims_cmu.bin` is that exploratory pack (not loaded by the game yet).

`tools/export_godmode.py` exports the god-mode assets (`source_assets/courier_godhand.blend`, a rigged hand, and `courier_pneuka.blend`, the jar) to `src/assets/godhand.glb` / `pneuka.glb`.

`tools/export_courier.py` converts the source `.blend` (kept in `source_assets/`) into
`src/assets/courier.glb` and `src/assets/psygun.glb`, which are bundled into the JS build.
It strips the Solidify outline shells (outlines are rebuilt in-engine) and exports the rig
in rest pose.

```bash
pip install bpy==4.5.*   # Blender as a Python module (Python 3.11)
python3 tools/export_courier.py path/to/courier_base_rigged.blend
```

`tools/export_clapperjar.py` does the same for `source_assets/clapperjar.blend`, exporting
its idle, sprint and stumble actions as clips.

The .blend's armour and mask textures point to files outside the .blend, so the
prototype uses flat terracotta materials.
