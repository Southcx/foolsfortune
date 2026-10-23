# The Pneuka Box, made over for main and sub (Dovina's brief, 2026-10-23)

The owner's ask (2026-10-23):

> "We should be able to free up some keybinds too now that the Courier can only equip a main and sub tool. In light of that, the
> Pneuka Box probably needs an overhaul both visually and functionally. Coordinate with Calissa and Petra to make mockups of potential
> inventory/Pneuka Box systems that suit our new needs, review them for novelty and cohesion of execution, then implement your
> favorite ingame, please! Make sure that you guys are pruning old deprecated elements of the game as things get updates."

The steps: three divisions' mockups, a review, one picked, built, and the old pruned. This file is the brief. The review and the pick
are added below as they happen.

## 1. What changes, and why the Box has to follow

**The rule** (TOOLS-TOGETHER.md 8, ruled 2026-10-22 and 23):
- Two tools are worn: the **main**, in hand with all its verbs, and the **sub**, which lends the main one verb on **R** and one passive.
- The other five wait in the Pneuka Box.
- You swap at a Shrine or at the Pneuka Box, out of a fight (still open: the owner has not ruled where).
- Every pair of tools is one of 21 cards, the Major Arcana I to XXI, and each pair's special is opened by an achievement.

**What the Box is today** (`pneuka/box.js`, `pneuka/ui.js`; OSRS's inventory):
- 56 slots, one thing to a slot, with stackables.
- An equipment pane: the lure on the line, and five places on the body (two on the back, one at each hip, one at the neck) for seven
  tools.
- Fittings by socket: the instrument, the coffin, the keyring of four, the bottle.
- The Book as the bank beside it while the Veritome is held open (J).
- Left click does the obvious thing, right click lists the rest, a hover line says what a click would do.

**What no longer fits:**
- **The five places** (`PLACES`, `HIP_SIDE`, `belt.js`) are the whole of the equipment pane, and they retire. Two sockets replace them.
- **Seven draw keys:** X the psygun, Q the Sondelass, J the Veritome, G the Soul Brush, K the Dreamvane, U the Crucibelle, I the
  Lockheart. With two tools worn, one key draws the main and R is the sub's. Five keys come free.
- **Fittings live in a separate pane** from their tools. With two tools worn, a tool and what is fitted to it should read as one thing:
  the Sondelass with its lure, the Lockheart with its coffin and keyring, the psygun's variant with its loaded shells.
- **Nothing shows the pair.** The arcana card a main and sub make, and its special (open or not yet), is the new thing a loadout means.
- **The rest of the box is still a pocket:** materials, haul, curios, lures, keys, casks, Cogitomaps. The 56 slots and their OSRS
  rules are not in question unless a mockup argues for changing them.

## 2. What every mockup must hold

1. **The loadout:**
   - the main and the sub;
   - the pair's arcana card and its special (open, or how it opens);
   - the sub's R verb and passive in words.
2. **Each worn tool with its fittings, on it:**
   - the psygun: its variant and its chambers' shells;
   - the Sondelass: the lure;
   - the Crucibelle: the instrument;
   - the Lockheart: the coffin and the keyring;
   - the Soul Brush: the Lachrymato Bottle (the bottle sits on the upper back, but the brush is what spends it).
3. **The five tools not worn,** as choices you can see. A swap shows what changes (compare arrows, `ChoiceCard`).
4. **The pocket:** the 56 slots, stacks, the hover line, left click and right click, drag to swap, and drop.
5. **The bank:** the Book beside the box with the Veritome open (store, take out, STORE ALL).
6. **Where a swap is refused:** in a fight, or away from a Shrine or the Box (if the owner rules that). The refusal is said at the point
   of use.
7. **The keys:** what each freed key does now, if anything. A key left empty is better than a key that surprises.
8. **The house rules:**
   - **CLARITY.md:** a genre label, one line of effect, numbers as stats.
   - **OVERLAY.md:** the overlay reads what is, in the System's type and the island's dress (Clay on Anagami); never stock UI.
   - The log narrates.
   - The pixel art is at 1x.

## 3. Dovina's three concepts (the third mockup; the look is placeholder for Calissa's eye)

**A. The spread** (tarot): the loadout as a two-card reading.
- **Main and sub:** two card positions, the main upright and the sub crossed over it, as the Celtic Cross's first two cards lie.
- **The pair's card:** the arcana turns face up in the middle (the Magician for psygun and Sondelass), its special on its face. If not
  yet earned, it shows face down with how it opens.
- **The other five** fan below as a hand of tool cards. Drag one onto a position to swap; compare arrows show what changes.
- **The pocket** is a tray under the spread, 56 slots as now.
- **Prior art:**
  - Persona's arcana (a pairing is a card);
  - Balatro's hand and its jokers in a row;
  - Inscryption's cards on a table;
  - the game's own house deck (Raku's tables) and the Veritome's cards.
- **Cohesion:** the title is Fool's Fortune, the trumps are the pairs, and the Fool, you, is the one reading the spread.

**B. The attaché case** (Resident Evil 4): the pocket as a grid where things take their shapes.
- **Tools and the pocket:** tools are big, a lure one cell, a cask two by two. The main and sub hang in the case's lid, and the five not
  worn take up the case's room, so carrying all seven costs space.
- **Prior art:** Resident Evil 4's case, and Diablo's and Tarkov's grids.
- **Cohesion:** weak against OSRS's one-thing-a-slot rule, which the owner set (2026-10-07: 56 slots). It is here as the honest
  alternative.

**C. The Jar's interior** (spatial, the overlay's way): P doesn't pause into a page. The world slows, and the box opens round the
Courier as a System window in the air.
- **Main and sub:** in the two hands.
- **The other five:** orbit at the waist.
- **The pocket:** a ring of slots at eye height, turned by the wheel.
- **Prior art:**
  - Dead Space's in-world inventory;
  - Log Horizon's spatial menus;
  - the isekai status window;
  - Kingdom Hearts' command deck.
- **Cohesion:** it is OVERLAY.md's own law, but 56 slots in a ring is a lot to read. The pocket may need to stay a flat tray.

## 4. The asks

- **Calissa (the look):** your own mockup or mockups, as pictures or a page, in the Clay dress. Your read of A, B and C: which one look
  is it, and where would you push it?
- **Petra (the function):**
  - Your own mockup or functional sketch: the belt as main and sub, what the Box's code becomes, and the keys.
  - **The keys:** which of the five freed draw keys (J, G, K, U, I) can go, and what draws the main.
  - The cost of each concept at the gate.
- **Dovina:** the three concepts above as a page for the owner; the review (section 5); and the build of the pick.
  - The rules side is mine: the loadout's data, the pair's card and its special's state, and the swap rule.
  - The parts in your files I build with your yes, on your terms, as with K1.

## 5. The review

**Petra's answer** (2026-10-23, her handoff `2026-10-23-from-petra-pneuka-box-function.md`):
- **The function is common to all three concepts** and is most of the work. The belt becomes the loadout: `main`, `sub`,
  `equip(id, as)`, `mayEquip(id)`, `pair`. `isWorn` narrows to "main or sub", so its 34 readers keep working. The five tools not worn leave
  the 56 slots for the loadout's shelf. `kit` goes to version 2.
- **Her verdicts:** A is the cheapest (DOM, choice cards, and the Major Arcana faces already in `bazaarAtlas`). B is a no (it breaks the
  56 slots). C is the most novel but the dearest (new programs, world-space picking, a fight going on round the window).
- **Her lean:** A's spread and tray, with one thing from C: the Courier holds the main and the sub up in the world beside the page.
- **Keys:** R can't be "tap for the sub, hold for the main": Gulp is a parry and can't wait for the key to come up. So the mains' own R
  moves leave R.

**Ruled (Dovina, 2026-10-23):**
- **The quick taps** go to MMB while the psygun is the main (MMB is free for the psygun).
- **The Dreamquake** goes to the pick's charged LMB.
- **The Tidecutter** retires into RMB's specials.
- **The swap rule** is `swapRefusal(game)` in `progress/toolpairs.js`; the belt's `mayEquip` asks it. Change tools anywhere the Box opens,
  except in a fight, a puzzle duel, at sea, mid-race or at one of Raku's tables. The log says why at the point of use.

**Who builds what:**
- **Petra:** the belt, the keys out of the tools, each tool's `lend()` (with Calissa's gesture clips), the Box's data and save, the
  Shrine's THE BANK row, and the pruning in her files.
- **Dovina:** `pneuka/ui.js` and `pneuka/loadout.js` (the window), `toolpairs.js`, the swap rule and the specials' state.
- **Calissa:** the look of the window.

**Judged on two things the owner named:**
- **Novelty:** has a game done this, and do we add something?
- **Cohesion of execution:** one look, the house rules, the overlay's law, and what it costs at the gate.

The pick waits for Calissa's mockup.

## 6. The keys today, and what main and sub free (the audit, 2026-10-23)

A read-only audit of every key the Courier binds on foot.
- **The seven draw keys** each draw one tool, and each tool reads its own: X the psygun, Q the Sondelass, G the Soul Brush, J the
  Veritome, K the Dreamvane, U the Crucibelle, I the Lockheart.
- **X also stows** any tool in hand, a rule written out again in four tool files.
- **Five things exist only because five tools are worn at once:**
  - the seven keys;
  - X as the universal stow;
  - the psygun's `deadInput` filter, which blanks its keys while another tool is out;
  - `PLACES` and `BELT_SIZE`;
  - wearing by click in the Box.
- **R is taken three times:** the psygun's quick taps (`gunmoves.js:53`), the cutlass's Tidecutter (`cutlass.js:104`, already
  superseded by RMB's specials) and the Dreamvane pick's Dreamquake (`pick.js:59`).
- **The numbers and the wheel** belong to whichever tool is out: chambers, forms, notes, the lens, the dowse, the keyring.

**Dovina's proposal (for Petra's sketch to correct):**
- **One key draws and stows the main:** X, as the psygun's and the universal stow are today.
- **R is the sub's verb.** Each main's own R move moves to R held: the quick taps and the Dreamquake. The Tidecutter retires into
  RMB's specials, which already hold it.
- **Q, G, J, K, U and I come free.** None is given a new job this round; an empty key is better than a surprising one.
- **The bank:** today it opens with the Veritome held open (J). With the Veritome often not worn, the Book opens at a Shrine as the bank
  instead (Breath of the Wild's and OSRS's bank is a place). With the Veritome worn as main, its open still works.

## 7. Pruning (the owner: "make sure that you guys are pruning old depreciated elements")

The audit's findings, sent to their owners (docs/handoffs):

| what | where | live? | the call |
|---|---|---|---|
| the old DOM charge ring `#charge` | `index.html:86`, `feedback/hud.js:44` | yes, on every psygun charge | retire it; the four variants without a charge readout (THE PSYGUN, Bombardier, Pentagun, Pepperbox) get one in their own reticle (Calissa), as the Carbine's full draw has |
| the DOM reload bar `#reloadbar` | `index.html:87`, `hud.js:50` | yes | retire it: the cylinder's reload beats own the reload |
| dead `Hud.update` parameters | `hud.js:33`, `main.js:1424` | dead data | remove |
| dead `hud.el.cross` guards | `godhand.js:178,202,223`, `realm.js:180,218`, `skiff.js:200,212` | no-ops | remove |
| dead `#crosshair`, `#course` selectors; the empty `#locks` div | `vfx/cinema.js:24`, `world/emocean/stage.js:83`, `index.html:88` | match nothing | remove |
| `rules.digits` on the belt's tools | `tools/belt.js:106,145-186` | read by nothing | remove (it retires with the belt anyway) |
| stale comments: the "tool strip", "string row", "Lachrimeter panel" | `main.js:1096`, `vfx/hudring.js:3`, `feedback/wheel.js:12` | comments | correct |
| the pot-smash trial's DOM text panel `#trial` | `index.html:89`, `world/trial.js:49` | yes | a timer and medal panel CLAUDE.md bans; its count already moved to `CountRings`: the rest goes the same way |
| the Lachryma ring at the feet (`HudRing`) and the Lachrimeter tube both showing the pool | `main.js:625` | yes, by plan (OVERLAY.md: "the battle ring, kept") | not a leftover; a question for the owner (two readouts of one number is the house rule, so likely kept) |
