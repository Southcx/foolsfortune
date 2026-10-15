// ---------------------------------------------------------------------------------------
// THE TABLES' PAGES (docs/plans/CASINO.md section 9): what a seat at Raku's tables shows while the cloth, the cards and the dice are still
// placeholders: a page set aside (feedback/indexmenu.js), the world beside it in view, with the table's state (your hand or tiles, the
// others', the dice, the pot) and your choices to click. Words are placeholders for Espada's; the look is Calissa's to replace with the
// table itself (the Gold Saucer's cloth and lamps, real cards and dice under a camera's frame). A choice shows only when it is yours.
//
// Prior art: the house's race board (world/raceway/raceboard.js) and the index's rows; Mahjong Soul's and Hearthstone's clarity (your
// hand along the bottom, the choices lit, the others' counts at the edges).
//
//   renderTable(session, { im, el, P, R, V, waiting })   (session.js calls it)
// ---------------------------------------------------------------------------------------
import { cardName, SUITS } from '../../progress/casino/querent/score.js';
import { ARCANA } from '../../progress/casino/querent/arcana.js';
import { stepDie } from '../../progress/casino/table.js';

const SUIT_COLOUR = ['#5fd0c4', '#b8c4d6', '#e8c35a', '#e0705a']; // (cups, swords, pentacles, wands)
const RANKS = [null, 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Pg', 'Kn', 'Q', 'K'];
const card = (c) => (c ? `<b style="color:${SUIT_COLOUR[c.s] ?? '#ccc'}">${RANKS[c.r]}${'♥♠◆♣'[c.s] ?? ''}</b>` : '·');

export function renderTable(S, { im, el, P, R, V, waiting }) {
  const T = S.T, names = T.names;
  const grp = (t) => { im.appendChild(el('div', 'grp', t)); const rows = el('div', 'rooms'); im.appendChild(rows); return rows; };
  const btn = (rows, title, sub, go) => { const d = el('div', 'room', `<span><b>${title}</b><s>${sub || ''}</s></span>`); d.onclick = go; rows.appendChild(d); return d; };
  const line = (html) => im.appendChild(el('div', 'grp', html));
  if (T.id === 'querent') querent(S, { V, P, names, grp, btn, line, el, im });
  else if (T.id === 'zodiac') zodiac(S, { V, P, names, grp, btn, line });
  else horizon(S, { V, P, names, grp, btn, line });
  if (waiting) line(`${waiting.toUpperCase()} IS THINKING…`);
  if (R) {
    const rows = grp('THE GAME IS OVER');
    btn(rows, 'Again', `${T.stake} chips`, () => S.again());
    btn(rows, 'Rise from the table', '', () => S.close());
  }
}

// ---------------------------------------------------------------- Querent
function querent(S, { V, P, names, grp, btn, line, el, im }) {
  line(`ROUND ${V.round + 1} OF 4 · YOUR SEAT SUIT ${SUITS[V.seatSuit].toUpperCase()} · SCORES ${V.scores.map((s, i) => `${names[i]} ${s}`).join(' · ')}`);
  const others = grp('THE TABLE');
  V.players.forEach((Q, q) => { if (q === 0) return; btn(others, names[q], `discard top ${V.tops[q]?.hidden ? 'face down' : card(V.tops[q])} · ${Q.arcana} arcana · ${Q.stole} stolen${Q.hand ? ` · hand ${Q.hand.map(card).join(' ')}` : ''}`, () => {}); });
  if (V.mine?.length) line(`YOUR ARCANA: ${V.mine.map((id) => ARCANA[id].name).join(', ')}`);
  const hand = grp(`YOUR HAND${V.quads.length ? ` · FOURS SET ASIDE: ${V.quads.map((r) => RANKS[r]).join(', ')}` : ''}${V.fate ? ` · FATE CLAUSE: BY ${V.fate.by.toUpperCase()}` : ''}`);
  const order = V.hand.map((c, i) => i).sort((a, b) => V.hand[a].r - V.hand[b].r || V.hand[a].s - V.hand[b].s);
  const discard = P?.kind === 'discard', wheel = P?.kind === 'wheel', sel = (S.sel ||= new Set());
  for (const i of order) {
    const c = V.hand[i], legal = discard && P.moves.some((m) => m.discard === i);
    const d = btn(hand, card(c), c.stolen ? 'stolen' : legal ? 'throw this' : wheel ? (sel.has(i) ? 'throw back' : '') : '', () => {
      if (legal) S.move({ discard: i }); else if (wheel) { if (sel.has(i)) sel.delete(i); else sel.add(i); S.render(); }
    });
    if (!legal && !wheel) d.style.opacity = '0.85';
  }
  if (!P) return;
  const rows = grp(P.kind === 'discard' ? 'THROW ONE BACK' : 'YOUR CHOICE');
  const pick = (m, title, sub) => btn(rows, title, sub, () => { S.sel = new Set(); S.move(m); });
  for (const m of P.moves) {
    switch (P.kind) {
      case 'acquire': pick(m, m.draw ? 'Draw' : `Steal ${card(V.tops[m.steal])} from ${names[m.steal]}`, m.steal != null ? `${names[m.steal]} flips a Major Arcana` : 'from your own pile'); break;
      case 'fate': pick(m, m.fate ? `Declare the Fate Clause: win by ${m.fate}` : 'Not yet', m.fate ? 'flip an arcana; your turn ends; your hand is locked' : ''); break;
      case 'win': pick(m, m.win ? 'Win the round!' : 'Not yet', ''); break;
      case 'fool': pick(m, ARCANA[m.arcana].name, ARCANA[m.arcana].does); break;
      case 'hierophant': pick(m, `Name ${RANKS[m.rank]}`, ''); break;
      case 'lovers': case 'sun': case 'judgment': case 'ability.downgrade': pick(m, names[m.target], ''); break;
      case 'hermit': if (m.top.length <= 1) pick(m, m.top.length ? `${card(V.peek?.[m.top[0]])} on top` : 'Keep the order', `your next nine: ${(V.peek || []).map(card).join(' ')}`); break;
      default: break;
    }
  }
  if (wheel) btn(rows, `Throw back ${sel.size} and draw as many`, 'click cards in your hand to choose', () => { const ix = [...sel].sort((a, b) => a - b); S.sel = new Set(); S.move(P.moves.find((m) => m.throw.length === ix.length && m.throw.every((v, k) => v === ix[k])) || { throw: [] }); });
}

// ---------------------------------------------------------------- Zodiac
function zodiac(S, { V, P, names, grp, btn, line }) {
  const d = V.dice;
  line(`POT ${V.pot} · DICE ${d.a} AND ${d.b} (SUM ${d.a + d.b}, PRODUCT ${d.a * d.b}) · ATTACK d${V.attack[S.S.turn]}: ${d.atk}`);
  const board = grp('THE TILES (■ SHUT, ◆ LOCKED)');
  for (let q = 0; q < V.n; q++) btn(board, `${names[q]} · d${V.attack[q]} · ${V.tokens[q]} tokens · ${V.chips[q]} chips`, V.tiles[q].map((t, i) => (V.locked[q][i] ? `◆${i + 1}` : t ? `■${i + 1}` : `${i + 1}`)).join(' '), () => {});
  if (!P) return;
  const rows = grp('YOUR CHOICE');
  for (const m of P.moves) {
    let t = '', s = '';
    if (P.kind === 'seal') { t = m.none ? 'No seal possible' : `Shut ${m.tiles.join(' + ')}`; s = m.none ? '' : `by the ${m.by}`; }
    else if (P.kind === 'attack') { t = m.pay != null ? `${names[m.target]} pays ${m.pay}` : `Reopen ${names[m.target]}'s ${m.tiles.join(' + ')}`; }
    else if (m.lock) { t = `Lock ${m.lock}`; s = `its ability: ${m.ability}`; }
    else if (m.upgrade) { t = `Upgrade your attack die to d${stepDie(V.attack[0], 1)}`; }
    else if (m.pay != null) { t = `Make ${names[m.pay]} pay`; s = 'your attack die again'; }
    else if (m.reroll != null) { t = m.reroll ? 'Reroll the sealing dice' : 'Keep them'; }
    else if (m.target != null) { t = names[m.target]; s = P.kind.replace('ability.', ''); }
    else if (m.end) t = 'Done';
    btn(rows, t, s, () => S.move(m));
  }
}

// ---------------------------------------------------------------- Event Horizon
function horizon(S, { V, P, names, grp, btn, line }) {
  line(`THE ROUND TOTAL ${V.total} · PAR ${V.par} ${V.par === 1 ? 'DIE' : 'DICE'} · ANTE ${S.T.stake}`);
  const seats = grp('THE PLAYERS');
  for (let q = 0; q < V.n; q++) btn(seats, `${names[q]}: ${V.sums[q]}`, `rolled ${V.used[q].map((s) => `d${s}`).join(' ') || 'nothing'} · left ${V.left[q].map((s) => `d${s}`).join(' ')}`, () => {});
  if (!P) return;
  const rows = grp('YOUR ROLL');
  if (P.kind === 'reroll') { for (const m of P.moves) btn(rows, m.reroll ? 'Reroll it (free, once a round)' : 'Keep it', `you rolled ${V.last?.sum}`, () => S.move(m)); return; }
  const sel = (S.dsel ||= []);
  V.mine.forEach((sides, i) => btn(rows, `${sel.includes(i) ? '◆' : '◇'} d${sides}`, sel.includes(i) ? 'chosen' : '', () => { const k = sel.indexOf(i); if (k >= 0) sel.splice(k, 1); else sel.push(i); S.render(); }));
  btn(rows, `Roll ${sel.length ? sel.map((i) => `d${V.mine[i]}`).join(' + ') : '(choose dice)'}`, `you need ${V.need}`, () => {
    if (!sel.length) return; const dice = sel.map((i) => V.mine[i]).sort((a, b) => a - b);
    const m = P.moves.find((x) => x.dice && x.dice.slice().sort((a, b) => a - b).join() === dice.join()); S.dsel = []; if (m) S.move(m);
  });
  btn(rows, 'Stand', 'roll no more this round', () => S.move({ stand: true }));
}
