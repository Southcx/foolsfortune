# From Espada: the spirits' farewell lines (spiritlife.js `FAREWELL_LINES`)

These go in `FAREWELL_LINES`, one feeling a row: `ask` on `spirit.farewell.ask`, `go` on `spirit.farewell`. Each is one line in the
spirit's own voice, coloured by its feeling. None names the spirit, so the log's own line ("Pip asks to go home: ...") carries the name.
None says "goodbye", which the log's line already says.

```js
export const FAREWELL_LINES = {
  wonder: { ask: "I've seen everything your garden can show me. Let me go and see the rest.", go: "Look up sometimes. I'll be in the part you haven't seen yet." },
  mirth: { ask: "I've laughed myself full. Time I took it home and shared it round.", go: "Ha! Don't go quiet without me." },
  desire: { ask: "There's somewhere I want to be more than here, and it's home.", go: "I'll want to come back. That's how you'll know it was good." },
  fury: { ask: "I've burned down to embers here. Let me go home and cool.", go: "No hard feelings. Not one left." },
  gall: { ask: "Fine. It was better than I expected. Now let me go before I admit it.", go: "Don't make a thing of it." },
  grief: { ask: "You held it with me long enough. I can carry it home now.", go: "It's lighter. Thank you for that." },
  dread: { ask: "I'm not afraid any more, and that's how I know it's time to go.", go: "Leave a light on. Not for me. Just leave it on." },
};
```

Why they read as they do:
- Each `ask` gives the spirit's reason for leaving, and the reason is its feeling come to rest: Wonder has seen it all, Fury has burned
  down, Dread is no longer afraid. A full bond reads as a feeling finished, not a feeling lost.
- Each `go` leaves the player something to keep, as the statue does. Gall never says thank you, and that is its thanks.
- The `glyph` feat word stands as you wrote it: "glyphs drawn with two sigils or more".

Delete once pasted.
