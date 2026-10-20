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
   The muzzles are named on the models (Calissa's). Until a model has one, the runtime fires from the body's centre, and the sweep's
   check "every shot spawned on a muzzle on screen" fails for that kind by name, so the gap is a list (Petra, 2026-10-20). Shot pools
   today: plain 192, outlined 24 (`shots.js` CAP); the budgets in rule 6 fit under them.
3. **On the beat, told a beat before.** A pattern fires on the cue's grid (a sixteenth at most). Its tell, a muzzle flash and the
   enemy's firing pose, comes one beat before, plus a sound (Wanda). This fixes "out of sync". With the Radar mount the tell comes two beats before.
4. **Nothing fires** in an enemy's first half real second in view, during a swing, or in the last bar before one.
5. **Each module owns its reticle.**
   - Chase: a free cursor.
   - Side: a fixed point ahead of the ship along the scroll.
   - Overhead: none (no lock-on there, §2).

   A swing hands the lock-on over by clearing it: locks are released as lances before the swing's bar, never carried across. This fixes
   "the reticle locks or breaks when the view changes".
6. **A shot budget a module**, so performance is a rule and not a hope: 40 hostile shots on screen in chase, 120 in overhead, 60 in
   side. Shots are instanced (one draw a kind).
7. **Every enemy flies a path you can read.** It enters along a curve, holds, fires, and leaves. Its class shows in its silhouette.
   Formations fly as one (the flock).
8. **Each module plays alone first**, as a practice leg of 16 bars: one module, its waves, no swings. That gives a QAIS test a module and
   a sweep check a module (no NaN, nothing out of bounds, every shot spawned on a muzzle on screen). Swings are added only once all three pass.

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
  - fires forward up the scroll while LMB is held;
  - flips Astral and Umbral with Q.

  No lock-on here (Calissa and Dovina, 2026-10-20, under the owner's "most performant" rule): the eye belongs on the hurtbox and the
  patterns, and the lock-on stays chase's own.

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
  - paints with the fixed reticle ahead;
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

**Agreed between the divisions** (2026-10-20; the owner may overrule):
- Overhead has no lock-on: gun, Bomb and forms only.
- Astern stays parked; if it returns, it is a camera move inside chase.

**Still open:** the shot budgets, which are guesses until `npm run perf` measures them.
