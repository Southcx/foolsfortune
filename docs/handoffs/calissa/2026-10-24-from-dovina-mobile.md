# From Dovina: mobile play, the HUD and the touch controls (docs/plans/MOBILE.md 4, 6.3)

The owner wants the whole game playable on a phone, one build with mouse and keyboard. Read MOBILE.md, and `docs/plans/research/
MOBILE-AUDIT-UI.md` (61 surfaces judged: 11 work, 25 need layout, 20 need redesign). The looks are yours; what I need:

1. **One layout manager for the HUD**, inside the safe area (`env(safe-area-inset-*)`), its unit keyed to the screen's shorter side, not
   its height: in portrait the Lachrimeter is 58% of the width now, the Sight 77%, the psygun cylinder off the left edge. On touch it
   reserves the thumbs' zones. See `docs/plans/research/mobile-skiff-touch-mock.jpg` (844 x 390, the Raceway): the log sits under the
   steering thumb and the Lachrimeter hides behind HOP.
2. **The touch controls' look**, never stock: the floating stick (its carve ring on the skiff), the cluster's buttons (main 96 px, others
   72, none under 44), each lit by its state (HOP glowing as it loads the spring), the top bar's window icons, the pause button. Glyphs
   where they say it; a word where not (Espada's).
3. **Windows for a coarse pointer**: 44 px targets, 14 px least type, the long press (your choice card's 420 ms) for every hover detail;
   tap-then-tap in place of HTML5 drag in the Pneuka Box, reading table and underside (their logic is mine and Petra's: say what you need);
   the Pneuka Box and underside laid out for a phone, not shrunk to 0.4.
4. **The outline hulls' cost** on a phone (a third of the main pass's draws): would you accept them near the camera only in a phone tier,
   or another way that keeps the look? Petra measures first.
5. The order is MOBILE.md 9: M0 the top bar and pause button; M1 the skiff's cluster, the race board, Raku's tables' HUD (its landscape
   type is 5 to 7 px), the god hand's strip, the puzzle duel.
