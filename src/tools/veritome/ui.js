// ---------------------------------------------------------------------------------------
// THE VERITOME'S SHELF in the Codex (B). The Codex is the Veritome's own pages (the Book is the Courier's computer, the Codex its
// system), and this shelf is the Book itself, in four pages:
//
//  - THE BINDER: every designated page, by section, numbered (Greed Island's binder). A filled page shows its card, its rank and how
//    many copies of its limit the Book holds; TAKE OUT puts a card with an item form into the Pneuka Box as the thing itself (with
//    the Veritome drawn), CONDENSE turns a spare into cubes. An empty page shows the Book's back and only its riddle. Above it: pages
//    filled, free slots used, what is in the Pneuka Box, the film.
//  - THE FILM: the plates not yet appraised, with APPRAISE ALL (or a chosen few) and DISCARD. Appraising is a step of its own, done
//    in a batch: the report lists each plate with its stars and what it gave (an entry, a fact, a card), Pokémon Snap's way.
//  - THE BESTIARY: each creature's understanding (GLIMPSED to UNDERSTOOD) and the facts known, the battle ones marked.
//  - THE COMPENDIUM: the best photograph of every kind of thing, with its stars (the Hyrule Compendium).
//  - THE MIND: the macros, composed on the lattice from the Functions learned (tools/veritome/mind/composer.js), said to stunned minds (reprogram.js).
//
// Prior art: Greed Island's binder (numbered designated slots, free slots, ranks and limits), OSRS's bank, Pokémon Snap's report and album,
// Monster Hunter's Hunter's Notes, the Hyrule Compendium, and Dark Cloud 2's album of scoops.
// ---------------------------------------------------------------------------------------
import { CARDS, CARD, SECTIONS, FREE_SLOTS, WORTH, cardArt } from './cards.js';
import { ROLL } from './film.js';
import { CREATURES, CREATURE_IDS } from './bestiary.js';
import { SUBJECTS } from './subjects.js';
import { renderMind } from './mind/composer.js';

const CSS = `
#codex .vt { display: grid; grid-template-columns: 1fr 270px; gap: 16px; }
@media (max-width: 760px) { #codex .vt { grid-template-columns: 1fr; } }
#codex .vtpages { display: flex; gap: 16px; margin: 0 0 10px; font-size: 11px; letter-spacing: .18em; }
#codex .vtpages span { cursor: var(--jcur-pointer, pointer); opacity: .55; } #codex .vtpages span.on { opacity: 1; color: #e7c46a; border-bottom: 1px solid #e7c46a; }
#codex .vt .sec { font-size: 10px; letter-spacing: .2em; opacity: .75; margin: 10px 0 6px; }
#codex .vt .binder { display: grid; grid-template-columns: repeat(auto-fill, minmax(58px, 1fr)); gap: 7px; }
#codex .vt .slot { position: relative; cursor: var(--jcur-pointer, pointer); border-radius: 5px; padding: 2px; border: 1px solid transparent; }
#codex .vt .slot.sel { border-color: var(--accent); background: rgba(var(--jsel),.25); }
#codex .vt .slot canvas { width: 100%; display: block; border-radius: 4px; }
#codex .vt .slot.empty canvas { opacity: .32; filter: grayscale(.7); }
#codex .vt .slot.seen canvas { opacity: .6; filter: grayscale(.4); }
#codex .vt .slot b { position: absolute; left: 4px; top: 3px; font-weight: normal; font-size: 9px; color: #e7c46a; letter-spacing: .05em; }
#codex .vt .slot s { position: absolute; right: 4px; bottom: 3px; text-decoration: none; font-size: 9px; color: #fff1dc; background: rgba(20,14,40,.7); padding: 0 3px; border-radius: 2px; }
#codex .vt .slot i { position: absolute; left: 4px; bottom: 3px; font-style: normal; font-size: 9px; color: #9be36a; }
#codex .sum { font-size: 11px; letter-spacing: .1em; opacity: .8; margin-bottom: 10px; display: flex; gap: 16px; flex-wrap: wrap; }
#codex .vt .detail h3 { margin: 6px 0 4px; }
#codex .vt .detail canvas { width: 110px; display: block; margin: 4px 0 8px; border-radius: 5px; }
#codex .vt .comp, #codex .vt .roll { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
#codex .vt .ph { border: 1px solid rgba(255,178,122,.25); border-radius: 3px; padding: 4px; background: rgba(28,13,8,.35); font-size: 10px; letter-spacing: .06em; cursor: var(--jcur-pointer, pointer); }
#codex .vt .ph.sel { border-color: var(--accent); background: rgba(var(--jsel),.3); }
#codex .vt .ph i { display: block; aspect-ratio: 192 / 120; background: rgba(20,9,6,.8) center / cover no-repeat; border: 3px solid #f1dfba; margin-bottom: 3px; }
#codex .vt .ph.none i { border-color: rgba(241,223,186,.2); }
#codex .vt .ph span { color: #e7c46a; }
#codex .vt .ph em { display: block; font-style: normal; opacity: .75; font-size: 9px; }
#codex .vt .fact { margin: 6px 0; font-size: 12px; line-height: 1.45; }
#codex .vt .fact.battle::before { content: 'IN BATTLE · '; color: #ff8a6a; font-size: 10px; letter-spacing: .12em; }
#codex .vt .fact.unk { opacity: .45; }
#codex .vt .tier { display: inline-block; font-size: 10px; letter-spacing: .14em; padding: 1px 6px; border: 1px solid rgba(231,196,106,.6); border-radius: 2px; color: #e7c46a; }
#codex .vt .btns { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0; }
`;
let styled = false;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const button = (label, on, disabled = false, title = '') => { const b = el('button', '', label); b.disabled = disabled; if (title) b.title = title; b.onclick = on; return b; };
const stars = (n) => '★'.repeat(n || 0) + '<span style="opacity:.25">' + '★'.repeat(Math.max(0, 4 - (n || 0))) + '</span>';

export function renderVeritome(codex, cx) {
  if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const g = codex.game, V = g.veritome, B = V?.book;
  if (!B) { cx.appendChild(el('p', '', 'The Veritome is not here.')); return; }
  const box = g.pneuka;
  cx.appendChild(el('div', 'sum', `<span>PAGES ${B.filled} / ${CARDS.length}</span><span>FREE SLOTS ${B.freeUsed} / ${FREE_SLOTS}</span>${box ? `<span>PNEUKA BOX ${box.used} / ${box.slots.length} (P)</span>` : ''}<span>FILM ${B.film.plates.length} / ${ROLL}</span>`));
  const pages = el('div', 'vtpages');
  codex.vtPage ||= 'binder';
  for (const [id, name] of [['binder', 'THE BINDER'], ['film', `THE FILM${B.film.plates.length ? ` (${B.film.plates.length})` : ''}`], ['bestiary', 'THE BESTIARY'], ['compendium', 'THE COMPENDIUM'], ['mind', 'THE MIND']]) {
    const s = el('span', codex.vtPage === id ? 'on' : '', name);
    s.onclick = () => { codex.vtPage = id; codex.render(); };
    pages.appendChild(s);
  }
  cx.appendChild(pages);
  ({ binder, film, bestiary, compendium, mind: (cd, c2, gg) => renderMind(cd, c2, gg) })[codex.vtPage](codex, cx, g, B);
}

// ---------------------------------------------------------------- the binder
function binder(codex, cx, g, B) {
  const wrap = el('div', 'vt'), left = el('div');
  codex.vtSel ||= CARDS[0].id;
  for (const S of SECTIONS) {
    const list = CARDS.filter((c) => c.section === S.id);
    left.appendChild(el('div', 'sec', `${S.name} · ${B.filledIn(S.id)} / ${list.length}`));
    const grid = el('div', 'binder');
    for (const A of list) {
      const n = B.count(A.id), seen = B.known(A.id), it = g.pneuka ? g.pneuka.count(A.id) + (g.pneuka.lure === A.id ? 1 : 0) : 0;
      const slot = el('div', `slot${n ? '' : seen ? ' seen' : ' empty'}${codex.vtSel === A.id ? ' sel' : ''}`);
      const c = document.createElement('canvas'); c.width = 120; c.height = 200;
      c.getContext('2d').drawImage(cardArt(A.id, 120, 200, { back: !n && !seen }), 0, 0);
      slot.appendChild(c);
      slot.appendChild(el('b', '', A.page));
      if (n) slot.appendChild(el('s', '', `${n}/${A.limit}`));
      if (it) slot.appendChild(el('i', '', `◆${it}`));
      slot.onclick = () => { codex.vtSel = A.id; codex.render(); };
      grid.appendChild(slot);
    }
    left.appendChild(grid);
  }
  wrap.appendChild(left);
  // the card picked
  const A = CARD[codex.vtSel] || CARDS[0], n = B.count(A.id), seen = B.known(A.id), det = el('div', 'card detail');
  const S = SECTIONS.find((s) => s.id === A.section);
  det.appendChild(el('div', 'in', `PAGE ${A.page} · ${S.name} · RANK ${A.rank} · LIMIT ${A.limit}`));
  const art = document.createElement('canvas'); art.width = 120; art.height = 200; art.getContext('2d').drawImage(cardArt(A.id, 120, 200, { back: !n && !seen }), 0, 0);
  det.appendChild(art);
  det.appendChild(el('h3', '', n || seen ? A.name.toUpperCase() : '· · ·'));
  if (n || seen) det.appendChild(el('p', '', A.lore));
  det.appendChild(el('p', 'hint', A.section === 'arcana' ? `Sitting: ${A.hint}.` : `Comes from: ${A.hint}.`));
  if (!n) det.appendChild(el('p', 'hint', seen ? 'The page has held it once; it is empty now.' : A.section === 'arcana' ? 'Photograph its sitting, then appraise the film.' : A.section === 'curio' ? 'Open chests: a curio goes into the Pneuka Box (P), and can be stored here with the Veritome drawn.' : 'Photograph it well (three stars, as the main subject), then appraise the film.'));
  const carried = g.pneuka ? g.pneuka.count(A.id) + (g.pneuka.lure === A.id ? 1 : 0) : 0;
  if (carried) det.appendChild(el('p', '', `<span style="color:#9be36a">CARRIED</span> · ${carried} in the Pneuka Box${g.pneuka.lure === A.id ? ', on the line' : ''} (P)`));
  const btns = el('div', 'btns');
  const held = !!g.veritome?.held;
  if (A.form === 'item') btns.appendChild(button('TAKE OUT', () => { if (g.pneuka?.withdraw(A.id)) codex.render(); }, !n || !held || !g.pneuka?.free, !held ? 'draw the Veritome (J) to take things out of it' : 'a copy becomes the thing itself, in the Pneuka Box'));
  btns.appendChild(button(`CONDENSE (${WORTH[A.rank]} cubes)`, () => { if (B.condense(A.id)) codex.render(); }, B.spares(A.id) < 1, 'a spare copy, condensed into Lachryma cubes'));
  det.appendChild(btns);
  if (A.form !== 'item') det.appendChild(el('p', 'hint', 'A picture of something known: it has no item form, and stays a card.'));
  wrap.appendChild(det);
  cx.appendChild(wrap);
}

// ---------------------------------------------------------------- the film and the darkroom
function film(codex, cx, g, B) {
  const F = B.film, wrap = el('div', 'vt'), left = el('div');
  codex.vtPick ||= new Set();
  const pick = codex.vtPick;
  for (const id of [...pick]) if (!F.plates.some((p) => p.id === id)) pick.delete(id);
  const btns = el('div', 'btns');
  btns.appendChild(button(`APPRAISE ALL (${F.plates.length})`, () => { codex.vtReport = g.veritome.appraise(); pick.clear(); codex.render(); }, !F.plates.length));
  btns.appendChild(button(`APPRAISE CHOSEN (${pick.size})`, () => { codex.vtReport = g.veritome.appraise([...pick]); pick.clear(); codex.render(); }, !pick.size));
  btns.appendChild(button(`DISCARD CHOSEN (${pick.size})`, () => { F.remove([...pick]); B.save(); g.events?.emit('photo.discard', { n: pick.size }); pick.clear(); codex.render(); }, !pick.size));
  left.appendChild(btns);
  left.appendChild(el('div', 'sec', `ON THE ROLL · ${F.plates.length} / ${ROLL} · click a plate to choose it`));
  const roll = el('div', 'roll');
  for (const p of F.plates) {
    const d = el('div', `ph${pick.has(p.id) ? ' sel' : ''}`, `<i${p.thumb ? ` style="background-image:url(${p.thumb})"` : ''}></i>PLATE ${p.id}<em>undeveloped</em>`);
    d.onclick = () => { if (pick.has(p.id)) pick.delete(p.id); else pick.add(p.id); codex.render(); };
    roll.appendChild(d);
  }
  if (!F.plates.length) left.appendChild(el('p', 'hint', 'The roll is empty. Draw the Veritome (J), raise the lens (RMB) and take photographs (LMB): they wait here to be appraised.'));
  left.appendChild(roll);
  wrap.appendChild(left);
  // the last report
  const rep = el('div', 'card detail'), R = codex.vtReport;
  rep.appendChild(el('div', 'in', 'THE LAST APPRAISAL'));
  if (!R) rep.appendChild(el('p', 'hint', 'Appraising is where a photograph turns out to have been worth something: the Compendium keeps the best of each kind, the bestiary learns what each creature was doing, and a photograph of the right thing is a card.'));
  else {
    rep.appendChild(el('p', '', `${R.results.length} plates · ${R.entries} new entr${R.entries === 1 ? 'y' : 'ies'} · ${R.facts} fact${R.facts === 1 ? '' : 's'} · ${R.cards} card${R.cards === 1 ? '' : 's'}`));
    for (const r of R.results.slice(0, 24)) {
      const what = [r.entry && 'new entry', ...r.facts.map((f) => `${CREATURES[f.creature].name}: a fact`), ...r.cards.map((c) => CARD[c].name)].filter(Boolean).join(' · ');
      rep.appendChild(el('div', 'ph', `<i${r.plate.thumb ? ` style="background-image:url(${r.plate.thumb})"` : ''}></i>${(SUBJECTS[r.kind]?.name || r.kind || 'nothing').toUpperCase()} <span>${stars(r.stars)}</span><em>${what || '—'}</em>`));
    }
  }
  wrap.appendChild(rep);
  cx.appendChild(wrap);
}

// ---------------------------------------------------------------- the bestiary
function bestiary(codex, cx, g, B) {
  const wrap = el('div', 'body'), list = el('div', 'list'), Bs = B.bestiary;
  codex.vtCre ||= 'clapper';
  for (const id of CREATURE_IDS) {
    const C = CREATURES[id], u = Bs.understanding(id), seen = u.n > 0;
    const row = el('div', `row${seen ? '' : ' locked'}${codex.vtCre === id ? ' sel' : ''}`, `<span class="g">${seen ? C.glyph : '?'}</span><span class="t"><b>${seen ? C.name.toUpperCase() : '· · ·'}</b><s>${u.name} · ${u.n}/${u.of}</s><div class="bar"><i style="width:${Math.round(u.k * 100)}%"></i></div></span>`);
    row.onclick = () => { codex.vtCre = id; codex.render(); };
    list.appendChild(row);
  }
  wrap.appendChild(list);
  const id = codex.vtCre, C = CREATURES[id], u = Bs.understanding(id), card = el('div', 'card vt');
  card.style.display = 'block';
  const ph = B.photos[C.fish ? 'fish' : 'clapper'];
  card.appendChild(el('div', 'in', `${u.n ? C.name.toUpperCase() : '· · ·'} <span class="tier">${u.name}</span>`));
  if (u.n && ph?.thumb && !C.fish) card.appendChild(el('div', 'ph', `<i style="background-image:url(${ph.thumb})"></i>`));
  for (const f of C.facts) {
    const k = Bs.knows(id, f.id);
    card.appendChild(el('p', `fact${f.battle && k ? ' battle' : ''}${k ? '' : ' unk'}`, k ? f.text : '· · · (not yet photographed doing it)'));
  }
  card.appendChild(el('p', 'hint', 'Facts are learned from photographs of a creature doing something, appraised in the darkroom. A creature that is understood is one the Soul Brush may one day paint a likeness of.'));
  wrap.appendChild(card);
  cx.appendChild(wrap);
}

// ---------------------------------------------------------------- the Compendium
function compendium(codex, cx, g, B) {
  cx.appendChild(el('div', 'sum', '<span>THE COMPENDIUM · the best photograph of each kind of thing</span>'));
  const comp = el('div', 'comp');
  for (const [kind, S] of [...Object.entries(SUBJECTS), ['sky', { name: 'the open sky' }], ['sun', { name: 'the sun' }]]) {
    const ph = B.photos[kind];
    comp.appendChild(el('div', `ph${ph ? '' : ' none'}`, `<i${ph?.thumb ? ` style="background-image:url(${ph.thumb})"` : ''}></i>${ph ? S.name.toUpperCase() : '· · ·'} <span>${ph ? stars(ph.stars) : ''}</span>`));
  }
  const w = el('div', 'vt'); w.style.display = 'block'; w.appendChild(comp);
  cx.appendChild(w);
}
