// ---------------------------------------------------------------------------------------
// THE VERITOME'S SHELF in the Codex (B): what the Veritome knows, in four pages. It keeps no cards and no things (the owner's ruling of
// 2026-10-23: the Veritome is observation and reprogramming only); the cards bound are the Codex's THE ARCANA shelf
// (feedback/codex/arcana.js) and, for creatures, the bestiary's page here.
//
//  - THE MEMORY: the plates not yet appraised, with APPRAISE ALL (or a chosen few) and DISCARD. Appraising is a step of its own, done
//    in a batch: the report lists each plate with its stars and what it gave (an entry, a fact, a card), Pokémon Snap's way.
//  - THE BESTIARY: each creature's understanding (GLIMPSED to UNDERSTOOD), the facts known (the battle ones marked), and its card once bound.
//  - THE COMPENDIUM: the best photograph of every kind of thing, with its stars (the Hyrule Compendium).
//  - THE MIND: the macros, composed on the lattice from the Functions learned (tools/veritome/mind/composer.js), said to stunned minds (reprogram.js).
//
// Prior art: Pokémon Snap's report and album, Monster Hunter's Hunter's Notes, the Hyrule Compendium, and Dark Cloud 2's album of scoops.
// ---------------------------------------------------------------------------------------
import { calibrateButton } from '../../ui/calibratebutton.js';
import { CARD, cardArt } from './cards.js';
import { MEMORY_PLATES } from './memory.js';
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

/** The shelf's styles, once (THE ARCANA's shelf wears them too: feedback/codex/arcana.js). */
export function vtStyle() { if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; } }

export function renderVeritome(codex, cx) {
  vtStyle();
  const g = codex.game, V = g.veritome, B = V?.book;
  if (!B) { cx.appendChild(el('p', '', 'The Veritome is not here.')); return; }
  cx.appendChild(el('div', 'sum', `<span>MEMORY ${B.memory.plates.length} / ${MEMORY_PLATES}</span><span>CARDS BOUND ${g.collection?.filled ?? 0} (THE ARCANA, and the bestiary)</span>`));
  const pages = el('div', 'vtpages');
  if (!codex.vtPage || codex.vtPage === 'binder') codex.vtPage = 'memory';
  for (const [id, name] of [['memory', `THE MEMORY${B.memory.plates.length ? ` (${B.memory.plates.length})` : ''}`], ['bestiary', 'THE BESTIARY'], ['compendium', 'THE COMPENDIUM'], ['mind', 'THE MIND']]) {
    const s = el('span', codex.vtPage === id ? 'on' : '', name);
    s.onclick = () => { codex.vtPage = id; codex.render(); };
    pages.appendChild(s);
  }
  cx.appendChild(pages);
  ({ memory, bestiary, compendium, mind: (cd, c2, gg) => renderMind(cd, c2, gg) })[codex.vtPage](codex, cx, g, B);
}

// ---------------------------------------------------------------- the memory and the darkroom
function memory(codex, cx, g, B) {
  const F = B.memory, wrap = el('div', 'vt'), left = el('div');
  codex.vtPick ||= new Set();
  const pick = codex.vtPick;
  for (const id of [...pick]) if (!F.plates.some((p) => p.id === id)) pick.delete(id);
  const btns = el('div', 'btns');
  btns.appendChild(button(`APPRAISE ALL (${F.plates.length})`, () => { codex.vtReport = g.veritome.appraise(); pick.clear(); codex.render(); }, !F.plates.length));
  btns.appendChild(button(`APPRAISE CHOSEN (${pick.size})`, () => { codex.vtReport = g.veritome.appraise([...pick]); pick.clear(); codex.render(); }, !pick.size));
  btns.appendChild(button(`DISCARD CHOSEN (${pick.size})`, () => { F.remove([...pick]); B.save(); g.events?.emit('photo.discard', { n: pick.size }); pick.clear(); codex.render(); }, !pick.size));
  left.appendChild(btns);
  left.appendChild(el('div', 'sec', `MEMORY · ${F.plates.length} / ${MEMORY_PLATES} · click a photo to choose it`));
  const roll = el('div', 'roll');
  for (const p of F.plates) {
    const d = el('div', `ph${pick.has(p.id) ? ' sel' : ''}`, `<i${p.thumb ? ` style="background-image:url(${p.thumb})"` : ''}></i>PHOTO ${p.id}<em>${p.race ? 'photo finish' : 'unappraised'}</em>`);
    d.onclick = () => { if (pick.has(p.id)) pick.delete(p.id); else pick.add(p.id); codex.render(); };
    roll.appendChild(d);
  }
  if (!F.plates.length) left.appendChild(el('p', 'hint', 'The memory is empty. With the Veritome your main, draw it (X), raise the lens (RMB) and take photographs (LMB): they wait here to be appraised.'));
  left.appendChild(roll);
  wrap.appendChild(left);
  // the last report
  const rep = el('div', 'card detail'), R = codex.vtReport;
  rep.appendChild(el('div', 'in', 'THE LAST APPRAISAL'));
  if (!R) rep.appendChild(el('p', 'hint', 'Appraising is where a photograph turns out to have been worth something: the Compendium keeps the best of each kind, the bestiary learns what each creature was doing, and a photograph of the right thing is a card.'));
  else {
    rep.appendChild(el('p', '', `${R.results.length} photos · ${R.entries} new entr${R.entries === 1 ? 'y' : 'ies'} · ${R.facts} fact${R.facts === 1 ? '' : 's'} · ${R.cards} card${R.cards === 1 ? '' : 's'}`));
    for (const r of R.results.slice(0, 24)) {
      const what = [r.entry && 'new entry', ...r.facts.map((f) => `${CREATURES[f.creature].name}: a fact`), ...r.cards.map((c) => CARD[c].name)].filter(Boolean).join(' · ');
      rep.appendChild(el('div', 'ph', `<i${r.plate.thumb ? ` style="background-image:url(${r.plate.thumb})"` : ''}></i>${(r.plate.race ? 'photo finish' : SUBJECTS[r.kind]?.name || r.kind || 'nothing').toUpperCase()} <span>${stars(r.stars)}</span><em>${what || '—'}</em>`));
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
  const head = card.appendChild(el('div', 'in', `${u.n ? C.name.toUpperCase() : '· · ·'} <span class="tier">${u.name}</span>`));
  if (u.n) calibrateButton(head, { kind: id }, g); // (the Sight's TRACK: its needle to the nearest of this kind, ui/calibratebutton.js)
  if (g.collection?.has(`creature.${id}`)) { const c = document.createElement('canvas'); c.width = 120; c.height = 200; c.getContext('2d').drawImage(cardArt(`creature.${id}`, 120, 200), 0, 0); const d = el('div', 'detail'); d.appendChild(c); card.appendChild(d); } // (its card, bound: progress/collection.js)
  if (u.n && ph?.thumb && !C.fish) card.appendChild(el('div', 'ph', `<i style="background-image:url(${ph.thumb})"></i>`));
  for (const f of C.facts) {
    const k = Bs.knows(id, f.id);
    card.appendChild(el('p', `fact${f.battle && k ? ' battle' : ''}${k ? '' : ' unk'}`, k ? f.text : '· · · (not yet photographed doing it)'));
  }
  card.appendChild(el('p', 'hint', 'Facts are learned from photographs of a creature doing something, appraised in the Book. A creature that is understood is one the Soul Brush may one day paint a likeness of.'));
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
