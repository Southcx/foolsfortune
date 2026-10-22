// ---------------------------------------------------------------------------------------
// A SIBLING'S LINE IN THE LOG (Petra's round, 2026-10-22: co-op as our chatroom): a line a sibling says (an answer, a letter's answer,
// a division's own words over the chatroom) drawn in its division's colour. The speaker's head ("Calissa", "Petra (from afar)") is set
// in the division's colour, bold, after its suit's mark (a pentacle's coin, the trumps' star, a wand, a cup, a sword: small CSS shapes,
// no font glyphs); the words follow in that colour drawn most of the way to the log's white, so a long line still reads. The text of the
// line is not changed (the log keeps "Name : words", its habit): only how it is drawn.
//
// Prior art: MMO chat channels (World of Warcraft's party and guild colours: who speaks known before the words are read), IRC clients'
// nick colouring (one stable colour a speaker), the tarot's suits as the five divisions' marks (CLAUDE.md, Threads).
//
//   speakerLine(el, line)   (feedback/gamelog.js build(): `line.who` a sibling id, `line.text` "Head : words"; fills `el`, words last)
//   SPEAKER_LOOK[id] = { color, suit }   (from coop/party.js SIBLINGS)
// ---------------------------------------------------------------------------------------
import { SIBLINGS } from '../coop/party.js';

const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
const toward = (c, k) => { const ch = (s) => Math.round(((c >> s) & 255) + (255 - ((c >> s) & 255)) * k); return hex((ch(16) << 16) | (ch(8) << 8) | ch(0)); };
const WORDS_K = 0.62; // (how far the words go toward white: the colour still tells, the line still reads over the world)

export const SPEAKER_LOOK = Object.fromEntries(SIBLINGS.map((s) => [s.id, { color: hex(s.color), words: toward(s.color, WORDS_K), suit: s.suit }]));

// each suit's mark as a clip-path (a 10 x 10 box): the coin a disc with the pentacle cut in it, the star, the wand a staff with its bud,
// the cup a bowl on a stem, the sword a blade over a guard
const SUIT_CLIP = {
  pentacles: 'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
  trumps: 'polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)',
  wands: 'polygon(42% 0,58% 0,58% 18%,72% 26%,58% 34%,58% 100%,42% 100%,42% 34%,28% 26%,42% 18%)',
  cups: 'polygon(6% 4%,94% 4%,86% 40%,62% 58%,58% 82%,80% 100%,20% 100%,42% 82%,38% 58%,14% 40%)',
  swords: 'polygon(50% 0,60% 14%,58% 66%,82% 66%,82% 76%,57% 76%,57% 100%,43% 100%,43% 76%,18% 76%,18% 66%,42% 66%,40% 14%)',
};

const CSS = `
#chatlog .ln.sib .who{font-weight:700;color:var(--who)}
#chatlog .ln.sib .who::before{content:'';display:inline-block;width:.62em;height:.62em;margin:0 .32em 0 0;vertical-align:.02em;background:var(--who);
  clip-path:var(--mark);filter:drop-shadow(0 0 1px #000)}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-siblingline', ''); s.textContent = CSS; document.head.appendChild(s);
}

/** Fill a log line's element: its time stamp is already in it; the head in the division's colour, then the words (the last child, so
 *  a folded repeat that rewrites `lastChild` rewrites the words). A line whose text has no "Head : " is drawn whole in the words' colour. */
export function speakerLine(el, line) {
  const L = SPEAKER_LOOK[line.who]; if (!L) { el.append(document.createTextNode(line.text)); return el; }
  style();
  el.classList.add('sib');
  el.style.setProperty('--who', L.color); el.style.setProperty('--mark', SUIT_CLIP[L.suit] || 'none'); el.style.color = L.words;
  const cut = line.text.indexOf(' : ');
  if (cut > 0) { const who = document.createElement('span'); who.className = 'who'; who.textContent = line.text.slice(0, cut); el.append(who, document.createTextNode(line.text.slice(cut))); }
  else el.append(document.createTextNode(line.text));
  return el;
}
