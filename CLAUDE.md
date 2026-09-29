# Working agreements for this project

These come from the project's owner and apply to every change.

## Prior art first
Before designing anything (a system, a shader, a movement feel, a UI), ask "has this been done before?" and look it
up. Take the distilled design choices as the springboard, say what was taken and from where (in the module's header
comment, as `trailmap.js`, `marks.js`, `rom.js` and `moves/surfer.js` do), and build it as a modular piece with a small
interface, not a one-off inside the thing that first needed it. Free sources only for assets (see the README's
credits: UAL Standard, CMU mocap, CC0).

## Animation
- Find an existing animation (UAL Standard, CMU, CC0 packs) for every movement or action wherever practicable, and
  blend it into the existing animation tree. Author a clip only when nothing fits.
- Use IK as a light correction (setting a foot on a surface, closing a hand on a handle), never as the way to
  pose a whole action: it is hard to diagnose and, being visual, hard for the assistant to verify.
- Every posed joint passes through the range-of-motion limits (`src/rom.js`) last. New rigs get a spec there; the
  finger hinges for the Courier are learned from the clips (`tools/learn_rom.mjs`).

## Feel and comfort
- Nothing that scrolls, shimmers or flickers at a variable rate across large parts of the screen (no time-scrolled
  textures, no fast twinkle). Motion in the world should come from things actually moving.
- The core movement is the gold standard: techs and arts never change it, and switching one off restores it exactly.

## Feedback
- **The log (`src/gamelog.js`) is the only text feedback.** No pop-ups, toasts, banners, floating counters or kill-feed in the world or on the HUD; if something deserves a sentence, `tracking.js` writes it (plain third person, FFXI-style, a colour class per kind), and everything else is counted in the ledger (`src/stats.js`) for the achievements. A new feature emits an event (`game.events.emit`) and gets a rule in `tracking.js`; it does not call the log to celebrate. (A refusal at the point of use, "You have no bomb shells.", may `log.say` directly, with a `throttle`.) Event payloads must not use `name` or `t` (the bus's own).
- Achievements are predicates over the ledger, never flags set by hooks (so they are retroactive); follow OSRS's tiers/types and FFXIV's categories (see the header of `src/achievements.js`).

## Scope
- Raids belong to one room (THE SIEGE, `src/siege.js` and `src/raids.js`), not a global setting.
- The Zone of Influence is, for now, simply the ground the player has explored. No "understanding" prompts.
- The testing tool is the *stress test* (`tools/stress.mjs`), random-input fuzzing with invariants, not a bot with a grudge.

## Git and publishing
- Develop on the branch the task names; commit with the trailers the session gives; no pull request unless asked.
- The playable build is republished to the same artifact URL after `npm run build`.
