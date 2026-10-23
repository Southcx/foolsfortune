# From Petra: main and sub, built (the belt's half and the seven lent verbs; 2026-10-23)

## What stands, for your window

- **The belt's calls** (`tools/belt.js`):
  - `main` and `sub`;
  - `equip(id, 'main' | 'sub', { quiet })` returns true or false: refused by your `swapRefusal`, and said in the log at the point of use;
  - `mayEquip(id)` returns null or the reason, quietly;
  - `pair`, `isWorn` (main or sub), `isMain`.
- **The events:**
  - `tool.equip { tool, as, off, pair, by }`, with a log line;
  - `tool.lend { tool, main, by }`: the ledger counts `tool.lend` and `tool.lend.<tool>`, so a pair's special can be earned by using it.
- **The Box** (`pneuka/box.js`):
  - kit version 2, `{ main, sub }`; the version 1 migrate takes the first two worn in `TOOL_IDS` order;
  - no `tool.<id>` items;
  - `carryPsygun(slot)`;
  - `openBank()`, and `bankOpen` true at a Shrine's THE BANK row while the window is open (and with the Veritome held open).
- **The pictures and words:** `toolIcon(game, id)` (`pneuka/icons.js`); `TOOL_INFO` and `toolInfo(id)` (`pneuka/items.js`).
- **The slowed world** (your pick: a tenth while the window is open): `game.time.slow('pneuka', 0.1)` while it is open,
  `game.time.free('pneuka')` on close (`core/time.js`). It is yours to call from the window.

## R, on press

| sub | verb | what it does |
|---|---|---|
| psygun | Snap shot | one round from the hand where the main aims |
| Sondelass | Grapple | the hook from the hand, reeling on its own (Zelda's Hookshot); R again lets go |
| Soul Brush | Flick | the fan of paint from the hand |
| Veritome | Flash | the Flash from the hand |
| Dreamvane | Lure throw | the fork from the heel; R again calls it back |
| Crucibelle | Toll | one toll round the Courier |
| Lockheart | Gulp | its parry window, whatever is in the hands |

Probed headless: all seven go off on R, and the hook reels to an anchor and lets go on arrival.

## The other key moves

- **The Dreamquake** is the pick's full charge let go (1.1 real s into the hold).
- **The Tidecutter** is a catalogue special for RMB (Wave Cut, its moves.js row unchanged). It is not slotted by default; the
  loadout editor offers it.
- **Fan the Hammer** is on Q for now. MMB is the shell press, so it cannot go there. Yours to rule.

## Yours to look at

1. **Your sweeps call what is gone.**
   - `tools.mjs`: `wearSet`, `pneuka.wear`, `pneuka.takeOff`, the `tool.<id>` slots.
   - `dunes.mjs` 182, 189, 434: `belt.wear`, `belt.takeOff`.
   - The fix: `belt.equip(id, 'main', { quiet: true })`, then X to draw.
2. **The first path, an1** ("draw the Sondelass and take its rod form"): a new save wears the Sondelass as the sub, so that step needs the
   Box first.
3. **What now counts only two worn tools.** Each was "every tool worn" before; now it is the main and the sub. Each is your rule to keep
   or change:
   - a puzzle duel's moves (`world/duel/duelsession.js:66`);
   - the mountable tools at the pier (`pier.js:116`, `voyage.js:122`);
   - the passives that read `isWorn`: the wire compass and the sea chart's vane (the Dreamvane), `/time` (the Veritome);
   - the Lockheart drinking overflow, which is now only while it is worn (it drank always).
4. **Busking asks for the Crucibelle as the main** ("Make the Crucibelle your main to busk."), since the bell must be in hand.
5. **The trial's text panel waits on you.** `#trial` (time, count, medals) and the dead `#trialbig` are on my pruning list, but
   `workshop.mjs:372,385` read `document.getElementById('trial')`. Drop those two reads and I prune it.

## Not verified

- Any of it by hand.
- How a lent verb reads with no gesture: those are Calissa's (her note, `docs/handoffs/calissa/2026-10-23-from-petra-lend-gestures.md`).
