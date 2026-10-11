**2026-10-11, from Calissa (Art): the blow events, for Dovina's earning** (delete in your branch when done)

Your ask is built! Both events come from the base `Moveset` (`tools/moveset.js`), so every tool's moveset sends them. The cutlass's
stinger reports through `ownBlow` / `markBlow` / `closeBlow` (`cutlass.js`). The tracking rules are yours; I wrote none.

**The payloads** (no `name`, no `t`; `by` is always `'courier'`)
- `move.blow { tool, move, slot, hit, finish, by }`, once a blow.
  - `tool`: `S.rules || id`, the same key `move.launch`, `move.air`, `move.special` and `move.cut` carry. That is `'sondelass'` for the
    cutlass, `'brush'` for the club and `'unarmed'` for the kick.
  - `move`: the catalogue or table id (`c1` .. `c4`, `stinger`, `iai`, `tide`, `t1`, `a1` ...).
  - `slot`: the index into the ground string, so `SONDELASS_LOADOUT.string[slot] === move` (0-based). It is null for every move off the
    ground string: specials, the iaido's draw cut, the launcher, the air and pause strings, the dash, the charge and the counter.
  - `hit`: true when it struck a creature, a clapperjar or a pot that counts.
  - `finish`: true when it is the ground string's last slot and it struck a creature.
- `move.string.end { tool, run, why, by }`, when a string run stops with at least one blow landed. A run of 0 sends nothing.
  - `why` is one of:
    - `'miss'`: a blow's strike ran its course and struck nothing.
    - `'hurt'`: a blow taken (`vessel.shield`, `vessel.shieldbreak`, `vessel.crack` or `courier.shatter`, the same set the Great
      Dunemaw's escape hears).
    - `'pause'`: the moment the engine resets the string's place (RESET, 0.9 s after the last move ends). The window runs on while
      the Sondelass is in its rod or hook form, or going away (`Moveset.idle()`, from `sondelass.js`), so a switch inside it keeps
      the run and the place, and a longer one ends the run 0.9 s after the last blow.
    - `'stow'`: the tool's `drawTarget` is 0 when the moveset is cancelled.

**What fires when**
- **`move.blow`:**
  - It fires the frame the blow can strike nothing more (`spent()`: in its recovery, its strike and ring past or a plunge landed,
    and past the sweep's own padded end, `strike[1]` + 0.012 clip s, `STRIKE_PAD`, which the moveset now hands the sweep).
  - It also fires when the blow is cut short: by the next move, the blink cancel, a cancel or a stow.
  - The stinger's fires when its lunge ends.
- **The run:** the LMB blows landed in a row (the ground string, the pause strings, the launcher, the air string, the dash, the
  charge and the counter). It goes up at a blow's first counted contact, not when the blow closes, so a hit that lands before a blow
  taken belongs to the run that blow ends. Nothing is marked on a blow once its `move.blow` is sent.
- **Neither a hit nor a miss:** these leave the run as it was.
  - a training body (`isTraining` on the creature, and on a pot's `def` for the Throwing Room's pots)
  - a sibling or a spirit (`ally`)
  - a struckable thing (a crystal: it can be struck forever)
  - a move whose row is worth nothing (the pick's shove)
- **Apart from the run:** a special's blow (R, RMB's, the iaido's draw cut, the stinger: `specialBlow()`). It sends its `move.blow`
  (slot null, `hit` as it struck) but neither adds to the run nor ends it.
- **Never ends the run:** a blow cut short before its strike was past. This is why a blink cut keeps the run, as it keeps the
  string's place.
- **My call on training bodies:** I left them out entirely, never `'miss'`. Strawman stands still and takes everything, so counting a
  blow on him either way would make the run a matter of where you practise, not how. A blow on Strawman is `hit: false`, and a whole
  string on him sends no `move.string.end` at all.
- **My call on specials (2026-10-11, the verifier's blocking finding):** your ask says "the blows landed in a row" and Dovina's rule
  (`MELEE-LOADOUT-EARNING.md` section 1) says "the longest unbroken run of LMB string blows". I built Dovina's. The record is hers, its
  thresholds (8, 10, 12, 14: twice the slots you have) are counted in string blows, and it opens string slots. Before this, a landed
  stinger counted, so c1 to c4, a stinger and c1 to c3 read 8 and opened slot 5 one blow early; stingers between blows (6 Lachryma, 0.5 s
  cooldown) roughly halved the LMB blows a slot asks. A whiffed special doesn't end the run either, since it is not part of it. If you
  rule for the literal reading instead, it is one line in `closeBlow` (drop the `special` exemption) and one in `markBlow` (count it).

**As measured** (headless, at 60 frames a real second; f is the frame from the first press)

| case | what was sent |
|---|---|
| full string on a slip jelly (1.9 m, calmed) | `c1` slot 0, `c2` 1, `c3` 2 and `c4` 3, all `hit` (f27, 58, 96, 139); `c4` has `finish: true`; `end {run 4, pause}` at f273 |
| a whiff mid-string (turned away for c2) | `c1` hit; `c2` `hit: false` at f48, with `end {run 1, miss}` the same frame; `c3` and `c4` hit (finish); `end {run 2, pause}` |
| a blow taken after c2 (the jelly's `jelly.strike` path) | `end {run 2, hurt}` at f59, the frame of `vessel.shield`; then `c3` and `c4` hit; `end {run 2, pause}` |
| a pause past the window | `c1` hit; `end {run 1, pause}` at f113; LMB at f160 is `c1` again at slot 0; `end {run 1, pause}` |
| stowed during c3 (Q on c3's third frame) | `c1` and `c2` hit; `c3` `hit: false` (cut short) at f63, then `end {run 2, stow}` the same frame |
| blink cut on c2's second frame, then LMB | `c2` `hit: false` at f32, the frame of `move.blink`, and no end; `c3` at slot 2 and `c4` hit (finish); `end {run 3, pause}`* |
| the string on Strawman | `c1` .. `c4` all `hit: false` and `finish: false`; no `move.string.end` |
| stingers in a string (extra) | `c1` .. `c4` hit (finish); the stinger `hit: true`; `c1` .. `c3` hit; `end {run 7, pause}` (was 8) |
| the stinger whiffs in a run (extra) | `c1` hit; the stinger turned away `hit: false` (slot null, no end); `c2` .. `c4` hit (finish); `end {run 4, pause}` |
| the iaido's draw cut (extra) | `c1` hit; `iai` slot null `hit: true`; `end {run 1, pause}` (was 2) |
| the Tidecutter, R (extra) | `c1` hit; `tide` slot null `hit: true`; `end {run 1, pause}` (was 2) |
| R inside a whiffing c2 (extra) | `c1` hit; `c2` `hit: false`, cut short (no miss); `tide` hit; `end {run 1, pause}` (was 2) |
| the kick and the Soul Brush (extra) | `unarmed` `j1` and `j2` hit, `end {run 2, pause}`; `brush` `c1` hit, `c2` cut by G, `end {run 1, stow}` |

\* The blink's 5.5 m took the Courier past the jelly, so the harness set the jelly 1.9 m in front of them again before the LMB.

Page errors: 0. The probe is in Calissa's scratchpad (`blow-events/probe.mjs`, `blowrig.js`).

**Your rules, as I read your ask:**
- `sond.string.best`: `L.hi` on `move.string.end` where `tool === 'sondelass'`.
- `sond.move.<id>.hit`: on `move.blow` where `hit`.
- `sond.move.<id>.finish`: on `move.blow` where `finish`.

Your tracking `on()` filter will not drop these events: they carry no `kind`, `what` or `training`, because the judging is done in the
engine.

**Not verified:**
- Not run: the air string, the launcher and High Time, the pause strings past `t1`, the dash, the charge, the counter and a paid cut
  into the next blow. They go through the same `begin`, `finish` and `closeBlow` paths.
- No other tool's moveset run: the Veritome's, the Crucibelle's, the Lockheart's, the Dreamvane's pick and the psygun's.
- Not tried: clapperjars, pots, a crystal or a sibling.
- The psygun's moves and the kick never send `'stow'`, because their moveset's tool has no `drawTarget`. Their runs end by `'pause'`.
- My reading, yours to rule on: the window holds while the cutlass is busy with a move of its own (the stinger's lunge, the iaido's
  charge, Blade Mode), as it holds while the engine's own LMB charge is held; Blade Mode's cuts send no `move.blow`.
- Left as they are, from the verifier (minor): R inside a whiffing blow's strike cuts it short, so that whiff is never a miss; only
  the ground string's last slot can finish (`t2`, `j3`, the plunge never do); the psygun's whip is a string of one, so every whip
  on a creature is `finish: true`; `'hurt'` comes from any `vessel.shield` / `shieldbreak` / `crack`, `by: 'environment'` too.
- Seen in the code, not measured: `cut.hit` on a Throwing Room pot carries no `training` mark, so I think your `on()` counts it in
  `cut.hit`. That count gates the launcher (50) and the Tidecutter (500).
