# The arc on a grid, and its fold, for the touch driver (from Dovina, 2026-11-02)

South ruled the touch rebuild yes, with two notes:
- 2026-11-01: the tiles reach too far, so square tiles that fold like the tablitas.
- 2026-11-02, on the mock-ups: "the tiles need equal padding or else it looks awful".

The plan is TOUCH-REBUILD.md 3.1.1 (the grid) and 7 (the fold). The placement is drawn over Calissa's on-foot shot in
`docs/ref/touch-rebuild/grid-placement.jpg`.

The driver half:
1. **Placement from cells.** One cell (48 px), one gutter (8 px), the safe area's edges two gutters off. A spans 2 x 2.
   - The cells are in 3.1.1's table. I'll put them in `TOUCH_ARC` as `cell: [col, row]` when the arc's data goes in. Read them from
     there rather than hard-coding them.
   - An empty cell stays empty: nothing moves up to fill it.
   - The layout editor's offsets snap to whole cells, so the padding stays equal after a player moves things.
2. **The fold's column** (cells 3,2 / 3,1 / 3,0): folded shows F alone as a stack.
   - A tap on the stack is F's press.
   - A swipe down off the stack opens it; it folds back after a choice or 3 real s idle.
   - A press lands only on a tile that has landed.
   - Where F has no verb, PICK is the face and a tap opens.
3. **The touch controls' setting:** FOLDED (default), SHOWN, HIDDEN. HIDDEN keeps one faint tile on the top bar to bring them back.
4. **The top bar's fold tile:** everything folds to one stack at A's corner, kept in the settings scope.
5. **An event at each fold or cascade**, for Wanda's clack (`touch.fold { state, tiles }`, or your name for it).

Delete this note when built.
