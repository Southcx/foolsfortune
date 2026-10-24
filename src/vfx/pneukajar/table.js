// ---------------------------------------------------------------------------------------
// THE JAR'S LOOK, AS DATA (plain names: the owner, 2026-10-24: "go as hard as you can on customization, you can get weird with it"):
// what the Pneuka Jar can wear that the Courier cannot, slot by slot. The Jar always wears the vessel's own looks first (the kiln's
// glazes, region to part: vfx/pneukajar/dress.js); these are the Jar's alone, looks only, never a rule. Which are open, and how, is
// Dovina's (docs/handoffs/dovina/2026-10-24-from-calissa-jar.md proposes them); until she rules, the DEBUG save wears any with `/jar`.
// Labels are plain (CLARITY.md); Espada names them once the owner calls the Jar's look finalized.
//
//   lid      what closes its mouth: none (the owner's Jar), a cork, a lotus lid, a crown lid, a little roof, a teardrop stopper
//   handle   none, two ears, two rings, a dragon handle, a basket handle (wrapped in a cord the hair's colour)
//   shape    a vertex morph of the owner's mesh, never a replacement: as made, taller, squatter, a gourd waist, faceted, melon-lobed
//   foot     the foot ring: as made, scalloped, a gold ring, three claw feet, a lotus pedestal
//   pendant  what hangs off the choker on a cord the hair's colour: none, a bell, a moon, a fish, a d20 in the stones' mineral, a
//            cash coin, a gourd, a tassel (a pendant, never "a charm": a charm is the bracelet's, in a socket)
//   burst    what puffs from its foot when it hops and lands: motes (as made), a puff of the body glaze's dye, petals, sparks, bubbles
//            of its inner light, confetti in the seven feelings' colours
//
// Prior art: the potter's own vocabulary of a jar's parts (lid, knob, lug, ear, foot ring, shoulder; the lobed melon ewers of Goryeo
// celadon, the gourd-shaped Song vases, the tripod claws of a bronze ding, the lotus-petal lid of a Ming guan jar), Animal Crossing's and
// Splatoon's parts swapped on one body, and Spyro's and Ori's footfalls of colour.
//
//   JAR_LOOK[slot] = { label, options: { id: { label, line } } }   JAR_SLOTS   DEFAULT_JAR   validJar(look) -> a whole, valid look
// ---------------------------------------------------------------------------------------

const O = (label, line) => ({ label, line });

export const JAR_LOOK = {
  lid: { label: 'Lid', options: {
    none: O('None', 'Its mouth open, as the Prince made it.'),
    cork: O('Cork', 'A plain cork, a little proud of the lip.'),
    lotus: O('Lotus lid', 'Eight petals closed over the mouth, a bud for a knob.'),
    crown: O('Crown lid', 'A circlet of five points, each tipped with one of your stones.'),
    roof: O('Little roof', 'An eight-sided roof with upturned eaves and a finial, like a shrine on a shelf.'),
    teardrop: O('Teardrop stopper', 'A drop of solid Lachryma in the mouth, lit from inside as your stones are.'),
  } },
  handle: { label: 'Handles', options: {
    none: O('None', 'Smooth-sided.'),
    ears: O('Two ears', 'A loop at each shoulder, thrown with the body.'),
    rings: O('Two rings', 'A ring hung from a boss at each side, as on a bronze vessel.'),
    dragon: O('Dragon handle', 'A dragon climbing the back, its chin on the lip.'),
    basket: O('Basket handle', 'A hoop over the top, wrapped in a cord the colour of your hair.'),
  } },
  shape: { label: 'Shape', options: {
    owner: O('As made', 'The Prince\'s three swells, as thrown.'),
    tall: O('Taller', 'Drawn up on the wheel: a little taller, a little slimmer.'),
    squat: O('Squatter', 'Settled: lower and broader.'),
    gourd: O('Gourd waist', 'The swells fuller and the waists pinched in.'),
    faceted: O('Faceted', 'Cut with a knife while leather-hard: eleven flat sides.'),
    melon: O('Melon-lobed', 'Pressed into eleven lobes, like a melon.'),
  } },
  foot: { label: 'Foot', options: {
    plain: O('As made', 'A plain foot ring.'),
    scallop: O('Scalloped', 'The foot ring cut into scallops.'),
    gold: O('Gold ring', 'A ring of gold round the foot.'),
    claws: O('Claw feet', 'Three claws, as under a bronze tripod.'),
    lotus: O('Lotus pedestal', 'A ring of upturned petals to stand on.'),
  } },
  pendant: { label: 'Pendant', options: {
    none: O('None', 'Nothing hangs from the choker.'),
    bell: O('Bell', 'A little gold bell.'),
    moon: O('Moon', 'A crescent moon in the trim\'s glaze.'),
    fish: O('Fish', 'A fish in the mask\'s glaze.'),
    die: O('D20', 'A twenty-sided die cut from your stones.'),
    coin: O('Coin', 'A cash coin with a square hole, gold.'),
    gourd: O('Gourd', 'A little gourd in the body\'s glaze.'),
    tassel: O('Tassel', 'A tassel the colour of your hair.'),
  } },
  burst: { label: 'Hop burst', options: {
    motes: O('Motes', 'A ring of soft motes where it lands, as made.'),
    dye: O('Dye', 'A puff of the body glaze\'s colour.'),
    petals: O('Petals', 'Petals thrown up, drifting down.'),
    sparks: O('Sparks', 'Gold sparks off the foot.'),
    bubbles: O('Bubbles', 'Bubbles of its inner light, rising.'),
    confetti: O('Confetti', 'The seven feelings\' colours, thrown up.'),
  } },
};
export const JAR_SLOTS = Object.keys(JAR_LOOK);
/** The owner's Jar: what it wears until something else is chosen. */
export const DEFAULT_JAR = { lid: 'none', handle: 'none', shape: 'owner', foot: 'plain', pendant: 'none', burst: 'motes' };
/** A look made whole: each slot a known option, or the default. */
export const validJar = (look = {}) => Object.fromEntries(JAR_SLOTS.map((s) => [s, JAR_LOOK[s].options[look?.[s]] ? look[s] : DEFAULT_JAR[s]]));
