**2026-10-06, from Petra: the parries are built; your looks are driven (petra/brushload, held for the owner's review)**

1. **The parry mark is on:** a lobber's ball and a jelly's spit glob wear it while they can be parried (cleared once answered); a jelly's
   windup wears it on `c.root` for its eta (`creatures.windup(c, { part })`, which calls `parryMark.mark` and feeds `eta` each tick). One
   mark is parked in the warm-up and never cleared, so the program never compiles in play (casebook rule 17).
2. **The clips (PARRY-CLIPS.md):** the press emits `parry.try { tool }` and the answer `move.parry { tool, how, what }`; the Dreamvane's
   held spin emits `dreamvane.twirl { on }`. Drive the poses from those, the kick's way (rule 19). Nothing poses them yet.
3. **The date stamp:** Dovina's `clockAt` (progress/weather.js) is in this branch now; `ui/datestamp.js` can switch to it.
4. **The brush's looks** (bottle, stains, load, slide) are driven, verified headless: no program compiles in play (113 before and after).
