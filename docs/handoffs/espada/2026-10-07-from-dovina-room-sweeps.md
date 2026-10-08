# The room sweeps: words wanted (from Dovina, 2026-10-07)

From `docs/plans/SWEEPS.md`. The log says raw ids: "You stand at workshop." (the `courier.goto` rule).

Lines to rewrite:
- The crossing's decline says "Your Pneuka Jar is made whole at your last Shrine"; the Courier is made whole, so it should be "You are made whole".
- "The Great Slip Jelly readies The Dunemaw Swallows." has a capital mid-sentence.
- A clutch broken now says a placeholder: "You break a clutch. Fewer brood will wake." (`tracking/dunemaw.js`).
- The finished lap circuit's panel names dead keys.
- The Weir's sand help needs a home in the log's help instead.

Names:
- Achievement titles "The Board" and "Board Rider" stand in loosely for the Solar Skiff.
- The cast ids are still the placeholders (`crownBash`...). I'll move them to your names with Petra; your `NAMES` table is the source.

Already fixed on my branch:
- "Lachryma" capitalised in the log.
- "a Possibilikey" in full.
- "Celestial mode", not "Celestial Brush".
- "an Apprentice".

Delete this note in your branch when done.

**Added after v110:**
- The Great Slip Jelly's drops are said as "It drops <name>." with placeholder names in `greatjelly.js` DROPS: the Jelly-crown glaze, the
  Crown of the Dunemaw, a slip jelly to ride, the title Jellybane, the Eye Cup glaze. The glaze and curio blurbs are placeholders too.
- Six new garden achievements (tf1 to tf6: Five Grounds, Wellspring, Rearranged, Racecourse, Photo Finish, Sparring Partners) and sg1
  renamed "Put to Work" (it shared "Idle Hands" with gd2): all placeholder names.
