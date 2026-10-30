# The Sandbox and the thrown hit (Dawn of Mana's lessons)

South, 2026-10-30: "design and build a room in the workshop kind of like the Siege, but as a little physics sandbox to test god powers
... Also a little area to practice kicking a physics enabled ball around. Dawn of Mana is a huge inspiration for me and I want us to take
as many lessons as we can from how they handled the physics combat, while throwing out all the ill-advised decisions they made like
resetting progress at the end of every stage."

The pieces:
- Rules: `src/progress/sandbox.js`.
- The thrown hit, everywhere: `src/world/impacts.js`.
- The room: `src/world/sandbox/sandbox.js`.
- Ledger and log: `src/feedback/tracking/sandbox.js`.
- Achievements: `src/progress/sandboxachievements.js`.

## 1. Dawn of Mana: what it did

Dawn of Mana (Square Enix, 2006, PS2) is built on Havok physics. Nearly every crate, rock, barrel and pot can be grabbed with the
Tree of Mana's vine and flung, kicked, or knocked into others. Its signature is **Panic**: an enemy struck by an object, or startled
by a near miss, panics. A panicked enemy drops **medals and Mana** on each hit, and more when it is put down panicked. Hitting the
world into enemies is worth more than hitting them yourself.

| kept | how it lands here |
|---|---|
| The world is a weapon. | **The thrown hit**: anything loose the hand throws or the Courier kicks strikes a creature it meets at 6 m/s or more, as an Impact blow by the energy it carries (half its mass times its speed squared; 40 J a blow of power 1, 3 at most). A ball stings; a heavy crate floors. Everywhere, not only in the Sandbox. |
| Panic pays. | **Panicked**: a creature so struck has its agitation (EmO) raised into the band where its Lachryma yields most (`combat/emo.js` optimal). So the world-as-weapon pays in the game's own currency of the fight, with no medal system beside it. |
| Weight is readable. | Energy, not a flat number: a heavy hit (250 J or more) also fills half the stun meter (`creatures/stun.js`). |
| Chains and spectacle. | **A strike**: one thrown thing striking three creatures in one flight. It is counted, logged and paid as a big act (Psychokinesis). |
| The grab-and-fling verb. | It is already ours: the god hand's Telekinesis and the Courier's kick (`courier/moves/kick.js` shoves `level.dynamic`). The thrown hit makes both count. |

| thrown out | why |
|---|---|
| Stats reset at every chapter | Progress here is the ledger's and the domains', and stays. The Sandbox counts what you do with your own powers, as the Siege does. |
| The vine's lock picked the wrong object | The hand grabs what is under it, and the Courier's lock-on is its own. |
| Objects vanished once used | A crate stays where it lands until it breaks, and the Sandbox's rack restocks. |
| The camera fought the player | The god hand's view is the player's: pan, turn, zoom. |
| Panic as a separate status to learn | Panic is agitation, a number the creature already has and the overlay already reads. |

## 2. The Sandbox

A hall off the Index in THE HAND group, beside the Siege. The Siege is for raids; the Sandbox is for trying things.

- **The rack** (F) lays the yard: eight light crates, three heavy ones, a tower of eighteen bricks to knock down, six pots.
- **The pen** (F) calls three slip jellies into a ring of posts. They are training bodies, as the Throwing Room's are: nothing done to them
  counts (no experience, no cubes, no ledger: tracking.js drops every event marked `training`). The thrown hit's achievements are
  earned on the world's creatures; the pitch's are earned here. They are what the thrown hit and the god powers are tried on.
- **The ground lectern** (F) puts the hand's matter back as it was.
- **Your own powers only.** The Sandbox lends nothing: DEBUG's lend panel lends the rest. It is a place to practise, never a shortcut past
  learning a power ("arts only by achievement").

## 3. The pitch

The east end of the hall, with low walls so the ball comes back, and a five-a-side goal (3.6 m by 2 m).

**The ball**:
- 0.32 m in radius, between a football and a beach ball, so it reads from the hand's height;
- light and lively, with a restitution of 0.62;
- set back on its spot when it leaves the pitch.

The kick moves it, the hand grabs and throws it, and a ball booted into a slip jelly is a thrown hit.

**What is kept:**
- goals;
- the longest goal, in metres from the last kick;
- keepy-uppy: kicks in a row with no bounce.

| achievement | what |
|---|---|
| ph1 Everything Is a Weapon | a thrown hit |
| ph2 Flying Furniture | 50 thrown hits |
| ph3 Strike! | three creatures with one throw |
| ph4 Freight | a 600 J thrown hit |
| pb1 Back of the Net | a goal |
| pb2 Keepy-Uppy | 10 kicks without a bounce |
| pb3 From Distance | a goal from 20 m |

## 4. Numbers and their reasons

- **6 m/s** is a brisk throw. Under it a crate only bumps, so a rolled crate is never a blow.
- **40 J** is a blow of power 1: a 1 kg thing at 9 m/s, a good kick.
- **3** is the most, a heavy finisher's.
- **250 J** is heavy: a 10 kg crate at 7 m/s.
- **0.6 real s** is the cool, so one thing never strikes the same creature twice in one contact.
- **The domains**: a thrown hit trains Psychokinesis (moving things by will), its quality the energy (600 J is masterful); a strike is a
  big act.

## 5. Next (not built)

- **Looks** (Calissa's): the hall, the rack, the pen's posts, the goal's net, and a burst of panic over a struck creature (a world mark).
- **Sounds** (Wanda's): a thrown hit's thud by weight, a strike's sting, the net's swish, the crowd that is not there.
- **Words** (Espada's): the lectern lines and the log's.
- **Pots and bricks thrown by creatures at the Courier.** The thrown hit runs one way for now: by the Courier, or by the environment,
  which counts nothing.
