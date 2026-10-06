# Fool's Fortune: the soundtrack (a living plan)

What the music of a full-scope Fool's Fortune needs to be, worked out ahead of the game it will serve. Each cue below has a place to
live, a reason to exist and the motifs it carries; the ones marked **made** are in the game (`src/music/`, the Codex's SOUND TEST).
This page is revised every time a cue is made or the game grows a place that needs one.

Masters to learn from: **Joe Hisaishi** (the patient ostinato, the falling-bass lament, the piano as the voice, a melody that needs
no ornament), **Koji Kondo** (the leitmotif as architecture: a handful of notes that become the fanfare, the jingle, the lullaby,
the boss), **Yuu Miyashita** (acoustic and ethnic colour over a modern pulse, and the patience of a long build), **Nobuo Uematsu**
(To Zanarkand: a solo piano saying everything in eight bars; themes that return in the last battle), and, for the drop's shape,
Crywolf.

---

## 1. The rule of five

Five is the game's number, and the music keeps it.

- **The notes.** **E** (the fifth letter) and **G** (the fifth degree of C, the plain hexachord's ut). E minor and G major are one key
  seen from two sides: the home of the score.
- **The two languages** (the two worlds of the game), each a scale of five or six:
  - **EAST**: the **minyo pentatonic** E G A B D (five notes, Japan's folk scale) and, for grief and Lachryma, the **In** scale
    (E F A B C, its half step F to E the sigh). Shakuhachi, koto, taiko, the clay folk's bells.
  - **WEST**: the **hexachords** of Guido's hand: the hard (durum) G A B C D E, which begins on G and ends on E; the soft (molle) on F
    with its B flat, for tenderness and memory; the plain (naturale) on C. Strings, flute, brass, harmonica, piano, the guitar.
  - They meet on E G A B D: either can take the tune from the other mid-phrase.
- **The wider world** (the fusion: the game's sound is psychedelic space jazz, esoteric, from everywhere at once). Around the two
  languages, four more voices, one for each suit, and the Five can be said in all of them (`music/world.js`, the wider band):
  - **THE SUBCONTINENT** (swords, Espada): the sitar and its jawari's buzz, the tanpura's drone, the tabla; the raga (Bhairav, whose
    F to E is the Tear) and its forms (alap, jor, gat, jhala, the tihai).
  - **THE ISLANDS** (cups, Calissa): the steel pan, the marimba, calypso's three-three-two; water and sun.
  - **THE AMERICAS** (pentacles and wands, Petra and Wanda): the blues (the electric guitar, the harmonica, the stomp), and jazz out
    in space (the saxophone, the Rhodes, the Moog, a phased guitar, 5/4).
  - **THE SEA** (everyone's): the concertina, the fiddle, the bodhrán, the crew's voices: the shanty.
- **The shapes.** Phrases of five bars and of ten; a five-chord cycle (Em C G D B7); 5/4 for walking music (three and two); runs of
  five notes to the octave; five movements for the main theme and, one day, for the final battle.
- **The tempo ladder** (multiples of 5 and 25): 75 (rest, sorrow, the piano), 100 (walking, the field), 125 (the wild, battle),
  150 (danger, the chase).
- **The black keys**: E flat minor pentatonic is the five black keys of the piano (E flat G flat A flat B flat D flat): five notes, black like
  the Lachryma, and E and G in shadow (E flat, G flat). The main theme (*Lachryma*) and the battle live there; the Dunes' theme was already
  on D sharp, the same key, so the desert and the main theme are kin. The Five plays on them as well as on the white keys.
- **The map of keys**: the regions are a circle of fifths out from E: the workshop in E and G, the dunes on D# (the leading tone of
  E: the desert always waiting to come home), the high places in B (the fifth above), the deep places in A (the fifth below), the
  Lachryma's own in F (a half step above home: the tear).

## 2. The leitmotifs (Kondo's way)

Short enough to hum, each can be played East or West, slow or fast, major or minor, on any instrument.

| Motif | Notes | Means | Heard in |
| --- | --- | --- | --- |
| **The Five** | E D B A G (falling) | the game itself; fortune, the world | the main theme (every movement), the rest jingle |
| **The Answer** | G A B D E (climbing) | hope, discovery, a thing done | the fanfare, the found jingle, the build, the coda's celesta |
| **The Leap** | E5 to E6 | the moment everything turns (the Fool steps off the cliff) | the main theme's climax; *The Fool's Step* (PRESS START: the step off the cliff itself); otherwise saved for the game's biggest moments |
| **The Tear** | F to E (the In scale's half step), over an A minor or an F | Lachryma, loss, the uncanny | the first draft's East answer; for Lachryma places and sorrow |
| **The Fool's Step** | A B C, leap to E | the Courier (the first draft's motif, kept as hers) | to be: the Courier's theme |
| **The System's chime** | G to D (a rising fifth) and E to B (a falling fourth) | the System: notice, warning | the voice's chimes (`audio/voice/voice.js`) |
| **The folk** | each speaker's own scale (Clayese, `npc/clayese.js`) | the clay folk | their voices; their themes will be built on the same scales |
| **Petra's riff** | E E G E A (the A bent toward B flat), low | pentacles: earth, the builder, Main | *Stone and Coin* (`music/motifs.js`) |
| **Wanda's spark** | G D C# D A (up a fifth, the Lydian sigh, a leap) | wands: fire, breath, the music | *Kindling* |
| **Espada's edge** | E F G# B, then C cut down to B (the draw and the cut) | swords: air, the word, the lore | *The Edge of the Word* |
| **Calissa's pour** | B G# E, C# E (a major arpeggio tumbling in 3+3+2, a hop up) | cups: water, beauty, the look | *Overflowing*, *The Shallows* |
| **The siren's call** | down from C6 onto E5, then F E (the Tear) | the sea's lure | *Song of the Siren* |
| **The hex** | E A# B G F# (up the tritone, then a shrug) | the witch's | *Hex and Kettle* |

## 3. The cues

Five groups of cues, as a full-scope JRPG will need them. Status: **made**, *sketch* (an idea with notes), or blank (planned).

### I. The frame

| Cue | When | Tempo / key | Palette | Motifs | Status |
| --- | --- | --- | --- | --- | --- |
| Lachryma (main theme) | the pause | 100 swung, E flat minor pentatonic (the black keys) | Rhodes, upright, brushes and ride, vibes, soprano sax, choir | Five, Answer, Leap (E flat to E flat) | **made** |
| Fool's Fortune (five movements) | the sound test | 75 / 100 (5/4) / 125, E minor, G | piano, shakuhachi, koto, strings, brass, guitar, taiko | Five, Answer, Leap | **made** |
| The Fool's Step (first draft) | the sound test | 140, A minor | the same, with a drop | Fool's Step, Tear | **made** |
| Four Suits and a Fool | the sound test | 100, E minor, home to E major | piano (the Fool), taiko and pizzicato (Petra), shakuhachi (Wanda), koto (Espada), celesta and strings (Calissa) | Five, Answer | **made** |
| Fortune Favours the Fool (the overture) | the title's opening, before The Fool's Precipice (once a session); it hands on to it on the bar line | 150, E minor; the last bar at 100 (dotted quarters at 150 are its quarters) | a hair-metal band: double-tracked power chords, a screaming lead (pinch harmonics, tapping, twin leads), picked bass, a gated snare, toms, gang shouts; synth brass and a supersaw gloss; a choir in the last chorus | Fool's Step (the riff and the chorus), Five (the verse), Answer (the climb, the twin leads) | **made** (`music/overture.js`) |
| The Fool's Precipice | the title, while the Courier sits on the edge (from the first key or click) | 100, E minor | the logo fired (a kiln's roar, a strike, glaze), piano rolling, brushes, upright, flute; the suits' instruments in turn | Fool's Step; the four suits' motifs | **made** (`music/title.js`; the board moves to its bar) |
| The Fall | the title's menu | 100, E minor, through a low-pass | piano, pad, vibes, harp | the Five, slowly | **made** |
| Prologue | the first moments | 75, E minor | piano and a bowed drone | Five, slowly, incomplete (it stops before the G) | |
| Game over | | 75, E minor | piano, one note at a time | the Five, falling and not finishing | |
| Ending | the credits | the main theme's five movements, reorchestrated, ending with the Leap | everything | all of them | |

### II. Places

| Cue | Where | Tempo / key | Palette | Motifs | Status |
| --- | --- | --- | --- | --- | --- |
| Mirage of the Still Water | the Dunes | 84 swung, D# minor pentatonic blues | vibes, ney, Rhodes, brushes, darbuka | (to be woven in: the Five, on D#) | **made** |
| The Workshop | home: the kiln, Saggar | 75, the blues in E | a work song: hammer, foot, breath, washboard; hummed calls and sung answers; harmonica, slide guitar, upright | the Five in the calls | **made** |
| Surface Thoughts, Undertow, The Bottom of the Well | a mind's Well, floors 1 to 3 | 60, E (a drone) | tanpura, drips of bells, breath, a far voice; then the Tear held under it, a heartbeat, the whale, an octatonic celesta; then a sub pedal, a far taiko, a string cluster (E, F, B), a low choir | Tear (floors 2 and 3) | **made** (`music/well.js`) |
| Crude Sea | a hop across the Emocean (the stage; its rail is paced to it) | 160, E minor, 100 bars = 150 s | a trance groove under space jazz: four on the floor, a rolling Moog, a koto arpeggio, a supersaw, a two-step break, the growl, the theremin swooping; sax, brass, choir, whale | Answer (sailing), Tear (the breather), Five (the heavy) | **made** (`music/emocean.js`) |
| The Weir by night | the oasis after dark | 75, B minor (a fifth up) | shakuhachi, harp, crickets | the Five, high and slow | |
| The Field | walking between places | 100 in 5/4, E minor / G | the Path movement grown into its own piece | Five, Answer | *sketch: movement II* |
| The Basement | the lab, tinkering | 125, A minor (a fifth down) | koto ostinato, plucked synth, clock ticks | the Five in diminution | |
| The Kiln's Heart | a dungeon of fire and clay | 125, F (the Tear's key) | taiko, low brass, clay percussion | Tear | |
| The Siege | the raid arena | 150, E minor | taiko ensemble, brass, guitar | Five as a war cry | |
| Solar Skiffing | sailing the dunes | 125, B major | strings, flute, a sail of synth pads | Answer, Leap at the crest of a dune | |
| Haul Away the Fortune | the Solar Skiff (a shanty) | 6/8 (198 in eighths), E Dorian | concertina, crew voices, fiddle, bodhrán, stomps, harmonica | Five and Answer as the refrain | **made** |
| Roll the Moon Down | the Solar Skiff (a halyard shanty; the skiff takes the next work song each time the sail goes up) | 88, G Mixolydian | harmonica calls, crew answers, stomps and grunts on the pull, fiddle, concertina | the moon (the title's) | **made** |
| Leave Her, Lachryma | the end of a voyage (a forebitter) | 3/4 at 84, E minor | fiddle, concertina, upright, crew humming, harp, a wordless voice, harmonica | the Tear at the chorus's end | **made** (sound test) |
| The Shallows | under the water, in the light | 76, E Lydian | Rhodes in eighths, pad, bubbles, vibes, flute, steel pan | Calissa's pour, at half speed | **made** |
| The Deep | far under, and in the Well's Lachryma | 54, the In scale on E | tanpura, whales, a sonar bell, a far choir, a heartbeat, phased chord | the Tear | **made** |

### III. Conflict

| Cue | When | Tempo / key | Palette | Motifs | Status |
| --- | --- | --- | --- | --- | --- |
| Battle (*Five Against Fate*) | a fight | 150, E flat minor | big band: a walking riff, brass stabs and shouts, bongos and timbale, ride, a soprano sax solo, taiko | the Five in the bass (eighths) and the brass (sixteenths) | **made** |
| Clapperjar mischief | the jars, clapping | 125, G major | woodblocks, pizzicato, clay lids, kazoo | Answer, mocked | |
| Boss | a great enemy | 150, E minor and F | everything, low | Tear inside the Five | |
| The chase | running | 150 | snare, strings | the Leap, over and over, never landing | |
| The last battle | the end | five movements | everything | all of them, the Leap at last | |
| Barely Bound | the Lockheart's Opening, a summoning coffin | 7/8 at 138, E (Phrygian over a pedal) | stamped strings on Em(maj7) and F over E, taiko, octatonic celesta, a choir on B and C, brass leaning F on E | Tear (the floor) | **made** (`music/lockheart.js`); lands on E major |
| Spellwheel | the Lockheart's Opening, a casting coffin (the owner's "Magic") | 6/8, E Lydian | harp running up and down, flute, vibes, strings, shaker | | **made**; lands on a harp sweep and bells |
| House Edge | the Lockheart's Opening, a conversion coffin | 176 swung, E minor | walking upright, ride, piano comping (Em9 A13 F#m7b5 B7alt), sax hook, muted brass stabs | | **made**; lands on the jackpot (E6/9, bells) |

### IV. People and feelings

| Cue | Whose | Tempo / key | Palette | Motifs | Status |
| --- | --- | --- | --- | --- | --- |
| The Courier | hers | 100, E minor | solo flute over piano | Fool's Step | |
| Mistress Saggar | the kiln-keeper | 100, G (hexachord) | cello, marimba | her voice's hexachord | |
| Pip | the apprentice | 125, Yo on A | piccolo, pizzicato, nervous | his Yo | |
| Old Grog | the angler | 75, In on E | shakuhachi, bowed bass | Tear | |
| Raku | the treasurer | 100, the soft hexachord on F | harpsichord, muted trumpet | his soft hexachord, crooked | |
| Sorrow | a loss | 75, E minor | piano, then strings | Tear, then the Five | |
| Resolve | the turn | 100, G major | brass chorale | Answer, Leap | |
| Stone and Coin | Petra (pentacles) | 92, the blues in E | electric guitar, harmonica, upright, kit, stomp, shaker, hammer | Petra's riff; the Five in the bridge | **made** |
| Kindling | Wanda (wands) | 144 in 5/4, G Lydian | saxophone, Rhodes, Moog, phased guitar, ride, pad, vibes | Wanda's spark; the Answer | **made** |
| The Edge of the Word | Espada (swords) | 60 / 92 / 112, Bhairav on E | sitar, tanpura, tabla, fiddle, upright | Espada's edge; the Tear | **made** |
| Overflowing | Calissa (cups) | 116, E major | steel pan, marimba, upright, bongos, shaker, timbale, horns | Calissa's pour; the Answer | **made** |
| Song of the Siren | the sea's lure (for a siren, a drowned place, the Well's call) | 6/8 at 132, E Phrygian | wordless voices, harp, waves, low strings, phased guitar, a whale | the siren's call; the Tear | **made** (sound test) |
| Hex and Kettle | the witch's (for a witch, a fortune-teller, the Lockheart's coffins) | 7/8 (2+2+3) at 220, Hungarian minor on E | theremin, pizzicato, Moog, tabla, bubbles, fiddle, a humming choir | the hex | **made** (sound test) |

### V. Jingles and the System

| Cue | When | Notes | Status |
| --- | --- | --- | --- |
| Fanfare of the Five | a battle won, a trial cleared | the Answer as a pickup, up to G, B, home | **made** |
| The Fool's Step | PRESS START: the Courier steps off the hill | the Fool's Step in the brass, then the Leap; the harp falls after them | **made** |
| Found | something precious found | the Answer run up to E6, a bell (the maker's favourite of the three: the model for the rest) | **made** |
| A Place to Rest | a rest, a save | the Five on the piano in G, the flute answering | **made** |
| Skill acquired | the System grants an art | the System's chime, then the Answer in bells | |
| Achievement | the ledger's rule met | the chime and a rising fifth | (the voice's chime exists) |
| Chest, by tier | opening a chest | five tiers: each adds an instrument; the prismatic one the whole band | |
| A fish landed | the Weir | the Answer on the koto | |
| The shop | buying, selling | a five-bar loop, marimba and clarinet | |

## 4. How the music moves with the game

- **Horizontal**: a cue is sections of bars; changes wait for a bar line (or, for a jingle, the next beat) so nothing is cut off
  mid-phrase (`music/arranger.js` already plays section by section; next: a "jump to section at the next bar" call).
- **Vertical**: a place's cue will have layers that fade in with what is happening (exploring, alert, fighting), the way FFXII's
  and Breath of the Wild's field music thickens and thins; the arranger's events will carry a layer tag.
- **Stingers**: a jingle plays over the cue, which ducks under it (the System's voice already ducks the music).
- **Five-bar phrases** make a natural grid for all three.

- **The weather** (Dovina's `game.weather`): the hour sets the density (night thins every cue: drums and bass back), the mood sets the
  colour (a mood layer over the place's cue: wonder a glass pad, mirth a celesta, desire a frame drum, grief a cello, dread a drone with
  the Tear; `music/mood.js`), and the ambience is the weather itself (`audio/ambience.js`). The scale to play along in follows the cue
  that sounds, and the weather's mode only where nothing plays (so the Crucibelle is never wrong). Each track's aspect, for busking:
  `music/aspects.js`.
  An **agate** sky (two moods, the second weaker) plays both sound beds and both mood layers by their shares, and its scale is the stronger mood's
  with the other's signature note borrowed; a **torn** sky (opposites cancelling) has no mode, only the root and the fifth.

## 5. Production notes

- Everything is synthesized when it is played (`music/band.js`, and the wider band in `music/world.js`); nothing is recorded. The instruments are physical models in spirit:
  breath for the winds, a dying string for the koto and the piano, a skin for the taiko.
- **The kick is round and short**: it sits under the drums of the world (taiko first), it never leads.
- **The bass is bowed and plucked, not a drone**: cellos and basses (and pizzicato) carry the bass line; a sine sub sits quietly
  under them. Measured on the main theme's first render: a sustained sub at full level put three quarters of the climax's energy
  below 120 Hz, drove the mix's glue compressor, and left the climax only 2 dB louder *to the ear* than the walking movement.
- **Each section has a level** (`gain` in a score's section), so a climax stands above a verse without every note being rewritten.
- A cue is checked by rendering it offline and measuring its loudness section by section: a climax is about twice the loudness of
  a verse, a jingle is about a verse's.
- `scripts/render_score.mjs` renders a score offline (one pass, its tail) and prints each section's level. References measured with it
  (dB RMS): a jingle or a quiet opening about -31, a theme's body -24 to -29, the battle -17 to -23. Keep the energy below 120 Hz
  under about 45% of the whole: the sitar's first render was at 55%, the jawari's uneven clipper leaving an offset and a rumble
  under every pluck (a high-pass after the buzz took it out).
- **A score can hand on** (`then`): when its sections run out, the next begins on the bar line on the same bus, nothing stopped (the
  overture into the title). A cue that must land on a moment (the Lockheart's) cuts in at once (`lead`, `fadeIn`, `cut`).
- What plays where is one short list, highest first (`music/choose.js`): the title, the Lockheart's Opening, a fight, a dive (Shallows, Deep), the skiff, the
  dunes, the workshop. A dive waits a moment before taking over and before letting go.
- **Loops are rendered seamless** (`scripts/render_score.mjs ... loop`): the looping part twice round, the second kept to the sample, the
  first 10 ms crossfaded from the true continuation (the third time round), with the players' few-ms jitter off. Checked by the jump
  at the seam against the music's own step at that moment (equal is seamless). Delivered as FLAC: MP3 pads its ends with silence.
- The wider band also has a harp, a wordless voice (a vocalise through formants) and a theremin (`music/world.js`).
- **Sounds the ear has to read** (the crystals, `audio/crystal.js`) keep their partials near-harmonic and the fundamental strong, so the
  pitch is heard true (a free bar's 2.32 and 4.25 made it ambiguous, to a pitch detector and to the ear); beating is two tones `beat`
  Hz apart. Checked by measuring: the pitch of each strike against the note asked, the envelope's wobble against `beat`.

## 6. The owner's ear

What the owner replays, and what it asks of this soundtrack: their Spotify playlist *Superlike* (77 songs, about 255 real minutes),
read on 2026-10-05 from Spotify's public embed page. The owner's five favourites (six: a tie) were measured from Spotify's own
30-second previews; the clips and their spectrograms were not kept in the repo.

- **The list.** Nearly all from 2015 on, with emo, bedroom pop, alternative R&B, hyperpop, metalcore, lo-fi trap and math rock all
  mixed, many of the songs collaborations. The songs average 3:19 and none runs past 5:19. The titles name feelings plainly (*Anhedonia, Agoraphobia, Anxious,
  Ad Nauseam, Disposable, Getting Older*) and set them to music that moves: sad words, a groove under them. Alchemy and water run
  through it (*Aqua Regia, Transmutation, Battery Acid, Datura, Electrons*; *Waterfalls Coming Out Your Mouth, Tsunami, Swan Dive*).
  Clean tapped guitar on extended chords (Ichika Nito, Yvette Young), jazz chords (Sting, Sleep Token's *Aqua Regia*), glam theatre
  (Palaye Royale, Crown The Empire), the soft verse that drops into a wall (Sleep Token, Crywolf).
- **The five**, the owner's picks: *Waterfalls Coming Out Your Mouth* (Glass Animals), *DATURA [paroxysm]* (Crywolf), *Agoraphobia*
  (Coletta), *Linoleum* (kmoe), and tied for fifth, *WHY'D YOU HAVE TO GO THERE* and *MOUTHFUL OF SILENCE* (ZIG MENTALITY).
- **What the previews measure** (spectrograms, and levels by `lowshare.sh` and ffmpeg's EBU R128):
  - **Silence as a hit.** Five of the six cut the bass, or everything, for a beat or two and slam back in (*Waterfalls*'s
    drop-outs, *DATURA*'s break, *Linoleum*'s hard cut, *MOUTHFUL OF SILENCE*'s stop). *Agoraphobia* is the other way: a wall, its
    loudness range 0.3 LU.
  - **The bass moves in pitch**: slides and dives (*Waterfalls*'s swoops, *Linoleum*'s dive), not only steps from note to note.
  - **Weight in the bass**: 20 to 56% of the energy under 120 Hz, four of the six above this soundtrack's 45%.
  - **Air**: 1.4 to 12.5% of the energy above 2 kHz (the median about 4.8%). This soundtrack's cues, rendered offline without the
    reverb, have 0.2 to 3.3% (the median 0.6%): about an eighth.
  - **Tempo**: four between 90 and 110 bpm, two near 150 (or a half-time 75).
  - **Keys** could not be read cleanly from 30 real seconds: the notes smear across their neighbours (bends, glides, distortion).
- **The whole list** (75 of the 77 have a preview; *I Still See You* and *forget it* do not). Measured the same way, plus drop-outs
  (the bass or everything 18 dB under its median for a moment) and bass slides (the bass's pitch moving 3 semitones or more in one
  sweep):
  - **Four families** by sound: *the Low Glow* (21 songs: heavy bass, a dark top, a groove: Sleep Token's *Aqua Regia*, half•alive,
    Phantogram), *the Drop* (13: drop-outs, slides, the biggest dynamics: Crywolf, Crown The Empire), *the Band* (18: a band in the
    room, middling everything: Wallows, Tigercub, Sting), *the Wall* (23: bright, dense, a steady loudness: diet lemon, Worry Club).
    Five of the six favourites are in the Low Glow (three) and the Drop (two), which hold 34 of the 75; the other is *Agoraphobia*,
    in the Wall.
  - **What sets the favourites apart from the list**: the bass (a median of 48% under 120 Hz against the list's 32%) and the
    drop-outs (four of the six have them, against 24 of the 75).
  - **What sets the list apart from this soundtrack**: the air (the list's median 7.3% above 2 kHz, its least 1.4%; nine of 17 of
    our cues, rendered offline, have less than that least) and the drums (the list's median percussive share 26%, its least 11%;
    13 of our 17 cues are under 11%). The tempo is no gap: the list's median is 110 bpm, the middle half 96 to 125, as ours.
- **The most-played hundred** (Spotify's own top-songs list for the owner, most likely 2025's: 59 of the 100 are from 2024 and 2025,
  the latest from 2025-08-15; read 2026-10-05). kmoe leads it (6 songs, ranks 1, 2 and 7 among them); 8 of its top 20 are on
  Superlike. Measured the same way, it sounds like Superlike (the same tempo, bass and drums), a little brighter and steadier: the Wall
  holds 45 of the 100, and 26 of the bottom 50. The top ten lean the other way: 4 of them are the Drop (against 14 of the 100). What is
  played all day is bright and dense; what is played most leans to the Drop, and the five favourites (above) to the bass.
- **The all-time hundred and twenty-one** (Spotify's all-time top songs for the owner; 120 measured, read 2026-10-06). A time capsule
  of 2013 to 2019 (42 of the 121 from 2016): pop-punk and the emo revival (Motion City Soundtrack, Farewell Fighter), post-hardcore
  (Bring Me The Horizon, PVRIS), SoundCloud emo rap (XXXTENTACION, nothing,nowhere., Lil Xtra), melodic electronic drops (Porter
  Robinson and Madeon's *Shelter*, ILLENIUM, Aero Chord), alt-pop (EDEN, The Neighbourhood, Chase Atlantic), with Anamanaguchi's
  chiptune, Caravan Palace's electro-swing and The Midnight's synthwave beside them. Its number one is math rock (Strawberry
  Girls' *Swimming Pools*). The Drop holds 31 of the 120, the most of any list so far. *Linoleum* (kmoe) is the one song on all three
  lists. The genres moved in ten years; the ear did not: the same bass (32% under 120 Hz at the median), the same drums (28%), the
  same tempo (about 110 bpm), on every list.
- **2024's hundred** (Spotify's top songs of 2024; 99 measured, read 2026-10-06). The darkest and heaviest list measured: the Low
  Glow and the Drop hold 62 of the 99 (33 and 29), the bass the most (35% under 120 Hz at the median), the air the least (5.8%),
  the drums the most (30%), the tempo the slowest (101 bpm), and the only list whose median song has a drop-out. Not one song is
  shared with 2025 or the all-time list; six are on Superlike. 2025 swung back to the Wall: the ear holds, the songs turn over.
- **What it asks of the music**: proposals only, none made yet, and the owner's word decides. First, by the whole list: more air and more drums.
  - Stops and drop-outs written into the groove.
  - A bass that slides.
  - More air up high: hats, breath, shimmer.
  - A sparkling clean guitar on extended chords.
  - The soft-to-crushing drop (*The Bottom of the Well*, when the FOE shows itself).
  - A looser low-end limit for the moments meant to hit.
- **Open**: the owner is listening to the five again, to name what each does that they could not live without.

## 7. Next

0. (Round 34) Hear *Lachryma*, *The Workshop* and *Five Against Fate*; the battle plays while a slip jelly is after the Courier, the work song in the
   workshop, *Lachryma* on the title.

1. Hear the new main theme; adjust (the balance, the guitar, the 5/4).
2. The Workshop (home) and the Battle: the two cues heard most.
3. The System's skill and achievement jingles, made from its chime and the Answer.
4. The arranger: jumps at the next bar, and layers.
5. (The fusion round) Hear the four suits' themes, the shanty (on the skiff) and the dives (swim under; deeper than about 4.5 m, or in the
   Well, is the Deep). Then: the suits' motifs into the jingles and the folk's themes; the Crucibelle's four voices
   (docs/HANDOFFS.md); the six tool sounds left as placeholders.
7. (Round 43) Hear the overture over the title (it hands on to The Fool's Precipice), the Lockheart's Opening with each kind of coffin
   (a summoning and a conversion coffin wait on their mechanics), and the rhythm mode (`/rhythm`, until a stage stands in a room).
6. (Round 38) Hear the title (the loop, PRESS START, the menu's fall), the shanties on the skiff, the Siren and the Witch. Places for
   the Siren and the Witch when the game grows them; *Leave Her, Lachryma* wants the end of a voyage.
