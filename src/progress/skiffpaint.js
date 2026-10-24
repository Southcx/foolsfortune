// ---------------------------------------------------------------------------------------
// THE SOLAR SKIFF'S PAINT (docs/plans/SKIFF-TUNING.md 3, T8; the owner, 2026-10-22: "have some fun modifying with things like color"; and
// 2026-10-24: "full cosmetic customization"): what the board wears, beside the hull's glaze (progress/skiffparts.js `skiffGlaze`). Five
// choices: the sail's DYE, the sail's PATTERN, YOUR SEAL on the cloth, the TRAIL (on the sand and in the air) and the PENNANT (its colour
// and its length). None touches the handling (a look is never a number). What opens each is a thing done in play; a dye costs a firing's
// price each time it is changed (a sink: chosen, never full), the rest are free once open. The looks are Calissa's: they read
// `game.skiffPaint.worn` and hear `skiff.paint`.
//
// Prior art: Forza's livery editor and Mario Kart's glider and colour choices (what you race in says who you are); Rocket League's
// decals, trails and toppers, each opened by play and none touching the car's numbers (the rule taken whole); Splatoon's gear dyes; a
// regatta's racing colours and burgee (the pennant); the kiln's own firings (the price).
//
//   PAINT = { dye, pattern, seal, trail, ribbon, pennant, length } (each a list of { id, label, opens?, price? })   game.skiffPaint = new SkiffPaint(game)
//   .worn { dye, pattern, seal, trail, ribbon, pennant, length }   .open(kind, id) -> bool   .why(kind, id) -> string   .choose(kind, id) -> bool
//   .colourOf(kind) -> 0xRRGGBB | null   save section 'skiffPaint' (scope player)   event skiff.paint { kind, value, price }
// ---------------------------------------------------------------------------------------
import { ASPECTS, COLOR } from './weather.js';
import { GLAZES } from '../courier/vessel/glazes.js';

const G = (L, k) => Math.max(L?.get?.(k) || 0, L?.best?.(k) || 0);
const known = (f) => (L) => G(L, `feeling.known.${f}`) > 0;
const did = (k, n = 1) => (L) => G(L, k) >= n;
const NAME = { wonder: 'Wonder', mirth: 'Mirth', desire: 'Desire', fury: 'Fury', gall: 'Gall', grief: 'Grief', dread: 'Dread' };

/** The choices. `opens(L, game)` says whether one is open (none: from the start); `hint` says how it opens; `price: 'firing'` costs a
 *  firing (the vessel's `cost`) each time it is put on. A dye named `glaze.<id>` is any glaze you own, made into a dye. */
export const PAINT = {
  dye: [
    { id: 'cloth', label: 'The cloth', line: 'The sail as it was woven.' },
    ...ASPECTS.map((f) => ({ id: f, label: `${NAME[f]} dye`, line: `The sail dyed in ${NAME[f]}'s colour.`, colour: COLOR[f], opens: known(f), hint: `Awaken to ${NAME[f]}.`, price: 'firing' })),
  ],
  pattern: [
    { id: 'solid', label: 'Solid', line: 'One colour, edge to edge.' },
    { id: 'stripe', label: 'Stripe', line: 'A band across the sail.', opens: did('cup.clay.win'), hint: 'Win the Clay Cup.' },
    { id: 'chevron', label: 'Chevron', line: 'A point down the sail, the way you go.', opens: did('cup.sibling.win'), hint: 'Win the Sibling Cup.' },
    { id: 'motif', label: 'The feeling\'s motif', line: 'The dye\'s feeling\'s pattern, as its paint lays it on the ground (Wonder\'s frost, Mirth\'s dots ...).', opens: did('race.raceway.gold'), hint: 'Take gold at the Raceway.' },
    { id: 'kiln', label: 'Your kiln pattern', line: 'The pattern of a rare glaze you wear, fired into the cloth.', opens: (L, g) => Object.values(g?.vessel?.look || {}).some((id) => GLAZES[id]?.pattern), hint: 'Wear a rare glaze with a kiln pattern.' },
  ],
  seal: [
    { id: 'off', label: 'No seal', line: 'The cloth bare.' },
    { id: 'on', label: 'Your seal', line: 'Your seal stamped on the sail, so a race reads as yours.', opens: (L, g) => !!g?.cradles?.mine, hint: 'Choose your seal.' },
  ],
  trail: [
    { id: 'own', label: 'The sand\'s own', line: 'The wake the sand makes.' },
    { id: 'lachryma', label: 'Lachryma', line: 'A wake that shines with the film.', opens: did('skiff.combo.longest', 8), hint: 'Link 8 tricks into one combo and bank it.' },
    { id: 'glaze', label: 'The hull\'s glaze', line: 'A wake in your hull glaze\'s colour.', opens: did('skiff.combo.best', 3000), hint: 'Bank a combo worth 3,000.' },
  ],
  ribbon: [
    { id: 'off', label: 'No ribbon', line: 'Nothing in the air behind you.' },
    { id: 'on', label: 'The boost\'s ribbon', line: 'A ribbon of light behind the board while it flares in the air.', opens: did('skiff.grab.best', 2), hint: 'Hold a grab for 2 real seconds.' },
  ],
  pennant: [
    { id: 'own', label: 'The pennant as made', line: 'The masthead pennant in its own cloth.' },
    { id: 'gold', label: 'Gold', line: "A cup's colour.", opens: (L) => G(L, 'cup.clay.win') + G(L, 'cup.sibling.win') > 0, hint: 'Win a cup.' },
    ...ASPECTS.map((f) => ({ id: f, label: NAME[f], line: `A farewell's gift: ${NAME[f]}'s colour.`, colour: COLOR[f], opens: did(`spirit.farewell.${f}`), hint: `Let a spirit of ${NAME[f]} go home.` })),
  ],
  length: [
    { id: 'short', label: 'Short', line: 'A tab of cloth.' },
    { id: 'long', label: 'Long', line: 'A streamer the length of the boom.', opens: did('race.raceway.win', 10), hint: 'Win 10 races.' },
  ],
};
export const PAINT_KINDS = Object.keys(PAINT);
const STOCK = Object.fromEntries(PAINT_KINDS.map((k) => [k, PAINT[k][0].id]));
const rowOf = (kind, id) => PAINT[kind]?.find((r) => r.id === id) || (kind === 'dye' && id?.startsWith('glaze.') && GLAZES[id.slice(6)] ? { id, label: `${GLAZES[id.slice(6)].name} dye`, line: 'A glaze of yours, made into a dye.', colour: GLAZES[id.slice(6)].color, price: 'firing', glaze: id.slice(6) } : null);

export class SkiffPaint {
  constructor(game) {
    this.game = game; this.worn = { ...STOCK };
    game.save?.section('skiffPaint', {
      scope: 'player', version: 1,
      dump: () => this.worn,
      load: (d) => { this.worn = { ...STOCK }; for (const k of PAINT_KINDS) if (rowOf(k, d?.[k])) this.worn[k] = d[k]; },
      reset: () => { this.worn = { ...STOCK }; },
    });
  }
  /** The dyes on offer: the cloth, the seven feelings', and one for every glaze you own (the kiln's HULL tab shows the same glazes). */
  dyes() { const own = (this.game.vessel?.owned?.() || Object.values(GLAZES)).map((gz) => rowOf('dye', `glaze.${gz.id}`)).filter(Boolean); return [...PAINT.dye, ...own]; }
  open(kind, id) { const r = rowOf(kind, id); if (r?.glaze && this.game.vessel?.has && !this.game.vessel.has(r.glaze)) return false; return !!r && (!r.opens || !!r.opens(this.game.ledger, this.game) || !!this.game.lend?.has?.('racing')); } // (or lent: the DEBUG save's Racing row)
  why(kind, id) { const r = rowOf(kind, id); return !r ? '' : this.open(kind, id) ? r.line : r.hint || ''; }
  /** What putting it on costs now, in cubes (0 if free or already worn). */
  priceOf(kind, id) { const r = rowOf(kind, id); return r?.price === 'firing' && this.worn[kind] !== id ? this.game.vessel?.cost ?? 0 : 0; }
  /** Wear one: refused if shut or the cubes are short; a dye's price is paid as a firing is. */
  choose(kind, id) {
    const g = this.game, r = rowOf(kind, id); if (!r || !this.open(kind, id) || this.worn[kind] === id) return false;
    const price = this.priceOf(kind, id);
    if (price > 0 && !g.cubes?.spend(price, 'paint')) { g.log?.say('warn', `That dye costs ${price} cubes.`, { key: 'skiff.paint', throttle: 2 }); return false; }
    this.worn[kind] = id; g.save?.dirty('skiffPaint');
    g.events?.emit('skiff.paint', { kind, value: id, price, by: 'courier' });
    return true;
  }
  /** The colour a worn choice stands for (a dye's or a pennant's), or null for the cloth's own. */
  colourOf(kind) { return rowOf(kind, this.worn[kind])?.colour ?? null; }
}
