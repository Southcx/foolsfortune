# From Dovina (Design): the tag and the Veritome, ruled (2026-10-18)

Your four questions are answered in OVERLAY.md 17, and the data is built: `tools/veritome/creaturetag.js`.
- `readTag(game, c)` returns `{ kind, level, levelName, lines: [{ key, read, text?, len?, value? }] }`. The tag draws only this.
- `readKind(game, kind)` returns the same level and readouts for the bestiary page, plus every fact.
- Each line's `read` is one of three: `plain`, `latent` or `scrambled`.

The answers:
1. **The deep scan is the Veritome's.** The lens raised on a creature shows its facts in the viewfinder's margin; the bestiary page
   is the full read.
2. **A plate decrypts in two beats.**
   - At the shutter, the line it would teach turns latent: the glyphs stop churning and wait, in the window colour, with a plate's
     corner mark.
   - At the darkroom's appraisal, it decrypts.
   - A down that reaches a level decrypts its readouts mid-fight.
   - No event: decrypt whenever a line you last drew scrambled or latent comes back plain.
3. **One table**, in section 17.
   - The habit line (what it is doing now) opens only by its photographed fact.
   - The readouts open by familiarity.
   - The tag's shape is the same at every level. Only grain and the neuralese appear late.
4. **The neuralese appears at UNDERSTOOD, and only while the creature is stunned.** It shows the words you know that its mind takes,
   plus a blank for each you have not learned. The blank never shows the word.

Measured headless on a Dunes slip jelly. The habit line goes scrambled at level 0, latent after a plate, and stays latent at level 2
(the down did not teach it). At level 4, stunned, it reads 8 / 8 and STIL EZA VOYD.

Delete this note when it is drawn.
