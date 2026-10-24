// ---------------------------------------------------------------------------------------
// THE TURN CARD: "turn your phone" (docs/plans/MOBILE.md 11.4 and 11.1: iOS Safari cannot lock the orientation, so an action mode held
// upright shows this card instead of the play, and nothing runs under it). Shown when the device is touch, the phone is upright and an
// action mode is up: on foot in the world, the Solar Skiff, the rail. Never over what works upright: a window (the Codex, the Pneuka
// Box, the map, the index, the shop, QAIS, the kiln's, the dialogue box, a reprogramming, the pause menu, the chat line), the god hand,
// the Spirit Garden, a seat at Raku's tables, a puzzle duel, the title and the seal picker.
//
// While it stands the game is held: `game.hudLayout.turnHeld` is true (main.js's modalOpen reads it, so the tick pauses as under the
// Codex) and the bus hears `hud.turn` { on } when it comes and goes. Turned back, the play goes on from where it stood.
//
// The look: a System window in the Clay dress (ui/goalswindow.js clayDress over ui/brineframe.js) over a dark veil, a pixel-art phone
// (ui/icons/hudart.js `hud.phone`, scaled by a whole number) turning a quarter turn under the quarter-turn arrow, and three words in the
// names face. No stock panel, font or button.
//
// Prior art: every mobile game's "rotate your device" screen (Genshin Impact's, Mario Kart Tour's start), iOS's orientation glyph; the
// house's own goals window for the dress.
//
//   new TurnCard(game, layout)   (ui/hudlayout.js builds it)   .check()   .on   TURN_CARD
// ---------------------------------------------------------------------------------------
import { brineFrame } from './brineframe.js';
import { clayDress } from './goalswindow.js';
import { iconEl } from './icons/icons.js';
import { FONT } from './theme.js';

export const TURN_CARD = { words: 'TURN YOUR PHONE', px: 6, turn: 2.4, fade: 0.25 }; // (the words; CSS px an art pixel; real s a turn's loop; the fade)

const CSS = `
.tcard{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;pointer-events:auto;touch-action:none;
  background:radial-gradient(120% 90% at 50% 45%,rgba(46,22,14,.92),rgba(14,6,3,.98));opacity:0;transition:opacity ${TURN_CARD.fade}s}
.tcard.on{opacity:1}
.tcard[hidden]{display:none}
.tc-win{width:min(78vw,calc(150*var(--d)))}
.tc-box{display:flex;align-items:center;justify-content:center}
${clayDress('.tc-win.clay')}
.tc-art{display:flex;align-items:center;justify-content:center;gap:calc(6*var(--d));padding:calc(10*var(--d)) 0 calc(8*var(--d))}
.tc-phone{animation:tc-turn ${TURN_CARD.turn}s cubic-bezier(.5,0,.2,1) infinite;image-rendering:pixelated}
.tc-arrow{align-self:flex-start;image-rendering:pixelated}
@keyframes tc-turn{0%,28%{transform:rotate(0)}58%,90%{transform:rotate(90deg)}100%{transform:rotate(0)}}
.tc-words{font-family:${FONT.title};font-weight:700;font-size:max(16px,calc(10*var(--d)));letter-spacing:.16em;text-align:center;padding:0 0 calc(4*var(--d))}
`;

export class TurnCard {
  constructor(game, layout) {
    this.game = game; this.layout = layout; this.on = false; this.root = null;
    if (typeof document !== 'undefined') layout.on('change', () => this.check());
  }

  build() {
    if (this.root || typeof document === 'undefined') return;
    const s = document.createElement('style'); s.setAttribute('data-turncard', ''); s.textContent = CSS; document.head.appendChild(s);
    const root = (this.root = document.createElement('div')); root.className = 'tcard'; root.hidden = true;
    root.setAttribute('role', 'alertdialog'); root.setAttribute('aria-label', TURN_CARD.words.toLowerCase());
    const win = (this.win = document.createElement('div')); win.className = 'tc-win clay'; root.append(win);
    const f = (this.frame = brineFrame(win));
    const art = document.createElement('div'); art.className = 'tc-art';
    const phone = iconEl('hud.phone', { px: TURN_CARD.px }); phone.classList.add('tc-phone');
    const arrow = iconEl('hud.turn', { px: Math.max(2, TURN_CARD.px - 2) }); arrow.classList.add('tc-arrow');
    const box = document.createElement('span'); box.className = 'tc-box'; // (as wide as the phone is tall: it turns inside it)
    const side = `${Math.max(parseFloat(phone.style.width), parseFloat(phone.style.height))}px`; box.style.width = box.style.height = side; box.append(phone);
    art.append(box, arrow);
    const words = document.createElement('div'); words.className = 'tc-words'; words.textContent = TURN_CARD.words;
    f.body.append(art, words);
    for (const ev of ['pointerdown', 'touchstart', 'mousedown', 'wheel']) root.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }); // (nothing under it is touched)
    document.body.appendChild(root);
  }

  /** What may be played upright: a window, the hand, the garden, Raku's tables, a duel, the title. */
  upright() {
    const g = this.game, B = document.body.classList, ov = document.getElementById('overlay');
    return !!(g.title?.active || g.codex?.open || g.indexMenu?.open || g.cartography?.open || g.pneukaUI?.open || g.shopUI?.open || g.qais?.open
      || g.kilnUI?.open || g.dialogue?.open || g.reprogram?.open || g.sealPicker?.isOpen || g.log?.typing || (ov && ov.style.display !== 'none')
      || g.god?.active || g.godhand?.active || g.realm?.active || g.duel?.active || B.contains('bztable-seated'));
  }

  check() {
    const L = this.layout, want = !!(L.touch && L.portrait && !this.upright());
    if (want === this.on) return;
    this.on = want; L.turnHeld = want;
    if (want) {
      this.build(); if (this.root) { this.win.style.setProperty('--d', `${Math.max(2, Math.round(L.su * 0.5 * 2) / 2)}px`); this.root.hidden = false; requestAnimationFrame(() => this.root?.classList.add('on')); }
    } else if (this.root) { this.root.classList.remove('on'); const r = this.root; setTimeout(() => { if (!this.on) r.hidden = true; }, TURN_CARD.fade * 1000); }
    this.game.events?.emit?.('hud.turn', { on: want });
  }
}
