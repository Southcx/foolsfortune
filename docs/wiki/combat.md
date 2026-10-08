# Combat

Every blow you land has a kind of force, called a damage type. Each type slowly builds a status on what it hits, such as stun or
charm, and some types beat others. Learn the types and a creature's temperament and you can open a fight on purpose. Answer its blows
with the parry (V) and you can end one safely.

## The five damage types

A blow gets its type from the tool and move that made it. Impact is the default for anything not listed. The types sit on a line from
lawful to chaotic. Each one builds one status and beats one other type.

| Type | Line | Builds | Beats | Dealt by |
| --- | --- | --- | --- | --- |
| **Impact** | lawful | **Stun** | Illusion | psygun shots and charges, the Sondelass's cuts and hook, the club, kick, slam, lunge |
| **Ego** | lawful | **Doubt** | Influence | the Veritome's flash and reprogramming |
| **Influence** | middle | **Charm** | Delirium | the Crucibelle's songs and toll |
| **Illusion** | chaotic | **Blind** | Ego | the Soul Brush's brushed strokes, the Dreamvane's fork, empowered shots |
| **Delirium** | chaotic | **Confusion** | Impact | the Lockheart, and a nuke |

The beats form a closed ring: Impact, Illusion, Ego, Influence, Delirium, back to Impact. No type is unbeaten, and none is beaten twice.

- **Beating a creature's type:** a blow does 25% more damage and builds its status 50% faster. Only a creature that declares a type of
  its own can be beaten this way.
- **Annihilation:** Impact on a creature that is confused, or Delirium on one that is stunned, does 50% more damage. The two ends of
  the line undo each other.
- A **stunned** creature also takes 1.5 times from every blow. A **soft** creature takes double.

## Statuses and build-up

Each creature keeps a hidden meter for every type. A blow of that type fills its meter. At the threshold the status lands and the meter
empties. Meters drain by 0.25 blows a real second, so you build a status by pressure, not by one blow now and then.

| Type | Status | What the creature does | Meter fills at | Status holds |
| --- | --- | --- | --- | --- |
| Impact | Stun | stops, sways, takes more damage | twelve plain shots (see below) | 4.5 real seconds |
| Ego | Doubt | slower to wind up, weaker when it does | 3 blows | 6 real seconds |
| Influence | Charm | will not attack, warms to you | 3 blows | 4 real seconds |
| Illusion | Blind | cannot see you | 4 blows | 5 real seconds |
| Delirium | Confusion | cannot keep a course | 2 blows | 6 real seconds |

"Blows" means blows of power 1. Types that a tool deals rarely build fast. Types dealt by every shot build slowly.

Tools can also put other statuses on a creature: halt, slow, sleep, forget, flee, soft, calm and melt. Putting the same status on
again only keeps the longer one.

### Stun

Stun works a little differently, because Impact is dealt all the time. Every stunnable thing has a poise meter. Each blow of Impact
fills 8% of it (twelve plain shots). The Veritome's flash, and catching a creature mid-leap, fill it too.

| Stun fact | Number |
| --- | --- |
| Meter starts to drain after | 1.4 real seconds with no new blow |
| Meter drains by | 32% a real second |
| Stun lasts | 4.5 real seconds (a creature may differ) |
| Immune afterwards | the stun time plus 6 real seconds, and the meter fills at a quarter rate |
| Blows on a stunned creature | 1.5 times damage |

A stunned creature is open to things a thinking opponent would refuse: the Sondelass's finisher and reprogramming. A slip jelly bursts
at about eight shots, so Impact alone does not stun it. Its stun comes from the flash.

## A creature's mental state

Every creature has a mental state from Stoic to Prismatic. It says how open the creature is to being moved.

| State | Takes a status or build-up at | Holds a status for |
| --- | --- | --- |
| Stoic | 0.35 times | 0.35 times as long |
| Resolved | 0.7 times | 0.7 times |
| Balanced | 1 times | 1 times |
| Fluid | 1.4 times | 1.4 times |
| Prismatic | 2 times | 2 times |

- Each blow pushes the creature toward Prismatic by 0.12 of a state (times the blow's power). A creature under pressure becomes easier to
  move.
- A status that lasts under half a real second is shrugged off. The creature moves 0.35 of a state back toward Stoic.
- Left alone, it drifts back toward its resting state by 0.05 of a state a real second.
- The weather also pushes minds. See [Feelings and weather](feelings-and-weather.md).

## Emotional output and enrage

A Figment (a made-up thought-creature, like the slip jelly) has an agitation from 0 (calm) to 1 (beside itself), called EmO.

| EmO fact | Number |
| --- | --- |
| Each blow adds | 0.08 (times power) |
| While it hunts | +0.01 a real second |
| At rest | falls 0.03 a real second |
| Best band for Lachryma yield | 0.35 to 0.75 |
| Enrage | at 0.85 and up |

- **Yield:** a blow draws the full share of Lachryma inside the best band. Outside it, the share falls to 25% at calm and at the top.
- **Enrage:** past 0.85 the creature fights harder. Its body shows it, never text.
- **Catching:** a Figment is easiest to catch inside the best band. Calm halves the odds. An enraged one has a fifth.
- Soothing it (a Crucibelle lullaby, the Lockheart's hush) lowers EmO. A slip jelly reaches the best band around its fifth shot.
  Catching is partly built; the rule is in the code, the full catch is planned.

## Grain: who a creature is

Grain is a creature's temperament. It has five traits, each a dial between two poles. The Veritome reads them. A creature is **weak to**
the damage type whose trait it is high in.

| Trait | Poles | High in it, weak to |
| --- | --- | --- |
| Openness | curious or wary | Illusion (blind) |
| Conscientiousness | orderly or erratic | Delirium (confusion) |
| Extraversion | bold or shy | Impact (stun) |
| Agreeableness | gentle or hostile | Influence (charm) |
| Neuroticism | skittish or steady | Ego (doubt) |

- A trait above 0.5 makes the creature weak to its type: that type builds up to 1.5 times faster. A trait at the far end of its pole
  slows the type down, down to 0.6 times.
- Slip jellies are bold and erratic, so Impact and Delirium work well on them. Each jelly differs a little, and usually strays far on
  one trait.
- Grain shows in movement and posture, not colour. The weather nudges it slowly (dread raises skittish, mirth raises gentle, wonder
  raises curious, desire raises bold, grief lowers bold).
- Not built yet: the Veritome's reading of grain in play, the bestiary's "Weak to" line, and the creature minds reading grain.

## Answering blows: the parry

**V** is the parry. The tool in your hand decides what it does. Press it just before a blow lands. The window is **0.25 real seconds**
(0.40 with the Held Breath knack). A thing that can be parried wears a Lachryma-coloured outline. Nothing else does, so the outline is a
promise. A parry never moves you. You are untouchable for a beat after one.

| In hand | V in the window | V held after |
| --- | --- | --- |
| Nothing | **kick** the shot back where you look | nothing |
| Sondelass (cutlass) | **deflect** back where you look | guard, 3 Lachryma a block |
| psygun | point-blank shot, staggers the thrower | nothing |
| Soul Brush, paint | **bat** the shot back, carrying your paint | nothing |
| Soul Brush, mop | **soak** a Lachryma shot into the bottle | nothing |
| Veritome | **shutter**: a free flash on the striker, 1.25 stun | nothing |
| Dreamvane | **twirl** turns shots aside | spin, 2 Lachryma a real second |
| Crucibelle | **shatter** shots within 3 m (4.5 m on the song's beat) | nothing |
| Lockheart | **gulp** a Lachryma shot into the pool | nothing |

- A blow winding up that you answer breaks off and stuns the striker a little: 0.5 of a stun meter, 1 for the psygun, 1.25 for the
  Veritome.
- A shot the tool cannot use (soak or gulp on a plain shot) is turned aside instead.
- Heavy things carry no outline and cannot be parried: a boulder, the Great Slip Jelly's ram, a ship's round shot.
- Parrying with a tool out never kicks.

## Your shield, cracks and shattering

Your pool of Lachryma is also your shield.

1. A blow is paid from the pool first. A full-strength blow costs **35 Lachryma**.
2. The pool refills on its own after a short wait (a default pool holds 100, refills 4 a real second after 2 real seconds; the stones
   change this).
3. What the pool cannot pay cracks the clay where the blow lands. You have six regions: mask, torso, each arm, each leg.
4. After **6 real seconds** with no new hit, a region mends at 2.5% a real second (about 40 real seconds from full). The kiln mends it
   at once for cubes.
5. A blow on a region already cracked through shatters you, as do cracks together past 3.6. A shatter ends in being made whole at a
   Shrine or the workshop.

Your own mental state and draught are covered in [Feelings and weather](feelings-and-weather.md).

## Friendly fire

Blows between Couriers in co-op do **20%** damage. Statuses land too, but they wear out fast. The second one of a kind within
20 real seconds needs twice the build-up and holds half as long. The third is shrugged off.

## For the divisions

- `src/progress/combat/types.js`: the types, trumps, annihilation, build-up numbers, which cause is which type.
- `src/creatures/creatures.js`: `strike`, `build`, `apply` (statuses, mental state).
- `src/creatures/stun.js`: poise and stun.
- `src/progress/combat/mind.js`, `emo.js`, `temperament.js`, `friendly.js`: mental state, EmO, grain, friendly fire.
- `src/courier/parry.js`, `src/courier/parries.js`, `docs/plans/PARRY.md`: the parry.
- `src/courier/vessel/damage.js`: the shield, cracks and shattering.
- `docs/plans/TEMPERAMENT.md`, `docs/DESIGN.md` section 10, `docs/GLOSSARY-DETAIL.md`.
