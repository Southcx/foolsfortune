# Key poses and holds: the animation pipeline

South, 2026-10-31:
- "Use the research on SSBM and SSB Brawl and coordinate with Calissa to improve our animation and locomotion systems. I'm thinking we
  start using more strong key poses and multi-frame hold poses rather than just IK and pose blending."
- "Loop Petra in too then, I think we can come up with a better animation pipeline that is better suited to an LLM's ability to parse
  still frames. Strong key poses and holds are the answer!"

A draft. Sections 6 and 7 wait on Petra's and Calissa's answers (docs/handoffs/everyone/2026-10-31-from-dovina-key-poses.md). The
research behind it, every number with its source: the key-pose research (Smash's hitstop, Guilty Gear Xrd, Spider-Verse, Overgrowth,
fighting-game posing, engine patterns) and the Melee mechanics research, both kept with this plan's round.

## 1. Why key poses

Today a move is a clip blended into the pose tree, and IK corrects it. A blend is a curve: nobody can judge it from one frame, and an
LLM can't judge it at all. A key pose is a still. It can be rendered, laid on a contact sheet with its neighbours, and judged the way South
judges a screenshot ("would this make sense to a human?", CLAUDE.md). Timing becomes numbers in a table: hold 3, snap 2, hold 6. Anyone
can read them and change them, and every division can review a move without playing it.

That is also how the games we are copying are built:

| prior art | what it does | what we take |
|---|---|---|
| Smash (Melee, Brawl, Ultimate) | attacks read as a lead-in, a held impact and a recovery; both bodies freeze at the hit (hitstop) and the victim shakes | the attack as three key poses; hitstop as a held pose (section 3) |
| Guilty Gear Xrd (Arc System Works, GDC 2015) | 3D characters keyed every frame like drawings, no in-betweens, the game itself at 60 fps | the stepped stage over a full-rate world (section 4) |
| Spider-Verse | on twos for a clumsy character, ones for a skilled one; smears for one or two frames only | the rate follows intent; smears rare and short |
| Skullgirls | jump straight to the attack's key pose, let hair and cloth follow through; cancel after the key pose | the key pose first, follow-through at full rate |
| Overgrowth (David Rosen, GDC 2014) | locomotion from a handful of key poses with spring-like interpolation, started from the current pose | later: a run as two poses a leg (pass, reach) (section 5) |

## 2. The model

A **key pose** is one still of the Courier (or any rig), named. A **pose sequence** is a move written as key poses:

```
jabA: [
  { pose: 'jab.lead',   hold: 3, ease: 1 },   // the lead-in: drawn back (Sakurai's "lead-in")
  { pose: 'jab.strike', hold: 2, ease: 1, active: true },   // the hitbox is out on these frames
  { pose: 'jab.follow', hold: 6, ease: 3 },   // the recovery, follow-through on hair and cloth at full rate
]
```

- `hold`: frames at 60 per real second the pose stands.
- `ease`: frames of snap into it from wherever the body is (2 to 4 for attacks, Sakurai's 4 into a flinch).
- Gameplay reads the sequence's numbers (startup, active, endlag), never the drawn pose: a hitbox comes from the move's data.
- A pose comes from an existing clip at a chosen frame wherever one fits (CLAUDE.md: an existing clip for every movement), so the
  library is mostly a list of names pointing into the suite. Section 7 settles the format.

## 3. Hitstop: the first piece (the best documented, the cheapest)

| rule | number | source |
|---|---|---|
| both bodies freeze at the hit | attacker on its strike frame, victim on its flinch's first frame | SmashWiki, Hitlag |
| how long | Melee: floor(d / 3 + 3) frames for d damage (15% gives 8); capped at 20 | SmashWiki, Hitlag |
| the shake | the drawn body only, the hurt capsule still; side to side on the ground, up and down in the air; decaying over the freeze; scaled by camera distance | Sakurai's Famitsu column 490; his "Eight Hit Stop Techniques" |
| the attacker | drifts very slightly through the freeze (can be off a move) | the same |
| into the hurt pose | four frames of ease from the first flinch frame | the same |
| flinch poses | ground: high, centre or low, by weak, medium or strong (9); air: 3 by strength; tumble from 32 frames of hitstun | SmashWiki, Flinch |
| what it is for | a gameplay window as well as a look: cancels, confirms and DI are read during it | Dustloop; SmashWiki |

Hitstop is in gameplay time, so the fighter's kernel owns its length; the freeze and shake are the look.

## 4. The stepped stage

A stage after the pose tree that holds the pose for N frames, then jumps to the next (ones, twos, threes), with:

- **at full rate always:** the capsule and the body's root motion, the camera, effects, hair, cloth and tails, a held tool's
  follow-through, and anything gameplay reads (a hitbox, a tool's socket comes from the unstepped pose);
- **the order:** pose tree, then the hold stage, then IK on the held pose (a planted foot's anchor at full rate), then rom.js last;
- **the rate follows intent** (Spider-Verse): attacks, landings and big moments read on twos or threes; the run stays on ones until
  section 5 has its poses (stepping a clip while the capsule glides slides the feet);
- **behind a setting**, so the core movement looks exactly as it does today with it off (CLAUDE.md: switching one off restores it).

## 5. Locomotion (later, after the Arena proves the pieces)

- Jumpsquat and landing as held poses: 3 to 4 frames each (Melee's), tied to the state machine. The Arena does this first (FIGHTER.md).
- Dash start and pivot as key poses.
- A run from two poses a leg, pass and reach, with critically damped interpolation from the current pose (Overgrowth's way), as a
  second option beside the mocap run, compared in play.

## 6. Runtime (Petra's): open

Waiting on Petra's answers: where the hold stage and the hitstop freeze sit in `courier/anim/animator.js`'s pipeline; feet over a stepped
body; what stays at full rate.

## 7. The pose library and the contact sheet (Calissa's): open

Waiting on Calissa's answers: the key pose's format (a clip's frame by name and number, as `MUDRA_FRAMES` are, or solved rotations as
data); whether the Anim Lab and the pose audit render a move's key poses as one contact sheet, front and side, hold counts under each;
which moves she would re-pose first.

**The contact sheet is the review**: one image a move, its key poses left to right in order, front row and side row, each captioned
with its name, hold and ease. A division judges a move from the sheet, and South can too, without playing it.

## 8. Who does what

| piece | who |
|---|---|
| the plan, the moves' sequences as data (holds, eases, active frames), hitstop's length (the fighter kernel) | Dovina |
| the hold stage, the hitstop freeze and shake, the pipeline order | Petra (`courier/anim/`) |
| the pose library, the contact sheet, re-posing, smears (one or two frames, the heaviest blows only) | Calissa |
| a hit's sound on the impact frame, so the freeze lands on the sound | Wanda |
| first user: the Arena's fighter kit in Strawman's Well | Dovina's builder, on Petra's and Calissa's pieces |

## 9. Open

- The step rate's setting: one switch, or per category (attacks, landings, everything).
- Whether hitstop reaches the 3D game's blows too (the Sondelass's, the kick's) after the Arena, and at what length.
- Names: all plain until South calls them settled.
