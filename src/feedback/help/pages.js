// ---------------------------------------------------------------------------------------
// THE HELP PAGES: what the pause menu (Esc) shows, as data: the keys first, then a page for the core movement, the techs and arts, the
// climbing and the water, and one for each of the Courier's tools and modes. Each page is a TITLE, the KEY that draws the tool (if it
// is one), a LEAD (what it is, in a sentence or two), ROWS of [keys, what they do], and NOTES (what is worth knowing beyond the keys).
// The words are Espada's to edit as strings (CLAUDE.md: Threads); the rows must stay true to the code they describe (each page names its
// module), so a change to a tool's keys is a change here too. Pages that list a tool's songs or arts read them from the tool's own table.
//
// Prior art: the paper manual of the sixth generation (a spread a weapon, the controller drawn once at the front), Monster Hunter's
// Hunter's Notes and Breath of the Wild's Hints (the manual inside the pause, read by topic), and Okami's brush-technique scrolls (a
// page per technique, the stroke drawn).
//
//   PAGES = [{ id, title, key?, src, lead, rows: [[keys, what]], notes?: [text] }]
// ---------------------------------------------------------------------------------------
import { SONGS } from '../../tools/crucibelle/songs.js';
import { TECHNIQUES } from '../../tools/soulbrush/techniques.js';
import { ARTS } from '../../godhand/arts.js';

const songRows = () => Object.values(SONGS).map((s) => [s.notes.join(' '), `${s.name}: ${s.does}`]);
const STROKE = { still: 'a stroke across', bounce: 'a stroke down', circle: 'a circle', bomb: 'a bomb (a circle with a fuse)', spiral: 'a spiral', bolt: 'a lightning bolt', caret: 'a caret ^', vee: 'a V', heart: 'a heart' };

export const PAGES = [
  {
    id: 'keys', title: 'THE KEYS', src: 'main.js',
    lead: 'The workshop on Anagami Island, as a sandbox: break every pot. Needs a keyboard and mouse. Each tool has its own page; this is everything at a glance.',
    rows: [
      ['W A S D · Shift', 'move · sprint (any way but back)'],
      ['Space', 'jump; again in the air, the double jump'],
      ['C', 'crouch; at a run, the slide'],
      ['Z · O', 'first or third person · the other shoulder'],
      ['F · V', 'interact (pick up, push, talk, use) · kick'],
      ['E', 'blink'],
      ['X', 'the Psygun'],
      ['Q · G · J', 'the Sondelass · the Soul Brush · the Veritome'],
      ['K · U · I', 'the Dreamvane · the Crucibelle · the Lockheart'],
      ['Y (the Dunes)', 'Solar Skiffing'],
      ['~', 'the god hand'],
      ['B · P · M', 'the Codex · the Pneuka Box · Mind Mapping (the map)'],
      ['Enter · /', 'the chat line (a slash for commands: /help)'],
      ['Tab', 'the tuning panel; the last checkpoint, the hub, the room set again'],
      ['F2 · F3 · F4', 'the interface off · the performance panel · copy a report'],
    ],
  },
  {
    id: 'move', title: 'THE CORE MOVEMENT', src: 'courier/player.js',
    lead: 'How you move when nothing else is asked of you. Every tech, art and tool leaves it as it is: switch one off and this is what is left.',
    rows: [
      ['W A S D', 'run; Shift to sprint, any way but straight back'],
      ['hold Alt', 'walk'],
      ['Space · Space in the air', 'jump · double jump; into a ledge, you mantle it'],
      ['Space by a wall, hold W', 'wallrun; Space again to jump off the wall'],
      ['C', 'crouch; at a run, a slide (C then Space: the slide-hop, which keeps the speed)'],
      ['Shift in the air', 'air-dash (it costs Lachryma)'],
      ['shoot down in the air', 'recoil jump: the Psygun pushes you up (three shots a jump)'],
    ],
    notes: ['The hole in the south-east corner of the workshop drops to the basement movement lab, built to try all of it; the index console in its hub (F) takes you to any room.'],
  },
  {
    id: 'techs', title: 'TECHS AND ARTS', src: 'courier/moves/',
    lead: 'The Movement Arts are learned by doing (the Codex, B: each art and its variants; set ALL ARTS to ON to use all of them). They add to the core; they never change it.',
    rows: [
      ['E', 'blink: a dodge along the move keys (two charges, the beads)'],
      ['C in the air, looking down', 'ground slam; then Space for the slam jump, or hold C for the slam slide'],
      ['Shift while crouched', 'roll: a dodge with a beat of invulnerability (on its own out of a fall of 20 m or more)'],
      ['land on a pot or clapperjar', 'stomp bounce'],
      ['hold C on slip', 'slip dive: fast, up slip walls; Space launches out'],
      ['C in the air by a wall', 'wall latch: cling a moment, WASD to crawl, Space to kick off'],
      ['F at a small thing', 'pick it up overhead; click throws it, F sets it down'],
      ['hold F at a heavy crate', 'W push, S pull'],
      ['V', 'kick, standing or on the run; timed on something thrown at you, a parry'],
    ],
  },
  {
    id: 'climb', title: 'CLIMBING AND WATER', src: 'courier/moves/ladder.js, hang.js, pole.js, grate.js, swim.js',
    lead: 'What you do when the world gives you something to hold, and when there is no floor.',
    rows: [
      ['walk into a ladder', 'climb: W S, Shift fast, C slide down, Space kick off (the gun stays out at a walk)'],
      ['jump at a ledge, bar or cable', 'hang: A D shimmy, W pull up, C drop, Space kick off; a slanted cable is a zipline'],
      ['walk into a pole, rope or grate', 'climb it: W S, A D round a pole, Shift fast, C slide, Space jump off; under a grate, crawl any way'],
      ['walk onto a beam', 'balance: W S along it, A D step off, Shift a trot that wobbles, Space hops off'],
      ['deep water', 'swim: C dive, Space up (at the edge: hop out), Shift faster'],
    ],
  },
  {
    id: 'psygun', title: 'THE PSYGUN', key: 'X', src: 'tools/psygun/',
    lead: 'Your first tool, worn on the back. It fires Lachryma, and CASTER SHELLS: each a numbered type (TYPE-00 the Cleave to TYPE-10 the Hatch) held in a chamber.',
    rows: [
      ['X', 'draw or holster (firing or aiming draws it)'],
      ['LMB · hold LMB', 'fire · charge, and let go for a piercing beam (Lachryma)'],
      ['hold RMB', 'aim down the sights'],
      ['MMB', 'fire the chambered shell (the seeker: hold to paint targets, let go)'],
      ['1 2 3 … · − · wheel', 'pick a chamber'],
    ],
    notes: [
      'Which shells sit in the chambers is chosen in the Pneuka Box (P, under the Psygun): left click loads the next type, right click lists them all.',
      'Psyguns differ in how many chambers they have and how deep each one is: one is narrow and deep, another wide and shallow.',
    ],
  },
  {
    id: 'sondelass', title: 'THE SONDELASS', key: 'Q', src: 'tools/sondelass/',
    lead: 'One instrument, three shapes: a cutlass, a rod and a hook, its sections sliding between them. Worn on the back.',
    rows: [
      ['Q · 1 2 3', 'draw or stow · CUTLASS, ROD, HOOK'],
      ['CUTLASS: LMB', 'a three-stroke combo'],
      ['RMB tap · RMB hold', 'the Stinger (a lunge) · Blade Mode: time all but stops, the mouse turns the line of the cut, LMB cuts'],
      ['MMB · hold V', 'lock on · guard (in time: a parry)'],
      ['ROD: hold LMB, let go', 'charge and cast the lure; tap LMB to twitch it, the wheel for its depth, RMB sinks it, MMB sounds'],
      ['a fish on', 'A D lean, S haul, W bow, C brace; LMB reels, RMB gives line'],
      ['HOOK: LMB', 'fire the grapnel; hold LMB to reel, hold RMB to pay out, tap RMB to let go, Space to jump off; W A S D pump a swing'],
    ],
  },
  {
    id: 'soulbrush', title: 'THE SOUL BRUSH', key: 'G', src: 'tools/soulbrush/',
    lead: 'A calligrapher\'s brush the size of a club, worn at the hip. It alters things rather than hurting them.',
    rows: [
      ['G', 'draw or stow'],
      ['LMB · hold LMB', 'the club: three blows · on the ground the bristles saturate, then the mode works; in the air, the charge and the slam'],
      ['1 · 2', 'PAINT: spray Lachryma, laying its feeling on the ground · MOP: drink stains and paint into your Lachrymato Bottle'],
      ['RMB tap', 'FLICK: a fan of slip ahead'],
      ['hold RMB', 'the Celestial Brush: the world stops and turns to paper; LMB draws, let go of RMB and the painting takes'],
      ['C at speed', 'the Brush Slide: the same slide, painting slip in your wake; on painted ground it runs on'],
      ['MMB', 'lock on'],
    ],
    notes: () => ['A Lachrymato Bottle worn on the upper back (the Pneuka Box) holds what the mop drinks and feeds your mind below half; a broken shield can crack it. Painted ground gives what stands in it the feeling\'s status. Opt-in arts on the load: /art hover, /art rocket, /art skim.', `What the Celestial Brush knows: ${Object.entries(TECHNIQUES).map(([k, t]) => `${STROKE[k] || k}, ${t.name}`).join('; ')}. Anything else is laid on the world as slip.`],
  },
  {
    id: 'veritome', title: 'THE VERITOME', key: 'J', src: 'tools/veritome/',
    lead: 'A book that is a camera, held open in both hands. A photograph is the truth of a thing; the book is also your bank.',
    rows: [
      ['J', 'draw or stow'],
      ['hold RMB · LMB · wheel', 'raise the lens · expose a plate · zoom'],
      ['1', 'the Flash: dazzles what has eyes, and fills its stun'],
      ['MMB by a stunned mind', 'reprogram it'],
      ['P (with it out)', 'the Pneuka Box, and the bank beside it'],
    ],
    notes: ['The Codex (B, VERITOME) appraises the film, keeps the binder and the bestiary.'],
  },
  {
    id: 'dreamvane', title: 'THE DREAMVANE', key: 'K', src: 'tools/dreamvane/, world/dunes/crystaltuning.js',
    lead: 'A dowsing rod with a pick on its heel and a tuning fork in its crook. It finds Lachryma, takes crystal, and maps the ground; while it is worn, the compass rides at the top of the view.',
    rows: [
      ['K', 'draw or stow'],
      ['LMB', 'the pick'],
      ['hold RMB · wheel', 'dowse: the rod leans toward Lachryma · attune it to one kind'],
      ['RMB tap', 'throw the tuning fork; tap again to call it back'],
      ['MMB', 'the survey: the heel struck down, and what is in sight is mapped'],
    ],
    notes: [
      'Crystal is tuned by ear. Ring the fork into a formation for its note. Then each blow of the pick sounds where it fell: aimed too high, the note is sharp, and too low it is flat; struck from the wrong side, it wavers, and it goes still as you come round to the right one.',
      'Struck at the right height from the right side, the formation opens all at once and pays many times over. Dense formations take many blows and forgive; fragile ones break in a few and reward the ear.',
    ],
  },
  {
    id: 'crucibelle', title: 'THE CRUCIBELLE', key: 'U', src: 'tools/crucibelle/',
    lead: 'A smoking bell held up like a lantern: an amplifier, and the musician is you. Five notes, always in the key of what is playing.',
    rows: () => [
      ['U', 'draw or stow'],
      ['1 – 5 · hold RMB', 'the five notes · an octave up'],
      ['LMB', 'toll the bell: a ring that staggers what is close'],
      ...songRows(),
    ],
    notes: ['Notes on the beat build FEVER, which makes every song stronger and cheaper. What is fitted to the bell (the Pneuka Box) is its voice, and favours some songs.'],
  },
  {
    id: 'lockheart', title: 'THE LOCKHEART', key: 'I', src: 'tools/lockheart/',
    lead: 'A little coffin on a chain at your neck: weaponised luck. It drinks the Lachryma you cannot hold, and opens when it is full.',
    rows: [
      ['I', 'draw or stow'],
      ['hold LMB', 'hoover: loose Lachryma in front of you is drawn in, and from a mind laid low'],
      ['RMB', 'open it (full, and a Possibilikey on its ring)'],
    ],
    notes: ['Up to four keys hang on its charm, used in order (the Pneuka Box: the keyring). Which coffin you wear is which wheel.'],
  },
  {
    id: 'skiff', title: 'SOLAR SKIFFING', key: 'Y', src: 'courier/skiff/skiff.js',
    lead: 'A skiff for the dune sea, sailed like a boat. The Psygun is stowed while you ride.',
    rows: [
      ['Y', 'on foot: summon the board out of the sand (in the Dunes) · riding: recall it into your hand'],
      ['F', 'riding slowly: step off and leave it parked · at a parked board: step on'],
      ['hold W · hold S', 'hoist the sail (it stays up: half up, half speed) · let it down and brake (hoist again quickly: a pump)'],
      ['A D', 'steer'],
      ['hold Space, let go', 'crouch the springs, and hop; in the air A D spin'],
      ['Shift', 'the solar flare: faster, for Lachryma'],
    ],
    notes: ['Strike a wall hard, land too hard or land a spin crooked and you are thrown off: the board stops where it slides, parked.'],
  },
  {
    id: 'godhand', title: 'THE GOD HAND', key: '~', src: 'godhand/',
    lead: 'You change into your Pneuka Jar, and you control a hand over the world. The hand uses God Arts, not tools. God Arts work only in the Zone of Influence: the ground you explored.',
    rows: () => [
      ['~', 'go into the god hand; press again to go out'],
      ['LMB · hold RMB · 1 – 5', 'use the art · the art wheel · pick an art'],
      ['W A S D · Q E · wheel', 'pan · turn · zoom'],
      ['N', 'a survey from your Pneuka Jar'],
      ...ARTS.map((a) => [a.key, `${a.name}: ${a.blurb}`]),
    ],
  },
  {
    id: 'mind', title: 'THE BOX, THE CODEX, THE MAP', src: 'pneuka/, feedback/codex/, feedback/cartography.js, feedback/chat.js',
    lead: 'What you carry, what you know, and where you have been.',
    rows: [
      ['P', 'the Pneuka Box: what you carry and wear (left click uses, right click lists the rest); tools are worn to the belt from here'],
      ['B', 'the Codex: the arts, the ledger and records, the tools, the Veritome\'s binder'],
      ['M', 'Mind Mapping: the map; what is mapped is the Zone of Influence'],
      ['Enter', 'the chat line: words are said aloud, /commands are done (/help lists them)'],
    ],
    notes: ['Everything that happens is written in the log, at the foot of the screen.'],
  },
];

/** A page's rows and notes, made (some read the tools' own tables). */
export const rowsOf = (p) => (typeof p.rows === 'function' ? p.rows() : p.rows);
export const notesOf = (p) => (typeof p.notes === 'function' ? p.notes() : p.notes || []);
