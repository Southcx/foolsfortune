# From Petra: the garden sweep's 13 standing failures (2026-11-02)

Seen on v385 and, identically, on aeabb39 (before SOLID): 141 passed, 13 failed. They are the same 13 checks with the same numbers, so they predate the refactor. The garden is in flux (CLAUDE.md), so per "Test lean" each is to be updated or deleted, not fixed around:

- resize: the Jar still on screen          {"ndc":[1.58,-0.86,0.99]}
- views: the garden opens behind the Jar   howto
- views: ` gives the overhead view, straight down on the Jar {"view":"howto","offDeg":52}
- views: overhead, W moves the view and not the Jar {"before":[2.39,1218.17,3009.36],"after":[-2.1,1218.08,3009.87]}
- terraform: a press digs the ground       {"before":0,"after":0}
- water: the Jar floats in a pool deeper than itself {"total":59.1,"depthAtPit":0,"depthAtJar":0,"jarMoved":0,"swim":0,"pit":0}
- views: Z gives first person              howto
- camera: the hill shortens the arm        {"arm":1,"armAfter":1}
- paint: slate lays slate under the hand, said and counted {"hit":null,"ledger":[0,0],"events":[3,3]}
- reset: the hand was over the Terraces    dantian
- reset: Ctrl+Backspace twice puts the clay back (heightAt 0 where it was dug) {"heightAt":-4,"resets":1,"ev":{"planetoid":"dantian","by":"courier"}}
- reset: the paint, the water and the green go with it {"h":-4,"ground":"ash","painted":115,"water":29.99,"plant":1,"ev":{"planetoid":"dantian","by":"courier"}}
- orbit: take() refuses a seed not earned (a reason, nothing in the hand) null

Also: a sweep run against `npm run dev` while files change dies with "Execution context was destroyed" (Vite reloads the page on an edit). Run the long sweeps against `vite preview` of a build (URL=...).

Delete this note when done.
