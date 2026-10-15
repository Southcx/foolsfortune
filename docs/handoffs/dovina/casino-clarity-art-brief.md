# Raku's tables, readable: Calissa's brief for the casino clarity pass

Calissa (Art), 2026-10-15. This is a draft for the round. It is drawn from the current-drawing audit, the games digest and the
prior-art notes. I ran nothing and measured nothing, so every size below is a starting number for one look, not a tuned one.

The owner's terms, taken as law for this pass:
- A nine-year-old works out any game in two minutes.
- The Lachryma labradorite is used all-out: `schillerInk` and the oil film (`src/vfx/oxidation.js`: `FILM`, `SCHILLER`, `featTint`).
- **Words and numbers MAY show at Raku's tables.** This is the owner's exception to the no-text rule, and it covers rolling numbers
  and reels too. The log still gets every outcome as an event.
- Every element is readily identifiable, colour-coded, and sized by how much it matters to the mechanics.
- Eight seat colours (Red, Yellow, Green, Blue, Purple, Pink, Black, White) go on rims, tokens and plates.
- The models are Slay the Spire, Balatro, Monster Train and poker clients.
- Every game has a skippable, replayable how-to with a spotlight.
- The card and dice texture budget may grow.

Dovina owns the coach module, which is the rules side. Everything here *draws* what the coach says and decides no rule.
**`grep -i coach` finds nothing in `src` yet**, so the coach shapes this brief assumes are listed in section 7 as questions.

---

## 1. The one look

**"The Gold Saucer's felt, lit from under by Lachryma."** Each table is dark lacquered felt, close to the schiller's own ink
(#17111f), so anything lit stands off it like a jewel on velvet. The language has three layers, and each has one job:

| Layer | Its job |
| --- | --- |
| **The oil film** (violet, teal, gold, magenta, walking) | It means only "**now / you can / it matters**". The acting seat's ring, a legal piece's rim, and the score ceremony's numbers all flash it. If a thing does not move in the film, you cannot touch it this instant. |
| **Seat colour** (eight, each with its own shape) | It means only "**whose**". Rims, tokens and plates carry it. |
| **Glazed ivory type** (big, plain, Balatro-fat numerals) | It **says the number**. The type sits on lacquer plates that hover over the cloth's edge, never on the felt itself, so the felt stays a place and the plates read as the game's ledger. |

Out-of-play things fall back into the felt: dimmed, desaturated, sunk 1 cm. The poker client's fold-dim is the model.

The table's one loud moment is the score ceremony. Numbers roll, each step pops in its order, and the film floods the plate.

I'd love to push the film onto the whole cloth's sigil during a ceremony, so the felt itself catches the light. I'd pull it back to
the plate alone if the owner finds it busy at 480 lines.

---

## 2. Shared table chrome: the modules

**Where the text goes.** All words and numbers are drawn in a **DOM layer anchored to table-frame points**: HTML projected over
the canvas, in a full-screen container with `pointer-events: none` except on the buttons. Two reasons:

- It renders at the screen's own resolution, so it stays crisp above the 480-line scene, and it costs **0 new programs**.
- CSS already gives us rolling digits, reels and shake for free.

Glyph-shaped world marks (rims, rings, tokens) stay in the existing `PieceBatch`.

**Size tiers** are used by every table below. The CSS px are at 1080p; the HUD scales with the viewport height.

| Tier | Type | Piece scale | Use |
| --- | --- | --- | --- |
| **XL** | 56px numerals | 1.25x of today's `PIECE` | The goal number, your score, the thing you are deciding on |
| **L** | 34px | 1.0x | Seat stats, the button amounts, the pot |
| **M** | 20px | 0.8x | Labels, secondary counters |
| **S** | 14px | 0.6x | Rule hints, tooltips' body |

### 2a. The seat look: `src/vfx/seatlook.js` (new)

`SEAT_LOOK[colour] = { hex, rim, shape, pattern, ink }`. It also exports `seatCell(colour, kind)` for the atlas cells
(`'rim' | 'token' | 'plate'`). Which seat gets which colour is Dovina's data. What each colour *looks like* is here.

| Colour | Hex | Shape | Pattern | Its outline on the felt |
| --- | --- | --- | --- | --- |
| Red | #D55E00 | circle | solid | none |
| Yellow | #F0E442 | triangle | horizontal stripes | dark keyline |
| Green | #009E73 | square | dots | none |
| Blue | #0072B2 | diamond | vertical stripes | none |
| Purple | #7B4FA6 | hexagon | checks | none |
| Pink | #CC79A7 | star | diagonal stripes | none |
| Black | #1A1A1A | cross | solid | pale rim, 2px |
| White | #F2F2F2 | ring (hollow) | none | dark keyline |

**Seat Red and seat Blue against Raku's chips.** These clash with the 5 (cinnabar) and 25 (lapis) chips. The fix is that a seat
colour *always* travels with its shape, and a chip is always a round disk with its denomination printed. A seat token is never a
round disk: it is its shape, standing up.

**Before locking the hexes,** check them in a colour-vision simulator. Purple and Blue lean on their shape cue to stay apart.

### 2b. The table HUD: `src/ui/tablehud.js` (new)

The anchor layer. Interface:

```js
new TableHud(root)                      // one per seat-down, mounted on enter, removed on leave
hud.anchor(id, tableXYZ, el, {tier})    // place an element at a table-frame point; projected each frame
hud.frame(camera, tableMatrix)          // project every anchor; hide what is behind the camera
hud.shake(power)                        // 0..1: the ceremony's shake, applied to the HUD and passed to the camera frame
hud.clear()
```

It is driven from `BazaarTable.tick` after `layout()`. It owns the CSS for the plates: lacquer, ivory type, and the film border,
which is a `conic-gradient` of `FILM` walking at `SCHILLER.rate`.

### 2c. The seat plate: `src/ui/seatplate.js` (new)

This is a poker client's seat: name, colour shape, and the seat's numbers.

```js
seatPlate({ seat, colour, name, stats:[{label, value, tier, kind}], state }) -> el
plate.set({ stats, state })             // state: 'idle' | 'acting' | 'out' | 'winner'
```

| state | What it looks like |
| --- | --- |
| `acting` | The film border walks, the plate is 1.1x, and the turn ring is lit on the cloth (2d) |
| `out` | 40% opacity, greyscale, sunk |
| `winner` | Gold fill and the ceremony's flood |

The stats come straight from the coach's seat numbers. The plate draws them and never computes them.

### 2d. World marks on the cloth: `src/vfx/tablemarks.js` (new)

These marks carry no words. They are added to the layout list as extra pieces, in the same `PieceBatch` and its existing three
slots, so they need **no new material**.

| Mark | Template | Slot | Read |
| --- | --- | --- | --- |
| **Turn ring** | A flat torus round the acting seat's area, r 0.35 m, in the seat's colour with a film-lit inner edge | lit (2) | Whose turn it is, seen from across the room |
| **Seat rim** | A thin band in the seat colour under every piece a seat owns (its tiles, dice, hand) | glaze (1) | Whose this is |
| **Legal rim** | A film-lit rim, 4 mm proud of the piece | lit (2) | You may click this |
| **Illegal** | No rim; the piece is darkened via an atlas "dim" twin cell | paper (0) | Not now |
| **Chosen** | A lift of 0.06 m (today's) plus a white-gold rim | lit (2) | Picked |
| **Just changed** | A beat of `glow` (today's flag) | lit (2) | Look here |

Interface:

```js
marks(out, { turnSeat, seatColours, legalIds, chosenIds, changedIds, n, r })
```

It appends to the layout list. It reads ids, not rules.

### 2e. The goal bar: `src/ui/goalbar.js` (new)

This is Slay the Spire's energy orb and Balatro's blind target in one: a horizontal bar on a plate at the far edge of the cloth,
with one track per seat in its colour.

```js
goalBar({ label, target, tracks:[{seat, colour, value}], marks:[{at, label}] }) -> el
bar.set(tracks)          // values roll (2g); a jump past a mark flashes the mark
```

The label is XL and plain: "FIRST TO 500", "SHUT ALL 12", "HIT 27 EXACTLY".

### 2f. The action bar and tips: `src/ui/tablebuttons.js`, `src/ui/tabletip.js` (new)

**The action bar** follows the poker rule: the amount is on the button. It is a row of big buttons, anchored at the bottom middle,
with one button for each of the coach's legal moves that has no piece to click (Stand, Lock, Upgrade, Claim N, Call, Fold, Done).

```js
actionBar(moves:[{id, label, line, amount?, preview?, keyword?, suggested?}], onPick) -> el
```

- The label is L ("STAND", "CALL BLUFF"). The amount sits in the button as a chip ("−6").
- `preview` shows above the button on hover as a rolling ghost number ("you'd have 41"). This is Yahtzee's grey score.
- `suggested` gets a slow film breath, never a flash. It is a hint, not a nag.
- Buttons are ChoiceCard's family (`ui/choicecard.js`), sized for a table.

**The tip** is Slay the Spire's side box, on hovering any piece, inert ones included. `pickHover` gains a `pickInfo` path.

```js
tableTip({ label, line, stats:[...], keywords:[...] }) -> el    // the info comes from the coach per piece id
```

Its text is the genre word plus one line, with keywords from `ui/keywords.js`. A game's own keywords are listed in section 7.

### 2g. The score ceremony engine: `src/ui/rollnum.js`, `src/ui/reel.js`, `src/ui/scoreceremony.js` (new)

These are Balatro's timings (Crosley's approximations), taken as the start.

| Part | Interface | Timing |
| --- | --- | --- |
| **Rolling number** | `new RollingNumber(el, {tier, colour}).to(v, {dur})` | Each digit rolls in its own window, 0.4 s with an overshoot ease `cubic-bezier(.34,1.56,.64,1)`, staggered 50 ms left to right. Thousands get thin spaces. |
| **Reel** | `new Reel(el, symbols).spin(stopAt, {dur, stagger})` | A slot-machine reel of symbols (die faces, arcana, tier names). 0.6 s per reel, staggered 150 ms, a 1-frame overshoot on stop. Used where a hidden thing is revealed. |
| **Ceremony** | `ceremony.play(steps, {pieces, hud})` → Promise | Plays the coach's score steps in order (below). Skippable by click: the remaining steps complete at once. |

A step is `{ label, op: 'base'|'+'|'x'|'=', value, kind: 'score'|'mult'|'chips'|'loss', pieceIds }`.

The ceremony's order, the same in every game:

1. **Name it.** The hand or outcome label (L) slams onto the result plate: "TIER 2: ALL RUNS", "EXACT HIT", "SUPERNOVA".
2. **Base.** The base number rolls in, coloured by `kind`.
3. **Each piece.** Each scoring step's pieces pop (a 0.12 s jump, ±3° jitter) and their `+n` flies to the total. The `steps.pitch`
   event rises one step each time; the sound is Wanda's (a placeholder until then).
4. **Each multiplier.** `×n` slams in a red-mult chip, and the total rolls up.
5. **Total.** The total flies to the seat plate along a film trail, and the seat's goal bar rolls.
6. **Shake,** scaled by the result's size against the game's median:

| Result vs median | Shake |
| --- | --- |
| under 1x | 0.2 s, ±2px |
| 1x to 10x | 0.3 s, ±4px |
| over 10x | 0.5 s, ±8px, ±1°, plus the film flooding the cloth's sigil |

Fixed meaning colours. Only these four, and they are never a seat colour's role:

| kind | Colour | Read |
| --- | --- | --- |
| `score` / `chips` | Ivory on lapis-dark plate | What you add |
| `mult` | Cinnabar chip with a white `×` | What multiplies |
| `money` (Raku chips) | Gold | What you win or pay |
| `loss` | Ash grey, crazed (the clay's crack motif) | What you lose (dice, bust) |

Every ceremony also emits its event, and the log gets the line. That rule stands.

---

## 3. Per game

**How to read the tables.** "Importance" is 1 to 4, as in the games digest. "Size" is a tier from 2. "Colour" says which layer.

### 3a. Querent (the tarot game)

The genre word on its plate is "**RUMMY**": "Make 3 groups of 3. First to do it wins the round."

| Element | Imp. | Size | Colour | What it shows |
| --- | --- | --- | --- | --- |
| Your hand | 1 | XL cards (1.25x) | Seat rim under each card; meld groups get a shared tray tint | Your cards. Cards already in a group sit in a little tray together, with a "SET" or "RUN" tag (M). |
| Meld progress | 1 | XL on the goal bar | Film when 1 card away | "GROUPS 2 / 3", plus the cards that would finish you as ghost cards over the bar (from the coach) |
| Draw pile | 1 | L | Legal rim at `acquire` | Labelled "DRAW" (M) on its plate |
| Discard tops | 1 | L | Owner's seat rim; legal rim when stealable | Labelled "STEAL" (M) when legal; a stolen card wears a padlock mark ("can't discard") |
| Action: Fate Clause | 2 | L button | Film when offered | "CALL YOUR WIN", one line: "Lock your hand. Win ×4." |
| Flipped trumps | 2 | M cards, face up beside each seat | Seat rim | Its label and one line in a tip; flipped ones face up for all (see Q in 7) |
| Score so far / round | 2 | L on the seat plate, M | Ivory | "ROUND 2 / 4", each seat's total |
| Seat suit | 3 | M suit glyph on your plate | Suit ink | "BONUS SUIT" |
| Steals left | 3 | M pips on your plate | Ivory pips | 2 pips, emptying as you steal |
| Pot | 3 | M | Gold | Chips plus a number |

**Ceremony at a win.**
1. A reel spins the tier: TIER 1, 2, 3.
2. The base rolls in: 1,000, 2,000 or 8,000.
3. Each bonus pops on its cards: "+1 HALF FLUSH", "+2 PER QUEEN".
4. The x5 and x4 slam.
5. The total flies to the plate.

A Fate Clause call gets a short beat of its own: the hand's rims turn to a padlock chain, and a gold `×4` chip stands over the plate.

Death plays the Reel of all trumps landing on Death, then the cloth's sigil dims and re-lights.

Only the **two biggest bonuses** pop fully. The rest roll as one "+n MORE" step, with the full list in the tip. This is the
digest's call, and it keeps the ceremony short.

### 3b. Zodiac (Shut the Box, as a duel)

The plate reads "**SHUT THE BOX**": "Shut all 12 tiles first."

| Element | Imp. | Size | Colour | What it shows |
| --- | --- | --- | --- | --- |
| Your 12 tiles | 1 | XL (1.25x) numerals | Your seat rim; legal rim on tiles in a legal set; locked ones in gold with an ability icon | Open tiles stand, shut ones lie down. Your selection's running total shows over the row (L): "7 of 8". |
| Their 12 tiles | 1 | L | Their seat rim | The same, and they are attack targets when legal |
| Sealing dice | 1 | XL dice | Ivory | Two numbers on a plate between them: "SUM 8" and "TIMES 15" (L each). The one your selection matches lights. |
| Attack die | 1 | L die | Gold `atkN`, owner's rim | "ATTACK 6" (L) with a sword icon; the die's size as "d8" (M) |
| Goal | 1 | goal bar | Seat colours | "SHUT 9 / 12" per seat |
| Phase | 1 | L on your plate | Film | "SEAL" then "ATTACK" (the step the coach says you are on) |
| Doubles choice | 2 | L buttons | Film | "LOCK", "UPGRADE DIE", "MAKE THEM PAY −n" |
| Pot / purses | 2 | L | Gold | Numbers on plates |
| Lock tokens | 3 | M pips | Your seat token shape | 3 pips |
| Lock abilities | 3 | M icons on locked tiles | Gold | Tip: "Fires when your two dice ADD to 7." |

**Ceremony.**
- A seal: the tiles fall shut in order, with pitch rising.
- A reopen: each tile springs up with a crack of film light.
- A pay: chips fly to the pot as a Reel counts them.
- The last tile shut: the whole row flashes, the pot slides home, and the shake is at the top step.

### 3c. Event Horizon (blackjack with dice)

The plate reads "**HIT THE NUMBER**": "Roll dice. Add up to exactly the target. Go over and you're out."

| Element | Imp. | Size | Colour | What it shows |
| --- | --- | --- | --- | --- |
| Target | 1 | XL plate, mid-table | Film border | "TARGET 27" |
| Your need | 1 | XL on your plate | Film when small | "NEED 9", rolling down as you roll |
| Your sum | 1 | L | Ivory | "HAVE 18". The real faces, not a split (see 7). |
| Your unspent dice | 1 | XL dice | Seat rim; legal rim | Each die shows its range on its plate: "1–8" (M). The selection's range sums over the cup: "ROLL 2–14". |
| The bust line | 1 | On the goal bar | Ash crack beyond the target | Each seat's track, with anything past the target cracked |
| Par | 2 | M on the target plate | Ivory | "DEALER USED 2 DICE" |
| Stand | 2 | L button | Ivory | "STAND" |
| Free reroll | 3 | L button when offered | Film | "REROLL (FREE)" |
| Pot and payoff | 3 | M | Gold | "POT 30", plus three chips in a row: 1x, 3x, 5x |

**Ceremony.**
- An exact hit: the need rolls to 0, a Reel spins the payoff tier to 1x, 3x or 5x, and the dealer's cups lift so their dice show.
  At 5x the dice match yours and pair up with film lines.
- A bust: the sum overshoots on the bar, the track crazes to ash, and your dice sink.

### 3d. Supernova Run (dice that breed)

The plate reads "**DICE ENGINE**": "Roll all your dice. Max face = new die. 1 = die shrinks. First to 500."

| Element | Imp. | Size | Colour | What it shows |
| --- | --- | --- | --- | --- |
| Your hand | 1 | XL dice | Seat rim | Dice sorted by size, with a count on the plate ("8 / 12 DICE", M) |
| Points / goal | 1 | goal bar XL + L on plates | Seat colours, with a film mark at 500 | Each seat's points as numbers, and the double-line ghost: "×2 = 640" if a Supernova hits now |
| Reaction | 1 | XL cup, plus "ROLL ALL" (L button) | Film | The running reaction total rolls live as dice settle |
| Fuse / split | 2 | L ghost dice, mid-table | Legal rim | The result die's size is printed ("d20"), with a tip: "Combine into one die" / "Break into two" |
| Supernova chance | 2 | M on your plate | Gold | "d20s: 1", one star icon per d20 |
| Round | 3 | M | Ivory | "ROUND 3" |

**Ceremony: the reaction is the ceremony.**
- Each max face pops with a "+1 DIE" mark and pitch rising, a chain counter (L) climbs "CHAIN ×6", and settled faces fly their
  `+n` to the total.
- A 1 cracks its die to ash, and a d4 lost slides off.
- **Supernova:** the d20 rises, a Reel stops on 20, the plate's points get a slammed `×2` mult chip and roll double, every hand
  blows out to ash, and new d6s drop back in. The shake is at the top, with the film flooding the cloth.

### 3e. Nebula Bluff (liar's dice)

The plate reads "**LIAR'S DICE**": "Say your dice are worth N. Others call you a liar or back down. Last with dice wins."

| Element | Imp. | Size | Colour | What it shows |
| --- | --- | --- | --- | --- |
| Your worth | 1 | XL on your plate | Ivory, private | "YOUR HAND 49". Max faces each wear "+10" (M). |
| Standing claim | 1 | XL plate, mid-table | The claimant's seat colour plus film | "RAKU SAYS 45+" |
| Dice counts (lives) | 1 | L, as dice-shaped pips per seat | Seat colour; lost dice are ash | "4 DICE" |
| Claim / Call / Fold | 1 | L buttons | Film on suggested | "CLAIM 46 (−5)" with a −/+ stepper, "CALL LIAR (−5)", "FOLD (−1 DIE)" |
| Bluff marker | 1 | On the Claim button | Cinnabar mult-family chip | When your claim is over your worth, the button says "BLUFF" (the preview) |
| Pot / price | 2 | L | Gold | "POT 18" |
| Raises | 3 | M pips | Cinnabar spent, ivory left | "RAISE 2 / 4" |
| Tell | 3 | World mark only (today's riffle) | Claimant's chip | A tip on the purse: "This player's chips are twitching." The meaning is for the player to learn. |

**Ceremony at a call.**
1. The claimant's cups lift.
2. A Reel per die lands its face, and the worth rolls up against the claim, which is drawn as a line on a mini bar.
3. Under the line, "LIAR!" slams in in the caller's colour. At or over it, "TRUE!" slams in in the claimant's colour.
4. Two dice crack to ash on the loser.

The reveal plays the same, all seats at once, with the +10 as `+` steps.

---

## 4. The how-to overlay: `src/ui/howto.js` (new)

This plays the coach's how-to script. It is **skippable** (Esc or "SKIP") and **replayable** (a "?" on the table's plate).

```js
howTo.play(script, { hud, pieces, onDone })   // script: [{ target, line, wait: 'next'|'click'|'move:<kind>', demo? }]
howTo.stop()
```

| Part | Look |
| --- | --- |
| **Spotlight** | The canvas dims to 35%, using a CSS `radial-gradient` mask over the full-screen layer with its hole on the target's projected box (a piece id or a HUD id). The hole's edge is a 6px walking film ring. No new program. |
| **Line** | One line on a lacquer plate beside the hole (M type), with a pointer tick; one idea per step. |
| **Wait** | `next` shows "NEXT ›". `click` lets only the target through. `move:` waits for that legal move, so the player does the step, not reads it. |
| **Demo** | Optional: the coach plays a scripted move on a practice deal, and the ceremony runs at 0.5x so the eye can follow. |
| **Progress** | Pips at the plate's foot, for example 3 / 6. |

Every game's script fits **six steps or fewer** (the two-minute test): goal, your pieces, the one decision, how a point is scored,
the special move, win. The first sit at a table plays it. Later sits show only the "?".

---

## 5. Budgets

| Budget | Aim | Max | This brief |
| --- | --- | --- | --- |
| **New GPU programs** | 0 | 2 | **0.** The HUD, ceremony, how-to and spotlight are DOM and CSS. The marks use `PieceBatch`'s existing three slots. If the plain emissive tint doesn't read as film at 480 lines, the one allowed extra is an `onBeforeCompile` fresnel film on the lit slot (1 program). |
| **Draw calls seated** | 4 | 6 | 3 piece slots plus 1 cloth, as today. The marks join the batch. |
| **Pieces a frame** | ≤ 160 | 200 | Today's 100, plus about 40 marks plus about 20 ghosts |
| **DOM nodes** | ≤ 250 | 400 | Plates, buttons, digits (a digit is about 11 nodes; ~12 rolling numbers) |
| **Atlas** | 2048×2048 | 2048×2048 | See below. That is 16 MB RGBA; mipmaps are off as today. |

**The atlas, grown from 1024×1280 to 2048×2048:**

| Cells | Today | New | Room |
| --- | --- | --- | --- |
| House deck (80) | 64×104 | **128×208**, 16 cols × 5 rows | 2048×1040 |
| Dice faces (about 130) | 32×32 | **64×64**, 32 cols × 5 rows | 2048×320 |
| Zodiac tiles (25) | 32×48 | **64×96** | 1600×96 |
| Chips (8) | 32×32 | 64×64 | 512×64 |
| Seat cells (8 colours × rim, token, plate) | none | 64×64 | 1536×64 |
| Dim twins (cards, dice and tiles at 40% grey) | none | Drawn at half-size and upscaled by the UV | about 1024×400 |
| Cloths (5) | 256×256 | 256×256 | 1280×256 |
| **Total** | | | about 1900 rows: fits |

The card faces grow because their indices must read at seated distance. Dice numerals grow, and the d6 keeps its pips.

---

## 6. Build plan: independent builder tasks

The interfaces in section 2 are the contract, so these can run in parallel. Each owns its files and touches no one else's.

Not owned by any task here: `world/bazaar/*` (Dovina's: `session.js`, `views.js`, `bazaar.js`) and the coach module. Wanda builds
the ceremony's sounds on its events.

| # | Task | Files owned | Model | Acceptance look (one headless shot at the end) |
| --- | --- | --- | --- | --- |
| **A** | Seat look and atlas growth | `vfx/seatlook.js` (new), `vfx/bazaarfaces.js`, `vfx/bazaarpieces.js` (`PIECE` tiers, seat and dim cells) | sonnet | An atlas dump PNG: 8 seat cells by shape, dim twins, 128×208 cards. The card index is legible in a seated shot at 480 lines. |
| **B** | Table HUD, seat plates, goal bar | `ui/tablehud.js`, `ui/seatplate.js`, `ui/goalbar.js`, `ui/tablehud.css.js` (new) | sonnet | A stub page of 4 plates (idle, acting, out, winner) and a 3-track goal bar over a static table shot |
| **C** | Ceremony engine | `ui/rollnum.js`, `ui/reel.js`, `ui/scoreceremony.js` (new) | sonnet | A standalone harness page plays a Querent-shaped step list. A frame strip at 0, 0.4, 1.2 and 2.0 real s shows the roll, the pop, the slam and the fly. |
| **D** | Action bar and tips | `ui/tablebuttons.js`, `ui/tabletip.js` (new) | haiku | A stub shows 4 buttons with amounts, 1 suggested and 1 with a preview ghost, plus 1 tip with 2 keywords |
| **E** | World marks on the cloth | `vfx/tablemarks.js` (new) | sonnet | A seated shot with a turn ring at a bot's seat, seat rims, legal rims, one chosen, and dimmed illegal pieces, all readable at 480 lines |
| **F** | How-to overlay | `ui/howto.js` (new) | haiku | A shot of a spotlight on one piece, with its line, pips and "SKIP" |
| **G** | Wiring and Querent, Zodiac, Event Horizon layouts | `vfx/bazaartable.js`, `vfx/bazaarlayout.js` | sonnet | Three seated shots, one per game, each matching its section 3 table. Lands after A to F. |
| **H** | Supernova and Nebula layouts | `vfx/bazaarlayoutastroll.js` | sonnet | Two seated shots plus a frame strip of a Supernova ceremony. Lands after A to F, beside G. |

**The order:** A to F run in parallel. G and H start when the coach module lands and A to F are merged.

**Glossary terms, named in the same commit** (the code names are Petra's at the gate):
- the table HUD
- a seat plate
- the goal bar
- the action bar
- the score ceremony
- the how-to
- a seat colour (homonym watch: "plate" is already the Veritome's photograph, so say "**seat plate**" in full)

**Each builder's limits:** one look at the end, no tune-and-rerun, `npm run check` and `npm run build`. A sweep of the bazaar runs
once, at the end of the round.

---

## 7. Open questions for Dovina's coach API

Below, (A) to (H) are the build tasks in section 6.

1. **Where is it, and its shape?** I need a module path and these pure functions: `coach(T, S, seat)` →
   `{ goal, progress, turn, phase, moves, seats, suggested, steps }`. Pure meaning no `S.S` reads in layouts.
   Today `S.S.turn` and `S.S.dealer` are read directly.
2. **The turn.** I need `turn.seat` for *every* seat, bots included. Today `layoutTable` sees only `P0.seat === 0`, so the turn ring
   cannot sit on a bot.
3. **The goal.** I need one shape for every game: `{ label, line, target, unit, perSeat: [{seat, value}] }`. Zodiac is tiles shut,
   Event Horizon is need and sum, Supernova is points, Nebula is dice left, and Querent is groups made and round score.
4. **Legal moves.** Each move needs `{ id, label, line, amount, preview, pieceIds }`.
   - `pieceIds` should be the layout's piece ids (`tile:q:t`, `h:...`, `ed:q:s:n`), so the marks (E) light them without knowing the
     rule. Or else give me a mapping function.
   - `preview` is the would-be number (Zodiac's sum match, Event Horizon's range, Nebula's "BLUFF").
5. **Multi-select moves.** In Zodiac tile sets, Event Horizon's dice group, Wheel's throw-back and fuse, how does the coach say
   "this partial selection is on the way to a legal move" and "these remaining pieces are still choosable"?
6. **Seat numbers.** I need a list per seat of `[{label, value, kind}]`, where `kind` is `'score'|'money'|'lives'|'count'`, so the
   plate (B) picks the colour.
7. **Score steps.** I need the ceremony's step list (section 2g's shape) at each outcome: Querent's tier, bonuses and multipliers;
   Supernova's settled faces, births and decays; Nebula's worth build; Event Horizon's payoff read.
   - Can Querent's step list give the **two biggest bonuses first**, with the rest rolled up?
   - What is each game's median result, for the shake scale?
8. **Event Horizon's real faces.** The layout draws `splitSum`, a fake split. Can `view` carry the real faces rolled per seat, so the
   sum shown is the dice shown?
9. **Querent's flipped trumps.** `view` gives counts only, but the fiction says they are face up. Can `view` list which trumps each
   seat has flipped?
10. **Seat colours.** Is there one colour per seat for the whole game, with the player always the same colour (I'd say **White**,
    with Raku always **Black**)? Or is it chosen? I need the data as `seats[q].colour`, one of the eight names.
11. **The suggested move.** Is it always on, or a knack? By the design laws an assist is earned and switchable. Is that intended here?
12. **How-to scripts.** Their shape, as in section 4: `[{ target, line, wait, demo }]`. Is `target` a piece id or a role (`'drawPile'`,
    `'yourTiles'`), and who resolves a role to a piece? Is there a practice deal to demo on?
13. **The genre labels.** RUMMY, SHUT THE BOX, HIT THE NUMBER, DICE ENGINE, LIAR'S DICE, and the game-specific keywords (Set, Run,
    Steal, Seal, Attack, Bust, Fuse, Split, Claim, Call): are they Dovina's, or Espada's words? The KEYWORDS list is Espada's.
    Until settled, they are placeholders.

---

**What is canon after this brief and what is not.** Nothing was verified. Sizes, timings and hexes are starting numbers from the
prior-art notes. Whether film rims read at 480 lines, and whether DOM type over the canvas sits well with the look, are each task's
one look to answer.
