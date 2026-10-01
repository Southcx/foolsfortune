// ---------------------------------------------------------------------------------------
// THE VERITOME'S SHELF in the Codex (B): the Book's binder and the Compendium.
//
//  - THE BINDER: twenty-two designated pages, 0 to XXI. A page with its card shows the card (its art, its rank, how many copies of its
//    limit), and a spare copy can be GAINED from here into the hand while the Veritome is out (Greed Island's "Gain"). An empty page
//    shows the Book's back and only the sitting's riddle: what to photograph.
//  - THE COMPENDIUM: the best photograph of every kind of thing, with its stars (Breath of the Wild's Compendium, Pokémon Snap's album).
//
// Prior art: Greed Island's binder (numbered designated slots, free slots, ranks and limits, Hunter x Hunter), FFXIV's card UI for the
// Astrologian, and the Hyrule Compendium.
// ---------------------------------------------------------------------------------------
import { ARCANA, ARCANA_BY_ID, SEALS, cardArt } from './arcana.js';
import { FREE_SLOTS } from './book.js';
import { SUBJECTS } from './subjects.js';

const CSS = `
#codex .vt { display: grid; grid-template-columns: 1fr 260px; gap: 16px; }
@media (max-width: 760px) { #codex .vt { grid-template-columns: 1fr; } }
#codex .vt .binder { display: grid; grid-template-columns: repeat(auto-fill, minmax(62px, 1fr)); gap: 8px; }
#codex .vt .slot { position: relative; cursor: pointer; border-radius: 5px; padding: 2px; border: 1px solid transparent; }
#codex .vt .slot.sel { border-color: var(--accent); background: rgba(196,106,69,.25); }
#codex .vt .slot canvas { width: 100%; display: block; border-radius: 4px; }
#codex .vt .slot.empty canvas { opacity: .35; filter: grayscale(.6); }
#codex .vt .slot b { position: absolute; left: 4px; top: 3px; font-weight: normal; font-size: 9px; color: #e7c46a; letter-spacing: .05em; }
#codex .vt .slot s { position: absolute; right: 4px; bottom: 3px; text-decoration: none; font-size: 9px; color: #fff1dc; background: rgba(20,14,40,.7); padding: 0 3px; border-radius: 2px; }
#codex .sum { font-size: 11px; letter-spacing: .1em; opacity: .8; margin-bottom: 10px; display: flex; gap: 16px; flex-wrap: wrap; }
#codex .vt .detail h3 { margin: 6px 0 4px; }
#codex .vt .comp { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; margin-top: 16px; }
#codex .vt .ph { border: 1px solid rgba(255,178,122,.25); border-radius: 3px; padding: 4px; background: rgba(28,13,8,.35); font-size: 10px; letter-spacing: .06em; }
#codex .vt .ph i { display: block; aspect-ratio: 192 / 120; background: rgba(20,9,6,.8) center / cover no-repeat; border: 3px solid #f1dfba; margin-bottom: 3px; }
#codex .vt .ph.none i { border-color: rgba(241,223,186,.2); }
#codex .vt .ph span { color: #e7c46a; }
`;
let styled = false;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

export function renderVeritome(codex, cx) {
  if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const g = codex.game, V = g.veritome, B = V?.book;
  if (!B) { cx.appendChild(el('p', '', 'The Veritome is not here.')); return; }
  const known = B.known.length;
  cx.appendChild(el('div', 'sum vtsum', `<span>PAGES ${known} / ${ARCANA.length}</span><span>FREE SLOTS ${B.freeUsed} / ${FREE_SLOTS}</span><span>CLASP ${B.seals.map((s) => SEALS[s].glyph).join(' ') || '·'}</span><span>J draws the Veritome · photograph a card's sitting to bind it</span>`));
  const wrap = el('div', 'vt');
  const binder = el('div', 'binder');
  codex.vtSel ||= ARCANA[0].id;
  for (const A of ARCANA) {
    const n = B.count(A.id), slot = el('div', `slot${n ? '' : ' empty'}${codex.vtSel === A.id ? ' sel' : ''}`);
    const c = document.createElement('canvas'); c.width = 120; c.height = 200;
    c.getContext('2d').drawImage(cardArt(A.id, 120, 200, !n), 0, 0);
    slot.appendChild(c);
    slot.appendChild(el('b', '', A.roman));
    if (n) slot.appendChild(el('s', '', `${n}/${A.limit}`));
    slot.onclick = () => { codex.vtSel = A.id; codex.render(); };
    binder.appendChild(slot);
  }
  const left = el('div');
  left.appendChild(binder);
  // the Compendium
  left.appendChild(el('div', 'sum', '<span>THE COMPENDIUM · the best photograph of each kind of thing</span>'));
  const comp = el('div', 'comp');
  for (const [kind, S] of [...Object.entries(SUBJECTS), ['sky', { name: 'the open sky' }], ['sun', { name: 'the sun' }]]) {
    const ph = B.photos[kind];
    const d = el('div', `ph${ph ? '' : ' none'}`, `<i${ph?.thumb ? ` style="background-image:url(${ph.thumb})"` : ''}></i>${ph ? S.name.toUpperCase() : '· · ·'} <span>${ph ? '★'.repeat(ph.stars || 1) : ''}</span>`);
    comp.appendChild(d);
  }
  left.appendChild(comp);
  wrap.appendChild(left);
  // the card picked
  const A = ARCANA_BY_ID[codex.vtSel], n = B.count(A.id), det = el('div', 'card detail');
  det.appendChild(el('div', 'in', `PAGE ${String(A.num).padStart(3, '0')} · RANK ${A.rank} · LIMIT ${A.limit} · ${SEALS[A.seal].glyph} ${A.seal.toUpperCase()}`));
  det.appendChild(el('h3', '', n ? A.name : '· · ·'));
  det.appendChild(el('p', 'hint', `Sitting: ${A.hint}.`));
  if (n) det.appendChild(el('p', '', A.effect + (A.dur ? ` (${A.dur} s)` : '')));
  else det.appendChild(el('p', '', 'Not yet bound. Photograph its sitting with the Veritome.'));
  if (n) {
    const btns = el('div', 'btns');
    const gain = el('button', '', `GAIN (${B.spares(A.id)} spare)`);
    gain.disabled = !(B.spares(A.id) > 0 && V.held);
    gain.title = V.held ? 'take a spare copy into the hand' : 'draw the Veritome (J) to gain a card';
    gain.onclick = () => { if (B.gain(A.id)) codex.render(); };
    btns.appendChild(gain);
    det.appendChild(btns);
  }
  if (B.hand) det.appendChild(el('p', 'hint', `In the hand: ${ARCANA_BY_ID[B.hand].name}. LMB with the lens down plays it.`));
  wrap.appendChild(det);
  cx.appendChild(wrap);
}
