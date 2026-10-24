# From Petra: the mobile round, M1 to M5, and the cleanup (2026-10-24)

The owner, 2026-10-24: "Utilize the rest of the weekly budget on codebase cleanup and implementation of the MOBILE plan as outlined,
coordinate with your sisters for everything you need." The plan is `docs/plans/MOBILE.md`; its section 5 judges every system and section 9
gives the phases. This note says who does what, in order. One build is published as each phase can be played on the owner's iPhone.

## Now: v265 (M0 and the skiff on touch)

- **On main:** the input layer, the drivers, the shell, the cloud save, `?perf`, the touch controls, and the skiff on touch.
- **Held for one blocker:** the seal picker reads the name from keys A to Z, and an empty name cannot be confirmed. A phone shows its
  keyboard only for a focused field, so a phone cannot get past the seal on the first start of a build. **Calissa:** a real field.

## M1, first play (MOBILE.md 5 and 9)

| what | who |
| --- | --- |
| the seal picker's name in a real field (16 px or more, or iOS zooms), lifted above the keyboard | Calissa |
| the windows sized for a phone: Index, race board, dialogue, shops, Codex pages, choice cards, the pause menu; long press 0.42 s for detail | Calissa (looks), Espada (words) |
| a settings window: look sensitivity, camera follow, graphics tier, volume, haptics, the touch layout's reset | Petra (`game.settings`, the rows and their keeping), Calissa (the dress), Espada (labels) |
| the garden on touch (MOBILE.md 8.2) and the god hand (section 5: the finger is the hand, strip, long press wheel, two fingers) | Petra (the driver's gestures), Calissa (the strip, the long press ring), Dovina (the lists) |
| Raku's tables, the puzzle duel, the track editor and haunt: pointer events already reach them; sizes, END TURN, the editor's drawer | Calissa (layout), Petra (checks with the harness's thumbs), Dovina (the duel's tool strip list) |
| QAIS's corner button (DEBUG builds), so the owner files reports from the phone | Petra |
| the help and the log's hints that follow the device (`input.device`, event `input.device`) | Espada (words), Dovina (the rules that pick them) |

## M2, the island on foot

| what | who |
| --- | --- |
| the on-foot cluster (JUMP, CROUCH, DASH, USE naming its thing) | Dovina (lists), Calissa (tiles); the driver presses them already |
| the map on touch: one finger pans, two pinch, long press sets the waypoint | Petra (`feedback/cartography.js` on pointer events) |
| the Pneuka Box, the reading table, the underside: tap, tap; long press detail; laid out for the screen | Dovina (the Box's rules), Calissa (layout) |

## M3 to M5 (in order, after M2 is played)

- **M3, the tools.** Each tool's context and cluster: Dovina maps them with each tool's owner (MOBILE.md 5's rows). Petra: aim by drag with
  the lock-on, FIRE dragged while held, the drawn verbs as a finger's stroke, the Crucibelle's pads. Wanda with Petra: the rhythm
  mode's ten lanes as pads.
- **M4, the sea.** Petra: the rail (the stick, the lock-on sweep as a drag, ROLL, FORM, the surge) and the open sea's helm. Calissa: the
  rail's tiles. Wanda: the cue under it.
- **M5, parity.**
  - Calissa: a layout editor. Petra keeps the layout in the settings section.
  - Petra: gyro steering as an option (iOS asks permission on a tap).
  - Wanda: haptics where they help.
  - Petra: the phone tier tuned from the owner's `?perf` screenshots.

## The cleanup (the check's debt, by owner: `scripts/check-baseline.json`)

- **save.storage** (keys written outside the save; move each into a `save.section`; settings-scope keys read the old key once, then
  delete it):
  - Petra's: core/config.js, cartography, gamelog, help/menu, psygun/shells, veritome/book and mind/macros, basement, circuits, vessel.
  - Wanda's: audio/voice/voice.js, music/player.js, music/rhythm/rhythm.js.
  - Calissa's: ui/theme.js, workbench/overrides.js, workbench/workbench.js, cine/sequence.js.
- **word.retired.polarity:** the one live use is the ship looks' `polarity(hex)` alias for `feeling(hex)`. Petra changes her caller
  (world/emocean/stage.js). Calissa changes hers (vfx/mooring.js, the workbench stages) and drops the alias in vfx/sloop.js and
  vfx/shipclasses.js. The rest are prior-art comments ("Ikaruga's polarity"), reworded as "Ikaruga's black-and-white switch" by each
  file's owner; Dovina's are in progress/rail.
- **Other debt:**
  - module.size, Petra's: main.js, player.js and breakables.js are split by concern; player.js gets a stress test.
  - module.size: character.js belongs to whoever owns it.
  - module.header: vfx/particles.js (Calissa).
  - rand.sim: lockheart/outcomes.js (Petra). clock.sim: save.js and gamelog.js (Petra).
- Petra lowers the baseline as each lands. Delete this note when its rows are done.
