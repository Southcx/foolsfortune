# The crossing in three modules (a plan; Dovina's rules for the mock)

**The owner, 2026-10-20 (relayed by Calissa):**
- Split the crossing into three modules: overhead, side-scrolling and chase. Each works alone before the swings join them ("if each
  mechanical element doesn't work then they certainly won't work together").
- Kingdom Hearts 2's Gummi ship sections are the north star for cinematic quality, complexity and polish.
- Enemies have clear silhouettes and movement paths, and show when they fire.
- One mockup of the refired crossing from Calissa, Petra and Dovina together.
- "Go with the solutions that are most performant": for open choices this round, the cheaper path wins.

**Who owns what** (Calissa's proposed split):
- **Petra:** the play plane, the ship's bounds, the reticle, and the emitters' runtime.
- **Dovina:** the patterns, the waves, the rules, and this breakdown's rules.
- **Calissa:** the looks, the silhouettes, the firing tells, and the mock.

This page is the rules each module's mock should show. The waves come once Calissa's shmup research lands.

## 0. The five views become three

The answer is yes: chase, above, side, free and astern shrink to **chase, overhead and side**. Three cameras to build, tune and keep
working is cheaper than five, and every act maps onto one of them:

| was | becomes | why |
|---|---|---|
| chase | **chase** | the Gummi ship's own view, and most of a crossing |
| free | chase | it was chase with a looser camera; its darters spit from ahead instead of at the camera |
| above | **overhead** | the pincer, the shoal's boil |
| side | **side** | the broadside, the serpent abreast |
| astern | parked | the brig's bow chasers move to chase (the brig ahead, coming about) or to side. If astern ever returns, it is a camera move inside chase, never a fourth view (Calissa and Dovina, 2026-10-20) |

The acts become: launch, schools, darters, the breather and the arrival in **chase**; the pincer in **overhead**; each set piece's
beats re-mapped onto the three (§4).

## 1. Rules shared by all three (what breaks the old crossing; Petra's runtime, my rules)

1. **One plane a module, and the bounds are the frame.** The ship moves in that module's plane over the whole visible frame, less an
   8% margin. Every point a shot can hit, the ship can reach, and every point the ship can reach, a shot can reach. This fixes the owner's
   "movement range is limited".
   The HUD folds to the frame's edges for the crossing (the Sight, the Lachrimeter, the log), so the whole frame is play: one rule, no
   cut-outs measured off the DOM (Petra's proposal, taken 2026-10-20). The folded HUD's look is Calissa's.
2. **Every shot leaves a muzzle you can see.** A shot spawns at a named muzzle point on its enemy's model, in that enemy's frame, as the
   enemy is posed on that frame. It is aimed within the module's plane at a point the ship can occupy: no shot aimed off the plane,
   none from off-screen. This fixes "no clear source" and "emitters offset, aiming left where they can't hit".
   The muzzles are named on the models (Calissa's). Until a model has one, the runtime fires from the body's centre, and a headless probe
   lists that kind by name, so the gap is a list (Petra, 2026-10-20). It is a probe and not a sweep check: the crossing is in flux
   (CLAUDE.md, "Test lean"). Shot pools today: plain 192, outlined 24 (`shots.js` CAP); the budgets in rule 6 fit under them.
   **Aim** is the ship now minus the muzzle now, flattened onto the plane, resolved at each release (BulletML's `aim`; research §1.3).
   A pattern is laid with up = the plane's normal, never turned by the shortest arc.
3. **On the beat, told before.** A pattern fires on the cue's grid (a sixteenth at most). Its windup, a muzzle flash and the enemy's
   firing pose, comes before it, plus a sound (Wanda), emitted as `creatures.windup`:
   - a beat before a plain shot;
   - half a bar before an outlined shot or a boss part's volley;
   - a bar before a beam (its warning line).

   With the Radar mount every windup starts a beat earlier. Everything scheduled reads the bar in closed form; nothing scheduled adds up
   `dt` (the cause of "out of sync" the research names: `PatternPlayer`'s `r.t += dt`). A foe downed in its windup cancels its volley
   and pays a little more: reading is rewarded.
4. **Foes fire only while holding.** Never on entry or exit, never during a swing or in the bar before one. A big foe never drifts onto
   the ship, and no foe holds at the frame's edge.
5. **Each module owns its reticle.**
   - Chase: a free cursor.
   - Side: the cursor on the side plane, the gun firing toward it, the lock-on kept.
   - Overhead: the cursor on the sea plane, the gun firing toward it (twin-stick: the owner, 2026-10-20); no lock-on there (§2).

   **The cursor is always the aim, in every view** (the owner's reason, 2026-10-20: "it feels really bad when you switch from chase to
   top down to have your aiming capability handicapped by a camera switch"; Calissa carried it to side). Only the lock-on differs by
   view: chase yes, side yes, overhead no.

   The reticle is derived every frame from the cursor or the ship's facing, never stored as a world point. A lock is a foe, re-projected
   every frame, and dropped with a sound when its foe leaves the frame or the plane. These two fix "the reticle locks or breaks when the
   view changes". Across a swing (Calissa's research and this plan, reconciled 2026-10-20):
   - Locks are kept into a module that has a lock-on (chase, side).
   - Locks are fired off as lances before the swing's bar into overhead, which has none.
6. **A shot budget a module**, so performance is a rule and not a hope: 40 hostile shots on screen in chase, 120 in overhead, 60 in
   side. Shots are instanced (one draw a kind).
7. **Every enemy flies a path you can read.** A wave is `{ bar, path, formation offsets, role, muzzle patterns by phase }`:
   - The path is a few keys in the play plane's own coordinates (entry, hold, exit), timed in bars and sampled by arc length.
   - Formation offsets are added in the plane after the path, so a formation turns with its leader.
   - The waves come in 5 to 7 lanes, alternating sides, none at the edges.

   One foe has one shape and one behaviour, readable as a silhouette from all three cameras at 480 lines. Colour variants are rewards.
   - **Some shots are foes:** a slow heavy shell (the Gummi's cannonball) can be shot down before it bursts.
   - **A heavy is a table of parts with HP:** the Phantom Storm's Pirate Ship is the model.
   - **The next side is announced before it arrives**, by a mark at the frame's edge and a sound (the Gummi's alert): never a threat from
     a side not announced.
   - **Shots:**
     - point the way they fly, with a bright core and a dark rim, drawn over everything;
     - are never yellow, never orange, never the player's colours.
8. **Each module plays alone first**, as a practice leg of 16 bars: one module, its waves, no swings. Each module gets a QAIS test.
   Automated checks wait until the owner calls the crossing settled (it is on CLAUDE.md's in-flux line); until then a headless probe
   reports the list. Swings are added only once all three pass the owner's play.
9. **Collision is in the plane** (distance in the plane's two axes) in overhead and side, so it matches what the camera shows. In chase
   it is 3D, with a generous band in depth.
10. **No projectile is on screen during a swing** (the owner's R17, restated 2026-10-20). Every shot alive when a swing begins is
    cancelled into Lachryma there and then, motes the ship absorbs into its pool (the owner, 2026-10-20), and nothing fires until the
    swing ends. Motes are pickups, not projectiles; the research's other option (shots flying on as scenery) broke R17 and is gone.
11. **The camera is never the player's at sea** (the owner, 2026-10-20): every swing is authored on its bar; no leg hands the turns to
    the player (the Gummi's Mission 3 is not taken).
12. **A graze pays Lachryma to the pool** (the owner, 2026-10-20), capped a bar so a pattern can't be farmed:
    - it counts a shot that could hurt (not one of your form, unless outlined) passing within three hurtboxes of the ship without touching it;
    - once a shot;
    - it pays 1 to the pool, at most 8 a bar (`GRAZE`, shotfield.js; `T.ship.graze`, the stage's).

    Absorbing a shot of your form pays 2, so a graze is worth half of one.

## 2. The three modules

### Chase (Star Fox 64; the Gummi ship)
- **The player:**
  - moves in a box on the screen;
  - aims a free cursor;
  - holds LMB for the stream;
  - holds RMB to paint up to 8 targets, and lets go to fire a lance at each;
  - presses E to roll, which turns an outlined shot back in its window;
  - boosts with Shift and brakes with C.
- **What threatens:**
  - waves from ahead and from the sides along visible curves;
  - aimed shots (at where the ship is when the shot fires: no lead, at first);
  - outlined shots for the roll;
  - obstacles placed so position matters: rocks, flotsam, the Wreckers' rigging;
  - a heavy with parts (Rez, Panzer Dragoon).
- **The mounts that matter:** Blaster, Grapple (loot, boarders), Flash (opens a heavy's parts), Radar, Vacuum.
- **The mock shows:**
  - a school of eight in a line, swept by one lock-on;
  - a darter wave spitting outlined shots from ahead, rolled back;
  - a heavy with three parts, its muzzles flashing a beat before each volley.

### Overhead (Ikaruga, DoDonPachi)
- **The player:**
  - moves over the water seen from above;
  - aims twin-stick: the gun fires toward the cursor on the sea plane while LMB is held (the owner, 2026-10-20);
  - flips Astral and Umbral with Q.

  No lock-on here (Calissa and Dovina, 2026-10-20, under the owner's "most performant" rule): the lock-on stays chase's own.

  The forms matter most here: Ikaruga's polarity was made for this view.
- **What threatens:**
  - patterns, kept lighter than real danmaku: an aimed shot, a fan, a ring, a stream, from formations on visible paths (the pincer
    from both sides);
  - the hurtbox: small, drawn as a pale core and a dark ring, so grazing reads.
- **The mounts that matter:** Bomb (clears every shot round you), Absorb (eats shots of your colour), Vacuum.
- **The mock shows:**
  - a pincer from both flanks;
  - a fan and a ring passing round the hurtbox;
  - one Bomb clearing the screen;
  - a form flip drinking a wave of shots of your colour.

### Side (R-Type, Einhänder)
- **The player:**
  - moves up, down and along in the wall plane;
  - fires along the scroll;
  - aims with the cursor on the side plane (the cursor is always the aim) and paints with the lock-on;
  - presses Q to cross the surface: above it is Astral, below it Umbral. The waterline is the floor, and the one line that changes the world.
- **What threatens:**
  - enemies from ahead, and now and then from behind, told by a mark at the frame's edge a bar before;
  - broadsides: gunports open a bar before each volley;
  - boarders swinging across;
  - terrain: the swell's crest as a moving floor, wreckage to fly round.
- **The mounts that matter:** Grapple (yanks boarders off), Flash, Blaster, Bomb.
- **The mock shows:**
  - the brig's broadside: the gunports opening a bar ahead, the volley, boarders on ropes;
  - the dive under the volley to the Umbral side and back up behind it.

## 3. The Gummi ship, what we take

- **Cinema in the swings:** the camera's move between modules is authored, a bar long, with nothing firing, and the music's section
  change on its bar line.
- **The run as routes:** a branch or two chosen by where you fly; this is the sea chart's waypoints already.
- **Bosses as parts.**
- **A score at the end** (the tally).
- **Not taken:** the Gummi editor (our ships are fixed hulls with mount slots), and its density of trash enemies (the performant path).

## 4. What changes in my files once the mock is agreed

- `progress/rail/crossing.js`:
  - `VIEWS` goes to three;
  - `ACTS` and every set piece's beats are re-mapped as in §0;
  - a practice leg a module, 16 bars.
- `progress/rail/patterns.js`: each of the 28 patterns tagged with the modules it fits. A pattern aimed in a plane a module does not
  have is dropped from it.
- The waves a module, from Calissa's research's breakdown.

Each of these is a separate push, after the mock.

**Fixed now in Dovina's files** (2026-10-20; the owner's bugs, Calissa's measurements; CASEBOOK, "The crossing's patterns leaned left"):
- **Aim:** a cone's angle is off the aim, rings only spread in the cone.
- **Plane:** patterns are turned into the view's plane (`orient`, `up`).
- **Grid:** the volleys are on the sixteenth, and the player reads the leg's bar.
- **Throwers:** in frame, or a **carrier** (a placeholder body, `CARRIER_AT`) that comes in, holds, fires and leaves.
- **Windup and swings:** each play has a windup on the telegraph mark, and nothing fires into the bar before a swing.
- **Cage and roles:** the cage closes at the true range; the shoal's glints throw.
- **Old Nobody's peak:** in the side view.
- **The fairness check:** judges as thrown, in all three views.

This came before the mock because these were the owner's bugs, not the new design. The waves and the module split still wait for it.

## 5. Calissa's mock v1, checked against these rules (2026-10-20; https://claude.ai/artifact/FHfYKA9ktYJYtFRjb5bNb1)

**Kept as the rules say:**
- every release on the sixteenth, inside its foe's hold, none in bar 15 (the mock checks its own data);
- the bounds are the frame less 8% (0.92);
- no lock-on in overhead; locks fired off into it;
- windups of a beat, half a bar for outlined shots and parts, a bar for the brig's ports;
- the budgets 40, 120, 60;
- collision in the plane in overhead and side;
- the old plane's shots become motes on a swing (pending the owner);
- shots in rose and violet, never yellow, orange or the ship's colours.

**The side's broadside is umbral, and stays so:** above the water the astral ship is hurt by it, so the dive is the answer.

**To change for v2:**
1. **Keys are the game's** (RAIL-OVERHAUL.md 3; `courier/ship/ship.js`): E the roll, Q the forms, Shift boost and C brake, R the surge,
   and the mounts on 1 and 2. The Bomb is the Crucibelle's mount, on its slot's key; Space is unbound. The mock should test the binds
   the game ships.
2. **Score is the game's** (`progress/rail/score.js`):
   - a down by class (fish 100, darters class 1: 300, the heavy class 2: 1,000, its parts as `SCORE.part`);
   - the chain of three of one feeling;
   - the volley.
   The mock's 0 to 30 "medal" meter is our chain:
   - a hit breaks it (`chainHit`, new);
   - "medal" stays Star Fox's, a stage passed with four in five downed (`medalOf`).

   A down in its windup pays `SCORE.windup` (x1.5, new).
3. **Announce every side but the scroll's far edge:**
   - the overhead pincer (from both flanks);
   - the chase darters (from the left);
   - each gets its edge mark a bar before, as the side module's skimmers from behind do.
4. **The carrier** (`legrunner.js`) goes in with its look, where a pattern has no thrower.

## 6. The enemy roster (2026-10-20; the owner, through Calissa: "a feature-complete set of enemy ship types")

**Prior art:**
- the genre's canon roles, from Calissa's research;
- Cave's and Toaplan's wave tables;
- the Gummi ship's foes;
- the rule that one foe is one shape and one behaviour (rule 7).

**What each foe is for:** 16 foes, each teaching one answer, so the roster is "complete" when every verb has a foe that asks for it: the gun,
the lock-on, the roll, the forms, the Bomb, a mount, and moving.

**How each column reads:**
- **Class** is an offset on the waypoint's base class (`ROLE_CLASS`, econ/emocean.js: Guppy 0, Barracuda 1, Marlin 2, Whale 3, Leviathan 4).
- **HP** is `WAVES.hp` at that class, `[1, 3, 12, 40, 150]`, times the row's factor.
- **Pay** is score only, `SCORE.cls` at that class (100, 300, 1,000, 3,000, 10,000), plus its parts. A crossing pays no cubes.
- **Fires** names patterns of the library (patterns.js), at the windups of rule 3.
- **Path** is in the play plane's keys (entry, hold, exit, in bars, rule 7). Every foe fires only while holding.
- **Views:** C chase, O overhead, S side.

| foe (plain name) | class | HP | fires (while holding) | path | views | teaches |
|---|---|---|---|---|---|---|
| **school** (popcorn; built) | +0 | x1 | now and then an aimed single; the pincer's flank a fan of 3 | a line, vee or pincer of 6 to 8, in and out in 4 bars | C O S | the gun, and the lock-on's sweep |
| **swooper** | +0 | x1 | one oddFan of 3 at its arc's apex | in from an edge on an arc through the frame, out the far side; it never holds, so it fires once, at the apex (its hold is that instant) | O S | moving |
| **darter** (built) | +1 | x1 | aimedBurst of outlined shots | dashes to a hold on a flank, holds 2 bars, dashes out | C S | the roll |
| **rammer** | +1 | x2 | nothing: it is the shot. A beat's glow aft, then it charges where you were (frenzyDash's motion) and passes through | holds at range, charges, leaves past you | C O S | timing: downed in its windup, it pays x1.5 |
| **sniper** | +1 | x1 | one aimed beam: its warning line a bar (sweepBeam with from = to = 0), then it burns | holds at the frame's far edge, 4 bars | C O S | stepping off the line |
| **ambusher** | +1 | x1 | an oddFan of 5 as it passes | from behind (side: the left edge; overhead: the bottom edge; chase: a flank), always announced by its edge mark a bar before (rule 7); overtakes and leaves ahead | C O S | reading the edge marks |
| **turret** | +1 | x2 | rotatingRing or aimedBurst | none of its own: it sits on wreckage or a rock and scrolls with the world | O S | a fixed emitter: where to stand |
| **mine-layer** | +1 | x1 | none itself. It drops a mine each beat it crosses: a shot that is a foe (HP 1, worth 50), which bursts into a ring of 8 (speed 9) after 2 bars or when you come within 8 m (3 m left 0.16 real s to react; the fairness rule wants 0.5, and 8 m gives 0.63) | crosses the frame once, side to side | O S | clearing a lane before you need it |
| **escort** (the shield escort) | +1 | x2 | a slow aimed single | flies a tether's length off the gunship or heavy it guards; while it lives its charge takes no harm (armour 0) | C O S | target priority |
| **carrier** (built) | +1 | x2 | any pattern with no thrower of its role in frame (legs.js `from`) | from the view's far edge over the windup, holds while it fires, leaves (CARRIER_AT) | C O S | that every shot has a body |
| **sweeper** (the laser sweeper) | +2 | x1 | sweepBeam: a warned line that sweeps slower than the ship can run | holds at an edge for the sweep's length | C O S | reading a beam |
| **heavy** (built) | +2 | x1 | the rings and spirals (rotatingRing, multiSpiral, rose, doubleHelix) | holds mid-frame 8 to 10 bars | O (C S as a mid-boss) | the forms: drinking a ring of your colour |
| **gunship** | +2 | x1 core + parts | its parts: two guns (stackFan, splitShell), a core opened by their loss. Parts as `SCORE.part` (port 500 a gun) | holds broadside or ahead 8 bars, the Phantom Storm's model | C O S | parts and the lock-on on them |
| **blocker** | +2 | x2, full blows while open (24 hits: one sharp opening of 3 real s, two at most) | nothing | drifts into the lane and closes a third of the frame for 4 bars; its weak point shows only to the Flash mount (the Veritome), or to a Bomb | O S | a mount: what the Flash and the Bomb are for |
| **spawner** | +1 | x3 | nothing itself: a hatch that lets out a school of 4 every 2 bars while it holds | holds at an edge 8 bars; its schools fly the school's paths | O S | the source over the swarm: kill the hatch and the popcorn stops |
| **grappler** (the boarder, anywhere) | +1 | x1 | nothing: it latches onto the hull and drags (the ship's pace x0.8, a modifier you can see on the hull) until the roll (E) throws it off, the Grapple mount yanks it off, or it is shot | swings in on a line from an edge, latches, holds till shaken | C S | the roll and the Grapple mount as cures |

**Composition caps** (Calissa's research, its own inference, so caps to test, not laws yet):
- at most 3 foe types alive at once (5 at a peak);
- 1 heavy (or gunship) at a time;
- 1 aimed foe at a time (sniper, sweeper);
- at most 8 of the popcorn (the lock-on's eight);
- no foe holds at the frame's edge (rule 4).

A 16-bar practice leg splits as: open bars 1 to 4, build 5 to 9, peak 10 to 14, release 15 and 16 with no fire (the swing).

**The bosses stay the set pieces'**: the brig, Old Nobody, the shoal's Conductor, Charybdis.

**In which legs** (legs.js, to be laid once the owner has played the mock):
- the open teaches one foe at a time;
- the build pairs a foe with its answer's opposite (a turret with a sweeper: stand still, then move);
- the peak is the set piece.

**As data:** each row is `ROSTER` in `progress/rail/showcase.js`, its path column as `moves` (arc, dash, charge, hold, overtake, fixed,
cross, tether, drift, swing) and the mine as `mine`; Petra's runtime reads them (`world/emocean/foemechanics.js`).

**Every number above is a first guess.** The simulator (`scripts/rail.mjs`) re-measures par once the roster is laid into the legs.

**The research** (Calissa's, `docs/plans/research/RAIL-MODULES-SHMUP.md` on her branch, 565d7e8) is the source of rules 2, 3, 4, 7, 9
and 10's detail; its §5 lists 23 rules, and the ones not taken here are runtime detail for Petra (pooling, inherit-by-declaration,
shared axes in a swing).

**Ruled by the owner** (2026-10-20):
1. Overhead aim is twin-stick, toward the cursor on the sea plane.
2. On a swing, live shots are cancelled into Lachryma; no projectile is on screen during one (R17).
3. A graze pays Lachryma to the pool, capped a bar.
4. No camera turns for the player: every swing is authored.
5. The chase camera is the mock's (v3.1): cam [0, 3, -5], look [0, 0, 12], follow 0.62, the ship bigger in frame; and so, at a full
   brake, the ship's floor lifts from 1.2 m to 3.1 m to keep the waterline on screen (Calissa's measure, mock v3.2). Petra's
   (`courier/ship/views.js` VIEW_RIGS.chase); the chase screen box shrinks with it, so `scripts/patterns.mjs` and `scripts/legs.mjs`
   take the new box once Petra measures it.
6. The overhead camera is the mock's (v4): cam [0, 15, -4.5], look [0, 0, 3.4]; the ship 2.5% of the frame's height, its box x ±14.5,
   z -5.4 to 20.5 (Petra's measure), half the old room. The overhead carrier holds at z 15 (`CARRIER_AT.above`), and the calm's gift
   rose was slowed to speed 7 to keep the half second to react from the nearer thrower.
7. The side camera comes about a quarter closer (Calissa's ask, the owner's yes to Dovina's "closer, but modestly": the side view is
   where beams and rams are dodged, so it keeps more room than overhead). Built: cam [18, 1.5, 3], the ship 7.5% of the frame's
   height. `CARRIER_AT.side` takes Petra's measured frame (y -2 to 12.5, z -14 to 19.5), the carrier holding at z 15; from the nearer
   thrower the brig's split shell splits at 0.5 real s (not 0.9: it split 1.6 m off the ship) and the leviathan's rose is slowed to 7
   with 30 petals (its gap and its half second).

**Agreed between the divisions** (2026-10-20; the owner may overrule):
- Overhead has no lock-on: the twin-stick gun, the Bomb and the forms.
- Astern stays parked; if it returns, it is a camera move inside chase.

**Still open:** the shot budgets, which are guesses until `npm run perf` measures them.
