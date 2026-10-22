// ---------------------------------------------------------------------------------------
// THE GOALS: three things to work toward this game day, laid by the System from the ledger (DESIGN.md 1, the session's gap: "nothing
// yet answers what am I working toward tonight?"). Plain-named until the owner rules. They are pointers, never new tasks: each is one of
// the achievements (achievements.js), so its progress is the ledger's own [cur, goal] and its reward the achievement's; nothing here
// counts or pays by itself (the design laws: achievements are predicates over the ledger; mastery is never paid in cubes).
//
// Prior art: Hades' Fated List of Minor Prophecies (a short list in front of the player, checked off as play happens), Animal Crossing's
// Nook Miles+ (a few fresh tasks a day, one of them a little out of the way), Destiny's pursuits (tracked on screen), and Steam's "nearly
// there" (the achievements closest to done). Three slots, each a reason:
//   NEAR     the achievement closest to done (over a quarter of the way), Hades' easiest prophecy;
//   ELSEWHERE one in a category neither the near one nor yesterday's goals were in, chosen by the game day's draw among the nearest
//            five: breadth, Nook Miles+'s errand across the island;
//   STRETCH  a Hard or harder one (tier 3+), in a third category, the nearest of its kind: the long reach for the session.
// Only what is reachable is offered: an achievement with some progress, or one in a sub-group where something is already done. Hidden
// ones never. A new save, which has begun nothing, is given FIRST STEPS: Easy ones with the smallest asks. Laid once a game day (calendar.js: one real hour), kept in the save; a goal done stays on the list, checked.
//
//   GOALS   pickGoals(rows, { day, avoid }) -> [{ id, slot, first? }]   (rows: [{ id, cat, sub, tier, hidden, frac, goal }])
//   const G = new Goals(game)   G.update(dt)   G.list() -> [{ id, slot, first, name, desc, tier, cur, goal, frac, done }]   /goals
//   events: goals.set { day, ids }   goal.done { id, slot, ach, all }   goals.ask { goals }
// ---------------------------------------------------------------------------------------
import { today } from '../core/calendar.js';

export const GOALS = { near: 0.25, elsewhere: 5, stretch: { tier: 3, of: 3 }, look: 1, never: ['general'] }; // (never: categories that are not done by playing tonight: time, sessions, achievements about achievements)
export const SLOTS = ['near', 'elsewhere', 'stretch'];

/** A seeded draw from the game day (the same day lays the same goals). */
function drawOf(day) {
  let s = (day * 2654435761) >>> 0;
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** The three goals from the achievements' rows (pure, so it can be measured). `avoid`: yesterday's categories, for ELSEWHERE. */
export function pickGoals(rows, { day = 0, avoid = [] } = {}) {
  const draw = drawOf(day);
  rows = rows.filter((r) => !GOALS.never.includes(r.cat));
  const doneSubs = new Set(rows.filter((r) => r.frac >= 1).map((r) => `${r.cat}/${r.sub}`));
  const open = rows.filter((r) => !r.hidden && r.frac < 1 && (r.frac > 0 || doneSubs.has(`${r.cat}/${r.sub}`)));
  const byNear = (a, b) => b.frac - a.frac || a.tier - b.tier || (a.id < b.id ? -1 : 1);
  const out = [], used = new Set();
  const take = (r, slot) => { if (r) { out.push({ id: r.id, slot }); used.add(r.cat); } };
  take(open.filter((r) => r.frac >= GOALS.near).sort(byNear)[0], 'near');
  const away = open.filter((r) => !used.has(r.cat) && !avoid.includes(r.cat) && r.tier < GOALS.stretch.tier).sort(byNear).slice(0, GOALS.elsewhere);
  const away2 = away.length ? away : open.filter((r) => !used.has(r.cat) && r.tier < GOALS.stretch.tier).sort(byNear).slice(0, GOALS.elsewhere);
  take(away2[Math.floor(draw() * away2.length)], 'elsewhere');
  const far = open.filter((r) => !used.has(r.cat) && r.tier >= GOALS.stretch.tier).sort(byNear).slice(0, GOALS.stretch.of);
  take(far[Math.floor(draw() * far.length)], 'stretch');
  // FIRST STEPS: a new save (every build is one) has begun nothing, so the empty slots take Easy ones with the smallest asks, each in
  // its own category (Hades' first prophecies are its easiest)
  const first = rows.filter((r) => !r.hidden && r.frac < 1 && r.tier === 1 && !out.some((o) => o.id === r.id)).sort((a, b) => (a.goal ?? 1) - (b.goal ?? 1) || b.frac - a.frac || (a.id < b.id ? -1 : 1));
  for (const slot of SLOTS) {
    if (out.some((o) => o.slot === slot)) continue;
    const pool = first.filter((r) => !used.has(r.cat)).slice(0, GOALS.elsewhere);
    const r = pool[Math.floor(draw() * pool.length)]; take(r, slot); if (r) out[out.length - 1].first = true;
  }
  return SLOTS.map((slot) => out.find((o) => o.slot === slot)).filter(Boolean);
}

export class Goals {
  constructor(game) {
    this.game = game; this.s = { day: null, goals: [], cats: [], said: [] }; this.lookT = 0;
    game.save?.section('goals', { scope: 'player', version: 1,
      dump: () => this.s,
      load: (d) => { if (d && Array.isArray(d.goals)) this.s = { day: d.day ?? null, goals: d.goals, cats: d.cats || [], said: d.said || [] }; },
      reset: () => { this.s = { day: null, goals: [], cats: [], said: [] }; } });
    game.chat?.add?.('goals', { help: "this game day's three goals, and how near each is: /goals", run: () => this.game.events?.emit('goals.ask', { goals: this.list(), by: 'courier' }) });
  }
  get A() { return this.game.achievements; }
  rows() {
    const A = this.A; if (!A) return [];
    return A.list.map((a) => ({ id: a.id, cat: a.cat, sub: a.sub, tier: a.tier, hidden: !!a.hidden, frac: A.done(a.id) ? 1 : A.progress(a)[2], goal: a.dir === 'down' ? Infinity : a.goal }));
  }
  /** A new game day lays three goals (yesterday's categories kept out of ELSEWHERE); a goal done since the last look is said, once. */
  update(dt = 0) {
    if ((this.lookT -= dt) > 0 || !this.A) return; this.lookT = GOALS.look;
    const day = today();
    if (this.s.day !== day) {
      const avoid = this.s.cats || [], picks = pickGoals(this.rows(), { day, avoid });
      this.s = { day, goals: picks, cats: picks.map((p) => this.A.by[p.id]?.cat).filter(Boolean), said: [] };
      this.game.save?.dirty('goals');
      if (picks.length) this.game.events?.emit('goals.set', { day, ids: picks.map((p) => p.id), by: 'environment' });
      return;
    }
    for (const g of this.s.goals) {
      if (this.s.said.includes(g.id) || !this.A.done(g.id)) continue;
      this.s.said.push(g.id); this.game.save?.dirty('goals');
      this.game.events?.emit('goal.done', { id: g.id, slot: g.slot, ach: this.A.by[g.id]?.name, all: this.s.goals.every((x) => this.A.done(x.id)), by: 'courier' });
    }
  }
  /** The day's goals as a window would show them: the achievement's words and the ledger's numbers. */
  list() {
    const A = this.A; if (!A) return [];
    return this.s.goals.map((g) => { const a = A.by[g.id]; if (!a) return null; const [cur, goal, frac] = A.progress(a);
      return { id: g.id, slot: g.slot, first: !!g.first, name: a.name, desc: a.desc, tier: a.tier, cur, goal, frac: A.done(g.id) ? 1 : frac, done: A.done(g.id) }; }).filter(Boolean);
  }
}
