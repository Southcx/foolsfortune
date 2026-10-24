// ---------------------------------------------------------------------------------------
// THE SOLAR SKIFF'S PAINT (docs/plans/SKIFF-TUNING.md 3, T8; the owner, 2026-10-22: "have some fun modifying with things like color"; and
// 2026-10-24: "full cosmetic customization"): what the board wears, beside the hull's glaze (progress/skiffparts.js `skiffGlaze`). The
// choices: the HULL's painting, the sail's DYE, PATTERN and CUT, YOUR SEAL on the cloth, the TRAIL (on the sand), the RIBBON (in the air),
// the PENNANT (its colour and its shape, `length`) and the hull WRAP laid over the hull glaze. None touches the handling (a look is never
// a number). What opens each is a thing done in play; a dye and a hull painting each cost a firing's price every change (a repaint: a
// sink, chosen, never full), the rest are free once open. A SET is a full livery (Calissa's, vfx/skiffsets.js: one look across every
// slot); here is only what it takes to wear one whole (`SET_RULES`). The looks are Calissa's: they read `game.skiffPaint.worn` and hear
// `skiff.paint`.
//
// Prior art: Forza's livery editor and Mario Kart's glider and colour choices (what you race in says who you are); Rocket League's
// decals, trails and toppers, each opened by play and none touching the car's numbers (the rule taken whole); Splatoon's gear dyes; a
// regatta's racing colours and burgee (the pennant); the kiln's own firings (the price).
//
//   PAINT = { hull, dye, pattern, cut, seal, trail, ribbon, pennant, length, wrap } (each a list of { id, label, opens?, price? })   game.skiffPaint = new SkiffPaint(game)
//   .worn { hull, dye, pattern, cut, seal, trail, ribbon, pennant, length, wrap }   .open(kind, id) -> bool   .why(kind, id) -> string   .choose(kind, id) -> bool
//   SET_RULES[id] = { pieces: [[kind, id]], opens, hint }   .setHave(id) -> [owned, of]   .setComplete(id) -> bool (the count way)   .setOpen(id) -> bool   .setWhy(id)
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
  // the hull's painting (Calissa's, vfx/skiffhulls.js: six alternates of the owner's, which stays first and free); a repaint, so a firing's
  // price a change like a dye; a hull glaze still tints whichever is worn. Each opens on a craft of the board, none on the cups or the
  // feelings (those open the sail): lacquer fired, the open sea charted, jumps cleared, the buoys run clean, the night raced, the City Trial.
  hull: [
    { id: 'own', label: 'The hull as painted', line: 'The maker\'s painting.' },
    { id: 'urushi', label: 'Urushi lacquer', line: 'Black lacquer, the panels worn through to red, gold waves sprinkled over it.', opens: did('skiff.glaze', 3), hint: 'Fire your hull at the kiln 3 times.', price: 'firing' },
    { id: 'driftwood', label: 'Driftwood', line: 'Wood silvered by sun and salt, its grain raised, salt dried white where the spray sat.', opens: did('sea.chart', 20), hint: 'Chart 20 squares of the open sea.', price: 'firing' },
    { id: 'celadon', label: 'Celadon crackle', line: 'A pale green glaze, pooled deeper in the panels, crazed all over.', opens: did('skiff.gap', 10), hint: 'Clear 10 gaps.', price: 'firing' },
    { id: 'teak', label: 'Racing teak and brass', line: 'Varnished planks, brass fittings and rivets, a number band round the stern.', opens: did('skiff.buoy.power', 5), hint: 'Pass the buoys to full power.', price: 'firing' },
    { id: 'obsidian', label: 'Bone and obsidian', line: 'Black volcanic glass with a cold sheen, ivory bone for the ribs and the oars.', opens: did('race.raceway.finish.night', 10), hint: 'Finish 10 races at night.', price: 'firing' },
    { id: 'festival', label: 'Festival lacquer', line: 'A festival float\'s vermilion lacquer, gold clouds drifting over it.', opens: did('citytrial.patch', 50), hint: 'Take 50 patches in the City Trial.', price: 'firing' },
  ],
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
    // (Calissa's eight, 2026-10-24: vfx/skiffsailpatterns.js; labels plain until Espada names them. Each opens on a thing of the board's own
    //  craft, so a pattern says what its sailor has done: the race's ladder (3 wins, 3 golds, 20 wins), the trick combo's (5 linked, 6,000
    //  banked), the pop, the wreck (Kintsugi: the board broken and mended, the only one a failure opens), the night)
    { id: 'split', label: 'Two-tone', line: 'The sail halved on the diagonal, a gold seam between.', opens: did('race.raceway.finish', 3), hint: 'Finish 3 races at the Raceway.' },
    { id: 'waves', label: 'Waves', line: 'Rows of overlapping wave fans across the sail (seigaiha).', opens: did('race.raceway.win', 3), hint: 'Win 3 races.' },
    { id: 'sunburst', label: 'Sunburst', line: 'Gold rays fanned from a sun rising over the boom.', opens: did('skiff.pop.perfect', 10), hint: 'Land 10 perfect pops.' },
    { id: 'diamonds', label: 'Diamonds', line: 'A diamond lattice, keylined in gold (harlequin).', opens: did('skiff.combo.longest', 5), hint: 'Link 5 tricks into one combo and bank it.' },
    { id: 'kintsugi', label: 'Kintsugi', line: 'The cloth crazed, its seams mended in gold.', opens: did('skiff.wreck', 5), hint: 'Wreck the skiff 5 times.' },
    { id: 'checker', label: 'Checker', line: 'A racing checker down the leech.', opens: did('race.raceway.gold', 3), hint: 'Take gold at the Raceway 3 times.' },
    { id: 'constellations', label: 'Constellations', line: 'A night sky: the Plough, Orion and Cassiopeia.', opens: did('race.raceway.finish.night', 3), hint: 'Finish 3 races at night.' },
    { id: 'flames', label: 'Flames', line: 'Flames licking up from the foot.', opens: did('skiff.combo.best', 6000), hint: 'Bank a combo worth 6,000.' },
  ],
  // the sail's cut (Calissa's, vfx/skiffsailcut.js): its silhouette only; the sail's numbers stay its part's (skiffparts.js PARTS, the SAIL slot)
  cut: [
    { id: 'stock', label: 'The lug', line: 'The sail as it was made.' },
    { id: 'lateen', label: 'Lateen', line: 'A long yard raised aft, the cloth a triangle under it.', opens: did('cup.sibling.win'), hint: 'Win the Sibling Cup.' },
    { id: 'crabclaw', label: 'Crab-claw', line: 'Two spars from the tack, the cloth hollowed between them.', opens: did('skiff.grab.best', 3), hint: 'Hold a grab for 3 real seconds.' },
    { id: 'junk', label: 'Junk', line: 'Battened panels, the leech bowed out.', opens: did('race.raceway.win', 10), hint: 'Win 10 races.' },
  ],
  seal: [
    { id: 'off', label: 'No seal', line: 'The cloth bare.' },
    { id: 'on', label: 'Your seal', line: 'Your seal stamped on the sail, so a race reads as yours.', opens: (L, g) => !!g?.cradles?.mine, hint: 'Choose your seal.' },
  ],
  trail: [
    { id: 'own', label: 'The sand\'s own', line: 'The wake the sand makes.' },
    { id: 'lachryma', label: 'Lachryma', line: 'A wake that shines with the film.', opens: did('skiff.combo.longest', 8), hint: 'Link 8 tricks into one combo and bank it.' },
    { id: 'glaze', label: 'The hull\'s glaze', line: 'A wake in your hull glaze\'s colour.', opens: did('skiff.combo.best', 3000), hint: 'Bank a combo worth 3,000.' },
    // (Calissa's five, 2026-10-24: vfx/skifftrims/trails.js; each opens on a different craft: the long road, the sail's fault, the maker's
    //  own track, the pop, the near miss)
    { id: 'petals', label: 'Petals', line: 'Blossom drifting off the wake.', opens: did('race.raceway.finish', 25), hint: 'Finish 25 races at the Raceway.' },
    { id: 'embers', label: 'Embers', line: 'A smouldering line that glows and cools.', opens: did('skiff.scorch', 10), hint: 'Scorch the sail 10 times.' },
    { id: 'ink', label: 'Ink', line: 'A brush stroke left on the sand, drying.', opens: did('race.made.win'), hint: 'Win a race on a track you made.' },
    { id: 'starlight', label: 'Starlight', line: 'Tiny glints that twinkle out across the wake.', opens: did('skiff.pop.perfect', 25), hint: 'Land 25 perfect pops.' },
    { id: 'frost', label: 'Frost', line: 'Rime that sublimates as you pass.', opens: did('skiff.nearmiss', 50), hint: 'Shave 50 near misses.' },
  ],
  ribbon: [
    { id: 'off', label: 'No ribbon', line: 'Nothing in the air behind you.' },
    { id: 'on', label: 'The boost\'s ribbon', line: 'A ribbon of light behind the board while it flares in the air.', opens: did('skiff.grab.best', 2), hint: 'Hold a grab for 2 real seconds.' },
    // (Calissa's three, vfx/skifftrims/ribbons.js: the grab's long hold, the banked combo's size, the wager's win)
    { id: 'helix', label: 'Double helix', line: 'Two strands wound round your flight, rungs between them.', opens: did('skiff.grab.best', 4), hint: 'Hold a grab for 4 real seconds.' },
    { id: 'comet', label: 'Comet', line: 'A bright head, a dust tail and an ion tail.', opens: did('skiff.combo.best', 10000), hint: 'Bank a combo worth 10,000.' },
    { id: 'suits', label: 'Paper chain', line: 'A streamer of the house deck\'s cards, a suit at a time.', opens: did('wager.won', 5), hint: 'Win 5 wagers on your own races.' },
  ],
  pennant: [
    { id: 'own', label: 'The pennant as made', line: 'The masthead pennant in its own cloth.' },
    { id: 'gold', label: 'Gold', line: "A cup's colour.", opens: (L) => G(L, 'cup.clay.win') + G(L, 'cup.sibling.win') > 0, hint: 'Win a cup.' },
    ...ASPECTS.map((f) => ({ id: f, label: NAME[f], line: `A farewell's gift: ${NAME[f]}'s colour.`, colour: COLOR[f], opens: did(`spirit.farewell.${f}`), hint: `Let a spirit of ${NAME[f]} go home.` })),
  ],
  length: [
    { id: 'short', label: 'Short', line: 'A tab of cloth.' },
    { id: 'long', label: 'Long', line: 'A streamer the length of the boom.', opens: did('race.raceway.win', 10), hint: 'Win 10 races.' },
    // (the pennant's shape, Calissa's, vfx/skifftrims/pennants.js: a shape takes its colour from `pennant`; while one is worn the
    //  lengthening is off. Opened by the two cups, the glide and the seven feelings)
    { id: 'swallowtail', label: 'Swallowtail', line: 'The pennant cut with a V into its fly, a regatta\'s burgee.', opens: (L) => G(L, 'cup.clay.win') > 0 && G(L, 'cup.sibling.win') > 0, hint: 'Win both cups.' },
    { id: 'carp', label: 'Carp windsock', line: 'A koinobori carp that fills as the wind rises.', opens: did('skiff.glide', 50), hint: 'Glide 50 times.' },
    { id: 'prayer', label: 'Prayer flags', line: 'Seven little flags, the seven feelings from Wonder to Dread.', opens: (L) => ASPECTS.every((f) => known(f)(L)), hint: 'Awaken to all seven feelings.' },
  ],
  // the hull wrap (Calissa's, vfx/skifftrims/wraps.js): livery laid over the hull glaze, never replacing it; free once open (an overglaze,
  // but the hull painting is the repaint that costs). Opened by the rail (grinding), the hot lap, the solar start and the wreck.
  wrap: [
    { id: 'none', label: 'Bare hull', line: 'The hull glaze alone.' },
    { id: 'pinstripes', label: 'Pinstripes', line: 'Two coach lines down the flanks, meeting at the bow.', opens: did('skiff.grind.metres', 500), hint: 'Grind 500 metres of rail.' },
    { id: 'roundel', label: 'Roundel', line: 'A racing roundel on each flank: your number, 0, or your seal when you wear it on the sail.', opens: did('race.hotlap', 10), hint: 'Run 10 hot laps.' },
    { id: 'flames', label: 'Flames', line: 'Hot-rod flames licking aft from the bow.', opens: did('race.raceway.solarstart', 20), hint: 'Make 20 solar starts.' },
    { id: 'kintsugi', label: 'Kintsugi', line: 'A seam of gold down the flanks and across the deck: the board\'s mends worn proudly.', opens: did('skiff.wreck', 10), hint: 'Wreck the board 10 times and ride on.' },
  ],
};

/** The skiff sets (Calissa's `SKIFF_SETS`, vfx/skiffsets.js: one look across every slot). Two ways to a set, as the design laws ask: the count
 *  way, owning every piece of it (`pieces`, the ones shut at the start; completes it, once, in the ledger), and the feat way (`opens`, a thing
 *  bigger than its pieces); the set is worn whole only with both, so no slot is ever refused. A card back is not a paint kind (game.cardBacks) and
 *  stays out. The piece ids are the catalogue's (the look's table names a seigaiha and a starchart for our waves and constellations). */
export const SET_RULES = {
  kintsugi: { pieces: [['hull', 'urushi'], ['pattern', 'kintsugi'], ['cut', 'junk'], ['trail', 'ink'], ['ribbon', 'comet'], ['length', 'swallowtail'], ['wrap', 'kintsugi']], opens: did('vessel.mends', 10), hint: 'Mend 10 cracks at the kiln.' },
  driftwood: { pieces: [['hull', 'driftwood'], ['cut', 'lateen'], ['trail', 'frost'], ['length', 'prayer'], ['wrap', 'pinstripes']], opens: did('sea.herd', 3), hint: 'Photograph 3 herds from the dock\'s board.' },
  celadon: { pieces: [['hull', 'celadon'], ['dye', 'wonder'], ['pattern', 'motif'], ['trail', 'frost'], ['ribbon', 'helix'], ['pennant', 'wonder'], ['wrap', 'pinstripes']], opens: did('licence.pass', 5), hint: 'Pass 5 licence tests.' },
  matsuri: { pieces: [['hull', 'festival'], ['dye', 'fury'], ['pattern', 'waves'], ['trail', 'petals'], ['ribbon', 'suits'], ['length', 'carp'], ['wrap', 'flames']], opens: did('citytrial.done', 3), hint: 'Finish 3 City Trials.' },
  racing: { pieces: [['hull', 'teak'], ['dye', 'mirth'], ['pattern', 'checker'], ['trail', 'embers'], ['ribbon', 'comet'], ['length', 'swallowtail'], ['wrap', 'roundel']], opens: (L) => G(L, 'cup.clay.win') > 0 && G(L, 'cup.sibling.win') > 0 && G(L, 'race.raceway.win') >= 25, hint: 'Win both cups and 25 races.' },
  obsidian: { pieces: [['hull', 'obsidian'], ['dye', 'dread'], ['pattern', 'constellations'], ['cut', 'crabclaw'], ['trail', 'starlight'], ['ribbon', 'helix'], ['length', 'prayer'], ['pennant', 'dread'], ['wrap', 'pinstripes']], opens: did('haunt.held', 3), hint: 'Hold 3 haunted races.' },
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
  /** A set's pieces owned: [owned, of]. */
  setHave(id) { const P = SET_RULES[id]?.pieces || []; return [P.filter(([k, i]) => this.open(k, i)).length, P.length]; }
  /** The count way: every piece of the set open (it counts once in the ledger, `skiff.set.<id>`, when Petra's rule says so). */
  setComplete(id) { const [a, n] = this.setHave(id); return n > 0 && a === n; }
  /** The set as one choice: every piece owned and its feat done (or lent, the DEBUG save's Racing row). */
  setOpen(id) { const r = SET_RULES[id]; return !!r && (!!this.game.lend?.has?.('racing') || (this.setComplete(id) && !!r.opens(this.game.ledger, this.game))); }
  setWhy(id) { const r = SET_RULES[id]; if (!r) return ''; const [a, n] = this.setHave(id); return this.setOpen(id) ? 'Every piece, worn whole.' : a < n ? `${a} of ${n} pieces. ${r.hint}` : r.hint; }
  /** What putting it on costs now, in cubes (0 if free or already worn). */
  priceOf(kind, id) { const r = rowOf(kind, id); return r?.price === 'firing' && this.worn[kind] !== id ? this.game.vessel?.cost ?? 0 : 0; }
  /** Wear one: refused if shut or the cubes are short; a dye's price is paid as a firing is. */
  choose(kind, id) {
    const g = this.game, r = rowOf(kind, id); if (!r || !this.open(kind, id) || this.worn[kind] === id) return false;
    const price = this.priceOf(kind, id);
    if (price > 0 && !g.cubes?.spend(price, 'paint')) { g.log?.say('warn', `That ${kind === 'dye' ? 'dye' : 'repainting'} costs ${price} cubes.`, { key: 'skiff.paint', throttle: 2 }); return false; }
    this.worn[kind] = id; g.save?.dirty('skiffPaint');
    g.events?.emit('skiff.paint', { kind, value: id, price, by: 'courier' });
    return true;
  }
  /** The colour a worn choice stands for (a dye's or a pennant's), or null for the cloth's own. */
  colourOf(kind) { return rowOf(kind, this.worn[kind])?.colour ?? null; }
}
