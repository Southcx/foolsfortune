// ---------------------------------------------------------------------------------------
// THE SHOP'S WINDOW: a keeper's counter, opened from their talk ("Let's trade."). Left, the SHELF: each good with its picture, its price
// and the stock left (a row of beads: no numbers in the world, but this is a window the player opened). Right, the Courier's PNEUKA BOX,
// each thing they could sell lit with what the keeper would pay. A click buys or sells; at Raku's a right click (or the HAGGLE button
// by the price) talks the price down instead (progress/shop/haggle.js, in his own dialogue window). The line at the top says what a click
// would do before it is clicked, as the box's window does. Esc, or walking away from the keeper, closes it.
//
// Prior art: Old School RuneScape's shop interface (the stock beside the inventory, Value and Buy 1 on a click, the price on hover),
// Recettear's counter, and the look of this game's own Pneuka Box window.
//
//   const ui = new ShopUI(game)   ui.show(shop)   ui.hide()   ui.render()   ui.open
// ---------------------------------------------------------------------------------------
import { SHOPS, shelfOf, worthOf } from './catalogue.js';
import { itemOf } from '../../pneuka/items.js';
import { itemIcon } from '../../pneuka/icons.js';

const CSS = `
#shop { position: fixed; inset: 0; z-index: 9; display: none; align-items: center; justify-content: center; background: rgba(20,9,6,.55); cursor: default; user-select: none; }
#shop.open { display: flex; }
#shop .px { background: #2a140d; border: 1px solid rgba(255,178,122,.5); box-shadow: 0 10px 40px rgba(0,0,0,.6), inset 0 0 0 3px rgba(60,28,18,.9); padding: 16px 18px 12px; color: #f6e2c8;
  max-width: calc(100% - 24px); max-height: calc(100% - 24px); overflow: auto; box-sizing: border-box; }
#shop header { display: flex; align-items: baseline; gap: 14px; margin-bottom: 4px; }
#shop h2 { margin: 0; font-size: 18px; letter-spacing: .22em; color: var(--accent, #ffb27a); font-weight: normal; }
#shop header .sub { opacity: .6; font-size: 11px; letter-spacing: .06em; flex: 1; max-width: 420px; }
#shop .x { cursor: var(--jcur-pointer, pointer); padding: 2px 8px; border: 1px solid rgba(255,178,122,.35); border-radius: 3px; font-size: 11px; letter-spacing: .1em; }
#shop .x:hover { background: rgba(var(--jsel),.35); }
#shop .hover { height: 18px; font-size: 12px; margin: 4px 0 8px; color: #fff1dc; }
#shop .hover b { color: #ffd98a; font-weight: normal; }
#shop .cols { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
#shop .pane { background: rgba(14,6,4,.55); border: 1px solid rgba(255,178,122,.22); border-radius: 4px; padding: 10px; }
#shop .pane h4 { margin: 0 0 8px; font-size: 10px; letter-spacing: .22em; color: #e7c46a; font-weight: normal; display: flex; justify-content: space-between; gap: 12px; }
#shop .shelf { width: 330px; display: grid; gap: 4px; }
#shop .good { display: grid; grid-template-columns: 44px 1fr auto; gap: 8px; align-items: center; padding: 3px 6px 3px 3px; border: 1px solid rgba(255,178,122,.15); border-radius: 3px; background: rgba(40,18,10,.5); cursor: var(--jcur-pointer, pointer); }
#shop .good:hover, #shop .good.sel { border-color: rgba(255,210,150,.75); background: rgba(80,36,20,.8); }
#shop .good.out { opacity: .4; cursor: default; }
#shop .good .ic { width: 44px; height: 44px; position: relative; } #shop .good .ic img { width: 100%; height: 100%; }
#shop .good .nm { font-size: 12px; line-height: 1.3; } #shop .good .nm s { display: block; text-decoration: none; font-size: 9px; letter-spacing: .14em; opacity: .7; }
#shop .beads { display: inline-flex; gap: 2px; margin-top: 3px; } #shop .beads i { width: 5px; height: 5px; border-radius: 50%; background: #ffd98a; } #shop .beads i.no { background: rgba(255,217,138,.18); }
#shop .pr { text-align: right; font-size: 13px; color: #ffd98a; white-space: nowrap; } #shop .pr small { display: block; font-size: 9px; opacity: .6; color: #f6e2c8; letter-spacing: .1em; }
#shop .grid { display: grid; grid-template-columns: repeat(4, 52px); gap: 5px; }
#shop .slot { width: 52px; height: 52px; box-sizing: border-box; border: 1px solid rgba(255,178,122,.18); border-radius: 4px; background: rgba(40,18,10,.75); position: relative; }
#shop .slot.can { cursor: var(--jcur-pointer, pointer); border-color: rgba(255,217,138,.55); } #shop .slot.can:hover { background: rgba(80,36,20,.8); border-color: #ffd98a; }
#shop .slot.no img { opacity: .35; filter: grayscale(.7); }
#shop .slot img { position: absolute; inset: 3px; width: calc(100% - 6px); height: calc(100% - 6px); pointer-events: none; }
#shop .slot .n { position: absolute; left: 3px; top: 1px; font-size: 11px; color: #ffef7a; text-shadow: 1px 1px 0 #000; pointer-events: none; }
#shop .slot .v { position: absolute; right: 3px; bottom: 1px; font-size: 10px; color: #ffef7a; text-shadow: 1px 1px 0 #000; pointer-events: none; }
#shop button { font: inherit; font-size: 10px; letter-spacing: .12em; color: #fff1dc; background: rgba(120,50,30,.6); border: 1px solid rgba(255,178,122,.45); padding: 3px 7px; border-radius: 3px; cursor: var(--jcur-pointer, pointer); margin-top: 3px; }
#shop button:hover { background: rgba(var(--jsel),.55); }
#shop footer { margin-top: 10px; font-size: 10px; letter-spacing: .08em; opacity: .6; display: flex; justify-content: space-between; gap: 20px; }
#shop footer b { color: #ffd98a; font-weight: normal; font-size: 12px; opacity: 1; }
`;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

export class ShopUI {
  constructor(game) {
    this.game = game; this.open = false; this.shop = null;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.root = el('div'); this.root.id = 'shop';
    this.root.addEventListener('mousedown', (e) => e.stopPropagation());
    this.root.addEventListener('contextmenu', (e) => e.preventDefault());
    this.root.addEventListener('click', (e) => { if (e.target === this.root) game.shops.close(); });
    document.body.appendChild(this.root);
    addEventListener('keydown', (e) => { if (this.open && e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); game.shops.close(); } }, true);
    game.theme?.watch?.(this.root, { sound: false, point: '.good, .slot.can, button, .x' });
  }
  show(shop) { this.shop = shop; this.open = true; this.root.classList.add('open'); document.exitPointerLock?.(); this.render(); }
  hide() { this.open = false; this.root.classList.remove('open'); this.root.replaceChildren(); this.onClose?.(); }
  say(html) { if (this.hoverEl) this.hoverEl.innerHTML = html; }
  icon(id) { return itemOf(id) ? `<img src="${itemIcon(this.game, id)}" alt="">` : ''; }

  render() {
    if (!this.open) return;
    const g = this.game, S = g.shops, D = SHOPS[this.shop], box = g.pneuka, keeper = S.keeperName(this.shop);
    this.root.replaceChildren();
    const px = el('div', 'px');
    const head = el('header', '', `<h2>${D.name}</h2><span class="sub">${D.blurb}</span>`);
    const x = el('span', 'x', 'CLOSE (Esc)'); x.onclick = () => S.close(); head.appendChild(x);
    px.appendChild(head);
    this.hoverEl = el('div', 'hover', '&nbsp;'); px.appendChild(this.hoverEl);
    const cols = el('div', 'cols');

    // the shelf
    const shelf = el('div', 'pane'); shelf.appendChild(el('h4', '', `<span>ON THE SHELF</span><span>${D.haggle ? 'right click to haggle' : 'fair prices'}</span>`));
    const list = el('div', 'shelf');
    for (const [id, base] of shelfOf(this.shop)) {
      const it = itemOf(id), n = S.stockOf(this.shop, id), p = S.price(this.shop, id);
      const beads = `<span class="beads">${Array.from({ length: Math.max(base, n) }, (_, k) => `<i class="${k < n ? '' : 'no'}"></i>`).join('')}</span>`;
      const row = el('div', `good${p == null ? ' out' : ''}`, `<div class="ic">${this.icon(id)}</div><div class="nm">${it.name}<s>${it.kind === 'key' ? 'possibilikey' : it.kind}</s>${beads}</div>`);
      const pr = el('div', 'pr', p == null ? 'none left' : `${p}<small>CUBES</small>`);
      if (D.haggle && p != null) { const b = el('button', '', 'HAGGLE'); b.onclick = (e) => { e.stopPropagation(); S.haggle(this.shop, id); }; pr.appendChild(b); }
      row.appendChild(pr);
      row.onmouseenter = () => this.say(p == null ? `${keeper} has no <b>${it.name}</b> left. (It comes back in time.)` : `Buy <b>${it.name}</b> for <b>${p}</b> cubes${D.haggle ? ' · right click: haggle' : ''}`);
      row.onmouseleave = () => this.say('&nbsp;');
      row.onclick = () => { if (p != null) S.buy(this.shop, id); };
      row.oncontextmenu = (e) => { e.preventDefault(); if (D.haggle && p != null) S.haggle(this.shop, id); };
      list.appendChild(row);
    }
    shelf.appendChild(list); cols.appendChild(shelf);

    // their box: what they could sell
    const inv = el('div', 'pane'); inv.appendChild(el('h4', '', `<span>YOUR PNEUKA BOX</span><span>click to sell</span>`));
    const grid = el('div', 'grid');
    box.slots.forEach((s, i) => {
      const it = s && itemOf(s.id), v = it ? S.offer(this.shop, s.id) : 0;
      const d = el('div', `slot${it ? (v ? ' can' : ' no') : ''}`, it ? `${this.icon(s.id)}${s.n > 1 ? `<span class="n">${s.n}</span>` : ''}${v ? `<span class="v">${v}</span>` : ''}` : '');
      if (it) {
        d.onmouseenter = () => this.say(v ? `Sell <b>${it.name}</b> for <b>${v}</b> cubes${v < worthOf(s.id) ? ` <span style="opacity:.6">(it is worth ${worthOf(s.id)})</span>` : ''}` : `${keeper} will not buy <b>${it.name}</b>.`);
        d.onmouseleave = () => this.say('&nbsp;');
        d.onclick = () => { if (v) S.sell(this.shop, i); };
      }
      grid.appendChild(d);
    });
    inv.appendChild(grid); cols.appendChild(inv);
    px.appendChild(cols);
    px.appendChild(el('footer', '', `<span>prices climb as the shelf empties and fall back in time · what a keeper has bought plenty of, it pays less for</span><span>PURSE <b>${g.cubes.balance}</b> cubes</span>`));
    this.root.appendChild(px);
  }
}
