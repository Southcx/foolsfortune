// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD'S PAGE, A DRAFT (docs/plans/WELL-BOARD.md 7): the board drawn from the rules' readout on a page of the index
// window, so the draft can be played with a mouse or a finger. A PLACEHOLDER LOOK (the board's real look is Calissa's: the floor as
// a ring of tiles in the world, your stones thrown on it); what it must already do is read at a glance, as CLARITY.md asks:
//   the floor you are on as its ring, the door at the top, your space ringed gold, each space a colour and a mark of its kind;
//   your six dice, the spent ones dark; a die picked shows where it could set you down (a ring on each such space, heavier the more
//   faces land there) and says it in one line, before it is thrown;
//   your cracks against what you bear, the door's keys, Luck's re-rolls, the haul as pieces by tier;
//   the one decision waiting, as buttons, each with what it does.
// A die is picked first and thrown second (two taps), so a phone has the preview a mouse gets by hovering.
//
// Prior art: Mario Party's board map with the dice block's range lit; Slay the Spire's map legend; Into the Breach's "what this will
// do" shown before the move; the bazaar's page (world/bazaar/views.js) for the kit of blocks and buttons.
//
//   renderBoard(session, { im, el })
// ---------------------------------------------------------------------------------------
import { KINDS, BOARD } from '../../../progress/wellboard/layout.js';

const COL = { fight: '#b5533c', genre: '#8a5cc2', cache: '#d9a441', spring: '#4fa79a', hazard: '#d23b2f', shift: '#5c7fb8', rest: '#7c8f5a', door: '#c9b28a', foe: '#2a1a1f', mouth: '#c9b28a', '?': '#55483f' };
const MARK = { fight: 'F', genre: 'T', cache: '◆', spring: '+', hazard: '!', rest: 'R', door: 'D', foe: 'X', mouth: 'M', '?': '?' };
const TIER = ['#b08968', '#9fb7a0', '#6fa8c9', '#b58ad6', '#f0c75e'];
const css = (o) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(';');
const CX = 320, CY = 178, RX = 215, RY = 105, N = BOARD.main;

/** Where a space sits on the page: the main line round an ellipse, the door at the top, going clockwise; a short cut inside the
 *  ring, a long way outside it. */
function spot(s) {
  const a = (-90 + (s.x + 1) * (360 / N)) * Math.PI / 180, k = s.y < 0 ? 0.52 : s.y > 0 ? 1.36 : 1;
  return [CX + Math.cos(a) * RX * k, CY + Math.sin(a) * RY * k];
}
const markOf = (s) => (s.kind === 'shift' ? (s.shift > 0 ? `+${s.shift}` : `${s.shift}`) : MARK[s.kind]);

function drawFloor(V, depth, at, rings, wide) {
  const F = V.floors[depth]; if (!F) return '';
  const by = Object.fromEntries(F.spaces.map((s) => [s.id, s])), P = Object.fromEntries(F.spaces.map((s) => [s.id, spot(s)]));
  let o = `<svg viewBox="0 0 640 356" style="width:100%;max-height:${wide ? 62 : 46}vh;display:block">`;
  o += `<ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}" fill="none" stroke="rgba(255,214,150,.28)" stroke-width="10"/>`;
  for (const s of F.spaces) for (const n of s.next) if (by[n] && (s.side || by[n].side)) o += `<line x1="${P[s.id][0]}" y1="${P[s.id][1]}" x2="${P[n][0]}" y2="${P[n][1]}" stroke="rgba(255,214,150,.28)" stroke-width="6" stroke-dasharray="3 5"/>`;
  for (const s of F.spaces) {
    const [x, y] = P[s.id], spentK = s.cleared || s.taken, ring = rings[s.id], here = s.id === at;
    if (ring) o += `<circle cx="${x}" cy="${y}" r="25" fill="none" stroke="#c9a7ff" stroke-width="${2 + 5 * ring}" opacity="${0.55 + 0.45 * ring}"/>`;
    if (here) o += `<circle cx="${x}" cy="${y}" r="24" fill="none" stroke="#ffd36a" stroke-width="4"/>`;
    o += `<circle cx="${x}" cy="${y}" r="18" fill="${COL[s.kind]}" stroke="#1c0d08" stroke-width="2" opacity="${spentK ? 0.35 : 1}"><title>${KINDS[s.kind]?.label || 'Unknown'}: ${KINDS[s.kind]?.line || 'Past your sight.'}</title></circle>`;
    o += `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="${s.kind === 'cache' || s.kind === 'door' ? '#1c0d08' : '#fff3df'}" opacity="${spentK ? 0.5 : 1}" pointer-events="none">${spentK ? '✓' : markOf(s)}</text>`;
  }
  const door = by[`${depth}.${N - 1}`], open = V.keys[depth] >= V.need;
  if (door) { const [x, y] = P[door.id]; o += `<text x="${x}" y="${y - 28}" text-anchor="middle" font-size="12" fill="${open ? '#ffd36a' : '#e7cfae'}">${door.kind === 'foe' ? (door.cleared ? 'THE FOE IS DOWN' : open ? 'THE FOE IS AWAKE' : 'THE FOE SLEEPS') : open ? 'DOOR OPEN' : 'DOOR SHUT'} · ${Math.min(V.keys[depth], V.need)} OF ${V.need} FLOORS CLEARED</text>`; }
  o += `<text x="${CX}" y="${CY - 6}" text-anchor="middle" font-size="26" font-weight="700" fill="#e7cfae">FLOOR ${depth + 1}</text><text x="${CX}" y="${CY + 16}" text-anchor="middle" font-size="11" fill="#e7cfae" opacity=".7">${at === 'mouth' ? 'you stand at the mouth, before its first space' : F.side === 'short' ? 'a short cut crosses it' : 'a long way runs outside it'}</text>`;
  return o + '</svg>';
}

/** A die's reach in one line: how many of its faces can land on each kind. */
function reachLine(d) {
  const n = {}; for (const f of d.reach) for (const k of new Set(f.lands.map((l) => (l.cleared || l.taken ? 'spent' : l.kind)))) n[k] = (n[k] || 0) + 1;
  return Object.entries(n).sort((a, b) => b[1] - a[1]).map(([k, c]) => `<b>${c}</b> in ${d.sides} ${k === 'spent' ? 'a space already worked' : (KINDS[k]?.label || k)}`).join(' · ');
}
const landWords = (lands) => lands.map((l) => (l.cleared || l.taken ? `${KINDS[l.kind].label} (already worked)` : l.kind === 'shift' ? `Shift ${l.shift > 0 ? '+' : ''}${l.shift}` : KINDS[l.kind].label)).join(' or ');

export function renderBoard(B, { im, el }) {
  const S = B.S; if (!S) return;
  const R = B.readout(), V = { floors: S.floors.map((F) => ({ side: F.side.which, spaces: Object.values(F.spaces).map((s) => ({ ...s, cleared: !!S.cleared[s.id], taken: !!S.taken[s.id] })) })), keys: S.floors.map((F) => (F.depth === R.at.depth - 1 ? R.keys : 0)), need: R.need };
  // a short, wide screen (a phone on its side): the ring on the left, the turn on the right, so the decision is never under the fold
  const wide = typeof window !== 'undefined' && window.innerHeight < 520 && window.innerWidth > window.innerHeight * 1.5;
  const left = im.appendChild(el('div', '')), right = wide ? el('div', '') : im;
  if (wide) { const row = el('div', ''); row.style.cssText = 'display:flex;gap:12px;align-items:flex-start'; left.style.cssText = 'flex:1 1 52%;min-width:0'; right.style.cssText = 'flex:1 1 48%;min-width:0'; im.appendChild(row); row.appendChild(left); row.appendChild(right); }
  const add = (n) => { right.appendChild(n); return n; }, P = R.pending;
  const block = (html, style = {}) => { const d = el('div', '', html); d.style.cssText = css({ margin: '6px 0', padding: '8px 10px', 'border-radius': '6px', background: 'rgba(255,255,255,0.05)', ...style }); return add(d); };
  const rows = () => add(el('div', 'rooms'));
  const button = (into, title, sub, go, style = {}) => { const d = el('div', 'room', `<span><b>${title}</b><s>${sub || ''}</s></span>`); d.style.cssText = css(style); d.onclick = go; into.appendChild(d); return d; };
  for (const F of S.floors) V.keys[F.depth] = S.floors[F.depth] ? Object.keys(S.cleared).filter((id) => id.startsWith(`${F.depth}.`) && F.spaces[id]?.kind !== 'foe').length : 0;

  // the floor, with the picked die's reach ringed on it
  const depth = Math.max(0, R.at.depth - 1), pick = P?.kind === 'throw' ? R.dice.find((d) => d.sides === B.hover && !d.spent) : null, rings = {};
  const src = pick ? pick.reach : P?.kind === 'reroll' ? P.reach.filter((f) => f.face === P.face) : P?.kind === 'fork' ? P.moves.map((m) => ({ lands: m.lands })) : [];
  for (const f of src) for (const l of f.lands) rings[l.id] = Math.min(1, (rings[l.id] || 0) + 1 / Math.max(1, src.length));
  left.innerHTML = drawFloor(V, depth, R.at.id, rings, wide);

  // what is: cracks, re-rolls, the haul
  const pips = (n, of, on, off) => [...Array(of)].map((_, i) => `<span style="color:${i < n ? on : off}">●</span>`).join('');
  const haul = R.haul.length ? R.haul.map((h) => `<span title="a material of tier ${h.tier}, from a ${h.why === 'genre' ? 'trial' : h.why}" style="display:inline-block;width:14px;height:14px;margin:0 2px;border-radius:3px;background:${TIER[h.tier]};vertical-align:middle"></span>`).join('') : '<span style="opacity:.6">nothing yet</span>';
  block(`<b>CRACKS</b> ${pips(R.cracks, R.bears, '#ff6b5e', 'rgba(255,255,255,.2)')} <span style="opacity:.7">(${R.bears} and you fall)</span> &nbsp;·&nbsp; <b>RE-ROLLS</b> ${R.rerolls} &nbsp;·&nbsp; <b>HAUL</b> ${haul}`, { 'font-size': '.95em' });

  if (B.done) {
    const L = B.last, how = { up: 'Walked up with the haul.', foe: 'The FOE is down. Walked up with the haul.', whistle: 'Out by the Wake Whistle, with three quarters of it.', fall: 'Fell. The haul is lost.' }[L.out];
    block(`<b>THE RUN IS OVER.</b> ${how}<br>Deepest floor ${L.deepest} · floors cleared ${L.floors} · pieces home ${L.haul.length} · it would have paid <b>${L.cubes}</b> cubes (a draft: nothing is paid).`, { 'font-size': '1.1em', 'border-left': '4px solid #ffd36a' });
    const r = rows(); button(r, 'Again, the same board', "the game day's seed", () => B.open({ seed: B.seed, endless: S.endless })); button(r, 'Another board', 'a seed of its own', () => B.open({ seed: (B.seed * 1103515245 + 12345) >>> 0, endless: S.endless })); button(r, S.endless ? 'A story run' : 'The endless Well', S.endless ? 'three floors and the FOE' : 'no last floor: how deep?', () => B.open({ seed: B.seed, endless: !S.endless }));
    return;
  }
  if (!P) return;
  add(el('div', 'grp', { throw: 'YOUR TURN · PICK A DIE, THEN THROW IT', reroll: "LUCK'S RE-ROLL", fork: 'A FORK · PICK A LINE', fate: 'A HAZARD', floor: `FLOOR ${P.depth} · ${P.floor === 'foe' ? 'THE FOE' : P.floor === 'genre' ? 'A TRIAL' : 'A FIGHT'}` }[P.kind]));
  if (P.kind === 'throw') {
    const tray = add(el('div', '')); tray.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:4px 0';
    for (const d of R.dice) {
      const b = el('div', 'room', `<b>d${d.sides}</b>`), on = B.hover === d.sides && !d.spent;
      b.style.cssText = css({ flex: '1 0 64px', 'justify-content': 'center', 'font-size': '1.2em', padding: '12px 6px', opacity: d.spent ? 0.3 : 1, 'border-color': on ? '#ffd36a' : '', background: on ? 'rgba(255,211,106,.18)' : '' });
      if (!d.spent) { b.onclick = () => { B.hover = d.sides; B.render(); }; b.onmouseenter = () => { if (B.hover !== d.sides) { B.hover = d.sides; B.render(); } }; }
      b.title = d.spent ? 'Spent. It comes back when all six are spent, or at a Rest.' : `Throw the d${d.sides}: move 1 to ${d.sides} spaces.`;
      tray.appendChild(b);
    }
    if (pick) { block(`The <b>d${pick.sides}</b> can land on: ${reachLine(pick)}`, { 'font-size': '.95em' }); const r = rows(); button(r, `Throw the d${pick.sides}`, `move 1 to ${pick.sides}; the die is spent`, () => B.take({ id: 'throw', sides: pick.sides }), { 'font-size': '1.15em', 'border-color': '#ffd36a' }); }
    else block('Each die is thrown once before the set comes back. A die picked shows where it could set you down.', { opacity: 0.75 });
    const r = rows();
    if (P.moves.some((m) => m.id === 'retry')) button(r, 'Play this floor again', 'in place of a throw', () => B.take({ id: 'retry' }));
    if (P.moves.some((m) => m.id === 'leave')) button(r, 'Leave by the way up', `the run ends; the haul comes home (${R.haul.length} piece${R.haul.length === 1 ? '' : 's'})`, () => B.take({ id: 'leave' }));
    if (P.moves.some((m) => m.id === 'whistle')) button(r, 'Blow the Wake Whistle', 'the run ends from here; three quarters comes home', () => B.take({ id: 'whistle' }));
  } else if (P.kind === 'reroll') {
    const f = P.reach.find((x) => x.face === P.face);
    block(`You threw <b>${P.face}</b> on the d${P.sides}. It lands on: <b>${landWords(f.lands)}</b>.`, { 'font-size': '1.1em' });
    const r = rows(); button(r, `Keep the ${P.face}`, 'move', () => B.take({ id: 'keep' }), { 'font-size': '1.1em' }); button(r, 'Throw it again', `Luck's re-roll: ${R.rerolls} left this run`, () => B.take({ id: 'again' }));
  } else if (P.kind === 'fork') {
    block(`You threw <b>${S.move.face}</b> on the d${S.move.sides}. <b>${P.left}</b> to move, and the way forks here.`, { 'font-size': '1.05em' });
    const r = rows(); for (const m of P.moves) button(r, m.to.includes('.s') ? (S.floors[depth].side.which === 'short' ? 'The short cut' : 'The long way') : 'The main line', `lands on: ${landWords(m.lands)}`, () => B.take({ id: 'fork', to: m.to }));
  } else if (P.kind === 'fate') {
    const r = rows(); button(r, 'Throw the fate die', `saved on ${Math.round(P.odds * 100)} in 100; else a crack`, () => B.take({ id: 'fate' }), { 'font-size': '1.1em' });
  } else if (P.kind === 'floor') {
    block('<b>A stand-in.</b> This floor is not played yet: the board is a draft, and a floor’s own play is the runtime’s to wire. Say how it went.', { 'border-left': '4px solid #ff5fd2' });
    const r = rows(); button(r, 'Cleared', P.floor === 'foe' ? "the FOE's piece, a tier higher" : 'a material into the haul', () => B.floor('clear'), { 'font-size': '1.1em' });
    if (P.floor !== 'foe') button(r, 'Cleared well', 'a material a tier higher', () => B.floor('true'));
    button(r, 'Failed', 'a crack; the newest piece of the haul is dropped', () => B.floor('fail'));
  }
}
