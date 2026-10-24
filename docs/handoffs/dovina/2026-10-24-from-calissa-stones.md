# From Calissa (Art), 2026-10-24: more stones, as looks. The rules are yours

The owner asked for "more pneuka stones". The looks are built: every stone has a mineral now (`src/vfx/stoneminerals.js`, `MINERALS`),
drawn in the vessel's one finish program (vfx/finish.js, gem branch: two new uniforms, no new program). It shows on the stones' dice on
the vessel, the palm die and the flee's d20. The sheet is `docs/plans/art/stone-minerals.jpg` (the seven dice of each, headless).

Seven new gems are kiln rows in `courier/vessel/glazes.js` with `got: { debug: true }`. They show in the DEBUG save's kiln only (the kiln
is the chooser; no command added). Worn before you rule them, `stoneOf` gives them the Maker's rules. **Opal is already yours** (a STONES row
and a gem); its look is reworked (patches of play), so the eight the owner named are seven new ones plus opal. **Obsidian's id is
`sheenobsidian`**, because `obsidian` is already a skin tone's id.

## What I need from you
For each new id: a STONES row (its trade), and how it is got (start, ach, shop). When you rule a gem, change its `got` from `debug`.
Espada names them and writes the blurbs (all placeholders now).

## Proposed trades (one line each, in stones.js's voice; the numbers are yours)
| id | look | proposed trade |
| --- | --- | --- |
| `labradorite` | dark grey, broad flashes in the house's labradorite palette at an angle | the house's own stone: Divination's sight comes easier (a Figment telegraph or reckoning sooner), and the pool fills slower |
| `sheenobsidian` | black glass, a gold sheen riding across it | a mirror: the parry's window a little wider, and the shield thinner (fragility up) |
| `malachite` | rings of dark and pale green | the copper stone: overflow goes to the Spirit Garden's beds (or the mycelium) instead of the Lockheart; a shorter reach |
| `lapis` | deep blue, white calcite, pyrite flecks that glint | the painter's stone (ultramarine): paint and the Bottles cost less, and the pool's max is smaller |
| `garnet` | red so deep it is nearly black, lit at the edges | the traveller's stone: regen keeps going while moving (a shorter regen delay), and a release burns (a narrower aperture) |
| `rosequartz` | milky pink, lit softly from within | the gentle stone: heady low and the mind settles faster, and blows land softer (power down a step at Balanced) |
| `tigerseye` | gold and brown fibre bands, a line of light that rolls | the watchful stone: a wider bauble reach and a draught that holds longer, and no tint at night (it sees by day) |
| `opal` (exists) | milky, patches of spectral play | as ruled (`luck: { double, none }`); look only changed |

Also changed (looks only): amethyst's zoning, sapphire's faint zoning, citrine's honey veils, ruby's and garnet's dark heart, emerald's
jardin, onyx's bands, moonstone's billow.
