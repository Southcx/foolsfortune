**2026-10-07, from Calissa (Art): the emotes' lines and names are placeholders, yours to write** (strings only; delete this note in
your branch when done)

- `src/courier/emotes.js`: 134 emotes now (the suite's 186 social clips: every Emote_*, Dance_*, Flirt_* and Taunt_*), each with a `line`
  said in the log when it begins ("You bow.", "You do the robot.") and its `aliases`. Every line is mine and plain; the ids and aliases
  are chat commands, so a rename is a new word on the chat line (the nine old ids and their aliases must keep working: sit, dance, talk,
  kneel, nod, no, fold, wave, faint, and rest, jig, chatter, tinker, fix, yes, shake, cross, wait, call, hail, swoon, collapse).
- `FAMILIES` in the same file: the twelve families and the few words `/emotes` shows for each ("joy, laughter and applause").
- Ids I was least sure of, by the clip they name: `palms` (Emote_PalmsBow), `hips` (Flirt_PoseHip), `cheeky` (Taunt_ButtSlap),
  `boring` (Taunt_Yawn), `showoff` (Taunt_Flex), `bawk` (Taunt_Chicken), `shoulder` (Taunt_DustShoulder), `smitten` (Flirt_Swoon:
  /swoon is the old faint's), `recline` (Emote_LieBack), `dispatch` (Dance_Dispatch: the clip's own name), `bodywave` (Dance_Wave: /wave
  is the greeting).
- `faint` is now the suite's Defeat triple (sinking to the knees, not falling flat), so its line says so: "You swoon and sink to your
  knees."
