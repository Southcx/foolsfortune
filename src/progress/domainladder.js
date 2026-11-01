// ---------------------------------------------------------------------------------------
// A DOMAIN'S LADDER: a milestone every ten levels (South, 2026-11-01: "every 10 levels should be a milestone within the Domain
// progression"; DOMAINS.md 18). Each domain's 1 to 99 read as one track, a thing at every ten, so the next one is never far off:
//   10  a rung       the first relation (DOMAIN_ARTS, wave 1)
//   20  a power      the god hand's (GOD_POWERS: the ones that opened at 15)
//   30  a rung       the second relation (waves 2 to 4)
//   40  a power      (the ones that opened at 35), or a trait where the domain has none
//   50  a power      (the ones that opened at 60), or a trait
//   60  a rung       depth (all seven built: DOMAIN_ARTS), and the pairings open at 60 in both
//   70  a trait      one of the domain's rungs made stronger
//   80  the epic     the domain's epic miracle (EPICS)
//   90  a rung       the last relation (planned)
//   99  the summit   the rule-break and the title (planned)
// The level-1 powers stand at the ladder's foot, open from the start.
// A TRAIT is a modifier on a rung you already have, opened by the level (FFXIV's job traits: "Enhanced Unmend" at a level, never a new
// button). The rung's own numbers are never changed (CLAUDE.md, base change bad): `doesOf` lays the trait's numbers over the row's
// `does` while it is open, and the runtime asks there (courier/domainarts/run.js `does`). Its two ways (DESIGN.md 22): the level, or
// the rung's own feat done as many times over as the trait's tens (5 at 50, 7 at 70: skill skips grind).
// Prior art: Old School RuneScape's skill guides (every level that opens something, listed by the skill), FFXIV's job levels (an action
// or a trait every few levels), World of Warcraft's talent rows every ten levels (before 2012), Monster Hunter's HR gates.
//
//   LADDER[domain] = [{ domain, at, kind: 'start'|'rung'|'power'|'trait'|'epic'|'summit', id, label, line, built }]
//   TRAITS[id] = { domain, at, of, label, line, set }   traitOpen(id, L, lv) -> bool   featTimes(id)   doesOf(id, L) -> the rung's numbers with its traits
//   ladderOf(domain) -> its rows   nextMilestone(domain, level, { built }) -> the next ten above the level and its rows (built: only what is in the game)   milestoneAt(domain, level) -> its row
// ---------------------------------------------------------------------------------------
import { DOMAINS, levelOf } from './domains.js';
import { DOMAIN_ARTS } from './domainarts.js';
import { GOD_POWERS, EPICS } from './godpowers.js';

/** The tens, and what each kind is. */
export const TENS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 99];
/** Each domain's one question (DOMAINS.md 1: every interaction asks it). */
export const QUESTIONS = { ouranurgy: 'When, and where?', manifestation: 'In what form?', divination: 'What is known?', psychokinesis: 'With how much force?', possession: 'Whose?', alteration: 'Of which kind?', spellscription: 'Under which rule?' };
export const KIND_WORDS = { start: 'From the start', rung: 'Rung', power: 'Power', trait: 'Trait', epic: 'Epic miracle', summit: 'Summit' };

/** The traits: each a rung of the domain's made stronger (its numbers laid over the row's `does`). The numbers are drafts; each says
 *  why it is the size it is. */
export const TRAITS = {
  // ALTERATION has five powers at 1 and none at 40 or 50: its middle is traits
  retypeLong: { domain: 'alteration', at: 40, of: 'retype', label: 'Enhanced Re-type', line: 'Re-type lasts 30 seconds now, up from 20.', set: { dur: 30 } }, // (a Dunes fight with two or three Figments runs about half a real minute: a guess, to be read off the ledger's fight times)
  reactionsWide: { domain: 'alteration', at: 50, of: 'reactions', label: 'Enhanced Reactions', line: 'Your reactions reach 2.5 m now, up from 1.5.', set: { radius: 2.5 } }, // (a body's width further: a creature standing beside the stamp is in it)
  // PSYCHOKINESIS has no power at 50
  catchLong: { domain: 'psychokinesis', at: 50, of: 'catch', label: 'Enhanced Catch', line: 'You can hold a caught shot for 2.5 seconds now, up from 1.5. Long enough to pick a new target.', set: { hold: 2.5 } }, // (time to turn round and aim it at a second foe, not only the one that threw it)
  // SPELLSCRIPTION has no power at 50
  ruleCheap: { domain: 'spellscription', at: 50, of: 'standingRule', label: 'Enhanced Standing Rule', line: 'Your standing rule fires for 2 pool now, down from 5.', set: { cost: 2 } }, // (two is a shot's cost at half: the rule nearly pays for itself)
  // THE SEVENTIES: one a domain
  postponeDeep: { domain: 'ouranurgy', at: 70, of: 'postpone', label: 'Enhanced Postpone', line: 'Parry a held blow and only a quarter of it lands, down from half.', set: { parried: 0.25 } }, // (the late parry made worth the wait)
  platingWhole: { domain: 'manifestation', at: 70, of: 'plating', label: 'Enhanced Plating', line: "Plating soaks up its part's whole next crack. It still won't stop one that would shatter you.", set: { takes: 1 } }, // (solid at last whole; the shatter line kept, so it never makes you unbreakable)
  watchFar: { domain: 'divination', at: 70, of: 'watch', label: 'Enhanced Watch', line: "You can read a Figment's watch from 50 m now, up from 30.", set: { reach: 50 } }, // (a Dunes area's open sand read from its edge)
  catchHard: { domain: 'psychokinesis', at: 70, of: 'catch', label: 'Hard Return', line: 'A caught shot you throw back hits twice as hard, up from half again.', set: { mult: 2 } }, // (the parry's send-back is 1: the catch doubles it)
  linkDeep: { domain: 'possession', at: 70, of: 'link', label: 'Enhanced Link', line: 'The bound creature takes two thirds of a crack meant for you, up from half.', set: { share: 2 / 3 } }, // (it carries more than you do)
  reactionsCalm: { domain: 'alteration', at: 70, of: 'reactions', label: 'Lasting Reactions', line: "A cancel calms whatever's in it for 5 seconds, up from 3.", set: { calm: 5 } }, // (long enough to reprogram or walk past it)
  vowDeep: { domain: 'spellscription', at: 70, of: 'vow', label: 'Enhanced Vow', line: 'A kept vow takes a third off every cost, up from a quarter.', set: { costMult: 2 / 3 } }, // (its stake is the same crack: the price of keeping it rises with its worth)
};

/** The rungs still to come (DOMAINS.md 14's later columns, kept by name so the ladder shows the whole climb). */
const PLANNED = {
  ouranurgy: { 90: ['Stasis', 'A bubble where time runs at a fifth.'], 99: ['The Rewind', 'The area put back as it was 6 seconds ago. You keep only what you know.'] },
  manifestation: { 90: ['Made of a Feeling', 'A made thing of a feeling: a wall of Grief\'s rain, a ward of Fury\'s sparks.'], 99: ['A Second Vessel', 'A clay double made from your pool, with its own cracks.'] },
  divination: { 90: ['Call It', 'Commit to a read of a creature\'s next move. Right, and your read is exact a while.'], 99: ['See the Next Roll', 'Your own dice\'s next throw shown before you commit, once a game hour.'] },
  psychokinesis: { 90: ['Heft', 'A carried mass held off your pool\'s top, thrown as hard as it weighs.'], 99: ['Banked Motion', 'Your speed stored as you move and let go as one blow.'] },
  possession: { 90: ['Ride', 'Leave your vessel standing and drive a creature\'s body.'], 99: ['No Border', 'A bound spirit\'s pool and yours are one.'] },
  alteration: { 90: ['The Exchange', 'Pool into mending, or a crack into pool, at a loss.'], 99: ['Re-make a Body', 'A creature\'s make-up changed a while.'] },
  spellscription: { 90: ['Rewrite a Tag', 'Add a tag to a thing, or take one off.'], 99: ['A Place\'s Law', 'An inscription that changes one rule inside its circle.'] },
};

const ten = (at) => (at <= 1 ? 1 : at >= 99 ? 99 : Math.ceil(at / 10) * 10);

function build(domain) {
  const rows = [];
  for (const [id, P] of Object.entries(GOD_POWERS)) if (P.domain === domain) rows.push({ at: P.at ?? 80, kind: (P.at ?? 80) <= 1 ? 'start' : 'power', id, label: P.label, line: P.does, built: P.built !== false });
  for (const [id, A] of Object.entries(DOMAIN_ARTS)) if (A.domain === domain) rows.push({ at: A.level, kind: 'rung', id, label: A.label, line: A.line, built: true, art: A.kind });
  for (const [id, T] of Object.entries(TRAITS)) if (T.domain === domain) rows.push({ at: T.at, kind: 'trait', id, label: T.label, line: T.line, built: true, of: T.of });
  for (const [id, E] of Object.entries(EPICS)) if (E.domain === domain) rows.push({ at: E.at ?? 80, kind: 'epic', id, label: E.label, line: `The epic miracle of the ${E.sign} sign, drawn with Shift.`, built: true });
  for (const [at, [label, line]] of Object.entries(PLANNED[domain] || {})) rows.push({ at: +at, kind: +at === 99 ? 'summit' : 'rung', id: `planned.${domain}.${at}`, label, line, built: false });
  return rows.map((r) => ({ ...r, domain })).sort((a, b) => a.at - b.at || (a.kind === 'start' ? -1 : 0));
}
export const LADDER = Object.fromEntries(Object.keys(DOMAINS).map((d) => [d, build(d)]));
export const ladderOf = (domain) => LADDER[domain] || [];
/** The rows at a ten (several where a power and a rung share one). */
export const milestoneAt = (domain, level) => ladderOf(domain).filter((r) => ten(r.at) === level && r.at > 1);
/** The next ten above a level that holds a row, and its rows. */
export function nextMilestone(domain, level, { built = false } = {}) {
  for (const t of TENS) if (t > level) { const rows = milestoneAt(domain, t).filter((r) => !built || r.built); if (rows.length) return { at: t, rows }; }
  return null;
}

const got = (L, key) => L?.get?.(key) || 0;
/** How many times over a trait's feat is its rung's: its level's tens (5 at 50, 7 at 70), so a later trait asks more. */
export const featTimes = (id) => Math.round((TRAITS[id]?.at ?? 30) / 10);
/** A trait open: its domain at its level (the Summit lend reads 99), or its rung's feat done featTimes over. */
export function traitOpen(id, L, lv) {
  const T = TRAITS[id]; if (!T) return false;
  const level = lv ? lv(T.domain) : levelOf(got(L, `exp.${T.domain}`));
  if (level >= T.at) return true;
  const [feat, n] = DOMAIN_ARTS[T.of]?.feat || []; return !!feat && got(L, `domain.feat.${feat}`) >= n * featTimes(id);
}
/** A rung's numbers with every open trait of it laid over (a modifier with its source, never the row changed). */
export function doesOf(id, L, lv) {
  const A = DOMAIN_ARTS[id]; if (!A) return null;
  let out = A.does;
  for (const [tid, T] of Object.entries(TRAITS)) if (T.of === id && traitOpen(tid, L, lv)) out = { ...out, ...T.set };
  return out;
}
/** The traits of a rung, open or not (the Codex's card lists them under it). */
export const traitsOf = (id) => Object.keys(TRAITS).filter((t) => TRAITS[t].of === id);
