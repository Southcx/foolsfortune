// ---------------------------------------------------------------------------------------
// WHAT OPENS A COSMETIC LOOK (Calissa's four kinds, 2026-10-24: a tool's skin `vfx/toolskins.js`, the Pneuka Jar's parts
// `vfx/pneukajar/table.js`, the Courier's flourishes `vfx/flourishes.js`, the instruments' housings `vfx/instrumentskins.js`): one row a
// look, a predicate over the ledger (never a flag), and the hint a picker shows while it is shut. The rule: a look is opened by the thing it
// pictures, never by a number of cubes. A tool's skin by mastery of that tool (its own counts, its achievements' keys, or the feat that
// shows the craft), a ceramic one by the kiln, a place's by the place; a Jar part by the garden and the god hand (a lid of lotus by the
// lake's lotuses, a die by the palm die grown to a d20); a flourish by the movement or the fight it pictures (a dash trail by dashing,
// a shatter by shattering); an instrument's housing by the exploring and sailing it is read on. Where a look has a count way and a feat way
// (DESIGN.md 22: skill skips grind, grind closes the gap) the row is either. A look only: nothing here changes a number, a price or a
// pool, and none costs cubes (a firing at the kiln is the one sink for looks; these are earned).
// Each kind's keys are Calissa's own (a tool's `<tool>.<skin>`, a Jar part's `<slot>.<id>`, a flourish's `<slot>.<id>`, an instrument's
// skin id). The stock of each (and the owner's Jar as made) is open from the start; a few cheap ones too (the Jar's cork, ears, shapes).
// A row names a key the game really writes (feedback/tracking.js and feedback/tracking/*.js), read in its kind: a counter by `get`, a
// record by `best`, a first by `firstCount`.
//
// Prior art: Hearthstone's card backs and Destiny's shaders and ornaments (a look earned by a season or a deed, none a power), Fortnite's
// and Path of Exile's cosmetic slots opened by what you played, the house's own card backs (progress/cardbacks.js) and skiff paint
// (progress/skiffpaint.js), and the bracelet's charms (progress/bracelet.js: a count way or a feat way, whichever comes first).
//
//   COSMETICS[kind][id] = { opens(L), hint }   kind: toolSkins | jar | flourishes | instruments
//   cosmeticOpen(kind, id, L) -> bool   game.cosmeticOpen(kind, id) (main.js; the pickers' OPEN_WHEN read it: vfx/toolskinwear.js, vfx/pneukajar/look.js, vfx/flourishes.js, vfx/instrumentskins.js)
// ---------------------------------------------------------------------------------------
import { ASPECTS } from './weather.js';

const G = (L, k) => Math.max(L?.get?.(k) || 0, L?.best?.(k) || 0); // (a counter or a record: the key's kind is the row's, this reads both)
const did = (k, n = 1) => (L) => G(L, k) >= n;
const any = (...fs) => (L) => fs.some((f) => f(L));
const total = (keys, n) => (L) => keys.reduce((s, k) => s + G(L, k), 0) >= n;
const firsts = (prefix, n) => (L) => (L?.firstCount?.(prefix) || 0) >= n;   // (a first kept per place: the vantages)
const allFeelings = (L) => ASPECTS.every((a) => G(L, `feeling.known.${a}`) >= 1);
const row = (opens, hint) => ({ opens, hint });
const START = () => true;
/** Rows open from the start (a slot's stock, the cheap ones): `start('lid', ['none', 'cork'])` -> { 'lid.none', 'lid.cork' }. */
const start = (prefix, ids) => Object.fromEntries(ids.map((id) => [prefix ? `${prefix}.${id}` : id, row(START, '')]));

const ALL_SEVEN = 'Awaken to all seven feelings.';

// ---------------------------------------------------------------- a tool's skin: `<tool>.<skin>` (the tools' ids: tools/belt.js)
const TOOL_SKINS = {
  ...start('', ['psygun', 'sondelass', 'soulbrush', 'veritome', 'dreamvane', 'crucibelle', 'lockheart'].map((t) => `${t}.stock`)),
  // the psygun: the craft of the shot, the kiln for the ceramic, the helm's gun for the reef, a duel for the glitch
  'psygun.walnut': row(any(did('shot.fired', 500), did('shot.fullcharge', 25)), 'Fire 500 shots, or fully charge 25.'),
  'psygun.blued': row(any(did('shot.hit', 300), did('psygun.pentacle', 5)), 'Land 300 shots, or a five-type volley 5 times.'),
  'psygun.porcelain': row(did('vessel.fired', 3), 'Fire 3 looks at the kiln.'),
  'psygun.raku': row(did('vessel.fired', 10), 'Fire 10 looks at the kiln.'),
  'psygun.kintsugi': row(did('vessel.refire'), 'Have the kiln mend your cracks in gold.'),
  'psygun.reef': row(did('seaserpent.hit', 10), 'Hit a sea serpent 10 times from the helm.'),
  'psygun.data': row(did('duel.won'), 'Win a puzzle duel.'),
  // the Sondelass: the cutlass's count, the Great Dunemaw for its two black ones, the garden, the vantages, the haggle
  'sondelass.tamahagane': row(any(did('cut.hit', 500), did('blade.zandatsu', 10)), 'Cut 500 things with the cutlass, or take 10 cores.'),
  'sondelass.obsidian': row(did('well.enter', 3), 'Go down into the Great Dunemaw 3 times.'),
  'sondelass.bamboo': row(did('garden.plant', 20), 'Plant 20 times in your Spirit Garden.'),
  'sondelass.moonlit': row(firsts('vantage.', 3), 'Look out from 3 vantage points.'),
  'sondelass.motley': row(did('haggle.won', 3), 'Haggle Raku down 3 times.'),
  'sondelass.molten': row(did('well.foe'), 'Beat the Great Slip Jelly.'),
  // the Soul Brush
  'soulbrush.lacquer': row(any(did('brush.swing', 300), did('sigil.cleared.best', 4)), 'Swing the brush 300 times, or erase 4 with one mark.'),
  'soulbrush.peacock': row(allFeelings, ALL_SEVEN),
  'soulbrush.bone': row(did('brush.bat', 50), 'Bat 50 clapperjars away.'),
  'soulbrush.jade': row(did('vessel.fired', 6), 'Fire 6 looks at the kiln.'),
  'soulbrush.night': row(did('day.night', 3), 'See 3 nights fall.'),
  // the Veritome
  'veritome.jade': row(did('glaze.learned', 3), 'Learn 3 glazes from photographs.'),
  'veritome.camera': row(any(did('photo.take', 100), did('photo.kinds.best', 5)), 'Take 100 photographs, or one of five kinds of thing.'),
  'veritome.grimoire': row(did('bestiary.facts', 20), 'Learn 20 facts from your photographs.'),
  'veritome.ouroboros': row(did('seaserpent.down'), 'Bring down a sea serpent.'),
  'veritome.codex': row(did('reprogram.run', 10), 'Run 10 reprogramming macros.'),
  // the Dreamvane
  'dreamvane.weathervane': row(did('sky.read', 20), 'Read the sky 20 times.'),
  'dreamvane.driftwood': row(did('dowse.find', 25), 'Dowse 25 things out.'),
  'dreamvane.meteor': row(any(did('crystal.harvest', 25), did('crystal.sweet.run', 3)), 'Open 25 crystals, or 3 sweet spots in a row.'),
  'dreamvane.reef': row(did('sea.dig'), 'Dig up a buried cache in the open sea.'),
  'dreamvane.lightning': row(did('weather.seen.fury', 3), "See Fury's weather fall 3 times."),
  // the Crucibelle
  'crucibelle.temple': row(any(did('bell.toll', 200), did('bell.toll.onbeat', 50)), 'Toll 200 times, or 50 on the beat.'),
  'crucibelle.glass': row(did('song.fever', 3), 'Play 3 songs in full fever.'),
  'crucibelle.clay': row(any(did('bell.note', 500), did('bell.onbeat', 200)), 'Play 500 notes, or 200 on the beat.'),
  'crucibelle.celadon': row(did('vessel.mends', 25), 'Mend 25 cracks.'),
  'crucibelle.blacksun': row(did('bell.fever', 25), 'Burn the bell with fever 25 times.'),
  // the Lockheart
  'lockheart.bronze': row(any(did('lockheart.swing', 200), did('lockheart.rank', 3)), 'Swing it 200 times, or land a rank 3 outcome.'),
  'lockheart.ebony': row(any(did('lockheart.open', 25), did('lockheart.three', 10)), 'Open it 25 times, or 10 with three keys.'),
  'lockheart.reliquary': row(did('lockheart.out.nuke'), 'Let an Overload out of a Lockheart.'),
  'lockheart.wicker': row(did('lockheart.fed', 500), 'Fill it with 500 Lachryma in all.'),
  'lockheart.ossuary': row(did('lockheart.hit', 100), 'Strike 100 things with the coffin.'),
  'lockheart.motley': row(total(['lockheart.out.dud', 'lockheart.out.bite'], 5), 'Draw a dud or a bite 5 times.'),
};

// ---------------------------------------------------------------- the Pneuka Jar: `<slot>.<id>` (the owner's Jar as made, open to all)
const JAR = {
  ...start('lid', ['none', 'cork']), ...start('handle', ['none', 'ears']), ...start('shape', ['owner', 'tall', 'squat']),
  ...start('foot', ['plain', 'scallop']), ...start('pendant', ['none', 'tassel']), ...start('burst', ['motes', 'dye']),
  'lid.lotus': row(did('garden.lotuses'), 'Let a lotus open on the garden\'s lake.'),
  'lid.crown': row(any(did('god.raid', 10), did('god.rejection.beaten')), 'Face 10 raid waves, or put down the island\'s answer.'),
  'lid.roof': row(did('shrine.found', 3), 'Find all three Shrines out in the world.'),
  'lid.teardrop': row(did('crystal.sweet', 25), 'Open 25 crystals at their sweet spot.'),
  'handle.rings': row(any(did('move.parry', 100), did('parry.run.best', 10)), 'Parry 100 times, or 10 in a row.'),
  'handle.dragon': row(any(did('foe.break'), did('well.foe', 5)), 'Burst the Great Slip Jelly\'s crown, or beat it 5 times.'),
  'handle.basket': row(did('garden.move', 30), 'Carry 30 things round your garden with the hand.'),
  'shape.gourd': row(did('garden.harvest', 10), 'Harvest 10 times from your garden\'s beds.'),
  'shape.faceted': row(any(did('cut.hit', 500), did('well.run.whole')), 'Cut 500 things with the cutlass, or come up out of the Great Dunemaw unbroken.'),
  'shape.melon': row(did('alchemy.press', 20), 'Press 20 materials at the Athanor.'),
  'foot.gold': row(did('vessel.fired', 10), 'Fire 10 looks at the kiln.'),
  'foot.claws': row(did('wisp.burst', 10), 'Put out 10 Lantern Wisps.'),
  'foot.lotus': row(did('spirit.farewell'), 'Let a spirit go home.'),
  'pendant.bell': row(did('song.play'), 'Play a song on the Crucibelle.'),
  'pendant.moon': row(did('day.night', 2), 'See 2 nights fall.'),
  'pendant.fish': row(did('fish.total'), 'Land a fish.'),
  'pendant.die': row(did('palm.sides', 20), 'Grow your palm die to a d20.'),
  'pendant.coin': row(did('casino.chips.cashed', 1000), 'Cash 1,000 chips back at Raku\'s cage.'),
  'pendant.gourd': row(did('shrine.storage', 10), 'Open your storage at a Shrine 10 times.'),
  'pendant.lantern': row(did('duel.secret.snuff'), 'An aberrant Lantern Wisp keeps it.'), // (its secret found: ABERRANTS.md 8; the hint never says the secret, ABERRANTS.md 4; words Espada's to word)
  'burst.petals': row(did('garden.bloom'), 'Tend a planetoid into bloom.'),
  'burst.sparks': row(did('firing', 2), 'Pass a tribulation (your second firing).'),
  'burst.bubbles': row(did('alchemy.true'), 'Fire a true firing at the Athanor.'),
  'burst.confetti': row(allFeelings, ALL_SEVEN),
};

// ---------------------------------------------------------------- the Courier's flourishes: `<slot>.<id>` (each slot's stock open)
const FLOURISHES = {
  ...start('footprints', ['stock']), ...start('dash', ['stock']), ...start('shatter', ['stock']), ...start('aura', ['off']), ...start('arrival', ['stock']),
  'footprints.blossom': row(did('garden.bloom'), 'Tend a planetoid into bloom.'),
  'footprints.scorch': row(did('vessel.fired'), 'Fire a look at the kiln.'),
  'footprints.comb': row(did('ostracon.found'), 'Find an ostracon.'),
  'footprints.paw': row(did('dist.total', 10000), 'Travel 10 km.'),
  'footprints.puddle': row(did('vessel.refire'), 'Have the kiln mend your cracks in gold.'),
  'dash.shards': row(did('move.dash', 100), 'Dash 100 times.'),
  'dash.ribbon': row(did('alchemy.fire'), 'Fire an attribute at the Athanor.'),
  'dash.talismans': row(did('sigil.pop', 50), 'Lift 50 sigils with the Soul Brush.'),
  'dash.feelings': row(allFeelings, ALL_SEVEN),
  'dash.dice': row(did('move.blink', 100), 'Blink 100 times.'),
  'shatter.porcelain': row(did('courier.shatter', 5), 'Shatter 5 times.'),
  'shatter.kintsugi': row(did('vessel.refire'), 'Have the kiln mend your cracks in gold.'),
  'shatter.ink': row(did('brush.read', 25), 'Have 25 Celestial drawings read.'),
  'shatter.moths': row(did('lockheart.out.dud', 3), 'Draw a dud from a Lockheart 3 times.'),
  'shatter.leaves': row(did('garden.season.autumn'), 'See autumn come to your Spirit Garden.'),
  'aura.motes': row(did('alchemy.press', 10), 'Press 10 materials at the Athanor.'),
  'aura.comb': row(did('ostracon.found', 3), 'Find 3 ostraca.'),
  'aura.embers': row(did('firing', 2), 'Pass a tribulation (your second firing).'),
  'aura.die': row(did('luck.reroll'), 'Re-roll a failed flee with Luck.'),
  'arrival.column': row(did('vessel.fired'), 'Fire a look at the kiln.'),
  'arrival.petals': row(did('garden.bloom.most', 6), 'Have six planetoids in bloom at once.'),
  'arrival.talismans': row(did('shrine.found', 2), 'Find 2 Shrines.'),
  'arrival.smoke': row(did('shrine.rest'), 'Rest at a Shrine.'),
};

// ---------------------------------------------------------------- the instruments' housings: the skin's id (brass, the stock, always)
const INSTRUMENTS = {
  ...start('', ['brass']),
  bone: row(any(did('clapper.down', 100), did('well.run.whole')), 'Bring down 100 clapperjars, or come up out of the Great Dunemaw unbroken.'),
  jade: row(any(did('crystal.sweet', 20), did('crystal.sweet.run', 5)), 'Open 20 crystals at their sweet spot, or 5 in a row.'),
  obsidian: row(did('god.dissonance.level', 5), 'Reach Dissonance Level 5.'),
  porcelain: row(did('emocean.hop', 3), 'Sail 3 crossings.'),
  raku: row(did('vessel.mends', 10), 'Mend 10 cracks.'),
  coral: row(any(did('sea.chart', 20), did('fish.tier.5')), 'Chart 20 squares of the open sea, or land a tier 5 fish.'),
  clockwork: row(did('day.dawn', 3), 'See 3 dawns.'),
  living: row(did('garden.bloom', 3), 'Tend 3 planetoids into bloom.'),
  mimic: row(any(did('chest.open', 100), did('curio.dupe', 10)), 'Open 100 chests.'),
};

export const COSMETICS = { toolSkins: TOOL_SKINS, jar: JAR, flourishes: FLOURISHES, instruments: INSTRUMENTS };

/** Whether a look is open on this ledger (a kind or an id with no row: never; so an unlisted look stays shut until it is ruled). */
export const cosmeticOpen = (kind, id, L) => !!COSMETICS[kind]?.[id]?.opens(L);
