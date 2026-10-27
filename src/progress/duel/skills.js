// ---------------------------------------------------------------------------------------
// THE WORN PAIR AS SKILLS (docs/plans/PUZZLE-DUELS.md 22; South, 2026-10-27: "polish and reiterate until we hit the quality of puzzle
// titles like puzzle & dragon, terra battle, candy crush ... You have permission to design, draft, and implement anything"): in the
// one-gesture duel the Courier never walks the board. The two tools worn are two skills, each charged by your clears (every gem you clear
// is a point, a gem of the Figment's weak colour 1.5, and each chain step past the first adds its step again: skill skips grind), and
// fired from its button at a cell of your half as a free action (no action point): the big play, the Courier diving into the board to
// make it (the camera's moment, Calissa's). A skill spent starts again from nothing.
//   Shot (the psygun)        the three rows through the cell clear: gems, junk and embers alike (Candy Crush's striped candy, widened)
//   Vein (the Dreamvane)     every gem of the colour at the cell clears (the dowser's vein; Candy Crush's colour bomb)
//   Paint (the Soul Brush)   every gem in the 3 x 3 round the cell takes the colour of the gem at it (Puzzle & Dragons' orb change)
//   Grab (the Sondelass)     every piece of junk and every ember in the 5 x 5 round the cell is hooked out and thrown across as junk
//   Tune (the Crucibelle)    the colour of the gem at the cell clears in any 3 touching, this turn and the next of yours
//   Hold (the Lockheart)     the junk waiting to land on you (up to `max`) is taken into the coffin and thrown back at once
//   Read (the Veritome)      two action points back, and the fog lifted for three of your turns
// The needs were set by measure (scripts: PUZZLE-DUELS.md 22.3) so each fires about once in two or three turns of a person's play.
//
// Prior art: Puzzle & Dragons' active skills (charged by play, fired free, the big play of a turn), Puzzle Quest's spells (mana from the
// gems you match), Candy Crush's striped candies and colour bombs (a line, a colour), Puyo Puyo Fever's fever (a meter filled by chains).
//
//   SKILLS[tool] = { need, label, line, target: 'cell' | null, legal?(s, side, a), apply(s, side, a) -> events }
//   SKILL_ACTION (duel.js ACTIONS.skill: { kind: 'skill', tool, at? })   chargeFrom(s, events) (settle's charge, both sides)   skillsOf(s, side) -> [{ tool, charge, need, ready }]
//   events: skill { side, tool, at }, charge { side, tool, charge, need, ready } (a skill filled), and each skill's own: blast { at, rows } (Shot),
//   vein { at, colour } (Vein), recolour + paint (Paint), hold { id, at, by: 'grab' } + hold.send (Grab: the classic beats, so the view keeps up),
//   tune { colour, turns }, hold.send { from: 'pending' } (Hold), read { plies, ap }; a blast's clears carry `by` 'blast' or 'vein'
// ---------------------------------------------------------------------------------------
import { hasTag } from './board.js';
import { resolve } from './rules.js';

const mineIn = (b, side, x, y) => b.in(x, y) && b.mine(side, x);
const gemAt = (b, side, at) => at && mineIn(b, side, at[0], at[1]) && hasTag(b.at(at[0], at[1]), 'matches') ? b.at(at[0], at[1]) : null;
const onSide = (b, side, at) => !!at && mineIn(b, side, at[0], at[1]);

/** A set of cells cleared at once by a skill: resolved as a clear (junk beside it breaks, a bomb goes off), counted as the chain's
 *  first step on the mover's side, and what falls after it counts on from there (duel.js settle's `chainFrom`). */
function blast(s, side, cells, by) {
  const b = s.board, keys = new Set(cells.filter(([x, y]) => b.at(x, y) && !hasTag(b.at(x, y), 'body') && b.at(x, y).kind !== 'orb').map((c) => c.join()));
  if (!keys.size) return [];
  const out = resolve(b, keys, s.rs);
  for (const e of out.events) if (e.type === 'clear' || e.type === 'break') e.by = by;
  const n = out.cleared[side];
  if (n >= 3) { s.sides[side].sent += Math.max(0, n - 2); out.events.push({ type: 'chain', side, step: 1, cleared: n, skill: by }); s.chainFrom = side === 0 ? [1, 0] : [0, 1]; }
  return out.events;
}

export const SKILLS = {
  psygun: { need: 9, label: 'Shot', line: 'Clears the three rows through a cell: gems, junk and embers', target: 'cell',
    apply: (s, side, a) => { const b = s.board, cells = []; for (let dy = -1; dy <= 1; dy++) for (let x = 0; x < b.w; x++) if (mineIn(b, side, x, a.at[1] + dy)) cells.push([x, a.at[1] + dy]); return [{ type: 'blast', side, at: a.at, rows: [a.at[1] - 1, a.at[1] + 1] }, ...blast(s, side, cells, 'blast')]; } },
  dreamvane: { need: 10, label: 'Vein', line: 'Clears every gem of one colour on your half', target: 'cell',
    legal: (s, side, a) => !!gemAt(s.board, side, a.at),
    apply: (s, side, a) => { const b = s.board, colour = b.at(...a.at).colour, cells = []; b.each((p, x, y) => { if (b.mine(side, x) && hasTag(p, 'matches') && p.colour === colour) cells.push([x, y]); }); return [{ type: 'vein', side, at: a.at, colour }, ...blast(s, side, cells, 'vein')]; } },
  soulbrush: { need: 8, label: 'Paint', line: 'Turns the 3 x 3 round a gem to that gem\'s colour', target: 'cell',
    legal: (s, side, a) => !!gemAt(s.board, side, a.at),
    apply: (s, side, a) => { const b = s.board, colour = b.at(...a.at).colour, ev = [{ type: 'recolour', side, colour, at: a.at, n: 0 }];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = a.at[0] + dx, y = a.at[1] + dy, p = gemAt(b, side, [x, y]);
        if (p && p.colour !== colour) { ev.push({ type: 'paint', side, id: p.id, at: [x, y], from: p.colour, colour }); p.colour = colour; } }
      ev[0].n = ev.length - 1; return ev; } },
  sondelass: { need: 6, label: 'Grab', line: 'Hooks the junk out of a 5 x 5 and throws it across', target: 'cell',
    legal: (s, side, a) => onSide(s.board, side, a.at) && grabbed(s, side, a.at).length > 0,
    apply: (s, side, a) => { const b = s.board, got = grabbed(s, side, a.at), ev = [];
      for (const [x, y] of got) { const p = b.at(x, y); b.set(x, y, null); ev.push({ type: 'hold', side, id: p.id, at: [x, y], by: 'grab' }); }
      s.sides[side].sent += got.length; ev.push({ type: 'hold.send', side, n: got.length }); return ev; } },
  crucibelle: { need: 7, label: 'Tune', line: 'One colour clears at any 3 touching, this turn and your next', target: 'cell',
    legal: (s, side, a) => !!gemAt(s.board, side, a.at),
    apply: (s, side, a) => { const S = s.sides[side], colour = s.board.at(...a.at).colour; S.tune = colour; S.tuneLeft = 2; return [{ type: 'tune', side, colour, need: 3, turns: 2 }]; } },
  lockheart: { need: 8, label: 'Hold', line: 'Throws the junk about to land on you straight back', target: null, max: 9,
    legal: (s, side) => s.sides[side].pending > 0,
    apply: (s, side) => { const S = s.sides[side], n = Math.min(S.pending, SKILLS.lockheart.max); S.pending -= n; S.sent += n; return [{ type: 'hold.send', side, n, from: 'pending' }]; } },
  veritome: { need: 7, label: 'Read', line: 'Two action points back, and the fog lifts for three turns', target: null,
    apply: (s, side) => { s.apLeft += 2; s.sides[side].read = Math.max(s.sides[side].read || 0, 6); return [{ type: 'read', side, plies: 6, ap: 2 }]; } },
};
export const SKILL_TOOLS = Object.keys(SKILLS);

/** The junk and embers a Grab hooks: in the 5 x 5 round the cell, on your half. */
function grabbed(s, side, at) {
  const b = s.board, out = [];
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = at[0] + dx, y = at[1] + dy, p = mineIn(b, side, x, y) && b.at(x, y); if (p && (p.kind === 'junk' || p.kind === 'ember')) out.push([x, y]); }
  return out;
}

/** The skills a side wears now, each with its charge (the view's tiles, the bot's choices). */
export function skillsOf(s, side) {
  const S = s.sides[side]; return (S.tools || []).filter((t) => SKILLS[t]).map((tool) => ({ tool, ...SKILLS[tool], charge: S.charge?.[tool] || 0, ready: (S.charge?.[tool] || 0) >= SKILLS[tool].need }));
}

/** The free action that fires a skill: worn, charged, and its target (a cell of your half where it asks one) good. */
export const SKILL_ACTION = { form: null, cost: 0,
  legal: (s, side, a) => { const S = s.sides[side], K = SKILLS[a.tool]; if (!K || !(S.tools || []).includes(a.tool) || (S.charge?.[a.tool] || 0) < K.need) return false;
    if (K.target === 'cell' && !onSide(s.board, side, a.at)) return false; return K.legal ? K.legal(s, side, a) : true; },
  apply: (s, side, a) => { const S = s.sides[side]; S.charge[a.tool] = 0; S.skills = (S.skills || 0) + 1; return [{ type: 'skill', side, tool: a.tool, at: a.at || null }, ...SKILLS[a.tool].apply(s, side, a)]; } };

const SKILL_BY = new Set(['blast', 'vein']); // (a skill's own blast charges nothing: no skill fires itself)

/** Charge from what a settle cleared (duel.js calls it with the settle's events): a point a gem cleared on that side (a weak gem's
 *  `k`), and each chain step past the first adds its step again. A skill coming full says so once (`charge` with ready). */
export function chargeFrom(s, events, weak = null) {
  const out = [];
  for (const side of [0, 1]) {
    const S = s.sides[side], worn = (S.tools || []).filter((t) => SKILLS[t]); if (!worn.length) continue;
    let pts = 0;
    for (const e of events) {
      if (e.side !== side) continue;
      if (e.type === 'clear' && e.colour && !SKILL_BY.has(e.by)) pts += weak && side === 0 && e.colour === weak.weak ? weak.k[0] : 1;
      if (e.type === 'chain' && e.step >= 2) pts += e.step;
    }
    if (!pts) continue;
    S.charge ||= {};
    for (const t of worn) { const was = S.charge[t] || 0, need = SKILLS[t].need, now = Math.min(need, was + pts); S.charge[t] = now; if (was < need && now >= need) out.push({ type: 'charge', side, tool: t, charge: now, need, ready: true }); }
  }
  return out;
}

/** The skill actions worth trying for a side now (each ready skill at each cell of its half that takes it; one for an untargeted). */
export function skillActions(s, side) {
  const out = [], b = s.board;
  for (const K of skillsOf(s, side)) {
    if (!K.ready) continue;
    if (K.target !== 'cell') { out.push({ kind: 'skill', tool: K.tool }); continue; }
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) if (b.mine(side, x)) out.push({ kind: 'skill', tool: K.tool, at: [x, y] });
  }
  return out;
}

