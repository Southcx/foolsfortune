# From Calissa: round v135's four looks (lend panel, Skiff_Glide, Celestial mode's mark, Gall's clips)

Crossings, each the smallest call-site edit (please review):
- `src/feedback/codex/codex.js`: the ALL ARTS switch replaced by a LENDS button (DEBUG only) opening a `lend` shelf drawn by
  `ui/lendpanel.js`; the records shelf headed by its save's name (`saveName`); a lent Movement Art's row wears the hollow mark.
- `src/debug/qais/tabs.js`: a fifth tab, Lends, in DEBUG only, drawn with or without the store. `src/debug/qais/qais.js` `redraw`: the
  tab row always from `tabList`, and the Lends tab drawn before the store opens. Digits 1 to 4 still pick the first four tabs.
- `src/tools/soulbrush/techniques.js` markAt: the glyph `'star'` (gold) becomes `'celestialMark'` (vermilion).

Asks:
- The Lantern Wisp's suite now has Gall: `Mood_Gall` (the basic ring's loop) and `Emote_Shudder` (the onset) in
  `src/assets/lantern_wisp.glb`; Fury's is the suite's `Mood_Angry`. Nothing in the game plays the suite yet (WHEEL.md:
  `creatures/anim/suite.js` is not built), so "Fury's Angry is wired" is true of the file only. When the suite is wired, map
  gall -> Mood_Gall / Emote_Shudder, fury -> Mood_Angry / Attack_Cast's wind-up held, and give the rig a spec in `courier/anim/rom.js`.
- Knacks have no Codex page, so the hollow mark is on the arts only; a knacks shelf (or the `/knack` list) can take `lentMark` as it is.
