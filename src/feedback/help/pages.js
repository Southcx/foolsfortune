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
//   PAGES = [{ id, title, key?, src, lead, rows: [[keys, what]], notes?: [text], touch?: { title, lead, rows, notes? } (the page on a phone) }]
// ---------------------------------------------------------------------------------------
import { SONGS } from '../../tools/crucibelle/songs.js';
import { TECHNIQUES } from '../../tools/soulbrush/techniques.js';
import { ARTS } from '../../godhand/arts.js';
import { SUB_GIFTS } from '../../progress/toolpairs.js';

/** What a tool lends as the sub, for its R row (progress/toolpairs.js). */
const lent = (id) => `R: ${SUB_GIFTS[id].verb}, ${SUB_GIFTS[id].does}`;

const songRows = () => Object.values(SONGS).map((s) => [s.notes.join(' '), `${s.name}: ${s.does}`]);
const STROKE = { still: 'a stroke across', bounce: 'a stroke down', circle: 'a circle', bomb: 'a bomb (a circle with a fuse)', spiral: 'a spiral', bolt: 'a lightning bolt', caret: 'a caret ^', vee: 'a V', heart: 'a heart' };

export const PAGES = [
  {
    id: 'keys', title: 'THE KEYS', src: 'main.js',
    lead: 'The workshop on Anagami Island, as a sandbox: break every pot. Needs a keyboard and mouse. Each tool has its own page; this is everything at a glance.',
    rows: [
      ['W A S D · Shift', 'move · sprint (any way but back)'],
      ['Space', 'jump; again in the air, the double jump'],
      ['C', 'crouch, prone, stand (each press); at a run, the slide'],
      ['Z · O', 'first or third person · the other shoulder'],
      ['the arrow keys', 'turn and tilt the camera, as the mouse does (a setting: Tab, Settings)'],
      ['F · V', 'interact (pick up, push, talk, use) · kick, once learned'],
      ['E', 'blink, once learned (the arts are learned by doing: the Codex, B, says how)'],
      ['X · R', 'your main tool, drawn or stowed · your sub tool\'s one verb (which two: the Pneuka Box, P)'],
      ['Y (the Dunes)', 'Solar Skiffing'],
      ['~', 'the god hand'],
      ['B · P · M', 'the Codex · the Pneuka Box · the map'],
      ['Enter · /', 'the chat line (a slash for commands: /help)'],
      ['Tab', 'the tuning panel; the last checkpoint, the hub, the room set again'],
      ['F2 · F3 · F4', 'the interface off · the performance panel · copy a report'],
    ],
    // (on a phone this page is the touch one: feedback/help/menu.js shows `touch` over the page while the last device is touch.
    //  Espada's words, MOBILE.md 4, 8)
    touch: {
      title: 'THE TOUCH CONTROLS',
      lead: 'The workshop on Anagami Island, as a sandbox: break every pot. On a phone your thumbs play it: the left half moves you, the right half looks, and the buttons in the bottom right corner are what the moment asks for.',
      rows: [
        ['the left half', 'move: your thumb lands anywhere and is the stick; push past its ring to sprint'],
        ['the right half', 'look: drag to turn the camera'],
        ['the buttons, bottom right', 'what the moment asks for: on foot JUMP, CROUCH, DASH, and USE (it names what it is used on); with a tool out its verbs and PARRY'],
        ['the strip over them', 'your two tools: tap one to draw it'],
        ['the top bar', 'the Codex, the Pneuka Box, the map, the settings, the chat line and the pause'],
        ['a long press', 'the second verb, where a mouse would right click'],
        ['two fingers', 'in the Spirit Garden and over the god hand: drag to turn, pinch to zoom; tap with two to undo'],
        ['a flick sideways', 'on the Solar Skiff, the shoulder'],
        ['the pause menu', 'first or third person, the other shoulder, stepping off the skiff, a race\'s BACK, RESTART and RETIRE, a duel\'s GIVE UP'],
      ],
    },
  },
  {
    id: 'move', title: 'THE CORE MOVEMENT', src: 'courier/player.js',
    lead: 'How you move when nothing else is asked of you. Every tech, art and tool leaves it as it is: switch one off and this is what is left.',
    rows: [
      ['W A S D', 'run; Shift to sprint, any way but straight back'],
      ['hold Alt', 'walk'],
      ['Space · Space in the air', 'jump · double jump; into a ledge, you mantle it'],
      ['Space by a wall, hold W', 'wallrun; Space again to jump off the wall'],
      ['C', 'crouch, then prone, then stand (each press; Space gets up); at a run, a slide (C then Space: the slide-hop, which keeps the speed)'],
      ['Shift in the air', 'air-dash (it costs Lachryma)'],
      ['shoot down in the air', 'recoil jump: the Psygun pushes you up (three shots a jump)'],
    ],
    notes: ['The hole in the south-east corner of the workshop drops to the basement movement lab, built to try all of it; the index console in its hub (F) takes you to any room.'],
  },
  {
    id: 'techs', title: 'TECHS AND ARTS', src: 'courier/moves/',
    lead: 'The Movement Arts are learned by doing (the Codex, B: each art and its variants; in DEBUG, the LENDS shelf of the Codex lends every one). They add to the core; they never change it.',
    rows: [
      ['E', 'blink: a dodge along the move keys (two charges, the pearls by the Lachrimeter)'],
      ['C in the air, looking down', 'ground slam; then Space for the slam jump, or hold C for the slam slide'],
      ['Shift while crouched', 'roll: a dodge with a beat of invulnerability (on its own out of a fall of 20 m or more)'],
      ['land on a pot or clapperjar', 'stomp bounce'],
      ['hold C in paint', 'Paint Dive: fast, up painted walls; Space launches out'],
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
    id: 'psygun', title: 'THE PSYGUN', src: 'tools/psygun/',
    lead: 'Your first tool, worn on the back. It fires Lachryma, and CASTER SHELLS: each a numbered type (TYPE-00 the Cleave to TYPE-10 the Hatch) held in a chamber.',
    rows: [
      ['X · R', `as your main, draw or holster (firing or aiming draws it) · as your sub, ${lent('psygun')}`],
      ['Q', 'fan the hammer: six shots at once, once learned'],
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
    id: 'sondelass', title: 'THE SONDELASS', src: 'tools/sondelass/',
    lead: 'One instrument, three shapes: a cutlass, a rod and a hook, its sections sliding between them. Worn on the back.',
    rows: [
      ['X · R', `as your main, draw or stow · as your sub, ${lent('sondelass')}`],
      ['1 2 3', 'CUTLASS, ROD, HOOK'],
      ['CUTLASS: LMB', 'the string: four hits, the last looping back to the first'],
      ['RMB', 'the special, at once: the Stinger (a lunge)'],
      ['crouched (C), hold RMB', 'the quick draw: let go for one fast cut, or hold on into Blade Mode: time all but stops, the mouse turns the line of the cut, LMB cuts'],
      ['E', 'blink: cancels any stroke at once, and the next LMB carries the combo on'],
      ['MMB · hold V', 'lock on · guard (in time: a parry)'],
      ['ROD: hold LMB, let go', 'charge and cast the lure; tap LMB to twitch it, the wheel for its depth, RMB sinks it, MMB pings'],
      ['a fish on', 'A D lean, S haul (held: brace), W bow; LMB reels, Shift+LMB cranks, RMB gives line; S then W+LMB pumps'],
      ['ROD: Shift+LMB', 'before a bite, reel the lure home fast'],
      ['HOOK: LMB', 'fire the grappling hook; hold LMB to reel, hold RMB to pay out, tap RMB to let go, Space to jump off; W A S D pump a swing'],
    ],
  },
  {
    id: 'soulbrush', title: 'THE SOUL BRUSH', src: 'tools/soulbrush/',
    lead: 'A calligrapher\'s brush the size of a club, worn at the hip. It alters things rather than hurting them.',
    rows: [
      ['X · R', `as your main, draw or stow · as your sub, ${lent('soulbrush')}`],
      ['LMB · hold LMB', 'the club: three blows · on the ground the bristles saturate, then the mode works; in the air, the charge and the slam'],
      ['1 · 2', 'PAINT: spray Lachryma, laying its feeling on the ground · MOP: drink stains and paint into your Lachrymato Bottle'],
      ['RMB tap', 'FLICK: a fan of paint ahead'],
      ['hold RMB', 'the Celestial Brush: the world stops and turns to paper; LMB draws, let go of RMB and the painting takes'],
      ['C at speed', 'the Brush Slide: the same slide, painting in your wake; on painted ground it runs on'],
      ['MMB', 'lock on'],
    ],
    notes: () => ['A Lachrymato Bottle worn on the upper back (the Pneuka Box) holds what the mop drinks and feeds your mind below half; a broken shield can crack it. Painted ground gives what stands in it the feeling\'s status. Opt-in arts on the load: /art hover, /art rocket, /art skim.', `What the Celestial Brush knows: ${Object.entries(TECHNIQUES).map(([k, t]) => `${STROKE[k] || k}, ${t.name}`).join('; ')}. Anything else is laid on the world as paint.`],
  },
  {
    id: 'veritome', title: 'THE VERITOME', src: 'tools/veritome/',
    lead: 'A book that is a camera, held open in both hands. A photograph is the truth of a thing. It keeps no things: those are the Pneuka Box\'s.',
    rows: [
      ['X · R', `as your main, draw or stow · as your sub, ${lent('veritome')}`],
      ['hold RMB · LMB · wheel', 'raise the lens · take a photo · zoom'],
      ['1', 'the Flash: dazzles what has eyes, and fills its stun'],
      ['MMB by a stunned mind', 'reprogram it'],
      ['a Shrine', 'the Box\'s storage, on the Shrine\'s STORAGE row'],
    ],
    notes: ['The Codex (B, VERITOME) appraises the photos in its memory, keeps the binder and the bestiary.'],
  },
  {
    id: 'dreamvane', title: 'THE DREAMVANE', src: 'tools/dreamvane/, world/dunes/crystaltuning.js',
    lead: 'A dowsing rod with a pick on its heel and a tuning fork in its crook. It finds Lachryma, takes crystal, and maps the ground; while it is worn, the compass rides at the top of the view.',
    rows: [
      ['X · R', `as your main, draw or stow · as your sub, ${lent('dreamvane')}`],
      ['LMB · hold LMB, let go full', 'the pick · the Dreamquake, once learned'],
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
    id: 'crucibelle', title: 'THE CRUCIBELLE', src: 'tools/crucibelle/',
    lead: 'A smoking bell held up like a lantern: an amplifier, and the musician is you. Five notes, always in the key of what is playing.',
    rows: () => [
      ['X · R', `as your main, draw or stow · as your sub, ${lent('crucibelle')}`],
      ['1 – 5 · hold RMB', 'the five notes · an octave up'],
      ['LMB', 'toll the bell: a ring that staggers what is close'],
      ...songRows(),
    ],
    notes: ['Notes on the beat build FEVER, which makes every song stronger and cheaper. What is fitted to the bell (the Pneuka Box) is its voice, and favours some songs.'],
  },
  {
    id: 'lockheart', title: 'THE LOCKHEART', src: 'tools/lockheart/',
    lead: 'A little coffin on a chain at your neck: weaponised luck. It drinks the Lachryma you cannot hold, and opens when it is full.',
    rows: [
      ['X · R', `as your main, draw or stow · as your sub, ${lent('lockheart')}`],
      ['hold LMB', 'vacuum: loose Lachryma in front of you is drawn in, and from a mind laid low'],
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
      ['hold Q · hold E, at speed', 'carve to that side: the board slides and loads in three tiers; let go and it runs out with a push'],
      ['hold LMB · RMB · both, in the air', 'grab the nose · the tail · both; let go before you land'],
      ['C', 'spend a banked flare from your trick combo: a push at once'],
      ['Q Q · E E (the Raceway)', 'the shoulder: a shove to that side'],
    ],
    notes: ['Strike a wall hard, land too hard or land a spin crooked and you are thrown off: the board stops where it slides, parked.'],
    touch: {
      title: 'SOLAR SKIFFING',
      lead: 'A skiff for the dune sea. On a phone the sail fills by itself; your thumbs steer, hop and flare. Hold the phone sideways.',
      rows: [
        ['the skiff button (top bar)', 'in the Dunes: call the board up out of the sand · riding: recall it'],
        ['your left thumb', 'steer: slide from where it lands; past the outer ring, carve to that side, and slide back in for a push'],
        ['hold BRAKE', 'let the sail down and slow'],
        ['hold HOP, let go', 'crouch the springs, and hop; held in the air, glide'],
        ['hold FLARE', 'the solar flare: faster, for Lachryma'],
        ['BOOST', 'shown while a flare is banked from your trick combo: spend it, a push at once'],
        ['NOSE · TAIL', 'in the air, FLARE and BRAKE become the grabs: hold one, or both; let go before you land'],
        ['a swipe on the right half', 'the shoulder (the Raceway): a shove to that side'],
        ['USE', 'at the race board or the start pillar'],
        ['the pause menu', 'step off the board; in a race, BACK to the last gate, RESTART, RETIRE'],
      ],
    },
  },
  {
    id: 'godhand', title: 'THE GOD HAND', key: '~', src: 'godhand/',
    lead: 'You change into your Pneuka Jar, and you control a hand over the world. The hand uses God Arts, not tools. God Arts work only in the explored area: the ground you have explored.',
    rows: () => [
      ['~', 'go into the god hand; press again to go out'],
      ['LMB · hold RMB · 1 – 5', 'use the art · the art wheel · pick an art'],
      ['W A S D · Q E · wheel', 'pan · turn · zoom'],
      ['N', 'a survey from your Pneuka Jar'],
      ...ARTS.map((a) => [a.key, `${a.name}: ${a.blurb}`]),
    ],
    touch: {
      title: 'THE GOD HAND',
      lead: 'You change into your Pneuka Jar, and your finger is a hand over the world. God Arts work only in the explored area: the ground you have explored. Either way up.',
      rows: () => [
        ['one finger on the ground', 'use the art: press, drag, let go'],
        ['the strip', 'the seven domains: tap one for its art, again for its next art'],
        ['a long press', 'the art wheel, where the finger rests: slide to an art and let go'],
        ['hold ALT', 'shown when the art has another way'],
        ['hold SIGN', 'draw a miracle\'s sign with one finger; with ALT held too, an epic\'s'],
        ['two fingers', 'drag to pan · pinch to zoom · twist to turn the view'],
        ['SURVEY (top bar)', 'a survey from your Pneuka Jar'],
        ...ARTS.map((a) => [a.name, a.blurb]),
      ],
    },
  },
  {
    id: 'garden', title: 'THE SPIRIT GARDEN', src: 'world/garden/',
    lead: 'Your Inner Realm is inside your Pneuka Jar: small worlds where your spirits live. Go in at a Shrine. In here, you are your Pneuka Jar, and the mouse is your god hand.',
    rows: [
      ['W A S D', 'hop (hold a direction for a longer hop)'],
      ['Space', 'jump high'],
      ['Q E · wheel', 'turn the camera · zoom (in first person, tilt)'],
      ['Z · `', 'first person · the view from overhead (W A S D moves the view, not the Jar)'],
      ['the mouse · LMB', 'move the god hand · use its art'],
      ['RMB', 'flick a spirit (a scolding)'],
      ['1 – 9 · 0', 'choose an art: grab (and throw), pull, press, smooth, flatten, carve, roughen, water, place · paint'],
      ['R', 'paint: the next ground · water: the next feeling'],
      ['grab: LMB on a feature', 'lift it, and let go over a free plot to move it there'],
      ['paint: LMB · RMB', 'lay the ground (moss, ash, loam, slate, silt) · clear it'],
      ['Shift + wheel · Ctrl + Z', 'the size of a stroke · undo the last stroke'],
      ['Ctrl + Backspace, twice', 'put the planetoid under the hand back as it was'],
      ['F at the shed', 'the Pneuka Box, and the next planetoid to buy; its seed goes in your hand: click in the open sky to set it in the ring'],
      ['F at a spirit', 'its page: feed it, drill, spar at the Chimney, race on a track, take it out with you'],
      ['/name Words', 'name the spirit nearest your hand'],
      ['water: LMB · RMB', 'pour Lachryma · drink it up'],
      ['water: Shift + LMB · Ctrl + LMB · Shift + RMB', 'set a spring · set a drain · take the nearest away'],
      ['F', 'use what is under the chevron (the gate takes you out)'],
      ['P · Esc', 'the Pneuka Box · the pause menu'],
    ],
    notes: [
      'Stand on a launch lotus to fly to the next planetoid.',
      'If you throw your Pneuka Jar too far, it lands back at the gate.',
      'Travel in the garden does not count toward your records.',
      'Water runs downhill, pools, and wears away the ground it runs over. Your Pneuka Jar wades in shallow water and floats in deep water.',
      'A feature counts its ground and the water standing at it as one neighbour each. A spirit vein ends at the highest ground facing the next planetoid, so a ridge you raise moves it.',
      'The Dantian\'s lake takes the feeling of the Lachryma you last drank.',
      'Carve one stroke that closes on itself, 40 m or more, and it is a track for races.',
      'Water held deep on the side facing a linked planetoid spills over to it.',
    ],
    touch: {
      title: 'THE SPIRIT GARDEN',
      lead: 'Your Inner Realm is inside your Pneuka Jar: small worlds where your spirits live. Go in at a Shrine. On a phone your finger is the god hand. Either way up.',
      rows: [
        ['tap the ground (WALK)', 'your Pneuka Jar hops there'],
        ['JUMP', 'jump high: shown while the Jar moves or stands on a launch lotus'],
        ['the art bar', 'WALK first, then the ten arts: tap one to pick it, tap it again to put it down'],
        ['one finger, with an art up', 'use it where you touch: drag for a stroke'],
        ['a long press', 'the second verb, where a mouse would right click: clear the ground, drink water, flick a spirit'],
        ['TURN', 'paint: the next ground · water: the next feeling (or twist two fingers while placing)'],
        ['SPRING · DRAIN', 'beside water: set a spring or a drain'],
        ['the size slider', 'the size of a stroke'],
        ['UNDO', 'undo the last stroke (or tap with two fingers)'],
        ['two fingers', 'drag to turn · pinch to zoom'],
        ['TOP VIEW (top bar)', 'the view from overhead: one finger pans it'],
        ['USE', 'it names what is there: the gate takes you out; SHED, a spirit, the press'],
      ],
    },
  },
  {
    id: 'mind', title: 'THE BOX, THE CODEX, THE MAP', src: 'pneuka/, feedback/codex/, feedback/cartography.js, feedback/chat.js',
    lead: 'What you carry, what you know, and where you have been.',
    rows: [
      ['P', 'the Pneuka Box: what you carry and wear (left click uses, right click lists the rest); tools are worn to the belt from here'],
      ['B', 'the Codex: the arts, the ledger and records, the tools, the Veritome\'s binder'],
      ['M', 'the map; what is mapped is the explored area'],
      ['on the map', 'drag to pan, the wheel or a pinch to zoom (out past an area, to the island; tap an area to go in); a click on charted ground (on touch, a long press) points the Sight there, a right click clears it; the Dreamvane surveys (MMB)'],
      ['Enter', 'the chat line: words are said aloud, /commands are done (/help lists them)'],
    ],
    notes: ['Everything that happens is written in the log, at the foot of the screen.'],
  },
];

/** A page's rows and notes, made (some read the tools' own tables). */
export const rowsOf = (p) => (typeof p.rows === 'function' ? p.rows() : p.rows);
export const notesOf = (p) => (typeof p.notes === 'function' ? p.notes() : p.notes || []);
