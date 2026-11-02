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
| A / D | walk, run; tap twice to dash (and, with LMB, the forward smash) | drift | roll | forward / back throw | |
| W | up (a tilt, an up smash, the up special); tap twice to jump (tap jump) | up; tap twice for the double jump | | up throw | climb up |
| S | crouch (crouch cancel), drop through a thin platform | fast fall, past the jump's top | spot dodge | down throw | let go |
| Space | jump: let go within the crouch for a short hop, hold for a full hop | double jump | jump out of shield | | ledge jump |
| LMB | jab; with A/D, W or S held a tilt; running, a dash attack; inside 8 frames of a key tapped twice, the smash that way (held, it charges up to 1 real s; in the jump's crouch with W, the up smash) | an aerial, by direction to the facing | grab | pummel | attack getup |
| RMB | a special: neutral, side, up (the recovery), down | the same | | | |
| Shift | shield (hold) | air dodge the held way; 7 frames before landing an aerial, the L-cancel; 20 frames before hitting the floor tumbling, the tech | | | roll up |
| R | grab | | | | |

DI and SDI: hold or tap A/D/W/S during hitlag. E is retired from the kit (2026-11-01): the smash is a flick and LMB, Smash's own way.

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
- **The blast lines.** 26 m from mid-stage on both sides, 20 m above and 17 m below. Measured with gravity and the launch angle (the
  kit's kernel, round 2): a fresh, fully charged forward smash from mid-stage reaches 26 m at about 110%, and an up smash reaches 20 m up
  at about 125%, as Mario's do in Melee. `koPercent` leaves out the angle and gravity, so it reads short; the measurement rules.
- **Stocks.** Three each. A KO respawns on a platform above the stage, intangible on it, then 2 real s invincible.
- **The foes.** Straw fighters (Strawman's dummies with a fighter's mind), one to three.
  - They use the same kit and the same rules.
  - A level from 1 to 9 at the lectern (Melee's CPU levels): how often they shield, tech, DI and recover.
- **The clear.** Every foe's stocks taken. The rank comes from the time, the hits taken and the longest string.
- **Training.** A lectern for UnclePunch-style training: the % reset, the foes standing, shielding or jumping, and the frame data of the last move shown as a tag.

### 5.1 The flat stage (stages/flatstage.js)

Final Destination's layout for one against one, the wings' last door. Built by the same builder as the Arena (`fighterStage`,
`stages/fighterstage.js`), with the same kit, rules, stocks, training and rank; only the numbers differ.

- **The layout.** One main stage 27.5 m wide with ledges at both ends; no platforms; an underside in two steps tapering in (12 m and
  8.5 m either side, to 4.2 m and 7 m down).
- **The blast lines.** 28.5 m from mid-stage on both sides, 18.8 m above and 21.9 m below: each of the Arena's moved by Melee's own
  difference between Final Destination and Battlefield (libmelee: the ground's edge 85.57 against 68.4, the sides 246 against 224, the
  top 188 against 200, the bottom 140 against 108.8). So only the top is tighter: vertical KOs come a little sooner, the sides about 7
  points of percent later from mid-stage by `koPercent` (unmeasured in the kernel yet), the bottom a longer fall to recover from.
- **One foe.** No FOES lectern: the kit's count stays 1. The lecterns are the level, the kit, training and the reset.
- **The ledger.** Its events carry `stage: 'flatstage'` (`well.fighter.hit`, `.ko`, `.stock`, `well.stage.clear`); its clear is
  `well.stage.clear.flatstage` (Flat Out, sw15, beside the Arena's Main Event); KOs are also counted a stage (`well.fighter.ko.<stage>`).

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

## 8. The two buttons and the kit by the hand (South, 2026-11-01)

South, through Calissa: "synergize the existing melee weapon combos with the two button system of Super Smash Bros and its attack
button and special button, with control stick double flick to jump. You have my permission to come up with new moves and chains to
facilitate testing the movekits."

- **Two buttons:** LMB is the attack and RMB the special, each read by the way held (section 2). **The Arena's flick** is the stick pushed hard
  and fast (always "the Arena's flick": the look area's flick is a swipe); on the keys it is a key tapped twice inside 14 frames. W flicked jumps (tap jump), and flicked again in the air it's the
  double jump: South's "double flick". A flick with LMB inside 8 frames of its second tap is the smash that way, held to charge.
  Space still jumps. E is retired. On touch, a flick is the stick from under 0.3 to past 0.8 inside 3 frames (the touch driver's axis,
  when the kit reads it: open below).
- **The kit by the hand** (`progress/fighterkits.js`, read by `fighter/handkit.js`): the tool in the hands fills the slots it has moves
  for; the rest stay the bare set's (Mario's). The cutlass's jabs and forward tilt are your melee loadout's string, its specials your
  RMB specials (tapped the neutral, with W the up, carried up as the recovery, with S the down, or the Tidecutter). The rules:
  - **damage** is 5% a power (Mario's jab 3% on the bare fist's 0.6), at most 30% a blow (Ganondorf's Warlock Punch);
  - **frames:** the slot's shape is Mario's, stretched to the tool move's own `time`;
  - **knockback:** a launcher sends up and a trip low;
  - **reach:** a tool's boxes stand out by its reach (blade 1.35, pole 1.5, chain 1.6, brush 1.3, bell 1.1, book 1.05, gun 1.0);
  - **open:** every move of the tool in hand is open in the Arena, unearned. It is a test room, and nothing it lends counts elsewhere.
- **The brawler** (Closers' J, Calissa's take): a second bare set.

  | move | numbers |
  |---|---|
  | jab | two jabs, 2% each |
  | barrage | loops while LMB is held, 1% every 4 frames; let go, the finisher (5%, Ultimate's rapid jab) |
  | up tilt | a rising uppercut, 11% |
  | dash attack | a dash straight, 10%, sending out |
  | up special | an uppercut, the recovery |
  | side special | a 4 m lunge |
  | forward air | the flying knee (Captain Falcon's Knee Smash): 20% on its one clean frame (14), 5% after; land in it, 19 frames |
  | down air | the dive kick (Kamen Rider's Rider Kick): held still 12 frames, then 16 m/s down a line 50° below level until it lands (13%, 8% from frame 20); landing in it costs 28 frames |
  | neutral air | the dropkick: 12% for its first 4 frames, then a weak 6% that lingers to frame 22; 22 frames of landing |

  The three airs are the brawler's showpieces, so each has the price its reference has: the knee misses its 20 by one frame, the dive
  kick commits the whole jump to its line, and the dropkick lands slowly. Their poses are Calissa's key tables (`fighter.brawler`,
  `courier/anim/keys/fighterkits.js`), drawn by the Arena's pose layer as written (each still's `fix` laid over its clip frame).
  A move's `late` is the clean and late hit (`{ at, damage, base, growth }`, read by `hitOf`); `special: 'dive'` is the stall and dive.

- **The KIT lectern** (left of the Courier's start) cycles bare hands, the brawler and the worn tools. A tool chosen is drawn (the
  belt's own draw); a bare set empties the hands.

| tool | what its combat rows fill (the rest: section 9) |
|---|---|
| Sondelass | the jabs and forward tilt by the loadout; up tilt the launcher, down tilt Low Sweep, the charge the forward smash, Rising Cut the up smash, Spin Slash the down smash, the air string the neutral and forward airs, Backhand the back air, the plunge the down air; neutral special the Stinger (an 8 m lunge), side special the hook, up special the W slot (else the Stinger aimed up: Fox's Firefox), down special the S slot (else the Tidecutter) |
| psygun | jab the whip; neutral special the shot, held to charge (Samus's); side special Fan the Hammer |
| Soul Brush | the club's combo as the jabs and forward tilt, its dash, its spin the down smash, its air string, its slam the down air |
| Dreamvane | its combo, pause string's finisher the forward tilt, its launcher, its charge the forward smash, the Dreamquake the neutral special |
| Crucibelle | the tolls as the jabs and forward tilt, the fever peak the neutral special |
| Lockheart | the flail's string as the jabs and forward tilt |
| Veritome | the bash as the jab and forward tilt |

## 9. Each tool's movekit (South, 2026-11-01)

South: "create a full super smash bros style movekit per lachryma tool type, including the five special (directional plus neutral)
and five normal attacks. Be creative with giving each lachryma tool it's identity, use specific references that complement each
lachryma tool."

Every tool in the hands fills **ten slots**: five normals (the jab, the forward, up and down tilts, the dash attack) and five
specials (neutral, forward, **back**, up, down). The back special is RMB with the stick held away from the facing: the facing is
kept and the body is drawn turned to strike behind (Smash's B-reverse). A kit with no back special (the bare sets) turns its side
special as before. A slot section 8's rows fill keeps its row; `progress/fightertoolkits.js` (`TOOL_KITS`, `TOOL_BOXES`) fills the
rest, each move's numbers against the Melee character nearest its reference. Poses: `courier/anim/keys/fightertoolposes.js` (each
tool's own clips), keyed where a table exists (the Sondelass's and the Lockheart's). The specials' behaviours are the kernel's own:
a shot (now with an arc, a size, a speed and a behind), a lunge, a recovery (its own rise and drift), a reflect (its own window).

| tool | identity | jab · f tilt · u tilt · d tilt · dash | neutral · forward · back · up · down special |
|---|---|---|---|
| psygun | the gunslinger (Revolver Ocelot, Samus, the Western) | pistol whip, butt stroke · Point blank (Equilibrium's gun kata) · Sky shot · Dance! (shots at the boots, a trip) · Quick draw (Lucky Luke) | charge shot (Samus) · Fan the Hammer · Over the shoulder (Ocelot's ricochet, a shot behind) · Recoil jump (TF2's rocket jump, a spike under) · Ricochet twirl (a reflect) |
| Sondelass | the pirate's blade, rod and hook | the loadout's string · loadout slot 4 · the launcher · Low Sweep · the dash slash | Stinger (Devil May Cry) · the hook (a tether) · Keelhaul (cast behind, hauled through to the front) · the W slot · the S slot or the Tidecutter |
| Soul Brush | the calligrapher (Okami, Splatoon) | the club's combo, Brush sweep · combo3 · Ink flick · Floor stroke (the roller, a trip) · the dive | Cherry Bomb (Okami: a lobbed burst) · Power Slash (Okami: a 3 m line) · Galestorm (Okami: wind behind) · Super Jump (Splatoon) · Splashdown (Splatoon: a slam ringed both ways) |
| Veritome | the camera that is a book (Fatal Frame, Pokemon Snap) | bash, spine back · bash 2 · Page fan (3 hits) · Low plate (a trip) · Paparazzo | Zero Shot (Fatal Frame: 18% on one frame, 4% after) · Pester ball (Pokemon Snap: lobbed) · Over-the-shoulder flash · Elwind (Robin's) · Capture circle (a reflect) |
| Dreamvane | the pole that dowses and reads the sky (Sun Wukong) | the combo · the pause finisher · the launcher · Staff sweep (both sides) · Ruyi thrust (the staff run out long) | Dreamquake · Trident throw (Poseidon, Sheik's needles' line) · Lightning rod (Raiden: a column behind) · Pole vault · Geyser (the water witch) |
| Crucibelle | the bell (Dojoji, Quasimodo) | the tolls · toll 3 · High note · Low note (a trip) · Town crier (2 hits) | the fever peak · Thrown note (a ring of sound) · Dojoji (the bell brought down behind, a spike) · Bell rope (Quasimodo) · the toll (a reflect) |
| Lockheart | the coffin on a chain (keys/lockheart.js) | the flail · flail 3 · Censer (the Botafumeiro) · Chain sweep (both sides) · Meteor bowl | Get over here (Scorpion: hauls them in) · Snare (the kusarigama) · Vampire Killer (Simon Belmont: cracked behind) · Bell rope (whirled, 3 hits) · The Opening (the gulp, a reflect) |

## 10. Open

- **The flick on touch:** the kit reads the keys the touch driver presses; a real stick flick needs the stick's axis handed to the
  kit (Petra's touch driver).

- **Touch controls** (MOBILE.md's next pass).
- **Whether the kit leaves the Arena:** the Brawl's dummies, and the 3D game's blows (hitstop at least).
