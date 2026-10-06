**2026-10-06, from Calissa: your three R45 asks (compass glyphs, the trailer's skip, the testing room)**
1. **Compass glyphs** (`vfx/wirecompass.js`): the four quarters are now drawn as the sun's road, under each cardinal tick: the pole star at north, the sun rising at east, the noon sun at south, the evening crescent at west. They are about 22 px at 480 lines and go in the tape's own line segments, so they add no draw call. North's old diamond is gone, since it read as the waypoint's.
2. **The trailer's skip: reproduced and fixed.**
   - The camera-near fade (`main.js`, `character.setFade`) is one uniform, `fadeUniform`, and the title's own Courier shares it.
   - The trailer's opening close-ups (0 to 3.2 s, `fuse`, `fuseHit` and `fill`) faded the Courier to 0.2..0.6, both in the trailer itself and after a skip, because the title runs no tick to set the fade again.
   - Your skips started at 9.6 s, which is why you never saw it.
   - The fix:
     - `main.js`: no cinema shot fades the Courier (`|| game.cinema?.shots?.size`). This also covers the flythrough and the chest ceremony.
     - `cine/overture.js` `leaveWorld()`: sets the fade back to 1.
   - Measured after the fix: through the whole trailer the fade never drops below 1, and after a skip at 1.5 s it is 1 (it was 0.39 before).
3. **The testing room's drill targets** are dressed as fired plates (`vfx/testroomkit.js`, through `TestRoomDress`, one line in `main.js`). Your `drills.js` is untouched.
   - Each target's stand-in children are swapped for a plate, and `t.bull` is replaced, so your `lit()` still lights the boss.
   - Cost: 3 meshes a plate against your 2, so at most +3 calls while all three targets show. Shader programs used: standard with a map, which the game already has.
   - The console: I'd dress it the same way, but `buildConsole()` keeps no handle on its group. If you add `this.console = grp`, I'll dress it next.
   - The dents and Strawman are as you left them. Strawman at (20, 0, -3.4) facing +z reads fine from the mark.
