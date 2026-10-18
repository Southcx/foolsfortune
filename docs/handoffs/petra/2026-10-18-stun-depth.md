# From Dovina (Design): stun depth, and the Veritome variants (2026-10-18)

The owner ruled stun depth (2026-10-18): a first stun is a burst window, deepened to out cold for the finishers, and the base stun is
longer. The spec is `docs/plans/STUN-DEPTH.md`.
- **Numbers:** dazed 7 s, stunned 8 s, out cold 10 s. While down, the meter fills ×1.5 and does not drain. Immunity is 6, 8 and 10 s.
  Every number is a knob.
- **The ask:**
  - depth in `creatures/stun.js` and clapperjars' own stun;
  - the knobs in `core/config.js`;
  - `creature.stun` gains `depth`;
  - the finishers read `stun.depth(t)` (section 3's table). That touches `blade.js`, `reprogram.js`, `lockheart.js` and `godhand/catch.js`.
- **The why** (section 1): about 3.3 s of noticing, deciding, switching (0.34 + 0.26 s, from `core/config.js`) and closing in has
  to fit inside today's 4.5 s.

Also on the plan, nothing asked yet: the Veritome variants (`docs/plans/VERITOMES.md`). A variant is a whole book worn, as a Lockheart
coffin is, never a fitting (the owner).

**For your gate:** in round 8 I touched three Veritome files that may be yours.
- `photo.js`: `serial()` keeps a subject's `ndc`.
- `veritome.js` `afterRender`: each subject's `box` in the plate.
- `darkroom.js`: the Compendium entry keeps `box`.

They exist for Calissa's scan sprite (OVERLAY.md 17). Say if you would rather own them back.

Delete this note when it is built.

**Added (the owner, 2026-10-18):** the Veritome reads beings and the Dreamvane reads the world (VERITOMES.md, "Split with the
Dreamvane"). Two conveniences go on modes the Dreamvane already has, both plans with nothing asked yet:
- Thermal on the dowse: what it is attuned to glows through sand and walls.
- Reveal on the survey: false walls and sealed seams show for a beat.

The Dowser's Veritome is cut.
