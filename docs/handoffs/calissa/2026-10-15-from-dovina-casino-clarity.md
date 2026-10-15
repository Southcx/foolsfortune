**From Dovina (Design), 2026-10-15: the owner's clarity pass at Raku's tables. The drawing is yours, "all-out", in the labradorite.**

The brief is `docs/plans/CASINO-CLARITY.md`; read sections 2, 3, 5 and 8 first. The owner's own words: "if a 9 year old couldn't figure
it out how the games work within two minutes, it is too complex". He also said: "Tell Calissa she's responsible for reviewing what her
subagents bring her visually, this one is gonna be heavy on her."

**What you have to draw from (claude/dovina-design b6ffee5):**
- `session.coach()` gives, for any moment:
  - the goal and how near you are
  - the turn's one line
  - every choice as `{ move, label, what, preview, tone, best, size }`
  - each seat's colour, shape and key numbers
  - the centre's numbers
  - each game's extras: Querent's hand `shape` (groups, pairs, loose), the throw's `waits`, the arcana with their `does`; Event Horizon's
    dice odds; Supernova's last reaction; Nebula's secret faces
- `SEAT_COLOURS` and `SUIT_COLOURS` in `progress/casino/table.js`.
- `session.where` ('lobby' | 'howto' | 'table') and `session.howto { step, steps: [{ say, show }] }` for the spotlight.
- `casino.play { what: 'hand', steps, tier }` for Querent's count-up.

**The asks, in order of what unblocks a nine-year-old:**
1. **The goal bar and the turn banner on the cloth.** "YOUR TURN" in Red, which is you, with the coach's `turn.say`.
2. **The choices on their pieces.** Hover lifts the piece and shows `label`, `what` and `preview`; the suggested move glints gold. For
   choices with no piece, buttons that carry `preview` in the tone's colour, with ✔ ⚠ ✖.
3. **Size by importance.** CASINO-CLARITY.md 5 has a ladder for each game.
4. **Seat colour and shape** on rims, tokens and plates; **suit colour only on card faces** (section 3: four colours overlap).
5. **Cards and dice you can read from the seat.** Big corner rank and pip, the suit's symbol, dice faces with big numbers. The owner
   allows a larger texture budget for these; tell Petra what you need.
6. **The count-up** (section 8): Querent's two boxes (base and mult), the reasons lighting one by one, the reel, the tier flourishes.
   Also Supernova's cascade, Event Horizon's ×1/×3/×5 stamp, and Nebula's reveal reel.
7. **The how-to's spotlight** on the step's `show` part, with the rest dimmed.

**Where things stand now:**
- The lobby and the how-to are their own pages (`bazaar.lobby`, `bazaar.howto`), so your table view leaves those alone. It enters only
  on `bazaar.table`.
- My page (`world/bazaar/views.js`) now draws all of this as text, as the fallback.
