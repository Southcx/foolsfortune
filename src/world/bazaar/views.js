// ---------------------------------------------------------------------------------------
// THE TABLES' PAGES (docs/plans/CASINO-CLARITY.md sections 4 to 6; the owner's clarity pass, 2026-10-15): a seat at Raku's tables as a page
// set aside (feedback/indexmenu.js): the LOBBY (play for chips, practise for free, how to play, the bots' speed), the HOW-TO (a game's steps
// one at a time, skippable), and the TABLE, drawn from the coach (progress/casino/coach/): the goal and how near you are, whose turn it is
// and what to do in one line, the shared numbers big, your hand or dice or tiles, every choice with what it does and what it would bring
// (the house's suggestion marked), each seat in its colour and shape with its key numbers, and the speed and the rules a click away. The
// owner's exception (2026-10-15): words and numbers may show at these tables. The cloth's look is Calissa's (vfx/bazaartable.js reads
// the same coach); this page is what every game can always be played from.
//
// Prior art: the poker clients' action buttons with the price on them and the seats with their stacks, Monster Train's preview, Balatro's
// hand name shown as cards are chosen, Slay the Spire's opponents' intents, a board game's quick-start card.
//
//   renderLobby(session, { im, el })   renderHowto(session, { im, el })   renderTable(session, { im, el })
// ---------------------------------------------------------------------------------------
import { HOWTO } from '../../progress/casino/howto.js';
import { SEAT_COLOURS, SUIT_COLOURS } from '../../progress/casino/table.js';
import { SPEEDS } from './session.js';

const SHAPE = { circle: '●', triangle: '▲', square: '■', diamond: '◆', star: '★', heart: '♥', hexagon: '⬢', ring: '○' };
const TONE = { good: ['#7ee0a1', '✔'], risk: ['#f2c14e', '⚠'], bad: ['#ff8a80', '✖'] };
const RANKS = [null, 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Pg', 'Kn', 'Q', 'K'];
const YOU = SEAT_COLOURS[0];
const css = (o) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(';');
const card = (c, big) => (c ? `<b style="${css({ color: SUIT_COLOURS[c.s]?.hex || '#ccc', 'font-size': big ? '1.35em' : '1em' })}">${RANKS[c.r]}${SUIT_COLOURS[c.s]?.pip || ''}</b>` : '·');

/** The page's few shapes: a heading, a row of buttons, a button, a line, a block. */
function kit(im, el) {
  const add = (node) => { im.appendChild(node); return node; };
  const block = (style = {}) => { const d = el('div', ''); d.style.cssText = css({ margin: '6px 0', padding: '8px 10px', 'border-radius': '6px', background: 'rgba(255,255,255,0.05)', ...style }); return add(d); };
  const line = (html, style = {}) => { const d = el('div', '', html); d.style.cssText = css(style); return d; };
  const head = (t) => add(el('div', 'grp', t));
  const rows = () => add(el('div', 'rooms'));
  const button = (into, title, sub, go, style = {}) => { const d = el('div', 'room', `<span><b>${title}</b><s>${sub || ''}</s></span>`); d.style.cssText = css(style); d.onclick = go; into.appendChild(d); return d; };
  return { add, block, line, head, rows, button };
}
const speedRow = (S, K) => { const r = K.rows(); for (const sp of SPEEDS) K.button(r, sp.label + (S.game.bazaar?.prefs?.speed === sp.id || (!S.game.bazaar?.prefs?.speed && sp.id === 'normal') ? ' ◂' : ''), sp.id === 'normal' ? 'the folk take their time' : sp.id === 'fast' ? 'quicker turns' : 'no waiting', () => S.setSpeed(sp.id)); };

// ---------------------------------------------------------------- the lobby
export function renderLobby(S, { im, el }) {
  const K = kit(im, el), T = S.T, H = HOWTO[T.id];
  const b = K.block({ 'font-size': '1.05em' }); b.appendChild(K.line(`<b>${T.label}</b>: ${T.line}`));
  if (H) { const c = K.block(); c.appendChild(K.line('<b>THE RULES ON ONE CARD</b>', { opacity: 0.8 })); for (const l of H.card) c.appendChild(K.line(`• ${l}`)); }
  K.head('SIT DOWN');
  const r = K.rows(), chips = S.game.chips?.balance ?? 0;
  K.button(r, `Play for ${T.stake} chips`, chips >= T.stake ? `you hold ${chips}` : `you hold ${chips}: Raku's cage sells chips`, () => S.play(false), { 'font-size': '1.15em' });
  K.button(r, 'Practise (free)', 'no chips in, none out, nothing counted', () => S.play(true));
  K.button(r, 'How to play', `${H?.steps.length || 0} short steps`, () => S.showHowto());
  K.head('TABLE SPEED'); speedRow(S, K);
}

// ---------------------------------------------------------------- the how-to
const LOOK = { goal: 'the goal at the top', hand: 'your hand', moves: 'your choices', seats: 'the players', centre: 'the middle of the table', dice: 'the dice', tiles: 'the tiles', claim: 'the claim', tell: "the claimant's chips" };
export function renderHowto(S, { im, el }) {
  const K = kit(im, el), H = S.howto, step = H.steps[H.step], last = H.step === H.steps.length - 1;
  K.head(`HOW TO PLAY ${S.T.label.toUpperCase()} · ${H.step + 1} OF ${H.steps.length}`);
  const b = K.block({ 'font-size': '1.3em', 'line-height': '1.45', padding: '14px 14px', 'border-left': `4px solid ${YOU.hex}` });
  b.appendChild(K.line(step?.say || ''));
  if (step?.show && LOOK[step.show]) K.add(K.line(`Look at ${LOOK[step.show]}.`, { opacity: 0.7, margin: '2px 4px' }));
  const r = K.rows();
  if (last && !S.S) { K.button(r, `Play for ${S.T.stake} chips`, '', () => { S.howtoStep(+1); S.play(false); }, { 'font-size': '1.15em' }); K.button(r, 'Practise first (free)', '', () => { S.howtoStep(+1); S.play(true); }); }
  else K.button(r, last ? 'Back to the game' : 'Next ▸', '', () => S.howtoStep(+1), { 'font-size': '1.15em' });
  if (H.step > 0) K.button(r, '◂ Back', '', () => S.howtoStep(-1));
  if (!last) K.button(r, 'Skip', 'you can see this again from the table', () => S.howtoStep('skip'));
}

// ---------------------------------------------------------------- the table
export function renderTable(S, { im, el }) {
  const K = kit(im, el), C = S.coach(); if (!C) return;
  const G = C.goal, T = S.T, over = S.done;
  // the goal, and how near you are
  const g = K.block({ 'border-left': '4px solid #c9a24a' });
  g.appendChild(K.line(`<b>GOAL</b> ${G.text}`));
  const best = G.best && G.best.seat !== 0 ? ` · leader ${T.names[G.best.seat]}: ${G.best.value}` : '';
  g.appendChild(K.line(`<span style="font-size:1.4em;font-weight:700;color:${YOU.hex}">You: ${G.you.value}${G.you.of ? ` / ${G.you.of}` : ''}</span> <span style="opacity:.75">${G.you.label}${best}</span>${G.round ? ` · round ${G.round.value} of ${G.round.of}` : ''}`));
  // whose turn, and what to do
  const yours = C.turn.yours && !over;
  const t = K.block({ background: yours ? `${YOU.hex}33` : 'rgba(255,255,255,0.04)', 'border-left': `4px solid ${yours ? YOU.hex : '#666'}`, 'font-size': yours ? '1.2em' : '1em' });
  t.appendChild(K.line(`<b>${over ? 'GAME OVER' : yours ? 'YOUR TURN' : 'WAIT'}</b> ${C.turn.say || ''}`));
  // the game's own pieces (your hand, dice or tiles), then the choices: what to do comes before what is on the table
  (MINE[T.id] || (() => {}))(S, C, K);
  if (yours && C.moves.length && !SELF[T.id]?.(C)) moves(S, C, K);
  // the shared numbers, big
  if (C.centre?.length) { const c = K.block({ display: 'flex', 'flex-wrap': 'wrap', gap: '14px' }); for (const x of C.centre) c.appendChild(K.line(`<div style="opacity:.7;font-size:.8em">${x.label}</div><div style="font-size:${x.big ? '1.5em' : '1.05em'};font-weight:700">${x.value}</div>`)); }
  // the seats
  K.head('THE PLAYERS');
  for (const q of C.seats) {
    const d = K.block({ 'border-left': `6px solid ${q.colour}`, opacity: C.turn.seat === q.seat || over ? 1 : 0.85 });
    const stats = q.stats.map((s) => `<span style="margin-right:12px">${s.label} <b style="font-size:${s.big ? '1.25em' : '1em'}">${s.value}</b></span>`).join('');
    d.appendChild(K.line(`<span style="color:${q.colour};font-size:1.2em">${SHAPE[q.shape] || '●'}</span> <b>${q.name}</b> <span style="opacity:.6">(${q.colourName})</span>${C.turn.seat === q.seat && !over ? ' ◂ <i>their turn</i>' : ''}${q.badge ? ` · <b>${q.badge}</b>` : ''}`));
    d.appendChild(K.line(stats, { 'margin-top': '3px' }));
    if (q.top) d.appendChild(K.line(`threw away: ${q.top}`, { opacity: 0.75 }));
    if (q.tell) d.appendChild(K.line('<b>◆ a tell</b>: their top chip wiggled', { color: '#f2c14e' }));
  }
  // the end, or the footer
  if (over) { K.head('AGAIN?'); const r = K.rows(); K.button(r, `Again for ${T.stake} chips`, '', () => S.again(false)); K.button(r, 'Practise', 'free', () => S.again(true)); K.button(r, 'Leave the table', '', () => S.close()); }
  K.head('TABLE'); const f = K.rows();
  K.button(f, 'How to play', 'the steps again', () => S.showHowto());
  speedRow(S, K);
}

/** The choices as buttons: label, what it does, what it would bring (in its tone's colour and mark), the house's suggestion marked. */
function moves(S, C, K, list = C.moves) {
  K.head('YOUR CHOICES');
  const r = K.rows();
  for (const m of list) {
    const [col, mark] = TONE[m.tone] || ['#ddd', ''];
    const sub = `${m.what || ''}${m.preview ? `${m.what ? ' · ' : ''}<span style="color:${col}">${mark} ${m.preview}</span>` : ''}${m.best ? ' · <b style="color:#c9a24a">Suggested</b>' : ''}`;
    K.button(r, m.label, sub, () => S.move(m.move), { 'font-size': m.size === 'big' ? '1.15em' : '1em', 'border-left': m.best ? '4px solid #c9a24a' : '' });
  }
}

// ---------------------------------------------------------------- each game's own pieces
const MINE = {
  querent(S, C, K) {
    const V = S.T.game.view(S.S, 0), sh = C.extra.shape, P = S.T.game.pending(S.S), discard = C.turn.yours && P?.kind === 'discard', wheel = C.extra.select?.kind === 'cards';
    const sel = (S.sel ||= new Set());
    const b = K.block(); b.appendChild(K.line(`<b>YOUR HAND</b> · seat suit <b style="color:${SUIT_COLOURS[V.seatSuit].hex}">${C.extra.seatSuit}</b>${V.quads.length ? ` · fours set aside: ${V.quads.map((r) => RANKS[r]).join(', ')}` : ''}${V.fate ? ` · <b>Fate Clause (${V.fate.by})</b>` : ''}`));
    const part = (title, idxs, colour) => {
      if (!idxs.length) return;
      const row = K.line(`<span style="opacity:.7">${title}</span> `, { margin: '4px 0' });
      for (const i of idxs) {
        const m = discard ? C.moves.find((x) => x.card === i) : null, c = V.hand[i];
        const s = K.line(`${card(c, true)}${m?.preview ? `<span style="font-size:.75em;opacity:.8"> ${m.waits}</span>` : ''}`, { display: 'inline-block', padding: '4px 8px', margin: '2px', border: `2px solid ${wheel && sel.has(i) ? '#fff' : colour}`, 'border-radius': '5px', cursor: m || wheel ? 'pointer' : 'default', background: m?.best ? 'rgba(201,162,74,.25)' : 'transparent' });
        if (m) { s.title = `${m.label}: ${m.what}${m.preview ? `. ${m.preview}` : ''}`; s.onclick = () => S.move(m.move); }
        else if (wheel) s.onclick = () => { if (sel.has(i)) sel.delete(i); else sel.add(i); S.render(); };
        row.appendChild(s);
      }
      b.appendChild(row);
    };
    sh.groups.forEach((g, k) => part(`group ${k + 1}`, g, '#c9a24a'));
    part('pairs (want a third)', sh.pairs.flat(), '#888');
    part('loose', sh.loose, '#444');
    if (discard) b.appendChild(K.line('Click a card to throw it back. The small number is how many different cards would then win for you.', { opacity: 0.75, 'margin-top': '4px' }));
    if (C.extra.arcana.length) { const a = K.block(); a.appendChild(K.line('<b>YOUR MAJOR ARCANA</b>')); for (const x of C.extra.arcana) a.appendChild(K.line(`<b>${x.name}</b>: ${x.does}`)); }
    if (wheel) { const r = K.rows(); const ix = [...sel].sort((a, b2) => a - b2); K.button(r, `Swap ${ix.length} card${ix.length === 1 ? '' : 's'}`, 'click cards above to choose', () => { S.sel = new Set(); S.move(P.moves.find((m) => m.throw.length === ix.length && m.throw.every((v, k) => v === ix[k])) || { throw: [] }); }); }
  },
  zodiac(S, C, K) {
    const me = C.seats[0], b = K.block(); b.appendChild(K.line('<b>YOUR TILES</b> (dark = shut, gold rim = locked forever)'));
    const row = K.line('', { margin: '4px 0' });
    for (const t of me.tiles) row.appendChild(K.line(`${t.n}`, { display: 'inline-block', width: '2em', 'text-align': 'center', padding: '4px 0', margin: '2px', 'font-size': '1.15em', 'font-weight': 700, 'border-radius': '4px', border: `2px solid ${t.locked ? '#c9a24a' : '#555'}`, background: t.shut ? '#222' : 'rgba(255,255,255,0.12)', color: t.shut ? '#666' : '#fff' }));
    b.appendChild(row);
  },
  eventhorizon(S, C, K) {
    const sel = C.extra.select; if (!sel || !C.turn.yours) return;
    const dsel = (S.dsel ||= []), b = K.block(); b.appendChild(K.line('<b>YOUR DICE</b> · click to choose which to throw'));
    const row = K.line('', { margin: '4px 0' });
    sel.from.forEach((sides, i) => { const on = dsel.includes(i), d = K.line(`d${sides}`, { display: 'inline-block', padding: '6px 10px', margin: '2px', 'font-size': '1.15em', 'font-weight': 700, 'border-radius': '6px', cursor: 'pointer', border: `2px solid ${on ? YOU.hex : '#555'}`, background: on ? `${YOU.hex}44` : 'transparent' }); d.onclick = () => { const k = dsel.indexOf(i); if (k >= 0) dsel.splice(k, 1); else dsel.push(i); S.render(); }; row.appendChild(d); });
    b.appendChild(row);
    const want = dsel.map((i) => sel.from[i]).sort((a, c) => a - c).join(), m = C.moves.find((x) => x.dice && x.dice.slice().sort((a, c) => a - c).join() === want);
    const r = K.rows();
    if (m) { const [col, mark] = TONE[m.tone] || ['#ddd', '']; K.button(r, `Throw ${m.label}`, `<span style="color:${col}">${mark} ${m.preview}</span>${m.what ? ` · ${m.what}` : ''}`, () => { S.dsel = []; S.move(m.move); }, { 'font-size': '1.15em' }); }
    else K.button(r, 'Choose dice to throw', `you need ${C.extra.need}`, () => {});
    const bestM = C.moves.find((x) => x.best && x.dice); if (bestM) K.button(r, `Suggested: ${bestM.label}`, bestM.preview, () => { S.dsel = []; S.move(bestM.move); });
    const stand = C.moves.find((x) => x.move.stand); if (stand) K.button(r, stand.label, stand.what, () => S.move(stand.move));
  },
  supernova(S, C, K) {
    const me = C.seats[0], b = K.block(); b.appendChild(K.line(`<b>YOUR DICE</b> <span style="font-size:1.3em;font-weight:700">${me.hand.map((s) => `d${s}`).join('  ') || 'none'}</span>`));
    const L = C.extra.last; if (L?.react != null) b.appendChild(K.line(`${L.seat === 0 ? 'Your' : `${S.T.names[L.seat]}'s`} last roll: ${L.faces.join(' + ') || 'nothing'} = <b>${L.react}</b>${L.born ? ` · ${L.born} new ${L.born === 1 ? 'die' : 'dice'}` : ''}${L.decayed ? ` · ${L.decayed} shrank` : ''}${L.lost ? ` · ${L.lost} lost` : ''}`, { opacity: 0.85 }));
  },
  nebula(S, C, K) {
    const x = C.extra; if (!x.faces) return;
    const b = K.block(); b.appendChild(K.line('<b>YOUR SECRET HAND</b> (★ = top number: +10)'));
    b.appendChild(K.line(x.mine.map((s, i) => `<span style="display:inline-block;margin:2px 6px 2px 0"><span style="opacity:.6;font-size:.8em">d${s}</span> <b style="font-size:1.3em">${x.faces[i]}</b>${x.faces[i] === s ? '★' : ''}</span>`).join(''), { margin: '4px 0' }));
  },
};
/** A game whose choices are made on its pieces above (the buttons would repeat them): true to skip the list. */
const SELF = { eventhorizon: (C) => !!C.extra.select, querent: (C) => C.turn.kind === 'discard' || C.turn.kind === 'wheel' };
