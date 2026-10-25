// ---------------------------------------------------------------------------------------
// THE PAUSE MENU'S VERBS ON TOUCH (docs/plans/MOBILE.md 8, 8.2, 8.5: "rare, and it costs a thumb"): the verbs a phone has no tile for,
// as a row of buttons at the top of the pause menu, by what is live as it opens (core/actions.js `live()`): on foot and in the Spirit
// Garden FIRST PERSON (THIRD PERSON when in it); on foot SHOULDER; in the garden PUT BACK; on the Solar Skiff STEP OFF; in a race
// BACK, RESTART and RETIRE; in a puzzle duel GIVE UP. Shown only while the last device is touch: a keyboard has its keys.
//   A KEY VERB (first person Z, shoulder O, step off F, back R, restart Backspace) closes the menu as the finger lands and holds its
//               key until it lifts, so the game reads it the one way it reads every key: a tap is a tap, BACK held past RACE.retire
//               retires, RESTART held in practice rewinds (world/raceway/race.js), as on the keyboard.
//   A CALL      (RETIRE: the race's own end, as /retire; GIVE UP: the duel's yield, a loss; PUT BACK: the planetoid the Pneuka Jar stands
//               on back to its rest shape, as Ctrl+Backspace twice) is the game's own path, closed over a confirm where it loses or
//               destroys something (MOBILE.md 8.2: "never one gesture"): the first tap asks, YES does it, NO puts the row back.
// Words: MOBILE.md's (Espada's to rule). The dress is Calissa's (`#overlay .pv`): plain until then.
//
// Prior art: the pause menus of the mobile ports that keep what the HUD has no room for (Trackmania's restart, one press behind the
// pause; Mario Kart Tour's in-race menu); iOS's destructive action, asked again before it is done.
//
//   new PauseVerbs(game, overlay)   .refresh()   .verbs() -> the ones live now   PAUSE_VERBS
// ---------------------------------------------------------------------------------------
import { sfx } from '../../audio/sfx.js';

/** The verbs in the row's order. `row`: the bindings row it stands for on touch (core/bindings.js; PUT BACK has none: a chord asked twice);
 *  `ctx`: the live context that shows it; `key`: the code held while the finger is down, or `call`: the game's own path; `when`:
 *  narrower still; `confirm`: the question a second tap answers. A `word` may be read from the game. */
export const PAUSE_VERBS = [
  { id: 'view', row: 'view', ctx: ['foot', 'garden'], key: 'KeyZ', word: (g) => (g.player?.fp ? 'THIRD PERSON' : 'FIRST PERSON') },
  { id: 'shoulder', row: 'shoulder', ctx: ['foot'], key: 'KeyO', word: 'SHOULDER' },
  { id: 'putBack', ctx: ['garden'], word: 'PUT BACK', confirm: 'Put this planetoid back as it began?', when: (g) => !!g.realm?.jarBody?.planet,
    call: (g) => { const R = g.realm, P = R?.jarBody?.planet; if (P) R.resetPlanetoid(P); } }, // (undone with UNDO, as Ctrl+Z: realm.js keeps it)
  { id: 'stepOff', row: 'stepOff', ctx: ['skiff'], key: 'KeyF', word: 'STEP OFF' },
  { id: 'back', row: 'toGate', ctx: ['race'], key: 'KeyR', word: 'BACK' },
  { id: 'restart', row: 'restart', ctx: ['race'], key: 'Backspace', word: (g) => (g.race?.mode?.rewind ? 'RESTART (HOLD: REWIND)' : 'RESTART') },
  { id: 'retire', row: 'toGate', ctx: ['race'], word: 'RETIRE', call: (g) => { if (g.race?.running) g.race.end('retired'); } },
  { id: 'giveUp', row: 'duYield', ctx: ['duel'], word: 'GIVE UP', confirm: 'Give up the duel? It counts as a loss.', call: (g) => { if (g.duel?.active) g.duel.yield(); } },
];
/** The least a key is held (real ms), so the frame after reads it down as well as pressed (RESTART is read on its release). */
const LEAST_HELD = 60;

const CSS = `
#overlay .pv { display: none; flex-wrap: wrap; gap: 8px; margin: 0 0 12px; }
#overlay .pv.on { display: flex; }
#overlay .pv .pv-b { min-height: 44px; min-width: 44px; box-sizing: border-box; padding: 0 14px; display: flex; align-items: center; cursor: var(--jcur-pointer, pointer);
  font: 600 13px var(--f-title); letter-spacing: .2em; color: #fff1dc; border: 1px solid rgba(255,178,122,.45); background: rgba(255,178,122,.08); touch-action: none; }
#overlay .pv .pv-ask { font-size: 14px; opacity: .9; align-self: center; margin-right: 4px; }
`;

export class PauseVerbs {
  constructor(game, overlay) {
    this.game = game; this.overlay = overlay; this.asking = null;
    const card = overlay?.querySelector?.('.card'); if (!card) return;
    if (!document.getElementById('pauseverbscss')) { const st = document.createElement('style'); st.id = 'pauseverbscss'; st.textContent = CSS; document.head.appendChild(st); }
    this.row = document.createElement('div'); this.row.className = 'pv';
    card.insertBefore(this.row, card.firstChild);
    this.row.addEventListener('click', (e) => e.stopPropagation()); // (the card's own click resumes the game: the verbs resume it themselves)
    new MutationObserver(() => { if (this.open) this.refresh(); else this.asking = null; }).observe(overlay, { attributes: true, attributeFilter: ['style'] });
  }
  get open() { return this.overlay.style.display !== 'none' && !this.game.title?.active; }
  /** The verbs live now (none off touch). */
  verbs() {
    const g = this.game; if (g.input?.device !== 'touch') return [];
    const L = g.actions?.live?.(); if (!L) return [];
    return PAUSE_VERBS.filter((v) => v.ctx.some((c) => L.has(c)) && (!v.when || v.when(g)));
  }
  refresh() {
    if (!this.row) return;
    const g = this.game, list = this.verbs(), row = this.row;
    row.textContent = '';
    row.classList.toggle('on', list.length > 0);
    const ask = this.asking && list.find((v) => v.id === this.asking);
    if (ask) {
      const q = document.createElement('span'); q.className = 'pv-ask'; q.textContent = ask.confirm;
      row.append(q, this.button('YES', () => this.run(ask)), this.button('NO', () => { this.asking = null; this.refresh(); }));
      return;
    }
    this.asking = null;
    for (const v of list) {
      const word = typeof v.word === 'function' ? v.word(g) : v.word;
      if (v.key) row.append(this.keyButton(word, v.key));
      else row.append(this.button(word, () => { if (v.confirm) { this.asking = v.id; this.refresh(); } else this.run(v); }));
    }
  }
  /** A button that acts on its tap. */
  button(word, act) {
    const b = document.createElement('div'); b.className = 'pv-b'; b.textContent = word;
    b.addEventListener('click', (e) => { e.stopPropagation(); sfx.menuOk?.(); act(); });
    return b;
  }
  /** A button that is its key: the menu closes as the finger lands, the key held until it lifts. */
  keyButton(word, code) {
    const b = document.createElement('div'); b.className = 'pv-b'; b.textContent = word;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const g = this.game, id = e.pointerId, at = performance.now();
      this.resume(); g.input?.hold?.(code, true, true); // (the key's edge: a person pressed it, core/input.js)
      const up = (u) => {
        if (u.pointerId !== id) return;
        removeEventListener('pointerup', up, true); removeEventListener('pointercancel', up, true);
        setTimeout(() => g.input?.hold?.(code, false), Math.max(0, LEAST_HELD - (performance.now() - at)));
      };
      addEventListener('pointerup', up, true); addEventListener('pointercancel', up, true); // (on the window: the menu is gone from under the finger)
    });
    return b;
  }
  /** A call made, the menu closed first (what it ends is seen ending). */
  run(v) { this.asking = null; this.resume(); try { v.call(this.game); } catch (e) { console.warn('pause verb', v.id, e); } }
  /** The game resumed as the card's own click resumes it (main.js: the overlay's click). */
  resume() { if (this.open) this.overlay.click(); }
}
