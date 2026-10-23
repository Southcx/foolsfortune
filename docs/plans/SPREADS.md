# Spreads: the Pneuka Box's underside (a plan)

The owner's idea, 2026-10-23: the inventory as a tarot deck. The Box keeps its 56 cells, one item to a cell. Underneath it lies a
spread board. Flip the Box over, lay Major Arcana into a spread's positions, flip it back, and the cells their footprints cover glow.
An item sitting on a glowing cell of its own suit is empowered. This is Resident Evil 4's attaché case turned inside out: the shapes
are fields of power laid under the items, never outlines the items must be fitted into.

Dovina's plan. Status: a plan, not built. Mockup: the design canvas, board "Spreads" (https://claude.ai/artifact/8CXoxSFSLmatRDrPDQVTuZ).

## 1. The owner's rulings (2026-10-23)

1. **The Veritome is observation and reprogramming only.** It stops being storage. The card collections go to the Codex, the stored
   items to the Pneuka Box (section 6).
2. **A Major Arcana card is bound in two ways:** its photograph (its sitting, `tools/veritome/arcana.js`), or another achievement.
3. **A pair's special opens with its card bound AND an achievement done with that pair worn.** R's lent verb is not gated: it works
   for any sub from the moment it is worn.
4. **Spreads hand out power.**
5. **Items take one of the four suits** (Wands, Cups, Swords, Pentacles). No eastern five elements: card suits, for simplicity and
   theme.
6. **The planet cards are wild cards** (section 3).
7. A tool swap is allowed anywhere out of a fight (TOOLS-TOGETHER.md 8). Laying a spread follows the same rule.
8. **Build it** (the owner, later the same day: "I wholeheartedly support your assessments and implementation"). With it, the open
   calls of section 9 as proposed: the bracelet's charms become suited items, and the flip mirrors.
9. **The reading view** (the owner: "the character model orbited by cards against a dark background, similar to the title screen
   ... that screen is a moneyshot in and of itself"): section 5.7.

## 2. The deck is already whole

- The Pneuka Box's **56 cells** are the 56 Minor Arcana (four suits of fourteen). The owner chose 56 before the pairs existed.
- The **21 pairs** are the Major Arcana I to XXI, and **the Fool (0) is you**: 22 Major Arcana.
- 56 + 22 = 78, a full tarot deck. The Box holds the minors and the Codex holds the majors.
- The five divisions are already suits: Petra pentacles, Wanda wands, Calissa cups, Espada swords, Dovina the trumps.

## 3. A Major's suit: the Golden Dawn's attributions

Each Major Arcana card has a letter of the Hebrew alphabet, and through it a sign, a planet or an element (the Hermetic Order of the
Golden Dawn, *Book T*, the 1880s; Rider-Waite numbering, so Strength is VIII and Justice XI, as our pairs already are). This is real
tarot, and the board teaches it by use.

| suit | element | the cards (their sign or element) |
| --- | --- | --- |
| Wands | Fire | IV The Emperor (Aries), VIII Strength (Leo), XIV Temperance (Sagittarius), XX Judgement (Fire) |
| Cups | Water | VII The Chariot (Cancer), XIII Death (Scorpio), XVIII The Moon (Pisces), XII The Hanged Man (Water) |
| Swords | Air | VI The Lovers (Gemini), XI Justice (Libra), XVII The Star (Aquarius) |
| Pentacles | Earth | V The Hierophant (Taurus), IX The Hermit (Virgo), XV The Devil (Capricorn), XXI The World (Earth, its second attribution) |
| wild | a planet | I The Magician (Mercury), II The High Priestess (Moon), III The Empress (Venus), X The Wheel of Fortune (Jupiter), XVI The Tower (Mars), XIX The Sun (Sun) |

- The 21 laid by hand: four Wands, four Cups, three Swords, four Pentacles, six wild. The World's planet is Saturn; the Golden Dawn
  also gives it Earth, which brings Pentacles to four. Swords' fourth would be the Fool (Air), and the Fool is not laid by hand.
- **The Fool is you** (its element is Air), so its card is not laid by hand: it lies at the board's heart in the Celtic Cross as the significator, a
  one-cell wild footprint (the Joker descends from the Fool). It is bound from the start. The Fool is Air, so the Courier is Swords'
  missing fourth (Espada).
- **A wild card** (a planet) empowers an item of any suit, at 0.75 of a suited card's strength. The reason: "planet" is Greek
  *planētēs*, the wanderer, named for moving through every sign in turn; and a footprint that fits everything must pay for it. The
  board's tip (Espada's): "A planet: it wanders through every sign, so it lights every suit, a little less brightly."

## 4. Friendly and contrary suits: the elemental dignities

The Golden Dawn read two cards side by side by their elements: "Swords are inimical to Pentacles; Wands are inimical to Cups."
Every other pair is friendly. The board uses exactly that, and it agrees with what the game already does with feelings (opposites
cancel, `AGATES`).

- **Contrary:** Wands and Cups (fire, water); Swords and Pentacles (air, earth). Where two contrary footprints cover one cell, the
  cell goes dark: it empowers nothing, and it shows a crack.
- **Friendly:** every other pair. The cell carries both suits, and an item of either counts.
- **The same suit twice:** the cell counts double (never more than double).
- **Wild** over anything: never cancels; it adds its 0.75.

## 5. The spread board

### 5.1 The flip

- The Pneuka Box's window gains a FLIP (the button, and a key: Petra's call). The pocket turns over and shows its underside: the
  same 8 by 7 grid as a cloth, the spread's positions marked on it, and your bound Majors as a hand.
- **A flip mirrors the grid,** as a real board turned over does: a footprint laid on the underside's left lights the face's right.
  The underside shows the face's items faintly through the cloth, mirrored, so you can aim. (My lean: it is the owner's flip, and
  it makes the board a small spatial puzzle. The owner may veto it, and then the two sides share columns.)
- Laying: drag a Major from the hand to a position; right-click (or R) on a laid card reverses it (5.3). A card is in one position
  at a time.

### 5.1.1 The reading view (the owner's moneyshot)

The flip opens the reading: the Box's window falls away, the world goes to the title's dark, and the Courier hangs in it as they do
in the title's fall (`title/scene.js`: "they hang in the fall, cards turning round them"), the laid Majors orbiting them in the
spread's shape. It is the title's best moment, given back as a place you return to.

- **The cards orbit in the spread's own geometry,** seen from the front: the Celtic Cross's cross at the Courier's heart (the
  Present over the significator, the Challenge across them, the Crown above the head, the Foundation below the feet, the Past and
  the Near future either side) and its staff as a column beside them; the Horseshoe as an arc round them; three cards in a row
  before them. Each card turns slowly in place, its face to the camera; a reversed card hangs upside down.
- **The grid is the cloth under the Courier's feet:** the 8 by 7 cells as a floor of the dark, each footprint lit on it in its
  suit's colour, so laying a card shows at once where its light falls (the mirror is the cloth seen from above, the face from below).
- **The hand** fans at the bottom of the view: the bound Majors not laid. Drag one up into an empty place in the orbit; right-click
  a laid one to reverse it; drag it out to take it back.
- **The flip back** turns the camera down through the cloth to the Box's face, the pocket lit from beneath.
- Prior art: our own title (the fall); Persona's Velvet Room (a reading in a room outside the world); Kingdom Hearts' Dive to the
  Heart (a figure in the dark on a stained-glass floor); the Golden Dawn's diagram of the Celtic Cross.
- It is drawn by the game's renderer, the Courier's own model and clips, the post as everywhere (the 480 lines, the glow, the grade).
  Calissa's look, Petra's camera and scene; the rules it draws are `progress/spreads.js`.

### 5.2 A card's footprint

- Each Major has one footprint: a shape of cells drawn from its emblem (the Tower a column, Justice a balance beam, the Wheel a ring).
  The shapes are Dovina's data (`FOOTPRINTS`); Calissa judges them as looks.
- **Its size is its card rank:** C 3 cells, B 4, A 5, S 6, SS 7 (the World). The ranks are already set (`arcana.js`): a card that is
  harder to bind covers more.
- A position sets where the footprint lands (its anchor cell) and how it turns. A footprint past the grid's edge is cut off.

### 5.3 Reversed

- A card laid upside down: its footprint turns 180 degrees, and its suit becomes its contrary (Wands and Cups trade, Swords and
  Pentacles trade). A planet stays wild.
- Said plainly: the turn is tradition (a reversed card is read upside down); the suit's swap is **our rule**, built on the dignities.
  In tradition a reversed card's meaning is blocked or turned inward, and the swap is the closest a mechanic gets to that.
- Reversing is how one card serves two suits: the Emperor reversed lights Cups.

### 5.4 The spreads and their positions

A position's rule is its meaning made a mechanic (the design law: the mechanic is the lesson). Strength is a multiplier on the cells
its footprint lights.

**The one card** (from the start): the Present only, and its card is **your pair's card**, laid by the belt itself. Change your pair
and the Present's footprint changes with it. It counts only once that pair's card is bound.

**The three-card spread** (Past, Present, Future):

| position | rule |
| --- | --- |
| Past | fades from 1 to 0.5 over the game day after it is laid |
| Present | your pair's card; 1 |
| Future | grows from 0.5 to 1 over the game day after it is laid |

Past and Future always sum to 1.5, so a stale spread is never punished: re-laying only moves the weight. No daily chore.

**The Horseshoe** (seven):

| position | rule |
| --- | --- |
| Past | fades 1 to 0.5 over a game day |
| Present | your pair's card; 1 |
| Hidden influences | its footprint is not drawn on the face; a cell shows only once an item counts there |
| Obstacles | laid crossed (turned 90 degrees); counts only in a fight (`combat.engaged`) |
| Others | 1 with a sibling or a guest in your party, 0.5 alone |
| Advice | 1; while you hold an item, the cells where it would count are marked |
| Outcome | 1.5, and lights only once the other six are laid |

**The Celtic Cross** (ten, the significator under them):

| position | rule |
| --- | --- |
| Present | your pair's card; 1; it covers the Fool |
| Challenge | laid across the Present (turned 90 degrees); counts only in a fight. Tarot's other name for the crossing card: "the crossing" is the rail's |
| Foundation | 0.5, and it never fades: the root |
| Recent past | fades 1 to 0.5 over a game day |
| Crown | 0.5, plus 0.5 times the share of the game day's goals done (`game.goals`) |
| Near future | grows 0.5 to 1 over a game day |
| Self | 1 while the pool is at half or more, 0.5 below |
| Environment | 1 with a sibling or a guest in your party, 0.5 alone |
| Hopes and fears | counts its suit and its contrary, each at 0.5, and never cancels |
| Outcome | 1.5, and lights only once the other nine are laid |

"The Crown" is qualified in docs and code as **the Crown position** (`crownPosition`): "the crown" is the Great Slip Jelly's urn.
On the board its label alone is clear.

### 5.5 Opened by achievement (arts only by achievement)

| spread | the count way | the feat way |
| --- | --- | --- |
| one card | from the start | — |
| three-card | 3 Majors bound | a sitting photographed at three stars |
| Horseshoe | 7 Majors bound | a clean three-card: every lit cell holding an item that counts |
| Celtic Cross | 12 Majors bound | a Horseshoe with no dark cell and twelve cells counting |

Drafts: the achievements' names and tiers come with the build.

### 5.6 The Majors' second ways (ruling 2; the acts are Espada's, the predicates mine)

Each Major is bound by its photograph or by this act: the card's meaning done. A predicate with no counter yet swaps the act and
keeps the meaning.

| card | its sitting's riddle | the second way |
| --- | --- | --- |
| 0 The Fool | one who has leapt | bound from the start: the Fool is you |
| I The Magician | a broken thing made whole | use all seven tools within one real minute |
| II The High Priestess | deep water that keeps its secrets | gloss 10 neuralese words |
| III The Empress | what grows where nothing should | a planetoid of the Spirit Garden in bloom |
| IV The Emperor | a treasury, closed and kept | 20 orders carried out by your siblings |
| V The Hierophant | the bell that calls the faithful | 5 Movement Arts learned from the System |
| VI The Lovers | two of a kind in one frame | feel an agate |
| VII The Chariot | a vessel that rides the wind | win a race at the Raceway |
| VIII Strength | a weight that should not be lifted | calm a creature at its most agitated, without a blow |
| IX The Hermit | a light kept alone | reach the Great Dunemaw's last floor with no one in your party |
| X Wheel of Fortune | a wheel that turns of itself | the Lockheart's wheel lands on a jackpot |
| XI Justice | where every catch is counted | turn in a bounty |
| XII The Hanged Man | one who hangs by a cord | a game hour spent as the god hand |
| XIII Death | a thing in its ending | release a spirit from your garden (a farewell, never a death) |
| XIV Temperance | water poured between vessels | a true firing at the press |
| XV The Devil | one who hoards more than it can carry | your pool overflows 10 times |
| XVI The Tower | the tallest thing, from its foot | burst the Great Slip Jelly's crown |
| XVII The Star | nothing but the open sky | a fix on the open sea by reading the sky |
| XVIII The Moon | a reflection in the oasis | creatures strike your mirage 3 times |
| XIX The Sun | the sun itself, in the Dunes | awaken to Mirth |
| XX Judgement | where something broke | win a puzzle duel and mend its Figment |
| XXI The World | five kinds of thing in a frame | awaken to all seven feelings |

## 6. Where the cards go (ruling 1)

- **The Veritome** keeps: the lens, the plates, the darkroom's appraisal, tags and familiarity, the bestiary's reading, reprogramming.
  A plate appraised still earns its card; the card is bound in the Codex, not kept in the book.
- **The Codex** takes the collections: a shelf THE ARCANA (the 22, face down until bound, each with its sitting's riddle and its
  second way) and the creature cards with the bestiary.
- **The Pneuka Box** takes the items: a curio that was stored as a card is an item in a cell. The bank (the Book's free slots) becomes
  **the Box's storage**, opened at a Shrine, as the Spirit Garden's shed keeps its storage.
- **One copy each.** A Major or a creature card is bound once. A second photograph of a sitting already bound condenses into cubes,
  as a spare does today (`ECON.condense`). The card limits above 1 go.
- **Goes, once this lands:** the Book as the bank (`FREE_SLOTS`, `book.js`'s storing), the reading table's Book pane (`rt-book`),
  the Veritome's pages as an inventory. The glossary's Veritome entry is rewritten in the same commit.

## 7. What an empowered item does: the suits' tallies

An item counts when it sits on a lit cell whose suits include its own (or a wild one). Each counting cell adds its strength to its
suit's tally. **A stack counts once:** the cell counts, not the items in it, so hoarding a stack of 99 earns nothing over one.

Each suit's tally is a modifier with a source you can see (the board), never a base change. Draft numbers, one point of tally each,
capped at 10 points:

| suit | its meaning | what its tally does | per point | cap |
| --- | --- | --- | --- | --- |
| Wands | will, action | the tools' Lachryma costs | −1.5% | −15% |
| Cups | feeling | the pool's regen and the Bottles' feed | +2% | +20% |
| Swords | thought, conflict | the status your blows build (doubt, charm, blind, confusion) | +2% | +20% |
| Pentacles | matter, money | worth when sold or condensed | +1.5% | +15% |

- **Why a tally and not an effect per item:** an effect per item is a content tax on every item in the game. A suit's tally makes
  every item matter by where it sits, at no cost per item. Items may gain their own held effects later (the bracelet's charms, 9.1).
- **Measured** (`node scripts/spreads.mjs`, 2000 lays a spread, seed 7: Majors drawn at random as many as open the spread, a quarter
  reversed; "careful" fills every lit cell with an item of its best suit, "careless" drops 40 items in pickup order), the median and
  90th percentile of a suit's points:

  | spread | cells lit (of 56) | careful | careless |
  | --- | --- | --- | --- |
  | One card | 4 | 0 / 4 | 0 / 1 |
  | Three cards | 13 | 2 / 6 | 0.8 / 2 |
  | The Horseshoe | 24 | 5.5 / 10 | 1.7 / 4 |
  | The Celtic Cross | 31 | 6.5 / 10 | 2.3 / 4.6 |

  Placing with care is worth about three times placing at random: skill skips grind, and the careless still earn (the design law).
  The cap of 10 is reached only by a careful Horseshoe or Cross, at its best tenth, or by a spread laid for one suit. Contrary cells
  are rare (median 0, 3 at the 90th percentile), so they read as a choice made, not a tax. The numbers stand as drafted.
- **The economy:** Pentacles lifts worth when sold **and when condensed**. `scripts/economy.mjs` now prints its upper bound, as if a
  profile's whole income were sold or condensed: at the cap (x1.15) the fighter makes 699 cubes a real hour (1.46 x the aim), the
  miner 693 (1.44), the treasury 674 (1.40), the angler 546 (1.14), the photographer 494 (1.03). Every livelihood stays under the
  1.5x cap even so; the true lift is smaller, since no profile sells all it earns.
- **Two avenues** (CLAUDE.md): the board's glow and the four tallies on the Box's window; and the log, **only on what you do**
  (Petra's catch: the Past, the Future, the Crown position and four more move by themselves, so a line a change would spam it).
  Flipping back after a change says the new tallies once ("Your spread lights six Wands and three Cups."). `spread.tally` fires on
  the same acts, one a suit that changed, `{ suit, from, to, spread, sums, dark, by }`: the board's state rides with it for the
  achievements. A tally that drifts with the clock is read when it is used, never announced.
- **The Fool's cell is named** (an 8-wide grid has no middle column): underside column 2, row 3; on the face column 5, row 3
  (`FOOL_CELL`).
- **The window keeps 8 by 7 at every width;** it scales down whole (`fit()`), never re-flows to 4 across.

### 7.1 An item's suit, by kind

| suit | the kinds (`items.js`) | why |
| --- | --- | --- |
| Wands | instrument, crude (a cask), psygun (a variant carried), shell | fire: what is struck, burned or fired |
| Cups | bottle, fish, lure, heart (the Lockheart's coffin) | water and feeling: what holds or lives in it |
| Swords | key (a Possibilikey), whistle, rutter (a route map) | air and thought: what cuts, opens or plans |
| Pentacles | material, curio, map (a Cogitomap) | earth and matter: what is mined, found or charted |

**A tool carried** (kind `tool`) takes its tool's suit: the psygun and the Crucibelle Wands (fired, struck); the Sondelass and the
Veritome Swords (the blade, the eye that sees through); the Soul Brush and the Lockheart Cups (liquid Lachryma, a heart); the
Dreamvane Pentacles (the pick and the dowse).

Checked by Espada, 2026-10-23 (the shell moved to Wands, the tool kind added). A new kind takes a suit in the same commit. The
playing-card suits descend from these: hearts from Cups, spades from Swords, clubs from Wands, diamonds from Pentacles.

## 8. Prior art, and what was taken

- **Resident Evil 4's attaché case:** the grid you manage, inverted (the shapes are power, the items one cell each).
- **Backpack Battles, Backpack Hero:** where an item sits in the bag decides what it does.
- **Diablo II's charms:** power from being carried.
- **Cultist Simulator:** an inventory that is cards laid on a table.
- **FFXIV's Astrologian:** cards drawn as buffs, matched to a suit-like seal.
- **Persona:** the Major Arcana as bonds; our pairs.
- **The Golden Dawn's Book T:** the attributions (section 3) and the elemental dignities (section 4).
- **Lights Out, a flip book:** the pattern seen from the other side.

## 9. Open

1. ~~The bracelet's charms~~ ruled (1.8): a charm becomes a suited item (`item.suit`), its power from where it sits; BRACELET.md's
   sockets give way to the board when the charms are built.
2. ~~The mirrored flip~~ ruled (1.8): it mirrors (`MIRROR`).
3. **The second way for each Major:** the acts are drafted (5.6); the predicates come with the build.

## 10. Who builds what

- **Dovina:** `progress/spreads.js` (built: the rules, `SPREADS`, `POSITIONS`, `FOOTPRINTS`, `SUIT_OF`, the dignities, `light()`, `tally()`),
  the achievements, the numbers and their measurement, the window's flip side (built: `pneuka/reading.js`, the window's hand on
  Petra's `game.laidSpread` (the gate, the refusal; no state of its own); `pneuka/underside.js`, the flip side's page; the pocket's glow; F flips; `tracking/spreads.js`; the lend's Spreads row), a sweep.
- **Petra:** the Veritome's storage moved (`tools/veritome/cards.js`, `book.js`) into the Codex and the Box, the Box's storage at a
  Shrine, the flip's key, the save (a section for the spread laid), the events, with `by` (`spread.flip { under }`, `spread.lay { card, position, reversed }`,
  `spread.tally { suit, from, to }`, `spread.crack { suit }` for a cell cracked dark, `spread.complete` for the Outcome lit; Wanda's
  sounds hang on all five, 7c7d8ca9), the tallies' hooks into the tools' costs, the pool's regen, status build-up and worth.
- **Calissa:** the board's look: the underside's cloth, a card laid, upright and reversed, the glow by suit, the dark cell's crack,
  the wild cell's film, the flip itself.
- **Espada:** the words (the positions keep tarot's own names: they are the genre's words), the suits by kind, the Majors' second
  ways, the wild card's line.
- **Wanda:** the flip, a card laid, a card reversed, a cell lighting, a contrary cell cracking, a spread completed.

**Order:** 1, the rules and a coverage simulation (Dovina); 2, the storage move (Petra); 3, the board in the window (Dovina, Calissa's
look); 4, the tallies wired and measured; 5, the achievements.
