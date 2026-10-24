// ---------------------------------------------------------------------------------------
// THE GLAZES: what the Courier's vessel can be dressed in. The Courier is a vessel (Kaolin Anagami's magnum opus: docs/LORE.md), and
// they are decorated as a pot is: a GLAZE on each REGION of them (the armour of their body, its trim and stones, their mask, their hair), fired on
// at the kiln (courier/vessel/vessel.js, the kiln station: courier/moves/kiln.js). The Lachryma of their body is never glazed. Data only.
//
// The glazes are the real ones, after the potters' own families (each named for what it is): terracotta and bisque (what they are
// unglazed), shino's warm white, celadon's jade, tenmoku's iron black, oribe's copper green, raku's crackled white, oxblood (sang de
// boeuf), jun's moon blue, nuka's rice-husk ash, a copper lustre, and one black with the sheen of Lachryma itself; the medal glazes are the prized ones (hare's fur, oil
// spot, guan, kinrande, ru, yohen tenmoku: the hardest to fire), the shop's the honest everyday ones. Each is GOT a way:
//   start        theirs from the beginning
//   ach          earned: an achievement (achievements.js) gives it, so it is retroactive like they are
//   photo        learned: the Veritome learns a colour from a good photograph (vessel.js: learnFrom)
//   shop         bought at Saggar's kiln (plan A11)
//   debug        shown in the DEBUG save only: a look waiting for its rules (the new stones' minerals and skins, until Dovina rules them)
//
// Prior art: the glaze families of East Asian ceramics (shino, oribe, tenmoku, celadon, jun, raku, sang de boeuf), FFXIV's dyes and
// glamour (a look apart from power, a dye per channel), Splatoon's and Animal Crossing's colour-per-part, and the palette swap of the
// sprite era (the same body, a different colour for each of its parts).
//
//   REGIONS[id] = { id, name, kinds, shader }   GLAZES[id] = { id, name, kind, color, rough, metal, glow, blurb, got: { start | ach | photo | shop } }
//   (and, for the other kinds, color2, p, keep; a rare glaze's pattern and its colour2)   DEFAULT_LOOK = { body, trim, stones, mask, hair, skin }
// ---------------------------------------------------------------------------------------
// (each region takes finishes of its own kinds: glazes on the clay, gems in the settings, hair finishes or a glaze on the hair, and the
//  Lachryma of the skin its own tones; the shader each region wears is vfx/finish.js `shader`)
export const REGIONS = {
  body: { id: 'body', name: 'THE BODY', blurb: 'the armour of the vessel', kinds: ['glaze'], shader: 'glaze' },
  trim: { id: 'trim', name: 'THE TRIM', blurb: 'its inlays and edges', kinds: ['glaze'], shader: 'glaze' },
  stones: { id: 'stones', name: 'THE STONES', blurb: 'the gems set in it', kinds: ['gem'], shader: 'gem' },
  mask: { id: 'mask', name: 'THE MASK', blurb: 'the face it shows', kinds: ['glaze'], shader: 'glaze' },
  hair: { id: 'hair', name: 'THE HAIR', blurb: 'the crown of it', kinds: ['hair', 'glaze'], shader: 'hair' },
  skin: { id: 'skin', name: 'THE SKIN', blurb: 'the Lachryma it is filled with', kinds: ['skin'], shader: 'skin' },
};

const G = (id, name, color, rough, metal, blurb, got, glow = 0) => ({ id, name, kind: 'glaze', color, rough, metal, glow, blurb, got });
// a finish of another kind (vfx/finish.js): `color2` its second colour, `p` its four numbers (gem: facets, fire, play of colour, glow
// under the surface; hair: ombre, -, sheen, -; skin: inner light, rim, sheen 0 / 1 pearl / 2 aurora, translucency), `keep` the model's own look
const F = (kind, id, name, color, color2, rough, metal, p, blurb, got, keep = false) => ({ id, name, kind, color, color2, rough, metal, p, blurb, got, keep, glow: 0 });
// a skin with a pattern (vfx/skinpatterns.js): `look` = { pattern (1 flesh .. 19 moss), c3 its third colour (a natural tone's undertone,
// the specks, the second clay, the leaf), k its strength, w its frequency (per body height), bump (m), glow, aux }
const S = (id, name, color, color2, rough, metal, p, look, blurb, got) => ({ ...F('skin', id, name, color, color2, rough, metal, p, blurb, got), look });
// a natural tone: the colour, its undertone (lit through the thin edges, and the faintest mottle), how translucent, and its sheen at the
// rim (deep tones' cool, light tones' warm); open to everyone from the start
const N = (id, name, color, under, tl, sheen, rimK, blurb, freckles = 0) => S(id, name, color, sheen, 0.5, 0, [0, rimK, 0, tl], { pattern: 1, c3: under, w: freckles }, blurb, { start: true });
export const GLAZES = Object.fromEntries([
  G('terracotta', 'TERRACOTTA', 0xb4603f, 0.65, 0.05, 'Red earthenware, unglazed: what the Prince fired you in.', { start: true }),
  G('bisque', 'BISQUE', 0xf3c9a8, 0.4, 0, 'Fired once and left pale, the way a pot waits for its glaze. Lachryma shows through it.', { start: true }, 0.18),
  G('shino', 'SHINO', 0xe9dccb, 0.7, 0, 'A thick white feldspar glaze, pitted, with a blush of orange where it ran thin.', { start: true }),
  G('celadon', 'CELADON', 0x86ad93, 0.25, 0.02, 'Jade-green, from a little iron fired without air. The glaze of Mistress Saggar.', { ach: 'ac1' }),
  G('tenmoku', 'TENMOKU', 0x3a2418, 0.2, 0.25, 'Iron-black, rusting where it runs thin over an edge. Old Grog wears it, and has for a long time.', { ach: 'sp2' }),
  G('raku', 'RAKU', 0xeae3d6, 0.2, 0.35, 'Crackled white, pulled from the kiln red-hot and dropped in sawdust. Raku wears it, vainly.', { ach: 'sp3' }),
  G('oribe', 'ORIBE', 0x4f7a3a, 0.35, 0.05, 'Copper green, pooled dark in the hollows, as if left out in the rain on purpose.', { ach: 'vl1' }),
  G('oxblood', 'OXBLOOD', 0x8a1f1f, 0.25, 0.05, "Sang de boeuf: copper red, the hardest red to fire. Half the kiln's failures were meant to be this.", { ach: 'td1' }),
  G('jun', 'JUN', 0x7f9ccf, 0.3, 0.02, 'Moon blue, thick and opalescent, from a glaze that will not quite melt.', { ach: 'cl1' }),
  G('nuka', 'NUKA', 0xc7c0a8, 0.6, 0, 'Rice-husk ash: a milky, stony white. Humble, and it knows it.', { ach: 'br1' }),
  G('lustre', 'COPPER LUSTRE', 0xb87333, 0.3, 0.65, 'A film of copper smoked onto the glaze. It looks expensive. Raku says it is.', { ach: 'tu2' }),
  G('lachryma', 'LACHRYMA BLACK', 0x15101c, 0.15, 0.3, 'Black, with the sheen of oil on water. A lesser pot would go mad in it; you can bear it.', { ach: 'td6' }),
  // MEDAL GLAZES (plan A10): the prized ones, the hardest to fire, for mastery. Blurbs are placeholders for Espada's.
  G('haresfur', "HARE'S FUR", 0x5a3a24, 0.2, 0.3, 'Tenmoku drawn into fine gold-brown streaks as it runs, like the fur of a hare. Song potters raced to fire it.', { ach: 'c_braid_g' }),
  G('oilspot', 'OIL SPOT', 0x221a18, 0.18, 0.45, 'Black, scattered with silver spots where iron rose and bloomed in the fire, like oil drops on dark water.', { ach: 'c_mill_g' }),
  G('guan', 'GUAN', 0x9fb0a8, 0.3, 0.02, 'The official ware: grey-green, crazed all over with a fine dark net, the crackle fired in on purpose.', { ach: 'c_spindle_g' }),
  G('kinrande', 'KINRANDE', 0xa8281c, 0.28, 0.1, 'Gold brocade: leaf gold laid over red enamel and fired a last time, low and gentle. For a lamplighter.', { ach: 'tr4' }),
  G('ru', 'RU', 0x9cc0dc, 0.3, 0.02, 'The blue of the sky after rain. Fired for twenty years at one kiln for one court; fewer than a hundred pieces survive.', { ach: 'cx5' }),
  G('yohen', 'YOHEN TENMOKU', 0x141c36, 0.12, 0.4, 'Kiln-changed: black, with blue stars haloed in it, as if the night were trapped in the glaze. Three bowls in the world.', { ach: 'gr3' }, 0.08),
  // THE GREAT SLIP JELLY'S (Dovina's DROPS, progress/combat/greatjelly.js): opened by the achievement its drop completes. JELLY-CROWN is
  // a slip-green celadon dipped to the chest, stopping in the urn crown's broken lip over the jelly's wet slip (its kiln pattern the
  // dip, 7); EYE CUP is Attic black-figure, the red clay with the black (vfx/blackfigure.js WARE) and a staring eye on every part (the
  // eye, 6: vfx/eyecup.js). Blurbs are placeholders for Espada's.
  G('jellycrown', 'JELLY-CROWN', 0x8ab894, 0.1, 0.02, 'A slip-green celadon that pools thick and wet, as the crown sat in the jelly.', { ach: 'gj1' }),
  G('eyecup', 'EYE CUP', 0xc8643a, 0.42, 0.02, 'Black-figure: a staring eye on every part, the evil looked back at.', { ach: 'gj5' }),
  // THE FAREWELL GLAZES (the owner, 2026-10-22: a spirit's farewell leaves "a statue plus the glaze"; GARDEN-COZY.md, Dovina's gy17 to gy21):
  // one a feeling a bound spirit can have, kept after it has gone home, each a real glaze that reads as that feeling. Names and blurbs are
  // placeholders for Espada's.
  G('aventurine', 'AVENTURINE', 0x5a3418, 0.16, 0.2, 'Iron crystals grown in the cooling glaze, gold flecks deep in brown glass: the night a Wonder spirit went home by.', { ach: 'gy17' }),
  G('crystalline', 'CRYSTALLINE', 0x4aa8a4, 0.14, 0.04, 'Zinc crystals that bloomed in the kiln as it cooled, white flowers on blue: a Mirth spirit\'s laugh, set.', { ach: 'gy18' }),
  G('peachbloom', 'PEACHBLOOM', 0xd8846e, 0.22, 0.02, 'Copper red blushing pink, with moss-green where it ran thin: the court\'s rarest red, kept for a Desire spirit.', { ach: 'gy19' }),
  G('bidoro', 'BIDORO', 0x56705c, 0.12, 0.04, 'Wood ash melted to green glass in the fire and run down the pot in beads: what a Grief spirit left on you.', { ach: 'gy20' }),
  G('kuroraku', 'KURO RAKU', 0x15100e, 0.38, 0.06, 'Black raku, pulled from the kiln glowing, crazed with old red where it cooled: a Dread spirit, kept quiet.', { ach: 'gy21' }),
  // SHOP GLAZES (plan A11): honest everyday glazes, bought at Saggar's kiln (price: ECON.goods.glaze). Blurbs are placeholders for Espada's.
  G('ash', 'NATURAL ASH', 0x7d7a4a, 0.45, 0.02, 'No glaze at all: wood ash fell on the pot in the kiln and melted, running green down one side.', { shop: true }),
  G('kaki', 'KAKI', 0xa0522d, 0.4, 0.05, 'Persimmon: a rust-red iron glaze, matte as the fruit. A farmhouse colour.', { shop: true }),
  G('ame', 'AME', 0x9a5a1e, 0.18, 0.08, 'Amber, glossy as boiled sugar: an iron glaze fired with plenty of air.', { shop: true }),
  G('cobalt', 'COBALT', 0x2a4a9a, 0.22, 0.03, 'The blue of blue-and-white: cobalt under a clear glaze, carried by traders from Persia to every port.', { shop: true }),
  G('majolica', 'MAJOLICA', 0xf5efe2, 0.3, 0, 'A white tin glaze, opaque and bright, made to look like porcelain by potters who had none.', { shop: true }),
  G('salt', 'SALT GLAZE', 0x9c7a52, 0.5, 0.05, 'Salt thrown into the hot kiln: it turns to glass on the pot, pitted like orange peel.', { shop: true }),
  // GEMS for the stones (real gemstones, with their real optics: fire is dispersion, play is opal's, glow is moonstone's adularescence).
  // All owned for now (playtest); Dovina decides which are earned and which bought. Blurbs are placeholders for Espada's.
  F('gem', 'maker', "THE MAKER'S STONES", 0xffffff, 0xffffff, 0.3, 0, [0, 0, 0, 0], 'The stones you were set with: the Prince chose them.', { start: true }, true),
  F('gem', 'ruby', 'RUBY', 0xc0102a, 0xff6070, 0.05, 0, [2.6, 0.5, 0, 0], 'Corundum stained red by a trace of chromium; it glows red even in ultraviolet.', { start: true }),
  F('gem', 'sapphire', 'SAPPHIRE', 0x1a3aa8, 0x6a8aff, 0.05, 0, [2.6, 0.5, 0, 0], 'The same stone as ruby, blue with iron and titanium.', { start: true }),
  F('gem', 'emerald', 'EMERALD', 0x0f8a4a, 0x60e0a0, 0.06, 0, [2.2, 0.3, 0, 0], 'Green beryl, almost never without its inclusions: the jardin, the garden inside it.', { start: true }),
  F('gem', 'amethyst', 'AMETHYST', 0x7a3ab8, 0xc090ff, 0.05, 0, [2.6, 0.4, 0, 0], 'Purple quartz; the Greeks thought it kept you sober.', { start: true }),
  F('gem', 'citrine', 'CITRINE', 0xe8a020, 0xffe080, 0.05, 0, [2.6, 0.4, 0, 0], 'Yellow quartz, the colour of honey held to the light.', { start: true }),
  F('gem', 'diamond', 'DIAMOND', 0xe8eef8, 0xffffff, 0.02, 0, [3.2, 1.0, 0, 0], 'Clear, and full of fire: it splits white light into colours more than any other stone.', { start: true }),
  F('gem', 'opal', 'OPAL', 0xdcd8e8, 0x90c0ff, 0.15, 0, [1.4, 0.2, 0.3, 0], 'Silica spheres stacked like oranges, small enough to break the light into flashes of every colour.', { start: true }),
  F('gem', 'moonstone', 'MOONSTONE', 0xe0e4ee, 0x6a9aff, 0.12, 0, [1.2, 0.1, 0, 1.0], 'Feldspar in fine layers; a blue light seems to float just under its surface.', { start: true }),
  F('gem', 'onyx', 'ONYX', 0x0c0a0e, 0x403848, 0.08, 0.1, [2.0, 0.1, 0, 0], 'Black chalcedony, polished to a mirror.', { start: true }),
  // THE NEW MINERALS (the owner, 2026-10-24: "more pneuka stones"; Calissa's looks, vfx/stoneminerals.js): shown in the DEBUG save only
  // (`debug`) until Dovina rules each one's trade and how it is got (progress/stones.js; worn before then, a stone the rules do not know
  // is the Maker's). Names and blurbs are placeholders for Espada's.
  F('gem', 'labradorite', 'LABRADORITE', 0x262c32, 0x4a8aff, 0.08, 0, [1.4, 0.1, 0, 0], 'Grey feldspar until it is turned: then a flash of blue, green or gold comes up out of it. The house knows this one.', { start: true }),
  F('gem', 'sheenobsidian', 'OBSIDIAN', 0x0a080c, 0xd8b060, 0.03, 0.05, [2.0, 0.05, 0, 0], 'Volcanic glass, cooled too fast to crystallise; a gold sheen rides across it where bubbles lined up.', { start: true }),
  F('gem', 'malachite', 'MALACHITE', 0x0e6a3a, 0x40c080, 0.12, 0, [1.0, 0, 0, 0], 'Copper ore in rings of dark and pale green, like the grain of a green tree.', { start: true }),
  F('gem', 'lapis', 'LAPIS LAZULI', 0x1c2a8a, 0xe0b850, 0.25, 0, [1.0, 0, 0, 0], 'Deep blue rock with white clouds of calcite and gold flecks of pyrite. Ground up, it was ultramarine.', { start: true }),
  F('gem', 'garnet', 'GARNET', 0x7a0a1a, 0xd02838, 0.04, 0, [2.6, 0.3, 0, 0], 'So deep a red it is nearly black, until light comes back out of its edges.', { start: true }),
  F('gem', 'rosequartz', 'ROSE QUARTZ', 0xe8a8b8, 0xffc0d0, 0.15, 0, [1.6, 0.1, 0, 0.2], 'Quartz clouded pink with fine fibres: milky, never quite clear.', { start: true }),
  F('gem', 'tigerseye', "TIGER'S EYE", 0xc08a2a, 0xffd070, 0.1, 0, [1.0, 0, 0, 0], 'Quartz grown over golden fibres; a line of light rolls across it as you turn it, like a cat\'s eye.', { start: true }),
  // HAIR finishes (the hair can still take any glaze as well)
  F('hair', 'satin', 'SATIN', 0xe8d8bc, 0xe8d8bc, 0.45, 0, [0, 1, 0, 0], 'Pale and soft, with a sheen that slides as you turn.', { start: true }),
  F('hair', 'raven', 'RAVEN', 0x101420, 0x101420, 0.3, 0.05, [0, 1, 0, 0], 'Blue-black, with a blue light along it like a crow\'s wing.', { start: true }),
  F('hair', 'copper', 'COPPER', 0xa04a20, 0xa04a20, 0.35, 0.2, [0, 1, 0, 0], 'Red as a new penny, brightest where the light runs along it.', { start: true }),
  F('hair', 'ashen', 'ASHEN', 0x9a9690, 0x9a9690, 0.55, 0, [0, 1, 0, 0], 'The grey of wood ash, no sheen to speak of.', { start: true }),
  F('hair', 'inkgold', 'INK TO GOLD', 0x14101c, 0xd8a840, 0.35, 0.15, [1, 1, 0, 0], 'Ink at the root, run to gold at the tips: dipped, the way a brush is.', { start: true }),
  F('hair', 'clayrose', 'BISQUE TO ROSE', 0xf3c9a8, 0xd06080, 0.45, 0, [1, 1, 0, 0], 'Pale at the root and flushed at the tips.', { start: true }),
  F('hair', 'slick', 'OIL SLICK', 0x18121e, 0x18121e, 0.2, 0.1, [0, 1, 1, 0], 'Black, with every colour of oil on water sliding through it.', { start: true }),
  // SKIN tones for the Lachryma of the body
  F('skin', 'lachryma', 'LACHRYMA', 0xffffff, 0xffffff, 0.4, 0, [0, 0, 0, 0], 'What you are filled with, as you were filled.', { start: true }, true),
  F('skin', 'moonlight', 'MOONLIGHT', 0xdfe6f2, 0x7aa0ff, 0.35, 0, [0.5, 0.6, 0, 0], 'Cool and pale, lit blue from inside.', { start: true }),
  F('skin', 'ember', 'EMBER', 0xf2c8a0, 0xff7a30, 0.4, 0, [0.6, 0.7, 0, 0], 'Warm, with a coal\'s glow under it.', { start: true }),
  S('porcelain', 'PORCELAIN', 0xf2f5f8, 0xd8e8ff, 0.18, 0, [0.1, 0.35, 0, 0.75], { pattern: 2, c3: 0xfff0dc, bump: 0.0002 }, 'Blue-white and translucent, the glaze pooled blue at every turn, warm where light comes through: the Court\'s own.', { start: true }),
  F('skin', 'obsidian', 'OBSIDIAN', 0x16121c, 0x9a60ff, 0.2, 0.05, [0.3, 0.8, 0, 0], 'Dark glass, with violet at the edges.', { start: true }),
  F('skin', 'pearl', 'PEARL', 0xf2ece8, 0xffe8f0, 0.3, 0, [0.3, 0.4, 1, 0], 'Nacre: layer on layer, catching the light pink and blue.', { start: true }),
  F('skin', 'aurora', 'AURORA', 0xe8eef2, 0x80ffd0, 0.3, 0, [0.4, 0.5, 2, 0], 'Every colour of the polar sky, moving at the edges of you.', { start: true }),
  // NATURAL TONES (Calissa, 2026-10-24): the human range, warm to cool and light to deep, each with its own undertone and translucency.
  // Open to all. Blurbs are placeholders for Espada's.
  N('toneivory', 'IVORY', 0xf6e1d3, 0xf09a8a, 0.55, 0xfff2ee, 0.08, 'Very fair, cool and pink beneath; the light comes through it rosy.'),
  N('toneshell', 'SHELL', 0xf0cdb6, 0xff8a78, 0.5, 0xfff0e8, 0.08, 'Fair, with a pink warmth under it.'),
  N('tonepeach', 'PEACH', 0xeebd98, 0xff8a5a, 0.5, 0xfff0e0, 0.08, 'Fair and warm, golden-pink at the edges.'),
  N('tonefreckled', 'FRECKLED', 0xf0c4a4, 0xff8a66, 0.5, 0xfff0e4, 0.08, 'Fair and warm, freckled across the shoulders and the face.', 40),
  N('tonesand', 'SAND', 0xdcb48e, 0xf09060, 0.45, 0xfff0dc, 0.1, 'Light to medium, neutral: neither pink nor gold beneath.'),
  N('toneolive', 'OLIVE', 0xc79c72, 0xc89a50, 0.42, 0xf0f0d8, 0.1, 'Medium, with a green-gold under it that warms in the sun.'),
  N('tonehoney', 'HONEY', 0xd19a64, 0xf08840, 0.42, 0xfff0d8, 0.1, 'Medium and golden, like honey held to the light.'),
  N('toneamber', 'AMBER', 0xb07a4c, 0xd06a38, 0.38, 0xf8e8d8, 0.12, 'Tan and warm, a little red where it is thin.'),
  N('tonechestnut', 'CHESTNUT', 0x8f5a3a, 0xb04a30, 0.34, 0xe8e0e0, 0.14, 'Brown with a red undertone, glowing at the edges.'),
  N('toneumber', 'UMBER', 0x6f4630, 0x8a4a30, 0.3, 0xd8dce4, 0.16, 'Deep brown, neutral and even.'),
  N('tonemahogany', 'MAHOGANY', 0x5e3426, 0x8a2e22, 0.3, 0xd0d8e8, 0.18, 'Deep and red-brown, like polished wood.'),
  N('tonesable', 'SABLE', 0x3f2a22, 0x6a2a30, 0.26, 0xc0cce0, 0.2, 'Very deep and cool, plum beneath, with a blue sheen where the light slides off.'),
  N('toneebony', 'EBONY', 0x2e1e18, 0x5a2420, 0.24, 0xb8c8e0, 0.22, 'The deepest brown, near black, with a cool sheen at the edges.'),
  // CLAY BODIES (Calissa, 2026-10-24): the potter's own, the vessel as it would be without its glaze. Shown in the DEBUG save until
  // Dovina rules how each is got (docs/handoffs/dovina/2026-10-24-from-calissa-skins.md). Blurbs are placeholders for Espada's.
  S('bisquebody', 'BISQUE BODY', 0xf1dcc4, 0xffffff, 0.98, 0, [0, 0, 0, 0.15], { pattern: 3, c3: 0xc9b49a, k: 0.35, w: 22, bump: 0.0006 }, 'Fired once and never glazed: chalky, dry, a little rough to the eye.', { debug: true }),
  S('terracottabody', 'TERRACOTTA BODY', 0xb35a38, 0xffffff, 0.9, 0, [0, 0, 0, 0.05], { pattern: 3, c3: 0xe2c08a, k: 0.4, w: 16, bump: 0.0008 }, 'Red earthenware, flecked with the pale grog it was wedged with.', { debug: true }),
  S('stoneware', 'STONEWARE', 0xc9b79a, 0xffffff, 0.55, 0, [0, 0, 0, 0], { pattern: 3, c3: 0x3a2416, k: 0.3, w: 14, bump: 0.0004, aux: 1 }, 'Toasted buff, speckled with iron that bled into the body in the heat.', { debug: true }),
  S('rakubody', 'RAKU BODY', 0xe6ddcf, 0xffffff, 0.3, 0, [0, 0, 0, 0], { pattern: 5, c3: 0x0c0a0a, k: 0.8, w: 7, bump: 0.0006, aux: 1 }, 'Pulled red-hot from the kiln and smothered in sawdust: crackled white, smoke in every crack, copper where the fire caught.', { debug: true }),
  S('sigillata', 'TERRA SIGILLATA', 0xa8492a, 0xffffff, 0.3, 0, [0, 0, 0, 0], { pattern: 4, c3: 0x3a1a10, k: 0.5, bump: 0.0002 }, 'The finest slip, burnished with a stone until it shines; the fire left a dark flash across it.', { debug: true }),
  S('celadonbody', 'CELADON BODY', 0x9cc0a4, 0xc8f0d8, 0.15, 0, [0.1, 0.3, 0, 0.5], { pattern: 6, c3: 0xc8e0a0, w: 9, aux: 0.6, bump: 0.0004 }, 'Jade all the way through, deeper where it lies thick, finely crazed.', { debug: true }),
  S('agateware', 'AGATEWARE', 0xe8d4b8, 0xffffff, 0.35, 0, [0, 0, 0, 0], { pattern: 7, c3: 0x7a4028, w: 3.5, bump: 0.0002 }, 'Two clays, pale and red, wedged together and swirled like agate.', { debug: true }),
  S('bluemarble', 'BLUE AGATEWARE', 0xf0ece4, 0xffffff, 0.3, 0, [0, 0, 0, 0], { pattern: 7, c3: 0x2a4a9a, w: 4.5, bump: 0.0002 }, 'White clay and cobalt-stained clay swirled together.', { debug: true }),
  // STRANGE BODIES (Calissa, 2026-10-24): shown in the DEBUG save until Dovina rules them. Blurbs are placeholders for Espada's.
  S('nacre', 'MOTHER-OF-PEARL', 0xece8e2, 0xf0f4ff, 0.2, 0, [0.1, 0.25, 0, 0.2], { pattern: 8, k: 1, w: 5, bump: 0.0002 }, 'The inside of a shell: wavy layers, every colour sliding over them as you turn.', { debug: true }),
  S('verdigris', 'BRONZE AND VERDIGRIS', 0x9a6a38, 0xffffff, 0.35, 0.85, [0, 0, 0, 0], { pattern: 9, c3: 0x4a9a80, k: 0.5, bump: 0.0008 }, 'A bronze left out for a hundred years, crusted green where the rain ran and lay.', { debug: true }),
  S('woodgrain', 'POLISHED WOOD', 0xa8643a, 0xffffff, 0.35, 0, [0, 0, 0, 0], { pattern: 10, c3: 0x5a2a14, k: 0.9, w: 15, bump: 0.0003 }, 'Carved from one trunk and oiled: the rings run round you.', { debug: true }),
  S('birch', 'PALE WOOD', 0xe0c49a, 0xffffff, 0.4, 0, [0, 0, 0, 0], { pattern: 10, c3: 0xa87c50, k: 0.7, w: 20, bump: 0.0002 }, 'A pale close-grained wood, waxed.', { debug: true }),
  S('inkwash', 'INK WASH', 0xeee6d6, 0xffffff, 0.95, 0, [0, 0, 0, 0], { pattern: 11, c3: 0x14141c, k: 1, w: 3.5 }, 'Painted in sumi on paper: washes laid one under another, the ink pooled dark in every hollow.', { debug: true }),
  S('starfield', 'STARFIELD', 0x05060f, 0x6a4ac0, 0.25, 0, [0, 0.4, 0, 0], { pattern: 12, c3: 0x1a3a8a, k: 1 }, 'A night sky inside you, the stars deep under the surface, moving as you do.', { debug: true }),
  S('nebula', 'NEBULA', 0x0a0512, 0xff6ab0, 0.25, 0, [0, 0.35, 0, 0], { pattern: 12, c3: 0x6a2ac0, k: 2.2 }, 'A nebula in rose and violet, with stars being born in it.', { debug: true }),
  S('stainedglass', 'STAINED GLASS', 0x1a1a1e, 0xffffff, 0.1, 0, [0, 0, 0, 0], { pattern: 13, c3: 0xffffff, k: 1, w: 9, bump: 0.0008 }, 'Leaded panes of ruby, cobalt, amber and green, lit from inside like a window at night.', { debug: true }),
  S('sliptrail', 'SLIP-TRAILED', 0x5a2a18, 0xffffff, 0.25, 0, [0, 0, 0, 0], { pattern: 14, c3: 0xe8c890, w: 7, bump: 0.0012 }, 'Dark red clay, trailed over with raised lines of cream slip and glazed honey, as the old slipware was.', { debug: true }),
  S('lachrymalit', 'LACHRYMA-LIT', 0x0c0a12, 0x6a4ac0, 0.2, 0, [0, 0.15, 0, 0], { pattern: 15, c3: 0x2a2440, k: 1 }, 'Dark, until it turns: then the film of Lachryma flashes up under it, violet to gold.', { debug: true }),
  S('goldleaf', 'GOLD LEAF', 0xa85a3a, 0xffffff, 0.8, 0, [0, 0, 0, 0], { pattern: 16, c3: 0xe8b850, w: 4, bump: 0.0003 }, 'Leaf gold laid over the red clay and flaking off it.', { debug: true }),
  S('kintsugibody', 'KINTSUGI BODY', 0xd8cfc0, 0xffffff, 0.4, 0, [0, 0, 0, 0], { pattern: 17, c3: 0xe0b048, w: 4.5, bump: 0.0008 }, 'Broken once, and mended in gold: every crack already filled.', { debug: true }),
  S('molten', 'MOLTEN', 0x1a1210, 0xffffff, 0.9, 0, [0, 0, 0, 0], { pattern: 18, c3: 0xff6a1a, w: 5, glow: 1, bump: 0.0008 }, 'A crust gone black, and the fire still showing through the cracks.', { debug: true }),
  S('moss', 'MOSS AND LICHEN', 0x8a8a80, 0xffffff, 0.95, 0, [0, 0, 0, 0], { pattern: 19, c3: 0xb4bc98, k: 0.5, w: 11, bump: 0.0015 }, 'An old stone in a wood: lichen in rings, moss in the places that face the sky.', { debug: true }),
].map((g) => [g.id, g]));
// the rare glazes' kiln patterns (vfx/finish.js PATTERN: 1 stars, 2 spots, 3 streaks, 4 crackle, 5 leaf, 6 the eye, 7 the dip) and the colour
// each is drawn in (the eye's: the black; the dip's: the jelly's wet slip under the lip, vfx/foelook.js)
const PATTERNS = { yohen: [1, 0x46b4ff], oilspot: [2, 0xc4c8d0], haresfur: [3, 0xc08a48], guan: [4, 0x2c2622], raku: [4, 0x3a3634], ru: [4, 0x7890a0], kinrande: [5, 0xe8b850], eyecup: [6, 0x1c1410], jellycrown: [7, 0x7a5434],
  aventurine: [1, 0xe8b850], crystalline: [2, 0xf2f0e0], peachbloom: [2, 0x6a9a6a], bidoro: [3, 0x9ad4b4], kuroraku: [4, 0x6a1e22] }; // (the farewell glazes': the stars gold, the spots their flowers and moss, the streaks the tears, the crackle old red)
for (const [id, [pattern, color2]] of Object.entries(PATTERNS)) Object.assign(GLAZES[id], { pattern, color2 });

/** How they are dressed until they fire anything else: as they were made. */
export const DEFAULT_LOOK = { body: 'terracotta', trim: 'bisque', stones: 'maker', mask: 'terracotta', hair: 'bisque', skin: 'lachryma' };
