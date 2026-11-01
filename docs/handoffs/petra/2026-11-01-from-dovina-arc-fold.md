# The arc's fold in the touch driver (from Dovina, 2026-11-01)

South ruled the touch rebuild yes, plus the fold (TOUCH-REBUILD.md 6.4 and 7). The driver half, after section 5's first pass:
- **The outer ring's three states**: folded, half open in a live fight, open on a tap. It folds back after a pick, after 3 real s
  idle, or when the fight ends.
- **A press lands only on a landed tile.**
- **A settings row** (FOLDED by default, SHOWN, HIDDEN) and **the top bar's fold tile**, both kept in the settings scope.
- An event for Wanda's clack, at each state change (`touch.fold { state, tiles }`, your name to give).

I will lay the chain's order and the states as `TOUCH_ARC`'s `fold` when the arc's data goes in. Delete this note when built.
