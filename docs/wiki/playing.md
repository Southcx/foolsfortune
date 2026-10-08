# Playing: starting, keys, moving, your clay body

You play the Courier, a clay traveller. This page covers how the game starts, every key, how you move, the Movement Arts you learn
by doing, and how Lachryma (your energy) also works as your shield. Read it first; the other pages assume it.

## Starting

The game opens on **THE FOOL'S PRECIPICE**: you stand on a hill above a checkerboard sea. Press start and you step off. The menu
appears while you fall.

| Choice | What it is |
| --- | --- |
| STORY | not on the menu yet. When it returns, the Movement Arts are learned by doing |
| DEBUG | the sandbox. The all-arts switch is on (every art is lent to you), chests reopen in seconds, `/grant` adds cubes |
| SETTINGS | your preferences |
| SOUND TEST | plays the game's music tracks |

**Progress belongs to the build.** The first time a new build runs, your unlocks, ledger, achievements, Veritome memory and Book, Pneuka
Box and map are cleared. The log tells you. Settings are kept.

## Keys

| Key | Does |
| --- | --- |
| W A S D | move |
| Shift | sprint (any direction but backwards) |
| Alt | walk slowly |
| Space | jump; again in the air, a double jump; beside a wall with W held, a wallrun, then Space for a wall jump |
| C | crouch; at a run, slide (jump out to keep the speed); in the air looking down, slam |
| Shift in the air | air dash (costs Lachryma, once per airtime) |
| Shift while crouched | roll, a dodge you cannot be hit during for its first third |
| E | blink (a Movement Art) |
| F | interact (the chevron marks what F acts on): open a chest, talk, pick up, strike a gong, use a console; hold to push or pull a crate |
| V | kick; its first moment parries a projectile. With the Sondelass cutlass out, guard |
| Right mouse button | aim down sights (a tool out may use it for its own job) |
| Z | first or third person |
| O | swap shoulder (third person) |
| X, Q, G, J, K, U, I | draw or stow a tool: Psygun, Sondelass, Soul Brush, Veritome, Dreamvane, Crucibelle, Lockheart |
| ~ | become the god hand, and back |
| Y | in the Dunes, summon or stow the skiff |
| M | the map (N sends a survey pulse, from the god hand) |
| B | the Codex (pauses) |
| P | the Pneuka Box, your inventory (pauses). With the Veritome drawn, the bank opens beside it |
| Enter or / | the chat line: say something, or type a command (`/help` lists them) |
| \ | fold the log to its tabs. PgUp and PgDn scroll it; [ and ] change tab |
| Tab | the tuning panel and its actions: set the room again, return to the last checkpoint, teleport to the hub |
| Esc | the pause menu and the help pages (keys, core movement, arts, climbing and water, one page per tool) |
| F2 | hide the interface (cycles: everything, the frame of a shot only, nothing) |
| F3 | the diagnostics panel; press again for physics lines and what nearby creatures are thinking |
| F8 | QAIS, the testing window (see below) |

**QAIS** holds this build's Brief, your QAIS tests, the reports you file and open questions. The frame is taken as you press F8, so you
can draw on it and say what is wrong. Esc closes it.

What each tool does with the mouse and number keys is on [The tools](tools.md) and on its help page.

## Moving

**The core movement** is built like Titanfall's. It is the gold standard: nothing added to the game changes it, and switching any
addition off gives it back exactly.

| Number | Value |
| --- | --- |
| Walk, sprint, slow walk | 4.2, 6.8 and 1.8 m/s |
| Top speed on foot (hard cap) | 14 m/s |
| Air jumps | 1 (refilled on the ground and on walls) |
| Wall stepped over without slowing | up to 0.55 m |
| Ledge you mantle onto | from 0.45 m (a standing jump into a ledge of 0.75 m or more) |
| Wallrun | up to 9.5 m/s, 1.8 s |
| Slide | a boosted slide starts at 9.5 m/s or more; the boost comes back after 1.6 s |
| Air dash cost | 12 Lachryma |

Air steering never bleeds speed above a run, and a fast landing eases off. The speedometer shows your speed and move (it comes up
with the F3 panel). All the numbers are under `movement` in `src/core/config.js` and live in the Tab panel.

**The body's moves** come with having a body: swim (C dives, Space surfaces and hops out), ladders, ledge hangs and shimmies,
overhead bars and ziplines, poles and ropes, grate walls and ceilings, balance beams, carrying (F picks up with both hands, a click
throws), pushing and pulling heavy crates (hold F), and the kick.

## Learning the Movement Arts

Each **Movement Art** is learned by doing something you can already do. Each has variants that ask more. The Codex (B, MOVEMENT ARTS)
shows what you know and how far you are from the rest. With the all-arts switch on, every art is lent to you but not counted.

| Art | Learned by | What it does | Variants |
| --- | --- | --- | --- |
| Blink (E) | 20 air dashes | a near-instant 5.5 m dodge along the move keys that keeps your speed; 2 charges, one back every 1.8 s | Rush Blink: 8 m, slower to recharge. Flicker: 3 charges of 4 m |
| Slam (C looking down in the air) | 3 drops of 12 m or more | dive straight down from 1.8 m up; breaks and throws what is near. Then Space: slam jump; C with a direction: slam slide | Quake Slam: wider and harder. Super Slam: a huge shockwave, from a slam onto a moving target from 50 m up |
| Roll (Shift crouched) | 3 drops of 20 m or more | an invulnerable dodge; out of a fall of 20 m or more it turns the fall into speed | Tumble: rolls out of falls of 12 m |
| Stomp | 25 pots broken | land on a pot or clapperjar: it breaks and throws you up, air jump refilled | Spring Stomp: a higher bounce |
| Slip Dive (C on slip) | 6 slip splats | melt into the slip: a fast blob (10 m/s) that climbs slip-coated walls and fits narrow gaps | Tide: faster, higher launch |
| Wall Latch (C in the air beside a wall) | 6 ledge or bar hangs | cling and crawl along the wall for 2.2 s | Iron Grip: 3.6 s, faster |
| Kick and Parry (V) | 15 pots broken | the kick's first quarter second sends a projectile back where you look | Counter: a wider parry window |
| Recoil Jump | 15 shots fired in mid-air | shoot down in the air and the gun's kick lifts you; 3 a jump | Boost: 4 a jump, harder kick |

## Lachryma, the shield and the cracks

**Lachryma** is your energy and every tool's fuel. Its gauge is on the HUD. After 2.2 real seconds without spending, it refills at
3.5 per real second. The rest comes from **baubles**, gummy drops that pop out of clapperjars, lanterns and marked pots and fly to you
when you come near. A bauble left lying turns to liquid Lachryma and then sinks away. Clapperjars eat the ones they find.

**It is also your shield.** A blow is paid from the pool first. Whatever the pool cannot pay **cracks the clay** where the blow lands.

| Fact | Value |
| --- | --- |
| Crack regions | 6: the mask, the torso, each arm, each leg |
| A region starts to mend after | 6 real seconds without a new blow |
| Mending rate | 2.5% of the region a real second (about 40 real seconds from full) |
| Quick mend | at the kiln (MEND), for cubes |
| A blow on clay cracked through | you shatter |

When you shatter, time all but stops, the cracks run over your whole body burning with Lachryma, and you burst. You are made whole
again in the workshop: cracks gone, pool full. Nothing is lost.

## For the divisions

- Keys and input: `src/main.js` (global keys), `src/core/input.js`, `src/tools/belt.js` (tool keys)
- Core movement numbers: `movement` in `src/core/config.js`; the player: `src/courier/player.js`; techs: `src/courier/moves/`
- Movement Arts and their goals: `src/progress/skills.js`; the title menu: `src/title/ui.js`
- The pool: `src/courier/lachryma.js`; cracks and shattering: `src/courier/vessel/damage.js`, `death.js`
- Not checked in code: the Lachryma gauge's exact HUD location; whether 0.8 m is still the Slip Dive gap width (the page says "narrow gaps")
