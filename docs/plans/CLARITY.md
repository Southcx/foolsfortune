# Clarity: making the game readable at a glance

The owner, 2026-10-08: *"None of those entries tells me jack diddly about what they do mechanically. We gotta come up with a bulletproof
spec to increase the intelligibility of the game."*

This spec covers every word and picture the game shows the player: menus, pages, cards, prompts, the log. Lore stays in the
world, the folk's lines and the Codex. **The UI says what a thing does, in the words other games already taught the player.**

Owners:
- the rules and the check: Dovina;
- the words: Espada;
- icons, cards and diagrams: Calissa;
- the windows that use them: Petra.

## 1. The test

A player who has never seen the game looks at any choice for two seconds. They can then answer three questions:

1. **What does it do?** (the verb, in genre words)
2. **How do I use it?** (the key, or "passive")
3. **What does it cost, and how often?** (energy, charges, cooldown)

If any answer needs a paragraph, the UI has failed, not the player.

## 1a. The root cause (the UI audit, `docs/plans/research/UI-AUDIT.md`)

Nearly every window is built from one row template (`menu.showPage`, `src/feedback/indexmenu.js`): a one-character glyph, a bold
title and a grey sentence. It has no slot for an icon, a stat, a bar, a key or a picture, so every mechanic gets written as prose. The
same row is copied as a local helper in about nine files. Rewording the rows helps a little. **Replacing the row with the card
(section 4) is the fix.**

Some windows already work and are the models:
- the shop: item icons, price chips, stock beads;
- the Pneuka Box: an icon grid, odds as coloured percentages;
- the Codex's locked cards: a progress bar and an n of N counter;
- the kiln: colour swatches, a button that says its price;
- the "Continue?" page: cost and consequence in plain words.

## 2. Prior art

| Game | What it does right | What we take |
|---|---|---|
| **Hades** (boon cards) | icon, name, one line of effect, the number coloured | the card |
| **Slay the Spire** (card keywords) | bold keywords explained on hover, numbers inline | the keyword list (section 5) |
| **Into the Breach** | shows exactly what an action will do before you commit | the preview (section 6) |
| **Zelda: Breath of the Wild** (rune and item screens) | icon, one line, the button | the key prompt on every card |
| **Mega Man** (weapon-get demo) | a short loop of the weapon in use | the demo loop (section 6) |
| **Gradius** (power-up bar) | a row of slots you can read at a glance | the slot row |
| **Monster Hunter** (gear compare) | green and red arrows against what you have now | the compare line |
| **The Xbox and Game Accessibility Guidelines** | plain language, never colour alone, readable size | rules 7 and 8 |

## 3. Two names, one job each

Everything the player chooses has two names:

- **the label**: a short genre word for what it does (*Grapple*, *Bomb*, *Vacuum*). The UI uses only this.
- **the lore name**: the world's name (*the hook*, *the toll*, *the gulp*). It lives in the Codex, the folk's lines and the wiki.

A label is one or two words, a word a player already knows from other games. It is never a word the game invented, and never a
metaphor that needs the lore to decode. The glossary records both names for every such thing (section 9).

## 4. The card

Every choosable thing is shown as one card: a mount, a tool, a Movement Art, a shop item, a feature to place, an encounter's
choice, a ship. A card always has the same parts, in this order:

1. **an icon** (Calissa's pixel art, 1x, scaled by whole numbers);
2. **the label**, big;
3. **one line of effect**: verb first, at most 8 words, numbers in colour ("Pulls loot in, yanks boarders off");
4. **stat chips**: small icons with numbers, never prose. Range (m), angle (°), cost (the energy icon), charges (×3), cooldown
   (real seconds, never bars or game hours), duration;
5. **the key**: what uses it ([1], [LMB], "passive");
6. **its state**: equipped, ready, or locked. A locked card says what opens it, in one line ("Opens at the second Firing").

The lore name, the history and the why go in a detail line. It is shown only on hover or when the card is held, never by default.

**Never** in a card: a sentence with a colon in it, a parenthesis inside a parenthesis, a word from the glossary's world section, or a
number without its unit.

## 5. Keywords

A small, fixed set of genre words, each with an icon, bold wherever it appears, explained on hover (Slay the Spire). A new mechanic
reuses one of these if it can. Adding a keyword is a glossary entry and needs Espada's word.

| Keyword | Means | Icon idea |
|---|---|---|
| **Absorb** | a shot of your colour is drunk, not taken | an open mouth over a dot |
| **Parry** | press at the right moment to send it back | a crossed blade flash |
| **Bomb** | clears shots around you | a ring burst |
| **Lock-on** | hold to mark targets, release to hit them all | a bracket reticle |
| **Weak point** | hit here for extra damage | a cracked eye |
| **Stun** | the target stops for a moment | stars |
| **Energy** | your Lachryma pool (the word *Lachryma* stays beside it) | the pool's drop |
| **Cooldown** | wait this long before using it again | a clock wedge |
| **Charges** | uses per trip | pips |
| **Hull** | hits your ship can take | a cracked plank |
| **Fuel** | how far the ship can go | the bottle |
| **Passive** | always on, nothing to press | a ring |

## 6. Show it, then say it

Text is the backup. Every card that changes how you play gets a picture of the change:

- **A preview in the world.** Choosing a mount at the pier draws its shape on the moored ship: the cone, the ring, the reach. Choosing
  a feature in the garden draws its footprint and its neighbours' links. (Into the Breach.)
- **A demo loop.** A card held for half a second plays a 2-second loop of the thing in use, beside the card. (Mega Man.)
- **Compare arrows.** Anything replacing something shows green and red arrows on the stats that change. (Monster Hunter.)
- **World marks over words.** Whatever can be said with a mark on the thing itself (a ring on the ground, a glow on a weak point, the
  resist ward) is not said in text. This is the house rule already (CLAUDE.md, "Marks in the world are not text").

## 7. Words

- **Plain verbs, short lines.** The card line is at most 8 words. The detail line is at most 25 words.
- **Reading level.** Card text reads at about grade 5 (Flesch-Kincaid). `scripts/clarity.mjs` measures it.
- **One clock.** Durations the player sees are real seconds, never bars. Bars are the music's, and the player feels them as beats.
- **Never colour alone.** A colour always has a shape or a word beside it (the five feelings: their icon and their name).
- **Window titles say what you can do there.** "Choose your ship", not "THE PIER". The place's name can sit small above it.
- **The log** follows the same rule: verb first, one line, no unexplained lore noun. A lore noun appears in the log only when the thing
  is on screen (Charybdis, rising) or already has a card.

## 8. Beyond buttons

A list of text rows is the last resort. In order of preference:

1. **Diegetic**: the thing itself in the world (the mounts on the moored ship; Myggdrasil's crop hanging under its caps).
2. **A visual chooser**: cards in a row, a radial wheel for 4 to 8 quick choices (the order wheel already does this), or a slot bar
   for loadouts (Gradius).
3. **A list of cards** (section 4).
4. **A list of text rows**: only for long, scrolling, reference content (the ledger, the Grimoire).

## 9. The label table

Each player-facing mechanic gets a row here, then a glossary line. The labels below are proposals; the words are Espada's to settle.
The game must have **one** label per thing.

### The ship's mounts (the screenshot that started this)

| Tool | Lore name | Label | One line | Stats |
|---|---|---|---|---|
| psygun | the gun | **Blaster** | Fire with LMB; hold RMB to **lock-on** up to 8 | always mounted; 3 energy a lock |
| sondelass | the hook | **Grapple** | Pulls loot in, yanks boarders off | 16 m; cooldown 1.5 s |
| soulbrush | the wake brush | **Absorb spray** | Sprays a cone that eats shots of your colour | 50°, 9 m; 4 energy |
| crucibelle | the toll | **Bomb** | Clears every shot around you | 10 m (14 on the beat); ×3 a crossing |
| lockheart | the gulp | **Vacuum** | Sucks in shots and small fish; refills energy | 35°, 8 m; cooldown 6 s |
| veritome | the plate | **Snapshot** | Opens weak points for a few seconds | 6 energy; cooldown 6 s |
| dreamvane | the vane | **Radar** | Warns you of attacks earlier | passive |

The pier's mount panel, redrawn from section 4:

```
CHOOSE 2 MOUNTS                                    sloop: 2 slots
 [1] GRAPPLE        Pulls loot in, yanks boarders off    16 m · 1.5 s
 [2] ABSORB SPRAY   Sprays a cone that eats your colour  50° 9 m · 4 energy
 [ ] BOMB           Clears every shot around you         10 m · x3
 [ ] VACUUM         Sucks in shots, refills energy       35° 8 m · 6 s
 (the moored ship shows the selected mount's cone or ring; holding a card plays its demo)
```

Further tables are filled in as each window is redone. In order of traffic:
1. the pier and the sea chart;
2. the Pneuka Box;
3. the Codex's arts;
4. the garden's place page and the spore beds;
5. the shops;
6. the press;
7. the encounter choices.

The UI audit (`docs/plans/research/UI-AUDIT.md`) lists each page's rows with a jargon score. The 15 worst go first.

## 10. Where the words live

Every data table that the player chooses from carries four fields:
- `name`: the label;
- `does`: the card line, verb first, at most 8 words;
- `lore`: the world's name;
- `detail`: the full text.

A window shows `name` and `does`, and puts `detail` behind a hover. It never shows a raw code word (`it.kind`, a branch's `adds`) or a
file path.

**Done first (2026-10-08, Dovina's tables):**
- the mounts (`progress/rail/mounts.js`);
- the garden's features (`progress/realm.js FEATURES.does`);
- the spore bed and Myggdrasil pages (`world/garden/mycelium.js`: plain verbs, real minutes, no code words).

## 11. The check

`node scripts/clarity.mjs` (Dovina's; joins `npm run check` once it passes on main). It reads the tables above and fails on:
- a card line over 8 words, or a detail line over 25;
- a reading grade over 6 on a card line;
- a word from the glossary's world section in a label or a card line;
- a number without a unit;
- a duration in bars or game hours;
- a choosable thing with no `name` and `does`.

## 12. Rollout

1. **This round:**
   - this spec, and the first tables rewritten (section 10): Dovina;
   - the card component, replacing the row template, with icons for the keywords and the mounts: Calissa's look, Petra's
     `indexmenu.js`;
   - the words settled: Espada.
2. **Next:**
   - the pier and the sea chart redone as cards, with the world preview (Petra and Calissa);
   - `scripts/clarity.mjs` joins the gate.
3. **Then:** each window in the traffic order of section 9, one a round. A window is done when it passes the check and the owner
   reads it cold.
