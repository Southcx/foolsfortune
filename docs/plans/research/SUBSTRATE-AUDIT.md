# Substrate audit: every meter, who reads it, who writes it (read-only; nothing in the repo was edited)

For Dovina (game design). Read: CLAUDE.md, docs/GLOSSARY.md (first ~230 lines, then targeted lookups; the file is 274 KB), docs/DESIGN.md section 22 and 24,
docs/plans/SPINE.md, LACHRYMA-LOOP.md, HANKO.md, FIGHTER.md, ECONOMY.md, and the code named in each row. Everything below is from reading code;
**nothing was run**. Where a claim rests on inference (not a traced call) it says "by reading".

South's brief: few core parameters, modified contextually, woven together (pool as ammo, shield, health, skiff power). The house law: "Base change
bad, modifiers good" (CLAUDE.md; DESIGN.md 22.6).

---------------------------------------------------------------------------------------------------------------------------------------------

## 0. The short version

1. The code already has **seven real substrates**, and most of the game sits on them correctly: the pool, the vessel, the clock, the ledger, cubes,
   the seven feelings, and the `mind` scale (-2..+2, shared by creatures and the Courier). See section 1.
2. The **pool is genuinely multi-reading** (shield, ammo, fuel, skiff hull/flare, power source for cradles, mood input, hand fuel, duel mana) and its
   modifier stack is the cleanest piece of design in the repo. But it has **one structural flaw**: the `'*'` cost tag does not tell *use* from *harm*,
   so every stone, spread tally and art that discounts "costs" also discounts the shield and the skiff hull (section 5, C1).
3. The **hull is the one idea that exists five different ways**: vessel cracks + pool-shield (foot), skiff pool-as-hull (Raceway only), rail `hits/bears`,
   sea `hull/bears`, the Pneuka Jar's `hp 100`, and the Arena's `percent/stocks/shield`. Class arts (Reins) already treat three of them as one thing and
   are coded three times. This is the biggest fold (section 4, F1/F2/F3).
4. There is **no separate stamina** and **no second currency** (chips are cubes at 1:1 with a daily cap on winnings). The separate-meter debt is the
   hulls, the sea fuel, the rail's surge and the duel's pool copy.
5. Law violations that matter: the **Arena** replaces the pool/vessel outright; the **hand** rewrites pool regen as a mode rule; the **rail and sea**
   make the pool ammo-only while the **board** makes it hull; the **Dunemaw** prices blows as a share of pool max (so Willpower and bigger pools do
   nothing there). Section 6.
6. Real defects found by reading (worth a look before tuning anything): costMult-on-shield (C1), the duel's write-back through `spend` (C2), the
   un-cleared `setTimeout` on the `mend` modifier (C7), the vein lane feeding the Lockheart and palm die (C6).

---------------------------------------------------------------------------------------------------------------------------------------------

## 1. The substrates as the code has them

| # | substrate | where it lives | one-line API | what is *on* it (readers) |
|---|---|---|---|---|
| S1 | **the pool** | `src/courier/lachryma.js` `LachrymaPool`, `game.lachryma` (built `boot/pneuka.js:86`) | `spend(base, tag)` all-or-nothing, `drain` partial, `reserve/commit/refund`, `gain(n, source)`, modifiers `{ maxBonus, maxMult, regenMult, regenDelayMult, costMult:{tag\|'*'}, reachMult, caps, source }` | shield, ammo, fuel, board hull, hand fuel, cradle power, mood input, classart gates, spread "Self", Lachrimeter, ledger `lach.spent.<tag>` / `lach.gain.<source>` |
| S2 | **the vessel** | `courier/vessel/damage.js` `crack[6]` (mask, torso, armL, armR, legL, legR), `death.js`, `kilnui.js` (MEND for cubes) | `hit(k)`, `release(amount)` (pressure), `mendAll/mendBy`, `worn` | pool cap (5% a cracked region), shatter, kiln, kintsugi look, Reins/Bulwark/Steady/Courage arts, Resilience mend rate |
| S3 | **the clock** | `core/calendar.js` (game day = 1 real hour; game hour = 150 real s), `progress/weather.js` (`phaseAt`, `lightAt`, blocks of game hours) | `today()`, `phaseAt()`, `weatherAt()` | stones (moonstone/tigerseye regen+reach by phase: `boot/progress.js:106`), Tides art, sun plates + Raceway conditions, garden routines, stealth light, daily caps (palm die, chips winnings, rerolls, tend, Rebirth), shop price recovery, daily sea chart |
| S4 | **the ledger** | `game.ledger` (`L.get/inc`) | counters; achievements, Luck, familiarity, quest points, domain EXP, class-art opening are **predicates over it** | every monotone "level" in the game (no stored flags) |
| S5 | **cubes** | `world/treasure/cubes.js`; balance = ledger `cube.earned - cube.spent` | `earn(n, why)`, `spend(n, why)` | the only currency: shops, kiln (FIRE, MEND), Tithe, sea fuel, rail CONTINUE, press (Soul Alchemy fuel), garden, chips, wager, skiff paint, decor |
| S6 | **the seven feelings** | `progress/weather.js` `ASPECTS`, `TYPE_OF` | one key, seven values | weather, draught, damage-type -> status, paint, Lockheart-free chest decks, spirit stats (5 of 7), alchemy wheel (7 hues), vantages/awakenings, Raceway conditions, rail forms Astral/Umbral |
| S7 | **the `mind` scale** | `progress/combat/mind.js` `stateOf/pushed/settle` (-2..+2), Courier's `courier/mind.js` | same functions for creature and Courier | Courier power x0.67..1.5 / fragility x0.5..2 (`stones.js COURIER_MIND_EFFECT`; read at `creatures.js:108` and `damage.js:137`), garden rain, garden Dantian carry-in (`harmony.js:145`), Spillover/Excess arts |

How Lachryma shows up in its different **phases** (this is the real "phase diagram" South is asking about):

```
 in the world   baubles (loose, oxidise)  -- magnet/absorb (6 each) -->  POOL (liquid, 100, S1)
                crude (blot/slick/cask)   -- Soul Brush MOP 12/s ------>  BOTTLE (80/160/240, reserve)  --feeds POOL below 50% at 6/8/10 per s
                signature (presence)  -> read by Dreamvane, Lockheart hoover, Crucibelle reveal
 POOL --overflow--> LOCKHEART coffin (cap 100; fill 30-50 per coffin) --open--> outcomes (cubes 12/100, MEND, nuke...)
                \-> PALM DIE (0.03..0.08 cube per unit, 8..40 cubes per game day) -> CUBES (solid, S5)
                \-> MIND push if the source is a "drink" (bauble, bottle, absorb, gulp, parry), `brim` 2 s
 POOL --release (pressure/aperture)--> VESSEL cracks (S2)   [tier IV caster shell, Overload, epic miracle]
 POOL --draw from the place--> tier V World shell (nothing from pool or vessel)
 CUBES --> fuel measures (sea), CONTINUE (rail), MEND/FIRE (kiln), press fuel, chips, shells' worth ...
```

Everything is one liquid-to-solid line. That is the strongest asset South can weave from.

---------------------------------------------------------------------------------------------------------------------------------------------

## 2. The inventory

Legend for "kind": **SUB** = reads/writes a shared substrate, as a modifier or a tagged use. **MOD** = it is a modifier itself (visible source).
**OWN** = a separate meter of its own. **LEDGER** = a predicate over S4.

### 2a. The pool (S1) and everything attached to it

| thing | range / units | fills | drains | readers | kind |
|---|---|---|---|---|---|
| **pool** `game.lachryma` | base 100 (`T.lachryma.max`), displayed on the Lachrimeter tube | regen 3.5/s after 2.2 s unspent (`T.lachryma`); gains listed in 3b | spends listed in 3a | tools, vessel (shield), skiff, hand, cradles, class arts, spread "Self", duel (copy), UI | SUB (the substrate) |
| pool **max** | `(base + sum maxBonus) x prod maxMult` (`lachryma.js` `get max`) | stones `maxBonus` -15..+30; Willpower `maxMult` up to x1.5 (rank 10, front-loaded: rank 1 = 0.19 of the way) | cracks cap -5% per cracked region (`poolcaps.js CAP`, up to -30%); citrine/malachite -15 | everything via `.max`; `capOf(pool)` is the only UI reader of "held off by" (Lachrimeter held stretch) | MOD |
| **regen** | 3.5/s, delay 2.2 s | `regenMult`: god hand x1.6 (+delay x0.5), rally x2.5 (+delay x0.3), mend 2+power, Tides at night, stones x0.8..1.3, Cups tally +2%/pt | (held-off by nothing yet: no hazard stops it; "miasma" is only thick air on the board) | `update(dt)` | MOD |
| **cost tags** | every spend carries a tag (`shot`, `charge`, `dash`, `cut`, `hook`, `blade`, `brush*`, `god`, `survey`, `song`, `art`, `shell`, `lance`, `mount[.tool]`, `angle`, `sound`, `flash`, `twirl`, `skiff`, `hull`, `shield`, `thirst`, `siphon`, `duel`, `cradle.<id>`, `<tool>.<move>`) | n/a | n/a | stones (`costMult` by tag), spread, arts, ledger (`lach.spent.<tag>`) | SUB. A good taxonomy; see C1 for the flaw |
| **reserve** (held) | pool units | `reserve()` while a charge winds up / a cast flies / a sigil is queued | `commit` (spent) or `refund` | psygun charge, angling cast (10, 40% kept on a break), celestial sigils, Lachrimeter's held reading | SUB |
| **Lachrymato Bottle** `BOTTLES` | 80 / 160 / 240; `feed` 6/8/10 per s | Mop 12/s, parry **soak**, Cups tally | feeds pool when pool < 50%; paint spray 6/s; the jets (hover, rocket, skim) `spendLoad`; cracks on a shield break (10/20/35%) and spills 30/40/50% as a blot | Soul Brush load, jets, loadgauge, parries | SUB (a pool-side reserve; `loadgauge.js` swaps the tube for it) |
| **overflow / brim** | amount past max; `brimT` 2 s | any `gain` at full | n/a | Lockheart (takes 0.8, `STONES.overflow.lockheart`, to its cap 100), palm die (`share()`), `mind` (only `DRINKS` sources), class art Spillover | SUB, but see C6 (filters differ) |
| **draught** `game.draught` | {aspect: share}, fades 1/60 per s | drinks, by the stone's `tint` and the weather where drunk | fades (Afterglow halves the fade) | creatures (status build +50% at full), garden lake/sky, music | S6 on S1 |
| **mental state** `courierMind` | -2..+2, Balanced 0 | `perDrink 0.0023` x heady x amount; `perOverflow 0.0046` | settles 0.05/s after 5 s quiet (Incense in the garden speeds it) | damage (power/fragility), garden rain, harmony carry-in, arts | S7 |
| **stones** `STONES` | 17 rows | the kiln (vessel look region) | n/a | pool modifier + `reachMult` + `heady`/`tint`/`aperture`/`overflow` | MOD (trade rows, all on pool knobs) |
| **Lockheart charge** | 0..100 (`CAP`), `fill` 30/40/50 per coffin | overflow (x0.8), hoover (loose Lachryma, liquid counts x2), stunned minds, shard | opening (power = charge/fill, up to x2) | outcomes (cubes, MEND = pool full + regen mod, bite -25 x power from the pool, nuke -> vessel `release`) | OWN reservoir fed by S1 overflow (intended converter) |
| **palm die** | `sides` 4..20, `todayCubes`, `condensed` | overflow after Lockheart/bleed | cap 2 cubes per side per game day | cubes, the Dissonance answer roll | converter S1 -> S5 |

### 2b. Health-like things (the hull idea)

| thing | range | fills (mends) | drains | readers | kind |
|---|---|---|---|---|---|
| **vessel cracks** `vesselDamage.crack[6]` | 0..1 a region; shatter at one >= 0.95 or sum >= 3.6 | self-mend 0.025/s after 6 s (x Resilience x Steady), kiln MEND for cubes, `mendBy` | blow: pool pays `k x 35` first, remainder `k x 0.65` cracks the region; `release()` ignores the shield | pool cap, death, kiln, kintsugi, Reins/Bulwark arts | S2 |
| **shield** | = the pool (35 per full blow, `damage.js:31`) | pool regen | `drain(cost,'shield')` | Willpower seasoning (`vessel.shield`), Surrender/Steadfast arts | SUB |
| **skiff hull** | = the pool; wreck at pool <= 0.5 and a hit >= 3 m/s | pool; **vein lane 40/s**; City Trial patch +20 | bump 0.9/(m/s), wall 1.4/(m/s over 4), land 0.6/(m/s), bail 12 flat (`HULL`, `boardrules.js`); **Raceway only** (`here`) | Reins art, licences ("pool over 60%") | SUB |
| **Pneuka Jar hp** (god hand) | 100 (`T.god.jarHp`), `scars` | clapperjar `mendBy`, `regenEvery 9 s +6` | raids, lobber balls, blasts, thrown things | jar plate, raids, catch | **OWN** (second health bar for the same being) |
| **rail hits / bears** | sloop 6, frigate 8, destroyer 5, galleon 12, tanker 14, + Resilience `plus` up to +2 | haven MEND (half), leg mend, mercy | `wound(n)`; resets the chain | stage, results (1000/hit tally), Reins | **OWN** |
| **sea hull** `seaFight.hull` | `SHIPS.bears` + parts | Petra crew (1 / 60 s out of fight), dock `mend()` | ram/coil/spit 1 each; broken -> tow (cubes) | save section `seaFight` | **OWN** (a second copy of the rail's) |
| **Arena percent / stocks / shield** | percent 0..999; 3 stocks; shield 60, drain 0.28, regen 0.07 (`platformfighter.js:71`) | n/a | hits | fighter kit only, "in the pool's place" (`kit.js:4`) | **OWN**, replaces S1/S2 inside the Arena |
| **duel Line / junk / grid fill** | columns; junk lands 3 = 1 column | n/a | board play | duel only | OWN (a puzzle's state, correct) |
| **creature hp, EmO (0..1), stun depth, creature mind** | | | | familiarity gates the read-out | creature-side; EmO -> Lachryma yield |

### 2c. Currency and economy

| thing | note | kind |
|---|---|---|
| **cubes** | ledger-derived balance; faucets: jellies, chests, crystals, sell, condense, Lockheart cubes (12/100 plain), palm die (<= 40 an hour at d20), bounty, trials/medals (first time only); drains: Tithe, shops, kiln, garden (the long sink), fuel, CONTINUE, press, chips, wager, paint | S5 |
| **Raku's chips** | 1 cube = 1 chip; winnings cashable only up to `CHIPS.cap` (10 min of play) a game day | S5 in a costume (by design) |
| **crude / casks / materials / Possibilikeys / shells / lures** | items in the Pneuka Box (56 slots); casks have a ship hold limit; crude is volatile | items, not meters |
| **bounty, rutter, fare** | cubes | S5 |
| **score, chain (0..8), surge (0..100), rank, medal** (rail) | arcade score; no cubes | OWN by design ("the arcade's own currency") |
| **Luck** (bits -> level 0..99), **re-rolls** (1 a game day + 1 per 100 bits, max 3) | ledger | LEDGER |
| **quest points, achievement points -> standing, domain EXP (1..99), familiarity (0..4), class time** | ledger predicates | LEDGER |
| **Soul Alchemy**: colour (h, s), rank 0..10 per attribute, seasoning 0..100 per attribute (<= `seasonPerHour` a game hour per source) | rank raises by FIRING = cubes; seasoning from events | seasoning/ranks are OWN counters in the alchemy save; they widen S2 and S1 (Willpower) |

### 2d. Module meters, charges, cooldowns, timers

| thing | where | range / numbers | kind |
|---|---|---|---|
| duel **AP** | `DUEL.ap` | 5 a turn, refunds on clear size 5 / chain step 3 (max 1) | OWN (puzzle) |
| duel **pool copy** | `duel.js` `sides[i].pool` | 0..100 hard-coded; start = real `min(100, available)`; foe 30; drink 1..3 a gem; regen 8 a turn (PvE); trickle 2 a chain step | **OWN copy of S1** (C2) |
| duel **skill charge** (worn pair) | `skills.js` | need 8-10 gems cleared; fires once a turn | OWN |
| duel **power rest** | `powers.js` | costs 5-35, rest 1-4 turns; cost falls to 0.6 at domain 99 | OWN (cost reads the copy) |
| **Blink** charges | `moves/blink.js` | `cfg.charges`, timed recharge | OWN (movement; protected by "core movement is the gold standard") |
| **air dash** | `player.js:449` | pool 12 **and** one charge a landing (`dashCharges`) | double-gated |
| **rail roll** | `T.ship.roll` | 2 charges, 3 s refill | OWN |
| **rail mounts** | `rail/mounts.js` | pool cost (flash 6, brush 4/s) and/or charges (toll 3 a crossing) and cooldown in bars | pool + OWN |
| **sea mounts** | `SEA_MOUNTS` | pool cost 5/8/10, cooldown 8/12/15 s, toll 3 charges a sortie | pool + OWN |
| **rail lance** | `T.ship.lock` | 3 pool a lance, up to 8 locks | SUB (ammo reading) |
| **rail absorb / graze / ring / cancel** | `stage.js:140`, `hazards.js:115`, `triprun.js:197` | +2 absorb, +1 graze (8 a bar), +4 ring, +2 x n cancel | SUB (gain) |
| **surge** | `courier/ship/ship.js:61` | 0..100, +4 per absorb; R lets it go; costs the chain | **OWN**, a second account of the same event as the pool's absorb +2 |
| **sea fuel / tank, doubt, fronts** | `progress/opensea/seatrip.js`, `ECON.openSea` | tank 7..14 measures, a measure = `0.8 min x perMinute` in cubes (filled at the dock for cubes); doubt 0..; tow fee `towMin 6` | **OWN** (cube-backed). Drawn as a Lachrymato Bottle on deck (`vfx/crossinglook.js:28`) but mechanically unrelated to the Bottle |
| **rail trip fuel / hits carried / adrift** | `rail/trip.js` | measures per waypoint x burn; hits carry leg to leg | OWN, same family as the sea tank |
| **skiff scorch** | `boardrules.js SCORCH` | 0..1, +0.14/s flaring, -0.35/s cooling, luff 2 s | OWN (skill gauge, fine) |
| **skiff trick combo / banked flares** | `skiff/combo.js` | chain points x mult (cap 4); 1000 points = 1 flare, 3 stocks, 1.5 s of flare each; bail loses the chain | **OWN** (see F5) |
| **skiff garage parts / tune sheet** | `skiffparts.js`, `skifftune.js` | `mult(key)` on top, accel, grip, mass...; none touches the pool | MOD, but with **no pool keys** (opportunity) |
| **psygun chambers / shells** | `kinds.js`, `shells.js`, `T.shells` | 1..7 chambers, cap 8 (4 for heavies), start 4 max 8; reliquary +3 every 20 s; tier I/II/III cost 4/10/25 pool **plus** the shell itself; tier IV = a crack; tier V = draw from the place | item count + SUB (the tiers pay in three different substrates: this is elegant) |
| **Soul Brush paint / load** | `tools/soulbrush/load.js` | bottle `held`, saturate 0.85 s, spray 6/s, mop 12/s | SUB (Bottle) |
| **Crucibelle fever / notes / songs** | `crucibelle.js` | fever 0..1 (+0.1 on beat, -0.18 off); songs 8-24 x (1 - 0.45 fever); toll cool 0.4 s | fever OWN; its discount is a call-site multiplier (C9) |
| **Veritome memory** | `memory.js` | 24 plates; shutter refused when full; held shot gives the pool +3 (+5 on a chance) | OWN "room" counter (deliberate: "keeps no things") |
| **Veritome flash** | `FLASH` | cost 6 pool, cool 1.1 s | SUB + cooldown |
| **Sondelass** | blade 4/s (enter >= 8), hook 2 + reel 2/s, stinger 6, paid cut 5, special 12, angling cast 10 / line 0.3-1.2/s / sound 5 | | SUB |
| **Dreamvane** | twirl 2/s, survey pulse 12 + cooldown 3 s (`T.explored`) | | SUB + cooldown |
| **god hand**: miracle cost 10-45 (tag `god`), set, matter "made" (x 0.5-0.6 -> 0 at domain 99), telekinesis 3/s + 0.12/kg | `godpowers.js`, `arts.js`, `matterarts.js` | conservation: matter moved is free, matter made costs | SUB; **elegant** |
| **Dissonance** (0..~240) / **Level** (0..5) | `rejection.js` | rise: moved m3 0.5, made m3 1, miracle 8, epic 60, throw 2; ebb 2/s after 12 s quiet | OWN, the **island's** meter (correct: it is the world's) |
| **harmony** (0..1, rest 0.5, per planetoid) | `harmony.js` | tend +0.05 a kind a game day (cap +0.25); carry-in `(v - 0.5) x 0.4` (+0.1 brim) from the Courier's **mind** | MOD on S7 with a world source (the thorn) |
| **class arts** | `classarts.js` | 76 arts; cost 0-30 pool; cooldown seconds or `gameDay`; ACCENT x1.25 effect, x0.8 cost | SUB + cooldown; many add pool modifiers (zero, sanctum, choice, thrift, tides, solitude, stoke, completion) |
| **laid spread tallies** | `laidspread.js` | Wands -1.5%/pt cost, Cups +2%/pt regen and bottle feed, Swords status build, Pentacles worth; cap 10 pts | MOD (board -> pool). Wands uses `costMult '*'`, see C1 |
| **shop stock, Tithe pity, treasury plinth timers, chips cap, first-today, palm cap, rerolls, tend cap, Rebirth** | various | daily or real-time gates | OWN gates on S3/S4 |
| **stealth exposure** | `stealth.js` | derived each frame from posture, pace, ground, light, weather, tool in hand | MOD only (nothing stored). **The pool is not an input** |
| **spirit stats** (0..999 x5), **fatigue, bond, alignment** | `spirits.js`, `realm.js` | five stats = the five feelings | S6-keyed OWN |
| **hanko cradles** | `world/cradles.js` | `drain` pool/s for an engine; a body's hull is the pool (design) | only `threshold` and the pier `body` built; no drain used yet |
| **time scale holds** | `core/time.js` | blade, death, hit-stop each a named hold | OWN utility |

---------------------------------------------------------------------------------------------------------------------------------------------

## 3. The pool's numbers, in one place

### 3a. What it pays for (pool units; the pool is 100, a full blow is 35)

| use | cost | note |
|---|---|---|
| shield, a full blow | 35 | `damage.js:31`; a Dunemaw cast is priced in pool *share* instead (C3) |
| psygun shot | 4 | free on the rail and at sea (`T.ship`: plain shots cost nothing; only the lance costs) |
| psygun charge | 24 reserved | refunded if cancelled |
| caster shell I / II / III | 4 / 10 / 25 (+ the shell) | IV: a crack (one `PRESSURE.unit` = 40 of release through the aperture); V: drawn from the place |
| air dash | 12 (+1 charge per airtime) | garnet x0.6 |
| Sondelass specials / paid cut / stinger / hook / blade | 5-12 / 5 / 6 / 2 +2/s / 4/s | sheenobsidian x0.75 on cut and hook |
| Soul Brush flick / slam / spray / sigil | 1 / 4 / 6/s (bottle first) / 3-6 + ~5/s ink | lapis x0.7-0.8 |
| Veritome Flash / survey pulse | 6 / 12 | |
| Crucibelle song | 8-24 x (1 - 0.45 fever) | Rally gives x0.75 costs for a while |
| angling cast / line / sound | 10 / 0.3-1.2 per s / 5 | |
| god hand miracle | 10-45 | `god` tag is exempt from Wands, not from stones |
| skiff flare | 20/s (`boostCost`), x1.45 top speed | 100 pool = 5 s of flare |
| skiff hull | bump 0.9/(m/s), wall 1.4/(m/s over 4), land 0.6, bail 12, thirst 3/s (made-track rule) | siphon: down to a quarter |
| rail lance / mounts | 3 a lance / brush 4/s, flash 6 | |
| sea mounts | 5 / 8 / 10 + cooldowns | |
| class arts | 0-30 | |
| a cradle (engine) | `drain` a second | unbuilt |

### 3b. What fills it

bauble 6 (a clapperjar drops 6 = 36; a marked pot 2) | regen 3.5/s | Bottle feed 6-10/s below half | parry soak / gulp (n) | photo held 3 / chance 5 |
rail absorb 2, graze 1 (8 a bar), ring 4, cancel 2 each | rail gulp mount 2 each | **vein lane 40/s** | City Trial patch 20 | raid wave 30 |
**Paint Dive 12/s (a direct write to `pool.value`, `slip.js:165`)** | Lockheart MEND (full) | duel net result | fan-the-hammer refund.

Three plumbings for refills (regen/gain/direct write) and ten different rates is the root of C6.

---------------------------------------------------------------------------------------------------------------------------------------------

## 4. Q1. What could fold onto a shared substrate

Ranked by how much it clarifies for South's pitch vs how risky it is.

**F1. One hull: the vessel's cracks and the pool, for every form of the Vessoul (highest value).**
Glossary: the Vessoul is "one being in several forms" (god hand, Jar, Courier, ships). Resilience already widens both `resilience.mend` (clay) and
`resilience.bears` (ship hits), and class art **Reins** spares "a share of each hit" in **three separate implementations** (`stage.js:448` rail,
`seafight.js:267` sea, `boardrules.js:83` skiff) plus Bulwark's `takenMult` on foot. Four hulls, one idea. Proposal: a ship takes its blows as the
vessel does: the pool first (the ship's shield), then cracks that carry leg to leg and are mended at a haven or the kiln (gold seams: `vfx/sloop.js`
already draws "dark seams with the crude in them, gold when a haven caulks them"). `bears` becomes the `BREAK_AT` of that hull; `SHIPS` rows set a
hull's crack budget instead of a hit count. Reins becomes one code path. **Risk:** the rail's par, rank and 1000-per-hit tally are tuned on hits
(`scripts/rail.mjs`); keep `hits` as the displayed unit of cracks.

**F2. The Pneuka Jar's `hp 100` is the vessel (high value, medium risk).** The Jar plate already draws the vessel's Lachryma "standing in it to
its health". Epic miracles already pay through `vesselDamage.release` (SPINE 4.3). Remaining: raids, lobber balls, blasts and clapperjar mends still hit
`god.jar.hp`. `vesselDamage.hit` already redirects while sealed (`cradles.struck`); give the hand the same redirect and the clapperjars' `mendBy`
a `vesselDamage.mendBy`. One scar system (kintsugi), one shatter, the cracks already exist on the Jar (`vfx/crackskin.js`).

**F3. The Arena's shield bubble is the pool (lowest-risk slice of a big fold).** `SHIELD.max 60, drain 0.28, regen 0.07` is a stand-alone bar for the
act of guarding in a game whose shield *is* the pool. Pay the bubble with tag `shield` (so stones, Willpower and the Lachrimeter all read it) and let a
break be a shield-break (the pool empties, as `vessel.shieldbreak` does today). Percent could then be the fraction of the pool already gone plus
cracks (a Courier who spent their pool is launched farther: Smash with a resource), and the 3 stocks = 3 shatters. FIGHTER is "in flux", so
propose only the bubble now.

**F4. The sea's fuel/bunker is the Lachrymato Bottle (high charm, easy).** The sea already *draws* its bunker as a Bottle and the glossary bans the
word "tank" for it, but mechanically it is cube-priced "measures" (`ECON.openSea.measureMin`). Let the fuel be crude in the Bottle (or casks in the
Box): mop fills it, a dock sells casks, a tanker's hold is literally its bunker, volatility (spill x1.5/x0.75 by feeling) already exists. Then
"Lachryma as fuel" is one reading of one object from the sandbox to the ocean. Tank 7..14 measures maps to a bottle share.

**F5. Banked flares become a pool modifier.** `combo.js` keeps `stocks` (0..3) that Shift spends "before the pool, free of Lachryma". That is
exactly `addModifier('combo', { costMult: { skiff: 0 } })` while `stocks > 0`, the same trick as Running on Empty and Sanctum. Same behaviour,
visible in the same place as every other discount, and the spread/stone costs stack with it for free.

**F6. The rail's Surge is the overflow bank.** Surge = "absorbed Lachryma let go at once" (+4 per absorb), while the same absorb also gives
the pool +2. That is two accounts for one event. Let the surge fill **only from absorb past a full pool** (overflow): then "keep the pool full
and drink" is the shmup's expression of the foot game's brim, and the Lockheart/palm die already know how to take overflow.

**F7. The duel's pool is the real pool** (see C2 for the defects). Keep the kernel pure (the bots clone state), but build it from the pool's
numbers (max, regen, stone costMult) at open and settle through a raw `pool.settle(delta)` that skips costMult.

**F8. Clean-ups that are free:** Crucibelle's fever discount becomes `addModifier('fever', { costMult: { song: 1 - 0.45 f } })`; `bracelet.costOf`,
`sigilK`, `reinsK`, `draughtFadeK`, `mendK`, `visualization.canvas`, `ouranurgy.still` are call-site multipliers that bypass the modifier stack
(and so the UI): route those that touch the pool through `addModifier` with a `source`.

**What should NOT fold:** Blink and air-dash charges (the core movement is the gold standard: a pool cost on Blink would change it); the duel's AP and
Line (a puzzle's own state); the Dissonance Level (it is the island's meter); score/chain/rank (arcade currency, no cubes by design); the
Veritome's 24 plates (a deliberate "room" rule); the ledger's counters (already one substrate).

**Stamina:** none exists as a separate meter. The pool is the stamina (cost tags are the proof). The stamina-like leftovers are: Blink charges, the
air-dash charge, the rail roll's 2 charges, the skiff scorch, spirit fatigue, and the Arena's shield bubble.
**Currency:** none besides cubes. Chips are 1:1 cubes with a daily cap on winnings; the sea's fuel is cubes in a costume.

---------------------------------------------------------------------------------------------------------------------------------------------

## 5. Q2. Elegant uses of the pool, and bolted-on ones

### Elegant (one parameter, many readings, nothing special-cased)

- **The shield is the pool** (`damage.js`): a spend is a defence; to fight is to open yourself. The text in `moves.js` ("the pool, which is also the
  shield") shows the tuning conversation. One drain tag.
- **Cracks cap the pool** (`poolcaps.js`): clay damage becomes a visible lowered ceiling (5% a region), mended by time or cubes. The best example of
  "a modifier with a source you can see".
- **The stones** (`stones.js`): 17 rows, each a trade on knobs the pool already has (`maxBonus`, `regenMult`, `costMult` by tag, `regenDelayMult`,
  `reachMult`) plus `heady`/`tint`/`aperture`/`overflow`. They add *no rule*, and the file says so.
- **The release model** (`stones.js PRESSURE`, `damage.js release`): pool -> vessel by aperture; tier IV shell, Overload and epics are all one
  function (SPINE 4); tier V shells are paid by the place. Three substrates paying for three tiers is the same idea at three scales.
- **God powers** (`matter.js`, `godpowers.js`): "matter is moved, never made; what had to come from nothing is charged"; at domain 99 the made-cost ramps
  to 0 (Creative). Conservation as design.
- **Skiff as F-Zero** (`boardrules.js`): the same pool is the hull *and* the boost; the vein lane is the pit; the combo pays in speed so the pool
  stays the shield's. DESIGN 24 records the day they undid a regen hold to keep it "the literal same pool".
- **Parry soak and gulp** feed the pool or the Bottle: defence refuels.
- **Class arts and spreads as modifier rows** (`art.zero`, `art.sanctum`, `art.thrift`, `art.tides`, `art.solitude`, Rally, MEND, `spread`).
- **Overflow as the only road to cubes** (pool -> Lockheart -> palm die) with day caps: a faucet inside the aim.
- **Mind** (S7): one -2..+2 scale for creatures and the Courier; the garden's Dantian reads it. One number, five consumers.
- **The ledger's tag accounting** (`lach.spent.<tag>`, `lach.gain.<source>`): every use is auditable for balance.

### Bolted on (a second meter, a second rule, or a private constant)

- **Rail**: pool as ammo only; `hits/bears` as hull; free plain shots; surge as a second ledger; roll/mount charges.
- **Sea**: pool costs + cooldowns + charges + own `hull` + cube-priced fuel.
- **Duel**: its own pool/AP/regen/costs, copied.
- **Arena**: percent/stocks/shield instead of pool/vessel.
- **Jar hp**: second health.
- **Paint Dive**: a direct write of 12/s that skips `gain` (no events, no ledger, no mind, no sinceSpend).
- **Crucibelle fever**: a private discount on songs.
- **Double gates**: dash = pool + charge; survey pulse = pool + cooldown; arts = pool + cooldown; mounts = pool + cooldown + charges.
- **Photo held +3/+5**: a tiny faucet that does not read as anything.
- **Raid `SHIELD = 35` copy** in `world/well/raid.js:32` instead of importing `damage.js SHIELD`.

---------------------------------------------------------------------------------------------------------------------------------------------

## 6. Q3. Where a module changes a base rule instead of showing a modifier

Ordered by severity against "a mode or a module never changes a base rule".

1. **The Arena (`strawmanwell/fighter/kit.js`)** replaces the harm model: percent, stocks and a shield bubble stand "in the pool's place".
   The Courier's vessel and pool are not what is hurt. FIGHTER.md and `movementprofiles.js` defend the *movement* half correctly (profiles are
   modifiers laid over `T.movement` only inside the Well, taken off whole). The *harm* half is a substitution, not a modifier.
2. **The hand's regen (`godhand.js:175`)**: `addModifier('god', { regenMult: 1.6, regenDelayMult: 0.5 })` while the hand is out. It is
   implemented as a modifier, but its source is a *mode*, not a world cause (a hazard, a weather, a crack, a part). By the house test, the hand's
   regen should come from something the Courier can see (e.g. the garden's calm, a Shrine, the matter itself). Also the Jar's own `hp` (see F2).
3. **Rail and sea vs board**: the same ship form uses the pool as **hull** on the Raceway (skiff, `boardrules.js` `here` only) but as **ammo only** on the
   rail and at sea; plain shots are free there and cost 4 on foot. The consequence of an empty pool also differs by module: foot = clay cracks,
   board = wreck at a hit >= 3 m/s, rail = nothing. (Hanko's design says a body's pool is its hull; the built pier cradle has no drain and the
   crossing ignores it.)
4. **The Great Dunemaw** (`world/well/raid.js:126`): `k = eff.pool x pool.max / SHIELD`. A cast hits for a *share of max*, so Willpower
   (x1.5) and ruby's +30 cannot make you safer there; a cracked (capped) pool makes the blow *smaller*. The rule that blows
   cost 35 units is replaced by one that scales with the thing meant to protect you. (The fight is "in flux"; flag for its next pass.)
5. **The duel** (`duelsession.js`, `duel.js`): a pocket with its own pool max, regen, mana-from-clears, costs, and the outside cannot reach it
   (`vesselDamage.hit` returns -1 for non-Courier blows). Defensible as a puzzle instance (PUZZLE-DUELS 16.1) but the pool numbers are a rule fork
   (C2).
6. **The sea's fuel** is a different resource system than the pool/Bottle, priced in cubes (F4).
7. **Mind effect scope**: `stones.js` describes Prismatic's power as "a Lachryma-driven blow x1.5" but `creatures.js:108` applies it to every blow by
   the Courier. Not a violation of the law, but the text and the code disagree (by reading).
8. **Call-site multipliers** that bypass `addModifier`: `bracelet.costOf`, `sigilK`, `reinsK`, `draughtFadeK`, `mendK`, Crucibelle fever. The law
   says the UI "shows where it bites"; only `caps` are shown (`capOf` is the only reader of `pool.modifiers`; cost and regen modifiers carry no
   `source` string and no UI reads them).
9. **Showcase crossing floor** (`stage.js:226`, the pool is held at >= SHOWCASE_FLOOR) and **a failed crossing refilling the pool + mending the
   vessel** (`stage.js:507`): mode rules, minor, declared in comments.

---------------------------------------------------------------------------------------------------------------------------------------------

## 7. Q4. Conflicts between modules (the pool's numbers)

**C1. `costMult['*']` is applied to the shield and the hull.** `cost(base, tag)` multiplies by `costMult[tag] ?? costMult['*']`
(`lachryma.js`). `damage.js:143` drains tag `'shield'` and `boardrules.js:83` tag `'hull'`, so every row that says "everything costs less" also
means "blows hurt less": sapphire x0.85 (+18% shield and hull), ruby x1.15 (-13%), Solitude x0.85, Rally x0.75, laid spread Wands up to -15%, and the
**free** ones: `art.zero` (Running on Empty), `art.sanctum` (while standing in it), `art.choice`, `art.completion` (art tag only). It is an
accident of a shared tag: the stones' own text says costs. Worse, `damage.js` decides "held" with the *unmultiplied* cost (`had >= cost`) and
computes the cracked remainder `k *= 1 - had/cost` the same way, so the shield and the clay disagree when a multiplier is on.
Fix: tag classes (`use` vs `harm`); `costMult` applies to use; a separate `guard` knob for the shield and the hull (a visible stone trade).

**C2. The duel's pool is a copy that settles through `spend`/`gain` (by reading).**
 - `duelsession.js:99` `startPool = min(100, available)`; the kernel caps at 100 (`duel.js`) while the real max can be 70..160.
 - `lachryma.update(dt)` runs every frame, duel or not (`frame.js:314`), and the duel never spends the real pool: so during a long duel the real pool
   **regens to full in the background**, then `close()` applies the net `d = final - start`: `gain(d,'duel')` over a full pool **overflows into the
   Lockheart and the palm die**, and `spend(-d,'duel')` for a loss is **all-or-nothing and goes through `costMult`**: with ruby (x1.15), a loss of
   the whole starting pool asks for 115% of what exists, is `denied`, and **costs nothing**; with sapphire it costs 85%.
 - In-duel costs, regen (8 a turn), drink (1-3 a gem) and trickle (2) ignore stones, spreads and Willpower; the powers' costs fall to 0.6 only by
   *domain level*, not by the same modifiers that cheapen every other cost.

**C3. Dunemaw blows scale with `pool.max`** (section 6.4), and the constant `SHIELD = 35` is re-declared in `raid.js:32`.

**C4. Hull sizes do not share a scale.** One full blow = 35 pool (35%). On the board a 10 m/s bump = 9, a 14 m/s wall hit = 14, a bail = 12 flat,
a 1 s flare = 20, the pool is also the boost, and "wreck" needs <= 0.5 pool *and* a >= 3 m/s hit. A rail hit is 1/6 of the sloop (17%), a sea ram 1/6.
Nothing says why a bail costs a third of a blow. These need one table ("a blow of k = 1 is X% of the hull") when F1 happens.

**C5. Cost scales differ by mode for the same tool.** Psygun shot: 4 on foot, 0 on rail/sea (lance 3, bow gun cost 0). Soul Brush mount: 4/s on
the rail, 10 + 15 s cooldown at sea, 6/s spray on foot. Veritome flash: 6 (rail), 8 (+12 s cooldown at sea), 6 (foot). A cost tuned for the foot's
100-pool reads as nothing against a sea cooldown of 8-15 s (regen 3.5/s = 28-52 pool back).

**C6. Refill plumbing and rates differ.** Regen 3.5/s through `update`; vein lane 40/s through `gain`; Paint Dive 12/s by writing `pool.value`
(`slip.js:165`, `config.js:301`); Bottle 6-10/s; hand regen x1.6; Rally x2.5.
 - The direct write skips `gain`: no `lach.gain.*` ledger line, no events, no mind push, no `sinceSpend`.
 - `overflow` has three listeners with three filters: the **mind** takes only `DRINKS`; the **Lockheart** and **palm die** take every source;
   Spillover too. So riding a **vein lane at a full pool** (`gain(40 x dt,'vein')`, all overflow) fills the coffin at about 32/s (cap 100) and feeds
   the palm die (day-capped), a converter faucet the owner did not rule (the faucet was meant to be a *brimming drink*). Same for `patch`, `wave`, `ring`.

**C7. Real-time timers on pool modifiers.** `outcomes.js:42-43` (`mend`: `setTimeout(removeModifier, 18000 x power)`) and `crucibelle.js:206-207`
(`rally`). Wall-clock, so slow-motion (blade mode, death, hit-stop), a closed menu, or a paused tab don't stretch them (the house keeps game
time on `rawDt`/`dt`). `mend` has **no `clearTimeout`**: opening a second MEND inside 18 s adds a modifier under the same id and the first timer
**removes it early**.

**C8. The hand's regen** (x1.6) is the only mode-conditioned regen; the Cups tally and Tides don't know about it (multiplicative, fine) but a god-hand
session is also when `Wands` is exempted (`god: 1`), a second special case on the same ring.

**C9. Crucibelle fever (up to -45% song cost)** is a private multiplier; it stacks with Rally x0.75, sapphire x0.85, Solitude x0.85, Wands -15%
and ACCENT x0.8 into a floor under x0.2 with **no cost floor**.

**C10. Doubled gates for one act.** Air dash is pool 12 *and* a landing charge; survey pulse pool 12 *and* 3 s; arts pool *and* cooldown; sea mounts
pool *and* cooldown *and* charges. Each is a design choice but they read as two systems.

**C11. Surge and absorb count one event twice** (pool +2 and surge +4, `ship.js:295`, `stage.js:140`) with different caps (100 vs the pool's).

**C12. Real maxima.** The Lockheart's `CAP 100` is fixed, the pool's max moves 70..160 with cracks, stones and Willpower; a coffin that fills in "one
pool" is a different fraction for each Courier. The duel's 100 has the same issue.

---------------------------------------------------------------------------------------------------------------------------------------------

## 8. Weaves South could take (each uses machinery that already exists)

These answer "novel mechanics, nuance, elegance". None changes a base rule; each is a modifier with a source you can see.

1. **The skiff drinks the sun** (power source for the skiff, literally). The sail has a hoist state (`hoistTime 1.0`), the Raceway has `sun`
   (0..1 by hour and cloud) and the stones already have day/night regen rows. Add a modifier `{ regenMult: 1 + k x sun }` while the sail is
   hoisted: by day the board regenerates the pool it spends on flares; furled or at night it does not; the cavern's vein lanes are the night's
   pit. The "solar" skiff gets a power source that is the clock, and the garage can offer a **sail that trades flare cost for sun-regen** (parts
   have no pool keys today).
2. **The ship's hull is the Courier's vessel in a bigger body** (F1) and the **bunker is the Bottle** (F4): one crack, one mend, one kiln, one
   reserve across the foot, the board, the rail and the sea. The Vessoul becomes one being in the rules, not only the lore.
3. **Banked flares as a prepaid discount** (F5): the trick combo shows up on the Lachrimeter as a modifier row, beside stones and arts.
4. **Rejection as a cap**: `poolcaps.js` ends "a cap carries a source you can see in the world". The island's answer (Dissonance Level) could cap max
   by 5% a level: you carry less where you have warped more; resting at a Shrine lifts it. Rides the existing `capOf` held-off display.
5. **Brimming matters to the world**: the pool is not a signature input (`core/signatures.js`, `stealth.js` never read it). A brimming Courier giving
   off signature (and baubles are already "food" in the ecology) would make overflow a risk as well as a faucet and tie the mind, stealth and the
   Lockheart together.
6. **Surge as overflow bank** (F6): in the shmup, "full pool + drink" is the brim.
7. **Hull is the same on a Hanko body**: the design says a body's pool is its hull; the rail's helm cradle is the first. Building F1 makes the
   pier's cradle true to its own plan.

---------------------------------------------------------------------------------------------------------------------------------------------

## 9. Not verified / ran nothing

- No code was run; the duel write-back (C2), costMult on shields (C1), vein overflow (C6) and the un-cleared timer (C7) are from reading call paths
  (`lachryma.js`, `damage.js`, `duelsession.js`, `frame.js:314`, `outcomes.js`, `dice.js:126`, `lockheart.js:343`).
- Numbers in sections 3a/3b are as they appear in the source today; several are marked placeholders ("Dovina's to tune") in their own comments.
- I did not open every file under `src/vfx/` or `src/audio/` (look and sound read the substrates; they do not write them).
- Whether `skiff` bails crack the vessel (a tie between S2 and the board) was not traced.
- The hand's regen, rail and sea hits and Arena percent are described from their headers and one or two call sites each.
- GLOSSARY.md was read to line ~230 and searched by term after that (274 KB).
