// ---------------------------------------------------------------------------------------
// MYGGDRASIL'S DIARY (docs/plans/GARDEN-COZY.md C7, "Myggdrasil's diary grows into the morning's log lines"; MYCELIUM.md 4; GAPS.md G156):
// on the first visit to the Spirit Garden of a game day, the tree says what it ate since you were last there and how its colour moved,
// once. Nothing is said for a tree that ate nothing (no nagging: a quiet tree is a quiet line). The words are placeholders for Espada's
// (feedback/tracking/gardenlife.js); the numbers here are the facts the line is made of.
//
// - WHAT IT ATE: the things fed (`myggdrasil.feed`) since its last report, by kind, the dearest first.
// - HOW ITS COLOUR MOVED: the tincture's hue and saturation then and now, as a plain colour word each (`colourWord`) and how far it
//   went on the wheel (`distance`, 0 same .. 1 opposite), so the line can say "a little" or "a great deal".
//
// Prior art: Animal Crossing's diary and Isabelle's morning report, Stardew Valley's farm report, Legend of Mana's Trent who tells you
// what the seeds grew into, A Wonderful Life's morning television (GARDEN-COZY.md C7's own).
//
//   colourWord(h, s) -> 'grey' | 'red' | 'orange' | ... | 'magenta'   movedHow(distance) -> 'barely' | 'a little' | 'some' | 'a great deal'
//   diaryOf(ate, from, to) -> { meals, things: [{ id, n }], from, to, moved, how }   (pure: scripts/garden-life.mjs)
//   game.treeDiary = new TreeDiary(game)   .report() -> the diary | null   events: myggdrasil.diary { days, meals, things, from, to, moved, how, crown, by }
// ---------------------------------------------------------------------------------------
import { today } from '../core/calendar.js';
import { distance } from './econ/materials.js';

const WORDS = [[15, 'red'], [45, 'orange'], [70, 'yellow'], [150, 'green'], [190, 'teal'], [250, 'blue'], [290, 'violet'], [335, 'magenta'], [360, 'red']];
/** A colour as a plain word (a saturation under a tenth is grey). */
export const colourWord = (h = 0, s = 1) => (s < 0.1 ? 'grey' : WORDS.find(([to]) => ((h % 360) + 360) % 360 <= to)[1]);
/** How far a colour went, as a word for the line. */
export const movedHow = (d = 0) => (d < 0.03 ? 'barely' : d < 0.12 ? 'a little' : d < 0.3 ? 'some' : 'a great deal');

/** The diary of a stretch: `ate` = [{ id, worth }] meals; `from`, `to` = { h, s } | null. */
export function diaryOf(ate = [], from = null, to = null) {
  const by = {}; for (const a of ate) by[a.id] = (by[a.id] || 0) + 1;
  const worth = {}; for (const a of ate) worth[a.id] = (worth[a.id] || 0) + (a.worth || 0);
  const things = Object.keys(by).sort((a, b) => worth[b] - worth[a]).map((id) => ({ id, n: by[id] }));
  const moved = from && to ? +distance(from, to).toFixed(3) : to ? 1 : 0;
  return { meals: ate.length, things, from: from ? { h: from.h, s: from.s } : null, to: to ? { h: to.h, s: to.s } : null, moved, how: movedHow(moved) };
}

const fresh = () => ({ day: null, ate: [], from: null });

export class TreeDiary {
  constructor(game) {
    this.game = game; this.s = fresh();
    game.save?.section('treeDiary', { scope: 'player', version: 1, dump: () => this.s, load: (d) => { this.s = { ...fresh(), ...(d || {}) }; }, reset: () => { this.s = fresh(); } });
    game.events?.on?.('myggdrasil.feed', (e) => { if (e.by !== 'courier') return; this.s.ate.push({ id: e.thing, worth: e.worth }); this.game.save?.dirty('treeDiary'); });
    game.events?.on?.('garden.enter', (e) => { if ((e?.by ?? 'courier') === 'courier') this.report(); });
  }
  /** The tincture as it is, to measure from next time. */
  sap() { const t = this.game.myggdrasil?.tincture; return t?.mass ? { h: t.h, s: t.s } : null; }
  /** The first visit of a game day: the diary of what it ate since the last report, if it ate anything; the baseline is moved on either way. */
  report() {
    const day = today(); if (this.s.day === day) return null;
    const days = this.s.day == null ? 1 : day - this.s.day, to = this.sap(), out = this.s.ate.length ? diaryOf(this.s.ate, this.s.from, to) : null;
    this.s = { day, ate: [], from: to }; this.game.save?.dirty('treeDiary');
    if (!out) return null;
    const diary = { days, ...out, crown: this.game.myggdrasil?.crown?.length || 0 };
    this.game.events?.emit('myggdrasil.diary', { ...diary, by: 'courier' });
    return diary;
  }
}
