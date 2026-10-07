# The Spirit Garden sweep (the owner, 2026-10-07)

Kept by Dovina; each fix is its owner's. Run: `npm run dev`, then `node scripts/sweeps/garden.mjs` (one PASS/FAIL line per check,
screenshots under `<tmp>/garden-sweep/shots`, exit 1 on any FAIL). First run, on b4c39f5: **40 pass, 25 fail, no page errors**.

> "There are artifacts from previous builds like the 'calibration settings' information being present in the menus for the Spirit
> Garden, a black screen on Spirit garden loading, The pneuka jar being invisible, the targeting chevron doesn't align with pointing to
> the center of the planetoid you're on, lots of little things... I just want to make sure this codebase can survive another thousand
> iterations!"

Measured on the dev server, headless (SwiftShader, no audio). **Not verified:** a real GPU (a second black-screen cause could hide
behind SwiftShader), the published build, the garden's music, real-browser pointer-lock timing. Each fixed defect gets its case in
`docs/CASEBOOK.md`; each check stays in the sweep so it cannot come back.

## The owner's four

| # | seen | cause, as measured | fix | owner |
|---|---|---|---|---|
| 1 | Black screen on the first entry, forever | `realm.js:113` opens the `realm.name` page inside the seam's callback; from the next tick a window is open, so the frame returns at `main.js:999` before `game.seam.update` (`main.js:1060`): the seam holds at opacity 1. Its cover (z 11, `seam.js:20`) also sits over the index window (z 9). Progress resets each build, so every build's first entry hits it | open the naming page after the seam returns; let the seam update before the windows' early return | Petra |
| 2 | The Pneuka Jar is invisible | leaving the god hand ends with the jar's scale at **0.001** (`godhand.js:364`); `realm.enter` (`realm.js:107`) shows it but never resets the scale; `JarHop` (`jarhop.js:20`) takes that 0.001 as its base and keeps it. Without ~ ever used, it stands 2.46 m before the torii in the gate's colour, and reads as the gate's foot | scale 1 on entry, a base of 1 in the hop, the scale restored on the god hand's exit; a look apart from the torii | Petra (`godhand.js`, `realm.js`), Calissa (`jarhop.js`, the look) |
| 3 | Calibration numbers under the garden's pages | `indexmenu.js:114` appends the basement's calibration to every page, not only the Index's list (also at Shrines, the pier) | `if (cal && !this.page)`; and the page window is its own thing, not `IndexMenu` | Petra |
| 4 | The chevron ignores the planetoid's up | `vfx/chevron.js` never orients it (bobs on world Y, `:57`); sources pass only a position; `realm.js:280` offsets it along the Jar's up. Off the heart by: the Chimney 52°, the shed 41°, a slot 39°, a bed 33°, the gate 28° | a source may return `up`; the chevron orients and bobs along it; `realm.offer` passes the feature's own normal | Calissa (`chevron.js`), Petra (`interact.js`, `realm.js`) |

## Found besides

| # | seen | cause | fix | owner |
|---|---|---|---|---|
| 5 | The Jar thrown into orbit (circling the Dantian 6–11 m up after 40 s; 81 m out after 40 flings) | 20 m/s² gravity, no drag (`planetbody.js:77`); orbit at r 26 m is 22.8 m/s, the hand throws 26 (`hand.js:21`) | air drag, or the throw capped under orbital speed; a give-up that sets the Jar at the gate after 6 real seconds airborne (CASEBOOK rule 32) | Petra |
| 6 | The Chimney's needle is not solid (the Jar sinks 3 m in; rests 10 m off the shaped ground) | collision skipped past `r + 4` (`planetbody.js:82`) though the shape runs to 28 m; `nearest()` (`:35`) and the hand's ray (`hand.js:51`, a dead `+ 0` addend) use the bare radius | each planetoid's largest radius in all three | Petra; the shape Calissa's |
| 7 | Garden hops earn the Courier's travel achievements (Footsore, Up and Up) | `tracking.js:755` reads `player.pos`, which the garden sets to the Jar's | **Dovina's ruling:** the Jar is not the Courier; nothing in the garden counts toward the Courier's distance. Skip while `realm.active` | Petra (`tracking.js`) |
| 8 | "You enter UPPER FLOOR." in the garden; 88 cells charted there as explored ground (God Arts allowed) | `cartography.js:31` files everything under 1e9 as the upper floor; `wirecompass.js:115` announces it | the garden is never charted (no layer, no announcement) | Petra (`cartography.js`), Calissa (`wirecompass.js`) |
| 9 | P cannot close the Pneuka Box; Esc on a garden page or the map also opens the pause menu | P toggled twice a tick (`main.js:995`, `realm.js:224`); the window's Esc handler closes it, then `main.js:827` sees nothing open | delete `realm.js:224`; `stopImmediatePropagation` in `indexmenu.js:58`, `cartography.js:495` | Petra |
| 10 | The pointer locked inside the garden (6 of 8 quick cycles): the hand stops following the mouse | BEGIN asks for the lock testing `!god.active`, not `!cursorFree()` (`main.js:774`); `input.js:64` retries a refused lock without asking; `realm.js:134` asks outside a key press | `cursorFree()` in `start()`; the retry asks the game first | Petra |
| 11 | A leave during the entry's fade is lost (7 of 20) | `seam.js:28` refuses a second transition; `realm.js:115`, `:137` ignore it; `enter()` returns true regardless | queue the leave until the seam ends; `enter` returns the refusal | Petra |
| 12 | The world not wholly restored on leaving: `camera.up` stays the planetoid's, the sky stays the garden's pink | `realm.js:199`, `:347` | keep both on entry, restore on leave (CASEBOOK rule 30) | Petra |
| 13 | No help page for the garden: its keys (WASD, Space, Q/E, wheel, 1–6, F, P, right-click) only in the log | none written | a help page for the garden | Petra; the words Espada's |
| 14 | Little things | feelings listed mirth first on the PLACE and spirit pages (`hand.js:129`, `raising.js:105`; `STATS` now in the shown order, Wonder first); code ids shown ("spiritHouse of mirth", "SLIPJELLY", "Drill: sprint"); all 40 PLACE rows at once; a refused entry says nothing (`realm.js:89`); Esc mid-grab leaves the Jar in the air; leaving mid-tribulation keeps the Heavenly Kiln's music (read, not run); an oscillator at 24,890 Hz (a console warning, not traced) | the pages read `STATS`' order; player names from Espada; **Dovina's ruling:** PLACE lists what the Firings have opened, what you cannot afford shown dim, not hidden; a refusal is an event and a rule | Petra; Espada (names); Wanda (the oscillator) |

## Names against the glossary (the owner: "be more verbose when naming your scripts")

Entered in the glossary's homonyms (hop, kiln, art, Jar). Renames asked of their owners:

- `s.hop` (a spirit's whole body: `realm.js:163`, `hand.js:58`) → `s.body`; the Jar's hop is "the Jar's hop" in full.
- Planetoid ids `furnace`, `grove`, `peak` and comments "the Furnace", "the Spirit Grove", "the Meditation Peak" → the canon, the
  Athanor, the Mulberry Grove, the Chimney (`place.js:29-34,107,117,121`, `kiln.js:13,32`, `vfx/garden/tribulation.js:2-6`,
  `vfx/garden/cocoontree.js:3`). Dovina's own fixed in this commit (`progress/spirits.js`, `tracking/garden.js`, SPIRIT-GARDEN.md).
- Feature kind `peak` (the tribulation's mat) → `tribulationMat`.
- `PLANETOIDS` exported by three modules with three meanings (`world/garden/place.js:28`, `npc/realmnames.js:18`,
  `progress/realm.js:35`) → `PLANETOID_SITES`, `PLANETOID_NAMES`, `PLANETOID_PRICES` (the last Dovina's, done once the others land).
- `realm.jar` (a `PlanetBody`) → `realm.jarBody`; `Kiln` / `realm.kiln` → `Tribulation` / `realm.tribulation`.
- `place` / `GardenPlace` (clashes with `game.places`) → `site` / `GardenSite` (`plots.js:30` already says site).
- `IndexMenu` used as the general page window (how #3 happened) → a `PageWindow` the Index is one page of.
- "THE OPENING" in `vfx/garden/tribulation.js:6` is the Lockheart's ultimate: a different word there.
