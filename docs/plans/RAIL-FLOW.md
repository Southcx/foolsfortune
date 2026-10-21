# The crossing's flow: from a slip and slide to Magic Mountain

Dovina's plan, 2026-10-21. The crossing's modules (RAIL-MODULES.md) built the parts; this plan is about how they play together, bar to
bar. Every number below has its reason beside it; where a number is a first guess it says so.

## 0. What the owner said, and what is measured

The owner, 2026-10-21, after playing v254:

> "the pacing just feels so awful. Enemies are far too few in number, there's often a ton of dead air time in each segment, and it feels
> like all the enemies aren't designed in a way that accommodates the multiple shmup styles [...] The ingame implementation also
> disregarded the shot indicators that Calissa came up with. [...] maybe we should rethink having them flee based on a time metric and
> make the player have to properly fight it out? Taking a boss down in 10 seconds feels quite lame. [...] the pacing is like an awful
> staccato of the one or two enemies being obliterated or escaping before getting any idea of what they do, followed by multiple seconds
> of dead air [...] It should feel good blasting into a voxel boid swarm and clearing out dozens of enemies. It should feel good breaking
> parts off a boss through targeted shots and affecting its behavior. The whole path of the crossing should be smooth and flowing.
> Seamless transitions are key. This especially includes how enemies appear onscreen."

Measured on v254 (`schedule` at strength 1, one new foe counted where a wave or a director enters):

| leg | bars | foes a minute | bars with no new foe | longest run with none |
|---|---|---|---|---|
| shoal | 96 | 67 | 77 of 96 | 43 bars (65 s): the peak is one director |
| wreckers | 112 | 31 | 89 of 112 | 55 bars (83 s): the brig alone |
| leviathan | 128 | 45 | 108 of 128 | 63 bars (95 s): Old Nobody alone |
| eyewall | 80 | 34 | 62 of 80 | 11 bars |
| graveyard | 96 | 73 | 68 of 96 | 9 bars |
| maelstrom | 96 | 51 | 70 of 96 | 9 bars |
| bounty | 112 | 77 | 73 of 112 | 9 bars |
| calm | 48 | 0 | 48 of 48 | all of it |

**Why it reads as staccato.** Five causes, each measured or found in code:
1. **The pacing law assumed foes linger.** `REACH.wave = 6`: a wave was counted "in reach" for six bars. A school of eight at Guppy class
   (1 hp each) falls to the gun (a shot each sixteenth) in about one bar. So a wave every 3 or 4 bars leaves 2 or 3 bars of nothing,
   and the law's check passed anyway.
2. **R17's stretch doubled the bars and not the foes.** Every phase was made twice as long for readability (2026-10-09); the waves
   kept their spacing, so the density halved.
3. **The peaks are one body.** A director's peak spawns nothing else, and the bosses leave on a bar count (the brig limps off, Old
   Nobody sounds at bar 96, Charybdis is "driven off" when the peak ends).
4. **The roster never reached the legs.** The real legs use three of the sixteen foes (school, darter, heavy); the other thirteen live
   only in the showcase crossing.
5. **The formations were written for the chase camera.** `waves.js PATHS` (line, vee, pincer, ring) lay a wave across x and down z; in
   overhead and side they stack in depth, off the play plane, hard to hit. The roster's own moves (`foemoves.js`) are framed per view;
   the formations never were.

## 1. The laws of flow (they replace the pacing law and R17's stretch)

Prior art: Star Fox 64 (a stage is a continuous stream of scripted waves, Corneria about 150 foes in 3 minutes, the next wave on its
way before the last is gone), Rez (layers that never stop, a lock-on of 8 always fed), Panzer Dragoon (foes enter on curves from the
edges of the view), Galaga (the entrance dive into formation), Ikaruga (chain waves that arrive as the last falls), Left 4 Dead's
director and Geometry Wars' spawner (pressure held to a floor, not to a clock).

1. **The stream.** A phase is no longer a list of waves on bars; it is a **queue** of waves and a **floor**: the fewest foes in frame
   the phase allows. The runtime keeps the floor: when the live count falls below it, the next wave in the queue enters on the next
   beat (a quarter bar), whatever its bar. A wave's bar is the latest it may wait, never the earliest. Floors (first guesses): open 6,
   build 10, peak 8 beside the boss, release 12 of lights. So clearing fast brings the next wave fast: skill pulls the stage forward,
   as in Ikaruga.
2. **No dead beat.** Outside a swing, never a beat (0.375 real s) with nothing to shoot in frame. Within a swing (one bar), the swing
   carries **a flourish**: targets that cannot fire (lights to lock, a passing swarm) flown through the turn, so the camera's move is
   shot through, never waited out. Patterns stay clear of a swing, as now; foes do not.
3. **Every foe enters from off the frame.** Never spawned in view. It flies in from the edge its formation names, along a curve, over
   half a bar to a bar (Galaga's entrance, Panzer Dragoon's edges), and its edge mark shows a bar before (section 4). It leaves the same
   way if it lives: off the frame, never fading.
4. **Formations live in the play plane.** A formation is written in the plane's two axes (across, along the scroll) and laid into each
   view by its frame (CARRIER_AT's box), as the roster's moves are. In chase the plane is the screen; in overhead the sea; in side the
   wall. A foe is never off the plane the gun shoots in.
5. **Overlap, not handover.** A phase's last wave and the next phase's first are on screen together; a phase boundary never empties the
   frame. A leg's release flows into the turn's flourish, the turn into the next leg's open.
6. **A swarm in every leg.** At least one **swarm** a leg (section 2): dozens of one-hit bodies through the frame, the lock-on's feast.

## 2. The swarm

The voxel boid swarm the owner asked for: a flock of 24 to 48 small bodies (one hit each, the school's Guppy hp 1) that pours through
the frame as one shape, banking and splitting (Reynolds' boids, the flock the shoal is made of: `creatures/ai/flock.js`). It fires
little or nothing; its danger is its body (contact hurts, as a rammer's). What it pays is the feel: dozens downed in a second, the
lock-on's eight released into it, chains (score.js `chainHit`). Shapes: a **river** (a band across the frame), a **ribbon** (a
helix that wraps the ship's lane), a **bloom** (it bursts from a point and scatters). One body draws them all (a prop batch: one draw
call), Calissa's voxel look.

Counts by phase: open 24, build 32, peak 48 (one swarm a minute at least, more in the shoal's leg, which is the swarm's own).

## 3. The roster in the legs

Each leg's open teaches **two** roster foes alone (a turret, then a sweeper); its build pairs them with their answer's opposite and
adds a swarm; its peak is its boss with **adds** (escorts, a spawner's schools) so the boss never stands alone. Which foes go where
is `legs.js` (Dovina's); the counts follow the floors.

## 4. What the player sees before it happens (Calissa's markers)

Calissa's mock (v4) carried a legend; each is now a rule, and the runtime emits what each needs:
- **the edge mark** for **every** wave, a bar before it enters, on the edge it enters from (the game has it only for the ambusher);
- **a part** lined in gold while it can be hit, crazing as it is hurt, gone when broken (bosses and gunships);
- **the shot's kind** in its look (Astral white-hot, Umbral black, outlined wears the parry mark), and **the hurtbox** drawn in the hull;
- **a windup** on every thrower (its tell), and the rail's telegraph mark on a boss's part about to act.
Which of these are built and which are missing is in section 8 (the audit, 2026-10-21).

## 5. Bosses: fight it out

1. **No timer.** A boss leaves only when beaten. The cue holds its peak (a section that loops on the bar, Wanda's arranger, as an
   encounter's hold does) until it falls. If the ship fails, the crossing's continue applies as now.
2. **Parts change it.** Every boss has 3 to 5 parts. Each part owns one attack; breaking it ends that attack and moves the boss to its
   next **phase** (Star Fox 64's bosses, Skies of Arcadia's ships): a new pattern, a new move, a weak point bared. The core opens only
   when its guard parts are gone. The parts are lined in gold (section 4).
3. **Length.** An expert about 45 real s, a good player about 75, a novice about 2 minutes (section 11: about twice an Ikaruga expert's
   boss). Measured against the gun's rate: an expert deals about 39 shots a bar (26 a second, Petra's charybdistest), so a boss is
   1100 to 1300 shots across its parts and core (`BOSS.shots`).
4. **Enrage, never flee.** Past 3 real minutes a boss quickens (its patterns' `every` shortened by a third), so a long fight still ends,
   never by leaving.
5. **What it pays** follows how it was beaten: every part broken first pays its part bonus; the old "driven off" outcomes go.

## 6. Foes that fit three views

1. Every motion in the play plane (law 4).
2. **The escort's orbit:** in the play plane, a radius of 6 m (its charge's hurtbox plus a ship width, so a shot aimed at the escort
   does not glance off the gunship), a turn in 2 real s (fast enough to read as an orbit, slow enough to lead), the shield link drawn.
3. A foe's hurt sphere is never smaller than its silhouette at 480 lines.

## 7. Who builds what

| what | who |
|---|---|
| this plan; `legs.js` rewritten to queues, floors, swarms, the roster; boss numbers (`setpieces.js`); the flow check | Dovina |
| the stream in the leg runner (floor, queue, beat), entrances from the edge, formations in the plane, the swarm's runtime (flock), bosses held until beaten with parts that change phase, the escort's orbit | Petra |
| the swarm's voxel look, the edge mark for every wave, the gold-lined parts, the missing markers (section 8) | Calissa |
| the boss's held section looping until it falls; the swing's flourish in the cue | Wanda |

## 8. The audit (2026-10-21, v254: code read, not played)

**The markers.** Built and wired: the shot's kind in its look (Astral, Umbral, outlined with the parry mark: `vfx/railshots.js`), the
hurtbox, a beam's warning thread, the muzzle tether (a line from the thrower to each new shot for 0.35 real s), the rail's telegraph mark
on a part about to act and on every pattern's windup (`legrunner.js`), the ambusher's edge mark, the mine's burst. **Missing:** the edge
mark for every other wave (it is called only from the ambusher's move; the mock had it on every wave, RAIL-MODULES.md 5.3 asked it for
the pincer and the darters); a part's gold line and its crazing as it is hurt (the mock's "part" legend); an off-frame arrow for a
shot or foe coming from outside the view.

**The bosses, as they leave today.**
- The brig: hull 420, six ports of 5, four slings of 8; she closes at 30 bars of her 48 (`pirates.js`: `rel >= 30`) and limps off
  unbeaten, paying nothing; the peak's last 18 bars are carriers.
- Old Nobody: its body cannot be hurt; four gills of 34, open two bars in four and only while abreast (10 bars); six teeth of 4 in
  the maw; the throat only by parried spits; felled about one run in five for an expert, else driven off at the leg's end.
- Charybdis: 480 in one sphere, no parts in play, about 12 bars (18 s) for an expert, driven off when its peak ends.
- The Conductor: 4 hit points, one lance.
- A heavy: 12 at Barracuda class, holds 8 bars then leaves unpaid.

**The escort's orbit.** 4 m by 2 m, a turn in 10.5 real s, always laid in chase's x and y: overhead it is a flat sweep, from the side a
2 m bob. Fixed in the roster (6 m, 2 s, the play plane); the runtime lays it (Petra).

**Entrances.** The roster's moves already come in from off the frame; the school's formations start off the frame in chase but are laid
in chase's axes in every view (cause 5). No pop-in found apart from the `dash` path when a darter has no move.

## 9. What changed in Dovina's files (2026-10-21), and what waits

- `legs.js`: every leg rewritten to the stream. Each phase has a `cycle` of waves about a bar apart (its queue) and a floor (`FLOORS`);
  every leg has a swarm or more; the roster's foes are in the legs, each in a view it flies in; each swing carries a flourish of
  lights. The pacing law (`idle`, `REACH`) is gone; `flow` plays the floor's pull and `deadBeats` counts what is left.
- Measured (`deadBeats`, a good player killing as foes come): no run of two empty beats in any leg at any class, stormed or not;
  130 to 330 foes a minute (was 31 to 77). At the bars alone, before the runtime's pull is built, the worst gap is 7 beats (2.6 real
  s; was 95 real s) and 120 to 160 foes a minute.
- `showcase.js` ROSTER: the `swarm` row; the heavy x8 and the gunship x4 their class's hit points (mid-bosses, not one-burst kills),
  the turret x3; the heavy and the gunship hold until beaten; the escort's tether 6 m, a turn in 2 real s, in the play plane.
- `setpieces.js`: the boss law (`BOSS`); the brig 720 + 240 + 240 (1200); Old Nobody's gills 100 open three bars in four, teeth 30, the
  throat 500 by the gun once the gills are shut; Charybdis 640 at its core, six eyes of 40, two combs of 160 (1200); the Conductor 40, hurt only
  while its ball is scattered.
- `scripts/legs.mjs`: the flow check, the view check, the bosses' size.
- **Waits on the runtime (Petra)**, and lands with it, never before: the boss numbers above are three to four times what they were, and today's
  directors still leave on a clock, so merged alone the bosses would limp off unbeaten every time.
- **Stale:** `scripts/rail.mjs` still models the pre-stretch 34-bar pieces (the audit); par is re-measured once the stream plays.

## 10. Voxels and boids: the tech under the spectacle (the owner, 2026-10-21: "we really do need voxel-based tech and boids in order to support the spectacle I envision")

A proposal for Petra and Calissa to answer before anything is built. What exists: the flock (`creatures/ai/flock.js`, CPU, a spatial
hash, 800 boids for 0.66 ms a frame with a stride of 3: `node scripts/flock.mjs`), the shoal's instanced glints (one draw call), the
god hand's voxel grid (`godhand/voxels.js`: density voxels meshed smooth as clay, not cubes). The budgets (ARCHITECTURE.md): 450 draw
calls, 1,000,000 triangles, 200 shader programs.

1. **One voxel batch for the crossing** (render, Petra; its look, Calissa): every cube of the crossing in one instanced draw: a unit
   cube (12 triangles) a voxel, its place, size, colour and a birth time and velocity per instance. Debris moves in the vertex shader
   (ballistic from its birth: no CPU a frame per voxel), so tens of thousands cost one call. 20,000 voxels are 240,000 triangles, inside
   the million.
2. **Voxel deaths** (Resogun's and Nex Machina's): a foe downed bursts into its voxels: its body baked once to a voxel set (from its
   mesh at boot, or authored), thrown out from the hit's point, tumbling, fading into Lachryma motes. A boss's part broken throws its
   chunk off whole first, then crumbles. The hit itself chips voxels off where it lands.
3. **Voxel boids** (the swarm): each boid a small cluster of voxels in the batch (2 to 8), its flock on the CPU flock up to 800; past
   that, the flock on the GPU (three.js's GPGPU birds: position and velocity in float textures, ping-ponged a frame) for thousands.
4. **Budget to measure**, never assumed (Ambition first, cost after): `npm run perf` on the showcase crossing with a swarm of 48, a
   boss breaking, and 400 shots in flight.

Questions for Petra and Calissa: (a) the batch in `render/` (Petra) with its material in `vfx/` (Calissa), or one module? (b) bodies
baked from Calissa's meshes, or the rail foes rebuilt as voxel models (a look change: Calissa's call)? (c) CPU flock to 800 first and the
GPU flock only if the owner wants more, or GPU from the start?

**Calissa's answers (2026-10-21), building now:** (a) the voxel look a `vfx/` module of hers; (b) baked at boot from her meshes, not
rebuilt: the intact foe stays a model so it reads at 480 lines, and only its ruin is cubes (Resogun's rule): a death bursts the body, a
hit chips a few voxels where it lands, a part breaks off whole then crumbles. An opaque lit cube in the body's colours with an emissive
edge in the foe's feeling, its last fifth glowing out into a Lachryma mote; the labradorite film only on the edge at a grazing angle;
moved in the vertex shader, one draw call. (c) The CPU flock first, up to 800. A swarm boid is 2 to 8 cubes (a fry, a mote-moth) with a
wagging tail cube and a bright rim; the river a band about 3 boids deep, the ribbon a helix down the lane, the bloom a ball bursting
from one point and regathering; each shape gets a wider edge mark with a second ring a bar ahead. Petra's answer on (a), the batch's
home in `render/`, is still open.

## 11. Against the genre (the owner, 2026-10-21: "Cross-reference your decisions with the density of other famous shmups")

What the famous ones field, from counts players and tool-assisted runs keep, set against ours (`flow`, `deadBeats`):

| game, stage | foes downed | a real minute | source |
| --- | --- | --- | --- |
| Star Fox 64, Corneria | 359 (a real run), 403 (tool-assisted) | about 80 to 110 | videogameschronicle.com's medal guide; tasvideos.org/8050S |
| Ikaruga, chapter 1 | the chain counts | 80 and more | shmups.wiki/library/Ikaruga; shmups.system11.org (p=369467) |
| Galaga, stage 1 | 40 | about 40 | strategywiki.org, Galaga |
| **ours, at the bars alone** | | **93 to 119, and 16 to 47 swarm bodies on top** | `flow` with no pull |
| **ours, the floor's pull, aim perfect** | | 234 to 295 (foes, swarm aside) | `flow` |

- **Density: Star Fox 64's, with the swarms on top.** The bars alone match the genre's busiest rail shooter; the floor's pull only adds
  as fast as the player kills, so a good player's crossing runs above Star Fox and a novice's never drowns. The perfect-aim ceiling is
  two to three times the genre's, and a real player never reaches it: the ceiling is their own kill rate.
- **The pull's gap stays half a bar.** At 0.75 or 1 bar, the queues starve between pulls and about a thousand runs of dead air come back
  across the legs and classes (`deadBeats`); at 0.5 there are none.
- **Bosses: fought out, about twice an Ikaruga expert's.** Ikaruga's bosses fall to experts in 17 to 25 real s inside a 100 s limit, and
  the arcade's (Ikaruga, Cave's, R-Type's) time out and leave. The owner wants them fought to the end, as Star Fox 64's (Andross's
  parts change what he does) and Gradius V's cores, so ours never leave: `BOSS.shots` 1100 to 1300, an expert about 45 real s, a good
  player about 75, enraged past 3 real minutes (shmups.wiki, Gradius_V and R-Type_Delta).
- **Spectacle: Resogun's scale is the ceiling, not the target.** Resogun throws up to 500,000 cubes, rarely over 200,000, on the GPU's
  compute (gamingbolt.com's interview; gamedeveloper.com's postmortem); we have no compute in WebGL, so section 10 asks for 20,000
  debris voxels moved in the vertex shader (one draw call, 240,000 triangles). The swarm's flock on the CPU holds 800 in 0.66 ms;
  three.js's GPGPU birds (examples, webgl_gpgpu_birds) hold 1024 and more, the path past 800.
