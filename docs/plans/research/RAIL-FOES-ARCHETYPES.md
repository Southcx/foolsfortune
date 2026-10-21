# Research: the crossing's foes as a complete set of archetypes (2026-10-20)
For Calissa (Art), from the owner's ask: a feature-complete set of enemy types for the three views (chase, overhead, side), each with a
clear silhouette, a readable path and a tell before it fires. Builds on `RAIL-MODULES-SHMUP.md` (sections 1.7 to 1.9 and 3.2 to 3.3 are
not repeated: windup lengths, lanes, hold-fire-exit, the Pirate Ship's part table) and on Dovina's `RAIL-MODULES.md` (rules 1 to 12).

**How sure each line is.** `[src]` a page I read this round, URL beside it. `[prior]` taken from the earlier research. `[play]` from my
memory of playing the game, no page read: check before building on it. `[own]` my inference. The web gave less than hoped: Wikipedia and
the wikis describe the games but say little about enemy readability, and Boghog's videos and Sparen's studio could not be fetched
(search found only pointers). Where a source was thin, the line is `[play]` or `[own]` and says so.

Today's roles (`src/world/emocean/waves.js`, `src/progress/rail/legs.js`): **school** (line, vee, pincer, ring; HP 1), **darter**
(dash; outlined shots at the camera; HP 3), **heavy** (hold; fan each bar, outlined each other; HP 12 and up), **carrier** ('ahead' in
`legrunner.js`), and the set pieces' parts (shoal fish and glints, gills, teeth, gunports, rigging, boarders). Patterns: aimedBurst,
homingSalvo, rotatingRing, multiSpiral, rose, mixed (oddFan), accelSpiral, doubleHelix, itano. Gaps this set fills: no ground/surface
foe, no spawner, no shield, no rammer that is not a school, no mine, no beam foe, no midboss rank between a heavy and a set piece.

---

## 1. What the sources say (short)
- **Popcorn.** "Enemies that blow up after being hit once (or very seldom)"; include them in every level; "the key here is quantity";
  they fill gaps between harder waves and reward quick kills (Radiant Silvergun and Ikaruga add them while you wait for the next
  section). Michael Molinari, The Anatomy of a Shmup, 2010: https://www.gamedeveloper.com/design/the-anatomy-of-a-shmup `[src]`
- **Telegraph in proportion.** Less for popcorn that is easy to kill and fires rarely; much more for enemies that fire fast bursts, "you
  need time to react, otherwise it wouldn't be fair" (summary of a Boshin developer's note, via search; the moddb page itself returned
  403 to me, as it did to the earlier research: https://www.moddb.com/games/rick-henderson/features/designing-enemies-on-a-budget) `[src, thin]`
- **Arrivals.** Enemies "should not fly in at full speed and fire immediately": accelerate in or wait before firing. Mark a spawn before
  it appears (Geometry Wars' particle splash). Boss arrivals get a warning, a siren, silence or a lull. Molinari (above) `[src]`
- **Hit and death reads.** Show a hit (flicker, shake, sparks), not a full white flash (hurts the eyes, worst on bosses). An
  invulnerable phase looks unchanged. Show health or make it predictable by size or visible armour; Ikaruga uses a thin bar. "Everything
  destroyed should explode"; a boss's explosion is large with a bright flash and a brief slowdown. Molinari (above) `[src]`
- **Bullets.** Always visible, over explosions and pickups; high contrast to the background (Cave's pink and bright blue; darker
  backgrounds in the black label editions); different simultaneous patterns get different bullets (colour, shape, spin); no shots
  from off-screen; "there should always be a way out". Molinari (above) `[src]`
- **Bright, slow, deadly.** Enemy shots may ignore the palette to stand out; halving their speed turned a prototype from shooting
  everything on entry into weaving through patterns. Robert Dieterich, 2012: https://www.gamedeveloper.com/design/bright-slow-and-deadly `[src]`
- **Bosses.** Split a bar into segments, one pattern per segment; a mid-boss never longer than the end boss; a boss as long as its
  stage; Cave bosses "spit out everything they are made of" as they die. Molinari, boss design, 2010:
  https://www.gamedeveloper.com/design/video-game-boss-design-for-shmups `[src]`
- **Aimed shots are the exception.** Patterns are fixed, random or aimed; "the majority of enemy bullets are sprayed wildly and are not
  aimed" (https://tvtropes.org/pmwiki/pmwiki.php/Main/Danmaku; Touhou nonspells, https://wiki.maribelhearn.com/wiki/Touhou_10:_Mountain_of_Faith/Aya_Shameimaru) `[src, weak]`

---

---

## 2. The shmups' own catalogues (the raw material)

- **DonPachi** (Cave; https://shmups.wiki/library/DonPachi/Enemy_List) `[src]`: popcorn (one hit, 70 to 330 points, "large groups
  that can trap you"); item carrier (1,200 points, ten popcorn); two-part ground foes whose rear turrets keep firing after the main
  one falls; a bunker "only destroyed once its roof turret is fully open" (the opening is the tell and the weak spot at once);
  mid planes with "an aimed line", a "7-way spread"; a sniper ("very fast sniper shots"); a parasite that "summons a second part";
  a drill whose shell comes off and "the attack intensifies"; a midboss pod ("kill the pod first"); a boss whose turrets fall before
  the core changes pattern. About nine behaviours, told apart by parts, not by new bodies.
- **Gradius** (https://strategywiki.org/wiki/Gradius/Enemies, https://gradius.fandom.com/wiki/Hatches) `[src]`: Fan (5 to 9 in a
  trail, a whole formation downed drops a capsule); Garun (pairs on a sine wave, "never leave it"; red drops a power-up); Rugal
  (slow, homes, no shot); Ducker and Jumper (ground walkers that shoot up); Hatch (the spawner: fighters until killed).
- **Star Fox 64** (https://en.wikipedia.org/wiki/Star_Fox_64, https://starfox.fandom.com/wiki/Attack_Carrier) `[src, thin]`:
  flights of four `[prior]`; Ski Bots skim the sea and hurt on contact; Garudas and Venom Tanks on the ground; Shogun warriors ram;
  the Attack Carrier is the reinforcement source; the roll deflects fire; boss fights go all-range with a U-turn.
- **KH2 Gummi** (https://www.khwiki.com/Hunter, https://khwiki.com/Cruiser, https://khwiki.com/Hex_Ring) `[src]`: 33 foes listed
  (Driller, Pirate Ship, Knight Head, Bomber, Grappler, Shield, Spider, Bomb Bell, Cyclops, Hex Ring, Phoenix, Cruiser, Core...).
  Hex Ring: a red cone, "a yellow spike light on top" (the tell), a large octagonal ring, fires a ring round the ship; HP 800, 1,500
  red, 3,600 gold (the variant is the same body at 2x to 4.5x). Mad Rider and Cruisers "don't attack"; large Cruisers drop treasure.
  More in `RAIL-MODULES-SHMUP.md` 3.2 (Bomb Bell kamikaze, Shield shot from behind, shootable cannonball, grapplers freed by a roll).
- **Panzer Dragoon Orta** (https://en.wikipedia.org/wiki/Panzer_Dragoon_Orta) `[src, thin]`: foes "approach from all directions and
  vary in size and health"; fly round some in 90-degree steps for a weak area; thick fronts, weak sides (a Spanish wiki, via
  search); the form sets how many you can lock; a wave wholly destroyed pays a Gene Base.
- **Sin & Punishment, R-Type, Rez** (https://en.wikipedia.org/wiki/Sin_%26_Punishment, .../R-Type, .../Rez_(video_game)) `[src, thin]`:
  S&P lock-on or a stronger free aim, a sword that returns projectiles, bosses that "fit the screen while still looking large";
  R-Type slow, learn the patterns, the Force pod an indestructible shield you own; Rez locks up to eight, foes are wireframe
  geometry "destroyed in groups", hits sync to the track.
- **Radiant Silvergun** (https://en.wikipedia.org/wiki/Radiant_Silvergun) `[src]`: foes are red, blue or yellow; three of one
  colour in a row chains; bosses have "segments and appendages destroyed before their weak spot", clearing all pays more.
- **Ikaruga** (https://en.wikipedia.org/wiki/Ikaruga) `[src]`: foes and bullets are black or white; same colour absorbs, opposite
  kills; an opposite-colour hit does double damage; three of one colour chain 100 doubling to 25,600.
- **Sky Force** (https://www.trueachievements.com/game/Sky-Force-Reloaded/walkthrough/3) `[src]`: planes, helicopters, tanks, AA,
  laser turrets; a flamethrower turret ("guide the fire to open a lane"), a rail gun in short barrages, a faster-bullet turret marked
  by a purple light strip; bosses of 3 turrets, then wing propellers "rotate to reveal new turrets".
- **Xevious and Galaga** (https://en.wikipedia.org/wiki/Xevious, https://arcadeblogger.com/2022/12/30/the-development-of-xevious)
  `[src]`: a zapper for air, a blaster for ground with a reticle that "flashes red over an enemy": two target layers on one screen, the
  prior art for our surface foes. Galaga's swoops: entry, dive, return `[play]`.

## 3. The taxonomy: 15 archetypes and a hazard
Legend. **Role**: what it teaches or pressures. **Path**, **Fire**, **HP** (our classes: HP table 1, 3, 12, 40, 150 for class 0 to 4).
**Read**: silhouette, tell, death. **Views**: C chase, O overhead, S side. **Prior**: game and enemy.
HP is the *hits to down it by the stream*, as `waves.js` `HP` has it. A "tier" is the class number.

### 3.1 Popcorn swarm (today's school)
- **Role:** the reward and the rhythm. Clears to one sweep of the lock-on; fills the gaps; teaches the lock-on and the chain.
- **Path:** a formation on a curve in (line, vee, ring, pincer); no hold. Enters from a named edge, exits the far side.
- **Fire:** none, or one slow aimed shot from the leader; never a pattern. Fires only in the hold (none here), so almost never.
- **HP:** class 0 (1 hit). A wave of 6 to 8.
- **Read:** small round-ended shape (fish, orb); identical bodies, so a group reads as one thing. Death: a pop and a mote burst in the
  feeling's colour; a whole wave downed pays a chain cue (Gradius capsule, Orta Gene Base).
- **Views:** C head-on discs, needs the lock-on to be fair; O rows seen from above (pincer is O's); S a column that sweeps.
- **Prior:** DonPachi popcorn helicopter; Gradius Fan; Star Fox 64 flights of four; Galaga bees.

### 3.2 Weaver (sine flyer)
- **Role:** teaches leading a target. A path that is always the same, killed early by timing.
- **Path:** a fixed sine or figure along the lane, at a speed that makes the shot lead it; never changes course.
- **Fire:** none. Its threat is the path crossing yours.
- **HP:** class 0 to 1.
- **Read:** one long thin shape that points along its travel (a streamlined fish); its trail line shows the sine. Death: pop; a
  coloured one drops a pickup (Gradius red Garun).
- **Views:** O and S best (a sine reads across the frame); C: a sine in x only.
- **Prior:** Gradius Garun; Galaga dive-bombers' curves; Radiant Silvergun fodder.

### 3.3 Rammer (kamikaze)
- **Role:** forces a move. Teaches the roll (it is the roll's textbook target) and the brake.
- **Path:** a straight or homing line at the ship, slow to start then faster; a short leash so it turns once at most.
- **Fire:** none. Contact damage.
- **HP:** class 1 (3 hits): killable on approach but you must start early.
- **Read:** a blunt wedge or spiked ball with a bright nose; it *leans into the line* before it dashes and its fuse glows (Bomb Bell).
  Death: an area pop, so a late kill is still a near miss.
- **Views:** C its best (it grows); O and S fine (a visible line); the lock-on takes it down.
- **Prior:** KH2 Bomb Bell ("kamikaze style", roll away); Star Fox 64 Shogun warriors "ramming"; Gradius Rugal (homes, no shot);
  Rez's colliding enemies.

### 3.4 Darter (strafer, the aimed shooter; today's darter)
- **Role:** teaches the parry/roll and strafing; the *one aimed foe* in a mix of sprayers.
- **Path:** enters, crosses the lanes at speed, holds a beat at the far side (the tell), fires, leaves another edge.
- **Fire:** `aimedBurst`, 2 volleys; plain shots, one outlined in a few; on the beat, after a windup of one beat (plain).
- **HP:** class 1 (3 hits).
- **Read:** an arrow shape pointing the way it flies; at the hold it turns its muzzle to you and a glow gathers (DonPachi purple plane's
  aimed line); a muzzle flash on release. Death: a pop; a downed windup cancels the volley and pays more (`RAIL-MODULES.md` rule 3).
- **Views:** C spits from ahead at the camera; O aimed in the plane; S aimed along the wall.
- **Prior:** DonPachi purple plane ("aimed line of bullets"); Touhou fairies with aimed shots; Star Fox 64 Bandits.

### 3.5 Sniper
- **Role:** the one thing you cannot avoid by standing still: a fast, single shot with a long warning. Teaches reading the line.
- **Path:** a slow drift to a perch near an edge, away from the lanes; holds; never crosses.
- **Fire:** one fast aimed shot every two bars; a laser sight (a thin line) for the bar before. Never a spread.
- **HP:** class 1 to 2.
- **Read:** a long thin barrel in the silhouette (a "needle"); the sight line is the tell and a ring at the muzzle closes (the rail's
  telegraph mark). Death: the sight line cuts out.
- **Views:** O and S (the sight line crosses the frame); C: the line is drawn in the cone.
- **Prior:** DonPachi white ship ("very fast sniper shots"); Sky Force rail gun; Elemental Gearbolt's shrinking boxes `[prior]`.

### 3.6 Turret (surface emplacement)
- **Role:** the second layer, the "ground" of a sea: a target that does not move. Teaches placing your fire and the lock-on (priority).
- **Path:** none; scrolls past with the sea. In C it sits ahead and falls behind.
- **Fire:** from a base: a fan or an aimed line, a short burst a bar; fires while on screen, never on entry.
- **HP:** class 1 to 2; a base with a turret on top (two parts, as DonPachi's tanks).
- **Read:** it is fixed to the water or a rock, so it reads as *scenery that points*; the barrel turns toward you before a burst. A
  ground-target reticle flash on it (Xevious blaster) helps in O. Death: it burns and sinks; the base keeps firing if only the turret
  fell (DonPachi "keeps firing from its rear turrets").
- **Views:** O best (a top view of a battery); S as a gun on a sea wall; C as a gun on a rock ahead.
- **Prior:** Xevious ground targets, DonPachi tanks and bunkers, Sky Force AA guns, Gradius Ducker.

### 3.7 Spawner (hatch)
- **Role:** the economy of pressure: leave it and the screen fills. Teaches priority and cleanup.
- **Path:** none; sits at an edge or on a hull, or a floating hatch that holds.
- **Fire:** none itself; every two bars it launches two weavers or rammers until killed.
- **HP:** class 2; opens and closes (vulnerable only open: DonPachi).
- **Read:** an opening shell; the lid lifts a beat before each launch and its inside is lit. Death: it shuts, its children burst.
- **Views:** S and O (a hull's hatch); C: a hatch on a ship ahead, children fly at the camera.
- **Prior:** Gradius Hatch; Star Fox 64 Attack Carrier; KH2 Cyclops (spawns item-holders); DonPachi bunker (releases four tanks).

### 3.8 Shield
- **Role:** teaches position: shoot from the side or back, or wait for the pass. A puzzle in a single body.
- **Path:** a slow line across; faces the ship, turns slowly.
- **Fire:** none, or a short spread when the shield opens to fire (then it is vulnerable).
- **HP:** class 1 body; front plating takes no blow (`armour: 0`, `waves.js` `add`).
- **Read:** a wide plate on its fore face in a pale metal that differs in value from its body; a spark when a blow glances. Death: the
  plate breaks away first, then the body.
- **Views:** C: wait until it passes, then hit it from behind (KH2); O: shot from the sides; S: its two faces.
- **Prior:** KH2 Shield ("shot from behind"); Orta armoured fronts; R-Type's Force pod (as a shield you own); Radiant Silvergun's sword
  blocking one projectile type.

### 3.9 Beam caster
- **Role:** teaches the safe lane. Holds a line you must leave, or a ring you must be still in.
- **Path:** holds at a perch; may sweep slowly across the frame.
- **Fire:** `laser` motion: a thin warning line for a bar (the long windup `RAIL-MODULES.md` rule 3 gives to beams), then the beam, a
  bar long. Or a ring that travels round the ship (Hex Ring): "sitting still" or rolling dodges it.
- **HP:** class 2.
- **Read:** a lens or a long barrel plus a tell lamp that grows (the Hex Ring's yellow spike); the warning line is the same colour as the
  beam but dim, then bright. Death: the beam stutters out.
- **Views:** S and O best (a line across the frame); C: the ring variant, a ring that grows round the ship.
- **Prior:** KH2 Hex Ring; Sky Force flamethrower turret ("guide the fire to open a lane"); DonPachi Stage 4 laser turrets ("fire lasers when
  the pod stops moving"); Ikaruga's beam bosses `[play]`.

### 3.10 Mine layer / shootable shell
- **Role:** teaches the second use of your gun: a shot that is a foe. Area denial in a slow, readable way.
- **Path:** the layer drifts and drops; the mines sit or drift slowly toward the ship.
- **Fire:** none from the layer; a mine is a foe with a fuse (3 s) that bursts into a ring. A shell lobbed at a slow arc is shot
  down in flight.
- **HP:** mine class 0 to 1; a heavy shell 500 HP in KH2's units (about class 2 here): "if not destroyed in time, it will explode".
- **Read:** a round shape with a flashing core; a fuse ring closes; it must not match a bullet's silhouette (a mine is large and lit
  from inside; bullets are small cores). Death: a burst if shot near, none if shot far, so range is the choice.
- **Views:** O and S best (a slow target on the plane); C: a shell flying at the camera, the cannonball of the Pirate Ship.
- **Prior:** KH2 Pirate Ship cannonball (500 HP, explodes), Bomber; Gradius mines `[play]`; Sin & Punishment's thrown things sent back.

### 3.11 Grappler (clamp)
- **Role:** takes a verb away until you answer it. Teaches the roll as an escape and rewards the lock-on's priority.
- **Path:** a homing line like a rammer, but slow, and it *attaches*.
- **Fire:** none. While clamped: your steering is slowed or your gun is dumb; the roll shakes it off.
- **HP:** class 1.
- **Read:** an open pincer or hook in the silhouette (a claw); its hand opens a beat before it lunges. Death: the claw falls open.
- **Views:** C (clamps to the hull seen from behind); O and S (clamps to the side of the hull).
- **Prior:** KH2 Grappler (and the Pirate Ship's grapplers, a roll frees you); our boarders (`pirates.js`).

### 3.12 Carrier (treasure, does not fight)
- **Role:** a target worth a detour. Teaches choosing: the pickup is bait against a pressure.
- **Path:** a slow, straight crossing, longer in the frame than any foe, with a safe escort around it.
- **Fire:** none. Its escort may.
- **HP:** class 2 (a Cruiser's "large Cruisers drop treasures" is the model); colour tells its drop.
- **Read:** a rounded cargo shape, glossy, a crate or a lantern slung under it; a halo or a gleam. Death: pickups fan out, with a slow
  pull toward the ship (so the greed is a risk to the position, not a punishment).
- **Views:** all three; in C it crosses at a distance.
- **Prior:** DonPachi item carrier; Gradius red capsule foes; KH2 Cruiser and Mini Cruiser; Sky Force rescue targets.

### 3.13 Heavy (gunship; today's heavy)
- **Role:** a bullet sponge that sets the pattern for the bars it holds. Pressure and a target for the lock-on's eight.
- **Path:** enters slowly, holds in the upper third, never drifts onto the ship (Boghog, `[prior]`).
- **Fire:** one named pattern from its muzzle (rotatingRing, multiSpiral, accelSpiral, rose); an outlined shot every other bar.
- **HP:** class 2 to 3 (12 to 40).
- **Read:** the largest silhouette on screen; the muzzle turns, its collar glows; a health cue by visible armour (it sheds plates as it
  falls: Ikaruga's bar made diegetic). Death: its shots burst into motes (Cave's last spit).
- **Views:** C head-on, big; O and S broadside.
- **Prior:** DonPachi medium planes; R-Type's large Bydo; KH2 Gatling Ship; our heavy.

### 3.14 Midboss (a part table small enough to read)
- **Role:** the peak of a build phase: the first time a leg asks you to choose which part to hit first.
- **Path:** one hold, one exit; it leaves if you are slow (a mid-boss is never longer than the boss).
- **Fire:** two or three parts, each its own pattern; one part's death changes the others (DonPachi drills detach, a pod comes off).
- **HP:** class 3 total, as 3 to 4 parts of class 1 to 2.
- **Read:** parts are visibly separate masses, each with its own lamp; a part's lamp goes dark when it is dead. Death: the parts fall
  in order, the body last.
- **Views:** C a hull seen from the stern; O the hull from above; S a hull in profile.
- **Prior:** DonPachi H-tank and pod midbosses; Sky Force boss helicopter (three turrets, then wing props rotate to reveal more);
  Radiant Silvergun appendages before the weak spot; KH2 Spider ("appendages before torso").

### 3.15 Boss / set piece (a director's)
- **Role:** the leg's big object whose parts pay out of proportion. The test of everything taught.
- **Path:** authored: entry, hold, a phase change, a reveal, an exit or death.
- **Fire:** per part (see the part tables, `RAIL-MODULES-SHMUP.md` 3.2); phase changes on bar lines.
- **HP:** class 4 (150), split across parts; a core late-revealed (KH2 skull; DonPachi core after four turrets).
- **Read:** it fits the screen and still looks huge (Sin & Punishment); an arrival warning (silence, a siren: Molinari); the
  weak point is a different colour and shape; the core only opens when ready. Death: the Cave spit (all shots to motes), a white flash
  limited to a half second, a slowdown.
- **Views:** all three, each authored.
- **Prior:** KH2 Pirate Ship; Skies of Arcadia's brig `[prior]`; Orta's armoured fronts and side weak points; R-Type Dobkeratops.

### 3.16 Hazard (not a foe: a path obstacle)
- **Role:** makes position matter without a gun: rocks, flotsam, a ship's rigging. Resets the eye between waves.
- **Path:** scenery that scrolls; no fire.
- **HP:** none, or indestructible (the lock-on skips it).
- **Read:** a dull, desaturated mass with no glow; it never wears a foe's lamp. Death: none; a glancing hit damages and shoves.
- **Views:** C (obstacle flight); O and S (a wall with gaps).
- **Prior:** Star Fox 64 stone arches and Ski Bots; KH2 Phantom Storm's building tunnel; R-Type's terrain; Sky Force flamethrower lanes.

(That is 16 entries, 15 of them foes. A leg draws at most five types, section 5.)

---

## 4. How to make each one read
### 4.1 Silhouette rules (480 lines, 40 to 60 m: a foe is a handful of pixels, so outline and motion carry it) `[own, with src]`
1. **One shape, one behaviour.** The name is the shape: fish, dart, claw, plate, needle, hatch. KH2 does this: Hex Ring, Bomb Bell,
   Knight Head `[prior]`.
2. **Three silhouettes for three views.** Design the head-on disc, the flank and the top of each foe; the three must still say the same
   thing (a fish is round-ended from ahead, long from the side, a dart from above). Test at 64 px.
3. **Value, not hue, makes the outline.** Dark-on-light or light-on-dark against the sea's value at that depth; colour is for the
   feeling. Two foes in a leg differ in size class and shape first, colour second.
4. **Size classes are steps of about 2x**, one per HP class: popcorn small, mid-size twice, heavy four times, boss most of the frame.
   A bigger foe is slower. (DonPachi: popcorn small, mediums obvious; Orta: "vary in size and health".)
5. **The lamp is the tell.** One bright part (the muzzle, a collar, the Hex Ring's spike) that changes before it fires. It is the
   only thing on the body that glows, so the eye finds it.
6. **Colour variants are rewards, not new threats.** Same body; red and gold take 2x to 4.5x the HP and drop more (Hex Ring 800,
   1,500, 3,600) `[src]`.
7. **Vulnerable parts differ in value.** A weak point is the lightest spot on a dark body (or the reverse); an armoured plate is a
   different material. Radiant Silvergun's appendages and Orta's weak sides use shape; we add value.

### 4.2 The tell before a shot `[prior, own]`
Order: **hold** (the foe stops, a free tell, `RAIL-MODULES-SHMUP.md` 1.8) → **windup** (muzzle turns, lamp grows; a beat before a plain
volley, half a bar before an outlined shot, a bar before a beam) → **release** (flash, recoil, sound on the sixteenth) → **flight**.
Per archetype: darter turns the muzzle; sniper draws a sight line; turret turns its barrel; spawner lifts its lid; beam caster
grows a lamp then a line; heavy collar glows; carrier none (it must not fire); rammer leans and its fuse lights.

Death read (Molinari): a hit shows by flicker or shake, never a full white flash; everything that dies explodes; a downed windup cancels its volley and the glow dies; a boss's death is large, with a half-second flash and a slowdown.
Bullets: bright core, dark rim, never yellow or orange, slower than yours (Dieterich); one look per emitter when patterns overlap (Molinari).

---

## 5. Composition rules
### 5.1 How many at once `[own, with src]`
- **At most 3 archetypes alive at once, 5 in a leg's peak.** (Cave's stages mix about 3 behaviours on screen; the earlier research
  gave 40/120/60 shots per view as the cap.)
- **At most 1 heavy or midboss at once** (Boghog: spawn high-HP foes one at a time, `[prior]`); a boss alone, with its escorts timed
  to its phases.
- **At most 1 aimed foe at a time** unless the leg is teaching aim: the rest spray or fix (Danmaku's norm, TV Tropes above).
- **At most 8 popcorn at once** (the lock-on's eight, Rez/Orta) so one sweep takes a wave; a second wave overlaps the tail of the first.
- Shot budgets per view stay `RAIL-MODULES.md` rule 6: 40 chase, 120 overhead, 60 side.
- **No foe or wave at the frame's edge** (traps) and none standing on the ship's lane at entry; lanes 5 to 7, alternating sides.

### 5.2 Contrast
- **Foe against bullet:** a foe is large, dark-bodied with one lamp; a bullet is small and bright with a dark rim. They never share
  a silhouette family (a mine is not a bullet; a shootable shell is much larger than a shot).
- **Foe against sea:** value contrast first. Foes in the Umbral world sit against a bright background; Astral against a dark one (a
  leg's world is one at a time, `legs.js` WORLD_BLOCK).
- **Bullet against bullet:** two overlapping patterns differ in one of colour, shape, spin (Molinari).
- **Gold and reward things** use the yellow/orange the shots must not: pickups gold, shots never.

### 5.3 The introduction curve `[own, with src]`
- **One new thing at a time.** A new archetype enters alone, in a quiet bar, with its tell obvious; the next one comes only after the
  player has met it twice. (Ikaruga teaches one idea a chapter, then mixes: `legs.js` header, `[prior]`; R-Type "rewards learning
  patterns".)
- **Teach, test, twist.** First appearance: alone, slow, one on screen. Second: in a pair or a group. Third: mixed with one
  archetype already learned, or from a new view. Only then does it join the peak.
- **A variant comes after the base.** The sniper before the double sniper; the plain beam before the sweeping beam.
- **Order for a first-time player** (an introduction ladder across legs, `[own]`): popcorn → rammer → darter → turret → weaver →
  shield → hatch → sniper → beam caster → mine → grappler → carrier (anywhere, as a reward) → heavy → midboss → boss.
- **Pacing law** stays: no two-bar window without a threat or a target (`legs.js` `idle`).

### 5.4 Mapping to a 16-bar leg (open, build, peak, release; `legs.js` today uses phases that stretch to the leg's bars)
A 16-bar practice leg (`RAIL-MODULES.md` rule 8) at the doubled bars would be 32 in a real crossing; the ratio is 4 : 5 : 5 : 2
(open : build : peak : release) in 16, which is `P(2,3,3,1)` shaped to whole bars. `[own]`

| phase | bars | what plays | archetypes | purpose |
|---|---|---|---|---|
| **open** | 1 to 4 | one idea alone | popcorn + one new thing (weaver or rammer or darter) | learn the tell; the first wave is a free sweep |
| **build** | 5 to 9 | it mixed with one other | the new thing + one known (turret or shield or spawner); one hazard | decide priority; the second wave overlaps the first's tail |
| **peak** | 10 to 14 | the big object | a midboss or a heavy with its pattern; popcorn as relief; a carrier as bait | choose which part to hit first; a part's death changes the rest |
| **release** | 15 to 16 | parts falling, lights to lock | no fire; pickups, carriers, a last popcorn wave | collect; the swing is announced (a mark at the edge and a sound) |

Constraints that already hold (`RAIL-MODULES.md` 4 and 10): no foe fires in the 3 bars before a swing nor the first bar after; no
shot is alive during a swing; the next side is announced before it arrives. So the release is where carriers and relief popcorn live.

---

## 6. Barrel roll and form-switch conventions (our ship retracts its mast on both)
Sources here are thin: the pages give the mechanic, not the animation. What I could read and what I could not:

- **Star Fox 64's barrel roll** (a double-tap of Z or R): the Arwing spins and deflects enemy fire; "technically an aileron roll";
  all-range mode adds a U-turn and the somersault (https://en.wikipedia.org/wiki/Star_Fox_64). The wing-fold claim I heard did
  not appear in any page I read: unverified, so I do not rely on it. `[src]`
  - **Convention:** the roll is a whole-ship spin on the forward axis in about 0.5 s; a window of deflection is shown (the ship glows
    or a ring forms) and a sound marks the deflect. Our roll turns an outlined shot back; its window should show a ring and flare.
- **Ikaruga's flip:** a button press switches black and white at any moment; the colour of the ship changes (the page says nothing of the
  animation; a Dolphin forum thread notes the GameCube build's shield and shots did not seem to change colour, a single user's report).
  https://en.wikipedia.org/wiki/Ikaruga, https://forums.dolphin-emu.org/Thread-gc-ikaruga-polarity-can-change-but-colours-remain-the-same
  `[src, thin]`
  - **Convention (my memory, `[play]`):** the change is instant with a short pulse and a sound; the ship and its shield are the
    carrier of the information; enemy bullets are the same two values as the ship, so a glance reads friend or foe.
- **Panzer Dragoon Orta's morph:** Y switches Base, Heavy, Glide Wing; the form decides how many foes you can lock and how strong each
  shot is (https://en.wikipedia.org/wiki/Panzer_Dragoon_Orta). The animation itself is not described in anything I read. The wing
  shape and the dragon's stance are the readout (heavy = broad and low, glide = wings out) `[play]`.
- **Gummi ship:** I found no source for a Gummi transformation; the ship is built from parts and does not morph in a mission. The
  Formation Change in KH2 swaps the wingmen's formation, not the ship's shape (a guide line in the earlier research). `[prior]`
- **Macross VF-1:** three configurations, Fighter (wings swept 20 to 72 degrees, 90 degrees to stow), GERWALK (engines angle down
  to become legs, arms fold out), Battroid (legs straighten; nose forms the chest, laser turret becomes the head)
  (https://en.wikipedia.org/wiki/VF-1_Valkyrie). `[src]`
  - **Convention:** the transformation is read in steps, not one blend: wings sweep, then parts hinge, each with a mechanical sound
    and a brief lock. The middle form (GERWALK) is a readable stop, "originally meant for landing", later used for flanking. A
    toy-like, mechanical, hinge-by-hinge change is the look the audience knows; a morph blend is not.

**What this means for our ship** (the mast retracts for the roll and for the form switch) `[own]`:
1. **Retract first, then act, then deploy:** a short fold (0.15 s) before the spin or the flip, a settle (0.15 s) after, so the change
   is a read in three beats like Macross's steps. The mast folding *is* the tell that a roll or flip is happening.
2. **The roll and the flip are different gestures:** the roll turns the whole ship about its forward axis (Star Fox); the flip changes
   the colour and the hull's shape at the retract (Ikaruga, Orta). Do not use the spin for the flip.
3. **Information on the hull, not the HUD:** the form shows on the sail/hull and its glow, as Ikaruga's polarity shows in the ship;
   at 480 lines the value of the hull must change, not only its hue.
4. **A window and a sound:** the deflect window of the roll, and the flip's moment, each get a ring and a sound on the sixteenth.
5. **No shot in flight at a swing** (rule 10): a flip near a swing needs no extra clean-up.

---

## 7. Open questions and what I could not verify
- Per-enemy HP, speed and firing rates for Star Fox 64, Panzer Dragoon, Rez and Sin & Punishment: no page gave them. The numbers here
  are ours (`waves.js` `HP`) except Hex Ring's 800/1,500/3,600 and the Pirate Ship's from the earlier research.
- Boghog's Shmup 101 and Sparen's Danmaku Design Studio could not be fetched; the lanes, spawn-one-heavy and bullet-colour rules come
  from the earlier research's reading of them, not this round's.
- How the Ikaruga flip, the Orta morph and the Arwing roll are animated: not in any page read; the notes above are marked `[play]`.
- The 3 and 5 type caps and the 4 : 5 : 5 : 2 leg split are ours. Test in the mock before fixing them.
