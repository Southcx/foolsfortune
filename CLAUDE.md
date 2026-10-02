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
- Nothing that shimmers or flickers at a variable rate across large parts of the screen (the rule came from a bad bug
  in the sand, not from any sensitivity: textures used the way sixth-generation games used them are welcome, including
  a scrolled texture where that is the honest way to show something moving). Motion in the world should still come from
  things actually moving where it can.
- The core movement is the gold standard: techs and arts never change it, and switching one off restores it exactly.

## Feedback
- **The log (`src/gamelog.js`) is the only text feedback.** No pop-ups, toasts, banners, floating counters or kill-feed in the world or on the HUD; if something deserves a sentence, `tracking.js` writes it (plain third person, FFXI-style, a colour class per kind), and everything else is counted in the ledger (`src/stats.js`) for the achievements. A new feature emits an event (`game.events.emit`) and gets a rule in `tracking.js`; it does not call the log to celebrate. (A refusal at the point of use, "You have no bomb shells.", may `log.say` directly, with a `throttle`.) Event payloads must not use `name` or `t` (the bus's own).
- **Marks in the world are not text.** A glyph pop (`src/vfx/glyphs.js`: a `!`, `!!!`, `?` over the thing it is about), the interact chevron (`src/interact.js`), the lock-on reticle, the letterbox bars and the fish portrait (`src/vfx/cinema.js`, `portrait.js`) are how the game *shows* something: they sit on the thing, carry no words or numbers, and are diegetic wherever they can be (a line that glows with its load beats a gauge). Anything that needs a sentence still goes to the log.
- **The dialogue box is the one window of words in the world**, and only because the player opened it (F at one of the clay folk, `src/npc/`); every finished line is also written to the log (`npc.say`). The folk show feeling with their bodies, particles and glyph marks (`src/npc/folk.js`), never with floating text. Their lines are data (`src/npc/talks.js`).
- **The log takes typing** (the chat line): a feature that wants a command adds it to the table (`game.chat.add`, `src/chat.js`); what the command does is still reported by an event and a rule in `tracking.js`.
- Events that report an outcome say who caused it (`by`: `courier` | `clapperjar` | `creature` | `environment`, see `src/breakables.js`); only the
  Courier's count toward the Courier's records, and the log says the others as what they were.
- Achievements are predicates over the ledger, never flags set by hooks (so they are retroactive); follow OSRS's tiers/types and FFXIV's categories (see the header of `src/achievements.js`).

## Performance and the look
- The target is a sixth-generation console (PS2 / GameCube): the scene is drawn at 480 lines and upscaled bilinearly,
  smooth shading, one sun shadow. Keep it so (`src/render/present.js`).
- Every new room is a zone in `src/render/zones.js` (only the zone the camera is in, and what it can see, is drawn).
  Static geometry goes through `level.box`/`addGeo` (merged per zone). Lamps are plain `PointLight`s: the light budget
  (`src/render/lightbudget.js`) lends eight real lights to the nearest; never add lights that bypass it.
- Many copies of a prop: park them in a prop batch or an instance pool (`src/render/propbatch.js`); a model made of many
  static primitives: `mergeStatic` (`src/render/merge.js`). Measure before and after (`window.__boot`, renderer.info).
- An articulated model that rests most of the time (a tool on the belt, a chest) is drawn through a rest bake (`src/render/restbake.js`).
- The maker's pixel art is used at 1x, palette-swapped, then scaled by a whole number, never resampled (`src/ui/pixel.js`).
- A new psychic tool goes on the belt (`src/tools/belt.js`), and anything that asks "is a tool out?" asks the belt.
- What a tool may do to a thing is a tag on the thing (`src/tags.js`: sliceable, breakable, liftable, pushable, static); a tool asks
  `hasTag`, never the entity's kind. Static things a sweeping tool must find are registered there.
- A creature that can be hurt is tagged `hurtable` and registered with `game.creatures` (`src/creatures.js`); a weapon calls
  `creatures.strike`, never the creature's own module. Conditions (halt, slow, sleep...) are statuses applied there, and the creature
  decides what each means for it. A feature that wants the chat line's typing borrows it as a mode (`log.setMode`).
- "If we only have to build it once, we build it once." A creature's mind is assembled from the parts in `src/ai/` (utility reasoner,
  drives, stimuli, senses, memory, steering, ecology, Brain), documented in `docs/AI.md`; a new creature is a body module and a mind
  module of data and small functions, and anything it needs that another creature could use becomes a part there (and a line in the doc).
  Anything that makes a sound, light or smell a creature should notice emits a stimulus (`game.ai.stimuli.emit`); what the place offers
  (water, shade, food) is an ecology offer or provider, never a creature's own list.
- Stunning goes through `src/stun.js` (`game.stun.add`); an ability a thinking opponent would refuse (zandatsu, reprogramming) asks
  `stun.vulnerable(target)`, and when it refuses it shows the resist mark (`blade.resist`), never nothing.

## Scope
- Raids belong to one room (THE SIEGE, `src/siege.js` and `src/raids.js`), not a global setting.
- Every trial or minigame is begun from something in its own room (F at a gong, a console), never a global key, and its interface
  goes away when you leave the room.
- The Zone of Influence is, for now, simply the ground the player has explored. No "understanding" prompts.
- The testing tool is the *stress test* (`tools/stress.mjs`), random-input fuzzing with invariants, not a bot with a grudge.
- Progress (unlocks, the Codex, the ledger and achievements) is reset on every new build (`src/progress.js`); the achievements are
  placeholders. Settings are kept.

## Git and publishing
- Develop on the branch the task names; commit with the trailers the session gives; no pull request unless asked.
- The playable build is republished to the same artifact URL after `npm run build`, by the main thread only (so one build never
  overwrites another).

## Threads
Several Claude sessions work on this repo at once, each in its own container on its own branch; the owner merges them into the
default branch (`claude/fps-third-person-demo-8zp2kx`). Start from the latest default branch, keep merges small and frequent, and
stay inside your own files; a small edit to a shared hub (`main.js`, `tracking.js`, this file) is fine.
- **Main** (`claude/fps-third-person-demo-8zp2kx`): everything not listed below, and publishing the playable build.
- **Audio** (`claude/friendly-knuth-vbv82r`): `src/audio.js` (and the `src/audio/` it is being split into), `src/music/`,
  `src/system/voice.js` and `src/system/speech/`, `src/npc/clayese.js`, `docs/OST.md`, `docs/voice_recording.md`.
- A feature that needs a sound it does not have calls an existing `sfx` method or adds a one-line placeholder and says so to the
  owner; the Audio thread builds the real sound. Another thread's files are changed by asking it (through the owner, or the
  remote `send_message` tool with the owner's OK), not by editing them.
