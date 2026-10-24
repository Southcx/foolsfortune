# The caster shells: a hundred rounds for the psygun (the owner, 2026-10-12)

Kept by Dovina (the hundred, their numbers, their costs, where they come from). The runtime is Petra's (`tools/psygun/`), the looks and
the new shaders Calissa's, the sounds Wanda's, the lore names Espada's (the labels here are working genre words, per CLARITY.md).

> "We're gonna go ham on making Caster shells for the Psygun. 100 unique effects in total ... broadly based upon the weapons available
> in the Ratchet & Clank series, specifically the original trilogy ... and of course, Outlaw Star. Don't worry about making shells that
> are overpowered, that's kinda the point. Really bake your noodle ... even if it means we have to design new shaders and mechanics."

**Prior art, and what was taken:**
- **Ratchet & Clank, Going Commando, Up Your Arsenal** (Insomniac, 2002-04): the arsenal as the game's personality, one weapon one
  idea, and the mods that recombine them (the Omega mods: Freeze, Acid, Lock-On, Morph, Shock, Napalm, Brainwash). Taken: most of the
  ideas, and the mod's lesson that an effect is a part, not a gun.
- **Outlaw Star** (Sunrise, 1998): the Caster and its numbered shells, each a sealed spell, rare and costly; the rare three (#4, #9,
  #13) draw on the shooter's life, and fired back to back they can kill. Taken: the numbering, the rarity, and the toll (section 2).
- **Noita's wands** and **Monster Hunter's bowguns**: a shot built from parts; a gun that loads only some ammo, so many of each. Taken:
  the composition (section 1) and the chambers (exists: `kinds.js`).
- **Mega Man's weapons**: each one a weakness for something. Taken: every shell answers some creature or place better than the rest.

## 0. Why this works, and the hole it plugs

A hundred one-offs is a hundred code paths, looks and sounds, and it stalls by the thirtieth. So **a shell is a recipe**: how it flies
(a **carrier**), what it does where it lands (one or more **payloads**), and what it leaves (a **field**). About fifteen carriers,
payloads and fields, most of them built already, make all hundred; the loud ones earn their own shader on top. Building the parts in
order (section 5) unlocks shells in batches, not one at a time.

**Overpowered is the point** (the owner). The price is not weakness; it is scarcity, chamber space and the Caster's toll (section 2),
so the big ones are moments, not the button you lean on.

## 1. The parts

**Carriers** (how a shell flies):

| id | carrier | exists? |
|---|---|---|
| `bolt` | straight and fast | yes (the round) |
| `lob` | an arc, lands or times out | yes (bomb, paint) |
| `bounce` | skips or caroms, n bounces | yes (BANK) |
| `seek` | homes on a creature | yes (SEEK) |
| `beam` | a held line from the muzzle | yes (the charge's beam) |
| `cone` | short, wide, held | yes (PUSH) |
| `deploy` | set down, stays a while (mine, turret, wall) | new, small |
| `swarm` | many small seekers from one round | new, from SEEK |
| `call` | marks a spot or targets, and it falls from the sky | new |
| `steer` | the camera rides it; you fly it | new |
| `self` | fired at your own feet: it acts on the Courier | new, small |

**Payloads** (what it does): `blast` (radial damage and push), `type` (a damage type's build-up), `status` (any of `STATUSES`),
`pull` (the well), `pin` (the anchor), `cut` (the slicing plane), `paint` (a feeling's paint on the paint map), `crude` (a slick), `charm`
(an ally flip: HATCH), `decoy` (`game.ai.decoys`), `summon` (an ally body), `split` (children on impact), `chain` (arcs between
targets), `morph` (a body swapped for a harmless one), `time` (a local time scale), `space` (move, swap or fold a thing), `mass`
(scale or weight), `feel` (a feeling's weather, burst), `dispel` (statuses and weather cleared), `world` (a thing made or unmade).

**Fields** (what is left): `pool` (ground), `cloud` (a drifting volume), `wall`, `dome`, `column`, `zone` (a sphere where a rule
holds), `rift` (a portal).

**New mechanics** (each built once, in `tools/psygun/` or where its owner says):

| | mechanic | who | shells |
|---|---|---|---|
| M1 | split on impact (children with their own carrier) | Petra | 13, 19, 23, 42 |
| M2 | chain targets (next nearest, falloff, no repeats) | Petra | 11, 31, 32, 35 |
| M3 | a steered round (the camera hand-off, a timeout) | Petra | 93 |
| M4 | deployables with a lifetime (turret, wall, mine) | Petra | 29, 36, 74, 76, 77, 79 |
| M5 | a portal pair (two rifts, anything passes) | Petra, Calissa | 43, 44 |
| M6 | a local time scale for bodies in a zone (not the global hold) | Petra | 51, 52, 58 |
| M7 | morph: a creature's body swapped for a harmless one, restored | Petra, Calissa | 27, 64 |
| M8 | per-body gravity and mass | Petra | 45, 46, 47, 50 |
| M9 | a three-second recording of a body (rewind, echo) | Petra | 54, 55, 59, 60 |
| M10 | the call from the sky (mark, delay, fall) | Petra | 22, 34, 91, 95 |
| M11 | a mind swap (two creatures' minds exchanged: the AI is built once, so it is a swap of modules) | Petra | 69 |
| M12 | made things: glass, golem, a ramp of fired clay (spawned static or dynamic geometry, breakable) | Petra | 26, 57, 78 |

**New shaders** (Calissa's, each used by several shells):

| | shader | shells |
|---|---|---|
| S1 | heat haze: screen refraction inside a volume | 15, 21, 29 |
| S2 | the bubble: a fresnel dome with a hex or glaze pattern | 51, 52, 76, 77 |
| S3 | lightning: a procedural bolt mesh, branching, with flicker | 31 to 40 |
| S4 | frost and bisque: a surface that grows over a body (dissolve's mask, run the other way) | 27, 56 |
| S5 | the portal: render to texture, a rim of crude | 43, 44 |
| S6 | lensing: a black hole's screen bend and its accretion ring | 94, 95 |
| S7 | the time grade: inside a sphere, colour drained and grain frozen | 51, 52, 54, 58 |
| S8 | the hologram: scanlines, a slipping flicker | 63, 76 |
| S9 | molten: a lava-lamp metaball with a crust | 22, 23, 29, 30 |
| S10 | the corrupted body: `glitch.js` brought onto one mesh, not the screen | 97 |

## 2. The cost: scarcity, chambers and the Caster's toll

- **Five tiers.** I *common*, II *uncommon*, III *rare*, IV *the Caster's own*, V *World* (section 7). A tier sets its price, how many a chamber holds and
  what it draws from the pool to fire.

| tier | worth (cubes) | a chamber holds | Lachryma to fire | where it comes from |
|---|---|---|---|---|
| I | 6 | the psygun's `cap` | 4 | any shop; Tithe chests |
| II | 20 | half | 10 | Tithe chests (rare and up), bounties, the Purser |
| III | 80 | 2 | 25 | epic chests, a Well's FOE, Charybdis |
| IV | 400 (never sold) | 1 | the Caster's toll | one each, found in the world |
| V | 400 (never sold) | 1 | drawn from the place (section 7) | every 12th full-grown blot mopped up |

- **The Caster's toll** (Outlaw Star's rare three): a tier IV shell is paid in the vessel, not the pool. Each one fired **cracks a
  region** (the vessel's own rule, `game.vessel`); a fourth with three regions cracked **shatters you**. Mended at the kiln as now.
  Fire one and feel it; fire three in a fight and you are gambling your body.
- **The worth** of a shell is its tier's (`worthOf`). Tiers I and II are a **drain** for the cubes the aim pays (a full chamber of a
  tier II is 160 cubes, a third of an hour's aim); III and IV are found, a **faucet** of power, not cubes. `scripts/economy.mjs` gets the
  rows when the shop lists them.
- **Chambers** stay the limit (`kinds.js`): six to eleven types at once, chosen in the Pneuka Box.
- **DEBUG:** the lend panel's `shells` row fills every chamber with any shell, uncounted (DEBUG-MODE.md).

## 3. The hundred

The eleven that exist keep their numbers. The new eighty-nine come in nine families of ten (the last of nine), each a corner of the
psyche, named with no article (the owner, 2026-10-12, through Espada): Edge, Ember, Storm, Pull, Clock, Will, Company, Feelings,
Caster's own. Columns: **no.** (`TYPE-nn`), **label** (a working genre word), **tier**, **from** (the prior art), **recipe**
(carrier · payloads · field), **what it does**, **the look** (and the shader or mechanic it needs).

### TYPE-00 to TYPE-10: the founding eleven (exist; `shells.js`, `specials.js`, `casters.js`)

| no. | label | tier | does |
|---|---|---|---|
| 00 | Cleave | I | a line of light that cuts everything it passes through |
| 01 | Push | I | a cone of force |
| 02 | Singularity | II | a lobbed singularity that drags in, then pops (renamed from Well: a Well is the dungeon; the owner, 2026-10-12; its id `well` kept for the ledger) |
| 03 | Mark | I | stuns critters, marks things to drop Lachryma |
| 04 | Bomb | I | a clay grenade: splash, molten clay, a hot pool |
| 05 | Bank | I | ricochets |
| 06 | Seek | I | homes |
| 07 | Paint | I | paints the ground to Paint Dive through (renamed from Slip after the paint overhaul) |
| 08 | Groove | II | everything with a pulse dances |
| 09 | Anchor | II | pins one thing where it is, even in mid-air |
| 10 | Hatch | II | a pot hatches a clapperjar; a clapperjar turns friendly |

### TYPE-11 to TYPE-20: Edge (Impact; things that cut, skip and strike)

| no. | label | tier | from | recipe | does | the look |
|---|---|---|---|---|---|---|
| 11 | Ricochet Saw | I | Chopper, Disc Blade Gun | bounce · blast, chain | a spinning blade that caroms between up to five creatures, then comes back to the muzzle | a fired-clay throwing wheel with a gold rim, a smear of motion, sparks at each bounce (M2) |
| 12 | Skipstone | I | Bouncer | bounce · blast | skips five times across the ground, a small blast at each; on water it skips twice as far | a flat Lachrymite stone, a ring at each skip; on crude the rings are oil film |
| 13 | Splitter | II | Flux and Splitter Rifle | bolt · type, split | pierces every creature in line; at the first wall it splits into a fan of seven that ricochet | a white needle with a chromatic split, seven threads at the wall (M1) |
| 14 | Hailstorm | I | N60 Storm, Blitz Gun | cone · blast | twenty-four shards at once, a shotgun | shards in random glaze colours; a tinkle like a dropped tray |
| 15 | Piercer | II | Flux Rifle | beam · type | a rail through creatures and through walls up to 3 m thick; the line hangs as a glass tube for 2 s | a refraction tube along the line (S1) |
| 16 | Mallet | II | Walloper | lob · blast, status (stun) | blooms mid-flight into a giant clay mallet head that slams where it lands; a sure stun | a mallet unfolds from the round; a slam ring and a cake of dust |
| 17 | Cartwheel | I | the Bouncer's roll | bounce · status (soft), mass | a clay wheel that rolls along the ground, up walls, and flattens small creatures for 4 s | the flattened creature is a cartoon pancake, scaled to 0.2 in height (M8) |
| 18 | Pinball | II | the arcade | bounce · blast | a steel ball that ricochets off everything, 15% faster each bounce, for 6 s | chrome, its trail reddening with speed; each wall rings like a bumper |
| 19 | Petal Rain | II | Zodiac, in small | lob · split, blast | hangs at its apex for half a second, then blooms into forty petals that rain down in a ring | glazed petals falling in a slow spiral, each a tiny hit (M1) |
| 20 | Stake | III | Trigun's Cross Punisher | bolt · pin, type | a ceramic stake that nails a creature to the nearest wall behind it | gold kintsugi seams on the stake, cracks spidering out on the wall |

### TYPE-21 to TYPE-30: Ember (molten clay and crude)

| no. | label | tier | from | recipe | does | the look |
|---|---|---|---|---|---|---|
| 21 | Flamer | I | Pyrocitor | cone · type, world | a held flame cone for 4 s; clay it touches is fired hard, and paint it touches bakes into ground you can stand on | heat haze over an orange-to-white flame, ash drifting up (S1) |
| 22 | Meteor | II | Lava Gun to Meteor Gun | call · blast, pool | mark a spot; three molten clay meteors fall on it a second later and leave hot pools | the meteors trail like lava lamps; the pools crust over as they cool (M10, S9) |
| 23 | Lava Lamp | II | the Lava Gun's glob | seek (slow) · blast, split | a wobbling blob of molten clay that drifts after the nearest creature and splits into three when it hits | a lava-lamp wax body, its crust breaking as it moves (S9, M1) |
| 24 | Napalm | II | the Napalm mod | lob · crude, pool | a crude slick that catches a second later and burns for 8 s | fire on an oil film; the film keeps its labradorite flash under the flames |
| 25 | Detonator | I | Nitro Launcher | bolt · blast | a charge that sticks; it goes off when you fire your next shell, any kind | a putty lump with a blinking glaze bead |
| 26 | Glassmaker | V | sand and heat | lob · world | sand where it lands fuses into a sheet of glass: a platform or a ramp that holds you, and breaks | green glass with a refraction edge, cracks spreading when struck (M12). Teaches: sand and heat make glass |
| 27 | Bisque | III | firing | bolt · morph, status (halt) | fires a creature to bisque: it stands as a terracotta statue for 5 s, and an Impact blow shatters it for double | bisque spreads over the body from the hit (S4, M7) |
| 28 | Cinder | I | the Pyrocitor's sparks | swarm · type | a flitting ember that drifts for 10 s and sets alight what it touches; it goes where the wind goes | a single ember and its smoke ribbon, carried by the weather's wind |
| 29 | Volcano | V | the Lava Gun's ground | deploy · blast, pool | a small cone of clay rises where it lands and throws a molten bomb every second for 8 s | the cone heaves, cracks glow, heat haze over it (M4, S1, S9) |
| 30 | Slag Rain | II | volcanic ash | lob · blast, field: cloud | throws hot drops up that fall for 3 s in a ring of 6 m | the weather's streaks, glowing; a hiss on every surface they hit (S9) |

### TYPE-31 to TYPE-40: Storm (lightning and charge)

| no. | label | tier | from | recipe | does | the look |
|---|---|---|---|---|---|---|
| 31 | Tesla Node | I | Tesla Claw | deploy · chain | a node that lands and arcs to the nearest two creatures every half second for 6 s | white-blue bolts from a little clay insulator (S3, M2) |
| 32 | Chain Bolt | II | Shock Cannon | bolt · chain, status (stun) | jumps to up to eight targets, weaker each jump; in water it reaches everything in the water | branching bolts, each jump a beat behind the last (S3) |
| 33 | Ball Lightning | II | Plasma Coil | seek (slow) · chain | a slow orb that drifts and lashes everything within 4 m | a violet sphere, its tendrils feeling for targets (S3) |
| 34 | Thunderhead | V | Plasma Storm, Zodiac | call · chain, field: cloud | a small storm cloud that follows the fight for 9 s and strikes the most agitated creature every 1.5 s; heavier in Fury weather | a low black cloud with its own rain, the strike from it white (S3, M10) |
| 35 | Lightning Rod | I | a conductor | bolt · status (mark) | the creature hit draws your misses to it, and any arc nearby jumps to it | a copper glint on the body; bent shots curving into it |
| 36 | Faraday Cage | III | Shield Charger, inside out | deploy · status (halt), field: wall | a cube of arcs traps what is inside; touching the bars shocks | a box of standing lightning, its edges humming (S3, M4) |
| 37 | Capacitor | II | the charge | beam · type | held in the chamber, it charges: the longer, the bigger; full, a 20 m pillar of lightning | a column from the sky to the point, the screen whitening a frame (S3) |
| 38 | Static Cling | II | magnetism | bolt · status (slow) | the creature hit pulls loose pots, crates and shards to it; they stick and weigh it down, each one a hit | props flying in and sticking, sparking where they meet |
| 39 | Lodestone | II | the grapnel's need | bolt · world | sets a magnet in mid-air or on any wall: a point the Sondelass's hook can bite, anywhere | a floating iron star, the hook's mark ringing it. A traversal shell |
| 40 | Twelve | III | Outlaw Star #12 | bolt · status (sleep), dispel | an electric blast that knocks out anything with a mind it touches and stops anything that runs (lamps, movers, turrets) for 10 s | a gold shell with a blue kanji; lamps die in a ring as it spreads (S3) |

### TYPE-41 to TYPE-50: Pull (space and portals)

| no. | label | tier | from | recipe | does | the look |
|---|---|---|---|---|---|---|
| 41 | Inhaler | II | Suck Cannon | cone · pull | hold to suck up to five small creatures or props into the chamber; the next shots fire them out as rounds | a vortex at the muzzle; what it takes shrinks into the chamber with a pop |
| 42 | Slingshot | II | Gravity Bomb, Vortex Cannon | lob · pull, split | a well that gathers for 1.5 s, then flings all it gathered the way you are aiming | a well that swings round and lets go, things flying out in a fan (M1) |
| 43 | Rift | V | Rift Inducer | lob · space, field: rift | a rift opens under a creature and takes it for 6 s, then drops it from above | tendrils of crude from a hole in the ground, the hole closing like an eye (S5, M5) |
| 44 | Portal | III | the portal gun | bolt ×2 · space, field: rift | fire two: a linked pair of rifts that anything passes through (the Courier, shots, creatures) | two ovals, each showing the other's view, rimmed in crude (S5, M5) |
| 45 | Upfall | V | gravity flip | lob · mass, field: column | gravity reverses in a 6 m column for 5 s: everything falls up, then down | dust and drops falling up; a faint pillar of inverted rain (M8) |
| 46 | Balloon | I | weightlessness | bolt · mass, status | the creature hit loses its weight and drifts on the wind for 6 s, an easy juggle | the body bobbing, a balloon's squeak (M8) |
| 47 | Leadweight | I | the reverse | bolt · mass, status (slow) | crushes the creature to the ground: no jumps, half speed; a prop hit cannot be moved | the ground dimples under it; dust settling (M8) |
| 48 | Moonlet | III | orbiting shields | self · pull | a little moon orbits you; projectiles that come near are caught in its orbit and thrown back with your next shot | a grey moon with its own crater shadows; caught projectiles circling like rings |
| 49 | Swap | II | the swapper | bolt · space | you and the point hit trade places (a creature, a prop, a wall's face) | two pale silhouettes left behind, folding shut |
| 50 | Shrinker | II | the shrink ray | bolt · mass | the creature hit shrinks to a third for 8 s: you can carry it and throw it | the body scaling down with a whistle; its voice pitched up (M8) |

### TYPE-51 to TYPE-60: Clock (time)

| no. | label | tier | from | recipe | does | the look |
|---|---|---|---|---|---|---|
| 51 | Stasis | III | time stop | lob · time, field: zone | a sphere where time stops for 5 s: creatures, falling things and shots inside hang | the sphere drained of colour, its edge a glass bubble (S2, S7, M6) |
| 52 | Slow Field | II | slow time | lob · time, field: zone | a sphere at a quarter speed for 8 s | the same, half drained; motion blur smeared long (S2, S7, M6) |
| 53 | Overdrive | II | haste | self · time | for 6 s your tools fire and swing faster (never your body: the core movement is untouched) | a ticking on the beat; your tool's trails doubled |
| 54 | Rewind | III | rewind | bolt · time | sends the creature hit back to where it was 3 s ago, its last attack undone | a ghost trail running backward along its path (M9, S7) |
| 55 | Echo | II | afterimages | self · time | for 5 s every shot you fire is fired again a second later by your ghost | a glassy afterimage of the Courier (`afterimage.js`) (M9) |
| 56 | Weather Away | V | entropy | bolt · status (soft), world | the clay hit dries and cracks over 4 s: creatures soften, props crumble, paint dries and flakes | crazing spreading across the surface (S4) |
| 57 | Bloom | V | youth | lob · world, dispel | in 5 m: cracked pots mend with gold, plants grow, a slip jelly becomes a small slipling | gold kintsugi lines knitting, green rising (M12) |
| 58 | Stop-Motion | II | the metronome | lob · time, field: zone | in 8 m everything moves in steps, on the beat; your hits on the beat do double | the zone drawn at twelve frames a second, on the music (M6, S7) |
| 59 | Bookmark | II | save state | self · space | marks you; fire again within 10 s to return to the mark, your pool as it was then | a hovering bookmark where you stood (M9) |
| 60 | Last Word | III | delayed damage | bolt · type | does nothing for 3 s, then deals again all the damage the creature took in those 3 s | a ticking glyph over it; the hits replay as ghosts (M9) |

### TYPE-61 to TYPE-70: Will (Ego, Influence and Illusion)

| no. | label | tier | from | recipe | does | the look |
|---|---|---|---|---|---|---|
| 61 | Infector | II | Infector, Infecto-Bomb | bolt · charm | the creature hit fights its own side for 8 s; when it falls the infection jumps to the nearest | a green glow, a sickly bubbling round it |
| 62 | Taunt Doll | I | Taunter | deploy · decoy, blast | a twirling figurine every creature within 15 m must attack for 6 s, then it bursts | a spinning painted doll, ringing a little bell (M4) |
| 63 | Double | II | Decoy Glove, a mirage | deploy · decoy | a hologram of you that runs, ducks and fires blanks; creatures chase it | scanlines, a flicker when it turns (S8) |
| 64 | Pottify | II | Morph-O-Ray, Sheepinator, Qwack-O-Ray | bolt · morph | the creature becomes a waddling little pot on legs for 10 s; you can pick it up (no FOE) | a puff of slip, then a pot with a startled face (M7) |
| 65 | Brainwash | III | the Brainwash mod | bolt · charm | the creature becomes your ally until the fight ends, and follows you | a halo of your glaze colour above it |
| 66 | Stage Fright | II | humiliation | lob · status (doubt) | every creature in 10 m freezes in a spotlight; their guards drop | a spotlight from nowhere, a crowd's murmur (Wanda) |
| 67 | Paranoia | I | the confusion | bolt · status (confusion) | the creature hit attacks whatever is nearest | its eyes darting; question marks as glyph pops |
| 68 | Lullaby | I | sleep | lob · status (sleep), field: cloud | a cloud of drifting notes; creatures inside sleep | notes in the Crucibelle's scale, played as they drift |
| 69 | Mind Swap | III | the body swap | bolt ×2 · space (minds) | two creatures hit in turn swap minds: a slip jelly thinks like a clapperjar, and the reverse | two threads of light trading places between the heads (M11) |
| 70 | Forget Me | II | the forget status | bolt · status (forget) | the creature hit forgets you exist for 10 s | you fade to it: a grey fog over your body in its eyes |

### TYPE-71 to TYPE-80: Company (summons and things set down)

| no. | label | tier | from | recipe | does | the look |
|---|---|---|---|---|---|---|
| 71 | Shabti | II | Synthenoid | lob · summon | three little clay servant figures climb out and fight for 20 s | Egyptian shabti in blue faience, marching in step |
| 72 | Agents | II | Glove of Doom, Agents of Doom | swarm · blast | a ball bursts into six small clapper agents that run at creatures, latch on and burst | tiny clappers with fuse tails, giggling |
| 73 | Drone Halo | II | Drone Device | self · summon | three kiln-fired drones orbit you and shoot what you aim at for 15 s | small round kilns with glowing mouths |
| 74 | Turret | II | Mini-Turret Glove | deploy · blast | a squat terracotta turret that shoots for 20 s | a kiln-shaped turret, its door the muzzle (M4) |
| 75 | Hydra | III | Spitting Hydra, Tempest | bolt · lock-on, seek | locks up to six creatures in view and sends a lance at each | six heads uncoil from the muzzle (the lock-on reticle on foot) |
| 76 | Holowall | II | Holoshield Glove | deploy · field: wall | a hex wall of hard light; blocks projectiles and throws back any it can parry | hexes in your glaze colour, cracking where struck (S2, S8, M4) |
| 77 | Barrier | III | Shield Charger, Tesla Barrier | self · field: dome | a dome round you for 6 s: blocks everything and shocks what touches it | a glass dome, arcs crawling over it (S2, S3) |
| 78 | Golem | V | the golem | lob · summon, world | a 3 m golem rises from clay or painted ground and fights for 30 s | the ground heaves into a body; its eyes two kiln glows (M12) |
| 79 | Minefield | I | Mine Glove | deploy · blast | scatters six proximity mines in a ring; each arms after a second and bursts when a creature comes within 2 m | little glazed domes blinking in your glaze colour, faster as a creature nears (M4) |
| 80 | Marionette | III | Agents of Dread, a puppeteer (Possession) | bolt · summon | a creature you have just downed stands back up on strings of light and fights for you for 20 s, then falls for good | threads from the sky to its joints, its head lolling, moved like a puppet |

### TYPE-81 to TYPE-90: Feelings (only this game has these)

Each needs its feeling known (FEELINGS-AWAKENING.md), as the brush does.

| no. | label | tier | from | recipe | does | the look |
|---|---|---|---|---|---|---|
| 81 | Wonder | II | the vantage | lob · feel, status (halt) | the sky opens over 20 m: creatures stop and stare for 4 s, and every signature within 40 m is shown | an aurora overhead, frost motif on the ground (Wonder's heavy look) |
| 82 | Mirth | II | the pratfall | lob · feel, status (stun) | creatures fall over laughing, props bounce, the folk nearby laugh | confetti in Mirth's dots |
| 83 | Desire | II | the lure | lob · feel, pull | every creature, loose cube and drop of Lachryma in 20 m drifts toward the point | ripples on the ground, a warm pull of light |
| 84 | Fury | II | the berserk | bolt · feel | the creature hit is enraged: it deals and takes double, attacks recklessly, its EmO at the top | cracks of red across its body (Fury's motif) |
| 85 | Gall | II | nausea | lob · feel, field: cloud | creatures inside retch and stop over and over; their Lachryma sours into Gall | a curdled cloud in Gall's curds |
| 86 | Grief | II | the weeping | bolt · feel, status (slow) | a small cloud follows the creature and rains on it; slowed, it weeps Lachryma you can drink | streaks of Grief's rain under one cloud |
| 87 | Dread | II | the dark | lob · feel, status (flee) | the lights in 15 m go out and every creature flees the point | shadows lengthening, Dread's marbling across the ground |
| 88 | Agate | III | the agate | bolt · feel ×2 | fires the two feelings you last drank at once: the stronger acts, the weaker colours it (`agateOf`) | a banded stone round, two colours swirling |
| 89 | Calm | V | Outlaw Star #3 and #5 (the dispel) | beam · dispel | clears every status, summon and field in 8 m, and the weather there to fair for a game hour | a red beam that leaves the air clear and still |
| 90 | Prismatic | III | the wheel of feelings | bolt · feel ×7 | a rainbow round: each creature it touches gets the feeling it is weakest to | all seven colours in a spiralling band |

### TYPE-91 to TYPE-99: Caster's own (tier IV: the toll is paid in the vessel)

| no. | label | from | recipe | does | the look |
|---|---|---|---|---|---|
| 91 | Zodiac | Zodiac | call · lock-on, blast | marks up to twelve creatures in view; a beam of starlight falls on each | the sky goes to night over the fight, the constellations drawn as the beams fall (M10) |
| 92 | RYNO | the RYNO I to III | swarm · seek, blast | a volley of twenty-four homing rockets | the volley spirals out (`itano.js`'s circus); the cue jumps to its climax for the volley (Wanda) |
| 93 | Visibomb | Visibomb Gun | steer · blast | the camera rides the shell for 8 s; fly it anywhere, F to burst | a fisheye view with scanlines, a timer in a ring, the world tinted (M3, S8) |
| 94 | Inside Out | Outlaw Star #4 | lob · pull, space | a small black hole: the creature is turned inside out and gone; on a FOE, it tears off a whole stage of its armour | lensing round a dot of nothing, the body unravelling into it (S6) |
| 95 | Leyline | Outlaw Star #9 | bolt · space | a black hole opens and throws the creature straight up into a starry void; it falls back from 30 m four seconds later | a pillar of stars from the ground to the sky (S6, M10) |
| 96 | Thirteen | Outlaw Star #13 | beam · type (all five) | a gold-and-green bolt the size of a house, through everything to the horizon. **If what it hit lives, it backfires: you shatter** (Gene's last shell against Hazanko) | the screen goes white with the bolt; the green kanji burns on the view for a beat |
| 97 | Corrupt | .hack's data drain | bolt · morph, status (confusion) | the creature is corrupted: drawn in glitch, its body and mind scrambled for 6 s, then it is deleted (no FOE: it is wrenched a stage instead) | the glitch on one mesh, its polygons tearing (S10). Contained: nothing it does reaches the save |
| 98 | God Hand | the god hand | lob · space | the god hand reaches into the third person: a giant hand grabs whatever is where the shell lands and throws it where you aim | the hand descends through a hole in the sky, the hand's slam and throw |
| 99 | The Fool | the game's name | bolt · ? | a random shell of the ninety-nine, at double strength; the Lockheart's wheel spins on the round as it flies | the wheel of odds on the shell, its landing in the cue (Wanda) |

## 4. The rules for all hundred

1. **A shell is data.** Every row is a recipe in `CASTER_SHELLS` (`src/progress/combat/castershells.js`, mine: all hundred, their
   tiers, recipes and numbers; 22 common, 44 uncommon, 16 rare, 9 the Caster's own, 9 World) read by one runner (Petra's), so a new shell is a row
   once its parts exist. A shell's worth is its tier's already (`worthOf`).
2. **Every outcome carries `by`**, and the log says what a shell did, once, in a line (no pop-ups). Achievements read the ledger:
   `shell.fire.<id>`, `shell.kill.<id>`; "A Shell of Each" (lg6) counts all a hundred, so it becomes a Grandmaster.
3. **The core movement is untouched.** No shell changes how the Courier runs, jumps or climbs (Overdrive is the tools only; Upfall
   and Balloon act on what is in their column, the Courier included only as anything else would be).
4. **The FOE and Charybdis are never removed outright.** Morph, Inside Out, Corrupt and Pottify wrench a stage instead.
5. **Nothing reaches the save** but counts and the kit (Corrupt, Rewind and Bookmark are play, never state).
6. **Each shell teaches one thing**, where it can (Glassmaker's sand and heat, Capacitor's charge and release, Lodestone's magnet, the
   Feelings' weathers).

## 5. Build order (each batch is shells the parts already make)

1. **The runner and the table** (Petra; Dovina the table): the existing eleven move onto rows. Then everything that needs no new part:
   11 (without the chain), 12, 14, 16, 18, 21, 24, 25, 28, 35, 38, 41, 46, 47, 53, 56, 61, 62, 64 (body swap later), 66, 67, 68, 70,
   72, 81 to 87. About thirty shells.
2. **The parts** M1, M2, M4, M8, M10: 13, 19, 22, 23, 29, 31 to 34, 36, 42, 45, 50, 74, 76, 77, 79, 91, 92. About twenty.
3. **The shaders** S1 to S9 (Calissa), with M5, M6, M9, M12: the Clock, the portals, the made things.
4. **The Caster's own** (M3, M7, M11, S6, S10) and the toll. Last, because they are the rarest and the loudest.

**As built** (Petra, v168, 2026-10-12): all hundred fire; M1 to M12 are the runner's parts (`shellsplitchain.js`, `shelldeployables.js`,
`shellbodies.js`, `shellspacetime.js`, `shellcastersown.js`, `shellkit.js`); the toll is `game.vesselDamage.toll` (the least-cracked
part to 0.6, past the shield; the shatter begins with three cracked). A FOE (any creature of class 1 or more) takes a fixed blow
instead of removal: Inside Out 30, Leyline 20, Corrupt 20, Rift 10, God Hand 10, Pottify 8.
- **Petra's numbers where the table was silent** (mine to move): a chain jumps 8 m (the Lightning Rod's pull 10 m); Upfall's column
  10 m tall; Glassmaker's sheet lasts 40 s; a portal passes within 1.1 m; Brainwash ends 8 s after no foe is near; Capacitor charges
  while it is the selected shell; The Fool doubles power and count.
- **Not built yet:** Flamer's baking of paint, Bloom's mending and growing, Calm's weather to fair (no weather override exists),
  Twelve's lamps, Shrinker's carry.
- **Unverified:** balance and feel (one crash pass: all hundred fired twice, no page errors). The owner's play is the test.

**Still too weak in feel** (the owner, 2026-10-13, after v171's buff: "might be a more VFX oriented thing ... borderline ludicrous
effects; for instance Meteor's projectiles being about 200% bigger, and follow up with a mega 500% Meteor after a delay"). So the
power is now in the look and the hit, not the numbers:
- **Meteor (22)** as the owner said: its three meteors at three times the size, then one mega meteor five times the size 2.5 real s
  later (`n.size`, `n.mega` in the row).
- **The ludicrous ten** (Calissa's looks, Petra's hit-stop and camera): Meteor, Mallet, Hailstorm, Thunderhead, Slingshot, Volcano,
  Zodiac, RYNO, Inside Out, Thirteen. Each gets at least one of: 2 to 5 times the scale, a hit-stop of 3 to 8 frames, a camera punch or
  shake, a shockwave ring on the ground, debris that stays a while. The rule of thumb is Ratchet & Clank's: the screen should look
  like the weapon is too big for it.

## 6. Ruled (the owner, 2026-10-12)

1. **Thirteen's backfire stays:** if what it hit lives, you shatter ("we like a little kakegurui around here").
2. **The toll stands as written:** a tier IV cracks a region and the fourth with three cracked shatters you; not too harsh, since the
   cracks mend as the vessel's do when you ease off spending Lachryma.
3. **No shell summons a sibling or a spirit:** the party and the Spirit Garden are their own systems. Spirit Call and Sibling Flare are
   cut; 79 is now Minefield and 80 Marionette (a downed creature, never a bound spirit).
4. **The Slip shell is the Paint shell** (TYPE-07), after the paint overhaul.
5. **The Well shell is the Singularity** (TYPE-02), since a Well is the dungeon (the owner, 2026-10-12, on Dovina's call).
6. **Shell achievements:** A Shell of Each (lg6) is the founding eleven; Full Rack (shc) is every kind the psygun can chamber, so
   Master (tier 5), its goal growing with each batch (42 with batch 1).

## 7. Tier V, World: paid by the place (the owner, 2026-10-24, through Calissa; Dovina's rules)

The Caster's own are paid by the self (the toll). World shells are paid by the place. They draw ambient Lachryma and change the
place for a while, and every change reverts. Rules: `progress/combat/worldshells.js` (mine). The draw, the alterations and the looks:
Calissa's new modules. The dry click and the hook in the runner: Petra's (`shells.js`).

### 7.1 The draw
- **Where.** Within 12 m of the aim point, measured at the trigger. For a lob, the aim point is the predicted landing (the lob's arc
  mark). The cylinder's plate shows the draw as a fill while the shell is under the hammer: what it would draw now, against its need.
  That is the second avenue beside the log.
- **What, in draw units** (`DRAW.units`). 1 unit is a full need-1 shell:
  - Paint or crude: 0.25 a m² at full, so 4 m² of full paint is one shell (Calissa's default).
  - A full-grown blot: 1.5. A younger blot counts by its stage.
  - A slick: 0.25. A loose bauble: 0.1.
  - The weather: 2 × its strength, so a strength-0.5 weather is 1 unit. It counts only in the open, where the weather's look falls.
    In a Well, the weather drawn is the Well's own (`placeOf`).
  - Liquid Lachryma (the Weir's pools, the Emocean's shore, a Rift's spring) fills any shell to its cap and is never drawn down.
- **How much.** The shell draws up to 1.5 × its `need` (the cap). Power k = drawn ÷ need.
  - The row's power, radius, size, height, count and drop are scaled by k (`scaledN`). Durations are not.
  - Under k 0.25 the trigger dry-clicks, the round is kept, nothing is taken, and the log says "Too little Lachryma here."
- **Order.** A row's preferred source goes first: Calm takes the weather first. Then every other source gives the same fraction of
  itself. A source is never emptied for a shell that is already full.
- **The colour** is the feeling drawn most, as an agate's (stronger is what happens, weaker its colour). Crude carries none.
- **The price.**
  - What was taken is gone: paint and crude wiped by the fraction taken, a blot taken whole is mopped (and counts as one).
  - The place is drawn thin for 1 game hour. The weather within 12 m is weakened by the fraction of it taken, easing back over the last
    quarter, and it shows where it bites (the streaks thinned, Calissa's look).
  - A second World shell fired there finds less. That is the anti-spam, and it needs no cooldown.
- **Every alteration is a timed modifier that reverts** (base change bad):
  - glass melts back to sand;
  - raised matter crumbles back, as the god hand's creations do;
  - a softened wall closes, and anything inside is pushed out to the nearest free side (the rescue, counted);
  - the weather returns.
  - Nothing reaches the save but the counts.

### 7.2 The nine (each keeps its family and number; `tier: 5`)
| no. | label | need | as World |
|---|---|---|---|
| 26 | Glassmaker | 1 | the sheet of fused sand sized by the draw; melts back after a game hour |
| 29 | Volcano | 2 | a real cone of the island's matter (`godhand/matter.js` where the ground is explored; a creation's voxels elsewhere) that erupts, then slumps back |
| 34 | Thunderhead | 1.5 | its cloud fed by the weather drawn; at the cap it is a true storm cell |
| 43 | Rift | 1 | the rift takes its creature as before; after it closes, the hole stays a **spring** of liquid Lachryma for a game hour, a draw source at the cap for the next World shell (the one World shell that gives a place Lachryma back) |
| 45 | Upfall | 1 | the column lifts the ground's loose matter too (sand, pots, paint as drops) |
| 56 | Weather Away | 1 | erosion over a place: things tagged `erodible` (`core/tags.js`) soften and a way opens through them, closing again after a game hour. Never a room's walls |
| 57 | Bloom | 0.75 | the drawn Lachryma grows a thicket and mends pots in gold (the never-built Bloom, built here) |
| 78 | Golem | 2 | risen from the matter, its size by the draw, crumbling back after its 30 s |
| 89 | Calm | 1 | the weather drawn first; within 12 m it is fair for a game hour (the override that was never built, as a local modifier) |

**Changed from Calissa's nine: Flamer (21) stays tier I.**
- It is one of 22 commons, the cheap, reliable fire cone. As World it would fire once a find.
- Its baking (paint into ground you can stand on) is its own row's `world` payload. It belongs in the alterations kit at tier I scale:
  short-lived, small, no draw.
- Rift (43) takes its place, because a World shell that gives back a source closes the loop.

**Numbering: the numbers stay.**
- Tiers I to III already run through every family; only IV is a block, because its family is the tier.
- A World shell's identity is its family: Glassmaker is Ember's sand and heat, and its look lives in `vfx/shelllooks/ember.js`.
- TYPE numbers are in the plan, the owner's memory and QAIS reports.
- So World is a tier, not a family. The Feelings keep 81 to 90; Calm stays 89.

### 7.3 Where they come from (a faucet of power, not cubes)
- **Every 12th full-grown blot you mop up gives a World shell** (`DUE_EVERY`), the one of the nine you have found fewest of, so a
  collector meets all nine.
  - It is a sure count, never a roll: Nook Miles' stamp card, the house's pity made plain.
  - It is read from the ledger (`stain.wash.grown` against `shell.world.found`), so a reload never gives twice.
  - Mopping blots had no reward but the blotling it prevents; now it has a reason.
- Never sold. Worth 400, for the Codex, as a tier IV.
- **Unmeasured:** the rate at which blots are mopped. The guess is about 8 an hour when hunting, so one World shell every 1.5 real
  hours. `scripts/economy.mjs` gets the row once `stain.wash.grown` has a measured rate, and `DUE_EVERY` moves then.

### 7.4 The ledger and the achievements
- **Events.**
  - `shell.found { id, tier: 5, from: 'blot', by }` (`WorldShellFinds`).
  - `shell.draw { id, k, need, drawn, feeling, from: { <kind>: units }, by }` (Calissa's draw, at the trigger, after `shell.fire`).
  - `shell.dry { id, by }` (the dry click).
- **Ledger** (`tracking/worldshells.js`): `shell.world.found(.<id>)`, `shell.world.fire`, the record `shell.world.k`,
  `shell.world.from.<kind>`, `shell.world.dry`.
- **Achievements** (BREAKING · Shells):
  - wd1 *Drawn Thin* (Medium): fire one on a draw.
  - wd2 *Downpour* (Hard): a draw at the cap, 1.5.
  - wd3 *The Place Is the Price* (Elite): fire each of the nine.
  - Full Rack already counts them as kinds.

### 7.5 As built (Calissa, claude/calissa-art-cups d428d56b; the dry click in shells.js)
- **Built:** the draw, the thin look and patch (`game.worldDraw`, its `weatherK(pos)` read by `game.weather.here()` and so by every rule
  that asks the weather there), the alterations, Rift's spring, and the cylinder plate's draw fill. Measured headless by Calissa: all nine
  fired on a draw, `shell.draw` carried k, feeling and from, later draws filled from a spring at the cap, Calm took the weather to 0.
- **Not yet:**
  - **`erodible` tags.** Nothing carries one, so Weather Away opens nothing yet. What may carry it: the god hand's creations, the
    Dunes ruins' broken walls, a Well floor's clay baffles. Never a room's bounding walls, a floor, or anything a sweep's route needs.
    The tags are set where those things are built (Petra's).
  - **`game.breakables.mend(at, r, { gold, by })`** (Petra's `world/props/breakables.js`). Bloom grows its thicket and mends nothing
    until it exists.
