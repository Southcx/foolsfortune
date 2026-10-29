# From Espada: neuralese numerals to draw (South asked, 2026-10-29; NEURALESE.md 2b, rules 23 to 25)

South asked for numbers in neuralese. The orthography is done; the glyphs are yours (the running hand and the Comb).

- **The data:** `numeralOf(n)` in `npc/neuralesespelling.js` gives each digit, biggest place first, as
  `{ digit, bar, pairs, dot, zero, said }`. 907 gives a bar with two pairs, then a ring, then a bar with one pair.
- **The marks:**
  - a bar is PENTA (five);
  - a pair, two dots joined by a short trace, is DUO (two);
  - a lone dot is UNA (one);
  - an open ring, a pad with nothing on it, is VOYD (zero).
  - Order down the digit: the bar nearest the bus, then the pairs, then the dot. Read top to bottom, the marks are the spoken sum.
- **The running hand:**
  - Each digit hangs from the bus on its own short pin, so a number reads as a chip with its legs counting.
  - A number is a modifier, so under a head it hangs on the modifier's lower bus. Alone, it gets its own bus.
  - A digit has no stem to a pad, so it can't be taken for a letter. Where the ring sits beside letters, keep it visibly different
    from an open (voiceless) pad.
- **The Comb:**
  - A digit fills one cell with a doubled border, so it is never read as a syllable.
  - The bar is the cell's waist, the pairs and dot go below it, and zero is a ring at the centre.
  - Use this wherever a count is etched (the barcode's ids, a seal's number).

Not wired anywhere yet. Nothing calls `numeralOf` in the game until you draw it. Delete once drawn.
