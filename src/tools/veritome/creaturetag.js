// ---------------------------------------------------------------------------------------
// A CREATURE'S TAG, AS DATA (docs/plans/OVERLAY.md 17; the look is Calissa's): what the overlay's tag on a creature may say, line by line,
// and what the Veritome's bestiary page says of the same kind, from ONE reader, so the two never disagree. The tag is the glance (always
// on, shallow, what familiarity allows); the Veritome is the study (the lens raised frames it; a plate holds what it saw; the darkroom
// develops it; the bestiary page is the full read).
//
// Every line is read one of three ways (Calissa's "familiarity as decryption"):
//   plain      known: its text (or its value) is shown
//   latent     a plate in the Veritome's memory holds it, not yet appraised: the line stops churning and waits (a photograph's latent
//              image, before the darkroom develops it). It turns latent the moment the shutter falls: the player sees what the plate bought.
//   scrambled  not known: its running hand churns; `len` is how long the hidden text is, so the scramble is the right size
// Two kinds of line, and two avenues, as the design laws ask:
//   the readouts (name, health, EmO, statuses, weakness, grain): by familiarity's level (progress/familiarity.js READS), from photographs
//     or downs, whichever is further; a down that reaches a level decrypts them on the spot, mid-fight
//   the habit (what it is doing now: NAP, FORAGE, MEND): by the bestiary's facts alone. Fighting teaches the numbers; only watching
//     teaches the habits (a fact is learned from a photograph of the creature doing it: bestiary.js)
// At UNDERSTOOD, while it is stunned (the one moment reprogramming can take it), the tag adds the neuralese its mind would take: the
// Functions you know that it has the parts for, and a blank for each you have not learned yet (a known unknown, never its word).
// A line that was scrambled or latent and is now plain plays its decrypt: the surface remembers what it last drew (no event is needed).
//
// Prior art: Pokémon Snap's report (the shutter is quick; the appraisal is where a photograph turns out to have been worth something),
// Monster Hunter's Hunter's Notes (a page that fills in as you learn), Watch Dogs' profiler (a glance at a stranger reads a line of them),
// Dennō Coil's glasses (the data over the world, legible or broken), Mass Effect's and Uplink's decrypt (characters churning, then
// settling one by one), Persona's Analyze (a weakness known only once found).
//
//   readTag(game, c) -> { kind, level, levelName, plate: 'plain'|'latent'|null, lines: [{ key, read, text?, len?, value? }] } | null
//   readKind(game, kind) -> { kind, level, levelName, name, reads, facts: [{ id, read, text?, len, battle }], plate }   (the bestiary page)
//   plateOf(game, kind) -> { read: 'plain', thumb, box, stars } | { read: 'latent' } | null   (the sprite: the Compendium's best plate of the kind,
//     `box` where the creature sits in it, 0..1; latent while a plate of it waits in the memory; null: never photographed, a shadow)
// ---------------------------------------------------------------------------------------
import { familiarityOf, readHealth, READS } from '../../progress/familiarity.js';
import { EMO } from '../../progress/combat/emo.js';
import { TRUMPS, TYPES } from '../../progress/combat/types.js';
import { st } from '../../creatures/creatures.js';
import { CREATURES, creatureOf } from './bestiary.js';
import { SUBJECTS } from './subjects.js';
import { FUNCTIONS, known } from './mind/functions.js';

const plain = (key, text, value) => ({ key, read: 'plain', text, ...(value !== undefined ? { value } : {}) });
const hidden = (key, len, read = 'scrambled') => ({ key, read, len });

/** The facts of a kind held, unappraised, in the Veritome's memory (what the darkroom would teach: two stars or more). */
function latentFacts(game, kind) {
  const book = game.veritome?.book, out = new Set(), C = CREATURES[kind];
  if (!book || !C) return out;
  for (const p of book.memory?.plates || []) for (const s of p.shot?.subjects || []) {
    if (s.stars < 2 || creatureOf(s) !== kind) continue;
    for (const f of C.facts) { if (book.bestiary.knows(kind, f.id) || out.has(f.id)) continue; let ok = false; try { ok = f.when(s); } catch { ok = false; } if (ok) out.add(f.id); }
  }
  return out;
}

/** The sprite's source: the Compendium's best plate of the kind once one is appraised, or latent while one waits in the memory. Only a
 *  photograph fills it in (fighting sharpens it: the sprite's resolution is familiarity's level, Calissa's look). */
export function plateOf(game, kind) {
  const book = game.veritome?.book; if (!book) return null;
  const ph = book.photos?.[kind];
  if (ph?.thumb) return { read: 'plain', thumb: ph.thumb, box: ph.box || null, stars: ph.stars };
  const held = (book.memory?.plates || []).some((p) => p.shot?.subjects?.[0]?.kind === kind);
  return held ? { read: 'latent' } : null;
}
/** The plate's read without its picture (`plain` | `latent` | null): what the tag and the agent carry; the sprite asks plateOf for the image. */
const plateRead = (game, kind) => plateOf(game, kind)?.read ?? null;

/** How a fact of a kind reads now: plain (in the bestiary), latent (in the memory) or scrambled. */
function factRead(game, kind, f, latent) {
  if (game.veritome?.book?.bestiary?.knows(kind, f.id)) return 'plain';
  return latent.has(f.id) ? 'latent' : 'scrambled';
}

/** What a living creature is doing, as the lens would see it (its subject's states), and the first fact of its kind that names it. */
function habitOf(game, c, kind) {
  const C = CREATURES[kind], S = SUBJECTS[c.kind]; if (!C || !S) return null;
  let s = null; try { s = S.find(game).find((x) => x.ref === c); } catch { s = null; }
  if (!s) return null;
  const subj = { ...s, kind: c.kind, states: [...s.states] };
  return C.facts.find((f) => f.id !== 'seen' && (() => { try { return f.when(subj); } catch { return false; } })()) || null;
}

/** Can this mind take this Function (it has the part)? Statuses, relations and memory every mind has; an action or a drive it must own. */
function takes(c, f) {
  if (f.kind === 'act') return !!c.brain?.reasoner?.actions?.some((a) => a.id === f.act);
  if (f.kind === 'drive') return !!c.drives;
  return f.kind === 'status' || f.kind === 'rel' || f.kind === 'mem';
}

/** The tag on a living creature: every line it carries, and how each reads. */
export function readTag(game, c) {
  if (!c?.kind) return null;
  const L = game.ledger, F = familiarityOf(L, c.kind), R = READS[F.level], lines = [];
  const name = c.name || CREATURES[c.kind]?.name || c.kind;
  lines.push(R.name ? plain('name', name) : hidden('name', name.length));
  // the habit: what it is doing, named only when that fact is known
  const habit = habitOf(game, c, c.kind);
  if (habit) {
    const read = factRead(game, c.kind, habit, latentFacts(game, c.kind)), label = habit.id.toUpperCase();
    lines.push(read === 'plain' ? plain('habit', label, habit.id) : hidden('habit', label.length, read));
  }
  const H = readHealth(F.level, c.hp, c.maxHp);
  lines.push(H ? plain('health', H.text, H.bar) : hidden('health', 7));
  if (R.emo) {
    const e = c.emo || 0, band = e < EMO.optimal[0] ? 'low' : e > EMO.optimal[1] ? 'hot' : 'optimal';
    lines.push(plain('emo', R.emo === 'value' ? `${band} ${e.toFixed(2)}` : band, R.emo === 'value' ? e : band));
  } else lines.push(hidden('emo', 7));
  if (R.statuses) {
    const on = [...(c.status?.keys() || [])].filter((n) => st(c, n)), build = Object.entries(c.build || {}).filter(([, k]) => k > 0.05);
    lines.push(plain('statuses', [...on, ...build.map(([t, k]) => `${TYPES[t]?.builds || t} ${Math.round(k * 100)}%`)].join(' · ') || null, { on, build: Object.fromEntries(build) }));
  } else lines.push(hidden('statuses', 9));
  if (R.multiplier) {
    const weak = c.affinity ? Object.keys(TRUMPS).find((t) => TRUMPS[t] === c.affinity) : null;
    lines.push(plain('weak', weak ? `weak to ${TYPES[weak]?.name || weak}` : null, weak));
  } else lines.push(hidden('weak', 11));
  if (R.grain) lines.push(plain('grain', null, c.grain || null));
  // the neuralese its mind would take: at UNDERSTOOD, while it is stunned
  if (F.level >= 4 && (game.stun?.stunned?.(c) ?? st(c, 'stun') > 0)) {
    const fit = Object.entries(FUNCTIONS).filter(([, f]) => f.word && takes(c, f));
    const words = fit.filter(([id]) => known(id, L)).map(([, f]) => f.word), blanks = fit.length - words.length;
    lines.push(plain('functions', words.join(' '), { words, blanks }));
  }
  return { kind: c.kind, level: F.level, levelName: F.name, plate: plateRead(game, c.kind), lines };
}

/** The bestiary page for a kind: the same level and readouts, and every fact as it reads now. */
export function readKind(game, kind) {
  const L = game.ledger, F = familiarityOf(L, kind), C = CREATURES[kind], latent = latentFacts(game, kind);
  const facts = (C?.facts || []).map((f) => {
    const read = factRead(game, kind, f, latent);
    return { id: f.id, read, battle: !!f.battle, len: f.text.length, ...(read === 'plain' ? { text: f.text } : {}) };
  });
  return { kind, level: F.level, levelName: F.name, name: READS[F.level].name ? (C?.name || kind) : null, reads: READS[F.level], facts, plate: plateRead(game, kind) };
}
