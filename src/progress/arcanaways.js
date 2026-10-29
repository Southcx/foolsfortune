// ---------------------------------------------------------------------------------------
// THE MAJORS' SECOND WAYS (docs/plans/SPREADS.md 5.6, ruling 2: "each Major is bound by its photograph or by this act: the card's meaning
// done"; the acts Espada's, the predicates Dovina's): a Major Arcana card bound in the collection without its sitting, by doing what the
// card means. Each act is counted in the ledger as it happens (`arcana.<card>.way`, kept here from the events that already exist) or read
// from what the ledger already keeps, and the card is bound once its count is met (`game.collection.bind`, from 'second'). "A predicate with
// no counter yet swaps the act and keeps the meaning": two are swapped and say so (the Moon, Strength).
//
// Prior art: Persona's arcana (a card earned by living its meaning), the Rider-Waite-Smith deck's meanings, OSRS's two ways to an unlock.
//
//   SECOND_WAYS[card] = { line, n, hear?: [event, test(e, g)], read?: (L, g) -> count }   wayCount(card, L, g) -> count
//   game.arcanaWays = new ArcanaWays(game)   binds on the act, and once at load for what the ledger already holds
// ---------------------------------------------------------------------------------------
import { notAwakened } from './feelings.js';

const TOOLS7 = ['psygun', 'sondelass', 'soulbrush', 'veritome', 'dreamvane', 'crucibelle', 'lockheart'];
/** Each tool's use, as its events say it (the Magician's seven within a real minute). */
const TOOL_EVENT = { 'shot.fire': 'psygun', 'cut.swing': 'sondelass', 'cut.hit': 'sondelass', 'hook.fire': 'sondelass', 'brush.swing': 'soulbrush', 'brush.paint': 'soulbrush', 'photo.take': 'veritome', 'flash.fire': 'veritome', 'dreamvane.swing': 'dreamvane', 'fork.throw': 'dreamvane', 'crucibelle.toll': 'crucibelle', 'crucibelle.note': 'crucibelle', 'lockheart.swing': 'lockheart', 'lockheart.drain': 'lockheart' };

export const SECOND_WAYS = {
  magician: { line: 'Use all seven tools within one real minute.', n: 1 }, // (counted by ArcanaWays.tools)
  priestess: { line: 'Gloss 10 neuralese words.', n: 10, read: (L) => (L.under?.('ostracon.') || []).filter(([k]) => !k.includes('.', 9)).length },
  empress: { line: 'Bring a planetoid of the Spirit Garden into bloom.', n: 1, hear: ['garden.tend', (e) => (e.h || 0) >= 0.75] },
  emperor: { line: 'Give your siblings 20 orders.', n: 20, hear: ['party.order', (e) => e.by === 'courier'] },
  hierophant: { line: 'Learn 5 Movement Arts from the System.', n: 5, read: (L, g) => Object.entries(g?.system?.state?.unlocked || {}).filter(([id, on]) => on && !id.includes('.')).length },
  lovers: { line: 'Stand in an agate: two feelings felt at once.', n: 1, hear: ['weather.change', (e) => !!e.agate] },
  chariot: { line: 'Win a race at the Raceway.', n: 1, hear: ['race.finish', (e) => e.of > 1 && e.place === 1 && !e.validate] },
  strength: { line: 'Calm a creature with the bell, without a blow.', n: 1, hear: ['creature.status', (e) => e.by === 'courier' && e.status === 'calm'] }, // (swapped: "at its most agitated" has no counter yet)
  hermit: { line: "Reach the Great Dunemaw's last floor with no one in your party.", n: 1, hear: ['well.floor', (e, g) => e.floor >= 3 && !(g?.party?.list?.length)] },
  wheel: { line: "The Lockheart's wheel lands on a jackpot.", n: 1, hear: ['lockheart.outcome', (e) => (e.rank || 0) >= 4] },
  justice: { line: 'Turn in a bounty.', n: 1, hear: ['sea.rumour.paid', (e) => e.by === 'courier'] },
  hanged: { line: 'Spend a game hour as the god hand.', n: 150, read: (L) => L.get('arcana.hanged.secs') || 0 }, // (150 real s, kept by ArcanaWays.hand)
  death: { line: 'Let a spirit go home from your garden.', n: 1, hear: ['spirit.farewell', (e) => e.by === 'courier'] },
  temperance: { line: 'Fire a true firing at the press.', n: 1, hear: ['alchemy.fire', (e) => !!e.true] },
  devil: { line: 'Let your pool overflow 10 times.', n: 10, hear: ['mind.brim', () => true] },
  tower: { line: "Burst the Great Slip Jelly's crown.", n: 1, hear: ['foe.break', (e) => (e.by ?? 'courier') === 'courier'] },
  star: { line: 'Take a fix on the open sea by reading the sky.', n: 1, hear: ['sea.fix', (e) => e.ok && e.how === 'sky'] },
  moon: { line: 'Raise the bell\'s mirage 5 times.', n: 5, hear: ['mirage.raise', () => true] }, // (swapped: "creatures strike your mirage" has no counter yet)
  sun: { line: 'Awaken to Mirth.', n: 1, hear: ['feeling.wake', (e) => e.aspect === 'mirth' || e.feeling === 'mirth'] },
  judgement: { line: 'Win a puzzle duel against an aberrant and mend its Figment.', n: 1, hear: ['duel.end', (e) => e.won && !e.practice] },
  world: { line: 'Awaken to all seven feelings.', n: 1, read: (L) => (notAwakened(L).length === 0 ? 1 : 0) },
};

/** How far a card's second way has come. */
export function wayCount(card, L, g) { const W = SECOND_WAYS[card]; if (!W) return 0; return W.read ? W.read(L, g) : L?.get?.(`arcana.${card}.way`) || 0; }

export class ArcanaWays {
  constructor(game) {
    this.game = game; this.used = {}; this.handT = null;
    for (const [card, W] of Object.entries(SECOND_WAYS)) {
      if (!W.hear) continue;
      const [ev, test] = W.hear;
      game.events?.on?.(ev, (e) => { try { if (test(e, game)) { game.ledger?.inc?.(`arcana.${card}.way`); this.check(card); } } catch { /* a payload without the field */ } });
    }
    for (const ev of Object.keys(TOOL_EVENT)) game.events?.on?.(ev, (e) => this.tools(TOOL_EVENT[ev], e));
    game.events?.on?.('god.enter', () => { this.handT = game.ledger?.play ?? 0; });
    game.events?.on?.('god.exit', () => this.hand());
    game.events?.on?.('card.get', () => queueMicrotask(() => this.checkAll()));
    for (const ev of ['feeling.wake', 'system.unlock', 'ostracon.read', 'place.enter']) game.events?.on?.(ev, () => queueMicrotask(() => this.checkAll())); // (place.enter: a save loaded, its ledger read again)
    queueMicrotask(() => this.checkAll()); // (what the ledger already holds, at load)
  }
  /** The Magician: a tool used, and all seven within a real minute of play. */
  tools(tool, e) {
    if ((e?.by ?? 'courier') !== 'courier') return;
    const now = this.game.ledger?.play ?? 0; this.used[tool] = now;
    if (TOOLS7.every((t) => this.used[t] != null && now - this.used[t] <= 60)) { this.game.ledger?.inc?.('arcana.magician.way'); this.check('magician'); }
  }
  /** The Hanged Man: time as the god hand, booked on leaving it. */
  hand() { const L = this.game.ledger; if (this.handT == null || !L) return; const dt = (L.play ?? 0) - this.handT; this.handT = null; if (dt > 0 && dt < 3600) L.inc('arcana.hanged.secs', dt); this.check('hanged'); }
  check(card) {
    const C = this.game.collection, id = `arcana.${card}`, W = SECOND_WAYS[card];
    if (!C || !W || C.has(id) || wayCount(card, this.game.ledger, this.game) < W.n) return;
    C.bind(id, 'second');
  }
  checkAll() { for (const card of Object.keys(SECOND_WAYS)) this.check(card); }
}
