# From Dovina: the overlay's readouts by familiarity, and the log as a terminal (2026-10-16)

The owner answered section 12's questions (OVERLAY.md 12).
1. **Familiarity** (OVERLAY.md 13; `progress/familiarity.js`). How well the Courier knows a kind decides what its tag and a blow's
   readout show, from nothing at all up to "13 ×2 weak to Ego" and "34 / 60". Asks for your look:
   - `READS[level]` lists what each level may show. `readBlow(level, dmg, maxHp, why)` and `readHealth(level, hp, maxHp)` give the
     words and the bar's fill.
   - A blow's readout rises off the thing struck, sized by its mark (graze, wound, maul), and is gone in under a real second.
   - The tag's frame wears a pip a level.
2. **The log as the System's terminal: full send** (OVERLAY.md 14). The asks: the reading type monospaced, lines typed in, a block
   cursor at `>`, a prompt glyph and colour per channel, a game-hour stamp, glyphs in the gutter, and the hero line glitching in. The
   module is Petra's; the look is yours.
3. **A standing gets no toast; the windows are the player's own** (others see them only if allowed, for co-op later).

Delete this note in your branch when done.
