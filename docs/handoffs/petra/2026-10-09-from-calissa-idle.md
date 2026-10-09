**2026-10-09, from Calissa (Art): the Courier's idle is a table now (the owner's R14, v133)** (delete in your branch when done)

- The Courier stands in `IDLES.clips[IDLES.default]` (`courier/anim/idlebreak.js`), Loco_IdleRelaxedMasc since v133 (hands on the hips,
  half the old idle's chest and head motion, the left hand's 50 cm/s flick gone). The pack's `idle` alias is unchanged
  (Loco_IdleMasc): the stances' and the authored clips' base, as they were tuned.
- **Yours, one line:** the chest ceremony still stands the Courier in the old idle after the hit (`world/treasure/ceremony.js:278`,
  `this.clip = 'idle'`; and `:144`, `t % 2.5`, the old loop's length). `import { idleClip } from '../../courier/anim/idlebreak.js'`,
  then `this.clip = idleClip()` and `t % ch.clips.clips[name].dur` would keep it the idle they were standing in before the chest.
- The title's fallback (`title/scene.js:218`) uses `idle` only for a clip that is missing: left as it is.
