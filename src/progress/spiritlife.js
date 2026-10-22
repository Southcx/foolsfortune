// ---------------------------------------------------------------------------------------
// THE SPIRITS' LIFE: where a bound spirit likes to be by the game hour and the weather, the one thing it wishes for once it trusts you,
// and the morning's digest of the garden (docs/plans/GARDEN-COZY.md C1, C2, C7, a plan the owner prunes; plain-named until the owner
// rules). Rules and state; the spirits' walk to their places is the world's (world/garden/), their words Espada's (the log's lines are
// placeholders in feedback/tracking/garden.js).
//
// - ROUTINES: a spirit's place by the day's phase and whether it rains (morning at the pond, rain under a roof, night by the lantern),
//   and how faithfully it keeps it, from its grain (a conscientious one keeps its spot; a curious one wanders): A Wonderful Life's
//   villagers on their schedules, Animal Crossing's residents who have lives of their own (the Horseshoe report: residents not your
//   responsibility).
// - WISHES (Spiritfarer's): from bond WISH.bond a spirit asks for one thing at a time: a feature placed, a garden piece of its feeling's
//   set placed, a meal that raises its own stat, a plate of its kind in the wild, or you in the garden at an hour. Met, it gives
//   WISH.bond back to the spirit, tends the Mulberry Grove (progress/harmony.js) and is counted. A wish never expires and nothing is lost
//   by leaving it (no needy companions); the next comes a game day after.
// - THE DIGEST: the first visit of a game day says the season, who wishes for what, and the garden's state, in four lines at most (A
//   Wonderful Life's morning television, Stardew Valley's notice board).
//
//   ROUTINE, PLACES, WISH, WISH_KINDS   routineOf(sheet, grain, { phase, raining }) -> { place, stay }   wishFor(key, n, sheet, open) -> wish
//   game.spiritLife = new SpiritLife(game)   .wishOf(entry) -> wish | null   .update(dt)
//   events: spirit.wish { spirit, kind, wish }   spirit.wish.done { spirit, kind, wish, bond }   garden.digest { season, day, left, wishes, briar, bloom, mail }
//           spirit.farewell.ask { spirit, kind, feeling }   spirit.farewell { spirit, kind, feeling, statue }
//           spirit.letter { from, kind, about }   spirit.letters { letters }   spirit.gift { spirit, kind, id }   /letters
// ---------------------------------------------------------------------------------------
import { today, now as calNow } from '../core/calendar.js';
import { phaseAt } from './weather.js';
import { seasonOf } from './seasons.js';
import { DECOR } from './decor.js';
import { formOf } from './spirits.js';

/** The places a spirit's day is spent at (the world finds the nearest of each on the spirit's planetoid, else wanders). */
export const PLACES = ['pond', 'lantern', 'spiritHouse', 'tree', 'terrace', 'free'];
/** A spirit's day: its place by phase, and under rain (a roof, or the pond for those who like it wet: Grief and Dread). */
export const ROUTINE = {
  dawn: 'pond', day: 'terrace', dusk: 'tree', night: 'lantern',
  rain: { wonder: 'spiritHouse', mirth: 'spiritHouse', desire: 'spiritHouse', grief: 'pond', dread: 'pond' },
  stay: { base: 0.6, keep: 0.3, roam: 0.3 }, // (how much of its time it keeps its place: 0.6, more by its grain's conscientiousness, less by its openness)
};
/** The routine for one spirit now: its place and how faithfully it keeps it (0..1; the rest of the time it wanders). */
export function routineOf(sheet = {}, grain = {}, { phase = 'day', raining = false } = {}) {
  const place = raining ? ROUTINE.rain[sheet.feeling] || 'spiritHouse' : ROUTINE[phase] || 'free';
  const stay = Math.max(0.1, Math.min(0.95, ROUTINE.stay.base + ROUTINE.stay.keep * (grain.c || 0) - ROUTINE.stay.roam * (grain.o || 0)));
  return { place, stay: +stay.toFixed(2) };
}

/** Wishes: asked from `bond` (of 100), one open at a time, the next `after` game days after one is met; meeting one gives `gift` bond.
 *  At bond 30 a spirit has been fed and petted a while (a pat is 0.5, a common meal's curio 2): trust comes before asking. */
export const WISH = { bond: 30, gift: 10, after: 1, look: 2 };
/** What a spirit can wish for, each with what meets it. `features` are the PLACE page's that make a home (progress/realm.js FEATURES);
 *  `phases` the hours a visit can be asked for. */
export const WISH_KINDS = {
  feature: { features: ['pond', 'lantern', 'incense', 'stone', 'spiritHouse'] },
  decor: {}, // (a piece of its feeling's set placed: progress/decor.js DECOR, set = the spirit's feeling)
  food: {}, // (fed a meal that raises its own feeling's stat: progress/spirits.js FEED.stat)
  photo: {}, // (a plate of its kind taken in the wild: photo.take's kinds)
  visit: { phases: ['dawn', 'dusk', 'night'] },
};
const ORDER = ['food', 'feature', 'photo', 'decor', 'visit']; // (the first wish is a meal: the easiest to meet; then the rest by a seeded draw)

function seeded(str) { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h = (h + 0x6d2b79f5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/** A spirit's `n`th wish (pure, seeded by the spirit's key: the same spirit asks the same things in the same order). `open`: the decor
 *  sets and features there are to ask for (so it never wishes for what cannot yet be had). */
export function wishFor(key, n = 0, sheet = {}, { features = WISH_KINDS.feature.features, decorSets = [] } = {}) {
  const r = seeded(`${key}#${n}`);
  let kind = n === 0 ? 'food' : ORDER[1 + Math.floor(r() * (ORDER.length - 1))];
  if (kind === 'decor' && !decorSets.includes(sheet.feeling)) kind = 'feature';
  if (kind === 'food') return { kind, stat: sheet.feeling || 'wonder' };
  if (kind === 'feature') return { kind, feature: features[Math.floor(r() * features.length)] || 'lantern' };
  if (kind === 'decor') return { kind, set: sheet.feeling };
  if (kind === 'photo') return { kind, of: sheet.kind || null };
  return { kind, phase: WISH_KINDS.visit.phases[Math.floor(r() * WISH_KINDS.visit.phases.length)] };
}

const keyOf = (e) => e.name || `${e.kind}@${e.at ?? 0}`;
/** Letters and gifts (Animal Crossing's mailbox and its "for you!", Stardew Valley's mail, Spiritfarer's notes; Espada's proposal):
 *  a thank-you after a wish; from a spirit released, a postcard every `postcardEvery` game days, `postcards` in all (a release a
 *  beginning, not an end); at the first visit of a game day, one gift from a spirit with bond `giftBond` or more, every `giftEvery`
 *  game days, a garden piece of its feeling's set it has not given before (else a plain one). `keep`: letters kept, the oldest go. */
export const MAIL = { postcards: 3, postcardEvery: 3, giftBond: 60, giftEvery: 3, keep: 30 };
/** The farewell (GARDEN-COZY.md C6; the owner, 2026-10-22: "yes, but you should get like a cosmetic reward if they do go home"): a
 *  matured spirit at full bond asks to go home, once, and never again if refused; nothing forces it, and "not yet" is simply not
 *  releasing it (Spiritfarer's Everdoor). Let go after asking, it leaves a statue of itself in its feeling (a garden piece, `statue`
 *  + the feeling, progress/decor.js) and its postcards begin, as any release's. */
export const FAREWELL = { bond: 100 };
const fresh = () => ({ wishes: {}, digest: null, mail: [], away: [], giftDay: null, given: {}, farewell: [] });

export class SpiritLife {
  constructor(game) {
    this.game = game; this.s = fresh(); this.lookT = 0;
    game.save?.section('spiritLife', { scope: 'player', version: 1,
      dump: () => this.s,
      load: (d) => { if (d && typeof d.wishes === 'object') this.s = { ...fresh(), ...d }; },
      reset: () => { this.s = fresh(); } });
    const E = game.events;
    if (!E) return;
    const meet = (test) => (ev) => { if (ev.by !== 'courier') return; for (const e of this.entries()) { const w = this.wishOf(e); if (w && test(w, e, ev)) this.done(e, w); } };
    const isIt = (e, ev) => (ev.spirit ? e.name === ev.spirit : !e.name && e.kind === ev.kind); // (an event names its spirit by name, else by kind)
    E.on('garden.place', meet((w, e, ev) => w.kind === 'feature' && ev.feature === w.feature));
    E.on('decor.place', meet((w, e, ev) => w.kind === 'decor' && DECOR[ev.id]?.set === w.set));
    E.on('spirit.feed', meet((w, e, ev) => w.kind === 'food' && isIt(e, ev) && ev.stat === w.stat)); // (`stat`: the feeling whose stat the meal raised)
    E.on('photo.take', meet((w, e, ev) => w.kind === 'photo' && (ev.kinds || [ev.kind]).includes(w.of)));
    E.on('garden.enter', (ev) => { if (ev.by !== 'courier') return; meet((w) => w.kind === 'visit' && phaseAt() === w.phase)(ev); this.post(); this.gift(); this.digest(); this.ask(); this.askHome(); }); // (the mail and a gift, then the digest of wishes already open; a new wish says itself)
    E.on('spirit.release', (ev) => { if (ev.by !== 'courier') return; this.s.away.push({ spirit: ev.spirit || null, kind: ev.kind, feeling: ev.feeling || null, day: today(), sent: 0 }); this.farewell(ev); this.game.save?.dirty('spiritLife'); });
    game.chat?.add?.('letters', { help: 'read the letters in your garden\'s mailbox: /letters', run: () => this.read() });
  }
  /** The bound spirits with a sheet (a sheet is given the first time one hops out in the garden: world/garden/raising.js). */
  entries() { return (this.game.bound?.list || []).filter((e) => e.sp); }
  wishOf(e) { const W = this.s.wishes[keyOf(e)]; return W?.open || null; }
  /** Each spirit that trusts you enough and has no wish open, and whose last was met a game day ago or more, asks its next. */
  ask() {
    const day = today(), sets = [...new Set(Object.keys(this.game.decor?.s?.owned || {}).map((id) => DECOR[id]?.set))];
    for (const e of this.entries()) {
      if ((e.sp.bond || 0) < WISH.bond) continue;
      const k = keyOf(e), W = (this.s.wishes[k] ||= { n: 0, open: null, since: null });
      if (W.open || (W.since != null && day - W.since < WISH.after)) continue;
      W.open = wishFor(k, W.n, { ...e.sp, kind: e.kind }, { decorSets: sets });
      this.game.events?.emit('spirit.wish', { spirit: e.name || null, kind: e.kind, wish: W.open, by: 'courier' });
      this.game.save?.dirty('spiritLife');
    }
  }
  /** A wish met: the spirit's bond up, the Grove tended, the next wish a game day off. */
  done(e, w) {
    const W = this.s.wishes[keyOf(e)]; if (!W?.open) return;
    W.open = null; W.n++; W.since = today();
    e.sp.bond = Math.min(100, (e.sp.bond || 0) + WISH.gift); this.game.save?.dirty('bound');
    this.game.harmony?.tend('mulberryGrove', 'wish');
    this.game.events?.emit('spirit.wish.done', { spirit: e.name || null, kind: e.kind, wish: w, bond: e.sp.bond, by: 'courier' });
    this.letter({ from: e.name || null, kind: e.kind, about: 'thanks', wish: w });
    this.game.save?.dirty('spiritLife');
  }
  /** A letter into the mailbox (its words are Espada's, by `about`: thanks, postcard). */
  letter(L) {
    this.s.mail.push({ ...L, day: today(), read: false }); if (this.s.mail.length > MAIL.keep) this.s.mail.shift();
    this.game.events?.emit('spirit.letter', { from: L.from, kind: L.kind, about: L.about, by: 'courier' }); this.game.save?.dirty('spiritLife');
  }
  /** The released spirits' postcards that are due. */
  post() {
    const day = today();
    for (const a of this.s.away) if (a.sent < MAIL.postcards && day - a.day >= MAIL.postcardEvery * (a.sent + 1)) { a.sent++; this.letter({ from: a.spirit, kind: a.kind, about: 'postcard', n: a.sent, feeling: a.feeling }); }
    this.s.away = this.s.away.filter((a) => a.sent < MAIL.postcards);
  }
  /** A gift on the doorstep: one a visit at most, from the most bonded spirit whose turn it is. */
  gift() {
    const day = today(); if (this.s.giftDay != null && day - this.s.giftDay < MAIL.giftEvery) return;
    const e = this.entries().filter((x) => (x.sp.bond || 0) >= MAIL.giftBond).sort((a, b) => b.sp.bond - a.sp.bond)[0]; if (!e || !this.game.decor) return;
    const k = keyOf(e), had = (this.s.given[k] ||= []), set = e.sp.feeling;
    const pool = Object.keys(DECOR).filter((id) => DECOR[id].from.includes('gift') && (DECOR[id].set === set || DECOR[id].set === 'plain') && !had.includes(id));
    const id = pool.find((x) => DECOR[x].set === set) || pool[0]; if (!id) return;
    had.push(id); this.s.giftDay = day; this.game.decor.give(id, 'gift');
    this.game.events?.emit('spirit.gift', { spirit: e.name || null, kind: e.kind, id, by: 'courier' }); this.game.save?.dirty('spiritLife');
  }
  /** /letters: the mailbox read (each letter said once more, then marked read). */
  read() { const unread = this.s.mail.filter((m) => !m.read); this.game.events?.emit('spirit.letters', { letters: (unread.length ? unread : this.s.mail.slice(-3)).map((m) => ({ ...m })), by: 'courier' }); for (const m of unread) m.read = true; this.game.save?.dirty('spiritLife'); }
  /** A matured spirit at full bond asks to go home, once (a refusal is never pressed). */
  askHome() {
    for (const e of this.entries()) {
      if ((e.sp.bond || 0) < FAREWELL.bond || !formOf(e.sp)) continue;
      const k = keyOf(e); if (this.s.farewell.some((a) => a.key === k)) continue;
      this.s.farewell.push({ key: k, spirit: e.name || null, kind: e.kind, feeling: e.sp.feeling || 'wonder' });
      this.game.events?.emit('spirit.farewell.ask', { spirit: e.name || null, kind: e.kind, feeling: e.sp.feeling || 'wonder', by: 'courier' });
      this.game.save?.dirty('spiritLife');
    }
  }
  /** A release: if the spirit had asked to go home, it is its farewell, and it leaves its statue. */
  farewell(ev) {
    const i = this.s.farewell.findIndex((a) => (ev.spirit ? a.spirit === ev.spirit : !a.spirit && a.kind === ev.kind)); if (i < 0) return;
    const [a] = this.s.farewell.splice(i, 1), id = `statue${a.feeling[0].toUpperCase()}${a.feeling.slice(1)}`;
    if (DECOR[id]) this.game.decor?.give(id, 'farewell');
    this.game.events?.emit('spirit.farewell', { spirit: a.spirit, kind: a.kind, feeling: a.feeling, statue: DECOR[id] ? id : null, by: 'courier' });
  }
  /** The first visit of a game day: the season, the open wishes, the garden's state (said by the log, four lines at most). */
  digest() {
    const day = today(); if (this.s.digest === day) return; this.s.digest = day;
    const S = seasonOf(day), H = this.game.harmony;
    const wishes = this.entries().map((e) => ({ spirit: e.name || null, kind: e.kind, wish: this.wishOf(e) })).filter((x) => x.wish);
    const list = H?.list?.() || [];
    this.game.events?.emit('garden.digest', { day, season: S.id, seasonDay: S.day + 1, left: S.left, wishes, mail: this.s.mail.filter((m) => !m.read).length, briar: list.filter((p) => p.band === 'briar').map((p) => p.planetoid), bloom: list.filter((p) => p.band === 'bloom').map((p) => p.planetoid), phase: phaseAt(calNow()), by: 'courier' });
    this.game.save?.dirty('spiritLife');
  }
  update(dt = 0) { if ((this.lookT -= dt) > 0) return; this.lookT = WISH.look; if (this.game.realm?.active) { this.ask(); this.askHome(); } }
}
