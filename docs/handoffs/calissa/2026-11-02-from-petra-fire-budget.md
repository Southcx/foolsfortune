# From Petra: fire's budget and the two placement calls (2026-11-02)

The answers to your fire and boost-skating questions. Numbers are from the code; the frame cost of fire is not measured yet.

1. **Light.** Nothing is lent by hand. Put plain PointLights in the scene. The budget (`render/lightbudget.js`) scores every one of
   them 10 times a real second and copies the best onto its slots. Slots by tier: High 8, Low 4, Minimum 2. The yard already has
   5 dress lamps (`hangardress/kit.js` `D.lamp`, the yard's floodlights).
   - Two fire lamps for the two biggest fires: OK on High.
   - On Low and Minimum they crowd out the floodlights. Behind the tier or `machine.mobile`: one fire lamp at most, the rest emissive.
2. **Particles.** Ambition first, the cut from a measurement (CLAUDE.md), so there is no ceiling up front on the desk.
   - Build to the look, with its counts as knobs in your look's table (smoke, embers, a rate per burning cell), drawn from the shared
     sprite pools (`vfx/sprites.js`, 8192 a pool by default).
   - On the phone, start those knobs at a quarter of the desk's, behind `machine.mobile`.
   - I time it at the gate (`npm run perf` on the desk, `/perfab` on the phone) and set the phone's number from that.
3. **Where the step runs.** No new registration. The hangar is already a `world` system (`boot/rooms.js:85`) and steps the city in
   its update (`hangar.js:188`, `city.update`).
   - The fire's step goes in Dovina's `ToyCity.update` on a 4 Hz accumulator, its rules a pure module under `progress/mechs/` (her call).
   - Do not carry the burning cells on an event each step: an array every 0.25 s allocates, and every listener holds it (the field
     report keeps the events said before a slow frame).
   - Instead the state exposes a typed array of burning cell indices, its count and a version bumped each step (for example
     `city.fire.cells`, `.n`, `.ver`). Your instanced draw re-reads it when `ver` changes.
   - Events only at transitions: `city.ignite`, `city.char`, `city.douse`, a building felled by fire, each with `at` and `by`
     (never `name` or `t`).
4. **The boost-skating kit.** `world/hangar/mechpilot.js` is mine (428 lines).
   - Put the kit in a module of its own (for example `world/hangar/mechskate.js`), its numbers in a table Dovina agrees.
   - Send me the call sites; I wire them into the pilot.
   - Turn rate today: `PILOT.turn` 1.4 rad/s, `tankTurn` 2, doubled while facing a giant.
   - The core movement and its camera are not involved: the pilot has its own camera (`PILOT.cam`) and claims its keys (`CLAIM`,
     `mechpilot.js:54`). A new key joins `CLAIM`.
   - A new verb on the phone needs the arc's `mech` context (`ui/touch/arc.js`, mine): send me its name and slot.
5. **The mech's animation.** A retarget map in `vfx/mechs/anim/` is yours and collides with nothing of mine. Two rules:
   - `loadClips` (`courier/anim/suite.js`) hands back clips the Courier's animator also plays. Clone before renaming tracks
     (`AnimationClip.clone()`); never edit them in place.
   - Every posed joint passes through `rom.js` last, and a new rig gets a spec there. Add a `MECH_ROM` beside `GODHAND_ROM` and
     `PNEUKA_JAR_ROM` and use `rigLimits`.

Delete this note once read.
