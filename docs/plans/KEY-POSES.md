# Key poses and holds: the animation pipeline

South, 2026-10-31:
- "Use the research on SSBM and SSB Brawl and coordinate with Calissa to improve our animation and locomotion systems. I'm thinking we
  start using more strong key poses and multi-frame hold poses rather than just IK and pose blending."
- "Loop Petra in too then, I think we can come up with a better animation pipeline that is better suited to an LLM's ability to parse
  still frames. Strong key poses and holds are the answer!"

The plan, with Petra's and Calissa's answers in sections 6 and 7. The
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
  library is mostly a list of names pointing into the suite. Section 7 has the format.

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

## 6. Runtime (Petra's, answered 2026-10-31)

**Where it sits.** At the sample step only. A key move is still a layer writing into `base` at its weight (`courier/character.js`'s
step 1). Only how its clock maps to a frame changes. Everything after `applyPose` is a correction on whatever pose arrives, stepped or not.

- **The key track** (proposed `KeyTrack`, `src/courier/anim/keyposes.js`, a sibling of `Track`) reads the move's keys.
  - Inside a hold, it samples the clip at the key's integer frame exactly, with no lerp. The audit's still is exactly what plays.
  - Inside a snap, it nlerps the two keys over `snap` frames with an ease-out. A snap of 0 is a cut.
- **Frames are 60 Hz frames of game time**, never display frames. A 120 Hz phone and a 60 Hz desk show the same timing. The existing
  hitstop (`moveset.impact` slowing game dt) holds a key track for free: there is no second freeze mechanism.
- **A state-held pose** is the same track with its clock stopped by a predicate named in the table (`holdWhile`: the shield up, a
  landing's lag, a smash charged). The key it stops on is named too, so a hold is data, never a flag set by a hook.
- **Between moves**, a key track enters from whatever played by its first key's `snap`, in place of `Track`'s 0.15 s crossfade. A layer
  weight that steps without the table saying so is a pop, and a bug.
- **Who uses it.** Moves first: `tools/moveset.js`'s `pose()` and a tech's `animate` swap `C.sample` for the key track where the row
  carries `keys`. A move without `keys` plays as now. The core movement's gait, run, slide and their blends stay continuous (section 5
  waits on its own comparison).

**The feet.** The capsule stays smooth: physics, collisions and the camera never step; only the body's pose relative to it does.
- A key carries its contacts (`plant: 'L' | 'R' | 'LR'`). While a key move owns the legs, footIK takes those in place of the gait
  cycle's, and the foot lock holds a planted sole in the world. A stepped hip over a locked foot bends the knee; it never slides the sole.
- Root travel stays in the capsule (the move's impulse), never in the clip's pelvis.
- A free foot (in the air, a kick) is the pose's, stepped.
- The lock's 0.35 m let-go still guards a move that outruns its plant. A case of it is a table fix (a missing key or contact).

**At full rate always:** the camera; the aim (the aim layer's pitch and the spine's twist: a control's readout); a hand riding a world
target (the grapple's line, a haft); the corrections (footIK, standoff, wrists, hinges, rom.js last); effects (trails and smears read off
the stepped blade). The procedural lean, look and dip run at full rate too; a move may weigh them to 0 (one number in its row) if they
read as drift over a held pose. A key pose rom.js clamps is a pose to redo, and the audit flags it.

**The row.** One shape, read by the runtime and the contact sheet alike (section 7 has it). For the fighter's moves
(platformfighter.js `MOVES`), the holds are not chosen by eye. They come from the frame data:
- the lead-in holds until the hitbox's first frame;
- the strike holds through the active frames;
- the follow-through holds to the move's total.
The timing is then the rule's own, and only the pose is a choice.

**Cost.** A held frame skips the lerp. Nothing new runs per frame but the key lookup.

## 7. The pose library and the contact sheet (Calissa's, answered 2026-11-02)

**The house's prior art is Strawman.** Its moves are already key poses: poses on named channels with times (`vfx/strawmanmoves.js`,
`poseAt`), and they read crisper than the Courier's blends. The Courier's library grows from that and from `MUDRA_FRAMES` (a clip's
frame by name, with solved finger offsets as data).

**The key, ruled (Dovina, 2026-10-31).** Petra asked for arrays in the move's row and Calissa for named objects in a table per tool.
The ruling is named objects, in a table per tool. Names read in a diff and caption a sheet, and the cost is nil.

```
// src/courier/anim/keys/<tool>.js: KEYS[move] = [ key, key, ... ]   (cutlass.js: KEYS.n1, KEYS.n2 ...; fighter.js: KEYS.fsmash ...)
{ pose: 'strike',            // the key's name: the sheet's caption, the moveset's call ('strike' is the contact frame)
  clip: 'Sword_Attack_01',   // the source clip (CLAUDE.md: an existing clip for every movement); a re-export keeps the pose
  frame: 11,                 // its frame, by number
  fix: { RightArm: [x, y, z] },   // optional: solved local rotations (radians) laid over that frame, kept as data
  hold: 3,                   // 60 Hz frames of game time the key stands
  snap: 2,                   // 60 Hz frames of ease-out into it from whatever stood before (0: a cut)
  plant: 'LR',               // optional: the soles footIK holds in the world ('L' | 'R' | 'LR'); none: the feet are the pose's
  holdWhile: 'shield',       // optional: a named predicate that stops the clock on this key (the shield up, a charge, a landing's lag)
  active: true }             // optional: the hitbox is out on this key's frames (the fighter's sheets mark it; gameplay reads MOVES)
```

- **One source.** The key track (`keysOf(tool, move)`, Petra's `courier/anim/keyposes.js`) and the contact sheet read the same table.
  A move with no entry plays as now.
- **The fighter's keys** name only the pose (`pose`, `clip`, `frame`, `fix`, `plant`). Their `hold`, `snap` and `active` are filled
  from `MOVES` by `keysOf`, under the rule in section 6, so the sheet shows the frame data's own timing.
- **Whose.** The keys' poses are Calissa's (`courier/anim/keys/`). The fighter's timing is Dovina's (`MOVES`). The track that plays
  them is Petra's.

**The contact sheet.** The Anim Lab already shows any frame front, side and top (`lab.snapshot()`), and `scripts/posesheet.mjs`
already makes contact sheets of clips. Its key-pose mode lays out one image per move:
- one column a key, front over side;
- its `pose`, `hold` and `snap` printed under it;
- a hitstop's column and the active keys marked;
- the move's frames totalled at the end.

**What is re-posed first**, in Calissa's order:
1. the cutlass's LMB string (its three normals): the move seen most, and where the blends read softest at contact;
2. the kick (V, unarmed): its first 0.26 s is the parry, so it wants one clear guard pose, held;
3. the jump: jumpsquat, rise, peak, landing lag (Melee's feel lives in the jumpsquat and the land);
4. the dash and the run start: the turnaround as two strong poses, not a blend (the dash dance).

The Arena's fighter kit is the bench from the first day. Items 3 and 4 are moves, not the gait: they touch the core movement's look, so
they go behind section 4's setting until South has played them.

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
