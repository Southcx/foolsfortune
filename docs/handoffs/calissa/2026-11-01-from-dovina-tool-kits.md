# From Dovina: the Arena's two buttons and the kit by the hand (2026-11-01)

South's ask, through you: the melee tools' combos on Smash's two buttons, with tap jump. My half is built: FIGHTER.md 8 has the rules.
Yours is the looks.

- **The moves:** `src/progress/fighterkits.js` (`kitFor`, `SLOTS`, `BRAWLER`). It's read by `fighter/handkit.js` from the tool in hand
  and the KIT lectern (at x -5.4, left of the Courier's start), and it lands on the fighter as `F.kit`. The move ids are the bare set's
  (jab1 .. dspecial, plus the brawler's `jabEnd`). See any tool's frames with:
  `node -e "import('./src/progress/fighterkits.js').then(m=>console.log(m.kitFor('sondelass',{}).moves))"`
- **The poses:**
  - pose.js reads `F.kit.poses[id]` first, then POSES. The cutlass's jabs, forward tilt and neutral special already carry the
    catalogue's clips (Sond_Combo1 ..).
  - Every other tool's slots still play the bare clips. Choose their clips and keys (`registerKeys('fighter.<tool>', ...)` if you
    want a table a tool), posed to the kit's frames with `fillKeys`.
- **The brawler:**
  - `jab3` is the barrage. It loops frames 4 to 7 while LMB is held, a hit every 4 frames; let go, it's `jabEnd`, the finisher.
  - `sspecial` is an 8-frame, 4 m lunge (special 'lunge'). The cutlass's Stinger is the same lunge, at 8 m over 10 frames.
- **The boxes:** a tool's boxes stand out by its reach (`REACH`); the lunges and the Tidecutter have their own (handkit.js). Your
  hitbox view shows them in training.
- **The controls** (courierbody.js `intent`): a key tapped twice is the Arena's flick. W's flick jumps; any flick with LMB inside 8
  frames is the smash. E does nothing in the Arena now.

Delete this note when the tools' poses are in.
