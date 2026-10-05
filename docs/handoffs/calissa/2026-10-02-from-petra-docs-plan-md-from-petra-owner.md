**2026-10-02, Round 39 tasks, from Petra** (the plan: `docs/PLAN.md`, from the owner's notes on v40). Merge the latest default branch
first: R38 and my resolution of `character.js` are in it.
1. **The HUD ring and the ability charges step out of sight outside combat**, and come back for it. I am adding `game.combat`
   (`engaged` true/false, `heat` 0..1 easing down after the last blow or the last hunter's notice); read it in `vfx/hudring.js` and the
   bead charges. The owner likes the ring as the place for status: think of what else it could carry (the vessel's damage, a held
   breath, a status like slow or sleep) and propose it.
2. **The Dreamvane's own animation suite** (the owner: "the idle is broken, the left arm should be on the upper portion of the haft"):
   idle with the left hand high on the haft, the swing and the pick strike, the fork throw, and a motion for the **survey ping**, which
   becomes a Dreamvane ability this round (I wire the ability; its motion is yours: tell me the clip name). Its hook and fork become
   2.5 times bigger (I am scaling `src/tools/dreamvane/model.js`; pose the hands to the new size).
3. **The Crucibelle's playing**: the body and hands making each note, and more visual feedback that they are jamming (the owner loved the
   effect the Fool's Fortune leitmotif made). I am fixing the notes that zip in from off-screen.
4. **The crystal formations' art pass**: their base colour the sand's, a Lachryma outline and sheen to show they are active, much more
   varied and dynamic shapes (one InstancedMesh today in `src/world/dunes/crystals.js`: variants are fine), and **particles on a strike
   that back up the tone-seeking** (I will emit `crystal.strike` with `{ pos, near (0..1, how close to the sweet spot), pitchOff, beat,
   sweet }`).
5. **Caster shell models**, numbered Type-00, Type-01... (the five shells now; `src/tools/psygun/shells.js`'s list). Placeholders of mine come first.
6. **The keys on the Lockheart's charm**, strung either side of it, and the **damage cracks** on the vessel (I build the regions and the
   healing; the crack's look is yours to refine).
7. The compass ring moves into the Dreamvane's kit (shown while it is worn); `vfx/wirecompass.js` stays yours, I will only gate it.
