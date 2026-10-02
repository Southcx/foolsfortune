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

export const TRACKS = [
  { id: 'lachryma', score: LACHRYMA, title: 'Lachryma', where: 'the main theme · the title', notes: 'E flat minor pentatonic: the five black keys, black like the Lachryma. Space-fantasy jazz, 100 bpm swung: minor ninths and a B major seven with a raised eleventh, a Rhodes and an upright, brushes and the ride, the Five on the vibraphone, a soprano sax and a choir; six sections, and the Leap at the end, E flat to E flat.' },
  { id: 'battle', score: BATTLE, title: 'Five Against Fate', where: 'the battle · while something is after her', notes: 'Big-band jazz on the black keys at 150: the Five falling in the bass and never stopping, brass on the off-beats, bongos and a timbale over the ride, a soprano sax solo, the brass shouting the Five in sixteenths, a break. After Tank!.' },
  { id: 'workshop', score: WORKSHOP, title: 'The Workshop', where: 'the workshop', notes: 'A work song in the twelve bars of the blues in E, 75 bpm: a hammer on one and a foot on three, a breath before each blow, a washboard; a voice hums the call and the voices answer, then a harmonica and a slide guitar.' },
  { id: 'fortune', score: FORTUNE, title: "Fool's Fortune", where: 'the five movements (the second draft of the main theme)', notes: 'E minor and G major, in five movements (Wind, Path, Wild, Fortune, Return; 75, 100 in 5/4, 125 bpm). The Five (E D B A G, the minyo pentatonic falling) and its answer (G A B D E, climbing the hard hexachord); a piano alone, a koto walking in fives, a forest pulse, a build up the hexachord, the whole band and an octave leap to E6, and home to E major.' },
  { id: 'fanfare', score: FANFARE, title: 'Fanfare of the Five', where: 'a jingle · a battle won, a trial cleared', notes: 'The answer (G A B D E) in the brass as a pickup, up to G, then B, and home.' },
  { id: 'found', score: FOUND, title: 'Found', where: 'a jingle · something precious found', notes: 'The answer run up to E6 on the celesta and the flute, a bell on top.' },
  { id: 'rest', score: REST, title: 'A Place to Rest', where: 'a jingle · a rest, a save', notes: 'The Five slowly on the piano in G major, the flute answering.' },
  { id: 'dunes', score: DUNES, title: 'Mirage of the Still Water', where: 'the Dunes', notes: 'D# minor pentatonic blues, 84 bpm swung. Vibes and a ney over Rhodes, brushes and a darbuka: a lounge at the oasis.' },
  { id: 'suits', score: SUITS, title: 'Four Suits and a Fool', where: 'for the day the makers became five', notes: 'E minor, 100 bpm, five sections of five bars over Em C G D B7. A piano alone plays the Five for the Fool; then each suit comes in on its own instrument, in the order they woke: Petra (pentacles) a taiko and a pizzicato bass walking the Five, Wanda (wands) the shakuhachi climbing the Answer, Espada (swords) the koto running down the Five after each call, Calissa (cups) the celesta pouring over the strings. The four play the Fool\'s tune together and turn home to E major.' },
  { id: 'step', score: FOOLS_STEP, title: "The Fool's Step (first draft)", where: 'the first draft of the main theme', notes: "A minor, 140 bpm: the In scale and the hexachord taking turns, a build and a drop. Kept for comparison." },
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
