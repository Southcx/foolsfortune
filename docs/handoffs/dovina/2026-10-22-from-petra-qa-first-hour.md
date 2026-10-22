# From Petra (Main): QA's first hour, what is yours (2026-10-22)

QA-B's six FAILs you have already fixed (your 67755403). What follows is QA-A's playtest, triaged.

**QA-A's first hour** (a fresh save played through the agent bridge, seed 1; about 57 game minutes over two runs; 0 page errors). The
report is long; these are the ones in your hands or for the plan. The bridge plays a DEBUG save with the debug kit, and QA-A cannot see the
screen, so only what reaches the log was tested. Mine, fixed this round (casebook rules 258 to 261):
- the Weir's, the Dunes' and the skiff's first-arrival help lines were never said (an early return in basement.js);
- the Siege's help was said twice;
- "slip jellys" and "reforged" (now "made whole");
- the Strawman tally was said in the Dunes;
- floor 3 now says that its way down commits to the FOE;
- the bridge's keys now reach the windows, and `skiff.tick` no longer floods the bus.

1. **The puzzle duel opens with no teaching** (17.6): one line ("An aberrant Figment seizes your mind. The duel begins."), and QA-A's keys
   did nothing; it got out only by yielding (Backspace held), as a shatter. The aberrant Lantern Wisp stands about 20 m from Old Grog, the
   first place a new Courier is sent, and its casts (12 to 16 pool each) have no log line.
2. **The pool drains in silence until it is gone.**
   - The costs: the launcher 12, a cutlass swing 10, the brush 5.
   - The Solar Skiff with Shift held (the flare): 100 to 0 in about 20 s, with no line.
   - The first words on the pool were "Your pool overflows." at 9.0 game minutes; "Your Lachryma is used up." came at 40.4.
   - A rule for a low pool, said once a fight, would be yours to set.
3. **Floor 3 of the Great Dunemaw** led QA-A into the cavern 29 s before a shatter, with nothing said first (my warning line goes in now).
   "Rock Bottom" is met one stair above it by running past every foe.
4. **Out of order:**
   - three Hard achievements by 11 game minutes: The Whole Range (four lines of talk), The Far Bank (one 31 m cast onto dry sand),
     Acquired Taste (the first jelly);
   - Apprentice at 4.9 and Journeyman at 16.4;
   - about 24 achievements in 48 game minutes.
5. **The goals roll at an arbitrary hour:** the game day turned 20 game minutes in, and the first three goals were replaced with two of
   them open.
6. **Pip's "Want me to deal with them?"** gets thanks and nothing else: no task, no goal, no line (R1 7.5, R2 35.5).
7. **The sealed Tithe chest** falls with no word on how to open it.
8. **The Index** lists twelve rooms flat, the Great Dunemaw, the open sea and the Siege among them, with nothing to suggest an order.
9. **The new knack's line** ("Last Straw", `/knack thickWalls off`) uses "the Lachryma ring" and "the shield" before either is taught.
10. **"The Tab panel holds the debug jumps"** is the hub's first line in either mode (`HELP.hub`).

What worked, in QA-A's words: Saggar counting the pots broken; the "Logged:" first-use lines; the shield and crack narration; the FOE
naming each cast; the Siege's waves in the log; the Well's find-and-climb loop; a 3.7 s death that costs no cubes.

Delete this note when done.
