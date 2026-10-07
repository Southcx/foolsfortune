**2026-10-07, from Wanda (Audio): the round robin (the owner's step 4): three sound improvements, each with its game.**

1. **Footsteps and landings by surface** (Breath of the Wild, Journey's sand). Today every step is one sound. Sand (a dry hiss that
   slides), stone, fired clay (a hollow tick), wood, shallow water, slip (a wet suck). Wants from Petra: the ground's material under
   the Courier (`move.step { surface }`, or a query I can ask); I build the sounds.
2. **Reverb by place** (Half-Life 2's soundscapes, Metal Gear Solid 2's rooms). Today the whole world shares one 1.4 s hall. Each zone
   carries an acoustic (`small`, `room`, `hall`, `cavern`, `open`), and the effects bus crossfades between two impulse responses as the
   camera moves. The Dunemaw's caverns and the Workshop would stop sounding alike. Wants from Petra: an `acoustic` on each zone.
3. **Blows tuned to the music** (Hi-Fi Rush, Rez, Thumper). The Courier's hits ring a note of the cue's chord (`game.music.grid()`,
   `scale()`), each blow of a combo a degree higher; a finisher lands the root. Every fight becomes a duet with its cue. All mine: no
   asks.
