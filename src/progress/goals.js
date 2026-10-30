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
// A goal still open at the turn carries over once, in its slot (Hades' prophecies stay until met); only the done and the twice-carried are drawn again.
// THE FIRST PATH (docs/plans/FIRST-HOUR.md 4): a new STORY save's three goals are instead the first three undone steps of FIRST.path, a
// walk outward from where you wake (the Shrine at your feet, the Spirit Garden through its arch (enter, plant the clay's seed, carve the starter slab), the folk, the atrium rail's view, the pots, the hub's chest through the hole,
// the Index to the Dunes, a slip jelly, the board, the lure, the course), and a step done is replaced by the next at once (Nook Miles+'s
// refill; Breath of the Wild's Great Plateau, where the next shrine is always in view). It ends when the path is walked, or once enough
// achievements off the path are done that you plainly found your own way (FIRST.enough: 40; at 15 counting all, QA-C's hour ended it at
// minute 13 with three steps left). Each step says where it is (FIRST.where, after the achievement's words in the window and the log):
// QA-C stood 14 real minutes with Lookout in view and nothing saying the atrium rail was upstairs. DEBUG never walks it (a sandbox).
//
//   GOALS   pickGoals(rows, { day, avoid }) -> [{ id, slot, first? }]   (rows: [{ id, cat, sub, tier, hidden, frac, goal }])
//   const G = new Goals(game)   G.update(dt)   G.list() -> [{ id, slot, first, name, desc, tier, cur, goal, frac, done }]   /goals
//   events: goals.set { day, ids, first, kept }   goal.done { id, slot, ach, all, first }   goal.next { id, ach, where }   goals.ask { goals }
// ---------------------------------------------------------------------------------------
import { today } from '../core/calendar.js';

export const GOALS = { near: 0.25, elsewhere: 5, stretch: { tier: 3, of: 3 }, look: 1, never: ['general'] }; // (never: categories that are not done by playing tonight: time, sessions, achievements about achievements)
export const SLOTS = ['near', 'elsewhere', 'stretch'];
/** The first path's steps, in the order the map meets them (FIRST-HOUR.md 4), where each is (placeholder words, Espada's), and how many
 *  achievements off the path end it early. */
export const FIRST = {
  path: ['sr1', 'gw1', 'gw2', 'gw3', 'fk1', 'sk12', 'br1', 'tc1', 'pl6', 'jl1', 'sf1', 'an1', 'cx3'],
  where: { // (each {id} said for the device last touched: progress/devicewords.js deviceText, at the log's line; Espada's words, 2026-10-27)
    sr1: 'The Shrine is beside where you wake.', gw1: 'At the Shrine beside where you wake, {use} and choose YOUR SPIRIT GARDEN.',
    gw2: 'Your first seed waits in the shed by the garden\'s gate: take it, carry it up into the open sky and let go.', gw3: 'Your first spirit slab waits at the plate shrine on the Athanor: a lotus flies you there. {use} at the shrine, then carve.',
    fk1: 'Saggar is on the workshop floor.', sk12: 'The nearest is the atrium rail, upstairs in the workshop.',
    br1: 'The pots are all round the workshop: {use} lifts one, {primary} throws it.', tc1: 'A chest stands in the basement\'s hub, down the hole in the workshop floor.',
    pl6: 'The Index in the basement\'s hub sends you there.', jl1: 'Three sit on the sand just past the Weir, in the Dunes.', sf1: 'In the Dunes, {skiff} calls the Solar Skiff.',
    an1: 'At the Weir\'s pier, {box} opens your Pneuka Box: make the Sondelass your main there, then {draw} draws it; choose its rod form.', cx3: 'The course rings the basement\'s hub: eight stations, one lap.',
  },
  enough: 40,
};

/** The first path's next steps (up to three, in its order), or [] once it is walked or outgrown. Pure, for the measure. */
export function firstSteps(rows, { have = [] } = {}) {
  const by = new Map(rows.map((r) => [r.id, r])), done = rows.filter((r) => r.frac >= 1 && !FIRST.path.includes(r.id)).length;
  const left = FIRST.path.filter((id) => by.has(id) && !by.get(id).hidden && by.get(id).frac < 1);
  if (!left.length || done >= FIRST.enough) return [];
  return left.filter((id) => !have.includes(id)).slice(0, SLOTS.length);
}

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
  /** Is this save on the first path? (STORY only: DEBUG is the sandbox.) */
  get onPath() { return this.game.mode === 'story'; }
  rows() {
    const A = this.A; if (!A) return [];
    return A.list.map((a) => ({ id: a.id, cat: a.cat, sub: a.sub, tier: a.tier, hidden: !!a.hidden, frac: A.earned(a.id) ? 1 : A.progress(a)[2], goal: a.dir === 'down' ? Infinity : a.goal }));
  }
  /** A new game day lays three goals (yesterday's categories kept out of ELSEWHERE); a goal done since the last look is said, once. */
  update(dt = 0) {
    if ((this.lookT -= dt) > 0 || !this.A) return; this.lookT = GOALS.look;
    if (this.game.title?.active) return; // (not at the title: the mode, and so the save, is not chosen yet)
    const day = today();
    if (this.s.day !== day) {
      const avoid = this.s.cats || [], rows = this.rows(), path = this.onPath ? firstSteps(rows) : [];
      // a goal left open carries over the turn once, in its slot (QA-A: the game day turned 20 game minutes in and took two open goals)
      const kept = path.length || this.s.day == null ? [] : (this.s.goals || []).filter((g) => !g.path && !g.carried && !this.A.earned(g.id)).map((g) => ({ ...g, carried: true }));
      const fresh = pickGoals(rows, { day, avoid }).filter((p) => !kept.some((k) => k.slot === p.slot || k.id === p.id));
      const picks = path.length ? path.map((id, i) => ({ id, slot: SLOTS[i], first: true, path: true })) : [...kept, ...fresh].sort((x, y) => SLOTS.indexOf(x.slot) - SLOTS.indexOf(y.slot));
      this.s = { day, goals: picks, cats: picks.map((p) => this.A.by[p.id]?.cat).filter(Boolean), said: [] };
      this.game.save?.dirty('goals');
      if (picks.length) this.game.events?.emit('goals.set', { day, ids: picks.map((p) => p.id), first: !!path.length, kept: kept.length, by: 'environment' });
      return;
    }
    for (const g of this.s.goals) {
      if (this.s.said.includes(g.id) || !this.A.earned(g.id)) continue;
      this.s.said.push(g.id); this.game.save?.dirty('goals');
      this.game.events?.emit('goal.done', { id: g.id, slot: g.slot, ach: this.A.by[g.id]?.name, all: this.s.goals.every((x) => this.A.earned(x.id)), first: !!g.path, by: 'courier' });
    }
    // the first path refills: a step done gives its place to the next undone one (said once, after the done line)
    if (!this.s.goals.some((g) => g.path)) return;
    const live = this.s.goals.filter((g) => !this.A.earned(g.id)).map((g) => g.id), done = this.s.goals.filter((g) => g.path && this.A.earned(g.id) && this.s.said.includes(g.id));
    if (!done.length) return;
    const next = this.onPath ? firstSteps(this.rows(), { have: live }) : [];
    for (const g of done) {
      const id = next.shift(); if (!id) continue;
      Object.assign(g, { id, first: true, path: true }); this.game.save?.dirty('goals');
      this.game.events?.emit('goal.next', { id, ach: this.A.by[id]?.name, where: FIRST.where[id] ?? null, by: 'environment' });
    }
  }
  /** The day's goals as a window would show them: the achievement's words and the ledger's numbers. */
  list() {
    const A = this.A; if (!A) return [];
    return this.s.goals.map((g) => { const a = A.by[g.id]; if (!a) return null; const [cur, goal, frac] = A.progress(a);
      return { id: g.id, slot: g.slot, first: !!g.first, name: a.name, desc: g.path && FIRST.where[g.id] ? `${a.desc} ${FIRST.where[g.id]}` : a.desc, tier: a.tier, cur, goal, frac: A.earned(g.id) ? 1 : frac, done: A.earned(g.id) }; }).filter(Boolean);
  }
}
