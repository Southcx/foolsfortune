# One Vessoul: the substrate, and every module as a modifier on it

South, 2026-11-01: "I'm obsessed with the idea that we use a small number of core parameters (like the lachryma pool), and then modify
them contextually and really think about how we can weave them together with novel mechanics nuance and elegance (being used as ammo,
shield and health, power source for the skiff and so on and so forth)." And: "Do you think now is a good time to start evaluating the
Domains and building them out more thoroughly WRT their identities and impact? How complicated are our damage formulas ... and how can
we steer them such that each module uses the same sort of underlying substrate?"

A meta-analysis, then a plan. The three audits behind it, every claim with its file and line, are kept in `research/`:
- `SUBSTRATE-AUDIT.md`: every meter and resource, and who reads it;
- `DOMAINS-AUDIT.md`: the seven Domains, as designed and as built;
- the combat audit, whose tables are summarised in section 2.

## 1. The thesis: the Vessoul is one being, so it has one body and one well

The glossary already says it: **the Vessoul is one being in several forms**: the god hand, the Pneuka Jar, the Courier, and the ships.
The code does not yet believe it. The substrate this plan proposes is what the fiction already is:

| substrate | what it is | it is read as |
|---|---|---|
| **the pool** (Lachryma) | the Vessoul's well of feeling | ammo, shield, fuel, boost, the cost of every art |
| **the vessel** | the body, in whatever form it wears: any body with a shell | health: cracks, mended, shattered and made whole |
| **the mind** | what a body thinks and feels with | afflictions (statuses), then mental state and EmO, then feelings, then behaviour |
| **the clock** | the game day and its hours | weather, regen's rhythm, a game day's resets |

**Force meets a hybrid body in five ways, the damage types** (South, 2026-11-01: "The damage types were carefully considered based on
the types of ways to interact with a hybrid physical-psychic body. Feelings and emotions determine behavior, they are downstream of the
damage types and status afflictions."). The chain is always the same, and always in this order:

> **a blow's type** (Impact, Ego, Influence, Illusion, Delirium) **->** what it does to the body (Impact: the vessel's cracks) and to the
> mind (the four psychic types: an affliction, doubt, charm, blind, confusion) **->** the mind's state (mental state, EmO) **->** the
> feeling it shows **->** what it does next.

A feeling is never a damage type. It is what a body feels *because* of what was done to it. A weather or a draught is a feeling pushed
on a mind from outside, which is why it sways a mind's settle and a status's build-up. It never changes a blow's type.

Everything else should be a **modifier with a visible source** on one of these four (CLAUDE.md: base change bad, modifiers good), or a
readout of one. A module may add a verb. It never adds a fifth substrate.

## 2. What the audits found

**The pool is already the best thing in the game.** It is ammo (a shot 4), the shield (a full blow drains 35), the skiff's hull and boost
(a flare 20/s), the cost of every tool, art and miracle, and refuelled by play (a bauble 6, a parry soak, a photo 5). That is F-Zero's
energy bar and Zelda's magic meter in one, and it is the template for the rest.

**Health is not one thing. It is 22 meters on 8 units.**
- **Shared (7):** the pool, the vessel's cracks, a creature's hp, stun poise, the four type-build meters, mind, EmO.
- **Local (15):** the rail's hits, the sea's hull, the Jelly Mount's hp 8, the god hand's Jar hp 100, a sibling's hp 8, pots, the
  clapperjar's one hit, crystals, the nursery, kraken arms, the Great Slip Jelly's crown, rail boss parts, the Strawman dummy's
  percent, the Arena's percent with its shield of 60, and the duel's Line, pool copy and EmO.
- **Units:** "power" (8 bursts a slip jelly), pool points, k (0..1), crack (3.6 shatters), whole hits, pot hp, Smash percent, joules.

**Damage is about 30 formulas over one real pipeline.** `creatures.strike` is a good spine: power, times the type multiplier, the
Courier's mind, a class art and a pair special. Beside it sit:
- **Ten per-creature `hurt` variants.** The stun bonus alone is re-implemented three times.
- **Seven intake formulas** for the Courier.
- **Duplicates:** two move-power tables (a rules row silently wins), two LANCE constants, two flash costs, and a dead `FOE.hp`.

**The type chart is asleep.** Five damage types, a trump cycle (Impact > Illusion > Ego > Influence > Delirium > Impact) and x1.25 on
a trump are all coded. But no creature ever sets `affinity`, so no trump ever fires. Temperament's `susceptibility` and `weakTo` have no
callers. In play, everything is Impact. The flash, the parry's stun and the toll call `stun.add` directly, past type, mind and EmO.

**Three modes fork the base rules (the law's worst breaks):**
1. **The rail and the sea** take blows as whole hits on their own hull. The pool is only ammo there, and a plain shot is free, where it
   costs 4 on foot.
2. **The Arena** replaces the pool and the vessel with percent, stocks and a 60-point shield.
3. **The duel** copies the pool, capped at 100, so stones and Willpower vanish. It writes the net back at the close, while the real pool
   kept regenerating underneath.

**Bugs the fold also fixes (to Petra's files, with my proposals):**
- **C1:** `costMult['*']` scales the *shield's* drain. A sapphire stone makes you about 18% tougher, a ruby 13% softer, and two class
  arts make the shield free. Costs of use and costs of harm need separate tag classes.
- **C2:** the duel's write-back can deny a total loss. `spend` is all-or-nothing and scaled by a ruby's cost.
- **Dunemaw's raid blows** scale with `pool.max`, so Willpower and the ruby cannot make you safer there. `SHIELD = 35` is declared
  twice.
- **Wall-clock timeouts:** the `mend` and `rally` modifiers use `setTimeout`, and a second MEND within 18 s is cut short.
- **Call-site multipliers bypass the modifier stack and show nowhere:** `bracelet.costOf`, `sigilK`, `reinsK`, `mendK`, fever.
  Reins is coded three times, for the rail, the sea and the skiff.

**The Domains are dressed alike and built unevenly.** Every domain has a glaze, a sign, four effects, a sound family, a mudra, a duel
power, an epic and a bracelet socket. Under the dress:
- **Experience is uneven.** Divination has 20 sources; Manifestation 11, only 3 of them off the god hand.
- **The level does little in ordinary play.** 6 of the 20 widening keys are declared and never read. Divination is the only domain
  whose level changes what you see in an ordinary fight (the Figment telegraph ladder).
- **No tool maps to a domain.** Each tool pays two to four domains; the Soul Brush pays four.
- **Identities overlap or blur.** Alteration is the vaguest. Alteration and Manifestation both make and shape matter.
- **Domains never touch combat numbers.** Neither does Luck.

## 3. The folds (ranked by how much they unify)

### F1. One vessel in every form

The ship, the Jar, the skiff and the Arena's body are the vessel in its forms, so they take blows the way the vessel does:
**the pool's shield first, then cracks.**
- **Ship:** its cracks are its regions (bow, stern, the two beams, the mast, the helm). A crack caps the pool 5% a region, as on foot,
  and shows on the Lachrimeter's tube as the held stretch, as on foot. Cracks carry from leg to leg of a crossing. A haven mends them
  in gold: kintsugi on the hull.
  - **The rail's "bears":** the ship's shatter, at a third full blow on one region or a total of 3.6.
  - **Hull classes:** a modifier on how much a crack takes (a galleon's thicker planking takes 0.4 a blow where a sloop's takes 0.65).
  - **Reins and Resilience:** apply once, in `vessel.hit`, for every form.
- **Jar:** `hp 100` becomes the vessel's cracks. Epics already pay through `vesselDamage.release`.
  - **Its shield is the Courier's pool** (Dovina's ruling, 2026-11-01, on Petra's built F1, `godhand/jarcracks.js`). One Vessoul, one
    pool: the Jar draws the `jar` form's `pool: true` shield from `game.lachryma`, the same store the god powers spend. A power cast mid-raid
    is shield given up, and that trade is the raid's decision (Ikaruga's absorb-or-spend, Mega Man's weapon energy as health). The target
    the waves are priced to: the Jar left undefended, the pool full at the raid's start and no power cast, still shatters by wave 5
    (Petra's measure without the shield: 19 hits, 133 hp, shattered in wave 5). If the shield carries it past wave 5, the waves' damage
    rises by the shield's share; the shield stays on.
  - **Measured and priced (v370):** at `raidDamage 7` the shield held every strike, so Petra raised it to 20. Undefended, the Jar now
    shatters in wave 5 after 19 strikes: 10 held by the shield (388 pool drained, about 1.9 pool a point) and 9 cracking it for 180 hp. A
    raider's clap is the baseline, the blow you let through. **`ballDamage 14` and `blastDamage 22` stay as they are** (Dovina, 2026-11-01).
    A lobber's ball is 0.7 of a clap, but it comes on a clock (every 3.4 real s) and you can answer it: grab it or send it back. One
    lobber left alone drains about 27 pool a throw against about 6 back from regen in the gap, so a full pool lasts about 60 real s and the
    Jar shatters about 45 real s after that. That is a nag that has to be answered, not a killer. A blast is 22 only at its heart, falls off
    to nothing at 1.1 R, is a one-off, and is usually a barrel you set off yourself. 1.1 claps at worst teaches you not to stand in your own
    fire. Look again if the raid waves get lobbers, or if blasts come from foes rather than barrels.
- **Skiff:** already the pool. A wreck at an empty pool cracks the vessel, which is its own real cost.
- **Arena:** percent *is* the cracks (section 3, F5).

What it teaches: one body, whatever shape you take. The Hanko plan's "a body's pool is its hull" becomes true.

### F2. The pool on the sea and the rail

The pool pays for what is special everywhere: a charge, a shell, a lance, a mount (South, 2026-11-01). **A plain shot draws on the
Lachryma round it, not the pool:**
- at sea it is free, because the Emocean is Lachryma;
- on foot it costs 4 today.

The plain shot's cost can become a modifier with a source you can see: the ambient Lachryma where you stand. It is free on the sea,
cheaper in a strong weather (Lachryma falling), cheaper on paint or by crude, and full under a roof with nothing near. That waits on
South: it changes how the psygun feels on foot. The rail's absorb (+2) and graze (+1) refuel the pool for the special shots, as the
parry soak does on foot.
- **The Surge** fills only from absorb past a full pool. Today one absorb is counted twice.
- **The open sea's fuel** becomes the Lachrymato Bottle it is already drawn as.
- **One cost per tool.** A tool costs the same in every mode, with a mode's *modifier* shown where it bites. Today the flash is 6 on
  foot and the rail, and 8 plus a 12 s cooldown at sea.

### F3. Wake the type chart: a body's constitution

South ruled the type chart stays the type chart: the five types are the ways force meets a hybrid physical-psychic body (section 1),
and feelings are downstream. So the chart wakes from **what each body is made of**, never from its feeling.

- **A creature's constitution** (data, a row per kind in the bestiary's rules) is how physical and how psychic its body is. It decides
  which types bite and which glance off:
  - a slip jelly is a body of slip, so Impact splits it and Illusion finds little mind to fool;
  - a Lantern Wisp is a mind round a flame, so Impact passes through and Ego (the self) and Illusion (what it sees) land;
  - a clapperjar is clay with a small mind;
  - an aberrant's mind is broken: Delirium is its weakness, and its body is its kind's.
- **The trump cycle stays as coded** (Impact > Illusion > Ego > Influence > Delirium > Impact). It is set from the constitution, not
  the feeling: `c.affinity` is the type the body *is*, and the x1.25 and the build bonus start working.
- **The psychic types go through `strike`.** The flash (Ego), the parry's stun (Impact), the toll (Influence) and the Lockheart
  (Delirium) all go through it, so the mind and EmO hear them. **The stun bonus moves into `strike`, once.**
- **Feelings stay downstream.** A frightened Figment (Dread in its mind, from blind or confusion) flees; a charmed one follows. Its
  feeling shows on its body and in its behaviour, and its type never moves.

What it teaches: a body and a mind are attacked differently. You learn by fighting which bodies are mostly flesh and which mostly mind.

### F4. One unit of damage: the blow

`power 1` is a plain shot. Everything is stated in blows:
- **A creature's hp** is how many plain shots it takes. A slip jelly is 8.
- **A pot's hp** is in blows: today's 100 per shot becomes 1, and 140 to 700 becomes 1.4 to 7.
- **Thrown hits** are joules / 40, which is already in blows.
- **The Courier's intake** is k (0..1, a full blow 1). That is the 35 pool or 0.65 crack it already converts to.

The duplicated tables go:
- one move-power table: the rules row;
- one LANCE;
- one flash cost;
- `FOE.hp`.

### F5. The Arena on the vessel (ruled yes, at Dovina's discretion)

Smash's percent is the vessel's cracks drawn as a number: crack sum / 3.6 x 100. The fiction for launch is the clay body splitting
under blows, so knockback grows with your cracks as it grows with percent. A KO past a blast line is the Arena's shatter, made whole
on the respawn plate. The 60-point shield bubble is the pool, spent under a `guard` tag. Melee's numbers all stay.

### F5b. Shatter: a blow that breaks what is cracked (South: "this opens up design space for creating moves that have 'shatter' capability")

Once every shelled body is a vessel (section 1), **a crack is a promise and a shatter is its keeping**. The vessels:
- the Courier, a sibling, the Jar and a ship;
- a pot, a clapperjar and a straw dummy;
- a Figment's glaze shell. Its poise meter is that shell's crazing, and the crackle break is the shell shattering.

**`shatter` is a property of a blow** (a number 0..1 on the move's row), like knockback. Against a body whose cracks pass
`1 - shatter` of its break point, the blow breaks it outright:
- **the Courier:** shatter. The Arena's KO is the same thing past a blast line.
- **a Figment:** the shell bursts, a stun at its next depth, open to the drain.
- **a pot or a clapperjar:** it bursts.
- **a ship:** the leg is lost.

Most blows carry none. A few carry a lot, and they are the game's finishers:
- the cutlass's Guard Crush;
- a fully charged smash;
- the Lockheart's flail at full fill;
- a tier IV shell.

What it gives play:
- **A read:** a cracked body is a threat to its owner, so cracking first and shattering second is a two-beat combo the eye can follow.
  The cracks show (kintsugi on the healed, crazing on the hurt).
- **A defence:** mend before you are cracked enough to break.
- **A Domain's dial:** how much shatter your blows carry is Psychokinesis's (force), and how cracked a body must be before you can see
  it is Divination's (section 4).
- **One rule everywhere:** the Arena's KO percent, the crackle break, a pot's burst and the vessel's shatter.

### F6. The duel reads the real pool

The duel's pool is the real pool, frozen while the board is up: no regen, no copy, no write-back. Its costs are spent from it, with a
duel's modifier shown on the tube. Stones and Willpower then count in a duel as they do everywhere. C2 dies with the copy.

### F7. Modifiers carry their source, and the UI reads them

Every cost, regen, max and intake multiplier goes through the pool's (or the vessel's) one modifier stack, with a `source` and a game
clock (never `setTimeout`):
- the bracelet;
- sigils;
- Reins;
- MEND;
- Rally;
- fever;
- the god hand's regen;
- the stones;
- the spreads;
- class arts.

The Lachrimeter's tube already shows caps as a held stretch. It should show the cost and regen modifiers the same way, two avenues each.
- **The god hand's regen x1.6** gets a source you can see: the hand drinks from the island's matter it holds.
- **C1's fix:** use tags (a tool, an art) and harm tags (the shield, a hull) are separate classes, and only use tags take `costMult`.

### F8. Weaves (new, from the substrate)

- **The skiff drinks the sun:** a regen modifier by the sun and the sail's hoist. The garage's sail parts trade a flare's cost against
  sun-regen. Parts have no pool keys today.
- **A brimming pool is loud:** overflowing raises your signature, so Figments sense you farther (stealth's `exposureOf` reads it).
  Overflow becomes a risk as well as a faucet.
- **Rejection caps the pool:** a Dissonance Level holds off a share of the pool's max, shown as the held stretch. The island pushes back
  on the hand through the well itself.
- **A dish is a held draught** (SPIRIT-COOKING.md): the same draught the pool already knows, stretched by the cook.

## 4. The Domains: now, in parallel, as questions

The first draft gave each domain one dial of the substrate. South asked for deeper ("the dials you listed are good starters, but I
think we can go much deeper than that! Think outside the box"). The design is now **DOMAINS.md**: each domain is one question every
interaction asks:
- Ouranurgy: when, and where?
- Manifestation: in what form?
- Divination: what is known?
- Psychokinesis: with how much force?
- Possession: whose?
- Alteration: of which kind?
- Spellscription: under which rule?

Each climbs a ladder: a widening (1 to 29), a new relation (30), depth (60 to 98), a rule-break at 99. It is built in parallel with the
folds above: each rung names the fold it needs.

## 5. Build order

1. **This plan to South** (the rulings in section 6).
2. **Dovina:**
   - the rules: the unit (F4), the type map (F3), the tag classes (F7), the domain dials (section 4) as data in `progress/domains.js`
     (the RAMP keys renamed to their dials);
   - `scripts/substrate.mjs`, which lists every meter and checks no module adds one;
   - the economy check that the fold moves nothing in the aim.
3. **Petra:**
   - `vessel.hit` for every form (F1);
   - the pool on the rail and the sea (F2);
   - `strike` as the one door (F3: the stun bonus, the flash, the parry and the toll through it);
   - the modifier stack with sources and the game clock (F7);
   - the duel reading the real pool (F6);
   - C1, C2 and the raid blow's scale.
4. **Calissa:** the tube's modifier stretches (F7), a ship's cracks and their gold (F1), the type chart's tells (a trump's flash).
5. **The domains' build:** a domain a round, with the weakest first (Alteration, Manifestation). Each round wires its dial, its
   experience, its god powers at 60, and a per-domain title at 99.
6. **The Arena (F5)** once South calls FIGHTER settled.

## 6. Ruled (South, 2026-11-01)

1. **Ships take cracks like the Courier.** Yes.
2. **Shots on the water:** only the special or charged shots cost the pool. A plain shot draws on the ambient Lachryma (F2).
3. **A Figment's type is not its feeling's.** The types are how force meets a hybrid body, and feelings are downstream of the types and
   the afflictions (section 1, F3). The chart wakes from each body's constitution.
4. **The Domains as dials:** yes, in parallel with the substrate where that helps. And deeper than dials (DOMAINS.md, from this).
5. **The Arena's percent as cracks:** yes, at Dovina's discretion. It opens shatter as a blow's property (F5b).

Still open for South: the plain shot's cost on foot as the ambient Lachryma round you (F2).
