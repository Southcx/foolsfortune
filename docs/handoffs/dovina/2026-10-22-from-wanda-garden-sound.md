# From Wanda: how cozy sounds, and the Spirit Garden's sound today (for GARDEN-COZY.md)

## What the garden sounds like today
- **The cue** (`music/garden.js`, "A Garden in the Jar"): 92 bpm, lightly swung, in E. The day's phase picks the section:
  - dawn: harp and celesta, with birdsong;
  - day: a bossa on brushes and upright bass, the tune on steel pan, then flute;
  - dusk: half time, a soft sax, strings;
  - night: a music box and shimmer, no drums.
  Your draught picks the mode (Wonder Lydian, Mirth major, Desire Dorian, Grief minor, Dread the In scale). It changes on the bar line.
- **The spirits** (`audio/spirits.js`): Chao-like voices of a syllable or two, their tune the mood (happy, sad, eat, hurt, call, cheer,
  effort, sleep). The leap is the spirit's feeling's interval. They sound on feed, drill, mature, merge, release, visit, pet and flick.
- **Tending that already sounds:**
  - the god hand's clay (`garden.sculpt`: press, pull, smooth, carve);
  - the mycelium's beds, each strain's voice (`sporeBed`);
  - Myggdrasil's drone, its fruiting and its caps;
  - a keepsake pot's song;
  - the kiln's cue and the awakening cue.
- **Silent today:** these events have no sound rule (checked against `audio/cues.js`):
  - tending: `garden.water`, `garden.plant`, `garden.harvest`, `garden.collect`;
  - building and painting: `garden.place`, `garden.paint`, `garden.planetoid.buy`, `garden.upgrade`;
  - coming and going: `garden.enter`, `garden.leave`, `garden.launch`, `garden.jar.back`;
  - the spirits' games: `spirit.race`, `spirit.spar`, `spirit.name`;
  - the hand's strokes: `garden.art`;
  - the press at the Athanor: `alchemy.press`, `alchemy.fire`.
  The garden has no ambience of its own either: no wind, insects, water or birds between the notes. The weather's ambience is the
  island's (`audio/ambience.js`).

## What the genre does (sourced where I could; my own knowledge says so)
- **Stardew Valley:** the seasonal songs are not looped. "Each season has multiple songs that play randomly... ambient seasonal
  soundscapes fill the void between songs" (ConcernedApe, Dev Update 16). The seasons' moods: hopeful spring, energetic summer,
  melancholy fall, lonely winter. Players have asked for years for more looping; the silence is a choice some dislike.
- **Animal Crossing:** a tune a real hour. Rain and snow have their own arrangements. New Horizons strips the percussion when it rains
  (vertical layers), so the rain stands out. Each island has a diegetic bed (breeze, insects, waterfalls, waves), and the music fades
  at the shore for the waves. Placed music players are positional: their sound falls off and muffles behind you. The 2 AM tune was
  written as a lullaby for new parents on sleepless nights. Sources: Nookipedia; gamemusic.net's New Horizons piece.
- **Harvest Moon: A Wonderful Life** (composer credits I could confirm: Dai Nakajima for "Wonderful Life" and "Quiet Winter"): seasonal
  themes such as "Memories of Midsummer" and "Quiet Winter", on an acoustic, homely palette. My own knowledge, not checked against a
  source: the seasons change the tune, and the radio and TV in the house are their own sound sources.
- **Spiritfarer** (Max LL): piano at the core, chosen because it feels familiar and domestic; the score meant "like a warm, cozy blanket".
  One theme runs through everything, coloured per place (shakuhachi, sitar). Sources: Thunder Lotus's soundtrack blog; SPIN.
- **Cozy feedback** (common practice, plus sound-pack listings, not a talk): warm, organic Foley for digging, planting, watering and
  harvesting. Short musical stings for milestones, and a soft click for a tidy inventory. Nothing I found was a GDC talk on it.

## What I would build (for you and the owner to prune)
1. **The garden's own ambience, of its tending.** A bed of wind, insects and water that is the garden's, its parts set by what you have
   placed: a pond adds water, a bed of moonflowers adds night crickets, the tree adds leaves. Animal Crossing's diegetic bed, Stardew's
   gaps filled by the season. The music may rest now and then and let it play (Stardew's rule), but never for long (the complaint).
2. **Tending as music.**
   - Each act lands on the garden cue's beat in the cue's key, as the rail's shots do (Rez).
   - A watering is a little run down the scale; a planting a soft knock and a note; a harvest pops up a step a crop.
   - A whole bed harvested plays the Answer.
   - Nothing about it is a tutorial: you just hear your chores become the song.
3. **Seasons as the cue's arrangement** (if the garden gets seasons): A Wonderful Life's and Stardew's way. The same tune re-dressed:
   - spring: flute and harp;
   - summer: steel pan and brushes, busier;
   - autumn: fiddle and accordion, slower;
   - winter: a music box and bells, sparse.
   Rain strips the percussion (New Horizons' layer).
4. **The calm garden and the briar garden: consonance you can hear (the mechanic is the lesson).**
   - Plomp and Levelt's sensory dissonance: two tones a quarter of a critical band apart sound roughest; slow beating under about
     20 Hz, roughness above it.
   - A calm garden is tuned: drones in fifths and octaves, just intonation, the beds' voices agreeing. A briar garden is detuned: its
     voices a few cents to a quarter-band apart, so they beat and grate. Its plucks are thorny (short, bright, a tritone in them); the
     insects turn to a dry cicada rasp; the wind whistles.
   - Tending pulls the voices into tune, and you hear the beating slow and stop as it comes right (as a guitar is tuned, or the crystals
     by ear).
   - It is one modifier with a source you can see (the briar), never a new base rule. The garden's cue keeps its tune and only its
     tuning and timbre change.
5. **Placeable sound.** A wind chime, a music box or a gramophone that plays a cue you own, heard positionally (New Horizons' players).
   It is customisable and earned.
6. **The spirits sing along.** A spirit fed and happy hums the garden's tune in its syllables; an unhappy one is out of tune (the briar
   again, for one voice).

## Sources
- [Stardew Valley Dev Update 16](https://stardewvalley.net/dev-update-16/)
- [Nookipedia: Rain](https://nookipedia.com/wiki/Rain), [Nookipedia: Snow](https://nookipedia.com/wiki/Snow)
- [The Sound of Animal Crossing New Horizons (gamemusic.net)](https://gamemusic.net/?p=20207)
- [Animal Crossing Music: An Introduction (USC)](https://scalar.usc.edu/works/video-game-music-transcription/animal-crossing-music-an-introduction)
- [Bokujou Monogatari Wonderful Life OST review (RPGFan)](https://www.rpgfan.com/music-review/bokujou-monogatari-wonderful-life-official-sound-track/)
- [Spiritfarer soundtrack devblog (Thunder Lotus)](https://thunderlotusgames.com/spiritfarer-soundtrack-devblog/), [SPIN on Max LL](https://www.spin.com/2021/09/spiritfarer-max-ll-composer/)
- [Parncutt: roughness](https://homepage.uni-graz.at/de/richard.parncutt/research/roughness), [SFU Sonic Studio: Consonance](https://www.sfu.ca/sonic-studio-webdav/handbook/Consonance.html)

Delete when the plan is written.
