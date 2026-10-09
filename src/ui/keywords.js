// ---------------------------------------------------------------------------------------
// THE KEYWORDS: the twelve genre words the UI explains on hover wherever they stand (docs/plans/CLARITY.md section 5, Dovina's table;
// the words are Espada's to settle, so every label and line here is a placeholder until then). A keyword in text is bold, in the
// window's gold, with its icon before it (ui/icons/keywordart.js), and a hover or a keyboard focus on it opens a small tip: its icon,
// its word, and what it means in one line; it follows its keyword each frame and goes when the keyword does (a window closed or
// drawn again sends no pointerleave: casebook, 2026-10-08). A new mechanic reuses one of these if it can; adding one is a glossary entry first.
//
// Prior art: Slay the Spire's keywords (bold in a card's text, the meaning on hover, one fixed list), Hades' boon text (the keyword in
// its own colour), and the Xbox Accessibility Guidelines 101 and 103 (text a player can read, colour never the only cue: the bold and
// the icon carry it too).
//
//   KEYWORDS[id] = { label, means, icon, forms (RegExp: the word as it stands in a sentence) }
//   keywordEl(id) -> <b class="kw">          the keyword alone: its icon and its word, its tip on hover or focus
//   keyworded(text, { numbers = true }) -> DocumentFragment   a line of plain text with every keyword in it marked, and every number
//                                                               with its unit in the numbers' colour
//   installKeywords()                         its rules, once (the card's install does it)
// ---------------------------------------------------------------------------------------
import { iconEl } from './icons/icons.js';

/** The twelve (CLARITY.md section 5: label and line as Dovina wrote them; Espada's to settle). */
export const KEYWORDS = {
  absorb: { label: 'Absorb', means: 'A shot of your colour is drunk, not taken.', forms: /\babsorb(?:s|ed|ing)?\b/i },
  parry: { label: 'Parry', means: 'Press at the right moment to send it back.', forms: /\bparr(?:y|ies|ied|ying)\b/i },
  bomb: { label: 'Bomb', means: 'Clears shots around you.', forms: /\bbombs?\b/i },
  lockon: { label: 'Lock-on', means: 'Hold to mark targets, release to hit them all.', forms: /\block(?:-| )on\b/i },
  weakpoint: { label: 'Weak point', means: 'Hit here for extra damage.', forms: /\bweak points?\b/i },
  stun: { label: 'Stun', means: 'The target stops for a moment.', forms: /\bstun(?:s|ned|ning)?\b/i },
  energy: { label: 'Energy', means: 'Your Lachryma pool.', forms: /\benergy\b/i },
  cooldown: { label: 'Cooldown', means: 'Wait this long before using it again.', forms: /\bcooldowns?\b/i },
  charges: { label: 'Charges', means: 'Uses per trip.', forms: /\bcharges\b/i },
  hull: { label: 'Hull', means: 'Hits your ship can take.', forms: /\bhull\b/i },
  fuel: { label: 'Fuel', means: 'How far the ship can go.', forms: /\bfuel\b/i },
  passive: { label: 'Passive', means: 'Always on, nothing to press.', forms: /\bpassive\b/i },
};
for (const [id, K] of Object.entries(KEYWORDS)) K.icon = `kw.${id}`;

const CSS = `
.kw { display: inline; font-weight: 800; color: #ffd98a; white-space: nowrap; cursor: help; outline: none; border-radius: 2px; }
.kw .uicon { display: inline-block; image-rendering: pixelated; vertical-align: -2px; margin-right: 2px; }
.kw:focus-visible { box-shadow: 0 0 0 1px #fff1dc; }
.cnum { color: #ffd98a; font-weight: 800; white-space: nowrap; }
#kwtip { position: fixed; z-index: 70; display: none; max-width: 240px; padding: 6px 9px 7px; box-sizing: border-box; pointer-events: none;
  background: linear-gradient(180deg, rgba(var(--jtop, 104,50,32), .98), rgba(var(--jbot, 34,15,9), .98)); border: 1px solid var(--jmid, #b3735a);
  box-shadow: 0 0 0 1px var(--jlo, #1c0d08), 0 6px 16px rgba(0,0,0,.55); color: #f6ead8; font: 500 12px/1.35 var(--f-ui, sans-serif); text-shadow: 1px 1px 0 rgba(8,3,1,.75); }
#kwtip.on { display: block; }
#kwtip header { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; font: 600 13px var(--f-title, serif); letter-spacing: .08em; color: #ffd98a; }
`;
let installed = false, tip = null, tipFor = null, tipFrame = 0;
/** Its rules and its tip, once. */
export function installKeywords() {
  if (installed || typeof document === 'undefined') return; installed = true;
  const st = document.createElement('style'); st.id = 'kwcss'; st.textContent = CSS; document.head.appendChild(st);
  tip = document.createElement('div'); tip.id = 'kwtip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip);
}

/** Put the tip beside the keyword it is for (below it, or above where the window ends), and say whether the keyword is still to be seen. */
function placeTip() {
  const el = tipFor; if (!el || !tip) return false;
  if (!el.isConnected || !el.getClientRects().length) return false; // (the window closed or redrew under it: no pointerleave comes for a thing that is gone)
  const r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
  const x = Math.max(4, Math.min(innerWidth - tw - 4, r.left)), below = r.bottom + 6 + th <= innerHeight;
  tip.style.left = `${Math.round(x)}px`; tip.style.top = `${Math.round(below ? r.bottom + 6 : r.top - th - 6)}px`;
  return true;
}
/** While a tip shows it follows its keyword each frame, and goes with it (a scrolled window, a closed one, a page drawn again). */
function followTip() { tipFrame = 0; if (!tipFor) return; if (placeTip()) tipFrame = requestAnimationFrame(followTip); else hideTip(); }

function showTip(el, id) {
  const K = KEYWORDS[id]; if (!K || !tip) return;
  tip.innerHTML = '';
  const head = document.createElement('header'); head.append(iconEl(K.icon, { px: 2 }), K.label);
  const p = document.createElement('div'); p.textContent = K.means;
  tip.append(head, p); tip.classList.add('on'); tipFor = el;
  placeTip();
  if (!tipFrame) tipFrame = requestAnimationFrame(followTip);
}
/** Hide the tip (of `el` only, when one is named: a keyword losing focus never hides the tip another keyword has opened). */
function hideTip(el = null) {
  if (el && tipFor !== el) return;
  tipFor = null; tip?.classList.remove('on');
  if (tipFrame) { cancelAnimationFrame(tipFrame); tipFrame = 0; }
}

/** A keyword alone: its icon and its word in the gold, the tip on hover or keyboard focus. */
export function keywordEl(id, { label = null } = {}) {
  installKeywords();
  const K = KEYWORDS[id], b = document.createElement('b');
  b.className = 'kw'; b.dataset.kw = id; b.tabIndex = 0; b.setAttribute('aria-describedby', 'kwtip');
  if (!K) { b.textContent = label || id; return b; }
  b.append(iconEl(K.icon, { px: 1 }), label || K.label);
  b.addEventListener('pointerenter', () => showTip(b, id)); b.addEventListener('pointerleave', () => hideTip(b));
  b.addEventListener('focus', () => showTip(b, id)); b.addEventListener('blur', () => hideTip(b));
  return b;
}

// every keyword's forms in one pattern, and a number with its unit (12 m, 50°, 1.5 s, x3, 40%)
const ANY = new RegExp(Object.values(KEYWORDS).map((K) => `(${K.forms.source})`).join('|'), 'gi');
const NUM = /(?:[x×]\d+|\d+(?:\.\d+)?(?:\s?(?:m|s|°|%|cubes?)\b|°)?)/g;
const ORDER = Object.keys(KEYWORDS);

function numbered(frag, text, numbers) {
  if (!numbers) { frag.append(text); return; }
  let at = 0;
  for (const m of text.matchAll(NUM)) {
    if (m.index > at) frag.append(text.slice(at, m.index));
    const s = document.createElement('span'); s.className = 'cnum'; s.textContent = m[0]; frag.append(s);
    at = m.index + m[0].length;
  }
  if (at < text.length) frag.append(text.slice(at));
}

/** A line of plain text with its keywords marked (their own words kept: "locks on" stays "locks on") and its numbers coloured. */
export function keyworded(text = '', { numbers = true } = {}) {
  installKeywords();
  const frag = document.createDocumentFragment(); let at = 0;
  for (const m of String(text).matchAll(ANY)) {
    if (m.index > at) numbered(frag, text.slice(at, m.index), numbers);
    const i = m.slice(1).findIndex((g) => g !== undefined);
    frag.append(keywordEl(ORDER[i], { label: m[0] }));
    at = m.index + m[0].length;
  }
  if (at < text.length) numbered(frag, text.slice(at), numbers);
  return frag;
}
