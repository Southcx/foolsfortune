# The Great Slip Jelly as a raid boss, in the style of an extreme trial (the owner, 2026-10-07)

Kept by Dovina. **Built:** the script is `src/progress/combat/greatjelly.js` (the casts with their windups, areas, effects and answers;
the phases and their loops; the health model; the enrage; the drops), run by `src/creatures/ai/timeline.js` in
`src/world/well/raid.js`, played by `src/creatures/jelly/jellycasts.js`; the crown, the nursery and the endings are
DUNEMAW-SYSTEMS.md. Units: real seconds (the fight's clock), plain blows (power 1: a slip jelly bursts at 8), metres.

> "The Great Slip Jelly was supposed to be like a raid boss, on the level of an FFXIV extreme trial. I ran through the well and was
> both laughing and so disappointed when I finished slapping around a slipjelly slightly bigger than the others ... I didn't see any
> egg broods or any of the drop items you had mentioned."

**What went wrong, in one line:** the Dunemaw's systems were specified and handed off, never built, and nobody checked; hence
`scripts/unbuilt.mjs` and an acceptance list on every spec (BUILD.md).

## Settled by the owner (2026-10-07)

- **One difficulty.** "Extreme" is the style of fight, not a mode; an easier or harder fight is a new fight.
- **It is the run's FOE:** it keeps the last floor's bowl, its pay is the run's, and its two endings (burst or reprogram) stand.
- **A wipe costs the attempt, not the run.** The **Lip Stone** on the bowl's ledge marks the fight's start; a shatter or the enrage
  makes you whole there with the run kept (the floors, the haul, the clutches broken). It is not a Shrine (no respawn point in a Well,
  the owner's rule); the Wake Whistle still takes you out with the haul.
- **No currency but Lachrymite cubes.** No tokens, no trades, no odds: a cosmetic drops from the boss, guaranteed, when its
  achievement's criteria are met in the fight. The crown shard is withdrawn.
- **About 8:00 for an expert against a hard enrage at 9:30** (about 15% slack, FFXIV's margin at the item level a fight is tuned for);
  a first clear is an evening of pulls (10 to 30). **Open:** health is a model (`HEALTH`, 900, sized from `SUSTAINED`) until Strawman's bout line and
  `foe.end`'s seconds measure real players.

## What "extreme" means here (FFXIV, solo with the Courier's tools)

- A **scripted timeline**: the same casts in the same order every pull, learned by wiping; only the targets change.
- The **cast bar** is the log: "The Great Slip Jelly readies Lidfall." Parryable windups wear the Lachryma outline (PARRY.md).
- **No floor markers** for attacks: the body is the telegraph; only what persists is drawn (puddles, the slip, the brood's paths).
- The **tankbuster** is a parry or a roll; the **healer check** is your pool (raidwides take a set share, shown by the battle ring);
  the **damage check** is the calves and the enrage; the **adds** are the brood (the nursery made a mechanic).
- **Wanda's cue** turns on every phase (Thunder Force's musical boss).

## The shape of the fight

- **Phase 1, the Crown** (100% to 65%): the crown cracks to its own rams into pillars; until it breaks the body takes a quarter. The
  Crown Break: it reels 4 real seconds, every blow ×3.
- **Transition, Unstopped** (65%, about 30 s, untouchable): it sinks into the dish; the Blowout takes 40% of the pool (guard at the
  flash for half); the clutches still whole hatch in pairs, and each brood that reaches it heals it 2% and grows a crown plate back.
  The rim shallows flood with slip; fallen pillars become islands.
- **Phase 2, Bare** (65% to 30%): the core ×2, the body ×0.5; the floor slides toward it; it sinks and surfaces.
- **Phase 3, the Sherds** (30% to the end): four calves sharing its health; all down within 30 s or they mend and heal it 10% (the
  damage check: a calf left alive is the commonest wipe). A second Blowout at 15%; **the Overflow** at 5% (the whole floor slip, every
  clutch left hatches).
- **The enrage** at 9:30: The Dunemaw Swallows the bowl, and the attempt ends.

## The casts' names (Espada, 2026-10-07; `docs/LORE.md`; `NAMES` and `STATES` in `greatjelly.js`)

Each is a jar's part or a potter's step, and each also tells you what to do:

| placeholder | name |
|---|---|
| Crown Bash | Lidfall |
| Brine Line | Shoulder Charge |
| Gelid Rings | Throwing Rings |
| Ooze Rain | Slip Trail |
| Crown Glare | Eye Cup (the Greek eye-cup that stares evil back; the Veritome turns it) |
| the Clutch Wakes | Unstopped |
| the Slip Nova | Blowout |
| Brood Call | Broodwake |
| Sinking Sands | Centring |
| Submerge, Surface Slam | Slake, Wedge |
| Brine Cascade | Decant |
| Calving, the calves | Sherds ("the sherds mend" when they re-merge) |
| Brine Soaked | Sodden |
| The Overflow, The Dunemaw Swallows | unchanged |

## What it pays (the owner, 2026-10-07: "Lachrymite cubes are the one and only currency... achievements and skill dictating your progression and cosmetics")

The run's pay (the two endings, slip roe and the finds) is DUNEMAW-SYSTEMS.md's. The cosmetics, by achievements in THE WELLS (`DROPS`):

| achievement (met in the fight) | what drops |
|---|---|
| beat it | the **Jelly-crown glaze** |
| never hit by a Lidfall | the **Crown of the Dunemaw**, a curio of the highest tier |
| every clutch broken before the pull | a **slip jelly to ride** in the Dunes |
| the enrage more than a minute away | a **title** |
| its gaze turned back with the Veritome | a **kiln pattern** of the crown's eye |

## The events (rules in `tracking/dunemaw.js`)

- `foe.cast { cast, windup }` (the cast's id, e.g. `crownBash`): the log names it.
- `foe.moment { what }`, one of `crack`, `mirror`, `sink`, `feed`, `sherds`, `mend`, `sodden`, `dry`, `swallowed`: Espada's lines.
- `foe.end { how, ...the run's record }` (hits by cast, clutches left at the pull, the time, gazes turned): what the drops read.
- `foe.wipe { seconds }`. Each carries `by`.

## Acceptance (the owner ticks these; each becomes a QAIS test)

1. Reaching the bowl's ledge shows the FOE before the fight and the Lip Stone; clutches stand round the rim with eggs, guarded.
2. Breaking a clutch before the pull leaves fewer brood in the transition; the log counts it.
3. The crown cracks when it rams a pillar; a pillar cracks, then falls; the crown breaks in three rams.
4. The log names every cast as it begins; Lidfall can be parried.
5. At 65% it sinks, the Blowout lands, and the brood hatch and heal it if they reach it.
6. At 30% it calves into four; leaving one alive for 30 s heals it.
7. The enrage swallows the arena at 9:30; a wipe returns you to the Lip Stone with the run kept.
8. Finds and slip roe come home in the haul; meeting an achievement's criteria in the fight drops its cosmetic, every time.
