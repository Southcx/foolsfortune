# Cleaning up the docs

The owner, 2026-10-08: the docs are bloated and hard to read. *"We should basically be building a wiki for all the game systems."*

The full reviews are kept as working notes in `docs/plans/research/`:
- `DOCS-REVIEW-TOP.md`: the README, CLAUDE.md and every file in docs/;
- `DOCS-REVIEW-PLANS.md`: the plans;
- `UI-AUDIT.md`: the in-game text.

This file is the plan that comes out of them.

## Where we are

- **Size:** 99 markdown files, about 167,000 words.
- **The two big ones:**
  - the casebook (30,500 words): about 50 rules on top, then a long log of dated cases;
  - the glossary (22,500 words): it is loaded into every session.
- **The plans:** 40 files and 64,000 words. Many are fully built and now only history; several clusters describe one system in three to
  six files.
- **The README:** was 6,900 words, a full player manual that repeated the glossary, DESIGN and ECONOMY.

## The shape we are moving to

| Kind | Where | Audience | Rule |
|---|---|---|---|
| **The front door** | `README.md` | anyone, fresh | one screen: what it is, how to play, where to read next |
| **The wiki** | `docs/wiki/` | the owner, a player | one page per system, in plain words, to `docs/plans/CLARITY.md`'s rules |
| **The rules** | `CLAUDE.md`, `GLOSSARY.md`, `ARCHITECTURE.md`, the casebook's rules | the divisions | binding and short; loaded or read first |
| **The specs** | `docs/plans/` | the divisions | one live spec per system; a built plan goes to `docs/archive/` |
| **The bibles** | `LORE.md`, `ART.md`, `OST.md`, `DESIGN.md`, `ECONOMY.md` | owner and divisions | the canon of a craft, kept current, with no dated changelog in them |
| **The record** | `docs/archive/`, the casebook's cases | anyone digging | kept, never loaded, never edited |

## The work, by owner

### Done (Dovina, 2026-10-08)
- **README:** rewritten to one screen. Its manual moved whole into the first eight wiki pages (`docs/wiki/`), to be rewritten there.
  Its credits moved to `docs/CREDITS.md`.
- **The wiki's index**, with the pages still to write and their sources.
- **CLARITY.md**, the rules for anything the player reads, and `scripts/clarity.mjs` to check them.
- **The glossary:** a slim core is drafted (one line a term), with the full text kept in a reference file. It waits on the divisions'
  review.

### Dovina (mine, next)
- **The wiki pages to write** (the index's list): combat, the Great Dunemaw, the Emocean, the Spirit Garden, Soul Alchemy,
  feelings and weather, progress, co-op. Then rewrite the eight first-pass pages to CLARITY's rules.
- **DESIGN.md:**
  - sections 1 to 5 stay;
  - the dated rulings (sections 10 to 22) fold into the wiki pages and specs they rule.
  - Code cites section numbers, so each section leaves a one-line pointer rather than being renumbered.
- **My plan clusters, one spec each:**
  - the Emocean (RAIL, RAIL-OVERHAUL, PASSAGE and the research files);
  - the garden (SPIRIT-GARDEN, MYCELIUM);
  - testing (SWEEPS, GARDEN-SWEEP, DEBUG-CHESTS).
  - The superseded files go to `docs/archive/`, with every path that cites them updated in the same commit.
- **ECONOMY.md:** its profile table to be generated from `scripts/economy.mjs`, so it cannot drift.

### Petra
- **The casebook:** keep the rules on top. Move the dated cases to `docs/archive/casebook/`, one file a month, about 25,000 words out of
  what is read first. Code cites cases by date, so the archive keeps the dates as headings.
- **Merges:**
  - `HANDOFFS.md` into `CLAUDE.md`'s "Talking directly";
  - `ARCHITECTURE.md`'s budgets with `CLAUDE.md`'s "Performance and the look" (one home, one pointer);
  - `CIRCUITS.md` into the basement's wiki page.
- **Built plans to archive:** SLICE, BUILD, SHRINES, TESTROOM, STRAWMAN, DUNES, the DUNEMAW family (into one spec first), PARRY
  (with PARRY-CLIPS, into a wiki page).
- **The menu template** (`indexmenu.js`): the card in place of the row (CLARITY.md sections 1a and 4).

### Calissa
- Merge `LOOK.md` into `ART.md`.
- Move ART's placeholder audit to a dated note in the archive.
- Merge OVERLAY with OVERLAY-LOOK, and SUNSHINE with SUNSHINE-SYSTEMS.
- The card's look and the keyword icons (CLARITY.md section 5).

### Espada
- **LORE.md:** sections 1 to 10 stay. Section 11 ("Open", the dated naming proposals) folds into the systems' wiki pages as each name
  is settled.
- **The labels:** settle CLARITY.md section 9, and the plain-words rule for the log.

### Wanda
- **OST.md:** sections 6 and 7 (the listening log and residue) to the archive.
- **`voice_recording.md`:** to the archive once the recording is done.

### Everyone
- **Handoff notes:** delete each done note in its reader's folder. The notes dated 2026-10-07 in `everyone/`, `espada/` and `petra/`
  look done.
- **Undated `dovina-*.md` notes:** mine; I fold them into dated notes or delete them.

## How we know it worked

- **The owner** opens the README and any wiki page cold, and understands it.
- **What a session loads before starting** (CLAUDE.md and the glossary) falls from about 25,000 words to under 9,000.
- **Live docs** (all but the archive) fall from 167,000 words to under 70,000, nothing lost.
