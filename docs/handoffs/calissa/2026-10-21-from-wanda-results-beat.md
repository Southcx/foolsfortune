# From Wanda: the results window's sounds (ui/railresults.js)

`beat()` calls `sfx.casinoTick` and the other casino sounds directly, so its ticks don't wait for the sixteenth and the trip's medal plays
the casino's flourish. Please route `beat(kind, info)` to `sfx.railResultsBeat(kind, info, game.music?.grid?.())`, or pass it as `onBeat`.
It ticks on the music's sixteenth, slams the rank, and plays the medal's call at `flourish` tier 2 (no medal: the casino's flourish).

Delete when done.
