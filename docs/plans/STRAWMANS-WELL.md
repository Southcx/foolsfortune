# Strawman's Well: the 2D platformer's test bench

South, 2026-10-31:
- "design another Well within the WORKSHOP that is our test environment for the ultimate distillations of the 2d platformer genre. Use the
  Strawman as your muse. I want you to design and build every interaction verb present in the genre you can think of."
- "Elsword, Tomba!, I wanna be the guy, VVVVVVV, Spelunky, Super Smash Bros Brawl: Subspace Emissary ... underscore that last title."
- "things like fluids could be calculated on a 2d plane instead! You can and should use existing god powers, but never be afraid to
  expand the seven domains as you see fit, provided you take care not to have them overlap."
- "The Hercules PS1 game also probably has some incredible visual references! That first level is REALLY good to look at."

This is the first genre floor (ENDGAME.md 3.2) built as a test environment.

| part | where |
|---|---|
| rules | `src/progress/strawmanwell.js` |
| the room | `src/world/strawmanwell/` (the Sandbox's pattern) |
| looks | Calissa's |
| sounds | Wanda's |
| words | Espada's (all names below are placeholders) |

## 1. In the world: a mind that is a theatre

**Where it is.** Strawman stands at the sparring circle in the Throwing Room. Strawman's Well is the inside of its head, entered as
Psychonauts' minds are, and from the Index for testing (THE HAND, beside the Sandbox).

**Why it is side-on.** A dummy's mind is a rehearsal. Strawman's head holds a toy theatre (a paper theatre, Pollock's), and a theatre is
seen from the front. So the plane is the stage's boards, the camera is the audience, and the backdrops are painted flats hung in depth.
This is the visible source the design laws ask for: the plane is a modifier you can see.

**The look** (Calissa's brief):
- A toy theatre built from Pip's sewing kit at giant scale: spools as platforms, pins and needles as spikes, thread as ropes and vines,
  burlap flats, buttons on strings, a pincushion hill, tailor's chalk lines on the boards.
- Hercules (PS1, 1997, its first stage) for the painted parallax: three or four flats deep, rich and warm, the far ones hazy.
- Straw blowing across, and stage lights on the flats.

**Strawman as the muse:**
- **The guide.** Strawman runs each stage first as a ghost of straw (the mimicry puzzles' demonstration, MIMICRY.md), then you go.
- **The rival.** It races you on the gauntlet's ghost line.
- **The crowd.** Its fellow dummies are the stage's foes and the Troupe's walkers.
- **The boss.** A giant marionette of itself, worked by strings from the fly loft (Subspace Emissary's set-piece bosses).

Strawman never falls and is never counted; that stays true. Its dummies are its own creatures and are counted as this Well's.

**Its quest** (QUESTS.md, Espada's to write): Strawman is the one thing in the workshop made to be hit and never to fall. Its theatre
rehearses being struck, over and over. The quest helps it play a different part.

## 2. The frame: a plane, the camera and the forms

**The core movement is untouched.** The Well adds three modifiers and takes them away on leaving:

1. **The plane.** The body is held to the stage's depth: after each fixed step its depth is set back to the lane's and its depth
   speed to zero.
2. **The camera.** It looks at the stage from the front, eased along the run with a little lead ahead of the body (Celeste's,
   Hollow Knight's), and holds still in a flick-screen room (VVVVVV's).
3. **The keys.**
   - A and D run left and right; the body turns to face its run, so the core movement's own forward drives it (mantle, step-over,
     slide and wall run work as they do anywhere).
   - W is up (a ladder, a door, aiming up, a lane behind); S is down (crouch, a ladder down, dropping through a thin platform, a lane in
     front).
   - Space, the dash, C and the tools keep their keys.

**The forms:**
- **The Courier:** the whole kit.
- **Your Pneuka Jar:** small, hopping, rolling through what the Courier cannot (Metroid's morph ball, Kirby).
- **The god hand:** over the stage (~), working the stage's matter and carrying the Jar (Kirby: Canvas Curse, Lemmings, From Dust).

## 3. The verbs, by stage

The hub is **the wings**, the backstage. A door per stage, each with its stars, and Strawman centre stage. Every stage is one short
room testing one family of verbs. Prior art is named for each. "Kit" says what it is built from; **new** is a room-side mechanic.

### 3.1 The Run: moving on the plane
| verb | prior art | kit |
|---|---|---|
| run, sprint, walk | Mario | the core movement |
| variable jump, coyote time, jump buffer | Mario, Celeste | the core movement |
| double jump | Kid Icarus, Smash | the core movement |
| dash, air dash | Mega Man X, Celeste | the core movement |
| slide | Mega Man 3 | the core movement |
| crouch, crawl under | Metroid | the posture |
| wall jump | Mega Man X, Super Meat Boy | the core movement's wall jump |
| a wall run on the back flat | Prince of Persia | the wall run, against the flat behind the plane |
| ledge grab and mantle | Prince of Persia, Tomba | the mantle |
| a thin platform: jump up through it, S + Space to drop through | Super Mario Bros 2 | **new** |
| slopes keep speed, a ramp's launch | Sonic | the slide on a slope |
| a spring, a bounce pad | Sonic, Mario | **new**: an impulse |
| ice (low grip) and Gall's goo (sticky, slow) | every platformer | **new**: the place's drift and wade |

### 3.2 The Climb
| verb | prior art | kit |
|---|---|---|
| ladders, up and down | Donkey Kong, Castlevania | the ladder |
| vines and thread to climb, swinging rope | Tomba, Donkey Kong Jr | the ladder on a thread; a swing is **new** |
| monkey bars, hanging | Bionic Commando, Tomba | the hang |
| a balance beam | Prince of Persia | the balance |
| a pole to swing round and launch from | Strider, Sonic | the pole |

### 3.3 The Stomp: from above and below
| verb | prior art | kit |
|---|---|---|
| stomp a foe and bounce off it | Super Mario Bros | **new**: a dummy's head is a spring |
| ground pound | Super Mario 64, Tomba's bounce, Wario | the Stomp art |
| pogo off foes and spikes with a downward blow | Shovel Knight, Hollow Knight, DuckTales | the Soul Brush's slam, bouncing |
| bonk a block from below for cubes | Super Mario Bros | **new**: a ? spool |
| a hidden block that shows when bonked | Super Mario Bros | **new** |

### 3.4 The Brawl: Subspace Emissary's stage (the underscored one)
| verb | prior art | kit |
|---|---|---|
| strings, dash attacks, launchers, air strings, juggles | Elsword, Smash, Devil May Cry | the Sondelass's moveset and the kick, on the plane |
| damage percent and knockback: a dummy flies further the more it has taken | Smash | **new**: the dummies' own rule (section 5) |
| the blast line: knocked past the stage's edge is a KO | Smash | **new** |
| grab and throw a dummy | Smash, Tomba, Klonoa | the carry's grab, a dummy as the carried thing |
| a trophy: a dummy past 100% captured on a plate | Subspace Emissary's trophy stands | the Veritome's plate (a plate, then a spirit slab: SEEDS-SLABS-SCANS.md) |
| a stage hazard that hurts both sides | Smash stages | the Raceway's traps, reused |
| the clear's rank, SS to D: time, hits taken, longest string | Elsword's dungeon rank | the rail's results window, reused |

### 3.5 The Arsenal: run and gun
| verb | prior art | kit |
|---|---|---|
| shoot in eight directions, shoot while running | Contra, Metal Slug | the psygun, aim held to the plane |
| a charge shot | Mega Man | the psygun's charge |
| bombs that break the ground | Spelunky, Worms, Bomberman | the Bombardier's lob, on the stage's matter (3.8) |
| boss weapons: a foe's blow learned | Mega Man, Kirby | the aberrants' learned skills, played as shells (later) |

### 3.6 The Swing
| verb | prior art | kit |
|---|---|---|
| a grapple swing: hook a point, swing, let go at the top | Bionic Commando, Spider-Man | the Sondelass's hook |
| an elastic line: reel in and out, swing wide | Umihara Kawase | the Sondelass's rod, its line the swing |
| a rope thrown up to climb | Spelunky | the Soul Brush's line of paint (3.11) |
| a zip line on a thread | many | the hook along a thread |

### 3.7 The Machine: physics puzzles on a plane
| verb | prior art | kit |
|---|---|---|
| push and pull a crate | Limbo, Inside, Mario | the push |
| a seesaw, a pulley and its counterweight | Limbo, Little Big Planet | **new**: hinged and roped bodies |
| crates that float | Inside, Limbo | the crates on the stage's fluid (3.8) |
| conveyor belts, moving and crumbling platforms | Mega Man, Mario | **new** |
| switches, timed doors, on/off blocks | Mario Maker | **new** |
| keys and locks | Zelda, Spelunky | a Possibilikey and its lock (the Lockheart) |
| cannons that fire on a beat | Mario's Bullet Bill | the Wisp turret, reused |
| carry a thing to where it is needed (the idol, the key) | Spelunky, Super Mario Bros 2 | the carry |

### 3.8 The Flood: matter and liquid on a plane
The stage's ground is a grid of cells, falling-sand style (Noita, Powder Toy, Where's My Water?), because on a plane a fluid is
cheap enough to run for real.

**What the cells can be:**
- **Sand** falls and heaps.
- **Clay** holds.
- **Lachryma** flows and finds its level.
- **Crude** flows, and burns.
- **Ice** stands.
- **Stone** is the stage's own.

**What the god hand does to it:** the matter verbs work on the grid. Scoop and Pour lift and drop cells; Carve cuts a channel; Sculpt
raises clay.

**What it is for:**
- Fill a basin to float a crate up to a ledge, or to open a sluice door.
- Drain a pit to walk its floor.
- Dig through to the next room (Lemmings' digger, Terraria).

**The domains' new reach here (one verb each, no overlaps):**

| domain | its new reach on the plane | prior art |
|---|---|---|
| Ouranurgy (the sky, space) | gravity turned over in a zone, and the Portal pair carrying speed through | VVVVVV, Portal |
| Manifestation (making) | a platform of clay made in the air | Drawn to Life |
| Divination (seeing) | the traps you have died to shown as ghosts (3.12), hidden blocks seen | I Wanna Be the Guy |
| Psychokinesis (moving) | a thing lifted and thrown by the hand, a dummy held in the air | Black & White |
| Possession (minds) | a dummy given a job (3.10) | Lemmings |
| Alteration (changing) | a liquid made solid and back: Lachryma to ice, crude to glass | the Ice Climbers' freeze, Mario's ice flower |
| Spellscription (writing) | a rule written on the stage (3.11) | Baba Is You |

### 3.9 The Flip
| verb | prior art | kit |
|---|---|---|
| gravity flipped instead of jumping | VVVVVV, Gravity Rush | **new**: a flip line, Ouranurgy's |
| flick-screen rooms, a checkpoint every room | VVVVVV | the camera's hold |
| portals that keep your speed | Portal, Portal Flash | the Portal power |

### 3.10 The Troupe: Lemmings with dummies
Strawman's dummies walk on and on. You get enough of them to the exit by giving them jobs: blocker, digger, builder, climber, floater,
bomber. The jobs are reprogramming's Functions on the Veritome's macro lattice, and the dummy is the mind. Prior art: Lemmings, Pikmin,
Little Big Planet's creatinator.

### 3.11 The Script
**Rules written on the stage** (Baba Is You). Words in neuralese stand on the boards as tiles (ostraca). Pushed into a line, they make
a rule ("WALL IS NOT SOLID", "DUMMY IS FLOAT") that holds while the line stands. Each word glossed once found. It teaches the
language by using it.

**Lines drawn to stand on** (Crayon Physics, Kirby: Canvas Curse). The Soul Brush's Celestial paper draws a stroke on the plane, and
the stroke is a platform for a few real seconds.

### 3.12 The Pit: the precision gauntlet
| verb | prior art | kit |
|---|---|---|
| spikes, saws, falling ceilings, instant retry at the last checkpoint | I Wanna Be the Guy, Super Meat Boy | **new**; a fall costs time only |
| a save point you shoot to set | I Wanna Be the Guy | **new**: a save shrine shot with the psygun |
| troll traps (the apple that falls up) | I Wanna Be the Guy | **new**; each shown afterwards as a ghost (Divination) |
| every death replayed at the end, all at once | Super Meat Boy | **new**: the run's ghosts |
| the death count kept as a record | I Wanna Be the Guy | the ledger |

### 3.13 The Jar
As your Pneuka Jar: hop, roll down slopes, fit through the Jar's tunnels. The god hand draws the path (Kirby: Canvas Curse's rainbow
line) and throws the Jar across a gap (the thrown hit's flight). Prior art: Metroid's morph ball, Kirby, LocoRoco.

### 3.14 The Depth
Two or three lanes deep, hopped between at marked spots with W and S (Tomba!, Klonoa, Virtual Boy Mario Clash). A Fez turn of the
whole stage a quarter round is a stretch, later.

### 3.15 The Chase
The giant marionette chases from the left (Rayman's, Donkey Kong Country's chases). An auto-scrolling stretch, and a rhythm run on
the Crucibelle's beat, where the platforms move on the beat (Bit.Trip Runner, Super Mario 3D World's beat blocks).

### 3.16 The Wall (later, Petra's)
The Paint Dive into a painted wall of the 3D world, coming out as a 2D stage along the wall's face (Zelda: A Link Between Worlds,
Mario Odyssey's 8-bit walls). This is the bridge that puts the genre floor into the open world.

### 3.17 The Maze (later)
The stages' rooms cut into templates and stitched each game day into one seeded run with a guaranteed path (Spelunky's 4 x 4 grid),
the endless Well of ENDGAME.md 2. Subspace Emissary's Great Maze revisited every stage this way.

## 4. Build waves

**Wave 1 (this round):**
- the room
- the frame (section 2)
- the wings
- The Run, The Climb and The Stomp
- The Brawl with the percent rule
- The Machine's crates, springs, thin platforms, conveyors and switches
- The Flood's grid with the god hand's Pour and Carve

**Wave 1 as built (2026-10-31):** all of the above, at placeholder looks (`src/world/strawmanwell/`). Not built yet from wave 1's
verbs: the rope's swing launch (the rope is climb-only), pogo, grabbing and throwing a dummy, the pulley, on/off blocks, a crate that
floats (liquids are not solid to props), raising at a lectern (only the hand's Sculpt), and Strawman's ghost guide. The cannon is a
placeholder, not the Wisp turret; the key is a plain key, not a Possibilikey. The dummies are training bodies: the Well's own events
count them, familiarity and the creature counts do not. The in-plane wall kick (Mega Man X's) is a room-side modifier
(`mechanics.js`), since the core's wall jump comes only off a wall run. Liquids: under a full stream the basin mounds 3 m and is flat
about 5 real s after the pour stops (the grid's visit rate, the phone's budget, is the limit; measured).

**Wave 2:**
- The Arsenal's terrain bombs
- The Swing
- The Flip
- The Pit's gauntlet and ghosts
- The Jar

**Wave 3:**
- The Troupe
- The Script
- The Depth
- The Chase
- The Wall
- The Maze

## 5. Numbers and their reasons (`progress/strawmanwell.js`)

**The percent** (Smash 64's knockback, simplified). A blow of power 1 to 3 adds power x 8% to a dummy, and sends it at:

`power x (2 + 0.06 x percent)` m/s, 40 degrees up.

- At 0%, a light blow nudges it (2 m/s) and a heavy one shoves it (6 m/s).
- At 60%, a power 2 blow sends it about 5 m.
- At 120%, a heavy blow sends it off at about 28 m/s, about 30 m: past the blast line from mid-stage.

The blast line stands 14 m past each edge of the stage, so a KO wants a dummy softened first, as in Smash.

**The stage's grid:**
- 160 x 90 cells at 0.25 m: 40 m by 22.5 m.
- Stepped at 30 a real second, a quarter of the grid a step. That keeps under a millisecond on the phone.

**A fall in the Pit:**
- Costs only the time back to the last checkpoint: 0.4 real s, Super Meat Boy's.
- Never a shatter: the Well is a test environment.

**What counts:**
- Each stage's clear, its stars, its rank and its time, written to the ledger.
- The Brawl's KOs.
- The Pit's deaths, kept as a record.

Achievements are rows over these.

## 6. Who does what

- **Dovina:** this plan, the rules module, the ledger and the achievements, the quest (with Espada's words).
- **The room, wave 1:** built this round with a builder (the Sandbox's pattern). Its frame's hooks go to Petra's gate.
- **Calissa:** the theatre's look (section 1), the dummies, the marionette.
- **Wanda:** the stage's sounds; a stage clear's jingle (QUESTS.md's jingle family).
- **Espada:** the names, Strawman's quest, the stage words.
