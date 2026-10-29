# The seven tools together: synergy, gaps, polish (Dovina's plan, 2026-10-22)

The owner's ask (2026-10-22):

> "Do you think any of the Lachryma tools need more polish? Hell look at all of them simultaneously to check on synergy and where
> there might be gaps as far as functionality is concerned."

This plan reads all seven at once:
- the psygun
- the Sondelass
- the Soul Brush
- the Veritome
- the Dreamvane
- the Crucibelle
- the Lockheart

The audit read the code (2026-10-22) and ran nothing. Every claim below comes with its file. It is a plan; what is built says so.

## 1. What the seven are now

| tool | belt | at the start | its job | what it costs, what it gives |
|---|---|---|---|---|
| psygun | back | worn | the generalist: ranged damage; 100 caster shells reach every damage type and all 13 statuses | pool; shells by tier, tier IV a crack |
| Sondelass | back | worn | melee damage (the cutlass), traversal (the hook), angling (the rod), the finisher (zandatsu) | pool for specials; gives Lachryma and cubes (zandatsu, fish) |
| Soul Brush | hip | worn | setup and area: paint (a feeling's status on the ground), mop, the Paint Dive, Celestial mode | Bottle; gives Lachryma (mop, soak) |
| Veritome | hip | worn | information (tags, plates) and control (the Flash's stun, reprogramming) | Flash 6; gives Lachryma (a held capture) |
| Dreamvane | back | **in the box** | economy and information: dowse, the pick, the survey, the fork's lure | Dreamquake 10; gives cubes, charting |
| Crucibelle | hip | **in the box** | control and support: the toll's stagger, five songs (Lullaby sleeps, Rally feeds the pool) | songs 8 to 24 |
| Lockheart | neck | worn | sustain and economy: drinks overflow and down minds; the Opening's gamble; the catch | the coffin's fill, a Possibilikey |

The audit's tables give:
- **every damage type:** at least two producers each;
- **every status:** at least one producer;
- **roles:** coverage by tool.

The full audit is in the session's notes; what matters is below.

## 2. What already works together (keep and build on)

1. **The finisher trio.** A stun or a sleep opens three answers:
   - **Producers:** the Veritome's Flash, the Crucibelle's toll and Lullaby, the hook, the Lockheart's Daze and Hush.
   - **Readers:** zandatsu (the Sondelass: Lachryma and cubes), reprogramming (the Veritome: a macro), the catch (the Lockheart: a
     spirit), each scaled by stun depth.
   - This is the kit's spine, and it is good.
2. **The paint map.** The Soul Brush and the psygun's Paint shell write it. The Paint Dive and the creatures standing in it read it. The
   mop drinks the fight's slicks, and the Lockheart's coats among them.
3. **The Lachryma flow.**
   - Zandatsu and photographs gain Lachryma; what overflows feeds the Lockheart.
   - The mop fills the Bottle, which the paint spends.
   - Rally cuts every tool's cost by a quarter.
4. **EmO,** raised by every blow, read by the Veritome's tag and by the Lockheart's catch odds.

## 3. What is wrong (by weight)

### 3.1 The domains do not reach the tools (the biggest)

- **What should be there.** `RAMP.tools` (`progress/godpowers.js:102`) holds 17 widenings, a domain's level stretching a tool. They
  cover:
  - blink and grapple reach;
  - how long blade mode and the reprogramming window hold;
  - the survey's radius and the crystal reveal's;
  - a macro's length and the macros kept;
  - the Lockheart's hold;
  - a sunder's cuts;
  - and more.
- **What is read.** Only two are read anywhere: `divination.reckon` (`world/emocean/seachart.js:57`) and `divination.forecast`
  (`progress/weather.js:152`). The other fifteen are dead wire.
- **What it costs.** Levelling a domain changes almost nothing in the hand. Progression's whole middle (hours 2 to 10) rests on this.
- **Two tools have no widening at all:** the Crucibelle and the Soul Brush.

### 3.2 The psygun does everyone's job

- **The overlap.** The 100 caster shells duplicate the other tools' signatures:
  - a Lullaby shell, against the Crucibelle's Lullaby;
  - a Taunt Doll and a Double, against the Crucibelle's mirage;
  - a Paint shell, against the brush;
  - a Calm shell that clears every status in its radius, other tools' stuns and sleeps included (`shellcastersown.js:98`).
- **What follows.** With the psygun worn, the other six are optional. The belt choice (5 of 7) stops meaning anything.

### 3.3 Six melee strings, one feel

- **One engine, one size.** Every tool's LMB string runs on one engine and lands at about 2.0 to 2.7 power a second:
  - cutlass 2.7;
  - brush 2.6;
  - staff 2.6;
  - flail 2.2;
  - book 2.2;
  - bell about 2.
- **One difference.** They differ only by a rider. Monster Hunter's lesson is that weapons differ by rhythm and role, not by a
  percentage.

### 3.4 Gaps

- **No field mend for the vessel's cracks.** Sustain is the pool only. The Soul Brush's MEND mends pots, not you
  (`techniques.js:197`).
- **The Celestial Brush acts on no creature.** `techniques.js` never touches `creatures`: Okami's brush, but not its fights.
- **The Veritome is Ego on paper only.** `types.js:47` names it, but neither the Flash nor reprogramming strikes.
- **One tool has the guard-break answer to a guarded foe:** the Sondelass (Guard Break, Guard Crush). The psygun's Piercer goes
  through instead.
- **On the rail, the Dreamvane is a passive radar with no verb** (`mounts.js:34`).
- **The Lockheart's conversion mode is data with nothing calling it** (`table.js:61`, `CONVERT`).
- **A fresh save never meets the Dreamvane or the Crucibelle.** They start in the Pneuka Box, and nothing in the first hour points at
  them.

## 4. The plan

### K1. The domains reach the tools (wire the fifteen; add two)

Every `RAMP.tools` key is read at its tool's one call site through `game.psyche.widen(key)`. Each is one token, as the skiff's seam
was.

| key | the call site it multiplies |
|---|---|
| `ouranurgy.reach` | the blink's distance; the hook's reach |
| `ouranurgy.still` | blade mode's slowed time; the reprogramming window; Celestial mode's stillness |
| `divination.survey` | the survey pulse's radius |
| `divination.reveal` | the crystal reveal's radius (the dowse, and the Crucibelle's Seeing) |
| `possession.macro`, `possession.hold` | a macro's length; the Lockheart's held Figments |
| `spellscription.slots` | the Veritome's kept macros |
| `alteration.cuts`, `alteration.swell` | the sunder shell's cuts; a swell's reach |
| `manifestation.span`, `manifestation.count` | a manifested structure's life and count |
| `psychokinesis.weight`, `psychokinesis.throw` | the god hand's lift and throw |
| `ouranurgy.lane` | the ship's lane change on the rail |

Two new keys (Dovina's data, added with this plan):
- **`possession.song`:** how long a song's hold lasts (Lullaby's sleep, Seeming's forgetting).
- **`alteration.paint`:** the paint's spread.

**The law kept.** A widening is a range or a count, never accuracy or tempo (those are an attribute's: the glossary). At level 1 the
tool is exactly as it is now.

### K2. A shell borrows its tool

- **The rule.** A caster shell that does another tool's signature job loads only while that tool is worn on the belt, and does it at
  two thirds of the tool's own power. Its row gets `borrows: '<tool>'`.
  - Lullaby, Taunt Doll and Double borrow the Crucibelle.
  - Paint borrows the Soul Brush.
  - Hatch borrows the Lockheart.
- **What follows.** The psygun reaches further, but the native tool stays best at its job. The belt choice comes back to life: wear the
  Crucibelle and your gun sings too.
- **The Calm shell keeps its clear,** but it no longer wakes a creature you put to sleep yourself within the last few real seconds.
- **Prior art:** Zelda's bomb arrows (the bow fires bombs only if you carry bombs), Kingdom Hearts' summons (a friend's power through
  your Keyblade).

### K3. Each melee string a rhythm, not a percentage

The power stays near today's. Each string's shape follows its tool's job:

| string | its rhythm |
|---|---|
| **cutlass** | the fastest and most damage: the blade |
| **brush** | its blows paint where they land: setup |
| **staff** (the Dreamvane) | slow and heavy, and the only string that breaks a guard besides the cutlass's Guard Break: the pick's mining |
| **flail** (the Lockheart) | drinks a little with each blow; its last blow pulls |
| **book** (the Veritome) | its blows reveal: a struck creature's tag reads one line further for a few seconds |
| **bell** (the Crucibelle) | on the beat its blows double their stagger: the rhythm is the damage |

Monster Hunter's weapons are the model: the job is in the motion.

### K4. Fill the gaps

- **Kintsugi (the Soul Brush).** A Celestial technique that mends one cracked region of the vessel with gold. It costs Lachryma from
  the Bottle and needs a still moment (a brush stroke held), so it is never mid-combo. The vessel's cracks mend gold, as a sibling's
  shatter does: kintsugi is the house's own image.
- **The Celestial Brush on creatures (Okami's).** Its slash cuts what it crosses. Its circle binds, a halt. Its sun stroke burns, a
  Fury build. Each is costed as its technique is now.
- **The Veritome's Flash strikes Ego,** at a light power, so the book deals its own type.
- **The staff's guard break** (K3).
- **The Dreamvane on the rail gets a verb:** a survey ping that shows the next wave's edge marks a bar sooner.
- **The Lockheart's conversion mode,** built from its data.
- **The first hour meets the Dreamvane.** A first-path step (FIRST-HOUR.md 4): wear the Dreamvane and strike a crystal in the Dunes.

### K5. Pairs: two tools worn make a third thing (a plan, for the owner's yes)

- **What a pair is.** A move that works only with both tools worn, opened by an achievement (arts only by achievement), on the tool in
  hand. It is the Zelda fuse: one thing from two.
- **A first four:**
  1. **The psygun and the Veritome: the mark.** A creature in the Flash takes your next shot as a weak-point hit.
  2. **The hook and the Crucibelle: the rung line.** A toll while the hook is bitten rings down the line, staggering at the hook's
     reach.
  3. **The Soul Brush and the Dreamvane: the painted lure.** The fork where it lands lays paint of the weather's feeling round it.
  4. **The Lockheart and the Soul Brush: the coffin's mop.** The hoover drinks paint off the ground into the coffin.

### K6. Polish, smaller

- **The bell's toll** is free and weak by design ("the bell is support"). With K3's beat-doubling it earns its place.
- **The Veritome's macro hints are written for slip jellies** (`functions.js:51`). They should read for any creature.
- **The loadout note in `loadoutopen.js`** says `sond.string.best` has no writer. It has one (`tracking/moves.js:40`), so the note is
  stale.

## 5. Who

| # | what | who |
|---|---|---|
| K1 | the call sites (each one token, in each tool's file) | Petra's files; Dovina offers to make them (the owner: "offer to take some of the mechanical work off Petra") |
| K1 | `possession.song`, `alteration.paint` rows | Dovina (built with this plan) |
| K2 | `borrows` on the shell rows and the power | Dovina (data) |
| K2 | the load check | Petra (the shell runner) |
| K3 | each string's rider | Petra (moveset), Dovina (the numbers in `progress/combat/moves.js`) |
| K4 | kintsugi and the brush on creatures | Petra (techniques), Calissa (the gold), Espada (words) |
| K4 | the Flash's Ego strike, the rail's survey ping, conversion | Petra |
| K4 | the first-path step | Dovina |
| K5 | pairs | after the owner's yes: Dovina (rules, achievements), Petra (verbs), Calissa (looks) |

## 6. For the owner

1. **K2 trims the psygun.** It loses the jobs it borrows when the lending tool is not worn. My call: yes. It is the one change that
   makes the belt a choice again.
2. **K5, pairs:** yes or no? They are the most fun thing here, and also the most work.
3. **Kintsugi as the field mend:** the Soul Brush is the mender, and the gold on your vessel is the reward for doing it.

## 7. The owner's rulings (2026-10-22)

- **K1, the domains reach the tools:** built. Sixteen reads across nine files, on Petra's terms (89d4c195). Six keys wait for their
  feature: the macro's length, the macros kept, the hand's lift weight, the Lockheart's hold, a sunder's cuts, a map's copies.
- **K2 is replaced.** "Shells are only OP now because we haven't established their methods of procurement yet, like a spellscription
  crafting system that creates shells." So the psygun keeps its reach, and the balance is in how a shell is had: **shells are crafted by
  Spellscription**. That is a plan of its own (Dovina's, next): recipes, materials, the domain's level as the ceiling of a shell's tier,
  and a craft's count where `spellscription.slots` and `spellscription.copy` find their sites. `borrows` is dropped.
- **K4, the Celestial Brush on creatures, is dropped.** "it already has the ability to deal with enemies through the Doodle Cat style
  prompts that pop up on enemies that eliminates them when drawn in sequence." That is Magic Cat Academy's way: draw the sign shown over
  the ghost. The audit missed it because the prompts live outside `techniques.js`.
  - It needs balancing: Dovina's, from a measure of how long a prompt run takes against how much it does.
  - The dot (Celestial mode's mark, `celestial.js:102`) is "a little buggy". That goes to Petra as a bug to find in play.
- **Kintsugi:** yes. The Soul Brush mends the vessel's cracks in gold.
- **K5 is replaced by one main tool and one sub tool** (the owner: "to make builds much more of a conscious choice ... one main tool
  and one sub tool. That solves your pair question too"). Section 8.
- **K3, each string a rhythm:** not ruled yet.

## 8. Main and sub: the plan (Dovina's proposal, for the owner's yes on its open points)

**The rule.**
- **What is worn.** The belt holds two tools, where today it holds five places:
  - **the main tool**, in hand with all its verbs;
  - **the sub tool**, which lends the main one verb and one passive.
  The other five wait in the Pneuka Box. The places (back, hip, neck) retire.
- **Prior art:**
  - Bayonetta's hands and feet: two weapons, one body, and the pair makes the style.
  - NieR: Automata's light and heavy pair, whose combos change with the pairing.
  - Monster Hunter Rise's switch skills: one weapon, a chosen kit inside it.
  - Elden Ring's main hand and off hand.

**What a sub tool lends: one verb and one passive, the same whatever the main.**

| sub tool | the verb it lends (one key) | its passive |
|---|---|---|
| psygun | a snap shot, the one round of the main's own aim | the ship's gun on the rail, as now |
| Sondelass | the hook, to a point or to a creature | none: the hook is the gift |
| Soul Brush | a flick of paint in the weather's feeling | kintsugi, the field mend |
| Veritome | the Flash | the tag reads one line further |
| Dreamvane | the fork, the lure thrown | the vane: the weather and the crystals' signatures |
| Crucibelle | one toll, the stagger round you | the beat: a blow on it hits harder |
| Lockheart | the gulp, the parry that drinks | it drinks the pool's overflow, as now |

**The pairs (the owner's 7C2 = 21).**
- **Built (2026-10-29):** each special's plan (`PAIR_SPECIALS`), its opening (`pairSpecialOpen`: 50 downs or 40 lends with the pair worn, `pair.<n>.down` / `.lend`, tracking/pairworn.js), the 21 achievements and the Fool's Journey (`progress/pairachievements.js`), `pair.open` said once. The specials themselves are Petra's to build, a wave of four at a time. **Each special's two verbs are named** (2026-10-29, `PAIR_SPECIALS[n].main`, `specialVerbs(n)`): the tool that must be the main and which of its verbs carries the special; the sub is the pair's other tool, lending its verb on R. Worn the other way round, the pair gives its lend and no special: one order, so it is learnable.
- Each pair has one pair special, opened by an achievement done with that pair worn (arts only by achievement).
- They come in waves of four, so the 21 are earned and built over rounds, not all at once.
- The first four are TOOLS-TOGETHER.md 4 K5's, now as pairs:
  - psygun and Veritome, the mark;
  - Sondelass and Crucibelle, the rung line;
  - Soul Brush and Dreamvane, the painted lure;
  - Lockheart and Soul Brush, the coffin's mop.

**What follows elsewhere.**
- **The rail's mounts:** the main and the sub, the sloop's two slots as now.
- **A puzzle duel's moves:** the two tools' moves. The Veritome as main gives the duel no move today, so it lends its Flash as Delay's
  stand-in.
- **The first hour (FIRST-HOUR.md):** a new save starts with the psygun as main ("the most accessible") and the Sondelass as sub. The
  first path gains a step that swaps one.
- **The Movement Arts:** none is a tool's, so none changes.

**Open, for the owner.**
1. **Where may you swap?** My call: at a Shrine, or at the Pneuka Box anywhere out of a fight, but never mid-fight. That way the choice
   is made before the fight, not dodged inside it.
2. **Does the sub's verb go on one key for every sub (R, say)?** My call: yes, one key, the same for all. Every main's own R move
   (the hammer fan, the Tidecutter, the Dreamquake) moves to its R held.
3. **The new save's pair:** psygun main, Sondelass sub?

**The owner's rulings (2026-10-23).**
- **R:** "I agree with 'R' being the swap key." Built as proposed in open point 2: R is the sub tool's verb, the same key for every
  sub. Still asked: whether "swap" meant R also trades main and sub on the spot. My call stays no, since a swap mid-fight dodges the
  choice.
- **21 pairs, not 42.** The order of a pair does not matter, so main-and-sub flavours its special but does not double it.
- **The 21 pairs take the Major Arcana, I to XXI.** The owner's pick: drop The World or The Fool, Dovina's choice.
  - **The Fool is dropped** because the Fool is you: the Courier, in a game called Fool's Fortune.
  - The 21 pairs are the stations of the Fool's journey, from the Magician (the pair a new save starts with) to the World.
  - Each card is matched to what its pair does together.
  - These are the pairs' themes. The specials' names stay plain until the owner calls them finalized, and then Espada proposes.

| # | card | the pair | why |
|---|---|---|---|
| I | the Magician | psygun + Sondelass | the first card, the new save's pair: the tools laid on the table |
| II | the High Priestess | Veritome + Dreamvane | the scroll and the veil: what is hidden, read |
| III | the Empress | Soul Brush + Lockheart | what the coffin draws in, the brush gives back: abundance |
| IV | the Emperor | psygun + Crucibelle | the beat commands and the gun keeps it: order, a drill |
| V | the Hierophant | Veritome + Crucibelle | bell and book: the rite, the teaching |
| VI | the Lovers | Sondelass + Crucibelle | the blade and the bell in time: a duet |
| VII | the Chariot | Sondelass + Dreamvane | the hook and the vane: travel, two forces held in one hand |
| VIII | Strength | Sondelass + Soul Brush | the edge tamed by the soft brush: gentle force |
| IX | the Hermit | Soul Brush + Veritome | the scholar's desk: study alone, by lantern |
| X | the Wheel of Fortune | Lockheart + Dreamvane | the wheel of odds and the turning weather |
| XI | Justice | Sondelass + Veritome | the sword and the scales: the blade and the appraisal |
| XII | the Hanged Man | Veritome + Lockheart | a moment held: the plate and the coffin |
| XIII | Death | Sondelass + Lockheart | the blade and the coffin |
| XIV | Temperance | Soul Brush + Crucibelle | pouring between two cups: paint and song blended, the healing pair |
| XV | the Devil | psygun + Lockheart | the chain |
| XVI | the Tower | psygun + Dreamvane | the bolt from the sky |
| XVII | the Star | Soul Brush + Dreamvane | water poured on land and pool: the painted lure |
| XVIII | the Moon | Crucibelle + Dreamvane | the mirage under the sky: illusion |
| XIX | the Sun | psygun + Veritome | the flash and the shutter: all shown (the mark) |
| XX | Judgement | Crucibelle + Lockheart | the trumpet opens the coffin |
| XXI | the World | psygun + Soul Brush | the first tool and the mending one: the circle closed |

Each tool sits in six cards. The first wave of four (above) is the Sun, the Lovers, the Star and the Empress.
- **The economy simulation for hours 2 to 10:** not now. It runs only when it decides what feature to build next.
- **Where you may swap** (the owner, 2026-10-23): "I agree weapon swapping should be allowed anywhere outside combat." Built so: `swapRefusal` in `progress/toolpairs.js`.

## 9. Celestial mode's targets drawn over the paper (the owner, 2026-10-22)

> "why don't we have it so that selectable figment targets are rendered on top of the paper shader canvas? That way when you mark them it
> can have a much more distinct effect and the player can immediately see which figments they can affect"

**Why the dot reads as buggy (read from the code, not seen in play).**
- **The paper covers everything.** It is a CSS `backdrop-filter: sepia(.8) ...` over the whole screen at z-index 40
  (`tools/soulbrush/canvas.js:27`). Everything under it is washed alike, so a target cannot be told from the ground.
- **The mark goes sepia.** It is a vermilion `celestialMark` glyph popped in the world (`techniques.js:131`), so it sits under the paper
  and its red is washed out too.
- **The dot's reach is small.** It picks within 14 px plus the thing's radius on screen (`techniques.js:127`). A far clapperjar is a
  few pixels across.
- **Prior art:** Okami's Celestial Brush, where the canvas turns to paper but the brush's targets stay readable on it; Magic Cat Academy,
  where the ghosts and their symbols are the only things drawn bright.

**The rule: what is selectable (Dovina's).**
- **A thing is selectable when the brush can act on it in this hold.**
  - Today that is `things()` (`techniques.js:73`): pots, pushable or liftable pieces and clapperjars, within 30 m and on screen.
  - Add **every hurtable creature** (`hasTag(c, 'hurtable')`) within the sigils' 16 m.
  - Leave out an ally and an aberrant (an aberrant takes no blow in the world).
- **The prompts go to every hurtable Figment** (`sigils.js`, today clapperjars only). Each gets a queue whose length is set by its
  class:

  | creature | queue length |
  |---|---|
  | a clapperjar | 1 to 2 (as now) |
  | a slip jelly | 2 |
  | a Lantern Wisp | 3 |
  | a raider | 3 (as now) |
  | the FOE | a queue a phase, refilled as its crown cracks |

  The lengths are Dovina's to balance from a measure: the real seconds a prompt run takes, against the hits the same time with the club
  would land.

**The look (Calissa's).**
- **Selectable:** drawn clear of the paper in its own colours, outlined by a thin sumi line, as if the paper parted round it.
- **Not selectable:** stays under the wash.
- **Marked:** your seal (`drawSealFace`, your `cradles.mine`) stamped over it in vermilion on the paper's top layer, and its outline
  turns vermilion. Dotted again, the stamp lifts. This is the hanko as the mark, so the gesture means "this one is mine".
- **Its prompts** (the queued sigils) ride above the paper with it.

**The dot's reach (the code, Petra's).** A dot lands on the selectable thing whose drawn outline it falls in, or else the nearest within
28 px. It never lands on a thing that is not drawn.

**The route (Petra's call, measured at the gate).**
- **The whole route:** the paper's sepia leaves CSS for a screen pass in the post stack (the time grade's way, a screen volume).
  Selectable things are drawn after it on their own layer, at their own colour.
- **A cheaper first step:** keep the CSS paper, and draw each selectable thing's outline, its prompts and the seal on the ink canvas
  above `.paper`. The body itself stays sepia, but the outline and the seal read.

### 9.4 The prompts' balance (Dovina, 2026-10-23; `SIGIL_QUEUE`, `sigils.js`)

Petra built the targets (her note of 2026-10-23): the dot lands in a drawn outline, else the nearest within 28 px; every hurtable
creature within 16 m is markable and has prompts. Her placeholder struck 1 a mark, so two prompts took a slip jelly from 8 to 6. The
owner's ask is the Magic Cat Academy rule: a queue drawn out undoes the creature. So:

- **A queue's length is the creature's health when dealt:** one mark for every 2 (`markHp`), at most 5 (`max`). A clapperjar keeps 1
  or 2.

  | creature | health | queue |
  |---|---|---|
  | a clapperjar | (breaks) | 1 to 2 |
  | a Lantern Wisp | 5 | 3 |
  | a slip jelly | 8 | 4 |
  | anything over 10 | | 5, then a fresh queue |

- **A cleared queue strikes 2 a mark,** so a queue drawn out undoes anything of up to 10 at once.
- **Anything with more than 10 is dealt a fresh queue** and goes on, as Magic Cat Academy's big ghosts do. This was a bug before: a
  creature still standing kept an empty queue, and the brush could never mark it again.

**The price is the pool, not time.** The paper runs the world at a twenty-fifth of its speed, so a prompt costs almost no world time, and
real seconds are not the measure (section 9 asked for one; this replaces it). A mark costs its drawing's technique (3 to 6 Lachryma) and
the paper's drain (1.5 a second, about 1 a mark), about 5 in all:

| target | marks | Lachryma | notes |
|---|---|---|---|
| a slip jelly, alone | 4 | about 20 | a fifth of the starting pool |
| three slip jellies sharing heads | 6 to 8 | 30 to 40 | about 4 each |

Prompts are the crowd answer and the safe answer, paid for in Lachryma. The club stays the cheap, close answer for one.

**The cap's reason:** 5 is Magic Cat Academy's longest queue a ghost, and the most a glance takes in over a head.

**Measure after the owner's play:**
- the pool spent a prompt run;
- the marks per kill in a crowd (`sigil.pop`'s `popped` against `cleared`).

If one creature costs more than about a quarter of the pool, `markHp` goes to 2.5.

