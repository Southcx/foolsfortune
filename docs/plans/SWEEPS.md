# The room sweeps (the owner, 2026-10-07: "Go clean house")

Kept by Dovina (mechanical testing). Each room has a sweep in `scripts/sweeps/` on a shared harness; `npm run dev`, then
`node scripts/sweeps/run.mjs` (or one: `node scripts/sweeps/<room>.mjs [--quick]`). A sweep enters every place in its room, works it as
a person would and as a careless one would (spam, Esc mid-action, windows over windows, leave mid-action, twenty times fast, resize,
travel away and back), and checks the world is put back. A FAIL is a defect; it passes when the fix lands, and stays as the
regression check. The garden's findings are `GARDEN-SWEEP.md` (78 pass, 0 fail now).

**First runs** (headless, SwiftShader, no audio; b4c39f5 to a7eb1f1):

| sweep | pass | fail | defects |
|---|---|---|---|
| workshop (and every window) | 283 | 22 | 13 |
| basement | 235 | 19 | 10 |
| dunes | 237 | 16 | 10 |
| dunemaw | 204 | 14 | 11 |
| emocean | 221 | 9 | 7 |
| tools | 371 | 6 | 5 |
| garden | 78 | 0 | (fixed) |

**Not verified headless, anywhere:** sound and music, a real GPU, real-browser pointer lock, how poses and screens look beyond "not
black" (a few screenshots were read by eye). Screenshots and `results.json` land in `<tmp>/sweeps/<room>/`.

## The causes, grouped (one fix clears many checks)

### 1. A key that closes something opens it again (Petra) — 9 defects, every room
F closes a page or ends a talk on keydown, but the same press stays in `input.pressed` and the player's latch, so the next tick the
place under the Courier opens it again. Seen: F never ends a talk with the folk (Saggar, Pip, Raku, Letty Marque: `npc/dialogue.js:282`
then `courier/moves/talk.js:21`); F never closes a Shrine's page, and each F rests again (12 presses, 12 `shrine.rest`); the Throwing
Room's and the hub's Index, the pier's page (`world/shrines.js:92`, `testroom/room.js:164`, `basement.js:680`, `emocean/pier.js:47`).
The same leftover press: picking the Braid (B) on the Index opens the Codex, the Spindle (P) the Pneuka Box; holding W while the Index
is open picks a room (it ignores `e.repeat`: the Courier was sent 1,897 m to the Dunemaw). **Fix once:** whatever closes or picks on a
key spends it (`input.pressed.delete(code)` and `player.latch(code)`), in `IndexMenu.close()`, the pick, and `Dialogue.end()`; the
Index ignores `e.repeat`. Casebook rule 20 already says it; make it a helper so it cannot be forgotten.

### 2. Which windows may open over which (Petra) — 6 defects
B, P, M, Enter and F8 open over the kiln station; B, P, M over the dialogue box; the Pneuka Box then M (or the map then B) leaves two
pausing windows; P opens under the maw wipe (`main.js:995`, CASEBOOK rule 34); M opens mid-crossing (`cartography.js:497`); the pointer
locks while the kiln station is open (5 of 15 openings: `main.js:816`'s `modalOpen()` leaves out `kilnUI` and the dialogue box). Esc
over the kiln with the Codex open closes both and throws the preview away. **Fix once:** one `windowOpen()` (every window, the seam,
the crossing) read by `main.js:994–999`, `cartography.js`, `qais.canOpen` and the pointer-lock release.

### 3. Travel sets you down wrong (Petra) — 5 defects
`places.travel('jetty')` drops the Courier under the deck into the crude (`places.js:48` snaps to `dunes.heightAt`, the seabed); `kiln`
sets you 1.5 m from Saggar so F talks to her (`near: 1.0`); `tithe` 2.6 m from its mark (`at: tithe.mark`); `/goto` mid-crossing leaves
a full-size Courier standing on the sloop for the rest of it (`travel` and `stand` must refuse, or end the crossing); travelling out of a
Dunemaw run reports "Pay: 3 cubes" and gives nothing (`places.js:41,58` call `well.end(false)`, read as 'walk'; an achievement completed
on it). Strawman and the spray wall have no place within 3 m.

### 4. Trials and modes that can be cheated or stuck (Petra)
- **The Solar Skiffing trial is won with gold in 1.1 s on foot** by running through the last ring first (`solar.js:107` takes any later
  ring). Fix: only the next lit ring counts. **Dovina's ruling:** a ring counts only while the Solar Skiff is ridden, and the trial is
  begun from the skiff too (`courier/interact.js:39` hides every offer while riding; let `solar` through). F spam restarts it
  (`start()` must refuse while running). Back in the Dunes after travel, the Courier is on the skiff unasked (`Skiffing.end()`).
- **Stowing the Sondelass in Blade Mode leaves the world at 5% speed** for about 6 real seconds; **the god hand can be entered in Blade
  Mode** and then takes 24 real seconds to open (`sondelass.js:135,152,171`, `godhand.js:162`): cancel Blade Mode on stow and on ~.
- **The god hand can be taken mid time trial** (`godhand.js:164` reads `trial.active`, which `Trial` never sets: use `running`).
- **The tuning panel's teleport with the god hand out** leaves its view 36 m off in the siege (`teleport()` must `god.forceOff()`).

### 5. Raids (Petra)
Leaving a raid counts its raiders as downed by the Courier (`clappers.js:480` `dismiss()` goes through `hit()`; `clapper.down` has no
`by`) — **the ledger half is fixed** (below); emit `by: 'environment'` on a dismissal. Every raider comes back as a workshop clapperjar
(6 before a raid, 12 after three: `clappers.js:769` respawns raiders; skip when `c.raider`).

### 6. Text on the screen that the rules forbid, or that is stale (Petra; words Espada)
- The Weir has key help painted on its sand ("1 cutlass · LMB combo · RMB lunge", read mirrored: `tools/sondelass/angling/weir.js:118`):
  marks in the world are not text. Move it to the log's help.
- The course banner stays on screen, frozen, in the siege, over a circuit's panel and in the god hand (`basement.js:656` shows it every
  frame); the basement hub's help is said inside the Dunemaw (`inBasement()` is `y < -2`).
- A finished lap circuit names keys that do nothing ("R to run it again · H hub", `circuits.js:220`).
- The Sondelass's form strip stays over the god hand's arts (`#toolstrip`: hide it in `GodHand.enter()`).
- **The owner's ruling (2026-10-07, revised):** the course banner (`#course`) and the lap circuit's panel (`#circuit`) go to the log;
  nothing of theirs stays on the screen (Petra; `circuit.enter` now says the medal times and your best once it carries `par` and `best`).
- **The log drifts from its newest line** once it holds 140 lines (a burst left it 4,320 px up; a merged line that grows, 72 px), and the
  ISO keyboard's `\` (`IntlBackslash`) does not minimise it: measured by the workshop sweep's part 8, the fix tested and handed to
  Petra with its diff (`docs/handoffs/petra/2026-10-07-from-dovina-log.md`).

### 7. The Great Dunemaw (Petra, Calissa, Dovina)
- **The fight's cosmetics are counted but never given** (Dovina's to define, below): the five drops of `greatjelly.js` `DROPS` must
  exist as things: `glaze.jellycrown` (a glaze: `GLAZES`, Calissa's look), `curio.crown` (a curio, highest tier), `mount.slipjelly`
  (a slip jelly to ride in the Dunes: a new thing; Petra), `title.jellybane` (a title: the achievements' titles), `pattern.crowneye` (a
  kiln pattern: `vfx/finish.js`, Calissa). Given on `foe.end` into the Pneuka Box or the Codex (titles), never by a hook flag: the
  ledger's `foe.drop.<id>` is the record, the gift the event's rule.
- The Wake Whistle still works after it leaves the Pneuka Box mid-breath (`dunemaw.js:331,350`).
- A wipe sets you down 11.8 m from the Lip Stone (`wipe()` returns `bowl.arrive`); acceptance 7.
- ~~22 unnamed Groups added to the scene each visit to the great cavern~~: **fixed** (Petra's c58bcb4: a waiting sibling's psygun left in the
  scene; Calissa measured 421 Groups after one visit and after two). The four sherds were never taken down either: fixed (e0730dd,
  b45367d). The Dunemaw sweep's check (added): left after the fight, the bodies, colliders, jellies and creatures are back to before the cavern.
- The Dunemaw sweep read the log by index into its last 400 lines (a full log lost the early ones: "accept 4" failed at v114 on an
  unnamed broodCall); it reads each line's `seq` now (Petra's fix, v114). Petra asks the cavern warm-up visit be held while she traces
  the last +22 objects (4 top-level roots) over three visits.

### 8. Other
- **The Tithe's opening throws every frame** (`TypeError ... 'rig'`, `vfx/chestfx.js:45`; `TitheAct` sets `chests.cur` with no
  `.chest`): Calissa.
- **Every tool but the psygun stays drawn on a walking ladder climb** (`ladder.js:28` sets `handsBusy` only when rushing): Petra's call.
- **The time trial's best is written to `localStorage` itself** (`world/trial.js:43,170`): a save section (CLAUDE.md). Petra.
- **`skiff.bail` and `skiff.ollie` are emitted by nothing** (the moveset's achievement Eat Sand cannot be earned): Petra.
- **Events without `by`:** `trial.start`, `npc.talk/say/choose/bye`, `kiln.close`, `drill.left`, `strawman.mode`, `vessel.mend`,
  `cube.earn/spill/spend`, `tech.end`, `combat.start`, `courier.reform`, `skiff.start/pump/hop/trick/wobble`, `clapper.down`. Petra.
- The hub's Index offers no interact chevron (`basement.js:679` reads F itself). Petra.

## Fixed by Dovina in this commit (the ledger and the log's rules)
- The rail no longer counts as distance on foot (`tracking.js`); a `clapper.down` with a `by` other than the Courier's is not counted;
  the Dreamvane's twirl counts as `guard.twirl`, not toward the cutlass's Turned Aside; "The Great Slip Jelly bursts." said once (by
  `foe.end`, following how it ended); breaking a clutch is said in the log (acceptance 2; the words a placeholder for Espada's); the
  cast rule never prints a code id; "an Apprentice"; "Lachryma" capitalised and "a Possibilikey" in full in the log; "Celestial mode",
  not "Celestial Brush"; the achievement says Lidfall, not Crown Bash. Casebook: "The ledger counted what the Courier did not do".

## Names against the glossary (renames asked of their owners)
- **The Shrines' ids are their places', not their names** (`shrines.js:33-34`: `workshop`, `dunemaw`, `pier`); `pier` collides with the
  pier (`game.pier`). Use `bisque`, `lamp`, `float`, `pearl`. Petra.
- **`room`** holds a course station's number (`basement.js` CHECKPOINTS, `course.split`, `course.station`): `station`. Petra.
- **`lab`** (a place id; the glossary refuses "the lab") → `movementLab`; **"the index console"** (`places.js:73`, `tracking.js:292`) →
  the Index; **`testroom`** → the Throwing Room's code name (`throwingRoom`). Petra.
- **`game.emocean`** is the rail's conductor, not the sea → `game.rail`; **`foe`** has a third meaning on the rail (`waves.foes`,
  `shots.foe()`) → `hostile`. Petra.
- **`SOLAR`** lives in `progress/combat/dunemaw.js` → its own `progress/trials/solar.js` (Dovina's, next round). The Weir, the treasury and
  the Tithe are built in `tools/sondelass/angling/weir.js` (a place filed under a tool's form) → `world/dunes/weir.js`. Petra.
- **The Veritome still says film** (`veritome.js:7,17,22,34`, `film.js`, `book.film`, `ROLL`): the memory. Petra and Calissa.
- **The cast ids are the placeholders** (`crownBash`, `brineLine`, `slipNova`...: `greatjelly.js:44`, `raid.js:27`) → Espada's names
  (`lidfall`, `shoulderCharge`, `blowout`...). Dovina's table first, then `raid.js` and the sweep in one pass, as the garden's rename.
- **`rank.up`** is the standing → `standing.up`; **"The Board", "Board Rider"** (achievements) and "the board" (`skiff.js:20`) → the Solar
  Skiff. Dovina (achievements), Espada (the titles' words).
- `inBasement()` means below ground; `Cavern.floor = 3` makes the great cavern read as a floor; `trial.jars` and the `trial.jar` event
  (lantern targets) collide with the jar; `brush.draw` beside `<id>.draw` for every other tool; the busker's mat id `weir` means Old
  Grog's pier; `course.place`; "0 helpers" in the god hand's HUD. Petra.
- The log says raw ids: "You stand at workshop." (the `courier.goto` rule); "Your Pneuka Jar is made whole at your last Shrine" (the
  crossing's decline: "You are made whole"). Espada.
