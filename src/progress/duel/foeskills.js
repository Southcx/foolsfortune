// ---------------------------------------------------------------------------------------
// A FOE SKILL: THE PVE DUEL'S ABERRANT (docs/plans/PUZZLE-DUELS.md 23; South, 2026-10-28: "a true battle of wills complete with your
// aforementioned special moves from the Aberrant, rather than having them also play match 3 ... pve can be much more one-sided in favor
// of the player"). In the PvE duel the aberrant never matches: its half of the board is its mind, frozen, and its turn is its foe skills,
// each on a countdown you can see (Puzzle & Dragons' enemy skills and their turn counters; Into the Breach's telegraphed attacks), each
// aimed at your half or at the Line between you. A big play of yours staggers it: every countdown waits a turn longer.
//
//   Hurl       junk thrown at your half: it lands at the end of your next turn (a Wisp's are embers); Hold and Grab answer it
//   Petrify    gems on your half turned to junk where they lie (Puzzle & Dragons' jammer orbs)
//   Seal       a column of yours locked: no drag may touch it on your next turn (Puzzle & Dragons' bound orbs)
//   Sap        each skill you wear loses half its charge
//   Reclaim    the Line pushed back a column toward you (the aberrant takes a column of its mind back)
//   Kindle     (the Lantern Wisp's own) Dread gems on your half burned into embers: the fuel its secret runs on kept from you (secrets.js)
// A ruleset's `foe`: { moves: [{ skill, every, first?, n?, wake? }], desperate?: { at, moves: [{ skill, n? }] } }: each move fires when its
// countdown (`first`, then `every`) runs out; `desperate` fires once, when the aberrant's half is down to `at` columns. A move with
// `wake: 'half'` sleeps (no countdown, no badge) until its secret is half done (secrets.js `secret.half`): the aberrant noticing.
//
// Prior art: Puzzle & Dragons' enemy skills (the countdown over the enemy, jammers, binds, skill delay), Terra Battle's boss gimmicks,
// Into the Breach's attacks drawn a turn ahead, Candy Crush's blockers.
//
//   FOE_SKILLS[id] = { label, line, fire(s, M, K) -> events }   foeOf(rs) -> s.foe   foeIntent(s) -> [{ skill, label, line, left, n }]
//   K: the kernel's own helpers handed in by duel.js ({ moveLine, gemOf })   events: foe.skill { side: 1, skill, ... }, foe.soon { skill } (it fires
//   on the aberrant's next turn), foe.desperate, foe.stagger
// ---------------------------------------------------------------------------------------
import { piece, hasTag } from './board.js';
import { SKILLS } from './skills.js';

const gemsOf = (s) => { const out = []; s.board.each((p, x, y) => { if (p && s.board.mine(0, x) && hasTag(p, 'matches') && p.kind === 'gem') out.push([x, y]); }); return out; };

export const FOE_SKILLS = {
  hurl: { label: 'Hurl', line: 'Junk lands on your half after your next turn',
    fire: (s, M) => { s.sides[0].pending += M.n; return [{ type: 'foe.skill', side: 1, skill: 'hurl', n: M.n }]; } },
  petrify: { label: 'Petrify', line: 'Gems on your half turn to junk',
    fire: (s, M) => { const b = s.board, cells = gemsOf(s), at = [];
      for (let i = 0; i < M.n && cells.length; i++) { const [x, y] = cells.splice(s.r.int(cells.length), 1)[0], was = b.at(x, y), p = piece('junk'); b.set(x, y, p); at.push({ at: [x, y], from: was.id, id: p.id, colour: was.colour }); }
      return [{ type: 'foe.skill', side: 1, skill: 'petrify', n: at.length, cells: at }]; } },
  seal: { label: 'Seal', line: 'Locks a column of yours for your next turn: nothing in it can be dragged',
    fire: (s) => { const b = s.board; let best = 0, bx = -1; for (let x = 0; x < b.line; x++) { let n = 0; for (let y = 0; y < b.h; y++) if (b.at(x, y)) n++; if (n > best) { best = n; bx = x; } }
      if (bx < 0) return []; s.sides[0].sealed = bx; return [{ type: 'foe.skill', side: 1, skill: 'seal', x: bx, turns: 1 }]; } },
  sap: { label: 'Sap', line: 'Halves the charge of each skill you wear',
    fire: (s) => { const S = s.sides[0], lost = {}; for (const t of Object.keys(S.charge || {})) { if (!SKILLS[t]) continue; const was = S.charge[t]; S.charge[t] = Math.floor(was / 2); lost[t] = was - S.charge[t]; }
      return [{ type: 'foe.skill', side: 1, skill: 'sap', lost }]; } },
  reclaim: { label: 'Reclaim', line: 'Pushes the Line back a column toward you',
    fire: (s, M, K) => [{ type: 'foe.skill', side: 1, skill: 'reclaim', n: 1 }, ...K.moveLine(s, -1)] },
  kindle: { label: 'Kindle', line: 'Burns up to 3 Dread gems on your half into embers', // (Espada's, 2026-10-28)
    fire: (s, M) => { const b = s.board, cells = []; b.each((p, x, y) => { if (b.mine(0, x) && p.kind === 'gem' && p.colour === 'dread') cells.push([x, y]); }); const at = [];
      for (let i = 0; i < M.n && cells.length; i++) { const [x, y] = cells.splice(s.r.int(cells.length), 1)[0], was = b.at(x, y), p = piece('ember', { count: s.rs.embers?.count ?? 3 }); b.set(x, y, p); at.push({ at: [x, y], from: was.id, id: p.id, colour: was.colour }); }
      return [{ type: 'foe.skill', side: 1, skill: 'kindle', n: at.length, cells: at }]; } },
};

/** Is a move counting down: always, or (`wake: 'half'`) once its secret is half done. */
export const awake = (s, m) => !m.wake || (m.wake === 'half' && !!s.secret?.half);

/** The aberrant's countdowns for a new duel, from its ruleset's `foe` (none: it only stands there). */
export function foeOf(rs) {
  const F = rs.foe || { moves: [] };
  return { moves: F.moves.map((m) => ({ ...m, left: m.first ?? m.every })), desperate: F.desperate ? { ...F.desperate, used: false } : null };
}

/** What the aberrant will do and when, soonest first (the view's countdowns over it; the intent drawn a turn ahead). */
export function foeIntent(s) {
  return (s.foe?.moves || []).filter((m) => awake(s, m)).map((m) => ({ skill: m.skill, label: FOE_SKILLS[m.skill].label, line: FOE_SKILLS[m.skill].line, left: m.left, n: m.n ?? null })).sort((a, b) => a.left - b.left);
}

/** The aberrant's turn: each countdown down one, the due skills fired, the desperate one once its half is small enough. */
export function foeSkillsNow(s, K) {
  const F = s.foe, events = []; if (!F) return events;
  for (const m of F.moves) { if (!awake(s, m) || --m.left > 0 || s.winner !== null) continue; m.left = m.every; events.push(...FOE_SKILLS[m.skill].fire(s, m, K)); }
  const D = F.desperate;
  if (D && !D.used && s.winner === null && s.board.w - s.board.line <= D.at) { D.used = true; events.push({ type: 'foe.desperate', side: 1 }); for (const m of D.moves) events.push(...FOE_SKILLS[m.skill].fire(s, m, K)); }
  for (const m of F.moves) if (awake(s, m) && m.left === 1 && s.winner === null) events.push({ type: 'foe.soon', side: 1, skill: m.skill }); // (fires on its next turn: the last tick, Wanda's and the view's)
  return events;
}

/** A big play staggers the aberrant (PUZZLE-DUELS.md 23.3): every countdown a turn longer. */
export function stagger(s) {
  for (const m of s.foe?.moves || []) if (awake(s, m)) m.left++;
  return [{ type: 'foe.stagger', side: 1 }];
}
