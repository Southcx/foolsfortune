# Playing: starting, keys, moving, the vessel

> First pass: moved whole from the old README (2026-10-08). Each page is being rewritten to `docs/plans/CLARITY.md`'s rules: plain
> words, what it does first, numbers as stats. The full definitions of terms are in `docs/GLOSSARY.md`.

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
