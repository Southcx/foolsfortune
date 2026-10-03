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
| **The System's chime** | G to D (a rising fifth) and E to B (a falling fourth) | the System: notice, warning | the voice's chimes (`system/voice.js`) |
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
- `tools/render_score.mjs` renders a score offline (one pass, its tail) and prints each section's level. References measured with it
  (dB RMS): a jingle or a quiet opening about -31, a theme's body -24 to -29, the battle -17 to -23. Keep the energy below 120 Hz
  under about 45% of the whole: the sitar's first render was at 55%, the jawari's uneven clipper leaving an offset and a rumble
  under every pluck (a high-pass after the buzz took it out).
- What plays where is one short list, highest first (`music/choose.js`): the title, a fight, a dive (Shallows, Deep), the skiff, the
  dunes, the workshop. A dive waits a moment before taking over and before letting go.
- **Loops are rendered seamless** (`tools/render_score.mjs ... loop`): the looping part twice round, the second kept to the sample, the
  first 10 ms crossfaded from the true continuation (the third time round), with the players' few-ms jitter off. Checked by the jump
  at the seam against the music's own step at that moment (equal is seamless). Delivered as FLAC: MP3 pads its ends with silence.
- The wider band also has a harp, a wordless voice (a vocalise through formants) and a theremin (`music/world.js`).
- **Sounds the ear has to read** (the crystals, `audio/crystal.js`) keep their partials near-harmonic and the fundamental strong, so the
  pitch is heard true (a free bar's 2.32 and 4.25 made it ambiguous, to a pitch detector and to the ear); beating is two tones `beat`
  Hz apart. Checked by measuring: the pitch of each strike against the note asked, the envelope's wobble against `beat`.

## 6. Next

0. (Round 34) Hear *Lachryma*, *The Workshop* and *Five Against Fate*; the battle plays while a slip jelly is after the Courier, the work song in the
   workshop, *Lachryma* on the title.

1. Hear the new main theme; adjust (the balance, the guitar, the 5/4).
2. The Workshop (home) and the Battle: the two cues heard most.
3. The System's skill and achievement jingles, made from its chime and the Answer.
4. The arranger: jumps at the next bar, and layers.
5. (The fusion round) Hear the four suits' themes, the shanty (on the skiff) and the dives (swim under; deeper than about 4.5 m, or in the
   Well, is the Deep). Then: the suits' motifs into the jingles and the folk's themes; the Crucibelle's four voices
   (docs/HANDOFFS.md); the six tool sounds left as placeholders.
6. (Round 38) Hear the title (the loop, PRESS START, the menu's fall), the shanties on the skiff, the Siren and the Witch. Places for
   the Siren and the Witch when the game grows them; *Leave Her, Lachryma* wants the end of a voyage.
