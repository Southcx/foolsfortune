// ---------------------------------------------------------------------------------------
// A DOMAIN'S RUNGS (docs/plans/DOMAINS.md 11 to 15; South, 2026-11-01: "Continue to think hard about the full progression/ ability
// unlocks/ training methodologies of each of the domains ... get to building what the abilities would look like ingame"). Above its
// widening, each domain's ladder is a set of arts, one a rung (30, 45, 60, 80, 99: shu-ha-ri, DOMAINS.md 11), and an art opens only by
// achievement (DESIGN.md 22), by either of two ways:
//   the count way  the domain's level reaches the rung's (`exp.<domain>` in the ledger: retroactive, as every achievement)
//   the feat way   the rung's own idea done the hard way before you have it, n times (`domain.feat.<key>`; FEATS below)
// A passive or a reaction is on while it holds one of the psyche's notches (notchesFor: a budget you can see, each switchable). An action is
// worn on the art key, in the one action slot the class arts use (progress/classarts.js: a class's action or a domain's).
// The first KATA uses of each open rung pay the domain a masterful act (`domain.art.use { kata: true }`: Hades' first-time bonuses, the
// teacher showing once), every later use its own quality (domains.js SOURCES). Every number here is a first number, each with its reason;
// the runtime is courier/domainarts/ (game.domainArtsRun).
//
// Wave 1 is each domain's first relation, at level 10 (DOMAINS.md 16 moved it from 30 to 15; 18, South's milestone every ten, to 10). The next rungs are written in
// DOMAINS.md 16's table and come as their own rows here. A passive or reaction takes a notch (notchesFor): Hollow Knight's budget.
//
// Prior art: shu-ha-ri (Aikido's and the Urasenke tea school's ladder of keep, break, leave); Old School RuneScape's skills and its
// quest-or-level gates (Monster Hunter's too); FFXIV's job quest at each rung; Final Fantasy Tactics' action slot; Hollow Knight's charm
// notches (one slot, a choice you can see); FFXIV's Doom (Postpone), Hollow Knight's Baldur Shell (Plating), Metal Gear Solid's
// vision cones and Hitman's instinct (the watch), Sekiro's deathblow and Smash's KO power (Shatter), Shin Megami Tensei's negotiation moods (Receptivity), Pokemon's Soak (Re-type), Final
// Fantasy XII's Gambits (a standing rule).
//
//   DOMAIN_ARTS[id] = { domain, level, kind: 'passive'|'reaction'|'action', label, line, how, does, cost?, cooldown?, feat: [key, n] }
//   FEATS[key] = { event, test(e, s) }   FEAT_WORDS[key]   RULE_WHEN, RULE_THEN (a standing rule's choices)   KATA   WEAR   notchesFor(total)
//   domainArtOpen(id, L, game?) -> bool   openDomainArts(L, game?) -> [id]   artsOfDomain(domain) -> [id]   isDomainArt(id)
//   shatterOf(level) -> 0..1   game.domainArts = new DomainArts(game)   .open(id) .on(id) .worn() .notches() .toggle(id) .progress(id) .used(id, q)
//   .rule { when, then } .setRule(when, then)   .vow .swear(id)   VOWS, VOW   commands /rung, /rule, /vow
//   events: domain.art.learn { art, domain, kind, by }, domain.art.use { art, domain, q, kata, by }, domain.art.wear { art, on, by },
//   domain.art.ask, domain.rule.set { when, then, by }, domain.rule.ask, domain.rule.refuse
// ---------------------------------------------------------------------------------------
import { levelOf } from './domains.js';

/** The first uses of an open rung that pay its domain a masterful act (the teacher shows once; five, a kata's repetitions). */
export const KATA = 5;
/** Ours: a rung's uses pay their domain fully up to WEAR uses a game hour, a quarter after (the critic's farm: a Postpone loop on
 *  clapperjars, a plate cycled on a jelly; OSRS's diminishing returns are in its XP-rate tables, ours in the use). */
export const WEAR = 20;
/** Ours: how soon after a blink, or after a glyph or macro, a down counts as the domain's (a blink into the killing blow; a written thing
 *  that set it up: a stun's few seconds). */
export const DOWN_AFTER = { blink: 2, write: 4 };
/** THE PSYCHE'S NOTCHES (Hollow Knight's): how many always-on rungs (passives and reactions) you may wear at once: two, and one more for
 *  each hundred of the seven domains' levels summed, seven at most. A rung worn is always on; one set aside is off, exactly as without
 *  it (a modifier switched off restores the base: DESIGN.md 22). Actions take no notch: they share the art key's one slot. */
export const notchesFor = (totalLevel = 7) => Math.min(7, 2 + Math.floor(totalLevel / 100));

/** What a rung's feat counts: the event, and when it counts. `s` is the counter's own state (a run that a test may keep). Every feat is
 *  against a real foe (`training` and `practice` payloads never count: the Sandbox's pen, Strawman, a practice duel). */
export const FEATS = {
  // a parry in the last third of a blow's 0.25 real s window (move.parry's `lead`, the time still to go: 0.083 or less, five frames at
  // 60: the touch's own latency allowed for), from a real foe
  lateParry: { event: 'move.parry', test: (e) => e.what === 'blow' && e.lead != null && e.lead <= 0.083 },
  // six blows in a row on the shield with no break and no crack between (the pool held as armour by hand: Plating's idea without it)
  shieldRun: { event: 'vessel.shield', test: (e, s) => { s.run = (s.run || 0) + 1; if (s.run >= 6) { s.run = 0; return true; } return false; },
    reset: ['vessel.shieldbreak', 'vessel.crack'], anyBy: true },
  // a candid photograph (STEALTH.md 6): a Figment that never knew you were there (the watch read before it was needed)
  candid: { event: 'photo.take', test: (e) => e.candid === 'candid' && !!e.kind && e.kind !== 'nothing' },
  heavyThrow: { event: 'impact.hit', test: (e) => (e.energy || 0) >= 300 },
  // a fish let go after a fight of 20 real s or more: its state read through the line, and its freedom given at its weakest
  longRelease: { event: 'angle.release', test: (e) => (e.secs || 0) >= 20 },
  weakDown: { event: 'creature.struck', test: (e) => e.kill && (e.k || 1) > 1 },
  cleanMacro: { event: 'reprogram.run', test: (e) => !e.refused && (e.misses || 0) === 0 && (e.chars || 0) >= 8 },
  // three blinks inside two real s (where you were, and where you will be, juggled: Recall's idea without it)
  blinkChain: { event: 'move.blink', test: (e, s) => { const now = performance.now() / 1000; s.at = [...(s.at || []), now].filter((x) => x > now - 2); if (s.at.length >= 3) { s.at = []; return true; } return false; } },
  // a fight ended with no crack taken in it (a vow kept by hand: A Vow's idea without it)
  cleanFight: { event: 'combat.end', test: (e, s) => { const ok = !s.cracked && s.fought; s.cracked = false; s.fought = false; return ok; }, mark: ['vessel.crack'], start: ['combat.start'], anyBy: true },
  // a windup read with no crack taken since the last (the blow seen coming: a body's make-up is what made it)
  sculpt: { event: 'god.sculpt', test: (e) => (e.volume || 0) >= 6 },
  // a shot sent back by a parry that struck the one who threw it (courier/domainarts/run.js says it: the catch's idea without it)
  parryReturn: { event: 'parry.return', test: () => true },
  // a reprogrammed mind's macro worn to its end (a hold on a mind kept as long as it lasts: the link's idea without it)
  macroWorn: { event: 'reprogram.wear', test: () => true, anyBy: true },
  // a feeling awakened (to mix the feelings you must know them: reactions' idea, the house's opposites cancel, seen four times over)
  awakened: { event: 'feeling.wake', test: () => true },
  // THE DEPTH FEATS (level 60): each rung's idea done by hand before it is yours
  // two different afflictions landed on one kind of creature within a real s (the Fuse's set-off, timed by your own two hands)
  twoAtOnce: { event: 'creature.status', test: (e, s) => { if (e.fused || e.cycled || e.status === 'stun' || e.status === 'calm') return false; const now = performance.now() / 1000, L = s.last; s.last = { kind: e.kind, status: e.status, at: now }; return !!L && L.kind === e.kind && L.status !== e.status && now - L.at <= 1; } },
  // a hold of the mop that drank 40 Lachryma or more (a quarter of a middling Bottle: the world's Lachryma caught on purpose)
  bigMop: { event: 'brush.mop', test: (e) => (e.lachryma || 0) >= 40 },
  // one throw that struck two creatures (a strike: the force passed on by aim alone)
  twoStrike: { event: 'impact.strike', test: (e) => (e.n || 0) >= 2 },
  // an annihilation (Impact on a body carrying Delirium's status, or the reverse: the cycle known end to end)
  annihilate: { event: 'combat.annihilate', test: () => true },
  // a mind rewritten (reprogrammed, not refused): another mind made yours a while, Borrow a Verb's idea without it
  mindRewritten: { event: 'reprogram.run', test: (e) => !e.refused },
  // a Tithe pull of rare or better (the odds lived through until they paid: True Odds' idea without it)
  titheRare: { event: 'tithe.pull', test: (e) => (e.tier ?? 0) >= 2 },
  // a seal set in a cradle (your seal set on a thing, so that it runs as you)
  sealSet: { event: 'seal.set', test: () => true },
  cleanRead: { event: 'windup.read', test: (e, s) => { const ok = !s.cracked; s.cracked = false; return ok; }, mark: ['vessel.crack'] },
};
export const FEAT_WORDS = {
  lateParry: 'blows parried at the last moment', shieldRun: 'runs of six blows on your shield unbroken', candid: 'candid photographs',
  heavyThrow: 'thrown hits over 300 joules', longRelease: 'fish let go after a long fight', weakDown: 'creatures downed by their weakness',
  cleanMacro: 'macros typed clean', blinkChain: 'three blinks inside two seconds', sculpt: 'creations raised', cleanFight: 'fights ended without a crack', cleanRead: 'windups read without a crack', twoAtOnce: 'two afflictions on one creature inside a second', bigMop: 'mops of 40 Lachryma or more', twoStrike: 'throws that struck two creatures', annihilate: 'annihilations', mindRewritten: 'minds rewritten', titheRare: 'Tithe pulls of rare or better', sealSet: 'seals set in cradles', parryReturn: 'shots parried back into their thrower', macroWorn: 'macros worn to their end', awakened: 'feelings awakened',
};

/** A standing rule's triggers and verbs (South, 2026-11-01: case by case; DOMAINS.md 14, 16). Every trigger is an act of your own (the
 *  critic: a rule on what is done to you answers a check of survival for you, an assist), and every verb sets up a play (your sub's
 *  verb, the belt swapped), none parries, dodges or aims. Each firing costs COST pool, at most once in `every` real s. */
export const RULE_WHEN = {
  parry: { label: 'you parry', event: 'move.parry', test: (e) => (e.by ?? 'courier') === 'courier' },
  stun: { label: 'you stun a creature', event: 'creature.stun', test: (e) => (e.by ?? 'courier') === 'courier' },
  down: { label: 'you down a creature', event: 'creature.struck', test: (e) => e.kill && (e.by ?? 'courier') === 'courier' && !e.training },
  blink: { label: 'you blink', event: 'move.blink', test: (e) => (e.by ?? 'courier') === 'courier' },
};
export const RULE_THEN = {
  lend: { label: 'your sub lends its verb' },
  swap: { label: 'your main and sub change places' },
};

/** A vow's restrictions (Spellscription 30; Hunter x Hunter's vows, a real oath's binding): what you swear off, and how it is seen to be
 *  broken (an event of yours, or a state read each frame). Kept, every cost is x VOW.costMult; broken, the stake is a crack (a release's
 *  unit through the stones) and no vow for VOW.again real s. */
export const VOWS = {
  noBlink: { label: 'never blink', event: 'move.blink' },
  noJump: { label: 'never leave the ground by a jump', event: 'move.jump' },
  noLend: { label: 'never lend your sub', event: 'tool.lend' },
  noSprint: { label: 'never sprint', state: (g) => !!g.player?.sprinting },
};
export const VOW = { costMult: 0.75, again: 30, keptEvery: 60 };

const R = (domain, level, kind, label, line, how, does, feat, more = {}) => ({ domain, level, kind, label, line, how, does, feat, ...more });

/** The first relations (wave 1: each domain's at level 10, DOMAINS.md 16 and 18: the critic's pacing, then South's milestone every ten). `line` the effect in one line (CLARITY.md), `how` the lesson's line (said once, when it opens). */
export const DOMAIN_ARTS = {
  // OURANURGY (when, and where?): a blow's arrival moved in time
  postpone: R('ouranurgy', 10, 'reaction', 'Postpone', 'A blow that gets past your shield cracks you 4 seconds late.',
    'Parry another blow before it lands and it lands at half. It lands on the clay, wherever you are by then.', { delay: 4, parried: 0.5 }, ['lateParry', 10]), // (4 s: FFXIV's Doom; WoW's Stagger, known hard to read: so one held at a time, shown, and a notch you can take off)
  // MANIFESTATION (in what form?): the pool's liquid set solid
  plating: R('manifestation', 10, 'action', 'Plating', 'Set 20 of your pool solid over the part of you facing the nearest foe: it takes most of that part\'s next crack.',
    'It holds 20 off your pool\'s top while it stands. Unspent after 30 seconds, it melts back at 15. It cannot stop a crack that would shatter you.', { held: 20, back: 15, dur: 30, takes: 0.85 }, ['shieldRun', 10], { cooldown: 8 }), // (solid takes 0.85 of a full blow, the shield's 20 pool 0.57: harder, not whole; the cooldown from its end)
  // DIVINATION (what is known?): when a mind will look (the critic: the crack mark would mostly read "torso"; the watch is a new kind)
  watch: R('divination', 10, 'passive', 'The Watch', 'A Figment\'s watch shows: while its head is down, how long until it looks up.',
    'Its bouts are its own and they never lie: move while it is down (STEALTH.md).', { reach: 30 }, ['candid', 10]),
  // PSYCHOKINESIS (with how much force?): a blow that breaks (SUBSTRATE.md F5b as written: an execute, never a number)
  shatter: R('psychokinesis', 10, 'passive', 'Shatter', 'A Figment whose shell is near breaking glows; a heavy blow on it then breaks it at once.',
    'Near: its stun past (1 - shatter) of full. Heavy: a blow of power 2 or more (a charge, a finisher, a heavy throw).', { minPower: 2 }, ['heavyThrow', 25]),
  // POSSESSION (whose?): another mind's openness (the critic: open is the Agitation band alone, and its gift is a verb)
  receptivity: R('possession', 10, 'passive', 'Receptivity', 'A mind whose agitation is in its best band shows open, and you may reprogram it without stunning it first.',
    'Open is the band where its Lachryma yields most: agitate it, then catch it there.', {}, ['longRelease', 10]),
  // ALTERATION (of which kind?): a blow's kind exchanged (the critic: knowing the weakness is the skill; the art turns what you know)
  retype: R('alteration', 10, 'action', 'Re-type', 'For 20 seconds the tool in your hands strikes as another type: the nearest creature\'s weakness if you know its kind, else the next type in turn.',
    'Know a kind (photograph it, or down it five times) and Re-type finds its weakness for you.', { dur: 20, reach: 20, knows: 2 }, ['weakDown', 15], { cost: 10, cooldown: 30 }),
  // SPELLSCRIPTION (under which rule?): a condition written
  standingRule: R('spellscription', 10, 'passive', 'A Standing Rule', 'Write one rule: when you do one thing, another follows, for 5 of your pool.',
    '/rule lists the choices. Each fires at most once in 3 seconds.', { every: 3, cost: 5 }, ['cleanMacro', 20]),

  // THE SECOND RELATIONS (level 30, wave 2: DOMAINS.md 17). Each is the deeper form of the nearest class art's verb, never its copy.
  // OURANURGY: where you were, and when (Tracer's Recall; Blink Mark's mark is a place, this is a time)
  recall: R('ouranurgy', 30, 'action', 'Recall', 'Blink back to where you stood 3 seconds ago, your pool as it was then if it was fuller.',
    'Nothing is marked: the last 3 seconds are always kept.', { back: 3, max: 24 }, ['blinkChain', 10], { cost: 10, cooldown: 12 }),
  // MANIFESTATION: the pool set solid where you need to stand (Mirror's Edge's runner vision made solid; a modifier in the world, never a
  // change to the jump: the core movement lands on it as on any ground). Never on a timed record (a race, a trial, Strawman's Well's
  // courses: the critic's catch), so no record is set by it.
  footholds: R('manifestation', 30, 'action', 'Footholds', 'Set a step of Lachrymite where you are about to be: under your feet in the air, a stair ahead on the ground.',
    'Three may stand at once, each for 6 seconds. Not in a race or a timed course.', { at: 3, dur: 6, size: 0.9 }, ['sculpt', 10], { cost: 6, cooldown: 0.4 }),
  // DIVINATION: what a body is made of (Outer Wilds: knowledge is the progression)
  makeup: R('divination', 30, 'passive', "A Body's Make-up", 'Lock on to a creature and you read what it is made of, and so the type that bites it.',
    'A kind read so is known: Re-type finds its weakness from then on.', {}, ['cleanRead', 20]),
  // SPELLSCRIPTION: a condition written on yourself (Hunter x Hunter's vows)
  vow: R('spellscription', 30, 'passive', 'A Vow', 'Swear off one thing and every cost is a quarter less while you keep it. Break it and it cracks you.',
    '/vow lists the vows. A broken vow waits 30 seconds before another.', {}, ['cleanFight', 10]),
  // THE SECOND RELATIONS, WAVE 4 (level 30: the three that wanted hooks in the parry, the vessel's blow and the paint map: Petra's).
  // PSYCHOKINESIS: the force held, then given back (Half-Life 2's gravity gun; the parry's send-back made a choice of where)
  catch: R('psychokinesis', 30, 'reaction', 'The Catch', 'Parry a shot and keep holding the parry: you catch it, and let go to throw it where you aim, half again as hard.',
    'Held at most 1.5 seconds, then thrown. Let go of the parry at once and it is sent back as ever.', { hold: 1.5, mult: 1.5 }, ['parryReturn', 15]),
  // POSSESSION: whose body takes the blow (Dishonored 2's Domino)
  link: R('possession', 30, 'passive', 'The Link', 'The last creature you reprogrammed is bound to you: a crack meant for you is split, half on it.',
    'Bound while it lives and stands within 30 metres. The half is struck on it as an Influence blow, by you.', { share: 0.5, reach: 30, power: 4 }, ['macroWorn', 15]),
  // ALTERATION: the feelings' paints meeting (Divinity: Original Sin 2's surfaces; Magicka's elements)
  reactions: R('alteration', 30, 'passive', 'Reactions', 'Paint one feeling over another and they react: opposites cancel to bare ground and calm what stands there; two that wedge flare as the old paint\'s blow.',
    'A reaction a stamp, not a cell. Creatures standing in it take it; you never do.', { calm: 3, flare: 1, radius: 1.5, every: 0.25 }, ['awakened', 4]),

  // THE DEPTH RUNGS (level 60: DOMAINS.md 14's column, 18.1). Each turns what the domain's earlier rungs taught into a thing you aim.
  // The runtime is courier/domainarts/depth.js (True Odds and Borrow a Verb on Petra's two hooks of 2026-11-01: game.oddsTags, and the
  // belt's R asking `borrowed()`).
  // OURANURGY: afflictions set off on your beat (Chrono Trigger's combined techs; Into the Breach's ordered turn). 8 s is time to build
  // two statuses with two tools (a status builds in two to four blows); x1.5 is the beat's reward, and left to run out it is no gain.
  fuse: R('ouranurgy', 60, 'action', 'The Fuse', 'Fuse the nearest foe. For 8 seconds, every affliction you put on it is delayed. Press again and they all go off at once, each lasting half again as long.',
    'Let the 8 seconds run out and they go off as normal. Hint: set them off on a stunned foe for the most effect.', { window: 8, mult: 1.5, reach: 20 }, ['twoAtOnce', 15], { cost: 10, cooldown: 20 }),
  // MANIFESTATION: the weather's liquid caught (Breath of the Wild's chemistry; FLUDD refilled from the world). 3 a real s at full
  // strength is a quarter of the mop's 12: the sky's slow trickle beside the hand's work, a middling Bottle in about a real minute.
  catchWeather: R('manifestation', 60, 'passive', 'Catch the Weather', "Stand in a feeling's weather, out under the sky, with a Bottle on, and the Bottle fills with that feeling.",
    "Only feelings you have awakened to, and only if the Bottle's empty or already holds that one. Stronger weather fills it faster.", { rate: 3, min: 0.2, say: 20 }, ['bigMop', 15]),
  // PSYCHOKINESIS: force passed on (Katamari; billiards' combination shot). Three quarters a link: three links leave 0.42 of the
  // first blow, still a stagger; 3 m is two bodies' widths, so a relay is aimed, never luck across a room.
  relay: R('psychokinesis', 60, 'passive', 'Relay', 'Hit a creature hard and the force carries on to the one behind it, up to three in a row.',
    '"Hard" means a thrown hit, or a blow of power 2 or more. Each link keeps three quarters of the force, and the next body has to be within 3 m, in line.', { minPower: 2, reach: 3, cone: 0.7, keep: 0.75, links: 3 }, ['twoStrike', 10]),
  // DIVINATION: the world's chance read as numbers (Darkest Dungeon's scouting; the gacha's published rates, which the law asks for and
  // the Tithe's lamps only hinted at). Within 4 m of the Tithe's console, the next pull's chance of each tier, pity counted in.
  trueOdds: R('divination', 60, 'passive', 'True Odds', "See chance as real numbers. Near the Tithe's console you get the next pull's odds for each tier, pity included. Near a crystal you see what it might give.",
    "These are the game's real odds, never rounded in your favour. More of the world's chances show up as you learn to read them.", { reach: 4 }, ['titheRare', 10]),
  // POSSESSION: a mind's own move lent to you (Kirby's copy; Prey's typhon powers). On R in the sub's place while it lasts (Petra's belt
  // asks borrowed()); 20 s is about a Dunes fight's two thirds; 4 pool a throw and 1.2 s between, so a borrowed move is a tool, not a
  // stream (the jelly's glob strikes for 1, the wisp's flame for its cast's).
  borrowVerb: R('possession', 60, 'passive', 'Borrow a Verb', "Reprogram a creature and you can use its move on R for 20 seconds, in place of your sub's.",
    'A slip jelly lends its spit glob, a Lantern Wisp its flame ball. Each throw costs 4 pool, and the loan ends if the lender goes down.', { dur: 20, cost: 4, every: 1.2 }, ['mindRewritten', 30]),
  // ALTERATION: one affliction made the next one's opening (the trumps as a cycle, types.js; Persona's Technical). The time kept and
  // capped by the new status's own: the kind changes, never the time, so the skill is the order, not a longer lock.
  walkCycle: R('alteration', 60, 'action', 'Walk the Cycle', 'Turn every affliction on the nearest foe into the one it beats: doubt into charm, charm into confusion, confusion into a stun, blindness into doubt.',
    "Each keeps the time it had left, never more than the new one would last. A foe with no afflictions can't be walked.", { reach: 20 }, ['annihilate', 15], { cost: 8, cooldown: 10 }),
  // SPELLSCRIPTION: a rule on a creature (Pokemon's Disable; Final Fantasy's Silence). Cast on a windup, so it is read as a parry is,
  // from range; 20 s is a Dunes fight's two thirds. A FOE keeps its authored fight and refuses it (depth.js FOE_CLASS).
  sealCreature: R('spellscription', 60, 'action', 'A Seal on a Creature', "Seal a creature as it winds up a blow. The blow breaks off, and it can't use that kind of blow for 20 seconds.",
    'Only works mid-windup. A FOE follows its own rules and shrugs the seal off.', { dur: 20, reach: 20 }, ['sealSet', 20], { cost: 12, cooldown: 15 }),
};

/** Psychokinesis's shatter (SUBSTRATE.md F5b): 0.25 at 10, rising on a straight line to 0.6 at 99 (past 0.6 a heavy blow would break a
 *  fresh shell outright, which is the 99's own rule-break, not a rung's). */
export const shatterOf = (level) => (level < 10 ? 0 : 0.25 + 0.35 * Math.min(1, (level - 10) / 89));

export const isDomainArt = (id) => !!DOMAIN_ARTS[id];
export const artsOfDomain = (domain) => Object.keys(DOMAIN_ARTS).filter((id) => DOMAIN_ARTS[id].domain === domain);
const got = (L, key) => L?.get?.(key) || 0;

/** Whether a rung is open: its count way (the domain's level) or its feat way (its feat n times). The Summit lend reads every domain at
 *  99, so it opens every rung (progress/lend.js: DEBUG only, never counted). */
export function domainArtOpen(id, L, game = null) {
  const A = DOMAIN_ARTS[id]; if (!A) return false;
  if (game?.lend?.has?.('summit')) return true;
  const [feat, n] = A.feat;
  return levelOf(got(L, `exp.${A.domain}`)) >= A.level || got(L, `domain.feat.${feat}`) >= n;
}
export const openDomainArts = (L, game = null) => Object.keys(DOMAIN_ARTS).filter((id) => domainArtOpen(id, L, game));

/** The domains' rungs kept: their feats counted, each rung said once when it opens, the standing rule written. */
export class DomainArts {
  constructor(game) {
    this.game = game; this.told = []; this.rule = { when: 'parry', then: 'lend' }; this.uses = {}; this.state = {}; this.off = []; this.hourUses = {}; this.vow = null; this.pin = [];
    game.save?.section?.('domainArts', { scope: 'player', version: 1, dump: () => ({ told: [...this.told], rule: { ...this.rule }, uses: { ...this.uses }, off: [...this.off], pin: [...this.pin], vow: this.vow }),
      load: (d) => { this.told = [...(d?.told || [])]; this.rule = { when: 'parry', then: 'lend', ...(d?.rule || {}) }; this.uses = { ...(d?.uses || {}) }; this.off = [...(d?.off || [])]; this.pin = (d?.pin || []).filter((a) => DOMAIN_ARTS[a]); this.vow = VOWS[d?.vow] ? d.vow : null; },
      reset: () => { this.told = []; this.rule = { when: 'parry', then: 'lend' }; this.uses = {}; this.off = []; this.pin = []; this.vow = null; } });
    const byEvent = {};
    for (const [key, F] of Object.entries(FEATS)) {
      (byEvent[F.event] ||= []).push(['test', key, F]);
      for (const ev of F.reset || []) (byEvent[ev] ||= []).push(['reset', key, F]);
      for (const ev of F.mark || []) (byEvent[ev] ||= []).push(['mark', key, F]);
      for (const ev of F.start || []) (byEvent[ev] ||= []).push(['start', key, F]);
    }
    game.events?.on?.('*', (e) => {
      const list = e?.name && byEvent[e.name]; if (!list || e.practice || e.training) return;
      let moved = false;
      for (const [what, key, F] of list) {
        const s = (this.state[key] ||= {});
        if (what === 'reset') { s.run = 0; continue; }
        if (what === 'mark') { s.cracked = true; continue; }
        if (what === 'start') { s.fought = true; s.cracked = false; continue; }
        if ((e.by ?? 'courier') !== 'courier' && !F.anyBy) continue;
        try { if (F.test(e, s)) { game.ledger?.inc?.(`domain.feat.${key}`); moved = true; } } catch { /* a payload without the field: not counted */ }
      }
      if (moved) this.teach();
    });
    game.events?.on?.('domain.level', () => this.teach());
    // A DOWN BY WHEN AND BY WHAT RULE (the critic: Ouranurgy and Spellscription had no kill EXP): a creature downed within DOWN_AFTER.blink
    // real s of a blink is a down by where you were when (Ouranurgy's), and within DOWN_AFTER.write of a glyph with sigils or a clean
    // macro a down by what you wrote (Spellscription's): `domain.down { domain, maxHp }`, paid by domains.js as a creature's down is
    const t = () => this.game.ledger?.play ?? 0, at = { blink: -99, write: -99 };
    game.events?.on?.('move.blink', (e) => { if ((e.by ?? 'courier') === 'courier') at.blink = t(); });
    game.events?.on?.('brush.glyph', (e) => { if ((e.sigils || 0) > 0) at.write = t(); });
    game.events?.on?.('reprogram.run', (e) => { if (!e.refused) at.write = t(); });
    game.events?.on?.('creature.struck', (e) => {
      if (!e.kill || e.training || (e.by ?? 'courier') !== 'courier') return;
      if (t() - at.blink <= DOWN_AFTER.blink) game.events.emit('domain.down', { domain: 'ouranurgy', kind: e.kind, maxHp: e.maxHp, by: 'courier' });
      if (t() - at.write <= DOWN_AFTER.write) game.events.emit('domain.down', { domain: 'spellscription', kind: e.kind, maxHp: e.maxHp, by: 'courier' });
    });
    game.chat?.add?.('rule', { help: 'your standing rule (Spellscription 30): /rule (what it is and the choices), /rule <when> <then>', run: ([w, t]) => {
      if (w && t) { if (!this.setRule(w, t)) game.events?.emit('domain.rule.refuse', { when: w, then: t, why: !this.open('standingRule') ? 'closed' : 'unknown', by: 'courier' }); return; }
      game.events?.emit('domain.rule.ask', { rule: { ...this.rule }, open: this.open('standingRule'), when: Object.keys(RULE_WHEN), then: Object.keys(RULE_THEN), by: 'courier' });
    } });
    game.chat?.add?.('rung', { help: "your domains' rungs: /rung (each, open or how near, and which are on), /rung <id> (put one on or take it off)", run: ([id]) => {
      if (id) { const ok = this.toggle(id); if (ok == null) game.events?.emit('domain.art.refuse', { art: id, why: DOMAIN_ARTS[id] ? 'closed' : 'unknown', by: 'courier' }); return; }
      game.events?.emit('domain.art.ask', { notches: this.notches(), on: this.worn(), rungs: Object.keys(DOMAIN_ARTS).map((a) => ({ art: a, open: this.open(a), on: this.on(a), progress: this.progress(a) })), by: 'courier' });
    } });
    game.chat?.add?.('vow', { help: 'your vow (Spellscription 30): /vow (what it is and the vows), /vow <id> (swear it), /vow off', run: ([id]) => {
      if (id) { const ok = id === 'off' ? this.swear(null) : this.swear(id); if (!ok) game.events?.emit('domain.vow.refuse', { vow: id, why: !this.open('vow') ? 'closed' : VOWS[id] || id === 'off' ? 'wait' : 'unknown', by: 'courier' }); return; }
      game.events?.emit('domain.vow.ask', { vow: this.vow, open: this.open('vow'), vows: Object.keys(VOWS), by: 'courier' });
    } });
    queueMicrotask?.(() => this.teach());
  }
  open(id) { return domainArtOpen(id, this.game.ledger, this.game); }
  /** The notches you have now (the seven levels summed: notchesFor). */
  notches() { return notchesFor(this.game.psyche?.total?.() ?? 7); }
  /** The always-on rungs worn: open, not set aside, the ones you put on last first (`pin`), then the table's order, as many as the
   *  notches hold. One past the budget is neither worn nor set aside: it waits for a notch. */
  worn() {
    const keys = Object.keys(DOMAIN_ARTS), rank = (a) => { const i = this.pin.indexOf(a); return i >= 0 ? i : 1000 + keys.indexOf(a); };
    return keys.filter((a) => DOMAIN_ARTS[a].kind !== 'action' && this.open(a) && !this.off.includes(a)).sort((a, b) => rank(a) - rank(b)).slice(0, this.notches());
  }
  /** Whether a rung is working now: an action while it is worn on the art key's slot, any other while it holds a notch. */
  on(id) { const A = DOMAIN_ARTS[id]; if (!A || !this.open(id)) return false; return A.kind === 'action' ? this.game.classArts?.worn?.action === id : this.worn().includes(id); }
  /** Put a rung on or take it off (an action: worn on the art key's slot). Null if it is not open. */
  toggle(id) {
    const A = DOMAIN_ARTS[id]; if (!A || !this.open(id)) return null;
    if (A.kind === 'action') { this.game.classArts?.wear?.(id); return true; }
    const was = this.on(id);
    if (was) { this.off.push(id); this.pin = this.pin.filter((x) => x !== id); } // (taken off: its notch goes to the next waiting)
    else { this.off = this.off.filter((x) => x !== id); this.pin = [id, ...this.pin.filter((x) => x !== id)]; } // (put on: first in line, so the one put on last is the one that loses its notch)
    this.game.save?.dirty?.('domainArts');
    this.game.events?.emit('domain.art.wear', { art: id, on: this.on(id), by: 'courier' });
    return this.on(id);
  }
  /** How near a rung is by each way: the domain's level of the rung's, and its feat done of n. */
  progress(id) {
    const A = DOMAIN_ARTS[id], L = this.game.ledger; if (!A) return null; const [feat, n] = A.feat;
    return { level: levelOf(got(L, `exp.${A.domain}`)), of: A.level, feat, done: got(L, `domain.feat.${feat}`), n };
  }
  /** Say each rung once, the first time the ledger opens it (a lent one never: the Summit is not an achievement). */
  teach() {
    const L = this.game.ledger;
    for (const id of Object.keys(DOMAIN_ARTS)) {
      if (this.told.includes(id) || !domainArtOpen(id, L)) continue;
      this.told.push(id); const A = DOMAIN_ARTS[id];
      this.game.save?.dirty?.('domainArts');
      this.game.events?.emit('domain.art.learn', { art: id, domain: A.domain, kind: A.kind, on: this.on(id), by: 'courier' });
      if (A.kind === 'action' && !this.game.classArts?.worn?.action) this.game.classArts?.wear?.(id); // (an empty action slot takes it, as a class's art)
    }
  }
  /** A use of a rung: the first KATA pay its domain a masterful act (domains.js reads `kata`). */
  used(id, q = 0.5, more = {}) {
    const A = DOMAIN_ARTS[id]; if (!A) return;
    const n = (this.uses[id] = (this.uses[id] || 0) + 1); this.game.save?.dirty?.('domainArts');
    const hour = Math.floor((this.game.ledger?.play ?? 0) / 150), H = this.hourUses; if (H.hour !== hour) { H.hour = hour; H.n = {}; } // (a game hour: 150 real s)
    const m = (H.n[id] = (H.n[id] || 0) + 1), worn = m > WEAR ? 0.25 : 1;
    this.game.events?.emit('domain.art.use', { art: id, domain: A.domain, kind: A.kind, q: Math.max(0, Math.min(1, q)) * worn, kata: n <= KATA, ...more, by: 'courier' });
  }
  /** Swear a vow (or none): the runtime keeps it, its modifier and its breaking (courier/domainarts/run.js). */
  swear(id) {
    if (id && (!this.open('vow') || !VOWS[id] || (this.game.domainArtsRun?.vowWait ?? 0) > (this.game.domainArtsRun?.now ?? 0))) return false;
    this.vow = id; this.game.save?.dirty?.('domainArts');
    this.game.events?.emit('domain.vow.set', { vow: id, by: 'courier' }); return true;
  }
  setRule(when, then) {
    if (!this.open('standingRule') || !RULE_WHEN[when] || !RULE_THEN[then]) return false;
    this.rule = { when, then }; this.game.save?.dirty?.('domainArts');
    this.game.events?.emit('domain.rule.set', { when, then, by: 'courier' }); return true;
  }
}
