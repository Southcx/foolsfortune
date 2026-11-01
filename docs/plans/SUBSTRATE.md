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
| **the vessel** | the Vessoul's body, in whatever form it wears | health: cracks, mended, shattered and made whole |
| **the feelings** (seven) | what any Lachryma is *of* | a blow's type, a status, a weather, a taste, a colour |
| **the clock** | the game day and its hours | weather, regen's rhythm, a game day's resets |

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
- **Skiff:** already the pool. A wreck at an empty pool cracks the vessel, which is its own real cost.
- **Arena:** percent *is* the cracks (section 3, F5).

What it teaches: one body, whatever shape you take. The Hanko plan's "a body's pool is its hull" becomes true.

### F2. The pool on the sea and the rail

The pool is ammo everywhere. A plain shot costs on the water what it costs on foot: 4, with the rail's absorb (+2) and graze (+1)
refuelling it, as the parry soak does on foot.
- **The Surge** fills only from absorb past a full pool. Today one absorb is counted twice.
- **The open sea's fuel** becomes the Lachrymato Bottle it is already drawn as.
- **One cost per tool.** A tool costs the same in every mode, with a mode's *modifier* shown where it bites. Today the flash is 6 on
  foot and the rail, and 8 plus a 12 s cooldown at sea.

### F3. Wake the type chart

**A Figment's damage type is its feeling's** (`TYPE_OF`: Wonder and Gall Ego, Mirth and Fury Impact, Desire Influence, Grief Illusion,
Dread Delirium). Set `c.affinity` from the creature's feeling, and the trump cycle, x1.25 and the build bonus all start working.
- The aberrants' palettes and the weather's feeling already say what a Figment is of.
- The flash, the parry's stun and the toll go through `strike` with their own types (Ego, Impact, Influence), so the mind and EmO hear
  them.
- **The stun bonus moves into `strike`, once.**
- A tool's type is its own: the brush's paint is its feeling's type, the Lockheart Delirium, the Crucibelle Influence.

What it teaches: the Pokemon chart, as feeling against feeling. You learn which feeling answers which by fighting.

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

### F5. The Arena on the vessel (proposed only: FIGHTER.md is in flux)

Smash's percent is the vessel's cracks drawn as a number: crack sum / 3.6 x 100. The fiction for launch is the clay body splitting
under blows: knockback grows with your cracks, as it grows with percent. A KO past a blast line is the Arena's shatter, made whole on
the respawn plate. The 60-point shield bubble is the pool, spent under a `guard` tag. Melee's numbers all stay.

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

## 4. The Domains: yes, now, as dials on the substrate

South asked whether now is the time to build the Domains out. **Yes, but as the second half of this work, not the first.** A domain's
impact should be *which dial of the substrate it widens*. Until the substrate is one thing (F1 to F4), building the domains out means
writing their impact onto 22 meters.

**The rule: each domain widens one family of the substrate's dials.** It keeps the glossary's law: widening is reach, a count, a
duration or a share, never accuracy or tempo, which are the attributes'. And it is never a flat damage multiplier: skill decides
damage.

| domain | its dial on the substrate | what its level widens (examples) | its gap today |
|---|---|---|---|
| **Ouranurgy** (space and time) | **the clock and reach** | ranges, a hook's reach, a portal's span, the regen delay's start | strong; three dead keys to wire or cut |
| **Manifestation** (making) | **Lachryma made solid** | a made thing's hold and hp (a creation, a ward, a wall, a spirit called), the Bottles' capacity, how much overflow condenses into cubes a game day | starved: 3 sources off the hand; give it what the tools make (the brush's paint set, a shell's deployable, a sigil's wall). The vessel's own numbers stay the attributes' (Willpower the shield, Resilience the mending) |
| **Divination** (knowing) | **what is shown** | the Figment telegraph ladder (built), tags, forecast hours, a foe skill seen, stealth's watch read sooner | strongest; keep |
| **Psychokinesis** (force) | **the blow's push** | knockback, a throw's carried weight, launch, stagger length (never damage) | the psygun earns it nothing; give it the gun's push |
| **Possession** (other minds) | **minds and EmO** | a status's duration on a foe, EmO's yield band, reprogramming's slots, a decoy's pull | spread thin; it owns mind and EmO, the drain and the Lockheart |
| **Alteration** (change) | **the feelings** | a draught's strength and hold, paint's reach and build, a type's trump bonus, Transmute | the vaguest; this gives it the most visible dial, the type chart F3 wakes |
| **Spellscription** (writing) | **costs** | costMult on inscribed things (sigils, shells, seals), a sigil's count, copies | promised crafting unbuilt; it owns efficiency |

What this fixes:
- Every domain changes ordinary play.
- No two share a dial, nor a dial with an attribute: Alteration owns feelings, Manifestation what is made, the attributes the body.
- Each tool can pay the domain whose dial it pulls. A tool's kill pays its type's domain via F3, and the stub ends.
- Manifestation and Alteration stop overlapping.
- The six dead keys either get wired to their dial or are cut.

**The domains' experience follows the same rule:** a domain is fed by acting on its dial. Manifestation by making things; Possession by statuses landed and drains. Each needs a skill way that pays more, per the design law. The audit's flat-quality
sources go.

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

## 6. For South

1. **Ships take cracks like the Courier** (one vessel in every form), in place of "hits it can bear"?
2. **Plain shots cost the pool on the water** as on foot, refuelled by absorbs and grazes?
3. **A Figment's damage type is its feeling's** (the type chart woken)?
4. **The domains as dials**, a domain a round after the substrate fold, weakest first?
5. **The Arena's percent as cracks**: when FIGHTER is settled, or never?
