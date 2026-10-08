# The log, the Codex and the records

The log is where the game talks to you, in the lower left. The Codex (B) is your book of everything you know and have done. This page
covers both, and the ledger and achievements behind the Codex.

## The log

The log is the game's only text. There are no pop-ups, banners or floating numbers.

| Fact | Detail |
| --- | --- |
| Where | lower left |
| Tabs | ALL, CHAT, BATTLE, MOVE, EVENT, SYSTEM (filter lines by kind) |
| Colour | each line is coloured by its kind |
| Repeats | fold into one line |
| Enter or / | opens the chat line |
| \ | folds the log to its tabs |
| PgUp, PgDn | scroll |
| [ and ] | change tab |

**Typing.** Plain words are said aloud. A slash starts a command. `/help` lists them all. Some you will use:

| Command | Does |
| --- | --- |
| `/help` | list commands |
| `/emotes` | list body-language emotes by family (`/emotes <family>` lists one); a few are `/sit` `/dance` `/wave` `/kneel` |
| `/em` | an emote of your own, e.g. `/em takes a bow` |
| `/where` | say where you are |
| `/music`, `/voice`, `/window` | music, voice and window colour settings |

**Marks in the world** carry no words: a glyph over a thing (`!`, `?`), the interact chevron, the lock-on reticle, the letterbox bars.

## The Codex

Press **B** to open the Codex (it pauses the game). It is the System's book. Its shelves:

| Shelf | Holds |
| --- | --- |
| MOVEMENT ARTS | the arts you know, their variants, and how close you are to the rest |
| GOD ARTS | the god hand's arts |
| ANGLING | the fish bestiary |
| CURIOS | things you have found |
| VERITOME | the memory, the bestiary, the Book, THE MIND |
| TOOLS | the seven tools |
| LEDGER | every count the game keeps |
| RECORDS | your bests and firsts |
| GRIMOIRE | the Codex's reference pages |
| SOUND TEST | the music tracks |

The top of the Codex holds switches and your save:

| Control | Does |
| --- | --- |
| ALL ARTS | lends every art without learning it. Nothing it lends is counted |
| VOICE, MUSIC | turn the voices and the music on or off |
| WINDOW | the window colour |
| EXPORT CODE, IMPORT | copy your save out as a code, or paste one in |

## The ledger and records

**The ledger** counts everything: time and distance by move, every pot broken and how, shells fired, Lachryma, the god hand's work,
the skiff, lap circuits. It keeps three kinds of entry.

| Kind | What it is |
| --- | --- |
| Counter | a number that only goes up |
| Record | a best (a longest, a fastest) |
| First | the play time something first happened |

Only the Courier's own deeds count. A creature's blows, the Strawman and anything from a debug chest or the all-arts switch do not.

## Achievements

An **achievement** is a question asked of the ledger. It is never a flag set by the game, so it is **retroactive**: if you already did
the thing, it completes. Achievements have tiers from Easy to Grandmaster, worth 1 to 6 points. The points buy a standing, and some
give titles. Some are hidden. Movement Arts and God Arts are unlocked by achievements.

Progress resets on every new build. Settings are kept.

## For the divisions

- The log: `src/feedback/gamelog.js`; its rules: `src/feedback/tracking.js` and `src/feedback/tracking/`; commands: `src/feedback/chat.js`
- The Codex: `src/feedback/codex/codex.js`, `ledger.js`, `grimoire.js`
- The ledger: `src/progress/stats.js`; achievements: `src/progress/achievements.js`
- Rules for what the log may say: `CLAUDE.md` (Feedback) and `docs/plans/CLARITY.md`
- Not verified: the exact set of hidden achievements; what the GRIMOIRE shelf lists beyond the macro reference
