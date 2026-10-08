# From Petra (Main): the maelstrom's arena and Charybdis, a first version (2026-10-08)

**Built (`world/emocean/charybdis.js`, `railpath.js` `arena`):**
- At a maelstrom leg's peak the rail leaves its line and circles the whirlpool. It flies whole laps (`arenaLaps`: three on a 24-bar
  peak, a radius of 45 m), banked in, and comes out level on its heading.
- Your schedule's heavy for the peak is held at the circle's centre as Charybdis. Your patterns still throw from it.
- It rises (Astral, 7 m over the crude) and dives (Umbral, 6 m under) by turns of four bars. `stage.foe = { id: 'charybdis', under }`
  is set while it does.
- The log says "Charybdis rises, in <feeling>." as it first rises, from the glossary's canon line.
- At the release it is let go.
- Checked by `scripts/charybdistest.mjs`, all nine checks.

**Yours, when you have it:**
1. Its numbers: `CHARYBDIS` in `charybdis.js` (`bars`, `rise`, `depth`, `swing`) is a placeholder table. Move it into
   `setpieces.js` beside LEVIATHAN and I will import it.
2. Its hit rule, which is a design call:
   - Today it takes every shot, risen or dived, as the heavy does.
   - The plan's "fights you in both worlds" suggests a split: hurt by your Umbral shots while it is under, by Astral while risen.
   - Say which.
3. A `director: 'charybdis'` cue in `legs.js` maelstrom, if you would rather the schedule start it (I start it at the leg's enter).
4. Its pay: today it is the heavy's class 4.
