// ---------------------------------------------------------------------------------------
// QUESTS: someone in the world has a problem, and you fix it in a few steps (docs/plans/QUESTS.md). A quest is data: who it is for,
// what is wrong with them, where it begins, and its steps, each a predicate over the ledger (CLAUDE.md: never a flag set by a hook).
// Its state is read, never stored: NOT STARTED, STARTED (a step done), DONE (every step done). What is written is only when: the play
// time a step and the quest were first seen done (`L.first('quest.<id>.<n>')`, `L.first('quest.<id>')`), which the recap reads.
// Names and words are placeholders, Espada's to word in the System's voice (QUESTS.md 4).
//
// Prior art:
//  - RuneScape's quest journal: every quest listed red (not started, with where to begin), yellow (started), green (done); a started
//    quest's steps written as a diary, the done ones struck through, only the next one said; quest points for each done.
//  - Tomba!'s events: a quest found by meeting its trouble in the world, a jingle and an "Event!" splash at its start and its end, the
//    list of events open and cleared kept in one menu.
//  - Psychonauts: each quest is someone's head put right; its trouble is said plainly up front (their baggage), never a riddle.
// The System is the veteran who wants you to have fun: it says where a quest begins and what the next step is, and never what comes
// after it (no spoilers past the next step).
//
//   QUESTS   questState(q, L, game) -> { id, state, step, steps: [{ say, done }], at }   questsOf(L, game)   questPoints(L, game)
//   const Q = new Quests(game)   Q.update(dt)   Q.list()   /quests
//   events: quest.start { id, quest }   quest.step { id, quest, n, say, next }   quest.done { id, quest, points }   quests.ask { quests }
// ---------------------------------------------------------------------------------------
import { STAGES } from './strawmanwell.js';

const WAVE1 = STAGES.filter((s) => s.wave === 1);
const cleared = (L) => WAVE1.filter((s) => L.get(`well.stage.clear.${s.id}`) >= 1).length;

export const QUESTS = [
  {
    id: 'understudy', name: 'The Understudy', who: 'Strawman', points: 1,
    trouble: 'Strawman has been everyone\'s practice dummy for so long that the shows inside its head never get past rehearsal.',
    begin: 'Strawman stands in the Throwing Room off the Workshop. The way into its head is on the Index: STRAWMAN\'S WELL.',
    steps: [
      { say: 'Get inside Strawman\'s head.', did: 'You got inside Strawman\'s head.', done: (L) => STAGES.some((s) => L.get(`well.stage.enter.${s.id}`) >= 1) },
      { say: 'Clear one stage. Any of them.', did: 'You cleared your first stage in there.', done: (L) => L.get('well.stage.clear') >= 1 },
      { say: 'Knock a dummy past the blast line in The Brawl.', did: 'You knocked a dummy clean off the stage.', done: (L) => L.get('well.dummy.ko') >= 1 },
      { say: `Clear all ${WAVE1.length} stages that are open.`, did: 'You cleared every stage that is open.', done: (L) => cleared(L) >= WAVE1.length },
      { say: 'Take a bow: rank A or better on three stages.', did: 'You took your bow. Strawman\'s shows are running again.', done: (L) => WAVE1.filter((s) => (L.best(`well.stage.stars.${s.id}`) || 0) >= 2).length >= 3 },
    ],
  },
];
export const questOf = (id) => QUESTS.find((q) => q.id === id) || null;

/** One quest read from the ledger. `step` is the index of the next undone step (steps.length when done); steps are taken in order, so a
 *  later step done early waits until the ones before it are (RuneScape's diary never skips ahead). */
export function questState(q, L, game) {
  const raw = q.steps.map((s) => !!s.done(L, game));
  let step = 0; while (step < raw.length && raw[step]) step++;
  const state = step >= raw.length ? 'done' : step > 0 ? 'started' : 'none';
  return { id: q.id, state, step, steps: q.steps.map((s, i) => ({ say: s.say, did: s.did, done: i < step, at: L.firsts?.[`quest.${q.id}.${i}`] ?? null })), at: L.firsts?.[`quest.${q.id}`] ?? null };
}
export const questsOf = (L, game) => QUESTS.map((q) => questState(q, L, game));
export const questPoints = (L, game) => QUESTS.reduce((n, q) => n + (questState(q, L, game).state === 'done' ? q.points : 0), 0);

export class Quests {
  constructor(game) {
    this.game = game; this.t = 0; this.seen = -1; this.silent = true;
    game.chat?.add?.('quests', { help: 'the quest journal: what is open, the next step of each, and where the others begin: /quests', run: () => game.events?.emit('quests.ask', { quests: this.list(), points: this.points, by: 'courier' }) });
  }
  get L() { return this.game.ledger; }
  get points() { return this.L ? questPoints(this.L, this.game) : 0; }
  /** The journal as a window would draw it: done last, then started, then not started (RuneScape's colours by state). */
  list() {
    if (!this.L) return [];
    const order = { started: 0, none: 1, done: 2 };
    return questsOf(this.L, this.game).map((s) => { const q = questOf(s.id); return { ...s, name: q.name, who: q.who, trouble: q.trouble, begin: q.begin, points: q.points, next: s.steps[s.step]?.say ?? null }; })
      .sort((a, b) => order[a.state] - order[b.state]);
  }
  /** A step seen done is written once with its play time and said once; on load whatever was already done is written silently. */
  update(dt = 0) {
    const L = this.L; if (!L || (this.t -= dt) > 0) return; this.t = 0.6;
    if (this.game.title?.active || L.version === this.seen) return; this.seen = L.version;
    for (const q of QUESTS) {
      const s = questState(q, L, this.game);
      for (let n = 0; n < s.step; n++) {
        if (!L.first(`quest.${q.id}.${n}`) || this.silent) continue;
        if (n === 0) this.game.events?.emit('quest.start', { id: q.id, quest: q.name, by: 'courier' });
        this.game.events?.emit('quest.step', { id: q.id, quest: q.name, n, say: q.steps[n].say, next: q.steps[n + 1]?.say ?? null, by: 'courier' });
      }
      if (s.state === 'done' && L.first(`quest.${q.id}`) && !this.silent) this.game.events?.emit('quest.done', { id: q.id, quest: q.name, points: q.points, by: 'courier' });
    }
    this.silent = false;
  }
}
