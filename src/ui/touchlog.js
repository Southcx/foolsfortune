// ---------------------------------------------------------------------------------------
// THE LOG'S TICKER: the log (feedback/gamelog.js, Petra's, untouched) worn on a phone (docs/plans/MOBILE.md 10, Calissa's answers 1).
// On touch it stands top left under the top bar as a two-line ticker, the newest two lines, each on one line, clear of the steering
// thumb; a tap opens it full as a sheet WITH the chat line (South, 2026-10-27: one balloon on the top bar, the ticker the way into the
// chat), and the sheet folds back when the line closes. The log is the only narration, so the
// ticker stays readable: 16 px type, 14 px the least anywhere in it. All of it is CSS under body.hud-touch (ui/hudlayout.js sets the
// class and the ticker's place as --hud-log-x / -y / -w) and one class on the log's own element, `hud-sheet`. On the desk: nothing.
// RETRACTABLE (the owner, 2026-10-26: "the chat log is a little cumbersome and should be retractable"; its tile on the top bar beside MENU,
// South, 2026-10-27: ui/touch/topbar.js `top.log`): a 44 px clay tile (the balloon,
// touch.chat) at the ticker's left end, the ticker beside it; a tap on the tile folds the ticker away to the tile alone, a tap again
// brings it back. IN A DUEL (the duel's phone screen, ui/hudlayout.js): the ticker never stands; LOG opens the sheet over the board and folds it. Kept on this device (save section `touchLog`, scope settings); the chat line opened shows the log whatever the fold.
//
// Prior art: a news ticker (the newest line, one line each, under the masthead); Genshin Impact's and Honkai Star Rail's mobile chat
// preview (two lines at the screen's top that open the full chat on a tap); iOS's sheets (a pane over the view, its own scroll).
//
//   new TouchLog(game, layout)   (ui/hudlayout.js builds it)   .sheet   .setSheet(on)   .folded   .fold(on)
// ---------------------------------------------------------------------------------------

/** The tab's room beside the ticker (CSS px): the tile and its gap. */

const CSS = `
body.hud-touch #chatlog:not(.typing):not(.hud-sheet){left:var(--hud-log-x,12px);top:var(--hud-log-y,60px);bottom:auto;width:var(--hud-log-w,300px);height:auto;
  pointer-events:auto;cursor:pointer;-webkit-tap-highlight-color:transparent}
body.hud-touch #chatlog:not(.typing):not(.hud-sheet) .tabs,body.hud-touch #chatlog:not(.typing):not(.hud-sheet) .foot,
body.hud-touch #chatlog:not(.typing):not(.hud-sheet) .prog{display:none}
body.hud-touch #chatlog:not(.typing):not(.hud-sheet) .body{display:block;flex:none;height:36px;overflow:hidden;padding:2px 6px 2px;font-size:16px;line-height:18px;pointer-events:none}
body.hud-touch #chatlog:not(.typing):not(.hud-sheet) .ln{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.hud-touch #chatlog:not(.typing):not(.hud-sheet) .ts{display:none}
body.hud-touch #chatlog.idle:not(.hud-sheet){opacity:.78}
body.hud-touch #chatlog.hud-sheet{left:calc(var(--safe-l,0px) + 8px);top:var(--hud-log-y,60px);bottom:calc(var(--safe-b,0px) + 8px);height:auto;z-index:40;
  width:calc(100vw - var(--safe-l,0px) - var(--safe-r,0px) - 16px);opacity:1 !important;pointer-events:auto}
body.hud-touch.hud-landscape #chatlog.hud-sheet{width:min(62vw,640px)}
body.hud-touch #chatlog.hud-sheet .body,body.hud-touch #chatlog.mini.hud-sheet .body{display:block;font-size:16px;line-height:20px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
body.hud-touch #chatlog.hud-sheet .tabs{font-size:14px}
body.hud-touch #chatlog.hud-sheet .tab{padding:10px 10px 8px}
body.hud-touch #chatlog .foot{font-size:14px}
body.hud-touch #chatlog.hud-sheet .foot .keys{display:none}
body.hud-touch #chatlog .ts{font-size:14px}
body.hud-touch.log-tab.log-folded #chatlog:not(.typing):not(.hud-sheet){display:none}
body.hud-touch.hud-duel #chatlog:not(.typing):not(.hud-sheet){display:none}
`;

export class TouchLog {
  constructor(game, layout) {
    this.game = game; this.layout = layout; this.sheet = false; this.el = null; this.folded = false; this.tab = null;
    game.save?.section('touchLog', { scope: 'settings', dump: () => ({ folded: this.folded }), load: (d) => { this.folded = !!d?.folded; }, reset: () => { this.folded = false; } });
    if (typeof document === 'undefined') return;
    const s = document.createElement('style'); s.setAttribute('data-touchlog', ''); s.textContent = CSS; document.head.appendChild(s);
    layout.on('change', () => { this.find(); this.setSheet(layout.touch && this.sheet); this.placeTab(); }); // (folded off touch; the ticker's two lines the newest, after its height changed)
    this.find(); this.placeTab();
  }

  /** The tab at the ticker's left end, on touch only; the body's classes say where the ticker stands and whether it is folded. */
  placeTab() {
    const on = !!this.layout.touch, R = this.layout.log, B = document.body.classList;
    B.toggle('log-tab', on); B.toggle('log-folded', on && this.folded);
  }

  /** The ticker folded away to its tab, or brought back; kept on this device. */
  fold(on) {
    this.folded = !!on; if (this.folded) this.setSheet(false);
    this.game.save?.dirty('touchLog'); this.game.events?.emit('touch.log', { folded: this.folded, by: 'courier' });
    this.placeTab();
  }

  /** The log's element, once it exists; a tap on it opens or folds the sheet (a tap on its tabs or its chat line is theirs). */
  find() {
    if (this.el) return this.el;
    const el = document.getElementById('chatlog'); if (!el) return null;
    this.el = el;
    el.addEventListener('click', (e) => {
      if (!this.layout.touch || el.classList.contains('typing')) return;
      if (e.target?.closest?.('.tabs, .line, .min')) return;
      if (this.sheet) { this.setSheet(false); return; }
      this.setSheet(true); this.game.log?.open?.(); // (the log full and its chat line: the ticker is the way in)
    });
    let typing = el.classList.contains('typing'); // (the line closed, by send, Esc or a tap away: the sheet it opened folds with it)
    new MutationObserver(() => { const now = el.classList.contains('typing'); if (typing && !now && this.sheet && !this.layout.duelR) this.setSheet(false); typing = now; }).observe(el, { attributes: true, attributeFilter: ['class'] });
    return el;
  }

  setSheet(on) {
    const el = this.find(); this.sheet = !!on && !!el;
    if (!el) return;
    el.classList.toggle('hud-sheet', this.sheet);
    const body = el.querySelector('.body'); if (body) requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; }); // (the newest in view, as the ticker showed it)
  }
}
