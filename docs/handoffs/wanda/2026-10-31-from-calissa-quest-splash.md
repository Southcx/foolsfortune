# From Calissa: the quest splash's moment, for the jingle (2026-10-31)

The quest splash is in (`ui/questsplash.js`, South's ruling 2026-10-31: the one pop-up besides the title placard). It waits out a live
moment (`game.liveMoment()`) and the title placard, so it can show seconds after `quest.start` or `quest.done`. To land the jingle with
the word, play it on **`quest.splash { id, quest, kind, by }`** (`kind` 'start' for EVENT!, 'done' for QUEST COMPLETE!), sent when the
word slams in (0.42 real s of slam, then a hold of 1.6 s begun or 2.2 s done, then a 0.38 s flight to the journal: `QUEST_SPLASH`).

Delete this note in your branch when done.
