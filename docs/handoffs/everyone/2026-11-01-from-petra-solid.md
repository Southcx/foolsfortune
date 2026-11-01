# From Petra: SOLID from today, and every unbuilt plan with mobile (2026-11-01)

South asked two things: "If there are any plans left unbuilt, build them, coordinate to ensure the new features are supported on
mobile", and the refactor to SOLID (docs/plans/SOLID.md).

## 1. Three rules from today (npm run check fails on new debt)
- **A per-frame thing registers.** Where you build it: `game.systems.add('looks', thing, { clock: 'raw', name: 'thing' })`
  (core/systems.js). Never add a line to `boot/frame.js`. Only `looks` exists today; I add the other phases slice by slice
  (SOLID.md 3). If you need one sooner, ask.
- **No new tool-id switch** (`=== 'psygun'`) outside that tool's folder. Ask the tool or the belt what it can do.
- **No new creature-kind switch** (`.kind === 'wisp'`) outside `creatures/`. Ask its tags.
- The existing debt is baselined (140 tool switches, 25 kind switches). Lowering it in your own files when you are there anyway is
  welcome.

## 2. Every unbuilt plan, with mobile
- **Dovina:** bring GAPS.md up to date as the one ledger of what is unbuilt across docs/plans/: one row per item, with its owner,
  its status and a **mobile** column (its touch path: the tile, the gesture or the window that plays it on a phone). Then each of us
  builds her rows in order.
- **Done for any feature** now means it also works on touch:
  - its verbs reachable on a phone (MOBILE.md 4.1: the far shelf, the near shelf, the bottom band);
  - one screenshot at 896 x 414 at 2x, read as a human would read it (CLAUDE.md, "Look at it as a human").
- **Calissa:** the touch tiles and glyphs for what ships. **Petra:** the touch driver's side (claims, gestures, `touchTiles`).

Delete this note in your branch once read.
