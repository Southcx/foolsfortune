# From Espada: Spirit Cooking's grain, names, tells and dishes (2026-11-02)

**Trimmed by Calissa, 2026-11-03.** The cooking stage's part is done (the bread's tells are shown on the dough before they are said:
`vfx/cooking/cookstage.js`; no lore name on any label). What is left is for Dovina (pass it on): her tells in `progress/cooking/moves.js`
`MOVES[*].tells` do not yet read as Espada's table below, and the fish's two tells and the dishes are not in her data yet:

- knead: shaggy "Shaggy. It tears as soon as you pull it." (Espada: "Shaggy. The dough tears and sticks to the board."); 0.45 "Smoother. A
  stretched piece tears before it thins." (Espada: "Smooth. The dough springs back slowly when pressed."); 0.92 "Tight. It fights back and
  tears." (Espada: "Too tight. The dough tears instead of stretching. Let it rest."). The windowpane matches.
- proof: four bands where Espada has three readings: "Barely risen. The dent springs straight back." / "Puffy. The dent springs back
  slowly." / "Overblown. The dent stays." / "Collapsed. ..." (Espada: "The dent springs straight back. Not ready." / "The dent fills back
  slowly. Ready." / "The dent stays. Over-proofed."). The collapse can stay as a fourth; the first three's words are Espada's.
- roll: 0.62 "Held to the light, you can see your hand through it." (Espada's the sheet: "Thin enough. Print shows through the sheet.")
- pull: strand counts only (Espada: holding "The strands hold. Fold again."; snapping "A strand snapped. The dough needs more rest.")
- boil: 0.68 "A thin white thread at its heart: l'anima, the soul. Al dente." (Espada: "Al dente. A thin white core at the bite."); 0.88
  "Soft all through. Overcooked." (Espada: "Soft all the way through. Overcooked.")
- the fish, fresh and past: no tell in the data yet (Espada: "Fresh. The flesh is clear and bright with its feeling." / "Dull and milky.
  Past its best.")
- the dishes (section 3): not in `progress/cooking/dishes.js` yet (its rows are by family and add-in).

The stage draws only bread so far (the window runs only bread: `world/garden/kitchen.js`); the sheet, the pull, al dente and the fish
are drawn once their steps run. Delete this note when Dovina has it.

## 1. Names (plain now, South's later)

- The module stays **Spirit Cooking** (South's, ruled 2026-11-01).
- In the UI: **pasta**, **noodles**, **bread**, **seafood** as the dish families.
- South's coinages (*Spirit Pasta*, *Soul Noodles*, *Soul Food*, *Soul Seafood*) are recorded in LORE.md as the lore names waiting on his
  ruling. Do not put them on a label yet.

## 2. The tells (the window's lines; booklet voice, no numbers)

| moment | line |
|---|---|
| shaggy | Shaggy. The dough tears and sticks to the board. |
| smooth | Smooth. The dough springs back slowly when pressed. |
| the windowpane | Windowpane. A stretched piece lets light through without tearing. |
| tight | Too tight. The dough tears instead of stretching. Let it rest. |
| the proof's dent, early | The dent springs straight back. Not ready. |
| the proof's dent, ready | The dent fills back slowly. Ready. |
| the proof's dent, over | The dent stays. Over-proofed. |
| the sheet | Thin enough. Print shows through the sheet. |
| the pull, holding | The strands hold. Fold again. |
| the pull, snapping | A strand snapped. The dough needs more rest. |
| al dente | Al dente. A thin white core at the bite. |
| overcooked | Soft all the way through. Overcooked. |
| the fish, fresh | Fresh. The flesh is clear and bright with its feeling. |
| the fish, past | Dull and milky. Past its best. |

Real facts kept: the windowpane test, the poke test's three readings, reading print through a pasta sheet, al dente's white core,
a fresh fish's clear flesh.

## 3. The dishes (grain, feeling by its taste: SPIRIT-COOKING.md 6)

| dish (plain name) | grain | feeling | why (a real fact each) |
|---|---|---|---|
| cold soba with mint and shiso | buckwheat | Wonder (cool) | zaru soba is served cold; menthol reads as cold (TRPM8) |
| honey toast | wheat (shokupan) | Mirth (sweet) | Tokyo's café dessert: a hollowed loaf, buttered, honeyed |
| ramen carbonara | wheat (alkaline noodles) | Desire (rich) | egg yolk and fat emulsified off the heat, as Roman carbonara is |
| mentaiko spaghetti | wheat (pasta) | Fury (heat) | the first wafu pasta (Tokyo, 1960s), spicy cod roe |
| orecchiette with bitter greens | wheat (durum) | Gall (bitter) | Puglia's dish with cime di rapa, a bitter brassica |
| onion soup in a bread bowl | wheat (a round loaf) | Grief (salt, tears) | the onion's lachrymatory factor; salt is tears |
| squid-ink udon with sudachi | wheat (udon) | Dread (sour) | sudachi is a sour Japanese citrus; ink is the dark |
| pulled noodles in broth | wheat (lamian) | none (the add-in picks it) | the folds double the strands; umami holds the draught |
| the catch over rice | rice | the fish's own | kaisendon; the seafood course, its feeling the catch's |
| crazy-water fish | (bread to mop it) | the fish's own | aquapazza, Naples' fish poached in seawater |

Blanks left blank: no lore names for the dishes until South rules the module final.
