// ---------------------------------------------------------------------------------------
// THE RECAP: "this is what you were doing", said when you come back and on /recap (docs/plans/QUESTS.md 3). Read only from the ledger,
// which already keeps the play time of every first (`L.firsts`), every achievement earned (`L.done`) and when each session began
// (`L.began`, `L.lastBegan`): nothing new is counted for it. Three parts, in this order:
//   LAST TIME    what you did in your last session: the quest steps you got done (each step's `did` line) and the achievements you
//                earned, newest first, a handful at most;
//   IN PROGRESS  every started quest and its next step (never the step after: no spoilers);
//   TODAY        the game day's goals still open.
// The quest lines are Espada's (2026-10-31); the achievement line is still a placeholder.
//
// Prior art: Xenoblade Chronicles' "The Story So Far" and Trails' recap on load (what happened last, in a few lines, before you play);
// Kingdom Hearts' journal; Dragon Quest's priest who tells you where you were headed; RuneScape's quest journal (the next step only).
//
//   recapOf(L, { quests, achievements, goals, most }) -> { last: [line], open: [line], today: [line], minutes }   (minutes: last session's)
//   const R = new Recap(game)   R.update(dt)   /recap
//   events: recap.show { last, open, today, minutes, auto }
// ---------------------------------------------------------------------------------------
import { QUESTS, questState } from './quests.js';

export const RECAP = { most: 5, auto: true, wait: 4 }; // (most: lines of LAST TIME; wait: real seconds after the title before the auto recap)

/** What there is to say. `achievements`: game.achievements (its `by` and `L.done`), `goals`: game.goals.list(). */
export function recapOf(L, { game = null, achievements = null, goals = [], most = RECAP.most } = {}) {
  const from = L.lastBegan, to = L.began, inLast = (t) => from != null && Number.isFinite(t) && t >= from && t <= to;
  const happened = [];
  const states = QUESTS.map((q) => [q, questState(q, L, game)]);
  for (const [q, s] of states) s.steps.forEach((st, i) => { if (st.done && st.did && inLast(st.at)) happened.push({ t: st.at, line: `${q.name}: ${st.did}` }); });
  for (const [id, t] of Object.entries(L.done || {})) {
    if (!inLast(t)) continue; const a = achievements?.by?.[id]; if (!a || a.hidden) continue;
    happened.push({ t, line: `You earned ${a.name} (${a.desc.replace(/\.$/, '')}).` });
  }
  happened.sort((a, b) => b.t - a.t);
  const open = states.filter(([, s]) => s.state === 'started').map(([q, s]) => `${q.name} (for ${q.who}). Next: ${s.steps[s.step].say}`);
  const today = (goals || []).filter((g) => !g.done).map((g) => `${g.name}: ${String(g.desc).replace(/\.$/, '')}.`);
  return { last: happened.slice(0, most).map((h) => h.line), open, today, minutes: from == null ? null : Math.round((to - from) / 60) };
}

export class Recap {
  constructor(game) {
    this.game = game; this.waitT = RECAP.wait; this.said = false;
    game.chat?.add?.('recap', { help: 'what you did last time, the quests you have going and what is left today: /recap', run: () => this.show(false) });
  }
  show(auto) {
    const g = this.game, L = g.ledger; if (!L) return;
    const r = recapOf(L, { game: g, achievements: g.achievements, goals: g.goals?.list?.() || [] });
    if (auto && !r.last.length && !r.open.length) return; // (nothing to come back to: a new save, or a session with nothing done)
    g.events?.emit('recap.show', { ...r, auto, by: 'environment' });
  }
  /** Once a session, a few real seconds into the world, if there was a session before this one. */
  update(dt = 0) {
    if (this.said || !RECAP.auto || this.game.title?.active || this.game.ledger?.lastBegan == null) return;
    if ((this.waitT -= dt) > 0) return;
    this.said = true; this.show(true);
  }
}
