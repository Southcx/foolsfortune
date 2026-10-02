# The plan: Round 38, "What We Want, Buy and Wear"

Approved by the owner on 2026-10-02. Kept by Petra. Each division's tasks are in `docs/HANDOFFS.md`. This page holds the decisions and
the reasons, so a task can be checked against them.

## The decisions (the owner's)

1. **The Courier is a vessel**, the magnum opus of **Kaolin Anagami**, who made this place (an *Island of Ego*, one island of the
   larger Fool's Fortune world). **Players are entities that inhabit the vessels** Kaolin Anagami prepared for them. Customization is
   the decoration of the vessel: it is clay, glazed and fired.
2. **Lachryma is everything**: the stuff of the world, of feeling and of power (Tensura's magicules, Log Horizon's emotions). **One
   currency**: cubes, which are Lachryma made solid. Liquid Lachryma is energy. No premium currency.
3. **Raku haggles**, and is a greedy little miser about it.
4. **Start, then a menu, then the world.** The game divides into **STORY** and **DEBUG** (the sandbox as it is now: lab mode, the
   index, every tool). Story is a stub this round; its shape comes from the owner's talks with Espada.
5. **Rebuilding "the town that was"** at the Weir is a good test of economic treadmills (a later round). The **long-term sink** is an
   **Internal Shrine Garden**: a pocket dimension *within* the Courier vessel, invested in over the whole game. (The god hand's
   Pneuka jar is the vessel seen from outside: the way in is likely there.)
6. **Progress keeps resetting every build.** A personal save and a debug profile come when the systems are all in place. For testing
   the economy: `/grant` in DEBUG.
7. Later (not this round): travel between islands, Kingdom Hearts 2's gummi ship made voxel, with Skies of Arcadia's exploration.

## The finding

Cubes come from everywhere (jellies, the zandatsu, crystals, chests, duplicates, the Lockheart, and condensing cards: up to 1,200 for
one SS card) and go almost nowhere: the Tithe is 25 a pull and pays back about 22 on average before curios and duplicates. Money with
nothing to want. Shops, customization and the economy are one project: things worth wanting, and cubes the way to them.

## The four pieces

### 1. The title screen: THE FOOL'S PRECIPICE

From the owner's references (`docs/ref/title_fool_card.png`, `docs/ref/title_checker_vortex.webp`): not the workshop, but the feeling
of being about to set out.

- **The scene** (a live render on the game's own engine, at 480 lines like everything else): the Courier, in the player's own glaze,
  sits on the lip of a crooked hill (the Fool's cliff), legs over the edge, a clapperjar beside her like the Fool's dog. Beyond and
  below, a **checkerboard sea** bends up into a slow spiral (the vortex). **Giant game pieces** stand in it at every distance: pawns,
  a rook, a star-crowned king, a die. Tarot cards fall like leaves; a spiral moon with a face hangs above; Lachryma motes rise.
- **Better than a still: the board plays itself.** The giant pieces make moves **on the beat** of the title music (the beat grid the
  Crucibelle already uses: `MusicPlayer.grid()`): a pawn steps a square every bar, a die tumbles on the downbeat, the king turns at the
  phrase. The game is already being played around her.
- **The logo**: clay letters that are fired and glazed as the cue builds.
- **Press start**: **the Fool's Step**. She stands, the jar yaps, she steps off the edge, and the camera follows her down toward the
  board as the menu comes in (STORY, DEBUG, SETTINGS, SOUND TEST). A choice, and the spiral takes the screen into the world, with no
  cut, because everything is already loaded.
- **Comfort** (CLAUDE.md): a checkerboard at 480 lines shimmers if it is small and moving. Large squares, mipmapped, contrast eased off
  with distance, motion slow and steady; motion from things really moving.
- Prior art: the tarot's Fool (the step off the cliff, the dog), Kingdom Hearts' titles (a world drifting behind the menu), Wind
  Waker's living title, Persona 5's menus on the beat, Alice in Wonderland's chessboard, Kirby's and Mario's board worlds.

### 2. Courier customization: the vessel, decorated as a pot is

| | What | How it is got |
| --- | --- | --- |
| **Glaze** | colour, per region (body, mask, hair, trim): a palette swap | bought, photographed (the Veritome learns a colour from a photo), earned |
| **Slip** | a pattern on the mask, painted with the Soul Brush's own canvas | the player's own design (next round) |
| **Kintsugi** | gold seams that spread as achievements are earned | earned only, never bought |
| **Fittings** | parts: mask shapes, a cap, a scarf | bought or found (next round; needs art) |

At the kiln: F to sit, an orbiting camera, the "firing" applies it. Prior art: FFXIV's glamour (looks apart from power), Animal
Crossing's Able Sisters, Splatoon's gear, Jet Set Radio's graffiti editor, Dark Cloud 2's inventions from photographs.

### 3. Shops: four counters, four tempers, one system

- **Raku** (the treasury): Possibilikeys, Tithe pulls, coffins; buys curios. **Haggles**: a short minigame of reading a greedy miser's
  mood (he warms to flattery and to cubes on the counter, sulks at lowballs, and never sells at a loss).
- **Grog** (the pier): lures, film; buys fish.
- **Saggar** (the kiln): glazes and firing; buys shards. (Next round with slips and fittings.)
- **Pip**: seconds and oddments, stock that turns over daily. (Next round.)
- Prices move with stock (OSRS: buy a shop out and its price climbs; it restocks over time). Selling to the folk replaces condensing
  cards as the way to turn things into cubes.
- Shops are in the world: the goods on shelves, F at the counter opens the window.
- Prior art: OSRS's shops, Recettear and Moonlighter (prices and haggling), Wind Waker's Beedle, Animal Crossing's Nook's Cranny.

### 4. The economy: drawn, measured, tuned

- `docs/ECONOMY.md`: every source, drain, converter and loop (Dormans and Adams, *Machinations*), and targets in minutes of play
  (a glaze about fifteen minutes; a fitting about an hour).
- Measured: cubes an hour by source in the F3 panel (the ledger already counts every cube), and `tools/economy.mjs` simulating four
  players (a fighter, an angler, a collector, a gambler).
- Rebalanced: condense values down, the Tithe a little below even (the pity is the bargain), duplicates and the Lockheart's cubes to
  match.

## The shared parts (built once)

One catalogue (every item has a price and a sell value; glazes, slips and fittings are items); one counter (shops and the kiln share an
F point and the window kit); the ledger as the telemetry (and kintsugi reads it, as the achievements do); the title reuses the vessel's
glaze and the music's beat grid.

## Who does what (all at once)

- **Petra**: the title scene system (the board that plays itself, the Fool's Step, the menu, STORY / DEBUG); the economy map,
  measurement and rebalance; the shop system with Raku (haggling) and Grog; glazes, kintsugi and the kiln station; reviews, merges,
  publishes.
- **Calissa**: the Courier made ready to decorate (colour regions, a mask area for slip), alongside the texture and palette fixes from
  the art review; the title's art (the hill and tree, the giant pieces, the board, the moon, the logo, the Courier's sitting and
  standing poses); counters and shelves; glaze swatches.
- **Wanda**: the title cue (an intro, a loop the board can move to, and the Fool's Step); shop sounds (cubes on the counter, the kiln
  firing); Raku's haggling moods in clay-and-bell; the six placeholder sounds handed over.
- **Espada**: Kaolin Anagami and the vessels into the bible (with the owner); shopkeeper lines (Raku the miser most of all); glaze
  names and examine lines; the title's tagline and the menu's words.

## Next rounds

- **R39**: slips (painted with the Brush), fittings, Saggar's and Pip's shops, selling to all four folk, STORY's first steps.
- **R40**: the town that was (the treadmill test); the Internal Shrine Garden begins.
- Later: the islands, and the ship between them.
