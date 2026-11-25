# Brief 05: every other system, briefly

One section a system: what it is, its files, its data, its contract, how to port it. Load the section you need; follow its plan in
`docs/plans/` for more. Line counts are the JS's.

## Tools: the belt and the moveset

- **The belt** (`tools/belt.js`, 221): seven tools always owned; two worn. The **main** is drawn with X and owns the mouse, number keys
  and V while out; the **sub** hangs and **lends** the main one verb on R (`SUB_GIFTS`) and a passive. A main and sub together make a
  **pair**: one of the Major Arcana (I..XXI), its **special** opened by an achievement (`progress/toolpairs.js`, `tools/pairspecials.js`).
  "Is a tool out?" asks the belt. Fittings (lures, keys, instruments) live in the Pneuka Box (`FITTINGS`, `pneuka/box.js`), never in a tool.
  Each held tool is a `HeldTool` (`tools/heldtool.js`): draw, stow, stance, gestures.
- **The moveset** (`tools/moveset.js`, 793): one combo engine for every tool that strikes. A tool hands it **MOVES** (a clip, its strike
  window, damage, type, knockback, launch ...) and **STRINGS** (which move follows which: string, pause string, charge, launcher, air string,
  dash attack, special). The engine reads presses, plays moves, sweeps hits (`tools/melee.js`), lands blows (hit-stop, hitlag), carries the
  body through moves that move it (`courier/moves/launch.js`). Frame data in 60 Hz frames (`tools/movephases.js`: startup, active,
  recovery, the cancel frame), time warp of clips (`movewarp.js`), on-hit cancels, the paid cut (a Lachryma-paid early cancel), the
  charge's gate, blade joins between blows (`courier/anim/bladejoin.js`). Port as a data-driven combo state machine; the cutlass's
  tables are the richest (`tools/sondelass/`).
- **The parry** (`courier/parry.js`): V answers a blow or projectile in a short window, in the way of the tool in hand (one table of
  windows). **The kick**: V with nothing in the hands (`courier/moves/kick.js`); its first 0.26 s is the parry.

## The seven tools

- **Psygun** (`tools/psygun/*`): a six-chamber revolver (variants of 1, 3, 5, 6, 7 chambers: `kinds.js`). Shots from the camera ray
  through the aim point; ADS; a charge winds a piercing beam; **caster shells** (TYPE-00..99 in five tiers, `progress/combat/`
  shells data, the runner `shellrunner.js` with carrier, payloads and parts); World shells draw Lachryma from the place. Recoil jump in
  the air (`tech.recoil`).
- **Sondelass** (`tools/sondelass/*`): three forms. The **cutlass**: the moveset's richest strings, the melee loadout (LMB normals, RMB
  specials, edited at a lectern: `sondelassloadout.js`, `loadouteditor.js`), charged slash wave, spin attack, lock-on directions. The
  **rod**: angling (`angling/*`: cast, bite, the fight with pump and crank, the line, the catch's lift; fish bodies `fishbodies.js`;
  data `progress/` fish tables). The **hook**: a grapple to a point (`tech.grapple`). The **harpoon** under water.
- **Soul Brush** (`tools/soulbrush/*`): a club; **paint** and **mop** on the **paint map** (`world/ground/paintmap.js`: Lachryma on
  surfaces cell by cell, a feeling's paint or crude); jets (hover, skim, rocket: techs); **Celestial mode** (the paper over the screen:
  draw a sign, `gesture.js` reads it, Okami's brush); inscriptions. The **Paint Dive** (C in wet paint: Splatoon's squid, `moves/slip.js`).
- **Veritome** (`tools/veritome/*`): the book that is a camera. A **plate** is a photograph, scored (subject, framing, stars); the Book
  keeps the bestiary's facts; **reprogramming** a stunned creature with a macro of Functions in neuralese (`reprogram.js`); the safari
  (`progress/safari.js`: behaviours, research levels).
- **Dreamvane** (`tools/dreamvane/*`): dowse (signatures), the **pick** (crystals in the Dunes tuned by ear to one of five frets:
  `world/dunes/crystaltuning.js`), the fork, the survey, the vane (weather meter), the **net** (catch an unaware Figment into the Jar).
- **Crucibelle** (`tools/crucibelle/*`): a bell of five notes on the music's beat; the **toll** (a stagger cone, on the beat stronger);
  **songs** (note sequences that cast); fever; the mirage (a decoy); the **combat recital** (a guitar: licks, strum chain, feedback beam).
- **Lockheart** (`tools/lockheart/*`): a coffin on a chain: **hoover** (drinks Lachryma and small things), the flail (a moveset),
  channel, the **wheel of odds** (a spun outcome, ranks 0 dud .. 4 jackpot), **Possibilikeys** (open the Opening).

## Combat

- **Damage types** (`progress/combat/types.js`): Impact, Ego, Influence, Illusion, Delirium. Each builds a status (doubt, charm, blind,
  confusion ...) and trumps one other. A body's **constitution** sets its affinity and so its weakness (`constitution.js`).
- **The vessel rule** (`progress/combat/vessel.js`, `blowOn`): any shelled body (the Courier, a ship's hull, the Jar, a pot, a Figment's
  glaze shell) takes a blow the same way: the shield (the pool) first where it has one, then a region's crack, then its shatter.
- **Stun** (`creatures/stun.js`): depth 1 dazed, 2 stunned, 3 out cold, one star each; `stun.vulnerable` for abilities a thinking foe refuses.
- **Statuses** applied through `game.creatures`; each creature decides what they mean. **Hitlag**: a struck creature held 2..8 frames.
- **Agitation** (EmO, `progress/combat/emo.js`): a Figment's 0..1; its Lachryma yield peaks in a band. **Grain** (`temperament.js`): five
  traits that weight its mind.

## Creatures and minds

- **Registry** (`creatures/creatures.js`): a creature is a plain object `{ kind, pos, radius, height, alive, tags, hurt(point, dir, power,
  cause, by, from), knock(vel), center(out), head(), vanish() }`; weapons call `creatures.strike(...)`, never the creature.
- **Bodies**: slip jelly (`creatures/jelly/`), the Lantern Wisp (`wisp/`: hovers, keeps distance, casts a flame ball the parry sends back),
  clapperjars (`creatures/clappers.js`: clapping pots, the lowest folk), the sentinel (`sentinel/`), sea serpents (`seaserpent/`),
  Strawman (the training dummy: `vfx/strawman.js`), spirits (allies), mirages (decoys).
- **Minds** (`creatures/ai/`, doc `docs/AI.md`): `brain.js` puts together `senses.js` (sight, hearing of stimuli) → `memory.js` →
  `drives.js` (needs that creep up) → `utility.js` (a utility reasoner scoring every action a few times a second; the winner runs each
  frame until done or beaten). `steer.js` (steering behaviours), `flock.js` (Reynolds' boids), `stimuli.js` (sounds, lights, smells a
  creature notices), `ecology.js` (what a place offers), `timeline.js` (a scripted fight). A new creature is a body module and a mind of data.
  Port as C# classes; Godot's NavigationAgent3D for paths.
- **Stealth** (`progress/stealth.js`): exposure by posture, pace, light and weather; footstep noise by surface; a Figment's watch (head up / down).

## Puzzle duels

- An aberrant Figment's fight as a turn-based versus puzzle (`progress/duel/*`, 415 in `duel.js`): two sides on one board (20 × 20 by
  default; a ruleset per Figment: `rulesets.js`), the **Line** between them. Actions (5 AP a turn in the classic; one drag a turn in the
  PvE duel, the default) then **the settle** (gravity, clears, chains). Clears become **junk** sent across; 3 junk landed pushes the Line a
  column. Win by the Line at the far wall, the foe's half full, or the finisher on a broken foe. PvE: foe skills on countdowns
  (`foeskills.js`), your duel's powers (`powers.js`), learned skills, each aberrant's secret way to win (`secrets.js`), drops.
- The session (`world/duel/duelsession.js`: the pocket nothing outside enters), the 3D board (`vfx/duelview/*`: the tsuitate, a standing
  screen of crystal between you and the foe), the music (`music/duel.js`). Port the kernel as pure C# (it is pure JS already).

## Places

- **The workshop and basement** (`world/*.js`, `world/basement/*`): the kiln (glazes, mending), the folk, pots (breakable props), the hub,
  **the Index** (`feedback/indexmenu.js`: F, pick a room), **the course** (eight stations, laps, splits: the movement test), the movement
  lab, the lap circuits, the siege (raids for the god hand). Static geometry through `level.box` / `addGeo` / `mergeStatic`.
- **The Dunes** (`world/dunes/*`): one height function (`heightAt`, `normalAt`) that the mesh, the collider and the skiff all read; the
  wind; five **areas** (the Weir, the shore, the crystal ridges, the Gnomon flats, the ruins: `areacut.js`); crystals; geysers; the
  Gnomon (the sundial spire that keeps game hours, `solar.js`); rare finds; the barrier. Ground systems `world/ground/*`: the wake, the
  trail map (prints), the paint map, blots (spilled crude that grows and spawns a blotling).
- **The Raceway** (`world/raceway/*`, about 60 files): a park 2.6 km across of several tracks (`tracks/*`, line in `track.js`), gates,
  sun plates, rails and coaster rails, ruins, the cavern, antlion pits, vein lanes, buoys, rivals (clapperjars on mini skiffs with rubber
  banding: `rivals.js`), modes (race, hot lap, practice, pot smash, escape, licence tests: `modes.js`), cups, the City Trial, ghosts,
  flyover, rewind, the **track editor** (`editor.js`: the god hand lays a track; share codes `FF2-...`), traps (13: `progress/traps.js`,
  `world/raceway/traps.js`), the wave pool (`surf/*`) and the slope.
- **The Great Dunemaw** (`world/well/*`): a mouth on the sand; three floors laid out each game day from a seed (`wellkit.js`); a way up and
  a way down a floor; haul (a material a cleared floor); the FOE, the Great Slip Jelly (its crown cracked in stages, then its core: rules
  `progress/combat/dunemaw.js`, a timeline fight). The Wake Whistle takes you out with your haul. **The Well's board**
  (`progress/wellboard/*`): a board-game variant (a draft).
- **The blue hole** (`world/bluehole/*`): a cenote dive under the Weir's Well, 62 m deep, a sunken maze city, swimming and the harpoon.
- **Strawman's Well** (`world/strawmanwell/*`, rules `progress/strawmanwell.js`): 2D side-on stages (the body held to a plane, A/D drive,
  a side camera: modifiers on the core movement), falling-sand grid (`grid*.js`), straw dummies with Smash's percent, and **the Arena**:
  a platform fighter on Melee's rules (`fighter/*`, `progress/platformfighter.js`: percent, knockback, hitlag, DI, shields, dodges, ledges, stocks).
- **Test rooms off the Index**: the Throwing Room (aim and recoil measured: targets, Strawman, the parry range), the Touchstone (the
  Assay's standard trials: reaction, pitch and colour thresholds), the Sandbox (god-hand physics: a ball and a goal), mimicry puzzles
  (copy a shape with the god hand: `progress/mimicry*.js`), the hangar (mechs).
- **Shrines** (`docs/plans/SHRINES.md`): rest (the pool full), made whole after a shatter, fast travel, the Box's storage, the garden's door.
- **Areas and zones** (`render/areas.js`, `render/zones.js`): areas are built on entry and taken down on exit; a change of area is
  covered by a wipe (`vfx/areawipe.js`). Rooms change through a **seam** (`render/seam.js`: dip to dark, change, come back).

## The Emocean

- **The crossing** (`world/emocean/*`, rules `progress/rail/*`): a hop between islands played as a rail shooter of 100 bars of its cue.
  The stage conductor (`stage.js`) keeps the stage clock, moves the rail, holds the view (chase, above, side, free, astern) and swings
  between them; waves of foes (school, darter, carrier, heavy ... `RAIL-MODULES.md`), set pieces (the shoal, the Wreckers, Old Nobody),
  bosses (the boss hold), hazards, the lock-on (RMB: up to eight targets, release fires lances), the Astral and Umbral forms (above and
  below the surface, Q), the surge. The ship (`courier/ship/*`, five classes) bears six hits; its hull cracks per region. Score: chain,
  par, rank S..D, medals. **Mounts**: worn tools carried on the ship (`progress/rail/mounts.js`).
- **The open sea** (`world/opensea/*`, rules `progress/opensea/*`): the Emocean off the lanes at a free helm, a 9 × 7 grid of squares.
  Wind and points of sail (`wind.js`), islets with secrets and puzzles, wrecks and salvage, sea beasts that fight the ship (the serpent,
  the akhlut, the umibozu, the kraken, Jormungandr), herds to photograph (a safari), discoveries, dead reckoning, the forge.
- **Trade** (`progress/econ/*`, doc `docs/ECONOMY.md`): cubes (the only currency), crude (cargo in casks, by field), the Purser, the aim
  (480 cubes an hour of ordinary play), faucets and drains.

## Mechs (`progress/mechs/*`, `world/hangar/*`, `vfx/mechs/*`)

A giant robot the Pneuka Jar pilots: nine parts (head, core, arms, legs of four types, booster, generator, two weapons, back unit), every
number physics (`frame.js`: a = F/m, the stride as a pendulum, Froude's walking limit). Sync, battery and cable, the skate, techniques,
props to swing, joints that fracture and snap, a part's special (a god power at the frame's scale). **The toy city** (`destruction.js`,
`adobe/*`): 101 adobe buildings as 1 m voxel cells, carved by blows, collapsing on support, fire as a cellular automaton (`fire.js`).
Giants (the straw giant, the dune colossus) with barriers; smash challenges; a Punch-Out boxing ring (`ring.js`).

## Raku's Bazaar: the casino (`progress/casino/*`, `world/bazaar/*`, `world/entropy/*`)

A table engine (`table.js`: rules modules played by seats, bots and a simulator) for the owner's games: **Querent** (tarot: melds, steals,
the Fate Clause), **Astroll** dice games (Zodiac, Event Horizon, Supernova Run, Nebula Bluff, Charity Gamble), **Entropy Tactics** (a
7 × 7 tactics card game with two Major Arcana and a Grand Bomb; its bot an information-set MCTS: `entropy/*`). Chips, a coach that says
each moment plainly, the score ceremony (Balatro's count-up). All rules pure: port straight.

## Progression and records

- **The ledger** (`progress/stats.js`) and **achievements** (928: `PORT/data/progress/achievements.list.json`; tiers Easy..Grandmaster,
  points buy a standing, some give a title). Rules for log lines and counts: `feedback/tracking.js`, `feedback/tracking/*`.
- **Domains** (`progress/domains.js`, `domainladder.js`): seven skills 1..99, levelled by use; a **widening** per tool; rungs (domain arts)
  every ten; traits; the god hand's powers open by level.
- **Knacks** (`progress/knacks.js`): passive toggles opened by achievements (where assists live). **Movement Arts** (`progress/skills.js`):
  techs the System teaches. **Class arts** (`progress/classarts.js`): opened by playing as a class.
- **Spreads and classes** (`progress/spreads.js`, `laidspread.js`): Major Arcana laid in tarot spreads on the Pneuka Box's 8 × 7 grid;
  suits' tallies make modifiers and read as your class (the Fool, a court card, a zodiac Major, the World). The day's card.
- **Quests, goals, the collection log, the first today, the recap** (`progress/quests.js`, `goals.js`, `collectionlog.js`, ...).
- **Feelings** (`progress/feelings.js`): all seven start locked; each is **awakened** by an act that is that feeling (a vantage point
  awakens Wonder). **Weather** (`progress/weather.js`): an island's mood as one feeling at a strength, a spell a block of game hours.
- **Luck** (`progress/luck.js`), **dice** (`progress/dice.js`: the stones as dice, re-rolls), **the stones** (`progress/stones.js`).
- **The Codex** (B, `feedback/codex/*`): the System's book of arts, records, tools, the arcana, the collections, status charts.
- **The Pneuka Box** (P, `pneuka/*`): 56 slots, stacks to 99, storage at a Shrine, the equip list, the reading table (the loadout as tarot).

## Feedback, UI and the overlay

- **The log** (`feedback/gamelog.js`): the only narration; typing commands into it (`game.chat.add`). **Tracking** turns events into log
  lines and counts. One toast only: a title's placard; a quest's splash.
- **The overlay** (plan `docs/plans/OVERLAY.md`): the System's sight over the world: **the Sight** (top-right: compass, barometer,
  clock, the waypoint needle: `vfx/sight.js`, `progress/sight.js`), **the Lachrimeter** (bottom-right thermometer of the pool:
  `vfx/lachrimetertube.js`), creature tags (on lock-on and through the Veritome), System windows (status sheets summoned before the
  Courier), the target mark (one prism for usable, locked and read), world marks (no words). Each tool has its own small UI by the
  Lachrimeter (the cylinder, the Sondelass's guard, the brush's desk, the songbook, the reliquary).
- **The map** (M, `feedback/cartography.js`, `mapscreen.js`): the explored area; the layers.
- **UI** (`ui/*`): never stock; every window dressed in the island's dress (Clay on Anagami: glazed tiles, bisque, gold). Choice cards,
  keywords with icons, pixel art at whole-number scales (`ui/pixel.js`, palette-swapped).
- **Dialogue** (`npc/dialogue.js`): the folk's one window of words, F at one of them; lines are data (`npc/talks.js`). **Neuralese**
  (`docs/NEURALESE.md`, `npc/neuralese*.js`): the minds' conlang, 127 roots, its own script and numerals.

## Rendering and VFX

- `render/*` (3.2k): the renderer, present (480 lines upscaled), glow, toon ramp, outlines (inverted hulls), zones, areas, the light
  budget (eight point lights), the seam, graphics tiers, rest bakes and prop batches (instancing).
- `vfx/*` (119k: the largest folder): the effects library (`vfx/library/*`, named effects as data; list `docs/VFX-CATALOGUE.md`), the
  weather's look, the sky (painted spheres with an eye at the zenith; `vfx/sky.js`, `nightsky.js`, `constellations.js`), water and
  liquids (`vfx/water.js`), the caster shaders (heat haze, bubble, lightning, portal, lensing, hologram ...), every system's look (garden,
  godhand, duelview, mechs, raceway, opensea, ...). Port looks as they are needed, from the JS as spec; do not port the folder wholesale.

## Audio and music

- **Sound** (`audio/*`, 12k): all synthesized (Web Audio) in banks, one per part of the game, called by name (`sfx.gunshot()`); the
  ambience by weather and hour; zone acoustics (room, hall, cave, open, sea); positional voices. Render them to files for Godot.
- **Music** (`music/*`, 5.7k): scores as data (`music/*.js`: bars, sections, instruments), the arranger (a bar ahead of the audio
  clock, sidechain, filter sweeps), cues chosen by place and moment (`choose.js`), the mood layer (the weather heard), the rhythm mode
  (keys 1..0, note charts from a score's lead). Doc `docs/OST.md`. Port the scores' data; replace the synth band with sampled instruments.

## Co-op, siblings, debug (likely dropped)

- **Siblings** (`coop/*`): the five development divisions as AI companions in the world, called at a Shrine; `/sib` orders. **Guests**
  joined over the published page's room (web-only). Drop or rebuild on Godot's multiplayer.
- **Debug**: DEBUG and STORY saves (`game.mode`), the lend panel (switches that unlock categories without the ledger), presets (moments
  of play as data: `src/debug/presets.js`), the tuning panel (Tab: live sliders over `T`), debug chests. Keep the tuning panel idea (an
  in-game inspector over the Tuning resource); the rest is optional.
