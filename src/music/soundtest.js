// ---------------------------------------------------------------------------------------
// THE SOUND TEST: a Codex shelf (B) that lists the game's music and plays any of it, over whatever the place would play, until it
// is stopped (or another is chosen). A JRPG's sound test (Final Fantasy's and Chrono Trigger's music rooms, Kingdom Hearts' jukebox)
// with a line of notes on each track: what it is made of and where it lives. /music <track> in the chat line does the same.
// ---------------------------------------------------------------------------------------
import { FORTUNE } from './fortune.js';
import { DUNES } from './dunes.js';

export const TRACKS = [
  { id: 'fortune', score: FORTUNE, title: "Fool's Fortune", where: 'the main theme · the title', notes: 'A minor, 140 bpm. The Fool\'s step (A B C, and a leap to E) heard two ways: the In scale on E (shakuhachi, koto, taiko) and the Guidonian hexachord (harmonica, brass), taking turns, then at once: a build, a breath, a drop with a wailing guitar. The hexachord mutates to its soft form in the breakdown.' },
  { id: 'dunes', score: DUNES, title: 'Mirage of the Still Water', where: 'the Dunes', notes: 'D# minor pentatonic blues, 84 bpm swung. Vibes and a ney over Rhodes, brushes and a darbuka: a lounge at the oasis.' },
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
