# The Great Dunemaw's systems: the crown, the nursery, the finds, the Solar Skiffing trial, Strawman (Dovina, 2026-10-06)

Dovina's answers to Calissa's seeds (`DUNEMAW.md`, `DUNES.md`, `STRAWMAN.md`). **Built:** the numbers are data in
`src/progress/combat/dunemaw.js`, which says why; the bodies are `src/world/well/` (`nursery.js`, `finds.js`, `bowl.js`,
`dunemaw.js`), `src/world/dunes/solar.js` and `src/world/testroom/room.js`. Units: blows of power 1 (a slip jelly bursts at 8), sim
seconds, real seconds, minutes of play. Balance is placeholder (the owner, R58): what matters is that each part feeds the others.

**The fun check:** the fight must not be a sponge. The crown answers to reading, not volume: the urn is a pot, and only what breaks pots
breaks it (Impact, the slam, and best of all its own ram into stone; every other type rings off with the resist mark). The good player
turns it like Zelda's Dodongo or a bullfight, and each ram spends the arena. The bare phase is aim and timing; the reel after the break
is short, loud and earned (Hollow Knight's stagger).

## 1. The FOE: superseded by DUNEMAW-EXTREME.md (2026-10-07)

The fight's scale and timeline are DUNEMAW-EXTREME.md (48 health was a mini-boss). What still stands from here:
- **The crown's rule:** three stages; Impact, the slam and its own ram into a pillar or stalactite crack it; other types a quarter of a
  crack. Its grain (bold and erratic, Impact its weakness) agrees with the crown, and the Veritome reads both before the fight.
- **Two endings, two pays** (the choice is the point): **burst**, the FOE's pay now (`ECON.well.foe`, two floors' worth);
  **reprogrammed** (below a fifth of its health, while it reels or is stunned: `stun.vulnerable`), half the pay now and **the nursery
  becomes the Spirit Garden's** (its brood work a Dividend slot: the pay later, Palworld's way). The crown shard is withdrawn (the
  owner, 2026-10-07: no item that exists only to be traded).

## 2. The nursery (`nursery.js`, `NURSERY`)

Clutches 1, 3 and 8 a floor; guarded; an alarm heard at 15 m; whole again only with the next game day's layout (a run is a place in
time). **The choice:** every clutch broken before the fight is two brood the FOE cannot call; clearing first is safe and slow, rushing
is fast and brings the brood. Each egg broken leaves slip roe at 30%, a material a Spirit Garden bed grows.

## 3. The finds and the warp (`finds.js`, `FINDS`)

Pots (a quarter hold about a minute of play) and artifacts (four minutes, more by depth; sold as curios to Raku or the Purser). **"Touch
nothing but the lamp": a risk that pays, never a trick.** The warped artifact is worth three and shifts the floor, and it is read before
it is taken (the Dreamvane hears the warp; a Divination widening names what will shift). A shifted floor's Cogitomap says so.

## 4. The Solar Skiffing trial (`solar.js`, `SOLAR`)

The rings are charged by the sun, so the sun makes three courses of one: noon all lit (easy), dawn and dusk half dark (hard), night
closed. Its difficulty is a forecast. Medals pay once each, ever (a trial is a test, not a farm). Records by phase of the game day
(`trial.solar.best.<phase>`); achievements for each medal, for every lit ring at dusk, and for a gold in the long shadows.
- **Open:** rings hung over geysers, lit only at an eruption's top (the line's timing as the skill), are not built.

## 5. Strawman (`room.js`, `STRAWMAN`)

A creature like any other (`hurtable`, struck through `creatures.strike`) whose health never falls; every status at its real time, no
friendly-fire tolerance, so what you learn on it is true in the field. `training: true`: the ledger never counts it. **No floating
numbers:** one log line a bout (blows until 4 real seconds without one), e.g. "Strawman took 18 blows in 6.2 s: 54 damage, 8.7 a second
(Impact 40, Ego 14); stunned once."; `/strawman` repeats it. F cycles still, guard and swing (a harmless telegraphed swing every 3 sim s).

**Planned, not built: a tunable Strawman** (the owner, 2026-10-06: "improve Strawman's ability to be tuned to test various combat
interactions").
- A console beside Strawman opens its settings (the test's conditions, not the game's tuning: never the tuned warning); it goes away
  when you leave the Workshop.
- It sets: its grain (the five dials), its mental state (held or free), each damage type's affinity, its poise and each status's
  build-up, friendly-fire tolerance, its guard arc, its behaviour (still, guard, swing, or a scripted pattern).
- **Presets** mirror real creatures (a slip jelly, a bold jelly, the Great Slip Jelly crowned and bare).
- The bout's line names the preset or settings, and a QAIS report filed in the Workshop carries the rig.
- **Scripted runs:** `/strawman` takes a preset and a fixed sequence of blows, so a division measures a change against the same bout.

## 6. Three floors, growing

13, 19 and 25 cells a side: the pit widens as it goes down; three full-size floors would be a forty real-minute run before the FOE.
**Measured (Petra, v82, 2026-10-06):** cells 18 m; the agent's whole run took 255 sim seconds. The pay (`ECON.well.perFloor` 2.5
minutes of play, `deeper` 1.25, the FOE two floors' worth: about 15 minutes a full run) **stands until a player's run is measured**;
the ledger measures it (`well.run.seconds`, `well.run.count.f<floors>`, `well.run.fastest`). **Open:** re-based once the owner has run it.

## The events

`foe.crack { stage, cause, by }`, `foe.break { by }`, `foe.end { how: 'burst' | 'reprogram', by }`, `clutch.break { floor, by }`,
`find.take { kind: 'pot' | 'artifact', warped, floor, by }`, `floor.shift { floor, by }`,
`trial.solar { seconds, lit, taken, phase, medal, by }`, `strawman.bout { blows, seconds, damage, perSecond, byType, statuses }`,
`strawman.mode { mode }`. Each carries `by`; `training: true` on a creature keeps its blows out of the ledger.
