// ---------------------------------------------------------------------------------------
// THE SOUND TEST: a Codex shelf (B) that lists the game's music and plays any of it, over whatever the place would play, until it
// is stopped (or another is chosen). A JRPG's sound test (Final Fantasy's and Chrono Trigger's music rooms, Kingdom Hearts' jukebox)
// with a line of notes on each track: what it is made of and where it lives. /music <track> in the chat line does the same.
// ---------------------------------------------------------------------------------------
import { FORTUNE } from './fortune.js';
import { LACHRYMA } from './lachryma.js';
import { BATTLE } from './battle.js';
import { WORKSHOP } from './workshop.js';
import { FOOLS_STEP } from './foolsstep.js';
import { DUNES } from './dunes.js';
import { FANFARE, FOUND, REST } from './jingles.js';
import { SUITS } from './suits.js';
import { PETRA } from './petra.js';
import { WANDA } from './wanda.js';
import { ESPADA } from './espada.js';
import { CALISSA } from './calissa.js';
import { SHANTY } from './shanty.js';
import { SHALLOWS, DEEP } from './dive.js';
import { TITLE, THE_STEP, FALL } from './title.js';
import { ROLL_THE_MOON, LEAVE_HER } from './shanties.js';
import { SIREN } from './siren.js';
import { WITCH } from './witch.js';
import { OVERTURE } from './overture.js';
import { CRUDE_SEA, CRUDE_SEA_PIRATES, CRUDE_SEA_LEVIATHAN } from './emocean.js';
import { GREAT_JELLY_TOUR } from './greatjelly.js';
import { WELL_FLOORS } from './well.js';
import { LOCK_CUES, LOCK_LANDED } from './lockheart.js';

export const TRACKS = [
  { id: 'lachryma', score: LACHRYMA, title: 'Lachryma', where: 'the main theme · the title', notes: 'E flat minor pentatonic: the five black keys, black like the Lachryma. Space-fantasy jazz, 100 bpm swung: minor ninths and a B major seven with a raised eleventh, a Rhodes and an upright, brushes and the ride, the Five on the vibraphone, a soprano sax and a choir; six sections, and the Leap at the end, E flat to E flat.' },
  { id: 'battle', score: BATTLE, title: 'Five Against Fate', where: 'the battle · while something is after you', notes: 'Big-band jazz on the black keys at 150: the Five falling in the bass and never stopping, brass on the off-beats, bongos and a timbale over the ride, a soprano sax solo, the brass shouting the Five in sixteenths, a break. After Tank!.' },
  { id: 'workshop', score: WORKSHOP, title: 'The Workshop', where: 'the workshop', notes: 'A work song in the twelve bars of the blues in E, 75 bpm: a hammer on one and a foot on three, a breath before each blow, a washboard; a voice hums the call and the voices answer, then a harmonica and a slide guitar.' },
  { id: 'fortune', score: FORTUNE, title: "Fool's Fortune", where: 'the five movements (the second draft of the main theme)', notes: 'E minor and G major, in five movements (Wind, Path, Wild, Fortune, Return; 75, 100 in 5/4, 125 bpm). The Five (E D B A G, the minyo pentatonic falling) and its answer (G A B D E, climbing the hard hexachord); a piano alone, a koto walking in fives, a forest pulse, a build up the hexachord, the whole band and an octave leap to E6, and home to E major.' },
  { id: 'fanfare', score: FANFARE, title: 'Fanfare of the Five', where: 'a jingle · a battle won, a trial cleared', notes: 'The answer (G A B D E) in the brass as a pickup, up to G, then B, and home.' },
  { id: 'found', score: FOUND, title: 'Found', where: 'a jingle · something precious found', notes: 'The answer run up to E6 on the celesta and the flute, a bell on top.' },
  { id: 'rest', score: REST, title: 'A Place to Rest', where: 'a jingle · a rest, a save', notes: 'The Five slowly on the piano in G major, the flute answering.' },
  { id: 'dunes', score: DUNES, title: 'Mirage of the Still Water', where: 'the Dunes', notes: 'D# minor pentatonic blues, 84 bpm swung. Vibes and a ney over Rhodes, brushes and a darbuka: a lounge at the oasis.' },
  { id: 'suits', score: SUITS, title: 'Four Suits and a Fool', where: 'for the day the makers became five', notes: 'E minor, 100 bpm, five sections of five bars over Em C G D B7. A piano alone plays the Five for the Fool; then each suit comes in on its own instrument, in the order they woke: Petra (pentacles) a taiko and a pizzicato bass walking the Five, Wanda (wands) the shakuhachi climbing the Answer, Espada (swords) the koto running down the Five after each call, Calissa (cups) the celesta pouring over the strings. The four play the Fool\'s tune together and turn home to E major.' },
  { id: 'overture', score: OVERTURE, title: 'Fortune Favours the Fool', where: 'the overture · the title opens with it', notes: 'A JRPG opening played by a hair-metal band, E minor at 150: a pinch-harmonic scream, the Fool\'s Step as the riff, the Five sung by the lead in the verse, a half-time climb up the Answer, the royal road (C D Bm Em) under the chorus, a solo (runs, tapping, twin leads in thirds), stop-time hits and a gang\'s "hey!", and a last chorus with a choir. Then the drums move to dotted quarters, which are the title\'s quarters, and the last chord rings until the logo is struck. After B\'z, Steve Conte and Masahiko Arimachi.' },
  { id: 'title', score: TITLE, title: "The Fool's Precipice", where: 'the title · while the Courier sits on the edge', notes: 'E minor at 100: the logo fired (the kiln roars, a strike, the glaze glitters), then a piano rolling like a music box, brushes, the flute singing the Fool\'s Step; the four suits come by the edge one at a time with their motifs. The board\'s pieces move to it, a step a bar.' },
  { id: 'foolstep', score: THE_STEP, title: "The Fool's Step", where: 'a jingle · PRESS START', notes: 'The Courier stands, the jar yaps twice, the Fool\'s Step in the brass, and the Leap (E5 to E6), kept for this: the Fool stepping off the cliff. The harp falls after her.' },
  { id: 'fall', score: FALL, title: 'The Fall', where: 'the title menu', notes: 'The title\'s harmony with no drums, heard from inside a slow fall (a closed low-pass), the Five on the vibraphone.' },
  { id: 'shanty', score: SHANTY, title: 'Haul Away the Fortune', where: 'the Solar Skiff', notes: 'A shanty in 6/8, E Dorian: a concertina sings the call, the crew answers with the Five falling and the Answer rising, a grunt on every heave; bodhrán and stomping feet; a fiddle takes a jig round, and the last chorus has the harmonica on the tune and the fiddle a third above.' },
  { id: 'moon', score: ROLL_THE_MOON, title: 'Roll the Moon Down', where: 'the Solar Skiff (a halyard shanty)', notes: 'G Mixolydian at 88: the harmonica sings each call and the crew answers in one breath, a stomp and a grunt on every pull; the fiddle doubles the call the second time and the crew sings in thirds; then a concertina round.' },
  { id: 'leaveher', score: LEAVE_HER, title: 'Leave Her, Lachryma', where: 'a forebitter · the end of a voyage', notes: 'A slow waltz in E minor: a fiddle over the concertina\'s oom-pah-pah, the crew humming the chorus with a harp under it, then a voice with no words taking the verse; the chorus ends on the Tear.' },
  { id: 'siren', score: SIREN, title: 'Song of the Siren', where: 'the sea\'s', notes: 'A lullaby that wants you in the water: 6/8, E Phrygian (E minor leaning on F, the Tear in the harmony). A wordless voice slides down from high C and sings the Tear over a harp and the waves; the second time a sister a third below, light through water, a whale far off.' },
  { id: 'witch', score: WITCH, title: 'Hex and Kettle', where: 'the witch\'s', notes: 'In seven (2+2+3) on E\'s Hungarian minor: a pizzicato cauldron, bubbles, a creeping Moog, tabla slaps; the theremin casts the hex (E up the tritone to A#, B, then G, F#); the coven\'s turn gives it to a fiddle with the tritone against it, a choir humming under.' },
  { id: 'shallows', score: SHALLOWS, title: 'The Shallows', where: 'under the water, near the light', notes: 'E Lydian, 76 bpm: a Rhodes rolling in eighths, a pad, bubbles; the vibraphone sings Calissa\'s pour slowed to half speed (the water is the cups\'), then a flute, the steel pan glinting. After Dire, Dire Docks.' },
  { id: 'deep', score: DEEP, title: 'The Deep', where: 'far under the water, and in the Well', notes: 'The In scale at 54 bpm: a tanpura drone, whales calling across it, a sonar\'s bell, a choir far off singing the Tear, a slow heartbeat, a phased chord that swells and goes.' },
  { id: 'petra', score: PETRA, title: 'Stone and Coin', where: "Petra's theme · pentacles, earth", notes: 'Desert blues-rock in E at 92: the riff (E E G E A, the A bent toward the blue note) on an electric guitar over a stomp and a shaker of coins; twelve bars answered by the harmonica, then by the guitar itself; a stop-time bridge where the guitar sings the Five alone.' },
  { id: 'wanda', score: WANDA, title: 'Kindling', where: "Wanda's theme · wands, fire", notes: 'Space jazz in 5/4, G Lydian: the spark (up a fifth, the Lydian sigh, a leap: G D C# D A) on the saxophone over a Rhodes vamp in three and two, a Moog bass, a phased guitar and the ride; the guitar takes the spark at half speed in the burn, and the head comes back in fourths. After Take Five.' },
  { id: 'espada', score: ESPADA, title: 'The Edge of the Word', where: "Espada's theme · swords, the word", notes: 'A raga on Bhairav (E F G# A B C D#) with a tanpura drone: the alap, the jor, the gat over teental where the sitar draws the motif (E F G# B, the cut from C to B), the fiddle answering an octave up, and a jhala that ends with a tihai, the motif three times landing on the one. After Shakti.' },
  { id: 'calissa', score: CALISSA, title: 'Overflowing', where: "Calissa's theme · cups, water", notes: 'Calypso in E at 116: the pour (B G# E, C# E: a major arpeggio tumbling in three, three and two, and a hop back up) on the steel pan, marimba chucking the off-beats, the tresillo on the upright, bongos, shaker and timbale; the bridge climbs the Answer and the horns stab the last verse.' },
  { id: 'step', score: FOOLS_STEP, title: "The Fool's Step (first draft)", where: 'the first draft of the main theme', notes: "A minor, 140 bpm: the In scale and the hexachord taking turns, a build and a drop. Kept for comparison." },
  { id: 'crudesea', score: CRUDE_SEA, title: 'Crude Sea', where: 'a hop across the Emocean · the stage', notes: 'A trance groove under space jazz at 160, a hundred bars that are the stage, with the owner\'s ear laid over it: a calm launch, four on the floor for the first schools with the sax sailing the Answer (its reply different each time round) and a tapped guitar answering the koto, the supersaw opening on the pincer, a two-step break with darters whooshing past, a breather where the choir holds the Tear, the push, the heavy in half time with an 808 sliding under the Five, three holes of held breath, and E major as Margarite comes into sight.' },
  { id: 'crudeseapirates', score: CRUDE_SEA_PIRATES, title: 'Crude Sea: the Pirates', where: 'a crossing\'s set piece: a brig comes for the cargo', notes: 'The same crossing until bar 62, then a brig closing astern, her crew\'s shanty heard from behind and growing, a bow chaser\'s boom every two bars; the broadside duel with the shanty in full over it (the call, the chorus, the jig) and a broadside every two bars; the ram, and from bar 92 the crew singing the chorus home as she sinks or strikes.' },
  { id: 'crudesealeviathan', score: CRUDE_SEA_LEVIATHAN, title: 'Crude Sea: the Leviathan', where: 'a crossing\'s rare set piece: the rogue Leviathan', notes: 'The same crossing until bar 62, then the Leviathan\'s own motif (E, the Tear\'s F, E, C, B, two slow bars at the floor): it breaches and heaves, runs alongside breathing through its gills, sounds while a heartbeat quickens and the sea closes over, and meets you face to face with its motif as the war cry, into B major and home.' },
  { id: 'crownedbrood', score: GREAT_JELLY_TOUR, title: 'The Crowned Brood', where: 'the Great Slip Jelly, at the bottom of the Great Dunemaw', notes: 'The fight in phases, here each once in short: the urn rings; the crown, pressure held, a layer for each crack; the crown bursts on a beat of silence and the drums come in; the clutch wakes, the Slip Nova lands on the downbeat, the eggs hatch; bare, the drop, the motif on the lead guitar; calving, four calves in a four-voice canon; the overflow a semitone up; and E major. (The enrage, The Dunemaw Swallows, is heard only in the fight.)' },
  { id: 'well1', score: WELL_FLOORS[0], title: 'Surface Thoughts', where: "a mind's Well · the first floor", notes: 'A tanpura on E, drips of thought in the pentatonic, a breath, a far voice sinking from E to D.' },
  { id: 'well2', score: WELL_FLOORS[1], title: 'Undertow', where: "a mind's Well · the second floor", notes: 'The Tear (F on E) held soft under the drone, a heartbeat, the whale gliding down, an octatonic celesta that will not resolve.' },
  { id: 'well3', score: WELL_FLOORS[2], title: 'The Bottom of the Well', where: "a mind's Well · the FOE's floor", notes: 'A sub on E, a far taiko like something walking, strings holding E, F and B, the heartbeat quickening, a low choir.' },
  { id: 'bound', score: LOCK_CUES.summoning, title: 'Barely Bound', where: "the Lockheart's Opening · a summoning coffin", notes: 'Contained chaos in 7/8 at 138: strings stamping one chord with the accents moved round the bar (the Augurs), the floor turning between E and F (the Tear made into the ground), taiko, an octatonic glitter of keys, a choir on B and C. It lands on E major.' },
  { id: 'boundout', score: LOCK_LANDED.summoning, title: 'Barely Bound (let out)', where: "the Lockheart's Opening · the landing", notes: 'E major, all at once.' },
  { id: 'spellwheel', score: LOCK_CUES.casting, title: 'Spellwheel', where: "the Lockheart's Opening · a casting coffin", notes: 'Magic, flowing: 6/8 in E Lydian, the harp running up and down, a flute on long notes, the raised fourth the only thing not at rest.' },
  { id: 'spell', score: LOCK_LANDED.casting, title: 'Spellwheel (the spell)', where: "the Lockheart's Opening · the landing", notes: 'A harp sweep and bells, E major with its ninth.' },
  { id: 'houseedge', score: LOCK_CUES.conversion, title: 'House Edge', where: "the Lockheart's Opening · a conversion coffin", notes: 'Casino jazz swung at 176: a walking bass, the ride, the piano\'s Charleston on Em9, A13, F#m7b5 and an altered B7, the sax on the hook, a muted stab pushing into each bar.' },
  { id: 'jackpot', score: LOCK_LANDED.conversion, title: 'House Edge (the jackpot)', where: "the Lockheart's Opening · the landing", notes: 'The brass shout an E six-nine, the bells ring three times, the vibes pour down.' },
];
export const TRACK = Object.fromEntries(TRACKS.map((t) => [t.id, t]));

const CSS = `
#codex .snd { display: flex; flex-direction: column; gap: 8px; }
#codex .snd .trk { display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center; padding: 10px 12px; border: 1px solid rgba(255,178,122,.25); border-radius: 5px; background: rgba(28,13,8,.35); }
#codex .snd .trk.on { border-color: var(--accent); background: rgba(var(--jsel),.28); }
#codex .snd .no { font: 16px var(--f-sys); color: var(--accent); text-align: center; }
#codex .snd b { display: block; font: 600 16px var(--f-title); letter-spacing: .08em; color: #fff1dc; }
#codex .snd s { text-decoration: none; display: block; font: italic 14px var(--f-lore); color: var(--accent); margin: 1px 0 4px; }
#codex .snd p { margin: 0; font-size: 12px; line-height: 1.5; opacity: .85; }
#codex .snd .eq { display: inline-flex; gap: 2px; align-items: flex-end; height: 14px; margin-left: 8px; vertical-align: middle; }
#codex .snd .eq i { width: 3px; background: var(--accent); animation: eqb .7s steps(4) infinite; }
#codex .snd .eq i:nth-child(2) { animation-delay: -.3s; } #codex .snd .eq i:nth-child(3) { animation-delay: -.5s; }
@keyframes eqb { 0% { height: 4px; } 50% { height: 14px; } 100% { height: 7px; } }
`;
let styled = false;

export function renderSoundTest(codex, cx) {
  if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const M = codex.game.music, box = document.createElement('div'); box.className = 'snd';
  const cur = M?.pick;
  TRACKS.forEach((T, i) => {
    const on = cur === T.score;
    const d = document.createElement('div'); d.className = `trk${on ? ' on' : ''}`;
    d.innerHTML = `<div class="no">${String(i + 1).padStart(2, '0')}</div><div><b>${T.title}${on ? '<span class="eq"><i></i><i></i><i></i></span>' : ''}</b><s>${T.where}</s><p>${T.notes}</p></div>`;
    const btn = document.createElement('button'); btn.textContent = on ? 'STOP' : 'PLAY';
    btn.onclick = () => { if (!M) return; if (!M.on) M.setOn(true); M.pick = on ? null : T.score; codex.game.events?.emit('music.pick', { track: on ? null : T.id }); codex.render(); };
    d.appendChild(btn);
    box.appendChild(d);
  });
  const hint = document.createElement('p'); hint.style.cssText = 'opacity:.6;font-size:11px;margin-top:6px';
  hint.textContent = 'A track played here plays everywhere until it is stopped. /music fortune · /music dunes · /music stop in the chat line.';
  box.appendChild(hint);
  cx.appendChild(box);
}
