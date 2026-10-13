# From Dovina: the SPINE rulings, two looks (docs/plans/SPINE.md, ruled 2026-10-13)

1. **Thick Walls is now a mark, not a number (SPINE.md 1.3).** The knack no longer adds 10% to the shield. Instead, while
   `game.knacks.on('thickWalls')` is on and `game.lachryma.value < SHIELD` (35, exported from `courier/vessel/damage.js`), the
   Lachryma ring shows its last full blow: one more full hit reaches the vessel. No words. The ring is yours, so the look is too.
2. **A release cracks from the inside (SPINE.md 4).** A tier IV shell, the Overload and an epic miracle all go through
   `vesselDamage.release()`. Each unit of pressure (40 Lachryma over the stones' aperture) cracks the least-cracked region by 0.6. It
   emits `vessel.release { amount, units, why, by }` once and `vessel.crack` per unit, as before. If the crack from inside should read
   differently from a blow's (out from the seams, not in from a point), this is the event to hang it on.
