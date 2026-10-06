# The Great Dunemaw's systems: the crowned FOE, the nursery, the finds, the Solar Skiffing trial, Strawman (Dovina, 2026-10-06)

Dovina's answers to the round robin Calissa opened (her seeds: `docs/plans/DUNEMAW.md`, `DUNES.md`, `STRAWMAN.md` on
`claude/calissa-art-cups`, 652c1b7). The numbers are data in `src/progress/combat/dunemaw.js`; this file says why. Units: blows of power 1
(a plain shot; a slip jelly bursts at 8), **sim seconds** (the game's clock, stopped by a pause), **real seconds**, minutes of play
(`ECON.perMinute`). Balance is placeholder (the owner, R58): what matters here is that each part holds together and feeds the others.

## The fun check, first

The danger in Calissa's draft is a **sponge**: phase 1 as "hit the hat until it breaks". So the crown answers to **reading**, not to
volume. The urn is a pot, and only what breaks pots breaks it: Impact, the slam, and best of all **its own ram into stone**. Every other
type rings off it with the resist mark for a quarter of a crack. The good player doesn't out-damage it; they turn it, like Zelda's
Dodongo or a bullfight. They stand before a pillar, let it charge, step aside, and it cracks its own crown. Three rams and the crown is
off in thirty real seconds; the hammer works too, but slower and closer. Each ram also **spends the arena**: a pillar it hits cracks,
and a stalactite it hits falls (a new hazard on the floor, and one less perch overhead). So the fight changes shape as it goes, and the
order in which the player spends the room is a choice.

Phase 2 must not be a second sponge either: the core is small and moves, it sinks and surfaces, the floor slides toward it, and the
brood come. Damage there is about **aim and timing**. The reel after the break is a short, loud reward: four sim seconds when every
blow lands three times over (Hollow Knight's stagger, kept short so it feels earned).

## 1. The FOE: the Great Slip Jelly, crowned

| | number | why |
|---|---|---|
| health | 48 | six slip jellies' worth; the bare phase is about 24 plain blows, or 12 on the core |
| crown | 3 stages of 6 crack points | 18 in all |
| what cracks it | Impact 1.5 a blow; the slam 3; its own ram into a pillar or stalactite a whole stage (6); every other type 0.25 (the resist mark) | a pot breaks to a blow, not to a feeling |
| through the crown | a blow to the crown does no harm; to its sides, a quarter | the slip takes it |
| the break | reels 4 sim s; every blow x3 | the reward, short |
| bare | the core x2, the body x0.5 | aim is the skill |
| sinking | every 12 sim s, under for 3; the slip rings 1.2 s before it surfaces with a slam | a read, not a surprise |
| the arena's slide | toward it at 0.8 m/s, 1.5 below a third of its health | the mouth's antlion, inside |
| brood | 3 at two thirds, 3 at one third, never more than the clutches still whole can give (2 each) | see the nursery |
| reprogram | below a fifth of its health, while it reels or is stunned | `stun.vulnerable` |

**Its grain** (`combat/temperament.js`): it is a slip jelly, bold and erratic. Impact is already its weakness, so the crown's rule and
its grain agree, and a Veritome read of it says so before the fight.

**Two endings, two different pays** (the choice is the point):
- **Burst:** the FOE's pay (`ECON.well.foe`, two floors' worth) and a **crown shard** (a court-glaze pot's worth, `ECON.pot`): the pay
  now.
- **Reprogrammed:** half the pay now (one floor's worth and the shard), and **the nursery becomes the Shrine Garden's**. A Dividend slot
  can be worked by the Great Slip Jelly's brood, so the Dunemaw pays a little forever (`progress/garden.js`; Palworld's way). The pay
  later. The ledger counts both (`foe.burst`, `foe.reprogram`), and each has an achievement.

## 2. The nursery

- **Clutches a floor:** 1, 3, 8. One on the first floor as a hint, three on the second, eight round the FOE in the great cavern.
- **A clutch:** 3 to 6 eggs. It hatches a brood every 20 sim s while a guard lives and the Courier is within 20 m, at most 3 out at once.
  It holds 2 brood for the FOE's call. Brood have 2 health; a clutch takes 3 blows.
- **Guards:** jellies within 12 m guard a clutch (a drive, held 10 m to it). Breaking a clutch is an **alarm** stimulus heard at 15 m.
  A jelly's grain says what it does: a bold one charges, a skittish one flees and spreads the fear (TEMPERAMENT.md's pack).
- **Respawn:** a clutch is part of the floor's seeded layout, so it comes back with the next game day's layout and never sooner. A run
  is a place in time, and what is broken stays broken until the Great Dunemaw turns over.
- **The choice it makes:** every clutch broken before the fight is two brood the FOE cannot call. Clearing the nursery first is the
  safe way and costs time and the guards' fight; rushing the FOE is fast and brings the brood.
- **Slip roe:** each egg broken leaves slip roe at a 30% chance, a material (the Great Dunemaw's own) that a Shrine Garden bed grows.

## 3. The finds, and the warp

- **Pots:** 12, 16 and 20 a floor; a quarter hold a find (a few cubes, a curio from the deck, or a material: about a minute of play).
  The rest are just the satisfying break (`hasTag(breakable)`).
- **Artifacts:** 2, 3 and 4 a floor, in the walls, each worth four minutes of play (more by depth, `ECON.well.deeper`). They sell as
  curios (Raku buys them; the Purser too).
- **"Touch nothing but the lamp": a risk that pays, never a trick.** One artifact a floor sits in a warped pocket and is worth **three**.
  Taking it **shifts the floor**: the way down moves (the floor re-lays the cells round the pocket), a sandfall opens or a slope turns,
  and two brood wake. What makes it a risk rather than a trick is that it can be **read before it is taken**: the Dreamvane hears the
  warp, and a Divination widening (`divination.forecast`) names what will shift. A player who reads takes it knowingly; a player who
  grabs pays in time. A shifted floor's Cogitomap is marked shifted (it charts the floor as it became).

## 4. The Solar Skiffing trial

- **The rule of "solar":** the rings are **charged by the sun**. A ring in shade (a dune's shadow, or in the long rain or the pall) is
  dark: it costs nothing and pays nothing. So the course is the same all game day and the sun makes three of it: at noon every ring is
  lit (the easy run); in the long shadows of dawn and dusk half are dark and the line between the lit ones is the hard run; at night the
  gnomon casts no shadow and the trial is closed (a refusal in the log). It is a fair-weather sport. It reads `game.weather` and the
  day's phase, so the trial's difficulty is a forecast (Divination again).
- **The clock:** the gnomon's shadow sweeps the dial once in **90 real seconds**. 24 rings; a lit ring missed adds 2 seconds.
- **Medals:** gold 60, silver 72, bronze 85 real seconds (Petra measures the line, and these move with it). They pay 3, 6 and 10 minutes
  of play, **once each, ever** (a trial is a test, not a farm). They pay 4 more once for a run with every lit ring taken at dawn or dusk.
- **Records:** the best time in the ledger, by phase of the game day (`trial.solar.best.noon`, `.dawn`, `.dusk`); the log's line at the
  finish; achievements for each medal, for "all lit at dusk", and for a gold in the long shadows.
- **The geysers:** rings hang over geysers, lit only at the top of an eruption. The line goes through the geysers, so their timing is the
  skill.

## 5. Strawman

- **A creature like any other:** `hurtable`, registered with `game.creatures`, struck through `creatures.strike`, so every weapon's path
  is the real one and Strawman tests what players meet. Its health never falls (struck, then made whole the same tick), and it never
  bursts.
- **Statuses:** every one, at its real time and real build-up, with **no friendly-fire tolerance** (it never resists the third). What
  you learn on Strawman is true in the field.
- **The ledger:** never. Its creature is `training: true`, and the tracking rules skip it, so no achievement can be farmed on it.
- **The readout, with no floating numbers:** one **bout** is the blows from the first until 4 real seconds without one. When it ends,
  the log says one line: "Strawman took 18 blows in 6.2 s: 54 damage, 8.7 a second (Impact 40, Ego 14); stunned once." No line per blow:
  that would be the kill-feed by another name. `/strawman` in the chat repeats the last bout.
- **Reprogram and mirror:** yes, always (it is where you practise them). Reprogrammed, it stays a dummy.
- **Fights back, on a switch:** F at Strawman cycles **still**, **guard** (blocks from the front, to practise breaking a guard) and
  **swing** (a slow telegraphed swing every 3 sim s that does no harm, to practise the dodge and the parry). The log says the mode.
  Begun in its room, as every trial is.

**Planned: a tunable Strawman** (the owner, 2026-10-06: "improve Strawman's ability to be tuned to test various combat interactions").
Not built; the plan, for when Strawman stands:
- **The rig:** a console beside Strawman (a trial is begun from something in its room), opening a small window of Strawman's settings.
  It is not the Tab panel: Strawman's settings are the test's conditions, not the game's tuning, so they never raise the tuned warning.
  It goes away when you leave the Workshop.
- **What it sets:**
  - its **grain** (the five dials, so a "skittish" or "bold" target can be met on purpose);
  - its **mental state** (held at one of the five, or free);
  - each **damage type's** affinity (weak, normal, resistant);
  - its **poise** and each status's build-up;
  - **friendly-fire tolerance** (on or off);
  - its **guard** arc;
  - its **behaviour** (still, guard, swing, or a scripted pattern of swings and guards).
- **Presets** that mirror a real creature: a slip jelly, a bold jelly, the Great Slip Jelly crowned and bare. Strawman then answers
  blows exactly as that creature would, so a combat interaction is tested against the real numbers before it ships.
- **The bout says its conditions**: the log's line names the preset or the tuned settings, and a QAIS report filed in the Workshop
  carries Strawman's rig, as it carries the Tab panel's tuning.
- **Scripted runs** for the brigade: `/strawman` takes a preset and a script (a fixed sequence of blows), so a division can measure a
  change against the same bout every time.

## 6. Three floors?

**Yes, three, but growing:** **13, 19 and 25 cells** a side (104, 152, 200 m), not three of 25. The pit widens as it goes down, as an
antlion's cone does upside down. The first floor teaches in a small space, and the great cavern is the payoff. Three full-size floors would
be a forty real-minute run before the FOE, longer than the Well's pay was built for. `ECON.well.perFloor` (2.5 minutes of play) was set
for the old small floors; it is re-based once Petra measures a floor's real time (a placeholder, as the owner said balance is).

## What each piece feeds (synergy)

- The **crown's** rule matches the FOE's **grain**, and the Veritome reads both.
- Breaking **clutches** decides the FOE's **brood**, and leaves **slip roe** for the **Shrine Garden's** beds.
- **Reprogramming** the FOE gives the Shrine Garden a **dividend** worker: the nursery, kept.
- The **warped artifact** is read by the **Dreamvane** and **Divination**, and marks the **Cogitomap**.
- The **Solar** trial reads the **weather** and the **game day**, and its difficulty is a **forecast**.
- **Strawman** makes every type's and status's real numbers learnable, without touching the **ledger**.

## The events (the contract for Petra's bodies and my rules)

`foe.crack { stage, cause, by }`, `foe.break { by }`, `foe.end { how: 'burst' | 'reprogram', by }`, `clutch.break { floor, by }`,
`find.take { kind: 'pot' | 'artifact', warped, floor, by }`, `floor.shift { floor, by }`,
`trial.solar { seconds, lit, taken, phase, medal, by }`, `strawman.bout { blows, seconds, damage, perSecond, byType, statuses }`,
`strawman.mode { mode }`. Each carries `by` (the house rule); `training: true` on a creature keeps its blows out of the ledger.
