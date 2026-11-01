# From Espada: the first path's step lines (2026-11-01)

`src/progress/goals.js`, `FIRST.where`. These replace my placeholders from 2026-10-27 and follow the System's voice (CLARITY.md 14): no
colon chains, one place a line, and the keys still `{id}`s so `deviceText` fills them in. Each line follows the achievement's own words
in the goals window and in the log's "Next goal: X. <line> Type /goals for all three.", so none of them repeats what the achievement
already asks. Paste the block in, drop "(placeholder words, Espada's)" from the comment above `FIRST`, then delete this note.

```js
  where: { // (each {id} said for the device last touched: progress/devicewords.js deviceText, at the log's line; Espada's words, 2026-11-01)
    sr1: 'There\'s a Shrine right beside where you wake. {use} at it.',
    gw1: 'Go back to the Shrine, {use} and pick YOUR SPIRIT GARDEN.',
    gw2: 'The seed is in the shed by the garden\'s gate. Carry it up into the open sky and let go.',
    gw3: 'Your first slab is at the plate shrine on the Athanor. A launch lotus will fly you up there.',
    fk1: 'Mistress Saggar is down on the workshop floor, by the kiln.',
    sk12: 'Try the atrium rail, upstairs in the workshop.',
    br1: 'There are pots all over the workshop. {use} picks one up and {primary} throws it.',
    tc1: 'There\'s one in the basement\'s hub. Drop down the hole in the workshop floor.',
    pl6: 'Use the Index in the basement\'s hub and pick the Dunes.',
    jl1: 'A few sit on the sand just past the Weir.',
    sf1: 'Out on the Dunes, {skiff} calls it.',
    an1: 'Head to the Weir\'s pier. In your Pneuka Box ({box}) make the Sondelass your main, {draw} draws it, then switch to the rod.',
    cx3: 'The course runs round the basement\'s hub. Go through all eight stations.',
  },
```

Why the changes, line by line:
- **sr1, gw1**: an imperative, so the player knows the next press, not just a place.
- **gw2, gw3**: one place and one action each. The colon chain in gw2 and "then carve" in gw3 are gone; the bench's how-to teaches the carving.
- **fk1**: Saggar by her title and where she stands, since the step is "speak with one of the clay folk" and she's the nearest.
- **sk12**: "The nearest is" pointed at nothing; "try" says the rail is one vantage point among several.
- **br1, an1**: the colons are now sentences. an1 says "switch to the rod" because "choose its rod form" read as a menu.
- **tc1, pl6, jl1, sf1**: the subject comes from the achievement ("Open a chest", "Unfurl the Solar Skiff"), so the line says only where and how.
- **cx3**: "one lap" already sits in the achievement's words; this says what a lap is.
