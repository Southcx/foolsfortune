# From Petra: the puzzle duel's next round (South, 2026-10-28)

South played v332 and set this round's direction. Their words, then who builds what. Each division reads its part and says
what it needs from the others, once, with `send_message` or a note here.

## South's asks

1. **Tooltips you earn by seeing.** Tap one of the aberrant's countdown badges and you get a tooltip, but only for a foe skill
   you have seen happen in a duel. Observation first.
2. **Rework the tsuitate's bottom.** Action points are gone from the PvE duel. Re-check the whole duel UI: show everything that
   matters, remove what is out of date. The Courier's form, the form's dive and the tools' moves (SHOT, GRAB, ...) are tabled.
3. **God hand powers in the duel.** One power per domain (seven), built on conventions we already have (`GOD_POWERS`,
   `progress/godpowers.js`), turned into puzzle moves.
4. **Strawman drops all seven feelings' gems.** That is harder, and the seven powers are what bring it back down: turn one gem
   type into another, lower the match needed, and so on. "Dovina is creative."
5. **A design-space log.** Dovina writes down every design space explored and every one implemented, so nothing is retrodden
   or forgotten.
6. **JRPG cut-ins for the foe skills.** Calissa goes full throttle on the aberrant's special attacks. The strongest (the
   desperate flare) should feel like a limit break.

## Who builds what (in this order)

**Dovina (the rules, first; the others build on your table):**
- `DUEL_POWERS`: one power per domain. Each gets its puzzle verb, its numbers, what it costs and how it recharges, and how it
  shows its reach. My seeds from the god hand's own powers, yours to keep or replace:
  - Ouranurgy (Swap): two cells or two patches trade places.
  - Manifestation (Manifest/Sculpt): raise gems of a chosen colour into holes or junk.
  - Divination (Scan Intent): see, or put off, the foe's next skill.
  - Psychokinesis (Lift Ground): lift a row or column and set it down shifted.
  - Possession (Herd): gems near a drawn line come to it.
  - Alteration (Transmute): one colour becomes another.
  - Spellscription (Miracles): a feeling's weather over your half, its gems matching at 2 for a few turns.
- Decide which powers are open: by domain level, by what is worn on the bracelet, or all seven from the start. Then decide what
  the two tool skills (`SKILLS`) become. Tabling them is South's call; removing them is yours.
- `RULESETS.strawman`: all seven colours.
- **Seen:** the rule for when a foe skill counts as seen. The practice duel counts nothing in the ledger, and South will meet
  Hurl first against Strawman. So seen is probably knowledge, not a counter (like familiarity, or the Book). Name it in the
  glossary.
- **The design-space log:** one file, e.g. `docs/plans/DUEL-DESIGN-SPACE.md`. One row per space: the idea, its prior art,
  tried / built / cut / parked, the build or commit, and why.
- South's questions from this round go in your digest.

**Espada (the words):** labels and one-line effects for the seven duel powers (genre words, plain names until settled), the
seen tooltip of each foe skill, and the cut-ins' names if they show one.

**Calissa (the looks, full throttle):**
- The tsuitate's bottom reworked with no AP row.
- The phone's duel screen (`hudlayout.js duelLayout`, `duelscreen.js`, `actioncontext.js duelCluster` / `duelTools`): undo,
  END TURN and the AP pips (`apPips`, `setAP`) gone from the PvE duel; the seven power tiles in their place, in each domain's
  look (`DOMAIN_LOOK`). What only the classic style uses stays out of the PvE screen.
- The badge tooltip, in the System's type, only when the skill has been seen.
- Each foe skill and the desperate flare as a JRPG cut-in: a frame across the screen, the aberrant's portrait, a held beat. The
  flare is the limit break.
- Each power's cast on the tsuitate.

**Wanda (the sound):** the cut-ins' stings (the limit break the largest), and each power's cast.

**Petra (the session and the gate):**
- In `duelsession.js`: a tap on a badge goes to the view's tooltip, asked once the rule says seen.
- The seven power tiles' input, the power's reach under the finger, and its cast.
- The kernel's power events go on the bus with `by`.
- Then merge, check, a full-resolution shot on the phone and the desk, build, publish.

Delete your copy of this note once your part is merged.
