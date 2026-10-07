# Fool's Fortune

A third-person action game in clay, made to look and run like a sixth-generation console game (PS2, GameCube). You play the Courier,
a living vessel of clay with **Lachryma** for blood, and carry seven psychic tools through a potter's workshop, the basement under it and
the sand sea far below. Built with **Three.js** (rendering), **Rapier** (physics, WASM) and **Vite**.

This page is the manual: what is in the game and how to play it. How the code is built is in the documents below.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # the static bundle in dist/
npm run check      # the gate's static checks (docs/ARCHITECTURE.md)
npm run perf       # draw calls, triangles, heap, tick and draw time, against the last published build
npm run stress     # the stress test (needs `npm run dev` running)
```

## The documents

| Document | What it holds |
| --- | --- |
| `CLAUDE.md` | the working agreements every change follows, and who owns what |
| `docs/GLOSSARY.md` | the game's words, one meaning each, and the code names that match them (binding) |
| `docs/ARCHITECTURE.md` | how the code is laid out, the module contract, the budgets, the gate (binding) |
| `docs/DESIGN.md` | the loops, the progression, the numbers and why |
| `docs/LORE.md` | the series bible: people, places, history, names, tone |
| `docs/LOOK.md`, `docs/VFX.md` | what each kind of thing looks like; how effects are made |
| `docs/AI.md` | the parts every creature's mind is built from |
| `docs/ECONOMY.md` | where cubes come from and go, by the minute |
| `docs/OST.md`, `docs/voice_recording.md` | the soundtrack's plan; the System voice's recording script |
| `docs/CIRCUITS.md` | the movement gym taken apart, and the lap circuits |
| `docs/HANDOFFS.md`, `docs/PLAN.md` | notes between the divisions; the current round |

## Starting

The game opens on **THE FOOL'S PRECIPICE**, a live scene: the Courier on the lip of a crooked hill, a clapperjar beside them like the
Fool's dog, a checkerboard sea turning into a whirlpool below, its pieces moving on the beat. Press start and they step off the edge; the
menu comes in while they fall:

- **STORY** is off the menu for now (the owner, 2026-10-04); when it returns, the Movement Arts are learned by doing.
- **DEBUG**: the sandbox. The all-arts switch is on (every art lent), chests reopen in seconds, and `/grant` adds cubes.
- **SETTINGS**, **SOUND TEST**.

**Progress belongs to the build** while the game is being made: the first time a new build runs, the unlocks, the ledger and its
achievements, the Veritome's film and Book, the Pneuka Box and the map are cleared (the log says so). Settings are kept.

## Keys

| Key | Does |
| --- | --- |
| WASD, Shift, Alt | move; sprint (any way but backwards); walk |
| Space | jump; again in the air, double jump; beside a wall with W held, wallrun, and Space again to wall jump |
| C | crouch; at a run, slide (jump out to keep the speed); in the air looking down, slam |
| Shift in the air | air dash (Lachryma, once per airtime) |
| Shift while crouched | roll: a dodge, invulnerable for its first third |
| E | blink (a Movement Art) |
| F | interact (the chevron marks what F acts on): open a chest, talk, pick up, hold to push or pull a crate, strike a gong, use a console |
| V | kick (its first moment parries a projectile); with the cutlass out, guard |
| Mouse, right button | look; aim down sights |
| Z, O | first or third person; swap shoulder |
| X, Q, G, J, K, U, I | draw or stow a tool: the Psygun, the Sondelass, the Soul Brush, the Veritome, the Dreamvane, the Crucibelle, the Lockheart |
| ~ | the god hand (and back) |
| Y | in the Dunes, summon or stow the skiff |
| M | the map (N sends a survey pulse from the god hand) |
| B | the Codex (pauses) |
| P | the Pneuka Box (pauses; with the Veritome drawn, the bank opens beside it) |
| Enter, / | the chat line: say something, or a command (`/help` lists them) |
| \\ | fold the log to its tabs; PgUp / PgDn scroll it, [ ] change tab |
| Tab | the tuning panel, and its ACTIONS: set the room again, back to the last checkpoint (it also restarts a lap circuit, or puts you back at the oasis), teleport to the hub |
| Esc | the pause menu, with the help pages (the keys, the core movement, the arts, climbing and water, a page for each tool) |
| F2 | hide the interface (everything, the frame of a shot only, nothing) |
| F3 | the diagnostics panel (frame time, draw calls, the economy's line); again for physics lines and what the creatures near you are thinking |
| F8 | QAIS, the testing window: this build's Brief, your QAIS tests, the reports (the frame is taken as you press it: draw on it, say what is wrong) and the open questions; Esc closes it |

What each tool does with the mouse and the number keys is under its own heading below, and on its help page.

## Moving

**The core movement** is Titanfall-flavoured: sprint, crouch and slide (the first slide in a while is boosted, slopes keep it going),
one air jump, wallrun and wall jump, mantle onto anything you jump into, and an air dash. Air steering never bleeds speed above a run, and
a fast landing eases off rather than snapping. A wall up to 0.55 m is stepped over without breaking stride. Top speed on foot is 14 m/s;
the speedometer (bottom left) shows it with the current move. The core is the gold standard: nothing added to the game changes it, and
switching any addition off gives it back exactly. Its numbers are under `movement` in `src/core/config.js`, live in the Tab panel.

**The body's moves** come with having a body: swim (C dives, Space surfaces and hops out), ladders (contralateral, a rung at a time; the
gun hand stays free at a walk), ledge hangs and shimmies, overhead bars and ziplines, poles and ropes, grate walls and ceilings, balance
beams, picking things up (F: both hands, thrown with a click), pushing and pulling heavy crates (hold F), and the kick.

**The Movement Arts** are learned by doing, each from something you can already do, each with variants that ask more. The Codex (B) shows
what you know and the shape of what you don't. In DEBUG the all-arts switch lends them all.

| Art | Learned by | What it does | Variants |
| --- | --- | --- | --- |
| Blink | 20 air dashes | a near-instant 5.5 m dodge along the move keys, keeping the momentum; 2 charges | Rush Blink (8 m), Flicker (3 short charges) |
| Slam | 3 drops of 12 m or more | straight down from 1.8 m up; breaks and throws what is near. Then Space: a slam jump; C with a direction: a slam slide | Quake Slam, Super Slam (onto a moving target from 50 m up) |
| Roll | 3 drops of 20 m or more | a low invulnerable dodge; out of a fall of 20 m it turns the fall into speed | Tumble |
| Stomp | 25 pots broken | land on a pot or a clapperjar: it breaks and throws you up, air jump refilled | Spring Stomp |
| Slip dive | 6 slip-shell splats | hold C on slip: melt into it, a fast blob that climbs slip-coated walls and fits through 0.8 m | Tide |
| Wall latch | 6 hangs | C in the air beside a wall: cling and crawl for 2.2 s | Iron Grip |
| Kick and parry | 15 pots broken | the kick's first quarter second sends a projectile back where you look | Counter |
| Recoil jump | 15 shots in mid-air | shoot down in the air and the gun's kick lifts you; three a jump | Boost |

## Lachryma, the shield and the cracks

**Lachryma** is the Courier's blood and every tool's fuel: the gauge on the HUD (the Lachrimeter). It trickles back on its own, and the
rest comes from **baubles**, gummy drops that pop out of clapperjars, lanterns and marked pots and fly to you when you come near. A bauble
left lying **oxidizes** to liquid Lachryma, then sinks away; clapperjars eat the ones they find and grow fatter for it.

**It is also the shield** (Halo's regenerating shield). A blow is paid for from the pool first. What the pool cannot pay for **cracks the
clay where the blow lands**: six regions (the mask, the torso, each arm, each leg), each a few hitboxes riding the bones. Cracks mend on
their own after a quiet spell, slowly, or at once at the kiln (**MEND**, for cubes). A blow on clay already cracked through **shatters**
the Courier: time all but stops, the cracks run over the whole body burning with Lachryma, and it bursts. They are made whole again in
the workshop, cracks gone, pool full. Nothing is lost.

## The tools

Seven psychic tools share one belt (`src/tools/belt.js`): one in the hands at a time, drawing one puts the other away first, and five
can be worn at once (two across the back, two at the hips, one at the neck); the rest ride in the Pneuka Box. Every tool works in first
person. Middle click with a blade or the brush **locks on** (Zelda's Z-targeting).

### The Psygun (X)

A hand-cannon that runs on Lachryma. Click to fire (semi-auto, buffered); hold to charge a piercing beam; the right button aims. Middle
click fires the chambered **caster shell**. A psygun is how many **chambers** it has and how deep each one is: the first holds six types,
chosen in the Pneuka Box, and 1–9, 0, − or the wheel pick the chamber. Refill shells at the glowing reliquaries.

| Shell | Does |
| --- | --- |
| Cleave | a four-metre line of light that cuts in two whatever it sweeps (press its key again to turn it level or upright) |
| Push | a cone of force |
| Well | a singularity that pulls everything into orbit, then pops; what reaches the core is crushed into baubles |
| Mark | stuns clapperjars and marks pots: they glow through walls, take double damage and drop Lachryma |
| Bomb | a clay grenade: splash, molten slip, a hot pool |
| Bank | ricochets up to five times, harder each bounce, bending toward a target |
| Seek | hold to paint up to six targets, release a fan of seekers |
| Slip | a ball of liquid clay that paints floors and walls wet (dive in with C) |
| Groove | a mirror ball: everything near dances for nine seconds |
| Anchor | pins one thing where it is, in mid-air if that is where it was |
| Hatch | a pot cracks open and a friendly clapperjar climbs out; a clapperjar hit by it turns friendly |

### The Sondelass (Q)

A telescoping instrument worn on the back: **1** cutlass, **2** rod, **3** hook.

- **Cutlass**: a three-stroke combo, a lunge (the Stinger), a guard (V) that turns a projectile aside or, well timed, sends it back,
  and **blade mode**: time slows and the blade cuts along the plane you draw (MGR's zandatsu). A creature that is not stunned resists the cut.
- **Hook**: a grapnel. Solid ground pulls you to it (jump cuts the line and keeps the speed), something loose is yanked to you, and a
  held line lets you swing.
- **Rod**: angling at **THE WEIR**, the oasis in the Dunes. Choose a **lure** (made ones, or any curio) and the **aspect** a sounding
  pushes into it (wonder, mirth, desire, grief, dread); cast, twitch, sink, and **sound** (middle click) to stir the pond. Answer the
  bite inside its window, then fight: keep the tension needle in its band while the fish tires, lean against its pull, give line when it
  runs. Ten species with their own depths, tides, bites and fights; a fish just landed leaves an echo that larger fish come to. The
  Codex's ANGLING shelf is the bestiary.

### The Soul Brush (G)

A calligrapher's brush the size of a club, its bristles soaked in slip. **The club**: three heavy blows that bat clapperjars away, a held
**slam**, a flick of slip at range (tap the right button). **The brush slide**: with it out, the core slide trails a stroke of slip you can
dive into. **The Celestial Brush** (hold the right button, Okami's): time stops, the screen turns to paper, and what you draw is read
when the hand rests. The brush alters things rather than hurting them: most drawings write a property onto what they are drawn over.

| Drawing | Technique |
| --- | --- |
| a stroke across | Still: what it crosses is held where it is (a pot in mid-air is a step) |
| a stroke down | Bounce |
| a circle | Mend: a cracked pot mended with gold, a wreck rebuilt, a clapperjar befriended |
| a circle with a fuse | Ember: the pots in it burst when broken |
| a spiral | Gale: a gust, and in the Dunes it turns the wind itself |
| a bolt | Bolt: a strike that stuns |
| ^ and V | Light and Heavy |
| a heart | Solace: every clapperjar in view dances; the god hand's jar is soothed |

With the brush out, clapperjars near you carry a queue of **sigils**; drawing a mark lifts it off every queue it heads (Magic Cat Academy).

### The Veritome (J)

A grimoire held open in both hands with a lens in its spine: it gathers what is true and changes nothing. **1** is the **Flash**: a cone of
light that dazzles and fills the **stun** meter of everything with eyes in it. The right button raises the **lens**; click to expose a plate
of **film** (24 a roll). Plates are appraised in a batch in the **darkroom** (the Codex, VERITOME): the **Compendium** keeps the best photograph
of each thing, the **bestiary** learns what each creature was doing, and the **Book** receives a card for each Major Arcana whose sitting you
caught. The Book is also the **bank**: things stored as cards, taken out again into the Pneuka Box, only while the Veritome is drawn.

**Reprogram**: walk up to a **stunned** mind and press the middle button. It offers your **macros**; choose one and type its **neuralese**
before time runs out. A macro is composed in the Codex (VERITOME, THE MIND) on a **lattice** of shaped **Functions**, each one a part of the
creature's own mind (an action, a status, a drive, a relation, a memory wiped), and how well it is fitted is how strong it is. Functions are
learned by photographing creatures doing them.

### The Dreamvane (K)

A shepherd's crook with a dreamcatcher in it, a pick across it and a tuning fork in its heel. Everything made of Lachryma gives off a
**signature**, and the Dreamvane finds them. **Dowse** (hold the right button; the wheel attunes it): the dreamcatcher turns toward the
loudest. **The pick** mines **crystal formations** in the Dunes, **tuned by ear**: each blow sounds a note, sharp above the formation's sweet
spot and flat below, wavering from the wrong side; a blow at the right height from the right side opens it at once and pays many times
over. **The fork** (tap the right button) is thrown: in crystal it doubles the pick, in a creature it shakes Lachryma out, in the ground it
rings and draws creatures to look. **The survey** (middle click) charts the ground around you. While it is worn, the compass rides at the
top of the view.

### The Crucibelle (U)

A smoking bell held like a lantern. **1–5** play the five notes of the minor pentatonic of whatever music is playing, in its key (the right
button held, an octave up), so nothing is wrong. Notes on the beat build **fever**. A **song** is a motif: Seeing (5 3 1) raises veiled
crystal and marks signatures; Seeming (2 4 2 4) stands up a smoke Courier that hunting minds take for you; the Rally (1 3 5) quickens your
allies; the Lullaby (5 4 3 2 1) puts foes to sleep; the Call (1 1 5 5) stands up a **smoke spirit** that fights beside you. Click tolls the bell.
The **instrument** fitted in the Pneuka Box is its voice.

### The Lockheart (I)

A little coffin on a chain, worn at the neck from the start. Worn, it drinks the Lachryma that overflows your pool. Drawn, the left button
**hoovers** loose baubles and the Lachryma of a mind laid low. Full, and with a **Possibilikey** on its ring (up to four), the right button
**opens** it: the Courier's ultimate, **the Opening**. The game stops for it, the keys plunge in, a **wheel** of odds stands in the sky (the
coffin's table, changed by the keys: Inverted, Even, Loaded, Twin, Wide, Echo), and what it lands on comes out as hard as the coffin was
full, from a spill of Lachryma to the slip nuke. A brass Possibilikey is spent in the turning; the others can be turned again, but each
use makes it likelier to snap in the lock (about three openings on average).

## The god hand (~)

On solid ground, **~** settles the Courier back into **the jar** (the Pneuka Jar, their true form) where they stood, and you become a
disembodied **hand** over a turnable isometric view; ceilings are cut away. Hold the left button for the selected **God Art**; hold the
right button for the art wheel (or 1–5). Q / E, the wheel, WASD or the screen's edges turn, zoom and pan. The hand reaches 36 m from the jar.

| God Art | Does |
| --- | --- |
| Telekinesis | lift anything loose and throw it |
| Sunder | drag a blade across the floor: everything above it is cut on that plane |
| Swell | grow or shrink a pot or crate |
| Wring | twist a pot, or scallop its walls |
| Manifest | raise a wall of clay from the floor |

The arts work only on ground you have explored (the **Zone of Influence**, shown by the veil on the floor); around the jar the ground is
always known. **The jar can be hurt**: at nothing it shatters, and it is reforged a few seconds later. **Raids** (waves of crimson
clapperjars making for the jar) happen in one room only, **THE SIEGE**, so the hand can be learned in peace elsewhere. Throw raiders away,
cut them, pin them, make them dance, or turn them to guard and mend the jar.

## Places

**The workshop**: the ground floor of shelves, wheels, slip barrels and the kiln (Mistress Saggar keeps it; F at its mouth for the kiln
station), and up the balcony stairs or the Lachryma geyser, the gallery: sculptures, a porcelain showroom, an upper kiln, a mobile of
lanterns over the atrium. Hundreds of procedurally lathed pots in three clay bodies that break differently (stoneware in slabs,
earthenware in shards, porcelain in slivers and dust); ember urns that chain-explode; lanterns on ropes you can shoot. The gong by the door
starts the time trial.

**The basement**, through the glowing hole in the ground floor (the geyser beside the landing throws you back up):

- **The hub**: the metrics gym, labelled references everything else is measured against (a height ladder, clearance gates, slope ramps, a
  long-jump lane), and **the index**, a console (F) that teleports you to every room.
- **The course**: one loop of eight stations round the hub, a skill each, with checkpoints and splits.
- **The movement lab**: one hall of five wings: the hands (crates, throwing, parrying a mortar, recoil), the rigging (ledges, bars,
  ziplines, beams, grates, poles), the techs (the pool, ladders, slam, slip, blink, stomp), the clockwork mill (meshing cogs, a millstone,
  belts and gates, lifts, a shuttle, a ferris wheel, steam) and the kiln stack (a 57 m well with moving carts to slam onto).
- **The lap circuits**: The Braid (three lines between junctions; take the one you have the resources for), The Mill Race (the mill in one
  loop) and The Spindle (a chain of skills, then a long chute). Splits against your best, a second for a slow gate, three for a fall, a
  medal at the finish. `docs/CIRCUITS.md` has the design.
- **THE SIEGE**: the god hand's arena, the one room raids happen in.

Everything moving underfoot (cogs, lifts, belts, swings) **carries** you and lets you keep its speed when you leave it. The rubric the
gaps are cut to, measured from the controller at default tuning: sprint jump 4.0 m, sprint and double jump 6.7, sprint jump and dash 9.1,
slide-hop, dash and double 13.7; jump height 0.92 m, double jump 1.66. Gaps are about 85% of those.

**The Dunes**, far below: a sand sea a kilometre across, low gold sun, half-buried ruins, a pale spire to sail toward, an invisible edge
that shows itself only where you touch it, and at its heart an oasis with **THE WEIR**: a pond in terraces, a pier, a well of liquid
Lachryma, the Tithe and its treasury (Raku), and Old Grog fishing from the pier. Three slip jellies live on the flats.

**The Shore**, due east of the oasis (about 500 m, or **E** at the Index): the one bearing where the far dunes part, the sand runs down
to the Emocean, and there is nothing but the crude sea to the horizon. You can wade a step into it, no further; **the jetty** runs out
over it, where the sloop moors.

**The crossing.** **F** at the jetty's end opens **the pier**: every island, with the fuel a crossing there burns (or why you cannot go),
and the **mounts**: two of the tools you wear, carried on the sloop and fired on **1** and **2** (the wake brush, the toll, the gulp, the
plate, the hook; the vane is passive). Choose an island and you cast off: the hop is sailed as a rail shooter paced by its cue, the camera
swinging between five views (behind the ship, straight down, abeam, a loose reticle, looking back). **WASD** moves the ship in the view's
plane; the **mouse** moves the reticle (from above and abeam the gun fires along the way the sea runs, and abeam at whatever runs
alongside). **LMB** held fires on every sixteenth note; **RMB** held paints up to eight targets and letting go fires a lance at each (3
Lachryma a lance; a volley that downs everything it painted pays double for every lock). **E** is a barrel roll (two charges: it turns
plain shots aside and rolls through the big blows); **V** parries an outlined shot back at whoever threw it; **Q** flips the ship's
feeling, and shots of the ship's feeling are drunk, not felt; **Shift** / **C** boost and brake. The second half is a **set piece**, and a
long crossing has up to three: **the shoal** (a school of glints rings you in a bait ball and strikes in pulses; down its Conductor, with a
lance, and it scatters), **the Wreckers' brig, the False Light** (her bow chasers astern, then her broadside: shoot out her ports, cut her
rigging with a full lock, shoot her boarders off your deck before they take a cask; she comes about to ram), and, rarely, **Old Nobody**
(it breaches across your lane, runs alongside with its gills open as it breathes, sounds and comes up under you, then meets you face to
face, maw open: lock its teeth, parry its spit down its throat). A breather between two set pieces mends the ship by three. Six hits and
you are offered a **continue** (cubes, doubling each time; a coin-fed run ranks no higher than C); decline and the ship breaks up and you
are made whole at your last Shrine. Made, the crossing sets you down at the far island's pier: **Margarite's dock**, with its lamp, the
**Pearl Shrine**, Letty Marque, and the Purser (F at the posted board beside the Purser: the counter). The tally is said in the log.

**The Great Dunemaw**, out on the sand north-west of the oasis (about 180 m; sail for the violet beam, not the pale spire's, or take
**W** at the Index): a dark pool turning in a ring of fallen stones and three standing ones (the Dreamvane hears it from far off). **F** at it goes down into **a Well**: three floors of rooms, laid out afresh each day (the same Well for everyone that day).
On every floor a pale pool is **the way up**, back out to the mouth with whatever you found, and a dark one is **the way down**, deeper.
Shatter down there and you come to at the mouth, and the run's haul stays in the Well. Slip jellies hold every room but the first, one
more each floor down, and a **Great Slip Jelly** (a FOE) keeps the bottom. Burst every jelly on a floor and something is left where they
were: a **material** for the spirit press, rarer deeper. Up the way up you keep the haul and the run pays in cubes (more for depth and the
FOE, less as the Well is drawn on: it fills again with rest). Chart four fifths of the floors you walk (the Dreamvane's survey does it;
walking alone does not) and you also come up with a **Cogitomap**: the Well as it is today. (The rooms are greybox until Calissa dresses them.)

**Solar Skiffing.** **Y** brings the **skiff**: a small hovering boat with a lug sail (after the King of Red Lions). W hoists the sail and
it stays up; S lets it down and brakes, and hoisting again quickly is a **pump**; A / D steer; Space crouches and hops, and in the air A / D
spin the whole skiff (land a whole turn for a boost); Shift is a solar flare, for Lachryma. The boat is driven by the wind alone (the
pennant shows it): a tailwind is fastest, into the wind is slow but never a stall. The wake is geometry laid down where the boat went.

## Creatures and folk

**Clapperjars** are living pots: they wander, taunt (lid clapping), nap, eat baubles, hide behind big pots, bolt from near misses and
shatter from shots, cuts, blasts and long falls. Left alone they do small slow things, each at its own temper.

**The slip jelly** (`src/creatures/jelly/`) is the first creature that fights back: an egg of wet sand on four paddling toes, moved by
springs in its vertex shader rather than bones. It glides on its own slip (real slip: you can dive into its trail), **lunges** after a
whole-body wind-up and **spits** globs. Eight shots' worth and it bursts into slip and cubes, and forms again later. The jellies **live
there**: they drink at the pond, rest in shade, forage, fish, play, call each other when one notices you, avenge the hurt and mourn the
burst. Their minds are built from shared parts (`docs/AI.md`).

**Stun** (`src/creatures/stun.js`): the flash, blows and being caught mid-leap fill a creature's poise; full, it is stunned (gold stars).
A stunned creature takes more from every blow and is open to what a thinking opponent would refuse: **reprogramming** and the **zandatsu**,
which cuts it into pieces that come undone into Lachryma.

**The clay folk** (`src/npc/`): clapperjars grown up and glazed. **Mistress Saggar** keeps the kiln, **Pip** her apprentice hides in the
basement hub, **Old Grog** fishes the Weir, **Raku** keeps its treasury. F talks: a dialogue box whose letters move with the feeling, a
voice of bells and clay (Clayese), a body that shows the mood. Every line is also written to the log, and they know what you have done.

## Things and money

**The Pneuka Box** (P): what the Courier carries, 56 slots (keys and film stack to 99). Right, what is worn: the lure on the line, each tool's
**fittings** (the Crucibelle's instrument, the Lockheart's keys), the psygun's chambers, and the five tools worn. Left click does the
obvious thing, right click lists everything, drag swaps. When the box is full, a new thing falls at your feet.

**Lachryma cubes** are the currency: Lachryma condensed into small black cubes with an oil-slick film. They come from creatures, crystal,
fish sold and chests; prices are named in minutes of play (`src/progress/econ/table.js`, `docs/ECONOMY.md`).

**Chests** come in five tiers, common to prismatic, each a rig that squashes, rattles and throws its lid. The opening is a cinematic; a
prismatic one is a seven-second blacklight rave. Each holds cubes and a **curio** (twenty, four a tier; a duplicate is condensed). At the
Weir, **the Tithe** sells **sealed** chests of a rolled tier, with published odds and pity counters, shown on the console and in the Codex.

**The shops**: say "Let's trade." to a keeper. Prices follow the stock (OSRS's shops). **Raku** sells Possibilikeys and coffins and buys
curios, and **haggles** (offer, flatter his fez, clink cubes, walk away). **Old Grog** sells film and lures and buys fish.

**The kiln** (F at its mouth, in the workshop): a turntable of the Courier, a glaze for each region (the armour, its trim, the mask, the
hair; the Lachryma of the body is never glazed). Twelve real glazes, three to start, the rest earned by achievements or learned from
photographs. **FIRE** keeps a look; **MEND** refires the cracks.

## The log, the Codex and the records

**The log** (lower left, after Final Fantasy XI's) is the game's only text: no pop-ups, banners or floating numbers. Every line is coloured
by its kind; tabs filter it; repeats fold into one line. It takes typing: plain words are said aloud, a slash is a command (`/help`,
the emotes `/sit` `/dance` `/wave` `/kneel` and more, `/where`, `/music`, `/voice`, `/window`). Marks in the world carry no words: a glyph
over a thing (`!`, `?`), the chevron, the lock-on reticle, the letterbox bars.

**The Codex** (B) is the Veritome's own pages: the Movement Arts and God Arts, the tools, the Veritome's shelves (the film, the bestiary,
the Book, THE MIND), the curios, the angling bestiary, and **the ledger**, which counts everything (time and distance by move, every pot and
cause, shells, Lachryma, the hand, the skiff, circuits) with personal bests and firsts. **Achievements** are questions asked of the ledger,
so they are retroactive: OSRS's tiers and task types, FFXIV's categories, titles and hidden entries. Its head holds the **ALL ARTS**
switch, the **VOICE** and **MUSIC** switches, the **WINDOW** colour, and the save code (EXPORT / IMPORT).

## Sound

Everything is synthesized live; there are no audio files. **The music** (`src/music/`) is scores as data played by synthesized bands:
the main theme "Lachryma" on the black keys, the battle "Five Against Fate", "The Workshop", the Dunes' "Mirage of the Still Water", the
five-movement draft "Fool's Fortune", the jingles. **The System's voice** says the rare things aloud ("Notice. ..."), in the game's own
formant speech synthesizer (`src/audio/voice/speech/`, Klatt-style, words from the CMU Pronouncing Dictionary), tuned against an offline
speech recognizer (Vosk) to be a robot's voice, on purpose, but a legible one. The folk speak Clayese.
The plan for the whole soundtrack is `docs/OST.md`.

## How it is drawn

The scene is drawn at **480 lines** and scaled up bilinearly, as a console's frame was by the television; the HUD and the log stay sharp
over it. Smooth shading, one sun shadow, a soft cel ramp on every lit material, a thin Lachryma rim on the Courier and the clapperjars,
the PS2's glow and a light grade; settings under Tab › visual. Only the zone the camera is in, and what it can see, is drawn; eight real
lights are lent to the lamps that matter most; sleeping props are batched; articulated things at rest are baked. Water is flat, banded
and moved by geometry, never a scrolled shimmer. The windows wear one JRPG kit (a nine-slice frame, a white glove, five window colours),
and the maker's pixel art is drawn at 1x and scaled by whole numbers. `docs/ARCHITECTURE.md` has the budgets; `npm run perf` measures them.

## Testing

- **The stress test** (`npm run stress -- --seed 1 --runs 40 --ticks 900`, with `npm run dev` running) drives the game with random,
  human-shaped input from teleports all over the world and checks after every step: finite numbers, the body not inside geometry, sane
  speeds, no stall, no tech stuck, no falling out of the world. `--pairs` runs every pair of techs alone. It exits non-zero on a violation.
- **The check** (`npm run check`): broken imports, orphans, the bus's rules, log celebrations, module headers and size, retired words, the
  Courier's pronouns. It fails only on new debt.
- **Perf** (`npm run perf`): the workshop and the Dunes measured headless, against the last published build.
- In the game: F3, F8 (QAIS: the Brief, the QAIS tests, the reports and the questions, kept in the published build's store;
  `docs/plans/QAIS.md`), `window.__boot` (the time at each stage of loading), and DEBUG's `/grant`, `/psygun`, `/vfx`, `/opening`, `/goto`
  (a place, or a report's stand line) and `/workbench` (the studio for effects, models and cinematics).
- **The QAIS test** (`npm run qais`): QAIS driven headless, away from the store and over a stand-in for it.

## Engineering notes

**Fracture.** A pot is a lathe (profile × segments, with lobes, twist and flame crests). On a break its surface is resampled on a jittered
grid sized by the clay body and the pot, each cell cut on a diagonal, and neighbouring triangles grouped into shards; each shard is the
convex hull of its outer points and the matching inner wall, so it gets a render mesh and an exact Rapier collider.

**Ropes** are chains of sensor links on Rapier multibody joints, stiff under heavy pots (sensors, because contacts on multibody links make
NaNs). Rapier recomputes a link's velocity from its joints, so a raw impulse on one is lost: `physics.kick()` turns it into a one-step force.

**The controller.** Grounded steps never push into the floor, a stalled move is retried, walls take away only the velocity into them, stairs
collide as ramps, and a move that leaves the capsule inside a wall is pulled back to the last clear spot (counted by the stress test, not
hidden). Crouching shortens the capsule to 1.35 m; crawlspaces are 1.5 m.

**Animation.** Motion comes from baked clips first (Quaternius' Universal Animation Library and CMU mocap, retargeted offline onto the
Courier: `scripts/bake_anims.mjs`, `scripts/bake_cmu.mjs`), then clips authored at startup from key poses on the level's own geometry
(ladders, ledges, poles, grates; played by distance, not time, so planted limbs stay planted), and only then a light IK correction on the
contacts (feet on slopes, a hand on a wall or a gun). Every posed joint passes the range-of-motion limits last (`src/courier/anim/rom.js`;
the fingers' are learned from the clips by `scripts/learn_rom.mjs`). To rebake, get the Standard `.glb` of both UAL libraries and run
`node scripts/bake_anims.mjs ual1.glb ual2.glb`; `/dev/animlab.html` (under `npm run dev`) is a clip viewer.

## Credits and assets

The white gloves of the interface (`src/assets/ui/`) and the pixel art (`src/assets/ui/px/`: the buttons, the gloves, the Lachrimeter's
end piece, the bead flash and the jank font) were drawn by the game's maker, and the slip jelly is the maker's own model
(`source_assets/slipjelly.blend`).

Fonts (SIL Open Font License 1.1, bundled in `src/assets/fonts/`, Latin subsets from Google Fonts): **M PLUS Rounded 1c** (The M+ Project /
Coji Morishita), **Cinzel** and **Cinzel Decorative** (Natanael Gama), **IM Fell English** (Igino Marini, after the Fell types),
**DotGothic16** (Fontworks Inc.).

Animation clips: Quaternius, Universal Animation Library 1 & 2 (Standard), CC0 1.0, https://quaternius.com (only the free Standard tiers).
Tiling textures (`src/assets/textures/`, for the triplanar material): ambientCG, CC0 1.0, https://ambientcg.com: Ground080 (`sand`),
Ground079S (`sand_packed`), Rock061 (`rock`), Tiles144 (`clay_floor`), Plaster001 (`plaster`), PavingStones128 (`stone_flags`); graded to
the game's palette and taken to 256 px by `scripts/bake_textures.py`.
Motion capture: CMU Graphics Lab Motion Capture Database, free for research and games, no resale of the data itself
(http://mocap.cs.cmu.edu); `src/assets/anims_cmu.bin` is that pack.

Pronunciations: the CMU Pronouncing Dictionary, Copyright (C) 1993-2015 Carnegie Mellon University, BSD licence (its notice is kept in
`src/audio/voice/speech/lexicon.data.js`; `node scripts/build_lexicon.mjs` rebuilds it).

The models are exported from `source_assets/` with Blender as a Python module (`pip install bpy==4.5.*`, Python 3.11):

- `scripts/export_courier.py path/to/courier_base_rigged.blend` → `src/assets/courier.glb`, `psygun.glb` (the Solidify outline shells
  stripped: outlines are rebuilt in-engine; the rig in rest pose)
- `scripts/export_godmode.py` → `src/assets/godhand.glb`, `pneuka.glb`
- `scripts/export_slipjelly.py` → `src/assets/slipjelly.glb` (one mesh, no rig)
- `scripts/export_clapperjar.py` → the clapperjar with its idle, sprint and stumble clips
