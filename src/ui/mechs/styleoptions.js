// ---------------------------------------------------------------------------------------
// THE MECH'S STYLE WINDOW'S OPTIONS (plain names; South, 2026-11-03: "a snazzy ingame UI for customization of your mech as part of the
// hangar"): what the style window (ui/mechs/stylewindow.js) lays out, by body area. Each style tab holds the slots of the mech's style
// (vfx/mechs/mechstyle.js `game.mechStyle`) it is about, each slot its options as { id, label, line, glyph }: the ids are the
// catalogues' own (the helms, pauldrons, hip pieces, back pieces, cradle mounts, gunblades, the doll's figures and harnesses), the labels
// the catalogues' where they carry one, the one line of effect this table's (CLARITY.md 1: a genre word, one line, shown before said).
// `id: null` is the slot's NONE (or its default, where null means the part's own). A slot can be `off(ctx)`: greyed, with its one line
// of why (the harness on the hero, the gunblade with no blade weapon fitted). Every word is a placeholder for Espada's.
// `focus` names the part of the mech the camera frames while the slot is hovered (ui/mechs/stylecam.js FOCUS).
//
// Prior art: Armored Core's paint and emblem garage (the look apart from the parts), Gundam Breaker's part-and-paint screen (a tab a
// body area), Monster Hunter's layered armour (a look per slot over what is worn).
//
//   STYLE_TABS [{ id, label, slots: [slotId] }]   STYLE_SLOTS[slotId] { label, line, focus, options(ctx) -> [{ id, label, line, glyph }], off(ctx) -> why | null }
//   ctx { form, blade (a blade weapon fitted: true | false | null not known) }
// ---------------------------------------------------------------------------------------
import { HELMS } from '../../vfx/mechs/helms.js';
import { HISTORICAL } from '../../vfx/mechs/helms/historical.js';
import { ARCANA, ARCANA_HELMS } from '../../vfx/mechs/helms/arcana.js';
import { CAPES } from '../../vfx/mechs/capes.js';
import { HIPS } from '../../vfx/mechs/parts/hips.js';
import { HARNESSES, HARNESS_IDS } from '../../vfx/mechs/parts/femharness.js';
import { CRADLE_IDS } from '../../vfx/mechs/parts/cradles.js';
import { GUNBLADE_IDS } from '../../vfx/mechs/parts/gunblades.js';
import { FIGURES } from '../../vfx/mechs/parts/femlegs.js';
import { FORMS } from '../../vfx/mechs/parts/kit.js';

const cap = (s) => String(s).replace(/^the /, '').replace(/^./, (c) => c.toUpperCase());

/** The one lines (plain placeholders for Espada's). */
const LINE = {
  form: { hero: 'Top-heavy: broad shoulders, gauntlets 12% larger.', doll: 'Pear-shaped: the weight in the hips and thighs, a floating helm.' },
  figure: { d: "The Venus's chest and rump on the Galatea's hips.", a: 'The mass set low: wide hips, a full chest.', b: 'The classical ideal: the rump high, the waist narrow.', c: 'Amphora hips over cone legs.' },
  harness: { halter: 'Gold underwires up to a gorget at the collar.', highcut: 'A racing one-piece cut high over the hips.', coins: 'A coin belt slung low, a fringe of gold coins.',
    cords: 'A braided cord net knotted in gold.', nouveau: 'Whiplash gold scrolls over the hips.', garters: 'A sash across the hips, a band round each thigh.',
    bows: 'Ribbon ties meeting in bows over the hips.', corset: 'Laced up the waist, the basque dipping to a point.', sling: 'One wide gold band from each shoulder.',
    rope: 'A two-strand rope tied in diamonds.', mucha: 'One long gold ribbon thrown round the hips.', crisscross: 'Gilt straps crossed over the waist.',
    swag: 'Strands of beads draped from a jewelled belt.', obi: 'A wide sash with a great bow behind.' },
  pauldron: { null: 'The shoulder plates the arms part came with.', osode: 'Six laced lames hung flat off each shoulder.', zaku: 'A spiked dome on the left, a shield on the right.',
    wing: 'Four long blades fanned up and back.', spaulder: "A knight's domed cap over stacked lames.", disc: 'A round shield-disc facing out.',
    puff: 'A ribbed leg-of-mutton puff, its band gilt.', horn: 'A dome cap under a great curving horn.' },
  hip: { null: 'Bare hips: nothing hung from the belt.', crinoline: 'Twelve bell plates, open at the front.', tassets: 'Two great plates over the thighs.',
    kusazuri: 'Seven laced skirt plates all round.', pteruges: 'Sixteen studded straps all round.' },
  cape: { null: 'Nothing at the back but the cradle.', renko: 'A hoop of eight drums round the shoulders.', kohai: 'Curling flames round an open ring.',
    kazebukuro: 'A tube of cloth billowing over the helm.', tenne: 'A stiffened sash looped behind the helm.', knight: 'Heavy lined cloth from a gold yoke.' },
  cradle: { boss: 'An octagonal boss on a trim flange.', sunk: 'A wide dish sunk into the back.', kiln: 'A raised kiln collar on four struts.',
    yoke: 'A broad yoke from blade to blade, strapped.', halo: 'A ring of gold rays behind the Jar.' },
  gunblade: { gunblade: 'A cutlass with a revolver over the fist.', pepperbox: 'Six barrels round the blade as its guard.', bayonet: 'A cutlass slung between twin barrels.',
    wheellock: 'A short hanger with a wheel-lock and a trumpet muzzle.', gatling: 'A scimitar under six turning barrels.', saya: 'A sabre whose scabbard is the barrel.' },
  helm: { stag: 'Heavy branching antlers two heads across.', tyrant: "A tyrannosaur's skull, teeth hung from the brim.", mammoth: 'A double dome with curling tusks.',
    sabretooth: "A big cat's head, two fangs, a mane of plumes.", pterosaur: 'A crest swept back, wings for flaps.', triceratops: 'A knobbed frill and two horns.',
    kabuto: 'A ribbed bowl under a crescent crest.', szyszak: 'A fluted bowl, a nasal, eagle wings and plumes.',
    nagaEboshi: 'A tall court hat as a helm.', ichiNoTani: 'A great fan standing off the bowl.', namazuO: "A catfish's tail swept up.",
    shida: 'A fern-leaf crest on a black bowl.', horned: "Ram's horns and a spectacled face.", negroli: 'A siren across the crest.',
    suttonHoo: 'A masked face and a dragon crest.', turban: 'A tall onion bowl, a long nasal.' },
};
const line = (slot, id) => LINE[slot]?.[id ?? 'null'] || '';
/** The helms' groups, in their order: the beasts, the warlords, the real helms, the Major Arcana (a card a culture). */
const BEASTS = ['stag', 'tyrant', 'mammoth', 'sabretooth', 'pterosaur', 'triceratops'], WARLORDS = ['kabuto', 'szyszak'];
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

const opt = (slot, id, label, extra = {}) => ({ id, label, line: line(slot, id), glyph: { slot, id, ...extra } });

export const STYLE_SLOTS = {
  form: { label: 'FORM', line: 'The frame drawn heroic or as the doll. Rebuilds the frame.', focus: 'whole',
    options: () => Object.keys(FORMS).map((id) => opt('form', id, cap(id))) },
  figure: { label: 'FIGURE', line: "The doll's proportions.", focus: 'whole',
    options: () => ['d', 'a', 'b', 'c'].map((id) => opt('figure', id, cap(FIGURES[id]?.label || id))),
    off: (c) => (c.form !== 'doll' ? 'Only the doll has a figure: choose the doll above.' : null) },
  helm: { label: 'HELM', line: 'Worn over any head, floating over the collar.', focus: 'head',
    options: (c) => [
      { ...opt('helm', null, c.form === 'doll' ? "The doll's own" : 'Bare head'), line: c.form === 'doll' ? `The doll never shows a bare head: ${HELMS[FORMS.doll.helm]?.label || 'its own'}.` : "The head part's own shell.", group: null },
      ...BEASTS.map((id) => ({ ...opt('helm', id, HELMS[id].label), group: 'BEASTS' })),
      ...WARLORDS.map((id) => ({ ...opt('helm', id, HELMS[id].label), group: 'WARLORDS' })),
      ...Object.keys(HISTORICAL).map((id) => ({ ...opt('helm', id, HELMS[id].label), group: 'REAL HELMS' })),
      ...ARCANA_HELMS.map((id) => { const [card, what] = String(ARCANA[id].label).split(': ');
        return { ...opt('helm', id, what ? cap(what) : ARCANA[id].label, { card: ARCANA[id].card }), line: `${card}, card ${ROMAN[ARCANA[id].card]}.`, group: 'THE MAJOR ARCANA' }; }),
    ].filter((o) => o.id === null || HELMS[o.id]) },
  pauldron: { label: 'PAULDRONS', line: 'The great shoulder pieces, worn apart from the arms.', focus: 'shoulders',
    options: () => [opt('pauldron', null, "Arms' own"), ...['osode', 'zaku', 'wing', 'spaulder', 'disc', 'horn', 'puff'].map((id) => opt('pauldron', id,
      { osode: 'Osode', zaku: 'Spike and shield', wing: 'Wing', spaulder: 'Spaulder', disc: 'Disc', horn: 'Horn', puff: 'Puffed sleeve' }[id]))] },
  harness: { label: 'HARNESS', line: "Gold lines laid over the doll's plates.", focus: 'pelvis',
    options: () => HARNESS_IDS.map((id) => opt('harness', id, cap(HARNESSES[id]?.label || id))),
    off: (c) => (c.form !== 'doll' ? 'Only the doll wears a harness: choose the doll on FRAME.' : null) },
  cradle: { label: 'CRADLE MOUNT', line: "How the cradle's well is housed in the back. Rebuilds the frame.", focus: 'back',
    options: () => CRADLE_IDS.map((id) => opt('cradle', id, { boss: 'Boss', sunk: 'Sunk socket', kiln: 'Kiln collar', yoke: 'Yoke', halo: 'Halo' }[id] || cap(id))) },
  hip: { label: 'HIP PIECE', line: 'Plates hung from a belt, pushed open by the thighs.', focus: 'pelvis',
    options: () => [opt('hip', null, 'None'), ...Object.keys(HIPS).map((id) => opt('hip', id, HIPS[id].label))] },
  cape: { label: 'BACK PIECE', line: 'Worn at the shoulders and back, clear of the cradle.', focus: 'back',
    options: () => [opt('cape', null, 'None'), ...Object.keys(CAPES).map((id) => opt('cape', id, CAPES[id].label))] },
  gunblade: { label: 'GUNBLADE', line: "The blade weapon's look. Never its numbers.", focus: 'weapon',
    options: () => GUNBLADE_IDS.map((id) => opt('gunblade', id, { gunblade: 'Gunblade', pepperbox: 'Pepperbox saber', bayonet: 'Twin bayonet', wheellock: 'Wheel-lock hanger', gatling: 'Gatling scimitar', saya: 'Saya sabre' }[id] || cap(id))),
    off: (c) => (c.blade === false ? 'Shown on the blade weapon: fit one on an arm at the gantry.' : null) },
};

/** The style tabs, by body area (Gundam Breaker's). */
export const STYLE_TABS = [
  { id: 'frame', label: 'FRAME', slots: ['form', 'figure'] },
  { id: 'head', label: 'HEAD', slots: ['helm'] },
  { id: 'shoulders', label: 'SHOULDERS', slots: ['pauldron'] },
  { id: 'body', label: 'BODY', slots: ['harness', 'cradle'] },
  { id: 'hips', label: 'HIPS', slots: ['hip'] },
  { id: 'back', label: 'BACK', slots: ['cape'] },
  { id: 'weapon', label: 'WEAPON', slots: ['gunblade'] },
];
