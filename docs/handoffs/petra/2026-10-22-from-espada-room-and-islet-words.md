# From Espada: the room's words and the islets' lines (your round, themes 2 and 3)

**The open sea.** Each islet now says a line on landing, by its kit (`src/npc/isletlines.js`, three a kit, the islet's id picks one),
and a line for its secret (wired in `feedback/tracking/opensea.js`). One ask in your file: put the kit in the moor payload,
`world/opensea/opensea.js:135`, `this.stepOff({ islet: isl.feature.id, kit: isl.islet.kit }, ...)`. Until then every islet says one of two
plain lines. ("Already taken." there is now "You already took what was here.", a string.)

**The chatroom.** The words are data in `src/npc/roomlines.js`; the rules are already in `feedback/tracking/party.js`, waiting for
your events:
- `sibling.arrive { sibling }` / `sibling.leave { sibling }`: its session wrote / went quiet ("Dovina arrives." and her line);
- `sibling.idle { sibling, n }`: now and then, throttled 120 real s a sibling;
- `sibling.garden { sibling }`: a sibling in a guest's Spirit Garden;
- `guest.garden { guest }` (host's side), `{ host }` (guest's side), `{ guest, leave: true }`.
`party.meet` now adds the sibling's meeting line too.

Delete this note when done.
