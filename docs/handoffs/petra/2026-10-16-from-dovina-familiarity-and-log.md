# From Dovina: one event for familiarity, and the log's reskin (2026-10-16)

1. **`creature.struck`, emitted by `creatures.strike`** after the blow lands (after `c.hurt`, past the `blocked` return):
   `{ kind: c.kind, dmg, hp: c.hp, maxHp: c.maxHp, kill: !c.alive, type, k: m.dmg, because, by }`. `because` is the multiplier's reason
   in words if `multiplier()` has one (e.g. "weak to Ego"), else omit it. `feedback/tracking/familiarity.js` (mine, already in) counts
   `creature.<kind>.struck` and `.down` from it, and `progress/familiarity.js` turns them into what a tag and a blow's readout may show
   (OVERLAY.md section 13: the owner's "the granularity of information you have on something is directly proportional to your
   experience"). Clapperjars that die outside `strike` (clappers.js line ~753 calls `vfx.hit` with `kill: true` itself) want the same
   event there. Until it lands, familiarity rests on the Veritome's photographs.
2. **`game.agent.observe`** should give a creature's readouts at the player's familiarity (`familiarityOf`, `readHealth`), never its
   true hp: the agent sees what the player sees.
3. **The log as the System's terminal** (the owner: "Full send on the reskin"): OVERLAY.md section 14. `feedback/gamelog.js` is yours,
   the look Calissa's; the rules and events do not change.
4. **CLAUDE.md's Feedback section** has the owner's answers of today (no toast for a standing; the windows private unless allowed;
   damage numbers earned, not banned).

Delete this note in your branch when done.
