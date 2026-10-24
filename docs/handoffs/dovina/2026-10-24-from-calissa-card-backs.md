# From Calissa (Art): twelve card backs, and what opens them (2026-10-24)

The owner: "more card backs". Built and waiting on your rows: twelve backs a deck may wear, beside its own (the house deck's lapis chip,
the Arcana's plum eye). Look: `docs/plans/art/card-backs-set.jpg` (every back upright and turned). Code: `src/vfx/cardbackset.js` (the
backs and the store), `src/ui/cardbackchoice.js` (`game.cardBacks`, the save section `cardBacks`, `/cardback`).

**How it stands.** Each deck (`house`: Raku's tables; `arcana`: the Major Arcana face down on the reading table, the reading view and the
tables) wears its own back or one of the twelve. Until you add rows: a deck's own back is always open; the twelve are open **only in the
DEBUG save** (`game.mode === 'debug'`), and `/cardback house nacre` / `/cardback arcana winter` / `/cardback house own` switch them.
A back that is no longer open (a DEBUG pick met in STORY) goes back to the deck's own.

**What I need from you.** Fill `OPEN_WHEN` in `src/ui/cardbackchoice.js` (a table `id -> (game) => bool`, a predicate over the ledger or
the achievements, never a flag), or tell me where your unlock table lives and I will read it. Proposed rows (the `opens` are existing
achievements or ledger counts where I found one; "new" means a count I did not find and you would add):

| id | label | line (for the picker) | opens (suggested) | hint |
| --- | --- | --- | --- | --- |
| wands | Wands | Ember and vine in the Wands' orange. | `gy1` First Bloom (`garden.bloom` 1) | Tend a planetoid into bloom. |
| cups | Cups | Waves and a double chalice in the Cups' blue. | `an2` Line and Mind (`angle.cast` 100) | Cast the lure 100 times. |
| swords | Swords | Four blades from one pommel, under clouds. | `tr3` Trial Silver (`trial.medal.silver` 1) | Finish the lantern trial in silver time. |
| pentacles | Pentacles | A coin lattice and a wheat wreath in gold. | `chest.open` 25 (new threshold; `tc1` is the first) | Open 25 chests. |
| clay | Clay | Anagami: glazed earth, scarlet fire bands, a kiln's flame. | `fi1` The Second Firing (`firing` 2) | Pass a tribulation. |
| nacre | Nacre | Margarite: pearl, lamp brass and scallop shells. | `em1` Cast Off (`emocean.hop` 1) | Sail to another Island of Ego. |
| glass | Glass | Entropolis: an etched prism lattice in amethyst. | `emocean.hop` 3 (new threshold) | Sail three crossings. |
| brine | Brine | The Emocean: tarred ground, rope and salt. | an open-sea count (new: a square entered off the lanes, `progress/opensea/`) | Sail off the lanes. |
| spring | Spring | Blossom boughs and falling petals. | `garden.bloom.most` 3 (new threshold; `gy2` is six) | Have three planetoids in bloom at once. |
| summer | Summer | A sixteen-ray sun over glinting water. | new: a game day in the Spirit Garden in summer (`seasonOf`) | Tend your garden in summer. |
| autumn | Autumn | Maple leaves in rust, amber and crimson. | new: the same in autumn | Tend your garden in autumn. |
| winter | Winter | A snowflake in frost on deep blue. | new: the same in winter | Tend your garden in winter. |

The two decks are separate choices (a back opened is open for both). If you would rather a deck have its own unlocks, say so and I will key
`isOpen(id)` by deck.

**Also yours, if you want them:** the achievement or Codex row that shows a back's hint (I draw no window for the picker yet; `options(deck)`
gives `{ id, label, line, group, open, worn }` to whatever mounts it, the Pneuka Box's loadout or the Codex), and whether a back opened
should say so in the log (it does not: a preference).

Delete this note in your branch when done.
