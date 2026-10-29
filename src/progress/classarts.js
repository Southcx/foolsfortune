// ---------------------------------------------------------------------------------------
// A CLASS'S ARTS (docs/plans/CLASS-ARTS.md; CLASSES.md 6.3; South, 2026-10-29: "We need new arts for the classes"): two new arts a class,
// 38 classes, 76 arts. One is an ACTION (a verb on the art key: an input action `art`, Petra's to bind) and one a REACTION (it fires
// itself when its moment comes). A class's arts are opened by playing as that class (the owner, 2026-10-24: "having a class accentuates
// the abilities you can use, but doesn't preclude you from using them"):
//   the count way  time played as the class: 45 real minutes for its action, 90 for its reaction (`class.<id>.secs`)
//   the feat way   its feat, done n times as that class (`class.<id>.<feat>`, the FEATS below: the act is the art's own theme)
// Once open, an art is yours in every class (Final Fantasy Tactics' jobs). One action and one reaction are worn at a time (`worn`).
// Read as its own class, an art is ACCENTED: its numbers x ACCENT.k and its cost x ACCENT.cost, the class shown on the board as the source.
// The arts are new verbs and modifiers built from what the game already has (statuses, the pool, blink, signatures, decoys, the god
// hand's matter, Luck's re-roll): none changes a base rule or the core movement (DESIGN.md 22), and an assist stays a knack.
// A row's numbers are first numbers, each measured as its wave is built (four classes a wave: CLASSES.md 6). Labels are plain, Espada's
// to word; the classes not read yet (the six planets, the Hanged Man, Judgement: CLASSES.md 3) have their arts written, waiting on the read.
//
// Prior art: Final Fantasy Tactics' jobs (an action set and a reaction a job, learned in it, worn from any), Golden Sun's classes read
// from what you hold, Tactics Ogre's class skills, the Rider-Waite-Smith deck's meanings (each art is its card's), Hades' boons (one verb,
// one passive, each themed).
//
//   CLASS_ARTS[id] = { cls, kind: 'action' | 'reaction', label, line, does: { ...numbers }, cost?, cooldown?, feat: [key, n] }
//   FEATS[key] = { event, test(e) }   (what a class-scoped feat counts)   ACCENT = { k, cost }   OPEN = { action, reaction } (real minutes)
//   artOpen(id, L) -> bool   artsOf(cls) -> [id, id]   openArts(L) -> [id]   accent(id, clsNow) -> { k, cost }
//   game.classArts = new ClassArts(game)   .worn { action, reaction }   .wear(id)   events: art.learn { art, cls, by }, art.wear { art, slot, by }
// ---------------------------------------------------------------------------------------
import { MAJOR_TITLE } from './spreads.js';

/** Time played as the class that opens its arts by the count way, real minutes; the accent while read as the art's own class. */
export const OPEN = { action: 45, reaction: 90 };
export const ACCENT = { k: 1.25, cost: 0.8 };
/** Which of an art's numbers the accent grows: a size (x k) or a multiplier's bonus (1 + (v - 1) x k, so a 0.7 taken is 0.625); the rest
 *  (a depth, a count a game day, a threshold) never moves. */
const SCALE = ['dist', 'reach', 'dur', 'power', 'pool', 'knock', 'bottle', 'width', 'height', 'free', 'share', 'hours'];
const BONUS = ['mult', 'build', 'regen', 'taken', 'costMult', 'shellCost', 'sigilCost', 'first', 'weakBuild', 'familiarity', 'drain', 'paintSpeed', 'luck', 'photo', 'firstToday', 'tallies', 'count', 'guardBreak', 'mend', 'draught', 'cool'];

/** What a class-scoped feat counts: the event, and when it counts (the Courier's, the act done well enough to be the art's theme). */
export const FEATS = {
  down: { event: 'creature.struck', test: (e) => e.kill },
  downWeak: { event: 'creature.struck', test: (e) => e.kill && e.k > 1 },
  firstBlood: { event: 'creature.struck', test: (e) => e.kill && e.maxHp >= 8 },
  stunDeep: { event: 'creature.stun', test: (e) => (e.depth || 0) >= 2 },
  parry: { event: 'move.parry', test: (e) => e.what === 'blow' },
  windup: { event: 'windup.read', test: (e) => e.how !== 'parried' },
  blink: { event: 'move.blink', test: () => true },
  swing: { event: 'grapple.swing', test: (e) => e.phase === 'end' && (e.peak || 0) >= 10 },
  gold: { event: 'race.finish', test: (e) => e.medal === 'gold' && !e.validate },
  combo: { event: 'skiff.combo.bank', test: (e) => (e.mult || 1) >= 4 },
  fish: { event: 'angle.catch', test: () => true },
  release: { event: 'angle.release', test: () => true },
  sweet: { event: 'crystal.strike', test: (e) => e.sweet },
  photo: { event: 'photo.take', test: (e) => (e.score || 0) >= 200 || (e.stars || 0) >= 3 },
  reprogram: { event: 'reprogram.run', test: (e) => !e.refused && (e.q || 0) >= 0.8 },
  drain: { event: 'lockheart.drain', test: () => true },
  song: { event: 'song.play', test: (e) => (e.fever || 0) >= 0.8 },
  rhythm: { event: 'rhythm.score', test: (e) => (e.accuracy || 0) >= 0.9 },
  paint: { event: 'brush.paint', test: (e) => (e.area || 0) >= 10 },
  mop: { event: 'stain.wash', test: () => true },
  glyph: { event: 'brush.glyph', test: (e) => (e.sigils || 0) >= 2 },
  miracle: { event: 'god.miracle', test: (e) => (e.score || 0) >= 0.8 },
  sculpt: { event: 'god.sculpt', test: (e) => (e.volume || 0) >= 6 },
  duelWin: { event: 'duel.end', test: (e) => e.won && !e.practice },
  secret: { event: 'duel.secret', test: (e) => e.done && !e.practice },
  tend: { event: 'garden.tend', test: (e) => (e.h || 0) >= 0.75 },
  bind: { event: 'spirit.bind', test: () => true },
  wish: { event: 'spirit.wish.done', test: () => true },
  salvage: { event: 'sea.salvage', test: () => true },
  beast: { event: 'seabeast.down', test: () => true },
  serpent: { event: 'seaserpent.down', test: () => true },
  haunt: { event: 'haunt.end', test: (e) => e.held },
  build: { event: 'track.validate', test: (e) => e.fresh },
  crossing: { event: 'emocean.stage', test: (e) => !!e.passed },
  charted: { event: 'well.charted', test: (e) => (e.charted || 0) >= 0.9 },
  vantage: { event: 'vantage.reach', test: () => true },
  awaken: { event: 'feeling.wake', test: () => true },
  flee: { event: 'duel.flee', test: (e) => e.ok },
  shell: { event: 'shell.fire', test: () => true },
  lend: { event: 'tool.lend', test: () => true },
};

const A = (cls, kind, label, line, does, feat, more = {}) => ({ cls, kind, label, line, does, feat, ...more });

/** The 76 arts, two a class (CLASS-ARTS.md 3 says why each is its card's). Costs in Lachryma, cooldowns and durations in real seconds,
 *  reaches in metres, `power` in creatures.strike's power (a slip jelly bursts at 8). */
export const CLASS_ARTS = {
  // THE FOOL (arcana.fool): the leap, beginner's luck
  beginnersLuck: A('arcana.fool', 'action', "Beginner's Luck", 'Your next roll of chance is thrown twice, the better kept.', { rolls: 2, within: 30 }, ['flee', 3], { cost: 10, cooldown: 60 }),
  zero: A('arcana.fool', 'reaction', 'Zero', 'When your pool runs dry, your next blows and shots cost nothing for a moment.', { free: 4 }, ['down', 25], { cooldown: 45 }),

  // THE COURTS: a Page studies, a Knight charges, a Queen keeps, a King commands; Wands will, Cups feeling, Swords mind, Pentacles matter
  spark: A('page.wands', 'action', 'Spark', 'Flick an ember: it lights a slick or blot it lands on, burning it away, and staggers.', { reach: 14, power: 0.8, status: 'stagger', burns: true }, ['mop', 10], { cost: 6, cooldown: 8 }),
  eager: A('page.wands', 'reaction', 'Eager', 'Your first blow of a fight lands harder.', { first: 1.5 }, ['firstBlood', 10]),
  charge: A('knight.wands', 'action', 'Charge', 'Dash forward, striking all in your path.', { dist: 8, power: 2.0, width: 1.6 }, ['down', 40], { cost: 8, cooldown: 6 }),
  momentum: A('knight.wands', 'reaction', 'Momentum', 'Sprint for a few seconds and your next blow lands harder.', { after: 3, mult: 1.3 }, ['combo', 5]),
  kindleHeart: A('queen.wands', 'action', 'Kindle Heart', 'For a while your blows build statuses faster and your pool fills faster.', { dur: 6, build: 1.5, regen: 1.5 }, ['stunDeep', 10], { cost: 15, cooldown: 30 }),
  warmth: A('queen.wands', 'reaction', 'Warmth', "A feeling you drink stays in you twice as long.", { draught: 2 }, ['awaken', 1]),
  command: A('king.wands', 'action', 'Command', 'A roar: every creature near you is staggered and its windup broken.', { reach: 8, status: 'stagger', breaks: true }, ['parry', 30], { cost: 20, cooldown: 40 }),
  rally: A('king.wands', 'reaction', 'Rally', 'A creature downed gives you back some of your pool.', { pool: 5 }, ['down', 60]),

  offering: A('page.cups', 'action', 'Offering', 'Set down a cup of your pool: creatures near it drink and are calmed.', { pool: 10, reach: 6, status: 'calm', dur: 4 }, ['release', 5], { cooldown: 30 }),
  tender: A('page.cups', 'reaction', 'Tender', "A fish let go or a spirit's wish granted mends one crack.", { mends: 1 }, ['wish', 3]),
  wade: A('knight.cups', 'action', 'Wade', 'For a while you walk on liquid Lachryma and run faster through paint.', { dur: 5, paintSpeed: 1.2 }, ['paint', 10], { cost: 8, cooldown: 20 }),
  gallant: A('knight.cups', 'reaction', 'Gallant', 'A parry gives you back some of your pool.', { pool: 4 }, ['parry', 20]),
  wellUp: A('queen.cups', 'action', 'Well Up', 'Under falling weather, fill a Lachrymato Bottle from the sky.', { bottle: 0.3, open: true }, ['fish', 15], { cooldown: 60 }),
  empath: A('queen.cups', 'reaction', 'Empath', "You read a creature's agitation at once, and drain more in its best band.", { emoTag: true, drain: 1.25 }, ['drain', 15]),
  stillWaters: A('king.cups', 'action', 'Still Waters', 'Every creature near you settles to Balanced, its agitation to its best band.', { reach: 6, mind: 0, emo: 'band' }, ['reprogram', 3], { cost: 20, cooldown: 45 }),
  steady: A('king.cups', 'reaction', 'Steady', 'While your pool is over half, your cracks mend twice as fast.', { over: 0.5, mend: 2 }, ['bind', 3]),

  scout: A('page.swords', 'action', 'Scout', 'Every signature and creature near you is tagged through walls for a while.', { reach: 40, dur: 6 }, ['photo', 5], { cost: 8, cooldown: 20 }),
  quickStudy: A('page.swords', 'reaction', 'Quick Study', 'You come to know a kind of creature twice as fast.', { familiarity: 2 }, ['windup', 20]),
  ripostRush: A('knight.swords', 'action', 'Riposte Rush', 'Just after a parry, blink behind the attacker and strike.', { after: 1, power: 2.5 }, ['parry', 25], { cost: 6, cooldown: 4 }),
  edge: A('knight.swords', 'reaction', 'Edge', "A blow to a creature's weak point builds its status faster.", { weakBuild: 1.5 }, ['downWeak', 15]),
  clearSight: A('queen.swords', 'action', 'Clear Sight', 'For a while every windup shows its Figment telegraph whole.', { dur: 8 }, ['windup', 40], { cost: 10, cooldown: 30 }),
  cutThrough: A('queen.swords', 'reaction', 'Cut Through', 'A status that is resisted does not harden the mind that resisted it.', { noHarden: true }, ['stunDeep', 10]),
  verdict: A('king.swords', 'action', 'Verdict', 'Mark a creature: for a while your blows on it land harder and it cannot resist them.', { dur: 8, mult: 1.3, noResist: true }, ['downWeak', 30], { cost: 15, cooldown: 35 }),
  judge: A('king.swords', 'reaction', 'Judge', 'A kind you have photographed takes more from you.', { mult: 1.1 }, ['photo', 15]),

  prospect: A('page.pentacles', 'action', 'Prospect', 'Ping the strongest Lachryma in front of you, as the dowse does.', { reach: 30, cone: 0.6 }, ['sweet', 10], { cost: 5, cooldown: 10 }),
  thrift: A('page.pentacles', 'reaction', 'Thrift', 'Your shells cost less to fire.', { shellCost: 0.9 }, ['shell', 30]),
  bulwark: A('knight.pentacles', 'action', 'Bulwark', 'Brace where you stand: blows land far softer, but you cannot move.', { dur: 3, taken: 0.4 }, ['parry', 15], { cost: 10, cooldown: 20 }),
  steadfast: A('knight.pentacles', 'reaction', 'Steadfast', 'Stand still a moment and the next blow you take cracks nothing.', { still: 2 }, ['salvage', 10]),
  harvest: A('queen.pentacles', 'action', 'Harvest', 'Ripen a Spirit Garden bed at once, or strike one more cube from a crystal.', { beds: 1, crystalCube: 1 }, ['tend', 10], { cooldown: 'gameDay' }),
  hearth: A('queen.pentacles', 'reaction', 'Hearth', 'Resting at a Shrine mends a crack too.', { mends: 1 }, ['wish', 5]),
  stronghold: A('king.pentacles', 'action', 'Stronghold', 'Raise a wall of the ground in front of you, for cover.', { width: 4, height: 2.5, dur: 6 }, ['sculpt', 5], { cost: 15, cooldown: 30 }),
  dividend: A('king.pentacles', 'reaction', 'Dividend', "Each game day's first of a thing pays a quarter more.", { firstToday: 1.25 }, ['build', 2]),

  // THE ZODIAC MAJORS: fire Aries Leo Sagittarius, water Cancer Scorpio Pisces, air Libra Aquarius Gemini, earth Capricorn Taurus Virgo
  ram: A('arcana.emperor', 'action', 'Ram', 'A wall of force ahead of you knocks everything back.', { reach: 10, cone: 0.7, knock: 6, power: 1.5 }, ['down', 50], { cost: 12, cooldown: 15 }),
  dominion: A('arcana.emperor', 'reaction', 'Dominion', 'Hold your ground through a windup and its blow cannot stagger you.', { noStagger: true }, ['parry', 30]),
  tame: A('arcana.strength', 'action', 'Tame', 'A creature stunned deep enough fights beside you for a while.', { depth: 2, dur: 15 }, ['stunDeep', 15], { cost: 20, cooldown: 60 }),
  courage: A('arcana.strength', 'reaction', 'Courage', 'With your pool under a quarter, your blows land harder.', { under: 0.25, mult: 1.25 }, ['down', 40]),
  arrowOfTime: A('arcana.temperance', 'action', 'Arrow of Time', 'Throw a mark; press again soon after to blink to it.', { reach: 18, window: 1.5 }, ['blink', 40], { cost: 8, cooldown: 6 }),
  moderation: A('arcana.temperance', 'reaction', 'Moderation', 'What your pool cannot hold tops up a Lachrymato Bottle instead.', { overflowToBottle: 1 }, ['song', 5]),
  ride: A('arcana.chariot', 'action', 'Ride', 'Take the reins of a staggered creature: it moves and fights as you steer it.', { dur: 8 }, ['gold', 3], { cost: 20, cooldown: 60 }),
  reins: A('arcana.chariot', 'reaction', 'Reins', 'The Solar Skiff and your ship take less from a hit.', { taken: 0.7 }, ['crossing', 3]),
  reap: A('arcana.death', 'action', 'Reap', 'A sweep that ends any creature near its end.', { under: 0.15, reach: 3 }, ['down', 60], { cost: 12, cooldown: 20 }),
  rebirth: A('arcana.death', 'reaction', 'Rebirth', 'Once a game day, a blow that would shatter you leaves you whole instead.', { daily: 1 }, ['downWeak', 25]),
  mirageStep: A('arcana.moon', 'action', 'Mirage Step', 'Leave a decoy of yourself and go unseen for a moment.', { dur: 3 }, ['windup', 30], { cost: 12, cooldown: 25 }),
  tides: A('arcana.moon', 'reaction', 'Tides', 'At night your pool fills faster.', { regen: 1.3 }, ['fish', 10]),
  weigh: A('arcana.justice', 'action', 'Weigh', 'The next blow you take is returned in full to whoever dealt it.', { within: 4 }, ['parry', 40], { cost: 12, cooldown: 25 }),
  due: A('arcana.justice', 'reaction', 'Due', 'A creature that hurt you takes more from your next blow.', { mult: 1.3 }, ['down', 40]),
  wish: A('arcana.star', 'action', 'Wish', 'Under the open night sky, turn the weather where you stand toward Wonder for a game hour.', { toward: 'wonder', hours: 1, night: true }, ['vantage', 3], { cost: 30, cooldown: 'gameDay' }),
  hope: A('arcana.star', 'reaction', 'Hope', 'Made whole after a shatter, you come back with half your pool.', { pool: 0.5 }, ['awaken', 2]),
  echo: A('arcana.lovers', 'action', 'Echo', 'Your last tool move repeats from where you stood a moment later.', { delay: 1 }, ['lend', 40], { cost: 10, cooldown: 15 }),
  choice: A('arcana.lovers', 'reaction', 'Choice', 'Swap your main and sub, and your next lend is free.', { freeLend: 1 }, ['lend', 20]),
  bind: A('arcana.devil', 'action', 'Bind', 'Chain a creature where it stands; it cannot resist.', { dur: 5, status: 'halt', noResist: true }, ['stunDeep', 20], { cost: 15, cooldown: 30 }),
  temptation: A('arcana.devil', 'reaction', 'Temptation', 'While your pool overflows, your blows land harder.', { mult: 1.2 }, ['drain', 20]),
  sanctum: A('arcana.hierophant', 'action', 'Sanctum', 'A warded circle: nothing outside may enter, and blows inside cost no pool.', { reach: 5, dur: 8 }, ['glyph', 10], { cost: 20, cooldown: 60 }),
  teaching: A('arcana.hierophant', 'reaction', 'Teaching', "The Movement Arts' count way counts more for you.", { count: 1.5 }, ['blink', 50]),
  lantern: A('arcana.hermit', 'action', 'Lantern', "A lamp that reveals hidden things and keeps Dread's fog off you.", { reach: 8, dur: 20 }, ['charted', 2], { cost: 8, cooldown: 30 }),
  solitude: A('arcana.hermit', 'reaction', 'Solitude', 'With no sibling or spirit near you, everything costs less.', { costMult: 0.85, alone: 12 }, ['secret', 1]),

  // THE WORLD (all four, balanced): completion
  completion: A('arcana.world', 'action', 'Completion', 'For a while every art you know cools twice as fast and costs nothing.', { dur: 10, cool: 2 }, ['secret', 2], { cost: 30, cooldown: 120 }),
  wholeness: A('arcana.world', 'reaction', 'Wholeness', "Your spread's four tallies all count a little more.", { tallies: 1.1 }, ['crossing', 5]),

  // THE OTHER EIGHT (CLASSES.md 3, their read not built: written so the read has its arts waiting)
  sleight: A('arcana.magician', 'action', 'Sleight', "Swap your next shell or move for any other the tool knows, without the Box.", { swap: 1 }, ['shell', 50], { cost: 5, cooldown: 10 }),
  will: A('arcana.magician', 'reaction', 'Will', "Celestial mode's sigils cost less.", { sigilCost: 0.7 }, ['glyph', 20]),
  veil: A('arcana.priestess', 'action', 'Veil', 'A creature forgets you: it loses you and what it knew of you.', { reach: 12 }, ['windup', 30], { cost: 10, cooldown: 20 }),
  intuition: A('arcana.priestess', 'reaction', 'Intuition', "An aberrant's secret shows you where it begins.", { hint: 1 }, ['secret', 1]),
  bloom: A('arcana.empress', 'action', 'Bloom', 'A thicket grows from the ground, blocking and slowing creatures.', { reach: 6, dur: 10, slow: 0.5 }, ['tend', 15], { cost: 15, cooldown: 30 }),
  abundance: A('arcana.empress', 'reaction', 'Abundance', 'Your Spirit Garden beds yield one more.', { beds: 1 }, ['wish', 5]),
  spin: A('arcana.wheel', 'action', 'Spin', "Luck's re-roll is yours again, now.", { reroll: 1 }, ['flee', 3], { cooldown: 'gameDay' }),
  fortune: A('arcana.wheel', 'reaction', 'Fortune', 'Luck grows faster from the unlikely things you live through.', { luck: 1.25 }, ['gold', 3]),
  collapse: A('arcana.tower', 'action', 'Collapse', 'Bring the ground down on everything in an area, stunning it.', { reach: 4, power: 3.0, status: 'stun' }, ['stunDeep', 20], { cost: 18, cooldown: 30 }),
  upheaval: A('arcana.tower', 'reaction', 'Upheaval', 'A guard you break stays broken twice as long.', { guardBreak: 2 }, ['parry', 30]),
  daybreak: A('arcana.sun', 'action', 'Daybreak', 'A flash of daylight blinds what is near and lights the dark for a game hour.', { reach: 10, status: 'blind', light: 1 }, ['photo', 10], { cost: 12, cooldown: 30 }),
  radiance: A('arcana.sun', 'reaction', 'Radiance', 'Your photographs score higher.', { photo: 1.2 }, ['photo', 25]),
  suspend: A('arcana.hanged', 'action', 'Suspend', 'Hang in the air a moment while time slows round you.', { dur: 3, slow: 0.5 }, ['swing', 20], { cost: 10, cooldown: 20 }),
  surrender: A('arcana.hanged', 'reaction', 'Surrender', 'A blow taken while guarding gives back its pool.', { refund: 1 }, ['parry', 30]),
  reckoning: A('arcana.judgement', 'action', 'Reckoning', 'Every creature you have hurt nearby takes a share of all it has taken from you, at once.', { reach: 12, share: 0.3 }, ['down', 80], { cost: 25, cooldown: 60 }),
  secondChance: A('arcana.judgement', 'reaction', 'Second Chance', 'Once a game day, a failed flee or a lost duel may be tried again.', { daily: 1 }, ['duelWin', 10]),
};

export const ARTS_BY_CLASS = Object.entries(CLASS_ARTS).reduce((m, [id, a]) => ((m[a.cls] ||= []).push(id), m), {});
/** A class's two arts (action first). */
export const artsOf = (cls) => (ARTS_BY_CLASS[cls] || []).slice().sort((a, b) => (CLASS_ARTS[a].kind === 'action' ? -1 : 1));

const got = (L, k) => L?.get?.(k) || 0;
/** Whether an art is open: its count way (real minutes played as its class) or its feat way (its feat n times as its class). */
export function artOpen(id, L) {
  const R = CLASS_ARTS[id]; if (!R) return false;
  const [feat, n] = R.feat;
  return got(L, `class.${R.cls}.secs`) >= OPEN[R.kind] * 60 || got(L, `class.${R.cls}.${feat}`) >= n;
}
export const openArts = (L) => Object.keys(CLASS_ARTS).filter((id) => artOpen(id, L));
/** An art's accent: its numbers x k and its cost x cost while read as its own class, else 1 and 1. */
export const accent = (id, clsNow) => (CLASS_ARTS[id]?.cls === clsNow ? { k: ACCENT.k, cost: ACCENT.cost } : { k: 1, cost: 1 });

/** The class arts kept: time and feats counted as the class you read as, each art said once when it opens, the worn pair. */
export class ClassArts {
  constructor(game) {
    this.game = game; this.worn = { action: null, reaction: null }; this.told = []; this.since = null; this.cls = null;
    game.save?.section('classArts', { scope: 'player', version: 1, dump: () => ({ worn: { ...this.worn }, told: [...this.told] }),
      load: (d) => { this.worn = { action: d?.worn?.action ?? null, reaction: d?.worn?.reaction ?? null }; this.told = [...(d?.told || [])]; }, reset: () => { this.worn = { action: null, reaction: null }; this.told = []; } });
    const byEvent = {}; for (const [key, F] of Object.entries(FEATS)) (byEvent[F.event] ||= []).push([key, F]);
    game.events?.on?.('*', (e) => {
      if (!e?.name) return;
      this.tickTime();
      const list = byEvent[e.name]; if (!list || !this.cls || e.practice) return;
      if ((e.by ?? 'courier') !== 'courier') return;
      let moved = false; for (const [key, F] of list) { try { if (F.test(e)) { game.ledger?.inc?.(`class.${this.cls}.${key}`); moved = true; } } catch { /* a payload without the field: not counted */ } }
      if (moved) this.teach();
    });
    game.events?.on?.('spread.class', () => { this.tickTime(); this.teach(); });
    game.chat?.add?.('art', { help: "your class's arts: /art (the two you wear, and your class's), /art <id> (wear an art you have opened)", run: ([id]) => {
      if (id) { if (!this.wear(id)) this.game.events?.emit('art.refuse', { art: id, why: CLASS_ARTS[id] ? 'closed' : 'unknown', by: 'courier' }); return; }
      const cls = this.game.laidSpread?.class?.id ?? 'arcana.fool';
      this.game.events?.emit('art.ask', { cls, worn: { ...this.worn }, here: artsOf(cls).map((a) => ({ art: a, open: artOpen(a, this.game.ledger), progress: this.progress(a) })), by: 'courier' });
    } });
  }
  /** How near an art is by each way: real minutes played as its class of OPEN, and its feat done of n. */
  progress(id) { const R = CLASS_ARTS[id], L = this.game.ledger; if (!R) return null; const [feat, n] = R.feat;
    return { minutes: Math.floor(got(L, `class.${R.cls}.secs`) / 60), of: OPEN[R.kind], feat, done: got(L, `class.${R.cls}.${feat}`), n }; }
  /** Play time as the class read now, booked to the ledger at most every 10 real seconds of play (and on a change of class). */
  tickTime() {
    const L = this.game.ledger, now = L?.play ?? 0, cls = this.game.laidSpread?.class?.id ?? null;
    if (this.since == null) { this.since = now; this.cls = cls; return; }
    if (cls === this.cls && now - this.since < 10) return;
    const dt = now - this.since; if (this.cls && dt > 0 && dt < 600) L?.inc?.(`class.${this.cls}.secs`, dt);
    this.since = now; if (cls !== this.cls) this.cls = cls;
    this.teach();
  }
  /** Say each art once, the first time the ledger opens it; an empty slot takes it. */
  teach() {
    const L = this.game.ledger;
    for (const id of Object.keys(CLASS_ARTS)) {
      if (this.told.includes(id) || !artOpen(id, L)) continue;
      this.told.push(id); const R = CLASS_ARTS[id];
      if (!this.worn[R.kind]) this.worn[R.kind] = id;
      this.game.save?.dirty?.('classArts');
      this.game.events?.emit('art.learn', { art: id, cls: R.cls, kind: R.kind, by: 'courier' });
    }
  }
  /** Wear an open art in its slot (the action or the reaction). */
  wear(id) {
    const R = CLASS_ARTS[id]; if (!R || !artOpen(id, this.game.ledger)) return false;
    this.worn[R.kind] = id; this.game.save?.dirty?.('classArts'); this.game.events?.emit('art.wear', { art: id, slot: R.kind, by: 'courier' }); return true;
  }
  /** The worn action's numbers for the class read now (the accent applied), for the runtime that plays it. */
  numbers(slot = 'action') {
    const id = this.worn[slot]; if (!id) return null; const R = CLASS_ARTS[id], a = accent(id, this.game.laidSpread?.class?.id ?? null);
    const does = Object.fromEntries(Object.entries(R.does).map(([k, v]) => [k, typeof v !== 'number' || a.k === 1 ? v : SCALE.includes(k) ? v * a.k : BONUS.includes(k) ? 1 + (v - 1) * a.k : v]));
    return { id, ...R, does, cost: R.cost != null && typeof R.cost === 'number' ? Math.round(R.cost * a.cost) : R.cost, accented: a.k > 1 };
  }
}

/** The class's words for the log (spreads.js's titles for a Major; a court's id read). */
export const classWords = (cls) => { if (!cls) return null; const [a, b] = cls.split('.'); return a === 'arcana' ? MAJOR_TITLE[b] : `the ${a[0].toUpperCase()}${a.slice(1)} of ${b[0].toUpperCase()}${b.slice(1)}`; };
