# Fool's Fortune: working agreements for the port

The web edition (three.js, Rapier, Vite) is closed at build v434 (2026-11-24). This repository now serves the **port to Godot 4.7.2 and
C# (.NET 10)**. The JavaScript under `src/` is the reference implementation: read it, run it, do not extend it.

## Start here
- Read `PORT/README.md` first, every session. It is the index: the world, the architecture, every system in a paragraph, the Godot
  mapping and the port order. Load a brief from `PORT/briefs/` only for the system you are porting.
- `PORT/FILEMAP.md` (one line a source module) and `PORT/EVENTS.md` (every event name) are for **grep**, not for loading whole.
- `PORT/data/**/*.json` holds every rule table and all tuning, exported from the JS. Load numbers from there; never retype them.
  Regenerate with `npm run port:data` and `npm run port:map` if the JS changes.
- When a brief and the JS disagree, the JS is right; fix the brief.

## Words
- Call the owner **South** (or Captain).
- `docs/GLOSSARY.md` is the dictionary: one word, one meaning, with its code id. Grep it for a term; use its words for C# names
  (`Courier`, `PneukaJar`, `SolarSkiff`, `GodHand`, `SpiritGarden`), so one grep finds both sides.
- The Courier is androgynous: "you" in game text, "they" in docs and comments, never "she" or "he". The System never says "I".
- Every unit of time names its clock: **game day** (one real hour), **game hour** (150 real s), **real second**.

## Design laws to keep in the port (South's; `docs/DESIGN.md` 22)
- **The core movement is the gold standard.** Techs and modes never change it; they lay modifiers and take them off exactly.
- **Base change bad, modifiers good.** A mode or module never changes a base rule; a change is a modifier with a visible source.
- Skill skips grind; grind closes the gap. Arts open only by achievement (a count way and a feat way). Every system teaches something
  real without saying so.
- The log is the only narration; world marks carry no words; one toast (a title's placard) and a quest's splash.
- Achievements are predicates over the ledger, never flags set by hooks. Outcome events carry `by`; only the Courier's count.
- The look reaches for the sixth console generation (PS2): 480 lines upscaled, smooth shading, one sun shadow, a cel ramp, outlines.
  The UI is never stock.
- Desktop only, mouse and keyboard.

## South's priorities
Port first, and match number for number: **the Courier's character controller** (brief 01), **the Solar Skiff** (brief 02), **the god
hand and the Pneuka Jar** (brief 03), **the Spirit Garden** (brief 04). The rest follows as South chooses (brief 05).

## Process
- Develop on the branch the task names; commit with the session's trailers; no pull request unless asked.
- Prior art first: say in a module's header what was taken and from where (the JS headers already do; carry them over).
- Free assets only (UAL Standard, CMU mocap, CC0: `docs/CREDITS.md`).
- Look at anything a player will see in a screenshot at full resolution before calling it done.
