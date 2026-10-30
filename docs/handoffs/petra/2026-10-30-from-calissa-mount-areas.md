# From Calissa: the jelly mount's look, the two vantages' frames, and the ridges' fulgurite (2026-10-30)

All on `claude/calissa-art-cups` (7fbbbc6e). `npm run check` and `npm run build` pass. Each piece was looked at headless at
896 x 414 (2x, touch) and at 1920 x 1080.

**The slip jelly mount's look** (`vfx/jellymount/`; `JellyMountLook` is `game.jellyMountLook`, built in `boot/creatures.js`, updated in
`boot/frame.js` after the techs' tick, warmed in `boot/warmup.js`):
- **The body:** your mesh and material. My seal is pressed into its haunches in its own program (`jelly-melt2-seal`). `body.mat` is
  still the object your tick tints.
- **The moments:** the call wells up out of a puddle. A hop splashes as it takes off and as it lands. A hurt shows a flash and drops. A
  drink pulls crude in across the ground. A slump melts into a puddle that soaks away. A burst throws gobs, a ring of drops and dust.
- **The choice:** a gold ring on the ground round the Courier, a small skiff on the left and a small jelly on the right
  (`game.jellyMountLook.ring`, with `show(pick)`, `set(pick)` and `close()`).
- **The touch tile:** the SKIFF tile and the top bar's mount tile say JELLY, with its own glyph, when the jelly was chosen last.

Yours, in the mount's files:
1. **`root.visible` is a trap.** The zones set it, so your tick's `if (!B.root.visible) return` left the body parked at the warm-up's
   origin, never placed and never shown. Riding in the Dunes and then calling at the Raceway would do the same. My look sets
   `root.userData.zoneFree` on the body's root, so the zones leave it alone. The case is in the casebook under
   `NEW:zone-visible-gate`. Your gate could read your own flag instead.
2. **The call's rise scaling in `tick()` can go.** My look now sets the root's height and size after your tick in the call, the slump
   and the air.
3. **Placeholders that can go, once you agree** (I asked; your call): the HTML cards in `mountchoice.js` (MountChoice can call
   `ring.show`, `set` and `close` instead), and the `fx.impact` dust in `burst()`.

**The two vantages:**
- **`ridges.crest`:** an old trilithon half sunk in the crest's sand and leaning, its window turned outward over the ridges, two of its
  blocks fallen beside it, the stand behind it.
- **`ruins.arch`:** the tallest arch is its own frame. The stand is let into its lintel's top, and a Lachrymite drop is hung under the
  lintel in its opening as the sightline. It is sized to be seen from 30 m.

**The ridges' fulgurite** (`vfx/dunes/hotfulgurite.js`, owned by the Dunes' dress):
- **While it can be dug:** it reads `rareFinds.hot` and dresses the glass its bolt left. The glow cools from yellow-hot through orange to
  deep red over its 30 s, and breathes slower as it cools. A halo, embers and a thin dark smoke column rise off it, and the sand round it
  is scorched.
- **Dug** (on `area.rare`): the sand is thrown up, the piece is lifted out turning and flown into the Courier, and its glass is gone from
  the sand.
- **Cooled undug:** the glow fades and the glass stays.
- **Your `glyphs.pop` star in `lay()` can go once you agree.** As it stands it stays up its full 30 s even after a dig.

**The curio models** (`world/treasure/curiomodel.js`): the Fulgurite (a branching tube of fused sand, its broken top showing the glass,
the strike's light running down it) and the Crown of the Dunemaw (the urn crown whole again, ru celadon mended in gold, the
labradorite's light in its mouth). Neither had a model before.

**Pair specials:** your 17 report through `said`, `hit`, `marked` and `ended`, and the looks read all of them. Held Plate's `others`
now hold too.

Not verified:
- a real phone;
- a hop, a hurt, a drink, or a slump by dismiss, door or skiff (only the call, the ride and the burst were shot);
- the seal on the jelly's haunches at riding distance;
- the hot fulgurite under a real Fury storm (the probe forced the weather's look over noon light);
- the ruins' arch's stand seen from its lintel.

Delete this note in your branch when done.
