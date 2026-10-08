# The crossing, overhauled: a rollercoaster through a psychic sea (the owner, 2026-10-08)

Kept by Dovina. Replaces the pacing of `RAIL.md` (whose verbs, score and set pieces it revises; what it keeps is said). The route you
sail is drafted on the sea chart first: `docs/plans/PASSAGE.md`. The research behind every rule: `docs/plans/research/RAIL-SETPIECES.md`
(the games), `RAIL-PATTERNS.md` (danmaku, homing, boids, the warp). Units: bars of the cue (1.5 real seconds), real seconds, metres.

> "Way too basic/easy... the pacing is all out of whack with multiple sections where you're doing nothing at all. The visuals are
> severely lacking... The rail shooting sections are our chance to go absolutely buck wild with spectacle: massive boid swarms of
> hundreds of entities, intense bullet hell projectile patterns, ambient geometric obstacles, Itano-circus-like projectile laser paths.
> Homing missiles. Have the scene and environment bend and distort with shaders like you're caught in a psychic storm. The Emocean is a
> non-linear space. A rail shooter is a rollercoaster." The camera swings are good; the colour flip becomes **Astral/Umbral** forms that
> rise above and dive below the Emocean; the ship is a flying submarine (Calissa's).

## 1. What is wrong now (measured or read in the code)

1. **Empty stretches.** The first half is the same tutorial every crossing (`crossing.js` ACTS: launch, schools, pincer, darters,
   breather), one verb an act, and the breather is 12 bars of nothing.
2. **Too easy and too sparse.** 10 authored waves in 150 real seconds (`emocean.js` STAGE); a shoal of 48 to 72 fish.
3. **The pirates cannot be sunk.** Her hull takes 420 shots; full auto is 16 a bar; she is alongside about 23 bars before she rams: 26
   bars of nothing but hull fire would be needed (`setpieces.js` PIRATES).
4. **The aim is bugged** (Petra's, `courier/ship/ship.js` `aimAt`): the mouse moves a point clamped to a box 9 by 6 m at 36 m ahead
   (`RET`), not a cursor over the screen, which reads as "a downscaled rectangle"; and the offset is added along the rail's axes (only
   `VIEW_RIGHT` flips a sign), so after a swing mouse-right is no longer screen-right. **Fix:** a screen-space cursor (NDC over the
   whole screen, the mouse's delta in pixels), and each frame a ray from the camera through it: the aim point is where the ray meets
   the depth plane 36 m ahead of the ship (or the first foe it crosses); the near and far reticles are drawn on that ray. A swing
   carries the cursor's screen position, never its world offset.
5. **Nine verbs** in two minutes (RAIL.md "The verbs"), three of which answer the same shot (the roll, the parry, the colour flip).
6. **Visuals:** placeholders (the owner: "severely lacking"); Calissa's submarine ship is the one keeper.

## 2. The shape of a trip

A trip is the **passage** you drafted on the sea chart (PASSAGE.md): from your island, through **3 to 6 waypoints**, to the
destination. Each waypoint is one **leg** (the glossary's word: one set piece), **40 to 64 bars (60 to 96 real seconds)**, and between
two legs a **turn of the rail** (4 bars: the rail bends, dives or breaches into the next leg's space; never empty: the leg's last
stragglers and the next one's first scouts overlap it). A trip is **4 to 9 real minutes**, the length of a KH2 Gummi mission or an
Ikaruga chapter, and every minute of it is played.

- **The launch** is 4 bars, not 9; **the lessons** (one verb an act) play **once in a life** (the ledger's first crossing), then never:
  the Gummi complaint was dead time you cannot skip (RAIL-SETPIECES, lesson 35).
- **The arrive** is the tally over the island rising, 4 bars.

### The pacing law (checked by `scripts/rail.mjs` on every leg's schedule)

1. **Never idle:** no 2-bar window (3 real seconds) without either a threat in reach or a target to lock. A "rest" is spectacle
   with targets for score (Rez's scanning orbs), never nothing.
2. **Every leg is a curve:** **open** (8 bars, one idea shown on its own), **build** (16 to 24, the idea mixed with one other),
   **peak** (16 to 24: the leg's big object, Phantom Storm's lesson: one dominant thing whose parts pay), **release** (4: the parts
   falling, flotsam, the light).
3. **Light and heavy alternate** (Touhou, Danmaku Unlimited): a leg's heavy phase is never followed by another leg's heavy open.
4. **The view changes where threats come from at least once a leg** (Gummi, Star Fox): a swing is a bar, on a bar line (kept).
5. **Packed and open spaces alternate** (Elemental Gearbolt's film pacing): a corridor leg is followed by an open one.

## 3. The verbs (seven, each one job)

| input | verb | what it is for |
|---|---|---|
| WASD | move in the view's plane | position (a weak point is a position: Panzer Dragoon Saga) |
| mouse | **the cursor**, over the whole screen (§1.4 fix) | aim |
| LMB held | full auto, a shot each sixteenth (kept) | the many small things |
| RMB held, release | **the lock-on**: paint up to 8, release a **lance** at each (kept), now an **Itano swarm**: each lance launched fanned, overshooting, then homing by proportional navigation, three behaviours mixed (straight, leading, weaving) with ribbon trails | the big things and their parts (Rez, Panzer Dragoon, Macross) |
| E | **the roll**: dodges, and **turns an outlined shot back** in its window (the rail's parry: V is no longer needed at sea; one button, Star Fox's barrel roll that deflects) | danger you cannot shoot |
| Q | **breach / dive**: the **Astral form** above the Emocean, the **Umbral form** below it (§4) | which world you fight in |
| Shift / C | boost / brake along the rail (kept) | the rollercoaster's speed |
| R | **the surge** (§4): the absorbed Lachryma let go at once | the panic button with a price |

**Retired at sea:** V (folded into the roll), the colour flip (become the forms), the two mounts (RAIL.md's `mounts.js`: the sloop
carried two worn tools; the owner to rule whether they come back as the surge's flavour). Seven verbs is still Panzer Dragoon Orta's
count; every one now answers a different question.

## 4. Astral and Umbral: the forms (the owner's idea; Ikaruga's polarity, Orta's forms)

The flying submarine **breaches** into the **Astral form** (above the Emocean, in the storm's light) and **dives** into the **Umbral
form** (below its surface, in the black crude): Q, a half-bar transition with a splash, the camera passing through the surface (Calissa:
the meniscus seen from below, caustics, refraction; Wanda: the mix low-passed below).

- **Two kinds of foe shot:** **astral** (bright, white-gold cored) and **umbral** (black, a pale rim). **A shot of your form's kind is
  absorbed** into the pool (+1 Lachryma) and fills the surge; **the other kind hurts** (Ikaruga). Outlined shots (parryable) are either
  kind and answer only to the roll.
- **Foes live in one world or both:** astral ones fly; umbral ones swim; some breach between. Your shots strike foes of the other kind
  for double (Ikaruga), so each form is a trade, never an upgrade (Orta, lesson 5):

| form | speed | gun | lock-on | sees |
|---|---|---|---|---|
| Astral | fast (x1.2), wide box | a spread of three | 8 locks | the sky's threats, far |
| Umbral | slower (x0.85), a tighter box | one heavy shot (x2.5) | 4 locks | what swims below; the bellies and keels of things |

- **A weak point is a world** (Ikaruga's covers that open for the matching polarity, Saga's positions): Old Nobody's gills only from
  below, the False Light's keel from below and her rigging from above.
- **The surge** (R): absorbed shots fill it (0 to 100). Let go, it fires **the full swarm**: a lance at everything on screen, both worlds
  (Panzer Dragoon's Berserk), a half-bar of invulnerability. **Its price:** the chain is reset (Child of Eden's Euphoria costs rank).

## 5. The spectacle (budgets measured with `npm run perf` before they are promised)

- **Swarms:** a shoal of **300 to 800 glints** (one InstancedMesh; a CPU grid sized to the neighbour radius, a third of the flock
  stepped a frame, interpolated; GPU compute when WebGPU is the target). Bait balls, frenzy dashes, a school forming a single giant
  silhouette (Child of Eden).
- **Danmaku:** a **pattern library** (`progress/rail/patterns.js`, Dovina's, §7) of 28 emitters; up to **400 foe shots in flight** at a
  heavy peak, 60 at a light one, all pooled; every shot readable by its kind and direction (§8).
- **Lasers:** warning line then hot; sweeping beams; **snake lasers** (a ribbon over a head bullet's trail).
- **Missiles:** foes' salvos up to 24 (turn-rate capped, a lifetime, a visible launch tell), the player's eight lances (Itano).
- **Ambient geometry** (Calissa's; Rez's wireframes, the Mind's labradorite): rings to thread, lattices that fold, monoliths rising out
  of the crude, the sea's surface bending into a tube overhead.
- **The psychic storm** (Calissa's shaders, the research's §5): the world's vertices bent in view space (a droop and a slow sway),
  screen-space haze from scrolling low-frequency noise, chromatic split at the edges, the glitch at a set piece's first beat (kept).
  Its strength is the leg's **storm** (§6), the weather of the waypoint and the Courier's mental state (Prismatic warps the most).
  Low frequency only (no aliasing crawl); `visual.glitch` and a new `visual.warp` setting turn them down.

### The non-linear sea

The rail is a **spline**, not a line (Petra's): it banks, corkscrews, loops, breaches through the surface and runs inverted under a sea
that has folded overhead (Inception's street, Rez's tunnels). Space is not Euclidean: a turn of the rail can come out where it went
in, upside down; a maelstrom leg (§6) **leaves the rail** for an arena (Rez Infinite's Area X, Star Fox's all-range mode), and the rail
picks you up again on its far side. The views (chase, above, side, free, astern) are kept (the owner: "the camera angle changes
themselves are good"), each now bound to a stretch of spline.

## 6. The legs (each a waypoint's set piece; their numbers in `setpieces.js`, their order on the sea chart)

| leg | bars | the big object (parts that pay) | its idea | prior art |
|---|---|---|---|---|
| **the shoal** (reworked) | 48 | **the Conductor** and the bait ball; the school forms a leviathan-shaped silhouette for the peak and must be broken by shooting its "eye" | lock-on against hundreds | the sardine run, Child of Eden, Reynolds |
| **the Wreckers** (reworked) | 56 | **the False Light** as Phantom Storm's Pirate Ship: rigging (above), gunports (alongside), keel (below), the figurehead's lamp (the core, opened when the rigging is cut); boarders; a chase through her own wreck field | the forms as a weak point | KH2's Phantom Storm, Skies of Arcadia, Assassin's Creed IV |
| **Old Nobody** (reworked) | 64 | the rogue Leviathan **as a space** (Panzer Dragoon Saga): the rail circles it; gills from below, teeth and eye from above; it quickens as gills shut (Ikaruga's Uzura); breaches through the rail | the boss is a place | Saga, Orta's manta, Moby-Dick |
| **the eyewall** (new) | 40 | the eye of a psychic storm: a tunnel run through folding geometry and sweeping beams, the warp at its strongest; few foes, all dodging | the rollercoaster itself | Star Fox's Area 6, Ace Combat's tunnel runs, Rez Area 5 |
| **the graveyard** (new) | 48 | sunken hulls (Umbral) and ghost ships riding above them (Astral); mines; the Drowned Light that wakes as the peak | the two worlds at once | Phantom Storm's ghouls, Sunless Sea |
| **the maelstrom** (new) | 48 | an arena off the rail (all-range), a whirlpool you circle while a Figment of the place's feeling fights you in both worlds | free flight, once a trip at most | Rez's Area X, Star Fox's all-range |
| **a calm** (haven) | 24 | lights to lock for score (whales of light, the aurora: never empty), flotsam that **mends** (kept: LEG.mend), **the Purser's buoy** where the Purser's tender sells fuel | a breath that still scores | Rez's scanning orbs, the breather kept |
| **a bounty** (when Letty has posted one) | 56 | the posted stray: an aberrant Figment as a boss with parts | the bounty's livelihood | Letty Marque's board |

**Every boss:** telegraphs by a **shrinking mark** on the part about to act (Elemental Gearbolt), in Calissa's outline language; a part
downed pays and changes the pattern (Einhander, Silvergun); clearing every part before the core pays a bonus; the ship is **mended**
before a boss leg (Orta: revive before a boss). **Bonus foes:** a group cleared whole spawns a gold one (the Gummi lesson).

**The pirates' numbers** (§1.3 fixed): she is alongside for the whole peak (24 bars), her hull is sized so an expert sinks her by bar 36
of 56, a good player by bar 48, a novice cuts her rigging (struck colours) about half the time: measured by `scripts/rail.mjs`, never
guessed. Every leg's parts are sized the same way: by the measured damage a player of each skill does in its peak.

## 7. The pattern library (Dovina's: `src/progress/rail/patterns.js`, **built**; `node scripts/patterns.mjs` checks all 28)

Data and pure functions, no Three.js: `emit(pattern, params, t, rng) -> [{ at, pos, vel, kind, outlined, motion }]` in the rail's
frame, so the stage, the simulator and a test all read the same thing. The 28 emitters of RAIL-PATTERNS.md (ring, rotating ring,
even and odd fans, aimed burst, offset twins, stack fan, spirals single, multi-arm, reversing and accelerating, rose, wall with a gap,
sine curtain, decelerate-then-burst, accelerating rain, curving shot, split shell, fragmenting ring, crossing gate, stratified rain,
sweeping beam, snake laser, homing salvo, Itano swarm, cage ring-in, glint frenzy dash, the plain/outlined mix), each a row of numbers
and a formula; **a foe's attack is a timeline of patterns** (CLAUDE.md: a scripted fight is a timeline), seeded by the day (`stream`).
In 3D: a pattern is emitted in its **plane** (the view's plane, so a ring reads as a ring from the camera) or as a **sphere/cone**
toward the ship in the free and chase views.

**The fairness checker** (`fair()` in `patterns.js`, run by `scripts/patterns.mjs` on every pattern in the plane and the cone; the
legs' schedules will run it too): for every pattern in every leg at every skill: the smallest gap is at least
3 ship widths; the reaction time (distance over speed, minus the telegraph) at least 0.5 real seconds; no shot spawns inside 4 m of the
ship; no blind-spot seed deltas (gcd rule); homers turn at most 90 degrees a second and live at most 2.5 real seconds.

## 8. Readability (Calissa's to draw; the rules from the research)

A tiny, centred, consistent hurtbox, never larger than shown (it is drawn: a pale core in the hull). Shots: a bright core and a dark
rim (astral) or a dark core and a pale rim (umbral), directional (elongated by speed), drawn over everything; reds, pinks and violets
read against gold explosions; the background midtone and low-contrast where shots fly; outlined shots keep Cuphead's pink.

## 9. Score, rank and worth (Dovina's)

Kept: downs by class, point blank x2, sent back x3, chains of three of one kind doubling to 25,600, volleys, rank against par, medals.
New: **a part's down** pays by its share of the boss; **all parts before the core** x2 the core; **a boss second left** 1,000
(Ikaruga's 10,000 at our scale); **a group cleared whole** spawns its gold foe (x5). Par is measured per leg, and a trip's rank is its
legs' ranks weighed by their bars. **What skill earns** (the owner's C, agreed): the trip's **rutter** (PASSAGE.md) is worth more the
better its rank; cargo spills on a hit taken with casks aboard (a crude cask cracks: the hold is skill); Letty pays a bounty by rank.

## 10. What it teaches (the commandment)

Pattern reading (the eye learns to see lanes in density: Sparen's micro and macro dodging), the trade of two worlds (Ikaruga's
colour logic), and with the sea chart: **risk against expected value, and reading a forecast's confidence** (PASSAGE.md §8).

## 11. Who builds what

| division | builds |
|---|---|
| **Dovina** | `patterns.js` (the emitter library), the legs' schedules and numbers (`crossing.js`, `setpieces.js`), the score, the fairness checker and the leg simulator in `scripts/rail.mjs`, the passage's generator and forecast (PASSAGE.md), the rutter's worth, the ledger and achievements, the sweeps |
| **Petra** | **first: the aim fix (§1.4)**; the rail as a spline (non-linear: loops, breaches, inversions, the maelstrom's arena); the forms (Q, physics, the surface crossing); the shot runtime (pools, collisions, the kinds); the lances' proportional navigation; boids at 300 to 800; the legs' runtime from the schedules; the sea chart window at the pier |
| **Calissa** | the storm warp (vertex bend, haze, chromatic split), the Umbral underwater look and the surface crossing, the shots' look (§8), the Itano ribbons, the glints, the ambient geometry, the legs' big objects and their parts (the False Light, Old Nobody, the Drowned Light, the shoal's silhouette), the sea chart's icons and their blur tiers |
| **Wanda** | a cue a leg (Rez's layers: each lock and down a layer, the boss the thickest), the surface crossing's filter, the turn of the rail as a musical transition, boss themes |
| **Espada** | the names (the forms' player words if not the owner's, the new legs, the waypoints, the rutter), the log's lines |

The owner's word: if Petra is backlogged, Dovina takes a share of her runtime work (the shot runtime and the pattern player are the
natural split: they read Dovina's library).

## 12. Acceptance (each a check in the Emocean sweep, `scripts/sweeps/emocean.mjs`)

1. The cursor reaches every corner of the screen in every view; after each swing the aim point is under the cursor.
2. No 2-bar window in any leg without a threat or a target (the schedule checker, and the sweep counting live foes a bar).
3. The pirates sunk by a scripted expert within the leg (headless); every boss part downable.
4. Q crosses the surface in half a bar; a shot of your form's kind is absorbed, the other hurts; the surge fires and resets the chain.
5. 600 glints and 400 shots at the peak hold the frame budget (`npm run perf`).
6. The fairness checker passes every pattern at every skill.
7. A debug chest at the jetty (CLAUDE.md): cubes for the fuel of a long passage and casks for the pirates (items only, never state).
