# The platform fighter: the Arena and the fighter kit (Strawman's Well)

South, 2026-10-31: "I'm really enjoying playing with the Courier in this side-scroller brawl-like platform fighter module so if we want
to lean even harder in that direction, like adding all the other SSBM-like and platform fighter mechanics to include a shield and grab
and beyond, that would be really nice. Go wild! ... there is more valuable information on implementation specifics from the SSBM
community, considering the game has been decompiled and hotly discussed. Also, I am authorizing you to adjust the base movement
parameters of the courier, so long as they are saved as a 'profile' of parameters when they're meaningfully different, and our current
original is kept safe."

The rules are `src/progress/platformfighter.js` (pure: every formula and frame count, each with its source). The builds are
`src/progress/movementprofiles.js`. The kit and the Arena are `src/world/strawmanwell/fighter/` and `stages/arena.js`. How it is drawn
is KEY-POSES.md.

## 1. Sources

Super Smash Bros. Melee throughout:
- **the decompilation** (doldecomp/melee): the formulas' structure and the order of a frame;
- **SmashWiki**: the formulas and frame data;
- **libmelee** (`characterdata.csv`, `stages.py`): the characters' attributes and the stages' blast zones, read from the game's memory;
- **Magus420's stage data**;
- **Sakurai's Famitsu columns**: how hitstop should look.

The research file with a URL on every number is kept with this round. Where the sources disagree, the decomp wins. Where nothing was
found, the number is ours and marked so in the code.

## 2. The controls (keyboard; touch is MOBILE.md's next pass)

The fighter kit is on in the Arena only. Elsewhere in the Well, the frame's keys stand as they are.

| key | on the ground | in the air | in shield | grabbing | on the ledge |
|---|---|---|---|---|---|
| A / D | walk, run; tap twice to dash | drift | roll | forward / back throw | |
| W | (a door, in the wings) | | | up throw | climb up |
| S | crouch (crouch cancel), drop through a thin platform | fast fall, past the jump's top | spot dodge | down throw | let go |
| Space | jump: let go within the crouch for a short hop, hold for a full hop | double jump | jump out of shield | | ledge jump |
| LMB | jab; with A/D, W or S a tilt; running, a dash attack | an aerial, by direction to the facing | grab | pummel | attack getup |
| E | a smash the held way (hold to charge, up to 1 real s) | an aerial the held way | | | |
| RMB | a special: neutral, side, up (the recovery), down | the same | | | |
| Shift | shield (hold) | air dodge the held way; 7 frames before landing an aerial, the L-cancel; 20 frames before hitting the floor tumbling, the tech | | | roll up |
| R | grab | | | | |

DI and SDI: hold or tap A/D/W/S during hitlag.

## 3. The builds (movementprofiles.js)

Eleven builds plus the original, each a Melee character's attributes over Mario's, times the Courier's own numbers. They differ from each
other as Melee's do, and the Courier stays the Courier's size. Mario is the original.

| build | after | what it is |
|---|---|---|
| Fast Faller | Fox | gravity x2.4, the fastest fall, light (75) |
| High Jumper | Falco | the biggest full hop, a fast fall |
| Swordfighter | Marth | floaty, quick on its feet |
| Ninja | Sheik | a 3-frame crouch, a tall short hop |
| Racer | Captain Falcon | the fastest run, heavy (104) |
| Floater | Peach | slow fall, wide drift |
| Balloon | Jigglypuff | five air jumps, kite steering, lightest (60) |
| Heavy Floater | Samus | heavy (110) and floaty |
| Bruiser | Ganondorf | slow start (6 frames), heavy (109) |
| Heavyweight | Bowser | the heaviest (117), an 8-frame crouch |
| Light Pair | Ice Climbers | slippery: half the traction |

Each build has two halves:
- **its `move` half** changes the core's own keys (gravity, jump velocity, walk, run, air acceleration, traction as `groundDecel`, air jumps);
- **its `fighter` half** gives the kit's own numbers (weight, terminal and fast-fall speed, jumpsquat, short hop, air speed).

A build is worn only in the Well and comes off whole on leaving. The original is never written.

## 4. The kit's rules (platformfighter.js)

- **Knockback.** Melee's formula, capped at 2500, crouching 2/3. The launch is KB x 0.03 units a frame, decaying 0.051 a frame², with gravity still on.
- **Hitstun and tumble.** Hitstun is int(KB x 0.4) frames. Tumble starts at 80 KB.
- **Launch angle.** The Sakurai angle is 45° in the air; on the ground it is 0° below 32 KB and 44° above.
- **Hitlag.** floor(d/3 + 3) frames, capped at 20. Both bodies freeze; the victim shakes (KEY-POSES.md 3).
- **DI and SDI.** DI turns the launch by up to 18° x (the stick's part across it)². SDI nudges 6 units a push; ASDI nudges 3.
- **Shield.**
  - 60 HP: it drains 0.28 a frame held and regrows 0.07.
  - A hit takes 0.7 x its damage from it. Shieldstun is about 0.45d + 2 frames.
  - A press within 4 frames of the hit is a powershield.
  - Dropping it costs 15 frames.
  - A broken shield launches the body up and stuns it (400 - %) + 90 frames.
- **Dodges.** Spot dodge 22 frames (intangible 2 to 15). Roll 31 (4 to 19). Air dodge intangible 4 to 29, then special fall; its landing lag is 10 frames. A dodge into the ground is a wavedash.
- **Landing.** 4 frames plain. An aerial's own landing lag is halved by an L-cancel and skipped inside its auto-cancel window.
- **Tech.** A shield press within 20 frames of the floor while tumbling, with a 40-frame lockout after it. A missed tech is a knockdown with getups.
- **Grab.** Out on frames 7 to 8. It holds floor(76 + 1.6 x %) frames, 6 fewer for each mash. A pummel is 3%. Four throws, weight-blind.
- **Ledge.**
  - It catches while falling, facing it. The catch takes 7 frames, then 30 intangible.
  - Regrab is locked 29 frames (Melee's: ledge stalling is allowed).
  - Four getups, slower at 100% and over.
- **Staling.** The last 9 hits; a move loses up to 45% of its damage.
- **Smash charge.** Up to 60 frames, for x1.3671.
- **Moves.** The Courier's moves are Mario's frame data. The four specials are the Courier's own verbs:
  - neutral, the psygun's shot;
  - side, the Sondelass's hook as a tether;
  - up, the recovery into special fall;
  - down, the Crucibelle's toll as the reflector.

## 5. The Arena (stages/arena.js)

- **The layout.** Battlefield's, laid to the Courier's body (Melee's stages are proportioned to Melee's jumps, which are 2.3 body heights; the Courier's original is under one):
  - a main stage 22 m wide with ledges at both ends;
  - two thin side platforms at 1.3 m;
  - a top platform at 2.6 m, reached from a side one.
- **The blast lines.** About 35 m from mid-stage on both sides and above, and 17 m below. That is where a fresh, fully charged forward smash KOs a weight-100 body at about 110% (platformfighter.js `koPercent`), as Mario's does in Melee.
- **Stocks.** Three each. A KO respawns on a platform above the stage, intangible on it, then 2 real s invincible.
- **The foes.** Straw fighters (Strawman's dummies with a fighter's mind), one to three.
  - They use the same kit and the same rules.
  - A level from 1 to 9 at the lectern (Melee's CPU levels): how often they shield, tech, DI and recover.
- **The clear.** Every foe's stocks taken. The rank comes from the time, the hits taken and the longest string.
- **Training.** A lectern for UnclePunch-style training: the % reset, the foes standing, shielding or jumping, and the frame data of the last move shown as a tag.

## 6. Drawn with key poses (KEY-POSES.md)

Every move here is a pose sequence: the lead-in, the strike held through its active frames, the follow-through. Hitlag is a held pose
with a shake, so the Arena is the key-pose pipeline's first user and its test bench.

## 7. Who does what

| piece | who |
|---|---|
| the rules, the builds, the moves' data, the Arena's design | Dovina |
| the kit and the Arena, at placeholder looks | Dovina's builder |
| the hold stage, the freeze and shake, the pipeline order (KEY-POSES.md 6) | Petra |
| the poses, the contact sheets, the straw fighters' look, the percent readout's look | Calissa |
| a hit's sound on the impact frame, the KO's roar, the Arena's music | Wanda |
| names, once settled (plain until then) | Espada |

## 8. Open

- **Touch controls** (MOBILE.md's next pass).
- **Whether the kit leaves the Arena:** the Brawl's dummies, and the 3D game's blows (hitstop at least).
- **A second stage:** Final Destination's flat layout for 1v1.
