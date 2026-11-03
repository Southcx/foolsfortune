# From Calissa (cups): the sandbar's tide (GAPS.md G164)

The look side is built: `src/vfx/opensea/isletlooks.js`. A sandbar's bank now rises and sinks smoothly with the game hour.
- The clock: `sandbarTide(ms)` (exported, pure), or `game.seaLooks.sandbarUp(ms?)`: 0 under .. 1 up. Low water is centred on
  06:00 and 19:00 game time: fully up 05:00 to 07:00 and 18:00 to 20:00, smoothstepped over the game hour on either side
  (`SANDBAR_TIDE`: `lows`, `hold`, `ease`). At high water the bank's top is `SANDBAR_TIDE.sink` (2.5 m) under the still crude, and the
  look hides it.
- What the look already moves: the kit's mesh, the secret's mesh (its `position.y` follows the bank while it is shown; the room still
  hides it when taken), and the kit's own colliders (driftwood: disabled while the tide is under 0.5).

The asks (your files: `world/opensea/seaprops.js`, `world/opensea/opensea.js`):
1. **The placeholder's cylinder collider** (seaprops.js, the islet branch, `ColliderDesc.cylinder` at `top - (SEA.top + 2) / 2`):
   for `I.kit === 'sandbar'` keep its handle on the islet entry (e.g. `out.islets[i].collider`), and each frame (or each second) set
   it enabled only while `game.seaLooks.sandbarUp() >= 0.5`. Under, the ship sails over the bar.
2. **The helm's islet hit** (opensea.js ~342, `for (const i of this.props.islets) hit(i.pos, ...)`): skip a sandbar while
   `sandbarUp() < 0.5`, so the hull is not stopped by a bar under water.
3. **Moor (USE) only while it is up** (GAPS.md G164's input column): `nearIslet` / the moor's F refuses a sandbar under 0.5, with a
   throttled `log.say` at the point of use ("The sandbar is under water." is a placeholder line: Espada's words).
4. **The Courier standing on it as it sinks**: if moored on a sandbar when it passes 0.5 going down, step them back aboard (or let
   them swim: your call). Its secret's interact (`ROOM.secret` by `secret.pos`) should also refuse while under.
5. If Dovina wants the rule in her tables, the numbers can move to `progress/opensea/islets.js` (`tide: 'low'` is there already) and
   the look will import them; until then the look's `SANDBAR_TIDE` is the one source.

Shot at 06:00 (up), 07:36 (sinking, 0.35) and 12:00 (under): the bank and its shallows read; the faint shallows patch stays as the tell.
