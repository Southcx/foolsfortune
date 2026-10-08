# Fool's Fortune: the soundtrack

What the music is for, cue by cue, and the rules it is made by. Made cues live in `src/music/` and the Codex's SOUND TEST.
Masters: Hisaishi (the patient ostinato, a melody without ornament), Kondo (the leitmotif as architecture), Yuu Miyashita (acoustic
colour over a modern pulse), Uematsu (themes that return in the last battle), Crywolf (the drop's shape).

## 1. The rule of five

- **Key:** E minor and G major, one key from two sides. The regions sit round the circle of fifths from E: the dunes on D# (the
  leading tone, always waiting to come home), high places in B, deep places in A, Lachryma's own in F (a half step up: the tear).
- **East:** the minyo pentatonic E G A B D; for grief and Lachryma the **In** scale (E F A B C: F to E is the sigh). **West:** Guido's
  hexachords (hard on G, soft on F with its B flat for tenderness, plain on C). They meet on E G A B D.
- **The wider band, a voice a suit:** the subcontinent (Espada: sitar, tanpura, tabla, Bhairav), the islands (Calissa: steel pan,
  marimba, 3+3+2), the Americas (Petra and Wanda: the blues, space jazz in 5/4), the sea (everyone: the shanty).
- **Shapes:** phrases of five and ten bars; 5/4 for walking; tempos on a ladder of 75, 100, 125, 150.
- **The black keys** (E flat minor pentatonic) are the Lachryma's: the main theme and the battle live there.

## 2. The leitmotifs (`music/motifs.js`)

| Motif | Notes | Means |
| --- | --- | --- |
| **The Five** | E D B A G (falling) | the game, fortune |
| **The Answer** | G A B D E (climbing) | hope, a thing done (every jingle, the catch, the garden's tune) |
| **The Leap** | E5 to E6 | the moment everything turns; saved for the biggest |
| **The Tear** | F to E | Lachryma, loss, the uncanny |
| **The Fool's Step** | A B C, leap to E | the Courier (theirs) |
| **The System's chime** | G to D up, E to B down | the System (`audio/voice/voice.js`) |
| **The suits'** | Petra E E G E A~; Wanda G D C# D A; Espada E F G# B, C cut to B; Calissa B G# E C# E | the four divisions |
| **The siren's call**, **the hex** | C6 down onto E5 then F E; E A# B G F# | the sea's lure; the witch's |
| **The Crown** | B C E F E | the Great Slip Jelly's urn crown |
| **The Leviathan** | E F E C B, two slow bars low | the crossing's rogue Leviathan |
| **The Awakening** | E A G B E | a fossil woken; all in the Crucibelle's notes, so the player can play it |
| **The Beacon** | B up to E, a foghorn; then B E G B E turning | the crossing's drowned lighthouse |
| **The Whirl** | E D B D B A G A, to E | the maelstrom: round and down, in its feeling's mode |

## 3. The cues

**Made** (file in `src/music/`):

| Cue | Where | Tempo, key | The idea |
| --- | --- | --- | --- |
| Lachryma | the pause | 100 swung, E flat minor pent. | Rhodes, sax, choir; the Five, the Answer, the Leap (`lachryma.js`) |
| Fool's Fortune; Four Suits and a Fool; Fool's Step | sound test | 75/100/125; 100 | five movements; the suits on their instruments (`fortune.js`, `suits.js`) |
| Fortune Favours the Fool | the title, once a session | 150, E minor | a hair-metal JRPG opening handing on, on the bar line, to the title (`overture.js`) |
| The Fool's Precipice, The Fall | the title, its menu | 100, E minor | the logo fired; the Five slowly under a low-pass (`title.js`) |
| Mirage of the Still Water | the Dunes | 84 swung, D# | vibes, ney, Rhodes, darbuka (`player.js`, `dunes.js`) |
| The Workshop | home | 75, E blues | a work song: hammer, foot, breath, calls and answers (`workshop.js`) |
| Surface Thoughts, Undertow, The Bottom of the Well | the Dunemaw's floors | 60, E drone | drips, breath, a far voice; the Tear and a heartbeat; a sub pedal and a cluster (`well.js`) |
| A Garden in the Jar | the Spirit Garden | 92 swung, E | the day's phase is the section; the draught is the mode, chords and tune (`garden.js`) |
| The Awakening Song | a fossil woken | 96, E | the song on a bell, the answer a fifth up, a held breath, E major (`garden.js`) |
| The Heavenly Kiln | a Firing | 132, E In | gong, taiko thunder, guzheng, erhu, the kiln's roar; more per tier; fired or cooled (`kiln.js`) |
| The Crowned Brood | the Great Slip Jelly | 150, E minor | a section a phase on the bar line: the crown (a layer a crack), the break (a beat of silence, the slam), the Slip Nova on a downbeat, bare (the drop), calving (the Crown in a four-voice canon), the overflow a semitone up, the win; the enrage swallows it (`greatjelly.js`) |
| Crude Sea | a crossing of the Emocean | 160, E minor, a bar 1.5 s | the stage's clock: trance under space jazz with the owner's ear (shimmer, hats, an 808 that slides, holes); bars 62 to 96 the set piece (shoal, pirates under the shanty, the Leviathan); long crossings chain up to three (`emocean.js`) |
| Crude Sea: the Crossing | a crossing as a rollercoaster | 160, a key a leg | a launch, 3 to 6 legs (open, build, a hole, the peak, release) with a 4-bar turn of the rail between them, the arrive. Each leg its key, groove and theme: the shoal (E, the Answer), the Wreckers (A, the shanty), Old Nobody (C#, the Leviathan), the storm wall (E Phrygian, the Five), the graveyard (F, the Beacon), the maelstrom (the feeling's mode, the Whirl), a calm (G, a music box), a bounty (B, the Five as a WANTED poster). The stack thickens with your locks and downs, Rez's way (`legs.js`) |
| Haul Away the Fortune, Roll the Moon Down | the skiff | 6/8; 88 | shanties, a new one each time the sail goes up (`shanty.js`, `shanties.js`) |
| Leave Her, Lachryma; Song of the Siren; Hex and Kettle | sound test | 3/4; 6/8; 7/8 | a forebitter; the sea's lure; the witch |
| The Shallows; The Deep | swimming | 76 Lydian; 54 In | light under water; the Tear far down (`dive.js`) |
| Five Against Fate | a fight | 150, E flat minor | a big band, the Five in the bass and brass (`battle.js`) |
| Barely Bound; Spellwheel; House Edge | the Lockheart's Opening | 7/8; 6/8 Lydian; 176 swung | summoning, casting, conversion; each lands (`lockheart.js`) |
| Stone and Coin; Kindling; The Edge of the Word; Overflowing | the suits' | | Petra, Wanda, Espada, Calissa (`petra.js` ...) |
| Jingles | | | the fanfare, Found, A Place to Rest (`jingles.js`) |

**Planned:** a prologue and a game over (the Five not finishing); the ending (the five movements, the Leap at last); the Weir by
night (B minor); the Siege (the Five as a war cry); the Solar Skiffing trial (each ring a note of the scale); the folk's themes on
their Clayese scales; the System's skill and achievement jingles (the chime and the Answer); chests by tier (an instrument a tier).

## 4. How the music moves with the game

- **On the bar line:** a score follows the game with `jump(section, bar)` (iMUSE): the fight, the garden, the kiln move between
  sections at the next bar; `then` hands one score into the next; `lead`, `fadeIn`, `cut` land a cue on a moment.
- **Vertical:** a bar's events are made when it is laid out, so a layer can read the game (a crack of the crown).
- **What plays where** is one list, highest first (`music/choose.js`): the title; the Lockheart; the kiln, the awakening, the garden;
  the crossing; the Great Slip Jelly; a fight; the Dunemaw's floors; a dive; the skiff; the dunes; the workshop.
- **The weather** (`music/mood.js`): the night thins every cue; the mood lays a layer (wonder a glass pad, mirth a celesta, desire a
  frame drum, grief a cello, dread a drone with the Tear); an agate plays both, a torn sky neither. The Crucibelle plays in the
  cue's scale, or the weather's mode where nothing plays (`game.music.scale()`). A track's aspect for busking: `music/aspects.js`.
- **Played along** (Rez): the rail's lock tones and downs, the catch's sting wait for the music's next sixteenth or beat, in the key
  of the bar sounding (a crossing's legs each have one: a section's `root`).
- **The stack** (Rez's layers): a crossing's cue sounds as many of a leg's eight parts as its phase and your play give it; every lock,
  down and boss part adds heat, which cools a quarter of a part a bar. A boss's peak is the thickest.
- **Under the surface** (the rail's Umbral form): the music and the world through a low-pass, the breach lifting the air back
  (`arranger.setUnder`, `sfx.setUnder`, read from `game.emocean.form`).

## 5. Production rules

- Everything is synthesized as it plays (`band.js`, `world.js`, `rock.js`, `modern.js`); nothing is recorded.
- **Levels:** each section has a `gain`. Rendered offline (`scripts/render_score.mjs`) and measured: a quiet opening or a jingle about
  -31 dB RMS, a theme's body -24 to -29, a fight -17 to -23; a climax about twice a verse.
- **The low end:** under about 45% of the energy below 120 Hz (a looser limit is allowed for a hit). A sustained sub at full level
  once put three quarters of a climax there and flattened it. The upright bass and big taiko are the usual culprits: measure by
  rendering with one instrument dropped.
- **The air:** the owner's music has a median 7% of its energy above 2 kHz; keep hats, shimmer and breath in the busy cues.
- **The kick is round and short; the bass is bowed and plucked**, a quiet sine under it.
- **The hole:** a bar cut at its third beat and a reversed swell into the next downbeat (the owner's favourites all have one).
- **The modern rig** (`modern.js`): `tick`, `ohat`, `snap`, `eight` (the 808, sliding in with `from`), `shimmer`, `twinkle` (clean
  tapped guitar), `reverse`, `whoosh`. Laid over cues as layers, not rescoring (the owner).
- **Loops render seamless** (twice round, the seam crossfaded 10 ms from the true continuation); delivered as FLAC, never MP3.
- **Sounds the ear must read** (the crystals) keep near-harmonic partials and a strong fundamental.
- **Sounds made elsewhere** (`sfx.voiceAt(where, { listener, tag })`, `audio/positional.js`): a co-op sibling's body plays the Courier's
  own sounds, panned to its side and rolled off with distance (gone past 30 m), with its own rate limits.
- **Voices:** the spirits (`audio/spirits.js`) are Chao-like: a small throat, the mood in the tune, the feeling in the leap (mirth a
  major third, wonder a fourth, desire a fifth, grief a minor third, dread a half step).

## 6. The owner's ear (Spotify, read 2026-10-05 and 06; previews measured)

- **Superlike** (77 songs) and the top-songs lists (all-time, 2023, 2024, 2025): emo, bedroom pop, alternative R&B, hyperpop,
  metalcore, math rock, melodic drops. The genres move year to year; the ear does not: about 32% of the energy under 120 Hz, 28%
  percussive, 110 bpm on every list.
- **The five favourites:** *Waterfalls Coming Out Your Mouth* (Glass Animals), *DATURA* (Crywolf), *Agoraphobia* (Coletta),
  *Linoleum* (kmoe, the one song on every list), *WHY'D YOU HAVE TO GO THERE* and *MOUTHFUL OF SILENCE* (ZIG MENTALITY).
- **What sets the favourites apart:** silence as a hit (four of six cut out and slam back, against a third of the list), a bass that
  slides, more bass (48% under 120 Hz).
- **What it asked of this soundtrack, and got:** more air and more drums (this soundtrack's cues had an eighth of the list's air),
  holes, sliding bass, clean tapped guitar, the soft-to-crushing drop. The owner chose Crude Sea's A/B on these grounds.

## 7. Open

- The Dunemaw's places (the pit's hiss, slip rivers, geysers, the stalactite runs' beat) and Strawman's blow:
  `docs/handoffs/everyone/2026-10-06-from-wanda-the-dunemaw-s-sound.md`.
- Petra's placeholders that want real sounds: the Soul Brush and the jet arts, the parries, the Shrine's rest, the sea's extras
  (`docs/handoffs/wanda/`).
- The Spirit Garden's new parts (water running, the rain inside the Jar, the hand's brushes, a cue deepening a Firing):
  `docs/handoffs/wanda/2026-10-07-from-dovina-garden-sound.md`.
- The crossing's maelstrom arena (off the rail) and a bounty's posted stray want their own cues once their runtime exists.
- The settings' save sections (the voice, the music switch, the rhythm offset): waiting on the save's way to carry an adopted key.
