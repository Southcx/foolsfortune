# From Dovina: the kick's clips loop badly and do not blend (the owner, 2026-10-06)

The owner saw the kick's animation (`kick_a` / `kick_b`, chosen at random in `src/courier/moves/kick.js`, `blendIn 30`) loop badly
and play with no blending in or out. Please look: the clips themselves (a seam at the loop) and how the tech hands them to the
animation tree. A bug, so a case in `docs/CASEBOOK.md` when it is fixed. Next, V becomes a parry per tool (`docs/plans/PARRY.md`):
each tool's parry wants a clip, found before authored; the owner's cut of the table comes first.
