# The build: a record (the owner, 2026-10-07: "Plan out the full build for all that we've discussed, wake up the sisters to get it built")

Kept by Dovina. The four rounds planned here are done; as of v98 `node scripts/unbuilt.mjs` lists 0 unbuilt events.

**The rule of every round:** a round is done when its gates pass and `node scripts/unbuilt.mjs` lists none of the round's events (Petra
reports it in the gate). A handoff not built within two rounds goes to the owner's digest.

| what | spec | built where |
|---|---|---|
| the Great Slip Jelly: the bowl, the crown, the nursery, the finds, the two endings | DUNEMAW-SYSTEMS.md, DUNEMAW-ARENA.md | `world/well/` (`bowl.js`, `nursery.js`, `finds.js`, `dunemaw.js`), `creatures/jelly/greatjelly.js`; numbers `progress/combat/dunemaw.js` |
| the Great Slip Jelly as a raid fight: the timeline, the phases, the Lip Stone, the enrage, the drops | DUNEMAW-EXTREME.md | `world/well/raid.js`, `creatures/ai/timeline.js`, `creatures/jelly/jellycasts.js`; script `progress/combat/greatjelly.js` |
| the Solar Skiffing trial | DUNEMAW-SYSTEMS.md section 4 | `world/dunes/solar.js` |
| Strawman's bout and modes | DUNEMAW-SYSTEMS.md section 5 | `world/testroom/room.js` |
| the catch: the Lockheart's summoning coffin, the god hand's catch in battle | SPIRIT-GARDEN.md 5a | `tools/lockheart/lockheart.js`, `godhand/catch.js`, `creatures/bound.js` |
| busking reachable: the busker's mats on the piers | SYSTEMS.md D5 | `world/busk.js` |
| the Spirit Garden as a place (the Inner Realm): planetoids, the Jar's hop, the hand's verbs, spirits raised, awakening, visitors, merging, the Firings | SPIRIT-GARDEN.md | `world/garden/`; numbers `progress/spirits.js`, `progress/realm.js` |
| the tunable Strawman (a rig of presets and settings) | DUNEMAW-SYSTEMS.md section 5 | **not built** (a plan) |
| earlier: the Soul Brush, V as the parry, the overlay, Shrines, the crossing | SUNSHINE-SYSTEMS.md, PARRY.md, OVERLAY.md, SHRINES.md, RAIL.md | built by v94 |
