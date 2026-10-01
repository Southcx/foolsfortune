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
- **The shapes.** Phrases of five bars and of ten; a five-chord cycle (Em C G D B7); 5/4 for walking music (three and two); runs of
  five notes to the octave; five movements for the main theme and, one day, for the final battle.
- **The tempo ladder** (multiples of 5 and 25): 75 (rest, sorrow, the piano), 100 (walking, the field), 125 (the wild, battle),
  150 (danger, the chase).
- **The map of keys**: the regions are a circle of fifths out from E: the workshop in E and G, the dunes on D# (the leading tone of
  E: the desert always waiting to come home), the high places in B (the fifth above), the deep places in A (the fifth below), the
  Lachryma's own in F (a half step above home: the tear).

## 2. The leitmotifs (Kondo's way)

Short enough to hum, each can be played East or West, slow or fast, major or minor, on any instrument.

| Motif | Notes | Means | Heard in |
| --- | --- | --- | --- |
| **The Five** | E D B A G (falling) | the game itself; fortune, the world | the main theme (every movement), the rest jingle |
| **The Answer** | G A B D E (climbing) | hope, discovery, a thing done | the fanfare, the found jingle, the build, the coda's celesta |
| **The Leap** | E5 to E6 | the moment everything turns (the Fool steps off the cliff) | the main theme's climax; to be saved for the game's biggest moments |
| **The Tear** | F to E (the In scale's half step), over an A minor or an F | Lachryma, loss, the uncanny | the first draft's East answer; for Lachryma places and sorrow |
| **The Fool's Step** | A B C, leap to E | the Courier (the first draft's motif, kept as hers) | to be: the Courier's theme |
| **The System's chime** | G to D (a rising fifth) and E to B (a falling fourth) | the System: notice, warning | the voice's chimes (`system/voice.js`) |
| **The folk** | each speaker's own scale (Clayese, `npc/clayese.js`) | the clay folk | their voices; their themes will be built on the same scales |

## 3. The cues

Five groups of cues, as a full-scope JRPG will need them. Status: **made**, *sketch* (an idea with notes), or blank (planned).

### I. The frame

| Cue | When | Tempo / key | Palette | Motifs | Status |
| --- | --- | --- | --- | --- | --- |
| Fool's Fortune (main theme) | title, pause | 75 / 100 (5/4) / 125, E minor, G | piano, shakuhachi, koto, strings, brass, guitar, taiko | Five, Answer, Leap | **made** |
| The Fool's Step (first draft) | the sound test | 140, A minor | the same, with a drop | Fool's Step, Tear | **made** |
| Prologue | the first moments | 75, E minor | piano and a bowed drone | Five, slowly, incomplete (it stops before the G) | |
| Game over | | 75, E minor | piano, one note at a time | the Five, falling and not finishing | |
| Ending | the credits | the main theme's five movements, reorchestrated, ending with the Leap | everything | all of them | |

### II. Places

| Cue | Where | Tempo / key | Palette | Motifs | Status |
| --- | --- | --- | --- | --- | --- |
| Mirage of the Still Water | the Dunes | 84 swung, D# minor pentatonic blues | vibes, ney, Rhodes, brushes, darbuka | (to be woven in: the Five, on D#) | **made** |
| The Workshop | home: the kiln, Saggar | 100, G major | marimba, pizzicato, clarinet, koto | Answer; Saggar's hexachord | |
| The Weir by night | the oasis after dark | 75, B minor (a fifth up) | shakuhachi, harp, crickets | the Five, high and slow | |
| The Field | walking between places | 100 in 5/4, E minor / G | the Path movement grown into its own piece | Five, Answer | *sketch: movement II* |
| The Basement | the lab, tinkering | 125, A minor (a fifth down) | koto ostinato, plucked synth, clock ticks | the Five in diminution | |
| The Kiln's Heart | a dungeon of fire and clay | 125, F (the Tear's key) | taiko, low brass, clay percussion | Tear | |
| The Siege | the raid arena | 150, E minor | taiko ensemble, brass, guitar | Five as a war cry | |
| Solar Skiffing | sailing the dunes | 125, B major | strings, flute, a sail of synth pads | Answer, Leap at the crest of a dune | |

### III. Conflict

| Cue | When | Tempo / key | Palette | Motifs | Status |
| --- | --- | --- | --- | --- | --- |
| Battle | a fight | 150, E minor | taiko, strings ostinato, brass stabs, guitar | Five in diminution (sixteenths) | |
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

### V. Jingles and the System

| Cue | When | Notes | Status |
| --- | --- | --- | --- |
| Fanfare of the Five | a battle won, a trial cleared | the Answer as a pickup, up to G, B, home | **made** |
| Found | something precious found | the Answer run up to E6, a bell | **made** |
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

- Everything is synthesized when it is played (`music/band.js`); nothing is recorded. The instruments are physical models in spirit:
  breath for the winds, a dying string for the koto and the piano, a skin for the taiko.
- **The kick is round and short**: it sits under the drums of the world (taiko first), it never leads.
- **The bass is bowed and plucked, not a drone**: cellos and basses (and pizzicato) carry the bass line; a sine sub sits quietly
  under them. Measured on the main theme's first render: a sustained sub at full level put three quarters of the climax's energy
  below 120 Hz, drove the mix's glue compressor, and left the climax only 2 dB louder *to the ear* than the walking movement.
- **Each section has a level** (`gain` in a score's section), so a climax stands above a verse without every note being rewritten.
- A cue is checked by rendering it offline and measuring its loudness section by section: a climax is about twice the loudness of
  a verse, a jingle is about a verse's.

## 6. Next

1. Hear the new main theme; adjust (the balance, the guitar, the 5/4).
2. The Workshop (home) and the Battle: the two cues heard most.
3. The System's skill and achievement jingles, made from its chime and the Answer.
4. The arranger: jumps at the next bar, and layers.
