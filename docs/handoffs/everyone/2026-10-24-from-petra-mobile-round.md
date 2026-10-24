# From Petra: the mobile round, M1 to M5, and the cleanup (2026-10-24)

The owner, 2026-10-24: "Utilize the rest of the weekly budget on codebase cleanup and implementation of the MOBILE plan as outlined,
coordinate with your sisters for everything you need." The plan is `docs/plans/MOBILE.md`; its section 5 judges every system and section 9
gives the phases. This note says who does what, in order. One build is published as each phase can be played on the owner's iPhone.

## Now: v266 (the iPhone that opens nothing, M3 to M5's Petra parts, the sisters' M1)

- **The owner's iPhone opens nothing** (iOS 18.7, every WebKit path: Dovina, 2026-10-24). v266 carries the boot watch (index.html's
  first script: each stage under the loading line, an error before the title shown with its stage, a breadcrumb that tells the next
  load where a killed one stopped) and holds less: as a phone, the page's process 644 to 542 MB at boot (the basement's labels baked,
  render/bakedcanvas.js; three's userData clone no longer encodes images, render/threefixes.js). The owner's screenshot decides the
  next cut (T207).
- **Canvases by owner** (a phone, the built game, after v266): Calissa's vfx/bazaarfaces.js 22.5 MB (the house deck's atlas),
  vfx/sight.js 8.3, vfx/rave.js 4, vfx/lachrimetertube.js 3, vfx/sprites.js 2, vfx/duelview/marks.js 1.3. A canvas drawn once can be a
  baked canvas texture (`bakedCanvasTexture`), which lets its pixels go once uploaded.
- **Built by Petra since v265:** M3's driver part (core/touchtools.js), M4's (the rail's stick and sweep, the helm's rudder;
  contexts `rail` and `helm`), M5's (the touch layout kept, core/layoutkeep.js; gyro steering, core/gyrosteer.js).
- **Merged for v266:** Calissa's settings window, god hand strip, top bar tiles, stick stand-down, art bar, the tables' touch, card
  backs, blow feel; Dovina's track editor drawer, the Box's long press, the emocean sweep on `rail.form`; Espada's words.
- **Waiting:** Dovina's rows for the rail and the helm (ROLL, FORM, SURGE, BOOST, BRAKE; THROTTLE up and down, MOOR, FIX, FIRE);
  Calissa's tool tiles and the stick standing down for Celestial mode's paper; Espada's words for the gyro row, the touch log lines and
  the boot watch.

## M1, first play (MOBILE.md 5 and 9)

| what | who |
| --- | --- |
| the seal picker's name in a real field (16 px or more, or iOS zooms), lifted above the keyboard | Calissa |
| the windows sized for a phone: Index, race board, dialogue, shops, Codex pages, choice cards, the pause menu; long press 0.42 s for detail | Calissa (looks), Espada (words) |
| a settings window: look sensitivity, camera follow, graphics tier, volume, haptics, the touch layout's reset | Petra (`game.settings`, the rows and their keeping: **built**, core/settings.js), Calissa (the dress), Espada (labels) |
| the garden on touch (MOBILE.md 8.2) and the god hand (section 5: the finger is the hand, strip, long press wheel, two fingers) | Petra (the driver's gestures: **built**), Calissa (the strip, the long press ring), Dovina (the lists) |
| Raku's tables, the puzzle duel, the track editor and haunt: pointer events already reach them; sizes, END TURN, the editor's drawer | Calissa (layout), Petra (checks with the harness's thumbs), Dovina (the duel's tool strip list) |
| QAIS's corner button (DEBUG builds), so the owner files reports from the phone | Petra (**built**: REPORT) |
| the help and the log's hints that follow the device (`input.device`, event `input.device`) | Espada (words), Dovina (the rules that pick them) |

## M2, the island on foot

| what | who |
| --- | --- |
| the on-foot cluster (JUMP, CROUCH, DASH, USE naming its thing) | Dovina (lists), Calissa (tiles); the driver presses them already |
| the map on touch: one finger pans, two pinch, long press sets the waypoint | Petra (`feedback/cartography.js` on pointer events: **built**) |
| the Pneuka Box, the reading table, the underside: tap, tap; long press detail; laid out for the screen | Dovina (the Box's rules), Calissa (layout) |
| DASH in the air under the sprint's Shift (a pad's latch, touch's stick): a person's press is always an edge (casebook rule 290) | Petra (**built**, core/input.js) |

## M3 to M5 (in order, after M2 is played)

- **M3, the tools.** Each tool's context and cluster: Dovina maps them with each tool's owner (MOBILE.md 5's rows). Petra's driver part
  is **built** (core/touchtools.js, after v265): FIRE or AIM dragged aims; the cutlass's SPECIAL tapped, swiped up or down, or held
  crouched; Celestial mode drawn under the finger (the stick must stand down for the paper: Calissa); the lens's tap the shutter; two
  fingers the wheel where a tool reads it; the lock-on taking a foe by itself on touch (a setting). Waiting on Calissa's tool tiles (ids
  as the bindings: fire, aim, shell, lock, the strips) and Espada's words. Wanda with Petra: the rhythm mode's ten lanes as pads.
- **M4, the sea.** Petra: the rail (the stick, the lock-on sweep as a drag, ROLL, FORM, the surge) and the open sea's helm. Calissa: the
  rail's tiles. Wanda: the cue under it.
- **M5, parity.**
  - Calissa: a layout editor. Petra keeps the layout in the settings section (**built**: `game.touchLayoutKeep`, get / put / clear,
    save section `touchLayout`, event `touch.layout`).
  - Petra: gyro steering as an option (iOS asks permission on a tap) (**built**: core/gyrosteer.js, the settings' gyro row).
  - Wanda: haptics where they help.
  - Petra: the phone tier tuned from the owner's `?perf` screenshots.

## The cleanup (the check's debt, by owner: `scripts/check-baseline.json`)

- **save.storage** (keys written outside the save; move each into a `save.section`, or `save.keyed(key, scope)` for a store kept
  under its own key; settings-scope keys read the old key once, then delete it):
  - Petra's: **done** (25 to 0: the tuning, the map and the Book keyed; the rest sections).
  - Wanda's: **done** (paid before v266).
  - Calissa's: **done** (v266).
- **word.retired.polarity:** **done** (v266: 0; `rail.polarity` retired, `rail.form` carries the aspect). Was: the one live use is the ship looks' `polarity(hex)` alias for `feeling(hex)`. Petra changes her caller
  (world/emocean/stage.js: **done**, and her comments; the `rail.polarity` event waits on Dovina's sweep). Calissa changes hers (vfx/mooring.js, the workbench stages) and drops the alias in vfx/sloop.js and
  vfx/shipclasses.js. The rest are prior-art comments ("Ikaruga's polarity"), reworded as "Ikaruga's black-and-white switch" by each
  file's owner; Dovina's are in progress/rail.
- **Other debt:**
  - module.size, Petra's: main.js, player.js and breakables.js are split by concern; player.js gets a stress test.
  - module.size: character.js belongs to whoever owns it.
  - module.header: vfx/particles.js (Calissa): **done**.
  - rand.sim: lockheart/outcomes.js (Petra). clock.sim: save.js and gamelog.js (Petra). **Both done.**
- Petra lowers the baseline as each lands. Delete this note when its rows are done.
