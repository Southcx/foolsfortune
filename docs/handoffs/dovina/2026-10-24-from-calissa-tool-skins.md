# From Calissa (Art): tool skins, rows and opens for you to rule (2026-10-24)

The owner: "Pull out all the stops and go as hard as you can on customization options, you can get weird with it, worst case we dial
back later." Built: **a tool's skin** (GLOSSARY), looks only, 38 skins over the seven tools plus each one's `stock`. The table is
`src/vfx/toolskins.js` `TOOL_SKINS[tool][id]` (label, line, roles); the runtime `src/vfx/toolskinwear.js` (`game.toolSkins`). Nothing
here touches a rule, a timing or a reach. Kept in the save as section `toolSkins`, scope `player` (wiped on a new build, as the vessel's
glazes and the skiff's paint are). DEBUG wears any: `/toolskin <tool> <skin>`. **STORY has no way to wear one yet: that is yours.**

What I need from you, cards face up:

1. **The opens.** Each skin a predicate over the ledger (achievements, never flags). My proposal, each with a count way and a feat way
   (DESIGN.md 22, "arts only by achievement"):
   - a crafted look (walnut, blued, bronze, temple bronze, driftwood, weathervane, wicker, bone handle, lacquer, grimoire, clay bell):
     a count of that tool's use (e.g. `psygun.shot` 500, `brush.swing` 300, `lockheart.open` 25), or bought at the kiln as a firing.
   - a ceramic look (porcelain, raku, kintsugi, celadon kintsugi, jade, the jade-bound book): the kiln (FIRE count, or owning the matching
     vessel glaze: a set bonus that reads).
   - a place's look (coral reef, kelp and coral: open sea finds; living bamboo: the Spirit Garden; meteoric iron, night sky, black sun,
     moonlit silver: something at night or under a vantage; obsidian, molten: the Great Dunemaw).
   - the weird ones (Corrupt Data, Glitched Codex, Lightning Rod: a data bug drained, a puzzle duel won; Jester's Motley and Jester's
     Coffin: a Fool's achievement; Glass Reliquary: open the Lockheart at twice full; Glass Bell: a song played clean on the Crucibelle;
     Serpent Skin: the sea serpent photographed; Peacock: every feeling awakened).
   Unknown: whether skins should cost cubes at all (a sink: the owner's glazes are one). Your call on the economy.
2. **Where they are chosen.** A choice card row per tool (the Pneuka Box's reading table is the obvious seat: the tool's card already
   shows the skin, its picture re-rendered on a change). I draw it once you say where. Until then the DEBUG command is the only door.
3. **The ledger.** `toolskin.set` { tool, skin, by } is emitted; tracking counts `toolskin.set` and `toolskin.<tool>.<skin>`
   (`src/feedback/tracking/toolskins.js`) and the log says "Your Soul Brush wears Peacock." Change as you like.
4. **Names.** All plain (CLAUDE.md "Plain names until settled"); Espada names them when you and the owner call it final.

The rows, by tool (id: label):
- psygun: walnut Brass and Walnut, blued Blued Steel and Bone, porcelain Cobalt Porcelain, raku Raku, kintsugi Kintsugi, reef Coral Reef,
  data Corrupt Data
- sondelass: tamahagane Hamon and Damascus, obsidian Obsidian, bamboo Living Bamboo, moonlit Moonlit Silver, motley Jester's Motley,
  molten Molten
- soulbrush: lacquer Lacquer and Horsehair, peacock Peacock, bone Bone Handle, jade Bamboo and Jade, night Night Sky
- veritome: jade Jade-Bound, camera Brass Camera, grimoire Tooled Grimoire, ouroboros Serpent Skin, codex Glitched Codex
- dreamvane: weathervane Brass Weathervane, driftwood Driftwood, meteor Meteoric Iron, reef Kelp and Coral, lightning Lightning Rod
- crucibelle: temple Temple Bronze, glass Glass Bell, clay Clay Bell, celadon Celadon Kintsugi, blacksun Black Sun
- lockheart: bronze Bronze, ebony Ebony and Pearl, reliquary Glass Reliquary, wicker Wicker, ossuary Ossuary, motley Jester's Coffin

One thing to know: a Lockheart skin dresses the coffin over the heart's own colours (the emblem on the lid stays the heart's), so the
coffin fitted reads by its emblem and the reliquary's dial while a skin is worn. If you want the heart's colour kept, say so and I mix it in.

Delete this note in your branch when done.
