// ---------------------------------------------------------------------------------------
// THE HELP MENU: the pause card's pages (help/pages.js), drawn into the card (index.html #help): a list of the pages down the left, the
// open page on the right, and the arrow keys (or the page keys, or clicking the list) to turn them. Turning a page does not resume
// the game: only BEGIN, or a click outside the card, does (main.js). The page last read is remembered on this machine.
//
// Prior art: the paper manual (one spread a topic, a tab down the edge), the pause-menu manuals of Monster Hunter (Hunter's Notes) and
// Breath of the Wild (its Hints), and the JRPG menu list on the left with the page to its right (Final Fantasy's and Dragon Quest's).
//
//   const help = new HelpMenu(root, isOpen)   help.show(id | index)   help.turn(+1 | -1)   help.render()
// ---------------------------------------------------------------------------------------
import { PAGES, rowsOf, notesOf } from './pages.js';
import { sfx } from '../audio.js';

const KEY = 'foolsfortune.help.page';
const CSS = `
#help { display: flex; gap: 16px; align-items: stretch; min-height: 420px; }
#help .hl { flex: 0 0 168px; display: flex; flex-direction: column; gap: 1px; border-right: 1px solid rgba(255,178,122,.2); padding-right: 10px; }
#help .hl div { cursor: var(--jcur-pointer, pointer); font: 600 11px var(--f-title); letter-spacing: .14em; padding: 3px 6px; opacity: .72; white-space: nowrap; }
#help .hl div:hover { opacity: 1; }
#help .hl div.on { opacity: 1; color: var(--accent); background: rgba(255,178,122,.1); }
#help .hl div b { float: right; font-weight: 600; opacity: .6; letter-spacing: 0; }
#help .hp { flex: 1 1 auto; min-width: 0; }
#help .hp h1 { margin: 0 0 4px; }
#help .hp h1 small { font-size: 12px; letter-spacing: .1em; opacity: .7; margin-left: 8px; }
#help .hp p { margin: 0 0 10px; }
#help .hp td:first-child { width: 32%; padding-right: 10px; }
#help .hp .note { opacity: .82; font-size: 12px; margin: 8px 0 0; }
#help .hp .turn { margin-top: 10px; font-size: 11px; opacity: .55; letter-spacing: .08em; }
@media (max-width: 620px) { #help { flex-direction: column; } #help .hl { flex: 0 0 auto; flex-direction: row; flex-wrap: wrap; border: 0; padding: 0; } }
`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export class HelpMenu {
  /** `root` is the card's #help; `isOpen()` says whether the pause card is up (the keys turn the pages only then). */
  constructor(root, isOpen = () => true) {
    this.root = root; this.isOpen = isOpen;
    let at = 0;
    try { at = Math.max(0, PAGES.findIndex((p) => p.id === localStorage.getItem(KEY))); } catch { /* the first page */ }
    this.at = at;
    if (!document.getElementById('helpcss')) { const st = document.createElement('style'); st.id = 'helpcss'; st.textContent = CSS; document.head.appendChild(st); }
    root.innerHTML = '<div class="hl"></div><div class="hp"></div>';
    this.list = root.querySelector('.hl'); this.page = root.querySelector('.hp');
    this.list.innerHTML = PAGES.map((p, i) => `<div data-i="${i}">${esc(p.title.replace(/^THE /, ''))}${p.key ? `<b>${esc(p.key)}</b>` : ''}</div>`).join('');
    // (a click on the pages turns them and is kept from the card's own click, which resumes the game)
    root.addEventListener('click', (e) => {
      e.stopPropagation();
      const d = e.target.closest?.('[data-i]');
      if (d) this.show(+d.dataset.i);
    });
    addEventListener('keydown', (e) => {
      if (!this.isOpen() || e.repeat && !/Arrow/.test(e.code)) return;
      const d = { ArrowDown: 1, ArrowRight: 1, PageDown: 1, ArrowUp: -1, ArrowLeft: -1, PageUp: -1 }[e.code];
      if (!d) return;
      e.preventDefault(); this.turn(d);
    });
    this.render();
  }

  show(i) {
    if (typeof i === 'string') i = PAGES.findIndex((p) => p.id === i);
    if (!(i >= 0 && i < PAGES.length) || i === this.at) return;
    this.at = i;
    try { localStorage.setItem(KEY, PAGES[i].id); } catch { /* not kept */ }
    sfx.menuMove?.();
    this.render();
  }
  turn(d) { this.show((this.at + d + PAGES.length) % PAGES.length); }

  render() {
    const p = PAGES[this.at];
    for (const d of this.list.children) d.classList.toggle('on', +d.dataset.i === this.at);
    const rows = rowsOf(p).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
    const notes = notesOf(p).map((n) => `<p class="note">${esc(n)}</p>`).join('');
    this.page.innerHTML = `<h1>${esc(p.title)}${p.key ? `<small>${esc(p.key)}</small>` : ''}</h1><p>${esc(p.lead)}</p><table>${rows}</table>${notes}`
      + `<div class="turn">${this.at + 1} / ${PAGES.length} · the arrow keys turn the pages</div>`;
  }
}
