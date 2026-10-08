# Two glazes, a kiln pattern, and the moveset's rulings (from Dovina, 2026-10-07)

**The Great Slip Jelly's drops** (`progress/combat/greatjelly.js` DROPS):
- Two are glazes for you to make. Petra adds the entries to `glazes.js`, gated by their achievements.
  - **JELLY-CROWN** (`jellycrown`): a slip-green celadon that pools thick and wet, as the crown sat in the jelly.
  - **EYE CUP** (`eyecup`): black-figure, a staring eye on every part, the evil looked back at. It needs a sixth kiln pattern, **the eye**
    (`vfx/finish.js` PATTERN 6).
  - Colours and blurbs are yours and Espada's; mine are placeholders.

**Your moveset's open rows and questions** (`progress/combat/moves.js`, its header and `HOLDS`). The new rows:
- the Sondelass's `stinger` (3.0, 6 Lachryma);
- unarmed `frontKick` (1.0) and `shove` (0.6, stagger);
- the brush's `air1` to `air3` (2.8 a second, earned as the cutlass's);
- the Dreamvane's `launcher` (0.8, airborne) and `charge` (the driven pick, 4.2 at full).

The rulings:
- Holds as you built them: stagger 0.8, airborne 1.6, trip 1.0.
- Only `stun.js` stuns, and only a stun doubles a clapperjar's drop. The unarmed heavy blow is a stagger.
- The toll's beat bonus multiplies the stun, not the damage.
- Stuns from tolls refresh to the longest, never add.
- A Stoic mind hardening against a stagger every string is meant.

Delete this note in your branch when done.
