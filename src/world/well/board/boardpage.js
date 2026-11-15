// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD'S PAGE, A DRAFT (docs/plans/WELL-BOARD.md 7, 11, 12): the turn's words and buttons, on a page of the index window
// set aside beside the board drawn in 3D (vfx/wellboard/boardview.js), so the draft can be played with a mouse or a finger. A
// PLACEHOLDER LOOK; what it must already do is read at a glance, as CLARITY.md asks: a genre word, one line of effect, numbers as
// stats, shown before it is said.
//   WHAT IS      the floor and its door; the seats (whose turn, purse, haul, cracks); your cracks, ward, re-rolls, items and haul
//   THE TURN     pick a die, then throw it (two taps: a phone has the preview a mouse gets by hovering), with where it can land in
//                one line; or use an item; or set a die into a power; or leave
//   A BATTLE     Dicey Dungeon's screen in words: the foe's health and the dice of the blow it will land, your poise and guard,
//                your hand of dice, and your six tool slots; a die is picked, then the slot it goes in; only slots it fits are lit
//   THE REST     each other decision as buttons with what each does: a fork, a re-roll, a loaded die's face, a duel's stance, a
//                shop, a drawn Arcana, a power's target, a trial's stand-in
//   THE END      the standings, with the bonus awards
//
// Prior art: Mario Party's turn menu (dice, items, map) and results screen; Dicey Dungeon's equipment cards with their slot rules
// printed on them; Slay the Spire's intent; Into the Breach's "what this will do" shown before the move; the bazaar's page
// (world/bazaar/views.js) for the kit of blocks and buttons.
//
//   renderBoard(session, { im, el })
// ---------------------------------------------------------------------------------------
import { KINDS } from '../../../progress/wellboard/layout.js';
import { ITEMS, STANCES, POWERS, POWER_IDS } from '../../../progress/wellboard/items.js';
import { GEAR, GEAR_IDS, SLOT, fits, blowOf } from '../../../progress/wellboard/battle.js';

const TIER = ['#b08968', '#9fb7a0', '#6fa8c9', '#b58ad6', '#f0c75e'];
const css = (o) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(';');
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
const OUT = { up: 'walked up', foe: 'downed the FOE', over: 'came up when the FOE fell', whistle: 'out by the Wake Whistle', fall: 'fell' };

/** A die's reach in one line: how many of its faces can land on each kind. */
function reachLine(d) {
  const n = {}; for (const f of d.reach) for (const k of new Set(f.lands.map((l) => (l.stray ? 'the stray' : l.rival ? 'a rival' : l.cleared || l.taken ? 'spent' : l.kind)))) n[k] = (n[k] || 0) + 1;
  return Object.entries(n).sort((a, b) => b[1] - a[1]).map(([k, c]) => `<b>${c}</b> in ${d.reach.length} ${k === 'spent' ? 'a space already worked' : (KINDS[k]?.label || k)}`).join(' · ');
}
const landWords = (lands) => lands.map((l) => (l.stray ? 'the stray' : l.rival ? `${KINDS[l.kind].label}, a rival on it` : l.cleared || l.taken ? `${KINDS[l.kind].label} (already worked)` : l.kind === 'shift' ? `Shift ${l.shift > 0 ? '+' : ''}${l.shift}` : KINDS[l.kind].label)).join(' or ');
const pips = (n, of, on, off = 'rgba(255,255,255,.2)') => [...Array(of)].map((_, i) => `<span style="color:${i < n ? on : off}">●</span>`).join('');
const bar = (n, of, colour) => `<span style="display:inline-block;width:76px;height:9px;border-radius:5px;background:rgba(255,255,255,.14);vertical-align:middle;overflow:hidden"><span style="display:block;height:100%;width:${Math.max(0, Math.min(100, (100 * n) / of))}%;background:${colour}"></span></span>`;
const dieBox = (text, colour = '#fff1d6', dim = false) => `<span style="display:inline-block;min-width:22px;padding:2px 5px;margin:0 2px;border-radius:5px;border:2px solid ${colour};color:${colour};font-weight:700;text-align:center;opacity:${dim ? 0.3 : 1}">${text}</span>`;

export function renderBoard(B, { im, el }) {
  const S = B.S; if (!S) return;
  const R = B.readout(), P = R.pending, add = (n) => { im.appendChild(n); return n; };
  const block = (html, style = {}) => { const d = el('div', '', html); d.style.cssText = css({ margin: '6px 0', padding: '8px 10px', 'border-radius': '6px', background: 'rgba(255,255,255,0.05)', ...style }); return add(d); };
  const rows = () => add(el('div', 'rooms'));
  const button = (into, title, sub, go, style = {}) => { const d = el('div', 'room', `<span><b>${title}</b><s>${sub || ''}</s></span>`); d.style.cssText = css(style); if (go) d.onclick = go; else d.style.opacity = style.opacity ?? 0.35; into.appendChild(d); return d; };
  const has = (id) => P?.moves.some((m) => m.id === id);

  // what is: the floor, the seats, yours
  const depth = Math.max(0, R.at.depth - 1), F = S.floors[depth], foe = F.spaces[F.door].kind === 'foe', open = R.keys >= R.need;
  const fighting = P?.kind === 'battle' && P.yours && !B.done; // (a battle is the whole page: the board's standing waits under it)
  if (!fighting) block(`<b>FLOOR ${depth + 1}</b> · ${foe ? (open ? 'the FOE is awake' : 'the FOE sleeps') : open ? 'the door is open' : 'the door is shut'} · <b>${Math.min(R.keys, R.need)}</b> of ${R.need} floors cleared · round ${R.round}`, { 'font-size': '.95em' });
  if (R.seats.length > 1 && !fighting) block(R.seats.map((s) => `<div style="opacity:${s.out ? 0.45 : 1};${s.seat === R.turn && !s.out ? 'font-weight:700' : ''}"><span style="color:${hex(B.cast[s.seat].color)}">${s.seat === R.turn && !s.out ? '▶' : '●'}</span> ${s.name} · ${s.out ? OUT[s.out] : `F${s.depth}`} · <b>${s.cubes}</b>c · ${s.haul} haul · ${pips(s.cracks, R.bears, '#ff6b5e')}${s.ward ? ' · warded' : ''}</div>`).join(''), { 'font-size': '.85em', 'line-height': '1.5' });
  const haul = R.haul.length ? R.haul.map((h) => `<span title="a material of tier ${h.tier}" style="display:inline-block;width:14px;height:14px;margin:0 2px;border-radius:3px;background:${TIER[h.tier]};vertical-align:middle"></span>`).join('') : '<span style="opacity:.6">nothing yet</span>';
  if (!fighting) block(`<b>CRACKS</b> ${pips(R.cracks, R.bears, '#ff6b5e')} <span style="opacity:.7">(${R.bears}: you fall)</span>${R.ward ? ' · <b style="color:#c9a7ff">WARDED</b>' : ''}<br><b>CUBES</b> ${R.cubes} · <b>RE-ROLLS</b> ${R.rerolls} · <b>HAUL</b> ${haul}${R.items.length ? `<br><b>ITEMS</b> ${R.items.map((id) => `<span title="${ITEMS[id].line}">${ITEMS[id].label}</span>`).join(', ')}` : ''}`, { 'font-size': '.95em' });

  if (B.done) {
    const L = B.last, how = { up: 'Walked up with the haul.', foe: 'The FOE is down. Walked up with the haul.', over: 'A rival downed the FOE. Came up with what was held.', whistle: 'Out by the Wake Whistle, with three quarters of it.', fall: 'Fell. The haul is lost.' }[L.out];
    block(`<b>THE RUN IS OVER.</b> ${how}<br>Deepest floor ${L.deepest} · floors cleared ${L.floors} · pieces home ${L.haul.length} · it would have paid <b>${L.cubes}</b> cubes (a draft: nothing is paid).`, { 'font-size': '1.05em', 'border-left': '4px solid #ffd36a' });
    if (L.standings.length > 1) block('<b>STANDINGS</b>' + L.standings.map((s, i) => `<div style="${s.seat === 0 ? 'font-weight:700' : ''}">${i + 1}. <span style="color:${hex(B.cast[s.seat].color)}">●</span> ${s.name} · <b>${s.score}</b> · ${OUT[s.out]}${s.awards.length ? `<br><span style="opacity:.75;padding-left:18px">★ ${s.awards.join(' · ★ ')}</span>` : ''}</div>`).join(''), { 'font-size': '.9em', 'line-height': '1.5' });
    const r = rows(), again = (o) => B.open({ seed: B.seed, endless: S.endless, rivals: B.rivals, ...o });
    button(r, 'Again, the same board', "the game day's seed", () => again({})); button(r, 'Another board', 'a seed of its own', () => again({ seed: (B.seed * 1103515245 + 12345) >>> 0 }));
    button(r, B.rivals ? 'Alone' : 'With three rivals', B.rivals ? 'no rivals: the board and its strays' : 'three of the siblings race you down', () => again({ rivals: B.rivals ? 0 : 3 }));
    button(r, S.endless ? 'A story run' : 'The endless Well', S.endless ? 'three floors and the FOE' : 'no last floor: how deep?', () => again({ endless: !S.endless }));
    return;
  }
  if (!P) return;
  if (B.view?.active && B.view.busy) { block('The board is moving. Click it to hurry.', { opacity: 0.7 }); return; } // (the turn's beats are playing: the next decision is shown when they are done)
  const title = { throw: 'YOUR TURN · PICK A DIE, THEN THROW IT', reroll: "LUCK'S RE-ROLL", fork: 'A FORK · PICK A LINE', fate: 'A HAZARD', face: 'A LOADED DIE · PICK ITS FACE', swap: 'SWAP · PICK A RIVAL', push: 'PUSH · PICK WHAT IS CARRIED BACK', duel: `A DUEL · ${B.cast[P.vs ?? 0]?.label.toUpperCase()}`, arcana: 'AN ARCANA SPACE', shop: 'A SHOP · ONE ITEM',
    battle: `A BATTLE · ${P.stray ? 'A STRAY' : P.floor === 'foe' ? 'THE FOE' : 'A FIGHT'} · ROUND ${P.battle?.round}`, floor: `FLOOR ${P.depth} · A TRIAL` }[P.kind];
  add(el('div', 'grp', title));

  if (P.kind === 'throw') {
    const pick = R.dice.find((d) => d.sides === B.hover && !d.spent), tray = add(el('div', '')); tray.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:4px 0';
    for (const d of R.dice) {
      const b = el('div', 'room', `<b>d${d.sides}</b>`), on = pick === d;
      b.style.cssText = css({ flex: '1 0 40px', 'justify-content': 'center', 'font-size': '1.2em', padding: '12px 6px', opacity: d.spent ? 0.3 : 1, 'border-color': on ? '#ffd36a' : '', background: on ? 'rgba(255,211,106,.18)' : '' });
      if (!d.spent) { b.onclick = () => { B.hover = d.sides; B.render(); }; b.onmouseenter = () => { if (B.hover !== d.sides) { B.hover = d.sides; B.render(); } }; }
      b.title = d.spent ? 'Spent. It comes back when all six are spent, or at a Rest.' : `The d${d.sides}: a move of 1 to ${d.sides}, a power's price, or a die in your hand in a battle.`;
      tray.appendChild(b);
    }
    if (pick) {
      block(`The <b>d${pick.sides}</b>${R.twin ? ', thrown twice,' : ''} can land on: ${reachLine(pick)}`, { 'font-size': '.95em' });
      const r = rows(); button(r, R.loaded ? `Set the d${pick.sides}'s face` : `Throw the d${pick.sides}`, R.loaded ? 'a loaded die: you pick where it lands' : `move 1 to ${pick.sides}; the die is spent`, () => B.take({ id: 'throw', sides: pick.sides }), { 'font-size': '1.15em', 'border-color': '#ffd36a' });
      const powers = POWER_IDS.filter((id) => P.moves.some((m) => m.id === 'power' && m.power === id && m.sides === pick.sides));
      if (powers.length) { add(el('div', 'grp', `OR SPEND THE d${pick.sides} ON A POWER`)); const q = rows(); for (const id of powers) button(q, POWERS[id].label, POWERS[id].line, () => B.take({ id: 'power', power: id, sides: pick.sides })); }
    } else block('A die is spent once a cast: on a <b>move</b>, or set into a <b>power</b>. The dice you keep are your hand in a <b>battle</b>. Pick one to see where it could set you down.', { opacity: 0.8, 'font-size': '.9em' });
    const uses = P.moves.filter((m) => m.id === 'use');
    if (uses.length) { add(el('div', 'grp', 'AN ITEM, BEFORE THE THROW')); const r = rows(); for (const m of uses) button(r, ITEMS[m.item].label, ITEMS[m.item].line, () => B.take({ id: 'use', item: m.item })); }
    const r = rows();
    if (has('retry')) button(r, R.at.kind === 'genre' ? 'Play this trial again' : 'Fight here again', 'in place of a throw', () => B.take({ id: 'retry' }));
    if (has('leave')) button(r, 'Leave by the way up', `the run ends; ${R.cubes} cubes and ${R.haul.length} piece${R.haul.length === 1 ? '' : 's'} come home`, () => B.take({ id: 'leave' }));
    if (has('whistle')) button(r, 'Blow the Wake Whistle', 'the run ends from here; three quarters comes home', () => B.take({ id: 'whistle' }));
  } else if (P.kind === 'battle') {
    const T = P.battle, blow = blowOf(T), sel = B.die != null && T.hand[B.die] && !T.hand[B.die].used ? B.die : null;
    block(`<b>${P.stray ? 'THE STRAY' : P.floor === 'foe' ? 'THE FOE' : 'THE CREATURES'}</b> ${bar(T.foe.hp, T.foe.hpMax, '#ff6a3c')} <b>${T.foe.hp}</b> of ${T.foe.hpMax}<br>Its blow this round: ${T.foe.intent.map((f) => dieBox(f, '#ff6b5e', T.foe.stopped)).join('')} = <b>${T.foe.stopped ? 'stopped' : blow}</b>${T.guard && !T.foe.stopped ? ` <span style="opacity:.7">(after your guard of ${T.guard})</span>` : ''}`, { 'border-left': '4px solid #ff6a3c', 'line-height': '1.9' });
    block(`<b>YOUR POISE</b> ${bar(T.hp, T.hpMax, '#7de3ff')} <b>${T.hp}</b> of ${T.hpMax}${T.held ? ` <span style="opacity:.7">(your cracks hold off ${T.held})</span>` : ''} · <b>GUARD</b> ${T.guard}`, { 'border-left': '4px solid #7de3ff' });
    const hand = add(el('div', '')); hand.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:4px 0';
    T.hand.forEach((d, i) => {
      const b = el('div', 'room', `<span style="text-align:center;width:100%"><b style="font-size:1.35em">${d.face}</b><s>${d.half ? 'half' : `d${d.sides}`}</s></span>`);
      b.style.cssText = css({ flex: '1 0 44px', 'justify-content': 'center', padding: '8px 4px', opacity: d.used ? 0.25 : 1, 'border-color': sel === i ? '#ffd36a' : '', background: sel === i ? 'rgba(255,211,106,.18)' : '' });
      if (!d.used) b.onclick = () => { B.die = i; B.render(); };
      hand.appendChild(b);
    });
    if (sel == null) block('Pick a die of your hand, then the tool it goes in. A slot takes only the dice its rule allows.', { opacity: 0.75, 'font-size': '.9em' });
    const r = add(el('div', '')); r.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:4px 0';
    for (const id of GEAR_IDS) {
      const G = GEAR[id], st = T.gear[id], left = G.uses - st.used, ok = sel != null && left > 0 && fits(id, T.hand[sel]);
      button(r, `${G.label} <span style="font-weight:400;opacity:.8;font-size:.8em;border:1px solid currentColor;border-radius:4px;padding:0 4px">${SLOT[G.slot]}${st.count != null ? ` ${st.count}` : ''}</span>`, `${G.line}${left <= 0 ? ' · used this round' : ''}`, ok ? () => { const keep = G.does === 'again' ? sel : null; B.take({ id: 'place', die: sel, gear: id }); if (keep != null) { B.die = keep; B.render(); } } : null, { opacity: ok ? 1 : sel == null && left > 0 ? 0.7 : 0.3, 'border-color': ok ? '#ffd36a' : '', padding: '6px 8px', 'font-size': '.85em' });
    }
    const e = rows(); button(e, 'End the round', T.foe.stopped ? 'its blow is stopped; a new hand is thrown' : blow ? `its blow lands: ${blow} off your poise; then a new hand` : 'its blow is guarded; a new hand is thrown', () => B.take({ id: 'end' }), { 'font-size': '1.05em' });
  } else if (P.kind === 'reroll') {
    const f = P.reach.find((x) => x.face === P.face);
    block(`You threw <b>${P.face}</b> on the d${P.sides}. It lands on: <b>${landWords(f.lands)}</b>.`, { 'font-size': '1.1em' });
    const r = rows(); button(r, `Keep the ${P.face}`, 'move', () => B.take({ id: 'keep' }), { 'font-size': '1.1em' }); button(r, 'Throw it again', `Luck's re-roll: ${R.rerolls} left this run`, () => B.take({ id: 'again' }));
  } else if (P.kind === 'fork') {
    block(`You threw <b>${S.move.face}</b> on the d${S.move.sides}. <b>${P.left}</b> to move, and the way forks here.`, { 'font-size': '1.05em' });
    const r = rows(); for (const m of P.moves) button(r, m.to.includes('.s') ? (F.side.which === 'short' ? 'The short cut' : 'The long way') : 'The main line', `lands on: ${landWords(m.lands)}`, () => B.take({ id: 'fork', to: m.to }));
  } else if (P.kind === 'face') {
    const g = add(el('div', '')); g.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:4px';
    for (const m of P.moves) { const d = el('div', 'room', `<span><b>${m.face}</b><s>${landWords(m.lands)}</s></span>`); d.style.cssText = 'padding:6px 8px'; d.onclick = () => B.take({ id: 'face', face: m.face }); g.appendChild(d); }
  } else if (P.kind === 'swap' || P.kind === 'push') {
    const r = rows(); for (const m of P.moves) button(r, m.stray ? 'The stray' : B.cast[m.seat].label, P.kind === 'push' ? `carried back 1 to ${P.sides} spaces` : `on floor ${R.seats[m.seat].depth}: you trade places`, () => B.take(m.stray ? { id: 'push', stray: true } : { id: m.id, seat: m.seat }));
  } else if (P.kind === 'duel') {
    block(P.defend ? `<b>${B.cast[P.vs].label}</b> has landed on your space. Each picks a stance in secret; the winner takes the loser's newest material, or ${15} cubes.` : `You have landed on <b>${B.cast[P.vs].label}</b>. Each picks a stance in secret; the winner takes the loser's newest material, or ${15} cubes.`, { 'border-left': `4px solid ${hex(B.cast[P.vs].color)}` });
    const r = rows(); for (const [id, s] of Object.entries(STANCES)) button(r, s.label, `beats ${STANCES[s.beats].label}`, () => B.take({ id: 'stance', stance: id }), { 'font-size': '1.05em' });
  } else if (P.kind === 'fate') {
    const r = rows(); button(r, 'Throw the fate die', `saved on ${Math.round(P.odds * 100)} in 100; else a crack${R.ward ? ' (your ward would turn it)' : ''}`, () => B.take({ id: 'fate' }), { 'font-size': '1.1em' });
  } else if (P.kind === 'arcana') {
    const r = rows(); button(r, 'Draw a Major Arcana', 'it does what it says, for good or ill', () => B.take({ id: 'draw' }), { 'font-size': '1.1em' });
  } else if (P.kind === 'shop') {
    const r = rows(), full = R.items.length >= 3;
    for (const id of P.stock) { const can = P.moves.some((m) => m.id === 'buy' && m.item === id); button(r, `${ITEMS[id].label} · ${ITEMS[id].cost} cubes`, `${ITEMS[id].line}${can ? '' : full ? ' · your hands are full' : ' · not enough cubes'}`, can ? () => B.take({ id: 'buy', item: id }) : null); }
    button(r, 'Buy nothing', `you hold ${R.cubes} cubes`, () => B.take({ id: 'pass' }));
  } else if (P.kind === 'floor') {
    block('<b>A stand-in.</b> A trial is a floor of another kind of game, and none is wired to the board yet. Say how it went.', { 'border-left': '4px solid #ff5fd2' });
    const r = rows(); button(r, 'Cleared', 'a material a tier higher, and cubes', () => B.floor('clear'), { 'font-size': '1.1em' }); button(r, 'Cleared well', 'a material two tiers higher', () => B.floor('true')); button(r, 'Failed', 'a crack; the newest piece of the haul is dropped', () => B.floor('fail'));
  }
}
