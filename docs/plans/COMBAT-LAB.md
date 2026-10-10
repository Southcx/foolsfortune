# The combat wing: the Throwing Room's test suite for fighting (the owner, 2026-10-10)

Calissa's (the owner put Calissa alone on this: Strawman and the room's combat look; the owner's ruling covers the room's geometry, which
is normally Petra's). The place is built: `src/world/testroom/combatwing.js` (the arcade, the hall, each station's floor, lectern and
stand-ins), its measures `TR.wing` in `src/world/testroom/layout.js`, its looks `src/vfx/combatwingkit.js`. The mechanics are not built:
each station below says what exists, what it needs, and whose it is. This file's working title was "the combat lab"; the place is
**the combat wing** (the basement is never "the lab", and the movement lab is the basement's).

> "we're going to expand the Throwing Room to be our ultimate test suite for combat actions, Figment Attack Telegraphs, Projectile
> Parry, Status application explanation; the works." ... "Expand level geometry as needed! I concur with your four stations, and if you
> think of anything else, go for it."

Rulings it keeps: the Throwing Room measures and never pays (its things are `training`; nothing here reaches the ledger); every station
is begun from something in the room, never a global key, and its interface goes away when you leave (CLAUDE.md, "Scope"); the only text
is the log and the Codex (no floating words or numbers: the frame meter, the plaques and the marks carry none); each station sent for a
test gets a debug chest within a few metres (docs/plans/DEBUG-CHESTS.md). The core movement is untouched: the bales, tiles, strips and
screed are flat and have no collider; the fence, the bench, the plinths and the lecterns are solid, as any furniture.

Directions here are the room's own (room.js: north is +z, toward the targets on their posts). The in-game compass reads -z as north, so
in play the wing lies to the compass's north of the firing mark; the plan below is drawn with +z up the page and names no compass point.

## 1. The floor plan

The room's south wall (z -5.5) is now an **arcade**: its header kept from 3.6 m up, piers at both ends, the room's own posts (x 14.5,
19.5, 24.5) the columns between four bays, a lintel under the header, each post's twin on the hall's side running to the hall's roof.
Through it, **the hall**: 20 m across (x 10.5 to 30.5, its west wall standing beside the Workshop's corner, never on it), 30.5 m deep
(z -5.5 to -36), 9 m to the roof (the room is 6: room overhead for the juggle pen and a launcher's air string). A beam crosses it at z
-19.5 between the two rows of stations. Four lamps (plain PointLights, lent by the light budget) hang over the four quarters.

```
           x 10.5        15             20             25           30.5
  z +10.5  +--------------------------------------------------------+
           |  shelf of pots       targets on their posts            |   THE THROWING ROOM
           |  paint range: stand  o 3m   o 6m   o 9m                |   (as it was, 6 m high;
   door ==>|                                                        |    Strawman's old spot
  (z 1..4) |  (firing mark) ===== lane ===============| spray wall  |    is a bay of the arcade)
           |  [Index lectern]                                       |
  z -5.5   +==pier==|| bay ||==== bay ====||==== bay ====||==pier===+   THE ARCADE (header 3.6 m)
           |   L1 C1                          |                 L2  |
           |M      .--bales--.                |  FIGMENT            |
           |I     /           \               |  TELEGRAPH FLOOR    |
           |R    |  ========   |  meter       |  8 x 11.5 m         |
           |R    |    (SM)     |  Strawman    |   [mark] 6 m        |
           |O     \  r 3.6 m  /               |      ^              |
           |R      '---------'                |    (urn: caster)    |
  z -19.5  |-- C3 --- L3 ----------- beam across --------- C5 ------|
           |B  L3                                          L5       |
           |E  o                                       [3]  12 m    |
           |N  o                L4  C4                  |           |
           |C  o           +-----gate-----+   [2]     [2]     [2]   |   THE COMBAT WING
           |H  o           |  JUGGLE PEN  |      20 deg  |  8 m      |   (9 m high)
           |   o           |  6.6 x 6.6 m |             [1]  4 m    |
           |   o  (x11)    |  sand        |              |           |
           |               +--------------+           (pitcher)     |
  z -36    +--------------------------------------------------------+
           L = a station's lectern   C = its debug chest   SM = Strawman   M = the mirror (west wall)
```

| thing | where (x, z; metres) | size |
|---|---|---|
| the arcade | z -6 to -5.5; piers x 10.5 to 12 and 29 to 30.5; bays between the posts | header 3.6 m up to the room's roof (6) |
| the hall | x 10.5 (11 inside the west wall) to 30.5, z -36 to -5.5 | 9 m high; one beam across at z -19.5 |
| the sparring circle | centre (16.25, -12.75); Strawman there, facing the arcade | clay disc r 3.6 m; 20 bales at r 3.76, the four at the quarters set out 0.25 |
| the frame meter | z -11.8, centred on x 16.25, crosswise between Strawman and the striker | 20 tiles, 5 m: a tenth of a second a tile, two seconds |
| the mirror | west wall, x 11.16, z -10.6 to -16.6 | 6 m long, 0.35 to 2.95 m high |
| the Figment telegraph floor | x 21.4 to 29.4, z -18.4 to -6.9; caster (25.4, -16.2); mark (25.4, -10.4) | grey slip screed, 8 by 11.5 m |
| the status bench | x 11.1 to 11.9, z -33.5 to -20.5 | 0.75 m high; eleven roly-polies 1.18 m apart, a plaque under each |
| the juggle pen | x 16.2 to 22.8, z -35.4 to -28.8; gate x 18.7 to 20.3 on its near side | sand; fence 0.95 m, two rails |
| the parry range | pitcher (27, -35); marks at 4, 8, 12 m up the lane, two at 8 m and 20 degrees off it | lane 0.9 m wide |
| places (`/goto`) | `sparring.circle`, `figment.telegraph.floor`, `parry.range`, `status.bench`, `juggle.pen` | each sets you down facing what it is for |

The zone: the wing is the Throwing Room's zone (`render/zonemap.js`: a second box, to 10.5 m up and 36.7 south), drawn whenever the
room is, so the hall never vanishes behind the arcade. The basement's ceiling slab goes round it as it goes round the room
(`basement.js`, `TR.wing.z0`).

## 2. The sparring circle (Strawman's ring)

**For:** the parry against a blow, in its window's glint, and the answer after it. **Teaches** (the law: the mechanic is the lesson):
reading a body's tell rather than a mark; that a window is short and late; that what follows a parry is a punish window of a known length.

- **Strawman** stands at the centre (moved from the room's south side: `TR.strawman`; the `strawman` place follows it). F at it still
  cycles still, guard, swing; the bout is still said in the log. While a string runs it turns on its ball to face you between moves
  (each move is aimed where it faced as it began, and held: the drawn area is where it lands), and faces the arcade again when it stops.
- **The ring** is a sumo dohyo's: a disc of tamped clay bounded by straw bales sunk to their middles, each with two cords, the four at
  the quarters set out a hand (the tokudawara). Strawman is straw; the ring is the rule: built. A string runs only while you are inside
  the clay (r 3.6 m and a step); step out and it stops after the move under way, and starts again a breath (1.0 s) after you step in.
- **The frame meter** (an extra, built as a stand-in): twenty dark tiles set crosswise in the clay between Strawman and the striker,
  a tenth of a second each, time running left to right as the striker sees it. Proposed lighting (no words, no numbers): the windup in
  Strawman's own tell's amber, the strike in the kiln's red, the recovery in slate blue; the parry window drawn as a pale rim round the
  tiles it covers; the striker's press a cream pip under the tile it fell on (early, late or in, at a glance). Prior art: Street Fighter
  6's frame meter, which is the strip, not its colours (the house's own). First laid behind Strawman: his body hid it from the striker's
  place, so it lies in front.
- **The mirror** (an extra, built as a stand-in): a long glass on the west wall in a dark wood frame, a dance studio's; silvered grey with
  the cartoon mirror's glints so it reads as a mirror before it reflects. The reflection is a second render: see section 7.
- **The lectern** (still the shut book's stand-in; built as a mechanic): F opens its page, set aside to the left so the circle stays in
  view (`indexmenu.showPage`, `aside`): the four strings and None (section 6), and in DEBUG the tempo (1x, 0.5x, 0.25x). Picking a
  string closes the page and says it in the log (`strawman.string`); the tempo is said too (`strawman.tempo`).
- **Debug chest** `sparring`: the seven tools (each answers a blow its own way: courier/parry.js `how`).
- **Built (2026-10-10, Calissa; the owner put Strawman wholly in Calissa's hands):** the moves and strings (section 6), the lectern's
  page, the tempo, the ring's rule, Strawman's clock on the sim step (casebook rule 184). **Still needs:** the frame meter's lighting
  (look: Calissa; the events it reads exist now: `strawman.windup { move, blow, eta }`, `strawman.strike { move, blow, landed, cleared }`,
  `move.parry` with its `lead`); the lectern's own look (an open book while its page is up).

## 3. The Figment telegraph floor

**For:** every Figment attack telegraph's shape thrown in turn, the drawn area being the hit area (FIGMENT-TELEGRAPHS.md section 3, rule
2). **Teaches:** each shape's answer by doing it (out of a circle, into a ring, behind a cone, aside of a line); and the fidelity ladder,
step by step, on the lend panel's Figment telegraphs row.

- **The screed** is grey stoneware slip (neutral: every damage type's colour reads true on it), 8 by 11.5 m, an oxblood border, the
  Courier's mark (a quarry tile, its chevron at the caster) 6 m from the caster. Judged with two real marks drawn on it (an Impact
  circle with its stun glyph, an Illusion line): first laid in cream, the marks' light fill washed out, so it was refired grey.
- **The caster** (stand-in): a tall urn on a turntable, its front toward the mark.
- **The lectern** (stand-in): the shape (circle, ring, out-in, cone, line, lunge, baited, left, tracked, floor, gaze, raidwide, adds,
  split: `FIGMENT_SHAPES`), the damage type and status, the fidelity step (the lend panel lends all four; the lectern would step
  through them: tells, where, when, kind, answer), the windup's length, and "all in turn".
- **Debug chest:** none. It needs state (the lend panel's row, or Divination's level), not items: DEBUG-CHESTS.md section 4.
- **Needs:** the caster as a creature that winds up with an `area` (Petra: a mind of data from `creatures/ai/`, `creatures.windup` with
  `area`, which already draws through `creatures.drawFigmentTelegraph`); it lands a harmless blow where the area says (a shove, as
  Strawman's swing), so "the drawn area is the hit area" is felt, not said. The pillars for `baited`, the islands for `floor`, the adds
  for `adds` and `split`: a few movable stand-ins on the screed (Calissa's look, Petra's placing). Telegraph looks: done (Calissa's).

## 4. The parry range

**For:** a projectile parried: a plain shot and an outlined shot (the glossary: an outlined shot wears the parry mark and only the parry
answers it), at set speeds and angles. **Teaches:** each tool's answer to a shot (return, turn, soak, gulp, shatter, stagger, shutter);
that a shot from the side is read later than one from the front; that faster is a shorter window.

- **The lane** runs from the pitcher's plinth to the 12 m mark; stand marks (quarry tiles, the chevron at the pitcher) at 4, 8 and 12 m
  with a tally of one, two, three tiles each (the paint range's hand: counted, never a number), and two more at 8 m, 20 degrees off the
  line either side (two tallies: the same distance).
- **The pitcher** (stand-in): a big clay jug on a plinth, its spout toward the marks.
- **The lectern** (stand-in): plain or outlined; slow, middling, fast; one at a time, a pair, a volley of three; from the line or across.
- **Debug chest** `parryrange`: the seven tools and a Lachrymato Bottle (the mop's soak drinks into it).
- **Needs:** the pitching (Petra: `creatures/lobber.js` is the part to reuse, a mortar that lobs a parryable ball, `game.projectiles`;
  its balls must carry `training` so a parry here never reaches the ledger: today `move.parry` counts every parry,
  `feedback/tracking.js`); the outlined shot on foot (it exists at sea: `courier/ship/shots.js`); the pitcher's look while it throws
  (a heave, the spout glowing: Calissa).

## 5. The status bench

**For:** each status landed on a target, shown in its aura and its status glyph, and explained in the log. **Teaches:** what each status
does to a creature (each creature decides what it means: `creatures.status`), by watching it happen beside the other ten.

- **The bench**: a long bench on the west wall, eleven little **roly-polies** on it (Strawman's kin: a Daruma's shape in burlap on a
  black ball foot), each with a **plaque** hung on the bench's front under it, its status's glyph fired into a tile (the Figment attack
  telegraphs' own pictures, `STATUS_ART`, in the icons' hand). In order: stun, halt, slow, sleep, calm, melt, doubt, charm, blind,
  confusion, soaked. calm and melt have no glyph yet (nine were drawn): their plaques are plain (Calissa owes the two).
  First laid flat on the floor, the glyphs were unreadable at the striker's grazing angle; hung on the bench they read as labels.
- **The explanation** is the log only (a line when a status lands, `status.land { status, on, by }` and a rule in
  `feedback/tracking/*.js`; the words Espada's), and the Codex's status page. No floating text.
- **The lectern** (stand-in): which roly-poly is lit as the target, or "each in turn".
- **Debug chest** `statusbench`: the seven tools and a Lachrymato Bottle.
- **Needs:** the eleven as creatures that take statuses and show them (Petra: `game.creatures`, `hurtable`, `training`; each a small body
  that rocks like Strawman: Calissa's model), the event and its rule (Petra, the words Espada's), the Codex's status page (Petra's
  Codex, Espada's words, Calissa's glyphs), the auras exist (`vfx/library.js aura.<status>`).

## 6. Strawman's attack strings (built, 2026-10-10)

The owner's rulings (2026-10-10): animate all the moves (the swing kept); the four strings on the circle's lectern; the spin sweep, knee
high, answered by a jump as well as the parry. Built by Calissa: the moves as data, `vfx/strawmanmoves.js` (`STRAWMAN_MOVES`,
`STRAWMAN_STRINGS`: the keys, the blows, the numbers); the body that plays them, `vfx/strawman.js` (`play`, `breakOff`, the parts); the
clock that runs them, `world/testroom/strawmanstrings.js` (`StrawmanStrings`, wired into `room.js` by four small edits).

Strawman has no skeleton: a move is keyed on the **rock** (the doll on its ball foot: lean and tilt), the **turn** about the ball (a new
group between the ball and the rock), each **sleeve** on its shoulder (swung forward, tipped up or down, the shoulder pushed out, the
sleeve stretched: a cartoon's sleeve unrolling), the **hat** (now on a pivot at its base: it nods), the **head** (it looks up), and the
sack's **tell** (the amber pulse, at each move's own rate) and **dark** (dimmed: a held breath). Between keys, eased curves; the springs
it had carry the follow-through (`kicks`: the rock's, the sack's, and a new one for the hat), and the sack also swings a beat behind the
keyed lean. Every tell reads from the striker's place (casebook rule 161: the marked part in sight for the whole wind-up; judged on the
contact sheets, front and side).

**Each blow is a windup** (`creatures.windup`): the parry mark on its striking part (`model.parts`: a sleeve, the hat, or both sleeves
under one mark, whose glint finds the higher cuff), and an `area` a Figment attack telegraph draws at your Divination (`figmentMarkOf`;
type Impact, answer Parry), aimed where Strawman faced as the move began: **the drawn area is the hit area** (`inArea`, the same shapes).
A strike that lands is harmless, a shove (4 m/s, `PUSH`), and counted as landed (`strawman.strike { landed }`); a parry's breath (its
iframes) takes nothing. **A parry breaks the blow off**: its part eases back (`MOVE_EASE`, 12/s), it rocks back, and Strawman stands in
its punish for the rest of the move; the one-two's jab parried, its second blow still comes (Sekiro's deflected combo). Two parries
close together stun it (the parry's own stun, 0.5 a parry against poise 1): a stunned, slept or halted Strawman does nothing.

**The window** is the parry's rule, not Strawman's: the last **0.25 s** before a strike (0.40 with Held Breath). The mark runs hot (and
glints) from half a second before the strike (the window and a press's quarter second): on a windup of 0.5 s or less (the jab, the
one-two's jab, the hat-butt nearly) it is hot from its first frame. All numbers at 1x; at 1x and 0.25x the strike lands as the windup's
clock runs out (`w.t` 0.300 to 0.317, one frame).

| move | windup (to the strike) | the tell, from the striker's place | strikes with (the mark) | window | recovery (the punish) | area (drawn = hit) |
|---|---|---|---|---|---|---|
| **swing** | 0.925 s | leans back; the right sleeve up beside the head; the sack pulses amber | the right sleeve | 0.675 to 0.925 s | 0.675 s | cone, 140 degrees, 2.6 m |
| **jab** | 0.45 s | the left shoulder drawn back, the left sleeve levelled at you, its spiral facing you; held a beat | the left sleeve, thrust (it unrolls to 1.6x) | 0.20 to 0.45 s | 0.35 s (the rock wobbles) | lunge, 1.9 m long, 0.9 wide |
| **one-two** | 0.45 s, then 0.40 s more | the jab; through its recovery the right sleeve already up beside the head (the swing's picture, held 0.1 s) | the left sleeve, then the right | 0.20 to 0.45, 0.60 to 0.85 s | 0.55 s after the second | the jab's lunge, then the swing's cone |
| **overhead chop** | 1.15 s | both sleeves up together above the hat in a V, a tall silhouette; it leans far back; the head looks up; a slow pulse | both sleeves (one mark) | 0.90 to 1.15 s | 0.80 s: both sleeves down in front, the doll pitched forward (the longest punish) | line, 1.0 m wide, 2.2 m long |
| **spin sweep** | 0.85 s (the second sleeve at 1.0) | leans back on its ball, both sleeves out straight, cocked 0.55 rad the wrong way | both sleeves (one mark), knee high: the left in front, then the right a half turn later | 0.60 to 0.85 s (one parry breaks off the whole spin) | 0.90 s: dizzy, it circles on its ball | circle, r 2.0 m (the cuff 1.5 m out, at 0.5 m high) |
| **hat-butt** | 0.60 s | the hat tips back first (0.38 rad: further, the head hid it), the sleeves swept back like wings, the eyes look up | the hat, nodded down at you | 0.35 to 0.60 s | 0.60 s, the hat bouncing on its spring | lunge, 1.4 m long, 1.0 wide |
| **delayed swing** | 1.425 s | the swing's picture exactly to 0.8 s, then held at the top, the pulse gone dark and the sack dimmed, creeping | the right sleeve | 1.175 to 1.425 s | 0.55 s | the swing's cone |

**The jump:** the spin sweep is low; a jump with your feet more than **0.35 m** up as a sleeve passes takes nothing
(`strawman.strike { cleared }`, and the log says you jumped it). A plain jump (6.4 m/s against 21 m/s/s) is above 0.35 m for 0.47 s, so
one taken about 0.25 s before the first sleeve clears both.

**The strings** (the lectern's rows; a pause is Strawman standing still, a breath to reset; each loops while you are inside the circle):

| string | made of | teaches |
|---|---|---|
| **Footwork** | jab, pause 1.0 s, jab, pause 1.0 s, swing, pause 1.6 s | the window on a short tell, then on a long one |
| **One-two, chop** | one-two, pause 0.6 s, overhead chop, pause 1.6 s | a second parry 0.40 s after the first; then the long punish, earned by not swinging early |
| **The mix-up** | two swings and a delayed swing in a random order (the seed's stream `strawman.strings`), pauses 1.2 s, then 1.6 s | read the hold: a press on the swing's timing against the delayed swing is 0.5 s early |
| **Keep out** | by your distance as each begins: within 1.6 m the hat-butt, beyond it the spin sweep; pause 0.8 s | spacing: neither hugging it nor standing at a sleeve's length is safe |

**The tempo** (1x, 0.5x, 0.25x; DEBUG only) holds `game.time.slow('sparring.tempo', k)` while a string runs inside the circle, and
frees it the frame you step out or pick 1x: the whole world, the Courier too, so every number above stretches by 1 / tempo in real
seconds and their relations stay (the parry's press window is real seconds: Petra's rule). A study of the shapes, not an easier test.

The words (the strings' labels and lines, the log's lines) are placeholders for Espada's. `STRAWMAN.swing.telegraph` and `.reach`
(`progress/combat/dunemaw.js`, Dovina's) are no longer read: the swing's numbers are its row in `STRAWMAN_MOVES`.

## 7. The extras

- **The frame meter**: built as a stand-in (section 2). Cheap to light later: one strip of tiles, its colours set per tile.
- **The mirror**: built as a stand-in. A real reflection is a second render of the room from the mirror's side, so its cost is the room's
  own: the frame from the striker's place in the ring is 85 draw calls and 38,534 triangles (measured, section 9), so a reflection of the
  testroom zone alone adds about that again, about 170 in all, well inside the 450 budget; the triangles are cheap at a low resolution.
  Proposed so it costs only when it is worth it: a low-resolution render (a quarter of the 480 lines) of the testroom zone alone, from a
  camera mirrored in the glass, drawn only while the Courier is inside the bales; off otherwise, and never with the Workshop's zone in it.
  Petra's to accept (the present, `render/present.js`, is hers).
- **The tempo**: built (section 6): `game.time.slow('sparring.tempo', k)` while a string runs, Strawman's clock on the sim step.
- **The juggle pen**: built: a fenced square of sand (6.6 by 6.6 m) under the hall's full 9 m, its gate toward the arcade. **For:** the
  launcher and the air string (the owner reported the launcher combo's aerial part). **Teaches:** the timing of the launcher's lift and
  the air string's rhythm, with room above to see it. **Lectern** (stand-in): which creature to juggle (a slip jelly first), and its
  weight. **Debug chest** `jugglepen`: the seven tools. **Needs:** a slip jelly that is `training` (its downs never counted) and comes back
  a few seconds after it falls, inside the pen (Petra: `creatures/jelly/`; the respawn as the room's pots do theirs, `POTS.respawn`).

## 8. The debug chests (DEBUG-CHESTS.md; rows in `src/debug/kits.js`, places `TR.wing.chests`)

| kit | stands | holds | for |
|---|---|---|---|
| `sparring` | beside the sparring circle's lectern | the seven tools | Strawman's strings: the parry in the window's glint, a combo answered |
| `parryrange` | beside the parry range's lectern | the seven tools, a Lachrymato Bottle | each tool's answer to a plain and an outlined shot |
| `statusbench` | beside the status bench's lectern | the seven tools, a Lachrymato Bottle | each status landed, its aura, its glyph, its log line |
| `jugglepen` | east of the juggle pen's gate | the seven tools | the launcher and the air string |

No QAIS test names them yet (each station's mechanic comes first): they are first drafts, to be cut to what each QAIS test needs when it
is written, and they go when those tests pass.

## 9. What was built, and what it costs

Built (2026-10-10, Calissa): the arcade, the hall, the five stations' floors, the five lecterns, the stand-ins (the pitcher, the caster,
the eleven roly-polies), the frame meter's strip, the mirror's frame and glass, the four lamps, the places, four debug chests. Every
static part goes through `level.box` and `addGeo` (merged by colour, in the testroom zone); the dressed marks are three meshes (the
quarry tiles, the plaques, the glass) on programs the room already uses.

Measured, one presented frame with every pass counted (as `scripts/perf.mjs` counts them), from fixed camera poses, on the base
(d1b12d2) and on this branch:

| pose | base: calls / triangles | branch: calls / triangles |
|---|---|---|
| the room, from the firing mark down the lane | 111 / 29,968 | 104 / 34,832 |
| the room, looking where the south wall was (now the arcade) | 62 / 20,474 | 98 / 39,558 |
| the room, facing the Workshop's door | 465 / 187,440 | 455 / 191,650 |
| the room's far corner, facing the door | 468 / 188,380 | 456 / 192,612 |
| the wing, the striker's camera in the sparring circle | (no wing) | 85 / 38,534 |
| the wing's far end, facing back through the arcade | (no wing) | **497** / 201,078 |

The last is over the 450 budget, and the cause was there before the wing: the room draws the whole Workshop zone whenever the
Workshop's door is in the frustum within 40 m (`render/zones.js seesDoor`), and the room facing its door was already 465 to 468. From
the wing's far end the door is in view through the arcade's west bay (a real sliver, at a grazing angle). Handed to Petra
(docs/handoffs/petra/2026-10-10-from-calissa-combat-wing.md) with the fixes: an occlusion test through the doorway, or a portal backdrop.
`npm run perf` (its four places), base then branch: the workshop 406 to 410 calls, 133,996 to 135,334 triangles, 162 to 162 programs
(geometries 2,097 to 2,113, textures 175 to 176); the dunes, the Dunemaw's hall and the garden within 1% on calls and triangles, no
program compiled after the warm-up. perf: OK.

Not verified: the feel of the fence and the bench to run into in a fight (the owner's play); the hall's light at night (the shots were
at the game's noon); any mechanic (none is built).
