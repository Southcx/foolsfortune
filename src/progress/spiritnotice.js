// ---------------------------------------------------------------------------------------
// A SPIRIT NOTICES (docs/plans/GARDEN-COZY.md C3, GAPS.md G114): a bound spirit comments on the decor nearest its spot, or on what you
// just moved, in its grain's register. The rule is here; the words are placeholders for Espada's (docs/handoffs/espada/); the F that talks
// to a spirit, and where it stands, are Petra's (docs/handoffs/petra/).
//
// - REGISTER: the pole of the spirit's grain it leans to furthest (curious, wary, orderly, erratic, bold, shy, gentle, hostile,
//   skittish, steady; progress/combat/temperament.js TRAITS), else `plain` for a grain near the middle on every dial.
// - WHAT IT SEES: what you moved or placed this game day on its planetoid (the newest), else the placed piece nearest its spot
//   (the same face, in half-cells, before any other face), else nothing. The piece's set sorts it: its own feeling's set (a liking),
//   the set of the feeling that overcomes its own (an unease; SPIRIT-GARDEN.md 1), briar (an unease), and every other set a
//   plain remark. Nothing here changes a number: a remark is a look at the garden said in a voice, never a rating.
//
// Prior art: Animal Crossing's villagers remarking on the furniture in their houses (and on what you just moved), Spiritfarer's
// passengers' idle talk, Stardew Valley's villagers' lines on a gift they like or dislike.
//
//   REGISTERS   leadPole(grain) -> register   LINES[register][key]   NOTICE (the numbers)   keyOf(topic)
//   noticeOf({ grain, feeling, pieces, spot, moved }) -> { topic, key, piece, register } | null   (pure: scripts/garden-life.mjs)
//   game.spiritNotice = new SpiritNotice(game)   .talk(entry, spot) -> notice | null   .moved -> { id, planetoid, day } | null
//   events: spirit.notice { spirit, kind, topic, register, piece, line, by }
// ---------------------------------------------------------------------------------------
import { TRAITS } from './combat/temperament.js';
import { DECOR } from './decor.js';
import { today } from '../core/calendar.js';

/** The registers: the ten poles, and the middle. */
export const REGISTERS = [...TRAITS.flatMap((t) => [t.high, t.low]), 'plain'];
/** The numbers: a dial within `middle` of zero says nothing; a piece on another face counts `far` half-cells away. */
export const NOTICE = { middle: 0.2, far: 1000 };
/** The feeling that overcomes each (SPIRIT-GARDEN.md section 1; the same cycle as progress/mycelium.js). */
const FEELINGS = ['wonder', 'mirth', 'desire', 'grief', 'dread'];
const OVERCOME_BY = { desire: 'wonder', dread: 'desire', mirth: 'dread', grief: 'mirth', wonder: 'grief' };

/** The pole of a grain ({ o, c, e, a, n }, each -1..1) it leans to furthest, or `plain`. */
export function leadPole(grain = {}) {
  let best = null, v = NOTICE.middle;
  for (const t of TRAITS) { const x = grain?.[t.id] || 0; if (Math.abs(x) >= v) { v = Math.abs(x); best = x > 0 ? t.high : t.low; } }
  return best || 'plain';
}

/** What sort of remark a piece draws from a spirit of a feeling: `own` (its set), `against` (the overcoming feeling's), `briar`, or the
 *  plain kinds `sound`, `season`, `keepsake`, `kit` (a set of no feeling), `plain`. */
export function topicOf(id, feeling) {
  const D = DECOR[id]; if (!D) return null;
  if (D.set === feeling) return 'own';
  if (D.set === OVERCOME_BY[feeling]) return 'against';
  if (D.set === 'briar') return 'briar';
  if (D.set === 'sound' || D.set === 'season' || D.set === 'keepsake') return D.set;
  if (D.set === 'plain') return 'plain';
  return FEELINGS.includes(D.set) ? 'plain' : 'kit'; // (a feeling's set that is neither its own nor its overcomer's: a plain remark)
}
/** Which of the five lines a topic is said in. */
export const keyOf = (topic) => ({ own: 'like', sound: 'like', season: 'like', keepsake: 'like', kit: 'like', against: 'unsure', briar: 'unsure', moved: 'moved', none: 'bare' }[topic] || 'plain');

/** The piece nearest a spot among `pieces` ([id, planetoid, face, iu, iv, ...] as the decor keeps them), on its planetoid. */
export function nearestPiece(pieces = [], spot = {}) {
  let best = null, d = Infinity;
  for (const p of pieces) {
    if (p[1] !== spot.planetoid) continue;
    const dd = p[2] === spot.face ? Math.hypot((p[3] || 0) - (spot.iu || 0), (p[4] || 0) - (spot.iv || 0)) : NOTICE.far;
    if (dd < d) { d = dd; best = p; }
  }
  return best ? { id: best[0], planetoid: best[1], dist: d } : null;
}

/** What a spirit notices (pure). `moved`: { id, planetoid, day } the last piece placed or moved; `day` today. */
export function noticeOf({ grain, feeling, pieces = [], spot = {}, moved = null, day = today() } = {}) {
  const register = leadPole(grain);
  if (moved && moved.day === day && moved.planetoid === spot.planetoid && DECOR[moved.id]) return { topic: 'moved', key: 'moved', piece: moved.id, register, about: topicOf(moved.id, feeling) };
  const near = nearestPiece(pieces, spot);
  if (!near) return { topic: 'none', key: 'bare', piece: null, register, about: null };
  const topic = topicOf(near.id, feeling);
  return { topic, key: keyOf(topic), piece: near.id, register, about: topic };
}

/** The words (placeholders, Espada's to write: docs/handoffs/espada/2026-11-03-from-dovina-garden-life.md). `{piece}` is the piece's name. */
export const LINES = {
  curious: { like: 'Oh, the {piece}! Where did you find it?', unsure: 'The {piece}... I keep looking at it. Is it meant to do that?', moved: 'You moved the {piece}! What does it do over there?', bare: 'Nothing here yet. What will you put here?', plain: 'The {piece}. Hm. I wonder what it is for.' },
  wary: { like: 'The {piece} is all right. I can sit by it.', unsure: 'I do not trust the {piece}.', moved: 'The {piece} was somewhere else. I noticed.', bare: 'It is quiet here. Too open.', plain: 'The {piece}. Fine. It stays put, at least.' },
  orderly: { like: 'The {piece} suits this corner exactly.', unsure: 'The {piece} does not belong with the rest.', moved: 'Good, the {piece} is better placed now.', bare: 'This corner wants something. A plan, at least.', plain: 'The {piece} is straight. Good.' },
  erratic: { like: 'Ha, the {piece}! I like it crooked.', unsure: 'The {piece} gives me a funny feeling. Not a bad one. Maybe.', moved: 'The {piece} again! Over there now, is it?', bare: 'Nothing here. I could put something here.', plain: 'The {piece}. Hm. What was I saying?' },
  bold: { like: 'The {piece}! Now that is a good one.', unsure: 'The {piece}? I will face it. Not sure I like it.', moved: 'You moved the {piece}. Bold. I like it.', bare: 'Plenty of room to run in here.', plain: 'The {piece}. I could jump it.' },
  shy: { like: 'The {piece}... I like it. A little.', unsure: 'The {piece} is looking at me.', moved: 'Oh. The {piece} moved. Did it?', bare: 'It is a bit empty here. Quiet, though.', plain: 'The {piece}. It is nice. I think.' },
  gentle: { like: 'The {piece} is lovely. Thank you for it.', unsure: 'The {piece} seems sad to me. Maybe it needs company.', moved: 'The {piece} looks happier over there.', bare: 'It would be nice to have something here.', plain: 'The {piece} looks comfortable.' },
  hostile: { like: 'The {piece}. Fine. Not bad.', unsure: 'The {piece} is in my way.', moved: 'You moved the {piece}. About time.', bare: 'Empty. Good. Leave it.', plain: 'The {piece}. Whatever.' },
  skittish: { like: 'The {piece} is safe, right? It is safe?', unsure: 'The {piece} scares me. Something about it.', moved: 'The {piece} moved! When did it move?', bare: 'There is nothing here. What if something comes?', plain: 'The {piece}. Is it going to stay there?' },
  steady: { like: 'The {piece}. Good. I will rest by it.', unsure: 'The {piece} is not for me. It can stay.', moved: 'The {piece} is somewhere new. It will settle.', bare: 'Empty ground is fine. It waits.', plain: 'The {piece}. It will do.' },
  plain: { like: 'The {piece} is a good one.', unsure: 'The {piece} is not my favourite.', moved: 'You moved the {piece}.', bare: 'Nothing is near me.', plain: 'The {piece}.' },
};
/** One line: the register's key, with the piece's name. */
export const lineOf = (n) => (LINES[n.register]?.[n.key] || LINES.plain.plain).replace('{piece}', DECOR[n.piece]?.name?.toLowerCase() || 'garden');

export class SpiritNotice {
  constructor(game) {
    this.game = game; this.moved = null;
    const note = (ev) => { if (ev.by === 'courier') this.moved = { id: ev.id, planetoid: ev.planetoid, day: today() }; };
    game.events?.on?.('decor.place', note); game.events?.on?.('decor.move', note);
  }
  /** F at a spirit with the hand: what it says about where it stands (`spot`: { planetoid, face, iu, iv } on the decor grid, the world's). */
  talk(entry, spot = {}) {
    const sp = entry?.sp; if (!sp) return null;
    const n = noticeOf({ grain: entry.traits || entry.grain, feeling: sp.feeling, pieces: this.game.decor?.s?.placed || [], spot, moved: this.moved });
    const line = lineOf(n);
    this.game.events?.emit('spirit.notice', { spirit: entry.name || null, kind: entry.kind, topic: n.topic, about: n.about, register: n.register, piece: n.piece, line, by: 'courier' });
    return { ...n, line };
  }
}
